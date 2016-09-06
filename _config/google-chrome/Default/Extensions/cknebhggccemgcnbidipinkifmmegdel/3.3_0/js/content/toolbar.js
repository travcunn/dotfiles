(function () {

  if (typeof window.ALX_NS_PH_TB_Toolbar == "undefined")
  {
    window.ALX_NS_PH_TB_Toolbar = {};
    window.ALX_NS_PH_TB_Toolbar = {
      toolbar_height: 31,
      toolbar_exist: function()
      {
        return document.getElementById("ALX_NS_PH_TB-Toolbar");
      },
      updateToolbarHTMLInfo: function(obj)
      {
        var iframe = document.getElementById("ALX_NS_PH_TB-Toolbar");
        if (iframe)
        {
          console.log("PAGE_UPDATE_TOOLBAR_HTML_INFO")
          var bandp  = ALX_NS_PH_TB_Toolbar.decompositeUrl(iframe.src);
          var now = new Date();
          for(var key in obj)
          {
            var value = obj[key];
            bandp[1][key] = value
          }
          var now = new Date();
          now = now.getTime();
          var last = 0;
          if (bandp[1]["lastUpdate"])
            last = parseInt(bandp[1]["lastUpdate"]);
          if (now - last > 100)
          {
            bandp[1]["lastUpdate"]  = String(now);
            var newUrl = ALX_NS_PH_TB_Toolbar.compositeUrl(bandp[0], bandp[1]);
            iframe.src = newUrl;
          }
        }
      },
      isHideToolbar: function()
      {
        //xml file
        var xmlnode = document.getElementById("xml-viewer-style")
        if (xmlnode && xmlnode.tagName == "style")
          return true;

        var pdfnode = window.plugin;
        if (pdfnode && pdfnode.type == "application/pdf")
          return true;

        if (window.locationbar.visible)
          return false;

        var location = window.location
        if (location.protocol == "https:" || location.protocol == "http:")
          return false;

        return true;
      },
      init_toolbar: function()
      {
        var height = ALX_NS_PH_TB_Toolbar.toolbar_height;
        var topStart = parseInt(getComputedStyle(document.body.parentNode).getPropertyValue("padding-top").split("px")[0]);
        var iframe = document.createElement("iframe");
        iframe.setAttribute("src", chrome.extension.getURL("/html/content/toolbar.html"));
        iframe.setAttribute("scrolling", "no");
        iframe.setAttribute("frameborder", "no");
        iframe.setAttribute("style", "padding:0px 0px; background-color: #e1e1e1; display: block; width: 100%; height: " + height + "px; position: fixed; top: " + topStart + "px !important; left: 0px; z-index: 2147483647;");
        iframe.id  = "ALX_NS_PH_TB-Toolbar";
        if (document.body.tagName == "FRAMESET")
          document.body.parentElement.insertBefore(iframe, document.body);
        else
          document.body.insertBefore(iframe, document.body.firstChild);
        document.body.parentNode.setAttribute("alexastart", topStart);
        //alert((String)(topStart + height) + "px !important")
        document.body.parentNode.style.paddingTop = (String)(topStart + height) + "px";
      },
      getTop: function(node)
      {
        var top = getComputedStyle(node).getPropertyValue("top");
        if (top.indexOf("%") != -1)
        {
          top = parseInt(top.split("%")[0])
          top = window.innerHeight * top / 100;
        }
        else
          top = parseInt(top.split("px")[0])
          
        return top;
      },
      checkPagePosition: function()
      {
        var height = ALX_NS_PH_TB_Toolbar.toolbar_height;
        var treeWalker = document.createTreeWalker( document.body, NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: function(node)
          {
            if (node == null)
              return NodeFilter.FILTER_SKIP;

            if ("true" == node.getAttribute("alexaadjust"))
            {
              return NodeFilter.FILTER_ACCEPT;
            }
            else
              return NodeFilter.FILTER_SKIP;
          }
        },false );

        while( treeWalker.nextNode() )
        {
          var currentNode = treeWalker.currentNode;
          var alexaorig = currentNode.getAttribute("alexaorig");
          var alexatarg = currentNode.getAttribute("alexatarg");
          var alexatpos = currentNode.getAttribute("alexatpos");
          var position = getComputedStyle(currentNode).getPropertyValue("position");
          //var top = parseInt(getComputedStyle(currentNode).getPropertyValue("top").split("px")[0]);
          var top = ALX_NS_PH_TB_Toolbar.getTop(currentNode);; 
          if (position != alexatpos)
          {
            //console.log(currentNode.id + " " + position + " " + alexatpos);
            if (position == "relative" && alexatpos == "fixed")
            {
              currentNode.setAttribute("alexaTopAdjust", "true")
              if (top <= 0)
                currentNode.style.top = "0px";
              else
                currentNode.style.top = (String)(top - height) + "px";
            }
            if (position == "fixed" && alexatpos == "absolute")
            {
              currentNode.style.top = "";
              //var intop = parseInt(getComputedStyle(currentNode).getPropertyValue("top").split("px")[0]);
              var intop = ALX_NS_PH_TB_Toolbar.getTop(currentNode);; 
              currentNode.style.top = (String)(intop + height) + "px";
            }
          } else
          {
            if (top != alexatarg)
            {
              currentNode.style.top = (String)(alexatarg) + "px";
            }
          }
        }
      },
      readjust_page: function()
      {
        var height = ALX_NS_PH_TB_Toolbar.toolbar_height;
        var tobedel = [];
        var treeWalker = document.createTreeWalker( document.body, NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: function(node)
          {
            if (node == null)
              return NodeFilter.FILTER_SKIP;

            if (node.id && typeof node.id == "string" && node.id.indexOf("ALX_NS_PH_TB") == 0)
            {
              tobedel.push(node);
              return NodeFilter.FILTER_SKIP;
            }

            var position = getComputedStyle(node).getPropertyValue("position");
            if ("true" == node.getAttribute("alexaadjust"))
            {
              return NodeFilter.FILTER_ACCEPT;
            }
            else
              return NodeFilter.FILTER_SKIP;
          }
        },false );
        while( treeWalker.nextNode() )
        {
          var currentNode = treeWalker.currentNode;
          var alexaorig = currentNode.getAttribute("alexaorig");
          if (alexaorig)
          {
            currentNode.removeEventListener("DOMSubtreeModified", ALX_NS_PH_TB_Toolbar.nodeOnChange, false);
            currentNode.style.top = alexaorig + "px";
            currentNode.removeAttribute("alexaadjust");
            currentNode.removeAttribute("alexaorig");
            currentNode.removeAttribute("alexatarg");
            currentNode.removeAttribute("alexatpos");
          }
        }

        if (document.body.tagName == "FRAMESET")
        {
          var pre = document.body.previousElementSibling;
          while(pre && pre.id && typeof pre.id == "string" && pre.id.indexOf("ALX_NS_PH_TB") == 0)
          {
            tobedel.push(pre);
            pre = pre.previousElementSibling;
          }
        }

        for (var i = 0; i < tobedel.length; i++)
        {
          var node = tobedel[i];
          node.parentNode.removeChild(node);
        }

        var alexastart = document.body.parentNode.getAttribute("alexastart");
        if (alexastart)
          document.body.parentNode.style.paddingTop = (String)(alexastart) + "px";
        document.body.parentNode.removeAttribute("alexastart");
      },
      nodeOnChange: function(evt)
      {
        if (evt.currentTarget == this)
        {
          /*var height = ALX_NS_PH_TB_Toolbar.toolbar_height;
          var currentNode = evt.currentTarget;
          var top = parseInt(getComputedStyle(currentNode).getPropertyValue("top").split("px")[0]);
          var currentPos = getComputedStyle(currentNode).getPropertyValue("position");

          var parentNode = currentNode.parentElement;
          var parentPos = null;
          if (parentNode)
            parentPos = getComputedStyle(parentNode).getPropertyValue("position");

          while(parentNode)
          {
            var tmpPos = getComputedStyle(parentNode).getPropertyValue("position");
            if (tmpPos == "relative")
            {
              parentPos = null;
              break;
            }
            parentNode = parentNode.parentElement;
          }

          if (currentNode.id && (currentNode.id == "searchform" || currentNode.id == "blueBar"))
              console.log("before " + top + " " + currentNode.getAttribute("alexatarg"))
          if (currentPos == "fixed" || ( currentPos == "absolute" && parentPos=="static"))
          {
            var alexatarg = parseInt(currentNode.getAttribute("alexatarg"));

            if (alexatarg != top)
            {
              if (currentNode.id && (currentNode.id == "searchform" || currentNode.id == "blueBar"))
              {
                console.log("if " + top + " " + alexatarg + " " + (top + height))
                console.log((String)(top + height) + "px")
                console.log("heihei")
                document.getElementById("searchform").style.top = (String)(top + height) + "px";
              } else
              //currentNode.style.top = (String)(top + height) + "px !important"
              currentNode.style.top = (String)(top + height) + "px"

              currentNode.setAttribute("alexaorig", top);
              currentNode.setAttribute("alexatarg", top + height);
            }
          } else
          {

            var alexatarg = parseInt(currentNode.getAttribute("alexatarg"));
            if (currentNode.id && (currentNode.id == "searchform" || currentNode.id == "blueBar"))
              console.log("else " + top + " " + alexatarg)
            if (alexatarg == top)
              currentNode.style.top = "0px";
            else
              currentNode.setAttribute("alexatarg", top);
          }*/
        }
      },
      adjust_page: function()
      {
        var height = ALX_NS_PH_TB_Toolbar.toolbar_height;
        var treeWalker = document.createTreeWalker( document.body, NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: function(node)
          {
            if (node == null)
              return NodeFilter.FILTER_SKIP;
            var position = getComputedStyle(node).getPropertyValue("position");
            if (( position == "fixed" || position == "absolute") && "true" != node.getAttribute("alexaadjust"))
            {
              if (node.id && typeof node.id == "string" && node.id.indexOf("ALX_NS_PH_TB") == 0)
                return NodeFilter.FILTER_SKIP;
              else
                return NodeFilter.FILTER_ACCEPT;
            }
            else
              return NodeFilter.FILTER_SKIP;
          }
        },false );
        while( treeWalker.nextNode() )
        {
          var currentNode = treeWalker.currentNode;
          //var top = parseInt(getComputedStyle(currentNode).getPropertyValue("top").split("px")[0]);
          var top = ALX_NS_PH_TB_Toolbar.getTop(currentNode);; 
          var currentPos = getComputedStyle(currentNode).getPropertyValue("position");

          var parentNode = currentNode.parentElement;
          var parentPos = null;
          if (parentNode)
            parentPos = getComputedStyle(parentNode).getPropertyValue("position");

          while(parentNode)
          {
            var tmpPos = getComputedStyle(parentNode).getPropertyValue("position");
            if (tmpPos == "relative" || tmpPos == "absolute" || tmpPos == "fixed")
            {
              parentPos = null;
              break;
            }
            parentNode = parentNode.parentElement;
          }

          if (currentPos == "fixed" || ( currentPos == "absolute" && parentPos=="static"))
          {
            currentNode.style.top = (String)(top + height) + "px"
            currentNode.setAttribute("alexaadjust", "true");
            currentNode.setAttribute("alexaorig", top);
            currentNode.setAttribute("alexatarg", top + height);
            currentNode.setAttribute("alexatpos", currentPos);
            if ( currentPos == "absolute" && parentPos =="static" && parentNode)
              currentNode.setAttribute("alexainfo", parentNode.id);
            currentNode.addEventListener("DOMSubtreeModified", ALX_NS_PH_TB_Toolbar.nodeOnChange,false);
          }
        }
      },
      getMenuId: function(menupopupid)
      {
        return "ALX_NS_PH_TB-" + menupopupid.replace(/\./g, "-");
      },
      createPopupset: function()
      {
        var popupset = document.getElementById("ALX_NS_PH_TB-Toolbar-popupset");
        if (!popupset)
        {
          popupset = document.createElement("div");
          popupset.setAttribute("id", "ALX_NS_PH_TB-Toolbar-popupset");
          popupset.setAttribute("style", "display: block; width: 100%; position: fixed; top: " + ALX_NS_PH_TB_Toolbar.toolbar_height + "px !important; left: 0px; z-index: 2147483647 !important;");

          if (document.body.tagName == "FRAMESET")
            document.body.parentElement.insertBefore(popupset, document.body);
          else
            document.body.appendChild(popupset);
        }
        return popupset;
      },
      createSearchSuggestion: function(message_pay_load)
      {
        var menupopupid = ALX_NS_PH_TB_Toolbar.getMenuId(message_pay_load.menupopupid);
        var popupset    = ALX_NS_PH_TB_Toolbar.createPopupset();
        var menupopup   = document.getElementById(menupopupid);
        var iframe      = document.getElementById(menupopupid + "-iframe");
        var winWidth = window.innerWidth;

        if (!menupopup)
        {
          var bid = message_pay_load.bid;
          var menuid = message_pay_load.menuid;
          menupopup = document.createElement("div");
          menupopup.setAttribute("id", menupopupid);
          menupopup.setAttribute("style", "position: absolute; display: block; width: 400px; height: 0px; z-index: 2147483647;");

          iframe = document.createElement("iframe");
          iframe.setAttribute("id", menupopupid + "-iframe");
          iframe.setAttribute("name", menupopupid);
          iframe.setAttribute("scrolling", "no");
          iframe.setAttribute("frameborder", "no");
          var baseurl = chrome.extension.getURL("/html/content/menupopup.html");
          var url = ALX_NS_PH_TB_Toolbar.compositeUrl(baseurl, { bid: bid, menuid: menuid, searchterm: message_pay_load.searchterm});
          iframe.setAttribute("src", url);
          iframe.setAttribute("style", "position: absolute; display: block; width: 100%; height: 100%;");
          menupopup.appendChild(iframe);
          popupset.appendChild(menupopup);
        } else {
          var bandp  = ALX_NS_PH_TB_Toolbar.decompositeUrl(iframe.src);
          var now = new Date();
          bandp[1]["searchterm"]    = message_pay_load.searchterm;
          bandp[1]["creationTime"]  = now.getTime();
          var newUrl = ALX_NS_PH_TB_Toolbar.compositeUrl(bandp[0], bandp[1]);
          iframe.src = newUrl;
        }

        this.closeDropDowns();
        if (message_pay_load.align == "after_start" && message_pay_load.alignbox)
        {
          if ( winWidth - message_pay_load.alignbox.left < 400 )
          {
            menupopup.style.left = ( winWidth - 400 ) + "px";
            var bandp  = ALX_NS_PH_TB_Toolbar.decompositeUrl(iframe.src);
            bandp[1]["align"] = "right";
            var newUrl = ALX_NS_PH_TB_Toolbar.compositeUrl(bandp[0], bandp[1]);
            iframe.src = newUrl;
          }
          else
            menupopup.style.left = message_pay_load.alignbox.left + "px";
        }
        var calheight = menupopup.getAttribute("alx_height");
        if (!calheight)
          calheight = "700";
        menupopup.style.height = calheight + "px";
      },
      createMenu: function(message_pay_load)
      {
        var menupopupid = ALX_NS_PH_TB_Toolbar.getMenuId(message_pay_load.menupopupid);
        var popupset = ALX_NS_PH_TB_Toolbar.createPopupset();

        if (message_pay_load.isforce)
        {
          var menupopup = document.getElementById(menupopupid);
          if (menupopup)
            menupopup.parentNode.removeChild(menupopup);
        }

        if (!document.getElementById(menupopupid))
        {
          var bid = message_pay_load.bid;
          var menuid = message_pay_load.menuid;
          var menupopup = document.createElement("div");
          menupopup.setAttribute("id", menupopupid);
          menupopup.setAttribute("style", "position: absolute; display: block; width: 300px; height: 0px; z-index: 2147483647;");

          var iframe = document.createElement("iframe");
          iframe.setAttribute("id", menupopupid + "-iframe");
          iframe.setAttribute("name", menupopupid);
          iframe.setAttribute("scrolling", "no");
          iframe.setAttribute("frameborder", "no");
          iframe.setAttribute("src", chrome.extension.getURL("/html/content/menu.html#bid="+ encodeURIComponent(bid) +"&menuid=" + encodeURIComponent(menuid)));
          iframe.setAttribute("style", "position: absolute; display: block; width: 100%; height: 100%;");
          menupopup.appendChild(iframe);
          popupset.appendChild(menupopup);
        }
      },
      removeTransparentWindow: function(message_pay_load)
      {

        var menupopupid = message_pay_load.menupopupid;
        if (menupopupid)
        {
          var menupopup = document.getElementById(menupopupid);
          if (menupopup)
            menupopup.parentNode.removeChild(menupopup);
        }
      },
      createTransparentWindow: function(message_pay_load)
      {
        var menupopupid = ALX_NS_PH_TB_Toolbar.getMenuId(message_pay_load.menupopupid);
        var popupset = ALX_NS_PH_TB_Toolbar.createPopupset();

        if (message_pay_load.isforce)
        {
          var menupopup = document.getElementById(menupopupid);
          if (menupopup)
            menupopup.parentNode.removeChild(menupopup);
        }

        if (!document.getElementById(menupopupid))
        {
          var bid = message_pay_load.bid;
          var menuid = message_pay_load.menuid;
          var menupopup = document.createElement("div");
          menupopup.setAttribute("id", menupopupid);
          menupopup.setAttribute("style", "position: absolute; display: block; width: 300px; height: 0px; z-index: 2147483647;overflow: hidden;");
          if (message_pay_load.position)
          {
            if(message_pay_load.position.height)
              menupopup.setAttribute("alx_height", message_pay_load.position.height);
            if(message_pay_load.position.width)
              menupopup.setAttribute("alx_width", message_pay_load.position.width);
          }

          var iframe = document.createElement("iframe");
          iframe.setAttribute("id", menupopupid + "-iframe");
          iframe.setAttribute("name", menupopupid);
          iframe.setAttribute("scrolling", "no");
          iframe.setAttribute("frameborder", "no");
          iframe.setAttribute("src", message_pay_load.url);
          iframe.setAttribute("style", "position: absolute; display: block; width: 100%;");
          menupopup.appendChild(iframe);
          popupset.appendChild(menupopup);
        }
      },
      decompositeUrl: function(url)
      {
        var base = null;
        var params = {};

        var tmp = url.split("#");

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
        } else
          base = url;

        return [base, params]
      },
      compositeUrl: function(base, params)
      {
        var url = base;
        if (params)
           url = url + "#";

        for(var key in params)
        {
          var value = params[key];
          url = url + key + "=" + encodeURIComponent(value) + "&";
        }
        return url;
      },
      resizeDropDown: function(message_pay_load)
      {
        var menupopupid = ALX_NS_PH_TB_Toolbar.getMenuId(message_pay_load.menupopupid);
        var p = document.getElementById(menupopupid);
        if (p)
        {
          var opened = parseInt(getComputedStyle(p).getPropertyValue("height").split("px")[0]) > 0;
          if (p.clientWidth != message_pay_load.width)
          {
            var left = p.offsetLeft + (p.clientWidth - message_pay_load.width);
            p.style.left = left + "px";
          }
          if (opened)
          {
            p.style.width = message_pay_load.width + "px";
            p.style.height = message_pay_load.height + "px";
          }
          p.setAttribute("alx_width", message_pay_load.width);
          p.setAttribute("alx_height", message_pay_load.height);
        }
      },
      toggleDropDown: function(message_pay_load)
      {
        var menupopupid = ALX_NS_PH_TB_Toolbar.getMenuId(message_pay_load.menupopupid);
        var p = document.getElementById(menupopupid)
        var winWidth = window.innerWidth;
        if (p)
        {
          var opened = parseInt(getComputedStyle(p).getPropertyValue("height").split("px")[0]) > 0;
          var lastToggle = p.getAttribute("alx_last_toggle_time");
          var now = new Date();
          now = now.getTime();

          if (lastToggle)
          {
            var last = parseInt(lastToggle);
            if (now - lastToggle < 100)
              return;
          }
          p.setAttribute("alx_last_toggle_time", now);

          if (opened)
            p.style.height = "0px";
          else
          {
            this.closeDropDowns();
            var calwidth  = p.getAttribute("alx_width");
            //alert(message_pay_load.alignbox)
            if (calwidth)
              calwidth = parseInt(calwidth);
            else
              calwidth = 300;
            p.style.width = (String)(calwidth) + "px";

            if (message_pay_load.align == "auto" && message_pay_load.alignbox)
            {
              var mid = (message_pay_load.alignbox.left + message_pay_load.alignbox.right) / 2;
              if (mid < (winWidth / 2))
                message_pay_load.align = "after_start";
              else
                message_pay_load.align = "after_end";
            }
            if (message_pay_load.align == "after_start" && message_pay_load.alignbox)
            {
              if ( winWidth - message_pay_load.alignbox.left < calwidth )
              {
                p.style.left = ( winWidth - 17 - calwidth ) + "px";
                var iframe = document.getElementById(menupopupid + "-iframe");
                var bandp  = ALX_NS_PH_TB_Toolbar.decompositeUrl(iframe.src);
                bandp[1]["align"] = "right";
                p.setAttribute("alx_align", "right")
                var newUrl = ALX_NS_PH_TB_Toolbar.compositeUrl(bandp[0], bandp[1]);
                iframe.src = newUrl;
              }
              else
              {
                p.style.left = message_pay_load.alignbox.left + "px";
                p.setAttribute("alx_align", "left")
              }
            }
            if (message_pay_load.align == "after_end" && message_pay_load.alignbox)
            {
              if ( message_pay_load.alignbox.right < calwidth )
              {
                p.style.left = "0px";
                var iframe = document.getElementById(menupopupid + "-iframe");
                var bandp  = ALX_NS_PH_TB_Toolbar.decompositeUrl(iframe.src);
                bandp[1]["align"] = "left";
                p.setAttribute("alx_align", "left")
                var newUrl = ALX_NS_PH_TB_Toolbar.compositeUrl(bandp[0], bandp[1]);
                iframe.src = newUrl;
              }
              else
              {
                p.setAttribute("alx_align", "right")
                p.style.left = ( message_pay_load.alignbox.right - calwidth )+ "px";
              }
            }
            var calheight = p.getAttribute("alx_height");

            if (!calheight)
              calheight = "700";
            p.style.height = calheight + "px";
          }
        }
      },
      closeDropDowns: function(e)
      {
        var popupset = document.getElementById("ALX_NS_PH_TB-Toolbar-popupset");
        if (popupset)
        {
          var pset = popupset.childNodes;
          for(var i = 0; i < pset.length; i++)
          {
            var p = pset.item(i);
            p.style.height = "0px";
          }
        }
      },
      setListener: function()
      {
        chrome.extension.onRequest.addListener(
          function(request, sender, sendResponse)
          {
            var message_pay_load      = JSON.parse(request.message_payload);

            switch(request.message_type)
            {
              case "PAGE_SHOW_TOOLBAR":
                ALX_NS_PH_TB_Toolbar.init();
                sendResponse({});
                break;
              case "PAGE_HIDE_TOOLBAR":
                ALX_NS_PH_TB_Toolbar.shutdown();
                sendResponse({});
                break;
              case "PAGE_CREATE_MENU":
                ALX_NS_PH_TB_Toolbar.createMenu( message_pay_load );
                sendResponse({});
                break;
              case "PAGE_REMOVE_TRANSPARENT_WINDOW":
                ALX_NS_PH_TB_Toolbar.removeTransparentWindow( message_pay_load );
                sendResponse({});
                break;
              case "PAGE_CREATE_TRANSPARENT_WINDOW":
                ALX_NS_PH_TB_Toolbar.createTransparentWindow( message_pay_load );
                sendResponse({});
                break;
              case "PAGE_CREATE_SEARCH_SUUGGESTION":
                ALX_NS_PH_TB_Toolbar.createSearchSuggestion( message_pay_load );
                sendResponse({});
                break;
              case "PAGE_TOGGLE_DROP_DOWN":
                ALX_NS_PH_TB_Toolbar.toggleDropDown( message_pay_load );
                sendResponse({});
                break;
              case "PAGE_RESIZE_DROP_DOWN":
                ALX_NS_PH_TB_Toolbar.resizeDropDown( message_pay_load );
                sendResponse({});
                break;
              case "PAGE_UPDATE_TOOLBAR_HTML_INFO":
                ALX_NS_PH_TB_Toolbar.updateToolbarHTMLInfo( message_pay_load );
                sendResponse({});
                break;
              case "PAGE_CHECK_PAGE_POSITION":
                ALX_NS_PH_TB_Toolbar.checkPagePosition( message_pay_load );
                sendResponse({});
                break;
              case "PAGE_HIDE_SEARCH_SUGGESTION":
              case "PAGE_CLOSE_DROPDOWNS":
                ALX_NS_PH_TB_Toolbar.closeDropDowns( message_pay_load );
                sendResponse({});
                break;
              default:
                break;
            }
          }
        );
        window.addEventListener("click", ALX_NS_PH_TB_Toolbar.closeDropDowns, true);
      },
      init: function()
      {
        if( !ALX_NS_PH_TB_Toolbar.toolbar_exist() && !ALX_NS_PH_TB_Toolbar.isHideToolbar() )
        {
          ALX_NS_PH_TB_Toolbar.init_toolbar();
          ALX_NS_PH_TB_Toolbar.adjust_page();
        }
      },
      shutdown: function()
      {
        ALX_NS_PH_TB_Toolbar.readjust_page();
      }
    }
    ALX_NS_PH_TB_Toolbar.setListener();
    //ALX_NS_PH_TB_Toolbar.init();
  }
})()
