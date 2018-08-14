import { BuildingInfo, DataMgr, BuildingData, IJ } from "../DataMgr";
import CvsMain from "../CvsMain";
import { BuildingInfoProgressFrame } from "./BuildingInfoProgressFrame";
import DialogPanel from "./DialogPanel";
import ToastPanel from "./ToastPanel";
import BlockchainMgr from "../BlockchainMgr";
import CityUI from "../CityUI";
import BuildPanel from "./BuildPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BuildingInfoPanel extends cc.Component {
    static Instance: BuildingInfoPanel;
    onLoad() { BuildingInfoPanel.Instance = this; }

    ij: IJ;
    data: BuildingData;
    info: BuildingInfo;

    @property(cc.Label)
    lblName: cc.Label = null;
    @property(cc.Label)
    lblLv: cc.Label = null;
    @property(cc.Label)
    lblUpperInfoName: cc.Label = null;
    @property(cc.Sprite)
    sprPic: cc.Sprite = null;


    @property(cc.Node)
    cargoFrameTemplate: cc.Node = null;
    @property(cc.Node)
    cargoFrameContainer: cc.Node = null;
    cargoFrameList = [];

    @property(cc.Label)
    lblNeedTime: cc.Label = null;

    @property(cc.Node)
    progressFrameTemplate: cc.Node = null;
    @property(cc.Node)
    progressFrameContainer: cc.Node = null;
    progressFrameList = [];

    @property(cc.Node)
    btnBuild: cc.Node = null;
    @property(cc.Node)
    btnUpgrade: cc.Node = null;

    start() {
        this.cargoFrameTemplate.active = false;
        this.progressFrameTemplate.active = false;
    }

    //准备建造
    setAndRefreshInfo(info: BuildingInfo) {
        this.info = info;

        this.lblName.string = info.Name;
        this.lblLv.string = 'Max Lv ' + (Number(info.MaxLevel) + 1);
        this.lblUpperInfoName.string = '建造需要';

        this._refreshPic(info);

        let matCargos = {};
        for (let i = 0; i < 4; i++) {
            const rawid = info['BuildMat' + i];
            if (rawid && rawid.length > 0) {
                const count = Number(info['BuildMat' + i + 'Cnt']);
                matCargos[rawid] = count;
            }
        }
        this._refreshMats(matCargos);

        this._refreshProgressFrames(null, info);

        if (info.Type === 'producer') {
            let hours = info['CDPerUnit'] * info['MaxQueue'] / 60;
            this.lblNeedTime.string = hours + 'h';
        } else {
            this.lblNeedTime.string = '0min';
        }

        this.btnBuild.active = true;
        this.btnUpgrade.active = false;
    }
    //准备升级
    setAndRefreshBuilding(ij: IJ, bdg: BuildingData) {
        this.ij = ij;
        this.data = bdg;
        let info = DataMgr.getBuildingInfo(bdg.id);
        this.info = info;
        
        this._refreshPic(info);

        this.lblName.string = info.Name;
        this.lblLv.string = 'Lv ' + (bdg.lv + 1).toString();
        this.lblUpperInfoName.string = '升级需要';

        let matCargos = {};
        for (let i = 0; i < 4; i++) {
            const rawid = info['BuildMat' + i];
            if (rawid && rawid.length > 0) {
                const count = DataMgr.getBuildingInfoItemWithLv(info.id, 'BuildMat' + i + 'Cnt', bdg.lv + 1);
                matCargos[rawid] = count;
            }
        }
        this._refreshMats(matCargos);

        this._refreshProgressFrames(bdg, info);

        const maxLv = info.MaxLevel;
        if (bdg.lv < maxLv) {
            if (info.Type === 'producer') {
                let cdPerUnit = DataMgr.getBuildingInfoItemWithLv(info.id, 'CDPerUnit', bdg.lv + 1);
                let maxQueue = DataMgr.getBuildingInfoItemWithLv(info.id, 'MaxQueue', bdg.lv + 1);
                let hours = cdPerUnit * maxQueue / 60;
                this.lblNeedTime.string = hours + 'h';
            } else {
                this.lblNeedTime.string = '0min';
            }
        } else {
            this.lblNeedTime.string = '--';
        }

        this.btnBuild.active = false;
        this.btnUpgrade.active = bdg.lv < maxLv;
    }

    private _refreshPic(info: BuildingInfo) {
        if (this.sprPic) {
            try {
                let self = this;
                if (info.Pic) {
                    cc.loader.loadRes("buildings/" + info.Pic, cc.SpriteFrame, function (err, spriteFrame) {
                        if (!err) self.sprPic.spriteFrame = spriteFrame;
                    });
                } else {
                    this.sprPic.spriteFrame = null;
                }
            } catch (error) {
                console.error(error);
                this.sprPic.spriteFrame = null;
            }
        }
    }

    private _refreshMats(mats) {
        console.log('mats', mats);
        let i = 0;
        for (let cargoName in mats) {
            let node: cc.Node;
            if (i < this.cargoFrameList.length) {
                node = this.cargoFrameList[i];
            } else {
                node = cc.instantiate(this.cargoFrameTemplate);
                node.parent = this.cargoFrameContainer;
                this.cargoFrameList.push(node);
                node.active = true;
            }
            let lbl = node.getComponent(cc.Label);
            lbl.string = mats[cargoName].toFixed() + ' ' + DataMgr.getCargoInfo(cargoName).Name;
            i++;
        }
        for (; i < this.cargoFrameList.length; i++) {
            this.cargoFrameList[i].destroy();
        }
    }

    static readonly upgradableItems = {
        'Out0Rate': {
            getName(info) {
                let out0 = info['Out0'];
                return out0 ? '产出 ' + DataMgr.getCargoInfo(out0).Name : null;
            },
            transValue(value: number) { return value; },
            getUnit() { return ''; }
        },
        'CDPerUnit': {
            getName(info) {
                return '生产冷却速度'
            },
            transValue(value: number) { return Math.round(60 / value * 100) / 100; },
            getUnit() { return '/h'; }
        },
        'MaxQueue': {
            getName(info) {
                return '生产队列容量'
            },
            transValue(value: number) { return value; },
            getUnit() { return ''; }
        },
        'Capacity': {
            getName(info) {
                return '容量'
            },
            transValue(value: number) { return value; },
            getUnit() { return ''; }
        }
    };
    private _refreshProgressFrames(data: BuildingData, info: BuildingInfo) {
        //{name, valueMax, valueNext, valueCur, unit}
        //满级or无data{name, valueMax, valueNext=null, valueCur, unit}
        let i = 0;
        for (let itemName in BuildingInfoPanel.upgradableItems) {
            let node: cc.Node;
            let progInfo = {};

            let rawValue = info[itemName];
            if (rawValue && rawValue.length > 0) {
                const maxLevel = Number(info.MaxLevel);
                const itemInfo = BuildingInfoPanel.upgradableItems[itemName];
                progInfo['name'] = itemInfo.getName(info);
                progInfo['valueMax'] = itemInfo.transValue(DataMgr.getBuildingInfoItemWithLv(info.id, itemName, maxLevel));
                progInfo['valueNext'] = data && data.lv < maxLevel ? itemInfo.transValue(DataMgr.getBuildingInfoItemWithLv(info.id, itemName, data.lv + 1)) : null;
                progInfo['valueCur'] = itemInfo.transValue(DataMgr.getBuildingInfoItemWithLv(info.id, itemName, data ? data.lv : 0));
                progInfo['unit'] = itemInfo.getUnit();
                if (i < this.progressFrameList.length) {
                    node = this.progressFrameList[i];
                } else {
                    node = cc.instantiate(this.progressFrameTemplate);
                    node.parent = this.progressFrameContainer;
                    this.progressFrameList.push(node);
                    node.active = true;
                }

                node.getComponent(BuildingInfoProgressFrame).refresh(progInfo);
                i++;
            }
        }
        for (; i < this.progressFrameList.length; i++) {
            this.progressFrameList[i].destroy();
        }
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

        CvsMain.ClosePanel(BuildingInfoPanel);
        CvsMain.ClosePanel(BuildPanel);
        CityUI.Instance.enterBuildMode(info);
    }
    onUpgradeClick() {

        let info = this.info;
        let curCargoData = DataMgr.getUserCurrentCargoData(DataMgr.myUser);
        //check cargo
        let cargoEnough = true;
        for (let i = 0; i < 3; i++) {
            let itemName = "BuildMat" + i;
            let cargoName = info[itemName];
            if (cargoName) {
                let cntItemName = itemName + "Cnt";
                let needCnt = DataMgr.getBuildingInfoItemWithLv(this.info.id, cntItemName, this.data.lv + 1);
                if (curCargoData[cargoName] < needCnt) {
                    cargoEnough = false;
                }
            }
        }

        if (!cargoEnough) {
            ToastPanel.Toast('某些货物不足。如果强行发送区块链交易，可能失败。');
        }
        let ij = [this.ij.i, this.ij.j];
        BlockchainMgr.Instance.callFunction('upgradeBuilding', ij, 0,
            (resp) => {
                if (resp.toString().substr(0, 5) != 'Error') {
                    DialogPanel.PopupWith2Buttons('正在递交升级计划',
                        '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                            window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                        }, '确定', null);
                } else {
                    ToastPanel.Toast('交易失败:' + resp);
                }
            }
        );
    }

    static Show(idOrInfo: string | BuildingInfo) {
        let info: BuildingInfo;
        if (typeof (idOrInfo) == 'string') {
            info = DataMgr.BuildingConfig['find'](i => i.id == idOrInfo);
        } else {
            info = idOrInfo;
        }
        CvsMain.OpenPanel(BuildingInfoPanel, () => BuildingInfoPanel.Instance.setAndRefreshInfo(info));
    }
    static ShowBuildingData(ij: IJ, bdg: BuildingData) {
        CvsMain.OpenPanel(BuildingInfoPanel, () => BuildingInfoPanel.Instance.setAndRefreshBuilding(ij, bdg));
    }

    close() {
        this.node.destroy();
        BuildingInfoPanel.Instance = null;
    }
}