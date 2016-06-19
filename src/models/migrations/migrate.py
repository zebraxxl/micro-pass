# -*- coding: utf-8 -*-
import sys
from datetime import datetime
from traceback import print_exc

from playhouse.migrate import *

from src.models import BaseModel, DB_CONNECTION
from src.models.migrations.z0001_initial import z0001__initial

__author__ = 'zebraxxl'


__migrations = [
    ("z0001__initial", z0001__initial),
]


class Migration(BaseModel):
    index = IntegerField()
    name = CharField(max_length=256)
    executed = DateTimeField()

    class Meta:
        db_table = "mp_migrations"


def migrate():
    start_migration = 0
    tables = DB_CONNECTION.get_tables()
    if "mp_migrations" in tables:
        start_migration = Migration.select(fn.Max(Migration.index)).scalar()
        if start_migration is None:
            start_migration = 0
        else:
            start_migration += 1
    else:
        with DB_CONNECTION.atomic():
            DB_CONNECTION.create_tables([Migration])

    migrator = PostgresqlMigrator(DB_CONNECTION)

    for i in range(start_migration, len(__migrations)):
        with DB_CONNECTION.atomic():
            try:
                __migrations[i][1](migrator)
            except:
                print_exc()
                sys.exit(255)
            print("Migration \"%s:%s\" executed" % (i, __migrations[i][0]))
            Migration.create(index=i, name=__migrations[i][0], executed=datetime.now())

if __name__ == "__main__":
    migrate()
