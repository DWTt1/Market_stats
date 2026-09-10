# 数据格式与导入规则

## 数据路径

本地 `.env` 的 `STOCK_DATA_SOURCE` 是唯一原始目录配置；导入器只使用 `read_only=True, data_only=True` 打开 Excel。原始文件不保存、不重命名、不删除。密码、令牌和本地路径不写入公开 JSON。

`public/data/index.json` 是前端唯一入口，`schemaVersion=1`。字段包括 `latest`、`dates`（新到旧）、`generatedAt`、`days`、`stockHistoryFormat` 和 `stockHistoryShards`。

每个 `days` 项包含交易日期、导入时间、源文件名、摘要 counts/metrics、校验提示数量、`summaryPath`、各明细 `files` 路径和 `revision`。所有路径相对于 `public/data/`。不在索引放全部股票记录。

```text
public/data/
├─ index.json
├─ YYYY-MM-DD/
│  └─ <源文件摘要-导入版本>/
│     ├─ summary.json
│     ├─ two-yin.json
│     ├─ three-yin.json
│     ├─ three-yang-plus.json
│     ├─ industry.json
│     └─ exceptions.json
└─ stock-history/current/<00-ff>.json
```

每日数据使用不可变版本目录，旧交易日和同日旧版本保留；最后原子替换 index 切换当前版本。写文件时遇 Windows 短暂占用会有限重试。源文件读取前后核对修改时间、大小和日期，正在写入或刚修改的文件留待下次重试。导入锁阻止两个进程同时写出。

股票历史是可重建的派生索引，按证券代码完整字符串的 FNV-1a 哈希分成最多 256 桶。查询单股只读取一桶。固定桶路径原子更新，每次写入仍包括所有已导入日期；前端用索引更新时间刷新缓存。这部分可在未来迁移为单股 API。发生导入时目前会扫描生成的历史 JSON 重建桶，**不会重新打开未变化的历史 Excel**。长历史下可进一步做增量索引或 SQLite。

## 类型与空值

`StockRecord`：`code`、`name`、`industry`、`streak`、`isST`、`stLabel`、`open/high/low/close`、`volume`、`listedDate`。

- 代码始终是字符串，保留前导零和交易所后缀。
- 日期统一 `YYYY-MM-DD`，支持 Excel 1900/1904 日期系统、日期对象、分隔格式和紧凑 `YYYYMMDD`。
- `volume` 为整数；价格保留合理精度，最多八位小数。
- 无值为 `null`，ST 是 `true/false/null` 三态；不把空白 ST 擅自推定为非 ST。
- `ExceptionRecord` 增加动态 `type` 与 `missingDates` 日期数组；缺失日期不可用时为 null。异常中已有行情原样保留。
- `IndustryStat`：`signal`、`rank`、`industry`、`count`。
- `counts=null` 表示相关工作表缺失或不可读取；表头存在但无数据行时 `counts=0`。

`DailySummary` 包含 metrics、原始汇总指标 rawMetrics、汇总报告值 reportedCounts、统计口径 definitions、源文件核验 sourceChecks、导入核验 validations、数据来源和少量首页 highlights。

## 真实格式兼容

- 不按行号找表头；读取实际 `证券代码`、`类别/数量`、`异常类型` 等字段。
- 支持 `ST标识 → ST/*ST`、`股票数 → 数量`、`缺失交易日 → 缺失日期`，忽略新增未知列。
- 优先汇总 `T0日期`。T0 存在但非法时拒绝该文件。仅缺失 T0 时允许从汇总“扫描标题/范围”识别唯一明确日期，并 WARNING，不依赖文件名。
- 2026-09-08 是旧格式，无单独 T0、异常合计、交易状态和刷新日期。保留缺失值；交易状态显示“源文件未注明”。旧版 ST 空白仍显示“未知”。
- 9/8 原表 `920289.BJ 华汇智能` 同时出现在严格两连阴和“上市历史不足”异常中。网站保留两条原始归属并记录交集警告，不擅自删除。

## 校验与退出码

数量取有效明细行，不解析标题中的“xxx只”。检查三个信号数量、异常数量、重复代码、连续天数、阴线互斥、异常交集、逐行业数量和合计。

`validations` 保存 `name/status/expected/actual/message`。`status` 为 `pass`、`warning`、`unavailable`。缺少源核验值不能标为“通过”。警告显示在终端和网站统计说明中，不阻断其他日期。

- 退出码 `0`：导入完成或无变更，可含数据 WARNING。
- 退出码 `2`：部分文件错误，成功日期仍更新，历史仍保留；需检查日志。
- 退出码 `1`：配置、并发锁或发布数据失败。

扫描忽略 `~$` 文件。同日多文件按修改时间选择最新；同修改时间按文件名稳定排序。终端警告且 source.candidates 记录所有候选，source.file 记录最终选中项。选中文件失败时保留已发布旧版本，不悄悄切换成较旧候选。

`.cache/import-state.json` 保存增量指纹，`.cache/last-import-report.json` 保存最近运行统计。都不进入 Git。修改转换规则后用 `--rebuild` 应用到历史数据。
