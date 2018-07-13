
const { ccclass, property } = cc._decorator;

@ccclass
export default class IronMine extends cc.Component {

    gra: cc.Graphics;
    col: cc.PolygonCollider;

    onLoad() {
        this.gra = this.getComponent(cc.Graphics);
        this.col = this.getComponent(cc.PolygonCollider);
        if (this.col.points.length >= 3 && this.gra) {
            this.gra.moveTo(this.col.points[0].x, this.col.points[0].y);
            for (let i = 1; i < this.col.points.length; i++) {
                const p = this.col.points[i];
                this.gra.lineTo(p.x, p.y);
            }
            this.gra.close();
            this.gra.fill();
        }
    }

    // start() {

    // }

    // update (dt) {}
}
