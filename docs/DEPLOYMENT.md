# 部署说明

当前阶段只准备静态产物；未执行任何远程推送、站点注册或生产部署，不需要现在绑定域名。

## 发布前准备

1. 本机执行 `update_data.bat`，确认数据已更新。
2. 执行 `npm run build`；或双击 `publish.bat` 一次完成导入和构建。
3. 构建输出是 `dist/`。前端托管服务只需要静态文件，不需要 Python，也不需要访问原始 Excel 目录。
4. 本地 `npm run preview` 可检查正式构建，默认访问终端显示的地址。

`publish.bat` 目前只准备发布文件，不包含部署命令。以后确认平台、项目和授权范围后，再在 `scripts/run.ps1` 的 publish 分支添加部署适配器。导入逻辑保持独立，凭据只存本地私有配置或平台 Secrets。

## Cloudflare Pages（优先兼容）

支持两种方式：手动上传 `dist/`，或后续连接 Git 仓库自动构建。

- Framework：Vite；Node：24 LTS。Cloudflare Pages 当前默认 Node 22.16.0，低于本项目 `package.json` 声明的 `>=22.22.0`，因此应显式设置 `NODE_VERSION=24`。
- Build command：`npm run build`（平台安装阶段使用锁文件安装 npm 依赖）。
- Output directory：`dist`。
- Root directory：仓库根目录。
- Git 构建时需包含 `public/data` 生成的 JSON；平台无法读取你的 Windows outputs 目录。
- `VITE_BASE_PATH=/`，无需域名即可先使用平台子域名。
- 不生成顶层 `404.html`，利用 Pages 默认 SPA 回退，支持直接访问 `/daily/2026-09-10?signal=three-yin`。
- `public/_headers` 为日期索引设置重新验证缓存规则。JSON 无更新时先检查 CDN 和浏览器是否仍缓存旧 index。

[Cloudflare Pages 静态路由说明](https://developers.cloudflare.com/pages/configuration/serving-pages/)、[Vite 静态部署说明](https://vite.dev/guide/static-deploy.html)。

### 推荐方案：连接 GitHub 自动部署

1. 登录 Cloudflare Dashboard，进入 **Workers & Pages**，依次选择 **Create application → Pages → Connect to Git**。
2. 授权 Cloudflare 的 GitHub App，并只授予所需仓库时选择 `DWTt1/Market_stats`。
3. 选择仓库后配置项目：

   | 配置项 | 本项目值 |
   | --- | --- |
   | Production branch | `main` |
   | Framework preset | `React (Vite)`；控制台可能只显示为 `React` |
   | Root directory | 留空（即仓库根目录） |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | `NODE_VERSION` | `24` |
   | `VITE_BASE_PATH` | `/` |

   `VITE_SITE_NAME` 可选；不设置时网站名称为“A股涨跌统计”。当前静态站点不需要 API 密钥或 Pages Functions。
4. 选择 **Save and Deploy**，等待首次构建成功，并记下 Cloudflare 分配的 `<项目名>.pages.dev` 地址。
5. 在公网验收首页、日期页、行业页、个股历史页和一个直接打开的深层 URL；同时检查 `/data/index.json` 可访问且内容为最新版本。
6. 以后在本地运行 `update_data.bat` 生成新数据，将获准发布的 `public/data`、代码和文档提交并推送到 `main`；GitHub 推送会自动触发下一次生产构建。
7. 需要自定义域名时，在 Pages 项目的 **Custom domains** 中添加。根域名需要将域名作为 Cloudflare Zone 并使用 Cloudflare nameserver；外部 DNS 上的子域名可按向导配置 CNAME 到 `<项目名>.pages.dev`。

Pages 项目创建时需选定 Git integration 或 Direct Upload；两种项目类型之后不能直接互相切换。若只想临时验证，可新建 Direct Upload 项目并上传 `dist/`，但长期每日更新更适合 Git integration。Cloudflare 当前对新项目总体更推荐 Workers，不过 Pages 仍支持此静态站点和 Git 自动部署。

## Vercel

导入现有 Git 仓库，选择 Vite，构建命令 `npm run build`，输出目录 `dist`，Node 24 LTS。根目录已提供 `vercel.json` SPA 路由回退。公开数据仍需先在本地生成并通过经授权的发布流程送到平台。

[Vercel Vite 部署说明](https://vercel.com/docs/frameworks/frontend/vite)。

## GitHub Pages

当前主方案为 Cloudflare Pages / Vercel。若之后选择仓库子路径的 GitHub Pages，需要设置 `VITE_BASE_PATH=/Market_stats/` 并重新构建；Router basename 与数据资源已使用该 base。还需单独配置深层 URL fallback 或 hash 路由。当前不把 GitHub Pages 深链兼容声称为已完成。

## 每日自动发布的后续链路

```text
股票统计程序完成 Excel
  → 调用 update_data.bat 或 Python 导入命令
  → 检查退出码、last-import-report.json
  → npm run build
  → 经确认的平台部署命令
```

生产流程应遇文件错误就停止发布，数据校验警告则由明确规则决定是否允许发布。Windows 任务计划程序可在统计程序结束后调用脚本；无人值守时先设 `STOCK_NO_PAUSE=1`。

采用不可变每日版本便于回溯；未来达到数百日后可增加仅发布 index 当前引用版本的打包步骤、历史派生索引增量更新及平台文件数/容量监测。清理旧版本需独立制定保留规则，当前脚本不删除历史。

## 后续需要确认的信息

- 托管平台与使用账号，以及站点项目名。
- 使用当前 GitHub 仓库还是手动上传 `dist/`。
- 是否授权推送代码/数据，以及目标分支。
- 是否每个交易日自动发布、发布时机与失败通知方式。
- 自定义域名可后续再提供，无需购买新域名。

公开展示前，由数据使用方核对其行情数据服务协议允许的公开展示范围。网站只陈述数据来源，不宣称官方合作。
