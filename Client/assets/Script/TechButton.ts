import { TechInfo, TechData, DataMgr } from "./DataMgr";
import TechPanel from "./TechPanel";
import ArkUI from "./ArkUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TechButton extends cc.Component {

    @property(cc.Label)
    lblName: cc.Label = null;
    @property(cc.Label)
    lblWork: cc.Label = null;
    @property(cc.ProgressBar)
    prgWork: cc.ProgressBar = null;
    @property(cc.Node)
    gear: cc.Node = null;

    info: TechInfo;
    data: TechData;

    setAndRefresh(info: TechInfo, data: TechData) {
        this.info = info;
        this.lblName.string = info.Name;
        if (this.data){
            this.lblWork.string = this.data.filledWork.toFixed() + ' / ' + info.Work;
        }else{
            this.lblWork.string = info.Work.toString();
        }
        this.data = data;
        this.prgWork.progress = data.filledWork / info.Work;
    }

    update(dt: number) {
        this.prgWork.progress = this.data.filledWork / this.info.Work;
        if (DataMgr.currentWorkingTech == this.info.id) {
            this.gear.active = true;
            this.gear.rotation += 18 * DataMgr.researchRatePerMin * dt;
        } else {
            this.gear.active = false;
        }
    }

    onClick() {
        if (DataMgr.currentWorkingTech != this.info.id) {
            DataMgr.currentWorkingTech = this.info.id;
        } else {
            DataMgr.currentWorkingTech = null;
        }
    }
}
