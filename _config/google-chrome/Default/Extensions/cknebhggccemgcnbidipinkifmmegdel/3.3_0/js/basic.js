var ALX_NS_PH_TB_Basic = A$.inherit(function(){}, {
  prefPrefix: "extensions.alexa.",
  platform_version: null,
  base_toolbar: null,
  base_platform: null,
  isTermsAccepted: function()
  {
    return (localStorage.privacyPolicyAccepted == "true");
  },
  acceptTerm: function()
  {
    localStorage.privacyPolicyAccepted = "true";
  },
  declineTerm: function()
  {
    localStorage.privacyPolicyAccepted = "false";
  },
  fetch_image:function(node, src)
  {
    var _alx_data = {
      src:      src
    };

    var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_FETCH_IMAGE", _alx_data);
    chrome.extension.sendRequest( _alx_data_payload, function(callbackObj) {
      node.src = callbackObj.returnData.src;
      node.onerror = function()
      {
        this.style.display = "none";
      }
    });
  },
  compositeUrl: function(base, params, separator)
  {
    var url = base;
    var sep = separator ? separator : "?";
    if (params)
       url = url + sep;
       
    for(var key in params)
    {
      var value = params[key];
      url = url + key + "=" + encodeURIComponent(value) + "&";
    }
    return url;
  },
  decompositeUrl: function(url, separator)
  {
    var base = null;
    var sep = separator ? separator : "?";
    var params = {};

    var tmp = url.split(sep);

    if ( tmp.length > 1 )
    {
      base = tmp[0];
      var query_string = tmp[1];
      var tmp = query_string.split("&");
      for( var i = 0; i < tmp.length; i++ )
      {
        var paramstr = tmp[i];
        var parampair = paramstr.split("=");
        if (parampair.length == 2)
          params[parampair[0]] = decodeURIComponent(parampair[1]);
      }
    }
    
    return [base, params]
  },
  getSessionPref: function(name, defValue)
  {
    if ( name.indexOf( ALX_NS_PH_TB_Helper.prefPrefix ) != 0 )
      name = ALX_NS_PH_TB_Helper.prefPrefix + name  

    if ( typeof sessionStorage[name] != "undefined") 
    {
      var payload = JSON.parse(sessionStorage[name]);
      return payload;
    } else
      return defValue;
  },
  setSessionPref: function(name, value)
  {
    if ( name.indexOf( ALX_NS_PH_TB_Helper.prefPrefix ) != 0 )
      name = ALX_NS_PH_TB_Helper.prefPrefix + name  
    
    sessionStorage[name] = JSON.stringify(value);
  },
  deleteSessionPref: function(name)
  {
    if ( name.indexOf( ALX_NS_PH_TB_Helper.prefPrefix ) != 0 )
      name = ALX_NS_PH_TB_Helper.prefPrefix + name;
    
    if ( typeof sessionStorage[name] != "undefined")
      delete sessionStorage[name]; 
  },
  getPref: function(name, defValue)
  {
    if ( name.indexOf( ALX_NS_PH_TB_Helper.prefPrefix ) != 0 )
      name = ALX_NS_PH_TB_Helper.prefPrefix + name  
    if ( typeof localStorage[name] != "undefined")
    {
      var payload = JSON.parse(localStorage[name]);
      return payload["value"]
    }
    else
      return defValue;
  },
  setPref: function(name, value)
  {
    if ( name.indexOf( ALX_NS_PH_TB_Helper.prefPrefix ) != 0 )
      name = ALX_NS_PH_TB_Helper.prefPrefix + name;
    
    var newValue  = value;
    var oldValue  = null;
    var payload = {"value": value, "defValue": value};
    if ( typeof localStorage[name] != "undefined")
    {
      payload = JSON.parse(localStorage[name])
      oldValue = payload["value"]
      payload["value"] = value; 
    }
    localStorage[name] = JSON.stringify(payload);
    ALX_NS_PH_TB_Helper.observe(name, newValue, oldValue); 
  }, 
  deletePref: function(name)
  {
    if ( name.indexOf( ALX_NS_PH_TB_Helper.prefPrefix ) != 0 )
      name = ALX_NS_PH_TB_Helper.prefPrefix + name;
    
    if ( typeof localStorage[name] != "undefined")
      delete localStorage[name]; 
  },
  setPrefIfUnchanged: function(name, value)
  {
    if ( name.indexOf( ALX_NS_PH_TB_Helper.prefPrefix ) != 0 )
      name = ALX_NS_PH_TB_Helper.prefPrefix + name;

    var payload = {"value": value, "defValue": value};
    if ( typeof localStorage[name] != "undefined")
    {
      payload = JSON.parse(localStorage[name])
      if ( payload.value == payload.defValue)
      {
        payload.value = value;
      } 
      payload.defValue = value;
    } 

    localStorage[name] = JSON.stringify(payload);
  },
  getVersion: function()
  {
    return ALX_NS_PH_TB_Helper.getPref("pre-defined.toolbar_version", "");
  },
  getToolbarId: function()
  {
    var toolbar_id = null;
    if ("ALX_NS_PH" == "TBPLATFORM_NS_PH")
    {
      toolbar_id = ALX_NS_PH_TB_Helper.getPref("pre-defined.toolbar_id", null);
      if ( toolbar_id == null )
        toolbar_id = ALX_NS_PH_TB_Helper.getPref("post-defined.toolbar_id",  null);
    }
    return toolbar_id;
  },
  getMyVersion: function()
  {
    try
    {
      if ("ALX_NS_PH" == "TBPLATFORM_NS_PH")
      {
        var toolbar_id = ALX_NS_PH_TB_Helper.getPref("pre-defined.toolbar_id", null);
        if ( toolbar_id == null )
          toolbar_id = ALX_NS_PH_TB_Helper.getPref("post-defined.toolbar_id",  null);
        else
          ALX_NS_PH_TB_Helper.setPref("post-defined.toolbar_id", toolbar_id);

        if (toolbar_id != null)
          return "p" + toolbar_id + "g-" + ALX_NS_PH_TB_Helper.getVersion();
        else
          return "p000000g-" + ALX_NS_PH_TB_Helper.getVersion();
      }
      else
        return "alxg-" + ALX_NS_PH_TB_Helper.getVersion();
    } catch(ex) { return "alxg"; }
  },
  urlReplacement: function(url)
  {
    var toolbar_id = ALX_NS_PH_TB_Helper.getToolbarId();
    if (ALX_NS_PH_TB_Helper.platform_version == null)
    {
      ALX_NS_PH_TB_Helper.platform_version = ALX_NS_PH_TB_Helper.getPref("pre-defined.platform_version", null)
      if ( ALX_NS_PH_TB_Helper.platform_version == null )
      {
        ALX_NS_PH_TB_Helper.platform_version = ALX_NS_PH_TB_Helper.getPref("post-defined.platform_version", null)
      } else 
      {
        ALX_NS_PH_TB_Helper.setPref("post-defined.platform_version",  ALX_NS_PH_TB_Helper.platform_version)
      }
    }
    if (ALX_NS_PH_TB_Helper.base_toolbar == null)
    {
      ALX_NS_PH_TB_Helper.base_toolbar = ALX_NS_PH_TB_Helper.getPref("pre-defined.base_toolbar", null)
      if ( ALX_NS_PH_TB_Helper.base_toolbar == null )
      {
        ALX_NS_PH_TB_Helper.base_toolbar  = ALX_NS_PH_TB_Helper.getPref("post-defined.base_toolbar", null)
      } else 
      {
        ALX_NS_PH_TB_Helper.setPref("post-defined.base_toolbar", ALX_NS_PH_TB_Helper.base_toolbar)
      }
    }
    if (ALX_NS_PH_TB_Helper.base_platform == null)
    {
      ALX_NS_PH_TB_Helper.base_platform = ALX_NS_PH_TB_Helper.getPref("pre-defined.base_platform", null)
      if ( ALX_NS_PH_TB_Helper.base_platform == null )
      {
        ALX_NS_PH_TB_Helper.base_platform = ALX_NS_PH_TB_Helper.getPref("post-defined.base_platform", null)
      } else 
      {
        ALX_NS_PH_TB_Helper.setPref("post-defined.base_platform", ALX_NS_PH_TB_Helper.base_platform)
      }
      if (ALX_NS_PH_TB_Helper.base_platform == null)
        ALX_NS_PH_TB_Helper.base_platform = ALX_NS_PH_TB_Helper.base_toolbar;
      if (toolbar_id == null && ALX_NS_PH_TB_Helper.base_toolbar == null && 
          ALX_NS_PH_TB_Helper.base_platform != null && "ALX_NS_PH" == "TBPLATFORM_NS_PH")
        ALX_NS_PH_TB_Helper.base_toolbar = ALX_NS_PH_TB_Helper.base_platform.replace("_shared", "------");
    }

    var toolbar_url_root                    = ALX_NS_PH_TB_Helper.base_toolbar  + "/" + ALX_NS_PH_TB_Helper.platform_version + "/toolbar" 
    var button_url_root                     = ALX_NS_PH_TB_Helper.base_toolbar  + "/" + ALX_NS_PH_TB_Helper.platform_version + "/buttons" 
    var toolbar_locale_base_placeholder     = toolbar_url_root + "/locale" 
    var toolbar_url_platform                = ALX_NS_PH_TB_Helper.base_platform + "/" + ALX_NS_PH_TB_Helper.platform_version + "/toolbar" 
    var button_url_platform                 = ALX_NS_PH_TB_Helper.base_platform + "/" + ALX_NS_PH_TB_Helper.platform_version + "/buttons" 
    var toolbar_locale_platform_placeholder = toolbar_url_platform + "/locale"

    url = url.replace(/__BASE__TOOLBAR__/g, ALX_NS_PH_TB_Helper.base_toolbar);
    url = url.replace(/__BASE__PLATFORM__/g, ALX_NS_PH_TB_Helper.base_platform);
    url = url.replace(/__TOOLBAR__URL__ROOT__/g, toolbar_url_root);
    url = url.replace(/__VERSION__TOOLBAR__ROOT__PLACEHOLDER__/g, toolbar_url_root);
    url = url.replace(/__TOOLBAR__ROOT__PLACEHOLDER__/g, toolbar_url_root);
    url = url.replace(/__BUTTON__URL__ROOT__/g, button_url_root);
    url = url.replace(/__TOOLBAR__LOCALE__BASE__PLACEHOLDER__/g, toolbar_locale_base_placeholder); 
    url = url.replace(/__TOOLBAR__URL__PLATFORM__/g, toolbar_url_platform); 
    url = url.replace(/__BUTTON__URL__PLATFORM__/g, button_url_platform); 
    url = url.replace(/__TOOLBAR__LOCALE__PLATFORM__PLACEHOLDER__/g, toolbar_locale_platform_placeholder) 
    url = url.replace(/__BROWSER__PLACEHOLDER__/g, "g");
    url = url.replace(/__RANDOM__PLACEHOLDER__/g, ALX_NS_PH_TB_Helper.getTime() + "_" + ALX_NS_PH_TB_Helper.getRandom());
    var aid = ALX_NS_PH_TB_Helper.getPref("session", "");
    url = url.replace(/__AID__PLACEHOLDER__/g, encodeURIComponent(aid));
    url = url.replace(/__TOOLBAR__VERSION__/g, encodeURIComponent(ALX_NS_PH_TB_Helper.getVersion()));
    var associateId = ALX_NS_PH_TB_Helper.getPref("associateid.oem", null);
    if ( associateId == null )
      associateId = ALX_NS_PH_TB_Helper.getPref("associateid.toolbar", null);
    if ( associateId == null )
      associateId = ALX_NS_PH_TB_Helper.getPref("associateid.default", "");
    url = url.replace(/__ASSOCIATE__ID__PLACEHOLDER__/g, encodeURIComponent(associateId));
  
    return url;
  },
  observe: function(key, newData, oldData)
  {
  },
  getRandom: function()
  {
    var rand = Math.floor( Math.random()* 1000000000000000 );
    return rand;
  },
  getTime: function()
  {
    var t = new Date();
    return t.getTime();
  },
  createRequestData: function(data_type, data_load)
  {
    var _alx_data_payload = {
      message_type:     data_type,
      message_payload:  JSON.stringify(data_load)
    };
    return _alx_data_payload
  },
  sendRequest: function(method, url, func, data, headers, isSync)
  {
    var xhr = new XMLHttpRequest();
    var async = true; 
    if (isSync == true)
      async = false;
      
    xhr.open(method, url, async);

    if (func)
      xhr.onreadystatechange = func;
    else
      xhr.onreadystatechange = function() {};

    if (typeof headers == "object")
    {
      for (var key in headers)
      {
        var value = headers[key];
        xhr.setRequestHeader(key, value);
      } 
    }
  
    var payload = null;
    if (typeof data == "string")
      payload = data
    xhr.send(payload)
  },
  KeyEvent: {
    DOM_VK_CANCEL: 3,
    DOM_VK_HELP: 6,
    DOM_VK_BACK_SPACE: 8,
    DOM_VK_TAB: 9,
    DOM_VK_CLEAR: 12,
    DOM_VK_RETURN: 13,
    DOM_VK_ENTER: 14,
    DOM_VK_SHIFT: 16,
    DOM_VK_CONTROL: 17,
    DOM_VK_ALT: 18,
    DOM_VK_PAUSE: 19,
    DOM_VK_CAPS_LOCK: 20,
    DOM_VK_ESCAPE: 27,
    DOM_VK_SPACE: 32,
    DOM_VK_PAGE_UP: 33,
    DOM_VK_PAGE_DOWN: 34,
    DOM_VK_END: 35,
    DOM_VK_HOME: 36,
    DOM_VK_LEFT: 37,
    DOM_VK_UP: 38,
    DOM_VK_RIGHT: 39,
    DOM_VK_DOWN: 40,
    DOM_VK_PRINTSCREEN: 44,
    DOM_VK_INSERT: 45,
    DOM_VK_DELETE: 46,
    DOM_VK_0: 48,
    DOM_VK_1: 49,
    DOM_VK_2: 50,
    DOM_VK_3: 51,
    DOM_VK_4: 52,
    DOM_VK_5: 53,
    DOM_VK_6: 54,
    DOM_VK_7: 55,
    DOM_VK_8: 56,
    DOM_VK_9: 57,
    DOM_VK_SEMICOLON: 59,
    DOM_VK_EQUALS: 61,
    DOM_VK_A: 65,
    DOM_VK_B: 66,
    DOM_VK_C: 67,
    DOM_VK_D: 68,
    DOM_VK_E: 69,
    DOM_VK_F: 70,
    DOM_VK_G: 71,
    DOM_VK_H: 72,
    DOM_VK_I: 73,
    DOM_VK_J: 74,
    DOM_VK_K: 75,
    DOM_VK_L: 76,
    DOM_VK_M: 77,
    DOM_VK_N: 78,
    DOM_VK_O: 79,
    DOM_VK_P: 80,
    DOM_VK_Q: 81,
    DOM_VK_R: 82,
    DOM_VK_S: 83,
    DOM_VK_T: 84,
    DOM_VK_U: 85,
    DOM_VK_V: 86,
    DOM_VK_W: 87,
    DOM_VK_X: 88,
    DOM_VK_Y: 89,
    DOM_VK_Z: 90,
    DOM_VK_CONTEXT_MENU: 93,
    DOM_VK_NUMPAD0: 96,
    DOM_VK_NUMPAD1: 97,
    DOM_VK_NUMPAD2: 98,
    DOM_VK_NUMPAD3: 99,
    DOM_VK_NUMPAD4: 100,
    DOM_VK_NUMPAD5: 101,
    DOM_VK_NUMPAD6: 102,
    DOM_VK_NUMPAD7: 103,
    DOM_VK_NUMPAD8: 104,
    DOM_VK_NUMPAD9: 105,
    DOM_VK_MULTIPLY: 106,
    DOM_VK_ADD: 107,
    DOM_VK_SEPARATOR: 108,
    DOM_VK_SUBTRACT: 109,
    DOM_VK_DECIMAL: 110,
    DOM_VK_DIVIDE: 111,
    DOM_VK_F1: 112,
    DOM_VK_F2: 113,
    DOM_VK_F3: 114,
    DOM_VK_F4: 115,
    DOM_VK_F5: 116,
    DOM_VK_F6: 117,
    DOM_VK_F7: 118,
    DOM_VK_F8: 119,
    DOM_VK_F9: 120,
    DOM_VK_F10: 121,
    DOM_VK_F11: 122,
    DOM_VK_F12: 123,
    DOM_VK_F13: 124,
    DOM_VK_F14: 125,
    DOM_VK_F15: 126,
    DOM_VK_F16: 127,
    DOM_VK_F17: 128,
    DOM_VK_F18: 129,
    DOM_VK_F19: 130,
    DOM_VK_F20: 131,
    DOM_VK_F21: 132,
    DOM_VK_F22: 133,
    DOM_VK_F23: 134,
    DOM_VK_F24: 135,
    DOM_VK_NUM_LOCK: 144,
    DOM_VK_SCROLL_LOCK: 145,
    DOM_VK_COMMA: 188,
    DOM_VK_PERIOD: 190,
    DOM_VK_SLASH: 191,
    DOM_VK_BACK_QUOTE: 192,
    DOM_VK_OPEN_BRACKET: 219,
    DOM_VK_BACK_SLASH: 220,
    DOM_VK_CLOSE_BRACKET: 221,
    DOM_VK_QUOTE: 222,
    DOM_VK_META: 224
  }
});
