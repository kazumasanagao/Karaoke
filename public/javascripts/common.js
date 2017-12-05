function getCookie(name) {
    var result = null;
    var cookieName = name + '=';
    var allcookies = document.cookie;
    var position = allcookies.indexOf( cookieName );
    if(position != -1) {
        var startIndex = position + cookieName.length;
        var endIndex = allcookies.indexOf( ';', startIndex );
        if(endIndex == -1) {
            endIndex = allcookies.length;
        }
        result = decodeURIComponent(
            allcookies.substring(startIndex, endIndex));
    }
    return result;
}

function flagImgAddFunc(isWhite) {
    $(".flagImg").click(function() {
        var index = $('.flagImg').index(this);
        var imgSrc = $('.flagImg').eq(index).attr("src");
        var country;
        if (imgSrc.length == 21) {
            country = imgSrc.slice(-6,-4);
            $.getScript("./javascripts/countryMap.js", function() {
                if (countryMap[country]) {
                    $("#toastCountry").html(countryMap[country]);
                    if (isWhite) {
                        toast("#toastCountry", isWhite);
                    } else {
                        toast("#toastCountry");
                    }
                }
            });
        }
    });
}

var toastTimer;
function toast(id, isWhite) {
    $(id).show();
    if (isWhite) {
        $("#toast").css({"background":"white"});
        $(".toastMessage").css({"color":"black"});
    }
    $("#toast").fadeIn('slow', function() {
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function() {
            $("#toast").fadeOut('slow', function() {
                $(id).hide();
                if (isWhite) {
                    $("#toast").css({"background":"black"});
                    $(".toastMessage").css({"color":"white"});
                }
            });
        }, 2500);
    });
}

var isMobile = (window.innerWidth < 800) ? true : false;

window.onresize = function() {
    var w = window.innerWidth;
    if (isMobile && w >= 800) {
        isMobile = false;
        changeToPC();
        return;
    }
    if (!isMobile && w < 800) {
        isMobile = true;
        changeToMobile();
        return;
    }
};