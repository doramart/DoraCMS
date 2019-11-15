/*
 * @Author: doramart 
 * @Date: 2019-08-15 10:51:15 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-09-29 17:38:49
 */
const form = (ctx) => {

    return {

        type: {
            type: "string",
            required: true,
            message: ctx.__("validate_inputCorrect", [ctx.__("label_resourceType")])
        },
        comments: {
            type: "string",
            required: true,
            min: 2,
            max: 30,
            message: ctx.__("validate_inputCorrect", [ctx.__("label_comments")])
        },
    }

}

module.exports = {
    form
}