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
  O conteúdo do minicart (itens, sugestões) também carrega via HTMX ao abrir o
  drawer — espere o swap antes de medir/assertar (senão você lê o container vazio).
- Use um **termo de busca que existe** no catálogo (descubra um nome de produto
  na home primeiro).
- **Prévia de busca (autocomplete) é disparada por evento `input` real**, não por
  setar `.value`. O input tem `hx-trigger="input[target.value.length > 1] changed
  delay:500ms"` → para acionar via JS: `input.value='termo';
  input.dispatchEvent(new Event('input',{bubbles:true}))` e espere ~1.5s. Só mexer
  em `.value` não chama o HTMX e te faz concluir "não carrega" por engano.
- **Para testar o carrinho vazio, limpe-o ANTES** (não só no fim): remova todos os
  itens (clique "Remover", HTMX ~3s cada) e então verifique o estado vazio. O
  carrinho costuma vir sujo de runs anteriores (badge > 0).
- **Cada passo checa anomalia visual também**, não só presença no DOM (ver a tabela
  em `qa-checklist.md`): largura renderizada > 0, padding entre blocos, sem
  sobreposição, e nada que a copy promete faltando.
- **Limpe o carrinho** ao final (clique "Remover") para não deixar estado sujo.

## Passo 1 — Home  (`/.theme/<tema>` ou `/`)

```js
(() => { const e=[],ok=(c,m)=>{if(!c)e.push(m)};
  ok(document.querySelector('[data-testid="li-header-logo"]'),'logo ausente');
  ok(document.querySelector('label[for="search-drawer-toggle"], input[type="search"]'),'busca ausente');
  ok(document.querySelector('label[for="header-minicart-drawer-toggle"]'),'minicart ausente');
  const it=document.querySelectorAll('[data-testid="li-shelf-item"]');
  ok(it.length>0,'sem produtos na home');
  ok(document.querySelector('footer, [class*="footer" i]'),'footer ausente');
  return {step:'1-home',pass:e.length===0,errs:e,shelfItems:it.length,firstProduct:it[0]?.getAttribute('href')}; })()
```

## Passo 2 — Busca  (`/search?q=<termo>`, GET, input name `q`)

```js
(() => { const e=[],ok=(c,m)=>{if(!c)e.push(m)};
  const it=document.querySelectorAll('[data-testid="li-shelf-item"], [data-id="product-url"]');
  ok(it.length>0,'busca por termo válido retornou 0 resultados');
  return {step:'2-busca',pass:e.length===0,errs:e,results:it.length,firstProduct:it[0]?.getAttribute('href')}; })()
```

## Passo 2b — Prévia de busca ao vivo (autocomplete no drawer)

Abra o drawer de busca, dispare um `input` real e cheque que a prévia popula **e
que não há anomalia visual** (ex.: CTA "Ver todos" colado na listagem).

```js
(async () => { const e=[],ok=(c,m)=>{if(!c)e.push(m)};
  const t=document.getElementById('search-drawer-toggle'); if(t){t.checked=true;t.dispatchEvent(new Event('change',{bubbles:true}));}
  const input=document.querySelector('input[name="q"]');
  ok(input,'input de busca ausente'); input.focus(); input.value='<termo>';
  input.dispatchEvent(new Event('input',{bubbles:true}));        // dispara o hx-get
  await new Promise(r=>setTimeout(r,1500));                       // 500ms delay + req
  const cont=document.getElementById('drawer-search-results') || document.querySelector('[id*="search-result"]');
  const cards=cont?.querySelectorAll('product-card, [data-testid="li-shelf-item"]')||[];
  ok(cards.length>0,'prévia de busca não populou');
  // anomalia visual: card renderiza com largura real, e há espaço antes do CTA
  const w=cards[0]?.getBoundingClientRect().width||0;
  ok(w>40,`card da prévia colapsou (w=${Math.round(w)}px)`);
  const cta=[...cont.querySelectorAll('a,button')].find(b=>/ver todos/i.test(b.innerText||''));
  if(cta){ const list=cards[cards.length-1].getBoundingClientRect(); const gap=cta.getBoundingClientRect().top-list.bottom;
    ok(gap>=8,`sem padding entre listagem e CTA (gap=${Math.round(gap)}px)`); }
  return {step:'2b-prévia',pass:e.length===0,errs:e,cards:cards.length,cardW:Math.round(w)}; })()
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

## Passo 5 — Carrinho vazio (estado + sugestões)

**Esvazie o carrinho** e verifique o estado vazio: mensagem certa **e** a grade de
sugestões renderizando (a copy promete "veja os produtos abaixo"). Caça o colapso
de largura (grade que existe no DOM mas vira slivers de ~2px).

```js
(async () => { const e=[],ok=(c,m)=>{if(!c)e.push(m)};
  const t=document.getElementById('header-minicart-drawer-toggle'); if(t){t.checked=true;t.dispatchEvent(new Event('change',{bubbles:true}));}
  await new Promise(r=>setTimeout(r,1200));
  for(let i=0;i<6;i++){const b=document.querySelector('[data-testid="li-minicart-item-remove"]'); if(!b)break; b.click(); await new Promise(r=>setTimeout(r,3000));}
  await new Promise(r=>setTimeout(r,1500));                         // sugestões carregam via hx-get intersect
  ok(/vazi/i.test(document.body.innerText),'mensagem de carrinho vazio ausente');
  const grid=[...document.querySelectorAll('[id*="suggestion"], .grid')].find(g=>g.querySelectorAll('product-card, img').length>=1 && /vazi/i.test(g.closest('[class*="flex"]')?.textContent||g.parentElement?.textContent||''));
  if(grid){ const gw=grid.getBoundingClientRect().width; const cols=getComputedStyle(grid).gridTemplateColumns;
    ok(gw>120,`grade de sugestões colapsou (w=${Math.round(gw)}px, cols=${cols})`); }
  else { e.push('grade de sugestões ausente (copy promete produtos, nada renderiza)'); }
  return {step:'5-carrinho-vazio',pass:e.length===0,errs:e}; })()
```

## Critério de aprovação

Os passos (1, 2, 2b, 3, 4, 5) com `pass:true` + screenshot do minicart com o item.
Qualquer `errs` não-vazio = **regressão — não promova**; investigue antes.
**`errs` inclui anomalia visual** (colapso, falta de padding), não só falha de
função — um fluxo "que funciona" mas visualmente quebrado **não** está aprovado.

## `data-testid` âncora (estáveis no litheme — preferir a seletor de estilo)

`li-header-logo`, `li-header-cart`, `li-shelf-item`, `li-product-buy`,
`li-minicart-item`, `li-minicart-total-value`, `li-minicart-checkout-btn`,
`li-minicart-drawer-close`. Asserts em `data-testid` não quebram quando você muda
classe/estilo — é o que torna o teste robusto a mudanças cosméticas.

## Exemplo de execução íntegra (referência)

✅ Home (N produtos) → Busca por um termo do catálogo (resultados) → PDP do 1º
resultado (preço/botão/imagem) → add-to-cart (badge 0→1) → minicart (item, total,
checkout). Caminho primário íntegro após o pass global de tipografia/cor/CTA.
