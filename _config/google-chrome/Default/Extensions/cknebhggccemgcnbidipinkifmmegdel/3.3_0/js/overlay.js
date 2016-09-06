/******************
 * Liangnan Wu *
 * Alexa Internet *
 ******************/

var ALX_NS_PH_SPARKLINE = {
  baseline: "https://data.alexa.com/data",
  httpsbaseline: "https://data.alexa.com/data",
  datafeed: null,
  need_data: false,
  configured: false,
  active_buttons: "",
  giResponseTimeOut: 3000,
  giUrls: null,
  httpsDadList: [],
  regex: /^(0|10|127|172\.(1[6-9]|2[0-9]|3[0-1])|169\.254|192\.168|255)\./,
  aid: null,
  events: [],
  lastUrlRendered: null,
  lastUrlUpdated: null,
  lastTabId: null,
  formatRank: function(rank)
  {
    rank += '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(rank)) {
      rank = rank.replace(rgx, '$1' + ',' + '$2');
    }
    return "Alexa Traffic Rank: #" + rank;
  },
  rank2code: function( rank )
  {
    rank = +rank;
    return rank ==      0 ? 'h'
      : rank <=     100 ? 'x'
      : rank <=     180 ? 'g'
      : rank <=     320 ? 'f'
      : rank <=     560 ? 'e'
      : rank <=    1000 ? 'd'
      : rank <=    1800 ? 'c'
      : rank <=    3200 ? 'b'
      : rank <=    5600 ? 'a'
      : rank <=   10000 ? '9'
      : rank <=   18000 ? '8'
      : rank <=   32000 ? '7'
      : rank <=   56000 ? '6'
      : rank <=  100000 ? '5'
      : rank <=  180000 ? '4'
      : rank <=  320000 ? '3'
      : rank <=  560000 ? '2'
      : rank <= 1000000 ? '1'
      :                   '0'
      ;
  },
  resolveEndpoint: function()
  {
    var pref = "session";
    var aid = "";
    if (ALX_NS_PH_TB_Helper.getPref(pref, null) != null)
    {
      aid = ALX_NS_PH_TB_Helper.getPref(pref);
    }
    ALX_NS_PH_SPARKLINE.set_aid(aid);
  },
  set_aid: function(aid)
  {
    var version = ALX_NS_PH_TB_Helper.getMyVersion();
    var baseline = ALX_NS_PH_TB_Helper.getPref("dadUrl", null);
    var httpsbaseline = ALX_NS_PH_TB_Helper.getPref("httpsdadUrl", null);
    if (baseline) ALX_NS_PH_SPARKLINE.baseline = baseline;
    if (httpsbaseline) ALX_NS_PH_SPARKLINE.httpsbaseline = httpsbaseline;
    ALX_NS_PH_SPARKLINE.datafeed = ALX_NS_PH_SPARKLINE.baseline + "/" + aid
                                  + "?cli=10"
                                  + "&ver=" + version
                                  + "&dat=ns";
    ALX_NS_PH_SPARKLINE.httpsdatafeed = ALX_NS_PH_SPARKLINE.httpsbaseline + "/" + aid
                                  + "?cli=10"
                                  + "&ver=" + version
                                  + "&dat=ns";

    ALX_NS_PH_SPARKLINE.aid = aid;
    //if (this.first_window)
    //{
    //  this.configure(window.content.location.href);
    //}
  },
  navigate: function(uri)
  {
    chrome.tabs.create({url: uri});
  },
  navigateOnLoad: function(uri)
  {
    ALX_NS_PH_SPARKLINE.navigate(uri);
  },
  readPrefs: function()
  {
    ALX_NS_PH_SPARKLINE.need_data = ALX_NS_PH_TB_Helper.needDataRequests();
  },
  init: function(event)
  {
    ALX_NS_PH_TB_Helper.requestSession();
    ALX_NS_PH_SPARKLINE.resolveEndpoint();

    //if ( "ALX_NS_PH" == "TBPLATFORM_NS_PH" && ALX_NS_PH_TB_Helper.getToolbarId() == null &&
    //     ALX_NS_PH_TB_Helper.getPref("display-style", "statusbar") == "toolbar" )
    //  ALX_NS_PH_TB_Helper.setPref("display-style", "statusbar");
      
    if ( ALX_NS_PH_TB_Helper.getPref("toBeDelete", null) != null )
    {
      var toBeDelete = ALX_NS_PH_TB_Helper.getPref("toBeDelete");
      var toBeDeletes = toBeDelete.split(",")
      for (var i = 0; i < toBeDeletes.length; ++i)
      {
        var deleteKey = toBeDeletes[i];
        ALX_NS_PH_TB_Helper.deletePref(deleteKey);
      }
      ALX_NS_PH_TB_Helper.deletePref("toBeDelete")
    }

    if (ALX_NS_PH_TB_Helper.need_force_pref_update == true)
    {
      var aid = ALX_NS_PH_TB_Helper.getPref("session", "");
      var uri = ALX_NS_PH_TB_Helper.getPref("install.upgrade-uri", null);
      var locale = ALX_NS_PH_TB_Helper.getPref("toolbarLocale", "default").toLowerCase();

      if (locale != "default")
      {
        uri = ALX_NS_PH_TB_Helper.getPref("install.upgrade-uri." + locale, uri);
      }

      ALX_NS_PH_TB_Helper.setPref("active-buttons", "");
      ALX_NS_PH_TB_Helper.setPref("configured2", false);

      if (uri)
      {
        uri = ALX_NS_PH_TB_Helper.urlReplacement(uri)
        if (typeof ALX_NS_PH_TB_Helper.navigateOnLoad != "undefined")
          ALX_NS_PH_TB_Helper.navigateOnLoad(uri);
      }
    }

    ALX_NS_PH_TB_Helper.setPref("toolbarLocaleChange", "");

    ALX_NS_PH_SPARKLINE.readPrefs();
    if (ALX_NS_PH_TB_Helper.getPref('disabled', null) == null)
      ALX_NS_PH_TB_Helper.setPref('disabled', false);
    if (ALX_NS_PH_TB_Helper.getPref('uninstall', null) == null)
      ALX_NS_PH_TB_Helper.setPref('uninstall', false);
    if (ALX_NS_PH_TB_Helper.getPref('giurls.giResponseTimeOut', null) == null)
      ALX_NS_PH_SPARKLINE.giResponseTimeOut = ALX_NS_PH_TB_Helper.getPref('giurls.giResponseTimeOut')
    if (ALX_NS_PH_TB_Helper.getPref('giurls.giUrls', null) == null)
      ALX_NS_PH_SPARKLINE.giUrls = ALX_NS_PH_TB_Helper.getPref('giurls.giUrls')
    ALX_NS_PH_SPARKLINE.loadHttpsDadList();

    if (ALX_NS_PH_SPARKLINE.need_data)
    {
      var callback = function(t)
      {
        if (ALX_NS_PH_SPARKLINE.okUrl(t.url))
          ALX_NS_PH_SPARKLINE.preUpdate(t.id);
      }
      chrome.tabs.getSelected(null, callback);
    }

    chrome.webNavigation.onCompleted.addListener(ALX_NS_PH_SPARKLINE.updateOnDOMLoad);
    chrome.tabs.onUpdated.addListener(ALX_NS_PH_SPARKLINE.updateOnUpdate);
    chrome.tabs.onSelectionChanged.addListener(ALX_NS_PH_SPARKLINE.updateOnSelectChange);
    chrome.windows.onFocusChanged.addListener(ALX_NS_PH_SPARKLINE.updateOnWindowChange);
    chrome.webRequest.onCompleted.addListener(ALX_NS_PH_SPARKLINE.naviComp, {urls: ["http://*/*", "https://*/*"], "types": ["main_frame"]});
    chrome.webRequest.onBeforeSendHeaders.addListener(ALX_NS_PH_SPARKLINE.setHttpHeaders, {urls: ["http://*/*", "https://*/*"]}, ["requestHeaders", "blocking"]);

  },
  defaultIcon: function()
  {
    if (ALX_NS_PH_TB.toolbarConfiguration.chromeIcon19)
    {
      ALX_NS_PH_TB.fetchImage({src: ALX_NS_PH_TB.toolbarConfiguration.chromeIcon19}, function(returnData) {
        if (returnData.returnData && returnData.returnData.imageData)
          chrome.browserAction.setIcon({imageData: returnData.returnData.imageData});
        else
          chrome.browserAction.setIcon({path:"/images/icon-19x19.png"});
      }, true, {width: 19, height: 19} );
    }
    else
      chrome.browserAction.setIcon({path:"/images/icon-19x19.png"});
  },
  defaultTitle: function()
  {
    chrome.browserAction.setTitle({title:"No Rank Data"});
    ALX_NS_PH_SPARKLINE.setTitleAsToolbarName(true);
  },
  okUrl: function(url)
  {
    if (url.indexOf("http://") == 0 || url.indexOf("https://") == 0)
      return true;

    return false;
  },
  okSpecialUrl: function(url)
  {
    if (url.indexOf("chrome://settings/extensionSettings") == 0)
      return true;
    return false;
  },
  saveCurrentUrl: function(tab)
  {
    if (tab.selected)
    {
      ALX_NS_PH_TB_Helper.setSessionPref("currentUrl", tab.url);
      ALX_NS_PH_TB_Helper.setSessionPref("currentTabId", tab.id);
      ALX_NS_PH_SPARKLINE.lastUrlUpdated = tab.url;
      ALX_NS_PH_SPARKLINE.lastTabId = tab.id;
      if ( !ALX_NS_PH_SPARKLINE.okUrl(tab.url) )
      {
        ALX_NS_PH_SPARKLINE.lastUrlRendered = null;
        ALX_NS_PH_SPARKLINE.defaultIcon();
        ALX_NS_PH_SPARKLINE.defaultTitle();
      }
    }
  },
  getTab: function(tabId, callback)
  {
    trace("getTab")
    if (tabId)
      chrome.tabs.get(tabId, callback)
  },
  updateOnDOMLoad: function(loadobj)
  {
    if (loadobj.frameId == 0)
    {
      trace("updateOnDOMLoad")
      ALX_NS_PH_SPARKLINE.preUpdate(loadobj.tabId);
    }
  },
  updateOnUpdate: function(tabId, changeInfo, tab)
  {
    trace("updateOnUpdate")
    trace("updateOnUpdate:" + tab.url)
    if (ALX_NS_PH_SPARKLINE.lastTabId == tab.id && ALX_NS_PH_SPARKLINE.lastUrlUpdated == tab.url)
      return;
    ALX_NS_PH_SPARKLINE.saveCurrentUrl(tab);

    if (tab.selected && changeInfo.status == "loading" && ALX_NS_PH_SPARKLINE.okUrl(tab.url))
      ALX_NS_PH_SPARKLINE.preUpdate(tabId);
  },
  naviComp: function(details)
  {
    if (details && details.frameId == 0 && details.tabId != -1)
    {
      var data = ALX_NS_PH_SPARKLINE.getPageInfo(details.tabId);
      if (data == null)
        data = {};
      if (!data.reqmeta)
        data["reqmeta"] = {};
      data["reqmeta"]["method"] = details.method;
      data["reqmeta"]["statusCode"] = details.statusCode;
      ALX_NS_PH_SPARKLINE.setPageInfo(details.tabId, JSON.stringify(data));
    }
  },
  setHttpHeaders: function(details)
  {
    if (details && details.requestHeaders)
    {
      var version = ALX_NS_PH_TB_Helper.getMyVersion();
      var useragent_version   = "AlexaToolbar/" + version;

      for(var key in details.requestHeaders)
      {
        var obj = details.requestHeaders[key]
        /*if (obj["name"]== "User-Agent")
        {
          var useragent = obj["value"];
          var version = ALX_NS_PH_TB_Helper.getMyVersion();
          var useragent_version   = "AlexaToolbar/" + version;
          if (useragent.indexOf(version) == -1)
          {
            useragent = useragent.replace(/\s\s*$/, '');
            useragent = useragent + " " + useragent_version
            details.requestHeaders[key]["value"] = useragent;
          }
        }*/
        if (obj["name"]== "AlexaReferer")
        {
          obj["name"] = "Referer";
        }
      }
      details.requestHeaders.push({"name": "AlexaToolbar-ALX_NS_PH", "value": useragent_version});
    }
    return { "requestHeaders": details.requestHeaders };
  },
  updateOnWindowChange: function(winId)
  {
    if (winId)
    {
      chrome.tabs.query({windowId: winId, windowType: "normal"}, function(tabs)
      {
        for(var i = 0; i < tabs.length; ++i)
        {
          var t = tabs[i];
          if (t.selected && ALX_NS_PH_SPARKLINE.okUrl(t.url))
            ALX_NS_PH_SPARKLINE.updateOnSelectChange(t.id);
        } 
      });
    }
  },
  updateOnSelectChange: function(tabId, selectInfo)
  {
    trace("updateOnSelectChange")
    var callback = function(t) {
      if (ALX_NS_PH_SPARKLINE.lastTabId == t.id && ALX_NS_PH_SPARKLINE.lastUrlUpdated == t.url)
        return;
      trace("updateOnSelectChange callback")
      ALX_NS_PH_SPARKLINE.saveCurrentUrl(t);
      trace("updateOnSelectChange t")
      if (ALX_NS_PH_SPARKLINE.okUrl(t.url))
      {
        trace("updateOnSelectChange t2")
        ALX_NS_PH_SPARKLINE.preUpdate(tabId);
      }
    };
    ALX_NS_PH_SPARKLINE.getTab(tabId, callback);
  },
  preUpdate: function(tabId)
  {
    trace("preUpdate")
    chrome.tabs.executeScript(tabId, {file: "js/content/dc.js"});
  },
  getPageInfo: function(tabId)
  {
    var name = "page_data_" + tabId;
    var data = ALX_NS_PH_TB_Helper.getSessionPref( name, null );
    if (data == null)
      return null;

    var data = JSON.parse(data);
    return data;
  },
  setPageInfo: function(tabId, data)
  {
    if (tabId && data != null)
    {
      var name = "page_data_" + tabId;
      ALX_NS_PH_TB_Helper.setSessionPref( name, data );
    }
  },
  push_event: function(name)
  {
    if (ALX_NS_PH_SPARKLINE.events.indexOf(name) == -1)
      ALX_NS_PH_SPARKLINE.events.push(name);
  },
  get_events: function()
  {
    return ALX_NS_PH_SPARKLINE.events.join(";")
  },
  clear_events: function () {
    ALX_NS_PH_SPARKLINE.events.length = 0;
  },
  pullXml: ALX_NS_PH_TB_Helper.pullXml,
  anonymizeUrl: function(payload)
  {
    var pathname_ff   = "";//payload.url.pathname + payload.url.hash;
    var pathname_cp   = payload.url.pathname + payload.url.hash; //""new Array(pathname_ff.length + 1).join("\0");
    for(var i in pathname_ff)
    {
      var c = pathname_ff[i];
      var charposition = parseInt(c);
      if (isNaN(charposition))
        charposition = 0;
      var chartoappend = String.fromCharCode(charposition);
      pathname_cp = pathname_cp + chartoappend;
    }
    var md5_pathname  = Crypto.MD5(pathname_cp, { asString: true });
    var base64_md5_pathname = Base64.encode(md5_pathname,  true);
    var retUrl = "https://" + payload.url.hostname+"/"+ base64_md5_pathname + "#anonymous";

    return retUrl;
  },
  loadHttpsDadList: function()
  {
    ALX_NS_PH_SPARKLINE.httpsDadList = ALX_NS_PH_TB_Helper.getPref("httpsDadList", []);
  },
  matchHttpsDadListUrl: function(payload)
  {
    if (ALX_NS_PH_SPARKLINE.httpsDadList.length > 0)
    {
      var urlstr = payload.url.href;
      for(var i =0; i < ALX_NS_PH_SPARKLINE.httpsDadList.length; i++)
      {
        var httpsdad = ALX_NS_PH_SPARKLINE.httpsDadList[i];
        var reg = new RegExp(httpsdad, "i");
        var result = urlstr.match(reg);
        if (result != null)
          return true;
      }
    }
    return false;
  },
  loadXml: function(payload, cnt, renderfunc, data)
  {
    var cdt = [ "rq%3D" + cnt, "wid%3D" + payload.tabId, "t%3D" + encodeURIComponent(payload.referer ? "1" : "0"), "ss%3D" + encodeURIComponent(screen.width + "x" + screen.height), "bw%3D" + encodeURIComponent(payload.winWidth), "winid%3D" + encodeURIComponent(payload.winId) ];

    if (payload.loadTime)
      cdt.push(encodeURIComponent("cttl=" + encodeURIComponent(payload.loadTime))); 

    if (data && data["reqmeta"] && data["reqmeta"]["method"])
      cdt.push(encodeURIComponent("m=" + encodeURIComponent(data["reqmeta"]["method"]))); 
    if (data && data["reqmeta"] && data["reqmeta"]["statusCode"])
      cdt.push(encodeURIComponent("s=" + encodeURIComponent(data["reqmeta"]["statusCode"]))); 

    var inurl = payload.url.href;
    var dfeed = ALX_NS_PH_SPARKLINE.datafeed;
    if (payload.url && payload.url.protocol == "https:")
    {
      if (!this.matchHttpsDadListUrl(payload))
        inurl = ALX_NS_PH_SPARKLINE.anonymizeUrl( payload );
      else
        dfeed = ALX_NS_PH_SPARKLINE.httpsdatafeed;
    }

    var src = ( payload.url.href && ALX_NS_PH_SPARKLINE.need_data )
            ? dfeed + "&cdt=" + cdt.join("%26")
                            + "&ref=" + ( payload.referer ? encodeURIComponent( payload.referer ) : "" )
                            + "&url=" + ( inurl ? encodeURIComponent( inurl ) : "" )
            : chrome.extension.getURL("/xml/default.xml");
            ;
    if (ALX_NS_PH_SPARKLINE.get_events())
    {
      if (ALX_NS_PH_SPARKLINE.getPref("usage-stats", false))
      {
        ALX_NS_PH_TB_Helper.log("events", "act=" + ALX_NS_PH_SPARKLINE.get_events());
      }
      ALX_NS_PH_SPARKLINE.clear_events();
    }

    var callback = function()
    {
      if (this.readyState == 4)
      {
        var data =
        {
          url:   payload.url.href,
          cnt:   payload.url.href? cnt + 1 : cnt,
          rank:  null,
          site:  null,
          title: null,
          delta: 0,
          averageReview: "unrated",
          related: [ ],
          blocked: false,
          contact: {}
        };
        if ( "OK" == this.statusText )
        {
          data.rank  = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/POPULARITY/@TEXT", data.rank );

          try
          {
            var links = this.responseXML.evaluate("//RLS/RL",this.responseXML,null,XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,null);
            if ( links )
            for ( var i = 0 ; i < links.snapshotLength ; ++i )
            {
              var link = links.snapshotItem(i);
              data.related[data.related.length] =
              {
                name: String(link.getAttribute("TITLE")),
                link: String(link.getAttribute("HREF"))
              };
            }

            if (data.related.length == 1 && data.related[0].link && data.related[0].link.match(/^www\.alexa\.com\/blocker/) && !data.site)
            {
              data.blocked = true;
            }
          } catch(ex) { }

          data.title = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/TITLE/@TEXT", data.title );
          data.site  = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/AMZN/@URL", data.site );
          data.site  = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/@HOST", data.site );
          data.site  = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/POPULARITY/@URL", data.site );
          data.delta = parseInt(ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/RANK/@DELTA", "0" ), 10);
          data.contact.street   = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/ADDR/@STREET", data.contact.street );
          data.contact.city     = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/ADDR/@CITY", data.contact.city );
          data.contact.state    = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/ADDR/@STATE", data.contact.state );
          data.contact.zip      = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/ADDR/@ZIP", data.contact.zip );
          data.contact.country  = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/ADDR/@COUNTRY", data.contact.country );
          data.contact.owner    = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/OWNER/@NAME", data.contact.owner );
          data.contact.email    = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/EMAIL/@ADDR", data.contact.email );

          if ( data.site && data.site.indexOf('/') > -1 )
            data.site = data.site.substr(0,data.site.indexOf('/'));
          data.averageReview  = ALX_NS_PH_TB_Helper.pullXml( this.responseXML, "//SD/REVIEWS/@AVG", "unrated" );

        }
        renderfunc(payload, data);
      }
    };
    ALX_NS_PH_TB_Helper.sendRequest("GET", src, callback);
  },
  setTitleAsToolbarName: function(isforce)
  {
    if (ALX_NS_PH_TB_Helper.getPref("disable_default_text", false))
    {
      var toolbar_name = ALX_NS_PH_TB_Helper.getPref("pre-defined.toolbar_name", null);
      if (toolbar_name == null && ALX_NS_PH_TB_Helper.extensionObj)
        toolbar_name = ALX_NS_PH_TB_Helper.extensionObj.name;
      if (toolbar_name)
        chrome.browserAction.setTitle({title:toolbar_name});  
      else if (isforce)
        chrome.management.get(String(location.host), function(obj) {
          chrome.browserAction.setTitle({title:toolbar_name});
        });
    }
  },
  setBrowserActionPage: function(data)
  {
    if (ALX_NS_PH_TB_Helper.getPref("display-style", "toolbar") == "statusbar")
    {
      if (data.disabled)
      {
        ALX_NS_PH_SPARKLINE.defaultIcon();
        ALX_NS_PH_SPARKLINE.defaultTitle();
        return;
      }
      var rank = data.rank ? parseInt(data.rank) : "No Rank Data";
      var code = ALX_NS_PH_SPARKLINE.rank2code(rank);
      var img = "/images/" + code + ".png"
      var r = ALX_NS_PH_SPARKLINE.formatRank(rank);
      if (!ALX_NS_PH_TB_Helper.getPref("disable_default_icon", false))
        chrome.browserAction.setIcon({path:img});
      chrome.browserAction.setTitle({title:r});
      ALX_NS_PH_SPARKLINE.setTitleAsToolbarName();
    }
  },
  isAlexaHost: function(host)
  { return host && String(host).match(/^(?:.*\.)?alexa\.com$/i); },
  format: function(n)
  {
    if ( ! n ) return "0";
    var x = n.length % 3 ;
    var a = !x ? [] : [ n.substr(0,x) ];
    for ( var i = x ; i < n.length ; i += 3 )
      a[a.length] = n.substr(i,3);

    return a.join(',');
  },
  renderXml: function(payload, data)
  {
    if (payload.url.href !== ALX_NS_PH_SPARKLINE.lastUrlRendered)
    {
      var showRanks = ALX_NS_PH_TB_Helper.getPref("ranks", false);
      var frank     = data.rank ? ALX_NS_PH_SPARKLINE.format(data.rank) : null; /*fep*/
      data.showRanks = showRanks;
      var rankText =  !showRanks ? "Disabled"
        : data.blocked ? "click for help"
        :  data.url.match(/^http:\/\/(www\.)?alexa\.com\/toolbar\/(success|final)/)
                     ? "Success"
        :  ALX_NS_PH_SPARKLINE.isAlexaHost( data.site )
                     ? "Not Ranked"
        : !data.rank ? "No Rank"
        : /* else */   "#"+frank
        ;
      data.rankText = rankText;

      if (ALX_NS_PH_TB_Helper.getPref("reviews", false))
        data.averageReview = data.averageReview ? data.averageReview : "unrated";
      else
        data.averageReview = "disabled";

      data.disabled = !ALX_NS_PH_SPARKLINE.need_data;
      ALX_NS_PH_SPARKLINE.setBrowserActionPage(data);
      ALX_NS_PH_SPARKLINE.setPageInfo( payload.tabId, JSON.stringify(data) );
      ALX_NS_PH_SPARKLINE.lastUrlRendered = payload.url.href;
    }
    //trace(data)
    ALX_NS_PH_TB.updatePageTurnListeners(payload.tabId, data);
  },
  updateXml: function(payload, renderfunc)
  {
    var tabId = payload.tabId;
    var data = ALX_NS_PH_SPARKLINE.getPageInfo(tabId);
    if (data == null || payload.url.href != data.url)
    {
      ALX_NS_PH_SPARKLINE.loadXml(payload, data != null && data.cnt ? data.cnt : 0, renderfunc, data)
    } else {
      if (data == null)
        data = {};
      var showRanks = ALX_NS_PH_TB_Helper.getPref("ranks", false);
      data.showRanks = showRanks;
      ALX_NS_PH_SPARKLINE.setPageInfo(tabId, JSON.stringify(data))
      renderfunc(payload, data)
    }
  },
  update: function(payload)
  {
    if (ALX_NS_PH_TB_Helper.getPref("searchranks", false))
    {
      ALX_NS_PH.Results.onload(payload)
      //ALX_NS_PH.ReBrandedLinks.onload(payload)
    }

    ALX_NS_PH_SPARKLINE.updateXml(payload, ALX_NS_PH_SPARKLINE.renderXml);
  },
  shutdown: function(event)
  {
  }
}

window.addEventListener( "load", function(event) { ALX_NS_PH_SPARKLINE.init(event); }, false );
window.addEventListener( "unload", function(event) { ALX_NS_PH_SPARKLINE.shutdown(event); }, false);

/* end
 *****/
