# Estrutura real do litheme

> Capturado de um `li-cli theme create` + `theme pull` reais (conta ora-lingerie,
> litheme v49, CLI `20260519.2`). Esta é a árvore concreta que o `create`
> duplica — a base que a skill reskina. **Corrige** vários pontos onde a doc
> pública descreve só o contrato abstrato.

## Correções importantes vs. a doc pública

| A doc dizia | A realidade |
|---|---|
| Rotas `"/{product}"`, `"/{category}"` | Colchetes: `path: "/[product]"`, `/[category]`, `/[brand]`, `/[search]`, `/[institutional-page]` |
| "página home" | Arquivo `pages/index.json`, `path: "/"` |
| CSS via `package.json` que já existe | **Não vem `package.json` no pull** — criar (conteúdo no topo de `theme.css`) |
| `global_data` no topo | Quase tudo é `data` **por componente**; `global_data` aparece só em `[search]`/`[institutional-page]` |
| Tailwind + DaisyUI genérico | Tailwind v4 (`@import "tailwindcss"`) + DaisyUI v5 com bloco `@plugin "daisyui/theme"` nomeado `litheme` |

## Árvore (raiz)

```
ora/
├── theme.json                # { _version:"1", name, environment:"development" }
├── pages/                     # 24 arquivos: 7 rotas + 17 partials
├── templates/                 # ~118 .liquid, profundamente componentizados
└── assets/
    ├── style/theme.css        # FONTE do CSS (editar aqui) — Tailwind v4 + DaisyUI
    ├── style/theme.min.css    # build de saída (gerado)
    └── scripts/*.webc.js      # 18 web components (carousel, minicart, sku, etc.)
```
> `package.json` e `node_modules/` **não** vêm no pull — você cria/instala (ver Fase 2).

## Rotas → arquivos de página

| Rota (`path`) | Arquivo | Monta (top-level) |
|---|---|---|
| `/` | `pages/index.json` | header, main (banners + 3 shelves: Highlights/Newest/BestSelling), footer |
| `/[product]` | `pages/[product].json` | header, imagens, pricing, opções, buy-together, descrição, reviews, footer |
| `/[category]` | `pages/[category].json` | header, breadcrumb, **`pages/search/index.liquid`** (listagem), footer |
| `/[brand]` | `pages/[brand].json` | igual categoria (reusa search listing) |
| `/[search]` | `pages/[search].json` | listagem; usa `global_data` com `search_products` |
| `/[institutional-page]` | `pages/[institutional-page].json` | conteúdo institucional; `global_data` + `get_institutional_page` |
| `/contact-us` | `pages/contact-us.json` | formulário de contato |

**Partials** (`pages/partial_*.json`, path `/partial/...`): reviews, payments,
recommendations, buytogether, notifyme, onrequest (produto); cart coupon,
product-suggestion, shipping-calculator (carrinho); search suggestions /
most-searched; newsletter subscribe / popup; header menu-mobile; menu
product-suggestion; alert cookies-accept; components sac. Já prontos — **reusar**.

## Forma de uma página (exemplo, `index.json`)

- `_version: "3"`, `$schema` oficial, `path`, e `html.{head,body}.components[]`.
- Componentes: `container` (com `tag`/`class`) aninha; `template` renderiza um
  `.liquid` com `data` (funções) e `properties` (parâmetros do template).
- **Dados por componente** via `data`:
  ```json
  { "type": "template", "template": "shared/components/banner/index.liquid",
    "properties": { "position": "full" },
    "data": { "banners": { "function": "get_banners",
              "args": { "location": "home", "position": "full" } } } }
  ```
- **Reuso por properties**: `pages/home/shelf.liquid` aparece 3× com
  `properties.title`/`shelf_id` e `data.shelf_result = get_products` com presets
  `HighlightedProducts` / `NewestProducts` / `BestSellingProducts` (`size: 8`).
- `head` monta `shared/components/head/{style-general,seo,script-general}.liquid`.
- Fim do body: `shared/components/header/...`, `shared/components/footer/...`,
  `shared/utils/index.liquid`.

## Funções de dados observadas em uso

`get_store`, `get_products` (com `preset`/`size`), `get_banners`
(`args: {location, position}` — location: home/product/category/brand/search;
position: full/stripe/showcase/mini), `get_category_tree`, `get_current_product`,
`get_current_category`, `get_current_brand`, `search_products`,
`search_suggestions`, `get_product_reviews`, `get_product_installments`,
`get_buy_together`, `get_freight_conditions`, `get_payment_conditions`,
`get_institutional_pages`, `get_institutional_page`.

## `assets/style/theme.css` — o ponto de reskin

Topo do arquivo (comentário) traz o `package.json` a criar:
```json
{
  "name": "litheme", "version": "0.0.0",
  "scripts": {
    "build:css": "npx @tailwindcss/cli -i assets/style/theme.css -o assets/style/theme.min.css --minify",
    "watch:css": "npx @tailwindcss/cli -i assets/style/theme.css -o assets/style/theme.min.css --watch"
  },
  "devDependencies": {
    "@tailwindcss/cli": "^4.1.18", "@tailwindcss/typography": "^0.5.19",
    "daisyui": "^5.5.18", "tailwindcss": "^4.1.18"
  }
}
```
Estrutura:
```css
@import "tailwindcss" source(none);
@source "../../pages"; @source "../../templates"; @source "../scripts";
@plugin "@tailwindcss/typography";
@plugin "daisyui" { themes: "litheme" --default; }

@plugin "daisyui/theme" {
  name: "litheme"; default: true; color-scheme: "light";
  --root-bg: #ffffff;
  --color-base-100: #f5f6f8; --color-base-200: #f1f2f4; --color-base-300: #e2e5e9;
  --color-base-content: #101828;
  --color-primary: #0846ef;   --color-primary-content: #ffffff;
  --color-secondary: #0846ef; --color-secondary-content: #ffffff;
  --color-accent: #ffffff;    --color-accent-content: #101828;
  --color-neutral: #ffffff;   --color-neutral-content: #101828;  /* body bg = neutral */
  --color-info: #cfd2d6;  --color-success: #27a47d;
  --color-warning: #fcb700; --color-error: #ff6265;  /* + *-content */
  --radius-selector: .375rem; --radius-box: .75rem; --radius-field: 2rem;
  --size-field: .25rem; --size-selector: .25rem; --border: 1px; --depth: 1; --noise: 1;
}

@layer base { html { @apply scroll-smooth; font-family: "DM Sans", sans-serif; } }
/* + ~430 linhas de overrides de utilities DaisyUI: btn, card, input, collapse,
   alert, badge, breadcrumbs, container, floating-bar-style, modal, etc. */
```

**Onde mexer no reskin (Fase 3):**
1. Bloco `@plugin "daisyui/theme"` → mapear paleta da marca nos slots semânticos
   (`base-*`, `primary`, `secondary`, `accent`, `neutral`, funcionais). Isso
   cascateia para todos os templates.
2. `@layer base html { font-family }` → fonte base da marca; adicionar
   `@font-face` (apontando os arquivos via caminho/`asset_url`) para as famílias.
3. `--radius-*` e overrides pontuais se a marca pede outra "temperatura" de forma.

> `body { background-color: var(--color-neutral) }` — `neutral` é o fundo da
> página, não um cinza escuro. Mapear com cuidado.

> ⚠️ **Tailwind v4 compila só as classes encontradas nos `@source` no momento do
> build.** Se você editar um template e usar uma classe utilitária **nova** (ex.:
> `h-9`, `md:h-11`) que não aparecia em nenhum outro lugar, ela **não estará** no
> `theme.min.css` antigo → o elemento renderiza sem aquele estilo (vimos um
> `<img>` colapsar para 0×0). Sempre rode `npm run build:css` após adicionar
> classes novas — ou deixe `npm run watch:css` rodando em dev (recompila e o
> `sync` sobe o CSS automaticamente). Verifique no preview, não só no JSON.

> ⚠️ **Largura/responsividade global — o litheme trava em 1280px.** O tema define
> uma utility `container` (em `theme.css`) usada por **quase tudo** (shelf,
> banners, header, footer, breadcrumb, newsletter, menu, institucional):
> ```css
> @utility max-w-container { max-width: var(--container-7xl, 100%); } /* 80rem = 1280px */
> @utility container { @apply max-w-container w-full mx-auto px-4; }   /* só 16px de gutter */
> ```
> Em telas largas isso deixa margem morta e prateleiras/banners "limitados". Para
> um layout fluido que **cresce com a viewport** (como o `index.html` da marca,
> que usa gutter `clamp(20px,5vw,72px)` sem cap rígido), redefina o `container`:
> ```css
> @utility max-w-container { max-width: var(--ora-container-max, 120rem); } /* ~1920px */
> @utility container { @apply max-w-container w-full mx-auto; padding-inline: var(--ora-gutter); }
> ```
> E ajuste os componentes que **sobrescrevem** o padding do container com utilities
> Tailwind (elas vencem o `padding-inline`): o shelf usa `px-0 md:px-4` → troque por
> **`max-md:px-0`** (mobile full-bleed p/ o carrossel; no desktop herda o gutter do
> container). Verifique em ≥1 largura larga e ≥1 mobile. Mudança em `container`
> propaga globalmente — é o lugar certo para "revisar a responsividade de uma vez".
>
> **Consistência: seções custom devem reusar o MESMO `container`.** Ao criar
> seções próprias (ex.: faixas de degradê full-bleed), não reimplemente gutter/
> max-width por conta (`padding-inline: gutter` solto, ou `width: 96%`) — isso
> desalinha do resto, sobretudo acima do cap. Padrão correto: o `<section>`
> carrega o **fundo full-bleed** (degradê/cor) + padding vertical; o **conteúdo**
> fica dentro de um `<div class="container">` (a régua universal). O fundo sangra
> de ponta a ponta, mas todo conteúdo (manifesto, wordmark, banners, shelf) alinha
> no mesmo gutter e no mesmo cap em qualquer largura. Verificado: as 4 seções
> ficaram com `contentLeft` idêntico (= gutter) após o ajuste.

> **Logo da marca no header:** o `shared/components/header/index.liquid` mostra o
> logo configurado nas *settings da loja* (`ctx.store.logo`) e cai para
> `ctx.store.name` em **texto** quando não há. Para um tema de marca, troque o
> fallback de texto por um `<img src="{% asset_url 'brand/<logo>.svg' %}">`. O
> `asset_url` resolve para `cdn.awsli.com.br/public/render/theme_assets/<conta>/<tema>/...`
> (com hash de cache) — confirmado funcionando com caminho sem barra inicial.

## Header / menu / minicart / floating-bar (subsistema)

Estrutura do litheme: `header/index.liquid` (linha do logo + busca/conta/cart),
`components/menu/` (barra de categorias **separada, abaixo** do logo, com
mega-menu + dropdowns por hover via CSS `.categories-container*`/`.mega-menu`),
`components/floating-bar/index.liquid` (barra fixa **mobile**, `md:hidden`),
`components/minicart/` (drawer via checkbox `#header-minicart-drawer-toggle` +
`minicart-drawer.webc.js` + HTMX p/ `routes.cart_minicart` e `cart_item/.../update|remove`),
`components/search/` (input desktop **ou** drawer mobile), `components/navbar/`
(drawer de menu mobile, conteúdo async via `/partial/header/menu-mobile`).

**Reestruturar p/ logo central + categorias inline (modelo do index.html):**
- Reescrever `header/index.liquid` como **grid 3 colunas** (`1fr auto 1fr`):
  categorias à esquerda, logo no centro, utilidades à direita. No mobile, esconder
  nav+utils (`@media max-width:767px`) — sobra o logo; a floating-bar assume.
- As categorias precisam de dados no header: **ligar `categories: get_category_tree`
  ao componente `header/index.liquid`** no JSON de **todas** as páginas (script
  Python iterando `pages/*.json`) e **remover** o componente `menu/index.liquid`
  (agora redundante). Header existe em todas as rotas → editar as 7 páginas.
- **Utilidades como gatilhos de texto** ("Buscar"/"Sacola"): os drawers de busca,
  minicart e nav são renderizados por `floating-bar/index.liquid` **fora** do
  container `md:hidden` → existem em **qualquer viewport**. Logo, um
  `<label for="search-drawer-toggle">` / `<label for="header-minicart-drawer-toggle">`
  no header desktop abre os mesmos drawers (não precisa do input inline). O badge
  do carrinho usa `<span class="header-minicart-totalitems">` (o webc atualiza).
- **Floating-bar**: manter a interação do litheme; restilizar só a utility
  `floating-bar-style` (era pill branco glassy → linho translúcido + hairline
  argila + ícones espresso). Tudo herda DaisyUI, então o minicart/drawers já vêm
  on-brand; polir labels (ex.: header "SUA SACOLA" mono uppercase, borda argila).

## Templates: como o estilo cascateia

Os `.liquid` usam classes semânticas DaisyUI (`bg-base-100`, `text-base-content`,
`text-primary`, `btn`, `card`, `collapse`, `breadcrumbs`…), `{% asset_url %}`,
`{% render '...' %}`, HTMX (`hx-get/post/trigger/swap`) e web components
(`<product-card>`, `<minicart-drawer>`, `<carousel-embla>`…). Por isso a troca
de tokens reskina sem tocar em centena de templates. Ajustes de **layout**
específicos da marca (hero, wordmark no footer, hover do card) são edições
cirúrgicas em poucos templates (`pages/home/*`, `shared/components/header/index`,
`shared/components/footer/*`, `shared/components/product-card/*`).

## Libs externas (carregadas nos templates head/utils)

HTMX 2.x, Embla Carousel 9 (+plugins), FontAwesome (sprite SVG). Não precisam ser
instaladas — vêm por CDN/asset.

## Gotchas de página / asset / deploy (verificados na prática)

Ao adicionar seções à home (ou qualquer página), atenção:

- **`maxItems: 10` por container.** O schema do renderizador limita cada container
  a **10 componentes** (`html.body.components`, `<main>`, `<header>`, etc.). Adicionar
  seções além disso faz o `sync` rejeitar a página com *"JSON is valid against no
  schemas from 'oneOf'"*. Solução: **distribua** (ex.: seções editoriais full-bleed
  podem ser filhas diretas do `body`, ao lado de `<main>`, em vez de dentro dele) ou
  **agrupe** num sub-container. Conte os componentes antes.
- **`sync` valida o JSON contra o schema (estrito); `push` é mais leniente.** Quando
  o sync diz "valid against no schemas from oneOf", baixe o schema
  (`https://cdn.awsli.com.br/public/render/schema/v1.json`) e valide localmente com
  `jsonschema` (Draft7) — itere os erros por componente p/ achar o caminho exato
  (foi assim que o `maxItems:10` apareceu). O schema também define:
  `data`/`global_data` exigem `function` de um **enum** fixo; `path` de um enum/regex;
  `_version` ∈ {"2","3"} (string); `properties` pode ser qualquer objeto (arrays ok).
- **`asset_url` retorna o caminho CRU se o asset não está no servidor** → o browser
  resolve relativo ao domínio (`/brand/x.jpg`) e dá **404**. Suba os assets ANTES de
  referenciá-los. Sinal: `naturalWidth:0` + `currentSrc` no domínio do preview (não
  em `cdn.awsli.com.br`).
- **Asset binário novo precisa de evento de *create* p/ o `sync` subir.** Arquivos
  copiados ANTES do sync iniciar não sobem (sync não faz upload inicial; e `touch`/
  `cp`-mesmo-conteúdo não basta — ele observa conteúdo). Force um create: `rm` o
  arquivo, espere **> o intervalo do sync**, depois `cp` de volta, espere de novo.
  Confirme "Asset created: ..." no log do sync.
