const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

/**
 * Auth Trigger for signUp
 */
exports.onSignUp = functions.auth.user().onCreate(event => {
    const user = event.data;
    user.createdOn = admin.database.ServerValue.TIMESTAMP;
    return admin.database().ref("users").child(user.uid).update(user);
});