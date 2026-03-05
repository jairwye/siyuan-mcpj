import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

export const exportTools: Tool[] = [
  {
    name: "export_md_content",
    description: "导出块/文档为 Markdown 文本。Export block or doc as Markdown.",
    inputSchema: {
      type: "object" as const,
      properties: { id: { type: "string", description: "文档块 ID" } },
      required: ["id"],
    },
  },
  {
    name: "export_resources",
    description: "导出文件与目录为 zip。Export files/dirs as zip.",
    inputSchema: {
      type: "object" as const,
      properties: {
        paths: { type: "array", description: "要导出的路径列表" },
        name: { type: "string", description: "zip 文件名（可选）" },
      },
      required: ["paths"],
    },
  },
];

export async function runExport(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "export_md_content": {
      const d = await siyuan.exportMdContent(args.id as string);
      return JSON.stringify(d, null, 2);
    }
    case "export_resources": {
      const d = await siyuan.exportResources(
        args.paths as string[],
        args.name as string | undefined
      );
      return JSON.stringify(d, null, 2);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
