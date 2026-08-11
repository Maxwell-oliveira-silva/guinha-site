-- =====================================================================
-- Guinha Transportes — Módulo de rastreamento de cargas
-- 01 / Schema: tipos, tabelas, índices, constraints, triggers
-- =====================================================================
-- Este módulo é aditivo: não altera nem remove nada pré-existente.
-- Todos os objetos são prefixados por "rastreament*" ou "perfis_admin".
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tipo do status da carga (os 8 estados operacionais da Guinha)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'rastreamento_status') then
    create type public.rastreamento_status as enum (
      'recebida',        -- 1. Carga recebida
      'em_conferencia',  -- 2. Em conferência
      'coletada',        -- 3. Coletada
      'em_transporte',   -- 4. Em transporte
      'chegou_destino',  -- 5. Chegou ao destino
      'saiu_entrega',    -- 6. Saiu para entrega
      'entregue',        -- 7. Entregue
      'ocorrencia'       -- 8. Ocorrência
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- Perfis administrativos
-- Estar autenticado NÃO basta: só quem tem linha ativa aqui é admin.
-- Populado manualmente pelo dono da conta (ver 04_seed).
-- ---------------------------------------------------------------------
create table if not exists public.perfis_admin (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  nome       text,
  papel      text not null default 'operador' check (papel in ('operador', 'gestor')),
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.perfis_admin is
  'Lista de quem pode operar o módulo de rastreamento. Sem linha ativa aqui, um usuário autenticado não enxerga nada.';

-- ---------------------------------------------------------------------
-- Sequência anual para o código GUI-ANO-NNNNNN
-- ---------------------------------------------------------------------
create table if not exists public.rastreamento_sequencia (
  ano           integer primary key,
  ultimo_numero integer not null default 0 check (ultimo_numero >= 0)
);

comment on table public.rastreamento_sequencia is
  'Contador por ano usado por gerar_codigo_rastreio(). Nunca acessado direto pelo cliente.';

-- ---------------------------------------------------------------------
-- Rastreamentos
-- ---------------------------------------------------------------------
create table if not exists public.rastreamentos (
  id                  uuid primary key default gen_random_uuid(),

  codigo_rastreio     text not null,
  cliente_nome        text not null check (length(btrim(cliente_nome)) > 0),

  -- Ganchos para as tabelas que a operação ainda não tem (viagens/clientes).
  -- Ficam sem FK de propósito: a FK entra na migration que criar essas tabelas.
  cliente_id          uuid,
  viagem_id           uuid,

  origem              text not null check (length(btrim(origem)) > 0),
  destino             text not null check (length(btrim(destino)) > 0),
  previsao_entrega    date,

  status_atual        public.rastreamento_status not null default 'recebida',
  observacao_publica  text,
  observacao_interna  text,          -- NUNCA sai na consulta pública
  ativo               boolean not null default true,

  -- Preparação para GPS. Nada preenche estas colunas nesta versão e elas
  -- não são expostas pela consulta pública. Ver 03_rpc_publico.sql.
  motorista_nome        text,
  veiculo_placa         text,
  ultima_latitude       numeric(9, 6) check (ultima_latitude between -90 and 90),
  ultima_longitude      numeric(9, 6) check (ultima_longitude between -180 and 180),
  posicao_atualizada_em timestamptz,

  criado_por          uuid references auth.users (id) on delete set null,
  atualizado_por      uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint rastreamentos_codigo_rastreio_key unique (codigo_rastreio),
  constraint rastreamentos_codigo_formato check (codigo_rastreio ~ '^GUI-[0-9]{4}-[0-9]{6}$')
);

comment on column public.rastreamentos.observacao_interna is
  'Uso interno da transportadora. Jamais retornado pela função pública de consulta.';
comment on column public.rastreamentos.viagem_id is
  'Reservado: aponta para a futura tabela de viagens. FK a ser adicionada quando ela existir.';

create index if not exists rastreamentos_codigo_rastreio_idx  on public.rastreamentos (codigo_rastreio);
create index if not exists rastreamentos_status_atual_idx     on public.rastreamentos (status_atual);
create index if not exists rastreamentos_updated_at_idx       on public.rastreamentos (updated_at desc);
create index if not exists rastreamentos_ativo_idx            on public.rastreamentos (ativo);
create index if not exists rastreamentos_cliente_nome_idx     on public.rastreamentos (lower(cliente_nome));
create index if not exists rastreamentos_viagem_id_idx        on public.rastreamentos (viagem_id) where viagem_id is not null;

-- ---------------------------------------------------------------------
-- Eventos (histórico). Append-only: nada aqui é apagado ao mudar status.
-- ---------------------------------------------------------------------
create table if not exists public.rastreamento_eventos (
  id              uuid primary key default gen_random_uuid(),
  rastreamento_id uuid not null references public.rastreamentos (id) on delete cascade,
  status          public.rastreamento_status not null,
  descricao       text,
  localizacao     text,
  data_evento     timestamptz not null default now(),
  publico         boolean not null default true,

  -- Preparação para GPS (idem: não populado, não exposto).
  latitude        numeric(9, 6) check (latitude between -90 and 90),
  longitude       numeric(9, 6) check (longitude between -180 and 180),

  criado_por      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

comment on column public.rastreamento_eventos.publico is
  'false = evento operacional interno; a consulta pública devolve apenas publico = true.';

create index if not exists rastreamento_eventos_rastreamento_id_idx
  on public.rastreamento_eventos (rastreamento_id, data_evento desc);
create index if not exists rastreamento_eventos_status_idx
  on public.rastreamento_eventos (status);

-- ---------------------------------------------------------------------
-- Auditoria: quem alterou, quando, de qual status para qual
-- ---------------------------------------------------------------------
create table if not exists public.rastreamento_auditoria (
  id               bigint generated always as identity primary key,
  rastreamento_id  uuid not null references public.rastreamentos (id) on delete cascade,
  acao             text not null check (acao in ('criado', 'editado', 'status_alterado', 'ativado', 'desativado')),
  status_anterior  public.rastreamento_status,
  status_novo      public.rastreamento_status,
  dados_anteriores jsonb,
  dados_novos      jsonb,
  alterado_por     uuid references auth.users (id) on delete set null,
  alterado_em      timestamptz not null default now()
);

create index if not exists rastreamento_auditoria_rastreamento_id_idx
  on public.rastreamento_auditoria (rastreamento_id, alterado_em desc);

-- =====================================================================
-- Funções e triggers
-- =====================================================================

-- Geração atômica do código GUI-ANO-NNNNNN.
-- O UPSERT com "returning" serializa concorrência na própria linha do ano,
-- então duas viagens criadas ao mesmo tempo nunca recebem o mesmo número.
create or replace function public.gerar_codigo_rastreio()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ano       integer := extract(year from now() at time zone 'America/Sao_Paulo')::integer;
  v_numero    integer;
  v_codigo    text;
  v_tentativa integer := 0;
begin
  loop
    v_tentativa := v_tentativa + 1;

    insert into public.rastreamento_sequencia as s (ano, ultimo_numero)
    values (v_ano, 1)
    on conflict (ano) do update set ultimo_numero = s.ultimo_numero + 1
    returning s.ultimo_numero into v_numero;

    v_codigo := 'GUI-' || v_ano::text || '-' || lpad(v_numero::text, 6, '0');

    -- Guarda extra: se alguém tiver cadastrado esse código à mão, pula.
    exit when not exists (
      select 1 from public.rastreamentos where codigo_rastreio = v_codigo
    );

    if v_tentativa >= 50 then
      raise exception 'Não foi possível gerar um código de rastreio único para %', v_ano;
    end if;
  end loop;

  return v_codigo;
end;
$$;

revoke all on function public.gerar_codigo_rastreio() from public;

-- Preenche o código automaticamente quando não vier informado.
create or replace function public.rastreamentos_set_codigo()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.codigo_rastreio is null or btrim(new.codigo_rastreio) = '' then
    new.codigo_rastreio := public.gerar_codigo_rastreio();
  else
    new.codigo_rastreio := upper(btrim(new.codigo_rastreio));
  end if;

  if new.criado_por is null then
    new.criado_por := auth.uid();
  end if;
  new.atualizado_por := coalesce(new.atualizado_por, auth.uid());

  return new;
end;
$$;

drop trigger if exists trg_rastreamentos_set_codigo on public.rastreamentos;
create trigger trg_rastreamentos_set_codigo
  before insert on public.rastreamentos
  for each row execute function public.rastreamentos_set_codigo();

-- updated_at + autor da última alteração
create or replace function public.rastreamentos_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at     := now();
  new.atualizado_por := coalesce(auth.uid(), old.atualizado_por);
  -- O código nunca muda depois de emitido: o cliente já o recebeu.
  new.codigo_rastreio := old.codigo_rastreio;
  new.created_at      := old.created_at;
  return new;
end;
$$;

drop trigger if exists trg_rastreamentos_touch on public.rastreamentos;
create trigger trg_rastreamentos_touch
  before update on public.rastreamentos
  for each row execute function public.rastreamentos_touch();

-- Histórico automático.
-- Um UPDATE que muda o status gera evento sozinho, EXCETO quando quem está
-- atualizando é a RPC atualizar_status_rastreamento(), que grava um evento
-- mais rico (com local e descrição) e sinaliza isso via app.skip_evento_auto.
create or replace function public.rastreamentos_registrar_evento()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if coalesce(current_setting('app.skip_evento_auto', true), 'off') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Texto escrito para o cliente ler, não para o operador: este evento
    -- abre a linha do tempo pública.
    insert into public.rastreamento_eventos (rastreamento_id, status, descricao, criado_por)
    values (new.id, new.status_atual, 'Carga registrada no sistema da Guinha.', auth.uid());
  elsif new.status_atual is distinct from old.status_atual then
    insert into public.rastreamento_eventos (rastreamento_id, status, criado_por)
    values (new.id, new.status_atual, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists trg_rastreamentos_registrar_evento on public.rastreamentos;
create trigger trg_rastreamentos_registrar_evento
  after insert or update on public.rastreamentos
  for each row execute function public.rastreamentos_registrar_evento();

-- Auditoria: sempre, sem exceção.
create or replace function public.rastreamentos_auditar()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_acao text;
begin
  if tg_op = 'INSERT' then
    insert into public.rastreamento_auditoria
      (rastreamento_id, acao, status_novo, dados_novos, alterado_por)
    values
      (new.id, 'criado', new.status_atual, to_jsonb(new), auth.uid());
    return new;
  end if;

  if new.status_atual is distinct from old.status_atual then
    v_acao := 'status_alterado';
  elsif new.ativo is distinct from old.ativo then
    v_acao := case when new.ativo then 'ativado' else 'desativado' end;
  else
    v_acao := 'editado';
  end if;

  insert into public.rastreamento_auditoria
    (rastreamento_id, acao, status_anterior, status_novo, dados_anteriores, dados_novos, alterado_por)
  values
    (new.id, v_acao, old.status_atual, new.status_atual, to_jsonb(old), to_jsonb(new), auth.uid());

  return new;
end;
$$;

drop trigger if exists trg_rastreamentos_auditar on public.rastreamentos;
create trigger trg_rastreamentos_auditar
  after insert or update on public.rastreamentos
  for each row execute function public.rastreamentos_auditar();

-- Autor do evento quando inserido direto pelo painel
create or replace function public.rastreamento_eventos_set_autor()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.criado_por := coalesce(new.criado_por, auth.uid());
  return new;
end;
$$;

drop trigger if exists trg_rastreamento_eventos_set_autor on public.rastreamento_eventos;
create trigger trg_rastreamento_eventos_set_autor
  before insert on public.rastreamento_eventos
  for each row execute function public.rastreamento_eventos_set_autor();

-- O histórico é append-only: mudar de status nunca apaga o que já aconteceu.
-- Para uma limpeza legítima via SQL (LGPD, dado de teste), rode antes:
--   select set_config('app.permitir_purga', 'on', true);
create or replace function public.rastreamento_eventos_bloquear_delete()
returns trigger
language plpgsql
as $$
begin
  if coalesce(current_setting('app.permitir_purga', true), 'off') = 'on' then
    return old;
  end if;
  raise exception 'O histórico de rastreamento não pode ser apagado.';
end;
$$;

drop trigger if exists trg_rastreamento_eventos_bloquear_delete on public.rastreamento_eventos;
create trigger trg_rastreamento_eventos_bloquear_delete
  before delete on public.rastreamento_eventos
  for each row execute function public.rastreamento_eventos_bloquear_delete();
