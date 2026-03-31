# 部署与配置（Cloudflare Pages）

## 你需要准备

- Node.js 18+（本地执行 `npm run build`）
- Cloudflare 账号（免费即可）
- 代码在 Git 仓库（推荐）或本地打包上传

---

## 一、在 Cloudflare 创建 KV（存打卡数据）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧 **Workers & Pages** → **KV**
3. **Create a namespace**，名称随意，例如 `punch-records`
4. 创建后点进该 Namespace，复制 **Namespace ID**（一长串十六进制）

把根目录 `wrangler.toml` 里的占位符换成你的 ID（本地用 `wrangler pages dev` 时需要）：

```toml
[[kv_namespaces]]
binding = "PUNCH_KV"
id = "这里粘贴你的 Namespace ID"
```

---

## 二、创建 Pages 项目并绑定 KV

### 方式 A：连接 Git（推荐，改代码自动部署）

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选仓库与分支，创建项目
3. **构建设置**（Build configuration）：
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
   - Root directory：若项目在仓库根目录则留空
4. **Save and Deploy** 先完成一次构建（此时 `/api/records` 可能还不可用，直到绑定 KV）
5. 进入该项目 → **Settings** → **Functions** → 找到 **KV namespace bindings** → **Add binding**：
   - **Variable name** 必须填：**`PUNCH_KV`**（与 `functions/api/records.ts` 里一致）
   - **KV namespace**：选你在「一」里创建的 Namespace
6. 回到 **Deployments**，对最新一次部署 **Retry deployment**，或随便推一个空 commit 触发重新部署

### 方式 B：命令行部署（不连 Git）

在项目根目录：

```bash
npm install
npx wrangler login
npm run pages:deploy
```

按提示选或创建 Pages 项目。若提示缺少 KV，需在 Dashboard 里给该项目加上与「方式 A」相同的 **PUNCH_KV** 绑定，再重新部署一次。

---

## 三、可选：环境变量（CORS）

若你绑定了自定义域名、需要限制哪些网站能调 API，可在 Pages 项目：

**Settings** → **Environment variables** → **Add**（作用域选 Production / Preview）

| 名称 | 说明 |
|------|------|
| `ALLOWED_ORIGIN` | 多个 Origin 用英文逗号分隔，例如：`https://xxx.pages.dev,https://www.你的域名.com` |

不配置时，API 侧 CORS 会较宽松（适合个人小项目）。

---

## 四、本地开发说明

| 场景 | 做法 |
|------|------|
| 只调 UI | `npm run dev`，打卡数据走本机 `localStorage`，可能看到「无法连接云端」黄条，属正常。 |
| 本地连真实 API | 终端 1：`npm run pages:dev`（会先 `build` 再启 `wrangler pages dev dist`）；浏览器用终端里打印的地址（常见 `http://127.0.0.1:8788`）。 |
| Vite + Wrangler 分两个端口 | 终端 1：`npm run build && npx wrangler pages dev dist`；终端 2：项目根建 `.env.local`，内容一行 `VITE_API_BASE_URL=http://127.0.0.1:8788`（端口以 wrangler 为准），再 `npm run dev`。 |

---

## 五、数据与安全提醒

- 线上数据在 **KV**，键为 **`rec:v1:global`**，全站共用一份列表，**无登录**。
- 任何人知道网址即可读写同一份数据；勿用于隐私或重要数据。

---

## 六、常用命令

```bash
npm install          # 安装依赖
npm run dev          # 本地前端开发
npm run build        # 生成 dist/
npm run pages:dev    # build + 本地模拟 Pages（含 Functions）
npm run pages:deploy # build + 部署到 Cloudflare Pages
```
