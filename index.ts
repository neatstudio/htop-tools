import { execSync } from "node:child_process";
import { createHash, randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";

// ============ 工具函数 ============

/** 执行 shell 命令并返回输出 */
function exec(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 30000 });
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/** MD5 哈希 */
function md5Hash(text: string): string {
  return createHash("md5").update(text).digest("hex");
}

/** SHA256 哈希 */
function sha256Hash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** SHA1 哈希 */
function sha1Hash(text: string): string {
  return createHash("sha1").update(text).digest("hex");
}

/** Base64 编码 */
function base64Encode(text: string): string {
  return Buffer.from(text).toString("base64");
}

/** Base64 解码 */
function base64Decode(text: string): string {
  try {
    return Buffer.from(text, "base64").toString("utf-8");
  } catch {
    return "Error: Invalid base64 string";
  }
}

/** URL 编码 */
function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

/** URL 解码 */
function urlDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return "Error: Invalid URL encoded string";
  }
}

/** 生成随机密码 */
function generatePassword(length: number = 16): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

/** 生成 UUID */
function generateUUID(): string {
  return crypto.randomUUID();
}

/** 简单 AES 加密 */
function aesEncrypt(text: string, password: string): string {
  try {
    const key = scryptSync(password, "salt", 32);
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/** 简单 AES 解密 */
function aesDecrypt(encrypted: string, password: string): string {
  try {
    const [ivHex, encryptedHex] = encrypted.split(":");
    if (!ivHex || !encryptedHex) return "Error: Invalid encrypted format";
    const key = scryptSync(password, "salt", 32);
    const iv = Buffer.from(ivHex, "hex");
    const decipher = createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/** 获取 top 进程 */
function getTopProcesses(limit: number = 10): string {
  // 优先使用 ps，兼容性更好
  const cmd = `ps aux --sort=-%cpu | head -${limit + 1}`;
  return exec(cmd);
}

/** 按内存排序的进程 */
function getTopMemoryProcesses(limit: number = 10): string {
  const cmd = `ps aux --sort=-%mem | head -${limit + 1}`;
  return exec(cmd);
}

/** 获取端口信息 */
function getPorts(): string {
  // 尝试多种方式获取端口信息
  const commands = [
    "ss -tuln",
    "netstat -tuln 2>/dev/null",
    "lsof -i -P -n 2>/dev/null | grep LISTEN"
  ];
  
  for (const cmd of commands) {
    const result = exec(cmd);
    if (!result.startsWith("Error") && result.trim()) {
      return result;
    }
  }
  return "Error: No suitable command found (tried ss, netstat, lsof)";
}

/** 获取磁盘使用情况 */
function getDiskUsage(): string {
  return exec("df -h");
}

/** 获取内存使用情况 */
function getMemoryUsage(): string {
  return exec("free -h");
}

/** 获取系统负载 */
function getLoadAverage(): string {
  return exec("uptime");
}

/** 获取网络连接 */
function getNetworkConnections(): string {
  return exec("ss -s");
}

// ============ 插件主函数 ============

export default function (api: OpenClawPluginApi) {
  const config = api.pluginConfig as { enabled?: boolean; topLimit?: number } | undefined;
  const enabled = config?.enabled !== false;
  const topLimit = config?.topLimit ?? 10;

  if (!enabled) {
    api.logger.info("[htop-tools] Plugin is disabled");
    return;
  }

  // ========== 1. 注册 CLI 命令: openclaw tools ==========
  api.registerCli(
    ({ program }) => {
      const tools = program
        .command("tools")
        .description("系统监控和密码学工具")
        .addHelpText("after", `
Examples:
  $ openclaw tools top              # 查看 CPU 占用最高的进程
  $ openclaw tools mem              # 查看内存占用最高的进程
  $ openclaw tools port             # 查看开放端口
  $ openclaw tools disk             # 查看磁盘使用
  $ openclaw tools memory           # 查看内存使用
  $ openclaw tools load             # 查看系统负载
  $ openclaw tools net              # 查看网络连接统计
  $ openclaw tools md5 "hello"      # 计算 MD5
  $ openclaw tools sha256 "hello"   # 计算 SHA256
  $ openclaw tools base64 "hello"   # Base64 编码
  $ openclaw tools unbase64 "aGVs..." # Base64 解码
  $ openclaw tools urlencode "hello world"  # URL 编码
  $ openclaw tools urldecode "hello%20world" # URL 解码
  $ openclaw tools passwd           # 生成随机密码
  $ openclaw tools uuid             # 生成 UUID
  $ openclaw tools encrypt "text" -p "password"  # AES 加密
  $ openclaw tools decrypt "iv:cipher" -p "password"  # AES 解密
`);

      // ----- 系统监控命令 -----
      tools
        .command("top")
        .description("查看 CPU 占用最高的进程")
        .option("-n, --number <count>", "显示进程数", String(topLimit))
        .action((options: { number?: string }) => {
          const limit = parseInt(options.number || String(topLimit), 10);
          console.log(getTopProcesses(limit));
        });

      tools
        .command("mem")
        .description("查看内存占用最高的进程")
        .option("-n, --number <count>", "显示进程数", String(topLimit))
        .action((options: { number?: string }) => {
          const limit = parseInt(options.number || String(topLimit), 10);
          console.log(getTopMemoryProcesses(limit));
        });

      tools
        .command("port")
        .description("查看所有开放端口")
        .action(() => {
          console.log(getPorts());
        });

      tools
        .command("disk")
        .description("查看磁盘使用情况")
        .action(() => {
          console.log(getDiskUsage());
        });

      tools
        .command("memory")
        .description("查看内存使用情况")
        .action(() => {
          console.log(getMemoryUsage());
        });

      tools
        .command("load")
        .description("查看系统负载")
        .action(() => {
          console.log(getLoadAverage());
        });

      tools
        .command("net")
        .description("查看网络连接统计")
        .action(() => {
          console.log(getNetworkConnections());
        });

      // ----- 密码学/编码命令 -----
      tools
        .command("md5 <text>")
        .description("计算 MD5 哈希")
        .action((text: string) => {
          console.log(md5Hash(text));
        });

      tools
        .command("sha1 <text>")
        .description("计算 SHA1 哈希")
        .action((text: string) => {
          console.log(sha1Hash(text));
        });

      tools
        .command("sha256 <text>")
        .description("计算 SHA256 哈希")
        .action((text: string) => {
          console.log(sha256Hash(text));
        });

      tools
        .command("base64 <text>")
        .description("Base64 编码")
        .action((text: string) => {
          console.log(base64Encode(text));
        });

      tools
        .command("unbase64 <text>")
        .description("Base64 解码")
        .action((text: string) => {
          console.log(base64Decode(text));
        });

      tools
        .command("urlencode <text>")
        .description("URL 编码")
        .action((text: string) => {
          console.log(urlEncode(text));
        });

      tools
        .command("urldecode <text>")
        .description("URL 解码")
        .action((text: string) => {
          console.log(urlDecode(text));
        });

      tools
        .command("passwd")
        .description("生成随机密码")
        .option("-l, --length <len>", "密码长度", "16")
        .action((options: { length?: string }) => {
          const length = parseInt(options.length || "16", 10);
          console.log(generatePassword(length));
        });

      tools
        .command("uuid")
        .description("生成 UUID")
        .action(() => {
          console.log(generateUUID());
        });

      tools
        .command("encrypt <text>")
        .description("AES 加密文本")
        .requiredOption("-p, --password <pwd>", "加密密码")
        .action((text: string, options: { password: string }) => {
          console.log(aesEncrypt(text, options.password));
        });

      tools
        .command("decrypt <text>")
        .description("AES 解密文本")
        .requiredOption("-p, --password <pwd>", "解密密码")
        .action((text: string, options: { password: string }) => {
          console.log(aesDecrypt(text, options.password));
        });
    },
    { commands: ["tools"] }
  );

  // ========== 2. 注册聊天自动回复命令: /tools ==========
  api.registerCommand({
    name: "tools",
    description: "系统工具: /tools top, /tools port, /tools md5 123 等",
    acceptsArgs: true,
    requireAuth: true,
    handler: (ctx) => {
      const args = ctx.args?.trim() || "";
      const parts = args.split(/\s+/);
      const subCmd = parts[0]?.toLowerCase();
      const arg1 = parts[1];
      const rest = parts.slice(2).join(" ");

      if (!subCmd) {
        return {
          text: `🔧 HTOP Tools 使用帮助：

系统监控:
  /tools top [n]     - CPU 占用最高的进程
  /tools mem [n]     - 内存占用最高的进程  
  /tools port        - 查看开放端口
  /tools disk        - 磁盘使用情况
  /tools memory      - 内存使用情况
  /tools load        - 系统负载
  /tools net         - 网络连接统计

哈希/编码:
  /tools md5 <text>       - MD5 哈希
  /tools sha1 <text>      - SHA1 哈希
  /tools sha256 <text>    - SHA256 哈希
  /tools base64 <text>    - Base64 编码
  /tools unbase64 <text>  - Base64 解码
  /tools urlencode <text> - URL 编码
  /tools urldecode <text> - URL 解码

密码工具:
  /tools passwd [len]     - 生成随机密码
  /tools uuid             - 生成 UUID
  /tools encrypt <text> -p <password>  - AES 加密
  /tools decrypt <text> -p <password>  - AES 解密

示例:
  /tools md5 hello
  /tools passwd 20
  /tools top 5`
        };
      }

      let result = "";

      switch (subCmd) {
        // 系统监控
        case "top":
          result = getTopProcesses(parseInt(arg1 || String(topLimit), 10));
          break;
        case "mem":
          result = getTopMemoryProcesses(parseInt(arg1 || String(topLimit), 10));
          break;
        case "port":
          result = getPorts();
          break;
        case "disk":
          result = getDiskUsage();
          break;
        case "memory":
          result = getMemoryUsage();
          break;
        case "load":
          result = getLoadAverage();
          break;
        case "net":
          result = getNetworkConnections();
          break;

        // 哈希
        case "md5":
          if (!arg1) return { text: "❌ 用法: /tools md5 <text>" };
          result = md5Hash(args.slice(subCmd.length).trim());
          break;
        case "sha1":
          if (!arg1) return { text: "❌ 用法: /tools sha1 <text>" };
          result = sha1Hash(args.slice(subCmd.length).trim());
          break;
        case "sha256":
          if (!arg1) return { text: "❌ 用法: /tools sha256 <text>" };
          result = sha256Hash(args.slice(subCmd.length).trim());
          break;

        // 编码
        case "base64":
          if (!arg1) return { text: "❌ 用法: /tools base64 <text>" };
          result = base64Encode(args.slice(subCmd.length).trim());
          break;
        case "unbase64":
          if (!arg1) return { text: "❌ 用法: /tools unbase64 <text>" };
          result = base64Decode(arg1);
          break;
        case "urlencode":
          if (!arg1) return { text: "❌ 用法: /tools urlencode <text>" };
          result = urlEncode(args.slice(subCmd.length).trim());
          break;
        case "urldecode":
          if (!arg1) return { text: "❌ 用法: /tools urldecode <text>" };
          result = urlDecode(arg1);
          break;

        // 密码工具
        case "passwd":
          result = generatePassword(parseInt(arg1 || "16", 10));
          break;
        case "uuid":
          result = generateUUID();
          break;

        // 加密/解密 - 特殊处理密码参数
        case "encrypt": {
          const encryptMatch = args.match(/encrypt\s+(.+?)\s+-p\s+(.+)/);
          if (!encryptMatch) {
            return { text: "❌ 用法: /tools encrypt <text> -p <password>" };
          }
          result = aesEncrypt(encryptMatch[1], encryptMatch[2]);
          break;
        }
        case "decrypt": {
          const decryptMatch = args.match(/decrypt\s+(.+?)\s+-p\s+(.+)/);
          if (!decryptMatch) {
            return { text: "❌ 用法: /tools decrypt <text> -p <password>" };
          }
          result = aesDecrypt(decryptMatch[1], decryptMatch[2]);
          break;
        }

        default:
          return { text: `❌ 未知命令: ${subCmd}\n输入 /tools 查看帮助` };
      }

      // 截断过长的输出
      const maxLen = 2000;
      if (result.length > maxLen) {
        result = result.slice(0, maxLen) + "\n... (已截断)";
      }

      return { text: "```\n" + result + "\n```" };
    }
  });

  // ========== 3. 注册 Agent Tool（AI 可调用）==========
  api.registerTool({
    name: "system_tools",
    label: "System Tools",
    description: "执行系统监控和密码学操作：top、port、md5、sha256、base64等",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          enum: ["top", "mem", "port", "disk", "memory", "load", "net", 
                 "md5", "sha1", "sha256", "base64", "unbase64", 
                 "urlencode", "urldecode", "passwd", "uuid"],
          description: "要执行的命令"
        },
        input: {
          type: "string",
          description: "输入文本（用于哈希/编码命令）"
        },
        limit: {
          type: "integer",
          description: "进程数量限制（用于 top/mem）",
          default: 10
        },
        password: {
          type: "string",
          description: "密码（用于 encrypt/decrypt）"
        }
      },
      required: ["command"]
    },
    async execute(_id, params) {
      const { command, input, limit, password } = params as {
        command: string;
        input?: string;
        limit?: number;
        password?: string;
      };

      let result = "";

      switch (command) {
        case "top":
          result = getTopProcesses(limit || topLimit);
          break;
        case "mem":
          result = getTopMemoryProcesses(limit || topLimit);
          break;
        case "port":
          result = getPorts();
          break;
        case "disk":
          result = getDiskUsage();
          break;
        case "memory":
          result = getMemoryUsage();
          break;
        case "load":
          result = getLoadAverage();
          break;
        case "net":
          result = getNetworkConnections();
          break;
        case "md5":
          result = input ? md5Hash(input) : "Error: input required";
          break;
        case "sha1":
          result = input ? sha1Hash(input) : "Error: input required";
          break;
        case "sha256":
          result = input ? sha256Hash(input) : "Error: input required";
          break;
        case "base64":
          result = input ? base64Encode(input) : "Error: input required";
          break;
        case "unbase64":
          result = input ? base64Decode(input) : "Error: input required";
          break;
        case "urlencode":
          result = input ? urlEncode(input) : "Error: input required";
          break;
        case "urldecode":
          result = input ? urlDecode(input) : "Error: input required";
          break;
        case "passwd":
          result = generatePassword(limit || 16);
          break;
        case "uuid":
          result = generateUUID();
          break;
        default:
          result = `Unknown command: ${command}`;
      }

      return {
        content: [{ type: "text" as const, text: result }]
      };
    }
  });

  api.logger.info("[htop-tools] Plugin loaded successfully");
}
