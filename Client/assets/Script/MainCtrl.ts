import CvsMain from "./CvsMain";
import { DataMgr } from "./DataMgr";
import HomeUI from "./HomeUI";
import BlockchainMgr from "./BlockchainMgr";

const { ccclass } = cc._decorator;

@ccclass
export default class MainCtrl extends cc.Component {
    static Instance: MainCtrl;
    onLoad() {
        MainCtrl.Instance = this;
        CvsMain.Instance.uiContainer.getChildByName('WorldUI').active = true;

        //加载数据
        cc.loader.loadRes('Building', function (err, txt) {
            console.log('Building loaded', txt);
            DataMgr.BuildingConfig = txt;
        }.bind(this));
        cc.loader.loadRes('Cargo', function (err, txt) {
            console.log('Cargo loaded', txt);
            DataMgr.CargoConfig = txt;
        }.bind(this));
        DataMgr.init();
    }

    static Ticks = 0;

    syncTimestampCountdown = 0;

    bgmHandler: number;
    start() {
        CvsMain.EnterUI(HomeUI);

        // let as = this.node.getComponent(cc.AudioSource);
        setTimeout(() => {
            // as.play();
            let url = cc.url.raw('resources/audio/bgm.mp3');
            this.bgmHandler = cc.audioEngine.play(url, true, 0.5);
        }, 1000);
    }


    update(dt) {
        MainCtrl.Ticks++;

        this.syncTimestampCountdown -= dt;
        if (this.syncTimestampCountdown <= 0) {
            BlockchainMgr.Instance.getFunction('getTimestamp', [], (resp) => {
                try {
                    let bcTimestamp = resp.result;
                    DataMgr.timestampOffset = bcTimestamp - Number(new Date());
                } catch (error) {
                    console.error(error);
                }
            });
            this.syncTimestampCountdown += 2;
        }
    }
}