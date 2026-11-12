"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { ToolIcon } from "@/components/tool";
import { projects } from "@/data/projects";
import { ROLES, toolRole } from "@/lib/lab-data";
import { scene } from "@/lib/art";

const CAT: Record<string, string> = { Data: "data", AI: "ai", Platform: "platform", Apps: "apps" };
const cat = (i: number) => CAT[projects[i].groups[0]];
const status = (i: number) =>
  projects[i].inProgress ? "In progress" : projects[i].url ? `Live on ${projects[i].urlLabel}` : "Private repo";

// Runs a DOM change as a View Transition when the browser has them and motion is allowed.
function transition(update: () => void) {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) return update();
  root.classList.add("vt-case");
  const t = document.startViewTransition(update);
  t.finished.finally(() => root.classList.remove("vt-case"));
}

export function CaseStudies() {
  const [open, setOpen] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const visOf = (i: number) => document.querySelector<HTMLElement>(`[data-case="${i}"] .vis`);

  const show = (i: number, btn: HTMLButtonElement) => {
    opener.current = btn;
    const card = visOf(i);
    if (card) card.style.viewTransitionName = "case-vis";
    transition(() => {
      if (card) card.style.viewTransitionName = "";
      flushSync(() => setOpen(i));
      if (!dialog.current!.open) dialog.current!.showModal();
    });
  };
  const hide = () => {
    if (open === null) return;
    const i = open;
    transition(() => {
      flushSync(() => setOpen(null));
      dialog.current!.close();
      const card = visOf(i);
      if (card) card.style.viewTransitionName = "case-vis";
    });
    setTimeout(() => {
      const card = visOf(i);
      if (card) card.style.viewTransitionName = "";
      opener.current?.focus();
    }, 700);
  };
  const go = (d: number) => {
    if (open === null) return;
    const j = (open + d + projects.length) % projects.length;
    transition(() => flushSync(() => setOpen(j)));
  };

  useEffect(() => {
    const d = dialog.current!;
    const onCancel = (e: Event) => {
      e.preventDefault();
      hide();
    };
    d.addEventListener("cancel", onCancel);
    return () => d.removeEventListener("cancel", onCancel);
  });

  const groups = ["All", "Data", "AI", "Platform", "Apps"];
  const p = open === null ? null : projects[open];
  const roles = p ? ROLES.map((r) => [r, p.tools.filter((t) => toolRole(t) === r)] as const).filter(([, ts]) => ts.length) : [];

  return (
    <div className="cs">
      <div className="cs-filter" role="group" aria-label="Filter by category">
        {groups.map((g) => (
          <button
            type="button"
            key={g}
            className={g === "All" ? "" : `cat-${CAT[g]}`}
            aria-pressed={filter === g}
            onClick={() => setFilter(g)}
          >
            <span className="cs-sw" aria-hidden="true" />
            {g}
          </button>
        ))}
      </div>

      <div className="cs-grid">
        {projects.map((pr, i) => {
          const shown = filter === "All" || (pr.groups as string[]).includes(filter);
          return (
            <article
              key={pr.name}
              data-case={i}
              className={`cs-card cat-${cat(i)}${i === 0 && filter === "All" ? " featured" : ""}`}
              hidden={!shown}
            >
              {i === 0 && filter === "All" && <span className="cs-feat">Featured</span>}
              <div className="vis" dangerouslySetInnerHTML={{ __html: scene[pr.scene]() }} />
              <div className="cs-cb">
                <p className="cs-cats">{pr.groups.join(" · ")}</p>
                <h3>
                  <button type="button" onClick={(e) => show(i, e.currentTarget)}>
                    {pr.name}
                    <span className="vh">, open case study</span>
                  </button>
                </h3>
                <p>{pr.line}</p>
                <ul className="cs-chips">
                  {pr.tools.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>

      <dialog ref={dialog} className={`cs-dialog${p ? ` cat-${cat(open!)}` : ""}`} aria-labelledby="cs-title">
        {p && (
          <div className="cs-case">
            <div className="cs-case-top">
              <p className="cs-cats">
                {p.groups.join(" · ")} <span className="cs-status">{status(open!)}</span>
              </p>
              <button type="button" className="cs-close" onClick={hide} aria-label="Close case study">
                ✕
              </button>
            </div>
            <div className="vis" style={{ viewTransitionName: "case-vis" }} dangerouslySetInnerHTML={{ __html: scene[p.scene]() }} />
            <div className="cs-case-body">
              <h2 id="cs-title">{p.name}</h2>
              <p className="cs-line">{p.line}</p>

              <h3 className="cs-h">Stack by role</h3>
              <ol className="cs-arch">
                {roles.map(([r, ts]) => (
                  <li key={r}>
                    <span className="cs-role">{r}</span>
                    <ul>
                      {ts.map((t) => (
                        <li key={t}>
                          <ToolIcon name={t} />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>

              <h3 className="cs-h">Case study</h3>
              <dl className="cs-story">
                {["Problem", "Approach", "Result"].map((k) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>Write-up coming. This space is for your own words.</dd>
                  </div>
                ))}
              </dl>

              <div className="cs-foot">
                {p.url && (
                  <a className="cs-link" href={p.url} target="_blank" rel="noopener noreferrer">
                    View on {p.urlLabel} ↗<span className="vh"> (opens in a new tab)</span>
                  </a>
                )}
                <div className="cs-nav">
                  <button type="button" onClick={() => go(-1)}>
                    ‹ {projects[(open! - 1 + projects.length) % projects.length].name}
                  </button>
                  <button type="button" onClick={() => go(1)}>
                    {projects[(open! + 1) % projects.length].name} ›
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  );
}
