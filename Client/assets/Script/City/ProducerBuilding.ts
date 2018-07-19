import { BuildingInfo, BuildingData, DataMgr } from "../DataMgr";
import Building from "./Building";
import MainCtrl from "../MainCtrl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ProducerBuilding extends Building {

    // @property(cc.Label)
    // lblConsumption: cc.Label = null;
    @property(cc.Label)
    lblCd: cc.Label = null;

    update(dt: number) {
        if (MainCtrl.Ticks % 500 == 0) this.refresh();
        let curTime = Number(new Date());
        if (curTime >= this.data.recoverTime) {
            this.lblCd.string = '等待生产';
        } else {
            const cd = this.data.recoverTime - curTime;
            this.lblCd.string = '冷却中 ' + (cd / 3600e3).toFixed() + ':' + (cd % 3600e3 / 60e3).toFixed() + ':' + (cd % 60e3 / 1e3).toFixed();
        }
    }

    // refresh() {
    //     let info = this.info;
    //     let strInfoLines = [];
    //     for (let i = 0; i < 2; i++) {
    //         const inid = info['In' + i];
    //         if (inid && inid.length > 0) {
    //             const inAmt = info['In' + i + 'Amt'];
    //             const cargoInfo = DataMgr.getCargoInfo(inid);
    //             strInfoLines.push(`${inAmt}${cargoInfo.Name}`);
    //         }
    //     }
    //     this.lblConsumption.string = strInfoLines.join('\n');
    // }
}
