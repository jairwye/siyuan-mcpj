# siyuan-mcpj

思源笔记 MCP 服务器：基于 [MCP](https://modelcontextprotocol.io/) 将思源 API 封装为工具集，推荐以 **mcpo internal 单实例（最小暴露面）** 接入 Open WebUI。

## 推荐部署主线

`Open WebUI -> mcpo-internal(宿主机) -> siyuan-mcpj(stdio) -> SiYuan API`

- internal：`siyuan-mcpj` + 可选内网工具（memory/time/sequential-thinking）
- external：默认禁用，仅在明确需要联网能力时临时启用（如 exa）

## 文档入口

- 主文档：`siyuan-mcp/README.md`
- 双实例本地指南：`plan/mcpo双实例本地配置指南.md`（本地文档）
- 规划文档：`plan/siyuan-mcp规划.md`（本地文档）
- 规则约束：`plan/规则.md`（本地文档）

## 说明

- `siyuan-mcpj` 是 stdio MCP，不是常驻 HTTP 服务。
- 由宿主机 `mcpo` 按需拉起（Node 或 Docker 命令）。
- 完整启动、构建与排障步骤见主文档。
- 安全默认建议：只启用 `internal`、`mcpo` 仅监听 `127.0.0.1`、使用高强度 API key。
