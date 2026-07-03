# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Ainda não
usamos versionamento semântico formal — cada entrada corresponde a um PR/marco do kit de
skills. O estado *atual* (o que já funciona vs. o que falta) fica em
[README.md § Estado](README.md#estado); este arquivo é o histórico de como chegamos lá.

## [Não lançado] — PR #3

### Added
- **Baseline RENDERADO na Skill 1** (`scripts/capture-source.mjs`, Chrome headless):
  `rendered.html` (DOM pós-JS) + `bands.json` (torre de faixas) + `full.png`, gravados em
  `reference/` — vira o ground-truth de diff da Skill 2, falha-fechado sem ele.
- **Inventário de paridade de migração**: novo passo estrutural na Skill 2 (Fase 2) que
  audita o site-fonte contra um catálogo canônico BR
  (`store-design-composer/references/content-surfaces.md`) e produz
  `migration-inventory.json` (contrato novo, `skills/shared/migration-inventory-spec/`),
  consumido pela Skill 3. Gate do inventário **só alerta, nunca bloqueia** — decisão final
  é sempre do humano (Fase 5).
- **`theme_mode`** no brand-kit: a Skill 2 decide um modo único (light **ou** dark) como
  default; misturas inconsistentes do site-fonte viram débito de usabilidade, não paridade
  a preservar. O dark-chrome híbrido deixa de ser método padrão e vira exceção isolada e
  deliberada (`li-render-store-builder/references/dark-hybrid-exception.md`).
- **Campo `layout`** no brand-kit (`contained`/`fluid-up`, `max_width`, `gutter`,
  `full_bleed`) para a decisão recorrente de largura, consumido pelas 3 skills.
- **Craft "herdar × ganhar"** (`store-design-composer/references/design-quality.md`):
  régua que separa identidade a herdar do kit (não reinventar) de craft mecânico a ganhar
  na migração (layout/contraste/estados/responsivo/motion).

### Changed
- **Skill 2 reframada em 2 papéis**: (a) auditar paridade funcional + de conteúdo do
  site-fonte; (b) aplicar os tokens do kit e modernizar sem perder paridade. Passa de 4
  para 5 fases.
- **Enforcement hardening do gate da Skill 3**: "pronto" vira artefato, não veredito —
  `locked` exige evidência de diff **e** um verificador diferente de quem implementou; o
  orquestrador não edita mais nenhum arquivo (fundação inclusa, sempre por sub-agente); a
  Skill 3 sempre começa em sessão fresca.

### Fixed
- Vazamentos de literais de conta de teste (changelog do README, `.claude/launch.json`
  não rastreado) e `.gitignore` reforçado para `.claude/` inteiro (arquivos locais de
  sessão nunca pertencem ao repo distribuído).
- Inconsistências entre docs introduzidas pela renumeração de fases da Skill 2:
  numeração do gate de aprovação, obrigatoriedade do campo `reference` no brand-kit,
  formato de `evidence` no exemplo do inventário.
- `README.md § Estado` estava subrepresentando o tamanho da mudança e com o item
  "empacotar como plugin" ainda pendente apesar de já entregue no PR #2 — reescrito.

## 2026-06-23 — Empacotamento como plugin do Claude Code (PR #2, `03c7188`)

### Added
- `.claude-plugin/plugin.json` (plugin `li-render`) e `.claude-plugin/marketplace.json`
  (marketplace `li-render-skills`), permitindo instalação por agências via
  `/plugin marketplace add` + `/plugin install`.
- Seção de instalação no README.

### Changed
- As 3 skills + `shared/` movidas para `skills/` (preservando os links `../shared/`
  entre elas).

## 2026-06-23 — Cleanup geral + rename das skills (PR #1, `3641a10`)

### Added
- Contratos `shared/` (brand-kit + litheme-capabilities) passam a ser versionados
  (antes untracked).
- README reescrito com 2 diagramas (fluxo das 3 skills + orquestração interna da
  Skill 3) e glossário.

### Changed
- Skills renomeadas para a ordem de chamada (A/C/B eram confusos): **Skill 1**
  `brand-kit-extractor` (extrai) → **Skill 2** `store-design-composer` (desenha) →
  **Skill 3** `li-render-store-builder` (implementa).
- Convenções de token que embutiam cor de marca generalizadas (`.bk-on-navy` →
  `.bk-on-dark`, `--bk-line-on-navy` → `-on-dark`).

### Removed
- De-branding: nome/domínio/conta e hex de um caso real removidos das references (a
  skill é distribuída a agências e deve ser agnóstica de marca). Build de caso
  (`builds/ora`) removido do versionamento — output específico de marca vive fora da
  skill viva.

### Fixed
- Redirect de preview stale, método de resize do preview (CDP em vez de Chrome-MCP
  bloqueado), troca condicional de `--font-sans`, contagem de papéis de cor.

---

Commits anteriores a `3641a10` eram trabalho de caso específico (protótipo pré-cleanup,
antes da skill ser generalizada e distribuída) — não documentados aqui porque o
conteúdo já foi removido/generalizado nos marcos acima.
