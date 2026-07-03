# Superfícies de conteúdo — o catálogo de paridade (home, nav, rodapé)

As superfícies que **não são uma decisão de commerce** (essas estão em
`commerce-surfaces.md`: minicart, PLP, PDP) mas que **carregam paridade** com o
site-fonte: **header/topbar, navegação, home e rodapé**, mais os
**comportamentos globais** e os **componentes de apps de terceiros**. É aqui que o
último teste passou batido — o agente reproduziu o que saltava aos olhos (hero,
prateleira) e perdeu o que é estrutural mas discreto (profundidade do menu, selos
do rodapé, dados legais).

> **Por que esta reference existe.** PLP/PDP funcionaram porque têm uma **matriz
> que força enumeração**. Home/nav/rodapé não tinham — eram "olhados no
> screenshot". Este arquivo é o **catálogo canônico** (o *prompt* que obriga a
> procurar cada bloco), **ancorado no litheme real**, e a saída preenchida vai para
> o **inventário de migração** (instância desta loja).

## Os dois eixos que esta reference cobre (e o que ela NÃO cobre)

O inventário enumera os eixos que um **screenshot não prova**:

- **Funcional** — comportamento/capacidade (mega-menu no hover, autocomplete na
  busca, frete por CEP, popup de cupom). Não tem assinatura num PNG estático.
- **Conteúdo** — os **blocos** que precisam existir (faixa de USP, prova social,
  selos do rodapé, dados legais). ⚠️ **A copy/microcopy de faixa que existe no fonte
  (texto de USP, benefícios, banners, CTAs de seção) é CONTEÚDO A MIGRAR LITERAL** —
  entra no inventário como item de conteúdo com a copia exata do fonte na `evidence`,
  **não é redigida do zero pelo agente**. A voz do kit só preenche o que o fonte
  genuinamente **não** tem. Reescrever a copy de uma faixa que já existe ("Distribuidor
  oficial…" no lugar de "Envio digital em até 1 hora · Pague com o PIX…") é divergência.

O terceiro eixo, **estilo de marca**, **não** entra no inventário: ele continua
coberto pelo **loop de diff visual** de `comp-authoring.md`. Inventário + diff
visual = paridade tripla, sem sobreposição.

## Os TRÊS BALDES DE ESFORÇO (a decisão central, ancorada no litheme)

Toda paridade só vale se comparada ao que o litheme **já resolve**. O balde mede
**esforço/risco**, não "o que preferir". ⚠️ **Não confunda "o litheme tem um nativo" com
"use o nativo as-is":** ter um componente nativo torna o reskin *possível*, mas **forkar a
estrutura para casar o comp é o default** (o valor do LI Render). Classifique cada item:

| Balde (`litheme_support`) | O que é | Decisão típica (`decision`) |
|---|---|---|
| **`native`** | Componente/partial/webc existe **e o comp é próximo do nativo** (ou é um dos 3 preserve-native) | `migrate` (espelha o nativo) ou `modernize` |
| **`native-restructure`** | Base nativa existe, mas o comp **reestrutura** (header em grid próprio, footer em colunas próprias, PDP em zonas próprias) | `modernize` **ou** `build-custom` (reestruturação real) |
| **`none`** (sem suporte nativo) | Litheme não tem **ou** o nativo não reproduz o COMPORTAMENTO/estrutura do comp | `build-custom` (construir substituto/extensão) **ou** `drop` (c/ rationale) |
| **`app-section`** | Injeta via um dos **4 ganchos `{% appsection %}`** do litheme | `migrate` se há app LI equivalente; senão `build-custom` ou `drop` |
| **`store-app`** | App de loja **fora do tema** (painel/script): WhatsApp, chat, pixel, alguns apps de review/Instagram | `reintegrate-app` (reinstalar/configurar no painel, fora do tema) ou `drop` |

> 🔒 **Forkar é o default; preservar o nativo é a exceção (3 componentes).** Reestruturar é
> normal e barato no LI Render — não trate `native`→`migrate` como o caminho preferido por ser
> "seguro". **Só 3 componentes saem `native`→`migrate` por default** (comportamento de conversão
> que recriar quebra): **mini-cart** (desconto progressivo/frete-grátis/cupom/CEP), **prévia de
> busca ao vivo/autocomplete** (prateleira + sugestões), **filtros de busca** (filtros nativos; só
> mudam sob pedido explícito). **Header, footer, PDP/buy-box, product-card, seções de home, layout
> da PLP → o default é `native-restructure`/`build-custom`** sempre que o comp diverge do nativo —
> e ele quase sempre diverge. Marcar esses `native`/`migrate` faz a Skill 3 ficar **presa no
> layout nativo** (footer com colunas nativas; PDP com descrição full-width) — o anti-padrão que
> este balde existe para evitar.

> **A regra que o usuário articulou.** Qualquer item que **não** seja um dos 3 preserve-native
> e cujo comp diverge do nativo **deve** ir para `native-restructure`/`build-custom` — o agente
> escolhe explicitamente **(i)** reestruturar/construir para casar o comp, ou **(ii)** cortar do
> escopo (`drop` c/ rationale). Nunca "deixar acontecer" reskinando o nativo por acidente. O caso
> clássico é o **menu** (ver exemplo abaixo).

### Exemplo trabalhado — Menu (por que comportamento decide o balde)

O menu nativo (`header/components/menu/index.liquid`) itera `data.categories`
(`get_category_tree`) e monta um **mega-menu com a árvore INTEIRA de categorias**.
Logo:
- Loja-fonte com nav = a árvore de categorias → **`native`** (reskin).
- Loja-fonte com nav **curada** (só algumas categorias, e/ou links fora da árvore —
  "Ofertas", "Blog", "Lançamentos" que não são categoria) → o nativo **não faz
  isso** → **`none` → `build-custom`** (nav própria que escolhe itens) ou `drop` da
  curadoria (aceitar a árvore inteira). Decisão consciente, registrada.

## O inventário nativo do litheme (verificado — `litheme-ref`, conta de testes)

O que o `theme create` já entrega pronto (apenas reskinar). Use como gabarito do
balde `native`:

- **Header/nav**: `header/index.liquid` (logo + busca + conta + cart), `menu`
  (mega-menu + árvore via `get_category_tree`), `navbar` (drawer mobile + partial
  `header/menu-mobile`), `search` (input desktop / drawer mobile + autocomplete via
  `search-autocomplete.webc` + partials `search/suggestions` e `most-searched`),
  `segmented-price` (preço por CEP), `floating-bar` (gatilhos fixos mobile),
  `minicart` (drawer + `free-shipping-alert` = **barra de frete-grátis progressiva**
  + `shipping-calculator`).
- **Home (`index.json`)**: `banner/stripe` (**faixa de aviso topo**), banners
  (`get_banners` posições full/stripe/showcase/mini = hero + secundários),
  **3 shelves** (`get_products` presets Highlights/Newest/BestSelling).
- **Rodapé (`footer/container.liquid` + `copyright.liquid`)**: coluna
  **Institucional** (`get_institutional_pages`), coluna **Categorias**, coluna
  **Contato/SAC** (HTMX → `/partial/components/sac`), **Newsletter bar**, **Social**,
  **bandeiras de pagamento** (`footer/payments`), **Certificados de segurança**
  (SSL + Google Safe Browsing) + gancho `{% appsection footer_stamps %}`, **dados
  legais** (razão social + **CNPJ/CPF** + endereço) e **atribuição Loja Integrada**
  (já nativa — *não* há "desenvolvido por plataforma antiga" a trocar).
- **Globais**: cookies LGPD (`alert/cookies-accept` + `cookie-alert.webc`),
  **newsletter popup** (`newsletter/popup`), reviews, recommendations, buy-together,
  notify-me, coupon, favoritos/wishlist (`product-favorites.webc`).
- **Apps de 3os (ganchos nativos)**: só **4** `{% appsection %}`: `footer_stamps`
  (selos/reputação no rodapé), `shelf_after_product_title`, `after_product_title`,
  `after_product_description` (PDP). Fora desses → `store-app` ou `build-custom`.

> Detalhe técnico profundo do litheme (arquivos, dados, gotchas) vive em
> `../../li-render-store-builder/references/litheme-structure.md` — a fonte da
> verdade da Skill 3. Aqui é o resumo de **capacidade por superfície**.

## O artefato: `migration-inventory.json` (+ `INVENTORY.md`)

Saída desta fase, gravada **na pasta do kit** (não no repo da skill), ao lado de
`comps/` e `brand.kit.json`:

- `<kit>/migration-inventory.json` — contrato máquina-checável (a Skill 3 consome).
- `<kit>/INVENTORY.md` — projeção legível, apresentada no gate humano (Fase 5).

**Schema de um item** (granularidade: **um item = um bloco/capacidade** que um PO
nomearia — alvo ~30–60 itens, não centenas de elementos):

```jsonc
{
  "id": "footer.seal.payment",          // slug estável surface.grupo.nome
  "surface": "header|nav|home|footer|global|app",
  "axis": "functional|content",          // estilo NÃO entra aqui (vai no diff visual)
  "label": "Bandeiras de pagamento + Pix/boleto",
  "evidence": "reference/footer.png; rodapé col. 4",  // PROVA, não memória
  "priority": "must|should|optional",
  "litheme_support": "native|native-restructure|none|app-section|store-app",
  "decision": "migrate|modernize|build-custom|reintegrate-app|drop",
  "rationale": "",                       // OBRIGATÓRIO se decision ∉ {migrate}
  "behavior": null,                      // functional: "abre no hover", "CEP→frete"
  "data_source": null,                   // se vem de função (get_products, get_category_tree…)
  "target": "comps/components/footer.html",  // comp + componente que materializa
  "status": "todo|present|dropped"       // preenchido no loop do comp / re-checado pela Skill 3
}
```

> Itens de PLP/PDP/minicart **apontam** (`target`) pro bloco `commerce` do kit —
> não duplicam a decisão de design, só registram que existem e precisam migrar.

## Priority — o que define `must`

- **`must`** — perder vira **regressão de conversão, confiança ou legal**: busca,
  árvore de categorias, minicart, parcelamento exibido, selos de pagamento/segurança,
  **razão social + CNPJ** (esperado/legal no BR; nativo no rodapé).
- **`should`** — importa pra experiência/marca: prova social, banner editorial,
  feed de Instagram, faixa de USP.
- **`optional`** — bom ter: blog, badges de app, marcas/parceiros.

## Decision — paridade vs. modernização vs. construir

- **`migrate`** — usa o nativo, só reskina.
- **`modernize`** — preserva a capacidade, **melhora a forma** (camada de qualidade
  do benchmark: elimina débito de usabilidade, padroniza). Em `native`/`native-restructure`.
- **`build-custom`** — constrói componente novo (substitui/estende o nativo, ou
  inexistente). Exige `rationale`. ⚠️ **`build-custom` REPRODUZ o bloco real do
  fonte — não INVENTA um "equivalente moderno".** É "construir custom porque o
  litheme não tem nativo", **não** "criar uma seção nova que o fonte não tem". A
  faixa custom carrega a **mesma estrutura, a copy LITERAL, os banners/assets reais
  e o comportamento** daquela faixa no site-fonte. Inventar uma faixa que o fonte
  não tem (ex.: trocar uma grade de banners de marca por um mosaico autoral) =
  **falha de paridade**.
- **`reintegrate-app`** — app de loja, fora do tema (reinstalar/configurar no painel).
- **`drop`** — remoção consciente, exige `rationale`.

> **Gate = só alerta, nunca bloqueia.** Nenhum bloqueio programático: o **único
> portão é a aprovação humana** (Fase 5), coerente com o resto do kit. O inventário
> é instrumento de **visibilidade**: no gate, apresente um **relatório de paridade**
> com os itens `must` dropados/faltando **destacados no topo**, e a lista de
> `build-custom`/`reintegrate-app` (esforço extra que o cliente assume). A Skill 3
> reporta paridade por superfície no preview ao vivo e destaca lacunas `must`; também
> não hard-blocka.

## Como inventariar (Fase 2 da Skill 2)

Passo **estrutural** sobre o site-fonte, com lente de *capacidade/conteúdo* (não de
cor — isso a Skill 1 já fez):

1. **Trabalhe a partir do baseline renderado** `<kit>/reference/*.bands.json` (+ `*.full.png`,
   `*.rendered.html`) **+ `<kit>/assets/`**. O `bands.json` já é a estrutura faixa-a-faixa em
   ordem (com modo e conteúdo); o `full.png` é o visual. **Reabrir o site-fonte é EXCEÇÃO** — mas
   se o baseline **não existir**, não improvise a partir de HTML cru: rode o
   `../../brand-kit-extractor/scripts/capture-source.mjs` para gerá-lo (é o gap da Skill 1 a
   apertar). Se você se pegar lendo `curl`/HTML cru ou escrevendo uma descrição de tela como se
   fosse baseline, **pare** — é exatamente a brecha que perde faixas injetadas por JS.
2. **Detecte por plataforma.** Cada plataforma de origem tem tells (blocos padrão,
   classes, **scripts de app de 3os** no `<head>`/fim do `<body>`). Use
   `../../brand-kit-extractor/references/platforms/*` como pistas — inclusive para
   achar os `store-app` (whatsapp, chat, pixel, review) pelos domínios/scripts.
3. **Varra cada matriz abaixo**, superfície por superfície. Para cada linha: existe
   no fonte? → registre item com `evidence` (prova, **não memória**), `priority`,
   `litheme_support` (classifique no balde!), `decision`, `target`.
4. **Não invente nem drope em silêncio.** Ausência é uma decisão (`drop` + rationale),
   não um esquecimento. Item não-nativo é uma decisão (`build-custom` vs `drop`).
   **`build-custom` não é licença para inventar:** a faixa custom reproduz o bloco
   real (estrutura + copy literal + assets reais + comportamento), não um equivalente
   autoral. Faixa no inventário/comp que **não existe no fonte** (sem `evidence`) só
   se vier como **modernização consciente registrada** — senão é paridade quebrada.

---

## Matriz — Header + Topbar (chrome global)

| Bloco / capacidade | Eixo | Priority | litheme | Detecção / paridade |
|---|---|---|---|---|
| Faixa de aviso (topo) | content | should | `native` (`banner/stripe`) | frete grátis>X, cupom, contagem; rotativa? |
| Logo | content | must | `native` (header) | variante clara/escura por fundo |
| Busca + autocomplete | functional | must | `native` (`search` + `search-autocomplete.webc`) | posição; **sugestões/mais-buscados** nativos |
| Conta / login | functional | must | `native` (header) | "entre ou cadastre-se", meus pedidos |
| Favoritos / wishlist | functional | should | `native` (`product-favorites.webc`) | confirmar se o header do fonte expõe |
| Minicart (ícone+contador) | functional | must | `native` (drawer) | **design** detalhado em `commerce-surfaces.md` |
| Preço/frete por CEP | functional | should | `native` (`segmented-price`) | exibe no header do fonte? |
| Atendimento / WhatsApp no header | functional | optional | `store-app` | ver matriz de apps |

## Matriz — Navegação / Menu

| Bloco / capacidade | Eixo | Priority | litheme | Detecção / paridade |
|---|---|---|---|---|
| Nav = árvore de categorias | functional | must | `native` (`menu` + `get_category_tree`) | mega-menu nativo com a árvore inteira |
| Nav **curada** (subset + links não-categoria) | functional | must | `none` → `build-custom`/`drop` | "Ofertas"/"Blog"/"Sale" fora da árvore (ver exemplo do menu) |
| Profundidade da árvore | content | must | `native` | depto→cat→subcat; **não achatar** sem decisão |
| Banner/imagem no mega-menu | content | optional | `native-restructure` | merchandising dentro do dropdown |
| Drawer mobile | functional | must | `native` (`navbar` + `header/menu-mobile`) | hambúrguer + acordeão + busca no topo |

## Matriz — Home

| Bloco / capacidade | Eixo | Priority | litheme | Detecção / paridade |
|---|---|---|---|---|
| Hero / banner principal | content | must | `native` (`get_banners` full) | slider (autoplay? nº slides? CTA) |
| Banners secundários | content | should | `native` (`get_banners` showcase/mini) | split de banners |
| Vitrines / prateleiras | content | must | `native` (`shelf` + `get_products`) | mais vendidos/lançamentos/ofertas; carrossel vs grid |
| **Faixa de USP / benefícios** | content | must | `none` → `build-custom` | os "4 ícones": frete/parcelas/troca/segurança — **sem nativo**; o mais esquecido |
| Entrada de categorias / coleções | content | should | `none` → `build-custom` (ou banners showcase) | departamentos com imagem |
| Banner editorial / lookbook | content | should | `none` → `build-custom` (ou banner) | split imagem+texto, storytelling |
| Prova social (depoimentos/reputação) | content | should | `none`/`store-app` | Reclame Aqui/Ebit costumam ser app |
| Feed Instagram / shoppable / UGC | content | should | `store-app`/`none` | app externo no fonte? |
| Newsletter / captura de email | functional | should | `native` (`newsletter/bar`/`subscribe`) | **cupom 1ª compra**; inline vs popup |
| Blog / conteúdo em destaque | content | optional | `none` → `build-custom`/`drop` | últimos artigos |
| Marcas / parceiros | content | optional | `none` → `build-custom`/`drop` | grid de logos |
| Contador de oferta / flash sale | functional | optional | `none` → `build-custom`/`drop` | countdown ativo? |

> **Lição (caso real): a home é uma TORRE de faixas — enumere do `bands.json`, não de
> amostragem nem do HTML cru.** O erro recorrente é varrer hero → 1ª vitrine → rodapé e
> declarar a home mapeada, pulando o **miolo**. As faixas que mais escapam (todas `should`/
> conteúdo, fáceis de não ver num screenshot do topo — e **invisíveis no `curl`** quando
> injetadas por JS): **tarja de aviso do topo**, **faixa de USP** (4 ícones), **grade de
> banners de categoria/promo** (+ "Confira"), **bloco editorial "quem somos"**, e as
> **várias vitrines por categoria** (Mais Vendidos, Destaques, Xbox, Promoção, Outros…) — quase
> nunca uma só. **Método (já feito pela Skill 1):** o `capture-source.mjs` rolou a home inteira
> forçando lazy-load e gravou **cada faixa em ordem no `bands.json`** — percorra-o item a item.
> ⚠️ **Afirmar que uma faixa NÃO existe (`drop`) exige que ela não esteja no `bands.json`** — um
> `grep` no HTML que deu 0 **não** prova ausência (o anti-padrão real: a tarja e a faixa de USP
> foram dropadas como "inexistentes" porque o grep não as achou; o render mostrava as duas).

## Matriz — Rodapé (quase tudo nativo — verificado)

| Bloco / capacidade | Eixo | Priority | litheme | Detecção / paridade |
|---|---|---|---|---|
| Colunas institucionais | content | must | `native` (`get_institutional_pages`) | Sobre, **políticas troca/devolução/privacidade**, FAQ |
| Coluna de categorias | content | should | `native` | árvore no rodapé (SEO) |
| Atendimento / SAC | content | must | `native` (partial `components/sac`) | tel, email, WhatsApp, horário, endereço |
| Newsletter (barra) | functional | should | `native` (`newsletter/bar`) | captura de email |
| Redes sociais | content | should | `native` (`footer/social`) | links sociais |
| **Formas de pagamento** | content | must | `native` (`footer/payments`) | cartões, Pix, boleto |
| **Selos de segurança** | content | must | `native` (SSL + Google Safe Browsing) | já vêm 2 selos; mais via app |
| Reputação (Reclame Aqui/Ebit) | content | should | `app-section` (`footer_stamps`) | gancho nativo p/ selos de app |
| **Dados legais (CNPJ/endereço)** | content | must | `native` (`copyright`) | razão social + CNPJ + endereço — **nativo** |
| Atribuição Loja Integrada | content | must | `native` (`copyright`) | **já é LI** — nada a trocar |
| Badges de app (App/Play) | content | optional | `none` → `build-custom`/`drop` | loja tem app? |
| Back-to-top | functional | optional | `none` → `build-custom`/`drop` | voltar ao topo |

## Matriz — Comportamentos globais (cross-cutting)

| Bloco / capacidade | Eixo | Priority | litheme | Detecção / paridade |
|---|---|---|---|---|
| Cookie consent / LGPD | functional | must | `native` (`alert/cookies-accept`) | obrigatório/esperado BR |
| Popup de newsletter / cupom | functional | should | `native` (`newsletter/popup`) | exit-intent? cupom 1ª compra? |
| Barra de frete grátis progressiva | functional | should | `native` (minicart `free-shipping-alert`) | "faltam R$X p/ frete grátis" |
| Calculadora de frete (CEP) | functional | should | `native` (`shipping-calculator`) | no minicart e/ou PDP |
| Vistos recentemente | functional | optional | `none` → `build-custom`/`drop` | histórico de produtos |

## Matriz — Apps de terceiros (fora do balde nativo)

Componentes injetados por **app externo** no fonte. O litheme tem só 4 ganchos
`{% appsection %}`; o resto é app de loja (painel/script), fora do tema.

| Componente | Priority | litheme | Decisão típica |
|---|---|---|---|
| Selos de reputação (Reclame Aqui, Ebit, RA1000) | should | `app-section` (`footer_stamps`) | `migrate` se há app LI; senão `build-custom`/`drop` |
| WhatsApp flutuante | should | `store-app` | `reintegrate-app` (painel/script) ou `build-custom` |
| Chat / atendimento (Jivo, Tawk, Zendesk) | optional | `store-app` | `reintegrate-app` ou `drop` |
| Feed Instagram / UGC shoppable | should | `store-app`/`none` | `reintegrate-app` ou `build-custom` |
| Avaliações por app (Yotpo, etc.) | optional | `store-app`/`native` reviews | preferir reviews nativo; senão `reintegrate-app` |
| Analytics / pixels / GTM | must | `store-app` | `reintegrate-app` (config de loja, **não** tema) |
| Recomendação por app (IA) | optional | `native` recommendations/`store-app` | preferir nativo; senão `reintegrate-app`/`drop` |

> Os `store-app` raramente são "tema": registre-os no inventário para **não sumirem
> em silêncio** na migração (sobretudo analytics/pixel = `must`), mas a execução é
> **configuração de loja**, fora do escopo de implementação da Skill 3.

---

## Saída desta reference

1. `<kit>/migration-inventory.json` preenchido — todas as superfícies acima
   varridas, cada item com `priority/litheme_support/decision/target/status`.
2. `<kit>/INVENTORY.md` gerado a partir do JSON, para o gate humano (com os baldes
   `build-custom`/`reintegrate-app`/`drop` destacados = esforço/risco que o cliente assume).
3. Cada item `must`/`should` vira alvo de cobertura nos comps (Fase 4): aparece no
   comp **ou** é `drop`/`reintegrate-app` consciente com `rationale`. Condição de
   sucesso do loop = **0 item não-contabilizado** (nunca "0 item faltando" como bloqueio).
4. Handoff à Skill 3: o inventário é o **contrato de migração** — a Skill 3 reskina
   o `native`, implementa o `build-custom`, e reporta paridade por superfície no
   preview ao vivo, destacando lacunas `must`.

> **Mapeamentos verificados** contra o litheme real (`litheme-ref`, conta de testes,
> CLI `20260519.2`). Re-checar ao subir uma versão maior do litheme — os ganchos
> `{% appsection %}` e o inventário nativo do rodapé são os pontos mais sujeitos a mudar.
