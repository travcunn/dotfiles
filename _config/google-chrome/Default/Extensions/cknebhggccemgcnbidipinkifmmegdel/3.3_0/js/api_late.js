var ALX_NS_PH_TB_API_OUT = {
  setApiData: function(obj)
  {
    if (obj.data || obj.callback)
    {
      var div = document.getElementById("ALX_DATA");
      if (div)
      {
        var jsonstr = div.innerText;
        obj_inpage = {data: {}, callback:{} }
        if (jsonstr)
          obj_inpage = JSON.parse(jsonstr);
        if (!obj_inpage.data)
          obj_inpage.data = {};
        if (!obj_inpage.callback)
          obj_inpage.callback = {};

        if (obj.data)
        {
          for(var key in obj.data)
          {
            obj_inpage.data[key] = obj.data[key]
          }
        }

        if (obj.callback)
        {
          if (obj._meta.requireCallback && obj._meta.callid)
            obj_inpage.callback[obj._meta.callid] = obj.callback;
        }
        div.innerText = JSON.stringify(obj_inpage);
      }
    }
  },
  dataBack: function(e)
  {
    var objstr = e.currentTarget.innerText;
    var obj = JSON.parse(objstr);

    var _alx_data = {}
    if (obj.data)
      _alx_data = obj.data;
    var _alx_data_obj = ALX_NS_PH_TB_API_IN.createRequestData(obj.action, _alx_data);
    chrome.extension.sendRequest(_alx_data_obj, function(backdata)
    {
      backdata._meta = obj.data
      ALX_NS_PH_TB_API_OUT.setApiData(backdata);
    });
  },
  init: function()
  {
    var loadfunc = window.onload;
    var itr = 0;
    var datadiv = document.getElementById("ALX_DATA");
    var databackdiv = document.getElementById("ALX_DATA_BACK");

    var retryFunc = function(evt)
    {
      if(ALX_NS_PH_TB_API_IN.data && datadiv && databackdiv)
      {
        databackdiv.addEventListener("DOMSubtreeModified", ALX_NS_PH_TB_API_OUT.dataBack, false)
        datadiv.innerText = JSON.stringify({data: ALX_NS_PH_TB_API_IN.data});
        if (loadfunc)
          loadfunc(evt)
      } else if(itr < 10)
      {
        itr++;
        window.setTimeout(retryFunc, 200);
      }
    }
    if (  datadiv && databackdiv && ( window.top != window ||
          /\.alexa\.com$/.test(location.hostname) ||
          location.href.indexOf("https://s3.amazonaws.com/com.alexa.toolbar/alx/g/3.3/toolbar") == 0 ||
          location.href.indexOf("https://s3.amazonaws.com/com.alexa.toolbar/alx/g/3.3/buttons") == 0 ||
          location.href.indexOf("https://s3.amazonaws.com/com.alexa.toolbar") == 0 ||
          location.href.indexOf("http://s3.amazonaws.com/com.alexa.toolbar") == 0 ) )
    {
      var _alx_data = { data: [
        {type: "globalFeatures"},
        {type: "locale"},
        {type: "getButtons"},
        {type: "toolbarInfo"}
      ] };
      var _alx_data_obj = ALX_NS_PH_TB_API_IN.createRequestData("BACK_REQUEST_API_DATA", _alx_data);
      chrome.extension.sendRequest(_alx_data_obj, ALX_NS_PH_TB_API_IN.setApiData);
      window.onload = retryFunc;
    }
  }
};
ALX_NS_PH_TB_API_OUT.init();
