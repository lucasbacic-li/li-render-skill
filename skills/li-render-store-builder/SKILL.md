---
name: li-render-store-builder
description: >-
  Implementa um tema customizado da Loja Integrada a partir de um brand-kit já
  desenhado (identidade + bloco commerce + comps HTML — saída da skill
  store-design-composer) ou de uma pasta de marca — adaptando, deployando e
  testando na conta do próprio lojista via renderizador LI Render e a CLI li-cli,
  e verificando o preview ao vivo contra os comps. Use SEMPRE que o usuário quiser
  montar, implementar, criar, customizar ou "deployar" uma loja na Loja Integrada
  a partir de uma identidade de marca / brand-kit; quando mencionar LI Render,
  li-cli, tema da Loja Integrada, litheme, "loja a partir do brand kit", ou
  apontar para um brand-kit/pasta de marca pedindo uma loja — mesmo que não diga
  "tema" ou "LI Render" explicitamente. Também dispara para tarefas parciais
  desse fluxo: reskin de tema, mapear tokens para um tema da Loja Integrada,
  configurar/instalar a li-cli, ou fazer preview/deploy de um tema.
---

# LI Render Store Builder

Pega um **brand-kit já desenhado** (identidade + decisões de commerce + comps) e
produz um **tema da Loja Integrada deployado e testado** na conta de um lojista,
usando o renderizador **LI Render** e a CLI `li-cli`.

É a **terceira skill** do pipeline (1 extrai → 2 desenha → **3 implementa**):
```
brand-kit (Skill 1) → kit + commerce + comps/ (Skill 2) → [ESTA SKILL = 3] → tema no ar
```

O processo é **genérico por conta**: nada da marca, da loja ou da URL é
hardcoded — tudo vem dos inputs. Foi validada ponta-a-ponta em caso real; a
skill serve a qualquer marca/conta.

**Dois contratos compartilhados** governam o que entra e contra o que se
implementa (leia ambos):
- `../shared/brand-kit-spec/brand-kit.spec.md` — o kit que esta skill consome.
- `../shared/litheme-capabilities/litheme-capabilities.spec.md` — o mapeamento
  papel→token DaisyUI, os guardrails e a convenção de re-ancoragem.

## Princípios de design (lê isto primeiro)

Cinco decisões fundam todo o fluxo. Quando estiver em dúvida, volte a elas:

1. **Os comps da Skill 2 são a intenção de design (o alvo); tokens são a fonte do
   estilo.** Os `comps/` mostram *estrutura, seções, hierarquia e aparência* que o
   tema deve atingir. Re-derive os estilos a partir dos **tokens** e adapte para a
   estrutura Liquid + Tailwind/DaisyUI — não copie o CSS do comp verbatim (ele briga
   com o sistema do renderizador) — mas o resultado **tem que bater com o comp**.

2. **Adapte o litheme, não construa do zero.** `theme create` duplica o tema
   padrão (litheme), que já traz todas as rotas, partials e funções que o
   renderizador espera (carrinho, checkout, busca…). Reskine o que existe em vez
   de recriar a base — é mais rápido e muito menos arriscado.

3. **Auto-descoberta com manifesto opcional.** A pasta de marca pode estar
   organizada de qualquer jeito. Descubra os artefatos por heurística (ver
   `references/brand-input-contract.md`); se existir um `brand.manifest.json`,
   ele tem precedência e remove ambiguidade.

4. **O ALVO é o comp da Skill 2; convirja POR COMPONENTE via ORQUESTRAÇÃO.** O
   output **não** é "tokens aplicados" nem "arquivos gerados" — é o **preview ao
   vivo convergindo aos comps**. Mapear tokens é só a **fundação** (cascateia
   cor/raio/fonte); **recolorir o componente do litheme NÃO é convergir ao comp** —
   se a *estrutura* diverge (busca central, nav de categorias, faixa de newsletter…),
   **reestruture o template**. A disciplina disso **não sobrevive a uma thread única
   longa** (o contexto degrada, nada bloqueia declarar pronto no recolor); por isso a
   execução é **orquestrada** (ver `references/implementation-plan.md` §4): **(1)
   fundação global num SUB-AGENTE de fundação → (2) um SUB-AGENTE por COMPONENTE** (contexto
   fresco, escopo de um componente: implementar/reestruturar → screenshot **isolado** →
   self-diff contra `comps/components/<x>` + sweep de contraste → **retornar `edited`**) **→
   (3) verificação INDEPENDENTE (§4f) executa o diff, escreve o artefato e promove
   `edited→locked` no MANIFESTO-ARQUIVO; só então libera o pass de página** (composição dos
   travados) **→ (4) SUB-AGENTE de GATE** independente por página. **O orquestrador (thread
   principal) NÃO edita arquivo nenhum** — fundação inclusa: segura plano + manifesto,
   despacha, sequencia, **recusa** o pass de página com componente não-`locked`. Duas
   barreiras duras: (a) tocou um arquivo = saiu do papel; (b) **`locked` é estado de
   arquivo** (`evidence.diff_vs_comp` preenchido + `verified_by` ≠ `implemented_by`), não um
   veredito de quem fez o trabalho. Diffe
   componente **isolado** (não a página inteira, que esconde divergência atrás de cor
   certa). Declarar "pronto" ao trocar tokens — em PÁGINA **ou** em COMPONENTE — é o
   anti-padrão que esta skill evita. Verifique nas **duas pontas** (litheme é
   mobile-first): mobile (~390) **e** desktop (~1440). **Abra sempre uma aba dedicada**
   (`tabs_create_mcp` → use só esse `tabId` → `tabs_close_mcp` no fim). Promover para
   produção é decisão do usuário.

5. **ESTILO é global-first; ESTRUTURA é fork-by-default. Não confunda os dois eixos.**
   São duas decisões independentes, e juntá-las foi a falha-raiz (o tema "recolorido"
   que ficou preso no nativo):
   - **Estilo (cor/tipo/raio/CTA/ícone) → SEMPRE global.** Consistência vem de editar o
     **sistema** (tokens de cor/raio, headings em `@layer base`, `.btn`/`.input` globais,
     `fill="currentColor"`), nunca de recolorir por bloco. Aqui forks **são** code smell —
     classifique na tabela de estilo de `references/global-styling.md` e rode a
     auto-auditoria (`scripts/audit-theme-styles.sh`) antes de fechar.
   - **Estrutura (seções, colunas, zonas, ordem, layout) → FORK POR DEFAULT.**
     Reestruturar os templates do litheme para casar o comp é **o valor do LI Render**
     (lojas muito customizadas e de alta performance). A maioria dos componentes —
     **header, footer, PDP/buy-box, product-card, seções de home, layout da PLP** — deve
     ser **reestruturada livremente** para bater o comp. Forkar estrutura **não** é code
     smell; é o caminho esperado. **Forçar reskin do nativo limita a flexibilidade que o
     renderizador oferece** — foi o que travou o footer (ficou nas colunas nativas) e a
     PDP (descrição full-width em vez da zona ancorada do comp).
   - 🔒 **Só 3 componentes PRESERVAM o nativo por default** — porque carregam comportamento
     nativo crítico de conversão que recriar quebra: **(1) mini-cart** (desconto
     progressivo, alerta de frete-grátis, cupom, frete por CEP), **(2) prévia de busca ao
     vivo / autocomplete** (carrega prateleira de produtos + sugestões de termo), **(3)
     filtros de busca** (preserve os filtros nativos — o usuário pode *adicionar* itens à
     lateral, mas os filtros só mudam se ele **provocar a mudança explicitamente**). Para
     esses 3: **reskine, não forke** (mude a estrutura só sob pedido explícito). Para
     **todo o resto: forkar/reestruturar é normal e não exige justificativa pesada.**

   > Regra mnemônica: **cor é do sistema; forma é do comp.** "Não recrie estilo por bloco"
   > (verdade) ≠ "não reestruture o componente" (falso, salvo os 3 acima). Se você se pegar
   > preservando a estrutura nativa de header/footer/PDP "porque reskin é mais seguro",
   > parou de implementar o comp — reestruture.

## Definition of Done (toda mudança visual)

Uma mudança só está pronta quando:
- [ ] **Estilo** é **global** (token / `@utility` / `@layer base` / papel), não um fork de
      cor/tipo. **Estrutura** convergiu ao comp (forkada onde o comp diverge do nativo — o
      default, salvo os 3 preserve-native).
- [ ] `scripts/audit-theme-styles.sh <tema>` rodado e os achados de **estilo**
      homogeneizados. (O audit pega forks de *estilo*; não confunda com fork de *estrutura*,
      que é esperado.)
- [ ] **Cada componente crítico convergiu ao comp DELE** (`comps/components/`) —
      **ESTRUTURA E estilo**, por diff do componente **isolado** em desktop e mobile.
      O **sub-agente de componente** (contexto fresco, escopo de um) implementa e devolve
      `edited` + self-diff; a **verificação independente** (§4f) executa o diff e promove a
      `locked` no **manifesto-ARQUIVO** (`.component-manifest.json`). `locked` é **estado de
      arquivo**: `evidence.diff_vs_comp` preenchido **E** `evidence.verified_by` ≠
      `implemented_by` (quem implementou não atesta a própria obra). 🔴 **Recolorir o default
      do litheme NÃO é convergir** — se a *estrutura* ainda é a nativa (footer com colunas
      nativas, PDP com descrição full-width em vez da zona do comp), o componente está
      `edited`, NÃO `locked`. O `diff_vs_comp` tem que listar **divergência de seção/coluna/
      zona/ordem**, não só "cor certa".
- [ ] **Convergiu ao comp de PÁGINA** (composição) — verificado por um **sub-agente de
      GATE independente** (não quem implementou): diff comp×preview por componente E por
      página, mobile (~390) E desktop (~1440), + sweep de contraste programático nos
      estados ocultos. Gate só passa com divergências injustificadas = 0; grava
      `gates.<página>` no manifesto. A passagem é **checável** (todo componente crítico com
      `diff_vs_comp` + `verified_by` ≠ implementador), não confiança de boa-fé.
      🔴 **O diff estrutural lado-a-lado é o produto nº1 do gate e é NÃO-SUBSTITUÍVEL:**
      asserts de DOM, `getComputedStyle` de token e sweep de contraste **complementam**, não
      substituem. "Token certo + `data-testid` existe + parece ok no screenshot" **não é
      pass** — carregue `comps/components/<x>` E o componente no preview **lado a lado** e
      enumere a divergência de **estrutura**. (Falha real: footer/PDP passaram porque o gate
      checou cor/testid em vez de estrutura; o próprio sub-agente do footer **declarou no
      self_diff** que faltava coluna — e foi travado mesmo assim.)
- [ ] ⚠️ **Quando o sub-agente NÃO alcança o preview** (browser singleton/headless
      bloqueado — comum neste ambiente), o `self_diff` dele é **alegação cega**, e o diff
      estrutural recai **inteiramente sobre o gate do orquestrador**. Esse é o **ponto único
      de falha** do protocolo: o orquestrador **não pode** travar em cima do `self_diff` —
      tem que fazer o diff estrutural por componente, ele mesmo, no preview. Se a única visão
      do protocolo (o gate) degrada para checagem de token, o "recolor passa" exatamente como
      o protocolo tenta evitar.
- [ ] **Paridade de migração reportada** (contra `migration-inventory.json`): para
      cada superfície, todo item `must`/`should` `native`/`build-custom` está
      **presente no preview ao vivo** (ou é `drop`/`reintegrate-app` consciente). O
      gate **reporta** as lacunas `must` em destaque — **não hard-blocka** (modo
      só-alerta; `promote` é decisão do usuário). `store-app`/`reintegrate-app` não é
      tema: liste como pendência de configuração de loja, não implemente no tema.
- [ ] **Paridade verificada contra o SITE-FONTE (A), não só contra os comps.** O gate diffa
      o preview×comp (B×C) **e** preview×baseline-renderado-do-fonte (A×C) — usando
      `reference/*.bands.json` + `*.full.png` do kit (regenere com `capture-source.mjs` se
      velho), faixa-a-faixa (faixas/ordem, nav, banners, vitrines, copy de faixa) — ver
      `references/implementation-plan.md` §4f passo 0. Bater a comp não basta se a comp
      divergiu do fonte.
- [ ] **Paridade de CONTEÚDO reportada + aviso de seed.** Catálogo/categorias-da-nav/
      banners/copy/dados-legais da conta-alvo conferidos contra o fonte (`content_loaded`
      no inventário). Se a conta tem **seed genérico** (conteúdo ≠ lojista), o relatório
      diz no topo: *"conteúdo do lojista NÃO carregado — paridade de conteúdo NÃO
      verificável neste preview; só estilo/estrutura verificados"* (§4h). Nunca tratar "o
      seed renderiza" como "o conteúdo migrou".
- [ ] **`theme_mode` implementado como modo único** (sem carve-back, salvo a exceção
      híbrida explícita no kit) — ver `references/global-styling.md`.
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

- **brand-kit** (caminho): idealmente já desenhado pela Skill 2 — com `commerce` +
  `theme_mode` preenchidos, `migration-inventory.json` (o **contrato de paridade**) e
  `comps/` (as maquetes-alvo). Ver os contratos em `../shared/brand-kit-spec/` e
  `../shared/migration-inventory-spec/`. Se `commerce`/`comps`/inventário faltar, ou
  rode a Skill 2 antes, ou aceite uma **pasta de marca rica** como fallback
  (auto-descoberta — ver `references/brand-input-contract.md`).
- **Identidade da conta**: o *handle* da loja (forma a URL de preview
  `https://{loja}-preview.lojas.li`) e o **nome do tema**. Podem vir do `store`
  do brand-kit, mas **confirme com o usuário** — nunca crie/deploye em conta
  inferida em silêncio.
- **CLI + login**: `li-cli` instalada e uma sessão autenticada na conta certa.
  O login abre o navegador (passo humano) — ver Fase 2.
- **Conteúdo do lojista na conta-alvo** (para paridade de conteúdo): catálogo, árvore de
  categorias, banners e dados legais **do fonte** carregados na conta. ⚠️ Conta de teste
  costuma vir com **seed genérico** (produtos/categorias que **não são do lojista**) — nesse
  caso a paridade de **conteúdo** não é verificável no preview; **avise** o usuário e reporte
  como pendência de migração de conteúdo (ver Fase 5 / §4h). Estilo e estrutura ainda são
  verificáveis; conteúdo, não.

Se algo essencial faltar, **pare e pergunte** em vez de assumir.

> ⚠️ **Comece esta skill numa SESSÃO FRESCA.** O pipeline é handoff por arquivo de
> propósito (kit → inventário → comps → tema): os inputs desta skill são **arquivos**, não
> a memória de conversa das Skills 1–2. Rodar 1→2→3 na mesma thread chega na fase mais
> dependente de disciplina (implementação) com o orçamento já gasto e o contexto degradado —
> foi um dos gatilhos da falha de orquestração. Se você acabou de rodar a Skill 2 aqui,
> **abra uma sessão nova** e aponte para os arquivos do kit; não continue na mesma.

## O fluxo (6 fases)

### Fase 1 — Ler o kit desenhado → plano de implementação

Objetivo: entender o que implementar. O kit já vem normalizado (Skill 1) e
desenhado (Skill 2) — aqui você **lê**, não decide design.

1. Ler o `brand.kit.json`: papéis de cor/tipo/raio, fontes, logos, o bloco
   **`commerce`**, o **`theme_mode`** (modo único light/dark) e o **`layout`** (régua
   de largura: contained/fluid-up + full-bleed) — implemente, não re-decida; ver
   `references/implementation-plan.md` Passo 1.
2. Ler o **`migration-inventory.json`** — o **contrato de paridade**. Ele diz o que
   **migrar** por superfície e em que balde (`native` reskina; `build-custom`
   constrói; `store-app`/`reintegrate-app` **não** é tema). É a checklist que o gate
   re-verifica no preview ao vivo.
3. Ler os **`comps/`** — o **alvo de implementação e de QA**. Ditam a
   estrutura/hierarquia de cada superfície; você os reproduz no litheme.
4. Montar o **mapeamento papel→token DaisyUI** (a espinha do reskin) seguindo
   `../shared/litheme-capabilities/litheme-capabilities.spec.md`.
5. **Fallback (pasta de marca rica, sem kit):** auto-descoberta por
   `references/brand-input-contract.md`; se faltar `commerce`/comps/inventário, rode a
   Skill 2 antes — não invente decisões aqui.

### Fase 2 — Conectar a conta e obter o tema base

Ver comandos exatos em `references/li-render.md` (§1).

1. **CLI**: verifique `li-cli --version`. Se ausente, instale o binário do SO
   (macOS/Linux: baixar → `/usr/local/bin/li-cli` → `chmod +x`).
2. **Login** (passo humano): rode `li-cli login`, que abre o navegador. Confirme
   com o usuário que ele autenticou **na conta certa** — esta skill nunca assume
   a loja.
3. **Criar + baixar**: `li-cli theme create <nome>` depois
   `li-cli theme pull <nome>`. Entre na pasta e `npm install`.
4. **Mapear o litheme**: a estrutura real do litheme está capturada em
   `references/litheme-structure.md`. Isso torna execuções futuras determinísticas:
   você saberá exatamente quais arquivos de template/JSON reskins.

### Fase 3 — Planejar (global-first) e mapear a fundação

**Comece escrevendo o PLANO — não saia editando página a página.** Antes de
qualquer edição, siga `references/implementation-plan.md`: mapeie comps+kit+litheme
**uma vez**, decida a **estratégia de tema** (claro / escuro / dark-shell híbrido),
classifique cada elemento dos comps na **árvore de decisão** (token → papel →
componente global → só então per-page) e escreva um plano curto em ordem
**global→local**. Um plano de ~15 linhas evita horas de exploração em loop. Esse é
o antídoto para o anti-padrão "variar página a página".

Com o plano em mãos, injete a identidade no esqueleto do litheme — tokens primeiro,
componentes depois — assim toda página herda a marca de graça:

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
   ⚠️ **Aplicar a família (Tailwind v4) — GREP primeiro:** SE houver `--font-sans` no
   bloco `@theme`, troque-o (o litheme usa o utility `font-sans` = `var(--font-sans)`
   na maioria dos elementos, e `@layer base html` não vence isso); SENÃO, basta
   `@layer base html { font-family }`. Ver o condicional em `references/global-styling.md`.
3. **Logos/símbolos**: copie SVGs/imagens para `assets/` e referencie via
   `{% asset_url "..." %}` (CDN + resize). Use as variantes claro/escuro nos
   contextos certos (header transparente vs. footer escuro, etc.).

### Fase 4 — Executar via orquestração (componentes primeiro, página depois)

Escopo v1: os componentes **header, footer, product-card, buy-box, minicart**
(+ trust-bar/breadcrumb/filtros conforme a loja) e as páginas **home, categoria,
produto**. Mantenha rotas/funções do litheme intactas.

**NÃO reskine "página a página".** Siga o protocolo de orquestração em
`references/implementation-plan.md` §4 (o coração desta skill):
1. **Fundação global** delegada a um **sub-agente de fundação** (tokens/fonte/estratégia
   de tema) — o orquestrador **não edita**. Criar o **manifesto-arquivo** com fundação +
   cada componente como `todo`.
2. **Orquestrador (que não edita arquivo nenhum)** despacha **um sub-agente por componente**
   (contrato/DoD/schema de retorno em §4d → devolve `edited` + self-diff); a **verificação
   independente** executa o diff e promove a `locked` (`verified_by` ≠ `implemented_by`); o
   orquestrador **recusa** o pass de página enquanto houver componente crítico não-`locked`.
3. **Pass de página** = composição dos `locked` no JSON da página (≤10/container) +
   seções únicas de página que tenham estrutura própria viram seu próprio ciclo de
   componente. Receitas em `references/page-json-recipes.md`.
4. **Sub-agente de gate** por página antes da revisão humana (§4f).

Regras práticas:
- Não invente dados — toda informação de produto/categoria vem das funções de
  dados do renderizador. Se uma seção precisa de dados, declare a função.
- Reuse os partials existentes do litheme onde possível; reskine/reestruture em vez
  de duplicar.
- Cada sub-agente tem **escopo de UM componente**; mudança global vai em
  `global_rules_added` no retorno e o orquestrador reconcilia (evita brigas no `theme.css`).

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
3. **Diff de paridade contra o SITE-FONTE (A), faixa-a-faixa** — cruze o preview contra o
   **baseline renderado** do kit (`reference/*.bands.json` + `*.full.png`; regenere com
   `capture-source.mjs` se velho): mesmas faixas/ordem, nav, banners, vitrines, copy de faixa.
   Não basta bater os comps — a comp pode ter divergido do fonte (§4f passo 0).
4. **Paridade de conteúdo + aviso de seed** — confira catálogo/categorias/banners/dados-legais
   contra o fonte. Se a conta tem seed genérico (≠ lojista), **avise**: "conteúdo não carregado
   — paridade de conteúdo não verificável aqui" e liste a pendência de import (§4h). Não
   declare pronto com produtos/categorias que não são do lojista.
5. Conserte na fonte e re-verifique. Ver o checklist completo em
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

- `../shared/brand-kit-spec/brand-kit.spec.md` — **o kit que esta skill consome**
  (cores/tipo/logo/raio + `commerce` + `comps/`).
- `../shared/litheme-capabilities/litheme-capabilities.spec.md` — **mapa
  papel→token DaisyUI**, guardrails e convenção de re-ancoragem. A espinha do reskin.
- `references/implementation-plan.md` — **COMECE AQUI a implementação**: planejamento
  global-first + árvore de decisão (token → papel → componente global → per-page) **e
  o protocolo de ORQUESTRAÇÃO** (§4: orquestrador que não edita + 1 sub-agente por componente +
  manifesto-arquivo + sub-agente de gate). O antídoto para "explorar/variar página a
  página" **e** para a degradação de contexto na thread longa.
- `references/li-render.md` — CLI `li-cli` (instalação + todos os comandos) e o
  renderizador (page settings JSON, componentes, partials, store routes, funções
  de dados, filtros e tags Liquid). **A base técnica.**
- `references/brand-input-contract.md` — **fallback**: auto-descoberta de uma
  pasta de marca rica (quando não há brand-kit). O caminho canônico é o brand-kit.
- `references/page-json-recipes.md` — JSONs de página + esqueletos de template
  Liquid para home, categoria, produto e partials.
- `references/global-styling.md` — **estilizar global-first** (Tailwind v4 +
  DaisyUI v5): reskin por MODO (light/dark único), ordem de ataque (tokens de cor/raio
  → headings → `.btn`/`.input`), sistema tipográfico, os dois tipos de CTA, e o accent
  que falha WCAG. Leia antes de qualquer pass de estilo.
- `references/dark-hybrid-exception.md` — **só a EXCEÇÃO** híbrido chrome≠conteúdo
  (shell escuro + tiles claros): a receita de carve-back de contraste. Leia **apenas**
  se o kit pediu o híbrido; o default (modo único) está em `global-styling.md`.
- `references/litheme-structure.md` — estrutura real de arquivos do litheme
  (estrutura real do litheme capturada).
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
- `assets/brand.manifest.example.json` — exemplo do manifesto de **input** (marca,
  opcional — auto-descoberta da pasta de marca).
- `assets/component-manifest.example.json` — exemplo do manifesto de **COMPONENTES**
  (a fonte da verdade do que está `locked`; o orquestrador lê/escreve — ver §4c).
