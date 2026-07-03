# Extração — Loja Integrada (tema clássico)  ✅ verificado

O caso mais comum de migração para o LI Render: lojistas **já na Loja Integrada**,
no tema clássico (`estrutura/v1`), querendo a versão LI Render. O CSS de marca do
lojista é **diretamente legível** — atalho de ouro.

## Detecção

No HTML da home, qualquer um destes:
- assets em `cdn.awsli.com.br`
- caminhos `static/loja/estrutura/v1/` (CSS/JS do framework clássico)
- string "Loja Integrada" no rodapé/meta

A **conta** (id numérico) aparece nas URLs de asset: `cdn.awsli.com.br/<x>/<conta>/...`
(ex.: `.../<x>/<conta>/...`, onde `<conta>` é o id numérico da loja). Guarde — abre
logo/favicon/CSS.

## Onde mora a marca

Em ordem de sinal (do mais hand-edited ao compilado):

1. **`https://<loja>/tema.css`** — overrides editados pelo lojista. Costuma declarar
   **vars semânticas** (ex.: `--cor-secundaria: #444`), a **fonte de título**
   (`.titulo { font-family: ... }`), a fonte do `body`, e cores de barras
   (`.barra-inicial`, newsletter). Alto sinal, arquivo pequeno.
2. **`https://<loja>/avancado.css`** — CSS avançado custom (reset, ajustes finos).
3. **`https://cdn.awsli.com.br/<x>/<conta>/arquivos/style-*.min.css`** — o tema
   compilado da conta. É onde os hexes de marca aparecem **em volume** → conte a
   frequência de hex AQUI (e por contexto: `background`/`color`/`border`).
4. Ignore `static/loja/estrutura/v1/css/*` (all.min, bootstrap, style-responsive) —
   é **framework**, não marca.

## Logo e favicon

- Logo: `cdn.awsli.com.br/<conta>/logo/<hash>.png` (no HTML, `<img class="logo">`).
- Favicon: `cdn.awsli.com.br/<conta>/favicon/<hash>.png` (`<link rel="icon">`).
- A URL aceita **prefixo de resize** (`/400x300/<conta>/logo/...`); para o original,
  **omita** o prefixo. O do `<img class="logo">` quase sempre é **PNG** (raster).
- ⚠️ **PROCURE O VETORIAL ANTES de marcar `_uncertain`.** Muitos temas LI guardam o
  logo **SVG** em `arquivos/` (nomes tipo `logo-header-<marca>-desktop.svg`,
  `logo-<marca>.svg`) — referenciado por `<img src>`/`background-image`/`style` (não
  só no `<img class="logo">`). `grep -oiE 'arquivos/[^"'\'' )]*logo[^"'\'' )]*\.svg'` no
  HTML. Se houver SVG, use-o como `logos.primary` (nitidez/recolor) e **não** marque
  raster em `_uncertain`. Caiu pra PNG só se não existir SVG.

## Imagens da loja — colha TUDO em `arquivos/` (não 1-3 amostras)

Numa migração, **as imagens que o lojista subiu SÃO o conteúdo a migrar** (banners de
hero, tiles de categoria, blocos editoriais). Elas vivem todas em
`cdn.awsli.com.br/<x>/<conta>/arquivos/*.png|jpg|webp` — e a Skill 2 precisa **delas
reais** nos comps (placeholder = falha de paridade). Como você já está raspando, colha
**o conjunto inteiro de uma vez** (extraia de `<img src>` **e** dos `url(...)` em
`style`/CSS — muitos banners são `background-image`):

```bash
# todos os assets de marca (banners/tiles/editorial) — não filtre por "amostra"
grep -oiE "cdn.awsli.com.br/[0-9]+/<conta>/arquivos/[^\"' )]+\.(png|jpg|jpeg|webp|svg)" home.html \
  | sort -u | while read u; do curl -sSL -A "$UA" -e "https://<loja>/" "$u" -O; done
```

Também baixe **um punhado de imagens de PRODUTO** (a Skill 2 usa nos cards do comp):
`cdn.awsli.com.br/300x300/<x>/<conta>/produto/<id>/<hash>.jpg` — **sempre com Referer**
(`-e "https://<loja>/"`) senão o CDN devolve placeholder 1×1 (proteção de hotlink). A URL
real está no `<img ... class="imagem-principal" src=...>`, não no `data-src` (template
`--PRODUTO_IMAGEM--`).

> Objetivo: a Skill 2 monta os comps **a partir de `<kit>/assets/` + `reference/`** sem
> reabrir o site. Subextrair aqui (e a Skill 2 re-raspar) é a redundância que mais
> queima token no fluxo — faça a captura completa **uma vez**.

⚠️ **Baixar TODOS ≠ marcar todos como faixa da home.** Assets em `arquivos/` aparecem
**tanto no corpo da home quanto em decoração de mega-menu/dropdown/footer** (ex.:
`imagem-drop-*`, ícones de console como `nes/snes/gameboy`). Baixe todos como referência,
**mas só marque como faixa da home os que o render ao vivo mostra NO CORPO** (scroll de
cima a baixo — ver `../url-ingestion.md`); para os demais, anote a origem (menu/dropdown/
footer). Anti-padrão real: **tiles de console que eram decoração do dropdown foram
descritos como uma faixa da home que não existia → a skill seguinte desenhou uma seção
fantasma e a paridade quebrou.**

## Fontes

- Google Fonts via `<link href="fonts.googleapis.com/css2?family=...">`. O `tema.css`
  costuma pôr a fonte de título em `.titulo` e deixar o `body` em Arial.
- ⚠️ **O `<link>` do `<head>` é um DECOY frequente.** O tema compilado da conta
  (`style-*.min.css`) costuma forçar **outra família** com `font-family:…!important`,
  e essa família pode ser carregada por um widget/JS (não aparece no `<head>`). A
  contagem de `font-family` no CSS também engana (mistura ícones/framework). **A
  ÚNICA fonte da verdade é o render ao vivo:** rode na página
  `getComputedStyle(document.querySelector('h1'|'body'))` **e**
  `[...document.fonts].map(f=>f.family+':'+f.weight)` — a 1ª diz a família que
  realmente pinta, a 2ª prova que ela está carregada. Só então resolva para o
  Google Fonts (cuidado com famílias renomeadas no Google — o nome no site pode
  diferir do nome no catálogo; confirme o nome canônico).

## Comando de extração (receita)

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
curl -sSL -A "$UA" "https://<loja>/" -o home.html                 # HTML
# conta + assets
grep -oiE "cdn.awsli.com.br/[0-9]+/[0-9]+/" home.html | head      # descobre <x>/<conta>
# CSS de marca
curl -sSL -A "$UA" "https://<loja>/tema.css" -o tema.css
curl -sSL -A "$UA" "https://<loja>/avancado.css" -o avancado.css
curl -sSL -A "$UA" "https://cdn.awsli.com.br/<x>/<conta>/arquivos/style-*.min.css" -o style.css
# cores por frequência (só nos arquivos de MARCA)
cat tema.css avancado.css style.css | grep -oiE "#[0-9a-f]{6}|#[0-9a-f]{3}\b" \
  | tr 'A-F' 'a-f' | sort | uniq -c | sort -rn | head -20
# papel de uma cor (background vs color vs border) — troque <hex> por uma cor sua
grep -oiE "[a-z-]+:[^;{]*#<hex>" style.css | head
# logo + favicon (original, sem resize)
curl -sSL -A "$UA" "https://cdn.awsli.com.br/<conta>/logo/<hash>.png" -o logo.png
```

## Gotchas

- A `style.min.css` é grande (centenas de KB) e mistura framework com marca; sempre
  **conte por contexto** e cruze com o `tema.css` (que diz quais cores o lojista
  realmente escolheu).
- Muitas lojas têm **dois accents** (ação + preço/disponibilidade) — ex.: uma cromática
  para o CTA/ação e outra para preço/disponibilidade. Registre `accent` **e**
  `accent_secondary` (ver `../color-distillation.md`).
- Cores de SEO/keyword na tagline (`og:site_name`, `<title>`) não são voz de marca;
  use o conteúdo real (banners, seções) para tom.

## Exemplo (caso real, anonimizado)

Padrão recorrente numa loja LI clássica **dark-chrome**: logo PNG raster, raio
dominante na faixa "soft" (~10px), e o whack-a-mole de papéis abaixo. Os detalhes
de marca foram omitidos — o que importa é a **técnica** que cada item ensina.

**Lição de fonte (corrige a 1ª passada):** o `<head>` carregava **uma fonte decoy**,
mas o render real usava **outra família** — confirmado ao vivo por
`getComputedStyle`+`document.fonts` (`h1` peso **900**, `body` 400). A 1ª passada
confiou no `<link>` e registrou a fonte errada. **Regra:** a fonte do `<head>` pode
ser decoy; só o render ao vivo decide.

**Lição de cor (confirmada por screenshot, não pela frequência de CSS):**
- **Chrome escuro** (top-bar/header/nav/hero/home/footer) + **conteúdo claro**
  (PLP/PDP). A contagem de hex dava o claro como dominante e teria errado o
  `surface_dark`. Confirme cada cor por `getComputedStyle`, não pela frequência.
- **Duas cromáticas com jobs distintos:** uma = **conversão** (botão de compra,
  preço PDP, categoria ativa) → `accent`/`--color-primary`; outra = **marca/
  navegação** (top-bar, busca, links, parcelas) → `accent_secondary`. Muitas lojas
  LI clássicas têm **chrome escuro + 2 accents**; não force um só.
- Preço aparecia numa cromática na PDP e na outra na PLP (inconsistência da loja
  antiga) — escolha o papel pelo **botão de compra**, não pela média.

**Captura (resolvido):** use `scripts/capture-source.mjs` (Chrome headless) — ele grava o
baseline renderado **direto no FS** (`reference/<label>.rendered.html` + `.bands.json` +
`.full.png`). Não dependa do Chrome MCP para arquivar (o `save_to_disk` dele grava fora do FS
do agente — bom para os *olhos* e interação, ruim para baseline). E **nunca** substitua o
baseline por um `README.md` descrevendo as telas: numa loja LI clássica, faixas como a **tarja
de aviso do topo**, a **faixa de USP** e os **banners por template-literal** são injetados por
JS e **não aparecem no `curl`** — só o render (o `bands.json`) as enxerga.
