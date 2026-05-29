# 玄机问卜 · 六爻占卜 Web 应用

传统蓍草法（揲蓍法）模拟起卦 + AI 流式解卦的国风水墨 Web 应用。

## 配置说明（重要）

本项目所有 AI 配置通过环境变量驱动，**源码、Docker 镜像、git 仓库中均不包含任何 Key 或私有 URL**。

要本地部署，只需：

```bash
cp .env.example .env
# 编辑 .env，填入你自己的 RELAY_API_KEY / RELAY_BASE_URL / RELAY_MODEL
```

`.env` 已在 `.gitignore` 中，不会被提交。

支持任意 OpenAI 兼容的 LLM 服务：
- 官方 OpenAI: `https://api.openai.com/v1`
- DeepSeek: `https://api.deepseek.com/v1`
- 智谱 GLM: `https://open.bigmodel.cn/api/paas/v4`
- Moonshot: `https://api.moonshot.cn/v1`
- 自建 OneAPI / new-api / relay 等中转网关

## 技术栈

| 层级 | 技术 |
| --- | --- |
| 前端 | React 18 + TypeScript + Vite + React Router + Zustand |
| 后端 | Python 3.10+ / FastAPI / Pydantic v2 / OpenAI SDK (兼容 relay) |
| AI   | 公司 relay API，模型 `gpt-5.5`（OpenAI 兼容接口） |
| 起卦 | 揲蓍法（分二、挂一、揲四、归奇）— 三变成爻，十有八变成卦 |
| 风格 | 宣纸米黄底 + 墨黑 + 朱砂红动爻 + 毛笔字（Ma Shan Zheng / KaiTi） |

## 目录结构

```
liuyao-divination/
├── frontend/        # React + Vite
└── backend/         # FastAPI
```

详细子目录见两侧的源码。

## 启动

### 方式一：Docker Compose（推荐）

```bash
cp .env.example .env
# 编辑 .env，填入 RELAY_API_KEY / RELAY_BASE_URL

docker compose build
docker compose up -d

# 前端：http://localhost:8080
# 后端直连调试：http://localhost:8000/api/health
```

服务说明：
- `backend` — `python:3.12-slim`，uvicorn 监听 8000，含 healthcheck
- `frontend` — Node 20 构建 → nginx:alpine 提供静态资源；nginx 反代 `/api` 到 backend，**SSE 长连接已禁用 buffer/cache** 并放宽超时到 600s
- 同源反代，浏览器侧无 CORS 问题

常用命令：
```bash
docker compose logs -f backend       # 查看后端日志
docker compose logs -f frontend
docker compose restart backend       # 改 .env 后重启
docker compose down                  # 停止并清理
docker compose down -v --rmi local   # 连同镜像一起清理
```

### 方式二：本地开发

#### 后端

```bash
cd backend
cp .env.example .env
# 编辑 .env，填入 RELAY_API_KEY / RELAY_BASE_URL
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> **Python 版本要求 3.10+**（使用了 PEP 604 联合类型与 `list[X]` 等内置泛型）。

#### 前端

```bash
cd frontend
npm install
npm run dev
# 默认 http://localhost:5173，Vite 已配置 /api 反代到 8000
```

## 揲蓍法约束验证

```bash
cd backend
python3 tests/test_yarrow_pure.py     # 不依赖第三方库，5000 轮约束 + 概率分布
# 或（需 3.10+）
python3 tests/test_yarrow.py
```

实测分布与理论概率（老阴 1/16、少阳 5/16、少阴 7/16、老阳 3/16）高度吻合。

## binary_code 约定

6 位 0/1 字符串，**index 0 = 初爻（最下）**，index 5 = 上爻（最上）。
- `1` = 阳爻，`0` = 阴爻
- 老阳/老阴在"现在态"上仍按其阴阳计入本卦 binary
- 变卦 binary：动爻翻转，静爻不变

前后端共 64 个 binary_code 唯一、双方索引表已交叉校验一致。

## 验收清单

- [x] 揲蓍法第一变 ∈ {5, 9}，第二/三变 ∈ {4, 8}（断言验证 + 大量重复测试）
- [x] 64 卦 binary_code 唯一且前后端一致（自动化交叉对比通过）
- [x] SSE 流式：使用 `fetch + ReadableStream` 而非 EventSource（支持 POST），buffer 拼接、按 `\n\n` 分包、JSON 解析，单条解析失败不中断流
- [x] 动爻视觉：朱砂红 + `pulseChanging` 脉冲发光 + ○/✕ 标记
- [x] 变卦：动爻翻转极性、不再标记、仅展示对照
- [x] 国风：宣纸纹理背景、印章红角标、毛笔字、墨色按钮 hover 反相
