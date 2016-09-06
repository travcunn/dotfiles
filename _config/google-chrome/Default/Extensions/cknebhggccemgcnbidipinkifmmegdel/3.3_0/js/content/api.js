/******************
 * Liangnan Wu *
 * Alexa Internet *
 ******************/
var ALX_NS_PH_TB_Helper = new ALX_NS_PH_TB_Basic();
(function () {
  if (typeof ALX_NS_PH_TB_API == "undefined") {
    window.ALX_NS_PH_TB_API = {
      topWindow: null,
      element: null,
      id: null,
      properties: null,
      isPageTurned: false,
      click: function(evt)
      {
        for(var i in Alexa.events._leftClickListeners)
        {
          var _leftClickListener = Alexa.events._leftClickListeners[i];
          _leftClickListener(evt);
        }
      },
      hasPageTurned: function()
      {
        return ALX_NS_PH_TB_API.isPageTurned;
      },
      pageturn: function(data)
      {
        //console.log("pageturn")
        //console.log(data)
        for(var i in Alexa.events._pageTurnListeners)
        {
          var pageTurnListener = Alexa.events._pageTurnListeners[i];
          //console.log(pageTurnListener)
          pageTurnListener(data);
        }
        ALX_NS_PH_TB_API.isPageTurned = true;
      },
      init: function()
      {
        ALX_NS_PH_TB_API.topWindow  = window.parent;
        ALX_NS_PH_TB_API.element    = window.frameElement;
        var tmpID = window.frameElement.id;
        if (tmpID)
        {
          //var tmpIDlist = tmpID.split("-");
          //if (tmpIDlist && tmpIDlist.length)
          //  ALX_NS_PH_TB_API.id = tmpIDlist[tmpIDlist.length - 1];
          for (var key in ALX_NS_PH_TB_API.topWindow.Factory.buttons)
          {
            var but = ALX_NS_PH_TB_API.topWindow.Factory.buttons[key];
            if (but.type == "javascript" && but.elements.javascript && but.elements.javascript.id == tmpID)
            {
              ALX_NS_PH_TB_API.id = key;
              break;
            }
          }
        }

        if (ALX_NS_PH_TB_API.id)
        {
          ALX_NS_PH_TB_API.properties = ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].properties;
          Alexa.button.properties = ALX_NS_PH_TB_API.properties;
          var sandbox = document.createElement("script");
          if (ALX_NS_PH_TB_API.properties.javascript)
          {
            //console.log(ALX_NS_PH_TB_API.properties.javascript);
            sandbox.innerText = ALX_NS_PH_TB_API.properties.javascript;
          }
          else if (ALX_NS_PH_TB_API.properties.embeddedscripturl)
          {
            console.log(ALX_NS_PH_TB_API.properties.embeddedscripturl);
            sandbox.src = ALX_NS_PH_TB_API.properties.embeddedscripturl;
          }
          document.body.appendChild(sandbox);

          if (!ALX_NS_PH_TB_API.hasPageTurned() && ALX_NS_PH_TB_API.topWindow.ALX_NS_PH_TB_RENDER.data)
            ALX_NS_PH_TB_API.pageturn(ALX_NS_PH_TB_API.topWindow.ALX_NS_PH_TB_RENDER.data);
        }
      }
    }
  }
  if (typeof Alexa == "undefined") {
    window.Alexa = {
      browser: {
        arguments: null,
        getLocale: function()
        {
          var locale = ALX_NS_PH_TB_Helper.getPref("toolbarLocale", "default");
          return locale;
        },
        getSiteInfo: function()
        {
          return ALX_NS_PH_TB_API.topWindow.ALX_NS_PH_TB_RENDER.data;
        },
        getSelectedText: null,
        navigate: function (url, openIn, features, args, event)
        {
          var button = ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id];
          var align = button.popup_align_element || button.element;
          var boundingbox = align.getBoundingClientRect();
          event = {alignbox: boundingbox, bid: button.id, menuid: "transparent"}

          var winProxy = ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].navigate(url, openIn, features, args, event);
          var winWrapper = {
            _closed: true,
            _state: "open",
            close: function () {
              //return win.close();
              ALX_NS_PH_TB_API.topWindow.ALX_NS_PH_TB_RENDER.callWinProxyMethod(winProxy, "close");
              ALX_NS_PH_TB_API.topWindow.ALX_NS_PH_TB_RENDER.removeWinProxy(winProxy);
            },
            isClosed: function () {
              return winWrapper._closed;
            },
            focus: function () {
              //return win.focus()
              ALX_NS_PH_TB_API.topWindow.ALX_NS_PH_TB_RENDER.callWinProxyMethod(winProxy, "focus");
            },
            isVisible: function () {
              return winWrapper._state;
            },
            show: function () {
              //return win.show()
              ALX_NS_PH_TB_API.topWindow.ALX_NS_PH_TB_RENDER.callWinProxyMethod(winProxy, "show");
            },
            hide: function () {
              //return win.hide()
              ALX_NS_PH_TB_API.topWindow.ALX_NS_PH_TB_RENDER.callWinProxyMethod(winProxy, "hide");
            }
          };
          return winWrapper;
        },
        getPageElementByXpath: null,
        getPageElementProperty: null
      },
      button: {
        menu: {
          _callbackFuncs: {},
          addCallbackItem: function(label, callback, cookie, icon)
          {
            var item_id = label + "_" + ALX_NS_PH_TB_Helper.getTime() + "_" + ALX_NS_PH_TB_Helper.getRandom();
            var button_id = ALX_NS_PH_TB_API.id;
            Alexa.button.menu._callbackFuncs[item_id] = callback;
            ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].menu_button.menu.add_menu_item({name: label, type: "callback", callbackId: item_id, buttonId: button_id});
          },
          addSeparator: function()
          {
            ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].menu_button.menu.add_menu_item({type: "menuBreak"});
          },
          addUrlItem: function(label, callback, openIn, windowFeatures, icon)
          {
            var obj = {type: "url", name: label, link: callback, openIn: openIn, windowFeatures: windowFeatures};
            ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].menu_button.menu.add_menu_item(obj);
          },
          create: function()
          {
            ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].menu_button.menu.element.style.display = "";
          },
          clear: function()
          {
            Alexa.button.menu._callbackFuncs = {};
            ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].menu_button.menu.clear_menu_items();
          },
          destroy: function()
          {
            Alexa.button.menu.clear();
            ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].menu_button.menu.element.style.display = "none";
          }
        },
        images: {
          clear: function()
          {
            if (ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].elements["appendImage"])
            {
              for(var key in ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].elements["appendImage"])
              {
                var image = ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].elements["appendImage"][key]
                ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].elements.removeChild(image);
              }
            }
            ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].elements["appendImage"] = {};
          }
        },
        properties: null,
        update: function() {},
        redraw: null,
        transform: function( transString )
        {
          //ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].image.element.style.webkitTransform = transString;
        }
      },
      menu: {
        set_items: null
      },
      events: {
        preventDefault: function (event) {
          if (event)
            event.preventDefault();
        },
        addListener: function (target, type, listener) {
          target.addEventListener(type, listener);
        },
        addCustomListener: null,
        addUrlChangeListener: null,
        _pageTurnListeners: [],
        addPageTurnListener: function(listener)
        {
          Alexa.events._pageTurnListeners.push(listener);
          if (ALX_NS_PH_TB_API.topWindow.ALX_NS_PH_TB_RENDER.data)
            listener(ALX_NS_PH_TB_API.topWindow.ALX_NS_PH_TB_RENDER.data);
        },
        _leftClickListeners: [],
        addLeftClickListener: function(listener)
        {
          Alexa.events._leftClickListeners.push(listener);
        },
        addPopupShowingListener: function() {},
        addMessageListener: null,
        addNetworkErrorListener: null,
        addButtonShowingListener: null
      },
      storage: {
        saveSessionState: null,
        readSessionState: null,
        readGlobalState: function(key)
        {
          var localUrl = ALX_NS_PH_TB_API.properties.embeddedscripturl;
          if (localUrl.indexOf(ALX_NS_PH_TB_Helper.urlReplacement("__TOOLBAR__URL__ROOT__")) == 0 || localUrl.indexOf(ALX_NS_PH_TB_Helper.urlReplacement("__BUTTON__URL__PLATFORM__")) == 0 || localUrl.indexOf("alexa.com") < 30)
          return ALX_NS_PH_TB_Helper.getPref(key);
        },
        saveGlobalState: function(key, value)
        {
          var localUrl = ALX_NS_PH_TB_API.properties.embeddedscripturl;
          if (localUrl.indexOf(ALX_NS_PH_TB_Helper.urlReplacement("__TOOLBAR__URL__ROOT__")) == 0 || localUrl.indexOf(ALX_NS_PH_TB_Helper.urlReplacement("__BUTTON__URL__PLATFORM__")) == 0 || localUrl.indexOf("alexa.com") < 30)
          return ALX_NS_PH_TB_Helper.setPref(key, value);
        },
        saveClientState: function(key, value)
        {
          return ALX_NS_PH_TB_Helper.setPref(ALX_NS_PH_TB_API.id + "." + key, value);
        },
        readClientState: function(key)
        {
          return ALX_NS_PH_TB_Helper.getPref(ALX_NS_PH_TB_API.id + "." + key, null);
        }
      },
      messaging: {
        postMessage: null
      },
      tools: {
        replacePlaceholders: null,
        getFeedLoader: function()
        {
          var obj = {
            loadParseItemsFunc: function(parseRssItemsFunc)
            {
              if (typeof parseRssItemsFunc === "function")
                ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].parseRssItemsFunc = parseRssItemsFunc;
            },
            loadRss: function()
            {
              ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].get_rss();
            }
          }
          return obj;
        },
        initFeedbutton: function()
        {
          Alexa.button.menu.destroy();
          Alexa.button.menu.create();
          Alexa.button.menu.clear();
          ALX_NS_PH_TB_API.topWindow.Factory.buttons[ALX_NS_PH_TB_API.id].create_headline();
        },
        XMLHttpRequest: function(inObj)
        {
          var _alx_data = {
            url:      inObj.url,
            needSendBack: true,
            needResponseText: true
          };
          if(inObj.method)
            _alx_data.method = inObj.method;
          if(inObj.headers)
            _alx_data.headers = inObj.headers;
          if(inObj.data)
            _alx_data.data = inObj.data;
          if (inObj.mozBackgroundRequest)
          {
            var urlhash = Crypto.MD5(inObj.url)
            var mozBackground = ALX_NS_PH_TB_Helper.getSessionPref(urlhash, false);
            if (!mozBackground)
            {
              ALX_NS_PH_TB_Helper.setSessionPref(urlhash, true);
              _alx_data.isforce = true;
            }
          }
          var _alx_data_payload = ALX_NS_PH_TB_API.topWindow.ALX_NS_PH_TB_Helper.createRequestData("BACK_CACHE_REQUEST", _alx_data);
          if (chrome.extension && chrome.extension.sendRequest)
            chrome.extension.sendRequest( _alx_data_payload, inObj.onload);
          else
            ALX_NS_PH_TB_API.topWindow.chrome.extension.sendRequest( _alx_data_payload, inObj.onload);
        },
        sandboxRequest: function(url, onload, method, data)
        {
          if (!method)
            method = "GET"
          if (!data && method == "POST")
            data = "";
          var inonload = function(responseObj)
          {
            onload(responseObj.responseText, responseObj.status)
          }
          var inObj = {url: url, onload: inonload, method: method, data: data};
          return Alexa.tools.XMLHttpRequest(inObj);
        },
        getOEMTag: null,
        setOEMTag: null,
        JSON: {
            decode: JSON.parse,
            encode: JSON.stringify
        },
        DOMParser: DOMParser,
        getNodeText: function (node) {
          return node.textContent;
        },
        setNodeText: function (node, text) {
          node.textContent = text;
        },
        getPartnerID: function () {
          return "ALX_NS_PH".replace("_NS_PH", "");
        },
        getFeatures: null,
        setFeatures: null,
        trace: function(msg) { console.log(msg); },
        setToolbarRoot: null,
        getToolbarRoot: null,
        checkSearchEngineStatus: null,
        addSearchEngine: null,
        removeSearchEngine: null
      }
    }
  }
})();

window.addEventListener("load", ALX_NS_PH_TB_API.init, false);
