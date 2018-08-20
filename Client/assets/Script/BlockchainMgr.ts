import { DataMgr, UserData, IslandData } from "./DataMgr";
import WorldUI from "./WorldUI";
import ToastPanel from "./UI/ToastPanel";
import CityUI from "./CityUI";
import CvsMain from "./CvsMain";
import HomeUI from "./HomeUI";
import MainCtrl from "./MainCtrl";
import DialogPanel from "./UI/DialogPanel";
import FakeBC from "./Internal/FakeBC";

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

    static readonly UseFake = true;

    onLoad() {
        BlockchainMgr.Instance = this;
    }

    // static BlockchainUrl: string = 'https://mainnet.nebulas.io';
    // static BlockchainUrl: string = 'https://testnet.nebulas.io';
    static BlockchainUrl: string = 'http://localhost:8685';
    static getExplorerOfAccount(account: string) {
        return `https://explorer.neo.org/#/address/${account}`;
    }
    static getExplorerOfTx(txHash: string) {
        return `https://explorer.neo.org/#/tx/${txHash}`;
    }
    static WalletAddress: string;

    static CheckWalletInterval = 10;
    static FetchMyDataInterval = 2;
    static FetchAllDataInterval = 5;

    checkWalletCountdown = 1e9;
    fetchMyDataInterval = 1e9;
    fetchAllDataCountdown = 1e9;

    start() {
        this.checkWalletCountdown = 1;
        this.fetchMyDataInterval = 1;
        this.fetchAllDataCountdown = 2;

    }

    //不断刷新当前钱包地址
    update(dt: number) {

        this.checkWalletCountdown -= dt;
        this.fetchMyDataInterval -= dt;
        this.fetchAllDataCountdown -= dt;

        if (this.checkWalletCountdown <= 0) {
            if (BlockchainMgr.UseFake) {
                // BlockchainMgr.WalletAddress = 'APL5FCFSZrnG8L3cinkDRmXFDb27quJUWE';
                // HomeUI.Instance.edtBlockchainAddress.string = BlockchainMgr.WalletAddress ? BlockchainMgr.WalletAddress : '';


                if(BlackCat && BlackCat.SDK){

                    const callbck = ()=>{

                        let hui = HomeUI.Instance;

                        return (res)=>{
                            const address = res['wallet'];
                            if(address){
                                // TODO: 添加设置账号信息
                                console.log('update address ', address);
                                BlockchainMgr.WalletAddress = address;
                                hui.edtBlockchainAddress.string = address;
                            }

                        };
                    }
                    BlackCat.SDK.login(callbck());
                }

            } else {
                try {
                    try {
                        Neb; NebPay;
                    } catch (error) {
                        return;
                    }
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
            }
            this.checkWalletCountdown = BlockchainMgr.CheckWalletInterval;
        }
        if (this.fetchMyDataInterval <= 0 && BlockchainMgr.WalletAddress) {


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

            if (BlockchainMgr.UseFake) {
                self.onGetMyData(FakeBC.instance.callFunction(from, callFunction, contract.args, 0));
            } else {
                let neb = new Neb();
                neb.setRequest(new HttpRequest(BlockchainMgr.BlockchainUrl));
                neb.api.call(from, ContractAddress, value, nonce, gas_price, gas_limit, contract).then(
                    self.onGetMyData
                ).catch(function (err) {
                    console.log("call mydata error:" + err.message, from);
                })
            }
            this.fetchMyDataInterval = BlockchainMgr.FetchMyDataInterval;
        }
        if (this.fetchAllDataCountdown <= 0) {
            // const func = 'get_map_info';


            let from = BlockchainMgr.WalletAddress ? BlockchainMgr.WalletAddress : 'sdfsdfsfsdf';
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

            if (BlockchainMgr.UseFake) {
                self.onGetAllMapData(FakeBC.instance.callFunction(from, callFunction, contract.args, 0));
            } else {
                let neb = new Neb();
                neb.setRequest(new HttpRequest(BlockchainMgr.BlockchainUrl));
                neb.api.call(from, ContractAddress, value, nonce, gas_price, gas_limit, contract).then(
                    self.onGetAllMapData
                ).catch(function (err) {
                    console.log("call get_map_info error:" + err.message)
                })
            }

            this.fetchAllDataCountdown = BlockchainMgr.FetchAllDataInterval;
        }
    }

    getFunction(functionName: string, callArgs, callback) {
        try {
            let from = BlockchainMgr.WalletAddress ? BlockchainMgr.WalletAddress : 'sdfsfsdfs';
            var value = "0";
            var nonce = "0"
            var gas_price = "1000000"
            var gas_limit = "2000000"
            var callFunction = functionName;
            var contract = {
                "function": callFunction,
                "args": JSON.stringify(callArgs)
            }
            if (BlockchainMgr.UseFake) {
                callback(FakeBC.instance.callFunction(from, callFunction, contract.args, value));
            } else {
                let neb = new Neb();
                neb.setRequest(new HttpRequest(BlockchainMgr.BlockchainUrl));
    
                neb.api.call(from, ContractAddress, value, nonce, gas_price, gas_limit, contract).then(
                    callback
                ).catch(function (err) {
                    console.error(`Neb call ${functionName} error:` + err.message)
                })
            }
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
                    if (DataMgr.myUser && DataMgr.myUser.address != address &&
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
            DataMgr.myUser = user;
            user.ticks = MainCtrl.Ticks;
            DataMgr.allUsers[user.address] = DataMgr.myUser;
        }
    }

    onGetAllMapData(resp) {
        console.log('onGetAllMapData', resp);
        let allData = JSON.parse(resp.result).result_data;
        let allUserData = allData.users;
        let allIslandData = allData.islands;

        DataMgr.allUsers = {};
        allUserData.forEach(userJson => {
            if (userJson.address == BlockchainMgr.WalletAddress) {
                DataMgr.allUsers[userJson.address] = DataMgr.myUser;
            } else {
                DataMgr.allUsers[userJson.address] = userJson;
            }
        });
        allIslandData.forEach(islandJson => {
            DataMgr.allIslandData[islandJson.index] = islandJson;
        });
    }

    callFunction(callFunction, callArgs, value, callback) {
        try {
            value = value ? Math.ceil(value * 1e10) / 1e10 : 0;
            console.log("调用钱包(", callFunction, callArgs, value);
            var callbackUrl = BlockchainMgr.BlockchainUrl;
            var to = ContractAddress;

            if (BlockchainMgr.UseFake) {
                callback(FakeBC.instance.callFunction(BlockchainMgr.WalletAddress, callFunction, JSON.stringify(callArgs), value));
            } else {
                var nebPay = new NebPay();
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
            }
        } catch (error) {
            console.error(error);
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
