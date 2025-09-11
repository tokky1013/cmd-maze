const VERSION = '1.0.0';
const MAZE_SIZE = [9, 10];
const FPS = 30;

const SMARTPHONE_SCALE = 0.7;
const PC_SCALE = 1;
const SMARTPHONE_VERTICAL_VIEW_ANGLE = Math.PI / 2.5
const PC_VERTICAL_VIEW_ANGLE = Math.PI / 4
const SMARTPHONE_SENSITIVITY = 0.7;
const PC_SENSITIVITY = 1;
const SMARTPHONE_WALL_HEIGHT = 0.8;
const PC_WALL_HEIGHT = 0.9;
const SMARTPHONE_CAMERA_HEIGHT = 0.56;
const PC_CAMERA_HEIGHT = 0.63;
const VELOCITY = 1.5;

let game;
let isSmartPhone;
let mainColor0;
let mainColor1;
let mainColor2;

function enter(value) {
    const $input = $('input.focus');
    $input.val(value);
    $input.trigger(jQuery.Event("keypress", { key: "Enter", keyCode: 13, which: 13 }));
}

$(function () {
    // カスタムプロパティを取得
    mainColor0 = $(':root').css('--main-color-0');
    mainColor1 = $(':root').css('--main-color-1');
    mainColor2 = $(':root').css('--main-color-2');

    // スマホかどうかの判定
    const ua = navigator.userAgent;
    
    let scale;
    let verticalViewingAngle;
    let sensitivity;
    let wallHeight;
    let cameraHeight;

    if (ua.match(/iPhone|Android.+Mobile/)) {
        scale = SMARTPHONE_SCALE;
        verticalViewingAngle = SMARTPHONE_VERTICAL_VIEW_ANGLE;
        sensitivity = SMARTPHONE_SENSITIVITY;
        wallHeight = SMARTPHONE_WALL_HEIGHT;
        cameraHeight = SMARTPHONE_CAMERA_HEIGHT;
        isSmartPhone = true;
        $('body').addClass('smartphone');
    } else if (ua.match(/iPad|Android/)) {
        scale = PC_SCALE;
        verticalViewingAngle = PC_VERTICAL_VIEW_ANGLE;
        sensitivity = PC_SENSITIVITY;
        wallHeight = PC_WALL_HEIGHT;
        cameraHeight = PC_CAMERA_HEIGHT;
        isSmartPhone = true;
    } else {
        scale = PC_SCALE;
        verticalViewingAngle = PC_VERTICAL_VIEW_ANGLE;
        sensitivity = PC_SENSITIVITY;
        wallHeight = PC_WALL_HEIGHT;
        cameraHeight = PC_CAMERA_HEIGHT;
        isSmartPhone = false;
    }
    $('body').css({
        transform: 'scale(' + scale + ')',
        width: 'calc(100svw / ' + scale + ')',
        height: 'calc(100svh / ' + scale + ')',
    });

    // 表示
    $('#version').text(VERSION);

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
    game = new Game(
        mazeSize=MAZE_SIZE,
        fps=FPS,
        verticalViewingAngle=verticalViewingAngle,
        sensitivity=sensitivity,
        velocity=VELOCITY,
        pathWidth=1,
        wallHeight=wallHeight,
        wallThickness=0.3,
        cameraHeight=cameraHeight
    );
    game.start();
});