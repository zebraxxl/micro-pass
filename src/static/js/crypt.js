cryptoObj = window.crypto || window.msCrypto; // for IE 11

function generateRandomBytes(bytesCount) {
    var result = new Uint8Array(bytesCount);
    cryptoObj.getRandomValues(result);
    return result;
}


gf28 = {
};

gf28.mulToX = function (a) {
    var b = a & 0x80;
    a = (a << 1) & 0xff;
    return b == 0 ? a : a ^ 0x1b;
}

gf28.mul = function (a, b) {
    var result = 0;

    for (var i = 1; i < 0x100; i <<= 1) {
        if (b & i)
            result ^= a;
        a = this.mulToX(a);
    }

    return result;
}


function bytesXor(a, b) {
    var r = [];
    for (var i = 0; i < a.length; i++)
        r[i] = a[i] ^ b[i];
    return r;
}

function rotBytes(a) {
    return a.slice(1, a.length).concat(a[0]);
}

function rolBytes(a, n) {
    return a.slice(n, a.length).concat(a.slice(0, n))
}

function rorBytes(a, n) {
    return rolBytes(a, a.length - n)
}

function addPadding(data, blockSize) {
    var needPadding = blockSize - (data.length % blockSize);
    for (var i = 0; i < needPadding; i++) {
        data.push(needPadding);
    }
}

function removePadding(data) {
    return data.slice(0, data.length - data[data.length - 1]);
}

function Uint8Array2Bytes(d) {
    var result = [];
    for (var i = 0; i < d.length; i++) {
        result.push(d[i]);
    }
    return result;
}

function bytesToU32ArrayBE(b) {
    var result = [];
    for (var i = 0; i < b.length; i += 4) {
        result.push((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | (b[i + 3]));
    }
    return result;
}

function uint32ToBytes(value) {
    return [
        (value & 0xff000000) >>> 24,
        (value & 0x00ff0000) >>> 16,
        (value & 0x0000ff00) >>> 8,
        (value & 0x000000ff),
    ];
}

function rotr(x, n) {
    return ((x >>> n) | (x << 32 - n));
}

function bytesToString(b) {
    var result = "";
    for (var i = 0; i < b.length; i++) {
        result += b[i].toString(16);
    }
    return result;
}

cryptModes = {};

cryptModes.__ecb = function(data, blockSize, key, encodeFn) {
    var result = [];
    for (var i = 0; i < data.length; i += blockSize) {
        result = result.concat(encodeFn(data.slice(i, i + blockSize), key));
    }
    return result;
}

cryptModes.__cbc_encode = function(data, blockSize, key, encodeFn, iv) {
    var result = [];
    for (var i = 0; i < data.length; i += blockSize) {
        var block = bytesXor(data.slice(i, i + blockSize), iv);
        block = encodeFn(block, key);
        result = result.concat(block);
        iv = block;
    }
    return result;
}

cryptModes.__cbc_decode = function(data, blockSize, key, encodeFn, iv) {
    var result = [];
    for (var i = 0; i < data.length; i += blockSize) {
        var encyptedBlock = data.slice(i, i + blockSize);
        var block = encodeFn(encyptedBlock, key);
        result = result.concat(bytesXor(block, iv));
        iv = encyptedBlock;
    }
    return result;
}

cryptModes.__pcbc_encode = function(data, blockSize, key, encodeFn, iv) {
    var result = [];
    for (var i = 0; i < data.length; i += blockSize) {
        var undecryptedBlock = bytesXor(data.slice(i, i + blockSize), iv);
        var block = encodeFn(undecryptedBlock, key);
        result = result.concat(block);
        iv = bytesXor(block, undecryptedBlock);
    }
    return result;
}

cryptModes.__pcbc_decode = function(data, blockSize, key, encodeFn, iv) {
    var result = [];
    for (var i = 0; i < data.length; i += blockSize) {
        var encyptedBlock = data.slice(i, i + blockSize);
        var block = encodeFn(encyptedBlock, key);
        result = result.concat(bytesXor(block, iv));
        iv = bytesXor(encyptedBlock, block);
    }
    return result;
}

cryptModes.encode = function(mode, data, blockSize, key, encodeFn, iv) {
    if (mode == "ECB")
        return this.__ecb(data, blockSize, key, encodeFn);
    else if (mode == "CBC") {
        iv = iv || Uint8Array2Bytes(generateRandomBytes(blockSize));
        return iv.concat(this.__cbc_encode(data, blockSize, key, encodeFn, iv));
    } else if (mode == "PCBC") {
        iv = iv || Uint8Array2Bytes(generateRandomBytes(blockSize));
        return iv.concat(this.__pcbc_encode(data, blockSize, key, encodeFn, iv));
    }
}

cryptModes.decode = function(mode, data, blockSize, key, encodeFn, iv) {
    if (mode == "ECB")
        return this.__ecb(data, blockSize, key, encodeFn);
    else if (mode == "CBC") {
        iv = data.slice(0, blockSize);
        data = data.slice(blockSize);
        return this.__cbc_decode(data, blockSize, key, encodeFn, iv);
    } else if (mode == "PCBC") {
        iv = data.slice(0, blockSize);
        data = data.slice(blockSize);
        return this.__pcbc_decode(data, blockSize, key, encodeFn, iv);
    }
}


sha256 = {
    __h0: 0x6A09E667,
    __h1: 0xBB67AE85,
    __h2: 0x3C6EF372,
    __h3: 0xA54FF53A,
    __h4: 0x510E527F,
    __h5: 0x9B05688C,
    __h6: 0x1F83D9AB,
    __h7: 0x5BE0CD19,

    __k: [
        0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
        0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
        0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
        0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
        0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
        0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
        0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
        0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
    ],
};

sha256.__newDigest = function() {
    return {
        h0: this.__h0,
        h1: this.__h1,
        h2: this.__h2,
        h3: this.__h3,
        h4: this.__h4,
        h5: this.__h5,
        h6: this.__h6,
        h7: this.__h7,
    };
}


sha256.hash = function(data) {
    data = data.slice(0);

    var messageLength = data.length;
    var zeroBitsPaddingLength = 512 - ((data.length * 8 + 1 + 64) % 512);
    data[data.length] = 0x80;

    for (var i = 0; i < zeroBitsPaddingLength / 8 - 1; i++) {
        data[data.length] = 0;
    }

    var messageLengthHight = ((messageLength - 1) * 8) / Math.pow(2, 32);
    messageLengthHight = Math.floor(messageLengthHight);

    data[data.length] = (messageLengthHight & 0xff000000) >> 24;;
    data[data.length] = (messageLengthHight & 0x00ff0000) >> 16;
    data[data.length] = (messageLengthHight & 0x0000ff00) >> 8;
    data[data.length] = (messageLengthHight & 0x000000ff);
    data[data.length] = ((messageLength * 8) & 0xff000000) >> 24;
    data[data.length] = ((messageLength * 8) & 0x00ff0000) >> 16;
    data[data.length] = ((messageLength * 8) & 0x0000ff00) >> 8;
    data[data.length] = ((messageLength * 8) & 0x000000ff);

    var digest = sha256.__newDigest();  

    for (var i = 0; i < data.length / 64; i++) {
        var w = bytesToU32ArrayBE(data.slice(i * 64, i * 64 + 64));

        for (var j = 16; j < 64; j++) {
            var s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3);
            var s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10);
            w[j] = (w[j - 16] + s0 + w[j - 7] + s1) & 0xffffffff;
        }

        var a = digest.h0;
        var b = digest.h1;
        var c = digest.h2;
        var d = digest.h3;
        var e = digest.h4;
        var f = digest.h5;
        var g = digest.h6;
        var h = digest.h7;

        for (var j = 0; j < 64; j++) {
            var E0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
            var Ma = (a & b) ^ (a & c) ^ (b & c);
            var t2 = E0 + Ma;
            var E1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
            var Ch = (e & f) ^ ((~e) & g);
            var t1 = h + E1 + Ch + sha256.__k[j] + w[j];

            h = g;
            g = f;
            f = e;
            e = (d + t1) & 0xffffffff;
            d = c;
            c = b;
            b = a;
            a = (t1 + t2) & 0xffffffff;
        }

        digest.h0 = (digest.h0 + a) & 0xffffffff;
        digest.h1 = (digest.h1 + b) & 0xffffffff;
        digest.h2 = (digest.h2 + c) & 0xffffffff;
        digest.h3 = (digest.h3 + d) & 0xffffffff;
        digest.h4 = (digest.h4 + e) & 0xffffffff;
        digest.h5 = (digest.h5 + f) & 0xffffffff;
        digest.h6 = (digest.h6 + g) & 0xffffffff;
        digest.h7 = (digest.h7 + h) & 0xffffffff;
    }

    digest.h0 = uint32ToBytes(digest.h0);
    digest.h1 = uint32ToBytes(digest.h1);
    digest.h2 = uint32ToBytes(digest.h2);
    digest.h3 = uint32ToBytes(digest.h3);
    digest.h4 = uint32ToBytes(digest.h4);
    digest.h5 = uint32ToBytes(digest.h5);
    digest.h6 = uint32ToBytes(digest.h6);
    digest.h7 = uint32ToBytes(digest.h7);

    return digest.h0.concat(digest.h1, digest.h2, digest.h3, digest.h4, digest.h5, digest.h6, digest.h7);
}

aes = {
    __sBox: [
        0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76, 
        0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 
        0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 
        0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 
        0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84, 
        0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf, 
        0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 
        0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 
        0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73, 
        0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb, 
        0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 
        0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 
        0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a, 
        0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 
        0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf, 
        0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
    ],

    __invSBox: [
        0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb,
        0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb,
        0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e,
        0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25,
        0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92,
        0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84,
        0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06,
        0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b,
        0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73,
        0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e,
        0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b,
        0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4,
        0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f,
        0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef,
        0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61,
        0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d
    ],

    __rCon: [
        [0x00, 0x00, 0x00, 0x00],
        [0x01, 0x00, 0x00, 0x00],
        [0x02, 0x00, 0x00, 0x00],
        [0x04, 0x00, 0x00, 0x00],
        [0x08, 0x00, 0x00, 0x00],
        [0x10, 0x00, 0x00, 0x00],
        [0x20, 0x00, 0x00, 0x00],
        [0x40, 0x00, 0x00, 0x00],
        [0x80, 0x00, 0x00, 0x00],
        [0x1b, 0x00, 0x00, 0x00],
        [0x36, 0x00, 0x00, 0x00],
    ],
}

aes.__block2state = function(block) {
    result = []; 
    for (var r = 0; r < 4; r++) {
        var row = [];
        for (var c = 0; c < 4; c++) {
            row.push(block[c * 4 + r]);
        }
        result.push(row);
    }

    return result;
}

aes.__state2block = function(state) {
    result = [];
    for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
            result[c * 4 + r] = state[r][c]
        }
    }
    return result;
}

aes.__subBytes = function (state) {
    for (var i = 0; i < state.length; i++) {
        for (var j = 0; j < state[i].length; j++)
            state[i][j] = this.__sBox[state[i][j]];
    }
}

aes.__invSubBytes = function (state) {
    for (var i = 0; i < state.length; i++) {
        for (var j = 0; j < state[i].length; j++)
            state[i][j] = this.__invSBox[state[i][j]];
    }
}

aes.__shiftRows = function (state) {
    for (var r = 1; r < 4; r++) {
        state[r] = rolBytes(state[r], r);
    }
}

aes.__invShiftRows = function (state) {
    for (var r = 1; r < 4; r++) {
        state[r] = rorBytes(state[r], r);
    }
}

aes.__mixColumns = function (state) {
    for (var c = 0; c < 4; c++) {
        var col = [state[0][c], state[1][c], state[2][c], state[3][c]];

        state[0][c] = gf28.mul(col[0], 2) ^ gf28.mul(col[3], 1) ^ gf28.mul(col[2], 1) ^ gf28.mul(col[1], 3);
        state[1][c] = gf28.mul(col[1], 2) ^ gf28.mul(col[0], 1) ^ gf28.mul(col[3], 1) ^ gf28.mul(col[2], 3);
        state[2][c] = gf28.mul(col[2], 2) ^ gf28.mul(col[1], 1) ^ gf28.mul(col[0], 1) ^ gf28.mul(col[3], 3);
        state[3][c] = gf28.mul(col[3], 2) ^ gf28.mul(col[2], 1) ^ gf28.mul(col[1], 1) ^ gf28.mul(col[0], 3);
    }
}

aes.__invMixColumns = function (state) {
    for (var c = 0; c < 4; c++) {
        var col = [state[0][c], state[1][c], state[2][c], state[3][c]];
        state[0][c] = gf28.mul(col[0], 0x0e) ^ gf28.mul(col[3], 0x09) ^ gf28.mul(col[2], 0x0d) ^ gf28.mul(col[1], 0x0b);
        state[1][c] = gf28.mul(col[1], 0x0e) ^ gf28.mul(col[0], 0x09) ^ gf28.mul(col[3], 0x0d) ^ gf28.mul(col[2], 0x0b);
        state[2][c] = gf28.mul(col[2], 0x0e) ^ gf28.mul(col[1], 0x09) ^ gf28.mul(col[0], 0x0d) ^ gf28.mul(col[3], 0x0b);
        state[3][c] = gf28.mul(col[3], 0x0e) ^ gf28.mul(col[2], 0x09) ^ gf28.mul(col[1], 0x0d) ^ gf28.mul(col[0], 0x0b);
    }
}

aes.__addRoundKey = function (state, keyShedule) {
    for (var r = 0; r < state.length; r++) {
        for (var c = 0; c < state[r].length; c++) {
            state[r][c] ^= keyShedule[c][r];
        }
    }
}

aes.__subWord = function(a) {
    return [
        this.__sBox[a[0]],
        this.__sBox[a[1]],
        this.__sBox[a[2]],
        this.__sBox[a[3]],
    ];
}

aes.__cipherBlock = function (block, keyShedule, nk, nr) {
    var state = this.__block2state(block);

    this.__addRoundKey(state, keyShedule.slice(0, 4));

    for (var round = 1; round <= nr - 1; round++) {
        this.__subBytes(state);
        this.__shiftRows(state);
        this.__mixColumns(state);
        this.__addRoundKey(state, keyShedule.slice(round * 4, round * 4 + 4));
    }

    this.__subBytes(state);
    this.__shiftRows(state);
    this.__addRoundKey(state, keyShedule.slice(nr * 4, nr * 4 + 4));

    return this.__state2block(state);
}

aes.__invCipherBlock = function (block, keyShedule, nk, nr) {
    var state = this.__block2state(block);
    this.__addRoundKey(state, keyShedule.slice(nr * 4, 4 * nr + 4));

    for (var round = nr - 1; round > 0; round--) {
        this.__invShiftRows(state);
        this.__invSubBytes(state);
        this.__addRoundKey(state, keyShedule.slice(round * 4, round * 4 + 4));
        this.__invMixColumns(state);
    }

    this.__invShiftRows(state);
    this.__invSubBytes(state);
    this.__addRoundKey(state, keyShedule.slice(0, 4));

    return this.__state2block(state);
}

aes.__keyExpansion = function(key, nk, nr) {
    var keyShedule = [];

    var wordsNk = nk / 4;
    for (var i = 0; i < wordsNk; i++) {
        keyShedule[i] = key.slice(i * 4, i * 4 + 4);
    }

    for (var i = wordsNk; i < 4 * (nr + 1); i++) {
        temp = keyShedule[i - 1];
        if (i % wordsNk == 0) {
            temp = bytesXor(this.__subWord(rotBytes(temp)), this.__rCon[i / wordsNk]);
        } else if (wordsNk > 6 && (i % wordsNk) == 4) {
            temp = this.__subWord(temp);
        }
        keyShedule[i] = bytesXor(keyShedule[i - wordsNk], temp);
    }

    return keyShedule;
}

aes.encode = function (message, key, options) {
    options = options || {};
    options.mode = options.mode || "CBC";

    if (key.length != 16 && key.length != 24 && key.length != 32)
        key = sha256.hash(key);
    message = message.slice(0);
    addPadding(message, 16);

    var nk = key.length;
    var nr = (nk == 16 ? 10 : (nk == 24 ? 12 : 14));

    var keyShedule = this.__keyExpansion(key, nk, nr);

    return cryptModes.encode(options.mode, message, 16, keyShedule, function(block, key) {
        return aes.__cipherBlock(block, key, nk, nr);
    }, options.iv);
}

aes.decode = function (message, key, options) {
    options = options || {};
    options.mode = options.mode || "CBC";

    if (key.length != 16 && key.length != 24 && key.length != 32)
        key = sha256.hash(key);

    var nk = key.length;
    var nr = (nk == 16 ? 10 : (nk == 24 ? 12 : 14));

    var keyShedule = this.__keyExpansion(key, nk, nr);

    return removePadding(
        cryptModes.decode(options.mode, message, 16, keyShedule, function(block, key) {
            return aes.__invCipherBlock(block, key, nk, nr);
        }, options.iv)
    );
}
