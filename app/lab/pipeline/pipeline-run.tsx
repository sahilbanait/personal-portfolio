"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ToolIcon } from "@/components/tool";
import { aiSkills, background, profile, stages, toolkit } from "@/data/profile";
import { certRows, projectRows } from "@/lib/lab-data";

type Status = "queued" | "running" | "success";
type Task = { id: string; title: string; log: string; body: ReactNode };

const toolCount = toolkit.reduce((n, [, ts]) => n + ts.length, 0);

const TASKS: Task[] = [
  {
    id: "extract_profile",
    title: "Profile",
    log: "extracted 1 profile",
    body: (
      <>
        <p className="pl-big">{profile.name}</p>
        <p>
          {profile.title}, {profile.location}. {profile.pitch}
        </p>
      </>
    ),
  },
  {
    id: "transform_lifecycle",
    title: "Data engineering",
    log: `transformed ${stages.length} stages`,
    body: (
      <ol className="pl-chain">
        {stages.map((s) => (
          <li key={s.t} className={s.ai ? "ai" : ""}>
            <b>{s.t}</b>
            <span>{s.p}</span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "train_ai_skills",
    title: "AI and agents",
    log: `${aiSkills.length} skills ready`,
    body: (
      <ul className="pl-grid">
        {aiSkills.map((k) => (
          <li key={k.n}>
            <b>{k.n}</b>
            <span>{k.p}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "load_projects",
    title: "Projects",
    log: `loaded ${projectRows.length} rows into projects`,
    body: (
      <ul className="pl-grid">
        {projectRows.map((p) => (
          <li key={String(p.name)}>
            <b>{String(p.name)}</b>
            <span>{String(p.line)}</span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "validate_certifications",
    title: "Certifications",
    log: `checked ${certRows.length} certifications`,
    body: (
      <ul className="pl-list">
        {certRows.map((c) => (
          <li key={String(c.name)}>
            <b>{String(c.name)}</b>
            <span>
              {String(c.issuer)}, {String(c.issued)}
            </span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "index_toolkit",
    title: "Toolkit",
    log: `indexed ${toolCount} tools`,
    body: (
      <ul className="pl-tools">
        {toolkit.flatMap(([, ts]) => ts).map((t) => (
          <li key={t}>
            <ToolIcon name={t} />
            {t}
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "publish_background",
    title: "Background",
    log: `published ${background.length} records`,
    body: (
      <ul className="pl-list">
        {background.map((b) => (
          <li key={b.t}>
            <b>{b.t}</b>
            <span>
              {b.d} · {b.w}
            </span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "serve_contact",
    title: "Contact",
    log: "2 endpoints serving",
    body: (
      <p className="pl-links">
        <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn ↗<span className="vh"> (opens in a new tab)</span>
        </a>
        <a href={profile.links.github} target="_blank" rel="noopener noreferrer">
          GitHub ↗<span className="vh"> (opens in a new tab)</span>
        </a>
      </p>
    ),
  },
];

// The run is named after the moment the page opened, like an Airflow manual run.
let openedAt = "";
const clientRunId = () =>
  (openedAt ||= `manual__${new Date().toISOString().slice(0, 16).replace(":", "-")}`);
const noop = () => () => {};

const fmtSecs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

export function PipelineRun() {
  const [status, setStatus] = useState<Status[]>(() => TASKS.map(() => "queued"));
  const [dur, setDur] = useState<number[]>(() => TASKS.map(() => 0));
  const runId = useSyncExternalStore(noop, clientRunId, () => "manual__");
  const [fill, setFill] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    // The scroll position decides each task's state. A task that has succeeded stays succeeded.
    let current: Status[] = TASKS.map(() => "queued");
    const started = TASKS.map(() => 0);
    const took = TASKS.map(() => 0);
    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = innerHeight;
      const now = performance.now();
      const next = current.map((s, i) => {
        const r = refs.current[i]?.getBoundingClientRect();
        if (!r || s === "success") return s;
        if (r.bottom < vh * 0.35) return "success";
        if (r.top < vh * 0.65) return "running";
        return "queued";
      });
      next.forEach((s, i) => {
        if (s === "running" && current[i] === "queued") started[i] = now;
        if (s === "success" && current[i] !== "success") took[i] = now - (started[i] || now);
      });
      if (next.some((s, i) => s !== current[i])) {
        current = next;
        setStatus(next);
        setDur([...took]);
      }
      const first = refs.current[0]?.getBoundingClientRect();
      const last = refs.current[TASKS.length - 1]?.getBoundingClientRect();
      if (first && last)
        setFill(Math.min(1, Math.max(0, (vh * 0.5 - first.top) / (last.bottom - first.top))));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    // Running tasks show a live clock.
    const clock = setInterval(() => {
      const now = performance.now();
      if (current.includes("running"))
        setDur(current.map((s, i) => (s === "running" ? now - started[i] : took[i])));
    }, 100);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      clearInterval(clock);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const done = status.filter((s) => s === "success").length;
  const runState = done === TASKS.length ? "success" : done || status.includes("running") ? "running" : "queued";

  return (
    <div className="pl">
      <div className="pl-top">
        <div className="pl-top-in">
          <p className="pl-run">
            <span className={`pl-dot st-${runState}`} aria-hidden="true" />
            <span className="pl-runid">{runId}</span>
            <span className="pl-count">
              {done}/{TASKS.length} tasks
            </span>
          </p>
          <ol className="pl-mini" aria-label="Tasks">
            {TASKS.map((t, i) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className={`st-${status[i]}`} aria-label={`${t.title}: ${status[i]}`} title={t.id} />
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="pl-body">
        <div className="pl-rail" aria-hidden="true">
          <span style={{ transform: `scaleY(${fill})` }} />
        </div>
        {TASKS.map((t, i) => (
          <section
            key={t.id}
            id={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className={`pl-task st-${status[i]}`}
            aria-labelledby={`${t.id}-h`}
          >
            <span className="pl-node" aria-hidden="true">
              {status[i] === "success" ? "✓" : ""}
            </span>
            <header className="pl-head">
              <p className="pl-meta">
                <span className={`pl-chip st-${status[i]}`}>
                  {status[i]}
                  {status[i] !== "queued" && ` · ${fmtSecs(dur[i])}`}
                </span>
                <code>{t.id}</code>
              </p>
              <h2 id={`${t.id}-h`}>{t.title}</h2>
            </header>
            <div className="pl-content">{t.body}</div>
            <p className="pl-log" aria-hidden={status[i] !== "success"}>
              {status[i] === "success" ? `INFO · ${t.log} in ${fmtSecs(dur[i])}` : " "}
            </p>
          </section>
        ))}
        <p className="pl-end">
          {done === TASKS.length
            ? `Run succeeded. ${TASKS.length} of ${TASKS.length} tasks.`
            : "Keep scrolling to run every task."}
        </p>
      </div>
    </div>
  );
}
