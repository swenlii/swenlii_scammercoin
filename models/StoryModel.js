var mysql = require('mysql');
var slugify  = require('slugify');
let pool = require('./DBConnectionModel').returnPoolConnection();
const TelegramBot = require ('node-telegram-bot-api');
var fs = require('fs');
var path = require('path');
var nodemailer = require('nodemailer');
const months = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
let CONSTANTS = require('./../CONSTANTS')

class StoryModel {
    constructor() {
    }

    async postStory (obj) {
        var string = JSON.stringify(obj);

        // do not miss more than 2 links
        var matches = string.match(/((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|club|cloud|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|me|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om|online)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|store|tech|website|fun|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi);
        var matches2 = string.match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)/igm);

        if (matches && matches2 && matches.length - matches2.length > 3) { //one link to the project + 2 links.
            throw new Error('More than two link');
        }
        //do not miss obscene words
        var matches = string.match(/(viagra|cialis)/gi);
        if (matches && matches.length > 0) {
            throw new Error ('Obscene words found')
        }

        if((/^.+@.+\..+$/gi).test(obj.userEmail) === false){
            throw new Error('Invalid email')
        }

        var slug = slugify(obj.storyName, {
            lower: true
        });

        if (slug.length > 70) {
            slug = slug.substring(0, 70);
        }

        try {
            var res = await pool.query("INSERT INTO sc_coin.stories (authorName, storyName, storyText, authorEmail, linkOnProject, createdDate, urlSlug) VALUES (?, ?, ?, ?, ?, NOW(), ?)",
                [obj.userName, obj.storyName, obj.storyText, obj.userEmail, obj.linkOnProject, slug])
        } catch (e) {
            throw e;
        }

        if (res.insertId > 0){
            var text = obj.storyText.length > 140 ? obj.storyText.substr(0, 140) : obj.storyText;
            console.log('"' + obj.storyName + '"\nBy ' + obj.userName + '\n' +  text + '...\nRead here:https://scammercoin.com/s/' + res.insertId + '/' + slug);
            //post in telegram
            const token;
            const bot = new TelegramBot(token, {polling: false});

            try {
                var result = await bot.sendMessage(-397126889, '"' + obj.storyName + '"\nBy ' + obj.userName + '\n' + text + '...\nRead here:https://scammercoin.com/s/' + res.insertId + '/' + slug)
            }
            catch (e) {
                throw e;
            }


            //update image for story
            if (obj.imageFile && obj.imageType) {
                const ext = obj.imageType.split('/')[1];
                const fileName = `${res.insertId}.${ext}`;
                try {
                    await fs.writeFileSync(path.join(__dirname, `../public/images/stories/${fileName}`), obj.imageFile,);
                    var result = await pool.query("UPDATE sc_coin.stories SET imagePath = ? WHERE id = ?", [fileName, res.insertId]);
                } catch (e) {
                    throw e
                }
            }


            return res.insertId;
        }
        else {
            throw new Error('Can\'t insert story');
        }
    }

    async getLastThreeStory () {
        try {
            var res = await pool.query("SELECT stories.*, MONTHNAME(createdDate) AS month, DATE_FORMAT(createdDate, '%e') AS dayNum FROM sc_coin.stories ORDER BY id DESC");
        } catch (e) {
            throw e;
        }

        if (res.length > 3) {
            return res.slice(0, 3);
        }
        else {
            return res;
        }
    }

    async getLastFourComments () {
        try {
            var res = await pool.query("SELECT comments.*, stories.urlSlug, DATE_FORMAT(datePost, '%e') AS numDate, MONTHNAME(datePost) AS month FROM sc_coin.comments LEFT JOIN stories ON comments.idStory = stories.id ORDER BY id DESC");
        } catch (e) {
            throw e;
        }

        if (res.length > 4) {
            return res.slice(0, 4);
        }
        else {
            return res;
        }
    }

    async getAllStory() {
        try {
            var res = await pool.query("SELECT stories.*, MONTHNAME(createdDate) AS month, MONTH(createdDate) AS monthNum, DATE_FORMAT(createdDate, '%e') AS dayNum, YEAR(createdDate) AS fullYear FROM sc_coin.stories ORDER BY id DESC");
        } catch (e) {
            throw e;
        }

        return res;
    }

    async getStoryById (id) {
        try {
            var res = await pool.query("SELECT stories.*, MONTHNAME(createdDate) AS month, MONTH(createdDate) AS monthNum, DATE_FORMAT(createdDate, '%e') AS dayNum, YEAR(createdDate) AS fullYear FROM sc_coin.stories WHERE id = ?", [id]);
        } catch (e) {
            throw e;
        }

        if (res.length > 0) {
            return res[0];
        }
        else {
            throw new Error('Story not found')
        }
    }

    async findStoryByString (str) {
        try {
            var res = await pool.query("SELECT stories.*, MONTHNAME(createdDate) AS month, MONTH(createdDate) AS monthNum, DATE_FORMAT(createdDate, '%e') AS dayNum, YEAR(createdDate) AS fullYear FROM sc_coin.stories WHERE storyName LIKE '%" + str + "%' OR storyText LIKE '%" + str + "%'");
        } catch (e) {
            throw e;
        }

        return res;
    }

    async findStoryByMonth (numMonth, year) {
        try {
            var res = await pool.query("SELECT stories.*, MONTHNAME(createdDate) AS month, MONTH(createdDate) AS monthNum, DATE_FORMAT(createdDate, '%e') AS dayNum, YEAR(createdDate) AS fullYear FROM sc_coin.stories WHERE MONTH(createdDate) = ? AND YEAR(createdDate) = ?", [numMonth + 1, year]);
        } catch (e) {
            throw e;
        }

        return res;
    }

    async getComments (storyId) {
        try {
            var res = await pool.query("SELECT comments.*, stories.urlSlug, DATE_FORMAT(datePost, '%e') AS dayNum, MONTHNAME(datePost) AS month FROM sc_coin.comments LEFT JOIN sc_coin.stories ON stories.id = comments.idStory WHERE idStory = ? GROUP BY comments.id", [storyId]);
        } catch (e) {
            throw e;
        }

        return res;
    }

    async setComment (obj) {
        var string = JSON.stringify(obj);

        // do not miss more than 2 links
        var matches = string.match(/((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|club|cloud|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|me|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om|online)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|store|tech|website|fun|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi);
        var matches2 = string.match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)/igm);
        if (matches && matches2 && matches.length - matches2.length > 1) { //One email address + 0 links
            throw new Error('More than one link');
        }
        //do not miss obscene words
        var matches = string.match(/(viagra|cialis)/gi);
        if (matches && matches.length > 0) {
            throw new Error ('Obscene words found')
        }

        if((/^.+@.+\..+$/gi).test(obj.userEmail) === false){
            throw new Error('Invalid email')
        }

        try {
            var res = await pool.query("INSERT INTO sc_coin.comments (idStory, userName, userEmail, commentText) VALUES (?, ?, ?, ?)",
                [obj.idStory, obj.userName, obj.userEmail, obj.commentText])
        } catch (e) {
            throw e;
        }

        if (res.insertId > 0){
            if (obj.avatarFile && obj.avatarType) {
                const ext = obj.avatarType.split('/')[1];
                const fileName = `${res.insertId}.${ext}`;
                try {
                    await fs.writeFileSync(path.join(__dirname, `../public/images/commentators/${fileName}`), obj.avatarFile,);
                    var result = await pool.query("UPDATE sc_coin.comments SET avatarPath = ? WHERE id = ?", [fileName, res.insertId]);
                } catch (e) {
                    throw e
                }
            }


            return res.insertId;
        }
        else {
            throw new Error('Can\'t insert comment');
        }
    }

    async findStoryByProject (link){
        try {
            var res = await pool.query("SELECT stories.*, MONTHNAME(createdDate) AS month, MONTH(createdDate) AS monthNum, DATE_FORMAT(createdDate, '%e') AS dayNum, YEAR(createdDate) AS fullYear FROM sc_coin.stories WHERE linkOnProject LIKE '%" + link + "%'");
        } catch (e) {
            throw e;
        }

        return res;
    }

    async sendMessage (obj){
        if (!obj.text || !obj.name || !obj.email || !obj.subject) {
            throw new Error('Not enough data');
        }
        var matches = obj.text.match(/((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|club|cloud|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|me|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om|online)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|store|tech|website|fun|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi);
        var matches2 = obj.text.match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)/igm);
        if (matches && matches2 && matches.length - matches2.length > 1) { // In text 0 links
            throw new Error('More than one link');
        }
        var matches = obj.name.match(/((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|club|cloud|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|me|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om|online)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|store|tech|website|fun|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/gi);
        var matches2 = obj.name.match(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)/igm);
        if (matches && matches2 && matches.length - matches2.length > 0) { // In name 0 links
            throw new Error('Your name is a link');
        }
        //do not miss obscene words
        var matches = obj.text.match(/(viagra|cialis)/gi);
        if (matches && matches.length > 0) {
            throw new Error ('Obscene words found')
        }

        if((/^.+@.+\..+$/gi).test(obj.email) === false){
            throw new Error('Invalid email')
        }

        return new Promise((resolve, reject) => {
            var transporter = nodemailer.createTransport({
                service: CONSTANTS.mailService,
                auth: {
                    user: CONSTANTS.emailLogin,
                    pass: CONSTANTS.emailPassword
                }
            });

            transporter.sendMail({
                from: CONSTANTS.emailLogin,
                to: 'hlavni@scammercoin.com',
                subject: 'ScammerCoin: ' + obj.subject,
                replyTo : obj.email,
                html: '<p><b>From: </b>' + obj.name + '</p><p><b>Text: </b>' + obj.text + '</p>'
            }, (error, infoSuccess) => {
                if (error) {
                    console.log("error in sending email: ", error);
                    return reject(error);
                } else {
                    console.log("success in sending email: ", infoSuccess);
                    return resolve(infoSuccess);
                }
            });
        })
    }
}

module.exports = new StoryModel();
