import MathUtil from "../Utils/MathUtil";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TweenOpacity extends cc.Component {

    @property(Number)
    origin = 0;
    @property(Number)
    target = 0;
    @property(Number)
    duration = 0;
    @property(Number)
    delay = 0;

    state = 0;//0-delay 1-tween 2-finish

    countdown = 0;

    start() {
        this.state = 0;
        this.countdown = this.delay;
        this.setValue(0);
    }

    update(dt) {
        this.countdown -= dt;
        if (this.state == 0) {
            if (this.countdown <= 0) {
                this.state = 1;
                this.countdown = this.duration;
            }
        }
        if (this.state == 1) {
            const t = 1 - this.countdown / this.duration;
            this.setValue(t);
        }
    }

    setValue(t) {
        this.node.opacity = MathUtil.lerp(this.origin, this.target, t, true);
    }
}