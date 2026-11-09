import { useEffect, useState } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import "../styles/products.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

// One emoji per kit, used when a list has no tiers (e.g. the back pain result)
const EMOJI = {
  back_pain: "🌿",
  general: "🌡️",
  skin: "✨",
  pharmacy: "💊",
};

/**
 * Product list for one kit.
 * - Items with a "tier" are grouped under that heading.
 * - searchable: search box + group chips.
 * - kitCards: larger cards that change colour on hover (used on the kit pages).
 * Without those props it renders the plain cards used on the result screens.
 */
function ProductStrip({ category, heading, searchable = false, kitCards = false }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    const url = category
      ? `${API_BASE}/api/products?category=${encodeURIComponent(category)}`
      : `${API_BASE}/api/products`;

    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load products.");
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof TypeError ? "Check that the backend is running." : e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [category]);

  const q = query.trim().toLowerCase();
  const visible = (items ?? []).filter((p) => {
    if (tierFilter !== "all" && (p.tier || "") !== tierFilter) return false;
    if (!q) return true;
    return `${p.name} ${p.description}`.toLowerCase().includes(q);
  });

  // Group by tier, keeping the order the backend sent them in.
  const groups = [];
  visible.forEach((p) => {
    const tier = p.tier || "";
    let group = groups.find((g) => g.tier === tier);
    if (!group) {
      group = { tier, items: [] };
      groups.push(group);
    }
    group.items.push(p);
  });

  // Chips come from the full list, so they do not vanish while searching.
  const allTiers = [];
  (items ?? []).forEach((p) => {
    if (p.tier && !allTiers.includes(p.tier)) allTiers.push(p.tier);
  });

  const total = items?.length ?? 0;
  const showTools = searchable && total > 0;

  return (
    <section className="prod" aria-label={heading || "Products"}>
      {heading ? <h3>{heading}</h3> : null}

      {showTools ? (
        <div className="prod-tools">
          <label className="prod-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              placeholder="Search this kit"
              aria-label="Search this kit"
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>

          {allTiers.length > 1 ? (
            <div className="prod-chips" role="group" aria-label="Filter by group">
              {["all", ...allTiers].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`prod-chip ${tierFilter === t ? "is-on" : ""}`}
                  aria-pressed={tierFilter === t}
                  onClick={() => setTierFilter(t)}
                >
                  {t === "all" ? "All" : t}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="prod-empty">{error}</p> : null}
      {!error && items === null ? <p className="prod-empty">Loading products...</p> : null}
      {items && !items.length ? (
        <p className="prod-empty">Nothing here yet. Restart the backend so it can add the products.</p>
      ) : null}
      {total > 0 && !visible.length ? <p className="prod-empty">No items match your search. Try a different word.</p> : null}

      {groups.map((g, gi) => (
        <div key={g.tier || "all"} className="prod-group">
          {g.tier ? <h4 className={`prod-tier prod-tier-${gi % 4}`}>{g.tier}</h4> : null}

          <div className={kitCards ? "pack-grid" : "prod-grid"}>
            {g.items.map((p) => {
              const links = (
                <div className="prod-links">
                  {p.links.map((l) => (
                    <a key={l.platform + l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                      {l.platform}
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              );

              if (kitCards) {
                return (
                  <article key={p.id} className="pack-item">
                    <div className="pack-body">
                      <strong>{p.name}</strong>
                      <p>{p.description}</p>
                      {links}
                    </div>
                  </article>
                );
              }

              return (
                <article key={p.id} className={`prod-card prod-cat-${p.category} ${g.tier ? "is-compact" : ""}`}>
                  {!g.tier ? (
                    <span className="prod-badge" aria-hidden="true">
                      {EMOJI[p.category] ?? "🛍️"}
                    </span>
                  ) : null}
                  <strong>{p.name}</strong>
                  <p>{p.description}</p>
                  {links}
                </article>
              );
            })}
          </div>
        </div>
      ))}

      {total > 0 ? (
        <p className="prod-note">Links open each store's own website. Femora does not sell products or take payments.</p>
      ) : null}
    </section>
  );
}

export default ProductStrip;