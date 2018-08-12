const { ccclass, property } = cc._decorator;

@ccclass
export class FlagMgr {

    static setFlag(spr: cc.Sprite, country: string) {
        try {
            if (!country) {
                spr.spriteFrame = null;
                return;
            }
            if (FlagMgr.flagNames.find(f => f == country)) {
                cc.loader.loadRes("flags/" + country, cc.SpriteFrame, function (err, spriteFrame) {
                    if (!err) spr.spriteFrame = spriteFrame;
                });
            } else {
                spr.spriteFrame = null;
            }
        } catch (error) {
            console.error(error);
            spr.spriteFrame = null;
        }
    }

    static flagNames = [
        "cn", "us", "jp", "kr", "eng", "ru", "de", "at", "au", "be", "bg", "br", "ch", "cl", "co", "cr", "cs",
        "dk", "es", "fr", "gh", "hr", "ir", "is", "it",
        "kp", "ma", "mx", "ng", "nir", "nl", "pa", "pe", "pl",
        "pt", "py", "sa", "sco", "se", "sk", "sn", "tn", "uy", "wal"
    ]
}