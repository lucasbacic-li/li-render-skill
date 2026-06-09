# Estilização global-first (Tailwind v4 + DaisyUI v5)

> **Princípio central da skill.** Antes de escrever qualquer CSS por bloco,
> ajuste o **sistema global**. Componentes consistentes entre páginas vêm de
> editar tokens e estilos-base **uma vez**, não de recriar estilo por componente.
> Sintoma do anti-padrão: introduzir um CTA novo (ex.: "+ Sacola" mono no card)
> mas deixar os botões DaisyUI (Finalizar compra, Calcular frete) no estilo
> antigo → linguagens divergentes na mesma loja.

> Nota: a "Tailwind CSS Skill" de referência que o usuário trouxe era um scaffold
> auto-gerado **vazio** (SKILL.md boilerplate + um stub "Installing Tailwind with
> Vite"). Sem metodologia aproveitável — o valor está nos padrões reais abaixo.

## Global ou fork? Tabela de decisão (regra: forks são quase sempre erro)

Numa base DaisyUI/Tailwind, **toda decisão de estilo pertence ao sistema global**.
Um estilo por bloco é um *fork* — e fork é code smell, não a norma. Antes de
escrever qualquer estilo, classifique:

| O que você quer mudar | Onde isso vive (global) | Fork = erro se… |
|---|---|---|
| Cor (texto, fundo, borda) | token DaisyUI (`--color-*`) / `var(--ora-*)` | usar `text-black/white`, `bg-white`, hex no template |
| Forma (raio) | token `--radius-field/box/selector` | usar `rounded-xl/2xl/box…` no template |
| Botão / CTA preenchido | `.btn` global (+ `.btn-primary`) | criar um botão com estilo próprio no bloco |
| CTA de texto | `.ora-cta-text` (papel único) | recriar "mono caps + hover tangerina" à mão |
| Tipografia (família/caixa) | `@layer base` h1-h6 + papéis `.ora-serif/.ora-grotesk/.ora-mono` | pôr `font-serif/mono` ou `font-[...]` por bloco |
| **Caixa-alta mono (chapéu/label/link)** | **escala caps tokenizada** (`--ora-caps`/`--ora-caps-xs` + `--ora-tracking-caps`) | inventar par tamanho/tracking por classe (`.16em` aqui, `.14em` ali, `px` vs `rem`) |
| Tamanho de título / head de seção | escala global (h-tags) + **um** clamp em `--ora-section-head` | `text-xl`/`text-2xl` fixo num h2 de seção; cada banner com seu tamanho |
| Ícone (cor) | `fill="currentColor"` (herda o token) | `fill="#hex"` fixo (fica off-brand pós-reskin) |
| Espaçamento/largura | utilities Tailwind + `.container` global | reimplementar gutter/max-width por seção |

**Fork só é aceitável** quando o *layout* é genuinamente único (ex.: a grade de
uma seção editorial específica) — e **mesmo aí**, cor/tipo/forma/CTA continuam
vindo do sistema (tokens, `.ora-serif`, `.btn`), nunca valores novos. Se você se
pegar escrevendo um hex, um `font-family`, ou um botão do zero num template,
pare: quase certamente é pra ser global.

### O terceiro caso: classe estrutural COMPARTILHADA (escope com modificador)

Entre "token global" e "fork de um bloco" há uma armadilha que não aparece na
tabela: uma **classe estrutural compartilhada por vários componentes**. Ex.:
`.embla__slide` veste os slides do *shelf de produtos* — mas também do **banner
full/mini**, da **tarja promocional** e da **galeria da PDP** (todos usam o mesmo
carrossel embla). Estilizá-la *parece* local ("é só o slide do shelf"), mas tem
**raio global**: um `max-width` no `.embla__slide` encolheu banner, tarja e
galeria junto — regressão clássica, pega no review do usuário.

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
homogeneização. **Foi assim que o usuário pegou as exceções no review — o agente
deveria pegá-las sozinho.**

## A ordem de ataque (do mais global ao mais local)

1. **Tokens de cor** — bloco `@plugin "daisyui/theme"` em `theme.css`. Mapeie a
   paleta da marca nos slots semânticos (`primary`, `base-*`, `accent`, …). Já
   cascateia para todos os componentes (ver `litheme-structure.md`).
2. **Tokens de forma (raio)** — no mesmo bloco: `--radius-field` (botões/inputs),
   `--radius-box` (cards/modais/drawers), `--radius-selector` (controles
   pequenos/badges). **Uma marca editorial/sharp = `0rem`**; uma marca soft =
   valores altos. Muda a "temperatura" de forma de toda a UI de uma vez.
   - Ora: field `0`, box `0`, selector `0.125rem` (a ref. usa formas retas).
3. **Tipografia base** (`@layer base`, nas TAGS) — define o sistema de títulos
   sem tocar em template nenhum:
   ```css
   html { font-family: "Geist Mono", ui-monospace, monospace; }   /* body */
   h1   { font-family: "Lusitana", serif; text-transform: none; } /* big title (display) */
   h2,h3,h4,h5,h6 { font-family: "Host Grotesk"; text-transform: uppercase; letter-spacing:.04em; } /* subtitles ALL CAPS */
   ```
   Mapeamento da Ora (do `index.html`): **big titles** = Lusitana + Host Grotesk
   (display, misturados), **subtitles** = Host Grotesk all caps, **body** = Geist
   Mono. Assim, "Destaques" (h2 do litheme) vira "DESTAQUES" em qualquer página,
   sem editar o template do shelf.
   - **Pegadinha**: se os títulos de display misturam serif + grotesca dentro de
     um `<h2>` (que agora é uppercase), o papel serif precisa resetar:
     `.ora-serif{ text-transform: none; }` — senão o serif romântico vira
     CAIXA ALTA. (Verificado: "A Sua Jornada de" continua caixa-mista; só
     "REENCANTAMENTO" sobe.)
4. **Componentes-base via `@utility` / seletor de classe** — botões, inputs,
   labels, cards. O litheme já redefine `@utility btn/input/label/...`. Para a
   linguagem da marca, **sobrescreva o `.btn` global** (não crie um botão por
   bloco):
   ```css
   .btn { font-family: var(--ora-font-mono); text-transform: uppercase; letter-spacing:.1em; font-weight:500; }
   .btn-primary:hover { background-color: var(--ora-cacau); }
   .input,.textarea,.select { font-family: var(--ora-font-mono); border-color: var(--ora-line-2); }
   ```
   Resultado: "Finalizar compra", "Continuar comprando", "Calcular frete",
   botão da newsletter — todos viram o mesmo botão Ora (mono caps, reto, espresso)
   de uma vez.
5. **Só então, CSS por bloco** — e mesmo assim referenciando o sistema. Ex.: um
   **CTA de texto** (alternativa ao botão preenchido) deve ser um papel único
   reutilizável (`.ora-cta-text`: mono caps, hover tangerina), não uma regra
   nova por componente. O card "+ Sacola", "Ver coleção" etc. usam o mesmo papel.

## Papéis de botão (defina todos globalmente; nunca um estilo ad-hoc)

A marca tem um número FIXO de papéis de botão. Mapeie cada botão do tema a um
deles — se você precisar de um "quarto estilo", quase certamente é um dos abaixo
mal aplicado. Escala maior ("Material large"): **primário 56px, secundário ~46px**
(o lojista revisa no Paper; puxe os valores de lá, não chute).

- **Primário — compra** (`.btn.btn-primary`): **barra lilás + caixa escura 1:1 à
  direita** (a caixa é um `::after` com `→`, vale p/ todo `btn-primary` sem tocar
  markup), label creme, mono caps, **min-height 56px**. Ações de compra: add-to-cart,
  finalizar, continuar. (Especifique `.btn.btn-primary` — `.btn-primary` puro empata
  em especificidade com o DaisyUI e perde.) Esconda ícone interno duplicado:
  `.btn.btn-primary > svg { display:none }` (o spinner fica em `<span>`, sobrevive).
- **Primário — formulário** (`.ora-cta`): **texto sublinhado + caixa escura com
  ícone** (label 16px mono + caixa 54×54). CTAs de form leves: newsletter "Assinar",
  contato "Enviar", "request demo".
- **Secundário** (`.btn-secondary`/`.btn-outline`/`.btn-soft`): **transparente +
  borda argila a 50% + texto argila mutado**, mono 12px tracking `.14em`, padding
  16/16/12 (~46px). Quieto, abaixo do primário. Calcular frete, Adicionar cupom,
  cancelar. (Revisado pelo lojista — antes era borda cheia + texto ink.)
- **Texto** (`.ora-cta-text`, opcional `--underline`): mono caps, hover tangerina,
  sem fundo. Ações ultra-leves: "+ Sacola" no card, "ver coleção", "ver tudo".
- **Ícone** (close ×, qty +/-, header): `.ora-btn-icon` / `btn-square` —
  transparente, **sem borda**, quadrado 1:1. NÃO é o secundário (não leva borda).

## Headers de drawer / bottom-sheet (grotesca GRANDE, fixa)

O litheme entrega os headers de drawer como `<span text-xs>` minúsculos. A marca
quer **grotesca grande**: drawer **32px** (`.ora-drawer-title`), bottom-sheet
**24px** (`.ora-sheet-title`). Use **tamanho FIXO**, não `clamp(vw)` — no drawer
estreito (~390px) o clamp cai no mínimo (a mesma pegadinha da escala tipográfica).
Estrutura em grid com filetes: `.ora-drawer-head` (`border-bottom` argila) + close
numa célula com `border-left` argila (`.ora-drawer-head__close`) — não um botão com
caixa, só os filetes do grid. Converta minicart, busca, filtros, nav e os sheets
(frete, cupom, notify, consultar preço) — vários vêm como `<h3 text-lg>` (fork de
tamanho) ou `<span/p text-xs>` (título-como-corpo); ambos viram as classes acima.

## Inputs / formulários

Use o componente de form da marca (na Ora, a newsletter do `index.html`) como
referência: input mono, borda hairline argila, fundo branco-quente, **reto**
(herda de `--radius-field: 0`), botão preenchido colado. Isso vale para
newsletter, busca, cálculo de CEP, contato — todos herdam de `.input`/`.btn`.

## Escala tipográfica (extrair da referência, não chutar)

Pegue os tamanhos do(s) HTML(s) de referência. Da Ora (`homepage.css`):
- **Big title / display** (manifesto, editorial): `clamp(2.2rem, 5vw, 3.75rem)`.
- **Section head / título de prateleira**: `clamp(1.3rem, 2.4vw, 2rem)` —
  **tokenize como `--ora-section-head`** e faça h2-base + banners + shelf puxarem
  dele (ver subseção abaixo). O litheme vem com `text-xl` fixo; trocar pelo token.
- **Body/prose**: ~`.92–.96rem`; **mono pequeno** (labels, tags): `.6–.7rem`;
  **eyebrow/label/link**: **escala caps tokenizada** (ver subseção abaixo) —
  **nunca** um par tamanho/tracking solto por classe.

No `@layer base`, dê tamanhos **modestos** aos h-tags (ex.: h2 `1.25rem`) para
não estourar em contextos estreitos (drawers usam `vw`!), e aplique o tamanho
**responsivo grande** explicitamente nos componentes proeminentes (título de
prateleira). `clamp(...,vw,...)` num drawer estreito vira o teto do clamp →
grande demais; prefira tamanho fixo em headers de drawer.

## Escala mono-caps tokenizada (chapéus, labels, links, botões)

> **A marca tem UM sistema de caixa-alta mono — não nove.** O sintoma do
> anti-padrão: cada papel caps (`.ora-eyebrow`, `.ora-label`, `.ora-navlink`,
> `.ora-sublink`, `.ora-tag`, `.ora-cta-text`, `.btn`, secundário, "remover"…)
> inventando seu próprio par tamanho/tracking — na Ora, antes do audit, isso era
> **9.6→16px** de tamanho × **.02→.16em** de tracking, misturando `px` e `rem`
> para o MESMO papel visual. Resultado: "chapéu" e link com pesos diferentes
> lado a lado, e a mesma navegação parecendo de outra marca entre as telas.

Defina a escala como **tokens no `:root`** e faça todo papel caps puxar deles —
em vez de cada classe declarar seu próprio valor:

```css
:root{
  --ora-caps:.7rem;          /* degrau padrão — chapéu/label/link (~11px) */
  --ora-caps-xs:.6rem;       /* degrau micro — tags/badges (~9.6px)        */
  --ora-tracking-caps:.12em; /* tracking ÚNICO p/ todo caps                */
}
/* cada papel referencia o token, nunca um literal: */
.ora-eyebrow,.ora-label,.ora-sublink,.ora-navlink,.ora-cta-text{
  letter-spacing:var(--ora-tracking-caps); font-size:var(--ora-caps);
}
.ora-tag{ letter-spacing:var(--ora-tracking-caps); font-size:var(--ora-caps-xs); }
.btn,.btn-secondary{ letter-spacing:var(--ora-tracking-caps); }
```

Nos templates, caps ad-hoc (`text-sm uppercase`, `tracking-wider`) também puxam o
token: `class="… uppercase tracking-[var(--ora-tracking-caps)]"`. Verificado no
preview pós-normalização: eyebrow, navlink e footer-label — antes `.16/.12/.14em`
— renderizam **idênticos a 11.2px / 1.344px (.12em)**.

**Regra de ouro:** 2 degraus de tamanho + 1 tracking cobrem todos os chapéus. Se
você precisa de um terceiro tamanho de label, quase certamente é um head de seção
(use `--ora-section-head`) ou um botão (que herda do `.btn`), não um quarto degrau.

## Título de seção: UM clamp, tokenizado (`--ora-section-head`)

O "head de seção" reaparece em muitos blocos — shelf, os **3 banners**
(full/mini/showcase), `<h2>` genérico, empty states. O litheme entrega cada um
com seu tamanho fixo (`text-xl`, `text-2xl`, `text-xl md:text-3xl`…), então uma
home com três banners mostra **três tamanhos**, nenhum respondendo ao viewport.
Tokenize um clamp só e aponte todos para ele:

```css
:root{ --ora-section-head:clamp(1.3rem,2.4vw,2rem); }
@layer base{ h2{ font-size:var(--ora-section-head); } }   /* min do h2 = min do shelf */
```
```html
<h2 class="text-[var(--ora-section-head)] …">{{ banner.title }}</h2>
```

Pegadinha já vista: o `h2` base com `min` MAIOR que o do shelf (ex.: `1.5rem` vs
`1.3rem`) faz um `<h2>` "pelado" ficar **maior no mobile** que o head da
prateleira logo abaixo. Alinhe os `min`.

## Mesma navegação = mesma LINGUAGEM de tipo entre telas (não só tamanho)

Armadilha de fluxo secundário (ex.: navegação de categoria): o litheme dá ao
menu mobile links em `text-base` **sentence-case**, enquanto a nav desktop é
mono-caps. Vira a **mesma** navegação parecendo de marcas diferentes em cada
viewport. O certo é unificar a *linguagem* (mono + caps + `--ora-tracking-caps`)
e variar só o **tamanho tappável**: desktop `--ora-caps` (~11px), mobile `text-base`
(16px) — ambos mono-caps. E os labels de seção do drawer ("Categorias", "Links
importantes") são `.ora-label` (papel), não `<span text-xl>` sentence-case
(título-como-corpo). Verificado: label `11.2px .ora-label`, link de categoria
`16px mono caps .12em`.

## Hierarquia de cor (título vs. corpo)

Erro comum: usar a MESMA cor (espresso) para título e corpo → hierarquia
achatada. A marca separa (ver `--ink` vs `--muted` na ref.):
- **Títulos + dados fortes** (nomes, preços): **espresso** (`--color-base-content`).
  Force nos h-tags: `h1..h6 { color: var(--ora-espresso); }`.
- **Corpo / descrições / leads**: **noz `#775546`** (mais claro).
  ⚠️ **`html { color: noz }` NÃO basta** — o litheme aplica `text-base-content`
  (utility) na maioria dos textos, que vence o `html` herdado → o corpo continua
  escuro (sintoma: "o body ainda está escuro na maior parte"). O lugar certo é o
  **token**: `--color-base-content: #775546` (noz). Aí TODO `text-base-content`
  clareia de uma vez.
  - **Mas então os títulos/dados que usam `text-base-content` também clareiam.**
    Force-os de volta a espresso com regras **fora de `@layer`** (no Tailwind v4,
    CSS sem camada vence o utility, que está em `@layer utilities`):
    ```css
    h1,h2,h3,h4,h5,h6 { color: var(--ora-espresso); }   /* títulos fortes */
    .font-bold, .ora-card__name, .ora-card__price { color: var(--ora-espresso); } /* dados fortes */
    ```
  - Resultado verificado: "12x sem juros", links, descrições → noz; títulos,
    nav, nomes, preços → espresso. Hierarquia real.
- **Eyebrows / supporting**: noz também.
- Cuidado com `text-black`/`text-white`/`bg-white` **hardcoded** nos templates do
  litheme (ex.: descrição do carrinho usava `text-black`) — troque por tokens.

## Auditoria de consistência (faça sempre no fim de um pass)

`grep` os templates por divergências, não confie só no que viu na tela:
- **Títulos em `<p>`/`<span>`** que deviam ser heading: `grep -nE "<p[^>]*text-(lg|xl)[^>]*font-medium"`.
  Ex. reais corrigidos: empty state do carrinho ("Seu carrinho está vazio" estava
  em `<p>` body), header do drawer de filtros ("Filtros").
- **Cores hardcoded**: `grep -rn "text-black\|text-white\|bg-white"`.
- **Tamanhos fixos** que competem com o sistema (`text-xl` no título de
  prateleira). Alinhe ao sistema em vez de criar exceção.
- **Escala caps divergente** (tracking/size literal num papel mono-caps):
  `audit-theme-styles.sh` checks 9-10 pegam tracking literal em template
  (`tracking-wider`…) e em papel mono-caps no CSS (`letter-spacing:.14em` em vez
  de `var(--ora-tracking-caps)`). Tudo que é caixa-alta mono puxa dos tokens
  `--ora-caps`/`--ora-caps-xs` + `--ora-tracking-caps`.

## Como verificar um pass global

Depois de mexer no global, confirme em **componentes diferentes e páginas
diferentes** que convergiram (não só onde você olhou): um botão de carrinho, um
de form, um título de seção, um título de display. Se algum ficou divergente,
provavelmente há um override local de utility (ex.: `rounded-full` explícito,
`text-lg` fixo) competindo — alinhe-o ao sistema em vez de criar exceção.

## Pass único: botões, formulários, PICKERS e ÍCONES (faça os quatro juntos)

Não conserte um botão e deixe o picker/ícone divergente — eles aparecem juntos
na mesma tela (minicart, PDP, busca). Um pass de consistência cobre os QUATRO de
uma vez, via global. Checklist (ordem do mais barato/abrangente):

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
   Resolve num golpe: **setas redondas da vitrine/banner**, **close redondo** de
   drawers/modais, **qty-picker** (o `join` arredonda as pontas), dots e thumbs.
   (Para uma marca soft, o inverso: deixe os tokens `--radius-*` altos e não force
   0.) Lembre de tirar `rounded-full` de `@utility floating-bar-style` também.
2. **Ícones → `currentColor` (varredura).** O litheme vem cheio de
   `fill="#101828"/#1C1B1F/#0F172B` (cinzas), e pior, **cores semânticas da paleta
   ANTIGA**: `#0846EF` (azul), `#27A47D` (verde), `#FF6265` (vermelho), `#FCB700`
   (amarelo) — todas off-brand pós-reskin. `fill=` inline VENCE CSS, então tem que
   editar o template. Faça uma varredura única (preserva `#D9D9D9` máscara e fills
   de **fundo claro** dentro do ícone, ex.: `#F5F6F8`):
   ```bash
   # fill/stroke de cor estrutural/semântica antiga → currentColor
   ```
   Use um script que troque esses hexes por `currentColor` em `templates/**` —
   aí cada ícone herda o token Ora do contexto (espresso/noz). Cobre coupon
   (verde), notify-me (vermelho), star (amarelo), setas (azul), +/- do carrinho.
3. **`bg-white` → token.** Drawers/sheets do litheme usam `bg-white` (frio).
   Troque por `bg-base-100` (branco-quente da marca). `bg-black/50` de scrim pode
   ficar.
4. **Botões → os dois papéis (sem terceiro estilo).** Já coberto acima: `.btn`/
   `.btn-primary` (preenchido) e `.ora-cta-text` (texto). Os **toggles** do
   minicart ("Calcular frete", "Cupom") são secundários (transparente + hairline,
   via `.btn-secondary`/`.btn-outline`) — não os deixe num estilo solto; os
   **submits** dentro deles é que são primários.

**Verifique os quatro num lugar só:** abra o **minicart com 1 item** (qty-picker
+ Calcular/Cupom + Finalizar + close + ícones) e a **vitrine mobile** (setas).
Se algum ainda diverge, é override local competindo — alinhe ao sistema.

## Gotcha de sync: arquivo que "não atualiza" no preview

Sintoma: você edita um template, mas o preview continua mostrando a versão
antiga — enquanto **outros** arquivos (CSS, `index.json`, outros templates)
atualizam normalmente. O preview do LI Render tem **cache desligado**, então
não é cache: é o `li-cli theme sync` que **travou o estado daquele arquivo
específico** (acha que já o subiu). Acontece mais sem `-r`.

Diagnóstico rápido: edite o **conteúdo de `index.json`** (não só `touch` — mude
algo, ex.: adicione `properties`) e veja se a página re-renderiza. Se re-renderiza
mas o componente continua antigo, é o **arquivo de template** que está preso.

Saídas (em ordem):
1. Rode `li-cli theme sync <nome> -r` (live-reload via WebSocket) em vez de
   `sync` puro — evita o estado preso.
2. **Force um push tratando-o como arquivo novo:** copie o template para um
   **novo nome** (`home-cta.liquid` → `home-signup.liquid`), aponte o `index.json`
   pro novo, e remova o órfão. O sync empurra arquivos novos mesmo quando o estado
   do antigo travou. (Foi assim que destravamos a newsletter da Ora.)
3. `li-cli theme push` força upload de tudo — mas é **interativo (y/n + diff)** e
   recusa stdin, então precisa de um TTY humano.

Nuance: se um **`sync` watcher já está rodando** (você pode ter um de uma sessão
anterior — sinal: ao iniciar outro sync sai `Address already in use` no socket de
reload), ele sobe seus templates/assets **conforme você salva**. Aí o `push` vai
listar esses arquivos como **"No Change"** — não é falha, o watcher já os subiu. O
que o push ainda pega são **pages (`*.json`)** e arquivos editados antes do watcher
subir. Na dúvida, **verifique no preview** (fonte da verdade), não no diff do push.

## Grade aparente na PDP (acordeões + colunas)

A PDP reusa a **mesma linguagem de grade** do footer/home/minicart: linhas
`var(--ora-line-2)`, padding no ritmo do footer (`clamp(24px,3vw,40px)`), labels
eyebrow mono caps. Dois escopos de CSS (não forks — puxam só tokens/papéis):

- `.ora-pdp-band` — faixa de conteúdo full-width: `>*` ganha padding-block e
  `>*+*` ganha `border-top` (linhas de grid entre compre-junto/reviews). Use
  `:has(> *)` no `border-top`/`margin-top` da faixa pra **não desenhar linha órfã**
  quando o produto não tem reviews/compre-junto.
- `.ora-pdp-accordion` / `.ora-pdp-band` `.collapse-title` — título DaisyUI vira
  eyebrow (`--ora-font-mono` + caps + `--ora-tracking-caps`); o indicador
  `.collapse-plus>.collapse-title:after` vai a `font-size:~2.25rem` (≈40px) p/ ler
  como ícone grande da marca. Specificity do escopo `.ora-pdp-*` vence o
  `@utility collapse-title` e o `:where()` do DaisyUI sem `!`.

Ver o layout (duas zonas, sticky, fotos empilhadas) em
`page-json-recipes.md` → "PDP em duas zonas".

### O CTA primário JÁ existe (`.btn.btn-primary`) — nunca o reconstrua

Na Ora, `.btn.btn-primary` é a barra lilás + label creme + **caixa espresso 1:1
com seta** (um `::after` com `content:"\e5c8"` arrow_forward, `aspect-ratio:1`,
40px) + `.btn.btn-primary > svg{display:none}` p/ matar ícone interno. Vale pra
todo primário (add-to-cart, checkout, cupom…) sem tocar markup. Se você escrever um
botão com seta própria, ela **soma à do `::after`** = dois ícones/"dois botões"
(bug real). Antes de estilizar qualquer CTA, **leia o `.btn.btn-primary` no CSS** e
use-o como está. E **`.ora-cta` é namespace OCUPADO** (composto inline de
newsletter/contato: label sublinhado + `.ora-cta__box`) — reusar herda o
`border-bottom` do label e colide; se precisar de um CTA novo, dê outro nome.

### Gotcha: o browser cacheia `theme.min.css` no preview

O preview do LI Render tem cache server-side desligado, mas o **navegador** cacheia
o asset CSS. Depois de `build:css` + sync, um reload normal pode mostrar CSS velho
(uma regra nova "não aparece"). Confirme com `getComputedStyle`/buscando o seletor
nos `document.styleSheets`; se faltar, faça **hard reload** (Cmd+Shift+R) pra puxar
o `theme.min.css` novo.
