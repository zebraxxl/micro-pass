# -*- coding: utf-8 -*-
from peewee import *

from src.models import BaseModel, BigSerialField
from src.models.user import User

__author__ = "zebraxxl"


class SafeSession(BaseModel):
    id = BigSerialField(primary_key=True, index=True)
    user = ForeignKeyField(rel_model=User, on_delete="CASCADE")
    salt = CharField()
    session_key = CharField()
    session_expire = DateTimeField()
    client_ip = CharField()

    class Meta:
        db_table = "mp_safe_sessions"
