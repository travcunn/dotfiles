(function () {
  var _alx_data = {
    url:      location,
    referer:  document.referrer,
    loadTime: window.performance.timing.domContentLoadedEventEnd- window.performance.timing.navigationStart,
    winWidth: window.outerWidth
  };

  var _alx_data_payload = {
    message_type:     "BACK_DATA_REQUEST",
    message_payload:  JSON.stringify(_alx_data)
  };
  chrome.extension.sendRequest( _alx_data_payload, function() {});
})()
