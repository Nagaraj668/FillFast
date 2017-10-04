var authUser;
var LOGOUT = 1;
var action;
var selectedPlayer = undefined;
var isPublicGame = true;
var gameItemHTML;
var gridCellHTML;
var recentlySelectedGameId;
var CURRENT_GAME = 'CURRENT_GAME';

var storageRef = firebase.storage().ref();
var usersRef = firebase.database().ref('users');
var gamesRef = firebase.database().ref('games');
var participantsRef;
var gridItems = [];

$(document).ready(function() {
    $(".button-collapse").sideNav();
    $('.modal').modal();

    $.get('game-item.html', function(data) {
        gameItemHTML = data;
    });

    $.get('grid-cell.html', function(data) {
        gridCellHTML = data;
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

});


function enterPlayArea() {
    var currentGame = get(CURRENT_GAME);
    recentlySelectedGameId = currentGame.gameId;
    if (!recentlySelectedGameId) {
        return;
    }
    if (participantsRef) {
        participantsRef.off();
        participantsRef = null;
        $('#game_participants').empty();
    }

    gridItems = [];

    for (var i = 0; i < 36; i++) {
        gridItems.push({
            index: i
        });
    }

    buildGridUI();

    var currentGameRef = gamesRef.child(recentlySelectedGameId).on('value', function(data) {
        var game = data.val();
        var status = game.status;
        $('#game_name').text(game.gameName);
        $('#game_logo').attr('src', game.gameIcon);
        $('#game_status').text(status.message);
    });

    var currentGameStatusref = gamesRef.child(recentlySelectedGameId).child('status/code').on('value', function(data) {
        var gameStatus = data.val();
        switch (gameStatus) {
            case 2:
                {
                    gameStarted();
                    break;
                }
            case 3:
                {
                    gameEnded();
                    break;
                }
        }
    });


    participantsRef = gamesRef.child(recentlySelectedGameId).child('participants');
    participantsRef.on('child_added', function(data) {
        $('#sample_label').hide();
        addParticipantElement(data.key, data.val());
    });

    participantsRef.on('child_changed', function(data) {
        updateParticipantElement(data.key, data.val());
    });
}

function buildGridUI() {
    var element = gridCellHTML;
    $('#grid-wrapper').empty();

    for (var i = 0; i < gridItems.length; i++) {
        var gridCell = gridItems[i];
        element = replaceAll(element, 'CELL_ID', 'id' + i);
        element = replaceAll(element, 'CELL_INDEX', i + '');
        $('#grid-wrapper').append(element);
        element = gridCellHTML;
    }

}

function gameStarted() {
    $('#game_status').addClass('green-text');

    gamesRef.child(recentlySelectedGameId).child('entries').on('child_added', function(data) {
        var cell = data.val();
        $('#id' + cell.index).attr('src', cell.image);
        $('#id' + cell.index).attr('data-cellId', cell.cellId);
        if (cell.success) {
            $('#id' + cell.index).addClass('success');
        }
        $('#id' + cell.index).attr('data-isempty', false);
    });

    gamesRef.child(recentlySelectedGameId).child('entries').on('child_changed', function(data) {
        var cell = data.val();
        $('#id' + cell.index).attr('src', cell.image);
        if (cell.success) {
            $('#id' + cell.index).addClass('success');
        }
    });
}

function gameEnded() {
    $('#game_status').addClass('red-text');
}

function onCellClicked(cellId) {
    var isEmptyCell = $('#' + cellId).attr('data-isempty');

    if (isEmptyCell == "false") return;

    var indexVal = $('#' + cellId).attr('data-index');
    var cellData = {
        image: authUser.photoURL,
        index: indexVal,
        uid: authUser.uid
    };

    var cellRef = gamesRef.child(recentlySelectedGameId).child('entries').push();
    cellData.cellId = cellRef.key;

    cellRef.set(cellData);
}

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

function addParticipantElement(key, data) {
    var points = data.points;
    var pointsHtml = '';
    if (points) {
        pointsHtml = '<span class="badge green-text" style="margin-left: 100px; font-weight: bold">' + points + '</span>';
    }

    var element = '<li class="collection-item" id="' + key + '"><div class="row" style="margin-bottom: 0px"><div class="col s6 valign-wrapper">' +
        '<img src= "' + data.photoURL + '" alt= "" class="circle" width="30" height="30" />' +
        '<span class="title" style="margin-left:10px">' + data.displayName +
        '</span></div><div class="col s6 valign-wrapper" style="height: 30px;">' + pointsHtml + '</div></div>' +
        '</li>';
    $('#game_participants').prepend(element);
}

function updateParticipantElement(key, data) {
    $('#' + key).remove();
    var points = data.points;
    var pointsHtml = '';
    if (points) {
        pointsHtml = '<span class="badge green-text" style="margin-left: 100px; font-weight: bold">' + points + '</span>';
    }
    var element = '<li class="collection-item" id="' + key + '"><div class="row" style="margin-bottom: 0px"><div class="col s6 valign-wrapper">' +
        '<img src= "' + data.photoURL + '" alt= "" class="circle" width="30" height="30" />' +
        '<span class="title" style="margin-left:10px">' + data.displayName +
        '</span></div><div class="col s6 valign-wrapper" style="height: 30px;">' + pointsHtml + '</div></div>' +
        '</li>';
    $('#game_participants').prepend(element);
}

function addGameElement(key, game) {
    if (game.status.code != 1) {
        return;
    }
    var element = gameItemHTML;
    if (game.gameIcon)
        element = replaceAll(element, 'IMAGE_URL', game.gameIcon);
    else
        element = replaceAll(element, 'IMAGE_URL', '../../images/logo.png');
    element = replaceAll(element, 'GAME_NAME', game.gameName);
    element = replaceAll(element, 'GAME_STATUS', game.status.message);
    element = replaceAll(element, 'GAME_ID', game.gameId);
    $('#games_wrapper').prepend(element);
}

function updateGameElement(key, game) {
    if (game.status.code != 1) {
        $('#' + game.gameId).remove();
        return;
    }
    var element = gameItemHTML;
    if (game.gameIcon)
        element = replaceAll(element, 'IMAGE_URL', game.gameIcon);
    else
        element = replaceAll(element, 'IMAGE_URL', '../../images/logo.png');
    element = replaceAll(element, 'GAME_NAME', game.gameName);
    element = replaceAll(element, 'GAME_STATUS', game.status.message);
    element = replaceAll(element, 'GAME_ID', game.gameId);
    $('#' + game.gameId).remove();
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
    save(CURRENT_GAME, { gameId: recentlySelectedGameId });
    gamesRef.child(gameId).child('participants').child(authUser.uid).set(participant).then(function() {
        $('ul.tabs').tabs('select_tab', 'play');
        enterPlayArea();
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
        gameName: $('#game_name_1').val(),
        minPlayers: $('#min').text(),
        maxPlayers: $('#max').text(),
        isPublic: isPublicGame,
        createdBy: authUser.uid,
        boxesFilled: 0,
        status: {
            code: 1,
            message: 'Waiting for players...'
        }
    };

    var gameId = gamesRef.push().key;
    gameObj.gameId = gameId;
    gamesRef.child(gameId).set(gameObj).then(function() {
        joinGame(gameId);
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
    });



}