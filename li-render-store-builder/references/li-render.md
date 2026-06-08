# LI Render — CLI e Renderizador (notas de referência)

> Material-base levantado a partir da doc oficial em
> `https://ora-lingerie-preview.lojas.li/.docs/` (espelhada na loja preview da Ora).
> Fonte de verdade para construir a skill de implementação de loja na Loja Integrada.

## Modelo mental

A Loja Integrada renderiza temas via **LI Render**. Um **tema** é "theme-as-code":
templates Liquid + JSON de configuração de páginas + assets, versionados e
gerenciados pela CLI `li-cli`. Fluxo: criar tema no servidor → baixar → editar
local → sincronizar/publicar.

O contrato é **declarativo**, o que o torna bom alvo para um agente:
- páginas descritas em **JSON** (rota + dados + árvore de componentes),
- dados vindos de **funções nomeadas** (`get_products`, etc.),
- apresentação em **Liquid** (`.liquid`) com filtros/tags customizados.

---

## 1. CLI (`li-cli`)

### Instalação (binário único por SO)
- Linux:   `https://cdn.awsli.com.br/public/render/cli/latest/linux/li-cli`
- macOS:   `https://cdn.awsli.com.br/public/render/cli/latest/macos/li-cli`
- Windows: `https://cdn.awsli.com.br/public/render/cli/latest/windows/li-cli.exe`

macOS/Linux:
```
mv li-cli /usr/local/bin/li-cli
chmod +x /usr/local/bin/li-cli
li-cli --version
```
Windows: mover p/ `%USERPROFILE%\li-cli\`, adicionar a pasta ao PATH, reabrir terminal.

> **Verificado (macOS arm64):** o binário macOS é Mach-O nativo arm64 (~23MB).
> Se `/usr/local/bin` não existir/não for gravável, instalar em `/opt/homebrew/bin`
> (existe e é gravável sem sudo em Macs Apple Silicon com Homebrew) — fica no PATH.

### Comandos
| Comando | Função |
|---|---|
| `li-cli login` | Abre browser, autentica, salva token local |
| `li-cli theme create [nome]` | Cria tema no servidor (duplica o padrão `litheme`) |
| `li-cli theme pull [nome]` | Baixa arquivos do tema p/ local |
| `li-cli theme push [nome]` | Sobe alterações locais |
| `li-cli theme sync [nome] -r` | Watch + sync contínuo; `-r` = live-reload via WebSocket |
| `li-cli theme promote [nome]` | Publica o tema em produção |
| `li-cli theme deploy [nome] -t [alvo]` | Copia tema (com otimização). `--global` publica como tema global (exige `--display-name`, permissão de vendor, `-t/--target`; **não** incluir prefixo `@vendor/`) |
| `li-cli theme list` | Lista temas |
| `li-cli theme delete / remove [nome]` | Remove tema |
| `li-cli theme rollback [nome]` | Reverte p/ versão anterior |
| `li-cli theme update` / `li-cli update` | Atualiza CLI/tema |

### Flags reais (verificado, CLI `20260519.2`)
- `login`: `--slug <slug>` ou `--store-id <id>` (sem flag → escolha interativa).
  O slug costuma ser o subdomínio do preview (`{slug}-preview.lojas.li`). Abre o
  navegador; imprime "Login successful! Active store: <slug> (<id>)".
- `theme pull/push/sync`: `-p, --path <dir>` (default `./{nome}`).
- `sync`: `-r, --reload` (recarrega até 5 clientes), `-i, --interval <1-10>` seg.
- `promote`: `-f, --force` (pula confirmações de promote e A/B).
- `list`: `-e, --env <development|production>` (default development).

### Gotchas de execução real (importantes para automação)
- **`theme push` é interativo** (pede `[y/n]` e mostra um diff). Recusa stdin
  canalizado ("Failed to read input in non-interactive mode") — precisa de **TTY**.
  Para automatizar: rodar dentro de um PTY (ex.: `pty.fork()` em Python) e enviar
  `y\n` ao ver "proceed". `sync` **não** pede confirmação.
- **`sync` só envia em mudança de arquivo** ("Save files to sync them"). Não faz
  upload retroativo do estado atual. Para o **upload inicial** (especialmente
  assets binários novos como fontes/logos), use `push` (ou regrave os arquivos
  depois de iniciar o sync). Fluxo recomendado: 1º `push` (sobe tudo), depois
  `sync -r` para iterar com live-reload.
  - **Detecta por conteúdo, não por mtime:** `touch` (só atualiza mtime) **não**
    dispara o watcher. Para forçar o envio de um arquivo já editado *antes* do
    sync subir, faça uma **reescrita de conteúdo real** (rebuild do CSS p/
    `theme.min.css`; uma linha em branco no fim p/ liquids; ou edite e salve).
  - **`-p .`**: o sync usa `--path ./{nome}` por default; se você roda de dentro
    da pasta do tema, passe `-p .` (senão ele procura `./{nome}/{nome}`).
- **`package.json` não vem no pull** — criar antes do `npm install` (conteúdo no
  topo de `assets/style/theme.css`; ver `litheme-structure.md`).
- **Preview é autenticado por sessão de navegador.** `curl`/WebFetch na URL de
  preview retornam a **página de login do painel** (HTTP 200, mas é o admin). Para
  verificar de verdade, use um navegador logado no painel (o mesmo do `li-cli
  login`) — ex.: dirigir o Chrome conectado e navegar à URL do preview. O toolbar
  "Tema atual: <nome>" no canto confirma qual tema está sendo previsto.
- **`build:css` real:** `npx @tailwindcss/cli -i assets/style/theme.css -o
  assets/style/theme.min.css --minify` (Tailwind v4 + DaisyUI v5).
- **Sessão expira.** Depois de um tempo, `push`/`sync` falham com "Session
  expired or unauthorized. Please login again." → rodar `li-cli login` de novo.
  Cuidado: o fluxo de login pode **reusar a aba do navegador conectado**, levando-a
  p/ a página de login do painel — e o preview é autenticado por sessão, então
  depois do re-login o usuário precisa **logar no painel no navegador** p/ a URL de
  preview voltar a renderizar (senão ela redireciona pro login). Reabra a aba do
  preview após autenticar.

### Workflow de desenvolvimento
```
li-cli login --slug minha-loja
li-cli theme create meu-tema
li-cli theme pull meu-tema --path ./meu-tema
cd meu-tema
# criar package.json (ver litheme-structure.md), então:
npm install
npm run build:css                 # build inicial
li-cli theme push meu-tema        # upload inicial (interativo → precisa TTY)
npm run watch:css                 # terminal A: recompila CSS
li-cli theme sync meu-tema -r     # terminal B: sync + live-reload
```
Preview: `https://{loja}-preview.lojas.li/.theme/{nome-do-tema}`
(cache desligado; toolbar de seleção de tema visível só no preview).

### Publicar em produção (deploy → promote) — VERIFICADO

⚠️ **`promote <tema-dev>` direto NÃO funciona** (retorna "Theme does not exist").
O tema de desenvolvimento é "Local"; `promote` só age sobre temas **deployados em
produção**. O fluxo real é em dois passos:

```
li-cli theme deploy <tema-dev> -t <nome-prod>   # cria cópia OTIMIZADA em produção
li-cli theme promote <nome-prod>                # torna esse tema ATIVO na loja
```
Ex. (loja ora): `theme deploy ora -t ora-loja` → `theme promote ora-loja`.
- `deploy` copia pages/templates/assets do dev p/ um tema novo de produção, com
  otimizações; `-t` nomeia o alvo (sem `-t`, gera nome). Sem `--global` é deploy
  normal (não publica como tema global de marketplace).
- `promote` pede confirmação `[y/n]` (e de remoção de A/B test se houver) →
  interativo, precisa TTY/PTY ou `-f/--force`.
- Verifique ao vivo na loja **pública** (não-preview): `https://{loja}.lojas.li`
  (procure as classes/markers do seu tema no HTML). O navegador conectado pode
  bloquear o domínio ao vivo — use `curl` para conferir.

Promover é decisão **explícita do usuário** (publica na loja real). Rode o smoke
test + sweep de regressão ANTES (ver `smoke-test.md`, `visual-regression.md`).

---

## 2. Estrutura do tema

- **CSS**: Tailwind + DaisyUI + `@tailwindcss/typography`, via `@tailwindcss/cli`.
  - `npm run build:css` → minificado em `assets/style/theme.min.css`
  - `npm run watch:css` → recompila em dev
- **Assets**: pasta `assets/`; referenciados por `{% asset_url %}` (CDN + resize).
- **Páginas**: arquivos JSON (`_version: "3"`, com `$schema`).
- **Templates**: arquivos `.liquid`.

---

## 3. Páginas (JSON de page settings)

Atributos:
- `$schema`: `https://cdn.awsli.com.br/public/render/schema/v1.json`
- `_version`: string (`"3"` habilita partials)
- `path`: rota. **Parâmetros dinâmicos usam colchetes** (confirmado no litheme
  real): `"/"`, `"/[product]"`, `"/[category]"`, `"/[brand]"`, `"/[search]"`,
  `"/[institutional-page]"`, ou estática (`/contact-us`). A doc pública mostra
  `{product}` com chaves — está desatualizada. Ver `litheme-structure.md`.
- `global_data`: dados injetados via funções, disponíveis a todos os templates da
  página. Objetos em nível de componente ficam restritos àquele componente.
- `html`: `{ head: { components: [...] }, body: { components: [...] } }`

### Tipos de componente
- **`template`** — renderiza um `.liquid`. Campos: `type`, `template`, `properties`,
  `data`. **Não aninha filhos.**
- **`container`** — agrupa/aninha. Campos: `tag`, `id`, `class`, `style` (opcionais) +
  `components` (obrigatório).
- **`script`** — `<script src=...>` (no `head`).
- **`style`** — `<link href=...>` (no `head`).

### Exemplo (página estática `/lancamentos`)
```json
{
  "$schema": "https://cdn.awsli.com.br/public/render/schema/v1.json",
  "_version": "3",
  "path": "/lancamentos",
  "global_data": {
    "products": { "function": "get_products", "args": { "sort": "news" } },
    "store": { "function": "get_store" }
  },
  "html": {
    "head": { "components": [ { "type": "template", "template": "head_meta.liquid" } ] },
    "body": { "components": [
      { "type": "template", "template": "header.liquid" },
      { "type": "template", "template": "pages/lancamentos.liquid" },
      { "type": "template", "template": "footer.liquid" }
    ] }
  }
}
```

---

## 4. Partials (a partir de `_version "3"`)

Fragmentos HTML (sem `<html>/<head>/<body>`) p/ atualizar trechos sem reload —
casam com HTMX. Path **deve** começar com `/partial/`.

```json
{
  "$schema": "https://cdn.awsli.com.br/public/render/schema/v1.json",
  "_version": "3",
  "partial": {
    "path": "/partial/minicart",
    "components": [
      { "type": "template", "template": "minicart.liquid",
        "data": { "cart": { "function": "get_cart" } } }
    ]
  }
}
```
HTMX:
```html
<div id="minicart" hx-get="/partial/minicart" hx-trigger="cartUpdated from:body">
  {% render 'minicart.liquid' %}
</div>
```
Notas: usar `partial` no lugar de `html`; `component` (singular) quando há só uma
raiz; sem `head`, então não usar `script`/`style`; `global_data` é suportado;
paths não podem conflitar com rotas de página completa.

---

## 5. Store routes (ação + fragmento)

Rotas que executam uma função e renderizam o HTML de um template. Payloads em
`application/x-www-form-urlencoded`. Injetam dados (`store`, `cart`,
`cart_offers_conditions`...) automaticamente.

- `GET  /store/cart`
- `GET/POST /store/cart/item/{product_id}/add`
- `POST /store/cart/item/{product_id}/remove`
- `POST /store/cart/zipcode` — simulação de frete por CEP
- `POST /store/cart/shipping` — seleção de opção de envio
- `POST /store/marketing/newsletter/subscribe`
- `POST /store/catalog/product/{product_id}/notifyme` — avise-me quando chegar
- `POST /store/contact-us`

(Doc nota que o cenário ideal futuro seria um arquivo mapeando rotas→templates,
permitindo múltiplos templates/layouts por rota; hoje é 1 template por rota.)

---

## 6. Funções de dados (~21)

Declaradas no JSON como `{ "function": "<nome>", "args": { ... } }`; resultado
injetado no contexto Liquid.

Catálogo:
- `get_store`
- `get_products` — busca unificada (ver abaixo)
- `get_current_product` — página de produto (id automático; só nessa página)
- `get_current_category`, `get_current_brand`
- `get_products_by_category`, `get_products_by_brand`
- `get_category_tree`
- `get_banners`
- `get_buy_together`, `get_product_recommendations`, `get_product_reviews`
- `get_product_installments`
- `get_payment_conditions`, `get_freight_conditions`
- `get_institutional_page`, `get_institutional_pages`
- `search_products`, `search_products_by_category`, `search_suggestions`
- `get_most_searched`
- `get_cart`

### `get_products` (args)
| Arg | Tipo | Detalhe |
|---|---|---|
| `size` | int | produtos por página (4–100) |
| `page` | int | default 1 |
| `sort` | string | ex. `price:asc`, `units_sold:desc` |
| `q` | string | termo de busca |
| `category` | string | slug ou id |
| `filter` | object | `is_available`, `highlighted`, `product_ids`, `category_ids`, `brand_ids`, `rating_range` |
| `paginate` | bool | `false` retorna tudo numa resposta (presets já desligam) |
| `preset` | string | `HighlightedProducts` / `BestSellingProducts` / `NewestProducts` |

> **⚠️ Shape de retorno (verificado).** `get_products` retorna um **objeto**, não um
> array: `{ "products": [...], "total": N }`. No template, itere `data.<nome>.products`
> (ex.: `data.shelf_result.products`), **não** `data.<nome>` direto. `.size` no objeto
> dá vazio — bug silencioso comum.
>
> **⚠️ `filter` usa valores STRING.** Igual à doc oficial (`"category_ids": "123"`).
> Passar `is_available: "true"`, ids como string.
>
> **⚠️ `filter.product_ids` casa UM id por chamada (verificado).** Só
> `product_ids: "401338894"` (string única) funciona. **Comma-string**
> (`"id1,id2"`), **array de strings** (`["id1","id2"]`) e **array de int**
> (`[id1]`) retornam `total: 0`. Para N produtos específicos → **N data functions**,
> uma por id (ex.: `hero_p0`, `hero_p1`, …), e no template `data["hero_p"+i].products[0]`.

Ordenações: relevance (default), a-z, z-a, cheapest, most_expensive, discount,
newest, best_selling, most_reviews.
Presets (filtros imutáveis + paginação desligada):
- `HighlightedProducts` → highlighted=true, is_available=true
- `BestSellingProducts` → is_available=true, sort units_sold desc
- `NewestProducts` → is_available=true, sort created_at desc

### `get_current_product` (shape do retorno)
Básico (id, name, url, code, type), preço (base, venda, % desconto), estoque/
disponibilidade, imagens (preview/detalhe), SKUs (variantes com preço/opções),
variações (ex. cor com hex), categorias (hierárquicas com path), SEO
(title/description/keywords), mídia (YouTube), seller. Recomendado em `global_data`.

---

## 7. Liquid — filtros e tags customizados

> **⚠️ Comentários: use `{% comment %}…{% endcomment %}`, NÃO `{# … #}`.** O engine
> da LI Render **não** suporta a sintaxe `{# #}` — ela **vaza como texto literal**
> na página (verificado). Acesso a hash por chave dinâmica funciona:
> `data["hero_p" | append: i]` / `obj[var]`.

Filtros (além do Liquid/Fluid padrão):
- `is_empty` — string/array vazios ou null → bool
- `format_cpfcnpj` — `12345678901` → `123.456.789-01`
- `format_phone` — formata telefone BR
- `sanitize` — remove `<script>` perigosos preservando markup
- `pluralize` — escolhe singular/plural por contagem
- `only_numbers` — mantém só dígitos
- `slugify` — texto → slug (sem acento, minúsculo, hífens)
- `shuffle` — embaralha array (Fisher-Yates); não-array passa direto

Tag `asset_url`:
```
{% asset_url "images/logo.png" %}
{% asset_url "images/banner.jpg", width: 1200, height: 600 %}
```
- Retorna URL no CDN: `https://cdn.awsli.com.br/{w}x{h}/<conta>/render/theme_assets/<path>`
- `./` ou `/` à esquerda são normalizados; asset inexistente retorna o path
  original; dimensões inválidas (≤0/não-numéricas) ignoradas; uma só dimensão
  aplica a ambas.
- **Aceita variável** como path: `{% asset_url slide.image %}` (verificado).

> **⚠️ Resize NÃO funciona em theme_assets (verificado).** Apesar do exemplo acima,
> `{% asset_url 'brand/foto.jpg', width: 1600, height: 2000 %}` (e qualquer outro
> tamanho testado: 300x300, 800x1000, 1080x1350…) retorna **404**; só a URL **sem
> prefixo `/WxH/`** (asset cru) dá 200. Ou seja: para imagens **subidas no tema**
> (logos, fotos editoriais de hero), use `{% asset_url path %}` **sem** width/height
> e deixe o `object-fit:cover` enquadrar — pré-redimensione o arquivo antes de subir
> se precisar economizar peso. O resize `/WxH/` só vale para imagens servidas pelo
> `ctx.static_domain` (produtos via `preview_images`, banners via `get_banners`).

Inspecionar config do lojista: `{{ layout_attributes | json }}`
(`cabecalho`, `configuracao`, `conteudo/banner/coluna/rodape`, toggles como
`product_review`, `alerta_frete_gratis`, `newsletter`).

---

## Índice da doc oficial (para aprofundar)
Base: `https://ora-lingerie-preview.lojas.li/.docs/`
- Guias: `getting-started`, `theme-preview`, `page-settings`, `custom-pages`,
  `partials`, `apps`, `store-routes`, `layout-attributes`, `liquid-filters`
- Tags: `custom_tags/asset_url`
- CLI: `cli/download_cli`, `cli/update_cli`, `cli/login`, `cli/list_themes`,
  `cli/create_theme`, `cli/delete_theme`, `cli/promote_theme`, `cli/remove_theme`,
  `cli/deploy_theme`, `cli/pull_theme`, `cli/push_theme`, `cli/rollback_theme`,
  `cli/sync_theme`
- Funções: pasta `functions/` (ver §6)
- Doc completa em uma página: `print.html`
