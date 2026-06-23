# Extração — Shopify  ⚠️ a verificar

> Baseado em conhecimento geral do Shopify. Confirmar e corrigir no 1º teste real.

## Detecção
- `cdn.shopify.com`, caminhos `/cdn/shop/`, domínio `*.myshopify.com`.
- Objeto JS `Shopify` / `window.Shopify`; `<meta name="shopify-...">`.

## Onde mora a marca
- **Theme settings → CSS vars inline**: temas modernos (Dawn e derivados) injetam
  `<style> :root{ --color-...: ...; --font-...: ... }` no head a partir de
  `settings_data.json`. Atalho de ouro — leia os `--color-*`/`--gradient-*`.
- CSS do tema em `cdn.shopify.com/s/files/.../assets/*.css` (ou `base.css`/`theme.css`).

## Logo e favicon
- Logo: `<img>` no header (settings `logo`), servido por `cdn.shopify.com/s/files/...`
  (PNG/SVG). Favicon via `<link rel="icon">` (settings `favicon`).

## Fontes
- Shopify Font Library / Google Fonts; as famílias aparecem nas CSS vars
  `--font-heading-*` / `--font-body-*` injetadas pelo tema.

## Gotchas / a verificar
- [ ] Confirmar os nomes das CSS vars por família de tema (Dawn vs. temas pagos).
- [ ] Alguns temas ofuscam cor em classes utilitárias — cruze com os botões.
