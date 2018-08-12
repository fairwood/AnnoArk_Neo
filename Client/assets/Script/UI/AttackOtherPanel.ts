import { DataMgr, UserData } from "../DataMgr";
import BlockchainMgr from "../BlockchainMgr";
import ToastPanel from "./ToastPanel";
import DialogPanel from "./DialogPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttackOtherPanel extends cc.Component {
    static Instance: AttackOtherPanel;
    onLoad() { AttackOtherPanel.Instance = this; }

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

    user: UserData;

    setAndRefresh(user: UserData) {
        this.user = user;

        this.user = user;
        this.lblTitle.string = user.nickname;
        this.lblLv.string = DataMgr.getUserLevel(user).toFixed();

        let cargoData = DataMgr.getUserCurrentCargoData(user);
        this.lblDefTank.string = (cargoData['tank'] || 0).toFixed();
        this.lblDefChopper.string = (cargoData['chopper'] || 0).toFixed();
        this.lblDefShip.string = (cargoData['ship'] || 0).toFixed();

        this.SldAtkTank.progress = 0;
        this.SldAtkChopper.progress = 0;
        this.SldAtkShip.progress = 0;
        this.onSliderChange(null, 'Tank');
        this.onSliderChange(null, 'Chopper');
        this.onSliderChange(null, 'Ship');
        this.refreshDistance();
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
        this.refreshDistance();
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
        this.refreshDistance();
    }

    update(dt) {
        let cargoData = DataMgr.getUserCurrentCargoData(DataMgr.myUser);
        this.tankMax = Math.floor(cargoData['tank']);
        this.lblAtkTankMax.string = '/' + this.tankMax.toFixed();
        this.chopperMax = Math.floor(cargoData['chopper']);
        this.lblAtkChopperMax.string = '/' + this.chopperMax.toFixed();
        this.shipMax = Math.floor(cargoData['ship']);
        this.lblAtkShipMax.string = '/' + this.shipMax.toFixed();
    }

    refreshDistance() {
        const location = DataMgr.getUserCurrentLocation(this.user);
        const distance = location.sub(DataMgr.getUserCurrentLocation(DataMgr.myUser)).mag();
        this.lblDistance.string = distance.toFixed() + 'km';
    }

    onConfirmClick() {
        console.log('想要攻打玩家', this.user.address);

        const location = DataMgr.getUserCurrentLocation(this.user);
        const myPos = DataMgr.getUserCurrentLocation(DataMgr.myUser);
        const distance = location.sub(myPos).mag();

        if (distance > 100) {
            DialogPanel.PopupWith2Buttons('警告：可能失败的区块链调用', '距离100km之内才能攻打其他玩家，强行发送交易可能会失败。', '确定', null, '强行发送', this.confirmAttack.bind(this));
        } else {
            this.confirmAttack();
        }
    }

    private confirmAttack() {
        const tank = Math.round(this.SldAtkTank.progress * this.tankMax);
        const chopper = Math.round(this.SldAtkChopper.progress * this.chopperMax);
        const ship = Math.round(this.SldAtkShip.progress * this.shipMax);
        BlockchainMgr.Instance.callFunction('attackUserCity',
            [this.user.address, { tank: tank, chopper: chopper, ship: ship }], 0,
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
        AttackOtherPanel.Instance = null;
    }
}
