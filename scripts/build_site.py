#!/usr/bin/env python3
"""Assemble the GitHub Pages site into ``_site/``.

Copies the static ``site/`` assets and generates a compact reverse index that
the redirect pages consume. The index maps each database to its ids to the list
of Mathlib declarations that reference that id::

    {"wikidata": {"Q83478": ["AddGroup", "Group"]}, "stacks": {...}, ...}

Most ids map to a single declaration; some (e.g. additive/multiplicative twins)
map to several, which the redirect page turns into a disambiguation list.

The output is written with a ``.bmp`` extension so GitHub Pages gzip-compresses
it (the body is still JSON); this mirrors doc-gen4's ``declaration-data.bmp``.
"""

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC_JSON = ROOT / "crossrefs.json"
SITE_SRC = ROOT / "site"
OUT_DIR = ROOT / "_site"
DATA_NAME = "crossrefs.bmp"


def build_index(data):
    """Reverse crossrefs.json into ``{db: {id: [decl, ...]}}``."""
    index = {}
    for entry in data["entries"]:
        decl = entry["decl"]
        for ref in entry["refs"]:
            decls = index.setdefault(ref["db"], {}).setdefault(ref["id"], [])
            if decl not in decls:
                decls.append(decl)
    # Sort everything for deterministic output (stable diffs, reproducible builds).
    return {
        db: {rid: sorted(decls) for rid, decls in sorted(ids.items())}
        for db, ids in sorted(index.items())
    }


def main():
    data = json.loads(SRC_JSON.read_text(encoding="utf-8"))
    index = build_index(data)

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    shutil.copytree(SITE_SRC, OUT_DIR)
    (OUT_DIR / DATA_NAME).write_text(
        json.dumps(index, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )

    n_ids = sum(len(ids) for ids in index.values())
    n_multi = sum(1 for ids in index.values() for d in ids.values() if len(d) > 1)
    print(
        f"Built {OUT_DIR.relative_to(ROOT)}/: {n_ids} ids across "
        f"{len(index)} databases ({n_multi} map to multiple declarations)."
    )


if __name__ == "__main__":
    main()
