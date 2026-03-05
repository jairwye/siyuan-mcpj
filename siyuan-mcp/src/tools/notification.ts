import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

export const notificationTools: Tool[] = [
  {
    name: "push_msg",
    description: "向思源推送普通消息。Push message to SiYuan.",
    inputSchema: {
      type: "object" as const,
      properties: {
        msg: { type: "string" },
        timeout: { type: "number", description: "毫秒，可选" },
      },
      required: ["msg"],
    },
  },
  {
    name: "push_err_msg",
    description: "向思源推送错误消息。Push error message to SiYuan.",
    inputSchema: {
      type: "object" as const,
      properties: {
        msg: { type: "string" },
        timeout: { type: "number", description: "毫秒，可选" },
      },
      required: ["msg"],
    },
  },
];

export async function runNotification(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "push_msg": {
      const d = await siyuan.pushMsg(args.msg as string, args.timeout as number | undefined);
      return JSON.stringify(d, null, 2);
    }
    case "push_err_msg": {
      const d = await siyuan.pushErrMsg(args.msg as string, args.timeout as number | undefined);
      return JSON.stringify(d, null, 2);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
