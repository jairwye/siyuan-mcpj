import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

export const documentTools: Tool[] = [
  {
    name: "create_doc",
    description: "在指定笔记本中新建文档，支持 Markdown 内容。Create a document with Markdown.",
    inputSchema: {
      type: "object" as const,
      properties: {
        notebook: { type: "string", description: "笔记本 ID" },
        path: { type: "string", description: "文档路径，以 / 开头" },
        markdown: { type: "string", description: "Markdown 内容" },
      },
      required: ["notebook", "path", "markdown"],
    },
  },
  {
    name: "rename_doc",
    description: "按路径重命名文档。Rename document by path.",
    inputSchema: {
      type: "object" as const,
      properties: {
        notebook: { type: "string" },
        path: { type: "string" },
        title: { type: "string" },
      },
      required: ["notebook", "path", "title"],
    },
  },
  {
    name: "rename_doc_by_id",
    description: "按文档 ID 重命名。Rename document by ID.",
    inputSchema: {
      type: "object" as const,
      properties: { id: { type: "string" }, title: { type: "string" } },
      required: ["id", "title"],
    },
  },
  {
    name: "remove_doc",
    description: "按路径删除文档。Remove document by path.",
    inputSchema: {
      type: "object" as const,
      properties: { notebook: { type: "string" }, path: { type: "string" } },
      required: ["notebook", "path"],
    },
  },
  {
    name: "remove_doc_by_id",
    description: "按文档 ID 删除。Remove document by ID.",
    inputSchema: { type: "object" as const, properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "move_docs",
    description: "按路径移动文档。Move documents by path.",
    inputSchema: {
      type: "object" as const,
      properties: {
        fromPaths: { type: "array", description: "源路径数组" },
        toNotebook: { type: "string" },
        toPath: { type: "string" },
      },
      required: ["fromPaths", "toNotebook", "toPath"],
    },
  },
  {
    name: "move_docs_by_id",
    description: "按文档 ID 移动。Move documents by ID.",
    inputSchema: {
      type: "object" as const,
      properties: {
        fromIDs: { type: "array", description: "源文档 ID 数组" },
        toID: { type: "string", description: "目标父文档或笔记本 ID" },
      },
      required: ["fromIDs", "toID"],
    },
  },
  {
    name: "get_hpath_by_path",
    description: "根据路径获取人类可读路径。Get human-readable path by path.",
    inputSchema: {
      type: "object" as const,
      properties: { notebook: { type: "string" }, path: { type: "string" } },
      required: ["notebook", "path"],
    },
  },
  {
    name: "get_hpath_by_id",
    description: "根据 ID 获取人类可读路径。Get human-readable path by ID.",
    inputSchema: { type: "object" as const, properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "get_path_by_id",
    description: "根据 ID 获取存储路径。Get storage path by ID.",
    inputSchema: { type: "object" as const, properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "get_ids_by_hpath",
    description: "根据人类可读路径获取 IDs。Get block IDs by human-readable path.",
    inputSchema: {
      type: "object" as const,
      properties: { path: { type: "string" }, notebook: { type: "string" } },
      required: ["path", "notebook"],
    },
  },
];

export async function runDocument(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "create_doc": {
      const id = await siyuan.createDocWithMd(
        args.notebook as string,
        args.path as string,
        (args.markdown as string) ?? ""
      );
      return JSON.stringify({ id }, null, 2);
    }
    case "rename_doc":
      await siyuan.renameDoc(args.notebook as string, args.path as string, args.title as string);
      return "ok";
    case "rename_doc_by_id":
      await siyuan.renameDocByID(args.id as string, args.title as string);
      return "ok";
    case "remove_doc":
      await siyuan.removeDoc(args.notebook as string, args.path as string);
      return "ok";
    case "remove_doc_by_id":
      await siyuan.removeDocByID(args.id as string);
      return "ok";
    case "move_docs":
      await siyuan.moveDocs(
        args.fromPaths as string[],
        args.toNotebook as string,
        args.toPath as string
      );
      return "ok";
    case "move_docs_by_id":
      await siyuan.moveDocsByID(args.fromIDs as string[], args.toID as string);
      return "ok";
    case "get_hpath_by_path": {
      const h = await siyuan.getHPathByPath(args.notebook as string, args.path as string);
      return h;
    }
    case "get_hpath_by_id": {
      const h = await siyuan.getHPathByID(args.id as string);
      return h;
    }
    case "get_path_by_id": {
      const p = await siyuan.getPathByID(args.id as string);
      return JSON.stringify(p, null, 2);
    }
    case "get_ids_by_hpath": {
      const ids = await siyuan.getIDsByHPath(args.path as string, args.notebook as string);
      return JSON.stringify(ids, null, 2);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
