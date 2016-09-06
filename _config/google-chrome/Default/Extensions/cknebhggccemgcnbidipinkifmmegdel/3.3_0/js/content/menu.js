/******************
 * Liangnan Wu *
 * Alexa Internet *
 ******************/
var ALX_NS_PH_TB_Helper = new ALX_NS_PH_TB_Basic();
(function () {
  if (typeof ALX_NS_PH_TB_Menu == "undefined") {
    window.ALX_NS_PH_TB_Menu = {
      bid: null,
      menuid: null,
      menupopupid: null,
      align: null,
      getMenuPopupId: function(bid, menuid)
      {
        if (bid && menuid)
          return "menupopup." + bid + "." + menuid;
        else
          return null;
      },
      preload: function()
      {
        var urltuple = ALX_NS_PH_TB_Helper.decompositeUrl(window.location.href, "#");
        var params = {}
        if (urltuple && urltuple.length && urltuple.length > 1)
          params = urltuple[1];

        ALX_NS_PH_TB_Menu.bid = params.bid;
        ALX_NS_PH_TB_Menu.menuid = params.menuid;
        ALX_NS_PH_TB_Menu.align = params.align;
        ALX_NS_PH_TB_Menu.menupopupid = ALX_NS_PH_TB_Menu.getMenuPopupId( ALX_NS_PH_TB_Menu.bid, ALX_NS_PH_TB_Menu.menuid);
      },
      renderMenu: function(itemList)
      {
        if (itemList.length > 0)
        {
          var trackingNode = null;
          var table = document.createElement("table");
          var div = document.createElement("tbody");
          if (ALX_NS_PH_TB_Menu.align == "right")
            table.setAttribute("class", "unsorted_list unsorted_list_right");
          else
            table.setAttribute("class", "unsorted_list");
          table.appendChild(div);
          document.body.appendChild(table);
          var provider_count = 0;

          var has_image = false;
          for(var i = 0; i < itemList.length; i++)
          {
            var item = itemList[i];
            if (item.image)
            {
              has_image = true;
              break;
            }
          }
          for(var i = 0; i < itemList.length; i++)
          {
            var item = itemList[i];
            var li = document.createElement("tr");

            switch(item.type)
            {
              case "options":
              case "locale":
              case "organize":
              case "about":
              case "rss_refresh":
              case "provider":
              case "url":
              case "callback":
                li.setAttribute("class", "normal_list");
                var spanImage = document.createElement("td");
                if (item.defaultprovider == true)
                  spanImage.setAttribute("class", "image_cell image_cell_check");
                else if (has_image)
                  spanImage.setAttribute("class", "image_cell");
                else
                  spanImage.setAttribute("class", "image_cell_none");
                var image = document.createElement("img");
                image.setAttribute("class", "normal_image");
                if (item.image)
                {
                  ALX_NS_PH_TB_Helper.fetch_image(image, item.image);
                }
                else
                  image.style.display = "none";

                spanImage.appendChild(image);
                li.appendChild(spanImage);

                var spanText = document.createElement("td");
                spanText.setAttribute("class", "text_cell");

                var spanTextInner = document.createElement("span");
                spanTextInner.setAttribute("class", "text_cell_inner");
                spanTextInner.innerText = item.displayName.replace(/\r\n/gi , " ").replace(/\n/gi , " ");

                li.setAttribute("title", item.displayName);
                spanText.appendChild(spanTextInner);

                if (item.url)
                  li.setAttribute("url", item.url);
                else if ( item.type == "url" )
                  li.className += " grey_text"
                if (!item.openIn)
                  item.openIn = "currentTab"

                if (item.callbackId)
                  li.setAttribute("callbackId", item.callbackId);
                if (item.buttonId)
                  li.setAttribute("buttonId", item.buttonId);

                li.setAttribute("openIn", item.openIn);
                li.appendChild(spanText);
                if (!trackingNode)
                  trackingNode = spanText;
                break;
              case "menuBreak":
                li.setAttribute("class", "break_list");
                var colspan = document.createElement("td");
                colspan.setAttribute("colspan", "2");
                var line = document.createElement("div");
                line.setAttribute("class", "break_line");
                colspan.appendChild(line);
                li.appendChild(colspan);
                break;
              default:
                break;
            }

            switch(item.type)
            {
              case "options":
              case "backgroundOptions":
              case "locale":
                if (!item.width)
                  item.width = 396;
                if (!item.height)
                  item.height = 230;
              case "organize":
                if (!item.width)
                  item.width = 275;
                if (!item.height)
                  item.height = 280;
              case "about":
                if (!item.width)
                  item.width = 330;
                if (!item.height)
                  item.height = 176;

                var specs = "windowName=_" + item.type + ",alwaysontop,centerscreen,titlebar=no,location=no,menubar=no,toolbar=no,resizable=no,status=no,height=" + item.height + ",width=" + item.width;
                li.setAttribute("specs", specs);
                li.setAttribute("type", item.type);
                li.addEventListener("click", function(e) {
                  var type   = this.getAttribute("type");
                  var url    = this.getAttribute("url");
                  url = url ? url : null;
                  var in_specs = this.getAttribute("specs");
                  var _alx_data = {
                    type:     type,
                    specs:    in_specs
                  };

                  var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_INTERNAL_LOAD_URL", _alx_data);
                  chrome.extension.sendRequest( _alx_data_payload, function() {});
                }, false)
                break;
              case "rss_refresh":
                li.addEventListener("click", function(e) {
                  var _alx_data = {
                    menupopupid: ALX_NS_PH_TB_Menu.menupopupid,
                    bid:  ALX_NS_PH_TB_Menu.bid
                  };

                  var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_UPDATE_RSS", _alx_data);
                  chrome.extension.sendRequest( _alx_data_payload, function() {});
                }, false)
                break;
              case "provider":
                li.addEventListener("click", function(e) {
                  var defaultprovider = this.getAttribute("defaultprovider");
                  var _alx_data = {
                    defaultprovider:  defaultprovider,
                    menupopupid: ALX_NS_PH_TB_Menu.menupopupid,
                    bid:  ALX_NS_PH_TB_Menu.bid
                  };

                  var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_CHANGE_PROVIDER", _alx_data);
                  chrome.extension.sendRequest( _alx_data_payload, function() {
                    ALX_NS_PH_TB_Menu.shutdown()
                    ALX_NS_PH_TB_Menu.init()
                  });
                }, false)
                break;
              case "url":
                li.addEventListener("click", function(e) {
                  var url = this.getAttribute("url");
                  if (url)
                  {
                    var openIn = this.getAttribute("openIn");
                    var _alx_data = {
                      url:      url,
                      openIn:   openIn
                    };

                    var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_INTERNAL_LOAD_URL", _alx_data);
                    chrome.extension.sendRequest( _alx_data_payload, function() {});
                  }
                }, false)
                break;
              case "callback":
                li.addEventListener("click", function(e) {
                  var callbackId  = this.getAttribute("callbackId");
                  var buttonId    = this.getAttribute("buttonId");
                  if (callbackId && buttonId)
                  {
                    var _alx_data = {
                      buttonId: buttonId,
                      callbackId:   callbackId
                    };

                    var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_MENU_CALLBACK", _alx_data);
                    chrome.extension.sendRequest( _alx_data_payload, function() {});
                  }
                }, false)
                break;
              default:
                break;
            }
            li.setAttribute("defaultprovider", provider_count);
            provider_count++;
            div.appendChild(li);
          }

          var width = window.innerWidth;
          var width_diff = 0;
          var text = "";
          var width_tobe = 75;
          if (trackingNode)
          {
            var width1 = trackingNode.clientWidth;
            var mwidth = 0;

            var spans = table.getElementsByTagName("span");
            for(var i in spans)
            {
              var span = spans.item(i);
              if (span.offsetWidth > mwidth)
              {
                mwidth = span.offsetWidth;
              }
            }
            width_tobe = mwidth + 35 + (has_image ?  40 : 10);
          }

          if (width_tobe > 300)
            width_tobe = 300;
          var _alx_data = {width: width_tobe, height: table.offsetHeight, menupopupid: ALX_NS_PH_TB_Menu.menupopupid};
          var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData( "BACK_RESIZE_DROPDOWN", _alx_data);
          chrome.extension.sendRequest( _alx_data_payload );
        }
      },
      clickListener: function(e)
      {
        var _alx_data = {};
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData( "BACK_CLOSE_DROPDOWNS", _alx_data);
        chrome.extension.sendRequest( _alx_data_payload );
      },
      restart: function()
      {
        ALX_NS_PH_TB_Menu.shutdown();
        ALX_NS_PH_TB_Menu.init();
      },
      init: function()
      {
        ALX_NS_PH_TB_Menu.preload();
        if ( ALX_NS_PH_TB_Menu.menupopupid != null )
        {
          var _alx_data = {
            menupopupid: ALX_NS_PH_TB_Menu.menupopupid
          };
          var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData( "BACK_GET_MENU_ITEMS", _alx_data);
          chrome.extension.sendRequest( _alx_data_payload, ALX_NS_PH_TB_Menu.renderMenu);

          document.body.removeEventListener("click", ALX_NS_PH_TB_Menu.clickListener, false);
          document.body.addEventListener("click", ALX_NS_PH_TB_Menu.clickListener, false);
        }
      },
      shutdown: function()
      {
        ALX_NS_PH_TB_Menu.bid = null;
        ALX_NS_PH_TB_Menu.menuid = null;
        ALX_NS_PH_TB_Menu.menupopupid = null;
        ALX_NS_PH_TB_Menu.align = null;
        while (document.body.firstChild) {
          document.body.removeChild(document.body.firstChild);
        }
        document.body.removeEventListener("click", ALX_NS_PH_TB_Menu.clickListener, false);
      }
    }
  }

})();

window.addEventListener("hashchange", function () { ALX_NS_PH_TB_Menu.restart(); }, false);
window.addEventListener("load", function () { ALX_NS_PH_TB_Menu.init(); }, false);
window.addEventListener("unload", function () { ALX_NS_PH_TB_Menu.shutdown();}, false);
