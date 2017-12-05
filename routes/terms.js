var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    switch (req.query.hl) {
        case "ja":
            res.render('terms_ja');
            break;
        default:
            res.render('terms');
    }
});

module.exports = router;
