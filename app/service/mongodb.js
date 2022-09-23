'use strict';

const Service = require('egg').Service;
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://10.168.1.100:27017/";


class MongodbService extends Service {
    async find_item_by_uin_from_mongodb(uin) {
        const my_sort = {
            'update_time': -1
        }
        const my_query = {
            'x-wechat-uin': uin
        }

        let conn = null;
        conn = await MongoClient.connect(url);
        console.log("数据库已连接");
        const url_db = conn.db("weixin").collection('url');
        // 取出最新的一个参数
        const result = url_db.find(my_query).sort(my_sort).limit(1).toArray();
        if (conn != null) {
            conn.close();
        }
        return result;
    }


    async findOneDocLastUpdated(db) {
        const my_sort = {
            'update_time': 1
        }
        const my_query = {
            'biz': {$ne: 'MzA4OTI4NjgxMQ=='}
        }
        let conn = null;
        conn = await MongoClient.connect(url);
        console.log("数据库已连接");
        const url_db = conn.db("weixin").collection(db);
        const result = url_db.find(my_query).sort(my_sort).limit(1).toArray();
        if (conn != null) {
            conn.close();
        }
        return result;
    }

    // 核心逻辑为距离爬取最近的文章，抓取阅读量的密度越高
    async get_items_from_mongodb(db) {
        let conn = null;
        //默认只爬取3天之内的数据
        const day = 3
        const time_limit = parseInt(new Date().getTime() / 1000) - parseInt(day * 24 * 60 * 60)
        conn = await MongoClient.connect(url);
        const url_db = conn.db("weixin").collection(db);
        console.log("get_items_from_mongodb数据库已连接");
        const my_query = {
            'add_time': {$gt: time_limit}
        }
        const my_field = {
            '_id': 1,
            'db': 1
        }
        const result_all = url_db.find(my_query, my_field);

        if (conn != null) {
            conn.close();
        }
        return result_all;
    }

    async find_latest_weibo_hot_and_count_in_24_hours() {
        let conn = null;
        //默认只爬取1天之内的数据
        const day = 1
        const time_limit = parseInt(new Date().getTime() / 1000) - parseInt(day * 24 * 60 * 60)
        conn = await MongoClient.connect(url);
        const url_db = conn.db('hot').collection('weibo');
        console.log("find_latest_weibo_hot_from_mongodb数据库已连接");
        const my_query = {
            'add_time': {$gt: time_limit}
        }
        const my_sort = {
            'add_time': -1
        }
        const result = url_db.find(my_query).sort(my_sort).limit(1).toArray();

        if (conn != null) {
            conn.close();
        }
        return result;
    }

    async find_latest_top(db) {
        console.log('find_latest_top')
        let conn = null;
        //默认只爬取1天之内的数据
        const day = 1
        const time_limit = parseInt(new Date().getTime() / 1000) - parseInt(day * 24 * 60 * 60)
        conn = await MongoClient.connect(url);
        const url_db = conn.db('top').collection(db);
        console.log("find_latest_top_from_mongodb数据库已连接");
        const my_query = {
            'add_time': {$gt: time_limit}
        }
        const my_sort = {
            'add_time': -1
        }
        const result = url_db.find(my_query).sort(my_sort).limit(1).toArray();

        if (conn != null) {
            conn.close();
        }
        return result;
    }

    async check_weixin() {
        console.log('check_weixin')
        const result =
            {
                'province': await this.select_weixin_articles('province'),
                'area': await this.select_weixin_articles('area'),
                'county': await this.select_weixin_articles('county')
            }
        return result;
    }

    async select_weixin_articles(db_name) {
        let conn = null;
        //默认只检查1天之内的数据
        const day = 1
        const time_limit = parseInt(new Date().getTime() / 1000) - parseInt(day * 24 * 60 * 60);
        conn = await MongoClient.connect(url);
        const url_db = conn.db('weixin').collection(db_name);
        console.log("check_weixin_from_mongodb数据库已连接");
        const my_query = {
            'add_time': {$gt: time_limit}
        }
        const my_query_no_logs = {
            'add_time': {$gt: time_limit},
            'check_time': null
        }
        const my_sort = {
            'add_time': -1
        }
        const last_one = await url_db.find(my_query).sort(my_sort).limit(1).toArray();
        console.log(last_one);
        const total_num = await url_db.find(my_query).count();
        const no_logs_num = await url_db.find(my_query_no_logs).count();
        const result = {
            'last_one': last_one,
            'total_num': total_num,
            'no_logs_num': no_logs_num
        }
        if (conn != null) {
            conn.close();
        }
        return result;
    }

    //将近线库保存时限之外的document移动到远线库保存
    async copy_db_to_bak_and_delete_duplicate(db_name, collection_name, bak_db_name, bak_collection_name) {
        const now_time = Math.floor(new Date().getTime() / 1000);
        const clear_time = this.app.config.ClearLimit;
        const time_limit = now_time - clear_time;
        let conn = null;
        conn = await MongoClient.connect(url);
        const now_db = conn.db(db_name).collection(collection_name);
        const bak_db = conn.db(bak_db_name).collection(bak_collection_name);
        console.log("check_weixin_from_mongodb数据库已连接");
        // 将add_time早于时限的doc找出来移动!!!
        const my_query = {
            'add_time': {$lt: time_limit}
        }
        const documents = await now_db.find(my_query).toArray();
        let i = 0;
        for(const doc of documents) {
            const query = {
                '_id': doc._id
            }
            const result = await bak_db.find(query).toArray();
            console.log("-------------------result--------------------");
            console.log(result);
            console.log("----------------------result-------------------");
            if(result.length == 0){
                const copy_result = await bak_db.insertOne(doc);
                if(copy_result.result.hasOwnProperty('ok')){
                    if(copy_result.result.ok == 1){
                        const del_result = await now_db.deleteOne(query);
                        if(del_result.result.hasOwnProperty('ok')){
                            if(del_result.result.ok == 1){
                                console.log(doc.title);
                                console.log(doc._id.toString());
                                console.log('Move OK!');
                            }
                        }else{
                            return 'Error in Del Old!!!';
                        }
                    }
                }else{
                    return 'Error in Save to BAK!!!';
                }
            }else{
                console.log('Document is Already Moved!');
            }
            i = i + 1;
        }
        return i.toString() + ' Documents in ' + db_name + ' - ' + collection_name + ' is Moved!';
    }
}

module.exports = MongodbService;