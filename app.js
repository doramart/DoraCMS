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

    }

    async didLoad() {

    }

    async willReady() {

        // 请将你的应用项目中 app.beforeStart 中的代码置于此处。
    }

    async didReady() {
        this.app.cache = new Cache();
    }
}

module.exports = AppBootHook;