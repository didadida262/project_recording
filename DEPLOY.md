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
3. **构建设置**（Build configuration）——**必须填写，否则会报 `dist` 不存在**：
   - **Framework preset**：选 **Vite**，或选 **None** 后手动填下面两项
   - **Build command**：`npm run build`（必填；留空则不会执行构建，不会出现 `dist`）
   - **Build output directory**：`dist`（与 Vite 默认输出一致）
   - **Root directory**：项目在仓库根目录则留空
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
