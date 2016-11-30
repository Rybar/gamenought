var MinedOut = {
    level: 0,
    score: 0
};

MinedOut.Preloader = function () {};

MinedOut.Preloader.prototype = {

    init: function () {

        this.input.maxPointers = 1;

        this.scale.pageAlignHorizontally = true;

    },

    preload: function () {

        this.load.path = 'assets/';

        this.load.images([ 'logo', 'player', 'tiles', 'mine', 'bubble' ]);

        this.load.tilemap('levels', 'levels.json', null, Phaser.Tilemap.TILED_JSON);

        this.load.bitmapFont('fat-and-tiny');
        this.load.bitmapFont('interfont');

    },

    create: function () {

        this.state.start('MinedOut.MainMenu');

    }

};

MinedOut.MainMenu = function () {};

MinedOut.MainMenu.prototype = {

    create: function () {

        this.stage.backgroundColor = 0x000000;

        var logo = this.add.image(this.world.centerX, 200, 'logo');
        logo.anchor.x = 0.5;

        var start = this.add.bitmapText(this.world.centerX, 460, 'fat-and-tiny', 'CLICK TO PLAY', 64);
        start.anchor.x = 0.5;
        start.smoothed = false;
        start.tint = 0xff0000;

        this.input.onDown.addOnce(this.start, this);

    },

    start: function () {

        MinedOut.level = 0;
        MinedOut.score = 0;

        this.state.start('MinedOut.Game');

    }

};

MinedOut.Game = function () {

    this.minesNear = 0;

    this.player = null;
    this.mines = null;
    this.cursors = null;
    this.bubble = null;
    this.bubbleText = null;

    this.tx = 0;
    this.ty = 0;

    this.won = false;
    this.history = [];

    this.map = null;
    this.layer = null;

    this.pauseKey = null;
    this.debugKey = null;
    this.showDebug = false;

};

MinedOut.Game.prototype = {

    init: function () {

        this.minesNear = 0;
        this.history = [];
        this.won = false;
        this.lastKey = 0;

        this.showDebug = false;

    },

    create: function () {

        this.stage.backgroundColor = 0x000000;

        this.map = this.add.tilemap('levels');

        this.map.addTilesetImage('tiles');

        this.layer = this.map.createLayer(MinedOut.level);

        this.mines = this.add.group();

        this.map.createFromTiles(5, 6, 'mine', this.layer.index, this.mines);

        this.mines.visible = false;

        this.player = this.add.sprite(25*15, 25*20, 'player');

        this.tx = this.math.snapToFloor(this.player.x, 25) / 25;
        this.ty = this.math.snapToFloor(this.player.y, 25) / 25;

        this.history.push(new Phaser.Point(this.tx, this.ty));

        this.map.putTile(1, this.tx, this.ty, this.layer.index);

        //  Warning bubble
        this.bubble = this.add.sprite(0, 0, 'bubble');
        this.bubble.visible = false;

        this.bubbleText = this.add.bitmapText(0, 0, 'fat-and-tiny', '1', 24);
        this.bubbleText.smoothed = false;
        this.bubbleText.tint = 0xff0000;
        this.bubbleText.visible = false;

        //  UI Text
        this.minesText = this.add.bitmapText(25, 510, 'interfont', 'Adjacent Mines: 0', 24);
        this.minesText.smoothed = false;

        this.levelText = this.add.bitmapText(625, 510, 'interfont', 'Level: ' + (MinedOut.level + 1) , 24);
        this.levelText.smoothed = false;

        this.scoreText = this.add.bitmapText(625, 540, 'interfont', 'Score: 0', 24);
        this.scoreText.smoothed = false;

        //  Controls

        this.lastKey = this.time.time;

        this.cursors = this.input.keyboard.createCursorKeys();

        this.cursors.left.onDown.add(this.moveLeft, this);
        this.cursors.right.onDown.add(this.moveRight, this);
        this.cursors.up.onDown.add(this.moveUp, this);
        this.cursors.down.onDown.add(this.moveDown, this);

        //  Press P to pause and resume the game
        this.pauseKey = this.input.keyboard.addKey(Phaser.Keyboard.P);
        this.pauseKey.onDown.add(this.togglePause, this);

        //  Press D to toggle the debug display
        this.debugKey = this.input.keyboard.addKey(Phaser.Keyboard.D);
        this.debugKey.onDown.add(this.toggleDebug, this);

    },

    togglePause: function () {

        this.game.paused = (this.game.paused) ? false : true;

    },

    toggleDebug: function () {

        this.mines.visible = (this.mines.visible) ? false : true;

    },

    moveLeft: function () {

        this.player.x -= 25;

        if (!this.checkMines())
        {
            this.updateMines();
        }

    },

    moveRight: function () {

        this.player.x += 25;

        if (!this.checkMines())
        {
            this.updateMines();
        }

    },

    moveUp: function () {

        this.player.y -= 25;

        if (!this.checkMines())
        {
            this.updateMines();
        }

    },

    moveDown: function () {

        if (this.ty === 20)
        {
            return;
        }

        this.player.y += 25;

        if (!this.checkMines())
        {
            this.updateMines();
        }

    },

    checkMines: function () {

        this.tx = this.math.snapToFloor(this.player.x, 25) / 25;
        this.ty = this.math.snapToFloor(this.player.y, 25) / 25;

        this.history.push(new Phaser.Point(this.tx, this.ty));

        var tile = this.map.getTile(this.tx, this.ty, this.layer.index, true);

        if (tile.index === 3)
        {
            //  Picked-up a damsel!
            MinedOut.score += 500;

            //  Mark tile as uncovered
            this.map.putTile(1, this.tx, this.ty, this.layer.index);
        }
        else if (tile.index > 3)
        {
            this.gameOver();
            return true;
        }
        else
        {
            //  They got to the exit
            if (this.ty === 0)
            {
                this.levelWon();
                return false;
            }

            //  Mark tile as uncovered
            if (tile.index === 2)
            {
                this.map.putTile(1, this.tx, this.ty, this.layer.index);

                //  Score is based on how fast you made your last move from an unexplored tile
                var duration = this.time.time - this.lastKey;

                if (duration >= 1000)
                {
                    MinedOut.score += 1;
                }
                else if (duration < 250)
                {
                    MinedOut.score += 10;
                }
                else if (duration >= 250 && duration < 500)
                {
                    MinedOut.score += 5;
                }
                else
                {
                    MinedOut.score += 2;
                }

                this.lastKey = this.time.time;
            }

            return false;
        }

    },

    updateMines: function () {

        if (this.won)
        {
            return;
        }

        //  Any mines near the player?
        this.minesNear = 0;

        var above = this.map.getTileAbove(this.layer.index, this.tx, this.ty);
        var below = this.map.getTileBelow(this.layer.index, this.tx, this.ty);
        var left = this.map.getTileLeft(this.layer.index, this.tx, this.ty);
        var right = this.map.getTileRight(this.layer.index, this.tx, this.ty);

        if (above && above.index > 3)
        {
            this.minesNear++;
        }

        if (below && below.index > 3)
        {
            this.minesNear++;
        }

        if (left && left.index > 3)
        {
            this.minesNear++;
        }

        if (right && right.index > 3)
        {
            this.minesNear++;
        }

        if (this.minesNear === 0)
        {
            this.bubble.visible = false;
            this.bubbleText.visible = false;
        }
        else
        {
            this.bubble.x = this.player.x;
            this.bubble.y = this.player.y - 32;

            this.bubbleText.x = this.bubble.x + 8;
            this.bubbleText.y = this.bubble.y - 4;
            this.bubbleText.text = this.minesNear;

            this.bubble.visible = true;
            this.bubbleText.visible = true;
        }

        this.scoreText.text = 'Score: ' + MinedOut.score;
        this.minesText.text = 'Adjacent Mines: ' + this.minesNear;

    },

    levelWon: function () {

        //  Play back through the history

        this.minesText.text = "Well Done! Level Complete!";

        this.won = true;

        this.mines.visible = true;

        this.cursors.left.onDown.remove(this.moveLeft, this);
        this.cursors.right.onDown.remove(this.moveRight, this);
        this.cursors.up.onDown.remove(this.moveUp, this);
        this.cursors.down.onDown.remove(this.moveDown, this);

        //  Reset the path you left
        this.map.replace(1, 2, 0, 0, 32, 20, this.layer.index);

        this.time.events.add(1000, this.nextMove, this);

    },

    nextMove: function () {

        if (this.history.length === 0)
        {
            this.levelComplete();
            return;
        }

        var pos = this.history.shift();

        this.player.x = pos.x * 25;
        this.player.y = pos.y * 25;
        
        this.map.putTile(1, pos.x, pos.y, this.layer.index);

        this.time.events.add(100, this.nextMove, this);

    },

    levelComplete: function () {

        MinedOut.level++;

        if (MinedOut.level === 4)
        {
            this.state.start('MinedOut.MainMenu');
        }
        else
        {
            this.state.start('MinedOut.Game');
        }

    },

    gameOver: function () {

        this.player.kill();

        this.bubble.visible = false;
        this.bubbleText.visible = false;

        this.mines.visible = true;

        this.cursors.left.onDown.remove(this.moveLeft, this);
        this.cursors.right.onDown.remove(this.moveRight, this);
        this.cursors.up.onDown.remove(this.moveUp, this);
        this.cursors.down.onDown.remove(this.moveDown, this);

        this.input.onDown.add(this.returnToMenu, this);

    },

    returnToMenu: function () {

        this.state.start('MinedOut.MainMenu');

    }

};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game');

game.state.add('MinedOut.Preloader', MinedOut.Preloader);
game.state.add('MinedOut.MainMenu', MinedOut.MainMenu);
game.state.add('MinedOut.Game', MinedOut.Game);

game.state.start('MinedOut.Preloader');
