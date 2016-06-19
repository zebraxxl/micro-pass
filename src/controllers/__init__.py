# -*- coding: utf-8 -*-
import os

import subprocess

from src import app
from src.config import DB_CONNECTION_TYPE, DB_CONNECTION_HOST, DB_CONNECTION_PORT, DB_CONNECTION_USERNAME, \
    DB_CONNECTION_DB_NAME, DB_CONNECTION_PASSWORD

__author__ = "zebraxxl"


def get_safe_session():
    safe_session_id = session.get("safe_id", None)
    safe_session_salt = session.get("safe_salt", None)

    if not safe_session_id or not safe_session_salt:
        return None

    try:
        safe_session = SafeSession.select().where(
            (SafeSession.id == safe_session_id) &
            (SafeSession.salt == safe_session_salt) &
            (SafeSession.session_expire > datetime.utcnow()) &
            (SafeSession.client_ip == request.remote_addr)
        ).get()
    except SafeSession.DoesNotExist:
        return None

    return safe_session


@app.route("/")
def index():
    safe_session = get_safe_session()
    if safe_session is None:
        return redirect(url_for("auth"))
    return render_template("main.html")


@app.route("/routes.js")
def routes_js():
    response = make_response(render_template("routes.js"))
    response.headers["Content-Type"] = "application/x-javascript"
    return response


@app.route("/auth", methods=["GET"])
def auth():
    return render_template("auth.html")


@app.route("/cleanUp")
def clean_up():
    with DB_CONNECTION.atomic():
        SafeSession.delete().where(SafeSession.session_expire < datetime.utcnow()).execute()
    return b""


@app.route("/backup")
def backup():
    safe_session = get_safe_session()
    if not safe_session:
        abort(403)

    if DB_CONNECTION_TYPE == "postgresql":
        new_env = os.environ.copy()
        new_env["PGPASSWORD"] = DB_CONNECTION_PASSWORD
        process = subprocess.Popen(["pg_dump", "--format=c", "--compress=9", "--exclude-table=mp_safe_sessions",
                                    "--exclude-table=mp_migrations", "-a", "--inserts",
                                    "-h", DB_CONNECTION_HOST.replace("\"", "\\\""),
                                    "-p", DB_CONNECTION_PORT,
                                    "-U",  DB_CONNECTION_USERNAME.replace("\"", "\\\""),
                                    "-d", DB_CONNECTION_DB_NAME.replace("\"", "\\\"")],
                                   stdout=subprocess.PIPE, env=new_env)
        process.wait()
        if process.returncode != 0:
            return b"Error"
        else:
            return process.stdout.read()


from src.controllers.rest import *
