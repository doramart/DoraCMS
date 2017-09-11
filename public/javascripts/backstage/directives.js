/**
 * Created by Administrator on 2015/12/9.
 * doraCMS自定义指令
 */


//密码匹配校验
doraApp.directive('pwCheck', [function () {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, ctrl) {
            var firstPassword = '#' + attrs.pwCheck;
            elem.add(firstPassword).on('keyup', function () {
                scope.$apply(function () {
                    var v = elem.val()===$(firstPassword).val();
                    ctrl.$setValidity('pwmatch', v);
                });
            });
        }
    }
}]);

//百度编辑器
doraApp.directive('ueditor', ['$timeout',function ($timeout) { //angular绑定ueditor
    return {
        restrict: 'A',
        require: 'ngModel',
        scope : {},
        link: function (scope, element, attrs, ctrl) {
            var id = 'ueditor_' + Date.now();
            element[0].id = id;
            var ue = UE.getEditor(id, {
                initialFrameWidth: '100%',
                initialFrameHeight: '500',
                autoHeightEnabled: true
            });
            ue.ready(function () {
                ue.addListener('contentChange', function () {
                    ctrl.$setViewValue(ue.getContent());
                    if (!scope.$$phase) {
                        scope.$apply();
                    }
                });
            });
        }
    };
}]);