# Changelog

按时间倒序记录每次重大迭代。

---

## [0.4.0] — 2026-06-01 — 卜卦史

新增"卜卦史"模块，所有占卜结果在解卦完成后自动入库，可在任意页面右上角随时回顾。

### 新增
- **后端**
  - `app/services/divination_repo.py` — 抽出仓储层（token 生成、落库、游标分页）；share 路由重构走此层
  - `app/db/orm.py` — `divinations` 表新增 `created_at_ms`（BigInteger）字段并加索引，用于稳定游标分页
  - `app/routers/history.py` — `POST /api/history`（自动入库）、`GET /api/history?limit&before`（按时间倒序游标分页）
  - `tests/test_history.py` — 5 项测试（创建/倒序/截断/分页/未知游标）
- **前端**
  - `pages/HistoryPage/` — 卡片列表（时间、卦名→变卦名、问题、摘要前 60 字）+ 加载/错误/空态 + 加载更多
  - `components/GlobalNav/` — 固定右上角：玄机问卜印章 + 卜卦史链接，全局所有页面可见
  - `stores/divinationStore.ts` — 加 `currentToken` 状态
  - `data/hexagrams.ts` — 加 `lookupById`，HistoryPage 列表用

### 改动
- `pages/ResultPage/` — SSE `done` 后自动 POST `/api/history`，token 写回 store；分享流程复用此 token 不重复入库
- `components/ShareSheet/` — 新增 `existingToken` / `onTokenResolved` props，复用解卦时已生成的 token
- `pages/HomePage/` — 移除自家 `seal-corner`，被 GlobalNav 接管
- `App.tsx` — 加 `/history` 路由 + 全局挂 GlobalNav

### 设计要点
- **同表承载分享与历史**：两者本质都是"占卜结果落库"，差别只在对外表现，不重复设计 schema
- **整数毫秒时间戳做游标**：SQLite 的 DateTime 文本列在 SQLAlchemy/aiosqlite 组合下比较不可靠，整数比较稳
- **token 复用**：解卦完一次入库一次，分享面板复用此 token，避免同一卦多条记录

---

## [0.3.0] — 2026-05-30 — 知识层 + 双模起卦

降低门槛：不熟悉六爻的用户也能轻松上手；耐心有限的用户可以 4 秒得卦。

### 新增
- **后端**
  - `app/routers/yarrow.py` — `POST /api/yarrow/auto`：封装 `perform_full_divination`，返回 6 爻 + 每爻三变明细，前端串行播放快进动画
  - `tests/test_yarrow_auto.py` — 4 项测试
- **前端**
  - `components/KnowledgeOverlay/` — 全屏国风浮层，4 章：何为六爻 / 阴阳与动静 / 蓍草法 / 应用怎么用
  - `components/common/InfoTip.tsx` — 行内问号气泡（hover 桌面 / 点击移动）
  - `components/YarrowAutoSimulation/` — 一键起卦快进动画，6 爻 ×600ms ≈ 4 秒，复用蓍草视觉资产
  - `pages/HomePage/` — 引导段 + 「卦理浅说」入口；起卦按钮改为「亲手揲蓍 / 一键成卦」双按钮平列
  - `pages/DivinationPage/` — 根据 `?mode=auto|manual` 渲染不同组件，header 加知识入口
  - `pages/ResultPage/` — footer 加「怎么读这一卦？」直跳"阴阳与动静"章节

### 改动
- `YarrowSimulation`（手动模式）的 stage label 与三个分区（挂一/左堆/右堆）旁挂 InfoTip，每个 step 都有精炼解释

### 设计要点
- **快进动画 4 秒而非 0 秒**：保留仪式感，避免抽签器式廉价感
- **知识层按需查看**：分三层放（首页引导段 / 浮层完整说明 / 行内 InfoTip 气泡），不堆长文档

---

## [0.2.0] — 2026-05-30 — 一键分享

成卦后一键导出国风长图、永久短链、文字摘要。

### 新增
- **后端**
  - `app/db/__init__.py` + `orm.py` — SQLAlchemy 异步引擎 + `divinations` 表；启动时自动建表
  - `app/routers/share.py` — `POST /api/share`（落库整局结果，返回 12 字符 token + share_url）、`GET /api/share/{token}`（只读拉取）
  - `tests/test_share.py` — 4 项测试
  - 依赖：`sqlalchemy[asyncio]==2.0.36`、`aiosqlite==0.20.0`
- **前端**
  - `components/ShareSheet/` — 底部弹起三选项：保存图片 / 复制链接 / 复制文案；打开时预热分享落库 + 二维码生成
  - `components/ShareCard/` — 750×1334 截图源版面，含玄机子朱红印章（CSS 实现）+ 农历落款 + 二维码
  - `pages/SharedResultPage/` — `/r/:token` 只读分享页，复用 ResultPage 视觉但跳过 SSE
  - `utils/lunar.ts` — 公历→农历落款（"丙午年五月十七"）
  - 依赖：`html-to-image`、`qrcode`、`lunar-typescript`、`@types/qrcode`

### 改动
- `pages/ResultPage/` — SSE 完成后浮出「分享此卦」主按钮（流式中不可见）
- `App.tsx` — 加 `/r/:token` 路由

### 设计要点
- **图片+短链+文案三件套**：纯图片读 600-800 字解卦不友好；短链让对方"重新进入"这次占卜，与仪式感匹配；文案为兜底
- **token 不可猜测**：12 字符 × 31 字符 alphabet（去 0/o/i/l/1），冲突重试 5 次
- **同源短链**：前端拼 `${window.location.origin}/r/{token}`，无需后端配 PUBLIC_BASE_URL 也能跑

---

## [0.1.0] — 2026-05-29 — 初始版本

按 plan 完整落地：蓍草法手动起卦 + AI 流式解卦 + 国风水墨视觉。

### 包含
- **后端**：FastAPI + Pydantic v2 + OpenAI SDK；蓍草法算法 + 64 卦数据 + SSE 流式解卦
- **前端**：React 18 + TypeScript + Vite + Zustand；揲蓍法状态机交互 + 卦象 SVG + 流式逐字呈现
- **视觉**：宣纸纹理 + 浓墨黑 + 朱砂红动爻 + 毛笔字
- **测试**：揲蓍法约束 2000 轮验证（第一变 5/9，二三变 4/8，分布均匀）

参考实现计划：`.claude/plans/sequential-petting-thunder.md`（已归档）。
