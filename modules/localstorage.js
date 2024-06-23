/**
 * cgy.js 库 convert 扩展
 * 操作 localStorage
 */

const lcs = {};

//cgy 扩展包信息，必须包含
lcs.module = {
    name: 'localstorage',
    version: '0.1.0',
    cgyVersion: '2.0.0'
}

//初始化方法，必须包含
lcs.init = cgy => { cgy.def( {

    /**
     * 操作 localStorage
     */
    localStorage: cgy.proxyer(
        (baseOptions={}) => {
            cgy.convert.current(null);
            cgy.convert.current(cgy.extend({

            }, baseOptions));
            return cgy.localStorage;
        },
        {
            $get: key => window.localStorage.getItem(key),
            $set: (key,val) => window.localStorage.setItem(key, val),
            $del: key => {window.localStorage.removeItem(key)},
            getFormData(xpath) {
                let key = 'formdata_'+xpath.replace(/\//g, '_'),
                    fd = cgy.localStorage.$get(key);
                if (!fd) return {};
                return JSON.parse(fd);
            },
            setFormData(xpath, data={}) {
                let key = 'formdata_'+xpath.replace(/\//g, '_'),
                    lcs = cgy.localStorage.getFormData(xpath);
                data = (cgy.is.plainObject(data) && !cgy.is.empty(data)) ? data : {};
                if (!cgy.is.empty(lcs)) {
                    data = cgy.extend(lcs, data);
                }
                data = !cgy.is.empty(data) ? JSON.stringify(data) : '{}';
                return cgy.localStorage.$set(key, data);
            },
            removeFormData(xpath) {
                let key = 'formdata_'+xpath.replace(/\//g, '_');
                return cgy.localStorage.$del(key);
            }

        }
    )

} ) }

export default lcs;