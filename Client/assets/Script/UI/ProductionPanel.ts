import { DataMgr, BuildingData } from "../DataMgr";
import BlockchainMgr from "../BlockchainMgr";
import AsyncLoadSprite from "./AsyncLoadSprite";
import ToastPanel from "./ToastPanel";
import Building from "../City/Building";
import DialogPanel from "./DialogPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ProductionPanel extends cc.Component {
    static Instance: ProductionPanel;
    onLoad() { ProductionPanel.Instance = this; this.init(); }

    @property(cc.Sprite)
    sprPic: cc.Sprite = null;

    @property(cc.Label)
    lblTitle: cc.Label = null;
    @property(cc.Label)
    lblLv: cc.Label = null;

    @property(cc.Node)
    inContainer: cc.Node = null;
    @property(cc.Label)
    lblIn0: cc.Label = null;
    @property(cc.Label)
    lblOut0: cc.Label = null;
    @property(cc.Label)
    lblOut0Down: cc.Label = null;
    @property(cc.Label)
    lblCd: cc.Label = null;

    @property(cc.Label)
    lblMax: cc.Label = null;
    @property(cc.EditBox)
    edtAmt: cc.EditBox = null;
    @property(cc.Slider)
    SldAmt: cc.Slider = null;

    maxAmt = 0;

    building: Building;
    buildingData: BuildingData;

    normalColor: cc.Color;
    inList = [];

    init() {
        this.inList.push(this.lblIn0);
        for (let i = 1; i < 4; i++) {
            let node = cc.instantiate(this.lblIn0.node);
            node.parent = this.inContainer;
            this.inList.push(node.getComponent(cc.Label));
        }
        this.normalColor = this.lblIn0.node.color;
    }

    setAndRefresh(building: Building, buildingData: BuildingData) {
        this.building = building;
        this.buildingData = buildingData;
        this.SldAmt.progress = 0;
        this.onSliderChange();

        const maxQueue = DataMgr.getBuildingInfoItemWithLv(buildingData.id, 'MaxQueue', buildingData.lv);
        this.maxAmt = Math.floor(maxQueue);
        this.lblMax.string = '/' + this.maxAmt.toFixed();

        if (this.sprPic) {
            try {
                let self = this;
                let info = this.building.info;
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

        this.refresh();
    }

    onSliderChange() {
        this.edtAmt.string = Math.floor(this.SldAmt.progress * this.maxAmt).toFixed();
        this.refresh();
    }

    onEditBoxChange() {
        let count = parseInt(this.edtAmt.string);
        count = Math.max(0, Math.min(this.maxAmt, count));
        this.edtAmt.string = count.toFixed();
        this.SldAmt.progress = count / this.maxAmt;
        this.refresh();
    }

    refresh() {
        const count = Math.floor(this.SldAmt.progress * this.maxAmt);
        let cargoData = DataMgr.getUserCurrentCargoData(DataMgr.myUser);
        let info = this.building.info;
        for (let i = 0; i < 4; i++) {
            let cargoName = info['In' + i];
            let lbl = this.inList[i];
            if (cargoName) {
                let amt = DataMgr.getBuildingInfoItemWithLv(info.id, 'In' + i + 'Amt', this.buildingData.lv) * count;
                let cargoDisplayName = DataMgr.getCargoInfo(cargoName).Name;
                lbl.string = `${amt.toFixed()} ${cargoDisplayName}`;
                lbl.node.color = amt <= (cargoData[cargoName] || 0) ? this.normalColor : cc.Color.RED;
                lbl.node.active = true;
            } else {
                lbl.node.active = false;
            }
        }
        let out0DisplayName = DataMgr.getCargoInfo(info.Out0).Name;
        this.lblOut0.string = `${count} ${out0DisplayName}`;
        this.lblOut0Down.string = out0DisplayName;
        const cdPerUnit = DataMgr.getBuildingInfoItemWithLv(this.buildingData.id, 'CDPerUnit', this.buildingData.lv);
        const cd = cdPerUnit * count;
        this.lblCd.string = Math.floor(cd / 60) + 'h' + Math.floor(cd) + 'min';
    }

    onConfirmClick() {
        console.log('准备生产', this.buildingData);

        let user = DataMgr.myUser;
        const count = Math.floor(this.SldAmt.progress * this.maxAmt);
        let cargoData = DataMgr.getUserCurrentCargoData(user);
        let info = this.building.info;
        let enough = true;
        for (let i = 0; i < 4; i++) {
            let cargoName = info['In' + i];
            if (cargoName) {
                let amt = DataMgr.getBuildingInfoItemWithLv(info.id, 'In' + i + 'Amt', this.buildingData.lv) * count;
                if (amt > (cargoData[cargoName] || 0)) {
                    enough = false;
                }
            }
        }

        //check Warehouse
        let out0 = info['Out0'];
        let warehouseCap = DataMgr.getUserWarehouseCap(user, out0);
        if (user.cargoData[out0] + count > warehouseCap) {//TODO:user.cargoData[out0] == undefined
            ToastPanel.Toast('仓库容量不够，如果强行生产，超出容量的部分会被销毁哦');
        }

        let self = this;
        const callBlockchain = () => {
            let ij = JSON.parse('[' + self.building.node.name + ']');
            BlockchainMgr.Instance.callFunction('produce', [ij[0], ij[1], count], 0,
                (resp) => {
                    if (resp.toString().substr(0, 5) != 'Error') {
                        DialogPanel.PopupWith2Buttons('正在递交生产计划',
                            '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                                window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                            }, '确定', null);
                        self.close();
                    } else {
                        ToastPanel.Toast('交易失败:' + resp);
                    }
                }
            );
        }

        if (enough) {
            callBlockchain();
        } else {
            DialogPanel.PopupWith2Buttons('某些原料存货不足', '强行发送区块链交易可能失败', '确定', null, '强行发送', callBlockchain);
        }
    }

    close() {
        this.node.destroy();
        ProductionPanel.Instance = null;
    }
}
