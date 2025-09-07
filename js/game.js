class Game {
    constructor(mazeSize, fps, pathWidth = 1, wallHeight = 1, wallThickness = 0.3) {
        this.display = new Display();
        this.field = [];
        this.mazeSize = mazeSize;
        this.ds = 1 / fps;
        this.pathWidth = pathWidth;
        this.wallHeight = wallHeight;
        this.wallThickness = wallThickness;
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

        // holizontalWallsを描画
        for (let i = 0; i < holizontalWalls.length; i++) {
            const row = holizontalWalls[i];
            for (let j = 0; j < row.length; j++) {
                if(row[j]) {
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
                if(row[j]) {
                    objects.push(new AABB(
                        [-mazeWidth / 2 + (this.pathWidth + this.wallThickness) * (j + 1), -mazeHeight / 2 + (this.pathWidth + this.wallThickness) * i, 0],
                        [-mazeWidth / 2 + (this.pathWidth + this.wallThickness) * (j + 1) + this.wallThickness, -mazeHeight / 2 + (this.pathWidth + this.wallThickness) * (i + 1) + this.wallThickness, this.wallHeight],
                        mainColor0
                    ));
                }
            }
        }

        return objects;


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
class Player {
    constructor() {

    }
}