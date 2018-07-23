import CvsMain from "./CvsMain";
import BaseUI from "./BaseUI";
import MainCtrl from "./MainCtrl";
import { DataMgr, UserData, CargoData, TechData, LocationData } from "./DataMgr";
import WorldUI from "./WorldUI";
import ToastPanel from "./UI/ToastPanel";
import BlockchainMgr from "./BlockchainMgr";
import EditNicknamePanel from "./UI/EditNicknamePanel";
import { FlagMgr } from "./UI/FlagMgr";
import DialogPanel from "./UI/DialogPanel";

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
    @property(cc.Label)
    lblNickname: cc.Label = null;
    @property(cc.Label)
    lblLv: cc.Label = null;
    @property(cc.Sprite)
    sprFlag: cc.Sprite = null;
    country: string;

    @property(cc.Label)
    lblMusicButton: cc.Label = null;

    @property(cc.EditBox)
    edtBlockchainAddress: cc.EditBox = null;

    refreshCountdown = 0;

    start() {
        ToastPanel.Toast('正在读取您的钱包信息，请稍候');
    }

    update(dt) {

        if (this.refreshCountdown < 0) {
            this.refresh();
        }

        this.refreshCountdown -= dt;
    }

    refresh() {
        if (DataMgr.myUser) {
            if (DataMgr.myUser.nickname) this.lblNickname.string = DataMgr.myUser.nickname;
            if (DataMgr.myUser.country) this.country = DataMgr.myUser.country;
            this.lblLv.string = 'Level ' + (Math.floor(Math.pow(DataMgr.myUser.expandCnt, 0.5)) + 1).toFixed();
        }
        FlagMgr.setFlag(this.sprFlag, this.country);
        this.lblTotalArkCount.string = (Object.keys(DataMgr.allUsers).length).toFixed();

        this.refreshCountdown = 1;

        this.lblMusicButton.string = MainCtrl.Instance.getComponent(cc.AudioSource).volume > 0 ? '音乐：开' : '音乐：关';
    }

    onClaim(event) {
        //检查昵称、国家
        if (!this.lblNickname.string || !this.country) {
            CvsMain.OpenPanel(EditNicknamePanel);
            ToastPanel.Toast('请先设置国旗和昵称');
            return;
        }
        if (DataMgr.myUser) {
            CvsMain.EnterUI(WorldUI);
        } else {//DataMgr.myData == null
            const nickname = HomeUI.Instance.lblNickname.string;
            const country = HomeUI.Instance.country;
            BlockchainMgr.Instance.callFunction('claimNewUser', [nickname, country], 0, (resp) => {
                console.log("claimNewUser: ", resp);
                if (resp.toString().substr(0, 5) != 'Error') {
                    DialogPanel.PopupWith2Buttons('正在发送方舟，请等候15秒',
                        '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                            window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                        }, '确定', null);
                } else {
                    ToastPanel.Toast('交易失败:' + resp);
                }
            });
        }
    }

    onBtnEditNicknameClick() {
        CvsMain.OpenPanel(EditNicknamePanel);
    }

    onWatchWorldClick() {
        CvsMain.EnterUI(WorldUI);
    }

    onBtnSponsorClick() {
        // CvsMain.EnterUI(WorldUI);
    }

    onInputAddress(edt) {
        console.log('手动输入地址', edt.string);
        const address = edt.string;
        if (address) {
            BlockchainMgr.WalletAddress = address;
            BlockchainMgr.Instance.fetchAllDataCountdown = 1;
        }
    }

    onExplorerClick() {
        window.open('https://explorer.nebulas.io/address/' + BlockchainMgr.WalletAddress);
    }

    onBookClick() {
        console.log('哪有白皮书')
    }

    // onBtnClearStorageClick() {
    //     cc.sys.localStorage.clear();
    //     setTimeout(() => location.reload(), 100);
    //     console.log('成功清除存储');
    // }

    onBtnSwitchMusicClick() {
        const as = MainCtrl.Instance.getComponent(cc.AudioSource);
        as.volume = as.volume > 0 ? 0 : 0.25;
        this.lblMusicButton.string = as.volume > 0 ? '音乐：开' : '音乐：关';
    }
    onInstallWalletClick() {
        window.open("https://github.com/ChengOrangeJu/WebExtensionWallet");
    }

    onTestCheat0Click() {
        let curTime = Number(new Date());
        let user = new UserData();
        DataMgr.myUser = user;
        user.address = "testaddress";
        user.nickname = "测试昵称";
        user.country = "cn";
        user.buildingMap = {
            '-1,1': { id: "ironcoll", lv: 0, justBuildOrUpgrade: true },
            '-1,2': { id: "energycoll", lv: 1, justBuildOrUpgrade: true },
            '-2,2': { id: "fighterprod", lv: 2, recoverTime: curTime + 10 * 60e3, justBuildOrUpgrade: true },
            '-2,3': { id: "bomberprod", lv: 3, recoverTime: curTime - 10e4, justBuildOrUpgrade: true },
            '-3,3': { id: "laserprod", lv: 4, recoverTime: curTime + 100 * 60e3, justBuildOrUpgrade: false },
        };
        user.expandCnt = 1;
        user.expandMap = {
            '-1,1': { order: 0 },
            // '-1,2': { order: 1 },
            // '-2,2': { order: 2 },
            // '-2,3': { order: 3 },
            // '-3,3': { order: 3 },
        };
        user.cargoData = {
            iron: 320,
            energy: 120,
        };
        user.locationData = new LocationData();
        user.locationData = {
            speed: 100,
            lastLocationX: -4050,
            lastLocationY: -230,
            lastLocationTime: curTime - 100000,
            destinationX: 3920,
            destinationY: 2390
        }
        user.collectingStarIndex = 24;
    }
}
