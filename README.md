# li-render-skill

Projeto para construir uma **skill de implementação de loja na Loja Integrada**
usando o renderizador **LI Render** (theme-as-code: JSON de páginas + Liquid +
funções de dados, gerenciado pela CLI `li-cli`).

A skill é **genérica por conta**: pega uma **pasta de artefatos de marca** (brand
book, tokens de cor/tipografia, fontes, logos, HTMLs de layout) e produz um
**tema deployado e testado** na conta do lojista. Primeiro caso de validação: a
loja online da **Ora Lingerie**.

## Estrutura

```
li-render-store-builder/        ← a skill
├── SKILL.md                    ← workflow em 6 fases
├── references/
│   ├── li-render.md            ← CLI + renderizador (base técnica)
│   ├── brand-input-contract.md ← formato da pasta de marca (auto-descoberta + manifesto)
│   ├── page-json-recipes.md    ← JSONs + Liquid p/ home/categoria/produto/partials
│   ├── litheme-structure.md    ← STUB: preencher ao rodar a Ora de verdade
│   └── qa-checklist.md         ← verificação no preview
└── assets/
    └── brand.manifest.example.json
```

## Decisões de design (v1)
- **Input:** auto-descoberta da pasta + `brand.manifest.json` opcional.
- **Base:** adaptar o litheme (pull + reskin), não construir do zero.
- **Escopo v1:** home + categoria + produto + partials (header/footer/minicart).
- **HTML de referência:** intenção de design; tokens são a fonte da verdade.

## Estado
- [x] Levantamento da doc oficial do LI Render (CLI + renderizador)
- [x] Scaffold da skill (SKILL.md + references + assets)
- [x] Contrato de input da pasta de marca
- [ ] **Validar ponta-a-ponta construindo o tema da Ora** (preenche `litheme-structure.md`)
- [ ] Evals + iteração no skill-creator; empacotar `.skill`

## Referências
- Doc oficial (espelhada na preview da Ora): https://ora-lingerie-preview.lojas.li/.docs/
- Notas técnicas: [li-render-store-builder/references/li-render.md](li-render-store-builder/references/li-render.md)
