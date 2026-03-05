import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

export const notebookTools: Tool[] = [
  {
    name: "list_notebooks",
    description: "列出所有笔记本，获取笔记本 ID 和名称。List all notebooks.",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "open_notebook",
    description: "打开指定笔记本。Open a notebook by ID.",
    inputSchema: {
      type: "object" as const,
      properties: { notebook: { type: "string", description: "笔记本 ID" } },
      required: ["notebook"],
    },
  },
  {
    name: "close_notebook",
    description: "关闭指定笔记本。Close a notebook by ID.",
    inputSchema: {
      type: "object" as const,
      properties: { notebook: { type: "string", description: "笔记本 ID" } },
      required: ["notebook"],
    },
  },
  {
    name: "rename_notebook",
    description: "重命名笔记本。Rename a notebook.",
    inputSchema: {
      type: "object" as const,
      properties: {
        notebook: { type: "string", description: "笔记本 ID" },
        name: { type: "string", description: "新名称" },
      },
      required: ["notebook", "name"],
    },
  },
  {
    name: "create_notebook",
    description: "创建新笔记本。Create a new notebook.",
    inputSchema: {
      type: "object" as const,
      properties: { name: { type: "string", description: "笔记本名称" } },
      required: ["name"],
    },
  },
  {
    name: "remove_notebook",
    description: "删除笔记本。Remove a notebook by ID.",
    inputSchema: {
      type: "object" as const,
      properties: { notebook: { type: "string", description: "笔记本 ID" } },
      required: ["notebook"],
    },
  },
  {
    name: "get_notebook_conf",
    description: "获取笔记本配置信息。Get notebook configuration.",
    inputSchema: {
      type: "object" as const,
      properties: { notebook: { type: "string", description: "笔记本 ID" } },
      required: ["notebook"],
    },
  },
  {
    name: "set_notebook_conf",
    description: "保存笔记本配置。Set notebook configuration.",
    inputSchema: {
      type: "object" as const,
      properties: {
        notebook: { type: "string", description: "笔记本 ID" },
        conf: { type: "object", description: "配置对象 (JSON)" },
      },
      required: ["notebook", "conf"],
    },
  },
];

export async function runNotebook(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "list_notebooks": {
      const d = await siyuan.lsNotebooks();
      return JSON.stringify(d, null, 2);
    }
    case "open_notebook":
      await siyuan.openNotebook(args.notebook as string);
      return "ok";
    case "close_notebook":
      await siyuan.closeNotebook(args.notebook as string);
      return "ok";
    case "rename_notebook":
      await siyuan.renameNotebook(args.notebook as string, args.name as string);
      return "ok";
    case "create_notebook": {
      const d = await siyuan.createNotebook(args.name as string);
      return JSON.stringify(d, null, 2);
    }
    case "remove_notebook":
      await siyuan.removeNotebook(args.notebook as string);
      return "ok";
    case "get_notebook_conf": {
      const d = await siyuan.getNotebookConf(args.notebook as string);
      return JSON.stringify(d, null, 2);
    }
    case "set_notebook_conf":
      await siyuan.setNotebookConf(args.notebook as string, args.conf as Record<string, unknown>);
      return "ok";
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
