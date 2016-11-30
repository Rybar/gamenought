var preloader = {};

preloader.preload = function () {

  //this.game.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
  //this.game.scale.setUserScale(3,3);
  this.game.renderer.renderSession.roundPixels = true;
  Phaser.Canvas.setImageRenderingCrisp(this.game.canvas)

  this.game.load.image('logo', 'images/phaser.png');
  this.game.load.image('helicopter', 'images/helicopter.png');

  var bmd = this.game.make.bitmapData(100,25);

  bmd.rect(0,0,100,25, 'green');
  bmd.ctx.font = '18px sans-serif';
  bmd.ctx.textAlign = 'center';
  bmd.ctx.fillStyle = 'white';
  bmd.ctx.fillText('PLAY', 50,20,160);

  bmd.generateTexture('playButton');



};

preloader.create = function () {

  this.game.state.start('game');

};

module.exports = preloader;
