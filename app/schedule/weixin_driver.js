const Subscription = require('egg').Subscription;
class WeixinDriver extends Subscription {
    static get schedule() {
        return {
            interval: '300s',
            type: 'worker'
        };
    }
    async subscribe() {
        console.log("OK")
        await this.ctx.service.parse.check_weixin();
    }
}
module.exports = WeixinDriver;