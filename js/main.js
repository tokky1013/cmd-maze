const version = '1.0.0';
const mazeSize = [7, 7];
const smartPhoneScalse = 0.7;

let isSmartPhone;
let scale;
let displaySize = {
    width: 0,
    height: 0
};

// ディスプレイの表示関連
function resizeDisplay() {
    const prevWidth = displaySize.width;
    const prevHeight = displaySize.height;
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const $cmdWindow = $('#cmd-window');

    const charSize = getCharSize($cmdWindow);

    const boxWidth = ($cmdWindow.innerWidth() - 10) * scale;
    const boxHeight = ($cmdWindow.innerHeight() - $('#cmd-window div:first').outerHeight(true) - 20) * scale;

    displaySize.width = Math.floor(boxWidth / charSize.width);
    displaySize.height = Math.floor(boxHeight / charSize.height);

    // 行数の調整
    if(displaySize.height > prevHeight) {
        // 高さが広がった場合
        for (let i = prevHeight; i < displaySize.height ; i++) {
            const $row = $('<div></div>').attr('id', 'row-' + i); // idを設定

            for (let j = 0; j < prevWidth; j++) {
                const $span = $('<span>' + getRandomChar() + '</span>')
                    .attr('id', 'char-' + i + '-' + j); // idを設定

                // container内に追加
                $row.append($span);
            }
            $('#display').append($row);
        }
    } else if(displaySize.height < prevHeight) {
        // 高さが狭まった場合
        for (let i = displaySize.height; i < prevHeight; i++) {
            $('#row-' + i).remove();
        }
    }

    // 列数の調整
    if(displaySize.width > prevWidth) {
        // 幅が広がった場合
        for (let i = 0; i < displaySize.height ; i++) {
            const $row = $('#row-' + i);

            for (let j = prevWidth; j < displaySize.width; j++) {
                const $span = $('<span>' + getRandomChar() + '</span>')
                    .attr('id', 'char-' + i + '-' + j); // idを設定

                // container内に追加
                $row.append($span);
            }
        }
    } else if(displaySize.width < prevWidth) {
        // 幅が狭まった場合
        for (let i = 0; i < displaySize.height ; i++) {
            for (let j = displaySize.width; j < prevWidth; j++) {
                $('#char-' + i + '-' + j).remove();
            }
        }
    }

    // 表示される文字のサイズを取得
    function getCharSize($box) {
        // 計測用の1文字（等幅フォントなので何でもOK）
        let $span = $('<span>M</span>').css({
            visibility: 'hidden',
            whiteSpace: 'nowrap',
            fontSize: $box.css('font-size'),
            fontFamily: $box.css('font-family')
        }).appendTo($box);

        // getBoundingClientRect でサブピクセルまで取得
        let rect = $span[0].getBoundingClientRect();
        let charWidth  = rect.width;
        let charHeight = rect.height;
        
        $span.remove();

        return { width: charWidth, height: charHeight };
    }
    // ランダムな一文字を取得
    function getRandomChar() {
        return chars[Math.floor(Math.random() * chars.length)];
    }
}



$(function () {
    const ua = navigator.userAgent;

    if (ua.match(/iPhone|Android.+Mobile/)) {
        scale = smartPhoneScalse;
        $('body').css({zoom: scale});
        isSmartPhone = true;
    } else if (ua.match(/iPad|Android/)) {
        scale = 1;
        isSmartPhone = true;
    } else {
        scale = 1;
        isSmartPhone = false;
    }

    $('#version').text(version);
    $('#maze-size').text(mazeSize[0] + ' x ' + mazeSize[1]);

    resizeDisplay();

    $(window).on("resize", function () {
        resizeDisplay();
    });
    $(window).on("orientationchange", function () {
        setTimeout(resizeDisplay, 300);
    });
});