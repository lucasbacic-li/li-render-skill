# Extração — Tray (Commerce Suite)  ⚠️ a verificar

> Baseado em conhecimento geral da Tray. Confirmar e corrigir no 1º teste real.

## Detecção
- Strings `tray` / `tray.com.br`; domínios `*.commercesuite.com.br`.
- Assets/temas servidos pelo CDN da Tray; objeto JS de tema da Tray.

## Onde mora a marca
- CSS do tema da loja (Commerce Suite usa temas baseados em "loja/tema" com CSS
  próprio) — localize o stylesheet do tema no head e conte hex por contexto.
- Pode haver CSS inline de personalização do lojista (cores no editor de tema).

## Logo e favicon
- Logo no header (`<img>`) apontando ao CDN da loja, normalmente PNG.
- Favicon via `<link rel="icon">`.

## Fontes
- Google Fonts via `<link>` quando o tema usa; senão, famílias de sistema.

## Gotchas / a verificar
- [ ] Confirmar o caminho do CSS do tema e do CSS de personalização do lojista.
- [ ] Confirmar padrão de URL de logo/favicon e host de CDN atual.
