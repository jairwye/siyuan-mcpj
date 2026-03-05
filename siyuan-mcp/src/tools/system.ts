import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = "6806";

export const systemTools: Tool[] = [
  {
    name: "get_boot_progress",
    description: "获取启动进度。Get boot progress.",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_version",
    description: "获取思源版本。Get SiYuan version.",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_current_time",
    description: "获取系统当前时间（毫秒时间戳）。Get system current time.",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "check_siyuan_status",
    description: "检查思源是否可达、API 是否可用。Check SiYuan connection and API.",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
  {
    name: "get_workspace_info",
    description: "获取工作空间连接信息（不包含 token）。Get workspace connection info.",
    inputSchema: { type: "object" as const, properties: {}, required: [] },
  },
];

export async function runSystem(name: string, _args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "get_boot_progress": {
      const d = await siyuan.bootProgress();
      return JSON.stringify(d, null, 2);
    }
    case "get_version": {
      const v = await siyuan.getVersion();
      return v;
    }
    case "get_current_time": {
      const t = await siyuan.currentTime();
      return String(t);
    }
    case "check_siyuan_status": {
      try {
        const v = await siyuan.getVersion();
        return JSON.stringify({ ok: true, version: v }, null, 2);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return JSON.stringify({ ok: false, error: msg }, null, 2);
      }
    }
    case "get_workspace_info": {
      const host = process.env.SIYUAN_HOST ?? DEFAULT_HOST;
      const port = process.env.SIYUAN_PORT ?? DEFAULT_PORT;
      return JSON.stringify({ host, port, tokenSet: !!process.env.SIYUAN_TOKEN }, null, 2);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
