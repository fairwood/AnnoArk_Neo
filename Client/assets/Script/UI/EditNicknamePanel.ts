import { DataMgr } from "../DataMgr";
import ToastPanel from "./ToastPanel";
import HomeUI from "../HomeUI";
import { FlagMgr } from "./FlagMgr";
import CvsMain from "../CvsMain";

const { ccclass, property } = cc._decorator;

@ccclass
export default class EditNicknamePanel extends cc.Component {
    static Instance: EditNicknamePanel;
    onLoad() { EditNicknamePanel.Instance = this; this.init(); }

    @property(cc.EditBox)
    edtNickname: cc.EditBox = null;

    @property(cc.Node)
    flagContainer: cc.Node = null;
    @property(cc.Node)
    flagTemplate: cc.Node = null;
    @property(cc.Node)
    selectFrame: cc.Node = null;

    selectedCountry: string;

    init() {
        //创建国旗
        //创建点击国旗事件
        var self = this;
        this.flagTemplate.active = true;
        FlagMgr.flagNames.forEach(flagName => {
            let node = cc.instantiate(this.flagTemplate);
            node.name = flagName;
            node.parent = this.flagContainer;
            let spr = node.getComponent(cc.Sprite);
            FlagMgr.setFlag(spr, flagName);
            node.on(cc.Node.EventType.TOUCH_END, () => this.onFlagClick(node));
        });
        this.flagTemplate.active = false;
    }

    onEnable() {
        this.edtNickname.string = DataMgr.myUser ? DataMgr.myUser.nickname : HomeUI.Instance.lblNickname.string;
        this.selectedCountry = HomeUI.Instance.country ? HomeUI.Instance.country : (DataMgr.myUser ? DataMgr.myUser.country : null);
        //TODO:国旗
        let myFlagNode = this.flagContainer.children.find(c => c.name == this.selectedCountry);
        if (myFlagNode) {
            this.selectFrame.active = true;
            this.selectFrame.position = this.selectFrame.parent.convertToNodeSpaceAR(this.flagContainer.convertToWorldSpaceAR(myFlagNode.position));
        } else {
            this.selectFrame.active = false;
        }
    }

    onFlagClick(node: cc.Node) {
        this.selectFrame.active = true;
        this.selectFrame.position = this.selectFrame.parent.convertToNodeSpaceAR(this.flagContainer.convertToWorldSpaceAR(node.position));
        this.selectedCountry = node.name;
    }

    onConfirmClick() {
        if (DataMgr.myUser) {
            DataMgr.myUser.nickname = this.edtNickname.string;
            DataMgr.myUser.country = this.selectedCountry;
        }
        HomeUI.Instance.lblNickname.string = this.edtNickname.string;
        HomeUI.Instance.country = this.selectedCountry;
        ToastPanel.Toast('昵称、国家设置成功');
        this.close();
    }

    close() {
        this.node.destroy();
        EditNicknamePanel.Instance = null;
    }
}