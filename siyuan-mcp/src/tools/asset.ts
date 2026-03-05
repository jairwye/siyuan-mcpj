import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

export const assetTools: Tool[] = [
  {
    name: "upload_asset",
    description:
      "上传资源文件。files 为数组，每项为 { name: 文件名, content: base64 或 UTF-8 文本 }，或 contentBase64 表示 content 为 base64。Upload assets.",
    inputSchema: {
      type: "object" as const,
      properties: {
        assetsDirPath: { type: "string", description: "如 /assets/" },
        files: {
          type: "array",
          description: "Array of { name: string, content: string, contentBase64?: boolean }",
        },
      },
      required: ["assetsDirPath", "files"],
    },
  },
];

export async function runAsset(name: string, args: Record<string, unknown>): Promise<string> {
  if (name !== "upload_asset") throw new Error(`Unknown tool: ${name}`);
  const assetsDirPath = args.assetsDirPath as string;
  const filesInput = args.files as Array<{ name: string; content: string; contentBase64?: boolean }>;
  const files = filesInput.map((f) => {
    const data =
      f.contentBase64 ?
        Buffer.from(f.content, "base64")
      : new TextEncoder().encode(f.content);
    return { name: f.name, data: new Blob([data]) };
  });
  const d = await siyuan.uploadAsset(assetsDirPath, files);
  return JSON.stringify(d, null, 2);
}
