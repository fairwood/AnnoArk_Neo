import { BuildingInfo, BuildingData, DataMgr } from "../DataMgr";
import CityUI from "../CityUI";
import { IJ } from "../DataMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Building extends cc.Component {

    ij: IJ;
    info: BuildingInfo;
    data: BuildingData;

    @property(cc.Sprite)
    sprPic: cc.Sprite = null;
    @property(cc.Label)
    lblName: cc.Label = null;
    @property(cc.Label)
    lblLv: cc.Label = null;

    onClick() {
        CityUI.Instance.selectBuilding(this);
    }

    setInfo(info: BuildingInfo, data: BuildingData) {
        this.info = info;
        this.data = data;
        if (this.lblName) this.lblName.string = info.Name;
        if (this.lblLv) this.lblLv.string = 'Lv. ' + (data.lv + 1);
        if (this.sprPic) {
            try {
                let self = this;
                if (info.Pic) {
                    cc.loader.loadRes("Building/" + info.Pic, cc.SpriteFrame, function (err, spriteFrame) {
                        if (!err) self.sprPic.spriteFrame = spriteFrame;
                    });
                } else {
                    this.sprPic.spriteFrame = null;
                }
            } catch (error) {
                console.error(error);
                this.sprPic.spriteFrame = null;
            }
        }
        this.refresh();
    }

    refresh() { }
}
