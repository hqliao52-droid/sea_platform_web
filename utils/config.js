// utils/config.js
const isProd = process.env.NODE_ENV === "production";

const BASE_URL = isProd
    ? "http://43.136.130.244:8000"  // 生产环境：直接用真实地址（需后端配置跨域）
    : "http://43.136.130.244:8000";                        // 开发环境：走本地代理，绕过 CORS

const BASE_HOST = "43.136.130.244:8000";

export default {
    baseURL: BASE_URL,
    wsURL: `ws://${BASE_HOST}`,
    timeout: 60000,
};