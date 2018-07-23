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
    @property(cc.Node)
    panelContainer: cc.Node = null;

    static EnterUI(uiType: any) {
        CvsMain.Instance.uiContainer.children.forEach((uiNode) => {
            if (uiNode.getComponent(uiType)) {
                uiNode.active = true;
            } else {
                uiNode.active = false;
            }
        })
    }

    static OpenPanel(panelType: any) {
        try {
            if (panelType.Instance) {
                panelType.Instance.node.active = true;
                return;
            }
            cc.loader.loadRes("Prefabs/Panels/" + panelType.name, cc.Prefab, function (err, prefab) {
                if (!err) {
                    let node: cc.Node = cc.instantiate(prefab);
                    node.parent = CvsMain.Instance.panelContainer;
                } else {
                    console.error('err45', err);
                }
            });
        } catch (error) {
            console.error(error);
        }
    }
    static ClosePanel(panelType: any) {
        try {
            if (panelType.Instance) {
                panelType.Instance.node.destroy();
                panelType.Instance = null;
            }
        } catch (error) {
            console.error(error);
        }
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
