import { DataMgr, UserData } from "../DataMgr";
import CvsMain from "../CvsMain";
import AttackOtherPanel from "./AttackOtherPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class WatchOtherPanel extends cc.Component {
    static Instance: WatchOtherPanel;
    onLoad() { WatchOtherPanel.Instance = this; }

    @property(cc.Label)
    lblTitle: cc.Label = null;
    @property(cc.Label)
    lblLv: cc.Label = null;
    @property(cc.Label)
    lblHull: cc.Label = null;
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

    user: UserData;

    start() {
        this.cargoFrameTemplate.active = false;
    }
    setAndRefresh(user: UserData) {
        console.log('sAR', user);
        this.user = user;
        this.lblTitle.string = user.nickname;
        this.lblLv.string = DataMgr.getUserLevel(user).toFixed();
        this.lblHull.string = (DataMgr.getUserHull(user) * 100).toFixed() + '%';        

        let cargoData = DataMgr.getUserCurrentCargoData(user);
        this.lblDefTank.string = (cargoData['tank'] || 0).toFixed();
        this.lblDefChopper.string = (cargoData['chopper'] || 0).toFixed();
        this.lblDefShip.string = (cargoData['ship'] || 0).toFixed();

        let i = 0;
        for (let cargoName in cargoData) {
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
            lbl.string = DataMgr.getCargoInfo(cargoName).Name + '  ' + cargoData[cargoName].toFixed();
            i++;
        }
        for (; i < this.cargoFrameList.length; i++) {
            this.cargoFrameList[i].destroy();
        }
    }

    onAttackClick() {
        const refresh = (data) => {
            if (AttackOtherPanel.Instance) AttackOtherPanel.Instance.setAndRefresh(data);
        };
        CvsMain.OpenPanel(AttackOtherPanel, () => refresh(DataMgr.allUsers[this.user.address]));
        DataMgr.fetchUserDataFromBlockchain(this.user.address, refresh);
        this.close();
    }

    close() {
        this.node.destroy();
        WatchOtherPanel.Instance = null;
    }
}
