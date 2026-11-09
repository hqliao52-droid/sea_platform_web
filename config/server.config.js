/**
 * 后端服务地址的唯一配置来源（Single Source of Truth）
 *
 * 所有需要后端地址的地方都从这里读取：
 *   - utils/config.js   → 请求、上传、WebSocket
 *   - vue.config.js     → H5 开发代理
 *   - manifest.json     → H5 开发代理（静态 JSON，无法 import，需运行脚本同步）
 *
 * 更换服务器时只改下面的 PROTOCOL / HOST / PORT，然后执行：
 *   npm run config:sync
 */
const PROTOCOL = 'http';
const HOST = '47.108.169.91';
const PORT = 8000;

// 端口为 80 / 443 时可以留空，写成 PORT = ''
const PORT_SUFFIX = PORT ? `:${PORT}` : '';
const ORIGIN = `${PROTOCOL}://${HOST}${PORT_SUFFIX}`;

module.exports = {
    protocol: PROTOCOL,
    host: HOST,
    port: PORT,

    /** HTTP 接口根地址，例如 http://<host>:<port> */
    apiBaseURL: ORIGIN,

    /** WebSocket 根地址；协议随 PROTOCOL 自动切换（https → wss） */
    wsBaseURL: `${PROTOCOL === 'https' ? 'wss' : 'ws'}://${HOST}${PORT_SUFFIX}`,

    /** 请求超时时间（毫秒） */
    timeout: 60000,
};
