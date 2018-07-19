import CvsMain from "./CvsMain";
import BaseUI from "./BaseUI";
import MainCtrl from "./MainCtrl";
import { DataMgr, UserData, CargoData, TechData } from "./DataMgr";
import WorldUI from "./WorldUI";
import ToastPanel from "./UI/ToastPanel";
import BlockchainMgr from "./BlockchainMgr";
import DialogPanel from "./DialogPanel";
import EditNicknamePanel from "./UI/EditNicknamePanel";
import { FlagMgr } from "./UI/FlagMgr";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HomeUI extends BaseUI {
    static Instance: HomeUI;
    onLoad() {
        HomeUI.Instance = this;
        this.node.active = false;
    }

    @property(cc.Label)
    lblTotalArkCount: cc.Label = null;

    @property(cc.Button)
    btnClaim1: cc.Button = null;

    @property(cc.Label)
    lblNickname: cc.Label = null;
    @property(cc.Sprite)
    sprFlag: cc.Sprite = null;
    country: string;

    @property(cc.Label)
    lblMusicButton: cc.Label = null;

    @property(cc.Label)
    lblBlockchainAddress: cc.Label = null;

    start() {
        ToastPanel.Toast('正在读取您的钱包信息，如果您在用钱包玩游戏，请稍候');
        this.lblMusicButton.string = MainCtrl.Instance.getComponent(cc.AudioSource).volume > 0 ? '音乐：开' : '音乐：关';
    }

    update() {
        this.lblBlockchainAddress.string = BlockchainMgr.WalletAddress ? BlockchainMgr.WalletAddress : '未获取到钱包地址';

        if (DataMgr.myData) {
            this.btnClaim1.getComponentInChildren(cc.Label).string = DataMgr.myData.arkSize < DataMgr.StdArkSize ? '领取' : '进入';
            // this.btnClaim2.getComponentInChildren(cc.Label).string = DataMgr.myData.arkSize < DataMgr.StdArkSize ? '领取' : DataMgr.myData.arkSize < DataMgr.LargeArkSize ? '无法领取' : '进入';
            this.btnClaim1.interactable = true;
            // this.btnClaim2.interactable = DataMgr.myData.arkSize < DataMgr.StdArkSize || DataMgr.myData.arkSize >= DataMgr.LargeArkSize;
            if (DataMgr.myData.nickname) this.lblNickname.string = DataMgr.myData.nickname;
            if (DataMgr.myData.country) this.country = DataMgr.myData.country;
        } else {
            this.btnClaim1.getComponentInChildren(cc.Label).string = '领取';
            // this.btnClaim2.getComponentInChildren(cc.Label).string = '领取';
        }

        let self = this;
        if (MainCtrl.Ticks % 50 == 0) FlagMgr.setFlag(this.sprFlag, this.country);
        if (MainCtrl.Ticks % 100 == 0) this.lblTotalArkCount.string = (Object.keys(DataMgr.othersData).length + 1).toFixed();

    }

    onClaim(event, index: string) {
        //检查昵称、国家
        if (!this.lblNickname.string || !this.country) {
            EditNicknamePanel.Instance.node.active = true;
            ToastPanel.Toast('请先设置国旗和昵称');
            return;
        }
        if (DataMgr.myData) {
            switch (index) {
                case '0': {
                    if (DataMgr.myData.arkSize < DataMgr.StdArkSize) {
                        //进入
                        CvsMain.EnterUI(WorldUI);
                    }
                    break;
                }
                case '1': {
                    CvsMain.EnterUI(WorldUI);
                    break;
                }
                case '2': {
                    if (DataMgr.myData.arkSize < DataMgr.StdArkSize) {
                        //领取，调用合约
                        BlockchainMgr.Instance.claimArk(0.01);
                    } else if (DataMgr.myData.arkSize >= DataMgr.LargeArkSize) {
                        //进入
                        CvsMain.EnterUI(WorldUI);
                    }
                    break;
                }
            }
        } else {//DataMgr.myData == null
            switch (index) {
                case '0': {
                    DataMgr.myData = MainCtrl.Instance.generateSmallArkData();
                    ToastPanel.Toast('领取成功，可进入方舟');
                    break;
                }
                case '1': {
                    //调用合约
                    BlockchainMgr.Instance.claimArk(0);
                    break;
                }
                case '2': {
                    //调用合约
                    BlockchainMgr.Instance.claimArk(0.01);
                    break;
                }
            }
        }
    }

    onBtnEditNicknameClick() {
        EditNicknamePanel.Instance.node.active = true;
    }

    onBtnSponsorClick() {
        // CvsMain.EnterUI(WorldUI);
    }

    onAddressClick() {
        window.open('https://explorer.nebulas.io/address/' + BlockchainMgr.WalletAddress);
    }

    onBookClick() {
        console.log('哪有白皮书')
    }

    onBtnClearStorageClick() {
        cc.sys.localStorage.clear();
        setTimeout(() => location.reload(), 100);
        console.log('成功清除存储');
    }

    onBtnSwitchMusicClick() {
        const as = MainCtrl.Instance.getComponent(cc.AudioSource);
        as.volume = as.volume > 0 ? 0 : 0.25;
        this.lblMusicButton.string = as.volume > 0 ? '音乐：开' : '音乐：关';
    }

    onTestCheat0Click() {
        DataMgr.myCargoData.forEach(d => d.amount = 1e6);
    }
}
