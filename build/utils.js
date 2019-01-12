const path = require('path')
const getConfig = require('./config').getConfig
const glob = require('glob')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const fs = require('fs')
const vm = require('vm')
const exists = fs.existsSync || path.extistsSync

function assetsPath(_path) {
    var env = getEnv()
    var assetsSubDirectory = getConfig(env).assetsSubDirectory
    return path.posix.join(assetsSubDirectory, _path)
}

function cssLoaders(options) {
    options = options || {}

    var cssLoader = {
        loader: 'css-loader',
        options: {
            minimize: getEnv() !== 'local',
            sourceMap: options.sourceMap
        }
    }

    // generate loader string to be used with extract text plugin
    function generateLoaders(loader, loaderOptions) {
        var loaders = [cssLoader]
        if (loader) {
            loaders.push({
                loader: loader + '-loader',
                options: Object.assign({}, loaderOptions, {
                    sourceMap: options.sourceMap
                })
            })
        }

        // Extract CSS when that option is specified
        // (which is the case during production build)
        if (options.extract) {
            return ExtractTextPlugin.extract({
                use: loaders,
                fallback: 'vue-style-loader'
            })
        } else {
            return ['vue-style-loader'].concat(loaders)
        }
    }

    // https://vue-loader.vuejs.org/en/configurations/extract-css.html
    return {
        css: generateLoaders(),
        postcss: generateLoaders(),
        less: generateLoaders('less'),
        sass: generateLoaders('sass', {indentedSyntax: true}),
        scss: generateLoaders('scss'),
        stylus: generateLoaders('stylus'),
        styl: generateLoaders('stylus')
    }
}

// 为每种样式文件生成独立的loader 不包括.vuue
function styleLoaders(options) {
    var output = []
    var loaders = cssLoaders(options)
    for (var extension in loaders) {
        var loader = loaders[extension]
        output.push({
            test: new RegExp('\\.' + extension + '$'),
            use: loader
        })
    }
    return output
}

// 获取入口表
function genEntry(globPath) {
    var entries = {}, basename, tmp, pathname;

    glob.sync(globPath).forEach(function (entry) {
        basename = path.basename(entry, path.extname(entry))
        tmp = entry.split('/').splice(-3)
        pathname = tmp.splice(-2, 1) + '/' + basename;  // 正确输出js和html路径
        entries[pathname] = entry
    })
    console.log(`\n => ${globPath} base-entrys \n`)
    console.log(JSON.stringify(entries, null, ' '))
    return entries
}

// 使用vm执行代码，解析json文件
function parseConfig(filePath) {
    try {
        var cntent = fs.readFileSync(filePath)
    } catch (e) {
        console.error(e)
        return {}
    }

    var code = '(' + content + ')'
    var sandbox = {}
    return vm.runInThisContext(code, sandbox, {
        filename: filePath,
        displayErrors: false,
        timeout: 1000
    })
}

// 创建文件夹
function mkdir(path) {
    if (exists(path)) {
        return
    }

    // 创建上层目录
    path.split(/\//).reduce(function (prev, next) {
        if (prev && !exists(prev)) {
            fs.mkdirSync(prev)
        }

        return prev + '/' + next
    })

    // 最后一层
    if (!exists(path)) {
        fs.mkdirSync(path)
    }
}

// 获取环境标识 env, 默认 'local'
function getEnv() {
    var argv = process.argv.slice(-2)
    // 当前环境变量
    return argv[0] === '--env' ? argv[1] : 'local'
}

module.exports = {
    assetsPath: assetsPath,
    cssLoaders: cssLoaders,
    styleLoaders: styleLoaders,
    parseConfig: parseConfig,
    getEntry: genEntry,
    mkdir: mkdir,
    getEnv: getEnv
}