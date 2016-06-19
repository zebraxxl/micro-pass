# -*- coding: utf-8 -*-
import os

from peewee import *
from playhouse.pool import PooledPostgresqlDatabase

from src.config import DB_CONNECTION_DB_NAME, DB_CONNECTION_HOST, DB_CONNECTION_USERNAME, DB_CONNECTION_PORT, \
    DB_CONNECTION_PASSWORD

__author__ = "zebraxxl"

DB_CONNECTION = PooledPostgresqlDatabase(database=DB_CONNECTION_DB_NAME, host=DB_CONNECTION_HOST,
                                         port=int(DB_CONNECTION_PORT), user=DB_CONNECTION_USERNAME,
                                         password=DB_CONNECTION_PASSWORD)


class BigSerialField(Field):
    db_field = "bigserial"

DB_CONNECTION.register_fields({
    "bigserial": "bigserial"
})


class BaseModel(Model):
    class Meta:
        database = DB_CONNECTION
