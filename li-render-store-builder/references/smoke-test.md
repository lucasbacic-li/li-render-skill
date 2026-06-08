# Smoke test do caminho primário (regressão)

Fluxo crítico de qualquer loja: **Home → Busca → Página de Produto (PDP) →
Adicionar ao carrinho → Minicart**. Mudanças de estilo/estrutura **não podem
quebrar isso**. Rode este teste:

- **Sempre antes de um deploy maior** (antes de `li-cli theme promote`).
- Depois de mexer em header, busca, card de produto, PDP, ou minicart.

É parte da Definition of Done para mudanças grandes (ver `SKILL.md`).

## Como rodar

**Primeiro, abra uma aba dedicada** (não reutilize a aba do preview — threads
paralelas competem por ela): `tabs_context_mcp({createIfEmpty:true})` →
`tabs_create_mcp()` → guarde o `tabId` → use só ele em todos os passos →
`tabs_close_mcp` no fim. Ver `qa-checklist.md` (Isolamento de aba).

Dirija o navegador conectado (logado no painel) pela URL de preview. Cada passo
é **navegar/interagir → rodar um assert de DOM** (não só screenshot — asserts são
determinísticos). Os snippets retornam `{ pass, errs, ... }`. **Todos os passos
devem ter `pass:true`.** Capture um screenshot do minicart final como evidência.

Notas importantes:
- **Não hardcode slugs de produto** — eles mudam por loja. Descubra o `href` do
  1º produto na Home/Busca (os asserts já retornam `firstProduct`) e navegue nele.
- **Add-to-cart é HTMX (assíncrono)** — espere ~3s após o clique antes de checar.
- Use um **termo de busca que existe** no catálogo (descubra um nome de produto
  na home primeiro).
- **Limpe o carrinho** ao final (clique "Remover") para não deixar estado sujo.

## Passo 1 — Home  (`/.theme/<tema>` ou `/`)

```js
(() => { const e=[],ok=(c,m)=>{if(!c)e.push(m)};
  ok(document.querySelector('[data-testid="li-header-logo"]'),'logo ausente');
  ok(document.querySelector('label[for="search-drawer-toggle"], input[type="search"]'),'busca ausente');
  ok(document.querySelector('label[for="header-minicart-drawer-toggle"]'),'minicart ausente');
  const it=document.querySelectorAll('[data-testid="li-shelf-item"]');
  ok(it.length>0,'sem produtos na home');
  ok(document.querySelector('.ora-closing, footer, [class*="footer"]'),'footer ausente');
  return {step:'1-home',pass:e.length===0,errs:e,shelfItems:it.length,firstProduct:it[0]?.getAttribute('href')}; })()
```

## Passo 2 — Busca  (`/search?q=<termo>`, GET, input name `q`)

```js
(() => { const e=[],ok=(c,m)=>{if(!c)e.push(m)};
  const it=document.querySelectorAll('[data-testid="li-shelf-item"], [data-id="product-url"]');
  ok(it.length>0,'busca por termo válido retornou 0 resultados');
  return {step:'2-busca',pass:e.length===0,errs:e,results:it.length,firstProduct:it[0]?.getAttribute('href')}; })()
```

## Passo 3 — PDP  (navegue no `firstProduct`)

```js
(() => { const e=[],ok=(c,m)=>{if(!c)e.push(m)};
  const h1=document.querySelector('h1');
  ok(h1&&h1.textContent.trim(),'nome (h1) ausente');
  ok(/R\$\s*\d/.test(document.body.innerText),'preço ausente');
  ok(document.querySelector('[data-testid="li-product-buy"], [hx-post*="/cart/item"]'),'botão de compra ausente');
  ok(document.querySelector('img'),'imagem ausente');
  return {step:'3-pdp',pass:e.length===0,errs:e,name:h1?.textContent.trim()}; })()
```

## Passo 4 — Add-to-cart + Minicart

Se o produto tiver opções obrigatórias (tamanho/cor), selecione uma antes
(`input[type=radio][data-variation]`). Produtos simples adicionam direto.

```js
(async () => { const e=[],ok=(c,m)=>{if(!c)e.push(m)};
  const before=parseInt(document.querySelector('.header-minicart-totalitems')?.textContent||'0',10);
  const buy=document.querySelector('[data-testid="li-product-buy"], [hx-post*="/cart/item"]');
  ok(buy,'botão de compra ausente'); buy?.click();
  await new Promise(r=>setTimeout(r,3000));            // HTMX
  const after=parseInt(document.querySelector('.header-minicart-totalitems')?.textContent||'0',10);
  ok(after>before,`badge não incrementou (${before}→${after})`);
  const t=document.getElementById('header-minicart-drawer-toggle'); t.checked=true; t.dispatchEvent(new Event('change',{bubbles:true}));
  const item=document.querySelector('[data-testid="li-minicart-item"]');
  ok(item,'item ausente no minicart');
  const total=document.querySelector('[data-testid="li-minicart-total-value"]');
  ok(total&&/R\$\s*\d/.test(total.textContent),'total ausente');
  ok(document.querySelector('[data-testid="li-minicart-checkout-btn"]'),'finalizar compra ausente');
  return {step:'4-minicart',pass:e.length===0,errs:e,badge:`${before}→${after}`,total:total?.textContent.trim()}; })()
```

## Critério de aprovação

Os 4 passos com `pass:true` + screenshot do minicart com o item. Qualquer `errs`
não-vazio = **regressão — não promova**; investigue antes.

## `data-testid` âncora (estáveis no litheme — preferir a seletor de estilo)

`li-header-logo`, `li-header-cart`, `li-shelf-item`, `li-product-buy`,
`li-minicart-item`, `li-minicart-total-value`, `li-minicart-checkout-btn`,
`li-minicart-drawer-close`. Asserts em `data-testid` não quebram quando você muda
classe/estilo — é o que torna o teste robusto a mudanças cosméticas.

## Resultado da última execução (validação — tema ora)

✅ Home (4 produtos) → Busca "calcinha" (2 resultados) → PDP "Calcinha 02"
(preço/botão/imagem) → add-to-cart (badge 0→1) → minicart (item, total R$ 95,00,
checkout). Caminho primário íntegro após o pass global de tipografia/cor/CTA.
