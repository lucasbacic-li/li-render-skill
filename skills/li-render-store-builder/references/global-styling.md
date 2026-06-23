# Estilização global-first (Tailwind v4 + DaisyUI v5)

> **Princípio central da skill.** Antes de escrever qualquer CSS por bloco,
> ajuste o **sistema global**. Componentes consistentes entre páginas vêm de
> editar tokens e estilos-base **uma vez**, não de recriar estilo por componente.
> Sintoma do anti-padrão: introduzir um CTA novo (ex.: um "+ Sacola" no card) mas
> deixar os botões DaisyUI (Finalizar compra, Calcular frete) no estilo antigo →
> linguagens divergentes na mesma loja.

> Os valores de marca (cor/tipo/raio) vêm do **brand-kit** (papéis) e do **comp**
> da Skill 2 (estrutura/escala). Este arquivo é o **método**; os literais concretos
> saem do brand-kit e do comp do caso atual.
> Mapa papel→token DaisyUI: `../../shared/litheme-capabilities/litheme-capabilities.spec.md`.

## ⚠️ Reskin DARK sobre o litheme (light-default): o whack-a-mole de contraste

> **Lição do 1º teste real de marca escura (caso real).** Marcas com **chrome
> escuro** (header/footer/hero navy) — ainda mais as **híbridas** (shell escuro +
> *tiles* claros, ex.: cards brancos sobre navy) — são o caso **mais caro** de
> reskin, porque o litheme é **light-default**: cada componente embute
> `bg-base-100`/`bg-white`/`bg-neutral` e `text-base-content` (escuro). Resultado:

**Por que um bg/cor no elemento NÃO basta:**
- `footer { background: navy }` **não aparece**: o `footer/container.liquid` tem um
  wrapper interno com `bg-base-100`/`bg-white` que **cobre** o navy.
- `product-card { background: #fff }` pode não pegar se o bg visível está num **nó
  interno** do componente; e sem ele, o texto do card (`text-base-content`, escuro)
  fica **escuro sobre o navy** → ilegível.
- O ícone do carrinho some porque vive num `span.indicator.text-base-content` — o
  utility **vence** o `color` herdado do header.
- Forçar `header { color: white }` quebra os **painéis claros aninhados**
  (mega-menu, dropdown, modal, drawer, minicart, busca): viram **branco no branco**.

**Duas estratégias (escolha conscientemente):**
1. **Esquema DARK por TOKEN (preferido p/ marca verdadeiramente escura).** Em vez
   de overrides por componente, vire o tema DaisyUI: `color-scheme: "dark"`,
   `--color-base-100/200/300` = tons escuros, `--color-base-content` = claro. O
   sistema inteiro inverte (cards, drawers, texto) **de uma vez**, sem caçar
   componente. ⚠️ Mas aí os "cards" usam `base-100` (escuro) — some o look de
   **tile branco**. Se a marca quer tiles claros sobre shell escuro (híbrido),
   isso NÃO resolve sozinho.
2. **Regiões escuras seletivas (chrome dark + conteúdo claro).** Mantém os tokens
   claros e escurece só header/footer/(hero). É o **mais barato** e já lê como a
   marca (header navy + logo + accents). Foi o que ficou estável no caso real. O
   **conteúdo claro** evita todo o whack-a-mole.

**Se for híbrido (shell escuro + tiles claros) — esse caso — é um PASS sistemático,
não um one-liner.** Antes de declarar pronto, varra TODA superfície que vira:
- [ ] header/nav: texto+ícones claros (incl. `.text-base-content`, ex.: carrinho).
- [ ] painéis claros aninhados (mega/dropdown/modal/**minicart drawer**/busca):
      re-afirmar texto **escuro** (mais específico, vence o claro do chrome).
- [ ] footer: o bg navy tem que ir no **wrapper interno** que pinta branco, não só
      no `<footer>`; e o texto vira claro.
      ⚠️ **NÃO dropar os componentes ricos do footer do litheme p/ casar com um comp
      simplificado.** O litheme traz `footer/{payments,payments-brands,social,copyright}`
      + newsletter; o site real costuma ter **"Pague com" (ícones de pagamento)**, **"Selos"
      (selos de confiança)** e **newsletter** — reskine-os (claros sobre navy), não os
      apague. Lição (3º caso): o agente reescreveu o footer como 4 colunas estáticas e
      **perdeu** payment-icons/newsletter/selos que existiam. **Atribuição mandatória da LI**
      (`copyright.liquid`): **integre-a ao footer escuro** (mesma faixa, texto/logo claros) —
      NÃO a deixe como **barra branca** separada destoando do layout. Unifique o rodapé num
      componente coeso seguindo o **site original**, não só o comp.
- [ ] cards (tiles): bg claro **no nó certo** do `product-card` + texto escuro
      garantido (resetar `:is(h1..h6)` e dados que herdaram claro).
- [ ] qualquer seção de conteúdo na home escura: títulos claros, mas tiles/box
      internos mantêm seu próprio contraste.

Regra: **mudança de "temperatura" de fundo é mudança GLOBAL** → sweep amplo
(todas as superfícies × estados), não a página que você olhou. Quando em dúvida
entre dark-shell híbrido e simplicidade, **dark-chrome + conteúdo claro** entrega
80% da marca com 20% do risco.

### ✅ Receita CONCRETA do híbrido (body navy + tiles brancos) — verificada (caso real)

> "navy + tiles brancos" aqui é **o exemplo concreto do caso real** que validou a
> receita — não é obrigatório. Leia "navy" como "a cor escura do shell desta marca"
> e aplique a mesma estrutura à paleta do caso atual.

Quando o cliente quer **fiel** (body navy em TODAS as páginas, conteúdo em painéis/cards
brancos), esta combinação convergiu com pouco whack-a-mole:

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
3. **Preço fica no accent** — carve-out que VENCE o `.bk-on-dark` (specificity):
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

#### Dois edge-cases do carve-back (o sweep por sistema tem 2 furos previsíveis)

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

#### Accent de conversão que FALHA WCAG — decida no FOUNDATION, não por componente

Muitas marcas têm um accent de conversão (verde/laranja/amarelo de luminância média)
que falha AA dos **dois** lados: texto-no-accent (CTA branco sobre o accent) **e**
accent-no-surface (preço colorido sobre branco) podem ficar **~2.6–2.9:1** (< 3.0). Isso
reaparece em **preço, CTA preenchido, badge de desconto, categoria/página ativa** — ou
seja, em quase todo componente. Não descubra isso 5 vezes (uma por sub-agente): **teste
o accent contra branco E o `*-content` contra o accent no Passo 1/3** e escolha
**conscientemente**, registrando no manifesto/_foundation:

- **(A) Fiel à marca** — mantenha o hex do kit; o accent é cor intencional → os flags de
  contraste de preço/CTA/badge/ativo são **aceitos e registrados** pelo gate (§4f). É o
  default "as-is" da skill. Custo: CTA branco-no-accent fica no limite de legibilidade.
- **(B) Escurecer o accent p/ AA** — troque **só o token `--color-primary`** por uma
  variante mais escura do mesmo matiz (ex.: subir até ~3.0–4.5:1 contra branco); cascateia
  para CTA/preço/badge de uma vez. Custo: leve desvio do hex do site original.

Decida UMA vez e cascateie pelo token — não recolora componente a componente. Se o
parceiro/usuário não tem preferência, **(A)** é o caminho fiel; ofereça **(B)** se a
legibilidade do CTA for crítica. (Exemplo resolvido: um verde de marca a 2.66:1 foi, num
caso, escurecido a ~3.65:1 a pedido — decisão do usuário, não automática.)

## Convenção de nomes (neutra)

- **Tokens DaisyUI do litheme**: `--color-base-*`, `--color-primary`,
  `--radius-*`, etc. — a base. (Ver `litheme-structure.md`.)
- **Tokens do projeto** (além dos DaisyUI): prefixo **`--bk-`** (brand-kit) —
  ex.: `--bk-line`, `--bk-caps`, `--bk-tracking-caps`, `--bk-section-head`.
- **Papéis de classe** (adicionados pelo reskin): prefixo neutro **`.bk-`** —
  ex.: `.bk-display`, `.bk-heading`, `.bk-body`, `.bk-mono`, `.bk-eyebrow`,
  `.bk-cta-text`. Cada um mapeia para um papel de `typography.roles` do kit.

## Global ou fork? Tabela de decisão (regra: forks são quase sempre erro)

Numa base DaisyUI/Tailwind, **toda decisão de estilo pertence ao sistema global**.
Um estilo por bloco é um *fork* — e fork é code smell, não a norma. Antes de
escrever qualquer estilo, classifique:

| O que você quer mudar | Onde isso vive (global) | Fork = erro se… |
|---|---|---|
| Cor (texto, fundo, borda) | token DaisyUI (`--color-*`) / `var(--bk-*)` | usar `text-black/white`, `bg-white`, hex no template |
| Forma (raio) | token `--radius-field/box/selector` | usar `rounded-xl/2xl/box…` no template |
| Botão / CTA preenchido | `.btn` global (+ `.btn-primary`) | criar um botão com estilo próprio no bloco |
| CTA de texto | `.bk-cta-text` (papel único) | recriar "mono caps + hover accent" à mão |
| Tipografia (família/caixa) | `@layer base` h1-h6 + papéis `.bk-display/.bk-heading/.bk-mono` | pôr `font-serif/mono` ou `font-[...]` por bloco |
| **Caixa-alta (chapéu/label/link)** | **escala caps tokenizada** (`--bk-caps`/`--bk-caps-xs` + `--bk-tracking-caps`) | inventar par tamanho/tracking por classe (`.16em` aqui, `.14em` ali, `px` vs `rem`) |
| Tamanho de título / head de seção | escala global (h-tags) + **um** clamp em `--bk-section-head` | `text-xl`/`text-2xl` fixo num h2 de seção; cada banner com seu tamanho |
| Ícone (cor) | `fill="currentColor"` (herda o token) | `fill="#hex"` fixo (fica off-brand pós-reskin) |
| Espaçamento/largura | utilities Tailwind + `.container` global | reimplementar gutter/max-width por seção |

**Fork só é aceitável** quando o *layout* é genuinamente único (ex.: a grade de
uma seção editorial específica) — e **mesmo aí**, cor/tipo/forma/CTA continuam
vindo do sistema (tokens, `.bk-display`, `.btn`), nunca valores novos. Se você se
pegar escrevendo um hex, um `font-family`, ou um botão do zero num template,
pare: quase certamente é pra ser global.

### O terceiro caso: classe estrutural COMPARTILHADA (escope com modificador)

Entre "token global" e "fork de um bloco" há uma armadilha que não aparece na
tabela: uma **classe estrutural compartilhada por vários componentes**. Ex.:
`.embla__slide` veste os slides do *shelf de produtos* — mas também do **banner
full/mini**, da **tarja promocional** e da **galeria da PDP** (todos usam o mesmo
carrossel embla). Estilizá-la *parece* local ("é só o slide do shelf"), mas tem
**raio global**: um `max-width` no `.embla__slide` encolheu banner, tarja e
galeria junto — regressão clássica, pega no review.

Regra: antes de estilizar QUALQUER classe que não seja exclusivamente sua,
**`grep` os usos** (`grep -rn "embla__slide" templates/`). Se ela aparece em mais
de um componente:

- **NÃO** estilize a classe compartilhada.
- Adicione uma **classe modificadora** no template do componente-alvo
  (`<div class="embla__slide embla__slide--product">`) e mire o CSS nela
  (`.embla__slide--product { max-width: 30rem }`).
- Os outros componentes herdam só a classe-base e seguem intactos.

É o mesmo `grep`-antes-de-mudar de `visual-regression.md`, estendido a **classes
estruturais** (não só tokens/utilities): nome que soa local ≠ raio local.
Classe compartilhada = raio global. Na dúvida, grep primeiro.

### Auto-auditoria (rode antes de declarar pronto)

Não confie na memória — rode `scripts/audit-theme-styles.sh <tema>`. Ele varre os
templates por: cores hardcoded em classes, ícones com `fill="#hex"` (devem ser
`currentColor`), `style=` com cor, `rounded-*` explícito, fonte por bloco,
título-como-corpo, e tamanho fixo grande em heading. Cada achado é candidato a
homogeneização. **O agente deve pegar as próprias exceções — não o usuário no review.**

## A ordem de ataque (do mais global ao mais local)

1. **Tokens de cor** — bloco `@plugin "daisyui/theme"` em `theme.css`. Mapeie os
   papéis do kit nos slots semânticos (`primary`, `base-*`, `accent`, …) seguindo
   o mapa em `litheme-capabilities`. Já cascateia para todos os componentes.
2. **Tokens de forma (raio)** — no mesmo bloco: `--radius-field` (botões/inputs),
   `--radius-box` (cards/modais/drawers), `--radius-selector` (controles
   pequenos/badges). Vêm de `radius` no kit: **marca `sharp` = `0rem`**; marca
   `round` = valores altos. Muda a "temperatura" de forma de toda a UI de uma vez.
3. **Tipografia base** (`@layer base`, nas TAGS) — define o sistema de títulos
   sem tocar em template nenhum. Mapeie os papéis de `typography.roles`:
   ```css
   html { font-family: var(--bk-font-body); }                 /* body */
   h1   { font-family: var(--bk-font-display); text-transform: none; } /* display */
   /* SE o comp usa subtítulos em caixa-alta: */
   h2,h3,h4,h5,h6 { font-family: var(--bk-font-heading); text-transform: uppercase; letter-spacing: var(--bk-tracking-caps); }
   ```
   Assim, "Destaques" (h2 do litheme) herda o papel de subtítulo da marca em
   qualquer página, sem editar o template do shelf.
   - ⚠️ **GREP primeiro: o mecanismo de fonte VARIA por versão do litheme.** Não
     assuma. Versões diferentes aplicam a família de jeitos diferentes:
     `@theme { --font-sans }` + utility `font-sans`, **ou** só `@layer base html
     { font-family }` + um `<link>` do Google em `head/style-general.liquid`. Rode
     `grep -rn "font-sans\|@theme\|--font-sans\|font-family" assets/style/theme.css
     templates/**/head/*` e troque a fonte **na(s) fonte(s) que você de fato achar**
     (o `<link>` do Google **e** a regra `font-family`). Se houver `--font-sans` no
     `@theme`, troque-o (o utility `font-sans` vence `@layer base html`); se NÃO houver,
     `@layer base html { font-family }` basta.
   - ⚠️ **Marca de FAMÍLIA ÚNICA: não imponha sistema serif/mono/caps.** Quando o kit
     mapeia `display=heading=body` para a **mesma** família (ex.: tudo numa grotesca/
     humanista) e os títulos do comp são **sentence-case**, NÃO aplique
     `text-transform:uppercase`/serif/mono nos h-tags só porque o caso resolvido (que
     era multi-família) fazia. Aponte todos os papéis para a única família e mantenha o
     caso dos títulos como o comp pede. O sistema caps/eyebrow só entra se o comp usa.
   - **Pegadinha**: se os títulos de display **misturam** duas famílias dentro de
     um `<h2>` que virou uppercase, o papel display precisa resetar:
     `.bk-display{ text-transform: none; }` — senão o display vira CAIXA ALTA.
4. **Componentes-base via `@utility` / seletor de classe** — botões, inputs,
   labels, cards. O litheme já redefine `@utility btn/input/label/...`. Para a
   linguagem da marca, **sobrescreva o `.btn` global** (não crie um botão por
   bloco):
   ```css
   .btn { font-family: var(--bk-font-mono); text-transform: uppercase; letter-spacing: var(--bk-tracking-caps); font-weight:500; }
   .input,.textarea,.select { font-family: var(--bk-font-mono); border-color: var(--bk-line); }
   ```
   Resultado: "Finalizar compra", "Continuar comprando", "Calcular frete",
   botão da newsletter — todos viram o mesmo botão da marca de uma vez.
5. **Só então, CSS por bloco** — e mesmo assim referenciando o sistema. Ex.: um
   **CTA de texto** (alternativa ao botão preenchido) deve ser um papel único
   reutilizável (`.bk-cta-text`: mono caps, hover accent), não uma regra nova por
   componente. "+ Sacola", "Ver coleção", "Ver tudo" usam o mesmo papel.

## Papéis de botão (defina todos globalmente; nunca um estilo ad-hoc)

A marca tem um número FIXO de papéis de botão. Mapeie cada botão do tema a um
deles — se precisar de um "quarto estilo", quase certamente é um dos abaixo mal
aplicado. A **aparência exata** (cor, dimensão, ornamento) vem do **comp** da
Skill 2; puxe os valores de lá, não chute. Tamanho tappável típico: primário
~56px, secundário ~46px.

- **Primário — compra** (`.btn.btn-primary`): o CTA forte da marca. Vale p/ todo
  `btn-primary` (add-to-cart, finalizar, continuar) sem tocar markup.
  - Especifique **`.btn.btn-primary`** (não `.btn-primary` puro — empata em
    especificidade com o DaisyUI e perde).
  - Se o comp pede um ornamento (ex.: caixa de seta), implemente via `::after`
    no `.btn.btn-primary` e **esconda o ícone interno duplicado**:
    `.btn.btn-primary > svg { display:none }` (o spinner fica em `<span>`, sobrevive).
    Senão uma seta no markup **soma** à do `::after` = "dois botões" (bug real).
- **Primário — formulário**: CTA de form mais leve (newsletter "Assinar", contato
  "Enviar"). Dê um nome próprio (ex.: `.bk-cta`) — não reuse um namespace ocupado.
- **Secundário** (`.btn-secondary`/`.btn-outline`/`.btn-soft`): quieto, abaixo do
  primário (transparente + borda `--bk-line` + texto mutado). Calcular frete,
  Adicionar cupom, cancelar.
- **Texto** (`.bk-cta-text`): mono caps, hover accent, sem fundo. Ações
  ultra-leves: "+ Sacola" no card, "ver coleção", "ver tudo".
- **Ícone** (close ×, qty +/-, header): `.bk-btn-icon` / `btn-square` —
  transparente, **sem borda**, quadrado 1:1. NÃO é o secundário (não leva borda).

> Antes de estilizar um CTA, **leia o `.btn.btn-primary` atual no `theme.css`** e
> use-o como está — não o reconstrua.

## Headers de drawer / bottom-sheet (heading GRANDE, fixo)

O litheme entrega os headers de drawer como `<span text-xs>` minúsculos. A marca
costuma querer **heading grande**: drawer ~32px (`.bk-drawer-title`), bottom-sheet
~24px (`.bk-sheet-title`). Use **tamanho FIXO**, não `clamp(vw)` — no drawer
estreito (~390px) o clamp cai no mínimo (a mesma pegadinha da escala tipográfica).
Estrutura em grid com filetes: `.bk-drawer-head` (`border-bottom` `--bk-line`) +
close numa célula com `border-left` (`.bk-drawer-head__close`) — não um botão com
caixa, só os filetes do grid. Converta minicart, busca, filtros, nav e os sheets
(frete, cupom, notify, consultar preço) — vários vêm como `<h3 text-lg>` (fork de
tamanho) ou `<span/p text-xs>` (título-como-corpo); ambos viram as classes acima.

## Inputs / formulários

Use o componente de form do comp como referência: input mono, borda hairline
(`--bk-line`), fundo da marca, raio herdado de `--radius-field`, botão preenchido
colado. Vale para newsletter, busca, cálculo de CEP, contato — todos herdam de
`.input`/`.btn`.

## Escala tipográfica (extrair do comp, não chutar)

Pegue os tamanhos do **comp** da Skill 2:
- **Big title / display** (manifesto, editorial): ex. `clamp(2.2rem, 5vw, 3.75rem)`.
- **Section head / título de prateleira**: ex. `clamp(1.3rem, 2.4vw, 2rem)` —
  **tokenize como `--bk-section-head`** e faça h2-base + banners + shelf puxarem
  dele (ver subseção abaixo). O litheme vem com `text-xl` fixo; trocar pelo token.
- **Body/prose**: ~`.92–.96rem`; **mono pequeno** (labels, tags): `.6–.7rem`;
  **eyebrow/label/link**: **escala caps tokenizada** (ver subseção) — **nunca**
  um par tamanho/tracking solto por classe.

No `@layer base`, dê tamanhos **modestos** aos h-tags (ex.: h2 `1.25rem`) para
não estourar em contextos estreitos (drawers usam `vw`!), e aplique o tamanho
**responsivo grande** explicitamente nos componentes proeminentes. `clamp(...,vw,...)`
num drawer estreito vira o teto do clamp → grande demais; prefira tamanho fixo
em headers de drawer.

## Escala caps tokenizada (chapéus, labels, links, botões)

> **A marca tem UM sistema de caixa-alta — não nove.** O sintoma do anti-padrão:
> cada papel caps (`.bk-eyebrow`, `.bk-label`, navlink, sublink, tag,
> `.bk-cta-text`, `.btn`, secundário, "remover"…) inventando seu próprio par
> tamanho/tracking — misturando `px` e `rem` para o MESMO papel visual. Resultado:
> "chapéu" e link com pesos diferentes lado a lado, e a mesma navegação parecendo
> de outra marca entre as telas. (No 1º caso, antes do audit: 9.6→16px × .02→.16em.)

Defina a escala como **tokens no `:root`** e faça todo papel caps puxar deles:

```css
:root{
  --bk-caps:.7rem;          /* degrau padrão — chapéu/label/link (~11px) */
  --bk-caps-xs:.6rem;       /* degrau micro — tags/badges (~9.6px)        */
  --bk-tracking-caps:.12em; /* tracking ÚNICO p/ todo caps                */
}
.bk-eyebrow,.bk-label,.bk-sublink,.bk-navlink,.bk-cta-text{
  letter-spacing:var(--bk-tracking-caps); font-size:var(--bk-caps);
}
.bk-tag{ letter-spacing:var(--bk-tracking-caps); font-size:var(--bk-caps-xs); }
.btn,.btn-secondary{ letter-spacing:var(--bk-tracking-caps); }
```

Nos templates, caps ad-hoc (`text-sm uppercase`, `tracking-wider`) também puxam o
token: `class="… uppercase tracking-[var(--bk-tracking-caps)]"`.

**Regra de ouro:** 2 degraus de tamanho + 1 tracking cobrem todos os chapéus. Se
você precisa de um terceiro tamanho de label, quase certamente é um head de seção
(use `--bk-section-head`) ou um botão (que herda do `.btn`), não um quarto degrau.

## Título de seção: UM clamp, tokenizado (`--bk-section-head`)

O "head de seção" reaparece em muitos blocos — shelf, os **3 banners**
(full/mini/showcase), `<h2>` genérico, empty states. O litheme entrega cada um
com seu tamanho fixo (`text-xl`, `text-2xl`, `text-xl md:text-3xl`…), então uma
home com três banners mostra **três tamanhos**, nenhum respondendo ao viewport.
Tokenize um clamp só e aponte todos para ele:

```css
:root{ --bk-section-head:clamp(1.3rem,2.4vw,2rem); }
@layer base{ h2{ font-size:var(--bk-section-head); } }   /* min do h2 = min do shelf */
```
```html
<h2 class="text-[var(--bk-section-head)] …">{{ banner.title }}</h2>
```

Pegadinha já vista: o `h2` base com `min` MAIOR que o do shelf (ex.: `1.5rem` vs
`1.3rem`) faz um `<h2>` "pelado" ficar **maior no mobile** que o head da
prateleira logo abaixo. Alinhe os `min`.

## Mesma navegação = mesma LINGUAGEM de tipo entre telas (não só tamanho)

Armadilha de fluxo secundário (ex.: navegação de categoria): o litheme dá ao
menu mobile links em `text-base` **sentence-case**, enquanto a nav desktop é
mono-caps. Vira a **mesma** navegação parecendo de marcas diferentes em cada
viewport. O certo é unificar a *linguagem* (mono + caps + `--bk-tracking-caps`) e
variar só o **tamanho tappável**: desktop `--bk-caps` (~11px), mobile `text-base`
(16px) — ambos mono-caps. E os labels de seção do drawer ("Categorias", "Links
importantes") são `.bk-label` (papel), não `<span text-xl>` sentence-case
(título-como-corpo).

## Hierarquia de cor (título vs. corpo)

Erro comum: usar a MESMA cor para título e corpo → hierarquia achatada. Separe os
papéis `ink` (forte) e `ink_muted` (corpo) do kit. O método (genérico, ver também
`litheme-capabilities`):

- **Corpo / descrições / leads**: papel **`ink_muted`**.
  ⚠️ **`html { color: ink_muted }` NÃO basta** — o litheme aplica `text-base-content`
  (utility) na maioria dos textos, que vence o `html` herdado → o corpo continua
  escuro. O lugar certo é o **token**: `--color-base-content: <ink_muted>`. Aí
  TODO `text-base-content` clareia de uma vez.
- **Títulos + dados fortes**: papel **`ink`**. Como agora usam `text-base-content`
  também, **force-os de volta** com regras **fora de `@layer`** (no Tailwind v4, CSS
  sem camada vence o utility, que está em `@layer utilities`):
  ```css
  h1,h2,h3,h4,h5,h6 { color: var(--bk-ink); }                       /* títulos fortes */
  .font-bold, .font-semibold { color: var(--bk-ink); }              /* dados fortes  */
  ```
- ⚠️ **Carve-out do PREÇO — a regra de "dados fortes → ink" come o preço.** O preço de
  venda do litheme é um `<strong class="font-semibold …" data-testid="li-product-price-selling">`
  dentro do partial `partials/product-pricing.liquid` (usado no card **e** na PDP). Uma
  regra cega `.font-semibold → ink` pinta o preço de **escuro** — errado quando a marca
  mostra o preço no **accent** (verde/cor de conversão). A base riscada (`de R$ X`) é
  `span` mutado, não pega. **Decida o papel do preço pelo comp** e dê a ele uma regra
  *mais específica* que vença a de hierarquia:
  ```css
  /* marca o partial uma vez (<div class="… bk-pricing">) e: */
  .bk-pricing strong { color: var(--bk-accent); }   /* preço/parcelas em verde/conversão */
  ```
  (Se a marca usa preço em `ink`, aí sim deixe cair na regra de dados fortes.) Regra
  genérica: **todo dado que a marca renderiza em ACCENT** (preço, disponibilidade,
  desconto) precisa de carve-out — a hierarquia ink só vale para título/nome/corpo.
- **Eyebrows / supporting**: `ink_muted` também.
- Cuidado com `text-black`/`text-white`/`bg-white` **hardcoded** nos templates do
  litheme — troque por tokens.

## Auditoria de consistência (faça sempre no fim de um pass)

`grep` os templates por divergências, não confie só no que viu na tela:
- **Títulos em `<p>`/`<span>`** que deviam ser heading: `grep -nE "<p[^>]*text-(lg|xl)[^>]*font-medium"`.
  (Ex. reais: empty state do carrinho em `<p>` body; header do drawer de filtros.)
- **Cores hardcoded**: `grep -rn "text-black\|text-white\|bg-white"`.
- **Tamanhos fixos** que competem com o sistema (`text-xl` no título de
  prateleira). Alinhe ao sistema em vez de criar exceção.
- **Escala caps divergente** (tracking/size literal num papel mono-caps):
  `audit-theme-styles.sh` checks pegam tracking literal em template
  (`tracking-wider`…) e em papel caps no CSS (`letter-spacing:.14em` em vez de
  `var(--bk-tracking-caps)`).

## Como verificar um pass global

Depois de mexer no global, confirme em **componentes diferentes e páginas
diferentes** que convergiram (não só onde você olhou): um botão de carrinho, um
de form, um título de seção, um título de display. Se algum ficou divergente,
provavelmente há um override local de utility (ex.: `rounded-full` explícito,
`text-lg` fixo) competindo — alinhe-o ao sistema em vez de criar exceção.

## Pass único: botões, formulários, PICKERS e ÍCONES (faça os quatro juntos)

Não conserte um botão e deixe o picker/ícone divergente — eles aparecem juntos na
mesma tela (minicart, PDP, busca). Um pass de consistência cobre os QUATRO de uma
vez, via global. Checklist (ordem do mais barato/abrangente):

1. **Raio — anule os forks de uma vez (marca reta).** O litheme espalha
   `rounded-full / rounded-lg/md/xl/2xl / btn-circle` por dezenas de templates
   (setas de carrossel, close, dots, thumbs, sheets, qty-picker via `join`).
   Trocar classe por classe é caça sem fim. Para uma marca **sharp**, uma regra
   global **fora de `@layer`** neutraliza todos (vence as utilities Tailwind, que
   ficam em `@layer utilities`):
   ```css
   [class*="rounded-"]:not(.rounded-none){ border-radius: 0; }
   .btn-circle{ border-radius: 0; }
   .join>:where(.join-item,.btn,.input,input,button,select){ border-radius: 0; }
   ```
   Resolve num golpe: setas redondas da vitrine/banner, close redondo de
   drawers/modais, qty-picker (o `join` arredonda as pontas), dots e thumbs.
   (Para uma marca soft, o inverso: deixe os tokens `--radius-*` altos e não force
   0.) Lembre de tirar `rounded-full` de `@utility floating-bar-style` também.
2. **Ícones → `currentColor` (varredura).** O litheme vem cheio de
   `fill="#101828"/#1C1B1F/#0F172B` (cinzas), e pior, **cores semânticas da paleta
   default**: `#0846EF` (azul), `#27A47D` (verde), `#FF6265` (vermelho), `#FCB700`
   (amarelo) — todas off-brand pós-reskin. `fill=` inline VENCE CSS, então tem que
   editar o template. Faça uma varredura única (preserva `#D9D9D9` máscara e fills
   de **fundo claro** dentro do ícone, ex.: `#F5F6F8`): troque esses hexes por
   `currentColor` em `templates/**` — aí cada ícone herda o token do contexto.
   Cobre coupon (verde), notify-me (vermelho), star (amarelo), setas (azul), +/-.
3. **`bg-white` → token.** Drawers/sheets do litheme usam `bg-white` (frio).
   Troque por `bg-base-100` (a surface da marca). `bg-black/50` de scrim pode ficar.
4. **Botões → os papéis fixos (sem terceiro estilo).** Já coberto acima: `.btn`/
   `.btn-primary` (preenchido) e `.bk-cta-text` (texto). Os **toggles** do minicart
   ("Calcular frete", "Cupom") são secundários (transparente + hairline); os
   **submits** dentro deles é que são primários.
5. **BORDAS → hairline tokenizada (varredura sistemática, igual a raio/ícones).** O
   litheme espalha `border`/`border-base-200`/`border-white/20`/`outline-black/10` em
   painéis flutuantes (mega-menu, dropdown de ordenação, autocomplete, sheets, popovers).
   Num reskin **dark-chrome** esses defaults viram **bordas claras/brancas AGRESSIVAS
   sobre o navy** — destoam do comp (que usa filete sutil) e gritam. ⚠️ Lição (3º caso):
   a borda branca do mega-menu de categorias ficou "super agressiva e fora do comp".
   Trate borda como SISTEMA: defina `--bk-line` (sobre claro) e `--bk-line-on-dark`
   (`rgba(255,255,255,.12–.16)` sobre escuro) e faça os painéis puxarem deles. Para
   superfícies escuras flutuantes, **não deixe `border-white/20`/`outline-black/10`** do
   litheme; troque por `--bk-line-on-dark` (ou `border-transparent` + sombra). `grep`
   `border-white\|outline-black\|border-base-200\|/20\|/10` nos templates de
   menu/dropdown/autocomplete/floating-bar e homogeneíze. Borda é o 5º eixo do pass
   (raio, ícone, bg, botão, **borda**) — todos saem do sistema, nenhum solto.

**Verifique os CINCO num lugar só:** abra o **minicart com 1 item** (qty-picker +
Calcular/Cupom + Finalizar + close + ícones + **bordas dos sheets**), o **mega-menu de
categorias em HOVER** (bordas do painel) e a **vitrine mobile** (setas). Se algum ainda
diverge, é override local competindo — alinhe ao sistema. ⚠️ **Estados HOVER/ABERTO
(mega-menu, dropdown de sort, autocomplete) entram OBRIGATORIAMENTE nessa verificação** —
foram a fonte dos bugs que escaparam (texto escuro-sobre-escuro + borda branca agressiva).

## Gotcha de sync: arquivo que "não atualiza" no preview

Sintoma: você edita um template, mas o preview continua mostrando a versão
antiga — enquanto **outros** arquivos (CSS, `index.json`, outros templates)
atualizam normalmente. O preview do LI Render tem **cache desligado**, então não é
cache: é o `li-cli theme sync` que **travou o estado daquele arquivo específico**
(acha que já o subiu). Acontece mais sem `-r`.

Diagnóstico rápido: edite o **conteúdo de `index.json`** (não só `touch` — mude
algo, ex.: adicione `properties`) e veja se a página re-renderiza. Se re-renderiza
mas o componente continua antigo, é o **arquivo de template** que está preso.

Saídas (em ordem):
1. Rode `li-cli theme sync <nome> -r` (live-reload via WebSocket) em vez de `sync`
   puro — evita o estado preso.
2. **Force um push tratando-o como arquivo novo:** copie o template para um **novo
   nome** (`home-cta.liquid` → `home-signup.liquid`), aponte o `index.json` pro
   novo, e remova o órfão. O sync empurra arquivos novos mesmo quando o estado do
   antigo travou.
3. `li-cli theme push` força upload de tudo — mas é **interativo (y/n + diff)** e
   recusa stdin, então precisa de um TTY humano.

Nuance: se um **`sync` watcher já está rodando** (sinal: `Address already in use`
no socket de reload ao iniciar outro), ele sobe seus templates/assets **conforme
você salva**. Aí o `push` vai listar esses arquivos como **"No Change"** — não é
falha, o watcher já os subiu. O que o push ainda pega são **pages (`*.json`)** e
arquivos editados antes do watcher subir. Na dúvida, **verifique no preview**
(fonte da verdade), não no diff do push.

## Grade aparente na PDP (acordeões + colunas)

A PDP reusa a **mesma linguagem de grade** do footer/home/minicart: linhas
`var(--bk-line)`, padding no ritmo do footer (`clamp(24px,3vw,40px)`), labels
eyebrow caps. Dois escopos de CSS (não forks — puxam só tokens/papéis):

- `.bk-pdp-band` — faixa de conteúdo full-width: `>*` ganha padding-block e `>*+*`
  ganha `border-top` (linhas de grid entre compre-junto/reviews). Use `:has(> *)`
  no `border-top`/`margin-top` da faixa pra **não desenhar linha órfã** quando o
  produto não tem reviews/compre-junto.
- `.bk-pdp-accordion` / `.bk-pdp-band .collapse-title` — título DaisyUI vira eyebrow
  (`--bk-font-mono` + caps + `--bk-tracking-caps`); o indicador
  `.collapse-plus>.collapse-title:after` vai a `font-size:~2.25rem` p/ ler como
  ícone grande da marca. A specificity do escopo `.bk-pdp-*` vence o `@utility
  collapse-title` e o `:where()` do DaisyUI sem `!`.

Ver o layout (duas zonas, sticky, fotos empilhadas) em `page-json-recipes.md` →
"PDP em duas zonas".

### Gotcha: o browser cacheia `theme.min.css` no preview

O preview do LI Render tem cache server-side desligado, mas o **navegador** cacheia
o asset CSS. Depois de `build:css` + sync, um reload normal pode mostrar CSS velho
(uma regra nova "não aparece"). Confirme com `getComputedStyle`/buscando o seletor
nos `document.styleSheets`; se faltar, faça **hard reload** (Cmd+Shift+R) pra puxar
o `theme.min.css` novo.
