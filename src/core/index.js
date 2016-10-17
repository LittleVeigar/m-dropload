import $utils from './lib/utils';
import css from './lib/css';
import callback from './lib/callback';
import touchEvent from './lib/getTouchEvent';
import scroll from './lib/scroll';
import str from './lib/str';
let $that = window,
    $d,
    $b;
var $touch;

$touch = function (element, _opt) {
    let $obj = null;
    let that = this;
    $d = $that.document;
    $b = $d.body;
    if (element == undefined) {
        $obj = $b;
    } else {
        $obj = element;
    }
    that.opt = _opt;
    // 动画时长
    that.opt.animationTime = that.opt.animationTime || .5;
    // 最大可拉取步长
    that.opt.windowHeight = window.innerHeight;
    that.obj = $obj;
    that.obj.css = function (key, value) {
        if (arguments.length === 2) {
            $utils.css(this, key, value);
        } else {
            return this.style[key];
        }
    };
    // 判断是否需要对未注册方法进行屏蔽
    if (!that.opt.up) {
        that.opt.up = {
            isNull: true, template: {}, fn: ()=> {
            }
        };
    }
    if (!that.opt.down) {
        that.opt.down = {
            isNull: true, template: {}, fn: ()=> {
            }
        };
    }
    // 事件缓存,以便销毁
    function touchstart(e) {
        $touch.start.call(that, e);
    }

    function touchend(e) {
        $touch.end.call(that, e);
    }

    function touchmove(e) {
        $touch.move.call(that, e);
    }

    function touchresize(e) {
        $touch.resize.call(that, e);
    }

    function touchcancel(e) {
        $touch.cancel.call(that, e);
    }

    function transitionedn(e) {
    }

    function eventscroll(e) {
        // 已经在执行了，无需再次执行
        let that = this;
        if (that.status.loading) return;
        if (scroll.getScrollTop() + scroll.getWindowHeight() >= (scroll.getScrollHeight() - 50)) {
            // bottom event
            that.status.loading = true;
            that.downObj.css(str.o, '1', false);
            that.downObj.innerHTML = that.opt.down.template.loading;
            that.opt.down && that.opt.down.fn(callback.call(that));
        }
    }

    $obj[str.a](touchEvent.eventStart, touchstart);
    $obj[str.a](touchEvent.eventEnd, touchend);
    $obj[str.a](touchEvent.eventMove, touchmove);
    window[str.a](touchEvent.eventResize, touchresize);
    $obj[str.a](touchEvent.eventcancel, touchcancel);
    $obj[str.a](str.te, transitionedn);
    window[str.a](str.scroll, eventscroll.bind(that));
    // 销毁
    that.destroy = function () {
        callback.call(that).reset();
        $obj[str.r](touchEvent.eventStart, touchstart);
        $obj[str.r](touchEvent.eventEnd, touchend);
        $obj[str.r](touchEvent.eventMove, touchmove);
        $obj[str.r](touchEvent.eventcancel, touchcancel);
        $obj[str.r](str.te, transitionedn);
        $obj.classList.remove(str.jmd);
        window[str.r](touchEvent.eventResize, touchresize);
        window[str.r](str.scroll, eventscroll);
        // 节点回收
        try {
            that.upObj && that.obj.parentNode.removeChild(that.upObj);
            that.downObj && that.obj.parentNode.removeChild(that.downObj);
        } catch (err) {
            console.warn(err);
        }

        // 等待回收
        // that = null;
    };
    // 初始化CSS
    $utils.css($obj, str.tf, str.t3d + '(0,0,0)');
    $utils.css($obj, 'position', 'relative', true);
    $utils.css($obj, 'z-index', '20', true);
    $utils.css($obj, str.td, that.opt.animationTime);
    that.initTemplate();
    that.status = {
        lock: false,
        loading: false
    };
    return that;
};

$touch.prototype.cancel = function () {
    callback.call(this).reset();
};

$touch.prototype.initTemplate = function () {
    // 初始化上部分
    var $div;
    let that = this;
    if (!that.opt.up.isNull && !document.querySelector('.' + str.jmdUp)) {
        $div = document.createElement('div');
        $div.innerHTML = that.opt.up.template.none;
        $div.className = str.jmdUp;
        this.obj.parentNode.insertBefore($div, this.obj);
    }
    // 初始化下部分
    if (!this.opt.down.isNull && !this.obj.parentNode.querySelector('.' + str.jmdDown)) {
        $div = document.createElement('div');
        $div.innerHTML = this.opt.down.template.none;
        $div.className = str.jmdDown;
        $utils.insertAfter(this.obj, $div);
    }
    that.upObj = this.obj.parentNode.querySelector('.' + str.jmdUp);
    that.downObj = this.obj.parentNode.querySelector('.' + str.jmdDown);
    //TODO: 此处需要优化
    if (that.upObj) {
        that.upObj.css = $utils.elementCSS.bind(that.upObj);
    } else {
        that.upObj = {};
        that.upObj.css = function () {
        };
    }

    if (that.downObj) {
        that.downObj.css = $utils.elementCSS.bind(that.downObj);
    } else {
        that.downObj = {};
        that.downObj.css = function () {
        };
    }
};

$touch.start = function (e) {
    if (this.status.lock) return;
    // e.preventDefault();
    // 取当前tf高度
    this.offsetY = this.obj.css(str.tf).split(',')[1].replace('px', '').trim() * 1;
    if (isNaN(this.offsetY)) {
        this.offsetY = 0;
    }
    this.status.lock = true;
    this.status.loading = false;
    this.obj.css(str.td, '0s');
    this.upObj.css(str.td, '0s');
    this.downObj.css(str.o, '1');
    this.startMouse = $utils.mouseXY(e);
    // 再次初始化字符
    this.upObj.innerHTML = this.opt.up.template.none;
    this.downObj.innerHTML = this.opt.down.template.none;
};

$touch.end = function (e) {
    if (this.status.lock) {
        e.stopPropagation();
        this.endMouse = $utils.mouseXY(e);
        var mouseY = this.endMouse.y - this.startMouse.y;
        this.obj.css(str.td, '.5s');
        if (mouseY < this.opt.height) {
            this.obj.css(str.tf, str.t3d + '(0,0px,0)');
        } else {
            this.obj.css(str.tf, str.t3d + '(0,' + this.opt.height + 'px,0)');
        }
        this.upObj.css(str.tf, str.t3d + '(0,0,0)');
        this.upObj.css(str.td, this.opt.animationTime + 's');
        // 操作完成之后的回调方法
        this.status.lock = false;
        var _cb = callback.call(this);
        // 查询是否到底部
        if (mouseY > this.opt.height) {
            this.upObj.innerHTML = this.opt.up.template.loading;
            this.status.loading = true;
            this.opt.up && this.opt.up.fn(_cb);
        } else {
            _cb.reset(mouseY);
        }
        if (mouseY <= 0) {
            this.downObj.innerHTML = this.opt.down.template.loading;
        }
    }
    // this.upObj.innerHTML = this.opt.up.template.none;
};
$touch.move = function (e) {
    let that = this;
    if (that.status.lock) {
        var mouse = $utils.mouseXY(e);
        var mouseY = mouse.y - that.startMouse.y;
        // 解决与iScroll冲突问题
        if (scroll.getScrollTop() === 0 && mouseY > 0) {
            console.log('move');
            e.preventDefault();
            // 判断是否固定距离,默认为一半屏幕高度
            if (mouseY > 0 && mouseY < that.opt.windowHeight) {
                var offset = (mouseY + that.offsetY) / 2;
                var o = (offset / that.opt.height).toFixed(2);
                o = o > 1 ? 1 : o;
                that.obj.css(str.tf, str.t3d + '(0,' + offset + 'px,0)');
                that.upObj.css(str.o, o);
                // 操作下拉提示框
                let offsetUpobjHeight = (offset - that.opt.height) / 2;
                that.upObj.css(str.tf, str.t3d + '(0,' + (offsetUpobjHeight < 0 ? 0 : offsetUpobjHeight) + 'px,0)');
            }
            if (mouseY > that.opt.height) {
                that.upObj.innerHTML = that.opt.up.template.message;
            }
        }
    }
};
$touch.resize = function (e) {

};
$touch.cancel = function (e) {
    // fixbug touchend可能异常不触发
    callback.call(this).reset();
};

export default (_el, _opt)=> {
    // 参数初始化
    css.init();
    // 如果_el传递进来是非ELEMENT 则进行转换
    if (!(_el instanceof Element)) {
        _el = document.querySelector(_el);
    }
    if (_el === null) {
        throw '1001:无法寻找到可设置的html节点,请确认后再次调用.';
    }
    _el.classList.add(str.jmd);
    let $fn = new $touch(_el, _opt);
    //$fn.prototype = $touch.prototype;
    return $fn;
}