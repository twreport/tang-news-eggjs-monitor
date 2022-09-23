'use strict';

const Service = require('egg').Service;

class MysqldbService extends Service {
    async select_all_uin() {
        const result = await this.app.mysql.select('admin_weixin_uin');
        return result;
    }

    async warning_uin(uin) {
        const res = await this.app.mysql.select('admin_weixin_uin', {
                where: {'uin': uin}
            }
        );

        for (const re of res){
            console.log("re:");
            console.log(re);
            const last_warning_time = re.warning_time;
            const interval_time = parseInt(new Date().getTime() / 1000) - parseInt(last_warning_time);
            console.log("warning interval time");
            console.log(interval_time);
            // 24小时发一次提醒
            if(interval_time > 86400){
                // 如果主键是自定义的 ID 名称，如 custom_id，则需要在 `where` 里面配置
                const row = {
                    'warning_time': parseInt(new Date().getTime() / 1000)
                };
                const options = {
                    where: {
                        'uin': uin
                    }
                };
                const result = await this.app.mysql.update('admin_weixin_uin', row, options); // 更新表中的记录
                console.log("update res:");
                console.log(result);
                return uin;
            }else{
                return false;
            }
        }
    }

    async check_frequent_log_by_uin(uin) {
        const now_time = parseInt(new Date().getTime() / 1000);
        const interval_time = 24 * 60 * 60;
        const frequent_time_pass = now_time - interval_time;
        console.log("frequent_time_pass", frequent_time_pass);
        const sql_str = 'SELECT * FROM admin_frequent_uin where frequent_time > ' +  frequent_time_pass + ' and uin = "' + uin + '";';
        console.log("sql_str", sql_str);
        const res = await this.app.mysql.query(sql_str);
        return res;
    }

    async get_devicetype_by_uin(uin) {
        const res = await this.app.mysql.select('admin_weixin_uin', {
            where: {'uin': uin}
        });
        return res[0].devicetype;
    }

    async reset_status_frequent(id) {
        const row = {
            'id': id,
            'status': 0
        };
        const result = await this.app.mysql.update('admin_frequent_uin', row);
        const updateSuccess = result.affectedRows === 1;
        return updateSuccess;
    }

    async get_1_article_2_mark() {
        // const my_query = "SELECT * FROM push_weixin_articles_pool where status = 1 order by id asc limit 0,1;"
        const rows = await this.app.mysql.select('push_weixin_articles_pool', {
            where: {'status': 1},
            order: [['id', 'asc']],
            limit: 1,
        })
        // const results = await this.app.mysql.query(my_query);
        return rows[0];
    }

    async update_marked_article(id, sort, value) {
        const row = {
            id: id,
            sort: sort,
            is_value: value,
            status: 2
        }
        const result = await this.app.mysql.update('push_weixin_articles_pool', row); // 更新表中的记录
        // 判断更新成功
        const updateSuccess = result.affectedRows === 1;
        return updateSuccess;
    }

    async find_latest_article_and_count_in_24_hours(db, order_name, title_name) {
        const now_time = parseInt(new Date().getTime() / 1000);
        const interval_time = 24 * 60 * 60;
        const frequent_time_pass = now_time - interval_time;
        const sql_str = 'SELECT * FROM ' + db + ' where ' + order_name + ' > ' +  frequent_time_pass +' order by ' + order_name + ' desc;';

        const res = await this.app.mysql.query(sql_str);
        if(res.length == 0){
            return {
                "num": 0,
                "last_title": "No Article IN 24 Hours！",
                "last_update": 0
            }
        }
        const query_article = res[0];
        const num = res.length;
        const article = {
            'num': num,
            'last_title': query_article[title_name],
            'last_update': query_article[order_name]
        }
        return article;
    }

    async is_warned(service_name){
        const now_time = parseInt(new Date().getTime() / 1000);
        const interval_time = 24 * 60 * 60;
        const error_time_pass = now_time - interval_time;
        console.log("service_name----->", service_name)
        const my_query = "SELECT * FROM admin_error_service where service_name = '" + service_name + "' and outline_time > " + error_time_pass + " order by id limit 0,1;"
        console.log(my_query)
        const results = await this.app.mysql.query(my_query);
        console.log(results)
        if(results.length == 0){
            console.log('No result!!!')
            return false;
        }else{
            return true;
        }
    }

    async update_error_time(service_name){
        const now_time = parseInt(new Date().getTime() / 1000);
        const res = await this.app.mysql.select('admin_error_service', {
            where: {'service_name': service_name}
        });
        for(const re of res){
            const row = {
                'id': re.id,
                'outline_time': now_time
            }
            const result = await this.app.mysql.update('admin_error_service', row); // 更新表中的记录
            // 判断更新成功
            const updateSuccess = result.affectedRows === 1;
            return updateSuccess;
        }
    }
}

module.exports = MysqldbService;