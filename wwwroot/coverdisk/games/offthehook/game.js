var OffTheHook = {};

OffTheHook.Preloader = function () {};

OffTheHook.Preloader.prototype = {

    init: function () {

        this.input.maxPointers = 1;

        this.scale.pageAlignHorizontally = true;

    },

    preload: function () {

        this.load.path = 'assets/';

        this.load.bitmapFont('fat-and-tiny');
        this.load.bitmapFont('interfont');

        this.load.images([ 'logo', 'bubble1', 'bubble2', 'fish', 'hook', 'undersea', 'worm1', 'worm2', 'cave', 'bones', 'back' ]);

    },

    create: function () {

        this.state.start('OffTheHook.MainMenu');

    }

};

OffTheHook.MainMenu = function () {};

OffTheHook.MainMenu.prototype = {

    create: function () {

        this.add.image(0, 0, 'undersea');

        var logo = this.add.image(this.world.centerX, 140, 'logo');
        logo.anchor.x = 0.5;

        var start = this.add.bitmapText(this.world.centerX, 460, 'fat-and-tiny', 'CLICK TO PLAY', 64);
        start.anchor.x = 0.5;
        start.smoothed = false;
        start.tint = 0xff0000;

        this.input.onDown.addOnce(this.start, this);

    },

    start: function () {

        this.state.start('OffTheHook.Game');

    }

};

OffTheHook.Game = function (game) {

    this.score = 0;
    this.scoreText = null;

    this.player = null;
    this.worms = null;
    this.hooks = null;

    this.wormSpeed = 100;
    this.wormReleaseRate = 1500;

    this.windMax = 0;
    this.emitterBack = null;
    this.emitterFront = null;

    this.cursors = null;

    this.pauseKey = null;
    this.debugKey = null;
    this.showDebug = false;

};

OffTheHook.Game.prototype = {

    init: function () {

        this.score = 0;

        this.wormSpeed = 100;

        this.windMax = 0;

        this.showDebug = false;

    },

    create: function () {

        this.add.image(0, 0, 'undersea');
        this.add.image(0, 0, 'back');

        this.emitterBack = this.add.emitter(this.world.centerX, 600, 256);
        this.emitterBack.makeParticles('bubble1');
        this.emitterBack.setYSpeed(-20, -100);
        this.emitterBack.gravity = 0;
        this.emitterBack.width = 800;
        this.emitterBack.setRotation();
        this.emitterBack.setAlpha(0.1, 0.8);

        this.emitterFront = this.add.emitter(this.world.centerX, 600, 256);
        this.emitterFront.makeParticles('bubble2');
        this.emitterFront.setYSpeed(-50, -150);
        this.emitterFront.gravity = 0;
        this.emitterFront.width = 800;
        this.emitterFront.setRotation();
        this.emitterFront.setAlpha(0.1, 0.8);

        this.worms = this.add.physicsGroup();
        this.worms.alpha = 0.8;

        this.hooks = this.add.physicsGroup();
        this.hooks.alpha = 0.8;

        this.player = this.add.sprite(400, 300, 'fish');
        this.player.anchor.set(0.5);
        this.player.eating = Phaser.LEFT;

        this.physics.arcade.enable(this.player);

        this.player.body.setSize(16, 16, 0, 0);

        this.add.image(0, 0, 'cave');

        this.scoreText = this.add.bitmapText(16, 0, 'fat-and-tiny', 'SCORE: 0', 32);
        this.scoreText.smoothed = false;
        this.scoreText.tint = 0xff0000;

        this.cursors = this.input.keyboard.createCursorKeys();

        this.cursors.left.onDown.add(this.faceLeft, this);
        this.cursors.right.onDown.add(this.faceRight, this);
        this.cursors.up.onDown.add(this.faceUp, this);
        this.cursors.down.onDown.add(this.faceDown, this);

        this.releaseItem();
        this.changeWindDirection();

        this.emitterBack.start(false, 10000, 40);
        this.emitterFront.start(false, 8000, 80);

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

        this.showDebug = (this.showDebug) ? false : true;

    },

    update: function () {

        this.physics.arcade.overlap(this.player, this.worms, this.checkWorm, null, this);
        this.physics.arcade.overlap(this.player, this.hooks, this.checkHook, null, this);

    },

    checkWorm: function (fish, worm) {

        if (fish.eating === worm.body.facing)
        {
            this.addScore(10);
            worm.kill();
        }
        else
        {
            this.killPlayer();
        }

    },

    checkHook: function (fish, hook) {

        if (fish.eating !== hook.body.facing)
        {
            this.addScore(100);
            hook.kill();
        }
        else
        {
            this.killPlayer();
        }

    },

    killPlayer: function () {

        var bones = this.add.sprite(this.player.x, this.player.y, 'bones');

        bones.anchor.set(0.5);
        bones.angle = this.player.angle;
        bones.scale.copyFrom(this.player.scale);

        this.add.tween(bones).to( { y: 500, alpha: 0 }, 3000, "Linear", true);

        this.player.kill();

        this.time.events.add(3000, this.gameOver, this);

    },

    addScore: function (amount) {

        this.score += 100;
        this.scoreText.text = "SCORE: " + this.score;

    },

    faceLeft: function () {

        this.player.angle = 0;
        this.player.scale.set(-1, 1);
        this.player.eating = Phaser.RIGHT;

    },

    faceRight: function () {

        this.player.angle = 0;
        this.player.scale.set(1, 1);
        this.player.eating = Phaser.LEFT;

    },

    faceUp: function () {

        this.player.angle = 270;
        this.player.scale.set(1, 1);
        this.player.eating = Phaser.DOWN;

    },

    faceDown: function () {

        this.player.angle = 90;
        this.player.scale.set(1, 1);
        this.player.eating = Phaser.UP;

    },

    releaseItem: function () {

        if (Phaser.Utils.chanceRoll(20))
        {
            var item = this.hooks.getFirstDead(true, 0, 0, 'hook');
        }
        else
        {
            var item = this.worms.getFirstDead(true, 0, 0, 'worm' + this.rnd.between(1, 2));
        }

        var direction = this.rnd.between(1, 4);

        if (direction === Phaser.LEFT)
        {
            item.x = 100;
            item.y = 284;
            item.body.velocity.x = this.wormSpeed;
        }
        else if (direction === Phaser.RIGHT)
        {
            item.x = 700;
            item.y = 284;
            item.body.velocity.x = -this.wormSpeed;
        }
        else if (direction === Phaser.UP)
        {
            item.x = 384;
            item.y = 600;
            item.body.velocity.y = -this.wormSpeed;
        }
        else if (direction === Phaser.DOWN)
        {
            item.x = 384;
            item.y = -32;
            item.body.velocity.y = this.wormSpeed;
        }

        this.time.events.add(this.wormReleaseRate, this.releaseItem, this);

        if (this.wormReleaseRate > 250)
        {
            this.wormReleaseRate -= 20;
        }

        if (this.wormSpeed < 300)
        {
            this.wormSpeed += 5;
        }

    },

    changeWindDirection: function () {

        var multi = Math.floor((this.windMax + 200) / 4);

        this.windMax += this.rnd.between(0, 100) - multi;

        if (this.windMax > 200)
        {
            this.windMax = 150;
        }
        else if (this.windMax < -200)
        {
            this.windMax = -150;
        }

        console.log(this.windMax);

        this.emitterBack.setXSpeed(this.windMax - 20, this.windMax);
        this.emitterBack.forEachAlive(this.setParticleXSpeed, this);

        this.emitterFront.setXSpeed(this.windMax - 20, this.windMax);
        this.emitterFront.forEachAlive(this.setParticleXSpeed, this);

        var delay = this.rnd.between(2, 6) * 1000;

        this.time.events.add(delay, this.changeWindDirection, this);

    },

    setParticleXSpeed: function (particle) {

        particle.body.velocity.x = this.windMax - this.rnd.between(0, 30);

    },

    gameOver: function () {

        this.state.start('OffTheHook.MainMenu');

    },

    render: function () {

        if (this.showDebug)
        {
            this.game.debug.body(this.player);
            this.worms.forEachAlive(this.renderBody, this);
            this.hooks.forEachAlive(this.renderBody, this);

            this.game.debug.text("emitterBack: " + this.emitterBack.total, 600, 32);
            this.game.debug.text("emitterFront: " + this.emitterFront.total, 600, 64);
        }

    },

    renderBody: function (sprite) {

        this.game.debug.body(sprite);

    }

};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game');

game.state.add('OffTheHook.Preloader', OffTheHook.Preloader);
game.state.add('OffTheHook.MainMenu', OffTheHook.MainMenu);
game.state.add('OffTheHook.Game', OffTheHook.Game);

game.state.start('OffTheHook.Preloader');
