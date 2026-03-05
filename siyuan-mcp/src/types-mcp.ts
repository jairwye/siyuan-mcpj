/**
 * MCP tool definition for tools/list.
 */
export interface Tool {
  name: string;
  description?: string;
  inputSchema: {
    type: "object";
    properties?: Record<string, { type: string; description?: string }>;
    required?: string[];
  };
}
