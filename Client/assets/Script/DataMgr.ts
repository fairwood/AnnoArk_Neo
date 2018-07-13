import WorldUI from "./WorldUI";

export class DataMgr {

    static myData: UserData;
    static myCargoData: CargoData[];
    static myBuildingData: BuildingData[];
    static myTechData: TechData[];
    static idleWorkers: number = 0;
    static currentWorkingTech: string;
    static populationLimit: number = 0;
    static aboveIronMine = false;

    static othersData = {};
    static allIslandData = {};

    static BuildingConfig: BuildingInfo[];
    static CargoConfig: CargoInfo[];
    static TechConfig: TechInfo[];
    static IronMineConfig: MineInfo[];

    static changed = false;
    static populationGrowPerMin = 0;
    static researchRatePerMin = 0;
    static outputRates = {};

    static SmallArkSize = 7;
    static StdArkSize = 9;
    static LargeArkSize = 21;

    static MethaneCostPerKmPerSize = 0.005;

    static RechargeToArkSize = [
        [0, 9],
        [0.001, 13],
        [0.006, 17],
        [0.01, 21],
        [0.1, 25],
        [1, 30],
        [4, 35],
    ]

    static getArkSpeedByTech(hasTech?: boolean) {
        if (hasTech) {
            return 500;
        }
        return 200;
    }

    static GetArkSizeByRecharge(rechargeOnExpandInNas: number) {
        for (let i = this.RechargeToArkSize.length - 1; i >= 0; i--) {
            if (rechargeOnExpandInNas >= this.RechargeToArkSize[i][0]) {
                return this.RechargeToArkSize[i][1];
            }
        }
    }
    static getMethaneCostOfAttack(distance: number, tankPower, chopperPower, shipPower) {
        return 0.01 * distance * (tankPower + chopperPower + shipPower);
    }

    static calcCurrentMoneyInIsland(data: IslandData): number {
        const isMining = data.occupant && data.occupant.length > 0;
        let curMoney = data.money * (isMining ? Math.exp(-data.miningRate * (Number(new Date()) - data.lastMineTime) / (1000 * 3600)) : 1);
        return curMoney;
    }

    static readData() {
        try {
            let myData = JSON.parse(cc.sys.localStorage.getItem('user0'));
            DataMgr.myData = myData;
            DataMgr.myBuildingData = JSON.parse(cc.sys.localStorage.getItem('user0Building'));
            DataMgr.myCargoData = JSON.parse(cc.sys.localStorage.getItem('user0Cargo'));
            DataMgr.myTechData = JSON.parse(cc.sys.localStorage.getItem('user0Tech'));
            DataMgr.currentWorkingTech = JSON.parse(cc.sys.localStorage.getItem('user0CurrentWorkingTech'));
            DataMgr.changed = true;
            console.log('finish read data', myData);
        } catch (error) {
            console.error(error);
        }
    }
    static autosaveCountdown = 15;
    static writeData() {
        try {
            if (DataMgr.myData) {
                cc.sys.localStorage.setItem('user0', JSON.stringify(DataMgr.myData));
                cc.sys.localStorage.setItem('user0Building', JSON.stringify(DataMgr.myBuildingData));
                cc.sys.localStorage.setItem('user0Cargo', JSON.stringify(DataMgr.myCargoData));
                cc.sys.localStorage.setItem('user0Tech', JSON.stringify(DataMgr.myTechData));
                cc.sys.localStorage.setItem('user0CurrentWorkingTech', JSON.stringify(DataMgr.currentWorkingTech));
                this.autosaveCountdown += 15;
                console.log('finish write data', DataMgr.myData, DataMgr.myBuildingData);
            }
        } catch (error) {
            console.error(error);
        }
    }
    static clearData() {
        cc.sys.localStorage.removeItem('user0');
        cc.sys.localStorage.removeItem('user0Building');
    }

}

export class UserData {
    nickname: string;
    address: string; //区块链地址
    country: string;
    arkSize: number; //0: 简陋方舟, 1, 2
    currentLocation: cc.Vec2 = cc.Vec2.ZERO;
    population: number = 8;
    speed: number = 0; //km/分钟
    locationX: number;
    locationY: number;
    lastLocationTime: number;
    destinationX: number;
    destinationY: number;
    rechargeOnExpand: number; //扩建花了多少钱
}
export class BuildingInfo {
    id: string;
    Name: string;
    Length: number;
    Width: number;
    MaxHuman;
}
export class BuildingData {
    id: string;
    ij: IJ;
    workers: number = 0;

    isWorking = false;
}
export class CargoInfo {
    id: string;
    Name: string;
}
export class CargoData {
    id: string;
    amount: number = 0;
}
export class TechInfo {
    id: string;
    Name: string;
    Work: number;
}
export class TechData {
    id: string;
    filledWork: number;
    finished: boolean;
}
export class MineInfo {
    polygonCollider: cc.PolygonCollider;
    points: cc.Vec2[];
}
export class IslandData {
    location: cc.Vec2;
    id: number;
    occupant: string; //当前占领者addr
    tankPower: number = 0;
    chopperPower: number = 0;
    shipPower: number = 0;
    money: number = 0; //里面还有多少nas
    sponsor: string;//赞助商账号
    sponsorName: string = '';//赞助商名称
    sponsorLink: string;//赞助商链接
    // minMiningSpeed: number = 0.04167; //NAS/h 挖矿速度
    miningRate: number = 0.02;///h 挖矿百分比速度，实际挖矿速度=max(minMiningSpeed, money*miningRate）
    balanceMap: number = 0; //当前占领者可收获的NAS
    lastMineTime: number; //当前数据的时间戳
    lastBattleTime: number;
}
export class IJ {
    i: number = 0;
    j: number = 0;

    clone() {
        let ij = new IJ();
        ij.i = this.i;
        ij.j = this.j;
        return ij;
    }
    static get ZERO(): IJ {
        return new IJ();
    }
}