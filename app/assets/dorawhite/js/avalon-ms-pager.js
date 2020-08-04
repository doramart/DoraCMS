; (function () {
    //*********************************************
    if (!avalon) {
        console.log("请先在当前页面引用avalon.js！另外请保证您引用了与该组件配套的css样式！");
        return;
    }
    function getHashStr(name) {
        var url = location.hash; //获取url中"?"符后的字串
        var theRequest = new Object();
        if (url.indexOf("?")) {
            var str = url.substr(url.indexOf("?") + 1);
            var strs = str.split("&");
            for (var i = 0; i < strs.length; i++) {
                theRequest[strs[i].split("=")[0]] = decodeURI(strs[i].split("=")[1]);
            }
        }
        return theRequest[name];
    }
    function getPages(currentPage) {
        var pages = []
        var s = this.showPages
        var total = this.totalPages
        var half = Math.floor(s / 2)
        var start = currentPage - half + 1 - s % 2
        var end = currentPage + half
        // handle boundary case
        if (start <= 0) {
            start = 1;
            //end = s > total ? total : s;
        }
        if (end > total) {
            //start = total - s + 1
            end = total
        }

        var itPage = start;
        while (itPage <= end) {
            pages.push(itPage)
            itPage++
        }

        return { currentPage: currentPage, pages: pages };
    }
    avalon.component('ms-pager', {
        template: "" +
            "       <ul class='pagination' ms-visible='@totalPages>1'>" +
            "           <li class='first' ms-class='{disabled: @isDisabled(\"first\", 1)}'>" +
            "               <a ms-attr='{title:@getTitle(\"first\")}'" +
            "                  ms-click='@cbProxy($event,\"first\")'" +
            "               >" +
            "                   <i class='fa fa-angle-double-left'></i>" +
            "               </a>" +
            "           </li>" +
            "           <li class='prev'" +
            "               ms-class='{disabled: @isDisabled(\"prev\",1)}'>" +
            "               <a ms-attr='{title:@getTitle(\"prev\")}'" +
            "                  ms-click='@cbProxy($event,\"prev\")'" +
            "               >" +
            "                   <i class='fa fa-angle-left'></i>" +
            "               </a>" +
            "           </li>" +
            "           <li ms-for='page in @pages'" +
            "               ms-class='{active: page === @currentPage}' >" +
            "               <a ms-attr='{title:@getTitle(page)}'" +
            "                  ms-click='@cbProxy($event,page)'" +
            "               >" +
            "                   {{page}}" +
            "               </a>" +
            "           </li>" +
            "           <li class='next'" +
            "               ms-class='{disabled: @isDisabled(\"next\",@totalPages)}'>" +
            "               <a ms-attr='{title: @getTitle(\"next\")}'" +
            "                  ms-click='@cbProxy($event,\"next\")'" +
            "               >" +
            "                   <i class='fa fa-angle-right'></i>" +
            "               </a>" +
            "           </li>" +
            "           <li class='last'" +
            "               ms-class='{disabled: @isDisabled(\"last\",@totalPages)}'>" +
            "               <a ms-attr='{title: @getTitle(\"last\")}'" +
            "                  ms-click='@cbProxy($event,\"last\")'" +
            "               >" +
            "                   <i class='fa fa-angle-double-right'></i>" +
            "               </a>" +
            "           </li>" +
            "       </ul>",
        defaults: {
            $id: 'ms-pager',
            /**
             * 是否开启低版本兼容模式
             * 开启，将无法开启浏览器回退功能
             * */
            is_ie: false,
            /**
             * 配置复杂型单页
             * 默认为false
             * 如#/page=2
             * hash配置子页，后面还需配置分页信息时启用
             * 如#/game?page=2
             * 表示单页应用进入子页面game页,当前页为2
             * */
            is_more: true,
            hash: '',
            getHref: function (a) {
                if (this.is_more) {
                    if (location.hash) {
                        var search = location.hash,
                            page = getHashStr('page');
                        if (page) { // 存在就替换
                            search = search.replace('page=' + page, 'page=' + this.toPage(a));
                            return search;
                        }
                        else { // 不存在就叠加
                            return location.hash + '?page=' + this.toPage(a)
                        }
                    }
                    else {
                        return '#?page=' + this.toPage(a)
                    }
                }
                else {
                    return '#page-' + this.toPage(a)
                }
            },
            getTitle: function (title) {
                return title
            },
            isDisabled: function (name, page) {
                return this.$buttons[name] = (this.currentPage === page)
            },
            $buttons: {},
            showPages: 5,
            pages: [],
            totalPages: avalon.noop,
            currentPage: 1,
            firstText: '《',
            prevText: '上一页',
            nextText: '下一页',
            lastText: '》',
            onPageClick: avalon.noop,
            toPage: function (p) {
                var cur = this.currentPage
                var max = this.totalPages
                switch (p) {
                    case 'first':
                        return 1
                    case 'prev':
                        return Math.max(cur - 1, 1)/*从第一页开始*/
                    case 'next':
                        return Math.min(cur + 1, max)
                    case 'last':
                        return max
                    default:
                        return p
                }
            },
            cbProxy: function (e, p) {
                var cur = this.toPage(p);
                if (this.$buttons[p] || p === this.currentPage) {
                    if (cur === 1) {
                        return this.onPageClick(e, cur);
                    }
                    e.preventDefault()
                    return //disabled, active不会触发
                }
                /*替换链接改变hash的形式*/
                // window.location.hash = this.getHref(p);
                this.render(cur);
                return this.onPageClick(e, cur);
            },
            render: function (cur) {/*更新页码*/
                var obj = getPages.call(this, cur);
                this.currentPage = obj.currentPage;
                this.pages = obj.pages;
            },
            /*此处供正常单页应用*/
            rpage: function () {
                return this.is_more ? /(?:#|\?)page\=(\d+)/ : /(?:#|\?)page\-(\d+)/;
            },
            cur: function () { /*正确获取匹配页码*/
                var cur = this.currentPage;
                var match = this.rpage && location.href.match(this.rpage());
                if (match && match[1]) {
                    var cur = ~~match[1]
                    if (cur < 0 || cur > this.totalPages) {
                        cur = 1
                    }
                }
                return cur;
            },
            onInit: function () {
                var that = this;
                /**复杂单页应用，切换选项卡，重置页码
                 * 但切换选项卡或者数据页数变化时，重置页码
                 * */
                this.$watch('totalPages', function () {
                    that.render(that.cur())
                });
                this.$watch('currentPage', function () {
                    that.render(that.cur());
                });
                if (!that.is_ie && !that.is_more) {
                    /**
                     * 完美支持单页一分页组件（仅支持现代浏览器）
                     * 浏览器回退键功能启动
                     * */
                    window.addEventListener("hashchange", function () {
                        that.cbProxy(window.event, that.cur());
                    }, false);
                }
                else if (!that.is_ie && that.is_more) {
                    /**
                     * 支持单页多分页组件（仅支持现代浏览器）
                     * 此功能适用于单页多分页情景，开启此功能，可配合路由。
                     * 监听location.hash触发特定的onPageClick
                     * */
                    window.addEventListener("hashchange", function () {
                        that.render(that.cur());
                    }, false);
                }
                /*进入页面预载入页码*/
                that.render(that.cur());
            }
        }
    });
    console.log("成功加载ms-pager组件！");
    //*********************************************
})();