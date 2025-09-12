class Game {
    constructor(mazeSize, fps, verticalViewingAngle, sensitivity, velocity, pathWidth, wallHeight, wallThickness, cameraHeight) {
        this.display = new Display(verticalViewingAngle);
        this.field = [];
        this.mazeSize = mazeSize;
        this.ds = 1 / fps;
        this.pathWidth = pathWidth;
        this.wallHeight = wallHeight;
        this.wallThickness = wallThickness;
        this.cameraHeight = cameraHeight;

        this.sensitivity = sensitivity;

        this.player = new Player(
            [0, 0, 0],
            {
                theta: Math.PI,
                phi: Math.PI / 2
            },
            0.4,
            velocity
        );
    }

    start() {
        const mazeWidth = (this.pathWidth + this.wallThickness) * this.mazeSize[0] + this.wallThickness;
        const mazeHeight = (this.pathWidth + this.wallThickness) * (this.mazeSize[1] + 2) + this.wallThickness;
        const cameraHeight1 = mazeWidth / 2 / Math.tan(this.display.verticalViewingAngle * this.display.displaySize.width * this.display.charSize.width / this.display.displaySize.height / this.display.charSize.height / 2);
        const cameraHeight2 = mazeHeight / 2 / Math.tan(this.display.verticalViewingAngle / 2);

        this.player.cameraPos = new Vector([0, 0, Math.max(cameraHeight1, cameraHeight2)]);
        this.player.cameraDir = {
            theta: Math.PI,
            phi: Math.PI / 2
        };
        this.field = this.generateMaze();
        this.display.showView(this.field, this.player.cameraPos, this.player.cameraDir);

        const viewpointTransitionTime = 2;
        const dCameraPos = this.player.cameraPos.minus([0, ((this.pathWidth + this.wallThickness) * this.mazeSize[1] + this.pathWidth) / 2, this.cameraHeight]).multiplyBy(-1 / viewpointTransitionTime);
        const dTheta = (Math.PI / 2 - this.player.cameraDir.theta) / viewpointTransitionTime;
        const dPhi = (Math.PI / 2 - this.player.cameraDir.phi) / viewpointTransitionTime;

        setTimeout(() => {
            // 毎フレームの処理を開始
            this.player.start(this.field[0]);
            this.display.start(this.field, this.player);

            // 最初の上から降りてくるアニメーションを実行
            const initialCameraPos = this.player.cameraPos;
            const initialCameraDirTheta = this.player.cameraDir.theta;
            const initialCameraDirPhi = this.player.cameraDir.phi;

            let initialTime;
            const animate = (now) => {
                if (initialTime) {
                    const timeDelta = (now - initialTime) / 1000;
                    this.player.cameraPos = initialCameraPos.plus(dCameraPos.multiplyBy(timeDelta));
                    this.player.cameraDir.theta = initialCameraDirTheta + dTheta * timeDelta;
                    this.player.cameraDir.phi = initialCameraDirPhi + dPhi * timeDelta;
                } else {
                    initialTime = now;
                }
                if ((now - initialTime) >= viewpointTransitionTime * 1000) {
                    // アニメーションが終わったらスタート
                    this.player.cameraPos = new Vector([0, ((this.pathWidth + this.wallThickness) * this.mazeSize[1] + this.pathWidth) / 2, this.cameraHeight]);
                    this.player.cameraDir.theta = Math.PI / 2;
                    this.player.cameraDir.phi = Math.PI / 2;

                    this.setEvents();
                    this.display.isGameStarted = true;
                } else {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }, 1000);
    }

    stop() {
        this.clearEvents();
        this.display.stop();
        this.player.stop();
    }

    goal() {
        // ゴール時の処理
        this.stop();
        const $clearMes = $('#clear-mes');
        $clearMes.html('<br>Clear!<br><br>');

        const checkInput = (val) => {
            if (!val) {
                this.addInput($clearMes, 'Want to play again(Y/N)? ', checkInput);
            } else if (val.toLowerCase() === 'y') {
                $('#btns').removeClass('game-clear');
                $clearMes.html('');
                this.start();
            } else {
                const $div = $('<div>');
                $div.text('Input other than Y is not accepted.')
                $clearMes.append($div);
                this.addInput($clearMes, 'Want to play again(Y/N)? ', checkInput);
            }
            $('#cmd-window').scrollTop($('#cmd-window')[0].scrollHeight);
        }
        this.addInput($clearMes, 'Want to play again(Y/N)? ', checkInput);

        $('#btns').addClass('game-clear');
        $('#cmd-window').scrollTop($('#cmd-window')[0].scrollHeight);
    }

    addInput($box, text = '', onEnter = null) {
        let $div = $('<div>', {
            class: 'prompt-container'
        });
        $div.html(text);

        let $input = $("<input>", {
            type: "text",
            class: 'prompt focus'
        });
        // $input.addClass();
        // $input.on("keydown", (e) => {
        $input.keypress(function (e) {
            if (e.keyCode === 13) {
                // エンターが押されたら
                $(this).prop('disabled', true);
                $(this).removeClass('focus');
                $(this).off();

                if (onEnter) {
                    onEnter($(this).val());
                }
            }
        });
        if (isSmartPhone) {
            $input.on("focus", function () {
                // フォーカスが外れそうになったらまた戻す
                $(this).blur();
            });
        } else {
            $input.on("blur", function () {
                // フォーカスが外れそうになったらまた戻す
                $(this).focus();
            });
        }

        $div.append($input);
        $box.append($div);
        $input.focus();

        $('#cmd-window').scrollTop($('#cmd-window')[0].scrollHeight);
    }

    setEvents() {
        const goalHeight = - (this.pathWidth + this.wallThickness) * (this.mazeSize[1] + 1) / 2;
        this.player.onMove = (p) => {
            if (p.cameraPos.data[1] < goalHeight) {
                this.goal();
            }
        }
        // ディスプレイのリサイズ
        const resize = () => this.display.resize();
        $(window).on("resize", resize);
        $(window).on("orientationchange", function () {
            setTimeout(resize, 300);
        });


        // 各種操作のイベントを設定
        let joystickTouchId = null;
        let cameraTouchId = null;
        // ----視点移動----
        let isDragging = false;

        let initialCursorPosX;
        let initialCursorPosY;
        let initialCameraDirTheta;
        let initialCameraDirPhi;

        // 押した瞬間
        $("#cmd-window").on("mousedown", (e) => {
            isDragging = true;
            initialCursorPosX = e.clientX;
            initialCursorPosY = e.clientY;
            initialCameraDirTheta = this.player.cameraDir.theta;
            initialCameraDirPhi = this.player.cameraDir.phi;
        });

        $("#cmd-window").on("touchstart", (e) => {
            // まだカメラ用の指がなければ割り当てる
            for (let touch of e.originalEvent.changedTouches) {
                if (touch.identifier !== joystickTouchId && cameraTouchId === null) {
                    cameraTouchId = touch.identifier;
                    initialCursorPosX = touch.clientX;
                    initialCursorPosY = touch.clientY;
                    initialCameraDirTheta = this.player.cameraDir.theta;
                    initialCameraDirPhi = this.player.cameraDir.phi;
                }
            }
        });

        // 移動中
        $(document).on("mousemove", (e) => {
            if (!isDragging) return;
            const boxWidth = $('#cmd-window')[0].getBoundingClientRect().width;

            const radPerPx = this.sensitivity * Math.PI / boxWidth

            this.player.cameraDir.phi = initialCameraDirPhi + radPerPx * (e.clientX - initialCursorPosX);
            this.player.cameraDir.theta = initialCameraDirTheta - radPerPx * (e.clientY - initialCursorPosY);
            this.player.cameraDir.theta = Math.min(Math.max(0, this.player.cameraDir.theta), Math.PI);
        });

        $(document).on("touchmove", (e) => {
            for (let touch of e.originalEvent.touches) {
                if (touch.identifier === cameraTouchId) {
                    const boxWidth = $('#cmd-window')[0].getBoundingClientRect().width;

                    const radPerPx = this.sensitivity * Math.PI / boxWidth

                    this.player.cameraDir.phi = initialCameraDirPhi + radPerPx * (touch.clientX - initialCursorPosX);
                    this.player.cameraDir.theta = initialCameraDirTheta - radPerPx * (touch.clientY - initialCursorPosY);
                    this.player.cameraDir.theta = Math.min(Math.max(0, this.player.cameraDir.theta), Math.PI);
                }
            }
        });

        // 離した瞬間
        $(document).on("mouseup", (e) => {
            isDragging = false;
        });


        $(document).on("touchend", (e) => {
            for (let t of e.originalEvent.changedTouches) {
                if (t.identifier === cameraTouchId) {
                    cameraTouchId = null;
                }
            }
        });

        // ----移動----
        // pc
        let wIsPressed = false;
        let aIsPressed = false;
        let sIsPressed = false;
        let dIsPressed = false;
        $(document).on("keydown", (e) => {
            if (e.code === "KeyW") {
                this.player.isMoving = true;
                wIsPressed = true;
            } else if (e.code === "KeyA") {
                this.player.isMoving = true;
                aIsPressed = true;
            } else if (e.code === "KeyS") {
                this.player.isMoving = true;
                sIsPressed = true;
            } else if (e.code === "KeyD") {
                this.player.isMoving = true;
                dIsPressed = true;
            }

            // 動く方向を計算
            let movingDirX = (wIsPressed ? 1 : 0) + (sIsPressed ? -1 : 0);
            let movingDirY = (dIsPressed ? 1 : 0) + (aIsPressed ? -1 : 0);
            const len = movingDirX ** 2 + movingDirY ** 2;
            if (len !== 0) {
                movingDirX /= len;
                movingDirY /= len;
            }
            this.player.movingDir = [movingDirX, movingDirY];
        });

        $(document).on("keyup", (e) => {
            if (e.code === "KeyW") {
                wIsPressed = false;
            } else if (e.code === "KeyA") {
                aIsPressed = false;
            } else if (e.code === "KeyS") {
                sIsPressed = false;
            } else if (e.code === "KeyD") {
                dIsPressed = false;
            }

            if (!(wIsPressed || aIsPressed || sIsPressed || dIsPressed)) {
                this.player.isMoving = false;
            } else {
                // 動く方向を計算
                let movingDirX = (wIsPressed ? 1 : 0) + (sIsPressed ? -1 : 0);
                let movingDirY = (dIsPressed ? 1 : 0) + (aIsPressed ? -1 : 0);
                this.player.movingDir = [movingDirX, movingDirY];
            }
        });

        // スマホ
        let initialJoystickPosX;
        let initialJoystickPosY;
        $("#joystick-container").on("touchstart", (e) => {
            let touch = e.originalEvent.changedTouches[0];
            if (joystickTouchId === null) {
                joystickTouchId = touch.identifier;
            }
            this.player.isMoving = true;
            initialJoystickPosX = touch.clientX;
            initialJoystickPosY = touch.clientY;
        });

        $('#joystick-container').on("touchmove", (e) => {
            for (let touch of e.originalEvent.touches) {
                if (touch.identifier === joystickTouchId) {
                    const $joystick = $('#joystick');

                    const maxRange = 70;

                    let joystickPos = new Vector([touch.clientX - initialJoystickPosX, touch.clientY - initialJoystickPosY]);
                    joystickPos = joystickPos.divideBy(Math.max(joystickPos.length() / maxRange, 1));

                    $joystick.css({ transform: `translate(${joystickPos.data[0]}px,${joystickPos.data[1]}px)` });

                    joystickPos = joystickPos.divideBy(maxRange).data;
                    this.player.movingDir = [-joystickPos[1], joystickPos[0]];
                }
            }
        });

        $('#joystick-container').on("touchend", (e) => {
            for (let touch of e.originalEvent.changedTouches) {
                if (touch.identifier === joystickTouchId) {
                    joystickTouchId = null;
                    this.player.isMoving = false;
                    const $joystick = $('#joystick');

                    $joystick.css({ transform: 'translate(0px, 0px)' });
                }
            }
        });

        $(window).on('keydown', (e) => {
            if (e.keyCode === 67 && (e.ctrlKey || e.metaKey)) { // ctrl+c
                this.stop();
                this.display.close();

                // 次の入力を要求
                const $mesBox = $('#cmd-window div:first');     // ここ要検討

                const checkInput = (val) => {
                    val = val.replace(/^\s+/, '');
                    val = val.replace(/\s+$/, '');
                    if (!val) {
                        this.addInput($mesBox, 'C:<span class="backslash">\\</span>Users<span class="backslash">\\</span>user>', checkInput);
                    } else {
                        const args = val.split(/\s+/);
                        if (args[0] === 'python' || args[0] === 'python3') {
                            if (args[1] === 'cmd_maze.py') {

                            } else {
                                let $div = $('<div>', {
                                    class: 'prompt-container'
                                });
                                $div.html(`python: can't open file 'C:<span class="backslash">\\</span>Users<span class="backslash">\\</span>user<span class="backslash">\\</span>` + args[1] + `': [Errno 2] No such file or directory<br><br>`);
                                $mesBox.append($div);
                                this.addInput($mesBox, 'C:<span class="backslash">\\</span>Users<span class="backslash">\\</span>user>', checkInput);
                            }
                        } else {
                            let $div = $('<div>', {
                                class: 'prompt-container'
                            });
                            $div.html(`'` + args[0] + `' は、内部コマンドまたは外部コマンド、<br>
                                操作可能なプログラムまたはバッチ ファイルとして認識されていません。<br><br>`);
                            $mesBox.append($div);
                            this.addInput($mesBox, 'C:<span class="backslash">\\</span>Users<span class="backslash">\\</span>user>', checkInput);
                        }
                    }
                    $('#cmd-window').scrollTop($('#cmd-window')[0].scrollHeight);
                }
                this.addInput($mesBox, 'C:<span class="backslash">\\</span>Users<span class="backslash">\\</span>user>', checkInput);

                $('#btns').addClass('game-clear');
                $('#cmd-window').scrollTop($('#cmd-window')[0].scrollHeight);
            }
        });

        $(window).on('blur', () => {
            joystickTouchId = null;
            cameraTouchId = null;

            isDragging = false;

            wIsPressed = false;
            aIsPressed = false;
            sIsPressed = false;
            dIsPressed = false;

            this.player.isMoving = false;
            $('#joystick').css({ transform: 'translate(0px, 0px)' });
        });
        $('#joystick-container').addClass('game-start');
    }

    clearEvents() {
        $(window).off();
        $("#cmd-window").off();
        $(document).off();
        $("#joystick-container").off();
        $('#joystick-container').removeClass('game-start');
        this.player.onMove = null;
        this.player.isMoving = false;
        $('#joystick').css({ transform: 'translate(0px, 0px)' });
    }

    generateMaze() {
        let holizontalWalls = Array.from({ length: this.mazeSize[1] - 1 }, () => Array(this.mazeSize[0]).fill(true));
        let verticalWalls = Array.from({ length: this.mazeSize[1] }, () => Array(this.mazeSize[0] - 1).fill(true));
        let visited = Array.from({ length: this.mazeSize[1] }, () => Array(this.mazeSize[0]).fill(false));


        // 移動方向（上下左右）
        let dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];

        generate(Math.floor(this.mazeSize[0] / 2), 0, this.mazeSize);

        let objects = [];
        const mazeWidth = (this.pathWidth + this.wallThickness) * this.mazeSize[0] + this.wallThickness;
        const mazeHeight = (this.pathWidth + this.wallThickness) * this.mazeSize[1] + this.wallThickness;
        // 左右の壁
        objects.push(new AABB(
            [-mazeWidth / 2, -mazeHeight / 2, 0],
            [-mazeWidth / 2 + this.wallThickness, mazeHeight / 2, this.wallHeight],
            mainColor0
        ));
        objects.push(new AABB(
            [mazeWidth / 2 - this.wallThickness, -mazeHeight / 2, 0],
            [mazeWidth / 2, mazeHeight / 2, this.wallHeight],
            mainColor0
        ));

        // 上の壁
        objects.push(new AABB(
            [this.pathWidth / 2, -mazeHeight / 2, 0],
            [mazeWidth / 2, -mazeHeight / 2 + this.wallThickness, this.wallHeight],
            mainColor0
        ));
        objects.push(new AABB(
            [-mazeWidth / 2, -mazeHeight / 2, 0],
            [-this.pathWidth / 2, -mazeHeight / 2 + this.wallThickness, this.wallHeight],
            mainColor0
        ));

        // 下の壁
        objects.push(new AABB(
            [this.pathWidth / 2, mazeHeight / 2 - this.wallThickness, 0],
            [mazeWidth / 2, mazeHeight / 2, this.wallHeight],
            mainColor0
        ));
        objects.push(new AABB(
            [-mazeWidth / 2, mazeHeight / 2 - this.wallThickness, 0],
            [-this.pathWidth / 2, mazeHeight / 2, this.wallHeight],
            mainColor0
        ));

        // ゴールのところの壁
        objects.push(new AABB(
            [this.pathWidth / 2, -mazeHeight / 2, 0],
            [this.pathWidth / 2 + this.wallThickness, -mazeHeight / 2 - this.pathWidth, this.wallHeight],
            mainColor0
        ));
        objects.push(new AABB(
            [-this.pathWidth / 2 - this.wallThickness, -mazeHeight / 2, 0],
            [-this.pathWidth / 2, -mazeHeight / 2 - this.pathWidth, this.wallHeight],
            mainColor0
        ));

        // スタートのところの壁
        objects.push(new AABB(
            [this.pathWidth / 2, mazeHeight / 2, 0],
            [this.pathWidth / 2 + this.wallThickness, mazeHeight / 2 + this.pathWidth, this.wallHeight],
            mainColor0
        ));
        objects.push(new AABB(
            [-this.pathWidth / 2 - this.wallThickness, mazeHeight / 2, 0],
            [-this.pathWidth / 2, mazeHeight / 2 + this.pathWidth, this.wallHeight],
            mainColor0
        ));
        objects.push(new AABB(
            [-this.pathWidth / 2 - this.wallThickness, mazeHeight / 2 + this.pathWidth, 0],
            [this.pathWidth / 2 + this.wallThickness, mazeHeight / 2 + this.pathWidth + this.wallThickness, this.wallHeight],
            mainColor0
        ));

        // holizontalWallsを描画
        for (let i = 0; i < holizontalWalls.length; i++) {
            const row = holizontalWalls[i];
            let prev = false;
            let min = null;
            for (let j = 0; j < row.length; j++) {
                if (row[j]) {
                    if (!prev) {
                        min = [-mazeWidth / 2 + (this.pathWidth + this.wallThickness) * j, -mazeHeight / 2 + (this.pathWidth + this.wallThickness) * (i + 1), 0];
                    }
                } else if (prev) {
                    objects.push(new AABB(
                        min,
                        [-mazeWidth / 2 + (this.pathWidth + this.wallThickness) * j + this.wallThickness, -mazeHeight / 2 + (this.pathWidth + this.wallThickness) * (i + 1) + this.wallThickness, this.wallHeight],
                        mainColor0
                    ));
                }
                prev = row[j];
            }
            if (prev) {
                objects.push(new AABB(
                    min,
                    [mazeWidth / 2, -mazeHeight / 2 + (this.pathWidth + this.wallThickness) * (i + 1) + this.wallThickness, this.wallHeight],
                    mainColor0
                ));
            }
        }

        // verticalWallsを描画
        for (let i = 0; i < verticalWalls[0].length; i++) {
            let prev = false;
            let min = null;
            for (let j = 0; j < verticalWalls.length; j++) {
                const wall = verticalWalls[j][i];
                if (wall) {
                    if (!prev) {
                        min = [-mazeWidth / 2 + (this.pathWidth + this.wallThickness) * (i + 1), -mazeHeight / 2 + (this.pathWidth + this.wallThickness) * j, 0];
                    }
                } else if (prev) {
                    objects.push(new AABB(
                        min,
                        [-mazeWidth / 2 + (this.pathWidth + this.wallThickness) * (i + 1) + this.wallThickness, -mazeHeight / 2 + (this.pathWidth + this.wallThickness) * j + this.wallThickness, this.wallHeight],
                        mainColor0
                    ));
                }
                prev = wall;
            }
            if (prev) {
                objects.push(new AABB(
                    min,
                    [-mazeWidth / 2 + (this.pathWidth + this.wallThickness) * (i + 1) + this.wallThickness, mazeHeight / 2, this.wallHeight],
                    mainColor0
                ));
            }
        }

        // スタート地点の三角形
        let tryangle1 = new HolizontalTryangle(
            [this.pathWidth * 0.4, mazeHeight / 2 + this.pathWidth * 0.6 - this.wallThickness / 2],
            [-this.pathWidth * 0.4, mazeHeight / 2 + this.pathWidth * 0.6 - this.wallThickness / 2],
            [0, mazeHeight / 2 - this.wallThickness / 2],
            mainColor1
        );
        // ゴールの三角形
        let tryangle2 = new HolizontalTryangle(
            [this.pathWidth * 0.4, -mazeHeight / 2 - this.pathWidth * 0.2],
            [-this.pathWidth * 0.4, -mazeHeight / 2 - this.pathWidth * 0.2],
            [0, -mazeHeight / 2 - this.pathWidth * 0.8],
            mainColor2
        );

        return [
            objects,
            [tryangle1, tryangle2]
        ];


        // let maze = Array.from({ length: this.mazeSize[1] * 2 + 1 }, () => Array(this.mazeSize[0] * 2 + 1).fill('    '));

        // for (let i = 0; i < this.mazeSize[1] * 2 + 1; i++) {
        //     maze[i][0] = '####';
        //     maze[i][this.mazeSize[0] * 2] = '####';
        // }
        // for (let i = 0; i < this.mazeSize[0] * 2 + 1; i++) {
        //     maze[0][i] = '####';
        //     maze[this.mazeSize[1] * 2][i] = '####';
        // }

        // for (let i = 0; i < holizontalWalls.length; i++) {
        //     for (let j = 0; j < holizontalWalls[i].length; j++) {
        //         if(holizontalWalls[i][j]) {
        //             maze[i * 2 + 2][j * 2] = '####';
        //             maze[i * 2 + 2][j * 2 + 1] = '####';
        //             maze[i * 2 + 2][j * 2 + 2] = '####';
        //         }
        //     }
        // }

        // for (let i = 0; i < verticalWalls.length; i++) {
        //     for (let j = 0; j < verticalWalls[i].length; j++) {
        //         if(verticalWalls[i][j]) {
        //             maze[i * 2][j * 2 + 2] = '####';
        //             maze[i * 2 + 1][j * 2 + 2] = '####';
        //             maze[i * 2 + 2][j * 2 + 2] = '####';
        //         }
        //     }
        // }

        // for (const row of maze) {
        //     console.log(row.join(''));
        // }


        function generate(cx, cy, mazeSize) {
            visited[cy][cx] = true;

            const newDirs = shuffleArray(dirs);
            for (let i = 0; i < newDirs.length; i++) {
                const dir = newDirs[i];
                let nx = cx + dir[0];
                let ny = cy + dir[1];
                if (0 <= nx && nx < mazeSize[0] && 0 <= ny && ny < mazeSize[1] && !visited[ny][nx]) {
                    if (dir[0] === 0) {
                        holizontalWalls[Math.min(cy, ny)][nx] = false;
                    } else {
                        verticalWalls[ny][Math.min(cx, nx)] = false;
                    }
                    generate(nx, ny, mazeSize);
                }
            }
        }

        function shuffleArray(array) {
            const cloneArray = [...array]

            for (let i = cloneArray.length - 1; i >= 0; i--) {
                let rand = Math.floor(Math.random() * (i + 1))
                // 配列の要素の順番を入れ替える
                let tmpStorage = cloneArray[i]
                cloneArray[i] = cloneArray[rand]
                cloneArray[rand] = tmpStorage
            }

            return cloneArray
        }
    }
}

// プレイヤー
// 形は無限に長い四角柱
class Player {
    constructor(cameraPos, cameraDir, width, velocity) {
        if (Array.isArray(cameraPos)) {
            cameraPos = new Vector(cameraPos);
        }

        this.cameraPos = cameraPos;
        this.cameraDir = cameraDir;
        this.width = width;
        this.velocity = velocity;

        this.isMoving = false;
        this.movingDir = [0, 0];
        this.animationId;
        this.last;

        this.onMove = null;
    }

    // 
    start(walls) {
        this.walls = walls
        const animate = (now) => {
            if (this.isMoving) {
                if (this.last) {
                    const ds = (now - this.last) / 1000;

                    const TRot = new Tensor([
                        [Math.cos(this.cameraDir.phi), Math.sin(this.cameraDir.phi)],
                        [-Math.sin(this.cameraDir.phi), Math.cos(this.cameraDir.phi)]
                    ]);
                    const dCameraPos = TRot.dot(this.movingDir).multiplyBy(this.velocity * ds);
                    const dCameraPosX = dCameraPos.data[0];
                    const dCameraPosY = dCameraPos.data[1];
                    this.cameraPos.data[0] += dCameraPosX;
                    this.cameraPos.data[1] += dCameraPosY;

                    for (const wall of this.walls) {
                        const nearestX = Math.min(Math.max(wall.min.data[0], this.cameraPos.data[0]), wall.max.data[0]);
                        const nearestY = Math.min(Math.max(wall.min.data[1], this.cameraPos.data[1]), wall.max.data[1]);

                        const dx = this.cameraPos.data[0] - nearestX;
                        const dy = this.cameraPos.data[1] - nearestY;

                        const dist2 = dx ** 2 + dy ** 2;

                        if (dist2 == 0) {
                            this.cameraPos.data[0] -= dCameraPosX;
                            this.cameraPos.data[1] -= dCameraPosY;
                            return;
                        }
                        if (dist2 < this.width ** 2) {
                            const dist = Math.sqrt(dist2);
                            const overlap = this.width - dist;

                            this.cameraPos.data[0] += dx * overlap / dist;
                            this.cameraPos.data[1] += dy * overlap / dist;
                        }
                    }
                }

                // イベントを設定していた場合
                if (this.onMove !== null) {
                    this.onMove(this);
                }
            }
            this.last = now;
            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    stop() {
        cancelAnimationFrame(this.animationId);
        this.isMoving = false;
        this.last = null;
    }
}