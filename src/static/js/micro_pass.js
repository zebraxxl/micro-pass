microPass = {
    messages: {
        "EMPTY_CREDENTIALS": "Логин и пароли не могут быть пустыми",
        "INVALID_CREDENTIALS": "Не верные логин или пароль",
        "CORUPTED_DATA": "Данные повреждены",
        "UNEXPECTED_ERROR": "Непредвиденная ошибка при обработке запроса: ",
    },

    onError: function(message) {
        showError(message);
    },

    onAuthStart: function() {
        $("#authButton").hide();
        $("#authSpinner").show();
    },

    onAuthStop: function() {
        $("#authButton").show();
        $("#authSpinner").hide();
    },

    onWaitSessionKeyStart: function() {
        showProcessSpinner();
    },

    onWaitSessionKeyStop: function() {
        hideProcessSpinner();
    }
}

function stringToUtf8(s) {
    return unescape(encodeURIComponent(s));
}

function utf8ToString(s) {
    return decodeURIComponent(escape(s));
}

function utf8ToBytes(s) {
    var result = [];
    for (var i = 0; i < s.length; i++) {
        result.push(s.charCodeAt(i));
    }
    return result;
}

function bytesToUtf8(s) {
    var result = "";
    for (var i = 0; i < s.length; i++) {
        result += String.fromCharCode(s[i]);
    }
    return result;
}

function stringToBytes(s) {
    return utf8ToBytes(stringToUtf8(s));
}

function bytesToString(s) {
    return utf8ToString(bytesToUtf8(s));
}

microPass.auth = function(login, password, encodeKey) {
    if (!login || !password || !encodeKey) {
        this.onError(this.messages["EMPTY_CREDENTIALS"]);
        return false;
    }

    this.onAuthStart();

    $.ajax({
        url: URL_AUTH,
        method: "POST",
        cache: false,
        contentType: "application/json",
        data: JSON.stringify({
            login: login,
            password: password
        }),
        dataType: "json",
        error: function(xhr, status, errorMessage) {
            microPass.onError(microPass.messages["UNEXPECTED_ERROR"] + errorMessage);
            microPass.onAuthStop();
        },
        success: function(data) {
            if (data.status != "ok") {
                microPass.onError(microPass.messages["UNEXPECTED_ERROR"] + data.message);
                microPass.onAuthStop();
            } else {
                try {
                    var privateData = bytesToString(
                        aes.decode(utf8ToBytes(atob(data.userPrivateData)), 
                            stringToBytes(encodeKey))
                    );

                    JSON.parse(privateData);
                } catch(e) {
                    microPass.onError(microPass.messages["INVALID_CREDENTIALS"]);
                    microPass.onAuthStop();
                    $.ajax({
                        url: URL_LOGOUT,
                        method: "GET",
                        cache: false,
                    });
                    return false;
                }

                // TODO: sessionStorage support detection
                sessionStorage["keyPassword"] = btoa(bytesToUtf8(aes.encode(
                    stringToBytes(encodeKey), utf8ToBytes(atob(data.sessionKey))
                )));

                microPass.onAuthStop();
                window.location.href = URL_MAIN_PAGE;
            }
        }
    });
}

microPass.getPrivateData = function(cb) {
    microPass.__waitForSessionKey(function() {
        $.ajax({
            url: URL_GET_PRIVATE_DATA,
            method: "GET",
            cache: false,
            dataType: "json",
            error: function(xhr, status, errorMessage) {
                microPass.onError(microPass.messages["UNEXPECTED_ERROR"] + errorMessage);
                cb(null);
            },
            success: function(data) {
                if (data.status != "ok") {
                    microPass.__processError(data);
                    cb(null);
                } else {
                    cb(microPass.__decodeJsonData(data.privateData));
                }
            }
        })
    });
}

microPass.setPrivateData = function(newPrivateData, cb) {
    microPass.__waitForSessionKey(function() {
        var encodedData = microPass.__encodeJsonData(newPrivateData);

        $.ajax({
            url: URL_SET_PRIVATE_DATA,
            method: "POST",
            cache: false,
            contentType: "application/x-encoded",
            data: encodedData,
            dataType: "json",
            error: function(xhr, status, errorMessage) {
                microPass.onError(microPass.messages["UNEXPECTED_ERROR"] + errorMessage);
                cb(false);
            },
            success: function(data) {
                if (data.status != "ok") {
                    microPass.__processError(data);
                    cb(false);
                } else {
                    cb(true);
                }
            }
        });
    });
}

microPass.createPassword = function(passwordName, passwordValue, cb) {
    microPass.__waitForSessionKey(function() {
        var encodedData = microPass.__encodePassword(passwordValue);
        $.ajax({
            url: URL_CREATE_PASSWORD,
            method: "PUT",
            cache: false,
            contentType: "application/json",
            data: JSON.stringify({
                passwordName: passwordName,
                passwordValue: encodedData
            }),
            dataType: "json",
            error: function(xhr, status, errorMessage) {
                microPass.onError(microPass.messages["UNEXPECTED_ERROR"] + errorMessage);
                cb(null);
            },
            success: function(data) {
                if (data.status != "ok") {
                    microPass.__processError(data);
                    cb(null);
                } else {
                    cb(data.passwordId);
                }
            }
        });
    });
}

microPass.getPassword = function(passwordId, cb) {
    microPass.__waitForSessionKey(function() {
        $.ajax({
            url: microPass.__getPasswordUrl(passwordId),
            method: "GET",
            cache: false,
            dataType: "json",
            error: function(xhr, status, errorMessage) {
                microPass.onError(microPass.messages["UNEXPECTED_ERROR"] + errorMessage);
                cb(null, null);
            },
            success: function(data) {
                if (data.status != "ok") {
                    microPass.__processError(data);
                    cb(null, null);
                } else {
                    cb(data.passwordName, microPass.__decodePassword(data.passwordValue));
                }
            }
        });
    });
}

microPass.setPassword = function(passwordId, passwordName, passwordValue, cb) {
    microPass.__waitForSessionKey(function() {
        var encodedData = null;
        if (passwordValue) {
            encodedData = microPass.__encodePassword(passwordValue);
        }
        $.ajax({
            url: microPass.__setPasswordUrl(passwordId),
            method: "POST",
            cache: false,
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify({
                passwordName: passwordName,
                passwordValue: encodedData
            }),
            error: function(xhr, status, errorMessage) {
                microPass.onError(microPass.messages["UNEXPECTED_ERROR"] + errorMessage);
                cb(false);
            },
            success: function(data) {
                if (data.status != "ok") {
                    microPass.__processError(data);
                    cb(false);
                } else {
                    cb(true);
                }
            }
        });
    });
}

microPass.deletePassword = function(passwordId, cb) {
    microPass.__waitForSessionKey(function() {
        $.ajax({
            url: microPass.__deletePasswordUrl(passwordId),
            method: "DELETE",
            cache: false,
            dataType: "json",
            error: function(xhr, status, errorMessage) {
                microPass.onError(microPass.messages["UNEXPECTED_ERROR"] + errorMessage);
                cb(false);
            },
            success: function(data) {
                if (data.status != "ok") {
                    microPass.__processError(data);
                    cb(false);
                } else {
                    cb(true);
                }
            }
        });
    });
}

microPass.logout = function() {
    $.ajax({
        url: URL_LOGOUT,
        method: "GET",
        cache: false,
        dataType: "json",
        complete: function() {
            window.location.href = URL_AUTH;
        }
    })
}

microPass.__init = function() {
    microPass.__sessionKey = null;

    if (window.location.pathname != URL_AUTH) {
        if (!sessionStorage.getItem("keyPassword")) {
            window.location.href = URL_AUTH;
            return;
        }

        $.ajax({
            url: URL_GET_SESSION_KEY,
            method: "GET",
            cache: false,
            dataType: "json",
            error: function(xhr, status, errorMessage) {
                window.location.href = URL_AUTH;
            },
            success: function(data) {
                if (data.status != "ok") {
                    window.location.href = URL_AUTH;
                } else {
                    microPass.__sessionKey = data.sessionKey;
                }
            }
        })
    }
}

microPass.__waitForSessionKey = function(cb, notFirst) {
    if (!notFirst)
        microPass.onWaitSessionKeyStart();
    if (microPass.__sessionKey !== null) {
        microPass.onWaitSessionKeyStop();
        cb();
    } else {
        setTimeout(function() { microPass.__waitForSessionKey(cb, true); }, 500);
    }
}

microPass.__processError = function(data) {
    if (data.error == "AUTH_ERROR") {
        window.location.href = URL_AUTH;
    } else {
        var errorCode = data.error || "UNEXPECTED_ERROR";
        var message = microPass.messages[errorCode] || microPass.messages["UNEXPECTED_ERROR"];
        if (data.message) {
            message += data.message;
        }
        this.showError(message);
    }
}

microPass.__decodeData = function(data) {
    var key = aes.decode(
        utf8ToBytes(atob(sessionStorage["keyPassword"])),
        utf8ToBytes(atob(microPass.__sessionKey))
    );

    var decodedData = bytesToString(
        aes.decode(
            utf8ToBytes(atob(data)),
            key
        )
    );

    return decodedData;
}

microPass.__decodeJsonData = function(data) {
    var result = null;
    try {
        result = JSON.parse(microPass.__decodeData(data));
    } catch(e) {
        result = null;
        microPass.onError(microPass.messages["CORUPTED_DATA"]);
    }

    return result;
}

microPass.__decodePassword = function(data) {
    data = microPass.__decodeData(data);
    var saltLength = parseInt(data);
    return data.slice(saltLength + data.indexOf("$") + 1);
}

microPass.__encodeData = function(data) {
    var key = aes.decode(
        utf8ToBytes(atob(sessionStorage["keyPassword"])),
        utf8ToBytes(atob(microPass.__sessionKey))
    );

    var encodedData = btoa(bytesToUtf8(
        aes.encode(stringToBytes(data), key)
    ));

    return encodedData;
}

microPass.__encodeJsonData = function(data) {
    return microPass.__encodeData(JSON.stringify(data));
}

microPass.__encodePassword = function(p) {
    var salt = btoa(bytesToUtf8(Uint8Array2Bytes(generateRandomBytes(32))));
    return microPass.__encodeData(salt.length.toString() + "$" + salt + p);
}

microPass.__getPasswordUrl = function(id) {
    return URL_GET_PASSWORD.replace("$id$", id);
}

microPass.__setPasswordUrl = function(id) {
    return URL_SET_PASSWORD.replace("$id$", id);
}

microPass.__deletePasswordUrl = function(id) {
    return URL_DELETE_PASSWORD.replace("$id$", id);
}

microPass.__init();
