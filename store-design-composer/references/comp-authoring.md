# Autoria dos comps

Os comps são **maquetes HTML fiéis do alvo** — como a loja vai ficar — geradas a
partir do brand-kit + das decisões de commerce. Têm dois papéis ao mesmo tempo:
**intenção de design** (o cliente aprova) e **alvo de QA** (a Skill 3 verifica o
preview ao vivo contra eles).

## Escopo v1 — GALERIA DE COMPONENTES + comps de composição

> **Lição do 1º caso (mudança de formato).** Comps **só de página** são um alvo ruim
> para a Skill 3: ela recolore o componente do litheme, screenshota a página inteira,
> "vê" que ficou na cor certa e **declara pronto** — sem nunca convergir a *estrutura*
> do componente ao comp (header recolorido ≠ header do comp). O comp de página
> **mistura** "como o componente é" com "como a página o compõe", e isso esconde a
> divergência de layout.
>
> **Formato novo:** o componente é a unidade. A Skill 2 entrega **um comp por
> componente global crítico** (renderizável **isolado**, alvo 1:1 e diffável barato) +
> **comps de página magros** que só **compõem** (qual componente, em que ordem).

```
comps/
├── _tokens.css            ← importa ../tokens.css (papéis --bk-*) + primitivas
├── components/            ← GALERIA: 1 comp por componente, renderizável isolado
│   ├── header.html        ← topbar + linha de logo/busca/utilidades + nav de categorias
│   ├── footer.html        ← newsletter + colunas + selos + barra inferior
│   ├── product-card.html  ← tile: mídia + nome + preço + (badge) + ação
│   ├── buy-box.html        ← PDP: preço + parcelas + CTA + estoque
│   ├── minicart.html      ← drawer: item + resumo + CTAs
│   └── (trust-bar, breadcrumb, sort, filtros… conforme a loja)
└── pages/                 ← COMPOSIÇÃO: páginas magras que só ordenam componentes
    ├── home.html          ← <header> + hero + shelves + <footer> (referenciam a galeria)
    ├── plp.html
    └── pdp.html
```

Cada comp de componente declara, no topo (comentário HTML), **qual componente do
litheme** materializa (header/footer/product-card/minicart…), pra B saber o que
**reskinar/reestruturar** em vez de criar do zero.

> Regra de granularidade: é **componente** (vai pra `components/`) tudo que se repete
> entre páginas ou tem estrutura própria (header, footer, card, buy-box, minicart,
> trust-bar, breadcrumb, controles de PLP). É **composição** (vai pra `pages/`) a
> ordem/seleção desses na rota. Se um comp de página está reespecificando o *interior*
> de um componente, esse interior pertence a `components/`.

## Condição de sucesso — a barra que o agente persegue em LOOP (antes da revisão humana)

Um comp **não desce pra revisão humana "no meio do caminho"**. O agente itera
sozinho até passar um auto-check. **Cruze cada comp de COMPONENTE isolado** contra o
recorte real correspondente (header×header, card×card) — diff barato e inequívoco — e
só depois cruze os comps de **página** (composição: seções na ordem certa). A barra é
o equilíbrio de **paridade** + **modernização**:

**A. Paridade com o site atual** — cruzar o comp contra os **screenshots reais**
(em `<kit>/reference/`), não decidir de memória:
- mesmas **seções principais**, na mesma ordem (hero, prateleiras, sidebar de
  filtros, buy-box, etc.);
- mesma **estrutura de fundo por região** — confirmada por screenshot (ex.: chrome
  escuro vs. conteúdo claro; uma PLP escura ou clara é fato a verificar, não a supor);
- **assets reais usados onde existem** — é **erro emular** um banner/logo/imagem de
  produto que já foi baixado em `<kit>/assets/`. Placeholder só onde o asset
  genuinamente não existe (e mesmo aí, estilizado para parecer intencional);
- cor/tipo/raio/microcopy puxando dos papéis do kit e batendo com o real.

**B. Modernização (litheme)** — aplicar os padrões melhores do litheme (drawer
mini-cart, sticky buy-box, hover de card, grid responsivo, container fluido) **sem
quebrar A**. Cada modernização é uma **decisão consciente registrada**, não um acidente.

**C. Pureza de token** — só `--bk-*` (sem hex solto; utilitário translúcido
justificado é exceção anotada).

**D. Responsivo** — desktop **e** mobile sem quebra.

### O loop (executar até passar)
1. **Capturar a página real** → baseline em `reference/`.
2. Montar/ajustar o comp.
3. **Screenshot do comp** (preview) — servido no **caminho real** do arquivo, p/ os
   links relativos (`../tokens.css`, `_shared.css`) resolverem.
4. **Diff contra a baseline**: liste TODA divergência (seção faltando, fundo errado,
   asset falso, cor fora do papel, microcopy).
5. Para cada divergência: **corrigir**, OU registrá-la como **decisão consciente**
   (modernização deliberada — ex.: padronizar a cor de preço que o site usa
   inconsistente — ou limitação de dado — ex.: produto sem imagem) **com o porquê**.
6. Repetir até a lista de divergências **injustificadas = 0**.
7. **Só então** revisão humana — apresentando também a lista de decisões conscientes.

> Diferença do site atual só é aceitável se for (a) modernização deliberada ou
> (b) limitação de dado. Tudo mais é erro a corrigir antes do humano ver.

### Receita de preview dos comps (verificado — ambiente Claude Code)  ✅
Como **renderizar e screenshotar** os comps para rodar o loop (o ponto que mais
trava). Neste ambiente, dois caminhos óbvios **não funcionam**:
- **Chrome MCP** (`mcp__Claude_in_Chrome`) **bloqueia `localhost`, `127.0.0.1` e
  `file://`** ("Navigation to this domain is not allowed"). Serve só para o **site
  de origem** (capturar a baseline real), não para os comps locais.
- **Preview MCP com `python -m http.server`** falha no sandbox
  (`PermissionError` em `os.getcwd()` / import). Idem qualquer launch Python que
  toque o cwd.

**O que funciona** (use isto):
1. Escreva um **servidor estático em Node** (sem depender de cwd), ex. `/tmp/serve.js`,
   com `root = <kit>/` e um **302 de `/` → `/comps/pages/home.html`**. O redirect é o
   pulo do gato: assim o browser fica em `/comps/pages/home.html` e os relativos
   (`../_tokens.css`, `../../tokens.css`, `../../assets/...`) **resolvem**. (Servir o
   comp na raiz `/` quebra os relativos → 404 → comp sai **sem estilo**.)
2. `.claude/launch.json` → `{runtimeExecutable:"node", runtimeArgs:["/tmp/serve.js"], port:N}`.
3. `preview_start` → pega o `serverId`.
4. `preview_resize` (`desktop` e depois `mobile` 375) + `preview_screenshot`.
5. Navegar entre superfícies com `preview_eval("location.href='/comps/pages/plp.html'")`
   e screenshotar cada uma. (`preview_screenshot` fotografa a página atual.)

> **Gotchas verificados (caso real):**
> - **`preview_start` pode REUSAR um server morto/antigo** de outra sessão (porta
>   diferente, root diferente) → você screenshota conteúdo **stale**. Sempre
>   **confirme o que está servido** antes de confiar no pixel:
>   `preview_eval` → `({url:location.href, title:document.title, marker:<algo do seu comp>})`.
>   Se vier conteúdo errado, deixe o server morrer e `preview_start` de novo (vem `reused:false`).
> - **`preview_resize` nem sempre cola** a 1ª vez (cai em "native size" estreito);
>   re-aplique com `width/height` explícitos e confirme via `window.innerWidth`.
> - **`preview_screenshot` às vezes não captura regiões muito abaixo** (footer) mesmo
>   após `scrollTo`. Fallback: **verifique o render por DOM** —
>   `getComputedStyle()` / `getBoundingClientRect()` (cor, nº de colunas, bbox) é
>   prova mais forte que o pixel para o auto-check.
> - **`style="grid-template-columns:…"` inline num componente responsivo VENCE o
>   `@media`** → o grid fica fixo no mobile. Não inline colunas de grid em componente
>   que deve responder; deixe a classe (`.shelf` 4→2) governar.

> **Captura da baseline real:** o `save_to_disk` do Chrome MCP grava **fora** do FS
> do agente — os PNGs do site de origem **não** arquivam em `reference/`. Baixe as
> **imagens reais do CDN** (banners/produtos) via `curl` e **descreva as telas** num
> `reference/README.md` (que vira a baseline textual do diff). Ver a skill A.

## Regras de fidelidade (para o comp ser um bom alvo de QA)

1. **Construa com a estrutura do litheme, não com CSS arbitrário.** Use os mesmos
   papéis (display/heading/body/mono), os mesmos tokens (`--bk-*` do kit) e a
   mesma anatomia de componente (product-card com mídia + faixa de dados, header
   em grid, minicart drawer). Assim o diff contra o preview é significativo.
2. **Reuse os tokens do kit** via `_tokens.css` (que importa `../tokens.css`). Nada
   de hex hardcoded no comp — se precisou de uma cor de MARCA nova, ela falta no kit.
   Exceções que NÃO são "cor faltando" (e portanto OK, mas anote): **branco/preto de
   contraste** (use o papel quando existir — `var(--bk-ink-inverse)` p/ texto sobre
   chrome escuro — e `#000`/`#fff` só quando for paridade literal com o original),
   **brancos translúcidos** (`rgba(255,255,255,.1)` p/ hairline sobre fundo escuro) e
   **strokes de ícone inline em SVG**.
3. **Respeite os guardrails** (`../shared/litheme-capabilities/`): nº de seções
   (`maxItems`), componentes existentes, dados via funções. O comp não promete o
   que a B não implementa barato.
4. **Marque os pontos de dado.** Onde o conteúdo vem de função (`get_products`
   etc.), use placeholders claros (ex.: `data-source="get_products"`) para a B
   saber onde plugar dado real.
5. **Estável para diff.** Use os mesmos `data-testid` que o smoke test da B espera
   (ex.: `li-shelf-item`, `li-product-buy`, `li-minicart-item`) quando o comp
   representa essas superfícies — assim a verificação ancora em DOM, não em pixel.
6. **Use os assets REAIS do kit.** Hero/banners → `../assets/imagery/...`; cards →
   imagens reais de produto baixadas no kit; logo → `../assets/logo.png`. Emular um
   asset (gradiente fake no lugar do banner, retângulo cinza onde há foto) é falha
   de paridade. Em lojas LI legadas, as imagens reais de produto estão no HTML
   (`cdn.awsli.com.br/300x300/<x>/<conta>/produto/<id>/...`) — baixe um punhado.
   ⚠️ **Gotcha (LI clássico):** o `<img data-src=...>` costuma trazer só o
   **template** `--PRODUTO_IMAGEM--`; a URL real está no `<img ... src=...
   class="imagem-principal">`. E o CDN tem **proteção de hotlink**: sem
   `-e "https://<loja>/"` (Referer) no `curl`, ele devolve um **placeholder 1×1**
   (parece que baixou, mas é 1 byte de imagem). Sempre passe o Referer e confira o
   tamanho real do arquivo.
7. **Chrome de baixo (footer) é alvo de fidelidade, não rascunho.** O footer real de
   lojas LI costuma ter **mais** do que 4 colunas: **newsletter**, faixa **"Pague com"
   (ícones de pagamento)**, **"Selos" (selos de confiança/SSL/avaliações)** e a
   **atribuição da Loja Integrada**. ⚠️ Lição (3º caso): o comp de footer saiu
   simplificado (só 4 colunas + barra) e a B, casando com ele, **perdeu** payment-icons/
   newsletter/selos que existiam no site e no litheme — e deixou a atribuição LI como uma
   barra branca destoante. Capture o footer **inteiro** da baseline e materialize-o; marque
   a atribuição LI como **integrada ao layout** (mesma faixa escura), não um bloco solto. Se
   algum elemento (selos/pagamento) vem de settings/função, marque o ponto de dado (regra 4).

## Como apresentar para aprovação (Fase 4)
- Renderizar cada comp (preview tools / navegador) e mostrar screenshots
  desktop **e** mobile.
- Destacar as decisões de commerce que cada comp materializa.
- Colher aprovação **explícita** antes de entregar para a Skill 3.

## Handoff para a Skill 3
Os comps + o bloco `commerce` no kit são o pacote de design. A B:
1. lê as decisões e os comps;
2. implementa no litheme (Liquid + tokens);
3. **verifica o preview ao vivo contra os comps** (asserts de DOM + diff de
   screenshot), além das suas redes de QA (audit, smoke, regressão).
