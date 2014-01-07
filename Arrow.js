/*

    The Stars My Destination
    わが赴くは星の大海

    Arrow.js

	2013/07/10
	This program is MIT lisence.

*/

enchant();

//矢印
Arrow = enchant.Class.create(enchant.Group, {
    initialize: function() {
        enchant.Group.call(this);
        this.start = {x:0, y:0};
        this.end = {x:0, y:0};
        this.pointing = false;

        var a = this.body = new Sprite(320,8);
        a.image = new Surface(320,16);
        a.compositeOperation = 'lighter';
        a.image.context.fillStyle = 'rgba(0,255,0,0.7)'
		a.image.context.fillRect(0,0,320,8);
        a.x = a.y = 0;
        a.startX = a.startY = 0;
        a.endX = a.endY = 0;
        a.opacity = 0;
        a.pointing = false;
        a.onenterframe = function() {
            if (this.pointing) {
                this.opacity += 0.1;
                if (this.opacity > 1) this.opacity = 1;
                var sx = this.startX;
                var sy = this.startY;
                var ex = this.endX;
                var ey = this.endY;
                this.x = sx*0.5+ex*0.5-160; //中間点
                this.y = sy*0.5+ey*0.5-4;
                var dx = ex-sx;
                var dy = ey-sy;
                this.rotation = Math.atan2(dy, dx)*toDeg;   //二点間の角度
                this.scaleX = -Math.sqrt(dx*dx+dy*dy)/320;
            } else {
                this.opacity -= 0.1;
                if (this.opacity < 0) this.opacity = 0;
            }
        }
        this.addChild(this.body);

        this.time = 0;
    },
    onenterframe: function() {
        this.body.pointing = this.pointing;
        this.body.startX = this.start.x;
        this.body.startY = this.start.y;
        this.body.endX = this.end.x;
        this.body.endY = this.end.y;
        this.time++;
    },
});

//ビーム
Beam = enchant.Class.create(enchant.Group, {
    initialize: function(start, end, color) {
        enchant.Group.call(this);

        var a = this.body = new Sprite(1,2);
        a.image = new Surface(1,2);
        a.compositeOperation = 'lighter';
        a.image.context.fillStyle = color
		a.image.context.fillRect(0,0,1,2);
        a.startX = start.x;
        a.startY = start.y;
        a.endX = end.x;
        a.endY = end.y;
        a.pointing = true;
        a.x = a.startX*0.5+a.endX*0.5; //中間点
        a.y = a.startY*0.5+a.endY*0.5-1;
        var dx = a.endX-a.startX;
        var dy = a.endY-a.startY;
        a.rotation = Math.atan2(dy, dx)*toDeg;   //二点間の角度
        a.scaleX = -Math.sqrt(dx*dx+dy*dy)///320;
        a.onenterframe = function() {
            this.opacity -= 0.2;
        }
        this.addChild(this.body);

        this.time = 0;
    },
    onenterframe: function() {
        if (this.body.opacity < 0)this.remove();
    },
});


//爆発
Explode = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y) {
        enchant.Sprite.call(this, 32, 32);
        this.image = game.assets['assets/bomb.png'];
        this.frame = 0;
        this.x = x-16;
        this.y = y-16;
        this.delay = rand(5);
        this.visible = false;
        this.addEventListener("enterframe", this.update);
    },
    update: function(e) {
        if (this.age < this.delay)return;
        this.visible = true;
        if (this.age % 3 == 0) {
            if (this.age > 10)this.opacity -= 0.2;
            this.frame++;
            if (this.frame > 7) {
                this.visible = false;
                this.remove();
            }
        }
        if (this.opacity < 0)this.remove();
        if (this.age > 30) {
            this.visible = false;
            this.remove();
        }
    },
});

//スライダーバー
Sliderbar = enchant.Class.create(enchant.Group, {
    initialize: function(x, y, width, height, min, max, value) {
        enchant.Group.call(this);
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this._min = min;
        this._max = max;
        this._value = value;
        this.beforeValue = this._value;

        //横か縦か
        this.horizontal = true; //横フラグ
        this.radius = height;
        if (width < height) {
            this.horizontal = false;
            this.radius = width;
        }

        //スライダー下側
        var w, h, sx, sy;
        if (this.horizontal) {
            w = width;
            h = ~~(height/4);
            sx = 0;
            sy = h+~~(h/2);
        } else {
            w = ~~(width/4);
            h = height;
            sx = w+~~(w/2);
            sy = 0;
        }
        var u = this.under = new Sprite(w, h);
        u.x = sx;
        u.y = sy;
        u.image = new Surface(w, h);
        u.image.context.fillStyle = 'rgba(255, 255, 255, 0.5)'
		u.image.context.fillRect(0, 0, w, h);
		this.addChild(u);

        //スライダー上側
        var r = (this.horizontal)? height: width;
        var s = this.upper = new Group();
        s.sprite = new Sprite(r, r);
        s.x = 0;
        s.y = 0;
        s.sprite.image = new Surface(r, r);
        s.sprite.image.context.beginPath();
        s.sprite.image.context.fillStyle = 'rgba(200, 200, 200, 1.0)'
        s.sprite.image.context.arc(r/2, r/2, r/2, 0, Math.PI*2, true);
        s.sprite.image.context.fill();
        s.addChild(s.sprite);
        if (this.horizontal) {
            s.sprite.x = -height/2;
        } else {
            s.sprite.y = -width/2;
        }
		this.addChild(s);

		//変更フラグ
		this.change = true;
		this.start = 0;
    },
    onenterframe: function() {
        if (this.change) {
            this.change = false;
        }
    },
    ontouchstart: function(e) {
        if (this.x-10 < e.x && e.x < this.x+this.width+10 && this.y-10 < e.y && e.y < this.y+this.height+10) {
            if (this.horizontal) {
                this.start = this.upper.x;
                this.upper.x = e.x-this.x;
                if (this.upper.x < 0)this.upper.x = 0;
                if (this.upper.x > this.width)this.upper.x = this.width;
            } else {
                this.start = this.upper.y;
                this.upper.y = e.y-this.y;
                if (this.upper.y < 0)this.upper.y = 0;
                if (this.upper.y > this.height)this.upper.y = this.height;
            }
            return true;
        }
        return false;
    },
    ontouchmove: function(e) {
        if (this.horizontal) {
            this.upper.x = e.x-this.x;
            if (this.upper.x < 0)this.upper.x = 0;
            if (this.upper.x > this.width)this.upper.x = this.width;
            this._value = ~~( (this.upper.x/this.width)*(this._max-this._min)+this._min);
        } else {
            this.upper.y = e.y-this.y;
            if (this.upper.y < 0)this.upper.y = 0;
            if (this.upper.y > this.height)this.upper.y = this.height;
            this._value = ~~( (this.upper.y/this.height)*(this._max-this._min)+this._min);
        }
        return true;
    },
    ontouchend: function(e) {
        if (this.horizontal) {
            this.upper.x = e.x-this.x;
            if (this.upper.x < 0)this.upper.x = 0;
            if (this.upper.x > this.width)this.upper.x = this.width;
            this._value = ~~( (this.upper.x/this.width)*(this._max-this._min)+this._min);
        } else {
            this.upper.y = e.y-this.y;
            if (this.upper.y < 0)this.upper.y = 0;
            if (this.upper.y > this.height)this.upper.y = this.height;
            this._value = ~~( (this.upper.y/this.height)*(this._max-this._min)+this._min);
        }
        return true;
    },
    min: {
        get: function() {
            return this._min;
        },
        set: function(v) {
            this._min = v;
            if (0 > this._min)this._min = 0;
            if (this._min > this._max)this._min = this._max-1;
    		this.change = true;
        }
    },
    max: {
        get: function() {
            return this._max;
        },
        set: function(v) {
            this._max = v;
            if (this._max < 1) this._max = 1;
            if (this._max < this._min)this._max = this._min+1;
    		this.change = true;
        }
    },
    value: {
        get: function() {
            return this._value;
        },
        set: function(v) {
            this.beforeValue = this._value;
            this._value = v;
            if (this._max < v)this._value = this._max;
            if (this._min > v)this._value = this._min;
            var scale = this._max-this._min;
            if (this.horizontal) {
                var one = this.width/scale;
                this.upper.x = (this._value-this._min)*one-this.radius/2;
            } else {
                var one = this.height/scale;
                this.upper.y = (this._value-this._min)*one-this.radius/2;
            }
    		this.change = true;
        }
    },
});

