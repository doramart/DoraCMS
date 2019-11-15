/*
 * @Author: doramart 
 * @Date: 2019-11-02 18:38:55 
 * @Discription 404 filter
 * @Last Modified by: doramart
 * @Last Modified time: 2019-11-02 18:43:56
 */
module.exports = () => {
    return async function notFoundHandler(ctx, next) {
        await next();
        if (ctx.status === 404 && !ctx.body) {
            if (ctx.acceptJSON) {
                ctx.body = {
                    error: 'Not Found'
                };
            } else {
                if (ctx.originalUrl.indexOf('/admin/') == 0) {
                    ctx.redirect('/admin/login');
                } else {
                    ctx.body = '<h1>Page Not Found</h1>';
                }

            }
        }
    };
};