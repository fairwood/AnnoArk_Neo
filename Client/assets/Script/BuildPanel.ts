import { DataMgr } from "./DataMgr";
import BuildingButton from "./BuildingButton";
import CityUI from "./CityUI";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BuildPanel extends cc.Component {
    static Instance: BuildPanel;
    onLoad() {
        BuildPanel.Instance = this;
        this.node.active = false;
    }

    @property(cc.Node)
    buttonContainer: cc.Node = null;
    @property(cc.Node)
    buttonTemplate: cc.Node = null;

    start() {
        DataMgr.BuildingConfig.forEach(building => {
            let buildingBtnNode = cc.instantiate(this.buttonTemplate);
            buildingBtnNode.parent = this.buttonContainer;
            let buildingBtn = buildingBtnNode.getComponent(BuildingButton);
            buildingBtn.setAndRefresh(building);
            buildingBtnNode.active = true;
        });
        this.buttonTemplate.active = false;
    }

    onEnable () {
        
    }

    refresh() {

    }

    static Show() {
        BuildPanel.Instance.node.active = true;
    }
    static Hide() {
        BuildPanel.Instance.node.active = false;
    }

    onBtnExpandClick() {
        CityUI.Instance.onBtnExpandClick();
    }

    close() {
        this.node.active = false;
    }
}