/*
 * @Author: doramart 
 * @Date: 2019-06-18 17:27:24 
 * @Last Modified by: doramart
 * @Last Modified time: 2019-07-15 17:17:44
 */

'use strict';
const _ = require('lodash');


global.remote = function () {

    this.tags = ['remote'];

    this.parse = function (parser, nodes, lexer) {
        var tok = parser.nextToken();
        var args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(tok.value);
        return new nodes.CallExtensionAsync(this, 'run', args);
    };

    this.run = async (context, args, callback) => {
        const key = _.isEmpty(args.key) ? false : args.key;
        try {
            const api = _.isEmpty(args.api) ? false : args.api;
            const queryObj = _.isEmpty(args.query) ? false : JSON.parse(args.query);
            const pageSize = _.isEmpty(args.pageSize) ? false : args.pageSize;
            const isPaging = _.isEmpty(args.isPaging) ? '1' : args.isPaging;

            let apiData = [];

            if (!key || !api) {
                throw new Error(context.ctx.__('validate_error_params'));
            }

            let payload = {};

            if (pageSize) {
                payload.pageSize = pageSize;
            }

            if (isPaging) {
                payload.isPaging = isPaging;
            }

            if (queryObj) {
                _.assign(payload, queryObj);
            }

            apiData = await reqJsonData(api, payload);

            context.ctx[key] = apiData;
            return callback(null, '');
        } catch (error) {
            context.ctx[key] = [];
            return callback(null, '');
        }

    };
}