!function e(r, n, t) {
    function o() {
        for (var e = Object.keys(r).map(function(e) {
            return r[e][1];
        }), n = 0; n < e.length; n++) {
            var t = e[n].proxyquireify;
            if (t) return t;
        }
    }
    function a(o, u) {
        var c = null != s && n[s], m = c && c.exports._cache || n;
        if (!m[o]) {
            if (!r[o]) {
                var d = "function" == typeof require && require;
                if (!u && d) return d(o, !0);
                if (i) return i(o, !0);
                var l = new Error("Cannot find module '" + o + "'");
                throw l.code = "MODULE_NOT_FOUND", l;
            }
            var p = m[o] = {
                exports: {}
            }, v = function(e) {
                var n = r[o][1][e];
                return a(n ? n : e);
            }, f = function(e) {
                var r = null != s && n[s];
                return r && r.exports._proxy ? r.exports._proxy(v, e) : v(e);
            };
            r[o][0].call(p.exports, f, p, p.exports, e, r, m, t);
        }
        return m[o].exports;
    }
    for (var i = "function" == typeof require && require, s = o(), u = 0; u < t.length; u++) a(t[u]);
    return a;
}({
    "/project/src/js/proxy.js": [ function(e, r, n) {
        "use strict";
        function t(e, r, n) {
            return r in e ? Object.defineProperty(e, r, {
                value: n,
                enumerable: !0,
                configurable: !0,
                writable: !0
            }) : e[r] = n, e;
        }
        function o() {
            function e(e) {
                var r = e.detail, n = r.name, t = r.data;
                c && c[n].postMessage(t);
            }
            function r() {
                document.dispatchEvent(new CustomEvent("grammarly:pong")), document.dispatchEvent(new CustomEvent("grammarly:reset"));
            }
            function n(e) {
                var r = arguments.length <= 1 || void 0 === arguments[1] ? {} : arguments[1];
                return document.dispatchEvent(new CustomEvent("grammarly:message", {
                    detail: s({
                        event: e
                    }, r)
                }));
            }
            function o() {
                document.removeEventListener("grammarly:action", e), document.removeEventListener("grammarly:ping", r), 
                document.removeEventListener("grammarly:reset", o), c = null;
            }
            function a(e) {
                var r = window.chrome.extension.connect({
                    name: e
                });
                return r.onMessage.addListener(function(r) {
                    return n("message", {
                        msg: r,
                        name: e
                    });
                }), r.onDisconnect.addListener(function(r) {
                    console.warn("port mulfunction " + e, r), i("proxy.port_malfunction", {
                        name: e,
                        msg: window.chrome.runtime.lastError
                    }), o(), document.dispatchEvent(new CustomEvent("grammarly:error", {
                        detail: {
                            event: "disconnect",
                            name: e
                        }
                    }));
                }), r;
            }
            var c = u.reduce(function(e, r) {
                return s({}, e, t({}, r, a(r)));
            }, {});
            i("proxy.init"), document.addEventListener("grammarly:action", e), document.addEventListener("grammarly:ping", r), 
            document.dispatchEvent(new CustomEvent("grammarly:proxyports")), document.addEventListener("grammarly:proxyports", o);
        }
        function a() {
            var e = {
                url: document.location.href,
                headers: {
                    "User-Agent": navigator.userAgent
                }
            };
            return document.referrer && (e.headers.Referer = document.referrer), e;
        }
        function i(e, r) {
            var n = {};
            try {
                JSON.stringify(r), n = r;
            } catch (t) {
                console.error(t);
            }
            var o = document.createElement("img"), i = {
                logger: "javascript",
                platform: "javascript",
                tags: {
                    application: "browserplugin"
                },
                request: a(),
                message: e,
                extra: n
            }, s = "https://" + c.url + "/api/" + c.project + "/store/\n?sentry_version=4\n&sentry_client=raven-js/1.1.16\n&sentry_key=" + c.key + "\n&sentry_data=" + encodeURIComponent(JSON.stringify(i));
            return o.src = s, o;
        }
        var s = Object.assign || function(e) {
            for (var r = 1; r < arguments.length; r++) {
                var n = arguments[r];
                for (var t in n) Object.prototype.hasOwnProperty.call(n, t) && (e[t] = n[t]);
            }
            return e;
        }, u = [ "bridge", "message:to-priv", "message:to-non-priv" ], c = {
            url: "felog.grammarly.io",
            key: "b37252e300204b00ad697fe1d3b979e1",
            project: "15"
        };
        "loading" == document.readyState ? document.addEventListener("DOMContentLoaded", o, !1) : o();
    }, {} ]
}, {}, [ "/project/src/js/proxy.js" ]);