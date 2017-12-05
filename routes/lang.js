function getLang(req) {
    var lang = req.headers['accept-language'];
    if (lang && lang.length >= 2) {
        var langCut = lang.slice(0,2); 
        switch (langCut) {
            case "ja":
                return "ja";
            default:
                return "en";
        }
    } else {
        return "en";
    }
}

module.exports = {
    getLang: getLang
}
