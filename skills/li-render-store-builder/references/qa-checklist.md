# Checklist de QA no preview

A skill não termina até o tema estar renderizando e verificado no preview
(`https://{loja}-preview.lojas.li/.theme/{nome}`). Verifique você mesmo com as
ferramentas de preview/navegador — não peça ao usuário para checar manualmente.

Pré-condições: `npm run watch:css` e `li-cli theme sync <nome> -r` rodando.

## ⚠️ Abra uma ABA DEDICADA por verificação (isolamento multi-thread)

Várias threads/agentes trabalhando ao mesmo tempo competem pela mesma aba do
preview — uma navega e a outra perde o contexto. **Nunca reutilize "a" aba do
preview.** Toda verificação/teste cria a própria aba e opera só nela:

1. `tabs_context_mcp({ createIfEmpty: true })` — garante o grupo de abas.
2. `tabs_create_mcp()` — cria uma aba **nova**; guarde o `tabId` retornado.
3. Use **sempre esse `tabId`** em `navigate` / `javascript_exec` / `screenshot`
   durante toda a run (nunca um tabId herdado/compartilhado).
4. Ao terminar, **`tabs_close_mcp`** nessa aba — limpeza, evita acúmulo.

Assim duas threads rodando em paralelo não brigam pela mesma aba.

## ⚠️ Verificação responsiva é OBRIGATÓRIA (desktop E mobile)

O litheme é mobile-first e usa `md:` + `clamp(vw)` por toda parte. Uma mudança
que "parece ok no desktop" frequentemente quebra no mobile (escala de fonte,
padding, largura). **Nenhuma mudança visual está pronta até ser verificada nas
duas pontas.** Para cada componente alterado, capture e confira:

| Largura | Alvo | O que olhar |
|---|---|---|
| ~390–414px | mobile | fonte não gigante/minúscula; sem overflow horizontal; padding não espremido; alvos de toque ok; `clamp(vw)` não estourando em container estreito (drawer!) |
| ~768px | tablet | quebra de grid (`md:`) coerente |
| ~1440px | desktop | proporção/escala |
| ~1920px+ | wide | cresce com o gutter, sem virar linha gigante |

Mínimo inegociável: **mobile (~390) + desktop (~1440)**.

⚠️ **Qual método de resize — depende da superfície:**
- **PREVIEW autenticado (`*.lojas.li`):** o Chrome MCP está **BLOQUEADO** para esse
  domínio (ver `li-render.md` ~"O Chrome MCP NÃO serve mais para o preview"). Resize é
  via **CDP `Emulation.setDeviceMetricsOverride`** (Chrome headless com cópia do perfil
  do usuário) → reload → `Page.captureScreenshot`, repetindo nas duas larguras.
  Confirme `window.innerWidth` antes de cada screenshot.
- **Baseline do SITE PÚBLICO (origem):** aí sim use o Chrome MCP — `resize_window` →
  `navigate`/reload → screenshot. (Chrome-MCP só serve para o site público de origem.)

Armadilha já vista: `clamp(_, vw, _)` num drawer estreito vira o teto do clamp (grande
demais) — use tamanho fixo em headers de drawer.

**Quando o resize não pega (baseline, Chrome MCP):** em algumas janelas do Chrome
conectado o `resize_window` retorna sucesso mas o viewport **não muda** (fica travado na
largura do monitor — confira com `window.innerWidth`). Saídas: (a) abrir uma
**aba nova** (`tabs_create_mcp`) — a janela pode nascer mais estreita; ou (b)
verificar o responsivo pela **config no DOM**, que é determinística: as classes
de breakpoint Tailwind (`grid-cols-1 sm:grid-cols-2`) e os atributos que o JS lê
(`data-slides-per-view` do embla) provam o comportamento por viewport sem
precisar renderizar a 390px. Use (b) como fallback, deixando claro no relato que
foi por config, não pixel renderizado.

## ⚠️ Anomalia visual é regressão (funcional ≠ correto)

Um fluxo pode passar em todos os asserts de função e ainda estar **visualmente
quebrado**. A avaliação **tem que** procurar anomalias visuais, não só "renderizou
/ tem N itens no DOM". As quatro classes a caçar em cada estado:

| Classe | O que procurar | Como pegar (determinístico) |
|---|---|---|
| **Colapso / largura-zero** | grade/card/imagem que existe no DOM mas renderiza fino ou 0×0 | `el.getBoundingClientRect().width` — **assert > 0** em grids, cards e imagens; cheque `getComputedStyle(grid).gridTemplateColumns` (não pode virar `2px 2px`) |
| **Falta de padding/espaço** | blocos adjacentes colados (ex.: listagem ↔ CTA) | medir o gap entre `bottom` de um e `top` do seguinte (`getBoundingClientRect`); confirmar visualmente no screenshot |
| **Sobreposição** | elementos empilhados/cobrindo outro | comparar retângulos de irmãos por interseção; olhar o screenshot |
| **Ausência do que deveria existir** | a copy/intenção promete algo que não aparece (ex.: "veja os produtos abaixo" sem grade) | comparar a intenção do template com o renderizado |

**Gotcha verificada (litheme):** uma grade (`grid grid-cols-2`) dentro de um pai
`flex justify-center` **sem `w-full`** encolhe para min-content — as colunas viram
~`2px` e as imagens do card renderizam `0×0`, aparecendo como **slivers verticais**.
Visto no estado de carrinho vazio (sugestões de produto). Por isso: **nunca confie
só em "o DOM tem N cards"** — meça a largura renderizada. Add-to-cart/HTMX: o
conteúdo do drawer (item, sugestões) carrega **assíncrono** — espere o swap antes
de medir, senão você lê o container vazio e conclui "sumiu" por engano.

## Auditoria de estilo (rode antes de fechar)

`bash scripts/audit-theme-styles.sh <tema>` — pega forks que escapam à inspeção
visual (cores hardcoded, ícones `fill="#hex"` em vez de `currentColor`, `rounded-*`
explícito, título-como-corpo). Homogenize o que aparecer. Ver `global-styling.md`.

## Por página (home, categoria, produto)

- [ ] Renderiza sem erros no console.
- [ ] Sem requests de rede quebrados (fontes, assets, CSS, chamadas de função).
- [ ] **Tokens aplicados**: cores de fundo/texto/accent batem com a paleta da
      marca; nada com o visual default do litheme sobrando.
- [ ] **Fontes carregam**: famílias certas por papel (headline/subhead/body),
      sem FOUT permanente nem fallback de sistema visível.
- [ ] **Logo** aparece, na variante certa para o fundo (claro/escuro).
- [ ] **Dados reais**: grids/listas populam via funções (`get_products`,
      `get_products_by_category`, `get_current_product`) — não placeholders.
- [ ] Links de produto levam à página de produto certa.
- [ ] Responsivo: mobile e desktop sem quebra de layout.
- [ ] Hover/estados básicos (cards, links) funcionam.

## Partials e interação

- [ ] Header: navegação e variação transparente→sólido (se aplicável) ok.
- [ ] Minicart: `/partial/minicart` responde e renderiza; atualiza via HTMX em
      `cartUpdated`.
- [ ] Footer: marca/links/tagline corretos.

## Coerência de marca (intenção de design)

- [ ] As seções e a hierarquia seguem o layout de referência da marca (quando
      havia HTML de referência).
- [ ] Microcopy (CTAs, títulos de seção) coerente com a voz da marca, se a
      camada verbal existia.
- [ ] Nada "median": o resultado tem a direção visual específica da marca, não um
      reskin genérico de tokens.

## Paridade de migração (contra `migration-inventory.json` **e o site-fonte ao vivo**)

Re-verifique o **contrato de paridade** no preview ao vivo, superfície por superfície:

- [ ] **Diff contra o SITE-FONTE (A), faixa-a-faixa** — não só contra os comps. Use o
      **baseline renderado** do kit (`reference/*.bands.json` = faixas/ordem/conteúdo/modo +
      `*.full.png`), que a Skill 1 capturou do site real; se estiver velho, regenere com
      `../../brand-kit-extractor/scripts/capture-source.mjs`. Confira preview×baseline: mesmas
      faixas/ordem, mesma nav (categorias), mesmos banners/vitrines, **mesma copy de faixa**
      (anúncio/USP/CTAs). 🔴 Bater a comp (B) não prova paridade — a comp pode ter divergido do
      fonte. Faixa do tema que **não está no `bands.json`** = seção inventada; faixa do
      `bands.json` **ausente** no preview = lacuna.
- [ ] Todo item `must`/`should` `native`/`build-custom` está **presente** (ou é
      `drop`/`reintegrate-app` consciente). Lacunas `must` → **reporte em destaque**
      (modo só-alerta; não hard-blocka — `promote` é decisão do usuário).
- [ ] `store-app`/`reintegrate-app` **não** virou tema — lista como pendência de
      configuração de loja (painel), não implementação.

## Paridade de CONTEÚDO + aviso de seed (não confunda "renderiza" com "migrou")

- [ ] **Conteúdo da conta-alvo conferido contra o fonte:** catálogo/vitrines, **árvore de
      categorias da nav**, banners do hero, **copy de faixas**, dados legais (CNPJ/razão
      social). Marque `content_loaded` (true/false/unknown) por item `axis: content` no
      inventário.
- [ ] 🔴 **Aviso de SEED:** se a conta tem seed genérico (produtos/categorias que **não são do
      lojista**), reporte no topo: *"conteúdo do lojista NÃO carregado — paridade de conteúdo
      NÃO verificável neste preview; só estilo/estrutura verificados"*. Liste a pendência de
      import (catálogo/categorias/banners = config de loja). **Nunca** declare pronto com
      produtos/categorias genéricos do seed no lugar do catálogo real do lojista.

## Craft / refino (qualidade intrínseca — espelha `store-design-composer/references/design-quality.md`)

Além de "bate com o comp": a loja tem que ser **bem feita**. Estes são defeitos de
*craft* que o reskin de tokens não pega sozinho — verifique no preview ao vivo:

- [ ] **Estados completos** de cada interativo, exercidos AO VIVO (não só default):
      hover · **focus visível** · active · disabled · **loading** (skeleton, não
      spinner) · **empty** (sacola/busca vazias ensinam) · error. (O sweep estático
      mente — abra drawers/dropdowns/estados vazios via eval; ver matriz responsiva.)
- [ ] **Espaçamento numa escala + ritmo** (sem `13px` avulso; seções respiram, grupos
      apertam) e **alinhamento à régua** (`layout`: container único + full-bleed certos).
- [ ] **Tipografia**: medida de linha 65–75ch no corpo; hierarquia com contraste real
      (não título-como-corpo); sem texto estourando container em nenhum breakpoint.
- [ ] **Contraste** (corpo ≥4.5:1, grande ≥3:1, placeholder 4.5:1; sem gray-on-color) —
      via o sweep programático de contraste (CDP) já no fluxo.
- [ ] **Toque & layout**: alvos ≥44px; zero overflow horizontal; sem CLS (imagens com
      proporção reservada).
- [ ] **Cards de grade com ALTURA UNIFORME**: meça `getBoundingClientRect().height` de
      todos os cards de um shelf — devem ser **iguais**. Se variam, a media não está numa
      caixa de aspect-ratio fixo (`image_ratio`) ou o corpo não reservou as linhas do nome
      (`line-clamp`). Ver `global-styling.md` → "Product-card: altura uniforme".
- [ ] **Faixas full-bleed com a largura certa**: para cada seção em `layout.full_bleed`
      (hero/banner, tarjas), confirme por DOM que `getBoundingClientRect().width ≈
      window.innerWidth` — banner preso no cap do container quando o fonte sangra é lacuna
      de paridade (ver §4f passo 0 / `implementation-plan.md` Passo 1).
- [ ] **Motion contido**: ease-out (sem bounce); `prefers-reduced-motion` com
      alternativa; nenhum conteúdo escondido atrás de transição que não dispara headless.
- [ ] **Dropdowns/menus não clipados** (mega-menu, sort, autocomplete) — `overflow`
      não corta painel posicionado.

## Antes de entregar

- [ ] Screenshot/preview capturado como evidência para o usuário.
- [ ] Resumo do que foi feito (tema, páginas, URL de preview).
- [ ] Promoção para produção apresentada como decisão do usuário — não executada
      automaticamente.
