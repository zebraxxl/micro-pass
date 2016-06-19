# -*- coding: utf-8 -*-
from peewee import *

from src.models import BaseModel, BigSerialField
from src.models.user import User

__author__ = "zebraxxl"


class Password(BaseModel):
    id = BigSerialField(primary_key=True, index=True)
    owner = ForeignKeyField(rel_model=User, on_delete="CASCADE", index=True)
    name = CharField()
    value = TextField()

    class Meta:
        db_table = "mp_passwords"
