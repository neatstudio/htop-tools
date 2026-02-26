# HTOP Tools - OpenClaw 系统工具插件

🔧 一个 OpenClaw 插件，提供系统监控和密码学工具，支持 CLI 命令和聊天自动回复命令。

## ✨ 功能特性

### 系统监控
- **top** - 查看 CPU 占用最高的进程
- **mem** - 查看内存占用最高的进程
- **port** - 查看所有开放端口
- **disk** - 查看磁盘使用情况
- **memory** - 查看内存使用情况
- **load** - 查看系统负载
- **net** - 查看网络连接统计

### 密码学工具
- **md5** - MD5 哈希计算
- **sha1** - SHA1 哈希计算
- **sha256** - SHA256 哈希计算
- **base64/unbase64** - Base64 编码/解码
- **urlencode/urldecode** - URL 编码/解码
- **passwd** - 生成随机密码
- **uuid** - 生成 UUID
- **encrypt/decrypt** - AES 加密/解密

## 📦 安装

### 方式1：本地链接（开发）
```bash
git clone https://github.com/gouki/htop-tools.git
cd htop-tools
openclaw plugins install -l .
openclaw plugins enable htop-tools
openclaw gateway restart
```

### 方式2：配置 `plugins.allow`
确保 `~/.openclaw/openclaw.json` 中已添加：
```json
{
  "plugins": {
    "allow": ["htop-tools"]
  }
}
```

## 🚀 使用方法

### CLI 终端命令

```bash
# 系统监控
openclaw tools top [n]          # CPU 占用最高的 n 个进程 (默认 10)
openclaw tools mem [n]          # 内存占用最高的 n 个进程
openclaw tools port             # 开放端口列表
openclaw tools disk             # 磁盘使用情况
openclaw tools memory           # 内存使用情况
openclaw tools load             # 系统负载
openclaw tools net              # 网络连接统计

# 哈希计算
openclaw tools md5 "hello"              # e10adc3949ba59abbe56e057f20f883e
openclaw tools sha1 "hello"             # 
openclaw tools sha256 "hello"           # 

# 编码/解码
openclaw tools base64 "hello"           # aGVsbG8=
openclaw tools unbase64 "aGVsbG8="      # hello
openclaw tools urlencode "hello world"  # hello%20world
openclaw tools urldecode "hello%20world" # hello world

# 密码工具
openclaw tools passwd --length 16       # 生成16位随机密码
openclaw tools uuid                     # 生成 UUID

# AES 加密/解密
openclaw tools encrypt "secret message" -p "mypassword"
openclaw tools decrypt "iv:ciphertext" -p "mypassword"
```

### 聊天自动回复命令

在支持的聊天频道（Telegram、Discord、飞书等）中直接输入：

```
/tools                          # 显示帮助
/tools md5 123456               # MD5 哈希
/tools sha256 hello             # SHA256 哈希
/tools base64 hello             # Base64 编码
/tools unbase64 aGVsbG8=        # Base64 解码
/tools urlencode hello world    # URL 编码
/tools urldecode hello%20world  # URL 解码
/tools passwd 20                # 生成20位随机密码
/tools uuid                     # 生成 UUID
/tools top 5                    # 查看 CPU 占用最高的5个进程
/tools mem 5                    # 查看内存占用最高的5个进程
/tools port                     # 查看开放端口
/tools disk                     # 磁盘使用情况
/tools memory                   # 内存使用情况
/tools load                     # 系统负载
/tools net                      # 网络连接统计
/tools encrypt secret -p mypassword   # AES 加密
/tools decrypt iv:data -p mypassword  # AES 解密
```

## ⚙️ 配置选项

在 `~/.openclaw/openclaw.json` 中配置：

```json
{
  "plugins": {
    "entries": {
      "htop-tools": {
        "enabled": true,
        "config": {
          "topLimit": 10    // top/mem 命令默认显示的进程数
        }
      }
    }
  }
}
```

## 🏗️ 项目结构

```
htop-tools/
├── openclaw.plugin.json    # 插件清单
├── package.json            # NPM 配置
├── index.ts                # 主代码
└── README.md               # 本文件
```

## 🔌 插件 API

本插件注册了以下 OpenClaw API：

- `api.registerCli()` - CLI 命令
- `api.registerCommand()` - 聊天自动回复命令 (`/tools`)
- `api.registerTool()` - Agent Tool (`system_tools`)

## 📝 许可证

MIT

## 👤 作者

[gouki](https://github.com/neatstudio)

---

Made with 🐑 for OpenClaw
