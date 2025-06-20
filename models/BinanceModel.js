let binance = require('node-binance-api')().options({
    APIKEY: 'UrEBjjK6C7KtH5uhaXgtXAT6CsXT7R950WMzZj1iNoWRAbtnaTRO163GwoLHBJXk',
    APISECRET: 'bj158add8zDQtZMj3mMrktMRO7dlvjxje5Qvucaz8yu3kOZDbu3S947Ptf2O1tUY',
    useServerTime: true // If you get timestamp errors, synchronize to server time at startup
});
let Big = require('big.js');
Big.RM = 0;

class BinanceModel {
    constructor() {
    }

    async getActualBtcPriceInUsdt() {

        return new Promise(function(resolve, reject) {

            binance.prices('BTCUSDT', (error, ticker) => {
                if (error) {
                    reject(error)
                } else {
                    if (ticker.BTCUSDT && (Big(ticker.BTCUSDT).cmp(Big(0)) === 1)) {
                        resolve(Big(ticker.BTCUSDT))
                    } else {
                        reject(new Error('no data received, e:'+JSON.stringify(error)))
                    }
                }
            });
        });
    }

    async getBtcAvailableBalance() {
        return new Promise(function(resolve, reject) {
            binance.balance((error, balances) => {
                if ( error ) {
                    reject(error)
                } else {
                    resolve(Big(balances.BTC.available))
                }
            });
        })
    }

    async getUsdtAvailableBalance() {
        return new Promise(function(resolve, reject) {
            binance.balance((error, balances) => {
                if ( error ) {
                    reject(error)
                } else {
                    console.log('balances.USDT.available', balances.USDT.available)
                    resolve(Big(balances.USDT.available))
                }
            });
        })
    }

    async sellAllBtc(forPrice) {
        try {
            var availableBtcBalance = await this.getBtcAvailableBalance()
        } catch (e) {
            throw e
        }

        return new Promise(function (resolve, reject) {

            if (availableBtcBalance.cmp(Big(0)) !== 1) {
                console.log('availableBtcBalance', availableBtcBalance.toFixed(6))
                return reject(new Error('no available btc balance'))
            }

            binance.sell("BTCUSDT", availableBtcBalance.toFixed(6), forPrice.toFixed(2), {type: 'LIMIT'}, (error, response) => {
                if (error) {
                    reject(error)
                } else { // response.orderId
                    resolve({forPrice, orderId: response.orderId, type: 'sell'})
                }
            })
        })
    }

    async buyForAllBtc(forPrice) {
        try {
            var availableUsdBalance = await this.getUsdtAvailableBalance()
        } catch (e) {
            throw e
        }

        return new Promise(function (resolve, reject) {

            if (availableUsdBalance.cmp(Big(0)) !== 1) {
                return reject(new Error('no available usd balance'))
            }

            console.log('availableUsdBalance.toFixed(2)', availableUsdBalance.toFixed(8))
            console.log('forPrice.toFixed(8)', forPrice.toFixed(8))
            let quantity = availableUsdBalance.div(forPrice);
            console.log('quantity.toFixed(8)', quantity.toFixed(8))

            binance.buy("BTCUSDT", quantity.toFixed(6), forPrice.toFixed(2), {type: 'LIMIT'}, (error, response) => {
                if (error) {
                    reject(error)
                } else {
                    resolve({forPrice, orderId: response.orderId, type: 'buy'})
                }
            })
        })
    }


}
module.exports = new BinanceModel();
