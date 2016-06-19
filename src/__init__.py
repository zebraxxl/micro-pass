# -*- coding: utf-8 -*-
from flask import *
from flask.sessions import SecureCookieSessionInterface, TaggedJSONSerializer

from src.config import SERVER_SECRET_KEY
from src.crypt import aes_crypt, aes_decrypt

__author__ = "zebraxxl"


class SessionSerializer(object):
    def __init__(self):
        self.__real_serializer = TaggedJSONSerializer()

    def dumps(self, value):
        serialized_str = self.__real_serializer.dumps(value)
        return aes_crypt(serialized_str, SERVER_SECRET_KEY)

    def loads(self, value):
        value = aes_decrypt(value, SERVER_SECRET_KEY).decode("utf-8")
        return self.__real_serializer.loads(value)


class BasicSessionInterface(SecureCookieSessionInterface):
    salt = 'micro-pass-basic-salt'
    serializer = SessionSerializer()


app = Flask(__name__)
app.secret_key = SERVER_SECRET_KEY
app.session_interface = BasicSessionInterface()


from src.controllers import *
