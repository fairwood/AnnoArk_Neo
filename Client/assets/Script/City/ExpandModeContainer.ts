import CityUI from "../CityUI";
import { IJ, DataMgr } from "../DataMgr";
import ExpandBlueprintCell from "./ExpandBlueprintCell";

const { ccclass, property } = cc._decorator;

@ccclass
export class ExpandModeContainer extends cc.Component {

    cityUI: CityUI = null;

    @property(cc.Node)
    expandBlueprintCellTemplate: cc.Node = null;
    @property(cc.Node)
    sprGrid: cc.Node = null;

    expandBlueprintCellMap = {};

    clrLabelEnough: cc.Color;
    clrLabelNotEnough = cc.Color.RED;

    willExpandMap = {};

    onLoad() {
        this.cityUI = CityUI.Instance;

        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.cityUI.onPanPadTouchMove, this.cityUI);
        this.node.on(cc.Node.EventType.MOUSE_WHEEL, this.cityUI.onMouseWheel, this.cityUI);
        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.cityUI.onMouseWheel, this.cityUI);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchUp, this);

        this.expandBlueprintCellTemplate.active = false;
        this.clrLabelEnough = this.cityUI.lblExpandCost.node.color;
    }

    onEnable() {
        this.willExpandMap = {};
        let maxRadius = 4;
        let expandMap = DataMgr.myUser.expandMap;
        for (let key in expandMap) {
            let ij = JSON.parse('[' + key + ']');
            let farthest = Math.max(Math.abs(ij[0]), Math.abs(ij[1]));
            if (maxRadius < farthest) maxRadius = farthest;
        }

        const extent = 3;
        for (let i = -maxRadius - extent; i <= maxRadius + extent; i++) {
            for (let j = -maxRadius - extent; j <= maxRadius + extent; j++) {
                let key = i + ',' + j;
                let cell: ExpandBlueprintCell = this.checkAndCreateCell(i, j, key);
                if (cell) cell.refresh(false);
            }
        }

        let size = ((maxRadius + extent) * 2 + 1) * 100;
        this.sprGrid.setContentSize(size + 1, size + 1); //+1为了多显示一条白边
        this.node.setContentSize(size + 5e2, size + 5e2);

        this.refreshCost();
    }

    onTouchUp(event) {
        let curLoc = event.getLocation();
        let displacement = new cc.Vec2(curLoc.x, curLoc.y).sub(event.getStartLocation());
        if (displacement.mag() < 20) {
            let touchPos = this.node.convertTouchToNodeSpaceAR(event.touch);
            let i = Math.floor((touchPos.x + 50) / 100);//直接用round会有-0，+0的问题
            let j = Math.floor((touchPos.y + 50) / 100);
            let key = i + ',' + j;
            let cell: ExpandBlueprintCell = this.checkAndCreateCell(i, j, key);
            if (cell) {
                if (this.willExpandMap[key]) {
                    delete this.willExpandMap[key];
                    cell.refresh(false);
                } else {
                    let expanded = DataMgr.getCityIJExpanded(DataMgr.myUser, i, j);
                    if (!expanded) {
                        this.willExpandMap[key] = true;
                        cell.refresh(true);
                    }
                }
            }
            this.refreshCost();
        }
    }

    refreshCost() {
        let cost = this.getCost();
        this.cityUI.lblExpandCost.string = '消耗 ' + cost.toFixed() + ' 浮力模块';
        let floatmod: number = (DataMgr.getUserCurrentCargoData(DataMgr.myUser)['floatmod'] || 0);
        this.cityUI.lblExpandCost.node.color = floatmod < cost ? this.clrLabelNotEnough : this.clrLabelEnough;
    }

    checkAndCreateCell(i, j, key) {
        if (DataMgr.getCityIJExpanded(DataMgr.myUser, i, j)) return null;
        if (!key) key = i + ',' + j;
        let cell: ExpandBlueprintCell = this.expandBlueprintCellMap[key];
        if (!cell) {
            let node = cc.instantiate(this.expandBlueprintCellTemplate);
            node.parent = this.node;
            node.position = new cc.Vec2(i * 100, j * 100);
            cell = node.getComponent(ExpandBlueprintCell);
            cell.i = i;
            cell.j = j;
            this.expandBlueprintCellMap[key] = cell;
            node.active = true;
        }
        return cell;
    }

    getCost() {
        let cost = 0;
        for (let key in this.willExpandMap) {
            let ij = JSON.parse('[' + key + ']');
            cost += DataMgr.getExpandNeedFloatmod(ij[0], ij[1]);
        }
        return cost;
    }

    getIJList() {
        let res = [];
        for (let key in this.willExpandMap) {
            let ij = JSON.parse('[' + key + ']');
            res.push(ij);
        }
        return res;
    }
}