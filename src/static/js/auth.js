$(function() {
    $("#authButton").click(function() {
        var login = $("#userLogin").val();
        var authPassword = $("#authPassword").val();
        var keyPassword = $("#keyPassword").val();

        microPass.auth(login, authPassword, keyPassword);
    });
});
