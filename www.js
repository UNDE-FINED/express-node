/**
 * 项目启动入口，业务代码无需修改
 */
'use strict'

require('@zbj/utopiajs')

const path = require('path');

UA.init({
    appDir: __dirname
}).catch(e => {
    console.error(e)
})