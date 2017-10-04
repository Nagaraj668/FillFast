const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
const database = admin.database();

const WAITING_FOR_PLAYERS = 1;
const GAME_STARTED = 2;
const GAME_ENDED = 3;
/**
 * Auth Trigger for signUp
 */
exports.onSignUp = functions.auth.user().onCreate(event => {
    const user = event.data;
    user.createdOn = admin.database.ServerValue.TIMESTAMP;
    return admin.database().ref("users").child(user.uid).update(user);
});

exports.validatePlayerEntry = functions.database.ref('games/{gameId}/participants/{participantId}/uid').onWrite(event => {

    const gameId = event.params.gameId;
    const participantId = event.params.participantId;
    database.ref('games/' + gameId).once('value').then(function(snapshot) {
        var game = snapshot.val();
        var min = game.minPlayers;
        var max = game.maxPlayers;
        var playersJoined = game.playersJoined;

        if (playersJoined == undefined || playersJoined == null) {
            playersJoined = 0;
        }
        playersJoined = playersJoined + 1;
        return (database.ref('games/' + gameId + '/playersJoined').set(playersJoined).then(function() {
            var yetToJoin = min - playersJoined;
            if (yetToJoin == 0) {
                return database.ref('games/' + gameId + '/status/code').set(GAME_STARTED).then(function() {
                    return database.ref('games/' + gameId + '/status/message').set('Game Started');
                });
            } else {
                return database.ref('games/' + gameId + '/status/message').set(yetToJoin + ' more players to join...');
            }
        }));
    });

})

exports.onGameStatusChange = functions.database.ref('games/{gameId}/entries/{cellId}/uid').onWrite(event => {

    var uid = event.data.val();
    var gameId = event.params.gameId;
    if (event.data.previous.exists()) {
        console.log("UID " + uid + " already exists.");
        return;
    }
    return event.data.ref.parent.child('success').set(true).then(function() {
        return database.ref('games').child(gameId).child('participants').child(uid).child('points').once('value')
            .then(function(snapshot) {
                var points = snapshot.val();
                if (points == null || points == undefined) {
                    points = 0;
                }
                points = points + 1;
                return database.ref('games').child(gameId).child('participants')
                    .child(uid).child('points').set(points).then(function() {
                        return database.ref('games').child(gameId).child('boxesFilled').once('value')
                            .then(function(snapshot) {
                                var boxesFilled = snapshot.val();
                                boxesFilled++;
                                return database.ref('games').child(gameId).child('boxesFilled').set(boxesFilled)
                                    .then(function() {

                                        if (boxesFilled == 36) {
                                            var status = {
                                                code: GAME_ENDED,
                                                message: "Game Over!"
                                            };
                                            return database.ref('games').child(gameId).child('status')
                                                .set(status);
                                        } else {
                                            return;
                                        }
                                    });
                            });
                    });
            });
    });
})