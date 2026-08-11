/**
 * Testes das migrations de rastreamento.
 *
 * Roda um Postgres de verdade em WASM (PGlite), sem Docker e sem tocar no
 * projeto do Supabase: aplica as três migrations num banco em memória e
 * verifica geração de código, histórico, auditoria, a consulta pública e,
 * principalmente, as políticas de RLS.
 *
 *   npm run test:db
 */
import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const MIG = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations') + '/'
const db = new PGlite()

let ok = 0
let fail = 0
function check(nome, cond, extra = '') {
  if (cond) {
    ok++
    console.log(`  PASS  ${nome}`)
  } else {
    fail++
    console.log(`  FALHA ${nome} ${extra}`)
  }
}
async function esperaErro(nome, fn, trecho) {
  try {
    await fn()
    fail++
    console.log(`  FALHA ${nome} — deveria ter dado erro`)
  } catch (e) {
    const bate = !trecho || e.message.includes(trecho)
    check(nome + ' (erro esperado)', bate, `→ ${e.message}`)
  }
}

// ---------------------------------------------------------------- shims
// PGlite não é o Supabase: precisa do schema auth, de auth.uid() e dos
// papéis anon/authenticated para as policies fazerem sentido.
await db.exec(`
  create schema if not exists auth;
  create table auth.users (id uuid primary key, email text unique);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('app.test_uid', true), '')::uuid
  $$;
  do $$ begin
    if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
    if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  end $$;
  grant usage on schema public to anon, authenticated;
  -- Reproduz o default privilege que todo projeto Supabase traz de fábrica:
  -- função nova em public já nasce executável por anon. É exatamente isso
  -- que a migration 04 precisa desfazer.
  alter default privileges in schema public grant execute on functions to anon, authenticated;
  insert into auth.users values
    ('11111111-1111-1111-1111-111111111111', 'arnaldo@guinhatransportes.com.br'),
    ('22222222-2222-2222-2222-222222222222', 'intruso@exemplo.com');
`)

console.log('\n== migrations ==')
for (const f of [
  '20260810120000_rastreamento_schema.sql',
  '20260810120100_rastreamento_rls.sql',
  '20260810120200_rastreamento_rpc.sql',
  '20260810120300_rastreamento_grants.sql',
]) {
  await db.exec(readFileSync(MIG + f, 'utf8'))
  console.log(`  PASS  aplicou ${f}`)
  ok++
}

const uid = (u) => db.exec(`select set_config('app.test_uid', '${u ?? ''}', false);`)
await uid('11111111-1111-1111-1111-111111111111')
await db.exec(`insert into public.perfis_admin (user_id, nome, papel) values
  ('11111111-1111-1111-1111-111111111111', 'Arnaldo', 'gestor');`)

console.log('\n== geração de código ==')
const r1 = await db.query(
  `insert into public.rastreamentos (cliente_nome, origem, destino, previsao_entrega)
   values ('Descarpack', 'São Paulo - SP', 'Campinas - SP', current_date + 2)
   returning id, codigo_rastreio, status_atual`,
)
const ano = new Date().getFullYear()
const cod1 = r1.rows[0].codigo_rastreio
check(`primeiro código = GUI-${ano}-000001`, cod1 === `GUI-${ano}-000001`, `→ ${cod1}`)

const r2 = await db.query(
  `insert into public.rastreamentos (cliente_nome, origem, destino)
   values ('Cirúrgica KD', 'Carapicuíba - SP', 'Joinville - SC') returning id, codigo_rastreio`,
)
check(`segundo código = GUI-${ano}-000002`, r2.rows[0].codigo_rastreio === `GUI-${ano}-000002`, `→ ${r2.rows[0].codigo_rastreio}`)

await esperaErro(
  'código duplicado é rejeitado',
  () =>
    db.query(
      `insert into public.rastreamentos (cliente_nome, origem, destino, codigo_rastreio)
       values ('Clone', 'A', 'B', '${cod1}')`,
    ),
  'duplicate key',
)

await esperaErro(
  'código fora do formato é rejeitado',
  () =>
    db.query(
      `insert into public.rastreamentos (cliente_nome, origem, destino, codigo_rastreio)
       values ('Formato', 'A', 'B', 'ABC-123')`,
    ),
  'rastreamentos_codigo_formato',
)

// pula um número na sequência e confirma que não colide
await db.query(
  `insert into public.rastreamentos (cliente_nome, origem, destino, codigo_rastreio)
   values ('Migrado', 'A', 'B', 'GUI-${ano}-000003')`,
)
const r4 = await db.query(
  `insert into public.rastreamentos (cliente_nome, origem, destino)
   values ('Depois', 'A', 'B') returning codigo_rastreio`,
)
check(
  'gerador pula código já ocupado manualmente',
  r4.rows[0].codigo_rastreio === `GUI-${ano}-000004`,
  `→ ${r4.rows[0].codigo_rastreio}`,
)

const id1 = r1.rows[0].id

console.log('\n== evento automático na criação ==')
const ev0 = await db.query(`select status, descricao from public.rastreamento_eventos where rastreamento_id = $1`, [id1])
check('criação gera 1 evento', ev0.rows.length === 1, `→ ${ev0.rows.length}`)
check('evento inicial tem o status inicial', ev0.rows[0]?.status === 'recebida')

console.log('\n== atualização de status ==')
await db.query(`select public.atualizar_status_rastreamento($1, 'em_conferencia', 'Conferência ok.', 'Carapicuíba - SP', now() - interval '3 hours', true)`, [id1])
await db.query(`select public.atualizar_status_rastreamento($1, 'coletada', 'Coletada no remetente.', 'São Paulo - SP', now() - interval '2 hours', true)`, [id1])
const res = await db.query(`select public.atualizar_status_rastreamento($1, 'em_transporte', 'Em rota.', 'Anhanguera km 45', now() - interval '1 hour', true) as r`, [id1])

const evs = await db.query(
  `select status, descricao, localizacao from public.rastreamento_eventos where rastreamento_id = $1 order by data_evento`,
  [id1],
)
check('histórico acumula 4 eventos (nada foi apagado)', evs.rows.length === 4, `→ ${evs.rows.length}`)
check('sem evento duplicado na mudança de status', evs.rows.filter((e) => e.status === 'em_transporte').length === 1)
const evTransporte = evs.rows.find((e) => e.status === 'em_transporte')
check('evento guarda local e descrição', evTransporte?.localizacao === 'Anhanguera km 45' && evTransporte?.descricao === 'Em rota.', JSON.stringify(evTransporte))

const rr = await db.query(`select status_atual, atualizado_por, updated_at from public.rastreamentos where id = $1`, [id1])
check('status_atual moveu para em_transporte', rr.rows[0].status_atual === 'em_transporte')
check('atualizado_por registrado', rr.rows[0].atualizado_por === '11111111-1111-1111-1111-111111111111')
check('RPC devolve status anterior', res.rows[0].r.status_anterior === 'coletada', JSON.stringify(res.rows[0].r))

console.log('\n== auditoria ==')
const aud = await db.query(
  `select acao, status_anterior, status_novo, alterado_por from public.rastreamento_auditoria
   where rastreamento_id = $1 order by alterado_em, id`,
  [id1],
)
check('auditoria: criação + 3 mudanças', aud.rows.length === 4, `→ ${aud.rows.length}`)
check('auditoria registra transição coletada → em_transporte',
  aud.rows.some((a) => a.status_anterior === 'coletada' && a.status_novo === 'em_transporte'))
check('auditoria registra o autor', aud.rows.every((a) => a.alterado_por === '11111111-1111-1111-1111-111111111111'))

console.log('\n== histórico é append-only ==')
await esperaErro('delete de evento é bloqueado', () => db.query(`delete from public.rastreamento_eventos where rastreamento_id = $1`, [id1]), 'não pode ser apagado')
check('código não pode ser trocado depois de emitido',
  (await db.query(`update public.rastreamentos set codigo_rastreio = 'GUI-2099-999999' where id = $1 returning codigo_rastreio`, [id1])).rows[0].codigo_rastreio === cod1)

console.log('\n== consulta pública ==')
const pub = (await db.query(`select public.rastrear_carga($1) as r`, [cod1])).rows[0].r
check('encontrado', pub.encontrado === true && pub.ativo === true)
check('devolve os 7 campos públicos e nada mais',
  JSON.stringify(Object.keys(pub.rastreamento).sort()) ===
    JSON.stringify(['codigo_rastreio','destino','observacao_publica','origem','previsao_entrega','status_atual','ultima_atualizacao']),
  `→ ${Object.keys(pub.rastreamento).sort().join(',')}`)
check('não vaza cliente/motorista/placa/coordenadas/observação interna',
  !JSON.stringify(pub).match(/cliente|motorista|placa|latitude|longitude|interna|criado_por/i))
check('histórico público veio junto', pub.eventos.length === 4)
check('eventos em ordem cronológica',
  pub.eventos.map((e) => e.data_evento).join() === [...pub.eventos].sort((a,b)=>a.data_evento.localeCompare(b.data_evento)).map(e=>e.data_evento).join())

check('busca é case-insensitive e tolera espaço',
  (await db.query(`select public.rastrear_carga($1) as r`, [`  ${cod1.toLowerCase()} `])).rows[0].r.encontrado === true)

const naoExiste = (await db.query(`select public.rastrear_carga('GUI-2026-999999') as r`)).rows[0].r
check('código inexistente → encontrado:false', naoExiste.encontrado === false && Object.keys(naoExiste).length === 1)

const lixo = (await db.query(`select public.rastrear_carga('robô'' or 1=1--') as r`)).rows[0].r
check('entrada malformada não vaza nada', lixo.encontrado === false)

console.log('\n== evento interno não aparece para o cliente ==')
await db.query(`select public.atualizar_status_rastreamento($1, 'em_transporte', 'Motorista trocou por escala.', 'Base', now(), false)`, [id1])
const pub2 = (await db.query(`select public.rastrear_carga($1) as r`, [cod1])).rows[0].r
check('evento marcado como interno fica fora da consulta pública', pub2.eventos.length === 4, `→ ${pub2.eventos.length}`)
check('mas está no histórico interno',
  (await db.query(`select count(*)::int c from public.rastreamento_eventos where rastreamento_id = $1`, [id1])).rows[0].c === 5)

console.log('\n== rastreamento inativo ==')
await db.query(`update public.rastreamentos set ativo = false where id = $1`, [id1])
const inativo = (await db.query(`select public.rastrear_carga($1) as r`, [cod1])).rows[0].r
check('inativo → encontrado:true, ativo:false, sem dados', inativo.encontrado === true && inativo.ativo === false && !inativo.rastreamento)
await db.query(`update public.rastreamentos set ativo = true where id = $1`, [id1])

console.log('\n== indicadores ==')
const ind = (await db.query(`select public.rastreamento_indicadores() as i`)).rows[0].i
check('total = 4 rastreamentos', ind.total === 4, JSON.stringify(ind))
check('em_transporte = 1', ind.em_transporte === 1)
check('aguardando (recebida + conferência) = 3', ind.aguardando === 3, JSON.stringify(ind))

console.log('\n== RLS ==')
await db.exec(`grant usage on schema auth to anon, authenticated; grant select on auth.users to anon, authenticated;`)

// público anônimo
await db.exec(`set role anon;`)
await esperaErro('anon não lê rastreamentos', () => db.query(`select * from public.rastreamentos`), 'permission denied')
await esperaErro('anon não lê eventos', () => db.query(`select * from public.rastreamento_eventos`), 'permission denied')
await esperaErro('anon não lê auditoria', () => db.query(`select * from public.rastreamento_auditoria`), 'permission denied')
await esperaErro('anon não lê perfis_admin', () => db.query(`select * from public.perfis_admin`), 'permission denied')
await esperaErro('anon não insere rastreamento', () => db.query(`insert into public.rastreamentos (cliente_nome, origem, destino) values ('x','y','z')`), 'permission denied')
check('anon CONSEGUE usar a consulta pública',
  (await db.query(`select public.rastrear_carga($1) as r`, [cod1])).rows[0].r.encontrado === true)

// Endpoints RPC: o Supabase publica em /rest/v1/rpc toda função executável.
// Só rastrear_carga pode estar aberta ao público.
await esperaErro('anon não gera código (queimaria a sequência)',
  () => db.query(`select public.gerar_codigo_rastreio()`), 'permission denied')
await esperaErro('anon não consulta indicadores',
  () => db.query(`select public.rastreamento_indicadores()`), 'permission denied')
await esperaErro('anon não chama atualizar_status',
  () => db.query(`select public.atualizar_status_rastreamento($1,'entregue')`, [id1]), 'permission denied')
await esperaErro('anon não chama is_admin',
  () => db.query(`select public.is_admin_rastreamento()`), 'permission denied')
// O Postgres recusa função de trigger com mensagem própria, antes mesmo de
// olhar o privilégio — as duas recusas servem.
await esperaErro('anon não chama função de trigger',
  () => db.query(`select public.rastreamentos_touch()`), 'can only be called as triggers')
await db.exec(`reset role;`)

// autenticado sem perfil de admin
await uid('22222222-2222-2222-2222-222222222222')
await db.exec(`set role authenticated;`)
check('usuário sem perfil admin enxerga 0 rastreamentos',
  (await db.query(`select count(*)::int c from public.rastreamentos`)).rows[0].c === 0)
check('usuário sem perfil admin enxerga 0 eventos',
  (await db.query(`select count(*)::int c from public.rastreamento_eventos`)).rows[0].c === 0)
check('usuário sem perfil admin enxerga 0 na auditoria',
  (await db.query(`select count(*)::int c from public.rastreamento_auditoria`)).rows[0].c === 0)
await esperaErro('usuário sem perfil admin não insere', () => db.query(`insert into public.rastreamentos (cliente_nome, origem, destino) values ('x','y','z')`), 'row-level security')
await esperaErro('usuário sem perfil admin não muda status', () => db.query(`select public.atualizar_status_rastreamento($1,'entregue')`, [id1]), 'Acesso negado')
check('indicadores devolvem zero para não-admin',
  (await db.query(`select public.rastreamento_indicadores() as i`)).rows[0].i.total === 0)
await esperaErro('nem o autenticado gera código direto',
  () => db.query(`select public.gerar_codigo_rastreio()`), 'permission denied')
await db.exec(`reset role;`)

// admin de verdade
await uid('11111111-1111-1111-1111-111111111111')
await db.exec(`set role authenticated;`)
check('admin enxerga os 4 rastreamentos',
  (await db.query(`select count(*)::int c from public.rastreamentos`)).rows[0].c === 4)
check('admin enxerga a auditoria',
  (await db.query(`select count(*)::int c from public.rastreamento_auditoria`)).rows[0].c > 0)
check('admin lê só o próprio perfil',
  (await db.query(`select count(*)::int c from public.perfis_admin`)).rows[0].c === 1)
const novo = await db.query(`insert into public.rastreamentos (cliente_nome, origem, destino) values ('Novo pelo painel','A','B') returning codigo_rastreio`)
check('admin cria rastreamento e o código sai pronto', /^GUI-\d{4}-\d{6}$/.test(novo.rows[0].codigo_rastreio), novo.rows[0].codigo_rastreio)
await db.query(`select public.atualizar_status_rastreamento($1,'entregue','Entregue.','Campinas',now(),true)`, [id1])
check('admin move o status',
  (await db.query(`select status_atual from public.rastreamentos where id = $1`, [id1])).rows[0].status_atual === 'entregue')

// admin desativado perde o acesso
await db.exec(`reset role;`)
await db.query(`update public.perfis_admin set ativo = false where user_id = '11111111-1111-1111-1111-111111111111'`)
await db.exec(`set role authenticated;`)
check('admin desativado enxerga 0 rastreamentos',
  (await db.query(`select count(*)::int c from public.rastreamentos`)).rows[0].c === 0)
await db.exec(`reset role;`)

console.log(`\n===== ${ok} passaram, ${fail} falharam =====`)
process.exit(fail ? 1 : 0)
