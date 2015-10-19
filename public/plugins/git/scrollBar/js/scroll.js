/**
 * Created by Dora on 2015/7/15.
 * 滚动条插件
 */

function scrollHtml(objId){
    var html = '';
    html += "<div class='doraScrollBar' id='"+objId+"'></div>";
    return html;
}


var doraScroll = function(jsonData){
    var objId = "scrollBar_"+Math.round(Math.random()*100);
    this.id = objId;
    this.container = jsonData.container;
    this.contentBox = jsonData.contentBox;
    this.html = scrollHtml(objId);
    this.init(jsonData,objId);
};


doraScroll.prototype = {
//    滚动条初始化
    init : function(jsonData,objId){
        var _this = this;
        var _container = $(jsonData.container);
        var _content = $(jsonData.contentBox);
//        添加滚动条对象
        $(_container).prepend(this.html);
//        滚动条对象
        var _scrollBar = $('#'+objId);
//        初始化滚动条样式
        var n = $(_container).height()/$(_content).height();

        $(_scrollBar).css({
            'position' : 'absolute',
            'top' : '0px',
            'box-shadow' : '2px 2px 2px #ccc',
            'z-index' : 999999,
            'opacity' : 0,
            'border-radius' : function(){
                return jsonData.radius ? jsonData.radius : '8px';
            },
            'width' : function(){
                return jsonData.width ? jsonData.width : '10px';
            },
            'height' : $(_container).height()*n + 'px',
            'background' : function(){
                return jsonData.color ? jsonData.color : '#660033';
            }
        });

//        控制滚动条的方向
        if(jsonData.position){
            if(jsonData.position == 'left'){
                $(_scrollBar).css({'left' : '2px'})
            }else{
                $(_scrollBar).css({'right' : '2px'})
            }
        }else{
            $(_scrollBar).css({'right' : '2px'})
        }

        $(_container).css({
            'overflow-x' : 'hidden',
            'overflow-y' : 'hidden',
            'position' : 'relative'
        });

//        滚动条的拖放监听
        var moveStart = function(e){
//        根据内容高度计算拖放比例
            if($(_container).height() <= $(_scrollBar).height()){
                return;
            }
            var n1 = ($(_content).height() - $(_container).height())/($(_container).height() - $(_scrollBar).height());
            var _x = e.pageX;
            var _y = e.pageY;

            var _startX = $(_scrollBar).offset().left;
            var _startY = $(_scrollBar).offset().top;

            var move = function(e){
                var ev = e || _this.window.event;
                ev.preventDefault();
//            鼠标移动的距离加上之前相对于外框的高度
                var _top = e.pageY - _y + _startY -  _container.offset().top;

                if(_top < 0){
                    _top = 0;
                }

                if(_top > _container.height() - _scrollBar.height()){
                    _top = _container.height() - _scrollBar.height();
                }

                $(_scrollBar).css({top:_top});

                $(_content).css({marginTop:- _top * n1});

            };

            var moveStop = function(){
                $(_container).unbind("mousemove");
                $(_container).unbind("mouseup");
            };

            $(_container).bind("mousemove",move);
            $(_container).bind("mouseup",moveStop);
        };

        $(_container).bind("mousedown",moveStart);


//        鼠标滚轮的事件监听,针对不同浏览器兼容
        $(_container).hover(function(){
            if($(_container).height() > $(_scrollBar).height()){
                if (window.addEventListener) {
                    window.addEventListener('DOMMouseScroll', wheel, false);
                }
                /** IE/Opera. */
                window.onmousewheel = document.onmousewheel = wheel;
                $(_scrollBar).show().animate({
                    'opacity' : 0.6
                },500)
            }else{
                $(_scrollBar).hide();
            }

        },function(){
            if (window.addEventListener) {
                window.removeEventListener('DOMMouseScroll', wheel, false);
            }
            /** IE/Opera. */
            window.onmousewheel = document.onmousewheel = "";

            $(_scrollBar).animate({
                'opacity' : 0
            },500)
        });

        var wheel = function(event) {
            var delta = 0;
            if (!event) /* For IE. */
                event = window.event;
            if (event.wheelDelta) { /* IE/Opera. */
                delta = event.wheelDelta / 120;
            } else if (event.detail) {
                delta = -event.detail / 3;
            }
            if (delta){
                handle(delta);
            }
            if (event.preventDefault)
                event.preventDefault();
            event.returnValue = false;
        };

//        相对于内容的滚动校验
        var checkTopVal = function(_top,direction){
            var k1 = ($(_content).height() - $(_container).height())/($(_container).height() - $(_scrollBar).height());
            if(direction == 'up' && _top > 0){
                _top = 0;
            }
            if((_top/k1) > (_container.height() - _scrollBar.height())){
                _top = _content.height() - _container.height();
            }
            if(direction == 'down'){
                $(_content).css({marginTop: -_top});
                $(_scrollBar).animate({top:_top/k1},50);
            }else{
                $(_content).css({marginTop: _top});
                $(_scrollBar).animate({top:-_top/k1},50);
            }

        };

        var handle = function(delta) {
            var contentTop = $(_content).css('margin-top').substring(0,$(_content).css('margin-top').length-2);
            var scrollSpeed = jsonData.speed ? Number(jsonData.speed) : 10;
            if (delta < 0) {
                checkTopVal(-Number(contentTop) + scrollSpeed,'down');
            } else {
               checkTopVal(Number(contentTop) + scrollSpeed,'up');
            }
        }
    },
//  重设滚动条
    reSetScrollBar : function(){
            var _this = this;
            var _scrollBar = $('#'+_this.id);
            var _container = $(_this.container);
            var _content = $(_this.contentBox);

            var m = $(_container).height()/$(_content).height();
            $(_scrollBar).css({
                'height' : $(_container).height()*m + 'px'
            });
    }

};