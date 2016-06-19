#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

import base64

sys.path.append("../../")
from src.crypt import hash_password, aes_crypt

__author__ = "zebraxxl"


if __name__ == "__main__":
    login = sys.argv[1]
    password = hash_password(sys.argv[2])
    private_data = base64.b64encode(aes_crypt("{}", sys.argv[3])).decode("utf-8")
    print("INSERT INTO mp_users (login, password, private_data) VALUES ('{}', '{}', '{}');".format(
        login, password, private_data
    ))
