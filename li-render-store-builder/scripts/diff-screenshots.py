#!/usr/bin/env python3
"""diff-screenshots.py — diff visual pareado para regressão.

Compara screenshots de `baseline/` (antes da mudança) com `current/` (depois) e
reporta a % de pixels diferentes por par, gravando uma imagem de diff (heatmap)
para os que mudaram. Serve para pegar regressões visuais em partes do site que
você NÃO tocou — o efeito colateral de uma mudança global (token/utility).

Fluxo:
  1. Capture a superfície de regressão ANTES da mudança → baseline/ (1 PNG por
     rota×viewport; ver references/visual-regression.md).
  2. Faça a mudança, rebuild, sync.
  3. Capture a MESMA superfície → current/ (mesmos nomes de arquivo).
  4. python diff-screenshots.py baseline current
  5. Revise os pares acima do threshold: mudança esperada (ok) ou regressão?

Pareia por nome de arquivo. Só Pillow (pip install Pillow).
Dica anti-ruído: capture no topo (scroll 0), com animações desligadas e conteúdo
dinâmico mascarado — ver o doc. Diff é SINAL, não veredito; o agente julga.

Uso: python diff-screenshots.py <baseline_dir> <current_dir> [--out diff] [--threshold 0.4] [--tol 16]
"""
import argparse, os, sys
try:
    from PIL import Image, ImageChops
except ImportError:
    sys.exit("Pillow não instalado. Rode: pip install Pillow")

def diff_pair(a_path, b_path, out_path, tol):
    a = Image.open(a_path).convert("RGB")
    b = Image.open(b_path).convert("RGB")
    if a.size != b.size:                      # alturas variam com conteúdo; alinhe
        w = min(a.size[0], b.size[0]); h = min(a.size[1], b.size[1])
        a = a.crop((0, 0, w, h)); b = b.crop((0, 0, w, h))
    d = ImageChops.difference(a, b).convert("L")
    mask = d.point(lambda p: 255 if p > tol else 0)
    changed = mask.histogram()[255]
    total = a.size[0] * a.size[1]
    pct = 100.0 * changed / total if total else 0.0
    if out_path and pct > 0:
        # heatmap: realça as áreas que mudaram sobre uma versão esmaecida
        base = a.point(lambda p: int(p * 0.35 + 160))
        red = Image.new("RGB", a.size, (220, 40, 40))
        base.paste(red, (0, 0), mask)
        base.save(out_path)
    return pct

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("baseline"); ap.add_argument("current")
    ap.add_argument("--out", default="diff")
    ap.add_argument("--threshold", type=float, default=0.4, help="%% mínimo p/ sinalizar")
    ap.add_argument("--tol", type=int, default=16, help="tolerância por canal (0-255)")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    names = sorted(f for f in os.listdir(a.baseline) if f.lower().endswith((".png", ".jpg", ".jpeg")))
    if not names:
        sys.exit(f"Nenhum PNG/JPG em {a.baseline}")
    rows, missing, flagged = [], [], 0
    for n in names:
        bp, cp = os.path.join(a.baseline, n), os.path.join(a.current, n)
        if not os.path.exists(cp):
            missing.append(n); continue
        pct = diff_pair(bp, cp, os.path.join(a.out, n), a.tol)
        rows.append((pct, n))
    rows.sort(reverse=True)
    print(f"\n=== Diff visual: {a.baseline} → {a.current} (threshold {a.threshold}%) ===")
    for pct, n in rows:
        flag = "  ⚠️ REVISAR" if pct >= a.threshold else ""
        if pct >= a.threshold: flagged += 1
        print(f"  {pct:6.2f}%  {n}{flag}")
    if missing:
        print(f"\n  Faltando em current/ (capture again?): {', '.join(missing)}")
    print(f"\n{flagged} par(es) acima do threshold → revise em ./{a.out}/. "
          f"Mudança esperada = ok; mudança onde você não mexeu = REGRESSÃO.")
    sys.exit(1 if flagged else 0)

if __name__ == "__main__":
    main()
