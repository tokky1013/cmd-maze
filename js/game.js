let game;

class Game {
    constructor(mazeSize, fps, sensitivity, velocity, pathWidth = 1, wallHeight = 1, wallThickness = 0.3, cameraHeight = 0.7) {
        this.display = new Display();
        this.field = [];
        this.mazeSize = mazeSize;
        this.ds = 1 / fps;
        this.pathWidth = pathWidth;
        this.wallHeight = wallHeight;
        this.wallThickness = wallThickness;
        this.cameraHeight = cameraHeight;

        this.sensitivity = sensitivity;

        this.player = new Player(
            [0, 0, 1 + ((this.pathWidth + this.wallThickness) * (this.mazeSize[1] + 2) / 2) / Math.tan(this.display.verticalViewingAngle / 2)],
            {
                theta: Math.PI,
                phi: Math.PI / 2
            },
            0.25,
            velocity
        );
    }

    start() {
        this.field = this.generateMaze();
        this.display.showView(this.field, this.player.cameraPos, this.player.cameraDir);

        const viewpointTransitionTime = 2;
        const dCameraPos = this.player.cameraPos.minus([0, ((this.pathWidth + this.wallThickness) * this.mazeSize[1] + this.pathWidth) / 2, this.cameraHeight]).multiplyBy(-1 / viewpointTransitionTime);
        const dTheta = (Math.PI / 2 - this.player.cameraDir.theta) / viewpointTransitionTime;
        const dPhi = (Math.PI / 2 - this.player.cameraDir.phi) / viewpointTransitionTime;

        const prepare = () => {
            // 毎フレームの処理を開始
            this.player.start(this.field[0]);
            this.display.start(this.field, this.player);

            // 最初の上から降りてくるアニメーションを実行
            const initialCameraPos = this.player.cameraPos;
            const initialCameraDirTheta = this.player.cameraDir.theta;
            const initialCameraDirPhi = this.player.cameraDir.phi;

            let animationId;
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
                } else {
                    animationId = requestAnimationFrame(animate);
                }
            };
            animationId = requestAnimationFrame(animate);
        }
        setTimeout(prepare, 1000);
    }

    stop() {
        this.clearEvents();
        this.display.stop();
        this.player.stop();
    }

    setEvents() {
        // ディスプレイのリサイズ
        const resize = () => this.display.resize();
        $(window).on("resize", resize);
        $(window).on("orientationchange", function () {
            setTimeout(resize, 300);
        });


        // 各種操作のイベントを設定
        // ----視点移動----
        let isDragging = false;

        let initialCursorPosX;
        let initialCursorPosY;
        let initialCameraDirTheta;
        let initialCameraDirPhi;

        // 押した瞬間
        const onMousedown = (e) => {
            isDragging = true;
            initialCursorPosX = e.clientX;
            initialCursorPosY = e.clientY;
            initialCameraDirTheta = this.player.cameraDir.theta;
            initialCameraDirPhi = this.player.cameraDir.phi;
        };
        $("#cmd-window").on("mousedown", onMousedown);

        const onTouchstart = (e) => {
            isDragging = true;
            const touch = e.originalEvent.touches[0];
            initialCursorPosX = touch.clientX;
            initialCursorPosY = touch.clientY;
            initialCameraDirTheta = this.player.cameraDir.theta;
            initialCameraDirPhi = this.player.cameraDir.phi;
        };
        $("#cmd-window").on("touchstart", onTouchstart);

        // 移動中
        const onMousemove = (e) => {
            if (!isDragging) return;
            const boxWidth = $('#cmd-window')[0].getBoundingClientRect().width;

            const radPerPx = this.sensitivity * Math.PI / boxWidth

            this.player.cameraDir.phi = initialCameraDirPhi + radPerPx * (e.clientX - initialCursorPosX);
            this.player.cameraDir.theta = initialCameraDirTheta - radPerPx * (e.clientY - initialCursorPosY);
        };
        $(document).on("mousemove", onMousemove);

        const onTouchmove = (e) => {
            if (isDragging) {
                const boxWidth = $('#cmd-window')[0].getBoundingClientRect().width;

                const radPerPx = this.sensitivity * Math.PI / boxWidth

                const touch = e.originalEvent.touches[0];
                this.player.cameraDir.phi = initialCameraDirPhi + radPerPx * (touch.clientX - initialCursorPosX);
                this.player.cameraDir.theta = initialCameraDirTheta - radPerPx * (touch.clientY - initialCursorPosY);
            }
            e.stopPropagation();
        };
        $("#cmd-window").on("touchmove", onTouchmove);

        // 離した瞬間
        const onMouseup = (e) => {
            isDragging = false;
        };
        $(document).on("mouseup", onMouseup);

        // ----移動----
        // pc
        let wIsPressed = false;
        let aIsPressed = false;
        let sIsPressed = false;
        let dIsPressed = false;
        const onKeydown = (e) => {
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
            this.player.movingDir = [movingDirX, movingDirY];
        };
        $(document).on("keydown", onKeydown);

        const onKeyup = (e) => {
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
        };
        $(document).on("keyup", onKeyup);

        // スマホ
        let isMoving = false;
        let initialJoystickPosX;
        let initialJoystickPosY;
        const onMovestart = (e) => {
            e.stopPropagation();
            isMoving = true;
            this.player.isMoving = true;
            const touch = e.originalEvent.touches[0];
            initialJoystickPosX = touch.clientX;
            initialJoystickPosY = touch.clientY;
        };
        $("#joystick").on("touchstart", onMovestart);

        const onJoystickmove = (e) => {
            e.stopPropagation();
            if (isMoving) {
                const touch = e.originalEvent.touches[0];
                const $joystick = $('#joystick');
                
                const maxRange = 100;

                let joystickPos = new Vector([touch.clientX - initialJoystickPosX, touch.clientY - initialJoystickPosY]);
                joystickPos = joystickPos.divideBy(Math.max(joystickPos.length() / maxRange, 1));

                $joystick.css({ transform: `translate(${joystickPos.data[0]}px,${joystickPos.data[1]}px)` });

                joystickPos = joystickPos.divideBy(maxRange).data;
                this.player.movingDir = [-joystickPos[1], joystickPos[0]];
            }
        };
        $('#joystick').on("touchmove", onJoystickmove);
        
        const onTouchend = (e) => {
            e.stopPropagation();
            isDragging = false;
            isMoving = false
            this.player.isMoving = false;
            const $joystick = $('#joystick');

            $joystick.css({ transform: 'translate(0px, 0px)' });
        };
        $('#joystick').on("touchend", onTouchend);
    }

    clearEvents() {
        $(window).off();
        $("#cmd-window").off();
        $(document).off();
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
            for (let j = 0; j < row.length; j++) {
                if (row[j]) {
                    objects.push(new AABB(
                        [-mazeWidth / 2 + (this.pathWidth + this.wallThickness) * j, -mazeHeight / 2 + (this.pathWidth + this.wallThickness) * (i + 1), 0],
                        [-mazeWidth / 2 + (this.pathWidth + this.wallThickness) * (j + 1) + this.wallThickness, -mazeHeight / 2 + (this.pathWidth + this.wallThickness) * (i + 1) + this.wallThickness, this.wallHeight],
                        mainColor0
                    ));
                }
            }
        }

        // verticalWallsを描画
        for (let i = 0; i < verticalWalls.length; i++) {
            const row = verticalWalls[i];
            for (let j = 0; j < row.length; j++) {
                if (row[j]) {
                    objects.push(new AABB(
                        [-mazeWidth / 2 + (this.pathWidth + this.wallThickness) * (j + 1), -mazeHeight / 2 + (this.pathWidth + this.wallThickness) * i, 0],
                        [-mazeWidth / 2 + (this.pathWidth + this.wallThickness) * (j + 1) + this.wallThickness, -mazeHeight / 2 + (this.pathWidth + this.wallThickness) * (i + 1) + this.wallThickness, this.wallHeight],
                        mainColor0
                    ));
                }
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
    }

    // 
    start(objects) {
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

                    const cameraPosXBeforeCollision = this.cameraPos.data[0];
                    const cameraPosYBeforeCollision = this.cameraPos.data[1];

                    let playerMinX = this.cameraPos.data[0] - this.width / 2;
                    let playerMinY = this.cameraPos.data[1] - this.width / 2;
                    let playerMaxX = this.cameraPos.data[0] + this.width / 2;
                    let playerMaxY = this.cameraPos.data[1] + this.width / 2;

                    let isCrashedInXAxisDirection = false;
                    let isCrashedInYAxisDirection = false;

                    let firstCollidedObject = null;
                    let firstCollidedDir = null;

                    for (const object of objects) {
                        // x軸方向の衝突判定
                        if (dCameraPosX > 0) {
                            if (playerMinX < object.min.data[0] && object.min.data[0] < playerMaxX) {
                                if (playerMinY < object.max.data[1] && object.min.data[1] < playerMaxY) {
                                    this.cameraPos.data[0] = object.min.data[0] - this.width / 2;
                                    isCrashedInXAxisDirection = true;
                                    playerMinX = this.cameraPos.data[0] - this.width / 2;
                                    playerMaxX = this.cameraPos.data[0] + this.width / 2;
                                    if (firstCollidedObject === null) {
                                        firstCollidedObject = object;
                                        firstCollidedDir = 'x';
                                    }
                                }
                            }
                        } else if (dCameraPosX < 0) {
                            if (playerMinX < object.max.data[0] && object.max.data[0] < playerMaxX) {
                                if (playerMinY < object.max.data[1] && object.min.data[1] < playerMaxY) {
                                    this.cameraPos.data[0] = object.max.data[0] + this.width / 2;
                                    isCrashedInXAxisDirection = true;
                                    playerMinX = this.cameraPos.data[0] - this.width / 2;
                                    playerMaxX = this.cameraPos.data[0] + this.width / 2;
                                    if (firstCollidedObject === null) {
                                        firstCollidedObject = object;
                                        firstCollidedDir = 'x';
                                    }
                                }
                            }
                        }

                        // y軸方向の衝突判定
                        if (dCameraPosY > 0) {
                            if (playerMinY < object.min.data[1] && object.min.data[1] < playerMaxY) {
                                if (playerMinX < object.max.data[0] && object.min.data[0] < playerMaxX) {
                                    this.cameraPos.data[1] = object.min.data[1] - this.width / 2;
                                    isCrashedInYAxisDirection = true;
                                    playerMinY = this.cameraPos.data[1] - this.width / 2;
                                    playerMaxY = this.cameraPos.data[1] + this.width / 2;
                                    if (firstCollidedObject === null) {
                                        firstCollidedObject = object;
                                        firstCollidedDir = 'y';
                                    }
                                }
                            }
                        } else if (dCameraPosY < 0) {
                            if (playerMinY < object.max.data[1] && object.max.data[1] < playerMaxY) {
                                if (playerMinX < object.max.data[0] && object.min.data[0] < playerMaxX) {
                                    this.cameraPos.data[1] = object.max.data[1] + this.width / 2;
                                    isCrashedInYAxisDirection = true;
                                    playerMinY = this.cameraPos.data[1] - this.width / 2;
                                    playerMaxY = this.cameraPos.data[1] + this.width / 2;
                                    if (firstCollidedObject === null) {
                                        firstCollidedObject = object;
                                        firstCollidedDir = 'y';
                                    }
                                }
                            }
                        }
                    }

                    if (isCrashedInXAxisDirection && isCrashedInYAxisDirection) {
                        // 両方衝突した場合本当に衝突したか確かめる
                        if (firstCollidedDir === 'x') {
                            // x軸方向
                            playerMinX = cameraPosXBeforeCollision - this.width / 2;
                            playerMaxX = cameraPosXBeforeCollision + this.width / 2;

                            if (dCameraPosX > 0) {
                                if (playerMinX >= firstCollidedObject.min.data[0] || firstCollidedObject.min.data[0] >= playerMaxX ||
                                    playerMinY >= firstCollidedObject.max.data[1] || firstCollidedObject.min.data[1] >= playerMaxY) {
                                    this.cameraPos.data[0] = cameraPosXBeforeCollision;
                                }
                            } else if (dCameraPosX < 0) {
                                if (playerMinX >= firstCollidedObject.max.data[0] || firstCollidedObject.max.data[0] >= playerMaxX ||
                                    playerMinY >= firstCollidedObject.max.data[1] || firstCollidedObject.min.data[1] >= playerMaxY) {
                                    this.cameraPos.data[0] = cameraPosXBeforeCollision;
                                }
                            }
                        } else {
                            // y軸方向
                            playerMinY = cameraPosYBeforeCollision - this.width / 2;
                            playerMaxY = cameraPosYBeforeCollision + this.width / 2;

                            if (dCameraPosY > 0) {
                                if (playerMinY >= firstCollidedObject.min.data[1] || firstCollidedObject.min.data[1] >= playerMaxY ||
                                    playerMinX >= firstCollidedObject.max.data[0] || firstCollidedObject.min.data[0] >= playerMaxX) {
                                    this.cameraPos.data[1] = cameraPosYBeforeCollision;
                                }
                            } else if (dCameraPosY < 0) {
                                if (playerMinY >= firstCollidedObject.max.data[1] || firstCollidedObject.max.data[1] >= playerMaxY ||
                                    playerMinX >= firstCollidedObject.max.data[0] || firstCollidedObject.min.data[0] >= playerMaxX) {
                                    this.cameraPos.data[1] = cameraPosYBeforeCollision;
                                }
                            }
                        }
                    }
                }
            }
            this.last = now;
            this.animationId = requestAnimationFrame(animate);
        };

        this.animationId = requestAnimationFrame(animate);
    }

    stop() {
        cancelAnimationFrame(this.animationId);
    }
}