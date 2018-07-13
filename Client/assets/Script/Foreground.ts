
const { ccclass, property } = cc._decorator;

@ccclass
export default class Foreground extends cc.Component {

    onLoad() {
        this.node.children.forEach(c => {
            if (!c.active) {
                c.active = true;
                c.active = false;
            }
        });
    }
}
