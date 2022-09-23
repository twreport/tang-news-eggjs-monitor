'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.get('/wx', controller.home.check_weixin);
  router.get('/status', controller.home.check_status);
  router.get('/db', controller.home.check_db);


  router.get('/api', controller.api.index);
  router.get('/api/get_1_article_2_mark', controller.api.get_1_article_2_mark);
  router.post('/api/update_marked_article', controller.api.update_marked_article);
};
