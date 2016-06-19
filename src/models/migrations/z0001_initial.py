# -*- coding: utf-8 -*-
from peewee import *

from src.models import BaseModel, DB_CONNECTION, BigSerialField

__author__ = "zebraxxl"


def z0001__initial(migrator):
    class UserSnapshot(BaseModel):
        id = BigSerialField(primary_key=True, index=True)
        login = CharField(index=True, unique=True)
        password = CharField()
        private_data = TextField()

        class Meta:
            db_table = "mp_users"

    class SafeSessionSnapshot(BaseModel):
        id = BigSerialField(primary_key=True, index=True)
        user = ForeignKeyField(rel_model=UserSnapshot, on_delete="CASCADE")
        salt = CharField()
        session_key = CharField()
        session_expire = DateTimeField()
        client_ip = CharField()

        class Meta:
            db_table = "mp_safe_sessions"

    class PasswordSnapshot(BaseModel):
        id = BigSerialField(primary_key=True, index=True)
        owner = ForeignKeyField(rel_model=UserSnapshot, on_delete="CASCADE", index=True)
        name = CharField()
        value = TextField()

        class Meta:
            db_table = "mp_passwords"

    DB_CONNECTION.create_tables([UserSnapshot, SafeSessionSnapshot, PasswordSnapshot])
