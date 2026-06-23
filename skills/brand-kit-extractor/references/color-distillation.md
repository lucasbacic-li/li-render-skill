# Destilação: do CSS ruidoso aos papéis

Um site real expõe dezenas de cores e várias fontes. O kit precisa de **9 papéis
de cor obrigatórios (+ até 2 opcionais de accent secundário)** e **2–3 famílias**.
Esta é a lógica de redução (Fase 2).

## Cores → papéis

### 1. Coletar com frequência e contexto
Para cada cor encontrada, guarde **onde** aparece (é `background` de `body`? `color`
de texto? `border`? `background` de `button`/`a`?) e **quão frequente** é. O
contexto importa mais que a frequência pura.

### 2. Atribuir aos papéis (heurística)

| Papel | Como inferir |
|---|---|
| `surface` | `background-color` do `body`/`main` — quase sempre a cor mais clara e frequente |
| `surface_alt` | fundo de seções/cards distinto do surface (segundo fundo mais comum) |
| `surface_dark` | fundo de footer/seções invertidas — a cor escura mais usada como *fundo* |
| `ink` | `color` do corpo de texto — a cor escura mais usada como *texto* |
| `ink_muted` | cor de texto secundário/meta (cinza intermediário) |
| `ink_inverse` | texto sobre `surface_dark` (geralmente = surface) |
| `line` | cor de `border`/`hr` mais comum (clara, baixo contraste) |
| `accent` | cor de `a`/`button` primário/`:hover` que destoa dos neutros (a cromática mais usada em ação) |
| `accent_ink` | texto sobre o accent (checar contraste; geralmente surface ou ink) |
| `accent_secondary` (opcional) | uma SEGUNDA cromática proeminente (ex.: verde de preço/disponibilidade ao lado do azul de ação). Registre quando houver **duas** cromáticas distintas, não force uma só. + `accent_secondary_ink`. |

> ⚠️ **Frequência dá VALORES; só o screenshot dá PAPÉIS com segurança.** A análise
> de CSS é ótima pra achar os hexes, mas mente sobre os papéis. Dois erros clássicos
> (vistos em caso real):
> - **Surface claro vs escuro:** branco pode dominar a contagem por causa dos cards,
>   enquanto o **chrome** (header/nav/hero/home) é escuro. Veja o screenshot: o
>   `surface` é o fundo das **páginas de conteúdo** (PLP/PDP); o `surface_dark` é o
>   chrome — e podem ser opostos do que a frequência sugere.
> - **Qual cromática é o CTA:** a cor de **conversão** (a do **botão de compra na
>   PDP**) é a que vira `accent` (→ `--color-primary`), não a mais frequente. Marcas
>   com duas cromáticas costumam separar **CTA/conversão** de **marca/navegação**
>   (em caso real: um accent = compra, outro = marca). Identifique o CTA olhando o botão de
>   compra, não a contagem.
>
> **Regra:** não feche os PAPÉIS de cor sem ver pelo menos a **home + uma PDP**
> renderizadas. (É por isso que `reference/` é parte do Definition of Done.)

### 3. Regras de sanidade
- **Quantizar**: cores a < ~5% de distância (ΔE perceptual aproximado) colapsam
  numa só. Não registre 4 quase-pretos — registre `ink`.
- **Neutros vs cromáticos**: separe por saturação. Baixa saturação = escala de
  neutros (surface/ink/line). Alta saturação = candidatos a `accent`/gradiente.
- **Contraste**: garanta que `ink` sobre `surface` e `accent_ink` sobre `accent`
  passem em legibilidade (~WCAG AA). Se não passarem, marque `_uncertain`.
- **Sempre produza os 9 papéis.** Se faltar (ex.: site sem accent claro), repita
  o vizinho mais próximo e adicione o caminho a `_uncertain`.

### 4. Gradientes (opcional)
Se houver `linear-gradient` proeminente (hero/botões), registre os stops como um
gradiente nomeado. Marcar `_uncertain` se reconstruído por aproximação.

## Tipografia → famílias e papéis

1. Leia `font-family` **computado ao vivo** de seletores-chave: `body` → `body`;
   `h1` → `display`; `h2`/`h3` → `heading`; elementos mono/`code`/labels → `mono`.
   > ⚠️ **Não confie no `<link>` do `<head>` nem na frequência no CSS** — ambos
   > mentem. O `<head>` pode carregar uma fonte que o tema sobrescreve com
   > `font-family:…!important`, e a fonte real pode ser injetada por JS/widget (fora
   > do `<head>`). Com browser, rode na página: `getComputedStyle(h1).fontFamily`
   > **e** `[...document.fonts].map(f=>f.family+':'+f.weight)`. A 1ª dá a família
   > que pinta + o **peso** (ex.: display 900/"black"); a 2ª prova que está
   > carregada. (Em caso real: o `<head>` carregava uma fonte decoy e o render usava
   > outra família — confirme o real; sem isso o kit sai com a fonte errada.)
2. **Resolva a 1ª família real da stack** (ignore fallbacks `serif`/`sans-serif`/
   `system-ui`). Classifique serif vs sans pelo nome/conhecimento.
3. **Source**: se a família vem de `fonts.googleapis.com`, `source: "google"`.
   Se é `@font-face` self-hosted, baixe o `.woff2` para `assets/fonts/` e
   `source: "file"`. Famílias de sistema → stack só com fallbacks.
4. Liste cada família **uma vez** em `families`; aponte papéis para ela em
   `roles`. Marca com 1 só fonte → vários papéis na mesma chave.
5. `scale`/`tracking`/`leading` são opcionais — só registre se forem distintivos
   no site; senão deixe a Skill 3 usar defaults.

## Raio → linguagem de cantos
Amostre `border-radius` de botões e cards:
- ~0 → `scale: "sharp"` (tokens 0 / 0 / 0.125rem)
- pequeno (2–6px) → `scale: "soft"`
- grande/pill (≥12px ou 9999px) → `scale: "round"`

## O que NÃO destilar
Sombras, animações, espaçamentos finos, breakpoints — fora do escopo do kit. O
kit carrega *identidade*, não o layout do site de origem.
