import { DataMgr } from "../DataMgr";
import Island from "../World/Island";
import BlockchainMgr from "../BlockchainMgr";
import DialogPanel from "../DialogPanel";
import ToastPanel from "./ToastPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttackPiratePanel extends cc.Component {
    static Instance: AttackPiratePanel;
    onLoad() { AttackPiratePanel.Instance = this; }

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

    @property(cc.Label)
    lblAtkTankMax: cc.Label = null;
    @property(cc.Label)
    lblAtkChopperMax: cc.Label = null;
    @property(cc.Label)
    lblAtkShipMax: cc.Label = null;
    @property(cc.EditBox)
    edtAtkTank: cc.EditBox = null;
    @property(cc.EditBox)
    edtAtkChopper: cc.EditBox = null;
    @property(cc.EditBox)
    edtAtkShip: cc.EditBox = null;
    @property(cc.Slider)
    SldAtkTank: cc.Slider = null;
    @property(cc.Slider)
    SldAtkChopper: cc.Slider = null;
    @property(cc.Slider)
    SldAtkShip: cc.Slider = null;
    @property(cc.Label)
    lblDistance: cc.Label = null;

    tankMax = 0;
    chopperMax = 0;
    shipMax = 0;

    pirateData;

    setAndRefresh(pirateData: any) {
        this.pirateData = pirateData;

        this.pirateData = pirateData;
        this.lblTitle.string = '海盗 #' + pirateData.index.toString();
        this.lblLv.string = pirateData.lv.toString();

        this.lblDefTank.string = (pirateData.army.tank).toFixed();
        this.lblDefChopper.string = (pirateData.army.chopper).toFixed();
        this.lblDefShip.string = (pirateData.army.ship).toFixed();

        this.SldAtkTank.progress = 0;
        this.SldAtkChopper.progress = 0;
        this.SldAtkShip.progress = 0;
        this.onSliderChange(null, 'Tank');
        this.onSliderChange(null, 'Chopper');
        this.onSliderChange(null, 'Ship');
        this.refreshch4Cost();
    }

    onSliderChange(event, cargoName: string) {
        switch (cargoName) {
            case 'Tank':
                this.edtAtkTank.string = (this.SldAtkTank.progress * this.tankMax).toFixed();
                break;
            case 'Chopper':
                this.edtAtkChopper.string = (this.SldAtkChopper.progress * this.chopperMax).toFixed();
                break;
            case 'Ship':
                this.edtAtkShip.string = (this.SldAtkShip.progress * this.shipMax).toFixed();
                break;
        }
        this.refreshch4Cost();
    }

    onEditBoxChange(event, cargoName: string) {
        switch (cargoName) {
            case 'Tank':
                let count = parseInt(this.edtAtkTank.string);
                count = Math.max(0, Math.min(this.tankMax, count));
                this.edtAtkTank.string = count.toFixed();
                this.SldAtkTank.progress = count / this.tankMax;
                break;
            case 'Chopper':
                count = parseInt(this.edtAtkChopper.string);
                count = Math.max(0, Math.min(this.chopperMax, count));
                this.edtAtkChopper.string = count.toFixed();
                this.SldAtkChopper.progress = count / this.chopperMax;
                break;
            case 'Ship':
                count = parseInt(this.edtAtkShip.string);
                count = Math.max(0, Math.min(this.shipMax, count));
                this.edtAtkShip.string = count.toFixed();
                this.SldAtkShip.progress = count / this.shipMax;
                break;
        }
        this.refreshch4Cost();
    }

    update(dt) {
        let cargoData = DataMgr.myUser.cargoData;
        this.tankMax = Math.floor(cargoData['tank']);
        this.lblAtkTankMax.string = '/' + this.tankMax.toFixed();
        this.chopperMax = Math.floor(cargoData['chopper']);
        this.lblAtkChopperMax.string = '/' + this.chopperMax.toFixed();
        this.shipMax = Math.floor(cargoData['ship']);
        this.lblAtkShipMax.string = '/' + this.shipMax.toFixed();
    }

    refreshch4Cost() {
        const pirateLocation = new cc.Vec2(this.pirateData.x, this.pirateData.y);
        const distance = pirateLocation.sub(DataMgr.getUserCurrentLocation(DataMgr.myUser)).mag();
        this.lblDistance.string = distance.toFixed() + 'km';
    }

    onConfirmClick() {
        console.log('想要攻打海盗', this.pirateData.index);

        const pirateLocation = new cc.Vec2(this.pirateData.x, this.pirateData.y);
        const myPos = DataMgr.getUserCurrentLocation(DataMgr.myUser);
        const distance = pirateLocation.sub(myPos).mag();

        if (distance > 300) {
            DialogPanel.PopupWith2Buttons('警告：可能失败的区块链调用', '距离300km之内才能攻打海盗，强行发送交易可能会失败。', '确定', null, '强行发送', this.confirmAttack);
            return;
        }

        this.confirmAttack();
    }

    private confirmAttack() {
        const tank = Math.round(this.SldAtkTank.progress * this.tankMax);
        const chopper = Math.round(this.SldAtkChopper.progress * this.chopperMax);
        const ship = Math.round(this.SldAtkShip.progress * this.shipMax);
        BlockchainMgr.Instance.callFunction('attackPirate',
            [this.pirateData.index, { tank: tank, chopper: chopper, ship: ship }], 0,
            (resp) => {
                if (resp.toString().substr(0, 5) != 'Error') {
                    DialogPanel.PopupWith2Buttons('正在递交作战计划',
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
        this.node.destroy();
        AttackPiratePanel.Instance = null;
    }
}
