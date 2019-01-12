// see http://vuejs-templates.github.io/webpack for documentation.
const path = require('path')
const ip = require('ip')

const env = process.argv.slice(-2)
// 获取当前环境变量
env = env[0] === '--env' ? env[1] : 'local'

var staticLibURI;
switch (env) {
    case 'product':
        staticLibURI = '//as.zbjimg.com'
        break
    case 'local':
        staticLibURI = `//${ip.address()}:8888`
        break
    default:
        staticLibURI = `//as.${env}.zbjdev.com`
}

var config = {
    common: {
        resourcePath: path.join(__dirname, '../../app/resource'),
        env: {
            NODE_ENV: '"production"'
        },
        assetSubDirectory: 'static',
        assetsPublicPath: staticLibURI + '/static/express-node/',
        outPath: path.join(__dirname, '../../node_modules/.ua-release-webroot/static/express-node/'),
        sourceMap: true
    },
    product: {
        sourceMap: false
    },
    el: {
        env: {
            NODE_ENV: '"development"'
        }
    },
    dev: {
        env: {
            NODE_ENV: '"development"'
        }
    },
    local: {
        env: {
            NODE_ENV: '"development"'
        },
        assetsPublicPath: staticLibURI + '/static/express-node/',   // 为了支持webpack热加载，必须是全路径
        outPath: path.join(__dirname, '../../dist'),
        sourceMap: false
    }
}

// 获取项目配置
module.exports.getConfig = function (env) {
    return Object.assign(config.common, config[env])
}