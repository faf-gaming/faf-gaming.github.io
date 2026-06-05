#!/usr/bin/env python3
"""Build assets/data/games.json from all game/*.html pages."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
GAME_DIR = ROOT / "game"
OUT = ROOT / "assets" / "data" / "games.json"


def title_from(slug, text):
    m = re.search(r"<title>([^<|]+)", text, re.I)
    if m:
        t = m.group(1).strip()
        t = re.sub(r"\s*-\s*Play.*", "", t, flags=re.I)
        t = re.sub(r"\s*\|.*", "", t)
        if t and len(t) > 2:
            return t.strip()
    return slug.replace(".html", "").replace("-", " ").title()


def keywords_from(text):
    m = re.search(r'name="keywords"\s+content="([^"]*)"', text, re.I)
    return m.group(1).strip() if m else ""


def main():
    games = []
    for p in sorted(GAME_DIR.glob("*.html")):
        text = p.read_text(encoding="utf-8", errors="ignore")
        slug = p.name
        games.append(
            {
                "name": title_from(slug, text),
                "url": f"game/{slug}",
                "keywords": keywords_from(text),
            }
        )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(games, ensure_ascii=False, indent=0), encoding="utf-8")
    print(f"Wrote {len(games)} games to {OUT}")


if __name__ == "__main__":
    main()
