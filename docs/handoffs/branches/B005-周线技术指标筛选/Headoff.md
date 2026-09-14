# B005 周线技术指标筛选

- 父分支：B002 A股统计网站开发；依赖：B002 现有网站与导入流程。
- 状态：已完成（本地实现和验证，GitHub 已同步；生产部署待 B003 核验）。更新时间：2026-09-15。
- 项目位置：`C:\Users\SAIVIA\Desktop\股票市场统计项目`；Git 工作目录同项目根，分支 `main`；功能与数据提交为 `0ec0f4e1e5f158878f6ad9275929bda8d993e9ad`，本交接状态随 B004 文档提交同步。

## 目标与范围

在现有“每日股票明细”内支持原始 Excel 提供的周线 KDJ-K/D/J 和 RSI14：按表头导入、保存数字或 null、显示周 J/周 RSI14、复用现有筛选/排序/URL/分页/CSV，并保证旧日期与旧 JSON 可用。用户明确要求不重建网站、不重算指标、不改变现有涨跌口径、不改首页和行业统计、不破坏旧历史数据。自定义 J/RSI 范围也已实现于高级筛选中。

## 已确认决定和理由

- Excel 四个中文表头在导入层映射为 `weeklyKdjK`、`weeklyKdjD`、`weeklyKdjJ`、`weeklyRsi14`；避免 React 中散用中文字段名。缺列或无效数字均为 null，不视为 0。
- 每日索引和摘要新增可选 `capabilities.weeklyTechnicalIndicators`，只在三种信号明细中至少一条记录有有效周 J 或周 RSI14 时为 true。前端对旧索引缺该字段的情况从加载的记录判断；对当前信号全空但当日其他信号有效的情况仍按日级能力启用，筛选结果可为 0。
- 基础指标在 URL 中使用 `j`、`rsi`，高级范围使用 `jMin/jMax/rsiMin/rsiMax`。双低/双高仅设置这两个基本条件，未创建另一套状态。切换信号 Tab 时保留其他查询条件并重置页码。切到旧日期时页面忽略已有技术查询参数，仍展示全部原始记录；回到新日期可以恢复这些条件。
- 周 J 和周 RSI14 加入现有 StockTable 列与通用排序。缺失排序值始终在末尾。CSV 对有指标的日期追加 K/D/J/RSI 四列，对旧日期不追加；导出仍用当前过滤后记录。

## 已完成工作与产物

- `scripts/stock_import/reader.py` 按表头读取四列；`scripts/import_excel.py` 写入日级能力标记。9 月 14 日工作簿的三个信号表均确认含新表头，首行示例与用户给出的数值一致；9 月 11 日工作簿仍为旧格式。
- 仅重导 2026-09-14，产生 `public/data/2026-09-14/7a9a2d0ed851-20260914173716094289/` 新不可变 JSON 版本并更新 `public/data/index.json`。此前旧日期和旧版本目录未修改。三类信号记录数分别为 308、395、262，四个指标字段均为 JSON 数字。旧日期记录仍无这些字段。
- `src/types/data.ts` 扩展可选类型；`src/utils/stocks.ts` 扩展统一 AND 筛选、范围和排序；`src/utils/csv.ts` 扩展导出；`src/utils/format.ts` 负责周线显示精度。
- `src/components/TechnicalFilters.tsx` 为筛选弹层，基础条件 J<20/J>80、RSI<35/RSI>70、双低/双高、高级 J<0/J>100 与数值范围。手机端使用底部面板样式。`src/components/StockTable.tsx` 接入过滤器和两列，`src/pages/Daily.tsx` 保持切换信号后的筛选状态，`src/styles.css` 增加延续现有风格的样式。
- `docs/DATA_FORMAT.md` 和 `README.md` 更新导入及每日更新说明；`tests/test_importer.py` 和 `tests/frontend.test.mjs` 增加兼容与指标用例。

## 验证

- `python -m unittest discover -s tests -p test_importer.py`：8 项通过，包括旧格式、新表头重排、空值以及全日无有效指标。
- `npm test`：9 项通过，包括真实 9 月 14 日三信号阈值、双低/双高、J<0/J>100、行业/ST/连续天数 AND、周 J/RSI 升降排序、null 末尾、CSV 与旧日期。
- `npm run build`：TypeScript 与 Vite 构建成功；仅保留原有 ECharts 大块体积提示，没有构建错误。
- 真实数据核查：9 月 14 日两连阴 J<0 有 17 条、J>100 有 12 条；三连阴分别 14、4 条；三连阳及以上分别 2、65 条，没有把 J 限制在 0–100。
- 浏览器检查：9 月 14 日两连阴原始 308 条，J<20 后 61 条、双低后 11 条；切三连阴时 URL 指标条件保留。9 月 11 日三连阴在旧 URL 指标参数仍存在时显示全部 1,465 条和无指标提示，技术按钮隐藏。390px 手机视口下底部面板可见；浏览器 error 日志为空。
- 未验证：生产 Cloudflare 页面及自动部署状态；浏览器下载事件未单独抓取，CSV 字符串内容和行数已自动测试。

## 后续与相关分支

本地开发目标已完成。用户于 2026-09-15 在 B004 明确要求同步代码，B004 已将功能和数据提交 `0ec0f4e` 推送到 GitHub 并核对远端。下一步由 B003 核查 Cloudflare Pages 自动构建与生产页面；不得把 GitHub 推送视为线上已更新。来源对话标识未提供；暂无后继对话。本轮用于浏览器验证的 Vite 服务已停止。恢复时通过 `git status` 和远端 SHA 核对当前状态。
