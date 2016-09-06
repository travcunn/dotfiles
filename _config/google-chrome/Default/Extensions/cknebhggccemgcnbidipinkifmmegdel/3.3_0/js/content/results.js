(function ( )  {
  var ALX_NS_PH = { 
    trim: function(str) {
      return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
  };

  if( typeof ALX_NS_PH.Results == 'undefined' ) 
  {
    ALX_NS_PH.Results = {
      'CBAImage': "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEkAAAATCAMAAADruNB/AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAuJQTFRF////AAAA9fX1vb295+fn9vb2ycnJ3NzcRERESEhIvLy8RkZGYWFh7e3tQkJCgoKCAgICXV1dsrKy+vr6MTExHR0dXFxcCQkJ7OzsRUVFOzs7k5OT7u7u8/PzuLi4c3Nzvr6+s7OzlJSU5OTkWVlZ1dXVVFRUsLCw7+/vampqmZmZqKion5+f6enptLS08PDwubm5m5ubioqKkJCQJSUllZWVWlpaPz8/NTU1FBQUGRkZAQEB0NDQ5ubmh4eHxcXFt7e3/+K3Hx8fysrKUlJS29vb8vLySkpK39/fv7+/U1NTdHR0UFBQ/6MYZmZmwMDAwcHBxsbG+Pj4fX19TExM/v7+//78UVFRzc3NHh4eYmJi/+rLl5eXiIiIa2trra2t//z4o6OjbW1tbGxsSUlJZGRke3t7/5cAnJyctbW1//nvFRUVDQ0NdnZ2/+bAwcLDCAgIkZGR/9id//rx//bp//Pg8fP29/f3x8fH/7NFhoaGuLe1/75c/8Rk/5UA/7dL/f39FhYW/Pz8Li4uQEBAkpKSIiIiKSkpcHBwrKysCwsLPT09Pj4+AgUJ/7xb/6Uj/7lRmJiY/5wH/7pTlpaWBAQE//LT/9WWq6ur/8l5/8yCyMjI//XmaWlpp6en/+vM/9eY/9KA/6Yf6urqy8vL19fX+fn5zMzM/+/XDxIWNDQ0dXV1HBwc2dnZjo6OxMTEnp6eenp6KysrjIyM//v26Na7r6+v/7lUg4ODW1tbBQUF/9KPLCwsGBgYVlZW/+3S/9uqBgYG/9aa//Ph/5oF1tbWKioq/7I9/5QAT09PhYWF1NTU4+Pjn6Oq/+K5Y2Nj3t7eqqqqqampu7u7/9CK/+CgfHx8/9ea09PT/5MA2NjYOTk5oqKi/6Uk/6Mg/6Ib/7pUurq6pqam/+m9ODg4X19fDAwM/7lV/+3REhISpKSk5tjE/5wI/7dR/8Jq/7ZJwLmuiYmJMDAw//HbISEhAAAAHpnORgAAAPZ0Uk5T//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////8ASj8gqQAAAoBJREFUeNqs1FNwJEAQBuC/18oq2ezGtu1cbONiG2fbtm3btm3bNvb9Nql72MvTXW7/p5marq9mproaajXpImo11AEc/H84AWoQC7oIi0Cti9UCL6Y+EkLd3GPBZA4HVtY7eMC07wIOxxEXd2cAYdGqiMyW0sRpXMDRtYIBrup5A+ycE1qF3xJDrHlqDdK6FtCheCIJsjX7QLacQogsVzUR2aOExhC5AJKCV8F2cadthRNzqw1EijR7f4WblnRqu4+bQqlfRRaFZLCDhEPFhnoyEsRFdyNfM96sfAvyNKE8CRWC1SxAZadtD5Dr6zWyBhV0HyOua0m44H24eTyjlMwEVAwpDx7Wop9kBQSGZJpSILaQhR8xs8gQGcEMmHFf9geu2AutYHkQ4NdrSdyNQXtHK9lO5OhOfmwpX786ZEMKmSOZzuMqGYNDVSbE1CMZnkVlaeoNfIBFKUZW8DQAjJy1JGvaCsV+j1IydSdrtjSvAyVBROZMIplfWPAwuJDPTBLoae4Uq7SBi3eMCOAl8+Xw/N5GukZRE4jKnEjPgTYziMeVKuOPkVMlrZtEi10pIOidKpzMVSSLkIvPOQSN6/B67qimsPVlaPAFjE20pD63hWPTs3tf8meE2t7QNyzB+5wky9pNXb7u+jAgFN+MY9ZAbmvH3vfQq3iFvzgccOXlJEKSj7u1gHe69o+3ZumLNu02e9mg5bf+sjX/kNbO2HN5p/Zpz6Odp95sjwQcePxk8p0lvRrLyxtPFM158+hT0Zkf7ZPQY/6Us/fqPqamTq8bfLJfJN52RzsloOOR45+ffhkycF7kwpYd/kGy0ckssCGo+boYKyy+ZtLpamb+EmAA8LWg6i/d/7cAAAAASUVORK5CYII=",
      'Ranks': {
        '0': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAHhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXsGjI9e%2Bf%2F%2FzJkzQw6DYxAUaiBPxLT%2BB3vk379%2FROH%2FgwiA%2FIDhkUHkPqKdAvYILGnBYoRo3YNIIThpDavMTkLpS3JRSq%2FiFwAICgd0Cacy%2FAAAAABJRU5ErkJggg%3D%3D',
        '1': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAHhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXsGAx%2B98v%2F%2FmTNnhgQGxyAo1EAeiWn9j4JBHvn37x9O%2FH8QAZAf8HpkELkVr1PAHoElLWwxMlQ8Ak5awyqzk1D6klyU0qv4BQA6wPrJb7boYwAAAABJRU5ErkJggg%3D%3D',
        '2': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAABGdBTUEAALGPC%2FxhBQAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAHhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXsGLz565f%2F%2FM2fODFoMjkFQqIE8EtP6HycGeeTfv38o%2BP8gAiA%2FEO2RQeRuDKeAPQJLWoRiZDB7BJy0hlVmJ6H0JbkopVfxCwAE1e4t58bljwAAAABJRU5ErkJggg%3D%3D',
        '3': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXuGaHz0yv%2F%2FZ86cGVQYHIOgUAN5JKb1P1EY5JHBBkB%2BGD4egSWtoRwj4KQ1rDI7CaUvyUUpvYpfAHFf4ZScMb22AAAAAElFTkSuQmCC',
        '4': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAABGdBTUEAALGPC%2FxhBQAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXuGLHz0yv%2F%2FZ86cGXAMjkFQqIE8EtP6n2QM8shgACA%2FDB%2BPwJLWUI4RcNIaVpmdhNKX5KKUXsUvAEjY1O%2BFuTVlAAAAAElFTkSuQmCC',
        '5': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAABGdBTUEAALGPC%2FxhBQAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXuGYnz0yv%2F%2FZ86cGRAMjkFQqIE8EtP6nyIM8shAAZAfho9HYElrKMcIOGkNq8xOQulLclFKr%2BIXALgNyEpAkh30AAAAAElFTkSuQmCC',
        '6': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAABGdBTUEAALGPC%2FxhBQAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXuGqvjolf%2F%2Fz5w5QzcMjkFQqIE8EtP6n2oY5BF6ApAfho9HYElrKMcIOGkNq8xOQulLclFKr%2BIXAL8Nu6VXRZL3AAAAAElFTkSuQmCC',
        '7': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXuGpvjolf%2F%2Fz5w5QzMMjkFQqIE8EtP6n2YY5BFaApAfho9HYElrKMcIOGkNq8xOQulLclFKr%2BIXAF8pqsmhgU10AAAAAElFTkSuQmCC',
        '8': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAABGdBTUEAALGPC%2FxhBQAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXuGbvjolf%2F%2Fz5w5Q1UMjkFQqIE8EtP6ny4Y5BFqA5Afho9HYElrKMcIOGkNq8xOQulLclFKr%2BIXAMhEniSmhHINAAAAAElFTkSuQmCC',
        '9': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAABGdBTUEAALGPC%2FxhBQAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXtmQPDRK%2F%2F%2FnzlzhmIMjkFQqIE8EtP6n%2B4Y5BFqAJAfho9HYElrKMcIOGkNq8xOQulLclFKr%2BIXAMkqkX92ldzlAAAAAElFTkSuQmCC',
        'a': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAABGdBTUEAALGPC%2FxhBQAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXtmwPHRK%2F%2F%2FnzlzhiwMjkFQqIE8EtP6f0AxyCPkApAfho9HYElrKMcIOGkNq8xOQulLclFKr%2BIXAGHbhNpTRCMEAAAAAElFTkSuQmCC',
        'b': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXtmUOGjV%2F7%2FP3PmDNEYHIOgUAN5JKb1%2F6DBII%2BQAkB%2BGD4egSWtoRwj4KQ1rDI7CaUvyUUpvYpfAJJIeDVXZ2naAAAAAElFTkSuQmCC',
        'c': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAABGdBTUEAALGPC%2FxhBQAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXtm0OKjV%2F7%2FP3PmDF4MjkFQqIE8EtP6f1BikEcIAZAfho9HYElrKMcIOGkNq8xOQulLclFKr%2BIXAFqAa5AouaEoAAAAAElFTkSuQmCC',
        'd': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAABGdBTUEAALGPC%2FxhBQAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGhJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXtmSOCjV%2F7%2FP3PmDAYGxyAo1EAeiWn9P%2BgxyCPYAMgPw8cjsKQ1lGMEnLSGVWYnofQluSilV%2FELALp0XutkZ4L7AAAAAElFTkSuQmCC',
        'e': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAABGdBTUEAALGPC%2FxhBQAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGdJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXtmyOGjV%2F7%2FP3PmDBiDYxAUaiCPxLT%2BH1IY5BEYAPlh%2BHgElrSGcoyAk9awyuwklL4kF6X0Kn4BsjNSRpUhqycAAAAASUVORK5CYII%3D',
        'f': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgY0hSTQAAeiYAAICEAAD6AAAAgOgAAHUwAADqYAAAOpgAABdwnLpRPAAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAGFJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaHlnXtmyOKjV%2F6DA4sBFGogj8S0%2Fh%2BSGOQRkB%2BGj0dgSWsoxwg4aQ2rzE5C6UtyUUqv4hcAq65J2G2I%2FpYAAAAASUVORK5CYII%3D',
        'x': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAICAYAAAC73qx6AAAABGdBTUEAALGPC%2FxhBQAAABh0RVh0U29mdHdhcmUAUGFpbnQuTkVUIHYzLjA4ZXKc4QAAAFtJREFUOE9jaGho%2BM9AAiBVPchoUvWQpR6kCYS7uvsJYphaYtWDzCRVD7nqwaG1adOmIY3BMQgKNZBHzpw5M2QxyA%2FDxyOwpDWUYwSctIZVZieh9CW5KKVX8QsAwVisZtvfQcsAAAAASUVORK5CYII%3D',
      },
      'rank2code': function( rank ) 
      {
        rank = +rank;
        return rank ==      0 ? 'x'
             : rank <=    100 ? 'f'
             : rank <=    180 ? 'e'
             : rank <=    320 ? 'd'
             : rank <=    560 ? 'c'
             : rank <=   1000 ? 'b'
             : rank <=   1800 ? 'a'
             : rank <=   3200 ? '9'
             : rank <=   5600 ? '8'
             : rank <=  10000 ? '7'
             : rank <=  18000 ? '6'
             : rank <=  32000 ? '5'
             : rank <=  56000 ? '4'
             : rank <= 100000 ? '3'
             : rank <= 180000 ? '2'
             : rank <= 320000 ? '1'
             :                  '0'
             ;
      },
      'Result': function( href, insertion ) 
      {
        this.href      = href;
        var node       = document.createElement( 'img' );
        node.src = ALX_NS_PH.Results.Ranks[ 'x' ];
        node.style.paddingRight = '1ex';
        if (ALX_NS_PH.Layouts.hideRankometer)
          node.style.display = "none";
        if (!document.getElementById(ALX_NS_PH.Layouts.widgetId))
          node.id = ALX_NS_PH.Layouts.widgetId;
        this.insertion = insertion;
        if( this.insertion ) {
          var first = this.insertion.firstChild;
          if (first.tagName == "A" || first.tagName == "IMG")
            this.insertion = first
          else
          {
            this.insertion.insertBefore( node, first );
            this.insertion = node;
          }
        }
        return this;
      },
      'sendResult': function(results)
      {
        var current = null;
        var uris    = [ ];
        for( var x = 0; results && x < results.length; x++ ) {
          current = results[ x ];
          uris.push( current.href );
        }
        if( uris.length == 0 )
          return true;
        
        var callback_get_rank = function(response)
        {
          var current = null;
          var rank    = null;
          var site    = null;
          if (!ALX_NS_PH.Layouts.hideRankometer)
          {
            for (var x = 0; x < results.length; ++x)
            {
              current = results[x]; 
              rank    = response.ranks[x];
              site    = response.sites[x];
              current.rank = rank;
              current.addRank(rank, site);
            }
          }
        };

        var _alx_rank_payload = {
          message_type:     "BACK_GET_RANK",
          message_payload:  JSON.stringify({ referer: window.location.href, results: uris, location: window.location})
        };
        chrome.extension.sendRequest( _alx_rank_payload, callback_get_rank);
      } 
    }
    ALX_NS_PH.Results.Result.prototype = {
      'rank'         : null,
      'href'         : null,
      'canonical'    : null,
      'insertion'    : null,
      'addRank'      : function( rank, uri ) {
        rank         = new Number( rank );
        var anchor   = window.document.createElement( 'A' );
        var label    = 'Alexa Traffic Rank for ' 
                     + this.href + ': ' 
                     + ( rank > 0 
                       ? rank.toLocaleString( )
                       : 'unavailable' )
                     ;

        var target   = this.href.split( '://' );
        target.shift( )
        target       = target.join( '' ).split( '?' );
        target       = target.length > 1 
                     ? target[ 0 ] + encodeURIComponent( '?' + target[ 1 ] )
                     : target.join( '?' )
                     ;
        anchor.href  = 'http://www.alexa.com/data/details/traffic_details/' 
                     + target;
        anchor.title = label
        anchor.style.paddingRight = "1ex";
        anchor.style.textDecoration = 'none';
        var img      = window.document.createElement( 'img' );
        img.style.border = 'none';
        img.alt      = label;
        if (!document.getElementById(ALX_NS_PH.Layouts.widgetId))
          img.id = ALX_NS_PH.Layouts.widgetId;
        img.src      = ALX_NS_PH.Results.Ranks[ ALX_NS_PH.Results.rank2code( rank ) ];
        anchor.appendChild( img );
        this.canonical = uri;
        
        if( this.insertion && this.insertion.parentNode) {
          this.insertion.parentNode.replaceChild( anchor, this.insertion );
          this.insertion = anchor;
        }
      }
    };
  }
 
  if( typeof ALX_NS_PH.Layouts == 'undefined' ) 
  {
    ALX_NS_PH.Layouts = {
      widgetId: "ALX_NS_PH_WIDGET", 
      hideRankometer: false,
      hideCBA: false,
      CBAUrl: null,
      onCBAsuccess: function( event ) 
      {
        if ( ALX_NS_PH.Layouts.hideCBA )
        { 
          var target = event.target;
          target.style.display = "none";
        }
      }, 
      onCBAfailure: function( event )
      {
        var target = event.target;
        if (target.parentNode && target.parentNode.parentNode)
          target.parentNode.parentNode.removeChild( target.parentNode );
      },
      getCBAImageURI: function(original, hint, doc, alexa_data)
      {
        if (ALX_NS_PH.Layouts.CBAUrl == null || typeof ALX_NS_PH.Layouts.CBAUrl !== "string")
          return null;
        
        var ct = new Date(); ct = String(ct.getTime());
        var uri = ALX_NS_PH.Layouts.CBAUrl;
        var prepath = uri.split( '?' )[ 0 ];
        var query   = uri.split( '?' )[ 1 ];
        var returnUrl = prepath
            +  encodeURIComponent( original )
            + '?hint=' + encodeURIComponent( hint )
            + '&'      + query
            + '&ver=' + encodeURIComponent( alexa_data.ver )
            + '&aid=' + encodeURIComponent( alexa_data.aid )
            + '&ct=' + encodeURIComponent( ct )
            + '&ts=' + encodeURIComponent( ct )
        return returnUrl;
      },
      genericCBACollect: function(doc, xpaths, isReload, alexa_data, name) 
      {
        var xpath_list = [];
        var insert_list = [];
        if (xpaths.block && xpaths.insert && xpaths.target)
        {
          for (var i in xpaths.block)
          {
            if (i < xpaths.block.length && i < xpaths.insert.length && i < xpaths.target.length)
            {
              var block   = xpaths.block[i];
              var insert  = xpaths.insert[i];
              var target  = xpaths.target[i];
              xpath_list.push({"block": block, "insert": insert, "target": target});
            }
          }
        }
        
        for (var i in xpath_list)
        {
          var xpath = xpath_list[i];
          var nodes = [];
          var handle  = doc.evaluate(xpath.block, doc, null, XPathResult.ANY_TYPE, null );
          for( var i = handle.iterateNext( ); i != null; i = handle.iterateNext( ) )
            nodes.push( i );

          for( var j = 0; j < nodes.length; j++ ) {
            current = nodes[ j ];
            var uri    = null;
            var insert = null;
            var hint   = null;
            try {
              handle = doc.evaluate(xpath.target, current, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
              uri     = handle.singleNodeValue;
              handle = doc.evaluate(xpath.insert, current, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
              insert = handle.singleNodeValue;
              if (uri)  {
                if (uri.ownerElement)
                  uri = uri.ownerElement.href;  
                else if (uri.nodeValue)
                  uri = uri.nodeValue;
                else if (uri.data)
                  uri = uri.data;
                else if (uri.textContent)
                  uri = uri.textContent;
                else
                  uri = null;
              }
              if (insert)
                hint   = insert.textContent;

              if ( uri && insert && hint )
              {
                insert_list.push({"uri": uri, "insert" : insert, "hint": hint});
              }
            } catch ( e ) { continue; }
          }
        }

        if (isReload)
        {
          if(insert_list.length == 0) {
            window.setTimeout( function() { ALX_NS_PH.Layouts.genericCBACollect(doc, xpaths, isReload, alexa_data, name); }, 500);
            return ;
          }
        }

        for(var i in insert_list)
        {
          var insert_node = insert_list[i];
          var uri     = insert_node.uri;
          var insert  = insert_node.insert;
          var hint    = insert_node.hint;
          var anchor      = window.document.createElement( 'A' )
          anchor.href = uri;

          var image  = window.document.createElement( 'img' );
          image.addEventListener( 'error', ALX_NS_PH.Layouts.onCBAfailure, false );
          image.addEventListener( 'load',  ALX_NS_PH.Layouts.onCBAsuccess, false );
          image.setAttribute('style', 'margin-left: 0px');
          image.style.border = 'none ';
          image.style.verticalAlign = 'bottom';
          var src = ALX_NS_PH.Layouts.getCBAImageURI( uri, hint, doc, alexa_data);
          if (src == null)
            continue

          anchor.id = uri
          var check = null;
          var list_a = insert.getElementsByTagName("A");
          for(var k in list_a)
          {
            var a_node = list_a[k];
            if (a_node && a_node.id && a_node.id == anchor.id)
              check = a_node;
          }

          if (check == null)
          {
            insert.appendChild( anchor );
            anchor.appendChild( image );
            var xhr = new XMLHttpRequest();
            xhr.image = image;
            xhr.onreadystatechange = function() 
            {
              if (this.readyState == 4)
              {
                if (this.status == 200)
                {
                  this.image.src = ALX_NS_PH.Results.CBAImage; 
                  ALX_NS_PH.Layouts.onCBAsuccess({"target": this.image});
                } else
                  ALX_NS_PH.Layouts.onCBAfailure({"target": this.image});
              }
            }
            xhr.open("GET", src);
            xhr.setRequestHeader("AlexaReferer", location.href);
            xhr.send();
            //image.src = src;
          }
        }
      },
      fetchUri: function(uristr, name, insert)
      {
        if (typeof uristr == 'string' && insert && name == 'baidu')
        {
          if (uristr.indexOf('.baidu.com/link?url=') != -1)
            uristr = ALX_NS_PH.trim(insert.textContent);
          if (uristr.indexOf('http') != 0)
            uristr = 'http://' + uristr;
        }
        if (typeof uristr == 'string' && (
            ( name == 'google' && uristr.indexOf('/url') == 0 ) ||
            ( name == 'amazon' && uristr.indexOf('url') != -1 )
           ))
        {
          var uri_p = uristr.split('?');
          if (uri_p.length > 1)
          {
            uri_p = uri_p[1];
            var uri_pair = uri_p.split('&');
            if (uri_pair.length > 1)
            {
              for(var key in uri_pair)
              {
                var value = uri_pair[key];
                var uri_vp = value.split('=');

                if (uri_vp.length == 2 && (
                    ( name == 'google' && uri_vp[0] == 'q' ) ||
                    ( name == 'amazon' && uri_vp[0] == 'url' )
                   ))
                {
                  uristr = decodeURIComponent(uri_vp[1]);
                  break;
                }
              }
            }
          }
        }
        return uristr;
      },
      genericCollect: function(doc, xpaths, isReload, name) 
      {
        var results = [ ];
        var current = null;
        var xpath_list = [];
        if (xpaths.block && xpaths.insert && xpaths.target)
        {
          for (var i in xpaths.block)
          {
            if (i < xpaths.block.length && i < xpaths.insert.length && i < xpaths.target.length)
            {
              var block   = xpaths.block[i];
              var insert  = xpaths.insert[i];
              var target  = xpaths.target[i];
              xpath_list.push({"block": block, "insert": insert, "target": target});
            }
          }
        }

        for (var i in xpath_list)
        {
          var xpath = xpath_list[i];
          var nodes = [];
          var handle  = doc.evaluate(xpath.block, doc, null, XPathResult.ANY_TYPE, null );
          for( var i = handle.iterateNext( ); i != null; i = handle.iterateNext( ) )
            nodes.push( i );


          for( var j = 0; j < nodes.length; j++ ) {
            current = nodes[ j ];
            var uri    = null;
            var insert = null;
            try {
              handle = doc.evaluate(xpath.target, current, null, XPathResult.STRING_TYPE, null );
              uri     = handle.stringValue;
              handle = doc.evaluate(xpath.insert, current, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null );
              insert = handle.singleNodeValue;
              if ( uri ) uri = ALX_NS_PH.Layouts.fetchUri(uri, name, insert);
              if (  uri && insert ) results.push( new ALX_NS_PH.Results.Result( uri, insert  ) );
            } catch ( e ) { continue; }
          }
        }
        
        if (isReload)
        {
          if(results.length == 0) {
            window.setTimeout( function() { ALX_NS_PH.Layouts.genericCollect(doc, xpaths, isReload, name); }, 500);
            return [];
          }
          ALX_NS_PH.Results.sendResult( results );
          return [];
        }

        return results;
      }
    }  
  }

  if ( true || !document.getElementById(ALX_NS_PH.Layouts.widgetId) )
  {

    var callback_ask_spec = function ( specData ) {
      ALX_NS_PH.Layouts.hideRankometer = specData.hideRankometer;
      ALX_NS_PH.Layouts.hideCBA = specData.hideCBA;
      ALX_NS_PH.Layouts.CBAUrl = specData.CBAUrl;
        
      if (specData.rankometer)
      {
        var rankfunc = function () {
          var results = ALX_NS_PH.Layouts.genericCollect( document, specData.rankometer.xpath, specData.rankometer.reload, specData.rankometer_name);
          if (results.length > 0)
            ALX_NS_PH.Results.sendResult( results );
        }
        if (specData.rankometer.reload)
          window.setTimeout(rankfunc, 2000);
        else
          rankfunc()
      }
      if (specData.cba)
      {
        var cbafunc = function () {
          ALX_NS_PH.Layouts.genericCBACollect( document, specData.cba.xpath, specData.cba.reload, specData.alexa, specData.cba_name);
        }
        if (specData.cba.reload)
          window.setTimeout(cbafunc, 2000);
        else
          cbafunc()
      }
    };
    var _alx_spec_payload = {
      message_type:     "BACK_RANK_SPEC",
      message_payload:  JSON.stringify({ url: location })
    };
    chrome.extension.sendRequest( _alx_spec_payload, callback_ask_spec);
  }
})( );
