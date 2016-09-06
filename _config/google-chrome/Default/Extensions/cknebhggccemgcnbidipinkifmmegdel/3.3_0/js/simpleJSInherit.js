/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */
// Inspired by base2 and Prototype
var A$ = {
  inherit: function (obj1,obj2) {
    var initializing = false,
      fnTest = /xyz/.test(function () {xyz;}) ? /\b_super\b/ : /.*/,
      _super = obj1.prototype,
      prototype,
      new_class;
    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    prototype = new obj1();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in obj2) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof obj2[name] == "function" && typeof _super[name] == "function" && fnTest.test(obj2[name]) ? 
      (function (name, fn) {
        return function () {
          var tmp = this._super;

          // Add a new ._super() method that is the same method
          // but on the super-class
          this._super = _super[name];

          // The method only need to be bound temporarily, so we
          // remove it when we're done executing
          var ret = fn.apply(this, arguments);
          this._super = tmp;

          return ret;
        };
      })(name, obj2[name]) : obj2[name];
    }

    // The dummy class constructor
    new_class = function() {
      if(!initializing && typeof this.init === 'function') {
        this.init.apply(this,arguments);
      }

    };
    // Populate our constructed prototype object
    new_class.prototype = prototype;

    // Enforce the constructor to be what we expect
    new_class.constructor = new_class;

    return new_class;
  },
  clone_obj: function(obj) {
    var new_obj = {};
    A$.foreach(obj,function(k,v) {
      if(typeof v === 'object') {
                
      }else {
        new_obj[k] = v;
      }
    });
    return new_obj;
  },
  clone_array: function(arr) {
    return arr.slice(0);
  },
  foreach: function(obj,func) {
    if(obj instanceof Array) {
      var ret = [],i,l,tmp;
      for(i = 0,l = obj.length;i < l;i++) {
        tmp = func(i,obj[i]);
        if(tmp) {
          ret.push(tmp);
        }
      }
      return ret;
    }else if(obj instanceof Object) {
      var ret = {},key,tmp;
      for(key in obj) {
        if(obj.hasOwnProperty(key)) {
          tmp = func(key,obj[key]);
          if(tmp && tmp[0] && tmp[1]) {
            ret[tmp[0]] = tmp[1];
          }
        }
      }
      return ret;
    } 
  },
  trace_r: function(obj) {
    var str = '',
    func = function(o) {
      var str = '';
      A$.foreach(o,function(k,v) {
        //if(typeof v === 'object') {
          //str += func(v);
        //}else if(typeof v === 'funciton'){
          //str += k + ": function()\n";
        //}else {
          str += k + ': ' + v + "\n";
        //}
      });
      return str;
    };
    if(typeof obj === 'string') {
      trace(obj);
    }else {
      str += func(obj);
      trace(str);
    }
  },
  trim: function(str) {
    return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  },
  get_random: function(between) {
    return Math.floor(Math.random() * (between + 1)); 
  },
  merge: function(obj1, obj2) {
    var new_obj = this.clone_obj(obj1);
    A$.foreach(obj2, function(k,v) {
      new_obj[k] = v;
    });
    return new_obj;
  },
  has_parent: function(target,parent_attr,parent_value,max) {
    max = max || 6;
    var self = this,
    start = 0,
    get_attr = function(el) {
      start++;
      if(el && start < max) {
        var att = '';
        if(el.getAttribute) {
          att = el.getAttribute(parent_attr);
        }
        if(att === parent_value) {
          return att;
        }else {
          return get_attr(el.parentNode);
        }
      }else {
        return false;
      }
    };
    return get_attr(target);
  }
};
