# Captura a partir de uma URL

Objetivo da Fase 1: reunir matéria-prima crua (HTML, CSS, fontes, logo, evidência
visual) sem ainda interpretar. A interpretação é a Fase 2
(`color-distillation.md`).

> **Passo 1.0 — detecte a plataforma primeiro.** `curl` o HTML e identifique a
> plataforma (Loja Integrada, WooCommerce, Nuvemshop, Tray, Shopify, VTEX…) pela
> tabela em [`platforms/README.md`](platforms/README.md). Cada plataforma guarda a
> marca num lugar diferente — o doc específico é um **atalho de alta fidelidade**.
> Plataforma desconhecida → siga o método genérico abaixo + `color-distillation.md`.

## O que coletar

| Sinal | Onde | Como |
|---|---|---|
| HTML da home | URL raiz | WebFetch |
| HTML de PDP + categoria | seguir 1 link de produto e 1 de categoria | WebFetch |
| CSS | `<style>` inline + `<link rel="stylesheet">` | WebFetch das folhas |
| Fontes | `@font-face`, `<link href="fonts.googleapis…">`, `font-family` computado | parse do CSS/HTML |
| `theme-color` | `<meta name="theme-color">` | parse do `<head>` |
| Favicon | `<link rel="icon">` | baixar |
| Logo | `<img>` no header, ou SVG inline, ou `<a class="logo">` | baixar/extrair |
| Evidência visual | screenshot das páginas | preview/Chrome → `reference/` |

## Notas de método

- **`curl` do HTML + dos CSS é a fonte real de COR; WebFetch é para SEMÂNTICA.**
  WebFetch retorna o conteúdo em markdown (ótimo p/ entender seções/tom/categorias,
  ver Fase 2), mas **não** expõe as cores cruas. Para cor/fonte/raio, baixe o HTML
  e as folhas de estilo com `curl` (use um `User-Agent` de browser) e parseie os
  hexes por contexto (`background`/`color`/`border`). Use captura de tela (Chrome
  conectado) só para `reference/` e p/ confirmar hover/gradientes.
- **Ignore o CSS de framework; vá no CSS de MARCA.** Uma loja carrega várias
  folhas; a identidade está nas **hand-edited do lojista**, não no framework.
  Conte a frequência de hex *só* nos arquivos de marca (senão os cinzas do
  framework dominam).
- **Fontes do Google** aparecem como `<link href="https://fonts.googleapis.com/css2?family=...">`.
  Parsear o nome da família dali já resolve `source: "google"`.
- **Logo**: preferir SVG (inline no HTML ou `.svg` linkado). Se só houver PNG
  (comum), baixar o de maior resolução, registrar `logos.primary` apontando o PNG
  e **marcar em `_uncertain`** (revetorizar p/ SVG é ideal — nitidez/recolor).
- **Respeitar robots/ToS**: é extração de identidade visual pública de um cliente
  que pediu o serviço; não rastrear o site inteiro — só home + 1 PDP + 1
  categoria bastam para o kit.

> Dicas específicas por plataforma (onde está o CSS de marca, padrões de URL de
> logo/favicon, gotchas) vivem em [`platforms/`](platforms/README.md). Ex.: lojas já
> na **Loja Integrada** expõem o CSS de marca do lojista diretamente — ver
> [`platforms/loja-integrada.md`](platforms/loja-integrada.md) (✅ verificado).

## Saída desta fase
Um conjunto de artefatos crus em memória/temp: blobs de CSS, lista de
`font-family` por seletor-chave (`body`, `h1`, `h2`, `a`, `button`), cores com
contagem de frequência, e os arquivos de logo/favicon/screenshots baixados.

## Troubleshooting
- **Site JS-only/SPA** (o HTML inicial vem quase vazio, conteúdo montado por JS):
  o `curl` não vê a marca. Use o **site renderizado** (browser/headless) ou busque
  os **endpoints de tema** da plataforma (CSS compilado, config de tema).
- **Cloudflare / 403 / desafio**: o `curl` simples é barrado. Precisa de um
  **navegador real** (ou headers/cookies de um) — tente headless com User-Agent de
  browser; se persistir, capture via navegador.
- **CSS em `rgb()`/`oklch()`/`hsl()` sem `#hex`**: normalize para **hex** antes de
  registrar no kit (o contrato espera hex). Converta cada cor computada.
- **Sem browser disponível**: caia para `curl` do CSS + parse por regex
  (`color`/`background`/`border` + `font-family`), e **marque `_uncertain`** o que
  não der pra confirmar ao vivo (papéis de cor e fonte real, sobretudo).
