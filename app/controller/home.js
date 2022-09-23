'use strict';
const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'Service "eggjs_monitor" is OK!';
  }

  async check_weixin() {
    const { ctx } = this;
    await ctx.service.parse.check_weixin();
  }

  async check_status() {
    const { ctx } = this;
    await ctx.service.parse.check_status();
  }

  async check_db() {
    const { ctx } = this;
    await ctx.service.parse.check_db();
  }

}

module.exports = HomeController;
