const VERSION = '1.0.0';
const MAZE_SIZE = [9, 10];
const FPS = 30;

const SMARTPHONE_SCALE = 0.7;
const PC_SCALE = 1;
const SMARTPHONE_VERTICAL_VIEW_ANGLE = Math.PI / 3
const PC_VERTICAL_VIEW_ANGLE = Math.PI / 4
const SMARTPHONE_SENSITIVITY = 0.7;
const PC_SENSITIVITY = 1;
const VELOCITY = 1.5;

let game;
let isSmartPhone;
let scale;
let sensitivity;
let display;
let mainColor0;
let mainColor1;
let mainColor2;

$(function () {
    // カスタムプロパティを取得
    mainColor0 = $(':root').css('--main-color-0');
    mainColor1 = $(':root').css('--main-color-1');
    mainColor2 = $(':root').css('--main-color-2');

    // スマホかどうかの判定
    const ua = navigator.userAgent;

    if (ua.match(/iPhone|Android.+Mobile/)) {
        scale = SMARTPHONE_SCALE;
        verticalViewingAngle = SMARTPHONE_VERTICAL_VIEW_ANGLE;
        sensitivity = SMARTPHONE_SENSITIVITY;
        isSmartPhone = true;
        $('#instruction-mes').css({display: 'none'});
    } else if (ua.match(/iPad|Android/)) {
        scale = PC_SCALE;
        verticalViewingAngle = PC_VERTICAL_VIEW_ANGLE;
        sensitivity = PC_SENSITIVITY;
        isSmartPhone = true;
    } else {
        scale = PC_SCALE;
        verticalViewingAngle = PC_VERTICAL_VIEW_ANGLE;
        sensitivity = PC_SENSITIVITY;
        isSmartPhone = false;
    }
    $('body').css({
        transform: 'scale(' + scale + ')',
        width: 'calc(100svw / ' + scale + ')',
        height: 'calc(100svh / ' + scale + ')',
    });

    // 表示
    $('#version').text(VERSION);
    // $('#maze-size').text(MAZE_SIZE[0] + ' x ' + MAZE_SIZE[1]);
    $('#time').text('00:00:00');

    // 拡大縮小を禁止
    document.addEventListener('touchmove', function (event) {
        if (event.scale !== 1) {
            event.preventDefault();
        }
    }, { passive: false });
    document.addEventListener('gesturestart', function (e) {
        e.preventDefault();
    }, { passive: false });

    // スタート
    game = new Game(MAZE_SIZE, FPS, verticalViewingAngle, sensitivity, VELOCITY);
    game.start();
});