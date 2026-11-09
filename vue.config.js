// vue.config.js（放在项目根目录，和 manifest.json 同级）
module.exports = {
    devServer: {
        proxy: {
            "/api": {
                target: "http://43.136.130.244:8000",  // 后端真实地址
                changeOrigin: true,                     // 关键：欺骗服务器请求来自它自己
                pathRewrite: { "^/api": "" },           // /api/user/login → /user/login
            },
        },
    },
};