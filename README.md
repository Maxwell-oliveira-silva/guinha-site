# Site Guinha Transportes

Site institucional com a viagem da carga controlada pelo scroll, mais o módulo
de **rastreamento de cargas** (`/rastrear` para o cliente, `/admin/rastreamentos`
para a operação).

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o build
npm run lint
npm run test:db  # testa as migrations num Postgres em memória (não precisa de Docker)
```

## Rotas

| Rota | O que é |
|---|---|
| `/` | Site institucional (o de sempre — nada mudou) |
| `/rastrear` | Consulta pública por código. Aceita `?codigo=GUI-2026-000001` para mandar o link pronto no WhatsApp |
| `/admin/rastreamentos` | Painel do Arnaldo. Exige login **e** perfil de admin ativo |

> **Hospedagem:** são rotas de verdade, então o servidor precisa devolver o
> `index.html` para qualquer caminho. Já vão prontos os arquivos para
> Netlify/Cloudflare (`public/_redirects`), Apache (`public/.htaccess`) e Vercel
> (`vercel.json`). Sem esse fallback, abrir `/rastrear` direto dá 404.

## O que você provavelmente vai querer editar

Tudo que muda com frequência está em `src/config/` — não precisa mexer em componente.

| Arquivo | O que controla |
|---|---|
| `src/config/site.ts` | Telefones, e-mails, endereços, **WHATSAPP_NUMBER**, serviços, frota, clientes, missão/visão/valores, links do menu |
| `src/config/journey.ts` | Os 5 capítulos da viagem: marcador de KM, título, texto, cor do céu |
| `src/config/integrations.ts` | Para onde vai o formulário de orçamento |
| `src/config/media.ts` | Vídeo opcional no hero (ver `HIGGSFIELD.md` na raiz) |
| `src/config/rastreamento.ts` | Nomes e cores dos 8 status, formato do código, flag de Realtime |

### Trocar o número do WhatsApp

`src/config/site.ts`:

```ts
export const WHATSAPP_NUMBER = '5511996928882' // formato internacional, só dígitos
```

Ele alimenta o botão flutuante, o link do rodapé e o envio do formulário.

### Ligar o formulário a um backend

Hoje o formulário monta a mensagem e abre o WhatsApp da empresa — funciona sem
servidor. Para mandar por e-mail/CRM, em `src/config/integrations.ts`:

```ts
export const QUOTE_MODE = 'both'                      // 'whatsapp' | 'endpoint' | 'both'
export const QUOTE_ENDPOINT = 'https://formspree.io/f/SEU_ID'
```

## Estrutura

```
src/
├── animations/   gsap.ts (registro do ScrollTrigger)
├── assets/       imagens já otimizadas em WebP
├── components/   Header, Footer, Button, Link, WhatsAppButton, SectionHeading…
│   └── rastreamento/  Timeline, ResultadoRastreio, Modal, formulários, Toast
├── config/       dados e ajustes (ver tabela acima)
├── hooks/        useReducedMotion, useMediaQuery, useInView, useAdminAuth
├── lib/          utils, whatsapp, router, format, supabase, rastreamento
├── pages/        Home, RastrearPage, NaoEncontrada
│   └── admin/    AdminRastreamentos (porteiro), LoginAdmin, PainelRastreamentos
└── sections/     Hero, TrustBar, Journey, Services, Company,
                  Differentiators, Quote

supabase/
├── migrations/   3 arquivos SQL — schema, RLS, funções
├── seed_teste.sql    liberação do admin + dados de demonstração
└── tests/        npm run test:db
```

O roteador é caseiro (`src/lib/router.ts`, ~60 linhas): três rotas não
justificavam uma biblioteca. Trocar por react-router, se um dia fizer sentido, é
substituir esse arquivo e o `components/Link.tsx`.

`/rastrear` e `/admin/rastreamentos` entram por import dinâmico — quem só abre o
site institucional não baixa o cliente do Supabase (≈57 kB gzip a menos).

## Rastreamento de cargas

### 1. Ligar o Supabase

O site funcionava sem banco nenhum; o rastreamento é a primeira parte que
precisa de um. Crie o projeto no Supabase e preencha o `.env` (veja
`.env.example`):

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=a-chave-anon-publica
```

Duas armadilhas que valem repetir:

- **só a chave anon.** Tudo com prefixo `VITE_` vai dentro do JavaScript que o
  visitante baixa. A `service_role` não pode aparecer no front em hipótese
  nenhuma — quem protege os dados é a RLS, não o sigilo da chave;
- **o Vite lê essas variáveis no build, não em execução.** Em Vercel/Netlify,
  cadastre-as no painel antes de publicar. Sem elas o site sobe normalmente, só
  que as telas de rastreamento mostram "serviço indisponível" em vez de quebrar.

### 2. Aplicar as migrations

Rode os quatro arquivos de `supabase/migrations/`, **em ordem**, no SQL Editor
(ou `supabase db push` se você usa a CLI):

| Arquivo | O que cria |
|---|---|
| `…120000_rastreamento_schema.sql` | tipo `rastreamento_status`, tabelas `rastreamentos`, `rastreamento_eventos`, `rastreamento_auditoria`, `perfis_admin`, `rastreamento_sequencia`, índices, constraints e triggers |
| `…120100_rastreamento_rls.sql` | Row Level Security e os GRANTs de tabela |
| `…120200_rastreamento_rpc.sql` | `rastrear_carga()`, `atualizar_status_rastreamento()`, `rastreamento_indicadores()` |
| `…120300_rastreamento_grants.sql` | fecha a execução das funções internas |

> O arquivo 04 não é opcional nem cosmético. Todo projeto Supabase nasce com um
> *default privilege* que concede `EXECUTE` em qualquer função nova de `public`
> para o papel `anon` — e o PostgREST publica cada uma como endpoint em
> `/rest/v1/rpc/`. Sem essa migration, `gerar_codigo_rastreio()` fica exposta:
> ela é `SECURITY DEFINER` e incrementa a sequência a cada chamada, então dava
> para queimar a numeração do ano em laço e, passando de 999999, travar todo
> cadastro novo (o `CHECK` de seis dígitos passaria a falhar). A migration
> revoga essas execuções e fecha o default privilege para as funções futuras.

### 3. Liberar o acesso do Arnaldo

Autenticar **não** é o mesmo que ter permissão. Depois de criar o usuário em
*Authentication > Users*, dê a ele um perfil ativo:

```sql
insert into public.perfis_admin (user_id, nome, papel, ativo)
select id, 'Arnaldo', 'gestor', true
from auth.users where email = 'arnaldo@guinhatransportes.com.br';
```

Sem essa linha, a pessoa entra e vê a tela "acesso não liberado" — e, mais
importante, o banco não devolve nenhum dado para ela.

Para desligar o acesso de alguém: `update public.perfis_admin set ativo = false
where user_id = '…';`. Não precisa apagar nada.

### Como a segurança está montada

O papel `anon` (o do navegador do cliente) **não tem uma única policy** nas
tabelas de rastreamento, e os GRANTs foram revogados. Ou seja: não existe
consulta direta possível, nem para contar linhas.

O cliente enxerga a carga por um caminho só — a função `rastrear_carga(codigo)`,
que monta a resposta campo a campo. Não há `select *` em lugar nenhum desse
caminho, então nenhuma coluna nova (custo, frete, motorista, placa, coordenada,
observação interna) vaza por descuido: para aparecer, alguém precisa
adicioná-la explicitamente na função.

O que a consulta pública devolve, e só isso: código, status, origem, destino,
previsão, última atualização, observação pública e os eventos marcados como
públicos.

> **Ponto de atenção que você precisa saber:** o formato `GUI-ANO-NNNNNN` é
> sequencial, então os códigos são adivinháveis — quem tiver um pode tentar o
> seguinte. Os dados expostos são poucos (nem o nome do cliente sai), mas se um
> dia isso incomodar, a correção é curta: acrescente um sufixo aleatório ao
> código em `gerar_codigo_rastreio()` e ajuste a regex em dois lugares
> (`rastreamentos_codigo_formato` no schema e `CODIGO_REGEX` em
> `src/config/rastreamento.ts`).

### Como o dia a dia funciona

1. Arnaldo cria o rastreamento no painel. O código `GUI-ANO-NNNNNN` é gerado
   pelo banco, de forma atômica — duas viagens criadas no mesmo instante nunca
   recebem o mesmo número, e o `UNIQUE` é a rede de proteção.
2. Ele passa o código ao cliente (ou o link `…/rastrear?codigo=GUI-2026-000001`,
   que já abre com a consulta feita).
3. A cada movimentação ele usa **Atualizar status**: isso move o status atual,
   grava um evento novo no histórico com data, hora, local e descrição, registra
   quem fez, e atualiza a "última atualização".
4. O histórico é *append-only*. Mudar de status nunca apaga o que já aconteceu —
   há inclusive um trigger que barra `delete` na tabela de eventos.
5. Tudo fica registrado em `rastreamento_auditoria`: ação, status anterior,
   status novo, autor e horário.

Eventos podem ser marcados como **internos** (a caixa "mostrar este evento para
o cliente"): o status muda igual, mas aquela linha não aparece na consulta
pública.

Para encerrar o acompanhamento, desative o rastreamento em vez de apagar — o
código continua no sistema, e o cliente passa a ver "rastreamento não está mais
disponível".

### Realtime e GPS

Nenhum dos dois está ligado, de propósito, mas o caminho está preparado:

- **Realtime:** publique as tabelas (instruções no fim de
  `…120200_rastreamento_rpc.sql`) e vire `REALTIME_ENABLED` para `true` em
  `src/config/rastreamento.ts`. O painel passa a recarregar sozinho.
- **GPS:** as colunas `motorista_nome`, `veiculo_placa`, `ultima_latitude`,
  `ultima_longitude` e `posicao_atualizada_em` já existem (e os eventos têm
  `latitude`/`longitude`), sem nada preenchendo e sem exposição pública. Não há
  nenhuma simulação de GPS na tela — quando houver telemetria de verdade, é só
  popular as colunas e decidir o que mostrar.
- **Viagens/clientes:** `rastreamentos.viagem_id` e `cliente_id` existem como
  gancho, sem FK, porque essas tabelas ainda não existem no projeto. A FK entra
  na migration que criá-las.

## A viagem no scroll

`sections/Journey.tsx` é a peça principal. Um `ScrollTrigger` com `scrub` liga o
progresso do scroll a: posição do caminhão, faixas da pista, paralaxe do
horizonte, troca de céu, crossfade dos textos e o odômetro.

O caminhão é um **recorte da foto real** da frota (`truck-cutout.webp`), vindo do
arquivo `Caminhao guinha 2.png` (fundo já removido) e preparado por
`scripts/prepare_truck_v2.py`, que faz dois ajustes:

- **corrige a dominante azul** — o arquivo recebido tinha a lataria em B-R = +48;
  o prateado real é -8, e sem correção o caminhão sumia nos gradientes de céu;
- **desfoca a placa** — o arquivo veio com "EJY 2035"; a placa real, na foto do
  catálogo, é **EJY 4769**. Como reescrever o texto seria inventar de novo, ela
  fica ilegível, sem afirmar um emplacamento falso.

`scripts/cutout_truck.py` é a versão anterior, que recortava o caminhão direto da
foto do catálogo por segmentação. Continua no repositório como referência.

Quem tem `prefers-reduced-motion: reduce` recebe `sections/JourneyStatic.tsx` —
mesmos capítulos, mesmo caminhão, sem movimento. A troca é automática
(`sections/JourneySection.tsx`).

## Origem dos dados

Telefones, endereços, certificações, seguradoras, frota, clientes e
missão/visão/valores vieram do material institucional impresso da empresa.
**Nada foi inventado.** Campos sem informação (redes sociais) ficaram como
string vazia e simplesmente não aparecem na tela até serem preenchidos.

## Antes de publicar

Site:

- [ ] Confirmar o número do WhatsApp em `site.ts`
- [ ] Trocar `https://www.guinhatransportes.com.br/` pelo domínio final em
      `index.html` (canonical, Open Graph e JSON-LD) e em `public/sitemap.xml`
- [ ] Preencher as redes sociais em `site.social` se existirem
- [ ] Conferir se a filial de Ilhota/SC fica mesmo na **BR-101** (o folder
      impresso diz "BR 1001", que não existe — assumimos BR-101)
- [ ] Apagar `public/__viewport-test.html` (bancada de desenvolvimento)

Rastreamento:

- [ ] `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` cadastradas **no painel da
      hospedagem**, não só no `.env` da sua máquina
- [ ] As **quatro** migrations aplicadas, em ordem
- [ ] Perfil do Arnaldo criado em `perfis_admin` e login testado
- [ ] Fallback de SPA ativo na hospedagem — abrir `/rastrear` direto e dar F5
      tem que funcionar
- [ ] Conferir no painel do Supabase que **nenhuma** policy foi criada para o
      papel `anon` nas tabelas de rastreamento
- [ ] Confirmar que a `service_role key` não está em nenhum arquivo do front
      (`grep -ri "service_role" src/`)
- [ ] Rodar `npm run test:db` e ver 60/60
- [ ] Sondar os endpoints RPC com a chave anon: só `rastrear_carga` pode
      responder. `gerar_codigo_rastreio`, `rastreamento_indicadores`,
      `is_admin_rastreamento` e `atualizar_status_rastreamento` têm que
      devolver `permission denied`
