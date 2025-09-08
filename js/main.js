const VERSION = '1.0.0';
const MAZE_SIZE = [7, 7];
const FPS = 30;

const SMARTPHONE_SCALE = 0.7;
const PC_SCALE = 1;
const SMARTPHONE_SENSITIVITY = 0.8;
const PC_SENSITIVITY = 1;
const VELOCITY = 1.5;

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
        sensitivity = SMARTPHONE_SENSITIVITY;
        isSmartPhone = true;
    } else if (ua.match(/iPad|Android/)) {
        scale = PC_SCALE;
        sensitivity = PC_SENSITIVITY;
        isSmartPhone = true;
    } else {
        scale = PC_SCALE;
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

    // スタート
    game = new Game(MAZE_SIZE, FPS, sensitivity, VELOCITY);
    game.start();
});