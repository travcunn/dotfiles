/******************
 * Liangnan Wu *
 * Alexa Internet *
 ******************/
var ALX_NS_PH_TB_Helper = new ALX_NS_PH_TB_Basic();
function trim(str) {
  return str.replace(/^\s+|\s+$/g, "");
}

if (!Object.prototype.watch)
{
  Object.prototype.watch = function (prop, handler) {
    var oldval = this[prop], newval = oldval,
    getter = function () {
      var tmp_prop = prop.toLowerCase();
      if (tmp_prop == prop)
        return newval;
      else
        return this[tmp_prop];
    },
    setter = function (val) {
      var tmp_prop = prop.toLowerCase();
      if (tmp_prop != prop)
      {
        this[tmp_prop] = trim(val);
        return val;
      }
      oldval = newval;
      return newval = handler.call(this, prop, oldval, val);
    };
    if (delete this[prop]) { // can't watch constants
      if (Object.defineProperty) // ECMAScript 5
        Object.defineProperty(this, prop, {
          get: getter,
          set: setter
        });
      else if (Object.prototype.__defineGetter__ && Object.prototype.__defineSetter__) { // legacy
        Object.prototype.__defineGetter__.call(this, prop, getter);
        Object.prototype.__defineSetter__.call(this, prop, setter);
      }
    }
  };
}
// object.unwatch
if (!Object.prototype.unwatch)
{
  Object.prototype.unwatch = function (prop) {
      var val = this[prop];
      delete this[prop]; // remove accessors
      this[prop] = val;
  };
}

(function () {
  function trace(msg) {
    //console.log("<" + String(msg) + ">");
  }

  function sq(str) {
    return "decodeURIComponent('" + encodeURIComponent(str) + "')";
  }

  function sq_nostr(str) {
    return decodeURIComponent(encodeURIComponent(str));
  }

  var loadContentHelp = {
    stringBundle: null,
    isJs: function (fileName) {
      if (typeof fileName != "string") return false;

      if (fileName.toLowerCase().substr(-3) == ".js") return true;
      return false;
    },
    isXml: function(fileName) {
      if (typeof fileName != "string") return false;

      if (fileName.toLowerCase().substr(-4) == ".xml") return true;
      return false;
    },
    isCss: function (fileName) {
      if (typeof fileName != "string") return false;

      if (fileName.toLowerCase().substr(-4) == ".css") return true;
      return false;
    },
    isHtml: function (fileName) {
      if (typeof fileName != "string") return false;

      var fileName = fileName.toLowerCase();
      if (fileName.substr(-5) == ".html" || fileName.substr(-4) == ".htm") return true;
      return false;
    },
    isImg: function (fileName) {
      if (typeof fileName != "string") return false;

      var fileName = fileName.toLowerCase();
      if (fileName.substr(-5) == ".jpeg" || fileName.substr(-4) == ".jpg" || fileName.substr(-4) == ".gif" ||
          fileName.substr(-4) == ".png" || fileName.substr(-4) == ".bmp") return true;
      return false;
    },
    loadLocale: function () {
      if (!loadContentHelp.stringBundle) {
        loadContentHelp.stringBundle = {};
        loadContentHelp.currentLocale = "default";
        if (ALX_NS_PH_TB_Helper.getPref("toolbarLocale", null))
          loadContentHelp.currentLocale = ALX_NS_PH_TB_Helper.getPref("toolbarLocale");

        if (ALX_NS_PH_TB_Helper.getPref("toolbarLocaleText", null))
        {
          var toolbarLocaleText = decodeURIComponent(escape(ALX_NS_PH_TB_Helper.getPref("toolbarLocaleText", "default")));
          var dp = new DOMParser();
          var doc = dp.parseFromString(toolbarLocaleText, "text/xml");
          var buttons = doc.documentElement.getElementsByTagName("button");
          for (var i = 0; i < buttons.length; ++i) {
              var button = buttons.item(i);
              var id = button.getAttribute("id");
              loadContentHelp.stringBundle[id] = {
                  "visible": true,
                  "properties": {}
              };
              var children = button.childNodes;
              for (var j = 0; j < children.length; j++) {
                  var item = children.item(j);
                  var tagName = item.tagName;
                  switch (tagName) {
                  case "localeReplacement":
                      var lid = item.getAttribute("id");
                      loadContentHelp.stringBundle[id]["properties"][lid] = item.textContent;
                      break;
                  case "visible":
                      var value = item.textContent;
                      if (value.replace(/\s/g, "") == "false") loadContentHelp.stringBundle[id]["visible"] = false;
                      break;
                  }
              }
          }

          var configureNodes = doc.documentElement.getElementsByTagName("configuration");
          loadContentHelp.stringBundle["_configuration"] = {
              "properties": {}
          };
          for (var i = 0; i < configureNodes.length; ++i) {
              var configureNode = configureNodes.item(i);
              var children = configureNode.childNodes;
              for (var j = 0; j < children.length; j++) {
                  var item = children.item(j);
                  var tagName = item.tagName;
                  switch (tagName) {
                  case "localeReplacement":
                      var lid = item.getAttribute("id");
                      loadContentHelp.stringBundle["_configuration"]["properties"][lid] = item.textContent;
                      break;
                  }
              }
          }

          var replacementsNode = doc.documentElement.getElementsByTagName("replacements")[0];
          if (replacementsNode) {
            var replacementNodes = replacementsNode.getElementsByTagName("replacement");
            loadContentHelp.stringBundle["_replacement"] = {
                "properties": {}
            };
            for (var i = 0; i < replacementNodes.length; ++i) {
              var replacementNode = replacementNodes.item(i);
              var keyNodes = replacementNode.getElementsByTagName("key");
              var valueNodes = replacementNode.getElementsByTagName("value");

              for (var j = 0; j < keyNodes.length; j++) {
                  var key = keyNodes[j].textContent;
                  var value = valueNodes[j].textContent
                  loadContentHelp.stringBundle["_replacement"]["properties"][key] = value;
              }
            }
          }
        }
      }
    },
    getLocalNameConfigure: function(defaultValue, propertyId)
    {
      loadContentHelp.loadLocale();
      if ( !propertyId || !loadContentHelp.stringBundle)
        return defaultValue;

      var tmp = null;
      if (loadContentHelp.stringBundle["_configuration"])
        try {
          if (typeof loadContentHelp.stringBundle["_configuration"]["properties"][propertyId] != "undefined")
            tmp = loadContentHelp.stringBundle["_configuration"]["properties"][propertyId];
        } catch (e) {}

      if (loadContentHelp.stringBundle["_replacement"])
        try {
          if (typeof loadContentHelp.stringBundle["_replacement"]["properties"][propertyId] != "undefined")
            tmp = loadContentHelp.stringBundle["_replacement"]["properties"][propertyId];
        } catch (e) {}

      if(tmp == null)
        return defaultValue;
      else
        return tmp;
    },
    loadMenuFromUrl: function (parent, properties,cb,menu) {
      if (!properties.menuUrl) return;
      var url = properties.menuUrl;

      var _alx_data = {
        url:      url,
        bid:      menu.id,
        action:   "createMenu",
        menuid:   "dropdown",
        last_selection: menu.last_selection,
        needSendBack: true,
      };

      var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_CACHE_REQUEST", _alx_data);
      chrome.extension.sendRequest( _alx_data_payload, function(callbackObj) {
        if (callbackObj.status >= 400)
        {
          //if (menu.menu_button.search)
           // menu.menu_button.element.style.display = "none";
          //else if (menu.is_child)
          menu.element.style.display = "none";
          return
        }
        if(typeof cb === 'function')
          cb(callbackObj.returnData)
      });
    },
    loadMenu: function (parent, properties, menuItems, isforce, menu) {
      if(menuItems === null) return;
      isforce = isforce ? true : false;
      for (var i = 0; i < menuItems.length; i++)
      {
        var menuItemProperties = menuItems[i];
        if (typeof menuItemProperties.type == "undefined")
        {
          menuItemProperties.type = "url";
          if (typeof menuItemProperties.openIn == "undefined")
            menuItemProperties.openIn = "currentTab";
        }
      }

      var _alx_data = {
        bid:      menu.id,
        menuid:   "dropdown",
        last_selection: 0,
        itemList: menuItems,
        isforce: isforce
      };

      var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_CREATE_MENU_FROM_ITEM_LIST", _alx_data);
      chrome.extension.sendRequest( _alx_data_payload, function() {});
    }
  };

  var Element = A$.inherit(function(){},{
    type       : null,
    id         : null,
    xml        : null,
    element    : null,
    properties : null,
    events     : null,
    elements   : null,
    children   : null,
    is_child   : null,
    trace_debug: true,
    init: function(type,id) {
      this.type     = type || 'Base';
      this.id       = id   || 'none';
      this.elements = {};
      this.debug("Created a new element: \ntype: " + this.type + "\nid: " + this.id);
    },
    create: function(type,name,id) {
      var el = document.createElement(type);
      this.elements[name] = el;
      if(id === undefined || typeof id === 'string') {
        el.setAttribute('id',this.get_id(name,id));
      }
      el.className = this.get_class(name);
      return el;
    },
    get_id: function(name,id) {
      id = id || this.id
      return this.type + '-' + name + '-' + id;
    },
    get_class: function(name) {
      return this.type + '-' + name;
    },
    debug: function(str) {
      if(this.trace_debug) {
        trace(str);
      }
    },
    new_tab: function(url, openIn) {
      openIn = openIn ? openIn : "currentTab";
      this.navigate(url, openIn);
    },
    navigate: function(url,open_in,windowFeatures,args,event) {
      if(url !== null) {
        return ALX_NS_PH_TB_RENDER.internalLoadURL(url,open_in,windowFeatures,args,event);
      }
      return null;
    },
    make_request: function(url,cb, isforce) {
      var self = this;
      if(isforce)
        isforce = true;
      else
        isforce = false;

      var _alx_data = {
        url:      url,
        needSendBack: true,
        needResponseText: true,
        isforce: isforce
      };

      var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_CACHE_REQUEST", _alx_data);
      chrome.extension.sendRequest( _alx_data_payload, function(callbackObj) {
        var dp  = new DOMParser();
        var xml = null;
        if (callbackObj.isXml)
          xml = dp.parseFromString(callbackObj.responseText, "application/xml");

        if(typeof cb === 'function') {
          cb.call(self,xml,callbackObj.responseText,callbackObj);
        } else if (callbackObj.status == 200 && typeof cb.on_success === 'function') {
          cb.on_success.call(self,xml,callbackObj.responseText,callbackObj);
          if(xml) {
            self.debug("Response XML: \n" + xml);
          }else if(callbackObj.responseText) {
            self.debug("Response Text: \n" + callbackObj.responseText);
          }
        }else if(callbackObj.status !== 200 && typeof cb.on_error === 'function') {
          cb.on_error.call(self,xml,callbackObj.responseText,callbackObj);
        }
      });
    },
    fetch_image: function(node, src){
      if (ALX_NS_PH_TB_RENDER.data && ALX_NS_PH_TB_RENDER.data.url && ALX_NS_PH_TB_RENDER.data.url.indexOf("http://") == 0 )
      {
        node.src = src;
        return;
      }
      ALX_NS_PH_TB_Helper.fetch_image(node, src);
    },
    get_property: function(property, defaultValue) {
      if(this.properties[property]) {
        return this.replace_placeholders(this.properties[property], get_data());
      } else if (this.default_properties && this.default_properties[property]){
        return this.replace_placeholders(this.default_properties[property], get_data());
      } else if(typeof defaultValue != "undefined")
        return defaultValue;
      else
        return null;
    },
    set_property: function(property, newValue) {
      this.properties[property] = newValue;
    },
    replace_placeholders: function(str,data) {
      return subst_tokens(str,data);
    },
    replace_url_placeholder: function(url,value) {
      try {
        url = url.replace(/__TERM__PLACEHOLDER__/g, value);
      }catch(e) {
        this.debug('replace_term_placeholder failure: ' + e);
      }

      return url;
    },
    set_attributes: function(element,attributes) {
      A$.foreach(attributes,function(attr,value) {
        element.setAttribute(attr,value);
      });
    }
  });

  var Toolbar = A$.inherit(Element,{
    buttons          : null,
    xml              : null,
    toolbar          : null,
    listeners        : [],
    uclisteners      : [],
    listeners_neterr : [],
    sandbox          : null,
    message_listener : null,
    pref_branch      : null,
    current_locale   : 'default',
    css_url          : null,
    locale_properties: null,
    win_proxy        : {},
    xml_aliases: {
      catalog      : 'menu_button',
      logo         : 'menu_button',
      url          : 'menu_button',
      siteRank     : 'text',
      relatedLinks : 'menu_button'
    },
    init: function() {
      this.buttons = {};
      this._super('toolbar','toolbar');
      this.load_locale();
      //this.load_css();
    },
    load_css: function() {
      var pi = document.createProcessingInstruction('xml-stylesheet','href="' + this.css_url + '" type="text/css"');
      document.insertBefore(pi,document.firstChild);
    },
    load_locale: function() {
      loadContentHelp.loadLocale();
      this.locale_properties = loadContentHelp.stringBundle;
    },
    merge_locale: function() {

    },
    draw_one_button: function(id) {
      var button = this.buttons[id];
      if (!button)
        return;

      var containers = {
        left        : document.getElementById("toolbar-ALX_NS_PH_TB_left_container-toolbar"),
        center      : document.getElementById("toolbar-ALX_NS_PH_TB_center_container-toolbar"),
        right       : document.getElementById("toolbar-ALX_NS_PH_TB_right_container-toolbar")
      };

      if(typeof button.draw === 'function') {
        button.draw();
        if(containers[button.properties.orientation] && button.element) {
         containers[button.properties.orientation].appendChild(button.element);
        }
        if(typeof button.on_draw === 'function') {
          button.on_draw();
        }
      }
    },
    add_button: function(button_xml)
    {
      var types = this.build_buttons(button_xml);
      var self  = this;
      A$.foreach(types, function(id,obj) {
        self.draw_one_button(id);
      });
    },
    build_buttons: function(button_xml) {
      this.xml = button_xml;
      var types = this.parse_button_xml(button_xml),
          self = this;
      A$.foreach(types, function(id,obj) {
        var lower_type = obj.type.toLowerCase(),
          visible = self.locale_properties[id] === undefined ? true : self.locale_properties[id].visible;
        if(typeof Buttons[lower_type] === 'function' && visible) {
          self.buttons[id] = new Buttons[lower_type](id);
          if (self.buttons[id] && obj.ori_type)
            self.buttons[id]["ori_type"] = obj.ori_type;
          self.buttons[id].toolbar = self;
          self.buttons[id].parse_xml(obj.xml);
        }
      });
      return types;
    },
    parse_button_xml: function(xml) {
      var buttons = xml.documentElement.getElementsByTagName("button"),
          self    = this;
      if(buttons) {
        return A$.foreach(buttons,function(index,button) {
          if (typeof button != "object" || !button.getElementsByTagName)
            return null;

          var type = button.getElementsByTagName('type'),
              ori_type = null,
              id   = button.getAttribute('id');
          if (!id)
          {
            var ids  = button.getElementsByTagName('id');
            if (ids && ids[0])
              id = ids[0].textContent;
          }
          if(id && type && type[0]) {
            ori_type = type[0].textContent.toLowerCase();
            if(self.xml_aliases[type[0].textContent]) {
              type = self.xml_aliases[type[0].textContent];
            }else {
              type = type[0].textContent;
            }
            return [id,{
              'type': type,
              'ori_type': ori_type,
              'xml' : button
            }];
          }
        });
      }
      return null;
    },
    draw_buttons: function() {
      var Toolbar = document.getElementById("ALX_NS_PH_TB-Toolbar-container"),
        containers = {
          left  : this.create('toolbaritem','ALX_NS_PH_TB_left_container'),
          left2center : this.create('toolbarspring', 'ALX_NS_PH_TB_lefttocenter_spring'),
          center: this.create('toolbaritem','ALX_NS_PH_TB_center_container'),
          center2right: this.create('toolbarspring', 'ALX_NS_PH_TB_centertoright_spring'),
          right : this.create('toolbaritem','ALX_NS_PH_TB_right_container')
        };
      while(Toolbar.firstChild) {
        Toolbar.removeChild(Toolbar.firstChild);
      };
      A$.foreach(containers,function(orientation,el) {
        Toolbar.appendChild(el);
      });

      A$.foreach(this.buttons,function(id,button) {
        if(typeof button.draw === 'function') {
            button.draw();
            if(containers[button.properties.orientation]) {
             containers[button.properties.orientation].appendChild(button.element);
            }
            if(typeof button.on_draw === 'function') {
              button.on_draw();
            }
        }
      });
    },
    add_url_change_listener: function(callback) {
      this.uclisteners.push(callback);
    },
    add_page_turn_listener: function(callback) {
      this.listeners.push(callback);
    },
    add_network_error_listener: function(callback) {
      this.listeners_neterr.push(callback);
    },
    update_url_change_listeners: function( inUrl ) {
      var sandbox         = Components.utils.Sandbox("about:blank");
      sandbox.uclisteners = this.uclisteners;
      sandbox.inUrl       = inUrl;
      sandbox.trace       = trace;
      Components.utils.evalInSandbox("for (var i = 0; i < uclisteners.length; i++) {  try { uclisteners[i](inUrl); } catch(ex) {}  }", sandbox);
    },
    update_page_turn_listeners: function (data) {
      var sandbox       = Components.utils.Sandbox("about:blank");
      sandbox.listeners = this.listeners;
      sandbox.data      = data;
      sandbox.trace     = trace;
      Components.utils.evalInSandbox("for (var i = 0; i < listeners.length; i++) {  try { listeners[i](data); } catch(ex) {}  }", sandbox);
    },
    update_network_error_listerners: function() {
      var listeners = this.listeners_neterr;
      for(var i = 0; i < listeners.length; ++i)
      {
        var listener = listeners[i];
        try {
          listener();
        } catch(ex) {}
      }
    }
  });

  var Button = A$.inherit(Element,{
    toolbar         : null,
    xml_aliases     : null,
    event_attribute : 'eventtype',
    event_listeners : null,
    button_showing_listners: null,
    custom_events   : null,
    parseRssItemsFunc: null,
    xml_aliases_base: {
      tooltip    : 'tooltipbody',
      title      : 'tooltiptitle',
      description: 'tooltipbody',
      image      : 'backgroundimage'
    },
    xml_defaults_base: {
      orientation: 'left'
    },
    changeable_properties: {
      tooltiptitle    : 'on_tooltip_change',
      tooltipbody     : 'on_tooltip_change',
      backgroundimage : 'on_backgroundimage_change'
    },
    add_button_showing_listener: function(callback)
    {
      this.button_showing_listners.push(callback);
    },
    update_button_showing_listeners: function()
    {
      var button_showing_listners = this.button_showing_listners;
      if (button_showing_listners)
      {
        for(var i = 0; i < button_showing_listners.length; ++i)
        {
          var button_showing_listner = button_showing_listners[i];
          try {
            button_showing_listner();
          } catch(ex) {}
        }
      }
    },
    init: function(type,id) {
      this._super(type,id);
      this.set_up_aliases();
      this.event_listeners = {};
      this.custom_listeners = {};
      this.button_showing_listners = [];
      if(this.children !== null) {
        var self = this;
        A$.foreach(this.children,function(i,type) {
          self[type] = new Buttons[type](id);
          self[type].is_child = true;
          self[type][self.type] = self;
        });
      }
      this.debug("Created a new button: \ntype: " + this.type + "\nid: " + this.id);
    },
    on_tooltip_change: function(property,old_val,new_val) {
      this.debug('Tooltip Change(' + this.id + ':' + this.type + '): ' + property + ', To: ' + new_val);
      if(property === 'tooltiptitle') {
        this.set_tooltip_title(new_val);
      }else if(property === 'tooltipbody') {
        this.set_tooltip_body(new_val);
      }
    },
    set_tooltip_body: function(text) {
      if (this.elements['tt_body'])
        this.elements['tt_body'].textContent = text;
      this.element.setAttribute("title", text);
    },
    set_tooltip_title: function(text) {
      if (this.elements['tt_title'])
        this.elements['tt_title'].textContent = text;
    },
    on_backgroundimage_change: function(property,old_val,new_val) {
      this.debug('Background Image Change: ' + new_val);
      if (this.image)
        this.fetch_image(this.image.elements.image, new_val);
      if (this.menu_button && this.menu_button.image)
        this.fetch_image(this.menu_button.image.elements.image, new_val);
    },
    redraw_button: function() {
      while(this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
      }
      this.button_showing_listners = [];
      this.draw();
      this.on_draw();
    },
    on_draw: function() {
      this.debug('drawing: ' + this.id);
      this.attach_events();
      if(!this.is_child && ( this.properties.javascript || this.properties.embeddedscripturl) ) {
        this.eval_in_sandbox();
      }
      this.update_button_showing_listeners();
    },
    draw: function() {
      this.add_tooltip();
    },
    add_tooltip: function(prefix) {
      prefix = prefix || '';
      if(typeof this.properties[prefix + 'tooltiptitle'] !== 'undefined' || typeof this.properties[prefix + 'tooltipbody'] !== 'undefined' && ! this.is_child) {
        var tooltip  = this.create('tooltip','tooltip'),
            tt_id    = tooltip.getAttribute('id'),
            tt_title = this.create('label','tt_title'),
            tt_body  = this.create('label','tt_body');

        tooltip.style.display = "none";
        this.element.setAttribute("title", this.properties[prefix + 'tooltipbody']);
        tooltip.className  += ' tooltip';
        tt_title.className += ' tt_title';
        tt_body.className  += ' tt_body';

        if(typeof this.properties[prefix + 'tooltiptitle'] !== 'undefined') {
          tt_title.textContent = this.properties[prefix + 'tooltiptitle'];
          tooltip.appendChild(tt_title);
        }
        if(typeof this.properties[prefix + 'tooltipbody'] !== 'undefined') {
          tt_body.textContent = this.properties[prefix + 'tooltipbody'];
          tooltip.appendChild(tt_body);
        }
        this.element.appendChild(tooltip);
        this.element.setAttribute('tooltip',tt_id);
      }
    },
    create_container: function(attributes) {
      if(this.element === null) {
        this.element = this.create('hbox','container');
        if(attributes) {
          var self = this;
          A$.foreach(attributes,function(name,value) {
              self.element.setAttribute(name,value);
          });
        }
        if (typeof toolbar_global["buttonBackgroundColor"] === "string" && toolbar_global["buttonBackgroundColor"].length >= 6)
        {
          var bColor = toolbar_global["buttonBackgroundColor"];
          if (bColor[0] == "#")
            bColor = bColor.substring(1);
          if (bColor.length == 6 || bColor.length == 8)
          {
            bColor = bColor.toUpperCase();
            if (bColor.length == 6)
              bColor = bColor + "FF";

            var r = parseInt( bColor.substring(0, 2), 16 );
            var g = parseInt( bColor.substring(2, 4), 16 );
            var b = parseInt( bColor.substring(4, 6), 16 );
            var a = parseInt( bColor.substring(6, 8), 16 ) / 255;

            this.element.style.backgroundColor = "rgba(" + r + " ," + g + " ," + b + " ," + a + " )";
          }
        }
      }
      return this.element;
    },
    attach_to_container: function(new_el) {
      if(this.element !== null) {
        this.element.appendChild(new_el);
        this.add_tooltip();
      }
    },
    create_menu: function(url) {
      var menu_container = this.create('hbox' ,'menu_container'),
          menu_image     = this.create('image','menu_image');
      menu_image.setAttribute("src", chrome.extension.getURL("/images/arrowdown.png"));
      //var boxheight = parseInt(getComputedStyle(menu_container).getPropertyValue("height").split("px")[0]);
      menu_container.setAttribute('align','center');
      menu_container.setAttribute(this.event_attribute,'menu');
      this.create_menu_popup(menu_container);
      menu_container.appendChild(menu_image);
      return menu_container;
    },
    create_menu_popup: function(el) {
      var self = this;
      loadContentHelp.loadMenuFromUrl(el,{menuUrl: this.properties.menuurl},function() {
        var menu = el.getElementsByTagName('menupopup');
        if(menu && menu[0]) {
          self.menu_popup = menu[0];
          self.menu_popup.setAttribute('id',self.get_id('menu_popup'));
        }
      });
    },
    parse_menu_xml: function() {
      this.make_request(this.properties.menuurl, function(xml) {
        if(xml) {
          var items_container = xml.getElementsByTagName('menuItems'),
              items;
          if(items_container && items_container[0]) {
            items = items_container[0].getElementsByTagName('menuItem');
            A$.foreach(items, function(k,item) {
              var tmp = {};
              A$.foreach(item.childNodes,function(l,node) {
                if(node.tagName && node.textContent) {
                  tmp[node.tagName] = node.textContent;
                  this.debug(node.tagName + ': ' + node.textContent);
                }
              });
              return tmp;
            });
          }
        }
      });
    },
    add_custom_listener: function(type,listener,capture) {
      capture = capture || false;
      this.custom_listeners[type] = listener;
    },
    attach_events: function() {
      var self = this;
      if(typeof this.events !== 'undefined') {
        A$.foreach(this.events, function(i,ev) {
          if(typeof self.event_dispatch === 'function') {
            self.debug('attaching ' + ev + ' to ' + self.id);
            self.event_listeners[ev] = function(e) {
              self.event_dispatch(e);
            }
            self.element.addEventListener(ev,self.event_listeners[ev],false);
          }
        });
      }
    },
    event_dispatch: function(e) {
      var type = this.get_event_attribute(e);
      this.debug('event_dispatch: ' + type + ': ' + e.type);
      if(typeof this.custom_listeners[e.type] === 'function') {
        this.custom_listeners[e.type](e);
      }else if(type !== false && this[type] && typeof this[type][e.type] === 'function') {
        this[type][e.type](e);
      }else if((type === false || type === this.type) && typeof this[e.type] === 'function'){
        this[e.type](e);
      }
    },
    get_event_attribute: function(e) {
      if(e.target) {
        var self = this,
            max = 6,
            start = 0,
            get_attr = function(el) {
              start++;
              if(el && el.getAttribute && start < max) {
                  var att = el.getAttribute(self.event_attribute);
                  if(att) {
                      return att;
                  }else {
                      return get_attr(el.parentNode);
                  }
              }else {
                  return false;
              }
            };
        return get_attr(e.target);
      }
      return false;
    },
    empty_popup: function(popup) {
        if(popup) {
            while(popup.firstChild) {
                popup.removeChild(popup.firstChild);
            }
        }
    },
    set_up_aliases: function() {
      var self = this;
      if(this.xml_aliases === null) {
        this.xml_aliases = {};
      }
      A$.foreach(this.xml_aliases_base,function(k,v) {
        self.xml_aliases[k] = v;
        self.xml_aliases[self.type + k] = self.type+ v;
      });
    },
    parse_xml: function(xml) {
      this.debug('parsexml for ' + this.id);
      var self = this,
          raw_tag_name,
          orig_tag_name,
          tag_name,
          value;
      this.properties = {
          id: this.id
      };
      this.properties_bak = {
          id: this.id
      };
      if(xml) {
        A$.foreach(xml.childNodes,function(i,node) {
          if(node && node.tagName) {
            raw_tag_name  = node.tagName
            tag_name      = raw_tag_name.toLowerCase();
            orig_tag_name = tag_name;
            value         = node.textContent,
            value         = trim(value);
            id            = node.getAttribute('id');
            if(self.xml_aliases[tag_name]) {
              tag_name = self.xml_aliases[tag_name];
            }
            self.properties[tag_name] = value;
            if(id && self.toolbar.locale_properties[self.id] && self.toolbar.locale_properties[self.id].properties[id]) {
              self.properties[tag_name] = self.toolbar.locale_properties[self.id].properties[id];
            }
            self.properties_bak[tag_name] = self.properties[tag_name];
            self.watch_property(tag_name);
            if(tag_name !== raw_tag_name) {
              self.watch_property(raw_tag_name);
            }
            if(tag_name !== orig_tag_name) {
              self.watch_property(orig_tag_name);
            }
          }
        });
        this.parse_defaults();
        this.normalize_properties();
      }
      this.on_properties_set();
    },
    watch_property: function(name) {
        var self = this;
        this.properties.watch(name,function(a,b,c) {
            self.on_property_change(a,b,c);
            return c;
        });
    },
    on_properties_set: function() {},
    normalize_properties: function(properties) {
      properties = properties || this.properties;
      if(this.children !== null) {
        var self = this;
        A$.foreach(this.children,function(i,type) {
          //self[type].properties = A$.clone_obj(properties);
          self[type].properties = properties;
          self[type].toolbar = self.toolbar;
          if (self.default_properties)
            self[type].default_properties = self.default_properties;
          //self[type].properties = {};
          if(self[type].children !== null) {
              self[type].normalize_properties(properties);
          }
          //this is used for setting up child classes with stripped down properties
          //A$.foreach(properties,function(prop,value) {
              //if(prop.indexOf(type) === 0) {
                  //self[type].properties[prop.substr(type.length)] = value;
              //}
          //});
          self[type].on_properties_set();
        });
      }
    },
    on_property_change: function(property,old_val,new_val) {
      var orig_property = property;
      property = property.toLowerCase();
      var orig_property_copy = property;
      if(this.element !== null) {
        property = this.xml_aliases_base[property] === undefined ? property : this.xml_aliases_base[property];
        this.debug('on_property_change: ' + property + ' (From: ' + old_val + ', To: ' + new_val + ')');
        if(typeof this.changeable_properties[property] !== 'undefined') {
          new_val = this.replace_placeholders(new_val,get_data());
          if (property != orig_property_copy)
            this.properties[property] =  new_val;
          //if(typeof this[this.changeable_properties[property]] === 'function' && property === orig_property && old_val !== new_val) {
          if(typeof this[this.changeable_properties[property]] === 'function' && property == orig_property_copy) {
              this[this.changeable_properties[property]](property,old_val,new_val);
          }
        }
      }
    },
    parse_defaults: function() {
      var self = this;
      this.xml_defaults = A$.merge(this.xml_defaults_base,this.xml_defaults);
      A$.foreach(this.xml_defaults,function(property,default_value) {
        if(typeof self.properties[property] === 'undefined') {
          self.properties[property] = default_value;
          self.watch_property(property);
          if(self.xml_aliases[property]) {
            self.properties[self.xml_aliases[property]] = default_value;
            self.watch_property(self.xml_aliases[property]);
          }
        }
      });
    },
    set_headline: function() {
      var headline,
          i,
          random,
          randoms = {},
          num_headlines = this.get_property('numheadlines'),
          randomize = this.get_property('randomize');
      for(i = 0; i < num_headlines;i++) {
        headline = this.elements['headline_' + i];
        random = i;
        if(randomize && randomize === 'true') {
          do {
              random = A$.get_random(this.current_feed.length - 1);
          }while(randoms[random] !== undefined);
          randoms[random] = random;
        }
        if (random < this.current_feed.length)
        {
          this['text_' + i].set_text(this.current_feed[random].title);
          this['text_' + i].set_text_attributes({
            align  : "center",
            value  : this.current_feed[random].title,
            gotourl: this.current_feed[random].url
          });
          this['text_' + i].set_tooltip(this.current_feed[random].title);
          this['text_' + i].element.setAttribute("title", this.current_feed[random].title);
          //this['text_' + i].setAttribute("title", this.current_feed[random].title);
        }
      }
    },
    create_headline: function() {
      var headline_container,
          headline,
          text,
          i,
          self = this,
          num_headlines = this.get_property('numheadlines'),
          randomize = this.get_property('randomize'),
          max_width = this.get_property('maxheadlinewidth'),
          min_width = this.get_property('minheadlinewidth');
      for(i = 0;i < num_headlines;i++) {
        this['text_' + i] = new Buttons.text(this.id + '_' + i);
        text = this['text_' + i];
        text.is_child = true;
        text.properties = this.properties;
        text.properties['text_' + i + 'tooltipbody'] = 'Default';
        text[this.type] = this;
        text.draw();
        text.is_child = false;
        text.add_tooltip('text_' + i);
        text.is_child = true;

        if (max_width)
          text.elements.text.style.maxWidth = max_width + "px";
        //if (min_width)
        //  text.elements.text.style.minWidth = min_width + "px";
        text.set_text_attributes({
          maxwidth: max_width,
          minwidth: min_width,
          crop    : 'end'
        });
        text.elements.text.setAttribute(this.event_attribute,'text_' + i);
        text.set_container_attributes({
          maxwidth: max_width,
          minwidth: min_width,
        });

        if(i !== 0) {
          this.elements.headline.appendChild(this.create_dot_separator());
        }
        this.elements.headline.appendChild(text.element);
      }
    },
    create_dot_separator: function() {
      var dot_separator = this.create('image','dot_separator');
      dot_separator.setAttribute('src','/images/middot.png');
      return dot_separator;
    },
    get_rss: function(isforce) {
      var self = this,
          items,
          feed_url = this.get_property('feedurl');
      isforce = isforce ? true : false;
      if(feed_url !== null) {
        this.make_request(feed_url,function(xml,text) {
          items = xml ? self.parse_rss(xml) : [];
          self.current_feed = A$.clone_array(items);
          if (self.parseRssItemsFunc)
            self.parseRssItemsFunc({itemList: items})
          self.addSepar();
          //if(self.get_property('refresh') === 'true') {
            items.unshift({
              title: self.get_property('refreshtext', 'Refresh'),
              type: 'rss_refresh'
            },{
              title: 'menu_break',
              type: 'menuBreak'
            });
          //}

          if (self.menu_button)
            self.menu_button.menu.set_menu_items(items,self.get_property('icons'), isforce);
          else if (self.menu)
            self.menu.set_menu_items(items,self.get_property('icons'), isforce);

          self.set_headline();
        }, isforce);
      }
    },
    parse_rss: function(rss) {
      var xml_items = rss.getElementsByTagName('item'),
          items = [],
          self = this,
          bAtom = false;
      if (xml_items.length == 0)
      {
        xml_items = rss.getElementsByTagName('entry')
        bAtom = true;
      }
      var max_num_item = 20;
      if(xml_items) {
          var item_itr = 0
          A$.foreach(xml_items,function(i,item) {
              var currentChildElement = item.firstElementChild;
              var currentItem = {};
              var add = false
              while(currentChildElement)
              {
                currentItem[currentChildElement.tagName] = trim(currentChildElement.textContent);
                if (bAtom && currentChildElement.tagName == "link")
                {
                  for(var i = 0; i < currentChildElement.attributes.length; ++i)
                  {
                    var attr = currentChildElement.attributes[i];
                    if (attr.name == "href") 
                      currentItem[currentChildElement.tagName] = trim(attr.value);
                  }
                }
                currentChildElement = currentChildElement.nextElementSibling;
                add = true;
              }
              if (add)
              {
                if (item_itr < max_num_item)
                  items.push(currentItem);
                item_itr++;
              }
          });
      }
      return items;
    },
    on_refresh: function() {
      trace('on_refresh');
      this.get_rss();
    },
    create_separator: function(id) {
      id = id || false;
      var separator = this.create('separator','separator',id);
      separator.setAttribute('orient','vertical');
      separator.className += ' thick-groove';
      return separator;
    },
    addSepar: function()
    {
      this.add_separator("left", true);
      this.add_separator("right", true);
    },
    add_separator: function(side, isforce) {
      isforce = isforce ? isforce : false;
      var separator_side = this.get_property("separator", null)
      if(( isforce || separator_side === 'both' || separator_side === side) && !this.is_child) {
        if (side == "left" && this.element.parentNode)
          if (this.element.previousElementSibling == null || this.element.previousElementSibling.tagName != "SEPARATOR")
            this.element.parentNode.insertBefore(this.create_separator(), this.element);
        if (side == "right"&& this.element.parentNode)
          if (this.element.nextElementSibling == null || this.element.nextElementSibling.tagName != "SEPARATOR")
            this.element.parentNode.insertBefore(this.create_separator(), this.element.nextElementSibling);
      }
    },
    create_spacer: function(id) {
      id = id || false;
      var spacer = this.create('spacer','spacer',id);
      spacer.setAttribute('flex',1);
      spacer.setAttribute('width','3px');
      return spacer;
    },
    eval_in_sandbox: function() {
      this.debug('Eval in sandbox for: ' + this.id);
      var sandbox = this.create_sandbox();
      try {
        var javascriptUrl = chrome.extension.getURL("/html/content/javascript_button.html");
        sandbox.setAttribute("src", javascriptUrl);
        this.elements.javascript = sandbox;
        this.element.appendChild(sandbox);
      } catch(e) {}
    },
    attach_sandbox: function(el_to_sandbox) {
      if(el_to_sandbox === undefined) {
        return;
      }
      try {
        var alexaObj = this.create_sandbox().Alexa;
        if (el_to_sandbox.contentWindow)
          el_to_sandbox.contentWindow.Alexa = alexaObj;
        else
        {
          el_to_sandbox.addEventListener("DOMContentLoaded", function(evt) {
            evt.originalTarget.defaultView.arguments = [alexaObj];
            var s = window.content.document.createElement("script")
            s.setAttribute('type', 'text/javascript');
            evt.originalTarget.body.insertBefore(s, evt.originalTarget.body.firstChild);
            s.text = "Alexa = window.arguments[0];"
          }, false);
        }
      } catch(e) {}
    },
    create_sandbox: function() {
      var iframe = this.create("iframe","javascript");
      return iframe;
    }
  });

  var Buttons = {
    button: A$.inherit(Button, {
      init: function(id) {
          this._super('button',id);
      }
    }),
    text: A$.inherit(Button,{
      events: ['click'],
      init: function(id) {
        this._super('text',id);
        this.changeable_properties['text'] = 'on_text_change';
      },
      draw: function() {
        this.create_container();
        var text = this.create('hbox','text');

        this.set_text(this.get_property('text'));
        this.set_text_attributes({align  : "center"})
        this.element.setAttribute(this.event_attribute,'text');
        this.attach_to_container(text);
      },
      set_text: function(text) {
        if (this.menu_button && !text)
          this.element.style.display = "none"
        else
          this.element.style.display = ""
        if (text)
          text = text.replace(/\r\n/gi , " ").replace(/\n/gi , " ");
        this.elements.text.innerText = text;
        this.set_text_attributes({
            value: text
        });
      },
      on_text_change: function(property,old_value,new_value) {
        this.set_text(new_value);
      },
      set_text_attributes: function(attributes) {
        this.set_attributes(this.elements.text,attributes);
      },
      set_container_attributes: function(attributes) {
        this.set_attributes(this.element,attributes);
      },
      set_tooltip: function(str) {
        this.on_tooltip_change('tooltipbody','',str);
      },
      click: function(e) {
        if (e.button == 0)
        {
          var url = e.target.getAttribute('gotourl');
          if (!url) url = this.get_property('url');
          if (this.menu_button && this.menu_button.javascript && this.menu_button.javascript.elements.javascript &&
              this.menu_button.javascript.elements.javascript.contentWindow.Alexa.events._leftClickListeners.length)
            this.menu_button.javascript.elements.javascript.contentWindow.ALX_NS_PH_TB_API.click(e);
          else if (this.properties.javascripturl && this.properties.trigger == "click" && this.properties.runat == "content")
          {
            var _alx_data = {
              javascripturl : this.properties.javascripturl
            };

            var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_INJECT_JS", _alx_data);
            chrome.extension.sendRequest( _alx_data_payload, function() {});
          }
          else if ( !url && this.menu_button && this.menu_button.menu )
              this.menu_button.menu.click(e)
          else if(url) {
              this.new_tab(url, this.get_property('openin', null));
          }else {
              this.new_tab(this.get_property('url'), this.get_property('openin', null));
          }
        }
      }
    }),
    image: A$.inherit(Button,{
      events: ['click','mouseover','mouseout'],
      init: function(id) {
        this._super('image',id);
      },
      draw: function() {
        this.create_container();
        var image    = this.create('image','image');

        this.fetch_image(image, this.get_property('backgroundimage'))
        this.element.setAttribute('align','center');
        this.element.setAttribute(this.event_attribute,'image');
        this.attach_to_container(image);
      },
      click: function(e) {
        if (e.button == 0)
        {
          var url = this.get_property('url');
          if (this.menu_button && this.menu_button.javascript && this.menu_button.javascript.elements.javascript &&
              this.menu_button.javascript.elements.javascript.contentWindow.Alexa.events._leftClickListeners.length)
            this.menu_button.javascript.elements.javascript.contentWindow.ALX_NS_PH_TB_API.click(e);
          else if (this.properties.javascripturl && this.properties.trigger == "click" && this.properties.runat == "content")
          {
            var _alx_data = {
              javascripturl : this.properties.javascripturl
            };

            var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_INJECT_JS", _alx_data);
            chrome.extension.sendRequest( _alx_data_payload, function() {});
          }
          else if ( (url == "about:blank" || !url) && this.menu_button && this.menu_button.menu )
            this.menu_button.menu.click(e)
          else if (this.properties.windowFeatures)
          {
            var args = null;
            var align = this.popup_align_element || this.element;
            var boundingbox = align.getBoundingClientRect();
            var event = {alignbox: boundingbox, bid: this.id, menuid: "transparent"}
            this.navigate(url, "newDialog", this.properties.windowFeatures, args, event);
          }
          else
            this.new_tab(this.get_property('url'), this.get_property('openin', null));
        }
      },
      mouseover: function(e) {
        var hover_image = this.get_property('hoverimage');
        if(hover_image) {
          this.fetch_image(this.elements.image, hover_image)
        }
      },
      mouseout: function(e) {
        var image = this.get_property('backgroundimage');
        if(image) {
          this.fetch_image(this.elements.image, image)
        }
      }
    }),
    javascript:  A$.inherit(Button,{
      children  : ['menu_button'],
      events: ['click'],
      init: function(id) {
        this._super('javascript',id);
      },
      draw: function() {
        this.create_container();
        var javascript_container = this.create('hbox','javascript_container');
        this.menu_button.menu.popup_align_element = this.element;
        this.menu_button.draw();
        this.menu_button.on_draw();
        this.menu_button.menu.element.style.display = "none";
        headline = this.create('hbox','headline'),
        javascript_container.appendChild(this.menu_button.element);
        javascript_container.appendChild(headline);
        this.attach_to_container(javascript_container);
        //this._super();
      },
      on_draw: function() {
        this._super();
        if (this.properties.runat && this.properties.runat == "content")
          this.addSepar();
        this.debug(this.properties.javascript);
      }
    }),
    search: A$.inherit(Button,{
      events  : ['click','keypress','keydown','input'],
      children: ['textbox','menu_button'],
      default_properties: {
        "backgroundimage": "__VERSION__TOOLBAR__ROOT__PLACEHOLDER__/search.png",
        "menuurl": "__VERSION__TOOLBAR__ROOT__PLACEHOLDER__/searches.xml"
      },
      init: function(id) {
        this._super('search',id);
        this.changeable_properties['text'] = 'on_text_change';
        this.textbox.search = this;
        //wiring up events
        this.image = this.menu_button.image;
        this.menu  = this.menu_button.menu;
        this.menu.has_image = true;
        if ("AMAZONNEW_NS_PH" != "ALX_NS_PH")
          this.menu.hide_image = true;
        var self = this;
        this.image.click = function(e) {
          self.do_search();
        };
        this.textbox.do_search = this.image.click;
      },
      on_text_change: function(property,old_val,new_val)
      {
        if(property === 'text')
          this.textbox.set_value(new_val);
        this.textbox.set_color();
      },
      parse_xml: function(xml) {
        this._super(xml);
        this.watch_property("text");
      },
      draw: function() {
        this.create_container();
        var search_container = this.create('hbox','search_container');
        this.textbox.draw();
        this.textbox.on_draw();
        this.menu.properties.radio = true;
        this.menu_button.draw();
        this.menu_button.menu.popup_align_element = this.menu_button.menu.element;
        search_container.appendChild(this.textbox.element);
        search_container.appendChild(this.menu_button.element);
        this.attach_to_container(search_container);
      },
      do_search: function() {
        var properties = this.menu_button.menu.get_last_selection_properties();
        if(this.textbox.get_value() !== '') {
          var url = this.properties.url;
          if (properties.url)
            url = properties.url;
          if (url)
            ALX_NS_PH_TB_RENDER.loadSearchURL(null,url,'currentTab',this.textbox.elements.textbox.id);
        }
      },
      on_menu_load: function() {
          this.set_menu_image();
      },
      set_tooltip_text: function(text) {
        this.set_tooltip_body(text);
      }
    }),
    textbox: A$.inherit(Button, {
      typeahead_align_element: false,
      has_typeahead          : true,
      current_typeahead      : -1,
      current_search         : '',
      typeahead_visible      : false,
      search                 : false,     //hold instance of search button if it exists
      default_text_color     : '#999999',
      search_text_color      : 'black',
      typeahead_results      : null,
      typeahead_timeout      : 300,
      typeahead_timeout_func : null,
      typeahead_is_timeout   : false,
      typeahead_align        : 'after_start',
      typeahead_no_results   : 'No Results',
      suggestion_header      : 'Search Suggestions',
      xml_aliases: {
          defaulttext: 'defaulttext',
          typeahead  : 'typeahead'
      },
      init: function(id) {
        this._super('textbox',id);
      },
      on_properties_set: function() {
        if(this.properties.typeahead === 'true') {
          this.has_typeahead = true;
        }
      },
      defaultFont: function(e) {
        var textbox = this.elements.textbox;
        if(textbox.value == '')
          textbox.style.fontStyle= "italic";
        else
          textbox.style.fontStyle= "";
      },
      draw: function() {
        this.create_container();
        var textbox  = this.create('input','textbox');
        this.element.setAttribute(this.event_attribute,'textbox');
        textbox.setAttribute('placeholder',this.get_property('defaulttext', 'Searching...'));
        textbox.setAttribute('emptytext',this.get_property('defaulttext', 'Searching...'));
        textbox.clickSelectsAll = true;
        var width = parseInt(this.get_property('width', "260"));
        if (width <= 200)
          width = 200;
        textbox.style.width = width + "px";
        this.attach_to_container(textbox);
        if(this.has_typeahead) {
          var popupset = document.getElementById("ALX_NS_PH_TB-Toolbar-popupset");
          if (popupset) popupset.appendChild(this.build_typeahead());
        }
      },
      set_default_text: function(str) {
        var textbox = this.elements['textbox'];
        textbox.setAttribute('placeholder',str);
        textbox.setAttribute('emptytext',str);
        if(textbox.value === '') {
          textbox.value = '';
        }else {
          this.do_search();
        }
      },
      set_value: function(str) {
        this.elements.textbox.value = str;
        this.defaultFont();
      },
      get_value: function() {
        return this.elements.textbox.value;
      },
      build_typeahead: function() {
        var search_menupopup = this.create('menupopup','search_menupopup')
            self = this;

        search_menupopup.setAttribute("noautofocus"   , "true");
        search_menupopup.setAttribute("noinitialfocus", "true");
        search_menupopup.setAttribute("ignorekeys"    , "true");
        search_menupopup.setAttribute("allowevents"   , "true");
        search_menupopup.addEventListener('click', function(e) {
          self.typeahead_click(e);
        },false);
        search_menupopup.addEventListener('popuphidden', function(e) {
          self.on_typeahead_hide(e);
        },false);
        return search_menupopup;
      },
      set_color: function() {
        /*if(this.get_value() !== '') {
          this.elements.textbox.style.color = this.search_text_color;
        }else {
          this.elements.textbox.style.color = this.default_text_color;
        }*/
      },
      input: function(e) {
        var value = this.get_value();
        this.defaultFont();
        this.set_consistent_value(value);
        this.set_color();
        if(trim(this.get_value()) !== '') {
          this.do_typeahead();
        }else {
          this.hide_typeahead();
        }
      },
      set_consistent_value: function(value)
      {
        var _alx_data = {
          value : value,
          id: this.id
        };

        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_SET_SEARCHBOX_TEXT", _alx_data);
        chrome.extension.sendRequest( _alx_data_payload, function() {});
      },
      keydown: function(e) {
        if(e.keyCode === ALX_NS_PH_TB_Helper.KeyEvent.DOM_VK_UP || ALX_NS_PH_TB_Helper.KeyEvent.keyCode === e.keyCode) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      keypress: function(e) {
        switch(e.keyCode) {
          case ALX_NS_PH_TB_Helper.KeyEvent.DOM_VK_RETURN:    //enter
            if(this.typeahead_timeout_func !== null) {
                clearTimeout(this.typeahead_timeout_func);
                this.typeahead_timeout_func = null;
            }
            this.typeahead_selected(e,false);
            break;
          case ALX_NS_PH_TB_Helper.KeyEvent.DOM_VK_LEFT:    //left
            break;
          case ALX_NS_PH_TB_Helper.KeyEvent.DOM_VK_UP:    //up
            this.set_active_typeahead('-');
            break;
          case ALX_NS_PH_TB_Helper.KeyEvent.DOM_VK_RIGHT:    //right
            break;
          case ALX_NS_PH_TB_Helper.KeyEvent.DOM_VK_DOWN:    //down
            this.set_active_typeahead('+');
            break;
          default:
            break;
        }
      },
      show_typeahead: function() {
        if(this.has_typeahead) {
          if(this.get_value() !== '') {
            var properties = this.search.menu_button.menu.get_last_selection_properties();
            if(properties.suggestionUrl) {
              this.typeahead_visible = true;
              this.build_typeahead_items(properties);
            }
          }else {
            this.hide_typeahead();
          }
        }
      },
      build_typeahead_items: function(properties) {
        if(properties.suggestionUrl) {
          var url = this.replace_placeholders(properties.suggestionUrl);
          var searchterm = this.get_value();
          url     = this.replace_url_placeholder(url,this.get_value());
          var self = this;
          this.make_request(url,{
            on_success: function(xml,text, callbackObj) {
              if (searchterm == self.get_value())
              {
                trace(this.type + ': ' + this.id);
                if(xml && callbackObj.isXml) {
                  this.draw_typeahead(this.parse_typeahead_xml(xml), searchterm);
                }else if(text){
                  this.draw_typeahead(this.parse_typeahead_json(text), searchterm);
                }
                if(typeof self.on_typeahead_load === 'function') {
                  self.on_typeahead_load();
                }
              }
            },
            on_error: function(xml) {

            }
          });
        }
      },
      parse_typeahead_xml: function(xml) {
        trace('parseing typeahead xml');
        var obj        = xml.getElementsByTagName('Item'),
            items      = null,
            self       = this,
            properties = this.search.menu_button.menu.get_last_selection_properties();
        if(obj && obj.length > 0) {
          items = [];
          items = A$.foreach(obj,function(k,v) {
            if ( v.childNodes )
            {
              var item = A$.foreach(v.childNodes,function(i,node) {
                if ( node.attributes )
                {
                  var attr;
                  if(node.attributes && node.attributes.length > 0) {
                    attr = A$.foreach(node.attributes,function(j,attribute) {
                      if (attribute.nodeName)
                      {
                        return [
                          attribute.nodeName.toLowerCase(),
                          attribute.nodeValue
                        ];
                      }
                    });
                  }
                  return [
                    node.nodeName.toLowerCase(),
                    {
                      content   : node.textContent,
                      attributes: attr
                    }
                  ];
                }
              });
              if( !item.url ) {
                item.url = {};
              }
              if( !item.url.content ) {
                item.url.content = self.replace_url_placeholder(properties.url,item.text.content);
              }
              return [k,item];
            }
          });
        }
        return items;
      },
      parse_typeahead_json: function(json) {
        trace('parsing typeahead json');
        var obj        = JSON.parse(json),
            self       = this,
            items      = null,
            properties = this.search.menu_button.menu.get_last_selection_properties();
        if(obj && obj[0] && obj[1] && properties) {
          items = A$.foreach(obj[1],function(k,v) {
            var item = {
                text        : {content: v},
                description : {content: (obj[2] && obj[2][k]) ? obj[2][k] : null},
                url         : {content: (obj[3] && obj[3][k]) ? obj[3][k] : null},
                image       : {content: null}
            };
            if(item.url.content === null) {
              item.url.content = self.replace_url_placeholder(properties.url,v);
            }
            return item;
          });
        }
        return items;
      },
      draw_typeahead: function(items, searchterm) {
        this.typeahead_results = items;
        var properties        = this.search.menu_button.menu.get_last_selection_properties(),
            popup             = this.elements.search_menupopup,
            suggestion_header = properties.suggestionHeader || this.suggestion_header;
        this.empty_popup(popup);

        var align = this.popup_align_element || this.element;
        var boundingbox = align.getBoundingClientRect();
        var suggestion_text = {header: suggestion_header, empty: this.typeahead_no_results, footer: null, searchterm: searchterm};

        var _alx_data = {
            bid:      this.id,
            menuid:   "searchsuggestion",
            searchterm: searchterm,
            align:    "after_start",
            alignbox: boundingbox,
            suggestions: suggestion_text,
            items: items
          };

        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_CREATE_SEARCH_SUUGGESTION", _alx_data);
        chrome.extension.sendRequest( _alx_data_payload, function() {});
      },
      draw_typeahead_text: function(items,popup) {
        if(items) {
          var self = this,
              menuitem,
              description,
              menucontent;
          popup.setAttribute('visualsuggestions','false');
          A$.foreach(items,function(i,item) {
            menucontent     = item.text.content;
            menu_item   = self.create('menuitem','menu-item',i);
            description = self.create('label'   ,'description',i);

            description.setAttribute('value',menucontent);
            description.setAttribute('crop' ,'end');

            menu_item.setAttribute('value',menucontent);
            menu_item.appendChild(description);
            popup.appendChild(menu_item);
          });
        }
      },
      bold_typeahead: function(search,result) {
        search = search.toLowerCase();
        var text   = result.replace(/^\s+/gi,''),
            tmp    = text.split(search),
            start  = tmp.shift(),
            end    = tmp.join(search),
            box    = document.createElement('description');
            labels = [
              document.createElement('description'),
              document.createElement('description'),
              document.createElement('description')
            ];
        labels[0].setAttribute('value',start);
        labels[1].setAttribute('value',search);
        labels[1].setAttribute('class','header');
        labels[2].setAttribute('value',end);


        A$.foreach(labels,function(i,label) {
          label.style.margin  = 0;
          label.style.padding = 0;
          box.appendChild(label);
        });
        box.setAttribute('crop','end');
        box.setAttribute('flex','1');
        return box;
      },
      hide_typeahead: function() {
        if(this.has_typeahead) {
          this.typeahead_results = null;
          //this.elements.search_menupopup.hidePopup();
          var _alx_data = {
            bid:      this.id,
            menuid:   "searchsuggestion",
          };

          var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_HIDE_SEARCH_SUGGESTION", _alx_data);
          chrome.extension.sendRequest( _alx_data_payload, function() {});
        }
      },
      set_active_typeahead: function(dir) {
        var popup  = this.elements.search_menupopup,
            self   = this,
            nodes  = popup.getElementsByTagName('menuitem'),
            length = nodes.length;
        if(this.typeahead_visible) {
          if(dir === '+') {
            if(this.current_typeahead === length - 1) {
              //at bottom
              this.current_typeahead = -1;
              this.set_value(this.current_search);
            }else {
              this.current_typeahead++;
            }
          }else if(dir === '-') {
            if(this.current_typeahead === 0) {
              //at top
              this.current_typeahead = -1;
              trace('at the top: ' + this.current_search);
              this.set_value(this.current_search);
            }else if(this.current_typeahead === -1) {
              this.current_typeahead = length - 1;
            }else if(this.current_typeahead !== -1){
              this.current_typeahead--;
            }
          }
          if(this.current_typeahead < length) {
            nodes = popup.getElementsByTagName('menuitem');
            A$.foreach(nodes, function(i,node) {
              if(node) {
                if(self.current_typeahead == i && self.current_typeahead !== -1) {
                  node.setAttribute('_moz-menuactive','true');
                  if(popup.getAttribute('visualsuggestions') === 'false') {
                    self.set_value(nodes[i].getAttribute('value'));
                  }else {
                    popup.setAttribute('currentselection',i);
                  }
                }else {
                  node.setAttribute('_moz-menuactive','false');
                }
              }
            });
          }
        }
      },
      on_typeahead_load: function() {},
      on_typeahead_hide: function() {
        this.typeahead_visible = false;
        this.empty_popup(this.elements.menu_popup);
      },
      typeahead_click: function(e) {
        this.typeahead_selected(e,true);
      },
      typeahead_selected: function(e,clicked) {
        //var visual = this.elements.search_menupopup.getAttribute('visualsuggestions') === 'true' ? true : false,
        //    item;
        var visual = false,
            item;
        if(e.target.tagName === 'menuitem' || e.target.tagName === 'INPUT') {
          if(visual) {
            if(clicked) {
              this.new_tab(e.target.getAttribute('gotourl'));
            }else {
              item = this.typeahead_results[this.current_typeahead];
              if(item) {
                this.new_tab(item.url.content);
              }else {
                this.do_search();
              }
            }
          }else {
            if(clicked) {
              this.set_value(e.target.getAttribute('value'));
            }
            this.do_search();
          }
          this.hide_typeahead();
        }
      },
      click: function() {
        this.defaultFont();
      },
      do_typeahead: function() {
        var self = this;
        if(this.typeahead_timeout_func !== null)
        {
          clearTimeout(self.typeahead_timeout_func);
          this.typeahead_timeout_func = null;
        }

        if(this.typeahead_timeout_func === null) {
          this.typeahead_timeout_func = setTimeout(function() {
            self.current_search = self.get_value();
            self.current_typeahead = -1;
            self.show_typeahead();
            clearTimeout(self.typeahead_timeout_func);
            self.typeahead_timeout_func = null;
          },this.typeahead_timeout);
        }

      }
    }),
    menu: A$.inherit(Button, {
      events: ['click','mouseover','mouseout'],
      popup_align_element: false,
      last_selection     : 0,
      has_image          : false,
      menu_properties    : null,
      menu_from_url      : true,
      init: function(id) {
        this._super('menu',id);
      },
      draw: function() {
        this.create_container({
          align: 'center'
        });
        var menu_image = this.create('image','menu_image'),menu_icon;

        if(this.has_image) {
          menu_icon = this.create('image','menu_icon');
          if(this.hide_image)
            menu_icon.style.display = "none";
          this.element.appendChild(menu_icon);
        }

        //this.element.setAttribute(this.event_attribute,'menu');
        this.create_menu_popup();

        menu_image.setAttribute("src", chrome.extension.getURL("/images/arrowdown.png"));
        this.attach_to_container(menu_image);
      },
      mouseover: function(e) {
        //this.elements.menu_image.setAttribute("src", chrome.extension.getURL("/images/arrowdown_white.png"));
      },
      mouseout: function(e) {
        this.elements.menu_image.setAttribute("src", chrome.extension.getURL("/images/arrowdown.png"));
      },
      on_properties_set: function() {
        var search_provider = false;
        if(this.properties.type == "search") {
          search_provider = ALX_NS_PH_TB_Helper.getPref( "search." + this.id + ".defaultprovider" );
          if(search_provider) {
            this.last_selection = search_provider;
          }else {
            this.last_selection = this.properties.defaultprovider ? this.properties.defaultprovider: 0;
          }
        }
        if( this.get_property('menuurl') == null ) {
          this.menu_from_url = false;
        }
      },
      set_menu_image: function(index) {
        index = index || this.last_selection;
        this.set_menu_url(this.menu_properties[index].image);
      },
      set_menu_url: function(url) {
        this.fetch_image(this.elements['menu_icon'], url)
      },
      clear_menu_items: function()
      {
        this.set_menu_items([], true, true);
      },
      set_menu_items: function(items,images,isforce) {
        images = images === undefined ? 'true' : images;
        isforce = isforce ? true : false;
        A$.foreach(items,function(k,v) {
          if (typeof v != "undefined")
          {
            if(v.link) {
              v.url = (v.link.search(/^http:\/\//i) === -1 && v.link.search(/^https:\/\//i) === -1) ? 'http://' + v.link : v.link;
            }
            if(v.url && images === 'true') {
              //v.image = "chrome://favicon/" + ALX_NS_PH_TB_RENDER.extractHost(v.url);
              v.image = 'http://' + ALX_NS_PH_TB_RENDER.extractHost(v.url) + '/favicon.ico';
            }
            v.displayName = v.name || v.title;
          }
        });
        trace('setting menu items');
        this.set_menu_properties(items);
        this.create_menu_popup(isforce);
      },
      get_last_selection_properties: function() {
        if(this.menu_properties !== null) {
          return this.menu_properties[this.last_selection];
        }
        return false;
      },
      create_menu_popup: function(isforce) {
        isforce = isforce ? true : false;
        this.properties.menuUrl = this.get_property('menuurl');
        var self = this,
          callback = function(properties) {
            var menu = self.element.getElementsByTagName('menupopup');
            self.set_menu_properties(properties);
            if(menu && menu[0]) {
              self.menu_popup = menu[0];
              self.menu_popup.setAttribute('id'   ,self.get_id('menu_popup'));
              self.menu_popup.setAttribute('class',self.get_class('menu_popup'));
            }
            if(typeof self.on_menu_load === 'function') {
              self.on_menu_load();
            }
          };
        //TODO: Parse xml our own way so we dont have to do this stupid workaround
        if(this.menu_from_url && this.properties.menuUrl) {
          loadContentHelp.loadMenuFromUrl(this.element,this.properties,callback,this);
        }else if(this.menu_properties){
          loadContentHelp.loadMenu(this.element,this.properties,this.menu_properties,isforce,this);
          callback();
        } else if (this.type == "menu" && this.is_child){
          if (this.menu_button && (this.menu_button.rss || this.menu_button.ori_type == "relatedlinks"))
            return;
          this.element.style.display = "none";
        }
      },
      on_menu_load: function() {
        if(this.has_image) {
          this.set_menu_image();
          this.set_textbox_default_text();
          this.set_search_tooltip_text();
          this.set_checked();
        }
      },
      menu_select: function(index) {
        this.last_selection = index;
        if(this.has_image) {
          //var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);
          //prefs.setIntPref('extensions.alexa.searchProvider',index);
          this.set_menu_image();
          this.set_textbox_default_text();
          this.set_search_tooltip_text();
        }
      },
      set_checked: function() {
        //var items = this.menu_popup.getElementsByTagName('menuitem');
        //if(items) {
          //items[this.last_selection].setAttribute('checked','true');
        //}
      },
      set_textbox_default_text: function() {
        if(this.menu_button && this.menu_button.search && this.menu_button.search.textbox) {
          this.menu_button.search.textbox.set_default_text(this.menu_properties[this.last_selection].defaultText);
        }
      },
      set_search_tooltip_text: function() {
        if(this.menu_button && this.menu_button.search) {
          this.menu_button.search.set_tooltip_text(this.menu_properties[this.last_selection].defaultText);
        }
      },
      set_menu_properties: function(properties) {
        if(properties) {
          this.menu_properties = properties;
        }
      },
      get_menu_properties: function() {
        return this.menu_properties;
      },
      add_menu_item: function(obj)
      {
        if (typeof obj == "object")
        {
          var menu_properties = this.get_menu_properties();
          menu_properties.push(obj);
          this.set_menu_items(menu_properties);
        }
      },
      parse_menu_xml: function() {
        this.make_request(this.get_property('menuurl'), function(xml) {
          if(xml) {
            var items_container = xml.getElementsByTagName('menuItems'),
                items;
            if(items_container && items_container[0]) {
              items = items_container[0].getElementsByTagName('menuItem');
              A$.foreach(items, function(k,item) {
                var tmp = {};
                A$.foreach(item.childNodes,function(l,node) {
                  if(node.tagName && node.textContent) {
                    tmp[node.tagName] = node.textContent;
                  }
                });
                return tmp;
              });
            }
          }
        });
      },
      show_popup: function() {
        if(this.menu_popup) {
          var align = this.popup_align_element || this.element;
          this.menu_popup.openPopup(align,'after_start',0,0);
        }
      },
      click: function(e) {
        if (e.button == 0)
        {
          //this.show_popup();
          var align = this.popup_align_element || this.element;
          var boundingbox = align.getBoundingClientRect();
          var _alx_data = {
            bid:      this.id,
            menuid:   "dropdown",
            alignbox: boundingbox,
            align: "after_start"
          };

          var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_TOGGLE_DROP_DOWN", _alx_data);
          chrome.extension.sendRequest( _alx_data_payload, function() {});
        }
      }
    }),
    menu_button: A$.inherit(Button, {
      menu_popup: null,
      search    : null,
      children  : ['image','text','menu'],
      init: function(id) {
        this._super('menu_button',id);
      },
      draw: function() {
        this.create_container();
        var menu_button_container = this.create('hbox','menu_button_container');
        this.menu.popup_align_element = this.element;
        this.image.draw();
        this.text.draw();
        this.text.on_draw();
        this.image.on_draw();
        this.menu.draw();
        this.menu.on_draw();
        if(this.get_property('menuorientation') === 'left') {
          menu_button_container.appendChild(this.menu.element);
          menu_button_container.appendChild(this.text.element);
        }
        menu_button_container.appendChild(this.image.element);
        if(this.get_property('menuorientation') === 'right' || this.get_property('menuorientation') === null) {
          menu_button_container.appendChild(this.text.element);
          menu_button_container.appendChild(this.menu.element);
        }
        this.attach_to_container(menu_button_container);
      }
    }),
    rss: A$.inherit(Button,{
      children: ['menu_button'],
      events: ['click'],
      current_feed: null,
      timeout_func: null,
      xml_defaults: {
        icons: 'false',
        numheadlines: 1
      },
      init: function(id) {
        this._super('rss',id);
        this.image = this.menu_button.image;
        this.menu  = this.menu_button.menu;
      },
      draw: function() {
        this.create_container();
        var rss      = this.create('hbox','rss'),
            headline = this.create('hbox','headline'),
            self = this;
        this.menu_button.draw();
        rss.appendChild(this.menu_button.element);
        headline.setAttribute('align','center');
        rss.appendChild(headline);
        this.attach_to_container(rss);
        this.create_headline();
        this.get_rss();
        this.timeout_func = setInterval(function() {
          self.get_rss();
        },this.get_property('refreshinterval') * 1000);
      }
    })
  };

  var process_buttons = function(xml) {
    Factory = new Toolbar();
    Factory.build_buttons(xml);
    Factory.draw_buttons();
  };

  var toolbar_buttons = {},
      toolbar_global = {},
      toolbar_headlines = [],
      timers = [],
      events = [],
      pageturn_listeners = [];

  function add_button(button, filename) {
    //this code got replaceed with new drawing code
    if (Factory)
    {
      Factory.add_button(button);
    }
  }

  function subst_tokens(url, data) {
    if (!url) {
        return url;
    }
    var rankText = "no data",
        rankTip = "no data",
        averageReview = "unrated",
        href = "",
        site = "";
    if (data && data.url) {
        rankText = data.rankText;
        rankTip = data.rankTip;
        site = data.site;
        href = data.url;
    }

    url = url.replace(/__RANK__TEXT__PLACEHOLDER__/g, rankText);
    url = url.replace(/__RANK__TIP__PLACEHOLDER__/g, rankTip);

    try {
        url = url.replace(/__VERSION__PLACEHOLDER__/g, ALX_NS_PH_TB_Helper.getMyVersion());
    } catch (ex) {
        try {
            url = url.replace(/__VERSION__PLACEHOLDER__/g, "");
        } catch (ex) {}
    }

    try {
        url = url.replace(/__SELECTION__PLACEHOLDER__/g, window.content.window.getSelection());
    } catch (ex) {
        try {
            url = url.replace(/__SELECTION__PLACEHOLDER__/g, "");
        } catch (ex) {

        }
    }

    try {
        url = url.replace(/__LOCATION__BAR__PLACEHOLDER__/g, href);
    } catch (ex) {
        try {
            url = url.replace(/__LOCATION__BAR__PLACEHOLDER__/g, "");
        } catch (ex) {

        }
    }

    url = url.replace(/__VERSION__TOOLBAR__ROOT__PLACEHOLDER__/g, ALX_NS_PH_TB_Helper.urlReplacement("__TOOLBAR__URL__ROOT__"));
    url = url.replace(/__TOOLBAR__ROOT__PLACEHOLDER__/g, ALX_NS_PH_TB_Helper.urlReplacement("__TOOLBAR__URL__ROOT__"));

    if(site !== '') {
        url = url.replace(/__SITE__PLACEHOLDER__/g, site);
    }
    if(href !== '') {
        url = url.replace(/__URL__PLACEHOLDER__/g, href);
    }
    url = url.replace(/__ENCODED__URL__PLACEHOLDER__/g, encodeURIComponent(href));
    url = url.replace(/__LOCATION__BAR__PLACEHOLDER__/g, encodeURIComponent(href));
    url = url.replace(/__TOOLBAR__LOCALE__BASE__PLACEHOLDER__/g, ALX_NS_PH_TB_Helper.urlReplacement("__TOOLBAR__URL__ROOT__/locale"));
    url = url.replace(/__TOOLBAR__LOCALE__PLATFORM__PLACEHOLDER__/g, ALX_NS_PH_TB_Helper.urlReplacement("__TOOLBAR__URL__PLATFORM__/locale"));
    url = url.replace(/__BROWSER__PLACEHOLDER__/g, "f");

    for (var key in toolbar_global)
    url = url.replace(new RegExp(key, "g"), toolbar_global[key]);

    url = ALX_NS_PH_TB_Helper.urlReplacement(url);
    return url;
  }

  function on_configuration_set()
  {
    var current_toolbar_config = ALX_NS_PH_TB_Helper.getPref("toolbarConfiguration", {});
    if (JSON.stringify(current_toolbar_config) != JSON.stringify(toolbar_global))
    {
      var _alx_data = toolbar_global;
      var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_SET_CONFIGURATION", _alx_data);
      chrome.extension.sendRequest( _alx_data_payload, function() {});
    }
  }

  function get_toolbar_global_configure(toolbarxml) {
    var configureNode = null,
        configureNodes = toolbarxml.documentElement.getElementsByTagName("configuration");
    if (configureNodes) configureNode = configureNodes[0];

    if (configureNode) {
      var children = configureNode.childNodes;
      for (var i = 0,l =  children.length; i < l; i++) {
        var item = children.item(i);
        var tagName = item.tagName;
        if (tagName == "tname") tagName = "toolbar_name";
        switch (tagName)
        {
          case "pluginReportingIdentifier":
          case "regionPlaceHolder":
          case "tagNPlaceHolder":
          case "postInstallBubbleShown":
          case "toolbar_name":
          case "chromeIcon19":
          case "associateId":
          case "height":
          case "httpsDadListUrl":
          case "herbUrl":
          case "buttonBackgroundColor":
            var localeId = item.getAttribute("id");
            toolbar_global[tagName] = loadContentHelp.getLocalNameConfigure(item.textContent, localeId);
            break;
        }
      }
    }

    var replacementsNode = null
    var replacementsNodes = toolbarxml.documentElement.getElementsByTagName("replacements");

    if (replacementsNodes) replacementsNode = replacementsNodes[0];

    if (replacementsNode) {
      var replacementNodes = replacementsNode.getElementsByTagName("replacement");
      for (var i = 0,l = replacementNodes.length; i < l; i++)
      {
        var replacementNode = replacementNodes[i];
        var keyNodes = replacementNode.getElementsByTagName("key");
        var valueNodes = replacementNode.getElementsByTagName("value");

        for (var j = 0; j < keyNodes.length; j++)
        {
          var key = keyNodes[j].textContent;
          var value = valueNodes[j].textContent
          toolbar_global[key] = loadContentHelp.getLocalNameConfigure(value, key);
        }
      }
    }
  }

  function add_buttons_from_toolbarxml(toolbarxml, src, cb) {
    var toolbar = get_toolbar_object();
    while (toolbar.firstChild) {
        toolbar.removeChild(toolbar.firstChild);
    }
    toolbar_buttons = {};
    toolbar_global = {};
    get_toolbar_global_configure(toolbarxml);
    on_configuration_set();

    var toolbar_container = document.createElement('hbox');
    toolbar_container.setAttribute('id','ALX_NS_PH_TB-Toolbar-container');
    toolbar.appendChild(toolbar_container);

    process_buttons(toolbarxml);
    cb();
  }

  function get_toolbar_object()
  {
    var toolbar = document.getElementById("ALX_NS_PH_TB-Toolbar");
    if (!toolbar)
    {
      toolbar = document.createElement('hbox');
      toolbar.setAttribute('id', 'ALX_NS_PH_TB-Toolbar');
      document.body.appendChild(toolbar);
    }
    return toolbar;
  }

  function add_buttons(src, cb) {
    var toolbar = get_toolbar_object();
    var toolbarXMLText = null;
    var ver = ALX_NS_PH_TB_Helper.getMyVersion();

    if (  ALX_NS_PH_TB_Helper.getPref("toolbarXMLText", null) &&
          ALX_NS_PH_TB_Helper.getPref("toolbarXMLVersion", null) &&
          ALX_NS_PH_TB_Helper.getPref("toolbarXMLVersion") == ver) {
      toolbarXMLText = decodeURIComponent(escape(ALX_NS_PH_TB_Helper.getPref("toolbarXMLText", "")));
    }

    if (toolbarXMLText) {
      var dp = new DOMParser();
      var doc = dp.parseFromString(toolbarXMLText, "text/xml");
      add_buttons_from_toolbarxml(doc, src, cb)
    } else {
      var http = new XMLHttpRequest();
      http.open("GET", src, true);
      http.onload = function () {
        var buttons = http.responseXML.documentElement.getElementsByTagName("button");
        var configuretion = http.responseXML.documentElement.getElementsByTagName("configuration");
        if (buttons && configuretion && buttons.length == 0 && configuretion.length == 0) {
          if(prefBranch.prefHasUserValue("extensions.alexa.toolbarXMLText")) {
            toolbarXMLText = decodeURIComponent(escape(prefBranch.getCharPref("extensions.alexa.toolbarXMLText")));
          }
          if (toolbarXMLText) {
            var dp = new DOMParser();
            var doc = dp.parseFromString(toolbarXMLText, "text/xml");
            add_buttons_from_toolbarxml(doc, src, cb)
          }
        } else add_buttons_from_toolbarxml(http.responseXML, src, cb)
      };
      http.send(null);
    }
  }

  function get_data() {
    var data = ALX_NS_PH_TB_RENDER.data;
    if (data == null)
      return null;

    return data;
  }

  function init_toolbar() {
    // destroy toolbar first
    ALX_NS_PH_TB_RENDER.extension.shutdown();

    // write a callback function for add_button function
    var add_button_callback = function () {
      var active_buttons = ALX_NS_PH_TB_Helper.getPref("active-buttons", "").split(",");
      var toolbar = get_toolbar_object();
      for (var i = 0; i < active_buttons.length; i++) {
        var key = active_buttons[i];
        if (key && key.length) {
          var ver = "";
          var filename = "";
          try {
              filename = ALX_NS_PH_TB_Helper.getPref("active-buttons." + key + ".url", null);
              ver = ALX_NS_PH_TB_Helper.getPref("active-buttons." + key + ".version", null);
          } catch (ex) {}
          if (filename && ver != ALX_NS_PH_TB_Helper.getMyVersion()) {
              ALX_NS_PH_TB_RENDER.register_buttons("ALX_NS_PH", filename, true);
          }

          var xml = ALX_NS_PH_TB_Helper.getPref("active-buttons." + key, null);
          if (xml)
          {
            var parser = new DOMParser();
            var doc = parser.parseFromString(xml, "text/xml");
            var buttons = doc.documentElement.getElementsByTagName("button");
            if (buttons) for (var j = 0; j < buttons.length; ++j) {
              var button = buttons.item(j);
              //add_button(toolbar, button, filename);
              add_button(doc, filename);
            }
          }
        }
      }
      //ALX_NS_PH_TB_RENDER.updateButtons(get_data());
      document.body.setAttribute("style", "opacity: 1")
    };

    loadContentHelp.loadLocale();
    add_buttons(chrome.extension.getURL("/xml/toolbar.xml"), add_button_callback);
  }

  if (typeof ALX_NS_PH_TB_RENDER == "undefined") {
    window.ALX_NS_PH_TB_RENDER = {
      ID: "toolbar@alexa.com",
      data: null,
      dataPersistence: {},
      callPersistence: function (perName, funcName, params, isRemove) {
        var obj = null;

        //if (ALX_NS_PH_TB_RENDER.dataPersistence[perName] && ALX_NS_PH_TB_RENDER.dataPersistence[perName]["external"][funcName]) obj = ALX_NS_PH_TB_RENDER.dataPersistence[perName]["external"][funcName];
        if (ALX_NS_PH_TB_RENDER.dataPersistence[perName] && ALX_NS_PH_TB_RENDER.dataPersistence[perName]["args"][funcName]) obj = ALX_NS_PH_TB_RENDER.dataPersistence[perName]["args"][funcName];

        if (obj) {
          obj.apply(obj, params);
          if (isRemove && (isRemove == true || isRemove == "true"))
            delete ALX_NS_PH_TB_RENDER.dataPersistence[perName];
        }
      },
      addWinProxy: function(proxyName, proxyObj)
      {
        Factory.win_proxy[proxyName] = proxyObj;
      },
      removeWinProxy: function(proxyName)
      {
        if (Factory.win_proxy[proxyName])
          delete Factory.win_proxy[proxyName];
      },
      callWinProxyMethod: function(winProxy, method)
      {
        var winobj = Factory.win_proxy[winProxy];;
        if (winobj)
        {
          var _alx_data = {
            obj: winobj,
            method: method
          };
          var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_APPLY_WIN_METHOD", _alx_data);
          chrome.extension.sendRequest( _alx_data_payload, function() {});
        }
      },
      setAlexaData: function(data)
      {
        //console.log("setAlexaData: " + data)
        if( data == null )
          return;

        document.body.style.opacity = 1;
        var tmp_data = ALX_NS_PH_TB_RENDER.data;
        ALX_NS_PH_TB_RENDER.data = data;
        for(var bid in Factory.buttons)
        {
          var button = Factory.buttons[bid];
          //console.log(data)
          if (button.type)
          {
            if (button.type == "search")
            {
              if (data.searchboxText && typeof data.searchboxText[button.id] != "undefined")
              {
                button.properties.text = data.searchboxText[button.id];
              }
            }
            if (button.elements.javascript && button.elements.javascript.contentWindow &&
              button.elements.javascript.contentWindow.ALX_NS_PH_TB_API &&
              button.elements.javascript.contentWindow.ALX_NS_PH_TB_API.pageturn)
            {
              if (tmp_data || !button.elements.javascript.contentWindow.ALX_NS_PH_TB_API.hasPageTurned())
                button.elements.javascript.contentWindow.ALX_NS_PH_TB_API.pageturn(data);
            }
            if (button.ori_type == "relatedlinks")
            {
              var items = [];
              if (data.related)
                items = A$.clone_array(data.related);
              if (items.length > 0)
              {
                items.push({type: "menuBreak"})
                items.push({name: "More Related Links", link: subst_tokens("http://www.alexa.com/siteinfo/__SITE__PLACEHOLDER__#relatedlinks", data)})
              } else
                items.push({name: "[Not Available]", link: ""})
              button.menu.set_menu_items(items, 'true', true);
            }
            if (button.ori_type != "javascript")
            {
              button.properties.text = subst_tokens(button.properties_bak.text, data);
              button.properties.tooltiptitle = subst_tokens(button.properties_bak.tooltiptitle, data);
              button.properties.tooltipbody = subst_tokens(button.properties_bak.tooltipbody, data);
            } else {
              button.properties.text = subst_tokens(button.properties.text, data);
              button.properties.tooltiptitle = subst_tokens(button.properties.tooltiptitle, data);
              button.properties.tooltipbody = subst_tokens(button.properties.tooltipbody, data);
            }
          }
        }
      },
      extractHost: function(url)
      {
        if (typeof url == "string")
        {
          if (url.indexOf("http://" == 0))
          {
            url = url.replace("http://", "");
            var firstSlash = url.indexOf("/")
            var host = url.substring(0, firstSlash);
            return host
          }

          if (url.indexOf("https://" == 0))
          {
            url = url.replace("https://", "");
            var firstSlash = url.indexOf("/")
            var host = url.substring(0, firstSlash);
            return host
          }

        }
        return null;
      },
      menuCallback: function( message_pay_load ){
        if (Factory.buttons[message_pay_load.buttonId] && Factory.buttons[message_pay_load.buttonId].elements.javascript)
        {
          var alexa_obj = Factory.buttons[message_pay_load.buttonId].elements.javascript.contentWindow.Alexa;
          if (alexa_obj && alexa_obj.button.menu._callbackFuncs[message_pay_load.callbackId])
          {
            alexa_obj.button.menu._callbackFuncs[message_pay_load.callbackId]();
          }
        }
      },
      updateSearchButton: function( message_pay_load ){
        if (Factory.buttons[message_pay_load.bid] && Factory.buttons[message_pay_load.bid].menu)
          Factory.buttons[message_pay_load.bid].menu.menu_select(message_pay_load.defaultprovider);
      },
      updateRss: function( message_pay_load ){
        if (Factory.buttons[message_pay_load.bid])
          Factory.buttons[message_pay_load.bid].get_rss(true);
      },
      buttonCallback: function( message_pay_load, sendResponse ){
        var funcName  = message_pay_load.funcName;
        var perName   = message_pay_load.persistence;
        var isRemove  = message_pay_load.remove;
        var params    = message_pay_load.params;
        var inparams = [perName, funcName, params, isRemove]
        if (!message_pay_load.requireCallback)
          sendResponse({})
        else
          params.push(sendResponse)
        ALX_NS_PH_TB_RENDER.callPersistence.apply(ALX_NS_PH_TB_RENDER.callPersistence, inparams)
      },
      internalLoadURL: function(url, openIn, features, args, event)
      {
        url = subst_tokens(url, get_data());
        features = features ? features : "";
        args = args ? args : [];
        event = event ? event : {};

        var featureArray = features.split(",");
        var persistence = null;
        for (var i = 0; i < featureArray.length; i++) {
          var feature = featureArray[i];
          if (feature.match("^persistence=")) {
            persistence = feature.replace(/^persistence=/, "");
          }
        }

        if (persistence) ALX_NS_PH_TB_RENDER.dataPersistence[persistence] = {
          "args": args
        };

        if (event.alignbox)
        {
          var winWidth  = window.innerWidth;
          var mid = (event.alignbox.left + event.alignbox.right) / 2;
          var align_position = "after_start";
          if ( mid >= (winWidth / 2) )
            align_position = "after_end";

          url = url.replace("__ALIGNMENT__PLACEHOLDER__", align_position);
        }

        var _alx_data = {
          url:      url,
          openIn:   openIn,
          features: features,
          args: args,
          event: event
        };

        var winProxy = String(ALX_NS_PH_TB_Helper.getTime()) + "_" + String(ALX_NS_PH_TB_Helper.getRandom())
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_INTERNAL_LOAD_URL", _alx_data);
        chrome.extension.sendRequest( _alx_data_payload, function(obj) {
          if (obj)
            ALX_NS_PH_TB_RENDER.addWinProxy(winProxy, obj);
        });
        return winProxy;
      },
      loadSearchURL: function (event, url, openIn, id, isreturl) {
        if (!id) id = "ALX_NS_PH_TB-Search-Edit";
        var searchTermsBox = document.getElementById(id);

        //if (searchboxes[id]["isDefaultText"] == true) return;
        var searchTerms = trim(searchTermsBox.value);
        if (searchTerms == "") {
          searchTermsBox.value = "";
          return;
        }
        searchTerms = encodeURIComponent(searchTerms);
        try {
          url = url.replace(/__TERM__PLACEHOLDER__/g, searchTerms);
        } catch (ex) {
          try {
            url = url.replace(/__TERM__PLACEHOLDER__/g, "");
          } catch (ex) {

          }
        }
        var session = ALX_NS_PH_TB_Helper.getPref("session", "");
        url = url.replace(/__AID__PLACEHOLDER__/g, session);

        if (isreturl == true) return url
        else return ALX_NS_PH_TB_RENDER.internalLoadURL(url, openIn);
      }
    }
  }

  if (typeof ALX_NS_PH_TB_RENDER.extension == "undefined") {
    ALX_NS_PH_TB_RENDER.extension = {
      init: function () {
        init_toolbar();
        console.log("init")
        ALX_NS_PH_TB_RENDER.extension.fetchData();
      },
      fetchData: function() {
        console.log("fetchData")
        var _alx_data = {};
        var _alx_data_payload = ALX_NS_PH_TB_Helper.createRequestData("BACK_FETCH_ALEXA_DATA", _alx_data);
        chrome.extension.sendRequest( _alx_data_payload, ALX_NS_PH_TB_RENDER.setAlexaData);
      },
      shutdown: function () {
        logo = null;
        Factory = null;

        toolbar_buttons = {};
        toolbar_global = {}
        pageturn_listeners = [];
        toolbar_headlines.length = 0;
        global_description_win = null;
        global_description_ref_win = null;
        global_description_state = null;
        global_description_timer = null;
      }
    }
  }

})();

//window.addEventListener("hashchange", function () { console.log("haschange"); ALX_NS_PH_TB_RENDER.extension.fetchData(); }, false);
window.addEventListener("load", function () { ALX_NS_PH_TB_RENDER.extension.init(); }, false);
window.addEventListener("unload", function () { ALX_NS_PH_TB_RENDER.extension.shutdown();}, false);
