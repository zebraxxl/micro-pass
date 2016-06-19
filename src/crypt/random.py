# -*- coding: utf-8 -*-

__author__ = "zebraxxl"


def generate_random_bytes(bytes_count):
    with open("/dev/urandom", "rb") as input_random:
        return input_random.read(bytes_count)
