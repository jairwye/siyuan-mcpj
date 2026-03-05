import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

export const templateTools: Tool[] = [
  {
    name: "render_template",
    description: "渲染模板文件，path 为模板文件绝对路径。Render template file.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string", description: "调用所在文档 ID" },
        path: { type: "string", description: "模板文件绝对路径" },
      },
      required: ["id", "path"],
    },
  },
  {
    name: "render_sprig",
    description: "渲染 Sprig 内联模板。Render Sprig template string.",
    inputSchema: {
      type: "object" as const,
      properties: { template: { type: "string" } },
      required: ["template"],
    },
  },
];

export async function runTemplate(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "render_template": {
      const d = await siyuan.renderTemplate(args.id as string, args.path as string);
      return JSON.stringify(d, null, 2);
    }
    case "render_sprig": {
      const s = await siyuan.renderSprig(args.template as string);
      return s;
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
