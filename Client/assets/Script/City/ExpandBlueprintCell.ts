import { DataMgr } from "../DataMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ExpandBlueprintCell extends cc.Component {

    i;
    j;

    @property(cc.Sprite)
    spr: cc.Sprite = null;
    @property(cc.Label)
    lblInfo: cc.Label = null;

    refresh(selected: boolean) {
        if (selected) {
            // let expanded = DataMgr.getCityIJExpanded(DataMgr.myUser, this.i, this.j);
            // this.spr.node.color = expanded ? cc.Color.RED : cc.Color.GREEN;
            this.spr.node.active = true;
        } else {
            this.spr.node.active = false;
        }
        this.lblInfo.string = `${DataMgr.getExpandNeedFloatmod(this.i, this.j)} 浮力模块`;
    }
}
