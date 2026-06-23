# Dicas de extração por plataforma

Cada plataforma de e-commerce guarda a identidade de marca (cores, fonte, logo)
num lugar diferente. Detectar a plataforma da URL **antes** de extrair pula a
destilação de ruído e dá fidelidade muito maior.

## Como usar (passo 1.0 da Skill 1)

1. `curl` o HTML da home (UA de browser).
2. Detecte a plataforma pela tabela abaixo (sinais no HTML/assets/headers).
3. Abra o doc da plataforma e siga as dicas (onde está o CSS de marca, padrões de
   URL de logo/favicon, convenções de fonte, gotchas).
4. Se a plataforma for **desconhecida**, caia no método genérico de
   `../url-ingestion.md` + `../color-distillation.md` (curl do CSS + frequência por
   contexto). As dicas por plataforma são um **atalho**, não substituem o método.

## Tabela de detecção

| Plataforma | Sinais no HTML / assets | Doc | Status |
|---|---|---|---|
| **Loja Integrada** (tema clássico) | `cdn.awsli.com.br`, `static/loja/estrutura/v1`, "Loja Integrada" | [loja-integrada.md](loja-integrada.md) | ✅ verificado (GCM Games) |
| **WooCommerce** / WordPress | `/wp-content/`, `wp-json`, classes `woocommerce` | [woocommerce.md](woocommerce.md) | ⚠️ a verificar |
| **Nuvemshop** / Tiendanube | `nuvemshop`, `tiendanube`, `*.mitiendanube.com` | [nuvemshop.md](nuvemshop.md) | ⚠️ a verificar |
| **Tray** | `tray`, `*.commercesuite.com.br`, `tray.com.br` | [tray.md](tray.md) | ⚠️ a verificar |
| **Shopify** | `cdn.shopify.com`, `/cdn/shop/`, `Shopify.` (JS), `myshopify.com` | [shopify.md](shopify.md) | ⚠️ a verificar |
| **VTEX** | `vtexassets.com`, `vtexcommercestable`, `vtex` | [vtex.md](vtex.md) | ⚠️ a verificar |
| (desconhecida) | — | método genérico em `../url-ingestion.md` | — |

## Status de verificação (legenda)

- ✅ **verificado** — testado numa loja real; padrões confirmados.
- ⚠️ **a verificar** — sinais de detecção e "onde mora a marca" baseados em
  conhecimento geral da plataforma; **confirmar e corrigir no 1º teste real**
  daquela plataforma. Não trate os caminhos como certos até verificar.

> **Manutenção (regra da skill):** sempre que rodar a Skill 1 numa plataforma nova
> (ou achar um padrão novo numa já documentada), **atualize o doc da plataforma**
> com o que funcionou e promova o status para ✅. É o mecanismo que faz a skill
> ficar mais forte a cada loja.
