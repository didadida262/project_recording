# 部署与配置（Cloudflare Pages）

## 你需要准备

- Node.js 18+（本地执行 `npm run build`）
- Cloudflare 账号（免费即可）
- 代码在 Git 仓库（推荐）或本地打包上传

---

## 一、在 Cloudflare 创建 KV（存打卡数据）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧 **Storage & databases** → **Workers KV**（或 **Workers & Pages** → **KV**）
3. **Create a namespace**，例如 `punch_recordings`
4. 打开该 Namespace → **Instance Detail** / **Settings** 里复制 **Namespace ID**（32 位十六进制）

### Bindings：Dashboard 还是 wrangler.toml？

两种互斥，以你界面为准：

| 情况 | 做法 |
|------|------|
| 可以在 **Pages → Settings → Bindings** 里点 **Add** | 在网页里添加 **PUNCH_KV** → 选 Namespace 即可，`wrangler.toml` 里**不要**写 `[[kv_namespaces]]`，或从仓库删除该段以免冲突。 |
| 提示 **Bindings are managed through wrangler.toml** | 必须在仓库 **`wrangler.toml`** 里配置 `[[kv_namespaces]]`，`binding = "PUNCH_KV"`，`id = "你的NamespaceID"`，提交后重新部署；控制台无法在此模式下手动加 KV。 |

**注意：** `id` 必须是真实 Namespace ID；填写 `REPLACE_...` 等假字符串会导致部署报错。

本地：`npm run build && npx wrangler pages dev dist` 会使用 `wrangler.toml` 里的 KV 配置。

---

## 二、创建 Pages 项目并绑定 KV

### 方式 A：连接 Git（推荐，改代码自动部署）

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. 选仓库与分支，创建项目
3. **构建设置**（Build configuration）——**必须填写，否则会报 `dist` 不存在**：
   - **Framework preset**：选 **Vite**，或选 **None** 后手动填下面两项
   - **Build command**：`npm run build`（必填；留空则不会执行构建，不会出现 `dist`）
   - **Build output directory**：`dist`（与 Vite 默认输出一致）
   - **Root directory**：项目在仓库根目录则留空
4. **Save and Deploy** 先完成一次构建。
5. **KV**：若控制台提示由 **wrangler.toml** 管理 Bindings，则在仓库 **`wrangler.toml`** 里配置 `[[kv_namespaces]]`（见「一」）；若网页可 **Add**，则添加 **PUNCH_KV** → 选 Namespace。勿重复、勿冲突。
6. **Deployments** 里 **Retry deployment** 或推送新 commit，使配置生效。

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

---

## 故障排除：`Output directory "dist" not found` / `No build command specified`

日志里若出现 **Skipping build step**、**Output directory "dist" not found**，说明 **Cloudflare 没有执行 `npm run build`**。

**处理：**

1. 打开 Pages 项目 → **Settings** → **Build**（或 **Builds & deployments** → **Build configuration**）→ **Edit configuration**。
2. 设置：
   - **Build command**：`npm run build`
   - **Build output directory**：`dist`
3. **Save**，再 **Retry deployment** 或重新推送一次 commit。

`wrangler.toml` 里的 `pages_build_output_dir` **不能代替** 在控制台填写构建命令；Git 集成时构建命令以 Dashboard 为准（可选用 **Vite** 预设自动带出上述命令与目录）。

若使用 Functions + `wrangler.toml`，请确认项目已使用 [**V2 build system**](https://developers.cloudflare.com/pages/configuration/build-image/#v2-build-system)（Dashboard → Builds → 构建镜像版本）。

### 线上 `GET /api/records` 返回 **500**，页面提示无法连接云端

常见原因：**KV 只绑在 Preview，没绑 Production**（或只绑了某一环境）。

1. 打开 **Workers & Pages** → 你的项目 → **Settings** → **Bindings**。
2. 看页面里是否有 **环境切换**（**Production** / **Preview**），两个环境都要各加一条：
   - **Variable name**：`PUNCH_KV`
   - **KV namespace**：选你的 `punch_recordings`（或同名 Namespace）
3. **Save**，到 **Deployments** 里 **Retry deployment** 或重新推送一次 commit。

另请确认：自定义域名（如 `www.mileswang262.com`）指向的 **就是这个** Pages 项目，而不是别的空项目。

部署更新后的代码后，若仍未绑定 KV，接口会返回 **503** 与 JSON 提示 `kv_not_configured`，而不再是难以排查的 500。

### `Invalid KV namespace ID` / `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`

说明 `wrangler.toml` 里曾写过**无效的 KV ID 占位符**。请**不要**在仓库里填占位符；应删除 `[[kv_namespaces]]` 中的假 ID（本仓库已去掉），并仅在 **Pages → Settings → Functions → KV bindings** 里绑定 **PUNCH_KV**。提交后重新部署。
