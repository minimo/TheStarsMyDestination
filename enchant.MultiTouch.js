/*

    MultiTouch.js
    enchant.js用マルチタッチ制御クラス
    2013/07/12
    This program is MIT lisence.

*/

enchant();

enchant.MultiTouch = enchant.Class.create(enchant.Group, {
    initialize: function(parent, infoLayer) {
        enchant.Group.call(this);

        this.touchID = 0;       //タッチＩＤ
        this.touchList = [];    //タッチ内容保存

        //マルチタッチ対応フラグ
        this.enable = false;

        //iOSとAndroid以外はシングルタッチとして動作
        if ((navigator.userAgent.indexOf('iPhone') > 0 && navigator.userAgent.indexOf('iPad') == -1) || navigator.userAgent.indexOf('iPod') > 0) {
            this.enable = true;
        } else if (navigator.userAgent.indexOf('Android') > 0) {
            this.enable = true;
        }
    },
    onenterframe: function() {
        for (var i = 0, len = this.touchList.length; i < len; i++) {
            this.touchList[i].time++;
        }
    },
    start: function(e) {
        if (this.enable) {
            var id = this.touchID;
            this.touchList.push({ id: this.touchID, x: e.x, y: e.y, time:0 });
            this.touchID++;
            return id;
        } else {
            this.touchList[0] = { id: this.touchID, x: e.x, y: e.y, time:0 };
            return 0;
        }
    },
    move: function(e) {
        if (this.enable) {
            var min = 99999;
            var target = 9999;
            for (var i = 0, len = this.touchList.length; i < len; i++) {
                var x = e.x - this.touchList[i].x;
                var y = e.y - this.touchList[i].y;
                var dis = Math.sqrt(x * x + y * y);
                if (dis < min) {
                    target = i;
                    min = dis;
                }
            }
            this.touchList[target].x = e.x;
            this.touchList[target].y = e.y;
            return this.touchList[target].id;
        } else {
            this.touchList[0] = {id:0, x:e.x, y:e.y};
            return 0;
        }
    },
    end: function(e) {
        if (this.enable) {
            var min = 99999;
            var target = 9999;
            for (var i = 0, len = this.touchList.length; i < len; i++) {
                var x = e.x - this.touchList[i].x;
                var y = e.y - this.touchList[i].y;
                var dis = Math.sqrt(x * x + y * y);
                if (dis < min) {
                    target = i;
                    min = dis;
                }
            }
            var id = this.touchList[target].id;
            this.touchList.splice(target, 1);
            return id;
        } else {
            this.touchList = [];
            return 0;
        }
    },
    numTouch: function() {
        return this.touchList.length;
    },
    reset: function() {
        this.touchID = 0;
        this.touchList = [];
    },
});

MultiTouch = enchant.MultiTouch;


