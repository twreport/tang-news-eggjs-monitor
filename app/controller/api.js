'use strict';
const Controller = require('egg').Controller;

class ApiController extends Controller {
    async index() {
        const { ctx } = this;
        const result = await ctx.service.parse.monitor_api()
        ctx.body = result;
    }

    async get_1_article_2_mark() {
        const { ctx } = this;
        const result = await ctx.service.api.get_1_article_2_mark()
        ctx.body = result;
    }

    async update_marked_article() {
        const { ctx } = this;
        const data = ctx.request.body;
        const id = data.id;
        const sort = data.sort;
        let value;
        if(data.value === true){
            value = 1;
        }else{
            value = 2;
        }
        const result = await ctx.service.api.update_marked_article(id, sort, value);
        console.log(result);
        ctx.body = result;
    }
}

module.exports = ApiController;
