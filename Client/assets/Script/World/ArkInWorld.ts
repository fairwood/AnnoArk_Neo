import { DataMgr, UserData } from "./DataMgr";
import WorldUI from "./WorldUI";
import { FlagMgr } from "./UI/FlagMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ArkInWorld extends cc.Component {

    @property(cc.Sprite)
    sprIcon: cc.Sprite = null;
    @property(cc.Sprite)
    sprFlag: cc.Sprite = null;
    @property(cc.Label)
    lblName: cc.Label = null;
    @property(cc.Node)
    grpInfo: cc.Node = null;

    data: UserData;

    // btnNode: cc.Node;

    onLoad() {
        // this.btnNode = new cc.Node();
        // this.btnNode.parent = this.node;
        // this.btnNode.on(cc.Node.EventType.TOUCH_END, this.onClick);
    }

    setAndRefresh(data: UserData, zoomScale: number) {
        this.data = data;
        // this.sprArk.node.setContentSize(data.arkSize, data.arkSize);
        this.lblName.string = data.nickname;
        this.refreshZoom(zoomScale);

        FlagMgr.setFlag(this.sprFlag, data.country);
    }

    refreshZoom(zoomScale: number) {
        if (this.data) {
            let curLoc = DataMgr.getUserCurrentLocation(this.data);
            this.node.position = curLoc.mul(zoomScale);
            // this.sprArk.node.scale = zoomScale * 0.02;
        }
    }

    update(dt: number) {
        this.refreshZoom(WorldUI.Instance.zoomScale);
    }

    onClick() {
        WorldUI.Instance.selectObject(this.node);
    }
}
