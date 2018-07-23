import WorldUI from "../WorldUI";
import { DataMgr } from "../DataMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Pirate extends cc.Component {

    @property(cc.Label)
    lblName: cc.Label = null;
    @property(cc.Label)
    lblLv: cc.Label = null;
    @property(cc.Node)
    grpInfo: cc.Node = null;

    index: number;
    data; //可能为空

    setAndRefresh(index, data, zoomScale: number) {
        this.index = index;
        this.data = data;
        // this.sprArk.node.setContentSize(data.arkSize, data.arkSize);
        this.lblName.string = '海盗';
        this.lblLv.string = (data.lv + 1).toString();
        this.refreshZoom(zoomScale);
    }

    refreshZoom(zoomScale: number) {
        let curLoc = new cc.Vec2(this.data.x, this.data.y);
        this.node.position = curLoc.mul(zoomScale);
    }

    update(dt: number) {
        this.refreshZoom(WorldUI.Instance.zoomScale);
    }

    onClick() {
        WorldUI.Instance.selectObject(this.node);
        DataMgr.fetchPirateDataFromBlockchain(this.index);
    }
}
