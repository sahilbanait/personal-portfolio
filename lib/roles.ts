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
