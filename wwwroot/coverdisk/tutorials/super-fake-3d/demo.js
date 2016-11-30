var SuperFake3D = {

    stack: null,

    init: function () {

        this.scale.pageAlignHorizontally = true;

    },

    preload: function () {

        this.load.images(['logo', 'blur']);

    },

    create: function () {

        this.stack = this.add.group();

        var x = this.world.centerX;
        var y = this.world.centerY + 64;

        for (var i = 0; i < 64; i++)
        {
            var spr = this.stack.create(x, y - i, 'logo');
            spr.anchor.set(0.5);
        }

    },

    update: function () {

        this.stack.setAll('angle', 1, false, false, 1);

    }

};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game');

game.state.add('Demo', SuperFake3D, true);
