var Clicker = {
    score: 0
};

Clicker.Preloader = function () {};

Clicker.Preloader.prototype = {

    init: function () {

        this.input.maxPointers = 1;
        this.scale.pageAlignHorizontally = true;

    },

    preload: function () {

        this.load.path = 'assets/';

        this.load.image('logo');

        this.load.bitmapFont('fat-and-tiny');
        this.load.bitmapFont('digits');

        this.load.shader('ripples');

        this.load.spritesheet('sprites', 'sprites.png', 32, 32);

    },

    create: function () {

        this.state.start('Clicker.MainMenu');

    }

};

Clicker.MainMenu = function () {

    this.filter = null;

};

Clicker.MainMenu.prototype = {

    create: function () {

        this.stage.backgroundColor = 0x000000;

        var uniforms = { 
            color: { type: '3fv', value: [ 0.1, 0.3, 0.6 ] }
        };

        this.filter = new Phaser.Filter(this.game, uniforms, this.cache.getShader('ripples'));
        this.filter.addToWorld(0, 0, 800, 600);

        var logo = this.add.image(this.world.centerX, 48, 'logo');
        logo.anchor.x = 0.5;

        var start = this.add.bitmapText(this.world.centerX, 460, 'fat-and-tiny', 'CLICK TO PLAY', 64);
        start.anchor.x = 0.5;
        start.smoothed = false;
        start.tint = 0xff0000;

        var score = this.add.bitmapText(this.world.centerX, 500, 'fat-and-tiny', 'HIGH SCORE: ' + Clicker.score, 64);
        score.anchor.x = 0.5;
        score.smoothed = false;
        score.tint = 0xff0000;

        this.input.onDown.addOnce(this.start, this);

    },

    start: function () {

        this.state.start('Clicker.Game');

    },

    update: function () {

        this.filter.update();

    }

};

Clicker.Game = function () {

    this.score = 0;
    this.scoreText = null;

    this.timeText = null;

    this.target = null;
    this.stars = null;
    this.timer = null;

    this.tremorRect = null;

    this.colors = { r: 0.1, g: 0.1, b: 0.1 };
    this.uniform = null;
    this.filter = null;

    this.pauseKey = null;
    this.debugKey = null;
    this.showDebug = false;

};

Clicker.Game.prototype = {

    init: function () {

        this.score = 0;
        this.colors = { r: 0.1, g: 0.3, b: 0.6 };

    },

    create: function () {

        this.stage.backgroundColor = 0x000000;

        var uniforms = {
            color: { type: '3fv', value: [ 0.0, 0.0, 0.0 ] }
        };

        this.filter = new Phaser.Filter(this.game, uniforms, this.cache.getShader('ripples'));
        this.filter.addToWorld(0, 0, 800, 600);

        this.uniform = this.filter.uniforms.color.value;

        this.timeText = this.add.bitmapText(this.world.centerX + 32, 128, 'digits', '10', 1024);
        this.timeText.anchor.set(0.5);
        this.timeText.smoothed = false;
        this.timeText.alpha = 0.3;

        this.stars = this.add.group();

        this.target = this.add.sprite(400, 200, 'sprites');
        this.target.inputEnabled = true;
        this.target.scale.set(2);
        this.target.smoothed = false;

        this.target.events.onInputDown.add(this.clickedIt, this);

        this.tremorRect = new Phaser.Rectangle(this.target.x, this.target.y, 6, 6);

        this.scoreText = this.add.bitmapText(64, 12, 'fat-and-tiny', 'SCORE: 0', 32);
        this.scoreText.smoothed = false;
        this.scoreText.tint = 0xffff00;
        this.scoreText.visible = false;

        this.timer = this.time.create(false);
        this.timer.add(10000, this.timeUp, this);
        this.timer.start();

        //  Press P to pause and resume the game
        this.pauseKey = this.input.keyboard.addKey(Phaser.Keyboard.P);
        this.pauseKey.onDown.add(this.togglePause, this);

        //  Press D to toggle the debug display
        this.debugKey = this.input.keyboard.addKey(Phaser.Keyboard.D);
        this.debugKey.onDown.add(this.toggleDebug, this);

        //  Start the colors tweening
        this.add.tween(this.colors).to( { r: 0.2, g: 1.0, b: 0.2 }, 10000, "Linear", true);

    },

    togglePause: function () {

        this.game.paused = (this.game.paused) ? false : true;

    },

    toggleDebug: function () {

        this.showDebug = (this.showDebug) ? false : true;

    },

    clickedIt: function (sprite, pointer) {

        var flash = this.stars.create(pointer.x, pointer.y, 'sprites', 1);
        flash.anchor.set(0.5);

        this.add.tween(flash).to({ alpha: 0.2 }, 1000, "Linear", true);

        var x = this.rnd.between(0, this.game.width - this.target.width);
        var y = this.rnd.between(0, this.game.height - this.target.height);

        this.target.x = x;
        this.target.y = y;

        this.tremorRect.x = x;
        this.tremorRect.y = y;

    },

    update: function () {

        this.tremorRect.random(this.target);

        if (this.timeText.visible)
        {
            this.timeText.text = 10 - Math.floor(this.timer.seconds);
        }

        this.uniform[0] = this.colors.r;
        this.uniform[1] = this.colors.g;
        this.uniform[2] = this.colors.b;

        this.filter.update();

    },

    timeUp: function () {

        this.timeText.text = "";
        this.timeText.visible = false;

        this.target.inputEnabled = false;

        var tween = this.add.tween(this.target).to({ alpha: 0 }, 1000, "Linear", true);

        this.scoreText.visible = true;

        //  Did they score anything?
        if (this.stars.total > 0)
        {
            tween.onComplete.addOnce(this.displayStars, this);
        }
        else
        {
            this.time.events.add(2000, this.gameOver, this);
        }

    },

    displayStars: function () {

        this._i = 0;
        this.stars.forEach(this.showStar, this);

    },

    showStar: function (star) {

        this.add.tween(star).to({ alpha: 1 }, 250, "Linear", true, this._i * 250);
        this.add.tween(star).to({ x: 32  }, 750, "Sine.easeIn", true, (this._i * 250) + 250);
        var tween = this.add.tween(star).to({ y: 32 }, 750, "Sine.easeOut", true, (this._i * 250) + 250);

        this._i++;

        if (this._i === this.stars.total)
        {
            tween.onComplete.add(this.addScore, this, 0, true);
        }
        else
        {
            tween.onComplete.add(this.addScore, this, 0, false);
        }

    },

    addScore: function (tween, star, lastStar) {

        this.score++;
        this.scoreText.text = "SCORE: " + this.score;

        if (lastStar)
        {
            this.time.events.add(2000, this.gameOver, this);
        }

    },

    gameOver: function () {

        if (this.score > Clicker.score)
        {
            Clicker.score = this.score;
        }

        this.state.start('Clicker.MainMenu');

    },

    render: function () {

        if (this.showDebug)
        {
            this.game.debug.text("Duration: " + this.timer.seconds, 32, 32);
            this.game.debug.text("R: " + this.colors.r, 32, 128);
            this.game.debug.text("G: " + this.colors.g, 32, 128 + 32);
            this.game.debug.text("B: " + this.colors.b, 32, 128 + 64);
        }

    },

};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game');

game.state.add('Clicker.Preloader', Clicker.Preloader);
game.state.add('Clicker.MainMenu', Clicker.MainMenu);
game.state.add('Clicker.Game', Clicker.Game);

game.state.start('Clicker.Preloader');

