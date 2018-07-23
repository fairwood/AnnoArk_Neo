import BuildPanel from "./BuildPanel";
import { BuildingInfo, DataMgr, TechInfo } from "./DataMgr";
import CityUI from "./CityUI";
import CvsMain from "./CvsMain";
import ToastPanel from "./UI/ToastPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BuildingButton extends cc.Component {

    @property(cc.Label)
    lblName: cc.Label = null;

    @property(cc.Label)
    lblConsumption: cc.Label = null;

    info: BuildingInfo;

    setAndRefresh(info: BuildingInfo) {
        this.info = info;
        this.lblName.string = info.Name;
        let ironCost = info.IronCost;
        this.lblConsumption.string = '原料 ' + ironCost + '铁';
    }

    onClick() {
        // BuildingInfoPanel.Show(this.info);
        this.onBuildClick();
    }

    onBuildClick() {
        //检查建筑材料
        let info = this.info;
        let curCargoData = DataMgr.getUserCurrentCargoData(DataMgr.myUser);
        //check cargo & consume cargo
        let cargoEnough = true;
        for (let i = 0; i < 3; i++) {
            let itemName = "BuildMat" + i;
            let cargoName = info[itemName];
            if (cargoName) {
                let cntItemName = itemName + "Cnt";
                let needCnt = info[cntItemName];
                if (curCargoData[cargoName] < needCnt) {
                    cargoEnough = false;
                }
            }
        }

        if (!cargoEnough) {
            ToastPanel.Toast('某些货物不足。如果强行发送区块链交易，可能失败。');
        }

        CvsMain.ClosePanel(BuildPanel);
        CityUI.Instance.enterBuildMode(this.info);
    }
}