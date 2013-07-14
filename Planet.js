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
        p.x = p.y = -16;
        p.originX = p.originY = 0;  //拡縮の基準点を左上にする
        p.opacity = 0;
        this.addChild(p);

        //スプライト
        var s = this.sprite = new Sprite(64,64);
        s.image = game.assets['assets/planet_mono.png'];
        s.originX = s.originY = 0;  //拡縮の基準点を左上にする
        s.opacity = 0;
        this.addChild(s);

        //親シーン
        this.parent = parent;
        this.infoLayer = infoLayer;

        //ステータス
        this.main = false;                      //主星フラグ
        this.type = TYPE_NEUTRAL;
        this.rank = rand(10);                   //惑星規模
        this.hp = rand(50)+50+this.rank*5;      //防衛力
        this.pointing = false;                  //選択されてるフラグ
        
        //ＨＰ表示
        var d = this.dsp = new Label("");
		d.color = "#ffffff";
		d.font = "20px bold";
//        d.textAlign = 'center';
        d.parent = this;
        d.opacity = 0;
        d.onenterframe = function() {
            this.x = this.parent.x;
            this.y = this.parent.y;
            this.text = ""+this.parent.hp;
        }
        this.infoLayer.addChild(d);

        this.time = 0;
    },
    onenterframe: function() {
        if (this.time == 0) {
            this.scaleX = 0.5 + this.rank * 0.1;
            this.scaleY = 0.5 + this.rank * 0.1;
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
            this.pointer.opacity += 0.1;
            if (this.pointer.opacity > 1) {
                this.pointer.opacity = 1;
            }
        } else {
            this.pointer.opacity -= 0.1;
            if (this.pointer.opacity < 0) {
                this.pointer.opacity = 0;
            }
        }
        if (this.time % 30 == 0) {
            this.hp++;
        }
        if (this.type == TYPE_PLAYER) {
            this.sprite.image = game.assets['assets/planet.png'];
            this.dsp.color = "#aaaaff";
        }
        if (this.type == TYPE_ENEMY) {
            this.sprite.image = game.assets['assets/planet.png'];
            this.dsp.color = "#ffaaaa";
        }
        this.time++;
    },
    onremoved: function() {
        this.infoLayer.removeChild(this.dsp);
    },
    dead: function() {
    },
});
