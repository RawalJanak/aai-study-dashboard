"use client";

/**
 * Sidebar shell.
 *
 * Sections are switched client-side and mirrored into the URL hash, so a
 * section is linkable and survives reload - without needing a route per
 * section (which would multiply the static export for no gain).
 */

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui-kit";
import { Countdown } from "@/components/countdown";

export interface NavItem {
  id: string;
  label: string;
  /** Small count chip. */
  pill?: string | number;
  /** Tints the chip when something needs attention. */
  warn?: boolean;
}

export interface NavGroup {
  heading: string;
  items: NavItem[];
}

export function Shell({
  groups,
  sections,
  built,
  regClose,
}: {
  groups: NavGroup[];
  sections: Record<string, ReactNode>;
  built: string;
  regClose: string;
}) {
  const first = groups[0]?.items[0]?.id ?? "";
  const [active, setActive] = useState(first);
  const [navOpen, setNavOpen] = useState(false);

  const ids = groups.flatMap((g) => g.items.map((i) => i.id));

  // Read the hash after mount, not during render: the server has no location,
  // and reading it in render would desync the first paint.
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h && ids.includes(h)) setActive(h);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
    // ids is derived from a module-level constant; recomputing the listener on
    // every render would tear it down and rebuild it for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function go(id: string) {
    setActive(id);
    setNavOpen(false);
    // replaceState, not a hash assignment: assigning would scroll-jump to any
    // element that happens to share the id.
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  }

  const title =
    groups.flatMap((g) => g.items).find((i) => i.id === active)?.label ?? "";
  const crumb =
    groups.find((g) => g.items.some((i) => i.id === active))?.heading ?? "";

  return (
    <div className="mx-auto flex w-full max-w-[1680px] gap-0 px-0 lg:gap-6 lg:px-6 lg:py-6">
      {/* -------------------------------------------------------- sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[264px] shrink-0 overflow-y-auto overflow-x-hidden border-r border-border bg-card px-4 py-6 transition-transform lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:translate-x-0 lg:rounded-2xl lg:border",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-6 flex items-center gap-3 px-2">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--brand)] text-sm font-bold text-[var(--sidebar-primary-foreground)]">
            JR
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-tight">
              Study
            </span>
            <span className="block truncate text-[11px] uppercase tracking-wider text-muted-foreground">
              AAI · TOMORROW
            </span>
          </span>
        </div>

        <nav className="grid gap-5">
          {groups.map((g) => (
            <div key={g.heading}>
              <p className="mb-1.5 px-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {g.heading}
              </p>
              <ul className="grid gap-0.5">
                {g.items.map((it) => (
                  <li key={it.id}>
                    <button
                      type="button"
                      onClick={() => go(it.id)}
                      aria-current={active === it.id ? "page" : undefined}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] transition-colors duration-200",
                        active === it.id
                          ? "bg-[var(--brand)] font-semibold text-[var(--sidebar-primary-foreground)] shadow-[0_0_0_1px_var(--brand)]"
                          : "text-foreground/80 hover:bg-muted"
                      )}
                    >
                      <span className="min-w-0 truncate">{it.label}</span>
                      {it.pill !== undefined && it.pill !== "" ? (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold tabular-nums",
                            it.warn
                              ? "bg-[var(--critical)] text-white"
                              : active === it.id
                                ? "bg-background/20"
                                : "bg-muted text-muted-foreground"
                          )}
                        >
                          {it.pill}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Scrim only exists while the drawer is open on small screens. */}
      {navOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      ) : null}

      {/* ----------------------------------------------------------- main */}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-0 lg:py-0">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              className="rounded-xl border border-border px-3 py-2 text-sm lg:hidden"
            >
              ☰
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {crumb}
              </p>
              <h1 className="truncate text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                {title}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Countdown target={regClose} />
            <span className="hidden text-xs text-muted-foreground lg:inline">
              Built {built}
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Only the active section is mounted - the charts animate on mount,
            and mounting all of them at once would burn that animation off
            screen and make the first paint much heavier. */}
        {sections[active] ?? null}
      </main>
    </div>
  );
}
