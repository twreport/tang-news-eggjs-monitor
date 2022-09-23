const Subscription = require('egg').Subscription;
class ServiceDriver extends Subscription {
    static get schedule() {
        return {
            interval: '600s',
            type: 'worker'
        };
    }
    async subscribe() {
        console.log("OK")
        await this.ctx.service.parse.check_status();
    }
}
module.exports = ServiceDriver;