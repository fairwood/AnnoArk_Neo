import { BuildingInfo, BuildingData, DataMgr } from "../DataMgr";
import Building from "./Building";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HouseBuilding extends Building {

    @property(cc.Label)
    lblCapacity: cc.Label = null;

    update() {
        this.lblCapacity.string = DataMgr.getBuildingInfoItemWithLv(this.data.id, 'Capacity', this.data.lv);
    }
}
