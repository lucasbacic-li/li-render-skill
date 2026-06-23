---
name: store-design-composer
description: >-
  A partir de um brand-kit (identidade já extraída: cor, tipo, logo, raio, voz),
  decide as superfícies de commerce da loja — mini-cart, busca/PLP e PDP — que um
  guideline de marca não responde, e produz maquetes HTML fiéis (comps) do alvo
  para o cliente aprovar antes da implementação. Grava as decisões de volta no
  brand-kit (bloco commerce) e os comps em comps/. Use SEMPRE que o usuário tiver
  um brand-kit (ou pasta de marca) e quiser "desenhar a loja", "definir o layout",
  "decidir mini-cart/PLP/PDP", "gerar maquete/mockup da loja", "criar o comp de
  aprovação" ou preparar o design antes de implementar o tema na Loja Integrada.
  É o passo do MEIO entre extrair a marca e implementar o tema (li-render).
---

# Store Design Composer

O passo do **meio** do kit LI Render: pega um **brand-kit** (identidade) e produz
o **design da loja** — as decisões de superfície de commerce + maquetes HTML
fiéis do alvo — para o cliente **aprovar antes** de qualquer implementação.

```
brand-kit (Skill 1)  ──►  [decidir commerce + comps]  ──►  kit enriquecido + comps/  ──►  implementação (Skill 3)
                         gate de aprovação do cliente
```

Lê **dois contratos compartilhados** (leia ambos antes de desenhar):
- `../shared/brand-kit-spec/brand-kit.spec.md` — o que entra e o que esta skill grava.
- `../shared/litheme-capabilities/litheme-capabilities.spec.md` — os guardrails: só
  desenhe o que o litheme renderiza barato.

## Por que esta skill existe

Um brand-kit vindo de scrape/Figma traz cor, tipo, logo — mas **não responde**
mini-cart, resultados de busca (PLP) e PDP, porque essas superfícies não existem
numa home/brand file. Decidi-las é **design** (gosto + trade-offs), e o cliente
quer **ver e aprovar** antes de gastar esforço de implementação. Por isso é um
passo próprio, com entregável próprio (o comp) e gate próprio (a aprovação).

## Princípios de design (lê isto primeiro)

1. **Derive defaults das primitivas; não comece da página em branco.** O kit já
   diz muito: `radius.scale` sharp → cards quadrados + divisórias hairline;
   paleta terrosa contida → grids discretos; accent forte → CTA preenchido. Proponha
   um default coerente para cada decisão e **deixe o parceiro/cliente ajustar**.
2. **Restrição vence desejo.** Tudo que você desenhar tem que caber nos
   `litheme-capabilities`. Um comp que o litheme não renderiza barato é uma
   promessa que a Skill 3 terá que desmentir.
3. **O comp é intenção de design E alvo de QA.** Ele é a fonte que a Skill 3 persegue e
   contra a qual verifica o preview ao vivo (DOM + diff). Construa-o com a mesma
   *estrutura* que o litheme usa (papéis, tokens, componentes), não CSS frágil.
4. **Grave a decisão, não só o pixel.** Toda escolha vai para o bloco `commerce`
   do brand-kit (reproduzível e versionado), além do HTML em `comps/`.
5. **O gate é humano.** Apresente os comps, colha aprovação explícita do cliente,
   e só então passe para a implementação. Não pule para a Skill 3 sem o "ok".

## Inputs necessários

- **Caminho do brand-kit** (saída da Skill 1) ou de uma pasta de marca rica.
- **Contexto de catálogo** (opcional, eleva fidelidade): nº de produtos, se há
  variações (tamanho/cor), categorias — informa PLP/PDP. Pergunte se relevante.

## O fluxo (4 fases)

### Fase 1 — Ler kit + derivar defaults
Ler o brand-kit (e `_uncertain`) + os `litheme-capabilities`. Para cada decisão de
commerce (mini-cart, PLP, PDP), propor um **default derivado das primitivas**,
dentro do domínio renderável. Ver `references/commerce-surfaces.md`.

### Fase 2 — Elicitar e fechar as decisões
Apresentar os defaults como uma tela de decisões (com o porquê de cada um) e
ajustar com o parceiro/cliente. Resolver os itens `_uncertain` herdados da Skill 1.
Escrever o resultado no bloco `commerce` do brand-kit.

### Fase 3 — Gerar os comps (galeria de COMPONENTES + composição)
Materializar as decisões em **maquetes HTML fiéis**, construídas dos tokens do kit e
da estrutura do litheme. **O componente é a unidade:** um comp por componente global
crítico em `comps/components/` (header, footer, product-card, buy-box, minicart…),
**renderizável isolado** (alvo 1:1, diffável barato), + comps de **página magros** em
`comps/pages/` que só **compõem** (home, PLP, PDP). Ver `references/comp-authoring.md`.
> Comp de página inteira é alvo ruim de auditoria de componente — ele esconde
> divergência de *layout* atrás de paridade de *cor*. Separe "como o componente é" de
> "como a página o compõe".

### Fase 4 — Aprovação (o gate)
Apresentar os comps ao cliente (preview/screenshot), colher aprovação **explícita**
e registrar. Entregar:
> "Design aprovado. Kit enriquecido em `<kit>/brand.kit.json` (bloco `commerce`) +
> comps em `<kit>/comps/`. Para implementar, rode `li-render-store-builder`."

## Definition of Done

O entregável é o **kit desenhado e aprovado**. Só está pronto quando:

- [ ] Bloco **`commerce`** do `brand.kit.json` preenchido — mini-cart, PLP e PDP,
      todos os campos do spec, **dentro dos domínios renderáveis**
      (`../shared/litheme-capabilities/`).
- [ ] Os itens **`_uncertain`** herdados da Skill 1 foram resolvidos no caminho.
- [ ] `comps/components/` com 1 comp por **componente** global crítico (header,
      footer, product-card, buy-box, minicart…), renderizável **isolado**, + 
      `comps/pages/` com comps de **composição** (home, PLP, PDP) + `_tokens.css`,
      tudo com tokens do kit (`--bk-*`, **sem hex hardcoded**) e estrutura do litheme.
      Cada comp de componente declara qual componente do litheme materializa.
- [ ] Os comps **renderizam** em desktop **e** mobile (screenshots) sem erro.
- [ ] **Condição de sucesso atingida em loop ANTES do humano** (ver
      `references/comp-authoring.md`): cada comp cruzado contra o screenshot real da
      página correspondente (`reference/`), com **assets reais** usados onde existem,
      paridade de seções/fundos verificada, e cada diferença do site ou é corrigida
      ou registrada como **decisão consciente** (modernização/limitação de dado).
      Zero divergência injustificada.
- [ ] **Cliente aprovou explicitamente** os comps (o gate) — apresentando também a
      lista de decisões conscientes (paridade vs. modernização).

## O que esta skill NÃO faz
- Não toca na conta da Loja Integrada nem na `li-cli` — isso é da Skill 3.
- Não re-extrai identidade (cor/tipo/logo) — isso é da Skill 1; aqui o kit é input.
- Não desenha fora do que o litheme renderiza — guardrails mandam.

## Arquivos de referência
- `../shared/brand-kit-spec/brand-kit.spec.md` — contrato de dado (entra/grava).
- `../shared/litheme-capabilities/litheme-capabilities.spec.md` — guardrails.
- `references/commerce-surfaces.md` — **a matriz de decisão** mini-cart/PLP/PDP:
  cada decisão com default derivado das primitivas, opções, e o componente do
  litheme que materializa. O coração desta skill.
- `references/comp-authoring.md` — como construir os comps HTML fiéis (estrutura
  alinhada ao litheme, tokens, papéis) para serem alvo de QA da Skill 3.
