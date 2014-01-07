/*

    The Stars My Destination
    わが赴くは星の大海

    Planet.js

    2013/07/10
    This program is MIT lisence.

*/

enchant();

//拠点管理クラス
Planet = enchant.Class.create(enchant.Group, {
    initialize: function(parent, infoLayer) {
        enchant.Group.call(this);

        this.id = -1;        
        this.pointing = false;

        //ポインタ
        var p = this.pointer = new Sprite(96, 96);
        p.image = new Surface(96, 96);
        p.image.context.beginPath();
        p.image.context.fillStyle = 'rgba(64, 255, 64, 0.5)'
        p.image.globalCompositeOperation = "lighter";
        p.image.context.arc(48, 48, 38, 0, Math.PI*2, true);
        p.image.context.fill();
        p.image.context.beginPath();
        p.image.context.fillStyle = 'rgba(0, 0, 0, 1.0)'
        p.image.context.arc(48, 48, 32, 0, Math.PI*2, true);
        p.image.context.fill();
        p.x = p.y = -48;
        p.opacity = 0;
        p.compositeOperation = 'lighter';
        this.addChild(p);

        //スプライト
        var s = this.sprite = new Sprite(64,64);
        s.image = game.assets['assets/planet_mono.png'];
        s.x = s.y = -32;
        s.opacity = 0;
        this.addChild(s);
        this.width = s.width;
        this.height = s.height;

        //親シーン
        this.parent = parent;
        this.infoLayer = infoLayer;

        //ステータス
        this.main = false;          //主星フラグ
        this.type = TYPE_NEUTRAL;
        this.rank = 1               //惑星規模
        this.hp = 100;              //防衛力
        this.pointing = false;      //選択されてるフラグ
        this.using = true;
        this.change = true;         //ステータス変更フラグ
        this.enemyattack = false;   //ＣＰＵ攻撃済みフラグ

        //ＨＰ表示
        var d = this.dsp = new Label("");
		d.color = "#ffffff";
		d.font = "30px bold";
		d.textAlign = 'center';
        d.parent = this;
        d.opacity = 0;
        d.onenterframe = function() {
//            var col = Math.LOG10E * Math.log(this.parent.hp)+1; //耐久力の桁数
            this.x = this.parent.x-this.width/2;
            this.y = this.parent.y-16-40;
            this.text = ""+this.parent.hp;
        }
        this.infoLayer.addChild(d);

        this.time = 0;
    },
    onenterframe: function() {
        if (this.time == 0) {
//            this.scaleX = 0.5 + this.rank * 0.1;
//            this.scaleY = 0.5 + this.rank * 0.1;
            this.center = {x: 64*this.sprite.scaleX, y: 64*this.sprite.scaleY};
        } else {
            this.sprite.opacity += 0.1;
            this.dsp.opacity += 0.1;
            if (this.sprite.opacity > 1) {
                this.sprite.opacity = 1;
                this.dsp.opacity = 1;
            }
        }
        if (this.pointing) {
            this.pointer.opacity += 0.2;
            if (this.pointer.opacity > 1) {
                this.pointer.opacity = 1;
            }
        } else {
            this.pointer.opacity -= 0.2;
            if (this.pointer.opacity < 0.0) {
                this.pointer.opacity = 0.0;
            }
        }
        if (this.type == TYPE_PLAYER) {
            if (this.time % 30 == 0)this.hp++;
            if (this.change) {
                this.sprite.image = game.assets['assets/planet.png'];
                this.dsp.color = "#8888ff";
                this.change = false;
            }
        }
        if (this.type == TYPE_ENEMY) {
            if (this.time % 50 == 0)this.hp++;
            if (this.change) {
                this.sprite.image = game.assets['assets/planet.png'];
                this.dsp.color = "#ffaaaa";
                this.change = false;
            }
        }
        this.time++;
    },
    onremoved: function() {
        this.infoLayer.removeChild(this.dsp);
    },
    //攻撃エフェクト
    beam: function(target) {
        if (!target) return;
        
        var from = {x:this.x+rand(this.radius)-this.radius/2, y:this.y+rand(this.radius)-this.radius/2};
        var to   = {x:target.x+rand(20)-10, y:target.y+rand(20)-10};
        var color = 'rgba(128, 128, 255, 1.0)';
        if (this.type == TYPE_ENEMY)color = 'rgba(255, 0, 0, 1.0)'
        if (this.type == TYPE_NEUTRAL)color = 'rgba(255, 255, 255, 1.0)'
        var b = new Beam(from, to, color);
        this.parentNode.addChild(b);

        if (rand(100)>90)return;

        var e = new Explode(to.x, to.y);
        this.parentNode.addChild(e);

        target.hp--;
    },
    damage: function(from, pow) {
        this.hp -= pow;
        if (this.hp < 0){
            this.hp*=-1;
            this.type = from.type;
            this.change = true;
        }
    },
    dead: function() {
    },
    //直径の取得
    radius: {
        get: function() {
            return 32*this.scaleX;
        },
    },
});
