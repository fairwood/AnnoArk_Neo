const { ccclass, property } = cc._decorator;

@ccclass
export default class TypewriterEffect extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property(cc.RichText)
    richText: cc.RichText = null;

    @property(Number)
    delay = 0;

    txt: string;

    onLoad() {
        let target = this.label ? this.label : this.richText;
        if (target) {
            this.txt = target.string;
            setTimeout(this.playEffect(target, target.string, null), this.delay * 1e3);
        }
    }



    playEffect(label, text, callback) {
        var self = this;
        var html = '';
        var arr = text.split('');
        var len = arr.length;
        var step = 0;
        self.func = function () {
            html += arr[step];
            label.string = html;
            if (++step == len) {
                self.unschedule(self.func);
                callback && callback();
            }
        }
        self.schedule(self.func, 0.05, cc.macro.REPEAT_FOREVER, 0)

    }
}
