-- =====================================================================
-- Guinha Transportes — Módulo de rastreamento de cargas
-- 02 / Row Level Security
-- =====================================================================
-- Princípio: o papel `anon` (o que roda no navegador do cliente, com a
-- chave pública) NÃO recebe uma única policy nestas tabelas. Com RLS
-- ligado e nenhuma policy aplicável, todo SELECT/INSERT/UPDATE/DELETE
-- direto retorna vazio ou erro — inclusive tentativas de ler colunas
-- financeiras, motorista, placa ou observação interna.
--
-- O cliente final só enxerga o rastreamento através da função
-- public.rastrear_carga(), definida em 03, que devolve uma lista fixa de
-- campos. Não há caminho alternativo.
-- =====================================================================

alter table public.perfis_admin             enable row level security;
alter table public.rastreamentos            enable row level security;
alter table public.rastreamento_eventos     enable row level security;
alter table public.rastreamento_auditoria   enable row level security;
alter table public.rastreamento_sequencia   enable row level security;

-- Nota sobre FORCE ROW LEVEL SECURITY: deliberadamente NÃO usado aqui.
-- Os triggers de histórico e auditoria são SECURITY DEFINER e precisam
-- escrever nestas tabelas em nome do dono; forçar RLS para o dono torna
-- esse caminho dependente do atributo BYPASSRLS do papel, que varia entre
-- projetos. A trava efetiva contra o público é a combinação de
-- "RLS ligado + zero policy para anon + REVOKE ALL de anon", abaixo.

-- ---------------------------------------------------------------------
-- Helper: o usuário logado é um administrador ativo?
-- SECURITY DEFINER para não recursionar na RLS de perfis_admin.
-- ---------------------------------------------------------------------
create or replace function public.is_admin_rastreamento()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.perfis_admin p
    where p.user_id = auth.uid()
      and p.ativo
  );
$$;

revoke all on function public.is_admin_rastreamento() from public;
grant execute on function public.is_admin_rastreamento() to authenticated;

-- ---------------------------------------------------------------------
-- perfis_admin — cada um lê apenas a própria linha.
-- Criar/editar admin é feito no painel do Supabase ou via SQL (ver 04).
-- Nenhuma policy de insert/update/delete: o front não mexe nisso.
-- ---------------------------------------------------------------------
drop policy if exists perfis_admin_select_proprio on public.perfis_admin;
create policy perfis_admin_select_proprio
  on public.perfis_admin
  for select
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- rastreamentos — só administradores ativos, e apenas leitura/escrita.
-- Sem policy de DELETE: rastreamento se desativa (ativo = false),
-- não se apaga, para não destruir histórico da operação.
-- ---------------------------------------------------------------------
drop policy if exists rastreamentos_admin_select on public.rastreamentos;
create policy rastreamentos_admin_select
  on public.rastreamentos
  for select
  to authenticated
  using (public.is_admin_rastreamento());

drop policy if exists rastreamentos_admin_insert on public.rastreamentos;
create policy rastreamentos_admin_insert
  on public.rastreamentos
  for insert
  to authenticated
  with check (public.is_admin_rastreamento());

drop policy if exists rastreamentos_admin_update on public.rastreamentos;
create policy rastreamentos_admin_update
  on public.rastreamentos
  for update
  to authenticated
  using (public.is_admin_rastreamento())
  with check (public.is_admin_rastreamento());

-- ---------------------------------------------------------------------
-- rastreamento_eventos — leitura e inclusão por administradores ativos.
-- Sem update/delete: o histórico é append-only.
-- ---------------------------------------------------------------------
drop policy if exists rastreamento_eventos_admin_select on public.rastreamento_eventos;
create policy rastreamento_eventos_admin_select
  on public.rastreamento_eventos
  for select
  to authenticated
  using (public.is_admin_rastreamento());

drop policy if exists rastreamento_eventos_admin_insert on public.rastreamento_eventos;
create policy rastreamento_eventos_admin_insert
  on public.rastreamento_eventos
  for insert
  to authenticated
  with check (public.is_admin_rastreamento());

-- ---------------------------------------------------------------------
-- rastreamento_auditoria — somente leitura, e somente para admin.
-- A escrita acontece exclusivamente pelos triggers SECURITY DEFINER.
-- ---------------------------------------------------------------------
drop policy if exists rastreamento_auditoria_admin_select on public.rastreamento_auditoria;
create policy rastreamento_auditoria_admin_select
  on public.rastreamento_auditoria
  for select
  to authenticated
  using (public.is_admin_rastreamento());

-- ---------------------------------------------------------------------
-- rastreamento_sequencia — nenhuma policy. Ninguém acessa direto;
-- apenas gerar_codigo_rastreio() (SECURITY DEFINER) enxerga a tabela.
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- Trava de privilégios de tabela para o papel público/anônimo.
-- RLS já bloquearia, mas revogar o GRANT elimina até a chance de um
-- COUNT ou de mensagem de erro que revele existência de linhas.
-- ---------------------------------------------------------------------
revoke all on public.rastreamentos          from anon;
revoke all on public.rastreamento_eventos   from anon;
revoke all on public.rastreamento_auditoria from anon;
revoke all on public.rastreamento_sequencia from anon, authenticated;
revoke all on public.perfis_admin           from anon;

grant select, insert, update on public.rastreamentos        to authenticated;
grant select, insert         on public.rastreamento_eventos to authenticated;
grant select                 on public.rastreamento_auditoria to authenticated;
grant select                 on public.perfis_admin         to authenticated;
