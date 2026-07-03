# LI Render — CLI e Renderizador (notas de referência)

> Material-base levantado a partir da doc oficial do LI Render, servida no preview
> de **qualquer** conta em `https://{slug}-preview.lojas.li/.docs/` (troque `{slug}`
> pelo slug da loja). Fonte de verdade para construir a skill de implementação de
> loja na Loja Integrada.

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
  preview retornam a **página de login do painel** (HTTP 200, mas é o admin). A
  sessão vive nos **cookies do perfil do Chrome** em que você fez `li-cli login`.

  ⚠️ **O Chrome MCP bloqueia `localhost`/`127.0.0.1`/`file://`** (comps locais) — para
  esses use o preview MCP (server Node estático). **MAS o preview do tema (`*.lojas.li`)
  VOLTOU a funcionar no Chrome conectado (verificado em caso real):** navegar para
  `…/.theme/<tema>` seta o cookie de seleção e redireciona p/ `/`; daí dá pra
  `getComputedStyle`/screenshot do preview autenticado direto no navegador conectado (ele
  já está logado no painel via o `li-cli login`). Ou seja, para a **thread principal /
  gate** rodando no navegador conectado, NÃO é preciso a receita headless+CDP. (O bloqueio
  de `*.lojaintegrada.com.br` — loja pública pós-promote — pode persistir; aí sim headless.)

  ⚠️ **A receita headless+CDP abaixo pode ser BLOQUEADA pelo classificador de segurança**
  (copiar `Cookies`/`Local State` do perfil do Chrome é visto como exploração de
  credential-store) — verificado em caso real. Consequências: (a) **sub-agentes de
  workflow/Agent não conseguem** montar o headless autenticado sozinhos → a verificação
  isolada por-componente do §4d cai para **prova determinística por `getComputedStyle`**
  no navegador conectado (singleton, serializado), e o **gate independente** (§4f) roda na
  thread orquestradora (que **não** implementou os componentes — quem implementou foram os
  sub-agentes — então a independência se preserva). (b) Se precisar mesmo do headless+CDP,
  **peça autorização explícita do usuário** antes de copiar o perfil.

  🟡 **FALLBACK — Receita headless + CDP (use SÓ se o navegador conectado não servir, ex.:
  sub-agente paralelo precisando do próprio browser).** Caro e bloqueável (ver caveat acima):
  o caminho **primário** é o navegador conectado, que alcança o preview `.lojas.li`. A receita
  headless usa uma **cópia do perfil do usuário** (carrega o cookie de sessão do painel —
  **peça autorização**, o classificador pode barrar) e captura via **CDP `Page.captureScreenshot`**
  (não o `--screenshot` one-shot):
  1. **Perfil:** copie `~/Library/Application Support/Google/Chrome/{Local State,
     Default/Cookies,Default/Preferences}` para um `--user-data-dir` próprio (ex.
     `/tmp/chrome-prof`). Rodando como o mesmo usuário do SO, os cookies (cifrados no
     Keychain) **descriptografam**. Re-copie o `Cookies` se a sessão rotacionar.
  2. **Lançar:** `Google Chrome --headless=new --disable-gpu --user-data-dir=/tmp/chrome-prof
     --disk-cache-dir=/tmp/nc-<ts> --remote-debugging-port=9333 about:blank`. Use um
     **`--disk-cache-dir` descartável por run** (NÃO use `--disk-cache-size=1` — quebra
     o carregamento). Limpe `SingletonLock` antes.
  3. **Fixar o tema (gotcha crítico):** navegue **limpo** para `…/.theme/<tema>` (isso
     grava o cookie de seleção de tema e **redireciona p/ `/`**). **NÃO** acrescente
     `?cb=…` à URL do preview: o cache-buster dispara um redirect que **dropa a seleção
     `.theme/<tema>`** e você screenshota **silenciosamente o tema ativo/errado**.
     Para outra rota, navegue depois para a rota **sem** `cb`. Confirme o tema lendo o
     toolbar **"Tema atual: <nome>"** (canto inferior) — ou `getComputedStyle`.
  4. **Capturar via CDP, não `--screenshot`:** o `--screenshot` one-shot dispara a foto
     **antes do CSS cross-origin (CDN `theme.min.css`) aplicar** → você vê um render
     "sem estilo/antigo" **falso** (sintoma clássico: byte-idêntico entre runs, cores
     de token aplicadas mas regras de classe não). Em vez disso: conecte via WebSocket
     (Node 22+ tem `WebSocket` global), `Page.navigate`, aguarde `Page.loadEventFired`
     + `document.fonts.ready` + ~2.5s, então `Page.captureScreenshot`.
  5. **Prova determinística:** quando a screenshot parecer errada, **NÃO confie nela** —
     rode `Runtime.evaluate` de `getComputedStyle(el).<prop>` (ex.: bg do `<header>`,
     valor de uma `--bk-*`). Isso separa "CSS não aplicou" de "artefato de captura".

  > O `save_to_disk` do Chrome MCP grava **fora** do FS do agente (não some em
  > `reference/`). A receita headless+CDP acima grava o PNG num caminho seu → dá pra
  > `Read` direto e rodar o diff comp×preview por **componente** e por página.

  ⚠️ **Gotchas de execução verificados (caso real):**
  - **Conecte ao TARGET DA PÁGINA, não ao browser.** `http://localhost:<port>/json/version`
    devolve o endpoint do **browser** (sem domínio `Page`/`Runtime` → `captureScreenshot`
    volta `undefined`). Use `http://localhost:<port>/json`, ache `type:"page"` e use o
    `webSocketDebuggerUrl` dele.
  - **Selecionar tema p/ uma ROTA específica = 2 navegações na MESMA sessão.** Headless
    novo não tem a seleção `.theme/<nome>` (é por cookie/sessão). Navegue 1º para
    `…/.theme/<nome>` (seta a seleção), espere ~3.5s, **depois** navegue para a rota
    (`/categoria`, `/produto-x`) **sem** `?cb`. Um único navigate direto na rota mostra o
    **tema ativo/errado**.
  - **`theme sync -r` pode CAIR no meio** (`WebSocket invalid state 'Closed'`). Reinicie o
    sync e **re-salve (nudge)** os arquivos editados após a queda — o sync **não faz
    upload inicial**, só sobe o que mudar com ele rodando. (Minificação tira comentários:
    nudge no `.min.css` por comentário NÃO muda o conteúdo → faça uma mudança de regra
    real, ou nudge o `.liquid`/`.json`.)

  ⚠️ **Gotchas de IMPLEMENTAÇÃO do cliente CDP (ao escrever o script de captura) — caso real:**
  - **Forma da resposta CDP: `{id, result:{…}}`, e `Runtime.evaluate` ANINHA mais um
    `result`.** O valor do eval está em **`msg.result.result.value`** (o `result` externo é
    o envelope CDP; o interno é o RemoteObject). Ler `msg.result.value` devolve `undefined`
    **silenciosamente** (sem erro) — bug clássico que faz parecer que "o eval não roda".
    `Page.captureScreenshot` é só um nível: `msg.result.data`.
  - **Desligue o cache do cliente**: `Network.enable` + `Network.setCacheDisabled{true}`
    antes de navegar — senão o headless serve `theme.min.css` cacheado e uma regra nova
    "não aparece" entre iterações (mesmo com o preview server sem cache).
  - **Screenshot ISOLADO por seletor (diff de componente)**: rode um eval que faz
    `el.scrollIntoView()` + `getBoundingClientRect()` e passe `{clip:{x,y,width,height,
    scale:1}}` ao `Page.captureScreenshot`. Vira o "screenshot do componente isolado" que
    o §4d exige, sem recortar a mão.
  - **`npm run watch:css` NÃO sobrevive em background headless** (sai após o build inicial,
    sem TTY). Na orquestração: rode **`npm run build:css` manualmente** após cada edição de
    CSS; o `sync -r` (esse sim persiste) sobe o `.min.css`. Não dependa do watch num
    pipeline de sub-agentes.
  - **Estado oculto (drawer/menu) p/ o sweep**: o `captureScreenshot` do cliente dispara
    DEPOIS de um eval-less navigate, então p/ fotografar um drawer ABERTO escreva um script
    que (1) navega, (2) `evaluate` marca o toggle (`#…-drawer-toggle`.checked=true) + sleep,
    (3) só então captura/varre. Adicionar 1 item ao carrinho p/ ver o minicart cheio: ache
    `[data-id="product-buy-url"]`, `.click()`, espere ~2.5s.
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
Ex.: `theme deploy <tema-dev> -t <tema-prod>` → `theme promote <tema-prod>`.
- `deploy` copia pages/templates/assets do dev p/ um tema novo de produção, com
  otimizações; `-t` nomeia o alvo (sem `-t`, gera nome). Sem `--global` é deploy
  normal (não publica como tema global de marketplace).
  - **`deploy` pode falhar transitoriamente:** "An unexpected error occurred while
    deploying… Reference ID: … The incomplete theme has been deleted." Visto e
    **resolvido só re-rodando** o mesmo comando. Tente de novo antes de investigar.
  - 🔴 **NÃO reuse um `-t` que já existe / que teve deploy falho — use NOME NOVO.**
    Caso real (ver snapshot): 1º `deploy <tema> -t <tema-prod>` **falhou**
    ("incomplete theme deleted"); o 2º gravou por cima do mesmo `<tema-prod>`.
    Resultado: produção renderizou com **cores/fontes certas mas SEM layout** —
    classes de grid/paddings (tudo em `@layer utilities`) **não aplicavam**; só
    variáveis `:root` sobreviviam. O CSS servido era **md5-idêntico** ao do dev (que
    renderiza certo no preview) e vinha `200 text/css` — mas com **`x-cache: Hit
    from cloudfront`**: a borda servia ao browser uma versão ruim/parcial (parse dos
    blocos `@layer` quebrava no meio), diferente do que o `curl` pegava. **Fix que
    funcionou:** `deploy <tema> -t <tema-prod>-v3` (nome novo ⇒ **URLs de asset
    novas** `/<tema-prod>-v3/…` ⇒ cache de borda limpo ⇒ parse correto). Depois
    `promote <tema-prod>-v3`. Regra: **cada deploy de correção vai para um nome
    incrementado** (`-v2`, `-v3`); não sobrescreva.
  - **Antes do `deploy`, faça `push` COMPLETO do dev (não confie no `sync`).** O
    `sync` só envia arquivos que mudaram *durante* a sessão; o tema dev no servidor
    pode estar **defasado** do local. No caso real, um `push` antes do deploy
    **substituiu 7 páginas + 1 template + o CSS** que o servidor tinha desatualizados
    — e o `deploy` copia o estado do **servidor**, não o seu disco. Push → deploy.
- `promote` pede confirmação `[y/n]` (e de remoção de A/B test se houver).
  - ⚠️ **`-f/--force` NÃO pula a confirmação** na CLI `20260519.2` — apesar do
    `--help` dizer que pula "both the promote and A/B test confirmations", o prompt
    "Are you sure you want to promote…?" ainda aparece. Stdin canalizado
    (`printf 'y\n' |`) também falha ("Failed to read input in non-interactive
    mode"). **Solução que funciona: alocar um PTY e responder `y`** — ex. um wrapper
    Python `pty.fork()` que faz `select` no master, e quando vê `[y/n]`/`sure`/`(y)`
    escreve `y\n`. Esse é o método para o agente promover sozinho.
  - ⚠️ **Gotcha de esgotamento de PTY (resolve o "openpty: out of pty devices"):**
    `pty.fork()`/`expect`/`script` podem falhar com "out of pty devices" /
    "no more ptys" / "Device not configured". Causa real **não** é o sandbox — é o
    **pool de ptys do macOS esgotado** (`sysctl kern.tty.ptmx_max` = 511). Diagnostique
    com `lsof | grep -E '/dev/ttys|/dev/ptmx' | awk '{print $1,$2}' | sort | uniq -c
    | sort -rn` — visto o **próprio processo `Claude` segurando 512 ptys** (shells/
    tarefas em background acumulados na sessão). **Não mate esse PID** (é o app da
    sessão). Conserto: **reiniciar o Claude Code** libera os ptys; teste com
    `python3 -c 'import os;m,s=os.openpty();print(os.ttyname(s))'` e re-rode o promote.
  - **Reusar `-t <prod>` num tema já promovido:** o `deploy` atualiza o conteúdo do
    slot ativo; o `promote` seguinte pode retornar "This theme is already promoted"
    (o slot já estava ativo) — e a loja **já serve a nova versão** mesmo assim.
  - O `deploy` roda 100% pelo agente; o `promote` também, desde que haja PTY livre.
    Reconfirme com `theme list -e production` e **verifique na loja pública** depois.
- Verifique ao vivo na loja **pública** APÓS o promote — a URL real é o domínio do
  lojista (`https://{loja}.lojaintegrada.com.br`), não o `.lojas.li`.
  - ⚠️ **O navegador conectado (Chrome MCP) BLOQUEIA o domínio `lojaintegrada.com.br`**
    ("Navigation to this domain is not allowed"); `curl`/WebFetch pegam só o HTML
    estático (não provam layout/CSS aplicado). **Para ver o render real e checar
    estilo computado, use Chrome headless via Bash + CDP** (o headless renderiza a
    loja pública sem login):
    - Screenshot: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      --headless=new --disable-gpu --window-size=1440,900 --virtual-time-budget=9000
      --screenshot=out.png "<url>?cb=$(date +%s)"`. **Janela alta infla heros `100vh`**
      — capture em altura realista (~900–1100) ou scroll via CDP, senão você lê um
      "hero gigante" que é artefato da captura, não bug.
    - **Estilo computado (prova determinística)** via CDP: subir headless com
      `--remote-debugging-port=9222`, e por WebSocket (Node 22+ tem `WebSocket`
      global — sem npm) rodar `Runtime.evaluate` de
      `getComputedStyle(document.querySelector('<seletor-de-grid>')).display` etc.
      Foi assim que se provou `display:block` (quebrado) vs `grid` (ok) em prod.
  - **Sintoma "cores/fontes ok mas layout sumiu" = `@layer utilities` não aplicando**
    (vars `:root` sobrevivem, regras de classe não). Em prod com CSS idêntico ao dev,
    a causa foi **cache de borda ruim** — ver o gate de deploy acima (deploy p/ nome
    novo resolve). Cheque o `display` computado de um container de layout, não só o screenshot.

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
>
> **⚠️ Data functions são DEDUPLICADAS por assinatura de args na MESMA página
> (verificado).** Se dois `data.*` na página chamam `get_products` com args
> **idênticos** (mesmo `product_ids` + mesmo resto), só o **primeiro** resolve; o
> segundo vem **nulo** (a chave existe mas `.products`/`.total` saem vazios, nem
> `0`). É page-wide: um `community_p0` colide com um `hero_p0` se os args forem
> iguais — mesmo em componentes diferentes. Sintoma: card some, `data[key].total`
> em branco. **Solução (ordem de preferência):**
> 1. **Cure produtos distintos** — o jeito limpo: cada produto pinado por id
>    aparece em UMA data function na página.
> 2. **Se o reuso é inevitável**, varie a assinatura de args com uma mudança
>    **VÁLIDA**: omitir `paginate: false` (ou trocar por `paginate: true`) muda a
>    chave e resolve. **NÃO** use `size` para isso — `size` fora do range **4–100**
>    (ex. `1`) **estoura o componente inteiro** (a seção some), e mesmo válido é
>    frágil; prefira mexer no `paginate`.

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

> **⚠️ Fontes: NÃO use `@font-face` com `url(../fonts/…)` em `theme.css` (verificado).**
> `theme.css`/`theme.min.css` é asset **estático** — não passa por Liquid, então não
> dá pra usar `{% asset_url %}` lá dentro. O `url(../fonts/X.ttf)` relativo é resolvido
> pelo browser contra a URL do CSS servido (`…/{WxH}/<conta>/render/theme_assets/…`),
> caindo num caminho **sem a resolução do CDN** → **404/403** → a fonte falha. Sintoma:
> só a **serifada** parece quebrada (cai em Georgia, óbvio), enquanto grotesca→system-ui
> e mono→ui-monospace disfarçam — mas as **três** falharam (`FontFace.status:"error"`;
> `document.fonts.check()` ENGANA, retorna true mesmo com erro — cheque `.status`).
> **Duas saídas corretas:**
> 1. **Google Fonts via `<link>` no `<head>`** (recomendado se a fonte existe lá —
>    cheque cada família do kit em fonts.google.com): mesmo padrão do Material Symbols do
>    litheme (`media="print" onload="this.media='all'"` + `<noscript>` + `display=swap`).
>    Serve **woff2 + unicode-range** (melhor no mobile que TTF variable). Verificado: as
>    3 viram `status:"loaded"`.
> 2. **Self-host via `@font-face` num `<style>` Liquid** no head, com
>    `src: url('{% asset_url "/fonts/X.woff2" %}')` — aí a URL é assinada corretamente.
>    Prefira **woff2** (converta o TTF) p/ robustez no mobile.

Inspecionar config do lojista: `{{ layout_attributes | json }}`
(`cabecalho`, `configuracao`, `conteudo/banner/coluna/rodape`, toggles como
`product_review`, `alerta_frete_gratis`, `newsletter`).

---

## Índice da doc oficial (para aprofundar)
Base: `https://{slug}-preview.lojas.li/.docs/` (qualquer conta serve a mesma doc)
- Guias: `getting-started`, `theme-preview`, `page-settings`, `custom-pages`,
  `partials`, `apps`, `store-routes`, `layout-attributes`, `liquid-filters`
- Tags: `custom_tags/asset_url`
- CLI: `cli/download_cli`, `cli/update_cli`, `cli/login`, `cli/list_themes`,
  `cli/create_theme`, `cli/delete_theme`, `cli/promote_theme`, `cli/remove_theme`,
  `cli/deploy_theme`, `cli/pull_theme`, `cli/push_theme`, `cli/rollback_theme`,
  `cli/sync_theme`
- Funções: pasta `functions/` (ver §6)
- Doc completa em uma página: `print.html`

### Gotchas de sync/push/PTY (verificados)

- **`sync` valida o JSON da página contra o schema (estrito) e recusa silenciosamente.**
  Erro: *"Page validation: ... JSON is valid against no schemas from 'oneOf'. Page
  not synced"*. Diagnostique baixando o schema
  (`https://cdn.awsli.com.br/public/render/schema/v1.json`) + `jsonschema` (Draft7),
  iterando erros por componente. Causa comum: **container > 10 componentes**
  (`maxItems: 10`) — ver `litheme-structure.md`.
- **`sync` só sobe em mudança de CONTEÚDO de arquivo já observado.** Arquivo NOVO
  criado antes do sync iniciar, ou tocado (`touch`)/copiado-igual, NÃO sobe. Para
  texto: faça uma mudança de conteúdo. Para binário (imagem): `rm` + esperar > o
  intervalo + `cp` de volta (evento de create). Confirme no log.
- 🔴 **O watcher do `sync -r` MORRE num arquivo temporário de editor e PARA de subir
  (verificado).** Sub-agentes editando `.liquid` deixam artefatos tipo
  `.!12345!notify-me-sheet.liquid` (swap/atomic-save); o watcher tenta lê-los, dá
  `Error: Could not find file '.../.!NNN!...'` e **trava em silêncio** — o `theme.min.css`
  e templates editados depois disso **não sobem**, e o preview fica **stale** (parece que a
  fundação/edição "não aplicou", quando na verdade nunca chegou ao servidor). **Sintoma
  clássico:** `getComputedStyle` no preview mostra os tokens ANTIGOS mesmo após `build:css`
  ok e o `.min.css` local correto. **Conserto:** `find <tema> -name '.!*' -delete`, reinicie o
  `sync -r`, e faça um **`push` completo** (sobe `theme.min.css` + tudo) — não confie no sync
  para o upload de recuperação. Antes de concluir que "a fundação não cascateou", **confirme
  que o `theme.min.css` realmente subiu** (procure `style/theme.min.css` no log do sync, ou
  re-push).
- **Esgotamento de PTY em sessões longas.** A harness (app) segura ~todos os PTYs
  do sistema (`sysctl kern.tty.ptmx_max`, ex. 511). Aí `pty.fork()` (usado p/
  responder o prompt interativo do `push`/`promote`) falha com **"out of pty
  devices"** — e não dá pra liberar (são da harness, não dos seus processos).
  Contorno: prefira **`sync`** (não pede prompt, não precisa de PTY) para subir
  mudanças; e mantenha a página **schema-válida** para o sync aceitá-la. `push`/
  `promote` interativos só quando há PTY livre.
