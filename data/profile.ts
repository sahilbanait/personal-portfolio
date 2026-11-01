// All the site's wording lives here and in projects.ts.

export const profile = {
  name: "Sahil Kumar",
  title: "Data Engineer",
  location: "Perth, Australia",
  pitch: "I build data platforms teams can rely on.",
  taglineWords: ["data platforms", "data pipelines", "AI agents"],
  links: {
    linkedin: "https://www.linkedin.com/in/sahil-kumar-30424419b",
    github: "https://github.com/sahilbanait",
    certifications:
      "https://www.linkedin.com/in/sahil-kumar-30424419b/details/certifications/",
    // Set these to show them on the site: an address, and a path such as "/resume.pdf".
    email: null as string | null,
    resume: null as string | null,
  },
};

export const nav = [
  { href: "#lifecycle", label: "Data engineering" },
  { href: "#ai", label: "AI and agents" },
  { href: "#projects", label: "Projects" },
  { href: "#certifications", label: "Certifications" },
  { href: "#toolkit", label: "Toolkit" },
  { href: "#life", label: "Outside work" },
  { href: "#background", label: "Background" },
  { href: "#contact", label: "Contact" },
];

export const marquee = [
  ["Snowflake", "Snowpark", "Apache Iceberg", "Databricks", "dbt", "Airflow", "Kafka", "Informatica", "Python", "SQL", "Docker", "Terraform"],
  ["Claude Code", "Codex", "Gemini", "Perplexity", "Ollama", "MCP", "Jupyter notebooks", "Streamlit", "PyCharm", "VS Code"],
];

export type Stage = { t: string; p: string; tools: string[]; ai?: boolean };
export const stages: Stage[] = [
  { t: "Ingest", p: "Batch and streaming data.", tools: ["Kafka", "Informatica", "Python"] },
  { t: "Store", p: "Warehouses, lakehouses, open tables.", tools: ["Snowflake", "Databricks", "Apache Iceberg"] },
  { t: "Transform", p: "Clean data, written as code.", tools: ["dbt", "Snowpark", "SQL", "Jupyter notebooks"] },
  { t: "Orchestrate", p: "Automated pipelines and infrastructure.", tools: ["Airflow", "Terraform", "GitHub Actions"] },
  { t: "Observe", p: "Catch problems early.", tools: ["Informatica", "Grafana", "Python"] },
  { t: "Govern", p: "Know what the data means.", tools: ["Informatica", "Snowflake"] },
  { t: "Serve", p: "Dashboards and data apps.", tools: ["Streamlit", "Snowflake"] },
  { t: "AI and agents", p: "AI that uses and explains data.", tools: ["Snowflake Cortex", "Ollama", "MCP", "Python"], ai: true },
];

export const aiSkills = [
  { n: "Build agents", p: "Agents that use tools and stay within limits.", t: ["PydanticAI", "LangGraph", "Python"] },
  { n: "Connect tools", p: "Link AI to real systems, safely.", t: ["MCP", "Python", "Claude Code"] },
  { n: "Run local models", p: "Private models on my own GPU.", t: ["Ollama", "Open WebUI", "Docker"] },
  { n: "Warehouse AI", p: "AI that runs where the data lives.", t: ["Snowflake Cortex", "SQL", "Streamlit"] },
  { n: "Code with AI", p: "Code faster, and check the output.", t: ["Claude Code", "Codex", "Gemini", "Antigravity"] },
  { n: "Research and test", p: "Try ideas fast in notebooks.", t: ["Perplexity", "Jupyter notebooks", "Python"] },
];

// From the LinkedIn profile. "tool" picks the badge logo.
export const topCerts = [
  { n: "SnowPro Advanced: Data Engineer", o: "Snowflake", tool: "Snowflake", d: "Issued Jan 2026", v: "Valid to Jan 2028", big: true },
  { n: "Apache Airflow 3 Fundamentals", o: "Astronomer", tool: "Airflow", d: "Issued Jul 2025" },
  { n: "SnowPro Specialty: Snowpark", o: "Snowflake", tool: "Snowflake", d: "Issued Nov 2024", v: "Valid to Jan 2027" },
];
export const restCerts = [
  { n: "SnowPro Associate: Platform", o: "Snowflake", tool: "Snowflake", d: "Jan 2026" },
  { n: "SnowPro Core", o: "Snowflake", tool: "Snowflake", d: "Aug 2023" },
  { n: "dbt Fundamentals", o: "dbt Labs", tool: "dbt", d: "Aug 2023" },
  { n: "Data Engineering Foundation", o: "Informatica", tool: "Informatica", d: "Aug 2023" },
  { n: "Cloud Data Governance & Catalog Foundation", o: "Informatica", tool: "Informatica", d: "Jun 2023" },
  { n: "IDMC CDGC Partner Bootcamp Associate", o: "Informatica", tool: "Informatica", d: "May 2023" },
  { n: "Hands-On Essentials: Data Engineering", o: "Snowflake", tool: "Snowflake", d: "Apr 2023" },
];

export const toolkit: [string, string[]][] = [
  ["Data", ["Snowflake", "Snowpark", "Apache Iceberg", "Databricks", "dbt", "Airflow", "Kafka", "Informatica"]],
  ["Languages", ["Python", "SQL", "Kotlin", "TypeScript"]],
  ["AI", ["Claude Code", "Codex", "Gemini", "Perplexity", "Ollama", "MCP"]],
  ["Infrastructure", ["Docker", "Terraform", "GitHub Actions", "Grafana"]],
  ["Apps", ["Streamlit", "Next.js"]],
  ["Daily", ["PyCharm", "VS Code", "Jupyter notebooks", "Postman"]],
];

export const hobbies = [
  { n: "Gym and fitness", p: "I train, and log it in my own app.", a: "barbell" },
  { n: "Homelab", p: "Self-hosting, and monitoring it.", a: "rack" },
  { n: "Local AI", p: "Running models on my own machine.", a: "chat" },
];

export const background = [
  { d: "Now", t: "Data Engineer", w: "Perth, Australia" },
  { d: "2021", t: "Diploma of Software Development", w: "Australis College" },
  { d: "2018–2020", t: "Bachelor of Business", w: "Murdoch University" },
  { d: "2017–2018", t: "Advanced Diploma of Leadership and Management", w: "Cambridge International College" },
];
