'use strict';

let router                    = require('../services').router;
let ee                        = require('../services').ee;

router.get('/', function(req, res){
    res.send('special');
});


router = require('./route/download')(router);
//..

/* carpetas */
router = require('./route/cola')(router);
router = require('./route/extensiones')(router);

module.exports = router;

