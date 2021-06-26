let conf   = require('../services').config;
let libmysql = require('mysql2');


let gestionPBX = libmysql.createPool({
    host:                conf.config.mysql.host,
    user:                conf.config.mysql.user,
    password:            conf.config.mysql.pass,
    database:            conf.config.mysql.database,
    waitForConnections:  true,
    connectionLimit:     10,
    queueLimit:          0
});
let BAKCDR = libmysql.createPool({
    host:                conf.config.mybak.host,
    user:                conf.config.mybak.user,
    password:            conf.config.mybak.pass,
    database:            conf.config.mybak.database,
    waitForConnections:  conf.config.mybak.waitCon,
    connectionLimit:     conf.config.mybak.limit,
    queueLimit:          conf.config.mybak.queueLimit
});

module.exports = {
    gestionPBX,
    BAKCDR
};
