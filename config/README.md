# 后端地址配置说明

整个仓库的后端地址只在 **`config/server.config.js`** 中维护，其他文件都从它读取或由脚本同步。

## 唯一配置

```js
const PROTOCOL = 'http';
const HOST = '<服务器 IP 或域名>';
const PORT = 8000;
```

- `apiBaseURL`：HTTP 接口根地址，供 `utils/request.js`、上传、`register` 等使用。
- `wsBaseURL`：WebSocket 根地址，`https` 时自动使用 `wss`。
- `timeout`：请求超时时间。

## 各文件关系

| 文件 | 来源 | 说明 |
| --- | --- | --- |
| `utils/config.js` | 直接 import | 只做默认导出，供页面和请求工具使用 |
| `vue.config.js` | 直接 require | H5 开发代理 `/api` 的 target |
| `manifest.json` | 脚本同步 | 静态 JSONC，HBuilderX 读取，无法 import JS |
| `scripts/sync-server-config.js` | 读取唯一配置 | 只替换 `h5.devServer.proxy` 内的 target |

## 为什么 manifest.json 不能直接 import？

`manifest.json` 是 HBuilderX / uni-app 在启动前读取的静态 JSONC，不是打包进应用的 JS 模块，不能写 `import` 或变量，所以只能由脚本同步。

当前业务请求全部通过 `config.baseURL` 使用绝对地址，`manifest.json` 里的 4 段 H5 代理实际不会被业务代码用到。如果确认不需要 H5 代理，可以删除 `h5.devServer.proxy` 整段，这样 manifest 就完全不包含后端地址，也不再需要同步脚本。

## 更换服务器

1. 修改 `config/server.config.js` 里的 `PROTOCOL` / `HOST` / `PORT`。
2. 同步 `manifest.json`：

   ```bash
   npm run config:sync
   ```

   没有 npm 环境时也可以直接运行：

   ```bash
   node scripts/sync-server-config.js
   ```

3. 检查是否已同步（可用于提交前检查）：

   ```bash
   npm run config:check
   ```

## 注意

- 不要手写 `manifest.json` 的代理地址，它由脚本生成。
- 不要在 `vue.config.js` 或页面里写死服务器地址。
- `manifest.json` 中 4 处代理 target 是脚本生成的结果，运行 `config:sync` 后会保持一致。
- `.env` 已被 `.gitignore` 忽略，不要把服务器地址放到 `.env` 里，否则换机器会丢失。
