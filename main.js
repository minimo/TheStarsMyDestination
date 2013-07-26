/*

    The Stars My Destination
    わが赴くは星の大海
    
    main.js

    2013/07/10
	This program is MIT lisence.

*/

enchant();

//マップ設定
var WORLD_SIZE = 320*3;        
var MAX_PLANETS = 20;


//惑星タイプ
var TYPE_NEUTRAL = 0;
var TYPE_PLAYER = 1;
var TYPE_ENEMY = 2;
var TYPE_PLANET = [1,2,3,5,6,7,8,9,11];

//実行環境情報
var userAgent = "";
var soundEnable = false;
var smartphone = false;


//乱数発生 0～max-1
var rand = function( max ){ return ~~(Math.random() * max); }
var toRad = 3.14159/180;    //弧度法toラジアン変換
var toDeg = 180 / 3.14159;    //ラジアンto弧度法変換
var distance = function(from, to) {
    var x = from.x - to.x, y = from.y - to.y;
    return Math.sqrt(x * x + y * y);
}


window.onload = function() {
    soundEnable = false;
    //実行ブラウザ取得
    if ((navigator.userAgent.indexOf('iPhone') > 0 && navigator.userAgent.indexOf('iPad') == -1) || navigator.userAgent.indexOf('iPod') > 0) {
        userAgent = "iOS";
        soundEnable = false;
        smartphone = true;
    } else if (navigator.userAgent.indexOf('Android') > 0) {
        userAgent = "Android";
        soundEnable = false;
        smartphone = true;
    } else if (navigator.userAgent.indexOf('Chrome') > 0) {
        userAgent = "Chrome";
        soundEnable = true;
        smartphone = false;
    } else if (navigator.userAgent.indexOf('Firefox') > 0) {
        userAgent = "Firefox";
        soundEnable = false;
        smartphone = false;
    } else if (navigator.userAgent.indexOf('Safari') > 0) {
        userAgent = "Safari";
        soundEnable = false;
        smartphone = false;
    } else if (navigator.userAgent.indexOf('IE') > 0) {
        userAgent = "IE";
        soundEnable = false;
        smartphone = false;
    } else {
        userAgent = "unknown";
        soundEnable = false;
        smartphone = false;
    }

    game = new Core(320, 320);
    game.fps = 30;
    game.preload(
        'assets/pointer.png', 'assets/icon0.png',
        'assets/planet.png', 'assets/planet_mono.png',
        'assets/frigate1.png',
        'assets/bomb.png','assets/effect.png',
        'assets/back.png'
    );
    if (soundEnable) {
        game.preload(
        );
    }

    //KeyBind
    game.keybind(90, "a");
    game.keybind(88, "b");
    
    game.onload = function() {
        world = new WorldScene();
        game.pushScene(world);

//        title = new TitleScene();
//        game.pushScene(title);
    };
    game.start();
};
