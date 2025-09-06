const version = '1.0.0';
const mazeSize = [7, 7];

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

    $('#version').text(version);
    $('#maze-size').text(mazeSize[0] + ' x ' + mazeSize[1]);
});