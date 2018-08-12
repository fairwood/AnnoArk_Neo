const { ccclass, property } = cc._decorator;

@ccclass
export default class SliderFill extends cc.Component {

    @property(cc.Slider)
    slider: cc.Slider = null;

    spr: cc.Sprite;

    start() {
        this.spr = this.node.getComponent(cc.Sprite);
    }

    update() {
        if (this.spr && this.slider) {
            this.spr.fillRange = this.slider.progress;
        }
    }
}
