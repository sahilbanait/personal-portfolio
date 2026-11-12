"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ToolIcon } from "@/components/tool";
import { certRows, projectRows, stageRows, toolRows } from "@/lib/lab-data";

type Kind = "p" | "t" | "s" | "c";
type Node = { id: string; kind: Kind; label: string; sub?: string };
const KIND_NAME: Record<Kind, [string, string]> = {
  p: ["project", "projects"],
  t: ["tool", "tools"],
  s: ["lifecycle stage", "lifecycle stages"],
  c: ["certification", "certifications"],
};

// Edges always run through a tool: project–tool, tool–stage, tool–certification.
function buildGraph() {
  const edges: [string, string][] = [];
  projectRows.forEach((p) =>
    (p.tools as string[]).forEach((t) => edges.push([`p:${p.name}`, `t:${t}`])),
  );
  stageRows.forEach((s) =>
    (s.tools as string[]).forEach((t) => edges.push([`t:${t}`, `s:${s.name}`])),
  );
  certRows.forEach((c) => edges.push([`t:${c.tool}`, `c:${c.name}`]));
  const adj = new Map<string, Set<string>>();
  edges.forEach(([a, b]) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  });
  const tools: Node[] = toolRows
    .filter((t) => adj.has(`t:${t.name}`))
    .sort((a, b) => adj.get(`t:${b.name}`)!.size - adj.get(`t:${a.name}`)!.size)
    .map((t) => ({ id: `t:${t.name}`, kind: "t", label: String(t.name) }));
  const projects: Node[] = projectRows.map((p) => ({
    id: `p:${p.name}`,
    kind: "p",
    label: String(p.name),
    sub: (p.groups as string[]).join(" · "),
  }));
  const stages: Node[] = stageRows.map((s) => ({
    id: `s:${s.name}`,
    kind: "s",
    label: String(s.name),
    sub: `Stage ${s.step}`,
  }));
  const certs: Node[] = certRows.map((c) => ({
    id: `c:${c.name}`,
    kind: "c",
    label: String(c.name),
    sub: `${c.issuer} · ${c.issued}`,
  }));
  return { edges, adj, tools, projects, stages, certs };
}

const g = buildGraph();
const byId = new Map([...g.projects, ...g.tools, ...g.stages, ...g.certs].map((n) => [n.id, n]));

export function LineageGraph() {
  const [selected, setSelected] = useState("t:Snowflake");
  const [peek, setPeek] = useState<string | null>(null);
  const focus = peek ?? selected;

  // What lights up: the node, its tools, and what those tools reach on the other side.
  const lit = useMemo(() => {
    const kind = focus[0] as Kind;
    const out = new Set([focus]);
    const near = g.adj.get(focus) ?? new Set<string>();
    near.forEach((n) => out.add(n));
    if (kind !== "t")
      near.forEach((tool) =>
        g.adj.get(tool)?.forEach((n) => {
          if (n[0] !== kind) out.add(n);
        }),
      );
    return out;
  }, [focus]);

  const box = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<{ d: string; a: string; b: string }[]>([]);
  const measure = useCallback(() => {
    const root = box.current;
    if (!root || getComputedStyle(root).getPropertyValue("--edges").trim() !== "on") {
      setPaths([]);
      return;
    }
    const base = root.getBoundingClientRect();
    const pos = (id: string) =>
      root.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.getBoundingClientRect();
    setPaths(
      g.edges.flatMap(([a, b]) => {
        const ra = pos(a);
        const rb = pos(b);
        if (!ra || !rb) return [];
        const x1 = ra.right - base.left;
        const y1 = ra.top + ra.height / 2 - base.top;
        const x2 = rb.left - base.left;
        const y2 = rb.top + rb.height / 2 - base.top;
        const mx = (x1 + x2) / 2;
        return [{ a, b, d: `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}` }];
      }),
    );
  }, []);
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (box.current) ro.observe(box.current);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  const sel = byId.get(focus)!;
  const groups = (["p", "t", "s", "c"] as Kind[])
    .map((k) => [k, [...lit].filter((id) => id[0] === k && id !== focus)] as const)
    .filter(([, ids]) => ids.length);

  const nodeButton = (n: Node) => {
    const on = lit.has(n.id);
    return (
      <li key={n.id}>
        <button
          type="button"
          data-id={n.id}
          className={`ln-node k-${n.kind}${n.id === focus ? " sel" : on ? " on" : " off"}`}
          aria-pressed={n.id === selected}
          onClick={() => {
            setSelected(n.id);
            setPeek(null);
          }}
          onPointerEnter={(e) => e.pointerType === "mouse" && setPeek(n.id)}
          onPointerLeave={() => setPeek(null)}
        >
          {n.kind === "t" && <ToolIcon name={n.label} />}
          <span className="ln-label">{n.label}</span>
          {n.sub && <span className="ln-sub">{n.sub}</span>}
        </button>
      </li>
    );
  };

  return (
    <div className="ln">
      <aside className="ln-panel" aria-live="polite">
        <p className="ln-kicker">{KIND_NAME[sel.kind][0]}</p>
        <p className="ln-title">{sel.label}</p>
        <p className="ln-sum">
          {groups.length
            ? groups
                .map(([k, ids]) => `${ids.length} ${KIND_NAME[k][ids.length === 1 ? 0 : 1]}`)
                .join(" · ")
            : "Nothing else links to this yet."}
        </p>
        <div className="ln-lists">
          {groups.map(([k, ids]) => (
            <div key={k}>
              <p>{KIND_NAME[k][1]}</p>
              <ul>
                {ids.map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(id);
                        setPeek(null);
                      }}
                    >
                      {byId.get(id)!.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      <div className="ln-graph" ref={box}>
        <svg className="ln-edges" aria-hidden="true">
          {paths.map((p) => {
            const on = lit.has(p.a) && lit.has(p.b);
            return <path key={p.a + p.b} d={p.d} className={on ? "on" : ""} />;
          })}
        </svg>
        <div className="ln-col">
          <h2>
            Projects <span>{g.projects.length}</span>
          </h2>
          <ul>{g.projects.map(nodeButton)}</ul>
        </div>
        <div className="ln-col ln-mid">
          <h2>
            Tools <span>{g.tools.length}</span>
          </h2>
          <ul>{g.tools.map(nodeButton)}</ul>
        </div>
        <div className="ln-col">
          <h2>
            Lifecycle <span>{g.stages.length}</span>
          </h2>
          <ul>{g.stages.map(nodeButton)}</ul>
          <h2 className="ln-h2b">
            Certifications <span>{g.certs.length}</span>
          </h2>
          <ul>{g.certs.map(nodeButton)}</ul>
        </div>
      </div>
    </div>
  );
}
