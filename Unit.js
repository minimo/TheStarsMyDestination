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

        this.scaleX = this.scaleY = 0.5;
        
        //スプライト
        var s = this.sprite = new Sprite(64,64);
        s.image = game.assets['assets/frigate1.png'];
        s.x = s.y = -32;
        s.frame = 0;
        this.addChild(s);

        //親シーン
        this.parent = parent;
        this.infoLayer = infoLayer;
        
        //ステータス
        this.hp = 10;  //体力
        this.ap = 1;    //攻撃力
        this.dp = 1;    //防御力
        this.speed = 2; //移動速度
        this.move = true;   //行動フラグ
        this.type = 0;
        this.using = true;
        this.id = -1;   //ユニットＩＤ
        
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
                this.attackTarget = this.target;
                this.move = false;
                this.arrive = true;
            } else if (dis < 50) {  //距離５０で攻撃開始
                this.attackTarget = this.target;
            }

            //ユニットの進行方向判定
            var tx = this.x+this.vx;
            var ty = this.y+this.vy;
            var rot = Math.atan2(ty-this.y,tx-this.x)*toDeg;

            if ( -23 <  rot && rot <   23   ) this.frame = 2;  //右
            if (  23 <= rot && rot <   23+45) this.frame = 1;  //右下
            if (  68 <= rot && rot <   68+45) this.frame = 0;  //下
            if ( 113 <= rot && rot <  113+45) this.frame = 7;  //左下
            if ( 158 <= rot || rot <=-158   ) this.frame = 6;  //左
            if ( -23 >= rot && rot >  -23-45) this.frame = 3;  //右上
            if ( -68 >= rot && rot >  -68-45) this.frame = 4;  //上
            if (-158 >= rot && rot > -113-45) this.frame = 5;  //左上
        }

        //近接攻撃処理
        if (this.attackTarget && !this.arrive) {
            if (this.age % 5 ==0)
            this.beam(this.attackTarget);
//            if (soundEnable) game.assets['media/se_attacksword_4.mp3'].clone().play();
        }

        //目標到着
        if (this.attackTarget && this.arrive) {
            this.parent.removeChild(this);
        }

        //死亡判定
        if (this.hp < 1) {
            this.dead();
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
    //ビーム出す
    beam: function(target) {
        if (!target) return;

        //爆発
        var ex = Sprite(64,64);
        ex.image = game.assets['assets/bomb.png'];
        ex.x = target.x+rand(30);
        ex.y = target.y+rand(30);
        ex.frame = 0;
        ex.onenterframe = function(){
            if (this.age % 3 == 0) {
                this.frame++;
                if (this.frame == 8)this.parentNode.removeChild(this);
            }
        }
        this.addChild(ex);
/*
        var b = Sprite(1,1);
        var s = b.sprite = new Surface(1,1);
        s.context.fillStyle = 'rgba(128,255,128,1)'
		s.context.fillRect(0, 0, 1, 1);
		b.parent = this.parent;
		b.onenterframe = function() {
		    if (this.age > 30) this.parent.removeChild(this);
		}
		this.parent.addChild(b);
*/
    },
    dead: function() {
        this.using = false;
        this.parent.removeChild(this);

        var e = new Sprite(32, 48);
        e.image = game.assets['assets/effect.png'];
        e.frame = 0;
        e.x = this.x;
        e.y = this.y;
        e.parent = this.parent;
        e.onenterframe = function() {
            if (this.age % 3 == 0) {
                this.frame++;
                if (this.frame == 8) {
                    this.parent.removeChild(this);
                }
            }
        }
        this.parent.addChild(e);
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
