# -*- coding: utf-8 -*-

__author__ = "zebraxxl"


def mul_to_x(a):
    b = a & 0x80
    a = (a << 1) & 0xff
    return a ^ 0x1b if b else a


def mul(a, b):
    result = 0
    i = 1
    while i < 0x100:
        if b & i:
            result ^= a
        a = mul_to_x(a)
        i <<= 1
    return result

# Precompute multiples to optimize
mul_by_2 = [mul(x, 2) for x in range(256)]
mul_by_3 = [mul(x, 3) for x in range(256)]
mul_by_9 = [mul(x, 9) for x in range(256)]
mul_by_d = [mul(x, 0xd) for x in range(256)]
mul_by_b = [mul(x, 0xb) for x in range(256)]
mul_by_e = [mul(x, 0xe) for x in range(256)]
