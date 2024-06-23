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
            api(api) {
                let apia = [],
                    query = 'format=json';
                if (api.includes('?')) {
                    apia = api.split('?');
                    api = apia[0];
                    query = `${apia[1]}&${query}`;
                }
                api = api.trimAny('/');
                let pre = '';
                if (api.includes('/')) {
                    apia = api.split('/');
                    pre = cgy.requestApi[apia[0]];
                    if (cgy.is.undefined(pre)) {
                        pre = cgy.requestApi.default;
                    } else {
                        api = apia.slice(1).join('/');
                    }
                } else {
                    pre = cgy.requestApi.default;
                }
                return `${pre}/${api}?${query}`;
            },

            //JWT token 验证
            jwt(token) {
                let header = {
                    'Authorization': token
                };
                cgy.request.current({
                    header
                });
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
            opt(opt) {
                if (cgy.is.nonEmptyObject(opt)) cgy.request.current(opt);
                return cgy.request;
            },

            //确认发送请求，返回 promise
            send() {
                let opt = cgy.clone(cgy.request.current());
                cgy.request.current(null);
                console.log(opt);
                return axios(opt)
            },

            //解析 api 返回数据
            parse(res, resolve, reject) {
                let data = res.data;
                if (cgy.is.plainObject(data)) {
                    if ((data.type && data.type == 'Error') || (data.error && data.error == true)) {
                        if (data.error && data.error == true) {
                            data = data.data;
                        }
                        return reject({
                            errno: `${data.file} line ${data.line}`,
                            errMsg: `${data.title} ${data.msg}`
                        });
                    } else {
                        return resolve(data.data);
                    }
                } else {
                    return resolve(data);
                }
            }
        }
    ),

} ) }

export default request