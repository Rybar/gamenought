var BodyDirection = {

    ball: null,
    angleLine: null,

    init: function () {

        this.scale.pageAlignHorizontally = true;

    },

    preload: function () {

        this.load.image('ball');

    },

    create: function () {

        this.stage.backgroundColor = 0x754c24;

        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.y = 100;

        this.ball = this.add.sprite(100, 100, 'ball');
        this.ball.anchor.set(0.5);

        this.physics.enable(this.ball, Phaser.Physics.ARCADE);

        this.ball.body.bounce.setTo(0.98);
        this.ball.body.velocity.setTo(100, 0);
        this.ball.body.collideWorldBounds = true;
        
        this.angleLine = new Phaser.Line();

    },

    update: function () {

        this.angleLine.fromAngle(this.ball.x, this.ball.y, this.ball.body.angle, this.ball.body.speed / 2);

    },

    render: function () {

        this.game.debug.geom(this.angleLine, '#00ff00');

        this.game.debug.text('Speed: ' + this.ball.body.speed, 20, 32);

    }

};

var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game');

game.state.add('Demo', BodyDirection, true);
