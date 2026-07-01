/**
 * Crossref redirect page.
 *
 * Reads `db` and `id` from the query string and the view from the URL fragment
 * (`#doc` or `#src`, defaulting to `doc`), looks up the matching Mathlib
 * declaration(s) in the cross-reference index, then either:
 *   - 1 match  -> redirects to the mathlib4_docs `/find` page for that decl,
 *   - >1 match -> renders a disambiguation list (e.g. additive/multiplicative
 *                 twins that share a single external id), or
 *   - 0 match / bad input -> renders a "not found" message.
 *
 * With no `db`/`id` at all the static landing content is left in place, so the
 * same page doubles as the site's help page.
 *
 * The `#doc` / `#src` fragment mirrors mathlib4_docs' own `/find?pattern=…#doc`
 * convention. We hand the decl off to that `/find` endpoint rather than
 * resolving it to a doc URL ourselves: it already knows how to turn a
 * declaration name into its doc/source page, so this stays a thin lookup layer.
 */

const MATHLIB_FIND = "https://leanprover-community.github.io/mathlib4_docs/find/";
const REPO_URL = "https://github.com/leanprover-community/crossref-exports";

// Served with a `.bmp` extension so GitHub Pages gzip-compresses it; the body is
// still JSON, so `res.json()` parses it directly (mirrors doc-gen4's trick).
// Resolved relative to this script, so it works regardless of the page path.
const DATA_URL = new URL("./crossrefs.bmp", import.meta.url);

const view = window.location.hash.replace(/^#/, "") === "src" ? "src" : "doc";
const otherView = view === "doc" ? "src" : "doc";

function findUrl(decl, v = view) {
  return `${MATHLIB_FIND}?pattern=${encodeURIComponent(decl)}#${v}`;
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function render(html) {
  (document.getElementById("content") || document.body).innerHTML = html;
}

function renderNotFound(message, detail) {
  render(
    `<h1>Cross-reference not found</h1>` +
      `<p>${message}</p>` +
      (detail ? `<p class="muted">${detail}</p>` : "") +
      `<p>See the <a href="${REPO_URL}">crossref-exports</a> repository for the ` +
      `available data.</p>`
  );
}

function renderDisambiguation(db, id, decls) {
  const items = decls
    .map(
      (decl) =>
        `<li><a href="${findUrl(decl)}">${escapeHtml(decl)}</a> ` +
        `<a class="alt" href="${findUrl(decl, otherView)}">(${otherView})</a></li>`
    )
    .join("");
  render(
    `<h1>Multiple declarations</h1>` +
      `<p><code>${escapeHtml(db)}</code> id <code>${escapeHtml(id)}</code> ` +
      `is referenced by several Mathlib declarations. Pick one:</p>` +
      `<ul class="decls">${items}</ul>`
  );
}

async function main() {
  const params = new URLSearchParams(window.location.search);
  const db = params.get("db");
  const id = params.get("id");

  // Bare page (no query): leave the static landing/help content in place.
  if (!db && !id) return;

  // A lookup is happening; replace the landing content while we resolve it.
  render(`<p class="muted">Looking up…</p>`);

  if (!db || !id) {
    renderNotFound(
      "This page expects a query of the form <code>?db=&hellip;&amp;id=&hellip;</code>.",
      `Got db=<code>${escapeHtml(db ?? "")}</code>, id=<code>${escapeHtml(id ?? "")}</code>.`
    );
    return;
  }

  let index;
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    index = await res.json();
  } catch (e) {
    renderNotFound("Could not load the cross-reference index.", escapeHtml(e));
    return;
  }

  const decls = (index[db] && index[db][id]) || [];
  if (decls.length === 0) {
    renderNotFound(
      `No Mathlib declaration is tagged with <code>${escapeHtml(db)}</code> id ` +
        `<code>${escapeHtml(id)}</code>.`
    );
  } else if (decls.length === 1) {
    window.location.replace(findUrl(decls[0]));
  } else {
    renderDisambiguation(db, id, decls);
  }
}

main();
