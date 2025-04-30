# Cron Server

![Version](https://img.shields.io/badge/version-1.0.1-blue)

> 一个基于Cloudflare Workers的轻量级定时任务管理系统

Cron Server 是一个强大的定时任务调度和管理工具，允许用户通过直观的Web界面创建、管理和监控定时任务。系统支持常规URL请求和复杂的CURL命令，具有友好的用户界面和完善的任务状态监控功能。

## ✨ 功能特点

- 🚀 **多样化任务类型**：支持URL请求和CURL命令两种任务类型
- 🕒 **灵活的定时设置**：自定义任务执行间隔
- 📊 **完整的任务生命周期管理**：创建、编辑、激活/停用、删除任务
- 📝 **详细的执行日志**：记录任务执行状态、响应时间和结果
- 🔔 **失败通知系统**：当任务执行失败时发送通知
- 🔍 **强大的筛选和搜索**：按状态、类型快速过滤任务
- 🔒 **安全的访问控制**：密码保护防止未授权访问
- ⚡ **基于Cloudflare Workers**：快速、可靠的全球分布式执行

## 🔧 技术栈

- Cloudflare Workers
- TypeScript
- KV Storage（用于数据存储）
- Web标准API (Fetch, Request, Response)
- HTML5, CSS3, JavaScript (前端界面)

## 📦 安装部署

### 前提条件

- Node.js 18+
- Cloudflare 账号
- Wrangler CLI

### 部署步骤

1. 克隆代码库

```bash
git clone https://your-repository/cron-server.git
cd cron-server
```

2. 安装依赖

```bash
pnpm install
```

3. 配置 Wrangler

复制示例配置文件并进行修改：

```bash
cp wrangler.toml.exapmle wrangler.toml
```

编辑 `wrangler.toml` 文件，替换以下值：
- KV 命名空间 ID
- 设置访问密码 (AUTH 变量)

4. 部署到 Cloudflare Workers

```bash
pnpm run deploy
```

## 🚀 使用指南

### 初次访问

1. 访问你的 Cloudflare Workers URL
2. 使用配置的密码登录系统
3. 登录后即可开始管理定时任务

### 创建新任务

1. 点击界面右上角的"添加任务"按钮
2. 填写任务名称、类型(URL或CURL)、执行间隔等信息
3. 对于URL类型，可以指定请求方法、头部和请求体
4. 点击"保存"完成任务创建

### 管理任务

- **执行任务**：点击任务列表中对应任务的"执行"按钮
- **查看详情**：点击任务列表中对应任务的"详情"按钮
- **编辑任务**：在任务详情页点击"编辑"按钮
- **删除任务**：在任务详情页点击"删除"按钮

### 筛选和搜索任务

- 使用顶部的搜索框按名称或URL搜索任务
- 使用状态筛选器切换显示所有/活跃/停用的任务
- 使用类型筛选器切换显示URL请求/CURL命令任务

## ⚙️ 系统配置

### 通知设置

1. 点击右上角的"设置"图标
2. 配置通知URL（webhook地址）
3. 保存设置

当任务执行失败时，系统将向配置的URL发送POST请求，包含任务执行失败的详细信息。

## 💻 开发指南

### 本地开发

```bash
# 启动本地开发服务器
pnpm run dev
```

## 👨‍💻 贡献

欢迎提交问题和改进建议！

## 📬 联系方式

如有疑问，请联系 [vua@live.com](mailto:vua@live.com)
