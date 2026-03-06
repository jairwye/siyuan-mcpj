# 思源笔记 MCP 服务器 / SiYuan MCP Server

基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的思源笔记服务器，将思源内核 API 封装为约 **49 个工具**，可在本机或以 Docker 运行，打通 **MCP + mcpo + Open WebUI + LM Studio** 路径，支撑「知识库问答」「AI 总结写回」等闭环。

[English](#english) | [中文](#中文)

---

## 中文

### 环境变量

| 变量 | 说明 | 默认 | 必需 |
|------|------|------|------|
| `SIYUAN_HOST` | 思源 API 地址 | 127.0.0.1 | 否 |
| `SIYUAN_PORT` | 思源 API 端口 | 6806 | 否 |
| `SIYUAN_TOKEN` | 思源 API 令牌 | - | **是** |

API 令牌获取：思源 → 设置 → 关于 → API 令牌。

### 快速开始

**npx（推荐先本地构建）**

```bash
git clone <本仓库>
cd siyuan-mcp
npm install && npm run build
SIYUAN_HOST=<SIYUAN_HOST> SIYUAN_PORT=<SIYUAN_PORT> SIYUAN_TOKEN=<你的API令牌> node dist/index.js
```

**Docker**

```bash
docker build -t siyuan-mcpj .
docker run -d \
  -e SIYUAN_HOST=<思源在内网的可访问地址> \
  -e SIYUAN_PORT=<思源API端口> \
  -e SIYUAN_TOKEN=<你的API令牌> \
  --name siyuan-mcpj \
  siyuan-mcpj
```

**Docker Compose**（推荐先推库，再在目标机器用镜像跑，见下一小节；若已在含 `docker-compose.yml` 的目录配好 `.env`，可直接 `docker compose up -d`。）

### 使用 Docker Compose 安装（先推库，再跑 compose）

推荐流程：**先将本仓库推送到 GitHub**，再在需要运行 MCP 的机器上**直接使用镜像运行**，无需在该机器上克隆仓库或执行 npx 构建。

**前提**：镜像需已就绪。推库后，通过以下任一方式使镜像可用：
- 使用 GitHub Actions 等 CI 在推送或发布时自动构建并推送到 GitHub Container Registry（GHCR）；或
- 在本地一次性执行：克隆仓库 → 在 `siyuan-mcp` 目录下 `docker build -t ghcr.io/jairwye/siyuan-mcpj:latest .` 与 `docker push`，之后即可在任何机器上拉取该镜像。

**在要运行 MCP 的机器上（无需克隆本仓库）**：

1. 新建目录，在该目录下创建 `docker-compose.yml`，内容为（镜像地址示例为 GHCR）：
   ```yaml
   version: "3.9"
   services:
     siyuan-mcpj:
       image: ghcr.io/jairwye/siyuan-mcpj:latest
       container_name: siyuan-mcpj
       restart: unless-stopped
       environment:
         - SIYUAN_HOST=${SIYUAN_HOST:-host.docker.internal}
         - SIYUAN_PORT=${SIYUAN_PORT:-6806}
         - SIYUAN_TOKEN=${SIYUAN_TOKEN}
   ```
   若使用其它 registry，将 `image` 改为对应地址，如 `docker.io/<用户名>/siyuan-mcpj:latest`。

2. **环境变量**：`docker-compose.yml` 中的 `environment` 会从**同目录的 `.env`** 或**运行前 export 的环境变量**读取。`SIYUAN_TOKEN` 必填且无默认值，`SIYUAN_HOST`/`SIYUAN_PORT` 有默认值。推荐在同目录创建 `.env` 并填写（避免令牌落入 shell 历史）：
   ```
   SIYUAN_HOST=<思源在内网的可访问地址>
   SIYUAN_PORT=6806
   SIYUAN_TOKEN=<你的思源API令牌>
   ```
   `SIYUAN_TOKEN` 在思源中：设置 → 关于 → API 令牌。若不用 `.env`，可在执行前 `export SIYUAN_TOKEN=...` 后运行 `docker compose up -d`。

3. 执行：
   ```bash
   docker compose up -d
   ```
   会从 registry 拉取镜像并启动，无需 `git clone` 或本地构建。

   **说明**：本镜像是 **stdio MCP**，通过标准输入/输出与调用方通信。用 `docker compose up -d` 时容器在后台没有 stdin，进程可能启动后很快退出，属正常。**实际使用时**应由 **mcpo** 或 **Cursor** 在需要时用 `docker run -i ... 镜像` 启动容器（见下方「提供给 mcpo」「提供给 Cursor」），无需常驻运行一个 compose 容器。

4. 查看运行状态（若容器已退出，可忽略；用 mcpo/Cursor 时由它们按需起容器）：
   ```bash
   docker compose ps
   docker compose logs -f siyuan-mcpj   # 若有问题可看日志
   ```

**若你从克隆目录本地构建并推送镜像**：克隆后进入 `siyuan-mcpj/siyuan-mcp`，按需配置 `.env`（或 export 环境变量）；首次推送镜像前可在该目录执行 `docker build -t ghcr.io/jairwye/siyuan-mcpj:latest .` 与 `docker push`，之后在任意机器按上面步骤 1～4 使用镜像运行即可。

此后如需提供给 **mcpo** 或 **Cursor**，见下面两小节；本容器为标准 stdio MCP 进程，需由 mcpo/Cursor 通过「子进程」或「Docker 调用」方式拉起，不能直接作为 HTTP 服务暴露。

---

### 提供给 mcpo 的配置（供 Open WebUI 使用）

mcpo 会把 MCP 作为**子进程**启动，并通过 HTTP 暴露给 Open WebUI。需要你在 mcpo 的配置里写明如何启动本 MCP（以下方式一、二、三择一）。

**若 mcpo 与 siyuan-mcpj 在同一台机器、且 mcpo 跑在宿主机**，可采用 **方式一** 或 **方式二**（推荐方式二：`command: "docker"` 指向本机 siyuan-mcpj 镜像）。**若 mcpo 跑在 Docker 容器内、且容器里没有 docker**，采用下面的 **方式三：宿主机 mcpo 桥接**。

**方式一：本机用 Node 运行 MCP（适合 mcpo 与 MCP 在同一台机、且该机已构建好本项目）**

在 mcpo 使用的 MCP 配置文件（如 `mcp_config.json` 或 Open WebUI 文档中指定的路径）中增加：

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "node",
      "args": ["/绝对路径/siyuan-mcp/dist/index.js"],
      "env": {
        "SIYUAN_HOST": "<思源在内网的可访问地址>",
        "SIYUAN_PORT": "6806",
        "SIYUAN_TOKEN": "<你的思源API令牌>"
      }
    }
  }
}
```

启动 mcpo 时指定该配置及端口，例如：
```bash
uvx mcpo --port 8000 --config /path/to/mcp_config.json
```
或按 [mcpo 文档](https://github.com/open-webui/mcpo) 的启动方式传入配置。

**方式二：本机用 Docker 运行 MCP（推荐：mcpo 与 siyuan-mcpj 同机时使用）**

在 mcpo 的 MCP 配置中写（`<镜像名>` 示例：`ghcr.io/jairwye/siyuan-mcpj:latest`）：

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "SIYUAN_HOST=<思源在内网的可访问地址>",
        "-e", "SIYUAN_PORT=6806",
        "-e", "SIYUAN_TOKEN=<你的思源API令牌>",
        "<镜像名>"
      ]
    }
  }
}
```

**方式三：宿主机 mcpo 桥接（mcpo 在 Docker 内、容器里没有 docker 时）**

适用于：**mcpo 跑在 Docker 里**（例如与 Open WebUI 同一 compose），镜像内没有 Docker CLI，无法在配置里写 `command: "docker"` 启动 siyuan-mcpj。做法是：在**宿主机**上单独跑一个 mcpo，只负责 siyuan-mcpj，并暴露 HTTP；**容器内的 mcpo** 用 `type: "streamable-http"` + `url` 连宿主机，从而间接使用 siyuan-mcpj。

**步骤 1：在宿主机上准备「桥接用」mcpo 配置**

在宿主机任意目录（例如 `~/mcpo-bridge`）新建 `bridge-config.json`，内容二选一（宿主机有 Node 且已构建本项目时用 A，否则用 B）。

**A. 宿主机用 Node 运行 siyuan-mcpj**

将 `/绝对路径/siyuan-mcp` 换成你本机克隆的 siyuan-mcp 目录的**绝对路径**（需已执行 `npm install && npm run build`）：

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "node",
      "args": ["/绝对路径/siyuan-mcp/dist/index.js"],
      "env": {
        "SIYUAN_HOST": "<思源在内网的可访问地址，本机思源填 127.0.0.1>",
        "SIYUAN_PORT": "6806",
        "SIYUAN_TOKEN": "<你的思源API令牌>"
      }
    }
  }
}
```

**B. 宿主机用 Docker 运行 siyuan-mcpj**

宿主机需已安装 Docker 并能访问思源（若思源也在本机，`SIYUAN_HOST` 可用 `host.docker.internal` 或宿主机内网 IP）：

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "SIYUAN_HOST=<思源在内网的可访问地址>",
        "-e", "SIYUAN_PORT=6806",
        "-e", "SIYUAN_TOKEN=<你的思源API令牌>",
        "ghcr.io/jairwye/siyuan-mcpj:latest"
      ]
    }
  }
}
```

若桥接由 **launchd / systemd** 等常驻方式启动，其运行环境的 PATH 较精简，可能找不到 `docker`，会报 `FileNotFoundError: [Errno 2] No such file or directory: 'docker'`。此时二选一：**（1）改用上面的 A（Node 方式）**，不再依赖 docker；**（2）保留 Docker 方式**，将 `"command": "docker"` 改为 **docker 的绝对路径**（在终端执行 `which docker` 得到，Mac 常见为 `/usr/local/bin/docker`），例如：`"command": "/usr/local/bin/docker"`。

**步骤 2：在宿主机上启动桥接 mcpo**

在宿主机执行（端口 `8001` 可改，需与步骤 3 中 `url` 一致）：

```bash
uvx mcpo --config /path/to/bridge-config.json --port 8001
```

此时宿主机在 `http://0.0.0.0:8001` 暴露「仅含 siyuan-mcpj」的 MCP HTTP 端点。若希望该进程**常驻**（关终端不退出、开机自启、崩溃自动重启），可采用下面任一方式。

**Mac 安装 uvx 与如何确定路径**

- **安装 uvx（Mac）**  
  `uvx` 随 [uv](https://docs.astral.sh/uv/getting-started/installation/) 一起提供，任选其一安装即可：
  - **官方安装脚本（推荐）**：`curl -LsSf https://astral.sh/uv/install.sh | sh`  
    安装后通常将 `uv`、`uvx` 放到 `~/.local/bin`，安装脚本会提示把该目录加入 PATH；若终端里已有 PATH，新开一个终端即可用 `uvx`。
  - **Homebrew**：`brew install uv`，安装后直接可用 `uvx`。
  验证：终端执行 `uvx --version`，有输出即安装成功。

- **确定 uvx 的绝对路径（供 launchd / systemd 使用）**  
  在终端执行：`which uvx`  
  常见结果：`/Users/<你的用户名>/.local/bin/uvx`（脚本安装）或 `/opt/homebrew/bin/uvx`（Homebrew on Apple Silicon）。把 plist 或 service 里的 `uvx` 换成该路径即可。

- **确定配置文件的绝对路径**  
  `bridge-config.json` 放在某目录后，在终端进入该目录并执行：`pwd`  
  得到当前目录的绝对路径，再拼上文件名，例如：`/Users/你名/mcpo-bridge/bridge-config.json`。  
  若已进入该目录，也可用：`realpath bridge-config.json`（若无 `realpath`，用 `echo "$(pwd)/bridge-config.json"`）。

**预装 mcpo（避免首次运行或 launchd 时从 PyPI 拉取失败）**

执行 `uvx mcpo ...` 或由 launchd 启动时，uvx 会从 PyPI 拉取 `mcpo` 包。若出现 `Failed to fetch https://pypi.org/simple/mcpo/`、`tls handshake eof` 等网络错误，可先**预装** mcpo，后续 uvx/launchd 会使用已安装的版本，不再请求 PyPI。

- **推荐：用 uv 预装**（任选一种网络条件执行一次即可）  
  ```bash
  uv tool install mcpo
  ```
  若在国内访问 PyPI 较慢或超时，可先设镜像再安装：
  ```bash
  export UV_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
  uv tool install mcpo
  ```
  若需长期使用该镜像，可写入 shell 配置（如 `~/.zshrc`）：`echo 'export UV_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple' >> ~/.zshrc`，然后 `source ~/.zshrc` 再执行 `uv tool install mcpo`。

- **有 HTTP 代理时**  
  ```bash
  export HTTPS_PROXY=http://127.0.0.1:7890   # 改成你的代理地址
  uv tool install mcpo
  ```

- **若 uv 网络一直不可用：改用 pip + venv**  
  不用 uvx，用本机 Python 创建虚拟环境并安装 mcpo，launchd 直接调用该环境里的 `mcpo` 可执行文件（绝对路径），例如：
  ```bash
  python3 -m venv ~/mcpo-venv
  ~/mcpo-venv/bin/pip install mcpo
  ~/mcpo-venv/bin/mcpo --config /path/to/bridge-config.json --port 8001
  ```
  launchd 的 `ProgramArguments` 中把原来的 `uvx`、`mcpo` 等换成上述 `~/mcpo-venv/bin/mcpo` 的绝对路径及 `--config`、`--port` 参数即可。

**宿主机常驻运行 uvx mcpo（四种方式）**

- **方式 2a：简单后台（适合临时或单用户）**  
  使用 `nohup` 或 `&` 让进程在关掉终端后仍运行，日志写入文件；重启系统后需手动再执行。
  ```bash
  nohup uvx mcpo --config /path/to/bridge-config.json --port 8001 >> /tmp/mcpo-bridge.log 2>&1 &
  ```
  查看是否在跑：`pgrep -af mcpo`；停止：`pkill -f "uvx mcpo"`（或记下 PID 后 `kill <PID>`）。

- **方式 2b：systemd（Linux 推荐，开机自启 + 崩溃重启）**  
  以 Linux 为例，创建用户级 service（无需 root）。将下面 `YOUR_USER` 换成当前用户名，`/path/to/bridge-config.json` 换成实际绝对路径；若 `uvx` 不在 systemd 的 PATH 里，可把 `ExecStart` 改为 `ExecStart=/home/YOUR_USER/.local/bin/uvx mcpo ...`（先执行 `which uvx` 得到路径）。
  ```ini
  # 创建 ~/.config/systemd/user/mcpo-bridge.service
  [Unit]
  Description=mcpo bridge for siyuan-mcpj
  After=network.target

  [Service]
  Type=simple
  ExecStart=uvx mcpo --config /path/to/bridge-config.json --port 8001
  Restart=on-failure
  RestartSec=5

  [Install]
  WantedBy=default.target
  ```
  启用并启动（用户级 systemd）：
  ```bash
  systemctl --user daemon-reload
  systemctl --user enable mcpo-bridge
  systemctl --user start mcpo-bridge
  systemctl --user status mcpo-bridge
  ```
  开机后会自动启动。查看日志：`journalctl --user -u mcpo-bridge -f`。

- **方式 2c：launchd（macOS 推荐，开机自启 + 崩溃重启）**  
  在 macOS 上可用 launchd 管理。若没有 `~/Library/LaunchAgents` 目录，先创建：`mkdir -p ~/Library/LaunchAgents`。  
  将下面 `YOUR_USER` 换成当前用户名，`/path/to/bridge-config.json` 换成实际绝对路径；`uvx` 的路径可用 `which uvx` 得到（例如 `/Users/YOUR_USER/.local/bin/uvx`）。
  ```xml
  <!-- 保存为 ~/Library/LaunchAgents/com.mcpo.bridge.plist -->
  <?xml version="1.0" encoding="UTF-8"?>
  <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
  <plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.mcpo.bridge</string>
    <key>ProgramArguments</key>
    <array>
      <string>/Users/YOUR_USER/.local/bin/uvx</string>
      <string>mcpo</string>
      <string>--config</string>
      <string>/path/to/bridge-config.json</string>
      <string>--port</string>
      <string>8001</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/tmp/mcpo-bridge.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/mcpo-bridge.err.log</string>
  </dict>
  </plist>
  ```
  加载与启动：
  ```bash
  launchctl load ~/Library/LaunchAgents/com.mcpo.bridge.plist
  launchctl start com.mcpo.bridge
  ```
  取消常驻：`launchctl unload ~/Library/LaunchAgents/com.mcpo.bridge.plist`。日志在 `/tmp/mcpo-bridge.log` 和 `/tmp/mcpo-bridge.err.log`。

- **方式 2d：pm2（跨平台，可选）**  
  若已安装 Node 和 pm2（`npm i -g pm2`），可用 pm2 托管，便于查看日志与重启：
  ```bash
  pm2 start "uvx mcpo --config /path/to/bridge-config.json --port 8001" --name mcpo-bridge
  pm2 save && pm2 startup   # 可选：开机自启
  ```
  查看状态与日志：`pm2 status`、`pm2 logs mcpo-bridge`；停止：`pm2 stop mcpo-bridge`。

**步骤 3：在「容器内 mcpo」的配置里用 URL 连宿主机**

在你**跑 mcpo 的 Docker 容器**所挂载的 MCP 配置中，**不要**再写 `command: "docker"`，改为增加一条 streamable-http 配置，指向宿主机：

- **Mac 或 Windows（Docker Desktop）**：容器内可通过 `host.docker.internal` 访问宿主机。mcpo 按配置里的服务器名暴露路径，桥接里服务器名为 `siyuan-mcpj` 时，**url 需带路径 `/siyuan-mcpj`**（不能只写根路径，否则会 404）：
  ```json
  "siyuan-mcpj": {
    "type": "streamable-http",
    "url": "http://host.docker.internal:8001/siyuan-mcpj"
  }
  ```
- **Linux**：容器内通常没有 `host.docker.internal`，需填**宿主机在内网的 IP**（如 `192.168.x.x`），同样要带路径 `/siyuan-mcpj`：
  ```json
  "siyuan-mcpj": {
    "type": "streamable-http",
    "url": "http://<宿主机局域网IP>:8001/siyuan-mcpj"
  }
  ```

将上述 `siyuan-mcpj` 块合并进容器内 mcpo 使用的完整 `mcpServers` 对象中，重启或重载容器内 mcpo。Open WebUI 仍只连**容器内 mcpo** 的地址（如 `http://<mcpo容器所在机>:8000`），即可使用包括 siyuan-mcpj 在内的所有已配置 MCP。

**小结**：宿主机 mcpo（端口 8001）只负责 siyuan-mcpj；容器内 mcpo 通过 URL 访问宿主机 8001，无需在容器里安装 Docker 或 Node。

**若桥接日志出现 `POST / HTTP/1.1" 404 Not Found`（方式三）**

表示容器内的 mcpo 已连上桥接，但请求路径错误。mcpo 按配置里的**服务器名**暴露路径，桥接里服务器名为 `siyuan-mcpj` 时，容器内配置的 url 必须带路径 **`/siyuan-mcpj`**，不能只写根路径。请把容器内 mcpo 配置中的：
- `"url": "http://host.docker.internal:8001"` 改为 `"url": "http://host.docker.internal:8001/siyuan-mcpj"`
- 或 `"url": "http://<宿主机IP>:8001"` 改为 `"url": "http://<宿主机IP>:8001/siyuan-mcpj"`
保存后重启或重载容器内 mcpo。

**若出现 `httpx.ConnectError: All connection attempts failed`（方式三）**

表示**容器内的 mcpo** 连不上**宿主机上的桥接 mcpo**。按下面顺序排查：

0. **确认端口一致**  
   容器内配置的 url 里的**端口**必须与宿主机桥接 mcpo 实际监听的端口相同。若你启动桥接时用的是 `--port 28801`（或其它端口），url 应写 `http://host.docker.internal:28801/siyuan-mcpj`，不能写 `8001`。README 示例统一用 8001，你若改了桥接端口，容器侧也要改。

1. **确认宿主机桥接 mcpo 已启动**  
   在宿主机执行：`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:<桥接端口>`（若桥接用 `--port 28801` 则端口填 28801，否则填你实际用的端口）。若返回 `200` 或 `404` 等数字表示服务在跑；若 `Connection refused` 或无输出，说明桥接未启动或端口不对，请先按步骤 2 在宿主机启动桥接 mcpo。

2. **确认桥接监听在 0.0.0.0（允许来自容器的访问）**  
   宿主机执行：`lsof -i :8001` 或 `netstat -an | grep 8001`。若只看到 `127.0.0.1:8001`，说明只监听了本机，容器无法访问；需让 mcpo 监听 `0.0.0.0`（不少 mcpo 用 `--host 0.0.0.0` 或默认即 0.0.0.0，请查所用 mcpo 文档）。重启桥接时加上对 0.0.0.0 的绑定后再试。

3. **确认容器内使用的 URL 正确**  
   - **Mac / Windows（Docker Desktop）**：配置里应为 `http://host.docker.internal:8001/siyuan-mcpj`（端口与桥接一致，且路径为桥接配置里的服务器名 `siyuan-mcpj`）。  
   - **Linux**：默认没有 `host.docker.internal`，需改为宿主机在内网的 IP，例如 `http://192.168.x.x:8001/siyuan-mcpj`。若希望继续用 `host.docker.internal`，可在 docker run 或 compose 里为容器加 `extra_hosts: - "host.docker.internal:host-gateway"`，再在配置里写 `http://host.docker.internal:8001/siyuan-mcpj`。

4. **在容器内测试连通性**  
   进入跑 mcpo 的容器（例如 `docker exec -it <容器名> sh`），执行：  
   `curl -v http://host.docker.internal:8001/siyuan-mcpj`（Mac/Windows）或 `curl -v http://<宿主机IP>:8001/siyuan-mcpj`（Linux）。  
   若这里就连不上，说明仍是网络或 URL 问题；若这里能通但 mcpo 仍报错，再查 mcpo 日志与配置。

5. **宿主机防火墙**  
   确保宿主机未阻止对 8001 端口的入站访问（本机可关防火墙测试，或放行 8001）。

**若出现 `McpError: Session terminated`（方式三）**

表示容器内 mcpo 已能连上桥接，但 MCP 会话在初始化阶段被对方关闭。多数是**宿主机上桥接 mcpo 拉起的 siyuan-mcpj 进程**启动失败或中途退出。

1. **看宿主机桥接 mcpo 的日志**  
   若用 launchd，查看：`cat /tmp/mcpo-bridge.log`、`cat /tmp/mcpo-bridge.err.log`。若在终端前台跑的，看终端输出。确认是否有报错（例如找不到 `node`、找不到 `dist/index.js`、或与思源连接失败）。

2. **确认桥接配置里的 siyuan-mcpj 能单独跑通**  
   在宿主机上直接执行桥接配置里的命令（例如 `node /绝对路径/siyuan-mcp/dist/index.js` 或 `docker run ... siyuan-mcpj`），并设好 `SIYUAN_HOST`、`SIYUAN_PORT`、`SIYUAN_TOKEN`。若这里就报错或秒退，说明环境变量、路径或思源不可达，需先修好再让桥接 mcpo 调用。

3. **确认思源可被桥接所在机访问**  
   桥接在宿主机上时，`SIYUAN_HOST` 填本机思源用 `127.0.0.1`；若思源在别的机器，填该机内网 IP 且保证端口可达。思源未开、未开 API 或令牌错误，siyuan-mcpj 会报错并退出，导致 Session terminated。

4. **确认 Node 与路径在 launchd 环境下可用**  
   若用 launchd 跑桥接，launchd 的 PATH 可能与终端不同，需在 plist 里写清 `uvx`（或 `node`）和 `bridge-config.json`、`dist/index.js` 的**绝对路径**；且若用 Node 方式，确保 `node` 所在目录在 plist 的 PATH 或可执行文件写绝对路径。若桥接配置里用 Docker 方式，`command` 也需写 **docker 的绝对路径**（如 `/usr/local/bin/docker`），否则会报 `FileNotFoundError: 'docker'`。

**若桥接日志出现 `FileNotFoundError: [Errno 2] No such file or directory: 'docker'`（方式三）**

表示桥接 mcpo 在宿主机上跑（例如由 launchd 启动），配置里 siyuan-mcpj 使用了 `"command": "docker"`，但启动时环境的 PATH 中找不到 `docker`。解决方式二选一：**（1）推荐**：把桥接配置改为 **方式 A（Node）**，用 `command: "node"` + `args: ["/绝对路径/siyuan-mcp/dist/index.js"]` 和 `env`，不再依赖 docker；**（2）保留 Docker**：在 `bridge-config.json` 里把 `"command": "docker"` 改为 docker 的**绝对路径**（终端执行 `which docker`，常见为 `/usr/local/bin/docker`），例如 `"command": "/usr/local/bin/docker"`。改完后重启桥接 mcpo。

---

**Open WebUI 端需要写的配置：**

- 打开 Open WebUI → **设置（Settings）** → **Tools**（或「工具」）。
- 添加新工具，URL 填 mcpo 暴露的地址，例如：`http://<运行 mcpo 的机器地址>:8000`（端口与 mcpo 的 `--port` 一致）。
- 保存后，在对话中选择已接入的模型即可使用思源 MCP 的 49 个工具。

**mcpo 的 Docker 与 siyuan-mcpj 的 Docker 不在同一台机器时**

mcpo 通过**在本机启动子进程**（如 `docker run` 或 `node`）来拉起 MCP，因此若用 `command` 方式，mcpo 必须能「在它所在的那台机器上」执行该命令。若 **mcpo 运行在机器 B**、**siyuan-mcpj 的 Docker 运行在机器 C**，则 mcpo 无法直接在 B 上启动 C 上的容器。此时有两种做法，按你的使用场景选择：

- **若你已经在本地跑 mcpo 并集中管理多个 MCP**（含不在本地的），应优先采用下面的 **方式 A：本地 mcpo 通过 URL 加载远程 siyuan-mcpj**，这样 siyuan-mcpj 与其它 MCP 一起由本地 mcpo 统一暴露给 Open WebUI/Cursor。
- **若你只需要 Cursor 或 Open WebUI 直连某一台机**，可采用 **推荐做法**：mcpo 与 siyuan-mcpj 同机部署，Cursor/Open WebUI 连该机 mcpo 即可。

**推荐做法（同机部署）**：把 **mcpo 部署在运行 siyuan-mcpj 的那台机器（C）上**，与 siyuan-mcpj 同机。在 C 上用 docker-compose 或单独容器跑 siyuan-mcpj，同一台机上再跑 mcpo（Docker 或本机安装），mcpo 的配置里用 `command: "docker"` 指向本机（C）上的 siyuan-mcpj 镜像。这样 mcpo 在 C 上启动 siyuan-mcpj 容器并暴露 HTTP；Cursor 或 Open WebUI 只需连接 **C 的 mcpo 地址**（如 `http://<机器C的IP>:8000`），无需在 B 上再跑一份 mcpo。

**方式 A：本地 mcpo 通过 URL 加载远程 siyuan-mcpj**

适用于：**本地**已运行 mcpo Docker、已加载很多 MCP（部分甚至不在本地网络），希望把 **siyuan-mcpj（在另一台机）** 也作为其中一个 MCP 由本地 mcpo 统一暴露。mcpo 支持在配置里用 **`type` + `url`** 添加远程 MCP（SSE 或 Streamable HTTP），无需在 mcpo 本机用 `command` 启动 siyuan-mcpj。

1. **步骤 1（siyuan-mcpj 所在机）**：在该机上把 siyuan-mcpj 暴露为 HTTP。
   - 在该机运行 **mcpo**，使用的配置里**只**包含 siyuan-mcpj（`command: "docker"` + `args` 指向本机 siyuan-mcpj 镜像，并设好 `SIYUAN_HOST`、`SIYUAN_PORT`、`SIYUAN_TOKEN`），mcpo 监听例如 `0.0.0.0:8001`。
   - 这样该机提供一个「仅包含 siyuan-mcpj 这一套工具」的 MCP HTTP 端点（Streamable HTTP 或 SSE，以 mcpo 实际暴露为准）。确保该端口对本地 mcpo 所在网络可达（同一内网或端口转发）。

2. **步骤 2（本地 mcpo）**：在你**本地** mcpo 的配置文件中，为 siyuan-mcpj 增加一条**远程**配置（具体键名以 [mcpo 文档](https://github.com/open-webui/mcpo) 为准）。url 需带路径 `/siyuan-mcpj`（与对方 mcpo 配置里的服务器名一致），例如：
   ```json
   "siyuan-mcpj": {
     "type": "streamable-http",
     "url": "http://<siyuan-mcpj所在机的IP或域名>:8001/siyuan-mcpj"
   }
   ```
   若该机 mcpo 暴露的是 SSE，则改为 `"type": "sse"`，`url` 填对应 SSE 地址（含路径，如 `http://<机>:8001/sse`）。

3. **步骤 3**：重启或热重载本地 mcpo（若支持 `--hot-reload` 可自动生效）。Open WebUI 仍只连**本地 mcpo** 的地址，即可使用包括 siyuan-mcpj 在内的所有已配置 MCP。

可选：若 siyuan-mcpj 所在机有固定域名或 HTTPS，可将 `url` 改为 `https://...`，并按 mcpo 文档为该项增加 `headers`（如鉴权）。

---

### 提供给 Cursor 的配置（路径 B）

Cursor 通过 MCP 配置**按需启动**本 MCP 进程，以下二选一，将占位符换成你的实际值。

**方式一：本机用 Node 运行 MCP**

在 Cursor 的 MCP 设置（设置 → MCP → 添加服务器）中新增一条，或直接编辑 MCP 配置文件，加入：

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "node",
      "args": ["/绝对路径/siyuan-mcp/dist/index.js"],
      "env": {
        "SIYUAN_HOST": "<思源地址，本机填 127.0.0.1>",
        "SIYUAN_PORT": "6806",
        "SIYUAN_TOKEN": "<你的思源API令牌>"
      }
    }
  }
}
```

**方式二：本机用 Docker 运行 MCP**

Cursor 通过执行 `docker run` 启动 MCP 容器（`<镜像名>` 示例：`ghcr.io/jairwye/siyuan-mcpj:latest`）：

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "SIYUAN_HOST=<思源地址，本机填 host.docker.internal 或宿主机IP>",
        "-e", "SIYUAN_PORT=6806",
        "-e", "SIYUAN_TOKEN=<你的思源API令牌>",
        "<镜像名>"
      ]
    }
  }
}
```

**方式三：Cursor 与 siyuan-mcpj Docker 不在同一台机器**

若 **Cursor 在你本机**，**siyuan-mcpj 的 Docker 在另一台机器**，Cursor 无法直接以 stdio 启动那台机器上的容器，需要通过 **HTTP 远程连接**。此时 **mcpo 应与 siyuan-mcpj 部署在同一台机**（即运行 siyuan-mcpj 的那台），这样 mcpo 才能在该机上启动 siyuan-mcpj 容器并暴露 HTTP；Cursor 只需连接该机的 mcpo 地址即可。

1. **在运行 siyuan-mcpj Docker 的那台机器上** 同时跑 **mcpo**，由 mcpo 把本 MCP 暴露为 HTTP：
   - 在该机上用 docker-compose 或单独容器跑 siyuan-mcpj（已配置好 `SIYUAN_*`）。
   - 在同一台机上安装并启动 mcpo，mcpo 的 MCP 配置里用 `command: "docker"` + `args: ["run", "--rm", "-i", "-e", ...]` 指向 siyuan-mcpj 镜像（或该机上的 node 路径），mcpo 监听例如 `0.0.0.0:8000`。
   - 确保该机 8000 端口对 Cursor 所在机可达（同一内网，或做端口转发/反向代理）。

2. **在 Cursor 所在机** 的 MCP 配置里，用 **远程 URL** 方式添加 MCP 服务器（具体字段以 Cursor 当前版本为准，常见为 `url` + `transport`）：

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "url": "http://<运行Docker和mcpo的机器地址>:8000",
      "transport": "http"
    }
  }
}
```

将 `<运行Docker和mcpo的机器地址>` 换成那台机器的内网 IP 或域名。若 Cursor 使用 `server.url` 格式，可改为：

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "server": {
        "url": "http://<运行Docker和mcpo的机器地址>:8000"
      }
    }
  }
}
```

保存后重启 Cursor 或重新加载 MCP，即可在对话中使用思源工具。若连接报错，可打开 Cursor 的 MCP 日志查看；并确认防火墙/路由器允许 Cursor 所在机访问该机的 mcpo 端口。

### 工具列表（49 个，12 模块）

- **笔记本（8）**：list_notebooks, open_notebook, close_notebook, rename_notebook, create_notebook, remove_notebook, get_notebook_conf, set_notebook_conf  
- **文档（11）**：create_doc, rename_doc, rename_doc_by_id, remove_doc, remove_doc_by_id, move_docs, move_docs_by_id, get_hpath_by_path, get_hpath_by_id, get_path_by_id, get_ids_by_hpath  
- **块（11）**：insert_block, prepend_block, append_block, update_block, delete_block, move_block, get_block_kramdown, get_child_blocks, fold_block, unfold_block, transfer_block_ref  
- **属性（2）**：set_block_attrs, get_block_attrs  
- **SQL（2）**：sql_query, flush_transaction  
- **文件（5）**：get_file, put_file, remove_file, rename_file, read_dir  
- **导出（2）**：export_md_content, export_resources  
- **通知（2）**：push_msg, push_err_msg  
- **系统（5）**：get_boot_progress, get_version, get_current_time, check_siyuan_status, get_workspace_info（供调用方如 Open WebUI/Cursor 查询当前 MCP 连接的思源地址与端口及是否已配置令牌，不返回令牌本身）  
- **模板（2）**：render_template, render_sprig  
- **转换（1）**：pandoc_convert  
- **资源（1）**：upload_asset  

其中 **sql_query** 与 **块插入/导出**（如 append_block、export_md_content、get_block_kramdown）可直接支撑「知识库问答」与「AI 总结写回」：先 SQL 或路径查块 → 导出内容给模型 → 再将结果用 append_block 等写回思源。

### 常见问题

- **连接失败**：确认思源已启动、API 已开启、令牌正确；Docker 或远程运行时 `SIYUAN_HOST` 填思源在内网可访问地址。  
- **发布模式**：思源以发布模式运行时，除非开放文档读写权限，否则 SQL 接口可能被禁止，见 [讨论](https://github.com/siyuan-note/siyuan/pull/16041#issuecomment-3912139575)。

### 参考

- [思源笔记 API（中文）](https://github.com/siyuan-note/siyuan/blob/master/API_zh_CN.md)  
- [思源笔记 GitHub](https://github.com/siyuan-note/siyuan)  
- [MCP](https://modelcontextprotocol.io/)  
- [mcpo](https://github.com/open-webui/mcpo)

---

## English

### Environment variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SIYUAN_HOST` | SiYuan API host | 127.0.0.1 | No |
| `SIYUAN_PORT` | SiYuan API port | 6806 | No |
| `SIYUAN_TOKEN` | SiYuan API token | - | **Yes** |

Get token: SiYuan → Settings → About → API Token.

### Quick start

**npx / local**

```bash
git clone <this-repo>
cd siyuan-mcp
npm install && npm run build
SIYUAN_HOST=<host> SIYUAN_PORT=<port> SIYUAN_TOKEN=<token> node dist/index.js
```

**Docker** (one-off run; for compose flow see next section.)

```bash
docker build -t siyuan-mcpj .
docker run -d -e SIYUAN_HOST=<SiYuan-host> -e SIYUAN_PORT=<port> -e SIYUAN_TOKEN=<your-token> --name siyuan-mcpj siyuan-mcpj
```

### Docker Compose install (push repo first, then run compose)

Recommended flow: **push this repo to GitHub first**, then on the machine where you want to run the MCP, **run using the image only** — no need to clone the repo or run npx on that machine.

**Prerequisite**: The image must be available. After pushing the repo, either:
- Use CI (e.g. GitHub Actions) to build and push to GitHub Container Registry (GHCR) on push/release, or
- Once, from a clone: in the `siyuan-mcp` directory run `docker build -t ghcr.io/jairwye/siyuan-mcpj:latest .` and `docker push`; then any machine can pull that image.

**On the machine where you run the MCP (no clone needed)**:

1. Create a directory and add `docker-compose.yml` (image example for GHCR):
   ```yaml
   version: "3.9"
   services:
     siyuan-mcpj:
       image: ghcr.io/jairwye/siyuan-mcpj:latest
       container_name: siyuan-mcpj
       restart: unless-stopped
       environment:
         - SIYUAN_HOST=${SIYUAN_HOST:-host.docker.internal}
         - SIYUAN_PORT=${SIYUAN_PORT:-6806}
         - SIYUAN_TOKEN=${SIYUAN_TOKEN}
   ```

2. **Env vars**: The `environment` section reads from a **`.env` file** in the same directory or from **exported env vars**. `SIYUAN_TOKEN` is required (no default); `SIYUAN_HOST`/`SIYUAN_PORT` have defaults. Recommended: create `.env` with `SIYUAN_HOST`, `SIYUAN_PORT`, `SIYUAN_TOKEN` (get token in SiYuan: Settings → About → API Token). Alternatively, `export SIYUAN_TOKEN=...` before running `docker compose up -d`.

3. Run: `docker compose up -d` — the image will be pulled and the container started; no `git clone` or local build.

4. Check: `docker compose ps` and `docker compose logs -f siyuan-mcpj` if needed.

**If you build and push the image from a clone**: clone the repo, go to `siyuan-mcpj/siyuan-mcp`, set `.env` or export env vars, and run `docker build -t ghcr.io/jairwye/siyuan-mcpj:latest .` and `docker push` once; then use steps 1–4 above on any machine.

Then use the configs below to expose this MCP to **mcpo** or **Cursor**.

### Provide to mcpo (for Open WebUI)

mcpo starts the MCP as a subprocess and exposes it over HTTP. Add one of the following to mcpo’s MCP config (e.g. `mcp_config.json`).

**If mcpo and siyuan-mcpj run on the same machine**, use **Option B** below: set `command: "docker"` and point at the siyuan-mcpj image on that host. No URL-based setup needed.

**Option A — Run MCP with Node on the same machine**

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "node",
      "args": ["/absolute/path/to/siyuan-mcp/dist/index.js"],
      "env": {
        "SIYUAN_HOST": "<SiYuan host>",
        "SIYUAN_PORT": "6806",
        "SIYUAN_TOKEN": "<your SiYuan API token>"
      }
    }
  }
}
```

Start mcpo with this config, e.g. `uvx mcpo --port 8000 --config /path/to/mcp_config.json`.

**Option B — Run MCP with Docker (recommended when mcpo and siyuan-mcpj are on the same machine)**

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "SIYUAN_HOST=<SiYuan host>",
        "-e", "SIYUAN_PORT=6806",
        "-e", "SIYUAN_TOKEN=<your token>",
        "<image-name>"
      ]
    }
  }
}
```

Use `<image-name>` such as `ghcr.io/jairwye/siyuan-mcpj:latest`.

**In Open WebUI:** Settings → Tools → add tool URL `http://<mcpo-host>:<port>` (e.g. 8000).

**When mcpo Docker and siyuan-mcpj Docker are on different machines**

With `command`-based config, mcpo starts the MCP as a **local subprocess** (e.g. `docker run` or `node`), so it must run on the same host. If **mcpo runs on machine B** and **siyuan-mcpj Docker runs on machine C**, mcpo on B cannot start the container on C. Two options:

- **If you already run mcpo locally and aggregate many MCPs** (including remote ones), use **Option: add siyuan-mcpj as remote URL in your local mcpo** below, so siyuan-mcpj is loaded alongside your other MCPs.
- **If you only need Cursor or Open WebUI to talk to one host**, use the **recommended** same-host setup: run mcpo on the same machine as siyuan-mcpj (C), then point Cursor/Open WebUI at C’s mcpo URL.

**Recommended (same host):** Run **mcpo on the same machine as siyuan-mcpj (C)**. On C: run siyuan-mcpj (compose or container) and run mcpo there too; in mcpo config use `command: "docker"` pointing at the siyuan-mcpj image on C. Then mcpo exposes HTTP on C; Cursor or Open WebUI connect to **C’s mcpo URL** (e.g. `http://<C-ip>:8000`). No need to run mcpo on B.

**Option: add siyuan-mcpj as remote URL in your local mcpo**

Use this when **mcpo runs locally** and you want to load **siyuan-mcpj running on another machine** as one of many MCPs. mcpo supports adding a remote MCP via **`type` + `url`** (SSE or Streamable HTTP).

1. **On the machine where siyuan-mcpj runs:** Expose siyuan-mcpj as HTTP. Run **mcpo** there with a config that **only** contains siyuan-mcpj (`command: "docker"` + args pointing at the siyuan-mcpj image and `SIYUAN_*` env). Have mcpo listen on e.g. `0.0.0.0:8001`. Ensure that port is reachable from the network where your local mcpo runs.

2. **In your local mcpo config:** Add a remote entry for siyuan-mcpj (exact keys per [mcpo docs](https://github.com/open-webui/mcpo)), e.g.:
   ```json
   "siyuan-mcpj": {
    "type": "streamable-http",
    "url": "http://<host-where-siyuan-mcpj-runs>:8001/siyuan-mcpj"
  }
  ```
  The path `/siyuan-mcpj` must match the server name in the remote mcpo config. If that host exposes SSE instead, use `"type": "sse"` and set `url` to the SSE endpoint (e.g. `http://<host>:8001/sse`).

3. Restart or hot-reload local mcpo. Open WebUI keeps using your **local** mcpo URL and will see siyuan-mcpj together with your other MCPs.

Optional: If the siyuan-mcpj host has HTTPS or a domain, set `url` to `https://...` and add `headers` (e.g. auth) per mcpo docs.

### Provide to Cursor

**Option A — Node**

Add to Cursor MCP settings:

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "node",
      "args": ["/absolute/path/to/siyuan-mcp/dist/index.js"],
      "env": {
        "SIYUAN_HOST": "<SiYuan host, e.g. 127.0.0.1>",
        "SIYUAN_PORT": "6806",
        "SIYUAN_TOKEN": "<your SiYuan API token>"
      }
    }
  }
}
```

**Option B — Docker (same machine)**

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "SIYUAN_HOST=host.docker.internal",
        "-e", "SIYUAN_PORT=6806",
        "-e", "SIYUAN_TOKEN=<your token>",
        "<image-name>"
      ]
    }
  }
}
```

Use `<image-name>` such as `ghcr.io/jairwye/siyuan-mcpj:latest`.

**Option C — Cursor and siyuan-mcpj Docker on different machines**

When **Cursor runs on your PC** and **siyuan-mcpj Docker runs on another machine**, use **remote HTTP**. In this case **mcpo should run on the same machine as siyuan-mcpj** so mcpo can start the siyuan-mcpj container there and expose HTTP; Cursor then connects to that machine’s mcpo URL.

1. On the machine that runs siyuan-mcpj Docker: run **mcpo** there so it starts the siyuan-mcpj container and exposes HTTP (e.g. port 8000). Ensure that port is reachable from the machine where Cursor runs (same LAN or port forward).
2. On the machine where Cursor runs, add the MCP server by **URL** (format may vary by Cursor version):

```json
{
  "mcpServers": {
    "siyuan-mcpj": {
      "url": "http://<host-where-docker-and-mcpo-run>:8000",
      "transport": "http"
    }
  }
}
```

Replace `<host-where-docker-and-mcpo-run>` with that machine’s IP or hostname. If Cursor uses `server.url`, use the `server: { "url": "..." }` form instead.

Restart or reload MCP in Cursor to use the tools.

### Tools (49 total, 12 modules)

Notebook (8), Document (11), Block (11), Attr (2), SQL (2), File (5), Export (2), Notification (2), System (5), Template (2), Convert (1), Asset (1). **sql_query** and block insert/export support RAG and “AI summary write-back” workflows.

### License

MIT
