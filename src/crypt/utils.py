# -*- coding: utf-8 -*-
import struct

__author__ = "zebraxxl"


def repeat_byte(b, n):
    result = b""
    for _ in range(n):
        result += b
    return result


def rotr(x, n):
    return (x >> n) | (x << 32 - n)


def rol_int_bytes(x, n):
    high_mask = (0xffffffff << (32 - n * 8)) & 0xffffffff
    low_mask = ~high_mask

    return ((x & high_mask) >> (32 - n * 8)) | ((x & low_mask) << (n * 8))


def ror_int_bytes(x, n):
    high_mask = (0xffffffff << (n * 8)) & 0xffffffff
    low_mask = ~high_mask

    return ((x & high_mask) >> (n * 8)) | ((x & low_mask) << (32 - n * 8))

def get_byte_from_int(x, n):
    return (x & (0xff << (n * 8))) >> (n * 8)


def set_byte_in_int(x, n, v):
    return (x & ~(0xff << (n * 8))) | (v << (n * 8))


def add_padding_to_block(data, block_size):
    need_padding = block_size - (len(data) % block_size)
    return data + repeat_byte(struct.pack(">B", need_padding), need_padding)


def remove_padding_from_block(data):
    return data[0:len(data) - data[-1]]


def xor_bytes(a, b):
    return bytes([a[i] ^ b[i] for i in range(len(a))])
