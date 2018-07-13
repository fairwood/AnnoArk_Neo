import CvsMain from "../CvsMain";
import HomeUI from "../HomeUI";

const {ccclass, property} = cc._decorator;

@ccclass
export default class IntroUI extends cc.Component {

    onBtnStartClick () {
        CvsMain.EnterUI(HomeUI);
    }

}
