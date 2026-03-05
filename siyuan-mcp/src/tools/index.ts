import { notebookTools, runNotebook } from "./notebook.js";
import { documentTools, runDocument } from "./document.js";
import { blockTools, runBlock } from "./block.js";
import { attrTools, runAttr } from "./attr.js";
import { sqlTools, runSql } from "./sql.js";
import { fileTools, runFile } from "./file.js";
import { exportTools, runExport } from "./export.js";
import { notificationTools, runNotification } from "./notification.js";
import { systemTools, runSystem } from "./system.js";
import { templateTools, runTemplate } from "./template.js";
import { convertTools, runConvert } from "./convert.js";
import { assetTools, runAsset } from "./asset.js";
import type { Tool } from "../types-mcp.js";

export const allTools: Tool[] = [
  ...notebookTools,
  ...documentTools,
  ...blockTools,
  ...attrTools,
  ...sqlTools,
  ...fileTools,
  ...exportTools,
  ...notificationTools,
  ...systemTools,
  ...templateTools,
  ...convertTools,
  ...assetTools,
];

const runners: Record<
  string,
  (name: string, args: Record<string, unknown>) => Promise<string>
> = {
  ...Object.fromEntries(notebookTools.map((t) => [t.name, runNotebook])),
  ...Object.fromEntries(documentTools.map((t) => [t.name, runDocument])),
  ...Object.fromEntries(blockTools.map((t) => [t.name, runBlock])),
  ...Object.fromEntries(attrTools.map((t) => [t.name, runAttr])),
  ...Object.fromEntries(sqlTools.map((t) => [t.name, runSql])),
  ...Object.fromEntries(fileTools.map((t) => [t.name, runFile])),
  ...Object.fromEntries(exportTools.map((t) => [t.name, runExport])),
  ...Object.fromEntries(notificationTools.map((t) => [t.name, runNotification])),
  ...Object.fromEntries(systemTools.map((t) => [t.name, runSystem])),
  ...Object.fromEntries(templateTools.map((t) => [t.name, runTemplate])),
  ...Object.fromEntries(convertTools.map((t) => [t.name, runConvert])),
  ...Object.fromEntries(assetTools.map((t) => [t.name, runAsset])),
};

export async function callTool(name: string, args: Record<string, unknown>): Promise<string> {
  const run = runners[name];
  if (!run) throw new Error(`Unknown tool: ${name}`);
  return run(name, args ?? {});
}
