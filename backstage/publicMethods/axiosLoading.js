import {
  Loading
} from 'element-ui'
import _ from 'lodash'

let needLoadingRequestCount = 0
let loading
let configs = {};

function startLoading() {

  loading = Loading.service({
    lock: true,
    text: configs.str ? configs.str : '数据加载中...',
    spinner: 'el-icon-loading',
    background: 'rgba(0, 0, 0, 0.7)'
  })

}

function endLoading() {
  loading.close()
}

const tryCloseLoading = () => {
  if (needLoadingRequestCount === 0 && !configs.alwaysShow) {
    endLoading()
  }
}

export function showFullScreenLoading(loadingConfig = {}) {
  if (!_.isEmpty(loadingConfig)) {
    configs = loadingConfig;
  } else {
    configs = {};
  }
  if (needLoadingRequestCount === 0) {
    startLoading()
  }
  needLoadingRequestCount++
}

export function tryHideFullScreenLoading() {
  if (needLoadingRequestCount <= 0) return
  needLoadingRequestCount--
  if (needLoadingRequestCount === 0) {
    _.debounce(tryCloseLoading, 300)()
  }
}