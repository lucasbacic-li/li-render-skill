---
name: store-design-composer
description: >-
  A partir de um brand-kit (identidade já extraída: cor, tipo, logo, raio, voz),
  faz duas coisas: (1) MAPEIA A PARIDADE de migração com o site-fonte — inventaria
  o que precisa migrar em home, menu, rodapé, busca/PLP/PDP e apps (funcional +
  conteúdo), classificando o esforço contra o litheme; (2) DECIDE O DESIGN — commerce
  (mini-cart/PLP/PDP), modo de tema (light/dark único) e produz maquetes HTML fiéis
  (comps) para o cliente aprovar, modernizando sem perder paridade. Grava commerce +
  theme_mode no brand-kit, o migration-inventory.json e os comps/. Use SEMPRE que o
  usuário tiver um brand-kit (ou pasta de marca) e quiser "desenhar a loja", "definir
  o layout", "mapear o que migrar", "checar paridade", "inventário de migração",
  "decidir mini-cart/PLP/PDP", "gerar maquete/mockup", "criar o comp de aprovação" ou
  preparar o design antes de implementar o tema na Loja Integrada. É o passo do MEIO
  entre extrair a marca e implementar o tema (li-render).
---

# Store Design Composer

O passo do **meio** do kit LI Render: pega um **brand-kit** (identidade) e produz
o **design da loja** — para o cliente **aprovar antes** de qualquer implementação.

Tem **dois papéis** que andam juntos:
1. **Mapear o que precisa ser migrado** — auditar a **paridade** com o site-fonte
   nos eixos que um screenshot não prova (**funcional** + **conteúdo**), não só
   PLP/PDP mas **home, menu e rodapé**. Vira o **inventário de migração**.
2. **Aplicar os tokens da Skill 1 com consistência** — decidir o design (commerce +
   modo de tema + comps), **eliminando débito de usabilidade e modernizando** a
   experiência **sem perder** paridade funcional, de conteúdo e o estilo da marca.

```
brand-kit (Skill 1) ─► [inventariar paridade + decidir design + comps] ─► kit + inventory + comps/ ─► implementação (Skill 3)
                                  gate de aprovação do cliente
```

Lê **três contratos compartilhados** (leia antes de desenhar):
- `../shared/brand-kit-spec/brand-kit.spec.md` — o que entra e o que esta skill grava
  (inclui `commerce` + `theme_mode`).
- `../shared/litheme-capabilities/litheme-capabilities.spec.md` — os guardrails: só
  desenhe o que o litheme renderiza barato.
- `../shared/migration-inventory-spec/migration-inventory.spec.md` — o contrato do
  **inventário de migração** que esta skill produz.

## Por que esta skill existe

Um brand-kit traz cor, tipo, logo — mas **não responde** o que precisa **migrar** do
site atual nem como decidir mini-cart/PLP/PDP, porque nada disso existe numa brand
file. E uma migração que só "fica parecida" **perde silenciosamente** capacidades do
fonte (menu curado, selos do rodapé, comportamentos) e **herda débitos** (mistura
light/dark, inconsistências). Por isso este passo: **audita a paridade** (o que migra),
**decide o design** (commerce + modo de tema), **modela tudo em comps fiéis** e tem
**gate próprio** (a aprovação do cliente) antes de qualquer esforço de implementação.

## Princípios de design (lê isto primeiro)

1. **Inventarie a paridade antes de desenhar.** Varra o site-fonte com o catálogo
   `references/content-surfaces.md` (home, menu, rodapé + globais + apps de 3os) e
   registre cada bloco/capacidade no **inventário de migração**, com **prova**
   (`evidence`), não memória. O que o screenshot não prova (comportamento, blocos
   discretos) some se não for enumerado.
2. **Classifique no balde de esforço (ancorado no litheme).** Para cada item:
   `native` (reskin barato), `native-restructure`, `none` (→ `build-custom` ou
   `drop`), `app-section`, `store-app`. **Tudo que não é nativo força uma decisão
   consciente:** construir custom **ou** cortar. Nunca "deixar acontecer".
3. **Derive defaults das primitivas; não comece da página em branco.** O kit já diz
   muito: `radius.scale` sharp → cards quadrados; accent forte → **estilo** do CTA
   preenchido. Proponha um default coerente e **deixe o parceiro/cliente ajustar**.
   ⚠️ O default de commerce parte do **comportamento observado no fonte** (card sem
   botão → `none`); as primitivas afinam a **aparência**, não criam um controle que o
   fonte não tem. E `build-custom` **reproduz** o bloco real do fonte (copy literal,
   assets, comportamento) — **não inventa** uma seção/copy nova.
4. **Modernize sem perder paridade.** Aplique os tokens com consistência, elimine
   débito de usabilidade (ex.: **modo de tema único** — não herde mistura light/dark
   do fonte; ver `theme_mode` no kit) — mas **preserve** capacidade funcional,
   conteúdo e estilo de marca. Toda modernização é decisão consciente registrada.
5. **Restrição vence desejo.** Tudo que você desenhar cabe nos
   `litheme-capabilities`. Um comp que o litheme não renderiza barato é uma promessa
   que a Skill 3 terá que desmentir.
6. **O comp é intenção de design E alvo de QA.** É a fonte que a Skill 3 persegue e
   contra a qual verifica o preview (DOM + diff). Construa com a *estrutura* do
   litheme (papéis, tokens, componentes), não CSS frágil.
7. **Grave a decisão, não só o pixel.** Commerce → bloco `commerce`; modo →
   `theme_mode`; paridade → `migration-inventory.json`; aparência → `comps/`.
8. **O gate é humano.** Apresente comps + relatório de paridade, colha aprovação
   explícita, e só então passe para a Skill 3. Não pule sem o "ok".
9. **Delegue a varredura pesada a um sub-agente; a thread principal decide e elicita.**
   A Fase 2 (inventariar o `<kit>/reference/` item a item contra o catálogo
   `content-surfaces.md`) é leitura/enumeração densa — o maior consumo de contexto da skill.
   Despache um **sub-agente de inventário** que varre o **baseline renderado**
   (`reference/*.bands.json` + `*.full.png` + `*.rendered.html`) e devolve o
   **`migration-inventory.json` rascunho** (cada item com `evidence` citando o índice da
   faixa no `bands.json`, + `litheme_support` candidatos), em vez de encher a thread
   principal com o HTML cru. A thread
   principal fica para **fechar as `decision`** (migrate/modernize/build-custom/drop), a
   elicitação com o cliente (Fase 3) e o gate (Fase 5) — diálogo e decisão não se delegam.
   Mesma regra do kit: varredura pesada → sub-agente que retorna artefato magro; decisão e
   conversa ficam na principal. (A geração dos comps na Fase 4 também pode ir por sub-agente
   por componente, espelhando a Skill 3 — mas a coerência de marca entre comps fica na principal.)

## Inputs necessários

- **Caminho do brand-kit** (saída da Skill 1) ou de uma pasta de marca rica.
- **O baseline renderado do site-fonte** em `<kit>/reference/` (`<label>.rendered.html` +
  `.bands.json` + `.full.png` por superfície) que a Skill 1 gerou com `capture-source.mjs` —
  é a base do inventário **e** o alvo de diff dos comps. ⚠️ **Se faltar** (sem `bands.json`/
  `full.png`), **pare**: rode você mesmo o `capture-source.mjs` antes de inventariar. **Nunca**
  inventarie a partir de `curl`/HTML cru ou de uma descrição textual — é a brecha que faz a skill
  perder faixas (stripe/USP injetados por JS) e inventar conteúdo.
- **Contexto de catálogo** (opcional, eleva fidelidade): nº de produtos, variações,
  categorias — informa PLP/PDP e a profundidade do menu. Pergunte se relevante.

## O fluxo (5 fases)

### Fase 1 — Ler kit + derivar defaults
Ler o brand-kit (e `_uncertain`) + os `litheme-capabilities`. Para cada decisão de
commerce (mini-cart, PLP, PDP), propor um **default derivado das primitivas**,
dentro do domínio renderável. Decidir defaults de **`theme_mode`** (light/dark, da
paleta) e **`layout`** (contained vs fluid-up + seções full-bleed). Ver
`references/commerce-surfaces.md`.

### Fase 2 — Inventariar a paridade do site-fonte
Passo **estrutural** sobre o **baseline renderado** (`reference/*.bands.json` + `*.full.png`),
com lente de *capacidade/conteúdo* (não de cor). Percorra a **torre de faixas** do `bands.json`
(que já vem em ordem, com modo e conteúdo) e cruze com o catálogo
`references/content-surfaces.md` (header, nav, home, rodapé, globais, apps de 3os) —
classificando cada item no **balde** (`native` … `store-app`) e na **decisão**
(`migrate`/`modernize`/`build-custom`/`reintegrate-app`/`drop`). **Afirmar ausência** (`drop`
por inexistência) exige que a faixa **não esteja no `bands.json`** — nunca um `grep` que deu 0.
Grava `<kit>/migration-inventory.json` (contrato em `../shared/migration-inventory-spec/`).
É o conserto do gap "passou batido em home/nav/rodapé".

### Fase 3 — Elicitar e fechar as decisões
Apresentar os defaults (commerce + `theme_mode`) e o inventário como decisões (com o
porquê), e ajustar com o parceiro/cliente. Resolver os `_uncertain` herdados da
Skill 1. Escrever `commerce` + `theme_mode` + `layout` no brand-kit e fechar as
`decision` do inventário.

### Fase 4 — Gerar os comps (galeria de COMPONENTES + composição)
Materializar as decisões em **maquetes HTML fiéis**, dos tokens do kit + estrutura do
litheme, **num único modo de tema** (`theme_mode`). **O componente é a unidade:** um
comp por componente global crítico em `comps/components/` (header, footer,
product-card, buy-box, minicart, + os `build-custom` como usp-bar…), **renderizável
isolado**, + comps de **página magros** em `comps/pages/` que só **compõem**. O comp
deve **cobrir o inventário**: todo item `must`/`should` aparece ou é `drop`/
`reintegrate-app` consciente. Ver `references/comp-authoring.md`.
> Comp de página inteira é alvo ruim de auditoria de componente — esconde divergência
> de *layout* atrás de paridade de *cor*. Separe "como o componente é" de "como a
> página o compõe".

### Fase 5 — Aprovação (o gate)
Apresentar comps (preview/screenshot) **+ o relatório de paridade** (`INVENTORY.md`,
com `must` faltando/dropados e `build-custom`/`reintegrate-app` destacados), colher
aprovação **explícita** e registrar. Entregar:
> "Design aprovado. Kit em `<kit>/brand.kit.json` (`commerce` + `theme_mode` +
> `layout`) + `<kit>/migration-inventory.json` + comps em `<kit>/comps/`. Para
> implementar, rode `li-render-store-builder`."

## Definition of Done

O entregável é o **kit desenhado e aprovado**. Só está pronto quando:

- [ ] **`migration-inventory.json`** preenchido — header/nav/home/footer/globais/apps
      varridos do catálogo, cada item com `priority`/`litheme_support`/`decision`/
      `evidence`/`target` (contrato em `../shared/migration-inventory-spec/`).
- [ ] Bloco **`commerce`** do `brand.kit.json` preenchido — mini-cart, PLP e PDP,
      todos os campos do spec, **dentro dos domínios renderáveis**
      (`../shared/litheme-capabilities/`).
- [ ] **`theme_mode`** decidido e gravado (modo único light/dark; **sem herdar
      mistura** do fonte). Seções invertidas só como acento contido.
- [ ] **`layout`** decidido e gravado (régua de largura: contained vs fluid-up,
      `max_width`/`gutter`, seções `full_bleed`) — uma régua única, refletida nos comps.
- [ ] Os itens **`_uncertain`** herdados da Skill 1 foram resolvidos no caminho.
- [ ] `comps/components/` com 1 comp por **componente** global crítico (header,
      footer, product-card, buy-box, minicart + os `build-custom`…), renderizável
      **isolado**, + `comps/pages/` com comps de **composição** + `_tokens.css`, tudo
      com tokens do kit (`--bk-*`, **sem hex hardcoded**), **modo único**, e estrutura
      do litheme. Cada comp declara qual componente do litheme materializa.
- [ ] Os comps **renderizam** em desktop **e** mobile (screenshots) sem erro.
- [ ] **Condição de sucesso atingida em loop ANTES do humano** (ver
      `references/comp-authoring.md`): cada comp **diffado contra o baseline renderado**
      (`reference/*.bands.json` para faixa/ordem/conteúdo/modo + `*.full.png` para layout) —
      **falha-fechado se o baseline não existir** (sem ele o "0 divergências" é incomputável,
      não auto-passa); **assets reais** onde existem; paridade de seções/fundos + **modo
      único** (critério E) verificados; **inventário coberto** (0 item não-contabilizado);
      cada diferença ou corrigida ou registrada como **decisão consciente**. Zero divergência
      injustificada.
- [ ] **Cliente aprovou explicitamente** comps **+ relatório de paridade** (o gate) —
      com a lista de decisões conscientes (paridade vs. modernização) e os
      `build-custom`/`reintegrate-app`/`drop` à vista.

## O que esta skill NÃO faz
- Não toca na conta da Loja Integrada nem na `li-cli` — isso é da Skill 3.
- Não re-extrai identidade (cor/tipo/logo) — isso é da Skill 1; aqui o kit é input.
- Não desenha fora do que o litheme renderiza — guardrails mandam.

## Arquivos de referência
- `../shared/brand-kit-spec/brand-kit.spec.md` — contrato de dado (entra/grava
  `commerce` + `theme_mode`).
- `../shared/litheme-capabilities/litheme-capabilities.spec.md` — guardrails +
  mapa `theme_mode`→DaisyUI.
- `../shared/migration-inventory-spec/migration-inventory.spec.md` — **contrato do
  inventário** que esta skill produz (forma do JSON + gate só-alerta).
- `references/content-surfaces.md` — **o catálogo de paridade** (home, nav, rodapé,
  globais, apps de 3os) ancorado no litheme real + os **três baldes de esforço**.
  Onde o último teste passava batido.
- `references/commerce-surfaces.md` — **a matriz de decisão** mini-cart/PLP/PDP:
  default derivado das primitivas, opções, e o componente do litheme.
- `references/design-quality.md` — **a régua de craft** ("herdar identidade, ganhar
  refino"): espaçamento/ritmo, tipografia, contraste, estados, responsivo, motion. O
  eixo de qualidade do loop do comp.
- `references/comp-authoring.md` — como construir os comps HTML fiéis (estrutura
  alinhada ao litheme, tokens, papéis, **modo único**) para serem alvo de QA da Skill 3.
