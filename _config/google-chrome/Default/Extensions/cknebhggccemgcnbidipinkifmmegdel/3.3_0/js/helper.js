function trace(msg)
{
  if ( ALX_NS_PH_TB_Helper.debug ) console.log( "<"+String(JSON.stringify(msg))+">" );
}

var ALX_NS_PH_TB_Helper_Class = A$.inherit(ALX_NS_PH_TB_Basic, {
  debug: true,
  need_data: false,
  need_force_pref_update: null,
  isFirst: null,
  pinger: null,
  baseline: "https://data.alexa.com/data",
  extensionObj: null,
  sessionRequested: false,
  init_helper: function()
  {
    ALX_NS_PH_TB_Helper.need_data = ALX_NS_PH_TB_Helper.needDataRequests();
    if ( ALX_NS_PH_TB_Helper.extensionObj == null && chrome.management && chrome.management.get)
    {
      var func = function( extensionInfo )
      {
        ALX_NS_PH_TB_Helper.extensionObj = extensionInfo;
        var addon_version = extensionInfo.version;
        var local_version = ALX_NS_PH_TB_Helper.getPref("pre-defined.toolbar_version", null);
        if (typeof addon_version == "string" && local_version != addon_version)
        {
          ALX_NS_PH_TB_Helper.need_force_pref_update = true;
          ALX_NS_PH_TB_Helper.setPref("pre-defined.toolbar_version", addon_version);
        }
      }
      ALX_NS_PH_TB_Helper.getExtensionObj(func);
    }
    ALX_NS_PH_TB_Helper.pinger = ALX_NS_PH_TB_Helper.getSessionPref("pinger", null);
    //ALX_NS_PH_TB_Helper.requestSession();
    //ALX_NS_PH_TB_Helper.init_pinger();
  },
  shutdown: function()
  {
    ALX_NS_PH_TB_Helper.pinger = null;
    ALX_NS_PH_TB_Helper.extensionObj = null;
    ALX_NS_PH_TB_Helper.need_force_pref_update = null;
    return;
  },
  getExtensionObj: function(infunc)
  {
    chrome.management.get(String(location.host), infunc);
  },
  requestSession: function()
  {
    if (ALX_NS_PH_TB_Helper.sessionRequested)
      return;

    ALX_NS_PH_TB_Helper.sessionRequested = true;
    var pref = "extensions.alexa.session";
    var version = ALX_NS_PH_TB_Helper.getMyVersion();
    var session_in_store = ALX_NS_PH_TB_Helper.getPref(pref, "");

    if ( !session_in_store || session_in_store.length == 0 )
    {
      var src = ALX_NS_PH_TB_Helper.baseline + "?cli=10&stc";
      var onload_requestSession  = function ()
      {
        if (this.readyState == 4)
        {
          if ( "OK" == this.statusText )
          {
            var session = this.responseXML.documentElement.attributes.getNamedItem("AID").value;
            if (session && session != "=")
            {
              ALX_NS_PH_TB_Helper.setPref( pref, session );
            }
          }
        }
      }

      ALX_NS_PH_TB_Helper.sendRequest("GET", src, onload_requestSession)

    }
    else
      ALX_NS_PH_TB_Helper.init_pinger();
  },
  needDataRequests: function()
  {
    var collectAnonymousData = (ALX_NS_PH_TB_Helper.getPref("ranks") || ALX_NS_PH_TB_Helper.getPref("alexa-relatedlinks") || ALX_NS_PH_TB_Helper.getPref("reviews"));
    try {
      collectAnonymousData_global = ALX_NS_PH_TB_Helper.getPref( 'global_settings.collectAnonymousData', null );
      if (collectAnonymousData_global != null)
        collectAnonymousData = collectAnonymousData_global;
    } catch(e) {}
    if (ALX_NS_PH_TB_Helper.getPref("display-style", "toolbar") == "statusbar" && !ALX_NS_PH_TB_Helper.isTermsAccepted())
      collectAnonymousData = false;
    return collectAnonymousData;
  },
  pullXml: function(doc, xpath, def)
  {
    try
    {
      var res = doc.evaluate(xpath, doc, null, XPathResult.STRING_TYPE, null).stringValue;
      return res.length>0 ? res : def;
    } catch(ex) { return String(ex); }
  },
  observe: function(key, newData, oldData)
  {
    var value = newData
    if ( oldData != newData )
    {
      var logvalue = value;
      if ( typeof value == "boolean")
        logvalue = value ? "1" : "0";
      var params = [
        "name=" + encodeURIComponent(key),
        "value=" + encodeURIComponent(logvalue)
      ];

      if (typeof ALX_NS_PH_SPARKLINE != "undefined") ALX_NS_PH_SPARKLINE.readPrefs();
      if (key && -1 == key.indexOf(".active-buttons.") && -1 == key.indexOf(".signal."))
      {
        ALX_NS_PH_TB_Helper.log("prefs", params.join("&"));
      }

      if ( key == "extensions.alexa.toolbarLocale" )
      {
        var locale = value;
        locale = locale.replace(/\s+/gi, "");
        if (locale)
        {
          ALX_NS_PH_TB_Helper.getLocaleXml( true, true, locale);
        }
      }

      if (key == "extensions.alexa.toolbarXMLText" || key == "extensions.alexa.toolbarLocaleText" || key == "extensions.alexa.active-buttons")
      {
        ALX_NS_PH_TB.extension.loadPrivateWindow();
        if ( ALX_NS_PH_TB_Helper.getPref( "display-style", "toolbar") == "toolbar" &&
             ALX_NS_PH_TB_Helper.getPref("show-toolbar", true) == true
           )
        {
          if (key == "extensions.alexa.toolbarXMLText")
            ALX_NS_PH_TB.parseXML(decodeURIComponent(escape(value)), "toolbarXMLJSON");
          if (key == "extensions.alexa.toolbarLocaleText")
            ALX_NS_PH_TB.parseXML(decodeURIComponent(escape(value)), "toolbarLocaleJSON");

          ALX_NS_PH_TB.extension.renderCurrentPage(true);
        }
      }

      if (key == "extensions.alexa.pre-defined.base_platform")
        ALX_NS_PH_TB_Helper.base_platform = ALX_NS_PH_TB_Helper.getPref(key);

      if (key == "extensions.alexa.session")
        ALX_NS_PH_SPARKLINE.set_aid(value);

      if (key == "extensions.alexa.toolbarConfiguration")
        ALX_NS_PH_SPARKLINE.defaultIcon();

      if (key == "extensions.alexa.pre-defined.toolbar_id")
        ALX_NS_PH_SPARKLINE.resolveEndpoint();

      if (key == "extensions.alexa.httpsDadList")
        ALX_NS_PH_SPARKLINE.loadHttpsDadList();

      if (key == "extensions.alexa.searchconf" || key == "extensions.alexa.hidesearchranks" || key == "extensions.alexa.hideCBA")
      {
        ALX_NS_PH.Layouts.shutdown();
        ALX_NS_PH.Layouts.init();
      }

      if (key == "extensions.alexa.display-style")
      {
        if (value == "statusbar")
        {
          chrome.browserAction.setPopup({popup: "/html/popup.html"})
          ALX_NS_PH_TB_Helper.setPref("show-toolbar", true)
        }
        else
        {
          chrome.browserAction.setPopup({popup: ""})
        }
      }

      if (key == "extensions.alexa.pre-defined.base_toolbar")
      {
        ALX_NS_PH_TB_Helper.base_toolbar = ALX_NS_PH_TB_Helper.getPref(key, "");
        ALX_NS_PH_TB_Helper.dailyJob()
      }

      var aid = ALX_NS_PH_TB_Helper.getPref("extensions.alexa.session", "");
      if (key == "extensions.alexa.location-bar-search" ||
          key == "extensions.alexa.disabled" ||
          key == "extensions.alexa.uninstall" ||
          key == "extensions.alexa.session" ||
          key == "extensions.alexa.configured2")
      {
        ALX_NS_PH_TB_Helper.configure_keyword_search(aid);
      }

      if (!ALX_NS_PH_TB_Helper.pinger && aid)
      {
        ALX_NS_PH_TB_Helper.init_pinger();
      }
      if (key == "extensions.alexa.pre-defined.base_toolbar")
      {
        ALX_NS_PH_TB_Helper.base_toolbar = ALX_NS_PH_TB_Helper.getPref(key, "");
        ALX_NS_PH_TB_Helper.dailyJob()
      }

      if (!ALX_NS_PH_TB_Helper.pinger && aid)
      {
        ALX_NS_PH_TB_Helper.init_pinger();
      }

      var needed_data = ALX_NS_PH_TB_Helper.need_data;
      need_data = ALX_NS_PH_TB_Helper.needDataRequests();
      if (needed_data != need_data)
      {
        ALX_NS_PH_TB_Helper.log("measure", "enabled=" + (need_data ? "1" : "0"));
      }
    }
  },
  init_pinger: function()
  {
    if (!ALX_NS_PH_TB_Helper.pinger)
    {
      var PING_DELAY = 86400000 / 24;
      ALX_NS_PH_TB_Helper.pinger = true;
      ALX_NS_PH_TB_Helper.setSessionPref("pinger", true);
      window.setInterval(ALX_NS_PH_TB_Helper.dailyJob, PING_DELAY);
      ALX_NS_PH_TB_Helper.dailyJob();
    }
  },
  dailyJob: function()
  {
    ALX_NS_PH_TB_Helper.getGIURls();
    ALX_NS_PH_TB_Helper.getPlatformXml();
    ALX_NS_PH_TB_Helper.getToolbarPointerXml();
    ALX_NS_PH_TB_Helper.getLocaleXml( false, false );
    ALX_NS_PH_TB_Helper.ping();
    if (  "ALX_NS_PH_TB" == "TBPLATFORM_NS_PH_TB" || 
          ALX_NS_PH_TB_Helper.getPref("getHttpsDataList", false) || 
          ALX_NS_PH_TB_Helper.getPref("display-style", "toolbar") == "statusbar" )
    {
      ALX_NS_PH_TB_Helper.getSearchConfJs();
      ALX_NS_PH_TB_Helper.getHttpsDataList();
    }
  },
  getHttpsDataList: function(inUrl)
  {
    var src = inUrl ? inUrl : this.urlReplacement( "__TOOLBAR__URL__PLATFORM__/httpsdatalist.dat?rand=__RANDOM__PLACEHOLDER__" );
    if ("ALX_NS_PH_TB" == "TBPLATFORM_NS_PH_TB" && !inUrl)
      src = this.urlReplacement( "__BASE__PLATFORM__/httpsdatalist.dat?rand=__RANDOM__PLACEHOLDER__" );

    var onload_getHttpsDataList = function()
    {
      if (this.readyState == 4)
      {
        if (this.status == 200)
        {
          var contentText = this.responseText;
          var httpsDadList = JSON.parse(contentText);
          ALX_NS_PH_TB_Helper.setPref("httpsDadList", httpsDadList);
        }
      }
    }
    ALX_NS_PH_TB_Helper.sendRequest("GET", src, onload_getHttpsDataList);
  },
  getSearchConfJs: function()
  {
    var src = this.urlReplacement( "__TOOLBAR__URL__PLATFORM__/search_conf.js?rand=__RANDOM__PLACEHOLDER__" );
    if ("ALX_NS_PH_TB" == "TBPLATFORM_NS_PH_TB")
      src = this.urlReplacement( "__BASE__PLATFORM__/search_conf.js?rand=__RANDOM__PLACEHOLDER__" );

    var onload_getSearchConfJs = function()
    {
      if (this.readyState == 4)
      {
        if (this.status == 200)
        {
          var contentText = this.responseText;
          ALX_NS_PH_TB_Helper.setPref("extensions.alexa.searchconf", contentText);
        }
      }
    }
    ALX_NS_PH_TB_Helper.sendRequest("GET", src, onload_getSearchConfJs);
  },
  getToolbarPointerXml: function()
  {
    var src = this.urlReplacement( "__BASE__TOOLBAR__/toolbar_pointer.xml?rand=__RANDOM__PLACEHOLDER__" );
    var onload_getToolbarPointerXml = function()
    {
      if (this.readyState == 4)
      {
        if (this.status == 200)
        {
          var contentText = this.responseText;
          var contentXml  = this.responseXML;

          var error = contentXml.getElementsByTagName("Error");

          if (contentText && error.length == 0)
          {
            var toolbarXMLLocation = contentXml.getElementsByTagName("ToolbarXMLLocation")[0];
            if (toolbarXMLLocation)
            {
              toolbarXMLLocationStr = toolbarXMLLocation.textContent;
              if (typeof toolbarXMLLocationStr == "string" && toolbarXMLLocationStr != "")
              {
                ALX_NS_PH_TB_Helper.getToolbarXml(toolbarXMLLocationStr);
                return
              }
            }
          }
        }
        ALX_NS_PH_TB_Helper.getToolbarXml();
      }
    };
    ALX_NS_PH_TB_Helper.sendRequest("GET", src, onload_getToolbarPointerXml);
  },
  getPlatformXml: function()
  {
    var src = this.urlReplacement( "__BASE__PLATFORM__/platform.xml?rand=__RANDOM__PLACEHOLDER__" );
    var onload_getPlatformXml = function()
    {
      if (this.readyState == 4)
      {
        if (this.status >= 400)
        {
          return true;
        }
        if (this.status == 200)
        {
          var contentText = this.responseText;
          var contentXml  = this.responseXML;

          var error = contentXml.getElementsByTagName("Error");

          if (contentText && error.length == 0)
          {
            var inPlatformVersionStr = ALX_NS_PH_TB_Helper.getPref("pre-defined.platform_version", null)
            var platformVersion = contentXml.getElementsByTagName("PlatformVersion")[0];
            if (platformVersion)
            {
              platformVersionStr = platformVersion.textContent;
              if (typeof platformVersionStr == "string" && typeof inPlatformVersionStr == "string" && platformVersionStr != inPlatformVersionStr)
                ALX_NS_PH_TB_Helper.setPref("pre-defined.platform_version", platformVersionStr);
            }
          }
        }
      }
    };
    ALX_NS_PH_TB_Helper.sendRequest("GET", src, onload_getPlatformXml)
  },
  getToolbarXml: function( url )
  {
    var ver = ALX_NS_PH_TB_Helper.getMyVersion();
    var src = ALX_NS_PH_TB_Helper.urlReplacement( "__TOOLBAR__URL__ROOT__/toolbar.xml?rand=__RANDOM__PLACEHOLDER__" );
    if ( typeof url == "string" )
      src = ALX_NS_PH_TB_Helper.urlReplacement( url );

    var onload_getToolbarXml = function()
    {
      if (this.readyState == 4)
      {
        if (this.status == 200)
        {
          var contentText = this.responseText;
          var contentXml  = this.responseXML;

          var error = contentXml.getElementsByTagName("Error");
          var button = contentXml.getElementsByTagName("button");

          if (contentText && error.length == 0 && button.length > 0)
          {
            var current_ver = null;
            if (ALX_NS_PH_TB_Helper.getPref("extensions.alexa.toolbarXMLVersion", null))
              current_ver = ALX_NS_PH_TB_Helper.getPref("extensions.alexa.toolbarXMLVersion")
            if ( current_ver == ver )
            {
              ALX_NS_PH_TB_Helper.setPref("extensions.alexa.toolbarXMLVersion", ver);
              ALX_NS_PH_TB_Helper.setPref("extensions.alexa.toolbarXMLText", unescape(encodeURIComponent(contentText)));

              var tmpText = null;
              if (ALX_NS_PH_TB_Helper.getPref("extensions.alexa.toolbarXMLText", null))
                tmpText = ALX_NS_PH_TB_Helper.getPref("extensions.alexa.toolbarXMLText");

              contentText = unescape(encodeURIComponent(contentText));
              if (tmpText != contentText)
              {
                ALX_NS_PH_TB_Helper.setPref("extensions.alexa.toolbarXMLText", contentText);
              }
            } else {
              ALX_NS_PH_TB_Helper.setPref("extensions.alexa.toolbarXMLVersion", ver);
              var tmpText = null;
              if (ALX_NS_PH_TB_Helper.getPref("extensions.alexa.toolbarXMLText", null))
                tmpText = ALX_NS_PH_TB_Helper.getPref("extensions.alexa.toolbarXMLText");
              contentText = unescape(encodeURIComponent(contentText));
              if (tmpText == contentText)
                contentText = contentText + " "
              ALX_NS_PH_TB_Helper.setPref("extensions.alexa.toolbarXMLText", contentText);
            }
          }
        }
      }
    };
    ALX_NS_PH_TB_Helper.sendRequest("GET", src, onload_getToolbarXml);
  },
  getLocaleXml: function( isLangOnly, isForce, changedLocale )
  {
    var func = ALX_NS_PH_TB_Helper.getLocaleXml;
    var locale = null;
    var isToolbarLocale = null;

    if ( changedLocale )
    {
      locale = changedLocale;
      isToolbarLocale = true;
    }
    else if ( !isForce && ALX_NS_PH_TB_Helper.getPref("extensions.alexa.toolbarLocale") )
    {
      locale = ALX_NS_PH_TB_Helper.getPref("extensions.alexa.toolbarLocale");
      isToolbarLocale = true;
    } else {
      locale = "default"
      if (isLangOnly)
      {
        var tmpArray = locale.split("-");
        locale = tmpArray[0];
      }
      isToolbarLocale = false;
    }
    var src = ALX_NS_PH_TB_Helper.urlReplacement( "__TOOLBAR__LOCALE__PLATFORM__PLACEHOLDER__/" + locale + "/locale_resources.xml?rand=__RANDOM__PLACEHOLDER__" );

    var onload_getLocaleXml = function()
    {
      if (this.readyState == 4)
      {
        var toolbarLocaleText = null;
        if (this.status == 200)
        {
          var contentText = this.responseText;
          var contentXml  = this.responseXML;

          var error = contentXml.getElementsByTagName("Error");
          var button = contentXml.getElementsByTagName("button");

          if (contentText && error.length == 0 && button.length > 0)
          {
            ALX_NS_PH_TB_Helper.setPref("extensions.alexa.toolbarLocale", locale);
            toolbarLocaleText = unescape(encodeURIComponent(contentText));
          }
        }

        if (toolbarLocaleText == null && isLangOnly)
        {
          ALX_NS_PH_TB_Helper.setPref("extensions.alexa.toolbarLocale", "default");
          toolbarLocaleText = "";
        }
        if ( toolbarLocaleText != null )
        {
          var tmpText = null;
          if ( ALX_NS_PH_TB_Helper.getPref("extensions.alexa.toolbarLocaleText", null) )
            tmpText = ALX_NS_PH_TB_Helper.getPref("extensions.alexa.toolbarLocaleText");
          if(tmpText != toolbarLocaleText)
            ALX_NS_PH_TB_Helper.setPref("extensions.alexa.toolbarLocaleText", toolbarLocaleText);
          return;
        }

        if (isToolbarLocale == false)
          func( true , isForce);
      };
    }
    ALX_NS_PH_TB_Helper.sendRequest("GET", src, onload_getLocaleXml)
  },
  ping: function(isNew)
  {
    var isErrorHandling = false;
    var errorConfName = "extensions.alexa.error-handling";
    if ( ALX_NS_PH_TB_Helper.getPref( errorConfName, false ) )
      isErrorHandling = true;
    var toolbar_locale = ALX_NS_PH_TB_Helper.getPref("toolbarLocale", "default");

    var params = [
      "dad=" + ( ALX_NS_PH_TB_Helper.needDataRequests() ? "1" : "0" ),
      "search_provider=" + ( false ? "1" : "0"),
      "error_handling=" + (isErrorHandling ? "1" : "0"),
      "toolbar_locale=" + toolbar_locale
    ]

    if (isNew)
      params.push("new=1");

    ALX_NS_PH_TB_Helper.log("ping", params.join("&"));
  },
  getGIURls: function()
  {
    var src = ALX_NS_PH_TB_Helper.urlReplacement( "__TOOLBAR__URL__PLATFORM__/giurls.js?rand=__RANDOM__PLACEHOLDER__" );
    var onload_getGIURls = function()
    {
      if (this.readyState == 4 )
      {
        if (this.status == 200)
        {
          var contentText = this.responseText;
          var contentXml  = this.responseXML;

          var error = [];
          if (contentXml)
            error = contentXml.getElementsByTagName("Error");

          if (contentText && error.length == 0)
          {
            try {
              var giURlsObject = JSON.parse( contentText );
              if (giURlsObject.giResponseTimeOut)
                ALX_NS_PH_TB_Helper.setPref("extensions.alexa.giurls.giResponseTimeOut", giURlsObject.giResponseTimeOut);
              if (giURlsObject.giUrls)
              {
                ALX_NS_PH_TB_Helper.setPref("extensions.alexa.giurls.giUrls", JSON.stringify(giURlsObject.giUrls));
              }
            } catch(e) {}
          }
        }
      }
    };
    ALX_NS_PH_TB_Helper.sendRequest("GET", src, onload_getGIURls);
  },
  configure_keyword_search: function(aid)
  {
  },
  log: function(prefix, extra)
  {
    var aid = ALX_NS_PH_TB_Helper.getPref("extensions.alexa.session", "");
    var params = [
      "aid=" + encodeURIComponent(aid),
      "plugin=" + encodeURIComponent(ALX_NS_PH_TB_Helper.getMyVersion()),
      "random=" + ALX_NS_PH_TB_Helper.getRandom(),
      extra
    ];
    var logurl = "https://log.alexa.com/" + prefix + "/?" + params.join("&");
    ALX_NS_PH_TB_Helper.sendRequest("GET", logurl);
  }
});
var ALX_NS_PH_TB_Helper = new ALX_NS_PH_TB_Helper_Class();


function pref(prefName, prefValue)
{
  if ("ALX_NS_PH_TB" == "TBPLATFORM_NS_PH_TB")
  {
    if (prefName == "extensions.alexa.pre-defined.toolbar_id")
      ALX_NS_PH_TB_Helper.setPrefIfUnchanged(prefName, prefValue);
    if (prefName == "extensions.alexa.pre-defined.base_toolbar")
      ALX_NS_PH_TB_Helper.setPrefIfUnchanged(prefName, prefValue);
    if (prefName == "extensions.alexa.pre-defined.base_platform")
      ALX_NS_PH_TB_Helper.setPrefIfUnchanged(prefName, prefValue);
  }

  if (ALX_NS_PH_TB_Helper.isFirst == null)
    ALX_NS_PH_TB_Helper.isFirst = ALX_NS_PH_TB_Helper.getPref("firstRun", true);

  if (ALX_NS_PH_TB_Helper.isFirst)
  {
    ALX_NS_PH_TB_Helper.setPrefIfUnchanged(prefName, prefValue);
    return;
  }
  if (ALX_NS_PH_TB_Helper.need_force_pref_update == true)
  {
    ALX_NS_PH_TB_Helper.setPrefIfUnchanged(prefName, prefValue);
    return;
  }

  if (ALX_NS_PH_TB_Helper.need_force_pref_update == null)
  {
    var func = function( extensionInfo )
    {
      if (ALX_NS_PH_TB_Helper.need_force_pref_update == null)
      {
        var version = extensionInfo.version;
        var local_version = ALX_NS_PH_TB_Helper.getPref("pre-defined.toolbar_version", null)
        ALX_NS_PH_TB_Helper.need_force_pref_update = (version != local_version);
      }
      if ( typeof ALX_NS_PH_TB_Helper.need_force_pref_update == "boolean" && ALX_NS_PH_TB_Helper.need_force_pref_update == true)
      {
        ALX_NS_PH_TB_Helper.setPrefIfUnchanged(prefName, prefValue);
      }
    }
    ALX_NS_PH_TB_Helper.getExtensionObj(func);
  }
}

/*function pref(prefName, prefValue)
{
  window.addEventListener( "load", function(event) { prefAfterLoad(prefName, prefValue); }, false );
}*/

window.addEventListener( "load", function(event) { ALX_NS_PH_TB_Helper.init_helper(event); }, false );
window.addEventListener( "unload", function(event) { ALX_NS_PH_TB_Helper.shutdown(event); }, false);
