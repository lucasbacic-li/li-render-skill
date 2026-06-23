# Extração — Nuvemshop / Tiendanube  ⚠️ a verificar

> Baseado em conhecimento geral da Nuvemshop. Confirmar e corrigir no 1º teste real.

## Detecção
- Strings `nuvemshop` / `tiendanube` no HTML/JS.
- Assets em `*.mitiendanube.com` (ex.: `dcdn.mitiendanube.com`, `acdn.mitiendanube.com`)
  ou `d2r9epyceweg5n.cloudfront.net`.
- Objeto JS `LS` / `window.LS` (Linkedstore/Nuvemshop) em alguns temas.

## Onde mora a marca
- **Configurações de tema** injetadas como **CSS vars inline** num `<style>` do head
  (cores escolhidas no editor de tema) — procure `:root{ --... }` com nomes de cor
  primária/secundária.
- CSS do tema servido pelo CDN da Nuvemshop (`*.mitiendanube.com/.../styles*.css`);
  conte hex por frequência/contexto ali.

## Logo e favicon
- Logo: `<img>` no header apontando para o CDN da loja (`*.mitiendanube.com`),
  geralmente PNG. Favicon via `<link rel="icon">`.

## Fontes
- Google Fonts via `<link>`; o editor de tema costuma expor a família escolhida.

## Gotchas / a verificar
- [ ] Confirmar o nome exato das CSS vars de cor do editor de tema.
- [ ] Confirmar host(s) de CDN atuais e o caminho do CSS do tema.
