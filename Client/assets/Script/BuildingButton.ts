import BuildPanel from "./BuildPanel";
import ArkUI from "./ArkUI";
import { BuildingInfo, DataMgr, TechInfo } from "./DataMgr";
import DialogPanel from "./DialogPanel";
import BuildingInfoPanel from "./UI/BuildingInfoPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BuildingButton extends cc.Component {

    @property(cc.Label)
    lblName: cc.Label = null;
    @property(cc.Label)
    lblSize: cc.Label = null;
    @property(cc.Node)
    sprSize: cc.Node = null;

    @property(cc.Label)
    lblConsumption: cc.Label = null;

    info: BuildingInfo;

    setAndRefresh(info: BuildingInfo) {
        this.info = info;
        this.lblName.string = info.Name;
        this.lblSize.string = info.Length + '*' + info.Width;
        this.sprSize.setContentSize(info.Length * 12, info.Width * 12);

        let strInfoLines = [];
        for (let i = 0; i < 4; i++) {
            const rawid = info['BuildMat' + i];
            if (rawid && rawid.length > 0) {
                const count = info['BuildMat' + i + 'Count'];
                const cargoInfo = DataMgr.CargoConfig.find(c => c.id == rawid);
                strInfoLines.push(`${cargoInfo.Name}*${count}`);
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

    onClick() {
        BuildingInfoPanel.Show(this.info);
    }

    onBuildClick() {
        //检查建筑材料
        let buildMats = [];
        for (let i = 0; i < 4; i++) {
            let mat = this.info['BuildMat' + i];
            if (mat && mat.length > 0) {
                let count = this.info['BuildMat' + i + 'Count'];
                buildMats.push([mat, count]);
            }
        }
        let enough = true;
        buildMats.forEach(mat => {
            let cargoData = DataMgr.myCargoData.find(data => data.id == mat[0]);
            if (cargoData.amount < mat[1]) {
                enough = false;
            }
        })

        if (!enough) {
            DialogPanel.PopupWith1Button('建筑材料不足', '', '确定', null);
            return;
        }

        //检查依赖科技
        let needTechs = [];
        for (let i = 0; i < 4; i++) {
            let tech = this.info['NeedTech' + i];
            if (tech && tech.length > 0) {
                needTechs.push(tech);
            }
        }
        enough = true;
        let lackTechNames = [];
        needTechs.forEach(tech => {
            let techData = DataMgr.myTechData.find(data => data.id == tech);
            if (!techData.finished) {
                enough = false;
                let techInfo = DataMgr.TechConfig.find(info => info.id == tech);
                lackTechNames.push(techInfo.Name);
            }
        })
        if (!enough) {
            DialogPanel.PopupWith1Button('尚未研究所需科技', lackTechNames.join(', '), '确定', null);
            return;
        }

        BuildPanel.Hide();
        ArkUI.Instance.enterBuildMode(this.info);
    }
}
