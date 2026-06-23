# Gravar a pasta do kit

Fase 3: materializar o perfil destilado no formato do contrato
(`../shared/brand-kit-spec/brand-kit.spec.md`). A pasta tem 3 arquivos de texto +
`assets/` + `reference/`.

## Estrutura a gravar

```
<marca>-kit/
├── brand.kit.json     ← fonte da verdade (seguir o spec exatamente)
├── tokens.css         ← espelho construível (gerado do JSON)
├── GUIDELINES.md      ← resumo legível (gerado do JSON)
├── assets/
│   ├── logo.svg / symbol.svg / favicon.png
│   ├── fonts/         ← só se source:"file"
│   └── imagery/       ← amostras (referência)
└── reference/         ← screenshots da origem
```

## `brand.kit.json`
- Seguir os campos e domínios do spec. `commerce: null`. `source.captured_at` é
  a data corrente (peça ao ambiente; não invente).
- Listar todos os caminhos incertos em `_uncertain`.

## `tokens.css` (espelho)
CSS custom properties geradas a partir de `colors.roles` + `typography`. É o que a
Skill 3 pode injetar/consultar diretamente. Forma:

```css
:root {
  /* cores — papéis */
  --bk-surface: #FAF6EF;
  --bk-surface-alt: #EFE7DA;
  --bk-surface-dark: #1F1B16;
  --bk-ink: #1F1B16;
  --bk-ink-muted: #6F665B;
  --bk-ink-inverse: #FAF6EF;
  --bk-line: #E0D8CA;
  --bk-accent: #B0654A;
  --bk-accent-ink: #FAF6EF;

  /* tipografia — papéis */
  --bk-font-display: Fraunces, Georgia, serif;
  --bk-font-heading: Inter, system-ui, sans-serif;
  --bk-font-body: Inter, system-ui, sans-serif;
  --bk-font-mono: 'IBM Plex Mono', ui-monospace, monospace;

  /* raio */
  --bk-radius-field: 0.25rem;
  --bk-radius-box: 0.5rem;
  --bk-radius-selector: 0.25rem;
}
```

Prefixo `--bk-` (brand-kit) para não colidir com tokens do tema. Resolver papéis
que apontam para nomes da `palette` ao hex final.

## `GUIDELINES.md` (resumo humano)
Uma página: nome + fonte, swatches de cor com papel e hex, par tipográfico,
logo, raio, voz/tagline, e uma seção **"A confirmar"** listando `_uncertain`.
É o que o parceiro lê na Fase 4.

## assets/ e reference/
- Logos/símbolos/favicon normalizados (SVG quando possível).
- `fonts/` só com `.woff2`/`.ttf` self-hosted (source:"file").
- `imagery/` com 1–3 amostras representativas (hero/produto/editorial).
- `reference/` com os screenshots da origem — **referência, não build**.

## Checagem final antes da Fase 4
- [ ] `brand.kit.json` valida contra o spec (9 papéis de cor, papéis de tipo).
- [ ] `commerce` é `null`.
- [ ] `tokens.css` e `GUIDELINES.md` batem com o JSON.
- [ ] Todo caminho de asset no JSON existe em disco.
- [ ] `_uncertain` lista honestamente o que foi inferido com baixa confiança.

> Para evitar drift entre `brand.kit.json`, `tokens.css` e `GUIDELINES.md`, gere
> `tokens.css`/`GUIDELINES.md` a partir do JSON (fonte única de verdade) sempre que
> possível, em vez de escrevê-los à mão em paralelo.
