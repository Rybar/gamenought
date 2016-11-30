// http://cpcbox.com/

/*
    TODO:

    Flashing Text? :)
    Optimise clearRect and overlay
    Smooth scroll?
    Print character delay
    Print newline delay
*/

var TTY = function (game, font, width, height, ink, paper) {

    if (font === undefined) { font = 'TTYfont'; }

    if (!game.cache.checkImageKey(font))
    {
        throw new Error("Phaser.TTY Invalid font key given");
    }

    if (ink === undefined) { ink = '#ffffff'; }
    if (paper === undefined) { paper = ''; }

    this.game = game;

    this.group = game.add.group();

    this._x = 0; // col
    this._y = 0; // row

    this.font = game.make.sprite(0, 0, font, 0);

    var frame = game.cache.getFrameByIndex(font, 0);

    this.charWidth = frame.width;
    this.charHeight = frame.height;

    if (width === undefined)
    {
        width = Math.floor(game.width / this.charWidth);
    }

    if (height === undefined)
    {
        height = Math.floor(game.height / this.charHeight);
    }

    this.width = width;
    this.height = height;

    this.paper = paper;
    this._ink = ink;

    //  The background color block (transparent by default)
    this.back = game.add.bitmapData(this.charWidth * width, this.charHeight * height);
    this.backSprite = this.group.create(0, 0, this.back);

    //  The foreground, where all the text is drawn
    this.fore = game.add.bitmapData(this.charWidth * width, this.charHeight * height);
    this.foreSprite = this.group.create(0, 0, this.fore);

    this.cursor = null;

    this.cursorTexture = game.make.bitmapData(this.charWidth, this.charHeight);
    this.cursorTexture.fill(255, 255, 255, 1);

    this.textFill = game.make.bitmapData(this.charWidth, this.charHeight);
    this.textFill.fill(255, 0, 0, 1);

    if (paper !== '')
    {
        this.cls(ink, paper, true);
    }

    this.cursor = this.group.create(0, 0, this.cursorTexture);
    this._blinkRate = 750;
    this._cursorTween = game.add.tween(this.cursor).to( { alpha: 0.1 }, this._blinkRate, "Linear", true, 0, -1, true);

    this.pendingInput = TTY.INPUT_NONE;

    this.inputString = '';
    this.inputCallback = null;
    this.inputCallbackContext = null;

    this.validKeys = [];

    game.input.keyboard.addCallbacks(this, null, null, this.keyPress);

    this.deleteKey = game.input.keyboard.addKey(Phaser.Keyboard.BACKSPACE);
    this.enterKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);

    this.deleteKey.onHoldCallback = this.onDeleteDown;
    this.deleteKey.onHoldContext = this;

    this._nextDelete = 0;
    this.deleteRate = 120;

    this.enterKey.onDown.add(this.onEnterDown, this);

};

TTY.INPUT_NONE = 0;
TTY.INPUT_KEY = 1;
TTY.INPUT_STRING = 2;
TTY.INPUT_INT = 3;
TTY.INPUT_FLOAT = 4;

TTY.prototype = {

    onDeleteDown: function () {

        var now = this.game.time.time;

        if (now < this._nextDelete)
        {
            return;
        }

        this._nextDelete = now + this.deleteRate;

        if (this.pendingInput === TTY.INPUT_STRING)
        {
            if (this.inputString.length > 0)
            {
                this.cursorBack();
                this.clearChar();
                this.inputString = this.inputString.substring(0, this.inputString.length - 1);
            }
        }

    },

    onEnterDown: function () {

        this.newline();

        if (this.pendingInput >= TTY.INPUT_STRING)
        {
            var callback = this.inputCallback;
            var context = this.inputCallbackContext;
            var str = this.inputString;

            this.resetInput();

            if (this.pendingInput === TTY.INPUT_INT)
            {
                str = parseInt(str, 10);
            }
            else if (this.pendingInput === TTY.INPUT_FLOAT)
            {
                str = parseFloat(str, 10);
            }

            callback.call(context, str);
        }

    },

    resetInput: function () {

        this.pendingInput = TTY.INPUT_NONE;

        this.inputString = '';
        this.inputCallback = null;
        this.inputCallbackContext = null;

    },

    keyPress: function (char) {

        // console.log('keyPress', char);

        if (this.pendingInput === TTY.INPUT_KEY)
        {
            //  Single key
            var callback = null;

            for (var key in this.validKeys)
            {
                if (key === char)
                {
                    callback = this.validKeys[key];
                    continue;
                }
            }

            if (callback)
            {
                this._renderString(char);

                var context = this.inputCallbackContext;

                this.resetInput();

                this.newline();

                callback.call(context, char);
            }
        }
        else if (this.pendingInput >= TTY.INPUT_STRING)
        {
            //  String + enter
            this.inputString = this.inputString.concat(char);

            // console.log('input string', this.inputString);

            this._renderString(char);
        }

    },

    //  String + enter activates the callback (backspace deletes)
    input: function (prompt, callback, callbackContext) {

        if (this.pendingInput !== TTY.INPUT_NONE)
        {
            return this;
        }

        if (prompt.length > 0)
        {
            prompt = prompt.concat(' ');
        }

        this._renderString(prompt);

        this.pendingInput = TTY.INPUT_STRING;

        this.inputString = '';

        this.inputCallback = callback;
        this.inputCallbackContext = callbackContext;

        return this;

    },

    inputInt: function (prompt, callback, callbackContext) {

        this.input(prompt, callback, callbackContext);

        if (this.pendingInput === TTY.INPUT_STRING)
        {
            this.pendingInput = TTY.INPUT_INT;
        }

        return this;

    },

    inputFloat: function (prompt, callback, callbackContext) {

        this.input(prompt, callback, callbackContext);

        if (this.pendingInput === TTY.INPUT_STRING)
        {
            this.pendingInput = TTY.INPUT_FLOAT;
        }

        return this;

    },

    //  Single key press, no enter, hooked to callback
    inkey: function (prompt, keys, callbacks, callbackContext, caseSensitive) {

        if (this.pendingInput !== TTY.INPUT_NONE)
        {
            return this;
        }

        if (caseSensitive === undefined) { caseSensitive = false; }

        if (prompt.length > 0)
        {
            prompt = prompt.concat(' ');
        }

        this._renderString(prompt);

        this.validKeys = {};

        //  tty.inkey('Buy (A)mmo or (G)uns?', ['a', 'g'], [this.buyAmmo, this.buyGuns], this, true);
        //  tty.inkey('Buy (A)mmo or (G)uns?', ['a', 'g'], this.buyItem, this, true);

        //  TODO: An empty array will accept ANY single key

        var singleCallback = null;

        if (!Array.isArray(callbacks))
        {
            singleCallback = callbacks;
        }

        for (var i = 0; i < keys.length; i++)
        {
            var key = keys[i];

            if (!caseSensitive)
            {
                this.validKeys[key.toUpperCase()] = (singleCallback) ? singleCallback : callbacks[i];
                this.validKeys[key.toLowerCase()] = (singleCallback) ? singleCallback : callbacks[i];
            }
            else
            {
                this.validKeys[key] = (singleCallback) ? singleCallback : callbacks[i];
            }
        }

        this.inputCallbackContext = callbackContext;

        this.pendingInput = TTY.INPUT_KEY;

        // console.log(this.validKeys);

        return this;

    },

    cls: function (ink, paper, fill) {

        this.back.clear();
        this.fore.clear();

        if (ink)
        {
            this.ink = ink;
        }

        if (paper)
        {
            this.paper = paper;
        }

        if (fill)
        {
            this.back.rect(0, 0, this.back.width, this.back.height, this.paper);
        }

        this.col = 0;
        this.row = 0;

        return this;

    },

    newline: function () {

        this._x = 0;

        if (this._y === this.height - 1)
        {
            //  cursor is on the bottom row already, so shift it all up
            this.back.moveV(-this.charHeight, false);
            this.fore.moveV(-this.charHeight, false);
        }
        else
        {
            this._y++;
        }

        this.updateCursor();

        return this;

    },

    pos: function (x, y) {

        if (this.pendingInput === TTY.INPUT_NONE)
        {
            this.col = x;
            this.row = y;
        }

        return this;

    },

    _renderString: function (str, x, y) {

        //  Won't work if input locked ...
        if (x !== undefined) { this.col = x; }
        if (y !== undefined) { this.row = y; }

        //  Split on \n
        var lines = str.split("\n");

        for (var i = 0; i < lines.length; i++)
        {
            var line = lines[i];

            for (var t = 0; t < line.length; t++)
            {
                //  We can optimise this to fill the whole strip, not every single character?
                if (this.paper !== '' && this.paper !== null)
                {
                    this.back.rect(this.x, this.y, this.charWidth, this.charHeight, this.paper);
                }

                var c = line.charCodeAt(t);

                if (c < 33 || c > 129)
                {
                    this.cursorForward();
                    continue;
                }
                else
                {
                    //  We can optimise this to fill the whole strip, not every single character?
                    this.fore.clear(this.x, this.y, this.charWidth, this.charHeight);

                    this.font.frame = c - 33;
                    this.fore.draw(this.font, this.x, this.y);

                    //  We can optimise this to fill the whole strip, not every single character?
                    if (this._ink !== '#ffffff')
                    {
                        this.fore.draw(this.textFill, this.x, this.y, this.charWidth, this.charHeight, 'source-atop');
                    }

                    this.cursorForward();
                }
            }

            if (i < lines.length && lines.length > 1)
            {
                this.newline();
            }
        }

    },

    clearChar: function () {

        this.fore.clear(this.x, this.y, this.charWidth, this.charHeight);

        if (this.paper !== '' && this.paper !== null)
        {
            this.back.rect(this.x, this.y, this.charWidth, this.charHeight, this.paper);
        }
        else
        {
            this.back.clear(this.x, this.y, this.charWidth, this.charHeight);
        }

        return this;

    },

    updateCursor: function () {

        this.cursor.x = this._x * this.charWidth;
        this.cursor.y = this._y * this.charHeight;

        return this;

    },

    cursorForward: function () {

        //  Should we wrap to the next line?
        if (this._x === this.width - 1)
        {
            this._x = 0;
            this._y++;
        }
        else
        {
            this._x++;
        }

        return this.updateCursor();

    },

    cursorBack: function () {

        if (this._x > 0)
        {
            this._x--;
        }
        else
        {
            //  Cursor is on the first column
            if (this.pendingInput === TTY.INPUT_STRING)
            {
                //  Wrap onto a previous line ONLY in string input mode
                this._y--;
                this._x = this.width - 1;
            }
        }

        return this.updateCursor();

    },

    print: function (str, ink, paper) {

        this.write(str, this.col, this.row, ink, paper);

        this.newline();

        return this;

    },

    printCR: function (str, ink, paper) {

        this.write(str, this.col, this.row, ink, paper);

        this.newline();
        this.newline();

        return this;

    },

    printAt: function (str, x, y, ink, paper) {

        this.write(str, x, y, ink, paper);

        this.newline();

        return this;

    },

    //  Prints out the text but doesn't add a newline after it
    write: function (str, x, y, ink, paper) {

        if (this.pendingInput !== TTY.INPUT_NONE)
        {
            //  Input locks the terminal from any further output
            return this;
        }

        if (str === undefined)
        {
            str = '';
        }

        if (ink)
        {
            this.ink = ink;
        }

        if (paper)
        {
            this.paper = paper;
        }

        this._renderString(str, x, y);

        return this;

    },

    test: function () {

        for (var y = 0; y < this.height; y++)
        {
            for (var x = 0; x < this.width; x++)
            {
                this.font.frame = this.game.rnd.between(0, 95);
                this.fore.draw(this.font, x * 16, y * 18);
            }
        }

        return this;

    }

};

Object.defineProperty(TTY.prototype, "ink", {

    get: function () {

        return this._ink;

    },

    set: function (value) {

        this._ink = value;
        this.textFill.rect(0, 0, this.textFill.width, this.textFill.height, value);
    }

});

Object.defineProperty(TTY.prototype, "x", {

    get: function () {

        return this._x * this.charWidth;

    },

    set: function (value) {

        //  Clamp it to the 'grid'

    }

});

Object.defineProperty(TTY.prototype, "y", {

    get: function () {

        return this._y * this.charHeight;

    },

    set: function (value) {

        //  Clamp it to the 'grid'

    }

});

Object.defineProperty(TTY.prototype, "blinkRate", {

    get: function () {

        return this._blinkRate;

    },

    set: function (value) {

        if (value !== this._blinkRate)
        {
            this._blinkRate = value;
            this._cursorTween.stop();
            this._cursorTween = this.game.add.tween(this.cursor).to( { alpha: 0.1 }, this._blinkRate, "Linear", true, 0, -1, true);
        }

    }

});

Object.defineProperty(TTY.prototype, "col", {

    get: function () {

        return this._x;

    },

    set: function (value) {

        if (this.pendingInput !== TTY.INPUT_NONE)
        {
            return;
        }

        if (value < 0)
        {
            value = 0;
        }
        else if (value > this.width)
        {
            value = this.width;
        }

        this._x = value;
        this.cursor.x = value * this.charWidth;

    }

});

Object.defineProperty(TTY.prototype, "row", {

    get: function () {

        return this._y;

    },

    set: function (value) {

        if (this.pendingInput !== TTY.INPUT_NONE)
        {
            return;
        }

        if (value < 0)
        {
            value = 0;
        }
        else if (value > this.height)
        {
            value = this.height;
        }

        this._y = value;
        this.cursor.y = value * this.charHeight;

    }

});
