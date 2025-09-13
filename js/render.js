// --------数値計算--------
// ベクトル
class Vector {
    constructor(vector) {
        if (vector instanceof Vector) {
            this.data = vector.data;
        } else {
            this.data = vector;
        }
    }

    plus(other) {
        if (Array.isArray(other) && other.length === this.data.length) {
            let ans = [];
            for (let i = 0; i < this.data.length; i++) {
                ans[i] = this.data[i] + other[i];
            }
            return new Vector(ans);
        } else if (typeof other === 'number') {
            let ans = [];
            for (let i = 0; i < this.data.length; i++) {
                ans[i] = this.data[i] + other;
            }
            return new Vector(ans);
        } else {
            return this.plus(other.data);
        }
    }

    minus(other) {
        if (Array.isArray(other) && other.length === this.data.length) {
            let ans = [];
            for (let i = 0; i < this.data.length; i++) {
                ans[i] = this.data[i] - other[i];
            }
            return new Vector(ans);
        } else if (typeof other === 'number') {
            let ans = [];
            for (let i = 0; i < this.data.length; i++) {
                ans[i] = this.data[i] - other;
            }
            return new Vector(ans);
        } else {
            return this.minus(other.data);
        }
    }

    multiplyBy(other) {
        if (Array.isArray(other) && other.length === this.data.length) {
            let ans = [];
            for (let i = 0; i < this.data.length; i++) {
                ans[i] = this.data[i] * other[i];
            }
            return new Vector(ans);
        } else if (typeof other === 'number') {
            let ans = [];
            for (let i = 0; i < this.data.length; i++) {
                ans[i] = this.data[i] * other;
            }
            return new Vector(ans);
        } else {
            return this.multiplyBy(other.data);
        }
    }

    divideBy(other) {
        if (Array.isArray(other) && other.length === this.data.length) {
            let ans = [];
            for (let i = 0; i < this.data.length; i++) {
                ans[i] = this.data[i] / other[i];
            }
            return new Vector(ans);
        } else if (typeof other === 'number') {
            let ans = [];
            for (let i = 0; i < this.data.length; i++) {
                ans[i] = this.data[i] / other;
            }
            return new Vector(ans);
        } else {
            return this.divideBy(other.data);
        }
    }

    length() {
        return Math.sqrt(this.dot(this.data));
    }

    normalize() {
        return this.divideBy(this.length());
    }

    dot(other) {
        if (Array.isArray(other) && other.length === this.data.length) {
            let ans = 0;
            for (let i = 0; i < this.data.length; i++) {
                ans += this.data[i] * other[i];
            }
            return ans;
        } else {
            return this.dot(other.data);
        }
    }
}

// 行列
class Tensor {
    constructor(tensor) {
        if (tensor instanceof Tensor) {
            this.data = tensor.data;
        } else {
            this.data = tensor;
        }
    }

    dot(other) {
        if (Array.isArray(other)) {
            if (typeof other[0] === 'number') {
                // ベクトルとの内積
                const otherVec = new Vector(other);
                let ans = [];
                for (let i = 0; i < this.data.length; i++) {
                    ans[i] = otherVec.dot(this.data[i]);
                }
                return new Vector(ans);
            } else if (Array.isArray(other[0]) && other[0].length === this.data.length) {
                // 行列との積
                const otherVecs = [];
                for (let i = 0; i < other[0].length; i++) {
                    const vec = [];
                    for (let j = 0; j < other.length; j++) {
                        vec[j] = other[j][i];
                    }
                    otherVecs[i] = new Vector(vec);
                }

                let ans = [];
                for (let i = 0; i < this.data.length; i++) {
                    let row = [];
                    for (let j = 0; j < otherVecs.length; j++) {
                        row[j] = otherVecs[j].dot(this.data[i]);
                    }
                    ans[i] = row;
                }
                return new Tensor(ans);
            }

        } else {
            return this.dot(other.data);
        }
    }
}

// --------3dモデル--------
// AABB
class AABB {
    constructor(p1, p2, color) {
        if (p1 instanceof Vector) {
            p1 = p1.data;
        }
        if (p2 instanceof Vector) {
            p2 = p2.data;
        }

        let min = [];
        let max = [];
        for (let i = 0; i < p1.length; i++) {
            min[i] = Math.min(p1[i], p2[i]);
            max[i] = Math.max(p1[i], p2[i]);
        }
        this.min = new Vector(min);
        this.max = new Vector(max);

        this.color = color;
    }

    isRayIntersect(rayOrigin, rayDir) {
        let tMin = this.min.minus(rayOrigin).divideBy(rayDir).data;
        let tMax = this.max.minus(rayOrigin).divideBy(rayDir).data;

        if (rayOrigin instanceof Vector) {
            rayOrigin = rayOrigin.data;
        }
        if (rayDir instanceof Vector) {
            rayDir = rayDir.data;
        }

        let t1 = [];
        let t2 = [];
        for (let i = 0; i < rayDir.length; i++) {
            if (rayDir[i] == 0) {
                if (rayOrigin[i] < this.min.data[i] || this.max.data[i] < rayOrigin[i]) {
                    return false;
                }
                t1[i] = -Infinity;
                t2[i] = Infinity;
            } else {
                t1[i] = Math.min(tMin[i], tMax[i]);
                t2[i] = Math.max(tMin[i], tMax[i]);
            }
        }

        let tNear = Math.max.apply(null, t1);
        let tFar = Math.min.apply(null, t2);

        return tNear <= tFar && tFar > 0;
    }
}

class HolizontalTryangle {
    constructor(p1, p2, p3, color) {
        if (Array.isArray(p1)) {
            p1 = new Vector(p1);
        }
        if (Array.isArray(p2)) {
            p2 = new Vector(p2);
        }
        if (Array.isArray(p3)) {
            p3 = new Vector(p3);
        }

        if (p1.data.length === 2) {
            p1.data.push(0);
        }
        if (p2.data.length === 2) {
            p2.data.push(0);
        }
        if (p3.data.length === 2) {
            p3.data.push(0);
        }

        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;

        this.color = color;
    }

    isRayIntersect(rayOrigin, rayDir) {
        rayOrigin = new Vector(rayOrigin);
        rayDir = new Vector(rayDir);
        let t = -rayOrigin.data[2] / rayDir.data[2];
        if (rayDir.data[2] === 0 || t < 0) return false;

        let p = rayOrigin.plus(rayDir.multiplyBy(t));

        let v0 = this.p3.minus(this.p1);
        let v1 = this.p2.minus(this.p1);
        let v2 = p.minus(this.p1);

        let dot00 = v0.dot(v0);
        let dot01 = v0.dot(v1);
        let dot02 = v0.dot(v2);
        let dot11 = v1.dot(v1);
        let dot12 = v1.dot(v2);

        let invDen = 1 / (dot00 * dot11 - dot01 * dot01);
        let u = (dot11 * dot02 - dot01 * dot12) * invDen;
        let v = (dot00 * dot12 - dot01 * dot02) * invDen;

        return u >= 0 && v >= 0 && u + v <= 1;
    }
}
// --------その他--------
class Display {
    constructor(verticalViewingAngle = Math.PI / 4) {
        $('#display').html('');
        this.verticalViewingAngle = verticalViewingAngle;
        this.charSize = this.getCharSize($('#cmd-window'));
        this.displaySize = {
            width: 0,
            height: 0
        };
        this.animationId;
        this.isGameStarted = false;
        this.startedAt = null;
        
        this.defaultShellHeight = $('#cmd-window div:first')[0].getBoundingClientRect().height;
        this.resize();
    }

    start(field, player) {
        const animate = (now) => {
            this.showView(field, player.cameraPos, player.cameraDir);
            if (this.isGameStarted) {
                if (this.startedAt === null) {
                    this.startedAt = now;
                } else {
                    const timeDelta = now - this.startedAt
                    const hour = (Math.floor(timeDelta / 60 / 60 / 1000) + '').padStart(2, '0');
                    const minutes = (Math.floor(timeDelta / 60 / 1000) % 60 + '').padStart(2, '0');
                    const seconds = (Math.floor(timeDelta / 1000) % 60 + '').padStart(2, '0');
                    const secondsFraction = (Math.floor(timeDelta / 10) % 100 + '').padStart(2, '0');
                    $('#time').text(`${hour}:${minutes}:${seconds}.${secondsFraction}`);
                }
            }
            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    stop() {
        cancelAnimationFrame(this.animationId);
        this.isGameStarted = false;
        this.startedAt = null;
    }

    showView(layers, cameraPos, cameraDir) {
        const dTheta = this.verticalViewingAngle / (this.displaySize.height - 1);
        const dPhi = dTheta * this.charSize.width / this.charSize.height;

        // z軸周りにphiだけ回転する回転行列
        const TRot1 = new Tensor([
            [Math.cos(cameraDir.phi), Math.sin(cameraDir.phi), 0],
            [- Math.sin(cameraDir.phi), Math.cos(cameraDir.phi), 0],
            [0, 0, 1]
        ]);
        const TRot2 = new Tensor([
            [Math.sin(cameraDir.theta), 0, - Math.cos(cameraDir.theta)],
            [0, 1, 0],
            [Math.cos(cameraDir.theta), 0, Math.sin(cameraDir.theta)]
        ]);
        // 行列同士の掛け算を先に計算
        const TRot = TRot1.dot(TRot2);

        for (let i = 0; i < this.displaySize.height; i++) {
            for (let j = 0; j < this.displaySize.width; j++) {
                // 光線を用意
                const rayTheta = Math.PI / 2 + (i - this.displaySize.height / 2) * dTheta;
                const rayPhi = - (j - this.displaySize.width / 2) * dPhi;
                let rayDir = [
                    Math.sin(rayTheta) * Math.cos(rayPhi),
                    - Math.sin(rayTheta) * Math.sin(rayPhi),
                    Math.cos(rayTheta)
                ];
                // 回転
                rayDir = TRot.dot(rayDir);
                // console.log(rayDir)

                // 光線が当たった先の色を取得
                const rayColor = this.rayColor(layers, cameraPos, rayDir);
                if (rayColor) {
                    $('#char-' + i + '-' + j).css({ color: rayColor });
                } else {
                    $('#char-' + i + '-' + j).css({ color: 'transparent' });
                }
            }
        }
    }

    rayColor(layers, rayOrigin, rayDir) {
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            for (let j = 0; j < layer.length; j++) {
                const obj = layer[j];

                if (obj.isRayIntersect(rayOrigin, rayDir)) {
                    return obj.color;
                }
            }
        }
        return null;
    }

    // 画面の生成/リサイズ
    resize() {
        const prevWidth = this.displaySize.width;
        const prevHeight = this.displaySize.height;
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const $cmdWindow = $('#cmd-window');

        const rectCmdWindow = $cmdWindow[0].getBoundingClientRect();
        // const rectDiv = $('#cmd-window div:first')[0].getBoundingClientRect();
        const boxWidth = rectCmdWindow.width - 10;
        const boxHeight = rectCmdWindow.height - this.defaultShellHeight - 20;

        this.displaySize.width = Math.floor(boxWidth / this.charSize.width);
        this.displaySize.height = Math.floor(boxHeight / this.charSize.height);

        // 行数の調整
        if (this.displaySize.height > prevHeight) {
            // 高さが広がった場合
            for (let i = prevHeight; i < this.displaySize.height; i++) {
                const $row = $('<div></div>').attr('id', 'row-' + i); // idを設定

                for (let j = 0; j < prevWidth; j++) {
                    const $span = $('<span>' + getRandomChar() + '</span>')
                        .attr('id', 'char-' + i + '-' + j); // idを設定

                    // container内に追加
                    $row.append($span);
                }
                $('#display').append($row);
            }
        } else if (this.displaySize.height < prevHeight) {
            // 高さが狭まった場合
            for (let i = this.displaySize.height; i < prevHeight; i++) {
                $('#row-' + i).remove();
            }
        }

        // 列数の調整
        if (this.displaySize.width > prevWidth) {
            // 幅が広がった場合
            for (let i = 0; i < this.displaySize.height; i++) {
                const $row = $('#row-' + i);

                for (let j = prevWidth; j < this.displaySize.width; j++) {
                    const $span = $('<span>' + getRandomChar() + '</span>')
                        .attr('id', 'char-' + i + '-' + j); // idを設定

                    // container内に追加
                    $row.append($span);
                }
            }
        } else if (this.displaySize.width < prevWidth) {
            // 幅が狭まった場合
            for (let i = 0; i < this.displaySize.height; i++) {
                for (let j = this.displaySize.width; j < prevWidth; j++) {
                    $('#char-' + i + '-' + j).remove();
                }
            }
        }

        // ランダムな一文字を取得
        function getRandomChar() {
            return chars[Math.floor(Math.random() * chars.length)];
        }
    }

    // 表示される文字のサイズを取得
    getCharSize($box) {
        // 計測用の1文字（等幅フォントなので何でもOK）
        let $span = $('<span>M</span>').css({
            visibility: 'hidden',
            whiteSpace: 'nowrap',
            fontSize: $box.css('font-size'),
            fontFamily: $box.css('font-family')
        }).appendTo($box);

        // getBoundingClientRect でサブピクセルまで取得
        let rect = $span[0].getBoundingClientRect();
        let charWidth = rect.width;
        let charHeight = rect.height;

        $span.remove();

        return { width: charWidth, height: charHeight };
    }

    close() {
        this.stop();
        $('#display').html('');
        this.displaySize = {
            width: 0,
            height: 0
        };
    }
}