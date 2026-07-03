# litheme-capabilities — contrato de restrição (v1)

O segundo contrato compartilhado do kit LI Render. Enquanto o `brand-kit` carrega
**dado** (a identidade), este carrega **restrição**: *o que o litheme consegue
renderizar de forma barata e robusta*.

- A **Skill 2** (`store-design-composer`) usa isto como **guardrails de design** —
  só decide commerce e desenha comps dentro do que é implementável.
- A **Skill 3** (`li-render-store-builder`) usa isto como **alvo de implementação**
  e mantém a fonte da verdade detalhada (recipes, estrutura real do tema).

> **Princípio.** Um comp lindo que o litheme não renderiza barato é uma promessa
> que a Skill 3 tem que desmentir. Este contrato existe para o comp nascer
> **implementável por construção**. Em caso de dúvida, a restrição vence o desejo.

> **Fonte da verdade vs. resumo.** Os detalhes profundos do litheme vivem nas
> references da Skill 3 (`li-render-store-builder/references/`:
> `litheme-structure.md`, `li-render.md`, `page-json-recipes.md`,
> `global-styling.md`). Este arquivo é o **resumo de capacidade** consumível pela
> C — uma camada de "o que dá pra fazer", não "como fazer". Ao re-ancorar a Skill 3 no
> litheme, promover/linkar daqui o que for genuinamente compartilhado, sem
> duplicar.

---

## Base técnica

- **Litheme = Tailwind v4 + DaisyUI v5.** Cores/raio vivem no bloco
  `@plugin "daisyui/theme"` (tokens `base-100`, `base-content`, `primary`, …) →
  trocar tokens reskina tudo. Mapear papéis do brand-kit → tokens DaisyUI.
- **Theme-as-code**: páginas em JSON (rota + `global_data` via funções nomeadas +
  árvore de componentes) + templates Liquid + assets, geridos pela `li-cli`.
- **Rotas com colchetes** (`[product]`, `[category]`).

## Mapeamento brand-kit → tokens DaisyUI (a espinha do reskin)

O reskin é, no fundo, **ligar os papéis do brand-kit aos tokens do bloco
`@plugin "daisyui/theme"`** do litheme. Trocar esses tokens cascateia para todos
os ~118 templates sem tocá-los. Este é o mapa canônico (a Skill 3 implementa, a C
desenha sabendo dele):

| Papel no brand-kit | Token(s) DaisyUI do litheme | Observação |
|---|---|---|
| `colors.roles.surface` | `--color-neutral` (**é o fundo do body**) + `--color-base-100` | no litheme `body { background: var(--color-neutral) }` — não é cinza escuro |
| `colors.roles.surface_alt` | `--color-base-200` / `--color-base-300` | cards, faixas, fundos secundários |
| `colors.roles.surface_dark` | sem token nativo → aplicar via `--bk-surface-dark` em seções/footer | fundo escuro de seções invertidas |
| `colors.roles.ink_muted` | `--color-base-content` | **corpo de texto** — o litheme força `text-base-content` em quase tudo, então o token tem que ser o tom de corpo |
| `colors.roles.ink` | regras **fora de `@layer`**: `h1..h6, .font-bold {color}` | títulos/dados fortes; vencem o utility `text-base-content` (que vive em `@layer utilities`) |
| `colors.roles.ink_inverse` | `--color-neutral-content` / `--color-primary-content` | texto sobre fundo escuro/accent |
| `colors.roles.line` | cor de borda (override `--bk-line` nos hairlines) | divisórias/bordas |
| `colors.roles.accent` | `--color-primary` | ação primária, links, CTA preenchido |
| `colors.roles.accent_ink` | `--color-primary-content` | texto sobre o accent |
| `colors.roles.accent_secondary` (opcional) | `--color-secondary` | 2º destaque: preço/disponibilidade/sucesso |
| `colors.roles.accent_secondary_ink` (opcional) | `--color-secondary-content` | texto sobre o accent secundário |
| `radius.field/box/selector` | `--radius-field` / `--radius-box` / `--radius-selector` | direto; `field`=botões/inputs, `box`=cards/modais/drawers, `selector`=controles pequenos |
| funcionais (info/success/warning/error) | manter os do litheme ou puxar de `palette` | a paleta antiga (#0846EF azul, #27A47D verde, #FF6265 vermelho) é off-brand pós-reskin — ver gotcha de ícones |

> **Padrão de hierarquia de cor (genérico, lição de caso real).** Defina
> `--color-base-content` = `ink_muted` (clareia todo o corpo de uma vez), e
> **force** títulos/dados fortes de volta a `ink` com regras fora de `@layer`.
> Sem isso, ou o corpo fica escuro demais (utility vence o `html{color}`), ou tudo
> fica forte (hierarquia achatada).

## `theme_mode` → DaisyUI (modo único light/dark)

O kit traz **`theme_mode.mode`** (`light`|`dark`), decidido pela Skill 2 — *um* modo
para a loja inteira (ver `../brand-kit-spec/`). A Skill 3 **implementa**, não re-decide.
O DaisyUI foi feito para isso: um tema coerente resolve o contraste **nativamente**
(`base-content` é sempre legível sobre `base-100/200/300`), sem carve-back por região.

| `theme_mode.mode` | Como mapeia no bloco `@plugin "daisyui/theme"` |
|---|---|
| `light` (default litheme) | `color-scheme: "light"`; `surface`→`base-100`/`neutral` claros; `ink`→`base-content` escuro. Caminho padrão, nada a inverter. |
| `dark` | `color-scheme: "dark"`; `surface`→`base-100/200/300` **escuros**; `ink`→`base-content` **claro**. O sistema inverte de uma vez (cards, drawers, painéis aninhados). |

- **Seções invertidas** (`theme_mode.inverted_sections`): acento **contido** (ex.:
  rodapé escuro num tema light) via `surface_dark`/`ink_inverse` — não muda o modo.
- **Exceção "chrome≠conteúdo"** (híbrido: body escuro + tiles claros): briga com o
  DaisyUI → exige carve-back de contraste; **não é o default**. Só quando o kit pede
  explicitamente (decisão consciente). Receita em `../../li-render-store-builder/references/dark-hybrid-exception.md`.

## Convenção de re-ancoragem (anonimização)

Ao escrever/editar references da B, mantenha-as **agnósticas de marca/conta**:

- **Ancore no litheme, não na marca.** Use tokens DaisyUI reais (`base-100`,
  `primary`, `--radius-*`) e o nome de tema real (`litheme`) como referência. Nada
  de tokens de uma marca específica (`--<marca>-*`) ou cores/fontes de um caso como
  se fossem o sistema.
- **Valores de marca vêm do kit**, via os papéis acima. Em vez de um literal de
  marca (ex.: o nome de uma cor específica), escreva "o papel `ink` do kit →
  `--color-base-content`".
- **Tokens de projeto** (quando precisar de uma var própria além dos DaisyUI):
  prefixo neutro **`--bk-`** (brand-kit), nunca um prefixo de marca.
- **Exemplos concretos** de um caso resolvido ficam **fora da skill viva** (num
  snapshot à parte) e são referenciados como "exemplo resolvido" — não cole
  literais de uma marca na skill viva.

## Limites duros (guardrails de design)

Decisões de commerce/layout **devem** respeitar:

| Limite | Implicação para o design |
|---|---|
| **`maxItems: 10` por container** no schema da página | Uma home não cabe infinitas seções no `main`; planejar ≤10 por container (e usar o `body` para overflow). C não desenha 14 seções empilhadas. |
| **`asset_url` assina o caminho** | Todo asset referenciado precisa existir no servidor antes; sem caminhos relativos a fontes. Comps que dependem de imagem da marca → declarar no kit. |
| **Fontes via `<link>` no `<head>`** (Google) | Preferir famílias do Google; self-host só via `<style>` Liquid com `asset_url`. C não assume fontes exóticas sem arquivo. |
| **Dados vêm de funções nomeadas** | Toda seção com produto/categoria precisa de uma função de dados existente (abaixo). C não inventa dados; desenha sobre os que o renderizador entrega. |
| **`sync` valida JSON estrito; `push` é leniente** | Estrutura de página tem schema; o comp deve mapear para uma árvore válida. |

## Inventário de componentes (o que existe pra reskinar)

Componentes/partials do litheme que C pode assumir como disponíveis (reskináveis,
não recriáveis):

| Componente | Papel | Notas de capacidade |
|---|---|---|
| `header` | topo/navegação | grid reconfigurável; logo via `asset_url`; liga `get_category_tree` |
| `footer` | rodapé | colunas + marca |
| **minicart** (drawer) | sacola | drawer existente, aberto pela floating-bar; reskinável |
| `floating-bar` | gatilhos flutuantes | hospeda drawers (busca/sacola) em qualquer viewport |
| `product-card` | célula de produto | `product.preview_images[]` (hover 2ª img via `group-hover`); add-to-cart HTMX (`data-id="product-buy-url"`) |
| `shelf` | prateleira/carrossel | grid de cards; `justify-center` com poucos itens |
| `banner` | faixa/destaque | imagem + texto |
| `hero` | herói | `props.slides` (válido no schema) |
| busca | resultados | GET `/search?q=` (input `name=q`) |
| categoria | PLP | via `get_current_category` / `get_products` |

## Forkar é o DEFAULT; apropriar o nativo é a exceção (3 componentes) — registre a escolha

> Correção estruturante (caso real: o reskin ficou **preso no nativo**). **Forkar/reestruturar
> o componente para casar o comp é o caminho NORMAL** — é o valor do LI Render (lojas muito
> customizadas e de alta performance). Forçar o reskin do nativo **limita a flexibilidade do
> renderizador**. Para CADA componente, o default é: **o comp manda a estrutura; reestruture o
> template nativo para batê-lo.** Há só **uma lista curta de exceções** que preservam o nativo.

**🔒 Os 3 componentes PRESERVE-NATIVE (reskine, não forke sem pedido explícito):**
- **mini-cart** — carrega comportamento nativo crítico de conversão: **desconto progressivo**,
  alerta de **frete-grátis**, **cupom**, **frete por CEP**. Recriar quebra isso.
- **prévia de busca ao vivo / autocomplete** — carrega a **prateleira de produtos** + as
  **sugestões de termo** nativas.
- **filtros de busca** — preserve os **filtros nativos**. O usuário pode *adicionar* itens à
  lateral, mas os filtros só mudam se ele **provocar a mudança explicitamente**.
> Para esses 3: `native` → `migrate`/`modernize` (reskin), e o comp **espelha a estrutura
> nativa**. Forkar um deles exige pedido explícito do usuário.

**Todo o resto (header, footer, PDP/buy-box, product-card, seções de home, layout da PLP…) →
forke por default:** `build-custom` (ou `native-restructure` → `modernize` com reestruturação
real). O comp desenha a estrutura nova **livremente**; a Skill 3 **constrói/reestrutura** para
batê-la (não "enfia no nativo"). `build-custom` aqui **não exige justificativa pesada** — é o
esperado. (Mesmo forkando a ESTRUTURA, o estilo continua vindo do sistema — tokens, `.btn`,
papéis — ver `../../li-render-store-builder/references/global-styling.md`: fork de *estrutura*
≠ fork de *estilo*.)

> **O que NÃO pode** é a **divergência silenciosa nos dois sentidos**:
> 1. inventário diz `native`/`migrate` mas o comp diverge do nativo → a Skill 3 reskina e
>    **diverge do comp por acidente** (caso real: footer com colunas não-nativas marcado
>    `migrate` → ficou nas colunas nativas; PDP marcada para reskin → descrição full-width em
>    vez da zona ancorada do comp);
> 2. a Skill 3 **preserva a estrutura nativa de um componente que não é um dos 3** "porque
>    reskin é mais seguro" → deixou de implementar o comp.
> **Regra:** a escolha forkar-vs-preservar é **explícita no `migration-inventory.json`**
> (`litheme_support` + `decision`) e o **comp é coerente com ela**. Default = forkar para casar
> o comp; preserve-native só para os 3 (ou sob pedido). Divergir do comp sem decidir é o bug —
> e "ficar no nativo por segurança" é a forma mais comum desse bug.

## Funções de dados disponíveis

`get_products`, `get_current_product`, `get_current_category`,
`get_category_tree`. Toda decisão de commerce que precise de dado tem que casar
com uma destas (ou ser conteúdo de marca estático).

## Superfícies de commerce — opções renderáveis

O domínio de cada decisão do bloco `commerce` (no brand-kit), restringido ao que o
litheme faz barato. A Skill 2 escolhe dentro destes; valores fora exigem trabalho
custom e devem ser sinalizados.

- **mini-cart** — `type`: `drawer` (nativo) · `page` (custom, evitar na v1).
  `side`: `right` | `left`. `line_item`: `thumb-left` | `thumb-top`.
- **busca/PLP** — `grid.desktop`: 2–4 · `grid.mobile`: 1–2. `card.add_to_cart`:
  `text-link` | `button` | `icon` | `none`. `filters`: `drawer` (nativo) |
  `sidebar` | `topbar`. `pagination`: `pages` | `load-more` | `infinite`.
- **PDP** — `gallery`: `stacked` | `carousel` | `grid`.
  `buy_box.variant_selector`: `swatch` | `pills` | `dropdown`. `info`:
  `accordion` | `tabs`. `cross_sell`: bool (usa `get_products`).

## Gotchas que viram restrição de design

- **maxItems:10** — já acima; planejar o número de seções.
- **PTY esgotado** no ambiente → preferir `sync` (sem prompt) a `push`/`promote`
  interativos. (Restrição de *operação* da B, mas C deve saber que páginas têm de
  ficar schema-válidas para o `sync`.)
- **Sessão de preview autenticada** — verificação só por navegador logado.
