/**
 * cgy.js 库 animatecss 扩展
 * 调用 animate.css 库
 */

const animatecss = {};

//cgy 扩展包信息，必须包含
animatecss.module = {
    name: 'animatecss',
    version: '0.1.0',
    cgyVersion: '2.0.0'
}

//初始化方法，必须包含
animatecss.init = cgy => {

    //引入 animate.css，需要 cgy.use(csstools)
    cgy.appendStyleLink('cgy_animate_css', '//lib.cgy.design/animate/@');

    //定义一些工具方法，aniFoobar
    cgy.def({

        

    });
}

export default animatecss;