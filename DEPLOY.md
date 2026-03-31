# Cloudflare Pages 部署说明

## 数据模型（重要）

当前为 **全站共用一份打卡列表**：KV 中固定键 `rec:v1:global`，**无登录、无密钥**。  
任何人打开你部署的站点，读写的是**同一份数据**（公开白板）。**请勿用于隐私或敏感场景**；若被恶意访问，可能被刷写或清空。

## 部署步骤

1. 在 Cloudflare 创建 **KV Namespace**（名称随意，如 `punch-records`）。
2. Pages 项目 → **Settings** → **Functions** → **KV bindings**：
   - Variable name：`**PUNCH_KV**`
   - 选择上述 Namespace
3. 构建：`npm run build`，输出目录 **`dist`**。
4. 根目录 `wrangler.toml` 中的 `id` 可填该 Namespace ID，便于本地 `wrangler pages dev dist`。

可选环境变量 **`ALLOWED_ORIGIN`**：逗号分隔的站点 Origin，用于收紧 CORS；不设置时 API 使用 `*`。

## 本地开发

- 仅 `npm run dev` 时，若没有代理到 Worker，`/api/records` 会失败，页面会用 **localStorage 缓存**并提示黄条；联调可 `npm run build && npx wrangler pages dev dist`，或在 `.env.local` 设置 `VITE_API_BASE_URL=http://127.0.0.1:8788`（端口以 wrangler 为准）再 `npm run dev`。

## 脚本

```bash
npm run pages:dev    # build + wrangler pages dev dist
npm run pages:deploy # build + wrangler pages deploy dist
```
