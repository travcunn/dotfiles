function acceptTerms() 
{
  ALX_NS_PH_TB_Helper.acceptTerm();
  var _alx_data = {};
  var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData( "BACK_RESET_DATA_NEEDED", _alx_data);
  chrome.extension.sendRequest( _alx_data_payload, function() {} );
  window.close()
};

function declineTerms() 
{
  ALX_NS_PH_TB_Helper.declineTerm();
  window.close();
};

function onload()
{
  ALX_NS_PH_TB_Helper = new ALX_NS_PH_TB_Basic();
  document.getElementById("accept").addEventListener("click", function(e) {acceptTerms();}, false);
  document.getElementById("decline").addEventListener("click", function(e) {declineTerms();}, false);
}

window.addEventListener("load", function(e) {onload();}, false);
