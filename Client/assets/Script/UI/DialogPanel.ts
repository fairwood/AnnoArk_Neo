
const { ccclass, property } = cc._decorator;

@ccclass
export default class DialogPanel extends cc.Component {
    static Instance: DialogPanel;
    onLoad() { DialogPanel.Instance = this; this.hide();}

    @property(cc.Label)
    lblTitle: cc.Label = null;
    @property(cc.Label)
    lblContext: cc.Label = null;

    @property(cc.Node)
    btn0: cc.Node = null;
    @property(cc.Label)
    lblBtn0: cc.Label = null;
    @property(cc.Node)
    btn1: cc.Node = null;
    @property(cc.Label)
    lblBtn1: cc.Label = null;

    func0: () => any;
    func1: () => any;

    static PopupWithOKButton(title: string, text: string) {
        DialogPanel.PopupWith1Button(title, text, '确定', null);
    }
    static PopupWith1Button(title: string, text: string, btn0String: string, button0Callback: () => any) {
        this.Instance.show();
        this.Instance.lblTitle.string = title;
        this.Instance.lblContext.string = text;
        this.Instance.func0 = button0Callback;
        this.Instance.lblBtn0.string = btn0String;
        this.Instance.btn0.active = true;
        this.Instance.btn0.position = new cc.Vec2(0, 0);
        this.Instance.btn1.active = false;
    }
    static PopupWith2Buttons(title: string, text: string, btn0String: string, button0Callback: () => any, btn1String: string, button1Callback: () => any) {
        this.Instance.show();
        this.Instance.lblTitle.string = title;
        this.Instance.lblContext.string = text;
        this.Instance.func0 = button0Callback;
        this.Instance.lblBtn0.string = btn0String;
        this.Instance.btn0.active = true;
        this.Instance.btn0.position = new cc.Vec2(-150, 0);
        this.Instance.func1 = button1Callback;
        this.Instance.lblBtn1.string = btn1String;
        this.Instance.btn1.active = true;
        this.Instance.btn1.position = new cc.Vec2(150, 0);
    }
    onBtn0Click() {
        if (this.func0) this.func0();
        this.hide();
    }
    onBtn1Click() {
        if (this.func1) this.func1();
        this.hide();
    }
    show() {
        this.node.active = true;
    }
    hide() {
        this.node.active = false;
    }
}
