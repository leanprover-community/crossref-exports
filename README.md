# crossref-exports

Auto-generated cross-reference index for [Mathlib](https://github.com/leanprover-community/mathlib4).

The file [`crossrefs.json`](crossrefs.json) maps every Mathlib declaration tagged with
`@[wikidata]`, `@[stacks]`, or `@[kerodon]` to its source location and the corresponding
identifiers in those external databases.

## Redirects

A small [GitHub Pages](https://leanprover-community.github.io/crossref-exports/) site
redirects from an external identifier to the corresponding Mathlib documentation:

- `…/crossref-exports/?db=<db>&id=<id>#doc` → the declaration's documentation page
- `…/crossref-exports/?db=<db>&id=<id>#src` → the declaration's source location

where `<db>` is `wikidata`, `stacks`, or `kerodon` and `<id>` is the identifier in that
database — e.g.
[`?db=wikidata&id=Q83478#doc`](https://leanprover-community.github.io/crossref-exports/?db=wikidata&id=Q83478#doc).
The `#doc`/`#src` fragment (defaulting to `#doc`) mirrors mathlib4_docs' own
`/find?pattern=…#doc` convention. The lookup resolves to a declaration name and hands
off to [mathlib4_docs](https://leanprover-community.github.io/mathlib4_docs/)' own
`/find` endpoint. When a single identifier is shared by several declarations (e.g.
additive/multiplicative twins) a disambiguation page is shown instead.

## How it works

[`scripts/build_site.py`](scripts/build_site.py) turns `crossrefs.json` into a compact
`{db: {id: [decl, …]}}` index and assembles the static [`site/`](site/) into `_site/`.
Following [doc-gen4](https://github.com/leanprover/doc-gen4), the index is written with a
`.bmp` extension so GitHub Pages serves it gzip-compressed (the body is still JSON), and
the redirect happens client-side after fetching it.

The [`Deploy to GitHub Pages`](.github/workflows/pages.yml) workflow rebuilds and deploys
on every push to `master` — including the automated `crossrefs.json` updates pushed from
mathlib4. It also has a manual `workflow_dispatch` mode with a `dry_run` input that builds
and uploads the artifact without deploying.
