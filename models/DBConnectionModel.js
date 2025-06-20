var mysql = require('mysql');
let mysql2 = require('mysql2');
var util = require('util')

class DBConnectionModel {
    constructor() {
        this.pool = null;
        this.poolOld = null;
        this.poolTesting = null;
    }

    returnPoolConnection() {
        var error = null;
        if (!this.pool) {
            var pool  = mysql.createPool({
                connectionLimit : 10,
                connectTimeout: 10000,
                acquireTimeout: 10000,
                host,
                user,   
                password,
                database : 'sc_coin_user'
            });
            pool.query = util.promisify(pool.query);
            this.pool = pool
            //console.log('returned NEW pool connection')
            return pool;
        } else {
            //console.log('returned INITALIZED pool connection')
            return this.pool;
        }
    }


    returnPoolConnectionTesting() {
        var error = null;
        if (!this.poolTesting) {
            var pool = mysql2.createPool({
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                host,
                user,
                password,
                database: 'first'
            });
            pool.query = util.promisify(pool.query);
            this.poolTesting = pool;
            console.log('returned NEW [poolTesting] pool connection')
            //console.log(pool)
            return pool;
        } else {
            console.log('returned INITALIZED [poolTesting] pool connection')
            return this.poolTesting;
        }
    }
}
module.exports = new DBConnectionModel();
