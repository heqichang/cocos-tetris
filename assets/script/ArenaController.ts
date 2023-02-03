import { _decorator, Component, Node, Prefab, input, Input, EventKeyboard, KeyCode, random, instantiate, UITransform, Vec3, Label } from 'cc';
const { ccclass, property } = _decorator;


enum GameState {
    GS_PAUSE,
    GS_RUNNING,
    GS_STOP,
}

enum BlockMoveDirection {
    NONE,
    LEFT,
    RIGHT,
    DOWN,
}


@ccclass('ArenaController')
export class ArenaController extends Component {

    @property({type: Prefab})
    public blockPrefab: Prefab | null = null;

    @property({type: Node})
    public overNode: Node | null = null;

    @property({type: Label})
    public scoreLabel: Label | null = null;
    
    // 游戏实际地图
    private _map: number[][] = [];
    private _mapBlock: Node[][] = [];

    // 方块类型数量
    private _blockTypeNum = 5;

    // 一个格子代表 50 x 50
    private _blocks: number[][][] = [
        // 田
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],

        // I 
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],

        // L
        [
            [0, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0],
        ],
        [
            [0, 0, 1, 0],
            [1, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [0, 1, 1, 1],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
        ],

        // 两个 s
        [
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 1, 1],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 1, 1],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],

        [
            [0, 0, 1, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 1, 0],
            [0, 1, 1, 0],
            [0, 1, 0, 0],
            [0, 0, 0, 0],
        ],
        [
            [0, 0, 0, 0],
            [1, 1, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 0],
        ],


    ]

    // 当前的方块数据
    private _curBlock: number[][] = [];
    private _curBlockIndex = 0; // 当前方块索引
    private _curBlockShape = 0; // 当前方块的形状
    private _curBlockX = 0; // 当前方块在 map 上的 x 坐标
    private _curBlockY = 0; // 当前方块在 map 上的 y 坐标

    private _score = 0; // 分数
    
    private _gameState: GameState = GameState.GS_STOP;

    private _curKeyCode: KeyCode = KeyCode.NONE;

    private _w = 8;
    private _h = 12;
    private _s = 50;

    
    private _threshold = 0.5;
    private _accTime = 0;

    private _curNode: Node;
    private _nextNode: Node;

    private _curPos: Vec3 = new Vec3();

    private _deltaPos: Vec3 = new Vec3(0, -50, 0);

    private _startIndex = 2;

    
    start() {
        
        // 初始化地图和方块
        for (let row = 0; row < this._h; row++) {
            this._map[row] = [];
            this._mapBlock[row] = [];
            
            for (let col = 0; col < this._w; col++) {
                this._map[row][col] = 0;
                let node = this.initBlockPrefab(col, row);
                this._mapBlock[row][col] = node;
            }
        }

        // 设置监听键盘
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);

        this.init();
    }

    set score(num: number) {
        this._score = num;
        this.scoreLabel.string = num.toString();
    }

    initBlockPrefab(col: number, row: number) {
        let node: Node = instantiate(this.blockPrefab);
        
        let v: Vec3 = new Vec3(col * 50, row * 50, 0);
        node.setPosition(v);
        node.active = false;
        this.node.addChild(node);
        return node;
    }

    init() {
        
        // 地图清空
        for (let row = 0; row < this._h; row++) {
            for (let col = 0; col < this._w; col++) {
                this._map[row][col] = 0;
            }
        }

        // 分数重新开始计算
        this.score = 0;

        // 生成新的方块开始
        this.spawnRandomBlock();

        this.setGameState(GameState.GS_RUNNING);
    }

    onKeyDown(event: EventKeyboard) {
        
        switch (event.keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.KEY_S:
            case KeyCode.KEY_D:
            case KeyCode.KEY_W:
                this._curKeyCode = event.keyCode;
                break;
            case KeyCode.SPACE:
                if (this._gameState === GameState.GS_STOP) {
                    this.init();
                } else if (this._gameState === GameState.GS_PAUSE) {
                    this.setGameState(GameState.GS_RUNNING);
                } else {
                    this.setGameState(GameState.GS_PAUSE);
                }

        }

    }

    onKeyUp(event: EventKeyboard) {

        switch (event.keyCode) {
            case KeyCode.KEY_S:
                this._curKeyCode = KeyCode.NONE;
                break;
        }

    }

    // 从顶部位置产生一个随机的方块
    spawnRandomBlock() {

        let random = Math.floor(Math.random() * this._blockTypeNum);
        this._curBlock = this._blocks[random * 4];
        this._curBlockIndex = random;
        this._curBlockShape = 0;
        this._curBlockX = this._startIndex;
        this._curBlockY = -1;
        this._curKeyCode = KeyCode.NONE;
    }

    update(deltaTime: number) {

        if (this._gameState === GameState.GS_RUNNING) {

            // 下落
            this._accTime += deltaTime;
            if (this._curKeyCode === KeyCode.KEY_S || this._accTime > this._threshold) {
            
                let canFall = this.fallBlock();
                this.drawMap();
                // 不能下降的时候，block 已经融入到 map 了
                if (canFall) {
                    this.drawBlock();
                }
                this._accTime = 0;
            }

            // 左右或者变换
            if (this._curKeyCode !== KeyCode.NONE && this._curKeyCode !== KeyCode.KEY_S) {
                this.moveBlock();
                this.drawMap();
                this.drawBlock();
            } 
        }

    }

    drawMap() {
        // 画地图
        for (let row = 0; row < this._h; row++) {
            for (let col = 0; col < this._w; col++) {
                if (this._map[row][col] === 1) {
                    this._mapBlock[row][col].active = true;
                } else {
                    this._mapBlock[row][col].active = false;
                }
            }
        }
    }

    drawBlock() {

        // 画方块，anchor 已翻转在左上
        for (let y = this._curBlockY, blockRow = this._curBlock.length - 1; y >= 0 && blockRow >= 0; y--, blockRow--) {
            for (let x = this._curBlockX, blockCol = 0; x < this._w && blockCol < 4; x++, blockCol++) {
                if (y >= this._h || x < 0 || x >= this._w) {
                    // 超地图方块范围
                    continue;
                }

                if (this._curBlock[blockRow][blockCol] === 1) {
                    this._mapBlock[y][x].active = true;
                }
            }

        }
    }

    moveBlock() {

        let canMove = false;
        let moveToX = this._curBlockX;
        let moveToY = this._curBlockY;

        switch (this._curKeyCode) {
            case KeyCode.KEY_A:
                // 左移动
                moveToX = this._curBlockX - 1;
                canMove = this.canMove(moveToX, moveToY, this._curBlock);
                if (canMove) {
                    this._curBlockX = moveToX;
                    this._curBlockY = moveToY;
                }
                break;

            case KeyCode.KEY_D:
                // 右移动
                moveToX = this._curBlockX + 1;
                canMove = this.canMove(moveToX, moveToY, this._curBlock);
                if (canMove) {
                    this._curBlockX = moveToX;
                    this._curBlockY = moveToY;
                }
                break;

            case KeyCode.KEY_W:
                // 转动
                let nextShape = (this._curBlockShape + 1) % 4;
                let nextBlock = this._blocks[this._curBlockIndex * 4 + nextShape];
                canMove = this.canMove(moveToX, moveToY, nextBlock);
                
                if (canMove) {
                    this._curBlock = nextBlock;
                    this._curBlockShape = nextShape;
                }
                break;
        }

        
        // 单次点击，恢复按键
        this._curKeyCode = KeyCode.NONE;
    }

    // 方块降落判断
    fallBlock(): boolean {
        
        let nextY = this._curBlockY + 1;

        // 检测是否还能下降
        let canFall = this.canMove(this._curBlockX, nextY, this._curBlock);

        // 可下降
        if (canFall) {
            
            // 下降一格
            this._curBlockY = nextY;

        } else {
            // 不能下降了，固定到地图上，并获取到减少的行数
            let deleteRow = this.fillMap();

            // y 超过屏幕，则 game over
            if (this._curBlockY - deleteRow - 4 < 0) {
                this.setGameState(GameState.GS_STOP);
            } else {
                // 产生一个新的方块开始下落
                this.spawnRandomBlock();
            }

            this.score = this._score + deleteRow;
        }

        return canFall;
        
    }

    setGameState(gameState: GameState) {
        switch (gameState) {
            case GameState.GS_STOP:
                this.overNode.active = true;
                break;
            case GameState.GS_RUNNING:
                this.overNode.active = false;
                break;
        }

        this._gameState = gameState;
    }


    canMove(nextX: number, nextY: number, block: number[][]): boolean {

        // 底部触碰到其它方块
        for (let y = nextY, blockRow = block.length - 1; y >= 0 && blockRow >= 0; y--, blockRow--) {
            for (let x = nextX, blockCol = 0; blockCol < 4; x++, blockCol++) {
                // 方块为 0 的数据块不会影响到移动
                if (block[blockRow][blockCol] === 0) {
                    continue;
                }

                if (y >= this._h) {
                    // 触底
                    return false;
                }

                if (x < 0 || x >= this._w) {
                    // 触边
                    return false;
                }

                // 碰到其它模块
                if (this._map[y][x] === 1) {
                    return false;
                }
                
            }
        }

        return true;
    }

    fillMap(): number {
        // 固定到地图上
        for (let y = this._curBlockY, blockRow = this._curBlock.length - 1; y >= 0 && blockRow >= 0; y--, blockRow--) {
            for (let x = this._curBlockX, blockCol = 0; x < this._w && blockCol < 4; x++, blockCol++) {
                if (this._curBlock[blockRow][blockCol] === 1) {
                    // 这里不用担心越界，因为越界的是不能 move 执行到这个方法的
                    this._map[y][x] = 1;
                }
            }
        }

        // 地图上满一行的可以减去了
        let deleteRow: number[] = []; // 先做标记
        for (let y = this._h - 1; y >= 0; y--) {
            let needDelete = true;
            for (let x = 0; x < this._w; x++) {
                if (this._map[y][x] === 0) {
                    needDelete = false;
                    break;
                }
            }

            if (needDelete) {
                deleteRow.push(y);
            }
        }

        // 没有需要删除的行
        if (deleteRow.length === 0) {
            return 0;
        }

        // 从列开始删
        for (let x = 0; x < this._w; x++) {

            // 需要保留的数
            let reserveNums: number[] = [];
            for (let y = this._h - 1, deleteRowIndex = 0; y >= 0; y--) {
                if (deleteRowIndex < deleteRow.length && y === deleteRow[deleteRowIndex]) {
                    deleteRowIndex++;
                    continue;
                }
                reserveNums.push(this._map[y][x]);
            }

            // 推入保留数
            for (let y = this._h - 1, reserveNumIndex = 0; y >= 0; y--) {
                if (reserveNumIndex < reserveNums.length) {
                    this._map[y][x] = reserveNums[reserveNumIndex++];
                    continue;
                }
                this._map[y][x] = 0;
            }
        }

        return deleteRow.length;

    }
}


