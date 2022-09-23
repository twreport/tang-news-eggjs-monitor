'use strict';
const Service = require('egg').Service;

class ApiService extends Service {
    async start() {
        const { ctx } = this;
    }

    async get_1_article_2_mark() {
        const { ctx } = this;
        const result = await ctx.service.mysqldb.get_1_article_2_mark()
        return result;
    }

    async update_marked_article(id, sort, value) {
        const { ctx } = this;
        const result = await ctx.service.mysqldb.update_marked_article(id, sort, value);
        return result;
    }

}
module.exports = ApiService;