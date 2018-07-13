import WorldUI from "../WorldUI";
import DialogPanel from "../DialogPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export class SpecialArk extends cc.Component {

    @property(String)
    strName: string = '';

    @property(cc.Float)
    distanceThreshold: number = 10000;

    @property(String)
    strTooFar: string = '';
    @property(String)
    strInfo: string = '';
    @property(cc.Node)
    grpInfo: cc.Node = null;

    location: cc.Vec2;

    onLoad() {
        this.location = this.node.position;
    }

    onClick() {
        WorldUI.Instance.selectSpecialArk(this.node);
    }

    refreshZoom(zoomScale: number) {
        this.node.position = this.location.mul(zoomScale);
        this.grpInfo.opacity = WorldUI.Instance.zoomScale > 0.08 || WorldUI.Instance.selectedObjectNode == this.node.parent ? 255 : 0;
    }

    update(dt: number) {
        this.refreshZoom(WorldUI.Instance.zoomScale);
    }

    showInfo(distance: number) {
        if (distance > this.distanceThreshold) {
            DialogPanel.PopupWithOKButton(this.strName, this.strTooFar);
        } else {
            DialogPanel.PopupWithOKButton(this.strName, this.strInfo);
        }
    }
}