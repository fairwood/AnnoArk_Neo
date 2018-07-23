import BlockchainMgr from "../BlockchainMgr";
import Island from "../World/Island";
import CurrencyFormatter from "../Utils/CurrencyFormatter";
import { DataMgr } from "../DataMgr";
import DialogPanel from "../DialogPanel";
import ToastPanel from "./ToastPanel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class TransferPanel extends cc.Component {
    static Instance: TransferPanel;
    onLoad() { TransferPanel.Instance = this; this.node.active = false; }

    @property(cc.EditBox)
    edtReceiver: cc.EditBox = null;
    @property(cc.EditBox)
    edtValue: cc.EditBox = null;

    cargoName = 'iron';

    onToggleClick(event, arg) {
        this.cargoName = arg;
    }

    onConfirmClick() {
        try {
            let args = [this.edtReceiver.string, this.cargoName, parseFloat(this.edtValue.string)];
            BlockchainMgr.Instance.callFunction('transfer', args, 0,
                (resp) => {
                    if (resp.toString().substr(0, 5) != 'Error') {
                        DialogPanel.PopupWith2Buttons('正在申请转移资源',
                            '区块链交易已发送，等待出块\nTxHash:' + resp.txhash, '查看交易', () => {
                                window.open('https://explorer.nebulas.io/#/tx/' + resp.txhash);
                            }, '确定', null);
                    } else {
                        ToastPanel.Toast('交易失败:' + resp);
                    }
                }
            );
        } catch (error) {
            console.error(error);
        }
    }

    close() {
        this.node.active = false;
    }
}