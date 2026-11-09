// vue.config.js（放在项目根目录，和 manifest.json 同级）
// 后端地址统一来自 config/server.config.js，不要在代理里写死
const serverConfig = require('./config/server.config.js');

module.exports = {
    devServer: {
        proxy: {
            "/api": {
                target: serverConfig.apiBaseURL,        // 后端真实地址
                changeOrigin: true,                     // 关键：欺骗服务器请求来自它自己
                pathRewrite: { "^/api": "" },           // /api/user/login → /user/login
            },
        },
    },
};
