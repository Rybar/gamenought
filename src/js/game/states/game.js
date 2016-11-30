var game = {};


game.preload = function() {

  //game.load.script('filter', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/Fire.js');

  var logo;
  var helicopter;
  var renderTexture;
  var renderTexture2;
  var currentTexture;
  var stageSprite;
  var outputSprite;
  var gameMatrix;
  var gameGroup;

  var cam;
  var fireSprite;
}
game.create = function () {

  //post effect-----------
  var fragmentSrc = [
    "precision mediump float;",
    // Incoming texture coordinates.
    'varying vec2 vTextureCoord;',
    // Incoming vertex color
    'varying vec4 vColor;',
    // Sampler for a) sprite image or b) rendertarget in case of game.world.filter
    'uniform sampler2D uSampler;',

    "uniform vec2      resolution;",
    "uniform float     time;",
    "uniform vec2      mouse;",

    "void main( void ) {",

    "vec2 st = vTextureCoord.xy;",

      "st *= resolution;",
      "st = fract(st);",

    "vec4 color = texture2D(uSampler, vTextureCoord);",

    // bottom-left
    "vec2 bl = step(vec2(0.75) , st);",
    "float pct = bl.x * bl.y;",

   // top-right
   "vec2 tr = step(vec2(0.00),1.0-st);",
   "pct *= tr.x * tr.y;",

    "gl_FragColor = color + vec4(vec3(pct-0.25), 1.0) * vec4(vec3(0.5), 1.0);",

    "}",

    //first try at pixel mosaic effect
    //"gl_FragColor = mod(gl_FragCoord.y, 4.0) * mod(gl_FragCoord.x, 4.0) * texture2D(uSampler, vTextureCoord);",




  ];

  //var fireFragmentSrc = [
  //
  //  "precision mediump float;",
  //  "uniform vec2      resolution;",
  //  "uniform float     time;",
  //  "uniform float     alpha;",
  //  "uniform vec2      speed;",
  //  "uniform float     shift;",
  //
  //  "float rand(vec2 n) {",
  //  "return fract(cos(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);",
  //  "}",
  //
  //  "float noise(vec2 n) {",
  //  "const vec2 d = vec2(0.0, 1.0);",
  //  "vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));",
  //  "return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);",
  //  "}",
  //
  //  "float fbm(vec2 n) {",
  //  "float total = 0.0, amplitude = 1.0;",
  //  "for (int i = 0; i < 4; i++) {",
  //  "total += noise(n) * amplitude;",
  //  "n += n;",
  //  "amplitude *= 0.5;",
  //  "}",
  //  "return total;",
  //  "}",
  //
  //  "void main() {",
  //
  //  "const vec3 c1 = vec3(0.5, 0.0, 0.1);",
  //  "const vec3 c2 = vec3(0.9, 0.0, 0.0);",
  //  "const vec3 c3 = vec3(0.2, 0.0, 0.0);",
  //  "const vec3 c4 = vec3(1.0, 0.9, 0.0);",
  //  "const vec3 c5 = vec3(0.1);",
  //  "const vec3 c6 = vec3(0.9);",
  //
  //  "vec2 p = gl_FragCoord.xy * 8.0 / resolution.xx;",
  //  "float q = fbm(p - time * 0.1);",
  //  "vec2 r = vec2(fbm(p + q + time * speed.x - p.x - p.y), fbm(p + q - time * speed.y));",
  //  "vec3 c = mix(c1, c2, fbm(p + r)) + mix(c3, c4, r.x) - mix(c5, c6, r.y);",
  //  "gl_FragColor = vec4(c * cos(shift * gl_FragCoord.y / resolution.y), alpha);",
  //  "}"
  //];



  scanlineFilter = new Phaser.Filter(game, null, fragmentSrc);
  scanlineFilter.setResolution(320,180);

  //fireFilter = new Phaser.Filter(game, null, fireFragmentSrc);

  game.world.setBounds(0, 0, 1000, 1000);

  game.stage.smoothed = false;


  cursors = game.input.keyboard.createCursorKeys();

  //game.camera.view = Phaser.Rectangle(0,0,427,240);
  //game.camera.scale.setTo(3,3);

  gameGroup = game.make.group();

  helicopter = game.make.sprite(0,0, 'helicopter');
  game.physics.enable(helicopter, Phaser.Physics.ARCADE);
  gameGroup.add(helicopter);

  logo = game.make.sprite(100,100, 'logo');
  logo.scale.setTo(0.25,0.25);
  logo.anchor.setTo(0.5,0.5)
  game.physics.enable(logo, Phaser.Physics.ARCADE);
  gameGroup.add(logo);

  renderTexture = game.make.renderTexture(320, 180, 'texture1');
  renderTexture2 = game.make.renderTexture(1280, 720, 'texture2');

  renderTexture2.renderer.renderSession.roundPixels = true;
  renderTexture2.baseTexture.scaleMode = PIXI.scaleModes.NEAREST;

  stageSprite = game.make.sprite(0,0, renderTexture);
  stageSprite.smoothed = false;

  outputSprite = game.add.sprite(0,0, renderTexture2);
  outputSprite.smoothed = false;
  outputSprite.filters = [scanlineFilter];

  //fireSprite = game.make.sprite(0, 100);
  //fireSprite.width = 266;
  //fireSprite.height = 100
  //gameGroup.add(fireSprite);
  //fireFilter.setResolution(266,100);
  //fireFilter.uniforms.alpha = { type: '1f', value: 0.0 };
  //fireFilter.uniforms.shift = { type: '1f', value: -0.9};
  //fireFilter.uniforms.speed = { type: '2f', value: { x: -5.7, y: -5.4 } };
  //fireSprite.filters = [fireFilter];

  gameMatrix = new Phaser.Matrix(4,0,0,4,0,0);

  console.log(game);

};

game.update = function() {

  //fireFilter.update();

  logo.angle += .2;

  if (cursors.up.isDown) {
      game.camera.y -= 1;
  }
  else if (cursors.down.isDown) {
    game.camera.y += 1;
  }

  if (cursors.left.isDown) {
    game.camera.x -= 1;
  }

  else if (cursors.right.isDown) {
    game.camera.x += 1;
  }

}

game.preRender = function(){
  gameGroup.visible = false;
}
game.render = function(){
  //do nothing
  gameGroup.visible = true;
  renderTexture.render(gameGroup, game.stage.worldTransform, true);
  renderTexture2.render(stageSprite, gameMatrix, true);

}

module.exports = game;
