# -*- coding: utf-8 -*-
import base64

from src.crypt import sha256, aes, random

__author__ = "zebraxxl"


def sha256_hash(data):
    if isinstance(data, str):
        data = data.encode("utf-8")
    return sha256.sha256_hash(data)


def aes_crypt(data, key):
    if isinstance(key, str):
        key = key.encode("utf-8")
    if isinstance(data, str):
        data = data.encode("utf-8")
    return aes.encode(data, key)


def aes_decrypt(data, key):
    if isinstance(key, str):
        key = key.encode("utf-8")
    if isinstance(data, str):
        data = data.encode("utf-8")
    return aes.decode(data, key)


def generate_random_bytes(count=16):
    return random.generate_random_bytes(count)


def generate_random_bytes_in_base64(count=16):
    return base64.b64encode(generate_random_bytes(count)).decode("utf-8")


def hash_password(password, rounds=1024, salt=None):
    if salt is None:
        salt = generate_random_bytes(32)
    if isinstance(salt, str):
        salt = salt.encode("utf-8")
    if isinstance(password, str):
        password = password.encode("utf-8")

    password = salt + password
    for _ in range(rounds):
        password = sha256_hash(password)

    return "%d$%s$%s" % (rounds, base64.b64encode(password).decode("utf-8"), base64.b64encode(salt).decode("utf-8"))


def parse_hashed_password(password_hash):
    password_hash = password_hash.split("$")
    return int(password_hash[0]), password_hash[1], base64.b64decode(password_hash[2])
