# Privacy Policy / 隐私政策

**Tab-Tab Browser Extension**
Last updated: April 20, 2026 / 最后更新：2026 年 4 月 20 日

---

## English

### Overview

Tab-Tab is a Chrome new tab extension that helps you manage open browser tabs. We are committed to protecting your privacy. This policy explains what data the extension accesses, how it is used, and what is never collected.

### Data We Access

| Data | Purpose | Stored Remotely? |
|---|---|---|
| Open tab URLs and titles | Display and group your tabs on the new tab page | No |
| Browser window information | Merge windows feature | No |
| Local geolocation (latitude/longitude) | Fetch weather from Open-Meteo API | No — only coordinates are sent to Open-Meteo |
| Extension settings (skin, theme, sort order, saved tabs, notes, tasks) | Persist your preferences across sessions | No — stored locally via `chrome.storage.local` only |

### Data We Do NOT Collect

- We do not collect, transmit, or store any personal information on any server.
- We do not track browsing history or behavior.
- We do not use analytics, advertising SDKs, or any third-party tracking services.
- We do not require an account or login of any kind.
- We never read the content of web pages you visit.

### Third-Party Services

Tab-Tab uses one external API:

**Open-Meteo** (`api.open-meteo.com`) — an open-source weather service. When you enable the weather widget, your approximate GPS coordinates (latitude and longitude) are sent to Open-Meteo to retrieve the current weather. No other information is sent. Open-Meteo does not require an API key and does not track users. See their privacy policy at [open-meteo.com](https://open-meteo.com).

The weather widget is optional. If you do not grant location permission, no data is sent to Open-Meteo.

### Local Storage

All extension data (saved tabs, notes, tasks, settings, sort order, statistics) is stored exclusively in your browser's local storage via the Chrome `storage.local` API. This data never leaves your device.

### Permissions Explained

| Permission | Reason |
|---|---|
| `tabs` | Read open tab URLs and titles to display and manage them |
| `activeTab` | Interact with the currently active tab |
| `storage` | Save your settings and data locally in the browser |

### Changes to This Policy

If this policy changes in a future version, the updated date at the top of this document will reflect it. We will never introduce data collection without updating this policy first.

### Contact

If you have questions about this privacy policy, please open an issue on GitHub:
[github.com/imlinhan/Tab-Tab](https://github.com/imlinhan/Tab-Tab)

---

## 中文

### 概述

Tab-Tab 是一款 Chrome 新标签页扩展，帮助你管理打开的浏览器标签页。我们承诺保护你的隐私。本政策说明扩展访问哪些数据、如何使用，以及哪些数据绝不会被收集。

### 我们访问的数据

| 数据 | 用途 | 是否上传至服务器 |
|---|---|---|
| 已打开标签页的 URL 和标题 | 在新标签页展示并分组你的标签页 | 否 |
| 浏览器窗口信息 | 合并窗口功能 | 否 |
| 本地地理位置（经纬度） | 通过 Open-Meteo API 获取天气 | 否——仅坐标发送至 Open-Meteo |
| 扩展设置（皮肤、主题、排列顺序、保存的标签页、备注、任务） | 跨会话保留你的偏好设置 | 否——仅通过 `chrome.storage.local` 本地存储 |

### 我们绝不收集的数据

- 不收集、传输或在任何服务器上存储任何个人信息。
- 不追踪浏览历史或行为。
- 不使用任何分析工具、广告 SDK 或第三方追踪服务。
- 不需要账号或任何形式的登录。
- 不读取你访问的网页内容。

### 第三方服务

Tab-Tab 仅使用一个外部 API：

**Open-Meteo**（`api.open-meteo.com`）—— 一个开源天气服务。当你启用天气小组件时，你的大致 GPS 坐标（经纬度）会被发送至 Open-Meteo 以获取当前天气信息，不会发送其他任何信息。Open-Meteo 不需要 API 密钥，也不追踪用户。详见其隐私政策：[open-meteo.com](https://open-meteo.com)。

天气组件为可选功能。如果你未授予位置权限，不会有任何数据发送至 Open-Meteo。

### 本地存储

所有扩展数据（已保存标签页、备注、任务、设置、排列顺序、统计数据）均通过 Chrome `storage.local` API 独家存储在你的浏览器本地，数据永远不会离开你的设备。

### 权限说明

| 权限 | 原因 |
|---|---|
| `tabs` | 读取已打开标签页的 URL 和标题，用于展示和管理 |
| `activeTab` | 与当前活动标签页交互 |
| `storage` | 在浏览器本地保存你的设置和数据 |

### 政策变更

如果未来版本中本政策有所变更，文档顶部的更新日期将同步更新。在引入任何数据收集之前，我们必定会先更新本政策。

### 联系方式

如有关于本隐私政策的问题，请在 GitHub 提交 Issue：
[github.com/imlinhan/Tab-Tab](https://github.com/imlinhan/Tab-Tab)
