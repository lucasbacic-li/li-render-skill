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

## Inputs necessários

- **URL** da marca/loja (input primário da v1). Pergunte se não foi dada.
- **Identidade da conta** (opcional aqui): `handle` e `theme_name` da Loja
  Integrada, se o parceiro já souber. Pode ficar em branco — a Skill 3 confirma.
- **Pasta de saída**: onde gravar o kit (default: `./<marca>-kit/`).

## O fluxo (5 fases)

### Fase 1 — Capturar
Buscar o HTML/CSS da URL e capturar evidência visual. Ver
`references/url-ingestion.md`.
- **Detecte a plataforma primeiro** (Loja Integrada, WooCommerce, Nuvemshop, Tray,
  Shopify, VTEX…) e siga o doc de dicas em `references/platforms/` — é um atalho de
  alta fidelidade (cada plataforma guarda a marca num lugar diferente).
- `curl` da home (UA de browser) + dos **CSS de marca** — é a fonte real de cor.
  WebFetch da home serve para a **semântica** (seções/tom/categorias), não para cor.
- Coletar: CSS de marca, `<link>` de fontes (Google), favicon, logo (PNG/SVG).
- Screenshot das páginas para `reference/` (referência humana, se houver navegador).

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
- [ ] `assets/`: logo (+ favicon) baixados; `imagery/` com 1–3 amostras se houver;
      `fonts/` **só** se a fonte for self-host (Google Fonts não gera arquivo).
- [ ] `reference/`: **ao menos 1 screenshot da origem** (home) como referência
      humana. Sem navegador disponível, registre a lacuna explicitamente (não
      deixe a pasta silenciosamente vazia).
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
- `references/url-ingestion.md` — como capturar HTML/CSS/fontes/logo de uma URL.
- `references/platforms/` — **dicas de extração por plataforma** (LI, WooCommerce,
  Nuvemshop, Tray, Shopify, VTEX): onde mora a marca, padrões de logo/favicon,
  gotchas. Detecte a plataforma e abra o doc certo antes de destilar.
- `references/color-distillation.md` — heurísticas de destilação cor→papel e
  identificação de tipografia/raio.
- `references/kit-output.md` — como gravar a pasta do kit (json + tokens.css +
  GUIDELINES.md + assets).
