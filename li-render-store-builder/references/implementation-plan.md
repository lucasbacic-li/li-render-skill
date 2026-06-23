# Plano de implementação — global-first + ORQUESTRADO (faça ANTES de editar)

> **Por que este doc existe.** Os dois erros mais caros na Skill 3:
> 1. **Implementar página a página** — o agente abre a home, mexe num pedaço, abre a
>    PLP, mexe noutro, **explorando em loop** (variações divergentes, retrabalho). A
>    maior parte do que os comps mostram é **compartilhada** (chrome, cards, botões,
>    tipo, cor): implemente no **sistema uma vez**; só o *esqueleto* de cada página é
>    por página.
> 2. **Rodar tudo numa thread única longa** — a disciplina (ciclo por componente →
>    diff → gate → travar) **degrada com o contexto** e é pulada mesmo estando escrita.
>    A correção (Passo 4) é **estrutural**: orquestrador fino + **um sub-agente por
>    componente** (contexto fresco) + **manifesto-arquivo** + **sub-agente de gate**.
>
> **Regra de ouro:** antes de qualquer edição, escreva um **plano** (Passos 1–3) e
> depois **delegue cada componente** (Passo 4). Não descubra a estrutura editando, nem
> tente segurar tudo numa thread só.

## Passo 0 — Mapeie uma vez (não explore em loop)

Leia, nesta ordem, ANTES de tocar em qualquer arquivo:
1. **Os comps** (`<kit>/comps/`) — o alvo visual de cada superfície.
2. O **brand-kit** — papéis de cor/tipo/raio + bloco `commerce`.
3. **`litheme-structure.md`** (árvore real: rotas, templates, partials) +
   **`../shared/litheme-capabilities/`** (mapa papel→token DaisyUI, componentes).

Saída deste passo: você sabe quais **componentes globais** o litheme já tem e como
cada elemento dos comps mapeia para eles. Você **não** vai "achar" isso editando.

## Passo 1 — Decida a ESTRATÉGIA DE TEMA primeiro (decide todo o resto)

Olhando a paleta + os comps, o tema é:
- **Claro** (surface claro, conteúdo claro) — caminho padrão do litheme.
- **Escuro** (surface escuro) — vire os **tokens** (esquema dark), não componente a componente.
- **Híbrido: chrome escuro + conteúdo claro** (ou shell escuro + *tiles* claros) — o
  caso mais caro. Ver **"Reskin DARK sobre o litheme"** em `global-styling.md` e
  decida CONSCIENTEMENTE (token-level dark vs. chrome-dark+conteúdo-claro) **antes**
  — isso muda como você ataca cor/contraste em todas as superfícies.

Escrever essa decisão primeiro evita o whack-a-mole de contraste no meio do caminho.

## Passo 2 — Árvore de decisão: comp → onde implementar

Para CADA coisa que um comp mostra, classifique no nível **mais alto possível** e
implemente ali. Desça de nível só quando o de cima não couber.

```
O que o comp mostra
│
├─ cor / raio / fonte?            → TOKEN  (bloco @plugin "daisyui/theme" + @theme)
│                                   1 edição → cascateia p/ TODAS as páginas.
│
├─ papel de texto                 → @layer base (h1-h6) + papéis globais
│  (display/heading/body/mono/      (.bk-display/.bk-heading/.bk-eyebrow + escala caps)
│   eyebrow/caixa-alta)?
│
├─ componente que o litheme       → reskine o COMPONENTE/utility GLOBAL uma vez
│  já tem? (header, footer,         (vale em todas as páginas que o usam)
│   product-card, .btn, .input,
│   minicart drawer, breadcrumb,
│   shelf, banner, accordion…)
│
├─ papel de CTA                   → `.btn`/`.btn-primary`/papel de texto global
│  (primário/secundário/texto/      (NUNCA um botão novo dentro de um template)
│   ícone)?
│
└─ esqueleto de UMA página        → SÓ AQUI é por página: JSON da página
   (quais seções, ordem, grid da    (componentes/ordem) + template da seção.
    PLP, zonas da PDP)               E mesmo aqui, cor/tipo/CTA vêm do sistema.
```

**Teste do "pare":** se você está prestes a escrever um **hex, um `font-family` ou
um botão do zero dentro do template de UMA página**, pare — quase certamente é
global (token/papel/componente), não per-page. (Ver tabela global-vs-fork em
`global-styling.md`.)

## Passo 3 — Escreva o PLANO (antes de editar)

Liste as edições em ordem **global → local**. Cada item: **arquivo(s)** + **o que
muda** + **qual comp/decisão justifica**.

1. **Tokens** — mapa papel→DaisyUI no `theme.css` (cor, raio). 1 edição.
2. **Fonte + tipografia** — `--font-sans` no `@theme` (Tailwind v4!) + papéis em
   `@layer base` (h1-h6) + hierarquia de cor (base-content = ink_muted; títulos→ink).
3. **Estratégia de tema** (Passo 1) + decisões de contraste das superfícies que viram.
4. **Componentes globais a reskinar** (a partir dos comps): header, footer,
   product-card (tile), `.btn`/`.input`, minicart drawer, breadcrumb, shelf/banner.
   Liste cada um e o que muda.
5. **Assets**: logo/favicon/imagery a copiar p/ `assets/brand` (subir ANTES de referenciar).
6. **Por página (só o esqueleto)**: home (seções+ordem, conte ≤10/container), PLP
   (sidebar/grid/sort), PDP (zonas/buy-box), minicart (drawer). Reusa tudo do sistema.

> Um plano de ~15 linhas evita horas de exploração. Apresente-o se o usuário quiser
> revisar a abordagem antes da execução.

## Passo 4 — Execute via ORQUESTRAÇÃO: orquestrador fino + 1 sub-agente por componente

> **Por que sub-agentes, e não "seguir a checklist numa thread só".** O método de
> convergência (ciclo por componente → diff isolado → gate → travar) **já estava
> escrito** e ainda assim foi pulado nos casos reais. A causa não é falta de
> instrução — é **degradação de contexto**: numa thread única longa, os princípios do
> topo somem sob o trabalho acumulado, nada **bloqueia** declarar pronto no recolor, e
> nada **impede** pular pro próximo. A correção é estrutural: a unidade de trabalho
> passa a ser uma **execução isolada** (sub-agente de contexto fresco) com **contrato
> apertado** e **gate persistido em arquivo**. O contexto não degrada (cada sub-agente
> é magro e estreito), não dá pra pular adiante (o orquestrador sequencia + trava), e
> não dá pra declarar pronto no recolor (o retorno **exige** diff + evidência).

### 4a. Fundação global (a thread principal faz; cascateia, mas NÃO é "pronto")
1. Implemente os tokens (cor/raio), a fonte e a estratégia de tema. Build
   (`npm run build:css`) + sync.
2. Verifique no preview que **cascateou** (cor/fonte/raio em páginas diferentes).
> ⚠️ **Trocar token recolore — não reestrutura.** A cascata é "de graça" e *parece*
> progresso, mas só muda cor/fonte/raio. Um header recolorido **não** é o header do
> comp se a *estrutura* (busca central, rótulos das utilidades, nav de categorias,
> faixa de newsletter no footer…) continua a do litheme. Declarar o chrome "pronto"
> aqui é o anti-padrão **no nível de componente** — o mais fácil de cometer porque a
> cor certa engana. Foundation pronta = cor/fonte/raio certos; **layout ainda não**.

A fundação é GLOBAL e cascateia → faça-a **na thread principal** (não num sub-agente),
e crie o **manifesto de componentes** (4c) listando cada componente crítico como `todo`.

### 4b. O ORQUESTRADOR (thread principal) — fica FINO de propósito
A thread principal **não implementa componente**. Ela só:
1. Segura o **plano** (Passo 3) + o **manifesto-arquivo** (4c). Nada de detalhe de
   template de componente entra no seu contexto — é isso que a mantém sem degradar.
2. Para cada componente crítico, **na ordem do plano**, despacha **UM sub-agente**
   (4d) e espera o **retorno estruturado**. Grava o status no manifesto.
3. **Recusa começar o pass de página** enquanto algum componente crítico não estiver
   `locked`. Essa recusa é a **barreira dura** que substitui "lembre de travar antes".
4. Antes da revisão humana de cada página, despacha o **sub-agente de gate** (4f) —
   verificador independente, não auto-avaliação.

> Regra do orquestrador: se o seu próprio contexto está enchendo de Liquid/CSS de
> componente, você saiu do papel. Delegue o componente; segure só plano+manifesto.

> **Reconciliações pequenas o orquestrador faz DIRETO** (não re-despache um agente
> inteiro para um one-liner): consolidar uma `global_rule` que um sub-agente reportou e
> vai reaparecer nos próximos (ex.: a exceção de carve-back p/ `.btn-primary` em tile —
> aplique GLOBAL antes do próximo componente que a usa, em vez de cada agente re-corrigir),
> ou um asset-wiring com premissa furada (ex.: sub-agente deixou o logo como texto "porque
> o asset não existe" quando ele **já foi subido no push** — troque o fallback pelo
> `{% asset_url %}`). Mudança ESTRUTURAL de componente continua sendo trabalho de
> sub-agente. Nota de ambiente: se a continuação do mesmo sub-agente (SendMessage) não
> estiver disponível, o orquestrador reconcilia o one-liner ou re-despacha um agente de
> FIX **focado** (escopo da correção, não do componente todo) — foi o que reconvergeu a PDP.

### 4c. Manifesto de componentes — ARQUIVO de verdade (não checklist na cabeça)
O contrato "não reabrir" só funciona se for **persistido**. Crie
`build/<tema>/.component-manifest.json` (ou em `<kit>/`) — fonte da verdade do que está
travado. O orquestrador lê/escreve; **componente `locked` não se reabre nem se re-lê**.
Schema (exemplo completo em `../assets/component-manifest.example.json`):

```json
{
  "$schema": "li-render/component-manifest@1",
  "theme": "<nome>",
  "components": [
    { "component": "header",
      "comp": "comps/components/header.html",
      "status": "todo",                       // todo | in-progress | locked | blocked
      "files": [],                            // templates tocados (preenche o sub-agente)
      "structure_changes": [],                // o que foi REESTRUTURADO (não só recolorido)
      "evidence": { "diff_desktop": null, "diff_mobile": null, "contrast": null },
      "deviations": [],                       // decisões conscientes {what, why}
      "blockers": [] }
  ],
  "gates": { }                                // por página: {home:{status,contrast,mobile}}
}
```

Regra: o pass de página só **compõe** `locked` components. Se algo parece errado numa
página, conserte na **composição** (JSON da página) — **não** reabrindo o componente.

> **Retomada de tema parcial.** Se o `.component-manifest.json` JÁ existe (tema
> retomado de uma execução anterior), **LEIA-o primeiro**: não re-rode a fundação;
> **pule os componentes `locked`** (não reabra nem re-leia); comece do 1º `todo`/
> `blocked`. O manifesto é a **memória entre execuções** — confie nele em vez de
> re-descobrir o estado do zero.

### 4d. Sub-agente POR COMPONENTE — contrato (contexto fresco, escopo de UM componente)
O orquestrador despacha um sub-agente por componente. O prompt do sub-agente carrega o
**contrato** abaixo. Ele converge **um** componente e devolve um veredito.

**Inputs que o orquestrador passa:**
- O **comp daquele componente** (`comps/components/<x>.html`) + a baseline real
  (`<kit>/reference/`).
- Os **templates do litheme** daquele componente (caminhos — ver `litheme-structure.md`).
- `assets/style/theme.css` (o sistema global) + `global-styling.md` +
  `../shared/litheme-capabilities/` + os papéis do brand-kit.
- A URL de preview + a receita de screenshot autenticado (`li-render.md`).

**Tarefa (DoD do sub-agente) — o loop fechado:**
```
ler comp + template atual  →  listar divergências (ESTRUTURA primeiro, cor/tipo depois)
  →  REESTRUTURAR o template quando o layout diverge (não só recolorir)
  →  screenshot SÓ daquele componente (isolado), desktop ~1440 E mobile ~390
  →  diff 1:1 contra o comp DELE  +  sweep de contraste programático (incl. estados
     ocultos: hover de menu, drawer aberto)  →  corrigir a maior divergência
  →  repetir até proximidade alta + contraste limpo  →  retornar veredito
```
- **Screenshot ISOLADO**, não a página: header no topo de qualquer rota; card via PLP;
  buy-box via PDP; minicart abrindo o drawer. Diff de página esconde divergência de
  componente.
- **Escopo = UM componente.** NÃO edite o template de outro componente. Se descobrir
  que precisa de uma regra **global** (ex.: token, regra de contraste), aplique o
  **mínimo** e **reporte** em `global_rules_added` — o orquestrador reconcilia/audita
  (evita dois sub-agentes brigando no `theme.css`).
- **Hover/estados ocultos contam.** Bug clássico (visto em caso real): link de dropdown que
  some no `hover` por causa do carve-back de contraste. Só o **sweep programático nos
  estados abertos** pega — varra com o menu/drawer aberto antes de travar.

**Retorno estruturado (o orquestrador grava no manifesto sem reabrir o componente):**
```json
{ "component": "header", "status": "locked",        // locked | blocked
  "files": ["templates/.../header/index.liquid", "..."],
  "structure_changes": ["topbar de anúncio", "nav de categorias ligada", "utilidades rotuladas"],
  "global_rules_added": ["regra X em theme.css — motivo"],
  "evidence": { "diff_desktop": "<resumo/arquivo>", "diff_mobile": "...", "contrast": "limpo / flags aceitos" },
  "deviations": [{ "what": "...", "why": "..." }],
  "blockers": [] }
```
- **Nunca devolva `locked` sem** screenshot isolado (desktop+mobile) **e** sweep de
  contraste. "Recolorido" não é `locked` — se a estrutura ainda é a do litheme, é `todo`.
- Se **travar** (precisa de função de dado, de mudança global que conflita, de decisão
  do usuário), devolva `status: "blocked"` com o motivo em `blockers` — **não** prossiga
  em silêncio nem invente.

### 4e. Pass de página (composição) — só DEPOIS de todos os componentes `locked`
Com os componentes travados, a página vira **composição**, não descoberta. Pode ser um
sub-agente por página (recebe o manifesto + o comp de página):
- Ordena os `locked` components na rota (≤10/container) via o JSON da página.
- **Seções únicas de página** (ex.: dept-cards na home) que têm estrutura própria também
  ganham um ciclo de componente (4d) e entram no manifesto — mesmo usadas numa só página.
- Conserto de página = mexer na **composição** (JSON), nunca reabrir um `locked`.
- ⚠️ **Se a página precisa REPOSICIONAR/reestruturar algo que vive num arquivo de
  componente `locked`** (ex.: o título do produto mora no mesmo template do buy-box, mas o
  comp da PÁGINA o quer noutra coluna), **NÃO** declare isso como "deviation aceitável" só
  pra não tocar o locked — **emita um `reopen_request`** no retorno. Visto: um agente de
  página deixou o título no rail errado e justificou com "não reabri o componente travado";
  o comp claramente o queria no painel. Regra: divergência vs o comp **da página** é do
  escopo da página; mover layout que cruza um arquivo locked **sem alterar os internos do
  componente** (preço/CTA/etc.) é legítimo — faça, e reporte o que tocou. O que NÃO pode é
  **aceitar a divergência** para preservar o lock.

### 4f. Sub-agente de GATE (verificador independente) — antes de QUALQUER revisão humana
> **O erro real:** o agente reskinou (cor/token certos) e foi pedir aprovação **sem
> comparar o preview com os comps** e **sem testar mobile**. "Cor certa" ≠ "convergiu ao
> comp". A correção: o gate é um **sub-agente separado** (não quem implementou —
> auto-avaliação é enviesada), read-mostly, que **devolve uma lista**, não um "ok".

Inputs: o **comp de página** + o **preview da rota** + o **manifesto**. Tarefa, nesta ordem:
1. **Diff de ESTILO/LAYOUT contra o comp** — comp de página e preview da mesma rota
   **LADO A LADO**: liste TODA divergência (**seção faltando** — trust-bar, dept-cards,
   banda; **estrutura diferente** — sidebar vs filtro; ordem; hierarquia; espaçamento).
   Por **componente** (header×header, card×card) **e** por **página**.
2. **Mobile (~390)** — confirme `innerWidth==390` e re-rode o diff (litheme é mobile-first).
3. **Sweep de contraste PROGRAMÁTICO** (não confie no olho) — via CDP `Runtime.evaluate`,
   varra todo texto visível, calcule ratio texto×fundo-efetivo (sobe a árvore até achar
   `background` opaco), **flague < 3.0**. Todos os componentes da rota de uma vez,
   **incluindo TODOS os estados HOVER/ABERTO** — não só o minicart. ⚠️ **Lição (3º caso):
   o gate varreu só o drawer e passou; o usuário achou no preview o mega-menu e o dropdown
   de ordenação com texto escuro-sobre-escuro (invisíveis)** — estados que só existem quando
   abertos. O sweep DEVE abrir e varrer, via eval, **cada** superfície interativa antes de
   passar:
   - **mega-menu / dropdown de categorias** (hover/`:hover` ou forçar `display`/classe de
     aberto no item de nav) — o painel costuma herdar fundo escuro → texto e **bordas**
     precisam de contraste;
   - **dropdowns de ordenação/filtro** da PLP (abrir o `<select>`/menu custom) — as
     **opções** caem num painel; escuro-sobre-escuro é o bug clássico;
   - **autocomplete da busca** (focar o input + digitar) — painel de resultados;
   - **minicart drawer** (com 1 item) e **bottom-sheets** (frete/cupom/notify).
   Para forçar um estado sem interação real, marque a classe/`:hover` equivalente via
   `el.classList.add(...)` ou `el.style.display='block'` no eval, então varra. Aceite só
   flags de **cor de marca intencional** (preço/CTA no accent) e **registre**; texto ou
   borda invisível num estado aberto = **FALHA**.
   ⚠️ **Abrir o painel ≠ hover no item.** Estilos que vivem no `:hover` de um ITEM (ex.:
   `hover:bg-base-100` num link de submenu) **não aparecem** só por forçar o container
   aberto — você varre o painel e passa, e o bug (caixa branca no item sob o cursor) escapa.
   Faça **hover REAL** via `Input.dispatchMouseEvent{type:'mouseMoved', x,y}` no centro de
   **cada item interativo** (mediu o bounding box antes), espere, e só então varra/screenshote.
   Bug clássico (3º caso, escapou até do fix-agent): `hover:bg-base-100` num item de
   mega-menu pinta o item de **branco**; como o texto do próprio elemento continua claro (o
   carve-back de tile é por DESCENDENTE, não pega o mesmo nó), vira **branco-no-branco e o
   rótulo some**. Hover em dark-chrome = overlay translúcido (`rgba(255,255,255,.06–.10)`),
   nunca `bg-base-100`.

**Veredito do gate:** divergências = (a-corrigir) ∪ (decisões conscientes). Se houver
qualquer divergência injustificada **ou** contraste < 3.0 → **gate FALHA**: devolve a
lista ao orquestrador, que despacha o conserto (sub-agente de componente se for
componente; ajuste de JSON se for composição). Gate só **passa** com lista injustificada
= 0; aí grava `gates.<página>` no manifesto. **Só então** revisão humana — junto da lista
de decisões conscientes.

### 4g. Fechar
Rode `scripts/audit-theme-styles.sh` na thread principal — pega forks que escaparam dos
sub-agentes (incl. `global_rules_added` que deviam ser homogeneizados).

## Anti-padrões que este guia elimina

- ❌ **Rodar tudo numa thread única longa** → contexto degrada e a disciplina some.
  Use **1 sub-agente por componente** + orquestrador fino.
- ❌ **Manifesto "na cabeça"** → vira arquivo (`.component-manifest.json`); `locked`
  não reabre.
- ❌ **Gate como auto-avaliação** de quem implementou → gate é **sub-agente separado**
  que devolve lista, não "ok".
- ❌ **Explorar a estrutura editando** página a página (mapeie no Passo 0).
- ❌ **Recriar cor/fonte/botão dentro de cada página** → variações divergentes.
- ❌ **Declarar "pronto" ao trocar tokens** — vale para PÁGINA *e* para COMPONENTE:
  recolorir o componente do litheme ≠ convergir ao comp dele (reestruture).
- ❌ **Auditar componente olhando a página inteira** → use o comp do componente isolado.
- ❌ **Sub-agente de componente editando outro componente** → escopo de UM; mudança
  global vai em `global_rules_added` e o orquestrador reconcilia.
- ❌ **Devolver `locked` no recolor** (sem diff isolado + sweep de contraste).
- ❌ **Mudar a "temperatura" de fundo (claro↔escuro) sem o sweep global** de
  contraste em todas as superfícies (ver "Reskin DARK" em `global-styling.md`).
- ❌ **Pular o plano** e ir direto pro editor — é o que gera o loop.
