let web    = require('../services').web;
let conf   = require('../services').config;
let router = require('../source/router');

web.listen(conf.config.web.port, conf.config.server_info.ip_address);

app.use('/', router);

conf.config.web.loaded = 'on';
