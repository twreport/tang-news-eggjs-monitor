
'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {
    mysql: {
      // 单数据库信息配置
      client: {
        // host
        host: '10.168.1.100',
        // 端口号
        port: '3306',
        // 用户名
        user: 'nodejs',
        // 密码
        password: 'tw7311',
        // 数据库名
        database: 'news',
      },
      // 是否加载到 app 上，默认开启
      app: true,
      // 是否加载到 agent 上，默认关闭
      agent: false,
    },

    // 连接mongodb的配置
    mongoose: {
      client: {
        url: 'mongodb://10.168.1.100:27017/weixin',
        options: {
          useUnifiedTopology: true
        },
      }
    },

    // sequelize配置
    // sequelize: {
    //   dialect: 'mysql',
    //   host: '10.168.1.100',
    //   port: 3306,
    //   database: 'news',
    //   username: 'nodejs',
    //   password: 'tw7311'
    // }
  };


  //关闭csrf机制
  config.security = {
    csrf: {
      enable: false
    }
  };


  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1655720052619_6531';

  // add your middleware config here
  config.middleware = [];

  // add your user config here
  const userConfig = {
    // myAppName: 'egg',
    // 近线库只保存15天之内的公众号文章
    ClearLimit: 15 * 24 * 60 * 60,

    // 阿里云数据库在线检测url
    TangweiCCDBCheckUrl: 'https://tangwei.cc/api/monitor/',

    // 阿里云后台服务器在线检测url
    TangweiCCCheckUrl: 'https://tangwei.cc/api/',

    // 人工智能分析关键词定时运行Url
    EggjsParseAiKeywords: 'http://10.168.1.100:7007/',

    // 人工智能分析话题定时运行Url
    EggjsParseAiTopic: 'http://10.168.1.100:7008/',

    // 微信本地公众号分析定时运行Url
    EggjsParseLocal: 'http://10.168.1.100:7006/',

    // 社交媒体排行榜爬取定时运行Url
    EggjsSocialUrl: 'http://10.168.1.100:7005/',

    // monitor url
    MonitorUrl: 'http://10.168.1.100:7009/',

    // 人工智能分析服务器Url
    FlaskParseAi: 'http://10.168.1.99:5001/ai/test/status',

    // 微信本地公众号分析服务器Url
    FlaskParseLocal: 'http://10.168.1.99:5000/api/test/status',

  };

  return {
    ...config,
    ...userConfig,
  };
};