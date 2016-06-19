mpCurrentProcesses = 0;

function showProcessSpinner() {
    mpCurrentProcesses++;
    $("#processSpinner").show();
}

function hideProcessSpinner() {
    if (--mpCurrentProcesses == 0) {
        $("#processSpinner").hide();
    }
}

function showError(message, errorsPlace, showTime) {
    errorsPlace = errorsPlace || "#errorsPlace";
    showTime = showTime || 3000;

    var newAlert = $("<div class='uk-alert uk-alert-danger'>" + message + "</div>");
    $(errorsPlace).append(newAlert);
    setTimeout(function() {
        newAlert.fadeOut();
    }, showTime);
}
