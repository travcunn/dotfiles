   �      9https://slack.global.ssl.fastly.net/9aa4/js/libs/ladda.js %�'��� %~eX         
     O K           �      Expires   Fri, 10 Jan 2020 23:30:00 GMT   Cache-Control   max-age=315360000, public   Last-Modified   Mon, 15 Jun 2015 18:40:07 GMT   ETag   ""7c28bd4de25b93a78e4ae43fa420ba65"   Content-Type   application/javascript   Access-Control-Allow-Origin   *   Content-Encoding   gzip   Accept-Ranges   bytes   Via   1.1 varnish   Age   2965226   X-Served-By   cache-ord1726-ORD   X-Cache   HIT   X-Cache-Hits   2   X-Timer   S1445445219.165573,VS0,VE0   Vary   Accept-Encoding /*!
 * Ladda 0.9.0
 * http://lab.hakim.se/ladda
 * MIT licensed
 *
 * Copyright (C) 2013 Hakim El Hattab, http://hakim.se
 *
 * Slack-specific changes to work around winssb problems. - PK
 */
(function(a,b){if(typeof exports==="object"){module.exports=b()
}else{if(typeof define==="function"&&define.amd){define(["spin"],b)
}else{a.Ladda=b(a.Spinner)
}}}(this,function(c){var e=[];
var i=/atomshell/i.test(navigator.userAgent);
function f(l){if(typeof l==="undefined"){console.warn("Ladda button target must be defined.");
return
}if(!l.querySelector(".ladda-label")){l.innerHTML='<span class="ladda-label">'+l.innerHTML+"</span>"
}var n=j(l);
var m=document.createElement("span");
m.className="ladda-spinner";
l.appendChild(m);
var o;
var k={start:function(){l.setAttribute("disabled","");
if(!i){l.setAttribute("data-loading","")
}clearTimeout(o);
if(!i){n.spin(m)
}this.setProgress(0);
return this
},startAfter:function(p){clearTimeout(o);
o=setTimeout(function(){k.start()
},p);
return this
},stop:function(){l.removeAttribute("disabled");
l.removeAttribute("data-loading");
clearTimeout(o);
o=setTimeout(function(){n.stop()
},1000);
return this
},toggle:function(){if(this.isLoading()){this.stop()
}else{this.start()
}return this
},setProgress:function(p){if(i){return
}p=Math.max(Math.min(p,1),0);
var q=l.querySelector(".ladda-progress");
if(p===0&&q&&q.parentNode){q.parentNode.removeChild(q)
}else{if(!q){q=document.createElement("div");
q.className="ladda-progress";
l.appendChild(q)
}q.style.width=((p||0)*l.offsetWidth)+"px"
}},enable:function(){this.stop();
return this
},disable:function(){this.stop();
l.setAttribute("disabled","");
return this
},isLoading:function(){return l.hasAttribute("data-loading")
}};
e.push(k);
return k
}function g(l,k){while(l.parentNode&&l.tagName!==k){l=l.parentNode
}return l
}function b(o){var n=["input","textarea"];
var k=[];
for(var m=0;
m<n.length;
m++){var p=o.getElementsByTagName(n[m]);
for(var l=0;
l<p.length;
l++){if(p[l].hasAttribute("required")){k.push(p[l])
}}}return k
}function h(o,m){m=m||{};
var l=[];
if(typeof o==="string"){l=d(document.querySelectorAll(o))
}else{if(typeof o==="object"&&typeof o.nodeName==="string"){l=[o]
}}for(var n=0,k=l.length;
n<k;
n++){(function(){var q=l[n];
if(typeof q.addEventListener==="function"){var p=f(q);
var r=-1;
q.addEventListener("click",function(w){var v=true;
var u=g(q,"FORM");
var s=b(u);
if(u&&u.checkValidity){v=u.checkValidity()
}else{for(var t=0;
t<s.length;
t++){if(s[t].value.replace(/^\s+|\s+$/g,"")===""){v=false
}}}if(v){p.startAfter(1);
if(typeof m.timeout==="number"){clearTimeout(r);
r=setTimeout(p.stop,m.timeout)
}if(typeof m.callback==="function"){m.callback.apply(null,[p])
}}},false)
}})()
}}function a(){for(var l=0,k=e.length;
l<k;
l++){e[l].stop()
}}function j(n){var l=n.offsetHeight,q;
if(l>32){l*=0.8
}if(n.hasAttribute("data-spinner-size")){l=parseInt(n.getAttribute("data-spinner-size"),10)
}if(n.hasAttribute("data-spinner-color")){q=n.getAttribute("data-spinner-color")
}var m=12,k=l*0.2,p=k*0.6,o=k<7?2:3;
return new c({color:q||"#fff",lines:m,radius:k,length:p,width:o,zIndex:"auto",top:"auto",left:"auto",className:""})
}function d(l){var k=[];
for(var m=0;
m<l.length;
m++){k.push(l[m])
}return k
}return{bind:h,create:f,stopAll:a}
}));