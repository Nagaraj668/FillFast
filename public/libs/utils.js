function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
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
    }
});

function whatIsIt(object) {
    var stringConstructor = "test".constructor;
    var arrayConstructor = [].constructor;
    var objectConstructor = {}.constructor;

    if (object === null) {
        return "null";
    } else if (object === undefined) {
        return "undefined";
    } else if (object.constructor === stringConstructor) {
        return "String";
    } else if (object.constructor === arrayConstructor) {
        return "Array";
    } else if (object.constructor === objectConstructor) {
        return "Object";
    } else {
        return "don't know";
    }
}

function save(key, data) {
    var stringToSave = data;
    if (whatIsIt(stringToSave) == "Object") {
        stringToSave = JSON.stringify(stringToSave);
    }
    sessionStorage.setItem(key, stringToSave);
}


function get(key) {
    var data = sessionStorage.getItem(key);
    try {
        data = JSON.parse(data);
    } catch (e) {

    }
    return data;
}