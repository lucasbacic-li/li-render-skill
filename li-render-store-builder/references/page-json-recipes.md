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

### PDP em duas zonas — fotos empilhadas + rail de decisão fixo (verificado)

Padrão da Ora, portando a **grade aparente** (footer/home/minicart) para a PDP.
A ideia: separar **o que é decisão de compra** do **que é conteúdo**, e dar ao
desktop uma experiência de *scroll de fotos com a decisão parada no view*.

**Classifique cada componente da PDP por largura mínima legível** (é o eixo que
decide onde ele vai):

- **Rail de DECISÃO (coluna direita 50%, fixa):** breadcrumb (movido pra dentro
  do rail), nome + favoritar (Material 40px), **linha de preço em 3 células**
  (preço · parcelas · "formas de pagamento" → abre modal), variações/SKU, CTA
  comprar, e a **descrição** como header "SOBRE O PRODUTO". **SEM frete** (a Ora
  tirou o cálculo de frete do rail).
- **Faixa de CONTEÚDO (full-width abaixo das duas colunas):** compre-junto
  (cards horizontais), avaliações (barras+cards+fotos), recomendações (carousel),
  banner showcase. Tudo que **não cabe** num rail estreito desce pra cá.

**Grade (no `[product].json`) — 50/50 full-bleed (ref. Paper):**
```
"class": "grid grid-cols-1 md:grid-cols-2 md:items-stretch"
```
SEM `container` (full-bleed, a imagem vai edge-to-edge à esquerda). Filhos =
**imagens** (col 1, `flex:1`, sem padding) e **coluna de decisão** (col 2,
`p-5 md:p-14` + `md:border-l md:border-b border-[color:var(--ora-line-2)]`). O
breadcrumb agora vive DENTRO do rail (não é mais filho da grade). A faixa de
conteúdo é um **container irmão DEPOIS** da grade.

⚠️ **NÃO ponha `row-span-2` (nem `items-start`) na coluna de fotos.** Pra o
`<sticky-container>` (webc) pinar enquanto as fotos rolam, as duas colunas ficam
em **UMA linha** com `items-stretch`: a coluna de fotos (alta) define a altura da
linha e o rail **estica até ela**, dando ao `position:sticky` por onde viajar.
Um `row-span-2` na imagem cria 2 linhas, prende o rail na linha 1 (~600px) e a
decisão some depois de rolar essa altura. (Dois bugs reais: `items-start` encolhia
o rail; `row-span-2` o prendia na 1ª linha.) Detalhe do webc: ele só aplica
`md:sticky` quando `scrollHeight < innerHeight`, então o rail tem que caber na
viewport — a descrição entra **colapsada** (`{% unless rail %}checked{% endunless %}`,
passe `rail: true` no render). **Offset do header:** o menu é `position:sticky;top:0`,
então o rail tem que pinar ABAIXO dele, senão sobrepõe (bug real). Use
`md:top-[calc(var(--ora-headbar-h)+24px)]` no `<sticky-container>` — a altura do
header + ~24px de respiro (só `var(--ora-headbar-h)` deixa colado). A var foi
promovida ao `:root` (antes só existia no `.ora-hero`).

**Linha de preço responsiva:** desktop = `md:flex-row` (3 colunas, `md:border-l`);
mobile = base `flex-col` (3 linhas empilhadas, `border-t`) — em coluna estreita as
células espremem e o texto quebra palavra-a-palavra. Sempre `flex-col md:flex-row`
e trocar `border-l`↔`border-t` no breakpoint.

⚠️ **CTA: use o `.btn.btn-primary` GLOBAL — NÃO construa um botão.** Na Ora o
primário já É o CTA do Paper: barra lilás + label + **caixa espresso 1:1 com seta
via `::after`** (`content:"\e5c8"` arrow_forward). Montar markup com seta própria
**duplica** a seta (vira dois botões). E **`.ora-cta` é nome OCUPADO** (composto
inline de newsletter/contato com texto sublinhado + caixa) — reusar quebra os dois.

**Linha de preço (3 células) + hierarquia (ref. Paper 4QR-0):** flex com `border-b`;
preço (`px-8 py-6`, **espresso 20px mono**) | parcelas (`flex-1 px-6 border-l`,
centro) | "formas de pagamento" (`px-8 py-6 border-l`, sublinhado, abre o modal).
Parcelas e "formas de pagamento" são **12px `var(--ora-argila)`** (mutadas, abaixo
do preço) — NÃO noz/14px. Tudo `var(--ora-font-mono)`; divisórias `border-l var(--ora-line-2)`.
**Responsivo por CONTAINER QUERY (não viewport):** o `md:flex-row` por viewport
QUEBRAVA no tablet — o rail é 50% da tela, então em ~1024 ele fica estreito e a
parcela quebra palavra-a-palavra, mesmo o viewport sendo "grande". Solução: o rail
(`#product-summary`) é `container-type:inline-size; container-name:pdp-summary`, e a
linha de preço empilha por padrão (`flex-col`, `border-t`) virando 3 colunas só em
`@container pdp-summary (min-width:30rem)` (`flex-row`, `border-l`). Responde à
largura REAL do rail → resolve mobile, tablet 50% e desktop de uma vez. Sempre que
um layout depender da largura de uma COLUNA (não da tela), prefira container query.
**Empilhado = limpo, SEM divisórias internas** (ref. Paper 4TK-0): no estado stacked
as células NÃO têm `border-t` entre si — só a `border-b` embaixo do bloco; paddings
justos e assimétricos (preço `pt-4 pb-2`, parcelas `pb-3`, formas `pb-4`). As
divisórias VERTICAIS (`border-left`) entram só no estado 3-colunas, dentro do
`@container`. Filete interno em layout empilhado polui — guarde-o pro modo colunas.

**Opções de variação = MESMO estilo do CTA secundário "Calcular frete":** as caixas
P/M/G reusam o look do `.btn-secondary` (transparente, borda `argila/50%`, mono caps
`argila`, sem raio). Classe `.ora-variation-opt` (cor/borda/fonte) + utilities de
padding no `<label>`; selecionada = borda+texto espresso via
`.ora-variation-opt:has(.product-variation-option-input:checked)`. O legend
("Selecione a opção de…") é **mono medium 14px noz** (não sans/16px). ⚠️ NÃO deixe
`border-t` no form das opções: a linha de preço já tem `border-b`, e as duas + o
gap viram **borda dupla** no meio do rail (bug real). Uma divisória só.

**Descrição = header de bottom-sheet ("SOBRE O PRODUTO") com o CORPO DENTRO do
bloco bordado:** o `border-t/b` fica no `.ora-sobre` (o collapse), envolvendo título
**e** corpo — o corpo (`.ora-sobre__body`, mono 14px noz) vive no `collapse-content`
com `padding:0` (o DaisyUI não controla o espaçamento; o `pb-4` do body sim).
`.ora-sheet-title` (Host Grotesk 500 caps espresso) + chevron Material 40px que gira
ao abrir (`.ora-sobre:has(>input:checked) .ora-sobre__chevron`). A faixa de conteúdo
(reviews) ainda usa `.ora-pdp-band` (collapse-plus eyebrow) — ver `global-styling.md`.

**Empilhar fotos só no desktop (mantendo carousel no mobile):** o `carousel-embla`
ganhou um opt-in **`data-disable-from="md"`** — acima do breakpoint ele NÃO
inicializa o embla (e limpa os estilos inline dos slides), deixando o `.embla__container`
empilhar via `md:flex-col` + hairlines (`border-top: var(--ora-line-2)` por slide).
Abaixo de 768 o embla inicializa normal (swipe + dots `md:hidden`). É opt-in: outros
carrosséis (hero, recomendações) não passam o atributo e seguem intactos. Verifique
no preview com `el.shouldDisable()` / `el.emblaApi == null` (desktop) e
`shouldDisable()===false` simulando `innerWidth` mobile.

**Recomendados (PDP) usam o padding-block da VITRINE da home:** o `shelf/index` é
compartilhado; o tipo `carousel` (recomendações/autocomplete) traz só `py-4` (curto),
enquanto a vitrine (`grid-snap` → `.ora-shelf`) usa `padding-block:clamp(56px,5vw,72px)`.
Pra padronizar a SEÇÃO de recomendados sem mexer no shelf global (o autocomplete quer
o py-4 apertado), pôr `.ora-pdp-recos` no `#product-recommendations`:
`{ padding-block:clamp(56px,5vw,72px) }` + `.ora-pdp-recos .container{ padding-block:0 }`
(zera o py-4 interno p/ não somar). Regra: padding de SEÇÃO vai no wrapper da seção,
não no componente reusável.

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
