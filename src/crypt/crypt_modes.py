# -*- coding: utf-8 -*-
from io import BytesIO

from src.crypt.random import generate_random_bytes
from src.crypt.utils import xor_bytes

__author__ = "zebraxxl"


def __ecb(data, block_size, key, encode_fn):
    result = BytesIO()
    for i in range(0, len(data), block_size):
        result.write(encode_fn(data[i:i + block_size], key))
    ret_value = result.getvalue()
    result.close()
    return ret_value


def __cbc_encode(data, block_size, key, encode_fn, iv):
    result_buffer = BytesIO()
    for i in range(0, len(data), block_size):
        block = xor_bytes(data[i:i + block_size], iv)
        block = encode_fn(block, key)
        result_buffer.write(block)
        iv = block
    result = result_buffer.getvalue()
    result_buffer.close()
    return result


def __cbc_decode(data, block_size, key, encode_fn, iv):
    result_buffer = BytesIO()
    for i in range(0, len(data), block_size):
        encrypted_block = data[i:i + block_size]
        block = encode_fn(encrypted_block, key)
        result_buffer.write(xor_bytes(block, iv))
        iv = encrypted_block
    result = result_buffer.getvalue()
    result_buffer.close()
    return result


def __pcbc_encode(data, block_size, key, encode_fn, iv):
    result_buffer = BytesIO()
    for i in range(0, len(data), block_size):
        undecrypted_block = xor_bytes(data[i:i + block_size], iv)
        block = encode_fn(undecrypted_block, key)
        result_buffer.write(block)
        iv = xor_bytes(block, undecrypted_block)
    result = result_buffer.getvalue()
    result_buffer.close()
    return result


def __pcbc_decode(data, block_size, key, encode_fn, iv):
    result_buffer = BytesIO()
    for i in range(0, len(data), block_size):
        encrypted_block = data[i:i + block_size]
        block = encode_fn(encrypted_block, key)
        result_buffer.write(xor_bytes(block, iv))
        iv = xor_bytes(encrypted_block, block)
    result = result_buffer.getvalue()
    result_buffer.close()
    return result


def encode(mode, data, block_size, key, encode_fn, iv):
    if mode == "ECB":
        return __ecb(data, block_size, key, encode_fn)
    elif mode == "CBC":
        iv = iv or generate_random_bytes(block_size)
        return iv + __cbc_encode(data, block_size, key, encode_fn, iv)
    elif mode == "PCBC":
        iv = iv or generate_random_bytes(block_size)
        return iv + __pcbc_encode(data, block_size, key, encode_fn, iv)


def decode(mode, data, block_size, key, encode_fn, iv):
    if mode == "ECB":
        return __ecb(data, block_size, key, encode_fn)
    elif mode == "CBC":
        iv = data[:block_size]
        data = data[block_size:]
        return __cbc_decode(data, block_size, key, encode_fn, iv)
    elif mode == "PCBC":
        iv = data[:block_size]
        data = data[block_size:]
        return __pcbc_decode(data, block_size, key, encode_fn, iv)
