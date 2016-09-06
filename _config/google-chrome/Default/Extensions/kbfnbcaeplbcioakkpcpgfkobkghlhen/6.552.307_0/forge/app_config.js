window.forge = {}; window.forge.config = {
    "author": "Grammarly", 
    "config_hash": "CONFIG_HASH_HERE", 
    "config_version": "4", 
    "core": {
        "chrome": {
            "content_security_policy": "script-src 'self' 'unsafe-eval' https://stats-public.grammarly.io/ https://auth.grammarly.com/ https://www.google-analytics.com/analytics.js https://www.google-analytics.com/analytics_debug.js https://ssl.google-analytics.com https://cdn.mxpnl.com/libs/mixpanel-2.2.min.js; object-src 'self'", 
            "web_accessible_resources": []
        }, 
        "firefox": {
            "package_name": "87677a2c52b84ad3a151a4a72f5bd3c4"
        }, 
        "general": {
            "reload": true
        }, 
        "ie": {
            "package_name": "{5F544378-A5C0-FADC-F6B8-9745B3FB8A5C}"
        }, 
        "safari": {
            "package_name": "com.safari.grammarlyspellcheckergrammarchecker87677a2c52b84ad3a151a4a72f5bd3c4"
        }
    }, 
    "description": "Spell check and grammar check your writing when communicating online. Boost your productivity and credibility everywhere you write!", 
    "json_safe_name": "Grammarly Spell Checker & Grammar Checker", 
    "logging": {
        "console": true, 
        "level": "DEBUG"
    }, 
    "logging_level": "DEBUG", 
    "modules": {
        "parameters": {
            "updateTime": "156", 
            "version": "6.552.307"
        }
    }, 
    "name": "Grammarly Spell Checker & Grammar Checker", 
    "package_name": "grammarlyspellcheckergrammarchecker87677a2c52b84ad3a151a4a72f5bd3c4", 
    "platform_version": "v1.4", 
    "plugins": {
        "activations": {
            "config": {
                "activations": [
                    {
                        "patterns": [
                            "<all_urls>"
                        ], 
                        "run_at": "end", 
                        "scripts": [
                            "src/js/_vendor.js", 
                            "src/js/bundle.js", 
                            "src/js/editor-popup.js", 
                            "src/js/styles.js", 
                            "src/js/test-editor-popup.js"
                        ], 
                        "styles": [
                            "src/css/btn-hover-menu-new.css", 
                            "src/css/btn-hover-menu.css", 
                            "src/css/checkbox.css", 
                            "src/css/dialog.css", 
                            "src/css/fonts.css", 
                            "src/css/header-component.css", 
                            "src/css/permission-explanation.css", 
                            "src/css/popup-settings.css", 
                            "src/css/popup-signin.css", 
                            "src/css/referral.css", 
                            "src/css/selection-animator.css", 
                            "src/css/signin.css", 
                            "src/css/sites.css", 
                            "src/css/spinner.css", 
                            "src/css/textarea-btn-new.css", 
                            "src/css/textarea-btn.css", 
                            "src/css/toolbar-signin.css", 
                            "src/css/tooltip.css", 
                            "src/css/underline.css", 
                            "src/css/cards/base-card.css", 
                            "src/css/cards/dictionary-card.css", 
                            "src/css/cards/grammar-card.css", 
                            "src/css/signin-dialog/button.css", 
                            "src/css/signin-dialog/input.css", 
                            "src/css/signin-dialog/signin-dialog.css", 
                            "src/css/signin-dialog/welcome.css"
                        ]
                    }
                ]
            }, 
            "hash": "notahash"
        }, 
        "background": {
            "config": {
                "files": [
                    "js/_vendor.js", 
                    "js/bundle-bg.js", 
                    "js/bundle-popup.js"
                ]
            }, 
            "hash": "notahash"
        }, 
        "button": {
            "config": {
                "default_icon": "src/icon/icon48-chrome.png", 
                "default_icons": {
                    "firefox": "src/icon/icon16.png", 
                    "ie": "src/icon/favicon.ico", 
                    "safari": "src/icon/icon32.png"
                }, 
                "default_popup": "src/popup.html", 
                "default_title": "Grammarly"
            }, 
            "hash": "notahash"
        }, 
        "clipboardWrite": {
            "hash": "notahash"
        }, 
        "contact": {
            "hash": "notahash"
        }, 
        "cookies": {
            "hash": "notahash"
        }, 
        "cpu": {
            "hash": "notahash"
        }, 
        "externally_connectable": {
            "config": {
                "matches": [
                    "*://*.grammarly.com/*"
                ]
            }, 
            "hash": "notahash"
        }, 
        "file": {
            "hash": "notahash"
        }, 
        "icons": {
            "config": {
                "chrome": {
                    "128": "src/icon/icon128.png", 
                    "16": "src/icon/icon16.png", 
                    "48": "src/icon/icon48-chrome.png"
                }, 
                "firefox": {
                    "16": "src/icon/icon16.png", 
                    "19": "src/icon/icon19.png", 
                    "32": "src/icon/icon32.png", 
                    "64": "src/icon/icon64.png"
                }, 
                "safari": {
                    "32": "src/icon/icon32.png", 
                    "48": "src/icon/icon48.png", 
                    "64": "src/icon/icon64.png"
                }
            }, 
            "hash": "notahash"
        }, 
        "media": {
            "hash": "notahash"
        }, 
        "notification": {
            "hash": "notahash"
        }, 
        "optional_permissions": {
            "config": {
                "clipboardRead": true
            }, 
            "hash": "notahash"
        }, 
        "parameters": {
            "config": {
                "updateTime": "156", 
                "version": "6.552.307"
            }, 
            "hash": "notahash"
        }, 
        "prefs": {
            "hash": "notahash"
        }, 
        "request": {
            "config": {
                "permissions": [
                    "<all_urls>"
                ]
            }, 
            "hash": "notahash"
        }, 
        "tabs": {
            "hash": "notahash"
        }, 
        "update_url": {
            "config": {
                "safari": "https://safary-grammarly-plugin.s3.amazonaws.com/update.plist"
            }, 
            "hash": "notahash"
        }
    }, 
    "uuid": "87677a2c52b84ad3a151a4a72f5bd3c4", 
    "version": "6.552.307", 
    "xml_safe_name": "Grammarly Spell Checker &amp; Grammar Checker"
};