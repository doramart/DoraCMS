const path = require('path');
var Cache = require('js-cache');
class AppBootHook {


    constructor(app) {
        this.app = app;
    }

    beforeStart() {
        this.app.runSchedule('backup_data');
    }

    configWillLoad() {

        this.app.loader.loadFile(path.join(this.app.config.baseDir, 'app/bootstrap/index.js'));
        const ctx = this.app.createAnonymousContext();
        this.app.nunjucks.addExtension('remote', new remote(ctx));
        this.app.nunjucks.addExtension('HeaderExtension', new HeaderExtension(ctx));
        this.app.nunjucks.addExtension('AssetsExtension', new AssetsExtension(ctx));
        this.app.nunjucks.addExtension('PluginsExtension', new PluginsExtension(ctx));
        this.app.nunjucks.addExtension('recommend', new recommend(ctx));
        this.app.nunjucks.addExtension('hot', new hot(ctx));
        this.app.nunjucks.addExtension('news', new news(ctx));
        this.app.nunjucks.addExtension('random', new random(ctx));
        this.app.nunjucks.addExtension('near_post', new near_post(ctx));
        this.app.nunjucks.addExtension('tags', new tags(ctx));
        this.app.nunjucks.addExtension('hottags', new hottags(ctx));
        this.app.nunjucks.addExtension('ads', new ads(ctx));
        this.app.nunjucks.addExtension('navtree', new navtree(ctx));
        this.app.nunjucks.addExtension('childnav', new childnav(ctx));
    }

    async didLoad() {

    }

    async willReady() {

        // 请将你的应用项目中 app.beforeStart 中的代码置于此处。
    }

    async didReady() {
        let _theApp = this.app;
        _theApp.cache = new Cache();

        _theApp.messenger.on('refreshCache', by => {
            _theApp.logger.info('start update by %s', by);
            const ctx = _theApp.createAnonymousContext();
            ctx.runInBackground(async () => {
                let {
                    key,
                    value,
                    time
                } = by;
                _theApp.cache.set(key, value, time);
            });
        });
        // 应用初始化
        let thisCtx = this.app.createAnonymousContext();
        this.app.init(thisCtx);
    }
}

module.exports = AppBootHook;