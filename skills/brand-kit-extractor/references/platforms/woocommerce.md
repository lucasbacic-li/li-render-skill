# Extração — WooCommerce / WordPress  ⚠️ a verificar

> Baseado em conhecimento geral do WordPress/WooCommerce. Confirmar e corrigir no
> 1º teste real desta plataforma.

## Detecção
- `/wp-content/` (themes/plugins), `/wp-json/`, `<link>` para
  `wp-content/themes/<tema>/style.css`.
- Classes `woocommerce`, `wc-block-*` no HTML; corpo com `class="...woocommerce..."`.
- Geradores: `<meta name="generator" content="WooCommerce ...">` / `WordPress`.

## Onde mora a marca
- **CSS inline do tema/Customizer**: procure `<style id="...-inline-css">` e blocos
  `:root{ --wp--preset--color--... }` (cores do Customizer/theme.json do bloco editor).
- **Stylesheet do tema**: `/wp-content/themes/<tema>/style.css` (cabeçalho do tema +
  estilos). Em temas de bloco (FSE), `theme.json` define a paleta nomeada — boa fonte.
- A cor de marca costuma ser a **brand/accent** do tema ativo; cruze inline `:root`
  com os botões `.button`/`.wp-block-button`.

## Logo e favicon
- Logo: Customizer "custom_logo" → `<img class="custom-logo">` (frequentemente PNG/SVG
  em `/wp-content/uploads/`). Favicon: `<link rel="icon">` em `/wp-content/uploads/`.

## Fontes
- Google Fonts via `<link>` ou enfileiradas pelo tema; temas de bloco declaram
  `--wp--preset--font-family--*`.

## Gotchas / a verificar
- [ ] Confirmar o seletor real das cores de marca (varia por tema: Astra, Flatsome,
      Storefront, etc. têm convenções próprias).
- [ ] `theme.json` (FSE) costuma ser o atalho de ouro — confirmar caminho.
