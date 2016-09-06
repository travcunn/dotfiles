var ALX_NS_PH_TB_API_IN = {
  createRequestData: function(data_type, data_load)
  {
    var _alx_data_payload_in = {
      message_type:     data_type,
      message_payload:  JSON.stringify(data_load)
    };
    return _alx_data_payload_in;
  },
  setApiData: function(obj)
  {
    if (obj.data)
    {
      //console.log("ALX_NS_PH_TB_API_IN setApiData")
      if (!ALX_NS_PH_TB_API_IN.data)
        ALX_NS_PH_TB_API_IN.data = {}

      for(var key in obj.data)
      {
        ALX_NS_PH_TB_API_IN.data[key] = obj.data[key]
      }
    }
  },
  init: function()
  {
    //console.log("ALX_NS_PH_TB_API_IN init")
    ALX_NS_PH_TB_API_IN.registeListener();
  },
  registeListener: function()
  {
    window.addEventListener("scroll", function(e) {
      //if (window.scrollY <= 150)
      {
        var _alx_data = { y: window.scrollY};
        var _alx_data_obj = ALX_NS_PH_TB_API_IN.createRequestData("BACK_CHECK_PAGE_POSITION", _alx_data);
        chrome.extension.sendRequest(_alx_data_obj, function() {});
        //window.scrollTo(window.scrollX, 31);
      }
    }, false);
    chrome.extension.onRequest.addListener(
      function(request, sender, sendResponse)
      {
        var message_pay_load      = JSON.parse(request.message_payload);

        switch(request.message_type)
        {
          case "API_SET_API_DATA":
            ALX_NS_PH_TB_API_IN.setApiData(message_pay_load);
            sendResponse({});
            break;
          default:
            break;
        }
      }
    );
  },
  data: null
};
ALX_NS_PH_TB_API_IN.init();
