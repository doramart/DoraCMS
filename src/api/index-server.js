import axios from 'axios'
import qs from 'qs'
import md5 from 'md5'
import config from './config-server'
export default {
    post(url, data) {
        const key = md5(url + JSON.stringify(data))
        if (config.cached && data.cache && config.cached.has(key)) {
            return Promise.resolve(config.cached.get(key))
        }
        return axios({
            method: 'post',
            url: config.api + url,
            data: qs.stringify(data),
            timeout: config.timeout,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        }).then(res => {
            if (config.cached && data.cache) config.cached.set(key, res)
            return res
        })
    },
    get(url, params = {}) {
        const key = md5(url + JSON.stringify(params))
        if (config.cached && params.cache && config.cached.has(key)) {
            return Promise.resolve(config.cached.get(key))
        }
        params.apiSource = 'server';
        return axios({
            method: 'get',
            url: config.api + url,
            params,
            timeout: config.timeout,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).then(res => {
            if (config.cached && params.cache) config.cached.set(key, res)
            return res
        })
    }
}
