define(function(require){
var t=require("lib/i18n").t;
return function(obj){
var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};
with(obj||{}){
__p+='<p>\n\t'+
((__t=( t("walkthrough_ghostrank_paragraph1") ))==null?'':__t)+
'\n\t<ul style="list-style-type:none;">\n\t\t<li>\n\t\t\t'+
((__t=( t("walkthrough_ghostrank_paragraph1_bullet1") ))==null?'':__t)+
'\n\t\t</li>\n\t\t<li>\n\t\t\t'+
((__t=( t("walkthrough_ghostrank_paragraph1_bullet2") ))==null?'':__t)+
'\n\t\t</li>\n\t</ul>\n</p>\n\n<p>\n\t'+
((__t=( t("walkthrough_ghostrank_paragraph2") ))==null?'':__t)+
'\n</p>\n';
}
return __p;
};
});