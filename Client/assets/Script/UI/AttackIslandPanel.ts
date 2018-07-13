import { DataMgr } from "../DataMgr";
import Island from "../World/Island";
import BlockchainMgr from "../BlockchainMgr";
import DialogPanel from "../DialogPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AttackIslandPanel extends cc.Component {
    static Instance: AttackIslandPanel;
    onLoad() { AttackIslandPanel.Instance = this; this.node.active = false; }

    @property(cc.Label)
    lblOccupant: cc.Label = null;
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
    @property(cc.Label)
    lblMethane: cc.Label = null;
    @property(cc.Label)
    lblConfirmButton: cc.Label = null;

    tankMax = 0;
    chopperMax = 0;
    shipMax = 0;

    island: Island;

    setAndRefresh(island: Island) {
        this.island = island;

        let amIOccupant = DataMgr.myData.address == island.data.occupant;
        let data = amIOccupant ? DataMgr.myData : DataMgr.othersData.find(d => d.address == island.data.occupant);
        this.lblOccupant.string = data ? data.nickname : island.data.occupant;
        this.lblConfirmButton.string = amIOccupant ? '追加' : '进攻';

        let powerAttenuRate = 0.05;
        let hoursDelta = (Number(new Date()) - island.data.lastBattleTime) / (1000 * 3600);
        let attenu = Math.exp(-powerAttenuRate * hoursDelta);
        this.lblDefTank.string = (island.data.tankPower * attenu).toFixed();
        this.lblDefChopper.string = (island.data.chopperPower * attenu).toFixed();
        this.lblDefShip.string = (island.data.shipPower * attenu).toFixed();
        this.SldAtkTank.progress = 0;
        this.SldAtkChopper.progress = 0;
        this.SldAtkShip.progress = 0;
        this.onSliderChange(null, 'Tank');
        this.onSliderChange(null, 'Chopper');
        this.onSliderChange(null, 'Ship');
        this.refreshMethaneCost();
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
        this.refreshMethaneCost();
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
        this.refreshMethaneCost();
    }

    update(dt) {
        this.tankMax = Math.floor(DataMgr.myCargoData.find(d => d.id == 'tank23532').amount);
        this.lblAtkTankMax.string = '/' + this.tankMax.toFixed();
        this.chopperMax = Math.floor(DataMgr.myCargoData.find(d => d.id == 'chopper424').amount);
        this.lblAtkChopperMax.string = '/' + this.chopperMax.toFixed();
        this.shipMax = Math.floor(DataMgr.myCargoData.find(d => d.id == 'ship40342').amount);
        this.lblAtkShipMax.string = '/' + this.shipMax.toFixed();
    }

    refreshMethaneCost() {
        const distance = this.island.node.position.sub(new cc.Vec2(DataMgr.myData.currentLocation.x, DataMgr.myData.currentLocation.y)).mag();
        const costMethane = DataMgr.getMethaneCostOfAttack(distance,
            Math.round(this.SldAtkTank.progress * this.tankMax),
            Math.round(this.SldAtkChopper.progress * this.chopperMax),
            Math.round(this.SldAtkShip.progress * this.shipMax));
        const totalMethane = DataMgr.myCargoData.find(d => d.id == 'methane74').amount;
        this.lblDistance.string = distance.toFixed() + 'km';
        this.lblMethane.string = costMethane.toFixed() + '/' + totalMethane.toFixed();
    }

    onConfirmClick() {
        console.log('准备攻占资源岛', this.island);

        const distance = this.island.node.position.sub(new cc.Vec2(DataMgr.myData.currentLocation.x, DataMgr.myData.currentLocation.y)).mag();
        const costMethane = DataMgr.getMethaneCostOfAttack(distance,
            Math.round(this.SldAtkTank.progress * this.tankMax),
            Math.round(this.SldAtkChopper.progress * this.chopperMax),
            Math.round(this.SldAtkShip.progress * this.shipMax));
        const methaneData = DataMgr.myCargoData.find(d => d.id == 'methane74');
        if (costMethane <= methaneData.amount) {
            const tank = Math.round(this.SldAtkTank.progress * this.tankMax);
            const chopper = Math.round(this.SldAtkChopper.progress * this.chopperMax);
            const ship = Math.round(this.SldAtkShip.progress * this.shipMax);
            BlockchainMgr.Instance.attackIsland(this.island.data.id, tank, chopper, ship, () => {
                try {
                    methaneData.amount = Math.max(0, methaneData.amount - costMethane);
                    DataMgr.myCargoData.find(d => d.id == 'tank23532').amount -= tank;
                    DataMgr.myCargoData.find(d => d.id == 'chopper424').amount -= chopper;
                    DataMgr.myCargoData.find(d => d.id == 'ship40342').amount -= ship;
                } catch (error) {

                }
            });
        } else {
            DialogPanel.PopupWith1Button('燃料不足', '将方舟靠近目标，减少派兵数量，或者生产更多甲烷吧', '确定', null);
        }
    }

    close() {
        this.node.active = false;
    }
}
