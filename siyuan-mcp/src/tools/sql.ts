import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

export const sqlTools: Tool[] = [
  {
    name: "sql_query",
    description:
      "执行 SQL 查询，支持按标签、时间、路径等筛选 blocks 表。Execute SQL query (e.g. SELECT * FROM blocks WHERE ...).",
    inputSchema: {
      type: "object" as const,
      properties: {
        sql: { type: "string", description: "SQL 语句，如 SELECT * FROM blocks WHERE type='d' ORDER BY created DESC LIMIT 5" },
      },
      required: ["sql"],
    },
  },
  {
    name: "flush_transaction",
    description: "提交事务，确保数据持久化。Flush SQLite transaction.",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
];

export async function runSql(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "sql_query": {
      const rows = await siyuan.querySql(args.sql as string);
      return JSON.stringify(rows, null, 2);
    }
    case "flush_transaction":
      await siyuan.flushTransaction();
      return "ok";
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
