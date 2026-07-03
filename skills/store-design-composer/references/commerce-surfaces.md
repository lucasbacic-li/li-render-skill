# Superfícies de commerce — a matriz de decisão

As três superfícies que um brand-kit **não responde** (não existem numa home/brand
file) e que esta skill decide: **mini-cart**, **busca/PLP** e **PDP**.

Cada decisão tem: (a) um **default derivado das primitivas** do kit, (b) as
**opções** (restringidas pelos `litheme-capabilities`), (c) o **componente do
litheme** que materializa, (d) como vira **comp** + campo no bloco `commerce`.

> **Método.** Nunca apresente uma decisão como pergunta em branco. Apresente o
> **default já proposto** ("dado que sua marca é X, sugiro Y, porque Z") e deixe o
> cliente ajustar. Decisão derivada > decisão pedida.
>
> ⚠️ **O default parte do COMPORTAMENTO OBSERVADO no fonte; as primitivas afinam o
> ESTILO, não decidem SE o controle existe.** Para cada decisão (inclusive
> `card.add_to_cart`): primeiro olhe o que o fonte **faz** (o product-card tem botão
> no card? clica no card→PDP? a busca tem autocomplete?) — isso fixa o default. Só
> então as primitivas da marca (accent forte, raio, etc.) decidem a **aparência** do
> controle que já existe. Um accent forte deixa o botão mais visível — **não cria** um
> botão onde o fonte não tem. **Não adicione um controle (botão no card, etc.) que o
> fonte não tem: isso é mudança de comportamento, exige decisão consciente registrada
> (`modernize` com rationale), não um efeito colateral do default.**

## Sinais do kit que guiam os defaults

| Sinal no kit | Empurra o design para |
|---|---|
| `radius.scale: sharp` | cards quadrados, divisórias hairline, CTAs retos |
| `radius.scale: round` | cards/botões arredondados, pílulas, mais suave |
| `accent` forte/saturado | **estilo** do CTA que JÁ existe: preenchido (`cta_style: filled`), controle mais visível — **não** "criar add-to-cart no card se o fonte não tem" |
| paleta neutra/contida | CTA discreto (`text-link`), grids arejados |
| `typography.mono` presente | labels/preços em mono, eyebrows técnicos |
| catálogo pequeno | grid 2–3 col, PLP simples; catálogo grande → 3–4 + filtros |
| variações (tam/cor) | PDP com `swatch`/`pills`; sem variação → buy-box enxuto |

---

## Mini-cart

| Decisão | Default (derivado) | Opções | Componente |
|---|---|---|---|
| `type` | `drawer` | `drawer` · `page` | minicart drawer (nativo) |
| `side` | `right` | `right` · `left` | floating-bar abre |
| `line_item` | `thumb-left` | `thumb-left` · `thumb-top` | item do drawer |
| `actions` | primary `checkout` + secondary `continuar-comprando` | — | CTAs do drawer |
| `shipping_bar` | `false` (ligar se a loja tem frete grátis por valor) | bool | faixa no topo |
| `upsell` | `false` na v1 | bool | usa `get_products` |

Microcopy vem de `voice.microcopy` (ex.: `empty_cart`).

## Busca / PLP (categoria e resultados)

| Decisão | Default (derivado) | Opções | Componente |
|---|---|---|---|
| `grid.desktop` | 3 (4 se catálogo grande) | 2–4 | shelf/grid |
| `grid.mobile` | 2 | 1–2 | shelf/grid |
| `card.image_ratio` | `3:4` (moda) | livre | product-card |
| `card.fit` | `cover` (foto c/ fundo) · `contain` (packshot recortado) | — | product-card |
| `card.shows` | `["name","price"]` (+`rating` se houver) | subconjunto | product-card |
| `card.add_to_cart` | **parte do fonte**: card sem ação→`none` (clica no card→PDP); card com botão→`button` (depois o accent afina o ESTILO) | `text-link`·`button`·`icon`·`none` | HTMX `product-buy-url` |
| `filters` | `drawer` (nativo) | `drawer`·`sidebar`·`topbar` | filtros |
| `sort` | `dropdown` | — | controle de ordenação |
| `pagination` | `load-more` | `pages`·`load-more`·`infinite` | listagem |

Busca = GET `/search?q=` (input `name=q`) — o PLP de busca herda o mesmo card/grid.

## PDP (página de produto)

| Decisão | Default (derivado) | Opções | Componente |
|---|---|---|---|
| `gallery` | `stacked` (desktop) | `stacked`·`carousel`·`grid` | mídia da PDP |
| `buy_box.variant_selector` | `pills` (poucas opções) · `dropdown` (muitas) · `swatch` (cor) | — | seletor de variação |
| `buy_box.qty` | `true` | bool | stepper |
| `buy_box.cta_style` | `filled` | `filled` (accent) | add-to-cart (HTMX) |
| `info` | `accordion` | `accordion`·`tabs` | descrição/detalhes |
| `cross_sell` | `true` | bool | usa `get_products` |

---

## Saída desta reference

1. Bloco `commerce` do brand-kit preenchido (todos os campos acima).
2. Cada decisão materializada num comp (ver `comp-authoring.md`).
3. Itens `_uncertain` herdados da Skill 1 resolvidos no caminho.
