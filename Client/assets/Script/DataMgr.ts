import MathUtil from "./Utils/MathUtil";
import BlockchainMgr from "./BlockchainMgr";

export class DataMgr {

    static coinUnit = 'GAS';

    static myUser: UserData;

    static allUsers = {};
    static allIslandData = {};

    static BuildingConfig: BuildingInfo[];
    static CargoConfig: CargoInfo[];

    static outputRates = {};

    private static allPirates = {};

    static cityMoveSpeed = 150;
    static raidCityCargoRate = 0.1;
    static safeZoneLine = 1567;
    static damagePerAttackCity = 0.1;
    static energyCostPerLyExpand = 0.01;
    static nukemissSpeed = 3600;
    static nukeRadius = 120;
    static totalPirateCnt = 1000;
    static pirateCargoC0 = 100;
    static pirateArmyC0 = 10;
    static piratePeriodTimestamp = 0;

    static timestampOffset = 0;//区块链时间戳比本地系统时间快多少毫秒

    private static inited = false;
    static init() {
        if (this.inited) return;
        this.inited = true;
    }

    static getBlockchainTimestamp() {
        return Number(new Date()) + this.timestampOffset;
    }

    static getUserLevel(user) {
        return Math.floor(Math.pow(user.expandCnt, 0.5)) + 1;
    }
    static getUserHull(user) {
        let curCityHull = Math.min(1, 1 - (user.healMaxTimestamp - DataMgr.getBlockchainTimestamp()) / 3600e3 * this.damagePerAttackCity);
        return curCityHull;
    }
    static getUserCurrentLocation(user) {
        let lastLocation = new cc.Vec2(user.locationData.lastLocationX, user.locationData.lastLocationY);
        if (user.locationData.destinationX == null || user.locationData.destinationY == null) return lastLocation;
        let destination = new cc.Vec2(user.locationData.destinationX, user.locationData.destinationY);
        let dist = lastLocation.sub(destination).mag();
        let time = dist / (user.locationData.speed / 60 / 1000);
        let t = (Number(new Date()) - user.locationData.lastLocationTime) / time;
        return MathUtil.lerpVec2(lastLocation, destination, t, true);
    }

    static getSailEnergyCost(user: UserData, distance: number) {
        // let locationData = user.locationData;
        // let dX = destinaion.x - locationData.lastLocationX;
        // let dY = destinaion.y - locationData.lastLocationY;
        // let dist = Math.sqrt(dX * dX + dY * dY);
        return distance * Math.sqrt(user.expandCnt + 81) * this.energyCostPerLyExpand;
    }

    static getEnergyCostOfAttack(distance: number, tankPower, chopperPower, shipPower) {
        return 1 * (tankPower + chopperPower + shipPower);
    }

    static calcCurrentMoneyInIsland(data: IslandData): number {
        const isMining = data.occupant && data.occupant.length > 0;
        let curMoney = data.money * (isMining ? Math.exp(-data.miningRate * (Number(new Date()) - data.lastMineTime) / (1000 * 3600)) : 1);
        return curMoney;
    }
    static getBuildingInfo(id: string): BuildingInfo {
        return DataMgr.BuildingConfig.find(info => info.id == id);
    }
    static getCargoInfo(id: string): CargoInfo {
        return DataMgr.CargoConfig.find(info => info.id == id);
    }
    static getCityIJExpanded(user, i, j) {
        if (Math.abs(i) <= 4 && Math.abs(j) <= 4) {
            return {};
        }
        return user.expandMap[i + ',' + j]
    }

    static fetchUserDataFromBlockchain(userAddress, callback?: (data) => void) {
        BlockchainMgr.Instance.getFunction('getUser', [userAddress], (resp) => {
            console.log('getUser resp:', resp);
            try {
                let data = JSON.parse(resp.result);
                if (data) {
                    this.allUsers[userAddress] = data;
                    if (callback) callback(data);
                }
            } catch (error) {
                console.error(error);
            }
        });
    }
    private static getPirateInfo(index) {
        if (index >= this.totalPirateCnt) {
            throw new Error("index must < totalPirateCnt." + index + '<' + this.totalPirateCnt);
        }
        let curPeriodTimestamp = this.piratePeriodTimestamp;
        let curTime = (new Date()).valueOf();
        if (curTime / 3600e3 >= Math.floor(curPeriodTimestamp / 3600e3 + 1)) {
            //newPeriod
            curPeriodTimestamp = Math.floor(curTime / 3600e3) * 3600e3;
            this.piratePeriodTimestamp = curPeriodTimestamp;
        }
        let seed = curPeriodTimestamp.toString() + index.toString();
        let random = this.APHash1(seed);//0~1  
        let lv = Math.floor(Math.pow(random, 3) * 15) + 1;
        let cargoMainFactor = lv * lv;//物资与lv^2成正比
        let armyMainFactor = lv * lv * lv;//部队数量与lv^3成正比

        let a = (this.APHash1(seed + 'theta'));
        let b = (this.APHash1(seed + 'rho'));
        let theta = a * Math.PI * 2;
        let l = Math.sqrt(b) * 5700;
        let x = Math.cos(theta) * l;
        let y = Math.sin(theta) * l;
        let pirateInfo = {};
        pirateInfo.x = x;
        pirateInfo.y = y;
        pirateInfo.lv = lv;
        //cargo
        let cargo = {};
        let cargoFactors = {
            silicon: 1,
            carbon: 0.7,
            iron: 0.5,
            chip: 0.05,
            deuter: 0.0001,
            //floatmod: 0.04,
        }
        for (let key in cargoFactors) {
            let c = (this.APHash1(seed + key));
            cargo[key] = Math.round(this.pirateCargoC0 * cargoMainFactor * c * cargoFactors[key]);
        }
        cargo.floatmod = cargoMainFactor;
        pirateInfo.cargo = cargo;
        //army
        let army = {};
        let armyFactors = {
            tank: 1,
            chopper: 0.8,
            ship: 0.2,
        }
        for (let key in armyFactors) {
            let c = (this.APHash1(seed + key));
            army[key] = Math.round(this.pirateArmyC0 * armyMainFactor * c * armyFactors[key]);
        }
        pirateInfo.army = army;
        return pirateInfo;
    }
    static getPirateData(pirateIndex) {
        //check period
        let curPeriodTimestamp = this.piratePeriodTimestamp;
        let curTime = this.getBlockchainTimestamp();
        if (curTime / 3600e3 >= Math.floor(curPeriodTimestamp / 3600e3 + 1)) {
            //newPeriod
            curPeriodTimestamp = Math.floor(curTime / 3600e3) * 3600e3;
            this.piratePeriodTimestamp = curPeriodTimestamp;
        }

        let pirate = this.allPirates[pirateIndex];
        if (!pirate) {
            pirate = {};
            pirate.respawnTimestamp = 0;
        }
        pirate.index = pirateIndex;
        let info = this.getPirateInfo(pirateIndex);
        pirate.__proto__ = info;
        if (pirate.respawnTimestamp < this.piratePeriodTimestamp) {
            delete pirate.army;
            pirate.alive = true;
        }
        return pirate;
    }
    static fetchPirateDataFromBlockchain(pirateIndex, callback?: (data) => void) {
        BlockchainMgr.Instance.getFunction('getPirateInfo', [pirateIndex], (resp) => {
            console.log('getPirateInfo resp:', resp);
            try {
                let data = JSON.parse(resp.result);
                if (data) {
                    this.allPirates[pirateIndex] = data;
                    if (callback) callback(DataMgr.getPirateData(pirateIndex));
                }
            } catch (error) {
                console.error(error);
            }
        });
    }
    static APHash1(str: string) {
        let hash = 0xAAAAAAAA;
        for (let i = 0; i < str.length; i++) {
            if ((i & 1) == 0) {
                hash ^= ((hash << 7) ^ str.charCodeAt(i) * (hash >> 3));
            }
            else {
                hash ^= (~((hash << 11) + str.charCodeAt(i) ^ (hash >> 5)));
            }
        }
        return hash / 0xAAAAAAAA / 1.5 + 0.5;
    }

    static getExpandNeedFloatmod(i, j) {
        let radius = Math.max(Math.abs(i), Math.abs(j));
        let t = radius - 3;
        let res = t * t * t;
        return res;
    }

    static getBuildingInfoItemWithLv(buildingId, itemName, lv) {
        let value = DataMgr.getBuildingInfo(buildingId)[itemName];
        let multi = DataMgr.getBuildingInfo('_upgradeRate')[itemName];
        if (!value) return 0;
        value = Number(value);
        if (!isNaN(multi) && multi > 0) {
            value = value * Math.pow(multi, lv);
        }
        return value;
    }

    static getUserWarehouseCap(user: UserData, cargoName) {
        let cap = 0;
        for (let key in user.buildingMap) {
            let bdg = user.buildingMap[key];
            if (!bdg) continue;
            let info = this.getBuildingInfo(bdg.id);
            if (info && info.HouseOf == cargoName) {
                cap += this.getBuildingInfoItemWithLv(bdg.id, 'Capacity', bdg.lv);
            }
        }
        return cap;
    }

    static getUserCurrentCargoData(user: UserData) {
        let curCargoData = {};
        for (let key in user.cargoData) {
            curCargoData[key] = user.cargoData[key];
        }
        //collecting
        let addCargos = {};
        for (let key in user.buildingMap) {
            let bdg = user.buildingMap[key];
            if (!bdg) continue;
            let info = this.getBuildingInfo(bdg.id);
            if (info.Out0 && info.Out0Rate > 0) {
                let cargoName = info.Out0;
                if (!addCargos[cargoName]) {
                    addCargos[cargoName] = 0;
                }
                addCargos[cargoName] += this.getBuildingInfoItemWithLv(bdg.id, 'Out0Rate', bdg.lv);
            }
        }

        let collectingMinutes = (this.getBlockchainTimestamp() - user.lastCalcTime) / 60e3;
        for (let cargoName in addCargos) {
            let addCargoAmount = addCargos[cargoName] * collectingMinutes;
            let capacity = this.getUserWarehouseCap(user, cargoName);
            if (curCargoData[cargoName] < capacity) {
                let addedAmount = Math.min(addCargoAmount, capacity - curCargoData[cargoName]);
                curCargoData[cargoName] = curCargoData[cargoName] + addedAmount;
            }
        }
        return curCargoData;
    }
    static getUserCollectorRate(user: UserData, cargoName: string) {
        if (user === null) {
            throw new Error("User NOT FOUND.");
        }
        let rate = 0;
        for (let key in user.buildingMap) {
            let bdg = user.buildingMap[key];
            if (!bdg) continue;
            let info = this.getBuildingInfo(bdg.id);
            let out0 = info.Out0;
            if (out0 === cargoName) {
                let out0Rate = this.getBuildingInfoItemWithLv(bdg.id, 'Out0Rate', bdg.lv);
                rate += out0Rate;
            }
        }
        return rate;
    }
}

export class StarInfo {
    x: number;
    y: number;
    ironAbundance: number;
    energyAbundance: number;
}
export class LocationData {
    speed: number; //ly/分钟
    lastLocationX: number;
    lastLocationY: number;
    lastLocationTime: number;
    destinationX: number;
    destinationY: number;
}
export class UserData {
    nickname: string;
    address: string; //区块链地址
    country: string;
    expandCnt = 0;
    state = 0; //0:sailing 1:collecting
    hull = 1; //完整度
    locationData: LocationData;
    expandMap = {
        //"-3,2": {order: 0}
    };
    buildingMap = {
        //"-3,2":{id:"ironcoll", lv:2, recoverTime:10302019313, justBuildOrUpgrade: true}
    };
    cargoData = {
        iron: 0,
        energy: 0,
    };
    collectingStarIndex = null;
    lastCalcTime = (new Date()).valueOf();
}
export class BuildingInfo {
    id: string;
    Order: number;
    Name: string;
    CanBuild;
    Type: string;
    BuildMat0; BuildMat0Cnt; BuildMat1; BuildMat1Cnt; BuildMat2; BuildMat2Cnt; Money; In0; In0Amt; In1; In1Amt; In2; In2Amt; In3; In3Amt; Out0; Out0Rate; CDPerUnit; MaxQueue; HouseOf; Capacity; MaxLevel;
    Pic: string;
    Description: string;
}
export class BuildingData {
    id: string;
    lv: number;
    recoverTime: number;
    justBuildOrUpgrade: boolean;
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
    index: number;
    x: number;
    y: number;
    occupant: string; //当前占领者address
    lastMineTime: number; // 上次开始挖矿的时间
    army: { tank: 0, chopper: 0, ship: 0 };
    money: number = 0; //里面还有多少nas
    sponsor: string;//赞助商address
    sponsorName: string = '';//赞助商名称
    sponsorLink: string;//赞助商链接
    sponsorPic: string;//赞助商图片地址
    miningRate: number = 0.02;///h 挖矿百分比速度，实际挖矿速度=max(minMiningSpeed, money*miningRate）
    mineBalance: number = 0; //当前占领者可收获的NAS
    lastCalcTime: number;
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