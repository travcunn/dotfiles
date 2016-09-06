/******************
 * Liangnan Wu *
 * Alexa Internet *
 ******************/

var ALX_NS_PH_TB_Helper = new ALX_NS_PH_TB_Basic();
(function () {
  if (typeof ALX_NS_PH_TB_Private == "undefined")
  {
    window.ALX_NS_PH_TB_Private = {
      init: function()
      {
        if (ALX_NS_PH_TB_Helper.getPref("display-style", "toolbar") == "statusbar" && !ALX_NS_PH_TB_Helper.isTermsAccepted()) 
        {
          chrome.tabs.create({url:"html/welcome.html"}); 
          window.close();
        }
  
        var urltuple = ALX_NS_PH_TB_Helper.decompositeUrl(window.location.href, "#");
        var params = {}
        if (urltuple && urltuple.length && urltuple.length > 1)
          params = urltuple[1];

        if (params["caption"])
          document.title = params["caption"];

        if (params["url"])
        {
          var url = ALX_NS_PH_TB_Helper.urlReplacement(params["url"]);
          var iframe = document.createElement("iframe");
          var pba = document.createElement("img");
          var div    = document.createElement("div");
          var head  = document.createElement("div");
          var body    = document.createElement("div");
          var foot  = document.createElement("div");
          iframe.setAttribute("src", url);
          iframe.setAttribute("scrolling", "no");
          iframe.setAttribute("frameborder", "no");
          iframe.id   = "ALX_NS_PH_TB_Private-iframe";
          head.id     = "ALX_NS_PH_TB_Private-head";
          body.id     = "ALX_NS_PH_TB_Private-body";
          foot.id     = "ALX_NS_PH_TB_Private-foot";
          div.id      = "ALX_NS_PH_TB_Private-iframe-container";
          if (params["width"])
          {
            iframe.style.width = params["width"] + "px";
            body.style.width = params["width"] + "px";
            foot.style.width = params["width"] + "px";
          }
          if (params["height"])
          {
            if ("ALX_NS_PH" == "TBPLATFORM_NS_PH" && params["type"] == "options")
              params["height"] = parseInt(params["height"]) + 70;
            iframe.style.height = params["height"] + "px";
          }

          if (params["type"])
          {
            var title = params["type"][0].toUpperCase() + params["type"].substr(1) + " - " + ALX_NS_PH_TB_Helper.getPref("pre-defined.toolbar_name", "Alexa Toolbar");
            head.innerText = title;
            div.appendChild(head)
          }
          body.appendChild(iframe);
          div.appendChild(body);
          foot.innerHTML = "Powered by&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
          "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
          div.appendChild(foot)
          document.body.appendChild(div);

        } else {
          var _alx_data = {
            type: "options"
          };
          var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData( "BACK_GET_PRIVATE_WINDOW_INFO", _alx_data);
          chrome.extension.sendRequest( _alx_data_payload, function() {} );
        }
      },
      shutdown: function()
      {
        while(document.body.firstChild)
          document.body.removeChild(document.body.firstChild);
      },
      restart: function()
      {
        ALX_NS_PH_TB_Private.shutdown();
        ALX_NS_PH_TB_Private.init();
      }
    }
  }
})();

window.addEventListener("hashchange", function () { ALX_NS_PH_TB_Private.restart(); }, false);
window.addEventListener("load", function () { ALX_NS_PH_TB_Private.init(); }, false);
window.addEventListener("unload", function () { ALX_NS_PH_TB_Private.shutdown(); }, false);
