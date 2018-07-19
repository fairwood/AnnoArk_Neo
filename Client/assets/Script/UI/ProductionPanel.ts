import { DataMgr, BuildingData, IJ } from "../DataMgr";
import Island from "../World/Island";
import BlockchainMgr from "../BlockchainMgr";
import DialogPanel from "../DialogPanel";
import AsyncLoadSprite from "./AsyncLoadSprite";
import ToastPanel from "./ToastPanel";
import Building from "../City/Building";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ProductionPanel extends cc.Component {
    static Instance: ProductionPanel;
    onLoad() { ProductionPanel.Instance = this; this.node.active = false; }

    @property(AsyncLoadSprite)
    sprPic: AsyncLoadSprite = null;

    @property(cc.Label)
    lblBuildingName: cc.Label = null;
    @property(cc.Label)
    lblLevel: cc.Label = null;

    @property(cc.Label)
    lblMax: cc.Label = null;
    @property(cc.EditBox)
    edtAmt: cc.EditBox = null;
    @property(cc.Slider)
    SldAmt: cc.Slider = null;

    @property(cc.Label)
    lblIn0: cc.Label = null;
    @property(cc.Label)
    lblIn1: cc.Label = null;
    @property(cc.Label)
    lblCd: cc.Label = null;

    maxAmt = 0;

    building: Building;
    buildingData: BuildingData;

    setAndRefresh(building: Building, buildingData: BuildingData) {
        this.building = building;
        this.buildingData = buildingData;
        this.SldAmt.progress = 0;
        this.onSliderChange();

        const maxCD = DataMgr.getBuildingInfoItemWithLv(buildingData.id, 'MaxCD', buildingData.lv);
        const cdPerUnit = DataMgr.getBuildingInfoItemWithLv(buildingData.id, 'CDPerUnit', buildingData.lv);
        this.maxAmt = Math.floor(maxCD / cdPerUnit);
        this.lblMax.string = '/' + this.maxAmt.toFixed();

        this.refreshCost();
    }

    onSliderChange() {
        this.edtAmt.string = Math.floor(this.SldAmt.progress * this.maxAmt).toFixed();
        this.refreshCost();
    }

    onEditBoxChange() {
        let count = parseInt(this.edtAmt.string);
        count = Math.max(0, Math.min(this.maxAmt, count));
        this.edtAmt.string = count.toFixed();
        this.SldAmt.progress = count / this.maxAmt;
        this.refreshCost();
    }

    update(dt) {
    }

    refreshCost() {
        const in0Amt = DataMgr.getBuildingInfoItemWithLv(this.buildingData.id, 'In0Amt', this.buildingData.lv);
        const in1Amt = DataMgr.getBuildingInfoItemWithLv(this.buildingData.id, 'In1Amt', this.buildingData.lv);
        const cdPerUnit = DataMgr.getBuildingInfoItemWithLv(this.buildingData.id, 'CDPerUnit', this.buildingData.lv);
        const count = Math.floor(this.SldAmt.progress * this.maxAmt);
        this.lblIn0.string = in0Amt > 0 ? in0Amt * count + ' 铁' : '';
        this.lblIn1.string = in1Amt > 0 ? in1Amt * count + ' 反物质' : '';
        const cd = cdPerUnit * count;
        this.lblCd.string = Math.floor(cd) + 'h' + Math.floor((cd - Math.floor(cd)) * 60) + 'min';
    }

    onConfirmClick() {
        console.log('准备生产', this.buildingData);
        const count = Math.floor(this.SldAmt.progress * this.maxAmt);

        if (count <= 0) {
            ToastPanel.Toast("生产数量必须大于0");
            return;
        }

        const in0Amt = DataMgr.getBuildingInfoItemWithLv(this.buildingData.id, 'In0Amt', this.buildingData.lv);
        const in1Amt = DataMgr.getBuildingInfoItemWithLv(this.buildingData.id, 'In1Amt', this.buildingData.lv);
        const curCargoData = DataMgr.getUserCurrentCargoData(DataMgr.myData);
        if (!(in0Amt * count <= curCargoData['iron'])) {
            DialogPanel.PopupWith1Button('铁不足', '采集更多或者减少生产份数', '确定', null);
            return;
        }
        if (!(in1Amt * count <= curCargoData['energy'])) {
            DialogPanel.PopupWith1Button('反物质不足', '采集更多或者减少生产份数', '确定', null);
            return;
        }


        //check Warehouse
        let user = DataMgr.myData;
        let info = DataMgr.getBuildingInfo(this.buildingData.id);
        let out0 = info['Out0'];
        ;
        let warehouseCap = DataMgr.getUserWarehouseCap(out0);
        console.log('user.cargoData[out0]', user.cargoData[out0], count, warehouseCap)
        if (user.cargoData[out0] + count > warehouseCap) {//TODO:user.cargoData[out0] == undefined
            ToastPanel.Toast('仓库容量不够');
            return;
        }


        let ij = JSON.parse('[' + this.building.node.name + ']');
        BlockchainMgr.Instance.callFunction('produce', [ij[0], ij[1], count], 0,
            (resp) => {
                if (resp.toString().substr(0, 5) != 'Error') {
                    DialogPanel.PopupWith2Buttons('正在递交生产计划',
                        '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                            window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                        }, '确定', null);
                } else {
                    ToastPanel.Toast('交易失败:' + resp);
                }
            }
        );
    }

    close() {
        this.node.active = false;
    }
}
