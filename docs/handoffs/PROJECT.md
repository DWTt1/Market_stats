# 项目总览

## 目标与范围

构建股票市场统计项目。具体功能、数据源和交付形式尚待确认。

## 共同约束与决定

- 项目使用 Git 进行版本管理。
- GitHub 远程仓库由用户指定为 `https://github.com/DWTt1/Market_stats.git`；已核对其现有可见性为公开。
- 公网托管平台已由用户选定为 Cloudflare Pages；本项目优先采用连接现有 GitHub 仓库的自动构建方式。

## 总体进度

- 本地 Git 已初始化，并已发布到用户指定的 GitHub 仓库。
- A股统计网站的前端、Excel 导入脚本、真实 JSON 数据和 Windows 运行脚本已完成主体开发；完整验收与说明文档收尾仍按用户要求暂停。
- 用户已于 2026-09-10 明确授权将当前项目更新同步推送到既有 GitHub 仓库 `DWTt1/Market_stats`。
- B003 公网部署已开始，Pages 构建配置已整理；用户已进入 Pages 配置界面，但 Pages 项目是否创建及首次生产部署是否成功尚未核验。
- 2026-09-12，用户要求把新导入的 2026-09-11 数据同步到 GitHub；本地数据提交为 `0657d9b`、`24ae6b9`，恢复时应核对 `origin/main` 和 Cloudflare 构建状态。
- 2026-09-14，用户建立 B004 作为后续本地代码改动同步到 GitHub 的专用问题分支；用户每次通知改动完成后，在该分支核查、提交、推送并验证远端状态。当天数据已提交为 `efa2edd` 并推送至 `origin/main`；数据索引最新日期为 2026-09-14。
- 2026-09-15，B005 完成周线 KDJ/RSI 数据导入、每日明细筛选/排序/CSV、旧日期兼容和测试。9 月 14 日原始 Excel 的四列已重导为新 JSON 版本；B004 已将功能和数据提交 `0ec0f4e` 推送到 GitHub。Cloudflare Pages 构建和线上表现仍由 B003 核验。

## 关键产物

- 项目说明：`../../README.md`
- 分支索引：`INDEX.md`
- GitHub 仓库：`https://github.com/DWTt1/Market_stats`
- 网站开发交接：`branches/B002-A股统计网站开发/Headoff.md`
- 公网部署交接：`branches/B003-公网部署/Headoff.md`
- GitHub 同步交接：`branches/B004-GitHub同步/Headoff.md`
- 周线技术指标交接：`branches/B005-周线技术指标筛选/Headoff.md`
