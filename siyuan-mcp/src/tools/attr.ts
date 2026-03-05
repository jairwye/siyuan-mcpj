import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

export const attrTools: Tool[] = [
  {
    name: "set_block_attrs",
    description: "设置块属性，自定义属性以 custom- 为前缀。Set block attributes.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        attrs: { type: "object", description: "键值对，自定义键以 custom- 开头" },
      },
      required: ["id", "attrs"],
    },
  },
  {
    name: "get_block_attrs",
    description: "获取块属性。Get block attributes.",
    inputSchema: { type: "object" as const, properties: { id: { type: "string" } }, required: ["id"] },
  },
];

export async function runAttr(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "set_block_attrs":
      await siyuan.setBlockAttrs(args.id as string, args.attrs as Record<string, string>);
      return "ok";
    case "get_block_attrs": {
      const d = await siyuan.getBlockAttrs(args.id as string);
      return JSON.stringify(d, null, 2);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
