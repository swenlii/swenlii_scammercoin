//let nodeGeocoder = require('node-geocoder');
let storyModel = require('./models/StoryModel');

exports = module.exports = function(io){
    io.sockets.on('connection', function (socket) {

        console.log("here is basic API");
        var sessionid = socket.id;
        console.log(' %s sockets connected', io.engine.clientsCount);
        console.log("and here is socket.id", socket.id);

        socket.on('post-story', function (obj, callback) {
            console.log('post-story');
            storyModel.postStory(obj)
                .then(ok => {
                    callback(null, ok);
                })
                .catch(err => {
                    callback(err.message, null);
                })
        });

        socket.on('getLastThreeStories', function (callback) {
            console.log('getLastThreeStories');
            storyModel.getLastThreeStory()
                .then(stories => {
                    callback(null, stories);
                })
                .catch(err => {
                    callback(err.message, null);
                })
        });

        socket.on('getLastFourComments', function (callback) {
            console.log('getLastFourComments');
            storyModel.getLastFourComments()
                .then(comments => {
                    callback(null, comments);
                })
                .catch(err => {
                    callback(err.message, null);
                })
        });

        socket.on('getAllStory', function (callback) {
            console.log('getAllStory');
            storyModel.getAllStory()
                .then(stories => {
                    callback(null, stories);
                })
                .catch(err => {
                    callback(err.message, null);
                })
        });

        socket.on('findStoryByText', function (text, callback) {
            console.log('findStoryByText');
            storyModel.findStoryByString(text)
                .then(stories => {
                    callback(null, stories);
                })
                .catch(err => {
                    callback(err.message, null);
                })
        });

        socket.on('findStoryByMonth', function (obj, callback) {
            console.log('findStoryByMonth');
            storyModel.findStoryByMonth(obj.month, obj.year)
                .then(stories => {
                    callback(null, stories);
                })
                .catch(err => {
                    callback(err.message, null);
                })
        });

        socket.on('setComment', function (obj, callback) {
            console.log('setComment');
            storyModel.setComment(obj)
                .then(ok => {
                    callback(null, ok);
                })
                .catch(err => {
                    callback(err.message, null);
                })
        });

        socket.on('findStoryByProject', function (obj, callback) {
            console.log('findStoryByProject');
            storyModel.findStoryByProject(obj)
                .then(stories => {
                    callback(null, stories);
                })
                .catch(err => {
                    callback(err.message, null);
                })
        });

        socket.on('getStoryById', function (storyId, callback) {
            console.log('getStoryById');
            storyModel.getStoryById(storyId)
                .then(stories => {
                    callback(null, stories);
                })
                .catch(err => {
                    callback(err.message, null);
                })
        });

        socket.on('getCommentsByStoryId', function (storyId, callback) {
            console.log('getCommentsByStoryId');
            storyModel.getComments(storyId)
                .then(comments => {
                    callback(null, comments);
                })
                .catch(err => {
                    callback(err.message, null);
                })
        });

        socket.on('sendMessage', function (obj, callback) {
            console.log('sendMessage');
            storyModel.sendMessage(obj)
                .then(ok => {
                    callback(null, ok);
                })
                .catch(err => {
                    callback(err.message, null);
                })
        })
    });
};
