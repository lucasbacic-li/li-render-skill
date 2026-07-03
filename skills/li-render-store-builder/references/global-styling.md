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

## Reskin por MODO (light/dark) sobre o litheme — e a exceção híbrida

> **Default = MODO ÚNICO.** O kit traz `theme_mode.mode` (`light`|`dark`), já
> padronizado pela Skill 2 (lojas-fonte misturam modos; isso é débito eliminado, não
> paridade). Implemente **um** tema DaisyUI coerente e deixe o **contraste por conta
> do sistema** (`base-100/200/300` + `base-content`) — sem carve-back manual:
> - **`light`**: caminho padrão do litheme. Nada a inverter.
> - **`dark`**: `color-scheme: "dark"`, `base-100/200/300` escuros, `base-content`
>   claro. O sistema inteiro inverte de uma vez (cards, drawers, texto, painéis
>   aninhados) — **é o caminho barato e robusto** quando a marca é escura.
> - **Seções invertidas** (`theme_mode.inverted_sections`, ex.: rodapé escuro num
>   tema light): acento **contido** via `surface_dark`/`ink_inverse`, não muda o modo.

> ⚠️ **A EXCEÇÃO: híbrido chrome≠conteúdo** (shell escuro + *tiles* claros, ex.: cards
> brancos sobre um fundo escuro). É o caso **mais caro** e **NÃO é o default** — só quando o kit
> explicitamente pede (decisão consciente da Skill 2). Briga com o litheme e exige um
> **carve-back de contraste** sistemático. Para não poluir o caminho comum, a receita
> completa (por que bg não basta · PASS sistemático · tokens shell-escuro+tiles · 2 edge-cases)
> está **quarentenada** em **`dark-hybrid-exception.md`** — leia **só** se o kit pediu o
> híbrido. Se o kit diz `dark` puro, vire os tokens e **pare**; não caia no híbrido por
> reflexo.

## Accent de conversão que FALHA WCAG — decida no FOUNDATION, não por componente

> Vale para **qualquer modo** (light ou dark), não só o híbrido — um accent de
> conversão de luminância média falha AA do mesmo jeito sobre branco ou sobre escuro.

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

## DOIS eixos independentes: ESTILO (global) × ESTRUTURA (fork por default)

> **A distinção que faltava — e que travou um caso real.** "Global-first" e "não forkar"
> valem para **ESTILO**, não para **ESTRUTURA**. Misturar os dois fez o reskin ficar **preso
> no componente nativo** (footer com colunas nativas; PDP com descrição full-width em vez da
> zona ancorada do comp) e só **recolorir**. Separe sempre:

- **ESTILO (cor, tipo, raio, CTA, ícone) → SEMPRE global; fork de estilo É erro.** A tabela
  abaixo é só de estilo. Consistência vem de editar o sistema, nunca de recolorir por bloco.
- **ESTRUTURA (seções, colunas, zonas, ordem, layout do componente) → FORK POR DEFAULT.**
  Reestruturar o template nativo para casar o comp é **o esperado** e é o valor do LI Render.
  Forkar a *estrutura* de header/footer/PDP/buy-box/product-card/seções de home/PLP **não é
  code smell** — é o caminho normal. Mesmo forkando a estrutura, o **estilo continua vindo do
  sistema** (tokens, `.btn`, papéis): forkar forma ≠ inventar cor.
- 🔒 **Só 3 componentes preservam a ESTRUTURA nativa por default** (comportamento de conversão
  que recriar quebra): **mini-cart** (desconto progressivo/frete-grátis/cupom/CEP), **prévia
  de busca ao vivo / autocomplete** (prateleira + sugestões de termo), **filtros de busca**
  (preserve os filtros; o usuário pode *adicionar* à lateral, mas filtro só muda sob pedido
  explícito). Para esses 3: reskine, não reestruture sem pedido. Para o resto: reestruture à
  vontade.
- 🟡 **TERCEIRO eixo (a confusão que vaza no footer/PDP): preservar DADO/BLOCO ≠ preservar ESTRUTURA.**
  Alguns componentes carregam **blocos de DADO/capacidade nativos** que você **não pode perder**
  (footer: institucional/categorias/SAC/pagamentos/selos/legal-CNPJ/atribuição-LI/newsletter; PDP:
  preço/parcelas/frete-CEP/reviews/compre-junto). "Preservar" esses blocos significa **manter o
  render de dado** (a função/HTMX/partial) — **não** manter a **estrutura/layout nativa** em volta.
  A regra que confunde os agentes: eles leem "não perca o footer nativo" e **preservam as colunas
  nativas** (in-place reskin), quando o correto é **forkar a estrutura para o comp e REALOJAR os
  blocos de dado dentro dela**. Footer e PDP **forkam por default** (não são preserve-native); só os
  **3 acima** preservam estrutura. Teste: "este bloco carrega COMPORTAMENTO de conversão que recriar
  quebra (minicart/busca/filtro)?" → preserve estrutura. "Carrega só DADO (links/flags/legal/preço)?"
  → preserve o **render do dado**, forke a **estrutura** para o comp. Confundir os dois = footer preso
  no nativo ≠ comp (falha recorrente).

### Tabela de ESTILO (forks de estilo = erro)

| O que você quer mudar (ESTILO) | Onde isso vive (global) | Fork = erro se… |
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

> **Teste do "pare" (corrigido):** se você está escrevendo um **hex/`font-family`/botão do
> zero** num template → pare, é pra ser global (estilo). Mas se você está **preservando a
> estrutura nativa de um componente que NÃO é um dos 3** "porque reskin é mais seguro" → pare
> também: você deixou de implementar o comp. Reestruture para casar o comp; só o *estilo* dessa
> estrutura nova vem do sistema.

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

## Product-card: ALTURA UNIFORME via media de proporção fixa (global, qualquer loja)

O litheme deixa a `<img>` do card ditar a própria altura → num catálogo real (capa
retrato × gift-card paisagem × packshot quadrado) os cards de um shelf ficam **com
alturas diferentes**, e o grid lê como bagunça. Conserte no **componente product-card
(global)**, não card a card:
- **Media = caixa de aspect-ratio FIXO** vinda de `commerce.plp.card.image_ratio`:
  envolva a imagem num bloco com `aspect-ratio: <ratio>` (`1/1`, `3/4`…) e altura
  governada pela caixa — a `<img>` é `width:100% height:100%` + `object-fit` (`cover`
  preenche/recorta; `contain` mostra inteira com respiro — escolha do comp, mas a **caixa
  fixa é obrigatória**). Nunca deixe a `<img>` sem caixa de proporção (foi o que variou as
  alturas).
- **Corpo de altura previsível**: nome com `line-clamp` (nº de linhas fixo), preço/parcelas
  e ação em posições constantes → dois cards lado a lado fecham na mesma altura mesmo com
  nomes de tamanhos diferentes.
- **Grid estica os cards juntos** (`items-stretch`/`h-full` no card) para a fileira ter
  altura uniforme.
- **Verifique por DOM**: meça `getBoundingClientRect().height` de todos os cards de um
  shelf — devem ser **iguais**. Se variam, a media não tem ratio fixo (ou o corpo não
  reservou as linhas). É check de gate (craft), não "olhar e achar que está ok".
> Mesma regra do comp (`design-quality.md` → "Cards de grade = altura uniforme"): o
> `image_ratio` do kit **só vale se virar caixa de proporção fixa** no template.

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
> de outra marca entre as telas. (Em caso real, antes do audit: 9.6→16px × .02→.16em.)

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
   ⚠️ **Lição (caso real): o pior `bg-white` mora no THEME.CSS, não num template.** O
   litheme define **`@utility modal-box { @apply bg-white }`** — todo `.modal` (modal de
   "mais formas de pagamento", etc.) nasce branco; em modo dark o texto é `base-content`
   claro → **claro-sobre-branco invisível**. Um `grep bg-white templates/` **NÃO acha**
   (está no CSS como utility). E é um **estado OCULTO** (só ao abrir o modal) → só o
   **sweep de contraste do gate nos estados abertos** (§4f) pega. Fix de 1 linha:
   `@utility modal-box { @apply bg-base-100; }`. Faça o mesmo p/ os painéis de
   sheet/bottom-sheet (`p-6 bg-white` em coupon/shipping/notify-me/upon-request/floating-buy)
   → `bg-base-100`. Mantenha branco só onde é intencional (placa de selo, packshot, thumb).
   ⚠️ **Campos de FORMULÁRIO são o offender mais fácil de esquecer (lição: feedback humano).**
   O litheme define **`@utility input { @apply … bg-white }`** (e `@utility textarea { bg-white }`)
   — TODO input nasce **branco**: busca do header, CEP do buy-box, e-mail da newsletter, contato.
   Num tema **dark** isso fura a coerência (campos brancos cravados no fundo escuro) — e o usuário
   **vê na hora**. Não é um drawer oculto: aparece no chrome em toda página. Fix global:
   `@utility input { @apply border border-base-300 bg-base-200 text-base-content; }` (+ placeholder
   ≥4.5:1, ex. `#93a6c0`) e `@utility textarea { … bg-base-200 }`. **Regra geral: campo de form
   SEGUE o modo do tema** — nunca `bg-white` num tema dark (nem `bg-base-100` escuro demais sem
   borda visível). O mesmo vale para o `<label class="input">` wrapper do search-autocomplete do
   litheme. Varra `grep -n "bg-white" assets/style/theme.css` (input/textarea/modal-box/floating-bar)
   ANTES de declarar a fundação pronta.
4. **Botões → os papéis fixos (sem terceiro estilo).** Já coberto acima: `.btn`/
   `.btn-primary` (preenchido) e `.bk-cta-text` (texto). Os **toggles** do minicart
   ("Calcular frete", "Cupom") são secundários (transparente + hairline); os
   **submits** dentro deles é que são primários.
5. **BORDAS → hairline tokenizada (varredura sistemática, igual a raio/ícones).** O
   litheme espalha `border`/`border-base-200`/`border-white/20`/`outline-black/10` em
   painéis flutuantes (mega-menu, dropdown de ordenação, autocomplete, sheets, popovers).
   Num reskin **dark-chrome** esses defaults viram **bordas claras/brancas AGRESSIVAS
   sobre o fundo escuro** — destoam do comp (que usa filete sutil) e gritam. ⚠️ Lição (caso real):
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
