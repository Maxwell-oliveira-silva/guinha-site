-- =====================================================================
-- DADOS DE TESTE — NÃO RODE EM PRODUÇÃO
-- =====================================================================
-- Este arquivo fica FORA de supabase/migrations/ de propósito: ele não é
-- aplicado automaticamente. Rode à mão, no SQL Editor do Supabase, só
-- quando quiser um ambiente de demonstração.
--
-- Tudo que ele cria tem "[TESTE]" no nome do cliente, então dá para achar
-- e remover depois com a última query deste arquivo.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PASSO OBRIGATÓRIO ANTES DE TUDO (vale também para produção):
-- liberar o acesso administrativo do Arnaldo.
--
-- 1) Crie o usuário em Authentication > Users > Add user (e-mail + senha).
-- 2) Troque o e-mail abaixo e rode:
-- ---------------------------------------------------------------------
insert into public.perfis_admin (user_id, nome, papel, ativo)
select id, 'Arnaldo', 'gestor', true
from auth.users
where email = 'arnaldo@guinhatransportes.com.br'   -- <<< TROQUE AQUI
on conflict (user_id) do update
  set ativo = true,
      papel = excluded.papel,
      nome  = excluded.nome;

-- ---------------------------------------------------------------------
-- Rastreamento de demonstração, com histórico plausível.
-- O código é gerado pelo trigger (GUI-<ano>-000001, 000002, ...).
-- ---------------------------------------------------------------------
do $$
declare
  v_id uuid;
begin
  insert into public.rastreamentos
    (cliente_nome, origem, destino, previsao_entrega, status_atual, observacao_publica)
  values
    ('[TESTE] Descarpack', 'São Paulo - SP', 'Campinas - SP',
     (current_date + 2), 'recebida',
     'Carga conferida e liberada para transporte. Entrega no período da manhã.')
  returning id into v_id;

  -- Histórico. Cada chamada move o status e grava o evento de uma vez.
  perform public.atualizar_status_rastreamento(
    v_id, 'em_conferencia', 'Conferência de volumes concluída.',
    'Carapicuíba - SP (Matriz)', now() - interval '30 hours');

  perform public.atualizar_status_rastreamento(
    v_id, 'coletada', 'Carga coletada no remetente.',
    'São Paulo - SP', now() - interval '28 hours');

  perform public.atualizar_status_rastreamento(
    v_id, 'em_transporte', 'Carga em rota para o destino.',
    'Rodovia Anhanguera, km 45', now() - interval '24 hours');

  raise notice 'Rastreamento de teste criado: %',
    (select codigo_rastreio from public.rastreamentos where id = v_id);
end
$$;

-- Um segundo caso, já entregue, para conferir o estado final da timeline.
do $$
declare
  v_id uuid;
begin
  insert into public.rastreamentos
    (cliente_nome, origem, destino, previsao_entrega, status_atual)
  values
    ('[TESTE] Cirúrgica KD', 'Carapicuíba - SP', 'Joinville - SC',
     (current_date - 1), 'recebida')
  returning id into v_id;

  perform public.atualizar_status_rastreamento(v_id, 'coletada',        'Coleta realizada.',            'Carapicuíba - SP',  now() - interval '5 days');
  perform public.atualizar_status_rastreamento(v_id, 'em_transporte',   'Em rota, BR-116.',             'Registro - SP',     now() - interval '4 days');
  perform public.atualizar_status_rastreamento(v_id, 'chegou_destino',  'Carga na filial de Ilhota.',   'Ilhota - SC',       now() - interval '2 days');
  perform public.atualizar_status_rastreamento(v_id, 'saiu_entrega',    'Saiu para entrega.',           'Joinville - SC',    now() - interval '1 day');
  perform public.atualizar_status_rastreamento(v_id, 'entregue',        'Entregue e assinado no destino.', 'Joinville - SC', now() - interval '20 hours');
end
$$;

-- ---------------------------------------------------------------------
-- LIMPEZA dos dados de teste
-- ---------------------------------------------------------------------
-- select set_config('app.permitir_purga', 'on', true);
-- delete from public.rastreamentos where cliente_nome like '[TESTE]%';
