/******************
 * Liangnan Wu *
 * Alexa Internet *
 ******************/
var ALX_NS_PH_TB_Helper = new ALX_NS_PH_TB_Basic();
(function () {
  if (typeof ALX_NS_PH_TB_Menupopup == "undefined") {
    window.ALX_NS_PH_TB_Menupopup = {
      bid: null,
      menuid: null,
      menupopupid: null,
      align: null,
      searchterm: null,
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
        
        ALX_NS_PH_TB_Menupopup.bid = params.bid;
        ALX_NS_PH_TB_Menupopup.menuid = params.menuid;
        ALX_NS_PH_TB_Menupopup.align = params.align;
        ALX_NS_PH_TB_Menupopup.searchterm = params.searchterm;
        ALX_NS_PH_TB_Menupopup.menupopupid = ALX_NS_PH_TB_Menupopup.getMenuPopupId( ALX_NS_PH_TB_Menupopup.bid, ALX_NS_PH_TB_Menupopup.menuid);
      },
      parse_description: function(description) {
        var descriptions = [],
            price_container = null,
            stars_container = null,
            plain_text      = null,
            price_text      = null,
            stars_image     = null,
            stars           = description.match(/\((\d\.\d)\sof\s(\d)\sstars\)/),
            price           = description.match(/\$\d+\.\d+(\s*\(\d+%\soff\)|\s*)/)
        if(stars && stars[0]) {
          stars_container     = document.createElement('span');
          stars_container.className += ' stars rating-' + stars[1].replace('.','-');
          stars_container.setAttribute('title',stars[0]);
          var nbsp = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"
          stars_container.innerHTML = nbsp + nbsp + nbsp;
          description = description.replace(stars[0],'');
        }
        if(price && price[0]) {
          price_container = document.createElement('span');
          price_text      = document.createElement('description');
          price_text.setAttribute("class", "textbox-price_text");
          plain_text      = document.createElement('description');
          plain_text.setAttribute("class", "textbox-plain_text");
          price_text.setAttribute('value',price[0]);
          price_text.innerText = price[0];
          description = description.replace(price[0],'');
          plain_text.setAttribute('value',A$.trim(description) + ' ');
          plain_text.innerText = A$.trim(description) + ' ';
          price_container.appendChild(plain_text);
          price_container.appendChild(price_text);
        }

        if(price_container === null && stars_container === null) {
          plain_text = document.createElement('description');
          plain_text.setAttribute('value',description);
          plain_text.setAttribute("class", "textbox-plain_text");
          plain_text.innerText = description;
          descriptions.push(plain_text);
          descriptions.push(null);
        } else {
          descriptions.push(price_container);
          descriptions.push(stars_container);
        }
        return descriptions;
      },
      renderMenupopup: function(searchsuggestioninfo)
      {
        if (searchsuggestioninfo.suggestions.searchterm == ALX_NS_PH_TB_Menupopup.searchterm)
        {
          var table = document.createElement("table");
          var popup = document.createElement("tbody");
          if (ALX_NS_PH_TB_Menupopup.align == "right")
            table.setAttribute("class", "unsorted_list unsorted_list_right");
          else
            table.setAttribute("class", "unsorted_list");
          table.appendChild(popup);
          document.body.appendChild(table);
          
          // header
          if (searchsuggestioninfo.suggestions.header)
          {
            var header_container = document.createElement('tr');
            header_container.setAttribute("class", "header_list");
            var empty_container = document.createElement('td');
            empty_container.setAttribute("class", "image_cell")
            var text_container = document.createElement('td');
            text_container.setAttribute("class", "text_cell text_cell_header")
            text_container.innerText = searchsuggestioninfo.suggestions.header;
            header_container.appendChild(empty_container);
            header_container.appendChild(text_container);
            popup.appendChild(header_container);
          }
          
          A$.foreach(searchsuggestioninfo.items,function(i,item) {
            var menu_item      = document.createElement('tr');
            menu_item.setAttribute("class", "normal_list");
            var image          = document.createElement('img');
            var text           = document.createElement('description');
            text.setAttribute("class", "text_cell_inner")
            var descriptions    = [null, null];
            var image_container = document.createElement('td');
            image_container.setAttribute("class", "image_cell")
            var text_container = document.createElement('td');
            text_container.setAttribute("class", "text_cell")
            
            if(item.image && item.image.attributes)
            {
              if(item.image.attributes.source === undefined) {
                image.setAttribute('src', '/images/no-img-sm.png');
              }else {
                ALX_NS_PH_TB_Helper.fetch_image(image, item.image.attributes.source);
              }
              image.setAttribute('height' ,item.image.attributes.height);
              image.setAttribute('width'  ,item.image.attributes.width);
              image.setAttribute('align'  ,item.image.attributes.align);
              image.setAttribute('alt',item.image.attributes.alt);
            }
            image_container.setAttribute('title',item.text.content);
            image_container.appendChild(image);
           
            text.setAttribute('flex'       ,'1');
            text.setAttribute('crop'       ,'end');
            text.setAttribute('tooltiptext',item.text.content);
            text.setAttribute('value'      ,item.text.content);
            text.innerText = item.text.content;

            if (item.description && item.description.content)
              descriptions = ALX_NS_PH_TB_Menupopup.parse_description(item.description.content);

            text_container.setAttribute('flex' ,'1');
            text_container.setAttribute('align','start');
            text_container.setAttribute('title',item.text.content);
            text_container.appendChild(text);
            for(var i in descriptions)
            {
              var description = descriptions[i]
              if (description != null)
              {
                text_container.appendChild(document.createElement('br'));
                text_container.appendChild(description);
              }
            }

            if (item.url && item.url.content)
              menu_item.setAttribute('gotourl',item.url.content);
            menu_item.setAttribute('flex'   ,'1');
            menu_item.setAttribute('pack'   ,'start');
            menu_item.appendChild(image_container);
            menu_item.appendChild(text_container);
            
            menu_item.addEventListener("click", function(e) {
              var url = this.getAttribute("gotourl");
              var openIn = this.getAttribute("openIn");

              if (!openIn)
                openIn = "newTab";
                
              var _alx_data = {
                url:      url,
                openIn:   openIn
              };

              var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_INTERNAL_LOAD_URL", _alx_data);
              chrome.extension.sendRequest( _alx_data_payload, function() {});
            }, false)

            popup.appendChild(menu_item);
          });
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
        ALX_NS_PH_TB_Menupopup.shutdown(); 
        ALX_NS_PH_TB_Menupopup.init();
      },
      init: function()
      {
        ALX_NS_PH_TB_Menupopup.preload();
        if ( ALX_NS_PH_TB_Menupopup.menupopupid != null )
        {
          var _alx_data = {
            menupopupid: ALX_NS_PH_TB_Menupopup.menupopupid
          };
          var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData( "BACK_GET_SEARCH_SUGGESTION_INFO", _alx_data);
          chrome.extension.sendRequest( _alx_data_payload, ALX_NS_PH_TB_Menupopup.renderMenupopup);
          
          document.body.removeEventListener("click", ALX_NS_PH_TB_Menupopup.clickListener, false);
          document.body.addEventListener("click", ALX_NS_PH_TB_Menupopup.clickListener, false);
        }
      },
      shutdown: function()
      {
        ALX_NS_PH_TB_Menupopup.bid = null;
        ALX_NS_PH_TB_Menupopup.menuid = null;
        ALX_NS_PH_TB_Menupopup.menupopupid = null;
        ALX_NS_PH_TB_Menupopup.searchterm = null;
        ALX_NS_PH_TB_Menupopup.align = null;
        while (document.body.firstChild) {
          document.body.removeChild(document.body.firstChild);
        }
        document.body.removeEventListener("click", ALX_NS_PH_TB_Menupopup.clickListener, false);
      }
    }
  }

})();

window.addEventListener("hashchange", function () { ALX_NS_PH_TB_Menupopup.restart(); }, false);
window.addEventListener("load", function () { ALX_NS_PH_TB_Menupopup.init(); }, false);
window.addEventListener("unload", function () { ALX_NS_PH_TB_Menupopup.shutdown();}, false);
