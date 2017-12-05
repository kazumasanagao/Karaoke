var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    switch (req.query.hl) {
        case "ja":
            res.render('privacy_ja');
            break;
        default:
            res.render('privacy');
    }
});

module.exports = router;
