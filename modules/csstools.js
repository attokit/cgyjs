/**
 * cgy.js 库 csstools 扩展
 * css 工具，颜色计算等
 */

const csstools = {};

//cgy 扩展包信息，必须包含
csstools.module = {
    name: 'csstools',
    version: '0.1.0',
    cgyVersion: '2.0.0'
}

/**
 * 定义一个颜色处理类
 */
class Color {
    constructor(opt={}) {
        let ks = 'r,g,b,a,h,s,l'.split(','),
            df = (obj,arr) => arr.reduce((rst, k) => rst && typeof obj[k] != 'undefined', true),
            gt = (obj,arr) => arr.map(k=>obj[k]);
        //if (!df(opt.r, opt.g, opt.b, opt.a)) return false;
        if (df(opt, ks.slice(0,4))) ks.slice(0,4).forEach(k=>this[k]=opt[k]*1);
        if (df(opt, ks.slice(3))) ks.slice(3).forEach(k=>this[k]=opt[k]*1);
        if (!df(opt, ks.slice(0,3))) {
            let {r,g,b} = Color.hsl2rgb(this.h,this.s,this.l);
            this.r = r*1;
            this.g = g*1;
            this.b = b*1;
        }
        if (!df(opt, ks.slice(4))) {
            let {h,s,l} = Color.rgb2hsl(this.r,this.g,this.b);
            this.h = h*1;
            this.s = s*1;
            this.l = l*1;
        }

        //保存原始值
        this.origin = {};
        ks.forEach(k=>this.origin[k]=this[k]);

        //准备输出，将所有数字 从 0~1 转为 0~255/0~100，缓存于 outData
        //每次调用 out() 方法将更新 outData
        this.outData = {};

    }

    /**
     * 输出 hex rgb hsl
     */
    out() {
        let ks = 'r,g,b,a,s,l'.split(',');
        ks.slice(0,3).forEach(k=>{
            this.outData[k] = Color.it(this[k],255);
        });
        ks.slice(3,6).forEach(k=>{
            this.outData[k] = Color.it(this[k],100);
        });
        this.outData.h = Color.it(this.h,360);
        return this;
    }
    hex() {
        let od = this.outData,
            ts = num => (num<16?'0':'')+''+num.toString(16);
        return `#${ts(od.r)}${ts(od.g)}${ts(od.b)}`;
    }
    hexa() {
        let od = this.outData,
            a = Math.round(this.a*255);
        return this.hex()+''+(a<16 ? '0' : '')+a.toString(16);
    }
    rgb() {
        let od = this.outData;
        return `rgb(${od.r},${od.g},${od.b})`;
    }
    rgba() {
        let od = this.outData;
        return `rgba(${od.r},${od.g},${od.b},${od.a/100})`;
    }
    hsl() {
        let od = this.outData;
        return `hsl(${od.h},${od.s}%,${od.l}%)`;
    }
    hsla() {
        let od = this.outData;
        return `hsla(${od.h},${od.s}%,${od.l}%,${od.a}%)`;
    }
    //如果 a<100 则输出，否则不输出 a
    hex_a() {return this.a>=1 ? this.hex() : this.hexa();}
    rgb_a() {return this.a>=1 ? this.rgb() : this.rgba();}
    hsl_a() {return this.a>=1 ? this.hsl() : this.hsla();}
    toCss() {return this.a>=1 ? this.hex() : this.rgba();}

    /**
     * 颜色变换，加深/减淡/...
     */
    setRgb(rgb=[/* r,g,b */]) {
        let [r,g,b] = rgb;
        if (r!=undefined) this.r = r;
        if (g!=undefined) this.g = g;
        if (b!=undefined) this.b = b;
        let {h,s,l} = Color.rgb2hsl(this.r,this.g,this.b);
        this.h = h;
        this.s = s;
        this.l = l;
        //console.log({h,s,l});
        return this;
    }
    setHsl(hsl=[/* h,s,l */]) {
        let [h,s,l] = hsl;
        if (h!=undefined) this.h = h;
        if (s!=undefined) this.s = s;
        if (l!=undefined) this.l = l;
        let {r,g,b} = Color.hsl2rgb(this.h,this.s,this.l);
        this.r = r;
        this.g = g;
        this.b = b;
        //console.log({r,g,b});
        return this;
    }
    setAlpha(a) {
        a = a>1 ? 1 : a<0 ? 0 : a;
        this.a = a;
        return this;
    }
    darker(lvl=10) {

    }
    //brightness
    getBrightness() {
        return Color.brightness(this.r,this.g,this.b);
    }

    /**
     * 应用颜色
     */
    fill(selector) {
        let el = document.querySelector(selector);
        if (cgy.is.elm(el)) {
            el.style.backgroundColor = this.a>=100 ? this.out().hex() : this.out().rgb_a();
        }
    }
    colorLine(cavid="c_cav", steps=100) {
        let rd = Color.rd,
            s = steps,   //0-1 分成 s 份，每份 1/s
            si = rd(1/s);
            
        //初始hsl
        this.setHsl([0,1,1]);

        /* canvas */
        let cav = document.querySelector(`#${cavid}`),
            ctx = cav.getContext('2d');
        
        for (let i=0;i<s;i++) {
            this.setHsl([0,,]);
            for (let j=0;j<s;j++) {

                //canvas draw
                ctx.fillStyle = this.out().rgb();
                ctx.fillRect(j*5,i*5,5,5);  //左边距(i px)，上边距(0)，此单元宽度(1px)，此单元高度(1px)

                //变化
                console.log(si, this.l+si, rd(this.l+si));
                let h = rd(this.h+si);
                this.setHsl([h,,]);
                console.log({h});
            }
            let l = rd(this.l-si);
            this.setHsl([,,l]);
            console.log({l});
        }
    }

    /**
     * 正则匹配颜色字符串
     * 检查是否合法颜色字符串
     * 合法则返回 {r,g,b,a,h,s,l}
     */
    static getLegalColorOpt(str) {
        if (typeof str != 'string' || str=='') return false;
        if (str.includes('none')) return false;
        str = str.trim().toLowerCase();
        //正则匹配
        let regs = {
            //hex:  #fa0 | #fa07 | #ffaa00 | #ffaa0077
            hex:    /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
            //rgb:  rgb(255,128,0) | rgb(100%,50%,0) | rgba(255,128,0,.5) | 新语法 rgb(255 128 0 / .5) | rgb(100% 50% 0 / 50%)
            rgb:    /^rgba?\(\s*(((\d|\d{2}|1\d{2}|2[0-5]{2})|(\d+(\.\d+)?%)|none)\s*(,|\s)\s*){2}((\d|\d{2}|1\d{2}|2[0-5]{2})|(\d+(\.\d+)?%)|none)((\s*,\s*|\s+\/\s+)((\.|0\.)\d+|\d+(\.\d+)?%|none))?\s*\)$/,
            //hsl:  hsl(120,75,65) | hsl(120deg,75%,65%) | hsla(120,75,65,.5) | 新语法 hsl(120deg 75% 65% / 50%)
            hsl:    /^hsla?\(\s*(\d+(\.\d+)?(deg|grad|rad|turn)?|\d+(\.\d+)?%|(\.|0\.)\d+|none)(\s*,\s*|\s+)(\d+(\.\d+)?%?|(\.|0\.)\d+|none)(\s*,\s*|\s+)(\d+(\.\d+)?%?|(\.|0\.)\d+|none)((\s*,\s*|\s+\/\s+)(\d+(\.\d+)?%|(\.|0\.)\d+|none))?\s*\)$/
        };
        let m = null, opt = false;
        for (let k in regs) {
            if (regs[k].test(str)==true) {
                m = this[`parse${k.ucfirst()}String`];
                if (typeof m == 'function') {
                    opt = m.call(this, str);
                    if (opt!==false) {
                        //let ii = i => i>=0 && i<=1;
                        //console.log(opt);
                        break;
                    }
                }
                m = null;
                opt = false;
            }
        }
        return opt;
    }

    /**
     * 按字符串颜色类型解析，hex rgb hsl ...
     * 返回结果 like： {r:0,g:0,b:0,a:1} 所有数值均为 <1 浮点数，2位小数
     */
    static parseHexString(str) {  // #fa0 | #fa07 | #ffaa00 | #ffaa0077
        if (str.length==3 || str.length==4) str = '#'+str.substring(1).split('').map(i=>i+''+i).join('');
        let ss = (...as) => this.fl(parseInt(str.substring(...as),16),255),
            opt = {r: ss(1,3), g: ss(3,5), b: ss(5,7), a: 1};
        if (str.length==9) opt.a = ss(7);
        return opt;
    }
    static parseRgbString(str) {  //rgb(255,128,0) | rgb(100%,50%,0) | rgba(255,128,0,.5) | 新语法 rgb(255 128 0 / .5) | rgb(100% 50% 0 / 50%)
        str = str.replace('rgb(','').replace('rgba(','').replace(')','').trim();
        if (!str.includes(',')) {
            if (str.includes('/')) str = str.replace('/',',');
            str = str.replace(/\s+/g,',');
        }
        if (str.includes('.')&& !str.includes('0.')) str = str.replace('.','0.');
        let arr = str.split(','), rgb = [];
        for (let i=0;i<arr.length;i++) {
            let n = arr[i].trim(),
                max = i>2 ? 100 : 255;
            if (n.includes('%')) {
                n = n.substring(0,n.length-1);
                rgb.push(this.fl(n*1, max));
            } else {
                n = n*1;
                if (n>1) {
                    rgb.push(this.fl(n, max));
                } else {
                    rgb.push(n);
                }
            }
        }
        let [r,g,b] = rgb, a = 1;
        if (rgb.length>3) a = rgb[3];
        return {r,g,b,a};
    }
    static parseHslString(str) {//hsl:  hsl(120,75,65) | hsl(120deg,75%,65%) | hsla(120,75,65,.5) | 新语法 hsl(120deg 75% 65% / 50%)
        str = str.replace('hsl(','').replace('hsla(','').replace(')','').trim();
        if (!str.includes(',')) {
            if (str.includes('/')) str = str.replace('/',',');
            str = str.replace(/\s+/g,',');
        }
        //if (str.includes('.')&& !str.includes('0.')) str = str.replace('.','0.');
        let arr = str.split(','), hsl = [];
        for (let i=0;i<arr.length;i++) {
            let n = arr[i].trim(),
                max = i>0 ? 100 : 360;
            if (n.startsWith('.')) n = '0'+n;
            if (n.includes('deg')) n = n.replace('deg','');
            if (n.includes('%')) {
                n = n.substring(0,n.length-1);
                hsl.push(this.fl(n*1, max));
            } else {
                if (n.includes('grad')) {   //角度为百分度，1圆==400grad，max=400
                    n = n.replace('grad','');
                    hsl.push(this.fl(n*1, 400));
                } else if (n.includes('rad')) { //角度为弧度，1rad = 180/Π度，n*180/PI max=360
                    n = n.replace('rad','');
                    hsl.push(this.fl(n*1*180/Math.PI, 360));
                } else if (n.includes('turn')) {    //角度按旋转圈数，1圈=360
                    n = n.replace('turn','');
                    n = n*1; n = n>1 ? n-1 : n;
                    hsl.push(this.fl(n, 360));
                } else {    //默认按角度，0-360
                    n = n*1;
                    if (n>1) {
                        hsl.push(this.fl(n, max));
                    } else {
                        hsl.push(n);
                    }
                }
            }
        }
        let [h,s,l] = hsl, a = 1;
        if (hsl.length>3) a = hsl[3];
        return {h,s,l,a};
    }

    /**
     * rgb <--> hsl
     */
    static rgb2hsl(r,g,b) {
        //let h = this.hue(r,g,b), s = this.saturation(r,g,b), l = this.lightness(r,g,b);
        //return {h, s, l};

        //r /= 255, g /= 255, b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max == min) {
            h = s = 0; // achromatic
        } else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return Color.rda({ h, s, l });
    }
    static hsl2rgb(h,s,l) {

        let r, g, b;
        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            let hue2rgb = function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            }
            let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            let p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return Color.rda({r,g,b});
        //return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };


        /*const C = (1 - Math.abs(2 * l - 1)) * s;
        const hPrime = h / 60;
        const X = C * (1 - Math.abs(hPrime % 2 - 1));
        const m = l - C/2;
        let mr = n => Math.round(n*100)/100;
        const withLight = (r,g,b) => {return {r:mr(r+m), g:mr(g+m), b:mr(b+m)}};    //[r+m, g+m, b+m];
        if (hPrime <= 1) { 
            return withLight(C,X,0); 
        } else  if (hPrime <= 2) { 
            return withLight(X,C,0); 
        } else  if (hPrime <= 3) { 
            return withLight(0,C,X); 
        } else  if (hPrime <= 4) {
            return withLight(0,X,C); 
        } else  if (hPrime <= 5) { 
            return withLight(X,0,C); 
        } else  if (hPrime <= 6) { 
            return withLight(C,0,X); 
        }*/
    }
    static hsl2rgb2css(h,s,l) {
        let {r,g,b} = Color.hsl2rgb(h,s,l),
            it = Color.it;
        return `rgb(${it(r,255)},${it(g,255)},${it(b,255)})`;
    }
    
    /**
     * 色彩计算
     */
    //计算颜色的亮度
    static lightness(r,g,b) {
        return this.pc255((Math.max(r,g,b)+Math.min(r,g,b))/2);
    }
    //计算颜色的饱和度
    static saturation(r,g,b) {
        let l = this.lightness(r,g,b), 
            max = this.pc255(Math.max(r,g,b)), 
            min = this.pc255(Math.min(r,g,b));
        return (l===0||l===1) ? 0 : Math.round(((max-min)/(1-Math.abs(2*l-1)))*100)/100;
    }
    //计算颜色的色相
    static hue(r,g,b) {
        return Math.round(Math.atan2(Math.sqrt(3)*(g-b), 2*r-g-b)*180/Math.PI);
    }
    //计算颜色的明度，不同于亮度，brightness，0~1
    static brightness(r,g,b) {
        let bright = 0.299*r + 0.587*g + 0.114*b;
        return Color.rd(bright);
    }

    /**
     * tools
     */
    //数字转为 <1 浮点数，max 为分母  dig 为保留小数位数
    static fl(n, max=255, dig=4) {
        let d = Math.pow(10, dig);
        return Math.round(n*d/max)/d;
    }
    //<1 浮点数转为 整数
    static it(n, max=255) {
        return Math.round(n*max);
    }
    //保留 dig 位小数
    static rd(n, dig=4) {
        let d = Math.pow(10, dig);
        return Math.round(n*d)/d;
    }
    //对 {} 中所有数字保留 dig 位小数
    static rda(o={}, dig=4) {
        let oo = {};
        for (let i in o) {
            if (Number.isFinite(o[i])) {
                oo[i] = Color.rd(o[i], dig);
            }
        }
        return oo;
    }

}

//初始化方法，必须包含
csstools.init = cgy => { cgy.def( {

    /**
     * style link tools
     */

    //插入 <link rel=stylesheet href= />
    appendStyleLink(cssid, csshref) {
        let hd = document.querySelector('head'),
            csslink = document.querySelector(`#${cssid}`);
        if (cgy.is.empty(csslink) || !csslink.nodeName || csslink.nodeName!='LINK') {
            csslink = document.createElement('link');
            csslink.setAttribute('id', cssid);
            csslink.setAttribute('rel', 'stylesheet');
            csslink.setAttribute('href', csshref);
            hd.appendChild(csslink);
        }
    },

    //删除 <link rel=stylesheet href= />
    removeStyleLink(cssid) {
        let hd = document.querySelector('head'),
            csslink = document.querySelector(`#${cssid}`);
        if (!cgy.is.empty(csslink) && csslink.nodeName && csslink.nodeName=='LINK') {
            hd.removeChild(csslink);
        }
    },


    /**
     * css style
     */
    // {} --> css 语句
    toCssString(sty={}) {
        if (cgy.is.empty(sty) || !cgy.is.plainObject(sty)) return '';
        let s = [];
        for (let i in sty) {
            let ik = i.toSnakeCase('-');
            s.push(`${ik}:${sty[i]};`);
        }
        return s.join('');
    },
    //querySelector
    elm(selector) {return document.querySelector(selector)},
    elms(selector) {return document.querySelectorAll(selector)},
    //获取元素 style 样式
    elmStyle(el) {return window.getComputedStyle(el);},
    //获取 body/head 元素
    elmBody() {return document.querySelector('body');},
    elmHead() {return document.querySelector('head');},
    //获取某个元素的 box 模型四个顶点的坐标(相对于整个window的坐标，不是相对于父元素)[x,y, window.innerWidth-x, window.innerHeight-y]
    elmRect(el) {
        let cord = {
                lt: [0,0, 0,0],
                rt: [0,0, 0,0],
                lb: [0,0, 0,0],
                rb: [0,0, 0,0],
            },
            ww = window.innerWidth,
            wh = window.innerHeight;
        if (cgy.is.empty(el)) return cord;
        let bcr = el.getBoundingClientRect();
        //if (cgy.elmFixed(el)) {
        //    bcr = cgy.elmOffset(el);
        //}
        //console.log(bcr);
        let ew = bcr.width,
            eh = bcr.height,
            ef = bcr.left,
            et = bcr.top;
        cord.lt = [ef, et, ww-ef, wh-et];
        cord.rt = [ef+ew, et, ww-ef-ew, wh-et];
        cord.lb = [ef, et+eh, ww-ef, wh-et-eh];
        cord.rb = [ef+ew, et+eh, ww-ef-ew, wh-et-eh];
        return cord;
    },
    __elmRect(el) {
        let cord = {
                lt: [0,0, 0,0],
                rt: [0,0, 0,0],
                lb: [0,0, 0,0],
                rb: [0,0, 0,0],
            },
            ww = window.innerWidth,
            wh = window.innerHeight;
        if (cgy.is.empty(el)) return cord;
        let eo = cgy.elmOffset(el),
            ew = eo.width,
            eh = eo.height,
            ef = eo.left,
            et = eo.top;
        cord.lt = [ef, et, ww-ef, wh-et];
        cord.rt = [ef+ew, et, ww-ef-ew, wh-et];
        cord.lb = [ef, et+eh, ww-ef, wh-et-eh];
        cord.rb = [ef+ew, et+eh, ww-ef-ew, wh-et-eh];
        return cord;
    },
    //获取某个元素的实际 offset 位置与尺寸
    elmOffset(el) {
        let ofs = {
                left: el.offsetLeft,
                top: el.offsetTop,
                width: el.offsetWidth,
                height: el.offsetHeight
            },
            scroll = {
                x: window.scrollX,
                y: window.scrollY
            },
            p = el.parentNode,
            isd = cgy.is.defined,
            ism = cgy.is.empty,
            esty = cgy.elmStyle(el),
            hasfixed = false;
        if (el==cgy.elmBody()) {
            ofs.height = window.innerHeight;
            return ofs;
        }
        if (esty.position=='fixed') return ofs;
        while (!ism(p) && isd(p.nodeName) && p.nodeName!='BODY') {
            //console.log(p.getAttribute('class'), 'offsetLeft', p.offsetLeft, p.offsetTop);
            ofs.left += p.offsetLeft;
            ofs.top += p.offsetTop;
            if (cgy.elmStyle(p).position=='fixed') {
                hasfixed = true;
                break;
            }
            p = p.parentNode;
            //console.log(p.getAttribute('class'));
        }
        if (!hasfixed) {
            ofs.left -= scroll.x;
            ofs.top -= scroll.y;
        }
        return ofs;
    },
    //判断一个元素是否使用 fixed 定位，在另一个 fixed 定位的元素中也属于 fixed 定位
    elmFixed(el) {
        let p = el.parentNode,
            isd = cgy.is.defined,
            ism = cgy.is.empty,
            esty = cgy.elmStyle(el),
            hasfixed = false;
        if (esty.position=='fixed') return true;
        while (!ism(p) && isd(p.nodeName) && p.nodeName!='BODY') {
            if (cgy.elmStyle(p).position=='fixed') {
                hasfixed = true;
                break;
            }
            p = p.parentNode;
        }
        return hasfixed;
    },


    /**
     * animation tools
     */
    //为元素增加一个动画效果，需要 animate css 支持
    async addAnimateTo(el, ani, opt={}) {
        opt = cgy.extend({
            speed: 'fast'
        }, opt);
        let clss = [];
        if (cgy.is.defined(opt.delay)) {    //2,3,4,5
            clss.push('animate__delay-'+opt.delay+'s');
        }
        if (cgy.is.defined(opt.speed) && opt.speed!='none') {    //slow,slower,fast,faster
            clss.push('animate__'+opt.speed);
        }
        if (cgy.is.defined(opt.repeat)) {   //1,2,3,infinite
            if (opt.repeat=='infinite') {
                clss.push('animate__infinite');
            } else {
                clas.push('animate__repeat-'+opt.repeat);
            }
        }
        clss.push(ani.startsWith('animate__') ? ani : 'animate__'+ani);
        //console.log(clss);
        //先删除原有的动画类
        await cgy.removeAnimateFrom(el);
        //添加新动画效果
        await cgy.wait(10);
        let cl = el.classList;
        if (!cl.contains('animate__animated')) {
            cl.add('animate__animated');
        }
        for (let cli of clss) {
            cl.add(cli);
        }
        await cgy.wait(10);
        return el;
    },
    //删除元素已有的动画类
    async removeAnimateFrom(el, ani=null) {
        let cl = el.classList,
            rcl = [];
        if (cgy.is.string(ani)) {
            if (cl.contains('animate__'+ani)) {
                cl.remove('animate__'+ani);
            }
        } else {
            //删除 除 animate__animated 以外的 animate 类
            for (let i=0;i<cl.length;i++) {
                if (cl[i].startsWith('animate__') && cl[i]!='animate__animated') {
                    //cl.remove(cl[i]);
                    rcl.push(cl[i]);
                }
            }
            //console.log(rcl);
            if (rcl.length>0) {
                for (let cli of rcl) {
                    cl.remove(cli);
                }
            }
        }
        await cgy.wait(10);
        return el;
    },


    /**
     * fullscreen F11 全屏
     */
    //网页全屏转换
    toggleFullscreen() {
        let doc = window.document,
            docEl = doc.documentElement,
            requestFullscreen = docEl.requestFullscreen ||
                docEl.mozRequestFullScreen ||
                docEl.webkitRequestFullscreen || 
                docEl.msRequestFullscreen,
            exitFullscreen = doc.exitFullscreen ||
                doc.mozCancelFullScreen ||
                doc.webkitExitFullscreen ||
                doc.msExitFullscreen;
        if (cgy.isFullscreen()===false) {
            requestFullscreen.call(docEl);
        } else {
            exitFullscreen.call(doc);
        }
    },
    //判断当前是否是全屏状态
    isFullscreen() {
        let doc = window.document;
        if (
            !doc.fullscreenElement && 
            !doc.mozFullScreenElement && 
            !doc.webkitFullscreenElement &&
            !doc.msFullscreenElement
        ) {
            return false;
        } else {
            return doc.fullscreenElement || 
            doc.mozFullScreenElement || 
            doc.webkitFullscreenElement ||
            doc.msFullscreenElement;
        }
    },
    //监听 fullscreenchange 事件
    whenFullscreenChange(callback) {
        let doc = window.document;
        //监听 F11
        doc.addEventListener('keydown', function(evt) {
            if (evt.key === 'F11') {
                evt.preventDefault(); //阻止默认行为
                cgy.toggleFullscreen();
            }
        });
        //监听 fullscreenchange
        if (doc.exitFullscreen) doc.addEventListener('fullscreenchange', callback);
        if (doc.webkitExitFullscreen) doc.addEventListener('webkitfullscreenchange', callback);
        if (doc.mozCancelFullScreen) doc.addEventListener('mozfullscreenchange', callback);
        if (doc.msExitFullscreen) doc.addEventListener('MSFullscreenChange', callback);
    },


    /**
     * color tools
     */

    //Color 颜色处理类
    color: new Proxy(
        Color,
        {
            get(target, prop, receiver) {
                //console.log(prop);
                if (!cgy.is.string(prop)) return target;
                if (cgy.is.defined(target[prop])) return target[prop];
                if (prop.startsWith('toCss')) {
                    return str => {
                        let opt = Color.getLegalColorOpt(str);
                        if (opt===false) return '';
                        let clr = new Color(opt);
                        clr.out();
                        if (prop.includes('Hex')) return clr.hex_a();
                        if (prop.includes('Rgb')) return clr.rgb_a();
                        if (prop.includes('Hsl')) return clr.hsl_a();
                    }
                }
                let props = {
                    new: str => {
                        let opt = Color.getLegalColorOpt(str);
                        if (opt===false) return null;
                        return new Color(opt);
                    },
                    isLegalColor: str => Color.getLegalColorOpt(str)!==false,
                    //生成标准 RGB 色环
                    colorCircle: (canvasSelector, opt={}) => {
                        opt = cgy.extend({
                            size: 400,      //尺寸，px
                            steps: 1000,    //步数，颜色过渡的精细度，越大越精细
                            width: 50,      //色环的粗细，px
                            padding: 20,    //色环到画布边缘的距离，padding
                        }, opt);
                        let rd = Color.rd,
                            h2css = Color.hsl2rgb2css,
                            s = opt.steps,   //0-1 分成 s 份，每份 1/s
                            si = rd(1/s),
                            //标准 RGB 色环，R在最上，G在左120度，B在右120度，逆时针旋转
                            //而 canvas 圆弧是从 x轴左侧开始，顺时针画弧，因此需要：整体旋转1/4圈，逆时针画弧
                            //旋转一圈=1，计算 <1 的浮点数代表的弧度数，
                            arc = n => -1*(n+0.25)*2*Math.PI, 
                            hsl = [0,1,0.5]; //初始hsl

                        //准备 canvas
                        let canvas = cgy.is.elm(canvasSelector) ? canvasSelector : document.querySelector(canvasSelector);
                        canvas.width = opt.size; canvas.height = opt.size;
                        let ctx = canvas.getContext('2d'),
                            c = {x: opt.size/2, y: opt.size/2}, //画布中心点为圆心
                            //要画一个扇面形，有 2 个半径
                            r1 = (opt.size/2) - opt.padding,
                            r2 = r1 - opt.width;
                        
                        //通过渐变 hsl 中的 h 生成色环
                        for (let i=0;i<s;i++) {
                            let rgb = h2css(...hsl),
                                h = rd(hsl[0]+si),
                                //要画 2 个圆弧，但是圆弧的两端弧度是一样的，只是画弧方向相反
                                arc_s = arc(hsl[0]),    //外圆弧起始，内圆弧结束 弧度
                                arc_e = arc(h),         //外圆弧结束，内圆弧起始 弧度
                                //要求出内圆弧起始点的坐标，因为先画外圆弧，结束后要 lineTo(x,y) 到内圆弧起始点，需要知道内圆弧起点的坐标
                                dx = c.x - Math.sin(h*2*Math.PI)*r2,
                                dy = c.y - Math.cos(h*2*Math.PI)*r2;
                            //路径开始
                            ctx.beginPath();
                            //当前色环段颜色
                            ctx.fillStyle = rgb; //console.log(rgb);
                            ctx.strokeStyle = rgb;
                            //画外圆弧，逆时针
                            ctx.arc(c.x, c.y, r1, arc_s, arc_e, true); //最后参数 true 表示逆时针旋转画弧
                            //转到内圆弧起点
                            ctx.lineTo(dx, dy);
                            //画内圆弧，顺时针
                            ctx.arc(c.x, c.y, r2, arc_e, arc_s, false);
                            //完成路径
                            ctx.closePath();
                            //填充颜色
                            ctx.fill();
                            //描边，不描边会有摩尔纹
                            ctx.stroke();
                            //保存进行步骤
                            hsl[0] = h;
                            //console.log({h,s:arc_s,e:arc_e});
                            //await cgy.wait(100);
                            //break;
                        }
                    },
                    //生成标准色换内接 四边形 亮度/饱和度 选取块
                    colorSquare: (canvasSelector, hue=0, opt={}) => {
                        opt = cgy.extend({         //必须指定 h
                            size: 400,      //尺寸，px
                            steps: 1000,    //步数，颜色过渡的精细度，越大越精细
                        }, opt);
                        let rd = Color.rd,
                            h2css = Color.hsl2rgb2css,
                            s = opt.steps,   //0-1 分成 s 份，每份 1/s
                            si = rd(1/s),
                            //初始hsl
                            hsl = [hue,0,1];

                        //准备 canvas
                        let canvas = cgy.is.elm(canvasSelector) ? canvasSelector : document.querySelector(canvasSelector);
                        canvas.width = opt.size; canvas.height = opt.size;
                        let ctx = canvas.getContext('2d');

                        for (let i=0;i<s;i++) {
                            hsl[1] = 0;
                            /*let sn;
                            if (i<s/2) {
                                sn = 2*i;
                                sn = sn>s ? s : sn;
                            } else {
                                sn = (s-i)*2;
                                sn = sn<0 ? 0 : sn;
                            }*/
                            for (let j=0;j<s;j++) {
                                let rgb = h2css(...hsl),
                                    ix = opt.size/s;
    
                                ctx.fillStyle = rgb;
                                ctx.fillRect(j*ix, i*ix, ix, ix);
    
                                hsl[1] = rd(hsl[1]+si);
                            }
                            hsl[2] = rd(hsl[2]-si);
                        }

                    },
                    //生成标准色换内接 正三角形 亮度/饱和度 选取块
                    colorTriangle: (canvasSelector, hue=0, opt={}) => {
                        opt = cgy.extend({         //必须指定 h
                            size: 400,      //canvas尺寸，px
                            height: 300,    //三角形高
                            bottom: 280,    //正三角形边长
                            //steps: 1000,    //步数，横向步数=边长，竖向步数=高
                        }, opt);
                        let rd = Color.rd,
                            h2css = Color.hsl2rgb2css,
                            sx = Math.round(opt.bottom),   //0-1 横向分成 sx 份，每份 1/sx
                            sy = Math.round(opt.height),   //0-1 竖向分成 sy 份，每份 1/sy
                            sxi = rd(1/sx),
                            syi = rd(1/sy),
                            gl = (opt.size-opt.bottom)/2,    //三角形并不贴着 canvas 左边，有一个 left 偏移量
                            //初始hsl
                            hsl = [hue,1,0];

                        //准备 canvas
                        let canvas = cgy.is.elm(canvasSelector) ? canvasSelector : document.querySelector(canvasSelector);
                        canvas.width = opt.size; canvas.height = opt.size;
                        let ctx = canvas.getContext('2d');

                        for (let i=0;i<sy;i++) {
                            hsl[2] = 0;
                            let sn = Math.round(i*(sx/sy)),
                                sl = (sx-sn)/2,
                                l0 = rd(sxi*(sx-sn)/2);
                                //console.log(l0);
                                hsl[2] = l0;
                            for (let j=0;j<sn;j++) {
                                let rgb = h2css(...hsl),
                                    l = sl+j;

                                    //console.log(l, i*syi, sxi, syi);
    
                                ctx.fillStyle = rgb;
                                ctx.fillRect(gl+l, i, 2,1);
    
                                hsl[2] = rd(hsl[2]+sxi);
                            }
                            hsl[1] = rd(hsl[1]-syi);
                        }
                    },
                    //生成色带，可选 饱和度/亮度 渐变色带
                    //hue(0~1 或 0~360，指在色环上的角度，0为红色) 代表具体的颜色，只有指定某个具体的颜色，才能生成针对此颜色的 饱和度/亮度 渐变色带
                    colorBar: (canvasSelector, hue=0, opt={}) => {
                        opt = cgy.extend({
                            steps: 1000,    //步数，颜色过渡的精细度，越大越精细
                            trans: 1,       //按 饱和度/亮度 渐变，1=饱和度，2=亮度
                            width: 400,     //色带的长度
                            height: 24,     //色带高度，px
                        }, opt);
                        let rd = Color.rd,
                            h2css = Color.hsl2rgb2css,
                            s = opt.steps,   //0-1 分成 s 份，每份 1/s
                            si = rd(1/s),
                            //初始hsl
                            hsl = [hue,0,1];
                        hsl[opt.trans] = 0;
                        if (opt.trans==1) {
                            hsl[2] = 0.5;
                        } else {
                            hsl[1] = 1;
                        }

                        //准备 canvas
                        let canvas = cgy.is.elm(canvasSelector) ? canvasSelector : document.querySelector(canvasSelector);
                        canvas.width = opt.width; canvas.height = opt.height;
                        let ctx = canvas.getContext('2d');

                        for (let i=0;i<s;i++) {
                            let trans = opt.trans,
                                v = hsl[trans],
                                w = opt.width,
                                dx = v * w,
                                dw = si * w,
                                dh = opt.height,
                                rgb = h2css(...hsl);

                            ctx.fillStyle = rgb;
                            ctx.fillRect(dx, 0, dw, dh);

                            hsl[trans] = rd(v+si);
                        }
                    }
                }
                if (cgy.is.defined(props[prop])) return props[prop];
                return undefined;
            }
        }
    ),


    /**
     * Mask 遮罩层对象
     *      cgy.mask()
     *              .show()
     *              .hide()     如果当前 仍有元素的 need-mask 属性 == yes 则无法 hide
     *              .get()  --> element
     *              .addClass(classname, classname, ...)
     *              .removeClass(classname, classname, ...)
     */
    mask: cgy.proxyer(
        (selector='.cv-mask') => {
            let body = document.querySelector('body'),
                cmask = document.querySelectorAll(selector),
                mask = cgy.mask.get();
            if (cmask.length>0) {
                cgy.mask.current({
                    mask: cmask[0]
                });
            } else {
                if (cgy.is.undefined(mask)) {
                    cgy.mask.create();
                }
            }
            return cgy.mask;
        },{
            create() {
                let body = document.querySelector('body'),
                    mask = document.createElement('div');
                mask.classList.add('cv-mask');
                body.appendChild(mask);
                cgy.mask.current({
                    mask
                });
                return cgy.mask;
            },
            get: () => cgy.mask.current('mask'),
            addClass(...clss) {
                let mask = cgy.mask.get(),
                    cl = mask.classList;
                for (let cls of clss) {
                    if (!cl.contains(cls)) {
                        cl.add(cls);
                    }
                }
                return cgy.mask;
            },
            removeClass(...clss) {
                let mask = cgy.mask.get(),
                    cl = mask.classList;
                for (let cls of clss) {
                    if (cl.contains(cls)) {
                        cl.remove(cls);
                    }
                }
                return cgy.mask;
            },
            needMask() {
                let body = document.querySelector('body'),
                    cds = body.childNodes,
                    need = false;
                for (let i=0;i<cds.length;i++) {
                    let cdi = cds[i],
                        nm = cdi.getAttribute('need-mask');
                    if (nm=='yes') {
                        need = true;
                        break;
                    }
                }
                return need;
            },
            hide() {
                if (cgy.mask.needMask()) {
                    return cgy.mask.removeClass('mask-show');
                }
                return cgy.mask;
            },
            show: () => cgy.mask.addClass('mask-show'),
        }
    ),


    //255 -> ff
    colorDecToHex(num = 0) {
        num = Math.round(num);
        let s = num.toString(16);
        if (num<16) s = `0${s}`;
        return s;
    },

    //#ffffff -> [255, 255, 255]
    colorRgb(colorHex = '#000000') {
        //console.log(colorHex);
        let ch = colorHex.trimAnyStart('#');
        return [    //[r,g,b]
            parseInt(ch.substring(0, 2), 16),
            parseInt(ch.substring(2, 4), 16),
            parseInt(ch.substring(4), 16)
        ];
    },

    //'rgb(0,0,0,.5)' -> [0,0,0,0.5]
    rgbStrToArr(str = 'rgb(0,0,0,.5)') {
        let arr = str.split(',');
        return arr.map(i=>{
            i = i.trim();
            i = i.trimAny('rgb');
            i = i.trimAny('(');
            i = i.trimAny(')');
            if (i.startsWith('.')) i = '0'+i;
            return i*1;
        });
    },

    //[255, 255, 255] -> #ffffff
    //如果包含 alpha 透明度，则丢弃
    colorHex(rgb = [0,0,0]) {
        if (rgb.length>3) rgb.splice(0,3);
        let s = rgb.map(i=>cgy.colorDecToHex(i));
        return `#${s.join('')}`;
    },

    //色值计算，darker or lighter 加深 或 减淡
    //level > 0 加深；   level < 0 减淡；   百分比
    colorShift(colorHex = '#000000', level = 10) {
        let rgb = cgy.colorRgb(colorHex),
            lvl = level / 100,
            nrgb = rgb.map(i=>{
                let ni = i + Math.round(255 * lvl);
                ni = ni>255 ? 255 : (ni<0 ? 0 : ni);
                return ni;
            });
        return cgy.colorHex(nrgb);
    },

    //计算背景色值的亮度，用于确定前景色 #000 or #fff
    colorBrightness(hex = '#ffffff') {
        let rgb = cgy.colorRgb(hex),
            bright = 0.299*rgb[0] + 0.587*rgb[1] + 0.114*rgb[2];
        return Math.round(bright);
    },



} ) }

export default csstools;