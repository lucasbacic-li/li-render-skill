# Receitas de página — JSON + esqueletos Liquid

Receitas para as páginas do escopo v1. São **esqueletos didáticos** simplificados.
Para a estrutura **real** que o litheme já entrega (rotas, templates e funções de
verdade), use sempre `litheme-structure.md` como fonte — na prática você **reskina**
os JSONs/templates existentes em vez de criar do zero. Nota de rota: o litheme usa
colchetes (`/[category]`, `/[product]`), não chaves.

Princípio recorrente: o **JSON declara dados + estrutura**; o **Liquid renderiza**.
Dados sempre vêm de funções nomeadas — nunca hardcode catálogo. A **aparência** (cor/
tipo/escala) vem dos papéis do brand-kit e do **comp** da Skill 2. Convenção de
nomes: tokens `--bk-*`, papéis `.bk-*` (ver `global-styling.md`).

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

Esqueleto de `home/vitrine.liquid` (tokens como verdade, estrutura vinda do comp):

```liquid
<section class="vitrine">
  <h2 class="bk-display">{{ section_title | default: "Destaques" }}</h2>
  <div class="vitrine-grid">
    {% for product in products %}
      {% render 'partials/product_card.liquid', product: product %}
    {% endfor %}
  </div>
</section>
```

## Categoria (`path: "/[category]"`)

```json
{
  "$schema": "https://cdn.awsli.com.br/public/render/schema/v1.json",
  "_version": "3",
  "path": "/[category]",
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

## Produto (`path: "/[product]"`)

`get_current_product` injeta o produto automaticamente na rota de produto — não
passe id. Recomendado em `global_data` para todos os componentes acessarem.

```json
{
  "$schema": "https://cdn.awsli.com.br/public/render/schema/v1.json",
  "_version": "3",
  "path": "/[product]",
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

### PDP em duas zonas — fotos empilhadas + rail de decisão fixo (padrão)

Quando o comp da PDP (`commerce.pdp.gallery: stacked`) pede *scroll de fotos com a
decisão parada no view*: separar **o que é decisão de compra** do **que é conteúdo**.

**Classifique cada componente da PDP por largura mínima legível** (é o eixo que
decide onde ele vai):

- **Rail de DECISÃO (coluna direita ~50%, fixa):** breadcrumb, nome + favoritar,
  **linha de preço**, variações/SKU, CTA comprar, e a descrição como header. (Frete
  pode sair do rail por decisão de design.)
- **Faixa de CONTEÚDO (full-width abaixo das duas colunas):** compre-junto,
  avaliações, recomendações, banner showcase. Tudo que **não cabe** num rail estreito.

**Grade (no `[product].json`) — 50/50 full-bleed:**
```
"class": "grid grid-cols-1 md:grid-cols-2 md:items-stretch"
```
SEM `container` (full-bleed, a imagem vai edge-to-edge à esquerda). Filhos =
**imagens** (col 1, `flex:1`, sem padding) e **coluna de decisão** (col 2,
`p-5 md:p-14` + `md:border-l md:border-b border-[color:var(--bk-line)]`). O
breadcrumb vive DENTRO do rail. A faixa de conteúdo é um **container irmão DEPOIS**
da grade.

⚠️ **NÃO ponha `row-span-2` (nem `items-start`) na coluna de fotos.** Pra o
`<sticky-container>` (webc) pinar enquanto as fotos rolam, as duas colunas ficam em
**UMA linha** com `items-stretch`: a coluna de fotos (alta) define a altura da linha
e o rail **estica até ela**, dando ao `position:sticky` por onde viajar. Um
`row-span-2` cria 2 linhas, prende o rail na linha 1 e a decisão some ao rolar. (Dois
bugs reais.) O webc só aplica `md:sticky` quando `scrollHeight < innerHeight`, então
o rail tem que caber na viewport — a descrição entra **colapsada**
(`{% unless rail %}checked{% endunless %}`, passe `rail: true`). **Offset do header:**
se o menu é `position:sticky;top:0`, o rail pina ABAIXO dele com
`md:top-[calc(var(--bk-headbar-h)+24px)]` (a altura do header + respiro), senão
sobrepõe (bug real).

⚠️ **CTA: use o `.btn.btn-primary` GLOBAL — NÃO construa um botão.** O primário já é
o CTA da marca (ver `global-styling.md`); montar markup com seta própria **duplica**
o ornamento do `::after`. E não reuse um namespace de classe já ocupado por outro CTA.

**Linha de preço responsiva — por CONTAINER QUERY (não viewport):** o rail é ~50% da
tela, então um `md:flex-row` por viewport QUEBRA no tablet (em ~1024 o rail fica
estreito e a parcela quebra palavra-a-palavra, mesmo o viewport sendo "grande").
Solução: o rail é `container-type:inline-size; container-name:pdp-summary`, e a linha
de preço empilha por padrão (`flex-col`, `border-t`) virando 3 colunas só em
`@container pdp-summary (min-width:30rem)` (`flex-row`, `border-l`). Responde à
largura REAL do rail → resolve mobile, tablet-50% e desktop de uma vez. **Sempre que
um layout depender da largura de uma COLUNA (não da tela), prefira container query.**
No estado empilhado, **sem divisórias internas** (só a `border-b` embaixo do bloco);
os filetes verticais (`border-left`) entram só no modo 3-colunas.

**Opções de variação = MESMO estilo do CTA secundário:** as caixas reusam o look do
`.btn-secondary` (transparente, borda `--bk-line`, mono caps mutado, sem raio).
Selecionada = borda+texto `ink` via `:has(.option-input:checked)`. ⚠️ Não acumule
`border-t` no form de opções junto da `border-b` da linha de preço → **borda dupla**
no meio do rail (bug real). Uma divisória só.

**Descrição = header de bottom-sheet com o corpo DENTRO do bloco bordado:** o
`border-t/b` envolve título **e** corpo; o corpo vive no `collapse-content` com
`padding:0` (o `pb-4` do body controla o espaçamento, não o DaisyUI). Título no papel
de subtítulo (`.bk-heading` caps) + chevron que gira ao abrir. A faixa de conteúdo
(reviews) usa `.bk-pdp-band` (ver `global-styling.md`).

**Empilhar fotos só no desktop (mantendo carousel no mobile):** dê ao
`carousel-embla` um opt-in **`data-disable-from="md"`** — acima do breakpoint ele NÃO
inicializa o embla (e limpa estilos inline dos slides), deixando o `.embla__container`
empilhar via `md:flex-col` + hairlines (`border-top: var(--bk-line)` por slide).
Abaixo de 768 o embla inicializa normal (swipe + dots `md:hidden`). É opt-in: outros
carrosséis (hero, recomendações) não passam o atributo. Verifique no preview com
`el.shouldDisable()` / `el.emblaApi == null`.

**Padding de SEÇÃO vai no wrapper da seção, não no componente reusável:** o `shelf`
é compartilhado; o tipo `carousel` (recomendações/autocomplete) traz `py-4` curto. Pra
padronizar a seção de recomendados sem mexer no shelf global, ponha uma classe no
wrapper (`.bk-pdp-recos { padding-block:clamp(56px,5vw,72px) }` +
`.bk-pdp-recos .container{ padding-block:0 }` p/ não somar).

> Os paddings/cores exatos da PDP vêm do **comp** da Skill 2 — use-o como
> referência, não invente valores nem copie de outro caso.

## Partial minicart (`path: "/partial/minicart"`)

Partials exigem `_version: "3"`, usam `partial` no lugar de `html`, e o path começa
com `/partial/`. Combinam com HTMX e as store routes (`/store/cart/...`).

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

As decisões de mini-cart (drawer/side/line_item/actions) vêm de `commerce.minicart`
no kit; o drawer nativo já existe no litheme (ver `litheme-structure.md`) — reskine.

## Card de produto — shape real do litheme (verificado)

O litheme já traz o card completo em
`templates/shared/components/product-card/` (index + components: image, title,
rating, options, pricing, badges). **Reskine, não recrie.** Campos reais do produto
(de `get_products`/`get_current_product`):

- **`product.preview_images`** — array de caminhos de imagem. `[0]` é a principal;
  **`[1]` serve para o hover**. A URL final é
  `ctx.static_domain + '/<W>x<H>' + preview_images[i]` (ex.: `/700x350...`).
- `product.url`, `product.name`, `product.code`, `product.id`, `product.available`.
- Preço via o componente `pricing.liquid` (`product.price.selling`,
  `product.price.upon_request`, etc.) — use o componente, não monte à mão.
- `product.skus` / `product.options` / `variations` para variações.

### Hover imagem→2ª foto (sem JS custom)

O `<product-card>` já tem `class="group"`. O web component `product-card.webc.js` só
troca imagem por **variação de SKU** (radios `data-variation`), **não** no hover. Para
o hover, adicione uma 2ª `<img>` sobreposta que faz crossfade via `group-hover` — em
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
`group-hover:*` novas) e verifique. O efeito só é forte se o catálogo tiver uma 2ª
foto contrastante (ex.: modelo vestindo a peça) — cheque o catálogo antes de prometer.

**Card no estilo editorial (quando o comp pede):** reestruture o
`product-card/index.liquid` numa célula com borda hairline (`--bk-line`) + fundo
secundário (`surface_alt`), mídia com `aspect-ratio` fixo, e info em **duas linhas com
divisórias** (`border-top`): nome (`.bk-heading`) + rating · preço (`.bk-mono`) + ação
(`commerce.plp.card.add_to_cart` — ex.: link "+ Sacola"). Preserve o que é funcional:
o link-overlay `data-id="product-url"`, o add-to-cart `hx-post` (mantenha
`data-id="product-buy-url"` p/ o webc atualizar na variação), os swatches de SKU
(`relative z-1` p/ ficarem clicáveis acima do overlay) e as métricas. **Fotos:** use
`object-fit:cover` para fotos de catálogo (JPG com fundo próprio) — `object-contain`
só fica limpo com packshot PNG recortado. Troque pílulas de badge por uma tag mono
sutil (outline, fundo translúcido) em vez de cores semânticas berrantes.

## Tipografia — espelhar os papéis do kit, não inventar

Mapeie a fonte **base do `<html>`** para o papel `body` do kit, headings estruturais
para o papel `heading`, e reserve o papel `display` para momentos de destaque via
classe explícita (`.bk-display`). Conferir contra o **comp** — não escolher fontes por
conta própria (ex.: não usar a heading no corpo só porque "lê melhor"; o kit decide).

---

## Adicionar seções editoriais de marca à home (padrão verificado)

Quando o comp tem seções editoriais (faixas atmosféricas, manifesto, comunidade,
navegador de categorias), o jeito que funcionou:

1. **Portar a camada de design para `assets/style/theme.css`** como CSS puro (no fim
   do arquivo): tokens `--bk-*` em `:root`, papéis `.bk-*`, gradientes, grão (data-URI
   feTurbulence) e as classes de cada seção. São regras CSS normais — entram no build
   independentemente do scan do Tailwind. Os tokens DaisyUI seguem como cor "de
   sistema"; essa camada é o "kit" editorial que as seções consomem.
2. **Criar um template por seção** (`templates/pages/home/<secao>.liquid`) usando essas
   classes + `{% asset_url 'brand/<arquivo>' %}` para logos/símbolos/imagens.
3. **Montar no `pages/index.json`** inserindo `{"type":"template","template":"…"}` na
   árvore (no container `main` para conteúdo, no `footer` para o fechamento). ⚠️ Conte
   os componentes — **`maxItems: 10` por container** (ver `litheme-structure.md`);
   seções full-bleed podem ser filhas diretas do `body`, ao lado do `<main>`. Editar o
   JSON via script (Python carregando/inserindo/salvando) é mais seguro que casar strings.
4. **Rebuildar CSS** (`npm run build:css`) e deixar o `sync` subir. Verificar no preview.

Seções estáticas usam copy/imagens da marca; a **vitrine** usa dados reais via
`get_products` (o litheme já traz `pages/home/shelf.liquid`).

---

## Banner custom: hero editorial com card de produto sobreposto (padrão)

O banner padrão da LI (`shared/components/banner/index.liquid`) **não** permite um
card de produto flutuando sobre a foto editorial. Quando o comp pede isso (foto
sangrada + `product-card` flutuando), monte um **banner custom** (template próprio,
carrossel via `carousel-embla`).

Padrão que funcionou:

1. **Imagem = painel; produto = JSON.** A foto/título/link de cada slide vêm de
   `get_banners` (`location:home, position:full`) — **editáveis no painel**. O produto
   de cada slide é fixado por id no JSON. Como o banner não modela "produto associado",
   o pareamento é **por índice**: `banner[i]` ↔ o i-ésimo produto declarado.
2. **Uma data function de produto POR SLOT** (não uma só com vários ids — o filtro
   `product_ids` casa só 1 id/chamada; ver `li-render.md`). No `pages/index.json`:
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
       <img class="bk-hero__photo" src="{{ ctx.static_domain }}/1920x1080{{ banner.image }}" ...>
       {%- assign hero_product = data['hero_p' | append: forloop.index0].products[0] -%}
       {%- if hero_product -%}
         <aside class="bk-hero__peek">
           {% render 'shared/components/product-card/index', product: hero_product, forloop: forloop %}
         </aside>
       {%- endif -%}
     </div>
   {%- endfor -%}
   ```
   Reusa o `carousel-embla` (slides `.embla/.embla__container/.embla__slide`,
   `data-loop/autoplay/show-progress`, dots `[data-carousel-dot]`+`.dot-progress`) e o
   `product-card` existente — **nada novo de carrossel/card**.
4. **Nº de slides = nº de banners full no painel.** Carrossel/dots só aparecem com ≥2
   banners. Mais banners que slots de produto → slide só editorial (fallback ok).
5. **Altura vs. header + sneak-peek.** O header do litheme é **estático e opaco** (não
   overlay): um hero `100svh` estoura a dobra pela altura do header → o card cai abaixo
   da viewport. Padrão: duas variáveis — `--bk-hero-offset` (= stripe + header) e
   `--bk-hero-vh` (altura visível alvo). `height: calc(var(--bk-hero-vh) - var(--bk-hero-offset))`.
   Com `--bk-hero-vh: 100svh`, header + hero preenchem a tela (sem peek); baixar o valor
   cria o "sneak-peek" da próxima seção. Esconda o card flutuante no mobile (lá a foto
   assume).
6. **Pareamento produto↔slide vive no JSON** (não editável pelo painel) — trade-off
   aceito por fidelidade ao comp.

### Comportamentos avançados de carrossel (lições transferíveis)

Variantes de hero observadas num caso real — guarde as **lições transferíveis**; o
código bespoke de cada caso fica no snapshot do próprio caso, não na skill viva:

- **Nav por títulos = progress bar, reusando o webc (sem JS novo).** Cada título é um
  `<button data-carousel-dot>` (clique → `goTo(index)`, `.active` no corrente). Com
  `data-show-progress="true"` o webc injeta uma `.dot-progress` **no 1º filho** do
  botão → o 1º filho deve ser a *pista* (baseline `position:absolute` no rodapé).
  Override a cor: `.<pista> .dot-progress{ background-color: var(--bk-...) }`. Mobile:
  segmentos que expandem (inativos colapsam num stub; `.active` expande).
- **FADE exige controlador dedicado — Embla é slide-only.** Embla translada um
  container flex; fade precisa de slides empilhados (mesma posição) com crossfade de
  opacidade, o que quebra a medição de snaps. Solução: um web component próprio e
  minúsculo (`<brand-hero>`), **sem libs novas**: slides `position:absolute;inset:0;
  opacity:0`; alterna `.is-current` (opacity 1 + `transition`); autoplay por
  `setTimeout`; pausa no hover; progresso via `@keyframes` com **`transform:scaleX`**
  (não `width:%`). Mantém o mesmo contrato de nav (pista + fill).
- **Scrim de contraste** sobre a foto (`linear-gradient` do `ink` opaco→transparente)
  ancora o contraste de nav/título/card.
- **Mobile — nav ACIMA do floating bar:** a floating-bar é `fixed bottom-5` (~56px de
  altura); ancore a nav do hero acima (`bottom:96px` no mobile) p/ não colidir.

> ⚠️ **QA — animações CSS congelam em aba OCULTA.** A aba dirigida por automação fica
> `document.visibilityState === 'hidden'` → `document.timeline` para, e toda animação
> CSS trava no frame 0 (a progress bar aparece vazia no screenshot), **embora
> `setTimeout` continue** (os slides avançam). Não é bug. Verifique o mecanismo por
> `el.getAnimations()` (name/playState) + `document.visibilityState`, não pela animação
> no screenshot.

---

## UGC "shoppable": post social → produto real (padrão)

Transformar uma seção de comunidade/UGC estática (fotos + copy hardcoded) numa seção
**comprável**, onde cada post curado linka ao **produto real mencionado** (URL/nome/
preço/imagem **vivos**). Mesma mecânica do hero editorial.

**Origem das imagens:** o LI Render só expõe dados por funções nomeadas — **não existe
`get_instagram_feed`**. E URL do CDN do Instagram (`scontent…`) **expira** e hotlink
viola ToS. Então a foto do post é **baixada e servida como asset** do tema
(`assets/brand/ugc-N.jpg`, via `{% asset_url %}`). Curadoria manual é o preço de não
ter API — e é desejável (qualidade > volume).

**Padrão (espelha o hero):** config editorial em `properties` + produto vivo em `data`,
um `get_products` por id.

```jsonc
// pages/index.json — bloco da seção
{
  "data": {
    "community_p0": { "args": { "filter": { "product_ids": "<ID_A>" }, "paginate": false }, "function": "get_products" },
    "community_p1": { "args": { "filter": { "product_ids": "<ID_B>" }, "paginate": false }, "function": "get_products" },
    "community_p2": { "args": { "filter": { "product_ids": "<ID_C>" } },                      "function": "get_products" }
  },
  "type": "template",
  "template": "pages/home/community.liquid",
  "properties": {
    "posts": [
      { "image": "brand/ugc-1.jpg", "handle": "@perfil", "followers": "2.5K seguidores", "ig_url": "https://instagram.com/perfil", "product_id": "<ID_A>" }
      // … 1 entrada por card
    ]
  }
}
```

```liquid
{%- comment -%} pages/home/community.liquid — loop sobre props.posts, produto vivo via data {%- endcomment -%}
{%- assign posts = props.posts -%}
{%- for post in posts -%}
  {%- assign i = forloop.index0 -%}
  {%- assign product = data['community_p' | append: i].products[0] -%}
  {%- if product -%}
    {%- assign thumb = ctx.static_domain | append: '/120x120' | append: product.preview_images[0] -%}
    <article class="bk-ugc">
      <div class="bk-ugc__media">
        <a class="bk-ugc__cover" href="{{ product.url }}" aria-label="Ver {{ product.name }}"></a>   {%- comment -%} foto → PDP (z-1, sob o crédito) {%- endcomment -%}
        <img src="{% asset_url post.image %}" alt="{{ post.handle }}" loading="lazy">
        <a class="bk-ugc__cred" href="{{ post.ig_url }}" target="_blank" rel="nofollow noopener">  {%- comment -%} @handle → rede social (z-2, acima do cover) {%- endcomment -%}
          <span class="bk-ugc__avatar"><img src="{% asset_url post.image %}" alt=""></span>
          <span class="bk-ugc__handle"><b>{{ post.handle }}</b><span>{{ post.followers }}</span></span>
        </a>
      </div>
      <a class="bk-ugc__buy" href="{{ product.url }}">   {%- comment -%} pill: thumb + nome + PREÇO vivos → PDP {%- endcomment -%}
        <span class="bk-ugc__thumb"><img src="{{ thumb }}" alt="" loading="lazy"></span>
        <span class="bk-ugc__prod"><b>{{ product.name }}</b><span>{{ product.price.selling | format_number: "C" }}</span></span>
      </a>
    </article>
  {%- endif -%}
{%- endfor -%}
```

**Interações (dois alvos por card):** a foto (cover `position:absolute;inset:0;
z-index:1`) e o pill levam à **PDP**; o crédito `@handle` (`z-index:2`, acima do cover)
abre a rede social em nova aba. Anchors herdam estilo de link — resetar
`text-decoration:none;color:inherit` nos `.bk-ugc__cred/__buy`.

**⚠️ Colisão de dedup com o hero (MUITO comum nesta seção).** O hero já pina produtos
por id; se a comunidade reusar os MESMOS ids com args idênticos, os cards colididos
**não renderizam** (data nula — ver o gotcha de dedup em `li-render.md`). Por isso o
exemplo deixa `community_p2` **sem `paginate: false`**: quando o produto coincide com
um já pinado, variar o `paginate` é o que destrava. Curar produtos distintos do hero é
o ideal; em loja de teste com catálogo pequeno o reuso é inevitável e o ajuste de
`paginate` resolve.

### Mobile vira slider (scroll-snap nativo, sem JS — reusa o padrão da vitrine)

Em vez de empilhar os cards no mobile, transforme o track num slider horizontal
**idêntico ao grid da vitrine** (swipe + peek, zero JS/Embla). Full-bleed via margem
negativa do gutter do `.container` (o `--bk-gutter` é exatamente o `padding-inline` do
container, então a margem negativa cancela e o peek sangra até a borda):

```css
@media (max-width:640px){
  .bk-community__track{
    flex-wrap:nowrap;overflow-x:auto;scroll-snap-type:x mandatory;
    overscroll-behavior-x:contain;scrollbar-width:none;-ms-overflow-style:none;
    margin-inline:calc(var(--bk-gutter) * -1);
    padding-inline:var(--bk-gutter);scroll-padding-inline:var(--bk-gutter);
  }
  .bk-community__track::-webkit-scrollbar{display:none;}
  .bk-ugc{flex:0 0 82%;scroll-snap-align:start;}   /* 82% = card + peek do próximo */
}
```

Verificar o slider no preview: `track.scrollWidth > clientWidth`,
`scrollSnapType === 'x mandatory'`, e que o desktop continua `display:flex` 3-up
(`overflow-x:visible`, `snap:none`).

### Altura igual: o "pé" do card precisa CRESCER, senão vaza o fundo do card

Cards lado a lado num flex row esticam à altura do mais alto (`align-items:stretch`
default). Se a foto é uniforme (`aspect-ratio`) mas o **rodapé** (o pill de compra, com
fundo próprio) tem altura variável — porque o **nome do produto quebra em 2–3 linhas**
—, os cards de título curto ganham uma **faixa do fundo do CARD** embaixo do pill, em
vez do pill preencher. Sintoma: "gap de background-color na parte inferior".

Correção (sem truncar nome): faça o rodapé **crescer** para absorver a sobra.

```css
.bk-ugc__media{ aspect-ratio:5/6; flex-shrink:0; }   /* foto uniforme, não encolhe */
.bk-ugc__buy{ /* …estilo do pill… */ flex:1 0 auto; } /* pill cresce → fundo vai até a base */
```

Como a foto é uniforme, `total - foto` é igual em todos → **todos os pills ficam com a
MESMA altura** e o fundo (`base-100`) preenche até a borda inferior. Vale pro 3-up e
pro slider mobile. Verificar: `buy.height` igual entre cards e
`card.bottom - buy.bottom ≈ 0`. Alternativa (mais compacta, mas trunca) seria
`-webkit-line-clamp` no nome; o `flex:1 0 auto` é preferível por não cortar o título.
