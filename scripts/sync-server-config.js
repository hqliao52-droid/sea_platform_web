#!/usr/bin/env node
/**
 * 将 config/server.config.js 中的后端地址同步到 manifest.json 的 h5.devServer.proxy。
 *
 * manifest.json 是 HBuilderX / uni-app 读取的静态 JSON（带注释），无法 import JS，
 * 所以用这个脚本生成其中的代理地址，保证全仓库只有一个地址来源。
 *
 * 用法：
 *   node scripts/sync-server-config.js          # 写入 manifest.json
 *   node scripts/sync-server-config.js --check  # 只检查，不一致时退出码为 1
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');
const serverConfig = require(path.join(ROOT, 'config', 'server.config.js'));

const TARGET_PATTERN = /("target"\s*:\s*")https?:\/\/[^"]*(")/g;

/**
 * 在 JSONC 文本中查找某个 key 对应对象的起止位置。
 * 会跳过字符串、行注释和块注释，避免注释里的括号干扰匹配。
 */
function findObjectBlock(source, key, fromIndex = 0) {
    const keyIndex = source.indexOf(`"${key}"`, fromIndex);
    if (keyIndex === -1) return null;

    const openIndex = source.indexOf('{', keyIndex);
    if (openIndex === -1) return null;

    let depth = 0;
    let inString = false;
    let quote = '';
    let inLineComment = false;
    let inBlockComment = false;

    for (let i = openIndex; i < source.length; i += 1) {
        const char = source[i];
        const next = source[i + 1];

        if (inLineComment) {
            if (char === '\n') inLineComment = false;
            continue;
        }
        if (inBlockComment) {
            if (char === '*' && next === '/') {
                inBlockComment = false;
                i += 1;
            }
            continue;
        }
        if (inString) {
            if (char === '\\') {
                i += 1;
            } else if (char === quote) {
                inString = false;
            }
            continue;
        }

        if (char === '"' || char === "'") {
            inString = true;
            quote = char;
            continue;
        }
        if (char === '/' && next === '/') {
            inLineComment = true;
            i += 1;
            continue;
        }
        if (char === '/' && next === '*') {
            inBlockComment = true;
            i += 1;
            continue;
        }

        if (char === '{') depth += 1;
        if (char === '}') {
            depth -= 1;
            if (depth === 0) return { start: openIndex, end: i };
        }
    }

    return null;
}

/**
 * 只替换 h5.devServer.proxy 块内的 target，避免误改 manifest 其他位置的 target。
 */
function replaceProxyTargets(source, apiBaseURL) {
    const h5Index = source.indexOf('"h5"');
    const devServerIndex = source.indexOf('"devServer"', Math.max(h5Index, 0));
    const proxyIndex = source.indexOf('"proxy"', Math.max(devServerIndex, 0));

    if (h5Index === -1 || devServerIndex === -1 || proxyIndex === -1) {
        throw new Error('未找到 manifest.json 中的 h5.devServer.proxy 配置');
    }

    const block = findObjectBlock(source, 'proxy', proxyIndex);
    if (!block) {
        throw new Error('无法定位 manifest.json 中 h5.devServer.proxy 的对象范围');
    }

    const before = source.slice(0, block.start);
    const body = source.slice(block.start, block.end + 1);
    const after = source.slice(block.end + 1);

    let replaced = 0;
    const nextBody = body.replace(TARGET_PATTERN, (match, prefix, suffix) => {
        replaced += 1;
        return `${prefix}${apiBaseURL}${suffix}`;
    });

    return {
        content: before + nextBody + after,
        replaced,
    };
}

function main() {
    const checkOnly = process.argv.includes('--check');
    const source = fs.readFileSync(MANIFEST_PATH, 'utf8');

    let result;
    try {
        result = replaceProxyTargets(source, serverConfig.apiBaseURL);
    } catch (error) {
        console.error(`[server-config] ${error.message}`);
        process.exitCode = 1;
        return;
    }

    const changed = result.content !== source;

    console.log(`[server-config] 唯一配置中的后端地址：${serverConfig.apiBaseURL}`);
    console.log(`[server-config] manifest.json 代理 target：${result.replaced} 处`);

    if (result.replaced === 0) {
        console.error('[server-config] 未在 h5.devServer.proxy 中找到 target，请检查 manifest.json。');
        process.exitCode = 1;
        return;
    }

    if (checkOnly) {
        if (changed) {
            console.error('[server-config] manifest.json 与 config/server.config.js 不一致，请运行：npm run config:sync');
            process.exitCode = 1;
            return;
        }
        console.log('[server-config] 检查通过，manifest.json 已是最新。');
        return;
    }

    if (!changed) {
        console.log('[server-config] 无需修改，manifest.json 已是最新。');
        return;
    }

    fs.writeFileSync(MANIFEST_PATH, result.content, 'utf8');
    console.log('[server-config] 已更新 manifest.json。');
}

module.exports = {
    findObjectBlock,
    replaceProxyTargets,
};

if (require.main === module) {
    main();
}
