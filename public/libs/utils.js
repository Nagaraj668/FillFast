function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

var onlineRef = firebase.database().ref("users/" + firebase.auth().currentUser.uid + "/online");
var connectedRef = firebase.database().ref(".info/connected");

connectedRef.on("value", function(snap) {
    if (snap.val() == true) {
        onlineRef.set(true);
        onlineRef.onDisconnect().set(false);
    } else {
        onlineRef.set(false);
    }
});