/**
 * cgy.js 库 settinglang 扩展
 * settinglang 解释器
 * 设置语言解析器，用来解析 db setting json 中的特殊设置的语言结构
 * 
 * 支持的语法：
 *      field字段名          --> rs[字段名]
 *      foo${bar}           --> 'foo'+rs['bar']
 *      cdt?val1:val2       --> 3元判断
 *      function@arg1,arg2  --> stlFunction(arg1,arg2, rs)
 * 
 * 使用方法：
 *      let result = cgy.stl(cmd str, data)
 */

const stl = {};

//cgy 扩展包信息，必须包含
stl.module = {
    name: 'settinglang',
    version: '0.1.0',
    cgyVersion: '2.0.0'
}

//初始化方法，必须包含
stl.init = cgy => { cgy.def( {

    stl: (cmd, data={}) => {
        if (cgy.is.string(cmd) && cmd!='') {
            let cm = cmd.tpl(data);     //替换所有 ${***} %{***}%
            if (!cm.includesAny('@','?')) {
                if (cgy.is.defined(data[cm])) return data[cm];
                return cm;
            }
            //使用三元判断
            if (cm.includesAll('?',':')) {
                let cdt = cm.split('?')[0],
                    cdtrst = cgy.stlCondition(cdt, data),   //此方法必须返回 Boolean
                    ncm = cdtrst===true ? 'true?'+cm.split('?')[1] : 'false?'+cm.split('?')[1];
                return eval(ncm);
            }
            //调用预设解析程序
            if (cm.includes('@')) {
                let cmarr = cm.split('@'),
                    cf = cmarr[0],
                    args = /*cmarr[1].includes(',') ? */cmarr[1].split(',')/* : [ cmarr[1] ]*/,
                    cfn = `stl${cf.ucfirst()}`;
                if (cgy.is(cgy[cfn],'function,asyncfunction')) {
                    args.push(data);
                    return cgy[cfn](...args);
                }
            }
        }
        return cmd;
    },

    //计算一个表达式，返回值为 boolean
    stlCondition(cdt, data={}) {
        let nulls = "'null','false','true','undefined'".split(','),
            nullss = "null,false,true,undefined".split(',');
        for (let i=0;i<nulls.length;i++) {
            if (!cdt.includes(nulls[i])) continue;
            cdt = cdt.replace(nulls[i], nullss[i]);
        }
        return eval(cdt);
    },

} ) }

export default stl;