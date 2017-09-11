/**
 * Created by Administrator on 2015/12/11.
 * doraCMS自定义过滤器
 */

//html转义
doraApp.filter('trustHtml', ['$sce',function ($sce) {
    return function (input) {
        return $sce.trustAsHtml(input);
    }
}]);