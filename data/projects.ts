const GH = "https://github.com/sahilbanait/";

// "scene" names an animated picture in lib/art.ts. Private repos have no link.
export type Project = {
  groups: ("Data" | "AI" | "Platform" | "Apps")[];
  name: string;
  line: string;
  tools: string[];
  scene: string;
  url?: string;
  urlLabel?: string;
  inProgress?: boolean;
};

export const projects: Project[] = [
  {
    groups: ["Data"],
    name: "Snowflake Cost Analyzer",
    line: "Shows where Snowflake credits go.",
    tools: ["Snowflake", "Streamlit", "Python"],
    scene: "cost",
    url: GH + "Snowflake-Cost-Analyzer",
    urlLabel: "GitHub",
  },
  {
    groups: ["Data"],
    name: "Kafka to Snowflake pipeline",
    line: "Streams events into Snowflake.",
    tools: ["Kafka", "Snowflake", "Docker", "Python"],
    scene: "kafka",
    url: GH + "snowflake-kafka",
    urlLabel: "GitHub",
  },
  {
    groups: ["AI"],
    name: "Kumo",
    line: "My AI assistant on Slack.",
    tools: ["PydanticAI", "Ollama", "MCP", "Slack"],
    scene: "kumo",
  },
  {
    groups: ["Data", "AI"],
    name: "Informatica debugging agent",
    line: "Finds Informatica issues. Never changes anything.",
    tools: ["PydanticAI", "DuckDB", "Python"],
    scene: "debug",
  },
  {
    groups: ["Data", "AI"],
    name: "Informatica Cloud MCP server",
    line: "Lets AI read Informatica jobs and logs.",
    tools: ["Python", "MCP", "Informatica"],
    scene: "mcp",
  },
  {
    groups: ["AI"],
    name: "Research agent",
    line: "Finds and saves arXiv papers.",
    tools: ["MCP", "Ollama", "Streamlit"],
    scene: "research",
  },
  {
    groups: ["AI"],
    name: "LocalTrace",
    line: "Planned app to track local AI models.",
    tools: ["Python", "PySide6"],
    scene: "trace",
    inProgress: true,
  },
  {
    groups: ["Platform"],
    name: "Homelab observability",
    line: "Monitors my home servers.",
    tools: ["Prometheus", "Grafana", "Jaeger", "Docker"],
    scene: "homelab",
  },
  {
    groups: ["Platform"],
    name: "DRIFT",
    line: "Safe Docker updates with auto rollback.",
    tools: ["FastAPI", "Vue", "PostgreSQL", "Docker"],
    scene: "drift",
  },
  {
    groups: ["Apps"],
    name: "GainLog",
    line: "Fast workout logging for Android.",
    tools: ["Kotlin", "Firebase"],
    scene: "gainlog",
    url: "https://gainlog.com.au",
    urlLabel: "Website",
  },
  {
    groups: ["Apps"],
    name: "Tillmark",
    line: "Scans receipts into an encrypted vault.",
    tools: ["Flutter", "Dart"],
    scene: "tillmark",
  },
  {
    groups: ["Apps"],
    name: "Roster Planner",
    line: "Plans FIFO work rosters.",
    tools: ["Next.js", "Supabase", "Stripe"],
    scene: "roster",
  },
];

export const projectGroups = ["All", "Data", "AI", "Platform", "Apps"];
