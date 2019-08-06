const {
    cache,
    siteFunc,
    validatorUtil,
    service
} = require('@utils');
const settings = require('@configs/settings');
const _ = require('lodash')
const {
    contentTemplateService
} = require('@service');

exports.getDefaultTempInfo = async (req, res, next) => {

    cache.get(settings.session_secret + '_default_temp', async (defaultTempData) => {
        if (defaultTempData) {
            renderSuccess(req, res, {
                data: defaultTempData
            });
        } else {
            try {
                let defaultTemp = await contentTemplateService.item(res, {
                    query: {
                        'using': true
                    },
                    populate: ['items']
                })
                if (!_.isEmpty(defaultTemp)) {
                    // 缓存1天
                    cache.set(settings.session_secret + '_default_temp', defaultTemp, 1000 * 60 * 60 * 24);
                    renderSuccess(req, res, {
                        data: defaultTemp
                    });
                } else {
                    renderSuccess(req, res, {
                        data: {}
                    });
                }
            } catch (err) {
                renderSuccess(req, res, {
                    data: {}
                });
            }
        }
    })
}