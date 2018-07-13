import { IslandData, DataMgr } from "../DataMgr";
import CurrencyFormatter from "../Utils/CurrencyFormatter";
import WorldUI from "../WorldUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class IslandInfoFrame extends cc.Component {

    @property(cc.Label)
    lblName: cc.Label = null;
    @property(cc.Label)
    lblLeftMoney: cc.Label = null;
    @property(cc.Label)
    lblMiningSpeed: cc.Label = null;
    @property(cc.Label)
    lblOccupant: cc.Label = null;

    @property(cc.Node)
    grpTitle: cc.Node = null;
    @property(cc.Node)
    grpMore: cc.Node = null;

    refresh(data: IslandData) {
        if (!data) return;
        this.lblName.string = data.sponsorName;
        let curMoney = DataMgr.calcCurrentMoneyInIsland(data);
        this.lblLeftMoney.string = CurrencyFormatter.formatNAS(curMoney / 1e18) + 'NAS';
        let speed = data.miningRate * curMoney / 1e18;
        this.lblMiningSpeed.string = CurrencyFormatter.formatNAS(speed) + 'NAS/小时';
        if (data.occupant && data.occupant.length > 0) {
            let occupant = data.occupant == DataMgr.myData.address ? DataMgr.myData : DataMgr.othersData[data.occupant];
            this.lblOccupant.string = (occupant ? occupant.nickname : data.occupant);
        } else {
            this.lblOccupant.string = '(无)';
        }
    }

    refreshAsZoomScale() {
        this.grpMore.opacity = WorldUI.Instance.zoomScale > 0.18 || WorldUI.Instance.selectedObjectNode == this.node.parent ? 255 : 0;
        this.grpTitle.opacity = WorldUI.Instance.zoomScale > 0.08 || WorldUI.Instance.selectedObjectNode == this.node.parent ? 255 : 0;
    }
}