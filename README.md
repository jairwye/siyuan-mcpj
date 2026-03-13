# siyuan-mcpj

思源笔记 MCP 服务器：基于 [MCP](https://modelcontextprotocol.io/) 将思源 API 封装为工具集，推荐以 **mcpo 宿主机双实例** 接入 Open WebUI。

## 推荐部署主线

`Open WebUI -> mcpo-internal / mcpo-external(宿主机) -> siyuan-mcpj(stdio) -> SiYuan API`

- internal：`siyuan-mcpj` + 可选内网工具（memory/time/sequential-thinking）
- external：可选联网工具（如 exa，默认注释）

## 文档入口

- 主文档：`siyuan-mcp/README.md`
- 双实例本地指南：`plan/mcpo双实例本地配置指南.md`（本地文档）
- 规划文档：`plan/siyuan-mcp规划.md`（本地文档）
- 规则约束：`plan/规则.md`（本地文档）

## 说明

- `siyuan-mcpj` 是 stdio MCP，不是常驻 HTTP 服务。
- 由宿主机 `mcpo` 按需拉起（Node 或 Docker 命令）。
- 完整启动、构建与排障步骤见主文档。
