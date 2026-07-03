# Régua de qualidade dos comps — *herdar identidade, ganhar refino*

O que separa um comp "reskin de tokens" de uma **loja realmente boa**. Esta régua é
o eixo de **estilo/refino** do loop do comp (junto de paridade, modo único e largura).

> **A lente da migração.** Diferente de design greenfield, aqui a **marca já existe**.
> A identidade (paleta, fontes, voz, logo, raio) **vem do kit e não se reinventa**. O
> que se ganha é **craft mecânico** — layout, espaçamento, hierarquia, contraste,
> estados, responsividade — que melhora qualquer loja **sem** mexer na marca.
> (Destilado das boas práticas do `impeccable`, Apache-2.0, filtrado p/ migração: a
> camada de *craft*, não a de *estratégia de marca*.)

## Herdar × ganhar

| **HERDAR** (vem do kit — não tocar) | **GANHAR** (refino que esta régua cobra) |
|---|---|
| paleta, fontes, voz, logo, raio | ritmo de espaçamento numa escala; alinhamento a grid |
| estratégia de cor / "POV de marca" | contraste/legibilidade (pares que o brand não garante) |
| ousadia / nível de saturação | tipografia: medida de linha, `text-wrap`, hierarquia |
| | layout, estados, responsividade, motion contido |

> Se um "refino" mudaria a **identidade** (trocar a fonte, dessaturar a cor de marca,
> mudar o raio), **não é refino** — é uma decisão consciente de `modernize`, registrada
> e aprovada no gate. Refino default **não** altera identidade.

## As regras de craft (a coluna "ganhar", quantificada)

### Espaçamento, ritmo & layout
- **Escala de espaçamento, não números soltos.** Gaps/paddings saem de uma escala
  (ex.: 4/8/12/16/24/32/48…); nada de `13px` avulso. **Varie** o espaçamento p/ ritmo
  (separações generosas entre seções, agrupamento apertado dentro) — monótono lê como
  template.
- **Alinhe a um grid.** Tudo encosta numa régua comum; respeite o `layout` (largura +
  full-bleed). Card é o recurso preguiçoso — use só quando é o melhor affordance;
  **card aninhado é sempre erro**.
- **Flex p/ 1D, grid p/ 2D.** Grid responsivo sem breakpoint: `repeat(auto-fit,
  minmax(280px,1fr))`. Evite **grade de cards idênticos** repetida sem hierarquia.

### Tipografia (refino, não troca de fonte)
- **Medida de linha 65–75ch** no corpo (dados/UI densa podem mais).
- **`text-wrap: balance`** em h1–h3, **`pretty`** em prosa longa (mata viúvas/órfãs).
- **Hierarquia com contraste real** entre níveis (escala ≥1.2). Título-como-corpo é
  achatamento — diferencie tamanho/peso.
- Caixa-alta só em rótulos/eyebrows curtos, nunca em corpo.

### Cor & legibilidade (com a paleta da marca)
- **Contraste:** corpo ≥ 4.5:1; texto grande (≥18px ou bold ≥14px) ≥ 3:1;
  **placeholder também 4.5:1** (não o cinza default). O erro mais comum: cinza claro
  "elegante" sobre near-white tintado → ilegível.
- **Gray-on-color lava.** Texto cinza sobre fundo colorido → use um **tom mais escuro
  do próprio matiz** do fundo, ou uma **transparência** do texto.
- A Skill 3 já roda um **sweep de contraste programático** (CDP) — o comp deve nascer
  passando, não empurrar o problema pra frente. **Rode o mesmo check no loop do comp**
  (preview_eval calculando o ratio WCAG dos pares reais): corpo/muted/placeholder sobre
  cada `base-*`, link sobre fundo, e **texto do CTA sobre o accent**.
- **A falha #1 (recorrente): texto branco sobre o ACCENT de tom médio.** Verdes/laranjas/
  cianos de marca costumam dar **< 3:1** com branco (ex.: um verde de marca de tom médio
  pode dar ~2.6:1 → falha o mínimo de texto grande). **Fix que preserva a identidade:**
  *deepe* o accent só o necessário p/ passar 3:1 com branco (um passo de luminância quase
  imperceptível no mesmo matiz) e
  use **o tom canônico da marca como `:hover`**. Registre como `modernize` (o papel
  `accent` do kit segue a verdade extraída; o ajuste é na *aplicação* do token). Alternativa:
  trocar `accent_ink` p/ um tom escuro do próprio matiz quando o branco não couber.

### Estados (o que mais falta num reskin)
- **Todo elemento interativo tem todos os estados:** default · hover · focus (indicador
  visível, nunca removido) · active · disabled · **loading** · **empty** · error.
- **Empty states ensinam** ("sua sacola está vazia" + caminho de volta), não "nada aqui".
  Use skeleton no carregamento de conteúdo, não spinner no meio.

### Responsivo & toque
- **Zero overflow horizontal** e **zero texto estourando o container** em QUALQUER
  breakpoint (teste a copy real — título longo + clamp grande estoura no tablet).
- **Alvos de toque ≥ 44×44px**; ações primárias na zona do polegar no mobile.
- Sem **CLS**: imagens com proporção reservada (o card já tem `image_ratio`).

### Cards de grade = ALTURA UNIFORME (regra universal, qualquer loja)
Um grid/vitrine de product-cards **lê como bagunça** quando os cards têm alturas
diferentes. A causa quase sempre é a **área de imagem dimensionando pela altura natural**
da foto — e catálogos reais misturam proporções (capa retrato × gift-card paisagem ×
packshot quadrado). A altura tem que ser **independente do conteúdo**:
- **Media = caixa de aspect-ratio FIXO**, vinda de `commerce.plp.card.image_ratio`
  (`aspect-ratio:1/1`, `3/4`, etc.) — a caixa nunca muda de altura; a imagem se ajusta
  dentro dela via `object-fit` (`cover` = preenche e recorta; `contain` = mostra inteira
  com respiro). A escolha cover/contain é por loja; a **caixa de proporção fixa é
  obrigatória sempre**.
- **Corpo do card de estrutura constante** (nome com nº de linhas reservado via
  `line-clamp`, preço, ação) para que dois cards lado a lado tenham a mesma altura mesmo
  com nomes de 1 vs 3 linhas.
- **Cards de uma linha esticam juntos** (`align-items: stretch` no grid; a célula manda a
  altura, não o conteúdo). O comp deve nascer com todos os cards da mesma altura — se um
  está mais alto, a media não está com ratio fixo OU o corpo não reservou as linhas.
> ⚠️ Anti-padrão real: `image_ratio` no kit mas a implementação deixou a `<img>` ditar a
> altura → cards mais altos e mais baixos no mesmo shelf. `image_ratio` **só funciona se
> virar caixa de proporção fixa**, não um valor que ninguém aplica.

### Motion (contido)
- Intencional, não decorativo. **Ease-out** (quart/quint/expo); **sem bounce/elastic**.
- `prefers-reduced-motion` **sempre** tem alternativa (crossfade/instantâneo).
- Reveal **realça** algo já visível — nunca esconda conteúdo atrás de transição (em
  render headless a transição não dispara e a seção sai em branco).

### Armadilha de interação (litheme usa drawers/dropdowns)
- Dropdown com `position: absolute` dentro de `overflow: hidden/auto` é **clipado**.
  Use `position: fixed`/popover/portal. Vale p/ mega-menu, sort, autocomplete, minicart.

## Bans mecânicos (subconjunto do impeccable relevante p/ migração)
Não são "bans anti-AI" (a marca tem identidade própria) — são **defeitos de craft**:
- **Borda-faixa lateral** (`border-left/right` > 1px como acento) → use borda completa,
  tint de fundo, ou número/ícone à frente.
- **Texto estourando o container** (ver responsivo).
- **Gray-on-color** e **contraste abaixo do mínimo** (ver cor).
- **Grade de cards idênticos** sem hierarquia; **cards aninhados**.

## Como pluga no loop
É o eixo **estilo/refino** da condição de sucesso de `comp-authoring.md` (ao lado de
A paridade, E modo único, G largura). Um comp não desce pro humano com defeito de craft
desta lista. E vira insumo do QA final da Skill 3 (ver `qa-checklist.md` → "Craft").
