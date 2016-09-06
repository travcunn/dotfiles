chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    var message_pay_load      = JSON.parse(request.message_payload);

    switch(request.message_type)
    {
      case "TOOLBAR_MENU_CALLBACK":
        ALX_NS_PH_TB_RENDER.menuCallback( message_pay_load );
        sendResponse({});
        break;
      case "TOOLBAR_UPDATE_SEARCH_BUTTON":
        ALX_NS_PH_TB_RENDER.updateSearchButton( message_pay_load );
        sendResponse({});
        break;
      case "TOOLBAR_FETCH_ALEXA_DATA":
        ALX_NS_PH_TB_RENDER.extension.fetchData();
        sendResponse({});
        break;
      case "TOOLBAR_BUTTON_CALLBACK":
        ALX_NS_PH_TB_RENDER.buttonCallback( message_pay_load, sendResponse );
        break;
      case "TOOLBAR_UPDATE_RSS":
        ALX_NS_PH_TB_RENDER.updateRss( message_pay_load );
        sendResponse({});
        break;
      default:
        break;
    }
  }
);
