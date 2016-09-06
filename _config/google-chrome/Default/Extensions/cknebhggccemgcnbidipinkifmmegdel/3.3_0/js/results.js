(function ( )  {
  if( typeof ALX_NS_PH == 'undefined' ) {
    window.ALX_NS_PH = { };
  }
  function resolver( name ) {
    return ({
      alexa: "http://rdf.alexa.com/terms/",
      rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
      xlink : "http://www.w3.org/1999/xlink",
    })[ name ];
  }
  if( typeof ALX_NS_PH.Results == 'undefined' ) {
    ALX_NS_PH.Results = {
      onload: function ( payload ) {
        var collectAnonymousData = ALX_NS_PH_TB_Helper.getPref( 'searchranks', false );
        collectAnonymousData = ALX_NS_PH_TB_Helper.getPref( 'global_settings.collectAnonymousData', collectAnonymousData );
        if( !collectAnonymousData || !ALX_NS_PH_TB_Helper.getPref( 'searchranks', false ) )
          return true;
        ALX_NS_PH.Targets.findTarget( payload );  
      },
    };
  }
  if( typeof ALX_NS_PH.Layouts == 'undefined' ) {
    ALX_NS_PH.Layouts = {
      hideRankometer: null,
      hideCBA: null,
      init: function()
      {
        ALX_NS_PH.Layouts.hideRankometer = ALX_NS_PH_TB_Helper.getPref('hidesearchranks', false); 
        ALX_NS_PH.Layouts.hideCBA        = ALX_NS_PH_TB_Helper.getPref('hideCBA', false); 
        
        if (ALX_NS_PH_TB_Helper.getPref("searchconf", null))
        {
          if (ALX_NS_PH_TB_Helper.getPref("display-style", "toolbar") == "statusbar" && !ALX_NS_PH_TB_Helper.isTermsAccepted())
            return;
          var search_conf_string  = ALX_NS_PH_TB_Helper.getPref("searchconf");
          var search_conf_obj     = JSON.parse(search_conf_string);
          ALX_NS_PH.Layouts.GenericLayout = {};
          ALX_NS_PH.Layouts.GenericCBALayout = {};
          for (var i in search_conf_obj)
          {
            var search_obj = search_conf_obj[i];
            if (search_obj.rankometer)
              ALX_NS_PH.Layouts.GenericLayout[i] = search_obj.rankometer;
            if (search_obj.cba)
              ALX_NS_PH.Layouts.GenericCBALayout[i] = search_obj.cba;
          }
        }
      },
      shutdown: function()
      {
        ALX_NS_PH.Layouts.GenericLayout = null;
        ALX_NS_PH.Layouts.GenericCBALayout = null;
      },
      GenericLayout: null,
      GenericCBALayout: null,
      genericHit: function( url, urlreg )
      {
        var uri = new String( url );
        var reg = new RegExp(urlreg, "i");
        var result = uri.match(reg);
        return result != null;
      },
      sendSpec: function( payload )
      {
        chrome.tabs.executeScript( payload.tabId, {file: "js/content/results.js"});
      },
      requestSpec: function(spec_payload)
      {
        var target = null;
        var CBAUrl = ALX_NS_PH_TB_Helper.getPref('uri.CBA', null)
        var return_obj = {hideRankometer: ALX_NS_PH.Layouts.hideRankometer, hideCBA: ALX_NS_PH.Layouts.hideCBA, CBAUrl: CBAUrl};
        return_obj["alexa"] = { "aid": ALX_NS_PH_TB_Helper.getPref("session", ""), "ver": ALX_NS_PH_TB_Helper.getMyVersion()};
        if (ALX_NS_PH.Layouts.GenericLayout)
        {
          for( var i in ALX_NS_PH.Layouts.GenericLayout ) 
          {
            target = ALX_NS_PH.Layouts.GenericLayout[i];
            if (target.url && target.xpath && ALX_NS_PH.Layouts.genericHit( spec_payload.url.href, target.url ) )
            {
              return_obj["rankometer"] = target;
              if (typeof target.hide == "boolean") return_obj["hideRankometer"] = target.hide;
              return_obj["rankometer_name"] = i;
              break;
            }
          }
        }
        if (ALX_NS_PH.Layouts.GenericCBALayout)
        {
          for( var i in ALX_NS_PH.Layouts.GenericCBALayout ) 
          {
            target = ALX_NS_PH.Layouts.GenericCBALayout[i];
            if (target.url && target.xpath && ALX_NS_PH.Layouts.genericHit( spec_payload.url.href, target.url ) )
            {
              return_obj["cba"] = target;
              if (typeof target.hide == "boolean") return_obj["hideCBA"] = target.hide;
              return_obj["cba_name"] = i;
              break;
            }
          }
        }
        if (return_obj.rankometer || return_obj.cba)
          return return_obj;  
      },
      requestRanks: function(rank_payload, sendRequest)
      {
        var referer = rank_payload.referer;
        var urls    = rank_payload.results; 
        var ct = new Date(); ct = String(ct.getTime());
        var ver = ALX_NS_PH_TB_Helper.getMyVersion()
        var aid = ALX_NS_PH_TB_Helper.getPref("session", "");
        var referp = [
            "lb="    + encodeURIComponent(rank_payload.location.href),
            "ct="    + encodeURIComponent(ct),
            "ts="    + encodeURIComponent(ct),
            "ver="   + encodeURIComponent(ver),
            "aid="   + encodeURIComponent(aid)
          ];

        var referer = rank_payload.location.protocol + "//" + rank_payload.location.hostname + "/search?" + referp.join("&");
        var src     = 'https://widgets.alexa.com/traffic/rankr/?ref=' + encodeURIComponent( referer );
        var onload_get_rank = function( )
        {
          if (this.readyState == 4)
          {
            if (this.status == 200)
            {
              var cursor = null;
              var xml    = this.responseXML;
              var info   = null;
              var rank   = null;
              var site   = null;
              var ranks  = [];
              var sites  = [];
              for(var i in urls)
              {
                var url = urls[i];
                cursor  = xml.evaluate( "//alexa:site[ @rdf:about ="
                      + "//alexa:page[ @rdf:about = '"
                      + url + "' ]"
                      + "/alexa:site/@rdf:resource ]",
                        xml, resolver, XPathResult.ANY_TYPE, null );
                info  = cursor.iterateNext( );
                try {
                  rank  = info.attributes.getNamedItemNS( resolver( 'alexa' ), 'rank' ).textContent;
                  site  = info.attributes.getNamedItemNS( resolver( 'rdf' ), 'about' ).textContent;
                } catch( e ) {
                  rank = 0;
                  site = url;
                }
                ranks.push(rank);
                sites.push(site); 
              }
              sendRequest({ranks: ranks, sites: sites}); 
            }
          } 
        }
        var headers = {
          "accept"      : "application/xml",
          "Content-Type": "text/plain; charset=UTF-8"
        }
        ALX_NS_PH_TB_Helper.sendRequest("POST", src, onload_get_rank, urls.join( "\n" ), headers);
      }
    };
  }
  if( typeof ALX_NS_PH.Targets == 'undefined' ) {
    ALX_NS_PH.Targets = function ( ) {
      return this;
    };
    ALX_NS_PH.Targets.prototype = {
      findTarget: function ( payload ) 
      {
        var target = null;
        if (ALX_NS_PH.Layouts.GenericLayout)
        {
          for( var i in ALX_NS_PH.Layouts.GenericLayout ) {
            target = ALX_NS_PH.Layouts.GenericLayout[i];
            if (target.url && target.xpath && ALX_NS_PH.Layouts.genericHit( payload.url.href, target.url ) )
            {
              ALX_NS_PH.Layouts.sendSpec( payload );
              break;
            }
          }
        }
      }
    };
    ALX_NS_PH.Targets = new ALX_NS_PH.Targets( );
  }
})( );

window.addEventListener("load", function () { ALX_NS_PH.Layouts.init(); }, false);
window.addEventListener("unload", function () { ALX_NS_PH.Layouts.shutdown(); }, false);


