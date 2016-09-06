chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    var message_pay_load      = JSON.parse(request.message_payload);
    //var now = new Date();
    //now = (parseFloat)(now.getTime()) / 1000;
    //trace((String)(now) + request.message_type)
    
    if (typeof sender.tab == "undefined")
      sender.tab = {id: null, url: null, windowId: null};
    message_pay_load["tabId"] = sender.tab.id;
    message_pay_load["tabUrl"] = sender.tab.url;
    message_pay_load["winId"] = sender.tab.windowId;

    switch(request.message_type)
    {
      case "BACK_RESET_DATA_NEEDED":
        ALX_NS_PH_SPARKLINE.readPrefs();
        ALX_NS_PH.Layouts.init();
        chrome.browserAction.setPopup({popup: "/html/popup.html"});
        sendResponse({});
        break;
      case "BACK_REGISTER_BUTTON":
        ALX_NS_PH_TB.registerButton( message_pay_load );
        sendResponse({});
        break;
      case "BACK_SET_BUTTONS":
        ALX_NS_PH_TB.setButtons( message_pay_load );
        sendResponse({});
        break;
      case "BACK_SET_CONFIGURATION":
        ALX_NS_PH_TB.setConfiguration( message_pay_load );
        sendResponse({});
        break;
      case "BACK_MENU_CALLBACK":
        ALX_NS_PH_TB.menuCallback( message_pay_load );
        sendResponse({});
        break;
      case "BACK_SET_SEARCHBOX_TEXT":
        ALX_NS_PH_TB.setSearchboxText( message_pay_load );
        sendResponse({});
        break;
      case "BACK_INJECT_JS":
        ALX_NS_PH_TB.injectJs( message_pay_load );
        sendResponse({});
        break;
      case "BACK_FETCH_ALEXA_DATA":
        ALX_NS_PH_TB.fetchAlexaData( message_pay_load, sendResponse );
        break;
      case "BACK_CLOSE_API_WINDOW":
        ALX_NS_PH_TB.closeApiWindow( message_pay_load );
        break;
      case "BACK_REQUEST_API_DATA":
        ALX_NS_PH_TB.requestApiData( message_pay_load, sendResponse );
        break;
      case "BACK_SET_API_DATA":
        ALX_NS_PH_TB.setApiData( message_pay_load );
        sendResponse({});
        break;
      case "BACK_DATA_REQUEST":
        ALX_NS_PH_SPARKLINE.update( message_pay_load );
        sendResponse({}); // snub them.
        break;
      case "BACK_RANK_SPEC":
        var rankSpec = ALX_NS_PH.Layouts.requestSpec( message_pay_load );
        sendResponse( rankSpec );
        break;
      case "BACK_GET_RANK":
        ALX_NS_PH.Layouts.requestRanks( message_pay_load, sendResponse);
        break;
      case "BACK_CACHE_REQUEST":
        ALX_NS_PH_TB.cacheRequest( message_pay_load, sendResponse);
        break;
      case "BACK_GET_MENU_ITEMS":
        ALX_NS_PH_TB.getMenuItems( message_pay_load, sendResponse);
        break;
      case "BACK_GET_SEARCH_SUGGESTION_INFO":
        ALX_NS_PH_TB.getMenuItems( message_pay_load, sendResponse);
        break;
      case "BACK_INTERNAL_LOAD_URL":
        ALX_NS_PH_TB.internalLoadURL( message_pay_load, sendResponse );
        break;
      case "BACK_APPLY_WIN_METHOD":
        ALX_NS_PH_TB.applyWinMethod( message_pay_load );
        sendResponse({});
        break;
      case "BACK_TOGGLE_DROP_DOWN":
        ALX_NS_PH_TB.toggleDropDown( message_pay_load );
        sendResponse({});
        break;
      case "BACK_RESIZE_DROPDOWN":
        ALX_NS_PH_TB.resizeDropDown( message_pay_load );
        sendResponse({});
        break;
      case "BACK_CLOSE_DROPDOWNS":
        ALX_NS_PH_TB.closeDropDowns( message_pay_load );
        sendResponse({});
        break;
      case "BACK_CHANGE_PROVIDER":
        ALX_NS_PH_TB.changeProvider( message_pay_load, sendResponse);
        break;
      case "BACK_FETCH_IMAGE":
        ALX_NS_PH_TB.fetchImage( message_pay_load, sendResponse);
        break;
      case "BACK_BUTTON_CALLBACK":
        ALX_NS_PH_TB.buttonCallback( message_pay_load, sendResponse );
        break;
      case "BACK_CREATE_MENU_FROM_ITEM_LIST":
        ALX_NS_PH_TB.createMenuFromItemList( message_pay_load );
        sendResponse({});
        break;
      case "BACK_CREATE_SEARCH_SUUGGESTION":
        ALX_NS_PH_TB.createSearchSuggestion( message_pay_load );
        sendResponse({});
        break;
      case "BACK_HIDE_SEARCH_SUGGESTION":
        ALX_NS_PH_TB.hideSearchSuggestion( message_pay_load );
        sendResponse({});
        break;
      case "BACK_UPDATE_RSS":
        ALX_NS_PH_TB.updateRss( message_pay_load);
        sendResponse({});
        break;
      case "BACK_GET_PRIVATE_WINDOW_INFO":
        ALX_NS_PH_TB.getPrivateWindowInfo( message_pay_load );
        sendResponse({});
        break;
      case "BACK_CHECK_PAGE_POSITION":
        ALX_NS_PH_TB.checkPagePosition( message_pay_load );
        sendResponse({});
        break;
      case "BACK_SET_TOOLBAR_ROOT":
        ALX_NS_PH_TB.setToolbarRoot( message_pay_load );
        sendResponse({});
        break;
      case "BACK_APPLY_ADDITIONAL_METHOD":
        if (typeof ALX_NS_PH_ADDITIONAL != "undefined")
          ALX_NS_PH_ADDITIONAL.applyMethod( message_pay_load );
        sendResponse({});
        break;
      default:
        sendResponse({}); // snub them.
    }
  }
);
