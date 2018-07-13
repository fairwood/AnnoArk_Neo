import { DataMgr } from "./DataMgr";
import BuildingButton from "./BuildingButton";
import TechButton from "./TechButton";

const {ccclass, property} = cc._decorator;

@ccclass
export default class TechPanel extends cc.Component {
    static Instance: TechPanel;
    onLoad() {
        TechPanel.Instance = this;
        this.node.active = false;
    }

    @property(cc.Node)
    buttonContainer: cc.Node = null;
    @property(cc.Node)
    buttonTemplate: cc.Node = null;

    start() {
        DataMgr.TechConfig.forEach(techInfo => {
            let techBtnNode = cc.instantiate(this.buttonTemplate);
            techBtnNode.parent = this.buttonContainer;
            let buildingBtn = techBtnNode.getComponent(TechButton);
            let data = DataMgr.myTechData.find(d=>d.id == techInfo.id);
            buildingBtn.setAndRefresh(techInfo, data);
            techBtnNode.active = true;
        });
        this.buttonTemplate.active = false;
    }

    onEnable () {
        
    }

    refresh() {

    }

    static Show() {
        TechPanel.Instance.node.active = true;
    }
    static Hide() {
        TechPanel.Instance.node.active = false;
    }

    close() {
        this.node.active = false;
    }
}