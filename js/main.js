let isSmartPhone;


$(function () {
    const ua = navigator.userAgent;

    if (ua.match(/iPhone|Android.+Mobile/)) {
        $('body').addClass('smartphone');
        isSmartPhone = true;
    } else if (ua.match(/iPad|Android/)) {
        isSmartPhone = true;
    } else {
        isSmartPhone = false;
    }
});