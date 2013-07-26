/*

    The Stars My Destination
    わが赴くは星の大海

    Unit.js

	2013/07/10
	This program is MIT lisence.

*/

enchant();

//ユニット管理基本クラス
Unit = enchant.Class.create(enchant.Group, {
    initialize: function(parent, infoLayer) {
        enchant.Group.call(this);

        //スプライト
        var s = this.sprite = new Sprite(64,64);
        s.image = game.assets['assets/frigate1.png'];
        s.x = s.y = -32;
        s.frame = 0;
        this.addChild(s);
        this.width = s.width;
        this.height = s.height;

        //親シーン
        this.parent = parent;
        this.infoLayer = infoLayer;
        
        //ステータス
        this.hp = 10;  //体力
        this.ap = 1;    //攻撃力
        this.dp = 1;    //防御力
        this.speed = 1; //移動速度
        this.move = true;   //行動フラグ
        this.type = 0;
        this.using = true;
        this.id = -1;       //ユニットＩＤ
        this.groupID = -1;  //ユニットグループID
        
        //移動目標
        this.target = null; //移動目標
        this.targetX = 0;   //目標座標（ユニット以外の場合）
        this.targetY = 0;
        
        //移動情報
        this.fromX = 0; //起点（グリッド左上）
        this.fromY = 0;
        this.toX = 0;   //終点（グリッド左上）
        this.toY = 0;
        this.direction = 0;
        this.vx = 0;
        this.vy = 0;
        this.arrive = false;

        //攻撃情報
        this.attack = false;
        this.attackTarget = null;

        //ＨＰ表示        
        var d = this.dsp = new Label("");
        d.x = 0;
        d.y = 0;
        d.color = "#ffffff";
        d.font = "10px bold";
        d.parent = this;
        d.onenterframe = function() {
            this.x = this.parent.x+5;
            this.y = this.parent.y-12;
            this.text = ""+this.parent.hp;
        }
//        this.infoLayer.addChild(d);
        this.time = 0;
    },
    onenterframe: function() {
        if (this.type == TYPE_PLAYER) {
            this.dsp.color = "#aaaaff";
        }
        if (this.type == TYPE_ENEMY) {
            this.dsp.color = "#ffaaaa";
        }
        if (this.target && !this.target.using) {
            this.target = null;
            this.move = false;
        }

        //移動処理
        if (this.move) {
            this.x+=this.vx;
            this.y+=this.vy;
            var dis = distance(this, this.target);
            if (dis < 20) {
                this.attack = true;
                this.move = false;
                this.arrive = true;
            } else if (dis < 100) {  //攻撃開始
                this.attack = true;
            }
            if (this.type == this.target.type) {
                this.attack = false;
            }

            //ユニットの進行方向判定
            var tx = this.x+this.vx;
            var ty = this.y+this.vy;
            var rot = Math.atan2(ty-this.y,tx-this.x)*toDeg;
            if (rot < 0) {
                rot += 350;  //右から時計回りで３６０になる様にする
            } else {
                rot += 5;  //補正
            }
            this.frame = ~~(rot/10);
        }

        //近接攻撃処理
        if (this.attack && !this.arrive) {
            if (this.age % 10 == 0 && rand(100) > 70)this.beam(this.target);
        }

        //目標到着
        if (this.arrive) {
            this.arrival(this.target);
            this.using = false;
        }

        //死亡判定
        if (this.hp < 1) {
            this.dead();
            this.using = false;
        }
        this.time++;
    },
    onremoved: function() {
        this.infoLayer.removeChild(this.dsp);
    },
    //移動先座標指定
    setTo: function(x, y) {
        var gx = this.x;
        var gy = this.y;
        var tx = x;
        var ty = y;
        var d = Math.sqrt((tx-gx)*(tx-gx) + (ty-gy)*(ty-gy));
        if (d == 0)return;
        this.vx = (tx-gx)/d*this.speed;
        this.vy = (ty-gy)/d*this.speed;

        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = x;
        this.toY = y;
        this.target = null;
        this.move = true;
    },
    //移動目標設定
    setTarget: function(target) {
        var gx = this.x;
        var gy = this.y;
        var tx = target.x;
        var ty = target.y;
        var d = Math.sqrt((tx-gx)*(tx-gx) + (ty-gy)*(ty-gy));
        if (d == 0)return;
        this.vx = (tx-gx)/d*this.speed;
        this.vy = (ty-gy)/d*this.speed;

        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = target.x;
        this.toY = target.y;
        this.target = target;
        this.move = true;
    },
    //目標に到着
    arrival: function(target) {
        if (this.type == target.type) {
            target.hp += this.hp;
        } else {
            target.damage(this, this.hp);
            this.hp = 0;
        }
    },
    //攻撃エフェクト
    beam: function(target, power) {
        if (!target) return;
        power = power || 0;
        
        var from = {x:this.x+rand(20)-10, y:this.y+rand(20)-10};
        var to   = {x:target.x+rand(target.width)-target.width/2, y:target.y+rand(target.height)-target.height/2};
        var color = 'rgba(128, 128, 255, 1.0)';
        if (this.type == TYPE_ENEMY)color = 'rgba(255, 0, 0, 1.0)'
        var b = new Beam(from, to, color);
        this.parent.addChild(b);

        if (rand(100)>60)return;

        var e = new Sprite(32, 32);
        e.image = game.assets['assets/bomb.png'];
        e.frame = 0;
        e.x = to.x-16;
        e.y = to.y-16;
        e.delay = rand(5);
        e.onenterframe = function() {
            if (this.age < this.delay)return;
            if (this.age % 3 == 0) {
                this.frame++;
                if (this.frame == 8) {
                    this.remove();
                }
            }
        }
        this.parent.addChild(e);
//        target.damage(this, 1);
        target.hp -= power;
        this.hp -= power;
    },
    dead: function() {
        this.using = false;

        var e = new Sprite(32, 32);
        e.image = game.assets['assets/bomb.png'];
        e.frame = 0;
        e.x = this.x-16;
        e.y = this.y-16;
        e.onenterframe = function() {
            if (this.age % 3 == 0) {
                this.frame++;
                if (this.frame == 8) {
                    this.remove();
                }
            }
        }
        this.parentNode.addChild(e);

    },
    frame: {
        get: function() {
            return this.sprite.frame;
        },
        set: function(f) {
            this.sprite.frame = f;
        }
    },
    radius: {
        get: function() {
            return 32*this.scaleX;
        },
    },
});

