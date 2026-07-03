# Exceção: híbrido chrome≠conteúdo (carve-back de contraste)

> **Leia este arquivo SÓ se o kit pediu o híbrido explicitamente** — i.e.
> `theme_mode.mode` com a exceção "chrome≠conteúdo" registrada pela Skill 2 (shell
> escuro + *tiles* claros, ex.: cards brancos sobre navy). **Não é o caminho default.**
> O default é **modo único** (light OU dark por token) — ver `global-styling.md`. Se o
> kit diz `dark` puro, vire os tokens e **pare**; não caia no híbrido por reflexo.

O híbrido é o caso **mais caro** de reskin porque briga com o litheme (light-default:
cada componente embute `bg-base-100`/`bg-white` e `text-base-content` escuro). Mantém
os tokens claros e escurece só o chrome — e por isso herda todo o whack-a-mole abaixo.

## Por que um bg/cor no elemento NÃO basta

- `footer { background: navy }` **não aparece**: o `footer/container.liquid` tem um
  wrapper interno com `bg-base-100`/`bg-white` que **cobre** o navy.
- `product-card { background: #fff }` pode não pegar se o bg visível está num **nó
  interno** do componente; e sem ele, o texto do card (`text-base-content`, escuro)
  fica **escuro sobre o navy** → ilegível.
- O ícone do carrinho some porque vive num `span.indicator.text-base-content` — o
  utility **vence** o `color` herdado do header.
- Forçar `header { color: white }` quebra os **painéis claros aninhados**
  (mega-menu, dropdown, modal, drawer, minicart, busca): viram **branco no branco**.

## PASS sistemático (não é one-liner)

Antes de declarar pronto, varra TODA superfície que vira:
- [ ] header/nav: texto+ícones claros (incl. `.text-base-content`, ex.: carrinho).
- [ ] painéis claros aninhados (mega/dropdown/modal/**minicart drawer**/busca):
      re-afirmar texto **escuro** (mais específico, vence o claro do chrome).
- [ ] footer: o bg navy tem que ir no **wrapper interno** que pinta branco, não só
      no `<footer>`; e o texto vira claro. (Não drope os componentes ricos do footer —
      ver `litheme-structure.md` → "Footer nativo".)
- [ ] cards (tiles): bg claro **no nó certo** do `product-card` + texto escuro
      garantido (resetar `:is(h1..h6)` e dados que herdaram claro).
- [ ] qualquer seção de conteúdo na home escura: títulos claros, mas tiles/box
      internos mantêm seu próprio contraste.

Regra: **mudança de "temperatura" de fundo é mudança GLOBAL** → sweep amplo (todas as
superfícies × estados), não só a página que você olhou.

## ✅ Receita CONCRETA (body navy + tiles brancos) — verificada (caso real)

> "navy + tiles brancos" é **o exemplo concreto do caso real** que validou a receita.
> Leia "navy" como "a cor escura do shell desta marca" e aplique a mesma estrutura à
> paleta do caso atual.

1. **Tokens** (`@plugin "daisyui/theme"`): `--color-neutral` = navy (é o `body` bg) ·
   `--color-neutral-content` = branco · `--color-base-100` = branco (tiles/painéis) ·
   `--color-base-content` = ink escuro (texto nos tiles) · `primary` = cor de conversão ·
   `secondary` = cor de marca/nav. `color-scheme: "light"` (os tiles são claros).
2. **Contraste por SISTEMA, não por região (regra única — evita o whack-a-mole).**
   Marcar região por região (`.bk-on-dark` em cada container) é frágil: sempre escapa
   uma e o texto sai escuro-sobre-navy. Em vez disso, defina **default claro no `body`
   + carve-back escuro nos tiles** — UMA regra cobre TODA superfície:
   ```css
   /* DEFAULT (sobre o navy) = claro — pega header, footer, breadcrumb, shelf, PLP, PDP, menu… */
   body :is(h1,h2,h3,h4,h5,h6),
   body .text-base-content, body .collapse-title, body summary,
   body label:not(.btn), body a:not(.btn) { color: var(--color-neutral-content); }
   /* CARVE-BACK: dentro de qualquer TILE claro, texto volta ao ink escuro */
   :is(.bg-base-100,.bg-base-200,.bg-base-300,.bg-white),
   :is(.bg-base-100,.bg-base-200,.bg-base-300,.bg-white) :is(h1,h2,h3,h4,h5,h6,p,span,div,li,small,strong,td,th),
   :is(.bg-base-100,.bg-base-200,.bg-base-300,.bg-white) :is(.text-base-content,.collapse-title,summary,label) { color: var(--color-base-content); }
   :is(.bg-base-100,.bg-base-200,.bg-white) a:not(.btn) { color: var(--color-secondary); }
   ```
   O tile precisa só carregar `bg-base-100` (ex.: raiz do `<product-card>`, painel do
   buy-box, drawer do minicart). Sem marcar região nenhuma à mão.
   ⚠️ **`@utility btn-secondary` do litheme usa `text-neutral-content`** (assume neutral
   ESCURO). Num reskin onde `neutral-content` virou CLARO, o botão soft (`bg-base-200`)
   fica **branco-no-cinza-claro (invisível, ~1.1:1)**. Troque para `text-base-content`.
3. **Preço fica no accent** — carve-out que VENCE o carve-back (specificity):
   `.bk-on-dark strong[data-testid="li-product-price-selling"] { color: var(--color-primary); }`
   (senão o flip de `.text-base-content` pinta o preço de branco).
4. **Texto direto no body navy** (não num tile): títulos de shelf (`shelf/index` h2),
   título de categoria/busca (`search/index` h1), breadcrumb — usam `text-base-content`
   no litheme → troque por **`text-neutral-content`** (sempre ficam sobre o navy).
5. **Ícones do header em currentColor** (tirar `fill="#101828"`) e pintar pelo papel:
   `.bk-on-dark [data-testid^="li-header"] svg { color: var(--color-secondary); }`.

> **product-card NÃO é tile branco por default.** O `<product-card>` do litheme só tem
> bg atrás da imagem; nome/preço caem no `body` (navy → ilegível). Se o comp pede tile
> branco cheio, adicione **`bg-base-100 text-base-content rounded-box overflow-hidden`**
> à classe RAIZ do `<product-card>` — um golpe, vale em shelf e PLP.

## Dois edge-cases do carve-back (o sweep por sistema tem 2 furos previsíveis)

O par "default claro no body + carve-back escuro nos tiles" cobre 90% — mas duas
situações **invertem** dentro de um tile e o carve-back genérico erra. Adicione as
duas regras à fundação **junto** com o carve-back (não espere o bug aparecer
componente a componente):

1. **ILHA ESCURA dentro de tile claro** (header de drawer/minicart navy DENTRO do
   painel branco; faixa escura dentro de um card). O carve-back (`:is(.bg-base-100…)
   :is(h1..h6,span,strong,…)`) pinta o título da ilha de **ink → invisível sobre o
   navy**. Re-clareie a ilha com specificity ≥ a do carve-back (0,2,0) e ordem tardia:
   ```css
   .bk-drawer-head, .bk-drawer-head :is(span,strong,b,div,h1,h2,h3,h4,h5,h6,svg){ color: var(--color-neutral-content); }
   ```
   (Visto: o título "sacola" do minicart saiu escuro porque o header navy vive dentro
   do drawer `bg-base-100`. Só a verificação AO VIVO pega — análise estática "título
   branco sobre navy" engana, porque ignora o carve-back do ancestral.)
2. **BOTÃO PREENCHIDO dentro de tile claro** — o `.btn-primary` (CTA) num painel
   `bg-base-100` tem `strong/span` internos que o carve-back pinta de **ink sobre o
   accent → ilegível**. Exima o conteúdo do botão preenchido (vale p/ buy-box, minicart,
   qualquer CTA em tile):
   ```css
   :is(.bg-base-100,.bg-base-200,.bg-base-300,.bg-white) .btn-primary,
   :is(.bg-base-100,.bg-base-200,.bg-base-300,.bg-white) .btn-primary :is(span,strong,b,small,svg,p){ color: var(--color-primary-content); }
   ```
   (O `body …:not(.btn)` do default já exime links/labels; o carve-back dos TILES não —
   por isso precisa desta regra também.)

> Ao terminar, volte para `global-styling.md` (Global-ou-fork, tipografia, accent-WCAG)
> e para `qa-checklist.md` (a verificação ao vivo dos estados abertos é o que pega os
> furos acima).
