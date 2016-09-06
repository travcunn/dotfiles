
function dispChromeSiteInfo( host )
{
  document.write( '<iframe name="minisiteinfo" ' + 
          'src="http://www.alexa.com/minisiteinfo/' + host + '?offset=5&version=alxg_20100607" ' +
                  'style="padding:0px; overflow:hidden;" '+
          'width="400px" ' +
          'height="350px" ' +
          'marginwidth="5px" ' +
          'marginheight="5px" ' +
          'frameborder="0" ' +
          'scrolling="no" ' +
          '></iframe>' ); 
};

function enableAll() 
{
  if (localStorage.privacyPolicyAccepted != "true")
    showWelcome();
  window.close();
};

function showWelcome()
{
  chrome.tabs.create({url:"html/welcome.html"});
};

function onLoad()
{
  if ( localStorage.privacyPolicyAccepted == "true" )
  {
    if ("ALX_NS_PH" == "TBPLATFORM_NS_PH")
    {
      chrome.management.get(String(location.host), function(obj) {
        chrome.tabs.create({url: obj.homepageUrl});
        window.close();
      });
    }
    else {
      chrome.tabs.getSelected(
        null,
        function(tab)
        {
          var url = tab.url;
          if (url.match("http://\w*.?alexa.com/siteinfo/.*"))
            var host = url.split("/")[4].split("?")[0].split("#")[0];
          else if (url.match("http://\w*.?alexa.com/site/linksin/.*"))
            var host = url.split("/")[5].split("?")[0].split("#")[0];     
          else
            var host = url.split("/")[2].split("?")[0].split("#")[0];
          dispChromeSiteInfo(host);
        }
      );
    }
  } else
    enableAll();
};

window.addEventListener( "load", function(event) { onLoad(event); }, false );
