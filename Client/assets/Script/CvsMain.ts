import BaseUI from "./BaseUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CvsMain extends cc.Component {

    static Instance: CvsMain;

    onLoad() {
        CvsMain.Instance = this;
        this.uiContainer.children.forEach(c => c.active = true);
    }

    @property(cc.Node)
    fitter: cc.Node = null;
    @property(cc.Node)
    uiContainer: cc.Node = null;

    static EnterUI(uiType: any) {
        this.Instance.uiContainer.children.forEach((uiNode) => {
            if (uiNode.getComponent(uiType)) {
                uiNode.active = true;
            } else {
                uiNode.active = false;
            }
        })
    }

    lastVisibleSize;
    update() {
        let visibleSize = cc.view.getVisibleSize();
        if (!this.lastVisibleSize || !visibleSize.equals(this.lastVisibleSize)) {
            if (visibleSize.width >= visibleSize.height) {
                this.fitter.rotation = 0;
                this.fitter.scale = 1;
                this.fitter.setContentSize(1080 / visibleSize.height * visibleSize.width, 1080);
            } else {
                this.fitter.rotation = 90;
                this.fitter.setContentSize(1080 / visibleSize.width * visibleSize.height, 1080);
                this.fitter.scale = visibleSize.width / 1080;
            }
            this.lastVisibleSize = visibleSize;
        }
    }
}
