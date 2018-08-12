import CvsMain from "./CvsMain";
import BaseUI from "./BaseUI";
import WorldUI from "./WorldUI";
import { DataMgr, BuildingInfo, IJ, BuildingData } from "./DataMgr";
import BuildPanel from "./UI/BuildPanel";
import Building from "./City/Building";
import DialogPanel from "./UI/DialogPanel";
import BuildingInfoPanel from "./UI/BuildingInfoPanel";
import BlockchainMgr from "./BlockchainMgr";
import ToastPanel from "./UI/ToastPanel";
import ProductionPanel from "./UI/ProductionPanel";
import ProducerBuilding from "./City/ProducerBuilding";
import { ExpandModeContainer } from "./City/ExpandModeContainer";

const { ccclass, property } = cc._decorator;

@ccclass
export default class CityUI extends BaseUI {
    static Instance: CityUI;
    onLoad() {
        CityUI.Instance = this;
        this.node.active = false;

        let self = this;
        this.sldZoom.node.getChildByName('Handle').on(cc.Node.EventType.TOUCH_START, function (event) {
            self.pressingZoomSlider = true;
        });
        this.sldZoom.node.getChildByName('Handle').on(cc.Node.EventType.TOUCH_END, function (event) {
            self.pressingZoomSlider = false;
        });
        this.sldZoom.node.getChildByName('Handle').on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
            self.pressingZoomSlider = false;
        });
        this.panPad.on(cc.Node.EventType.TOUCH_MOVE, this.onPanPadTouchMove, this);
        this.panPad.on(cc.Node.EventType.MOUSE_WHEEL, this.onMouseWheel, this);
        this.panPad.on(cc.Node.EventType.TOUCH_END, this.deselectBuilding, this);

        this.blueprint.on(cc.Node.EventType.TOUCH_MOVE, this.dragBlueprint.bind(this));

        this.floorTemplate.active = false;
        this.hqTemplate.active = false;
        this.producerTemplate.active = false;
        this.collectorTemplate.active = false;
        this.warehouseTemplate.active = false;
        this.launchsiloTemplate.active = false;

        this.expandModeContainer.active = false;
    }

    @property(cc.Node)
    cityMap: cc.Node = null;
    @property(cc.Node)
    city: cc.Node = null;

    @property(cc.Label)
    lblLv: cc.Label = null;
    @property(cc.Label)
    lblHull: cc.Label = null;
    @property(cc.Node)
    cargoLabelContainer: cc.Node = null;
    @property(cc.Node)
    cargoLabelTemplate: cc.Node = null;
    cargoLabels = {};

    @property(cc.Node)
    panPad: cc.Node = null;
    @property(cc.Node)
    focusFrame: cc.Node = null;
    @property(cc.Slider)
    sldZoom: cc.Slider = null;
    pressingZoomSlider = false;
    zoomScale: number = 1;



    start() {
        DataMgr.CargoConfig.forEach(cargoInfo => {
            let labelNode = cc.instantiate(this.cargoLabelTemplate);
            labelNode.parent = this.cargoLabelContainer;
            let label = labelNode.getComponent(cc.Label);
            label.string = cargoInfo.Name;
            this.cargoLabels[cargoInfo.id] = label;
        });
        this.cargoLabelTemplate.active = false;
    }

    onEnable() {
        this.refreshAll();
    }

    refreshZoom() {
        this.cityMap.scale = this.zoomScale;
    }

    _lastRefreshTicks = -1;
    update(dt: number) {

        //刷新建筑
        if (DataMgr.myUser['ticks'] > this._lastRefreshTicks) {
            this._lastRefreshTicks = DataMgr.myUser['ticks'];
            this.refreshAll();
        }

        //货物数据
        let cargoData = DataMgr.getUserCurrentCargoData(DataMgr.myUser);
        for (let i = 0; i < DataMgr.CargoConfig.length; i++) {
            const cargoInfo = DataMgr.CargoConfig[i];
            const cargoName = cargoInfo.id;
            let str: string;
            let warehouseCap = DataMgr.getUserWarehouseCap(DataMgr.myUser, cargoName).toFixed();
            str = cargoInfo.Name + '   ' + Math.floor(cargoData[cargoInfo.id] || 0).toFixed() + '/' + warehouseCap;
            if (DataMgr.getBuildingInfo(cargoName + 'coll')) {
                let rate = DataMgr.getUserCollectorRate(DataMgr.myUser, cargoName);
                str += '(+' + rate.toFixed() + '/min)';
            }
            this.cargoLabels[cargoInfo.id].string = str;
        }
        this.lblLv.string = 'Level ' + DataMgr.getUserLevel(DataMgr.myUser);
        let hull = DataMgr.getUserHull(DataMgr.myUser);
        let str = '完整度 ' + (hull * 100).toFixed() + '%';
        if (hull < 1) str += `(+${(DataMgr.damagePerAttackCity * 100).toFixed()}%/h)`;
        this.lblHull.string = str;
        this.lblHull.node.color = hull > 0.3 ? cc.Color.WHITE : cc.Color.RED;

        //放大缩小
        let prog = this.sldZoom.progress;
        if (!this.pressingZoomSlider) {
            if (prog > 0.5) {
                prog -= 5 * dt;
                if (prog < 0.5) prog = 0.5;
                this.sldZoom.progress = prog;
            } else if (prog < 0.5) {
                prog += 5 * dt;
                if (prog > 0.5) prog = 0.5;
                this.sldZoom.progress = prog;
            }
        }
        if (prog != 0.5) {
            let oldZoomScale = this.zoomScale;
            this.zoomScale *= Math.pow(1.5, (prog - 0.5) * 2 * 5 * dt);
            this.clampZoom();
            let deltaZoom = this.zoomScale / oldZoomScale;
            this.cityMap.position = this.cityMap.position.mul(deltaZoom);
            this.refreshZoom();
        }

        //蓝图模式
        if (this.currentHoldingBlueprint) {
            this.blueprint.active = true;
            this.blueprint.position = new cc.Vec2(this.currentBlueprintIJ.i * 100, this.currentBlueprintIJ.j * 100);
            let ableToBuild = true;
            this.grpBuild.active = true;

            // this.blueprint.setContentSize(100, 100);
            // this.blueprintIndicator.node.setContentSize(100, 100);
            let key = this.currentBlueprintIJ.i + ',' + this.currentBlueprintIJ.j;
            if (DataMgr.myUser.buildingMap[key]) {
                ableToBuild = false;
            } else if (!DataMgr.getCityIJExpanded(DataMgr.myUser, this.currentBlueprintIJ.i, this.currentBlueprintIJ.j)) {
                ableToBuild = false;
            }
            this.btnConfirmBuild.interactable = ableToBuild;
            this.blueprintIndicator.node.color = ableToBuild ? this.canBuildColor : this.cannotBuildColor;
        } else if (this.expandModeContainer.active) {
            this.grpBuild.active = true;
        } else {
            this.blueprint.active = false;
            this.grpBuild.active = false;
        }
        this.lblExpandCost.node.active = this.expandModeContainer.active;

        //选中状态
        if (this.selectedBuilding) {
            this.grpBuildingInfo.active = true;
            this.nodProduceButton.active = (this.selectedBuilding.getComponent(ProducerBuilding) != null);
            this.focusFrame.position = this.selectedBuilding.node.position;
            this.focusFrame.active = true;
        } else {
            this.grpBuildingInfo.active = false;
            this.focusFrame.active = false;
        }
    }

    refreshAll() {
        this.refreshBuildingData();
        this.refreshZoom();
    }

    refreshBuildingData() {
        //floor
        const expandMap = DataMgr.myUser.expandMap;
        for (let key in expandMap) {
            expandMap[key].tmpDirty = true;
        }
        this.floorContainer.children.forEach(floorNode => {
            const key = floorNode.name;
            if (!expandMap[key]) {
                floorNode.destroy();
                return;
            }
            delete expandMap[key].tmpDirty;
        });
        for (let key in expandMap) {
            if (expandMap[key].tmpDirty) {
                let floorNode = cc.instantiate(this.floorTemplate);
                floorNode.parent = this.floorContainer;
                floorNode.name = key;
                let ij = JSON.parse('[' + key + ']');
                floorNode.position = new cc.Vec2(ij[0] * 100, ij[1] * 100);
                floorNode.active = true;
                console.log('createfloor', key, ij);
                delete expandMap[key].tmpDirty;
            }
        }
        //building
        const buildingMap = DataMgr.myUser.buildingMap;
        for (let key in buildingMap) {
            if (buildingMap[key]) buildingMap[key].tmpDirty = true;
        }
        this.buildingContainer.children.forEach(bdgNode => {
            let bdg = bdgNode.getComponent(Building);
            const key = bdgNode.name;
            const bdgOnChain = buildingMap[key];
            if (!bdgOnChain) {
                bdgNode.destroy();
                return;
            }
            if (bdg.info.id != bdgOnChain.id) {
                bdgNode.destroy();
                return;
            }
            bdg.setInfo(bdg.info, bdgOnChain);
            delete bdgOnChain.tmpDirty;
        });
        for (let key in buildingMap) {
            if (buildingMap[key] && buildingMap[key].tmpDirty) {
                const data = buildingMap[key];
                let info = DataMgr.getBuildingInfo(data.id);
                let prefabName = info['Type'] + 'Template';
                let bdgNode = cc.instantiate(this[prefabName]);
                bdgNode.parent = this.buildingContainer;
                bdgNode.name = key;
                let bgd = bdgNode.getComponent(Building);
                let ij = JSON.parse('[' + key + ']');
                bgd.setInfo(info, data);
                bgd.setIJ(ij[0], ij[1]);
                bdgNode.position = new cc.Vec2(ij[0] * 100, ij[1] * 100);
                bdgNode.active = true;
                // console.log('createbd', key, data);
                delete buildingMap[key].tmpDirty;
            }
        }
    }

    onGotoWorldClick() {
        this.deselectBuilding();
        CvsMain.EnterUI(WorldUI);
    }
    onBuildBtnClick() {
        this.deselectBuilding();
        CvsMain.OpenPanel(BuildPanel);
    }
    onCommanderClick() {

    }

    onCenterBtnClick() {
        this.cityMap.position = new cc.Vec2(200, 0);
    }

    onPanPadTouchMove(event: cc.Event.EventTouch) {
        let delta = event.getDelta();
        // if (this.currentHoldingBlueprint){
        //     this.dragBlueprint(event);
        // }else{
        this.cityMap.position = this.cityMap.position.add(new cc.Vec2(delta.x, delta.y));
    }
    onMouseWheel(event: cc.Event.EventMouse) {
        let delta = event.getScrollY();
        let oldZoomScale = this.zoomScale;
        this.zoomScale *= Math.pow(1.5, (delta / 120)); //delta每次±120
        this.clampZoom();
        let deltaZoom = this.zoomScale / oldZoomScale;
        this.cityMap.position = this.cityMap.position.mul(deltaZoom);
        this.refreshZoom();
    }
    onZoomSliderChange(slider: cc.Slider) {
        // console.log('sld', slider.progress);
    }
    clampZoom() {
        if (this.zoomScale > 3) this.zoomScale = 3;
        if (this.zoomScale < 0.3) this.zoomScale = 0.3;
    }

    //Expand
    @property(cc.Node)
    expandModeContainer: cc.Node = null;
    @property(cc.Label)
    lblExpandCost: cc.Label = null;
    enterExpandMode() {
        this.expandModeContainer.active = true;
    }

    //Build
    @property(cc.Node)
    floorTemplate: cc.Node = null;
    @property(cc.Node)
    floorContainer: cc.Node = null;
    @property(cc.Node)
    hqTemplate: cc.Node = null;
    @property(cc.Node)
    collectorTemplate: cc.Node = null;
    @property(cc.Node)
    producerTemplate: cc.Node = null;
    @property(cc.Node)
    warehouseTemplate: cc.Node = null;
    @property(cc.Node)
    launchsiloTemplate: cc.Node = null;
    @property(cc.Node)
    buildingContainer: cc.Node = null;
    @property(cc.Node)
    blueprint: cc.Node = null;
    @property(cc.Sprite)
    blueprintIndicator: cc.Sprite = null;
    readonly canBuildColor = new cc.Color(0, 190, 0);
    readonly cannotBuildColor = new cc.Color(190, 0, 0);
    currentHoldingBlueprint = null;
    currentBlueprintIJ: IJ;
    enterBuildMode(buildingInfo: BuildingInfo) {
        this.currentHoldingBlueprint = buildingInfo;
        //寻找最近的空位
        const findEmptyIJ = () => {
            for (let i = 1; ; i++) {
                for (let j = 1; ; j++) {
                    for (let fi = -1; fi <= 1; fi += 2)
                        for (let fj = -1; fj <= 1; fj += 2) {
                            let key = (i * fi).toFixed() + ',' + (j * fj).toFixed();
                            if (!DataMgr.myUser.buildingMap[key]) {
                                let ij = new IJ();
                                ij.i = i * fi;
                                ij.j = j * fj;
                                return ij;
                            }
                        }
                }
            }
        };
        this.currentBlueprintIJ = findEmptyIJ();
    }
    dragBlueprint(event: cc.Event.EventTouch) {
        let now = event.getLocation();
        let touchPosInCityMap = this.cityMap.convertToNodeSpaceAR(now);
        this.currentBlueprintIJ.i = Math.round(touchPosInCityMap.x / 100);
        this.currentBlueprintIJ.j = Math.round(touchPosInCityMap.y / 100);
    }
    @property(cc.Node)
    grpBuild: cc.Node = null;
    @property(cc.Button)
    btnConfirmBuild: cc.Button = null;
    onBtnConfirmBuildClick() {
        console.log('onBtnConfirmBuildClick', this.currentHoldingBlueprint, this.currentHoldingBlueprint instanceof BuildingInfo)
        if (this.expandModeContainer.active) {
            let expandModeContainer = this.expandModeContainer.getComponent(ExpandModeContainer);
            //确定扩建
            let ijList = expandModeContainer.getIJList();
            let cost = expandModeContainer.getCost();
            let floatmod: number = (DataMgr.getUserCurrentCargoData(DataMgr.myUser)['floatmod'] || 0);
            let enough = floatmod >= cost;
            let self = this;
            const callBlockchain = () => BlockchainMgr.Instance.callFunction('expand', [ijList], 0,
                (resp) => {
                    if (resp.toString().substr(0, 5) != 'Error') {
                        DialogPanel.PopupWith2Buttons('正在递交扩建计划',
                            '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                                window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                            }, '确定', null);
                        self.expandModeContainer.active = false;
                    } else {
                        ToastPanel.Toast('交易失败:' + resp);
                    }
                }
            );
            if (enough) {
                callBlockchain();
            } else {
                DialogPanel.PopupWith2Buttons('浮力模块存货不足', '强行发送区块链交易可能失败', '确定', null, '强行发送', callBlockchain);
            }
        } else if (this.currentHoldingBlueprint && this.currentHoldingBlueprint.id) {
            let money = this.currentHoldingBlueprint.Money;
            //确定建造
            BlockchainMgr.Instance.callFunction('build', [this.currentBlueprintIJ.i, this.currentBlueprintIJ.j, this.currentHoldingBlueprint.id], money,
                (resp) => {
                    if (resp.toString().substr(0, 5) != 'Error') {
                        DialogPanel.PopupWith2Buttons('正在递交建造计划',
                            '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                                window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                            }, '确定', null);
                        this.currentHoldingBlueprint = null;
                    } else {
                        ToastPanel.Toast('交易失败:' + resp);
                    }
                }
            );
        } else if (this.currentHoldingBlueprint instanceof IJ) {
            //确定移动建筑
            BlockchainMgr.Instance.callFunction('moveBuilding', [this.currentHoldingBlueprint.i, this.currentHoldingBlueprint.j, this.currentBlueprintIJ.i, this.currentBlueprintIJ.j], 0,
                (resp) => {
                    if (resp.toString().substr(0, 5) != 'Error') {
                        DialogPanel.PopupWith2Buttons('正在递交搬迁计划',
                            '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                                window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                            }, '确定', null);
                        this.currentHoldingBlueprint = null;
                    } else {
                        ToastPanel.Toast('交易失败:' + resp);
                    }
                }
            );
        }
    }
    onBtnCancelBuildClick() {
        this.currentHoldingBlueprint = null;
        this.expandModeContainer.active = false;
    }

    //建筑信息
    selectedBuilding: Building = null;
    @property(cc.Node)
    grpBuildingInfo: cc.Node = null;
    @property(cc.Node)
    nodProduceButton: cc.Node = null;
    selectBuilding(building: Building) {
        console.log('选中建筑', building.name);
        this.selectedBuilding = building;
    }
    deselectBuilding() {
        this.selectedBuilding = null;
    }
    onMoveBuildingClick() {
        if (this.selectedBuilding) {
            let ij = this.selectedBuilding.ij;
            this.currentHoldingBlueprint = ij;
            this.currentBlueprintIJ = new IJ();
            this.currentBlueprintIJ.i = ij.i;
            this.currentBlueprintIJ.j = ij.j;
            this.deselectBuilding();
        }
    }
    onDemolishBtnClick() {
        let self = CityUI.Instance;
        if (this.selectedBuilding) {
            if (this.selectedBuilding.info.id === 'hq') {
                DialogPanel.PopupWith1Button('确定拆除总部吗？', '这玩意儿可不能拆！', '不拆不拆', null);
            } else {
                DialogPanel.PopupWith2Buttons('确定拆除建筑吗',
                    self.selectedBuilding.info.Name
                    + '\n可回收部分建筑材料',
                    '取消', null,
                    '拆除', () => {
                        let ij = JSON.parse('[' + this.selectedBuilding.node.name + ']');
                        BlockchainMgr.Instance.callFunction('demolish', ij, 0,
                            (resp) => {
                                if (resp.toString().substr(0, 5) != 'Error') {
                                    DialogPanel.PopupWith2Buttons('正在递交拆除计划',
                                        '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                                            window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                                        }, '确定', null);
                                } else {
                                    ToastPanel.Toast('交易失败:' + resp);
                                }
                            }
                        );
                        self.deselectBuilding();
                    });
            }
        }
    }
    onBuildingInfoBtnClick() {
        if (this.selectedBuilding) {
            let ij = this.selectedBuilding.ij;
            BuildingInfoPanel.ShowBuildingData(ij, this.selectedBuilding.data);
            this.deselectBuilding();
        }
    }

    //升级
    onUpgradeBtnClick() {
        if (this.selectedBuilding) {
            let ij = this.selectedBuilding.ij;
            BuildingInfoPanel.ShowBuildingData(ij, this.selectedBuilding.data);
            this.deselectBuilding();
        }
    }
    //生产
    onProduceBtnClick() {
        CvsMain.OpenPanel(ProductionPanel, () => ProductionPanel.Instance.setAndRefresh(this.selectedBuilding, DataMgr.myUser.buildingMap[this.selectedBuilding.node.name]));
    }

    onTradeBtnClick() {
        // TransferPanel.Instance.node.active = true;
    }

    //信息过滤器
    @property(cc.Toggle)
    togShowBuildingInfo: cc.Toggle = null;
    onFilterToggle() {
        this.refreshAll();
    }
}