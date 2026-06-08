# Regressão visual / cross-component (raio de impacto global)

O lado caro do global-first: **toda mudança global tem raio de impacto global.**
Mexer no token errado (`--radius-field`, um `max-width`, `--color-base-content`,
a utility `.btn`) propaga para dezenas de componentes — inclusive os que você não
abriu. O **smoke test** (`smoke-test.md`) cobre o *fluxo funcional*; ele NÃO pega
"o card de produto quebrou na categoria" ou "o input ficou gigante no checkout".
Isto aqui cobre a **largura visual** do site.

Três camadas: **prevenir** (saber o raio), **detectar barato** (asserts de
layout) e **detectar visual** (diff de screenshots).

## 1. Prevenir — mapa de raio de impacto

Antes de editar um token/utility global, saiba o que ele toca. Se o raio é amplo,
a verificação tem que ser ampla.

| Você muda… | Afeta… (raio) |
|---|---|
| `--color-base-content` | **todo** texto/ícone com `text-base-content`/`fill=currentColor` — o site inteiro |
| `--color-primary` | botões primários, links, badges, foco, acentos |
| `--radius-field` | **todos** botões, inputs, selects, tabs |
| `--radius-box` | **todos** cards, modais, drawers, alerts |
| `max-w-container` / `.container` | **todas** as seções (header, shelf, banners, footer, institucional) |
| `@utility .btn` / `.input` | **todo** botão/input do tema |
| classe estrutural compartilhada (`.embla__slide`, wrappers de carrossel/layout) | **todos** os componentes que a reusam — shelf, banner, tarja, galeria da PDP. Soa local, raio global → escope com classe modificadora (ver `global-styling.md`) |
| `@layer base h1-h6` | **todo** título de **toda** página |
| `html { color/font }` | herança global (o que não tem override) |

**Regra:** antes de mudar uma utility/classe, **`grep` os usos** para enumerar o
que será afetado e decidir a superfície de verificação:
`grep -rn "\bcontainer\b\|max-w-container" templates/`. Mudança em token de cor/
raio/escala = raio amplo = **varra a superfície inteira** (abaixo), não só a
página que você editou.

## 2. A superfície de regressão (o que capturar/checar)

Conjunto canônico que representa a largura do site. Sempre nas **duas viewports**
(mobile ~390 e desktop ~1440):

| # | Rota | Por quê |
|---|---|---|
| 1 | Home `/` | hero, shelves, seções editoriais, footer |
| 2 | Categoria `/[categoria]` | listagem + filtros + grid de cards |
| 3 | Busca `/search?q=<termo válido>` | resultados + filtros |
| 4 | Produto `/<slug>` (PDP) | galeria, preço, opções, compra |
| 5 | Institucional `/<pagina>` ou `/contact-us` | prosa, form |
| + estados | minicart aberto (vazio e com item), drawer de busca, menu mobile, filtros mobile | componentes em overlay |

Descubra os slugs dinamicamente (não hardcode) — pegue o `href` do 1º produto/
categoria na home (ver `smoke-test.md`).

## 3. Detectar barato — asserts de layout (determinístico, sem imagem)

Rode este snippet em **cada rota × viewport** depois de uma mudança global. Pega
o tipo de quebra do exemplo "max-width na categoria errada" (vira overflow):

```js
(() => { const W=innerWidth,errs=[],warn=[],de=document.documentElement;
  if (de.scrollWidth > W+2) errs.push(`overflow horizontal: ${de.scrollWidth} > ${W}`);
  [['header','header, [class*=header i]'],['main','main'],['footer','footer, .ora-closing, [class*=footer i]']]
    .forEach(([n,s])=>{ const el=document.querySelector(s); if(!el){warn.push(`${n} ausente`);return;}
      const r=el.getBoundingClientRect(); if(r.width<1||r.height<1) errs.push(`${n} colapsado (${Math.round(r.width)}x${Math.round(r.height)})`); });
  document.querySelectorAll('.container').forEach(el=>{ const r=el.getBoundingClientRect();
    if(r.width>W+2) errs.push(`.container ${Math.round(r.width)}px > viewport ${W}px`); });
  const m=document.querySelector('main'); if(m && m.getBoundingClientRect().height<40) errs.push('main quase vazio');
  return { route:location.pathname, vw:W, pass:errs.length===0, errs, warn }; })()
```

Checa: **sem overflow horizontal** (o sintoma nº1 de width/max-width/padding
errado), landmarks presentes e não colapsados, nenhum `.container` mais largo que
a viewport, `main` não-vazio. `pass:false` em qualquer rota = regressão estrutural.

## 4. Detectar visual — diff de screenshots (antes/depois)

Para regressões cosméticas que os asserts não pegam (cor, fonte, espaçamento,
borda que sumiu):

1. **Antes** da mudança, capture a superfície → `baseline/` (1 PNG por rota×vw;
   nomeie `home-desktop.png`, `home-mobile.png`, `produto-desktop.png`…). Use a
   **aba dedicada** (ver qa-checklist) e `screenshot save_to_disk:true`.
2. Faça a mudança, `build:css`, sync.
3. Capture a MESMA superfície (mesmos nomes) → `current/`.
4. `python scripts/diff-screenshots.py baseline current` → % de diff por par +
   heatmaps em `diff/`. Revise os sinalizados: **mudança esperada = ok; mudança
   numa página/área que você não tocou = REGRESSÃO.**

**Anti-ruído** (senão o diff acusa tudo): capture no topo (`scrollTo(0,0)`),
**desligue animações/transições** injetando CSS antes do shot
(`* { animation: none !important; transition: none !important; }`), espere o load,
e evite áreas dinâmicas (carrossel auto-play, hover). O diff é **sinal**, não
veredito — o agente julga cada um.

## Quando rodar (Definition of Done)

- Mudança **local** (1 componente): asserts de layout naquela página, desktop+mobile.
- Mudança **global** (token de cor/raio/escala, `.btn`/`.input`, `.container`,
  headings): **varra a superfície inteira** — asserts de layout em todas as rotas
  ×viewports + (para mudanças grandes) o diff de screenshots antes/depois.
- Sempre o **smoke test** do caminho primário antes de `theme promote`.
