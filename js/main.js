const version = '1.0.0';
const mazeSize = [7, 7];
const smartPhoneScalse = 0.7;
const pcScalse = 0.9;

let isSmartPhone;
let scale;
let display;
let mainColor0;
let mainColor1;

$(function () {
    mainColor0 = $(':root').css('--main-color-0');
    mainColor1 = $(':root').css('--main-color-1');
    const ua = navigator.userAgent;

    if (ua.match(/iPhone|Android.+Mobile/)) {
        scale = smartPhoneScalse;
        isSmartPhone = true;
    } else if (ua.match(/iPad|Android/)) {
        scale = pcScalse;
        isSmartPhone = true;
    } else {
        scale = pcScalse;
        isSmartPhone = false;
    }
    $('body').css({
        transform: 'scale(' + scale + ')',
        width: 'calc(100svw / ' + scale + ')',
        height: 'calc(100svh / ' + scale + ')',
    });

    $('#version').text(version);
    $('#maze-size').text(mazeSize[0] + ' x ' + mazeSize[1]);

    display = new Display();

    // ディスプレイのリサイズ
    $(window).on("resize", function () {
        display.resize();
    });
    $(window).on("orientationchange", function () {
        setTimeout(function() {display.resize();}, 300);
    });

    // バックスラッシュの選択
    $(document).on("selectionchange", function () {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);

            // jQueryオブジェクトに変換
            const $target = $(".backslash");

            // 選択範囲が要素と交差しているか確認
            for (let i = 0; i < $target.length; i++) {
                if (range.intersectsNode($target[i])) {
                    $target.eq(i).addClass("selected");
                } else {
                    $target.eq(i).removeClass("selected");
                }
            }
        }
    });


    display.showView(
        [[new AABB([-5, -3, -4], [5, -18, 4], mainColor0)]],
        [6, 10, 10], 
        {
            theta: Math.PI *2/3,
            phi: Math.PI *1.85  /3 
        });
});