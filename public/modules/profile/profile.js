var authUser;
var LOGOUT = 1;
var action;

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        authUser = user;
        $('#name').text(user.displayName);
        $('#email').text(user.email);
        $('#photo').attr('src', user.photoURL);
    } else {
        window.location.href = "../../index.html";
    }
});

function signOut() {
    firebase.auth().signOut();
}

function logout() {
    action = LOGOUT;
    var modalObj = {
        message: 'Do you want to logout?',
        title: 'Confirm logout'
    };
    showConfirmModal(modalObj);
}

function showConfirmModal(modalObj) {
    $('#confirm_modal').modal({
        dismissible: true, // Modal can be dismissed by clicking outside of the modal
        opacity: .5, // Opacity of modal background
        inDuration: 300, // Transition in duration
        outDuration: 200, // Transition out duration
        startingTop: '4%', // Starting top style attribute
        endingTop: '10%', // Ending top style attribute
        ready: function(modal, trigger) { // Callback for Modal open. Modal and trigger parameters available.
            console.log(modal, trigger);
            $('#confirm_title').text(modalObj.title);
            $('#confirm_message').text(modalObj.message);
        },
        complete: function() {

        }
    });
    $('#confirm_modal').modal('open');
}

function onConfirmed() {
    switch (action) {
        case LOGOUT:
            {
                firebase.auth().signOut();
                break;
            }
    }
}

$(document).ready(function() {
    $(".button-collapse").sideNav();
})