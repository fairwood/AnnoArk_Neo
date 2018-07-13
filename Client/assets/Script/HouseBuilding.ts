import { BuildingInfo, BuildingData, DataMgr } from "./DataMgr";
import Building from "./Building";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HouseBuilding extends Building {

    @property(cc.Label)
    lblPopulation: cc.Label = null;

    setInfo(info: BuildingInfo, data: BuildingData) {
        super.setInfo(info, data);
        this.lblPopulation.string = info['Arg0'];
    }
}
