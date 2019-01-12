const path = require('path')
const webpack = require('webpack')
const glob = require('glob')
const utils = require('./utils')
const commonConfig = require('./config').getConfig('common')
const vueLoaderConfig = require('./vue-loader.conf')
// const webpackMd5Hash = require('webpack-md5-hash')

module.exports = {
    entry: Object.assign(utils.getEntry(`${commonConfig.resourcePath}/page/*/index.js`), {
        'project': `${commonConfig.resourcePath}/global/index.js`
    }),
    externals: {
        // 'echarts': 'echarts'
    },
    resolve: {
        // 配置别名，在项目中可缩减引用路径
        extensions: ['.js', '.vue', '.json'],
        alias: {
            // assets: join(commonConfig.resourcePath, '/assets'),  TODO公共图片等资源考虑是否单独提出来
            'components': path.join(commonConfig.resourcePath, '/components'),
            // 'root': path.join(__dirname, 'node_modules'),
            'vue$': 'vue/dist/vue.esm.js',
            '@': commonConfig.resourcePath
        }
    },
    module: {
        // webpack2.0中module.loaders改为module.rules
        // 旧的loader配置被更强大的rules系统取代，后者允许配置loader以及其他更多项。
        rules: [
            // eslint TODO
            {
                test: /\.(js|vue)$/,
                loader: 'eslint-loader',
                enforce: "pre",
                include: [commonConfig.resourcePath],
                options: {
                    formatter: require('eslint-friendly-formatter')
                }
            },
            {
                test: /\.(less|vue)$/,
                loader: '@zbj/vue-mixin-loader',
                enforce: "pre",
                options: {
                    mixinPath: path.join(commonConfig.resourcePath, './global/css/mixin/mixin.less')
                }
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: vueLoaderConfig
            },
            {
                test: /\.js$/,
                loader: 'babel-loader',
                include: [commonConfig.resourcePath]
            },
            // url-loader工作流与file-loader相似，如果文件小于字节限制，则可以返回数据URL（列如图片会编译成功base64）
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 100,
                    name: utils.assetsPath('[name].[hash:8].[ext]')
                }
            }
        ]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            minChunks: function (module, count) {
                // 提取node_modules中的modules到vendor.js
                return (
                    module.resource && /\.js$/.test(module.resource) && module.resource.indexOf(path.join(__dirname, '../node_modules') === 0)
                )
            }
        }),
        // 将webpack运行时和模块清单提取到自己的文件中，防止在更新业务代码时更新hash
        new webpack.optimize.CommonsChunkPlugin({
            name: 'manifest',
            chunks: ['vendor']
        }),
        // 用md5代替标准webpack chunk的插件。解决没有修改init.js但是重新生成新的init.js的问题
        // 不建议使用，即使没有修改init.js，生成的init.js内容也可能不同，采用该组件，会导致时间戳会应为修改init.js而不更新，最终导致用户缓存了错误的init.js
        // new webackMd5Hash()
        function () {
            // 用于生成webpackMap
            this.plugin('done', function (map) {
                var webpackMap = {}

                // 调用webpack map toJson生成jsonMap
                map = map.toJSON()

                Object.keys(map.entrypoints).forEach(function (item) {

                    // 如果入口路径不包含/则不输出，例如 入口 name == ‘project’
                    if (item.indexOf('/') < 0) {
                        return
                    }
                    // 页面名
                    var pageName= item.split('/')[0]

                    webpackMap[pageName] = {}
                    webpackMap[pageName].js = []
                    webpackMap[pageName].css = []

                    // webpack资源 映射 处理
                    [].concat(map.assetsByChunkName['manifest']).forEach(mapAsset)

                    // 公共资源 映射 处理
                    [].concat(map.assetsByChunkName['vendor']).forEach(mapAsset)

                    // 项目公共资源 映射 处理
                    [].concat(map.assetsByChunkName['project']).forEach(mapAsset)

                    // 页面级别资源 映射 处理
                    [].concat(map.assetsByChunkName[item]).forEach(mapAsset)

                    // 根据资源类型，将其映射（map）到对应的数组中
                    function mapAsset(assetsPath) {
                        if (path.extname(assetsPath) === '.js') {
                            // 绝对路径 = publicPath + assetsPath
                            webpackMap[pageName].js.push(map.publicPath + assetsPath)
                        } else if (path.extname(assetsPath) === '.css') {
                            webpackMap[pageName].css.push(map.publicPath + assetsPath)
                        }
                    }
                })

                utils.mkdir(path.join(__dirname, '../node_modules/.ua-resource.map'))

                // webpackMap写入config.json
                require('fs').writeFileSync(
                    path.join(__dirname, '../node_modules/.ua-resource.map', 'resource.map.json'),
                    JSON.stringify(webpackMap, null, '      ')
                )

                // TODO暂时测试使用
                require('fs').writeFileSync(
                    path.join(__dirname, '../node_modules/.ua-resource.map', 'webpack.map.json'),
                    JSON.stringify(map, null, ' ')
                )
            })
        }
    ]
}