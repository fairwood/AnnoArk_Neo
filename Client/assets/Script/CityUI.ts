import CvsMain from "./CvsMain";
import BaseUI from "./BaseUI";
import WorldUI from "./WorldUI";
import { DataMgr, BuildingInfo, IJ, BuildingData } from "./DataMgr";
import BuildPanel from "./BuildPanel";
import Building from "./City/Building";
import DialogPanel from "./DialogPanel";
import BuildingInfoPanel from "./UI/BuildingInfoPanel";
import CurrencyFormatter from "./Utils/CurrencyFormatter";
import BlockchainMgr from "./BlockchainMgr";
import ToastPanel from "./UI/ToastPanel";
import ProductionPanel from "./UI/ProductionPanel";
import CollectorBuilding from "./City/CollectorBuilding";
import ProducerBuilding from "./City/ProducerBuilding";

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

        // this.cells = [];
        // for (let i = -200; i <= -1; i++) {
        //     this.cells[i] = [];
        //     for (let j = -100; j < 100; j++) {
        //         this.cells[i][j] = new Cell();
        //     }
        // }

        this.blueprint.on(cc.Node.EventType.TOUCH_MOVE, this.dragBlueprint.bind(this));

        this.floorTemplate.active = false;
        this.producerTemplate.active = false;
        this.collectorTemplate.active = false;
        this.warehouseTemplate.active = false;
    }

    @property(cc.Node)
    cityMap: cc.Node = null;
    @property(cc.Node)
    city: cc.Node = null;

    @property(cc.Node)
    cargoLabelContainer: cc.Node = null;
    @property(cc.Node)
    cargoLabelTemplate: cc.Node = null;
    cargoLabels = {};

    @property(cc.Node)
    panPad: cc.Node = null;
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

        let myData = DataMgr.myData;
        // for (let i = -Math.floor(myData.arkSize / 2); i < myData.arkSize / 2; i++) {
        //     for (let j = -Math.floor(myData.arkSize / 2); j < myData.arkSize / 2; j++) {
        //         let cell = this.cells[i][j];
        //         cell.isLand = true;
        //         cell.building = null;
        //     }
        // }

        // this.buildingContainer.destroyAllChildren();
        // let workers = 0;
        // DataMgr.myBuildingData.forEach(data => {
        //     let info = DataMgr.BuildingConfig.find(i => i.id == data.id);
        //     console.log('precreatebuilding', data);
        //     this.createBuilding(info, data);
        //     workers += data.workers;
        // });

        // DataMgr.idleWorkers = myData.population - workers;

        // this.deselectBuilding();
    }

    refreshZoom() {
        this.cityMap.scale = this.zoomScale;
    }

    _lastRefreshTicks = -1;
    update(dt: number) {

        //刷新建筑
        if (DataMgr.myData['ticks'] > this._lastRefreshTicks) {
            this._lastRefreshTicks = DataMgr.myData['ticks'];
            this.refreshAll();
        }

        let cargoData = DataMgr.getUserCurrentCargoData(DataMgr.myData);
        for (let i = 0; i < DataMgr.CargoConfig.length; i++) {
            const cargoInfo = DataMgr.CargoConfig[i];
            const cargoId = cargoInfo.id;
            let str: string;
            let warehouseCap = DataMgr.getUserWarehouseCap(cargoId).toFixed();
            if (DataMgr.getBuildingInfo(cargoId + 'coll')) {
                let estimateRate = DataMgr.getUserCollectorRate(DataMgr.myData, cargoId + 'coll');
                str = cargoInfo.Name + '   ' + Math.floor(cargoData[cargoInfo.id]).toFixed() +'/' + warehouseCap + '(' + (estimateRate > 0 ? '+' : '') + estimateRate.toFixed() + '/h)';
            } else {
                str = cargoInfo.Name + '   ' + Math.floor(cargoData[cargoInfo.id]).toFixed() +'/' + warehouseCap;
            }
            this.cargoLabels[cargoInfo.id].string = str;
        }

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

        if (this.currentHoldingBlueprint) {
            this.blueprint.active = true;
            this.blueprint.position = new cc.Vec2(this.currentBlueprintIJ.i * 100, this.currentBlueprintIJ.j * 100);
            let ableToBuild = true;
            this.grpBuild.active = true;
            if (this.currentHoldingBlueprint == 'expand') {
                this.blueprint.setContentSize(300, 300);
                this.blueprintIndicator.node.setContentSize(300, 300);
                for (let di = -1; di <= 1; di++) {
                    for (let dj = -1; dj <= 1; dj++) {
                        let i = this.currentBlueprintIJ.i + di;
                        let j = this.currentBlueprintIJ.j + dj;
                        let key = i + ',' + j;
                        if (DataMgr.myData.expandMap[key]) {
                            ableToBuild = false;
                            break;
                        }
                        if (i >= 0) {
                            ableToBuild = false;
                        }
                    }
                    if (!ableToBuild) break;
                }
            } else {
                this.blueprint.setContentSize(100, 100);
                this.blueprintIndicator.node.setContentSize(100, 100);
                let key = this.currentBlueprintIJ.i + ',' + this.currentBlueprintIJ.j;
                if (DataMgr.myData.buildingMap[key]) {
                    ableToBuild = false;
                } else if (!DataMgr.myData.expandMap[key]) {
                    ableToBuild = false;
                }
            }
            this.btnConfirmBuild.interactable = ableToBuild;
            this.blueprintIndicator.node.color = ableToBuild ? this.canBuildColor : this.cannotBuildColor;
        } else {
            this.blueprint.active = false;
            this.grpBuild.active = false;
        }
        if (this.selectedBuilding) {
            this.grpBuildingInfo.active = true;
            this.nodProduceButton.active = (this.selectedBuilding.getComponent(ProducerBuilding) != null);
        } else {
            this.grpBuildingInfo.active = false;
        }

    }

    refreshAll() {
        this.refreshBuildingData();
        this.refreshZoom();
    }

    refreshBuildingData() {
        //floor
        const expandMap = DataMgr.myData.expandMap;
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
        const buildingMap = DataMgr.myData.buildingMap;
        for (let key in buildingMap) {
            buildingMap[key].tmpDirty = true;
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
            if (buildingMap[key].tmpDirty) {
                const data = buildingMap[key];
                let info = DataMgr.getBuildingInfo(data.id);
                let prefabName = info['Prefab'];
                let buildingNode = cc.instantiate(this[prefabName + 'Template']);
                buildingNode.parent = this.buildingContainer;
                buildingNode.name = key;
                let building = buildingNode.getComponent(Building);
                building.setInfo(info, data);
                let ij = JSON.parse('[' + key + ']');
                buildingNode.position = new cc.Vec2(ij[0] * 100, ij[1] * 100);
                buildingNode.active = true;
                console.log('createbd', key, data);
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
        BuildPanel.Show();
        TechPanel.Hide();
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

    //Build
    @property(cc.Node)
    floorTemplate: cc.Node = null;
    @property(cc.Node)
    floorContainer: cc.Node = null;
    @property(cc.Node)
    collectorTemplate: cc.Node = null;
    @property(cc.Node)
    producerTemplate: cc.Node = null;
    @property(cc.Node)
    warehouseTemplate: cc.Node = null;
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
        this.currentBlueprintIJ = IJ.ZERO;
    }
    dragBlueprint(event: cc.Event.EventTouch) {
        let now = event.getLocation();
        let touchPosInArkMap = this.cityMap.convertToNodeSpaceAR(now);
        // this.blueprint.position = touchPosInArkMap;
        if (this.currentHoldingBlueprint == 'expand') {
            this.currentBlueprintIJ.i = Math.round((touchPosInArkMap.x / 100 + 2) / 3) * 3 - 2;
            this.currentBlueprintIJ.j = Math.round(touchPosInArkMap.y / 100 / 3) * 3;
        } else {
            this.currentBlueprintIJ.i = Math.round(touchPosInArkMap.x / 100);
            this.currentBlueprintIJ.j = Math.round(touchPosInArkMap.y / 100);
        }
    }
    @property(cc.Node)
    grpBuild: cc.Node = null;
    @property(cc.Button)
    btnConfirmBuild: cc.Button = null;
    onBtnConfirmBuildClick() {
        if (this.currentHoldingBlueprint == 'expand') {
            //确定扩建
            let ijList = [];
            for (let di = -1; di <= 1; di++) {
                for (let dj = -1; dj <= 1; dj++) {
                    let i = this.currentBlueprintIJ.i + di;
                    let j = this.currentBlueprintIJ.j + dj;
                    ijList.push([i, j]);
                }
            }
            BlockchainMgr.Instance.callFunction('expand', [ijList], DataMgr.getExpandCost(DataMgr.myData.expandCnt, 9) + 1e-5,
                (resp) => {
                    if (resp.toString().substr(0, 5) != 'Error') {
                        DialogPanel.PopupWith2Buttons('正在递交扩建计划',
                            '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                                window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                            }, '确定', null);
                        this.currentHoldingBlueprint = null;
                    } else {
                        ToastPanel.Toast('交易失败:' + resp);
                    }
                }
            );
        } else {
            //确定建造
            BlockchainMgr.Instance.callFunction('build', [this.currentBlueprintIJ.i, this.currentBlueprintIJ.j, this.currentHoldingBlueprint.id], 0,
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
        }
    }
    onBtnCancelBuildClick() {
        this.currentHoldingBlueprint = null;
    }

    //建筑信息
    selectedBuilding: Building = null;
    @property(cc.Node)
    grpBuildingInfo: cc.Node = null;
    @property(cc.Node)
    nodProduceButton: cc.Node = null;
    selectBuilding(building: Building) {
        console.log('选中建筑', building);
        this.selectedBuilding = building;
    }
    deselectBuilding() {
        this.selectedBuilding = null;
    }
    onDemolishBtnClick() {
        let self = CityUI.Instance;
        if (this.selectedBuilding) {
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
    onBuildingInfoBtnClick() {
        if (this.selectedBuilding) {
            BuildingInfoPanel.Show(this.selectedBuilding.info);
            this.deselectBuilding();
        }
    }

    //升级
    onUpgradeBtnClick() {
        let self = CityUI.Instance;
        if (this.selectedBuilding) {
            let ironCost = DataMgr.getBuildingInfoItemWithLv(this.selectedBuilding.data.id, 'IronCost', this.selectedBuilding.data.lv + 1);
            DialogPanel.PopupWith2Buttons('升级' + self.selectedBuilding.info.Name + "到Lv" + (this.selectedBuilding.data.lv + 2),
                "需要" + ironCost + '铁',
                '取消', null,
                '升级', () => {
                    if (DataMgr.getUserCurrentCargoData(DataMgr.myData)['iron'] < ironCost) {
                        ToastPanel.Toast("铁不足");
                        return;
                    }
                    let ij = JSON.parse('[' + this.selectedBuilding.node.name + ']');
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
                    self.deselectBuilding();
                });
        }
    }
    //生产
    onProduceBtnClick() {
        let data = DataMgr.myData.buildingMap[this.selectedBuilding.node.name];
        let curTime = Number(new Date());

        if (curTime < data.recoverTime) {
            ToastPanel.Toast('生产设施尚未冷却');
            return;
        }

        ProductionPanel.Instance.node.active = true;
        ProductionPanel.Instance.setAndRefresh(this.selectedBuilding, DataMgr.myData.buildingMap[this.selectedBuilding.node.name]);

    }
}