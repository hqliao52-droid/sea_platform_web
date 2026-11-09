// utils/config.js
// 仅做统一导出，后端地址统一维护在 config/server.config.js
import serverConfig from '../config/server.config.js';

export default {
    baseURL: serverConfig.apiBaseURL,
    wsURL: serverConfig.wsBaseURL,
    timeout: serverConfig.timeout,
};
