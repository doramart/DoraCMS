/*
 * @Author: doramart 
 * @Date: 2019-06-27 16:05:05 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-25 10:06:41
 */


exports.validateForm = async (res, controlName, source) => {

    let checkRule = '';
    switch (controlName) {
        case 'user':
            checkRule = this.userFormData;
            break;
        case 'adminGroup':
            checkRule = this.adminGroupFormData;
            break;
        case 'adminResource':
            checkRule = this.adminResourceFormData;
            break;
        case 'adminUser':
            checkRule = this.adminUserFormData;
            break;
        case 'ads':
            checkRule = this.adsFormData;
            break;
        case 'contentCategory':
            checkRule = this.contentCategoryFormData;
            break;
        case 'contentTag':
            checkRule = this.contentTagFormData;
            break;
        case 'message':
            checkRule = this.messageFormData;
            break;
        case 'helpCenter':
            checkRule = this.helpCenterFormData;
            break;
        case 'notify':
            checkRule = this.notifyFormData;
            break;
        case 'systemConfig':
            checkRule = this.systemConfigFormData;
            break;
        case 'versionManage':
            checkRule = this.versionManageFormData;
            break;
        case 'content':
            checkRule = this.contentFormData;
            break;
        case 'adminUserLogin':
            checkRule = this.adminUserLoginFormData;
            break;
        case 'contentTemplate':
            checkRule = this.contentTemplateFormData;
            break;

        default:
            break;
    }
    return validate({
        descriptor: checkRule(res),
        source
    });


}


exports.userFormData = (res) => {
    return {
        userName: {
            type: "string",
            required: true,
            min: 2,
            max: 30,
            // pattern: /^[a-z]+$/,
            message: res.__("validate_error_field", {
                label: res.__("label_user_userName")
            })
        },
        email: {
            type: "email",
            required: true,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_user_email")
            })
        },
        phoneNum: {
            type: "string",
            required: true,
            // len: 11,
            message: "invalid phoneNum"
        },
    }
};

exports.adminGroupFormData = (res) => {
    return {
        name: {
            type: "string",
            required: true,
            min: 2,
            max: 50,
            message: res.__("validate_error_field", {
                label: res.__("label_name")
            })
        },
        comments: {
            type: "string",
            required: true,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_comments")
            })
        }
    }
};

exports.adminResourceFormData = (res) => {
    return {
        label: {
            type: "string",
            required: true,
            min: 2,
            max: 40,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_resourceName")
            })
        },
        type: {
            type: "string",
            required: true,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_resourceType")
            })
        },
        comments: {
            type: "string",
            required: true,
            min: 2,
            max: 30,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_comments")
            })
        },
    }
};

exports.adminUserFormData = (res) => {
    return {
        userName: {
            type: "string",
            required: true,
            min: 5,
            max: 12,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_user_userName")
            })
        },
        name: {
            type: "string",
            required: true,
            min: 2,
            max: 6,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_name")
            })
        },
        email: {
            type: "email",
            required: true,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_user_email")
            })
        },
        phoneNum: {
            type: "string",
            required: true,
            // len: 11,
            message: "invalid phoneNum"
        },
        countryCode: {
            type: "string",
            required: true,
        },
        comments: {
            type: "string",
            required: true,
            min: 5,
            max: 30,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_comments")
            })
        },
    }
};

exports.adsFormData = (res) => {
    return {
        name: {
            type: "string",
            required: true,
            min: 2,
            max: 15,
            message: res.__("validate_error_field", {
                label: res.__("label_ads_name")
            })
        },
        comments: {
            type: "string",
            required: true,
            min: 5,
            max: 30,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_comments")
            })
        }
    }
};

exports.contentCategoryFormData = (res) => {
    return {
        name: {
            type: "string",
            required: true,
            min: 2,
            max: 20,
            message: res.__("validate_error_field", {
                label: res.__("label_cate_name")
            })
        },
        defaultUrl: {
            type: "string",
            required: true,
            message: res.__("validate_error_field", {
                label: res.__("label_cate_seourl")
            })
        },
        comments: {
            type: "string",
            required: true,
            min: 4,
            max: 100,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_comments")
            })
        }
    }
};


exports.contentTagFormData = (res) => {
    return {
        name: {
            type: "string",
            required: true,
            min: 1,
            max: 12,
            message: res.__("validate_error_field", {
                label: res.__("label_tag_name")
            })
        },
        comments: {
            type: "string",
            required: true,
            min: 2,
            max: 30,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_comments")
            })
        }
    }
};

exports.helpCenterFormData = (res) => {
    return {
        name: {
            type: "string",
            required: true,
            min: 1,
            max: 50,
            message: res.__("validate_error_field", {
                label: res.__("label_tag_name")
            })
        },
        comments: {
            type: "string",
            required: true,
            min: 2,
            max: 200000,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_comments")
            })
        }
    }
};


exports.notifyFormData = (res) => {
    return {
        title: {
            type: "string",
            required: true,
            min: 5,
            max: 100,
            message: res.__("validate_error_field", {
                label: res.__("label_notify_title")
            })
        },
        content: {
            type: "string",
            required: true,
            min: 5,
            max: 500,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_notify_content")
            })
        }
    }
};


exports.systemConfigFormData = (res) => {
    return {
        siteEmailServer: {
            type: "string",
            required: true,
            message: "invite email server"
        },
        siteEmail: {
            type: "email",
            required: true,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_user_email")
            })
        },
        siteName: {
            type: "string",
            required: true,
            min: 5,
            max: 100,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_sysconfig_site_name")
            })
        },
        siteDiscription: {
            type: "string",
            required: true,
            min: 5,
            max: 200,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_sysconfig_site_dis")
            })
        },
        siteKeywords: {
            type: "string",
            required: true,
            min: 5,
            max: 100,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_sysconfig_site_keyWords")
            })
        },
        siteAltKeywords: {
            type: "string",
            required: true,
            min: 5,
            max: 100,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_sysconfig_site_tags")
            })
        },
        registrationNo: {
            type: "string",
            required: true,
            min: 5,
            max: 30,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_sysconfig_site_icp")
            })
        },
        mongodbInstallPath: {
            type: "string",
            required: true,
            min: 5,
            max: 300,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_sysconfig_mongoPath")
            })
        },
        databackForderPath: {
            type: "string",
            required: true,
            min: 5,
            max: 300,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_sysconfig_databakPath")
            })
        }
    }
};

exports.versionManageFormData = (res) => {
    return {
        title: {
            type: "string",
            required: true,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_version_title")
            })
        },
        description: {
            type: "string",
            required: true,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_version_description")
            })
        },
        version: {
            type: "string",
            required: true,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_version_version")
            })
        },
        versionName: {
            type: "string",
            required: true,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_version_versionName")
            })
        },
    }
};


exports.contentFormData = (res) => {
    return {
        title: {
            type: "string",
            required: true,
            min: 2,
            max: 50,
            message: res.__("validate_error_field", {
                label: res.__("label_content_title")
            })
        },
        stitle: {
            type: "string",
            required: true,
            min: 2,
            max: 50,
            message: res.__("validate_error_field", {
                label: res.__("label_content_stitle")
            })
        },
        sImg: {
            type: "string",
            required: true,
            message: res.__("validate_error_field", {
                label: res.__("lc_small_images")
            })
        },
        discription: {
            type: "string",
            required: true,
            min: 3,
            max: 300,
            message: res.__("validate_error_field", {
                label: res.__("label_content_dis")
            })
        },
        comments: {
            type: "string",
            required: true,
            min: 5,
            max: 100000,
            message: res.__("validate_inputCorrect", {
                label: res.__("label_content_comments")
            })
        }
    }
};

exports.adminUserLoginFormData = (res) => {
    return {
        userName: {
            type: "string",
            required: true,
            min: 2,
            max: 30,
            // pattern: /^[a-z]+$/,
            message: res.__("validate_error_field", {
                label: res.__("label_user_userName")
            })
        },
        password: {
            type: "string",
            required: true
        },
    }
};

exports.contentTemplateFormData = (res) => {
    return {
        name: {
            type: "string",
            required: true,
            min: 1,
            max: 12,
            message: res.__("validate_error_field", {
                label: res.__("label_tempconfig_name")
            })
        },
        forder: {
            type: "string",
            required: true,
            min: 1,
            max: 30,
            message: res.__("validate_error_field", {
                label: res.__("label_tempconfig_forder")
            })
        },
        comments: {
            type: "string",
            required: true,
            min: 2,
            max: 30,
            message: res.__("validate_error_field", {
                label: res.__("label_comments")
            })
        },
    }
}


exports.messageFormData = (res) => {
    return {
        content: {
            type: "string",
            required: true,
            min: 5,
            max: 200,
            message: res.__("validate_rangelength", {
                min: 5,
                max: 200,
                label: res.__("label_messages_content")
            })
        }
    }
};