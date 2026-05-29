# 开源前自检清单

发布到 GitHub 前请逐项确认：

## 🔒 隐私扫描

```bash
# 1. 是否仍有 .env 内容残留在源码（应为 0 命中，仅 .env 文件本身命中）
grep -rn "your-actual-key-prefix" \
  --exclude-dir=node_modules --exclude-dir=.venv --exclude-dir=.git .

# 2. 通用 key 模式扫描
grep -rnE "(sk-[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}|ghp_[A-Za-z0-9]{30,})" \
  --include="*.py" --include="*.ts" --include="*.tsx" --include="*.json" \
  --include="*.yml" --include="*.md" \
  --exclude-dir=node_modules --exclude-dir=.venv .

# 3. 确认 .env 不会被 git 跟踪
git check-ignore -v .env        # 应输出: .gitignore:N:.env  .env
```

## 📋 确认事项

- [ ] `.env` 在 `.gitignore` 中
- [ ] `.env.example` 仅含占位符（如 `sk-xxx...`）
- [ ] README 中 AI 配置一节明确告知用户：自备 Key、自填 URL
- [ ] 没有在源码 / commit message / PR 描述里贴过真实 Key
- [ ] 没有在 Dockerfile 中 `ENV RELAY_API_KEY=...` 硬编码（应只通过 compose / 运行时传入）
- [ ] 没有把 `.env` 通过 Dockerfile `COPY` 进镜像（已用 `.dockerignore` 排除）

## ⚠️ 万一已经把 Key 提交过

历史 commit 中的 Key 也算泄露，必须：

1. **立即去 Relay 后台吊销该 Key**（最重要！）
2. 用 `git filter-repo` 或 BFG 把历史中的敏感行删掉，再强推
3. 或者干脆删库重建：`rm -rf .git && git init`，作为全新项目首次提交

git 历史一旦推送，任何人都能 clone 出旧 commit。**只删当前文件不够**。

## 🚀 首次提交

```bash
cd liuyao-divination

# 确认 .env 不在跟踪列表
git status --ignored

# 初始化
git init
git add .
git status                        # 再次目检，确保没有 .env
git commit -m "feat: 初始化六爻占卜 Web 应用"

# 关联远端
git remote add origin git@github.com:<you>/liuyao-divination.git
git branch -M main
git push -u origin main
```
