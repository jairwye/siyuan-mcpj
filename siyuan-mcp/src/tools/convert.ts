import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

export const convertTools: Tool[] = [
  {
    name: "pandoc_convert",
    description: "Pandoc 格式转换，dir 为工作目录名，args 为 pandoc 命令行参数。Pandoc convert.",
    inputSchema: {
      type: "object" as const,
      properties: {
        dir: { type: "string" },
        args: { type: "array", description: "如 ['--to','markdown_strict-raw_html','foo.epub','-o','foo.md']" },
      },
      required: ["dir", "args"],
    },
  },
];

export async function runConvert(name: string, args: Record<string, unknown>): Promise<string> {
  if (name !== "pandoc_convert") throw new Error(`Unknown tool: ${name}`);
  const d = await siyuan.pandocConvert(args.dir as string, args.args as string[]);
  return JSON.stringify(d, null, 2);
}
