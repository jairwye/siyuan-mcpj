import type { Tool } from "../types-mcp.js";
import * as siyuan from "../client/siyuan.js";

export const blockTools: Tool[] = [
  {
    name: "insert_block",
    description: "插入块，支持指定位置和数据类型 (markdown/dom)。Insert a block.",
    inputSchema: {
      type: "object" as const,
      properties: {
        data: { type: "string" },
        dataType: { type: "string", description: "markdown 或 dom" },
        nextID: { type: "string" },
        previousID: { type: "string" },
        parentID: { type: "string" },
      },
      required: ["data", "dataType"],
    },
  },
  {
    name: "prepend_block",
    description: "在父块开头插入子块。Prepend child block.",
    inputSchema: {
      type: "object" as const,
      properties: {
        data: { type: "string" },
        dataType: { type: "string" },
        parentID: { type: "string" },
      },
      required: ["data", "dataType", "parentID"],
    },
  },
  {
    name: "append_block",
    description: "在父块末尾插入子块。Append child block.",
    inputSchema: {
      type: "object" as const,
      properties: {
        data: { type: "string" },
        dataType: { type: "string" },
        parentID: { type: "string" },
      },
      required: ["data", "dataType", "parentID"],
    },
  },
  {
    name: "update_block",
    description: "更新块内容。Update block content.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        data: { type: "string" },
        dataType: { type: "string" },
      },
      required: ["id", "data", "dataType"],
    },
  },
  {
    name: "delete_block",
    description: "删除块。Delete a block.",
    inputSchema: { type: "object" as const, properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "move_block",
    description: "移动块到新位置。Move block.",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: { type: "string" },
        previousID: { type: "string" },
        parentID: { type: "string" },
      },
      required: ["id"],
    },
  },
  {
    name: "get_block_kramdown",
    description: "获取块 kramdown 源码，用于导出或上下文。Get block kramdown source.",
    inputSchema: { type: "object" as const, properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "get_child_blocks",
    description: "获取子块列表。Get child blocks.",
    inputSchema: { type: "object" as const, properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "fold_block",
    description: "折叠块。Fold block.",
    inputSchema: { type: "object" as const, properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "unfold_block",
    description: "展开块。Unfold block.",
    inputSchema: { type: "object" as const, properties: { id: { type: "string" } }, required: ["id"] },
  },
  {
    name: "transfer_block_ref",
    description: "转移块引用。Transfer block references.",
    inputSchema: {
      type: "object" as const,
      properties: {
        fromID: { type: "string" },
        toID: { type: "string" },
        refIDs: { type: "array", description: "可选，引用块 ID 数组" },
      },
      required: ["fromID", "toID"],
    },
  },
];

export async function runBlock(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "insert_block": {
      const d = await siyuan.insertBlock({
        data: args.data as string,
        dataType: (args.dataType as "markdown" | "dom") || "markdown",
        nextID: args.nextID as string | undefined,
        previousID: args.previousID as string | undefined,
        parentID: args.parentID as string | undefined,
      });
      return JSON.stringify(d, null, 2);
    }
    case "prepend_block": {
      const d = await siyuan.prependBlock(
        args.data as string,
        (args.dataType as "markdown" | "dom") || "markdown",
        args.parentID as string
      );
      return JSON.stringify(d, null, 2);
    }
    case "append_block": {
      const d = await siyuan.appendBlock(
        args.data as string,
        (args.dataType as "markdown" | "dom") || "markdown",
        args.parentID as string
      );
      return JSON.stringify(d, null, 2);
    }
    case "update_block": {
      await siyuan.updateBlock(
        args.id as string,
        args.data as string,
        (args.dataType as "markdown" | "dom") || "markdown"
      );
      return "ok";
    }
    case "delete_block":
      await siyuan.deleteBlock(args.id as string);
      return "ok";
    case "move_block":
      await siyuan.moveBlock(
        args.id as string,
        args.previousID as string | undefined,
        args.parentID as string | undefined
      );
      return "ok";
    case "get_block_kramdown": {
      const d = await siyuan.getBlockKramdown(args.id as string);
      return JSON.stringify(d, null, 2);
    }
    case "get_child_blocks": {
      const d = await siyuan.getChildBlocks(args.id as string);
      return JSON.stringify(d, null, 2);
    }
    case "fold_block":
      await siyuan.foldBlock(args.id as string);
      return "ok";
    case "unfold_block":
      await siyuan.unfoldBlock(args.id as string);
      return "ok";
    case "transfer_block_ref":
      await siyuan.transferBlockRef(
        args.fromID as string,
        args.toID as string,
        args.refIDs as string[] | undefined
      );
      return "ok";
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
