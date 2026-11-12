// Lab prototypes read the site's real content as plain tables. Nothing here is new content:
// it is profile.ts and projects.ts reshaped, plus the links between them.
import { background, restCerts, stages, toolkit, topCerts } from "@/data/profile";
import { projects } from "@/data/projects";

export type Row = Record<string, string | number | string[]>;

export const projectRows: Row[] = projects.map((p) => ({
  name: p.name,
  line: p.line,
  groups: p.groups,
  tools: p.tools,
  status: p.inProgress ? "in progress" : p.url ? "live" : "private",
  link: p.url ?? "",
}));

const allCerts = [...topCerts, ...restCerts];
export const certRows: Row[] = allCerts.map((c) => ({
  name: c.n,
  issuer: c.o,
  tool: c.tool,
  issued: c.d.replace(/^Issued /, ""),
  valid_to: ((c as { v?: string }).v ?? "").replace(/^Valid to /, ""),
}));

export const stageRows: Row[] = stages.map((s, i) => ({
  step: i + 1,
  name: s.t,
  line: s.p,
  tools: s.tools,
}));

// Every tool the site mentions, with how often the rest of the site uses it.
const toolGroup = new Map<string, string>();
toolkit.forEach(([g, ts]) => ts.forEach((t) => toolGroup.set(t, g)));
const toolNames = new Set<string>([
  ...toolGroup.keys(),
  ...projects.flatMap((p) => p.tools),
  ...stages.flatMap((s) => s.tools),
  ...allCerts.map((c) => c.tool),
]);
export const toolRows: Row[] = [...toolNames].map((t) => ({
  name: t,
  group: toolGroup.get(t) ?? "Other",
  projects: projects.filter((p) => p.tools.includes(t)).length,
  certs: allCerts.filter((c) => c.tool === t).length,
  stages: stages.filter((s) => s.tools.includes(t)).length,
}));

export const backgroundRows: Row[] = background.map((b) => ({
  when: b.d,
  what: b.t,
  where: b.w,
}));

export const tables: Record<string, Row[]> = {
  projects: projectRows,
  certs: certRows,
  tools: toolRows,
  stages: stageRows,
  background: backgroundRows,
};

// The role a tool usually plays in a stack. Used only to lay out a project's tools left to right.
export const toolRole = (t: string) =>
  (
    {
      Kafka: "Ingest",
      Informatica: "Ingest",
      Airflow: "Ingest",
      Snowflake: "Store",
      DuckDB: "Store",
      PostgreSQL: "Store",
      Supabase: "Store",
      Firebase: "Store",
      Databricks: "Store",
      "Apache Iceberg": "Store",
      Streamlit: "Serve",
      Slack: "Serve",
      "Next.js": "Serve",
      Vue: "Serve",
      Grafana: "Serve",
      Stripe: "Serve",
      Docker: "Run",
      Prometheus: "Run",
      Jaeger: "Run",
      Terraform: "Run",
      "GitHub Actions": "Run",
    } as Record<string, string>
  )[t] ?? "Build";
export const ROLES = ["Ingest", "Build", "Store", "Serve", "Run"];
