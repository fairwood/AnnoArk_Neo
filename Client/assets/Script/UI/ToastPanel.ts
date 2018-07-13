const { ccclass, property } = cc._decorator;

@ccclass
export default class ToastPanel extends cc.Component {
    static Instance: ToastPanel;
    onLoad() {
        ToastPanel.Instance = this;
        this.toastTemplate.active = false;
    }

    @property(cc.Node)
    toastTemplate: cc.Node = null;

    @property(cc.Node)
    container: cc.Node = null;

    toast(text: string) {
        let node = cc.instantiate(ToastPanel.Instance.toastTemplate);
        node.parent = this.container;
        let label = node.getComponent(cc.Label);
        label.string = text;
        node.active = true;
        let seq = cc.sequence(cc.delayTime(4.5), cc.fadeOut(0.5));
        node.runAction(seq);
        setTimeout(() => { node.destroy(); }, 5000);
    }
    static Toast(text: string) {
        ToastPanel.Instance.toast(text);
    }
}
