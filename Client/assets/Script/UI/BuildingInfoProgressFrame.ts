const { ccclass, property } = cc._decorator;

@ccclass
export class BuildingInfoProgressFrame extends cc.Component {

    @property(cc.Label)
    lblName: cc.Label = null;
    @property(cc.ProgressBar)
    prgUpgraded: cc.ProgressBar = null;
    @property(cc.ProgressBar)
    prgCurrent: cc.ProgressBar = null;
    @property(cc.Label)
    lblNum: cc.Label = null;

    refresh(info) {
        //{name, valueMax, valueNext, valueCur, unit}
        //满级{name, valueMax, valueNext=null, valueCur, unit}
        this.lblName.string = info.name;
        if (info.valueNext) {
            this.prgUpgraded.progress = info.valueNext / info.valueMax;
            this.prgCurrent.progress = info.valueCur / info.valueMax;
            this.lblNum.string = info.valueCur + '+' + info.valueNext;
        } else {
            this.prgUpgraded.progress = 0;
            this.prgCurrent.progress = info.valueCur / info.valueMax;
            this.lblNum.string = info.valueCur;
        }
    }
}