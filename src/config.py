# -*- coding: utf-8 -*-
import os

from datetime import timedelta

__author__ = "zebraxxl"

SERVER_SECRET_KEY = "0zJopH:/dKX>^|0JZ0JH!0Qvi~n*fjWe"
SESSION_ALIVE_TIME = timedelta(hours=24)

# TODO: mysql and sqlite support
DB_CONNECTION_TYPE = "postgresql"
DB_CONNECTION_HOST = "127.0.0.1"
DB_CONNECTION_PORT = "5432"
DB_CONNECTION_USERNAME = "postgres"
DB_CONNECTION_PASSWORD = "sql"
DB_CONNECTION_DB_NAME = "micro_pass"
