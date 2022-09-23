'use strict';
const Service = require('egg').Service;

class ClearService extends Service {
    async start() {
        const { ctx } = this;
        ctx.body = '';
        const res1 = await ctx.service.mongodb.copy_db_to_bak_and_delete_duplicate('weixin', 'province', 'weixinbak', 'province');
        ctx.body += res1;
        ctx.body += '\n';
        const res2 = await ctx.service.mongodb.copy_db_to_bak_and_delete_duplicate('weixin', 'area', 'weixinbak', 'area');
        ctx.body += res2;
        ctx.body += '\n';
        const res3 = await ctx.service.mongodb.copy_db_to_bak_and_delete_duplicate('weixin', 'county', 'weixinbak', 'county');
        ctx.body += res3;
        ctx.body += '\n';
    }

}
module.exports = ClearService;