import { IslandData, DataMgr } from "../DataMgr";
import MainCtrl from "../MainCtrl";
import WorldUI from "../WorldUI";
import IslandInfoFrame from "../UI/IslandInfoFrame";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Island extends cc.Component {

    @property(IslandInfoFrame)
    infoFrame: IslandInfoFrame = null;
    @property(cc.Label)
    lblName: cc.Label = null;
    data: IslandData;
    // btnNode: cc.Node;

    onLoad() {
        // this.btnNode = new cc.Node();
        // this.btnNode.parent = this.node;
        // this.btnNode.on(cc.Node.EventType.TOUCH_END, this.onClick.bind(this));
    }

    setData(data: IslandData) {
        this.data = data;
        this.refresh();
    }
    update() {
        if (MainCtrl.Ticks % 60 == 0) {
            this.refresh();
            // if (this.infoFrame) this.infoFrame.refresh(this.data);
            // this.btnNode.setContentSize(this.node.width + 5, this.node.height + 5);
        }
        this.node.position = new cc.Vec2(this.data.x, this.data.y).mul(WorldUI.Instance.zoomScale);
        // this.infoFrame.refreshAsZoomScale();
    }

    refresh(){
        this.lblName.string = this.data.sponsorName;
    }

    onLinkClick() {
        let link = this.data.sponsorLink;
        if (link && link.length > 0) window.open(link);
    }

    onClick() {
        WorldUI.Instance.selectObject(this.node);
    }
}
