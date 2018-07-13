import CvsMain from "./CvsMain";
import HomeUI from "./HomeUI";
import { DataMgr, UserData, CargoData, MineInfo, IslandData, TechData } from "./DataMgr";
import WorldUI from "./WorldUI";
import IntroUI from "./UI/IntroUI";
import Island from "./World/Island";
import ToastPanel from "./UI/ToastPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MainCtrl extends cc.Component {
    static Instance: MainCtrl;
    onLoad() {
        MainCtrl.Instance = this;
        DataMgr.readData();
        CvsMain.Instance.uiContainer.getChildByName('WorldUI').active = true;

        //加载数据
        cc.loader.loadRes('Building', function (err, txt) {
            console.log('Building loaded', txt);
            DataMgr.BuildingConfig = txt;
            if (!DataMgr.myBuildingData) DataMgr.myBuildingData = [];
        }.bind(this));
        cc.loader.loadRes('Cargo', function (err, txt) {
            console.log('Cargo loaded', txt, DataMgr.myCargoData);
            DataMgr.CargoConfig = txt;
            if (!DataMgr.myCargoData) {
                DataMgr.myCargoData = [];
                DataMgr.CargoConfig.forEach(cargoInfo => {
                    let data = new CargoData();
                    data.id = cargoInfo.id;
                    data.amount = 0;
                    DataMgr.myCargoData.push(data);
                });
            }
        }.bind(this));
        cc.loader.loadRes('Tech', function (err, txt) {
            console.log('Tech loaded', txt, DataMgr.myTechData);
            DataMgr.TechConfig = txt;
            if (!DataMgr.myTechData) {
                DataMgr.myTechData = [];
                DataMgr.TechConfig.forEach(techInfo => {
                    let data = new TechData();
                    data.id = techInfo.id;
                    data.filledWork = 0;
                    data.finished = false;
                    DataMgr.myTechData.push(data);
                });
            }
        }.bind(this));
    }

    static Ticks = 0;

    start() {
        CvsMain.EnterUI(IntroUI);

        DataMgr.IronMineConfig = [];
        WorldUI.Instance.mineContainer.children.forEach(c => {
            const polygon = c.getComponent(cc.PolygonCollider);
            if (polygon) {
                const info = new MineInfo();
                info.polygonCollider = polygon;
                const points = [];
                polygon.points.forEach(p => {
                    points.push(polygon.node.position.add(polygon.offset).add(p));
                });
                info.points = points;
                DataMgr.IronMineConfig.push(info);
            }
        });
        WorldUI.Instance.islandContainer.children.forEach(c => {
            const island = c.getComponent(Island);
            const islandData = new IslandData();
            islandData.id = parseInt(island.name);
            islandData.location = island.node.position;
            DataMgr.allIslandData[islandData.id] = islandData;
            island.setData(islandData);
        });

        let as = this.node.getComponent(cc.AudioSource);
        setTimeout(() => {
            as.play();
        }, 1000);
    }


    gotoHome() {
        CvsMain.EnterUI(HomeUI);
    }

    generateSmallArkData() {
        let user = new UserData();
        user.arkSize = DataMgr.SmallArkSize;
        let rad = Math.random() * Math.PI;
        user.locationX = Math.cos(rad) * 4000;
        user.locationY = Math.sin(rad) * 4000;
        user.speed = 0;
        user.nickname = HomeUI.Instance.lblNickname.string;
        user.country = HomeUI.Instance.country;
        this.calcSail(user);
        return user;
    }

    update(dt: number) {
        if (!DataMgr.BuildingConfig || !DataMgr.TechConfig || !DataMgr.CargoConfig) return;

        if (DataMgr.myData) {
            DataMgr.populationLimit = 0;
            DataMgr.researchRatePerMin = 0;
            DataMgr.aboveIronMine = false;
            DataMgr.outputRates = {};
            let totalWorkers = 0;

            //航行
            this.calcSail(DataMgr.myData);
            for (let address in DataMgr.othersData) {
                this.calcSail(DataMgr.othersData[address]);
            }

            //检测所属矿区
            DataMgr.IronMineConfig.forEach(m => {
                if (cc.Intersection.pointInPolygon(DataMgr.myData.currentLocation, m.points)) {
                    DataMgr.aboveIronMine = true;
                }
            });

            if (DataMgr.myBuildingData) {
                DataMgr.myBuildingData.forEach(buildingData => {
                    buildingData.isWorking = false;
                    totalWorkers += buildingData.workers;
                    if (this.isHouse(buildingData.id)) {
                        let buildingInfo = DataMgr.BuildingConfig.find(info => info.id == buildingData.id);
                        DataMgr.populationLimit += parseInt(buildingInfo['Arg0']);
                    }
                    else if (buildingData.id == 'research239') {
                        //研究院
                        if (DataMgr.currentWorkingTech) {
                            let buildingInfo = DataMgr.BuildingConfig.find(info => info.id == buildingData.id);
                            let techInfo = DataMgr.TechConfig.find(info => info.id == DataMgr.currentWorkingTech);
                            let techData = DataMgr.myTechData.find(data => data.id == DataMgr.currentWorkingTech);
                            let delta = Math.min(techInfo.Work - techData.filledWork, buildingData.workers / buildingInfo.MaxHuman * 10 / 60 * dt);
                            techData.filledWork += delta;
                            if (techData.filledWork >= techInfo.Work) {
                                techData.finished = true;
                                DataMgr.currentWorkingTech = null;
                                ToastPanel.Toast('新科技研究完成，请制定下一个研究计划');
                            }
                            DataMgr.researchRatePerMin += buildingData.workers * 1;
                        }
                    } else {
                        //生产
                        if (buildingData.workers <= 0) return;
                        // if (buildingData.id == 'ironcoll28' && !DataMgr.aboveIronMine) return;
                        let buildingInfo = DataMgr.BuildingConfig.find(info => info.id == buildingData.id);
                        let raws = [];
                        for (let i = 0; i < 4; i++) {
                            let rawid = buildingInfo['Raw' + i];
                            if (rawid && rawid.length > 0) {
                                const rate = buildingInfo['Raw' + i + 'Rate'] / buildingInfo['MaxHuman'] * buildingData.workers;
                                raws.push([rawid, rate / 60 * dt]);
                                if (!DataMgr.outputRates[rawid]) DataMgr.outputRates[rawid] = 0;
                                DataMgr.outputRates[rawid] -= rate;
                            }
                        }
                        let enough = true;
                        raws.forEach(raw => {
                            if (!enough) return;
                            let cargoData = DataMgr.myCargoData.find(c => c.id == raw[0]);
                            if (cargoData && cargoData.amount > raw[1]) {
                                raw.push(cargoData);
                            } else {
                                enough = false;
                            }
                        });
                        if (enough) {
                            //生产
                            raws.forEach(raw => {
                                raw[2].amount -= raw[1];
                            });
                            for (let i = 0; i < 4; i++) {
                                let outid = buildingInfo['Out' + i];
                                if (outid && outid.length > 0) {
                                    let cargoData = DataMgr.myCargoData.find(c => c.id == outid);
                                    if (!cargoData) {
                                        cargoData = new CargoData();
                                        cargoData.id = outid;
                                        cargoData.amount = 0;
                                        DataMgr.myCargoData.push(cargoData);
                                    }
                                    const rate = buildingInfo['Out' + i + 'Rate'] / buildingInfo['MaxHuman'] * buildingData.workers;
                                    cargoData.amount += rate / 60 * dt;

                                    if (!DataMgr.outputRates[outid]) DataMgr.outputRates[outid] = 0;
                                    DataMgr.outputRates[outid] += rate;
                                }
                            }
                            buildingData.isWorking = true;
                        }
                    }
                });
            }
            DataMgr.idleWorkers = DataMgr.myData.population - totalWorkers;
            if (DataMgr.myData && DataMgr.myCargoData) {
                //检查食物
                let rate = DataMgr.myData.population * 1;
                let needToConsumeFood = rate / 60 * dt;
                if (!DataMgr.outputRates['fish34509']) DataMgr.outputRates['fish34509'] = 0;
                DataMgr.outputRates['fish34509'] -= rate;
                let oriNeedToConsumeFood = needToConsumeFood;
                DataMgr.CargoConfig.forEach(info => {
                    if (info['IsFood'] != 'TRUE') return;
                    let data = DataMgr.myCargoData.find(data => data.id == info.id);
                    if (data && data.amount > 0) {
                        let consumption = Math.min(needToConsumeFood, data.amount);
                        needToConsumeFood -= consumption;
                        data.amount -= consumption;
                    }
                });
                if (needToConsumeFood <= 0 && DataMgr.myData.population < DataMgr.populationLimit) {
                    let newPopulationPerMin = (10 + Math.sqrt(DataMgr.myData.population)) / 10 * 30;//TODO*3
                    let perDt = newPopulationPerMin / 60 * dt;
                    if (Math.random() < perDt) {
                        //新人口
                        DataMgr.myData.population += 1;
                        DataMgr.idleWorkers += 1;
                    }
                    DataMgr.populationGrowPerMin = newPopulationPerMin;
                } else if (needToConsumeFood > 0) {
                    let lackFoodProp = needToConsumeFood / oriNeedToConsumeFood;
                    let dieCountPerMin = Math.max(0, DataMgr.myData.population - 10) * lackFoodProp;
                    let perDt = dieCountPerMin / 60 * dt;
                    if (Math.random() < perDt) {
                        //死1个
                        if (DataMgr.idleWorkers > 0) {
                            DataMgr.myData.population -= 1;
                            DataMgr.idleWorkers -= 1;
                        } else {
                            let canDieList = DataMgr.myBuildingData.filter((d) => d.workers > 0 && d.id != 'fisher8032');
                            if (canDieList.length > 0) {
                                let ranIndex = Math.floor(Math.random() * canDieList.length);
                                canDieList[ranIndex].workers -= 1;
                                DataMgr.myData.population -= 1;
                            }
                        }
                    }
                    DataMgr.populationGrowPerMin = -dieCountPerMin;
                } else {
                    DataMgr.populationGrowPerMin = 0;
                }
            }

            if (DataMgr.autosaveCountdown <= 0) DataMgr.writeData();
        }

        DataMgr.autosaveCountdown -= dt;
        MainCtrl.Ticks++;
    }
    calcSail(data: UserData) {
        if (data.speed && data.speed > 0 && data.destinationX && data.destinationY) {
            let lastTimestamp = data.lastLocationTime;
            let nowTimestamp = Number(new Date());
            let lastLocation = new cc.Vec2(data.locationX, data.locationY);
            let destination = new cc.Vec2(data.destinationX, data.destinationY);
            let needTime = destination.sub(lastLocation).mag() / (data.speed / 60) * 1000;
            let curLocation = MainCtrl.lerpVec2(lastLocation, destination,
                (nowTimestamp - lastTimestamp) / needTime, true);
            data.currentLocation = curLocation;
        } else {
            data.currentLocation = new cc.Vec2(data.locationX, data.locationY);
        }
    }


    static lerp(a: number, b: number, t: number, clamp?: boolean): number {
        if (clamp) t = Math.max(0, Math.min(1, t));
        return a * (1 - t) + b * t;
    }
    static lerpVec2(a: cc.Vec2, b: cc.Vec2, t: number, clamp?: boolean): cc.Vec2 {
        if (clamp) t = Math.max(0, Math.min(1, t));
        return a.mul(1 - t).add(b.mul(t));
    }

    isHouse(id: string) {
        return id == 'dorm08821' || id == 'house8523';
    }
}
