# Contrato de input — pasta de marca rica (FALLBACK)

> ⚠️ **Este é o caminho de fallback.** O input canônico da skill é o **brand-kit**
> (`../../shared/brand-kit-spec/brand-kit.spec.md`) — leve, já normalizado pela
> Skill 1 e desenhado pela Skill 2. Use a auto-descoberta abaixo só quando **não
> houver brand-kit**, mas existir uma **pasta de marca rica** pré-existente. Nesse
> caso, extraia o mesmo perfil de papéis e, se faltar o bloco `commerce`/comps,
> rode a Skill 2 antes de implementar.

Quando cair no fallback, a skill recebe uma **pasta de artefatos de marca** e
dela extrai um **perfil de marca** normalizado. O contrato é **flexível por
design**: adapta-se a qualquer organização via auto-descoberta, e um
`brand.manifest.json` opcional remove ambiguidade.

> Nenhuma estrutura específica é obrigatória — cada marca organiza a pasta de um
> jeito, e a skill se adapta via auto-descoberta mesmo assim.

## O que a skill precisa extrair (o perfil de marca)

Independente de como a pasta está organizada, o objetivo é preencher este perfil:

| Campo | O que é | Obrigatório? |
|---|---|---|
| `colors` | Paleta com papéis semânticos (surface, ink, muted, accent, …) + paletas nomeadas e gradientes | Sim |
| `typography` | Famílias (serif/sans/mono ou por papel) + escala + tracking/leading | Sim |
| `fonts` | Arquivos de fonte (.ttf/.otf/.woff2) por família/peso | Recomendado |
| `logos` | Logotipo, símbolo e variantes (claro/escuro, horizontal/vertical) | Recomendado |
| `reference_layouts` | HTMLs de layout que mostram seções e hierarquia (intenção de design) | Opcional |
| `verbal` | Voz, mensagens, tagline — para microcopy on-brand | Opcional |
| `imagery` | Fotos de produto/editorial/UGC para placeholders/exemplos | Opcional |

Cores e tipografia são o mínimo viável: sem eles não há reskin. O resto eleva a
fidelidade.

## Precedência: manifesto > heurística

1. Se existe `brand.manifest.json` na raiz da pasta (ou caminho informado), ele
   é a fonte autoritativa. Campos ausentes caem na auto-descoberta.
2. Sem manifesto, use **só** auto-descoberta.
3. Sempre apresente o perfil extraído ao usuário e confirme antes da Fase 2.

## Heurísticas de auto-descoberta

Varra a pasta recursivamente (ignore `node_modules`, `.git`, `human/`, binários
de referência). Procure por:

### Cores
- **JSON de tokens**: arquivos contendo objetos com chaves `hex`/`rgb` (ex.:
  `colors.json`, `tokens/*.json`, `*tokens*`). Padrão observado: paletas nomeadas
  (`primary`, `extended`) com `_meta.role`/`_meta.mood`, mais `gradients`.
- **CSS custom properties**: arquivos `.css` com variáveis tipo `--<prefixo>-<nome>: #hex`
  e papéis semânticos (`--*-surface`, `--*-ink`, `--*-accent`). (Ex.: um arquivo de
  tokens com prefixo próprio da marca, tipo `--<marca>-`.)
- Derive os **papéis semânticos** (surface, surface-dark, ink, ink-inverse,
  muted, accent). Se a marca já os declara, use; senão, infira a partir da
  paleta (mais claro→surface, mais escuro→ink, cor de destaque→accent).

### Tipografia
- No mesmo CSS de tokens: variáveis `--*-font-*` (famílias), `--*-text-*`
  (escala), `--*-*-tracking`/`--*-*-leading`.
- `@font-face` em arquivos `fonts.css` apontando para os arquivos de fonte.
- Mapeie cada família a um papel (display / heading / body / mono). Ex. comum:
  serif p/ display, grotesk p/ heading, mono p/ corpo ou dados.

### Fontes
- Arquivos `.ttf`/`.otf`/`.woff2` (frequentemente em `fonts/<Familia>/`).
- Anote família, peso(s) e se é variável (`VariableFont` no nome).
- `.woff2` é preferível por tamanho; se só houver `.ttf`, use assim mesmo.

### Logos e símbolos
- SVGs com nomes tipo `logo*`, `logotype*`, `symbol*`, `brand*`. Prefira SVG
  (recolorível, escalável). Identifique variantes por sufixo:
  vertical/horizontal, e claro/escuro (ex.: sufixos como `-dark`/`-light`).

### Layouts de referência (intenção de design)
- `.html` que representam páginas (home, produto…), normalmente em
  `artifacts/`, `examples/`, `web/`. Ignore backups (prefixo `_` ou `.bak`).
- Para cada um, extraia **seções e hierarquia** (hero, vitrine/grid, editorial,
  newsletter, footer…), não o CSS. Esse é o guia de layout da Fase 4.

### Camada verbal (opcional)
- `.md`/`.yaml` com voz, mensagens, tagline, naming. Use para microcopy
  (CTAs, títulos de seção, alt text) coerente com a marca.

## Schema do `brand.manifest.json` (opcional)

Quando presente, declara explicitamente onde está cada coisa, evitando
adivinhação. Todos os caminhos são relativos à pasta de marca. Ver exemplo
completo em `../assets/brand.manifest.example.json`.

```json
{
  "$schema": "li-render-store-builder/brand-manifest",
  "name": "Nome da Marca",
  "store": { "handle": "minha-loja", "theme_name": "meu-tema" },
  "colors": {
    "tokens": "visual/tokens/colors.json",
    "css_vars": "visual/colors_and_type.css",
    "roles": {
      "surface": "claro", "surface_dark": "escuro",
      "ink": "escuro", "ink_inverse": "claro",
      "muted": "neutro-medio", "accent": "destaque"
    }
  },
  "typography": {
    "css_vars": "visual/colors_and_type.css",
    "fontface": "visual/fonts/fonts.css",
    "roles": { "display": "serif", "heading": "grotesk", "body": "mono" }
  },
  "fonts_dir": "visual/fonts",
  "logos": {
    "dir": "visual/assets",
    "primary": "logotype.svg",
    "symbol": "symbol.svg",
    "variants": { "dark": "logotype-dark.svg", "light": "logotype-light.svg" }
  },
  "reference_layouts": [
    "visual/artifacts/web/index.html"
  ],
  "verbal_dir": "verbal",
  "imagery_dir": "visual/assets"
}
```

`store.handle` e `store.theme_name` no manifesto são convenientes, mas **confirme
sempre com o usuário** antes de criar/deployar — a conta é uma decisão sensível e
não deve ser inferida silenciosamente de um arquivo.
