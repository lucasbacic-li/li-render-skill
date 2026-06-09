---
name: li-render-store-builder
description: >-
  Transforma uma pasta de artefatos de marca (brand book, tokens de cor e
  tipografia, fontes, logos, e HTMLs de layout de referência) em um tema
  customizado da Loja Integrada — adaptado, deployado e testado na conta do
  próprio lojista via renderizador LI Render e a CLI li-cli. Use SEMPRE que o
  usuário quiser montar, implementar, criar, customizar ou "deployar" uma loja
  na Loja Integrada a partir de uma identidade de marca; quando mencionar LI
  Render, li-cli, tema da Loja Integrada, litheme, "loja a partir do brand
  kit", ou apontar para uma pasta de marca pedindo uma loja — mesmo que não
  diga "tema" ou "LI Render" explicitamente. Também dispara para tarefas
  parciais desse fluxo: reskin de tema, mapear tokens para um tema da Loja
  Integrada, configurar/instalar a li-cli, ou fazer preview/deploy de um tema.
---

# LI Render Store Builder

Pega uma **pasta de artefatos de marca** e produz um **tema da Loja Integrada
deployado e testado** na conta de um lojista, usando o renderizador **LI Render**
e a CLI `li-cli`.

O processo é **genérico por conta**: nada da marca, da loja ou da URL é
hardcoded — tudo vem dos inputs. A primeira marca de validação foi a Ora
Lingerie, mas a skill serve a qualquer marca/conta.

## Princípios de design (lê isto primeiro)

Quatro decisões fundam todo o fluxo. Quando estiver em dúvida, volte a elas:

1. **Tokens são a fonte da verdade; HTML de referência é intenção de design.**
   Se a pasta tem layouts prontos (ex.: uma home em HTML), use-os para entender
   *estrutura, seções e hierarquia* — mas re-derive os estilos a partir dos
   tokens e adapte para a estrutura Liquid + Tailwind/DaisyUI do tema. Não copie
   CSS frágil verbatim; ele briga com o sistema do renderizador.

2. **Adapte o litheme, não construa do zero.** `theme create` duplica o tema
   padrão (litheme), que já traz todas as rotas, partials e funções que o
   renderizador espera (carrinho, checkout, busca…). Reskine o que existe em vez
   de recriar a base — é mais rápido e muito menos arriscado.

3. **Auto-descoberta com manifesto opcional.** A pasta de marca pode estar
   organizada de qualquer jeito. Descubra os artefatos por heurística (ver
   `references/brand-input-contract.md`); se existir um `brand.manifest.json`,
   ele tem precedência e remove ambiguidade.

4. **Não terminou até estar renderizando no preview — em desktop E mobile.** O
   output não é "arquivos gerados" — é um tema sincronizado e *verificado*. E
   verificado nas **duas pontas**: o litheme é mobile-first (`md:`, `clamp(vw)`),
   então o que "parece ok no desktop" quebra no mobile o tempo todo (escala,
   padding, largura). Toda checagem visual vê mobile (~390) **e** desktop (~1440).
   **Abra sempre uma aba dedicada** para verificar (`tabs_create_mcp` → use só
   esse `tabId` → `tabs_close_mcp` no fim) — reutilizar "a" aba do preview faz
   threads paralelas competirem por ela. Promover para produção é decisão do usuário.

5. **Estilize global-first; forks são code smell.** Numa base DaisyUI/Tailwind,
   quase **não deve haver exceção**: consistência vem de editar o **sistema**
   (tokens de cor/raio, headings em `@layer base`, `.btn`/`.input` globais,
   `fill="currentColor"` em ícones), não de recriar estilo por bloco. Antes de
   escrever CSS de um componente, classifique na tabela global-vs-fork de
   `references/global-styling.md`. E **rode a auto-auditoria**
   (`scripts/audit-theme-styles.sh`) antes de declarar pronto — o agente deve
   pegar as próprias exceções, não o usuário no review.

## Definition of Done (toda mudança visual)

Uma mudança só está pronta quando:
- [ ] É **global** (token / `@utility` / `@layer base` / papel), não um fork —
      salvo layout genuinamente único, e mesmo aí puxando cor/tipo/CTA do sistema.
- [ ] `scripts/audit-theme-styles.sh <tema>` rodado e os achados homogeneizados.
- [ ] **Verificada em mobile (~390) e desktop (~1440)** no preview (ver
      `references/qa-checklist.md`). Confirme que o `innerWidth` realmente mudou
      (resize pode falhar) antes de confiar no resultado mobile.
- [ ] Sem erro de console; build (`npm run build:css`) e sync ok.
- [ ] **Se a mudança for GLOBAL** (token de cor/raio/escala, `.btn`/`.input`,
      `.container`, headings): rodar o **sweep de regressão** — asserts de layout
      em todas as rotas da superfície ×viewports, + diff de screenshots
      antes/depois para mudanças grandes (`references/visual-regression.md`).
      Raio global exige verificação ampla, não só a página que você editou.
- [ ] **Antes de um deploy maior / `theme promote`**: rodar o smoke test do
      caminho primário (Home → Busca → **prévia de busca ao vivo** → PDP →
      **carrinho vazio** → add-to-cart → minicart) — `references/smoke-test.md`.
      Todos os passos devem passar; qualquer falha = regressão, não promova.
      A avaliação inclui **anomalia visual** (colapso/largura-zero, falta de
      padding, sobreposição, elemento prometido faltando), não só função —
      ver a tabela em `references/qa-checklist.md`.

## Inputs necessários

Antes de começar, confirme que você tem:

- **Pasta de marca** (caminho): contém tokens de cor/tipografia, fontes, logos e,
  idealmente, HTMLs de layout de referência. Ver o contrato completo em
  `references/brand-input-contract.md`.
- **Identidade da conta**: o *handle* da loja (que forma a URL de preview
  `https://{loja}-preview.lojas.li`) e o **nome do tema** a criar. Pergunte se
  não foram dados — não invente.
- **CLI + login**: `li-cli` instalada e uma sessão autenticada na conta certa.
  O login abre o navegador (passo humano) — ver Fase 2.

Se algo essencial faltar, **pare e pergunte** em vez de assumir.

## O fluxo (6 fases)

### Fase 1 — Ingerir a marca → perfil de marca

Objetivo: transformar a pasta (bagunçada ou organizada) em um **perfil de marca**
normalizado que o resto do fluxo consome.

1. Se houver `brand.manifest.json`, leia-o primeiro (precedência total).
2. Senão, faça **auto-descoberta** seguindo as heurísticas de
   `references/brand-input-contract.md` (cores, tipografia, fontes, logos,
   HTML de referência, camada verbal).
3. Produza o perfil de marca: papéis semânticos de cor (surface, ink, accent…),
   famílias + escala tipográficas, arquivos de fonte, arquivos de logo/símbolo
   (com variantes claro/escuro), e — para cada HTML de referência — um resumo de
   *seções e layout* (não de CSS).
4. Apresente o perfil ao usuário em 1 tela e confirme antes de tocar na conta.
   É barato corrigir aqui; caro depois do deploy.

### Fase 2 — Conectar a conta e obter o tema base

Ver comandos exatos em `references/li-render.md` (§1).

1. **CLI**: verifique `li-cli --version`. Se ausente, instale o binário do SO
   (macOS/Linux: baixar → `/usr/local/bin/li-cli` → `chmod +x`).
2. **Login** (passo humano): rode `li-cli login`, que abre o navegador. Confirme
   com o usuário que ele autenticou **na conta certa** — esta skill nunca assume
   a loja.
3. **Criar + baixar**: `li-cli theme create <nome>` depois
   `li-cli theme pull <nome>`. Entre na pasta e `npm install`.
4. **Mapear o litheme**: na primeira vez que você vê a estrutura real de um
   litheme, registre-a em `references/litheme-structure.md` (hoje é um stub —
   ver a nota lá). Isso torna execuções futuras determinísticas: você saberá
   exatamente quais arquivos de template/JSON reskins.

### Fase 3 — Mapear tokens → fundação do tema

Agora você injeta a identidade no esqueleto do litheme. Tokens primeiro,
componentes depois — assim toda página herda a marca de graça.

1. **Cores + tipografia**: substitua as variáveis de cor/tipografia do litheme
   (CSS vars e/ou config do Tailwind) pelos tokens da marca, **preservando os
   nomes de papel** que os templates já usam (mapeie marca→papel, não renomeie
   tudo). Rode `npm run build:css`.
2. **Fontes**: prefira **Google Fonts via `<link>` no `<head>`** quando as famílias
   existirem lá (mesmo padrão do Material Symbols do litheme; serve woff2 +
   unicode-range, robusto no mobile). **NÃO** declare `@font-face` com
   `url(../fonts/…)` em `theme.css` — é asset estático, o caminho relativo dribla o
   `{% asset_url %}` assinado e dá 404 (as 3 fontes falham; só a serifada é óbvia).
   Se for self-hostar, ponha o `@font-face` num `<style>` Liquid no head com
   `src: url('{% asset_url "/fonts/X.woff2" %}')`. Detalhes e diagnóstico em
   `references/li-render.md` (gotcha de fontes).
3. **Logos/símbolos**: copie SVGs/imagens para `assets/` e referencie via
   `{% asset_url "..." %}` (CDN + resize). Use as variantes claro/escuro nos
   contextos certos (header transparente vs. footer escuro, etc.).

### Fase 4 — Reskinar as páginas (escopo v1)

Escopo v1: **home, página de categoria, página de produto** + os partials
**header, footer, minicart**. Mantenha rotas/funções do litheme intactas.

Para cada página: o JSON de page settings declara rota + `global_data` (via
funções como `get_products`, `get_current_product`, `get_current_category`) e a
árvore de componentes; os templates `.liquid` renderizam. Use o HTML de
referência como guia de seções/hierarquia e re-derive o visual dos tokens.
Receitas e exemplos prontos em `references/page-json-recipes.md`.

Regras práticas:
- Não invente dados — toda informação de produto/categoria vem das funções de
  dados do renderizador. Se uma seção precisa de dados, declare a função.
- Reuse os partials existentes do litheme onde possível; reskine em vez de
  duplicar.

### Fase 5 — Preview e teste (a fase que não dá pra pular)

1. Em terminais separados: `npm run watch:css` e
   `li-cli theme sync <nome> -r` (o `-r` liga live-reload).
2. Abra `https://{loja}-preview.lojas.li/.theme/{nome}` e **verifique de fato**.
   ⚠️ O preview é **autenticado por sessão** — `curl`/WebFetch só pegam o login do
   painel. Use um navegador logado no painel (o mesmo do `li-cli login`); ex.:
   dirigir o Chrome conectado, navegar à URL e screenshot. O toolbar "Tema atual:
   {nome}" confirma o tema. Não peça pro usuário checar — verifique você:
   - cada página v1 renderiza sem erro de console;
   - tokens aplicados (cores/tipografia corretas), fontes carregam, logo aparece;
   - grids de produto populam via funções de dados;
   - responsivo e estados de hover básicos ok.
3. Conserte na fonte e re-verifique. Ver o checklist completo em
   `references/qa-checklist.md`.

### Fase 6 — Entrega

Resuma o que foi feito (tema, páginas reskinadas, URL de preview) e mostre
evidência (screenshot/preview). **Publicar em produção é decisão explícita do
usuário** — ofereça, não execute por conta própria. O fluxo é **dois passos**
(não só `promote`): `li-cli theme deploy <dev> -t <prod>` (cópia otimizada em
produção) → `li-cli theme promote <prod>` (torna ativa). Detalhes e gates em
`references/li-render.md` (Publicar) + a Definition of Done acima.

## Arquivos de referência

Carregue conforme a fase:

- `references/li-render.md` — CLI `li-cli` (instalação + todos os comandos) e o
  renderizador (page settings JSON, componentes, partials, store routes, funções
  de dados, filtros e tags Liquid). **A base técnica.**
- `references/brand-input-contract.md` — formato esperado da pasta de marca:
  heurísticas de auto-descoberta + schema do `brand.manifest.json` opcional.
- `references/page-json-recipes.md` — JSONs de página + esqueletos de template
  Liquid para home, categoria, produto e partials.
- `references/global-styling.md` — **estilizar global-first** (Tailwind v4 +
  DaisyUI v5): ordem de ataque (tokens de cor/raio → headings → `.btn`/`.input`),
  sistema tipográfico (display serif / subtitle grotesca caps / body mono), os
  dois tipos de CTA. Leia antes de qualquer pass de estilo.
- `references/litheme-structure.md` — estrutura real de arquivos do litheme
  (preencher ao rodar o fluxo pela primeira vez — ver nota no arquivo).
- `references/qa-checklist.md` — checklist de verificação no preview (inclui a
  **matriz responsiva desktop+mobile obrigatória**).
- `scripts/audit-theme-styles.sh` — varre o tema por forks de estilo (cores
  hardcoded, ícones `fill="#hex"`, `rounded-*`, fonte por bloco, título-como-corpo).
  Rode antes de fechar qualquer pass de estilo.
- `references/smoke-test.md` — **teste de regressão do caminho primário** (Home →
  Busca → PDP → minicart) com asserts de DOM. Rode antes de `theme promote`.
- `references/visual-regression.md` — **regressão cross-component** após mudança
  global: mapa de raio de impacto, superfície de regressão, asserts de layout
  (overflow/colapso), e diff de screenshots. Mudança global = verificação ampla.
- `scripts/diff-screenshots.py` — diff visual pareado baseline/current (sinaliza
  o que mudou onde você não tocou).
- `assets/brand.manifest.example.json` — exemplo do manifesto opcional.
