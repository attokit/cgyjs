/**
 * cgy.js 库 convert 扩展
 * 数据类型转换，通常用于 数据库读取的 data 转换为 前端展示格式
 */

const conv = {};

//cgy 扩展包信息，必须包含
conv.module = {
    name: 'convert',
    version: '0.1.0',
    cgyVersion: '2.0.0'
}

//初始化方法，必须包含
conv.init = cgy => { cgy.def( {

    /**
     * 数据类型转换
     * cgy.convert(anything).toString()
     *                      .toArray()
     *                      .toObject()
     *                      .toJsonString()
     *                      ...
     *                      .to('string')
     *                      ...
     */
    convert: cgy.proxyer(
        anything => {
            cgy.convert.current(null);
            cgy.convert.current({
                raw: anything
            });
            return cgy.convert;
        },
        {

        }
    )

} ) }