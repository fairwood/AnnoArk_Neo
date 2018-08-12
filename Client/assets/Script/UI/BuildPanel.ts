import BuildingButton from "./BuildingButton";
import { DataMgr, BuildingInfo } from "../DataMgr";
import CityUI from "../CityUI";

const { ccclass, property } = cc._decorator;

@ccclass
export default class BuildPanel extends cc.Component {
    static Instance: BuildPanel;
    onLoad() { BuildPanel.Instance = this; }

    @property(cc.Node)
    buttonContainer: cc.Node = null;
    @property(cc.Node)
    buttonTemplate: cc.Node = null;

    start() {
        let configList = DataMgr.BuildingConfig.sort((a, b) => a.Order - b.Order);
        configList.forEach(buildingInfo => {
            if (buildingInfo.CanBuild !== '1') {
                return;
            }
            let buildingBtnNode = cc.instantiate(this.buttonTemplate);
            buildingBtnNode.parent = this.buttonContainer;
            let buildingBtn = buildingBtnNode.getComponent(BuildingButton);
            buildingBtn.setAndRefresh(buildingInfo);
            buildingBtnNode.active = true;
        });
        this.buttonTemplate.active = false;
    }

    onEnable() {

    }

    refresh() {

    }

    onBtnExpandClick() {
        CityUI.Instance.enterExpandMode();
        // CityUI.Instance.currentHoldingBlueprint = 'expand';
        // CityUI.Instance.currentBlueprintIJ = IJ.ZERO;
        this.close();
    }

    close() {
        this.node.destroy();
        BuildPanel.Instance = null;
    }
}