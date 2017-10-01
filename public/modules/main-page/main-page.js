
var authUser;

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        authUser = user;
        $('#name').text(user.displayName);
        $('#email').text(user.email);
        $('#photo').attr('src', user.photoURL);
    } else {
        window.location.href = "index.html";
    }
});

function signOut() {
    firebase.auth().signOut();
}

function send() {
    var messageObj = {};

    messageObj.message = $('#message').val();
    messageObj.sender = authUser.displayName;
    messageObj.photoURL = authUser.photoURL;

    var messageRef = firebase.database().ref('messages').push();
    messageRef.set(messageObj);
}

var messagesRef = firebase.database().ref('messages');


messagesRef.on('child_added', function (data) {
    addMessageElement(data.key, data.val());
});

function addMessageElement(key, data) {
    var element = '<li class="collection-item avatar">' +
        '<img src= "' + data.photoURL + '" alt= "" class="circle" >' +
        '<span class="title">' + data.sender + '</span>' +
        '<p>' + data.message
    '</p>' +
        '</li>';
    $('#collection').prepend(element);
}