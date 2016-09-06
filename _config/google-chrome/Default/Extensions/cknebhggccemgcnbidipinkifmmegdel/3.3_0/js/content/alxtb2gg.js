/******************
 * Liangnan Wu *
 * Alexa Internet *
 ******************/

(function () {
  if (typeof ALX_NS_PH_TB == "undefined") 
  {
    window.ALX_NS_PH_TB = {
    }
  }
  if (typeof ALX_NS_PH_TB.extension == "undefined") 
  {
    ALX_NS_PH_TB.extension = {
      currentLocale: null,
      init_in_progress: false, 
      init_toolbar: function(tabId)
      {
        chrome.tabs.executeScript(tabId, {file: "js/content/toolbar.js"});
        chrome.tabs.insertCSS(tabId, {file: "css/content/toolbar.css"});
      },
      updateOnUpdate: function(tabId, changeInfo, tab)
      {
        if (tab.selected && changeInfo.status == "complete" && ALX_NS_PH_SPARKLINE.okUrl(tab.url))
          ALX_NS_PH_TB.extension.init_toolbar(tabId);
      },
      updateOnSelectChange: function(tabId, selectInfo)
      {
        var callback = function(t) {
          if (ALX_NS_PH_SPARKLINE.okUrl(t.url))
            ALX_NS_PH_TB.extension.init_toolbar(tabId);
        };
        ALX_NS_PH_SPARKLINE.getTab(tabId, callback);
      },
      init: function () 
      {
        ALX_NS_PH_TB.extension.currentLocale = ALX_NS_PH_TB_Helper.getPref("toolbarLocale", "default"); 
        if (!ALX_NS_PH_TB.extension.init_in_progress)
          ALX_NS_PH_TB.extension.init_in_progress = true;

        chrome.tabs.onUpdated.addListener(ALX_NS_PH_TB.extension.updateOnUpdate);
        chrome.tabs.onSelectionChanged.addListener(ALX_NS_PH_TB.extension.updateOnSelectChange);
        ALX_NS_PH_TB.extension.init_toolbar();
      },
      shutdown: function()
      {
      }
    }
  }
})();

window.addEventListener("load", function () { ALX_NS_PH_TB.extension.init(); }, false);
window.addEventListener("unload", function () { ALX_NS_PH_TB.extension.shutdown(); }, false);
