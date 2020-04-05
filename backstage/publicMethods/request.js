import axios from 'axios'
import {
  MessageBox,
  Message
} from 'element-ui'
import store from '@/store'
import {
  showFullScreenLoading,
  tryHideFullScreenLoading,
} from '@root/publicMethods/axiosLoading'

// create an axios instance

const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 1000 * 60 * 2 // request timeout
})

// request interceptor
service.interceptors.request.use(
  config => {
    // do something before request is sent
    let loadingConfig = !_.isEmpty(config.params) && !_.isEmpty(config.params.loadingConfig) ? config.params.loadingConfig : {};
    showFullScreenLoading(loadingConfig);

    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
   */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  response => {
    tryHideFullScreenLoading();
    const res = response.data

    // if the custom code is not 200, it is judged as an error.
    if (res.status !== 200) {
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      // 50008: Illegal token; 50012: Other clients logged in; 50014: Token expired;
      if (res.status === 50008 || res.status === 50012 || res.status === 50014) {
        // to re-login
        MessageBox.confirm('You have been logged out, you can cancel to stay on this page, or log in again', 'Confirm logout', {
          confirmButtonText: 'Re-Login',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }).then(() => {
          store.dispatch('user/resetToken').then(() => {
            location.reload()
          })
        })
      }
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      return res
    }
  },
  error => {
    tryHideFullScreenLoading();
    let errorMsg = error.message;
    if (error.response && error.response.data && error.response.data.message) {
      errorMsg = error.response.data.message;
    }
    // 网络错误把异常抛到前面
    if (errorMsg == "Network Error" || errorMsg == "Request failed with status code 502") {
      return {
        status: 500,
        message: 'Network Error'
      }
    } else {
      Message({
        message: errorMsg,
        type: 'error',
        duration: 5 * 1000
      })
      return Promise.reject(error)
    }

  }
)


export default service