const { ccclass, property } = cc._decorator;

@ccclass
export default class CurrencyFormatter{

    static formatBTC(btc: number) {
        if (Math.abs(btc)<0.0000001) return '0';
        let log10 = Math.max(0, Math.floor(Math.log(btc) / Math.LN10));
        return btc.toFixed(Math.max(0, 5 - log10));
    }
    static formatNAS(nas: number) {
        let log10 = Math.max(0, Math.floor(Math.log(nas) / Math.LN10));
        return nas.toFixed(Math.min(3, Math.max(0, 4 - log10)));
    }
    static formatCNY(cny: number) {
        if (Math.abs(cny)<0.005) return '0';
        let log10 = Math.max(0, Math.floor(Math.log(cny) / Math.LN10));
        return cny.toFixed(Math.min(2, Math.max(0, 4 - log10)));
    }
}
