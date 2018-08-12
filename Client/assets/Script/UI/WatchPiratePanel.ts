import { DataMgr } from "../DataMgr";
import CvsMain from "../CvsMain";
import AttackPiratePanel from "./AttackPiratePanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class WatchPiratePanel extends cc.Component {
    static Instance: WatchPiratePanel;
    onLoad() { WatchPiratePanel.Instance = this; }

    @property(cc.Label)
    lblTitle: cc.Label = null;
    @property(cc.Label)
    lblLv: cc.Label = null;
    @property(cc.Label)
    lblDefTank: cc.Label = null;
    @property(cc.Label)
    lblDefChopper: cc.Label = null;
    @property(cc.Label)
    lblDefShip: cc.Label = null;

    @property(cc.Node)
    cargoFrameTemplate: cc.Node = null;
    @property(cc.Node)
    cargoFrameContainer: cc.Node = null;

    cargoFrameList = [];

    pirateData;

    start() {
        this.cargoFrameTemplate.active = false;
    }
    setAndRefresh(pirateData: any) {
        this.pirateData = pirateData;
        this.lblTitle.string = '海盗 #' + pirateData.index.toString();
        this.lblLv.string = pirateData.lv.toString();
        console.log('sAR', pirateData)
        this.lblDefTank.string = (pirateData.army.tank || 0).toFixed();
        this.lblDefChopper.string = (pirateData.army.chopper || 0).toFixed();
        this.lblDefShip.string = (pirateData.army.ship || 0).toFixed();

        let cargo = pirateData.cargo;
        let i = 0;
        for (let cargoName in cargo) {
            let node: cc.Node;
            if (i < this.cargoFrameList.length) {
                node = this.cargoFrameList[i];
            } else {
                node = cc.instantiate(this.cargoFrameTemplate);
                node.parent = this.cargoFrameContainer;
                this.cargoFrameList.push(node);
                node.active = true;
            }
            let lbl = node.getChildByName('LblCargo').getComponent(cc.Label);
            lbl.string = DataMgr.getCargoInfo(cargoName).Name + '  ' + cargo[cargoName].toFixed();
            i++;
        }
        for (; i < this.cargoFrameList.length; i++) {
            this.cargoFrameList[i].destroy();
        }
    }

    onAttackClick() {
        const refresh = (data) => {
            AttackPiratePanel.Instance.setAndRefresh(data);
        };
        CvsMain.OpenPanel(AttackPiratePanel, () => refresh(DataMgr.getPirateData(this.pirateData.index)));
        DataMgr.fetchPirateDataFromBlockchain(this.pirateData.index, refresh);
        this.close();
    }

    close() {
        this.node.destroy();
        WatchPiratePanel.Instance = null;
    }
}
