# Plano de implementação — global-first + ORQUESTRADO (faça ANTES de editar)

> **Por que este doc existe.** Os dois erros mais caros na Skill 3:
> 1. **Implementar página a página** — o agente abre a home, mexe num pedaço, abre a
>    PLP, mexe noutro, **explorando em loop** (variações divergentes, retrabalho). A
>    maior parte do que os comps mostram é **compartilhada** (chrome, cards, botões,
>    tipo, cor): implemente no **sistema uma vez**; só o *esqueleto* de cada página é
>    por página.
> 2. **Rodar tudo numa thread única longa** — a disciplina (ciclo por componente →
>    diff → gate → travar) **degrada com o contexto** e é pulada mesmo estando escrita.
>    A correção (Passo 4) é **estrutural** e tem duas pernas:
>    - **O orquestrador não edita arquivo nenhum** (fundação inclusa) — só planeja,
>      despacha **um sub-agente por componente** (contexto fresco), sequencia e grava o
>      **manifesto-arquivo**. Editar = saiu do papel (tripwire binário, ver 4b).
>    - **"Pronto" é um ARTEFATO, não um veredito.** `locked`/`gate-pass` exigem o **diff
>      comp×componente gravado no manifesto por um agente que NÃO foi o implementador**.
>      Sem esse artefato o estado é **incoerente** (não "quase pronto"). Isso tira o
>      agente de ser **juiz da própria obra** — a falha-raiz dos dois casos reais.
>
> **Regra de ouro:** antes de qualquer edição, escreva um **plano** (Passos 1–3) e
> depois **delegue TUDO** (Passo 4) — fundação inclusa. Se você (orquestrador) está
> prestes a abrir um editor, parou de orquestrar. Não descubra a estrutura editando, não
> segure tudo numa thread só, e **não seja o juiz do que você mesmo implementou**.

## Passo 0 — Mapeie uma vez (não explore em loop)

Leia, nesta ordem, ANTES de tocar em qualquer arquivo:
1. **Os comps** (`<kit>/comps/`) — o alvo visual de cada superfície.
2. O **brand-kit** — papéis de cor/tipo/raio + bloco `commerce`.
3. **`litheme-structure.md`** (árvore real: rotas, templates, partials) +
   **`../shared/litheme-capabilities/`** (mapa papel→token DaisyUI, componentes).

Saída deste passo: você sabe quais **componentes globais** o litheme já tem e como
cada elemento dos comps mapeia para eles. Você **não** vai "achar" isso editando.

## Passo 1 — Leia a ESTRATÉGIA DE TEMA do kit (não a re-decida)

O **modo** já foi decidido pela Skill 2 e está no kit: **`theme_mode.mode`** =
`light` | `dark` (ver `../../shared/brand-kit-spec/`). Aqui você **implementa** esse
modo único — não re-decide. Lojas-fonte misturam light/dark; a Skill 2 já
padronizou para um modo (débito de usabilidade eliminado). Seu trabalho é virar **um
tema DaisyUI coerente**, deixando o contraste por conta do sistema:

- **`light`** — caminho padrão do litheme (surface claro, `base-content` escuro).
- **`dark`** — vire os **tokens** (`color-scheme: "dark"`, `base-100/200/300`
  escuros, `base-content` claro). DaisyUI carrega o contraste; **nada de carve-back
  por componente**. Ver "Reskin por MODO sobre o litheme" em `global-styling.md`.
- **Seções invertidas** (`theme_mode.inverted_sections`, ex.: rodapé escuro num tema
  light) são **acento contido** via `surface_dark`/`ink_inverse` — não mudam o modo.

> **Exceção: híbrido chrome≠conteúdo** (body escuro + tiles claros). É o caso **mais
> caro** — briga com o DaisyUI e exige carve-back de contraste. **Não é mais o
> default**: só quando o kit explicitamente pede (decisão consciente registrada pela
> Skill 2). Se for esse o caso, siga a receita em `dark-hybrid-exception.md`.

Implementar o modo único primeiro evita o whack-a-mole de contraste no meio do caminho.

Leia também **`layout`** do kit (`width` contained/fluid-up, `max_width`, `gutter`,
`full_bleed`) — a régua de largura. Implemente redefinindo o `@utility container`
(ver `litheme-structure.md` → "Largura/responsividade global") **uma vez**: as seções
`full_bleed` carregam o fundo a 100% e o conteúdo num `.container`. Não reimplemente
gutter/max-width por seção.
> 🔴 **`full_bleed` é um PASSO de implementação, não um label.** O litheme renderiza
> banner/hero/faixas **DENTRO do `.container`** (cap ~1280) por padrão — então uma seção
> marcada `full_bleed` no kit **continua presa no cap** a menos que você a **quebre para
> 100vw explicitamente** (wrapper full-bleed: `w-screen` + breakout de margem, ou tirar a
> seção de dentro do `.container` no JSON da página e deixar o fundo sangrar com o conteúdo
> num `.container` interno). Para CADA seção em `layout.full_bleed` (tipicamente o
> **full-banner/hero**): implemente o breakout e **verifique por DOM** que
> `el.getBoundingClientRect().width ≈ window.innerWidth`. Anti-padrão real: hero do fonte
> sangrava `width:100%`, foi travado como "reskin nativo" e ficou limitado ao container — a
> decisão `full_bleed` do kit foi **declarada e nunca materializada**. Banner contido quando
> o fonte sangra é divergência de paridade (§4f passo 0), não detalhe.

## Passo 2 — Árvore de decisão: comp → onde implementar

Para CADA coisa que um comp mostra, classifique no nível **mais alto possível** e
implemente ali. Desça de nível só quando o de cima não couber.

> ⚠️ **A árvore tem DOIS eixos.** O eixo de **ESTILO** sobe ao nível mais alto (token/papel
> global — não recolora por bloco). O eixo de **ESTRUTURA** desce ao comp: a forma do
> componente (seções, colunas, zonas, ordem) vem do **comp**, e forkar o template nativo para
> batê-la é o **default**. Não use "o litheme já tem esse componente" como licença para manter
> a estrutura nativa — só o **estilo** dele é global; a **estrutura** é o que o comp pede.

```
O que o comp mostra
│
├─ cor / raio / fonte?            → TOKEN  (bloco @plugin "daisyui/theme" + @theme)
│                                   1 edição → cascateia p/ TODAS as páginas.  [ESTILO=global]
│
├─ papel de texto                 → @layer base (h1-h6) + papéis globais        [ESTILO=global]
│  (display/heading/body/mono/      (.bk-display/.bk-heading/.bk-eyebrow + escala caps)
│   eyebrow/caixa-alta)?
│
├─ papel de CTA                   → `.btn`/`.btn-primary`/papel de texto global  [ESTILO=global]
│  (primário/secundário/texto/      (NUNCA um botão novo dentro de um template)
│   ícone)?
│
├─ ESTRUTURA do componente        → o COMP MANDA. Se o comp = nativo → reskine.
│  (header, footer, PDP/buy-box,     Se o comp DIVERGE do nativo (quase sempre) →
│   product-card, seções de home,    REESTRUTURE/forke o template p/ casar o comp.
│   layout da PLP)?                  Estilo dessa estrutura nova vem do sistema.
│                                    🔒 EXCEÇÃO (preserve nativo, não forke sem
│                                    pedido): mini-cart, prévia de busca ao vivo,
│                                    filtros de busca — comportamento de conversão.
│
└─ esqueleto de UMA página        → composição: JSON da página (quais seções,
   (quais seções, ordem, zonas)      ordem) + os componentes (já forkados acima).
                                     cor/tipo/CTA vêm do sistema.
```

**Teste do "pare" (dois lados):**
- Vai escrever um **hex / `font-family` / botão do zero** num template? Pare — é ESTILO global.
- Vai **preservar a estrutura nativa** de header/footer/PDP/card "porque reskin é mais seguro"?
  Pare — você deixou de implementar o comp. ESTRUTURA forka para casar o comp (salvo os 3).
(Ver os dois eixos em `global-styling.md` → "ESTILO × ESTRUTURA".)

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

## Passo 4 — Execute via ORQUESTRAÇÃO: orquestrador que não edita + 1 sub-agente por componente

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

### 4a. Fundação global (um SUB-AGENTE faz; cascateia, mas NÃO é "pronto")
A fundação (tokens cor/raio + fonte + estratégia de tema) é GLOBAL e cascateia — mas
**o orquestrador não a implementa**. Era aqui que estava a brecha: uma vez no editor
"só pra fundação", o salto para "já faço os componentes também" é mínimo (foi o caminho
exato do caso real). Por isso a fundação também é delegada, e "o orquestrador abriu um
editor?" vira um **tripwire binário**. O orquestrador:
1. Cria o **manifesto de componentes** (4c) com cada componente crítico como `todo` e a
   **fundação como item próprio** (`status: todo`).
2. Despacha **um sub-agente de fundação** (contrato: implementar tokens cor/raio + fonte +
   estratégia de tema; `npm run build:css` + sync; verificar no preview que **cascateou** —
   cor/fonte/raio em páginas diferentes; retornar arquivos tocados + veredito).
3. Grava o retorno no manifesto. Fundação cascatear **NÃO** é "pronto" (ver aviso abaixo).
> ⚠️ **Trocar token recolore — não reestrutura.** A cascata é "de graça" e *parece*
> progresso, mas só muda cor/fonte/raio. Um header recolorido **não** é o header do
> comp se a *estrutura* (busca central, rótulos das utilidades, nav de categorias,
> faixa de newsletter no footer…) continua a do litheme. Declarar o chrome "pronto"
> aqui é o anti-padrão **no nível de componente** — o mais fácil de cometer porque a
> cor certa engana. Foundation pronta = cor/fonte/raio certos; **layout ainda não**.

> A fundação é global e cascateia, mas **isso não a torna trabalho do orquestrador**: ela
> é o item-fundação do manifesto, implementada pelo sub-agente de fundação (passos acima).
> O orquestrador só lê o retorno e grava o status. Quem segura o `theme.css` na cabeça é o
> sub-agente, não a thread principal.

### 4b. O ORQUESTRADOR (thread principal) — NÃO edita arquivo nenhum
A thread principal **não edita nada** — nem componente, nem fundação, nem um one-liner
global. Ela só:
1. Segura o **plano** (Passo 3) + o **manifesto-arquivo** (4c). Nada de detalhe de
   template/CSS entra no seu contexto — é isso que a mantém sem degradar.
2. Para cada componente crítico, **na ordem do plano**, despacha **UM sub-agente**
   (4d) e espera o **retorno estruturado**. Promove a `locked` só pela regra de artefato
   (4c) — **mecanicamente**, não por achar que convergiu.
3. **Recusa começar o pass de página** enquanto algum componente crítico não estiver
   `locked`. Essa recusa é a **barreira dura** que substitui "lembre de travar antes".
4. Antes da revisão humana de cada página, despacha o **sub-agente de gate** (4f) —
   verificador independente, não auto-avaliação.

> 🔴 **Tripwire binário do orquestrador:** se você está prestes a abrir um editor
> (Edit/Write) ou a colar Liquid/CSS no seu próprio contexto, **você saiu do papel** —
> pare e delegue. Não existe edição "pequena demais para delegar". Esse é o teste que
> substitui "fique fino": não é sobre quanto contexto você acumulou, é sobre **você ter
> ou não tocado um arquivo** (nenhum).

> **Reconciliações também são delegadas** (não há exceção de one-liner). Quando um
> sub-agente reporta uma `global_rule` que vai reaparecer (ex.: a exceção de carve-back p/
> `.btn-primary` em tile) ou um asset-wiring com premissa furada (ex.: logo deixado como
> texto "porque o asset não existe" quando ele **já foi subido no push**), o orquestrador
> **despacha um sub-agente de FIX focado** (escopo da correção, não do componente todo) —
> foi o que reconvergeu a PDP — e grava a `global_rule` no manifesto para os próximos não
> a re-corrigirem. Mudança ESTRUTURAL de componente segue sendo trabalho de sub-agente de
> componente. O orquestrador nunca é a mão que edita; é quem decide **qual agente** edita.

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
      "status": "todo",                       // todo | in-progress | edited | locked | blocked
                                              // edited = reestruturado, mas SEM diff vs comp executado → NÃO é locked
      "files": [],                            // templates tocados (preenche o sub-agente)
      "implemented_by": null,                 // QUEM implementou (id/rótulo do sub-agente)
      "structure_changes": [],                // o que foi REESTRUTURADO (não só recolorido)
      "evidence": { "diff_vs_comp": null,     // OBRIGATÓRIO p/ locked: lista de divergências comp×componente (vazia-justificada)
                    "verified_by": null,      // OBRIGATÓRIO p/ locked: QUEM diffou — TEM que ser ≠ implemented_by
                    "diff_desktop": null, "diff_mobile": null, "contrast": null },
      "deviations": [],                       // decisões conscientes {what, why}
      "blockers": [] }
  ],
  "gates": { }                                // por página: {home:{status,contrast,mobile}}
}
```

> 🔴 **Regra de artefato — a definição de `locked` (não é veredito, é estado de arquivo).**
> O orquestrador só promove um componente a `locked` quando, no manifesto:
> (a) `evidence.diff_vs_comp` está **preenchido** (lista de divergências comp×componente —
> vazia-justificada ou corrigida), **e** (b) `evidence.verified_by` **≠** `implemented_by`.
> Quem implementou **não pode** ser quem atesta a convergência — é exatamente o "implementer
> e juiz na mesma cabeça" que derrubou os dois casos reais. Faltou `diff_vs_comp`, ou
> `verified_by == implemented_by`, ou `verified_by` nulo → o componente **NÃO é `locked`**
> (fica `edited`), e isso não é negociável por "ficou bom". A promoção é uma **checagem
> mecânica de campos**, não um julgamento do orquestrador.

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

> 🔒 **Default = FORKAR para casar o comp; preservar o nativo só para os 3.** O comp manda a
> ESTRUTURA. Se o comp diverge do nativo (quase sempre em header/footer/PDP/buy-box/card/seções),
> **reestruture/forke** — é o esperado, não precisa de licença. Só **mini-cart**, **prévia de
> busca ao vivo/autocomplete** e **filtros de busca** preservam o nativo (comportamento de
> conversão) — reskine, não forke, salvo pedido explícito. **"Diferente do nativo" É O REQUISITO,
> não uma dúvida** — sobretudo se você não enxerga o preview (ver abaixo): trate qualquer
> divergência comp×nativo como trabalho a fazer, nunca como "deixa no nativo que é mais seguro".

**Tarefa (DoD do sub-agente) — o loop fechado:**
```
ler comp + template atual + a DECISÃO do inventário (`litheme_support`/`decision`)
  →  listar divergências (ESTRUTURA primeiro, cor/tipo depois)
  →  default FORKAR: reestruture/construa o template p/ bater a estrutura do comp (seções,
     colunas, zonas, ordem) — não só recolorir; o estilo vem do sistema (tokens/.btn/papéis).
     Exceção (os 3 preserve-native): reskine sem reestruturar. NÃO enfie comportamento de
     conversão crítico (minicart/busca) num fork sem pedido.
  →  screenshot SÓ daquele componente (isolado), desktop ~1440 E mobile ~390
  →  diff 1:1 contra o comp DELE  +  sweep de contraste programático (incl. estados
     ocultos: hover de menu, drawer aberto)  →  corrigir a maior divergência
  →  repetir até proximidade alta + contraste limpo  →  retornar veredito
```
> 🔴 **Sub-agente SEM preview (browser singleton/headless bloqueado):** você NÃO consegue rodar
> o diff visual — então **não declare convergência de estrutura por intuição**. Implemente a
> estrutura do comp **integralmente** (não a versão "mínima que talvez bata"), liste no
> `self_diff` **toda** divergência comp×nativo que você sabe que ainda existe (ex.: "footer ainda
> em 3 colunas nativas, o comp pede 4 com brand-blurb"), e devolva `edited`. O viés do agente
> cego é **mudar de menos** e dizer "deve bater" — resista: o gate (com preview) vai cobrar a
> estrutura, então entregue-a, não a prometa.
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
{ "component": "header", "status": "edited",        // edited | blocked  (NUNCA "locked" — ver regra abaixo)
  "implemented_by": "comp-agent:header",            // identifica quem editou (vai pro manifesto)
  "files": ["templates/.../header/index.liquid", "..."],
  "structure_changes": ["topbar de anúncio", "nav de categorias ligada", "utilidades rotuladas"],
  "global_rules_added": ["regra X em theme.css — motivo"],
  "self_diff": { "diff_desktop": "<resumo/arquivo>", "diff_mobile": "...", "contrast": "limpo / flags aceitos" },
  "verify_spec": { "route": "/", "selector": "header.site-header", "expected": "..." },
  "deviations": [{ "what": "...", "why": "..." }],
  "blockers": [] }
```
- 🔴 **O sub-agente de componente NUNCA devolve `locked`.** Ele converge o componente o
  melhor que consegue (incl. o próprio diff de convergência) e devolve `edited` + o
  `self_diff` (sua **alegação**, não evidência) + um `verify_spec` (rota + seletor +
  estrutura/valor esperado do comp). Quem **promove a `locked`** é a verificação
  **independente** (§4f), que escreve `evidence.verified_by` (≠ `implemented_by`). Motivo:
  implementador atestando a própria obra é a falha-raiz; um contexto fresco não conserta o
  viés de quem fez o trabalho querer declará-lo pronto. O `self_diff` faz o sub-agente
  trabalhar até convergir; o `locked` vem de outro par de olhos.
- 🔴 **O diff isolado comp×componente é OBRIGATÓRIO e INDEPENDE de COMO se captura.** A
  verificação é "este componente, no preview ao vivo, bate com `comps/components/<x>`?" —
  isso **não** é dispensável nem substituível por "tokens certos" / "contraste limpo". O
  `verify_spec` é **INPUT a ser executado** pelo verificador, nunca evidência. "Recolorido"
  não converge: se a estrutura ainda é a do litheme, o `self_diff` tem que dizer isso, e o
  verificador vai reprovar.
- Se **travar** (precisa de função de dado, de mudança global que conflita, de decisão
  do usuário), devolva `status: "blocked"` com o motivo em `blockers` — **não** prossiga
  em silêncio nem invente.

### 4e. Pass de página (composição) — só DEPOIS de todos os componentes `locked`
Com os componentes travados, a página vira **composição**, não descoberta. Pode ser um
sub-agente por página (recebe o manifesto + o comp de página **+ o `bands.json`/`full.png` do
fonte + o `migration-inventory.json`**):
- 🔴 **A composição é guiada por uma LISTA DE COBERTURA, não por intuição.** Antes de ordenar,
  monte a lista das seções da página a partir do **`bands.json` do fonte** (a torre, em ordem) e
  dos itens `must`/`should` daquela superfície no **inventário**. Componha o JSON da página
  **seguindo essa ordem, índice a índice**, e ao fim confira: **toda** seção da lista está
  presente **na posição certa**? Seção do comp/inventário **ausente** no JSON = **lacuna**
  (recompor); seção **fora de ordem** = divergência (corrigir ou registrar). ⚠️ Anti-padrão real:
  o pass de página adicionou as seções custom novas (USP, dept-cards, editorial) mas **perdeu uma
  fileira de banners de conteúdo** que existia no comp, e **inverteu** a posição da faixa de USP
  vs o hero — as duas escaparam porque a composição foi "montar o que lembro" em vez de **bater a
  lista de faixas do fonte**. A reordenação/omissão de seção é tão divergência quanto cor errada.
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

> 🔴 **O PRODUTO nº 1 do gate é o DIFF ESTRUTURAL comp×componente — e ele é
> NÃO-SUBSTITUÍVEL.** Sweep de contraste, tokens certos e asserts de DOM são
> **complementos**, não o diff. Um gate que rodou só contraste/getComputedStyle por rota e
> passou **NÃO fez o gate** (erro real, repetido: footer ficou nas **colunas nativas** ≠ comp;
> PDP ficou com **descrição full-width** em vez da zona ancorada do comp; buy-box com modal em
> vez da tabela inline — tudo passou por um gate que checou cor/`data-testid`/screenshot-rápido
> em vez de estrutura. Pior: o sub-agente do footer **declarou no `self_diff`** "faltou coluna"
> e foi travado assim mesmo). **Regra dura:** para CADA componente crítico, carregue
> `comps/components/<x>` E o componente correspondente no preview **lado a lado** e liste TODA
> divergência de estrutura/seções/colunas/zonas/ordem/hierarquia — header×header, card×card,
> buy-box×buy-box, footer×footer, minicart×minicart, e cada seção custom×seu comp. **"Preso no
> layout nativo" é divergência de tema (balde 1) — bloqueia**, não é "decisão de dado".
>
> 🔴 **PONTO ÚNICO DE FALHA — quando o sub-agente é cego (browser singleton/headless bloqueado,
> comum neste ambiente).** Aí o implementador NÃO viu o próprio resultado, o `self_diff` é
> alegação cega, e a redundância do protocolo (self-diff + gate) **colapsa num só par de olhos:
> o gate do orquestrador**. Consequência dura: o orquestrador **não pode** travar em cima do
> `self_diff` nem de "token certo + testid existe"; **tem que fazer o diff estrutural lado-a-lado
> ele mesmo, por componente, no preview** — é a *única* verificação visual que sobrou. Se esse
> gate degrada para checagem de token, o "recolor passa" exatamente como o protocolo tenta
> evitar (foi o que deixou footer/PDP passarem presos no nativo). Não há atalho: sem o diff
> estrutural do gate, nada está `locked`. **Os sub-agentes de componente sempre chegam como `edited` (§4d); o GATE
> É a verificação isolada por componente — quem executa o comp-diff e PROMOVE `edited→locked`,
> escrevendo `evidence.diff_vs_comp` + `evidence.verified_by` (o seu próprio rótulo, que é
> ≠ `implemented_by`).** Ele NÃO pode pular o comp-diff de nenhum componente. Nenhum `locked`
> sem o diff comp×componente **executado aqui, por quem não implementou**. (Se preferir
> paralelizar, o orquestrador pode despachar um **sub-agente verificador por componente**
> antes do gate de página — vale como verificação independente desde que `verified_by` ≠
> `implemented_by`; o gate de página então confere a composição e os estados abertos.)

> 🔴 **O comp (B) é alvo de DESIGN; o SITE-FONTE ao vivo (A) é a verdade da PARIDADE.** Bater
> o comp não basta se o comp divergiu do fonte (a comp pode ter inventado/perdido uma faixa).
> Por isso o gate diffa **nas duas frentes**: preview×comp (B×C, estilo/estrutura desenhada)
> **e** preview×site-fonte (A×C, paridade real). Erro do caso real: o gate só fez B×C, a comp
> já estava errada, e a loja passou sem paridade nenhuma com o site real.

Inputs: o **comp de página** + o **preview da rota** + **o baseline renderado do fonte (A)**
(`reference/*.bands.json` + `*.full.png`) + o **manifesto**. Tarefa, nesta ordem:
0. **Diff de PARIDADE contra o SITE-FONTE (A×C), faixa-a-faixa** — cruze o preview contra o
   `bands.json` + `full.png` do fonte (regenere com `capture-source.mjs` se velho): **mesmas
   faixas/seções na mesma ordem**, **mesmas categorias na nav**, **mesmos banners/vitrines**,
   **mesma copy de faixa** (anúncio/USP/CTAs de seção). Toda divergência A×C que não seja
   **modernização consciente registrada** é **lacuna de paridade reportada** (de layout —
   conserta no tema; ou de conteúdo — vai pra §4h). Faixa do comp/tema que **não está no
   `bands.json`** = seção inventada (remover ou justificar). Faixa do `bands.json` **ausente**
   no preview = lacuna.
   > 🔴 **Faça uma TABELA ordenada, não um olhar.** Liste as faixas do `bands.json` numa coluna
   > (em ordem) e as seções do preview noutra, e **alinhe índice a índice**. O check tem que pegar
   > três coisas que escaparam de um diff visual:
   > - **PRESENÇA** — toda faixa do fonte tem correspondente no preview? (uma **fileira de banners
   >   de conteúdo** sumida no pass de página é o caso real);
   > - **ORDEM** — estão na mesma sequência? (uma **faixa de USP/benefícios** que o fonte tem
   >   ABAIXO do hero e o tema renderizou ACIMA é divergência, não preferência);
   > - **LARGURA / full-bleed** — um banner/hero que **sangra 100vw no `full.png`** está
   >   sangrando no preview, ou ficou **preso no cap do container** (~1280)? Largura errada de
   >   banner é divergência de layout do balde (1) — **bloqueia**. Confirme por DOM
   >   (`getBoundingClientRect().width` ≈ `innerWidth` para os full-bleed) além do olho.
1. **Diff de ESTILO/LAYOUT contra o comp** — comp de página e preview da mesma rota
   **LADO A LADO**: liste TODA divergência (**seção faltando** — trust-bar, dept-cards,
   banda; **estrutura diferente** — sidebar vs filtro; ordem; hierarquia; espaçamento).
   Por **componente** (header×header, card×card) **e** por **página**.
2. **Mobile (~390)** — confirme `innerWidth==390` e re-rode o diff (litheme é mobile-first).
3. **Sweep de contraste PROGRAMÁTICO** (não confie no olho) — via CDP `Runtime.evaluate`,
   varra todo texto visível, calcule ratio texto×fundo-efetivo (sobe a árvore até achar
   `background` opaco), **flague < 3.0**. Todos os componentes da rota de uma vez,
   **incluindo TODOS os estados HOVER/ABERTO** — não só o minicart. ⚠️ **Lição (caso real):
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
   Bug clássico (caso real, escapou até do fix-agent): `hover:bg-base-100` num item de
   mega-menu pinta o item de **branco**; como o texto do próprio elemento continua claro (o
   carve-back de tile é por DESCENDENTE, não pega o mesmo nó), vira **branco-no-branco e o
   rótulo some**. Hover em dark-chrome = overlay translúcido (`rgba(255,255,255,.06–.10)`),
   nunca `bg-base-100`.

**Triagem de cada divergência (3 baldes, não 2).** Antes do veredito, classifique cada
divergência achada no comp-diff:
1. **Tema (a-corrigir)** — estrutura/estilo que o reskin controla (cor, layout, seção
   faltando, hierarquia). Conserta.
2. **Decisão consciente** — modernização/limitação registrada com o porquê.
3. **Config de loja / DADO — é DADO _E_ É LACUNA DE CONTEÚDO A REPORTAR (as duas coisas).**
   Vem das settings/catálogo da loja, não do template → **não se conserta no template**. MAS
   isso **não encerra o assunto**: se o conteúdo diverge do site-fonte (A), é **lacuna de
   paridade de conteúdo reportada no topo do gate**, com a mesma proeminência das lacunas
   `must`. 🔴 **"É dado, não é tema" descrevia COMO entra — não dá passe-livre à divergência.**
   ⚠️ A **loja de teste vem SEMEADA com dados** (catálogo, **categorias da nav**, banners, hero)
   que podem **não** ser os do lojista — e **faltando** outros (CNPJ/razão social, toggle de
   newsletter `boxnews_barra`, selos de app). Nav com categorias diferentes do fonte,
   hero/banner diferente, produtos diferentes, copy de faixa diferente, CNPJ ausente = DADO
   **e** lacuna de conteúdo: roteie para a pendência de **config de loja / import de catálogo**
   (`migration-inventory.json` → `content_loaded: false`), **e marque no relatório que a
   paridade de conteúdo NÃO foi atingida** (ver §4h). Não silencie em "outro eixo".

> 🔴 **GUARDA DURA — divergência de ESTRUTURA vs o comp é SEMPRE balde (1); NÃO pode virar balde (2).**
> Uma seção/coluna/zona/ordem que **existe no comp** mas está **ausente, diferente ou rearranjada**
> no preview é **tema a-corrigir (1)** — **mecanicamente**, não por julgamento. O orquestrador
> **não tem licença** para reclassificá-la como "decisão consciente (2)". E há um **rationale
> proibido**, que invalida o balde (2) na hora: **"o componente nativo não tinha esse bloco/coluna,
> então não implementei"** (ex.: *"o footer nativo não tem coluna de marca/blurb, as regras proíbem
> inventar estrutura não-nativa"*). Isso é **exatamente o bug** — o comp É o alvo; o que está no comp
> e não no nativo é **estrutura a FORKAR** (o default), não estrutura proibida. Balde (2) só vale
> para uma **modernização/limitação de DADO** registrada (ex.: trocar 7 vitrines por 3 porque a
> conta-alvo só tem 3 categorias semeadas) — **nunca** para "deixei no nativo porque reskinar é mais
> seguro / o nativo não tinha".
> 🔴 **Gatilho automático de FALHA a partir do próprio `self_diff`:** se o `self_diff` do sub-agente
> **nomeia** uma divergência estrutural vs o comp ("footer ainda em 3 colunas nativas, o comp pede 4
> com brand-blurb"; "PDP com descrição full-width em vez da zona do comp"), o gate **NÃO PODE travar**
> o componente — devolve para fork. Travar um componente cujo `self_diff` confessa um déficit
> estrutural é a falha-raiz **repetida neste repo** (o agente do footer confessou a coluna faltando e
> foi travado mesmo assim). Regra: `self_diff` que cita seção/coluna/zona faltando ⇒ `status` **fica
> `edited`**, gate reprova, orquestrador re-despacha um sub-agente para **forkar a estrutura**.
> 🔴 **Checklist de estrutura por componente que o comp-diff DEVE percorrer (não "olhar e achar ok"):**
> **footer** = nº/ordem de colunas + **coluna de marca (logo+blurb+social)** + faixas Pague-com/Selos
> + barra inferior, **batendo o comp** (e os blocos de dado nativos realojados dentro, não perdidos);
> **header** = nº de faixas + busca + utilidades; **PDP** = zonas (galeria/buy-box ancorado/banda);
> **card** = media-ratio + corpo. Conte colunas/seções do comp e do preview e **alinhe** — diferença
> de contagem = balde (1).

**Veredito do gate:** só os do balde **(1)** bloqueiam. Para cada componente que
**convergiu**, o gate **escreve o artefato** no manifesto: `evidence.diff_vs_comp` (a lista
de divergências, vazia-justificada) + `evidence.verified_by` (o rótulo do gate, ≠
`implemented_by`) e promove `edited→locked`. Se houver divergência de tema injustificada
**ou** contraste < 3.0 → **gate FALHA** para aquele componente/página: devolve a lista ao
orquestrador, que despacha o conserto (sub-agente de componente se for componente; ajuste de
JSON se for composição) — o componente **continua `edited`**, não vira `locked`. Gate
**passa** uma página com balde-(1) injustificado = 0; grava `gates.<página>` no manifesto
**com os baldes (2) e (3) listados** (decisões conscientes + pendências de config de loja).
**Só então** revisão humana — junto dessas listas. (O orquestrador não "confia" no gate por
boa-fé: a passagem é checável — todo componente crítico tem `diff_vs_comp` preenchido e
`verified_by` ≠ `implemented_by`, ou não passou.)

### 4g. Fechar
Rode `scripts/audit-theme-styles.sh` na thread principal — pega forks que escaparam dos
sub-agentes (incl. `global_rules_added` que deviam ser homogeneizados).

### 4h. Relatório de PARIDADE DE CONTEÚDO + aviso de seed (não confunda "renderiza" com "migrou")
O reskin pode estar perfeito e a loja **não ter paridade de conteúdo nenhuma**. Antes da revisão
humana, **compare o conteúdo da conta-alvo com o site-fonte (A)** e reporte:
- **Catálogo/vitrines, árvore de categorias (nav), banners do hero, copy de faixas, dados legais
  (CNPJ/razão social)** — batem com o fonte? Marque `content_loaded` no
  `migration-inventory.json` (true/false/unknown) por item de `axis: content`.
- 🔴 **Aviso de SEED (lição do caso real):** a conta de teste vem com **seed genérico** (produtos/
  categorias/banners que **não são do lojista**). Se o conteúdo da conta ≠ do fonte, **emita no
  topo do relatório:** *"⚠️ conteúdo do lojista NÃO carregado na conta — paridade de conteúdo
  NÃO verificável neste preview; só estilo/estrutura foram verificados."* Liste a pendência
  (import de catálogo/categorias/banners/dados legais = config de loja, fora do tema). **Nunca**
  trate "o seed renderiza" como "o conteúdo migrou" — foi exatamente como uma loja sem nenhum
  produto/categoria/anúncio do lojista passou por "pronta".
- A verificação de paridade de **conteúdo** (§4f passo 0, eixo conteúdo) só é conclusiva com os
  **dados reais carregados**. Sem isso, o veredito do gate cobre estilo/estrutura e **declara
  explicitamente** que conteúdo ficou pendente.

## Anti-padrões que este guia elimina

- ❌ **Orquestrador editando QUALQUER arquivo** (fundação, one-liner global, asset-wiring)
  → ele delega tudo, fundação inclusa. Tocou um arquivo = saiu do papel. A correção de
  one-liner vai num **sub-agente de FIX focado**, não na mão do orquestrador.
- ❌ **Implementador atestando a própria obra** (mesmo em contexto fresco) → `locked` exige
  `evidence.verified_by` **≠** `implemented_by`. Contexto fresco não cura o viés de quem fez
  o trabalho querer declará-lo pronto. Sub-agente de componente devolve `edited`; quem
  promove é a verificação independente (§4f).
- ❌ **Reportar `locked`/`gate-pass` como veredito** ("ficou bom", "convergiu") sem o
  **artefato no manifesto** (`diff_vs_comp` preenchido + `verified_by` ≠ `implemented_by`).
  "Pronto" é estado de arquivo checável, não julgamento. Sem artefato = `edited`, ponto.
- ❌ **Rodar tudo numa thread única longa** → contexto degrada e a disciplina some.
  Use **1 sub-agente por componente** + orquestrador que não edita.
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
- ❌ **Substituir o diff comp×componente por sweep de contraste / checagem de tokens por
  rota.** Contraste limpo + tokens certos ≠ convergiu ao comp. O gate DEVE comparar
  estrutura/seções/layout contra o comp de CADA componente, lado a lado.
- ❌ **Aceitar `locked` de um `status:"done"` / `verify_spec` auto-reportado pelo
  implementador.** `verify_spec` é input a executar; `locked` só com o diff comp×componente
  EXECUTADO (pela thread principal ou pelo gate). Sub-agente sem browser devolve `edited`, não `locked`.
- ❌ **Deixar a restrição de ambiente (browser singleton / headless bloqueado) DERRUBAR o
  comp-diff.** A captura muda; a obrigação de diffar cada componente contra seu comp, não.
- ❌ **Mudar a "temperatura" de fundo (claro↔escuro) sem o sweep global** de
  contraste em todas as superfícies (ver "Reskin por MODO" em `global-styling.md`; se
  for o híbrido da exceção, `dark-hybrid-exception.md`).
- ❌ **Pular o plano** e ir direto pro editor — é o que gera o loop.
- ❌ **Gate só contra a comp (B×C), nunca contra o site-fonte (A×C).** A comp pode ter
  divergido do fonte; bater a comp não prova paridade. O gate diffa nas duas frentes (§4f).
- ❌ **Tratar "é dado, não é tema" como passe-livre.** Conteúdo divergente do fonte é DADO
  *e* lacuna de paridade reportada — as duas coisas (§4f balde 3, §4h).
- ❌ **Confundir "o seed renderiza" com "o conteúdo do lojista migrou".** Conta de teste com
  seed genérico → paridade de conteúdo NÃO verificável; avise no topo do relatório (§4h).
