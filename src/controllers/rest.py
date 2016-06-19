# -*- coding: utf-8 -*-
from datetime import datetime

from flask import *

from src import app
from src.controllers import get_safe_session
from src.config import SESSION_ALIVE_TIME
from src.crypt import parse_hashed_password, hash_password, generate_random_bytes_in_base64
from src.models import DB_CONNECTION
from src.models.password import Password
from src.models.safe_session import SafeSession
from src.models.user import User

__author__ = "zebraxxl"
__auth_error = {
    "status": "fail",
    "error": "AUTH_ERROR",
    "message": "Ошибка авторизации",
}


@app.route("/auth", methods=["POST"])
def auth_process():
    data = request.get_json()
    if not data:
        abort(415)

    login = data.get("login", None)
    password = data.get("password", None)

    if not login or not password:
        return jsonify({"status": "fail", "message": "Вы должны ввести логин и пароль"})

    try:
        user = User.get(User.login == login)
    except User.DoesNotExist:
        return jsonify({"status": "fail", "message": "Логин или пароль неправильные"})

    rounds, password_hash, salt = parse_hashed_password(user.password)

    if hash_password(password, rounds, salt) != user.password:
        return jsonify({"status": "fail", "message": "Логин или пароль неправильные"})

    safe_session = SafeSession.create(user=user, salt=generate_random_bytes_in_base64(32),
                                      session_key=generate_random_bytes_in_base64(32),
                                      session_expire=datetime.utcnow() + SESSION_ALIVE_TIME,
                                      client_ip=request.remote_addr)
    session["safe_id"] = safe_session.id
    session["safe_salt"] = safe_session.salt

    return jsonify({
        "status": "ok",
        "sessionKey": safe_session.session_key,
        "userPrivateData": user.private_data,
    })


@app.route("/logout")
def logout():
    safe_session = get_safe_session()
    if not safe_session:
        return jsonify(__auth_error)

    with DB_CONNECTION.atomic():
        safe_session.session_expire = datetime.utcnow() - SESSION_ALIVE_TIME
        safe_session.save()

    return jsonify({
        "status": "ok",
    })


@app.route("/session/key", methods=["GET"])
def get_session_key():
    safe_session = get_safe_session()
    if not safe_session:
        return jsonify(__auth_error)
    return jsonify({
        "status": "ok",
        "sessionKey": safe_session.session_key
    })


@app.route("/user/private_data", methods=["GET"])
def get_private_data():
    safe_session = get_safe_session()
    if not safe_session:
        return jsonify(__auth_error)

    user = User.get(User.id == safe_session.user_id)

    return jsonify({
        "status": "ok",
        "privateData": user.private_data
    })


@app.route("/user/private_data", methods=["POST", "PUT"])
def set_private_data():
    safe_session = get_safe_session()
    if not safe_session:
        return jsonify(__auth_error)

    data = request.data
    if not data:
        abort(415)

    with DB_CONNECTION.atomic():
        safe_session.user.private_data = request.data
        safe_session.user.save()

    return jsonify({
        "status": "ok"
    })


@app.route("/user/password/", methods=["PUT"])
def create_password():
    data = request.get_json()
    if not data or "passwordName" not in data or "passwordValue" not in data:
        abort(415)

    safe_session = get_safe_session()
    if not safe_session:
        return jsonify(__auth_error)

    password = Password.create(owner=safe_session.user, name=data["passwordName"], value=data["passwordValue"])

    return jsonify({
        "status": "ok",
        "passwordId": password.id
    })


@app.route("/user/password/<int:password_id>/", methods=["GET"])
def get_password(password_id):
    safe_session = get_safe_session()
    if not safe_session:
        return jsonify(__auth_error)

    try:
        password = Password.get(Password.id == password_id)
    except Password.DoesNotExist:
        abort(404)
        return

    if password.owner.id != safe_session.user.id:
        abort(403)

    return jsonify({
        "status": "ok",
        "passwordName": password.name,
        "passwordValue": password.value,
    })


@app.route("/user/password/<int:password_id>/", methods=["POST"])
def set_password(password_id):
    data = request.get_json()
    if not data:
        abort(415)

    safe_session = get_safe_session()
    if not safe_session:
        return jsonify(__auth_error)

    try:
        password = Password.get(Password.id == password_id)
    except Password.DoesNotExist:
        abort(404)
        return

    if password.owner.id != safe_session.user.id:
        abort(403)

    with DB_CONNECTION.atomic():
        if "passwordName" in data and data["passwordName"]:
            password.name = data["passwordName"]
        if "passwordValue" in data and data["passwordValue"]:
            password.value = data["passwordValue"]
        password.save()

    return jsonify({
        "status": "ok"
    })


@app.route("/user/password/<int:password_id>/", methods=["DELETE"])
def delete_password(password_id):
    safe_session = get_safe_session()
    if not safe_session:
        return jsonify(__auth_error)

    try:
        password = Password.get(Password.id == password_id)
    except Password.DoesNotExist:
        abort(404)
        return

    if password.owner.id != safe_session.user.id:
        abort(403)

    with DB_CONNECTION.atomic():
        password.delete_instance()

    return jsonify({
        "status": "ok"
    })
