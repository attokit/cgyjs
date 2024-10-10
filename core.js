/**
 * cgy 通用 js 库
 * 提供 类型判断，原型扩展，proxy工具，正则工具
 * 
 * 支持扩展包
 * 扩展包必须为以下格式
 *  module = {
 *      module: {
 *          name: '扩展包名称',
 *          version: '1.0.0',
 *          cgyVersion: '2.0.0'
 *      },
 * 
 *      init: (cgy) => {
 *          必须包含一个初始化方法，此方法传入一个参数，是 cgy 对象的引用
 *      }
 *  }
 */

const cgy = Object.create(null);

//类型判断
Reflect.defineProperty(cgy, 'is', {
    value: new Proxy(
        (anything, type) => {
            let mytype = Object.prototype.toString.call(anything).slice(8,-1).toLowerCase();
            if(mytype=='object'){
                if(anything instanceof Set){
                    mytype = 'set';
                }else if(anything instanceof Map){
                    mytype = 'map';
                }else if(anything === null){
                    mytype = 'null';
                }
            }/*else if(mytype.includes('html')){
                if(mytype.includes('element')){
                    if(typeof type == 'undefined'){
                        return mytype.replace('html','').replace('element','');
                    }
                    mytype = 'htmlelement';
                }
            }*/
            if(typeof type == 'undefined') return mytype;
            if(typeof type != 'string') type = cgy.is(type);    //return false;
            type = type.toLowerCase();
            if (type.includes(',')) {
                let types = type.split(',');
                return types.includes(mytype);
            }
            return (type === 'null' && anything === null) || (type === 'number' && !isNaN(parseInt(anything))/*anything!==null && anything!='' && isFinite(anything)*/) || mytype === type;
        },{
            get(target, prop, receiver) {
                let props = {
                    types: ['undefined','null','object','array','function','asyncfunction','boolean','string','number','symbol','set','map'/*,'nodelist','htmlelement','htmldocument','window','screen'*/],
                    nonObjectTypes: ['boolean','string','number','symbol'],
                    emptyObjectTypes: ['undefined','null'],
                    eachTypes: ['array','object','set','map','string'/*,'nodelist'*/],
                    defined: anything => !cgy.is(anything, 'undefined'),
                    plainObject: anything => cgy.is(anything,'object'),
                    nonObject: anything => cgy.is.nonObjectTypes.includes(cgy.is(anything)),
                    //emptyObject: anything => cgy.is.emptyObjectTypes.includes(cgy.is(anything)),
                    noeo: anything => cgy.is.nonObject(anything) || cgy.is.emptyObject(anything),
                    empty: anything => {
                        const type = cgy.is(anything);
                        switch(type){
                            case 'undefined' :
                            case 'null' :
                                return true;
                                //break;
                            case 'array' :
                                return anything.length<=0;
                                //break;
                            case 'string' :
                                return anything=='';
                                //break;
                            case 'number' :
                                return isNaN(anything);
                                //break;
                            case 'object' :
                                return Object.keys(anything).length<=0;
                                //break;
                            case 'set' :
                            case 'map' :
                                return anything.size<=0;
                            default :
                                return false;
                                //break;
                        }
                    },
                    nonEmptyObject: anything => cgy.is.plainObject(anything) && !cgy.is.empty(anything),
                    eachable: anything => cgy.is.eachTypes.includes(cgy.is(anything)),
                    realNumber: anything => !isNaN(parseInt(anything)),     //anything!=null && anything!='' && isFinite(anything),
                    integer: anything => isFinite(anything) && (parseInt(anything)==anything*1),
                    float: anything => isFinite(anything) && (parseInt(anything)!=anything*1),
                    json: anything => {
                        if (!cgy.is.string(anything)) return false;
                        try {
                            JSON.parse(anything);
                            return true;
                        } catch(e) {
                            return false;
                        }
                    },
                    datetimeString: anything => {
                        if (!cgy.is.string(anything) || anything=='') return false;
                        let d = new Date(anything);
                        if (!d instanceof Date) return false;
                        return !isNaN(d.getTime());
                    },
                    instance: (anything, cls) => anything instanceof cls,
                    elm: anything => anything instanceof HTMLElement,
                    vue: anything => !cgy.is.empty(anything) && ((cgy.is.defined(Vue) && cgy.is.instance(anything, Vue)) || (cgy.is.defined(anything._isVue) && anything._isVue==true)),
                    equal: (any1, any2) => cgy.is(any1)==cgy.is(any2),
                };
    
                if (Object.keys(props).includes(prop)) return props[prop];
                if (props.types.includes(prop)) {
                    return anything => target(anything, prop);
                }
    
            }
        }
    )
});

//def方法   添加不可枚举、修改配置的 property
Reflect.defineProperty(cgy, 'def', {
    value: function(...args) {
        let target = cgy,
            desc = {};
        if (args.length <= 0) return target;
        if (args.length == 1) {
            desc = args[0];
        } else if (args.length == 2) {
            if (typeof args[0] == 'string') {
                desc[args[0]] = args[1];
            } else {
                target = args[0];
                desc = args[1];
            }
        } else {
            target = args[0];
            if (typeof args[1] == 'string') {
                desc[args[1]] = args[2];
            } else {
                desc = args[1];
            }
        }
        let descriptor = Object.create(null);
        for (let [key, value] of Object.entries(desc)) {
            if (!cgy.is(target[key],'undefined') && target[key] === value) {
                //console.log(target[key] === value);
                //console.error(`cgy.def error! property ${key} is already defined in`, target.name || target);
                continue;
            }
            if (cgy.is(value, 'object') && !cgy.is(value.value, 'undefined')) {
                descriptor = value;
            } else {
                descriptor.value = value;
            }
            Reflect.defineProperty(target, key, descriptor);
            descriptor = Object.create(null);
        }
        return target;
    }
});

//prototype 扩展
cgy.def(String.prototype, {
    trimAnyStart(any) {
        let str = this;
        if(cgy.is(any,'string') && any!='' && str.includes(any)){
            let strarr = str.split(any);
            if(strarr[0]==''){
                strarr.shift();
                str = strarr.join(any);
            }
        }
        return str;
    },
    trimAnyEnd(any) {
        let str = this;
        if(cgy.is(any,'string') && any!='' && str.includes(any)){
            let strarr = str.split(any);
            if(strarr[strarr.length-1]==''){
                strarr.pop();
                str = strarr.join(any);
            }
        }
        return str;
    },
    trimAny(any) {
        return this.trimAnyStart(any).trimAnyEnd(any);
    },
    //includes方法扩展
    includesAny(...strs) {
        let flag = false;
        for (let str of strs) {
            if (this.includes(str)) {
                flag = true;
                break;
            }
        }
        return flag;
    },
    includesAll(...strs) {
        let flag = true;
        for (let str of strs) {
            if (!this.includes(str)) {
                flag = false;
                break;
            }
        }
        return flag;
    },
    ucfirst(){
        let str = this.toLowerCase();
        str = str.replace(/\b\w+\b/g, function(word){
            return word.substring(0,1).toUpperCase()+word.substring(1);
        });
        return str;
    },
    //foo-bar-jaz  -->  fooBarJaz
    //foo/bar/jaz  -->  fooBarJaz
    //first==true 则首字母也大写，否则首字母小写
    toCamelCase(first=false) {
        let arr = this.replace(/\_|\//g,'-').split('-'),
            narr = [];
        for (let i=0; i<arr.length; i++) {
            if (i==0) {
                narr.push(first?arr[i].ucfirst():arr[i]);
            } else {
                narr.push(arr[i].ucfirst());
            }
        }
        return narr.join('');
    },
    //fooBarJaz  -->  foo-bar-jaz
    toSnakeCase(split='-') {
        let str = this,
            reg = /[A-Z]{1}/g,
            ms = str.matchAll(reg),
            ma = [...ms],
            arr = [];
        if (ma.length<=0) return str;
        for (let i=0;i<ma.length;i++) {
            let s = ma[i].index,
                e = i>=ma.length-1 ? 0 : ma[i+1].index;
            if (i==0 && s>0) arr.push(str.substring(0, s));
            arr.push(e==0 ? str.substring(s) : str.substring(s,e));
        }
        //console.log(ma);console.log(arr);
        return arr.join(split).toLowerCase();
    },
    //如果是数字形式字符串，则转为数字，否则返回字符串本身
    num(){
        if(isFinite(this)) return this*1;
        return this;
    },
    //正则验证
    regtest(reg) {
        return cgy.reg(reg).test(this);
    },
    //字符串模板
    tpl(data={}, regx=null, sign=null) {
        let regxs = [   //预定义的正则匹配模式
            ['\\%\\{[^\\}\\%]+\\}\\%', ['%{','}%']],    // %{a.b.c}%
            ['\\$\\{[^\\}]+\\}', ['${','}']],          // ${a.b.c}
        ];
        let s = this;

        if (cgy.is.null(regx)) {
            let idx = s.includes('%{') ? 0 : 1;
            regx = regxs[idx][0];
            sign = regxs[idx][1];
        } else if (cgy.is.number(regx)) {
            regx = cgy.is.defined(regxs[regx]) ? regx : 1;
            sign = regxs[regx][1];
            regx = regxs[regx][0];
        } 
        regx = new RegExp(regx, 'g');

        return s.replace(regx, (si) => {
            //console.log(si);
            si = si.replace(sign[0], '');
            si = si.replace(sign[1], '');
            if (cgy.is.number(si)) {
                si = si*1;
                return cgy.is.defined(data[si]) ? data[si] : 'null';
            } else {
                si = si.replace(/\//g, '.');
                //return cgy._.get(data, si, 'null');
                return cgy.loget(data, si, 'null');
            }
        });
    }
});
cgy.def(Array.prototype, {
    //clone
    clone(){
        let me = this;
        return Array.of(...me);
    },
    //去重
    unique(){
        let me = this;
        return [...new Set(me)];
        //return Array.from(new Set(me));
    },
    //从数组中删除
    trim(...totrim){
        //console.log(totrim);
        let me = this;
        return [...me].filter(x => !totrim.includes(x));
    },
    item(xpath = '', val){
        let utils = u();
        let me = this;
        return cgy.item(me,xpath,val);
    },
    //交集
    inter(arr=[]) {
        return this.clone().filter(i=>arr.includes(i));
    },
    //差集，this[] - arr[]，从 this 中减去 arr
    minus(arr=[]) {
        return this.clone().filter(i=>!arr.includes(i));
    },
    //并集
    union(arr=[]) {
        let a = this.clone();
        a.push(...arr);
        return a.unique();
    }
});
cgy.def(Date.prototype, {
    format(format='YYYY-MM-dd') {
        /**
         * eg:format="YYYY-MM-dd hh:mm:ss";
         */
        var o = {
            "M+" :this.getMonth() + 1, // month
            "d+" :this.getDate(), // day
            "h+" :this.getHours(), // hour
            "m+" :this.getMinutes(), // minute
            "s+" :this.getSeconds(), // second
            "q+" :Math.floor((this.getMonth() + 3) / 3), // quarter
            "S"  :this.getMilliseconds()
        // millisecond
        }
        if (/(Y+)/.test(format)) {
            format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    },
    /**
     * get unix timestamp
     */
    unixTimestamp() {
        let t = this.getTime(),
            ot = Math.round(t/1000);
        return ot;
    },
    //获取 星期几
    week() {
        let w = this.getDay(),
            ws = '日,一,二,三,四,五,六'.split(',');
        return ws[w];
    },
    //获取本月 第一天，最后一天 日期，数组
    monthFirstLastDate() {
        let y = this.getFullYear(),
            m = this.getMonth(),
            d = new Date(y,m+1,0).getDate();
        return [new Date(y,m,1), new Date(y,m,d)];
    },
    //获取本周 周日，周六 日期，数组 [周日00:00:00, 周六23:59:59]
    //startWith==0 表示每周从周日开始，==1 表示每周从周一开始，默认从周日开始
    weekFirstLastDate(startWith=0) {
        let ds = this.format()+' 00:00:00';
        let day = this.getDay(),
            ts = new Date(ds).getTime(),
            td = 24*60*60*1000;
        if (startWith>0) {
            //每周从周一开始
            day = day<=0 ? 7 : day-1;
        }
        let tof = day*td,
            toe = (6-day)*td,
            tf = ts-tof,
            te = ts+toe+(td-1000);
        return [new Date(tf), new Date(te)];
    },
    //获取今年是否闰年，
    isLeapYear() {
        let y = this.getFullYear()*1;
        return (y%4==0 && y%100!=0) ||  //能被 4 整除，但不能被 100 整除
            (y%400==0 && y%3200!=0) ||  //能被 400 整除，但不能被 3200 整除
            (y>3200 && y%3200==0 && y%172800==0);   //数值较大的年份
            //...仍有规则，但是因数值较大，省略
    },
    //获取当月天数
    monthDays() {
        let big = [1,3,5,7,8,10,12],
            small = [4,6,9,11],
            m = this.getMonth()+1;
        if (big.includes(m)) return 31;
        if (small.includes(m)) return 30;
        return this.isLeapYear() ? 29 : 28;
    },
    //判断当前日期是否 今天
    isToday() {
        let td = cgy.date.new();
        return this.format('YYYY-MM-dd') == td.format('YYYY-MM-dd');
    },
    //计算当前日期对象的 0 点 和 23.59.59 的 timestamp 返回 [ start-timestamp, end-timestamp]
    unixTimestampStartEndOfDay() {
        let y = this.getFullYear(),
            m = this.getMonth()+1,
            d = this.getDate(),
            ds = [
                `${y}-${m}-${d} 00:00:00`,
                `${y}-${m}-${d} 23:59:59`,
            ];
        return ds.map(i=>cgy.date.new(i).unixTimestamp());
    },
    //判断 unixTimestamp 是否在 timestart 和 timeend 之间，timestart 00:00:00 ~ timeend 23:59:59 之间，包含起止时间
    between(timestart, timeend) {
        let ct = this.unixTimestamp(),
            cd = cgy.date,
            legal = n => /*cd.isTimestamp(n) && */cd.isUnixTimestamp(n),
            isdstr = cd.isDateString,
            isdate = d => cgy.is.instance(d, Date),
            timetostr = cd.timestampToDateString,
            strtotime = cd.dateStringToTimestamp;
        if (isdstr(timestart) && isdstr(timeend)) {
            //起止时间参数是 日期字符串
            timestart = strtotime(timestart);
            timeend = strtotime(timeend);
        } else if (isdate(timestart) && isdate(timeend)) {
            timestart = timestart.unixTimestamp();
            timeend = timeend.unixTimestamp();
        }

        if (legal(timestart) && legal(timeend)) {
            //起止时间参数是 unixTimestamp 数字
            let ts = strtotime(timetostr(timestart, 'YYYY-MM-dd')+' 00:00:00'),
                te = strtotime(timetostr(timeend, 'YYYY-MM-dd')+' 23:59:59');
            return ct>=ts && ct<=te;
        }
        return false;
    },
    //增加/减少 秒数
    mod(seconds) {
        if (!cgy.is.realNumber(seconds)) return this;
        let ct = this.unixTimestamp();
        ct += seconds;
        return cgy.date.new(ct);
    },

});

//cgy base properties
cgy.def({
    version: '2.2.1',
    //引用的扩展包 集合
    modules: {},
});

//核心工具方法
cgy.def({
    //使用自定义值覆盖默认值，用于 set config
    conf(target, options={}) {
        for (let i in options) {
            if (cgy.is.defined(target[i])) {
                if (cgy.is.plainObject(options[i]) && cgy.is.equal(target[i], options[i])) {
                    target[i] = cgy.extend(target[i], options[i]);
                }
            }
            target[i] = options[i];
        }
        return target;
    },

    //实现 jQuery.extend()
    extend(...params) {
        let options, name, src, copy, copyIsArray, clone,
            target = params[0] || {},
            i = 1,
            length = params.length,
            deep = true;    //默认深拷贝，原为浅拷贝 false;
        if(typeof target === "boolean"){
            deep = target;
            target = params[1] || {};
            i = 2;
        }
        if(typeof target !== "object" && !cgy.is.function(target)){
            target = {};
        }
        if(length === i){
            target = this;
            --i;
        }
    
        for(; i < length; i++){
            if((options = params[i]) != null){
                for(name in options){
                    src = target[name];
                    copy = options[name];
                    if(target === copy){
                        continue;
                    }
                    if(deep && copy && (cgy.is.plainObject(copy) || (copyIsArray = cgy.is.array(copy)))){
                        if(copyIsArray){
                            copyIsArray = false;
    
                            clone = src && cgy.is.array(src) ? src : [];
                            //待合并对象为数组时，直接与原数组合并，并去重
                            clone.push(...copy);
                            target[name] = clone;
                            
                        }else{
    
                            clone = src && cgy.is.plainObject(src) ? src : {};
                            //遇到对象，则递归
                            target[name] = cgy.extend(deep, clone, copy);
                            
                        }
                        //target[name] = jQuery.extend(deep, clone, copy);
                    }else if(copy !== undefined){
    
                        target[name] = copy;
                        
                    }
                }
            }
        }
        return target;
    },

    //clone，深拷贝
    clone(obj) {
        if (cgy.is.object(obj)) {
            return cgy.extend(Object.create(null), obj);
        }
        return Object.create(null);
    },

    //清空 obj 内的 properties
    empty(obj = {}) {
        if (!cgy.is.eachable(obj) || cgy.is.empty(obj)) return obj;
        if (cgy.is.array(obj)) {
            while(obj.length>0) {
                obj.pop();
            }
        } else {
            cgy.each(obj, (v,i)=>{
                //delete obj[i];
                Reflect.deleteProperty(obj[i]);
            });
        }
        return obj;
    },

    //包裹 obj
    //wrap(obj, 'foo')  -->  { foo: obj }
    //wrap(obj, 'foo.bar.jaz')  -->  { foo: {bar: {jaz: obj } } }   rtn.foo.bar.jaz == obj
    wrap(obj, key) {
        if (!key.includes('.')) return {[key]: obj};
        let keys = key.trimAny('.').split('.'),
            temp = obj;
        for (let i=keys.length-1; i>=0; i--) {
            temp = cgy.wrap(temp, keys[i]);
        }
        return temp;
    },

    //eq，判断两个 anything 是否相同
    eq(a, b) {
        if (a === b) return true;
        if (cgy.is(a) !== cgy.is(b)) return false;
        switch (cgy.is(a)) {
            case 'object' :
                if (Object.keys(a).length !== Object.keys(b).length) return false;
                for (let [i,v] of Object.entries(a)) {
                    if (!cgy.is.defined(b[i])) return false;
                    if (!cgy.eq(v, b[i])) return false;
                }
                return true;
                break;
            case 'array' :
                if (a.length !== b.length) return false;
                for (let [i,v] of a.entries()) {
                    if (!cgy.eq(v, b[i])) return false;
                }
                return true;
                break;
        }
        return false;
    },

    /**
     * 比较两个 plainObject，返回它们不相同的字段
     * 一般用于比较某个 obj 被修改后，有哪些字段被修改了
     * 参数一相当于原值，参数二相当于新值
     * 
     * a = {foo:1, bar:{jaz:{tom:2}, fooo:3}}
     * b = {foo:11, bar:{jaz:{tom:22}}}
     * cgy.diff(a,b) == {'foo':[11,1], 'bar.jaz.tom':[22,2]}
     * cgy.diff(b,a) == {'foo':[1,11], 'bar.jaz.tom':[2,22], 'bar.fooo':[3,undefined]}
     * 
     * @param {Object} ov
     * @param {Object} nv 
     * @param {Boolean} hasov   在返回的被修改字段对象中，是否包含原值
     * @return {Object || false}
     */
    diff(ov, nv, hasov = true) {
        if (cgy.eq(ov, nv)) return false;
        let diff = {};
        for (let [i,v] of Object.entries(nv)) {
            let trav = false;
            if (cgy.eq(ov[i], v)) continue;
            if (cgy.is.undefined(ov[i])) {
                diff[i] = hasov ? [v, undefined] : v;
            } else {
                if (cgy.is.plainObject(v)) {
                    if (!cgy.is.plainObject(ov[i])) {
                        diff[i] = hasov ? [v, ov[i]] : v;
                    } else {
                        trav = cgy.diff(ov[i], v, hasov);
                        if (trav!==false) {
                            cgy.each(trav, (rst, k)=>{
                                diff[`${i}.${k}`] = rst;
                            });
                        } else {
                            continue;
                        }
                    }
                } else {
                    diff[i] = hasov ? [v, ov[i]] : v;
                }
            }
        }
        if (cgy.is.empty(diff)) return false;
        return diff;
    },

    /**
     * 生成长度为 n 包含 0 ~ n-1 数字的 array
     * 如 arr(3) 返回 [0,1,2]
     */
    arr(n) {
        if (n<=0) return [];
        return Array.from(Array(n)).map((i,idx)=>idx);
    },

    /**
     * 为 obj 提供 proxy 代理
     * v 1.0.0
     * @param {Object} obj 要代理的目标
     * @param {Object} getters 要提供的 proxy get 方法
     * @return {Proxy}
     */
    proxyer(obj, getters/*, setters*/) {
        if (!cgy.is.nonEmptyObject(getters)) getters = {};
        //if (!cgy.is.nonEmptyObject(setters)) setters = {};

        getters = cgy.extend({
            //对 obj 进行一些前处理，getters.init(obj) 方法，可自定义
            //必须返回处理后的 obj
            init: o => o,

            //为目标 proxy 增加一个 current 属性（不可枚举/编辑/修改属性等）
            //属性值为 plainObject 通常用于存放临时数据(状态)
            current(data) {
                if (cgy.is.undefined(this.__current__)) cgy.def(this, { __current__: {} });
                if (cgy.is.nonEmptyObject(data)) {
                    cgy.each(data, (v,i) => {
                        this.__current__[i] = v;
                        this[i] = v;
                    });
                } else if (cgy.is.undefined(data)) {
                    return this.__current__;
                } else if (cgy.is.string(data)) {
                    return this.__current__[data];
                } else if (cgy.is.empty(data)) {
                    //向 current 属性传入 null，{} 等空值时，清空属性值
                    //清空 但 不删除 current 属性本身
                    cgy.each(this.__current__, (v,i) => {
                        Reflect.deleteProperty(this.__current__, i);
                        Reflect.deleteProperty(this, i);
                    });
                }
                return this;
            },
        }, getters);

        //console.log(getters);

        return new Proxy(getters.init(obj), {
            get(target, prop, receiver) {
                //console.log(receiver);
                if (!cgy.is.string(prop)) return target[prop];
                let getter = Reflect.get(getters, prop);
                if (cgy.is.defined(getter)) {
                    //return getters[prop].bind(receiver);
                    return getter.bind(receiver);
                } else {
                    let cnt = Reflect.get(target, prop, receiver);
                    return cnt;
                }
            }/*,
            set(target, prop, val, receiver) {
                //console.log(target);
                let setter = Reflect.get(setters, prop);
                if (cgy.is.defined(setter)) {
                    //setters[prop](val);
                    setter.call(receiver, target, prop, val);
                } else {
                    if (prop!='__current__') {
                        if (cgy.is.undefined(target.__current__)) target.__current__ = {};
                        Reflect.set(receiver.__current__, prop, val);
                    } else {
                        
                    }
                }
                return true;
            }*/
        });
    },

    /**
     * 将 obj 转为响应式，修改其数据将触发回调
     * 通过 proxy 代理实现
     * cgy.store 核心方法
     * 
     * v 2.1.0
     * 
     * @param {String} namespace 命名空间，用以区别不同的 响应式 obj
     * @param {Object} obj 要转换的目标对象，必须是 plainObject
     * @param {Number} sn 调用标记，标记对当前 obj 的不同调用，用来生成 xpath，不用手动提供
     * @return {Proxy}
     * 
     * 使用方法：
     * let proxy = cgy.observe('some.namespace', obj);
     * 
     * 指定 onchange 方法
     * proxy.$onchange(
     *      function(xpath, nv, ov) { 
     *          //不能用 ()=>{} 定义函数，
     *          //因为在 onchange 方法内部需要用到 this，this 指向 proxy
     *          //默认方法已可以触发 page.set()
     *      }
     * );
     * 
     * 定义一些工具函数，通过 proxy.$xxxx() 调用 
     * proxy.$methods({ 
     *      m1() { ... },
     *      m2() { ... }
     * });
     * 
     * 添加观察者，观察者一般是小程序页面，xpathes 指定要观察的字段，可用 * 通配符
     * proxy.$addObserver( 
     *      page,   //对象引用
     *      xpathes = [ //观察的字段，路径从根节点一直叶子节点
     *          'foo.bar', 
     *          'bar.foo as datakey', 
     *          'foo.jaz.*',
     *          'computed.foooo'
     *      ] 
     * );
     * 
     * 删除观察者
     * proxy.$removeObserver( page );
     * 
     * 定义计算属性
     * proxy.$computed({
     *      //通过 proxy.computed.computedField 访问
     *      computedField: {
     *          compute(field1, field2, ...) {
     *              //计算方法
     *              return 计算结果;
     *          },
     *          xpathes: [  //使用到的字段，顺序与 compute 方法的参数顺序一致
     *              'foo.field1',
     *              'bar.field2'
     *          ]
     *      }
     * });
     * 
     * 修改字段值
     * proxy.foo.bar.jaz = value;
     * proxy['foo.bar.jaz'] = value;
     * proxy.foo['bar.jaz'] = value;
     * proxy.foo.bar = {jaz: value};    //extend 方式部分修改字段值
     * 
     * set 方法
     * proxy.$set({foo:{bar:{jaz: value}}});
     * proxy.$set('foo.bar', {jaz: value});
     * proxy.foo.bar.$set({jaz: value});
     * 
     * 数组修改，可触发响应的方法： push,pop,shift,unshift,splice,sort,reverse
     * proxy.foo.bar.jaz 是一个数组，则
     * proxy.foo.bar.jaz.push(...)
     * proxy.foo.bar.jaz.splice(0,1, a,b,c,...)     //返回值与原数组方法一致
     * 以上数组方法均可直接修改数组内容，并触发响应
     * 
     * 读取字段值
     * proxy.$
     * proxy.foo.bar.jaz.$
     * proxy.foo['bar.jaz'].$
     * proxy.computed.foooo.$
     * 
     * 新增字段，直接设置即可
     * proxy.foo.newfield = value;
     * 
     */
    observe(namespace, obj, sn) {
        //observe.tools 定义内部使用的工具方法
        if (cgy.is.undefined(cgy.observe.toolsReady)) {
            cgy.def(cgy.observe, {
                toolsReady: true,

                //通用方法      cgy.observe.method()

                //处理调用标记 sn，标记不同调用
                //每当输入参数 sn == undefined 时，标记为新的调用
                sign(ns, _sn) {
                    //console.log(`input sn = ${sn}`);
                    //let _sn = sn;
                    if (!cgy.is.number(_sn)) {
                        _sn = cgy.observe[ns].xpath.length;
                    }
                    //console.log(`set sn = ${_sn}`);
                    return _sn;
                },
                //保存调用路径到 observe.xpath 数组
                xpath(ns, prop, _sn) {
                    //忽略某些 prop
                    if (['namespace'].includes(prop)) return false;
                    //console.log(`set xpath sn = ${sn}`);
                    if (_sn < cgy.observe[ns].xpath.length) {
                        cgy.observe[ns].xpath[_sn].push(prop);
                    } else {
                        cgy.observe[ns].xpath.push([prop]);
                    }
                    //let xpath = cgy.observe[ns].xpath;
                    //console.log(xpath.map(p=>p.join('.')));
                },
                //清空调用路径 xpath 数组
                emptyXpath(ns) {
                    cgy.empty(cgy.observe[ns].xpath);
                },
                //获取当前调用的 xpath 数组
                currentXpath(ns) {
                    let nso = cgy.observe[ns],
                        sn = nso.xpath.length-1;
                    if (sn<0) return [];
                    return nso.xpath[sn];
                },
                //数据更新时的 handler
                onchange(ns, xpath, nv, ov) {
                    let proxy = cgy.observe[ns].proxy,
                        observers = proxy.$observers(),
                        xp = cgy.is.array(xpath) ? xpath.join('.') : xpath;
                    if (cgy.is.defined(observers[xp])) {
                        observers = observers[xp];
                        let changes = {};
                        cgy.each(observers, (observerObj, observerId)=>{
                            let observer = observerObj.observer,
                                key = observerObj.dataKey;
                            
                            if (observer.isComputed==true) {  //计算属性更新数据
                                let args = [];
                                cgy.each(observer.xpathes, (xpi, i)=>{
                                    args.push(proxy[xpi]);
                                });
                                proxy.computed[observer.field] = observer.compute.call(proxy, ...args);
                            } else {
                                if (cgy.is.function(cgy.observe[ns].onchange)) {
                                    let onchange = cgy.observe[ns].onchange.bind(proxy);
                                    onchange(xpath, nv, ov);
                                } else if (cgy.is.function(observer.whenStoreChange)) {
                                    let whenStoreChange = observer.whenStoreChange.bind(observer);
                                    whenStoreChange(xpath, nv, ov);
                                } else {
                                    //小程序页面更新，缓存后统一更新
                                    if (cgy.is.defined(observer.__route__)) {   
                                        if (cgy.is.undefined(changes[observerId])){
                                            changes[observerId] = {
                                                observer,
                                                data: {}
                                            };
                                        }
                                        changes[observerId].data[key] = nv;
                                    }
                                }
                            }
                        });
                        if (!cgy.is.empty(changes)) {
                            cgy.each(changes, (change, obid)=>{
                                change.observer.setData(change.data);
                            });
                        }
                    }
                },
                //删除某个 namespace，即删除 proxy 对象
                delNamespace(ns) {
                    Reflect.deleteProperty(cgy.observe, ns);
                },
                
                //由各响应式 obj 的 proxy 对象调用的方法    proxy.$method()
                //方法内 this 指向 proxy 对象

                //为当前 proxy 自定义 onchange 方法
                _onchange(extra, func) {
                    let ns = extra.namespace;   //this.$namespace()
                    if (cgy.is.function(func)) {
                        //为当前 proxy 指定 onchange 方法
                        cgy.observe[ns].onchange = func;
                    }
                    return this;
                },
                //为当前 proxy 增加自定义 methods
                _methods(extra, funcObj = {}) {
                    let ns = extra.namespace;   //this.$namespace();
                    cgy.each(funcObj, (func, fname) => {
                        cgy.observe[ns].methods[fname] = func;
                    });
                    return this;
                },
                //手动触发 onchange 用于初始赋值
                _triggerChange(extra, observerId) {
                    let ns = extra.namespace,   //this.$namespace(),
                        proxy = extra.proxy,    //cgy.observe[ns].proxy,
                        obs = cgy.observe[ns].observers,
                        onchange = cgy.observe.onchange;
                    cgy.each(obs, (obrs, xpath)=>{
                        if (cgy.is.undefined(obrs[observerId])) return true;
                        let nv = proxy[xpath];
                        //console.log(`triggerChange ${xpath}`);
                        onchange(ns, xpath, nv, undefined);
                    });
                    return this;
                },
                //定义计算属性
                _computed(extra, computeds) {
                    let ns = extra.namespace,   //this.$namespace(),
                        proxy = extra.proxy,    //cgy.observe[ns].proxy,
                        nso = cgy.observe[ns],
                        cps = nso.computedObservers;

                    cgy.each(computeds, (computed, field)=>{
                        cps[field] = {
                            isComputed: true,
                            field,
                            getObserverId: ()=>`computed.${field}`,
                            xpathes: computed.xpathes,
                            compute: computed.compute
                        }
                        if (cgy.is.undefined(proxy.computed)) proxy.computed = {};
                        proxy.computed[field] = null;
                        proxy.$addObserver(cps[field], computed.xpathes);
                    });
                    return this;
                },
                //为当前 proxy 增加观察者，一般是 page 对象
                //应该在需要的 page 的 onLoad 方法里调用
                _addObserver(extra, observer, xpathes = []) {
                    let ns = extra.namespace,   //this.$namespace(),
                        proxy = extra.proxy,    //cgy.observe[ns].proxy,  //根 proxy 对象
                        nso = cgy.observe[ns];
                    if (!cgy.is.array(xpathes)) return this;
                    if (cgy.is.empty(xpathes)) {
                        let cx = extra.xpath;    //cgy.observe.currentXpath(ns);
                        if (cgy.is.empty(cx)) return this;
                        xpathes = [ cx.join('.') ];
                    }

                    //观察者对象必须包含 获取 observerId 的方法
                    let observerId = observer.getObserverId();
                    //为观察者增加一个包含字段名（别名）与字段路径 xpath 对应的 object 属性
                    let obxpathes = {};
                    //observer.$store = this;

                    cgy.each(xpathes, (xpath, i) => {
                        if (cgy.is.array(xpath)) {
                            xpath = `${xpath.join('.')} as ${xpath.slice(-1)[0]}`;
                        }
                        if (!cgy.is.string(xpath)) return false;
                        let xp, alias;
                        if (xpath.includes(' as ')) {
                            let xparr = xpath.split(' as ');
                            xp = xparr[0].trim();
                            alias = xparr[1].trim();
                        } else {
                            xp = xpath;
                            alias = xpath.split('.').slice(-1)[0];
                        }
                        //xpath 带有通配符  foo.bar.*
                        if (alias == '*') {
                            xp = xp.split('.');
                            xp.pop();
                            alias = xp.slice(-1)[0];
                            xp = xp.join('.');
                            let items = proxy[xp].$;
                            cgy.each(items, (item, k)=>{
                                let xpi = `${xp}.${k}`,
                                    ali = `${alias}.${k}`;
                                if (cgy.is.undefined(nso.observers[xpi])) {
                                    nso.observers[xpi] = {};
                                }
                                let obs = nso.observers[xpi];
                                if (cgy.is.undefined(obs[observerId])) {
                                    obs[observerId] = {
                                        observer,
                                        dataKey: ali
                                    };
                                }
                                obxpathes[ali] = xpi;
                            });
                        } else {
                            //正常设置
                            if (cgy.is.undefined(nso.observers[xp])) {
                                nso.observers[xp] = {};
                            }
                            let obs = nso.observers[xp];
                            if (cgy.is.undefined(obs[observerId])) {
                                obs[observerId] = {
                                    observer,
                                    dataKey: alias
                                };
                                obxpathes[alias] = xp;
                            }
                        }
                    });
                    //只将 xpathes 属性附加到 page 类型的观察者
                    if (cgy.is.function(observer.onLoad)) observer.xpathes = obxpathes;
                    //清空调用路径 xpath
                    cgy.observe.emptyXpath(ns);
                    //手动触发 onchange 事件，初始赋值
                    //console.log(`addObserver ${observerId}`);
                    proxy.$triggerChange(observerId);
                    return this;
                },
                //删除观察者
                _removeObserver(extra, observer) {
                    let ns = extra.namespace,   //this.$namespace(),
                        //proxy = cgy.observe[ns].proxy,  //根 proxy 对象
                        nso = cgy.observe[ns],
                        obs = nso.observers,
                        obid = cgy.is.string(observer) ? observer : observer.getObserverId();
                    cgy.each(obs, (obrs, xpath)=>{
                        if (cgy.is.undefined(obrs[obid])) return false;
                        Reflect.deleteProperty(cgy.observe[ns].observers[xpath], obid);
                        if (cgy.is.empty(cgy.observe[ns].observers[xpath])) {
                            Reflect.deleteProperty(cgy.observe[ns].observers, xpath);
                        }
                    });
                    return this;
                },
                //获取某个观察者观察的全部字段
                
                //获取当前 proxy 的所有观察者信息
                _observers(extra) {
                    return cgy.observe[this.$namespace()].observers;
                },
                //set 方法以 extend 方式修改 plainObject 类型的值
                _set(extra, xpath, data) {
                    let ns = extra.namespace,   //this.$namespace(),
                        proxy = extra.proxy;    //cgy.observe[ns].proxy;
                    if (cgy.is.plainObject(xpath) && cgy.is.undefined(data)) {
                        data = cgy.clone(xpath);
                        xpath = extra.xpath;
                        let xp = xpath.join('.'),
                            ov = extra.target,  //xp=='' ? proxy.$ : proxy[xp].$,
                            nv = data;
                        if (cgy.is.plainObject(ov)) {
                            nv = cgy.extend({}, ov, data);
                        } else {
                            ov = {};
                            //原数据不是 plainObject 新数据是 plainObject
                            //无法 setData，存在问题
                            //暂不处理
                            //TODO...
                        }
                        let diff = cgy.diff(ov, nv, false);
                        if (diff==false) return this;
                        this.$set(xp, diff);
                        return this;
                    } else {
                        if (cgy.is.array(xpath)) xpath = xpath.join('.');
                    }
                    if (!cgy.is.nonEmptyObject(data)) {
                        if (xpath=='') return false;
                        proxy[xpath] = data;
                    } else {
                        let xp = '';
                        cgy.each(data, (v, i) => {
                            xp = xpath=='' ? i : `${xpath}.${i}`;
                            proxy[xp] = v;
                        });
                    }
                    return this;
                },

                //数组更新方法
                _editArray(extra, method, ...args) {
                    let ms = 'push,pop,shift,unshift,splice,sort,reverse'.split(',');
                    if (ms.includes(method) && cgy.is.array(extra.target)) {
                        let nv = extra.target.clone(),
                            xp = extra.xpath.join('.'),
                            result = nv[method](...args);
                        extra.proxy[xp] = nv;
                        return result;
                    }
                    return this;
                },

            });
        }

        //命名空间 namespace，用以区分由 cgy.observe() 创建的不同的响应式 obj，必须指定
        if (cgy.is.undefined(cgy.observe[namespace])) {
            //创建当前响应式 obj 的命名空间
            //cgy.def(cgy.observe, {
            Reflect.defineProperty(cgy.observe, namespace, {
                configurable: true, //namespace 可删除
                value: {
                    xpath: [
                        //[foo,bar],
                        //[foo,bar,jaz],
                        //...
                    ],
                    observers: {
                        /*
                        [xpath]: {
                            [observerId]: {
                                observer: 观察者对象，一般是 page，必须拥有 getObserverId() 方法
                                dataKey: 此 xpath 在观察者内部 data 的 key
                            },
                            ...
                        },
                        ...
                        */
                    },
                    //自定义 methods
                    //以 proxy.$method() 方式调用
                    methods: {
                        //以闭包的方式保存 namespace
                        namespace: () => {
                            //console.log(cgy.observe[namespace].xpath);
                            return namespace;
                        }
                    },
                    //响应数据更新的方法，通知观察者同步更新数据
                    //不同的响应式 obj 可以拥有不同的 onchange 方法
                    onchange: null,
                    //计算属性观察者对象集合
                    computedObservers: {
                        /*
                        field: {
                            isComputed: true,
                            getObserverId: ()=>'computed.field',
                            xpathes: [],
                            compute() {
                                计算方法
                                return 计算结果;
                            }
                        }
                        */
                    }
                }
            });
        }
        
        let proxy = new Proxy(
            obj,
            {
                get(target, prop, receiver) {
                    if (!cgy.is.string(prop)) return Reflect.get(target, prop);
                    if (prop=='$') {
                        cgy.observe.emptyXpath(namespace);
                        return target;
                    }
                    //调用 proxy.$method() 方法
                    //针对由 proxy 对象调用的方法   proxy.foo.bar.$method( extra, arg1, arg2, ... )
                    //extra 对象 绑定到 $method 第一个参数，
                    //调用时传入的参数从第二参数开始，
                    //数组修改方法第二参数是绑定的修改方法（如 push），调用时传入参数从第三参数开始
                    //当前 receiver 绑定到 $method 内部的 this
                    let extra = {
                        target,
                        namespace,
                        xpath: cgy.observe.currentXpath(namespace),
                        proxy: cgy.observe[namespace].proxy
                    };
                    if (prop.startsWith('$')) {
                        let m = prop.substr(1),
                            proxyms = cgy.observe[namespace].methods,
                            rtn = undefined;
                        if (cgy.is.function(proxyms[m])) {
                            rtn = proxyms[m].bind(receiver);
                        } else if (cgy.is.function(cgy.observe[`_${m}`])) {
                            rtn = cgy.observe[`_${m}`].bind(receiver, extra);
                            //rtn = cgy.observe[`_${m}`].bind(receiver);
                        }
                        
                        cgy.observe.emptyXpath(namespace);
                        return rtn;
                    }
                    //数组修改方法
                    if (cgy.is.array(target) && 'push,pop,shift,unshift,splice,sort,reverse'.split(',').includes(prop)) {
                        let rtn = cgy.observe._editArray.bind(receiver, extra, prop);
                        cgy.observe.emptyXpath(namespace);
                        return rtn;
                    }
                    
                    let _sn = cgy.observe.sign(namespace, sn);
                    if (prop.includes('.')) {
                        let err = false, temp = target;
                        cgy.each(prop.split('.'), (p, i)=>{
                            temp = Reflect.get(temp, p, receiver);
                            if (cgy.is.undefined(temp)) {
                                err = true;
                                return false;
                            }
                        })
                        if (err) return undefined;
                        cgy.observe.xpath(namespace, prop, _sn);
                        if (cgy.is(temp, 'object,array')) {
                            return cgy.observe(namespace, temp, _sn);
                        } else {
                            cgy.observe.emptyXpath(namespace);
                            return temp;
                        }
                    } else {
                        let val = Reflect.get(target, prop, receiver); //target[prop];
                        if (cgy.is.defined(val)) cgy.observe.xpath(namespace, prop, _sn);
                        if (cgy.is(val, 'object,array')) {
                            return cgy.observe(namespace, val, _sn);
                        } else {
                            cgy.observe.emptyXpath(namespace);
                            return val;
                        }
                    }
                },
                set(target, prop, val, receiver) {
                    let _sn = cgy.observe.sign(namespace, sn),
                        err = false;

                    let ov = Reflect.get(target, prop/*, receiver*/),   //target[prop],
                        nv = val;
                    if (cgy.is.plainObject(ov)) {
                        ov = cgy.clone(ov);
                        if (cgy.is.plainObject(val)) {
                            nv = cgy.extend({}, ov, val);
                        }
                    }

                    //extend 方式部分修改 target[prop] 的值
                    if (cgy.is.plainObject(ov) && cgy.is.plainObject(nv)) {

                        //diff 方法判断哪些值修改了
                        let diff = cgy.diff(ov, nv, false);
                        if (diff==false) {  //没有修改
                            cgy.empty(cgy.observe[namespace].xpath);
                            return true;
                        }
                        //console.log(diff); return true;

                        let txp = cgy.observe[namespace].xpath;
                        if (txp.length>0) {
                            txp = txp.pop().join('.');
                        } else {
                            txp = '';
                        }
                        txp = txp=='' ? '' : `${txp}.`
                        cgy.empty(cgy.observe[namespace].xpath);
                        txp = `${txp}${prop}`;
                        //console.log(txp);

                        return receiver.$set(txp,diff);
                    }

                    if (prop.includes('.')) {
                        let parr = prop.split('.'), temp = target;
                        cgy.each(parr, (p, i) => {
                            if (i>=parr.length-1) {
                                //console.log(p);
                                //console.log(nv);
                                //console.log(temp);
                                Reflect.set(temp, p, nv);
                                //console.log(temp);
                            } else {
                                temp = Reflect.get(temp, p, receiver);
                                if (cgy.is.undefined(temp)) {
                                    err = true;
                                    return false;
                                }
                            }
                        });
                    } else {
                        Reflect.set(target, prop, nv, receiver);
                    }

                    if (err) {
                        return false;
                    } else {
                        cgy.observe.xpath(namespace, prop, _sn);
                        //console.log(cgy.observe[namespace].xpath.slice(-1)[0].join('.'));
                        let xp = cgy.observe[namespace].xpath[_sn];
                        //cgy.empty(cgy.observe[namespace].xpath);
                        cgy.observe.emptyXpath(namespace);

                        let onchange = cgy.observe.onchange;
                        onchange(namespace, xp, nv, ov);

                        return true;
                    }
                }
            }
        );
        //将 proxy 对象附加到 cgy.observe[namespace].proxy
        if (cgy.is.undefined(cgy.observe[namespace].proxy)) {
            cgy.def(cgy.observe[namespace], { proxy });
        }
        return proxy;
    },

    //each，遍历操作
    each(anything, func) {
        let types = cgy.is.eachTypes;    //可遍历的数据类型
        if (!types.includes(cgy.is(anything)) || cgy.is.empty(anything) || !cgy.is(func,'function')) return anything;
        let type = cgy.is(anything);
        let rsts = type=='map' ? new Map() : (type=='object' ? {} : []);
        let rst = false,
            ent;
        if (cgy.is(anything,'object')) {
            /** 小程序不支持 yield
            //对于Object对象，需要手动部署Iterator接口，指定为Generator函数
            anything[Symbol.iterator] = function* (){
                for(let key of Object.keys(anything)){
                    yield [key, anything[key]];
                }
            }
            ent = anything;
            */
            ent = Object.entries(anything);
        } else if (cgy.is(anything,'string')) {
            ent = [...anything].entries();
        } else {
            ent = anything.entries();
        }
        for (let [key, value] of ent) {
            rst = func(value, key);
            if (rst===false) break;
            if (rst===true) continue;
            if (type=='map') {
                rsts.set(key, rst);
            } else if (type=='set') {
                rsts.push(rst);
            } else {
                rsts[key] = rst;
            }
        }
        if (type=='set') {
            return new Set(rsts);
        } else if (type=='string') {
            return rsts.join('');
        }
        return rsts;
    },

    //以 'foo/bar/jaz' or 'foo.bar.jaz' 的形式读取(或设置) obj 的属性值
    item(obj = {}, xpath = '', val) {
        let proxy = cgy.observe('cgy.temp.item', obj);
        xpath = xpath.replace(/\//g, '.');
        if (cgy.is.undefined(val)) {
            val = proxy[xpath];
            if (cgy.is.plainObject(val) || cgy.is.array(val)) {
                val = val.$;
            }
            cgy.observe.delNamespace('cgy.temp.item');
            return val;
        } else {
            proxy[xpath] = val;
            cgy.observe.delNamespace('cgy.temp.item');
            return obj;
        }
    },

    //xpath，获取 对象obj 在 对象base 中的调用路径
    //如：obj = base.foo.bar.jaz --> cgy.xpath(base, obj) == 'foo.bar.jaz'
    /*xpath(base, obj) {
        if (cgy.is.object(base)) {
            let p = [];
            for (let [key, val] of Object.entries(base)) {
                //console.log(key);
                if (cgy.eq(obj, val)) {
                    p.push(key);
                    break;
                } else if (cgy.is.object(val)) {
                    let sp = cgy.xpath(val, obj);
                    if (!cgy.is.null(sp)) {
                        p.push(key, sp);
                        break;
                    }
                }
            }
            return p.length<=0 ? null : p.join('.');
        }
        return null;
    },*/
    
    //lodash.get() 方法实现
    //以 a.b.c[0].d 方式读取 object 的值，来自 lodash
    loget (source, path, defaultValue = undefined) {
        //间隔字符可以是 . or /
        path = path.replace(/\//g, '.');
        // a[3].b -> a.3.b
        const paths = path.replace(/\[(\d+)\]/g, '.$1').split('.')
        let result = source;
        for (const p of paths) {
            result = Object(result)[p];
            if (result === undefined) {
                return defaultValue;
            }
        }
        return result;
    },

    //延时执行 wait(100).then(() => {})
    wait(time = 100, rtn) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, time, rtn);
        });
    },

    //返回空Promise，用于在异步执行的函数中，直接跳出
    resolve(data) {
        return new Promise((resolve, reject)=>{
            resolve(data);
        });
    },

    //用promise方式，实现条件执行，需要轮询 _until(() =>{}).then(() => {})
    until(condition, waittime=2000) {
        let timegap = 100,  //条件轮询时间间隔
            timeto = 0;     //已等待时间
        return new Promise((resolve, reject) => {
            if (!cgy.is(condition,'function')) {
                return reject(new Error('cgy.until 方法，传入的条件必须为 Function 返回值为 Boolean'));
            }
            let f = () => {
                if (timeto>waittime) return reject(new Error('cgy.until 方法，等待超时'));
                timeto += timegap;
                if (condition()===true) return resolve(true);
                return setTimeout(f, timegap);
            }
            return f();
        });
    },

});

//应用方法
cgy.def({

    /**
     * url 处理
     *  let url = cgy.url(url)      不指定 url 则 url=location.href
     *                  .protocol|domain|host|uri|URI|queryString|query|hashString|hash()
     *                  
     */
    url: cgy.proxyer(
        url => {
            url = cgy.is.empty(url) ? window.location.href : url;
            let arr1 = url.split('://'),
                arr2 = arr1.length<=1 ? arr1[0].split('?') : arr1[1].split('?'),
                arr3 = arr2[0].split('/'),
                arr4 = !cgy.is.empty(arr2[1]) ? arr2[1].split('#') : [],
                arr5 = arr4.length<=0 ? [] : arr4[0].split('&'),
                arr6 = arr4.length>1 ? arr4[1].split('/') : [],
                protocol = arr1.length<=1 ? 'https' : arr1[0],
                domain = arr3[0],
                host = `${protocol}://${domain}`,
                uri = arr3.slice(1),
                URI = '/'+uri.join('/'),
                queryString = arr4.length>0 ? arr4[0] : '',
                query = {},
                hashString = arr4.length>1 ? `#/${arr4[1].trimAnyStart('/')}` : '',
                hash = arr6.length>0 ? (arr6[0]=='' ? ['#', ...arr6.slice(1)] : ['#', ...arr6]) : [];
            if (arr4.length>0) {
                for (let qi of arr4) {
                    let qia = qi.split('=');
                    query[qia[0]] = qia[1];
                }
            }

            cgy.url.current({
                protocol, domain, host,
                uri, URI,
                queryString, query,
                hashString, hash
            });

            //let uo = cgy.url.current();
            //for (let i in uo) {
            //    cgy.url[i] = () => uo[i];
            //}
            return cgy.url;
        },{
            //build url
            //将经过处理的 url 参数输出为完整 url 路径
            url() {
                let uo = this.current();
                return `${uo.host}/${uo.uri.join('/')}${cgy.url.buildQuery()}${cgy.url.buildHash()}`;
            },
            //query --> queryString
            buildQuery(query={}) {
                let isself = cgy.is.empty(query);
                query = cgy.is.empty(query) ? cgy.url.current().query : query;
                if (!cgy.is.empty(query)) {
                    let qs = [];
                    for (let i in query) {
                        qs.push(`${i}=${query[i]}`);
                    }
                    let queryString = qs.join('&');
                    if (isself) cgy.url.current({ queryString });

                    return '?'+queryString;
                }
                return '';
            },
            //hash --> hashString 默认 hash 前缀 # 后紧接着 /    like: #/foo/bar
            buildHash(hash=[]) {
                let isself = cgy.is.empty(hash);
                hash = cgy.is.empty(hash) ? cgy.url.current().hash : hash;
                if (hash.length>0) {
                    if (hash[0]!='#') {
                        if (hash[0]=='') {
                            hash[0] = '#';
                        } else {
                            hash.unshift('#');
                        }
                        if (isself) cgy.url.current({ hash });
                    }
                    let hashString = hash.join('/');
                    if (isself) cgy.url.current({ hashString });
                    
                    return hashString;
                }
                return '';
            },

            //set
            pushUri(uri=[]) {
                if (cgy.is.empty(uri)) return this;
                if (cgy.is.string(uri)) {
                    if (uri.includes('?')) {
                        let arr = uri.split('?');
                        uri = arr[0].trimAny('/').split('/');
                        if (arr[1]!='') this.setQuery(arr[1]);
                    } else {
                        uri = uri.trimAny('/').split('/');
                    }
                }
                if (!cgy.is.array(uri)) return this;
                let us = this.current().uri;
                us.push(...uri);
                this.current({ 
                    uri: us,
                    URI: `/${us.join('/')}`
                });
                return this;
            },
            setQuery(query={}) {
                let q = cgy.url.current().query;
                if (cgy.is.empty(query)) return this;
                if (cgy.is.string(query)) {
                    let arr = query.replace('?','').split('&');
                    for (let i of arr) {
                        let ari = i.split('=');
                        q[ari[0]] = ari[1];
                    }
                    this.current({ query: q });
                }
                if (!cgy.is.plainObject(query)) return this;
                this.current({
                    query: cgy.extend(q,query)
                });
                this.buildQuery();
                return this;
            },
            setHash(hash=[]) {
                if (hash.length>0) {
                    cgy.url.current({ hash });
                    cgy.url.buildHash();
                }
                return cgy.url;
            },

            //has
            hasQuery: (key) => cgy.is.empty(key) ? !cgy.is.empty(cgy.url.current().query) : !cgy.is.empty(cgy.url.current().query[key]),
            hasHash: () => cgy.url.current().hash.length>0,

            //up-path 处理 ../../ 问题
            upPath(lvl=1, insert=[]) {
                let uri = this.current().uri;
                if (uri.length<=lvl+1) {
                    uri = [];
                } else {
                    uri = uri.slice(0, uri.length-lvl-1);
                }
                this.current({
                    uri,
                    URI: `/${uri.join('/')}`
                });
                return this.pushUri(insert);
            }, 

            //获取当前 url 中 uri 的第一项，通常为 appname
            app() {
                let uri = this.current().uri;
                return uri.length>0 ? uri[0] : '';
            },
        }
    ),

    /**
     * math 方法
     */
    math: {
        //浮点数相等判断
        eqs(fa, fb) {
            let prec = 1e-6,    //指定浮点精度为 0.000001
                diff = Math.abs(fa - fb);
            //如果两个浮点数之差小于浮点精度，则认为它们相等
            return diff < prec;
        },
        //判断小数位数
        digLen(n) {
            n = n+'';
            if (!n.includes('.')) return 0;
            return n.split('.')[1].length;
        },
        //浮点数舍入到 this.$precision 位数，如果小数位数大于 $precision 位数，则舍入到 $precision+2 位
        //$precision==2 则 1.3-->1.30，1.345-->1.3450
        //最高 6 位小数
        toFixed(num) {
            num = num*1;
            let prec = this.$precision,
                num1 = num.toFixed(prec),
                num2 = num.toFixed(prec+2),
                num3 = num.toFixed(prec+4);
            if (this.eqs(num, num1*1)) return num1;
            if (this.eqs(num, num2*1)) return num2;
            return num3;
        },
        //四舍五入，最多保留 n 位小数
        //toFixed 方法保留的小数可能包含 0，例如 3.14.toFixed(3) --> 3.140
        //round(3.1415926, 3)   --> 3.142
        //round(3.14, 3)        --> 3.14
        round(num, n=2) {
            num = parseFloat(num);
            let inn = Math.round(num*Math.pow(10,n));
            return inn/Math.pow(10,n);
        },
    },

    /**
     * date
     */
    date: {
        //new date，返回 Date Object
        new(...args) {
            if (args.length>0) {
                let arg = args[0];
                if (cgy.date.isTimestamp(arg)) return new Date(arg);
                if (cgy.date.isUnixTimestamp(arg)) return new Date(arg*1000);
                if (cgy.date.isDateString(arg)) return new Date(arg);
                return new Date(...args);
            }
            return new Date();
        },
        //判断数字是否 timestamp 包含毫秒
        isTimestamp(n) {
            if (!cgy.is.realNumber(n*1)) return false;
            let d = new Date(),
                ts = d.getTime(),
                tss = ts+'',
                ns = (n*1)+'';
            //return tss.length >= ns.length && !cgy.date.isUnitTimestamp(n);
            return tss.length == ns.length;
        },
        //判断数字是否 unixTimestamp
        isUnixTimestamp(n) {
            if (!cgy.is.realNumber(n*1)) return false;
            let d = new Date(),
                ts = d.unixTimestamp(),
                tss = ts+'',
                ns = (n*1)+'';
            //return tss.length >= ns.length;
            return tss.length == ns.length;
        },
        //判断是否合法时间字符串 2024-01-01
        isDateString(str) {
            //let d = new Date(str);
            //return d.toString()!='Invalid Date';
            return cgy.is.datetimeString(str);
        },
        //时间戳转为字符
        timestampToDateString(unixTimestamp, format="YYYY-MM-dd") {
            if (!cgy.date.isUnixTimestamp(unixTimestamp)) return '';
            if (unixTimestamp=='' || unixTimestamp<=0) return '';
            let d = new Date(unixTimestamp * 1000);
            return d.format(format);
        },
        timetostr(...args) {return cgy.date.timestampTodateString(...args);},
        //时间字符串转为时间戳
        dateStringToTimestamp(dateString) {
            if (!cgy.date.isDateString(dateString)) return 0;
            let d = new Date(dateString);
            return d.unixTimestamp();
        },
        strtotime(str) {return cgy.date.dateStringToTimestamp(str);},
    },
});

/**
 * console.log 扩展
 * cgy.log(...)
 *          .error(...)
 *          .success(...)
 */
cgy.def({
    log: cgy.proxyer(
        (...args) => {
            let opt = cgy.log.ready().current();
            if (opt.show==false) return;    //未启用 log
            let isError = opt.scene=='error',
                isSuccess = opt.scene=='success',
                isNormal = opt.scene=='normal';

            let getStackTrace = ()=>{
                let o = {};
                Error.captureStackTrace(o, getStackTrace);
                return o.stack;
            };
            let sty = cgy.log.sty,
                cls = cgy.log.cls;
            let stack = getStackTrace();
            //console.log(stack);
            let sta = stack.split('\n'),
                ss = sta[(!isNormal?3:2)].trim(),
                sa = ss.split('('),
                func = sa.length>1 ? sa[0].replace('at ','') : sa[0].split('/').pop().split('?')[0],
                url = sa.length>1 ? sa[1].split(')')[0] : sa[0],
                sua = url.split('/'),
                sf = sua.slice(-1)[0],
                file = sf.includes('?')? sf.split('?')[0] : sf.split(':')[0],
                line = url.split(':').slice(-2).join(':'),
                nstack = [];
            nstack.push(...sta);
            if (!isNormal) {
                nstack.splice(1,2);
            } else {
                nstack.splice(1,1);
            }
            nstack = nstack.join('\n');

            let args0 = args.length>0 ? args.shift() : '';
            
            if (isNormal) {
                console.groupCollapsed(
                    '%c %s %s %c %s %c',
                    cls('header'),
                    opt.label,
                    opt.sign,
                    cls('info'),
                    `${func.trim()}()`,
                    cls('log'),
                    args0
                );
            } else {
                console.groupCollapsed(
                    '%c %s %s %c %s %c %s %c',
                    cls('header'),
                    opt.label,
                    opt.sign,
                    cls('signtext'),
                    isError ? '✘ Error' : (isSuccess?'✔ Success':''),
                    cls('info'),
                    `${func.trim()}()`,
                    cls('log'),
                    args0
                );
            }
            console.log(
                '%c%s %c %s %c %s ', 
                cls('sign'),
                opt.sign,
                cls('info'),
                `${func.trim()}()`,
                cls('extra'),
                `${file} ＠ ${line}`
            );
            for (let i=0;i<args.length;i++) {
                console.log(
                    '%c%s',
                    cls('sign'),
                    opt.sign,
                    args[i]
                );
            }
            console.groupCollapsed('Stack');
            console.log(nstack);
            console.groupEnd();
            console.groupEnd();
            
        },
        {
            //ready
            ready(opt={}) {
                let dft = {
                        label: 'cgy',
                        sign: '>>>',
                        colors: {
                            brand: '#74c0fc',
                            info: '#74c0fc',
                            error: '#eb4c42',
                            success: '#87c04f',
                            infolight: '#8eceff',
                            errorlight: '#fb685e',
                            successlight: '#a5db6f',
                            warn: '#ffd43b',
                            warnlight: '#ffde65',
                            cyan: '#63e6be',
                        },
                        show: false,
                        scene: 'normal'
                    },
                    crt = cgy.log.current();
                if (cgy.is.empty(crt)) {
                    cgy.log.current(dft);
                    crt = dft;
                }
                if (cgy.is.empty(opt)) return cgy.log;
                opt = cgy.extend({}, crt, opt);
                cgy.log.current(opt);
                return cgy.log;
            },
            //启用/禁用 cgy.log 替代 console.log
            on: ()=>cgy.log.ready({show:true}),
            off: ()=>cgy.log.ready({show:false}),

            //style
            sty(clsn='c-black bgc-primary bold') {
                let color = cgy.log.ready().current().colors,
                    is = cgy.is,
                    lg = cgy.loget,
                    clss = clsn.trim().replace(/\s+/g,' ').split(' '),
                    sty = [];
                for (let i=0;i<clss.length;i++) {
                    let clsi = clss[i];
                    if (clsi.startsWith('c-') || clsi.startsWith('bgc-')) {
                        let isc = clsi.startsWith('c-'),
                            arg = isc ? clsi.replace('c-','') : clsi.replace('bgc-',''),
                            val = is.defined(color[arg]) ? color[arg] : null;
                        if (is.null(val)) {
                            val = arg;
                        }
                        sty.push((isc?'color:':'background-color:')+val);
                        continue;
                    }
                    if (clsi=='bold') {
                        sty.push('font-weight:bold');
                        continue;
                    }
                }
                return sty.join(';');
            },

            //样式类，按位置获取log各部分的样式，header, info, extra, log, ...
            cls(clsn='header') {
                let scene = cgy.log.ready().current().scene,
                    sty = cgy.log.sty,
                    isError = scene=='error',
                    isSuccess = scene=='success',
                    isNormal = scene=='normal';
                let clss = {
                    header: '',
                    sign: '',
                    info: '',
                    extra: '',
                    log: ''
                };
                if (isError) {
                    clss.header = sty('c-black bgc-error bold');
                    clss.sign = sty('c-error bold');
                    clss.signtext = sty('c-white bgc-error bold');
                    clss.info = sty('c-black bgc-errorlight bold');
                    clss.extra = sty('c-black bgc-warn');
                    clss.log = sty('c-errorlight bold');
                } else if (isSuccess) {
                    clss.header = sty('c-black bgc-success bold');
                    clss.sign = sty('c-success bold');
                    clss.signtext = sty('c-white bgc-success bold');
                    clss.info = sty('c-black bgc-successlight bold');
                    clss.extra = sty('c-black bgc-info');
                } else {
                    clss.header = sty('c-black bgc-brand bold');
                    clss.sign = sty('c-brand bold');
                    clss.info = sty('c-black bgc-info bold');
                    clss.extra = sty('c-black bgc-cyan');
                }
                return clss[clsn];
            },

            //error 场景
            error(...args) {
                cgy.log.ready({scene:'error'});
                cgy.log(...args);
                cgy.log.current({scene:'normal'});
            },

            //success 场景
            success(...args) {
                cgy.log.ready({scene:'success'});
                cgy.log(...args);
                cgy.log.current({scene:'normal'});
            },
        }
    )
});

//正则验证
cgy.def({
    reg: cgy.proxyer(
        (...args) => {
            if (args.length<=0) return false;
            if (args.length==1) {
                if (cgy.is.nonEmptyObject(args[0])) {   //添加验证规则
                    cgy.reg.current(args[0]);
                } else if (cgy.is.string(args[0])) {    //调用某个规则
                    let creg = cgy.reg.current(args[0]),
                        rego = null;
                    if (cgy.is.defined(creg)) {
                        rego = new RegExp(creg);
                    } else {
                        try {
                            rego = new RegExp(args[0]);
                        } catch(e) {
                            rego = null;
                        }
                    }
                    cgy.reg.current({_reg_: rego});
                }
                return cgy.reg;
            } 
            if (args.length>=2) {   //直接验证正则
                let str = args[0],
                    reg = args[1];
                if (cgy.is.string(str) && cgy.is.string(reg)) {
                    return cgy.reg(reg).test(str);
                }
            }
            return cgy.reg;
        },
        {
            //regexp.test(str)
            test(str) {
                let reg = cgy.reg.current('_reg_');
                if (cgy.is.empty(reg)) return false;
                return reg.test(str);
            },
            //检查是否已经定义了 某个名为 regname 正则表达式
            support(regname) {
                return cgy.is.defined(cgy.reg.current(regname));
            }
        }
    )
});
cgy.reg({
    //中文姓名，2-4个字
    cn_name: '^[\\u4e00-\\u9fa5]{2,4}$',
    //手机号
    mobile: '^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\\d{8}$',
    //身份证
    sfz: '^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$',

    //css 颜色字符串
    //hex:  #fa0 | #fa07 | #ffaa00 | #ffaa0077
    hex:    '^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$',
    //rgb:  rgb(255,128,0) | rgb(100%,50%,0) | rgba(255,128,0,.5) | 新语法 rgb(255 128 0 / .5) | rgb(100% 50% 0 / 50%)
    rgb:    '^rgba?\(\s*(((\d|\d{2}|1\d{2}|2[0-5]{2})|(\d+(\.\d+)?%)|none)\s*(,|\s)\s*){2}((\d|\d{2}|1\d{2}|2[0-5]{2})|(\d+(\.\d+)?%)|none)((\s*,\s*|\s+\/\s+)((\.|0\.)\d+|\d+(\.\d+)?%|none))?\s*\)$',
    //hsl:  hsl(120,75,65) | hsl(120deg,75%,65%) | hsla(120,75,65,.5) | 新语法 hsl(120deg 75% 65% / 50%)
    hsl:    '^hsla?\(\s*(\d+(\.\d+)?(deg|grad|rad|turn)?|\d+(\.\d+)?%|(\.|0\.)\d+|none)(\s*,\s*|\s+)(\d+(\.\d+)?%?|(\.|0\.)\d+|none)(\s*,\s*|\s+)(\d+(\.\d+)?%?|(\.|0\.)\d+|none)((\s*,\s*|\s+\/\s+)(\d+(\.\d+)?%|(\.|0\.)\d+|none))?\s*\)$',
});

//扩展包 module
cgy.def({
    //引用 cgy 扩展包
    use(module) {
        if (!cgy.is.nonEmptyObject(module) || cgy.is.undefined(module.module)) {
            return cgy.moduleError();
        }
        let mdi = module.module,
            mdn = mdi.name,
            init = module.init;
        if (cgy.is.function(init)) {
            cgy.modules[mdn] = mdi;
            init(cgy);
        } else {
            return cgy.moduleError();
        }
    },

    //判断是否加载了某个扩展包
    moduleHas(module) {
        return cgy.is.defined(cgy.modules[module]);
    },
    //扩展包错误
    moduleError(errmsg) {
        errmsg = cgy.is.empty(errmsg) ? '无法引用 cgy 扩展包，缺少必要信息' : errmsg;
        throw new Error(errmsg);
    }
});

//es6 export
export default cgy;