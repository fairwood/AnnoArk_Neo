import { DataMgr, UserData, IslandData } from "../DataMgr";
import BlockchainMgr from "../BlockchainMgr";
import ToastPanel from "./ToastPanel";
import DialogPanel from "./DialogPanel";
import CurrencyFormatter from "../Utils/CurrencyFormatter";
import { FlagMgr } from "./FlagMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CityInfoPanel extends cc.Component {
    static Instance: CityInfoPanel;
    onLoad() { CityInfoPanel.Instance = this; }

    static readonly attackUserDistanceLimit = 100;
    static readonly attackPirateDistanceLimit = 300;
    static readonly attackIslandDistanceLimit = 100;

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
    @property(cc.Sprite)
    sprPic: cc.Sprite = null;

    @property(cc.Node)
    grpWatch: cc.Node = null;
    @property(cc.Node)
    grpAttack: cc.Node = null;
    @property(cc.Node)
    grpWatchCity: cc.Node = null;
    @property(cc.Node)
    grpWatchIsland: cc.Node = null;
    @property(cc.Node)
    grpWatchCityUser: cc.Node = null;
    @property(cc.Node)
    grpLv: cc.Node = null;

    @property(cc.Label)
    lblHull: cc.Label = null;
    @property(cc.Node)
    cargoFrameTemplate: cc.Node = null;
    @property(cc.Node)
    cargoFrameContainer: cc.Node = null;
    cargoFrameList = [];

    @property(cc.Label)
    lblDistanceLimit: cc.Label = null;
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
    lblMineRate: cc.Label = null;
    @property(cc.Label)
    lblOccupantNickname: cc.Label = null;
    @property(cc.Label)
    lblOccupantAddress: cc.Label = null;
    @property(cc.Label)
    lblTotalMoney: cc.Label = null;
    @property(cc.Label)
    lblWantToAttack: cc.Label = null;
    @property(cc.Label)
    lblConfirmAttack: cc.Label = null;
    @property(cc.Sprite)
    sprFlag: cc.Sprite = null;

    tankMax = 0;
    chopperMax = 0;
    shipMax = 0;

    user: UserData;
    pirateData;
    islandData: IslandData;

    setAndRefreshUser(user: UserData, mode: string) {
        this.pirateData = null;
        this.islandData = null;
        this.user = user;

        this.lblTitle.string = user.nickname;
        this.lblLv.string = DataMgr.getUserLevel(user).toFixed();

        let cargoData = DataMgr.getUserCurrentCargoData(user);
        this.lblDefTank.string = (cargoData['tank'] || 0).toFixed();
        this.lblDefChopper.string = (cargoData['chopper'] || 0).toFixed();
        this.lblDefShip.string = (cargoData['ship'] || 0).toFixed();

        this.lblDistanceLimit.string = CityInfoPanel.attackUserDistanceLimit + 'km';

        switch (mode) {
            case 'watch':
                {
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

                    this.grpWatch.active = true;
                    this.grpAttack.active = false;
                    this.grpWatchCity.active = true;
                    this.grpWatchIsland.active = false;
                    this.grpWatchCityUser.active = true;
                    break;
                }
            case 'attack':
                {
                    this.SldAtkTank.progress = 0;
                    this.SldAtkChopper.progress = 0;
                    this.SldAtkShip.progress = 0;
                    this.onSliderChange(null, 'Tank');
                    this.onSliderChange(null, 'Chopper');
                    this.onSliderChange(null, 'Ship');
                    this.refreshDistance();

                    this.grpWatch.active = false;
                    this.grpAttack.active = true;
                    break;
                }
        }
        this.grpLv.active = true;
        this.refreshDistance();
    }
    setAndRefreshPirate(pirateData: any, mode: string) {
        this.user = null;
        this.islandData = null;
        this.pirateData = pirateData;

        this.lblTitle.string = '海盗 #' + pirateData.index.toString();
        this.lblLv.string = pirateData.lv.toString();

        this.lblDefTank.string = (pirateData.army.tank || 0).toFixed();
        this.lblDefChopper.string = (pirateData.army.chopper || 0).toFixed();
        this.lblDefShip.string = (pirateData.army.ship || 0).toFixed();

        this.lblDistanceLimit.string = CityInfoPanel.attackPirateDistanceLimit + 'km';

        switch (mode) {
            case 'watch':
                {
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

                    this.grpWatch.active = true;
                    this.grpAttack.active = false;
                    this.grpWatchCity.active = true;
                    this.grpWatchIsland.active = false;
                    this.grpWatchCityUser.active = false;
                    break;
                }
            case 'attack':
                {
                    this.SldAtkTank.progress = 0;
                    this.SldAtkChopper.progress = 0;
                    this.SldAtkShip.progress = 0;
                    this.onSliderChange(null, 'Tank');
                    this.onSliderChange(null, 'Chopper');
                    this.onSliderChange(null, 'Ship');
                    this.refreshDistance();

                    this.grpWatch.active = false;
                    this.grpAttack.active = true;
                    break;
                }
        }
        this.grpLv.active = true;
        this.refreshDistance();
    }
    setAndRefreshIsland(data: IslandData, mode: string) {
        this.user = null;
        this.islandData = data;
        this.pirateData = null;

        this.lblTitle.string = '钻石岛 sponsered by ' + data.sponsorName;

        if (data.occupant && data.occupant.length > 0) {
            let occupantUser: UserData = DataMgr.allUsers[data.occupant];
            FlagMgr.setFlag(this.sprFlag, occupantUser ? occupantUser.country : null);
            this.lblOccupantNickname.string = occupantUser ? occupantUser.nickname : '';
        } else {
            this.lblOccupantNickname.string = '(无)';
        }
        this.lblOccupantAddress.string = data.occupant;

        this.lblDefTank.string = (data.army.tank || 0).toFixed();
        this.lblDefChopper.string = (data.army.chopper || 0).toFixed();
        this.lblDefShip.string = (data.army.ship || 0).toFixed();

        this.lblDistanceLimit.string = CityInfoPanel.attackIslandDistanceLimit + 'km';

        let amIOccupant = DataMgr.myUser.address == data.occupant;
        switch (mode) {
            case 'watch':
                {
                    this.lblWantToAttack.string = amIOccupant ? '追加' : '进攻';

                    this.grpWatch.active = true;
                    this.grpAttack.active = false;
                    this.grpWatchCity.active = false;
                    this.grpWatchIsland.active = true;
                    this.grpWatchCityUser.active = false;
                    break;
                }
            case 'attack':
                {
                    this.lblConfirmAttack.string = amIOccupant ? '追加' : '进攻';

                    let powerAttenuRate = 0.05;
                    let hoursDelta = (DataMgr.getBlockchainTimestamp() - data.lastCalcTime) / (3600e3);
                    let attenu = Math.exp(-powerAttenuRate * hoursDelta);
                    this.lblDefTank.string = ((data.army.tank || 0) * attenu).toFixed();
                    this.lblDefChopper.string = ((data.army.chopper || 0) * attenu).toFixed();
                    this.lblDefShip.string = ((data.army.ship || 0) * attenu).toFixed();
                    this.SldAtkTank.progress = 0;
                    this.SldAtkChopper.progress = 0;
                    this.SldAtkShip.progress = 0;
                    this.onSliderChange(null, 'Tank');
                    this.onSliderChange(null, 'Chopper');
                    this.onSliderChange(null, 'Ship');

                    this.grpWatch.active = false;
                    this.grpAttack.active = true;
                    break;
                }
        }
        this.grpLv.active = false;
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
        switch (true) {
            case this.grpAttack.active:
                {
                    let cargoData = DataMgr.getUserCurrentCargoData(DataMgr.myUser);
                    this.tankMax = Math.floor(cargoData['tank']);
                    this.lblAtkTankMax.string = '/' + this.tankMax.toFixed();
                    this.chopperMax = Math.floor(cargoData['chopper']);
                    this.lblAtkChopperMax.string = '/' + this.chopperMax.toFixed();
                    this.shipMax = Math.floor(cargoData['ship']);
                    this.lblAtkShipMax.string = '/' + this.shipMax.toFixed();

                    this.refreshDistance();
                    break;
                }
        }
        if (this.islandData) {
            let curMoney = DataMgr.calcCurrentMoneyInIsland(this.islandData);
            let speed = this.islandData.miningRate * curMoney / 1e18;
            this.lblMineRate.string = CurrencyFormatter.formatNAS(speed) + DataMgr.coinUnit + '/h';
            this.lblTotalMoney.string = CurrencyFormatter.formatNAS(curMoney / 1e18) + DataMgr.coinUnit;
        }
    }

    refreshDistance() {
        let location: cc.Vec2;
        if (this.user) {
            location = DataMgr.getUserCurrentLocation(this.user);
        } else if (this.pirateData) {
            location = new cc.Vec2(this.pirateData.x, this.pirateData.y);
        } else if (this.islandData) {
            location = new cc.Vec2(this.islandData.x, this.islandData.y);
        }
        const distance = location.sub(DataMgr.getUserCurrentLocation(DataMgr.myUser)).mag();
        this.lblDistance.string = distance.toFixed() + 'km';
    }

    onWantToAttackClick() {
        if (this.user) {
            console.log('想要攻打玩家', this.user.address);
            const refresh = (data) => {
                CityInfoPanel.Instance.setAndRefreshUser(data, 'attack');
            };
            refresh(DataMgr.allUsers[this.user.address]);
            DataMgr.fetchUserDataFromBlockchain(this.user.address, refresh);
        } else if (this.pirateData) {
            console.log('想要攻打海盗', this.pirateData.index);
            const refresh = (data) => {
                CityInfoPanel.Instance.setAndRefreshPirate(data, 'attack');
            };
            refresh(DataMgr.getPirateData(this.pirateData.index));
            DataMgr.fetchPirateDataFromBlockchain(this.pirateData.index, refresh);
        } else if (this.islandData) {
            console.log('想要攻打钻石岛', this.islandData.index);
            const refresh = (data) => {
                CityInfoPanel.Instance.setAndRefreshIsland(data, 'attack');
            };
            refresh(DataMgr.allIslandData[this.islandData.index]);
            // DataMgr.fetchPirateDataFromBlockchain(this.pirateData.index, refresh);
        }
    }
    onConfirmAttackClick() {
        const myPos = DataMgr.getUserCurrentLocation(DataMgr.myUser);
        if (this.user) {
            console.log('确认攻打玩家', this.user.address);

            const location = DataMgr.getUserCurrentLocation(this.user);
            const distance = location.sub(myPos).mag();

            if (distance > 100) {
                DialogPanel.PopupWith2Buttons('警告：可能失败的区块链调用', '距离100km之内才能攻打其他玩家，强行发送交易可能会失败。', '确定', null, '强行发送', this.confirmAttack.bind(this));
            } else {
                this.confirmAttack();
            }
        } else if (this.pirateData) {
            console.log('确认攻打海盗', this.pirateData.index);

            const location = new cc.Vec2(this.pirateData.x, this.pirateData.y);
            const distance = location.sub(myPos).mag();

            if (distance > 300) {
                DialogPanel.PopupWith2Buttons('警告：可能失败的区块链调用', '距离300km之内才能攻打海盗，强行发送交易可能会失败。', '确定', null, '强行发送', this.confirmAttack.bind(this));
                return;
            }

            this.confirmAttack();
        }
        else if (this.islandData) {
            const location = new cc.Vec2(this.islandData.x, this.islandData.y);
            const distance = location.sub(myPos).mag();

            if (distance > 100) {
                DialogPanel.PopupWith2Buttons('警告：可能失败的区块链调用', '距离100km之内才能攻打其他玩家，强行发送交易可能会失败。', '确定', null, '强行发送', this.confirmAttack.bind(this));
            } else {
                this.confirmAttack();
            }

        }
    }

    private confirmAttack() {
        const tank = Math.round(this.SldAtkTank.progress * this.tankMax);
        const chopper = Math.round(this.SldAtkChopper.progress * this.chopperMax);
        const ship = Math.round(this.SldAtkShip.progress * this.shipMax);
        const callback = (resp) => {
            if (resp.toString().substr(0, 5) != 'Error') {
                DialogPanel.PopupWith2Buttons('正在递交作战计划',
                    '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                        window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                    }, '确定', null);
            } else {
                ToastPanel.Toast('交易失败:' + resp);
            }
        };
        if (this.user) {
            BlockchainMgr.Instance.callFunction('attackUserCity',
                [this.user.address, { tank: tank, chopper: chopper, ship: ship }], 0, callback
            );
        } else if (this.pirateData) {
            BlockchainMgr.Instance.callFunction('attackPirate',
                [this.pirateData.index, { tank: tank, chopper: chopper, ship: ship }], 0, callback
            );
        } else if (this.islandData) {
            BlockchainMgr.Instance.callFunction('attackIsland',
                [this.islandData.index, { tank: tank, chopper: chopper, ship: ship }], 0, callback
            );
        }
    }

    onOccupantClick() {
        //打开区块链浏览器
        window.open(BlockchainMgr.getExplorerOfAccount(this.islandData.occupant));
    }

    close() {
        this.node.destroy();
        CityInfoPanel.Instance = null;
    }
}
