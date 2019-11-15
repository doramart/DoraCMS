/**
 * @api {get} /api/createQRCode 获取二维码
 * @apiDescription 根据链接获取二维码
 * @apiName createQRCode
 * @apiGroup Normal
 * @apiParam {string} text 需要转成二维码的字符(必填)
 * @apiSuccess {json} result
 * @apiSampleRequest http://localhost:8080/api/createQRCode
 * @apiVersion 1.0.0
 */




/**
 * @api {post} /api/upload/files 文件上传
 * @apiDescription 文件上传，上传用户头像等
 * @apiName /api/upload/files
 * @apiGroup Normal
 * @apiParam {file} file 文件
 * @apiParam {string} token 登录时返回的参数鉴权
 * @apiSuccess {json} result
 * @apiSuccessExample {json} Success-Response:
 *{
 *    "status": 200,
 *    "message": "get data success",
 *    "server_time": 1544167579835,
 *    "data": 
 *    {
 *       "path": "http://creatorchain.oss-cn-hongkong.aliyuncs.com/upload/images/img1544167579253.png" // 文件链接
 *    } 
 *}
 * @apiSampleRequest http://localhost:8080/api/upload/files
 * @apiVersion 1.0.0
 */


/**
 * @api {get} /api/getImgCode 获取图片二维码
 * @apiDescription 获取图片二维码，用于登录校验等场景
 * @apiName /getImgCode
 * @apiGroup Normal
 * @apiSuccess {json} result
 * @apiSampleRequest http://localhost:8080/api/getImgCode
 * @apiVersion 1.0.0
 */