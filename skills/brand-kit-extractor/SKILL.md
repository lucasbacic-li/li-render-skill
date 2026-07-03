---
name: brand-kit-extractor
description: >-
  Extrai um brand-kit leve e legível por agente a partir de uma URL de loja (e,
  futuramente, de um link do Figma) — paleta com papéis semânticos, tipografia,
  logos, raio, voz e amostras de imagem — gravado no formato brand-kit que as
  skills de desenho (store-design-composer) e implementação
  (li-render-store-builder) de loja consomem. Use SEMPRE
  que o usuário quiser gerar/criar guidelines de marca, um "brand kit", tokens de
  marca ou a base de estilo de um tema a partir de um site/URL existente ou de um
  arquivo de design; quando apontar uma URL de loja pedindo "extrair a marca",
  "criar os guidelines", "pegar as cores e fontes do site", ou preparar o input
  de marca para montar uma loja na Loja Integrada. Também dispara para tarefas
  parciais: destilar paleta de um site, identificar tipografia/logo de uma marca,
  ou montar o brand.kit.json.
---

# Brand Kit Extractor

Transforma a presença pública de uma marca — hoje uma **URL**, depois um **Figma** —
num **brand-kit** leve: a base de identidade (cor, tipo, logo, raio, voz) num
formato estruturado e construível que a skill `li-render-store-builder` consome
para implementar o tema.

O contrato de saída é compartilhado e versionado: **leia
`../shared/brand-kit-spec/brand-kit.spec.md` antes de produzir qualquer coisa.**
Esta skill é o *produtor* desse contrato.

## Princípios de design (lê isto primeiro)

1. **O kit é a interface, não o objetivo.** O valor está em produzir um
   `brand.kit.json` que a Skill 3 consiga implementar sem adivinhar. Otimize para
   *papéis semânticos limpos* (surface/ink/accent…), não para reproduzir o CSS
   cru do site.

2. **Texto estruturado = construível; raster = referência.** Cores, tipos e logo
   viram `.json`/`.css`/`.svg`. Screenshots e fotos vão para `reference/` e
   `assets/imagery/` como referência humana — nunca como fonte de build.

3. **O scrape entrega um RASCUNHO.** Um site real tem CSS ruidoso (dezenas de
   cinzas, fontes de terceiros, ícones). Seu trabalho é **destilar** para uma
   paleta pequena (9 papéis obrigatórios + até 2 opcionais de accent secundário) e
   2–3 famílias tipográficas. Onde não tiver
   confiança, registre em `_uncertain` — não finja precisão.

4. **Sempre confirme antes de fechar.** Apresente o rascunho ao parceiro numa
   tela (paleta + tipos + logo + voz) e corrija com ele. É barato aqui, caro
   depois que a Skill 3 já reskinou o tema.

5. **Commerce não é seu.** O bloco `commerce` (mini-cart/PLP/PDP) sai **`null`**.
   Essas superfícies não existem numa home/brand file e são uma decisão de design —
   a **Skill 2** (`store-design-composer`) as deriva, elicita com o cliente e
   materializa em comps. Não tente preencher.

6. **O baseline da migração é o RENDER, não o HTML cru.** O `curl` entrega o HTML
   **pré-JS** — não diz o que de fato pinta no corpo (faixas injetadas por JS, modo
   claro/escuro por região, ordem real). A estrutura/conteúdo da loja vêm do
   **render ao vivo**, capturado de forma **reproduzível e arquivável** por
   `scripts/capture-source.mjs` (Chrome headless → `rendered.html` pós-JS +
   `bands.json` (torre de faixas com modo/texto/imgs) + `full.png`). Esse trio é a
   **baseline ground-truth** que a Skill 2 diffa — sem ele, o loop de comp da Skill 2
   **não computa "0 divergências"** (falha-fechado). O `curl` continua sendo a fonte de
   **cor e download de assets**, não de estrutura.

7. **Delegue a captura pesada a um sub-agente; a thread principal decide e confirma.**
   A Fase 1 (rodar o `capture-source.mjs`, raspar CSS de cor, baixar TODOS os assets) é o
   maior consumo de contexto da skill — e é leitura/extração, não decisão. Despache um
   **sub-agente de captura** que roda a captura + o scrape e devolve um **resumo compacto**
   (paleta crua candidata, fontes, lista de assets baixados + caminhos, **resumo do
   `bands.json`**) em vez de encher a thread principal com CSS cru. A thread principal fica para a **destilação
   cor→papel**, os `_uncertain` e a **confirmação com o parceiro** (Fase 4) — que precisa de
   uma cabeça coerente e do diálogo, não dá pra delegar. Regra geral do kit: leitura/varredura
   pesada vai pra sub-agente que retorna artefato magro; decisão e conversa ficam na principal.

## Inputs necessários

- **URL** da marca/loja (input primário da v1). Pergunte se não foi dada.
- **Identidade da conta** (opcional aqui): `handle` e `theme_name` da Loja
  Integrada, se o parceiro já souber. Pode ficar em branco — a Skill 3 confirma.
- **Pasta de saída**: onde gravar o kit (default: `./<marca>-kit/`).

## O fluxo (5 fases)

### Fase 1 — Capturar
Capturar o **baseline renderado** (obrigatório) + o HTML/CSS/assets. Ver
`references/url-ingestion.md`.
- **PRIMEIRO, capture o baseline renderado** de cada superfície (home + 1 PLP + 1 PDP) com
  `node scripts/capture-source.mjs --url <URL> --out <kit>/reference --label home` (e
  `--mobile` para o mobile). Gera `reference/<label>.rendered.html` + `.bands.json` + `.full.png`.
  **É o passo que não pode faltar** — é a baseline que a Skill 2 inventaria e diffa.
- **Detecte a plataforma** (Loja Integrada, WooCommerce, Nuvemshop, Tray,
  Shopify, VTEX…) e siga o doc de dicas em `references/platforms/` — é um atalho de
  alta fidelidade (cada plataforma guarda a marca num lugar diferente).
- `curl` da home (UA de browser) + dos **CSS de marca** — é a fonte real de cor.
  WebFetch da home serve para a **semântica** (seções/tom/categorias), não para cor.
- Coletar: CSS de marca, `<link>` de fontes (Google), favicon, logo (**procure o SVG
  vetorial**, não só o PNG — ver platform doc).
- **CAPTURA COMPLETA NUMA PASSADA (você é a única skill que precisa raspar).** Baixe
  **TODOS os assets de marca reais** que a Skill 2 vai usar nos comps — não "1-3
  amostras": **todos os banners/tiles/editorial** que o lojista subiu (extraia de
  `<img src>` **e** dos `url(...)` de `style`/CSS — muitos são `background-image`) + um
  punhado de **imagens de produto** (com Referer, ver platform doc). Subextrair aqui faz a
  Skill 2 reabrir o site e re-raspar — a **maior redundância de token** do fluxo.
- **`reference/` é a baseline renderada, não uma descrição:** o `bands.json` já traz a home
  **faixa a faixa NA ORDEM do corpo** (cada faixa com posição, modo claro/escuro, texto e imgs) e
  o `full.png` mostra o render inteiro. A Skill 2 inventaria **a partir desses artefatos** — não
  de uma descrição textual que alguém escreveu lendo o HTML (isso é circular e perde faixas
  injetadas por JS). Um `reference/README.md` opcional pode **resumir** o `bands.json`, mas **nunca
  o substitui** como baseline de diff. ⚠️ Distinga **conteúdo do body** de **decoração de
  menu/dropdown/footer**: uma faixa só conta se aparece no `bands.json` (corpo renderizado) — asset
  que só vive em menu/dropdown/footer **NÃO é faixa da home**; anote a origem.
- **Sem navegador ⇒ captura INCOMPLETA, não "cai pro textual".** Se o `capture-source.mjs` não
  puder rodar (sem Chrome/Chromium), registre a lacuna **explicitamente** e avise que a Skill 2
  **não pode rodar o loop de comp** (sem baseline renderado não há contra o quê diffar). Nunca
  produza uma descrição textual de HTML cru e a trate como baseline.

### Fase 2 — Destilar
Reduzir o ruído a papéis. Ver `references/color-distillation.md`.
- **Cores**: agrupar as cores mais frequentes (fundo, texto, links/botões,
  bordas) → atribuir aos 9 papéis do contrato. Marcar incertos.
- **Tipografia**: identificar família de display/heading/body/mono a partir de
  `font-family` de h1/h2/body; resolver para Google Fonts quando possível.
- **Raio**: amostrar `border-radius` de botões/cards → `sharp|soft|round`.
- **Logo**: preferir SVG; baixar e normalizar para `assets/`.

### Fase 3 — Montar o kit
Escrever a pasta no formato do contrato. Ver `references/kit-output.md`.
- `brand.kit.json` (com `commerce: null` e `_uncertain` preenchido).
- `tokens.css` (espelho construível dos papéis + tipos).
- `GUIDELINES.md` (resumo legível).
- `assets/` (logo, favicon, fontes self-hosted, imagery) e `reference/`.

### Fase 4 — Confirmar
Apresentar o rascunho numa tela: amostras de cor com papéis, par tipográfico,
logo, raio, voz. Destacar os itens `_uncertain`. Corrigir com o parceiro e
regravar. **Não pule esta fase.**

### Fase 5 — Entregar
Resumir o que foi extraído e **apontar o caminho do kit para a Skill 2**:
> "Kit pronto em `./<marca>-kit/`. Para desenhar a loja (decisões de commerce +
> maquetes), rode a skill `store-design-composer` apontando para esta pasta."

## Definition of Done

O entregável **não** é "li o site" — é uma **pasta de kit completa e confirmada**.
Só está pronto quando:

- [ ] `brand.kit.json` válido contra `../shared/brand-kit-spec/brand-kit.spec.md`:
      os 9 papéis de cor obrigatórios + papéis de tipo; `commerce: null`;
      `_uncertain` lista honestamente o que foi inferido.
- [ ] `tokens.css` e `GUIDELINES.md` gerados e **consistentes** com o JSON.
- [ ] `assets/`: logo (**SVG vetorial se existir** no site, não só o PNG) + favicon;
      `imagery/` com **TODOS os banners/tiles/editorial reais** do fonte (não 1-3
      amostras) + um punhado de **imagens de produto**; `fonts/` **só** se self-host.
      Critério: a Skill 2 consegue montar os comps **sem reabrir o site** — se ela
      precisar re-raspar um asset, a captura aqui falhou.
- [ ] `reference/`: o **baseline renderado** de cada superfície (home + 1 PLP + 1 PDP),
      gerado por `scripts/capture-source.mjs`: `<label>.rendered.html` (DOM pós-JS) +
      `<label>.bands.json` (torre de faixas NA ORDEM, com modo claro/escuro, texto e imgs) +
      `<label>.full.png` (render inteiro). É a baseline que a Skill 2 inventaria e diffa
      (distinguindo conteúdo do body de decoração de menu/dropdown/footer). **Sem navegador,
      registre a lacuna explicitamente** e sinalize que a Skill 2 não poderá rodar o loop de
      comp — nunca substitua o baseline por uma descrição de HTML cru.
- [ ] **Todo caminho de asset citado no JSON existe em disco** (logo/favicon/
      imagery). Sem pastas órfãs vazias no kit.
- [ ] Rascunho **apresentado e confirmado** com o parceiro (Fase 4).

## Limites da v1
- **Só URL.** A porta **Figma** (variáveis limpas via MCP do Figma) é a próxima
  iteração — mesmo contrato de saída, captura diferente (Fases 1–2).
- O kit é sempre um rascunho confirmado por humano, não verdade absoluta.
- Não toca em conta da Loja Integrada nem na `li-cli` — isso é da Skill 3.

## Arquivos de referência

- `../shared/brand-kit-spec/brand-kit.spec.md` — **o contrato de saída**. A fonte
  da verdade do formato. Leia primeiro.
- `../shared/brand-kit-spec/examples/brand.kit.example.json` — exemplo completo.
- `scripts/capture-source.mjs` — **a captura do baseline renderado** (Chrome headless →
  `rendered.html` + `bands.json` + `full.png` por superfície). O passo obrigatório da Fase 1.
- `references/url-ingestion.md` — como capturar o baseline renderado + HTML/CSS/fontes/logo de uma URL.
- `references/platforms/` — **dicas de extração por plataforma** (LI, WooCommerce,
  Nuvemshop, Tray, Shopify, VTEX): onde mora a marca, padrões de logo/favicon,
  gotchas. Detecte a plataforma e abra o doc certo antes de destilar.
- `references/color-distillation.md` — heurísticas de destilação cor→papel e
  identificação de tipografia/raio.
- `references/kit-output.md` — como gravar a pasta do kit (json + tokens.css +
  GUIDELINES.md + assets).
