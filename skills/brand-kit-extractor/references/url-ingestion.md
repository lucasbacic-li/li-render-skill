# Captura a partir de uma URL

Objetivo da Fase 1: reunir matéria-prima crua (baseline renderado, HTML, CSS, fontes,
logo) sem ainda interpretar. A interpretação é a Fase 2 (`color-distillation.md`).

> **Passo 0 — capture o BASELINE RENDERADO (obrigatório, antes de tudo).** Rode
> `scripts/capture-source.mjs` por superfície (home + 1 PLP + 1 PDP):
> ```bash
> node ../scripts/capture-source.mjs --url "https://loja.com.br/"        --out <kit>/reference --label home
> node ../scripts/capture-source.mjs --url "https://loja.com.br/<cat>"   --out <kit>/reference --label plp
> node ../scripts/capture-source.mjs --url "https://loja.com.br/<prod>"  --out <kit>/reference --label pdp
> # mobile: repita com --mobile (ex.: --label home --mobile → home.mobile.* se você ajustar o label)
> ```
> Saída por superfície: `<label>.rendered.html` (DOM **pós-JS**), `<label>.bands.json`
> (a **torre de faixas** em ordem, com modo claro/escuro + texto + imgs por faixa) e
> `<label>.full.png` (render inteiro). **Por que primeiro:** é o único artefato que prova
> o que de fato renderiza — faixas injetadas por JS (stripe de aviso, USP, banners por
> template-literal) **não aparecem no `curl`**. O `bands.json` é a baseline que a Skill 2
> inventaria; o `full.png` é o que o gate humano vê. Detalhe do script no fim deste doc.

> **Passo 1.0 — detecte a plataforma.** `curl` o HTML e identifique a
> plataforma (Loja Integrada, WooCommerce, Nuvemshop, Tray, Shopify, VTEX…) pela
> tabela em [`platforms/README.md`](platforms/README.md). Cada plataforma guarda a
> marca num lugar diferente — o doc específico é um **atalho de alta fidelidade**.
> Plataforma desconhecida → siga o método genérico abaixo + `color-distillation.md`.

## O que coletar

| Sinal | Onde | Como |
|---|---|---|
| HTML da home | URL raiz | WebFetch |
| HTML de PDP + categoria | seguir 1 link de produto e 1 de categoria | WebFetch |
| CSS | `<style>` inline + `<link rel="stylesheet">` | WebFetch das folhas |
| Fontes | `@font-face`, `<link href="fonts.googleapis…">`, `font-family` computado | parse do CSS/HTML |
| `theme-color` | `<meta name="theme-color">` | parse do `<head>` |
| Favicon | `<link rel="icon">` | baixar |
| Logo | `<img>` no header, ou SVG inline, ou `<a class="logo">` | baixar/extrair |
| **Estrutura + evidência visual** | **render pós-JS** (faixas, modo, ordem) | **`capture-source.mjs` → `bands.json` + `full.png` + `rendered.html`** (Passo 0) |

## Notas de método

- **`curl` do HTML + dos CSS é a fonte real de COR; WebFetch é para SEMÂNTICA.**
  WebFetch retorna o conteúdo em markdown (ótimo p/ entender seções/tom/categorias,
  ver Fase 2), mas **não** expõe as cores cruas. Para cor/fonte/raio, baixe o HTML
  e as folhas de estilo com `curl` (use um `User-Agent` de browser) e parseie os
  hexes por contexto (`background`/`color`/`border`). Use captura de tela (Chrome
  conectado) só para `reference/` e p/ confirmar hover/gradientes.
- **O render ao vivo é a fonte da verdade da ESTRUTURA da home** (assim como já é da
  FONTE/tipografia — ver `platforms/loja-integrada.md`). O HTML cru serve para **achar e
  baixar assets**; a **composição das faixas** (quais existem, em que ordem, claras ou
  escuras) já vem capturada no `bands.json` do Passo 0 — não da raspagem de `<img>`/`url(...)`
  nem de uma descrição escrita lendo o HTML. ⚠️ Asset que aparece no HTML mas **não** numa
  faixa do `bands.json` é decoração de menu/dropdown/footer — **não** é faixa da home. Cada
  faixa do `bands.json` já traz **posição** (ordem + altura) + **texto** + **imgs**; a Skill 2
  lê daí a **função aparente** (hero/banner-de-marca/vitrine/grid-de-categoria/editorial).
- **Ignore o CSS de framework; vá no CSS de MARCA.** Uma loja carrega várias
  folhas; a identidade está nas **hand-edited do lojista**, não no framework.
  Conte a frequência de hex *só* nos arquivos de marca (senão os cinzas do
  framework dominam).
- **Fontes do Google** aparecem como `<link href="https://fonts.googleapis.com/css2?family=...">`.
  Parsear o nome da família dali já resolve `source: "google"`.
- **Logo**: preferir SVG (inline no HTML ou `.svg` linkado). Se só houver PNG
  (comum), baixar o de maior resolução, registrar `logos.primary` apontando o PNG
  e **marcar em `_uncertain`** (revetorizar p/ SVG é ideal — nitidez/recolor).
- **Respeitar robots/ToS**: é extração de identidade visual pública de um cliente
  que pediu o serviço; não rastrear o site inteiro — só home + 1 PDP + 1
  categoria bastam para o kit.

> Dicas específicas por plataforma (onde está o CSS de marca, padrões de URL de
> logo/favicon, gotchas) vivem em [`platforms/`](platforms/README.md). Ex.: lojas já
> na **Loja Integrada** expõem o CSS de marca do lojista diretamente — ver
> [`platforms/loja-integrada.md`](platforms/loja-integrada.md) (✅ verificado).

## Saída desta fase
Um conjunto de artefatos crus em memória/temp: blobs de CSS, lista de
`font-family` por seletor-chave (`body`, `h1`, `h2`, `a`, `button`), cores com
contagem de frequência, e os arquivos de logo/favicon/screenshots baixados.

## Troubleshooting
- **Site JS-only/SPA** (HTML inicial quase vazio, conteúdo montado por JS): é
  **exatamente** o caso que o `capture-source.mjs` resolve — ele roda o JS e o
  `rendered.html`/`bands.json` trazem o conteúdo real. O `curl` aqui só serve p/ cor/assets.
- **Cloudflare / 403 / desafio**: o `curl` simples é barrado. O headless do
  `capture-source.mjs` (User-Agent de browser) costuma passar; se persistir, aumente o
  `--virtual-time-budget` ou capture pelo Chrome conectado e salve o HTML manualmente.
- **CSS em `rgb()`/`oklch()`/`hsl()` sem `#hex`**: normalize para **hex** antes de
  registrar no kit (o contrato espera hex). Converta cada cor computada.
- **Chrome/Chromium ausente** (o `capture-source.mjs` não roda): **não** caia para uma
  descrição de HTML cru como baseline. Registre a lacuna, marque `_uncertain` o que não
  deu pra confirmar ao vivo, e **avise que a Skill 2 não poderá rodar o loop de comp** até
  o baseline renderado existir. Defina `CHROME_BIN` se o Chrome estiver em caminho não-padrão.

## O script `capture-source.mjs` (a captura do baseline)

`scripts/capture-source.mjs` — Node + Chrome headless, **zero deps npm**. Por superfície grava:

| Artefato | O que é | Quem consome |
|---|---|---|
| `<label>.rendered.html` | o **DOM depois do JS** (faixas injetadas inclusas) | diff de estrutura/texto da Skill 2 |
| `<label>.bands.json` | a **torre de faixas** em ordem: cada uma com `{i, tag, classes, top, height, bg, mode (light/dark), heading (texto), imgCount, imgs, bgImages}` | inventário + critério A do loop de comp |
| `<label>.full.png` | screenshot **full-page** | gate humano + diff de layout |

**Contrato do `bands.json`** (o que a Skill 2 pode assumir):
- `bands` está **em ordem de corpo** (topo→base) — a sequência É a paridade de ordem.
- `mode` é o fundo **da faixa** (seção). ⚠️ Cards/tiles claros sobre uma seção escura
  aparecem como `mode: dark` na faixa (o claro é dos filhos) — para o nível de card, cruze
  com o `full.png`. Os dois canais são complementares: `bands.json` pega faixa/ordem/conteúdo;
  `full.png` pega o claro/escuro fino e o craft visual.
- `heading`/`imgs` são a **prova de conteúdo** — produto/copy reais para o inventário citar
  como `evidence` (índice da faixa), nunca memória.

Flags: `--url` (obrig.), `--out` (obrig., a pasta `reference/`), `--label` (home/plp/pdp),
`--mobile` (viewport 390×844 + UA mobile). Detecta o Chrome em caminhos comuns ou via `CHROME_BIN`.
