import { DataMgr, UserData, IslandData } from "./DataMgr";
import DialogPanel from "./DialogPanel";
import WorldUI from "./WorldUI";
import ToastPanel from "./UI/ToastPanel";
import CityUI from "./CityUI";
import CvsMain from "./CvsMain";
import HomeUI from "./HomeUI";
import AttackIslandPanel from "./UI/AttackIslandPanel";
import MainCtrl from "./MainCtrl";

const { ccclass, property } = cc._decorator;

declare var Neb: any;
declare var NebPay: any;
declare var Account: any;
declare var HttpRequest: any;
export const ContractAddress = 'n1wJnaszNyRzV8EFmA7UMnkXSC4Cugb8Zp8'; //
export const EncKey = 37234;

@ccclass
export default class BlockchainMgr extends cc.Component {
    static Instance: BlockchainMgr;
    onLoad() {
        BlockchainMgr.Instance = this;
    }

    static BlockchainUrl: string = 'https://mainnet.nebulas.io';
    // static BlockchainUrl: string = 'https://testnet.nebulas.io';
    static WalletAddress: string;

    static CheckWalletInterval = 10;
    static FetchMyDataInterval = 7;
    static FetchAllDataInterval = 20;

    checkWalletCountdown = 1e9;
    fetchMyDataInterval = 1e9;
    fetchAllDataCountdown = 1e9;

    start() {
        this.checkWalletCountdown = 1;
        this.fetchMyDataInterval = 1;
        this.fetchAllDataCountdown = 10;
    }

    //不断刷新当前钱包地址
    update(dt: number) {
        try {
            Neb; NebPay;
        } catch (error) {
            return;
        }

        this.checkWalletCountdown -= dt;
        this.fetchMyDataInterval -= dt;
        this.fetchAllDataCountdown -= dt;

        if (this.checkWalletCountdown <= 0) {
            try {
                let self = this;
                let neb = new Neb();
                neb.setRequest(new HttpRequest(BlockchainMgr.BlockchainUrl));
                neb.api.getNebState().then(function (state) {
                    // self.nebState = state;
                    window.addEventListener('message', self.onGetWalletData);
                    window.postMessage({
                        "target": "contentscript",
                        "data": {},
                        "method": "getAccount",
                    }, "*");
                });
            } catch (error) {
                console.error(error);
            }
            this.checkWalletCountdown = BlockchainMgr.CheckWalletInterval;
        }
        if (this.fetchMyDataInterval <= 0 && BlockchainMgr.WalletAddress) {

            let neb = new Neb();
            neb.setRequest(new HttpRequest(BlockchainMgr.BlockchainUrl));

            let from = BlockchainMgr.WalletAddress;
            var value = "0";
            var nonce = "0"
            var gas_price = "1000000"
            var gas_limit = "2000000"
            var callFunction = "getUser";
            var contract = {
                "function": callFunction,
                "args": JSON.stringify([BlockchainMgr.WalletAddress])
            }
            let self = this;
            neb.api.call(from, ContractAddress, value, nonce, gas_price, gas_limit, contract).then(
                self.onGetMyData
            ).catch(function (err) {
                console.log("call mydata error:" + err.message, from);
            })

            this.fetchMyDataInterval = BlockchainMgr.FetchMyDataInterval;
        }
        if (this.fetchAllDataCountdown <= 0) {
            // const func = 'get_map_info';

            let neb = new Neb();
            neb.setRequest(new HttpRequest(BlockchainMgr.BlockchainUrl));

            let from = BlockchainMgr.WalletAddress ? BlockchainMgr.WalletAddress : Account.NewAccount().getAddressString();
            var value = "0";
            var nonce = "0"
            var gas_price = "1000000"
            var gas_limit = "2000000"
            var callFunction = "getMapInfo";
            var contract = {
                "function": callFunction,
                "args": "[]"
            }
            let self = this;
            neb.api.call(from, ContractAddress, value, nonce, gas_price, gas_limit, contract).then(
                self.onGetAllMapData
            ).catch(function (err) {
                console.log("call get_map_info error:" + err.message)
            })

            this.fetchAllDataCountdown = BlockchainMgr.FetchAllDataInterval;
        }
    }

    getFunction(functionName: string, callArgs, callback) {
        try {
            let neb = new Neb();
            neb.setRequest(new HttpRequest(BlockchainMgr.BlockchainUrl));

            let from = BlockchainMgr.WalletAddress ? BlockchainMgr.WalletAddress : Account.NewAccount().getAddressString();
            var value = "0";
            var nonce = "0"
            var gas_price = "1000000"
            var gas_limit = "2000000"
            var callFunction = functionName;
            var contract = {
                "function": callFunction,
                "args": JSON.stringify(callArgs)
            }
            neb.api.call(from, ContractAddress, value, nonce, gas_price, gas_limit, contract).then(
                callback
            ).catch(function (err) {
                console.error(`Neb call ${functionName} error:` + err.message)
            })
        } catch (error) {
            console.error(error);
        }
    }

    onGetWalletData(e) {
        if (e.data && e.data.data && e.data.data.account && e.data.data.account.length > 0) {
            var address = e.data.data.account;
            if (BlockchainMgr.WalletAddress != address) {
                console.log('Change wallet address:', address);
                BlockchainMgr.WalletAddress = address;
                HomeUI.Instance.edtBlockchainAddress.string = BlockchainMgr.WalletAddress ? BlockchainMgr.WalletAddress : '';
                this.fetchAllDataCountdown = 0;
                try {
                    if (DataMgr.myData && DataMgr.myData.address != address &&
                        (WorldUI.Instance.node.active || CityUI.Instance.node.active)) {
                        CvsMain.EnterUI(HomeUI);
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }

    onGetMyData(resp) {
        console.log('onGetMyData', resp);
        let user = JSON.parse(resp.result);
        if (user) {
            DataMgr.myData = user;
            user.ticks = MainCtrl.Ticks;
        }
    }

    onGetAllMapData(resp) {
        console.log('onGetAllMapData', resp);
        let allData = JSON.parse(resp.result).result_data;
        let allUserData = allData.users;
        let allIslandData = allData.islands;

        DataMgr.othersData = {};
        allUserData.forEach(userJson => {
            if (userJson.address == BlockchainMgr.WalletAddress) {
            } else {
                DataMgr.othersData[userJson.address] = userJson;
            }
        });
        allIslandData.forEach(islandJson => {
            let localData: IslandData = DataMgr.allIslandData[islandJson.id];
            if (localData) {
                for (let key in islandJson) {
                    localData[key] = islandJson[key];
                }
            } else {
                console.error('从区块链获取到未知id的island:', islandJson);
            }
        });
    }

    callFunction(callFunction, callArgs, value, callback) {
        try {
            value = Math.ceil(value * 1e10) / 1e10;
            console.log("调用钱包(", callFunction, callArgs, value);
            var nebPay = new NebPay();
            var callbackUrl = BlockchainMgr.BlockchainUrl;
            var to = ContractAddress;
            let serialNumber = nebPay.call(to, value, callFunction, JSON.stringify(callArgs), {
                qrcode: {
                    showQRCode: false
                },
                goods: {
                    name: "test",
                    desc: "test goods"
                },
                callback: callbackUrl,
                listener: callback
            });
        } catch (error) {
            console.error(error);
        }
    }

    claimNewUser() {
        try {
            const nickname = HomeUI.Instance.lblNickname.string;
            const country = HomeUI.Instance.country;

            var nebPay = new NebPay();
            var serialNumber;
            var callbackUrl = BlockchainMgr.BlockchainUrl;
            var value = 0;
            var to = ContractAddress;
            var callFunction = 'claimNewUser';
            console.log("调用钱包claim_new_user(", nickname, country);
            var callArgs = '["' + nickname + '","' + country + '"]';
            serialNumber = nebPay.call(to, value, callFunction, callArgs, {
                qrcode: {
                    showQRCode: false
                },
                goods: {
                    name: "test",
                    desc: "test goods"
                },
                callback: callbackUrl,
                listener: this.claimNewUserCallback
            });
        } catch (error) {
            console.error(error);
        }
    }
    claimNewUserCallback(resp) {
        console.log("claimNewUserCallback: ", resp);
        if (resp.toString().substr(0, 5) != 'Error') {
            DialogPanel.PopupWith2Buttons('星舰正在传送，请等候30秒',
                '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                    window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                }, '确定', null);
        } else {
            ToastPanel.Toast('交易失败:' + resp);
        }
    }

    move(x, y, succCallback: () => void) {
        try {
            var nebPay = new NebPay();
            var serialNumber;
            var callbackUrl = BlockchainMgr.BlockchainUrl;

            var to = ContractAddress;
            var value = 0;
            var callFunction = 'move';
            // let enc = BlockchainMgr.encrypto(score.toString(), EncKey, 25);
            console.log("调用钱包move", x, y);
            var callArgs = JSON.stringify([x, y]);
            serialNumber = nebPay.call(to, value, callFunction, callArgs, {
                qrcode: {
                    showQRCode: false
                },
                goods: {
                    name: "test",
                    desc: "test goods"
                },
                callback: callbackUrl,
                listener: this.moveCallback(succCallback)
            });
        } catch (error) {
            console.error(error);
        }
    }
    moveCallback(succCallback: () => void): (object) => void {
        return (resp) => {
            console.log("moveCallback: ", succCallback, resp);
            if (resp.toString().substr(0, 5) != 'Error') {
                DialogPanel.PopupWith2Buttons('反物质引擎开始预热，如果一切顺利，将在30秒内出发',
                    '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                        window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                    }, '确定', null);

                WorldUI.Instance.editSailDestinationMode = false;
                if (succCallback) succCallback();
            } else {
                ToastPanel.Toast('交易失败:' + resp);
            }
        };
    }


    expand(i, j, valueNas: number) {
        try {

            var nebPay = new NebPay();
            var serialNumber;
            var callbackUrl = BlockchainMgr.BlockchainUrl;
            var to = ContractAddress;
            var value = Math.ceil(valueNas * 1e6) / 1e6;
            var callFunction = 'expand';
            var callArgs = JSON.stringify([i, j]);
            console.log("调用钱包expand(" + i + ',' + j + ", valueNas", valueNas, 'value', value);
            serialNumber = nebPay.call(to, value, callFunction, callArgs, {
                qrcode: {
                    showQRCode: false
                },
                goods: {
                    name: "test",
                    desc: "test goods"
                },
                callback: callbackUrl,
                listener: this.expandCallback
            });
        } catch (error) {
            console.error(error);
        }
    }
    expandCallback(resp) {
        console.log("expandCallback: ", resp);
        if (resp.toString().substr(0, 5) != 'Error') {
            DialogPanel.PopupWith2Buttons('扩建计划已启动，请稍候',
                '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                    window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                }, '确定', null);
        } else {
            ToastPanel.Toast('交易失败:' + resp);
        }
    }



    attackIsland(islandId: number, tank, chopper, ship, succCallback: () => void) {
        try {
            var nebPay = new NebPay();
            var serialNumber;
            var callbackUrl = BlockchainMgr.BlockchainUrl;
            var to = ContractAddress;
            var value = 0
            var callFunction = 'attackIsland';
            console.log("调用钱包attack_island(", islandId, tank, chopper, ship);
            var callArgs = JSON.stringify([islandId, tank, chopper, ship]);
            serialNumber = nebPay.call(to, value, callFunction, callArgs, {
                qrcode: {
                    showQRCode: false
                },
                goods: {
                    name: "test",
                    desc: "test goods"
                },
                callback: callbackUrl,
                listener: this.attackIslandCallback(succCallback)
            });
        } catch (error) {
            console.error(error);
        }
    }
    attackIslandCallback(succCallback: () => void): (object) => void {
        return (resp) => {
            console.log("attackIslandCallback: ", succCallback, resp);
            if (resp.toString().substr(0, 5) != 'Error') {
                AttackIslandPanel.Instance.close();
                DialogPanel.PopupWith2Buttons('您的部队已出发',
                    '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                        window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                    }, '确定', null);

                WorldUI.Instance.editSailDestinationMode = false;
                if (succCallback) succCallback();
            } else {
                DialogPanel.PopupWith1Button('区块链交易失败', resp, '确定', null);
            }
        };
    }

    collectIslandMoney(islandId: number) {
        try {
            var nebPay = new NebPay();
            var serialNumber;
            var callbackUrl = BlockchainMgr.BlockchainUrl;
            var to = ContractAddress;
            var value = 0
            var callFunction = 'collectIslandMoney';
            console.log("调用钱包collectIslandMoney(", islandId, );
            var callArgs = JSON.stringify([islandId]);
            serialNumber = nebPay.call(to, value, callFunction, callArgs, {
                qrcode: {
                    showQRCode: false
                },
                goods: {
                    name: "test",
                    desc: "test goods"
                },
                callback: callbackUrl,
                listener: this.collectIslandMoneyCallback
            });
        } catch (error) {
            console.error(error);
        }
    }
    collectIslandMoneyCallback(resp) {
        console.log("collectIslandMoneyCallback: ", resp);
        if (resp.toString().substr(0, 5) != 'Error') {
            AttackIslandPanel.Instance.close();
            DialogPanel.PopupWith2Buttons('正在收取资源',
                '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                    window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                }, '确定', null);
        } else {
            DialogPanel.PopupWith1Button('区块链交易失败', resp, '确定', null);
        }
    }

    sponsor(islandId, sponsorName, link, valueNas: number) {
        try {
            var nebPay = new NebPay();
            var serialNumber;
            var callbackUrl = BlockchainMgr.BlockchainUrl;
            var to = ContractAddress;
            var value = Math.ceil(valueNas * 1e6) / 1e6;
            var callFunction = 'sponsor';
            console.log("调用钱包sponsor(", islandId, sponsorName, link, valueNas);
            var callArgs = JSON.stringify([islandId, sponsorName, link]);
            serialNumber = nebPay.call(to, value, callFunction, callArgs, {
                qrcode: {
                    showQRCode: false
                },
                goods: {
                    name: "test",
                    desc: "test goods"
                },
                callback: callbackUrl,
                listener: this.sponsorCallback
            });
        } catch (error) {
            console.error(error);
        }
    }
    sponsorCallback(resp) {
        console.log("sponsorCallback: ", resp);
        if (resp.toString().substr(0, 5) != 'Error') {
            DialogPanel.PopupWith2Buttons('感谢您的赞助',
                '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                    window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                }, '确定', null);
        } else {
            ToastPanel.Toast('交易失败:' + resp);
        }
    }

    static encrypto(str, xor, hex) {
        if (typeof str !== 'string' || typeof xor !== 'number' || typeof hex !== 'number') {
            return;
        }

        let resultList = [];
        hex = hex <= 25 ? hex : hex % 25;

        for (let i = 0; i < str.length; i++) {
            // 提取字符串每个字符的ascll码
            let charCode: any = str.charCodeAt(i);
            // 进行异或加密
            charCode = (charCode * 1) ^ xor;
            // 异或加密后的字符转成 hex 位数的字符串
            charCode = charCode.toString(hex);
            resultList.push(charCode);
        }

        let splitStr = String.fromCharCode(hex + 97);
        let resultStr = resultList.join(splitStr);
        return resultStr;
    }
}
