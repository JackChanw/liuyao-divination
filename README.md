# 玄机问卜 · 六爻占卜 Web 应用

> 蓍草法（揲蓍）模拟起卦 + AI 流式解卦的国风水墨 Web 应用。

```
   ☯  分二、挂一、揲四、归奇
   ☯  三变成爻，十有八变成卦
   ☯  心诚则灵，问其所惑，玄机自现
```

## 功能一览

| 模块 | 说明 |
|------|------|
| 🎲 **双模起卦** | 「亲手揲蓍」按古法逐步操作（18 变约 3 分钟）；「一键成卦」系统模拟全流程（约 4 秒） |
| 🤖 **AI 流式解卦** | OpenAI 兼容 API，由占卜师"玄机子"按五段式（卦象综述/爻象分析/核心指示/行动建议/结语）边出边读 |
| 📖 **卦理浅说** | 全屏国风浮层科普何为六爻、阴阳与动静、蓍草法、应用怎么用；起卦页/结果页/首页均可一键唤起 |
| 💬 **行内提示** | 手动起卦每个步骤旁挂 InfoTip，hover/点击即看本步含义（"分蓍/挂一/揲四"等） |
| 🖼️ **一键分享** | 三件套：国风长图（750×1334，含玄机子印章+农历落款+二维码）/ 永久短链 / 文字摘要 |
| 📜 **卜卦史** | 解卦完成后自动入库；任意页面右上角点「卜卦史」查列表，点条目跳只读分享页 |
| 🎨 **国风视觉** | 宣纸纹理底 + 浓墨黑 + 朱砂红动爻 + 毛笔字（Ma Shan Zheng / KaiTi），全程无外部图片资源 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 · TypeScript 5.6 · Vite 6 · React Router 6 · Zustand 5 |
| 后端 | Python 3.10+ · FastAPI · Pydantic v2 · SQLAlchemy 2 (async) · OpenAI SDK |
| 数据 | SQLite（aiosqlite，本地零运维）· 单表 `divinations` 同时承载分享与历史 |
| AI | 任意 OpenAI 兼容 API（含 OneAPI / 公司 relay 中转），SSE 流式 |
| 起卦 | 蓍草法（分二·挂一·揲四·归奇），三变成爻，十有八变成卦 |
| 视觉 | 宣纸米黄 `#f5eed8` · 浓墨 `#1a1008` · 动爻朱砂 `#8b1a1a` · 印章红 `#b72e1e` |

## 截图与流程

```
┌─────────────┐     ┌───────────────────────┐     ┌──────────────┐
│  HomePage   │ ─→  │  DivinationPage       │ ─→  │  ResultPage  │
│             │     │  ┌─────────┬────────┐  │     │              │
│  写下问题    │     │  │ 亲手揲蓍 │ 一键成卦 │  │     │  本卦+变卦    │
│  ↓          │     │  │ (3 分钟) │ (4 秒)  │  │     │  卦辞+动爻爻辞 │
│  双按钮选择  │     │  └─────────┴────────┘  │     │  AI 流式解卦   │
│  入口        │     │  18 变 / 快进动画      │     │  ↓自动入库    │
└─────────────┘     └───────────────────────┘     │  分享/卜卦史   │
       ↑                                          └──────┬───────┘
       │                                                 │
       │  ←──────  / r / :token  (只读分享页)  ←────────┘
       │
       └────────  / history  (卜卦史列表)
```

## 目录结构

```
liuyao-divination/
├── frontend/                    React + Vite
│   └── src/
│       ├── pages/               4 个主页面
│       │   ├── HomePage/        首页：双模式入口 + 卦理浅说
│       │   ├── DivinationPage/  起卦页：根据 ?mode= 渲染手动/一键
│       │   ├── ResultPage/      结果页：本卦+变卦+流式解卦+分享
│       │   ├── HistoryPage/     卜卦史列表
│       │   └── SharedResultPage/ /r/:token 只读分享页
│       ├── components/
│       │   ├── YarrowSimulation/      手动揲蓍状态机（18 变交互）
│       │   ├── YarrowAutoSimulation/  一键起卦快进动画
│       │   ├── HexagramDisplay/       LineSymbol + HexagramGrid
│       │   ├── InterpretationStream/  SSE 解卦逐字呈现
│       │   ├── KnowledgeOverlay/      卦理浅说浮层
│       │   ├── ShareSheet/            底部三选项分享面板
│       │   ├── ShareCard/             750×1334 截图源（玄机子印章+二维码）
│       │   ├── GlobalNav/             固定右上角入口
│       │   └── common/                InkButton / InkInput / InfoTip / LoadingBrush
│       ├── stores/divinationStore.ts  Zustand 全局状态
│       ├── data/hexagrams.ts          64 卦轻量索引（binary_code / id 双向查表）
│       ├── types/                     hexagram + divination 类型
│       └── utils/lunar.ts             公历→农历落款
│
└── backend/                     FastAPI + SQLAlchemy
    ├── app/
    │   ├── main.py              入口（lifespan 启动建表）
    │   ├── config.py            pydantic-settings 读 .env
    │   ├── db/
    │   │   ├── __init__.py      async engine + Base
    │   │   └── orm.py           DivinationRecord（含 created_at_ms 索引）
    │   ├── models/              Pydantic：Line / HexagramData / YarrowRound
    │   ├── routers/
    │   │   ├── divine.py        POST /api/divine（SSE 流式解卦）
    │   │   ├── hexagram.py      GET /api/hexagram/{id|by-binary/{code}}
    │   │   ├── yarrow.py        POST /api/yarrow/auto（一键起卦）
    │   │   ├── share.py         POST /api/share + GET /api/share/{token}
    │   │   └── history.py       POST /api/history + GET /api/history?limit&before
    │   ├── services/
    │   │   ├── yarrow_service.py     揲蓍法算法（数学约束断言）
    │   │   ├── hexagram_service.py   64 卦数据加载
    │   │   ├── ai_service.py         OpenAI SDK 异步流式
    │   │   ├── prompt_builder.py     "玄机子"角色 prompt
    │   │   └── divination_repo.py    token 生成 + 落库 + 游标分页
    │   └── data/hexagrams.json       64 卦完整数据（卦辞/彖辞/象辞/爻辞）
    └── tests/                   pytest（共 15 例，全过）
```

## API 端点

| Method | Path | 用途 |
|--------|------|------|
| `POST` | `/api/divine` | SSE 流式解卦（接收完整卦象，返回 `delta` / `done` / `error` 事件） |
| `GET`  | `/api/hexagram/{id}` | 获取某卦完整数据（卦辞/彖辞/象辞/爻辞） |
| `GET`  | `/api/hexagram/by-binary/{code}` | 用 binary_code 查卦 |
| `GET`  | `/api/hexagrams` | 全部 64 卦 |
| `POST` | `/api/yarrow/auto` | 一键起卦：返回 6 爻 + 每爻三变明细 |
| `POST` | `/api/share` | 创建分享记录，返回 `{token, share_url}` |
| `GET`  | `/api/share/{token}` | 读取分享记录（含完整解卦正文） |
| `POST` | `/api/history` | 解卦后自动入库，返回 `{token}` |
| `GET`  | `/api/history?limit=20&before={token}` | 历史列表（按时间倒序，游标分页） |
| `GET`  | `/api/health` | 健康检查 |

## 快速启动

### Docker Compose（推荐）

```bash
cp .env.example .env
# 编辑 .env，填入 RELAY_API_KEY / RELAY_BASE_URL / RELAY_MODEL

docker compose build
docker compose up -d

# 前端：http://localhost:8080
# 后端：http://localhost:8000/api/health
```

服务说明：
- `backend` — `python:3.12-slim`，uvicorn 监听 8000，含 healthcheck
- `frontend` — Node 20 构建 → nginx:alpine；nginx 反代 `/api`，**SSE 长连接禁用 buffer/cache**，超时放宽到 600s
- 同源反代，零 CORS 问题

```bash
docker compose logs -f backend       # 后端日志
docker compose restart backend       # 改 .env 后重启
docker compose down -v --rmi local   # 停止并清理镜像
```

### 本地开发

需 Python 3.10+（项目使用 PEP 604 联合类型与 `list[X]` 内置泛型）。

```bash
# 后端
cd backend
cp .env.example .env       # 填 RELAY_API_KEY 等
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 前端（另开终端）
cd frontend
npm install
npm run dev                # http://localhost:5173，已配 /api 代理到 8000
```

### AI 服务兼容性

任意 OpenAI 兼容接口都能直接用，只要在 `.env` 里填上对应 `RELAY_BASE_URL` 与 `RELAY_MODEL`：

| 提供方 | BASE_URL | 备注 |
|--------|----------|------|
| OpenAI | `https://api.openai.com/v1` | 官方 |
| DeepSeek | `https://api.deepseek.com/v1` | |
| 智谱 GLM | `https://open.bigmodel.cn/api/paas/v4` | |
| Moonshot | `https://api.moonshot.cn/v1` | |
| OneAPI / new-api | 自建网关 | 公司常见 |

## 测试

```bash
cd backend
python -m pytest tests/ -v
```

```
tests/test_share.py        ✓ 4 (token 生成/读写/404/唯一性)
tests/test_history.py      ✓ 5 (落库/倒序/截断/游标分页/未知游标)
tests/test_yarrow.py       ✓ 2 (蓍草法约束 2000 轮 + 完整起卦)
tests/test_yarrow_auto.py  ✓ 4 (auto 接口结构/极性/三变/概率分布)
─────────────────────────────────
共 15 例
```

实测分布与理论概率（老阴 1/16、少阳 5/16、少阴 7/16、老阳 3/16）高度吻合。

## 设计要点

### binary_code 约定

- 6 位 0/1 字符串，**index 0 = 初爻（最下）**，index 5 = 上爻（最上）
- `1` = 阳爻，`0` = 阴爻
- 老阳/老阴在"现在态"上仍按其阴阳计入本卦 binary
- 变卦 binary：动爻翻转，静爻不变
- 前后端共 64 个 binary_code 唯一、双方索引表已交叉校验一致

### 揲蓍法约束

- 第一变置旁数 ∈ {5, 9}
- 第二、三变置旁数 ∈ {4, 8}
- 三变后剩余蓍草数 ∈ {36, 32, 28, 24}，÷4 得爻值 9/8/7/6

代码中以 `assert` 形式落地，`tests/test_yarrow.py` 跑 2000 轮验证。

### SSE 流式

- 使用 `fetch + ReadableStream` 而非 EventSource（因需要 POST）
- buffer 拼接、按 `\n\n` 分包、JSON 解析，**单条解析失败不中断流**
- nginx 反代时禁用 buffer/cache，超时放宽到 600s

### 数据库设计

`divinations` 表同时承载分享与历史——两者本质都是"占卜结果落库"，差别只在对外表现。

| 字段 | 类型 | 说明 |
|------|------|------|
| `token` | String(16) PK | 12 字符 base32（去掉 0/o/i/l/1 等易混淆字符） |
| `question` | String(200) | 用户所问 |
| `lines_json` | Text | 6 爻完整 JSON |
| `primary_id`, `changed_id` | Integer | 本卦/变卦 ID |
| `interpretation` | Text | AI 解卦完整正文 |
| `created_at_ms` | BigInteger (Indexed) | 毫秒时间戳，用于游标分页 |
| `created_at` | DateTime | 显示用 |

> 用 ms 时间戳做游标——SQLite 的 `DateTime` 列存为文本且精度只到秒，多条同秒记录的 `<` 比较在 SQLAlchemy/aiosqlite 组合下不可靠；整数比较稳。

### 国风视觉

- 全 CSS/SVG，**无外部图片资源**
- 玄机子印章用 CSS Grid 布局篆字 + box-shadow 内描边模拟
- 农历落款由 `lunar-typescript` 在客户端计算
- 二维码由 `qrcode` 在客户端生成 dataURL，直接嵌进截图

## 路线图

- [ ] 历史模块支持搜索、按日期筛选、删除
- [ ] PWA 离线访问 + 添加到主屏
- [ ] 多语言（英文 / 日文）解卦
- [ ] 用户体系（可选登录，将历史与设备解耦）
- [ ] 卦象图谱可视化（64 卦关系图）

## 致谢与版权

- 揲蓍法算法依据《周易·系辞》「大衍之数」章
- 64 卦卦辞/彖辞/象辞/爻辞采自传世通行本
- 字体：[Ma Shan Zheng](https://fonts.google.com/specimen/Ma+Shan+Zheng) / [ZCOOL XiaoWei](https://fonts.google.com/specimen/ZCOOL+XiaoWei)
- 农历换算：[lunar-typescript](https://github.com/6tail/lunar-typescript)

MIT License.
