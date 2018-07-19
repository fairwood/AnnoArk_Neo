import CvsMain from "../CvsMain";
import HomeUI from "../HomeUI";

const {ccclass, property} = cc._decorator;

@ccclass
export default class IntroUI extends cc.Component {

    onBtnStartClick () {
        CvsMain.EnterUI(HomeUI);
        let tt = {a:3,b:4,c:9,d:{h:'stses'}}
        console.log('==============[]【】这个好用吗', tt)
    }

}
