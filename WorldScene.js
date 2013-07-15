/*

    The Stars My Destination
    わが赴くは星の大海

    WorldScene.js

	2013/07/10
	This program is MIT lisence.

*/

enchant();

//ゲーム管理クラス
WorldScene = enchant.Class.create(enchant.Scene, {
    initialize: function() {
        enchant.Scene.call(this);
        this.backgroundColor = 'rgb(0,0,0)';

        this.worldSize = 320*4; //世界の一辺の長さ
        this.worldScale = 0.5;  //縮尺
        this.attackRate = 0.5;  //派兵レート

        //マルチタッチ制御
        this.multiTouch = new MultiTouch();

        //マップベース
        this.base = new Group();
        this.addChild(this.base);
        this.base.scaleX = this.base.scaleY = this.worldScale;
        this.base.originX = this.base.originY = 0;  //拡縮の基準点を左上にする
        this.base.vx = this.base.vy = 0;
        this.base.onenterframe = function() {
            if (this.vx != 0 || this.vy != 0) {
                this.x += this.vx;
                this.y += this.vy;
                this.vx *= 0.9;
                this.vy *= 0.9;
            }
        }

        //バックグラウンド
        var b = this.back = new Sprite(this.worldSize, this.worldSize);
        b.image = game.assets['assets/back.png'];
        this.base.addChild(b);

        //表示レイヤー用グループ
        this.mapLayer = new Group();    //マップ用レイヤ
        this.unitLayer = new Group();   //ユニット用レイヤ
        this.arrowLayer = new Group();  //矢印用レイヤ
        this.infoLayer = new Group();   //情報表示用レイヤ
        this.topLayer = new Group();    //最前面レイヤ
        this.base.addChild(this.mapLayer);
        this.base.addChild(this.unitLayer);
        this.base.addChild(this.arrowLayer);
        this.base.addChild(this.infoLayer);
        this.addChild(this.topLayer);

        //矢印
        this.arrow = new Arrow();
        this.arrowLayer.addChild(this.arrow);

        //マップ用配列
        this.planets = [];
        //マップ構築
        this.createMap();
        
        //ユニット用配列
        this.units = [];

        //マップ表示
        var m = this.map = new Sprite(64,64);
        m.x = 320-m.width;  //表示位置調整
        m.y = 0;
        m.base = this.base;
        m.planets = this.planets;
        m.worldSize = this.worldSize;
        m.parent = this;
        var s = m.image = new Surface(m.width, m.height);
        s.context.fillStyle = 'rgba(128,128,128,0.5)'
		s.context.fillRect(0, 0, m.width, m.height);
        m.onenterframe = function() {
            var sc = this.parent.worldScale;
            var rateW = this.width/this.worldSize/sc;      //全体マップと表示マップの比率
            var rateH = this.height/this.worldSize/sc;
            var s = this.image;
            s.context.clearRect(0, 0, this.width, this.height);
            s.context.fillStyle = 'rgba(64,64,64,0.7)'
    	    s.context.fillRect(0, 0, this.width, this.height);  //全体マップ枠
            s.context.fillStyle = 'rgba(128,128,128,0.7)'
            s.context.fillRect(~~(-this.base.x*rateW), ~~(-this.base.y*rateH), ~~(game.width*rateW), ~~(game.height*rateH));    //表示マップ枠
            //惑星位置表示
    	    for (var i = 0; i < this.planets.length; i++) {
    	        var p = this.planets[i];
    	        var x = ~~(p.x*rateW*sc);
    	        var y = ~~(p.y*rateH*sc);
                s.context.fillStyle = 'rgba(255,255,255,1)'
                if (p.type == TYPE_PLAYER)s.context.fillStyle = 'rgba(196,196,255,1)'
                if (p.type == TYPE_ENEMY)s.context.fillStyle = 'rgba(255,64,64,1)'
                s.context.fillRect(x, y, 2, 2);
    	    }
        }
        this.topLayer.addChild(this.map);

        this.time = 0;
    },
    onenterframe: function() {
        if (game.input.up) this.base.vy+=2;
        if (game.input.down) this.base.vy-=2;
        if (game.input.left) this.base.vx+=2;
        if (game.input.right) this.base.vx-=2;

        if (this.base.x > 0) {
            this.base.x = 0;
            this.base.vx = 0;
        }
        if (this.base.y > 0) {
            this.base.y = 0;
            this.base.vy = 0;
        }
        if (this.base.x < -this.worldSize * this.worldScale + game.width) {
            this.base.x = -this.worldSize * this.worldScale + game.width;
            this.base.vx = 0;
        }
        if (this.base.y < -this.worldSize * this.worldScale + game.height) {
            this.base.y = -this.worldSize * this.worldScale + game.height;
            this.base.vy = 0;
        }

        this.think();

        this.time++;
    },
    //ＣＰＵ思考ルーチン
    think: function() {
    },
    //マップ構築
    createMap: function() {
        this.clearMap();
        //プレイヤー主星
        var pm = new Planet(this, this.infoLayer);
        pm.id = 0;
        pm.x = 32;
        pm.y = 32;
        pm.hp = 200;
        pm.sprite.frame = 3;
        pm.type = TYPE_PLAYER;
        pm.main = true;
        pm.rank = 4;
        this.planets.push(pm);
        this.mapLayer.addChild(pm);

        //ＣＰＵ主星
        var pm = new Planet(this, this.infoLayer);
        pm.id = 1;
        pm.x = this.worldSize-64;
        pm.y = this.worldSize-64;
        pm.hp = 200;
        pm.sprite.frame = 5;
        pm.type = TYPE_ENEMY;
        pm.main = true;
        pm.rank = 4;
        this.planets.push(pm);
        this.mapLayer.addChild(pm);

        for (var i = 0; i < MAX_PLANETS; i++) {
            var p = new Planet(this, this.infoLayer);
            p.id = i+2;
            p.sprite.frame = rand(10)+1;
            p.x = rand(this.worldSize-64*p.sprite.scaleX+12)+16;
            p.y = rand(this.worldSize-64*p.sprite.scaleY+12)+16;
            for (var i2 = 0; i2 < this.planets.length; i2++) {
                var pl = this.planets[i2];
                var x = p.x - pl.x;
                var y = p.y - pl.y;
                var dis = Math.sqrt(x * x + y * y);
                if (dis < 150){
                    p.x = rand(this.worldSize-48)+16;
                    p.y = rand(this.worldSize-48)+16;
                    i2 = 0;
                    continue;
                }
            }
            this.planets.push(p);
            this.mapLayer.addChild(p);
        }

    },
    //マップの全クリア
    clearMap: function() {
        var len = this.planets.length;
        for (var i = 0; i < len; i++) {
            var p = this.planets[i];
            this.removeChild(p);
        }
        this.planets = [];
    },
    //指定座標にあるマップオブジェクト取得
    checkMap: function(x, y) {
        for (var i = 0; i < this.planets.length; i++) {
            var p = this.planets[i];
            var sx = 64*p.scaleX;
            var sy = 64*p.scaleY;
            if (p.x < x && x < p.x+sx && p.y < y && y < p.y+sy) {
                return p;
            }
        }
        return null;
    },
    //ユニット投入
    enterUnit: function(type, from, to, power) {
        var u = new Unit(this, this.infoLayer);
        u.x = from.x;
        u.y = from.y;
        this.addChild(u);
    },
    //操作系
    touchX: 0,
    touchY: 0,
    touch: false,
    touchID: 0,
    pointing: false,
    targetFrom: null,
    targetTo: null,
    mapMoving: false,
    ontouchstart: function(e) {
        this.multiTouch.touchStart(e);
        if (this.pointing) return;
        this.touch = true;

        //ワールド座標上のクリック座標
        var wx = (-this.base.x+e.x)/this.worldScale;
        var wy = (-this.base.y+e.y)/this.worldScale;
        var p = this.checkMap(wx, wy);
        if (p !== null) {
            var ax = p.x+32*p.scaleX;
            var ay = p.y+32*p.scaleY;
            this.pointing = true;
            this.arrow.start = {x: ax, y: ay};
            this.arrow.end = {x: ax, y: ay};
            this.arrow.pointing = true;
            p.pointing = true;
            this.targetFrom = p;
        } else {
            this.pointing = false;
            this.touchX = e.x;
            this.touchY = e.y;
            return;
        }
    },
    ontouchmove: function(e) {
        this.multiTouch.touchMove(e);

        if (this.pointing) {
            var wx = (-this.base.x+e.x)/this.worldScale;
            var wy = (-this.base.y+e.y)/this.worldScale;
            this.arrow.end = {x: wx, y: wy};
            var p = this.checkMap(wx, wy);
            if (p != null && p.id != this.targetFrom.id) {
                var ax = p.x+32*p.scaleX;
                var ay = p.y+32*p.scaleY;
                this.targetTo = p;
                this.targetTo.pointing = true;
                this.arrow.end = {x: ax, y: ay};
            } else {
                if (this.targetTo) {
                    this.targetTo.pointing = false;
                    this.targetTo = null;
                }
            }
            if (e.x < 10)  game.input.left = true; else game.input.left = false;
            if (e.x > 310) game.input.right = true; else game.input.right = false;
            if (e.y < 10)  game.input.up = true; else game.input.up = false;
            if (e.y > 310) game.input.down = true; else game.input.down = false;
        } else {
            this.mapMoving = true;
            this.base.x += e.x - this.touchX;
            this.base.y += e.y - this.touchY;
            this.base.vx = e.x - this.touchX;
            this.base.vy = e.y - this.touchY;
            this.touchX = e.x;
            this.touchY = e.y;
        }
    },
    ontouchend: function(e) {
        this.multiTouch.touchEnd(e);

        if (this.pointing) {
            var wx = (-this.base.x+e.x)/this.worldScale;
            var wy = (-this.base.y+e.y)/this.worldScale;
            this.arrow.end = {x: wx, y: wy};
            var p = this.checkMap(wx, wy);
            if (p != null && p.id != this.targetFrom.id) {
                var ax = p.x+32*p.scaleX;
                var ay = p.y+32*p.scaleY;
                this.targetTo = p;
                this.targetTo.pointing = true;
                this.arrow.end = {x: ax, y: ay};
            } else {
                if (this.targetTo) {
                    this.targetTo.pointing = false;
                    this.targetTo = null;
                }
            }

            //始点と終点が設定されている場合、ユニットを投入
            if (this.targetFrom != null && this.targetTo != null) {
                var f = this.targetFrom;
                var t = this.targetTo;
                var p = ~~(f.hp*this.attackRate);
                f.hp -= p;
                this.enterUnit(f, t, p);
            }

            this.arrow.pointing = false;
            this.pointing = false;
            if (this.targetFrom) this.targetFrom.pointing = false;
            if (this.targetTo) this.targetTo.pointing = false;
            this.targetFrom = null;
            this.targetTo = null;
        } else {
            this.mapMoving = false;
            this.base.x += e.x - this.touchX;
            this.base.y += e.y - this.touchY;
            this.base.vx += e.x - this.touchX;
            this.base.vy += e.y - this.touchY;
            this.touchX = e.x;
            this.touchY = e.y;
        }
        this.touch = false;
    },
});
