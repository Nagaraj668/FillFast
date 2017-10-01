var provider = new firebase.auth.GoogleAuthProvider();



function signInGoogle() {
    firebase.auth().signInWithRedirect(provider).then(function(result) {
        // This gives you a Google Access Token. You can use it to access the Google API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;

        console.log('authenticate-then');
        // ...
    }).catch(function(error) {
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // The email of the user's account used.
        var email = error.email;
        // The firebase.auth.AuthCredential type that was used.
        var credential = error.credential;

        alert(errorMessage);
        // ...
    });
}

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        console.log('authenticate-listener');
        window.location.href = "modules/main-page/main-page.html";
    } else {
        console.log('un-authenticate');
    }
});

function signOut() {
    firebase.auth().signOut();
}