var LazerDash = {

    starData: [],
    particleTextures: []

};

LazerDash.Preloader = function () {};

LazerDash.Preloader.prototype = {

    init: function () {

        this.input.maxPointers = 1;

        this.scale.pageAlignHorizontally = true;

    },

    preload: function () {

        this.load.path = 'assets/';

        this.load.images([ 'logo', 'player', 'star-particle', 'background' ]);

        this.load.bitmapFont('fat-and-tiny');
        this.load.bitmapFont('interfont');

        this.load.spritesheet('star', 'star.png', 32, 32);
        this.load.spritesheet('lazerV', 'lazer-v.png', 10, 16);
        this.load.spritesheet('lazerH', 'lazer-h.png', 16, 10);

    },

    create: function () {

        this.state.start('LazerDash.MainMenu');

    }

};

LazerDash.MainMenu = function () {

    this._colors = [];

};

LazerDash.MainMenu.prototype = {
 
    create: function () {

        this.add.image(0, 0, 'background');

        var logo = this.add.image(this.world.centerX, 200, 'logo');
        logo.anchor.x = 0.5;

        var start = this.add.bitmapText(this.world.centerX, 460, 'fat-and-tiny', 'CLICK TO PLAY', 64);
        start.anchor.x = 0.5;
        start.smoothed = false;
        start.tint = 0xff0000;

        if (LazerDash.starData.length === 0)
        {
            this.scanBitmap();
            this.makePixelTextures();
        }

        this.input.onDown.addOnce(this.start, this);

    },

    start: function () {

        this.state.start('LazerDash.Game');

    },

    scanBitmap: function () {

        //  The star-particle sprite is 13x12 in size
        var bmd = this.make.bitmapData(13, 12);

        //  Paste it onto the bmd and update the pixels
        bmd.copy('star-particle').update();

        //  Scan that bad boy
        bmd.processPixelRGB(this.makePixel, this);

    },

    makePixel: function (color, x, y) {

        //  We'll be sent 156 pixels in total (13x12)

        //  But we only care about the ones we can see (alpha > 0) which is 102 in total
        if (color.a > 0)
        {
            //  Is this a new color we've not encountered before?
            var idx = this._colors.indexOf(color.rgba);

            if (idx === -1)
            {
                idx = this._colors.push(color.rgba) - 1;
            }

            //  Store the coordinates and color
            LazerDash.starData.push( { x: x * 2, y: y * 2, c: idx });
        }

        return false;

    },

    makePixelTextures: function () {

        for (var i = 0; i < this._colors.length; i++)
        {
            var bmd = this.make.bitmapData(2, 2);
            bmd.rect(0, 0, 2, 2, this._colors[i]);
            bmd.update();
            LazerDash.particleTextures.push(bmd);
        }

    }

};

LazerDash.Game = function () {

    this.score = 0;
    this.scoreText = null;

    this.speed = 300;
    this.lazerSpeed = 100;

    this.player = null;
    this.scoreText = null;

    this.star = null;
    this.lazers = null;
    this.stars = null;
    this.emitter = null;

    this.cursors = null;

    this.pauseKey = null;
    this.debugKey = null;
    this.showDebug = false;

};

LazerDash.Game.prototype = {

    init: function () {

        this.score = 0;

        this.speed = 300;
        this.lazerSpeed = 100;

        this.showDebug = false;

    },

    create: function () {

        this.add.image(0, 0, 'background');

        this.stars = this.add.group();

        this.lazers = this.add.physicsGroup();

        this.star = this.add.sprite(200, 200, 'star', 0);
        this.physics.arcade.enable(this.star);

        this.emitter = this.add.emitter(0, 0, LazerDash.starData.length * 4);
        this.emitter.makeParticles('__default', null, LazerDash.starData.length * 4);

        //  Debug
        // this.emitter.gravity = 0;
        // this.emitter.setXSpeed(0, 0);
        // this.emitter.setYSpeed(0, 0);

        this.emitter.gravity = 0;
        this.emitter.setXSpeed(-200, 200);
        this.emitter.setYSpeed(-200, 200);

        this.emitter.setAlpha(1, 0.2, 4000);
        this.emitter.setRotation();
        this.emitter.lifespan = 3000;
        this.emitter.particleAnchor.set(0);

        this.player = this.add.sprite(400, 300, 'player');

        this.physics.arcade.enable(this.player);

        this.scoreText = this.add.bitmapText(16, 0, 'fat-and-tiny', 'SCORE: 0', 32);
        this.scoreText.smoothed = false;
        this.scoreText.tint = 0xff0000;

        this.cursors = this.input.keyboard.createCursorKeys();

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

        this.player.body.velocity.set(0);

        if (this.cursors.left.isDown)
        {
            this.player.body.velocity.x = -this.speed;
        }
        else if (this.cursors.right.isDown)
        {
            this.player.body.velocity.x = this.speed;
        }

        if (this.cursors.up.isDown)
        {
            this.player.body.velocity.y = -this.speed;
        }
        else if (this.cursors.down.isDown)
        {
            this.player.body.velocity.y = this.speed;
        }

        this.physics.arcade.overlap(this.player, this.star, this.pickUpStar, null, this);

        this.physics.arcade.overlap(this.player, this.lazers, this.hitLazer, null, this);

        this.world.wrap(this.player);
        this.lazers.forEach(this.world.wrap, this.world, true, 32);

    },

    placeStar: function () {

        this.star.x = this.rnd.between(32, 768);
        this.star.y = this.rnd.between(32, 568);

    },

    pickUpStar: function (player, star) {

        //  Drop a star into position

        var x = star.x + 16;
        var y = star.y + 16;

        var pulse = this.stars.getFirstDead(true, x, y, 'star');

        //  Start the star pulsating
        pulse.anchor.set(0.5);

        this.pulseStar(null, null, pulse, 600);

        this.score += 100;
        this.scoreText.text = "SCORE: " + this.score;

        this.placeStar();

    },

    pulseStar: function (scale, tween, star, speed) {

        speed -= 100;

        var tween = this.add.tween(star.scale).to( { x: 2, y: 2 }, speed, "Sine.easeInOut", true, 0, 0, true);

        if (speed === 100)
        {
            tween.onComplete.add(this.explodeStar, this, 0, star);
        }
        else
        {
            tween.onComplete.add(this.pulseStar, this, 0, star, speed);
        }

    },

    explodeStar: function (scale, tween, star) {

        var x = star.x - 11;
        var y = star.y - 11;

        this.generateBitmapParticle(x, y);

        //  Left moving lazer
        var lazer = this.lazers.create(x, y, 'lazerH', 0);
        lazer.body.velocity.x = -this.lazerSpeed;

        //  Right moving lazer
        lazer = this.lazers.create(x, y, 'lazerH', 1);
        lazer.body.velocity.x = this.lazerSpeed;

        //  Up moving lazer
        lazer = this.lazers.create(x, y, 'lazerV', 0);
        lazer.body.velocity.y = -this.lazerSpeed;

        //  Down moving lazer
        lazer = this.lazers.create(x, y, 'lazerV', 1);
        lazer.body.velocity.y = this.lazerSpeed;

        star.kill();

    },

    hitLazer: function (player, lazer) {

        var cloneH = this.add.sprite(player.x + 16, player.y + 16, 'player');
        cloneH.anchor.set(0.5);

        var cloneV = this.add.sprite(player.x + 16, player.y + 16, 'player');
        cloneV.anchor.set(0.5);

        lazer.kill();
        player.kill();

        this.add.tween(cloneV.scale).to( { x: 0.10, y: 30 }, 500, "Expo.easeOut", true, 0);
        this.add.tween(cloneH.scale).to( { x: 30, y: 0.10 }, 500, "Expo.easeOut", true, 0);
        this.add.tween(cloneH).to( { alpha: 0 }, 250, "Linear", true, 250);
        this.add.tween(cloneV).to( { alpha: 0 }, 250, "Linear", true, 250);

        //  Start Game Over timer
        this.time.events.add(3000, this.gameOver, this);

    },

    gameOver: function () {

        this.state.start('LazerDash.MainMenu');

    },

    generateBitmapParticle: function (x, y) {

        //  Place the particles down exactly where the star sprite pixels are
        for (var p = 0; p < LazerDash.starData.length; p++)
        {
            var s = LazerDash.starData[p];
            this.emitter.emitParticle(x + s.x, y + s.y, LazerDash.particleTextures[s.c]);
        }

    },

    render: function () {

        if (this.showDebug)
        {
            this.lazers.forEachAlive(this.renderBody, this);
            this.world.forEachAlive(this.renderBody, this);
        }

    },

    renderBody: function (sprite) {

        this.game.debug.body(sprite);

    }

};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game');

game.state.add('LazerDash.Preloader', LazerDash.Preloader);
game.state.add('LazerDash.MainMenu', LazerDash.MainMenu);
game.state.add('LazerDash.Game', LazerDash.Game);

game.state.start('LazerDash.Preloader');

