/*! Copyright 2011 Trigger Corp. All rights reserved. */
// Start function wrapper to create local scope.
(function () {

// Things we want to expose
var forge = {};

// Things we want to only use internally
var internal = {};
forge.config = window.forge.config;/*
 * Platform independent API.
 */

// Event listeners
internal.listeners = {};

// Store callbacks in this
var temporaryAsyncStorage = {};

// All of this is to queue commands if waiting for Catalyst
var callQueue = [];
var callQueueTimeout = null;
var handlingQueue = false;
var handleCallQueue = function () {
	if (callQueue.length > 0) {
		if (!internal.debug || window.catalystConnected) {
			handlingQueue = true;
			while (callQueue.length > 0) {
				var call = callQueue.shift();
				if (call[0] == "logging.log") {
					console.log(call[1].message);
				}
				internal.priv.call.apply(internal.priv, call);
			}
			handlingQueue = false;
		} else {
			callQueueTimeout = setTimeout(handleCallQueue, 500);
		}
	}
};

// Internal methods to handle communication between privileged and non-privileged code
internal.priv = {
	/**
	 * Generic wrapper for native API calls.
	 *
	 * @param {string} method Name of the API method.
	 * @param {*} params Key-values to pass to privileged code.
	 * @param {function(...[*])} success Called if native method is successful.
	 * @param {function({message: string}=} error
	 */
	call: function (method, params, success, error) {
		if ((!internal.debug || window.catalystConnected || method === "internal.showDebugWarning") && (callQueue.length == 0 || handlingQueue)) {
			var callid = forge.tools.UUID();
			var onetime = true; // All method could be called back several times
			// API Methods which can be calledback multiple times
			if (method === "button.onClicked.addListener" || method === "message.toFocussed" || method == "cookies.watch") {
				onetime = false;
			}
			if (success || error) {
				temporaryAsyncStorage[callid] = {
					success: success,
					error: error,
					onetime: onetime
				};
			}
			var call = {
				callid: callid,
				method: method,
				params: params
			};
			internal.priv.send(call);
			
		} else {
			callQueue.push(arguments);
			if (!callQueueTimeout) {
				callQueueTimeout = setTimeout(handleCallQueue, 500);
			}
		}
	},

	/**
	 * Calls native code from JS
	 * @param {*} data Object to send to privileged/native code.
	 */
	send: function (data) {
		// Implemented in platform specific code
		throw new Error("Forge error: missing bridge to privileged code");
	},

	/**
	 * Called from native at the end of asynchronous tasks.
	 *
	 * @param {Object} result Object containing result details
	 */
	receive: function (result) {
		if (result.callid) {
			// Handle a response
			if (typeof temporaryAsyncStorage[result.callid] === undefined) {
				forge.log("Nothing stored for call ID: " + result.callid);
			}
			var callbacks = temporaryAsyncStorage[result.callid];

			var returnValue = (typeof result.content === "undefined" ? null : result.content);

			if (callbacks && callbacks[result.status]) {
				callbacks[result.status](result.content);
			}
			
			if (callbacks && callbacks.onetime) {
				// Remove used callbacks
				delete temporaryAsyncStorage[result.callid];
			}

		} else if (result.event) {
			// Handle an event
			if (internal.listeners[result.event]) {
				internal.listeners[result.event].forEach(function (callback) {
					if (result.params) {
						callback(result.params);
					} else {
						callback();
					}
				})
			}
			if (internal.listeners['*']) {
				internal.listeners['*'].forEach(function (callback) {
					if (result.params) {
						callback(result.event, result.params);
					} else {
						callback(result.event);
					}
				})
			}
			
		}
	}
};

internal.addEventListener = function (event, callback) {
	if (internal.listeners[event]) {
		internal.listeners[event].push(callback);
	} else {
		internal.listeners[event] = [callback];
	}
}

/**
 * Generate query string
 */
internal.generateQueryString = function (obj) {
	if (typeof obj == 'undefined') return "";
  if (typeof obj == 'string') return obj;

	if (!(obj instanceof Object)) {
		return new String(obj).toString();
	}

	var params = [];
	var processObj = function (obj, scope) {
		if (obj === null) {
			return;
		} else if (obj instanceof Array) {
			var index = 0;
			for (var x in obj) {
				var key = (scope ? scope : '') + '[' + index + ']';
				index += 1;
				if (!obj.hasOwnProperty(x)) continue;
				processObj(obj[x], key);
			}
		} else if (obj instanceof Object) {
			for (var x in obj) {
				if (!obj.hasOwnProperty(x)) continue;
				var key = x;
				if (scope) {
					key = scope + '[' + x + ']';
				}
				processObj(obj[x], key);
			}
		} else {
			params.push(encodeURIComponent(scope)+'='+encodeURIComponent(obj));
		}
	};
	processObj(obj);
	return params.join('&').replace('%20', '+');
};

/**
 * Generate multipart form string
 */
internal.generateMultipartString = function (obj, boundary) {
	if (typeof obj === "string") {
		return '';
	}
	var partQuery = '';
	for (var key in obj) {
		if (!obj.hasOwnProperty(key)) continue;
		if (obj[key] === null) continue;
		// TODO: recursive flatten, deal with arrays
		partQuery += '--'+boundary+'\r\n';
		partQuery += 'Content-Disposition: form-data; name="'+key.replace('"', '\\"')+'"\r\n\r\n';
		partQuery += obj[key].toString()+'\r\n'
	}
	return partQuery;
};

/**
 * Generate a URI from an existing url and additional query data
 */
internal.generateURI = function (uri, queryData) {
	var newQuery = '';
	if (uri.indexOf('?') !== -1) {
		newQuery += uri.split('?')[1]+'&';
		uri = uri.split('?')[0];
	}
	newQuery += this.generateQueryString(queryData)+'&';
	// Remove trailing &
	newQuery = newQuery.substring(0,newQuery.length-1);
	return uri+(newQuery ? '?'+newQuery : '');
};

/**
 * Call a callback with an error that a module is disabled
 */
internal.disabledModule = function (cb, module) {
	var message = "The '"+module+"' module is disabled for this app, enable it in your app config and rebuild in order to use this function";
	forge.logging.error(message);
	cb && cb({
		message: message,
		type: "UNAVAILABLE",
		subtype: "DISABLED_MODULE"
	});
}

// Method to enable debug mode
forge.enableDebug = function () {
	internal.debug = true;
	internal.priv.call("internal.showDebugWarning", {}, null, null);
	internal.priv.call("internal.hideDebugWarning", {}, null, null);
};
// Check the old debug method isn't being used
setTimeout(function () {
	if (window.forge && window.forge.debug) {
		alert("Warning!\n\n'forge.debug = true;' is no longer supported\n\nUse 'forge.enableDebug();' instead.")
	}
}, 3000);
forge['button'] = {
	/**
	 * Change the URL of the icon displayed in the browser button
	 * 
	 * @param {string} url URL to the icon
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'setIcon': function (url, success, error) {
		internal.priv.call("button.setIcon", url, success, error);
	},

	/**
	 * Change the URL of the HTML page shown when a user clicks on the browser button
	 *
	 * @param {string} url URL to the HTML page
	 * @param {function()=} success Callback
	 * @param {function({message: string}=} error
	 */
	'setURL': function (url, success, error) {
		internal.priv.call("button.setURL", url, success, error);
	},

	/**
	 * Add a listener for when the toolbar button is clicked
	 * 
	 * @param {function()} callback function to invoked when the button is clicked
	 */
	'onClicked': {
		'addListener': function (callback) {
			internal.priv.call("button.onClicked.addListener", null, callback);
		}
	},

	/**
	 * Changes the toolbar button unread count
	 * 
	 * @param {number} number New count, 0 to clear
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'setBadge': function (number, success, error) {
		internal.priv.call("button.setBadge", number, success, error);
	},

	/**
	 * Changes the toolbar button color
	 * 
	 * @param {Array.<number>} colorArray an array of four integers in the range [0,255]
	 * 			that make up the RGBA color of the badge. For example, opaque red is [255, 0, 0, 255].
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'setBadgeBackgroundColor': function (colorArray, success, error) {
		internal.priv.call("button.setBadgeBackgroundColor", colorArray, success, error);
	},

	/**
	 * Set the tooltip text
	 *
	 * @param {string} title text to set as the tooltip
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'setTitle': function (title, success, error) {
		internal.priv.call("button.setTitle", title, success, error);
	}
};forge['document'] = {
	'reload': function() {
		return document.location.reload();
	},
	'location': function (success, error) {
		success(document.location);
	}
};forge['prefs'] = {
	/**
	 * Get a preference stored by your application.
	 *
	 * @param {string} key The key of your preference.
	 * @param {function(string)=} success
	 * @param {function({message: string}=} error
	 */
	'get': function (key, success, error) {
		internal.priv.call("prefs.get", {
			key: key.toString()
		}, success && function (value) {
			if (value === "undefined") {
				value = undefined;
			} else {
				try {
					value = JSON.parse(value);
				} catch (e) {
					error({
						message: e.toString()
					});
					// return;
				}
			}
			success(value);
		}, error);
	},
	/**
	 * Set a preference.
	 *
	 * @param {string} key The preference key.
	 * @param {string} value The preference value.
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'set': function (key, value, success, error) {
		if (value === undefined) {
			value = "undefined";
		} else {
			value = JSON.stringify(value);
		}
		internal.priv.call("prefs.set", {
			key: key.toString(),
			value: value
		}, success, error);
	},
	/**
	 * Find the keys of all preferences that have been set.
	 *
	 * @param {function(Array.<string>)=} success
	 * @param {function({message: string}=} error
	  */
	'keys': function(success, error) {
		internal.priv.call("prefs.keys", {}, success, error);
	},
	/**
	 * Find the keys and values of all preferences that have been set.
	 *
	 * @param {function(Object.<string, *>)=} success
	 * @param {function({message: string}=} error
	 */
	'all': function(success, error) {
		var success = success && function (prefs) {
			for (key in prefs) {
				if (prefs[key] === "undefined") {
					prefs[key] = undefined;
				} else {
					prefs[key] = JSON.parse(prefs[key]);
				}
			}
			success(prefs);
		}
		internal.priv.call("prefs.all", {}, success, error);
	},
	/**
	 * Expunge a single persisted setting, reverting it back to its default value (if available).
	 *
	 * @param {string} key Preference to forget.
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'clear': function(key, success, error) {
		internal.priv.call("prefs.clear", {
			key: key.toString()
		}, success, error);
	},
	/**
	 * Expunge all persisted settings, reverting back to defaults (if available).
	 *
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'clearAll': function(success, error) {
		internal.priv.call("prefs.clearAll", {}, success, error);
	}
};
/**
 * Generate a regex (as a string) for a chrome match pattern
 */
var patternToReStr = function (str) {
	if (str == '<all_urls>') {
		str = '*://*'
	}
	str = str.split('://');
	var scheme = str[0];
	var host, path;
	if (str[1].indexOf('/') === -1) {
		host = str[1];
		path = '';
	} else {
		host = str[1].substring(0, str[1].indexOf('/'));
		path = str[1].substring(str[1].indexOf('/'));
	}

	var re = '';

	// Scheme
	if (scheme == '*') {
		re += '.*://';
	} else {
		re += scheme+'://';
	}

	// Host
	if (host == '*') {
		re += '.*';
	} else if (host.indexOf('*.') === 0) {
		re += '(.+\.)?'+host.substring(2);
	} else {
		re += host;
	}

	// Path
	re += path.replace(/\*/g, '.*');

	return "^"+re+"$";
};

forge['tabs'] = {
  allTabs: function(cb) {
    internal.priv.call("tabs.allTabs", { }, cb, function() { });
  },
  getCurrentTabUrl: function(success) {
    internal.priv.call("tabs.getCurrentTabUrl", { }, success, function() { });
  },
  reload: function(id,success) {
    internal.priv.call("tabs.reload", { id: id }, success, function() { });
  },
	/**
	 * Open a new browser window, or (on mobile) a modal view.
	 *
	 * @param {string} url The URL to open in the new window.
	 * @param {boolean} if true retains focus in the tab making the call (browser only)
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'open': function (url, keepFocus, success, error) {
		if (typeof keepFocus === 'function') {
			// keepFocus boolean not passed as argument
			error = success;
			success = keepFocus;
			keepFocus = false; //default is to give focus to the new tab
		}

		internal.priv.call("tabs.open", {
			url: url,
			keepFocus: keepFocus
		}, success, error);
	},
  /**
   * Update a current browser window, or (on mobile) a modal view.
   *
   * @param {string} url The URL to open in the new window.
   * @param {function()=} success
   * @param {function({message: string}=} error
   */
  'updateCurrent': function (url, success, error) {
    internal.priv.call("tabs.updateCurrent", {
      url: url
    }, success, error);
  },
	/**
	 * Open a new browser window, or (on mobile) a modal view. With options as an object
	 *
	 * @param {object} options Options
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'openWithOptions': function (options, success, error) {
		if (!("url" in options)) {
			return error({
				message: "No URL specified",
				type: "UNEXPECTED_FAILURE"
			});
		}
		if (options.pattern) {
			options.pattern = patternToReStr(options.pattern);
		}
		internal.priv.call("tabs.open", options, success, error);
	},

	/**
	 * Close the tab that makes the call, intended to be called from foreground
	 * @param {function({message: string}=} error
	 */
	'closeCurrent': function (error) {
		error = arguments[1] || error;
		var hash = forge.tools.UUID();
		location.hash = hash;

		internal.priv.call("tabs.closeCurrent", {
			hash: hash
		}, null, error);
	}
};
forge['message'] = {
	/**
	 * Add a listener for broadcast messages sent by other pages where your extension is active.
	 *
	 * @param {string} type (optional) an arbitrary string: if included, the callback will only be fired
	 *  for messages broadcast with the same type; if omitted, the callback will be fired for all messages
	 * @param {function(*, function(*))=} callback
	 * @param {function({message: string}=} error
	 */
	'listen': function(type, callback, error) {
		error && error({
			message: 'Forge Error: message.listen must be overridden by platform specific code',
			type: 'UNAVAILABLE'
		});
	},

	/**
	 * Broadcast a message to all other pages where your extension is active.
	 *
	 * @param {string} type an arbitrary string which limits the listeners which will receive this message
	 * @param {*} content the message body which will be passed into active listeners
	 * @param {function(*)=} callback
	 * @param {function({message: string}=} error
	 */
	'broadcast': function(type, content, callback, error) {
		error && error({
			message: 'Forge Error: message.broadcast must be overridden by platform specific code',
			type: 'UNAVAILABLE'
		});
	},

	/**
	 * Broadcast a message to listeners set up in your background code.
	 *
	 * @param {string} type an arbitrary string which limits the listeners which will receive this message
	 * @param {*} content the message body which will be passed into active listeners
	 * @param {function(*)=} callback
	 * @param {function({message: string}=} error
	 */
	'broadcastBackground': function(type, content, callback, error) {
		error && error({
			message: 'Forge Error: message.broadcastBackground must be overridden by platform specific code',
			type: 'UNAVAILABLE'
		});
	},
	
	/**
	 * Send a message to just the currently focussed browser tab.
	 *
	 * @param {string} type an arbitrary string which limits the listeners which will receive this message
	 * @param {*} content the message body which will be passed into active listeners
	 * @param {function(*)=} callback
	 * @param {function({message: string}=} error
	 */
	'toFocussed': function(type, content, callback, error) {
		internal.priv.call("message.toFocussed", {
			type: type,
			content: content
		}, callback, error);
	}
};forge['notification'] = {
	/**
	 * Create a standard un-customized notification.
	 *
	 * @param {string} title
	 * @param {string} text
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'create': function (opts, success, error) {
		internal.priv.call("notification.create", opts, success, error);
	},

	/**
	 * Set the badge number for the application icon.
	 * Setting the badge number to 0 removes the badge.
	 *
	 * @param {number} number
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'setBadgeNumber': function (number, success, error) {
		internal.priv.call("notification.setBadgeNumber", {
			number: number
		}, success, error);
	}
};
forge['file'] = {
	/**
	 * Allow the user to select an image and give a file object representing it.
	 *
	 * @param {Object} props
	 * @param {function({uri: string, name: string})=} success
	 * @param {function({message: string}=} error
	 */
	'getImage': function (props, success, error) {
		if (typeof props === "function") {
			error = success;
			success = props;
			props = {};
		}
		if (!props) {
			props = {};
		}
		internal.priv.call("file.getImage", props, success && function (uri) {
			var file = {
				uri: uri,
				name: 'Image',
				type: 'image'
			};
			if (props.width) {
				file.width = props.width;
			}
			if (props.height) {
				file.height = props.height;
			}
			success(file)
		}, error);
	},
	/**
	 * Allow the user to select a video and give a file object representing it.
	 *
	 * @param {Object} props
	 * @param {function({uri: string, name: string})=} success
	 * @param {function({message: string}=} error
	 */
	'getVideo': function (props, success, error) {
		if (typeof props === "function") {
			error = success;
			success = props;
			props = {};
		}
		if (!props) {
			props = {};
		}
		internal.priv.call("file.getVideo", props, success && function (uri) {
			var file = {
				uri: uri,
				name: 'Video',
				type: 'video'
			};
			success(file)
		}, error);
	},
	/**
	 * Get file object for a local file.
	 *
	 * @param {string} name
	 * @param {function(string)=} success
	 * @param {function({message: string}=} error
	 */
	'getLocal': function (path, success, error) {
		forge.tools.getURL(path,
			function (url) {
				success({uri: url, name: path});
			}, error
		);
	},
	/**
	 * Get the base64 value for a files contents.
	 *
	 * @param {{uri: string, name: string}} file
	 * @param {function(string)=} success
	 * @param {function({message: string}=} error
	 */
	'base64': function (file, success, error) {
		internal.priv.call("file.base64", file, success, error);
	},
	/**
	 * Get the string value for a files contents.
	 *
	 * @param {{uri: string, name: string}} file
	 * @param {function(string)=} success
	 * @param {function({message: string}=} error
	 */
	'string': function (file, success, error) {
		forge.request.ajax({
			url: file.uri,
			success: success,
			error: error
		});
	},
	/**
	 * Get the URL an image which is no bigger than the given height and width.
	 *
	 * URL must be useable in the current scope of the code, may return a base64 data: URI.
	 *
	 * @param {{uri: string, name: string}} file
	 * @param {Object} props
	 * @param {function(string)=} success
	 * @param {function({message: string}=} error
	 */
	'URL': function (file, props, success, error) {
		if (typeof props === "function") {
			error = success;
			success = props;
		}
		// Avoid mutating original file
		var newFile = {}
		for (prop in file) {
			newFile[prop] = file[prop];
		}
		newFile.height = props.height || file.height || undefined;
		newFile.width = props.width || file.width || undefined;
		internal.priv.call("file.URL", newFile, success, error);
	},
	/**
	 * Check a file object represents a file which exists.
	 *
	 * @param {{uri: string, name: string}} file
	 * @param {function(boolean)=} success
	 * @param {function({message: string}=} error
	 */
	'isFile': function (file, success, error) {
		if (!file || !("uri" in file)) {
			success(false);
		} else {
			internal.priv.call("file.isFile", file, success, error);
		}
	},
	/**
	 * Download and save a URL, return the file object representing saved file.
	 *
	 * @param {string} URL
	 * @param {function({uri: string})=} success
	 * @param {function({message: string}=} error
	 */
	'cacheURL': function (url, success, error) {
		internal.priv.call("file.cacheURL",
			{url: url},
			success && function (uri) { success({uri: uri}) },
			error
		);
	},
	'saveURL': function (url, success, error) {
		internal.priv.call("file.saveURL",
			{url: url},
			success && function (uri) { success({uri: uri}) },
			error
		);
	},
	/**
	 * Delete a file.
	 *
	 * @param {{uri: string} file
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'remove': function (file, success, error) {
		internal.priv.call("file.remove", file, success, error);
	},
	/**
	 * Delete all cached files
	 *
	 * @param {function()=} success
	 * @param {function({message: string}=} error
	 */
	'clearCache': function (success, error) {
		internal.priv.call("file.clearCache", {}, success, error);
	}
};forge['request'] = {
	/**
	 * Get the response data from a URL. Imposes no cross-domain restrictions.
	 *
	 * See "ajax()" for more advanced options like setting headers, etc.
	 *
	 * @param {string} url
	 * @param {function(*)=} success Response data
	 * @param {function({message: string}=} error
	 */
	'get': function(url, success, error) {
		forge.request.ajax({
			url: url,
			dataType: "text",
			success: success && function () {
				try {
					arguments[0] = JSON.parse(arguments[0]);
				} catch (e) {}
				success.apply(this, arguments);
			},
			error: error
		});
	}
};

forge['request']['ajax'] = function (options) {
	/**
	 * Perform ajax request.
	 *
	 * See jQuery.ajax for further details, not all jQuery options are supported.
	 *
	 * @param {Object} options Contains all relevant options
	 */
	var dataType = options.dataType;
	if (dataType == 'xml' ) {
		options.dataType = 'text';
	}
	var success = options.success && function (data) {
		try {
			if (dataType == 'xml') {
				// Borrowed from jQuery.
				var tmp, xml;
				if ( window.DOMParser ) { // Standard
					tmp = new DOMParser();
					xml = tmp.parseFromString(data , "text/xml");
				} else { // IE
					xml = new ActiveXObject( "Microsoft.XMLDOM" );
					xml.async = "false";
					xml.loadXML(data);
				}
				
				data = xml;
			}
		} catch (e) {}
		options.success && options.success(data);
	};
	var error = options.error && function (error) {
		if (error.status == 'error' && !error.err) {
			forge.logging.log('AJAX request to '+options.url+' failed, have you included that url in the permissions section of the config file for this app?');
		}
		options.error && options.error(error);
	};
	internal.priv.call("request.ajax", options, success, error);
};forge['geolocation'] = {
	'getCurrentPosition': function (one, two, three) {
		if (typeof(one) === "object") {
			var options = one,
				success = two,
				error = three;
		} else {
			var success = one,
				error = two,
				options = three;
		}
		if (navigator && "geolocation" in navigator) {
			return navigator.geolocation.getCurrentPosition(success, error, options);
		} else {
			error && error({
				message: "geolocation not supported",
				type: "UNAVAILABLE"
			});			
		}
	}
};

forge['is'] = {
	/**
	 * @return {boolean}
	 */
	'mobile': function() {
		return false;
	},
	/**
	 * @return {boolean}
	 */
	'desktop': function() {
		return false;
	},
	/**
	 * @return {boolean}
	 */
	'android': function() {
		return false;
	},
	/**
	 * @return {boolean}
	 */
	'ios': function() {
		return false;
	},
	/**
	 * @return {boolean}
	 */
	'chrome': function() {
		return false;
	},
	/**
	 * @return {boolean}
	 */
	'firefox': function() {
		return false;
	},
	/**
	 * @return {boolean}
	 */
	'safari': function() {
		return false;
	},
	/**
	 * @return {boolean}
	 */
	'ie': function() {
		return false;
	},
	/**
	 * @return {boolean}
	 */
	'web': function() {
		return false;
	},
	'orientation': {
		'portrait': function () {
			return false;
		},
		'landscape': function () {
			return false;
		}
	},
	'connection': {
		'connected': function () {
			return true;
		},
		'wifi': function () {
			return true;
		}
	}
};//
// Logging helper functions
//

// Adapted from node.js
var inspectObject = function (obj, showHidden, depth) {
 	var seen = [];
 	stylize = function (str, styleType) {
 		return str;
 	};

 	function isRegExp(re) {
 		return re instanceof RegExp || (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
 	}

 	function isArray(ar) {
 		return ar instanceof Array || Array.isArray(ar) || (ar && ar !== Object.prototype && isArray(ar.__proto__));
 	}

 	function isDate(d) {
 		if (d instanceof Date) return true;
 		if (typeof d !== 'object') return false;
 		var properties = Date.prototype && Object.getOwnPropertyNames(Date.prototype);
 		var proto = d.__proto__ && Object.getOwnPropertyNames(d.__proto__);
 		return JSON.stringify(proto) === JSON.stringify(properties);
 	}

 	function format(value, recurseTimes) {
 		try {
 			// Provide a hook for user-specified inspect functions.
 			// Check that value is an object with an inspect function on
 			// it

 			// Filter out the util module, it's inspect function
 			// is special
 			if (value && typeof value.inspect === 'function' &&

 			// Also filter out any prototype objects using the
 			// circular check.
 			!(value.constructor && value.constructor.prototype === value)) {
 				return value.inspect(recurseTimes);
 			}
 			// Primitive types cannot have properties
 			switch (typeof value) {
 			case 'undefined':
 				return stylize('undefined', 'undefined');
 			case 'string':
 				var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
 				return stylize(simple, 'string');
 			case 'number':
 				return stylize('' + value, 'number');
 			case 'boolean':
 				return stylize('' + value, 'boolean');
 			}
 			// For some reason typeof null is "object", so special case
 			// here.
 			if (value === null) {
 				return stylize('null', 'null');
 			}
 			// Special case Document
 			if (value instanceof Document) {
 				return (new XMLSerializer()).serializeToString(value);
 			}
 			// Look up the keys of the object.
 			var visible_keys = Object.keys(value);
 			var keys = showHidden ? Object.getOwnPropertyNames(value) : visible_keys;
 			// Functions without properties can be shortcutted.
 			if (typeof value === 'function' && keys.length === 0) {
 				var name = value.name ? ': ' + value.name : '';
 				return stylize('[Function' + name + ']', 'special');
 			}
 			// RegExp without properties can be shortcutted
 			if (isRegExp(value) && keys.length === 0) {
 				return stylize('' + value, 'regexp');
 			}
 			// Dates without properties can be shortcutted
 			if (isDate(value) && keys.length === 0) {
 				return stylize(value.toUTCString(), 'date');
 			}
 			var base, type, braces;
 			// Determine the object type
 			if (isArray(value)) {
 				type = 'Array';
 				braces = ['[', ']'];
 			} else {
 				type = 'Object';
 				braces = ['{', '}'];
 			}
 			// Make functions say that they are functions
 			if (typeof value === 'function') {
 				var n = value.name ? ': ' + value.name : '';
 				base = ' [Function' + n + ']';
 			} else {
 				base = '';
 			}
 			// Make RegExps say that they are RegExps
 			if (isRegExp(value)) {
 				base = ' ' + value;
 			}
 			// Make dates with properties first say the date
 			if (isDate(value)) {
 				base = ' ' + value.toUTCString();
 			}
 			if (keys.length === 0) {
 				return braces[0] + base + braces[1];
 			}
 			if (recurseTimes < 0) {
 				if (isRegExp(value)) {
 					return stylize('' + value, 'regexp');
 				} else {
 					return stylize('[Object]', 'special');
 				}
 			}
 			seen.push(value);
 			var output = keys.map(function (key) {
 				var name, str;
 				if (value.__lookupGetter__) {
 					if (value.__lookupGetter__(key)) {
 						if (value.__lookupSetter__(key)) {
 							str = stylize('[Getter/Setter]', 'special');
 						} else {
 							str = stylize('[Getter]', 'special');
 						}
 					} else {
 						if (value.__lookupSetter__(key)) {
 							str = stylize('[Setter]', 'special');
 						}
 					}
 				}
 				if (visible_keys.indexOf(key) < 0) {
 					name = '[' + key + ']';
 				}
 				if (!str) {
 					if (seen.indexOf(value[key]) < 0) {
 						if (recurseTimes === null) {
 							str = format(value[key]);
 						} else {
 							str = format(value[key], recurseTimes - 1);
 						}
 						if (str.indexOf('\n') > -1) {
 							if (isArray(value)) {
 								str = str.split('\n').map(

 								function (line) {
 									return '  ' + line;
 								}).join('\n').substr(2);
 							} else {
 								str = '\n' + str.split('\n').map(

 								function (
 								line) {
 									return '   ' + line;
 								}).join('\n');
 							}
 						}
 					} else {
 						str = stylize('[Circular]', 'special');
 					}
 				}
 				if (typeof name === 'undefined') {
 					if (type === 'Array' && key.match(/^\d+$/)) {
 						return str;
 					}
 					name = JSON.stringify('' + key);
 					if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
 						name = name.substr(1, name.length - 2);
 						name = stylize(name, 'name');
 					} else {
 						name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
 						name = stylize(name, 'string');
 					}
 				}
 				return name + ': ' + str;
 			});
 			seen.pop();
 			var numLinesEst = 0;
 			var length = output.reduce(function (prev, cur) {
 				numLinesEst++;
 				if (cur.indexOf('\n') >= 0) numLinesEst++;
 				return prev + cur.length + 1;
 			}, 0);
 			if (length > 50) {
 				output = braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
 			} else {
 				output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
 			}
 			return output;
 		} catch (e) {
 			return '[No string representation]';
 		}
 	}
 	return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};
var logMessage = function(message, level) {
	if ('logging' in forge.config) {
		var eyeCatcher = forge.config.logging.marker || 'FORGE';
	} else {
		var eyeCatcher = 'FORGE';
	}
	message = '[' + eyeCatcher + '] '
			+ (message.indexOf('\n') === -1 ? '' : '\n') + message;
	internal.priv.call("logging.log", {
		message: message,
		level: level
	});
	
	// Also log to the console if it exists.
	if (typeof console !== "undefined") {
		switch (level) {
			case 10:
				if (console.debug !== undefined && !(console.debug.toString && console.debug.toString().match('alert'))) {
					console.debug(message);
				}
				break;
			case 30:
				if (console.warn !== undefined && !(console.warn.toString && console.warn.toString().match('alert'))) {
					console.warn(message);
				}
				break;
			case 40:
			case 50:
				if (console.error !== undefined && !(console.error.toString && console.error.toString().match('alert'))) {
					console.error(message);
				}
				break;
			default:
			case 20:
				if (console.info !== undefined && !(console.info.toString && console.info.toString().match('alert'))) {
					console.info(message);
				}
				break;
		}
	}
};

var logNameToLevel = function(name, deflt) {
	if (name in forge.logging.LEVELS) {
		return forge.logging.LEVELS[name];
	} else {
		forge.logging.__logMessage('Unknown configured logging level: '+name);
		return deflt;
	}
};

var formatException = function(ex) {
	var exMsg = function(ex) {
		if (ex.message) {
			return ex.message;
		} else if (ex.description) {
			return ex.description;
		} else {
			return ''+ex;
		}
	}

	if (ex) {
		var str = '\nError: ' + exMsg(ex);
		try {
			if (ex.lineNumber) {
				str += ' on line number ' + ex.lineNumber;
			}
			if (ex.fileName) {
				var file = ex.fileName;
				str += ' in file ' + file.substr(file.lastIndexOf('/')+1);
			}
		} catch (e) {
		}
		if (ex.stack) {
			str += '\r\nStack trace:\r\n' + ex.stack;
		}
		return str;
	}
	return '';
};

forge['logging'] = {
	/**
	 * Log messages and exceptions to the console, if available
	 * @enum {number}
	 */
	LEVELS: {
		'ALL': 0,
		'DEBUG': 10,
		'INFO': 20,
		'WARNING': 30,
		'ERROR': 40,
		'CRITICAL': 50
	},

	'debug': function(message, exception) {
		//forge.logging.log(message, exception, forge.logging.LEVELS.DEBUG);
	},
	'info': function(message, exception) {
		forge.logging.log(message, exception, forge.logging.LEVELS.INFO);
	},
	'warning': function(message, exception) {
		forge.logging.log(message, exception, forge.logging.LEVELS.WARNING);
	},
	'error': function(message, exception) {
		forge.logging.log(message, exception, forge.logging.LEVELS.ERROR);
	},
	'critical': function(message, exception) {
		forge.logging.log(message, exception, forge.logging.LEVELS.CRITICAL);
	},

	/**
	 * Log a message onto the console. An eyecatcher of [YOUR_UUID] will be automatically prepended.
	 * See the "logging.level" configuration directive, which controls how verbose the logging will be.
	 * @param {string} message the text you want to log
	 * @param {Error} exception (optional) an Error instance to log
	 * @param {number} level: one of "api.logging.DEBUG", "api.logging.INFO", "api.logging.WARNING", "api.logging.ERROR" or "api.logging.CRITICAL"
	 */
	'log': function(message, exception, level) {

		if (typeof(level) === 'undefined') {
			var level = forge.logging.LEVELS.INFO;
		}
		try {
			var confLevel = logNameToLevel(forge.config.logging.level, forge.logging.LEVELS.ALL);
		} catch(e) {
			var confLevel = forge.logging.LEVELS.ALL;
		}
		if (level >= confLevel) {
			logMessage(inspectObject(message, false, 10) + formatException(exception), level);
		}
	}
};
forge['internal'] = {
	'ping': function (data, success, error) {
		internal.priv.call("internal.ping", {data: [data]}, success, error);
	},
	'call': internal.priv.call,
	'addEventListener': internal.addEventListener,
	listeners: internal.listeners
};forge['event'] = {
	'menuPressed': {
		addListener: function (callback, error) {
			internal.addEventListener('event.menuPressed', callback);
		}
	},
	'backPressed': {
		addListener: function (callback, error) {
			internal.addEventListener('event.backPressed', function () {
				callback(function () {
					internal.priv.call('event.backPressed_closeApplication', {});
				});
			});
		},
		preventDefault: function (success, error) {
			internal.priv.call('event.backPressed_preventDefault', {}, success, error);
		},
		restoreDefault: function (success, error) {
			internal.priv.call('event.backPressed_restoreDefault', {}, success, error);
		}
	},
	'messagePushed': {
		addListener: function (callback, error) {
			internal.addEventListener('event.messagePushed', callback);
		}
	},
	'orientationChange': {
		addListener: function (callback, error) {
			internal.addEventListener('event.orientationChange', callback);
			
			if (nullObj && internal.currentOrientation !== nullObj) {
				internal.priv.receive({
					event: 'event.orientationChange'
				});
			}
		}
	},
	'connectionStateChange': {
		addListener: function (callback, error) {
			internal.addEventListener('event.connectionStateChange', callback);
			
			if (nullObj && internal.currentConnectionState !== nullObj) {
				internal.priv.receive({
					event: 'event.connectionStateChange'
				});
			}
		}
	},
	'appPaused': {
		addListener: function (callback, error) {
			internal.addEventListener('event.appPaused', callback);
		}
	},
	'appResumed': {
		addListener: function (callback, error) {
			internal.addEventListener('event.appResumed', callback);
		}
	}
};
forge['reload'] = {
	'updateAvailable': function(success, error) {
		internal.priv.call("reload.updateAvailable", {}, success, error);
	},
	'update': function(success, error) {
		internal.priv.call("reload.update", {}, success, error);
	},
	'pauseUpdate': function(success, error) {
		internal.priv.call("reload.pauseUpdate", {}, success, error);
	},
	'applyNow': function(success, error) {
		forge.logging.error("reload.applyNow has been disabled, please see docs.trigger.io for more information.");
		error({message: "reload.applyNow has been disabled, please see docs.trigger.io for more information.", type: "UNAVAILABLE"});
	},
	'applyAndRestartApp': function(success, error) {
		internal.priv.call("reload.applyAndRestartApp", {}, success, error);
	},
	'switchStream': function(streamid, success, error) {
		internal.priv.call("reload.switchStream", {streamid: streamid}, success, error);
	},
	'updateReady': {
		addListener: function (callback, error) {
			internal.addEventListener('reload.updateReady', callback);
		}
	},
	'updateProgress': {
		addListener: function (callback, error) {
			internal.addEventListener('reload.updateProgress', callback);
		}
	}
};
forge['tools'] = {
	/**
	 * Creates an RFC 4122 compliant UUID.
	 *
	 * http://www.rfc-archive.org/getrfc.php?rfc=4122
	 *
	 * @return {string} A new UUID.
	 */
	'UUID': function() {
		// Implemented in JS on all platforms. No point going to native for this.
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0;
			var v = c == "x" ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		}).toUpperCase();
	},
	/**
	 * Resolve this name to a fully-qualified local or remote resource.
	 * The resource is not checked for existence.
	 * This method does not load the resource. For that, use "getPage()".
	 *
	 * For example, unqualified name: "my/resource.html"
	 * On Chrome: "chrome-extension://djggepjbfnnmhppnebibkbomfmnmkjln/my/resource.html"
	 *
	 * @param {string} resourceName Unqualified resource.
	 * @param {function(string)=} success Response data
	 * @param {function({message: string}=} error
	 */
	'getURL': function(resourceName, success, error) {
		internal.priv.call("tools.getURL", {
			name: resourceName.toString()
		}, success, error);
	}
};
var nullFunction = function () {};
/**
 * Override the internal.priv.call function to actually call a
 * method on the underlying private API, rather than serialize
 * and dispatch a method call.
 *
 * @param {string} methodName Name of the API method.
 * @param {*} params Key-values to pass to privileged code.
 * @param {function(*)} success Called if native method is successful.
 * @param {function({message: string}=} error
 */
internal.priv.call = function (methodName, params, success, error) {
	var strparams = "parameters could not be stringified";
	try {
		strparams = JSON.stringify(params);
	} catch (e) { }
	//forge.logging.debug("Received call to "+methodName+" with parameters: "+strparams);

	if (!success) {
		success = nullFunction;
	}
	if (!error) {
		error = nullFunction;
	}
	if (typeof methodName === 'undefined') {
		return error("internal.priv.call methodName is undefined");
	}
	// descend into API with dot-separated names
	var methodParts = methodName.split('.'),
	method = apiImpl;

	for (var i=0; i<methodParts.length && method; i++) {
		method = method[methodParts[i]];
	}

	if (typeof method !== 'function') {
		// tried to call non-existent API method
		return error({message: methodName+' does not exist', type: 'UNAVAILABLE'});
	}
	
	method(params, function () {
		if (methodName === "logging.log") {
			// Don't recurse the logger
		} else {
			var strargs = "arguments could not be stringified";
			try {
				strargs = JSON.stringify(arguments);
			} catch (e) { }
			forge.logging.debug('Call to '+methodName+'('+strparams+') success: '+strargs);
		}
		success.apply(this, arguments);
	}, function () {
		var strargs = "arguments could not be stringified";
		try {
			strargs = JSON.stringify(arguments);
		} catch (e) { }
		if (methodName === "logging.log") {
			// Don't recurse the logger
			alert('Call to '+methodName+'('+strparams+') failed: '+strargs);
		} else {
			forge.logging.warning('Call to '+methodName+'('+strparams+') failed: '+strargs);
		}
		error.apply(this, arguments);
	});
};

/**
 * Only available in the foreground.
 * @param {function({message: string}=} error
 */
forge.tabs.closeCurrent = function (error) {
	var msg = 'tabs.closeCurrent is intended to be used from foreground';
	error({message: msg, type: 'UNAVAILABLE'});
	forge.logging.error('Call to tabs.closeCurrent failed: '+msg);
};

//need to override this to prevent duplicate messages in the background
logMessage = function(message, level) {
	if ('logging' in forge.config) {
		var eyeCatcher = forge.config.logging.marker || 'FORGE';
	} else {
		var eyeCatcher = 'FORGE';
	}
	message = '[' + eyeCatcher + ' BG' + '] '
			+ (message.indexOf('\n') === -1 ? '' : '\n') + message;

	// Also log to the console if it exists.
	if (typeof console !== "undefined") {
		switch (level) {
			case 10:
				if (console.debug !== undefined && !(console.debug.toString && console.debug.toString().match('alert'))) {
					console.debug(message);
				}
				break;
			case 30:
				if (console.warn !== undefined && !(console.warn.toString && console.warn.toString().match('alert'))) {
					console.warn(message);
				}
				break;
			case 40:
			case 50:
				if (console.error !== undefined && !(console.error.toString && console.error.toString().match('alert'))) {
					console.error(message);
				}
				break;
			default:
			case 20:
				if (console.info !== undefined && !(console.info.toString && console.info.toString().match('alert'))) {
					console.info(message);
				}
				break;
		}
	}
}
/* eslint no-var:0 */
/* global internal, forge, chrome */
/*
 * For Chrome.
 */
var MAX_INIT_ATTEMPTS = 4 //When extension triggers more than five "fast reloads", then it would be disabled with warning

if (!chrome.runtime.onConnect) {
	var bgInitFail = parseInt(window.localStorage.getItem('bgInitFail') || 0)
	if (bgInitFail > MAX_INIT_ATTEMPTS) return console.error('too many bgInitFail', bgInitFail)
	bgInitFail++
	window.localStorage.setItem('bgInitFail', bgInitFail)
	return document.location.reload()
}

chrome.runtime.onMessage.addListener(function(msg, fromInfo, resp) {
	console.log(msg, fromInfo)
	resp('ok')
})

var callbacks = {},
	tabPorts = {}

forge.messageBuffer = []

chrome.runtime.onConnect.addListener(function(port) {
	if (port.name === 'bridge') {
		port.onMessage.addListener(function(msg) {
			function handleResult(status) {
				return function(content) {
					// create and send response message
					var reply = {callid: msg.callid, status: status, content: content};
					port.postMessage(reply);
				}
			}

			//to keep it simple I removed callback
			//later if we need this we can rewrite this part and support callback
			if(msg.method == 'message.toFocussed') {
				apiImpl.message.toFocussed(msg.params)
				return
			}
			internal.priv.call(
					msg.method, msg.params,
					handleResult('success'), handleResult('error')
			);
		});
	} else if(port.name === 'message:to-non-priv') {
		// Special request from non-priv to pass this message on to other non-priv pages
		port.onMessage.addListener(function(message) {
			forge.message.broadcast(message.type, message.content)
		});
	} else if(port.name === 'message:to-priv') {
		if(port.sender.tab) {
			var id = port.sender.tab.id
			tabPorts[id] = tabPorts[id] || []
			tabPorts[id].push(port) //can be several ports - iframes


			port.onDisconnect.addListener(function() {
				//console.log('closed port from tab', port.sender.tab.url)
				var ports = tabPorts[id]
				ports.splice(ports.indexOf(port), 1)
			})
		}

		port.onMessage.addListener(function(message) {
			//console.log('got message from tab', message)
			if(callbacks[message.callid]) {
				callbacks[message.callid](message.content)
				delete callbacks[message.callid]
			}

			var listeners = messageListeners[message.type] || []
			//we need to buffer messages until we haven't listeners on it
			if (!listeners.length && message.type) forge.messageBuffer.push({type: message.type, content: message.content, replay})
			for (var i = 0; i < listeners.length; i++) {
				listeners[i] && listeners[i](message.content, replay)
			}

			function replay(reply) {
				// send back reply
				// console.log('send reply', {content: reply, callid: message.callid})
				port.postMessage({content: reply, callid: message.callid}) // reply to tab
			}
		})
	}
});




/**
 * Add a listener for broadcast messages sent by non-privileged pages where your app is active.
 *
 * NOTE: unlike other methods, we assume that the message.listen method has been overriden
 * separately at the non-privilged level.
 *
 * @param {string} type (optional) an arbitrary string: if included, the callback will only be fired
 *  for messages broadcast with the same type; if omitted, the callback will be fired for all messages
 * @param {function} callback a function which will be called
 *  with the contents of relevant broadcast messages as
 *  its first argument
 * @param {function} error Not used.
 */

var messageListeners = {}
forge.message.listen = function(type, callback, error)
{
	if (typeof(type) === 'function') {
		// no type passed in: shift arguments left one
		error = callback;
		callback = type;
		type = null;
	}

	var listeners = messageListeners[type] = messageListeners[type] || []
	if(listeners.indexOf(callback)==-1) listeners.push(callback)
};
/**
 * Broadcast a message to all non-privileged pages where your extension is active.
 *
 * NOTE: this method requires the "tabs" permissions in your app configuration.
 *
 * @param {string} type an arbitrary string which limits the listeners which will receive this message
 * @param {*} content the message body which will be passed into active listeners
 * @param {function} callback reply function
 * @param {function} error Not used.
 */

var broadcastPorts = {}
forge.message.broadcast = function(type, content, callback, error) {
	var callid = forge.tools.UUID(), isCallbackSet = false

	chrome.windows.getAll({populate: true}, function (windows) {
		windows.forEach(function (win) {
			win.tabs.forEach(function (tab) {
				var ports = tabPorts[tab.id]
				//skip hosted pages
				if (tab.url.indexOf('chrome-extension:') != -1 || !ports || ports.length==0) return
				var msg = {type: type, callid: callid, content: content}
				if(!isCallbackSet && callback) {
					callbacks[callid] = callback
					isCallbackSet = true
				}
				//console.log('send message to tab', tab.id, msg)
				for (var i = 0; i < ports.length; i++) {
					ports[i].postMessage(msg)
				}
			})
		})
	})


	// var popupPort = chrome.runtime.connect()
	// // Also to popup
	// if (callback) {
	// 	popupPort.onMessage.addListener(function listener(message) {
	// 		// this is a reply from a recipient non-privileged page
	// 		callback(message);
	// 		popupPort.onMessage.removeListener(listener)
	// 	});
	// }
	// popupPort.postMessage({type: type, content: content});
}

/**
 * @return {boolean}
 */
forge.is.desktop = function() {
	return true;
};

/**
 * @return {boolean}
 */
forge.is.chrome = function() {
	return true;
};

// Private API implementation
var apiImpl = {
	message: {
		toFocussed: function(params, callback, error) {
			chrome.windows.getCurrent(function (win) {
				chrome.tabs.getSelected(win.id, function (tab) {
					var ports = tabPorts[tab.id]
					if(!ports) return
					var callid = forge.tools.UUID()
					if(callback) callbacks[callid] = callback
					var msg = {type: params.type, callid: callid, content: params.content}
					for (var i = 0; i < ports.length; i++) {
						ports[i].postMessage(msg)
					}
				});
			});
		}
	},
	notification: {
		create: function(params, success, error) {
      chrome.notifications.create('', {
        type: "basic",
        title: params.title,
        message: params.text,
        iconUrl: params.iconURL,
        buttons: params.buttons
      }, function(id) {
        success && chrome.notifications.onButtonClicked.addListener(success);
      });
		}
	},
	prefs: {
		get: function (params, success, error) {
			success(window.localStorage.getItem(params.key));
		},
		set: function (params, success, error) {
			success(window.localStorage.setItem(params.key, params.value));
		},
		keys: function (params, success, error) {
			var keys = [];
			for (var i=0; i<window.localStorage.length; i++) {
				keys.push(window.localStorage.key(i));
			}
			success(keys);
		},
		all: function (params, success, error) {
			var all = {};
			for (var i=0; i<window.localStorage.length; i++) {
				var key = window.localStorage.key(i)
				all[key] = window.localStorage.getItem(key);
			}
			success(all);
		},
		clear: function (params, success, error) 	{
			success(window.localStorage.removeItem(params.key));
		},
		clearAll: function (params, success, error) {
			success(window.localStorage.clear());
		}
	},
	request: {
		/**
		 * Implementation of api.ajax
		 *
		 * success and error callbacks are taken from positional arguments,
		 * not from the options.success and options.error values.
		 */
    ajax: function (params, success, error) {
      var http = new XMLHttpRequest()
      var headers = params.headers
      var data = params.data

      http.open(params.type, params.url, true)

      if (data) {
        if (!headers || !headers['Content-Type']) {
          http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
        }

        if (typeof data != 'string') {
          try {
            data = JSON.stringify(params.data)
          }
          catch (e) {
            data = null
            console.log(e)
          }
        }
      }

      if (headers) {
        Object.keys(headers).forEach(function(key) {
          http.setRequestHeader(key, headers[key])
        })
      }

      http.onreadystatechange = function() {
        if (http.readyState == 4) {
          if (http.status == 200 || http.status == 201)
            success(http.responseText, http.statusText, http)
          else
            error({message: http.statusText})
        }
      }

      http.send(data)
    }
	},
	tabs: {
    allTabs: function(params, success) {
      var tabs = [];

      chrome.windows.getAll({populate: true}, function (windows) {
        windows.forEach(function (win) {
          win.tabs.forEach(function (tab) {
              tabs.push({
                url: tab.url,
                id: tab.id,
                title: tab.title
              });
            });
          });

        success(tabs);
      });
    },
    reload: function(params, success) {
      var code = { code: "window.location.reload(true)" }
      try {
        chrome.tabs.executeScript(params.id, code)
      } catch(e) {
      }
    },
    getCurrentTabUrl: function(params, success) {
      chrome.tabs.getSelected(function(tab) {
        success(tab.url);
      });
    },
    open: function (params, success, error) {
      chrome.tabs.create({url: params.url, active: !params.keepFocus}, success);
    },
		updateCurrent: function (params, success, error) {
			chrome.tabs.update({url: params.url}, success);
		},
		closeCurrent: function (params, success, error) {
			if (params.hash) {
				var window, tab, url;

				chrome.windows.getAll({populate: true}, function (windows) {
					while (windows.length) {
						window = windows.pop();

						chrome.tabs.getAllInWindow(window.id, function (tabs) {
							while (tabs.length) {
								tab = tabs.pop();
								url = tab.url;

								if (url.indexOf(params.hash) > 0) {
									chrome.tabs.remove(tab.id);
									success();
									return;
								}
							}
						})
					}
				})
			} else {
				error({
					message: 'hash was not passed to as part of params to closeCurrent',
					type: 'UNEXPECTED_FAILURE'
				});
			}
		}
	},
	button: {
		setIcon: function (url, success, error) {
			// NOTE: When setIcon() is called, it specifies the relative path to an image inside the extension
			chrome.browserAction.setIcon({ "path": url } );
			success();
		},
		setURL: function (url, success, error) {
			if(url.length > 0) {
				if (url.indexOf('/') === 0) {
					url = 'src' + url;
				} else {
					url = 'src/' + url;
				}
			}

			chrome.browserAction.setPopup({popup: url});
			success();
		},
		onClicked: {
			addListener: function (params, callback, error) {
				chrome.browserAction.setPopup({popup: ''});
				chrome.browserAction.onClicked.addListener(callback);
			}
		},
		setBadge: function (number, success, error) {
			chrome.browserAction.setBadgeText({text: (number) ? number.toString() : ''});
			success();
		},
		setBadgeBackgroundColor: function (colorArray, success, error) {
			if (colorArray instanceof Array) {
				colorArray = {color:colorArray};
			}

			chrome.browserAction.setBadgeBackgroundColor(colorArray);
			success();
		},
		setTitle: function(title, success, error) {
			success(chrome.browserAction.setTitle({title: title}));
		}
	},
	logging: {
		log: function(params, success, error) {
			if (typeof console !== "undefined") {
				switch (params.level) {
					case 10:
						if (console.debug !== undefined && !(console.debug.toString && console.debug.toString().match('alert'))) {
							console.debug(params.message);
						}
						break;
					case 30:
						if (console.warn !== undefined && !(console.warn.toString && console.warn.toString().match('alert'))) {
							console.warn(params.message);
						}
						break;
					case 40:
					case 50:
						if (console.error !== undefined && !(console.error.toString && console.error.toString().match('alert'))) {
							console.error(params.message);
						}
						break;
					default:
					case 20:
						if (console.info !== undefined && !(console.info.toString && console.info.toString().match('alert'))) {
							console.info(params.message);
						}
						break;
				}
			}
			success();
		}
	},
	tools: {
		getURL: function(params, success, error) {
 			name = params.name.toString();
			if (name.indexOf("http://") === 0 || name.indexOf("https://") === 0) {
 				success(name);
			} else {
				success(chrome.runtime.getURL('src'+(name.substring(0,1) == '/' ? '' : '/')+name));
			}
		}
	},
  cookies: {
    /*
     * spec: https://developer.chrome.com/extensions/cookies#method-set
     */
    set: function(options, cb) {
      cb = cb || function () {}
      chrome.cookies.set(options, cb)
    },
    /*
     * spec: https://developer.chrome.com/extensions/cookies#method-getAll
     */
    get: function(p, cb) {
      chrome.cookies.getAll({domain: p.domain}, function(cookies) {
        for (var i = 0; i < cookies.length; i ++) {
          var cookie = cookies[i];

          if (p.name == cookie.name && p.path == cookie.path) {
            cb(cookie.value);
            return;
          }
        }
        cb()
      })
    },
    /*
     * spec: https://developer.chrome.com/extensions/cookies#event-onChanged
     */
    watch: function(p, cb) {
      chrome.cookies.onChanged.addListener(function(e) {
        var c = e.cookie
        if (!c || !c.name || p.path != c.path || p.name != c.name) return
        if (c.domain.indexOf(p.domain) == -1) return
        if (e.cause == "explicit") cb(c.value)
        if (e.cause == "expired_overwrite") cb()
      })
    }
  }
}
forge['cookies'] = {
  set: function (options, success, error) {
    internal.priv.call("cookies.set", options, success, error);
  },
  get: function (domain, path, name, success, error) {
    internal.priv.call("cookies.get", {
      domain: domain, path: path, name: name
    }, success, error);
  },
  watch: function (domain, path, name, updateCallback) {
    internal.priv.call("cookies.watch", {
      domain: domain, path: path, name: name
    }, updateCallback);
  }
};
// Expose our public API
window['forge'] = forge;	// Close variable scope from api-prefix.js
})();
