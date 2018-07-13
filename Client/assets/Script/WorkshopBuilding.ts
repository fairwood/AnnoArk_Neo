import { BuildingInfo, BuildingData, DataMgr } from "./DataMgr";
import Building from "./Building";
import MainCtrl from "./MainCtrl";

const { ccclass, property } = cc._decorator;

@ccclass
export default class WorkshopBuilding extends Building {

    @property(cc.Label)
    lblConsumption: cc.Label = null;
    @property(cc.Label)
    lblOutput: cc.Label = null;
    @property(cc.Label)
    lblWorkers: cc.Label = null;
    @property(cc.Node)
    nodeGear: cc.Node = null;
    @property(cc.Button)
    btnDecWork: cc.Button = null;
    @property(cc.Button)
    btnIncWork: cc.Button = null;

    setInfo(info: BuildingInfo, data: BuildingData) {
        this.info = info;
        this.data = data;
        this.lblName.string = info.Name;

        this.node.setContentSize(info.Length * 100, info.Width * 100);

        this.refresh();
    }

    changeWorkers(event, arg) {
        if (arg == '-') {
            let reduce = Math.min(this.data.workers, 1);
            this.data.workers -= reduce;
            DataMgr.idleWorkers += reduce;
        } else if (arg == '+') {
            let add = Math.min(DataMgr.idleWorkers, 1, this.info['MaxHuman'] - this.data.workers);
            this.data.workers += add;
            DataMgr.idleWorkers -= add;
        }
        this.refresh();
    }

    update(dt: number) {
        this.lblWorkers.string = '人' + this.data.workers.toFixed() + '/' + this.info.MaxHuman;
        if (this.data.id == 'research239') {
            if (this.data.workers > 0 && DataMgr.currentWorkingTech) {
                this.nodeGear.rotation += 360 * this.data.workers / this.info.MaxHuman * dt;
            }
        }
        else {
            if (this.data.isWorking) {
                this.nodeGear.rotation += 360 * this.data.workers / this.info.MaxHuman * dt;
            }
        }
        this.btnDecWork.interactable = this.data.workers > 0;
        this.btnIncWork.interactable = this.data.workers < this.info.MaxHuman;

        if (MainCtrl.Ticks % 200 == 0) this.refresh();
    }

    refresh() {
        let info = this.info;
        let strInfoLines = [];
        for (let i = 0; i < 4; i++) {
            const rawid = info['Raw' + i];
            if (rawid && rawid.length > 0) {
                const rawRate = info['Raw' + i + 'Rate'];
                const cargoInfo = DataMgr.CargoConfig.find(c => c.id == rawid);
                let rate = Math.round(rawRate * this.data.workers / this.info.MaxHuman * 1e1) / 1e1;
                strInfoLines.push(`消耗 ${rate}${cargoInfo.Name}/min`);
            }
        }
        for (let i = 0; i < 4; i++) {
            const outid = info['Out' + i];
            if (outid && outid.length > 0) {
                const outRate = info['Out' + i + 'Rate'];
                const cargoInfo = DataMgr.CargoConfig.find(c => c.id == outid);
                let rate = Math.round(outRate * this.data.workers / this.info.MaxHuman * 1e1) / 1e1;
                strInfoLines.push(`生产 ${rate}${cargoInfo.Name}/min`);
            }
        }
        if (strInfoLines.length > 0) {
            let str = strInfoLines[0];
            for (let i = 1; i < strInfoLines.length; i++) {
                const line = strInfoLines[i];
                str += '\n' + line;
            }
            this.lblConsumption.string = str;
        } else {
            this.lblConsumption.string = '';
        }
    }
}
