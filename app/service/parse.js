'use strict';
const moment = require('moment');
const Service = require('egg').Service;

class ParseService extends Service {
    warn_msg = '';
    async check_weixin() {
        const { ctx } = this;
        await this.check_weixin_outline();
        await this.check_weixin_frequent();
        ctx.body = this.warn_msg;
    }

    async check_db() {
        const { ctx } = this;
        await this.check_mysql_db();
        await this.check_mongo_db();
        await this.check_mongo_top_db('weibo', 'title');
        await this.check_mongo_top_db('toutiao', 'Title');
        await this.check_mongo_top_db('douyin', 'word');
        await this.check_mongo_top_db('baidu', 'word');
        this.warn_msg += '\n';
        await this.check_mongo_weixin();
        this.warn_msg += '\n';
        await this.check_tangwei_cc_db();
        ctx.body = this.warn_msg;
    }

    async check_tangwei_cc_db() {
        const { ctx } = this;
        const url = this.app.config.TangweiCCDBCheckUrl;
        const send_res = await ctx.curl(url);
        this.warn_msg += send_res.data.toString();
    }

    async check_mongo_weixin() {
        const { ctx } = this;
        const result = await ctx.service.mongodb.check_weixin();
        console.log(result);
        this.warn_msg += "****************************************\n";
        this.warn_msg += "*        Local DB Weixin Mongo         *\n";
        this.warn_msg += "****************************************\n";

            for(let key in result)
            {
                this.warn_msg += '-------------- ' + key + ' --------------\n';
                if(result[key]['last_one'].length > 0){
                    this.warn_msg += 'Last Crawl Article:\n' + result[key]['last_one'][0]['title'] + '\n';
                    this.warn_msg += 'Last Push Time: ' + result[key]['last_one'][0]['issue_date'] + '\n';
                    this.warn_msg += 'Last Push Biz: ' + result[key]['last_one'][0]['name'] + '\n';

                }else {
                    this.warn_msg += 'No Article of ' + key + ' is Crawled in 24H\n';
                }

                this.warn_msg += 'Articles Number in 24 Hours: ' + result[key]['total_num'] + '\n';
                this.warn_msg += 'Articles No Logs in 24 Hours: ' + result[key]['no_logs_num'] + '\n';
                this.warn_msg += '\n';
            }


    }

    async check_weixin_outline() {
        const { ctx } = this;
        this.warn_msg += "****************************************\n";
        this.warn_msg += "*        Check Weixin Ask Param        *\n";
        this.warn_msg += "****************************************\n";
        const warning_interval = 120000;
        const uins = await this.service.mysqldb.select_all_uin();
        const now_time = parseInt(new Date().getTime())
        for (let i = 0; i < uins.length; i++) {
            let uin = uins[i].uin;
            let devicetype = uins[i].devicetype;
            console.log('uin：', uin);
            let params = await ctx.service.mongodb.find_item_by_uin_from_mongodb(uin);
            this.warn_msg += "Check Device:" + devicetype + "\n";
            for (const ele of params) {
                console.log(ele.update_time);
                let day_time = moment(ele.update_time).format('YYYY-MM-DD HH:mm:ss');
                this.warn_msg += "Update Time:" + day_time + "\n";
                let interval_time = now_time - parseInt(ele.update_time);
                this.warn_msg += "interval_time:" + interval_time.toString() + "\n";
                if (interval_time > warning_interval) {
                    let res = await ctx.service.mysqldb.warning_uin(uin);
                    console.log("+++++++res of warning+++++++++");
                    console.log(res);
                    if (res !== false) {
                        console.log('Send A Msg!')
                        let url_msg = 'https://sctapi.ftqq.com/SCT113045Tcb497fbmERp3h4AvSHOYx6vs.send?title=uin(' + devicetype + ') is OUTLINE!'
                        const send_res = await ctx.curl(url_msg);
                        console.log(send_res);
                    }
                    this.warn_msg += "============   ERROR !!! ============\n";
                    this.warn_msg += "DEVICE (" + devicetype + ") Outline!\n";
                    this.warn_msg += "=====================================\n";
                }
            }
        }
        this.warn_msg += "\n";
    }

    async check_weixin_frequent() {
        const { ctx } = this;
        this.warn_msg += "****************************************\n";
        this.warn_msg += "*         Check Frequent Status        *\n";
        this.warn_msg += "****************************************\n";
        const uins = await ctx.service.mysqldb.select_all_uin();
        for (let i = 0; i < uins.length; i++) {
            const uin = uins[i].uin;
            const device_name = uins[i].devicetype;
            const result = await this.service.mysqldb.check_frequent_log_by_uin(uin);
            console.log("result:", result.length);
            if (result.length == 0) {
                console.log("++++++++++++++++");
                console.log(device_name);
                console.log("++++++++++++++++");
                console.log(result);
                this.warn_msg += device_name + ' is OK!\n';
            } else {
                for (let j = 0; j < result.length; j++) {
                    const frequent_time = result[j].frequent_time * 1000;
                    const frequent_time_str = moment(frequent_time).format('YYYY-MM-DD HH:mm:ss');
                    this.warn_msg += "============   ERROR !!! ============\n";
                    const error_msg = device_name + 'is Frequent!' + '\n' + ' at ' + frequent_time_str + '\n';
                    this.warn_msg += error_msg;
                    this.warn_msg += "=====================================\n";
                    this.warn_msg += '\n';
                    //如果status==1意味着该次超时还没有报警，首先用微信报警！
                    if (result[j].status == 1) {
                        const url_msg = 'https://sctapi.ftqq.com/SCT113045Tcb497fbmERp3h4AvSHOYx6vs.send?title=(' + error_msg;
                        const send_res = await ctx.curl(url_msg);
                        console.log(send_res);
                        const update_res = await this.service.mysqldb.reset_status_frequent(result[j].id);
                        if (update_res) {
                            this.warn_msg += "Frequent is Warning!";
                            this.warn_msg += '\n';
                        }
                    }
                }
            }
        }
    }

    async check_mysql_db() {
        const { ctx } = this;
        this.warn_msg += '\n';
        this.warn_msg += "****************************************\n";
        this.warn_msg += "*  Local DB Push_Weixin_Articles_Pool  *\n";
        this.warn_msg += "****************************************\n";
        const res = await ctx.service.mysqldb.find_latest_article_and_count_in_24_hours('push_weixin_articles_pool', 'push_time', 'title')
        const last_update_time_str = moment(res.last_update * 1000).format('YYYY-MM-DD HH:mm:ss');
        this.warn_msg += 'Last Push Article:\n' + res.last_title + '\n';
        this.warn_msg += 'Last Push Time: ' + last_update_time_str + '\n';
        this.warn_msg += 'Articles Number in 24 Hours:  ' + res.num + '\n';
    }

    async check_mongo_db() {
        const { ctx } = this;
        this.warn_msg += '\n';
        this.warn_msg += "****************************************\n";
        this.warn_msg += "*       Local DB Weibo Hot Mongo       *\n";
        this.warn_msg += "****************************************\n";
        const result = await ctx.service.mongodb.find_latest_weibo_hot_and_count_in_24_hours()
        for (let res of result) {
            const last_update_time_str = moment(res.add_time * 1000).format('YYYY-MM-DD HH:mm:ss');
            this.warn_msg += 'Last Push Article:\n' + res.title + '\n';
            this.warn_msg += 'Last Push Time: ' + last_update_time_str + '\n';
        }
    }

    async check_mongo_top_db(db, title_name) {
        const { ctx } = this;
        this.warn_msg += '\n';
        this.warn_msg += "****************************************\n";
        this.warn_msg += "*      Local DB " + db + " Top Mongo       *\n";
        this.warn_msg += "****************************************\n";
        const result = await ctx.service.mongodb.find_latest_top(db)
        if (result.length == 0) {
            this.warn_msg += 'No ' + db + ' is pushed in Whole Day！\n';
        } else {
            for (let res of result) {
                const last_update_time_str = moment(res.add_time * 1000).format('YYYY-MM-DD HH:mm:ss');
                this.warn_msg += 'Last Push ' + db + ' is: ' + res[title_name] + '\n';
                this.warn_msg += 'Last Push Time: ' + last_update_time_str + '\n';
            }
        }

    }

    /******************************** 以下为检查服务器状态部分 ****************************/
    async check_status() {
        const { ctx } = this;
        await this.check_raspberry();
        await this.check_ds200_dockers();
        await this.check_tangwei_cc();
        ctx.body = this.warn_msg;
    }

    async check_ds200_dockers() {
        const eggjs_local_parse_url = this.app.config.EggjsParseLocal;
        console.log('check_local_parse')
        await this.check_service(eggjs_local_parse_url, '*********** Service eggjs_parse is ERROR! *********', 'eggjs', 'eggjs_weixin_local_parse');
    
        const eggjs_ai_topic_parse_url = this.app.config.EggjsParseAiTopic;
        console.log('check_ai_topic_parse')
        await this.check_service(eggjs_ai_topic_parse_url, '*********** Service eggjs_AI_Topic is ERROR! *********', 'eggjs', 'eggjs_ai_topic');
    
        const eggjs_ai_keywords_url = this.app.config.EggjsParseAiKeywords;
        console.log('check_ai_keywords_parse')
        await this.check_service(eggjs_ai_keywords_url, '*********** Service eggjs_AI_Keywords is ERROR!  *********', 'eggjs', 'eggjs_ai_keywords');
    
        const eggjs_social_url = this.app.config.EggjsSocialUrl;
        console.log('check_social')
        await this.check_service(eggjs_social_url, '*********** Service eggjs_social is ERROR! *********', 'eggjs', 'eggjs_social');
    }

    async check_raspberry() {
        console.log('check_raspberry_spider')
        await this.check_service('http://10.168.1.99:5000/api/test/status', '*********** Flask Service local_news_parse is ERROR! *********', 'flask', 'local_news_parse');
        await this.check_service('http://10.168.1.99:5001/ai/test/status', '*********** Flask Service ai_parse is ERROR! *********', 'flask', 'ai_parse');
    }

    async check_tangwei_cc() {
        console.log('check_tangwei_cc')
        const url = this.app.config.TangweiCCCheckUrl;
        await this.check_service(url, '* Service eggjs_tang at tangwei.cc is ERROR! *', 'cloud', 'eggjs_tangwei_cc');
    }

    async check_service(url, bad_msg, service_type, service_name) {
        const { ctx } = this;
        let status_msg = '';
        try {
            const send_res = await ctx.curl(url);
            if (send_res.status == 200) {
                let status_msg_str = send_res.data.toString();
                console.log(status_msg_str);
                if (service_type == 'flask') {
                    let status_msg_obj = JSON.parse(status_msg_str);
                    console.log(status_msg_obj)
                    status_msg = status_msg_obj.result;
                } else if (service_type == 'eggjs') {
                    status_msg = service_name + ' is OK !!!';
                } else if (service_type == 'cloud') {
                    status_msg = status_msg_str;
                }
                this.warn_msg += status_msg;
                this.warn_msg += '\n';
            } else {
                status_msg = bad_msg;
                // 先查询上次报警时间，避免24小时内重复报警
                const is_warned = await ctx.service.mysqldb.is_warned(service_name)
                if (is_warned === false) {
                    await this.warn_me_by_server_jiang(status_msg);
                    // 报警后更新错误时间
                    await this.ctx.service.mysqldb.update_error_time(service_name)
                }
                this.warn_msg += status_msg;
                this.warn_msg += '\n';
            }
        } catch (e) {
            console.log("web error!");
            console.log(e)
            if (e.status == -1) {
                status_msg = bad_msg;
                console.log(service_name)
                // 先查询上次报警时间，避免24小时内重复报警
                const is_warned = await ctx.service.mysqldb.is_warned(service_name)
                console.log("is_warned:", is_warned)
                if (is_warned === false) {
                    await this.warn_me_by_server_jiang(status_msg);
                    await this.ctx.service.mysqldb.update_error_time(service_name)
                }
                this.warn_msg += status_msg;
                this.warn_msg += '\n';
            }
        }
    }

    async warn_me_by_server_jiang(msg) {
        console.log('Send A Msg!')
        let url_msg = 'https://sctapi.ftqq.com/SCT113045Tcb497fbmERp3h4AvSHOYx6vs.send?title=Error!&desp=' + msg;
        const send_res = await this.ctx.curl(url_msg);
        console.log(send_res);
    }
}
module.exports = ParseService;