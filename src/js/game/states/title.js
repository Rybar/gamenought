/**
 * Created by ryan on 11/12/16.
 */
var title = {};

title.create = function() {

        //add title text

        //add play button
        var playButton = this.game.add.button(
            this.game.world.centerX,
            this.game.world.height - 50,
            'playButton',
            this.playGame,
            this
        ); //uses 'playButton' sprite defined in preloader
        playButton.anchor.setTo(0.5,0.5); //sets button anchor to center



}

title.playGame = function(){
    console.log('play clicked');
    this.game.state.start('game');

}

module.exports = title;