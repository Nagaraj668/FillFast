var authUser;
var LOGOUT = 1;
var action;
var selectedPlayer = undefined;
var isPublicGame = true;
var gameItemHTML;
var recentlySelectedGameId;

var storageRef = firebase.storage().ref();
var usersRef = firebase.database().ref('users');
var gamesRef = firebase.database().ref('games');

$(document).ready(function() {
    $(".button-collapse").sideNav();
    $('.modal').modal();

    $.get('game-item.html', function(data) {
        gameItemHTML = data;
    });

    var slider = document.getElementById('players-slider');
    noUiSlider.create(slider, {
        start: [2, 10],
        connect: true,
        step: 1,
        orientation: 'horizontal', // 'horizontal' or 'vertical'
        range: {
            'min': 2,
            'max': 10
        }
    });

    slider.noUiSlider.on('update', function(values, handle) {
        if (handle == 0) {
            $('#min').text(parseInt(values[handle]));
        } else {
            $('#max').text(parseInt(values[handle]));
        }
    });

    $('#start_game_modal').modal({
        ready: function() {
            $('#upload_status').hide();
            $('#game_name').val(null);
            $('#file').val(null);
            $('#chkbox_wrapper').empty();
            $('#chkbox_wrapper').html('<input type="checkbox" id="public_game" class="filled-in" checked="checked" /><label for="public_game">Public Game (online player can this join)</label>');
            isPublicGame = true;
        }
    });

    $('ul.tabs').tabs({
        onShow: function(tab) {

        }
    });
});

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

usersRef.orderByChild('online');
usersRef.on('child_added', function(data) {
    addUserElement(data.key, data.val());
});

gamesRef.on('child_added', function(data) {
    addGameElement(data.key, data.val());
});

gamesRef.on('child_changed', function(data) {
    updateGameElement(data.key, data.val());
});


gamesRef.on('child_removed', function(data) {
    removeGameElement(data.key, data.val());
});


function addUserElement(key, data) {
    var element = '<li class="collection-item valign-wrapper" onclick="onPlayerClicked(\'' + key + '\')">' +
        '<img src= "' + data.photoURL + '" alt= "" class="circle" width="30" height="30" />' +
        '<span class="title" style="margin-left:10px">' + data.displayName + '</span>' +
        '</li>';
    $('#collection').prepend(element);
    if (selectedPlayer == undefined) {
        onPlayerClicked(key);
    }
}

function addGameElement(key, data) {
    var element = gameItemHTML;
    if (data.gameIcon)
        element = replaceAll(element, 'IMAGE_URL', data.gameIcon);
    else
        element = replaceAll(element, 'IMAGE_URL', '../../images/logo.png');
    element = replaceAll(element, 'GAME_NAME', data.gameName);
    element = replaceAll(element, 'GAME_STATUS', data.status.message);
    element = replaceAll(element, 'GAME_ID', data.gameId);
    $('#games_wrapper').prepend(element);
}

function updateGameElement(key, data) {
    var element = gameItemHTML;
    if (data.gameIcon)
        element = replaceAll(element, 'IMAGE_URL', data.gameIcon);
    else
        element = replaceAll(element, 'IMAGE_URL', '../../images/logo.png');
    element = replaceAll(element, 'GAME_NAME', data.gameName);
    element = replaceAll(element, 'GAME_STATUS', data.gameName);
    element = replaceAll(element, 'GAME_ID', data.gameId);
    $('#' + data.gameId).remove();
    $('#games_wrapper').prepend(element);
}

function removeGameElement(key, data) {
    $('#' + data.gameId).remove();
}

function joinGame(gameId) {
    var participant = {
        uid: authUser.uid,
        displayName: authUser.displayName,
        photoURL: authUser.photoURL,
    };
    recentlySelectedGameId = gameId;
    gamesRef.child(gameId).child('participants').child(authUser.uid).set(participant).then(function() {
        $('ul.tabs').tabs('select_tab', 'play');
    });
}


function onPlayerClicked(key) {
    usersRef.child(key).once('value', function(data) {
        selectedPlayer = data.val();
        $('#profile_image').attr('src', selectedPlayer.photoURL);
        $('#selected_player_name').text(selectedPlayer.displayName);
        $('#selected_player_email').text(selectedPlayer.email);
    });
}

function onPlayersCountChange() {
    $('#max-players-label').text($('#max-players').val());
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

function onPublicGameChkBoxClicked() {
    isPublicGame = !isPublicGame;
}

function validateGame() {
    return true;
}

function onStartGameClicked() {
    validateGame();
    var file = document.getElementById("file").files[0];
    var gameObj = {
        gameName: $('#game_name').val(),
        minPlayers: $('#min').text(),
        maxPlayers: $('#max').text(),
        isPublic: isPublicGame,
        status: {
            code: 1,
            message: 'Waiting for players'
        }
    };

    var gameId = gamesRef.push().key;
    gameObj.gameId = gameId;
    gamesRef.child(gameId).set(gameObj);

    var gameStorageRef = storageRef.child(gameId);

    var uploadTask = gameStorageRef.child('images/gameIcon.png').put(file);
    $('#upload_status').show();
    uploadTask.on('state_changed', function(snapshot) {
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        $('#upload_status').text('Upload is ' + progress + '% done');
        switch (snapshot.state) {
            case firebase.storage.TaskState.PAUSED: // or 'paused'
                console.log('Upload is paused');
                break;
            case firebase.storage.TaskState.RUNNING: // or 'running'
                console.log('Upload is running');
                break;
        }
    }, function(error) {
        console.log(error);
    }, function() {
        var downloadURL = uploadTask.snapshot.downloadURL;
        $('#upload_status').text('Upload success');
        gamesRef.child(gameId).child('gameIcon').set(downloadURL).then(function() {
            $('#start_game_modal').modal('close');
            $('ul.tabs').tabs('select_tab', 'play');
        });
    });


}