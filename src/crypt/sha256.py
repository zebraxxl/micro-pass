# -*- coding: utf-8 -*-
import struct

from src.crypt.utils import repeat_byte, rotr

__author__ = "zebraxxl"

__h0 = 0x6A09E667
__h1 = 0xBB67AE85
__h2 = 0x3C6EF372
__h3 = 0xA54FF53A
__h4 = 0x510E527F
__h5 = 0x9B05688C
__h6 = 0x1F83D9AB
__h7 = 0x5BE0CD19

__k = [
    0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
    0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
    0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
    0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
    0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
    0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
    0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
    0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
]


def sha256_hash(data):
    message_length = len(data)
    zero_bits_padding_length = 512 - ((message_length * 8 + 1 + 64) % 512)

    end = struct.pack(">Q", message_length * 8)
    data = data + b"\x80" + repeat_byte(b"\x00", zero_bits_padding_length // 8) + end

    digest = [__h0, __h1, __h2, __h3, __h4, __h5, __h6, __h7]

    for i in range(len(data) // 64):
        w = list(struct.unpack(">16I", data[i * 64:i * 64 + 64]))

        for j in range(16, 64):
            s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >> 3)
            s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >> 10)
            w.append((w[j - 16] + s0 + w[j - 7] + s1) & 0xffffffff)

        a, b, c, d, e, f, g, h = tuple(digest)

        for j in range(64):
            E0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
            Ma = (a & b) ^ (a & c) ^ (b & c)
            t2 = E0 + Ma
            E1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
            Ch = (e & f) ^ ((~e) & g)
            t1 = h + E1 + Ch + __k[j] + w[j]

            h = g
            g = f
            f = e
            e = (d + t1) & 0xffffffff
            d = c
            c = b
            b = a
            a = (t1 + t2) & 0xffffffff

        digest[0] = (digest[0] + a) & 0xffffffff
        digest[1] = (digest[1] + b) & 0xffffffff
        digest[2] = (digest[2] + c) & 0xffffffff
        digest[3] = (digest[3] + d) & 0xffffffff
        digest[4] = (digest[4] + e) & 0xffffffff
        digest[5] = (digest[5] + f) & 0xffffffff
        digest[6] = (digest[6] + g) & 0xffffffff
        digest[7] = (digest[7] + h) & 0xffffffff

    return struct.pack(">8I", *digest)
