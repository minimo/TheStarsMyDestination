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
        a.image.context.fillStyle = 'rgba(0,255,0,0.7)'
		a.image.context.fillRect(0,0,320,8);
        a.x = a.y = 0;
        a.startX = a.startY = 0;
        a.endX = a.endY = 0;
        a.opacity = 0;
        a.pointing = false;
        a.alphaBlending = 'lighter';
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
