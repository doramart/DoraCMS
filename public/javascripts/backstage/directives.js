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
doraApp.directive('ueditor', function ($timeout) { //angular绑定ueditor
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
});

//ztree组件
doraApp.directive('tree', function () {
    return {
        require: '?ngModel',
        restrict: 'A',
        link: function ($scope, element, attrs, ngModel) {
            var setting = {
                data: {
                    key: {
                        title: "t"
                    },
                    simpleData: {
                        enable: true
                    }
                },
                callback: {
                    onClick: function (event, treeId, treeNode, clickFlag) {
                        $scope.$apply(function () {
                            ngModel.$setViewValue(treeNode);
                        });
                    }
                }
            };
            var zNodes = [
                { id: 1, pId: 0, name: "普通的父节点", t: "我很普通，随便点我吧", open: true },
                { id: 11, pId: 1, name: "叶子节点 - 1", t: "我很普通，随便点我吧" },
                { id: 12, pId: 1, name: "叶子节点 - 2", t: "我很普通，随便点我吧" },
                { id: 13, pId: 1, name: "叶子节点 - 3", t: "我很普通，随便点我吧" },
                { id: 2, pId: 0, name: "NB的父节点", t: "点我可以，但是不能点我的子节点，有本事点一个你试试看？", open: true },
                { id: 21, pId: 2, name: "叶子节点2 - 1", t: "你哪个单位的？敢随便点我？小心点儿..", click: false },
                { id: 22, pId: 2, name: "叶子节点2 - 2", t: "我有老爸罩着呢，点击我的小心点儿..", click: false },
                { id: 23, pId: 2, name: "叶子节点2 - 3", t: "好歹我也是个领导，别普通群众就来点击我..", click: false },
                { id: 3, pId: 0, name: "郁闷的父节点", t: "别点我，我好害怕...我的子节点随便点吧...", open: true, click: false },
                { id: 31, pId: 3, name: "叶子节点3 - 1", t: "唉，随便点我吧" },
                { id: 32, pId: 3, name: "叶子节点3 - 2", t: "唉，随便点我吧" },
                { id: 33, pId: 3, name: "叶子节点3 - 3", t: "唉，随便点我吧" }
            ];
            $.fn.zTree.init(element, setting, zNodes);
        }
    };
});