const { ccclass, property } = cc._decorator;

@ccclass
export default class AsyncLoadSprite extends cc.Component {

    @property(cc.Float)
    delay: number = 0;
    @property(cc.String)
    path: string = '';

    start() {
        setTimeout(this.loadSprite.bind(this), this.delay * 1000);
    }

    loadSprite() {
        try {
            let self = this;
            cc.loader.loadRes(self.path, cc.SpriteFrame, function (err, spriteFrame) {
                if (!err) {
                    let spr = self.node.getComponent(cc.Sprite);
                    if (spr) {
                        spr.spriteFrame = spriteFrame;
                    }
                }
            });
        } catch (error) {
            console.error(error);
        }
    }
}