# Receitas de página — JSON + esqueletos Liquid

Receitas para as páginas do escopo v1. São **esqueletos didáticos** simplificados.
Para a estrutura **real** que o litheme já entrega (rotas, templates e funções
de verdade), use sempre `litheme-structure.md` como fonte — na prática você
**reskina** os JSONs/templates existentes em vez de criar do zero. Nota de rota:
o litheme usa colchetes (`/[category]`, `/[product]`), não chaves.

Princípio recorrente: o **JSON declara dados + estrutura**; o **Liquid renderiza**.
Dados sempre vêm de funções nomeadas — nunca hardcode catálogo.

## Home (`path: "/"`)

```json
{
  "$schema": "https://cdn.awsli.com.br/public/render/schema/v1.json",
  "_version": "3",
  "path": "/",
  "global_data": {
    "store": { "function": "get_store" },
    "banners": { "function": "get_banners" },
    "highlights": { "function": "get_products", "args": { "preset": "HighlightedProducts" } },
    "news": { "function": "get_products", "args": { "preset": "NewestProducts" } }
  },
  "html": {
    "head": { "components": [
      { "type": "template", "template": "head_meta.liquid" },
      { "type": "style", "href": "{% asset_url 'style/theme.min.css' %}" }
    ] },
    "body": { "components": [
      { "type": "template", "template": "partials/header.liquid" },
      { "type": "template", "template": "home/hero.liquid", "data": { "banners": { "function": "get_banners" } } },
      { "type": "template", "template": "home/vitrine.liquid", "data": { "products": { "function": "get_products", "args": { "preset": "HighlightedProducts" } } } },
      { "type": "template", "template": "home/editorial.liquid" },
      { "type": "template", "template": "partials/footer.liquid" }
    ] }
  }
}
```

Esqueleto de `home/vitrine.liquid` (tokens como verdade, estrutura vinda do HTML
de referência):

```liquid
<section class="vitrine">
  <h2 class="serif">{{ section_title | default: "Destaques" }}</h2>
  <div class="vitrine-grid">
    {% for product in products %}
      {% render 'partials/product_card.liquid', product: product %}
    {% endfor %}
  </div>
</section>
```

## Categoria (`path: "/{category}"`)

```json
{
  "$schema": "https://cdn.awsli.com.br/public/render/schema/v1.json",
  "_version": "3",
  "path": "/{category}",
  "global_data": {
    "store": { "function": "get_store" },
    "category": { "function": "get_current_category" },
    "products": { "function": "get_products_by_category", "args": { "size": 24 } },
    "tree": { "function": "get_category_tree" }
  },
  "html": {
    "head": { "components": [ { "type": "template", "template": "head_meta.liquid" } ] },
    "body": { "components": [
      { "type": "template", "template": "partials/header.liquid" },
      { "type": "template", "template": "category/listing.liquid" },
      { "type": "template", "template": "partials/footer.liquid" }
    ] }
  }
}
```

## Produto (`path: "/{product}"`)

`get_current_product` injeta o produto automaticamente na rota de produto — não
passe id. Recomendado em `global_data` para todos os componentes acessarem.

```json
{
  "$schema": "https://cdn.awsli.com.br/public/render/schema/v1.json",
  "_version": "3",
  "path": "/{product}",
  "global_data": {
    "store": { "function": "get_store" },
    "product": { "function": "get_current_product" },
    "installments": { "function": "get_product_installments" },
    "related": { "function": "get_product_recommendations" }
  },
  "html": {
    "head": { "components": [ { "type": "template", "template": "head_meta.liquid" } ] },
    "body": { "components": [
      { "type": "template", "template": "partials/header.liquid" },
      { "type": "template", "template": "product/detail.liquid" },
      { "type": "template", "template": "product/related.liquid" },
      { "type": "template", "template": "partials/footer.liquid" }
    ] }
  }
}
```

## Partial minicart (`path: "/partial/minicart"`)

Partials exigem `_version: "3"`, usam `partial` no lugar de `html`, e o path
começa com `/partial/`. Combinam com HTMX e as store routes (`/store/cart/...`).

```json
{
  "$schema": "https://cdn.awsli.com.br/public/render/schema/v1.json",
  "_version": "3",
  "partial": {
    "path": "/partial/minicart",
    "components": [
      { "type": "template", "template": "partials/minicart.liquid",
        "data": { "cart": { "function": "get_cart" } } }
    ]
  }
}
```

No header, o minicart se auto-atualiza via HTMX:

```liquid
<div id="minicart" hx-get="/partial/minicart" hx-trigger="cartUpdated from:body">
  {% render 'partials/minicart.liquid', cart: cart %}
</div>
```

## Card de produto — shape real do litheme (verificado)

O litheme já traz o card completo em
`templates/shared/components/product-card/` (index + components: image, title,
rating, options, pricing, badges). **Reskine, não recrie.** Campos reais do
produto (de `get_products`/`get_current_product`):

- **`product.preview_images`** — array de caminhos de imagem. `[0]` é a principal;
  **`[1]` serve para o hover**. A URL final é
  `ctx.static_domain + '/<W>x<H>' + preview_images[i]` (ex.: `/700x350...`).
- `product.url`, `product.name`, `product.code`, `product.id`, `product.available`.
- Preço via o componente `pricing.liquid` (`product.price.selling`,
  `product.price.upon_request`, etc.) — use o componente, não monte à mão.
- `product.skus` / `product.options` / `variations` para variações.

### Hover packshot→2ª foto (sem JS custom)

O `<product-card>` já tem `class="group"`. O web component `product-card.webc.js`
só troca imagem por **variação de SKU** (radios `data-variation`), **não** no
hover. Para o efeito de hover, adicione uma 2ª `<img>` sobreposta que faz
crossfade via `group-hover` — em
`product-card/components/image.liquid`, dentro do container `relative`:

```liquid
{%- if product.preview_images.size > 1 -%}
  {%- assign img_url_hover = product.preview_images[1] -%}
  <img src="{{ img_url_prefix }}{{ img_url_hover }}" alt="" aria-hidden="true"
    class="absolute inset-0 w-full h-full object-cover rounded-box opacity-0
           transition-opacity duration-500 group-hover:opacity-100" loading="lazy" />
{%- endif -%}
```

e na imagem principal acrescente `transition-opacity duration-500
group-hover:opacity-0` (condicionado a ter 2ª foto). Rebuild o CSS (classes
`group-hover:*` novas) e verifique. O efeito só é forte se o catálogo tiver uma
2ª foto contrastante (ex.: modelo vestindo) — na Ora, a 2ª foto da Calcinha 02
era uma model shot e o crossfade ficou dramático.

**Card no estilo editorial (aproximação do index.html):** reestruture o
`product-card/index.liquid` numa célula com borda hairline (cor argila) + fundo
areia-clara, mídia com `aspect-ratio` fixo, e info em **duas linhas com
divisórias** (`border-top`): nome (grotesca) + rating · preço (mono) + ação
"+ Sacola". Preserve o que é funcional: o link-overlay `data-id="product-url"`,
o add-to-cart `hx-post` (mova do botão circular para o link "+ Sacola", mantendo
`data-id="product-buy-url"` p/ o webc atualizar na variação), os swatches de SKU
(`relative z-1` p/ ficarem clicáveis acima do overlay) e as métricas.
**Fotos:** use `object-fit:cover` para fotos de catálogo (JPG com fundo próprio)
— `object-contain` só fica limpo com packshot PNG recortado, senão aparece a
borda do retângulo da foto. Troque as pílulas de badge por uma tag mono sutil
(outline, fundo translúcido) em vez de cores semânticas berrantes.

## Tipografia — espelhar os papéis da marca, não inventar

Mapeie a fonte **base do `<html>`** para a fonte de corpo da marca (na Ora,
`Geist Mono` — datilografia, como no `index.html`), headings estruturais para a
grotesca (Host Grotesk), e reserve a serif (Lusitana) para momentos de display
via classes explícitas (`.ora-serif`). Conferir contra o(s) HTML(s) de
referência — não escolher fontes por conta própria (ex.: não usar a grotesca no
corpo só porque "lê melhor"; a marca decidiu mono).

---

## Adicionar seções editoriais de marca à home (padrão verificado)

Quando a marca tem layouts de referência (ex.: a home `index.html` da Ora com
amanhecer/anoitecer, manifesto, vitrine, comunidade), o jeito que funcionou:

1. **Portar a camada de design da marca para `assets/style/theme.css`** como CSS
   puro (no fim do arquivo): paleta crua em `:root` (`--ora-espresso`, …),
   papéis tipográficos (`.ora-serif/.ora-grotesk/.ora-eyebrow/.ora-mono`),
   gradientes (`--ora-grad-amanhecer/anoitecer`), grão (data-URI feTurbulence) e
   as classes de cada seção (`.ora-daybreak*`, `.ora-closing*`). São regras CSS
   normais — entram no build independentemente do scan do Tailwind. Os tokens
   semânticos DaisyUI continuam sendo a cor "de sistema"; essa camada é o "kit"
   editorial que as seções consomem (tokens = verdade, HTML de ref = intenção).
2. **Criar um template por seção** (`templates/pages/home/<secao>.liquid`,
   `templates/shared/components/footer/closing.liquid`) usando essas classes +
   `{% asset_url 'brand/<arquivo>' %}` para logos/símbolos.
3. **Montar no `pages/index.json`** inserindo `{"type":"template","template":"…"}`
   na árvore de componentes (no container `main` para seções de conteúdo, no
   `footer` para o fechamento). Editar o JSON via script (ex.: Python carregando/
   inserindo/salvando) é mais seguro que casar strings.
4. **Rebuildar CSS** (`npm run build:css`) e deixar o `sync` subir. O `sync`
   detecta **templates novos** e modificações de página/CSS (visto: "Template
   created", "Page modified"). Verificar no preview.

Seções estáticas (manifesto, editorial, comunidade, categorias) usam copy +
imagens da marca; a **vitrine** usa dados reais via `get_products` (o litheme já
traz `pages/home/shelf.liquid`). Para o hover packshot→modelo do card é preciso
2 imagens por produto — checar se o catálogo tem antes de prometer esse efeito.

---

## Banner custom: hero editorial com card de produto sobreposto (verificado)

O banner padrão da LI (`shared/components/banner/index.liquid`) **não** permite um
card de produto flutuando sobre a foto editorial. Quando a marca pede isso (ex.: o
`index.html` da Ora — foto sangrada + `product-card` da vitrine flutuando), monte
um **banner custom** (template próprio, carrossel via `carousel-embla`).

Padrão que funcionou (Ora):

1. **Imagem = painel; produto = JSON.** A foto/título/link de cada slide vêm de
   `get_banners` (`location:home, position:full`) — **editáveis no painel**. O
   produto de cada slide é fixado por id no JSON da página. Como o banner não
   modela "produto associado", o pareamento é **por índice**: `banner[i]` ↔ o
   i-ésimo produto declarado.
2. **Uma data function de produto POR SLOT** (não uma só com vários ids — o filtro
   `product_ids` casa só 1 id/chamada; ver `li-render.md`). No `pages/index.json`,
   no lugar do componente banner full, declare:
   ```json
   { "type": "template", "template": "pages/home/hero.liquid",
     "properties": { "product_ids": [101, 202] },
     "data": {
       "banners":  { "function": "get_banners",  "args": { "location": "home", "position": "full" } },
       "hero_p0":  { "function": "get_products", "args": { "filter": { "product_ids": "101" }, "paginate": false } },
       "hero_p1":  { "function": "get_products", "args": { "filter": { "product_ids": "202" }, "paginate": false } }
     } }
   ```
3. **Template** itera `data.banners`; para o slide `i`, pega o produto em
   `data["hero_p"+i].products[0]` (lembre: `.products`!) e renderiza o card real:
   ```liquid
   {%- for banner in banners -%}
     <div class="embla__slide ...">
       <img class="ora-hero__photo" src="{{ ctx.static_domain }}/1920x1080{{ banner.image }}" ...>
       {%- assign hero_product = data['hero_p' | append: forloop.index0].products[0] -%}
       {%- if hero_product -%}
         <aside class="ora-hero__peek">
           {% render 'shared/components/product-card/index', product: hero_product, forloop: forloop %}
         </aside>
       {%- endif -%}
     </div>
   {%- endfor -%}
   ```
   Reusa o `carousel-embla` (slides `.embla/.embla__container/.embla__slide`,
   `data-loop/autoplay/show-progress`, dots `[data-carousel-dot]`+`.dot-progress`)
   e o `product-card` existente — **nada novo de carrossel/card**.
4. **Nº de slides = nº de banners full no painel.** Carrossel/dots só aparecem com
   ≥2 banners. Mais banners que slots de produto → slide só editorial (fallback ok).
5. **Altura vs. header + sneak-peek.** O header do litheme é **estático e opaco**
   (não overlay): um hero `100svh` estoura a dobra pela altura do header → o card
   cai abaixo da viewport. Padrão usado: duas variáveis —
   `--ora-hero-offset` (= stripe + header; ~113px desktop, ~92px mobile na Ora) e
   `--ora-hero-vh` (altura visível alvo). `height: calc(var(--ora-hero-vh) - var(--ora-hero-offset))`.
   Com `--ora-hero-vh: 100svh`, header + hero preenchem a tela (**sem peek**).
   Baixar o valor cria o "sneak-peek" da próxima seção: `100svh - X = X de peek`.
   Decisão da Ora (verificada): **banner 100% por padrão**, e **só em telas largas
   (`@media (min-width:1920px)`) `--ora-hero-vh: 90svh`** → ~10svh de peek (em
   monitores grandes a home revela um pouco do conteúdo seguinte; em telas menores
   fica cheia). Esconda o card no mobile
   (`@media (max-width:767px){ .ora-hero__peek{display:none} }`) — lá a foto assume.
6. **Não editável pelo painel** (decisão consciente): o pareamento produto↔slide
   vive no JSON. Trade-off aceito por fidelidade ao design da marca.

### Navegação por títulos = progress bar (reusa o webc, sem JS custom)

Variante (Ora): em vez de dots, uma **lista de títulos** navega entre os slides, e a
**baseline de cada título é a progress bar** que enche até o slide trocar. Reusa o
contrato do `carousel-embla` **sem JS novo**:

- Cada título é um `<button data-carousel-dot>` → o webc liga **clique → goTo(index)**
  e alterna a classe **`.active`** no botão do slide corrente.
- Com `data-show-progress="true"` o webc injeta uma `.dot-progress` **no 1º filho**
  do botão e a anima 0→100% no `data-autoplay-delay` do slide ativo. Então o **1º
  filho** do botão deve ser a *pista* (baseline full-width, `position:absolute` no
  rodapé), e a `.dot-progress` (que é `absolute inset-0 w-0 bg-primary`) a preenche.
  Override a cor: `.<pista> .dot-progress{ background-color: var(--token-claro) }`.
- Ordem dos filhos do botão: **pista primeiro** (recebe a `.dot-progress`), depois
  número + título. Estilos ativo/inativo (cor do texto/baseline) saem da `.active`.
- O nº de linhas = nº de slides; o webc casa índice da linha ↔ índice do slide.

**Mobile (adaptação verificada):** a lista vertical não cabe a 24px. Padrão que
funcionou = **segmentos que expandem**: `nav` vira `flex-direction:row; align-items:flex-end`;
linhas inativas colapsam p/ um stub curto (`flex:0 0 ~26px`, número/título `display:none`,
só a pista visível); a linha **`.active` expande** (`flex:1 1 auto`) e mostra o título
(menor, ~16px) acima da barra que enche. Preserva título editorial + progresso, cabe
em 390px, e cada stub continua clicável. Card flutuante segue escondido no mobile.

**Demo com 1 banner só:** se o painel ainda tem 1 banner `full`, dá p/ exercitar o
carrossel repetindo a imagem: dirija os slides por uma lista `properties.slides`
(`[{title, product_id}]`) e use `banners[i] | default: banners.first` p/ a imagem —
quando entrarem banners reais, cada slide passa a usar o seu sem mudar o template.

### Transição FADE → controlador dedicado (Embla é slide-only)

O `carousel-embla` só faz **slide** (translada um container flex). Pra **fade** não
serve — fade exige slides empilhados (mesma posição) com crossfade de opacidade, o
que quebra a medição de snaps do Embla. Solução (Ora): um web component próprio e
minúsculo `<ora-hero>` (`assets/scripts/ora-hero.webc.js`), **sem libs novas, sem
download**:
- slides `position:absolute; inset:0; opacity:0` empilhados; o controlador alterna
  `.is-current` (opacity 1 + `transition:opacity`) → crossfade.
- autoplay por `setTimeout(data-delay)`; `next()`/clique → troca o `.is-current` e o
  `.is-active` da linha de título; **pausa no hover** (guarda o tempo restante).
- progresso: a `.ora-hero__navfill` da linha ativa roda uma `@keyframes` (use
  **`transform:scaleX(0→1)`**, não `width:%`) reiniciada a cada slide.
- A estrutura da nav (pista + fill, ativo/inativo) é a mesma; só as classes mudam
  (`.is-active`/`.ora-hero__navfill` no lugar de `.active`/`.dot-progress` do webc).

**Gradiente de proteção de contraste:** sobre a foto, um scrim
`linear-gradient(to top, espresso ~78% 0%, espresso ~42% 24%, transparent 58%)`
(`.ora-hero__scrim`, `inset:0` por slide) ancora o contraste da nav/título/card.

**Mobile — nav ACIMA do floating bar:** a floating-bar do litheme é `fixed bottom-5`
(~20px) + ~56px de altura (≈ topo em ~76px). A nav do hero (absolute no rodapé)
colide com ela; ancore acima: `@media (max-width:767px){ .ora-hero__nav{ bottom:96px } }`.

> ⚠️ **QA — animações CSS congelam em aba OCULTA.** A aba dirigida por automação fica
> `document.visibilityState === 'hidden'` → `document.timeline` para, e toda animação
> CSS trava no frame 0 (a progress bar aparece vazia no screenshot), **embora
> `setTimeout` continue** (os slides avançam). Não é bug. Verifique o mecanismo por
> `el.getAnimations()` (name/playState) + `document.visibilityState`, não pela
> animação no screenshot. Mesma família de limitação do resize/viewport no preview.
