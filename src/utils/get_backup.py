#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys

import requests

sys.path.append("../../")
__author__ = "zebraxxl"


def main():
    url = sys.argv[1]
    login = sys.argv[2]
    password = sys.argv[3]
    output_file = sys.argv[4]

    auth_data = {
        "login": login,
        "password": password
    }

    auth_resp = requests.post(url + "/auth", json=auth_data)
    dump_resp = requests.get(url + "/backup", cookies=auth_resp.cookies)

    with open(output_file, "wb") as out_file:
        out_file.write(dump_resp.content)

    requests.get(url + "/logout", cookies=auth_resp.cookies)


if __name__ == "__main__":
    main()
