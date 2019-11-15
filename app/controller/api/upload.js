/*
 * @Author: doramart 
 * @Date: 2019-08-16 16:06:21 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-11-02 22:15:40
 */
const Controller = require('egg').Controller;
const awaitWriteStream = require('await-stream-ready').write
const sendToWormhole = require('stream-wormhole')
const fs = require('fs')
const path = require('path')


let confirmPath = (path) => {
    return new Promise(function (resolve, reject) {
        let waitCheck = () => {
            setTimeout(() => {
                if (!fs.existsSync(path)) {
                    if (checkPathNum == 3) {
                        resolve(fs.existsSync(path));
                    } else {
                        checkPathNum++;
                        waitCheck();
                    }
                } else {
                    resolve(fs.existsSync(path));
                }
            }, 200);
        }
        waitCheck();
    })
}

let checkFilePath = async function (path) {
    checkPathNum = 0;
    return await confirmPath(path);
};


let updateLogoPath = async (ctx, model, targetFiles = []) => {

    let targetItemList = await ctx.service[model].find({
        isPaging: '0'
    })
    for (const targetItem of targetItemList) {

        for (const fileItem of targetFiles) {

            if (targetItem[fileItem]) {
                var reg = new RegExp('/upload/', "g");
                let oldfile = targetItem[fileItem];
                let newFile = oldfile.replace(reg, '/static/upload/');
                let newObj = {};
                newObj[fileItem] = newFile;
                await ctx.service[model].update(ctx, targetItem._id, newObj);
            }

        }

    }

}

class UploadController extends Controller {


    // 上传单个文件
    async create() {
        const {
            ctx,
            service
        } = this

        //存放目录
        let updatePath = `${this.app.config.upload_path}/upload/images/`;
        let updateVideoPath = `${this.app.config.upload_path}/upload/videos/`;
        let updateAudioPath = `${this.app.config.upload_path}/upload/audios/`;
        let updateOtherPath = `${this.app.config.upload_path}/upload/others/`;
        // 要通过 ctx.getFileStream 便捷的获取到用户上传的文件，需要满足两个条件：
        // 只支持上传一个文件。
        // 上传文件必须在所有其他的 fields 后面，否则在拿到文件流时可能还获取不到 fields。
        const stream = await ctx.getFileStream();
        let fileParams = stream.fields;
        let askFileType = fileParams.type || 'image'; // 默认上传图片
        // console.log('--askFileType--', askFileType);
        // 文件类型校验
        if (askFileType == 'image') {

        } else if (askFileType == 'video') {
            updatePath = updateVideoPath;
        } else if (askFileType == 'audio') {
            updatePath = updateAudioPath;
        } else {
            updatePath = updateOtherPath;
        }
        if (!fs.existsSync(updatePath)) {
            fs.mkdirSync(updatePath);
        }
        // 所有表单字段都能通过 `stream.fields` 获取到
        const filename = path.basename(stream.filename) // 文件名称
        const extname = path.extname(stream.filename).toLowerCase() // 文件扩展名称
        if (!extname) {
            throw new Error(res.__('validate_error_params'));
        }
        // 生成文件名
        let ms = (new Date()).getTime().toString() + extname;
        const attachment = {};
        attachment.extname = extname || 'hello'
        attachment.filename = filename

        const target = path.join(updatePath, `${ms}`)
        const writeStream = fs.createWriteStream(target)

        // 文件处理，上传到云存储等等
        try {
            await awaitWriteStream(stream.pipe(writeStream))
        } catch (err) {
            // 必须将上传的文件流消费掉，要不然浏览器响应会卡死
            await sendToWormhole(stream)
            throw err
        }
        // 设置响应内容和响应状态码
        ctx.helper.renderSuccess(ctx, {
            data: {
                path: `${this.app.config.static.prefix}/upload/images/${ms}`
            }
        });
    }

    async updateImgs() {

        let ctx = this.ctx
        updateLogoPath(ctx, 'adminUser', ['logo']);
        updateLogoPath(ctx, 'adsItem', ['sImg']);
        updateLogoPath(ctx, 'content', ['sImg', 'comments', 'simpleComments']);
        updateLogoPath(ctx, 'user', ['logo']);

        ctx.helper.renderSuccess(ctx);

    }

}

module.exports = UploadController;