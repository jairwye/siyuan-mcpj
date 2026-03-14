# 思源笔记 MCP 服务器 / SiYuan MCP Server

基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的思源笔记 MCP 服务器。  
推荐通过 **mcpo internal 单实例（默认最小暴露面）** 接入 Open WebUI。

[English](#english) | [中文](#中文)

---

## 中文

## 1. 架构与主线

推荐主线：

`Open WebUI -> mcpo-internal(宿主机) -> siyuan-mcpj(stdio) -> SiYuan API`

- `internal`：`siyuan-mcpj` + 可选内网工具（`memory` / `time` / `sequential-thinking`）
- `external`：默认禁用；仅在明确需要联网能力时再启用（如 `exa`）

## 2. 先说结论（最关键）

- `siyuan-mcpj` 是 **stdio MCP**，不是常驻 HTTP 服务。
- 你需要常驻的是 `mcpo` 进程（至少 internal）。
- `siyuan-mcpj` 不需要你单独常驻启动；由 `mcpo` 按需拉起。
- Node 方式需要先构建一次；Docker 方式通常不需要本地构建。

## 3. 前置准备

### 3.1 必需软件

- `uvx`（用于运行 `mcpo`）
- `docker`（若用 Docker 方式拉起 `siyuan-mcpj`）
- `node` + `npm`（若用 Node 方式拉起 `siyuan-mcpj`）

### 3.2 思源 API 信息

- `SIYUAN_HOST`：思源 API 地址（本机常见 `127.0.0.1`）
- `SIYUAN_PORT`：思源 API 端口（默认 `6806`）
- `SIYUAN_TOKEN`：思源 API 令牌（思源 -> 设置 -> 关于 -> API 令牌）

## 4. 环境变量（推荐）

创建 `~/.mcpo/.env`：

```bash
mkdir -p ~/.mcpo
cat > ~/.mcpo/.env <<'EOF'
# internal
MCPO_INTERNAL_PORT=8100
MCPO_INTERNAL_API_KEY=replace-with-a-long-random-key

# external (disabled by default)
# MCPO_EXTERNAL_PORT=8200
# MCPO_EXTERNAL_API_KEY=replace-with-a-long-random-key

# siyuan
SIYUAN_HOST=127.0.0.1
SIYUAN_PORT=6806
SIYUAN_TOKEN=replace-with-your-siyuan-token
SIYUAN_TIMEOUT_MS=15000

# external optional
# EXA_API_KEY=replace-with-your-exa-key
EOF
```

说明：

- 当前主流程里，`siyuan-mcpj` 的 `SIYUAN_*` 通常直接写在 `mcp-internal.json` 的命令参数或 `env` 字段中即可。
- 因此 `env.example` 不是运行必需项，只是变量参考模板，便于你统一管理。
- `external` 默认建议保持禁用，避免无必要的外网访问面。

## 5. `siyuan-mcpj` 两种运行方式

### 5.1 Docker 方式（推荐，通常免本地构建）

`mcpo` 会按需执行 `docker run --rm -i ... ghcr.io/jairwye/siyuan-mcpj:latest`。  
你只需要确保宿主机能执行 `docker`。

### 5.2 Node 方式（可选）

Node 方式需要先在本仓库构建一次：

```bash
cd "<your-local-path>/siyuan-mcp"
npm install
npm run build
```

构建产物入口：

`<your-local-path>/siyuan-mcp/dist/index.js`

## 6. mcpo 配置（默认 internal，external 可选）

### 6.1 internal（`~/.mcpo/mcp-internal.json`）

Docker 方案：

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "SIYUAN_HOST=127.0.0.1",
        "-e", "SIYUAN_PORT=6806",
        "-e", "SIYUAN_TOKEN=replace-with-your-siyuan-token",
        "-e", "SIYUAN_TIMEOUT_MS=15000",
        "ghcr.io/jairwye/siyuan-mcpj:latest"
      ]
    }
    /*
    ,"memory": {"command":"npx","args":["-y","@modelcontextprotocol/server-memory"]},
    "time": {"command":"uvx","args":["mcp-server-time","--local-timezone=Asia/Shanghai"]},
    "sequential-thinking": {"command":"npx","args":["-y","@modelcontextprotocol/server-sequential-thinking"]}
    */
  }
}
```

Node 方案（把路径改成你本机路径）：

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "node",
      "args": ["<your-local-path>/siyuan-mcp/dist/index.js"],
      "env": {
        "SIYUAN_HOST": "127.0.0.1",
        "SIYUAN_PORT": "6806",
        "SIYUAN_TOKEN": "replace-with-your-siyuan-token",
        "SIYUAN_TIMEOUT_MS": "15000"
      }
    }
  }
}
```

### 6.2 external（`~/.mcpo/mcp-external.json`）

> `exa` 默认注释为可选项，按需启用。  
> 启用 external 联网工具会引入外部网络访问，默认建议保持禁用。

```json
{
  "mcpServers": {
    /*
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "replace-with-your-exa-key"
      }
    }
    */
  }
}
```

### 6.3 最小权限原则（推荐）

- 默认只启用 `siyuan-mcpj`；`memory/time/sequential-thinking/exa` 按需逐个启用。
- 需要联网检索时再临时启用 `external`，完成后立即停用。
- 与 LLM 交互时，优先用“限定范围”提示词，避免全库扫描（例如：限定笔记本、文档路径、时间范围）。
- 避免在会话里直接粘贴明文密钥、账号、私密内容；先脱敏再提问。

## 7. 宿主机启动 mcpo（必须）

### 7.0 安全基线（建议先做）

先生成高强度 API key（internal 必需，external 仅启用时再生成）：

```bash
openssl rand -hex 32
```

先加载环境变量：

```bash
set -a; source ~/.mcpo/.env; set +a
```

启动 internal：

```bash
uvx mcpo \
  --host 127.0.0.1 \
  --port "${MCPO_INTERNAL_PORT}" \
  --api-key "${MCPO_INTERNAL_API_KEY}" \
  --config ~/.mcpo/mcp-internal.json
```

启动 external（可选）：

```bash
uvx mcpo \
  --host 127.0.0.1 \
  --port "${MCPO_EXTERNAL_PORT}" \
  --api-key "${MCPO_EXTERNAL_API_KEY}" \
  --config ~/.mcpo/mcp-external.json
```

### 7.1 常驻运行（推荐）

不建议把 `siyuan-mcpj` 本体常驻；建议常驻的是 `mcpo`（internal 必选，external 可选）。

#### 方案 A：macOS `launchd`（推荐）

1) 准备启动脚本（internal / external）：

`~/.mcpo/start-internal.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
set -a; source ~/.mcpo/.env; set +a
exec "$(which uvx)" mcpo \
  --host 127.0.0.1 \
  --port "${MCPO_INTERNAL_PORT}" \
  --api-key "${MCPO_INTERNAL_API_KEY}" \
  --config ~/.mcpo/mcp-internal.json
```

`~/.mcpo/start-external.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
set -a; source ~/.mcpo/.env; set +a
exec "$(which uvx)" mcpo \
  --host 127.0.0.1 \
  --port "${MCPO_EXTERNAL_PORT}" \
  --api-key "${MCPO_EXTERNAL_API_KEY}" \
  --config ~/.mcpo/mcp-external.json
```

授权：

```bash
chmod +x ~/.mcpo/start-internal.sh ~/.mcpo/start-external.sh
```

2) 创建 `plist`：

`~/Library/LaunchAgents/com.mcpo.internal.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.mcpo.internal</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>-lc</string><string>~/.mcpo/start-internal.sh</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/mcpo-internal.log</string>
  <key>StandardErrorPath</key><string>/tmp/mcpo-internal.err.log</string>
</dict>
</plist>
```

`~/Library/LaunchAgents/com.mcpo.external.plist`（可选，内容同上，把 label/脚本/日志名改为 external）。

external 完整示例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.mcpo.external</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>~/.mcpo/start-external.sh</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/mcpo-external.log</string>
  <key>StandardErrorPath</key><string>/tmp/mcpo-external.err.log</string>
</dict>
</plist>
```

也可以直接用命令创建（避免手工编辑）：

```bash
mkdir -p ~/Library/LaunchAgents
cat > ~/Library/LaunchAgents/com.mcpo.internal.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.mcpo.internal</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>-lc</string><string>~/.mcpo/start-internal.sh</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/mcpo-internal.log</string>
  <key>StandardErrorPath</key><string>/tmp/mcpo-internal.err.log</string>
</dict>
</plist>
EOF
```

external 命令式创建：

```bash
cat > ~/Library/LaunchAgents/com.mcpo.external.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.mcpo.external</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-lc</string>
    <string>~/.mcpo/start-external.sh</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/mcpo-external.log</string>
  <key>StandardErrorPath</key><string>/tmp/mcpo-external.err.log</string>
</dict>
</plist>
EOF
```

3) 加载与启动：

```bash
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/com.mcpo.internal.plist
launchctl kickstart -k "gui/$(id -u)/com.mcpo.internal"
```

external 可选：

```bash
launchctl bootstrap "gui/$(id -u)" ~/Library/LaunchAgents/com.mcpo.external.plist
launchctl kickstart -k "gui/$(id -u)/com.mcpo.external"
```

查看状态：

```bash
launchctl print "gui/$(id -u)/com.mcpo.internal"
tail -f /tmp/mcpo-internal.log
```

停用 / 卸载（macOS）：

```bash
launchctl bootout "gui/$(id -u)" ~/Library/LaunchAgents/com.mcpo.internal.plist
launchctl disable "gui/$(id -u)/com.mcpo.internal"
```

#### 方案 B：Linux `systemd`（用户级）

创建 `~/.config/systemd/user/mcpo-internal.service`：

```ini
[Unit]
Description=mcpo internal
After=network.target

[Service]
Type=simple
ExecStart=/bin/bash -lc 'set -a; source ~/.mcpo/.env; set +a; "$(which uvx)" mcpo --host 127.0.0.1 --port "${MCPO_INTERNAL_PORT}" --api-key "${MCPO_INTERNAL_API_KEY}" --config ~/.mcpo/mcp-internal.json'
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

启用：

```bash
systemctl --user daemon-reload
systemctl --user enable --now mcpo-internal
systemctl --user status mcpo-internal
```

#### 方案 C：`pm2`（跨平台可选）

```bash
pm2 start "~/.mcpo/start-internal.sh" --name mcpo-internal
pm2 save
pm2 startup
```

### 7.2 常驻后最小检查

```bash
curl -sS "http://127.0.0.1:8100/siyuan-mcpj/docs" >/dev/null && echo "internal ok"
lsof -nP -iTCP:8100 -sTCP:LISTEN
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"; [ -n "$LAN_IP" ] && curl -sS --max-time 2 "http://${LAN_IP}:8100/siyuan-mcpj/docs" || true
```

如果启用 external：

```bash
curl -sS "http://127.0.0.1:8200/exa/docs" >/dev/null && echo "external ok"
lsof -nP -iTCP:8200 -sTCP:LISTEN
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"; [ -n "$LAN_IP" ] && curl -sS --max-time 2 "http://${LAN_IP}:8200/exa/docs" || true
```

## 8. Open WebUI 接入

在 Open WebUI Tools 中填写完整工具子路径（不是根 URL）：

- internal：`http://host.docker.internal:8100/siyuan-mcpj`
- external（启用 exa 后）：`http://host.docker.internal:8200/exa`

Linux 下把 `host.docker.internal` 替换为宿主机内网 IP。

## 9. 验证步骤（建议按顺序）

1. 思源 API 可用：

```bash
curl -X POST "http://127.0.0.1:6806/api/system/version" \
  -H "Authorization: Token <your-token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

2. internal docs：`http://127.0.0.1:8100/siyuan-mcpj/docs`
3. 端口监听检查：`lsof -nP -iTCP:8100 -sTCP:LISTEN`（确认是 `127.0.0.1`）
4. external docs（启用后）：`http://127.0.0.1:8200/exa/docs`
5. 敏感信息自检（按需替换路径）：

```bash
rg -n "SIYUAN_TOKEN|MCPO_.*API_KEY|EXA_API_KEY" ~/.mcpo /tmp/mcpo*.log /tmp/mcpo*.err.log
```

6. 密钥轮换后重启服务并复测：

```bash
launchctl kickstart -k "gui/$(id -u)/com.mcpo.internal"
```

## 10. 常见问题

- **问：需要手动运行 `node dist/index.js` 吗？**  
  不需要。正常用法是由 `mcpo` 按需拉起。

- **问：需要 `docker compose up -d siyuan-mcpj` 吗？**  
  不需要。该项目是 stdio MCP，这不是推荐主线。

- **问：`mcpo` 报找不到 `docker`？**  
  若由 `launchd/systemd` 启动，可能 PATH 不完整。可改 Docker 绝对路径或切换 Node 方案。

## 11. 文件说明

- `env.example`：变量模板
- `docker-compose.yml`：镜像与环境示例（非推荐常驻方式）

---

## English

Recommended path:

`Open WebUI -> host mcpo (internal by default) -> siyuan-mcpj(stdio) -> SiYuan API`

Key points:

- `siyuan-mcpj` is a stdio MCP server, not a long-running HTTP service.
- Keep `mcpo` running on host; let it spawn `siyuan-mcpj` on demand.
- Docker mode usually needs no local build; Node mode requires one-time build.
