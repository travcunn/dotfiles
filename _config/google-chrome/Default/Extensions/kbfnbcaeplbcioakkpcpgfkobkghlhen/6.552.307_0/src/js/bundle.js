!function e(t, n, r) {
    function o() {
        for (var e = Object.keys(t).map(function(e) {
            return t[e][1];
        }), n = 0; n < e.length; n++) {
            var r = e[n].proxyquireify;
            if (r) return r;
        }
    }
    function i(o, l) {
        var c = null != s && n[s], u = c && c.exports._cache || n;
        if (!u[o]) {
            if (!t[o]) {
                var d = "function" == typeof require && require;
                if (!l && d) return d(o, !0);
                if (a) return a(o, !0);
                var f = new Error("Cannot find module '" + o + "'");
                throw f.code = "MODULE_NOT_FOUND", f;
            }
            var p = u[o] = {
                exports: {}
            }, m = function(e) {
                var n = t[o][1][e];
                return i(n ? n : e);
            }, g = function(e) {
                var t = null != s && n[s];
                return t && t.exports._proxy ? t.exports._proxy(m, e) : m(e);
            };
            t[o][0].call(p.exports, g, p, p.exports, e, t, u, r);
        }
        return u[o].exports;
    }
    for (var a = "function" == typeof require && require, s = o(), l = 0; l < r.length; l++) i(r[l]);
    return i;
}({
    "/project/node_modules/browserify/node_modules/buffer/index.js": [ function(e, t, n) {
        (function(t) {
            function r() {
                return o.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
            }
            function o(e) {
                return this instanceof o ? (this.length = 0, this.parent = void 0, "number" == typeof e ? i(this, e) : "string" == typeof e ? a(this, e, arguments.length > 1 ? arguments[1] : "utf8") : s(this, e)) : arguments.length > 1 ? new o(e, arguments[1]) : new o(e);
            }
            function i(e, t) {
                if (e = m(e, 0 > t ? 0 : 0 | g(t)), !o.TYPED_ARRAY_SUPPORT) for (var n = 0; t > n; n++) e[n] = 0;
                return e;
            }
            function a(e, t, n) {
                ("string" != typeof n || "" === n) && (n = "utf8");
                var r = 0 | v(t, n);
                return e = m(e, r), e.write(t, n), e;
            }
            function s(e, t) {
                if (o.isBuffer(t)) return l(e, t);
                if (K(t)) return c(e, t);
                if (null == t) throw new TypeError("must start with number, buffer, array or string");
                if ("undefined" != typeof ArrayBuffer) {
                    if (t.buffer instanceof ArrayBuffer) return u(e, t);
                    if (t instanceof ArrayBuffer) return d(e, t);
                }
                return t.length ? f(e, t) : p(e, t);
            }
            function l(e, t) {
                var n = 0 | g(t.length);
                return e = m(e, n), t.copy(e, 0, 0, n), e;
            }
            function c(e, t) {
                var n = 0 | g(t.length);
                e = m(e, n);
                for (var r = 0; n > r; r += 1) e[r] = 255 & t[r];
                return e;
            }
            function u(e, t) {
                var n = 0 | g(t.length);
                e = m(e, n);
                for (var r = 0; n > r; r += 1) e[r] = 255 & t[r];
                return e;
            }
            function d(e, t) {
                return o.TYPED_ARRAY_SUPPORT ? (t.byteLength, e = o._augment(new Uint8Array(t))) : e = u(e, new Uint8Array(t)), 
                e;
            }
            function f(e, t) {
                var n = 0 | g(t.length);
                e = m(e, n);
                for (var r = 0; n > r; r += 1) e[r] = 255 & t[r];
                return e;
            }
            function p(e, t) {
                var n, r = 0;
                "Buffer" === t.type && K(t.data) && (n = t.data, r = 0 | g(n.length)), e = m(e, r);
                for (var o = 0; r > o; o += 1) e[o] = 255 & n[o];
                return e;
            }
            function m(e, t) {
                o.TYPED_ARRAY_SUPPORT ? (e = o._augment(new Uint8Array(t)), e.__proto__ = o.prototype) : (e.length = t, 
                e._isBuffer = !0);
                var n = 0 !== t && t <= o.poolSize >>> 1;
                return n && (e.parent = J), e;
            }
            function g(e) {
                if (e >= r()) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + r().toString(16) + " bytes");
                return 0 | e;
            }
            function h(e, t) {
                if (!(this instanceof h)) return new h(e, t);
                var n = new o(e, t);
                return delete n.parent, n;
            }
            function v(e, t) {
                "string" != typeof e && (e = "" + e);
                var n = e.length;
                if (0 === n) return 0;
                for (var r = !1; ;) switch (t) {
                  case "ascii":
                  case "binary":
                  case "raw":
                  case "raws":
                    return n;

                  case "utf8":
                  case "utf-8":
                    return H(e).length;

                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return 2 * n;

                  case "hex":
                    return n >>> 1;

                  case "base64":
                    return W(e).length;

                  default:
                    if (r) return H(e).length;
                    t = ("" + t).toLowerCase(), r = !0;
                }
            }
            function b(e, t, n) {
                var r = !1;
                if (t = 0 | t, n = void 0 === n || n === 1 / 0 ? this.length : 0 | n, e || (e = "utf8"), 
                0 > t && (t = 0), n > this.length && (n = this.length), t >= n) return "";
                for (;;) switch (e) {
                  case "hex":
                    return S(this, t, n);

                  case "utf8":
                  case "utf-8":
                    return C(this, t, n);

                  case "ascii":
                    return P(this, t, n);

                  case "binary":
                    return T(this, t, n);

                  case "base64":
                    return k(this, t, n);

                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return M(this, t, n);

                  default:
                    if (r) throw new TypeError("Unknown encoding: " + e);
                    e = (e + "").toLowerCase(), r = !0;
                }
            }
            function y(e, t, n, r) {
                n = Number(n) || 0;
                var o = e.length - n;
                r ? (r = Number(r), r > o && (r = o)) : r = o;
                var i = t.length;
                if (i % 2 !== 0) throw new Error("Invalid hex string");
                r > i / 2 && (r = i / 2);
                for (var a = 0; r > a; a++) {
                    var s = parseInt(t.substr(2 * a, 2), 16);
                    if (isNaN(s)) throw new Error("Invalid hex string");
                    e[n + a] = s;
                }
                return a;
            }
            function j(e, t, n, r) {
                return Y(H(t, e.length - n), e, n, r);
            }
            function w(e, t, n, r) {
                return Y(V(t), e, n, r);
            }
            function _(e, t, n, r) {
                return w(e, t, n, r);
            }
            function x(e, t, n, r) {
                return Y(W(t), e, n, r);
            }
            function E(e, t, n, r) {
                return Y(G(t, e.length - n), e, n, r);
            }
            function k(e, t, n) {
                return 0 === t && n === e.length ? q.fromByteArray(e) : q.fromByteArray(e.slice(t, n));
            }
            function C(e, t, n) {
                n = Math.min(e.length, n);
                for (var r = [], o = t; n > o; ) {
                    var i = e[o], a = null, s = i > 239 ? 4 : i > 223 ? 3 : i > 191 ? 2 : 1;
                    if (n >= o + s) {
                        var l, c, u, d;
                        switch (s) {
                          case 1:
                            128 > i && (a = i);
                            break;

                          case 2:
                            l = e[o + 1], 128 === (192 & l) && (d = (31 & i) << 6 | 63 & l, d > 127 && (a = d));
                            break;

                          case 3:
                            l = e[o + 1], c = e[o + 2], 128 === (192 & l) && 128 === (192 & c) && (d = (15 & i) << 12 | (63 & l) << 6 | 63 & c, 
                            d > 2047 && (55296 > d || d > 57343) && (a = d));
                            break;

                          case 4:
                            l = e[o + 1], c = e[o + 2], u = e[o + 3], 128 === (192 & l) && 128 === (192 & c) && 128 === (192 & u) && (d = (15 & i) << 18 | (63 & l) << 12 | (63 & c) << 6 | 63 & u, 
                            d > 65535 && 1114112 > d && (a = d));
                        }
                    }
                    null === a ? (a = 65533, s = 1) : a > 65535 && (a -= 65536, r.push(a >>> 10 & 1023 | 55296), 
                    a = 56320 | 1023 & a), r.push(a), o += s;
                }
                return O(r);
            }
            function O(e) {
                var t = e.length;
                if ($ >= t) return String.fromCharCode.apply(String, e);
                for (var n = "", r = 0; t > r; ) n += String.fromCharCode.apply(String, e.slice(r, r += $));
                return n;
            }
            function P(e, t, n) {
                var r = "";
                n = Math.min(e.length, n);
                for (var o = t; n > o; o++) r += String.fromCharCode(127 & e[o]);
                return r;
            }
            function T(e, t, n) {
                var r = "";
                n = Math.min(e.length, n);
                for (var o = t; n > o; o++) r += String.fromCharCode(e[o]);
                return r;
            }
            function S(e, t, n) {
                var r = e.length;
                (!t || 0 > t) && (t = 0), (!n || 0 > n || n > r) && (n = r);
                for (var o = "", i = t; n > i; i++) o += z(e[i]);
                return o;
            }
            function M(e, t, n) {
                for (var r = e.slice(t, n), o = "", i = 0; i < r.length; i += 2) o += String.fromCharCode(r[i] + 256 * r[i + 1]);
                return o;
            }
            function A(e, t, n) {
                if (e % 1 !== 0 || 0 > e) throw new RangeError("offset is not uint");
                if (e + t > n) throw new RangeError("Trying to access beyond buffer length");
            }
            function N(e, t, n, r, i, a) {
                if (!o.isBuffer(e)) throw new TypeError("buffer must be a Buffer instance");
                if (t > i || a > t) throw new RangeError("value is out of bounds");
                if (n + r > e.length) throw new RangeError("index out of range");
            }
            function D(e, t, n, r) {
                0 > t && (t = 65535 + t + 1);
                for (var o = 0, i = Math.min(e.length - n, 2); i > o; o++) e[n + o] = (t & 255 << 8 * (r ? o : 1 - o)) >>> 8 * (r ? o : 1 - o);
            }
            function R(e, t, n, r) {
                0 > t && (t = 4294967295 + t + 1);
                for (var o = 0, i = Math.min(e.length - n, 4); i > o; o++) e[n + o] = t >>> 8 * (r ? o : 3 - o) & 255;
            }
            function I(e, t, n, r, o, i) {
                if (t > o || i > t) throw new RangeError("value is out of bounds");
                if (n + r > e.length) throw new RangeError("index out of range");
                if (0 > n) throw new RangeError("index out of range");
            }
            function B(e, t, n, r, o) {
                return o || I(e, t, n, 4, 3.4028234663852886e38, -3.4028234663852886e38), X.write(e, t, n, r, 23, 4), 
                n + 4;
            }
            function L(e, t, n, r, o) {
                return o || I(e, t, n, 8, 1.7976931348623157e308, -1.7976931348623157e308), X.write(e, t, n, r, 52, 8), 
                n + 8;
            }
            function F(e) {
                if (e = U(e).replace(Q, ""), e.length < 2) return "";
                for (;e.length % 4 !== 0; ) e += "=";
                return e;
            }
            function U(e) {
                return e.trim ? e.trim() : e.replace(/^\s+|\s+$/g, "");
            }
            function z(e) {
                return 16 > e ? "0" + e.toString(16) : e.toString(16);
            }
            function H(e, t) {
                t = t || 1 / 0;
                for (var n, r = e.length, o = null, i = [], a = 0; r > a; a++) {
                    if (n = e.charCodeAt(a), n > 55295 && 57344 > n) {
                        if (!o) {
                            if (n > 56319) {
                                (t -= 3) > -1 && i.push(239, 191, 189);
                                continue;
                            }
                            if (a + 1 === r) {
                                (t -= 3) > -1 && i.push(239, 191, 189);
                                continue;
                            }
                            o = n;
                            continue;
                        }
                        if (56320 > n) {
                            (t -= 3) > -1 && i.push(239, 191, 189), o = n;
                            continue;
                        }
                        n = o - 55296 << 10 | n - 56320 | 65536;
                    } else o && (t -= 3) > -1 && i.push(239, 191, 189);
                    if (o = null, 128 > n) {
                        if ((t -= 1) < 0) break;
                        i.push(n);
                    } else if (2048 > n) {
                        if ((t -= 2) < 0) break;
                        i.push(n >> 6 | 192, 63 & n | 128);
                    } else if (65536 > n) {
                        if ((t -= 3) < 0) break;
                        i.push(n >> 12 | 224, n >> 6 & 63 | 128, 63 & n | 128);
                    } else {
                        if (!(1114112 > n)) throw new Error("Invalid code point");
                        if ((t -= 4) < 0) break;
                        i.push(n >> 18 | 240, n >> 12 & 63 | 128, n >> 6 & 63 | 128, 63 & n | 128);
                    }
                }
                return i;
            }
            function V(e) {
                for (var t = [], n = 0; n < e.length; n++) t.push(255 & e.charCodeAt(n));
                return t;
            }
            function G(e, t) {
                for (var n, r, o, i = [], a = 0; a < e.length && !((t -= 2) < 0); a++) n = e.charCodeAt(a), 
                r = n >> 8, o = n % 256, i.push(o), i.push(r);
                return i;
            }
            function W(e) {
                return q.toByteArray(F(e));
            }
            function Y(e, t, n, r) {
                for (var o = 0; r > o && !(o + n >= t.length || o >= e.length); o++) t[o + n] = e[o];
                return o;
            }
            var q = e("base64-js"), X = e("ieee754"), K = e("is-array");
            n.Buffer = o, n.SlowBuffer = h, n.INSPECT_MAX_BYTES = 50, o.poolSize = 8192;
            var J = {};
            o.TYPED_ARRAY_SUPPORT = void 0 !== t.TYPED_ARRAY_SUPPORT ? t.TYPED_ARRAY_SUPPORT : function() {
                function e() {}
                try {
                    var t = new Uint8Array(1);
                    return t.foo = function() {
                        return 42;
                    }, t.constructor = e, 42 === t.foo() && t.constructor === e && "function" == typeof t.subarray && 0 === t.subarray(1, 1).byteLength;
                } catch (n) {
                    return !1;
                }
            }(), o.TYPED_ARRAY_SUPPORT && (o.prototype.__proto__ = Uint8Array.prototype, o.__proto__ = Uint8Array), 
            o.isBuffer = function(e) {
                return !(null == e || !e._isBuffer);
            }, o.compare = function(e, t) {
                if (!o.isBuffer(e) || !o.isBuffer(t)) throw new TypeError("Arguments must be Buffers");
                if (e === t) return 0;
                for (var n = e.length, r = t.length, i = 0, a = Math.min(n, r); a > i && e[i] === t[i]; ) ++i;
                return i !== a && (n = e[i], r = t[i]), r > n ? -1 : n > r ? 1 : 0;
            }, o.isEncoding = function(e) {
                switch (String(e).toLowerCase()) {
                  case "hex":
                  case "utf8":
                  case "utf-8":
                  case "ascii":
                  case "binary":
                  case "base64":
                  case "raw":
                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return !0;

                  default:
                    return !1;
                }
            }, o.concat = function(e, t) {
                if (!K(e)) throw new TypeError("list argument must be an Array of Buffers.");
                if (0 === e.length) return new o(0);
                var n;
                if (void 0 === t) for (t = 0, n = 0; n < e.length; n++) t += e[n].length;
                var r = new o(t), i = 0;
                for (n = 0; n < e.length; n++) {
                    var a = e[n];
                    a.copy(r, i), i += a.length;
                }
                return r;
            }, o.byteLength = v, o.prototype.length = void 0, o.prototype.parent = void 0, o.prototype.toString = function() {
                var e = 0 | this.length;
                return 0 === e ? "" : 0 === arguments.length ? C(this, 0, e) : b.apply(this, arguments);
            }, o.prototype.equals = function(e) {
                if (!o.isBuffer(e)) throw new TypeError("Argument must be a Buffer");
                return this === e ? !0 : 0 === o.compare(this, e);
            }, o.prototype.inspect = function() {
                var e = "", t = n.INSPECT_MAX_BYTES;
                return this.length > 0 && (e = this.toString("hex", 0, t).match(/.{2}/g).join(" "), 
                this.length > t && (e += " ... ")), "<Buffer " + e + ">";
            }, o.prototype.compare = function(e) {
                if (!o.isBuffer(e)) throw new TypeError("Argument must be a Buffer");
                return this === e ? 0 : o.compare(this, e);
            }, o.prototype.indexOf = function(e, t) {
                function n(e, t, n) {
                    for (var r = -1, o = 0; n + o < e.length; o++) if (e[n + o] === t[-1 === r ? 0 : o - r]) {
                        if (-1 === r && (r = o), o - r + 1 === t.length) return n + r;
                    } else r = -1;
                    return -1;
                }
                if (t > 2147483647 ? t = 2147483647 : -2147483648 > t && (t = -2147483648), t >>= 0, 
                0 === this.length) return -1;
                if (t >= this.length) return -1;
                if (0 > t && (t = Math.max(this.length + t, 0)), "string" == typeof e) return 0 === e.length ? -1 : String.prototype.indexOf.call(this, e, t);
                if (o.isBuffer(e)) return n(this, e, t);
                if ("number" == typeof e) return o.TYPED_ARRAY_SUPPORT && "function" === Uint8Array.prototype.indexOf ? Uint8Array.prototype.indexOf.call(this, e, t) : n(this, [ e ], t);
                throw new TypeError("val must be string, number or Buffer");
            }, o.prototype.get = function(e) {
                return console.log(".get() is deprecated. Access using array indexes instead."), 
                this.readUInt8(e);
            }, o.prototype.set = function(e, t) {
                return console.log(".set() is deprecated. Access using array indexes instead."), 
                this.writeUInt8(e, t);
            }, o.prototype.write = function(e, t, n, r) {
                if (void 0 === t) r = "utf8", n = this.length, t = 0; else if (void 0 === n && "string" == typeof t) r = t, 
                n = this.length, t = 0; else if (isFinite(t)) t = 0 | t, isFinite(n) ? (n = 0 | n, 
                void 0 === r && (r = "utf8")) : (r = n, n = void 0); else {
                    var o = r;
                    r = t, t = 0 | n, n = o;
                }
                var i = this.length - t;
                if ((void 0 === n || n > i) && (n = i), e.length > 0 && (0 > n || 0 > t) || t > this.length) throw new RangeError("attempt to write outside buffer bounds");
                r || (r = "utf8");
                for (var a = !1; ;) switch (r) {
                  case "hex":
                    return y(this, e, t, n);

                  case "utf8":
                  case "utf-8":
                    return j(this, e, t, n);

                  case "ascii":
                    return w(this, e, t, n);

                  case "binary":
                    return _(this, e, t, n);

                  case "base64":
                    return x(this, e, t, n);

                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return E(this, e, t, n);

                  default:
                    if (a) throw new TypeError("Unknown encoding: " + r);
                    r = ("" + r).toLowerCase(), a = !0;
                }
            }, o.prototype.toJSON = function() {
                return {
                    type: "Buffer",
                    data: Array.prototype.slice.call(this._arr || this, 0)
                };
            };
            var $ = 4096;
            o.prototype.slice = function(e, t) {
                var n = this.length;
                e = ~~e, t = void 0 === t ? n : ~~t, 0 > e ? (e += n, 0 > e && (e = 0)) : e > n && (e = n), 
                0 > t ? (t += n, 0 > t && (t = 0)) : t > n && (t = n), e > t && (t = e);
                var r;
                if (o.TYPED_ARRAY_SUPPORT) r = o._augment(this.subarray(e, t)); else {
                    var i = t - e;
                    r = new o(i, void 0);
                    for (var a = 0; i > a; a++) r[a] = this[a + e];
                }
                return r.length && (r.parent = this.parent || this), r;
            }, o.prototype.readUIntLE = function(e, t, n) {
                e = 0 | e, t = 0 | t, n || A(e, t, this.length);
                for (var r = this[e], o = 1, i = 0; ++i < t && (o *= 256); ) r += this[e + i] * o;
                return r;
            }, o.prototype.readUIntBE = function(e, t, n) {
                e = 0 | e, t = 0 | t, n || A(e, t, this.length);
                for (var r = this[e + --t], o = 1; t > 0 && (o *= 256); ) r += this[e + --t] * o;
                return r;
            }, o.prototype.readUInt8 = function(e, t) {
                return t || A(e, 1, this.length), this[e];
            }, o.prototype.readUInt16LE = function(e, t) {
                return t || A(e, 2, this.length), this[e] | this[e + 1] << 8;
            }, o.prototype.readUInt16BE = function(e, t) {
                return t || A(e, 2, this.length), this[e] << 8 | this[e + 1];
            }, o.prototype.readUInt32LE = function(e, t) {
                return t || A(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + 16777216 * this[e + 3];
            }, o.prototype.readUInt32BE = function(e, t) {
                return t || A(e, 4, this.length), 16777216 * this[e] + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]);
            }, o.prototype.readIntLE = function(e, t, n) {
                e = 0 | e, t = 0 | t, n || A(e, t, this.length);
                for (var r = this[e], o = 1, i = 0; ++i < t && (o *= 256); ) r += this[e + i] * o;
                return o *= 128, r >= o && (r -= Math.pow(2, 8 * t)), r;
            }, o.prototype.readIntBE = function(e, t, n) {
                e = 0 | e, t = 0 | t, n || A(e, t, this.length);
                for (var r = t, o = 1, i = this[e + --r]; r > 0 && (o *= 256); ) i += this[e + --r] * o;
                return o *= 128, i >= o && (i -= Math.pow(2, 8 * t)), i;
            }, o.prototype.readInt8 = function(e, t) {
                return t || A(e, 1, this.length), 128 & this[e] ? -1 * (255 - this[e] + 1) : this[e];
            }, o.prototype.readInt16LE = function(e, t) {
                t || A(e, 2, this.length);
                var n = this[e] | this[e + 1] << 8;
                return 32768 & n ? 4294901760 | n : n;
            }, o.prototype.readInt16BE = function(e, t) {
                t || A(e, 2, this.length);
                var n = this[e + 1] | this[e] << 8;
                return 32768 & n ? 4294901760 | n : n;
            }, o.prototype.readInt32LE = function(e, t) {
                return t || A(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24;
            }, o.prototype.readInt32BE = function(e, t) {
                return t || A(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3];
            }, o.prototype.readFloatLE = function(e, t) {
                return t || A(e, 4, this.length), X.read(this, e, !0, 23, 4);
            }, o.prototype.readFloatBE = function(e, t) {
                return t || A(e, 4, this.length), X.read(this, e, !1, 23, 4);
            }, o.prototype.readDoubleLE = function(e, t) {
                return t || A(e, 8, this.length), X.read(this, e, !0, 52, 8);
            }, o.prototype.readDoubleBE = function(e, t) {
                return t || A(e, 8, this.length), X.read(this, e, !1, 52, 8);
            }, o.prototype.writeUIntLE = function(e, t, n, r) {
                e = +e, t = 0 | t, n = 0 | n, r || N(this, e, t, n, Math.pow(2, 8 * n), 0);
                var o = 1, i = 0;
                for (this[t] = 255 & e; ++i < n && (o *= 256); ) this[t + i] = e / o & 255;
                return t + n;
            }, o.prototype.writeUIntBE = function(e, t, n, r) {
                e = +e, t = 0 | t, n = 0 | n, r || N(this, e, t, n, Math.pow(2, 8 * n), 0);
                var o = n - 1, i = 1;
                for (this[t + o] = 255 & e; --o >= 0 && (i *= 256); ) this[t + o] = e / i & 255;
                return t + n;
            }, o.prototype.writeUInt8 = function(e, t, n) {
                return e = +e, t = 0 | t, n || N(this, e, t, 1, 255, 0), o.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)), 
                this[t] = e, t + 1;
            }, o.prototype.writeUInt16LE = function(e, t, n) {
                return e = +e, t = 0 | t, n || N(this, e, t, 2, 65535, 0), o.TYPED_ARRAY_SUPPORT ? (this[t] = e, 
                this[t + 1] = e >>> 8) : D(this, e, t, !0), t + 2;
            }, o.prototype.writeUInt16BE = function(e, t, n) {
                return e = +e, t = 0 | t, n || N(this, e, t, 2, 65535, 0), o.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 8, 
                this[t + 1] = e) : D(this, e, t, !1), t + 2;
            }, o.prototype.writeUInt32LE = function(e, t, n) {
                return e = +e, t = 0 | t, n || N(this, e, t, 4, 4294967295, 0), o.TYPED_ARRAY_SUPPORT ? (this[t + 3] = e >>> 24, 
                this[t + 2] = e >>> 16, this[t + 1] = e >>> 8, this[t] = e) : R(this, e, t, !0), 
                t + 4;
            }, o.prototype.writeUInt32BE = function(e, t, n) {
                return e = +e, t = 0 | t, n || N(this, e, t, 4, 4294967295, 0), o.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 24, 
                this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e) : R(this, e, t, !1), 
                t + 4;
            }, o.prototype.writeIntLE = function(e, t, n, r) {
                if (e = +e, t = 0 | t, !r) {
                    var o = Math.pow(2, 8 * n - 1);
                    N(this, e, t, n, o - 1, -o);
                }
                var i = 0, a = 1, s = 0 > e ? 1 : 0;
                for (this[t] = 255 & e; ++i < n && (a *= 256); ) this[t + i] = (e / a >> 0) - s & 255;
                return t + n;
            }, o.prototype.writeIntBE = function(e, t, n, r) {
                if (e = +e, t = 0 | t, !r) {
                    var o = Math.pow(2, 8 * n - 1);
                    N(this, e, t, n, o - 1, -o);
                }
                var i = n - 1, a = 1, s = 0 > e ? 1 : 0;
                for (this[t + i] = 255 & e; --i >= 0 && (a *= 256); ) this[t + i] = (e / a >> 0) - s & 255;
                return t + n;
            }, o.prototype.writeInt8 = function(e, t, n) {
                return e = +e, t = 0 | t, n || N(this, e, t, 1, 127, -128), o.TYPED_ARRAY_SUPPORT || (e = Math.floor(e)), 
                0 > e && (e = 255 + e + 1), this[t] = e, t + 1;
            }, o.prototype.writeInt16LE = function(e, t, n) {
                return e = +e, t = 0 | t, n || N(this, e, t, 2, 32767, -32768), o.TYPED_ARRAY_SUPPORT ? (this[t] = e, 
                this[t + 1] = e >>> 8) : D(this, e, t, !0), t + 2;
            }, o.prototype.writeInt16BE = function(e, t, n) {
                return e = +e, t = 0 | t, n || N(this, e, t, 2, 32767, -32768), o.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 8, 
                this[t + 1] = e) : D(this, e, t, !1), t + 2;
            }, o.prototype.writeInt32LE = function(e, t, n) {
                return e = +e, t = 0 | t, n || N(this, e, t, 4, 2147483647, -2147483648), o.TYPED_ARRAY_SUPPORT ? (this[t] = e, 
                this[t + 1] = e >>> 8, this[t + 2] = e >>> 16, this[t + 3] = e >>> 24) : R(this, e, t, !0), 
                t + 4;
            }, o.prototype.writeInt32BE = function(e, t, n) {
                return e = +e, t = 0 | t, n || N(this, e, t, 4, 2147483647, -2147483648), 0 > e && (e = 4294967295 + e + 1), 
                o.TYPED_ARRAY_SUPPORT ? (this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, 
                this[t + 3] = e) : R(this, e, t, !1), t + 4;
            }, o.prototype.writeFloatLE = function(e, t, n) {
                return B(this, e, t, !0, n);
            }, o.prototype.writeFloatBE = function(e, t, n) {
                return B(this, e, t, !1, n);
            }, o.prototype.writeDoubleLE = function(e, t, n) {
                return L(this, e, t, !0, n);
            }, o.prototype.writeDoubleBE = function(e, t, n) {
                return L(this, e, t, !1, n);
            }, o.prototype.copy = function(e, t, n, r) {
                if (n || (n = 0), r || 0 === r || (r = this.length), t >= e.length && (t = e.length), 
                t || (t = 0), r > 0 && n > r && (r = n), r === n) return 0;
                if (0 === e.length || 0 === this.length) return 0;
                if (0 > t) throw new RangeError("targetStart out of bounds");
                if (0 > n || n >= this.length) throw new RangeError("sourceStart out of bounds");
                if (0 > r) throw new RangeError("sourceEnd out of bounds");
                r > this.length && (r = this.length), e.length - t < r - n && (r = e.length - t + n);
                var i, a = r - n;
                if (this === e && t > n && r > t) for (i = a - 1; i >= 0; i--) e[i + t] = this[i + n]; else if (1e3 > a || !o.TYPED_ARRAY_SUPPORT) for (i = 0; a > i; i++) e[i + t] = this[i + n]; else e._set(this.subarray(n, n + a), t);
                return a;
            }, o.prototype.fill = function(e, t, n) {
                if (e || (e = 0), t || (t = 0), n || (n = this.length), t > n) throw new RangeError("end < start");
                if (n !== t && 0 !== this.length) {
                    if (0 > t || t >= this.length) throw new RangeError("start out of bounds");
                    if (0 > n || n > this.length) throw new RangeError("end out of bounds");
                    var r;
                    if ("number" == typeof e) for (r = t; n > r; r++) this[r] = e; else {
                        var o = H(e.toString()), i = o.length;
                        for (r = t; n > r; r++) this[r] = o[r % i];
                    }
                    return this;
                }
            }, o.prototype.toArrayBuffer = function() {
                if ("undefined" != typeof Uint8Array) {
                    if (o.TYPED_ARRAY_SUPPORT) return new o(this).buffer;
                    for (var e = new Uint8Array(this.length), t = 0, n = e.length; n > t; t += 1) e[t] = this[t];
                    return e.buffer;
                }
                throw new TypeError("Buffer.toArrayBuffer not supported in this browser");
            };
            var Z = o.prototype;
            o._augment = function(e) {
                return e.constructor = o, e._isBuffer = !0, e._set = e.set, e.get = Z.get, e.set = Z.set, 
                e.write = Z.write, e.toString = Z.toString, e.toLocaleString = Z.toString, e.toJSON = Z.toJSON, 
                e.equals = Z.equals, e.compare = Z.compare, e.indexOf = Z.indexOf, e.copy = Z.copy, 
                e.slice = Z.slice, e.readUIntLE = Z.readUIntLE, e.readUIntBE = Z.readUIntBE, e.readUInt8 = Z.readUInt8, 
                e.readUInt16LE = Z.readUInt16LE, e.readUInt16BE = Z.readUInt16BE, e.readUInt32LE = Z.readUInt32LE, 
                e.readUInt32BE = Z.readUInt32BE, e.readIntLE = Z.readIntLE, e.readIntBE = Z.readIntBE, 
                e.readInt8 = Z.readInt8, e.readInt16LE = Z.readInt16LE, e.readInt16BE = Z.readInt16BE, 
                e.readInt32LE = Z.readInt32LE, e.readInt32BE = Z.readInt32BE, e.readFloatLE = Z.readFloatLE, 
                e.readFloatBE = Z.readFloatBE, e.readDoubleLE = Z.readDoubleLE, e.readDoubleBE = Z.readDoubleBE, 
                e.writeUInt8 = Z.writeUInt8, e.writeUIntLE = Z.writeUIntLE, e.writeUIntBE = Z.writeUIntBE, 
                e.writeUInt16LE = Z.writeUInt16LE, e.writeUInt16BE = Z.writeUInt16BE, e.writeUInt32LE = Z.writeUInt32LE, 
                e.writeUInt32BE = Z.writeUInt32BE, e.writeIntLE = Z.writeIntLE, e.writeIntBE = Z.writeIntBE, 
                e.writeInt8 = Z.writeInt8, e.writeInt16LE = Z.writeInt16LE, e.writeInt16BE = Z.writeInt16BE, 
                e.writeInt32LE = Z.writeInt32LE, e.writeInt32BE = Z.writeInt32BE, e.writeFloatLE = Z.writeFloatLE, 
                e.writeFloatBE = Z.writeFloatBE, e.writeDoubleLE = Z.writeDoubleLE, e.writeDoubleBE = Z.writeDoubleBE, 
                e.fill = Z.fill, e.inspect = Z.inspect, e.toArrayBuffer = Z.toArrayBuffer, e;
            };
            var Q = /[^+\/0-9A-Za-z-_]/g;
        }).call(this, "undefined" != typeof window ? window : {});
    }, {
        "base64-js": "/project/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js",
        ieee754: "/project/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js",
        "is-array": "/project/node_modules/browserify/node_modules/buffer/node_modules/is-array/index.js"
    } ],
    "/project/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js": [ function(e, t, n) {
        var r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        !function(e) {
            "use strict";
            function t(e) {
                var t = e.charCodeAt(0);
                return t === a || t === d ? 62 : t === s || t === f ? 63 : l > t ? -1 : l + 10 > t ? t - l + 26 + 26 : u + 26 > t ? t - u : c + 26 > t ? t - c + 26 : void 0;
            }
            function n(e) {
                function n(e) {
                    c[d++] = e;
                }
                var r, o, a, s, l, c;
                if (e.length % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
                var u = e.length;
                l = "=" === e.charAt(u - 2) ? 2 : "=" === e.charAt(u - 1) ? 1 : 0, c = new i(3 * e.length / 4 - l), 
                a = l > 0 ? e.length - 4 : e.length;
                var d = 0;
                for (r = 0, o = 0; a > r; r += 4, o += 3) s = t(e.charAt(r)) << 18 | t(e.charAt(r + 1)) << 12 | t(e.charAt(r + 2)) << 6 | t(e.charAt(r + 3)), 
                n((16711680 & s) >> 16), n((65280 & s) >> 8), n(255 & s);
                return 2 === l ? (s = t(e.charAt(r)) << 2 | t(e.charAt(r + 1)) >> 4, n(255 & s)) : 1 === l && (s = t(e.charAt(r)) << 10 | t(e.charAt(r + 1)) << 4 | t(e.charAt(r + 2)) >> 2, 
                n(s >> 8 & 255), n(255 & s)), c;
            }
            function o(e) {
                function t(e) {
                    return r.charAt(e);
                }
                function n(e) {
                    return t(e >> 18 & 63) + t(e >> 12 & 63) + t(e >> 6 & 63) + t(63 & e);
                }
                var o, i, a, s = e.length % 3, l = "";
                for (o = 0, a = e.length - s; a > o; o += 3) i = (e[o] << 16) + (e[o + 1] << 8) + e[o + 2], 
                l += n(i);
                switch (s) {
                  case 1:
                    i = e[e.length - 1], l += t(i >> 2), l += t(i << 4 & 63), l += "==";
                    break;

                  case 2:
                    i = (e[e.length - 2] << 8) + e[e.length - 1], l += t(i >> 10), l += t(i >> 4 & 63), 
                    l += t(i << 2 & 63), l += "=";
                }
                return l;
            }
            var i = "undefined" != typeof Uint8Array ? Uint8Array : Array, a = "+".charCodeAt(0), s = "/".charCodeAt(0), l = "0".charCodeAt(0), c = "a".charCodeAt(0), u = "A".charCodeAt(0), d = "-".charCodeAt(0), f = "_".charCodeAt(0);
            e.toByteArray = n, e.fromByteArray = o;
        }("undefined" == typeof n ? this.base64js = {} : n);
    }, {} ],
    "/project/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js": [ function(e, t, n) {
        n.read = function(e, t, n, r, o) {
            var i, a, s = 8 * o - r - 1, l = (1 << s) - 1, c = l >> 1, u = -7, d = n ? o - 1 : 0, f = n ? -1 : 1, p = e[t + d];
            for (d += f, i = p & (1 << -u) - 1, p >>= -u, u += s; u > 0; i = 256 * i + e[t + d], 
            d += f, u -= 8) ;
            for (a = i & (1 << -u) - 1, i >>= -u, u += r; u > 0; a = 256 * a + e[t + d], d += f, 
            u -= 8) ;
            if (0 === i) i = 1 - c; else {
                if (i === l) return a ? NaN : (p ? -1 : 1) * (1 / 0);
                a += Math.pow(2, r), i -= c;
            }
            return (p ? -1 : 1) * a * Math.pow(2, i - r);
        }, n.write = function(e, t, n, r, o, i) {
            var a, s, l, c = 8 * i - o - 1, u = (1 << c) - 1, d = u >> 1, f = 23 === o ? Math.pow(2, -24) - Math.pow(2, -77) : 0, p = r ? 0 : i - 1, m = r ? 1 : -1, g = 0 > t || 0 === t && 0 > 1 / t ? 1 : 0;
            for (t = Math.abs(t), isNaN(t) || t === 1 / 0 ? (s = isNaN(t) ? 1 : 0, a = u) : (a = Math.floor(Math.log(t) / Math.LN2), 
            t * (l = Math.pow(2, -a)) < 1 && (a--, l *= 2), t += a + d >= 1 ? f / l : f * Math.pow(2, 1 - d), 
            t * l >= 2 && (a++, l /= 2), a + d >= u ? (s = 0, a = u) : a + d >= 1 ? (s = (t * l - 1) * Math.pow(2, o), 
            a += d) : (s = t * Math.pow(2, d - 1) * Math.pow(2, o), a = 0)); o >= 8; e[n + p] = 255 & s, 
            p += m, s /= 256, o -= 8) ;
            for (a = a << o | s, c += o; c > 0; e[n + p] = 255 & a, p += m, a /= 256, c -= 8) ;
            e[n + p - m] |= 128 * g;
        };
    }, {} ],
    "/project/node_modules/browserify/node_modules/buffer/node_modules/is-array/index.js": [ function(e, t, n) {
        var r = Array.isArray, o = Object.prototype.toString;
        t.exports = r || function(e) {
            return !!e && "[object Array]" == o.call(e);
        };
    }, {} ],
    "/project/node_modules/deep-extend/lib/deep-extend.js": [ function(e, t, n) {
        (function(e) {
            "use strict";
            function n(t) {
                return t instanceof e || t instanceof Date || t instanceof RegExp ? !0 : !1;
            }
            function r(t) {
                if (t instanceof e) {
                    var n = new e(t.length);
                    return t.copy(n), n;
                }
                if (t instanceof Date) return new Date(t.getTime());
                if (t instanceof RegExp) return new RegExp(t);
                throw new Error("Unexpected situation");
            }
            function o(e) {
                var t = [];
                return e.forEach(function(e, a) {
                    "object" == typeof e && null !== e ? Array.isArray(e) ? t[a] = o(e) : n(e) ? t[a] = r(e) : t[a] = i({}, e) : t[a] = e;
                }), t;
            }
            var i = t.exports = function() {
                if (arguments.length < 1 || "object" != typeof arguments[0]) return !1;
                if (arguments.length < 2) return arguments[0];
                var e, t, a = arguments[0], s = Array.prototype.slice.call(arguments, 1);
                return s.forEach(function(s) {
                    "object" != typeof s || Array.isArray(s) || Object.keys(s).forEach(function(l) {
                        return t = a[l], e = s[l], e === a ? void 0 : "object" != typeof e || null === e ? void (a[l] = e) : Array.isArray(e) ? void (a[l] = o(e)) : n(e) ? void (a[l] = r(e)) : "object" != typeof t || null === t || Array.isArray(t) ? void (a[l] = i({}, e)) : void (a[l] = i(t, e));
                    });
                }), a;
            };
        }).call(this, e("buffer").Buffer);
    }, {
        buffer: "/project/node_modules/browserify/node_modules/buffer/index.js"
    } ],
    "/project/src/js/index.js": [ function(e, t, n) {
        (function(t) {
            "use strict";
            function n(e) {
                return e && e.__esModule ? e : {
                    "default": e
                };
            }
            function r() {
                if ("about:" == document.location.protocol) return i["default"].success("index_load");
                document.body.dataset.grCSLoaded = !0;
                var t = e("./lib/app");
                i["default"].startAppLoadTimer(), t.init();
            }
            var o = e("./lib/failover"), i = n(o);
            i["default"].startPageLoadTimer(), !t._babelPolyfill && e("babel/polyfill"), "loading" == document.readyState ? document.addEventListener("DOMContentLoaded", r, !1) : r();
        }).call(this, "undefined" != typeof window ? window : {});
    }, {
        "./lib/app": "/project/src/js/lib/app.js",
        "./lib/failover": "/project/src/js/lib/failover.js",
        "babel/polyfill": "babel/polyfill"
    } ],
    "/project/src/js/lib/app.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o() {
            var e;
            return regeneratorRuntime.async(function(t) {
                for (;;) switch (t.prev = t.next) {
                  case 0:
                    return t.next = 2, regeneratorRuntime.awrap(a());

                  case 2:
                    return t.next = 4, regeneratorRuntime.awrap(c());

                  case 4:
                    return t.next = 6, regeneratorRuntime.awrap(x["default"].init());

                  case 6:
                    if (e = N.getDomain(), y["default"].emitBackground("page-opened"), u(), !e.includes("ed.grammarly.com")) {
                        t.next = 11;
                        break;
                    }
                    return t.abrupt("return", s());

                  case 11:
                    if (l(e), x["default"].checkDomain(e)) {
                        t.next = 16;
                        break;
                    }
                    return R.call("felog.info", "not_enable_on_domain", {
                        pageDomain: e
                    }), R.call("gnar.send", A.getBrowser() + "Ext/notEnableOnDomain", {
                        pageDomain: e
                    }), t.abrupt("return", s());

                  case 16:
                    return w["default"].enabled(function(e) {
                        return e && m();
                    }), t.next = 19, regeneratorRuntime.awrap(w["default"].get("enabledDefs"));

                  case 19:
                    if (!t.sent) {
                        t.next = 21;
                        break;
                    }
                    q = v["default"]({
                        doc: W
                    });

                  case 21:
                    w["default"].on("enabledDefs", d), w["default"].on("enabled", f), A.isSafari() && p(), 
                    s();

                  case 25:
                  case "end":
                    return t.stop();
                }
            }, null, this);
        }
        function i(e) {
            var t, n, r;
            return regeneratorRuntime.async(function(o) {
                for (;;) switch (o.prev = o.next) {
                  case 0:
                    t = 0, n = 500, r = void 0;

                  case 3:
                    if (r) {
                        o.next = 21;
                        break;
                    }
                    return o.prev = 4, o.next = 7, regeneratorRuntime.awrap(e());

                  case 7:
                    r = !0, o.next = 19;
                    break;

                  case 10:
                    if (o.prev = 10, o.t0 = o["catch"](4), t++, !(t > 5)) {
                        o.next = 15;
                        break;
                    }
                    throw o.t0;

                  case 15:
                    return console.log("failed, retry №", t, o.t0), n = 2 * n * (.75 + .5 * Math.random()) | 0, 
                    o.next = 19, regeneratorRuntime.awrap(A.delay(n));

                  case 19:
                    o.next = 3;
                    break;

                  case 21:
                    t > 0 && R.call("felog.info", "stability.bg_call_success_after_retry", {
                        retryCount: t
                    });

                  case 22:
                  case "end":
                    return o.stop();
                }
            }, null, this, [ [ 4, 10 ] ]);
        }
        function a() {
            var e, t;
            return regeneratorRuntime.async(function(n) {
                for (var r = this; ;) switch (n.prev = n.next) {
                  case 0:
                    return n.prev = 0, n.next = 3, regeneratorRuntime.awrap(function() {
                        var e;
                        return regeneratorRuntime.async(function(t) {
                            for (var n = this; ;) switch (t.prev = t.next) {
                              case 0:
                                return e = A.guid(), t.next = 3, regeneratorRuntime.awrap(i(function() {
                                    return regeneratorRuntime.async(function(t) {
                                        for (;;) switch (t.prev = t.next) {
                                          case 0:
                                            return t.next = 2, regeneratorRuntime.awrap(y["default"].promiseBackground("sync", {
                                                id: e
                                            }, 5e3));

                                          case 2:
                                            return t.next = 4, regeneratorRuntime.awrap(y["default"].promiseBackground("sync2", {
                                                id: e
                                            }, 5e3));

                                          case 4:
                                          case "end":
                                            return t.stop();
                                        }
                                    }, null, n);
                                }));

                              case 3:
                              case "end":
                                return t.stop();
                            }
                        }, null, r);
                    }());

                  case 3:
                    n.next = 13;
                    break;

                  case 5:
                    return n.prev = 5, n.t0 = n["catch"](0), n.next = 9, regeneratorRuntime.awrap(A.isBgAlive());

                  case 9:
                    e = n.sent, t = n.t0 && n.t0.message, console.error(n.t0, "bg state", e), R.call("felog.error", "stability.bg_call_timeout", {
                        bgConnection: e,
                        msg: t
                    });

                  case 13:
                  case "end":
                    return n.stop();
                }
            }, null, this, [ [ 0, 5 ] ]);
        }
        function s() {
            F["default"].success("index_load");
        }
        function l(e) {
            e.includes("grammarly.com") && (T["default"](), A.isSafari() && y["default"].emitBackground("user:refresh"));
        }
        function c() {
            var t;
            return regeneratorRuntime.async(function(n) {
                for (;;) switch (n.prev = n.next) {
                  case 0:
                    return n.next = 3, regeneratorRuntime.awrap(w["default"].get("debug"));

                  case 3:
                    n.t0 = n.sent, t = Boolean(n.t0), z["default"](t), n.next = 9;
                    break;

                  case 8:
                    e("./test-api")();

                  case 9:
                  case "end":
                    return n.stop();
                }
            }, null, this);
        }
        function u() {
            D.listen(W, D.visibilityEvent(W), function() {
                return !D.docHidden(W) && y["default"].emitBackground("current-domain", N.getDomain());
            });
        }
        function d(e) {
            e && !q ? q = v["default"]({
                doc: W
            }) : (q.clear(), q = null);
        }
        function f(e) {
            var t = e.domain, n = e.value;
            N.getDomain() == t && (n ? m() : g());
        }
        function p() {
            function e() {
                var n = window.getComputedStyle(t), r = n.getPropertyValue("opacity");
                "0.5" != r ? (Y.clear(), g()) : setTimeout(e, 200);
            }
            var t = W.createElement("div");
            W.body.appendChild(t), t.classList.add("grammarly-disable-indicator"), setTimeout(e, 1e3);
        }
        function m() {
            var e, t;
            return regeneratorRuntime.async(function(n) {
                for (;;) switch (n.prev = n.next) {
                  case 0:
                    return G.online = navigator.onLine, e = {
                        doc: W,
                        app: G
                    }, n.prev = 2, n.next = 5, regeneratorRuntime.awrap(V["default"].ready);

                  case 5:
                    Y = V["default"].ext2 ? O["default"](e) : k["default"](e), console.log(V["default"]), 
                    n.next = 17;
                    break;

                  case 9:
                    n.prev = 9, n.t0 = n["catch"](2), G.online = !1, Y = k["default"](e), y["default"].emitFocusedTab("offline", {
                        msg: "Error checking is temporarily unavailable"
                    }), console.error(n.t0), R.call("statsc.ui.increment", "stability:user_get_session_error"), 
                    R.call("felog.error", "user_get_session_error", n.t0);

                  case 17:
                    t = M["default"](W), t.customizeElements(), t.addDomainClass(), F["default"].success("app_load"), 
                    R.call("statsc.ui.increment", "stability:found_editors");

                  case 22:
                  case "end":
                    return n.stop();
                }
            }, null, this, [ [ 2, 9 ] ]);
        }
        function g() {
            console.log("cleanup page from extension"), Y && Y.clear();
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var h = e("./dictionary"), v = r(h), b = e("./message"), y = r(b), j = e("./prefs"), w = r(j), _ = e("./page-config"), x = r(_), E = e("./old"), k = r(E), C = e("./buttons"), O = r(C), P = e("./external"), T = r(P), S = e("./sites"), M = r(S), A = e("./util"), N = e("./location"), D = e("./dom"), R = e("./tracking/index"), I = e("emitter"), B = r(I), L = e("./failover"), F = r(L), U = e("./console"), z = r(U), H = e("./user"), V = r(H), G = B["default"]({
            init: o,
            online: navigator.onLine
        }), W = document, Y = void 0, q = void 0;
        n["default"] = G, t.exports = n["default"];
    }, {
        "./buttons": "/project/src/js/lib/buttons/index.js",
        "./console": "/project/src/js/lib/console.js",
        "./dictionary": "/project/src/js/lib/dictionary.js",
        "./dom": "/project/src/js/lib/dom.js",
        "./external": "/project/src/js/lib/external.js",
        "./failover": "/project/src/js/lib/failover.js",
        "./location": "/project/src/js/lib/location.js",
        "./message": "/project/src/js/lib/message.js",
        "./old": "/project/src/js/lib/old/index.js",
        "./page-config": "/project/src/js/lib/page-config/index.js",
        "./prefs": "/project/src/js/lib/prefs.js",
        "./sites": "/project/src/js/lib/sites.js",
        "./test-api": "/project/src/js/lib/test-api.js",
        "./tracking/index": "/project/src/js/lib/tracking/index.js",
        "./user": "/project/src/js/lib/user.js",
        "./util": "/project/src/js/lib/util.js",
        emitter: "emitter"
    } ],
    "/project/src/js/lib/bg/cookie.js": [ function(e, t, n) {
        (function(r) {
            "use strict";
            function o(e) {
                return e && e.__esModule ? e : {
                    "default": e
                };
            }
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var i = "undefined" != typeof window ? window.forge : "undefined" != typeof r ? r.forge : null, a = o(i), s = e("../util"), l = a["default"];
            l || (l = {
                cookies: {
                    get: s._f,
                    set: s._f,
                    watch: s._f
                }
            });
            var c = function(e) {
                return l.cookies.get("grammarly.com", "/", "grauth", e), !0;
            }, u = function(e) {
                return l.cookies.watch("grammarly.com", "/", "grauth", e), !0;
            }, d = function(e, t, n) {
                return l.cookies.watch(e, "/", t, n), !0;
            }, f = function(e, t, n) {
                return l.cookies.get(e, "/", t, n), !0;
            }, p = function(e) {
                l.cookies.set(e);
            };
            n["default"] = {
                getCookie: f,
                get: f,
                set: p,
                watch: d,
                getToken: c,
                watchToken: u
            }, t.exports = n["default"];
        }).call(this, "undefined" != typeof window ? window : {});
    }, {
        "../util": "/project/src/js/lib/util.js"
    } ],
    "/project/src/js/lib/buttons/button.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            function n() {
                ke = setTimeout(function() {
                    P(), De(!1), k.call("statsc.ui.increment", "stability:g_button_without_bg_connection"), 
                    k.call("felog.error", "stability.g_button_without_bg_connection"), console.warn("button is not initiated");
                }, 2e3);
            }
            function r() {
                te = ce.createElement("grammarly-btn"), ne = h["default"].findDOMNode(M()), o(), 
                re = new A["default"]({
                    btnEl: ne,
                    fieldEl: Z,
                    custom: he,
                    sourceEl: Se,
                    isTextarea: "textarea" == Q
                }), re.on("update", j), re.on("change-state", _), Pe = D["default"]({
                    editorEl: Z,
                    btnEl: ne,
                    padding: 15
                }), oe = I["default"]({
                    el: ne,
                    editor: ie,
                    posSourceEl: ue && Z,
                    enabled: ve,
                    btn: Be,
                    app: $
                }), ae = T["default"]({
                    el: ne,
                    doc: ce,
                    win: window
                }), oe.bind(), oe.on("change-state", function(e) {
                    be = e, P();
                }), v.listen(ne, "click", g), t.on("hover", N), v.listen(de, "focus", c), v.listen(de, "blur", b), 
                y["default"].on("update", X), v.isFocused(de) && (N({
                    target: de
                }), c()), pe && Be.offline();
            }
            function o() {
                var e = {
                    "z-index": (parseInt(v.css(Z, "z-index")) || 1) + 1
                }, t = Ae && Ae.btnCustomContainer && Ae.btnCustomContainer(Z);
                if (t) {
                    he = !0, Se = t;
                    var n = Ae.btnCustomStyles && Ae.btnCustomStyles(!0, Z);
                    n && Object.assign(e, n);
                }
                v.insertAfter(te, Se), j(e);
            }
            function c() {
                return regeneratorRuntime.async(function(e) {
                    for (;;) switch (e.prev = e.next) {
                      case 0:
                        if (Ee = !0, me = !0, je = !0, t.off("hover", N), ve) {
                            e.next = 7;
                            break;
                        }
                        return X(), e.abrupt("return");

                      case 7:
                        if (!xe) {
                            e.next = 9;
                            break;
                        }
                        return e.abrupt("return");

                      case 9:
                        return xe = !0, e.prev = 10, e.next = 13, regeneratorRuntime.awrap(x["default"]({
                            app: $,
                            type: Q,
                            field: Z
                        }));

                      case 13:
                        ie = e.sent, se = O["default"](ie.reset, Be.offline), d("on"), ke && ie.api.one("start", function() {
                            De(!0);
                        }), ie.run(), oe.updateEditor(ie), re.set("minimize", !pe), re.set("editor", ie), 
                        e.next = 27;
                        break;

                      case 23:
                        e.prev = 23, e.t0 = e["catch"](10), console.error(e.t0), Be.offline();

                      case 27:
                        X();

                      case 28:
                      case "end":
                        return e.stop();
                    }
                }, null, this, [ [ 10, 23 ] ]);
            }
            function d() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? "on" : arguments[0];
                ie[e]("finish", p), ie[e]("rendered", X), ie[e]("sending", z), ie[e]("show-dialog", G);
            }
            function p() {
                G(), X();
            }
            function g() {
                ie && ie.isOffline() && ae.fastShow();
            }
            function b(e) {
                ye && v.isFocused(de) && N(e);
            }
            function j(e) {
                Object.assign(le, e), P();
            }
            function _() {
                we = !K(), _e = !0, k.fire("button-change-state", we, E.getDomain()), oe && oe.hide();
            }
            function C(e) {
                pe || (de.focus(), v.hasClass(e.target, H["default"].status) && oe.show(!0));
            }
            function P() {
                te || r(), M();
            }
            function M() {
                return h["default"].render(f["default"].createElement(U["default"], {
                    state: J(),
                    inlineStyle: le,
                    onViewClick: C
                }), te);
            }
            function N(e) {
                if (!v.isFocused(de) && me) {
                    if (Pe.within(e)) return void B();
                    me = !1;
                }
                if (e.target != de) return F();
                if (i(e.target, ne, de)) me = !0, B(); else {
                    if (a(e.target)) return;
                    F();
                }
            }
            function R() {
                ye = !0, je = !0, 0 == ne.style.opacity && (ne.style.opacity = 1), X(), Ne();
            }
            function B() {
                ye || (ve ? R() : Te = setTimeout(R, 150));
            }
            function F() {
                if (ye) {
                    if (clearTimeout(Te), oe.isOpened()) return void (ne.style.opacity = 0);
                    ye = !1, je = !1, X();
                }
            }
            function z() {
                pe || (clearTimeout(Oe), V());
            }
            function V() {
                clearTimeout(Oe), ie && !ie.getText().trim() || fe || (fe = !0, se && se.start(), 
                !ye && N({
                    target: de
                }), X());
            }
            function G() {
                clearTimeout(Oe), se && se.finish(), Oe = setTimeout(W, 200);
            }
            function W() {
                fe = !1, X();
            }
            function Y() {
                ie && (xe = !1, ie.remove(), d("off"));
            }
            function q() {
                Me && k.fire("session-end", Me, E.getDomain()), Y(), re && re.remove(), oe && oe.remove(), 
                oe && oe.unbind(), v.unlisten(ne, "click", g), t.off("hover", N), v.unlisten(de, "focus", c), 
                v.unlisten(de, "blur", b), y["default"].off("update", X), ae.remove(), te.parentNode && te.parentNode.removeChild(te);
            }
            function X() {
                var e = ie && ie.errorData() || {};
                e.enabled = ve, e.checking = fe, e.anonymous = Ce = !ee && y["default"].anonymous, 
                e.premium = y["default"].premium, e.fieldWasFocused = Ee, oe && oe.update(e), re && re.set("show", je), 
                P();
            }
            function K() {
                return re.max;
            }
            function J() {
                var e = ie && ie.errorData() || {};
                return e.critical < 1 && !fe && e.plus > 0 && Me++, {
                    offline: pe,
                    checking: fe,
                    enabled: ve,
                    anonymous: Ce,
                    show: je,
                    visible: ye,
                    wasMinimized: _e,
                    minimized: we,
                    hovered: be,
                    isFieldEmpty: ge,
                    isFieldHovered: me,
                    fieldWasFocused: Ee,
                    isEditorInited: xe,
                    errors: e
                };
            }
            var $ = e.app, Z = e.field, Q = e.type, ee = (e.disableIntersectionCheck, e.ignoreAnonymous), te = void 0, ne = void 0, re = void 0, oe = void 0, ie = void 0, ae = void 0, se = void 0, le = {
                visibility: "hidden"
            }, ce = Z.ownerDocument, ue = "iframe" == Q, de = ue ? s(Z) : Z, fe = !1, pe = !$.online, me = void 0, ge = 0 == (Z.value || Z.textContent || "").trim().length, he = !1, ve = !0, be = !1, ye = !1, je = !1, we = !1, _e = !1, xe = !1, Ee = !1, ke = void 0, Ce = !ee && y["default"].anonymous, Oe = void 0, Pe = void 0, Te = void 0, Se = Z, Me = 0, Ae = w["default"](ce).getFixesForCurrentDomain(), Ne = u["default"].throttle(function() {
                k.call("gnar.send", S.getBrowser() + "Ext/gButtonShown", {
                    pageDomain: E.getDomain()
                }), k.call("statsc.ui.increment", "stability:g_button_shown");
            }, 2e3), De = function(e) {
                pe = !e, re && re.set("minimize", e), X(), ie && (pe ? ie.offline : ie.online)(), 
                ve && ae[e ? "disable" : "enable"]();
            }, Re = function(e) {
                ve = e, L["default"].changeFieldState(Z, Se, !e), re && re.set("maximize", e), e ? (oe.hide(), 
                c()) : Y(), X();
            }, Ie = function() {
                return regeneratorRuntime.async(function(e) {
                    for (;;) switch (e.prev = e.next) {
                      case 0:
                        return e.next = 2, regeneratorRuntime.awrap(L["default"].isFieldDisabled(Z));

                      case 2:
                        ve = !e.sent, !ve && Re(!1), clearTimeout(ke), ke = null, P();

                      case 7:
                      case "end":
                        return e.stop();
                    }
                }, null, this);
            }, Be = m["default"](l({}, S.syncWait(Ie(), {
                online: function() {
                    return De(!0);
                },
                offline: function() {
                    return De(!1);
                },
                enable: function() {
                    return Re(!0);
                },
                disable: function() {
                    return Re(!1);
                },
                remove: q,
                getState: J
            }), {
                getPosState: K,
                onViewClick: C,
                onChangeState: _,
                show: B,
                hide: F,
                checking: z,
                cancelChecking: G
            }));
            return n(), Be;
        }
        function i(e, t, n) {
            return v.isFocused(n) || e == n || v.isParent(e, n) || e == t || v.isParent(e, t);
        }
        function a(e) {
            return 0 == e.className.indexOf("gr-") || v.resolveEl(e, H["default"].textarea_btn) || v.resolveEl(e, "gr__tooltip");
        }
        function s(e) {
            var t = S.guid(), n = e, r = void 0;
            v.setGRAttributes(n, t), n.setAttribute("gramm-ifr", !0);
            var o = n.contentDocument;
            return v.addIframeCss(o), v.setGRAttributes(o.body, t), n.style.height = n.style.height || getComputedStyle(n).height, 
            r = o.body, S.isFF() ? o.defaultView : r;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var l = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, c = e("lodash"), u = r(c), d = e("react"), f = r(d), p = e("emitter"), m = r(p), g = e("react-dom"), h = r(g), v = e("../dom"), b = e("../user"), y = r(b), j = e("../sites"), w = r(j), _ = e("../editor/index"), x = r(_), E = e("../location"), k = e("../tracking/index"), C = e("../infinity-checker"), O = r(C), P = e("../elements/error-tooltip"), T = r(P), S = e("../util"), M = e("./pos"), A = r(M), N = e("./path"), D = r(N), R = e("./menu"), I = r(R), B = e("./state"), L = r(B), F = e("./view"), U = r(F), z = e("styl/textarea-btn-new.styl"), H = r(z);
        n["default"] = o, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../editor/index": "/project/src/js/lib/editor/index.js",
        "../elements/error-tooltip": "/project/src/js/lib/elements/error-tooltip.js",
        "../infinity-checker": "/project/src/js/lib/infinity-checker.js",
        "../location": "/project/src/js/lib/location.js",
        "../sites": "/project/src/js/lib/sites.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../user": "/project/src/js/lib/user.js",
        "../util": "/project/src/js/lib/util.js",
        "./menu": "/project/src/js/lib/buttons/menu/index.js",
        "./path": "/project/src/js/lib/buttons/path.js",
        "./pos": "/project/src/js/lib/buttons/pos/index.js",
        "./state": "/project/src/js/lib/buttons/state.js",
        "./view": "/project/src/js/lib/buttons/view.js",
        emitter: "emitter",
        lodash: "lodash",
        react: "react",
        "react-dom": "react-dom",
        "styl/textarea-btn-new.styl": "/project/src/styl/textarea-btn-new.styl"
    } ],
    "/project/src/js/lib/buttons/index.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t(e) {
                function t(e, t) {
                    return regeneratorRuntime.async(function(n) {
                        for (;;) switch (n.prev = n.next) {
                          case 0:
                            s.call("statsc.ui.increment", "activity:" + t + ".button_created"), h.set(e, d["default"]({
                                field: e,
                                app: m,
                                type: t
                            }, g));

                          case 2:
                          case "end":
                            return n.stop();
                        }
                    }, null, this);
                }
                console.log("add", e), e.textareas.forEach(function(e) {
                    return t(e, "textarea");
                }), e.contenteditables.forEach(function(e) {
                    return t(e, "contenteditable");
                }), e.iframes.forEach(function(e) {
                    return t(e, "iframe");
                }), e.htmlghosts.forEach(function(e) {
                    return t(e, "htmlghost");
                });
            }
            function n(e) {
                console.log("remove", e), h.get(e) && h.get(e).remove(), h["delete"](e);
            }
            function r() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? "on" : arguments[0];
                a["default"][e]("online", o), a["default"][e]("offline", i), a["default"][e]("__bgerror", l), 
                g[e]("add", t), g[e]("remove", n);
                var r = "on" == e ? f.listen : f.unlisten;
                r(p, "grammarly:reset", o);
            }
            function o() {
                m.online = !0, h.forEach(function(e) {
                    return e.online();
                });
            }
            function i(e) {
                m.online = !1, h.forEach(function(t) {
                    return t.offline(e);
                });
            }
            function l(e) {
                m.online && i(e);
            }
            function u() {
                r("off"), h.forEach(function(e) {
                    return e.remove();
                }), h.clear(), h = null, m.elements && m.elements.clear(), m.elements = null, g.reset(), 
                g.stop(), g = null;
            }
            var p = e.doc, m = e.app, g = c["default"](p), h = new Map();
            return r("on"), t(g.get()), {
                add: t,
                remove: n,
                clear: u
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("../message"), a = r(i), s = e("../tracking/index"), l = e("../page-fields"), c = r(l), u = e("./button"), d = r(u), f = e("../dom");
        n["default"] = o, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../message": "/project/src/js/lib/message.js",
        "../page-fields": "/project/src/js/lib/page-fields.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "./button": "/project/src/js/lib/buttons/button.js"
    } ],
    "/project/src/js/lib/buttons/menu/action.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function a(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), l = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, c = e("react"), u = r(c), d = e("react-dom"), f = r(d), p = e("../../dom"), m = e("../../tracking/index"), g = e("styl/btn-hover-menu-new.styl"), h = r(g), v = e("../../location"), b = function(e) {
            function t() {
                i(this, t), l(Object.getPrototypeOf(t.prototype), "constructor", this).call(this), 
                this.onMouseEnterHandler = this.onMouseEnterHandler.bind(this), this.onMouseLeaveHandler = this.onMouseLeaveHandler.bind(this), 
                this.onMouseClick = this.onMouseClick.bind(this);
            }
            return a(t, e), s(t, [ {
                key: "onMouseEnterHandler",
                value: function() {
                    var e = this, t = "refferal" == this.props.data.type ? 150 : 1350;
                    this.tooltipTimeout = setTimeout(function() {
                        e.props.data.onTooltip({
                            active: !0,
                            el: f["default"].findDOMNode(e),
                            text: e.props.data.text,
                            cls: e.props.data.type
                        }), m.fire("button-hover", e.props.data.type, v.getDomain());
                    }, t);
                }
            }, {
                key: "onMouseLeaveHandler",
                value: function() {
                    clearTimeout(this.tooltipTimeout), this.props.data.onTooltip({
                        active: !1,
                        text: this.props.data.text,
                        cls: this.props.data.type
                    });
                }
            }, {
                key: "onMouseClick",
                value: function(e) {
                    this.props.data.click && this.props.data.click(e), "disable" == this.props.data.type && this.onMouseLeaveHandler();
                }
            }, {
                key: "render",
                value: function() {
                    var e, t = this.props.data, n = p.cs((e = {}, o(e, h["default"].btn, !0), o(e, h["default"]["btn_" + t.type], !0), 
                    o(e, h["default"].counter, t.count > 0), o(e, h["default"].counter100, t.count > 99), 
                    e));
                    return u["default"].createElement("div", {
                        className: n,
                        onClick: this.onMouseClick,
                        onMouseEnter: this.onMouseEnterHandler,
                        onMouseLeave: this.onMouseLeaveHandler
                    }, t.count > 0 ? t.count : null);
                }
            } ]), t;
        }(u["default"].Component);
        n["default"] = b, t.exports = n["default"];
    }, {
        "../../dom": "/project/src/js/lib/dom.js",
        "../../location": "/project/src/js/lib/location.js",
        "../../tracking/index": "/project/src/js/lib/tracking/index.js",
        react: "react",
        "react-dom": "react-dom",
        "styl/btn-hover-menu-new.styl": "/project/src/styl/btn-hover-menu-new.styl"
    } ],
    "/project/src/js/lib/buttons/menu/index.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e) {
            function t(e) {
                function t() {
                    M.showDialog({
                        caller: "button_hover"
                    }), x.fire("correct-btn-clicked", C.getDomain()), j["default"].start("open_editor");
                }
                if (!M.isOffline()) {
                    var n = e.target;
                    if (m.hasClass(n, P["default"].btn_premium)) {
                        if (!N.premium) {
                            var r = p["default"].getUpgradeUrlFromMatches({
                                baseUrl: h.URLS.upgrade,
                                returnUrl: "",
                                appType: "popup",
                                matches: M.getMatches()
                            });
                            return x.fire("upgrade", "button_hover", C.getDomain()), b["default"].emitBackground("open-url", r);
                        }
                        t();
                    }
                    m.hasClass(n, P["default"].btn_grammarly) && t(), setTimeout(E, 200);
                }
            }
            function n() {
                N.enabled ? (N.enabled = !1, A.disable(), E()) : (A.enable(), N.enabled = !0), x.fire("btn-disable-in-field", N.enabled, C.getDomain()), 
                l();
            }
            function r(e) {
                N = e, l();
            }
            function i(e) {
                M = e;
            }
            function a(e) {
                var t = g.getAbsRect(T), n = {}, r = !A.getPosState() && N.enabled, i = t.top, a = t.left;
                return e && (a -= e.clientWidth, i -= e.clientHeight / 2), i += r ? W : V, a -= r ? G : H, 
                !r && Y && Y.menuPosLeft && M && (a = Y.menuPosLeft(M.el, a)), Object.assign(n, o({}, B, "translate(" + a + "px, " + i + "px)")), 
                n;
            }
            function l() {
                var e = u(N, a(), I);
                return z = c["default"].findDOMNode(e), u(N, a(z), R);
            }
            function u(e, r, o) {
                return c["default"].render(s["default"].createElement(_["default"], {
                    style: r,
                    click: t,
                    disableClick: n,
                    state: e,
                    opened: F
                }), o);
            }
            function f() {
                m.listen(D.documentElement, "mousemove", y), M && M.on("iframe-mousemove", y);
            }
            function v(e) {
                (!F || e) && (m.unlisten(D.documentElement, "mousemove", y), M && M.off("iframe-mousemove", y));
            }
            function y(e) {
                var t = m.resolveEl(e.target, S["default"].textarea_btn);
                if (t && t != T) return E();
                if (m.hasClass(T, S["default"].offline)) return E();
                var n = m.resolveEl(e.target, P["default"].hoverMenu);
                return t || n == L ? e.target.classList.contains(S["default"].btn_text) ? E() : void w() : E();
            }
            function w(e) {
                (U && !N.offline && N.fieldWasFocused || e) && (F || (F = !0, q.emit("change-state", !0), 
                l()));
            }
            function E() {
                F && (F = !1, q.emit("change-state", !1), l());
            }
            function O() {
                v(), R.parentNode && R.parentNode.removeChild(R), I.parentNode && I.parentNode.removeChild(I);
            }
            var T = e.el, M = e.editor, A = e.btn, N = {
                critical: 0,
                plus: 0,
                offline: !1,
                enabled: e.enabled,
                initial: e.initial,
                checking: e.checking,
                fieldWasFocused: e.fieldWasFocused
            }, D = T.ownerDocument, R = D.createElement("div"), I = D.createElement("div"), B = m.transformProp(D), L = c["default"].findDOMNode(l()), F = !1, U = !0, z = void 0, H = -26, V = 11, G = -13, W = 2, Y = k["default"](D).getFixesForCurrentDomain();
            m.addClass(R, "gr-top-z-index"), m.addClass(R, "gr-top-zero"), I.style.cssText = "visibility: hidden;top: -1000px;position: absolute", 
            D.documentElement.insertBefore(R, D.body), D.documentElement.insertBefore(I, D.body);
            var q = d["default"]({
                show: w,
                hide: E,
                bind: f,
                unbind: v,
                remove: O,
                render: l,
                menuEl: L,
                update: r,
                updateEditor: i,
                isOpened: function() {
                    return F;
                },
                isEnabled: function() {
                    return U;
                },
                disable: function() {
                    return U = !1;
                },
                enable: function() {
                    return U = !0;
                },
                getState: function() {
                    return N;
                }
            });
            return q;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = e("react"), s = r(a), l = e("react-dom"), c = r(l), u = e("emitter"), d = r(u), f = e("grammarly-editor"), p = r(f), m = e("../../dom"), g = e("../../position"), h = e("../../config"), v = e("../../message"), b = r(v), y = e("../../timers"), j = r(y), w = e("./view.js"), _ = r(w), x = e("../../tracking/index"), E = e("../../sites"), k = r(E), C = e("../../location"), O = e("styl/btn-hover-menu-new.styl"), P = r(O), T = e("styl/textarea-btn-new.styl"), S = r(T);
        n["default"] = i, t.exports = n["default"];
    }, {
        "../../config": "/project/src/js/lib/config.js",
        "../../dom": "/project/src/js/lib/dom.js",
        "../../location": "/project/src/js/lib/location.js",
        "../../message": "/project/src/js/lib/message.js",
        "../../position": "/project/src/js/lib/position.js",
        "../../sites": "/project/src/js/lib/sites.js",
        "../../timers": "/project/src/js/lib/timers.js",
        "../../tracking/index": "/project/src/js/lib/tracking/index.js",
        "./view.js": "/project/src/js/lib/buttons/menu/view.js",
        emitter: "emitter",
        "grammarly-editor": "grammarly-editor",
        react: "react",
        "react-dom": "react-dom",
        "styl/btn-hover-menu-new.styl": "/project/src/styl/btn-hover-menu-new.styl",
        "styl/textarea-btn-new.styl": "/project/src/styl/textarea-btn-new.styl"
    } ],
    "/project/src/js/lib/buttons/menu/tooltip.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function a(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), l = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, c = e("react"), u = r(c), d = e("../../dom"), f = e("styl/btn-hover-menu-new.styl"), p = r(f), m = function(e) {
            function t() {
                i(this, t), l(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments);
            }
            return a(t, e), s(t, [ {
                key: "render",
                value: function() {
                    var e, t = this.props.data || {}, n = this.props.measure, r = d.cs((e = {}, o(e, p["default"].tooltip, !0), 
                    o(e, p["default"].tooltip_visible, t.active && !n), o(e, p["default"].tooltip_hidden, !t.active && !n), 
                    o(e, p["default"]["tooltip_" + t.cls], !0), e)), i = void 0;
                    return t.active && !n && (i = {
                        right: 0
                    }), u["default"].createElement("div", {
                        style: i,
                        className: r,
                        refs: "tooltip",
                        dangerouslySetInnerHTML: {
                            __html: t.text
                        }
                    });
                }
            } ]), t;
        }(u["default"].Component);
        n["default"] = m, t.exports = n["default"];
    }, {
        "../../dom": "/project/src/js/lib/dom.js",
        react: "react",
        "styl/btn-hover-menu-new.styl": "/project/src/styl/btn-hover-menu-new.styl"
    } ],
    "/project/src/js/lib/buttons/menu/view.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function a(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), l = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, c = e("react"), u = r(c), d = e("react-dom"), f = r(d), p = e("./action"), m = r(p), g = e("./tooltip"), h = r(g), v = e("../../dom"), b = e("styl/btn-hover-menu-new.styl"), y = r(b), j = function(e) {
            function t() {
                i(this, t), l(Object.getPrototypeOf(t.prototype), "constructor", this).call(this), 
                this.onTooltip = this.onTooltip.bind(this), this.state = {
                    tooltip: {
                        active: !1,
                        text: "",
                        cls: ""
                    }
                };
            }
            return a(t, e), s(t, [ {
                key: "componentDidMount",
                value: function() {
                    this.tooltipMeasure = document.createElement("div"), this.tooltipMeasure.style.cssText = "visibility: hidden;top: -1000px;position: absolute", 
                    document.documentElement.appendChild(this.tooltipMeasure);
                }
            }, {
                key: "componentWillUnmount",
                value: function() {
                    document.documentElement.removeChild(this.tooltipMeasure);
                }
            }, {
                key: "onTooltip",
                value: function(e) {
                    var t = this, n = f["default"].render(u["default"].createElement(h["default"], {
                        data: e,
                        measure: !0
                    }), this.tooltipMeasure);
                    setTimeout(function() {
                        e.width = f["default"].findDOMNode(n).clientWidth, t.setState({
                            tooltip: e
                        });
                    }, 10);
                }
            }, {
                key: "getTooltipText",
                value: function(e) {
                    return e.enabled ? "Disable in this text field" : "Enable Grammarly here";
                }
            }, {
                key: "render",
                value: function() {
                    var e, t = this.props, n = t.state, r = n.critical, i = n.plus, a = v.cs((e = {}, 
                    o(e, y["default"].hoverMenu, !0), o(e, y["default"].initial, n.initial), o(e, y["default"].premium, n.premium), 
                    o(e, y["default"].anonymous, n.anonymous), o(e, y["default"].checking, n.checking), 
                    o(e, y["default"].disabled, 0 == n.enabled), o(e, y["default"].critical, r), o(e, y["default"].plus, i), 
                    o(e, y["default"].opened, t.opened), e)), s = n.anonymous ? "Log in to enable personalized<br/>checks and other features" : "Edit in Grammarly", l = n.premium ? "See advanced corrections" : "Upgrade to make advanced corrections", c = this.getTooltipText(n);
                    return u["default"].createElement("div", {
                        className: a,
                        style: t.style
                    }, u["default"].createElement("div", {
                        className: y["default"].panel
                    }, u["default"].createElement(h["default"], {
                        data: this.state.tooltip
                    }), u["default"].createElement(m["default"], {
                        data: {
                            type: "disable",
                            size: "small",
                            text: c,
                            click: t.disableClick,
                            onTooltip: this.onTooltip
                        }
                    }), u["default"].createElement("div", {
                        className: y["default"].line
                    }), i ? u["default"].createElement(m["default"], {
                        data: {
                            type: "premium",
                            size: "small",
                            text: l,
                            count: i,
                            click: t.click,
                            onTooltip: this.onTooltip
                        }
                    }) : null, u["default"].createElement(m["default"], {
                        data: {
                            type: "grammarly",
                            size: "small",
                            text: s,
                            click: t.click,
                            count: r,
                            onTooltip: this.onTooltip
                        }
                    })));
                }
            } ]), t;
        }(u["default"].Component);
        n["default"] = j, t.exports = n["default"];
    }, {
        "../../dom": "/project/src/js/lib/dom.js",
        "./action": "/project/src/js/lib/buttons/menu/action.js",
        "./tooltip": "/project/src/js/lib/buttons/menu/tooltip.js",
        react: "react",
        "react-dom": "react-dom",
        "styl/btn-hover-menu-new.styl": "/project/src/styl/btn-hover-menu-new.styl"
    } ],
    "/project/src/js/lib/buttons/path.js": [ function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var r = function(e) {
            function t(e, t) {
                return t.left >= e.left && t.top >= e.top ? "se" : t.left >= e.left && t.top <= e.top ? "ne" : t.left <= e.left && t.top <= e.top ? "nw" : t.left <= e.left && t.top >= e.top ? "sw" : void 0;
            }
            function n(e, t, n, r) {
                var o = r.left + r.width + s, i = r.left - s, a = r.top + r.height + s, l = r.top - s, c = n.left - s, u = n.left + n.width + s, d = n.top - s, f = n.top + n.height + s, p = u > o ? u : o;
                return "se" == e && t.x >= c && t.x <= p && t.y >= d && t.y <= a ? !0 : "ne" == e && t.x >= c && t.x <= p && t.y >= l && t.y <= f ? !0 : "nw" == e && t.x >= i && t.x <= u && t.y >= l && t.y <= f ? !0 : "sw" == e && t.x >= i && t.x <= u && t.y >= d && t.y <= a ? !0 : !1;
            }
            function r(e) {
                var t = e.getBoundingClientRect();
                return {
                    height: t.height,
                    width: t.width,
                    top: t.top,
                    left: t.left
                };
            }
            function o(e) {
                var o = r(i), s = r(a), l = t(o, s);
                return n(l, e, o, s);
            }
            var i = e.editorEl, a = e.btnEl, s = e.padding, l = void 0;
            return l = {
                within: o
            };
        };
        n["default"] = r, t.exports = n["default"];
    }, {} ],
    "/project/src/js/lib/buttons/pos/condition.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t(e) {
                return e.ghostarea ? e.ghostarea.gh.clone.firstChild : s;
            }
            function n(e) {
                var n = d(t(e)), r = e && e.getText().trim().length;
                if (n && r > 0) return p = r, "minimize";
                var o = p - r > c, i = !p || o || 0 == r;
                return i && "maximize";
            }
            function r(e, t) {
                return t && e != t ? t : void 0;
            }
            function o(e, t) {
                var o = e.minimize, i = e.maximize, a = e.editor, l = t ? "maximize" : "minimize";
                if (o || i) {
                    var c = f && f.forceMinimize && f.forceMinimize(s);
                    if (c || o && !i) return r(l, "minimize");
                    if (!a || !o && i) return r(l, "maximize");
                    var u = n(a);
                    return r(l, u);
                }
            }
            var i = e.btnEl, s = e.fieldEl, c = 200, u = i.ownerDocument, d = l["default"]({
                btnEl: i
            }), f = a["default"](u).getFixesForCurrentDomain(), p = void 0;
            return {
                get: o
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        }), n["default"] = o;
        var i = e("lib/sites"), a = r(i), s = e("./intersect"), l = r(s);
        t.exports = n["default"];
    }, {
        "./intersect": "/project/src/js/lib/buttons/pos/intersect.js",
        "lib/sites": "/project/src/js/lib/sites.js"
    } ],
    "/project/src/js/lib/buttons/pos/index.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            if (Array.isArray(e)) {
                for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
                return n;
            }
            return Array.from(e);
        }
        function i(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), s = e("lodash"), l = r(s), c = e("emitter"), u = r(c), d = e("lib/window-events"), f = r(d), p = e("lib/util"), m = e("lib/dom"), g = e("./position"), h = r(g), v = e("./condition"), b = r(v), y = function() {
            function e(t) {
                var n = this, r = t.btnEl, o = t.fieldEl, a = t.sourceEl, s = t.custom, c = t.isTextarea;
                i(this, e), this.state = {
                    minimize: !1,
                    maximize: !0,
                    editor: null,
                    show: !1
                }, this.max = !0, this.windowEvents = [ {
                    paste: function() {
                        return n.debouncedUpdate();
                    },
                    resize: function() {
                        return n.update();
                    },
                    keyup: function() {
                        m.isFocused(n.fieldEl) && n.debouncedUpdate();
                    }
                }, !0 ], this.checkResize = function() {
                    try {
                        n.position && n.position.resize() && n.debouncedUpdate();
                    } catch (e) {
                        console.error(e), p.cancelInterval(n.checkResize);
                    }
                }, this.debouncedUpdate = l["default"].debounce(function() {
                    return n.update();
                }, 50), this.update = function() {
                    if (n.state.show && n.position && (n.emit("update", {
                        visibility: "hidden"
                    }), n.emit("update", n.position.get(n.max)), n.state.editor)) {
                        var e = n.condition.get(n.state, n.max);
                        "undefined" != typeof e && (n.max = "maximize" == e, n.emit("change-state"), n.update());
                    }
                }, this.remove = function() {
                    n.listeners("off"), n.condition = null, n.position && n.position.remove(), n.position = null;
                }, Object.assign(this, u["default"]({
                    fieldEl: o
                })), this.position = h["default"]({
                    btnEl: r,
                    sourceEl: a,
                    custom: s,
                    isTextarea: c
                }), this.condition = b["default"]({
                    btnEl: r,
                    fieldEl: o,
                    custom: s
                }), this.listeners();
            }
            return a(e, [ {
                key: "set",
                value: function(e, t) {
                    this.state[e] = t, this.update();
                }
            }, {
                key: "listeners",
                value: function() {
                    var e, t = arguments.length <= 0 || void 0 === arguments[0] ? "on" : arguments[0];
                    f["default"][t].apply(f["default"], o(this.windowEvents));
                    var n = "on" == t ? m.on : m.off;
                    (e = this.fieldEl, n).call(e, "scroll", this.debouncedUpdate);
                    var r = "on" == t ? p.interval : p.cancelInterval;
                    r(this.checkResize, 200);
                }
            } ]), e;
        }();
        n["default"] = y, t.exports = n["default"];
    }, {
        "./condition": "/project/src/js/lib/buttons/pos/condition.js",
        "./position": "/project/src/js/lib/buttons/pos/position.js",
        emitter: "emitter",
        "lib/dom": "/project/src/js/lib/dom.js",
        "lib/util": "/project/src/js/lib/util.js",
        "lib/window-events": "/project/src/js/lib/window-events.js",
        lodash: "lodash"
    } ],
    "/project/src/js/lib/buttons/pos/intersect.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            function t(e, t, n) {
                var r = document.createElement("div");
                r.className = t, r.style.top = e.top + "px", r.style.left = e.left + "px", r.style.height = e.height + "px", 
                r.style.width = e.width + "px", r.style.position = "absolute", r.style.border = "1px dashed red", 
                r.style.zIndex = "1000000", r.style.pointerEvents = "none", n && (r.style.borderColor = n), 
                document.body.appendChild(r);
            }
            function n(e, t) {
                return e.left + e.width > t.left && (e.bottom > t.top && e.bottom < t.bottom || e.top < t.bottom && e.top > t.top);
            }
            function r(e, r) {
                var o = document.body.scrollTop;
                return i && Array.from(document.querySelectorAll(".gr-evade")).forEach(function(e) {
                    return e.parentElement.removeChild(e);
                }), e.map(function(e) {
                    return {
                        top: e.top + o,
                        bottom: e.bottom + o,
                        left: e.left,
                        width: e.width,
                        height: e.height
                    };
                }).some(function(e) {
                    return i && t(e, "gr-evade"), n(e, r);
                });
            }
            var o = e.btnEl, i = !1, a = 2;
            return function(e) {
                var t = arguments.length <= 1 || void 0 === arguments[1] ? 0 : arguments[1], n = o.getBoundingClientRect();
                if (n) {
                    n = {
                        top: n.top + document.body.scrollTop - a + t,
                        bottom: n.bottom + document.body.scrollTop + a + t,
                        left: n.left - a + t,
                        width: n.width,
                        height: n.height
                    };
                    var i = document.createRange();
                    i.selectNodeContents(e);
                    var s = e.clientWidth, l = Array.from(i.getClientRects()).filter(function(e) {
                        var t = e.width;
                        return s > t;
                    });
                    return r(l, n);
                }
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        }), n["default"] = r, t.exports = n["default"];
    }, {} ],
    "/project/src/js/lib/buttons/pos/position.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e) {
            function t() {
                var e = u.getPos(m), t = e.x != C.x || e.y != C.y;
                return k.clientWidth != m.clientWidth || k.clientHeight != m.clientHeight || t ? (C = e, 
                !0) : void 0;
            }
            function n() {
                if (!T) {
                    k = s({
                        offsetHeight: m.offsetHeight,
                        clientWidth: m.clientWidth,
                        clientHeight: m.clientHeight
                    }, d.compStyle(m, "border-bottom-width", "border-right-width", "resize", "padding-top", "padding-bottom", "overflowX", "overflow", "padding-right"), u.getAbsRect(m)), 
                    k.resize = [ "both", "horizontal", "vertical" ].includes(k.resize);
                    var e = u.getAbsRect(p), t = e.left, n = e.top;
                    k.left += O - t, k.top += P - n, b || "scroll" == k.overflowX || "scroll" == k.overflow || (k.height = Math.max(parseInt(k.height), k.offsetHeight));
                }
            }
            function r(e) {
                if (e) return 0;
                var t = parseInt(k["padding-right"]);
                return t > 0 ? -t / 2 + 2 : -5;
            }
            function i(e, t) {
                var n = e ? w : _;
                return e ? t ? (n - k.height) / 2 : -8 : 0;
            }
            function l() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? !0 : arguments[0], t = {
                    visibility: ""
                };
                if (h) return Object.assign(t, S.btnCustomStyles ? S.btnCustomStyles(e, m) : {});
                n();
                var s = !e && k.resize ? -10 : 0, l = k.clientHeight < y, c = i(e, l) + r(e), u = e || l ? 0 : -7, d = e ? w : _, f = S && S.btnDiff && S.btnDiff(m, e) || [ 0, 0 ], p = a(f, 2), g = p[0], v = p[1], b = k.left + k.width - parseInt(k["border-right-width"]) - d + c + g, j = k.top + k.height - parseInt(k["border-bottom-width"]) - d + c + u + v + s;
                return b == O && j == P ? t : (Object.assign(t, o({}, E, "translate(" + b + "px, " + j + "px)")), 
                T = !0, O = b, P = j, t);
            }
            function f() {
                d.off.call(p, j, M);
            }
            var p = e.btnEl, m = e.sourceEl, g = e.custom, h = void 0 === g ? !1 : g, v = e.isTextarea, b = void 0 === v ? !1 : v, y = 25, j = d.transitionEndEventName(), w = 22, _ = 8, x = p.ownerDocument, E = d.transformProp(x), k = void 0, C = u.getPos(m), O = 0, P = 0, T = !1, S = c["default"](x).getFixesForCurrentDomain(), M = function() {
                T = !1, n();
            };
            return d.on.call(p, j, M), n(), {
                get: l,
                resize: t,
                remove: f
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = function() {
            function e(e, t) {
                var n = [], r = !0, o = !1, i = void 0;
                try {
                    for (var a, s = e[Symbol.iterator](); !(r = (a = s.next()).done) && (n.push(a.value), 
                    !t || n.length !== t); r = !0) ;
                } catch (l) {
                    o = !0, i = l;
                } finally {
                    try {
                        !r && s["return"] && s["return"]();
                    } finally {
                        if (o) throw i;
                    }
                }
                return n;
            }
            return function(t, n) {
                if (Array.isArray(t)) return t;
                if (Symbol.iterator in Object(t)) return e(t, n);
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
            };
        }(), s = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        };
        n["default"] = i;
        var l = e("lib/sites"), c = r(l), u = e("lib/position"), d = e("lib/dom");
        t.exports = n["default"];
    }, {
        "lib/dom": "/project/src/js/lib/dom.js",
        "lib/position": "/project/src/js/lib/position.js",
        "lib/sites": "/project/src/js/lib/sites.js"
    } ],
    "/project/src/js/lib/buttons/state.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o() {
            function e(e, n) {
                var r = s.getDomain(), o = n && "IFRAME" == n.tagName, i = o ? n : e, a = e.ownerDocument, l = {
                    domain: r,
                    name: i.getAttribute("name") || "",
                    id: i.getAttribute("id") || ""
                }, u = r + (l.id ? ":" + l.id : "") + (l.name ? ":" + l.name : ""), d = c["default"](a).getFixesForCurrentDomain(), f = d && d.fieldStateForDomain && d.fieldStateForDomain(e);
                return f ? r + ":" + f : (l.name || l.id || (l.xpath = t(i), u = r + ":" + l.xpath), 
                o && (u += ":" + n.ownerDocument.location.host || ""), u);
            }
            function t(e, t) {
                return e && e.id && !t ? '//*[@id="' + e.id + '"]' : n(e);
            }
            function n(e) {
                for (var t = []; e && 1 == e.nodeType; e = e.parentNode) {
                    for (var n = 0, r = e.previousSibling; r; r = r.previousSibling) r.nodeType != Node.DOCUMENT_TYPE_NODE && r.nodeName == e.nodeName && ++n;
                    var o = e.nodeName.toLowerCase(), i = n ? "[" + (n + 1) + "]" : "";
                    t.splice(0, 0, o + i);
                }
                return t.length ? "/" + t.join("/") : null;
            }
            function r(t, n) {
                var r, o;
                return regeneratorRuntime.async(function(i) {
                    for (;;) switch (i.prev = i.next) {
                      case 0:
                        return i.next = 2, regeneratorRuntime.awrap(a["default"].get("disabled-fields"));

                      case 2:
                        if (i.t0 = i.sent, i.t0) {
                            i.next = 5;
                            break;
                        }
                        i.t0 = {};

                      case 5:
                        return r = i.t0, o = e(t, n), i.abrupt("return", r[o]);

                      case 8:
                      case "end":
                        return i.stop();
                    }
                }, null, this);
            }
            function o(t, n, r) {
                var o, i;
                return regeneratorRuntime.async(function(s) {
                    for (;;) switch (s.prev = s.next) {
                      case 0:
                        return s.next = 2, regeneratorRuntime.awrap(a["default"].get("disabled-fields"));

                      case 2:
                        if (s.t0 = s.sent, s.t0) {
                            s.next = 5;
                            break;
                        }
                        s.t0 = {};

                      case 5:
                        o = s.t0, i = e(t, n), o[i] = r, a["default"].set("disabled-fields", o);

                      case 9:
                      case "end":
                        return s.stop();
                    }
                }, null, this);
            }
            return {
                getDomainSelector: e,
                isFieldDisabled: r,
                changeFieldState: o
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("../prefs"), a = r(i), s = e("../location"), l = e("../sites"), c = r(l);
        n["default"] = o(), t.exports = n["default"];
    }, {
        "../location": "/project/src/js/lib/location.js",
        "../prefs": "/project/src/js/lib/prefs.js",
        "../sites": "/project/src/js/lib/sites.js"
    } ],
    "/project/src/js/lib/buttons/view.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function a(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), l = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, c = e("lodash"), u = r(c), d = e("react"), f = r(d), p = e("../dom"), m = e("../util"), g = e("styl/textarea-btn-new.styl"), h = r(g), v = function(e) {
            function t() {
                i(this, t), l(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments);
            }
            return a(t, e), s(t, [ {
                key: "render",
                value: function() {
                    var e, t = this.props.state, n = t.anonymous, r = this.props.onViewClick, i = t.errors.critical, a = i > 0 && !t.checking, s = !t.enabled, l = t.offline, c = !s && !l && t.isFieldEmpty && n, d = u["default"]([ h["default"].textarea_btn ]).push(p.cs((e = {}, 
                    o(e, h["default"].show, t.show), o(e, h["default"].minimized, t.minimized), o(e, h["default"].minimize_transition, t.wasMinimized), 
                    o(e, h["default"].errors, a), o(e, h["default"].has_errors, i > 0), o(e, h["default"].errors_100, i > 99), 
                    o(e, h["default"].offline, l), o(e, h["default"].checking, t.checking && !l && !s), 
                    o(e, h["default"].disabled, s), o(e, h["default"].plus_only, !a && t.errors.plus > 0), 
                    o(e, h["default"].anonymous, n), o(e, h["default"].hovered, t.hovered), o(e, h["default"].field_hovered, t.isFieldHovered), 
                    o(e, h["default"].not_focused, !t.fieldWasFocused), e))).join(" "), g = p.camelizeAttrs(this.props.inlineStyle), v = a && i ? i : " ", b = "Found " + i + " " + m.declension(i, [ "error", "errors", "errors" ]) + " in text", y = "Not signed in";
                    return i || (b = "Protected by Grammarly"), f["default"].createElement("div", {
                        onClick: r,
                        style: g,
                        className: d
                    }, f["default"].createElement("div", {
                        className: h["default"].transform_wrap
                    }, f["default"].createElement("div", {
                        title: b,
                        className: h["default"].status
                    }, v)), c ? f["default"].createElement("span", {
                        className: h["default"].btn_text
                    }, y) : null);
                }
            } ]), t;
        }(f["default"].Component);
        n["default"] = v, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../util": "/project/src/js/lib/util.js",
        lodash: "lodash",
        react: "react",
        "styl/textarea-btn-new.styl": "/project/src/styl/textarea-btn-new.styl"
    } ],
    "/project/src/js/lib/chrome-permissions.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("./message"), i = r(o), a = e("./util"), s = e("./location"), l = e("./dom"), c = e("react"), u = r(c), d = e("./tracking/index"), f = e("./user"), p = r(f), m = "gr_-permission-explanation", g = function(e) {
            return m + "_" + e;
        }, h = function(e) {
            function t(t) {
                var n = t.replace;
                t.replace = function() {
                    for (var o = arguments.length, i = Array(o), a = 0; o > a; a++) i[a] = arguments[a];
                    f() || n.apply(void 0, i), r(function(r) {
                        if (r) {
                            var o = e.getText(!0), a = t.value;
                            n.apply(void 0, i), setTimeout(function() {
                                var n = e.getText(!0), r = n.substring(t.s, t.e);
                                r == t.value ? (d.call("felog.info", "clipboard_replacement_success"), d.call("mixpanel.track", "Ext:Clipboard_Preplacement_success", {
                                    domain: s.getDomain()
                                })) : d.call("mixpanel.track", "Ext:Clipboard_Replacement_error", {
                                    expected: t.value,
                                    domain: s.getDomain(),
                                    actual: r
                                });
                                var i = Math.abs(t.value.length - a.length), l = Math.abs(n.length - o.length);
                                l > i && d.call("mixpanel.track", "Ext:Clipboard_Replacement_error_text_length", {
                                    diff: l,
                                    domain: s.getDomain()
                                });
                            }, 200);
                        }
                    });
                };
            }
            function n() {
                f() && i["default"].emitBackground("contains-chrome-permissions", [ "clipboardRead" ], function(n) {
                    if (c = n, !n) {
                        e.on("matchExtend", function(e) {
                            return f() && t(e);
                        });
                        var o = e.showDialog;
                        e.showDialog = function() {
                            return !f() || p["default"].anonymous ? o() : void r(function(e) {
                                e && (o(), d.call("felog.info", "clipboard_popup_shown"), d.call("mixpanel.track", "Ext:Clipboard_Popup_shown", {
                                    domain: s.getDomain()
                                }));
                            });
                        };
                    }
                });
            }
            function r(e) {
                f() && (o(), d.call("felog.info", "clipboard_permission_shown"), d.call("mixpanel.track", "Ext:Clipboard_Permission_Shown", {
                    domain: s.getDomain()
                }), i["default"].emitBackground("ask-chrome-permissions", [ "clipboardRead" ], function(t) {
                    c = t, m.remove(), t ? (d.call("felog.info", "clipboard_permission_allow"), d.call("mixpanel.track", "Ext:Clipboard_Permission_Allow", {
                        domain: s.getDomain()
                    })) : (d.call("felog.info", "clipboard_permission_deny"), d.call("mixpanel.track", "Ext:Clipboard_Permission_Deny", {
                        domain: s.getDomain()
                    })), e(t);
                }));
            }
            function o() {
                m = l.renderReactWithParent(u["default"].createElement(v, null), e.el.ownerDocument.documentElement, a.guid());
            }
            var c = !1, f = function() {
                return e.isHtmlGhost && a.isChrome() && !c;
            }, m = void 0;
            return {
                checkClipboard: n
            };
        };
        n["default"] = h;
        var v = u["default"].createClass({
            displayName: "Explanation",
            render: function() {
                return u["default"].createElement("div", {
                    className: m
                }, u["default"].createElement("div", {
                    className: g("arr")
                }), u["default"].createElement("div", {
                    className: g("message")
                }, u["default"].createElement("div", {
                    className: g("message-title")
                }, "To fix mistakes, Grammarly needs", u["default"].createElement("br", null), " your permission to access text fields."), u["default"].createElement("br", null), "This site currently blocks all browser extensions from", u["default"].createElement("br", null), " changes to its text fields via copy and paste.", u["default"].createElement("br", null), "Please click ", u["default"].createElement("span", {
                    className: g("allow")
                }, "Allow"), " to give your permission."));
            }
        });
        t.exports = n["default"];
    }, {
        "./dom": "/project/src/js/lib/dom.js",
        "./location": "/project/src/js/lib/location.js",
        "./message": "/project/src/js/lib/message.js",
        "./tracking/index": "/project/src/js/lib/tracking/index.js",
        "./user": "/project/src/js/lib/user.js",
        "./util": "/project/src/js/lib/util.js",
        react: "react"
    } ],
    "/project/src/js/lib/client-script.js": [ function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var r = e("dompurify"), o = function() {
            function e(e) {
                function n(e) {
                    function t(e) {
                        if (e.parentNode) if (e.childNodes.length > 1) {
                            for (var t = document.createDocumentFragment(); e.childNodes.length > 0; ) {
                                var n = e.childNodes[0];
                                t.appendChild(n);
                            }
                            e.parentNode.replaceChild(t, e);
                        } else e.firstChild ? e.parentNode.replaceChild(e.firstChild, e) : e.parentNode.removeChild(e);
                    }
                    function n(e) {
                        if (e) try {
                            for (var n = e.querySelectorAll(".gr_"), r = n.length, o = 0; r > o; o++) t(n[o]);
                        } catch (i) {}
                    }
                    function r(e) {
                        try {
                            Object.defineProperty(e, "innerHTML", {
                                get: function() {
                                    try {
                                        var t = e.ownerDocument.createRange();
                                        t.selectNodeContents(e);
                                        var r = t.cloneContents(), o = document.createElement("div");
                                        return o.appendChild(r), n(o), o.innerHTML;
                                    } catch (i) {}
                                },
                                set: function(t) {
                                    try {
                                        var n = e.ownerDocument.createRange();
                                        n.selectNodeContents(e), n.deleteContents();
                                        var r = n.createContextualFragment(t);
                                        e.appendChild(r);
                                    } catch (o) {}
                                }
                            });
                        } catch (t) {}
                    }
                    if (e) {
                        var o = e.cloneNode;
                        e.cloneNode = function(t) {
                            var i = o.call(e, t);
                            if (e.classList.contains("mceContentBody")) i.innerHTML = e.innerHTML, n(i); else try {
                                r(i);
                            } catch (a) {}
                            return i;
                        }, r(e);
                    }
                }
                if ("TEXTAREA" != e.tagName) try {
                    var o = e.ownerDocument, i = e.getAttribute("data-gramm_id");
                    i = r.sanitize(i);
                    var a = '[data-gramm_id="' + i + '"]', s = "document.querySelector('" + a + "')";
                    t(o, [ n ], [ s ]);
                } catch (l) {
                    console.log("error rewrite " + l);
                }
            }
            function t(e, t, n) {
                var r = e.createElement("script");
                n = n || [];
                var o = t.join(" "), i = (t[t.length - 1].name, n.join(","));
                r.innerHTML = "(function(){(" + o + ")(" + i + ") })()", e.head.appendChild(r);
            }
            return {
                rewriteInnerHTML: e,
                addScript: t
            };
        }();
        n["default"] = o, t.exports = n["default"];
    }, {
        dompurify: "dompurify"
    } ],
    "/project/src/js/lib/config.js": [ function(e, t, n) {
        (function(r) {
            "use strict";
            function o(e) {
                return e && e.__esModule ? e : {
                    "default": e
                };
            }
            function i() {
                return c["default"] ? c["default"].config.modules.parameters.version : void 0;
            }
            function a() {
                return c["default"] ? c["default"].config.modules.parameters.updateTime : void 0;
            }
            function s() {
                return c["default"] ? c["default"].config.uuid : void 0;
            }
            Object.defineProperty(n, "__esModule", {
                value: !0
            }), e("babel/polyfill");
            var l = "undefined" != typeof window ? window.forge : "undefined" != typeof r ? r.forge : null, c = o(l), u = e("spark-md5"), d = o(u), f = e("./prefs"), p = o(f), m = {
                key: "b37252e300204b00ad697fe1d3b979e1",
                project: "15",
                pingTimeout: 6e5
            }, g = {
                url: "https://gnar.grammarly.com",
                qaUrl: "https://qagnar.grammarly.com"
            }, h = "c10dd64c87f70ef5563a63c368797e8c", v = {
                qaKey: "7a5c95b5cba1b225d00cc3ba1c410c78",
                key: h,
                cookie: "mp_" + h + "_mixpanel"
            }, b = {
                URL: "https://stats-public.grammarly.io/",
                PREFIX: "grammarly.ui"
            }, y = "https://data.grammarly.com", j = "https://app.grammarly.com", w = "https://auth.grammarly.com/user", _ = "https://www.grammarly.com/after_install_page", x = {
                app: j,
                capi: "wss://capi.grammarly.com/freews",
                dapiMimic: y + "/api/mimic",
                editor: j + "/popup2",
                dictionary: "https://capi.grammarly.com/api/defs",
                upgrade: "https://www.grammarly.com/upgrade",
                authUser: w,
                authSettings: w + "/settings",
                authGroup: w + "/group",
                authPing: w + "/sync",
                authCreateAnonymous: w + "/anonymous",
                authCreatePage: "https://auth.grammarly.com/redirect-anonymous?location=" + _,
                docs: j + "/docs",
                docsApi: "https://dox.grammarly.com/documents",
                offline: "https://ed.grammarly.com/download/firefox/update.json",
                welcomeC: "https://www.grammarly.com/extension-success",
                uninstall: "https://www.grammarly.com/extension-uninstall",
                userOrAnonymous: "https://auth.grammarly.com/user/oranonymous",
                authSignin: "https://auth.grammarly.com/login",
                authSignup: "https://auth.grammarly.com/signup",
                signin: "https://www.grammarly.com/signin",
                signup: "https://www.grammarly.com/signup",
                welcomeFandS: _,
                raven: "felog.grammarly.io",
                referral: "https://www.grammarly.com/referral",
                pageConfigUrl: "https://d3cv4a9a9wh0bt.cloudfront.net/browserplugin/config.json",
                resetPassword: "https://www.grammarly.com/resetpassword",
                terms: "https://www.grammarly.com/terms",
                policy: "https://www.grammarly.com/privacy-policy"
            }, E = Object.keys(x), k = function(e) {
                return "URLS." + e;
            };
            p["default"].get(E.map(k), function(e) {
                return E.filter(function(t) {
                    return e[k(t)];
                }).forEach(function(t) {
                    return x[t] = e[k(t)];
                });
            });
            var C = [ "Pop-up editor now opens immediately", "You may disable definitions on all sites" ], O = [ "id", "email", "subscriptionFree", "firstName", "anonymous", "type", "premium", "settings", "registrationDate", "mimic", "groups", "extensionInstallDate", "fixed_errors", "ext2" ];
            n["default"] = {
                news: C,
                newsId: C.length && d["default"].hash(C.join("\n")),
                getUpdateTime: a,
                URLS: x,
                FELOG: m,
                STATSC: b,
                DAPI: y,
                MIXPANEL: v,
                GNAR: g,
                getVersion: i,
                getUuid: s,
                isTest: !c["default"],
                nextVerClass: "gr_ver_2",
                restrictedAttrs: [ "data-gramm_editor", "data-gramm", "data-gramm_id", "gramm_editor", [ "aria-label", "Search Facebook" ] ],
                restrictedParentAttrs: "[data-reactid]",
                userFields: O,
                ext2groups: [ "001_gbutton_show", "002_gbutton_show", "003_gbutton_show" ],
                externalEvents: [ "changed-user", "changed-plan", "cleanup", "editor-fix" ],
                development: "127.0.0.1:3117" == document.location.host
            }, t.exports = n["default"];
        }).call(this, "undefined" != typeof window ? window : {});
    }, {
        "./prefs": "/project/src/js/lib/prefs.js",
        "babel/polyfill": "babel/polyfill",
        "spark-md5": "spark-md5"
    } ],
    "/project/src/js/lib/console.js": [ function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var r = e("./util"), o = void 0;
        o = r.isBgOrPopup() ? window.console : window.gdebug = function() {
            var e = console;
            return function(t) {
                var n = arguments.length <= 1 || void 0 === arguments[1] ? !0 : arguments[1];
                t === !1 ? (window.console = {}, window.console.log = r._f, n ? (window.console.info = r._f, 
                window.console.warn = r._f, window.console.error = r._f) : (window.console.info = e.info, 
                window.console.warn = e.warn, window.console.error = e.error)) : window.console = e;
            };
        }(), n["default"] = o, t.exports = n["default"];
    }, {
        "./util": "/project/src/js/lib/util.js"
    } ],
    "/project/src/js/lib/dictionary-card.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i() {
            function e(e) {
                y.innerHTML = h["default"].sanitize(e);
                var t = y.querySelector("span.qualifier");
                return t ? (t.innerHTML = t.innerHTML.replace("(", "").replace(")", ""), y.innerHTML) : e;
            }
            function t(e) {
                return e.replace(/&lt;(sup|sub)&gt;(.*?)&lt;(\/sup|\/sub)&gt;/, "<$1>$2<$3>").replace(/&amp;(?=\w{1,8};)/, "&");
            }
            function n(n, o) {
                var i = {
                    ownerDocument: f,
                    getBoundingClientRect: function() {
                        return o.pos;
                    },
                    getClientRects: function() {
                        return [ o.pos ];
                    }
                };
                if (T = n, T.defs && T.defs.length) {
                    var a = c["default"].getAbsRect(i);
                    T.title = o.el.toString(), T.defs = T.defs.splice(0, 3).map(e).map(t), O = r(!1), 
                    P = m.findDOMNode(O.component), S = c["default"].posToRect(P, a), r();
                } else E.enable(), E.show({
                    posEl: o.el,
                    text: "No definition found"
                });
                b["default"].on(M, !0), j["default"].start(_), w.call("felog.event", "dictionary_open");
            }
            function r() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? !0 : arguments[0];
                return s["default"].renderReactWithParent(p["default"].createElement(C, {
                    pos: S,
                    data: T,
                    visible: e,
                    className: v
                }), f.documentElement, _, "grammarly-card");
            }
            function o() {
                O && O.remove(), b["default"].off(M, !0), A.emit("hide"), E.disable(), E.hide(), 
                O = null, w.call("felog.info", "dictionary_close", {
                    active_time: j["default"].stop(_)
                });
            }
            function i(e) {
                27 == e.keyCode && o();
            }
            function a(e) {
                var t = s["default"].inEl(e.target, P);
                (!t || t && s["default"].hasClass(e.target, k("btn-close"))) && o();
            }
            var l = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0], u = l.doc, f = void 0 === u ? document : u, g = l.domCls, v = void 0 === g ? "" : g, y = f.createElement("div"), _ = Symbol("DictionaryCard"), E = x["default"]({
                cls: "gr-notfound-tooltip",
                enabled: !1,
                doc: f
            }), O = void 0, P = void 0, T = void 0, S = void 0, M = {
                click: a,
                keydown: i,
                scroll: o,
                resize: o
            }, A = d["default"]({
                show: n,
                hide: o,
                unescapeSuperscript: t
            });
            return A;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = e("./dom"), s = r(a), l = e("./position"), c = r(l), u = e("emitter"), d = r(u), f = e("react"), p = r(f), m = e("react-dom"), g = e("dompurify"), h = r(g), v = e("./window-events"), b = r(v), y = e("./timers"), j = r(y), w = e("./tracking/index"), _ = e("./elements/tooltip"), x = r(_), E = "gr-dictionary-card", k = function(e) {
            return E + "_" + e;
        }, C = p["default"].createClass({
            displayName: "DictionaryCard",
            getDefaultProps: function() {
                return {
                    pos: {
                        rect: {
                            top: 0,
                            left: 0,
                            width: 0
                        },
                        sourceRect: {
                            width: 0
                        },
                        delta: {
                            right: 0
                        },
                        className: "",
                        visible: !1
                    }
                };
            },
            getTriangleMargin: function() {
                var e = this.props.pos.sourceRect.width / 2;
                return this.props.pos.delta.right > 0 ? e : -this.props.pos.delta.right + e;
            },
            renderContent: function() {
                var e = this.props.data;
                return e.defs.map(function(t, n) {
                    var r, i = t.replace(/^([:,]\s)/, "");
                    i = i[0].toUpperCase() + i.substring(1, i.length);
                    var a = s["default"].cs((r = {}, o(r, k("item-single"), 1 == e.defs.length), o(r, k("item"), !0), 
                    r));
                    return p["default"].createElement("div", {
                        key: n,
                        className: a,
                        dangerouslySetInnerHTML: {
                            __html: h["default"].sanitize(i)
                        }
                    });
                });
            },
            renderFooterLink: function() {
                var e = this.props.data;
                if (e.url) {
                    var t = function() {
                        var t = "wiki" == e.origin ? "More on Wikipedia" : "More on Grammarly Words";
                        return {
                            v: p["default"].createElement("a", {
                                className: k("link"),
                                href: encodeURI(e.url),
                                onClick: function() {
                                    return w.call("felog.info", "dictionary_goto", {
                                        type: t
                                    });
                                },
                                target: "_blank"
                            }, t)
                        };
                    }();
                    if ("object" == typeof t) return t.v;
                }
            },
            render: function() {
                var e, t = {}, n = this.props.pos, r = s["default"].cs((e = {}, o(e, E, !0), o(e, k("empty"), 0 == this.props.data.defs.length), 
                o(e, k("flip"), n.rect.flip), o(e, this.props.className, this.props.className), 
                e)), i = {
                    marginLeft: this.getTriangleMargin()
                };
                return t.top = n.rect.top, t.left = n.rect.left, t.visibility = this.props.visible ? "" : "hidden", 
                p["default"].createElement("div", {
                    style: t,
                    className: r
                }, p["default"].createElement("span", {
                    style: i,
                    className: k("triangle")
                }), p["default"].createElement("div", {
                    className: k("title")
                }, this.props.data.title), p["default"].createElement("div", {
                    className: k("content")
                }, this.renderContent()), p["default"].createElement("div", {
                    className: k("footer")
                }, this.renderFooterLink(), p["default"].createElement("div", {
                    className: k("btn-close")
                }, "Close")));
            }
        });
        i.component = C, n["default"] = i, t.exports = n["default"];
    }, {
        "./dom": "/project/src/js/lib/dom.js",
        "./elements/tooltip": "/project/src/js/lib/elements/tooltip.js",
        "./position": "/project/src/js/lib/position.js",
        "./timers": "/project/src/js/lib/timers.js",
        "./tracking/index": "/project/src/js/lib/tracking/index.js",
        "./window-events": "/project/src/js/lib/window-events.js",
        dompurify: "dompurify",
        emitter: "emitter",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/dictionary.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, i = e("emitter"), a = r(i), s = e("./config"), l = e("./dom"), c = e("./selection"), u = r(c), d = e("./selection-animator"), f = r(d), p = e("./dictionary-card"), m = r(p), g = e("./request"), h = e("./prefs"), v = r(h), b = e("./user"), y = r(b);
        n["default"] = function(e) {
            function t() {
                c.release(), c = null, d = null, i = null;
            }
            function n(e) {
                var t, n, a, c;
                return regeneratorRuntime.async(function(u) {
                    for (;;) switch (u.prev = u.next) {
                      case 0:
                        return t = e.el.startContainer ? e.el.startContainer.parentNode : e.el, u.next = 3, 
                        regeneratorRuntime.awrap(v["default"].get("cardInspection"));

                      case 3:
                        if (n = u.sent, a = l.matchesSelector(t, ".gr-grammar-card, .gr-grammar-card *, .gr-dictionary-card, .gr-dictionary-card *"), 
                        !a || n) {
                            u.next = 7;
                            break;
                        }
                        return u.abrupt("return");

                      case 7:
                        return p = "gr-selection-anim-dict" + (y["default"].ext2 ? " " + s.nextVerClass : ""), 
                        f["default"].animate(e.el, r, p), i = e, u.prev = 10, u.next = 13, regeneratorRuntime.awrap(g.fetch(s.URLS.dictionary, {
                            data: o({}, e.data)
                        }));

                      case 13:
                        if (c = u.sent, i == e) {
                            u.next = 16;
                            break;
                        }
                        return u.abrupt("return");

                      case 16:
                        f["default"].complete(), d.show(c, e), a && f["default"].remove(), u.next = 25;
                        break;

                      case 21:
                        u.prev = 21, u.t0 = u["catch"](10), f["default"].remove(), console.log("request failed", u.t0);

                      case 25:
                      case "end":
                        return u.stop();
                    }
                }, null, this, [ [ 10, 21 ] ]);
            }
            var r = e.doc, i = void 0, c = u["default"](r), d = m["default"]({
                doc: r
            }), p = void 0;
            return c.on("select", n), c.on("unselect", f["default"].remove), d.on("hide", f["default"].remove), 
            a["default"]({
                clear: t
            });
        }, t.exports = n["default"];
    }, {
        "./config": "/project/src/js/lib/config.js",
        "./dictionary-card": "/project/src/js/lib/dictionary-card.js",
        "./dom": "/project/src/js/lib/dom.js",
        "./prefs": "/project/src/js/lib/prefs.js",
        "./request": "/project/src/js/lib/request.js",
        "./selection": "/project/src/js/lib/selection.js",
        "./selection-animator": "/project/src/js/lib/selection-animator.js",
        "./user": "/project/src/js/lib/user.js",
        emitter: "emitter"
    } ],
    "/project/src/js/lib/dom.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t) {
            var n = (t || document).createElement("div");
            return n.innerHTML = e.trim(), n.firstElementChild;
        }
        function a(e, t, n) {
            var r = arguments.length <= 3 || void 0 === arguments[3] ? "div" : arguments[3], o = t[n] || {};
            t[n] = o, o.el || (o.el = t.ownerDocument.createElement(r), t.appendChild(o.el));
            var i = re["default"].render(e, o.el);
            return o.remove || (o.remove = function() {
                delete t[n], t.removeChild(o.el), re["default"].unmountComponentAtNode(o.el);
            }), {
                component: i,
                remove: o.remove,
                el: o.el
            };
        }
        function s(e, t) {
            for (var n = arguments.length <= 2 || void 0 === arguments[2] ? 1e3 : arguments[2], r = 0; e.parentNode && n > r; ) {
                if ("string" != typeof t && t == e) return !0;
                if (e.id == t || e == t) return !0;
                e = e.parentNode;
            }
            return !1;
        }
        function l(e, t) {
            return e && void 0 != e.className ? e.classList.contains(t) : !1;
        }
        function c(e, t) {
            return e && e.classList ? e.classList.remove(t) : void 0;
        }
        function u(e, t) {
            if (e) {
                if (-1 == t.indexOf(" ")) return e.classList.add(t);
                t = t.split(" ");
                for (var n = 0; n < t.length; n++) e.classList.add(t[n]);
            }
        }
        function d(e, t, n) {
            t ? u(e, n) : c(e, n);
        }
        function f(e, t) {
            for (;e = e.parentNode; ) if (g(e, t)) return e;
            return !1;
        }
        function p(e) {
            for (;e = e.parentNode; ) if (m(e)) return e;
            return !1;
        }
        function m(e) {
            return "true" == e.contentEditable || "plaintext-only" == e.contentEditable;
        }
        function g(e, t) {
            return e.matches ? e.matches(t) : e.matchesSelector ? e.matchesSelector(t) : e.webkitMatchesSelector ? e.webkitMatchesSelector(t) : e.mozMatchesSelector ? e.mozMatchesSelector(t) : window.$ && window.$.is ? window.$(e).is(t) : void 0;
        }
        function h(e) {
            return oe.isFF() ? e.ownerDocument.activeElement == e : document.activeElement && "IFRAME" == document.activeElement.tagName ? e === e.ownerDocument.activeElement : document.activeElement && "BODY" == document.activeElement.tagName ? e === document.activeElement : e === document.activeElement;
        }
        function v(e, t, n, r) {
            var o = arguments.length <= 4 || void 0 === arguments[4] ? !1 : arguments[4];
            if (e) {
                if (ee["default"].isObject(t)) return ee["default"].each(t, function(t, n) {
                    v(e, n, t, r);
                });
                var i = r ? "removeEventListener" : "addEventListener", a = e[ie] || [];
                return e[ie] = a, r ? e[ie] = a.filter(function(e) {
                    return !(e.event == t && e.cb == n);
                }) : a.push({
                    event: t,
                    cb: n
                }), e[i](t, n, o), {
                    el: e,
                    event: t,
                    cb: n,
                    bubble: o
                };
            }
        }
        function b(e, t, n, r) {
            return !t && e[ie] ? e[ie].each(function(t) {
                return b(e, t.event, t.cb, t.bubble);
            }) : void v(e, t, n, !0, r);
        }
        function y() {
            for (var e = this, t = arguments.length, n = Array(t), r = 0; t > r; r++) n[r] = arguments[r];
            return this.addEventListener.apply(this, n), {
                off: function() {
                    return j.call.apply(j, [ e ].concat(n));
                }
            };
        }
        function j() {
            this.removeEventListener.apply(this, arguments);
        }
        function w(e, t) {
            var n = this, r = function o(r) {
                t(r), j.call(n, e, o);
            };
            y.call(this, e, r);
        }
        function _(e) {
            var t = getComputedStyle(e, null), n = "none" != t.getPropertyValue("display") && "hidden" != t.getPropertyValue("visibility") && e.clientHeight > 0;
            return n;
        }
        function x(e) {
            var t = arguments.length <= 1 || void 0 === arguments[1] ? function(e) {
                return e;
            } : arguments[1];
            return ee["default"].keys(e).filter(function(t) {
                return e[t];
            }).map(function(e) {
                return t(e);
            }).join(" ");
        }
        function E(e, t) {
            return "number" != typeof t || ae[O(e)] ? t : t + "px";
        }
        function k(e) {
            return e.replace(/-+(.)?/g, function(e, t) {
                return t ? t.toUpperCase() : "";
            });
        }
        function C(e) {
            return ee["default"].transform(e, function(e, t, n) {
                return e[k(n)] = t;
            });
        }
        function O(e) {
            return e.replace(/::/g, "/").replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2").replace(/([a-z\d])([A-Z])/g, "$1_$2").replace(/_/g, "-").toLowerCase();
        }
        function P(e, t, n) {
            if (arguments.length < 3) {
                var r = function() {
                    var n = e;
                    if (!n) return {
                        v: void 0
                    };
                    var r = getComputedStyle(n, "");
                    if ("string" == typeof t) return {
                        v: n.style[k(t)] || r.getPropertyValue(t)
                    };
                    if (ee["default"].isArray(t)) {
                        var o = function() {
                            var e = {};
                            return ee["default"].each(t, function(t, o) {
                                e[k(t)] = n.style[k(t)] || r.getPropertyValue(t);
                            }), {
                                v: {
                                    v: e
                                }
                            };
                        }();
                        if ("object" == typeof o) return o.v;
                    }
                }();
                if ("object" == typeof r) return r.v;
            }
            var o = "";
            if (ee["default"].isString(t)) n || 0 === n ? o = O(t) + ":" + E(t, n) : e.style.removeProperty(O(t)); else for (var i in t) t[i] || 0 === t[i] ? o += O(i) + ":" + E(i, t[i]) + ";" : e.style.removeProperty(O(i));
            return e.style.cssText += ";" + o;
        }
        function T(e, t) {
            for (;e = e.parentNode; ) if (e.tagName == t) return e;
            return !1;
        }
        function S(e, t, n) {
            for (;e = e.parentNode; ) if (e.dataset && e.dataset[t] && e.dataset[t] == n) return e;
        }
        function M(e, t) {
            return l(e, t) ? e : A(e, t);
        }
        function A(e, t) {
            for (;e = e.parentNode; ) if (l(e, t)) return e;
            return !1;
        }
        function N(e, t) {
            if (!e) return !1;
            for (;e.parentNode; ) {
                if (l(e, t)) return e;
                e = e.parentNode;
            }
            return !1;
        }
        function D() {
            var e, t = arguments.length <= 0 || void 0 === arguments[0] ? 1 : arguments[0];
            return t ? (e = this.parentNode, D).call(e, --t) : this;
        }
        function R(e, t) {
            if (!e) return !1;
            for (;e.parentNode; ) {
                if (t == e.parentNode) return e;
                e = e.parentNode;
            }
            return !1;
        }
        function I(e, t) {
            var n = t.parentNode;
            n.lastChild == t ? n.appendChild(e) : n.insertBefore(e, t.nextSibling);
        }
        function B(e, t) {
            t.parentNode.insertBefore(e, t);
        }
        function L(e, t) {
            for (t = t || document; e; ) {
                if (e == t) return !0;
                e = e.parentNode;
            }
            return !1;
        }
        function F(e) {
            var t = void 0, n = {
                ctrl: !1,
                meta: !1,
                shift: !1,
                alt: !1
            };
            e = ee["default"].extend(n, e);
            try {
                t = e.el.ownerDocument.createEvent("KeyEvents"), t.initKeyEvent(e.type, !0, !0, e.el.ownerDocument.defaultView, e.ctrl, e.alt, e.shift, e.meta, e.keyCode, e.keyCode);
            } catch (r) {
                t = e.el.ownerDocument.createEvent("UIEvents"), t.initUIEvent(e.name, !0, !0, window, 1), 
                t.keyCode = e.keyCode, t.which = e.keyCode, t.charCode = e.keyCode, t.ctrlKey = e.ctrl, 
                t.altKey = e.alt, t.shiftKey = e.shift, t.metaKey = e.metaKey;
            }
            e.el.dispatchEvent(t);
        }
        function U(e) {
            return "undefined" != typeof e.hidden ? e.hidden : "undefined" != typeof e.mozHidden ? e.mozHidden : "undefined" != typeof e.webkitHidden ? e.webkitHidden : "undefined" != typeof e.msHidden ? e.msHidden : !1;
        }
        function z(e) {
            return "undefined" != typeof e.hidden ? "visibilitychange" : "undefined" != typeof e.mozHidden ? "mozvisibilitychange" : "undefined" != typeof e.webkitHidden ? "webkitvisibilitychange" : "undefined" != typeof e.msHidden ? "msvisibilitychange" : !1;
        }
        function H() {
            var e = arguments.length <= 0 || void 0 === arguments[0] ? document : arguments[0];
            return "undefined" != typeof e.body.style.transform ? "transform" : "undefined" != typeof e.body.style.WebkitTransform ? "WebkitTransform" : "undefined" != typeof e.body.style.MozTransform ? "MozTransform" : void 0;
        }
        function V(e) {
            if (e) {
                var t = e.ownerDocument;
                if (t) {
                    var n = t.defaultView || window;
                    if (n) {
                        var r = n.getComputedStyle(e, null);
                        if (r) {
                            for (var i = arguments.length, a = Array(i > 1 ? i - 1 : 0), s = 1; i > s; s++) a[s - 1] = arguments[s];
                            return 1 == a.length ? r.getPropertyValue(a[0]) : a.reduce(function(e, t) {
                                return Z({}, e, o({}, t, r.getPropertyValue(t)));
                            }, {});
                        }
                    }
                }
            }
        }
        function G(e) {
            return e.split(" ").map(function(e) {
                return "." != e[0] ? "." + e : e;
            }).join("").trim();
        }
        function W(e) {
            for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; t > r; r++) n[r - 1] = arguments[r];
            if (n.length > 0) {
                var o = function() {
                    var t = [];
                    return t.push(W(e)), n.forEach(function(e) {
                        return t.push(W(e));
                    }), {
                        v: t.join(", ")
                    };
                }();
                if ("object" == typeof o) return o.v;
            }
            return e = e.split(", ").map(function(e) {
                return "." != e[0] ? "." + e : e;
            }).join(", ").trim(), e + ", " + e + " *";
        }
        function Y(e, t) {
            if (t == e) return !0;
            if (!e.children) return !1;
            for (var n = 0; n < e.children.length; n++) if (Y(e.children[n], t)) return !0;
            return !1;
        }
        function q(e, t) {
            var n = function(n) {
                n.map(function(n) {
                    if (0 != n.removedNodes.length) for (var o = n.removedNodes, i = o.length, a = 0; i > a; a++) {
                        var s = o[a];
                        (s.contains && s.contains(e) || Y(s, e)) && (r.disconnect(), t());
                    }
                });
            }, r = new MutationObserver(n);
            r.observe(e.ownerDocument.body, {
                childList: !0,
                subtree: !0
            });
        }
        function X() {
            var e = void 0, t = document.createElement("fakeelement"), n = {
                animation: "animationend",
                MozAnimation: "animationend",
                WebkitAnimation: "webkitAnimationEnd"
            };
            for (e in n) if (void 0 != t.style[e]) return n[e];
        }
        function K() {
            var e = void 0, t = document.createElement("fakeelement"), n = {
                transition: "transitionend",
                MozTransition: "transitionend",
                WebkitTransition: "webkitTransitionEnd"
            };
            for (e in n) if (n.hasOwnProperty(e) && void 0 !== t.style[e]) return n[e];
        }
        function J(e) {
            if ("undefined" != typeof GR_INLINE_STYLES) {
                var t = e.createElement("style");
                t.innerHTML = GR_INLINE_STYLES;
                try {
                    e.querySelector("head").appendChild(t);
                } catch (n) {
                    console.log("can't append style", n);
                }
            }
        }
        function $(e, t) {
            e.setAttribute("data-gramm_id", t), e.setAttribute("data-gramm", !0);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var Z = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, Q = e("lodash"), ee = r(Q), te = e("react"), ne = (r(te), e("react-dom")), re = r(ne), oe = e("./util"), ie = oe.guid(), ae = {
            "column-count": 1,
            columns: 1,
            "font-weight": 1,
            "line-height": 1,
            opacity: 1,
            "z-index": 1,
            zoom: 1
        };
        n["default"] = {
            isVisible: _,
            createEl: i,
            renderReactWithParent: a,
            inEl: s,
            hasClass: l,
            addClass: u,
            removeClass: c,
            toggleClass: d,
            matchesSelector: g,
            getParentBySel: f,
            getParentByData: S,
            getParentByDepth: D,
            parentIsContentEditable: p,
            isContentEditable: m,
            isFocused: h,
            listen: v,
            unlisten: b,
            on: y,
            off: j,
            once: w,
            css: P,
            addIframeCss: J,
            setGRAttributes: $,
            compStyle: V,
            camelize: k,
            camelizeAttrs: C,
            insertBefore: B,
            insertAfter: I,
            elementInDocument: L,
            getParentByTag: T,
            parentHasClass: N,
            isParent: R,
            resolveEl: M,
            getParent: A,
            runKeyEvent: F,
            docHidden: U,
            visibilityEvent: z,
            transformProp: H,
            cs: x,
            selectorAll: W,
            classSelector: G,
            watchNodeRemove: q,
            whichAnimationEndEvent: X,
            transitionEndEventName: K
        }, t.exports = n["default"];
    }, {
        "./util": "/project/src/js/lib/util.js",
        lodash: "lodash",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/editor/editor.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("../util"), i = e("../location"), a = e("../dom"), s = e("../position"), l = e("../config"), c = e("../client-script"), u = r(c), d = e("../message"), f = r(d), p = e("grammarly-editor"), m = r(p), g = e("lodash"), h = r(g), v = e("../socket"), b = r(v), y = e("../prefs"), j = r(y), w = e("../chrome-permissions"), _ = r(w), x = e("../window-events"), E = r(x), k = e("../timers"), C = r(k), O = e("../tracking/cargo"), P = r(O), T = e("../tracking"), S = e("./track"), M = r(S), A = e("../user"), N = r(A), D = function(e) {
            function t() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? "on" : arguments[0];
                E["default"][e]("beforeunload", ee), f["default"][e]("__bgerror", H), f["default"][e]("changed-plan", k), 
                f["default"][e]("editor-set-state", A, onerror), f["default"][e]("dialog-closed", D), 
                f["default"][e]("focus-editor", R), f["default"][e]("after-refresh-dialog", L), 
                ie[e]("track", M["default"]), ie[e]("fix", function() {
                    return j["default"].incFixed();
                }), ie[e]("serviceState", O), ie[e]("capiError", S), ie[e]("addedSynonym", w), ie[e]("afterReplace", r), 
                ie[e]("iframe-mousemove", x), j["default"][e]("enabledDefs", Q);
                var t = "on" == e ? a.listen : a.unlisten;
                t(pe, a.visibilityEvent(pe), q), se && t(pe.documentElement, "mousemove", c), ne.card && (ne.card[e]("show", p), 
                ne.card[e]("hide", g), ne.card[e]("toeditor", v), ne.card[e]("addtodict", y));
            }
            function n() {
                C["default"].start(te + "run"), t("on"), me(), u["default"].rewriteInnerHTML(ae), 
                ie.getText() && ie.emit("sending"), j["default"].get("enabledDefs", function(e) {
                    0 == e && (ie.synonyms.disable(), ie.disabledSynonyms = !0);
                }), ue && F();
            }
            function r(e) {
                return e && e.remove();
            }
            function c(e) {
                ie.emit("iframe-mousemove", e);
            }
            function d(e) {
                ce = !1, e && ie.setState(e), ie.hardReset(), ie.api.close(), ie.api.ws.connect(), 
                ie.api.start(), ie.api.restart();
            }
            function p(e) {
                var t = ie.matches.byId(e);
                t && (ie.emit("context"), t.editorId = ie.id, t.select(), ne.card.setData(t));
            }
            function g() {
                B();
            }
            function v(e) {
                e == ie.id && (ie.showDialog({
                    caller: "card"
                }), C["default"].start("open_editor"), T.call("statsc.ui.increment", "stability:editor.open_from_card"), 
                T.call("felog.event", "context_menu_open_popup"));
            }
            function y(e) {
                e.match.editorId == ie.id && (N["default"].anonymous ? (e.hide(), ie.showDialog({
                    caller: "card"
                })) : (e.animHide(), e.match.addToDict()));
            }
            function w(e) {
                e.editorId = ie.id, ne.card.showSynonyms(e);
            }
            function x(e) {
                ne.card.setOuterIframe(fe);
            }
            function k() {
                ce ? f["default"].emitTabs("refresh-dialog", ie.id) : d();
            }
            function O(e) {
                return "capi" == e.type ? e.available ? void (ue && z()) : F("Error checking is temporarily unavailable") : void 0;
            }
            function S(e) {
                if ("not_authorized" == e.error) {
                    if (re) return T.call("felog.error", "stability.capi_error_not_authorized_loop"), 
                    console.error("User not authorized... Recovery fail =("), F("Error checking is temporarily unavailable");
                    console.warn("User not authorized... Try to recover"), re = !0, f["default"].emitBackground("user:refresh", {}, function(e) {
                        return e ? T.call("felog.warn", "stability.capi_error_not_authorized_recovery_fail", {
                            error: e
                        }) : void d();
                    });
                }
            }
            function A(e) {
                e.editorId == ie.id && (ie.setState(e), ge && (ge = !1, ee()));
            }
            function D(e) {
                e == ie.id && (B(), ie.isHtmlGhost || I(), ce = !1);
            }
            function R(e) {
                e == ie.id && I();
            }
            function I() {
                ie.srcEl.focus();
            }
            function B() {
                ie.selectedMatch && (ne.card.removeLoading(ie.selectedMatch.getEl()), ie.selectedMatch.deselect());
            }
            function L(e) {
                e.editorId == ie.id && d(e);
            }
            function F() {
                ue = !0, ie.hardReset(), ie.api.close(), ie.render();
            }
            function U() {
                return ue;
            }
            function z() {
                ue = !1, d();
            }
            function H(e) {
                console.log("Can't connect to bg page: " + e), V(e), de || (de = !0, setTimeout(F, 10));
            }
            function V(e) {
                var t = e.message, n = e.stack;
                T.call("statsc.ui.increment", "stability:cant_connect_to_bg_page"), oe.push({
                    message: t,
                    stack: n
                });
            }
            function G(e) {
                h["default"].chain(e).groupBy(function(e) {
                    var t = e.message, n = e.stack;
                    return [ "bgerror", t, n ].join("");
                }).map(function(e) {
                    return e.pop();
                }).each(function(e) {
                    return T.call("felog.error", "stability.cant_connect_to_bg_page", e);
                });
            }
            function W() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0], t = e.caller, n = {
                    data: ie.getState(),
                    caller: t
                };
                ce = !0, ie.emit("show-dialog"), f["default"].emitFocusedTab("show-dialog", n);
            }
            function Y() {
                var e = ae.ownerDocument.createRange();
                e.selectNodeContents(ae);
                var t = e.cloneContents(), n = document.createElement("div");
                n.appendChild(t);
                for (var r = n.querySelectorAll("img"), o = r.length, i = 0; o > i; i++) r[i].src = r[i].src;
                return n.innerHTML;
            }
            function q() {
                return a.docHidden(pe) ? J() : void $();
            }
            function X(e) {
                return ue ? [] : e.filter(function(e) {
                    return e.free && !e.hidden;
                });
            }
            function K(e) {
                return a.matchesSelector(e, ".b-card.Synonyms .btn-close") ? !0 : !a.matchesSelector(e, ".b-card.Synonyms, .b-card.Synonyms *");
            }
            function J() {}
            function $() {}
            function Z() {
                var e = ie.getMatches();
                return {
                    critical: e.filter(function(e) {
                        return e.free && e.inDom;
                    }).length,
                    plus: e.filter(function(e) {
                        return !e.free;
                    }).length
                };
            }
            function Q(e) {
                return ie.disabledSynonyms && e ? (ie.disabledSynonyms = !1, ie.synonyms.fieldEnable()) : (ie.disabledSynonyms = !0, 
                void ie.synonyms.disable());
            }
            function ee(e) {
                if (!le || e) {
                    le = !0;
                    var n = ie.dom.getCleanHtml && ie.dom.getCleanHtml();
                    n && (ie.el.innerHTML = n), t("off"), ie.exit(), console.log("exit"), l.restrictedAttrs.forEach(ae.removeAttribute.bind(ae)), 
                    se && l.restrictedAttrs.forEach(ie.srcEl.removeAttribute.bind(ie.srcEl)), N["default"].ext2 && a.removeClass(ae, l.nextVerClass), 
                    ae.setAttribute("spellcheck", !0), ie.emit("exit");
                }
            }
            var te = (e.el || e.srcEl).getAttribute("gramm_id") || o.guid(), ne = e.app, re = void 0, oe = P["default"](G, 2e3);
            Object.assign(e, {
                capiUrl: l.URLS.capi,
                createWs: b["default"],
                docid: te,
                textareaWrapSelector: '[gramm_id="' + te + '"]',
                animatorContainer: e.el.ownerDocument.documentElement,
                getAnimatorElPos: s.getAbsRect,
                updateTextareaHeight: o._f,
                canRemoveSynonym: K,
                filter: X
            }), Object.assign(m["default"].Capi, {
                CLIENT_NAME: "extension",
                clientVersion: l.getVersion(),
                extDomain: i.getDomain()
            }), m["default"].MatchPositions = function() {
                return {
                    generateMatchPositions: o._f
                };
            }, e.matchPrefix = N["default"].ext2 ? l.nextVerClass : "";
            var ie = m["default"](e), ae = ie.el, se = e.posSourceEl && "IFRAME" == e.posSourceEl.tagName, le = !1, ce = !1, ue = !ne.online, de = void 0, fe = e.srcEl || ae, pe = ae.ownerDocument, me = ie.run, ge = !1;
            Object.assign(ie, {
                id: te,
                srcEl: fe,
                camouflage: o._f,
                run: n,
                errorData: Z,
                showDialog: W,
                isOffline: U,
                offline: F,
                online: z,
                outerIframe: e.outerIframe,
                cleanupText: o._f,
                activate: o._f,
                toggleBtn: o._f,
                remove: ee,
                reset: d
            });
            var he = ie.getMatchClass;
            ie.getMatchClass = function(e, t) {
                var n = he(e, t);
                return e.renderedOnce && (n += " gr_disable_anim_appear"), e.renderedOnce = !0, 
                n;
            }, ie.dom.changeSelection = o._f, ie.matches.fromReplaced = ie.matches.fromReplace = ie.matches.byId, 
            ie.current = ie.getFiltered, ie.started = !1, ie.el.setAttribute("data-gramm_editor", !0), 
            N["default"].ext2 && a.addClass(ae, l.nextVerClass), ie.getHtml && (ie.getHtml = Y);
            var ve = _["default"](ie);
            return ve.checkClipboard(), ie;
        };
        n["default"] = D, t.exports = n["default"];
    }, {
        "../chrome-permissions": "/project/src/js/lib/chrome-permissions.js",
        "../client-script": "/project/src/js/lib/client-script.js",
        "../config": "/project/src/js/lib/config.js",
        "../dom": "/project/src/js/lib/dom.js",
        "../location": "/project/src/js/lib/location.js",
        "../message": "/project/src/js/lib/message.js",
        "../position": "/project/src/js/lib/position.js",
        "../prefs": "/project/src/js/lib/prefs.js",
        "../socket": "/project/src/js/lib/socket.js",
        "../timers": "/project/src/js/lib/timers.js",
        "../tracking": "/project/src/js/lib/tracking/index.js",
        "../tracking/cargo": "/project/src/js/lib/tracking/cargo.js",
        "../user": "/project/src/js/lib/user.js",
        "../util": "/project/src/js/lib/util.js",
        "../window-events": "/project/src/js/lib/window-events.js",
        "./track": "/project/src/js/lib/editor/track.js",
        "grammarly-editor": "grammarly-editor",
        lodash: "lodash"
    } ],
    "/project/src/js/lib/editor/ghost.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t() {
                _();
            }
            function n(e) {
                var t = T.getBoundingClientRect(), n = E(e.clientX - t.left, e.clientY - t.top, t.left, t.top);
                if (n) {
                    n.e = e, e.stopPropagation();
                    var r = document.createEvent("CustomEvent");
                    r.initCustomEvent("gramMouse", !0, !0, n), S.dispatchEvent(r);
                }
            }
            function r(e) {
                try {
                    z.child.height = T.scrollHeight, R.scrollTop = T.scrollTop, clearTimeout(G), G = setTimeout(r, 100);
                } catch (e) {
                    console.log(e), r = m._f;
                }
            }
            function o(e) {
                return e ? e.split(" ").map(function(e) {
                    return isNaN(parseFloat(e)) && -1 == e.indexOf("px") ? e : Math.floor(parseFloat(e)) + "px";
                }).join(" ") : e;
            }
            function i() {
                var e = {}, t = M.getComputedStyle(T, null);
                if (!t) return e;
                var n = function(e) {
                    return t.getPropertyValue(e);
                }, r = function(e) {
                    var t = {};
                    return e.map(function(e) {
                        t[e] = n(e), "z-index" == e && "auto" == t[e] && T.style.zIndex && (t[e] = T.style.zIndex);
                    }), t;
                };
                e = {
                    parent: r([ "border", "border-radius", "box-sizing", "height", "width", "margin", "padding", "z-index", "border-top-width", "border-right-width", "border-left-width", "border-bottom-width", "border-top-style", "border-right-style", "border-left-style", "border-bottom-style", "padding-top", "padding-left", "padding-bottom", "padding-right", "margin-top", "margin-left", "margin-bottom", "margin-right" ]),
                    child: r([ "font", "font-size", "font-family", "text-align", "line-height", "letter-spacing", "text-shadow" ]),
                    src: r([ "position", "margin-top", "line-height", "font-size", "font-family", "z-index" ])
                };
                var i = e.parent["z-index"];
                if (e.parent["z-index"] = i && "auto" != i ? parseInt(i) - 1 : 0, e.parent.marginTop = o(e.parent.marginTop), 
                e.src.marginTop = o(e.src.marginTop), e.parent.margin = o(e.parent.margin), e.parent.padding = o(e.parent.padding), 
                (e.parent["border-top-width"] || e.parent["border-left-width"]) && (e.parent["border-style"] = "solid"), 
                e.parent["border-color"] = "transparent !important", "absolute" == e.src.position || "relative" == e.src.position ? e.parent = p["default"].extend(e.parent, r([ "top", "left" ])) : e.src.position = "relative", 
                V = V || n("background"), e.parent.background = V, m.isFF()) {
                    var a = parseInt(n("border-right-width")) - parseInt(n("border-left-width")), s = T.offsetWidth - T.clientWidth - a;
                    e.child["padding-right"] = s - 1 + "px";
                }
                return "start" == n("text-align") && (e.child["text-align"] = "ltr" == n("direction") ? "left" : "right"), 
                e;
            }
            function a(e) {
                F = e, u();
            }
            function l(e) {
                var t = {
                    background: "transparent !important",
                    "z-index": e["z-index"] || 1,
                    position: e.position,
                    "line-height": e["line-height"],
                    "font-size": e["font-size"],
                    "-webkit-transition": "none",
                    transition: "none"
                };
                parseInt(e["margin-top"]) > 0 && h.css(T.parentNode, {
                    width: "auto",
                    overflow: "hidden"
                });
                var n = M.devicePixelRatio > 1;
                if (n) {
                    var r = e["font-family"];
                    0 == r.indexOf("Consolas") && (r = r.replace("Consolas,", "Menlo, Monaco, 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace, serif"), 
                    z.child["font-family"] = r, t["font-family"] = r);
                }
                h.css(T, t);
            }
            function u() {
                var e = i();
                B || (l(e.src), U = T.previousElementSibling && "left" == h.css(T.previousElementSibling, "float"), 
                m.interval(u, 500), L || (L = !0, h.listen(T, X)), B = !0), z.parent.marginTop = o(z.parent.marginTop), 
                e = p["default"].merge(e, z), e.child.height = T.scrollHeight, Y && Y.ghostHeight && (e.child.height = Y.ghostHeight(e.child.height));
                var t = p["default"].merge(H, {
                    "data-id": N,
                    "data-gramm_id": N,
                    "data-gramm": "gramm",
                    "data-gramm_editor": !0,
                    dir: T.getAttribute("dir")
                });
                D || (D = S.createElement("grammarly-ghost"), h.insertBefore(D, T)), A.matchPrefix && (t.className = A.matchPrefix), 
                Y && Y.ghostHeight && (e.parent.height = Y.ghostHeight(e.parent.height));
                var n = d["default"].render(c["default"].createElement(j, {
                    style: e,
                    attrs: t,
                    val: F
                }), D);
                R = d["default"].findDOMNode(n), I = R.firstElementChild, R.contentEditable = !0, 
                q.clone = R, q.cloneVal = I, f(), v(), y(), 0 == T.offsetHeight ? C() : O(), q.emit("render");
            }
            function f() {
                if (U) {
                    if (T.getBoundingClientRect().left == R.getBoundingClientRect().left && T.getBoundingClientRect().top == R.getBoundingClientRect().top) return U = !1;
                    var e = T.getBoundingClientRect(), t = T.parentNode.getBoundingClientRect(), n = e.left - t.left, r = e.top - t.top, o = "translate(" + n + "px, " + r + "px)";
                    z.parent["-webkit-transform"] = o, z.parent.transform = o;
                }
            }
            function v() {
                function e(e, r, o) {
                    var i = o ? [ T, R ] : [ t, n ];
                    z.parent[r] = parseInt(parseInt(R.style[r]) + i[0][e] - i[1][e]) + "px";
                }
                var t = g.getAbsRect(T), n = g.getAbsRect(R);
                if (n.left != t.left && e("left", "marginLeft", !1), n.top != t.top && e("top", "marginTop", !1), 
                R.clientWidth == T.clientWidth || m.isFF() ? n.width != t.width && (H.width = t.width) : n.width != t.width ? R.style.width = t.width : e("clientWidth", "width", !0), 
                m.isFF()) {
                    var r = h.css(T.parentNode, [ "margin-left", "margin-top", "position" ]);
                    r && (r.marginLeft || r.marginTop) && "static" == r.position && (T.parentNode.style.position = "relative", 
                    T.parentNode.style.overflow = "");
                }
                n.height != t.height && (z.parent.height = t.height);
            }
            function y() {
                var e = function(e) {
                    return S.contains && S.contains(e) || h.elementInDocument(e, S);
                };
                D && e(D) && e(T) && D.nextElementSibling != T && h.insertBefore(D, T);
            }
            function w(e) {
                return R.querySelector(".gr_" + e);
            }
            function _() {
                var e = A.current();
                W = [];
                for (var t = R.scrollTop, n = function(e) {
                    return {
                        x1: e.left,
                        x2: e.right,
                        y1: e.top + t,
                        y2: e.bottom + t
                    };
                }, r = 0; r < e.length; r++) {
                    var o = e[r], i = w(o.id);
                    if (i) {
                        x(i);
                        var a = g.getPos(i, R), s = {
                            x1: a.x,
                            x2: a.x + i.offsetWidth,
                            y1: a.y,
                            y2: a.y + i.offsetHeight + 5
                        }, l = {
                            match: o,
                            el: i,
                            box: s
                        };
                        W.push(l);
                        var c = i.textContent.trim().split(" ").length > 1;
                        if (c) {
                            var u = i.getClientRects();
                            u.length < 2 || (l.rects = p["default"].map(u, n));
                        }
                    }
                }
            }
            function x(e) {
                e.setAttribute("style", e.parentNode.getAttribute("style")), !e.classList.contains("gr_disable_anim_appear") && e.addEventListener("animationend", function() {
                    return e.classList.add("gr_disable_anim_appear");
                }), h.css(e, {
                    display: "",
                    padding: "",
                    margin: "",
                    width: ""
                });
            }
            function E(e, t, n, r) {
                for (var o = R.scrollTop, i = 0; i < W.length; i++) {
                    var a = W[i], s = a.box;
                    if (e >= s.x1 && e <= s.x2 && t >= s.y1 - o && t <= s.y2 - o) return a;
                    if (a.rects) for (var l = 0; l < a.rects.length; l++) {
                        var c = a.rects[l], u = e + n, d = t + r;
                        if (u >= c.x1 && u <= c.x2 && d >= c.y1 - o && d <= c.y2 - o) return a;
                    }
                }
            }
            function k() {
                clearTimeout(G), m.cancelInterval(u);
            }
            function C() {
                D.style.display = "none", T.style.background = V, m.cancelInterval(u), setTimeout(function() {
                    return q.emit("render");
                }, 300), B = !1, D.parentNode && D.parentNode.removeChild(D);
            }
            function O() {
                B || (D.style.display = "", D.parentNode || h.insertBefore(D, T), u(), r());
            }
            function P() {
                k(), h.unlisten(T, X), C();
            }
            var T = e.el, S = T.ownerDocument, M = S.defaultView, A = e.editor || {
                current: function() {
                    return [];
                }
            }, N = e.id, D = void 0, R = void 0, I = void 0, B = !1, L = void 0, F = "", U = !1, z = {
                parent: {},
                child: {}
            }, H = {}, V = void 0, G = void 0, W = [], Y = b["default"](S).getFixesForCurrentDomain(), q = s["default"]({
                render: u,
                getStyle: i,
                setText: a,
                generateAlertPositions: _,
                remove: P,
                hide: C,
                show: O
            }), X = {
                mousemove: n,
                mouseenter: t,
                keyup: r,
                scroll: r
            };
            return q;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, a = e("emitter"), s = r(a), l = e("react"), c = r(l), u = e("react-dom"), d = r(u), f = e("lodash"), p = r(f), m = e("../util"), g = e("../position"), h = e("../dom"), v = e("../sites"), b = r(v);
        n["default"] = o;
        var y = {
            style: {
                child: {
                    display: "inline-block",
                    "line-height": "initial",
                    color: "transparent",
                    overflow: "hidden",
                    "text-align": "left",
                    "float": "initial",
                    clear: "none",
                    "box-sizing": "border-box",
                    "vertical-align": "baseline",
                    "white-space": "pre-wrap",
                    width: "100%",
                    margin: 0,
                    padding: 0,
                    border: 0
                },
                parent: {
                    position: "absolute",
                    color: "transparent",
                    "border-color": "transparent !important",
                    overflow: "hidden",
                    "white-space": "pre-wrap"
                },
                src: {}
            },
            attrs: {},
            val: ""
        }, j = c["default"].createClass({
            displayName: "GhostComponent",
            getDefaultProps: function() {
                return y;
            },
            render: function() {
                var e = p["default"].merge(y.style, this.props.style), t = this.props.attrs, n = h.camelizeAttrs(e.parent), r = h.camelizeAttrs(e.child), o = this.props.val;
                return c["default"].createElement("div", i({
                    style: n
                }, t, {
                    gramm: !0
                }), c["default"].createElement("span", {
                    style: r,
                    dangerouslySetInnerHTML: {
                        __html: o
                    }
                }), c["default"].createElement("br", null));
            }
        });
        t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../position": "/project/src/js/lib/position.js",
        "../sites": "/project/src/js/lib/sites.js",
        "../util": "/project/src/js/lib/util.js",
        emitter: "emitter",
        lodash: "lodash",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/editor/ghostarea.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t() {
                return B = R(U), B.on("exit", E), B.dom.insertGhost = y, I = s["default"]({
                    id: P,
                    el: k,
                    editor: B
                }), U.gh = I, B.ghostarea = U, B._run = B.run, B.run = n, B;
            }
            function n() {
                r("on"), N = !0, T = o(), B._run(), I.show();
            }
            function r() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? "on" : arguments[0], t = "on" == e ? i.listen : i.unlisten;
                t(k, "input", c), t(k, "keyup", v), t(k, "keydown", b), t(O, "click", p, null, !0), 
                I[e]("render", g), B[e]("rendered", w), B.isHtmlGhost || (B[e]("beforeReplace", d), 
                B[e]("afterReplace", j));
            }
            function o() {
                return "TEXTAREA" == k.tagName ? k.value : k.parentNode ? f["default"].getText(k) : "";
            }
            function a(e) {
                k.value = e;
            }
            function c() {
                N && (T = o());
            }
            function d() {
                A = k.scrollTop;
            }
            function p(e) {
                return F && i.matchesSelector(e.target, L) ? h() : void 0;
            }
            function m() {
                var e = C.createEvent("TextEvent");
                e.initTextEvent ? B.latestCursor.s == B.latestCursor.e && (e.initTextEvent("textInput", !0, !0, null, String.fromCharCode(8203), 1, "en-US"), 
                setTimeout(function() {
                    B.saveCursor(), B.skipInputEvents(), k.dispatchEvent(e), setTimeout(function() {
                        a(o().replace(String.fromCharCode(8203), "")), B.restoreCursor(), B.skipInputEvents(!1);
                    }, 50);
                }, 50)) : (i.runKeyEvent({
                    el: k,
                    type: "keydown"
                }), i.runKeyEvent({
                    el: k,
                    type: "keyup"
                })), k.scrollTop = A, T = o();
            }
            function g() {
                if ((0 == T.length && o().length > 0 || D) && (T = o(), D = !1), N) {
                    T = T.replace(new RegExp(String.fromCharCode(8203), "g"), "");
                    var e = l.diffPos(T, o()), t = 1 != T.indexOf("@") && -1 == o().indexOf("@");
                    e.delta >= 2 && 0 == e.s && (S || M) && !t && h();
                }
            }
            function h() {
                N && (_(), B.clearData());
            }
            function v(e) {
                B.camouflage();
            }
            function b(e) {
                M = 13 == e.keyCode;
            }
            function y() {
                return I.render(), {
                    clone: I.clone,
                    cloneVal: I.cloneVal
                };
            }
            function j() {
                setTimeout(m, 50);
            }
            function w() {
                I.generateAlertPositions();
            }
            function _() {
                N && I.hide();
            }
            function x() {
                N = !0, I.show();
            }
            function E() {
                r("off"), B && (B.off("exit", E), B.remove(), B = null), U.emit("exit"), k.removeAttribute("data-gramm"), 
                k.removeAttribute("data-txt_gramm_id"), I && (I.remove(), I = null);
            }
            var k = e.el, C = k.ownerDocument, O = C.defaultView, P = e.id, T = o(), S = !1, M = !1, A = void 0, N = !1, D = void 0, R = e.createEditor, I = void 0, B = void 0;
            k.setAttribute("data-gramm", ""), k.setAttribute("data-txt_gramm_id", P);
            var L = "div[role=navigation] li[role=listitem] *", F = "facebook.com" == C.domain, U = u["default"]({
                el: k,
                id: P,
                hideClone: _,
                showClone: x,
                insertGhost: y,
                remove: E,
                run: n
            });
            return t();
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        }), n["default"] = o;
        var i = e("../dom"), a = e("./ghost"), s = r(a), l = e("textdiff"), c = e("emitter"), u = r(c), d = e("wrap"), f = r(d);
        t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "./ghost": "/project/src/js/lib/editor/ghost.js",
        emitter: "emitter",
        textdiff: "textdiff",
        wrap: "wrap"
    } ],
    "/project/src/js/lib/editor/index.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t) {
            p.setGRAttributes(e, t), e.setAttribute("spellcheck", !1);
        }
        function a(e, t, n) {
            function r(t) {
                var r = t.el, o = t.id;
                return i(r, o), r.setAttribute("spellcheck", !1), g["default"]({
                    id: o,
                    el: r,
                    app: e,
                    editorType: n
                });
            }
            var o = {
                el: t,
                id: c.guid()
            };
            return "contenteditable" == n.value ? r(l({}, o)) : v["default"](l({}, o, {
                createEditor: r
            }));
        }
        function s(e, t) {
            var n = c.guid(), r = t.contentDocument, o = r.body;
            return i(t, n), t.setAttribute("gramm-ifr", !0), p.addIframeCss(r), i(o, n), t.style.height = t.style.height || getComputedStyle(t).height, 
            g["default"]({
                el: o,
                app: e,
                srcEl: t,
                posSourceEl: t,
                editorType: {
                    contenteditable: !0,
                    value: "contenteditable"
                }
            });
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var l = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, c = e("../util"), u = e("../tracking/index"), d = e("../elements"), f = r(d), p = e("../dom"), m = e("./editor"), g = r(m), h = e("./ghostarea"), v = r(h);
        n["default"] = function(e) {
            var t, n = e.app, r = e.type, i = e.field;
            return regeneratorRuntime.async(function(e) {
                for (;;) switch (e.prev = e.next) {
                  case 0:
                    if (u.call("statsc.ui.increment", "activity:" + r + ".editor_init"), e.t0 = n.elements, 
                    e.t0) {
                        e.next = 6;
                        break;
                    }
                    return e.next = 5, regeneratorRuntime.awrap(f["default"](n, document));

                  case 5:
                    e.t0 = e.sent;

                  case 6:
                    if (n.elements = e.t0, "iframe" != r) {
                        e.next = 9;
                        break;
                    }
                    return e.abrupt("return", s(n, i));

                  case 9:
                    return e.abrupt("return", a(n, i, (t = {}, o(t, r, !0), o(t, "value", r), t)));

                  case 10:
                  case "end":
                    return e.stop();
                }
            }, null, this);
        }, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../elements": "/project/src/js/lib/elements/index.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../util": "/project/src/js/lib/util.js",
        "./editor": "/project/src/js/lib/editor/editor.js",
        "./ghostarea": "/project/src/js/lib/editor/ghostarea.js"
    } ],
    "/project/src/js/lib/editor/track.js": [ function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var r = e("../tracking/index");
        n["default"] = function(e) {
            var t = e.type, n = e.key, o = e.value, i = e.data;
            (n || i) && (n ? r.call("statsc.ui." + t, n, o) : r.call("statsc.ui." + t, i));
        }, t.exports = n["default"];
    }, {
        "../tracking/index": "/project/src/js/lib/tracking/index.js"
    } ],
    "/project/src/js/lib/elements/card-component.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e) {
            var t = /class=["']([^'"]+)['"]/g;
            return u.sanitize(e).replace(t, function(e, t) {
                return 'class="' + h(t.trim()) + '"';
            });
        }
        function a(e) {
            return e ? [ "Unknown", "Misspelled" ].indexOf(e.category) > -1 : void 0;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = e("react"), l = r(s), c = e("react-dom"), u = e("dompurify"), d = e("../dom"), f = e("../user"), p = r(f), m = e("../tracking/index"), g = "gr-grammar-card", h = function(e) {
            return e.split(" ").map(function(e) {
                return g + "_" + e;
            }).join(" ");
        };
        n["default"] = l["default"].createClass({
            displayName: "card-component",
            getInitialState: function() {
                return {
                    pos: {
                        rect: {
                            top: 0,
                            left: 0,
                            width: 0
                        },
                        sourceRect: {
                            width: 0
                        },
                        delta: {
                            right: 0
                        },
                        className: "",
                        visible: !1
                    },
                    match: {},
                    visible: !1
                };
            },
            renderHeader: function() {
                var e = this.state.match, t = "title";
                if (e.syn && e.synonyms.meanings.length) return l["default"].createElement("div", {
                    className: h(t)
                }, "Synonyms suggested by Grammarly");
                if (e.title) {
                    if (e.spell && "Unknown" != e.category || (t += " title-link"), !e.spell || e.showTitle || e.didYouMean) return l["default"].createElement("div", {
                        className: h(t),
                        dangerouslySetInnerHTML: {
                            __html: u.sanitize(e.title)
                        },
                        "data-action": "editor"
                    });
                    if (!e.rFirst.trim()) return l["default"].createElement("div", {
                        className: h(t)
                    }, l["default"].createElement("div", {
                        className: h("replacement-block")
                    }, l["default"].createElement("span", {
                        className: h("replacement"),
                        "data-action": "replace",
                        "data-replace": e.rFirst,
                        dangerouslySetInnerHTML: {
                            __html: i(e.header)
                        }
                    })));
                    var n = e.origReplacements || [];
                    return l["default"].createElement("div", {
                        className: h(t)
                    }, n.map(function(t, n) {
                        return l["default"].createElement("div", {
                            className: h("replacement-block"),
                            key: n
                        }, l["default"].createElement("span", {
                            className: h("replacement"),
                            "data-replace": t
                        }, l["default"].createElement("span", {
                            className: h("del")
                        }, e.oldVal), l["default"].createElement("span", {
                            className: h("arr")
                        }, " → "), l["default"].createElement("span", {
                            className: h("ins")
                        }, t)));
                    }, this));
                }
            },
            renderFooter: function(e) {
                var t = l["default"].createElement("div", {
                    className: h("footer")
                }, l["default"].createElement("div", {
                    className: h("link"),
                    "data-action": "editor"
                }, "Correct with Grammarly"), this.renderAddToDict(), e.syn ? l["default"].createElement("div", {
                    className: h("btn-close"),
                    "data-action": "close"
                }, "Close") : l["default"].createElement("div", {
                    className: h("btn-close ignore"),
                    "data-action": "ignore"
                }, "Ignore")), n = l["default"].createElement("div", {
                    className: h("footer anonymous")
                }, l["default"].createElement("a", {
                    className: h("link"),
                    "data-action": "login",
                    target: "__blank"
                }, "Log in"), " to enable personalized grammar and spelling checks,", l["default"].createElement("br", null), "a custom dictionary, and additional features. It's free!");
                return p["default"].ext2 && p["default"].anonymous ? n : t;
            },
            getTriangleMargin: function() {
                var e = this.state.pos.sourceRect.width / 2, t = this.state.pos.delta.right;
                return t > 0 ? e : -t + e;
            },
            renderConfused: function() {
                var e = this.state.match;
                return l["default"].createElement("div", {
                    className: h("replacement-block sub-title")
                }, l["default"].createElement("span", {
                    className: h("replacement")
                }, "Did you mean ", l["default"].createElement("span", {
                    className: h("ins"),
                    "data-replace": e.rFirst
                }, e.rFirst), "?"));
            },
            renderSynonyms: function() {
                var e, t = this, n = this.state.match, r = n.synonyms.meanings;
                if (0 == r.length) return l["default"].createElement("div", {
                    className: h("content")
                }, l["default"].createElement("div", {
                    className: h("nothing")
                }, "No synonyms found"));
                var i = d.cs((e = {}, o(e, h("item-single"), 1 == r.length), o(e, h("item"), !0), 
                e));
                return l["default"].createElement("div", {
                    className: h("content")
                }, r.map(function(e, n) {
                    return l["default"].createElement("div", {
                        className: i,
                        key: n
                    }, l["default"].createElement("div", {
                        className: h("meaning")
                    }, e.meaning), l["default"].createElement("div", {
                        className: h("replacements")
                    }, e.synonyms.map(function(e, t) {
                        return l["default"].createElement("span", {
                            className: h("ins"),
                            key: t,
                            "data-replace": e.base
                        }, e.base);
                    }, t)));
                }, this));
            },
            renderAddToDict: function() {
                return a(this.state.match) ? l["default"].createElement("div", {
                    className: h("link add-to-dict"),
                    "data-action": "add"
                }, "Add to dictionary") : void 0;
            },
            componentWillMount: function() {
                var e = this;
                this.cardEvents = function(t) {
                    var n = t.target, r = n.dataset, o = r.action, i = r.replace, a = e.state.match, s = e.props;
                    if (t.stopPropagation(), t.preventDefault(), o || i || (o = n.parentNode.dataset.action, 
                    i = n.parentNode.dataset.replace), i && (o = "replace"), o) switch (o) {
                      case "replace":
                        a.replace(i), s.hide(), m.call("felog.info", (a.syn ? "synonyms" : "replacement") + "_click");
                        break;

                      case "ignore":
                        a.ignore(), s.animHide();
                        break;

                      case "close":
                        s.animHide();
                        break;

                      case "editor":
                        s.openEditor();
                        break;

                      case "login":
                        s.openEditor();
                        break;

                      case "add":
                        s.addToDict();
                    }
                };
            },
            componentDidMount: function() {
                var e;
                (e = c.findDOMNode(this), d.on).call(e, "click", this.cardEvents);
            },
            componentWillUnmount: function() {
                var e;
                (e = c.findDOMNode(this), d.off).call(e, "click", this.cardEvents);
            },
            render: function() {
                var e, t = {}, n = this.state.pos, r = this.state.match, i = d.cs((e = {}, o(e, g, !0), 
                o(e, h("syn"), r.syn), o(e, h("flip"), n.rect.flip), o(e, h("animate"), this.state.animate), 
                o(e, this.state.className, this.state.className), o(e, h("wide-footer"), a(this.state.match)), 
                o(e, h("anonymous"), p["default"].anonymous), e)), s = {
                    marginLeft: this.getTriangleMargin()
                };
                return t.top = n.rect.top, t.left = n.rect.left, 0 == n.rect.top && 0 == n.rect.left && this.state.visible && m.call("statsc.ui.increment", "stability:card.top_left_0"), 
                n.rect.top > 0 && n.rect.top < 10 && n.rect.left > 0 && n.rect.left < 10 && this.state.visible && m.call("statsc.ui.increment", "stability:card.top_left_10"), 
                t.visibility = this.state.visible ? "" : "hidden", l["default"].createElement("div", {
                    style: t,
                    className: i
                }, l["default"].createElement("span", {
                    style: s,
                    className: h("triangle")
                }), this.renderHeader(), r.syn && this.renderSynonyms(), r.didYouMean && this.renderConfused(), this.renderFooter(r));
            }
        }), t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../user": "/project/src/js/lib/user.js",
        dompurify: "dompurify",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/elements/card.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        function a(e, t) {
            if (e) {
                if (!e.length) return e;
                if (1 == e.length || !t) return e[0];
                var n = t.pageX || t.clientX, r = t.pageY || t.clientY, o = void 0;
                return e.forEach(function(e) {
                    var t = e.top, i = e.left, a = e.width, s = e.height;
                    r >= t && t + s >= r && n >= i && i + a >= n && (o = e);
                }), o || e[0];
            }
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), l = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, c = e("react"), u = r(c), d = e("react-dom"), f = e("emitter"), p = r(f), m = e("../timers"), g = r(m), h = e("../util"), v = e("../window-events"), b = r(v), y = e("../tracking/index"), j = e("../position"), w = e("../dom"), _ = e("./hint"), x = r(_), E = e("./tooltip"), k = r(E), C = e("./card-component"), O = r(C), P = {}, T = function(e) {
            function t() {
                var e = this, n = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0], r = n.doc, i = void 0 === r ? document : r, a = n.domCls, s = void 0 === a ? "" : a;
                o(this, t), l(Object.getPrototypeOf(t.prototype), "constructor", this).call(this), 
                this.show = function(t, n) {
                    return e.emit("show", t.id), e.updatePos(t, n), g["default"].start(P.id), y.call("statsc.ui.increment", "stability:card.open"), 
                    y.call("felog.event", "card_open"), e;
                }, this.hide = function() {
                    if (P.hint.visible) {
                        P.container.el.style.display = "none", P.container.component.setState({
                            animate: !1,
                            visible: !1,
                            match: {}
                        });
                        var t = P.notfound && P.notfound.isEnabled();
                        P.notfound.disable(), P.notfound.hide(), e.emit("hide", e.match), e.removeLoading(P.hint.currentEl);
                        var n = {
                            active_time: g["default"].stop(P.id)
                        };
                        if (e.match) {
                            var r = e.match.syn;
                            y.call("statsc.ui.timing", "stability:" + (r ? "syn" : "card") + ".close", n.active_time), 
                            y.call("felog.event", (r ? "syn" : "card") + "_close", n);
                        }
                        return t && (y.call("statsc.ui.timing", "stability:syn.close", n.active_time), y.call("felog.event", "syn_close", n)), 
                        e.match = null, P.container.el.style.display = "", e;
                    }
                }, this.animHide = function() {
                    var t;
                    return P.container.component.setState({
                        animate: !0
                    }), (t = P.el, w.once).call(t, w.whichAnimationEndEvent(), e.hide), e;
                }, this.openEditor = function() {
                    e.removeLoading(P.hint.currentEl), e.emit("toeditor", e.match.editorId), e.hide();
                }, this.addToDict = function() {
                    return e.emit("addtodict", {
                        match: e.match,
                        hide: e.hide,
                        animHide: e.animHide
                    });
                }, this.inTarget = function(t) {
                    var n = t.target, r = t.clientX, o = t.clientY, i = t.detail, a = P.hint.currentEl, s = (w.parentHasClass(n, P.cls) || w.hasClass(n, P.cls)) && !w.hasClass(a, "g-selection-anim"), l = e.elementsFromPoint(r, o).some(function(e) {
                        return w.hasClass(e, P.cls);
                    });
                    return l && P.hint.visible && 1 == i ? !0 : s ? a && a != n ? (P.hint.fastHide(), 
                    void e.removeLoading(a)) : (e.addLoading(n), !0) : void (!P.hint.visible && a && e.removeLoading(a));
                }, this.addLoading = function(e) {
                    return !w.hasClass(e, P.pCls) && w.addClass(e, P.pCls);
                }, this.removeLoading = function(e) {
                    w.hasClass(e, P.pCls) && w.removeClass(e, P.pCls), w.hasClass(e, "g-selection-anim") && e.parentNode && e.parentNode.removeChild(e);
                }, this.showSynonyms = function(t) {
                    return t.animEl && 0 != t.animEl.getClientRects().length ? (P.hint.currentEl && e.hide(), 
                    P.hint.currentEl = t.animEl, 0 == t.synonyms.meanings.length ? (P.notfound.enable(), 
                    P.notfound.show({
                        posEl: t.animEl,
                        text: "No synonyms found",
                        outerIframe: P.iframe
                    })) : (e.setData(t), e.updatePos(t.animEl), P.container.component.setState({
                        visible: !0
                    })), P.hint.setVisible(!0), y.call("felog.event", "syn_open"), g["default"].start(P.id), 
                    y.call("statsc.ui.increment", "stability:syn.open"), e) : e;
                }, this.setOuterIframe = function(e) {
                    var t = e.contentDocument;
                    !e || t && e == P.iframe || (P.iframe = e, P.hint.setDocs(P.doc, t));
                }, P = {
                    id: Symbol("GrammarCard"),
                    notfound: k["default"]({
                        cls: "gr-notfound-tooltip",
                        enabled: !1,
                        doc: i
                    }),
                    windowEvents: {
                        keydown: this.hide,
                        scroll: this.hide,
                        resize: this.hide
                    },
                    doc: i,
                    domCls: s,
                    cls: "gr_",
                    pCls: "gr-progress"
                }, P.container = this.render(P), P.el = d.findDOMNode(P.container.component), P.hint = new x["default"]({
                    doc: P.doc,
                    hint: P.el,
                    hideDelay: 500,
                    inTarget: this.inTarget,
                    cls: P.cls,
                    delay: 400,
                    onshow: this.show,
                    onhide: this.hide
                }).bind(), this.hint = P.hint, b["default"].on(P.windowEvents, !0);
            }
            return i(t, e), s(t, [ {
                key: "elementsFromPoint",
                value: function(e, t) {
                    return e && t ? P.doc.elementsFromPoint ? P.doc.elementsFromPoint(e, t) : [ P.doc.elementFromPoint(e, t) ] : [];
                }
            }, {
                key: "setData",
                value: function(e) {
                    return e ? (P.container.component.setState({
                        match: e,
                        visible: !0
                    }), this.match = e, this) : this;
                }
            }, {
                key: "updatePos",
                value: function(e, t) {
                    if (null == e.parentNode) {
                        if (!e.id) return this.hide();
                        var n = P.doc.querySelector(".gr_" + e.id);
                        if (!n) return this.hide();
                        P.hint.currentEl = e = n;
                    }
                    var r = j.getAbsRect(e, P.iframe, !0), o = j.posToRect(P.el, a(r, t));
                    P.container.component.setState({
                        pos: o
                    });
                }
            }, {
                key: "render",
                value: function() {
                    return w.renderReactWithParent(u["default"].createElement(O["default"], {
                        className: P.domCls,
                        hide: this.hide,
                        animHide: this.animHide,
                        openEditor: this.openEditor,
                        addToDict: this.addToDict
                    }), P.doc.documentElement, P.id, "grammarly-card");
                }
            }, {
                key: "remove",
                value: function() {
                    P.hint.unbind(), b["default"].off(P.windowEvents, !0), P.container.remove();
                }
            } ]), t;
        }(h.createClass(p["default"]));
        n["default"] = T, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../position": "/project/src/js/lib/position.js",
        "../timers": "/project/src/js/lib/timers.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../util": "/project/src/js/lib/util.js",
        "../window-events": "/project/src/js/lib/window-events.js",
        "./card-component": "/project/src/js/lib/elements/card-component.js",
        "./hint": "/project/src/js/lib/elements/hint.js",
        "./tooltip": "/project/src/js/lib/elements/tooltip.js",
        emitter: "emitter",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/elements/dialog.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t(e) {
                var t = "off" == e;
                k.toggleClass(B.body, t, "gr-disable-scroll"), k.toggleClass(B.documentElement, t, "gr-disable-scroll");
            }
            function n(e) {
                G && e == G.editorId && m();
            }
            function r(e) {
                return e.ext2 ? new g["default"]({
                    doc: B
                }) : p["default"]({
                    doc: B
                });
            }
            function o(e) {
                t("off");
                var n = r(v["default"]);
                n.on("hide", function() {
                    t("on"), j["default"].emitTabs("focus-editor", G.editorId), x.call("felog.info", "signin_close", {
                        active_time: _["default"].stop(F)
                    });
                }), x.call("felog.info", "signin_open"), x.fire("login-attempt", e);
            }
            function i() {
                V = !0, z = B.querySelector(T), z || (z = c.findDOMNode(k.renderReactWithParent(l["default"].createElement(A, null), B.documentElement, b.guid()).component)), 
                H = z.querySelector(S("back"));
            }
            function s() {
                var e = {
                    "mail.google.com": "Gmail",
                    "facebook.com": "Facebook",
                    "twitter.com": "Twitter"
                };
                return "Back to " + (e[E.getDomain()] || document.title);
            }
            function u(e) {
                e.stopPropagation(e), D();
            }
            function d(e) {
                j["default"].emitTabs("editor-set-state", e);
            }
            function f() {
                j["default"].emitTabs("dialog-closed", G.editorId);
            }
            function m() {
                if (U) {
                    var e = function() {
                        L.el.style.background = "";
                        var e = d;
                        return d = function(t) {
                            d = e, L.refresh(), j["default"].emitTabs("after-refresh-dialog", t);
                        }, D(), {
                            v: void 0
                        };
                    }();
                    if ("object" == typeof e) return e.v;
                }
                L.refresh();
            }
            function h(e) {
                j["default"].emitBackground("iframe-mode", {
                    iframeMode: e,
                    id: G.socketId
                });
            }
            function y() {
                return v["default"].anonymous ? v["default"].on("update", y) : (v["default"].off("update", y), 
                void L.activate(b._f));
            }
            function w(e) {
                var t = e.data, n = e.caller;
                return _["default"].start(F), G = t, v["default"].anonymous ? o(n) : (L.activate(), 
                void C(t));
            }
            function C(e) {
                V || i(), z.style.opacity = 0, k.addClass(z, "gr-_show");
                var n = a["default"].extend({
                    favicon: E.getFavicon(),
                    page: s()
                }, e);
                L.send(n), h(!0), setTimeout(function() {
                    return z.style.opacity = 1;
                }, 10), t("off"), k.listen(B.body, "keydown", I), k.listen(H, "click", u), k.listen(z, "click", u), 
                U = !0;
            }
            function P(e) {
                var t = e.action;
                "edit" == t && d(e), "close" == t && D(), "initialized" == t && (N(e), setTimeout(function() {
                    return L.el.style.background = "transparent";
                }, 300)), "socket" == t && j["default"].emitBackground("socket-client", e), "setSettings" == t && (v["default"].settings = e.data), 
                "tracking" == t && x.call(e.method, e.param), "popup-editor-fix" == t && O["default"].incFixed(), 
                "open-url" == t && (x.fire("upgrade", "popup_editor_other", E.getDomain()), j["default"].emitBackground("open-url", e.url));
            }
            function M(e, t) {
                G && e.socketId == G.socketId && (t("ok"), e.action = "socket", L.send(e));
            }
            function N(e) {
                var t = "Premium" == e.userType ? "freemium-plus" : "freemium";
                B.documentElement.setAttribute("data-type", t);
            }
            function D() {
                if (U) {
                    U = !1, t("on"), z.style.opacity = 0, k.removeClass(z, "gr-_show"), k.unlisten(B.body, "keydown", I), 
                    k.unlisten(H, "click", u), k.unlisten(z, "click", u), L.send({
                        action: "hide"
                    }), h(!1), f();
                    var e = {
                        active_time: _["default"].stop(F)
                    };
                    x.call("statsc.ui.timing", "stability:editor.close", e.active_time), x.call("felog.event", "close_popup", e);
                }
            }
            function R() {
                window == window.top && (j["default"].off("show-dialog", w), j["default"].off("hide-dialog", D), 
                j["default"].off("refresh-dialog", n), j["default"].off("socket-server-iframe", M)), 
                L.deactivate(), L.off("message", P), z.parentNode.removeChild(z);
            }
            function I(e) {
                return 27 == e.keyCode && U ? (e.stopPropagation(), e.preventDefault(), D()) : void 0;
            }
            var B = e.doc, L = e.iframe, F = Symbol("Dialog"), U = !1, z = void 0, H = void 0, V = void 0, G = void 0, W = {
                show: w,
                hide: D,
                preActivate: y,
                render: i,
                getSignin: r,
                remove: R,
                refresh: m
            };
            return L.on("message", P), window == window.top && (j["default"].on("show-dialog", w), 
            j["default"].on("hide-dialog", D), j["default"].on("refresh-dialog", n), j["default"].on("socket-server-iframe", M)), 
            W;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("lodash"), a = r(i), s = e("react"), l = r(s), c = e("react-dom"), u = e("./iframe"), d = r(u), f = e("./signin"), p = r(f), m = e("./signin-dialog"), g = r(m), h = e("../user"), v = r(h), b = e("../util"), y = e("../message"), j = r(y), w = e("../timers"), _ = r(w), x = e("../tracking/index"), E = e("../location"), k = e("../dom"), C = e("../prefs"), O = r(C), P = "gr_-editor", T = "." + P, S = function(e) {
            return "." + P + "_" + e;
        }, M = function(e) {
            return P + "_" + e;
        };
        n["default"] = o;
        var A = l["default"].createClass({
            displayName: "DialogComponent",
            render: function() {
                var e = {
                    display: "none"
                };
                return l["default"].createElement("div", {
                    className: P,
                    style: e
                }, l["default"].createElement("div", {
                    className: M("back")
                }), l["default"].createElement(d["default"].IframeComponent, null));
            }
        });
        t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../location": "/project/src/js/lib/location.js",
        "../message": "/project/src/js/lib/message.js",
        "../prefs": "/project/src/js/lib/prefs.js",
        "../timers": "/project/src/js/lib/timers.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../user": "/project/src/js/lib/user.js",
        "../util": "/project/src/js/lib/util.js",
        "./iframe": "/project/src/js/lib/elements/iframe.js",
        "./signin": "/project/src/js/lib/elements/signin.js",
        "./signin-dialog": "/project/src/js/lib/elements/signin-dialog/index.js",
        lodash: "lodash",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/elements/error-tooltip.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("./tooltip"), i = r(o), a = e("../dom"), s = e("../tracking/index"), l = function(e) {
            function t(e) {
                a.hasClass(e.target, "fr-reload-tab") && (s.call("felog.info", "g_button_hover_reload_click"), 
                setTimeout(function() {
                    return window.location.reload(!0);
                }, 200));
            }
            var n = e.el, r = e.win, o = e.outerIframe, l = i["default"]({
                posEl: n,
                html: "<span class='fr-tooltip-title'>Cannot connect to Grammarly.</span> Please <span class='fr-reload-tab'>reload</span> the browser tab and check your internet connection. <span class='fr-dialog-br'></span>Don't lose your work! Copy any unsaved text before you reload the tab.",
                doc: n.ownerDocument,
                cls: "fr-btn-offline-tooltip",
                outerIframe: o,
                enabled: !1
            });
            a.listen(r, "click", t);
            var c = l.remove;
            return l.remove = function() {
                c(), a.unlisten(r, "click", t);
            }, l;
        };
        n["default"] = l, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "./tooltip": "/project/src/js/lib/elements/tooltip.js"
    } ],
    "/project/src/js/lib/elements/hint.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("lodash"), a = r(i), s = e("../util"), l = e("../dom"), c = {
            hideDelay: 10,
            onshow: s._f,
            onhide: s._f,
            onmousemove: s._f,
            onInnerMouseMove: s._f,
            inTarget: function(e) {
                var t = e.target, n = l.parentHasClass(t, this.cls) || l.hasClass(t, this.cls);
                if (n) return this.currentEl && this.currentEl != t ? void this.fastHide() : !0;
            }
        }, u = function d(e) {
            var t = this;
            o(this, d), a["default"].extend(this, c, e, {
                bind: function(e) {
                    var n = arguments.length <= 1 || void 0 === arguments[1] ? t.doc : arguments[1];
                    return t.doc2 && t.doc2 != n && t.bind(e, t.doc2), l.listen(n.body, "resize", t.fastHide, e), 
                    l.listen(n, {
                        gramMouse: t.mousemove,
                        mousemove: t.mousemove,
                        scroll: t.fastHide
                    }, s._f, e), l.listen(n, "click", t.click, e, !0), l.listen(t.hint, "mousemove", t.innerMouseMove, e), 
                    t;
                },
                setDocs: function(e, n) {
                    t.unbind(), a["default"].extend(t, {
                        doc: e,
                        doc2: n
                    }), t.bind();
                },
                unbind: function(e) {
                    return t.bind(!0, e);
                },
                fastHide: function() {
                    t.onhide(), t.cancelTimeout("show").cancelTimeout("hide"), t.visible = !1, t.currentEl = null;
                },
                innerMouseMove: function(e) {
                    t.onInnerMouseMove(e), e.preventDefault(), e.stopPropagation(), t.cancelTimeout("hide");
                },
                click: function(e) {
                    return !t.elInHint(e.target) && !t.inTarget(e) && t.fastHide();
                },
                elInHint: function(e) {
                    return e && (l.inEl(e, t.hint) || e == t.hint);
                },
                mousemove: function(e) {
                    var n = e.target;
                    if ("IFRAME" != n.tagName) {
                        if (e.detail && e.detail.el && (n = e.detail.el, e = {
                            target: n,
                            clientX: e.detail.e.clientX,
                            clientY: e.detail.e.clientY
                        }), s.isSafari() && "mousemove" == e.type) {
                            if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return t.mouseMoveCoordinates = e.x + "-" + e.y;
                            if (t.mouseMoveCoordinates == e.x + "-" + e.y) return;
                        }
                        if (t.elInHint(n)) return t.onmousemove(e, !0), void t.cancelTimeout("show").cancelTimeout("hide");
                        if (!t.inTarget(e)) return t.onmousemove(e, !1), void (t.visible ? t.hide() : t.cancelTimeout("show"));
                        t.onmousemove(e, !0), t.visible || (t.show(e, n).cancelTimeout("hide"), t.currentEl = n);
                    }
                },
                show: function(e, n) {
                    return t.showTimeout ? t : (t.cancelTimeout("hide"), t.showTimeout = setTimeout(function() {
                        this.cancelTimeout("show"), (this.elInHint(n) || this.inTarget(e)) && (this.visible = !0, 
                        this.onshow(n, {
                            pageX: e.pageX,
                            pageY: e.pageY,
                            clientX: e.clientX,
                            clientY: e.clientY
                        }));
                    }.bind(t), t.delay), t);
                },
                hide: function() {
                    return t.hideTimeout ? t : (t.hideTimeout = setTimeout(function() {
                        this.onhide(), this.visible = !1, this.currentEl = null;
                    }.bind(t), t.hideDelay), t);
                },
                cancelTimeout: function(e) {
                    var n = e + "Timeout";
                    return t[n] ? (clearTimeout(t[n]), t[n] = null, t) : t;
                },
                setVisible: function(e) {
                    t.visible = e, t.cancelTimeout("hide");
                }
            });
        };
        n["default"] = u, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../util": "/project/src/js/lib/util.js",
        lodash: "lodash"
    } ],
    "/project/src/js/lib/elements/iframe.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t(e) {
                function t() {
                    (m || (m = d.querySelector(y), _.el = m, m)) && (c.listen(window.top, "message", a), 
                    m.srcdoc || n(e), c.addClass(m, "gr-freemium-ifr"), h = !0, _.activated = h);
                }
                h || t();
            }
            function n() {
                function e() {
                    var r = "ACTIVATE_GR_POPUP" + n;
                    return m.contentDocument.body && m.contentDocument.body.innerHTML && window[r] ? (window[r](m.contentWindow, m.contentDocument, v["default"]), 
                    void t()) : void setTimeout(e, 200);
                }
                var t = arguments.length <= 0 || void 0 === arguments[0] ? u._f : arguments[0], n = g["default"].ext2 ? "_TEST" : "";
                m.setAttribute("srcdoc", window["GR_INLINE_POPUP" + n]), e();
            }
            function r() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? u._f : arguments[0];
                m && (m.setAttribute("srcdoc", ""), n(e)), w = !1;
            }
            function o(e, t) {
                return w || t ? void i(e) : j.push(e);
            }
            function i(e) {
                e.grammarly = !0;
                try {
                    m.contentWindow.postMessage(e, "*");
                } catch (t) {
                    console.error("wtf", t);
                }
            }
            function a(e) {
                var t = e.data;
                e.origin;
                if (t && t.grammarly) {
                    var n = t.action;
                    if ("user" == n) return i({
                        action: "user",
                        user: g["default"]
                    });
                    if (w = !0, "initialized" == n && j) {
                        var r = f["default"].stop("open_editor");
                        r && p.call("statsc.ui.timing", "performance:popup.first.load_time", r), j.forEach(_.send);
                    }
                    var o = f["default"].stop("open_editor");
                    o && p.call("statsc.ui.timing", "performance:popup.load_time", o), "accepted" == n && (j = []), 
                    _.emit("message", t);
                }
            }
            function s() {
                c.unlisten(window.top, "message", a);
            }
            var d = e.doc, m = void 0, h = void 0, j = [], w = !1, _ = l["default"]({
                activate: t,
                refresh: r,
                send: o,
                selector: y,
                baseCls: b,
                deactivate: s
            });
            return _;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("react"), a = r(i), s = e("emitter"), l = r(s), c = e("../dom"), u = e("../util"), d = e("../timers"), f = r(d), p = e("../tracking/index"), m = e("../user"), g = r(m), h = e("dompurify"), v = r(h), b = "gr_-ifr", y = "." + b, j = a["default"].createClass({
            displayName: "IframeComponent",
            render: function() {
                return a["default"].createElement("iframe", {
                    className: b + " gr-_dialog-content"
                });
            }
        });
        o.IframeComponent = j, o.baseCls = b, o.selector = y, n["default"] = o, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../timers": "/project/src/js/lib/timers.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../user": "/project/src/js/lib/user.js",
        "../util": "/project/src/js/lib/util.js",
        dompurify: "dompurify",
        emitter: "emitter",
        react: "react"
    } ],
    "/project/src/js/lib/elements/index.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("./iframe"), i = r(o), a = e("./dialog"), s = r(a), l = e("./card"), c = r(l);
        n["default"] = function(e) {
            var t, n, r = arguments.length <= 1 || void 0 === arguments[1] ? document : arguments[1];
            return regeneratorRuntime.async(function(o) {
                for (;;) switch (o.prev = o.next) {
                  case 0:
                    return n = function() {
                        e.iframe && e.iframe.deactivate(), e.dialog && e.dialog.remove(), e.card && e.card.remove(), 
                        e.iframe = null, e.dialog = null, e.card = null;
                    }, t = e.iframe = i["default"]({
                        doc: r
                    }), e.dialog = s["default"]({
                        doc: r,
                        iframe: t
                    }), e.dialog.render(), e.dialog.preActivate(), e.card = new c["default"]({
                        doc: r
                    }), o.abrupt("return", {
                        clear: n
                    });

                  case 7:
                  case "end":
                    return o.stop();
                }
            }, null, this);
        }, t.exports = n["default"];
    }, {
        "./card": "/project/src/js/lib/elements/card.js",
        "./dialog": "/project/src/js/lib/elements/dialog.js",
        "./iframe": "/project/src/js/lib/elements/iframe.js"
    } ],
    "/project/src/js/lib/elements/signin-component.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("react"), i = r(o), a = e("styl/signin.styl"), s = r(a), l = i["default"].createClass({
            displayName: "SigninComponent",
            render: function() {
                return i["default"].createElement("div", {
                    className: s["default"].signin
                }, i["default"].createElement("div", {
                    className: s["default"].content
                }, i["default"].createElement("h3", {
                    className: s["default"].head
                }, "Sign up for Grammarly"), i["default"].createElement("div", {
                    className: s["default"].descr
                }, "You need a Grammarly account so we can store your personal dictionary and optimize our algorithms for your writing style. It’s easy, and free!"), i["default"].createElement("a", {
                    className: s["default"].auth_button,
                    href: "https://www.grammarly.com/signup",
                    target: "__blank",
                    role: "button"
                }, "Create an account")), i["default"].createElement("div", {
                    className: s["default"].footer
                }, i["default"].createElement("a", {
                    href: "https://www.grammarly.com"
                }), i["default"].createElement("div", {
                    className: s["default"].login_text
                }, "Already have an account? ", i["default"].createElement("a", {
                    href: "https://www.grammarly.com/signin",
                    className: s["default"].signin_link,
                    target: "__blank"
                }, "Log in"))));
            }
        });
        n["default"] = l, t.exports = n["default"];
    }, {
        react: "react",
        "styl/signin.styl": "/project/src/styl/signin.styl"
    } ],
    "/project/src/js/lib/elements/signin-dialog/button.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function a(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), l = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, c = e("react"), u = r(c), d = e("lib/dom"), f = e("lib/spinner"), p = e("styl/signin-dialog/button.styl"), m = r(p), g = function(e) {
            function t() {
                var e = this;
                i(this, t), l(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments), 
                this.onClick = function(t) {
                    t.preventDefault(), e.props.loading || e.props.onClick(t);
                };
            }
            return a(t, e), s(t, [ {
                key: "render",
                value: function() {
                    var e, t = this.props.loading, n = t ? "" : this.props.text, r = d.cs((e = {}, o(e, m["default"].button_container, !0), 
                    o(e, m["default"].loading, t), e));
                    return u["default"].createElement("div", {
                        className: r
                    }, t && u["default"].createElement(f.SpinnerComponent, {
                        className: m["default"].button_spinner
                    }), u["default"].createElement("button", {
                        onClick: this.onClick,
                        className: m["default"].button
                    }, n));
                }
            } ]), t;
        }(u["default"].Component);
        n["default"] = g, t.exports = n["default"];
    }, {
        "lib/dom": "/project/src/js/lib/dom.js",
        "lib/spinner": "/project/src/js/lib/spinner.js",
        react: "react",
        "styl/signin-dialog/button.styl": "/project/src/styl/signin-dialog/button.styl"
    } ],
    "/project/src/js/lib/elements/signin-dialog/fieldset.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, s = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), l = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, c = e("react"), u = r(c), d = e("react-dom"), f = r(d), p = e("styl/signin-dialog/signin-dialog.styl"), m = r(p), g = e("./input"), h = r(g), v = [ {
            label: "Name",
            name: "name",
            type: "text"
        }, {
            label: "Email",
            name: "email",
            type: "text"
        }, {
            label: "Password",
            name: "password",
            type: "password"
        } ], b = function(e) {
            function t() {
                o(this, t), l(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments);
            }
            return i(t, e), s(t, [ {
                key: "setFocus",
                value: function() {
                    var e = arguments.length <= 0 || void 0 === arguments[0] ? this.props.fields[0] : arguments[0];
                    f["default"].findDOMNode(this.refs[e].refs.input).focus();
                }
            }, {
                key: "render",
                value: function() {
                    var e = this;
                    return u["default"].createElement("fieldset", {
                        className: m["default"].inputs
                    }, u["default"].createElement("input", {
                        className: m["default"].hidden,
                        type: "text",
                        name: "fakeusernameremembered"
                    }), u["default"].createElement("input", {
                        className: m["default"].hidden,
                        type: "password",
                        name: "fakepasswordremembered"
                    }), v.filter(function(t) {
                        var n = t.name;
                        return e.props.fields.includes(n);
                    }).map(function(t, n) {
                        return u["default"].createElement(h["default"], a({}, t, {
                            ref: t.name,
                            value: e.props.formData[t.name],
                            validation: e.props.validation[t.name],
                            onSet: e.props.onSet(t.name),
                            onValidate: e.props.onValidate(t.name),
                            forceValidation: e.props.forceValidation,
                            key: n
                        }));
                    }));
                }
            } ]), t;
        }(u["default"].Component);
        n["default"] = b, t.exports = n["default"];
    }, {
        "./input": "/project/src/js/lib/elements/signin-dialog/input.js",
        react: "react",
        "react-dom": "react-dom",
        "styl/signin-dialog/signin-dialog.styl": "/project/src/styl/signin-dialog/signin-dialog.styl"
    } ],
    "/project/src/js/lib/elements/signin-dialog/footer.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), s = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, l = e("react"), c = r(l), u = e("styl/signin-dialog/signin-dialog.styl"), d = r(u), f = e("lib/config"), p = function(e) {
            function t() {
                o(this, t), s(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments);
            }
            return i(t, e), a(t, [ {
                key: "render",
                value: function() {
                    return c["default"].createElement("div", {
                        className: d["default"].footer
                    }, "By signing up, you agree to our ", c["default"].createElement("a", {
                        target: "__blank",
                        href: f.URLS.terms
                    }, "Terms and Conditions"), " and ", c["default"].createElement("a", {
                        target: "__blank",
                        href: f.URLS.policy
                    }, "Privacy ", c["default"].createElement("br", null), " Policy"), ". You also agree to receive product-related emails from ", c["default"].createElement("br", null), "Grammarly, which you can unsubscribe from at any time.");
                }
            } ]), t;
        }(c["default"].Component);
        n["default"] = p, t.exports = n["default"];
    }, {
        "lib/config": "/project/src/js/lib/config.js",
        react: "react",
        "styl/signin-dialog/signin-dialog.styl": "/project/src/styl/signin-dialog/signin-dialog.styl"
    } ],
    "/project/src/js/lib/elements/signin-dialog/index.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function a(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, l = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), c = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, u = e("react"), d = r(u), f = e("react-dom"), p = r(f), m = e("lib/config"), g = e("lib/util"), h = e("lib/dom"), v = e("lib/message"), b = r(v), y = e("./signin-dialog"), j = r(y), w = e("lib/tracking"), _ = e("lib/user"), x = r(_), E = e("emitter"), k = r(E), C = function(e) {
            function t(e) {
                var n = this, r = e.doc, a = e.container, l = e.view, u = void 0 === l ? "register" : l;
                i(this, t), c(Object.getPrototypeOf(t.prototype), "constructor", this).call(this), 
                this.loading = !1, this.dialogComponent = null, this.formData = {
                    name: null,
                    email: null,
                    password: null
                }, this.setView = function(e, t) {
                    "login_success" != e && (n.formData = n.getFormData("password")), ("login" == e || "register" == e) && (n.formData.password = null), 
                    n.forceValidation = !1, n.view = e, n.validation = {}, n.render(), "string" != typeof t && (t = void 0), 
                    n.dialogComponent.setFocus(e, t);
                }, this.validationMessages = {
                    fail: "Something went wrong. Please try again later.",
                    invalidUser: "Invalid email address/password combination.",
                    required: "Required",
                    shortPassword: "Must be >5 characters",
                    incorrectEmail: "Incorrect",
                    emailExists: 'Already in use. Do you need to <a data-view="login">Log in</a>?'
                }, this.onValidate = function(e) {
                    return function(t) {
                        n.validation[e] = n.validate(o({}, e, t))[e], delete n.validation.error, n.render();
                    };
                }, this.onSet = function(e) {
                    return function(t) {
                        n.formData = s({}, n.formData, o({}, e, t)), n.render();
                    };
                }, this.getFormData = function(e) {
                    var t = s({}, n.formData);
                    return t.hasOwnProperty(e) && delete t[e], t;
                }, this.onClose = function() {
                    n.emit("hide"), n.remove();
                }, this.onGoPremium = function() {
                    w.fire("upgrade-after-register"), b["default"].emitBackground("open-url", m.URLS.upgrade);
                }, this.onLogin = function() {
                    return n.onAuth("signin", n.getFormData("name"));
                }, this.onSignup = function() {
                    return n.onAuth("signup", n.getFormData());
                }, this.onForgotPassword = function() {
                    b["default"].emitBackground("open-url", m.URLS.resetPassword);
                }, this.onGoLogin = function(e) {
                    return n.setView("login", e);
                }, this.onGoRegister = function() {
                    return n.setView("register");
                }, this.onSubmit = function() {
                    n.loading || ("welcome" == n.view && n.onClose(), "login" == n.view && n.onLogin(), 
                    "register" == n.view && n.onSignup());
                }, this.onKey = function(e) {
                    delete n.validation.error, 27 == e.keyCode && n.onClose(), 13 == e.keyCode && n.onSubmit();
                }, this.doc = r, this.container = a, this.setView(u);
            }
            return a(t, e), l(t, [ {
                key: "validate",
                value: function(e) {
                    var t = this, n = Object.keys(e).reduce(function(n, r) {
                        var o = e[r];
                        return o && "" != o ? ("password" == r && "register" == t.view && o.length < 6 && (n[r] = t.validationMessages.shortPassword), 
                        "email" != r || g.isValidEmail(o) || (n[r] = t.validationMessages.incorrectEmail), 
                        n) : (n[r] = t.validationMessages.required, n);
                    }, {});
                    return n._valid = 0 == Object.keys(n).length, n;
                }
            }, {
                key: "extendWithServerValidation",
                value: function(e, t) {
                    return t.error ? (e._valid = !1, "already_exists" == t.error ? (e.email = this.validationMessages.emailExists, 
                    e) : "user_not_authorized" == t.error || "user_disabled" == t.error ? (e.error = this.validationMessages.invalidUser, 
                    e) : (e.error = this.validationMessages.fail, e)) : (e._valid = !0, e);
                }
            }, {
                key: "onAuth",
                value: function(e, t) {
                    var n, r;
                    return regeneratorRuntime.async(function(o) {
                        for (;;) switch (o.prev = o.next) {
                          case 0:
                            if (this.validation = this.validate(t), this.forceValidation = !0, !this.validation._valid) {
                                o.next = 18;
                                break;
                            }
                            return this.loading = !0, this.render(), n = void 0, o.prev = 6, o.next = 9, regeneratorRuntime.awrap(b["default"].promiseBackground(e, t));

                          case 9:
                            n = o.sent, o.next = 16;
                            break;

                          case 12:
                            o.prev = 12, o.t0 = o["catch"](6), o.t0.message && o.t0.message.includes("rejected by timeout") && w.call("felog.error", "stability.cant_connect_to_bg_page_during_login"), 
                            n = {
                                error: !0
                            };

                          case 16:
                            this.validation = this.extendWithServerValidation(this.validation, n), this.validation._valid || w.fire(e + "-error", this.validation);

                          case 18:
                            if (this.loading = !1, !this.validation._valid) {
                                o.next = 24;
                                break;
                            }
                            return r = "signup" == e ? "welcome" : "login_success", o.next = 23, regeneratorRuntime.awrap(x["default"].update());

                          case 23:
                            return o.abrupt("return", this.setView(r));

                          case 24:
                            this.render();

                          case 25:
                          case "end":
                            return o.stop();
                        }
                    }, null, this, [ [ 6, 12 ] ]);
                }
            }, {
                key: "checkContainer",
                value: function() {
                    this.container || (this.container = this.doc.createElement("signin_dialog"), this.doc.documentElement.appendChild(this.container), 
                    h.listen(this.doc.defaultView, "keydown", this.onKey));
                }
            }, {
                key: "render",
                value: function() {
                    this.checkContainer(), this.dialogComponent = p["default"].render(d["default"].createElement(j["default"], {
                        username: x["default"].firstName,
                        formData: this.formData,
                        onSet: this.onSet,
                        onGoPremium: this.onGoPremium,
                        onForgotPassword: this.onForgotPassword,
                        onSubmit: this.onSubmit,
                        onGoLogin: this.onGoLogin,
                        onGoRegister: this.onGoRegister,
                        onClose: this.onClose,
                        view: this.view,
                        validation: this.validation,
                        forceValidation: this.forceValidation,
                        onValidate: this.onValidate,
                        loading: this.loading
                    }), this.container);
                }
            }, {
                key: "remove",
                value: function() {
                    h.unlisten(this.doc.defaultView, "keydown", this.onKey), this.container.parentNode.removeChild(this.container);
                }
            } ]), t;
        }(g.createClass(k["default"]));
        n["default"] = C, t.exports = n["default"];
    }, {
        "./signin-dialog": "/project/src/js/lib/elements/signin-dialog/signin-dialog.js",
        emitter: "emitter",
        "lib/config": "/project/src/js/lib/config.js",
        "lib/dom": "/project/src/js/lib/dom.js",
        "lib/message": "/project/src/js/lib/message.js",
        "lib/tracking": "/project/src/js/lib/tracking/index.js",
        "lib/user": "/project/src/js/lib/user.js",
        "lib/util": "/project/src/js/lib/util.js",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/elements/signin-dialog/input.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), s = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, l = e("react"), c = r(l), u = e("lib/util"), d = e("styl/signin-dialog/input.styl"), f = r(d), p = function(e) {
            function t() {
                var e = this;
                o(this, t), s(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments), 
                this.id = u.guid(), this.state = {
                    cancelValidation: !0,
                    dirty: !1
                }, this.onBlur = function() {
                    e.setState({
                        cancelValidation: !1
                    }), e.props.onValidate(e.value);
                }, this.onChange = function() {
                    e.setState({
                        cancelValidation: !0,
                        dirty: !0
                    }), e.props.onSet(e.value);
                };
            }
            return i(t, e), a(t, [ {
                key: "getValidation",
                value: function() {
                    return (this.props.validation && !this.state.cancelValidation && this.state.dirty || this.props.forceValidation) && c["default"].createElement("div", {
                        className: f["default"].validation,
                        dangerouslySetInnerHTML: {
                            __html: this.props.validation
                        }
                    });
                }
            }, {
                key: "render",
                value: function() {
                    var e = this.props, t = e.name, n = e.type, r = e.label, o = e.value, i = {
                        name: t,
                        type: n,
                        value: o,
                        id: this.id,
                        ref: "input",
                        required: "required",
                        onBlur: this.onBlur,
                        onChange: this.onChange,
                        className: f["default"].input_element
                    };
                    return c["default"].createElement("div", {
                        className: f["default"].input
                    }, this.getValidation(), c["default"].createElement("input", i), c["default"].createElement("label", {
                        htmlFor: this.id,
                        className: f["default"].label
                    }, r));
                }
            }, {
                key: "value",
                get: function() {
                    return this.refs.input.value;
                }
            } ]), t;
        }(c["default"].Component);
        n["default"] = p, t.exports = n["default"];
    }, {
        "lib/util": "/project/src/js/lib/util.js",
        react: "react",
        "styl/signin-dialog/input.styl": "/project/src/styl/signin-dialog/input.styl"
    } ],
    "/project/src/js/lib/elements/signin-dialog/login-success.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), s = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, l = e("react"), c = r(l), u = e("styl/signin-dialog/signin-dialog.styl"), d = r(u), f = function(e) {
            function t() {
                o(this, t), s(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments);
            }
            return i(t, e), a(t, [ {
                key: "render",
                value: function() {
                    var e = this;
                    return this.props.isAutoClose && setTimeout(function() {
                        return e.props.onClose && e.props.onClose();
                    }, 1500), this.props.username ? c["default"].createElement("div", {
                        className: d["default"].login_success_label
                    }, "Welcome back, ", c["default"].createElement("span", {
                        className: d["default"].login_name
                    }, this.props.username), "!") : c["default"].createElement("div", {
                        className: d["default"].login_success_label
                    }, "Welcome back!");
                }
            } ]), t;
        }(c["default"].Component);
        n["default"] = f, t.exports = n["default"];
    }, {
        react: "react",
        "styl/signin-dialog/signin-dialog.styl": "/project/src/styl/signin-dialog/signin-dialog.styl"
    } ],
    "/project/src/js/lib/elements/signin-dialog/login.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, s = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), l = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, c = e("react"), u = r(c), d = e("styl/signin-dialog/signin-dialog.styl"), f = r(d), p = e("./fieldset"), m = r(p), g = e("./button"), h = r(g), v = function(e) {
            function t() {
                o(this, t), l(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments), 
                this.fields = [ "email", "password" ];
            }
            return i(t, e), s(t, [ {
                key: "setFocus",
                value: function(e) {
                    this.refs.fieldset.setFocus(e);
                }
            }, {
                key: "render",
                value: function() {
                    return u["default"].createElement("form", null, u["default"].createElement("div", {
                        className: f["default"].title
                    }, "Member Login"), u["default"].createElement(m["default"], a({
                        ref: "fieldset",
                        fields: this.fields
                    }, this.props)), u["default"].createElement(h["default"], {
                        loading: this.props.loading,
                        text: "Log In",
                        onClick: this.props.onSubmit
                    }), u["default"].createElement("div", {
                        className: f["default"].navigation
                    }, u["default"].createElement("span", {
                        onClick: this.props.onGoRegister,
                        className: f["default"].navigation_item
                    }, "Don’t have an account?"), u["default"].createElement("span", {
                        className: f["default"].navigation_split
                    }, "·"), u["default"].createElement("a", {
                        onClick: this.props.onForgotPassword,
                        className: f["default"].navigation_item
                    }, "Forgot password?")));
                }
            } ]), t;
        }(u["default"].Component);
        n["default"] = v, t.exports = n["default"];
    }, {
        "./button": "/project/src/js/lib/elements/signin-dialog/button.js",
        "./fieldset": "/project/src/js/lib/elements/signin-dialog/fieldset.js",
        react: "react",
        "styl/signin-dialog/signin-dialog.styl": "/project/src/styl/signin-dialog/signin-dialog.styl"
    } ],
    "/project/src/js/lib/elements/signin-dialog/register.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, s = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), l = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, c = e("react"), u = r(c), d = e("styl/signin-dialog/signin-dialog.styl"), f = r(d), p = e("./fieldset"), m = r(p), g = e("./button"), h = r(g), v = e("./footer"), b = r(v), y = function(e) {
            function t() {
                o(this, t), l(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments), 
                this.fields = [ "name", "email", "password" ];
            }
            return i(t, e), s(t, [ {
                key: "setFocus",
                value: function(e) {
                    this.refs.fieldset.setFocus(e);
                }
            }, {
                key: "render",
                value: function() {
                    return u["default"].createElement("form", null, u["default"].createElement("div", {
                        className: f["default"].title
                    }, "Create an Account"), u["default"].createElement(m["default"], a({
                        ref: "fieldset",
                        fields: this.fields
                    }, this.props)), u["default"].createElement(h["default"], {
                        loading: this.props.loading,
                        onClick: this.props.onSubmit,
                        text: "Sign Up"
                    }), u["default"].createElement("div", {
                        className: f["default"].navigation
                    }, u["default"].createElement("span", {
                        onClick: this.props.onGoLogin,
                        className: f["default"].navigation_item
                    }, "Already have an account?")), u["default"].createElement(b["default"], null));
                }
            } ]), t;
        }(u["default"].Component);
        n["default"] = y, t.exports = n["default"];
    }, {
        "./button": "/project/src/js/lib/elements/signin-dialog/button.js",
        "./fieldset": "/project/src/js/lib/elements/signin-dialog/fieldset.js",
        "./footer": "/project/src/js/lib/elements/signin-dialog/footer.js",
        react: "react",
        "styl/signin-dialog/signin-dialog.styl": "/project/src/styl/signin-dialog/signin-dialog.styl"
    } ],
    "/project/src/js/lib/elements/signin-dialog/signin-dialog.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function a(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), l = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, c = e("react"), u = r(c), d = e("lib/util"), f = e("lib/dom"), p = e("./login"), m = r(p), g = e("./welcome"), h = r(g), v = e("./register"), b = r(v), y = e("./login-success"), j = r(y), w = e("styl/signin-dialog/signin-dialog.styl"), _ = r(w), x = function(e) {
            function t() {
                var e = this;
                i(this, t), l(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments), 
                this.state = {
                    hide: !1
                }, this.previousView = "register", this.onClick = function(t) {
                    return "login_success" == e.props.view ? e.onClose(t) : (f.matchesSelector(t.target, "." + _["default"].content + ", ." + _["default"].content + " *") || e.onClose(t), 
                    void ("login" == t.target.dataset.view && e.props.onGoLogin("password")));
                }, this.onClose = function(t) {
                    t && t.stopPropagation(), e.setState({
                        hide: !0
                    }), setTimeout(function() {
                        return e.props.onClose(t);
                    }, 400);
                }, this.viewClass = function(e) {
                    return _["default"]["view_" + e];
                };
            }
            return a(t, e), s(t, [ {
                key: "setFocus",
                value: function(e, t) {
                    ("register" == e || "login" == e) && this.refs[e].setFocus(t);
                }
            }, {
                key: "render",
                value: function() {
                    var e, t = this.previousView, n = this.props.view, r = f.cs((e = {}, o(e, this.viewClass(n), !0), 
                    o(e, "keep_" + this.viewClass(t), !0), o(e, _["default"].signin_dialog, !0), o(e, _["default"].loading, this.props.loading), 
                    o(e, _["default"].hide, this.state.hide), o(e, _["default"].windows, d.isWindows()), 
                    e)), i = "login_success" == n && this.previousView != n;
                    return this.previousView = n, u["default"].createElement("div", {
                        ref: "dialogEl",
                        onClick: this.onClick,
                        className: r
                    }, u["default"].createElement("div", {
                        className: _["default"].content
                    }, u["default"].createElement("div", {
                        className: _["default"].validation
                    }, this.props.validation.error), u["default"].createElement("div", {
                        className: _["default"].btn_close,
                        onClick: this.onClose
                    }), u["default"].createElement("div", {
                        className: _["default"].view_container
                    }, u["default"].createElement("div", {
                        className: _["default"].view + " " + _["default"].register
                    }, u["default"].createElement(b["default"], {
                        ref: "register",
                        formData: this.props.formData,
                        onSet: this.props.onSet,
                        validation: this.props.validation,
                        onValidate: this.props.onValidate,
                        forceValidation: this.props.forceValidation,
                        loading: this.props.loading,
                        onSubmit: this.props.onSubmit,
                        onGoLogin: this.props.onGoLogin
                    })), u["default"].createElement("div", {
                        className: _["default"].view + " " + _["default"].login
                    }, u["default"].createElement(m["default"], {
                        ref: "login",
                        formData: this.props.formData,
                        onSet: this.props.onSet,
                        validation: this.props.validation,
                        onValidate: this.props.onValidate,
                        forceValidation: this.props.forceValidation,
                        loading: this.props.loading,
                        onSubmit: this.props.onSubmit,
                        onGoRegister: this.props.onGoRegister,
                        onForgotPassword: this.props.onForgotPassword
                    })), u["default"].createElement("div", {
                        className: _["default"].view + " " + _["default"].welcome
                    }, u["default"].createElement(h["default"], {
                        isShow: "welcome" == n,
                        onGoPremium: this.props.onGoPremium,
                        onClose: this.props.onClose
                    })), u["default"].createElement("div", {
                        className: _["default"].view + " " + _["default"].login_success
                    }, u["default"].createElement(j["default"], {
                        username: this.props.username,
                        isAutoClose: i,
                        onClose: this.onClose
                    })))));
                }
            } ]), t;
        }(u["default"].Component);
        n["default"] = x, t.exports = n["default"];
    }, {
        "./login": "/project/src/js/lib/elements/signin-dialog/login.js",
        "./login-success": "/project/src/js/lib/elements/signin-dialog/login-success.js",
        "./register": "/project/src/js/lib/elements/signin-dialog/register.js",
        "./welcome": "/project/src/js/lib/elements/signin-dialog/welcome.js",
        "lib/dom": "/project/src/js/lib/dom.js",
        "lib/util": "/project/src/js/lib/util.js",
        react: "react",
        "styl/signin-dialog/signin-dialog.styl": "/project/src/styl/signin-dialog/signin-dialog.styl"
    } ],
    "/project/src/js/lib/elements/signin-dialog/welcome.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function a(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, l = e("react"), c = r(l), u = e("styl/signin-dialog/welcome.styl"), d = r(u), f = e("lib/dom"), p = e("lib/util"), m = e("./button"), g = r(m), h = function(e) {
            function t() {
                var e = this;
                i(this, t), s(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments), 
                this.render = function() {
                    var t, n = f.cs((t = {}, o(t, d["default"].welcome, !0), o(t, d["default"].show, e.props.isShow), 
                    o(t, d["default"].windows, p.isWindows()), t));
                    return c["default"].createElement("div", {
                        className: n
                    }, c["default"].createElement("div", {
                        className: d["default"].image
                    }), c["default"].createElement("div", {
                        className: d["default"].content
                    }, c["default"].createElement("div", {
                        className: d["default"].title
                    }, "Welcome to Grammarly"), c["default"].createElement("div", {
                        className: d["default"].text
                    }, "Wave good-bye to the most frequent and pesky ", c["default"].createElement("br", null), "writing mistakes."), c["default"].createElement("div", {
                        className: d["default"].go_premium
                    }, c["default"].createElement("span", {
                        className: d["default"].checks
                    }, "Go Premium and get 150+ additional", c["default"].createElement("br", null), "advanced checks."), " ", c["default"].createElement("a", {
                        onClick: e.props.onGoPremium,
                        className: d["default"].learn_more
                    }, "Learn more")), c["default"].createElement("div", {
                        className: d["default"].close
                    }, c["default"].createElement(g["default"], {
                        onClick: e.props.onClose,
                        text: "Continue to Your Text"
                    }))));
                };
            }
            return a(t, e), t;
        }(c["default"].Component);
        n["default"] = h, t.exports = n["default"];
    }, {
        "./button": "/project/src/js/lib/elements/signin-dialog/button.js",
        "lib/dom": "/project/src/js/lib/dom.js",
        "lib/util": "/project/src/js/lib/util.js",
        react: "react",
        "styl/signin-dialog/welcome.styl": "/project/src/styl/signin-dialog/welcome.styl"
    } ],
    "/project/src/js/lib/elements/signin.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t() {
                return f.renderReactWithParent(a["default"].createElement(m, null), l, u);
            }
            function n(e) {
                o(), e.stopPropagation(e);
            }
            function r(e) {
                27 == e.keyCode && o();
            }
            function o() {
                d.style.opacity = 0, f.removeClass(d, "gr-_show"), f.unlisten(i.body, "keydown", r), 
                f.unlisten(d, "click", n), g.emit("hide");
            }
            var i = e.doc, l = i.documentElement, u = p.guid(), d = i.querySelector(".gr-_signin");
            d || (d = s.findDOMNode(t().component)), d.style.opacity = 0, f.addClass(d, "gr-_show"), 
            f.listen(i.body, "keydown", r), f.listen(d, "click", n), setTimeout(function() {
                return d.style.opacity = 1;
            }, 50);
            var g = c["default"]({});
            return g;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("react"), a = r(i), s = e("react-dom"), l = e("emitter"), c = r(l), u = e("./signin-component"), d = r(u), f = e("../dom"), p = e("../util");
        n["default"] = o;
        var m = a["default"].createClass({
            displayName: "SigninDialog",
            render: function() {
                var e = {
                    width: 476,
                    height: 323,
                    border: 0,
                    background: "white"
                };
                return a["default"].createElement("div", {
                    className: "gr-_signin",
                    style: {
                        opacity: 0
                    }
                }, a["default"].createElement("div", {
                    className: "gr-_dialog-content",
                    style: e
                }, a["default"].createElement(d["default"], null)));
            }
        });
        t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../util": "/project/src/js/lib/util.js",
        "./signin-component": "/project/src/js/lib/elements/signin-component.js",
        emitter: "emitter",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/elements/tooltip.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o() {
            function e() {
                p.fastHide();
            }
            function t(e) {
                var t = e.target;
                return u.inEl(t, s.posEl);
            }
            function n() {
                s.posEl && (d.parentNode && d.parentNode.removeChild(d), u.unlisten(s.doc, "scroll", e), 
                u.unlisten(s.moveListenerDoc, "scroll", e));
            }
            function r() {
                m && (m = !1, d.style.opacity = 0, d.style.top = "-9999px", p && p.setVisible(!1), 
                u.removeClass(d, s.cls), console.log("hide tooltip"));
            }
            function o() {
                s.cls += " gr-no-transition", i(), setTimeout(function() {
                    s.cls = s.cls.replace(" gr-no-transition", ""), u.removeClass(d, "gr-no-transition");
                }, 100);
            }
            function i() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? s : arguments[0], t = e.posEl, n = void 0 === t ? s.posEl : t, r = e.html, o = void 0 === r ? s.html : r, i = e.text, l = void 0 === i ? s.text : i, h = e.cls, v = void 0 === h ? s.cls : h, b = e.doc, y = void 0 === b ? s.doc : b, j = e.outerIframe, w = void 0 === j ? s.outerIframe : j;
                if (a["default"].extend(s, {
                    posEl: n,
                    html: o,
                    text: l,
                    cls: v,
                    doc: y,
                    outerIframe: w
                }), g) {
                    m = !0, p && p.setVisible(!0), l && d.setAttribute("data-content", l), o && (f.innerHTML = o), 
                    d.className = "gr__tooltip", v && u.addClass(d, v), u.removeClass(d, "gr__flipped");
                    var _ = c.getAbsRect(n, w), x = c.posToRect(d, _), E = x.rect, k = E.top, C = E.left;
                    u.css(d, {
                        top: k,
                        left: C
                    }), x && x.rect && !x.rect.flip && u.addClass(d, "gr__flipped");
                    var O = d.clientWidth, P = d.querySelector(".gr__triangle"), T = _.width / 2;
                    T > O && (T = 0), x.delta.right <= 0 && (T -= x.delta.right), T -= parseInt(getComputedStyle(d, null).getPropertyValue("margin-left")), 
                    P.style.marginLeft = parseInt(T) + "px", d.style.opacity = 1;
                }
            }
            var s = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0], d = document.querySelector(".gr__tooltip"), f = void 0, p = void 0, m = void 0, g = void 0 != s.enabled ? s.enabled : !0;
            if (d || (d = u.createEl('<span class="gr__tooltip"><span class="gr__tooltip-content"></span><i class="gr__tooltip-logo"></i><span class="gr__triangle"></span></span>'), 
            document.documentElement.appendChild(d)), f = d.querySelector(".gr__tooltip-content"), 
            s.posEl) {
                var h = s.outerIframe && s.outerIframe.contentDocument || s.doc;
                p = new l["default"]({
                    doc: h,
                    doc2: s.doc,
                    hint: d,
                    hideDelay: 500,
                    delay: 0,
                    onshow: i,
                    onhide: r,
                    inTarget: t
                }), u.listen(s.doc, "scroll", e), u.listen(h, "scroll", e), p.bind();
            }
            var v = {
                show: i,
                fastShow: o,
                hide: r,
                remove: n,
                el: d,
                enable: function() {
                    g = !0;
                },
                disable: function() {
                    g = !1;
                },
                isEnabled: function() {
                    return g;
                }
            };
            return v;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("lodash"), a = r(i), s = e("./hint"), l = r(s), c = e("../position"), u = e("../dom");
        n["default"] = o, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../position": "/project/src/js/lib/position.js",
        "./hint": "/project/src/js/lib/elements/hint.js",
        lodash: "lodash"
    } ],
    "/project/src/js/lib/external.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            var t = document.createElement("script");
            t.innerHTML = e, document.head.appendChild(t), t.parentNode.removeChild(t);
        }
        function i() {
            u.initContentScript(), o("window.GR_EXTENSION_ID='" + c.getUuid() + "'"), o("\n    window.GR_EXTENSION_SEND = function(key, data) {\n      if (!key) throw new TypeError('cant be called without message')\n      var e = document.createEvent('CustomEvent')\n      e.initCustomEvent('external:' + key, true, true, data)\n      document.dispatchEvent(e)\n    }\n  "), 
            c.externalEvents.map(function(e) {
                return "external:" + e;
            }).forEach(function(e) {
                return a.on.call(document, e, function(t) {
                    var n = t.detail;
                    console.log("external event", e, n), l["default"].emitBackground(e, n);
                });
            });
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        }), n["default"] = i;
        var a = e("./dom"), s = e("./message"), l = r(s), c = e("./config"), u = e("./tracking/index");
        t.exports = n["default"];
    }, {
        "./config": "/project/src/js/lib/config.js",
        "./dom": "/project/src/js/lib/dom.js",
        "./message": "/project/src/js/lib/message.js",
        "./tracking/index": "/project/src/js/lib/tracking/index.js"
    } ],
    "/project/src/js/lib/failover.js": [ function(e, t, n) {
        "use strict";
        function r() {
            function e() {
                setTimeout(a, l), i.index_load = !1;
            }
            function t() {
                setTimeout(s, c), i.app_load = !1;
            }
            function n(e) {
                i[e] = !0;
            }
            function r(e, t) {
                i[e] ? o.call("statsc.ui.increment", "stability:" + t + "_success") : (o.call("statsc.ui.increment", "stability:" + t + "_timeout"), 
                o.call("felog.error", "stability:" + t + "_timeout"));
            }
            function a() {
                r("index_load", "extension_loading");
            }
            function s() {
                r("app_load", "extension_app_loading");
            }
            var l = 12e4, c = 12e4, u = {
                startPageLoadTimer: e,
                startAppLoadTimer: t,
                success: n,
                setPageLoadTimeout: function(e) {
                    return l = e;
                },
                setAppLoadTimeout: function(e) {
                    return c = e;
                }
            };
            return u;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("./tracking"), i = {};
        n["default"] = r(), t.exports = n["default"];
    }, {
        "./tracking": "/project/src/js/lib/tracking/index.js"
    } ],
    "/project/src/js/lib/forge.js": [ function(e, t, n) {
        (function(e) {
            "use strict";
            Object.defineProperty(n, "__esModule", {
                value: !0
            }), n["default"] = "undefined" != typeof window ? window.forge : "undefined" != typeof e ? e.forge : null, 
            t.exports = n["default"];
        }).call(this, "undefined" != typeof window ? window : {});
    }, {} ],
    "/project/src/js/lib/infinity-checker.js": [ function(e, t, n) {
        "use strict";
        function r(e, t) {
            function n() {
                r(), u = setTimeout(m, s), d = setTimeout(m, 1e3 * l[0]), f = setTimeout(m, 1e3 * l[1]), 
                p = setTimeout(m, 1e3 * l[2]);
            }
            function r() {
                clearTimeout(u), clearTimeout(d), clearTimeout(f), clearTimeout(p);
            }
            var s = arguments.length <= 2 || void 0 === arguments[2] ? i : arguments[2], l = arguments.length <= 3 || void 0 === arguments[3] ? [ 30, 60, 120 ] : arguments[3], c = 0, u = void 0, d = void 0, f = void 0, p = void 0, m = function g() {
                return a > c ? (s == i && e(), u = setTimeout(g, s), void c++) : (o.call("felog.error", "infinity_check_reset_fail", {
                    delay: s
                }), void console.error("Infinity check reset fails, change to the offline state."));
            };
            return {
                start: n,
                finish: r
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        }), n["default"] = r;
        var o = e("./tracking/index"), i = 2e4, a = 3;
        t.exports = n["default"];
    }, {
        "./tracking/index": "/project/src/js/lib/tracking/index.js"
    } ],
    "/project/src/js/lib/location.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o() {
            return new Promise(function(e) {
                var t = setTimeout(function() {
                    return g["default"].tabs.getCurrentTabUrl(e);
                }, 2e3);
                g["default"].tabs.getCurrentTabUrl(function(n) {
                    clearTimeout(t), e(n);
                });
            });
        }
        function i(e, t) {
            return h.isFunction(e) && (t = e, e = ""), t ? !h.isBgOrPopup() && g["default"] ? void p["default"].emitBackground("get-domain", {}, t) : void (g["default"] && g["default"].tabs ? o().then(function(e) {
                return t(l(e));
            }) : t(s(e))) : s(e);
        }
        function a(e) {
            return !h.isBgOrPopup() && g["default"] ? p["default"].promiseBackground("get-domain") : g["default"] && g["default"].tabs ? Promise.race([ o().then(l), h.delay(1e4).then(function() {
                throw new Error("Request to forge.tabs.getCurrentTabUrl rejected by timeout");
            }) ]) : s(e);
        }
        function s(e) {
            var t = e && e.ownerDocument || document, n = t.location || t.defaultView.location;
            return n ? c(n.hostname) : "";
        }
        function l(e) {
            var t = document.createElement("a");
            return t.href = e, c(t.hostname);
        }
        function c(e) {
            return e.replace("www.", "");
        }
        function u(e) {
            var t = e && e.ownerDocument || document, n = t.location || t.defaultView.location;
            return n ? n.pathname + n.search : "";
        }
        function d() {
            for (var e = new RegExp("^(?:[a-z]+:)?//", "i"), t = "", n = document.getElementsByTagName("link"), r = 0; r < n.length; r++) {
                var o = n[r], i = '"' + o.getAttribute("rel") + '"', a = /(\"icon )|( icon\")|(\"icon\")|( icon )/i;
                -1 != i.search(a) && (t = o.getAttribute("href"));
            }
            return t || (t = "favicon.ico"), e.test(t) ? t : "/" != t[0] ? "//" + document.location.host + document.location.pathname + t : "//" + document.location.host + t;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var f = e("./message"), p = r(f), m = e("./forge"), g = r(m), h = e("./util");
        n["default"] = {
            getDomain: i,
            currentUrl: o,
            promiseGetDomain: a,
            domainFromUrl: l,
            getFavicon: d,
            getUrl: u
        }, t.exports = n["default"];
    }, {
        "./forge": "/project/src/js/lib/forge.js",
        "./message": "/project/src/js/lib/message.js",
        "./util": "/project/src/js/lib/util.js"
    } ],
    "/project/src/js/lib/message.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            function n() {
                a(e, n);
                for (var r = arguments.length, o = Array(r), i = 0; r > i; i++) o[i] = arguments[i];
                t.apply(this, o);
            }
            i(e, n);
        }
        function i(e, t, n, r) {
            if ("__bgerror" == e) return b.on("__bgerror", t);
            var o = y[e] = y[e] || [];
            if (!o.length) try {
                h["default"].message.listen(e, function(e, t) {
                    var n = !0, r = !1, i = void 0;
                    try {
                        for (var a, s = o[Symbol.iterator](); !(n = (a = s.next()).done); n = !0) {
                            var l = a.value;
                            l(e, t);
                        }
                    } catch (c) {
                        r = !0, i = c;
                    } finally {
                        try {
                            !n && s["return"] && s["return"]();
                        } finally {
                            if (r) throw i;
                        }
                    }
                }, n, r);
            } catch (i) {
                j(i);
            }
            o.push(t);
        }
        function a(e, t) {
            if ("__bgerror" == e) return b.off("__bgerror", t);
            var n = y[e];
            if (n) {
                var r = n.indexOf(t);
                -1 != r && n.splice(r, 1), 0 == n.length && delete y[e];
            }
        }
        function s(e, t, n, r) {
            void 0 === t && (t = {});
            try {
                h["default"].message.broadcast(e, t, n, r);
            } catch (o) {
                j(o);
            }
        }
        function l(e, t, n, r) {
            try {
                h["default"].message.toFocussed(e, t, n, r);
            } catch (o) {
                j(o);
            }
        }
        function c(e, t, n, r) {
            try {
                h["default"].message.broadcastBackground(e, t, n, r);
            } catch (o) {
                j(o);
            }
        }
        function u(e) {
            var t = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1], n = arguments.length <= 2 || void 0 === arguments[2] ? 1e4 : arguments[2], r = new Promise(function(n, r) {
                try {
                    h["default"].message.broadcastBackground(e, t, n, r);
                } catch (o) {
                    r(o), j(o);
                }
            });
            return Promise.race([ r, v.delay(n).then(function() {
                throw new Error("Request to bg page (" + e + ") rejected by timeout");
            }) ]);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var d = e("lodash"), f = r(d), p = e("emitter"), m = r(p), g = e("./forge"), h = r(g), v = e("./util"), b = m["default"]({}), y = {}, j = f["default"].throttle(function(e) {
            return b.emit("__bgerror", e);
        }, 1e3);
        n["default"] = {
            on: i,
            one: o,
            off: a,
            emitError: j,
            emitTabs: s,
            emitFocusedTab: l,
            emitBackground: c,
            promiseBackground: u
        }, t.exports = n["default"];
    }, {
        "./forge": "/project/src/js/lib/forge.js",
        "./util": "/project/src/js/lib/util.js",
        emitter: "emitter",
        lodash: "lodash"
    } ],
    "/project/src/js/lib/old/btn-hover-menu.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t(e) {
                if (!_.isOffline()) {
                    var t = e.target, n = C.selectorAll(C.classSelector(M("plus-empty")), C.classSelector(M("plus")));
                    if (!C.parentHasClass(t, S("line-referral"))) {
                        if (C.matchesSelector(t, n) && !O.premium) {
                            var r = f["default"].getUpgradeUrlFromMatches({
                                baseUrl: g.URLS.upgrade,
                                returnUrl: "",
                                appType: "popup",
                                matches: _.getMatches()
                            });
                            return w.fire("upgrade", "button_hover", j.getDomain()), y["default"].emitBackground("open-url", r);
                        }
                        _.showDialog({
                            caller: "button_hover"
                        }), setTimeout(c, 200), w.call("mixpanel.track", "Ext:Gbutton_Clicked", {
                            domain: j.getDomain()
                        }), v["default"].start("open_editor"), w.call("statsc.ui.increment", "stability:editor.open_from_button"), 
                        w.call("felog.event", "g_button_hover_open_popup");
                    }
                }
            }
            function n(e) {
                var t = C.resolveEl(e.target, m["default"].baseCls);
                if (t && t != b) return c();
                if (C.hasClass(b, m["default"].cls("offline"))) return c();
                var n = C.resolveEl(e.target, T);
                return t || n == D ? void i() : c();
            }
            function r(e) {
                O = e, o(), V();
            }
            function o() {
                var e = O, t = e.premium, n = u["default"].render(l["default"].createElement(N, {
                    premium: t,
                    critical: e.critical,
                    plus: e.plus,
                    opened: I
                }), A);
                return I && s(), n;
            }
            function i() {
                B && (I || (A.style.visibility = "hidden", I = !0, o(), w.call("felog.info", "g_button_hover_show"), 
                w.call("gnar.send", k.getBrowser() + "Ext/gButtonHover", {
                    pageDomain: j.getDomain()
                })));
            }
            function s() {
                var e = R.clientWidth, t = R.clientHeight, n = 38, r = E.getAbsRect(b);
                a["default"].extend(r, {
                    marginLeft: n - e,
                    marginTop: n - t,
                    width: e,
                    height: t
                }), L = L || {}, L.top != r.top || L.left != r.left ? (L = r, C.addClass(A, "no-transition"), 
                C.removeClass(D, S("show")), D.style.cssText = F(a["default"].extend(r, U)), setTimeout(s, 10)) : (C.removeClass(A, "no-transition"), 
                C.addClass(D, S("show")), D.style.cssText = F(r), A.style.visibility = ""), L = r;
            }
            function c() {
                if (I) {
                    var e = E.getAbsRect(b);
                    a["default"].extend(e, U), D.style.cssText = F(e), D.style.zIndex = "-1", I = !1, 
                    o(), C.isVisible(b) || p();
                }
            }
            function d() {
                C.listen(P.documentElement, "mousemove", n), _.on("iframe-mousemove", n);
            }
            function p(e) {
                (!I || e) && (C.unlisten(P.documentElement, "mousemove", n), _.off("iframe-mousemove", n));
            }
            function h() {
                p(), C.unlisten(D, "click", t), D.parentNode && D.parentNode.removeChild(D);
            }
            var b = e.el, _ = e.editor, O = {
                critical: 0,
                plus: 0
            }, P = b.ownerDocument, A = P.createElement("div"), D = u["default"].findDOMNode(o()), R = D.firstElementChild, I = void 0, B = !0, L = void 0;
            C.addClass(A, "gr-top-z-index"), C.addClass(A, "gr-top-zero"), P.documentElement.insertBefore(A, P.body), 
            C.unlisten(D, "click", t), p(!0), C.listen(D, "click", t), d();
            var F = a["default"].template("width:  <%= width %>px; height: <%= height %>px; margin-left: <%= marginLeft %>px; margin-top: <%= marginTop %>px;top: <%= top %>px; left: <%= left %>px;visibility: visible;"), U = {
                width: 24,
                height: 24,
                marginLeft: 0,
                marginTop: 0
            }, z = function(e) {
                return a["default"].chain(e).groupBy(function(e) {
                    var t = (e.critical, e.plus, e.premium), n = e.editorId;
                    return [ t, n ].join("");
                }).map(function(e) {
                    return e.pop();
                }).each(function(e) {
                    return w.call("statsc.ui.increment", "activity:errors_update");
                });
            }, H = x["default"](z, 1e4), V = a["default"].throttle(function() {
                return H.push(a["default"].extend({}, O, {
                    editorId: _.id
                }));
            }, 1e3);
            return {
                update: r,
                remove: h,
                show: i,
                bind: d,
                unbind: p,
                isOpened: function() {
                    return I;
                },
                disable: function() {
                    return B = !1;
                },
                enable: function() {
                    return B = !0;
                }
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("lodash"), a = r(i), s = e("react"), l = r(s), c = e("react-dom"), u = r(c), d = e("grammarly-editor"), f = r(d), p = e("./textarea-btn"), m = r(p), g = e("../config"), h = e("../timers"), v = r(h), b = e("../message"), y = r(b), j = e("../location"), w = e("../tracking/index"), _ = e("../tracking/cargo"), x = r(_), E = e("../position"), k = e("../util"), C = e("../dom"), O = e("./referral_line"), P = r(O), T = "gr-btn-hover-menu", S = function(e) {
            return T + "_" + e;
        }, M = function(e) {
            return S("line") + " " + S("line-" + e);
        }, A = function(e) {
            return S("btn") + " " + S("btn-" + e);
        };
        n["default"] = o;
        var N = l["default"].createClass({
            displayName: "HoveMenuComponent",
            render: function() {
                var e = this.props, t = C.cs({
                    show: e.opened,
                    "premium-user": e.premium,
                    "freemium-user": !e.premium,
                    "critical-empty": !e.critical,
                    "plus-empty": !e.plus,
                    "plus-present": e.plus,
                    _10: e.plus > 9 || e.critical > 9,
                    _100: e.plus > 99 || e.critical > 99
                }, S), n = function(e) {
                    return k.declension(e, [ "issue", "issues", "issues" ]);
                };
                return l["default"].createElement("div", {
                    className: T + " " + t
                }, l["default"].createElement("div", {
                    className: S("wrap")
                }, l["default"].createElement(P["default"], null), l["default"].createElement("div", {
                    className: M("plus")
                }, l["default"].createElement("div", {
                    className: S("count")
                }, e.plus), l["default"].createElement("div", {
                    className: S("lbl")
                }, l["default"].createElement("div", {
                    className: S("lbl-wrap")
                }, l["default"].createElement("div", {
                    className: S("menu-plus")
                }, "ADVANCED"), " ", l["default"].createElement("br", null), l["default"].createElement("div", {
                    className: S("plus-lbl")
                }, n(e.plus)))), l["default"].createElement("div", {
                    className: A("upgrade")
                }, "Learn more")), l["default"].createElement("div", {
                    className: M("plus-empty")
                }, l["default"].createElement("div", {
                    className: S("lbl")
                }, l["default"].createElement("div", {
                    className: S("lbl-wrap")
                }, "No ", l["default"].createElement("div", {
                    className: S("menu-plus")
                }, "ADVANCED"), l["default"].createElement("br", null), " issues")), l["default"].createElement("div", {
                    className: A("upgrade")
                }, "Learn more")), l["default"].createElement("div", {
                    className: M("critical")
                }, l["default"].createElement("div", {
                    className: S("count")
                }, e.critical), l["default"].createElement("div", {
                    className: S("lbl")
                }, l["default"].createElement("div", {
                    className: S("lbl-wrap")
                }, "critical ", l["default"].createElement("br", null), l["default"].createElement("div", null, n(e.critical)))), l["default"].createElement("div", {
                    className: A("critical")
                }, "Correct")), l["default"].createElement("div", {
                    className: M("critical-empty")
                }, l["default"].createElement("div", {
                    className: S("lbl")
                }, l["default"].createElement("div", {
                    className: S("lbl-wrap")
                }, "No critical", l["default"].createElement("br", null), " issues")), l["default"].createElement("div", {
                    className: A("critical")
                }, "Open Grammarly"))));
            }
        });
        t.exports = n["default"];
    }, {
        "../config": "/project/src/js/lib/config.js",
        "../dom": "/project/src/js/lib/dom.js",
        "../location": "/project/src/js/lib/location.js",
        "../message": "/project/src/js/lib/message.js",
        "../position": "/project/src/js/lib/position.js",
        "../timers": "/project/src/js/lib/timers.js",
        "../tracking/cargo": "/project/src/js/lib/tracking/cargo.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../util": "/project/src/js/lib/util.js",
        "./referral_line": "/project/src/js/lib/old/referral_line.js",
        "./textarea-btn": "/project/src/js/lib/old/textarea-btn.js",
        "grammarly-editor": "grammarly-editor",
        lodash: "lodash",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/old/btn-pos.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("lodash"), i = r(o), a = e("emitter"), s = r(a), l = e("../sites"), c = r(l), u = e("../window-events"), d = r(u), f = e("../position"), p = e("../util"), m = e("../dom"), g = function(e) {
            function t() {
                setTimeout(o, 10);
            }
            function n() {
                m.isFocused(_) && o();
            }
            function r() {
                try {
                    var e = f.getPos(E), t = e.x != k.x || e.y != k.y;
                    (M != j.clientWidth || A != j.clientHeight || t) && (k = e, o());
                } catch (n) {
                    console.log(n), p.cancelInterval(r, 200);
                }
            }
            function o() {
                var e = {};
                if (T && S) return R.emit("update", {
                    addClass: "show",
                    visibility: ""
                });
                R.emit("update", {
                    addClass: "show",
                    visibility: "hidden"
                });
                var t = f.getAbsRect(E), n = f.getAbsRect(b), r = m.compStyle(E, "border-top-width", "border-left-width", "resize"), o = -1 == [ "both", "horizontal", "vertical" ].indexOf(r.resize) ? 0 : -5, a = -8;
                (0 == t.width || 0 == t.height) && m.removeClass(b, "show"), M = j.clientWidth, 
                A = j.clientHeight;
                var s = m.compStyle(j, "padding-top", "padding-bottom", "overflowX", "overflow", "height");
                x || "scroll" == s.overflowX || "scroll" == s.overflow || (t.height = Math.max(parseInt(s.height), j.offsetHeight));
                var l = A - parseInt(s["padding-top"]) - parseInt(s["padding-bottom"]);
                C > A && (a = -3);
                var c = t.left + t.width - n.left - n.width - (b.offsetWidth - b.clientWidth - parseInt(r["border-left-width"]) + E.offsetWidth - E.clientWidth), d = t.top + t.height - n.top - n.height - (b.offsetHeight - b.clientHeight - parseInt(r["border-top-width"]));
                i["default"].extend(e, {
                    "margin-left": Math.floor(parseInt(m.compStyle(b, "margin-left")) + c + a + o),
                    "margin-top": Math.floor(parseInt(m.compStyle(b, "margin-top")) + d + a)
                });
                var p = m.compStyle(j, "overflow-x", "overflow-y");
                p["overflow-y"] != E.style.overflowY && (E.style.overflowY = p["overflow-y"]), p["overflow-x"] != E.style.overflowX && (E.style.overflowX = p["overflow-x"]), 
                N && N.btnMargin && N.btnMargin(e, _), C > l && u(), e.visibility = "", R.emit("update", e);
            }
            function a() {
                var e = {
                    "z-index": (parseInt(m.css(_, "z-index")) || 1) + 1
                };
                if (p.isGmail(w)) {
                    var t = m.getParentByTag(E, "TABLE"), n = t && m.getParentByTag(t, "TABLE"), r = void 0, o = n && n.querySelector('[command="Files"]');
                    n && o ? (r = m.getParentByTag(o, "TABLE"), m.insertAfter(y, r), T = !0, i["default"].extend(e, {
                        right: 10,
                        top: -20,
                        left: "auto"
                    })) : m.insertAfter(y, E);
                } else m.insertAfter(y, E);
                R.emit("update", e);
            }
            function l(e) {
                function t() {
                    P = 0, R.emit("update", {
                        opacity: "1"
                    });
                }
                return e ? t() : void (3 > P ? (P++, clearTimeout(O), O = setTimeout(function() {
                    return P = 0;
                }, 3e3)) : R.emit("update", {
                    opacity: "0.2"
                }));
            }
            function u() {
                S = !1, R.emit("update", {
                    removeClass: "show"
                });
            }
            function g() {
                l(!0), h(), S || o();
            }
            function h() {
                _.clientHeight < C || (R.emit("update", {
                    addClass: "show"
                }), S = !0);
            }
            function v() {
                p.cancelInterval(r), d["default"].off(D);
            }
            var b = e.el, y = e.container, j = e.srcEl, w = b.ownerDocument, _ = e.editorEl, x = e.isTextarea, E = e.posSourceEl || _, k = f.getPos(E), C = 25, O = void 0, P = 0, T = void 0, S = void 0, M = void 0, A = void 0, N = c["default"](w).getFixesForCurrentDomain(), D = {
                resize: o,
                keyup: n,
                paste: t
            };
            d["default"].on(D), p.interval(r, 200);
            var R = s["default"]({
                update: o,
                insert: a,
                camouflage: l,
                show: g,
                hide: u,
                remove: v
            });
            return R;
        };
        n["default"] = g, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../position": "/project/src/js/lib/position.js",
        "../sites": "/project/src/js/lib/sites.js",
        "../util": "/project/src/js/lib/util.js",
        "../window-events": "/project/src/js/lib/window-events.js",
        emitter: "emitter",
        lodash: "lodash"
    } ],
    "/project/src/js/lib/old/editor.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("lodash"), i = r(o), a = e("grammarly-editor"), s = r(a), l = e("./tracker.editor"), c = r(l), u = e("./onboarding"), d = r(u), f = e("./textarea-btn"), p = r(f), m = e("../util"), g = e("../location"), h = e("../dom"), v = e("../position"), b = e("../config"), y = e("../client-script"), j = r(y), w = e("../message"), _ = r(w), x = e("../socket"), E = r(x), k = e("../prefs"), C = r(k), O = e("../chrome-permissions"), P = r(O), T = e("../window-events"), S = r(T), M = e("../timers"), A = r(M), N = e("../tracking/cargo"), D = r(N), R = e("../tracking/index"), I = e("../user"), B = r(I), L = function(e) {
            function t() {
                var t = arguments.length <= 0 || void 0 === arguments[0] ? "on" : arguments[0];
                _["default"][t]("__bgerror", Y), de[t]("afterReplace", Ee), de[t]("serviceState", I), 
                de[t]("capiError", L), de[t]("fix", f), de[t]("track", c["default"]), le.card && (le.card[t]("show", w), 
                le.card[t]("hide", x), le.card[t]("toeditor", k), le.card[t]("addtodict", O), de[t]("addedSynonym", T), 
                de[t]("iframe-mousemove", M)), e.pageFields[t]("remove", ke), _["default"][t]("offline", V), 
                _["default"][t]("online", W), _["default"][t]("changed-plan", N);
            }
            function n() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? "on" : arguments[0];
                de[e]("sending", be.checking), de[e]("finish", u), de[e]("rendered", be.update), 
                C["default"][e]("enabled", ie), C["default"][e]("enabledDefs", oe);
                var t = "on" == e ? h.listen : h.unlisten;
                t(je, h.visibilityEvent(je), Z), t(je, "grammarly:reset", l), pe && t(je.documentElement, "mousemove", o), 
                _["default"][e]("editor-set-state", F), _["default"][e]("dialog-closed", U), _["default"][e]("after-refresh-dialog", H);
            }
            function r() {
                A["default"].start(se + "run"), we(), a(), j["default"].rewriteInnerHTML(fe), n("on"), 
                de.getText() && de.emit("sending"), C["default"].get("seenMatchTooltip", function(e) {
                    e || d["default"]({
                        editor: de
                    });
                }), C["default"].get("enabledDefs", function(e) {
                    0 == e && (de.synonyms.disable(), de.disabledSynonyms = !0);
                }), le.emit("editorcreated", {
                    el: fe
                }), he && V();
            }
            function o(e) {
                de.emit("iframe-mousemove", e);
            }
            function a() {
                be = p["default"]({
                    editor: de,
                    doc: je,
                    posSourceEl: e.posSourceEl
                }), i["default"].extend(de, {
                    showBtn: be.show,
                    hideBtn: be.hide,
                    toggleBtn: be.toggle
                });
            }
            function l() {
                W();
            }
            function u() {
                be.cancelChecking(), be.update();
            }
            function f() {
                C["default"].incFixed();
            }
            function y(e) {
                ge = !1, e && de.setState(e), de.hardReset(), de.api.close(), de.api.ws.connect(), 
                de.api.start(), de.api.restart();
            }
            function w(e) {
                var t = de.matches.byId(e);
                t && (de.emit("context"), t.editorId = de.id, t.select(), le.card.setData(t));
            }
            function x() {
                z();
            }
            function k(e) {
                e == de.id && (de.showDialog({
                    caller: "card"
                }), A["default"].start("open_editor"), R.call("statsc.ui.increment", "stability:editor.open_from_card"), 
                R.call("felog.event", "context_menu_open_popup"));
            }
            function O(e) {
                e.match.editorId == de.id && (B["default"].anonymous ? (e.hide(), de.showDialog({
                    caller: "card"
                })) : (e.animHide(), e.match.addToDict()));
            }
            function T(e) {
                e.editorId = de.id, le.card.showSynonyms(e);
            }
            function M(e) {
                le.card.setOuterIframe(ye);
            }
            function N() {
                ge ? _["default"].emitTabs("refresh-dialog", de.id) : y();
            }
            function I(e) {
                return "capi" == e.type ? e.available ? void (he && W()) : V("Error checking is temporarily unavailable") : void 0;
            }
            function L(e) {
                if ("not_authorized" == e.error) {
                    if (ce) return R.call("felog.error", "stability.capi_error_not_authorized_loop"), 
                    console.error("User not authorized... Recovery fail =("), V("Error checking is temporarily unavailable");
                    console.warn("User not authorized... Try to recover"), ce = !0, _["default"].emitBackground("user:refresh", {}, function(e) {
                        return e ? R.call("felog.warn", "stability.capi_error_not_authorized_recovery_fail", {
                            error: e
                        }) : void y();
                    });
                }
            }
            function F(e) {
                e.editorId == de.id && (de.setState(e), _e && (_e = !1, ae()));
            }
            function U(e) {
                e == de.id && (z(), de.isHtmlGhost || de.srcEl.focus(), ge = !1);
            }
            function z() {
                de.selectedMatch && (le.card.removeLoading(de.selectedMatch.getEl()), de.selectedMatch.deselect());
            }
            function H(e) {
                e.editorId == de.id && y(e);
            }
            function V(e) {
                he = !0, de.hardReset(), de.api.close(), be && (be.offline(e), de.render());
            }
            function G() {
                return he;
            }
            function W() {
                he = !1, be.online(), y();
            }
            function Y(e) {
                console.log("Can't connect to bg page: " + e), q(e), ve || (ve = !0, setTimeout(V, 10));
            }
            function q(e) {
                var t = e.message, n = e.stack;
                R.call("statsc.ui.increment", "stability:cant_connect_to_bg_page"), ue.push({
                    message: t,
                    stack: n
                });
            }
            function X(e) {
                i["default"].chain(e).groupBy(function(e) {
                    var t = e.message, n = e.stack;
                    return [ "bgerror", t, n ].join("");
                }).map(function(e) {
                    return e.pop();
                }).each(function(e) {
                    return R.call("felog.error", "stability.cant_connect_to_bg_page", e);
                });
            }
            function K() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0], t = e.caller, n = {
                    data: de.getState(),
                    caller: t
                };
                ge = !0, be.cancelChecking(), _["default"].emitFocusedTab("show-dialog", n);
            }
            function J() {
                var e = fe.ownerDocument.createRange();
                e.selectNodeContents(fe);
                var t = e.cloneContents(), n = document.createElement("div");
                n.appendChild(t);
                for (var r = n.querySelectorAll("img"), o = r.length, i = 0; o > i; i++) r[i].src = r[i].src;
                return n.innerHTML;
            }
            function $() {
                be.camouflage();
            }
            function Z() {
                return h.docHidden(je) ? ee() : void te();
            }
            function Q(e) {
                return h.matchesSelector(e, ".b-card.Synonyms .btn-close") ? !0 : !h.matchesSelector(e, ".b-card.Synonyms, .b-card.Synonyms *");
            }
            function ee() {}
            function te() {}
            function ne(e) {
                return he ? [] : e.filter(function(e) {
                    return e.free && !e.hidden;
                });
            }
            function re() {
                var e = de.getMatches();
                return {
                    critical: e.filter(function(e) {
                        return e.free && e.inDom;
                    }).length,
                    plus: e.filter(function(e) {
                        return !e.free;
                    }).length
                };
            }
            function oe(e) {
                return de.disabledSynonyms && e ? (de.disabledSynonyms = !1, de.synonyms.fieldEnable()) : (de.disabledSynonyms = !0, 
                void de.synonyms.disable());
            }
            function ie() {
                C["default"].enabled(null, g.getDomain(), function(e) {
                    return e ? void 0 : (fe.setAttribute("spellcheck", !0), ge ? (_["default"].emitFocusedTab("hide-dialog", {}), 
                    void (_e = !0)) : void ae());
                });
            }
            function ae() {
                if (!me) {
                    var r = de.dom.getCleanHtml && de.dom.getCleanHtml();
                    r && (de.el.innerHTML = r), de.exit(), console.log("exit"), t("off"), n("off"), 
                    b.restrictedAttrs.forEach(fe.removeAttribute.bind(fe)), pe && b.restrictedAttrs.forEach(de.srcEl.removeAttribute.bind(de.srcEl)), 
                    be.cancelChecking(), be && be.remove(), me = !0, e.pageFields.remove(fe), de.emit("exit");
                }
            }
            var se = (e.el || e.srcEl).getAttribute("gramm_id") || m.guid(), le = e.app, ce = void 0, ue = D["default"](X, 2e3);
            i["default"].extend(e, {
                capiUrl: b.URLS.capi,
                createWs: E["default"],
                docid: se,
                textareaWrapSelector: '[gramm_id="' + se + '"]',
                animatorContainer: e.el.ownerDocument.documentElement,
                getAnimatorElPos: v.getAbsRect,
                updateTextareaHeight: m._f,
                canRemoveSynonym: Q,
                filter: ne
            }), i["default"].extend(s["default"].Capi, {
                CLIENT_NAME: "extension",
                clientVersion: b.getVersion(),
                extDomain: g.getDomain()
            }), s["default"].MatchPositions = function() {
                return {
                    generateMatchPositions: m._f
                };
            };
            var de = s["default"](e), fe = de.el, pe = e.posSourceEl && "IFRAME" == e.posSourceEl.tagName, me = !1, ge = !1, he = !le.online, ve = void 0, be = void 0, ye = e.srcEl || fe, je = fe.ownerDocument, we = de.run, _e = !1;
            S["default"].on("beforeunload", ae), i["default"].extend(de, {
                id: se,
                srcEl: ye,
                camouflage: $,
                run: r,
                errorData: re,
                showDialog: K,
                isOffline: G,
                reset: y,
                offline: V,
                outerIframe: e.outerIframe,
                cleanupText: m._f,
                enable: m._f,
                disable: m._f,
                activate: m._f,
                toggleBtn: m._f,
                remove: ae
            });
            var xe = de.getMatchClass;
            de.getMatchClass = function(t, n) {
                var r = xe(t, n);
                return t.renderedOnce && (r += " gr_disable_anim_appear"), r += " " + e.matchPrefix, 
                t.renderedOnce = !0, r;
            }, de.dom.changeSelection = m._f;
            var Ee = function(e) {
                return e && e.remove();
            }, ke = function(e) {
                return fe == e && ae();
            };
            de.matches.fromReplaced = de.matches.fromReplace = de.matches.byId, de.current = de.getFiltered, 
            de.started = !1, de.el.setAttribute("data-gramm_editor", !0), de.getHtml && (de.getHtml = J);
            var Ce = P["default"](de);
            return Ce.checkClipboard(), t("on"), e.run && r(), de;
        };
        n["default"] = L, t.exports = n["default"];
    }, {
        "../chrome-permissions": "/project/src/js/lib/chrome-permissions.js",
        "../client-script": "/project/src/js/lib/client-script.js",
        "../config": "/project/src/js/lib/config.js",
        "../dom": "/project/src/js/lib/dom.js",
        "../location": "/project/src/js/lib/location.js",
        "../message": "/project/src/js/lib/message.js",
        "../position": "/project/src/js/lib/position.js",
        "../prefs": "/project/src/js/lib/prefs.js",
        "../socket": "/project/src/js/lib/socket.js",
        "../timers": "/project/src/js/lib/timers.js",
        "../tracking/cargo": "/project/src/js/lib/tracking/cargo.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../user": "/project/src/js/lib/user.js",
        "../util": "/project/src/js/lib/util.js",
        "../window-events": "/project/src/js/lib/window-events.js",
        "./onboarding": "/project/src/js/lib/old/onboarding.js",
        "./textarea-btn": "/project/src/js/lib/old/textarea-btn.js",
        "./tracker.editor": "/project/src/js/lib/old/tracker.editor.js",
        "grammarly-editor": "grammarly-editor",
        lodash: "lodash"
    } ],
    "/project/src/js/lib/old/editors.js": [ function(e, t, n) {
        (function(r) {
            "use strict";
            function o(e) {
                return e && e.__esModule ? e : {
                    "default": e
                };
            }
            function i(e) {
                function t(e) {
                    l(e, f);
                }
                function n(e) {
                    l(e, b);
                }
                function o(e) {
                    l(e, _);
                }
                function i(e) {
                    l(e, u);
                }
                function a(e) {
                    return T.push(e), e.on("exit", function() {
                        var t = T.indexOf(e);
                        t > -1 && T.splice(t, 1);
                    }), e;
                }
                function l(t, n) {
                    return regeneratorRuntime.async(function(r) {
                        for (;;) switch (r.prev = r.next) {
                          case 0:
                            if (!e.elements) {
                                r.next = 2;
                                break;
                            }
                            return r.abrupt("return", n(t));

                          case 2:
                            return e.elements = !0, r.next = 5, regeneratorRuntime.awrap(h["default"](e, document));

                          case 5:
                            e.elements = r.sent, n(t);

                          case 7:
                          case "end":
                            return r.stop();
                        }
                    }, null, this);
                }
                function u(e) {
                    f(e, {
                        htmlghost: !0,
                        value: "htmlghost"
                    });
                }
                function f(e, t) {
                    if (!(e.hasAttribute("noact") || e.clientWidth < 60)) {
                        t = t || {
                            textarea: !0,
                            value: "textarea"
                        };
                        var n = d["default"]({
                            el: e,
                            id: m.guid(),
                            createEditor: s["default"].partialRight(g, t)
                        });
                        return x(n), E(e, t.value), n;
                    }
                }
                function g(t, n) {
                    var r = t.el;
                    return y(r, t.id), r.setAttribute("spellcheck", !1), a(c["default"]({
                        el: r,
                        editorType: n,
                        pageFields: C,
                        freemiumIframe: O,
                        app: e
                    }));
                }
                function b(e) {
                    function t() {
                        return e.setAttribute("spellcheck", !1), j(e, {
                            contenteditable: !0,
                            value: "contenteditable"
                        });
                    }
                    x(p["default"]({
                        el: e,
                        focusEl: e,
                        createEditor: t,
                        listenKeyup: !0
                    })), E(e, "contenteditable");
                }
                function y(e, t) {
                    e.setAttribute("data-gramm_id", t), e.setAttribute("data-gramm", !0);
                }
                function j(t, n) {
                    var r = m.guid();
                    return y(t, r), a(c["default"]({
                        el: t,
                        id: r,
                        editorType: n,
                        freemiumIframe: O,
                        pageFields: C,
                        app: e,
                        run: !0
                    }));
                }
                function w(e) {
                    if ("undefined" != typeof GR_INLINE_STYLES) {
                        var t = e.createElement("style");
                        t.innerHTML = GR_INLINE_STYLES;
                        try {
                            e.querySelector("head").appendChild(t);
                        } catch (n) {
                            console.log("can't append style", n);
                        }
                    }
                }
                function _(t) {
                    function n() {
                        return a(c["default"]({
                            el: s,
                            srcEl: t,
                            posSourceEl: t,
                            editorType: {
                                contenteditable: !0,
                                value: "contenteditable"
                            },
                            run: !0,
                            freemiumIframe: O,
                            app: e,
                            pageFields: C
                        }, r));
                    }
                    var o = m.guid();
                    y(t, o), t.setAttribute("gramm-ifr", !0);
                    var i = t.contentDocument;
                    w(i), y(i.body, o), t.style.height = t.style.height || getComputedStyle(t).height;
                    var s = i.body, l = m.isFF() ? i.defaultView : s;
                    s.setAttribute("spellcheck", !1), x(p["default"]({
                        el: s,
                        focusEl: l,
                        createEditor: n,
                        freemiumIframe: {}
                    })), E(s, "iframe");
                }
                function x(e) {
                    P.push(e);
                }
                function E(e, t) {
                    v.call("statsc.ui.increment", "activity:" + t + ".editor_created");
                }
                function k() {
                    P.forEach(function(e) {
                        return e.remove();
                    }), P = [], e.elements && e.elements.clear(), e.elements = null;
                }
                var C = e.pageFields, O = e.freemiumIframe, P = [], T = [];
                return {
                    createTextarea: t,
                    createContenteditable: n,
                    createHtmlGhost: i,
                    createIframe: o,
                    clear: k
                };
            }
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            var a = e("lodash"), s = o(a), l = e("./editor"), c = o(l), u = e("./textarea"), d = o(u), f = e("./focus-activator"), p = o(f), m = e("../util"), g = e("../elements"), h = o(g), v = e("../tracking/index");
            n["default"] = i, t.exports = n["default"];
        }).call(this, "undefined" != typeof window ? window : {});
    }, {
        "../elements": "/project/src/js/lib/elements/index.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../util": "/project/src/js/lib/util.js",
        "./editor": "/project/src/js/lib/old/editor.js",
        "./focus-activator": "/project/src/js/lib/old/focus-activator.js",
        "./textarea": "/project/src/js/lib/old/textarea.js",
        lodash: "lodash"
    } ],
    "/project/src/js/lib/old/focus-activator.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t() {
                g = f(), g.showBtn(), l.listen(u.ownerDocument, "mousemove", g.toggleBtn), m = !0, 
                g.on("exit", i), s.call("statsc.ui.increment", "stability:focus_active");
            }
            function n() {
                g && g.camouflage();
            }
            function r() {
                return m ? g && g.showBtn() : void (h || (h = !0, setTimeout(function() {
                    h = !1, t();
                }, 10)));
            }
            function o(e) {
                m && g && g && !l.isFocused(g.el) && g.toggleBtn(e);
            }
            function i() {
                p.emit("exit"), l.unlisten(u, "focus", r), l.unlisten(u, "blur", o), d && l.unlisten(u, "keyup", n), 
                g && (g.off("exit", i), g.remove(), l.unlisten(u.ownerDocument, "mousemove", g.toggleBtn));
            }
            var c = e.el, u = e.focusEl, d = e.listenKeyup, f = e.createEditor, p = a["default"]({
                remove: i
            });
            l.listen(u, "focus", r), l.listen(u, "blur", o), d && l.listen(u, "keyup", n);
            var m = !1, g = void 0, h = void 0;
            return l.isFocused(c) && r(), p;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("emitter"), a = r(i), s = e("../tracking/index"), l = e("../dom");
        n["default"] = o, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        emitter: "emitter"
    } ],
    "/project/src/js/lib/old/ghost.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t() {
                _();
            }
            function n(e) {
                var t = T.getBoundingClientRect(), n = E(e.clientX - t.left, e.clientY - t.top, t.left, t.top);
                if (n) {
                    n.e = e, e.stopPropagation();
                    var r = document.createEvent("CustomEvent");
                    r.initCustomEvent("gramMouse", !0, !0, n), S.dispatchEvent(r);
                }
            }
            function r(e) {
                try {
                    z.child.height = T.scrollHeight, R.scrollTop = T.scrollTop, clearTimeout(G), G = setTimeout(r, 100);
                } catch (e) {
                    console.log(e), r = v._f;
                }
            }
            function o(e) {
                return e ? e.split(" ").map(function(e) {
                    return isNaN(parseFloat(e)) && -1 == e.indexOf("px") ? e : Math.floor(parseFloat(e)) + "px";
                }).join(" ") : e;
            }
            function i() {
                var e = {}, t = M.getComputedStyle(T, null);
                if (!t) return e;
                var n = function(e) {
                    return t.getPropertyValue(e);
                }, r = function(e) {
                    var t = {};
                    return e.map(function(e) {
                        t[e] = n(e), "z-index" == e && "auto" == t[e] && T.style.zIndex && (t[e] = T.style.zIndex);
                    }), t;
                };
                e = {
                    parent: r([ "border", "border-radius", "box-sizing", "height", "width", "margin", "padding", "z-index", "border-top-width", "border-right-width", "border-left-width", "border-bottom-width", "border-top-style", "border-right-style", "border-left-style", "border-bottom-style", "padding-top", "padding-left", "padding-bottom", "padding-right", "margin-top", "margin-left", "margin-bottom", "margin-right" ]),
                    child: r([ "font", "font-size", "font-family", "text-align", "line-height", "letter-spacing", "text-shadow" ]),
                    src: r([ "position", "margin-top", "line-height", "font-size", "font-family", "z-index" ])
                };
                var i = e.parent["z-index"];
                if (e.parent["z-index"] = i && "auto" != i ? parseInt(i) - 1 : 0, e.parent.marginTop = o(e.parent.marginTop), 
                e.src.marginTop = o(e.src.marginTop), e.parent.margin = o(e.parent.margin), e.parent.padding = o(e.parent.padding), 
                (e.parent["border-top-width"] || e.parent["border-left-width"]) && (e.parent["border-style"] = "solid"), 
                e.parent["border-color"] = "transparent !important", "absolute" == e.src.position || "relative" == e.src.position ? e.parent = s["default"].extend(e.parent, r([ "top", "left" ])) : e.src.position = "relative", 
                V = V || n("background"), e.parent.background = V, v.isFF()) {
                    var a = parseInt(n("border-right-width")) - parseInt(n("border-left-width")), l = T.offsetWidth - T.clientWidth - a;
                    e.child["padding-right"] = l - 1 + "px";
                }
                return "start" == n("text-align") && (e.child["text-align"] = "ltr" == n("direction") ? "left" : "right"), 
                e;
            }
            function a(e) {
                F = e, u();
            }
            function l(e) {
                var t = {
                    background: "transparent !important",
                    "z-index": e["z-index"] || 1,
                    position: e.position,
                    "line-height": e["line-height"],
                    "font-size": e["font-size"],
                    "-webkit-transition": "none",
                    transition: "none"
                };
                parseInt(e["margin-top"]) > 0 && b.css(T.parentNode, {
                    width: "auto",
                    overflow: "hidden"
                });
                var n = M.devicePixelRatio > 1;
                if (n) {
                    var r = e["font-family"];
                    0 == r.indexOf("Consolas") && (r = r.replace("Consolas,", "Menlo, Monaco, 'Lucida Console', 'Liberation Mono', 'DejaVu Sans Mono', 'Bitstream Vera Sans Mono', 'Courier New', monospace, serif"), 
                    z.child["font-family"] = r, t["font-family"] = r);
                }
                b.css(T, t);
            }
            function u() {
                var e = i();
                B || (l(e.src), U = T.previousElementSibling && "left" == b.css(T.previousElementSibling, "float"), 
                v.interval(u, 500), L || (L = !0, b.listen(T, X)), B = !0), z.parent.marginTop = o(z.parent.marginTop), 
                e = s["default"].merge(e, z), e.child.height = T.scrollHeight;
                var t = s["default"].merge(H, {
                    "data-id": N,
                    "data-gramm_id": N,
                    "data-gramm": "gramm",
                    "data-gramm_editor": !0,
                    dir: T.getAttribute("dir")
                });
                D || (D = S.createElement("grammarly-ghost"), b.insertBefore(D, T)), Y && Y.ghostHeight && (e.parent.height = Y.ghostHeight(e.parent.height));
                var n = d["default"].render(c["default"].createElement(j, {
                    style: e,
                    attrs: t,
                    val: F
                }), D);
                R = d["default"].findDOMNode(n), I = R.firstElementChild, R.contentEditable = !0, 
                q.clone = R, q.cloneVal = I, f(), m(), y(), 0 == T.offsetHeight ? C() : O(), q.emit("render");
            }
            function f() {
                if (U) {
                    if (T.getBoundingClientRect().left == R.getBoundingClientRect().left && T.getBoundingClientRect().top == R.getBoundingClientRect().top) return U = !1;
                    var e = T.getBoundingClientRect(), t = T.parentNode.getBoundingClientRect(), n = e.left - t.left, r = e.top - t.top, o = "translate(" + n + "px, " + r + "px)";
                    z.parent["-webkit-transform"] = o, z.parent.transform = o;
                }
            }
            function m() {
                function e(e, r, o) {
                    var i = o ? [ T, R ] : [ t, n ];
                    z.parent[r] = parseInt(parseInt(R.style[r]) + i[0][e] - i[1][e]) + "px";
                }
                var t = h.getAbsRect(T), n = h.getAbsRect(R);
                if (n.left != t.left && e("left", "marginLeft", !1), n.top != t.top && e("top", "marginTop", !1), 
                R.clientWidth == T.clientWidth || v.isFF() ? n.width != t.width && (H.width = t.width) : n.width != t.width ? R.style.width = t.width : e("clientWidth", "width", !0), 
                v.isFF()) {
                    var r = b.css(T.parentNode, [ "margin-left", "margin-top", "position" ]);
                    r && (r.marginLeft || r.marginTop) && "static" == r.position && (T.parentNode.style.position = "relative", 
                    T.parentNode.style.overflow = "");
                }
                n.height != t.height && (z.parent.height = t.height);
            }
            function y() {
                var e = function(e) {
                    return S.contains && S.contains(e) || b.elementInDocument(e, S);
                };
                D && e(D) && e(T) && D.nextElementSibling != T && b.insertBefore(D, T);
            }
            function w(e) {
                return R.querySelector(".gr_" + e);
            }
            function _() {
                var e = A.current();
                W = [];
                for (var t = R.scrollTop, n = function(e) {
                    return {
                        x1: e.left,
                        x2: e.right,
                        y1: e.top + t,
                        y2: e.bottom + t
                    };
                }, r = 0; r < e.length; r++) {
                    var o = e[r], i = w(o.id);
                    if (i) {
                        x(i);
                        var a = h.getPos(i, R), l = {
                            x1: a.x,
                            x2: a.x + i.offsetWidth,
                            y1: a.y,
                            y2: a.y + i.offsetHeight + 5
                        }, c = {
                            match: o,
                            el: i,
                            box: l
                        };
                        W.push(c);
                        var u = i.textContent.trim().split(" ").length > 1;
                        if (u) {
                            var d = i.getClientRects();
                            d.length < 2 || (c.rects = s["default"].map(d, n));
                        }
                    }
                }
            }
            function x(e) {
                e.setAttribute("style", e.parentNode.getAttribute("style")), !e.classList.contains("gr_disable_anim_appear") && e.addEventListener("animationend", function() {
                    return e.classList.add("gr_disable_anim_appear");
                }), b.css(e, {
                    display: "",
                    padding: "",
                    margin: "",
                    width: ""
                });
            }
            function E(e, t, n, r) {
                for (var o = R.scrollTop, i = 0; i < W.length; i++) {
                    var a = W[i], s = a.box;
                    if (e >= s.x1 && e <= s.x2 && t >= s.y1 - o && t <= s.y2 - o) return a;
                    if (a.rects) for (var l = 0; l < a.rects.length; l++) {
                        var c = a.rects[l], u = e + n, d = t + r;
                        if (u >= c.x1 && u <= c.x2 && d >= c.y1 - o && d <= c.y2 - o) return a;
                    }
                }
            }
            function k() {
                clearTimeout(G), v.cancelInterval(u);
            }
            function C() {
                D.style.display = "none", T.style.backgroundColor = V, v.cancelInterval(u), setTimeout(function() {
                    return q.emit("render");
                }, 300), B = !1, D.parentNode && D.parentNode.removeChild(D);
            }
            function O() {
                B || (D.style.display = "", D.parentNode || b.insertBefore(D, T), u(), r());
            }
            function P() {
                k(), b.unlisten(T, X), C();
            }
            var T = e.el, S = T.ownerDocument, M = S.defaultView, A = e.editor || {
                current: function() {
                    return [];
                }
            }, N = e.id, D = void 0, R = void 0, I = void 0, B = !1, L = void 0, F = "", U = !1, z = {
                parent: {},
                child: {}
            }, H = {}, V = void 0, G = void 0, W = [], Y = g["default"](S).getFixesForCurrentDomain(), q = p["default"]({
                render: u,
                getStyle: i,
                setText: a,
                generateAlertPositions: _,
                remove: P,
                hide: C,
                show: O
            }), X = {
                mousemove: n,
                mouseenter: t,
                keyup: r,
                scroll: r
            };
            return q;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, a = e("lodash"), s = r(a), l = e("react"), c = r(l), u = e("react-dom"), d = r(u), f = e("emitter"), p = r(f), m = e("../sites"), g = r(m), h = e("../position"), v = e("../util"), b = e("../dom");
        n["default"] = o;
        var y = {
            style: {
                child: {
                    display: "inline-block",
                    "line-height": "initial",
                    color: "transparent",
                    overflow: "hidden",
                    "text-align": "left",
                    "float": "initial",
                    clear: "none",
                    "box-sizing": "border-box",
                    "vertical-align": "baseline",
                    "white-space": "pre-wrap",
                    width: "100%",
                    margin: 0,
                    padding: 0,
                    border: 0
                },
                parent: {
                    position: "absolute",
                    color: "transparent",
                    "border-color": "transparent !important",
                    overflow: "hidden",
                    "white-space": "pre-wrap"
                },
                src: {}
            },
            attrs: {},
            val: ""
        }, j = c["default"].createClass({
            displayName: "GhostComponent",
            getDefaultProps: function() {
                return y;
            },
            render: function() {
                var e = s["default"].merge(y.style, this.props.style), t = this.props.attrs, n = b.camelizeAttrs(e.parent), r = b.camelizeAttrs(e.child), o = this.props.val;
                return c["default"].createElement("div", i({
                    style: n
                }, t, {
                    gramm: !0
                }), c["default"].createElement("span", {
                    style: r,
                    dangerouslySetInnerHTML: {
                        __html: o
                    }
                }), c["default"].createElement("br", null));
            }
        });
        t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../position": "/project/src/js/lib/position.js",
        "../sites": "/project/src/js/lib/sites.js",
        "../util": "/project/src/js/lib/util.js",
        emitter: "emitter",
        lodash: "lodash",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/old/index.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t(e) {
                console.log(e), e.textareas.forEach(s.createTextarea), e.contenteditables.forEach(s.createContenteditable), 
                e.iframes.forEach(s.createIframe), e.htmlghosts.forEach(s.createHtmlGhost);
            }
            function n() {
                s.clear(), o.pageFields && (o.pageFields.off("add", t), o.pageFields.reset(), o.pageFields.stop(), 
                o.pageFields = null);
            }
            var r = e.doc, o = e.app, i = l["default"](r);
            o.pageFields = i;
            var s = a["default"](o);
            return t(i.get()), i.on("add", t), {
                clear: n
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        }), n["default"] = o;
        var i = e("./editors"), a = r(i), s = e("../page-fields"), l = r(s);
        t.exports = n["default"];
    }, {
        "../page-fields": "/project/src/js/lib/page-fields.js",
        "./editors": "/project/src/js/lib/old/editors.js"
    } ],
    "/project/src/js/lib/old/onboarding.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            function t() {
                l["default"].get("seenMatchTooltip", function(e) {
                    if (!o) {
                        var t = r.getFiltered().filter(function(e) {
                            return e.inDom;
                        });
                        0 != t.length && (t.sort(function(e, t) {
                            return e.s - t.s || t.e - e.e;
                        }), o = !0, n(t[0]));
                    }
                });
            }
            function n(e) {
                function n() {
                    i.hide(), u.unlisten(r.el, "scroll", n), u.unlisten(window, "click", n), l["default"].set("seenMatchTooltip", !0), 
                    o = !1, r.off("finish", t);
                }
                var a = e.getEl();
                r.one("context", n), u.listen(r.el, "scroll", n), u.listen(window, "click", n), 
                u.listen(window, "resize", n), i.show({
                    posEl: a,
                    cls: "gr__tooltip-match",
                    dir: "top:center",
                    text: "Hover over underlined text to see correction options"
                }), c.call("felog.info", "demo_tooltip_show");
            }
            var r = e.editor, o = !1, i = a["default"]();
            r.on("finish", t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("../elements/tooltip"), a = r(i), s = e("../prefs"), l = r(s), c = e("../tracking/index"), u = e("../dom");
        n["default"] = o, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../elements/tooltip": "/project/src/js/lib/elements/tooltip.js",
        "../prefs": "/project/src/js/lib/prefs.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js"
    } ],
    "/project/src/js/lib/old/referral_line.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), s = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, l = e("react"), c = r(l), u = e("../tracking/index"), d = e("../message"), f = r(d), p = e("styl/referral.styl"), m = r(p), g = e("../config"), h = e("../user"), v = r(h), b = function(e) {
            function t() {
                var e = this;
                o(this, t), s(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments), 
                this.render = function() {
                    return c["default"].createElement("div", null, e.isShow() && c["default"].createElement("div", {
                        className: m["default"].line
                    }, c["default"].createElement("span", {
                        className: m["default"].description
                    }, "Get Premium for free."), c["default"].createElement("span", {
                        className: m["default"].inviteLink,
                        onClick: e.goPremium
                    }, "Invite Friends")));
                };
            }
            return i(t, e), a(t, [ {
                key: "componentDidMount",
                value: function() {
                    v["default"].on("update", this.render);
                }
            }, {
                key: "componentWillUnmount",
                value: function() {
                    v["default"].off("update", this.render);
                }
            }, {
                key: "isShow",
                value: function() {
                    var e = v["default"].premium === !0 && v["default"].subscriptionFree === !0, t = v["default"].premium === !1, n = v["default"].groups && v["default"].groups.some(function() {
                        var e = arguments.length <= 0 || void 0 === arguments[0] ? "" : arguments[0];
                        return e.indexOf("referral_locked") > -1 || "referral" == e || "test_group" == e;
                    });
                    return (e || t) && !!n;
                }
            }, {
                key: "goPremium",
                value: function() {
                    u.call("mixpanel.track", "WE:Referral_Button_Clicked", {
                        placement: "gButton"
                    }), u.call("gnar.send", "referral/referralButtonClicked", {
                        placement: "gButton"
                    }), f["default"].emitBackground("open-url", g.URLS.referral);
                }
            } ]), t;
        }(c["default"].Component);
        n["default"] = b, t.exports = n["default"];
    }, {
        "../config": "/project/src/js/lib/config.js",
        "../message": "/project/src/js/lib/message.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../user": "/project/src/js/lib/user.js",
        react: "react",
        "styl/referral.styl": "/project/src/styl/referral.styl"
    } ],
    "/project/src/js/lib/old/textarea-btn.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e) {
            function t() {
                A = z.createElement("div"), N = d["default"].findDOMNode(i()), I = g["default"]({
                    el: N,
                    container: A,
                    editorEl: B.el,
                    srcEl: B.srcEl,
                    posSourceEl: e.posSourceEl,
                    isTextarea: B.isTextarea
                }), I.on("update", r), I.insert(), x.listen(N, "click", n), L = k["default"]({
                    el: N,
                    editor: B,
                    posSourceEl: e.posSourceEl
                }), F = _["default"]({
                    el: N,
                    doc: z,
                    outerIframe: e.editor.outerIframe,
                    win: window
                }), U = j["default"](B.reset, B.offline);
            }
            function n(e) {
                B.isOffline() && F.fastShow();
            }
            function r(e) {
                e.addClass && -1 == R.indexOf(e.addClass) && (R.push(e.addClass), delete e.addClass), 
                e.removeClass && (R = s["default"].without(R, e.removeClass), delete e.addClass), 
                D = s["default"].merge(D, e), o();
            }
            function o() {
                A || t(), G = B.getFiltered().filter(function(e) {
                    return e.inDom;
                }).length, i();
            }
            function i() {
                return d["default"].render(c["default"].createElement(P, {
                    offline: V,
                    checking: H,
                    count: G,
                    style: D,
                    classes: R
                }), A);
            }
            function a(e) {
                return 0 == e.className.indexOf("gr-") || x.resolveEl(e, C) || x.resolveEl(e, "gr__tooltip");
            }
            function l(e) {
                return x.isFocused(B.el) || e == B.el || x.isParent(e, B.el) || e == N || x.isParent(e, N);
            }
            function u(e) {
                if (l(e.target)) Y.show(); else {
                    if (a(e.target)) return;
                    Y.hide();
                }
                "blur" == e.type && Y.hide();
            }
            function f() {
                0 == N.style.opacity && (N.style.opacity = 1), L.bind(), I.show();
            }
            function m() {
                return L.isOpened() ? void (N.style.opacity = 0) : (I.hide(), void L.unbind());
            }
            function h() {
                V || (U.start(), clearTimeout(W), b());
            }
            function b() {
                clearTimeout(W), B.getText().trim() && !H && (H = !0, S());
            }
            function y() {
                clearTimeout(W), U.finish(), W = setTimeout(w, 200);
            }
            function w() {
                H = !1, S();
            }
            function E() {
                V = !0, S(), F.enable();
            }
            function O() {
                V = !1, S(), F.disable();
            }
            function T() {
                I.remove(), L.remove(), x.unlisten(N, "click", n), F.remove(), A.parentNode && A.parentNode.removeChild(A);
            }
            function S() {
                var e = B.errorData();
                v["default"].get("premium", function(t) {
                    e.premium = t, L.update(e), o();
                });
            }
            function M() {
                I.camouflage();
            }
            var A = void 0, N = void 0, D = {
                visibility: "hidden"
            }, R = [], I = void 0, B = e.editor, L = void 0, F = void 0, U = void 0, z = B.el.ownerDocument, H = void 0, V = void 0, G = 0, W = void 0;
            o();
            var Y = p["default"]({
                show: f,
                hide: m,
                toggle: u,
                checking: h,
                offline: E,
                online: O,
                remove: T,
                update: S,
                camouflage: M,
                cancelChecking: y,
                isGrElement: a,
                isShow: l
            });
            return Y;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = e("lodash"), s = r(a), l = e("react"), c = r(l), u = e("react-dom"), d = r(u), f = e("emitter"), p = r(f), m = e("./btn-pos"), g = r(m), h = e("../prefs"), v = r(h), b = e("../util"), y = e("../infinity-checker"), j = r(y), w = e("../elements/error-tooltip"), _ = r(w), x = e("../dom"), E = e("./btn-hover-menu"), k = r(E), C = "gr-textarea-btn", O = function(e) {
            return C + "_" + e;
        };
        i.baseCls = C, i.cls = O, n["default"] = i;
        var P = c["default"].createClass({
            displayName: "ButtonComponent",
            render: function() {
                var e, t = this.props.count, n = t > 0 && !this.props.checking, r = s["default"]([ C ]).concat(this.props.classes.map(O)).push(x.cs((e = {}, 
                o(e, O("errors"), n), o(e, O("offline"), this.props.offline), o(e, O("checking"), this.props.checking && !this.props.offline), 
                e))).join(" "), i = x.camelizeAttrs(this.props.style), a = n && t ? t : " ", l = "Found " + t + " " + b.declension(t, [ "error", "errors", "errors" ]) + " in text";
                return t || (l = "Protected by Grammarly"), c["default"].createElement("div", {
                    style: i,
                    className: r
                }, c["default"].createElement("div", {
                    title: l,
                    className: O("status")
                }, a));
            }
        });
        t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../elements/error-tooltip": "/project/src/js/lib/elements/error-tooltip.js",
        "../infinity-checker": "/project/src/js/lib/infinity-checker.js",
        "../prefs": "/project/src/js/lib/prefs.js",
        "../util": "/project/src/js/lib/util.js",
        "./btn-hover-menu": "/project/src/js/lib/old/btn-hover-menu.js",
        "./btn-pos": "/project/src/js/lib/old/btn-pos.js",
        emitter: "emitter",
        lodash: "lodash",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/old/textarea.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("wrap"), i = r(o), a = e("emitter"), s = r(a), l = e("textdiff"), c = e("./ghost"), u = r(c), d = e("../util"), f = e("../dom"), p = function(e) {
            function t() {
                return "TEXTAREA" == O.tagName ? O.value : O.parentNode ? i["default"].getText(O) : "";
            }
            function n(e) {
                O.value = e;
            }
            function r() {
                R && (M = t());
            }
            function o() {
                D = O.scrollTop;
            }
            function a(e) {
                return z && f.matchesSelector(e.target, U) ? m() : void 0;
            }
            function c() {
                var e = P.createEvent("TextEvent");
                e.initTextEvent ? F.latestCursor.s == F.latestCursor.e && (e.initTextEvent("textInput", !0, !0, null, String.fromCharCode(8203), 1, "en-US"), 
                setTimeout(function() {
                    F.saveCursor(), F.skipInputEvents(), O.dispatchEvent(e), setTimeout(function() {
                        n(t().replace(String.fromCharCode(8203), "")), F.restoreCursor(), F.skipInputEvents(!1);
                    }, 50);
                }, 50)) : (f.runKeyEvent({
                    el: O,
                    type: "keydown"
                }), f.runKeyEvent({
                    el: O,
                    type: "keyup"
                })), O.scrollTop = D, M = t();
            }
            function p() {
                if ((0 == M.length && t().length > 0 || I) && (M = t(), I = !1), R) {
                    M = M.replace(new RegExp(String.fromCharCode(8203), "g"), "");
                    var e = l.diffPos(M, t()), n = 1 != M.indexOf("@") && -1 == t().indexOf("@");
                    e.delta >= 2 && 0 == e.s && (A || N) && !n && m();
                }
            }
            function m() {
                R && (E(), F.clearData());
            }
            function g(e) {
                F && F.closed || (h(e), r());
            }
            function h(e) {
                A = !1, setTimeout(function() {
                    R || _(), F.showBtn();
                }, 30), R && L.show();
            }
            function v(e) {
                F.camouflage();
            }
            function b(e) {
                N = 13 == e.keyCode;
            }
            function y(e) {
                F.closed || (j(e), setTimeout(r, 1e3));
            }
            function j(e) {
                A = !0, f.isFocused(O) ? L && L.render() : F && F.hideBtn(e);
            }
            function w() {
                return L.render(), {
                    clone: L.clone,
                    cloneVal: L.cloneVal
                };
            }
            function _() {
                function e() {
                    R = !0, f.listen(O, "keyup", v), f.listen(O, "keydown", b), f.listen(T, "click", a, null, !0), 
                    F = B(V), F.dom.insertGhost = w, L = u["default"]({
                        id: S,
                        el: O,
                        editor: F
                    }), L.on("render", p), V.gh = L, M = t(), f.listen(O, "input", r), F.textarea = V, 
                    F.isHtmlGhost || (F.on("beforeReplace", o), F.on("afterReplace", function() {
                        setTimeout(c, 50);
                    })), F.on("rendered", x), F.on("exit", C), F.run(), f.listen(P, "mousemove", F.toggleBtn);
                }
                _ = d._f, e();
            }
            function x() {
                L.generateAlertPositions();
            }
            function E() {
                R && L.hide();
            }
            function k() {
                R = !0, L.show();
            }
            function C() {
                F && (F.off("exit", C), F.remove(), f.unlisten(O.ownerDocument, "mousemove", F.toggleBtn)), 
                V.emit("exit"), O.removeAttribute("data-gramm"), O.removeAttribute("data-txt_gramm_id"), 
                f.unlisten(O, H), f.unlisten(O, "keyup", v), f.unlisten(O, "keydown", b), f.unlisten(T, "click", a, !0), 
                L && L.remove();
            }
            var O = e.el, P = O.ownerDocument, T = P.defaultView, S = e.id, M = t(), A = !1, N = !1, D = void 0, R = !1, I = void 0, B = e.createEditor, L = void 0, F = void 0;
            O.setAttribute("data-gramm", ""), O.setAttribute("data-txt_gramm_id", S);
            var U = "div[role=navigation] li[role=listitem] *", z = "facebook.com" == P.domain, H = {
                focus: g,
                blur: y
            };
            f.listen(O, H), f.isFocused(O) && h();
            var V = s["default"]({
                el: O,
                id: S,
                hideClone: E,
                showClone: k,
                insertGhost: w,
                remove: C,
                activate: _
            });
            return V;
        };
        n["default"] = p, t.exports = n["default"];
    }, {
        "../dom": "/project/src/js/lib/dom.js",
        "../util": "/project/src/js/lib/util.js",
        "./ghost": "/project/src/js/lib/old/ghost.js",
        emitter: "emitter",
        textdiff: "textdiff",
        wrap: "wrap"
    } ],
    "/project/src/js/lib/old/tracker.editor.js": [ function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var r = e("../tracking/index");
        n["default"] = function(e) {
            var t = e.type, n = e.key, o = e.value, i = e.data;
            (n || i) && (n ? r.call("statsc.ui." + t, n, o) : r.call("statsc.ui." + t, i));
        }, t.exports = n["default"];
    }, {
        "../tracking/index": "/project/src/js/lib/tracking/index.js"
    } ],
    "/project/src/js/lib/page-config/config-base.js": [ function(e, t, n) {
        "use strict";
        function r(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), i = e("./defaults"), a = e("../location"), s = function() {
            function e() {
                r(this, e);
            }
            return o(e, [ {
                key: "init",
                value: function() {
                    return this.load();
                }
            }, {
                key: "checkDomain",
                value: function(e, t) {
                    var n = this.getPageConfig(e, t);
                    return n ? n.enabled !== !1 : !0;
                }
            }, {
                key: "getConfigByPage",
                value: function(e) {
                    var t = arguments.length <= 1 || void 0 === arguments[1] ? a.getUrl() : arguments[1];
                    if (e) {
                        var n = Object.keys(e).find(function(e) {
                            return new RegExp(e).test(t);
                        });
                        return e[n];
                    }
                }
            }, {
                key: "getPageConfig",
                value: function(e, t) {
                    var n = this.config.pageConfig[e] || this.config.partials.find(function(t) {
                        return e.includes(t.domain);
                    });
                    return n && n.enabled !== !1 && n.pages ? this.getConfigByPage(n.pages, t) || n : n;
                }
            }, {
                key: "isPageToReload",
                value: function(e) {
                    return i.SITES_TO_RELOAD.includes(e);
                }
            }, {
                key: "getCurrentTimestamp",
                value: function() {
                    return +new Date();
                }
            }, {
                key: "config",
                get: function() {
                    return this._config;
                },
                set: function(e) {
                    e || (e = {
                        pageConfig: {},
                        partials: []
                    }), e.pageConfig || (e.pageConfig = {}), e.partials || (e.partials = []), this._config = e;
                }
            } ]), e;
        }();
        n["default"] = s, t.exports = n["default"];
    }, {
        "../location": "/project/src/js/lib/location.js",
        "./defaults": "/project/src/js/lib/page-config/defaults.js"
    } ],
    "/project/src/js/lib/page-config/config-bg.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), s = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, l = e("./localforage"), c = r(l), u = e("../request"), d = e("../config"), f = e("./utils"), p = e("../util"), m = e("./config-base"), g = r(m), h = e("./decorator"), v = e("../tracking/index"), b = e("./defaults"), y = 1500, j = 15e3, w = "Config missed", _ = function(e) {
            function t() {
                o(this, t), s(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments);
            }
            return i(t, e), a(t, [ {
                key: "load",
                value: function() {
                    var e, t, n, r, o, i = arguments.length <= 0 || void 0 === arguments[0] ? !1 : arguments[0];
                    return regeneratorRuntime.async(function(a) {
                        for (;;) switch (a.prev = a.next) {
                          case 0:
                            if (!b.isSkipConfig()) {
                                a.next = 4;
                                break;
                            }
                            return console.warn("Use default config in DEBUG mode (skipConfig=true)"), this.config = {}, 
                            a.abrupt("return", this.config);

                          case 4:
                            if (e = void 0, i) {
                                a.next = 22;
                                break;
                            }
                            return a.next = 8, regeneratorRuntime.awrap(this.lastUpdate());

                          case 8:
                            if (t = a.sent, n = t.date, r = t.interval, !(n + r < new Date())) {
                                a.next = 18;
                                break;
                            }
                            return console.info("Config: Going to update config from CDN..."), a.next = 15, 
                            regeneratorRuntime.awrap(this.updateFromCDN());

                          case 15:
                            e = a.sent, a.next = 20;
                            break;

                          case 18:
                            o = (n + r - new Date()) / 1e3 / 60, console.info("Config: No update needed. Time to next update: ", o);

                          case 20:
                            a.next = 23;
                            break;

                          case 22:
                            console.info("Config: Skip CDN update");

                          case 23:
                            if (e || !this.config) {
                                a.next = 26;
                                break;
                            }
                            return console.info("Config: Use config from memory", this.config), a.abrupt("return", this.config);

                          case 26:
                            if (e) {
                                a.next = 31;
                                break;
                            }
                            return console.info("Config: Loading from local storage..."), a.next = 30, regeneratorRuntime.awrap(this.loadFromStorage());

                          case 30:
                            e = a.sent;

                          case 31:
                            return this.config = e, a.abrupt("return", this.config);

                          case 33:
                          case "end":
                            return a.stop();
                        }
                    }, null, this);
                }
            }, {
                key: "updateFromCDN",
                value: function() {
                    var e;
                    return regeneratorRuntime.async(function(t) {
                        for (;;) switch (t.prev = t.next) {
                          case 0:
                            return e = void 0, t.prev = 1, t.next = 4, regeneratorRuntime.awrap(Promise.race([ this.loadFromCDN(), p.delay(y).then(function() {
                                throw new Error("Can't wait any more for ajax response");
                            }) ]));

                          case 4:
                            e = t.sent, t.next = 12;
                            break;

                          case 7:
                            t.prev = 7, t.t0 = t["catch"](1), console.warn(t.t0.message), v.call("statsc.ui.increment", "stability:page_config_first_cdn_timeout"), 
                            this.saveOnError("Can't get valid config: " + (t.t0 && t.t0.message));

                          case 12:
                            return t.abrupt("return", e);

                          case 13:
                          case "end":
                            return t.stop();
                        }
                    }, null, this, [ [ 1, 7 ] ]);
                }
            }, {
                key: "loadFromCDN",
                value: function() {
                    var e;
                    return regeneratorRuntime.async(function(t) {
                        for (;;) switch (t.prev = t.next) {
                          case 0:
                            return e = void 0, t.prev = 1, v.call("statsc.ui.increment", "stability:page_config_cdn_update"), 
                            t.next = 5, regeneratorRuntime.awrap(u.fetch(d.URLS.pageConfigUrl, {
                                timeout: j
                            }));

                          case 5:
                            if (e = t.sent, f.isValid(e)) {
                                t.next = 8;
                                break;
                            }
                            throw new Error("Config is not valid");

                          case 8:
                            return this.save(e), t.abrupt("return", e);

                          case 12:
                            t.prev = 12, t.t0 = t["catch"](1), v.call("felog.error", "page_config_cdn_load_error", {
                                msg: t.t0 && t.t0.message
                            }), this.saveOnError("Can't get valid config: " + (t.t0 && t.t0.message), e);

                          case 16:
                          case "end":
                            return t.stop();
                        }
                    }, null, this, [ [ 1, 12 ] ]);
                }
            }, {
                key: "loadFromStorage",
                value: function() {
                    var e;
                    return regeneratorRuntime.async(function(t) {
                        for (;;) switch (t.prev = t.next) {
                          case 0:
                            return t.prev = 0, t.next = 3, regeneratorRuntime.awrap(c["default"].getItem("config"));

                          case 3:
                            if (e = t.sent) {
                                t.next = 6;
                                break;
                            }
                            throw new Error(w);

                          case 6:
                            if (f.isValid(e)) {
                                t.next = 8;
                                break;
                            }
                            throw new Error("Config malformed");

                          case 8:
                            return t.abrupt("return", e);

                          case 11:
                            return t.prev = 11, t.t0 = t["catch"](0), t.t0 && new RegExp(w).test(t.t0.message) ? v.call("statsc.ui.increment", "stability:page_config_missed_from_storage") : v.call("felog.error", "page_config_local_storage_load_error", {
                                msg: t.t0 && t.t0.message
                            }), console.warn("Cannot get valid page config from storage: " + (t.t0 && t.t0.message)), 
                            t.abrupt("return", null);

                          case 16:
                          case "end":
                            return t.stop();
                        }
                    }, null, this, [ [ 0, 11 ] ]);
                }
            }, {
                key: "save",
                value: function(e) {
                    return regeneratorRuntime.async(function(t) {
                        for (;;) switch (t.prev = t.next) {
                          case 0:
                            return c["default"].setItem("config", e), t.next = 3, regeneratorRuntime.awrap(this.fireVersionUpdate(e.version));

                          case 3:
                            this.setLastUpdate({
                                date: this.getCurrentTimestamp(),
                                interval: e.interval,
                                protocolVersion: e.protocolVersion,
                                version: e.version,
                                status: "success"
                            }), console.info("Config updated and saved to local storage successfully:", e.version, e);

                          case 5:
                          case "end":
                            return t.stop();
                        }
                    }, null, this);
                }
            }, {
                key: "saveOnError",
                value: function(e, t) {
                    var n;
                    return regeneratorRuntime.async(function(r) {
                        for (;;) switch (r.prev = r.next) {
                          case 0:
                            return console.warn(e, t), r.next = 3, regeneratorRuntime.awrap(this.lastUpdate());

                          case 3:
                            n = r.sent, this.setLastUpdate({
                                date: this.getCurrentTimestamp(),
                                interval: n.interval,
                                protocolVersion: n.protocolVersion,
                                version: n.version,
                                status: "failed",
                                info: e
                            });

                          case 5:
                          case "end":
                            return r.stop();
                        }
                    }, null, this);
                }
            }, {
                key: "fireVersionUpdate",
                value: function(e) {
                    var t;
                    return regeneratorRuntime.async(function(n) {
                        for (;;) switch (n.prev = n.next) {
                          case 0:
                            return n.next = 2, regeneratorRuntime.awrap(this.lastUpdate());

                          case 2:
                            t = n.sent, e && t.version != e && v.call("felog.info", "page_config_updated", e);

                          case 4:
                          case "end":
                            return n.stop();
                        }
                    }, null, this);
                }
            }, {
                key: "lastUpdateWithDefault",
                value: function() {
                    var e = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0];
                    return {
                        date: e.date || 0,
                        interval: f.interval(e.interval),
                        protocolVersion: e.protocolVersion,
                        status: e.status,
                        info: e.info
                    };
                }
            }, {
                key: "setLastUpdate",
                value: function() {
                    var e = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0];
                    return e = this.lastUpdateWithDefault(e), this._lastUpdate = e, c["default"].setItem("lastConfigUpdate", e);
                }
            }, {
                key: "lastUpdate",
                value: function() {
                    return regeneratorRuntime.async(function(e) {
                        for (;;) switch (e.prev = e.next) {
                          case 0:
                            if (this._lastUpdate) {
                                e.next = 4;
                                break;
                            }
                            return e.next = 3, regeneratorRuntime.awrap(c["default"].getItem("lastConfigUpdate"));

                          case 3:
                            this._lastUpdate = e.sent;

                          case 4:
                            return e.abrupt("return", this.lastUpdateWithDefault(this._lastUpdate || {}));

                          case 5:
                          case "end":
                            return e.stop();
                        }
                    }, null, this);
                }
            }, {
                key: "config",
                set: function() {
                    var e = arguments.length <= 0 || void 0 === arguments[0] ? {} : arguments[0];
                    this._config = h.decorateConfig(e);
                },
                get: function() {
                    return this._config;
                }
            } ]), t;
        }(g["default"]);
        n["default"] = _, t.exports = n["default"];
    }, {
        "../config": "/project/src/js/lib/config.js",
        "../request": "/project/src/js/lib/request.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../util": "/project/src/js/lib/util.js",
        "./config-base": "/project/src/js/lib/page-config/config-base.js",
        "./decorator": "/project/src/js/lib/page-config/decorator.js",
        "./defaults": "/project/src/js/lib/page-config/defaults.js",
        "./localforage": "/project/src/js/lib/page-config/localforage.js",
        "./utils": "/project/src/js/lib/page-config/utils.js"
    } ],
    "/project/src/js/lib/page-config/config-page.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), s = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, l = e("./config-base"), c = r(l), u = e("../message"), d = e("./decorator"), f = e("../tracking/index"), p = e("../util"), m = 1550, g = function(e) {
            function t() {
                o(this, t), s(Object.getPrototypeOf(t.prototype), "constructor", this).apply(this, arguments);
            }
            return i(t, e), a(t, [ {
                key: "load",
                value: function() {
                    return regeneratorRuntime.async(function(e) {
                        for (;;) switch (e.prev = e.next) {
                          case 0:
                            return e.prev = 0, e.next = 3, regeneratorRuntime.awrap(Promise.race([ u.promiseBackground("get-page-config", {
                                noupdate: p.isPopup()
                            }), p.delay(m).then(function() {
                                throw new Error("Request to BG rejected by timeout");
                            }) ]));

                          case 3:
                            this.config = e.sent, e.next = 10;
                            break;

                          case 6:
                            e.prev = 6, e.t0 = e["catch"](0), f.call("felog.error", "page_config_load_from_bg_fail", {
                                msg: e.t0 && e.t0.message
                            }), console.error("Cannot get page config. Fallback to default");

                          case 10:
                            this.config || (this.config = d.decorateConfig({}));

                          case 11:
                          case "end":
                            return e.stop();
                        }
                    }, null, this, [ [ 0, 6 ] ]);
                }
            } ]), t;
        }(c["default"]);
        n["default"] = g, t.exports = n["default"];
    }, {
        "../message": "/project/src/js/lib/message.js",
        "../tracking/index": "/project/src/js/lib/tracking/index.js",
        "../util": "/project/src/js/lib/util.js",
        "./config-base": "/project/src/js/lib/page-config/config-base.js",
        "./decorator": "/project/src/js/lib/page-config/decorator.js"
    } ],
    "/project/src/js/lib/page-config/decorator.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function a(e) {
            return g.decorate(e);
        }
        function s(e) {
            var t = m["default"]({
                pageConfig: {}
            }, e || {});
            return t.pageConfig || (t.pageConfig = {}), t;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var l = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, c = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }();
        n.decorateConfig = a, n.deepCopyWithDefault = s;
        var u = e("../config"), d = e("./defaults"), f = e("../util"), p = e("deep-extend"), m = r(p), g = function() {
            function e() {
                i(this, e);
            }
            return c(e, null, [ {
                key: "decorate",
                value: function(e) {
                    var t = this;
                    return [ "withDefault", "filterByVersion", "parseBooleans", "parseBrowserValues", "filterInvalidPageRegexp", "collectPartials" ].reduce(function(e, n) {
                        return t[n](e);
                    }, e);
                }
            }, {
                key: "withDefault",
                value: function(e) {
                    e = s(e);
                    var t = d.PAGE_CONFIG && d.PAGE_CONFIG.pageConfig || {};
                    return e.pageConfig = m["default"]({}, t, e.pageConfig), e;
                }
            }, {
                key: "filterByVersion",
                value: function(e) {
                    var t = arguments.length <= 1 || void 0 === arguments[1] ? u.getVersion() : arguments[1];
                    e = s(e);
                    var n = e.pageConfig;
                    return e.pageConfig = Object.keys(n).filter(function(e) {
                        var r = n[e], o = r.version;
                        return !o || "*" === o || 1 !== f.versionComparator(t, o);
                    }).reduce(function(e, t) {
                        return l({}, e, o({}, t, n[t]));
                    }, {}), e;
                }
            }, {
                key: "parseBooleans",
                value: function(e) {
                    function t(e) {
                        return !(e === !1 || "false" == e);
                    }
                    function n(e) {
                        return e ? t(e) : !1;
                    }
                    e = s(e);
                    var r = e.pageConfig;
                    return Object.keys(r).forEach(function(e) {
                        r[e] || (r[e] = {});
                        var o = r[e];
                        o.enabled = t(o.enabled), o.matchPartOfUrl = n(o.matchPartOfUrl), o.pages && Object.keys(o.pages).forEach(function(e) {
                            o.pages[e].enabled = t(o.pages[e].enabled);
                        });
                    }), e;
                }
            }, {
                key: "parseBrowserValues",
                value: function(e) {
                    var t = arguments.length <= 1 || void 0 === arguments[1] ? f.getBrowser() : arguments[1];
                    e = s(e);
                    var n = e.pageConfig;
                    return Object.keys(n).map(function(e) {
                        var r = n[e] && n[e].disabledBrowsers;
                        r && r.includes(t) && (n[e].enabled = !1);
                    }), e;
                }
            }, {
                key: "filterInvalidPageRegexp",
                value: function(e) {
                    e = s(e);
                    var t = e.pageConfig;
                    return Object.keys(t).forEach(function(e) {
                        var n = t[e];
                        n.pages && (n.pages = Object.keys(n.pages).filter(function(e) {
                            try {
                                return new RegExp(e);
                            } catch (t) {
                                return !1;
                            }
                        }).reduce(function(e, t) {
                            return l({}, e, o({}, t, n.pages[t]));
                        }, {}));
                    }), e;
                }
            }, {
                key: "collectPartials",
                value: function(e) {
                    e = s(e);
                    var t = e.pageConfig;
                    e.partials = [];
                    try {
                        e.partials = Object.keys(t).filter(function(e) {
                            return t[e].matchPartOfUrl;
                        }).map(function(e) {
                            return l({
                                domain: e
                            }, t[e]);
                        });
                    } catch (n) {
                        console.warn("Cannot collect partials from config");
                    }
                    return e;
                }
            } ]), e;
        }();
        n.RawConfigDecorator = g;
    }, {
        "../config": "/project/src/js/lib/config.js",
        "../util": "/project/src/js/lib/util.js",
        "./defaults": "/project/src/js/lib/page-config/defaults.js",
        "deep-extend": "/project/node_modules/deep-extend/lib/deep-extend.js"
    } ],
    "/project/src/js/lib/page-config/defaults.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("../util"), i = e("../prefs"), a = (r(i), "1.0"), s = [ "mail.google.com", "yahoo.com", "mail.live.com", "facebook.com", "tumblr.com", "stackoverflow.com", "wordpress.com", "wordpress.org", "blogspot.com" ], l = 18e5, c = l, u = [ 6e5, c, 36e5, 108e5, 432e5, 864e5, 31536e6 ], d = {
            pageConfig: {
                "mail.google.com": {
                    fields: [ {
                        name: "to"
                    }, {
                        name: "cc"
                    }, {
                        name: "bcc"
                    }, {
                        className: "vO"
                    } ],
                    subframes: !1
                },
                newtab: {
                    enabled: !1
                },
                version: {
                    enabled: !1
                },
                extensions: {
                    enabled: !1
                },
                "grammarly.com": {
                    enabled: !1
                },
                "free.grammarly.com": {
                    enabled: !1
                },
                "app.grammarly.com": {
                    enabled: !1
                },
                "ed.grammarly.com": {
                    enabled: !1
                },
                "app.asana.com": {
                    enabled: !1
                },
                "hootsuite.com": {
                    enabled: !1
                },
                "plus.google.com": {
                    enabled: !1
                },
                "chrome.google.com": {
                    enabled: !1
                },
                "facebook.com": {
                    enabled: !0,
                    minFieldHeight: 0,
                    pages: {
                        ".*/notes": {
                            enabled: !1
                        }
                    }
                },
                "onedrive.live.com": {
                    enabled: !1
                },
                "docs.com": {
                    enabled: !1
                },
                "sp.docs.com": {
                    enabled: !1
                },
                "docs.google.com": {
                    enabled: !1,
                    track: !0
                },
                "drive.google.com": {
                    enabled: !1,
                    track: !0,
                    message: 'We hope to support Google Drive apps in the future, but for now please use your <a href="https://app.grammarly.com/">Grammarly Editor</a>.'
                },
                "texteditor.nsspot.net": {
                    enabled: !1
                },
                "jsbin.com": {
                    enabled: !1
                },
                "jsfiddle.net": {
                    enabled: !1
                },
                "quora.com": {
                    enabled: !1
                },
                "paper.dropbox.com": {
                    enabled: !1
                },
                "twitter.com": {
                    enabled: !o.isFF() && !o.isSafari()
                },
                "com.safari.grammarlyspellcheckergrammarchecker": {
                    enabled: !1,
                    matchPartOfUrl: !0
                },
                "mail.live.com": {
                    enabled: !1,
                    matchPartOfUrl: !0
                },
                "imperavi.com": {
                    enabled: !1
                },
                "usecanvas.com": {
                    enabled: !1
                }
            }
        }, f = !1;
        n["default"] = {
            PAGE_CONFIG: d,
            PAGE_CONFIG_DEFAULT_INTERVAL: c,
            PAGE_CONFIG_UPDATE_INTERVALS: u,
            PROTOCOL_VERSION: a,
            SITES_TO_RELOAD: s,
            isSkipConfig: function() {
                return f;
            }
        }, t.exports = n["default"];
    }, {
        "../prefs": "/project/src/js/lib/prefs.js",
        "../util": "/project/src/js/lib/util.js"
    } ],
    "/project/src/js/lib/page-config/index.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("../util"), i = e("./config-page"), a = r(i), s = e("./config-bg"), l = r(s), c = function() {
            return o.isBg() ? new l["default"]() : new a["default"]();
        };
        n["default"] = c(), t.exports = n["default"];
    }, {
        "../util": "/project/src/js/lib/util.js",
        "./config-bg": "/project/src/js/lib/page-config/config-bg.js",
        "./config-page": "/project/src/js/lib/page-config/config-page.js"
    } ],
    "/project/src/js/lib/page-config/localforage.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("localforage"), i = r(o), a = "Grammarly", s = 1, l = "configuration";
        i["default"].config({
            name: a,
            version: s,
            storeName: l
        }), n["default"] = i["default"], t.exports = n["default"];
    }, {
        localforage: "localforage"
    } ],
    "/project/src/js/lib/page-config/utils.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.pageConfig && Object.keys(e).length && Object.keys(e.pageConfig).length && (!e.protocolVersion || e.protocolVersion === i.PROTOCOL_VERSION) ? !0 : void 0;
        }
        function o(e) {
            return i.PAGE_CONFIG_UPDATE_INTERVALS.includes(e) ? e : i.PAGE_CONFIG_DEFAULT_INTERVAL;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("./defaults");
        n["default"] = {
            isValid: r,
            interval: o
        }, t.exports = n["default"];
    }, {
        "./defaults": "/project/src/js/lib/page-config/defaults.js"
    } ],
    "/project/src/js/lib/page-fields.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            if (Array.isArray(e)) {
                for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
                return n;
            }
            return Array.from(e);
        }
        function i(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function a() {
            function e() {
                j["default"].on("mousemove", f, !0), be = !0, ye = new MutationObserver(m), ye.observe(pe.body, {
                    childList: !0,
                    subtree: !0
                }), x.interval(y, 1e3);
            }
            function t(e) {
                var t = e.contentDocument, n = void 0, r = function(e) {
                    ue = e.x, de = e.y;
                    var n = ie = t.body;
                    setTimeout(function() {
                        return je.emit("hover", {
                            target: n,
                            x: ue,
                            y: de
                        });
                    }, 0);
                }, o = function() {
                    !n && E.listen(t, "mousemove", r), n = !0;
                };
                return o(), {
                    on: o,
                    off: function() {
                        n && E.unlisten(t, "mousemove", r), n = !1;
                    }
                };
            }
            function n(e) {
                return null == e.offsetParent;
            }
            function r(e, t) {
                var r = new MutationObserver(function() {
                    return !n(e) && P(t);
                });
                return r.observe(e, {
                    attribute: !0,
                    attributeFilter: [ "style" ]
                }), {
                    off: function() {
                        return r.disconnect();
                    }
                };
            }
            function a(e) {
                var t = ne(e);
                if (t) return se.has(e) || se.set(e, r(t, e)), n(t);
            }
            function l() {
                return [].concat(o(fe)).find(function(e) {
                    return ie == e || E.isParent(ie, e);
                });
            }
            function u() {
                var e = l();
                setTimeout(function() {
                    return je.emit("hover", {
                        target: e,
                        x: ue,
                        y: de
                    });
                }, 0);
            }
            function f(e) {
                ue = e.x, de = e.y, ie = e.target, u();
            }
            function p(e) {
                function t(e) {
                    return -1 != r.indexOf(e) ? n.push(e) : void 0;
                }
                var n = arguments.length <= 1 || void 0 === arguments[1] ? [] : arguments[1], r = c["default"].flatten(c["default"].transform(fe, function(e, t) {
                    return e.push(t);
                }, []));
                if (t(e) || !e.children) return n;
                for (var o = 0; o < e.children.length; o++) p(e.children[o], n);
                return n;
            }
            function m(e) {
                e.map(function(e) {
                    var t = e.removedNodes;
                    return [].concat(o(t)).map(function(e) {
                        return p(e);
                    });
                }).reduce(function(e, t) {
                    return e.concat.apply(e, o(t));
                }, []).forEach(P);
            }
            function h() {
                be && (j["default"].off("mousemove", f, !0), x.cancelInterval(y), ye.disconnect(), 
                be = !1);
            }
            function y() {
                var e = J();
                A(e) || je.emit("add", e);
            }
            function w() {
                c["default"].each(fe, function(e) {
                    return e.forEach(F);
                }), fe = S(), je.emit("add", J()), e();
            }
            function P(e) {
                ae.has(e) && (ae.get(e).off(), ae["delete"](e)), se.has(e) && (se.get(e).off(), 
                se["delete"](e)), [ "textareas", "contenteditables", "iframes", "htmlghosts" ].forEach(function(t) {
                    var n = fe[t].indexOf(e);
                    -1 != n && fe[t].splice(n, 1);
                }), je.emit("remove", e);
            }
            function T() {
                return regeneratorRuntime.wrap(function(e) {
                    for (;;) switch (e.prev = e.next) {
                      case 0:
                        return e.delegateYield(this.textareas, "t0", 1);

                      case 1:
                        return e.delegateYield(this.contenteditables, "t1", 2);

                      case 2:
                        return e.delegateYield(this.htmlghosts, "t2", 3);

                      case 3:
                      case "end":
                        return e.stop();
                    }
                }, Z[0], this);
            }
            function S() {
                return i({
                    textareas: [],
                    contenteditables: [],
                    iframes: [],
                    htmlghosts: []
                }, Symbol.iterator, T);
            }
            function M(e) {
                pe = e, me = {
                    ownerDocument: pe
                }, he = pe.location.hostname, ve = new RegExp("://" + he), ge = pe.defaultView;
                var t = b.getDomain(me), n = g["default"].getPageConfig(t);
                n && (re = c["default"].isNumber(n.minFieldHeight) ? n.minFieldHeight : re, oe = c["default"].isNumber(n.minFieldWidth) ? n.minFieldHeight : oe);
            }
            function A(e) {
                return 0 == e.textareas.length && 0 == e.contenteditables.length && 0 == e.iframes.length && 0 == e.htmlghosts.length;
            }
            function N(e) {
                var t = b.getDomain(me), n = g["default"].getPageConfig(t);
                return n ? n.enabled === !1 ? !1 : n.enabled === !0 ? !0 : !n.fields.some(function(t) {
                    var n = t.name, r = t.id, o = t.className;
                    return n && n == e.name || r && r == e.id || o && E.hasClass(e, o);
                }) : !0;
            }
            function D() {
                return !pe.location || 0 == pe.location.href.indexOf("about:") || 0 == pe.location.href.indexOf("chrome:") || !pe.body || 0 == pe.body.childNodes.length;
            }
            function R() {
                return "interactive" != pe.readyState && "complete" != pe.readyState;
            }
            function I() {
                var e = pe.documentElement.getBoundingClientRect();
                return e.height < ee && ge.innerHeight < ee || e.width < ee;
            }
            function B(e) {
                return e.clientHeight < re || e.clientWidth < oe;
            }
            function L(e) {
                var t = k.some(function(t) {
                    return Array.isArray(t) ? e.hasAttribute(t[0]) && e.getAttribute(t[0]) == t[1] : e.hasAttribute(t);
                });
                return t || "rtl" == e.getAttribute("dir");
            }
            function F(e) {
                [].concat(o(k), [ "spellcheck" ]).forEach(function(t) {
                    return e.removeAttribute(t);
                });
            }
            function U(e) {
                return E.getParentBySel(e, C);
            }
            function z(e) {
                return !L(e) && !B(e) && (E.isVisible(e) && N(e) || E.hasClass(e, "grammDemo"));
            }
            function H(e) {
                return [].concat(o(pe.querySelectorAll(e))).filter(z);
            }
            function V(e) {
                return H("textarea", e);
            }
            function G(e) {
                return ce ? [] : H('[contenteditable]:not([contenteditable="false"]):not([data-reactid])', e).filter(function(e) {
                    return !U(e);
                });
            }
            function W(e) {
                return x.isChrome() ? ce ? H("[contenteditable]", e) : H("[contenteditable][data-reactid], [data-reactid] [contenteditable]", e) : [];
            }
            function Y(e) {
                if (O.href = e.src, (0 != e.src.indexOf("http") || ve.test(e.src)) && "about:blank" != e.src && (!e.src || -1 != e.src.indexOf("javascript:") || O.protocol == document.location.protocol && O.hostname == document.location.hostname && O.port == document.location.port) && !E.hasClass(e, _["default"].baseCls)) {
                    var t = null;
                    try {
                        t = e.contentDocument;
                    } catch (n) {
                        return;
                    }
                    if ((!t || t.body) && t && !L(e) && !L(t.body) && N(e)) {
                        var r = t.querySelector("html") || {
                            hasAttribute: x._f
                        };
                        if (("on" == t.designMode || t.body.hasAttribute("contenteditable") || "false" == t.body.getAttribute("contenteditable") || r.hasAttribute("contenteditable") || "false" == r.getAttribute("contenteditable")) && !B(e)) return x.isFF() && "on" == t.designMode && (t.designMode = "off", 
                        t.body.setAttribute("contenteditable", !0)), !0;
                    }
                }
            }
            function q(e) {
                return [].concat(o(pe.querySelectorAll("iframe"))).filter(Y);
            }
            function X(e) {
                fe = c["default"].mapValues(fe, function(t, n) {
                    return [].concat(t, e[n]);
                }), fe[Symbol.iterator] = T;
            }
            function K(e, t) {
                var n = c["default"].difference(e[t], fe[t]);
                return !ne || x.isSafari() ? n : n.reduce(function(e, t) {
                    return e.concat(a(t) ? t : []);
                }, []);
            }
            function J() {
                var e = $(), n = i({
                    textareas: K(e, "textareas"),
                    contenteditables: K(e, "contenteditables"),
                    iframes: K(e, "iframes"),
                    htmlghosts: K(e, "htmlghosts")
                }, Symbol.iterator, T);
                return X(n), n.iframes.forEach(function(e) {
                    return ae.set(e, t(e));
                }), n;
            }
            function $() {
                var e = S();
                return D() || R() || I() ? e : s({}, e, {
                    textareas: V(),
                    contenteditables: G(),
                    iframes: q(),
                    htmlghosts: W()
                });
            }
            var Z = [ T ].map(regeneratorRuntime.mark), Q = arguments.length <= 0 || void 0 === arguments[0] ? document : arguments[0], ee = 150, te = v["default"](Q).getFixesForCurrentDomain(), ne = te && te.fieldDepend, re = 35, oe = 300, ie = void 0, ae = new Map(), se = new Map(), le = b.getDomain(), ce = "facebook.com" == le || "messenger.com" == le, ue = void 0, de = void 0, fe = S(), pe = void 0, me = void 0, ge = void 0, he = void 0, ve = void 0, be = void 0, ye = void 0;
            M(Q);
            var je = d["default"]({
                get: J,
                reset: w,
                remove: P,
                stop: h
            }), we = je.on;
            return je.on = function(t, n) {
                be || e(), we(t, n), "hover" == t && u();
            }, je;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, l = e("lodash"), c = r(l), u = e("emitter"), d = r(u), f = e("./config"), p = r(f), m = e("./page-config"), g = r(m), h = e("./sites"), v = r(h), b = e("./location"), y = e("./window-events"), j = r(y), w = e("./elements/iframe"), _ = r(w), x = e("./util"), E = e("./dom"), k = p["default"].restrictedAttrs, C = p["default"].restrictedParentAttrs, O = document.createElement("a");
        n["default"] = a, t.exports = n["default"];
    }, {
        "./config": "/project/src/js/lib/config.js",
        "./dom": "/project/src/js/lib/dom.js",
        "./elements/iframe": "/project/src/js/lib/elements/iframe.js",
        "./location": "/project/src/js/lib/location.js",
        "./page-config": "/project/src/js/lib/page-config/index.js",
        "./sites": "/project/src/js/lib/sites.js",
        "./util": "/project/src/js/lib/util.js",
        "./window-events": "/project/src/js/lib/window-events.js",
        emitter: "emitter",
        lodash: "lodash"
    } ],
    "/project/src/js/lib/position.js": [ function(e, t, n) {
        "use strict";
        function r(e, t, n) {
            var o = {
                top: 0,
                left: 0,
                height: 0,
                width: 0
            };
            if (!e) return o;
            var i = e.ownerDocument, a = i.documentElement, s = e.getClientRects(), l = a.scrollTop || i.body.scrollTop, u = a.scrollLeft || i.body.scrollLeft, d = t && t.contentDocument;
            if (0 == s.length) return o;
            var f = Array.from(s).map(function(e) {
                return {
                    top: e.top + l,
                    left: e.left + u,
                    height: e.height,
                    width: e.width
                };
            });
            return d && d.documentElement && d.documentElement == a && !function() {
                var e = r(t);
                f = f.map(function(t) {
                    return c({}, t, {
                        top: t.top + e.top - l,
                        left: t.left + e.left - u
                    });
                });
            }(), n && f || f[0];
        }
        function o(e, t, n) {
            var r = e.ownerDocument, o = s(r), i = e.clientWidth, a = e.clientHeight, l = {}, c = {
                top: t.top - r.body.scrollTop - a,
                left: t.left - i,
                bottom: r.body.scrollTop + o.height - t.top - t.height - a,
                right: r.body.scrollLeft + o.width - t.left - i
            };
            return c.bottom < 0 && c.bottom < c.top || n ? (l.top = t.top - a + 3, l.flip = !0) : (l.top = t.top + t.height - 3, 
            l.flip = !1), c.right < 0 ? l.left = o.width - i : l.left = t.left, t.forceCoords && (l.left = t.pageX, 
            l.top = l.flip ? t.pageY - a : t.pageY + 5), {
                rect: l,
                delta: c,
                sourceRect: t
            };
        }
        function i(e, t, n) {
            function r(e, t) {
                l[e] += i[t] / 2 - s[t] / 2, o[e] > l[e] && (l[e] = o[e]), o[e] + o[t] < l[e] + s[t] && (l[e] = o[e] + o[t] - s[t]);
            }
            var o = a(), i = t.getBoundingClientRect(), s = e.getBoundingClientRect(), l = {
                flipY: !1,
                flipX: !1
            }, c = {
                top: i.top - o.top,
                left: i.left - o.left,
                bottom: -i.bottom + o.bottom,
                right: -i.right + o.right
            };
            return n = n || "top:center", n = n.split(":"), l.top = i.top, "center" == n[0] ? r("top", "height") : "top" == n[0] ? c.top > s.height ? l.top -= s.height : (l.top += i.height, 
            l.flipY = !0) : "bottom" == n[0] && (c.bottom > s.height ? l.top += i.height : (l.top -= s.height, 
            l.flipY = !0)), l.left = i.left, "center" == n[1] ? r("left", "width") : "left" == n[1] ? (l.left += i.width - s.width, 
            c.left + i.width < s.width && (l.left = o.left)) : "right" == n[1] && c.right + i.width < s.width && (l.left += i.width + c.right - s.width), 
            l;
        }
        function a() {
            var e = document.createElement("div");
            e.style.cssText = "position: fixed;top: 0;left: 0;bottom: 0;right: 0;", document.documentElement.insertBefore(e, document.documentElement.firstChild);
            var t = e.getBoundingClientRect();
            return document.documentElement.removeChild(e), t;
        }
        function s(e) {
            var t = e.documentElement.clientTop || e.body.clientTop || 0, n = e.documentElement.clientLeft || e.body.clientLeft || 0, r = e.documentElement.scrollLeft || e.body.scrollLeft, o = e.documentElement.scrollTop || e.body.scrollTop, i = e.defaultView.innerHeight, a = e.defaultView.innerWidth;
            return {
                width: a,
                height: i,
                scrollTop: o - t,
                scrollLeft: r - n,
                top: t,
                left: n
            };
        }
        function l(e, t) {
            if (!e || e == t) return {
                x: 0,
                y: 0
            };
            var n = {
                x: e.offsetLeft,
                y: e.offsetTop
            }, r = l(e.offsetParent, t);
            for (var o in r) n[o] += r[o];
            return n;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var c = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        };
        n["default"] = {
            posToRect: o,
            getAbsRect: r,
            getPos: l,
            posToEl: i
        }, t.exports = n["default"];
    }, {} ],
    "/project/src/js/lib/prefs.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function i(e, t, n) {
            function r(e) {
                return e[n] || {
                    enabled: !0
                };
            }
            var o = "boolean" == typeof t, i = {};
            try {
                if (!e) throw "bad db";
                i = JSON.parse(e);
            } catch (a) {
                h.set("enabled_db", "{}");
            }
            if ("" === t && n) return r(i).enabled;
            if (o) {
                var s = r(i);
                s.enabled = t, i.lastChange = {
                    value: t,
                    domain: n
                }, i[n] = s, h.set("enabled_db", JSON.stringify(i)), u["default"].emitTabs("enabled", i.lastChange);
            }
            return t;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = this, s = e("./forge"), l = r(s), c = e("./message"), u = r(c), d = e("./util"), f = e("./location"), p = (e("./dom"), 
        e("emitter")), m = r(p);
        u["default"].on("prefs-changed", function(e) {
            h.emit(e.pref, e.value);
        }), u["default"].on("enabled", function(e) {
            h.emit("enabled", e);
        });
        var g = function(e) {
            return new Promise(function(t, n) {
                try {
                    l["default"].prefs.get(e, t, function(t) {
                        return t && t.message && t.message.includes("SyntaxError") ? (l["default"].prefs.clear(e), 
                        n("Prop:" + e + " has corrupted value, cleanup")) : void n(t);
                    });
                } catch (r) {
                    n(r);
                }
            });
        }, h = m["default"]({
            get: function(e, t) {
                var n, r;
                return regeneratorRuntime.async(function(i) {
                    for (var a = this; ;) switch (i.prev = i.next) {
                      case 0:
                        if (!Array.isArray(e)) {
                            i.next = 13;
                            break;
                        }
                        return e.includes("enabled") && e.includes("domain") && !function() {
                            var e = t;
                            t = function(t) {
                                h.enabled("", t.domain, function(n) {
                                    t.enabled = n, e(t);
                                });
                            };
                        }(), n = {}, i.prev = 3, i.next = 6, regeneratorRuntime.awrap(function() {
                            var r;
                            return regeneratorRuntime.async(function(i) {
                                for (;;) switch (i.prev = i.next) {
                                  case 0:
                                    return i.next = 2, regeneratorRuntime.awrap(Promise.all(e.map(g)));

                                  case 2:
                                    r = i.sent, n = e.reduce(function(e, t, n) {
                                        return Object.assign(e, o({}, t, r[n]));
                                    }, {}), t && t(n);

                                  case 5:
                                  case "end":
                                    return i.stop();
                                }
                            }, null, a);
                        }());

                      case 6:
                        i.next = 12;
                        break;

                      case 8:
                        i.prev = 8, i.t0 = i["catch"](3), console.error("prefs get error:", i.t0), u["default"].emitError(i.t0);

                      case 12:
                        return i.abrupt("return", n);

                      case 13:
                        if (r = g(e), !t) {
                            i.next = 18;
                            break;
                        }
                        r.then(t, u["default"].emitError), i.next = 19;
                        break;

                      case 18:
                        return i.abrupt("return", r.then(function(e) {
                            return e;
                        }, function(e) {
                            return u["default"].emitError(e), null;
                        }));

                      case 19:
                      case "end":
                        return i.stop();
                    }
                }, null, a, [ [ 3, 8 ] ]);
            },
            set: function(e, t) {
                var n;
                return regeneratorRuntime.async(function(r) {
                    for (;;) switch (r.prev = r.next) {
                      case 0:
                        if (null === e || "object" != typeof e) {
                            r.next = 2;
                            break;
                        }
                        return r.abrupt("return", Object.keys(e).forEach(function(t) {
                            return h.set(t, e[t]);
                        }));

                      case 2:
                        return r.prev = 2, r.next = 5, regeneratorRuntime.awrap(g(e));

                      case 5:
                        n = r.sent, n != t && u["default"].emitTabs("prefs-changed", {
                            pref: e,
                            value: t
                        }), l["default"].prefs.set(e, t), r.next = 13;
                        break;

                      case 10:
                        r.prev = 10, r.t0 = r["catch"](2), u["default"].emitError(r.t0);

                      case 13:
                      case "end":
                        return r.stop();
                    }
                }, null, a, [ [ 2, 10 ] ]);
            },
            clearAll: function() {
                try {
                    l["default"].prefs.clearAll();
                } catch (e) {
                    u["default"].emitError(e);
                }
            },
            enabled: function(e, t) {
                void 0 === e && (e = "");
                var n = arguments.length <= 2 || void 0 === arguments[2] ? d._f : arguments[2];
                d.isFunction(e) && (n = e, e = "");
                var r = function(t) {
                    return h.get("enabled_db", function(r) {
                        return n(i(r, e, t));
                    });
                };
                t ? r(t) : f.getDomain(r);
            },
            incFixed: function() {
                var e = arguments.length <= 0 || void 0 === arguments[0] ? 1 : arguments[0];
                h.get("fixed_errors", function(t) {
                    t = parseInt(t), isNaN(t) && (t = 0), t += e, h.set("fixed_errors", t);
                });
            },
            isExt2: function() {
                return h.get("ext2");
            }
        });
        n["default"] = h, t.exports = n["default"];
    }, {
        "./dom": "/project/src/js/lib/dom.js",
        "./forge": "/project/src/js/lib/forge.js",
        "./location": "/project/src/js/lib/location.js",
        "./message": "/project/src/js/lib/message.js",
        "./util": "/project/src/js/lib/util.js",
        emitter: "emitter"
    } ],
    "/project/src/js/lib/request.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            var n = {};
            for (var r in e) t.indexOf(r) >= 0 || Object.prototype.hasOwnProperty.call(e, r) && (n[r] = e[r]);
            return n;
        }
        function i(e) {
            if (e.data && (e.query || "post" != e.method) && (e.url += "?" + u(e.data)), e.data && "post" == e.method && !e.query && !e.body) {
                try {
                    e.body = JSON.stringify(e.data);
                } catch (t) {
                    e.body = {}, console.warn(t);
                }
                e.headers = e.headers || {}, e.headers["Content-Type"] = e.headers["Content-Type"] || "application/json", 
                delete e.data;
            }
            return e.credentials = "include", e;
        }
        function a(e) {
            var t = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1];
            return t.url = e, i(t), p.isBg() || f.isTest ? s(t) : g["default"].promiseBackground("fetch", t);
        }
        function s(e) {
            var t = e.url, n = o(e, [ "url" ]);
            return p.isFF() ? new Promise(function(e, r) {
                d.request.ajax({
                    url: t,
                    data: n.data,
                    header: n.header,
                    type: n.method || "GET",
                    dataType: "json",
                    timeout: n.timeout || h,
                    success: function(t) {
                        var n = "string" == typeof t ? JSON.parse(t) : t;
                        if (n.error) throw new Error(n.error);
                        e(n);
                    },
                    error: function(e) {
                        if ("Request timed out" === e.message) throw new Error("Fetch request to " + t + " rejected by timeout");
                        throw new Error(e.message);
                    }
                });
            }) : Promise.race([ window.fetch(t, n).then(n.isText ? c : l).then(function(e) {
                if (e.error) throw new Error(e.error);
                return e;
            }), p.delay(n.timeout || h).then(function() {
                throw new Error("Fetch request to " + t + " rejected by timeout");
            }) ]);
        }
        function l(e) {
            return e.json();
        }
        function c(e) {
            return e.text();
        }
        function u(e) {
            var t = "", n = function(n) {
                Array.isArray(e[n]) ? e[n].length && (t += "" + (t.length ? "&" : "") + e[n].map(function(e) {
                    return n + "=" + e;
                }).join("&")) : t += "" + (t.length ? "&" : "") + n + "=" + encodeURIComponent(e[n]);
            };
            for (var r in e) n(r);
            return t;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var d = e("./forge"), f = e("./config"), p = e("./util"), m = e("./message"), g = r(m), h = 1e4;
        p.isBg() && (e("whatwg-fetch"), g["default"].on("fetch", function(e, t, n) {
            return s(e).then(t, n);
        })), n["default"] = {
            fetch: a,
            transformOptions: i,
            paramStr: u
        }, t.exports = n["default"];
    }, {
        "./config": "/project/src/js/lib/config.js",
        "./forge": "/project/src/js/lib/forge.js",
        "./message": "/project/src/js/lib/message.js",
        "./util": "/project/src/js/lib/util.js",
        "whatwg-fetch": "whatwg-fetch"
    } ],
    "/project/src/js/lib/selection-animator.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            var t = arguments.length <= 1 || void 0 === arguments[1] ? document : arguments[1], n = arguments.length <= 2 || void 0 === arguments[2] ? "" : arguments[2];
            m = n;
            var r = c["default"].getAbsRect(e);
            b = t, p = {
                top: r.top + r.height + 1,
                left: r.left,
                width: 0,
                height: 2
            }, h = Math.ceil(r.width / 8), g = r.width - h, setTimeout(function() {
                p.width = g, i();
            }, 10), setTimeout(function() {
                s();
            }, 500), i();
        }
        function i() {
            v = u.renderReactWithParent(f["default"].createElement(j, {
                style: p,
                className: m
            }), b.documentElement, y);
        }
        function a() {
            v && (v.remove(), v = null);
        }
        function s() {
            p.WebkitTransitionDuration = "0.2s", p.MozTransitionDuration = "0.2s", p.transitionDuration = "0.2s", 
            p.width = g + h, v && i();
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var l = e("./position"), c = r(l), u = e("./dom"), d = e("react"), f = r(d), p = void 0, m = void 0, g = 0, h = 0, v = void 0, b = void 0, y = Symbol("SelectionAnimator"), j = f["default"].createClass({
            displayName: "AnimationLine",
            render: function() {
                return f["default"].createElement("div", {
                    style: this.props.style,
                    className: "g-selection-anim " + this.props.className
                });
            }
        }), w = {
            animate: o,
            remove: a,
            complete: s
        };
        n["default"] = w, t.exports = n["default"];
    }, {
        "./dom": "/project/src/js/lib/dom.js",
        "./position": "/project/src/js/lib/position.js",
        react: "react"
    } ],
    "/project/src/js/lib/selection.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var o = e("emitter"), i = r(o), a = e("./config"), s = e("./dom"), l = function(e) {
            function t(e) {
                return e.getRangeAt(0).getBoundingClientRect();
            }
            function n(e, t, n) {
                for (var r = e.split(/[.;!?]/g), o = 0, i = 0, a = 0; a < r.length; a++) {
                    if (i = o + r[a].length, t >= o && i >= n) {
                        var s = {
                            t: r[a],
                            s: t - o,
                            e: n - o
                        };
                        return s;
                    }
                    o = i + 1;
                }
            }
            function r(t) {
                var n = t.anchorNode;
                if (!n) return !1;
                var r = a.restrictedAttrs.map(function(e) {
                    return Array.isArray(e) ? "[" + e[0] + '="' + e[1] + '"]' : "[" + e + "]";
                }).join(","), o = t.toString().trim(), i = "TEXTAREA" != n.tagName && "INPUT" != n.tagName, l = !(e.activeElement && "INPUT" == e.activeElement.tagName || e.activeElement && "TEXTAREA" == e.activeElement.tagName), c = !s.isContentEditable(n), u = !s.getParentBySel(n, r) && !s.matchesSelector(n, r), d = !s.getParentBySel(n, "[contenteditable=true],[contenteditable=plaintext-only]") && !s.parentIsContentEditable(n);
                return !!(o && i && l && c && u && d);
            }
            function o(o) {
                var i = o.detail;
                if (2 != i) return void (c && (l.emit("unselect"), c = !1));
                c = !0;
                var a = e.getSelection(), s = r(a);
                if (s) {
                    var u = a.anchorNode.textContent, d = a.toString();
                    if (!d.match(/[0-9_±!@#$%^&*:"|<>?~().,:}{’=']/)) {
                        var f = {
                            t: d,
                            s: 0,
                            e: d.length
                        }, p = a.getRangeAt(0);
                        if (p.ownerDocument = e, a.anchorNode == a.focusNode) {
                            var m = a.anchorOffset, g = m + d.length;
                            f = n(u, m, g);
                        }
                        var h = {
                            data: {
                                v: f.t,
                                s: f.s,
                                e: f.e,
                                w: d
                            },
                            pos: t(a),
                            el: p
                        };
                        l.emit("select", h);
                    }
                }
            }
            s.listen(e, "click", o);
            var l = i["default"]({
                release: function() {
                    s.unlisten(e, "click", o);
                },
                isValidSelection: r
            }), c = !1;
            return l;
        };
        n["default"] = l, t.exports = n["default"];
    }, {
        "./config": "/project/src/js/lib/config.js",
        "./dom": "/project/src/js/lib/dom.js",
        emitter: "emitter"
    } ],
    "/project/src/js/lib/sites.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            if (Array.isArray(e)) {
                for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
                return n;
            }
            return Array.from(e);
        }
        function i(e, t) {
            return e.find(function(e) {
                return a(t, e.split(":"));
            });
        }
        function a(e, t) {
            var n = l(t, 2), r = n[0], o = n[1], i = e.getAttribute(r);
            return i && (i == o || i.includes(o) && r + ":" + o);
        }
        function s() {
            var e = arguments.length <= 0 || void 0 === arguments[0] ? document : arguments[0], t = c.getDomain({
                ownerDocument: e
            }), n = g[t];
            return {
                addDomainClass: function() {
                    e.documentElement.classList.add("gr__" + t.replace(/\./g, "_"));
                },
                customizeElements: function() {
                    n && d["default"](n).each(function(t, n) {
                        return [].concat(o(e.querySelectorAll(n))).forEach(function(e) {
                            d["default"].extend(e.style, t);
                        });
                    });
                },
                getFixesForCurrentDomain: function() {
                    var e = h[t];
                    if (e) return e;
                    var n = Object.keys(h).filter(function(e) {
                        return e.includes("*");
                    }).find(function(e) {
                        return t.indexOf(e.replace("*", "")) > -1;
                    });
                    return n && h[n];
                }
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var l = function() {
            function e(e, t) {
                var n = [], r = !0, o = !1, i = void 0;
                try {
                    for (var a, s = e[Symbol.iterator](); !(r = (a = s.next()).done) && (n.push(a.value), 
                    !t || n.length !== t); r = !0) ;
                } catch (l) {
                    o = !0, i = l;
                } finally {
                    try {
                        !r && s["return"] && s["return"]();
                    } finally {
                        if (o) throw i;
                    }
                }
                return n;
            }
            return function(t, n) {
                if (Array.isArray(t)) return t;
                if (Symbol.iterator in Object(t)) return e(t, n);
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
            };
        }(), c = e("./location"), u = e("lodash"), d = r(u), f = e("./client-script"), p = r(f), m = e("./dom"), g = {
            "translate.google.com": {
                "#gt-clear": {
                    zIndex: 2
                }
            },
            "linkedin.com": {
                ".mentions-highlighter": {
                    zIndex: 0
                }
            },
            "us.nakedwines.com": {
                ".postbutton": {
                    display: "inline-block"
                }
            }
        }, h = {
            "twitter.com": {
                btnMargin: function(e, t) {
                    t.clientHeight > 40 || (e["margin-left"] = e["margin-left"] - 30);
                },
                btnDiff: function(e) {
                    return e.clientHeight > 40 || "tweet-box-home-timeline" != e.id ? void 0 : [ -30, 0 ];
                }
            },
            "linkedin.com": {
                fieldStateForDomain: function(e) {
                    var t = [ "class:trans" ];
                    return i(t, e);
                }
            },
            "*.slack.com": {
                forceMinimize: function(e) {
                    return e.clientHeight > 40 ? !0 : !1;
                },
                btnCustomContainer: function(e) {
                    return e;
                },
                btnCustomStyles: function(e, t) {
                    var n = t.clientHeight < 40 ? 25 : 0;
                    return e ? {
                        right: 10 + n,
                        bottom: 10,
                        left: "auto",
                        top: "auto"
                    } : {
                        right: -10,
                        bottom: -2,
                        left: "auto",
                        top: "auto"
                    };
                }
            },
            "facebook.com": {
                fieldStateForDomain: function(e) {
                    var t = [ "role:textbox", "testid:ufi_comment_composer", "testid:react-composer-root" ], n = function(e, t) {
                        var n = l(t, 2), r = (n[0], n[1]);
                        return e.dataset && e.dataset.testid == r ? "testid:" + r : m.getParentByData(e, "testid", r) ? "testid:" + r : void 0;
                    };
                    return t.find(function(t) {
                        var r = t.split(":"), o = l(r, 2), i = o[0], s = o[1];
                        return "testid" == i ? n(e, [ i, s ]) : a(e, [ i, s ]);
                    });
                },
                ghostHeight: function(e) {
                    var t = parseInt(e, 10);
                    return t > 0 ? t + 1 + "px" : t + "px";
                },
                menuPosLeft: function(e, t) {
                    return e.name && "xhpc_message_text" == e.name ? Math.ceil(t) : t;
                },
                btnCustomContainer: function(e) {
                    if (e.dataset && ("ufi_comment_composer" == e.dataset.testid || "ufi_reply_composer" == e.dataset.testid)) return e;
                    if (e.name && "xhpc_message_text" == e.name) return e.parentNode;
                    var t = m.getParentByData(e, "testid", "react-composer-root");
                    if (t) {
                        var n = m.getParentByDepth.call(e, 3);
                        return n.parentNode.style.position = "relative", n;
                    }
                    return "webMessengerRecentMessages" == e.getAttribute("aria-controls") ? e : void 0;
                },
                btnCustomStyles: function(e, t) {
                    if ("webMessengerRecentMessages" == t.getAttribute("aria-controls")) return e ? {
                        right: 10,
                        bottom: 10,
                        left: "auto",
                        top: "auto"
                    } : {
                        right: -5,
                        bottom: 2,
                        left: "auto",
                        top: "auto"
                    };
                    if (t.dataset && "ufi_comment_composer" == t.dataset.testid) {
                        var n = m.getParentByDepth.call(t, 6).querySelector(".UFICommentAttachmentButtons"), r = n ? n.childNodes.length : 2, o = [ 56, 30, 0 ], i = e ? -o[r] : -74, a = e ? -3 : -14;
                        return {
                            right: i,
                            bottom: a,
                            left: "auto",
                            top: "auto"
                        };
                    }
                    if (t.dataset && "ufi_reply_composer" == t.dataset.testid) {
                        var n = m.getParentByDepth.call(t, 6).querySelector(".UFICommentAttachmentButtons"), r = n ? n.childNodes.length : 2, o = [ 60, 30, 0 ], i = e ? -o[r] : -74, a = e ? -3 : -8;
                        return {
                            right: i,
                            bottom: a,
                            left: "auto",
                            top: "auto"
                        };
                    }
                    return e ? {
                        right: 10,
                        bottom: 10,
                        left: "auto",
                        top: "auto"
                    } : {
                        right: -8,
                        bottom: -5,
                        left: "auto",
                        top: "auto"
                    };
                }
            },
            "mail.google.com": {
                btnCustomContainer: function(e) {
                    var t = m.getParentByTag(e, "TABLE"), n = t && m.getParentByTag(t, "TABLE"), r = n && n.querySelector('[command="Files"]');
                    return n && r && m.getParentByTag(r, "TABLE");
                },
                btnCustomStyles: function(e) {
                    return e ? {
                        right: 10,
                        top: -30,
                        left: "auto"
                    } : {
                        right: -2,
                        top: -25,
                        left: "auto"
                    };
                },
                fieldDepend: function(e) {
                    var t = m.getParentByTag(e, "TABLE");
                    if (t) {
                        var n = m.getParentByTag(t, "TABLE");
                        if (n) return n.querySelector('[role=toolbar][aria-label="Spell Check"]');
                    }
                }
            },
            "inbox.google.com": {
                btnCustomContainer: function(e) {
                    return e.parentNode;
                },
                btnCustomStyles: function(e) {
                    return e ? {
                        right: 12,
                        top: "auto",
                        left: "auto",
                        bottom: 62
                    } : {
                        right: -5,
                        top: "auto",
                        left: "auto",
                        bottom: 60
                    };
                }
            },
            "medium.com": {
                btnDiff: function(e) {
                    return m.parentHasClass(e, "postArticle--full") ? [ -75, 0, !1 ] : void 0;
                }
            }
        };
        !function() {
            function e() {
                if (window.randomize) {
                    var e = window.randomize;
                    window.randomize = function(t) {
                        try {
                            if (t.data) {
                                var n = JSON.parse(t.data);
                                n[0] && n[0].parentWindowLocation && e(t);
                            }
                        } catch (t) {}
                    };
                }
            }
            (c.getDomain().indexOf("chase.com") > -1 || c.getDomain().indexOf("chaseonline.com") > -1) && p["default"].addScript(document, [ e ]);
        }(), n["default"] = s, t.exports = n["default"];
    }, {
        "./client-script": "/project/src/js/lib/client-script.js",
        "./dom": "/project/src/js/lib/dom.js",
        "./location": "/project/src/js/lib/location.js",
        lodash: "lodash"
    } ],
    "/project/src/js/lib/socket.js": [ function(e, t, n) {
        (function(t) {
            "use strict";
            function r(e) {
                return e && e.__esModule ? e : {
                    "default": e
                };
            }
            function o(e) {
                if ("disconnected" != e) {
                    var t = {};
                    "string" == typeof e ? t.msg = e : e.error && (t.readyState = e.error.currentTarget && e.error.currentTarget.readyState, 
                    t.returnValue = e.error.returnValue), v.call("felog.error", "socket_fail", t), console.error("capi error", e), 
                    window.emit || c["default"](window), window.emit("bgerror", e || "when send message to the socket");
                }
            }
            function i() {
                var e = _.slice(0);
                return _.length = 0, e;
            }
            Object.defineProperty(n, "__esModule", {
                value: !0
            });
            Object.assign || function(e) {
                for (var t = 1; t < arguments.length; t++) {
                    var n = arguments[t];
                    for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
                }
                return e;
            };
            n.getLog = i;
            var a = "undefined" != typeof window ? window.forge : "undefined" != typeof t ? t.forge : null, s = r(a), l = e("emitter"), c = r(l), u = e("websocket"), d = r(u), f = e("./timers"), p = r(f), m = e("./message"), g = r(m), h = e("./util"), v = e("./tracking/index"), b = e("./config"), y = {}, j = function(e) {
                return (!s["default"] && !window.socketServer || window.gr___sandbox) && x(), h.isBg() ? x() : w(e);
            }, w = function(e) {
                function t(e, t) {
                    var i = {
                        socketId: s,
                        method: e,
                        arg: t,
                        url: l,
                        useStandBy: u
                    };
                    return f || r(), "connect" != e || b.isTest ? (g["default"].emitBackground("socket-client", i, null, o), 
                    void ("close" == e && n())) : g["default"].emitBackground("user:refresh", {
                        lazy: !0
                    }, function() {
                        return g["default"].emitBackground("socket-client", i, null, o);
                    });
                }
                function n() {
                    d.off("disconnect", n), delete y[s], f = !1, g["default"].off("socket-server", i, o), 
                    v.call("felog.info", "socket_close", {
                        active_time: p["default"].stop(s),
                        current_sockets: Object.keys(y).length
                    });
                }
                function r() {
                    f = !0, g["default"].on("socket-server", i, o);
                }
                function i(e, t) {
                    if (e.socketId == s) {
                        var n = e.msg || {};
                        n.action && "error" == n.action.toLowerCase() && (v.call("statsc.ui.increment", "stability:capi_error"), 
                        v.call("felog.event", "stability.capi_error", n)), t("ok"), d.emit(e.event, e.msg);
                    }
                }
                var a = e.socketId, s = void 0 === a ? h.guid() : a, l = e.url, u = e.useStandBy, d = c["default"]({}), f = !1, m = [ "connect", "send", "close", "reconnect", "release", "wsPlay", "wsPause" ];
                return m.forEach(function(e) {
                    return d[e] = t.bind(null, e);
                }), d.one("connect", function() {
                    y[s] = y[s] || s, p["default"].start(s), v.call("felog.event", "socket_open", {
                        current_sockets: Object.keys(y).length
                    });
                }), d.one("disconnect", n), d.on("error", o), d.socketId = s, d.toString = function() {
                    return "[object SocketClient]";
                }, d;
            }, _ = [], x = function() {
                function e(e, n) {
                    if (e) {
                        var r = e.socketId, o = y[r], i = e.method, a = "close" == i;
                        (o || !a) && (o || (o = E(e, t), y[r] = o), i && (o[i](e.arg), a && t(r)));
                    }
                }
                function t(e) {
                    y[e] && (y[e].close(), y[e].emit = function(e, t) {}, delete y[e]);
                }
                var n = {};
                return window.socketServer = n, g["default"].on("iframe-mode", function(e) {
                    console.log("IFRAME MODE", e.id, y), y[e.id].iframeMode(e.iframeMode);
                }, o, !0), g["default"].on("socket-client", e, o, !0), n.sockets = y, n.toString = function() {
                    return "[object SocketServer]";
                }, n;
            }, E = function(e, t) {
                function n(e, n) {
                    var u = setTimeout(function() {
                        console.log("CLOSE SOCKET"), l++, l > 7 && !c && (v.call("felog.warn", "too_frequent_socket_release", {
                            release_count: l
                        }), c = !0);
                        var e = r ? "socket_timeout_close_iframe:stability" : "socket_timeout_close:stability";
                        v.call("statsc.ui.increment", e), i.close(), i.release(), t();
                    }, 5e3), d = s ? "socket-server-iframe" : "socket-server";
                    console.log("from ws", e, a, n, d), g["default"].emitTabs(d, {
                        socketId: a,
                        event: e,
                        msg: n,
                        id: h.guid()
                    }, function(e) {
                        return e && clearTimeout(u);
                    }, o);
                }
                function r(e) {
                    s = e, console.log("USE EXT SOCKET", e);
                }
                var i = d["default"](e), a = e.socketId, s = void 0, l = 0, c = !1;
                return Object.assign(i, {
                    emit: n,
                    iframeMode: r,
                    toString: function() {
                        return "[object BackgroundSocket]";
                    }
                }), i;
            };
            n["default"] = j;
        }).call(this, "undefined" != typeof window ? window : {});
    }, {
        "./config": "/project/src/js/lib/config.js",
        "./message": "/project/src/js/lib/message.js",
        "./timers": "/project/src/js/lib/timers.js",
        "./tracking/index": "/project/src/js/lib/tracking/index.js",
        "./util": "/project/src/js/lib/util.js",
        emitter: "emitter",
        websocket: "websocket"
    } ],
    "/project/src/js/lib/spinner.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            var t = e.el, n = a.guid(), r = i.renderReactWithParent(l["default"].createElement(u, null), t, n, "spinner");
            return {
                remove: r.remove,
                el: c.findDOMNode(r.component)
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i = e("./dom"), a = e("./util"), s = e("react"), l = r(s), c = e("react-dom"), u = l["default"].createClass({
            displayName: "SpinnerComponent",
            render: function() {
                return l["default"].createElement("div", {
                    className: "gr_-spinner " + this.props.className
                }, l["default"].createElement("div", {
                    className: "gr_-bounce1"
                }), l["default"].createElement("div", {
                    className: "gr_-bounce2"
                }), l["default"].createElement("div", {
                    className: "gr_-bounce3"
                }));
            }
        });
        o.SpinnerComponent = u, n["default"] = o, t.exports = n["default"];
    }, {
        "./dom": "/project/src/js/lib/dom.js",
        "./util": "/project/src/js/lib/util.js",
        react: "react",
        "react-dom": "react-dom"
    } ],
    "/project/src/js/lib/test-api.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o() {
            function e() {
                s["default"].emitBackground("bg-reload", {});
            }
            function t() {
                s["default"].emitBackground("reset", {});
            }
            function n() {
                s["default"].emitBackground("get-tracker-log", {}, function(e) {
                    return l.emitDomEvent("tracker-log", e);
                });
            }
            function r() {
                s["default"].emitBackground("get-capi-log", {}, function(e) {
                    return l.emitDomEvent("capi-log", e);
                });
            }
            function o() {
                s["default"].emitBackground("get-extid", {}, function(e) {
                    return l.emitDomEvent("extid", e);
                });
            }
            function a() {
                s["default"].emitBackground("get-localforage", {}, function(e) {
                    return l.emitDomEvent("localforage", e);
                });
            }
            function c(e) {
                s["default"].emitBackground("set-localforage", {
                    key: e.key,
                    value: e.value
                }, function(e) {
                    return l.emitDomEvent("localforage", e);
                });
            }
            i.listen(document, "bg-reload", e), i.listen(document, "reset", t), i.listen(document, "get-tracker-log", n), 
            i.listen(document, "get-extid", o), i.listen(document, "get-capi-log", r), i.listen(document, "get-localforage", a), 
            i.listen(document, "set-localforage", c);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        }), n["default"] = o;
        var i = e("./dom"), a = e("./message"), s = r(a), l = e("./util");
        t.exports = n["default"];
    }, {
        "./dom": "/project/src/js/lib/dom.js",
        "./message": "/project/src/js/lib/message.js",
        "./util": "/project/src/js/lib/util.js"
    } ],
    "/project/src/js/lib/timers.js": [ function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var r = {};
        n["default"] = {
            start: function(e) {
                r[e] = Date.now();
            },
            stop: function(e) {
                var t = this.passed(e);
                return delete r[e], t;
            },
            passed: function(e) {
                return e && r[e] ? Date.now() - r[e] : 0;
            }
        }, t.exports = n["default"];
    }, {} ],
    "/project/src/js/lib/tracking/call.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            if (Array.isArray(e)) {
                for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
                return n;
            }
            return Array.from(e);
        }
        function i(e) {
            for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; t > r; r++) n[r - 1] = arguments[r];
            if (m.isBg() || m.isPopup() && m.isSafari()) return setTimeout(function() {
                return a(e, n);
            }, 20);
            var i = e.includes("felog"), s = i ? l(n) : n, c = 1e4, u = setTimeout(function() {
                return p("timeout call through bg page");
            }, c), d = function() {
                return clearInterval(u);
            }, p = function(t) {
                return d(), i ? b["default"].apply(void 0, o(s)) : e.includes("statsc.ui.increment") ? j["default"].apply(void 0, [ e.split(".").pop() ].concat(o(s))) : void console.warn("tracking call " + e + " failed, reason: ", t);
            };
            f["default"].emitBackground("tracking-call", {
                msg: e,
                data: s
            }, d, p);
        }
        function a(e, t) {
            var n = e.split("."), r = n.pop(), i = n.reduce(function(e, t) {
                return t in e ? e[t] : {};
            }, h["default"]());
            return i && i[r] ? (i[r].apply(i, o(t)), void s(e, t)) : console.error("No method " + e + " in tracker object");
        }
        function s(e, t) {
            console.info(e, t);
        }
        function l() {
            var e = arguments.length <= 0 || void 0 === arguments[0] ? [] : arguments[0], t = {
                url: p.getDomain(),
                headers: {
                    "User-Agent": navigator.userAgent
                }
            };
            if (e.length < 2) return [ e[0], {
                request: t
            } ];
            var n = e[1], r = "string" == typeof n ? {
                message: n
            } : n;
            return [ e[0], u({}, r, {
                request: t
            }) ].concat(o(e.slice(2)));
        }
        function c() {
            var e = w.slice(0);
            return w.length = 0, e;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var u = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        };
        n.call = i, n.callAsync = a, n.getLog = c;
        var d = e("../message"), f = r(d), p = e("../location"), m = e("../util"), g = e("./tracker"), h = r(g), v = e("./felogPixel"), b = r(v), y = e("./statscPixel"), j = r(y), w = [];
        f["default"].on("tracking-call", function(e) {
            var t = e.msg, n = e.data, r = arguments.length <= 1 || void 0 === arguments[1] ? m._f : arguments[1];
            return i.apply(void 0, [ t ].concat(o(n))) && r();
        });
    }, {
        "../location": "/project/src/js/lib/location.js",
        "../message": "/project/src/js/lib/message.js",
        "../util": "/project/src/js/lib/util.js",
        "./felogPixel": "/project/src/js/lib/tracking/felogPixel.js",
        "./statscPixel": "/project/src/js/lib/tracking/statscPixel.js",
        "./tracker": "/project/src/js/lib/tracking/tracker.js"
    } ],
    "/project/src/js/lib/tracking/cargo.js": [ function(e, t, n) {
        "use strict";
        function r(e, t) {
            var n = void 0, r = [], o = function(e) {
                r.push(e), n && clearTimeout(n), n = setTimeout(i, t);
            }, i = function() {
                n = null, e(r), r = [];
            };
            return {
                push: o
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        }), n["default"] = r, t.exports = n["default"];
    }, {} ],
    "/project/src/js/lib/tracking/felogPixel.js": [ function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var r = e("../config");
        n["default"] = function(e, t) {
            var n = {};
            try {
                JSON.stringify(t), n = t;
            } catch (o) {
                console.error(o);
            }
            var i = document.createElement("img"), a = {
                logger: "javascript",
                platform: "javascript",
                tags: {
                    application: "browserplugin",
                    fromPixel: !0,
                    commit: r.getVersion(),
                    version: r.getVersion()
                },
                message: e,
                extra: n
            }, s = "https://" + r.URLS.raven + "/api/" + r.FELOG.project + "/store/\n?sentry_version=4\n&sentry_client=raven-js/1.1.16\n&sentry_key=" + r.FELOG.key + "\n&sentry_data=" + encodeURIComponent(JSON.stringify(a));
            return i.src = s, i;
        }, t.exports = n["default"];
    }, {
        "../config": "/project/src/js/lib/config.js"
    } ],
    "/project/src/js/lib/tracking/index.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            if (Array.isArray(e)) {
                for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
                return n;
            }
            return Array.from(e);
        }
        function i() {
            function t(e) {
                e && (window.mixpanel.persistence.load(), k.call("mixpanel.setProps", {
                    gProduct: "Extension-" + w.getBrowser(),
                    fullProductVersion: _.getVersion()
                }, "Ext"));
            }
            var n = function() {
                return w.isFF() && O["default"].request.ajax;
            }();
            d["default"](), p["default"](), e("tracker"), T["default"]().init({
                mixpanel: {
                    key: _.MIXPANEL.key,
                    qaKey: _.MIXPANEL.qaKey,
                    dapi: _.DAPI,
                    ajax: n
                },
                gnar: {
                    url: _.GNAR.url,
                    qaUrl: _.GNAR.qaUrl,
                    app: w.getBrowser() + "Ext",
                    appVersion: _.getVersion(),
                    ajax: n
                },
                felog: {
                    application: "browserplugin",
                    key: _.FELOG.key,
                    url: _.URLS.raven,
                    project: _.FELOG.project,
                    commit: _.getVersion(),
                    version: _.getVersion(),
                    readyOnSetUser: !0
                },
                statsc: {
                    url: _.STATSC.URL
                }
            }), T["default"]().statsc.createRoot({
                prefix: _.STATSC.PREFIX,
                postfix: w.getBrowser() + ".extension.world",
                id: "ui"
            }), v["default"].on("tracking-fire", function(e) {
                var t = e.msg, n = e.data;
                return a.apply(void 0, [ t ].concat(o(n)));
            }), y["default"].get(".grammarly.com", _.MIXPANEL.cookie, function(e) {
                e ? t(e) : g["default"].get("mpCookie", t);
            }), v["default"].on("tracker-init", function(e) {
                function t(e, t) {
                    t && (g["default"].set(e, t), c["default"](e, null), c["default"](e, t, a));
                }
                var n = e.mpCookie, r = e.gnar, o = e.dapi;
                g["default"].set("mpCookie", n);
                var i = j.getDomain(), a = {
                    path: "/",
                    domain: i.includes(".grammarly.com") ? ".grammarly.com" : i,
                    expires: new Date(new Date().setYear(new Date().getFullYear() + 1))
                };
                c["default"](_.MIXPANEL.cookie, null), c["default"](_.MIXPANEL.cookie, n, a), t("gnar_containerId", r), 
                t("__fngrprnt__", o);
            }), a("activity-ping");
        }
        function a(e) {
            for (var t = arguments.length, n = Array(t > 1 ? t - 1 : 0), r = 1; t > r; r++) n[r - 1] = arguments[r];
            if (w.isBg()) {
                if (!E["default"][e]) return console.error("No handler specified for message: " + e);
                setTimeout(function() {
                    return E["default"][e].apply(E["default"], n);
                }, 20);
            } else S("tracking-fire", {
                msg: e,
                data: n
            });
        }
        function s() {
            var e = 0, t = 10, n = setInterval(function() {
                e++, e > t && clearInterval(n);
                var r = {
                    mpCookie: c["default"](_.MIXPANEL.cookie),
                    gnar: c["default"]("gnar_containerId"),
                    dapi: c["default"]("__fngrprnt__")
                };
                r.mpCookie && (clearInterval(n), S("tracker-init", r));
            }, 500);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var l = e("cookie"), c = r(l), u = e("vendor/mixpanel"), d = r(u), f = e("vendor/mixpanel-2.2"), p = r(f), m = e("../prefs"), g = r(m), h = e("../message"), v = r(h), b = e("../bg/cookie"), y = r(b), j = e("../location"), w = e("../util"), _ = e("../config"), x = e("./on"), E = r(x), k = e("./call"), C = e("../forge"), O = r(C), P = e("./tracker"), T = r(P), S = v["default"].emitBackground;
        n["default"] = {
            initBgOrPopup: i,
            initContentScript: s,
            getLog: k.getLog,
            fire: a,
            call: k.call
        }, t.exports = n["default"];
    }, {
        "../bg/cookie": "/project/src/js/lib/bg/cookie.js",
        "../config": "/project/src/js/lib/config.js",
        "../forge": "/project/src/js/lib/forge.js",
        "../location": "/project/src/js/lib/location.js",
        "../message": "/project/src/js/lib/message.js",
        "../prefs": "/project/src/js/lib/prefs.js",
        "../util": "/project/src/js/lib/util.js",
        "./call": "/project/src/js/lib/tracking/call.js",
        "./on": "/project/src/js/lib/tracking/on.js",
        "./tracker": "/project/src/js/lib/tracking/tracker.js",
        cookie: "cookie",
        tracker: "tracker",
        "vendor/mixpanel": "vendor/mixpanel",
        "vendor/mixpanel-2.2": "vendor/mixpanel-2.2"
    } ],
    "/project/src/js/lib/tracking/on.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var i, a = function() {
            function e(e, t) {
                var n = [], r = !0, o = !1, i = void 0;
                try {
                    for (var a, s = e[Symbol.iterator](); !(r = (a = s.next()).done) && (n.push(a.value), 
                    !t || n.length !== t); r = !0) ;
                } catch (l) {
                    o = !0, i = l;
                } finally {
                    try {
                        !r && s["return"] && s["return"]();
                    } finally {
                        if (o) throw i;
                    }
                }
                return n;
            }
            return function(t, n) {
                if (Array.isArray(t)) return t;
                if (Symbol.iterator in Object(t)) return e(t, n);
                throw new TypeError("Invalid attempt to destructure non-iterable instance");
            };
        }(), s = e("../prefs"), l = r(s), c = e("../location"), u = e("../util"), d = e("../config"), f = e("./call");
        n["default"] = (i = {}, o(i, "bg-page-load", function() {}), o(i, "activity-ping", function() {
            var e = function(e) {
                return parseFloat(Math.round(100 * e * 100) / 100).toFixed(2);
            };
            setInterval(function() {
                return u.isChrome() ? void (window.chrome.system && window.chrome.system.cpu && window.chrome.system.cpu.getInfo(function(t) {
                    var n = t.processors.map(function(e) {
                        return (e.usage.total - e.usage.idle) / e.usage.total;
                    }).reduce(function(e, t, n, r) {
                        return e + t / r.length;
                    }, 0), r = window.performance.memory, o = r.usedJSHeapSize, i = r.totalJSHeapSize;
                    n = e(n), f.call("statsc.ui.increment", "activity:activity_ping"), f.call("statsc.ui.gauge", {
                        "performance:memory_used": o,
                        "performance:memory_used_of_total": e((i - o) / i),
                        "performance:cpu_load": n
                    });
                })) : f.call("statsc.ui.increment", "activity:activity_ping");
            }, d.FELOG.pingTimeout);
        }), o(i, "daily-ping", function() {
            function e(e) {
                var n = e.id, r = e.pingDate;
                r = r || "";
                var o = r.split("|"), i = a(o, 2), s = i[0], c = i[1];
                s && s > Date.now() && c == n || n && (f.call("mixpanel.dapiEvent", "Daily_Ping", {
                    gProduct: "Extension-" + u.getBrowser()
                }), f.call("gnar.trackTrackTrack"), f.call("mixpanel.track", "Ext:Daily_Ping"), 
                f.call("felog.event", "daily_ping"), l["default"].set("pingDate", [ t(), n ].join("|")));
            }
            function t() {
                var e = new Date();
                return e.getHours() > 2 && e.setDate(e.getDate() + 1), e.setHours(3), e.setMinutes(Math.floor(60 * Math.random())), 
                e.getTime();
            }
            d.debug || l["default"].get([ "id", "pingDate" ], e);
        }), o(i, "app_signin_success", function() {
            var e;
            return regeneratorRuntime.async(function(t) {
                for (;;) switch (t.prev = t.next) {
                  case 0:
                    return t.next = 2, regeneratorRuntime.awrap(c.promiseGetDomain());

                  case 2:
                    e = t.sent, f.call("mixpanel.track", "G:User_Login_Succeeded", {
                        pageDomain: e
                    }), f.call("gnar.send", u.getBrowser() + "Ext/userLoginForm/accepted", {
                        pageDomain: e
                    }), f.call("statsc.ui.increment", "stability:app_signin_success");

                  case 6:
                  case "end":
                    return t.stop();
                }
            }, null, this);
        }), o(i, "app_signup_success", function() {
            var e;
            return regeneratorRuntime.async(function(t) {
                for (;;) switch (t.prev = t.next) {
                  case 0:
                    return t.next = 2, regeneratorRuntime.awrap(c.promiseGetDomain());

                  case 2:
                    e = t.sent, f.call("mixpanel.track", "G:User_Account_Created", {
                        pageDomain: e
                    }), f.call("gnar.send", u.getBrowser() + "Ext/userAccountSignupForm/accepted", {
                        pageDomain: e
                    }), f.call("statsc.ui.increment", "stability:app_signup_success");

                  case 6:
                  case "end":
                    return t.stop();
                }
            }, null, this);
        }), o(i, "signin-error", function(e) {
            var t;
            return regeneratorRuntime.async(function(n) {
                for (;;) switch (n.prev = n.next) {
                  case 0:
                    return n.next = 2, regeneratorRuntime.awrap(c.promiseGetDomain());

                  case 2:
                    t = n.sent, e.errorType = "Server-Side", f.call("mixpanel.track", "G:User_Login_Rejected", {
                        pageDomain: t
                    }), f.call("gnar.send", u.getBrowser() + "Ext/userLoginForm/rejected", {
                        pageDomain: t
                    });

                  case 6:
                  case "end":
                    return n.stop();
                }
            }, null, this);
        }), o(i, "signup-error", function(e) {
            var t;
            return regeneratorRuntime.async(function(n) {
                for (;;) switch (n.prev = n.next) {
                  case 0:
                    return n.next = 2, regeneratorRuntime.awrap(c.promiseGetDomain());

                  case 2:
                    t = n.sent, e.errorType = "Server-Side", f.call("mixpanel.track", "G:User_Signup_Rejected", {
                        pageDomain: t
                    }), f.call("gnar.send", u.getBrowser() + "Ext/userAccountSignupForm/rejected", {
                        pageDomain: t
                    });

                  case 6:
                  case "end":
                    return n.stop();
                }
            }, null, this);
        }), o(i, "upgrade-after-register", function() {
            var e;
            return regeneratorRuntime.async(function(t) {
                for (;;) switch (t.prev = t.next) {
                  case 0:
                    return t.next = 2, regeneratorRuntime.awrap(c.promiseGetDomain());

                  case 2:
                    e = t.sent, f.call("mixpanel.track", "NE:Account_Type_Selected", {
                        accountTypeSelected: "premium",
                        pageDomain: e
                    }), f.call("gnar.send", u.getBrowser() + "Ext/Account_Type_Selected", {
                        pageDomain: e
                    });

                  case 5:
                  case "end":
                    return t.stop();
                }
            }, null, this);
        }), o(i, "upgrade", function(e, t) {
            var n, r;
            return regeneratorRuntime.async(function(o) {
                for (;;) switch (o.prev = o.next) {
                  case 0:
                    return o.next = 2, regeneratorRuntime.awrap(l["default"].get("ext2"));

                  case 2:
                    n = o.sent, r = {
                        pageDomain: t,
                        placement: e,
                        ext2: n
                    }, f.call("gnar.send", u.getBrowser() + "Ext/upgradeButtonClicked", r), f.call("mixpanel.track", "Ext:Upgrade_To_Plus_Clicked", r), 
                    f.call("felog.info", "upgrade_click", r);

                  case 7:
                  case "end":
                    return o.stop();
                }
            }, null, this);
        }), o(i, "button-hover", function(e) {
            var t;
            return regeneratorRuntime.async(function(n) {
                for (;;) switch (n.prev = n.next) {
                  case 0:
                    return n.next = 2, regeneratorRuntime.awrap(c.promiseGetDomain());

                  case 2:
                    t = n.sent, f.call("mixpanel.track", "Ext:Action_Button_Hovered", {
                        pageDomain: t,
                        buttonType: e
                    }), f.call("gnar.send", u.getBrowser() + "Ext/actionButtonHovered", {
                        pageDomain: t,
                        buttonType: e
                    }), f.call("statsc.ui.increment", "stability:gbutton_actions_hover");

                  case 6:
                  case "end":
                    return n.stop();
                }
            }, null, this);
        }), o(i, "correct-btn-clicked", function() {
            var e;
            return regeneratorRuntime.async(function(t) {
                for (;;) switch (t.prev = t.next) {
                  case 0:
                    return t.next = 2, regeneratorRuntime.awrap(c.promiseGetDomain());

                  case 2:
                    e = t.sent, f.call("mixpanel.track", "Ext:Correct_Button_Clicked", {
                        pageDomain: e
                    }), f.call("gnar.send", u.getBrowser() + "Ext/correctButtonClicked"), f.call("statsc.ui.increment", "stability:editor.correct_button_clicked"), 
                    f.call("felog.event", "g_button_correct_button_clicked");

                  case 7:
                  case "end":
                    return t.stop();
                }
            }, null, this);
        }), o(i, "btn-disable-in-field", function(e) {
            var t;
            return regeneratorRuntime.async(function(n) {
                for (;;) switch (n.prev = n.next) {
                  case 0:
                    return n.next = 2, regeneratorRuntime.awrap(c.promiseGetDomain());

                  case 2:
                    t = n.sent, f.call("mixpanel.track", "Ext:Checking_in_field_toggled", {
                        pageDomain: t,
                        enabled: e
                    }), f.call("gnar.send", u.getBrowser() + "Ext/checkingInFieldToggled", {
                        pageDomain: t,
                        enabled: e
                    }), f.call("statsc.ui.increment", "stability:disable_in_field"), f.call("felog.info", "g_button_disable_in_field_click");

                  case 7:
                  case "end":
                    return n.stop();
                }
            }, null, this);
        }), o(i, "button-change-state", function(e) {
            var t;
            return regeneratorRuntime.async(function(n) {
                for (;;) switch (n.prev = n.next) {
                  case 0:
                    return n.next = 2, regeneratorRuntime.awrap(c.promiseGetDomain());

                  case 2:
                    t = n.sent, f.call("mixpanel.track", "Ext:GButton_Minimize_Toggled", {
                        pageDomain: t,
                        enabled: e
                    }), f.call("gnar.send", u.getBrowser() + "Ext/minimizeToggled", {
                        pageDomain: t,
                        enabled: e
                    }), f.call("statsc.ui.increment", "stability:g_button_minimize_toggled"), f.call("felog.info", "g_button_minimize_toggled", {
                        enabled: e
                    });

                  case 7:
                  case "end":
                    return n.stop();
                }
            }, null, this);
        }), o(i, "session-end", function(e) {
            var t;
            return regeneratorRuntime.async(function(n) {
                for (;;) switch (n.prev = n.next) {
                  case 0:
                    return n.next = 2, regeneratorRuntime.awrap(c.promiseGetDomain());

                  case 2:
                    t = n.sent, f.call("mixpanel.track", "Ext:Only_Advanced_Mistakes", {
                        pageDomain: t,
                        advancedCount: e
                    }), f.call("gnar.send", u.getBrowser() + "Ext/onlyAdvancedMistakes", {
                        pageDomain: t,
                        advancedCount: e
                    }), f.call("felog.info", "only_advanced_mistakes", {
                        advancedCount: e
                    });

                  case 6:
                  case "end":
                    return n.stop();
                }
            }, null, this);
        }), o(i, "login-attempt", function(e) {
            var t;
            return regeneratorRuntime.async(function(n) {
                for (;;) switch (n.prev = n.next) {
                  case 0:
                    return n.next = 2, regeneratorRuntime.awrap(l["default"].isExt2());

                  case 2:
                    t = n.sent, t ? (f.call("gnar.send", "Ext/signInClicked", {
                        placement: e
                    }), f.call("mixpanel.track", "Ext:Sign_In_Clicked", {
                        placement: e
                    })) : (f.call("gnar.send", "Ext/signInClicked_10", {
                        placement: e
                    }), f.call("mixpanel.track", "Ext:Sign_In_Clicked_10", {
                        placement: e
                    }));

                  case 4:
                  case "end":
                    return n.stop();
                }
            }, null, this);
        }), i), t.exports = n["default"];
    }, {
        "../config": "/project/src/js/lib/config.js",
        "../location": "/project/src/js/lib/location.js",
        "../prefs": "/project/src/js/lib/prefs.js",
        "../util": "/project/src/js/lib/util.js",
        "./call": "/project/src/js/lib/tracking/call.js"
    } ],
    "/project/src/js/lib/tracking/statscPixel.js": [ function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var r = e("../util"), o = e("../config");
        n["default"] = function(e, t) {
            var n = t && t.split(":");
            if (n[0] && n[1]) {
                var i = "grammarly.ui." + n[0] + "." + r.getBrowser() + ".extension.world." + n[1], a = {
                    c: {}
                };
                a.c[i] = [ "1" ];
                var s = document.createElement("img");
                return s.src = o.STATSC.URL + "?json=" + JSON.stringify(a), s;
            }
        }, t.exports = n["default"];
    }, {
        "../config": "/project/src/js/lib/config.js",
        "../util": "/project/src/js/lib/util.js"
    } ],
    "/project/src/js/lib/tracking/tracker.js": [ function(e, t, n) {
        "use strict";
        Object.defineProperty(n, "__esModule", {
            value: !0
        }), n["default"] = function() {
            return window.tracker;
        }, t.exports = n["default"];
    }, {} ],
    "/project/src/js/lib/user.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t) {
            if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function");
        }
        function i(e, t) {
            if ("function" != typeof t && null !== t) throw new TypeError("Super expression must either be null or a function, not " + typeof t);
            e.prototype = Object.create(t && t.prototype, {
                constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0
                }
            }), t && (Object.setPrototypeOf ? Object.setPrototypeOf(e, t) : e.__proto__ = t);
        }
        function a(e) {
            var t = this;
            return this && this.length && (h.isFunction(e[0]) ? this.some(e[0]) : e.some(function(e) {
                return t.includes(e);
            }));
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var s = function() {
            function e(e, t) {
                for (var n = 0; n < t.length; n++) {
                    var r = t[n];
                    r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), 
                    Object.defineProperty(e, r.key, r);
                }
            }
            return function(t, n, r) {
                return n && e(t.prototype, n), r && e(t, r), t;
            };
        }(), l = function(e, t, n) {
            for (var r = !0; r; ) {
                var o = e, i = t, a = n;
                r = !1, null === o && (o = Function.prototype);
                var s = Object.getOwnPropertyDescriptor(o, i);
                if (void 0 !== s) {
                    if ("value" in s) return s.value;
                    var l = s.get;
                    return void 0 === l ? void 0 : l.call(a);
                }
                var c = Object.getPrototypeOf(o);
                if (null === c) return void 0;
                e = c, t = i, n = a, r = !0, s = c = void 0;
            }
        }, c = e("emitter"), u = r(c), d = e("./prefs"), f = r(d), p = e("./message"), m = r(p), g = e("./config"), h = e("./util"), v = h.guid();
        if (h.isBg()) throw new TypeError("user.js does not allowed to use on bg page!");
        var b = function(e) {
            function t() {
                o(this, t), l(Object.getPrototypeOf(t.prototype), "constructor", this).call(this), 
                Object.defineProperty(this, v, {
                    value: {}
                }), m["default"].on("user:update", this.update.bind(this));
            }
            return i(t, e), s(t, [ {
                key: "processSettings",
                value: function(e) {
                    var t = this;
                    "undefined" == typeof this.settings && Object.defineProperty(this, "settings", {
                        enumerable: !0,
                        get: function() {
                            return t[v]._settings || {};
                        },
                        set: function(e) {
                            "undefined" != typeof e && (this[v]._settings = e, m["default"].emitBackground("set-settings", e));
                        }
                    }), this[v]._settings = e;
                }
            }, {
                key: "update",
                value: function(e) {
                    var t;
                    return regeneratorRuntime.async(function(n) {
                        for (;;) switch (n.prev = n.next) {
                          case 0:
                            return e && console.warn("update user session.."), t = void 0, n.prev = 2, n.next = 5, 
                            regeneratorRuntime.awrap(f["default"].get(g.userFields));

                          case 5:
                            if (t = n.sent, t && t.id) {
                                n.next = 8;
                                break;
                            }
                            throw "bad data";

                          case 8:
                            n.next = 13;
                            break;

                          case 10:
                            return n.prev = 10, n.t0 = n["catch"](2), n.abrupt("return", this.refresh());

                          case 13:
                            this.processSettings(t.settings), delete t.settings, Object.assign(this, t), this.emit("update"), 
                            this.ready = !0;

                          case 18:
                          case "end":
                            return n.stop();
                        }
                    }, null, this, [ [ 2, 10 ] ]);
                }
            }, {
                key: "refresh",
                value: function(e) {
                    var t = this;
                    return e ? m["default"].emitBackground("user:refresh", {
                        lazy: !0
                    }) : m["default"].promiseBackground("user:refresh").then(function(e) {
                        return e && Promise.reject(e);
                    })["catch"](function(e) {
                        throw t.ready = !1, new Error(e);
                    });
                }
            }, {
                key: "haveMimic",
                value: function() {
                    for (var e, t = arguments.length, n = Array(t), r = 0; t > r; r++) n[r] = arguments[r];
                    return (e = this.mimic, a).call(e, n);
                }
            }, {
                key: "haveGroups",
                value: function() {
                    for (var e, t = arguments.length, n = Array(t), r = 0; t > r; r++) n[r] = arguments[r];
                    return (e = this.groups, a).call(e, n);
                }
            }, {
                key: "ready",
                get: function() {
                    var e = this;
                    return this[v]._ready || new Promise(function(t, n) {
                        e[v]._ready === !1 && n("user malfunction"), e.on("ready", t), e.on("fail", function() {
                            return n("user malfunction");
                        }), e.update();
                    });
                },
                set: function(e) {
                    this[v]._ready = e, e ? this.emit("ready") : this.emit("fail");
                }
            } ]), t;
        }(h.createClass(u["default"])), y = function() {
            return g.isTest && window.gr___user && (b.prototype.update = function() {
                var e = window.gr___user;
                Object.assign(this, e), this.emit("update"), this.ready = !0;
            }), new b();
        };
        n["default"] = y(), t.exports = n["default"];
    }, {
        "./config": "/project/src/js/lib/config.js",
        "./message": "/project/src/js/lib/message.js",
        "./prefs": "/project/src/js/lib/prefs.js",
        "./util": "/project/src/js/lib/util.js",
        emitter: "emitter"
    } ],
    "/project/src/js/lib/util.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e) {
            if (Array.isArray(e)) {
                for (var t = 0, n = Array(e.length); t < e.length; t++) n[t] = e[t];
                return n;
            }
            return Array.from(e);
        }
        function i(e, t, n) {
            return t in e ? Object.defineProperty(e, t, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[t] = n, e;
        }
        function a() {
            return -1 != window.navigator.userAgent.indexOf("Firefox");
        }
        function s() {
            return !!window.chrome;
        }
        function l() {
            return !!window.safari;
        }
        function c() {
            return /^((?!chrome).)*safari/i.test(navigator.userAgent) && -1 != navigator.userAgent.indexOf("Version/8.0");
        }
        function u() {
            return -1 != navigator.appVersion.indexOf("Win");
        }
        function d() {
            return window.IS_BG;
        }
        function f() {
            return window.IS_POPUP;
        }
        function p() {
            return d() || f();
        }
        function m() {
            return s() ? "chrome" : a() ? "firefox" : l() ? "safari" : "other";
        }
        function g() {
            return window.chrome && window.chrome.runtime && window.chrome.runtime.lastError;
        }
        function h(e) {
            return !!(e && e.constructor && e.call && e.apply);
        }
        function v(e, t) {
            function n() {
                function n() {
                    o(), e();
                }
                function o() {
                    var o = setTimeout(n, t);
                    r[e] = o;
                }
                o();
            }
            var r = v.items = v.items || {}, o = r[e];
            if (o || t) return o && !t ? (clearTimeout(o), void delete r[e]) : void n();
        }
        function b(e) {
            v(e);
        }
        function y() {
            return (65536 * (1 + Math.random()) | 0).toString(16).substring(1);
        }
        function j() {
            return y() + y() + "-" + y() + "-" + y() + "-" + y() + "-" + y() + y() + y();
        }
        function w() {}
        function _() {
            return !0;
        }
        function x() {
            s() && window.chrome.runtime.reload();
        }
        function E(e) {
            if (e.location) {
                var t = "mail.google.com" == e.location.host, n = e.querySelector("iframe#js_frame") && e.querySelector("iframe#sound_frame");
                return t || n;
            }
        }
        function k(e) {
            return /^[-!#$%&\'*+\\./0-9=?A-Z^_`a-z{|}~]+@[-!#$%&\'*+\\/0-9=?A-Z^_`a-z{|}~]+\.[-!#$%&\'*+\\./0-9=?A-Z^_`a-z{|}~]+$/.test(e);
        }
        function C(e) {
            return e.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
        function O(e, t) {
            var n = 2;
            return e % 10 == 1 && e % 100 != 11 && (n = 0), e % 10 >= 2 && 4 >= e % 10 && (10 > e % 100 || e % 100 >= 20) && (n = 1), 
            t[n];
        }
        function P(e) {
            return z["default"].transform(e, function(e, t) {
                return e[t] = w;
            });
        }
        function T(e, t, n) {
            var r = {};
            return function() {
                var o = "_memoize_" + (t ? t.apply(this, arguments) : arguments[0]);
                return hasOwnProperty.call(r, o) ? r[o] : (n && setTimeout(function() {
                    delete r[o];
                }, n), r[o] = e.apply(this, arguments));
            };
        }
        function S(e, t) {
            return Object.keys(t).reduce(function(n, r) {
                return F({}, n, i({}, r, function() {
                    for (var n = arguments.length, o = Array(n), i = 0; n > i; i++) o[i] = arguments[i];
                    return e.then(function() {
                        return t[r].apply(t, o);
                    });
                }));
            }, {});
        }
        function M(e) {
            return new Promise(function(t) {
                return e(t);
            });
        }
        function A(e, t) {
            return Math.floor(Math.random() * (t - e + 1)) + e;
        }
        function N(e) {
            return new Promise(function(t) {
                return setTimeout(t, e);
            });
        }
        function D(e) {
            if (e) {
                var t = new Date(e);
                if ("Invalid Date" != t.toString()) return H[t.getMonth()] + " " + t.getDate() + ", " + t.getFullYear();
            }
        }
        function R(e) {
            var t = function() {};
            return t.prototype = e(), t;
        }
        function I(e) {
            var t = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1], n = document.createEvent("CustomEvent");
            n.initCustomEvent(e + "-gr", !0, !0, t), document.dispatchEvent(n);
        }
        function B() {
            function e(e) {
                return e.split(".").map(function(e) {
                    return Number(e) || 0;
                });
            }
            var t = arguments.length <= 0 || void 0 === arguments[0] ? "" : arguments[0], n = arguments.length <= 1 || void 0 === arguments[1] ? "" : arguments[1], r = e(t), i = e(n), a = Array(Math.abs(r.length - i.length)).fill(0);
            if (r.length > i.length ? i.push.apply(i, o(a)) : r.push.apply(r, o(a)), r.every(function(e, t) {
                return e === i[t];
            })) return 0;
            for (var s = 0, l = r.length; l > s; s++) {
                if (r[s] > i[s]) return 1;
                if (r[s] < i[s]) return -1;
            }
            return -1;
        }
        function L() {
            return regeneratorRuntime.async(function(e) {
                for (;;) switch (e.prev = e.next) {
                  case 0:
                    if (s()) {
                        e.next = 2;
                        break;
                    }
                    return e.abrupt("return", null);

                  case 2:
                    return e.prev = 2, e.next = 5, regeneratorRuntime.awrap(Promise.race([ new Promise(function(e) {
                        return window.chrome.runtime.sendMessage("ping", e);
                    }), N(1e4).then(function() {
                        return "timeouted";
                    }) ]));

                  case 5:
                    return e.abrupt("return", e.sent);

                  case 8:
                    return e.prev = 8, e.t0 = e["catch"](2), e.abrupt("return", "orphaned");

                  case 11:
                  case "end":
                    return e.stop();
                }
            }, null, this, [ [ 2, 8 ] ]);
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var F = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, U = e("lodash"), z = r(U), H = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
        n["default"] = {
            getBrowser: m,
            isFunction: h,
            chromeBgError: g,
            interval: v,
            declension: O,
            cancelInterval: b,
            bgPageReload: x,
            isFF: a,
            isChrome: s,
            isSafari: l,
            isSafari8: c,
            isGmail: E,
            isWindows: u,
            isBg: d,
            isBgOrPopup: p,
            isPopup: f,
            guid: j,
            formatNumber: C,
            getRandomIntInclusive: A,
            stub: P,
            memoize: T,
            syncWait: S,
            promisify: M,
            delay: N,
            formatDate: D,
            createClass: R,
            emitDomEvent: I,
            versionComparator: B,
            isValidEmail: k,
            isBgAlive: L,
            _f: w,
            _F: _
        }, t.exports = n["default"];
    }, {
        lodash: "lodash"
    } ],
    "/project/src/js/lib/window-events.js": [ function(e, t, n) {
        "use strict";
        function r(e) {
            return e && e.__esModule ? e : {
                "default": e
            };
        }
        function o(e, t, n, r) {
            var o = r ? t + "_forced" : t, i = {
                listeners: []
            }, s = function(e) {
                var t = i.listeners.indexOf(n);
                t > -1 && i.listeners.splice(t, 1);
            };
            if (("on" == e || "once" == e) && (i = d[o] || (d[o] = {
                domEventListener: function(t) {
                    u.emit(o, t), "once" == e && s(n);
                },
                listeners: []
            }), i.domEventListener.__wrapFunc = i.domEventListener.__wrapFunc || function(e) {
                i.domEventListener(a({
                    originalEvent: e,
                    preventDefault: c._f,
                    stopPropagation: c._f
                }, e.detail));
            }, 0 == i.listeners.length && (window.addEventListener(t, i.domEventListener, r), 
            window.addEventListener(t + "-gr", i.domEventListener.__wrapFunc, r)), i.listeners.push(n)), 
            "un" == e) {
                var l = d[o];
                if (!l) return;
                s(n), 0 == l.listeners.length && (window.removeEventListener(t, l.domEventListener, r), 
                window.removeEventListener(t + "-gr", l.domEventListener.__wrapFunc, r));
            }
            u[e](o, n);
        }
        function i(e) {
            return function(t, n, r) {
                if ("object" == typeof t) {
                    var i = !0, a = !1, s = void 0;
                    try {
                        for (var l, c = Object.keys(t)[Symbol.iterator](); !(i = (l = c.next()).done); i = !0) {
                            var u = l.value;
                            o(e, u, t[u], n);
                        }
                    } catch (d) {
                        a = !0, s = d;
                    } finally {
                        try {
                            !i && c["return"] && c["return"]();
                        } finally {
                            if (a) throw s;
                        }
                    }
                } else o(e, t, n, r);
            };
        }
        Object.defineProperty(n, "__esModule", {
            value: !0
        });
        var a = Object.assign || function(e) {
            for (var t = 1; t < arguments.length; t++) {
                var n = arguments[t];
                for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
            }
            return e;
        }, s = e("emitter"), l = r(s), c = e("./util"), u = l["default"]({}), d = {};
        n["default"] = {
            on: i("on"),
            off: i("un"),
            once: i("one")
        }, t.exports = n["default"];
    }, {
        "./util": "/project/src/js/lib/util.js",
        emitter: "emitter"
    } ],
    "/project/src/styl/btn-hover-menu-new.styl": [ function(e, t, n) {
        t.exports = {
            hoverMenu: "_0cb-hoverMenu",
            opened: "_0cb-opened",
            btn: "_0cb-btn",
            line: "_0cb-line",
            panel: "_0cb-panel",
            premium: "_0cb-premium",
            btn_premium: "_0cb-btn_premium",
            btn_grammarly: "_0cb-btn_grammarly",
            anonymous: "_0cb-anonymous",
            panelText: "_0cb-panelText",
            critical: "_0cb-critical",
            disabled: "_0cb-disabled",
            btn_refferal: "_0cb-btn_refferal",
            btn_disable: "_0cb-btn_disable",
            initial: "_0cb-initial",
            checking: "_0cb-checking",
            counter: "_0cb-counter",
            counter100: "_0cb-counter100",
            tooltip: "_0cb-tooltip",
            tooltip_grammarly: "_0cb-tooltip_grammarly",
            tooltip_premium: "_0cb-tooltip_premium",
            tooltip_disable: "_0cb-tooltip_disable",
            plus: "_0cb-plus",
            tooltip_refferal: "_0cb-tooltip_refferal",
            refferal: "_0cb-refferal",
            tooltip_visible: "_0cb-tooltip_visible",
            tooltip_hidden: "_0cb-tooltip_hidden"
        };
    }, {} ],
    "/project/src/styl/referral.styl": [ function(e, t, n) {
        t.exports = {
            wrap: "_6cb-wrap",
            line: "_6cb-line",
            description: "_6cb-description",
            inviteLink: "_6cb-inviteLink",
            popupLine: "_6cb-popupLine",
            newLabel: "_6cb-newLabel",
            popupLink: "_6cb-popupLink"
        };
    }, {} ],
    "/project/src/styl/signin-dialog/button.styl": [ function(e, t, n) {
        t.exports = {
            button_container: "_f66-button_container",
            button_spinner: "_f66-button_spinner",
            button: "_f66-button",
            loading: "_f66-loading"
        };
    }, {} ],
    "/project/src/styl/signin-dialog/input.styl": [ function(e, t, n) {
        t.exports = {
            input: "_96f-input",
            label: "_96f-label",
            input_element: "_96f-input_element",
            validation: "_96f-validation"
        };
    }, {} ],
    "/project/src/styl/signin-dialog/signin-dialog.styl": [ function(e, t, n) {
        t.exports = {
            signin_dialog: "_744-signin_dialog",
            view_container: "_744-view_container",
            view: "_744-view",
            view_register: "_744-view_register",
            register: "_744-register",
            view_welcome: "_744-view_welcome",
            welcome: "_744-welcome",
            view_login: "_744-view_login",
            login: "_744-login",
            view_keep_register: "_744-view_keep_register",
            view_login_success: "_744-view_login_success",
            login_success: "_744-login_success",
            login_name: "_744-login_name",
            login_success_label: "_744-login_success_label",
            windows: "_744-windows",
            footer: "_744-footer",
            navigation: "_744-navigation",
            loading: "_744-loading",
            navigation_item: "_744-navigation_item",
            validation: "_744-validation",
            hide: "_744-hide",
            content: "_744-content",
            inputs: "_744-inputs",
            title: "_744-title",
            btn_close: "_744-btn_close",
            navigation_split: "_744-navigation_split",
            hidden: "_744-hidden"
        };
    }, {} ],
    "/project/src/styl/signin-dialog/welcome.styl": [ function(e, t, n) {
        t.exports = {
            welcome: "_91a-welcome",
            windows: "_91a-windows",
            image: "_91a-image",
            content: "_91a-content",
            show: "_91a-show",
            title: "_91a-title",
            text: "_91a-text",
            close: "_91a-close",
            learn_more: "_91a-learn_more",
            go_premium: "_91a-go_premium"
        };
    }, {} ],
    "/project/src/styl/signin.styl": [ function(e, t, n) {
        t.exports = {
            signin: "_000-signin",
            content: "_000-content",
            head: "_000-head",
            descr: "_000-descr",
            auth_button: "_000-auth_button",
            footer: "_000-footer",
            login_text: "_000-login_text",
            signin_link: "_000-signin_link"
        };
    }, {} ],
    "/project/src/styl/textarea-btn-new.styl": [ function(e, t, n) {
        t.exports = {
            textarea_btn: "_d9b-textarea_btn",
            status: "_d9b-status",
            field_hovered: "_d9b-field_hovered",
            btn_text: "_d9b-btn_text",
            not_focused: "_d9b-not_focused",
            errors_100: "_d9b-errors_100",
            anonymous: "_d9b-anonymous",
            show: "_d9b-show",
            errors: "_d9b-errors",
            checking: "_d9b-checking",
            has_errors: "_d9b-has_errors",
            disabled: "_d9b-disabled",
            transform_wrap: "_d9b-transform_wrap",
            offline: "_d9b-offline",
            plus_only: "_d9b-plus_only",
            minimized: "_d9b-minimized",
            hovered: "_d9b-hovered",
            minimize_transition: "_d9b-minimize_transition"
        };
    }, {} ]
}, {}, [ "/project/src/js/index.js" ]);