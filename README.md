# A股涨跌统计

用于公开展示 A 股每日连续阴线、连续阳线及行业分布的静态数据网站。使用真实 Excel 数据，保留历史记录，提供筛选、排序、分页、CSV 导出和股票历史信号。统计结果不构成投资建议。

## 架构与技术栈

```text
只读 Excel 目录 → Python 标准化与校验 → 版本化 JSON + 日期摘要索引
                                           ↓
                           React + TypeScript + Vite 静态网站
```

React 19、严格 TypeScript、Vite 8、Tailwind CSS 4、Apache ECharts 6；Python 3.10+、openpyxl、python-dotenv。无数据库或服务器 API。前端统一通过 `DataRepository` 访问 JSON，后续可以替换为 API/SQLite/PostgreSQL 数据服务。

## 已实现页面

| 页面 | 地址与功能 |
| --- | --- |
| 首页 | `/`，交易日期、核心指标、连续涨跌结构、历史趋势、行业 Top、最长连阳及今日统计事实 |
| 每日统计 | `/daily/2026-09-10`，三个信号 Tab，代码/名称搜索，行业、ST、连续天数筛选，全列排序与20/50/100条分页 |
| 行业统计 | `/industry/2026-09-10`，三个 Top10/15 图、点击联动股票列表、行业数量结构比较 |
| 历史数据 | `/history`，已有日期选择、任意日期查询、5/10/20日趋势、历史摘要 |
| 异常数据 | `/exceptions/2026-09-10`，动态异常分类，独立筛选、排序及导出 |
| 统计说明 | `/about?date=2026-09-10`，易读解释与源口径、核验记录、来源与更新时间 |
| 股票历史 | `/stock/002343.SZ`，跨日期信号与实际连续天数 |

全站支持深色、浅色、跟随系统；中国市场红涨绿跌。所有页面含来源与免责声明。首页仅请求索引、当日摘要及行业数据，不加载全部历史股票明细；全球搜索输入后才加载所选日期的四类明细。

## 环境要求与首次安装

- Node.js **24 LTS**（附带 npm；最低 >=22.22.0）。
- Python **3.10 或更高**，安装时启用 PATH。
- Windows PowerShell 5.1+；首次安装依赖需要网络。

在本项目目录打开终端：

```powershell
npm install
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

若本机已有 `.env`，不要覆盖。编辑 `.env`，将 `STOCK_DATA_SOURCE` 设置为原始 outputs 目录绝对路径。当前开发机器已经配置好 `.env` 并导入三天真实数据。

```dotenv
STOCK_DATA_SOURCE=C:\path\to\stock-statistics\outputs
VITE_SITE_NAME=A股涨跌统计
VITE_BASE_PATH=/
```

`.env`、虚拟环境和 `.cache` 已被 Git 忽略；`.env.example` 可公开。不要把私有路径或凭据写进 `VITE_` 变量，后者会暴露给浏览器。网站名称集中在 `src/config.ts`，可用 `VITE_SITE_NAME` 覆盖。

## 每日更新

最简单方式：统计程序输出新 Excel 后，双击 **`update_data.bat`**。

带有 `周KDJ-K`、`周KDJ-D`、`周KDJ-J`、`周RSI14` 列的新 Excel 沿用同一更新流程；导入器按表头读取并自动启用当天的周线筛选。旧 Excel 和历史日期仍可照常使用，不需要补算指标。

也可使用：

```powershell
.\.venv\Scripts\python.exe scripts/import_excel.py
.\.venv\Scripts\python.exe scripts/import_excel.py --date 2026-09-10
.\.venv\Scripts\python.exe scripts/import_excel.py --rebuild
```

若已激活虚拟环境，对应命令就是：

```powershell
python scripts/import_excel.py
python scripts/import_excel.py --rebuild
python scripts/import_excel.py --date 2026-09-10
```

默认仅重处理新增或修改过的源文件。同日重复文件选择修改时间最新者并 WARNING，保留版本元数据。没有变化时显示“没有发现新的交易日数据”。`--rebuild` 应用于转换规则调整；历史日期不会被删除。重建股票历史索引会读取生成的历史 JSON，不重读未变化的 Excel。

更新后开发网站刷新页面即可读取新的 index；已经生成的 `dist` 需要再次 `npm run build`，远程网站则需重新发布。

## 启动与构建

双击 **`start_dev.bat`**：检查 Python 依赖、更新数据、必要时安装前端依赖，并启动 Vite、打开浏览器。首次机器需先安装 Node/Python并配置 `.env`。

标准命令：

```powershell
npm run dev
npm run build
npm run preview
```

开发默认 [http://127.0.0.1:5173/](http://127.0.0.1:5173/)，端口占用时以终端实际地址为准；终端 `Ctrl+C` 结束服务。`npm run build` 会先执行严格 TypeScript 检查，产物在 `dist/`。

`publish.bat` 已预留并能导入和构建，**当前不执行部署、git push 或远程操作**。脚本公共逻辑在 `scripts/run.ps1`，避免多处重复路径。无人值守调用前设置环境变量 `STOCK_NO_PAUSE=1`。

## 目录结构

```text
public/data/                 日期索引、不可变每日版本、股票历史派生索引
scripts/import_excel.py      导入命令、增量调度、文件稳定性检查
scripts/stock_import/        Excel读取、标准化、校验、原子JSON输出
scripts/run.ps1              Windows脚本公共入口
src/components/             图表、表格、日期选择、主题、全局搜索等
src/pages/                  七个页面
src/hooks/                  异步数据与主题状态
src/services/data.ts         可替换的数据服务接口
src/types/data.ts            DailySummary/StockRecord等类型
src/utils/                  格式化、筛选排序、CSV
tests/                      真实JSON逻辑测试与隔离导入夹具
docs/DATA_FORMAT.md          数据结构、兼容规则、日志与退出码
docs/DEPLOYMENT.md           Cloudflare Pages / Vercel部署及自动发布预留
docs/handoffs/               项目状态与问题分支交接
```

## 数据说明与样本差异

当前导入结果：

| 数据日期 | 严格两连阴 | 严格三连阴 | 三连阳及以上 | 异常 |
| --- | ---: | ---: | ---: | ---: |
| 2026-09-10 | 1,646 | 678 | 343 | 19 |
| 2026-09-09 | 915 | 186 | 575 | 23 |
| 2026-09-08 | 291 | 172 | 700 | 25 |

9/10 最长连续阳线为14天，`002343.SZ 慈文传媒`为5天，均读取真实记录。

9/8 是旧版工作簿，缺少独立T0；从汇总标题/范围明确识别日期，并提示。该日ST空白保留未知，异常合计无法与不存在的源汇总值核验；`920289.BJ`确实同时出现在两连阴和异常表，保留原样并警告。9/9和9/10全部导入核验通过。详见 [数据格式说明](docs/DATA_FORMAT.md)。

## 测试与验收

```powershell
npm test
.\.venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py" -v
npm run build
```

Python测试只在本项目 `.cache` 中创建隔离夹具，不操作原始Excel。前端逻辑测试读取真实9/10 JSON，覆盖组合筛选、数值排序、实际连续天数、前导零、空值、中文成交量格式及全量筛选CSV导出。

浏览器验收记录见 [验收报告](docs/ACCEPTANCE.md)。

## 常见错误处理

- **找不到源目录**：检查 `.env` 中 `STOCK_DATA_SOURCE`，脚本不会替你创建或改写原始目录。
- **文件正在写入或权限拒绝**：等待统计程序完成/Excel释放文件，再运行；失败文件不影响其他日期，也不删除旧数据。
- **缺少工作表/列**：输出 WARNING，缺失值显示“—”；无法确认的计数不伪造为0。前端统计说明可查原因。
- **日期无法读取**：检查汇总T0；无效T0不会用文件名替代。没有可识别日期的文件会跳过并ERROR。
- **重复日期**：检查日志中的最终选择文件。需强制重新转换时使用 `--date ... --rebuild`。
- **没有新增数据**：正常增量行为；若修改了转换程序，用 `--rebuild`。
- **网页未更新**：导入后刷新；部署产物需重新构建与发布，检查 index 缓存。
- **中文乱码**：脚本/JSON/CSV 使用UTF-8，CSV带BOM；用现代Windows Terminal或启用UTF-8的编辑器。CSV直接在支持UTF-8的Excel中打开。
- **Python/npm找不到**：安装对应运行时并重开终端。当前Codex机器的项目内npm后备路径由Windows入口自动识别；一般机器直接用Node自带npm。
- **某日无数据**：历史页输入日期会显示“该日期暂无统计数据。”，不是运行错误。
- **构建有ECharts体积提示**：图表已独立懒加载并按需引入，提示不代表构建失败。

## 部署与未来扩展

完整 [部署说明](docs/DEPLOYMENT.md) 包含 Cloudflare Pages、Vercel、GitHub Pages差异、缓存、每日更新和发布权限。当前无域名绑定和线上部署。

未来优先项：历史索引增量更新、自动导入完成事件、经授权的一键部署、失败通知、单股API、SQLite/PostgreSQL后端适配。前端不依赖Excel结构，可逐步升级。
