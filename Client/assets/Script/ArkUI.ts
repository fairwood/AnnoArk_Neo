import CvsMain from "./CvsMain";
import BaseUI from "./BaseUI";
import WorldUI from "./WorldUI";
import { DataMgr, BuildingInfo, IJ, BuildingData } from "./DataMgr";
import BuildPanel from "./BuildPanel";
import Building from "./Building";
import TechPanel from "./TechPanel";
import DialogPanel from "./DialogPanel";
import BuildingInfoPanel from "./UI/BuildingInfoPanel";
import CurrencyFormatter from "./Utils/CurrencyFormatter";
import BlockchainMgr from "./BlockchainMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ArkUI extends BaseUI {
    static Instance: ArkUI;
    onLoad() {
        ArkUI.Instance = this;
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

        this.cells = [];
        for (let i = -50; i <= 50; i++) {
            this.cells[i] = [];
            for (let j = -50; j < 50; j++) {
                this.cells[i][j] = new Cell();
            }
        }

        this.blueprint.on(cc.Node.EventType.TOUCH_MOVE, this.dragBlueprint.bind(this));

        this.workshopTemplate.active = false;
        this.roadTemplate.active = false;
        this.houseTemplate.active = false;
        this.launchingsiloTemplate.active = false;

        let labelNode = cc.instantiate(this.cargoLabelTemplate);
        labelNode.parent = this.cargoLabelContainer;
        let label = labelNode.getComponent(cc.Label);
        label.string = '人口';
        this.cargoLabels['population'] = label;

        // this.node.getChildByName('GrpBuildInfo').getChildByName('DeselectPad').on(cc.Node.EventType.TOUCH_START, ()=>{ArkUI.Instance.deselectBuilding();});
    }

    @property(cc.Node)
    arkMap: cc.Node = null;
    @property(cc.Node)
    ark: cc.Node = null;

    @property(cc.Node)
    cargoLabelContainer: cc.Node = null;
    @property(cc.Node)
    cargoLabelTemplate: cc.Node = null;
    cargoLabels = {};

    cells: Cell[][];

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
        this.refreshZoom();

        let myData = DataMgr.myData; console.log('size', myData.arkSize)
        for (let i = -Math.floor(myData.arkSize / 2); i < myData.arkSize / 2; i++) {
            for (let j = -Math.floor(myData.arkSize / 2); j < myData.arkSize / 2; j++) {
                let cell = this.cells[i][j];
                cell.isLand = true;
                cell.building = null;
            }
        }

        this.buildingContainer.destroyAllChildren();
        let workers = 0;
        DataMgr.myBuildingData.forEach(data => {
            let info = DataMgr.BuildingConfig.find(i => i.id == data.id);
            console.log('precreatebuilding', data);
            this.createBuilding(info, data);
            workers += data.workers;
        });

        DataMgr.idleWorkers = myData.population - workers;

        this.deselectBuilding();
    }

    refreshZoom() {
        this.arkMap.scale = this.zoomScale;
    }

    update(dt: number) {
        if (DataMgr.changed) {
            this.refreshData();
            DataMgr.changed = false;
        }

        this.updateCheckExpand();

        this.cargoLabels['population'].string =
            `人口 ${DataMgr.myData.population}/${DataMgr.populationLimit} (闲置 ${DataMgr.idleWorkers}) 增长${DataMgr.populationGrowPerMin.toFixed(0)}/min`;
        for (let i = 0; i < DataMgr.CargoConfig.length; i++) {
            const cargoInfo = DataMgr.CargoConfig[i];
            let data = DataMgr.myCargoData.find(d => d.id == cargoInfo.id);
            let estimateRate: number = DataMgr.outputRates[cargoInfo.id];
            if (!estimateRate) estimateRate = 0;
            let str = cargoInfo.Name + '   ' + Math.floor(data ? data.amount : 0).toFixed() + '(' + (estimateRate > 0 ? '+' : '') + estimateRate.toFixed() + ')';
            if (cargoInfo.id == 'fish34509') {
                if (data.amount <= 0 && estimateRate < 0) {
                    str += ' 食物短缺';
                }
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
            this.arkMap.position = this.arkMap.position.mul(deltaZoom);
            this.refreshZoom();
        }

        if (this.currentHoldingBlueprint) {
            this.blueprint.active = true;
            this.blueprint.position = new cc.Vec2(this.currentBlueprintIJ.i * 100 - 50, this.currentBlueprintIJ.j * 100 - 50);
            this.blueprint.setContentSize(this.currentHoldingBlueprint.Length * 100, this.currentHoldingBlueprint.Width * 100);
            let ableToBuild = true;
            this.blueprintIndicator.clear();
            for (let i = 0; i < this.currentHoldingBlueprint.Length; i++) {
                for (let j = 0; j < this.currentHoldingBlueprint.Width; j++) {
                    let cell = this.cells[this.currentBlueprintIJ.i + i][this.currentBlueprintIJ.j + j];
                    this.blueprintIndicator.fillColor = cell.building ? cc.Color.RED : cell.isLand ? cc.Color.GREEN : cc.Color.RED;
                    if (cell.building) ableToBuild = false;
                    if (!cell.isLand) ableToBuild = false;
                    this.blueprintIndicator.fillRect(i * 100, j * 100, 100, 100);
                }
            }
            this.grpBuild.active = true;
            this.btnConfirmBuild.interactable = ableToBuild;
        } else {
            this.blueprint.active = false;
            this.grpBuild.active = false;
        }
        if (this.selectedBuilding) {
            this.grpBuildingInfo.active = true;
        } else {
            this.grpBuildingInfo.active = false;
        }

        this.ark.setContentSize(DataMgr.myData.arkSize * 100, DataMgr.myData.arkSize * 100);
    }

    refreshData() { }

    onGotoWorldClick() {
        this.deselectBuilding();
        CvsMain.EnterUI(WorldUI);
    }
    onBuildBtnClick() {
        this.deselectBuilding();
        BuildPanel.Show();
        TechPanel.Hide();
    }
    onTechClick() {
        this.deselectBuilding();
        if (!DataMgr.myBuildingData.find(d => d.id == 'research239')) {
            DialogPanel.PopupWith1Button('没有研究院', '建造研究院并指派工作人员进行研究', '确定', null);
        }
        TechPanel.Show();
        BuildPanel.Hide();
    }

    onCenterBtnClick() {
        let data = DataMgr.myData;
        let rawPos = new cc.Vec2(data.currentLocation.x, data.currentLocation.y);
        rawPos.mulSelf(this.zoomScale);
        this.arkMap.position = rawPos.neg();
    }

    onPanPadTouchMove(event: cc.Event.EventTouch) {
        let delta = event.getDelta();
        // if (this.currentHoldingBlueprint){
        //     this.dragBlueprint(event);
        // }else{
        this.arkMap.position = this.arkMap.position.add(new cc.Vec2(delta.x, delta.y));
    }
    onMouseWheel(event: cc.Event.EventMouse) {
        let delta = event.getScrollY();
        let oldZoomScale = this.zoomScale;
        this.zoomScale *= Math.pow(1.5, (delta / 120)); //delta每次±120
        this.clampZoom();
        let deltaZoom = this.zoomScale / oldZoomScale;
        this.arkMap.position = this.arkMap.position.mul(deltaZoom);
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
    workshopTemplate: cc.Node = null;
    @property(cc.Node)
    houseTemplate: cc.Node = null;
    @property(cc.Node)
    roadTemplate: cc.Node = null;
    @property(cc.Node)
    launchingsiloTemplate: cc.Node = null;
    @property(cc.Node)
    buildingContainer: cc.Node = null;
    @property(cc.Node)
    blueprint: cc.Node = null;
    @property(cc.Graphics)
    blueprintIndicator: cc.Graphics = null;
    currentHoldingBlueprint: BuildingInfo = null;
    currentBlueprintIJ: IJ;
    enterBuildMode(buildingInfo: BuildingInfo) {
        this.currentHoldingBlueprint = buildingInfo;
        this.currentBlueprintIJ = IJ.ZERO;
    }
    dragBlueprint(event: cc.Event.EventTouch) {
        let now = event.getLocation();
        let touchPosInArkMap = this.arkMap.convertToNodeSpaceAR(now);
        // this.blueprint.position = touchPosInArkMap;
        this.currentBlueprintIJ.i = Math.round(touchPosInArkMap.x / 100);
        this.currentBlueprintIJ.j = Math.round(touchPosInArkMap.y / 100);
    }
    @property(cc.Node)
    grpBuild: cc.Node = null;
    @property(cc.Button)
    btnConfirmBuild: cc.Button = null;
    onBtnConfirmBuildClick() {
        //检查重叠
        let ableToBuild = true;
        for (let i = 0; i < this.currentHoldingBlueprint.Length; i++) {
            for (let j = 0; j < this.currentHoldingBlueprint.Width; j++) {
                let cell = this.cells[this.currentBlueprintIJ.i + i][this.currentBlueprintIJ.j + j];
                if (cell.building) ableToBuild = false;
                if (!cell.isLand) ableToBuild = false;
            }
        }
        if (!ableToBuild) return;
        //确定建造
        //检查建筑材料
        let buildMats = [];
        for (let i = 0; i < 4; i++) {
            let mat = this.currentHoldingBlueprint['BuildMat' + i];
            if (mat && mat.length > 0) {
                let count = this.currentHoldingBlueprint['BuildMat' + i + 'Count'];
                buildMats.push([mat, count]);
            }
        }
        let enough = true;
        buildMats.forEach(mat => {
            let cargoData = DataMgr.myCargoData.find(data => data.id == mat[0]);
            if (cargoData.amount < mat[1]) {
                enough = false;
            }
        })
        if (enough) {
            buildMats.forEach(mat => {
                let cargoData = DataMgr.myCargoData.find(data => data.id == mat[0]);
                cargoData.amount -= mat[1];
            })

            let data = new BuildingData();
            data.id = this.currentHoldingBlueprint.id;
            data.ij = this.currentBlueprintIJ.clone();
            data.workers = 0;
            DataMgr.myBuildingData.push(data);
            this.createBuilding(this.currentHoldingBlueprint, data);

            if (this.currentHoldingBlueprint.id == 'road00001') {
                this.currentBlueprintIJ.j += 1;
            } else {
                this.currentHoldingBlueprint = null;
            }
        }
    }
    onBtnCancelBuildClick() {
        this.currentHoldingBlueprint = null;
    }
    createBuilding(blueprint: BuildingInfo, data: BuildingData) {
        let prefabName = blueprint['prefab'];
        let buildingNode = cc.instantiate(this[prefabName + 'Template']);
        buildingNode.parent = this.buildingContainer;
        let building = buildingNode.getComponent(Building);
        building.setInfo(blueprint, data);
        buildingNode.position = new cc.Vec2(data.ij.i * 100 - 50, data.ij.j * 100 - 50);
        buildingNode.active = true;
        for (let i = 0; i < blueprint.Length; i++) {
            for (let j = 0; j < blueprint.Width; j++) {
                let cell = this.cells[data.ij.i + i][data.ij.j + j];
                cell.building = building;
            }
        }
    }

    //建筑信息
    selectedBuilding: Building = null;
    @property(cc.Node)
    grpBuildingInfo: cc.Node = null;
    selectBuilding(building: Building) {
        console.log('选中建筑', building);
        this.selectedBuilding = building;
    }
    deselectBuilding() {
        this.selectedBuilding = null;
    }
    onDemolishBtnClick() {
        let self = ArkUI.Instance;
        if (this.selectedBuilding) {
            DialogPanel.PopupWith2Buttons('确定拆除建筑吗',
                self.selectedBuilding.info.Name
                + '\n建筑材料不予返还',
                '取消', null,
                '拆除', () => {
                    self.demolishBuilding(self.selectedBuilding);
                    self.deselectBuilding();
                });
        }
    }
    demolishBuilding(building: Building) {
        if (!building) return;
        //拆除建筑
        console.log('拆除建筑');
        let index = DataMgr.myBuildingData.findIndex(data => data == building.data);
        if (index >= 0) {
            //施放工人
            let workers = building.data.workers;
            DataMgr.myBuildingData.splice(index, 1);
            DataMgr.idleWorkers += workers;
            //施放土地
            const info = DataMgr.BuildingConfig.find(i => i.id == building.data.id);
            console.log('info.Length', info.Length);
            for (let i = 0; i < info.Length; i++) {
                for (let j = 0; j < info.Width; j++) {
                    console.log('cells', building.data.ij.i + i, building.data.ij.j + j);
                    this.cells[building.data.ij.i + i][building.data.ij.j + j].building = null;
                }
            }
            building.node.destroy();
        }
    }
    onBuildingInfoBtnClick() {
        if (this.selectedBuilding) {
            BuildingInfoPanel.Show(this.selectedBuilding.info);
            this.deselectBuilding();
        }
    }

    //扩建方舟
    onBtnExpandClick() {
        if (DataMgr.myData.arkSize <= DataMgr.SmallArkSize) {
            DialogPanel.PopupWith1Button('简陋方舟无法扩建', '您的方舟是简陋方舟，没有扩建功能。\n想要功能完整的方舟？请回到主界面领取标准方舟或大型方舟。需要安装星云钱包哦！', '知道了', null);
            return;
        }
        let nextLevel = null;
        for (let i = 0; i < DataMgr.RechargeToArkSize.length; i++) {
            const level = DataMgr.RechargeToArkSize[i];
            if (DataMgr.myData.rechargeOnExpand / 1e18 < level[0]) {
                nextLevel = level;
                break;
            }
        }
        if (nextLevel) {
            const needMoney = nextLevel[0] - DataMgr.myData.rechargeOnExpand / 1e18;
            const nextSize = nextLevel[1];
            DialogPanel.PopupWith2Buttons('扩建方舟', `支付 ${CurrencyFormatter.formatNAS(needMoney)}NAS 扩建方舟到 ${nextSize}×${nextSize} 吗`, '取消', null, '支付', () => {
                BlockchainMgr.Instance.expandArk(needMoney);
            })

        } else {
            DialogPanel.PopupWith1Button('方舟已经最大', '非常感谢您的支持！区块链首款SLG必将越做越好！', '支持！！！', null);
        }
    }
    lastTickArkSize: number;
    updateCheckExpand() {
        const nowSize = DataMgr.GetArkSizeByRecharge(DataMgr.myData.rechargeOnExpand / 1e18);
        if (this.lastTickArkSize != nowSize) {
            console.log('检测到方舟成功扩建了', this.lastTickArkSize, nowSize);
            this.lastTickArkSize = nowSize;
            const myData = DataMgr.myData;
            myData.arkSize = nowSize;
            for (let i = -Math.floor(myData.arkSize / 2); i < myData.arkSize / 2; i++) {
                for (let j = -Math.floor(myData.arkSize / 2); j < myData.arkSize / 2; j++) {
                    let cell = this.cells[i][j];
                    cell.isLand = true;
                }
            }
        }
    }
}

class Cell {
    isLand = false;
    building: Building = null;
}