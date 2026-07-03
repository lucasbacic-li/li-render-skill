# brand-kit — contrato compartilhado (v1)

Este é o **contrato de dados** que atravessa as três skills do kit LI Render:

- **`brand-kit-extractor`** (A, produtor) lê uma URL (ou, futuramente, um Figma)
  e **escreve** um brand-kit (identidade da marca; `commerce: null`).
- **`store-design-composer`** (C, designer) **lê** o kit, decide as superfícies de
  commerce e **enriquece** o kit (preenche `commerce` + grava `comps/`).
- **`li-render-store-builder`** (B, consumidor) **lê** o kit já desenhado e
  implementa o tema na Loja Integrada, verificando contra os `comps/`.

O brand-kit é a fronteira entre elas. Ele é **leve, autocontido e legível por
agente** — inspirado no princípio do "brand atomic system" (texto estruturado =
construível; raster = só referência), mas colapsado num formato simples que sai
de um scrape ou de um arquivo de design.

> **Princípio de formato.** Tudo que o tema precisa para *construir* vive como
> texto estruturado (`.json`, `.css`, `.svg`). Capturas de tela e fotos (`.png`,
> `.jpg`) ficam confinadas a `reference/` e `assets/imagery/` como **referência** —
> nunca como fonte de build. Um agente pode olhar um PNG, mas não constrói a
> partir dele.

---

## Formato em disco

Um brand-kit é uma **pasta** com esta forma. Só `brand.kit.json` é obrigatório;
o resto eleva a fidelidade.

```
<marca>-kit/
├── brand.kit.json     ← FONTE ÚNICA DA VERDADE (este contrato)
├── tokens.css         ← espelho construível das cores/tipos (gerado do JSON)
├── GUIDELINES.md      ← resumo legível por humano (gerado do JSON)
├── assets/
│   ├── logo.svg           ← logotipo principal (preferir SVG)
│   ├── symbol.svg         ← símbolo/ícone da marca (opcional)
│   ├── favicon.png        ← opcional
│   ├── fonts/             ← .woff2/.ttf quando self-hosted (opcional)
│   └── imagery/           ← amostras (hero/produto/editorial) — referência
├── reference/             ← baseline RENDERADO da fonte: <label>.rendered.html + .bands.json + .full.png
└── comps/                 ← maquetes HTML fiéis do ALVO (gravadas pela Skill 2)
    ├── components/        ← 1 comp por COMPONENTE (header, footer, card, buy-box, minicart…) — alvo 1:1 isolado
    └── pages/             ← comps de COMPOSIÇÃO (home, PLP, PDP) — só ordenam componentes
```

**Quem escreve o quê:**
- A **Skill 1** escreve tudo menos `commerce` (que sai `null`): ela conhece a
  marca, não as superfícies de loja.
- A **Skill 2** *enriquece* o mesmo arquivo preenchendo o bloco `commerce`
  (mini-cart, busca/PLP, PDP) — derivado das primitivas + elicitado com o
  parceiro/cliente — e grava as maquetes HTML fiéis em `comps/`. Assim a decisão
  de design fica **registrada, aprovável e reproduzível** no kit.
- A **Skill 3** consome o kit já desenhado: implementa no litheme e **verifica o
  preview ao vivo contra os `comps/`** (alvo diffável), sem reabrir decisões.

---

## `brand.kit.json` — campos

Legenda: **(R)** obrigatório · **(D)** recomendado · **(O)** opcional.

### Topo

| Campo | Tipo | | Descrição |
|---|---|---|---|
| `$schema` | string | R | Sempre `"li-render/brand-kit@1"`. |
| `version` | string | R | Versão do *instance* (ex.: `"1.0"`). |
| `name` | string | R | Nome da marca. |
| `source` | object | D | De onde o kit foi extraído (proveniência). |
| `store` | object | D | Identidade da conta na Loja Integrada. |
| `colors` | object | **R** | Paleta + papéis semânticos + gradientes. |
| `typography` | object | **R** | Famílias + papéis + escala. |
| `fonts` | array | D | Arquivos/fontes a carregar. |
| `logos` | object | D | Logo, símbolo, variantes, favicon. |
| `radius` | object | O | Linguagem de cantos (sharp/soft/round). |
| `imagery` | array | O | Amostras de imagem (referência). |
| `voice` | object | O | Tom + microcopy para conteúdo on-brand. |
| `reference` | array | **R** | Baseline renderado da fonte (`rendered.html` + `bands.json` + `full.png`) — alvo de diff da Skill 2. Falha-fechado: sem ele, o loop da Skill 2 não roda. |
| `commerce` | object\|null | — | **Sempre `null` na saída da Skill 1.** Preenchido pela Skill 2. |

### `source` (proveniência)

```json
"source": {
  "type": "url",                 // "url" | "figma" | "manual"
  "ref": "https://loja.com.br",  // URL ou link do Figma
  "captured_at": "2026-06-22"    // data da extração (ISO)
}
```

### `store` (conta LI)

```json
"store": { "handle": "minha-loja", "theme_name": "meu-tema" }
```

`handle` forma a URL de preview (`https://{handle}-preview.lojas.li`).
**A Skill 3 sempre confirma `handle`/`theme_name` com o usuário** antes de criar
ou deployar — a conta é decisão sensível, nunca inferida em silêncio de um arquivo.

### `colors` (R)

Três partes: a **paleta nomeada** (cores cruas descobertas), os **papéis
semânticos** (o que o tema realmente consome) e **gradientes** opcionais.

```json
"colors": {
  "palette": {
    "ink":     { "hex": "#1A1A1A", "rgb": [26, 26, 26] },
    "paper":   { "hex": "#FAF7F2", "rgb": [250, 247, 242] },
    "clay":    { "hex": "#B9836A", "rgb": [185, 131, 106] }
  },
  "roles": {
    "surface":     "paper",   // fundo principal das páginas
    "surface_alt": "#F0EBE3", // fundo secundário (cards, faixas) — token OU hex cru
    "surface_dark":"ink",     // fundo escuro (footer, seções invertidas)
    "ink":         "ink",     // texto principal
    "ink_muted":   "#6B6B6B", // texto secundário / metadados
    "ink_inverse": "paper",   // texto sobre surface_dark
    "line":        "#E3DDD3", // bordas / hairlines / divisórias
    "accent":      "clay",    // destaque / links / CTA
    "accent_ink":  "paper",   // texto sobre o accent
    "accent_secondary":     "#7C8C5A", // OPCIONAL — 2º destaque (ex.: preço/disponibilidade/sucesso)
    "accent_secondary_ink": "#FFFFFF"  // OPCIONAL — texto sobre o accent secundário
  },
  "gradients": {
    "warm": ["#B9836A", "#E3C4A8"]
  }
}
```

- **Papéis são a interface real com o tema.** O litheme (Tailwind v4 + DaisyUI v5)
  pensa em papéis (`base-100`, `base-content`, `primary`…); a Skill 3 mapeia
  estes papéis para os tokens DaisyUI. Por isso **`roles` é o que importa** — a
  `palette` é matéria-prima.
- Cada valor de `roles` pode ser **um nome da `palette`** (preferível) **ou um
  hex cru**. A Skill 1 deve sempre produzir os 9 papéis obrigatórios (surface →
  accent_ink); se não conseguir inferir um, repete o mais próximo e **anota como
  incerto** (ver `_uncertain`).
- **`accent_secondary` (+ `_ink`) é opcional, mas comum:** muitas lojas usam um
  **segundo destaque** (ex.: verde de preço/disponibilidade ao lado do azul de
  ação). Quando a origem claramente tem dois, registre os dois — mapeia para
  `--color-secondary` do DaisyUI (ver `../litheme-capabilities/`).

### `typography` (R)

```json
"typography": {
  "families": {
    "serif": { "name": "Playfair Display", "stack": "'Playfair Display', Georgia, serif", "source": "google" },
    "sans":  { "name": "Inter", "stack": "Inter, system-ui, sans-serif", "source": "google" },
    "mono":  { "name": "IBM Plex Mono", "stack": "'IBM Plex Mono', monospace", "source": "google" }
  },
  "roles": {
    "display": "serif",   // títulos de display / hero
    "heading": "sans",    // h2–h6 / subtítulos
    "body":    "sans",    // corpo de texto
    "mono":    "mono"     // dados, labels, eyebrows (opcional)
  },
  "scale":   { "base": "16px", "ratio": 1.2 },
  "tracking":{ "eyebrow": "0.08em", "heading": "0" },
  "leading": { "body": 1.6, "heading": 1.1 }
}
```

- `families` lista cada família **uma vez** (com `source: "google" | "file"`).
- `roles` mapeia papéis → chave de família. **Esses papéis casam com os papéis
  tipográficos do tema** (display serif / heading / body / mono-accent). Se a
  marca usa uma só família, aponte vários papéis para a mesma chave.
- `scale`/`tracking`/`leading` são opcionais — a Skill 3 tem defaults sensatos.

### `fonts` (D)

Como carregar cada fonte. Preferir Google Fonts (via `<link>` no `<head>` — mais
robusto no mobile); só self-hostar quando a família não está no Google.

```json
"fonts": [
  { "family": "Playfair Display", "weights": [400, 700], "source": "google" },
  { "family": "Inter", "weights": [400, 500, 600], "source": "google" },
  { "family": "Marca Custom", "weight": 400, "source": "file", "file": "assets/fonts/marca.woff2" }
]
```

> ⚠️ A Skill 3 sabe o gotcha: **nunca** declarar `@font-face` com `url(../fonts/…)`
> em `theme.css` (o caminho relativo dribla o `asset_url` assinado → 404). Self-host
> só via `<style>` Liquid no head com `{% asset_url %}`. Este contrato só registra
> *qual* fonte e *de onde*; o *como* é da Skill 3.

### `logos` (D)

```json
"logos": {
  "primary": "assets/logo.svg",
  "symbol":  "assets/symbol.svg",
  "variants": { "light": "assets/logo-light.svg", "dark": "assets/logo-dark.svg" },
  "favicon": "assets/favicon.png"
}
```

Caminhos relativos à raiz do kit. Preferir SVG (recolorível/escalável). `light`/
`dark` indicam **sobre qual fundo** o logo funciona (light = para fundo escuro).

### `radius` (O)

```json
"radius": { "scale": "sharp", "field": "0", "box": "0", "selector": "0.125rem" }
```

`scale` é um atalho semântico (`sharp` | `soft` | `round`); os três tokens
mapeiam direto para os tokens de raio do DaisyUI (`--radius-field/box/selector`).

### `imagery` (O), `voice` (O), `reference` (O)

```json
"imagery": [
  { "role": "hero",    "file": "assets/imagery/hero.jpg" },
  { "role": "product", "file": "assets/imagery/produto-01.jpg" }
],
"voice": {
  "tone": ["acolhedor", "preciso", "sem clichê"],
  "tagline": "Conforto não precisa ser sem graça.",
  "microcopy": {
    "cta_primary": "Adicionar à sacola",
    "newsletter": "Receba primeiro.",
    "empty_cart": "Sua sacola está vazia."
  }
},
"reference": [
  { "kind": "rendered-html", "of": "homepage", "file": "reference/home.rendered.html" },
  { "kind": "bands",         "of": "homepage", "file": "reference/home.bands.json" },
  { "kind": "screenshot",    "of": "homepage", "file": "reference/home.full.png" }
]
```

`imagery.role` ∈ `hero | product | editorial | ugc | other`. `voice` alimenta
microcopy on-brand (CTAs, títulos, alt text, empty states).

### `commerce` (preenchido pela Skill 2)

Sai `null` da Skill 1. A Skill 2 deriva defaults das primitivas (ex.: `radius.scale`
`sharp` → cards quadrados + divisórias hairline), **apresenta, elicita ajuste**,
grava aqui **e** materializa cada decisão num comp HTML em `comps/`. Estrutura:

```json
"commerce": {
  "minicart": {
    "type": "drawer", "side": "right",
    "line_item": "thumb-left",
    "actions": { "primary": "checkout", "secondary": "continuar-comprando" },
    "shipping_bar": false, "upsell": false
  },
  "plp": {
    "grid": { "desktop": 4, "mobile": 2 },
    "card": {
      "image_ratio": "3:4", "fit": "cover",
      "shows": ["name", "price", "rating"],
      "add_to_cart": "text-link"
    },
    "filters": "drawer", "sort": "dropdown", "pagination": "load-more"
  },
  "pdp": {
    "gallery": "stacked",
    "buy_box": { "variant_selector": "pills", "qty": true, "cta_style": "filled" },
    "info": "accordion", "cross_sell": true
  }
}
```

Domínios válidos (a Skill 2 documenta cada um em `references/commerce-surfaces.md`,
restringidos pelo contrato `../litheme-capabilities/`):
- `minicart.type`: `drawer` | `page` · `side`: `right` | `left`
- `minicart.line_item`: `thumb-left` | `thumb-top`
- `plp.card.add_to_cart`: `text-link` | `button` | `icon` | `none`
- `plp.filters`: `drawer` | `sidebar` | `topbar` · `pagination`: `pages` | `load-more` | `infinite`
- `pdp.gallery`: `stacked` | `carousel` | `grid`
- `pdp.buy_box.variant_selector`: `swatch` | `pills` | `dropdown`
- `pdp.info`: `accordion` | `tabs`

### `theme_mode` (preenchido pela Skill 2)

Sai `null` da Skill 1. É a **decisão global de modo de tema** — *um* modo para a
loja inteira. Lojas-fonte frequentemente **misturam** light/dark de forma
inconsistente (ex.: chrome dark + miolo da PDP light); isso é **débito de
usabilidade**, não identidade a preservar. A Skill 2 padroniza para **um** modo
(decisão `modernize` registrada), para que o reskin implemente um light/dark
coerente com o contraste resolvido **nativamente pelo DaisyUI** (`base-100/200/300`
+ `base-content`), sem carve-back manual.

```json
"theme_mode": {
  "mode": "light",                 // light | dark — UM modo, global
  "rationale": "fonte misturava chrome dark + PDP light; padronizado p/ light (paleta clara da marca + leitura de catálogo)",
  "inverted_sections": ["footer"]  // OPCIONAL: seções deliberadamente invertidas (acento contido), não mudança de modo
}
```

- `mode`: `light` | `dark`. Decide como os papéis de cor mapeiam para o tema DaisyUI
  (`surface`→`base-100`, `ink`→`base-content`, etc. — ver `../litheme-capabilities/`).
- `inverted_sections`: lista de seções que são **acento invertido deliberado** (ex.:
  rodapé escuro num tema light), materializadas via `surface_dark`/`ink_inverse`. NÃO
  é licença para modo ambíguo por página — é um acento contido e consistente.
- **Exceção "chrome≠conteúdo"** (híbrido, ex.: body escuro + tiles claros): cara e
  arriscada (briga com o DaisyUI → exige carve-back de contraste). Só quando a marca
  genuinamente exige; registrar como decisão consciente. O **default é modo único**.

### `layout` (preenchido pela Skill 2)

Sai `null` da Skill 1. É a **decisão global de largura** — outra escolha recorrente de
implementação (o litheme trava o conteúdo em 1280px por um `@utility container`). A
Skill 2 decide a régua **uma vez** e a Skill 3 a implementa redefinindo o `container`
(ver `../../li-render-store-builder/references/litheme-structure.md` → "Largura/
responsividade global").

```json
"layout": {
  "width": "contained",                  // contained | fluid-up
  "max_width": "1280px",                 // cap do conteúdo (contained) ou cap alto (fluid-up, ex. 1920px)
  "gutter": "clamp(16px, 4vw, 64px)",    // padding lateral do container
  "full_bleed": ["announcement", "hero", "section-bands", "footer"]  // seções que furam o cap (100vw)
}
```

- `width`: `contained` (cap fixo, como os 1280px do litheme) | `fluid-up` (o conteúdo
  **cresce com a viewport** até um cap alto/nenhum — loja "responsiva pra cima").
- `max_width` / `gutter`: o cap do conteúdo e o respiro lateral do `container`.
- `full_bleed`: lista de seções que **ignoram o cap e vão 100% de largura** mesmo num
  layout `contained` (ex.: banner full, faixa de aviso, faixas de seção escura, rodapé).
  Full-bleed ≠ fluid: o **fundo** sangra de ponta a ponta, mas o **conteúdo** da seção
  alinha no mesmo gutter/cap do resto (padrão "fundo full-bleed + conteúdo no
  `.container`"). O comp materializa essa decisão e a Skill 3 a implementa.
  > ⚠️ **`full_bleed` é decisão a MATERIALIZAR + VERIFICAR, não só armazenar.** A escolha
  > **banner contido × sangrando** é recorrente e fácil de "furar": declarada no kit e nunca
  > implementada. A Skill 2 deve **olhar o `full.png` do fonte** (o banner sangra ou para no
  > cap?) e materializar o comp igual; a Skill 3 deve **quebrar a seção para 100vw** (o litheme
  > renderiza banner/hero dentro do `.container` por padrão) e **conferir por DOM** que a largura
  > ≈ viewport. Banner preso no cap quando o fonte sangra = lacuna de paridade.

---

## Incerteza explícita (`_uncertain`)

Um kit vindo de scrape é um **rascunho**. Onde a Skill 1 não tem confiança, ela
lista o caminho do campo em `_uncertain` para a Skill 2 (e o humano) revisarem:

```json
"_uncertain": ["colors.roles.accent", "typography.roles.display"]
```

A Skill 1 **sempre apresenta o rascunho e confirma** com o parceiro antes de
fechar o kit. A Skill 2 trata `_uncertain` como itens a resolver no desenho
(antes de fechar os comps); a Skill 3 assume o kit já validado.

---

## Compatibilidade com pastas de marca ricas (legado)

As skills consumidoras (C e B) também aceitam uma **pasta de marca rica**
pré-existente (ex.: um `brand_system/` com `verbal/` + `visual/` + manifesto),
via auto-descoberta. O brand-kit é o caminho **canônico e leve** para marcas
geradas por scrape; a auto-descoberta de pasta rica é o caminho de **fallback**.
Em ambos os casos, o alvo interno é o mesmo perfil de papéis (cores/tipo/logo) +
o bloco `commerce`.

---

## Versionamento

`$schema: "li-render/brand-kit@1"` fixa a major. Mudanças retrocompatíveis
(campos novos opcionais) não sobem a major. Quebras sobem para `@2`. As três
skills declaram qual major consomem.
