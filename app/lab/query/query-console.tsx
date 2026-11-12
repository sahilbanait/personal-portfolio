"use client";

import { useEffect, useRef, useState } from "react";
import { ToolIcon } from "@/components/tool";
import { projectRows, tables, type Row } from "@/lib/lab-data";
import { setLabTheme } from "../lab-theme";

type Result =
  | { kind: "rows"; table: string; cols: string[]; rows: Row[] }
  | { kind: "count"; table: string; n: number }
  | { kind: "text"; text: string }
  | { kind: "error"; text: string };
type Entry = { q: string; r: Result };

const EXAMPLES = [
  "select name, tools from projects where tools = 'Snowflake'",
  "select name, projects, certs from tools order by projects desc limit 5",
  "select * from certs where issuer = 'Snowflake' order by issued desc",
  "select count(*) from projects where groups = 'AI'",
  "select name, line from stages",
  "show tables",
];

const TABLE_NAMES = Object.keys(tables);
const columns = (t: string) => Object.keys(tables[t][0]);
const fmt = (v: Row[string]) => (Array.isArray(v) ? v.join(", ") : String(v));

// "Jan 2026" sorts as a date; numbers as numbers; everything else as text.
function sortKey(v: Row[string]): number | string {
  if (typeof v === "number") return v;
  const s = fmt(v);
  if (/^[A-Z][a-z]{2} \d{4}$/.test(s)) return Date.parse(`1 ${s}`);
  return s.toLowerCase();
}

function matches(v: Row[string], op: string, want: string): boolean {
  const w = want.toLowerCase();
  if (typeof v === "number") {
    const n = Number(want);
    if (op === ">") return v > n;
    if (op === "<") return v < n;
    if (op === ">=") return v >= n;
    if (op === "<=") return v <= n;
    if (op === "!=" || op === "<>") return v !== n;
    return v === n;
  }
  const vals = (Array.isArray(v) ? v : [v]).map((x) => x.toLowerCase());
  if (op === "contains") return vals.some((x) => x.includes(w));
  if (op === "like") {
    const re = new RegExp(
      `^${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".")}$`,
    );
    return vals.some((x) => re.test(x));
  }
  if (op === "!=" || op === "<>") return !vals.includes(w);
  return vals.includes(w);
}

const SELECT =
  /^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?\s*;?$/i;
const COND =
  /^(\w+)\s*(=|!=|<>|>=|<=|>|<|\bcontains\b|\blike\b)\s*(?:'([^']*)'|"([^"]*)"|(\S+))$/i;

function run(input: string): Result {
  const q = input.trim().replace(/\s+/g, " ");
  const lower = q.toLowerCase();
  if (!q) return { kind: "text", text: "Type a query, or try one of the examples." };
  if (lower === "help")
    return {
      kind: "text",
      text: "select <cols|*|count(*)> from <table> [where <col> = 'value' | contains 'text' | like 'sn%' | > n] [and …] [order by <col> [desc]] [limit n]. Also: show tables · describe <table> · go <section> · theme dark|colour · pause · play · clear",
    };
  if (lower === "show tables")
    return {
      kind: "rows",
      table: "tables",
      cols: ["table", "rows"],
      rows: TABLE_NAMES.map((t) => ({ table: t, rows: tables[t].length })),
    };
  const desc = lower.match(/^describe (\w+)$/);
  if (desc) {
    const t = desc[1];
    if (!tables[t]) return unknownTable(t);
    return {
      kind: "rows",
      table: t,
      cols: ["column", "example"],
      rows: columns(t).map((c) => ({ column: c, example: fmt(tables[t][0][c]) })),
    };
  }
  const go = lower.match(/^go (\w+)$/);
  if (go) {
    const ids: Record<string, string> = {
      home: "home", projects: "projects", certs: "certifications", certifications: "certifications",
      ai: "ai", toolkit: "toolkit", background: "background", contact: "contact", lifecycle: "lifecycle",
    };
    const id = ids[go[1]];
    if (!id) return { kind: "error", text: `No section "${go[1]}". Try: ${Object.keys(ids).join(", ")}` };
    const live = document.querySelector<HTMLAnchorElement>(".lab-live");
    window.location.assign(new URL(`#${id}`, live?.href ?? location.origin));
    return { kind: "text", text: `Opening ${go[1]} on the live site…` };
  }
  const theme = lower.match(/^theme (dark|colou?r|bold)$/);
  if (theme) {
    setLabTheme(theme[1] === "dark" ? "dark" : "bold");
    return { kind: "text", text: `Theme set to ${theme[1] === "dark" ? "Dark" : "Colour"}.` };
  }
  if (lower === "pause" || lower === "play") {
    const on = lower === "pause";
    document.documentElement.classList.toggle("paused", on);
    try {
      localStorage.setItem("sk-paused", on ? "1" : "0");
    } catch {
      /* Still applies for this visit. */
    }
    return { kind: "text", text: on ? "Motion paused." : "Motion playing." };
  }

  const m = q.match(SELECT);
  if (!m)
    return {
      kind: "error",
      text: "I couldn't read that. Queries look like: select name from projects where tools = 'Python'. Type help for more.",
    };
  const [, colPart, table, wherePart, orderCol, orderDir, limit] = m;
  const t = table.toLowerCase();
  if (!tables[t]) return unknownTable(t);
  const known = columns(t);
  const check = (c: string) =>
    known.includes(c) ? null : `No column "${c}" in ${t}. Columns: ${known.join(", ")}`;

  let rows = tables[t];
  if (wherePart) {
    for (const part of wherePart.split(/\s+and\s+/i)) {
      const c = part.trim().match(COND);
      if (!c) return { kind: "error", text: `I couldn't read the condition "${part}".` };
      const field = c[1].toLowerCase();
      const err = check(field);
      if (err) return { kind: "error", text: err };
      const value = c[3] ?? c[4] ?? c[5];
      rows = rows.filter((r) => matches(r[field], c[2].toLowerCase(), value));
    }
  }
  if (orderCol) {
    const f = orderCol.toLowerCase();
    const err = check(f);
    if (err) return { kind: "error", text: err };
    const dir = orderDir?.toLowerCase() === "desc" ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      const x = sortKey(a[f]);
      const y = sortKey(b[f]);
      return (x > y ? 1 : x < y ? -1 : 0) * dir;
    });
  }
  if (limit) rows = rows.slice(0, Number(limit));
  const cp = colPart.trim().toLowerCase();
  if (/^count\(\s*\*\s*\)$/.test(cp)) return { kind: "count", table: t, n: rows.length };
  const cols = cp === "*" ? known : cp.split(",").map((s) => s.trim());
  for (const c of cols) {
    const err = check(c);
    if (err) return { kind: "error", text: err };
  }
  return { kind: "rows", table: t, cols, rows };
}

const unknownTable = (t: string): Result => ({
  kind: "error",
  text: `No table "${t}". Try: ${TABLE_NAMES.join(", ")}`,
});

// Which projects a result points at: the projects themselves, or projects that use the tools found.
function highlighted(r: Result | undefined): Set<string> | null {
  if (!r || r.kind !== "rows") return null;
  if (r.table === "projects") return new Set(r.rows.map((x) => String(x.name)));
  if (r.table === "tools") {
    const ts = new Set(r.rows.map((x) => String(x.name)));
    return new Set(
      projectRows
        .filter((p) => (p.tools as string[]).some((t) => ts.has(t)))
        .map((p) => String(p.name)),
    );
  }
  return null;
}

export function QueryConsole() {
  const [log, setLog] = useState<Entry[]>(() => [{ q: EXAMPLES[0], r: run(EXAMPLES[0]) }]);
  const [text, setText] = useState("");
  const [hist, setHist] = useState(-1);
  const input = useRef<HTMLInputElement>(null);

  const submit = (q: string) => {
    const query = q.trim();
    if (query.toLowerCase() === "clear") {
      setLog([]);
      setText("");
      return;
    }
    const r = run(query);
    setLog((l) => [...l.slice(-5), { q: query, r }]);
    setText("");
    setHist(-1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).closest("input,textarea");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const last = log[log.length - 1];
  const lit = highlighted(last?.r);
  const asked = log.map((e) => e.q);

  return (
    <div className="q">
      <div className="q-term">
        <div className="q-term-bar" aria-hidden="true">
          <span />
          <span />
          <span />
          <b>sahil@portfolio</b>
          <kbd>⌘K</kbd>
        </div>
        <ol className="q-log" aria-label="Earlier queries">
          {log.slice(0, -1).map((e, i) => (
            <li key={i}>
              <button type="button" onClick={() => setText(e.q)}>
                <span aria-hidden="true">›</span> {e.q}
              </button>
            </li>
          ))}
        </ol>
        <form
          className="q-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit(text);
          }}
        >
          <label htmlFor="q-in" className="q-prompt">
            sahil=#
            <span className="vh"> Query</span>
          </label>
          <input
            id="q-in"
            ref={input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp" && asked.length) {
                e.preventDefault();
                const i = hist < 0 ? asked.length - 1 : Math.max(0, hist - 1);
                setHist(i);
                setText(asked[i]);
              }
              if (e.key === "ArrowDown" && hist >= 0) {
                e.preventDefault();
                const i = hist + 1;
                setHist(i >= asked.length ? -1 : i);
                setText(i >= asked.length ? "" : asked[i]);
              }
            }}
            placeholder="select * from projects where tools = 'Python'"
            autoComplete="off"
            spellCheck={false}
            aria-describedby="q-help"
          />
          <button type="submit" className="q-run">
            Run
          </button>
        </form>
        <p id="q-help" className="vh">
          Type a query and press Enter. Up and down arrows recall earlier queries.
        </p>
        <div className="q-out" role="status" aria-live="polite">
          {last && <Output entry={last} />}
        </div>
      </div>

      <div className="q-chips" role="group" aria-label="Example queries">
        {EXAMPLES.map((ex) => (
          <button type="button" key={ex} onClick={() => submit(ex)}>
            {ex}
          </button>
        ))}
      </div>

      <section className="q-preview" aria-labelledby="q-prev-h">
        <h2 id="q-prev-h">
          Projects
          <span>
            {lit ? `${lit.size} match${lit.size === 1 ? "" : "es"}` : "query projects or tools to filter"}
          </span>
        </h2>
        <ul>
          {projectRows.map((p) => {
            const on = !lit || lit.has(String(p.name));
            return (
              <li key={String(p.name)} className={on ? (lit ? "hit" : "") : "dim"}>
                <b>{String(p.name)}</b>
                <span>{String(p.line)}</span>
                <span className="q-tools">
                  {(p.tools as string[]).map((t) => (
                    <span key={t}>
                      <ToolIcon name={t} />
                      {t}
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Output({ entry }: { entry: Entry }) {
  const { q, r } = entry;
  return (
    <>
      <p className="q-echo">
        <span aria-hidden="true">›</span> {q}
      </p>
      {r.kind === "text" && <p className="q-msg">{r.text}</p>}
      {r.kind === "error" && <p className="q-msg q-err">{r.text}</p>}
      {r.kind === "count" && (
        <p className="q-count">
          <b>{r.n}</b> {r.table}
        </p>
      )}
      {r.kind === "rows" && (
        <>
          <p className="q-meta">
            {r.rows.length} row{r.rows.length === 1 ? "" : "s"}
          </p>
          {r.rows.length > 0 && (
            <div className="q-table-wrap" tabIndex={0} role="region" aria-label="Query result">
              <table>
                <thead>
                  <tr>
                    {r.cols.map((c) => (
                      <th key={c} scope="col">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.rows.slice(0, 40).map((row, i) => (
                    <tr key={i}>
                      {r.cols.map((c) => (
                        <td key={c}>
                          {c === "link" && row[c] ? (
                            <a href={String(row[c])} target="_blank" rel="noopener noreferrer">
                              {String(row[c]).replace(/^https?:\/\//, "")}
                            </a>
                          ) : (
                            fmt(row[c])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
