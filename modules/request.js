/**
 * cgy.js 库 request 扩展
 * 使用 axios
 */

const request = {}

//cgy 扩展包信息，必须包含
request.module = {
    name: 'wxm',
    version: '0.1.1',
    cgyVersion: '2.0.0'
}

//初始化方法，必须包含
request.init = cgy => { cgy.def( {

    /**
     * 预定义的 api prefix
     */
    requestApi: {
        //默认
        default: 'https://cgy.design/api/'
    },
    
    /**
     * 异步方式访问 api
     * 使用 axios 创建 ajax 请求
     * @param {String} api      foo/bar
     * @param {Object} opt      axios request argument
     * @return {Promise}
     * 
     * cgy.request(api)
     *      .post(data)
     *      .jwt(token)
     *      .opt(opt)
     *          .send()
     *              .then(...)
     */
    request: cgy.proxyer(
        api => {
            cgy.request.current(null);
            cgy.request.current({
                url: cgy.request.api(api)
            });
            return cgy.request;
        },
        {
            //设定 api prefix
            setApiPrefix(apiPrefix = {}) {
                if (cgy.is.empty(apiPrefix)) return cgy.request;
                if (cgy.is.undefined(cgy.requestApi)) {
                    cgy.def({
                        requestApi: {}
                    });
                }
                for (let [apin, api] of Object.entries(apiPrefix)) {
                    cgy.requestApi[apin] = api;
                }
                return cgy.request;
            },

            //解析取得 api 地址
            api(api='') {
                let apia = [],
                    query = 'format=json';
                if (api.includes('?')) {
                    apia = api.split('?');
                    api = apia[0];
                    query = `${apia[1]}&${query}`;
                }
                let pre = '';
                if (api=='') {
                    pre = cgy.requestApi.default;
                } else {
                    api = api.trimAny('/');
                    let apia = api.split('/');
                    pre = cgy.requestApi[apia[0]];
                    if (cgy.is.undefined(pre)) {
                        pre = cgy.requestApi.default;
                    } else {
                        api = apia.slice(1).join('/');
                    }
                }
                pre = pre.trimAnyEnd('/');
                api = api=='' ? '' : `/${api}`;
                //console.log(pre, api, query);
                return `${pre}${api}?${query}`;
            },

            //headers
            headers(hds={}) {
                let opt = cgy.request.current(),
                    headers = opt.headers ?? {};
                headers = cgy.extend(headers, hds);
                if (cgy.is.nonEmptyObject(headers)) {
                    cgy.request.current({headers});
                }
                return cgy.request;
            },

            //JWT token 验证
            jwt(token=null) {
                if (!cgy.is.string(token) || token=='') {
                    token = !window.localStorage.getItem('token') ? null : window.localStorage.getItem('token');
                }
                if (cgy.is.string(token) && !cgy.is.empty(token)) {
                    return cgy.request.headers({
                        'Authorization': token
                    });
                }
                return cgy.request;
            },

            //post 数据到 api
            post(data) {
                cgy.request.current({
                    method: 'POST',
                    data
                });
                return cgy.request;
            },

            //设置其他 axios request options 
            opt(opt={}) {
                if (cgy.is.nonEmptyObject(opt)) cgy.request.current(opt);
                return cgy.request;
            },

            //确认发送请求，返回 promise
            async send() {
                let opt = cgy.clone(cgy.request.current());
                //cgy.request.current(null);
                //console.log(opt);
                let res = await axios(opt).catch(err=>{
                    return cgy.request.handleRequestError(err);
                });
                if (res!=null) {
                    return cgy.request.parse(res);
                }
                
                //清空本次的 request 参数
                cgy.request.current(null);
                return null;
            },

            //处理 request error
            handleRequestError(err) {
                //console.log(err);
                /*let {code, name, message, request, config} = err,
                    opt = cgy.request.current()
                    url = opt.url;
                if (message=='Network Error') {
                    this.$attoAlert(
                        'error', 
                        `当前网络已中断，点击「确定」按钮尝试刷新此页面并重新连接网络。`, 
                        '网络中断',
                        {
                            callback: action => {
                                if (action=='confirm') {
                                    window.location.reload();
                                }
                            }
                        }
                    );
                } else {
                    this.$attoAlert(
                        'error', 
                        `[${code}] ${message}<br><br>地址：${url}<br>方法：${config.method}<br>响应：${config.responseType}<br>查看控制台输出的错误信息`, 
                        '网络请求失败'
                    );
                }*/

                //清空本次的 request 参数
                cgy.request.current(null);

                throw new Error(err);
                return null;
            },

            //处理 response error
            handleResponseError(code, error) {
                let opt = {};
                //按 code 来处理
                switch (code) {
                    case 'empty':       //没有返回值
                        error = {
                            msg: '接口没有返回任何值',
                            title: '接口返回空值',
                            file: 'null',
                            line: 0
                        };
                        break;
                    case 'jwterror':    //jwt token 验证失败
                        /*opt = {
                            confirmButtonText: '重新登录',
                            callback: action => {
                                //this.$logout('',true);
                            }
                        };*/
                        break;
    
                    default: 
                        break;
                }
                //弹出错误提示
                //this.$attoAlert('error', error.msg, error.title, opt);

                //清空本次的 request 参数
                cgy.request.current(null);

                //throw error
                let errmsg = `${error.title}：${error.msg} in File: ${error.file} at Line ${error.line}`;
                throw new Error(errmsg);
                return null;
            },

            //解析 api 返回数据
            parse(res) {
                //console.log(res);
                let rd = res.data,
                    is = cgy.is;
                if (is.null(rd)) {
                    console.log(res);
                    return cgy.request.handleRequestError('Empty Response Data from Api');
                } else if (is.string(rd)) {
                    console.log(res);
                    console.log(rd);
                    if (rd.includes('error')) {
                        return cgy.request.handleRequestError(rd);
                    } else {
                        console.log('Message from Api:', rd);
                        //清空本次的 request 参数
                        cgy.request.current(null);
                        return null;
                    }
                }
                if (rd.error==true || is.undefined(rd.data) || is.null(rd.data) || (is.defined(rd.data.error) && rd.data.error==true)) {
                    if (is.undefined(rd.data) && !is.empty(rd)) {
                       return rd;
                    }
                    console.log(res);
                    console.log(rd);
                    return cgy.request.handleResponseError(code, rd.data);
                } else {
                    //清空本次的 request 参数
                    cgy.request.current(null);
                    return rd.data;
                }
            }
        }
    ),

} ) }

export default request