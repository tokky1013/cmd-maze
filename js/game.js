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
        this.velocity = velocity;

        this.isStarted = false;
        this.moving = false;
        this.movingDir = [0, 0];

        this.player = new Player(
            [0, 0, 1 + ((this.pathWidth + this.wallThickness) * (this.mazeSize[1] + 2) / 2) / Math.tan(this.display.verticalViewingAngle / 2)],
            {
                theta: Math.PI,
                phi: Math.PI / 2
            },
            0.3
        );
    }

    start() {
        setInterval(function () {
            game.display.showView(game.field, game.player.cameraPos, game.player.cameraDir);
            if (game.isStarted) {
                if(game.moving) {
                    const TRot = new Tensor([
                        [Math.cos(game.player.cameraDir.phi), Math.sin(game.player.cameraDir.phi)],
                        [-Math.sin(game.player.cameraDir.phi), Math.cos(game.player.cameraDir.phi)]
                    ]);
                    const dCameraPos = TRot.dot(game.movingDir).multiplyBy(game.velocity * game.ds);
                    dCameraPos.data.push(0);
                    game.player.cameraPos = game.player.cameraPos.plus(dCameraPos);
                }
            }
        }, this.ds * 1000);
        this.field = this.generateMaze();

        this.viewpointTransitionTime = 2;
        this.dCameraPos = this.player.cameraPos.minus([0, ((this.pathWidth + this.wallThickness) * this.mazeSize[1] + this.pathWidth) / 2, this.cameraHeight]).multiplyBy(-1 / this.viewpointTransitionTime);
        this.dTheta = (Math.PI / 2 - this.player.cameraDir.theta) / this.viewpointTransitionTime;
        this.dPhi = (Math.PI / 2 - this.player.cameraDir.phi) / this.viewpointTransitionTime;

        setTimeout(function () {
            game.timeAnimationStart = new Date().getTime();
            game.initialCameraPos = game.player.cameraPos;
            game.initialCameraDirTheta = game.player.cameraDir.theta;
            game.initialCameraDirPhi = game.player.cameraDir.phi;

            game.timer = setInterval(function () {
                const timeDelta = (new Date().getTime() - game.timeAnimationStart) / 1000;
                game.player.cameraPos = game.initialCameraPos.plus(game.dCameraPos.multiplyBy(timeDelta));
                game.player.cameraDir.theta = game.initialCameraDirTheta + game.dTheta * timeDelta;
                game.player.cameraDir.phi = game.initialCameraDirPhi + game.dPhi * timeDelta;
            }, game.ds * 1000);

            setTimeout(function () {
                clearInterval(game.timer);
                game.player.cameraPos = new Vector([0, ((game.pathWidth + game.wallThickness) * game.mazeSize[1] + game.pathWidth) / 2, game.cameraHeight]);
                game.player.cameraDir.theta = Math.PI / 2;
                game.player.cameraDir.phi = Math.PI / 2;

                // 各種操作のイベントを設定
                // ----視点移動----
                game.isDragging = false;

                // 押した瞬間
                $("#cmd-window").on("mousedown", function (e) {
                    game.isDragging = true;
                    game.initialCursorPositionX = e.clientX;
                    game.initialCursorPositionY = e.clientY;
                    game.initialCameraDirTheta = game.player.cameraDir.theta;
                    game.initialCameraDirPhi = game.player.cameraDir.phi;
                });

                $("#cmd-window").on("touchstart", function (e) {
                    game.isDragging = true;
                    const touch = e.originalEvent.touches[0];
                    game.initialCursorPositionX = touch.clientX;
                    game.initialCursorPositionY = touch.clientY;
                    game.initialCameraDirTheta = game.player.cameraDir.theta;
                    game.initialCameraDirPhi = game.player.cameraDir.phi;
                });

                // 移動中
                $(document).on("mousemove", function (e) {
                    if (!game.isDragging) return;
                    const boxWidth = $('#cmd-window')[0].getBoundingClientRect().width;

                    const radPerPx = game.sensitivity * Math.PI / boxWidth

                    game.player.cameraDir.phi = game.initialCameraDirPhi + radPerPx * (e.clientX - game.initialCursorPositionX);
                    game.player.cameraDir.theta = game.initialCameraDirTheta - radPerPx * (e.clientY - game.initialCursorPositionY);
                });
                $(document).on("touchmove", function (e) {
                    if (!game.isDragging) return;
                    const boxWidth = $('#cmd-window')[0].getBoundingClientRect().width;

                    const radPerPx = game.sensitivity * Math.PI / boxWidth

                    const touch = e.originalEvent.touches[0];
                    game.player.cameraDir.phi = game.initialCameraDirPhi + radPerPx * (touch.clientX - game.initialCursorPositionX);
                    game.player.cameraDir.theta = game.initialCameraDirTheta - radPerPx * (touch.clientY - game.initialCursorPositionY);
                });

                // 離した瞬間
                $(document).on("mouseup touchend", function (e) {
                    game.isDragging = false;
                });

                // ----移動----
                $(document).on("keydown", function (e) {
                    if (e.code === "KeyW") {
                        game.moving = true;
                        game.movingDir = [1, 0];
                    } else if (e.code === "KeyA") {
                        game.moving = true;
                        game.movingDir = [0, -1];
                    } else if (e.code === "KeyS") {
                        game.moving = true;
                        game.movingDir = [-1, 0];
                    } else if (e.code === "KeyD") {
                        game.moving = true;
                        game.movingDir = [0, 1];
                    }
                });

                $(document).on("keyup", function (e) {
                    if (e.code === "KeyW" || e.code === "KeyA"|| e.code === "KeyS"|| e.code === "KeyD") {
                        game.moving = false;
                    }
                });

                game.isStarted = true;
            }, game.viewpointTransitionTime * 1000);
        }, 1000);
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

            dirs = shuffleArray(dirs);
            for (let i = 0; i < dirs.length; i++) {
                const dir = dirs[i];
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
// 形は無限に長い円筒形
class Player {
    constructor(cameraPos, cameraDir, width) {
        if (Array.isArray(cameraPos)) {
            cameraPos = new Vector(cameraPos);
        }

        this.cameraPos = cameraPos;
        this.cameraDir = cameraDir;
        this.width = width;
    }
}