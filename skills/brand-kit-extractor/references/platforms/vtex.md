# Extração — VTEX  ⚠️ a verificar

> Baseado em conhecimento geral da VTEX. Confirmar e corrigir no 1º teste real.
> VTEX é a mais complexa (IO/Store Framework + CMS) — a marca pode estar espalhada.

## Detecção
- Assets em `vtexassets.com`; hosts `*.vtexcommercestable.com.br` /
  `*.myvtex.com`; strings `vtex` / `__RUNTIME__` (Store Framework).

## Onde mora a marca
- **Store Framework (IO)**: tokens de estilo vivem em `styles/` do tema (JSON de
  tokens + CSS handles `vtex-*`). No site servido, procure o CSS compilado em
  `vtexassets.com/.../style.css` e conte hex por contexto.
- **CMS/Site Editor**: cores podem vir de configuração de blocos — menos previsível.
- Cruze com os botões de compra (`vtex-button`) para achar a cor de ação.

## Logo e favicon
- Logo no header (componente `vtex.store-components:Logo`), normalmente servido por
  `vtexassets.com`. Favicon via `<link rel="icon">`.

## Fontes
- Definidas no tema (typefaces do Store Framework) ou Google Fonts; confirme no CSS.

## Gotchas / a verificar
- [ ] Mapear onde os tokens de cor do tema IO aparecem no CSS servido.
- [ ] Lojas VTEX variam muito (legacy CMS vs IO) — detectar qual antes de extrair.
