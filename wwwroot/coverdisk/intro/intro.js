var Interphase = {};

Interphase.Boot = function () {};

Interphase.Boot.prototype = {

    init: function () {

        this.scale.pageAlignHorizontally = true;

    },

    preload: function () {

        this.load.path = 'assets/';
        this.load.image('disk');

    },

    create: function () {

        this.state.start('Preloader');

    }

};

Interphase.Preloader = function () {};

Interphase.Preloader.prototype = {

    preload: function () {

        this.disk = this.add.sprite(this.world.centerX, this.world.centerY, 'disk');
        this.disk.anchor.set(0.5);

        this.load.path = 'assets/';

        this.load.image('overlay');
        this.load.shader('plasma');
        this.load.audio('tape', 'tape.ogg');
        this.load.bitmapFont('interfont');

    },

    create: function () {

        this.state.start('Intro');

    },

    loadUpdate: function () {

        this.disk.rotation += 0.01;

    }

};

Interphase.Intro = function () {

    this.filter = null;

};

Interphase.Intro.prototype = {

    create: function () {

        // Oldskool plasma shader. (c) Victor Korsun, bitekas@gmail.com; 1996-2013.

        this.sound.play('tape');

        var sprite = this.add.sprite();
        sprite.width = 800;
        sprite.height = 600;

        this.filter = new Phaser.Filter(this.game, null, this.cache.getShader('plasma'));
        this.filter.setResolution(800, 600);

        sprite.filters = [ this.filter ];

        this.add.sprite(0, 0, 'overlay');

        this.game1 = this.add.bitmapText(208, 224, 'interfont', '1 .... 10 SECOND CLICKER', 24);
        this.game2 = this.add.bitmapText(208, 244, 'interfont', '2 .......... 8 BALL POOL', 24);
        this.game3 = this.add.bitmapText(208, 264, 'interfont', '3 ............ AQUAPLANE', 24);
        this.game4 = this.add.bitmapText(208, 284, 'interfont', '4 ............ HOT HOOPS', 24);
        this.game5 = this.add.bitmapText(208, 304, 'interfont', '5 ........... LAZER DASH', 24);
        this.game6 = this.add.bitmapText(208, 324, 'interfont', '6 ............ MINED OUT', 24);
        this.game7 = this.add.bitmapText(208, 344, 'interfont', '7 ......... OFF THE HOOK', 24);
        this.game8 = this.add.bitmapText(208, 364, 'interfont', '8 ............... SLALOM', 24);

        for (var i = 1; i <= 8; i++)
        {
            this['game' + i].smoothed = false;
            this['game' + i].tint = 0xf48f00;
        }

    },

    update: function () {

        this.filter.update();

    }

};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game');

game.state.add('Boot', Interphase.Boot);
game.state.add('Preloader', Interphase.Preloader);
game.state.add('Intro', Interphase.Intro);

game.state.start('Boot');


