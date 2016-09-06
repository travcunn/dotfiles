/******************
 * Liangnan Wu *
 * Alexa Internet *
 ******************/

(function () {
  if (typeof ALX_NS_PH_TB == "undefined")
  {
    window.ALX_NS_PH_TB = {
      privateWindows: {},
      cacheRequestMap: {},
      cacheRequestTimeOut: 15000,
      cacheRequestTimeOutError: 15000,
      toolbarConfiguration: {},
      _parseXMLNode: function(node)
      {
        if (!node) return null;

        var xmljsnode = {name: null, attrs: {}, children: [], value: null};
        xmljsnode.name = node.tagName;
        xmljsnode.value = node.textContent;
        if (node.attributes)
        for(var i = 0; i < node.attributes.length; ++i)
        {
          var attr  = node.attributes[i];
          var key   = attr["name"];
          var value = attr["value"];
          xmljsnode.attrs[key] = value;
        }

        var currentElementChild = null;
        if (node.firstElementChild)
          currentElementChild = node.firstElementChild;
        while (currentElementChild)
        {
          var child = ALX_NS_PH_TB._parseXMLNode(currentElementChild);
          if (child)
            xmljsnode.children.push(child);
          currentElementChild = currentElementChild.nextElementSibling;
        }
        return xmljsnode;
      },
      parseXML: function(value, prefKey)
      {
        var dp = new DOMParser();
        var xml = dp.parseFromString(value, "text/xml");

        var buttons = xml.documentElement.getElementsByTagName("button");
        var toolbar = {"configuration": null, "buttons": []};
        for(var i = 0; i < buttons.length; ++i)
        {
          var button = buttons[i];
          var button_tobeadd = ALX_NS_PH_TB._parseXMLNode(button);
          if (button_tobeadd)
            toolbar.buttons.push(button_tobeadd);
        }

        var configureNodes = xml.documentElement.getElementsByTagName("configuration");
        if(configureNodes.length)
        {
          var configuration_tobeadd = ALX_NS_PH_TB._parseXMLNode(configureNodes[0]);
          if (configuration_tobeadd)
              toolbar.configuration = configuration_tobeadd;
        }

        if (prefKey == "toolbarXMLJSON")
        {
          var conf = {};
          for(var i in toolbar.configuration.children)
          {
            var confNode = toolbar.configuration.children[i];
            conf[confNode.name] = confNode.value;
          }
          ALX_NS_PH_TB.setConfiguration(conf);
        }
        ALX_NS_PH_TB_Helper.setPref(prefKey, toolbar);
      },
      getToolbarInfo: function() {
        var obj = {
                    name: ALX_NS_PH_TB_Helper.getPref("pre-defined.toolbar_name", "Alexa Toolbar"),
                    version: ALX_NS_PH_TB_Helper.getPref("pre-defined.toolbar_version", null)
                  }
        return obj;
      },
      getButtons: function() {
        var buttons = [];
        var active_buttons = ALX_NS_PH_TB_Helper.getPref("active-buttons", "").split(",");
        for (var i = 0; i < active_buttons.length; i++) {
            var key = active_buttons[i];
            if (key && key.length) {
                var xml = ALX_NS_PH_TB_Helper.getPref("active-buttons." + key);
                var parser = new DOMParser();
                var doc = parser.parseFromString(xml, "text/xml");
                var titles = doc.documentElement.getElementsByTagName("title");
                if (titles && titles.length) {
                    var title = titles.item(0).textContent;
                    buttons.push({
                        "id": key,
                        "title": title
                    })
                }
            }
        }
        return buttons;
      },
      setButtons: function(message_pay_load)
      {
        if (message_pay_load.buttons)
        {
          var buttonStr = String(message_pay_load.buttons);
          ALX_NS_PH_TB_Helper.setPref("active-buttons", buttonStr);
        }
      },
      getLocale: function () {
        var locale = ALX_NS_PH_TB_Helper.getPref("toolbarLocale", "default");
        return locale;
      },
      setLocale: function (str) {
        if (str) {
          ALX_NS_PH_TB_Helper.setPref("toolbarLocale", str);
        }
      },
      getGlobalFeatures: function () {
        var params = [];
        if (ALX_NS_PH_TB_Helper.getPref("reviews")) params.push("reviews");
        if (ALX_NS_PH_TB_Helper.getPref("ranks")) params.push("website_rankings");
        if (ALX_NS_PH_TB_Helper.getPref("searchranks")) params.push("search_rankings");
        if (ALX_NS_PH_TB_Helper.getPref("error-handling")) params.push("error_handling");
        if (ALX_NS_PH_TB_Helper.getPref("location-bar-search")) params.push("location_bar_search");
        if (ALX_NS_PH_TB_Helper.getPref("usage-stats")) params.push("usage_stats");
        if (ALX_NS_PH_TB_Helper.getPref("alexa-relatedlinks")) params.push("alexa_relatedlinks");

        var dispStyle = ALX_NS_PH_TB_Helper.getPref("display-style")

        if (dispStyle)
        {
          dispStyle = "display_style_" + dispStyle
          params.push(dispStyle);
        }

        return params;
      },
      setGlobalFeatures: function (params) {
        for (key in params) {
          if (params[key] == "not-checked") params[key] = false;
          if (params[key] == "checked") params[key] = true;
          if (key == "website_rankings") ALX_NS_PH_TB_Helper.setPref("ranks", params[key]);
          else if (key == "search_rankings") ALX_NS_PH_TB_Helper.setPref("searchranks", params[key]);
          else if (key == "usage_stats") ALX_NS_PH_TB_Helper.setPref("usage-stats", params[key]);
          else if (key == "location_bar_search") ALX_NS_PH_TB_Helper.setPref("location-bar-search", params[key]);
          else if (key == "error_handling") ALX_NS_PH_TB_Helper.setPref("error-handling", params[key]);
          else if (key == "alexa_relatedlinks") ALX_NS_PH_TB_Helper.setPref("alexa-relatedlinks", params[key]);
          else if (key == "display_style") ALX_NS_PH_TB_Helper.setPref("display-style", params[key]);
          else ALX_NS_PH_TB_Helper.setPref(key, params[key]);
        }

        if (params.location_bar_search) ALX_NS_PH_TB_Helper.setPref('location-bar-search', params.location_bar_search);
        if (params.error_handling) ALX_NS_PH_TB_Helper.setPref('error-handling', params.error_handling);
      },
      getMenuPopupId: function(bid, menuid)
      {
        return "menupopup." + bid + "." + menuid;
      },
      fetchAlexaData: function(obj, sendResponse)
      {
        var searchboxtexts = ALX_NS_PH_TB_Helper.getSessionPref("searchboxTexts", {});
        var data = {searchboxText: searchboxtexts};
        var data_tmp = ALX_NS_PH_SPARKLINE.getPageInfo(obj.tabId);
        if ( data_tmp && obj.tabUrl == data_tmp.url )
        {
          data = data_tmp;
          data.searchboxText = searchboxtexts
        }
        sendResponse(data);
      },
      registerButton: function(message_pay_load)
      {
        var tabUrl = message_pay_load.tabUrl;
        var url    = message_pay_load.url;
        if (  tabUrl && url && ( tabUrl.indexOf(ALX_NS_PH_TB_Helper.urlReplacement("__TOOLBAR__URL__ROOT__")) == 0 ||
              tabUrl.indexOf(ALX_NS_PH_TB_Helper.urlReplacement("__BUTTON__URL__PLATFORM__")) == 0 ||
              tabUrl.indexOf("http://www.alexa.com") == 0 ||
              tabUrl.indexOf("https://www.alexa.com") == 0 ) )
        {
          var skip_confirm = message_pay_load.skip_confirm;
          var onload = function()
          {
            if (this.readyState == 4)
            {
              if (this.status == 200)
              {
                var xml = this.responseXML;
                var id = xml.getElementsByTagName("id")[0].textContent;
                var title = xml.getElementsByTagName("title")[0].textContent;
                var version = ALX_NS_PH_TB_Helper.getMyVersion();

                var text = this.responseText;
                var active_buttons = ALX_NS_PH_TB_Helper.getPref("active-buttons", "").split(",");
                if (id && (skip_confirm || window.confirm("Would you like to add the " + title + " button?"))) {
                    ALX_NS_PH_TB_Helper.setPref("active-buttons." + id + ".url", url);
                    ALX_NS_PH_TB_Helper.setPref("active-buttons." + id + ".version", ALX_NS_PH_TB_Helper.getMyVersion());
                    ALX_NS_PH_TB_Helper.setPref("active-buttons." + id, text);
                    if (active_buttons.indexOf(id) == -1) {
                      active_buttons.push(id);
                      ALX_NS_PH_TB_Helper.setPref("active-buttons", active_buttons.join(","));
                    }
                }
              }
            }
          }
          ALX_NS_PH_TB_Helper.sendRequest("GET", url, onload);
        }
      },
      setConfiguration: function(message_pay_load)
      {
        ALX_NS_PH_TB.toolbarConfiguration = message_pay_load;
        if (message_pay_load.toolbar_name) { 
          ALX_NS_PH_TB_Helper.setPref("pre-defined.toolbar_name", message_pay_load.toolbar_name); 
        }
        if (message_pay_load.toolbarId) { 
          ALX_NS_PH_TB_Helper.setPref("pre-defined.toolbar_id", message_pay_load.toolbarId); 
        }
        ALX_NS_PH_TB_Helper.setPref("toolbarConfiguration", message_pay_load);
        if (ALX_NS_PH_TB.toolbarConfiguration.httpsDadListUrl)
        {
          ALX_NS_PH_TB_Helper.getHttpsDataList(ALX_NS_PH_TB_Helper.urlReplacement(ALX_NS_PH_TB.toolbarConfiguration.httpsDadListUrl));
        }
      },
      menuCallback: function(message_pay_load)
      {
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("TOOLBAR_MENU_CALLBACK", message_pay_load);
        chrome.tabs.sendRequest(message_pay_load.tabId, _alx_data_payload);
      },
      setSearchboxText: function(message_pay_load)
      {
        var searchboxText = ALX_NS_PH_TB_Helper.getSessionPref("searchboxTexts", {});
        if (message_pay_load.id && typeof message_pay_load.value != "undefined")
          searchboxText[message_pay_load.id] = message_pay_load.value;
        searchboxText = ALX_NS_PH_TB_Helper.setSessionPref("searchboxTexts", searchboxText);
      },
      updatePageTurnListeners: function(tabId)
      {
        if (tabId)
        {
          if ( ALX_NS_PH_TB_Helper.getPref("display-style", "toolbar") == "toolbar")
          {
            chrome.tabs.executeScript(tabId, {file: "js/content/toolbar.js"}, function() {
              var now = new Date();
              now = now.getTime();
              var _alx_data = {pageturn: now};
              var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("TOOLBAR_FETCH_ALEXA_DATA", _alx_data);
              chrome.tabs.sendRequest(tabId, _alx_data_payload);
            });
          }
        }
      },
      parseOneXmlItem: function (menuItemChildren) {
          //var menuItemChildren = oneNode.childNodes;
        var menuItemProperties = {
          haschild: false,
          childs: null
        };
        var menuItemNodes = [];
        for (var j = 0; j < menuItemChildren.length; j++) {
          var item = menuItemChildren.item(j);
          var tagName = item.tagName;
          switch (tagName) {
            case "type":
            case "displayName":
            case "url":
            case "suggestionUrl":
            case "defaultText":
            case "openIn":
            case "image":
            case "icon":
            case "height":
            case "width":
            case "windowFeatures":
            case "visualSuggestions":
            case "suggestionHeader":
              menuItemProperties[tagName] = item.textContent;
              break;
            case "feedUrl":
              menuItemProperties["url"] = item.textContent;
              break;
            case "menuItems":
              menuItemNodes = item.childNodes;
              break;
            default:
                break;
          }
          if (tagName == "url" || tagName == "suggestionUrl" || tagName == "image" || tagName == "feedUrl")
            menuItemProperties[tagName] = ALX_NS_PH_TB_Helper.urlReplacement(menuItemProperties[tagName]);

        }

        if (menuItemProperties.type == "subMenu") {
          menuItemProperties.haschild = true;
          menuItemProperties.childs = []
          for (var i = 0; i < menuItemNodes.length; ++i) {
            var node = menuItemNodes.item(i);
            var pNode = ALX_NS_PH_TB.parseOneXmlItem(node.childNodes);
            if (pNode.type) menuItemProperties.childs.push(pNode);
          }
        }
        return menuItemProperties;
      },
      loadXmlMenuToProperty: function(menuItemNodes)
      {
        var menuItems = [];
        for (var i = 0; menuItemNodes && i < menuItemNodes.length; i++)
        {
          if (menuItemNodes.item(i).tagName != "menuItem") continue;
          menuItems.push(ALX_NS_PH_TB.parseOneXmlItem(menuItemNodes.item(i).childNodes));
        }
        return menuItems;
      },
      markDefaultProvider: function(itemList, last_selection)
      {
        if (itemList.length > 0)
        {
          for(var i in itemList)
          {
            var item = itemList[i];
            if (item.type == "provider")
            {
              if (i == last_selection)
              {
                item.defaultprovider = true;
                continue;
              }
            }
            item.defaultprovider = false;
          }
        }
      },
      hideSearchSuggestion: function(inobj)
      {
        var menupopupid = ALX_NS_PH_TB.getMenuPopupId(inobj.bid, inobj.menuid);
        var _alx_data = inobj;
        _alx_data.menupopupid = menupopupid;
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_HIDE_SEARCH_SUGGESTION", _alx_data);
        chrome.tabs.sendRequest(inobj.tabId, _alx_data_payload);
      },
      createSearchSuggestion: function(inobj)
      {
        var items  = inobj.items;
        var suggestions = inobj.suggestions;
        var menupopupid = ALX_NS_PH_TB.getMenuPopupId(inobj.bid, inobj.menuid);
        var _alx_data = inobj;
        _alx_data.menupopupid = menupopupid;
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_CREATE_SEARCH_SUUGGESTION", _alx_data);
        ALX_NS_PH_TB_Helper.setSessionPref(menupopupid, { items: items, suggestions: suggestions});
        chrome.tabs.sendRequest(inobj.tabId, _alx_data_payload);
      },
      createMenuFromItemList: function(inobj)
      {
        var itemList  = inobj.itemList;
        var createObj = inobj;
        if (itemList.length >= 0)
        {
          for (var i in itemList)
          {
            var item = itemList[i];
            if (ALX_NS_PH_TB.privateWindows[item.type])
            {
              for(var key in item)
                ALX_NS_PH_TB.privateWindows[item.type][key] = item[key];
            }
          }

          ALX_NS_PH_TB.markDefaultProvider(itemList, createObj.last_selection);
          var menupopupid = ALX_NS_PH_TB.getMenuPopupId(createObj.bid, createObj.menuid);
          var _alx_data = createObj;
          //var _alx_data = {menupopupid : menupopupid, bid: createObj.bid, menuid: createObj.menuid};
          _alx_data.menupopupid = menupopupid;
          var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_CREATE_MENU", _alx_data);
          ALX_NS_PH_TB_Helper.setSessionPref(menupopupid, itemList);
          chrome.tabs.sendRequest(createObj.tabId, _alx_data_payload);
        }
      },
      createMenu: function(createObj)
      {
        if (createObj.statusCode >= 400 || !( createObj.responseText ) )
          return;

        var dp = new DOMParser();
        var xml =  dp.parseFromString(createObj.responseText, "text/xml");
        var menuItemNodes = [];
        if (xml.firstChild.tagName == "menuItems") menuItemNodes = xml.firstChild.childNodes;
        else menuItemNodes = xml.childNodes;

        var itemList = ALX_NS_PH_TB.loadXmlMenuToProperty(menuItemNodes);
        createObj.itemList = itemList;

        ALX_NS_PH_TB.createMenuFromItemList( createObj )
        return itemList;
      },
      toggleDropDown: function(createObj)
      {
        var menupopupid = ALX_NS_PH_TB.getMenuPopupId(createObj.bid, createObj.menuid);
        var _alx_data = createObj;//{menupopupid : menupopupid, bid: createObj.bid, menuid: createObj.menuid, alignbox: createObj.alignbox, align: createObj.align};
        _alx_data["menupopupid"] = menupopupid;
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_TOGGLE_DROP_DOWN", _alx_data);
        chrome.tabs.sendRequest(createObj.tabId, _alx_data_payload);
      },
      resizeDropDown: function(createObj)
      {
        //var menupopupid = ALX_NS_PH_TB.getMenuPopupId(createObj.bid, createObj.menuid);
        var _alx_data = createObj;//{menupopupid : menupopupid, bid: createObj.bid, menuid: createObj.menuid, alignbox: createObj.alignbox, align: createObj.align};
        //_alx_data["menupopupid"] = menupopupid;
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_RESIZE_DROP_DOWN", _alx_data);
        chrome.tabs.sendRequest(createObj.tabId, _alx_data_payload);
      },
      closeDropDowns: function(cdpObj)
      {
        var _alx_data = {};
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_CLOSE_DROPDOWNS", _alx_data);
        chrome.tabs.sendRequest(cdpObj.tabId, _alx_data_payload);
      },
      getSearchSuggestionInfo: function( mlObj, sendResponse)
      {
        if (mlObj.menupopupid)
        {
          var searchsuggestioninfo = ALX_NS_PH_TB_Helper.getSessionPref(mlObj.menupopupid, null);
          sendResponse(searchsuggestioninfo);
        }
      },
      getMenuItems: function(mlObj, sendResponse)
      {
        if (mlObj.menupopupid)
        {
          var itemList = ALX_NS_PH_TB_Helper.getSessionPref(mlObj.menupopupid, null);
          sendResponse(itemList);
        }
      },
      getBase64Image: function()
      {
        var img = this;
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var dataURL = canvas.toDataURL("image/png");

        img.parentNode.removeChild(img);
        return dataURL
      },
      fetchImage: function(mlObj, sendResponse, isforce, extraInfo)
      {
        if ( isforce || (mlObj.tabUrl && mlObj.tabUrl.indexOf("https") == 0 && mlObj.src && mlObj.src.indexOf("https") != 0) )
        {
          var image = document.createElement("img");
          image.src = mlObj.src;
          image.onload = function()
          {
            var img = this;
            if (!extraInfo) extraInfo = {};
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            if (typeof extraInfo.width == undefined)
              extraInfo.width = img.width;
            canvas.height = img.height;
            if (typeof extraInfo.height == undefined)
              extraInfo.height = img.height;

            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            var dataURL = canvas.toDataURL("image/png");
            var returnData = { returnData: {src: dataURL} };
            if (isforce)
              returnData["returnData"]["imageData"] = ctx.getImageData(0, 0, extraInfo.width, extraInfo.height);
            sendResponse(returnData);
          };
          image.onerror = function()
          {
            sendResponse({returnData: {src: null}});
          };
        } else
          sendResponse({returnData: {src: mlObj.src}});
      },
      changeProvider: function(mlObj, sendResponse)
      {
        if (typeof mlObj.defaultprovider != "undefined")
        {
          var searchid = "search." + mlObj.bid + ".defaultprovider";
          ALX_NS_PH_TB_Helper.setPref(searchid, mlObj.defaultprovider);

          var itemList = ALX_NS_PH_TB_Helper.getSessionPref(mlObj.menupopupid, []);
          ALX_NS_PH_TB.markDefaultProvider(itemList, mlObj.defaultprovider);
          ALX_NS_PH_TB_Helper.setSessionPref(mlObj.menupopupid, itemList);
          sendResponse(mlObj);

          var _alx_data = mlObj;
          var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("TOOLBAR_UPDATE_SEARCH_BUTTON", _alx_data);
          chrome.tabs.sendRequest(mlObj.tabId, _alx_data_payload);
        }
      },
      buttonCallback: function(mlObj, sendResponse)
      {
        var _alx_data = mlObj;
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("TOOLBAR_BUTTON_CALLBACK", _alx_data);

        if (!mlObj.requireCallback)
          sendResponse({});

        chrome.windows.getAll( {populate:true}, function(wins) {
          for(var i in wins)
          {
            var win = wins[i];

            if (win.type != "popup")
            {
              for(var j in win.tabs)
              {
                var tab = win.tabs[j];

                if (tab.selected && ALX_NS_PH_SPARKLINE.okUrl(tab.url))
                {
                  chrome.tabs.sendRequest(tab.id, _alx_data_payload, function(backobj) {
                    if (mlObj.requireCallback)
                      sendResponse(backobj);
                  });
                }
              }
            }
          }
        });
      },
      updateRss: function(mlObj)
      {
        if (typeof mlObj.bid != "undefined")
        {
          var _alx_data = mlObj;
          var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("TOOLBAR_UPDATE_RSS", _alx_data);
          chrome.tabs.sendRequest(mlObj.tabId, _alx_data_payload);
        }
      },
      getPrivateWindowInfo: function(mlObj)
      {
        var type = mlObj.type;
        if (ALX_NS_PH_TB.privateWindows[type])
        {
          var url = ALX_NS_PH_TB_Helper.compositeUrl("/html/options.html", ALX_NS_PH_TB.privateWindows[type], "#");
          chrome.tabs.update(mlObj.tabId, {url: url});
        }
      },
      checkPagePosition: function(inobj)
      {
        var _alx_data = inobj;
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_CHECK_PAGE_POSITION", _alx_data);
        chrome.tabs.sendRequest(inobj.tabId, _alx_data_payload);
      },
      setToolbarRoot: function(inObj)
      {
        if (inObj.toolbar_root)
        {
          if ("ALX_NS_PH" == "TBPLATFORM_NS_PH")
            ALX_NS_PH_TB_Helper.setPref("display-style", "toolbar");
          ALX_NS_PH_TB_Helper.setPref("pre-defined.base_toolbar", inObj.toolbar_root);
        }
      },
      cacheRequest: function(crConf, sendResponse)
      {
        var url = crConf.url;
        url = ALX_NS_PH_TB_Helper.urlReplacement(url);
        var urlhash = Crypto.MD5(url);
        var method  = "GET";
        var headers = null;
        var data    = null;
        if (crConf.method)
          method = crConf.method;
        if (crConf.headers)
          headers = crConf.headers;
        if (crConf.data)
          data = crConf.data;

        var now = ALX_NS_PH_TB_Helper.getTime();

        var crCB = function(crConfObj, statusCode, responseText, isXml, headers)
        {
          var sendbackdata = {
            status  : statusCode,
            isXml   : isXml,
            headers : headers
          }

          if (crConfObj.action && ALX_NS_PH_TB[crConfObj.action] && typeof ALX_NS_PH_TB[crConfObj.action] === "function")
          {
            crConf.source       = "http-request";
            crConf.statusCode   = statusCode;
            crConf.responseText = responseText;
            crConf.isXml        = isXml;
            crConf.headers      = headers;

            sendbackdata.returnData = ALX_NS_PH_TB[crConfObj.action](crConf);
          }

          if (crConfObj.needSendBack && crConfObj.needSendBack == true)
          {
            if (crConfObj.needResponseText)
              sendbackdata.responseText = responseText;
            sendResponse(sendbackdata);
          } else
            sendResponse({});
        }

        if ( !crConf.isforce && method == "GET" && ALX_NS_PH_TB.cacheRequestMap[urlhash] &&
            (( ALX_NS_PH_TB.cacheRequestMap[urlhash]["status"] < 400 &&
            now < ALX_NS_PH_TB.cacheRequestMap[urlhash]["reqT"] + ALX_NS_PH_TB.cacheRequestTimeOut) ||
            ( now < ALX_NS_PH_TB.cacheRequestMap[urlhash]["reqT"] + ALX_NS_PH_TB.cacheRequestTimeOutError) ) )
        {
          var responseHit = ALX_NS_PH_TB_Helper.getSessionPref("cacheRequest." + urlhash, null);
          if (responseHit != null)
          {
            crCB(crConf, ALX_NS_PH_TB.cacheRequestMap[urlhash]["status"], responseHit, ALX_NS_PH_TB.cacheRequestMap[urlhash]["isXml"], ALX_NS_PH_TB.cacheRequestMap[urlhash]["headers"])
            return;
          }
        }

        var onload_cacheRequest = function()
        {
          if (this.readyState == 4)
          {
            var response = this.responseText;
            var status   = this.status;
            var isXml    = this.responseXML ? true : false;
            var headers_string  = this.getAllResponseHeaders();
            var headers_list = headers_string.split("\r\n");
            var headers = {};
            for(var i in headers_list)
            {
              var header = headers_list[i];
              if (header)
              {
                var header = header.split(": ");
                if (header.length > 1)
                  headers[header[0].toLowerCase()] = header[1];
              }
            }
            ALX_NS_PH_TB.cacheRequestMap[urlhash] = {
              reqT: now,
              status: status,
              isXml: isXml,
              headers: headers,
              url:  url
            }
            ALX_NS_PH_TB_Helper.setSessionPref("cacheRequest." + urlhash, response);
            crCB(crConf, status, response, isXml, headers)
          }
        }
        ALX_NS_PH_TB_Helper.sendRequest(method, url, onload_cacheRequest, data, headers);

      },
      requestApiData: function( message_pay_load, sendResponse )
      {
        var data = {}
        if (message_pay_load.data && message_pay_load.data.length)
        {
          for(var i in message_pay_load.data)
          {
            var request_data = message_pay_load.data[i];
            if (request_data.type)
            {
              switch (request_data.type)
              {
                case "globalFeatures":
                  data[request_data.type] = ALX_NS_PH_TB.getGlobalFeatures();
                  break;
                case "locale":
                  data[request_data.type] = ALX_NS_PH_TB.getLocale();
                  break;
                case "toolbarInfo":
                  data[request_data.type] = ALX_NS_PH_TB.getToolbarInfo();
                  break;
                case "getButtons":
                  data[request_data.type] = ALX_NS_PH_TB.getButtons();
                  break;
                default:
                  break;
              }
            }
          }
        }
        sendResponse({data: data});
      },
      injectJs: function( message_pay_load )
      {
        if (message_pay_load.javascripturl)
        {
          var code = "var script = document.createElement('script'); script.src ='" + message_pay_load.javascripturl + "'; document.body.appendChild(script)";
          chrome.tabs.executeScript(message_pay_load.tabId, {code: code}, function() {});
        }
      },
      setApiData: function( message_pay_load )
      {
        var data = {}
        if (message_pay_load.type)
        {
          switch (message_pay_load.type)
          {
            case "globalFeatures":
              data[message_pay_load.type] = ALX_NS_PH_TB.setGlobalFeatures(message_pay_load.extra);
              break;
            case "locale":
              data[message_pay_load.type] = ALX_NS_PH_TB.setLocale(message_pay_load.extra);
              break;
            default:
              break;
          }
        }
      },
      closeApiWindow: function( message_pay_load )
      {
        if ( ALX_NS_PH_SPARKLINE.okUrl(message_pay_load.tabUrl) )
        {
          if (message_pay_load.name)
          {
            var _alx_data = {menupopupid: message_pay_load.name};

            var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_REMOVE_TRANSPARENT_WINDOW", _alx_data);
            chrome.tabs.sendRequest(message_pay_load.tabId, _alx_data_payload, function() {});
          }
        }
        else
          chrome.tabs.remove(message_pay_load.tabId);
      },
      applyWinMethod: function( message_pay_load )
      {
        if (message_pay_load && message_pay_load.obj)
        {
          if (message_pay_load.obj.type == "window" && message_pay_load.obj.id)
          {
            if (message_pay_load.method == "close")
              chrome.windows.remove(message_pay_load.obj.id)
            if (message_pay_load.method == "focus" || message_pay_load.method == "show")
              chrome.windows.update(message_pay_load.obj.id, {focused: true})
            if (message_pay_load.method == "hide")
              chrome.windows.update(message_pay_load.obj.id, {focused: false})
          }
          if (message_pay_load.obj.type == "tab" && message_pay_load.obj.id)
          {
            if (message_pay_load.method == "close")
              chrome.tabs.remove(message_pay_load.obj.id)
            if (message_pay_load.method == "focus" || message_pay_load.method == "show")
              chrome.tabs.update(message_pay_load.obj.id, {active: true})
            if (message_pay_load.method == "hide")
              chrome.tabs.update(message_pay_load.obj.id, {active: false})
          }
          if (message_pay_load.obj.type == "transparent" && message_pay_load.obj.id && message_pay_load.obj.tabId)
          {
            /*if (message_pay_load.method == "close")
              chrome.tabs.remove(message_pay_load.obj.id)
            if (message_pay_load.method == "focus")
              chrome.tabs.update(message_pay_load.obj.id, {active: true})
            if (message_pay_load.method == "show")
              chrome.tabs.update(message_pay_load.obj.id, {active: true})*/
            if (message_pay_load.method == "hide")
            {
              var _alx_data = {};
              _alx_data["menupopupid"] = message_pay_load.obj.id;
              var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_TOGGLE_DROP_DOWN", _alx_data);
              chrome.tabs.sendRequest( message_pay_load.obj.tabId, _alx_data_payload, function() {});
            }
          }
        }
      },
      internalLoadURL: function(crConf, sendResponse)
      {
        var url = crConf.url;
        var openIn = crConf.openIn;
        var type = crConf.type;
        var features = crConf.features ? crConf.features : "";
        var args     = crConf.args ? crConf.args : [];
        var event    = crConf.event ? crConf.event : {};

        if (type == "backgroundOptions")
          type = "options";
        if (url)
          url = ALX_NS_PH_TB_Helper.urlReplacement(url);

        if (type && ALX_NS_PH_TB.privateWindows[type])
        {
          url = ALX_NS_PH_TB_Helper.compositeUrl("/html/options.html", ALX_NS_PH_TB.privateWindows[type], "#");
          chrome.tabs.create({url: url});
          return
        }

        var featureArray = features.split(",");
        var validFeatures = [];
        var height, width,
            transparent = 0,
            left = 0,
            top = 0,
            align = "after_end",
            resizable = 1,
            status = 1,
            aligndetect = 0;

        for (var i = 0; i < featureArray.length; i++) {
          var feature = featureArray[i];
          if (feature.match("^height=")) {
              height = feature.replace(/^height=/, "");
              validFeatures.push(feature);
          } else if (feature.match("^width=")) {
              width = feature.replace(/^width=/, "");
              validFeatures.push(feature);
          } else if (feature.match("^transparent(=yes)?$")) {
              transparent = 1;
          } else if (feature.match("^aligndetect$")) {
              aligndetect = 1;
          } else if (feature.match("^resizable=no$")) {
              resizable = 0;
              validFeatures.push(feature);
          } else if (feature.match("^status=no$")) {
              status = 0;
              validFeatures.push(feature);
          } else if (feature.match("^align=")) {
              align = feature.replace(/^align=/, "");
          } else if (feature.match("^left=")) {
              left = parseInt(feature.replace("left=", ""), 10);
              validFeatures.push(feature);
          } else if (feature.match("^top=")) {
              top = parseInt(feature.replace("top=", ""), 10);
              validFeatures.push(feature);
          } else {
              validFeatures.push(feature);
          }
        }

        if (aligndetect)
          align = "auto"
        var position = {
          height: height,
          width: width,
          top: top,
          left: left
        }

        if ("newTab" == openIn) {
          chrome.tabs.create({url: url}, function(_tab) {
            var _tab_obj = { type: "tab", id: _tab.id }
            sendResponse(_tab_obj);
          });
        } else if ("newDialog" == openIn) {
          if (transparent)
          {
            var _alx_data = event;
            var menupopupid = ALX_NS_PH_TB.getMenuPopupId(_alx_data.bid, _alx_data.menuid);
            _alx_data["url"] = url;
            _alx_data["menupopupid"] = menupopupid;
            _alx_data["position"] = position;
            if (typeof _alx_data.isforce == "undefined")
              _alx_data["isforce"] = true;
            var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_CREATE_TRANSPARENT_WINDOW", _alx_data);
            chrome.tabs.sendRequest(crConf.tabId, _alx_data_payload, function() {
              _alx_data.align = align;
              var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_TOGGLE_DROP_DOWN", _alx_data);
              chrome.tabs.sendRequest( crConf.tabId, _alx_data_payload, function() {
                var _win_obj = { type: "transparent", id: menupopupid, tabId: crConf.tabId }
                sendResponse(_win_obj);
              });
            });
            //chrome.windows.create({url: url, type: "popup"});
          } else {
            var name = Crypto.MD5(url)
            //window.open(url, name, validFeatures.join(","));
            chrome.windows.create({url: url, height: parseInt(height), width: parseInt(width), type: "popup", focused: true}, function(_win) {
              var _win_obj = { type: "window", id: _win.id }
              sendResponse(_win_obj);
            });
          }
        } else if ("newWindow" == openIn) {
          chrome.windows.create({url: url}, function(_win) {
            var _win_obj = { type: "window", id: _win.id }
            sendResponse(_win_obj);
          });
        } else if ("currentTab" == openIn)
        {
          chrome.tabs.update(crConf.tabId, {url: url}, function(_tab) {
            var _tab_obj = { type: "tab", id: _tab.id }
            sendResponse(_tab_obj);
          });
        } else
          sendResponse(null);
      }
    }
  }
  if (typeof ALX_NS_PH_TB.extension == "undefined")
  {
    ALX_NS_PH_TB.extension = {
      currentLocale: null,
      init_in_progress: false,
      windowsType: {},
      inject_toolbar: function(tabId)
      {
        chrome.tabs.executeScript(tabId, {file: "js/content/toolbar.js"}, function() {
          if ( ALX_NS_PH_TB_Helper.getPref("display-style", "toolbar") == "toolbar")
            ALX_NS_PH_TB.extension.displayToolbarBySetting(tabId);
          else
            ALX_NS_PH_TB.extension.removeToolbar(tabId);
        });
        //chrome.tabs.insertCSS(tabId, {file: "css/content/toolbar.css"});
      },
      inject_override: function(tabId, windowId)
      {
        // TODO: Finish this part of Google chrome has settingpage api ready
        //chrome.tabs.executeScript(tabId, {file: "js/content/override.js",  allFrames: true});
        //chrome.tabs.insertCSS(tabId, {file: "css/content/overide.css", allFrames: true});
      },
      init_toolbar: function(tabId, windowId)
      {
        if (ALX_NS_PH_TB_Helper.getPref("toolbarXMLText", null) == null)
          return;

        if ( ALX_NS_PH_TB.extension.windowsType[windowId] && ALX_NS_PH_TB.extension.windowsType[windowId] == "normal" )
        {
          ALX_NS_PH_TB.extension.inject_toolbar(tabId);
        } else {
          chrome.windows.get(windowId, function (window) {
            if (window && window.type)
            {
              ALX_NS_PH_TB.extension.windowsType[window.id] = window.type;
              if (window.type == "normal")
                ALX_NS_PH_TB.extension.inject_toolbar(tabId);
            }
          })
        }
      },
      updateOnUpdate: function(tabId, changeInfo, tab)
      {
        if (tab.selected && changeInfo.status == "loading" && ALX_NS_PH_SPARKLINE.okUrl(tab.url))
          ALX_NS_PH_TB.extension.init_toolbar(tabId, tab.windowId);
        if (tab.selected && changeInfo.status == "complete" && ALX_NS_PH_SPARKLINE.okSpecialUrl(tab.url))
          ALX_NS_PH_TB.extension.inject_override(tabId, tab.windowId);
      },
      updateOnSelectChange: function(tabId, selectInfo)
      {
        var callback = function(t) {
          if (ALX_NS_PH_SPARKLINE.okUrl(t.url))
            ALX_NS_PH_TB.extension.init_toolbar(t.id, t.windowId);
        };
        ALX_NS_PH_SPARKLINE.getTab(tabId, callback);
      },
      onWindowCreated: function(window)
      {
        if (window && window.type)
          ALX_NS_PH_TB.extension.windowsType[window.id] = window.type;
      },
      loadToolbarJson: function()
      {
        var toolbar = ALX_NS_PH_TB_Helper.getPref("toolbarXMLJSON", null);
        if(toolbar)
        {
          var conf = {};
          for(var i in toolbar.configuration.children)
          {
            var confNode = toolbar.configuration.children[i];
            conf[confNode.name] = confNode.value;
          }
          ALX_NS_PH_TB.setConfiguration(conf);
        }
      },
      renderCurrentPage: function( isReload )
      {
        chrome.windows.getAll( {populate:true}, function(wins) {
          for(var i in wins)
          {
            var win = wins[i];

            if (win.type == "normal")
            {
              for(var j in win.tabs)
              {
                var tab = win.tabs[j];

                if (tab.selected && ALX_NS_PH_SPARKLINE.okUrl(tab.url))
                {
                  if (isReload == true)
                    ALX_NS_PH_TB.extension.removeToolbar(tab.id);
                  ALX_NS_PH_TB.extension.init_toolbar(tab.id, tab.windowId);
                }
              }
            }
          }
        });
      },
      renderPageAction: function()
      {
        if ("ALX_NS_PH" == "TBPLATFORM_NS_PH")
        {
          if (ALX_NS_PH_TB_Helper.getToolbarId() == null && 
              ALX_NS_PH_TB_Helper.getPref("display-style", "toolbar") == "toolbar" &&
              ALX_NS_PH_TB_Helper.getPref("configured2", false) == false)
          {
            ALX_NS_PH_TB_Helper.setPref("display-style", "statusbar");
            ALX_NS_PH_TB_Helper.setPref("configured2", true);
          }
        }
        if (ALX_NS_PH_TB_Helper.getPref("display-style", "toolbar") == "toolbar")
        {
          var toolbar_name = ALX_NS_PH_TB_Helper.getPref("pre-defined.toolbar_name", "Alexa Traffic Rank")
          chrome.browserAction.setTitle({title: toolbar_name});
          chrome.browserAction.setPopup({popup: ""})
        } else if (ALX_NS_PH_TB_Helper.isTermsAccepted()) 
            chrome.browserAction.setPopup({popup: "/html/popup.html"});

        chrome.browserAction.onClicked.addListener(function(tab) {
          if (!ALX_NS_PH_TB_Helper.isTermsAccepted() && ALX_NS_PH_TB_Helper.getPref("display-style", "toolbar") == "statusbar")
            chrome.tabs.create({url: "/html/welcome.html"});
          else 
          {
            ALX_NS_PH_TB.extension.toggleToolbarDisplaySetting();
            ALX_NS_PH_TB.extension.displayToolbarBySetting(tab.id);
          }
        });
      },
      removeToolbar: function(tabId)
      {
        var _alx_data = {};
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("PAGE_HIDE_TOOLBAR", _alx_data);
        chrome.tabs.sendRequest(tabId, _alx_data_payload);
      },
      displayToolbarBySetting: function(tabId)
      {
        var action = "PAGE_SHOW_TOOLBAR";
        chrome.browserAction.setTitle({title: "Click to Hide Toolbar"});
        if (!ALX_NS_PH_TB_Helper.getPref("show-toolbar", true))
        {
          action = "PAGE_HIDE_TOOLBAR";
          chrome.browserAction.setTitle({title: "Click to Display Toolbar"});
        }

        var _alx_data = {};
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData(action, _alx_data);
        chrome.tabs.sendRequest(tabId, _alx_data_payload);
      },
      toggleToolbarDisplaySetting: function ()
      {
        if (ALX_NS_PH_TB_Helper.getPref("show-toolbar", true) == true)
          ALX_NS_PH_TB_Helper.setPref("show-toolbar", false)
        else
          ALX_NS_PH_TB_Helper.setPref("show-toolbar", true)
      },
      loadPrivateWindow: function()
      {
        ALX_NS_PH_TB.privateWindows["about"] = { url: "__TOOLBAR__LOCALE__PLATFORM__PLACEHOLDER__/" + ALX_NS_PH_TB_Helper.getPref("toolbarLocale", "default") + "/bubbles/about.htm", caption: "About - Alexa Toolbar", type: "about", width: 330, height: 176 };
        ALX_NS_PH_TB.privateWindows["options"] = { url: "__TOOLBAR__LOCALE__PLATFORM__PLACEHOLDER__/" + ALX_NS_PH_TB_Helper.getPref("toolbarLocale", "default") + "/bubbles/options.htm", caption: "Options - Alexa Toolbar", type: "options", width: 396, height: 400 };
        ALX_NS_PH_TB.privateWindows["locale"] = { url: "__TOOLBAR__LOCALE__PLATFORM__PLACEHOLDER__/" + ALX_NS_PH_TB_Helper.getPref("toolbarLocale", "default") + "/bubbles/locale.htm", caption: "Locales  - Alexa Toolbar", type: "locale", width: 396, height: 230 };
        ALX_NS_PH_TB.privateWindows["organize"] = { url: "__TOOLBAR__LOCALE__PLATFORM__PLACEHOLDER__/" + ALX_NS_PH_TB_Helper.getPref("toolbarLocale", "default") + "/bubbles/organize.htm", caption: "Organize Buttons - Alexa Toolbar", type: "organize", width: 275, height: 280 };
        if ("ALX_NS_PH_TB" == "TBPLATFORM_NS_PH_TB")
          ALX_NS_PH_TB.privateWindows["options"].height = 230;
        ALX_NS_PH_TB.extension.currentLocale = ALX_NS_PH_TB_Helper.getPref("toolbarLocale", "default");
      },
      init: function ()
      {
        ALX_NS_PH_TB.extension.loadPrivateWindow();
        if (!ALX_NS_PH_TB.extension.init_in_progress)
          ALX_NS_PH_TB.extension.init_in_progress = true;

        chrome.tabs.onUpdated.addListener(ALX_NS_PH_TB.extension.updateOnUpdate);
        chrome.tabs.onSelectionChanged.addListener(ALX_NS_PH_TB.extension.updateOnSelectChange);
        chrome.windows.onCreated.addListener(ALX_NS_PH_TB.extension.onWindowCreated);
        //ALX_NS_PH_TB.extension.init_toolbar();
        ALX_NS_PH_TB.extension.loadToolbarJson();
        ALX_NS_PH_TB.extension.renderPageAction();
        ALX_NS_PH_TB.extension.renderCurrentPage();
      },
      shutdown: function()
      {
        ALX_NS_PH_TB.privateWindows = {}
      }
    }
  }
})();

window.addEventListener("load", function () { ALX_NS_PH_TB.extension.init(); }, false);
window.addEventListener("unload", function () { ALX_NS_PH_TB.extension.shutdown(); }, false);
