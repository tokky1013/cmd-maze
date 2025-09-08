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
            0.3,
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

        const prepare =  () => {
            // 毎フレームの処理を開始
            this.player.start();
            this.display.start(this.field, this.player);

            // 最初の上から降りてくるアニメーションを実行
            const initialCameraPos = this.player.cameraPos;
            const initialCameraDirTheta = this.player.cameraDir.theta;
            const initialCameraDirPhi = this.player.cameraDir.phi;

            let animationId;
            let initialTime;
            const animate = (now) => {
                if(initialTime) {
                    const timeDelta = (now - initialTime) / 1000;
                    this.player.cameraPos = initialCameraPos.plus(dCameraPos.multiplyBy(timeDelta));
                    this.player.cameraDir.theta = initialCameraDirTheta + dTheta * timeDelta;
                    this.player.cameraDir.phi = initialCameraDirPhi + dPhi * timeDelta;
                } else {
                    initialTime = now;
                }
                if((now - initialTime) >= viewpointTransitionTime * 1000) {
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
        
        let initialCursorPositionX;
        let initialCursorPositionY;
        let initialCameraDirTheta;
        let initialCameraDirPhi;

        // 押した瞬間
        const onMousedown = (e) => {
            isDragging = true;
            initialCursorPositionX = e.clientX;
            initialCursorPositionY = e.clientY;
            initialCameraDirTheta = this.player.cameraDir.theta;
            initialCameraDirPhi = this.player.cameraDir.phi;
        };
        $("#cmd-window").on("mousedown", onMousedown);

        const onTouchstart = (e) => {
            isDragging = true;
            const touch = e.originalEvent.touches[0];
            initialCursorPositionX = touch.clientX;
            initialCursorPositionY = touch.clientY;
            initialCameraDirTheta = this.player.cameraDir.theta;
            initialCameraDirPhi = this.player.cameraDir.phi;
        };
        $("#cmd-window").on("touchstart", onTouchstart);

        // 移動中
        const onMousemove = (e) => {
            if (!isDragging) return;
            const boxWidth = $('#cmd-window')[0].getBoundingClientRect().width;

            const radPerPx = this.sensitivity * Math.PI / boxWidth

            this.player.cameraDir.phi = initialCameraDirPhi + radPerPx * (e.clientX - initialCursorPositionX);
            this.player.cameraDir.theta = initialCameraDirTheta - radPerPx * (e.clientY - initialCursorPositionY);
        };
        $(document).on("mousemove", onMousemove);

        const onTouchmove = (e) => {
            if (!isDragging) return;
            const boxWidth = $('#cmd-window')[0].getBoundingClientRect().width;

            const radPerPx = this.sensitivity * Math.PI / boxWidth

            const touch = e.originalEvent.touches[0];
            this.player.cameraDir.phi = initialCameraDirPhi + radPerPx * (touch.clientX - initialCursorPositionX);
            this.player.cameraDir.theta = initialCameraDirTheta - radPerPx * (touch.clientY - initialCursorPositionY);
        };
        $(document).on("touchmove", onTouchmove);

        // 離した瞬間
        const onMouseup = (e) => isDragging = false;
        $(document).on("mouseup touchend", onMouseup);

        // ----移動----
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

            if(!(wIsPressed || aIsPressed || sIsPressed || dIsPressed)) {
                this.player.isMoving = false;
            } else {
                // 動く方向を計算
                let movingDirX = (wIsPressed ? 1 : 0) + (sIsPressed ? -1 : 0);
                let movingDirY = (dIsPressed ? 1 : 0) + (aIsPressed ? -1 : 0);
                this.player.movingDir = [movingDirX, movingDirY];
            }
        };
        $(document).on("keyup", onKeyup);
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
    start() {
        const animate = (now) => {
            if (this.isMoving) {
                if (this.last) {
                    const ds = (now - this.last) / 1000;

                    const TRot = new Tensor([
                        [Math.cos(this.cameraDir.phi), Math.sin(this.cameraDir.phi)],
                        [-Math.sin(this.cameraDir.phi), Math.cos(this.cameraDir.phi)]
                    ]);
                    const dCameraPos = TRot.dot(this.movingDir).multiplyBy(this.velocity * ds);
                    dCameraPos.data.push(0);
                    this.cameraPos = this.cameraPos.plus(dCameraPos);
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