'use strict';

/** @type Egg.EggPlugin */
module.exports = {
    // had enabled by egg
    // static: {
    //   enable: true,
    // }
    mysql: {
        enable: true,
        package: 'egg-mysql',
    },

    //mongodb
    mongoose: {
        enable: true,
        package: 'egg-mongoose'
    },

    // sequelize: {
    //     enable: true,
    //     package: 'egg-sequelize',
    // }
};
