import { BuildingInfo, DataMgr } from "../DataMgr";
import CvsMain from "../CvsMain";
import AttackIslandPanel from "./AttackIslandPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BuildingInfoPanel extends cc.Component {
    static Instance: BuildingInfoPanel;
    onLoad() { BuildingInfoPanel.Instance = this; }

    @property(cc.Label)
    lblName: cc.Label = null;
    @property(cc.Label)
    lblBuildingMat: cc.Label = null;
    @property(cc.Label)
    lblHuman: cc.Label = null;
    @property(cc.Label)
    lblRaw: cc.Label = null;
    @property(cc.Label)
    lblOut: cc.Label = null;
    @property(cc.Sprite)
    sprPic: cc.Sprite = null;

    refresh(info: BuildingInfo) {
        this.lblName.string = info.Name;

        let strInfoLines = [];
        for (let i = 0; i < 4; i++) {
            const rawid = info['BuildMat' + i];
            if (rawid && rawid.length > 0) {
                const count = info['BuildMat' + i + 'Count'];
                const cargoInfo = DataMgr.CargoConfig.find(c => c.id == rawid);
                strInfoLines.push(`${cargoInfo.Name}*${count}`);
            }
        }
        this.lblBuildingMat.string = strInfoLines.join('\n');

        this.lblHuman.string = info['MaxHuman'];

        strInfoLines = [];
        for (let i = 0; i < 4; i++) {
            const rawid = info['Raw' + i];
            if (rawid && rawid.length > 0) {
                const count = info['Raw' + i + 'Rate'];
                const cargoInfo = DataMgr.CargoConfig.find(c => c.id == rawid);
                strInfoLines.push(`${cargoInfo.Name}*${count}`);
            }
        }
        this.lblRaw.string = strInfoLines.join('\n');

        strInfoLines = [];
        for (let i = 0; i < 4; i++) {
            const rawid = info['Out' + i];
            if (rawid && rawid.length > 0) {
                const count = info['Out' + i + 'Rate'];
                const cargoInfo = DataMgr.CargoConfig.find(c => c.id == rawid);
                strInfoLines.push(`${cargoInfo.Name}*${count}`);
            }
        }
        this.lblOut.string = strInfoLines.join('\n');
    }

    static Show(idOrInfo: string | BuildingInfo) {
        let info: BuildingInfo;
        if (typeof (idOrInfo) == 'string') {
            info = DataMgr.BuildingConfig.find(i => i.id == idOrInfo);
        } else {
            info = idOrInfo;
        }
        CvsMain.OpenPanel(BuildingInfoPanel);       
        BuildingInfoPanel.Instance.refresh(info);
    }

    close() {
        this.node.destroy();
        BuildingInfoPanel.Instance = null;
    }
}
