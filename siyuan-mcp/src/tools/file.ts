import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

export const fileTools: Tool[] = [
  {
    name: "get_file",
    description: "获取工作空间下文件内容，返回 base64。Get file content (path relative to workspace).",
    inputSchema: {
      type: "object" as const,
      properties: { path: { type: "string", description: "工作空间下的文件路径" } },
      required: ["path"],
    },
  },
  {
    name: "put_file",
    description: "写入文件，content 为 UTF-8 文本或 base64（若 isBase64=true）。Put file content.",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: { type: "string" },
        content: { type: "string" },
        isBase64: { type: "boolean", description: "若为 true，content 为 base64" },
        isDir: { type: "boolean", description: "为 true 时仅创建目录" },
        modTime: { type: "number", description: "Unix 时间戳" },
      },
      required: ["path"],
    },
  },
  {
    name: "remove_file",
    description: "删除文件。Remove file.",
    inputSchema: {
      type: "object" as const,
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
  {
    name: "rename_file",
    description: "重命名文件。Rename file.",
    inputSchema: {
      type: "object" as const,
      properties: { path: { type: "string" }, newPath: { type: "string" } },
      required: ["path", "newPath"],
    },
  },
  {
    name: "read_dir",
    description: "列出目录内容。List directory.",
    inputSchema: {
      type: "object" as const,
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
];

export async function runFile(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "get_file": {
      const buf = await siyuan.getFile(args.path as string);
      return Buffer.from(buf).toString("base64");
    }
    case "put_file": {
      const path = args.path as string;
      const isDir = args.isDir as boolean | undefined;
      const modTime = args.modTime as number | undefined;
      if (isDir) {
        await siyuan.putFile(path, new Blob(), true, modTime);
        return "ok";
      }
      const content = args.content as string | undefined;
      const isBase64 = args.isBase64 as boolean | undefined;
      let body: Blob;
      if (content === undefined || content === "") {
        body = new Blob([]);
      } else if (isBase64) {
        body = new Blob([Buffer.from(content, "base64")]);
      } else {
        body = new Blob([content], { type: "text/plain;charset=utf-8" });
      }
      await siyuan.putFile(path, body, false, modTime);
      return "ok";
    }
    case "remove_file":
      await siyuan.removeFile(args.path as string);
      return "ok";
    case "rename_file":
      await siyuan.renameFile(args.path as string, args.newPath as string);
      return "ok";
    case "read_dir": {
      const d = await siyuan.readDir(args.path as string);
      return JSON.stringify(d, null, 2);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
