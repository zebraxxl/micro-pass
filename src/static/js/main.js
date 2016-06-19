PASSWORD_CHARS_LETTERS_LOWER = "abcdefghijklmnopqrstuvwxyz"
PASSWORD_CHARS_LETTERS_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
PASSWORD_CHARS_NUMBERS = "0123456789";
PASSWORD_CHARS_SPECIAL = "`~!@#$%^&*()_+|\\[]{};':\",./<>?";

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showPasswordClick() {
    var passwordId = parseInt($(this).parent().parent().data("passwordId"));
    showProcessSpinner();
    microPass.getPassword(passwordId, function(name, password) {
        hideProcessSpinner();

        if (name == null || password == null) {
            UIkit.modal.alert("Ошибка получения пароля");
        } else {
            showPasswordModal.hide(true);
            $("#showPasswordModalTitle").text(name);
            $("#showPasswordModalTitle").data("passwordId", passwordId);
            $("#passwordPlace").val(password);
            showPasswordModal.show();
        }
    });
}

function savePasswordNameClick() {
    var row = $(this).parent().parent();
    var passwordId = parseInt(row.data("passwordId"));
    var oldName = row.data("passwordName");
    var newName = row.find(".cellPasswordName > input").val();
    showProcessSpinner();
    microPass.setPassword(passwordId, newName, null, function(result) {
        if (!result) {
            hideProcessSpinner();
            UIkit.modal.alert("Ошибка сохраниения имени пароля");
        } else {
            delete window.mpPasswords[oldName];
            window.mpPasswords[newName] = passwordId;
            microPass.setPrivateData(window.mpPasswords, function(result) {
                hideProcessSpinner();
                if (!result) {
                    UIkit.modal.alert("Ошибка сохраниения имени пароля");
                } else {
                    render();
                }
            });
        }
    });
}

function deletePasswordClick() {
    var row = $(this).parent().parent();
    var passwordId = parseInt(row.data("passwordId"));
    var passwordName = row.data("passwordName");
    UIkit.modal.confirm("Вы действтельно хотите безвозвратно удалить пароль \"" + passwordName + "\"?", function() {
        showProcessSpinner();
        microPass.deletePassword(passwordId, function(result) {
            if (!result) {
                hideProcessSpinner();
                UIkit.modal.alert("Ошибка удаления пароля");
            } else {
                delete window.mpPasswords[passwordName];
                microPass.setPrivateData(window.mpPasswords, function(result) {
                    hideProcessSpinner();
                    if (!result) {
                        UIkit.modal.alert("Ошибка удаления пароля");
                    } else {
                        render();
                    }
                })
            }
        });
    });
}

function render() {
    var passwordsToRender = window.mpPasswords;

    var filter = $("#tbFilter").val();
    if (filter) {
        filter = filter.toLowerCase();
        var filteredPasswordToRender = {};
        for (var name in passwordsToRender) {
            if (name.toLowerCase().indexOf(filter) >= 0) {
                filteredPasswordToRender[name] = passwordsToRender[name];
            }
        }

        passwordsToRender = filteredPasswordToRender;
    }

    $("#passwordsTable tbody").html("");

    for (var name in passwordsToRender) {
        var passwordId = passwordsToRender[name];
        var row = $("<tr></tr>");
        row.addClass("uk-table-middle");
        row.addClass("row-password-" + passwordId);
        row.data("passwordId", passwordId);
        row.data("passwordName", name);

        row.append("<td>" + passwordId + "</td>");

        var nameCell = $("<td></td>");
        nameCell.addClass("cellPasswordName");

        var passwordNameInput = $("<input/>");
        passwordNameInput.prop("type", "text");
        passwordNameInput.addClass("uk-width-1-1");
        passwordNameInput.val(name);
        nameCell.append(passwordNameInput);

        row.append(nameCell);

        var passwordCell = $("<td></td>");
        passwordCell.addClass("cellPasswordValue");
        passwordCell.addClass("uk-text-center");

        var showPasswordButton = $("<button></button>");
        showPasswordButton.addClass("uk-button");
        showPasswordButton.addClass("uk-button-primary");
        showPasswordButton.addClass("uk-width-3-10");
        showPasswordButton.html("<i class='uk-icon-eye'></i> Показать");
        showPasswordButton.click(showPasswordClick);
        passwordCell.append(showPasswordButton);

        var savePasswordNameButton = $("<button></button>");
        savePasswordNameButton.addClass("uk-button");
        savePasswordNameButton.addClass("uk-width-3-10");
        savePasswordNameButton.addClass("uk-margin-left");
        savePasswordNameButton.html("<i class='uk-icon-floppy-o'></i> Сохранить название");
        savePasswordNameButton.click(savePasswordNameClick);
        passwordCell.append(savePasswordNameButton);

        var deletePasswordButton = $("<button></button>");
        deletePasswordButton.addClass("uk-button");
        deletePasswordButton.addClass("uk-button-danger");
        deletePasswordButton.addClass("uk-width-3-10");
        deletePasswordButton.addClass("uk-margin-left");
        deletePasswordButton.html("<i class='uk-icon-minus'></i> Удалить");
        deletePasswordButton.click(deletePasswordClick);
        passwordCell.append(deletePasswordButton);

        row.append(passwordCell);

        $("#passwordsTable tbody").append(row);
    }
}

$(function() {
    microPass.getPrivateData(function(data) {
        window.mpPasswords = data;
        render();
    });


    showPasswordModal = UIkit.modal("#showPasswordModal");
    showPasswordModal.options.center = true;
    $("#showPasswordModal").on({
        "hide.uk.modal": function() {
            $("#passwordPlace").val("");
        }
    });

    $("#cancelSavePasswordButton").click(function() {
        showPasswordModal.hide();
    });

    $("#savePasswordButton").click(function() {
        var newValue = $("#passwordPlace").val();
        var passwordId = parseInt($("#showPasswordModalTitle").data("passwordId"));
        showPasswordModal.hide();
        showProcessSpinner();

        microPass.setPassword(passwordId, null, newValue, function(result) {
            hideProcessSpinner();
            if (!result) {
                UIkit.modal.alert("Ошибка сохраниения пароля");
            }
        });
    });

    newPasswordModal = UIkit.modal("#newPasswordModal");
    newPasswordModal.options.center = true;
    $("#newPasswordModal").on({
        "hide.uk.modal": function() {
            $("#newPasswordName").val("");
            $("#newPasswordValue").val("");
        }
    });

    $("#addNewPasswordButton").click(function() {
        newPasswordModal.hide(true);
        newPasswordModal.show();
    });

    $("#saveNewPasswordButton").click(function() {
        var newPasswordName = $("#newPasswordName").val();
        var newPasswordValue = $("#newPasswordValue").val();

        if (!newPasswordName) {
            UIkit.modal.alert("Вы не ввели название нового пароля");
            return;
        }

        showProcessSpinner();
        microPass.createPassword(newPasswordName, newPasswordValue, function(passwordId) {
            if (passwordId == null) {
                hideProcessSpinner();
                UIkit.modal.alert("Ошибка создания нового пароля");
                return;
            } else {
                window.mpPasswords[newPasswordName] = passwordId;
                microPass.setPrivateData(window.mpPasswords, function(result) {
                    hideProcessSpinner();
                    if (!result) {
                        UIkit.modal.alert("Ошибка создания нового пароля");
                    } else {
                        newPasswordModal.hide();
                        render();
                    }
                });
            }
        });
    });

    $("#cancelNewPasswordButton").click(function() {
        newPasswordModal.hide();
    });

    $(".generatePassword").click(function() {
        var targetId = $(this).data("target");
        var target = $("#" + targetId);

        var charsCount = parseInt(target.parent().find(".generatePasswordCharsCount").val());
        var randomValues = bytesToU32ArrayBE(Uint8Array2Bytes(generateRandomBytes(charsCount * 4)));

        var passwordMask = [];
        for (var i = 0; i < charsCount; i++) {
            passwordMask[i] = PASSWORD_CHARS_LETTERS_LOWER;
        }

        var numbersCount = Math.round(Math.max(1, random(charsCount / 3, charsCount / 2)));
        var specialCount = Math.round(Math.max(1, charsCount / 8));
        var upperCount = Math.round((charsCount - numbersCount - specialCount) / 2);

        // TODO: Optimize this
        while (numbersCount > 0) {
            var randomIndex = random(0, charsCount);
            if (passwordMask[randomIndex] == PASSWORD_CHARS_LETTERS_LOWER) {
                passwordMask[randomIndex] = PASSWORD_CHARS_NUMBERS;
                numbersCount--;
            }
        }

        while (specialCount > 0) {
            var randomIndex = random(0, charsCount);
            if (passwordMask[randomIndex] == PASSWORD_CHARS_LETTERS_LOWER) {
                passwordMask[randomIndex] = PASSWORD_CHARS_SPECIAL;
                specialCount--;
            }
        }

        while (upperCount > 0) {
            var randomIndex = random(0, charsCount);
            if (passwordMask[randomIndex] == PASSWORD_CHARS_LETTERS_LOWER) {
                passwordMask[randomIndex] = PASSWORD_CHARS_LETTERS_UPPER;
                upperCount--;
            }
        }

        var newRandomPassword = "";
        for (var i = 0; i < charsCount; i++) {
            var randomVal = Math.abs(randomValues[i]);
            newRandomPassword += passwordMask[i].charAt(randomVal % passwordMask[i].length);
        }

        target.val(newRandomPassword);
    });

    $("#logoutButton").click(function() {
        microPass.logout();
    });

    $("#tbFilter").on('input', function() {
        render();
    });
});
