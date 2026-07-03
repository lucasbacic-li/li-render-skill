# migration-inventory — contrato de paridade de migração (v1)

O terceiro contrato compartilhado do kit LI Render. O `brand-kit` carrega **dado**
(identidade + commerce + theme_mode); o `litheme-capabilities` carrega **restrição**;
este carrega **paridade**: *o que existe no site-fonte e precisa migrar* — nos eixos
que um screenshot não prova (**funcional** + **conteúdo**).

- A **Skill 2** (`store-design-composer`) **produz** o inventário (varrendo o
  site-fonte com o catálogo `references/content-surfaces.md`) e o usa como alvo de
  cobertura dos comps.
- A **Skill 3** (`li-render-store-builder`) **consome** o inventário como **contrato
  de migração**: reskina o `native`, implementa o `build-custom`, e reporta paridade
  por superfície no preview ao vivo.

> O **catálogo** (matrizes canônicas BR por superfície, os três baldes de esforço, o
> método de varredura) vive em
> `../../store-design-composer/references/content-surfaces.md`. **Este arquivo é o
> contrato de DADO** (a forma do JSON). Em caso de divergência, este manda na forma.

## Formato em disco (saída por loja, NÃO no repo da skill)

Gravado na **pasta do kit**, ao lado de `comps/` e `brand.kit.json`:

- `<kit>/migration-inventory.json` — o contrato máquina-checável.
- `<kit>/INVENTORY.md` — projeção legível gerada do JSON, para o **gate humano** (Fase 5).

## `migration-inventory.json` — forma

```jsonc
{
  "$schema": "li-render/migration-inventory@1",
  "source": { "url": "https://loja-fonte.com.br", "platform": "loja-integrada" },
  "surfaces": {                      // OPCIONAL: fatos de superfície (meta), não itens
    "nav":    { "type": "mega-menu", "depth": 3, "curated": false },
    "minicart": { "ref": "commerce.minicart" }   // PLP/PDP/minicart apontam pro kit
  },
  "items": [ /* ver schema do item abaixo */ ],
  "summary": {                       // OPCIONAL: contagens (geradas; não fonte de verdade)
    "by_priority": { "must": 0, "should": 0, "optional": 0 },
    "by_decision": { "migrate": 0, "modernize": 0, "build-custom": 0, "reintegrate-app": 0, "drop": 0 }
  }
}
```

## Schema do item (a unidade — um bloco/capacidade, ~30–60 itens)

```jsonc
{
  "id": "footer.seal.payment",         // slug estável: surface.grupo.nome
  "surface": "header",                  // header|nav|home|footer|global|app
  "axis": "content",                    // functional | content  (estilo NÃO entra aqui)
  "label": "Bandeiras de pagamento + Pix/boleto",
  "evidence": "reference/home.bands.json#30; reference/home.full.png",   // PROVA do RENDER (índice da faixa no bands.json + região do full.png), não memória nem grep de HTML cru
  "priority": "must",                   // must | should | optional
  "litheme_support": "native",          // native|native-restructure|none|app-section|store-app
  "decision": "migrate",                // migrate|modernize|build-custom|reintegrate-app|drop
  "rationale": "",                      // OBRIGATÓRIO se decision ∉ {migrate}
  "behavior": null,                     // functional: "abre no hover", "CEP→frete"; senão null
  "data_source": null,                  // função de dado litheme (get_category_tree…) ou null
  "target": "comps/components/footer.html",  // comp + componente litheme que materializa
  "status": "todo",                     // todo|present|dropped (loop do comp / re-check Skill 3)
  "content_loaded": "unknown"           // OPCIONAL p/ itens cujo CONTEÚDO vem de dado/settings
                                        // (catálogo, árvore de categorias da nav, banners, copy de
                                        // faixa, dados legais): true|false|unknown. É o estado de
                                        // MIGRAÇÃO DO CONTEÚDO na conta-alvo, separado de `status`
                                        // (que é a presença do BLOCO/template). Ver §"Paridade de
                                        // conteúdo" e a Skill 3 (que re-verifica no preview ao vivo).
}
```

### Enums e regras de campo

| Campo | Domínio | Regra |
|---|---|---|
| `surface` | `header` `nav` `home` `footer` `global` `app` | onde o bloco vive |
| `axis` | `functional` `content` | estilo é coberto pelo diff visual do comp, não aqui |
| `priority` | `must` `should` `optional` | `must` = perder vira regressão de conversão/confiança/legal |
| `litheme_support` | `native` `native-restructure` `none` `app-section` `store-app` | o balde de esforço (ver content-surfaces) |
| `decision` | `migrate` `modernize` `build-custom` `reintegrate-app` `drop` | `migrate`/`modernize` exigem `native`/`native-restructure`; `reintegrate-app` casa com `store-app` |
| `rationale` | string | **obrigatório** quando `decision` ≠ `migrate` |
| `status` | `todo` `present` `dropped` | a Skill 2 fecha no loop; a Skill 3 re-verifica no preview |

> **Coerência `litheme_support` × `decision`** (a Skill 2 garante, não é validada por
> schema): `native`→`migrate`/`modernize`; `native-restructure`→`modernize`/`build-custom`;
> `none`→`build-custom`/`drop`; `app-section`→`migrate`/`build-custom`/`drop`;
> `store-app`→`reintegrate-app`/`drop`.

> 🔒 **Forkar é o DEFAULT; `build-custom`/`native-restructure` é o caso COMUM, não a exceção.**
> Reestruturar o componente para casar o comp é o valor do LI Render — não exige justificativa
> pesada. **Só 3 componentes preservam o nativo por default** (comportamento de conversão que
> recriar quebra) e portanto saem `native`→`migrate`/`modernize`, com o comp espelhando o nativo:
> **(1) mini-cart** (desconto progressivo/frete-grátis/cupom/CEP), **(2) prévia de busca ao vivo/
> autocomplete** (prateleira + sugestões), **(3) filtros de busca** (filtros nativos; só mudam sob
> pedido explícito). **Para todo o resto (header, footer, PDP/buy-box, product-card, seções de
> home, layout da PLP), o default é forkar** — marque `build-custom`/`native-restructure` quando o
> comp diverge do nativo (quase sempre), para a Skill 3 **reestruturar** em vez de reskinar o
> nativo por acidente. Marcar `native`/`migrate` um componente cujo comp diverge do nativo é o
> erro que faz a Skill 3 ficar **presa no layout nativo** (ver `../litheme-capabilities/`).
> Ver o catálogo (`../../store-design-composer/references/content-surfaces.md`) para a classificação
> por superfície.

> 🔬 **`evidence` é prova de RENDER, e ausência exige render.** Todo item cita o
> baseline renderado (índice da faixa no `reference/*.bands.json` + região no `*.full.png`),
> nunca memória nem `grep` de HTML cru. ⚠️ **`drop` por inexistência** (afirmar que o fonte
> *não tem* uma faixa) só é válido se a faixa **não está no `bands.json`** — um grep que deu 0
> **não prova ausência** (faixas injetadas por JS — tarja de aviso, USP, banners por
> template-literal — não aparecem no `curl` mas estão no render). Dropar como "inexistente" o
> que o render mostra é o anti-padrão que quebra a paridade.

> ⚠️ **`store-app`/dado cobre o MECANISMO, não isenta da PARIDADE.** Dizer que um bloco
> "vem de dado/settings, fora do template" responde **como** ele entra — **não** se ele
> está presente e fiel ao fonte. O item continua sendo **contabilizado na paridade de
> conteúdo** (campo `content_loaded`); "é dado" nunca é desculpa para parar de checar.

## Paridade de conteúdo é first-class (não "dado = fora de escopo")

O eixo `axis: content` cobre os blocos cujo **conteúdo vem de dado/settings da loja**, não do
template: **catálogo/vitrines**, **árvore de categorias da nav** (mega-menu), **banners do
hero/showcase**, **copy de faixas** (anúncio, USP/benefícios, CTAs de seção), **dados legais
(CNPJ/razão social)**. Eles entram no inventário como itens normais — com `content_loaded`
registrando se o conteúdo do fonte já foi **carregado na conta-alvo**.

> 🔴 **"O template não carrega o dado" ≠ "a paridade de conteúdo está ok".** Se a conta-alvo
> não tem o catálogo/categorias/banners/textos do fonte carregados (ex.: renderiza um **seed
> genérico**), isso é uma **LACUNA DE MIGRAÇÃO reportada** — o trabalho **não está completo** —,
> não um item silenciosamente "presente". O reskin pode estar perfeito e a loja ainda não ter
> paridade nenhuma de conteúdo. Os dois eixos (template/estilo **e** conteúdo) são checados.

> ⚠️ **Escopo de verificação: paridade de conteúdo só é verificável com o conteúdo do fonte
> CARREGADO na conta-alvo.** Numa conta de teste com seed genérico, a checagem de conteúdo é
> **inconclusiva** — o inventário/relatório deve dizer isso explicitamente. "O seed renderiza"
> **não** é "o conteúdo do lojista migrou". A Skill 3 marca `content_loaded: false|unknown` e
> reporta a pendência de import de catálogo/categorias/banners (config de loja).

## Gate = só alerta, nunca bloqueia

Nenhum bloqueio programático. O **único portão é a aprovação humana** (Fase 5 da
Skill 2). O inventário é instrumento de **visibilidade**:

- `INVENTORY.md` destaca no topo os `must` com `decision: drop` ou `status: todo`
  (faltando), e lista os `build-custom`/`reintegrate-app` (esforço/risco que o cliente assume).
- **Lacunas de CONTEÚDO no topo, com a mesma proeminência dos `must`:** itens `axis: content`
  com `content_loaded: false|unknown` (catálogo/nav/banners/copy do fonte ausentes ou
  divergentes na conta-alvo) são destacados como **paridade de conteúdo pendente** — não
  somem em "é dado". ⚠️ Classificar conteúdo divergente como "dado, fora de escopo" e encerrar
  o assunto é o anti-padrão que **mascara a falta de paridade** e faz um gate passar uma loja
  sem nenhum conteúdo do lojista.
- **Condição de sucesso do loop do comp** = **0 item não-contabilizado** (todo item
  ou `present`, ou `drop`/`reintegrate-app` com `rationale`) — **não** "0 must faltando".
- A Skill 3 reporta paridade por superfície no preview ao vivo e destaca lacunas `must`
  **e lacunas de conteúdo** (`content_loaded` false/unknown); também **não** hard-blocka
  `promote` (decisão do usuário).

## Versionamento

`$schema: "li-render/migration-inventory@1"` fixa a major. Campos novos opcionais não
sobem a major; quebras vão para `@2`.
