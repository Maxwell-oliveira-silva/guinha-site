-- =====================================================================
-- Guinha Transportes — Módulo de rastreamento de cargas
-- 04 / Fecha a execução das funções internas
-- =====================================================================
-- POR QUE ESTE ARQUIVO EXISTE
--
-- O Supabase cria todo projeto com um default privilege equivalente a:
--
--   alter default privileges in schema public
--     grant execute on functions to anon, authenticated, service_role;
--
-- Ou seja: QUALQUER função nova em `public` já nasce executável por quem
-- chega com a chave anônima, e o PostgREST publica isso como um endpoint
-- em /rest/v1/rpc/<nome>. O `revoke ... from public` das migrations 01 e
-- 03 não resolve, porque a concessão aqui é direta ao papel `anon`, não
-- herdada de PUBLIC.
--
-- Consequência concreta que isso abria: `gerar_codigo_rastreio()` é
-- SECURITY DEFINER e incrementa `rastreamento_sequencia` a cada chamada.
-- Um visitante qualquer podia chamá-la em laço, queimar a numeração do
-- ano e, ao passar de 999999, quebrar a geração de código de vez (o
-- CHECK `[0-9]{6}` passaria a falhar em todo cadastro novo).
--
-- Regra desta migration:
--   anon           → só rastrear_carga()
--   authenticated  → rastrear_carga, atualizar_status, indicadores, is_admin
--   ninguém        → gerar_codigo e as funções de trigger
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Geração de código: nenhum cliente chama isto. Só o trigger, que roda
--    dentro do banco e não passa por GRANT de papel.
-- ---------------------------------------------------------------------
revoke all on function public.gerar_codigo_rastreio() from anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Funções de trigger. O PostgREST não expõe função que retorna
--    `trigger`, mas deixar EXECUTE aberto não tem propósito nenhum.
-- ---------------------------------------------------------------------
revoke all on function public.rastreamentos_set_codigo()             from anon, authenticated;
revoke all on function public.rastreamentos_touch()                  from anon, authenticated;
revoke all on function public.rastreamentos_registrar_evento()       from anon, authenticated;
revoke all on function public.rastreamentos_auditar()                from anon, authenticated;
revoke all on function public.rastreamento_eventos_set_autor()       from anon, authenticated;
revoke all on function public.rastreamento_eventos_bloquear_delete() from anon, authenticated;

-- ---------------------------------------------------------------------
-- 3. Funções administrativas: fora do alcance do público.
--    A RLS já barrava a escrita (elas são SECURITY INVOKER), mas um
--    endpoint que existe é um endpoint que alguém sonda. Sumimos com ele.
-- ---------------------------------------------------------------------
revoke all on function public.is_admin_rastreamento() from anon;
grant execute on function public.is_admin_rastreamento() to authenticated;

revoke all on function public.rastreamento_indicadores() from anon;
grant execute on function public.rastreamento_indicadores() to authenticated;

revoke all on function public.atualizar_status_rastreamento(
  uuid, public.rastreamento_status, text, text, timestamptz, boolean
) from anon;
grant execute on function public.atualizar_status_rastreamento(
  uuid, public.rastreamento_status, text, text, timestamptz, boolean
) to authenticated;

-- ---------------------------------------------------------------------
-- 4. A única porta pública, reafirmada.
-- ---------------------------------------------------------------------
grant execute on function public.rastrear_carga(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. Toda função criada NESTE schema daqui em diante nasce fechada.
--    Sem isto, a próxima função que alguém escrever repete o problema.
--    Note que continuamos concedendo a service_role: é o papel usado por
--    Edge Functions e jobs do lado do servidor, que nunca vai ao browser.
-- ---------------------------------------------------------------------
alter default privileges in schema public revoke execute on functions from anon, authenticated;

-- ---------------------------------------------------------------------
-- 6. Devolve a numeração ao início, se nada real foi cadastrado ainda.
--    Chamadas de teste/sondagem à função podem ter consumido números.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from public.rastreamentos) then
    delete from public.rastreamento_sequencia;
    raise notice 'Sequência de códigos reiniciada: o próximo será GUI-<ano>-000001.';
  else
    raise notice 'Já existem rastreamentos; a numeração foi preservada.';
  end if;
end
$$;
