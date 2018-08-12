import BuildPanel from "./BuildPanel";
import { DataMgr, BuildingInfo } from "../DataMgr";
import ToastPanel from "./ToastPanel";
import CvsMain from "../CvsMain";
import CityUI from "../CityUI";
import CurrencyFormatter from "../Utils/CurrencyFormatter";
import BuildingInfoPanel from "./BuildingInfoPanel";

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
        //显示建筑材料
        // let curCargoData = DataMgr.getUserCurrentCargoData(DataMgr.myUser);TODO:不够的红色
        let lines = [];
        for (let i = 0; i < 3; i++) {
            let itemName = "BuildMat" + i;
            let cargoName = info[itemName];
            if (cargoName) {
                let cntItemName = itemName + "Cnt";
                let needCnt = info[cntItemName];
                let cargoInfo = DataMgr.getCargoInfo(cargoName);
                lines.push(needCnt + ' ' + cargoInfo.Name);
            }
        }
        let needMoney = Number(info.Money);
        if (needMoney > 0) {
            lines.push(CurrencyFormatter.formatNAS(needMoney) + DataMgr.coinUnit);
        }
        this.lblConsumption.string = lines.join('\n');
    }

    onClick() {
        BuildingInfoPanel.Show(this.info);
    }

    onBuildClick() {
        let info = this.info;
        let curCargoData = DataMgr.getUserCurrentCargoData(DataMgr.myUser);
        //check cargo
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