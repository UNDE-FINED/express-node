const utils = require('./utils')
const getConfig = require('./config').getConfig
const isProduction;

// 获取环境变量
var env = utils.getEnv()

var sourceMap = getConfig(env).sourceMap

isProduction = utils.getEnv() !== 'local'

module.exports = {
    loaders: utils.cssLoaders({
        sourceMap: sourceMap,
        extract: isProduction
    }),
    preserveWhiteSpace: false
}