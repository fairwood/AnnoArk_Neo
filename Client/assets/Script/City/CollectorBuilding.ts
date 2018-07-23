import { BuildingInfo, BuildingData, DataMgr } from "../DataMgr";
import Building from "./Building";
import MainCtrl from "../MainCtrl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CollectorBuilding extends Building {

    @property(cc.Label)
    lblOutput: cc.Label = null;
    @property(cc.Node)
    nodeGear: cc.Node = null;

    update(dt: number) {
        if (MainCtrl.Ticks % 200 == 0) this.refresh();
        this.nodeGear.rotation += 360 * dt;
    }

    refresh() {
        let info = this.info;
        const user = DataMgr.myUser;
        const curTime = Number(new Date());
        const outid = info['Out0'];
        const outRate = DataMgr.getBuildingInfoItemWithLv(this.info.id, 'Out0Rate', this.data.lv);

        let cargoName = DataMgr.getCargoInfo(outid).Name;
        this.lblOutput.string = ` ${(outRate).toPrecision(3)}${cargoName}/h`;
    }
}
