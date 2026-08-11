-- =====================================================================
-- Guinha Transportes — Módulo de rastreamento de cargas
-- 03 / Funções chamadas pelo front
-- =====================================================================

-- ---------------------------------------------------------------------
-- CONSULTA PÚBLICA — a única porta de entrada do cliente final.
--
-- Roda como SECURITY DEFINER porque `anon` não tem acesso nenhum às
-- tabelas. A função monta à mão o JSON de resposta, campo a campo, e é
-- essa lista literal que define o que o público pode ver. Não existe
-- "select *" em lugar nenhum deste caminho, então nenhuma coluna futura
-- (custo, frete, motorista, placa, coordenada, observação interna)
-- vaza por descuido: para aparecer, alguém teria que adicioná-la aqui
-- explicitamente.
-- ---------------------------------------------------------------------
create or replace function public.rastrear_carga(p_codigo text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_codigo text := upper(btrim(coalesce(p_codigo, '')));
  v_reg    public.rastreamentos%rowtype;
  v_eventos jsonb;
begin
  -- Formato inválido responde igual a "não encontrado": nada de mensagem
  -- diferente que ajude alguém a mapear códigos válidos por tentativa.
  if v_codigo !~ '^GUI-[0-9]{4}-[0-9]{6}$' then
    return jsonb_build_object('encontrado', false);
  end if;

  select * into v_reg
  from public.rastreamentos
  where codigo_rastreio = v_codigo;

  if not found then
    return jsonb_build_object('encontrado', false);
  end if;

  if not v_reg.ativo then
    -- Existe, mas o acompanhamento público está desligado.
    return jsonb_build_object('encontrado', true, 'ativo', false);
  end if;

  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'id',          e.id,
               'status',      e.status,
               'descricao',   e.descricao,
               'localizacao', e.localizacao,
               'data_evento', e.data_evento
             )
             order by e.data_evento asc, e.created_at asc
           ),
           '[]'::jsonb
         )
    into v_eventos
  from public.rastreamento_eventos e
  where e.rastreamento_id = v_reg.id
    and e.publico;

  return jsonb_build_object(
    'encontrado', true,
    'ativo',      true,
    'rastreamento', jsonb_build_object(
      'codigo_rastreio',    v_reg.codigo_rastreio,
      'status_atual',       v_reg.status_atual,
      'origem',             v_reg.origem,
      'destino',            v_reg.destino,
      'previsao_entrega',   v_reg.previsao_entrega,
      'observacao_publica', v_reg.observacao_publica,
      'ultima_atualizacao', v_reg.updated_at
    ),
    'eventos', v_eventos
  );
end;
$$;

revoke all on function public.rastrear_carga(text) from public;
grant execute on function public.rastrear_carga(text) to anon, authenticated;

comment on function public.rastrear_carga(text) is
  'Consulta pública por código. Retorna somente os campos destinados ao cliente final.';

-- ---------------------------------------------------------------------
-- ATUALIZAÇÃO DE STATUS (administrativo)
--
-- SECURITY INVOKER de propósito: as policies de RLS do usuário logado
-- valem normalmente, então quem não é admin ativo não consegue escrever
-- nem chamando a função direto.
--
-- Faz numa transação só: grava o evento rico (com local/descrição),
-- move o status atual e deixa os triggers cuidarem de updated_at e
-- auditoria. O flag app.skip_evento_auto evita evento duplicado.
-- ---------------------------------------------------------------------
create or replace function public.atualizar_status_rastreamento(
  p_rastreamento_id uuid,
  p_status          public.rastreamento_status,
  p_descricao       text default null,
  p_localizacao     text default null,
  p_data_evento     timestamptz default null,
  p_publico         boolean default true
)
returns jsonb
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_anterior public.rastreamento_status;
  v_codigo   text;
  v_updated  timestamptz;
begin
  -- Guarda de usabilidade, não de segurança: quem realmente barra é a RLS,
  -- já que a função é SECURITY INVOKER e `anon` não tem policy nem GRANT.
  -- Só validamos quando há sessão de usuário, para que manutenção via SQL
  -- Editor (papel postgres, auth.uid() nulo) continue possível.
  if auth.uid() is not null and not public.is_admin_rastreamento() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select status_atual, codigo_rastreio
    into v_anterior, v_codigo
  from public.rastreamentos
  where id = p_rastreamento_id
  for update;

  if not found then
    raise exception 'Rastreamento não encontrado.' using errcode = 'P0002';
  end if;

  perform set_config('app.skip_evento_auto', 'on', true);

  insert into public.rastreamento_eventos
    (rastreamento_id, status, descricao, localizacao, data_evento, publico, criado_por)
  values
    (p_rastreamento_id, p_status, nullif(btrim(coalesce(p_descricao, '')), ''),
     nullif(btrim(coalesce(p_localizacao, '')), ''), coalesce(p_data_evento, now()),
     p_publico, auth.uid());

  update public.rastreamentos
     set status_atual = p_status
   where id = p_rastreamento_id
  returning updated_at into v_updated;

  perform set_config('app.skip_evento_auto', 'off', true);

  -- O trigger de auditoria só registra quando o status muda de fato;
  -- um reenvio do mesmo status é um evento novo no histórico, então
  -- registramos a passagem explicitamente para não perder o rastro.
  if v_anterior = p_status then
    insert into public.rastreamento_auditoria
      (rastreamento_id, acao, status_anterior, status_novo, alterado_por)
    values
      (p_rastreamento_id, 'status_alterado', v_anterior, p_status, auth.uid());
  end if;

  return jsonb_build_object(
    'codigo_rastreio',    v_codigo,
    'status_anterior',    v_anterior,
    'status_atual',       p_status,
    'ultima_atualizacao', v_updated
  );
end;
$$;

revoke all on function public.atualizar_status_rastreamento(uuid, public.rastreamento_status, text, text, timestamptz, boolean) from public;
grant execute on function public.atualizar_status_rastreamento(uuid, public.rastreamento_status, text, text, timestamptz, boolean) to authenticated;

-- ---------------------------------------------------------------------
-- INDICADORES do painel — uma ida ao banco em vez de oito.
-- SECURITY INVOKER: quem não é admin recebe zeros, porque a RLS
-- simplesmente não devolve linha nenhuma.
-- ---------------------------------------------------------------------
create or replace function public.rastreamento_indicadores()
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'total',          count(*),
    'em_transporte',  count(*) filter (where status_atual = 'em_transporte'),
    'aguardando',     count(*) filter (where status_atual in ('recebida', 'em_conferencia')),
    'saiu_entrega',   count(*) filter (where status_atual = 'saiu_entrega'),
    'entregues',      count(*) filter (where status_atual = 'entregue'),
    'ocorrencias',    count(*) filter (where status_atual = 'ocorrencia'),
    'inativos',       count(*) filter (where not ativo)
  )
  from public.rastreamentos;
$$;

revoke all on function public.rastreamento_indicadores() from public;
grant execute on function public.rastreamento_indicadores() to authenticated;

-- ---------------------------------------------------------------------
-- Realtime (opcional)
--
-- A arquitetura do front já busca os dados por uma camada única
-- (src/lib/rastreamento.ts), então ligar Realtime é só publicar as
-- tabelas e virar a flag REALTIME_ENABLED em src/config/rastreamento.ts.
-- Descomente quando quiser:
--
--   alter publication supabase_realtime add table public.rastreamentos;
--   alter publication supabase_realtime add table public.rastreamento_eventos;
--
-- Atenção: Realtime respeita RLS, então o canal só entrega evento para
-- sessões autenticadas de admin — a página pública continua consultando
-- pela RPC, como deve ser.
-- ---------------------------------------------------------------------
