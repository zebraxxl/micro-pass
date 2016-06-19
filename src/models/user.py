# -*- coding: utf-8 -*-
from peewee import *

from src.models import BaseModel, BigSerialField

__author__ = "zebraxxl"


class User(BaseModel):
    id = BigSerialField(primary_key=True, index=True)
    login = CharField(index=True, unique=True)
    password = CharField()
    private_data = TextField()

    class Meta:
        db_table = "mp_users"
