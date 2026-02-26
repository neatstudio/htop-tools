# HTOP Tools - OpenClaw System Tools Plugin

🔧 An OpenClaw plugin providing system monitoring and cryptographic tools, supporting both CLI commands and chat auto-reply commands.

## ✨ Features

### System Monitoring
- **top** - View processes with highest CPU usage
- **mem** - View processes with highest memory usage
- **port** - View all open ports
- **disk** - View disk usage
- **memory** - View memory usage
- **load** - View system load average
- **net** - View network connection statistics

### Cryptographic Tools
- **md5** - MD5 hash calculation
- **sha1** - SHA1 hash calculation
- **sha256** - SHA256 hash calculation
- **base64/unbase64** - Base64 encode/decode
- **urlencode/urldecode** - URL encode/decode
- **passwd** - Generate random passwords
- **uuid** - Generate UUID
- **encrypt/decrypt** - AES encryption/decryption

## 📦 Installation

### Method 1: Local Link (Development)
```bash
git clone https://github.com/neatstudio/htop-tools.git
cd htop-tools
openclaw plugins install -l .
openclaw plugins enable htop-tools
openclaw gateway restart
```

### Method 2: Configure `plugins.allow`
Ensure `~/.openclaw/openclaw.json` includes:
```json
{
  "plugins": {
    "allow": ["htop-tools"]
  }
}
```

## 🚀 Usage

### CLI Commands

```bash
# System Monitoring
openclaw tools top [n]          # Top n processes by CPU (default 10)
openclaw tools mem [n]          # Top n processes by memory
openclaw tools port             # List open ports
openclaw tools disk             # Disk usage
openclaw tools memory           # Memory usage
openclaw tools load             # System load
openclaw tools net              # Network connections

# Hash Calculation
openclaw tools md5 "hello"              # e10adc3949ba59abbe56e057f20f883e
openclaw tools sha1 "hello"
openclaw tools sha256 "hello"

# Encoding/Decoding
openclaw tools base64 "hello"           # aGVsbG8=
openclaw tools unbase64 "aGVsbG8="      # hello
openclaw tools urlencode "hello world"  # hello%20world
openclaw tools urldecode "hello%20world" # hello world

# Password Tools
openclaw tools passwd --length 16       # Generate 16-char random password
openclaw tools uuid                     # Generate UUID

# AES Encryption/Decryption
openclaw tools encrypt "secret message" -p "mypassword"
openclaw tools decrypt "iv:ciphertext" -p "mypassword"
```

### Chat Auto-Reply Commands

Use directly in supported chat channels (Telegram, Discord, Feishu, etc.):

```
/tools                          # Show help
/tools md5 123456               # MD5 hash
/tools sha256 hello             # SHA256 hash
/tools base64 hello             # Base64 encode
/tools unbase64 aGVsbG8=        # Base64 decode
/tools urlencode hello world    # URL encode
/tools urldecode hello%20world  # URL decode
/tools passwd 20                # Generate 20-char password
/tools uuid                     # Generate UUID
/tools top 5                    # Top 5 CPU processes
/tools mem 5                    # Top 5 memory processes
/tools port                     # Open ports
/tools disk                     # Disk usage
/tools memory                   # Memory usage
/tools load                     # System load
/tools net                      # Network stats
/tools encrypt secret -p mypassword   # AES encrypt
/tools decrypt iv:data -p mypassword  # AES decrypt
```

## ⚙️ Configuration

Configure in `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "htop-tools": {
        "enabled": true,
        "config": {
          "topLimit": 10    // Default process count for top/mem commands
        }
      }
    }
  }
}
```

## 🏗️ Project Structure

```
htop-tools/
├── openclaw.plugin.json    # Plugin manifest
├── package.json            # NPM config
├── index.ts                # Main code
├── README.md               # This file (English)
└── README.zh-CN.md         # Chinese version
```

## 🔌 Plugin APIs

This plugin registers the following OpenClaw APIs:

- `api.registerCli()` - CLI commands
- `api.registerCommand()` - Chat auto-reply commands (`/tools`)
- `api.registerTool()` - Agent Tool (`system_tools`)

## 📝 License

MIT

## 👤 Author

[neatstudio](https://github.com/neatstudio)

---

Made with 🐑 for OpenClaw

---

**中文版文档**: [README.zh-CN.md](./README.zh-CN.md)
