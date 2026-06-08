#!/usr/bin/env bash
# audit-theme-styles.sh — varre um tema LI Render (DaisyUI + Tailwind v4) por
# "forks" de estilo: estilo introduzido por bloco em vez de via sistema global
# (tokens, @utility, papéis tipográficos). Numa base DaisyUI/Tailwind, quase TUDO
# deve ser global; cada achado é candidato a homogeneização.
#
# Rode ANTES de declarar uma mudança pronta — o objetivo é o agente pegar as
# próprias exceções, não o usuário pegar no review.
#
# Uso:   bash scripts/audit-theme-styles.sh [THEME_DIR]
#        (default = diretório atual; precisa de templates/)
#
# NÃO é gate rígido: há exceções legítimas (swatch de cor de produto é dado
# dinâmico; alguns rounded-full de avatar/pill). Revise cada um.

set -uo pipefail
DIR="${1:-.}"; T="$DIR/templates"
[ -d "$T" ] || { echo "ERRO: $T não existe. Passe o diretório do tema."; exit 1; }
b(){ printf '\n\033[1m=== %s ===\033[0m\n' "$1"; }
g(){ grep -rnE --include='*.liquid' "$@" "$T" 2>/dev/null; }
show(){ local o; o=$(cat); [ -n "$o" ] && echo "$o" || echo "ok — nenhum"; }

b "1. Cores hardcoded em classes (use tokens: text-base-content, bg-base-100, bg-neutral)"
g 'text-(black|white)|bg-(black|white)([ "/]|$)' | show

b "2. Ícone SVG com cor FIXA (use fill=\"currentColor\" p/ herdar o token Ora; máscara #D9D9D9 ignorada)"
g 'fill="#[0-9a-fA-F]{3,6}"|stroke="#[0-9a-fA-F]{3,6}"' | grep -vi '#D9D9D9' | show
echo "   ↑ hexes da paleta ANTIGA (litheme) viram off-brand pós-reskin: #0846EF azul, #27A47D verde, #FF6265 vermelho, #101828/#1C1B1F cinza."

b "3. Cor inline via style= que NÃO é swatch dinâmico de produto (deveria ser token)"
g 'style="[^"]*(color|background)' | grep -v '{{' | show

b "4. Raio explícito (a forma vem de --radius-*; rounded-* é fork — exceto pill/avatar intencional)"
g 'rounded-(none|xs|sm|md|lg|xl|2xl|3xl|box|field)([ "]|$)' | show

b "5. Fonte por bloco (use papéis: .ora-serif / .ora-grotesk / .ora-mono ou h1-h6)"
g 'font-(serif|mono)([ "]|$)|font-\[' | show

b "6. Título com estilo de CORPO (<p>/<span> grande+peso = deveria ser h1-h6)"
g '<(p|span)[^>]*text-(lg|xl|2xl|3xl)[^>]*font-(medium|semibold|bold)' | show

b "7. Tamanho fixo grande em heading (compete com a escala global; prefira o sistema/clamp)"
g '<h[1-6][^>]*text-(xl|2xl|3xl|4xl|5xl)' | show

b "8. CTA possivelmente ad-hoc (cor de ação sem a classe .btn / .ora-cta-text)"
g 'bg-primary|bg-accent' | grep -vE '\bbtn\b' | show

b "COMO LER"
cat <<'EOF'
Para cada achado pergunte: "isto é global ou fork?"
  • Cor / forma / fonte  → deveria ser TOKEN ou papel global (não valor solto).
  • Ícone com fill fixo   → trocar por fill="currentColor" (herda o token).
  • Botão / input         → herdar de .btn / .input global.
  • Título                → h1-h6 (sistema), não <p>/<span> com peso.
Fork só se aceita em layout genuinamente único — e mesmo aí, puxando
cor/tipo/CTA do sistema (tokens, .ora-serif, .btn), nunca valores novos.
EOF
