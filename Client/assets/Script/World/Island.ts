import { IslandData, DataMgr } from "../DataMgr";
import MainCtrl from "../MainCtrl";
import CurrencyFormatter from "../Utils/CurrencyFormatter";
import WorldUI from "../WorldUI";
import IslandInfoFrame from "../UI/IslandInfoFrame";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Island extends cc.Component {

    infoFrame: IslandInfoFrame;
    data: IslandData;
    btnNode: cc.Node;

    onLoad() {
        this.btnNode = new cc.Node();
        this.btnNode.parent = this.node;
        this.btnNode.on(cc.Node.EventType.TOUCH_END, this.onClick.bind(this));
    }

    setData(data: IslandData) {
        this.data = data;
    }
    update() {
        if (MainCtrl.Ticks % 60 == 0) {
            if (this.infoFrame) this.infoFrame.refresh(this.data);
            this.btnNode.setContentSize(this.node.width + 5, this.node.height + 5);
        }
        this.node.position = this.data.location.mul(WorldUI.Instance.zoomScale);
        this.infoFrame.refreshAsZoomScale();
    }

    onLinkClick() {
        let link = this.data.sponsorLink;
        if (link && link.length > 0) window.open(link);
    }

    onClick() {
        WorldUI.Instance.selectIsland(this.node);
    }
}
