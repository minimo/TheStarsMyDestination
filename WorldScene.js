/*

    The Stars My Destination
    わが赴くは星の大海

    WorldScene.js

	2013/07/10
	This program is MIT lisence.

*/

enchant();

//操作モード
CONTROL_NOTHING = 0;    //操作してない
CONTROL_UNIT = 1;       //ユニット
CONTROL_PLANET = 2;     //惑星
CONTROL_MAP = 3;        //マップ
CONTROL_SLIDER1 = 4;    //派兵レート用スライダー
CONTROL_SLIDER2 = 5;    //マップ縮尺用スライダー
CONTROL_MAPSCALE = 6;   //マップピンチインアウト

//ゲーム管理クラス
WorldScene = enchant.Class.create(enchant.Scene, {
    initialize: function() {
        enchant.Scene.call(this);
        this.backgroundColor = 'rgb(0,0,0)';

        this.worldSize = WORLD_SIZE; //世界の一辺の長さ
        this.worldScale = 0.7;  //縮尺
        this.attackRate = 0.5;  //派兵レート

        //マルチタッチ制御
        this.multiTouch = new MultiTouch();
        this.addChild(this.multiTouch);

        //マップベース
        this.base = new Group();
        this.addChild(this.base);
        this.base.parent = this;
        this.base.scaleX = this.base.scaleY = this.worldScale;
        this.base.originX = this.base.originY = 0;  //拡縮の基準点を左上にする
        this.base.vx = this.base.vy = 0;    //慣性移動用
        this.base.onenterframe = function() {
            if (this.vx != 0 || this.vy != 0) {
                if (!this.parent.touch || this.parent.controlmode == CONTROL_PLANET || this.parent.controlmode == CONTROL_UNIT) {
                    this.x += this.vx;
                    this.y += this.vy;
                    this.vx *= 0.9;
                    this.vy *= 0.9;
                } else {
                    this.vx = 0;
                    this.vy = 0;
                }
            }
            this.scaleX = this.scaleY = this.parent.worldScale;
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
        this.unitID = 0;
        this.unitGroup = [];
        this.unitGroupID = 0;

        //マップ表示
        var m = this.map = new Sprite(64, 64);
        m.x = 320 - m.width;  //表示位置調整
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
            var rateW = this.width / this.worldSize / sc;      //全体マップと表示マップの比率
            var rateH = this.height / this.worldSize / sc;
            var s = this.image;
            s.context.clearRect(0, 0, this.width, this.height);
            s.context.fillStyle = 'rgba(64,64,64,0.7)'
            s.context.fillRect(0, 0, this.width, this.height);  //全体マップ枠
            s.context.fillStyle = 'rgba(128,128,128,0.7)'
            s.context.fillRect(~ ~(-this.base.x * rateW), ~ ~(-this.base.y * rateH), ~ ~(game.width * rateW), ~ ~(game.height * rateH));    //表示マップ枠
            //惑星位置表示
            for (var i = 0; i < this.planets.length; i++) {
                var p = this.planets[i];
                var x = ~ ~(p.x * rateW * sc);
                var y = ~ ~(p.y * rateH * sc);
                s.context.fillStyle = 'rgba(255,255,255,1)'
                if (p.type == TYPE_PLAYER) s.context.fillStyle = 'rgba(196,196,255,1)'
                if (p.type == TYPE_ENEMY) s.context.fillStyle = 'rgba(255,64,64,1)'
                s.context.fillRect(x, y, 2, 2);
            }
        }
        this.topLayer.addChild(this.map);

        //派兵レート変更スライダーバー
        var sl1 = this.slider1 = new Sliderbar(170, 295, 100, 20, 10, 90, 50);
        sl1.min = 10;
        sl1.max = 90;
        sl1.value = 50;
        this.topLayer.addChild(sl1);

        //派兵レート表示
        var rate = this.rate = new Label("50%");
        rate.x = 290;
        rate.y = 295;
        rate.color = "#aaaaff";
        rate.font = "20px bold";
        rate.parent = this;
        this.topLayer.addChild(rate);

        //拡大縮小スライダーバー
        var sl2 = this.slider2 = new Sliderbar(0, 160, 16, 120, 33, 200, 70);
        sl2.min = 33;
        sl2.max = 200;
        sl2.value = 70;
        this.topLayer.addChild(sl2);

        this.time = 0;
    },
    onenterframe: function() {
        if (game.input.up) this.base.vy += 2;
        if (game.input.down) this.base.vy -= 2;
        if (game.input.left) this.base.vx += 2;
        if (game.input.right) this.base.vx -= 2;

        if (game.input.a) {
            this.worldScale += 0.02;
            if (this.worldScale > 2) {
                this.worldScale = 2;
            } else {
                this.base.x -= this.worldSize * 0.01;
                this.base.y -= this.worldSize * 0.01;
            }
            this.slider2.value = this.worldScale * 100;
        }
        if (game.input.b) {
            this.worldScale -= 0.02;
            if (this.worldScale < 0.33) {
                this.worldScale = 0.33;
            } else {
                this.base.x += this.worldSize * 0.01;
                this.base.y += this.worldSize * 0.01;
            }
            this.slider2.value = this.worldScale * 100;
        }

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

        //マウス操作時
        if (this.controlmode == CONTROL_PLANET || this.controlmode == CONTROL_UNIT) {
            if (this.touchX < 10) this.base.vx += 1;
            if (this.touchX > 310) this.base.vx += -1;
            if (this.touchY < 10) this.base.vy += 1;
            if (this.touchY > 310) this.base.vy += -1;
        }

        //各種判定処理
        this.tickWorld();

        //ＣＰＵ思考
        this.think();

        //勝敗判定
        if (this.age % 30 * 5 == 0) {
            //惑星、ユニットが消滅したら敗北
            var numPl = 0, numEn = 0;
            for (var i = 0; i < MAX_PLANETS; i++) {
                if (this.planets[i].type == TYPE_PLAYER) numPl++;
                if (this.planets[i].type == TYPE_ENEMY) numEn++;
            }
            for (var i = 0, len = this.units.length; i < len; i++) {
                if (this.units[i].type == TYPE_PLAYER) numPl++;
                if (this.units[i].type == TYPE_ENEMY) numEn++;
            }
            //プレイヤー勝利
            if (numEn == 0) {
                //スコア計算
                var score = game.fps * 60 * 10 - this.age;
                var bonus = 0;
                for (var i = 0; i < MAX_PLANETS; i++) {
                    if (this.planets[i].type == TYPE_PLAYER) bonus += ~ ~(this.planets[i].hp / 20);
                }
                if (bonus > 5400) bonus = 5400;
                if (score < 1) score = 1;
                game.end(score + bonus, "WIN! SCORE:" + score + bonus);
            }

            //プレイヤー敗北
            if (numPl == 0) {
                game.end(0, "LOSE! ");
            }
        }

        this.time++;
    },
    tickWorld: function() {
        //ユニット生存判定
        var len = this.units.length - 1;
        for (var i = len; i >= 0; i--) {
            var u = this.units[i];
            if (!u.using || u.hp < 0) {
                this.units.splice(i, 1);
                this.unitLayer.removeChild(u);
            }
        }

        //惑星ー＞ユニット攻撃判定
        if (this.age % 20 == 0) {
            for (var i = 0, len = this.planets.length; i < len; i++) {
                var p = this.planets[i];
                var per = 30;
                if (p.type == TYPE_NEUTRAL) per = 80;
                if (rand(100) > 50) {
                    for (var j = 0, len2 = this.units.length; j < len2; j++) {
                        var u = this.units[j];
                        //自軍ユニットじゃない場合、近接したユニットに対して攻撃を行う
                        if (p.type != u.type) {
                            if (distance(p, u) < 100 && rand(100) > 80) p.beam(u);
                        }
                    }
                }
            }
        }

        //艦隊戦
        if (this.age % 20 == 0) {
            var len = this.units.length;
            for (var i = 0; i < len; i++) {
                var u1 = this.units[i];
                if (rand(100) > 90) continue;
                for (var j = 0; j < len; j++) {
                    if (rand(100) > 90) continue;
                    var u2 = this.units[j];
                    if (u1.type == u2.type) continue;
                    var dis = distance(u1, u2);
                    if (dis < 100) u1.beam(u2, 1);
                    break;
                }
            }
        }
    },
    //ＣＰＵ思考ルーチン
    think: function() {
        //５秒に１回思考する
        if (this.age % 30 * 5 != 0) return;

        //領土に一番近い惑星で自分の６割程度なら艦隊を派遣
        var len = this.planets.length;
        for (var i = 0; i < len; i++) {
            var p = this.planets[i];
            if (p.type != TYPE_ENEMY) continue;
            if (p.hp < 10) continue;
            var min = 9999;
            var target1 = null;
            var target2 = null;
            for (var j = 0; j < len; j++) {
                var e = this.planets[j];
                if (i == j || e.type == TYPE_ENEMY) continue;
                var dis = distance(p, e);
                if (dis < min) {
                    min = dis;
                    target1 = e;
                }
            }
            if (target1 && target1.hp < p.hp * 0.6) {
                var power = ~ ~(p.hp * 0.6);
                this.enterUnit(TYPE_ENEMY, p, target1, power);
                break;
            }
        }
    },
    //マップ構築
    createMap: function() {
        //マップの初期化
        this.clearMap();

        //プレイヤー主星
        var pm = new Planet(this, this.infoLayer);
        pm.id = 0;
        pm.x = 32;
        pm.y = 32 + 30;
        pm.hp = 400;
        pm.sprite.frame = 3;
        pm.type = TYPE_PLAYER;
        pm.main = true;
        pm.rank = 4;
        this.planets.push(pm);
        this.mapLayer.addChild(pm);

        //ＣＰＵ主星
        var pm = new Planet(this, this.infoLayer);
        pm.id = 1;
        pm.x = this.worldSize - 64;
        pm.y = this.worldSize - 64;
        pm.hp = 250;
        pm.sprite.frame = 5;
        pm.type = TYPE_ENEMY;
        pm.main = true;
        pm.rank = 4;
        this.planets.push(pm);
        this.mapLayer.addChild(pm);

        for (var i = 0; i < MAX_PLANETS; i++) {
            var p = new Planet(this, this.infoLayer);
            p.rank = rand(10) + 1;
            p.hp = rand(p.rank * 10) + 10;
            p.id = i + 2;
            p.sprite.frame = TYPE_PLANET[rand(9)];
            var loop = 0;
            while (loop < 30) {
                p.x = rand(this.worldSize - 64 * p.sprite.scaleX + 12) + 32;
                p.y = rand(this.worldSize - 64 * p.sprite.scaleY - 30) + 16 + 30;
                var d = 0;
                for (var i2 = 0; i2 < this.planets.length; i2++) {
                    var pl = this.planets[i2];
                    var x = p.x - pl.x;
                    var y = p.y - pl.y;
                    var dis = Math.sqrt(x * x + y * y);
                    if (dis < 100) d++;
                }
                if (d == 0) break;
                loop++;
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
            var sx = 32 * p.scaleX;
            var sy = 32 * p.scaleY;
            if (p.x - sx < x && x < p.x + sx && p.y - sx < y && y < p.y + sy) {
                return p;
            }
        }
        return null;
    },
    //指定座標にあるユニット取得
    checkMapUnit: function(x, y) {
        return null;
    },
    //ユニット投入
    enterUnit: function(type, from, to, power) {
        var num = ~ ~(power / 5);
        if (num == 0) return;

        var pow = ~ ~(power / num);
        for (var i = 0; i < num; i++) {
            var u = new Unit(this.unitLayer, this.infoLayer);
            var rad = rand(360) * toRad;
            var dis = rand(~ ~(num / 20) * 10) + 30;
            u.type = type;
            u.id = this.unitID;
            u.groupID = this.unitGroupID;
            u.x = from.x + Math.sin(rad) * dis;
            u.y = from.y + Math.cos(rad) * dis;
            u.hp = pow;
            u.setTarget(to);
            this.unitLayer.addChild(u);
            this.units.push(u);
            this.unitID++;
        }
        from.hp -= power;
        this.unitGroupID++;
    },
    //操作系
    /////////////////////////////////////////////////////////////////////
    controlmode: 0,
    touchX: 0,
    touchY: 0,
    beforeX: 0,
    beforeY: 0,
    touch: false,
    singleTouch: false,
    singletouchID: 0,
    targetFrom: null,
    targetTo: null,
    pinchDistance: 0,
    ontouchstart: function(e) {
        var id = this.multiTouch.start(e);
        if (this.multiTouch.numTouch() == 1) {
            //シングルタッチ
            this.singleTouch = true;
            this.singleTouchID = id;
            this.singleTouchStart(e);
        } else {
            this.multiTouchStart(e);
        }
    },
    ontouchmove: function(e) {
        var id = this.multiTouch.move(e);
        if (id == this.singleTouchID) {
            this.singleTouchMove(e);
        }
        if (this.controlmode == CONTROL_MAPSCALE) {
        }
    },
    ontouchend: function(e) {
        var id = this.multiTouch.end(e);
        if (id == this.singleTouchID) {
            this.singleTouchEnd(e);
        }
        if (this.multiTouch.numTouch == 0) this.controlmode = CONTROL_NOTHING;
    },

    //シングルタッチ対応
    /////////////////////////////////////////////////////////////////////
    singleTouchStart: function(e) {
        this.touch = true;
        this.touchX = e.x;
        this.touchY = e.y;

        //ＵＩのクリック判定
        //派兵レート
        if (this.slider1.ontouchstart(e)) {
            this.controlmode = CONTROL_SLIDER1;
            this.beforeX = e.x;
            this.beforeY = e.y;
            this.slider1.ontouchstart(e);
            return;
        }
        //拡大縮小
        if (this.slider2.ontouchstart(e)) {
            this.controlmode = CONTROL_SLIDER2;
            this.beforeX = e.x;
            this.beforeY = e.y;
            this.slider2.ontouchstart(e);
            return;
        }

        //ワールド座標上のクリック座標
        var wx = (-this.base.x + e.x) / this.worldScale;
        var wy = (-this.base.y + e.y) / this.worldScale;
        var p = this.checkMap(wx, wy);
        if (p !== null && p.type == TYPE_PLAYER) {
            //惑星操作
            var ax = p.x;
            var ay = p.y;
            this.controlmode = CONTROL_PLANET;
            this.arrow.start = { x: ax, y: ay };
            this.arrow.end = { x: ax, y: ay };
            this.arrow.pointing = true;
            p.pointing = true;
            this.targetFrom = p;
        } else {
            //ユニット操作
            var u = this.checkMapUnit(wx, wy);
            if (u !== null && u.type == TYPE_PLAYER) {
            } else {
                //マップ操作
                this.controlmode = CONTROL_MAP;
            }
        }
        this.beforeX = e.x;
        this.beforeY = e.y;
    },
    singleTouchMove: function(e) {
        this.touchX = e.x;
        this.touchY = e.y;

        //派兵レート変更
        if (this.controlmode == CONTROL_SLIDER1) {
            this.slider1.ontouchmove(e);
            this.attackRate = this.slider1.value / 100;
            this.rate.text = (this.attackRate * 100) + "%";
        }
        //拡大縮小変更
        if (this.controlmode == CONTROL_SLIDER2) {
            this.slider2.ontouchmove(e);
            this.worldScale = this.slider2.value / 100;
        }

        //惑星操作
        if (this.controlmode == CONTROL_PLANET) {
            var wx = (-this.base.x + e.x) / this.worldScale;
            var wy = (-this.base.y + e.y) / this.worldScale;
            this.arrow.end = { x: wx, y: wy };
            var p = this.checkMap(wx, wy);
            if (p != null && p.id != this.targetFrom.id) {
                var ax = p.x;
                var ay = p.y;
                this.targetTo = p;
                this.targetTo.pointing = true;
                this.arrow.end = { x: ax, y: ay };
            } else {
                if (this.targetTo) {
                    this.targetTo.pointing = false;
                    this.targetTo = null;
                }
            }
        }

        //マップ操作
        if (this.controlmode == CONTROL_MAP) {
            this.base.x += e.x - this.beforeX;
            this.base.y += e.y - this.beforeY;
            this.base.vx = e.x - this.beforeX;
            this.base.vy = e.y - this.beforeY;
        }

        this.beforeX = e.x;
        this.beforeY = e.y;
    },
    singleTouchEnd: function(e) {
        this.touchX = e.x;
        this.touchY = e.y;

        //派兵レート変更
        if (this.controlmode == CONTROL_SLIDER1) {
            if (this.slider1.ontouchend(e)) {
                this.attackRate = this.slider1.value / 100;
                this.rate.text = (this.attackRate * 100) + "%";
            }
        }
        //拡大縮小
        if (this.controlmode == CONTROL_SLIDER2) {
            if (this.slider2.ontouchend(e)) {
                this.worldScale = this.slider2.value / 100;
            }
        }

        //惑星操作
        if (this.controlmode == CONTROL_PLANET) {
            //始点と終点が設定されている場合、ユニットを投入
            if (this.targetFrom != null && this.targetTo != null) {
                var f = this.targetFrom;
                var t = this.targetTo;
                var p = ~ ~(f.hp * this.attackRate);
                if (f.hp > 10) this.enterUnit(TYPE_PLAYER, f, t, p);
            }
            this.arrow.pointing = false;
            if (this.targetFrom) this.targetFrom.pointing = false;
            if (this.targetTo) this.targetTo.pointing = false;
            this.targetFrom = null;
            this.targetTo = null;
        }

        //マップ操作
        if (this.controlmode == CONTROL_MAP) {
            this.base.x += e.x - this.beforeX;
            this.base.y += e.y - this.beforeY;
            this.base.vx += e.x - this.beforeX;
            this.base.vy += e.y - this.beforeY;
        }

        this.touch = false;
        this.beforeX = e.x;
        this.beforeY = e.y;
        this.controlmode = CONTROL_NOTHING;
    },

    //マルチタッチ対応
    /////////////////////////////////////////////////////////////////////
    multiTouchStart: function(e) {
        //マルチタッチ（２つ）
        if (this.controlmode == CONTROL_MAP) {
            //マップ操作時のマルチタッチは拡大縮小になる
            this.controlmode == CONTROL_MAPSCALE;
        }
    },
    multiTouchMove: function(e) {
    },
    multiTouchEnd: function(e) {
    },
});


