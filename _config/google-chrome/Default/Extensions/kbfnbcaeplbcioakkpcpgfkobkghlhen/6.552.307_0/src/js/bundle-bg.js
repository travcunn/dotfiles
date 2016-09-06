// modules are defined as an array
// [ module function, map of requireuires ]
//
// map of requireuires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the requireuire for previous bundles

(function outer (modules, cache, entry) {
    // Save the require from previous bundle to this closure if any
    var previousRequire = typeof require == "function" && require;

    function findProxyquireifyName() {
        var deps = Object.keys(modules)
            .map(function (k) { return modules[k][1]; });

        for (var i = 0; i < deps.length; i++) {
            var pq = deps[i]['proxyquireify'];
            if (pq) return pq;
        }
    }

    var proxyquireifyName = findProxyquireifyName();

    function newRequire(name, jumped){
        // Find the proxyquireify module, if present
        var pqify = (proxyquireifyName != null) && cache[proxyquireifyName];

        // Proxyquireify provides a separate cache that is used when inside
        // a proxyquire call, and is set to null outside a proxyquire call.
        // This allows the regular caching semantics to work correctly both
        // inside and outside proxyquire calls while keeping the cached
        // modules isolated.
        // When switching from one proxyquire call to another, it clears
        // the cache to prevent contamination between different sets
        // of stubs.
        var currentCache = (pqify && pqify.exports._cache) || cache;

        if(!currentCache[name]) {
            if(!modules[name]) {
                // if we cannot find the the module within our internal map or
                // cache jump to the current global require ie. the last bundle
                // that was added to the page.
                var currentRequire = typeof require == "function" && require;
                if (!jumped && currentRequire) return currentRequire(name, true);

                // If there are other bundles on this page the require from the
                // previous one is saved to 'previousRequire'. Repeat this as
                // many times as there are bundles until the module is found or
                // we exhaust the require chain.
                if (previousRequire) return previousRequire(name, true);
                var err = new Error('Cannot find module \'' + name + '\'');
                err.code = 'MODULE_NOT_FOUND';
                throw err;
            }
            var m = currentCache[name] = {exports:{}};

            // The normal browserify require function
            var req = function(x){
                var id = modules[name][1][x];
                return newRequire(id ? id : x);
            };

            // The require function substituted for proxyquireify
            var moduleRequire = function(x){
                var pqify = (proxyquireifyName != null) && cache[proxyquireifyName];
                // Only try to use the proxyquireify version if it has been `require`d
                if (pqify && pqify.exports._proxy) {
                    return pqify.exports._proxy(req, x);
                } else {
                    return req(x);
                }
            };

            modules[name][0].call(m.exports,moduleRequire,m,m.exports,outer,modules,currentCache,entry);
        }
        return currentCache[name].exports;
    }
    for(var i=0;i<entry.length;i++) newRequire(entry[i]);

    // Override the current require with this new one
    return newRequire;
})
({"/project/node_modules/browserify/node_modules/buffer/index.js":[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : (function () {
      function Bar () {}
      try {
        var arr = new Uint8Array(1)
        arr.foo = function () { return 42 }
        arr.constructor = Bar
        return arr.foo() === 42 && // typed array instances can be augmented
            arr.constructor === Bar && // constructor can be set
            typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
            arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
      } catch (e) {
        return false
      }
    })()

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = value
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = value
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = value
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = value
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = value
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = value
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00 | 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG52YXIgaXNBcnJheSA9IHJlcXVpcmUoJ2lzLWFycmF5JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbnZhciByb290UGFyZW50ID0ge31cblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgVXNlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogRHVlIHRvIHZhcmlvdXMgYnJvd3NlciBidWdzLCBzb21ldGltZXMgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiB3aWxsIGJlIHVzZWQgZXZlblxuICogd2hlbiB0aGUgYnJvd3NlciBzdXBwb3J0cyB0eXBlZCBhcnJheXMuXG4gKlxuICogTm90ZTpcbiAqXG4gKiAgIC0gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWAgaW5zdGFuY2VzLFxuICogICAgIFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4LlxuICpcbiAqICAgLSBTYWZhcmkgNS03IGxhY2tzIHN1cHBvcnQgZm9yIGNoYW5naW5nIHRoZSBgT2JqZWN0LnByb3RvdHlwZS5jb25zdHJ1Y3RvcmAgcHJvcGVydHlcbiAqICAgICBvbiBvYmplY3RzLlxuICpcbiAqICAgLSBDaHJvbWUgOS0xMCBpcyBtaXNzaW5nIHRoZSBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uLlxuICpcbiAqICAgLSBJRTEwIGhhcyBhIGJyb2tlbiBgVHlwZWRBcnJheS5wcm90b3R5cGUuc3ViYXJyYXlgIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYXJyYXlzIG9mXG4gKiAgICAgaW5jb3JyZWN0IGxlbmd0aCBpbiBzb21lIHNpdHVhdGlvbnMuXG5cbiAqIFdlIGRldGVjdCB0aGVzZSBidWdneSBicm93c2VycyBhbmQgc2V0IGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGAgdG8gYGZhbHNlYCBzbyB0aGV5XG4gKiBnZXQgdGhlIE9iamVjdCBpbXBsZW1lbnRhdGlvbiwgd2hpY2ggaXMgc2xvd2VyIGJ1dCBiZWhhdmVzIGNvcnJlY3RseS5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSBnbG9iYWwuVFlQRURfQVJSQVlfU1VQUE9SVCAhPT0gdW5kZWZpbmVkXG4gID8gZ2xvYmFsLlRZUEVEX0FSUkFZX1NVUFBPUlRcbiAgOiAoZnVuY3Rpb24gKCkge1xuICAgICAgZnVuY3Rpb24gQmFyICgpIHt9XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICAgICAgYXJyLmZvbyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH1cbiAgICAgICAgYXJyLmNvbnN0cnVjdG9yID0gQmFyXG4gICAgICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyICYmIC8vIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkXG4gICAgICAgICAgICBhcnIuY29uc3RydWN0b3IgPT09IEJhciAmJiAvLyBjb25zdHJ1Y3RvciBjYW4gYmUgc2V0XG4gICAgICAgICAgICB0eXBlb2YgYXJyLnN1YmFycmF5ID09PSAnZnVuY3Rpb24nICYmIC8vIGNocm9tZSA5LTEwIGxhY2sgYHN1YmFycmF5YFxuICAgICAgICAgICAgYXJyLnN1YmFycmF5KDEsIDEpLmJ5dGVMZW5ndGggPT09IDAgLy8gaWUxMCBoYXMgYnJva2VuIGBzdWJhcnJheWBcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfSkoKVxuXG5mdW5jdGlvbiBrTWF4TGVuZ3RoICgpIHtcbiAgcmV0dXJuIEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gICAgPyAweDdmZmZmZmZmXG4gICAgOiAweDNmZmZmZmZmXG59XG5cbi8qKlxuICogQ2xhc3M6IEJ1ZmZlclxuICogPT09PT09PT09PT09PVxuICpcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgYXJlIGF1Z21lbnRlZFxuICogd2l0aCBmdW5jdGlvbiBwcm9wZXJ0aWVzIGZvciBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgQVBJIGZ1bmN0aW9ucy4gV2UgdXNlXG4gKiBgVWludDhBcnJheWAgc28gdGhhdCBzcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdCByZXR1cm5zXG4gKiBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBCeSBhdWdtZW50aW5nIHRoZSBpbnN0YW5jZXMsIHdlIGNhbiBhdm9pZCBtb2RpZnlpbmcgdGhlIGBVaW50OEFycmF5YFxuICogcHJvdG90eXBlLlxuICovXG5mdW5jdGlvbiBCdWZmZXIgKGFyZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgQnVmZmVyKSkge1xuICAgIC8vIEF2b2lkIGdvaW5nIHRocm91Z2ggYW4gQXJndW1lbnRzQWRhcHRvclRyYW1wb2xpbmUgaW4gdGhlIGNvbW1vbiBjYXNlLlxuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkgcmV0dXJuIG5ldyBCdWZmZXIoYXJnLCBhcmd1bWVudHNbMV0pXG4gICAgcmV0dXJuIG5ldyBCdWZmZXIoYXJnKVxuICB9XG5cbiAgdGhpcy5sZW5ndGggPSAwXG4gIHRoaXMucGFyZW50ID0gdW5kZWZpbmVkXG5cbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIHJldHVybiBmcm9tTnVtYmVyKHRoaXMsIGFyZylcbiAgfVxuXG4gIC8vIFNsaWdodGx5IGxlc3MgY29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHRoaXMsIGFyZywgYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBhcmd1bWVudHNbMV0gOiAndXRmOCcpXG4gIH1cblxuICAvLyBVbnVzdWFsLlxuICByZXR1cm4gZnJvbU9iamVjdCh0aGlzLCBhcmcpXG59XG5cbmZ1bmN0aW9uIGZyb21OdW1iZXIgKHRoYXQsIGxlbmd0aCkge1xuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGxlbmd0aCkgfCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgdGhhdFtpXSA9IDBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAodGhhdCwgc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgLy8gQXNzdW1wdGlvbjogYnl0ZUxlbmd0aCgpIHJldHVybiB2YWx1ZSBpcyBhbHdheXMgPCBrTWF4TGVuZ3RoLlxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcblxuICB0aGF0LndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iamVjdCkpIHJldHVybiBmcm9tQnVmZmVyKHRoYXQsIG9iamVjdClcblxuICBpZiAoaXNBcnJheShvYmplY3QpKSByZXR1cm4gZnJvbUFycmF5KHRoYXQsIG9iamVjdClcblxuICBpZiAob2JqZWN0ID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdtdXN0IHN0YXJ0IHdpdGggbnVtYmVyLCBidWZmZXIsIGFycmF5IG9yIHN0cmluZycpXG4gIH1cblxuICBpZiAodHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChvYmplY3QuYnVmZmVyIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBmcm9tVHlwZWRBcnJheSh0aGF0LCBvYmplY3QpXG4gICAgfVxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikge1xuICAgICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih0aGF0LCBvYmplY3QpXG4gICAgfVxuICB9XG5cbiAgaWYgKG9iamVjdC5sZW5ndGgpIHJldHVybiBmcm9tQXJyYXlMaWtlKHRoYXQsIG9iamVjdClcblxuICByZXR1cm4gZnJvbUpzb25PYmplY3QodGhhdCwgb2JqZWN0KVxufVxuXG5mdW5jdGlvbiBmcm9tQnVmZmVyICh0aGF0LCBidWZmZXIpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYnVmZmVyLmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGJ1ZmZlci5jb3B5KHRoYXQsIDAsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5ICh0aGF0LCBhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuLy8gRHVwbGljYXRlIG9mIGZyb21BcnJheSgpIHRvIGtlZXAgZnJvbUFycmF5KCkgbW9ub21vcnBoaWMuXG5mdW5jdGlvbiBmcm9tVHlwZWRBcnJheSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgLy8gVHJ1bmNhdGluZyB0aGUgZWxlbWVudHMgaXMgcHJvYmFibHkgbm90IHdoYXQgcGVvcGxlIGV4cGVjdCBmcm9tIHR5cGVkXG4gIC8vIGFycmF5cyB3aXRoIEJZVEVTX1BFUl9FTEVNRU5UID4gMSBidXQgaXQncyBjb21wYXRpYmxlIHdpdGggdGhlIGJlaGF2aW9yXG4gIC8vIG9mIHRoZSBvbGQgQnVmZmVyIGNvbnN0cnVjdG9yLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyICh0aGF0LCBhcnJheSkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICBhcnJheS5ieXRlTGVuZ3RoXG4gICAgdGhhdCA9IEJ1ZmZlci5fYXVnbWVudChuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQgPSBmcm9tVHlwZWRBcnJheSh0aGF0LCBuZXcgVWludDhBcnJheShhcnJheSkpXG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbi8vIERlc2VyaWFsaXplIHsgdHlwZTogJ0J1ZmZlcicsIGRhdGE6IFsxLDIsMywuLi5dIH0gaW50byBhIEJ1ZmZlciBvYmplY3QuXG4vLyBSZXR1cm5zIGEgemVyby1sZW5ndGggYnVmZmVyIGZvciBpbnB1dHMgdGhhdCBkb24ndCBjb25mb3JtIHRvIHRoZSBzcGVjLlxuZnVuY3Rpb24gZnJvbUpzb25PYmplY3QgKHRoYXQsIG9iamVjdCkge1xuICB2YXIgYXJyYXlcbiAgdmFyIGxlbmd0aCA9IDBcblxuICBpZiAob2JqZWN0LnR5cGUgPT09ICdCdWZmZXInICYmIGlzQXJyYXkob2JqZWN0LmRhdGEpKSB7XG4gICAgYXJyYXkgPSBvYmplY3QuZGF0YVxuICAgIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgfVxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG5pZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuICBCdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxufVxuXG5mdW5jdGlvbiBhbGxvY2F0ZSAodGhhdCwgbGVuZ3RoKSB7XG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlLCBmb3IgYmVzdCBwZXJmb3JtYW5jZVxuICAgIHRoYXQgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkobGVuZ3RoKSlcbiAgICB0aGF0Ll9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgfSBlbHNlIHtcbiAgICAvLyBGYWxsYmFjazogUmV0dXJuIGFuIG9iamVjdCBpbnN0YW5jZSBvZiB0aGUgQnVmZmVyIGNsYXNzXG4gICAgdGhhdC5sZW5ndGggPSBsZW5ndGhcbiAgICB0aGF0Ll9pc0J1ZmZlciA9IHRydWVcbiAgfVxuXG4gIHZhciBmcm9tUG9vbCA9IGxlbmd0aCAhPT0gMCAmJiBsZW5ndGggPD0gQnVmZmVyLnBvb2xTaXplID4+PiAxXG4gIGlmIChmcm9tUG9vbCkgdGhhdC5wYXJlbnQgPSByb290UGFyZW50XG5cbiAgcmV0dXJuIHRoYXRcbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IGtNYXhMZW5ndGhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0ga01heExlbmd0aCgpKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIGtNYXhMZW5ndGgoKS50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChzdWJqZWN0LCBlbmNvZGluZykge1xuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgU2xvd0J1ZmZlcikpIHJldHVybiBuZXcgU2xvd0J1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihzdWJqZWN0LCBlbmNvZGluZylcbiAgZGVsZXRlIGJ1Zi5wYXJlbnRcbiAgcmV0dXJuIGJ1ZlxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyBtdXN0IGJlIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgdmFyIGkgPSAwXG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSBicmVha1xuXG4gICAgKytpXG4gIH1cblxuICBpZiAoaSAhPT0gbGVuKSB7XG4gICAgeCA9IGFbaV1cbiAgICB5ID0gYltpXVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICdyYXcnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFpc0FycmF5KGxpc3QpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdsaXN0IGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycy4nKVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBuZXcgQnVmZmVyKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWYgPSBuZXcgQnVmZmVyKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaXRlbSA9IGxpc3RbaV1cbiAgICBpdGVtLmNvcHkoYnVmLCBwb3MpXG4gICAgcG9zICs9IGl0ZW0ubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykgc3RyaW5nID0gJycgKyBzdHJpbmdcblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAobGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgIC8vIERlcHJlY2F0ZWRcbiAgICAgIGNhc2UgJ3Jhdyc6XG4gICAgICBjYXNlICdyYXdzJzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbi8vIHByZS1zZXQgZm9yIHZhbHVlcyB0aGF0IG1heSBleGlzdCBpbiB0aGUgZnV0dXJlXG5CdWZmZXIucHJvdG90eXBlLmxlbmd0aCA9IHVuZGVmaW5lZFxuQnVmZmVyLnByb3RvdHlwZS5wYXJlbnQgPSB1bmRlZmluZWRcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIHN0YXJ0ID0gc3RhcnQgfCAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA9PT0gSW5maW5pdHkgPyB0aGlzLmxlbmd0aCA6IGVuZCB8IDBcblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAoZW5kIDw9IHN0YXJ0KSByZXR1cm4gJydcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBiaW5hcnlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoIHwgMFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgaWYgKHRoaXMubGVuZ3RoID4gMCkge1xuICAgIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkubWF0Y2goLy57Mn0vZykuam9pbignICcpXG4gICAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICB9XG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIDBcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCkge1xuICBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIGJ5dGVPZmZzZXQgPj49IDBcblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVybiAtMVxuICBpZiAoYnl0ZU9mZnNldCA+PSB0aGlzLmxlbmd0aCkgcmV0dXJuIC0xXG5cbiAgLy8gTmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBNYXRoLm1heCh0aGlzLmxlbmd0aCArIGJ5dGVPZmZzZXQsIDApXG5cbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDApIHJldHVybiAtMSAvLyBzcGVjaWFsIGNhc2U6IGxvb2tpbmcgZm9yIGVtcHR5IHN0cmluZyBhbHdheXMgZmFpbHNcbiAgICByZXR1cm4gU3RyaW5nLnByb3RvdHlwZS5pbmRleE9mLmNhbGwodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICB9XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0KVxuICB9XG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHRoaXMsIHZhbCwgYnl0ZU9mZnNldClcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZih0aGlzLCBbIHZhbCBdLCBieXRlT2Zmc2V0KVxuICB9XG5cbiAgZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCkge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKHZhciBpID0gMDsgYnl0ZU9mZnNldCArIGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJbYnl0ZU9mZnNldCArIGldID09PSB2YWxbZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXhdKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsLmxlbmd0aCkgcmV0dXJuIGJ5dGVPZmZzZXQgKyBmb3VuZEluZGV4XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG4vLyBgZ2V0YCBpcyBkZXByZWNhdGVkXG5CdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIGdldCAob2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuZ2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy5yZWFkVUludDgob2Zmc2V0KVxufVxuXG4vLyBgc2V0YCBpcyBkZXByZWNhdGVkXG5CdWZmZXIucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIHNldCAodiwgb2Zmc2V0KSB7XG4gIGNvbnNvbGUubG9nKCcuc2V0KCkgaXMgZGVwcmVjYXRlZC4gQWNjZXNzIHVzaW5nIGFycmF5IGluZGV4ZXMgaW5zdGVhZC4nKVxuICByZXR1cm4gdGhpcy53cml0ZVVJbnQ4KHYsIG9mZnNldClcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICAvLyBtdXN0IGJlIGFuIGV2ZW4gbnVtYmVyIG9mIGRpZ2l0c1xuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuICBpZiAoc3RyTGVuICUgMiAhPT0gMCkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChpc05hTihwYXJzZWQpKSB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgaGV4IHN0cmluZycpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiaW5hcnlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCB8IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICAvLyBsZWdhY3kgd3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0LCBsZW5ndGgpIC0gcmVtb3ZlIGluIHYwLjEzXG4gIH0gZWxzZSB7XG4gICAgdmFyIHN3YXAgPSBlbmNvZGluZ1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgb2Zmc2V0ID0gbGVuZ3RoIHwgMFxuICAgIGxlbmd0aCA9IHN3YXBcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdhdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBiaW5hcnlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgYnl0ZXNbaSArIDFdICogMjU2KVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMCkgZW5kID0gMFxuICB9IGVsc2UgaWYgKGVuZCA+IGxlbikge1xuICAgIGVuZCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIHZhciBuZXdCdWZcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgbmV3QnVmID0gQnVmZmVyLl9hdWdtZW50KHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCkpXG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsaWNlTGVuID0gZW5kIC0gc3RhcnRcbiAgICBuZXdCdWYgPSBuZXcgQnVmZmVyKHNsaWNlTGVuLCB1bmRlZmluZWQpXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzbGljZUxlbjsgaSsrKSB7XG4gICAgICBuZXdCdWZbaV0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH1cblxuICBpZiAobmV3QnVmLmxlbmd0aCkgbmV3QnVmLnBhcmVudCA9IHRoaXMucGFyZW50IHx8IHRoaXNcblxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIHJlYWRJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiByZWFkRG91YmxlTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2J1ZmZlciBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndmFsdWUgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCksIDApXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDE2IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZiArIHZhbHVlICsgMVxuICBmb3IgKHZhciBpID0gMCwgaiA9IE1hdGgubWluKGJ1Zi5sZW5ndGggLSBvZmZzZXQsIDIpOyBpIDwgajsgaSsrKSB7XG4gICAgYnVmW29mZnNldCArIGldID0gKHZhbHVlICYgKDB4ZmYgPDwgKDggKiAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSkpKSA+Pj5cbiAgICAgIChsaXR0bGVFbmRpYW4gPyBpIDogMSAtIGkpICogOFxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbmZ1bmN0aW9uIG9iamVjdFdyaXRlVUludDMyIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbikge1xuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCA0KTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSA+Pj4gKGxpdHRsZUVuZGlhbiA/IGkgOiAzIC0gaSkgKiA4KSAmIDB4ZmZcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICAgIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSB2YWx1ZSA8IDAgPyAxIDogMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IHZhbHVlIDwgMCA/IDEgOiAwXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiB3cml0ZUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHZhbHVlID0gTWF0aC5mbG9vcih2YWx1ZSlcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MTYodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgM10gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDMyKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignaW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZVN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcbiAgdmFyIGlcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKGkgPSBsZW4gLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSBpZiAobGVuIDwgMTAwMCB8fCAhQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBhc2NlbmRpbmcgY29weSBmcm9tIHN0YXJ0XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0YXJnZXQuX3NldCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBzdGFydCArIGxlbiksIHRhcmdldFN0YXJ0KVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBmaWxsKHZhbHVlLCBzdGFydD0wLCBlbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbHVlLCBzdGFydCwgZW5kKSB7XG4gIGlmICghdmFsdWUpIHZhbHVlID0gMFxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQpIGVuZCA9IHRoaXMubGVuZ3RoXG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignZW5kIDwgc3RhcnQnKVxuXG4gIC8vIEZpbGwgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuXG4gIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuXG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3N0YXJ0IG91dCBvZiBib3VuZHMnKVxuICBpZiAoZW5kIDwgMCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2VuZCBvdXQgb2YgYm91bmRzJylcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSB2YWx1ZVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSB1dGY4VG9CeXRlcyh2YWx1ZS50b1N0cmluZygpKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgYEFycmF5QnVmZmVyYCB3aXRoIHRoZSAqY29waWVkKiBtZW1vcnkgb2YgdGhlIGJ1ZmZlciBpbnN0YW5jZS5cbiAqIEFkZGVkIGluIE5vZGUgMC4xMi4gT25seSBhdmFpbGFibGUgaW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEFycmF5QnVmZmVyLlxuICovXG5CdWZmZXIucHJvdG90eXBlLnRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiB0b0FycmF5QnVmZmVyICgpIHtcbiAgaWYgKHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJykge1xuICAgIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgICAgcmV0dXJuIChuZXcgQnVmZmVyKHRoaXMpKS5idWZmZXJcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMubGVuZ3RoKVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGJ1Zi5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMSkge1xuICAgICAgICBidWZbaV0gPSB0aGlzW2ldXG4gICAgICB9XG4gICAgICByZXR1cm4gYnVmLmJ1ZmZlclxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdCdWZmZXIudG9BcnJheUJ1ZmZlciBub3Qgc3VwcG9ydGVkIGluIHRoaXMgYnJvd3NlcicpXG4gIH1cbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgQlAgPSBCdWZmZXIucHJvdG90eXBlXG5cbi8qKlxuICogQXVnbWVudCBhIFVpbnQ4QXJyYXkgKmluc3RhbmNlKiAobm90IHRoZSBVaW50OEFycmF5IGNsYXNzISkgd2l0aCBCdWZmZXIgbWV0aG9kc1xuICovXG5CdWZmZXIuX2F1Z21lbnQgPSBmdW5jdGlvbiBfYXVnbWVudCAoYXJyKSB7XG4gIGFyci5jb25zdHJ1Y3RvciA9IEJ1ZmZlclxuICBhcnIuX2lzQnVmZmVyID0gdHJ1ZVxuXG4gIC8vIHNhdmUgcmVmZXJlbmNlIHRvIG9yaWdpbmFsIFVpbnQ4QXJyYXkgc2V0IG1ldGhvZCBiZWZvcmUgb3ZlcndyaXRpbmdcbiAgYXJyLl9zZXQgPSBhcnIuc2V0XG5cbiAgLy8gZGVwcmVjYXRlZFxuICBhcnIuZ2V0ID0gQlAuZ2V0XG4gIGFyci5zZXQgPSBCUC5zZXRcblxuICBhcnIud3JpdGUgPSBCUC53cml0ZVxuICBhcnIudG9TdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9Mb2NhbGVTdHJpbmcgPSBCUC50b1N0cmluZ1xuICBhcnIudG9KU09OID0gQlAudG9KU09OXG4gIGFyci5lcXVhbHMgPSBCUC5lcXVhbHNcbiAgYXJyLmNvbXBhcmUgPSBCUC5jb21wYXJlXG4gIGFyci5pbmRleE9mID0gQlAuaW5kZXhPZlxuICBhcnIuY29weSA9IEJQLmNvcHlcbiAgYXJyLnNsaWNlID0gQlAuc2xpY2VcbiAgYXJyLnJlYWRVSW50TEUgPSBCUC5yZWFkVUludExFXG4gIGFyci5yZWFkVUludEJFID0gQlAucmVhZFVJbnRCRVxuICBhcnIucmVhZFVJbnQ4ID0gQlAucmVhZFVJbnQ4XG4gIGFyci5yZWFkVUludDE2TEUgPSBCUC5yZWFkVUludDE2TEVcbiAgYXJyLnJlYWRVSW50MTZCRSA9IEJQLnJlYWRVSW50MTZCRVxuICBhcnIucmVhZFVJbnQzMkxFID0gQlAucmVhZFVJbnQzMkxFXG4gIGFyci5yZWFkVUludDMyQkUgPSBCUC5yZWFkVUludDMyQkVcbiAgYXJyLnJlYWRJbnRMRSA9IEJQLnJlYWRJbnRMRVxuICBhcnIucmVhZEludEJFID0gQlAucmVhZEludEJFXG4gIGFyci5yZWFkSW50OCA9IEJQLnJlYWRJbnQ4XG4gIGFyci5yZWFkSW50MTZMRSA9IEJQLnJlYWRJbnQxNkxFXG4gIGFyci5yZWFkSW50MTZCRSA9IEJQLnJlYWRJbnQxNkJFXG4gIGFyci5yZWFkSW50MzJMRSA9IEJQLnJlYWRJbnQzMkxFXG4gIGFyci5yZWFkSW50MzJCRSA9IEJQLnJlYWRJbnQzMkJFXG4gIGFyci5yZWFkRmxvYXRMRSA9IEJQLnJlYWRGbG9hdExFXG4gIGFyci5yZWFkRmxvYXRCRSA9IEJQLnJlYWRGbG9hdEJFXG4gIGFyci5yZWFkRG91YmxlTEUgPSBCUC5yZWFkRG91YmxlTEVcbiAgYXJyLnJlYWREb3VibGVCRSA9IEJQLnJlYWREb3VibGVCRVxuICBhcnIud3JpdGVVSW50OCA9IEJQLndyaXRlVUludDhcbiAgYXJyLndyaXRlVUludExFID0gQlAud3JpdGVVSW50TEVcbiAgYXJyLndyaXRlVUludEJFID0gQlAud3JpdGVVSW50QkVcbiAgYXJyLndyaXRlVUludDE2TEUgPSBCUC53cml0ZVVJbnQxNkxFXG4gIGFyci53cml0ZVVJbnQxNkJFID0gQlAud3JpdGVVSW50MTZCRVxuICBhcnIud3JpdGVVSW50MzJMRSA9IEJQLndyaXRlVUludDMyTEVcbiAgYXJyLndyaXRlVUludDMyQkUgPSBCUC53cml0ZVVJbnQzMkJFXG4gIGFyci53cml0ZUludExFID0gQlAud3JpdGVJbnRMRVxuICBhcnIud3JpdGVJbnRCRSA9IEJQLndyaXRlSW50QkVcbiAgYXJyLndyaXRlSW50OCA9IEJQLndyaXRlSW50OFxuICBhcnIud3JpdGVJbnQxNkxFID0gQlAud3JpdGVJbnQxNkxFXG4gIGFyci53cml0ZUludDE2QkUgPSBCUC53cml0ZUludDE2QkVcbiAgYXJyLndyaXRlSW50MzJMRSA9IEJQLndyaXRlSW50MzJMRVxuICBhcnIud3JpdGVJbnQzMkJFID0gQlAud3JpdGVJbnQzMkJFXG4gIGFyci53cml0ZUZsb2F0TEUgPSBCUC53cml0ZUZsb2F0TEVcbiAgYXJyLndyaXRlRmxvYXRCRSA9IEJQLndyaXRlRmxvYXRCRVxuICBhcnIud3JpdGVEb3VibGVMRSA9IEJQLndyaXRlRG91YmxlTEVcbiAgYXJyLndyaXRlRG91YmxlQkUgPSBCUC53cml0ZURvdWJsZUJFXG4gIGFyci5maWxsID0gQlAuZmlsbFxuICBhcnIuaW5zcGVjdCA9IEJQLmluc3BlY3RcbiAgYXJyLnRvQXJyYXlCdWZmZXIgPSBCUC50b0FycmF5QnVmZmVyXG5cbiAgcmV0dXJuIGFyclxufVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rXFwvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyaW5ndHJpbShzdHIpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHN0cmluZ3RyaW0gKHN0cikge1xuICBpZiAoc3RyLnRyaW0pIHJldHVybiBzdHIudHJpbSgpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSBsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwIHwgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG4iXX0=
},{"base64-js":"/project/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js","ieee754":"/project/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js","is-array":"/project/node_modules/browserify/node_modules/buffer/node_modules/is-array/index.js"}],"/project/node_modules/browserify/node_modules/buffer/node_modules/base64-js/lib/b64.js":[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],"/project/node_modules/browserify/node_modules/buffer/node_modules/ieee754/index.js":[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"/project/node_modules/browserify/node_modules/buffer/node_modules/is-array/index.js":[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],"/project/node_modules/deep-extend/lib/deep-extend.js":[function(require,module,exports){
(function (Buffer){
/*!
 * @description Recursive object extending
 * @author Viacheslav Lotsmanov <lotsmanov89@gmail.com>
 * @license MIT
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013-2015 Viacheslav Lotsmanov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

'use strict';

function isSpecificValue(val) {
	return (
		val instanceof Buffer
		|| val instanceof Date
		|| val instanceof RegExp
	) ? true : false;
}

function cloneSpecificValue(val) {
	if (val instanceof Buffer) {
		var x = new Buffer(val.length);
		val.copy(x);
		return x;
	} else if (val instanceof Date) {
		return new Date(val.getTime());
	} else if (val instanceof RegExp) {
		return new RegExp(val);
	} else {
		throw new Error('Unexpected situation');
	}
}

/**
 * Recursive cloning array.
 */
function deepCloneArray(arr) {
	var clone = [];
	arr.forEach(function (item, index) {
		if (typeof item === 'object' && item !== null) {
			if (Array.isArray(item)) {
				clone[index] = deepCloneArray(item);
			} else if (isSpecificValue(item)) {
				clone[index] = cloneSpecificValue(item);
			} else {
				clone[index] = deepExtend({}, item);
			}
		} else {
			clone[index] = item;
		}
	});
	return clone;
}

/**
 * Extening object that entered in first argument.
 *
 * Returns extended object or false if have no target object or incorrect type.
 *
 * If you wish to clone source object (without modify it), just use empty new
 * object as first argument, like this:
 *   deepExtend({}, yourObj_1, [yourObj_N]);
 */
var deepExtend = module.exports = function (/*obj_1, [obj_2], [obj_N]*/) {
	if (arguments.length < 1 || typeof arguments[0] !== 'object') {
		return false;
	}

	if (arguments.length < 2) {
		return arguments[0];
	}

	var target = arguments[0];

	// convert arguments to array and cut off target object
	var args = Array.prototype.slice.call(arguments, 1);

	var val, src, clone;

	args.forEach(function (obj) {
		// skip argument if it is array or isn't object
		if (typeof obj !== 'object' || Array.isArray(obj)) {
			return;
		}

		Object.keys(obj).forEach(function (key) {
			src = target[key]; // source value
			val = obj[key]; // new value

			// recursion prevention
			if (val === target) {
				return;

			/**
			 * if new value isn't object then just overwrite by new value
			 * instead of extending.
			 */
			} else if (typeof val !== 'object' || val === null) {
				target[key] = val;
				return;

			// just clone arrays (and recursive clone objects inside)
			} else if (Array.isArray(val)) {
				target[key] = deepCloneArray(val);
				return;

			// custom cloning and overwrite for specific objects
			} else if (isSpecificValue(val)) {
				target[key] = cloneSpecificValue(val);
				return;

			// overwrite by new value if source isn't object or array
			} else if (typeof src !== 'object' || src === null || Array.isArray(src)) {
				target[key] = deepExtend({}, val);
				return;

			// source value and new value is objects both, extending...
			} else {
				target[key] = deepExtend(src, val);
				return;
			}
		});
	});

	return target;
}

}).call(this,require("buffer").Buffer)
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9kZWVwLWV4dGVuZC9saWIvZGVlcC1leHRlbmQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIEBkZXNjcmlwdGlvbiBSZWN1cnNpdmUgb2JqZWN0IGV4dGVuZGluZ1xuICogQGF1dGhvciBWaWFjaGVzbGF2IExvdHNtYW5vdiA8bG90c21hbm92ODlAZ21haWwuY29tPlxuICogQGxpY2Vuc2UgTUlUXG4gKlxuICogVGhlIE1JVCBMaWNlbnNlIChNSVQpXG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDEzLTIwMTUgVmlhY2hlc2xhdiBMb3RzbWFub3ZcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mXG4gKiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluXG4gKiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvXG4gKiB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZlxuICogdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLFxuICogc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTXG4gKiBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1JcbiAqIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUlxuICogSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU5cbiAqIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBpc1NwZWNpZmljVmFsdWUodmFsKSB7XG5cdHJldHVybiAoXG5cdFx0dmFsIGluc3RhbmNlb2YgQnVmZmVyXG5cdFx0fHwgdmFsIGluc3RhbmNlb2YgRGF0ZVxuXHRcdHx8IHZhbCBpbnN0YW5jZW9mIFJlZ0V4cFxuXHQpID8gdHJ1ZSA6IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBjbG9uZVNwZWNpZmljVmFsdWUodmFsKSB7XG5cdGlmICh2YWwgaW5zdGFuY2VvZiBCdWZmZXIpIHtcblx0XHR2YXIgeCA9IG5ldyBCdWZmZXIodmFsLmxlbmd0aCk7XG5cdFx0dmFsLmNvcHkoeCk7XG5cdFx0cmV0dXJuIHg7XG5cdH0gZWxzZSBpZiAodmFsIGluc3RhbmNlb2YgRGF0ZSkge1xuXHRcdHJldHVybiBuZXcgRGF0ZSh2YWwuZ2V0VGltZSgpKTtcblx0fSBlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBSZWdFeHApIHtcblx0XHRyZXR1cm4gbmV3IFJlZ0V4cCh2YWwpO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvcignVW5leHBlY3RlZCBzaXR1YXRpb24nKTtcblx0fVxufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZSBjbG9uaW5nIGFycmF5LlxuICovXG5mdW5jdGlvbiBkZWVwQ2xvbmVBcnJheShhcnIpIHtcblx0dmFyIGNsb25lID0gW107XG5cdGFyci5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtLCBpbmRleCkge1xuXHRcdGlmICh0eXBlb2YgaXRlbSA9PT0gJ29iamVjdCcgJiYgaXRlbSAhPT0gbnVsbCkge1xuXHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoaXRlbSkpIHtcblx0XHRcdFx0Y2xvbmVbaW5kZXhdID0gZGVlcENsb25lQXJyYXkoaXRlbSk7XG5cdFx0XHR9IGVsc2UgaWYgKGlzU3BlY2lmaWNWYWx1ZShpdGVtKSkge1xuXHRcdFx0XHRjbG9uZVtpbmRleF0gPSBjbG9uZVNwZWNpZmljVmFsdWUoaXRlbSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjbG9uZVtpbmRleF0gPSBkZWVwRXh0ZW5kKHt9LCBpdGVtKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0Y2xvbmVbaW5kZXhdID0gaXRlbTtcblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gY2xvbmU7XG59XG5cbi8qKlxuICogRXh0ZW5pbmcgb2JqZWN0IHRoYXQgZW50ZXJlZCBpbiBmaXJzdCBhcmd1bWVudC5cbiAqXG4gKiBSZXR1cm5zIGV4dGVuZGVkIG9iamVjdCBvciBmYWxzZSBpZiBoYXZlIG5vIHRhcmdldCBvYmplY3Qgb3IgaW5jb3JyZWN0IHR5cGUuXG4gKlxuICogSWYgeW91IHdpc2ggdG8gY2xvbmUgc291cmNlIG9iamVjdCAod2l0aG91dCBtb2RpZnkgaXQpLCBqdXN0IHVzZSBlbXB0eSBuZXdcbiAqIG9iamVjdCBhcyBmaXJzdCBhcmd1bWVudCwgbGlrZSB0aGlzOlxuICogICBkZWVwRXh0ZW5kKHt9LCB5b3VyT2JqXzEsIFt5b3VyT2JqX05dKTtcbiAqL1xudmFyIGRlZXBFeHRlbmQgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgvKm9ial8xLCBbb2JqXzJdLCBbb2JqX05dKi8pIHtcblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAxIHx8IHR5cGVvZiBhcmd1bWVudHNbMF0gIT09ICdvYmplY3QnKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG5cdFx0cmV0dXJuIGFyZ3VtZW50c1swXTtcblx0fVxuXG5cdHZhciB0YXJnZXQgPSBhcmd1bWVudHNbMF07XG5cblx0Ly8gY29udmVydCBhcmd1bWVudHMgdG8gYXJyYXkgYW5kIGN1dCBvZmYgdGFyZ2V0IG9iamVjdFxuXHR2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cblx0dmFyIHZhbCwgc3JjLCBjbG9uZTtcblxuXHRhcmdzLmZvckVhY2goZnVuY3Rpb24gKG9iaikge1xuXHRcdC8vIHNraXAgYXJndW1lbnQgaWYgaXQgaXMgYXJyYXkgb3IgaXNuJ3Qgb2JqZWN0XG5cdFx0aWYgKHR5cGVvZiBvYmogIT09ICdvYmplY3QnIHx8IEFycmF5LmlzQXJyYXkob2JqKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG5cdFx0XHRzcmMgPSB0YXJnZXRba2V5XTsgLy8gc291cmNlIHZhbHVlXG5cdFx0XHR2YWwgPSBvYmpba2V5XTsgLy8gbmV3IHZhbHVlXG5cblx0XHRcdC8vIHJlY3Vyc2lvbiBwcmV2ZW50aW9uXG5cdFx0XHRpZiAodmFsID09PSB0YXJnZXQpIHtcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHQvKipcblx0XHRcdCAqIGlmIG5ldyB2YWx1ZSBpc24ndCBvYmplY3QgdGhlbiBqdXN0IG92ZXJ3cml0ZSBieSBuZXcgdmFsdWVcblx0XHRcdCAqIGluc3RlYWQgb2YgZXh0ZW5kaW5nLlxuXHRcdFx0ICovXG5cdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiB2YWwgIT09ICdvYmplY3QnIHx8IHZhbCA9PT0gbnVsbCkge1xuXHRcdFx0XHR0YXJnZXRba2V5XSA9IHZhbDtcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHQvLyBqdXN0IGNsb25lIGFycmF5cyAoYW5kIHJlY3Vyc2l2ZSBjbG9uZSBvYmplY3RzIGluc2lkZSlcblx0XHRcdH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG5cdFx0XHRcdHRhcmdldFtrZXldID0gZGVlcENsb25lQXJyYXkodmFsKTtcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHQvLyBjdXN0b20gY2xvbmluZyBhbmQgb3ZlcndyaXRlIGZvciBzcGVjaWZpYyBvYmplY3RzXG5cdFx0XHR9IGVsc2UgaWYgKGlzU3BlY2lmaWNWYWx1ZSh2YWwpKSB7XG5cdFx0XHRcdHRhcmdldFtrZXldID0gY2xvbmVTcGVjaWZpY1ZhbHVlKHZhbCk7XG5cdFx0XHRcdHJldHVybjtcblxuXHRcdFx0Ly8gb3ZlcndyaXRlIGJ5IG5ldyB2YWx1ZSBpZiBzb3VyY2UgaXNuJ3Qgb2JqZWN0IG9yIGFycmF5XG5cdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBzcmMgIT09ICdvYmplY3QnIHx8IHNyYyA9PT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KHNyYykpIHtcblx0XHRcdFx0dGFyZ2V0W2tleV0gPSBkZWVwRXh0ZW5kKHt9LCB2YWwpO1xuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdC8vIHNvdXJjZSB2YWx1ZSBhbmQgbmV3IHZhbHVlIGlzIG9iamVjdHMgYm90aCwgZXh0ZW5kaW5nLi4uXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0YXJnZXRba2V5XSA9IGRlZXBFeHRlbmQoc3JjLCB2YWwpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fSk7XG5cdH0pO1xuXG5cdHJldHVybiB0YXJnZXQ7XG59XG4iXX0=
},{"buffer":"/project/node_modules/browserify/node_modules/buffer/index.js"}],"/project/src/js/lib/bg/api.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _API,
    _this = this;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = Init;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _forge = require('../forge');

var _forge2 = _interopRequireDefault(_forge);

var _prefs = require('../prefs');

var _prefs2 = _interopRequireDefault(_prefs);

var _message = require('../message');

var _message2 = _interopRequireDefault(_message);

var _util = require('../util');

var _location = require('../location');

var _trackingIndex = require('../tracking/index');

var _trackingIndex2 = _interopRequireDefault(_trackingIndex);

var _auth = require('./auth');

var _auth2 = _interopRequireDefault(_auth);

var _offline = require('./offline');

var _offline2 = _interopRequireDefault(_offline);

var _chrome = require('./chrome');

var _socket = require('../socket');

var _pageConfig = require('../page-config');

var _pageConfig2 = _interopRequireDefault(_pageConfig);

var _localforage = require('localforage');

var _localforage2 = _interopRequireDefault(_localforage);

function Init() {
  var msg = arguments.length <= 0 || arguments[0] === undefined ? _message2['default'] : arguments[0];

  Object.keys(API).forEach(function (type) {
    return msg.on(type, API[type], null, true);
  });

  proccessMessageBuffer();

  var offline = (0, _offline2['default'])();

  offline.on('online', function () {
    _message2['default'].emitTabs('online', {});
    _trackingIndex2['default'].call('felog.info', 'network_online');
  });

  offline.on('offline', function () {
    _message2['default'].emitTabs('offline', {});
    _trackingIndex2['default'].call('felog.info', 'network_offline');
  });
}

function proccessMessageBuffer() {
  var buff = _forge2['default'].messageBuffer;

  if (!buff || !buff.length) return;

  console.warn('proccess buffered messages', buff.slice());
  _trackingIndex2['default'].call('felog.info', 'process_buffered_messages', { count: buff.length });

  buff.forEach(function (_ref) {
    var type = _ref.type;
    var content = _ref.content;
    var replay = _ref.replay;

    try {
      API[type] && API[type](content, replay);
    } catch (e) {
      console.warn('possible message from closed tab', e);
    }
  });

  buff.length = 0;
}

var syncStore = new Map();
var SYNC_TIMEOUT = 30000;

function syncTimer() {
  var timer = setTimeout(function () {
    _trackingIndex2['default'].call('felog.error', 'stability.bg_call_timeout_on_response');
  }, SYNC_TIMEOUT);
  return function () {
    return clearTimeout(timer);
  };
}

function stopTimer(id) {
  if (!syncStore.has(id)) return;
  syncStore.get(id)();
  syncStore['delete'](id);
}

var API = (_API = {
  sync: function sync(data, cb) {
    if (data && data.id) {
      stopTimer(data.id);
      syncStore.set(data.id, syncTimer());
    }
    cb(true);
  },
  sync2: function sync2(_ref2, cb) {
    var id = _ref2.id;

    stopTimer(id);
    cb(true);
  }

}, _defineProperty(_API, 'current-domain', function currentDomain(domain) {
  _prefs2['default'].set('domain', domain);
}), _defineProperty(_API, 'user:refresh', function userRefresh(data, cb) {
  if (data === undefined) data = {};
  var lazy, loginDate, unixTime, result;
  return regeneratorRuntime.async(function userRefresh$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        lazy = data.lazy;
        context$1$0.next = 3;
        return regeneratorRuntime.awrap(_prefs2['default'].get('loginDate'));

      case 3:
        loginDate = context$1$0.sent;

        unixTime = function unixTime(time) {
          return (time ? new Date(time) : new Date()).getTime();
        };

        if (!(lazy && loginDate && unixTime() - unixTime(loginDate) < 30 * 60 * 1000)) {
          context$1$0.next = 8;
          break;
        }

        console.log('user refresh cache hit!');
        return context$1$0.abrupt('return', cb());

      case 8:
        console.log('user refresh get session', unixTime(), unixTime(loginDate));
        context$1$0.next = 11;
        return regeneratorRuntime.awrap(_auth2['default'].login());

      case 11:
        result = context$1$0.sent;

        cb(result && result.error);

      case 13:
      case 'end':
        return context$1$0.stop();
    }
  }, null, _this);
}), _defineProperty(_API, 'signin', function signin(data, cb) {
  return _auth2['default'].signin(data).then(cb);
}), _defineProperty(_API, 'signup', function signup(data, cb) {
  return _auth2['default'].signup(data).then(cb);
}), _defineProperty(_API, 'ask-chrome-permissions', function askChromePermissions(permissions, cb) {
  window.chrome.permissions.request({ permissions: permissions }, cb);
}), _defineProperty(_API, 'contains-chrome-permissions', function containsChromePermissions(permissions, cb) {
  window.chrome.permissions.contains({ permissions: permissions }, cb);
}), _defineProperty(_API, 'get-domain', function getDomain(data, cb) {
  return (0, _location.getDomain)(cb);
}), _defineProperty(_API, 'get-page-config', function getPageConfig(_ref3, cb) {
  var noupdate = _ref3.noupdate;
  return _pageConfig2['default'].load(noupdate).then(cb);
}), _defineProperty(_API, 'set-settings', function setSettings(settings) {
  _auth2['default'].setSettings(settings);
  _prefs2['default'].set('settings', settings);
}), _defineProperty(_API, 'open-url', function openUrl(url) {
  return _forge2['default'].tabs.open(url);
}), _defineProperty(_API, 'page-opened', function pageOpened() {
  _trackingIndex2['default'].fire('daily-ping');
  (0, _location.getDomain)(_chrome.setUninstallURL);
}), _defineProperty(_API, 'external:changed-plan', function externalChangedPlan() {
  return regeneratorRuntime.async(function externalChangedPlan$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        _trackingIndex2['default'].call('felog.info', 'external.changed-plan');
        context$1$0.next = 3;
        return regeneratorRuntime.awrap(_auth2['default'].login());

      case 3:
        _message2['default'].emitTabs('changed-plan');

      case 4:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_API, 'external:changed-user', function externalChangedUser() {
  _trackingIndex2['default'].call('felog.info', 'external.changed-user');
  _auth2['default'].login();
}), _defineProperty(_API, 'external:editor-fix', function externalEditorFix() {
  _trackingIndex2['default'].call('felog.info', 'external.editor-fix');
  _prefs2['default'].incFixed();
}), _defineProperty(_API, 'external:cleanup', function externalCleanup() {
  var preserve, values;
  return regeneratorRuntime.async(function externalCleanup$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        _trackingIndex2['default'].call('felog.info', 'external.cleanup');
        preserve = ['extensionInstallDate', 'seenNewsVersion', 'referralNewsBadge', 'version'];
        context$1$0.next = 4;
        return regeneratorRuntime.awrap(_prefs2['default'].get(preserve));

      case 4:
        values = context$1$0.sent;

        _prefs2['default'].clearAll();
        _prefs2['default'].set(preserve.reduce(function (obj, key) {
          return _extends({}, obj, _defineProperty({}, key, values[key]));
        }, { enabledDefs: false }));
        _auth2['default'].login();

      case 8:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _API);

exports.API = API;
if (!"true") {
  var _Object$assign;

  Object.assign(API, (_Object$assign = {}, _defineProperty(_Object$assign, 'bg-reload', function bgReload() {
    return (0, _util.bgPageReload)();
  }), _defineProperty(_Object$assign, 'reset', function reset() {
    console.log('RESET PREFS');
    _prefs2['default'].clearAll();
    _localforage2['default'].clear();
  }), _defineProperty(_Object$assign, 'get-tracker-log', function getTrackerLog(data, cb) {
    cb(_trackingIndex2['default'].getLog());
  }), _defineProperty(_Object$assign, 'get-capi-log', function getCapiLog(data, cb) {
    var log = (0, _socket.getLog)();
    console.log('GETTING CAPI LOG', log);
    cb(log);
  }), _defineProperty(_Object$assign, 'get-extid', function getExtid(data, cb) {
    return cb(window.chrome ? window.chrome.runtime.id : null);
  }), _defineProperty(_Object$assign, 'set-localforage', function setLocalforage(data, cb) {
    console.log('set-localforage', data);
    _localforage2['default'].setItem(data.key, data.value).then(cb);
  }), _defineProperty(_Object$assign, 'get-localforage', function getLocalforage(data, cb) {
    var value;
    return regeneratorRuntime.async(function getLocalforage$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          context$1$0.next = 2;
          return regeneratorRuntime.awrap(_localforage2['default'].getItem(data.key));

        case 2:
          value = context$1$0.sent;

          cb('localforage', { key: data.key, value: value });

        case 4:
        case 'end':
          return context$1$0.stop();
      }
    }, null, _this);
  }), _Object$assign));
}

},{"../forge":"/project/src/js/lib/forge.js","../location":"/project/src/js/lib/location.js","../message":"/project/src/js/lib/message.js","../page-config":"/project/src/js/lib/page-config/index.js","../prefs":"/project/src/js/lib/prefs.js","../socket":"/project/src/js/lib/socket.js","../tracking/index":"/project/src/js/lib/tracking/index.js","../util":"/project/src/js/lib/util.js","./auth":"/project/src/js/lib/bg/auth.js","./chrome":"/project/src/js/lib/bg/chrome.js","./offline":"/project/src/js/lib/bg/offline.js","localforage":"localforage"}],"/project/src/js/lib/bg/auth.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _forge = require('../forge');

var _forge2 = _interopRequireDefault(_forge);

var _config = require('../config');

var _prefs = require('../prefs');

var _prefs2 = _interopRequireDefault(_prefs);

var _request = require('../request');

var _cookie = require('./cookie');

var _cookie2 = _interopRequireDefault(_cookie);

var _message = require('../message');

var _message2 = _interopRequireDefault(_message);

var _trackingIndex = require('../tracking/index');

var _util = require('../util');

exports['default'] = (function Auth() {
  var LOGIN_BY_COOKIE_CHANGE_TIMEOUT = 10000;
  var trackingInitialized = undefined,
      watcher = undefined;

  _cookie2['default'].watchToken(runCookieWatch);

  var safariTabsCount = 0;

  return {
    login: login,
    signin: signin,
    signup: signup,
    setSettings: setSettings
  };

  function requestError(e) {
    (0, _trackingIndex.call)('felog.warn', 'ajax_error', { e: e });
    console.error('request failed', e);
    throw e;
  }

  function login() {
    var user;
    return regeneratorRuntime.async(function login$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          resetCookieWatch();
          context$2$0.prev = 1;
          context$2$0.next = 4;
          return regeneratorRuntime.awrap(fetchUser());

        case 4:
          user = context$2$0.sent;

          console.log('login with', user);
          _message2['default'].emitTabs('user:update');
          return context$2$0.abrupt('return', user);

        case 10:
          context$2$0.prev = 10;
          context$2$0.t0 = context$2$0['catch'](1);

          _prefs2['default'].set('loginDate', 0);
          (0, _trackingIndex.call)('statsc.ui.increment', 'stability:user_login_error');
          (0, _trackingIndex.call)('felog.error', 'user_login_error', context$2$0.t0);
          return context$2$0.abrupt('return', { error: context$2$0.t0.message });

        case 16:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this, [[1, 10]]);
  }

  function authRequest(url, data, successMetric) {
    var response;
    return regeneratorRuntime.async(function authRequest$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          response = undefined;
          context$2$0.prev = 1;
          context$2$0.next = 4;
          return regeneratorRuntime.awrap((0, _request.fetch)(url, {
            body: (0, _request.paramStr)(data),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'post'
          }));

        case 4:
          response = context$2$0.sent;

          if (response.error) {
            context$2$0.next = 9;
            break;
          }

          context$2$0.next = 8;
          return regeneratorRuntime.awrap(login());

        case 8:
          (0, _trackingIndex.fire)(successMetric);

        case 9:
          context$2$0.next = 15;
          break;

        case 11:
          context$2$0.prev = 11;
          context$2$0.t0 = context$2$0['catch'](1);

          console.warn('auth error', context$2$0.t0);
          response = { error: context$2$0.t0.message };

        case 15:
          return context$2$0.abrupt('return', response);

        case 16:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this, [[1, 11]]);
  }

  function signin(data) {
    return authRequest(_config.URLS.authSignin, data, 'app_signin_success');
  }

  function signup(data) {
    return authRequest(_config.URLS.authSignup, data, 'app_signup_success');
  }

  function setSettings(data) {
    if (!(data instanceof Object)) return;
    return (0, _request.fetch)(_config.URLS.authSettings, { data: data, method: 'post' });
  }

  function userOpts() {
    var containerId = window.tracker && window.tracker.gnar.meta().containerId,
        app = (0, _util.getBrowser)() + 'Ext';

    return {
      data: {
        field: ['mixpanel.distinct_id', 'stat_feedback_ACCEPT'],
        app: app,
        containerId: containerId
      } };
  }

  function safariSetGrauth() {
    if (!(0, _util.isSafari)()) return Promise.resolve();

    return (0, _request.fetch)(_config.URLS.authUser, userOpts())['catch'](function (err) {
      if (err == 'user_not_authorized') return safariHack();
      throw new Error(err);
    });
  }

  function safariHack() {
    return new Promise(function (resolve, reject) {
      if (safariTabsCount > 1) {
        (0, _trackingIndex.call)('felog.error', 'too_many_tabs', {
          tabCount: safariTabsCount,
          cookiesEnabled: window.navigator.cookieEnabled,
          cookies: document.cookie
        });
        resolve();
      } else {
        _forge2['default'].tabs.open(_config.URLS.authCreatePage, true, resolve, reject);
        safariTabsCount++;
      }
    });
  }

  function fetchUserOrAnonymous(user) {
    if (user && user.type != 'navigate') return user;

    return (0, _request.fetch)(_config.URLS.userOrAnonymous, userOpts());
  }

  function fetchUser() {
    (0, _trackingIndex.call)('felog.info', 'auth_request', { type: 'fetchUser' });

    return safariSetGrauth().then(fetchUserOrAnonymous).then(function (user) {
      user.token = user.grauth;
      user.premium = user.type == 'Premium';
      user.fixed_errors = user.customFields && user.customFields.stat_feedback_ACCEPT || '0'; //eslint-disable-line

      return user;
    }).then(fetchMimic).then(setUser)['catch'](requestError);
  }

  function fetchMimic(data) {
    if (data.anonymous) return data;

    return (0, _request.fetch)(_config.URLS.dapiMimic).then(function (mimic) {
      data.mimic = mimic && mimic.groups ? mimic.groups : [];

      //data.mimic = ['referral_gmail', 'referral_gbutton', 'referral_popup']
      return data;
    })['catch'](function (error) {
      (0, _trackingIndex.call)('felog.warn', 'fetch_mimic_fail', { error: error });
      data.mimic = [];
      return data;
    });
  }

  function setUser(data) {
    var _ref, id, email, anonymous, mimic;

    return regeneratorRuntime.async(function setUser$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          (0, _trackingIndex.call)('felog.info', 'auth_request', { type: 'setUser' });

          context$2$0.next = 3;
          return regeneratorRuntime.awrap(_prefs2['default'].get(['id', 'email', 'anonymous']));

        case 3:
          _ref = context$2$0.sent;
          id = _ref.id;
          email = _ref.email;
          anonymous = _ref.anonymous;

          if (email && !anonymous && data.anonymous) {
            (0, _trackingIndex.call)('felog.warn', 'unexpected_user_convert_to_anonymous', { email: email });
          }

          mimic = data.mimic;

          data.ext2 = mimic && mimic.length && _config.ext2groups.some(function (prop) {
            return mimic.includes(prop);
          });
          // data.ext2 = true
          _config.userFields.forEach(function (p) {
            return _prefs2['default'].set(p, data[p]);
          });
          _prefs2['default'].set('loginDate', new Date());

          if (id != data.id) {
            trackingInitialized = false;
          }

          initTracking(data);

          return context$2$0.abrupt('return', data);

        case 15:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this);
  }

  function initTracking(_ref2) {
    var id = _ref2.id;
    var name = _ref2.name;
    var anonymous = _ref2.anonymous;
    var premium = _ref2.premium;
    var email = _ref2.email;
    var type = _ref2.type;
    var ext2 = _ref2.ext2;

    if (trackingInitialized) return;

    trackingInitialized = true;

    (0, _trackingIndex.call)('gnar.setUser', id);
    (0, _trackingIndex.call)('mixpanel.initProps');
    (0, _trackingIndex.call)('felog.setUser', { id: id, name: name, anonymous: anonymous, premium: premium, email: email, type: type, ext2: ext2 });
    if (!(0, _util.isFF)()) (0, _trackingIndex.fire)('daily-ping');
  }

  function runCookieWatch(token) {
    resetCookieWatch();
    watcher = setTimeout(function () {
      return onCookieToken(token);
    }, LOGIN_BY_COOKIE_CHANGE_TIMEOUT);
  }

  function resetCookieWatch() {
    clearTimeout(watcher);
  }

  function onCookieToken(token) {
    var cur;
    return regeneratorRuntime.async(function onCookieToken$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          context$2$0.next = 2;
          return regeneratorRuntime.awrap(_prefs2['default'].get('token'));

        case 2:
          cur = context$2$0.sent;

          if (!(token == cur)) {
            context$2$0.next = 5;
            break;
          }

          return context$2$0.abrupt('return');

        case 5:
          console.warn('cookie change!', token);
          (0, _trackingIndex.call)('felog.info', 'auth_request', { type: 'onCookieToken' });
          return context$2$0.abrupt('return', login());

        case 8:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this);
  }
})();

module.exports = exports['default'];

//params[]:newfunnel

},{"../config":"/project/src/js/lib/config.js","../forge":"/project/src/js/lib/forge.js","../message":"/project/src/js/lib/message.js","../prefs":"/project/src/js/lib/prefs.js","../request":"/project/src/js/lib/request.js","../tracking/index":"/project/src/js/lib/tracking/index.js","../util":"/project/src/js/lib/util.js","./cookie":"/project/src/js/lib/bg/cookie.js"}],"/project/src/js/lib/bg/badge.js":[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _forge = (typeof window !== "undefined" ? window['forge'] : typeof global !== "undefined" ? global['forge'] : null);

var _forge2 = _interopRequireDefault(_forge);

var _util = require('../util');

var _pageConfig = require('../page-config');

var _pageConfig2 = _interopRequireDefault(_pageConfig);

var _trackingIndex = require('../tracking/index');

var _prefs = require('../prefs');

var _prefs2 = _interopRequireDefault(_prefs);

var _news = require('./news');

var _news2 = _interopRequireDefault(_news);

var _referrals = require('./referrals');

var a = document.createElement('a');
var DEFAULT_BADGE_COLOR = '#e75146';
// const DISABLED_ON_DOMAIN_BADGE_COLOR = '#9B9B9B'

function checkBadge() {
  setInterval(chromeBadge, 1000);
}

function setBadgeColor(color) {
  if ((0, _util.isSafari)()) return;
  _forge2['default'].button.setBadgeBackgroundColor({ color: color }, _util._f, _util._f);
}

function setBadgeDefaultColor() {
  setBadgeColor(DEFAULT_BADGE_COLOR);
}

function updateBadge(domain) {
  var enabledOnDomain;
  return regeneratorRuntime.async(function updateBadge$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap(_news2['default'].isShowNews());

      case 2:
        context$1$0.t0 = context$1$0.sent;

        if (context$1$0.t0) {
          context$1$0.next = 7;
          break;
        }

        context$1$0.next = 6;
        return regeneratorRuntime.awrap((0, _referrals.isShowReferralRibbon)());

      case 6:
        context$1$0.t0 = context$1$0.sent;

      case 7:
        if (!context$1$0.t0) {
          context$1$0.next = 9;
          break;
        }

        return context$1$0.abrupt('return', setBadge('NEW'));

      case 9:
        enabledOnDomain = _pageConfig2['default'].checkDomain(domain);

        _prefs2['default'].enabled('', domain, function (enabled) {
          if (!enabledOnDomain) {
            // setBadgeColor(DISABLED_ON_DOMAIN_BADGE_COLOR)
            return setBadge('');
          } else {
            setBadgeDefaultColor();
          }
          setBadge(enabled && enabledOnDomain ? '' : 'off');
        });

      case 11:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

function chromeBadge() {
  _forge2['default'] && _forge2['default'].tabs && _forge2['default'].tabs.getCurrentTabUrl(function (url) {
    if ((0, _util.chromeBgError)()) return (0, _trackingIndex.call)('felog.error', 'chrome_bg_error', { message: (0, _util.chromeBgError)() });
    if (!url) return;
    a.href = url;
    var domain = a.hostname;
    updateBadge(domain);
  });

  if (!_forge2['default'] || !_forge2['default'].tabs) {
    (0, _trackingIndex.call)('felog.warn', 'forge_badge_undefined');
  }
}

function update() {
  isTherePagesToReload(function (isReload) {
    if (!isReload) return;
    showUpdatePopup();
  });
}

function showUpdatePopup() {
  var opts = {
    title: 'Grammarly needs to be reloaded',
    text: 'While you were working, we updated Grammarly. To take advantage of these improvements, please save the text you are working on, and click here.',
    iconURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAIAAAAErfB6AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyhpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMDE0IDc5LjE1Njc5NywgMjAxNC8wOC8yMC0wOTo1MzowMiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKE1hY2ludG9zaCkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MTgzMjhCMkQ1NjBGMTFFNDg0NjBEMENBNkVFNzA3RDkiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MTgzMjhCMkU1NjBGMTFFNDg0NjBEMENBNkVFNzA3RDkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoxODMyOEIyQjU2MEYxMUU0ODQ2MEQwQ0E2RUU3MDdEOSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoxODMyOEIyQzU2MEYxMUU0ODQ2MEQwQ0E2RUU3MDdEOSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pg1zYWQAAA/kSURBVHja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',
    buttons: [{ title: 'Reload', iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA3NpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDE0IDc5LjE1MTQ4MSwgMjAxMy8wMy8xMy0xMjowOToxNSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDowZDJiMWMzMi1mODMzLTQxOTgtOGVlMy05YWY1OGVmOGUzNzEiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RjFBODMzNzYxQkREMTFFNDk0ODFGNTFFRDg1MkEzMjUiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MkY1RjA5NjYxQkREMTFFNDk0ODFGNTFFRDg1MkEzMjUiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6N2FmMWVkMGUtZjZkZC00YmYwLWE2MjctNTBkMjA4MjRiZDViIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjBkMmIxYzMyLWY4MzMtNDE5OC04ZWUzLTlhZjU4ZWY4ZTM3MSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PuUD9ZcAAAM8SURBVHjatJbbS1RRFIePOjqG99LSLFMzoazMFLsHQQVFl8fee+qhP6cX3+sxiG6QFV0MNCjNjAyx1MoumpmXsRnz0m/Bd2A3TNocpw0fw5lz9v7tddlr7bSWlhYvwNgqzosMcVl0JrtAyAs2FkSeKBQ7xKT4Kqb+t/CcqBD1olpsEDdFdyqF00Q+FtpvWDSLWrEeMsUqPPBRjIifbDCwcBiROrFLrBU1Yp3zzWZxju/axCMxsJTr/yacLopwZw0WWix3i5IE3+eBbSYiXovhIK42KxvESaw0i9aIHC9FI5TguRDLToszWG1jXnwQ4yKb/7N5N01Wd8KomE1GOFc0irPioCh33r0Q98Rz3H/B2ZTF84ZojUuuZYXToEocEydEJe/MymeiQ9wVXaJJHCeT7f01jlNXsq5Ow23VxLaM/79gyXUxJD7x/y/eRcVV8RArk45xLgm0X+wkuSax0iy5EzdvTNyngpm134MmVz5VyEQLREz0inbiFz++sZlFNuitRLiBs5qJG5+KB+J9gnlRYht4pDvntoSiYeOH6BP9WJ/y4VucRSnM4tlK3TvO7EqGVbNNeNRfd9B+feEMpxj4xWImBYaZ6EVCaOOVuCR6QnFdKNXDCtBRToxHVbzixng+rtKEUlSXQ3GeG/FLqS88S62NObGxKraaMCQ7MkjUSidvYpTTqCscQ9gvBHaWt1DJwgGEw9TzWtbyWHvEN86P8QRNwJp9MbttZofWed4kKWzN44jYw1pWYnu4Gk26FtvDS15OsOM6SmhVAIttzl5uo2HW7EFjyrU4QsFop/Ef4OztE5+pyUNUtAgWuCOTZCzlCJ1ibj4x7WbtPj/GvvAivn9LI6/kCJRyIShjYhvfjMYJF/L9IQSbmOtxBepkXgytP4TnaQit9NnDYpvYCBXcKPv5LsLcHFxbg3CjcwW2u9dj1hxAI+ENJEIzT8e9BbjOIwSlxGjaubqGaKt5jpW+pdanb7FmZKmrzxy99gm7m6NdVpGd5csk1TgMENfbhGjmX2+ZUY7XGHGtJ0O308WKnROxQH8epRb3IjpI64wmc71dQHSMLjVDHhRR08NOU4kiPExMO2DJC8JvAQYA0OLb9zl5D+gAAAAASUVORK5CYII=' }]
  };

  _forge2['default'].notification.create(opts, function () {
    (0, _trackingIndex.call)('felog.info', 'notification_reload_tabs_click');
    reloadAjaxPages();
  });

  (0, _trackingIndex.call)('felog.info', 'notification_reload_tabs_show');
}

function reloadTab(id) {
  _forge2['default'].tabs.reload(id);
}

function toReload(url) {
  var internal = url.indexOf('http') !== 0;
  return !internal && url.indexOf('.grammarly.com') == -1;
}

function isTherePagesToReload(cb) {
  reloadAll(null, cb);
}

function reloadAll(force, cbReloaded) {
  var cb = cbReloaded || reloadTab,
      isReloaded = false;

  _forge2['default'].tabs.allTabs(function (tabs) {
    tabs.filter(function (_ref) {
      var id = _ref.id;
      var url = _ref.url;

      return toReload(url) && (force || _pageConfig2['default'].isPageToReload(url));
    }).forEach(function (_ref2) {
      var id = _ref2.id;
      var url = _ref2.url;

      var fireOnce = isReloaded && cbReloaded;
      if (!fireOnce) cb(id);
      isReloaded = true;
    });
  });

  if (!isReloaded && cbReloaded) {
    cbReloaded(false);
  }
}

function reloadAjaxPages() {
  reloadAll();
}

function setBadge(value) {
  _forge2['default'].button.setBadge(value, _util._f, _util._f);
}

exports['default'] = {
  update: update,
  checkBadge: checkBadge
};
module.exports = exports['default'];

}).call(this,typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9wcm9qZWN0L3NyYy9qcy9saWIvYmcvYmFkZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O3FCQUFrQixPQUFPOzs7O29CQUNpQixTQUFTOzswQkFDNUIsZ0JBQWdCOzs7OzZCQUNwQixtQkFBbUI7O3FCQUNwQixVQUFVOzs7O29CQUNYLFFBQVE7Ozs7eUJBQ1UsYUFBYTs7QUFFaEQsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtBQUNuQyxJQUFNLG1CQUFtQixHQUFHLFNBQVMsQ0FBQTs7O0FBR3JDLFNBQVMsVUFBVSxHQUFHO0FBQ3BCLGFBQVcsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUE7Q0FDL0I7O0FBRUQsU0FBUyxhQUFhLENBQUMsS0FBSyxFQUFFO0FBQzVCLE1BQUkscUJBQVUsRUFBRSxPQUFNO0FBQ3RCLHFCQUFNLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxFQUFDLEtBQUssRUFBTCxLQUFLLEVBQUMscUJBQVMsQ0FBQTtDQUN0RDs7QUFFRCxTQUFTLG9CQUFvQixHQUFHO0FBQzlCLGVBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFBO0NBQ25DOztBQUVELFNBQWUsV0FBVyxDQUFDLE1BQU07TUFLM0IsZUFBZTs7Ozs7d0NBSlQsa0JBQUssVUFBVSxFQUFFOzs7Ozs7Ozs7Ozt3Q0FBVSxzQ0FBc0I7Ozs7Ozs7Ozs7OzRDQUNsRCxRQUFRLENBQUMsS0FBSyxDQUFDOzs7QUFHcEIsdUJBQWUsR0FBRyx3QkFBVyxXQUFXLENBQUMsTUFBTSxDQUFDOztBQUNwRCwyQkFBTSxPQUFPLENBQUMsRUFBRSxFQUFFLE1BQU0sRUFBRSxVQUFBLE9BQU8sRUFBSTtBQUNuQyxjQUFJLENBQUMsZUFBZSxFQUFFOztBQUVwQixtQkFBTyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUE7V0FDcEIsTUFDSTtBQUNILGdDQUFvQixFQUFFLENBQUE7V0FDdkI7QUFDRCxrQkFBUSxDQUFDLE9BQU8sSUFB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QUFVLElBQUksVUFBVSxDQUFBO0FBQ3ZDLFVBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFBO0FBQ3JCLGdCQUFVLEdBQUcsSUFBSSxDQUFBO0tBQ2xCLENBQUMsQ0FBQTtHQUNILENBQUMsQ0FBQTs7QUFFRixNQUFJLENBQUMsVUFBVSxJQUFJLFVBQVUsRUFBRTtBQUM3QixjQUFVLENBQUMsS0FBSyxDQUFDLENBQUE7R0FDbEI7Q0FDRjs7QUFFRCxTQUFTLGVBQWUsR0FBRztBQUN6QixXQUFTLEVBQUUsQ0FBQTtDQUNaOztBQUVELFNBQVMsUUFBUSxDQUFDLEtBQUssRUFBRTtBQUN2QixxQkFBTSxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUsscUJBQVMsQ0FBQTtDQUNyQzs7cUJBRWM7QUFDYixRQUFNLEVBQU4sTUFBTTtBQUNOLFlBQVUsRUFBVixVQUFVO0NBQ1giLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBmb3JnZSBmcm9tICdmb3JnZSdcbmltcG9ydCB7X2YsIGNocm9tZUJnRXJyb3IsIGlzU2FmYXJpfSBmcm9tICcuLi91dGlsJ1xuaW1wb3J0IHBhZ2VDb25maWcgZnJvbSAnLi4vcGFnZS1jb25maWcnXG5pbXBvcnQge2NhbGx9IGZyb20gJy4uL3RyYWNraW5nL2luZGV4J1xuaW1wb3J0IHByZWZzIGZyb20gJy4uL3ByZWZzJ1xuaW1wb3J0IG5ld3MgZnJvbSAnLi9uZXdzJ1xuaW1wb3J0IHtpc1Nob3dSZWZlcnJhbFJpYmJvbn0gZnJvbSAnLi9yZWZlcnJhbHMnXG5cbmxldCBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpXG5jb25zdCBERUZBVUxUX0JBREdFX0NPTE9SID0gJyNlNzUxNDYnXG4vLyBjb25zdCBESVNBQkxFRF9PTl9ET01BSU5fQkFER0VfQ09MT1IgPSAnIzlCOUI5QidcblxuZnVuY3Rpb24gY2hlY2tCYWRnZSgpIHtcbiAgc2V0SW50ZXJ2YWwoY2hyb21lQmFkZ2UsIDEwMDApXG59XG5cbmZ1bmN0aW9uIHNldEJhZGdlQ29sb3IoY29sb3IpIHtcbiAgaWYgKGlzU2FmYXJpKCkpIHJldHVyblxuICBmb3JnZS5idXR0b24uc2V0QmFkZ2VCYWNrZ3JvdW5kQ29sb3Ioe2NvbG9yfSwgX2YsIF9mKVxufVxuXG5mdW5jdGlvbiBzZXRCYWRnZURlZmF1bHRDb2xvcigpIHtcbiAgc2V0QmFkZ2VDb2xvcihERUZBVUxUX0JBREdFX0NPTE9SKVxufVxuXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVCYWRnZShkb21haW4pIHtcbiAgaWYgKGF3YWl0IG5ld3MuaXNTaG93TmV3cygpIHx8IGF3YWl0IGlzU2hvd1JlZmVycmFsUmliYm9uKCkpIHtcbiAgICByZXR1cm4gc2V0QmFkZ2UoJ05FVycpXG4gIH1cblxuICBsZXQgZW5hYmxlZE9uRG9tYWluID0gcGFnZUNvbmZpZy5jaGVja0RvbWFpbihkb21haW4pXG4gIHByZWZzLmVuYWJsZWQoJycsIGRvbWFpbiwgZW5hYmxlZCA9PiB7XG4gICAgaWYgKCFlbmFibGVkT25Eb21haW4pIHtcbiAgICAgIC8vIHNldEJhZGdlQ29sb3IoRElTQUJMRURfT05fRE9NQUlOX0JBREdFX0NPTE9SKVxuICAgICAgcmV0dXJuIHNldEJhZGdlKCcnKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHNldEJhZGdlRGVmYXVsdENvbG9yKClcbiAgICB9XG4gICAgc2V0QmFkZ2UoZW5hYmxlZCAmJiBlbmFibGVkT25Eb21haW4gPyAnJyA6ICdvZmYnKVxuICB9KVxuXG59XG5cbmZ1bmN0aW9uIGNocm9tZUJhZGdlKCkge1xuICBmb3JnZSAmJiBmb3JnZS50YWJzICYmIGZvcmdlLnRhYnMuZ2V0Q3VycmVudFRhYlVybCh1cmwgPT4ge1xuICAgIGlmIChjaHJvbWVCZ0Vycm9yKCkpIHJldHVybiBjYWxsKCdmZWxvZy5lcnJvcicsICdjaHJvbWVfYmdfZXJyb3InLCB7bWVzc2FnZTogY2hyb21lQmdFcnJvcigpfSlcbiAgICBpZiAoIXVybCkgcmV0dXJuXG4gICAgYS5ocmVmID0gdXJsXG4gICAgbGV0IGRvbWFpbiA9IGEuaG9zdG5hbWVcbiAgICB1cGRhdGVCYWRnZShkb21haW4pXG4gIH0pXG5cbiAgaWYgKCFmb3JnZSB8fCAhZm9yZ2UudGFicykge1xuICAgIGNhbGwoJ2ZlbG9nLndhcm4nLCAnZm9yZ2VfYmFkZ2VfdW5kZWZpbmVkJylcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGUoKSB7XG4gIGlzVGhlcmVQYWdlc1RvUmVsb2FkKGlzUmVsb2FkID0+IHtcbiAgICBpZiAoIWlzUmVsb2FkKSByZXR1cm5cbiAgICBzaG93VXBkYXRlUG9wdXAoKVxuICB9KVxufVxuXG5mdW5jdGlvbiBzaG93VXBkYXRlUG9wdXAoKSB7XG4gIGxldCBvcHRzID0ge1xuICAgIHRpdGxlOiAnR3JhbW1hcmx5IG5lZWRzIHRvIGJlIHJlbG9hZGVkJyxcbiAgICB0ZXh0OiAnV2hpbGUgeW91IHdlcmUgd29ya2luZywgd2UgdXBkYXRlZCBHcmFtbWFybHkuIFRvIHRha2UgYWR2YW50YWdlIG9mIHRoZXNlIGltcHJvdmVtZW50cywgcGxlYXNlIHNhdmUgdGhlIHRleHQgeW91IGFyZSB3b3JraW5nIG9uLCBhbmQgY2xpY2sgaGVyZS4nLFxuICAgIGljb25VUkw6ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUtBQUFBQ2dDQUlBQUFBRXJmQjZBQUFBR1hSRldIUlRiMlowZDJGeVpRQkJaRzlpWlNCSmJXRm5aVkpsWVdSNWNjbGxQQUFBQXlocFZGaDBXRTFNT21OdmJTNWhaRzlpWlM1NGJYQUFBQUFBQUR3L2VIQmhZMnRsZENCaVpXZHBiajBpNzd1L0lpQnBaRDBpVnpWTk1FMXdRMlZvYVVoNmNtVlRlazVVWTNwcll6bGtJajgrSUR4NE9uaHRjRzFsZEdFZ2VHMXNibk02ZUQwaVlXUnZZbVU2Ym5NNmJXVjBZUzhpSUhnNmVHMXdkR3M5SWtGa2IySmxJRmhOVUNCRGIzSmxJRFV1Tmkxak1ERTBJRGM1TGpFMU5qYzVOeXdnTWpBeE5DOHdPQzh5TUMwd09UbzFNem93TWlBZ0lDQWdJQ0FnSWo0Z1BISmtaanBTUkVZZ2VHMXNibk02Y21SbVBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHhPVGs1THpBeUx6SXlMWEprWmkxemVXNTBZWGd0Ym5NaklqNGdQSEprWmpwRVpYTmpjbWx3ZEdsdmJpQnlaR1k2WVdKdmRYUTlJaUlnZUcxc2JuTTZlRzF3UFNKb2RIUndPaTh2Ym5NdVlXUnZZbVV1WTI5dEwzaGhjQzh4TGpBdklpQjRiV3h1Y3pwNGJYQk5UVDBpYUhSMGNEb3ZMMjV6TG1Ga2IySmxMbU52YlM5NFlYQXZNUzR3TDIxdEx5SWdlRzFzYm5NNmMzUlNaV1k5SW1oMGRIQTZMeTl1Y3k1aFpHOWlaUzVqYjIwdmVHRndMekV1TUM5elZIbHdaUzlTWlhOdmRYSmpaVkpsWmlNaUlIaHRjRHBEY21WaGRHOXlWRzl2YkQwaVFXUnZZbVVnVUdodmRHOXphRzl3SUVORElESXdNVFFnS0UxaFkybHVkRzl6YUNraUlIaHRjRTFOT2tsdWMzUmhibU5sU1VROUluaHRjQzVwYVdRNk1UZ3pNamhDTWtRMU5qQkdNVEZGTkRnME5qQkVNRU5CTmtWRk56QTNSRGtpSUhodGNFMU5Pa1J2WTNWdFpXNTBTVVE5SW5odGNDNWthV1E2TVRnek1qaENNa1UxTmpCR01URkZORGcwTmpCRU1FTkJOa1ZGTnpBM1JEa2lQaUE4ZUcxd1RVMDZSR1Z5YVhabFpFWnliMjBnYzNSU1pXWTZhVzV6ZEdGdVkyVkpSRDBpZUcxd0xtbHBaRG94T0RNeU9FSXlRalUyTUVZeE1VVTBPRFEyTUVRd1EwRTJSVVUzTURkRU9TSWdjM1JTWldZNlpHOWpkVzFsYm5SSlJEMGllRzF3TG1ScFpEb3hPRE15T0VJeVF6VTJNRVl4TVVVME9EUTJNRVF3UTBFMlJVVTNNRGRFT1NJdlBpQThMM0prWmpwRVpYTmpjbWx3ZEdsdmJqNGdQQzl5WkdZNlVrUkdQaUE4TDNnNmVHMXdiV1YwWVQ0Z1BEOTRjR0ZqYTJWMElHVnVaRDBpY2lJL1BnMXpZV1FBQUEva1NVUkJWSGphN0oxNWRGTlZIc2Z6MG5SSjA2Wk45MzJGYnRCU29LMkFsTTJoVmhZWkFldFVSV2habkJFUUJJdmpNSXZqY282V0VRVlpCQm1xSWlDb3FGU1F3MTRLQ0hTbDFHNTBwVXVhYmlGSm16VGRNcjlESFkvQ1MwaVQrNVlrOTN2NFE1UDB2bmQvbi9mdS9mM3V2Yjk3Q1kxR3c4RXlYM0d4Q1RCZ0xBd1lDd1BHd29DeE1HQXNEQmdMQThhQXNUQmdMQXdZQ3dQR3dvQ3hNR0FzREJnRHhzS0FzVEJnTEF3WUN3UEd3b0N4TUdBc0RCZ0R4c0tBc1RCZ0xBd1lDd1BHd29DeE1HQU1HQXNEeHNLQXNUQmdMQXdZQ3dQRzBpbWVCZGE1ZDdDL3VydTFVaTV1VW5ZMXE3cGFWRkpwWDQrc1R5a2ZVUFVQRGY3Nk0ydXVsWkRIZDdLeEY5a0lmUGdpWDc2TG43MUx1TkI3bElPWG5aVzFxVlNXc0pCZGR0cDY1VDkxVkJWSzZ3dTY2dXA2Mm9hTXFEV1hJSUlGSGhOZGdpZUlnaWE3aFhuWUNURmd4bFNsRUo5c0tjNXBLNitRdDFCMGlRaWh6M1NQeURrK3NXR08zaGd3VFdwWHk0ODE1bjNmbEYvWDAwN2JSWU1GN2d2ODRoYjZ4N3ZiQ2pGZ3FnU05jRmJ0eFF1U3NrSE5FQ00zWUVWd1ozcEdwWVhNZ0FZY0EwYXAzUGFLSFZXblMrN2VZY245eERnSHJBbExTblNQd0lDTjFZM09tdmNyVHJBSDdYMllOMGJNVFhBTnhZQU5FY1E1bWVYWloxcHZzZncrWjN0RmI0cWNEMUVXQnF5dm9Jdk5xczNaZWZzMEJMVW1jY01RT3E4ZW5aUVdNaDA2YVF6NElhcnBsbVFVSFNxWE41dmNuVWNLZmJlTWZ6YlV3Uk1ESnBlR296bmNjRFd6TEZzOU5HQ2kzWW90bDdjcGFuNXE0QlNDUTJEQXY1TnlRTDI1NU9ncDhVMHo4UG1UdmNlOUU1Tml6N1BGZ0gvUkhXWG5TM243b1hFMm01QWRHdXBkOGVrQjlxNFlNS2RJV3I4NlAwdmExOE14TDRsc0JEdmowc1pUT1NSaUFvRFBTMzdlVUhqQWREdmRoM2JKV3ljc21lVTV4a0lCbjJ3cGZxMzQ4SUJta0dPKzRoRlc3OFdtenZHSnRUakFRRGVqK09DUUJVeG9jZ2xpUyt4elZEQm03NG9PYUpuaDNSMnlqT2xxcUNaVUZxcHNLWURCcTRKKzE3eGI1dnNFbFlVcVE4WE5IekJFUk9Bem02dFhwVU5RWmFnNFZOK2NBU3NIMUJEdm1sOUVwS2VnNGxCOU1JSjVBdFp3Tkp0TGpwclRhSVlCZ3VxREVjQVVhRngwVnRYdGNNTlZSa1lpcmJsVzNuYk9ubnhub1RXZlIzQzVCTGR2YUVEUnIrcFFLOFNxdTZyQlBwcnZCNHdRM3hEeWJPQ2paaFVtd1pPN0tQY0RlcnBlZ2tORU9mbE9jaDAxMXRrL3hqbkFoeS9TOFdOZ1hLVVFGM1RWRlVycmlxVU45Q3dHc3VYeXZrbDh4Zmg1SjdZQUJxczlmWGtiRFRPQWdQT1Bmbkd6UE1kNDJqa1o4T2V5ZnVYWjF0TGp6UVY1bmJXb1dsRnRpaFQ2ZmpWMW5aSHp4MndCdksvbXd2c1ZKNmdySDh3MHozZkNrcUNwWTV6OFVMbjZuOWJtZk51VVIrbUtnNDBSYzFlRXpqUjV3RTNLcnZtWHRsQmtLUzVCSkh1UFd4ZVdIQ0J3UTE0NGROSzdicDg1ZXVjYVJlMjJuWlYxOXJRTVk5YjZzQUx3eXdXZlViU3VDdnF3dDJLZUhrL3hDbGJ3SHY1MTYydm9wS2tvZkxaWDlQYUpTMDBZOEkzT21xWFhkbFB4NHE0TW5iVjZkQko0eVBRRWVBZnFMa012MDBlQmsvalpwTDhZdkM2VCtUaVlpcTdYeWRwK1QveUs5ZUZQMEVOMzJDMS9JVGp4OEpTMVZDeWROTVpFREwvQnVlMFZxMjdzUTF0bXNNQjkzeU9yZEVjK3YwclNLOHZ2cWkyNWU2ZGFJUkdycEoxOTNUMERhcUFsNE5tNjJUb0NyZEdPWHJHaUlIaUJISGwyK2hRbzdldFprNTlWaUhwSWVXL0NDc1BXMERNTStKa3IyOUV1V0FjbitaT0VsU0liZ2U2ZkFjanZHdk5PaW92TFpIb0ZaanpDYXJMYjZDZjlKaVo1UmR0d0h6STZCTjdpaHFJREZ5UmxhS083STQrK2JHS0E0VEYvN3VvT2hBV09kZkxQbXZTaWc4NVhEY0tiUGRWbnM1c0xmNXNLckw5Y2JSeWVENTY2TkhnYTM4cEd4ODhHTklOcjh6KzcySWFTOGNFcGF3eklkMklTOE5xQ1Q4KzJscUlxTFZEZ0JsMmdqbmNYMnQ3dFZhY08xVjgxZmhZU01LK1BlR0t4L3lPNjMrUDA2M3NRVHYvOXdXdnNSeE9YbVF6Z2RyVjg1cm0zVVlXUDRGVjlrN2plbDYvVndibmVXZjM2elMvRnFyc0lxeERuRXZKdTdKOTBYRlRXcjF5VSsyR3pxZ3ZWV00yRngvNCswdHhVeHJ6b1k0MTVxT2lDVC9SZWJLb09RKytwUHJmOCtsNjBkRUhnblQxMWFlczU3Y3N3NExHREVOYVdpMlpHQjh3RlJqT1pNT243cG54VVJTMFBuVEhkSTVMMHF5R05CbDdjRHl0L3BHaWtTVEhRdXpiLzA3M1Y1N1g5SU1ySjk1V0lPUXdhalJuQVZRb3hxdHo3SUlINzJyREh0ZEhOS0Q3NEhib25TZHNReHdlVko5OHRPNjd0QnhBZmd3K001RnBnTkRDZENRQSsyVktNcW5GK0kzcVJ0cmpsamRLdlVWM280WU5OZFplMmxQK2c3U1pUQWlZeFpUcG1BT2UwbFNNcDUzSHZtRWRjUjVGKzlYbGQ3bGQzcnROWnFmMjFGK0dpcEY4aEhONGFxZWtZQU56V0swZXk1dzJYSU5hRUpaRitWU3ByL0UvRkQvUlhMYk04KzFwbjlZT2YxM2Ezb2JvRW1BNE15R3JBUDNWVUlTa24yWHNjNllLSC9xSEJ2OTA4WXRnNGh2R09ia2JSUVVXLzZyNkErSUNXTjVzR0F6SUFHTlU0N1pLZ1JDMk44NlhiaWxhbW9vTU90ZUtGYTd0djNXMGMvdCthYnNtS0czdlI3dVkwSWdNeXNPZ095YnhwbUtOM3JDaVFORzdaVTNPZXc2aWdGVTI1c2sxa0krQVJWdTFxT2JNR3BCc3d0RmQxUFFnNnBJWCs4YVNmUTJONFh3dkpsS2hiMmcwR0JEUHF1VjhtM1UxMGRYY3JrblFqMG56TEFjM2dvZm9ySEhNWEdCRE15TkkrdUZJdU5yNFE4SzM4eVJMakwwcktPL3U2T1JZZy9jMUlOK0FtSllLUjk4bHVvMGsvLzFGY3pMRU02VzlHdWdFam1WcUpkdlluYmJndXQxZGFDR0Q5elVnMzRCYVYxUGhDU05jMlZ5bkVjbmE0VjZ3eUk5MkFqZmN0dVFRUkpIQi84UE5TV1NQSFlxUy9HZWtHTE90VEdsbUNxNDBqYVRaSERicmhRUFpMZnpQU0RWZytZR3dycWkyblNJSjZQcC9OMHQrTWRBTTJmb2pZbmtlKzJxM0xrbkxHOVRlaitSeXJRMzhXcjBuSWZBRFR2RTB2Qmt5M1RPZ3NJM01HYkh5eWtMWmcxOFhHd1hLdzZXOUd1Z0VMZVh3alMyaFhLMGcvOTdVWFdRNWcvYzFJTjJBbkczc2pTK2hTZDVPdWdRMFdlRmdPWVAzTlNEZmdoNmFGUFZRYWpxYWViSUVFNlFDMXVVcC9NOUlOV00rc1R0MjZLU1ZKU0F4eDhERCs2VEVWNlc5R3VsZDA2RWd3MFYrbHNzWUhWM1FRSEdLS1c5aUpsaUxxYmg0dU1jdHJ6SGpuUUdzanNsRjIzVDRqNjFmU1prYTZBU05aSVp6ZlZVdjZlWkozTkhXQWJibThYZkhwOEF3WldjN25kYm5HQTliZmpIUTMwZUZDQkVkMDNsYTAzdW5wZVBEejZSNVJqdFo4aXU1OGVlaE00K25TYjBhNkFZOXk4T0lTQ0k2VElkMlZCMTZ5aFg3eEZOMTVzdmM0dG94ZEVBU1lrYVdBN2F5c2tjUXpKN1NrNkN3TG5rYlJ4aXZhSmpub0Z4aFEvMkU3Qm9ZcUo3b0VHMTlJdWJ5WmRIbXdGOS81bVlESlZOeDJpWlF0aDErT3lJQU1BRVoxc0s2MlRLK1h3eDUzcFdEWWNsdlZLWmJzWWowaUF6SUFlRElpVitXY3BKUjB4QVA4ckg5SEwwWisydzA5SFNsWHRoMXZMbWp0bFNrR2V1LzdWOWZUZnFtdEhMNWxtd0VaU0YzeHNCTkdDSDJNVHpBYzFBeGxsbWZ2aWt0LzhLdkh2TVkrSHpUMWkvckxhTys4U2RuMVd2RmhIVkh5enJnMHFxMEhwZ01Ec3ZvTnZoZlBSQ0lwNTRLa2pEUmRFL1RYcUNlbnVvZlRXYWwxNGNrelBhUFlaanBtQUNNOElPaXQwbU9rMjBOYUVkenRFNWNpY2VqMFVXcmdsQmRIUGNaQzB6RURPTXpSTzVoczZhc0JxdTF1MjFaNWl2UXJ2cFhOdm9SVjB3emFBWEJrWXlBaE0vNDVkaUV0QVpJN21NNEVBSU1XK01XaEtpcXJOdWRTZTRXMnNIdDMvUEwwa0JrVUhkWnJ5K1c5SFpQeWF1UTgxaHFOTWNBTC9lTlJyYUxTY0RRWlJRZnJ0U1JaY3draUkzTGV4d25MSVVSRzd1OGNlWFRkSXY4RWVpd0c1dEtXTk10R3dPNjJRb1F1aWJ4ZjlXTGVmM1drRmtKRC9jTzBqRldqWmlGWnVpV3lFYndldGVEcnFldDFqQW1EeTQxMjZ6VXcxMGkzdWVNd3UrZ3VMV1FHd3RMdTlIU2tYOXVqWXl4Q3dMTjlKWHpPbVpsL0EyL0k0SkVRUDN1WDF5TG5uNXUxK1lYZ1JCMHRrS1JYdHZMR0oyam5wdzB6RjVQbkprMFFCY1U0QnlEY1RyaEtJVjUyN2VOUEVsYnFpQlRkYkIzWGh6K3hKaXpwY252bG1kWmIxenFxOVVua0NuWHdmTlE5TE1rclJoKzN2Rm5WbFg1OUw0RjBvU2NZeXJBUlFJWVB4Z0pEbzkwUUhCaW5YdjFvZDN5NmJtK1RSMWpOOElpQ2YvRGZuV3BGcFVMY3FPeHNWY21ncVI5ZVFBOXNuS3p0ZmZpaUFJRnJwTkJYcVBjc1pLbXM4Yzk1KzZITTJWN1JhQTFsMkI4eUREalJQUUx0Uzh5NWwxcVplblhIbTlHTDUvcU0xK2YzcnJhT1Uyd2RrVno2V0dQZW02WGZESi90NWFEZkR2RjZ2cjZKaGdaN3pDOTgzeGd4RjNtWnlnSDFxMFVIWDcvNXBXS2dsNTVheVBxVkc0dSsyRnh5aElxVDI0d3hFZk9BRTF4RDBiWm12K3E3cHZ4NU9abVVydElhVm5aejRkeUxtUlR0aXduR01maklGUTVMVWxjMlJjNm5LUEdrclZjT3IvTGl5eCtlbytCd2JSQjRhaWxYdG0wcVBxVC81aThqT2hBUHpBTEdNZVlPV1hINktNUWVxMGNuVVhlMDNjK3lwalg1V2VBckxRdVpCcDZ3OFE5VC85RGc2ZGFTeit0eWRYZ1A0dDY3cEgvWXFTVXpnMVJnRmlPWEtWcmM0WlFRRFNkN2p4dHU5M1FmckVHSzUwWm56Vm5KTFdpTkg3b2ZDRVRKSjZadkN2ejllWHJIbXd0MFREamVKN002bkpKRDcvR3l3d0JpUllIalJVRVE0NFk0ZUFUWXV6ay9rQThDUGxxenNxdStwNzFTTHI1NXQ2RklXaitpQXhZaFZOdVRzTUxyLzFzU3dNTUJEWW1lZnArNUhTODdyRU1OVjk0cS9aYkJHNERZeHA1blkwM3dsSVBxbmdHMThlZlVRWGNBRVk2N3JYRDRCR0w5TytCL2pIM0szQTZJSG5aQU5oUit3Y2doNEt3U2RDSmJKenlQWkFhTVhRbmdVS1YzWWxLTWI1ZE1XbEI5TUFLcStVM1daZmpiODJ4M3hhZGJUaHJaZllLS1EvWEJDS2dLWk9NV0RnSDJyanZqMGxBZE4yUkNnaXBEeFFQSTlsazFLOEFnY0c2M1RsakNJNndzaHk1VUZxcU0vQ3hyOW03Q01zdHp6SHV4cVVnU21kZ3ZxQ1pVbG5RVGJMTUZ6TG0zZ25CTDdITm0veDVEQmFHYUNGZWFzamRNSXRWNXljOGJDZy9RTmdCQ2Y3OExMVE1WNzY3SkFBWVZTZXRYNTJkSnpXNnpRdkNad2F0QzN1K2FIbURPdllPZFg4cmJYOU10TWFkNEZ5SWl0RDZ6Q1FQbTNKdkczMXh5MUR6R3VaSzl4NzBUazRJdzNqVUh3Sng3WTVtSEc2NW1sbVdiYnBjTW5lNm1xUG1wZ1ZNb1dvdHYyb0NIQlExMVJ0RWhHdVlXa1N0UzZMdGwvTE4wanNXYUpHRE92Zm5qck5xY25iZFBqMmoramtIWldWbXZIcDJVRmpLZDVsMXhUUlh3c0pxVVhabmwyYVFic3JCS3M3MmlOMFhPUjNqSXJLVUFIdGFOenByM0swNmdYWHVMU2pIT0FSc2o1aHF6YWc0RC9rVzU3UlU3cWs2ekJ6T2dYUk9XbEVoOThxcWxBQjVXb2JRK3EvYmlCVWtaNlk2ME5BaTYySm1lVVdraE15WlFPWHhodVlDSDFhNldIMnZNKzc0cEgrM0J2Ym9WTEhCZjRCZTMwRC9lZ0J4QUROaEFWU25FSjF1S2M5cktrUndxVDZvSW9jOTBqOGc1UHJFanpiM0hnRkdxclZmK1UwY1ZOT0FGWFhWMVBXM0dISEhMSlloZ2djZEVsMkJvaENlN2hZMW96eHNNbUE1QjZGemQzVm9wRjBPVTFhenFhbEZKcFgwOXNqNmxmRUQxMi9PSXJMbFdRaDdmeWNaZVpDUHc0WXQ4K1M0UTU0UUx2VWM1ZUpuUUFTQ1dDTmlpaE04YXdvQ3hNR0FzREJnTEE4YkNnTEV3WUN3TUdBUEd3b0N4TUdBc0RCaUxhdjFQZ0FFQVNlUEdNa1NXdUgwQUFBQUFTVVZPUks1Q1lJST0nLFxuICAgIGJ1dHRvbnM6IFt7dGl0bGU6ICdSZWxvYWQnLCBpY29uVXJsOiAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFCNEFBQUFlQ0FZQUFBQTdNSzZpQUFBQUdYUkZXSFJUYjJaMGQyRnlaUUJCWkc5aVpTQkpiV0ZuWlZKbFlXUjVjY2xsUEFBQUEzTnBWRmgwV0UxTU9tTnZiUzVoWkc5aVpTNTRiWEFBQUFBQUFEdy9lSEJoWTJ0bGRDQmlaV2RwYmowaTc3dS9JaUJwWkQwaVZ6Vk5NRTF3UTJWb2FVaDZjbVZUZWs1VVkzcHJZemxrSWo4K0lEeDRPbmh0Y0cxbGRHRWdlRzFzYm5NNmVEMGlZV1J2WW1VNmJuTTZiV1YwWVM4aUlIZzZlRzF3ZEdzOUlrRmtiMkpsSUZoTlVDQkRiM0psSURVdU5TMWpNREUwSURjNUxqRTFNVFE0TVN3Z01qQXhNeTh3TXk4eE15MHhNam93T1RveE5TQWdJQ0FnSUNBZ0lqNGdQSEprWmpwU1JFWWdlRzFzYm5NNmNtUm1QU0pvZEhSd09pOHZkM2QzTG5jekxtOXlaeTh4T1RrNUx6QXlMekl5TFhKa1ppMXplVzUwWVhndGJuTWpJajRnUEhKa1pqcEVaWE5qY21sd2RHbHZiaUJ5WkdZNllXSnZkWFE5SWlJZ2VHMXNibk02ZUcxd1RVMDlJbWgwZEhBNkx5OXVjeTVoWkc5aVpTNWpiMjB2ZUdGd0x6RXVNQzl0YlM4aUlIaHRiRzV6T25OMFVtVm1QU0pvZEhSd09pOHZibk11WVdSdlltVXVZMjl0TDNoaGNDOHhMakF2YzFSNWNHVXZVbVZ6YjNWeVkyVlNaV1lqSWlCNGJXeHVjenA0YlhBOUltaDBkSEE2THk5dWN5NWhaRzlpWlM1amIyMHZlR0Z3THpFdU1DOGlJSGh0Y0UxTk9rOXlhV2RwYm1Gc1JHOWpkVzFsYm5SSlJEMGllRzF3TG1ScFpEb3daREppTVdNek1pMW1PRE16TFRReE9UZ3RPR1ZsTXkwNVlXWTFPR1ZtT0dVek56RWlJSGh0Y0UxTk9rUnZZM1Z0Wlc1MFNVUTlJbmh0Y0M1a2FXUTZSakZCT0RNek56WXhRa1JFTVRGRk5EazBPREZHTlRGRlJEZzFNa0V6TWpVaUlIaHRjRTFOT2tsdWMzUmhibU5sU1VROUluaHRjQzVwYVdRNk1rWTFSakE1TmpZeFFrUkVNVEZGTkRrME9ERkdOVEZGUkRnMU1rRXpNalVpSUhodGNEcERjbVZoZEc5eVZHOXZiRDBpUVdSdlltVWdVR2h2ZEc5emFHOXdJRU5ESUNoTllXTnBiblJ2YzJncElqNGdQSGh0Y0UxTk9rUmxjbWwyWldSR2NtOXRJSE4wVW1WbU9tbHVjM1JoYm1ObFNVUTlJbmh0Y0M1cGFXUTZOMkZtTVdWa01HVXRaalprWkMwMFltWXdMV0UyTWpjdE5UQmtNakE0TWpSaVpEVmlJaUJ6ZEZKbFpqcGtiMk4xYldWdWRFbEVQU0o0YlhBdVpHbGtPakJrTW1JeFl6TXlMV1k0TXpNdE5ERTVPQzA0WldVekxUbGhaalU0WldZNFpUTTNNU0l2UGlBOEwzSmtaanBFWlhOamNtbHdkR2x2Ymo0Z1BDOXlaR1k2VWtSR1BpQThMM2c2ZUcxd2JXVjBZVDRnUEQ5NGNHRmphMlYwSUdWdVpEMGljaUkvUHVVRDlaY0FBQU04U1VSQlZIamF0SmJiUzFSUkZJZVBPanFHOTlMU0xGTXpvYXpNRkxzSFFRVkZsOGZlZStxaFA2Y1gzK3N4aUc2UUZWME1OQ2pOakF5eDFNb3VtcG1Yc1JuejBtL0JkMkEzVE5vY3B3MGZ3NWx6OXY3dGRkbHI3YlNXbGhZdndOZ3F6b3NNY1ZsMEpydEF5QXMyRmtTZUtCUTd4S1Q0S3FiK3QvQ2NxQkQxb2xwc0VEZEZkeXFGMDBRK0Z0cHZXRFNMV3JFZU1zVXFQUEJSaklpZmJEQ3djQmlST3JGTHJCVTFZcDN6eldaeGp1L2F4Q014c0pUci95YWNMb3B3WncwV1dpeDNpNUlFMytlQmJTWWlYb3ZoSUs0Mkt4dkVTYXcwaTlhSUhDOUZJNVRndVJETFRvc3pXRzFqWG53UTR5S2IvN041TjAxV2Q4S29tRTFHT0ZjMGlyUGlvQ2gzM3IwUTk4UnozSC9CMlpURjg0Wm9qVXV1WllYVG9Fb2NFeWRFSmUvTXltZWlROXdWWGFKSkhDZVQ3ZjAxamxOWHNxNU93MjNWeExhTS83OWd5WFV4SkQ3eC95L2VSY1ZWOFJBcms0NXhMZ20wWCt3a3VTYXgwaXk1RXpkdlROeW5ncG0xMzRNbVZ6NVZ5RVFMUkV6MGluYmlGeisrc1psRk51aXRSTGlCczVxSkc1K0tCK0o5Z25sUllodDRwRHZudG9TaVllT0g2QlA5V0oveTRWdWNSU25NNHRsSzNUdk83RXFHVmJOTmVOUmZkOUIrZmVFTXB4ajR4V0ltQllhWjZFVkNhT09WdUNSNlFuRmRLTlhEQ3RCUlRveEhWYnppeG5nK3J0S0VVbFNYUTNHZUcvRkxxUzg4UzYyTk9iR3hLcmFhTUNRN01ralVTaWR2WXBUVHFDc2NROWd2QkhhV3QxREp3Z0dFdzlUeld0YnlXSHZFTjg2UDhRUk53SnA5TWJ0dFpvZldlZDRrS1d6TjQ0all3MXBXWW51NEdrMjZGdHZEUzE1T3NPTTZTbWhWQUl0dHpsNXVvMkhXN0VGanlyVTRRc0ZvcC9FZjRPenRFNStweVVOVXRBZ1d1Q09UWkN6bENKMWliajR4N1didFBqL0d2dkFpdm45TEk2L2tDSlJ5SVNoallodmZqTVlKRi9MOUlRU2JtT3R4QmVwa1hneXRQNFRuYVFpdDlObkRZcHZZQ0JYY0tQdjVMc0xjSEZ4YmczQ2pjd1cydTlkajFoeEFJK0VOSkVJelQ4ZTlCYmpPSXdTbHhHamF1YnFHYUt0NWpwVytwZGFuYjdGbVpLbXJ6eHk5OWdtN202TmRWcEdkNWNzazFUZ01FTmZiaEdqbVgyK1pVWTdYR0hHdEowTzMwOFdLblJPeFFIOGVwUmIzSWpwSTY0d21jNzFkUUhTTUxqVkRIaFJSMDhOT1U0a2lQRXhNTzJESkM4SnZBUVlBME9MYjl6bDVEK2dBQUFBQVNVVk9SSzVDWUlJPSd9XVxuICB9XG5cbiAgZm9yZ2Uubm90aWZpY2F0aW9uLmNyZWF0ZShvcHRzLCBmdW5jdGlvbigpIHtcbiAgICBjYWxsKCdmZWxvZy5pbmZvJywgJ25vdGlmaWNhdGlvbl9yZWxvYWRfdGFic19jbGljaycpXG4gICAgcmVsb2FkQWpheFBhZ2VzKClcbiAgfSlcblxuICBjYWxsKCdmZWxvZy5pbmZvJywgJ25vdGlmaWNhdGlvbl9yZWxvYWRfdGFic19zaG93Jylcbn1cblxuZnVuY3Rpb24gcmVsb2FkVGFiKGlkKSB7XG4gIGZvcmdlLnRhYnMucmVsb2FkKGlkKVxufVxuXG5mdW5jdGlvbiB0b1JlbG9hZCh1cmwpIHtcbiAgbGV0IGludGVybmFsID0gdXJsLmluZGV4T2YoJ2h0dHAnKSAhPT0gMFxuICByZXR1cm4gIWludGVybmFsICYmIHVybC5pbmRleE9mKCcuZ3JhbW1hcmx5LmNvbScpID09IC0xXG59XG5cbmZ1bmN0aW9uIGlzVGhlcmVQYWdlc1RvUmVsb2FkKGNiKSB7XG4gIHJlbG9hZEFsbChudWxsLCBjYilcbn1cblxuZnVuY3Rpb24gcmVsb2FkQWxsKGZvcmNlLCBjYlJlbG9hZGVkKSB7XG4gIGxldCBjYiA9IGNiUmVsb2FkZWQgfHwgcmVsb2FkVGFiLFxuICAgIGlzUmVsb2FkZWQgPSBmYWxzZVxuXG4gIGZvcmdlLnRhYnMuYWxsVGFicyh0YWJzID0+IHtcbiAgICB0YWJzLmZpbHRlcigoe2lkLCB1cmx9KSA9PiB7XG4gICAgICByZXR1cm4gdG9SZWxvYWQodXJsKSAmJiAoZm9yY2UgfHwgcGFnZUNvbmZpZy5pc1BhZ2VUb1JlbG9hZCh1cmwpKVxuICAgIH0pXG4gICAgLmZvckVhY2goKHtpZCwgdXJsfSkgPT4ge1xuICAgICAgbGV0IGZpcmVPbmNlID0gaXNSZWxvYWRlZCAmJiBjYlJlbG9hZGVkXG4gICAgICBpZiAoIWZpcmVPbmNlKSBjYihpZClcbiAgICAgIGlzUmVsb2FkZWQgPSB0cnVlXG4gICAgfSlcbiAgfSlcblxuICBpZiAoIWlzUmVsb2FkZWQgJiYgY2JSZWxvYWRlZCkge1xuICAgIGNiUmVsb2FkZWQoZmFsc2UpXG4gIH1cbn1cblxuZnVuY3Rpb24gcmVsb2FkQWpheFBhZ2VzKCkge1xuICByZWxvYWRBbGwoKVxufVxuXG5mdW5jdGlvbiBzZXRCYWRnZSh2YWx1ZSkge1xuICBmb3JnZS5idXR0b24uc2V0QmFkZ2UodmFsdWUsIF9mLCBfZilcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICB1cGRhdGUsXG4gIGNoZWNrQmFkZ2Vcbn1cbiJdfQ==
},{"../page-config":"/project/src/js/lib/page-config/index.js","../prefs":"/project/src/js/lib/prefs.js","../tracking/index":"/project/src/js/lib/tracking/index.js","../util":"/project/src/js/lib/util.js","./news":"/project/src/js/lib/bg/news.js","./referrals":"/project/src/js/lib/bg/referrals.js"}],"/project/src/js/lib/bg/bg.js":[function(require,module,exports){
(function (global){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

require('babel/polyfill');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _forge = (typeof window !== "undefined" ? window['forge'] : typeof global !== "undefined" ? global['forge'] : null);

var _forge2 = _interopRequireDefault(_forge);

require('./isbg');

var _prefs = require('../prefs');

var _prefs2 = _interopRequireDefault(_prefs);

var _socket = require('../socket');

var _socket2 = _interopRequireDefault(_socket);

var _location = require('../location');

var _config = require('../config');

var _trackingIndex = require('../tracking/index');

var _util = require('../util');

var _api = require('./api');

var _api2 = _interopRequireDefault(_api);

var _auth = require('./auth');

var _auth2 = _interopRequireDefault(_auth);

var _badge = require('./badge');

var _badge2 = _interopRequireDefault(_badge);

var _news = require('./news');

var _news2 = _interopRequireDefault(_news);

var _chrome = require('./chrome');

var _pageConfig = require('../page-config');

var _pageConfig2 = _interopRequireDefault(_pageConfig);

var startCounter = 0;

//try to fix load with undefined forge, when bg page is crashing
function startBgPage() {
  if (!_forge2['default']) {
    _prefs2['default'].get('wasReloaded', function (wasReloaded) {

      if (startCounter > 4) {
        if (wasReloaded) {
          console.error('forge was not loaded after reload, stop trying to init');
          //try to init tracker and send log to the felog
          (0, _trackingIndex.initBgOrPopup)();
          (0, _trackingIndex.call)('felog.error', 'bg_page_forge_undefined');
          return;
        } else {
          //force reload of bg page
          console.error('reload of the bg page, forge was not loaded');
          _prefs2['default'].set('wasReloaded', true);

          (0, _util.bgPageReload)();
        }
      }

      setTimeout(startBgPage, 1000);
      startCounter++;
    });
  } else {
    //cleaning, normal load
    startCounter = 0;
    _prefs2['default'].set('wasReloaded', false);

    document.readyState == 'loading' ? document.addEventListener('DOMContentLoaded', start, false) : start();
  }
}

startBgPage();

(0, _chrome.setUninstallURL)();
(0, _chrome.setupForcedUpdate)();

function start() {
  var user;
  return regeneratorRuntime.async(function start$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        (0, _api2['default'])();
        (0, _socket2['default'])();
        (0, _trackingIndex.initBgOrPopup)();
        context$1$0.next = 5;
        return regeneratorRuntime.awrap(_pageConfig2['default'].init());

      case 5:
        (0, _chrome.loadProxy)();

        context$1$0.prev = 6;
        context$1$0.next = 9;
        return regeneratorRuntime.awrap(checkUpdate());

      case 9:
        context$1$0.next = 11;
        return regeneratorRuntime.awrap(_auth2['default'].login());

      case 11:
        user = context$1$0.sent;

        if (user.anonymous) _news2['default'].install();
        (0, _chrome.loadContentScripts)('grammarly.com');
        _badge2['default'].checkBadge();
        context$1$0.next = 21;
        break;

      case 17:
        context$1$0.prev = 17;
        context$1$0.t0 = context$1$0['catch'](6);

        (0, _trackingIndex.call)('felog.error', 'bg_page_start_fail', context$1$0.t0);
        console.error(context$1$0.t0);

      case 21:
        context$1$0.next = 23;
        return regeneratorRuntime.awrap(checkBgInit());

      case 23:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this, [[6, 17]]);
}

function checkBgInit() {
  var bgFails;
  return regeneratorRuntime.async(function checkBgInit$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap(_prefs2['default'].get('bgInitFail'));

      case 2:
        bgFails = context$1$0.sent;

        if (bgFails) {
          context$1$0.next = 5;
          break;
        }

        return context$1$0.abrupt('return');

      case 5:

        (0, _trackingIndex.call)('felog.error', 'bg_init_fail', { bgFails: bgFails });
        _prefs2['default'].set('bgInitFail', 0);

      case 7:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

function checkUpdate() {
  var version, previousVersion;
  return regeneratorRuntime.async(function checkUpdate$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        version = (0, _config.getVersion)();
        context$1$0.next = 3;
        return regeneratorRuntime.awrap(_prefs2['default'].get('version'));

      case 3:
        previousVersion = context$1$0.sent;

        if (!(version == previousVersion)) {
          context$1$0.next = 6;
          break;
        }

        return context$1$0.abrupt('return');

      case 6:
        if (previousVersion) {
          context$1$0.next = 13;
          break;
        }

        context$1$0.next = 9;
        return regeneratorRuntime.awrap(install());

      case 9:
        //call it to populate prefs - we need them when open popup
        _prefs2['default'].set('enabledDefs', false);
        _news2['default'].install();
        context$1$0.next = 18;
        break;

      case 13:
        (0, _trackingIndex.call)('statsc.ui.increment', 'stability:bg_page_reload');
        (0, _trackingIndex.call)('felog.event', 'bg_page_reload');
        (0, _trackingIndex.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/updated');

        _prefs2['default'].get('enabledDefs', function (enabledDefs) {
          if (_lodash2['default'].isBoolean(enabledDefs)) return;
          _prefs2['default'].set('enabledDefs', true); //existing users get true
        });

        if (version.split('.')[0] != previousVersion.split('.')[0]) {
          _badge2['default'].update();
        }

      case 18:

        _prefs2['default'].set('version', version);

      case 19:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

function install() {
  var domain, fromFunnel, installTrack, browserName;
  return regeneratorRuntime.async(function install$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        browserName = function browserName() {
          var browser = (0, _util.getBrowser)();
          return browser[0].toUpperCase() + browser.slice(1);
        };

        installTrack = function installTrack(fromFunnel) {
          var data = { gProduct: 'Extension-' + (0, _util.getBrowser)() };
          (0, _trackingIndex.call)('felog.info', 'extension_install', { source: fromFunnel ? 'funnel' : 'webstore' });
          (0, _trackingIndex.call)('mixpanel.setProps', _defineProperty({}, 'date' + browserName() + 'ExtensionInstalled', Date.now()));
          (0, _trackingIndex.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/installed');
          (0, _trackingIndex.call)('mixpanel.track', 'G:Grammarly_Product_First_Used', data);
          (0, _trackingIndex.call)('mixpanel.track', 'G:Grammarly_Product_Installed', data);
        };

        (0, _chrome.loadContentScripts)();
        context$1$0.next = 5;
        return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

      case 5:
        domain = context$1$0.sent;
        fromFunnel = domain.indexOf('grammarly.com') > -1;

        installTrack(fromFunnel);

        if (!"true") {
          context$1$0.next = 11;
          break;
        }

        context$1$0.next = 11;
        return regeneratorRuntime.awrap(openWelcome(fromFunnel));

      case 11:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

function openWelcome(funnel) {
  if ((0, _util.isChrome)() && funnel) return;
  var url = (0, _util.isChrome)() ? _config.URLS.welcomeC : _config.URLS.authCreatePage + '/?extension_install=true';

  return new Promise(function (resolve) {
    return funnel ? _forge2['default'].tabs.updateCurrent(url, resolve) : _forge2['default'].tabs.open(url, false, resolve);
  });
}

}).call(this,typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9wcm9qZWN0L3NyYy9qcy9saWIvYmcvYmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztRQUFPLGdCQUFnQjs7c0JBQ1QsUUFBUTs7OztxQkFDSixPQUFPOzs7O1FBQ2xCLFFBQVE7O3FCQUNHLFVBQVU7Ozs7c0JBQ1QsV0FBVzs7Ozt3QkFDQyxhQUFhOztzQkFDYixXQUFXOzs2QkFDUixtQkFBbUI7O29CQUNKLFNBQVM7O21CQUMxQyxPQUFPOzs7O29CQUNOLFFBQVE7Ozs7cUJBQ1AsU0FBUzs7OztvQkFDVixRQUFROzs7O3NCQUN1RCxVQUFVOzswQkFDbkUsZ0JBQWdCOzs7O0FBRXZDLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQTs7O0FBR3BCLFNBQVMsV0FBVyxHQUFHO0FBQ3JCLE1BQUksbUJBQU0sRUFBRTtBQUNWLHVCQUFNLEdBQUcsQ0FBQyxhQUFhLEVBQUUsVUFBQSxXQUFXLEVBQUk7O0FBRXRDLFVBQUksWUFBWSxHQUFHLENBQUMsRUFBRTtBQUNwQixZQUFJLFdBQVcsRUFBRTtBQUNmLGlCQUFPLENBQUMsS0FBSyxDQUFDLHdEQUF3RCxDQUFDLENBQUE7O0FBRXZFLDZDQUFlLENBQUE7QUFDZixtQ0FBSyxhQUFhLEVBQUUseUJBQXlCLENBQUMsQ0FBQTtBQUM5QyxpQkFBTTtTQUNQLE1BQ0k7O0FBRUgsaUJBQU8sQ0FBQyxLQUFLLENBQUMsNkNBQTZDLENBQUMsQ0FBQTtBQUM1RCw2QkFBTSxHQUFHLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFBOztBQUU5QixtQ0FBYyxDQUFBO1NBQ2Y7T0FDRjs7QUFFRCxnQkFBVSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQTtBQUM3QixrQkFBWSxFQUFFLENBQUE7S0FDZixDQUFDLENBQUE7R0FDSCxNQUNJOztBQUVILGdCQUFZLEdBQUcsQ0FBQyxDQUFBO0FBQ2hCLHVCQUFNLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUE7O0FBRS9CLFlBQVEsQ0FBQyxV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IiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAnYmFiZWwvcG9seWZpbGwnXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnXG5pbXBvcnQgZm9yZ2UgZnJvbSAnZm9yZ2UnXG5pbXBvcnQgJy4vaXNiZydcbmltcG9ydCBwcmVmcyBmcm9tICcuLi9wcmVmcydcbmltcG9ydCBTb2NrZXQgZnJvbSAnLi4vc29ja2V0J1xuaW1wb3J0IHtwcm9taXNlR2V0RG9tYWlufSBmcm9tICcuLi9sb2NhdGlvbidcbmltcG9ydCB7Z2V0VmVyc2lvbiwgVVJMU30gZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IHtjYWxsLCBpbml0QmdPclBvcHVwfSBmcm9tICcuLi90cmFja2luZy9pbmRleCdcbmltcG9ydCB7aXNDaHJvbWUsIGdldEJyb3dzZXIsIGJnUGFnZVJlbG9hZH0gZnJvbSAnLi4vdXRpbCdcbmltcG9ydCBBUEkgZnJvbSAnLi9hcGknXG5pbXBvcnQgYXV0aCBmcm9tICcuL2F1dGgnXG5pbXBvcnQgYmFkZ2UgZnJvbSAnLi9iYWRnZSdcbmltcG9ydCBuZXdzIGZyb20gJy4vbmV3cydcbmltcG9ydCB7c2V0VW5pbnN0YWxsVVJMLCBzZXR1cEZvcmNlZFVwZGF0ZSwgbG9hZENvbnRlbnRTY3JpcHRzLCBsb2FkUHJveHl9IGZyb20gJy4vY2hyb21lJ1xuaW1wb3J0IHBhZ2VDb25maWcgZnJvbSAnLi4vcGFnZS1jb25maWcnXG5cbmxldCBzdGFydENvdW50ZXIgPSAwXG5cbi8vdHJ5IHRvIGZpeCBsb2FkIHdpdGggdW5kZWZpbmVkIGZvcmdlLCB3aGVuIGJnIHBhZ2UgaXMgY3Jhc2hpbmdcbmZ1bmN0aW9uIHN0YXJ0QmdQYWdlKCkge1xuICBpZiAoIWZvcmdlKSB7XG4gICAgcHJlZnMuZ2V0KCd3YXNSZWxvYWRlZCcsIHdhc1JlbG9hZGVkID0+IHtcblxuICAgICAgaWYgKHN0YXJ0Q291bnRlciA+IDQpIHtcbiAgICAgICAgaWYgKHdhc1JlbG9hZGVkKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcignZm9yZ2Ugd2FzIG5vdCBsb2FkZWQgYWZ0ZXIgcmVsb2FkLCBzdG9wIHRyeWluZyB0byBpbml0JylcbiAgICAgICAgICAvL3RyeSB0byBpbml0IHRyYWNrZXIgYW5kIHNlbmQgbG9nIHRvIHRoZSBmZWxvZ1xuICAgICAgICAgIGluaXRCZ09yUG9wdXAoKVxuICAgICAgICAgIGNhbGwoJ2ZlbG9nLmVycm9yJywgJ2JnX3BhZ2VfZm9yZ2VfdW5kZWZpbmVkJylcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAvL2ZvcmNlIHJlbG9hZCBvZiBiZyBwYWdlXG4gICAgICAgICAgY29uc29sZS5lcnJvcigncmVsb2FkIG9mIHRoZSBiZyBwYWdlLCBmb3JnZSB3YXMgbm90IGxvYWRlZCcpXG4gICAgICAgICAgcHJlZnMuc2V0KCd3YXNSZWxvYWRlZCcsIHRydWUpXG5cbiAgICAgICAgICBiZ1BhZ2VSZWxvYWQoKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNldFRpbWVvdXQoc3RhcnRCZ1BhZ2UsIDEwMDApXG4gICAgICBzdGFydENvdW50ZXIrK1xuICAgIH0pXG4gIH1cbiAgZWxzZSB7XG4gICAgLy9jbGVhbmluZywgbm9ybWFsIGxvYWRcbiAgICBzdGFydENvdW50ZXIgPSAwXG4gICAgcHJlZnMuc2V0KCd3YXNSZWxvYWRlZCcsIGZhbHNlKVxuXG4gICAgZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnbG9hZGluZycgP1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHN0YXJ0LCBmYWxzZSkgOlxuICAgICAgc3RhcnQoKVxuICB9XG59XG5cbnN0YXJ0QmdQYWdlKClcblxuc2V0VW5pbnN0YWxsVVJMKClcbnNldHVwRm9yY2VkVXBkYXRlKClcblxuYXN5bmMgZnVuY3Rpb24gc3RhcnQoKSB7XG4gIEFQSSgpXG4gIFNvY2tldCgpXG4gIGluaXRCZ09yUG9wdXAoKVxuICBhd2FpdCBwYWdlQ29uZmlnLmluaXQoKVxuICBsb2FkUHJveHkoKVxuXG4gIHRyeSB7XG4gICAgYXdhaXQgY2hlY2tVcGRhdGUoKVxuICAgIGxldCB1c2VyID0gYXdhaXQgYXV0aC5sb2dpbigpXG4gICAgaWYgKHVzZXIuYW5vbnltb3VzKSBuZXdzLmluc3RhbGwoKVxuICAgIGxvYWRDb250ZW50U2NyaXB0cygnZ3JhbW1hcmx5LmNvbScpXG4gICAgYmFkZ2UuY2hlY2tCYWRnZSgpXG4gIH1cbiAgY2F0Y2goZSkge1xuICAgIGNhbGwoJ2ZlbG9nLmVycm9yJywgJ2JnX3BhZ2Vfc3RhcnRfZmFpbCcsIGUpXG4gICAgY29uc29sZS5lcnJvcihlKVxuICB9XG4gIGF3YWl0IGNoZWNrQmdJbml0KClcbn1cblxuYXN5bmMgZnVuY3Rpb24gY2hlY2tCZ0luaXQoKSB7XG4gIGNvbnN0IGJnRmFpbHMgPSBhd2FpdCBwcmVmcy5nZXQoJ2JnSW5pdEZhaWwnKVxuXG4gIGlmICghYmdGYWlscykgcmV0dXJuXG5cbiAgY2FsbCgnZmVsb2cuZXJyb3InLCAnYmdfaW5pdF9mYWlsJywge2JnRmFpbHN9KVxuICBwcmVmcy5zZXQoJ2JnSW5pdEZhaWwnLCAwKVxufVxuXG5hc3luYyBmdW5jdGlvbiBjaGVja1VwZGF0ZSgpIHtcbiAgbGV0IHZlcnNpb24gPSBnZXRWZXJzaW9uKClcbiAgbGV0IHByZXZpb3VzVmVyc2lvbiA9IGF3YWl0IHByZWZzLmdldCgndmVyc2lvbicpXG5cbiAgaWYgKHZlcnNpb24gPT0gcHJldmlvdXNWZXJzaW9uKSByZXR1cm5cblxuICBpZiAoIXByZXZpb3VzVmVyc2lvbikge1xuICAgIGF3YWl0IGluc3RhbGwoKVxuICAgIC8vY2FsbCBpdCB0byBwb3B1bGF0ZSBwcmVmcyAtIHdlIG5lZWQgdGhlbSB3aGVuIG9wZW4gcG9wdXBcbiAgICBwcmVmcy5zZXQoJ2VuYWJsZWREZWZzJywgZmFsc2UpXG4gICAgbmV3cy5pbnN0YWxsKClcbiAgfVxuICBlbHNlIHtcbiAgICBjYWxsKCdzdGF0c2MudWkuaW5jcmVtZW50JywgJ3N0YWJpbGl0eTpiZ19wYWdlX3JlbG9hZCcpXG4gICAgY2FsbCgnZmVsb2cuZXZlbnQnLCAnYmdfcGFnZV9yZWxvYWQnKVxuICAgIGNhbGwoJ2duYXIuc2VuZCcsIGAke2dldEJyb3dzZXIoKX1FeHQvdXBkYXRlZGApXG5cbiAgICBwcmVmcy5nZXQoJ2VuYWJsZWREZWZzJywgZW5hYmxlZERlZnMgPT4ge1xuICAgICAgaWYgKF8uaXNCb29sZWFuKGVuYWJsZWREZWZzKSkgcmV0dXJuXG4gICAgICBwcmVmcy5zZXQoJ2VuYWJsZWREZWZzJywgdHJ1ZSkgLy9leGlzdGluZyB1c2VycyBnZXQgdHJ1ZVxuICAgIH0pXG5cbiAgICBpZiAodmVyc2lvbi5zcGxpdCgnLicpWzBdICE9IHByZXZpb3VzVmVyc2lvbi5zcGxpdCgnLicpWzBdKSB7XG4gICAgICBiYWRnZS51cGRhdGUoKVxuICAgIH1cbiAgfVxuXG4gIHByZWZzLnNldCgndmVyc2lvbicsIHZlcnNpb24pXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGwoKSB7XG4gIGxvYWRDb250ZW50U2NyaXB0cygpXG4gIGxldCBkb21haW4gPSBhd2FpdCBwcm9taXNlR2V0RG9tYWluKClcbiAgbGV0IGZyb21GdW5uZWwgPSBkb21haW4uaW5kZXhPZignZ3JhbW1hcmx5LmNvbScpID4gLTFcbiAgaW5zdGFsbFRyYWNrKGZyb21GdW5uZWwpXG4gIGlmIChwcm9jZXNzLmVudi5QUk9EKSB7XG4gICAgYXdhaXQgb3BlbldlbGNvbWUoZnJvbUZ1bm5lbClcbiAgfVxuXG4gIGZ1bmN0aW9uIGluc3RhbGxUcmFjayhmcm9tRnVubmVsKSB7XG4gICAgbGV0IGRhdGEgPSB7Z1Byb2R1Y3Q6IGBFeHRlbnNpb24tJHtnZXRCcm93c2VyKCl9YH1cbiAgICBjYWxsKCdmZWxvZy5pbmZvJywgJ2V4dGVuc2lvbl9pbnN0YWxsJywge3NvdXJjZTogZnJvbUZ1bm5lbCA/ICdmdW5uZWwnIDogJ3dlYnN0b3JlJ30pXG4gICAgY2FsbCgnbWl4cGFuZWwuc2V0UHJvcHMnLCB7XG4gICAgICBbYGRhdGUke2Jyb3dzZXJOYW1lKCl9RXh0ZW5zaW9uSW5zdGFsbGVkYF06IERhdGUubm93KClcbiAgICB9KVxuICAgIGNhbGwoJ2duYXIuc2VuZCcsIGAke2dldEJyb3dzZXIoKX1FeHQvaW5zdGFsbGVkYClcbiAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdHOkdyYW1tYXJseV9Qcm9kdWN0X0ZpcnN0X1VzZWQnLCBkYXRhKVxuICAgIGNhbGwoJ21peHBhbmVsLnRyYWNrJywgJ0c6R3JhbW1hcmx5X1Byb2R1Y3RfSW5zdGFsbGVkJywgZGF0YSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGJyb3dzZXJOYW1lKCkge1xuICAgIGxldCBicm93c2VyID0gZ2V0QnJvd3NlcigpXG4gICAgcmV0dXJuIGJyb3dzZXJbMF0udG9VcHBlckNhc2UoKSArIGJyb3dzZXIuc2xpY2UoMSlcbiAgfVxufVxuXG5mdW5jdGlvbiBvcGVuV2VsY29tZShmdW5uZWwpIHtcbiAgaWYgKGlzQ2hyb21lKCkgJiYgZnVubmVsKSByZXR1cm5cbiAgbGV0IHVybCA9IGlzQ2hyb21lKCkgPyBVUkxTLndlbGNvbWVDIDogVVJMUy5hdXRoQ3JlYXRlUGFnZSArICcvP2V4dGVuc2lvbl9pbnN0YWxsPXRydWUnXG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT5cbiAgICBmdW5uZWwgP1xuICAgICAgZm9yZ2UudGFicy51cGRhdGVDdXJyZW50KHVybCwgcmVzb2x2ZSkgOlxuICAgICAgZm9yZ2UudGFicy5vcGVuKHVybCwgZmFsc2UsIHJlc29sdmUpXG4gIClcbn1cbiJdfQ==
},{"../config":"/project/src/js/lib/config.js","../location":"/project/src/js/lib/location.js","../page-config":"/project/src/js/lib/page-config/index.js","../prefs":"/project/src/js/lib/prefs.js","../socket":"/project/src/js/lib/socket.js","../tracking/index":"/project/src/js/lib/tracking/index.js","../util":"/project/src/js/lib/util.js","./api":"/project/src/js/lib/bg/api.js","./auth":"/project/src/js/lib/bg/auth.js","./badge":"/project/src/js/lib/bg/badge.js","./chrome":"/project/src/js/lib/bg/chrome.js","./isbg":"/project/src/js/lib/bg/isbg.js","./news":"/project/src/js/lib/bg/news.js","babel/polyfill":"babel/polyfill","lodash":"lodash"}],"/project/src/js/lib/bg/chrome.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _config = require('../config');

var _pageConfig = require('../page-config');

var _pageConfig2 = _interopRequireDefault(_pageConfig);

var _trackingIndex = require('../tracking/index');

var _location = require('../location');

var _util = require('../util');

var _forge = require('../forge');

var _forge2 = _interopRequireDefault(_forge);

var chrome = window.chrome,
    currentDomain = undefined,
    updateStarted = false;

function setUninstallURL() {
  var domain = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

  if (!(0, _util.isChrome)()) return;
  //case for service urls
  if (!domain || domain.indexOf('.') == -1) return;
  if (currentDomain == domain) return;
  currentDomain = domain;
  var url = domain ? _config.URLS.uninstall + '?domain=' + encodeURI(domain) : _config.URLS.uninstall;
  chrome.runtime.setUninstallURL(url);
}

function setupForcedUpdate() {
  if (!(0, _util.isChrome)() || updateStarted) return;

  chrome.runtime.onUpdateAvailable.addListener(function (details) {
    console.log('Detected the next extension version', details.version);
    (0, _trackingIndex.call)('felog.info', 'chrome_forced_to_update');
    updateStarted = true;

    var willUpdateInMinutes = (0, _util.getRandomIntInclusive)(1, (0, _config.getUpdateTime)());
    console.log('Going to update in minutes:', willUpdateInMinutes);
    setTimeout(chrome.runtime.reload, willUpdateInMinutes * 60 * 1000);
  });
  requestUpdateCheck();
}

function requestUpdateCheck() {
  chrome.runtime.requestUpdateCheck(function (status) {
    if (status == 'update_available') return console.log('update pending...');
    if (status == 'no_update') return console.log('no update found');
    if (status == 'throttled') return console.log('Oops, I\'m asking too frequently - I need to back off.');
  });

  setTimeout(requestUpdateCheck, 1 * 60 * 1000);
}

function getSelectedTabFavicon(cb) {
  chrome.tabs.getSelected(function (tab) {
    cb(tab && tab.favIconUrl);
  });
}

function execJS(id, file) {
  var opts = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  return new Promise(function (resolve, reject) {
    return chrome.tabs.executeScript(id, _extends({ file: file }, opts), function () {
      return (0, _util.chromeBgError)() ? reject((0, _util.chromeBgError)()) : resolve();
    });
  });
}

function execCSS(id, file) {
  var opts = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  return new Promise(function (resolve, reject) {
    return chrome.tabs.insertCSS(id, _extends({ file: file }, opts), function () {
      return (0, _util.chromeBgError)() ? reject((0, _util.chromeBgError)()) : resolve();
    });
  });
}

function loadContentScripts(domain) {
  var manifest, source, tabs, errorHandle;
  return regeneratorRuntime.async(function loadContentScripts$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        if ((0, _util.isChrome)()) {
          context$1$0.next = 2;
          break;
        }

        return context$1$0.abrupt('return');

      case 2:
        manifest = chrome.runtime.getManifest();

        if (manifest) {
          context$1$0.next = 5;
          break;
        }

        return context$1$0.abrupt('return');

      case 5:
        source = manifest.content_scripts.pop();
        context$1$0.next = 8;
        return regeneratorRuntime.awrap(filteredTabs(true, domain));

      case 8:
        tabs = context$1$0.sent;

        if (tabs.length) {
          context$1$0.next = 11;
          break;
        }

        return context$1$0.abrupt('return');

      case 11:

        console.log('Load content scripts to', tabs);

        errorHandle = function errorHandle(e, type) {
          var message = e && e.message || e;
          (0, _trackingIndex.call)('felog.error', 'chrome_cs_' + type + '_load_error', { message: message });
          console.error('cs ' + type + ' loaded with error: ' + message);
        };

        console.time('Content scripts load time');

        context$1$0.next = 16;
        return regeneratorRuntime.awrap(Promise.all(tabs.map(function (_ref) {
          var id = _ref.id;
          return Promise.all([source.js.reduce(function (loader, js) {
            return loader.then(function () {
              return execJS(id, js, { runAt: 'document_idle' });
            });
          }, Promise.resolve()).then(function () {
            return console.log('scripts loaded');
          })['catch'](function (e) {
            return errorHandle(e, 'js');
          }), source.css.reduce(function (loader, css) {
            return loader.then(function () {
              return execCSS(id, css, { runAt: 'document_idle' });
            });
          }, Promise.resolve()).then(function () {
            return console.log('css loaded');
          })['catch'](function (e) {
            return errorHandle(e, 'css');
          })]);
        })));

      case 16:

        console.timeEnd('Content scripts load time');

      case 17:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

function loadProxy() {
  var tabs, message;
  return regeneratorRuntime.async(function loadProxy$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        if ((0, _util.isChrome)()) {
          context$1$0.next = 2;
          break;
        }

        return context$1$0.abrupt('return');

      case 2:
        context$1$0.prev = 2;
        context$1$0.next = 5;
        return regeneratorRuntime.awrap(filteredTabs());

      case 5:
        tabs = context$1$0.sent;
        context$1$0.next = 8;
        return regeneratorRuntime.awrap(Promise.all(tabs.map(function (_ref2) {
          var id = _ref2.id;
          return execJS(id, 'src/js/proxy.js');
        })));

      case 8:
        console.log('proxy loaded on', tabs.map(function (tab) {
          return tab.url;
        }));
        context$1$0.next = 15;
        break;

      case 11:
        context$1$0.prev = 11;
        context$1$0.t0 = context$1$0['catch'](2);
        message = context$1$0.t0 && context$1$0.t0.message || context$1$0.t0;

        //call('felog.error', 'chrome_proxy_load_error', {message})
        console.error('proxy loaded with error: ', message);

      case 15:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this, [[2, 11]]);
}

function checkTabDomain(_ref3) {
  var url = _ref3.url;

  if (url.indexOf('http') != 0) return;
  if (url.includes('grammarly')) return true;
  return _pageConfig2['default'].checkDomain((0, _location.domainFromUrl)(url));
}

function isNotCSLoaded(tab) {
  var isLoaded;
  return regeneratorRuntime.async(function isNotCSLoaded$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap(new Promise(function (resolve) {
          return chrome.tabs.executeScript(tab.id, {
            code: 'document.body.dataset.grCSLoaded'
          }, function (res) {
            return resolve(res && res.pop());
          });
        }));

      case 2:
        isLoaded = context$1$0.sent;
        return context$1$0.abrupt('return', !isLoaded && tab);

      case 4:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

function filteredTabs(onlyOneInstance, domain) {
  var tabs, current, processedTabs;
  return regeneratorRuntime.async(function filteredTabs$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap(new Promise(_forge2['default'].tabs.allTabs));

      case 2:
        tabs = context$1$0.sent;
        context$1$0.next = 5;
        return regeneratorRuntime.awrap(new Promise(_forge2['default'].tabs.getCurrentTabUrl));

      case 5:
        current = context$1$0.sent;
        context$1$0.next = 8;
        return regeneratorRuntime.awrap(Promise.all(tabs.filter(domain ? function (_ref4) {
          var url = _ref4.url;
          return url.includes(domain);
        } : checkTabDomain).map(onlyOneInstance ? isNotCSLoaded : function (tab) {
          return Promise.resolve(tab);
        })));

      case 8:
        processedTabs = context$1$0.sent;
        return context$1$0.abrupt('return', processedTabs.filter(Boolean).sort(function (_ref5) {
          var url = _ref5.url;
          return url == current ? -1 : 1;
        }));

      case 10:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//focused tab will be first
exports.setUninstallURL = setUninstallURL;
exports.setupForcedUpdate = setupForcedUpdate;
exports.getSelectedTabFavicon = getSelectedTabFavicon;
exports.loadContentScripts = loadContentScripts;
exports.filteredTabs = filteredTabs;
exports.loadProxy = loadProxy;

//return true only if we have data variable grCSLoaded in body

},{"../config":"/project/src/js/lib/config.js","../forge":"/project/src/js/lib/forge.js","../location":"/project/src/js/lib/location.js","../page-config":"/project/src/js/lib/page-config/index.js","../tracking/index":"/project/src/js/lib/tracking/index.js","../util":"/project/src/js/lib/util.js"}],"/project/src/js/lib/bg/cookie.js":[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _forge2 = (typeof window !== "undefined" ? window['forge'] : typeof global !== "undefined" ? global['forge'] : null);

var _forge3 = _interopRequireDefault(_forge2);

var _util = require('../util');

var forge = _forge3['default'];
if (!forge) {
  forge = {
    cookies: {
      get: _util._f,
      set: _util._f,
      watch: _util._f
    }
  };
}

var getToken = function getToken(cb) {
  forge.cookies.get('grammarly.com', '/', 'grauth', cb);
  return true;
};

var watchToken = function watchToken(cb) {
  forge.cookies.watch('grammarly.com', '/', 'grauth', cb);
  return true;
};
var watch = function watch(domain, name, cb) {
  forge.cookies.watch(domain, '/', name, cb);
  return true;
};

var getCookie = function getCookie(domain, name, cb) {
  forge.cookies.get(domain, '/', name, cb);
  return true;
};

var set = function set(data) {
  forge.cookies.set(data);
};

exports['default'] = {
  getCookie: getCookie,
  get: getCookie,
  set: set,
  watch: watch,
  getToken: getToken,
  watchToken: watchToken
};
module.exports = exports['default'];

}).call(this,typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9wcm9qZWN0L3NyYy9qcy9saWIvYmcvY29va2llLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztzQkFBbUIsT0FBTzs7OztvQkFDVCxTQUFTOztBQUUxQixJQUFJLEtBQUsscUJBQVMsQ0FBQTtBQUNsQixJQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1YsT0FBSyxHQUFHO0FBQ04sV0FBTyxFQUFFO0FBQ1AsU0FBRyxVQUFJO0FBQ1AsU0FBRyxVQUFJO0FBQ1AsV0FBSyxVQUFJO0tBQ1Y7R0FDRixDQUFBO0NBQ0Y7O0FBRUQsSUFBSSxRQUFRLEdBQUcsU0FBWCxRQUFRLENBQUcsRUFBRSxFQUFJO0FBQ25CLE9BQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0FBQ3JELFNBQU8sSUFBSSxDQUFBO0NBQ1osQ0FBQTs7QUFFRCxJQUFJLFVBQVUsR0FBRyxTQUFiLFVBQVUsQ0FBRyxFQUFFLEVBQUk7QUFDckIsT0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDdkQsU0FBTyxJQUFJLENBQUE7Q0FDWixDQUFBO0FBQ0QsSUFBSSxLQUFLLEdBQUcsU0FBUixLQUFLLENBQUksTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUs7QUFDaEMsT0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUE7QUFDMUMsU0FBTyxJQUFJLENBQUE7Q0FDWixDQUFBOztBQUVELElBQUksU0FBUyxHQUFHLFNBQVosU0FBUyxDQUFJLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFLO0FBQ3BDLE9BQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0FBQ3hDLFNBQU8sSUFBSSxDQUFBO0NBQ1osQ0FBQTs7QUFFRCxJQUFJLEdBQUcsR0FBRyxTQUFOLEdBQUcsQ0FBRyxJQUFJLEVBQUk7QUFDaEIsT0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7Q0FDeEIsQ0FBQTs7cUJBRWM7QUFDYixXQUFTLEVBQVQsU0FBUztBQUNULEtBQUcsRUFBRSxTQUFTO0FBQ2QsS0FBRyxFQUFILEdBQUc7QUFDSCxPQUFLLEVBQUwsS0FBSztBQUNMLFVBQVEsRUFBUixRQUFRO0FBQ1IsWUFBVSxFQUFWLFVBQVU7Q0FDWCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IF9mb3JnZSBmcm9tICdmb3JnZSdcbmltcG9ydCB7X2Z9IGZyb20gJy4uL3V0aWwnXG5cbmxldCBmb3JnZSA9IF9mb3JnZVxuaWYgKCFmb3JnZSkge1xuICBmb3JnZSA9IHtcbiAgICBjb29raWVzOiB7XG4gICAgICBnZXQ6IF9mLFxuICAgICAgc2V0OiBfZixcbiAgICAgIHdhdGNoOiBfZlxuICAgIH1cbiAgfVxufVxuXG5sZXQgZ2V0VG9rZW4gPSBjYiA9PiB7XG4gIGZvcmdlLmNvb2tpZXMuZ2V0KCdncmFtbWFybHkuY29tJywgJy8nLCAnZ3JhdXRoJywgY2IpXG4gIHJldHVybiB0cnVlXG59XG5cbmxldCB3YXRjaFRva2VuID0gY2IgPT4ge1xuICBmb3JnZS5jb29raWVzLndhdGNoKCdncmFtbWFybHkuY29tJywgJy8nLCAnZ3JhdXRoJywgY2IpXG4gIHJldHVybiB0cnVlXG59XG5sZXQgd2F0Y2ggPSAoZG9tYWluLCBuYW1lLCBjYikgPT4ge1xuICBmb3JnZS5jb29raWVzLndhdGNoKGRvbWFpbiwgJy8nLCBuYW1lLCBjYilcbiAgcmV0dXJuIHRydWVcbn1cblxubGV0IGdldENvb2tpZSA9IChkb21haW4sIG5hbWUsIGNiKSA9PiB7XG4gIGZvcmdlLmNvb2tpZXMuZ2V0KGRvbWFpbiwgJy8nLCBuYW1lLCBjYilcbiAgcmV0dXJuIHRydWVcbn1cblxubGV0IHNldCA9IGRhdGEgPT4ge1xuICBmb3JnZS5jb29raWVzLnNldChkYXRhKVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGdldENvb2tpZSxcbiAgZ2V0OiBnZXRDb29raWUsXG4gIHNldCxcbiAgd2F0Y2gsXG4gIGdldFRva2VuLFxuICB3YXRjaFRva2VuXG59XG4iXX0=
},{"../util":"/project/src/js/lib/util.js"}],"/project/src/js/lib/bg/isbg.js":[function(require,module,exports){
"use strict";

window.IS_BG = true;

},{}],"/project/src/js/lib/bg/news.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _prefs = require('../prefs');

var _prefs2 = _interopRequireDefault(_prefs);

var _config = require('../config');

function install() {
  _prefs2['default'].set('seenNewsVersion', _config.newsId);
}

function isShowNews() {
  var seenNewsVersion, isAnonymous;
  return regeneratorRuntime.async(function isShowNews$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap(_prefs2['default'].get('seenNewsVersion'));

      case 2:
        seenNewsVersion = context$1$0.sent;
        context$1$0.next = 5;
        return regeneratorRuntime.awrap(_prefs2['default'].get('anonymous'));

      case 5:
        isAnonymous = context$1$0.sent;
        return context$1$0.abrupt('return', !isAnonymous && _config.newsId && seenNewsVersion != _config.newsId);

      case 7:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

//sync version of isShowNews
function isShowNewsToUser(user) {
  return _config.newsId && _config.newsId != user.seenNewsVersion;
}

exports['default'] = {
  install: install,
  isShowNews: isShowNews,
  isShowNewsToUser: isShowNewsToUser
};
module.exports = exports['default'];

},{"../config":"/project/src/js/lib/config.js","../prefs":"/project/src/js/lib/prefs.js"}],"/project/src/js/lib/bg/offline.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _emitter = require('emitter');

var _emitter2 = _interopRequireDefault(_emitter);

var _dom = require('../dom');

//import {URLS} from '../config'

var Offline = function Offline() {
  var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  var me = (0, _emitter2['default'])({}),
      win = config.window || window;

  var online = function online() {
    return me.emit('online');
  },
      offline = function offline() {
    return me.emit('offline');
  };

  (0, _dom.listen)(win, { online: online, offline: offline });

  me.stop = function () {
    return (0, _dom.unlisten)(win, { online: online, offline: offline });
  };

  return me;

  //console.log('start listen Connection', URLS.offline)

  /*let requesting,
    offline,
    xhr = new XMLHttpRequest()
   if (me.listeningAjax) return
   me.listeningAjax = true
   function fetch() {
    if (requesting) return
     let url = URLS.offline,
      noResponseTimer = setTimeout(() => {
        xhr.abort()
        requesting = false
         if (!offline) {
          offline = true
          me.emit('offline')
        }
      }, 10000)
     xhr.onreadystatechange = e => {
      if (xhr.readyState != 4) return
       requesting = false
      clearTimeout(noResponseTimer)
       if (xhr.status == 200) {
        if (offline) {
          offline = false
          me.emit('online')
        }
      }
      else if (!offline) {
        offline = true
        me.emit('offline')
      }
    }
     requesting = true
    xhr.open('GET', url + '?' + guid())
    xhr.send()
  }
   interval(fetch, 10000)
   me.stop = global => {
    cancelInterval(fetch)
    me.listeningAjax = false
  }
   return me*/
};

exports['default'] = Offline;
module.exports = exports['default'];

},{"../dom":"/project/src/js/lib/dom.js","emitter":"emitter"}],"/project/src/js/lib/bg/referrals.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _prefs = require('../prefs');

var _prefs2 = _interopRequireDefault(_prefs);

function isShowReferralRibbon() {
  var groups, inReferralGroup, referralNewsBadge;
  return regeneratorRuntime.async(function isShowReferralRibbon$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap(_prefs2['default'].get('groups'));

      case 2:
        groups = context$1$0.sent;
        inReferralGroup = groups && groups.some(function () {
          var el = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
          return el.indexOf('referral_locked') > -1 || el == 'referral' || el == 'test_group';
        });
        context$1$0.next = 6;
        return regeneratorRuntime.awrap(_prefs2['default'].get('referralNewsBadge'));

      case 6:
        referralNewsBadge = context$1$0.sent;
        return context$1$0.abrupt('return', inReferralGroup && !referralNewsBadge);

      case 8:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}

var seenReferralRibbon = function seenReferralRibbon() {
  var key = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

  _prefs2['default'].set('referralNewsBadge', key);
};

exports['default'] = {
  isShowReferralRibbon: isShowReferralRibbon,
  seenReferralRibbon: seenReferralRibbon
};
module.exports = exports['default'];

},{"../prefs":"/project/src/js/lib/prefs.js"}],"/project/src/js/lib/config.js":[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

require('babel/polyfill');

var _forge = (typeof window !== "undefined" ? window['forge'] : typeof global !== "undefined" ? global['forge'] : null);

var _forge2 = _interopRequireDefault(_forge);

var _sparkMd5 = require('spark-md5');

var _sparkMd52 = _interopRequireDefault(_sparkMd5);

var _prefs = require('./prefs');

var _prefs2 = _interopRequireDefault(_prefs);

var FELOG = {
  key: 'b37252e300204b00ad697fe1d3b979e1',
  project: '15',
  pingTimeout: 10 * 60 * 1000
};

var GNAR = {
  url: 'https://gnar.grammarly.com',
  qaUrl: 'https://qagnar.grammarly.com'
};

var mpkey = 'c10dd64c87f70ef5563a63c368797e8c';
var MIXPANEL = {
  qaKey: '7a5c95b5cba1b225d00cc3ba1c410c78',
  key: mpkey,
  cookie: 'mp_' + mpkey + '_mixpanel'
};

if (!"true") {
  GNAR.url = GNAR.qaUrl;

  var _mpkey = MIXPANEL.qaKey;
  MIXPANEL.key = _mpkey;
  MIXPANEL.cookie = 'mp_' + _mpkey + '_mixpanel';
}

var STATSC = {
  URL: 'https://stats-public.grammarly.io/',
  PREFIX: 'grammarly.ui'
};

var DAPI = 'https://data.grammarly.com';

var app = 'https://app.grammarly.com';
var authUser = 'https://auth.grammarly.com/user';
var welcomeFandS = 'https://www.grammarly.com/after_install_page';
var URLS = {
  app: app,
  capi: 'wss://capi.grammarly.com/freews',
  dapiMimic: DAPI + '/api/mimic',
  editor: app + '/popup2',
  dictionary: 'https://capi.grammarly.com/api/defs',
  upgrade: 'https://www.grammarly.com/upgrade',
  authUser: authUser,
  authSettings: authUser + '/settings',
  authGroup: authUser + '/group',
  authPing: authUser + '/sync',
  authCreateAnonymous: authUser + '/anonymous',
  authCreatePage: 'https://auth.grammarly.com/redirect-anonymous?location=' + welcomeFandS,
  docs: app + '/docs',
  docsApi: 'https://dox.grammarly.com/documents',
  offline: 'https://ed.grammarly.com/download/firefox/update.json',
  welcomeC: 'https://www.grammarly.com/extension-success',
  uninstall: 'https://www.grammarly.com/extension-uninstall',
  userOrAnonymous: 'https://auth.grammarly.com/user/oranonymous',
  authSignin: 'https://auth.grammarly.com/login',
  authSignup: 'https://auth.grammarly.com/signup',
  signin: 'https://www.grammarly.com/signin',
  signup: 'https://www.grammarly.com/signup',
  welcomeFandS: welcomeFandS,
  raven: 'felog.grammarly.io',
  referral: 'https://www.grammarly.com/referral',
  pageConfigUrl: 'https://d3cv4a9a9wh0bt.cloudfront.net/browserplugin/config.json',
  resetPassword: 'https://www.grammarly.com/resetpassword',
  terms: 'https://www.grammarly.com/terms',
  policy: 'https://www.grammarly.com/privacy-policy'
};

var urlKeys = Object.keys(URLS);
var pkey = function pkey(key) {
  return 'URLS.' + key;
};

_prefs2['default'].get(urlKeys.map(pkey), function (result) {
  return urlKeys.filter(function (url) {
    return result[pkey(url)];
  }).forEach(function (url) {
    return URLS[url] = result[pkey(url)];
  });
});

function getVersion() {
  if (!_forge2['default']) return;
  return _forge2['default'].config.modules.parameters.version;
}

function getUpdateTime() {
  if (!_forge2['default']) return;
  return _forge2['default'].config.modules.parameters.updateTime;
}

function getUuid() {
  if (!_forge2['default']) return;
  return _forge2['default'].config.uuid;
}

var news = ['Pop-up editor now opens immediately', 'You may disable definitions on all sites'];

var userFields = ['id', 'email', 'subscriptionFree', 'firstName', 'anonymous', 'type', 'premium', 'settings', 'registrationDate', 'mimic', 'groups', 'extensionInstallDate', 'fixed_errors', 'ext2'];

if (!"true") {
  userFields.push('token');
}

exports['default'] = {
  // debug: true,
  news: news,
  newsId: news.length && _sparkMd52['default'].hash(news.join('\n')),
  getUpdateTime: getUpdateTime,
  URLS: URLS,
  FELOG: FELOG,
  STATSC: STATSC,
  DAPI: DAPI,
  MIXPANEL: MIXPANEL,
  GNAR: GNAR,
  getVersion: getVersion,
  getUuid: getUuid,
  isTest: !_forge2['default'],
  nextVerClass: 'gr_ver_2',
  restrictedAttrs: ['data-gramm_editor', 'data-gramm', 'data-gramm_id', 'gramm_editor', ['aria-label', 'Search Facebook']],
  restrictedParentAttrs: '[data-reactid]',
  userFields: userFields,
  ext2groups: ['001_gbutton_show', '002_gbutton_show', '003_gbutton_show'],
  externalEvents: ['changed-user', 'changed-plan', 'cleanup', 'editor-fix'],
  development: document.location.host == '127.0.0.1:3117'
};
module.exports = exports['default'];

}).call(this,typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9wcm9qZWN0L3NyYy9qcy9saWIvY29uZmlnLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztRQUFPLGdCQUFnQjs7cUJBQ0wsT0FBTzs7Ozt3QkFDSixXQUFXOzs7O3FCQUNkLFNBQVM7Ozs7QUFFM0IsSUFBSSxLQUFLLEdBQUc7QUFDVixLQUFHLEVBQUUsa0NBQWtDO0FBQ3ZDLFNBQU8sRUFBRSxJQUFJO0FBQ2IsYUFBVyxFQUFFLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSTtDQUM1QixDQUFBOztBQUVELElBQUksSUFBSSxHQUFHO0FBQ1QsS0FBRyxFQUFFLDRCQUE0QjtBQUNqQyxPQUFLLEVBQUUsOEJBQThCO0NBQ3RDLENBQUE7O0FBRUQsSUFBSSxLQUFLLEdBQUcsa0NBQWtDLENBQUE7QUFDOUMsSUFBSSxRQUFRLEdBQUc7QUFDYixPQUFLLEVBQUUsa0NBQWtDO0FBQ3pDLEtBQUcsRUFBRSxLQUFLO0FBQ1YsUUFBTSxVQUFRLEtBQUssY0FBVztDQUMvQixDQUFBOztBQUVELElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRTtBQUNyQixNQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUE7O0FBRXJCLE1BQUksTUFBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUE7QUFDMUIsVUFBUSxDQUFDLEdBQUcsR0FBRyxNQUFLLENBQUE7QUFDcEIsVUFBUSxDQUFDLE1BQU0sV0FBUyxNQUFLLGNBQVcsQ0FBQTtDQUN6Qzs7QUFFRCxJQUFJLE1BQU0sR0FBRztBQUNYLEtBQUcsRUFBRSxvQ0FBb0M7QUFDekMsUUFBTSxFQUFFLGNBQWM7Q0FDdkIsQ0FBQTs7QUFFRCxJQUFJLElBQUksR0FBRyw0QkFBNEIsQ0FBQTs7QUFFdkMsSUFBSSxHQUFHLEdBQUcsMkJBQTJCLENBQUE7QUFDckMsSUFBSSxRQUFRLEdBQUcsaUNBQWlDLENBQUE7QUFDaEQsSUFBSSxZQUFZLEdBQUcsOENBQThDLENBQUE7QUFDakUs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QUksRUFBSixJQUFJO0FBQ0osUUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLElBQUksc0JBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckQsZUFBYSxFQUFiLGFBQWE7QUFDYixNQUFJLEVBQUosSUFBSTtBQUNKLE9BQUssRUFBTCxLQUFLO0FBQ0wsUUFBTSxFQUFOLE1BQU07QUFDTixNQUFJLEVBQUosSUFBSTtBQUNKLFVBQVEsRUFBUixRQUFRO0FBQ1IsTUFBSSxFQUFKLElBQUk7QUFDSixZQUFVLEVBQVYsVUFBVTtBQUNWLFNBQU8sRUFBUCxPQUFPO0FBQ1AsUUFBTSxFQUFFLG1CQUFNO0FBQ2QsY0FBWSxFQUFFLFVBQVU7QUFDeEIsaUJBQWUsRUFBRSxDQUFDLG1CQUFtQixFQUFFLFlBQVksRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7QUFDeEgsdUJBQXFCLEVBQUUsZ0JBQWdCO0FBQ3ZDLFlBQVUsRUFBVixVQUFVO0FBQ1YsWUFBVSxFQUFFLENBQUMsa0JBQWtCLEVBQUUsa0JBQWtCLEVBQUUsa0JBQWtCLENBQUM7QUFDeEUsZ0JBQWMsRUFBRSxDQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLFlBQVksQ0FBQztBQUN6RSxhQUFXLEVBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksZ0JBQWdCO0NBQ3hEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgJ2JhYmVsL3BvbHlmaWxsJ1xuaW1wb3J0IGZvcmdlIGZyb20gJ2ZvcmdlJ1xuaW1wb3J0IFNwYXJrTUQ1IGZyb20gJ3NwYXJrLW1kNSdcbmltcG9ydCBwcmVmcyBmcm9tICcuL3ByZWZzJ1xuXG5sZXQgRkVMT0cgPSB7XG4gIGtleTogJ2IzNzI1MmUzMDAyMDRiMDBhZDY5N2ZlMWQzYjk3OWUxJyxcbiAgcHJvamVjdDogJzE1JyxcbiAgcGluZ1RpbWVvdXQ6IDEwICogNjAgKiAxMDAwXG59XG5cbmxldCBHTkFSID0ge1xuICB1cmw6ICdodHRwczovL2duYXIuZ3JhbW1hcmx5LmNvbScsXG4gIHFhVXJsOiAnaHR0cHM6Ly9xYWduYXIuZ3JhbW1hcmx5LmNvbSdcbn1cblxubGV0IG1wa2V5ID0gJ2MxMGRkNjRjODdmNzBlZjU1NjNhNjNjMzY4Nzk3ZThjJ1xubGV0IE1JWFBBTkVMID0ge1xuICBxYUtleTogJzdhNWM5NWI1Y2JhMWIyMjVkMDBjYzNiYTFjNDEwYzc4JyxcbiAga2V5OiBtcGtleSxcbiAgY29va2llOiBgbXBfJHttcGtleX1fbWl4cGFuZWxgXG59XG5cbmlmICghcHJvY2Vzcy5lbnYuUFJPRCkge1xuICBHTkFSLnVybCA9IEdOQVIucWFVcmxcblxuICBsZXQgbXBrZXkgPSBNSVhQQU5FTC5xYUtleVxuICBNSVhQQU5FTC5rZXkgPSBtcGtleVxuICBNSVhQQU5FTC5jb29raWUgPSBgbXBfJHttcGtleX1fbWl4cGFuZWxgXG59XG5cbmxldCBTVEFUU0MgPSB7XG4gIFVSTDogJ2h0dHBzOi8vc3RhdHMtcHVibGljLmdyYW1tYXJseS5pby8nLFxuICBQUkVGSVg6ICdncmFtbWFybHkudWknXG59XG5cbmxldCBEQVBJID0gJ2h0dHBzOi8vZGF0YS5ncmFtbWFybHkuY29tJ1xuXG5sZXQgYXBwID0gJ2h0dHBzOi8vYXBwLmdyYW1tYXJseS5jb20nXG5sZXQgYXV0aFVzZXIgPSAnaHR0cHM6Ly9hdXRoLmdyYW1tYXJseS5jb20vdXNlcidcbmxldCB3ZWxjb21lRmFuZFMgPSAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9hZnRlcl9pbnN0YWxsX3BhZ2UnXG5sZXQgVVJMUyA9IHtcbiAgYXBwLFxuICBjYXBpOiAnd3NzOi8vY2FwaS5ncmFtbWFybHkuY29tL2ZyZWV3cycsXG4gIGRhcGlNaW1pYzogREFQSSArICcvYXBpL21pbWljJyxcbiAgZWRpdG9yOiBhcHAgKyAnL3BvcHVwMicsXG4gIGRpY3Rpb25hcnk6ICdodHRwczovL2NhcGkuZ3JhbW1hcmx5LmNvbS9hcGkvZGVmcycsXG4gIHVwZ3JhZGU6ICdodHRwczovL3d3dy5ncmFtbWFybHkuY29tL3VwZ3JhZGUnLFxuICBhdXRoVXNlcixcbiAgYXV0aFNldHRpbmdzOiBhdXRoVXNlciArICcvc2V0dGluZ3MnLFxuICBhdXRoR3JvdXA6IGF1dGhVc2VyICsgJy9ncm91cCcsXG4gIGF1dGhQaW5nOiBhdXRoVXNlciArICcvc3luYycsXG4gIGF1dGhDcmVhdGVBbm9ueW1vdXM6IGF1dGhVc2VyICsgJy9hbm9ueW1vdXMnLFxuICBhdXRoQ3JlYXRlUGFnZTogJ2h0dHBzOi8vYXV0aC5ncmFtbWFybHkuY29tL3JlZGlyZWN0LWFub255bW91cz9sb2NhdGlvbj0nICsgd2VsY29tZUZhbmRTLFxuICBkb2NzOiBhcHAgKyAnL2RvY3MnLFxuICBkb2NzQXBpOiAnaHR0cHM6Ly9kb3guZ3JhbW1hcmx5LmNvbS9kb2N1bWVudHMnLFxuICBvZmZsaW5lOiAnaHR0cHM6Ly9lZC5ncmFtbWFybHkuY29tL2Rvd25sb2FkL2ZpcmVmb3gvdXBkYXRlLmpzb24nLFxuICB3ZWxjb21lQzogJ2h0dHBzOi8vd3d3LmdyYW1tYXJseS5jb20vZXh0ZW5zaW9uLXN1Y2Nlc3MnLFxuICB1bmluc3RhbGw6ICdodHRwczovL3d3dy5ncmFtbWFybHkuY29tL2V4dGVuc2lvbi11bmluc3RhbGwnLFxuICB1c2VyT3JBbm9ueW1vdXM6ICdodHRwczovL2F1dGguZ3JhbW1hcmx5LmNvbS91c2VyL29yYW5vbnltb3VzJyxcbiAgYXV0aFNpZ25pbjogJ2h0dHBzOi8vYXV0aC5ncmFtbWFybHkuY29tL2xvZ2luJyxcbiAgYXV0aFNpZ251cDogJ2h0dHBzOi8vYXV0aC5ncmFtbWFybHkuY29tL3NpZ251cCcsXG4gIHNpZ25pbjogJ2h0dHBzOi8vd3d3LmdyYW1tYXJseS5jb20vc2lnbmluJyxcbiAgc2lnbnVwOiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9zaWdudXAnLFxuICB3ZWxjb21lRmFuZFMsXG4gIHJhdmVuOiAnZmVsb2cuZ3JhbW1hcmx5LmlvJyxcbiAgcmVmZXJyYWw6ICdodHRwczovL3d3dy5ncmFtbWFybHkuY29tL3JlZmVycmFsJyxcbiAgcGFnZUNvbmZpZ1VybDogJ2h0dHBzOi8vZDNjdjRhOWE5d2gwYnQuY2xvdWRmcm9udC5uZXQvYnJvd3NlcnBsdWdpbi9jb25maWcuanNvbicsXG4gIHJlc2V0UGFzc3dvcmQ6ICdodHRwczovL3d3dy5ncmFtbWFybHkuY29tL3Jlc2V0cGFzc3dvcmQnLFxuICB0ZXJtczogJ2h0dHBzOi8vd3d3LmdyYW1tYXJseS5jb20vdGVybXMnLFxuICBwb2xpY3k6ICdodHRwczovL3d3dy5ncmFtbWFybHkuY29tL3ByaXZhY3ktcG9saWN5J1xufVxuXG5jb25zdCB1cmxLZXlzID0gT2JqZWN0LmtleXMoVVJMUylcbmNvbnN0IHBrZXkgPSBrZXkgPT4gYFVSTFMuJHtrZXl9YFxuXG5wcmVmcy5nZXQodXJsS2V5cy5tYXAocGtleSksIHJlc3VsdCA9PlxuICB1cmxLZXlzXG4gICAgLmZpbHRlcih1cmwgPT4gcmVzdWx0W3BrZXkodXJsKV0pXG4gICAgLmZvckVhY2godXJsID0+IFVSTFNbdXJsXSA9IHJlc3VsdFtwa2V5KHVybCldKVxuKVxuXG5mdW5jdGlvbiBnZXRWZXJzaW9uKCkge1xuICBpZiAoIWZvcmdlKSByZXR1cm5cbiAgcmV0dXJuIGZvcmdlLmNvbmZpZy5tb2R1bGVzLnBhcmFtZXRlcnMudmVyc2lvblxufVxuXG5mdW5jdGlvbiBnZXRVcGRhdGVUaW1lKCkge1xuICBpZiAoIWZvcmdlKSByZXR1cm5cbiAgcmV0dXJuIGZvcmdlLmNvbmZpZy5tb2R1bGVzLnBhcmFtZXRlcnMudXBkYXRlVGltZVxufVxuXG5mdW5jdGlvbiBnZXRVdWlkKCkge1xuICBpZiAoIWZvcmdlKSByZXR1cm5cbiAgcmV0dXJuIGZvcmdlLmNvbmZpZy51dWlkXG59XG5cbmxldCBuZXdzID0gW1xuICAnUG9wLXVwIGVkaXRvciBub3cgb3BlbnMgaW1tZWRpYXRlbHknLFxuICAnWW91IG1heSBkaXNhYmxlIGRlZmluaXRpb25zIG9uIGFsbCBzaXRlcydcbl1cblxubGV0IHVzZXJGaWVsZHMgPSBbXG4gICdpZCcsICdlbWFpbCcsICdzdWJzY3JpcHRpb25GcmVlJywgJ2ZpcnN0TmFtZScsICdhbm9ueW1vdXMnLCAndHlwZScsXG4gICdwcmVtaXVtJywgJ3NldHRpbmdzJywgJ3JlZ2lzdHJhdGlvbkRhdGUnLCAnbWltaWMnLCAnZ3JvdXBzJyxcbiAgJ2V4dGVuc2lvbkluc3RhbGxEYXRlJywgJ2ZpeGVkX2Vycm9ycycsICdleHQyJ11cblxuaWYgKCFwcm9jZXNzLmVudi5QUk9EKSB7XG4gIHVzZXJGaWVsZHMucHVzaCgndG9rZW4nKVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIC8vIGRlYnVnOiB0cnVlLFxuICBuZXdzLFxuICBuZXdzSWQ6IG5ld3MubGVuZ3RoICYmIFNwYXJrTUQ1Lmhhc2gobmV3cy5qb2luKCdcXG4nKSksXG4gIGdldFVwZGF0ZVRpbWUsXG4gIFVSTFMsXG4gIEZFTE9HLFxuICBTVEFUU0MsXG4gIERBUEksXG4gIE1JWFBBTkVMLFxuICBHTkFSLFxuICBnZXRWZXJzaW9uLFxuICBnZXRVdWlkLFxuICBpc1Rlc3Q6ICFmb3JnZSxcbiAgbmV4dFZlckNsYXNzOiAnZ3JfdmVyXzInLFxuICByZXN0cmljdGVkQXR0cnM6IFsnZGF0YS1ncmFtbV9lZGl0b3InLCAnZGF0YS1ncmFtbScsICdkYXRhLWdyYW1tX2lkJywgJ2dyYW1tX2VkaXRvcicsIFsnYXJpYS1sYWJlbCcsICdTZWFyY2ggRmFjZWJvb2snXV0sXG4gIHJlc3RyaWN0ZWRQYXJlbnRBdHRyczogJ1tkYXRhLXJlYWN0aWRdJyxcbiAgdXNlckZpZWxkcyxcbiAgZXh0Mmdyb3VwczogWycwMDFfZ2J1dHRvbl9zaG93JywgJzAwMl9nYnV0dG9uX3Nob3cnLCAnMDAzX2didXR0b25fc2hvdyddLFxuICBleHRlcm5hbEV2ZW50czogWydjaGFuZ2VkLXVzZXInLCAnY2hhbmdlZC1wbGFuJywgJ2NsZWFudXAnLCAnZWRpdG9yLWZpeCddLFxuICBkZXZlbG9wbWVudDogZG9jdW1lbnQubG9jYXRpb24uaG9zdCA9PSAnMTI3LjAuMC4xOjMxMTcnXG59XG4iXX0=
},{"./prefs":"/project/src/js/lib/prefs.js","babel/polyfill":"babel/polyfill","spark-md5":"spark-md5"}],"/project/src/js/lib/dom.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

//eslint-disable-line

var _reactDom = require('react-dom');

var _reactDom2 = _interopRequireDefault(_reactDom);

var _util = require('./util');

function createEl(html, doc) {
  var div = (doc || document).createElement('div');
  div.innerHTML = html.trim();
  return div.firstElementChild;
}

function renderReactWithParent(reactElement, parent, id) {
  var type = arguments.length <= 3 || arguments[3] === undefined ? 'div' : arguments[3];

  var react = parent[id] || {};
  parent[id] = react;
  if (!react.el) {
    react.el = parent.ownerDocument.createElement(type);
    parent.appendChild(react.el);
  }
  var component = _reactDom2['default'].render(reactElement, react.el);

  if (!react.remove) {
    react.remove = function () {
      delete parent[id];
      parent.removeChild(react.el);
      _reactDom2['default'].unmountComponentAtNode(react.el);
    };
  }
  return {
    component: component,
    remove: react.remove,
    el: react.el
  };
}

function inEl(el, target) {
  var deep = arguments.length <= 2 || arguments[2] === undefined ? 1000 : arguments[2];

  var i = 0;
  while (el.parentNode && i < deep) {
    if (!(typeof target == 'string') && target == el) return true;
    if (el.id == target || el == target) return true;
    el = el.parentNode;
  }
  return false;
}

function hasClass(_el, cls) {
  if (!_el || _el.className == undefined) return false;
  return _el.classList.contains(cls);
}

function removeClass(_el, cls) {
  if (!_el || !_el.classList) return;
  return _el.classList.remove(cls);
}

function addClass(_el, cls) {
  if (!_el) return;
  if (cls.indexOf(' ') != -1) {
    cls = cls.split(' ');
    for (var i = 0; i < cls.length; i++) {
      _el.classList.add(cls[i]);
    }
    return;
  }
  return _el.classList.add(cls);
}

function toggleClass(el, flag, cls) {
  if (flag) {
    addClass(el, cls);
  } else {
    removeClass(el, cls);
  }
}

function getParentBySel(el, sel) {
  while (el = el.parentNode) {
    if (matchesSelector(el, sel)) return el;
  }
  return false;
}

function parentIsContentEditable(el) {
  while (el = el.parentNode) {
    if (isContentEditable(el)) return el;
  }
  return false;
}

function isContentEditable(el) {
  return el.contentEditable == 'true' || el.contentEditable == 'plaintext-only';
}

function matchesSelector(el, sel) {
  if (el.matches) return el.matches(sel);
  if (el.matchesSelector) return el.matchesSelector(sel);
  if (el.webkitMatchesSelector) return el.webkitMatchesSelector(sel);
  if (el.mozMatchesSelector) return el.mozMatchesSelector(sel);
  if (window.$ && window.$.is) return window.$(el).is(sel);
}

function isFocused(el) {
  if ((0, _util.isFF)()) return el.ownerDocument.activeElement == el;

  if (document.activeElement && document.activeElement.tagName == 'IFRAME') {
    return el === el.ownerDocument.activeElement;
  } else if (document.activeElement && document.activeElement.tagName == 'BODY') {
    return el === document.activeElement;
  }
  return el === document.activeElement;
}

var lKey = (0, _util.guid)(); //Symbol('listeners') safari tests wtf
function listen(el, event, cb, unbind) {
  var bubble = arguments.length <= 4 || arguments[4] === undefined ? false : arguments[4];

  if (!el) return;
  if (_lodash2['default'].isObject(event)) {
    return _lodash2['default'].each(event, function (value, key) {
      listen(el, key, value, unbind);
    }); //args shift
  }

  var func = unbind ? 'removeEventListener' : 'addEventListener';
  var listeners = el[lKey] || [];
  el[lKey] = listeners;
  if (unbind) {
    el[lKey] = listeners.filter(function (l) {
      return !(l.event == event && l.cb == cb);
    });
  } else {
    listeners.push({ event: event, cb: cb });
  }

  el[func](event, cb, bubble);

  if (!"true") {
    //mechanism for firing custom events
    cb.__wrapFunc = cb.__wrapFunc || function (e) {
      e = e || {};
      cb(_lodash2['default'].extend({ originalEvent: e, preventDefault: _util._f, stopPropagation: _util._f }, e.detail));
    };
    el[func](event + '-gr', cb.__wrapFunc, bubble);
  }

  return { el: el, event: event, cb: cb, bubble: bubble };
}

function unlisten(el, event, cb, bubble) {
  if (!event && el[lKey]) {
    return el[lKey].each(function (l) {
      return unlisten(el, l.event, l.cb, l.bubble);
    });
  }
  listen(el, event, cb, true, bubble);
}

function on() {
  var _this = this;

  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  this.addEventListener.apply(this, args);
  return { off: function off() {
      return _off.call.apply(_off, [_this].concat(args));
    } };
}

function _off() {
  this.removeEventListener.apply(this, arguments);
}

function once(event, cb) {
  var _this2 = this;

  var done = function done(e) {
    cb(e);
    _off.call(_this2, event, done);
  };
  on.call(this, event, done);
}

function isVisible(el) {
  var style = getComputedStyle(el, null),
      visible = style.getPropertyValue('display') != 'none' && style.getPropertyValue('visibility') != 'hidden' && el.clientHeight > 0;
  return visible;
}

function cs(names) {
  var clsProcessor = arguments.length <= 1 || arguments[1] === undefined ? function (cls) {
    return cls;
  } : arguments[1];

  return _lodash2['default'].keys(names).filter(function (cls) {
    return names[cls];
  }).map(function (cls) {
    return clsProcessor(cls);
  }).join(' ');
}

function maybeAddPx(name, value) {
  return typeof value == 'number' && !cssNumber[dasherize(name)] ? value + 'px' : value;
}

function camelize(str) {
  return str.replace(/-+(.)?/g, function (match, chr) {
    return chr ? chr.toUpperCase() : '';
  });
}

function camelizeAttrs(obj) {
  return _lodash2['default'].transform(obj, function (result, value, key) {
    return result[camelize(key)] = value;
  });
}
function dasherize(str) {
  return str.replace(/::/g, '/').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/([a-z\d])([A-Z])/g, '$1_$2').replace(/_/g, '-').toLowerCase();
}

var cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1, 'opacity': 1, 'z-index': 1, 'zoom': 1 };
function css(el, property, value) {
  if (arguments.length < 3) {
    var _ret = (function () {
      var element = el;
      if (!element) return {
          v: undefined
        };
      var computedStyle = getComputedStyle(element, '');
      if (typeof property == 'string') {
        return {
          v: element.style[camelize(property)] || computedStyle.getPropertyValue(property)
        };
      } else if (_lodash2['default'].isArray(property)) {
        var _ret2 = (function () {
          var props = {};
          _lodash2['default'].each(property, function (val, prop) {
            props[camelize(val)] = element.style[camelize(val)] || computedStyle.getPropertyValue(val);
          });
          return {
            v: {
              v: props
            }
          };
        })();

        if (typeof _ret2 === 'object') return _ret2.v;
      }
    })();

    if (typeof _ret === 'object') return _ret.v;
  }

  var result = '';
  if (_lodash2['default'].isString(property)) {
    if (!value && value !== 0) {
      el.style.removeProperty(dasherize(property));
    } else {
      result = dasherize(property) + ':' + maybeAddPx(property, value);
    }
  } else {
    for (var key in property) {
      if (!property[key] && property[key] !== 0) {
        el.style.removeProperty(dasherize(key));
      } else {
        result += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';';
      }
    }
  }

  return el.style.cssText += ';' + result;
}

function getParentByTag(el, tag) {
  while (el = el.parentNode) {
    if (el.tagName == tag) return el;
  }
  return false;
}

function getParentByData(el, key, val) {
  while (el = el.parentNode) {
    if (el.dataset && el.dataset[key] && el.dataset[key] == val) return el;
  }
}

function resolveEl(el, cls) {
  if (hasClass(el, cls)) return el;
  return getParent(el, cls);
}

function getParent(el, cls) {
  while (el = el.parentNode) {
    if (hasClass(el, cls)) return el;
  }
  return false;
}

function parentHasClass(el, cls) {
  if (!el) return false;
  while (el.parentNode) {
    if (hasClass(el, cls)) return el;
    el = el.parentNode;
  }
  return false;
}

function getParentByDepth() {
  var _context;

  var depth = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

  return !depth ? this : (_context = this.parentNode, getParentByDepth).call(_context, --depth);
}

function isParent(el, parent) {
  if (!el) return false;
  while (el.parentNode) {
    if (parent == el.parentNode) return el;
    el = el.parentNode;
  }
  return false;
}

function insertAfter(newElement, targetElement) {
  //target is what you want it to go after. Look for this elements parent.
  var parent = targetElement.parentNode;

  //if the parents lastChild is the targetElement...
  if (parent.lastChild == targetElement) {
    //add the newElement after the target element.
    parent.appendChild(newElement);
  } else {
    // else the target has siblings, insert the new element between the target and it's next sibling.
    parent.insertBefore(newElement, targetElement.nextSibling);
  }
}

function insertBefore(newElement, targetElement) {
  targetElement.parentNode.insertBefore(newElement, targetElement);
}

function elementInDocument(element, doc) {
  doc = doc || document;
  while (element) {
    if (element == doc) return true;
    element = element.parentNode;
  }
  return false;
}

function runKeyEvent(e) {
  var evt = undefined;
  var defaultEvent = {
    ctrl: false,
    meta: false,
    shift: false,
    alt: false
  };
  e = _lodash2['default'].extend(defaultEvent, e);
  //console.log('event', e)
  try {
    evt = e.el.ownerDocument.createEvent('KeyEvents');
    evt.initKeyEvent(e.type, // in DOMString typeArg,
    true, // in boolean canBubbleArg,
    true, // in boolean cancelableArg,
    e.el.ownerDocument.defaultView, // in nsIDOMAbstractView viewArg, window
    e.ctrl, // in boolean ctrlKeyArg,
    e.alt, // in boolean altKeyArg,
    e.shift, // in boolean shiftKeyArg,
    e.meta, // in boolean metaKeyArg,
    e.keyCode, // key code
    e.keyCode); // char code.
  } catch (err) {
    evt = e.el.ownerDocument.createEvent('UIEvents');
    evt.initUIEvent(e.name, true, true, window, 1);
    evt.keyCode = e.keyCode;
    evt.which = e.keyCode;
    evt.charCode = e.keyCode;
    evt.ctrlKey = e.ctrl;
    evt.altKey = e.alt;
    evt.shiftKey = e.shift;
    evt.metaKey = e.metaKey;
  }

  e.el.dispatchEvent(evt);
}

function docHidden(doc) {
  if (typeof doc.hidden !== 'undefined') return doc.hidden;
  if (typeof doc.mozHidden !== 'undefined') return doc.mozHidden;
  if (typeof doc.webkitHidden !== 'undefined') return doc.webkitHidden;
  if (typeof doc.msHidden !== 'undefined') return doc.msHidden;
  return false;
}

function visibilityEvent(doc) {
  if (typeof doc.hidden !== 'undefined') return 'visibilitychange';
  if (typeof doc.mozHidden !== 'undefined') return 'mozvisibilitychange';
  if (typeof doc.webkitHidden !== 'undefined') return 'webkitvisibilitychange';
  if (typeof doc.msHidden !== 'undefined') return 'msvisibilitychange';
  return false;
}

function transformProp() {
  var doc = arguments.length <= 0 || arguments[0] === undefined ? document : arguments[0];

  if (typeof doc.body.style.transform !== 'undefined') return 'transform';
  if (typeof doc.body.style.WebkitTransform !== 'undefined') return 'WebkitTransform';
  if (typeof doc.body.style.MozTransform !== 'undefined') return 'MozTransform';
}

/*
  el, 'width', 'height'
*/
function compStyle(el) {
  if (!el) return;
  var doc = el.ownerDocument;
  if (!doc) return;
  var win = doc.defaultView || window;
  if (!win) return;
  var s = win.getComputedStyle(el, null);
  if (!s) return;

  for (var _len2 = arguments.length, props = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    props[_key2 - 1] = arguments[_key2];
  }

  if (props.length == 1) return s.getPropertyValue(props[0]);

  return props.reduce(function (result, prop) {
    return _extends({}, result, _defineProperty({}, prop, s.getPropertyValue(prop)));
  }, {});
}

function classSelector(cls) {
  return cls.split(' ').map(function (c) {
    return c[0] != '.' ? '.' + c : c;
  }).join('').trim();
}

function selectorAll(cls) {
  for (var _len3 = arguments.length, classes = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
    classes[_key3 - 1] = arguments[_key3];
  }

  if (classes.length > 0) {
    var _ret3 = (function () {
      var result = [];
      result.push(selectorAll(cls));
      classes.forEach(function (c) {
        return result.push(selectorAll(c));
      });
      return {
        v: result.join(', ')
      };
    })();

    if (typeof _ret3 === 'object') return _ret3.v;
  }
  //check dots
  cls = cls.split(', ').map(function (c) {
    return c[0] != '.' ? '.' + c : c;
  }).join(', ').trim();
  return cls + ', ' + cls + ' *';
}

function nodeInTree(tree, node) {
  if (node == tree) return true;
  if (!tree.children) return false;
  for (var i = 0; i < tree.children.length; i++) {
    if (nodeInTree(tree.children[i], node)) return true;
  }
  return false;
}

function watchNodeRemove(node, cb) {
  var callback = function callback(mutations) {
    mutations.map(function (mr) {
      if (mr.removedNodes.length == 0) return;
      var nodes = mr.removedNodes,
          len = nodes.length;
      for (var i = 0; i < len; i++) {
        var tree = nodes[i];
        if (tree.contains && tree.contains(node) || nodeInTree(tree, node)) {
          mo.disconnect();
          cb();
        }
      }
    });
  },
      mo = new MutationObserver(callback);

  mo.observe(node.ownerDocument.body, { childList: true, subtree: true });
}

function whichAnimationEndEvent() {
  var t = undefined,
      el = document.createElement('fakeelement'),
      transitions = {
    'animation': 'animationend',
    'MozAnimation': 'animationend',
    'WebkitAnimation': 'webkitAnimationEnd'
  };

  for (t in transitions) {
    if (el.style[t] != undefined) {
      return transitions[t];
    }
  }
}
function transitionEndEventName() {
  var i = undefined,
      el = document.createElement('fakeelement'),
      transitions = {
    'transition': 'transitionend',
    'MozTransition': 'transitionend',
    'WebkitTransition': 'webkitTransitionEnd'
  };

  for (i in transitions) {
    if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
      return transitions[i];
    }
  }
}

function addIframeCss(frameDoc) {
  if (typeof GR_INLINE_STYLES == 'undefined') return;

  var style = frameDoc.createElement('style');
  /*eslint-disable*/
  style.innerHTML = GR_INLINE_STYLES;
  /*eslint-enable*/
  try {
    frameDoc.querySelector('head').appendChild(style);
  } catch (e) {
    console.log('can\'t append style', e);
  }
}

function setGRAttributes(el, id) {
  el.setAttribute('data-gramm_id', id);
  el.setAttribute('data-gramm', true);
}

exports['default'] = {
  isVisible: isVisible,
  createEl: createEl,
  renderReactWithParent: renderReactWithParent,
  inEl: inEl,
  hasClass: hasClass,
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass,
  matchesSelector: matchesSelector,
  getParentBySel: getParentBySel,
  getParentByData: getParentByData,
  getParentByDepth: getParentByDepth,
  parentIsContentEditable: parentIsContentEditable,
  isContentEditable: isContentEditable,
  isFocused: isFocused,
  listen: listen,
  unlisten: unlisten,
  on: on, off: _off, once: once,
  css: css,
  addIframeCss: addIframeCss,
  setGRAttributes: setGRAttributes,
  compStyle: compStyle,
  camelize: camelize,
  camelizeAttrs: camelizeAttrs,
  insertBefore: insertBefore,
  insertAfter: insertAfter,
  elementInDocument: elementInDocument,
  getParentByTag: getParentByTag,
  parentHasClass: parentHasClass,
  isParent: isParent,
  resolveEl: resolveEl,
  getParent: getParent,
  runKeyEvent: runKeyEvent,
  docHidden: docHidden,
  visibilityEvent: visibilityEvent,
  transformProp: transformProp,
  cs: cs,
  selectorAll: selectorAll,
  classSelector: classSelector,
  watchNodeRemove: watchNodeRemove,
  whichAnimationEndEvent: whichAnimationEndEvent,
  transitionEndEventName: transitionEndEventName
};
module.exports = exports['default'];

},{"./util":"/project/src/js/lib/util.js","lodash":"lodash","react":"react","react-dom":"react-dom"}],"/project/src/js/lib/forge.js":[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = (typeof window !== "undefined" ? window['forge'] : typeof global !== "undefined" ? global['forge'] : null);
module.exports = exports['default'];

}).call(this,typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9wcm9qZWN0L3NyYy9qcy9saWIvZm9yZ2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O3FCQUFlLE9BQU8sQ0FBQyxPQUFPLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IHJlcXVpcmUoJ2ZvcmdlJylcbiJdfQ==
},{}],"/project/src/js/lib/location.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var _forge = require('./forge');

var _forge2 = _interopRequireDefault(_forge);

var _util = require('./util');

function currentUrl() {
  return new Promise(function (resolve) {
    var retry = setTimeout(function () {
      return _forge2['default'].tabs.getCurrentTabUrl(resolve);
    }, 2000);
    _forge2['default'].tabs.getCurrentTabUrl(function (url) {
      clearTimeout(retry);
      resolve(url);
    });
  });
}

function getDomain(el, cb) {
  if ((0, _util.isFunction)(el)) {
    cb = el;
    el = '';
  }

  if (cb) {
    if (!(0, _util.isBgOrPopup)() && _forge2['default']) {
      _message2['default'].emitBackground('get-domain', {}, cb);
      return;
    }
    if (_forge2['default'] && _forge2['default'].tabs) {
      currentUrl().then(function (url) {
        return cb(domainFromUrl(url));
      });
    } else {
      cb(domainFromEl(el));
    }
    return;
  }

  return domainFromEl(el);
}

function promiseGetDomain(el) {
  if (!(0, _util.isBgOrPopup)() && _forge2['default']) {
    return _message2['default'].promiseBackground('get-domain');
  }

  if (_forge2['default'] && _forge2['default'].tabs) {
    return Promise.race([currentUrl().then(domainFromUrl), (0, _util.delay)(10000).then(function () {
      throw new Error('Request to forge.tabs.getCurrentTabUrl rejected by timeout');
    })]);
  }

  return domainFromEl(el);
}

function domainFromEl(el) {
  var doc = el && el.ownerDocument || document;
  var location = doc.location || doc.defaultView.location;
  if (!location) return '';

  return stripDomain(location.hostname);
}

function domainFromUrl(url) {
  var location = document.createElement('a');
  location.href = url;
  return stripDomain(location.hostname);
}

function stripDomain(domain) {
  return domain.replace('www.', '');
}

function getUrl(el) {
  var doc = el && el.ownerDocument || document;
  var location = doc.location || doc.defaultView.location;
  if (!location) return '';

  return location.pathname + location.search;
}

function getFavicon() {
  var isAbsolute = new RegExp('^(?:[a-z]+:)?//', 'i');
  var favicon = '';
  var links = document.getElementsByTagName('link');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    var rel = '"' + link.getAttribute('rel') + '"';
    var regexp = /(\"icon )|( icon\")|(\"icon\")|( icon )/i;
    if (rel.search(regexp) != -1) {
      favicon = link.getAttribute('href');
    }
  }
  if (!favicon) {
    favicon = 'favicon.ico';
  }
  if (isAbsolute.test(favicon)) {
    return favicon;
  }
  if (favicon[0] != '/') {
    return '//' + document.location.host + document.location.pathname + favicon;
  }
  return '//' + document.location.host + favicon;
}

exports['default'] = {
  getDomain: getDomain,
  currentUrl: currentUrl,
  promiseGetDomain: promiseGetDomain,
  domainFromUrl: domainFromUrl,
  getFavicon: getFavicon,
  getUrl: getUrl
};
module.exports = exports['default'];

},{"./forge":"/project/src/js/lib/forge.js","./message":"/project/src/js/lib/message.js","./util":"/project/src/js/lib/util.js"}],"/project/src/js/lib/message.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _emitter = require('emitter');

var _emitter2 = _interopRequireDefault(_emitter);

var _forge = require('./forge');

var _forge2 = _interopRequireDefault(_forge);

var _util = require('./util');

var errorEmitter = (0, _emitter2['default'])({});
var Listeners = {};

function one(type, cb) {
  on(type, _cb);

  function _cb() {
    off(type, _cb);

    for (var _len = arguments.length, data = Array(_len), _key = 0; _key < _len; _key++) {
      data[_key] = arguments[_key];
    }

    cb.apply(this, data);
  }
}

function on(type, callback, error, _isBg) {
  //type '__bgerror' handled by errorEmitter
  if (type == '__bgerror') {
    return errorEmitter.on('__bgerror', callback);
  }

  var listeners = Listeners[type] = Listeners[type] || [];

  if (!listeners.length) {
    try {
      _forge2['default'].message.listen(type, function (data, cb) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = listeners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var l = _step.value;
            l(data, cb);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator['return']) {
              _iterator['return']();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }, error, _isBg);
    } catch (e) {
      emitError(e);
    }
  }

  listeners.push(callback);
}

function off(type, callback) {
  if (type == '__bgerror') {
    return errorEmitter.off('__bgerror', callback);
  }

  var listeners = Listeners[type];
  if (!listeners) return;
  var i = listeners.indexOf(callback);
  if (i != -1) listeners.splice(i, 1);
  if (listeners.length == 0) delete Listeners[type];
}

function emitTabs(type, content, callback, error) {
  if (content === undefined) content = {};

  try {
    _forge2['default'].message.broadcast(type, content, callback, error);
  } catch (e) {
    emitError(e);
  }
}

function emitFocusedTab(type, content, callback, error) {
  //focussed wtf? http://www.future-perfect.co.uk/grammar-tip/is-it-focussed-or-focused/
  try {
    _forge2['default'].message.toFocussed(type, content, callback, error);
  } catch (e) {
    emitError(e);
  }
}

function emitBackground(type, content, callback, error) {
  try {
    _forge2['default'].message.broadcastBackground(type, content, callback, error);
  } catch (e) {
    emitError(e);
  }
}

function promiseBackground(message) {
  var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var timeout = arguments.length <= 2 || arguments[2] === undefined ? 10000 : arguments[2];

  var request = new Promise(function (resolve, reject) {
    try {
      _forge2['default'].message.broadcastBackground(message, data, resolve, reject);
    } catch (e) {
      reject(e);
      emitError(e);
    }
  });

  return Promise.race([request, (0, _util.delay)(timeout).then(function () {
    throw new Error('Request to bg page (' + message + ') rejected by timeout');
  })]);
}

var emitError = _lodash2['default'].throttle(function (e) {
  return errorEmitter.emit('__bgerror', e);
}, 1000);

exports['default'] = {
  on: on,
  one: one,
  off: off,
  emitError: emitError,
  emitTabs: emitTabs,
  emitFocusedTab: emitFocusedTab,
  emitBackground: emitBackground,
  promiseBackground: promiseBackground
};
module.exports = exports['default'];

},{"./forge":"/project/src/js/lib/forge.js","./util":"/project/src/js/lib/util.js","emitter":"emitter","lodash":"lodash"}],"/project/src/js/lib/page-config/config-base.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _defaults = require('./defaults');

var _location = require('../location');

var ConfigBase = (function () {
  function ConfigBase() {
    _classCallCheck(this, ConfigBase);
  }

  _createClass(ConfigBase, [{
    key: 'init',
    value: function init() {
      return this.load();
    }
  }, {
    key: 'checkDomain',
    value: function checkDomain(domain, url) {
      var config = this.getPageConfig(domain, url);
      return config ? config.enabled !== false : true;
    }
  }, {
    key: 'getConfigByPage',
    value: function getConfigByPage(pages) {
      var url = arguments.length <= 1 || arguments[1] === undefined ? (0, _location.getUrl)() : arguments[1];

      if (!pages) return;

      var findUrl = Object.keys(pages).find(function (page) {
        return new RegExp(page).test(url);
      });

      return pages[findUrl];
    }
  }, {
    key: 'getPageConfig',
    value: function getPageConfig(domain, url) {
      var config = this.config.pageConfig[domain] || this.config.partials.find(function (conf) {
        return domain.includes(conf.domain);
      });

      if (!config || config.enabled === false) return config;

      if (config.pages) return this.getConfigByPage(config.pages, url) || config;

      return config;
    }
  }, {
    key: 'isPageToReload',
    value: function isPageToReload(url) {
      return _defaults.SITES_TO_RELOAD.includes(url);
    }
  }, {
    key: 'getCurrentTimestamp',
    value: function getCurrentTimestamp() {
      return +new Date();
    }
  }, {
    key: 'config',
    get: function get() {
      return this._config;
    },
    set: function set(config) {
      if (!config) config = { pageConfig: {}, partials: [] };
      if (!config.pageConfig) config.pageConfig = {};
      if (!config.partials) config.partials = [];

      this._config = config;
    }
  }]);

  return ConfigBase;
})();

exports['default'] = ConfigBase;
module.exports = exports['default'];

},{"../location":"/project/src/js/lib/location.js","./defaults":"/project/src/js/lib/page-config/defaults.js"}],"/project/src/js/lib/page-config/config-bg.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x5, _x6, _x7) { var _again = true; _function: while (_again) { var object = _x5, property = _x6, receiver = _x7; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x5 = parent; _x6 = property; _x7 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _localforage = require('./localforage');

var _localforage2 = _interopRequireDefault(_localforage);

var _request = require('../request');

var _config = require('../config');

var _utils = require('./utils');

var _util = require('../util');

var _configBase = require('./config-base');

var _configBase2 = _interopRequireDefault(_configBase);

var _decorator = require('./decorator');

var _trackingIndex = require('../tracking/index');

var _defaults = require('./defaults');

var SYNC_TIMEOUT = 1500;
var AJAX_TIMEOUT = 15000;
var CONFIG_MISSED_ERROR = 'Config missed';

var ConfigBg = (function (_ConfigBase) {
  _inherits(ConfigBg, _ConfigBase);

  function ConfigBg() {
    _classCallCheck(this, ConfigBg);

    _get(Object.getPrototypeOf(ConfigBg.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(ConfigBg, [{
    key: 'load',

    /*
     * Method to load actual config file
     *
     * @description
     * 1. First attempt to update JSON from CDN if it's time
     * 2. If no update needed or CDN error check if it's cached in memory
     * 3. If nothing in memory - load config from local storage
     */
    value: function load() {
      var noupdate = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      var rawConfig, _ref, date, updateInterval, minutesToUpdate;

      return regeneratorRuntime.async(function load$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            if (!(0, _defaults.isSkipConfig)()) {
              context$2$0.next = 4;
              break;
            }

            console.warn('Use default config in DEBUG mode (skipConfig=true)');
            this.config = {};
            return context$2$0.abrupt('return', this.config);

          case 4:
            rawConfig = undefined;

            if (noupdate) {
              context$2$0.next = 22;
              break;
            }

            context$2$0.next = 8;
            return regeneratorRuntime.awrap(this.lastUpdate());

          case 8:
            _ref = context$2$0.sent;
            date = _ref.date;
            updateInterval = _ref.interval;

            if (!(date + updateInterval < new Date())) {
              context$2$0.next = 18;
              break;
            }

            console.info('Config: Going to update config from CDN...');
            context$2$0.next = 15;
            return regeneratorRuntime.awrap(this.updateFromCDN());

          case 15:
            rawConfig = context$2$0.sent;
            context$2$0.next = 20;
            break;

          case 18:
            minutesToUpdate = (date + updateInterval - new Date()) / 1000 / 60;

            console.info('Config: No update needed. Time to next update: ', minutesToUpdate);

          case 20:
            context$2$0.next = 23;
            break;

          case 22:
            console.info('Config: Skip CDN update');

          case 23:
            if (!(!rawConfig && this.config)) {
              context$2$0.next = 26;
              break;
            }

            console.info('Config: Use config from memory', this.config);
            return context$2$0.abrupt('return', this.config);

          case 26:
            if (rawConfig) {
              context$2$0.next = 31;
              break;
            }

            console.info('Config: Loading from local storage...');
            context$2$0.next = 30;
            return regeneratorRuntime.awrap(this.loadFromStorage());

          case 30:
            rawConfig = context$2$0.sent;

          case 31:

            this.config = rawConfig;

            return context$2$0.abrupt('return', this.config);

          case 33:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }

    /*
     * Update config from CDN
     *
     * @description
     * Return undefined by timeout, but DON'T abort ajax
     * to allow background update for guys with slow connection
     */
  }, {
    key: 'updateFromCDN',
    value: function updateFromCDN() {
      var config;
      return regeneratorRuntime.async(function updateFromCDN$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            config = undefined;
            context$2$0.prev = 1;
            context$2$0.next = 4;
            return regeneratorRuntime.awrap(Promise.race([this.loadFromCDN(), (0, _util.delay)(SYNC_TIMEOUT).then(function () {
              throw new Error('Can\'t wait any more for ajax response');
            })]));

          case 4:
            config = context$2$0.sent;
            context$2$0.next = 12;
            break;

          case 7:
            context$2$0.prev = 7;
            context$2$0.t0 = context$2$0['catch'](1);

            console.warn(context$2$0.t0.message);
            (0, _trackingIndex.call)('statsc.ui.increment', 'stability:page_config_first_cdn_timeout');
            this.saveOnError('Can\'t get valid config: ' + (context$2$0.t0 && context$2$0.t0.message));

          case 12:
            return context$2$0.abrupt('return', config);

          case 13:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this, [[1, 7]]);
    }
  }, {
    key: 'loadFromCDN',
    value: function loadFromCDN() {
      var config;
      return regeneratorRuntime.async(function loadFromCDN$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            config = undefined;
            context$2$0.prev = 1;

            (0, _trackingIndex.call)('statsc.ui.increment', 'stability:page_config_cdn_update');
            context$2$0.next = 5;
            return regeneratorRuntime.awrap((0, _request.fetch)(_config.URLS.pageConfigUrl, { timeout: AJAX_TIMEOUT }));

          case 5:
            config = context$2$0.sent;

            if ((0, _utils.isValid)(config)) {
              context$2$0.next = 8;
              break;
            }

            throw new Error('Config is not valid');

          case 8:

            this.save(config);
            return context$2$0.abrupt('return', config);

          case 12:
            context$2$0.prev = 12;
            context$2$0.t0 = context$2$0['catch'](1);

            (0, _trackingIndex.call)('felog.error', 'page_config_cdn_load_error', { msg: context$2$0.t0 && context$2$0.t0.message });
            this.saveOnError('Can\'t get valid config: ' + (context$2$0.t0 && context$2$0.t0.message), config);

          case 16:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this, [[1, 12]]);
    }
  }, {
    key: 'loadFromStorage',
    value: function loadFromStorage() {
      var rawConfig;
      return regeneratorRuntime.async(function loadFromStorage$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            context$2$0.prev = 0;
            context$2$0.next = 3;
            return regeneratorRuntime.awrap(_localforage2['default'].getItem('config'));

          case 3:
            rawConfig = context$2$0.sent;

            if (rawConfig) {
              context$2$0.next = 6;
              break;
            }

            throw new Error(CONFIG_MISSED_ERROR);

          case 6:
            if ((0, _utils.isValid)(rawConfig)) {
              context$2$0.next = 8;
              break;
            }

            throw new Error('Config malformed');

          case 8:
            return context$2$0.abrupt('return', rawConfig);

          case 11:
            context$2$0.prev = 11;
            context$2$0.t0 = context$2$0['catch'](0);

            if (context$2$0.t0 && new RegExp(CONFIG_MISSED_ERROR).test(context$2$0.t0.message)) {
              (0, _trackingIndex.call)('statsc.ui.increment', 'stability:page_config_missed_from_storage');
            } else {
              (0, _trackingIndex.call)('felog.error', 'page_config_local_storage_load_error', { msg: context$2$0.t0 && context$2$0.t0.message });
            }

            console.warn('Cannot get valid page config from storage: ' + (context$2$0.t0 && context$2$0.t0.message));
            return context$2$0.abrupt('return', null);

          case 16:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this, [[0, 11]]);
    }
  }, {
    key: 'save',
    value: function save(config) {
      return regeneratorRuntime.async(function save$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            _localforage2['default'].setItem('config', config);
            context$2$0.next = 3;
            return regeneratorRuntime.awrap(this.fireVersionUpdate(config.version));

          case 3:
            this.setLastUpdate({
              date: this.getCurrentTimestamp(),
              interval: config.interval,
              protocolVersion: config.protocolVersion,
              version: config.version,
              status: 'success'
            });
            console.info('Config updated and saved to local storage successfully:', config.version, config);

          case 5:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }
  }, {
    key: 'saveOnError',
    value: function saveOnError(info, config) {
      var meta;
      return regeneratorRuntime.async(function saveOnError$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            console.warn(info, config);

            context$2$0.next = 3;
            return regeneratorRuntime.awrap(this.lastUpdate());

          case 3:
            meta = context$2$0.sent;

            this.setLastUpdate({
              date: this.getCurrentTimestamp(),
              interval: meta.interval,
              protocolVersion: meta.protocolVersion,
              version: meta.version,
              status: 'failed',
              info: info
            });

          case 5:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }
  }, {
    key: 'fireVersionUpdate',
    value: function fireVersionUpdate(newVersion) {
      var meta;
      return regeneratorRuntime.async(function fireVersionUpdate$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            context$2$0.next = 2;
            return regeneratorRuntime.awrap(this.lastUpdate());

          case 2:
            meta = context$2$0.sent;

            if (newVersion && meta.version != newVersion) {
              (0, _trackingIndex.call)('felog.info', 'page_config_updated', newVersion);
            }

          case 4:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }
  }, {
    key: 'lastUpdateWithDefault',
    value: function lastUpdateWithDefault() {
      var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      return {
        date: config.date || 0,
        interval: (0, _utils.interval)(config.interval),
        protocolVersion: config.protocolVersion,
        status: config.status,
        info: config.info
      };
    }
  }, {
    key: 'setLastUpdate',
    value: function setLastUpdate() {
      var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      config = this.lastUpdateWithDefault(config);
      this._lastUpdate = config;
      return _localforage2['default'].setItem('lastConfigUpdate', config);
    }
  }, {
    key: 'lastUpdate',
    value: function lastUpdate() {
      return regeneratorRuntime.async(function lastUpdate$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            if (this._lastUpdate) {
              context$2$0.next = 4;
              break;
            }

            context$2$0.next = 3;
            return regeneratorRuntime.awrap(_localforage2['default'].getItem('lastConfigUpdate'));

          case 3:
            this._lastUpdate = context$2$0.sent;

          case 4:
            return context$2$0.abrupt('return', this.lastUpdateWithDefault(this._lastUpdate || {}));

          case 5:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this);
    }
  }, {
    key: 'config',
    set: function set() {
      var config = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      this._config = (0, _decorator.decorateConfig)(config);
    },
    get: function get() {
      return this._config;
    }
  }]);

  return ConfigBg;
})(_configBase2['default']);

exports['default'] = ConfigBg;
module.exports = exports['default'];

},{"../config":"/project/src/js/lib/config.js","../request":"/project/src/js/lib/request.js","../tracking/index":"/project/src/js/lib/tracking/index.js","../util":"/project/src/js/lib/util.js","./config-base":"/project/src/js/lib/page-config/config-base.js","./decorator":"/project/src/js/lib/page-config/decorator.js","./defaults":"/project/src/js/lib/page-config/defaults.js","./localforage":"/project/src/js/lib/page-config/localforage.js","./utils":"/project/src/js/lib/page-config/utils.js"}],"/project/src/js/lib/page-config/config-page.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _configBase = require('./config-base');

var _configBase2 = _interopRequireDefault(_configBase);

var _message = require('../message');

var _decorator = require('./decorator');

var _trackingIndex = require('../tracking/index');

var _util = require('../util');

var TIMEOUT = 1550; // 1s to ask CDN, 50ms - js

var ConfigPage = (function (_ConfigBase) {
  _inherits(ConfigPage, _ConfigBase);

  function ConfigPage() {
    _classCallCheck(this, ConfigPage);

    _get(Object.getPrototypeOf(ConfigPage.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(ConfigPage, [{
    key: 'load',

    /*
     * Load configuration from BG page.
     *
     * @description
     * Pass 'noupdate' in popup to skip CDN.
     * Fallback to default if no update in 'TIMEOUT' ms
     */
    value: function load() {
      return regeneratorRuntime.async(function load$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            context$2$0.prev = 0;
            context$2$0.next = 3;
            return regeneratorRuntime.awrap(Promise.race([(0, _message.promiseBackground)('get-page-config', { noupdate: (0, _util.isPopup)() }), (0, _util.delay)(TIMEOUT).then(function () {
              throw new Error('Request to BG rejected by timeout');
            })]));

          case 3:
            this.config = context$2$0.sent;
            context$2$0.next = 10;
            break;

          case 6:
            context$2$0.prev = 6;
            context$2$0.t0 = context$2$0['catch'](0);

            (0, _trackingIndex.call)('felog.error', 'page_config_load_from_bg_fail', { msg: context$2$0.t0 && context$2$0.t0.message });
            console.error('Cannot get page config. Fallback to default');

          case 10:

            if (!this.config) {
              this.config = (0, _decorator.decorateConfig)({});
            }

          case 11:
          case 'end':
            return context$2$0.stop();
        }
      }, null, this, [[0, 6]]);
    }
  }]);

  return ConfigPage;
})(_configBase2['default']);

exports['default'] = ConfigPage;
module.exports = exports['default'];

},{"../message":"/project/src/js/lib/message.js","../tracking/index":"/project/src/js/lib/tracking/index.js","../util":"/project/src/js/lib/util.js","./config-base":"/project/src/js/lib/page-config/config-base.js","./decorator":"/project/src/js/lib/page-config/decorator.js"}],"/project/src/js/lib/page-config/decorator.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.decorateConfig = decorateConfig;
exports.deepCopyWithDefault = deepCopyWithDefault;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _config = require('../config');

var _defaults = require('./defaults');

var _util = require('../util');

var _deepExtend = require('deep-extend');

var _deepExtend2 = _interopRequireDefault(_deepExtend);

function decorateConfig(config) {
  return RawConfigDecorator.decorate(config);
}

function deepCopyWithDefault(config) {
  var newConfig = (0, _deepExtend2['default'])({ pageConfig: {} }, config || {});
  if (!newConfig.pageConfig) newConfig.pageConfig = {};
  return newConfig;
}

var RawConfigDecorator = (function () {
  function RawConfigDecorator() {
    _classCallCheck(this, RawConfigDecorator);
  }

  _createClass(RawConfigDecorator, null, [{
    key: 'decorate',
    value: function decorate(config) {
      var _this = this;

      return ['withDefault', 'filterByVersion', 'parseBooleans', 'parseBrowserValues', 'filterInvalidPageRegexp', 'collectPartials'].reduce(function (config, method) {
        return _this[method](config);
      }, config);
    }
  }, {
    key: 'withDefault',
    value: function withDefault(config) {
      config = deepCopyWithDefault(config);
      var defaultConfig = _defaults.PAGE_CONFIG && _defaults.PAGE_CONFIG.pageConfig || {};

      config.pageConfig = (0, _deepExtend2['default'])({}, defaultConfig, config.pageConfig);

      return config;
    }

    /*
     * Filter out rules with version _less_ than current extension version
     * '*'' or missed equal to all versions
     */
  }, {
    key: 'filterByVersion',
    value: function filterByVersion(config) {
      var version = arguments.length <= 1 || arguments[1] === undefined ? (0, _config.getVersion)() : arguments[1];

      config = deepCopyWithDefault(config);
      var pageConfig = config.pageConfig;

      config.pageConfig = Object.keys(pageConfig).filter(function (key) {
        var value = pageConfig[key],
            ruleVersion = value.version;

        return !ruleVersion || ruleVersion === '*' || (0, _util.versionComparator)(version, ruleVersion) !== 1;
      }).reduce(function (hsh, key) {
        return _extends({}, hsh, _defineProperty({}, key, pageConfig[key]));
      }, {});

      return config;
    }

    /**
     * Parses strings to boolean values.
     * As a result would produce JSON:
     * {
     *   'domain1.com': { enabled: false, matchPartOfUrl: true },
     *   'domain2.com': {
     *     enabled: true,
     *     matchPartOfUrl: false,
     *     pages: { '*notes': { enabled: false } }
     *   }
     * }
     */
  }, {
    key: 'parseBooleans',
    value: function parseBooleans(config) {
      function isTruly(value) {
        return !(value === false || value == 'false');
      }

      function isExistsOrFalse(value) {
        return value ? isTruly(value) : false;
      }

      config = deepCopyWithDefault(config);
      var pageConfig = config.pageConfig;

      Object.keys(pageConfig).forEach(function (key) {
        if (!pageConfig[key]) pageConfig[key] = {};

        var rule = pageConfig[key];

        rule.enabled = isTruly(rule.enabled);
        rule.matchPartOfUrl = isExistsOrFalse(rule.matchPartOfUrl);

        if (rule.pages) {
          Object.keys(rule.pages).forEach(function (key) {
            rule.pages[key].enabled = isTruly(rule.pages[key].enabled);
          });
        }
      });

      return config;
    }

    /**
     * Disable specific domain only if certain browser not supported
     * Don't change enabled value if domain list not specified
     *
     * Config may contains
     * `disabledBrowser: ['firefox', 'chrome', 'safari']`
     */
  }, {
    key: 'parseBrowserValues',
    value: function parseBrowserValues(config) {
      var browser = arguments.length <= 1 || arguments[1] === undefined ? (0, _util.getBrowser)() : arguments[1];

      config = deepCopyWithDefault(config);
      var pageConfig = config.pageConfig;

      Object.keys(pageConfig).map(function (key) {
        var disabled = pageConfig[key] && pageConfig[key].disabledBrowsers;

        if (disabled && disabled.includes(browser)) {
          pageConfig[key].enabled = false;
        }
      });

      return config;
    }
  }, {
    key: 'filterInvalidPageRegexp',
    value: function filterInvalidPageRegexp(config) {
      config = deepCopyWithDefault(config);
      var pageConfig = config.pageConfig;

      Object.keys(pageConfig).forEach(function (key) {
        var config = pageConfig[key];
        if (config.pages) {
          config.pages = Object.keys(config.pages).filter(function (key) {
            try {
              return new RegExp(key);
            } catch (e) {
              return false;
            }
          }).reduce(function (hsh, key) {
            return _extends({}, hsh, _defineProperty({}, key, config.pages[key]));
          }, {});
        }
      });

      return config;
    }
  }, {
    key: 'collectPartials',
    value: function collectPartials(config) {
      config = deepCopyWithDefault(config);
      var pageConfig = config.pageConfig;
      config.partials = [];

      try {
        config.partials = Object.keys(pageConfig).filter(function (domain) {
          return pageConfig[domain].matchPartOfUrl;
        }).map(function (domain) {
          return _extends({ domain: domain }, pageConfig[domain]);
        });
      } catch (err) {
        console.warn('Cannot collect partials from config');
      }

      return config;
    }
  }]);

  return RawConfigDecorator;
})();

exports.RawConfigDecorator = RawConfigDecorator;

},{"../config":"/project/src/js/lib/config.js","../util":"/project/src/js/lib/util.js","./defaults":"/project/src/js/lib/page-config/defaults.js","deep-extend":"/project/node_modules/deep-extend/lib/deep-extend.js"}],"/project/src/js/lib/page-config/defaults.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _this = this;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _util = require('../util');

var _prefs = require('../prefs');

var _prefs2 = _interopRequireDefault(_prefs);

var PROTOCOL_VERSION = '1.0';

var SITES_TO_RELOAD = ['mail.google.com', 'yahoo.com', 'mail.live.com', 'facebook.com', 'tumblr.com', 'stackoverflow.com', 'wordpress.com', 'wordpress.org', 'blogspot.com'];

var UPDATE_30M = 30 * 60 * 1000; // 30m
var UPDATE_5M = 5 * 60 * 1000; // 5m
var PAGE_CONFIG_DEFAULT_INTERVAL = "true" ? UPDATE_30M : UPDATE_5M;

var PAGE_CONFIG_UPDATE_INTERVALS = [10 * 60 * 1000, // 10m
PAGE_CONFIG_DEFAULT_INTERVAL, 60 * 60 * 1000, // 60m
3 * 60 * 60 * 1000, // 3h
12 * 60 * 60 * 1000, // 12h
24 * 60 * 60 * 1000, // 24h
365 * 24 * 60 * 60 * 1000 // turn off
];

var PAGE_CONFIG = {
  pageConfig: {
    'mail.google.com': {
      fields: [{ name: 'to' }, { name: 'cc' }, { name: 'bcc' }, { className: 'vO' }],
      subframes: false
    },
    'newtab': { enabled: false },
    'version': { enabled: false },
    'extensions': { enabled: false },
    'grammarly.com': { enabled: false },
    'free.grammarly.com': { enabled: false },
    'app.grammarly.com': { enabled: false },
    'ed.grammarly.com': { enabled: false },
    'app.asana.com': { enabled: false },
    'hootsuite.com': { enabled: false },
    'plus.google.com': {
      enabled: false
      //,matchAttr: 'data-sbxm='1''
    },
    'chrome.google.com': { enabled: false },
    'facebook.com': {
      enabled: true,
      minFieldHeight: 0,
      pages: {
        '.*\/notes': {
          enabled: false
        }
      }
    },
    'onedrive.live.com': { enabled: false },
    'docs.com': { enabled: false },
    'sp.docs.com': { enabled: false },
    'docs.google.com': { enabled: false, track: true },
    'drive.google.com': {
      enabled: false,
      track: true,
      message: 'We hope to support Google Drive apps in the future, but for now please use your <a href="https://app.grammarly.com/">Grammarly Editor</a>.'
    },
    'texteditor.nsspot.net': { enabled: false },
    'jsbin.com': { enabled: false },
    'jsfiddle.net': { enabled: false },
    'quora.com': { enabled: false },
    'paper.dropbox.com': { enabled: false },
    'twitter.com': { enabled: !(0, _util.isFF)() && !(0, _util.isSafari)() },
    'com.safari.grammarlyspellcheckergrammarchecker': { enabled: false, matchPartOfUrl: true },
    'mail.live.com': { enabled: false, matchPartOfUrl: true },
    'imperavi.com': { enabled: false },
    'usecanvas.com': { enabled: false }
  }
};

var _isSkipConfig = false;

if (!"true") {
  (function callee$0$0() {
    var skipConfig;
    return regeneratorRuntime.async(function callee$0$0$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          context$1$0.next = 2;
          return regeneratorRuntime.awrap(_prefs2['default'].get('skipConfig'));

        case 2:
          skipConfig = context$1$0.sent;

          _isSkipConfig = skipConfig == true;

        case 4:
        case 'end':
          return context$1$0.stop();
      }
    }, null, _this);
  })();
}

exports['default'] = {
  PAGE_CONFIG: PAGE_CONFIG,
  PAGE_CONFIG_DEFAULT_INTERVAL: PAGE_CONFIG_DEFAULT_INTERVAL,
  PAGE_CONFIG_UPDATE_INTERVALS: PAGE_CONFIG_UPDATE_INTERVALS,
  PROTOCOL_VERSION: PROTOCOL_VERSION,
  SITES_TO_RELOAD: SITES_TO_RELOAD,
  isSkipConfig: function isSkipConfig() {
    return _isSkipConfig;
  }
};
module.exports = exports['default'];

},{"../prefs":"/project/src/js/lib/prefs.js","../util":"/project/src/js/lib/util.js"}],"/project/src/js/lib/page-config/index.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _util = require('../util');

var _configPage = require('./config-page');

var _configPage2 = _interopRequireDefault(_configPage);

var _configBg = require('./config-bg');

var _configBg2 = _interopRequireDefault(_configBg);

var init = function init() {
  return (0, _util.isBg)() ? new _configBg2['default']() : new _configPage2['default']();
};

exports['default'] = init();
module.exports = exports['default'];

},{"../util":"/project/src/js/lib/util.js","./config-bg":"/project/src/js/lib/page-config/config-bg.js","./config-page":"/project/src/js/lib/page-config/config-page.js"}],"/project/src/js/lib/page-config/localforage.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _localforage = require('localforage');

var _localforage2 = _interopRequireDefault(_localforage);

var NAME = 'Grammarly';
var VERSION = 1.0;
var STORE_NAME = 'configuration';

_localforage2['default'].config({
  name: NAME,
  version: VERSION,
  storeName: STORE_NAME
});

exports['default'] = _localforage2['default'];
module.exports = exports['default'];

},{"localforage":"localforage"}],"/project/src/js/lib/page-config/utils.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _defaults = require('./defaults');

function isValid(config) {
  if (!config || !config.pageConfig) return;
  if (!Object.keys(config).length) return;
  if (!Object.keys(config.pageConfig).length) return;
  if (config.protocolVersion && config.protocolVersion !== _defaults.PROTOCOL_VERSION) return;
  return true;
}

function interval(ms) {
  if (_defaults.PAGE_CONFIG_UPDATE_INTERVALS.includes(ms)) {
    return ms;
  } else {
    return _defaults.PAGE_CONFIG_DEFAULT_INTERVAL;
  }
}

exports['default'] = {
  isValid: isValid,
  interval: interval
};
module.exports = exports['default'];

},{"./defaults":"/project/src/js/lib/page-config/defaults.js"}],"/project/src/js/lib/prefs.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _this2 = this;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _forge = require('./forge');

var _forge2 = _interopRequireDefault(_forge);

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var _util = require('./util');

var _location = require('./location');

var _dom = require('./dom');

var _emitter = require('emitter');

var _emitter2 = _interopRequireDefault(_emitter);

//we receive here message from bg page, popup, or other tab, and fire prefs change event
_message2['default'].on('prefs-changed', function (obj) {
  me.emit(obj.pref, obj.value);
  if (!"true") {
    (0, _util.emitDomEvent)('prefs-changed', obj);
  }
});

_message2['default'].on('enabled', function (obj) {
  me.emit('enabled', obj);
});

var pget = function pget(prop) {
  return new Promise(function (resolve, reject) {
    try {
      _forge2['default'].prefs.get(prop, resolve, function (e) {
        if (e && e.message && e.message.includes('SyntaxError')) {
          _forge2['default'].prefs.clear(prop);
          return reject('Prop:' + prop + ' has corrupted value, cleanup');
        }
        reject(e);
      });
    } catch (e) {
      reject(e);
    }
  });
};

var me = (0, _emitter2['default'])({
  get: function get(props, cb) {
    var _result, result;

    return regeneratorRuntime.async(function get$(context$1$0) {
      var _this = this;

      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          if (!Array.isArray(props)) {
            context$1$0.next = 13;
            break;
          }

          //enabled is calculated property, so we one additional callback
          if (props.includes('enabled') && props.includes('domain')) {
            (function () {
              var _cb = cb;
              cb = function (obj) {
                me.enabled('', obj.domain, function (enabled) {
                  obj.enabled = enabled;
                  _cb(obj);
                });
              };
            })();
          }

          _result = {};
          context$1$0.prev = 3;
          context$1$0.next = 6;
          return regeneratorRuntime.awrap((function callee$1$0() {
            var values;
            return regeneratorRuntime.async(function callee$1$0$(context$2$0) {
              while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                  context$2$0.next = 2;
                  return regeneratorRuntime.awrap(Promise.all(props.map(pget)));

                case 2:
                  values = context$2$0.sent;

                  _result = props.reduce(function (obj, prop, i) {
                    return Object.assign(obj, _defineProperty({}, prop, values[i]));
                  }, {});

                  cb && cb(_result);

                case 5:
                case 'end':
                  return context$2$0.stop();
              }
            }, null, _this);
          })());

        case 6:
          context$1$0.next = 12;
          break;

        case 8:
          context$1$0.prev = 8;
          context$1$0.t0 = context$1$0['catch'](3);

          console.error('prefs get error:', context$1$0.t0);
          _message2['default'].emitError(context$1$0.t0);

        case 12:
          return context$1$0.abrupt('return', _result);

        case 13:
          result = pget(props);

          if (!cb) {
            context$1$0.next = 18;
            break;
          }

          result.then(cb, _message2['default'].emitError);
          context$1$0.next = 19;
          break;

        case 18:
          return context$1$0.abrupt('return', result.then(function (x) {
            return x;
          }, function (e) {
            _message2['default'].emitError(e);
            return null;
          }));

        case 19:
        case 'end':
          return context$1$0.stop();
      }
    }, null, _this2, [[3, 8]]);
  },
  set: function set(pref, value) {
    var oldVal;
    return regeneratorRuntime.async(function set$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          if (!(pref !== null && typeof pref === 'object')) {
            context$1$0.next = 2;
            break;
          }

          return context$1$0.abrupt('return', Object.keys(pref).forEach(function (key) {
            return me.set(key, pref[key]);
          }));

        case 2:
          context$1$0.prev = 2;
          context$1$0.next = 5;
          return regeneratorRuntime.awrap(pget(pref));

        case 5:
          oldVal = context$1$0.sent;

          if (oldVal != value) {
            _message2['default'].emitTabs('prefs-changed', { pref: pref, value: value });
            if (!"true") {
              (0, _util.emitDomEvent)('prefs-changed', { key: pref, value: value });
            }
          }

          _forge2['default'].prefs.set(pref, value);
          context$1$0.next = 13;
          break;

        case 10:
          context$1$0.prev = 10;
          context$1$0.t0 = context$1$0['catch'](2);

          _message2['default'].emitError(context$1$0.t0);

        case 13:
        case 'end':
          return context$1$0.stop();
      }
    }, null, _this2, [[2, 10]]);
  },
  clearAll: function clearAll() {
    try {
      _forge2['default'].prefs.clearAll();
    } catch (e) {
      _message2['default'].emitError(e);
    }
  },
  enabled: function enabled(value, domain) {
    if (value === undefined) value = '';
    var cb = arguments.length <= 2 || arguments[2] === undefined ? _util._f : arguments[2];

    if ((0, _util.isFunction)(value)) {
      cb = value;
      value = '';
    }

    var involve = function involve(domain) {
      return me.get('enabled_db', function (db) {
        return cb(_enabled(db, value, domain));
      });
    };

    domain ? involve(domain) : (0, _location.getDomain)(involve);
  },
  incFixed: function incFixed() {
    var inc = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

    me.get('fixed_errors', function (fixed) {
      fixed = parseInt(fixed);
      if (isNaN(fixed)) fixed = 0;
      fixed += inc;
      me.set('fixed_errors', fixed);
    });
  },
  isExt2: function isExt2() {
    return me.get('ext2');
  }
});

function _enabled(db, value, domain) {
  var write = typeof value == 'boolean',
      json = {};

  try {
    if (!db) throw 'bad db';
    json = JSON.parse(db);
  } catch (e) {
    me.set('enabled_db', '{}');
  }

  function getDomainSettings(json) {
    return json[domain] || { enabled: true };
  }

  if (value === '' && domain) {
    return getDomainSettings(json).enabled;
  }

  if (write) {
    var settings = getDomainSettings(json);
    settings.enabled = value;
    json.lastChange = { value: value, domain: domain };
    json[domain] = settings;
    me.set('enabled_db', JSON.stringify(json));
    _message2['default'].emitTabs('enabled', json.lastChange);
  }

  return value;
}

if (!"true") {
  //hook to enable testers to set props externally
  (0, _dom.listen)(document, 'set-prefs', function (e) {
    me.set(e.key, e.value);
  });

  (0, _dom.listen)(document, 'get-pref', function callee$0$0(e) {
    var value;
    return regeneratorRuntime.async(function callee$0$0$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          context$1$0.next = 2;
          return regeneratorRuntime.awrap(me.get(e.key));

        case 2:
          value = context$1$0.sent;

          (0, _util.emitDomEvent)('pref', { key: e.key, value: value });

        case 4:
        case 'end':
          return context$1$0.stop();
      }
    }, null, _this2);
  });
}

exports['default'] = me;
module.exports = exports['default'];
//TODO refactor without callbacks

},{"./dom":"/project/src/js/lib/dom.js","./forge":"/project/src/js/lib/forge.js","./location":"/project/src/js/lib/location.js","./message":"/project/src/js/lib/message.js","./util":"/project/src/js/lib/util.js","emitter":"emitter"}],"/project/src/js/lib/request.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var _forge = require('./forge');

var _config = require('./config');

var _util = require('./util');

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var AJAX_TIMEOUT = 10000;

if ((0, _util.isBg)()) {
  require('whatwg-fetch');
  _message2['default'].on('fetch', function (data, cb, error) {
    return bgFetch(data).then(cb, error);
  });
}

function transformOptions(opts) {
  if (opts.data && (opts.query || opts.method != 'post')) {
    opts.url += '?' + paramStr(opts.data);
  }

  if (opts.data && opts.method == 'post' && !opts.query && !opts.body) {
    try {
      opts.body = JSON.stringify(opts.data);
    } catch (e) {
      opts.body = {};
      console.warn(e);
    }

    opts.headers = opts.headers || {};
    opts.headers['Content-Type'] = opts.headers['Content-Type'] || 'application/json';
    delete opts.data;
  }
  opts.credentials = 'include';
  return opts;
}

function fetch(url) {
  var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  // if (config.development && !forge) url = '/api?url=' + url
  opts.url = url;
  transformOptions(opts);
  if ((0, _util.isBg)() || _config.isTest) return bgFetch(opts);

  return _message2['default'].promiseBackground('fetch', opts);
}

function bgFetch(_ref) {
  var url = _ref.url;

  var opts = _objectWithoutProperties(_ref, ['url']);

  if ((0, _util.isFF)()) {
    return new Promise(function (resolve, reject) {
      _forge.request.ajax({
        url: url,
        data: opts.data,
        header: opts.header,
        type: opts.method || 'GET',
        dataType: 'json',
        timeout: opts.timeout || AJAX_TIMEOUT,
        success: function success(res) {
          var jsonRes = typeof res === 'string' ? JSON.parse(res) : res;

          if (jsonRes.error) throw new Error(jsonRes.error);
          resolve(jsonRes);
        },
        error: function error(err) {
          if (err.message === 'Request timed out') {
            throw new Error('Fetch request to ' + url + ' rejected by timeout');
          }

          throw new Error(err.message);
        }
      });
    });
  }

  return Promise.race([window.fetch(url, opts).then(opts.isText ? text : json).then(function (res) {
    if (res.error) throw new Error(res.error);
    return res;
  }), (0, _util.delay)(opts.timeout || AJAX_TIMEOUT).then(function () {
    throw new Error('Fetch request to ' + url + ' rejected by timeout');
  })]);
}

function json(response) {
  return response.json();
}

function text(response) {
  return response.text();
}

function paramStr(data) {
  var req = '';

  var _loop = function (item) {
    if (Array.isArray(data[item])) {
      if (data[item].length) {
        req += '' + (req.length ? '&' : '') + data[item].map(function (val) {
          return item + '=' + val;
        }).join('&'); // eslint-disable-line no-loop-func
      }
    } else {
        req += '' + (req.length ? '&' : '') + item + '=' + encodeURIComponent(data[item]);
      }
  };

  for (var item in data) {
    _loop(item);
  }
  return req;
}

exports['default'] = {
  fetch: fetch,
  transformOptions: transformOptions,
  paramStr: paramStr
};
module.exports = exports['default'];

},{"./config":"/project/src/js/lib/config.js","./forge":"/project/src/js/lib/forge.js","./message":"/project/src/js/lib/message.js","./util":"/project/src/js/lib/util.js","whatwg-fetch":"whatwg-fetch"}],"/project/src/js/lib/socket.js":[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.getLog = getLog;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _forge = (typeof window !== "undefined" ? window['forge'] : typeof global !== "undefined" ? global['forge'] : null);

var _forge2 = _interopRequireDefault(_forge);

var _emitter = require('emitter');

var _emitter2 = _interopRequireDefault(_emitter);

var _websocket = require('websocket');

var _websocket2 = _interopRequireDefault(_websocket);

var _timers = require('./timers');

var _timers2 = _interopRequireDefault(_timers);

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var _util = require('./util');

var _trackingIndex = require('./tracking/index');

var _config = require('./config');

var sockets = {};

var Socket = function Socket(config) {
  if (!_forge2['default'] && !window.socketServer || window.gr___sandbox) SocketServer();

  if (!(0, _util.isBg)()) {
    return SocketClient(config);
  }

  return SocketServer();
};

function onError(e) {
  if (e == 'disconnected') return;
  var data = {};
  if (typeof e == 'string') {
    data.msg = e;
  } else if (e.error) {
    data.readyState = e.error.currentTarget && e.error.currentTarget.readyState;
    data.returnValue = e.error.returnValue;
  }

  (0, _trackingIndex.call)('felog.error', 'socket_fail', data);

  console.error('capi error', e);
  if (!window.emit) (0, _emitter2['default'])(window);
  window.emit('bgerror', e || 'when send message to the socket');
}

var SocketClient = function SocketClient(_ref) {
  var _ref$socketId = _ref.socketId;
  var socketId = _ref$socketId === undefined ? (0, _util.guid)() : _ref$socketId;
  var url = _ref.url;
  var useStandBy = _ref.useStandBy;

  var me = (0, _emitter2['default'])({}),
      listening = false,
      methods = ['connect', 'send', 'close', 'reconnect', 'release', 'wsPlay', 'wsPause'];

  methods.forEach(function (method) {
    return me[method] = send.bind(null, method);
  });

  me.one('connect', function () {
    sockets[socketId] = sockets[socketId] || socketId;
    _timers2['default'].start(socketId);
    (0, _trackingIndex.call)('felog.event', 'socket_open', { 'current_sockets': Object.keys(sockets).length });
  });
  me.one('disconnect', cleanSocket);
  me.on('error', onError);

  me.socketId = socketId;
  me.toString = function () {
    return '[object SocketClient]';
  };

  return me;

  function send(method, arg) {
    var msg = { socketId: socketId, method: method, arg: arg, url: url, useStandBy: useStandBy };

    if (!listening) listenMessages();

    if (method == 'connect' && !_config.isTest) {
      //refresh user session every 30 min
      return _message2['default'].emitBackground('user:refresh', { lazy: true }, function () {
        return _message2['default'].emitBackground('socket-client', msg, null, onError);
      });
    }

    _message2['default'].emitBackground('socket-client', msg, null, onError);

    if (method == 'close') {
      cleanSocket();
    }
  }

  function cleanSocket() {
    me.off('disconnect', cleanSocket);
    delete sockets[socketId];
    listening = false;
    _message2['default'].off('socket-server', onMessage, onError);
    (0, _trackingIndex.call)('felog.info', 'socket_close', { 'active_time': _timers2['default'].stop(socketId), 'current_sockets': Object.keys(sockets).length });
  }

  function listenMessages() {
    listening = true;
    _message2['default'].on('socket-server', onMessage, onError);
  }

  function onMessage(data, cb) {
    if (data.socketId != socketId) return;
    var msg = data.msg || {};
    // console.log('in client', data.event, socketId, data.id, msg)
    if (msg.action && msg.action.toLowerCase() == 'error') {
      (0, _trackingIndex.call)('statsc.ui.increment', 'stability:capi_error');
      (0, _trackingIndex.call)('felog.event', 'stability.capi_error', msg);
    }

    cb('ok');
    me.emit(data.event, data.msg);
  }
};

//=============================
//works in bg page
//

var log = [];

var SocketServer = function SocketServer() {
  var me = {};

  window.socketServer = me;

  _message2['default'].on('iframe-mode', function (data) {
    console.log('IFRAME MODE', data.id, sockets);
    sockets[data.id].iframeMode(data.iframeMode);
  }, onError, true);

  _message2['default'].on('socket-client', onMessage, onError, true);

  me.sockets = sockets;

  me.toString = function () {
    return '[object SocketServer]';
  };

  return me;

  //============

  function onMessage(data, cb) {
    if (!data) return;

    var socketId = data.socketId,
        socket = sockets[socketId],
        method = data.method,
        isClose = method == 'close';

    if (!socket && isClose) return;

    if (!socket) {
      socket = BackgroundSocket(data, onrelease);
      sockets[socketId] = socket;
    }

    if (method) {
      socket[method](data.arg);
      if (!"true") {
        log.push(_extends({ method: method }, data.arg));
      }
      if (isClose) onrelease(socketId);
    }
  }

  function onrelease(socketId) {
    if (!sockets[socketId]) return;
    sockets[socketId].close();
    //should not emit anything after closing
    sockets[socketId].emit = function (event, msg) {};
    delete sockets[socketId];
  }
};

var BackgroundSocket = function BackgroundSocket(config, onrelease) {
  var ws = (0, _websocket2['default'])(config),
      socketId = config.socketId,
      _iframeMode = undefined,
      releaseCount = 0,
      tooFrequentReleaseTracked = false;

  Object.assign(ws, {
    emit: emit,
    iframeMode: iframeMode,
    toString: function toString() {
      return '[object BackgroundSocket]';
    }
  });

  return ws;

  function emit(event, msg) {
    //monitoring.timer()

    var releaseTimer = setTimeout(function () {
      console.log('CLOSE SOCKET');
      releaseCount++;
      if (releaseCount > 7 && !tooFrequentReleaseTracked) {
        (0, _trackingIndex.call)('felog.warn', 'too_frequent_socket_release', { 'release_count': releaseCount });
        tooFrequentReleaseTracked = true;
      }
      var statscKey = iframeMode ? 'socket_timeout_close_iframe:stability' : 'socket_timeout_close:stability';
      (0, _trackingIndex.call)('statsc.ui.increment', statscKey);
      ws.close();
      ws.release();
      onrelease();
    }, 5000);

    var type = _iframeMode ? 'socket-server-iframe' : 'socket-server';
    console.log('from ws', event, socketId, msg, type);
    if (!"true") {
      log.push(_extends({ event: event }, msg));
    }
    _message2['default'].emitTabs(type, { socketId: socketId, event: event, msg: msg, id: (0, _util.guid)() }, function (msg) {
      return msg && clearTimeout(releaseTimer);
    }, onError);
  }

  function iframeMode(isOn) {
    _iframeMode = isOn;
    console.log('USE EXT SOCKET', isOn);
  }
};

function getLog() {
  var result = log.slice(0);
  log.length = 0;
  return result;
}

exports['default'] = Socket;

}).call(this,typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9wcm9qZWN0L3NyYy9qcy9saWIvc29ja2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7cUJBQWtCLE9BQU87Ozs7dUJBQ0wsU0FBUzs7Ozt5QkFDUCxXQUFXOzs7O3NCQUNkLFVBQVU7Ozs7dUJBQ1QsV0FBVzs7OztvQkFDTixRQUFROzs2QkFDZCxrQkFBa0I7O3NCQUNoQixVQUFVOztBQUcvQixJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUE7O0FBRWhCLElBQUksTUFBTSxHQUFHLFNBQVQsTUFBTSxDQUFZLE1BQU0sRUFBRTtBQUM1QixNQUFJLEFBQUMsbUJBQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLElBQUssTUFBTSxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUsQ0FBQTs7QUFFM0UsTUFBSSxDQUFDLGlCQUFNLEVBQUU7QUFDWCxXQUFPLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQTtHQUM1Qjs7QUFFRCxTQUFPLFlBQVksRUFBRSxDQUFBO0NBRXRCLENBQUE7O0FBRUQsU0FBUyxPQUFPLENBQUMsQ0FBQyxFQUFFO0FBQ2xCLE1BQUksQ0FBQyxJQUFJLGNBQWMsRUFBRSxPQUFNO0FBQy9CLE1BQUksSUFBSSxHQUFHLEVBQUUsQ0FBQTtBQUNiLE1BQUksT0FBTyxDQUFDLElBQUksUUFBUSxFQUFFO0FBQ3hCLFFBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFBO0dBQ2IsTUFDSSxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUU7QUFDaEIsUUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUE7QUFDM0UsUUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQTtHQUN2Qzs7QUFFRCwyQkFBSyxhQUFhLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFBOztBQUV4QyxTQUFPLENBQUMs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QUFDekIsS0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUE7QUFDZCxTQUFPLE1BQU0sQ0FBQTtDQUNkOztxQkFFYyxNQUFNIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZm9yZ2UgZnJvbSAnZm9yZ2UnXG5pbXBvcnQgZW1pdHRlciBmcm9tICdlbWl0dGVyJ1xuaW1wb3J0IHdlYnNvY2tldCBmcm9tICd3ZWJzb2NrZXQnXG5pbXBvcnQgdGltZXJzIGZyb20gJy4vdGltZXJzJ1xuaW1wb3J0IG1lc3NhZ2UgZnJvbSAnLi9tZXNzYWdlJ1xuaW1wb3J0IHtndWlkLCBpc0JnfSBmcm9tICcuL3V0aWwnXG5pbXBvcnQge2NhbGx9IGZyb20gJy4vdHJhY2tpbmcvaW5kZXgnXG5pbXBvcnQge2lzVGVzdH0gZnJvbSAnLi9jb25maWcnXG5cblxubGV0IHNvY2tldHMgPSB7fVxuXG5sZXQgU29ja2V0ID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gIGlmICgoIWZvcmdlICYmICF3aW5kb3cuc29ja2V0U2VydmVyKSB8fCB3aW5kb3cuZ3JfX19zYW5kYm94KSBTb2NrZXRTZXJ2ZXIoKVxuXG4gIGlmICghaXNCZygpKSB7XG4gICAgcmV0dXJuIFNvY2tldENsaWVudChjb25maWcpXG4gIH1cblxuICByZXR1cm4gU29ja2V0U2VydmVyKClcblxufVxuXG5mdW5jdGlvbiBvbkVycm9yKGUpIHtcbiAgaWYgKGUgPT0gJ2Rpc2Nvbm5lY3RlZCcpIHJldHVyblxuICBsZXQgZGF0YSA9IHt9XG4gIGlmICh0eXBlb2YgZSA9PSAnc3RyaW5nJykge1xuICAgIGRhdGEubXNnID0gZVxuICB9XG4gIGVsc2UgaWYgKGUuZXJyb3IpIHtcbiAgICBkYXRhLnJlYWR5U3RhdGUgPSBlLmVycm9yLmN1cnJlbnRUYXJnZXQgJiYgZS5lcnJvci5jdXJyZW50VGFyZ2V0LnJlYWR5U3RhdGVcbiAgICBkYXRhLnJldHVyblZhbHVlID0gZS5lcnJvci5yZXR1cm5WYWx1ZVxuICB9XG5cbiAgY2FsbCgnZmVsb2cuZXJyb3InLCAnc29ja2V0X2ZhaWwnLCBkYXRhKVxuXG4gIGNvbnNvbGUuZXJyb3IoJ2NhcGkgZXJyb3InLCBlKVxuICBpZiAoIXdpbmRvdy5lbWl0KSBlbWl0dGVyKHdpbmRvdylcbiAgd2luZG93LmVtaXQoJ2JnZXJyb3InLCBlIHx8ICd3aGVuIHNlbmQgbWVzc2FnZSB0byB0aGUgc29ja2V0Jylcbn1cblxubGV0IFNvY2tldENsaWVudCA9IGZ1bmN0aW9uKHtzb2NrZXRJZCA9IGd1aWQoKSwgdXJsLCB1c2VTdGFuZEJ5fSkge1xuICBsZXQgbWUgPSBlbWl0dGVyKHt9KSxcbiAgICBsaXN0ZW5pbmcgPSBmYWxzZSxcbiAgICBtZXRob2RzID0gWydjb25uZWN0JywgJ3NlbmQnLCAnY2xvc2UnLCAncmVjb25uZWN0JywgJ3JlbGVhc2UnLCAnd3NQbGF5JywgJ3dzUGF1c2UnXVxuXG4gIG1ldGhvZHMuZm9yRWFjaChtZXRob2QgPT4gbWVbbWV0aG9kXSA9IHNlbmQuYmluZChudWxsLCBtZXRob2QpKVxuXG4gIG1lLm9uZSgnY29ubmVjdCcsICgpID0+IHtcbiAgICBzb2NrZXRzW3NvY2tldElkXSA9IHNvY2tldHNbc29ja2V0SWRdIHx8IHNvY2tldElkXG4gICAgdGltZXJzLnN0YXJ0KHNvY2tldElkKVxuICAgIGNhbGwoJ2ZlbG9nLmV2ZW50JywgJ3NvY2tldF9vcGVuJywgeydjdXJyZW50X3NvY2tldHMnOiBPYmplY3Qua2V5cyhzb2NrZXRzKS5sZW5ndGh9KVxuICB9KVxuICBtZS5vbmUoJ2Rpc2Nvbm5lY3QnLCBjbGVhblNvY2tldClcbiAgbWUub24oJ2Vycm9yJywgb25FcnJvcilcblxuICBtZS5zb2NrZXRJZCA9IHNvY2tldElkXG4gIG1lLnRvU3RyaW5nID0gKCkgPT4gJ1tvYmplY3QgU29ja2V0Q2xpZW50XSdcblxuICByZXR1cm4gbWVcblxuICBmdW5jdGlvbiBzZW5kKG1ldGhvZCwgYXJnKSB7XG4gICAgbGV0IG1zZyA9IHtzb2NrZXRJZCwgbWV0aG9kLCBhcmcsIHVybCwgdXNlU3RhbmRCeX1cblxuICAgIGlmICghbGlzdGVuaW5nKSBsaXN0ZW5NZXNzYWdlcygpXG5cbiAgICBpZiAobWV0aG9kID09ICdjb25uZWN0JyAmJiAhaXNUZXN0KSB7Ly9yZWZyZXNoIHVzZXIgc2Vzc2lvbiBldmVyeSAzMCBtaW5cbiAgICAgIHJldHVybiBtZXNzYWdlLmVtaXRCYWNrZ3JvdW5kKCd1c2VyOnJlZnJlc2gnLCB7bGF6eTogdHJ1ZX0sICgpID0+XG4gICAgICAgIG1lc3NhZ2UuZW1pdEJhY2tncm91bmQoJ3NvY2tldC1jbGllbnQnLCBtc2csIG51bGwsIG9uRXJyb3IpXG4gICAgICApXG4gICAgfVxuXG4gICAgbWVzc2FnZS5lbWl0QmFja2dyb3VuZCgnc29ja2V0LWNsaWVudCcsIG1zZywgbnVsbCwgb25FcnJvcilcblxuICAgIGlmIChtZXRob2QgPT0gJ2Nsb3NlJykge1xuICAgICAgY2xlYW5Tb2NrZXQoKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFuU29ja2V0KCkge1xuICAgIG1lLm9mZignZGlzY29ubmVjdCcsIGNsZWFuU29ja2V0KVxuICAgIGRlbGV0ZSBzb2NrZXRzW3NvY2tldElkXVxuICAgIGxpc3RlbmluZyA9IGZhbHNlXG4gICAgbWVzc2FnZS5vZmYoJ3NvY2tldC1zZXJ2ZXInLCBvbk1lc3NhZ2UsIG9uRXJyb3IpXG4gICAgY2FsbCgnZmVsb2cuaW5mbycsICdzb2NrZXRfY2xvc2UnLCB7ICdhY3RpdmVfdGltZSc6IHRpbWVycy5zdG9wKHNvY2tldElkKSwgJ2N1cnJlbnRfc29ja2V0cyc6IE9iamVjdC5rZXlzKHNvY2tldHMpLmxlbmd0aH0pXG4gIH1cblxuICBmdW5jdGlvbiBsaXN0ZW5NZXNzYWdlcygpIHtcbiAgICBsaXN0ZW5pbmcgPSB0cnVlXG4gICAgbWVzc2FnZS5vbignc29ja2V0LXNlcnZlcicsIG9uTWVzc2FnZSwgb25FcnJvcilcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTWVzc2FnZShkYXRhLCBjYikge1xuICAgIGlmIChkYXRhLnNvY2tldElkICE9IHNvY2tldElkKSByZXR1cm5cbiAgICBsZXQgbXNnID0gZGF0YS5tc2cgfHwge31cbiAgICAvLyBjb25zb2xlLmxvZygnaW4gY2xpZW50JywgZGF0YS5ldmVudCwgc29ja2V0SWQsIGRhdGEuaWQsIG1zZylcbiAgICBpZiAobXNnLmFjdGlvbiAmJiBtc2cuYWN0aW9uLnRvTG93ZXJDYXNlKCkgPT0gJ2Vycm9yJykge1xuICAgICAgY2FsbCgnc3RhdHNjLnVpLmluY3JlbWVudCcsICdzdGFiaWxpdHk6Y2FwaV9lcnJvcicpXG4gICAgICBjYWxsKCdmZWxvZy5ldmVudCcsICdzdGFiaWxpdHkuY2FwaV9lcnJvcicsIG1zZylcbiAgICB9XG5cbiAgICBjYignb2snKVxuICAgIG1lLmVtaXQoZGF0YS5ldmVudCwgZGF0YS5tc2cpXG4gIH1cbn1cblxuLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuLy93b3JrcyBpbiBiZyBwYWdlXG4vL1xuXG5sZXQgbG9nID0gW11cblxubGV0IFNvY2tldFNlcnZlciA9IGZ1bmN0aW9uKCkge1xuICBsZXQgbWUgPSB7fVxuXG4gIHdpbmRvdy5zb2NrZXRTZXJ2ZXIgPSBtZVxuXG4gIG1lc3NhZ2Uub24oJ2lmcmFtZS1tb2RlJywgZGF0YSA9PiB7XG4gICAgY29uc29sZS5sb2coJ0lGUkFNRSBNT0RFJywgZGF0YS5pZCwgc29ja2V0cylcbiAgICBzb2NrZXRzW2RhdGEuaWRdLmlmcmFtZU1vZGUoZGF0YS5pZnJhbWVNb2RlKVxuICB9LCBvbkVycm9yLCB0cnVlKVxuXG4gIG1lc3NhZ2Uub24oJ3NvY2tldC1jbGllbnQnLCBvbk1lc3NhZ2UsIG9uRXJyb3IsIHRydWUpXG5cbiAgbWUuc29ja2V0cyA9IHNvY2tldHNcblxuICBtZS50b1N0cmluZyA9ICgpID0+ICdbb2JqZWN0IFNvY2tldFNlcnZlcl0nXG5cbiAgcmV0dXJuIG1lXG5cbiAgLy89PT09PT09PT09PT1cblxuICBmdW5jdGlvbiBvbk1lc3NhZ2UoZGF0YSwgY2IpIHtcbiAgICBpZiAoIWRhdGEpIHJldHVyblxuXG4gICAgbGV0IHNvY2tldElkID0gZGF0YS5zb2NrZXRJZCxcbiAgICAgICAgc29ja2V0ID0gc29ja2V0c1tzb2NrZXRJZF0sXG4gICAgICAgIG1ldGhvZCA9IGRhdGEubWV0aG9kLFxuICAgICAgICBpc0Nsb3NlID0gbWV0aG9kID09ICdjbG9zZSdcblxuICAgIGlmICghc29ja2V0ICYmIGlzQ2xvc2UpIHJldHVyblxuXG4gICAgaWYgKCFzb2NrZXQpIHtcbiAgICAgIHNvY2tldCA9IEJhY2tncm91bmRTb2NrZXQoZGF0YSwgb25yZWxlYXNlKVxuICAgICAgc29ja2V0c1tzb2NrZXRJZF0gPSBzb2NrZXRcbiAgICB9XG5cbiAgICBpZiAobWV0aG9kKSB7XG4gICAgICBzb2NrZXRbbWV0aG9kXShkYXRhLmFyZylcbiAgICAgIGlmICghcHJvY2Vzcy5lbnYuUFJPRCkge1xuICAgICAgICBsb2cucHVzaCh7bWV0aG9kLCAuLi5kYXRhLmFyZ30pXG4gICAgICB9XG4gICAgICBpZiAoaXNDbG9zZSkgb25yZWxlYXNlKHNvY2tldElkKVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9ucmVsZWFzZShzb2NrZXRJZCkge1xuICAgIGlmICghc29ja2V0c1tzb2NrZXRJZF0pIHJldHVyblxuICAgIHNvY2tldHNbc29ja2V0SWRdLmNsb3NlKClcbiAgICAvL3Nob3VsZCBub3QgZW1pdCBhbnl0aGluZyBhZnRlciBjbG9zaW5nXG4gICAgc29ja2V0c1tzb2NrZXRJZF0uZW1pdCA9IChldmVudCwgbXNnKSA9PiB7fVxuICAgIGRlbGV0ZSBzb2NrZXRzW3NvY2tldElkXVxuICB9XG5cbn1cblxuXG5sZXQgQmFja2dyb3VuZFNvY2tldCA9IGZ1bmN0aW9uKGNvbmZpZywgb25yZWxlYXNlKSB7XG4gIGxldCB3cyA9IHdlYnNvY2tldChjb25maWcpLFxuICAgIHNvY2tldElkID0gY29uZmlnLnNvY2tldElkLFxuICAgIF9pZnJhbWVNb2RlLCByZWxlYXNlQ291bnQgPSAwLCB0b29GcmVxdWVudFJlbGVhc2VUcmFja2VkID0gZmFsc2VcblxuICBPYmplY3QuYXNzaWduKHdzLCB7XG4gICAgZW1pdCxcbiAgICBpZnJhbWVNb2RlLFxuICAgIHRvU3RyaW5nOiAoKSA9PiAnW29iamVjdCBCYWNrZ3JvdW5kU29ja2V0XSdcbiAgfSlcblxuICByZXR1cm4gd3NcblxuICBmdW5jdGlvbiBlbWl0KGV2ZW50LCBtc2cpIHtcbiAgICAvL21vbml0b3JpbmcudGltZXIoKVxuXG4gICAgbGV0IHJlbGVhc2VUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ0NMT1NFIFNPQ0tFVCcpXG4gICAgICByZWxlYXNlQ291bnQrK1xuICAgICAgaWYgKHJlbGVhc2VDb3VudCA+IDcgJiYgIXRvb0ZyZXF1ZW50UmVsZWFzZVRyYWNrZWQpIHtcbiAgICAgICAgY2FsbCgnZmVsb2cud2FybicsICd0b29fZnJlcXVlbnRfc29ja2V0X3JlbGVhc2UnLCB7ICdyZWxlYXNlX2NvdW50JzogcmVsZWFzZUNvdW50IH0pXG4gICAgICAgIHRvb0ZyZXF1ZW50UmVsZWFzZVRyYWNrZWQgPSB0cnVlXG4gICAgICB9XG4gICAgICBsZXQgc3RhdHNjS2V5ID0gaWZyYW1lTW9kZSA/ICdzb2NrZXRfdGltZW91dF9jbG9zZV9pZnJhbWU6c3RhYmlsaXR5JyA6ICdzb2NrZXRfdGltZW91dF9jbG9zZTpzdGFiaWxpdHknXG4gICAgICBjYWxsKCdzdGF0c2MudWkuaW5jcmVtZW50Jywgc3RhdHNjS2V5KVxuICAgICAgd3MuY2xvc2UoKVxuICAgICAgd3MucmVsZWFzZSgpXG4gICAgICBvbnJlbGVhc2UoKVxuICAgIH0sIDUwMDApXG5cbiAgICBsZXQgdHlwZSA9IF9pZnJhbWVNb2RlID8gJ3NvY2tldC1zZXJ2ZXItaWZyYW1lJyA6ICdzb2NrZXQtc2VydmVyJ1xuICAgIGNvbnNvbGUubG9nKCdmcm9tIHdzJywgZXZlbnQsIHNvY2tldElkLCBtc2csIHR5cGUpXG4gICAgaWYgKCFwcm9jZXNzLmVudi5QUk9EKSB7XG4gICAgICBsb2cucHVzaCh7ZXZlbnQsIC4uLm1zZ30pXG4gICAgfVxuICAgIG1lc3NhZ2UuZW1pdFRhYnMoXG4gICAgICB0eXBlLFxuICAgICAge3NvY2tldElkLCBldmVudCwgbXNnLCBpZDogZ3VpZCgpfSxcbiAgICAgIG1zZyA9PiBtc2cgJiYgY2xlYXJUaW1lb3V0KHJlbGVhc2VUaW1lciksXG4gICAgICBvbkVycm9yXG4gICAgKVxuXG4gIH1cblxuICBmdW5jdGlvbiBpZnJhbWVNb2RlKGlzT24pIHtcbiAgICBfaWZyYW1lTW9kZSA9IGlzT25cbiAgICBjb25zb2xlLmxvZygnVVNFIEVYVCBTT0NLRVQnLCBpc09uKVxuICB9XG5cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExvZygpIHtcbiAgbGV0IHJlc3VsdCA9IGxvZy5zbGljZSgwKVxuICBsb2cubGVuZ3RoID0gMFxuICByZXR1cm4gcmVzdWx0XG59XG5cbmV4cG9ydCBkZWZhdWx0IFNvY2tldFxuIl19
},{"./config":"/project/src/js/lib/config.js","./message":"/project/src/js/lib/message.js","./timers":"/project/src/js/lib/timers.js","./tracking/index":"/project/src/js/lib/tracking/index.js","./util":"/project/src/js/lib/util.js","emitter":"emitter","websocket":"websocket"}],"/project/src/js/lib/timers.js":[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var timers = {};
exports["default"] = {
  start: function start(id) {
    timers[id] = Date.now();
  },

  stop: function stop(id) {
    var passed = this.passed(id);
    delete timers[id];
    return passed;
  },

  passed: function passed(id) {
    if (!id || !timers[id]) return 0;
    return Date.now() - timers[id];
  }
};
module.exports = exports["default"];

},{}],"/project/src/js/lib/tracking/call.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.call = call;
exports.callAsync = callAsync;
exports.getLog = getLog;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _message = require('../message');

var _message2 = _interopRequireDefault(_message);

var _location = require('../location');

var _util = require('../util');

var _tracker = require('./tracker');

var _tracker2 = _interopRequireDefault(_tracker);

var _felogPixel = require('./felogPixel');

var _felogPixel2 = _interopRequireDefault(_felogPixel);

var _statscPixel = require('./statscPixel');

var _statscPixel2 = _interopRequireDefault(_statscPixel);

var log = [];

_message2['default'].on('tracking-call', function (_ref) {
  var msg = _ref.msg;
  var data = _ref.data;
  var cb = arguments.length <= 1 || arguments[1] === undefined ? _util._f : arguments[1];
  return call.apply(undefined, [msg].concat(_toConsumableArray(data))) && cb();
});

function call(msg) {
  for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    params[_key - 1] = arguments[_key];
  }

  if ((0, _util.isBg)() || (0, _util.isPopup)() && (0, _util.isSafari)()) {
    return setTimeout(function () {
      return callAsync(msg, params);
    }, 20);
  }

  var isFelog = msg.includes('felog');
  var data = isFelog ? extendFelogData(params) : params;
  var WAIT_TIMEOUT = 10000;
  var timeout = setTimeout(function () {
    return errorHandle('timeout call through bg page');
  }, WAIT_TIMEOUT);
  var preventTimeout = function preventTimeout() {
    return clearInterval(timeout);
  };
  var errorHandle = function errorHandle(e) {
    preventTimeout();
    if (isFelog) return _felogPixel2['default'].apply(undefined, _toConsumableArray(data));
    if (msg.includes('statsc.ui.increment')) return _statscPixel2['default'].apply(undefined, [msg.split('.').pop()].concat(_toConsumableArray(data)));
    console.warn('tracking call ' + msg + ' failed, reason: ', e);
  };

  _message2['default'].emitBackground('tracking-call', { msg: msg, data: data }, preventTimeout, errorHandle);
}

function callAsync(msg, data) {
  var args = msg.split('.'),
      method = args.pop(),
      ctx = args.reduce(function (closure, part) {
    return part in closure ? closure[part] : {};
  }, (0, _tracker2['default'])());

  if (!ctx || !ctx[method]) return console.error('No method ' + msg + ' in tracker object');

  ctx[method].apply(ctx, _toConsumableArray(data));
  logCall(msg, data);
}

function logCall(msg, data) {
  console.info(msg, data);

  if (!"true") {
    log.push(_extends({ msg: msg }, data));
  }
}

function extendFelogData() {
  var params = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

  var request = {
    url: (0, _location.getDomain)(),
    headers: {
      'User-Agent': navigator.userAgent
    }
  };

  if (params.length < 2) return [params[0], { request: request }];

  var data = params[1];
  var extra = typeof data == 'string' ? { message: data } : data;

  return [params[0], _extends({}, extra, { request: request })].concat(_toConsumableArray(params.slice(2)));
}

function getLog() {
  var result = log.slice(0);
  log.length = 0;
  return result;
}

},{"../location":"/project/src/js/lib/location.js","../message":"/project/src/js/lib/message.js","../util":"/project/src/js/lib/util.js","./felogPixel":"/project/src/js/lib/tracking/felogPixel.js","./statscPixel":"/project/src/js/lib/tracking/statscPixel.js","./tracker":"/project/src/js/lib/tracking/tracker.js"}],"/project/src/js/lib/tracking/felogPixel.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _config = require('../config');

exports['default'] = function (message, extra) {
  var send = {};

  try {
    JSON.stringify(extra);
    send = extra;
  } catch (e) {
    console.error(e);
  }

  var img = document.createElement('img'),
      data = {
    logger: 'javascript',
    platform: 'javascript',
    tags: {
      application: 'browserplugin',
      fromPixel: true,
      commit: (0, _config.getVersion)(),
      version: (0, _config.getVersion)()
    },
    message: message,
    extra: send
  },
      src = 'https://' + _config.URLS.raven + '/api/' + _config.FELOG.project + '/store/\n?sentry_version=4\n&sentry_client=raven-js/1.1.16\n&sentry_key=' + _config.FELOG.key + '\n&sentry_data=' + encodeURIComponent(JSON.stringify(data));

  img.src = src;

  return img;
};

module.exports = exports['default'];

},{"../config":"/project/src/js/lib/config.js"}],"/project/src/js/lib/tracking/index.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

var _cookie = require('cookie');

var _cookie2 = _interopRequireDefault(_cookie);

var _vendorMixpanel = require('vendor/mixpanel');

var _vendorMixpanel2 = _interopRequireDefault(_vendorMixpanel);

var _vendorMixpanel22 = require('vendor/mixpanel-2.2');

var _vendorMixpanel222 = _interopRequireDefault(_vendorMixpanel22);

var _prefs = require('../prefs');

var _prefs2 = _interopRequireDefault(_prefs);

var _message = require('../message');

var _message2 = _interopRequireDefault(_message);

var _bgCookie = require('../bg/cookie');

var _bgCookie2 = _interopRequireDefault(_bgCookie);

var _location = require('../location');

var _util = require('../util');

var _config = require('../config');

var _on = require('./on');

var _on2 = _interopRequireDefault(_on);

var _call = require('./call');

var _forge = require('../forge');

var _forge2 = _interopRequireDefault(_forge);

var _tracker = require('./tracker');

var _tracker2 = _interopRequireDefault(_tracker);

var emit = _message2['default'].emitBackground;

function initBgOrPopup() {
  var customAjax = (function () {
    return (0, _util.isFF)() && _forge2['default'].request.ajax;
  })();
  (0, _vendorMixpanel2['default'])();
  (0, _vendorMixpanel222['default'])();
  require('tracker');

  (0, _tracker2['default'])().init({
    mixpanel: {
      key: _config.MIXPANEL.key,
      qaKey: _config.MIXPANEL.qaKey,
      dapi: _config.DAPI,
      ajax: customAjax
    },
    gnar: {
      url: _config.GNAR.url,
      qaUrl: _config.GNAR.qaUrl,
      app: (0, _util.getBrowser)() + 'Ext',
      appVersion: (0, _config.getVersion)(),
      ajax: customAjax
    },
    felog: {
      application: 'browserplugin',
      key: _config.FELOG.key,
      url: _config.URLS.raven,
      project: _config.FELOG.project,
      commit: (0, _config.getVersion)(),
      version: (0, _config.getVersion)(),
      readyOnSetUser: true
    },
    statsc: {
      url: _config.STATSC.URL
    }
  });

  (0, _tracker2['default'])().statsc.createRoot({
    prefix: _config.STATSC.PREFIX,
    postfix: (0, _util.getBrowser)() + '.extension.world',
    id: 'ui'
  });

  _message2['default'].on('tracking-fire', function (_ref) {
    var msg = _ref.msg;
    var data = _ref.data;
    return fire.apply(undefined, [msg].concat(_toConsumableArray(data)));
  });

  //init MP for users, which have MP cookie already
  _bgCookie2['default'].get('.grammarly.com', _config.MIXPANEL.cookie, function (cookieMP) {
    if (cookieMP) {
      initMP(cookieMP);
    } else {
      _prefs2['default'].get('mpCookie', initMP);
    }
  });

  function initMP(mpCookie) {
    if (!mpCookie) return;

    window.mixpanel.persistence.load();
    (0, _call.call)('mixpanel.setProps', {
      gProduct: 'Extension-' + (0, _util.getBrowser)(),
      fullProductVersion: (0, _config.getVersion)()
    }, 'Ext');
  }

  _message2['default'].on('tracker-init', function (_ref2) {
    var mpCookie = _ref2.mpCookie;
    var gnar = _ref2.gnar;
    var dapi = _ref2.dapi;

    _prefs2['default'].set('mpCookie', mpCookie);

    var domain = (0, _location.getDomain)(),
        cookieOptions = {
      path: '/',
      domain: domain.includes('.grammarly.com') ? '.grammarly.com' : domain,
      // year from now
      expires: new Date(new Date().setYear(new Date().getFullYear() + 1))
    };

    (0, _cookie2['default'])(_config.MIXPANEL.cookie, null);
    (0, _cookie2['default'])(_config.MIXPANEL.cookie, mpCookie, cookieOptions);

    updateId('gnar_containerId', gnar);
    updateId('__fngrprnt__', dapi);

    function updateId(id, value) {
      if (!value) return;

      _prefs2['default'].set(id, value);
      (0, _cookie2['default'])(id, null);
      (0, _cookie2['default'])(id, value, cookieOptions);
    }
  });

  fire('activity-ping');
}

function fire(msg) {
  for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    data[_key - 1] = arguments[_key];
  }

  if ((0, _util.isBg)()) {
    if (!_on2['default'][msg]) return console.error('No handler specified for message: ' + msg);
    setTimeout(function () {
      return _on2['default'][msg].apply(_on2['default'], data);
    }, 20);
  } else {
    emit('tracking-fire', { msg: msg, data: data });
  }
}

function initContentScript() {
  var times = 0,
      max = 10,
      interval = setInterval(function () {
    times++;
    if (times > max) clearInterval(interval);

    var data = {
      'mpCookie': (0, _cookie2['default'])(_config.MIXPANEL.cookie),
      'gnar': (0, _cookie2['default'])('gnar_containerId'),
      'dapi': (0, _cookie2['default'])('__fngrprnt__')
    };
    if (!data.mpCookie) return;

    clearInterval(interval);
    emit('tracker-init', data);
  }, 500);
}

exports['default'] = {
  initBgOrPopup: initBgOrPopup,
  initContentScript: initContentScript,
  getLog: _call.getLog,
  fire: fire,
  call: _call.call
};
module.exports = exports['default'];

},{"../bg/cookie":"/project/src/js/lib/bg/cookie.js","../config":"/project/src/js/lib/config.js","../forge":"/project/src/js/lib/forge.js","../location":"/project/src/js/lib/location.js","../message":"/project/src/js/lib/message.js","../prefs":"/project/src/js/lib/prefs.js","../util":"/project/src/js/lib/util.js","./call":"/project/src/js/lib/tracking/call.js","./on":"/project/src/js/lib/tracking/on.js","./tracker":"/project/src/js/lib/tracking/tracker.js","cookie":"cookie","tracker":"tracker","vendor/mixpanel":"vendor/mixpanel","vendor/mixpanel-2.2":"vendor/mixpanel-2.2"}],"/project/src/js/lib/tracking/on.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _prefs = require('../prefs');

var _prefs2 = _interopRequireDefault(_prefs);

var _location = require('../location');

var _util = require('../util');

var _config = require('../config');

var _call = require('./call');

exports['default'] = (_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt = {}, _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'bg-page-load', function bgPageLoad() {}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'activity-ping', function activityPing() {
  var toPercent = function toPercent(val) {
    return parseFloat(Math.round(val * 100 * 100) / 100).toFixed(2);
  };
  setInterval(function () {
    if (!(0, _util.isChrome)()) {
      return (0, _call.call)('statsc.ui.increment', 'activity:activity_ping');
    }

    window.chrome.system && window.chrome.system.cpu && window.chrome.system.cpu.getInfo(function (info) {
      var load = info.processors.map(function (processor) {
        return (processor.usage.total - processor.usage.idle) / processor.usage.total;
      }).reduce(function (avg, cpu, i, total) {
        return avg + cpu / total.length;
      }, 0);
      var _window$performance$memory = window.performance.memory;
      var usedJSHeapSize = _window$performance$memory.usedJSHeapSize;
      var totalJSHeapSize = _window$performance$memory.totalJSHeapSize;

      load = toPercent(load);

      (0, _call.call)('statsc.ui.increment', 'activity:activity_ping');
      (0, _call.call)('statsc.ui.gauge', {
        'performance:memory_used': usedJSHeapSize,
        'performance:memory_used_of_total': toPercent((totalJSHeapSize - usedJSHeapSize) / totalJSHeapSize),
        'performance:cpu_load': load
      });
    });
  }, _config.FELOG.pingTimeout);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'daily-ping', function dailyPing() {
  if (_config.debug) return;

  _prefs2['default'].get(['id', 'pingDate'], onload);

  function onload(_ref) {
    var id = _ref.id;
    var pingDate = _ref.pingDate;

    pingDate = pingDate || ''; //for null case

    var _pingDate$split = pingDate.split('|');

    var _pingDate$split2 = _slicedToArray(_pingDate$split, 2);

    var storageNextDate = _pingDate$split2[0];
    var oldId = _pingDate$split2[1];

    if (storageNextDate && storageNextDate > Date.now() && oldId == id) return;
    if (!id) return;

    (0, _call.call)('mixpanel.dapiEvent', 'Daily_Ping', {
      gProduct: 'Extension-' + (0, _util.getBrowser)()
    });
    (0, _call.call)('gnar.trackTrackTrack');
    (0, _call.call)('mixpanel.track', 'Ext:Daily_Ping');
    (0, _call.call)('felog.event', 'daily_ping');

    _prefs2['default'].set('pingDate', [getNextPingDate(), id].join('|'));
  }

  //get random local time between 3-4 AM
  function getNextPingDate() {
    var now = new Date();
    if (now.getHours() > 2) {
      now.setDate(now.getDate() + 1);
    }
    now.setHours(3);
    now.setMinutes(Math.floor(Math.random() * 60));

    return now.getTime();
  }
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'app_signin_success', function app_signin_success() {
  var pageDomain;
  return regeneratorRuntime.async(function app_signin_success$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

      case 2:
        pageDomain = context$1$0.sent;

        (0, _call.call)('mixpanel.track', 'G:User_Login_Succeeded', { pageDomain: pageDomain });
        (0, _call.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/userLoginForm/accepted', { pageDomain: pageDomain });
        (0, _call.call)('statsc.ui.increment', 'stability:app_signin_success');

      case 6:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'app_signup_success', function app_signup_success() {
  var pageDomain;
  return regeneratorRuntime.async(function app_signup_success$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

      case 2:
        pageDomain = context$1$0.sent;

        (0, _call.call)('mixpanel.track', 'G:User_Account_Created', { pageDomain: pageDomain });
        (0, _call.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/userAccountSignupForm/accepted', { pageDomain: pageDomain });
        (0, _call.call)('statsc.ui.increment', 'stability:app_signup_success');

      case 6:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'signin-error', function signinError(error) {
  var pageDomain;
  return regeneratorRuntime.async(function signinError$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

      case 2:
        pageDomain = context$1$0.sent;

        error.errorType = 'Server-Side';
        (0, _call.call)('mixpanel.track', 'G:User_Login_Rejected', { pageDomain: pageDomain });
        (0, _call.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/userLoginForm/rejected', { pageDomain: pageDomain });

      case 6:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'signup-error', function signupError(error) {
  var pageDomain;
  return regeneratorRuntime.async(function signupError$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

      case 2:
        pageDomain = context$1$0.sent;

        error.errorType = 'Server-Side';
        (0, _call.call)('mixpanel.track', 'G:User_Signup_Rejected', { pageDomain: pageDomain });
        (0, _call.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/userAccountSignupForm/rejected', { pageDomain: pageDomain });

      case 6:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'upgrade-after-register', function upgradeAfterRegister() {
  var pageDomain;
  return regeneratorRuntime.async(function upgradeAfterRegister$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

      case 2:
        pageDomain = context$1$0.sent;

        (0, _call.call)('mixpanel.track', 'NE:Account_Type_Selected', {
          accountTypeSelected: 'premium',
          pageDomain: pageDomain
        });
        (0, _call.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/Account_Type_Selected', { pageDomain: pageDomain });

      case 5:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'upgrade', function upgrade(placement, pageDomain) {
  var ext2, data;
  return regeneratorRuntime.async(function upgrade$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap(_prefs2['default'].get('ext2'));

      case 2:
        ext2 = context$1$0.sent;
        data = { pageDomain: pageDomain, placement: placement, ext2: ext2 };

        (0, _call.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/upgradeButtonClicked', data);
        (0, _call.call)('mixpanel.track', 'Ext:Upgrade_To_Plus_Clicked', data);
        (0, _call.call)('felog.info', 'upgrade_click', data);

      case 7:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'button-hover', function buttonHover(buttonType) {
  var pageDomain;
  return regeneratorRuntime.async(function buttonHover$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

      case 2:
        pageDomain = context$1$0.sent;

        (0, _call.call)('mixpanel.track', 'Ext:Action_Button_Hovered', { pageDomain: pageDomain, buttonType: buttonType });
        (0, _call.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/actionButtonHovered', { pageDomain: pageDomain, buttonType: buttonType });
        (0, _call.call)('statsc.ui.increment', 'stability:gbutton_actions_hover');

      case 6:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'correct-btn-clicked', function correctBtnClicked() {
  var pageDomain;
  return regeneratorRuntime.async(function correctBtnClicked$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

      case 2:
        pageDomain = context$1$0.sent;

        (0, _call.call)('mixpanel.track', 'Ext:Correct_Button_Clicked', { pageDomain: pageDomain });
        (0, _call.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/correctButtonClicked');
        (0, _call.call)('statsc.ui.increment', 'stability:editor.correct_button_clicked');
        (0, _call.call)('felog.event', 'g_button_correct_button_clicked');

      case 7:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'btn-disable-in-field', function btnDisableInField(enabled) {
  var pageDomain;
  return regeneratorRuntime.async(function btnDisableInField$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

      case 2:
        pageDomain = context$1$0.sent;

        (0, _call.call)('mixpanel.track', 'Ext:Checking_in_field_toggled', { pageDomain: pageDomain, enabled: enabled });
        (0, _call.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/checkingInFieldToggled', { pageDomain: pageDomain, enabled: enabled });
        (0, _call.call)('statsc.ui.increment', 'stability:disable_in_field');
        (0, _call.call)('felog.info', 'g_button_disable_in_field_click');

      case 7:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'button-change-state', function buttonChangeState(enabled) {
  var pageDomain;
  return regeneratorRuntime.async(function buttonChangeState$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

      case 2:
        pageDomain = context$1$0.sent;

        (0, _call.call)('mixpanel.track', 'Ext:GButton_Minimize_Toggled', { pageDomain: pageDomain, enabled: enabled });
        (0, _call.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/minimizeToggled', { pageDomain: pageDomain, enabled: enabled });
        (0, _call.call)('statsc.ui.increment', 'stability:g_button_minimize_toggled');
        (0, _call.call)('felog.info', 'g_button_minimize_toggled', { enabled: enabled });

      case 7:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'session-end', function sessionEnd(advancedCount) {
  var pageDomain;
  return regeneratorRuntime.async(function sessionEnd$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

      case 2:
        pageDomain = context$1$0.sent;

        (0, _call.call)('mixpanel.track', 'Ext:Only_Advanced_Mistakes', { pageDomain: pageDomain, advancedCount: advancedCount });
        (0, _call.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/onlyAdvancedMistakes', { pageDomain: pageDomain, advancedCount: advancedCount });
        (0, _call.call)('felog.info', 'only_advanced_mistakes', { advancedCount: advancedCount });

      case 6:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _defineProperty(_bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt, 'login-attempt', function loginAttempt(caller) {
  var isExt2;
  return regeneratorRuntime.async(function loginAttempt$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        context$1$0.next = 2;
        return regeneratorRuntime.awrap(_prefs2['default'].isExt2());

      case 2:
        isExt2 = context$1$0.sent;

        if (isExt2) {
          (0, _call.call)('gnar.send', 'Ext/signInClicked', { placement: caller });
          (0, _call.call)('mixpanel.track', 'Ext:Sign_In_Clicked', { placement: caller });
        } else {
          (0, _call.call)('gnar.send', 'Ext/signInClicked_10', { placement: caller });
          (0, _call.call)('mixpanel.track', 'Ext:Sign_In_Clicked_10', { placement: caller });
        }

      case 4:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this);
}), _bgPageLoad$activityPing$dailyPing$app_signin_success$app_signup_success$signinError$signupError$upgradeAfterRegister$upgrade$buttonHover$correctBtnClicked$btnDisableInField$buttonChangeState$sessionEnd$loginAttempt);
module.exports = exports['default'];
//tested
//tested
//tested
//tested
//tested

},{"../config":"/project/src/js/lib/config.js","../location":"/project/src/js/lib/location.js","../prefs":"/project/src/js/lib/prefs.js","../util":"/project/src/js/lib/util.js","./call":"/project/src/js/lib/tracking/call.js"}],"/project/src/js/lib/tracking/statscPixel.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _util = require('../util');

var _config = require('../config');

exports['default'] = function (method, opts) {
  var names = opts && opts.split(':');

  if (!names[0] || !names[1]) return;

  var event = 'grammarly.ui.' + names[0] + '.' + (0, _util.getBrowser)() + '.extension.world.' + names[1],
      data = { c: {} };

  data.c[event] = ['1'];

  var img = document.createElement('img');
  img.src = _config.STATSC.URL + '?json=' + JSON.stringify(data);

  return img;
};

module.exports = exports['default'];

},{"../config":"/project/src/js/lib/config.js","../util":"/project/src/js/lib/util.js"}],"/project/src/js/lib/tracking/tracker.js":[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports["default"] = function () {
  return window.tracker;
};

module.exports = exports["default"];

},{}],"/project/src/js/lib/util.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function isFF() {
  return window.navigator.userAgent.indexOf('Firefox') != -1;
}

function isChrome() {
  return !!window.chrome;
}

function isSafari() {
  return !!window.safari;
}

function isSafari8() {
  return (/^((?!chrome).)*safari/i.test(navigator.userAgent) && navigator.userAgent.indexOf('Version/8.0') != -1
  );
}

function isWindows() {
  return navigator.appVersion.indexOf('Win') != -1;
}

function isBg() {
  return window.IS_BG;
}

function isPopup() {
  return window.IS_POPUP;
}

function isBgOrPopup() {
  return isBg() || isPopup();
}

function getBrowser() {
  if (isChrome()) {
    return 'chrome';
  } else if (isFF()) {
    return 'firefox';
  } else if (isSafari()) {
    return 'safari';
  } else {
    return 'other';
  }
}

function chromeBgError() {
  return window.chrome && window.chrome.runtime && window.chrome.runtime.lastError;
}

function isFunction(obj) {
  return !!(obj && obj.constructor && obj.call && obj.apply);
}

function interval(cb, time) {
  var items = interval.items = interval.items || {},
      item = items[cb];

  if (!item && !time) return;

  if (item && !time) {
    clearTimeout(item);
    delete items[cb];
    return;
  } else run();

  function run() {
    function _cb() {
      timeout();
      cb();
    }

    function timeout() {
      var tid = setTimeout(_cb, time);
      items[cb] = tid;
    }
    timeout();
  }
}

function cancelInterval(cb) {
  interval(cb);
}

function S4() {
  return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
}
function guid() {
  return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
}

function _f() {}
function _F() {
  return true;
}

function bgPageReload() {
  isChrome() && window.chrome.runtime.reload();
}

function isGmail(doc) {
  if (!doc.location) return;
  var host = doc.location.host == 'mail.google.com',
      frames = doc.querySelector('iframe#js_frame') && doc.querySelector('iframe#sound_frame');
  return host || frames;
}

function isValidEmail(value) {
  return (/^[-!#$%&\'*+\\./0-9=?A-Z^_`a-z{|}~]+@[-!#$%&\'*+\\/0-9=?A-Z^_`a-z{|}~]+\.[-!#$%&\'*+\\./0-9=?A-Z^_`a-z{|}~]+$/.test(value)
  );
}

function formatNumber(i) {
  return i.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function declension(value, arr) {
  var index = 2;
  if (value % 10 == 1 && value % 100 != 11) {
    index = 0;
  }

  if (value % 10 >= 2 && value % 10 <= 4 && (value % 100 < 10 || value % 100 >= 20)) {
    index = 1;
  }
  return arr[index];
}

function stub(methods) {
  return _lodash2['default'].transform(methods, function (result, m) {
    return result[m] = _f;
  });
}

function memoize(func, resolver, ttl) {
  var cache = {};
  return function () {
    var key = '_memoize_' + (resolver ? resolver.apply(this, arguments) : arguments[0]);
    if (hasOwnProperty.call(cache, key)) {
      return cache[key];
    } else {
      if (ttl) {
        setTimeout(function () {
          delete cache[key];
        }, ttl);
      }
      return cache[key] = func.apply(this, arguments);
    }
  };
}

function syncWait(promise, methods) {
  return Object.keys(methods).reduce(function (obj, method) {
    return _extends({}, obj, _defineProperty({}, method, function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return promise.then(function () {
        return methods[method].apply(methods, args);
      });
    }));
  }, {});
}

function promisify(method) {
  return new Promise(function (resolve) {
    return method(resolve);
  });
}

function getRandomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
}

//decided to use simple function instead heavy moment.js
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function formatDate(dateStr) {
  if (!dateStr) return;
  var date = new Date(dateStr);
  if (date.toString() == 'Invalid Date') return;
  return months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

function createClass(func) {
  var _class = function _class() {};
  _class.prototype = func();
  return _class;
}

function emitDomEvent(key) {
  var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var e = document.createEvent('CustomEvent');
  e.initCustomEvent(key + '-gr', true, true, data);
  document.dispatchEvent(e);
}

/**
 * Compare two versions of extension. Version format x.x.x
 * @param {string} v1 first version to compare
 * @param {string} v2 second version to compare
 * @example
 * // returns 1
 * versionComparator('2.0.0', '0.0.9')
 * @example
 * // returns 0
 * versionComparator('2.0.0', '2.0.0')
 * @example
 * // returns -1
 * versionComparator('1.0.0', '2.0.0')
 * @returns {Number} Returns 1, 0 or -1
 */
function versionComparator() {
  var v1 = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
  var v2 = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

  function splitToArray(str) {
    return str.split('.').map(function (el) {
      return Number(el) || 0;
    });
  }

  var v1arr = splitToArray(v1),
      v2arr = splitToArray(v2),
      postfix = Array(Math.abs(v1arr.length - v2arr.length)).fill(0);

  v1arr.length > v2arr.length ? v2arr.push.apply(v2arr, _toConsumableArray(postfix)) : v1arr.push.apply(v1arr, _toConsumableArray(postfix));

  if (v1arr.every(function (v, i) {
    return v === v2arr[i];
  })) return 0;

  for (var i = 0, len = v1arr.length; i < len; i++) {
    if (v1arr[i] > v2arr[i]) {
      return 1;
    } else if (v1arr[i] < v2arr[i]) {
      return -1;
    }
  }
  return -1;
}

function isBgAlive() {
  return regeneratorRuntime.async(function isBgAlive$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        if (isChrome()) {
          context$1$0.next = 2;
          break;
        }

        return context$1$0.abrupt('return', null);

      case 2:
        context$1$0.prev = 2;
        context$1$0.next = 5;
        return regeneratorRuntime.awrap(Promise.race([new Promise(function (resolve) {
          return window.chrome.runtime.sendMessage('ping', resolve);
        }), delay(10000).then(function () {
          return 'timeouted';
        })]));

      case 5:
        return context$1$0.abrupt('return', context$1$0.sent);

      case 8:
        context$1$0.prev = 8;
        context$1$0.t0 = context$1$0['catch'](2);
        return context$1$0.abrupt('return', 'orphaned');

      case 11:
      case 'end':
        return context$1$0.stop();
    }
  }, null, this, [[2, 8]]);
}

exports['default'] = {
  getBrowser: getBrowser,
  isFunction: isFunction,
  chromeBgError: chromeBgError,
  interval: interval,
  declension: declension,
  cancelInterval: cancelInterval,
  bgPageReload: bgPageReload,
  isFF: isFF,
  isChrome: isChrome,
  isSafari: isSafari,
  isSafari8: isSafari8,
  isGmail: isGmail,
  isWindows: isWindows,
  isBg: isBg,
  isBgOrPopup: isBgOrPopup,
  isPopup: isPopup,
  guid: guid,
  formatNumber: formatNumber,
  getRandomIntInclusive: getRandomIntInclusive,
  stub: stub,
  memoize: memoize,
  syncWait: syncWait,
  promisify: promisify,
  delay: delay,
  formatDate: formatDate,
  createClass: createClass,
  emitDomEvent: emitDomEvent,
  versionComparator: versionComparator,
  isValidEmail: isValidEmail,
  isBgAlive: isBgAlive,
  _f: _f, _F: _F
};
module.exports = exports['default'];

},{"lodash":"lodash"}]},{},["/project/src/js/lib/bg/bg.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9wcm9qZWN0L25vZGVfbW9kdWxlcy9wcm94eXF1aXJlaWZ5L2xpYi9wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWIvYjY0LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2lzLWFycmF5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RlZXAtZXh0ZW5kL2xpYi9kZWVwLWV4dGVuZC5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvYmcvYXBpLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9iZy9hdXRoLmpzIiwic3JjL2pzL2xpYi9iZy9iYWRnZS5qcyIsInNyYy9qcy9saWIvYmcvYmcuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL2JnL2Nocm9tZS5qcyIsInNyYy9qcy9saWIvYmcvY29va2llLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9iZy9pc2JnLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9iZy9uZXdzLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9iZy9vZmZsaW5lLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9iZy9yZWZlcnJhbHMuanMiLCJzcmMvanMvbGliL2NvbmZpZy5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvZG9tLmpzIiwic3JjL2pzL2xpYi9mb3JnZS5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvbG9jYXRpb24uanMiLCIvcHJvamVjdC9zcmMvanMvbGliL21lc3NhZ2UuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3BhZ2UtY29uZmlnL2NvbmZpZy1iYXNlLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9wYWdlLWNvbmZpZy9jb25maWctYmcuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3BhZ2UtY29uZmlnL2NvbmZpZy1wYWdlLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9wYWdlLWNvbmZpZy9kZWNvcmF0b3IuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3BhZ2UtY29uZmlnL2RlZmF1bHRzLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9wYWdlLWNvbmZpZy9pbmRleC5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvcGFnZS1jb25maWcvbG9jYWxmb3JhZ2UuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3BhZ2UtY29uZmlnL3V0aWxzLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9wcmVmcy5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvcmVxdWVzdC5qcyIsInNyYy9qcy9saWIvc29ja2V0LmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi90aW1lcnMuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3RyYWNraW5nL2NhbGwuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3RyYWNraW5nL2ZlbG9nUGl4ZWwuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3RyYWNraW5nL2luZGV4LmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi90cmFja2luZy9vbi5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvdHJhY2tpbmcvc3RhdHNjUGl4ZWwuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3RyYWNraW5nL3RyYWNrZXIuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3V0aWwuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pnREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7O0FDdFFBLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQTtxQkFDQTtBQUNiLE9BQUssRUFBQSxlQUFDLEVBQVUsRUFBRTtBQUNoQixVQUFNLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBO0dBQ3hCOztBQUVELE1BQUksRUFB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WCxjQUFZLEVBQVosWUFBWTtBQUNaLG1CQUFpQixFQUFqQixpQkFBaUI7QUFDakIsY0FBWSxFQUFaLFlBQVk7QUFDWixXQUFTLEVBQVQsU0FBUztBQUNULElBQUUsRUFBRixFQUFFLEVBQUUsRUFBRSxFQUFGLEVBQUU7Q0FDUCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLy8gbW9kdWxlcyBhcmUgZGVmaW5lZCBhcyBhbiBhcnJheVxuLy8gWyBtb2R1bGUgZnVuY3Rpb24sIG1hcCBvZiByZXF1aXJldWlyZXMgXVxuLy9cbi8vIG1hcCBvZiByZXF1aXJldWlyZXMgaXMgc2hvcnQgcmVxdWlyZSBuYW1lIC0+IG51bWVyaWMgcmVxdWlyZVxuLy9cbi8vIGFueXRoaW5nIGRlZmluZWQgaW4gYSBwcmV2aW91cyBidW5kbGUgaXMgYWNjZXNzZWQgdmlhIHRoZVxuLy8gb3JpZyBtZXRob2Qgd2hpY2ggaXMgdGhlIHJlcXVpcmV1aXJlIGZvciBwcmV2aW91cyBidW5kbGVzXG5cbihmdW5jdGlvbiBvdXRlciAobW9kdWxlcywgY2FjaGUsIGVudHJ5KSB7XG4gICAgLy8gU2F2ZSB0aGUgcmVxdWlyZSBmcm9tIHByZXZpb3VzIGJ1bmRsZSB0byB0aGlzIGNsb3N1cmUgaWYgYW55XG4gICAgdmFyIHByZXZpb3VzUmVxdWlyZSA9IHR5cGVvZiByZXF1aXJlID09IFwiZnVuY3Rpb25cIiAmJiByZXF1aXJlO1xuXG4gICAgZnVuY3Rpb24gZmluZFByb3h5cXVpcmVpZnlOYW1lKCkge1xuICAgICAgICB2YXIgZGVwcyA9IE9iamVjdC5rZXlzKG1vZHVsZXMpXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChrKSB7IHJldHVybiBtb2R1bGVzW2tdWzFdOyB9KTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwcSA9IGRlcHNbaV1bJ3Byb3h5cXVpcmVpZnknXTtcbiAgICAgICAgICAgIGlmIChwcSkgcmV0dXJuIHBxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHByb3h5cXVpcmVpZnlOYW1lID0gZmluZFByb3h5cXVpcmVpZnlOYW1lKCk7XG5cbiAgICBmdW5jdGlvbiBuZXdSZXF1aXJlKG5hbWUsIGp1bXBlZCl7XG4gICAgICAgIC8vIEZpbmQgdGhlIHByb3h5cXVpcmVpZnkgbW9kdWxlLCBpZiBwcmVzZW50XG4gICAgICAgIHZhciBwcWlmeSA9IChwcm94eXF1aXJlaWZ5TmFtZSAhPSBudWxsKSAmJiBjYWNoZVtwcm94eXF1aXJlaWZ5TmFtZV07XG5cbiAgICAgICAgLy8gUHJveHlxdWlyZWlmeSBwcm92aWRlcyBhIHNlcGFyYXRlIGNhY2hlIHRoYXQgaXMgdXNlZCB3aGVuIGluc2lkZVxuICAgICAgICAvLyBhIHByb3h5cXVpcmUgY2FsbCwgYW5kIGlzIHNldCB0byBudWxsIG91dHNpZGUgYSBwcm94eXF1aXJlIGNhbGwuXG4gICAgICAgIC8vIFRoaXMgYWxsb3dzIHRoZSByZWd1bGFyIGNhY2hpbmcgc2VtYW50aWNzIHRvIHdvcmsgY29ycmVjdGx5IGJvdGhcbiAgICAgICAgLy8gaW5zaWRlIGFuZCBvdXRzaWRlIHByb3h5cXVpcmUgY2FsbHMgd2hpbGUga2VlcGluZyB0aGUgY2FjaGVkXG4gICAgICAgIC8vIG1vZHVsZXMgaXNvbGF0ZWQuXG4gICAgICAgIC8vIFdoZW4gc3dpdGNoaW5nIGZyb20gb25lIHByb3h5cXVpcmUgY2FsbCB0byBhbm90aGVyLCBpdCBjbGVhcnNcbiAgICAgICAgLy8gdGhlIGNhY2hlIHRvIHByZXZlbnQgY29udGFtaW5hdGlvbiBiZXR3ZWVuIGRpZmZlcmVudCBzZXRzXG4gICAgICAgIC8vIG9mIHN0dWJzLlxuICAgICAgICB2YXIgY3VycmVudENhY2hlID0gKHBxaWZ5ICYmIHBxaWZ5LmV4cG9ydHMuX2NhY2hlKSB8fCBjYWNoZTtcblxuICAgICAgICBpZighY3VycmVudENhY2hlW25hbWVdKSB7XG4gICAgICAgICAgICBpZighbW9kdWxlc1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIC8vIGlmIHdlIGNhbm5vdCBmaW5kIHRoZSB0aGUgbW9kdWxlIHdpdGhpbiBvdXIgaW50ZXJuYWwgbWFwIG9yXG4gICAgICAgICAgICAgICAgLy8gY2FjaGUganVtcCB0byB0aGUgY3VycmVudCBnbG9iYWwgcmVxdWlyZSBpZS4gdGhlIGxhc3QgYnVuZGxlXG4gICAgICAgICAgICAgICAgLy8gdGhhdCB3YXMgYWRkZWQgdG8gdGhlIHBhZ2UuXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRSZXF1aXJlID0gdHlwZW9mIHJlcXVpcmUgPT0gXCJmdW5jdGlvblwiICYmIHJlcXVpcmU7XG4gICAgICAgICAgICAgICAgaWYgKCFqdW1wZWQgJiYgY3VycmVudFJlcXVpcmUpIHJldHVybiBjdXJyZW50UmVxdWlyZShuYW1lLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBvdGhlciBidW5kbGVzIG9uIHRoaXMgcGFnZSB0aGUgcmVxdWlyZSBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIHByZXZpb3VzIG9uZSBpcyBzYXZlZCB0byAncHJldmlvdXNSZXF1aXJlJy4gUmVwZWF0IHRoaXMgYXNcbiAgICAgICAgICAgICAgICAvLyBtYW55IHRpbWVzIGFzIHRoZXJlIGFyZSBidW5kbGVzIHVudGlsIHRoZSBtb2R1bGUgaXMgZm91bmQgb3JcbiAgICAgICAgICAgICAgICAvLyB3ZSBleGhhdXN0IHRoZSByZXF1aXJlIGNoYWluLlxuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91c1JlcXVpcmUpIHJldHVybiBwcmV2aW91c1JlcXVpcmUobmFtZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignQ2Fubm90IGZpbmQgbW9kdWxlIFxcJycgKyBuYW1lICsgJ1xcJycpO1xuICAgICAgICAgICAgICAgIGVyci5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtID0gY3VycmVudENhY2hlW25hbWVdID0ge2V4cG9ydHM6e319O1xuXG4gICAgICAgICAgICAvLyBUaGUgbm9ybWFsIGJyb3dzZXJpZnkgcmVxdWlyZSBmdW5jdGlvblxuICAgICAgICAgICAgdmFyIHJlcSA9IGZ1bmN0aW9uKHgpe1xuICAgICAgICAgICAgICAgIHZhciBpZCA9IG1vZHVsZXNbbmFtZV1bMV1beF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld1JlcXVpcmUoaWQgPyBpZCA6IHgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb24gc3Vic3RpdHV0ZWQgZm9yIHByb3h5cXVpcmVpZnlcbiAgICAgICAgICAgIHZhciBtb2R1bGVSZXF1aXJlID0gZnVuY3Rpb24oeCl7XG4gICAgICAgICAgICAgICAgdmFyIHBxaWZ5ID0gKHByb3h5cXVpcmVpZnlOYW1lICE9IG51bGwpICYmIGNhY2hlW3Byb3h5cXVpcmVpZnlOYW1lXTtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IHRyeSB0byB1c2UgdGhlIHByb3h5cXVpcmVpZnkgdmVyc2lvbiBpZiBpdCBoYXMgYmVlbiBgcmVxdWlyZWBkXG4gICAgICAgICAgICAgICAgaWYgKHBxaWZ5ICYmIHBxaWZ5LmV4cG9ydHMuX3Byb3h5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcWlmeS5leHBvcnRzLl9wcm94eShyZXEsIHgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXEoeCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbW9kdWxlc1tuYW1lXVswXS5jYWxsKG0uZXhwb3J0cyxtb2R1bGVSZXF1aXJlLG0sbS5leHBvcnRzLG91dGVyLG1vZHVsZXMsY3VycmVudENhY2hlLGVudHJ5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycmVudENhY2hlW25hbWVdLmV4cG9ydHM7XG4gICAgfVxuICAgIGZvcih2YXIgaT0wO2k8ZW50cnkubGVuZ3RoO2krKykgbmV3UmVxdWlyZShlbnRyeVtpXSk7XG5cbiAgICAvLyBPdmVycmlkZSB0aGUgY3VycmVudCByZXF1aXJlIHdpdGggdGhpcyBuZXcgb25lXG4gICAgcmV0dXJuIG5ld1JlcXVpcmU7XG59KVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpcy1hcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG52YXIgcm9vdFBhcmVudCA9IHt9XG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIER1ZSB0byB2YXJpb3VzIGJyb3dzZXIgYnVncywgc29tZXRpbWVzIHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24gd2lsbCBiZSB1c2VkIGV2ZW5cbiAqIHdoZW4gdGhlIGJyb3dzZXIgc3VwcG9ydHMgdHlwZWQgYXJyYXlzLlxuICpcbiAqIE5vdGU6XG4gKlxuICogICAtIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcyxcbiAqICAgICBTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOC5cbiAqXG4gKiAgIC0gU2FmYXJpIDUtNyBsYWNrcyBzdXBwb3J0IGZvciBjaGFuZ2luZyB0aGUgYE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3JgIHByb3BlcnR5XG4gKiAgICAgb24gb2JqZWN0cy5cbiAqXG4gKiAgIC0gQ2hyb21lIDktMTAgaXMgbWlzc2luZyB0aGUgYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbi5cbiAqXG4gKiAgIC0gSUUxMCBoYXMgYSBicm9rZW4gYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGFycmF5cyBvZlxuICogICAgIGluY29ycmVjdCBsZW5ndGggaW4gc29tZSBzaXR1YXRpb25zLlxuXG4gKiBXZSBkZXRlY3QgdGhlc2UgYnVnZ3kgYnJvd3NlcnMgYW5kIHNldCBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgIHRvIGBmYWxzZWAgc28gdGhleVxuICogZ2V0IHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24sIHdoaWNoIGlzIHNsb3dlciBidXQgYmVoYXZlcyBjb3JyZWN0bHkuXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gZ2xvYmFsLlRZUEVEX0FSUkFZX1NVUFBPUlQgIT09IHVuZGVmaW5lZFxuICA/IGdsb2JhbC5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gIDogKGZ1bmN0aW9uICgpIHtcbiAgICAgIGZ1bmN0aW9uIEJhciAoKSB7fVxuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgICAgIGFyci5mb28gPSBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9XG4gICAgICAgIGFyci5jb25zdHJ1Y3RvciA9IEJhclxuICAgICAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MiAmJiAvLyB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZFxuICAgICAgICAgICAgYXJyLmNvbnN0cnVjdG9yID09PSBCYXIgJiYgLy8gY29uc3RydWN0b3IgY2FuIGJlIHNldFxuICAgICAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAvLyBjaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgICAgICAgICAgIGFyci5zdWJhcnJheSgxLCAxKS5ieXRlTGVuZ3RoID09PSAwIC8vIGllMTAgaGFzIGJyb2tlbiBgc3ViYXJyYXlgXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0pKClcblxuZnVuY3Rpb24ga01heExlbmd0aCAoKSB7XG4gIHJldHVybiBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVFxuICAgID8gMHg3ZmZmZmZmZlxuICAgIDogMHgzZmZmZmZmZlxufVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChhcmcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAvLyBBdm9pZCBnb2luZyB0aHJvdWdoIGFuIEFyZ3VtZW50c0FkYXB0b3JUcmFtcG9saW5lIGluIHRoZSBjb21tb24gY2FzZS5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHJldHVybiBuZXcgQnVmZmVyKGFyZywgYXJndW1lbnRzWzFdKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKGFyZylcbiAgfVxuXG4gIHRoaXMubGVuZ3RoID0gMFxuICB0aGlzLnBhcmVudCA9IHVuZGVmaW5lZFxuXG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gZnJvbU51bWJlcih0aGlzLCBhcmcpXG4gIH1cblxuICAvLyBTbGlnaHRseSBsZXNzIGNvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh0aGlzLCBhcmcsIGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogJ3V0ZjgnKVxuICB9XG5cbiAgLy8gVW51c3VhbC5cbiAgcmV0dXJuIGZyb21PYmplY3QodGhpcywgYXJnKVxufVxuXG5mdW5jdGlvbiBmcm9tTnVtYmVyICh0aGF0LCBsZW5ndGgpIHtcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChsZW5ndGgpIHwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoYXRbaV0gPSAwXG4gICAgfVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHRoYXQsIHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIC8vIEFzc3VtcHRpb246IGJ5dGVMZW5ndGgoKSByZXR1cm4gdmFsdWUgaXMgYWx3YXlzIDwga01heExlbmd0aC5cbiAgdmFyIGxlbmd0aCA9IGJ5dGVMZW5ndGgoc3RyaW5nLCBlbmNvZGluZykgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG5cbiAgdGhhdC53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tT2JqZWN0ICh0aGF0LCBvYmplY3QpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihvYmplY3QpKSByZXR1cm4gZnJvbUJ1ZmZlcih0aGF0LCBvYmplY3QpXG5cbiAgaWYgKGlzQXJyYXkob2JqZWN0KSkgcmV0dXJuIGZyb21BcnJheSh0aGF0LCBvYmplY3QpXG5cbiAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbXVzdCBzdGFydCB3aXRoIG51bWJlciwgYnVmZmVyLCBhcnJheSBvciBzdHJpbmcnKVxuICB9XG5cbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAob2JqZWN0LmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICByZXR1cm4gZnJvbVR5cGVkQXJyYXkodGhhdCwgb2JqZWN0KVxuICAgIH1cbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodGhhdCwgb2JqZWN0KVxuICAgIH1cbiAgfVxuXG4gIGlmIChvYmplY3QubGVuZ3RoKSByZXR1cm4gZnJvbUFycmF5TGlrZSh0aGF0LCBvYmplY3QpXG5cbiAgcmV0dXJuIGZyb21Kc29uT2JqZWN0KHRoYXQsIG9iamVjdClcbn1cblxuZnVuY3Rpb24gZnJvbUJ1ZmZlciAodGhhdCwgYnVmZmVyKSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGJ1ZmZlci5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBidWZmZXIuY29weSh0aGF0LCAwLCAwLCBsZW5ndGgpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbi8vIER1cGxpY2F0ZSBvZiBmcm9tQXJyYXkoKSB0byBrZWVwIGZyb21BcnJheSgpIG1vbm9tb3JwaGljLlxuZnVuY3Rpb24gZnJvbVR5cGVkQXJyYXkgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIC8vIFRydW5jYXRpbmcgdGhlIGVsZW1lbnRzIGlzIHByb2JhYmx5IG5vdCB3aGF0IHBlb3BsZSBleHBlY3QgZnJvbSB0eXBlZFxuICAvLyBhcnJheXMgd2l0aCBCWVRFU19QRVJfRUxFTUVOVCA+IDEgYnV0IGl0J3MgY29tcGF0aWJsZSB3aXRoIHRoZSBiZWhhdmlvclxuICAvLyBvZiB0aGUgb2xkIEJ1ZmZlciBjb25zdHJ1Y3Rvci5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAodGhhdCwgYXJyYXkpIHtcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgYXJyYXkuYnl0ZUxlbmd0aFxuICAgIHRoYXQgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkoYXJyYXkpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gYW4gb2JqZWN0IGluc3RhbmNlIG9mIHRoZSBCdWZmZXIgY2xhc3NcbiAgICB0aGF0ID0gZnJvbVR5cGVkQXJyYXkodGhhdCwgbmV3IFVpbnQ4QXJyYXkoYXJyYXkpKVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG4vLyBEZXNlcmlhbGl6ZSB7IHR5cGU6ICdCdWZmZXInLCBkYXRhOiBbMSwyLDMsLi4uXSB9IGludG8gYSBCdWZmZXIgb2JqZWN0LlxuLy8gUmV0dXJucyBhIHplcm8tbGVuZ3RoIGJ1ZmZlciBmb3IgaW5wdXRzIHRoYXQgZG9uJ3QgY29uZm9ybSB0byB0aGUgc3BlYy5cbmZ1bmN0aW9uIGZyb21Kc29uT2JqZWN0ICh0aGF0LCBvYmplY3QpIHtcbiAgdmFyIGFycmF5XG4gIHZhciBsZW5ndGggPSAwXG5cbiAgaWYgKG9iamVjdC50eXBlID09PSAnQnVmZmVyJyAmJiBpc0FycmF5KG9iamVjdC5kYXRhKSkge1xuICAgIGFycmF5ID0gb2JqZWN0LmRhdGFcbiAgICBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIH1cbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gIEJ1ZmZlci5wcm90b3R5cGUuX19wcm90b19fID0gVWludDhBcnJheS5wcm90b3R5cGVcbiAgQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcbn1cblxuZnVuY3Rpb24gYWxsb2NhdGUgKHRoYXQsIGxlbmd0aCkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICB0aGF0ID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gICAgdGhhdC5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQubGVuZ3RoID0gbGVuZ3RoXG4gICAgdGhhdC5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgZnJvbVBvb2wgPSBsZW5ndGggIT09IDAgJiYgbGVuZ3RoIDw9IEJ1ZmZlci5wb29sU2l6ZSA+Pj4gMVxuICBpZiAoZnJvbVBvb2wpIHRoYXQucGFyZW50ID0gcm9vdFBhcmVudFxuXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBrTWF4TGVuZ3RoYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IGtNYXhMZW5ndGgoKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBrTWF4TGVuZ3RoKCkudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNsb3dCdWZmZXIpKSByZXR1cm4gbmV3IFNsb3dCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcpXG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGRlbGV0ZSBidWYucGFyZW50XG4gIHJldHVybiBidWZcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIHZhciBpID0gMFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkgYnJlYWtcblxuICAgICsraVxuICB9XG5cbiAgaWYgKGkgIT09IGxlbikge1xuICAgIHggPSBhW2ldXG4gICAgeSA9IGJbaV1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghaXNBcnJheShsaXN0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignbGlzdCBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMuJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHN0cmluZyA9ICcnICsgc3RyaW5nXG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAvLyBEZXByZWNhdGVkXG4gICAgICBjYXNlICdyYXcnOlxuICAgICAgY2FzZSAncmF3cyc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG4vLyBwcmUtc2V0IGZvciB2YWx1ZXMgdGhhdCBtYXkgZXhpc3QgaW4gdGhlIGZ1dHVyZVxuQnVmZmVyLnByb3RvdHlwZS5sZW5ndGggPSB1bmRlZmluZWRcbkJ1ZmZlci5wcm90b3R5cGUucGFyZW50ID0gdW5kZWZpbmVkXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICBzdGFydCA9IHN0YXJ0IHwgMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPT09IEluZmluaXR5ID8gdGhpcy5sZW5ndGggOiBlbmQgfCAwXG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcbiAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKGVuZCA8PSBzdGFydCkgcmV0dXJuICcnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCB8IDBcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIGlmICh0aGlzLmxlbmd0aCA+IDApIHtcbiAgICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLm1hdGNoKC8uezJ9L2cpLmpvaW4oJyAnKVxuICAgIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiAwXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICBieXRlT2Zmc2V0ID4+PSAwXG5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcbiAgaWYgKGJ5dGVPZmZzZXQgPj0gdGhpcy5sZW5ndGgpIHJldHVybiAtMVxuXG4gIC8vIE5lZ2F0aXZlIG9mZnNldHMgc3RhcnQgZnJvbSB0aGUgZW5kIG9mIHRoZSBidWZmZXJcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwKSBieXRlT2Zmc2V0ID0gTWF0aC5tYXgodGhpcy5sZW5ndGggKyBieXRlT2Zmc2V0LCAwKVxuXG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSByZXR1cm4gLTEgLy8gc3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcgYWx3YXlzIGZhaWxzXG4gICAgcmV0dXJuIFN0cmluZy5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHRoaXMsIHZhbCwgYnl0ZU9mZnNldClcbiAgfVxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbCkpIHtcbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldClcbiAgfVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgWyB2YWwgXSwgYnl0ZU9mZnNldClcbiAgfVxuXG4gIGZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQpIHtcbiAgICB2YXIgZm91bmRJbmRleCA9IC0xXG4gICAgZm9yICh2YXIgaSA9IDA7IGJ5dGVPZmZzZXQgKyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXJyW2J5dGVPZmZzZXQgKyBpXSA9PT0gdmFsW2ZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4XSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbC5sZW5ndGgpIHJldHVybiBieXRlT2Zmc2V0ICsgZm91bmRJbmRleFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuLy8gYGdldGAgaXMgZGVwcmVjYXRlZFxuQnVmZmVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQgKG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLmdldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMucmVhZFVJbnQ4KG9mZnNldClcbn1cblxuLy8gYHNldGAgaXMgZGVwcmVjYXRlZFxuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQgKHYsIG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLnNldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMud3JpdGVVSW50OCh2LCBvZmZzZXQpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgLy8gbXVzdCBiZSBhbiBldmVuIG51bWJlciBvZiBkaWdpdHNcbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKHN0ckxlbiAlIDIgIT09IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAoaXNOYU4ocGFyc2VkKSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggfCAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgLy8gbGVnYWN5IHdyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKSAtIHJlbW92ZSBpbiB2MC4xM1xuICB9IGVsc2Uge1xuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aCB8IDBcbiAgICBsZW5ndGggPSBzd2FwXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignYXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2kgKyAxXSAqIDI1NilcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIG5ld0J1ZiA9IEJ1ZmZlci5fYXVnbWVudCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpKVxuICB9IGVsc2Uge1xuICAgIHZhciBzbGljZUxlbiA9IGVuZCAtIHN0YXJ0XG4gICAgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9XG5cbiAgaWYgKG5ld0J1Zi5sZW5ndGgpIG5ld0J1Zi5wYXJlbnQgPSB0aGlzLnBhcmVudCB8fCB0aGlzXG5cbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdidWZmZXIgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpLCAwKVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpLCAwKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCAyKTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgNCk7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgPj4+IChsaXR0bGVFbmRpYW4gPyBpIDogMyAtIGkpICogOCkgJiAweGZmXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSB2YWx1ZSA8IDAgPyAxIDogMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gd3JpdGVGbG9hdExFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG4gIHZhciBpXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yIChpID0gbGVuIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2UgaWYgKGxlbiA8IDEwMDAgfHwgIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gYXNjZW5kaW5nIGNvcHkgZnJvbSBzdGFydFxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGFyZ2V0Ll9zZXQodGhpcy5zdWJhcnJheShzdGFydCwgc3RhcnQgKyBsZW4pLCB0YXJnZXRTdGFydClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gZmlsbCh2YWx1ZSwgc3RhcnQ9MCwgZW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWx1ZSwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXZhbHVlKSB2YWx1ZSA9IDBcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kKSBlbmQgPSB0aGlzLmxlbmd0aFxuXG4gIGlmIChlbmQgPCBzdGFydCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2VuZCA8IHN0YXJ0JylcblxuICAvLyBGaWxsIDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVyblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdzdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDAgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdlbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gdmFsdWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gdXRmOFRvQnl0ZXModmFsdWUudG9TdHJpbmcoKSlcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGBBcnJheUJ1ZmZlcmAgd2l0aCB0aGUgKmNvcGllZCogbWVtb3J5IG9mIHRoZSBidWZmZXIgaW5zdGFuY2UuXG4gKiBBZGRlZCBpbiBOb2RlIDAuMTIuIE9ubHkgYXZhaWxhYmxlIGluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBBcnJheUJ1ZmZlci5cbiAqL1xuQnVmZmVyLnByb3RvdHlwZS50b0FycmF5QnVmZmVyID0gZnVuY3Rpb24gdG9BcnJheUJ1ZmZlciAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAgIHJldHVybiAobmV3IEJ1ZmZlcih0aGlzKSkuYnVmZmVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmxlbmd0aClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBidWYubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQnVmZmVyLnRvQXJyYXlCdWZmZXIgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXInKVxuICB9XG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIEJQID0gQnVmZmVyLnByb3RvdHlwZVxuXG4vKipcbiAqIEF1Z21lbnQgYSBVaW50OEFycmF5ICppbnN0YW5jZSogKG5vdCB0aGUgVWludDhBcnJheSBjbGFzcyEpIHdpdGggQnVmZmVyIG1ldGhvZHNcbiAqL1xuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gX2F1Z21lbnQgKGFycikge1xuICBhcnIuY29uc3RydWN0b3IgPSBCdWZmZXJcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IHNldCBtZXRob2QgYmVmb3JlIG92ZXJ3cml0aW5nXG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWRcbiAgYXJyLmdldCA9IEJQLmdldFxuICBhcnIuc2V0ID0gQlAuc2V0XG5cbiAgYXJyLndyaXRlID0gQlAud3JpdGVcbiAgYXJyLnRvU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvTG9jYWxlU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvSlNPTiA9IEJQLnRvSlNPTlxuICBhcnIuZXF1YWxzID0gQlAuZXF1YWxzXG4gIGFyci5jb21wYXJlID0gQlAuY29tcGFyZVxuICBhcnIuaW5kZXhPZiA9IEJQLmluZGV4T2ZcbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludExFID0gQlAucmVhZFVJbnRMRVxuICBhcnIucmVhZFVJbnRCRSA9IEJQLnJlYWRVSW50QkVcbiAgYXJyLnJlYWRVSW50OCA9IEJQLnJlYWRVSW50OFxuICBhcnIucmVhZFVJbnQxNkxFID0gQlAucmVhZFVJbnQxNkxFXG4gIGFyci5yZWFkVUludDE2QkUgPSBCUC5yZWFkVUludDE2QkVcbiAgYXJyLnJlYWRVSW50MzJMRSA9IEJQLnJlYWRVSW50MzJMRVxuICBhcnIucmVhZFVJbnQzMkJFID0gQlAucmVhZFVJbnQzMkJFXG4gIGFyci5yZWFkSW50TEUgPSBCUC5yZWFkSW50TEVcbiAgYXJyLnJlYWRJbnRCRSA9IEJQLnJlYWRJbnRCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnRMRSA9IEJQLndyaXRlVUludExFXG4gIGFyci53cml0ZVVJbnRCRSA9IEJQLndyaXRlVUludEJFXG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnRMRSA9IEJQLndyaXRlSW50TEVcbiAgYXJyLndyaXRlSW50QkUgPSBCUC53cml0ZUludEJFXG4gIGFyci53cml0ZUludDggPSBCUC53cml0ZUludDhcbiAgYXJyLndyaXRlSW50MTZMRSA9IEJQLndyaXRlSW50MTZMRVxuICBhcnIud3JpdGVJbnQxNkJFID0gQlAud3JpdGVJbnQxNkJFXG4gIGFyci53cml0ZUludDMyTEUgPSBCUC53cml0ZUludDMyTEVcbiAgYXJyLndyaXRlSW50MzJCRSA9IEJQLndyaXRlSW50MzJCRVxuICBhcnIud3JpdGVGbG9hdExFID0gQlAud3JpdGVGbG9hdExFXG4gIGFyci53cml0ZUZsb2F0QkUgPSBCUC53cml0ZUZsb2F0QkVcbiAgYXJyLndyaXRlRG91YmxlTEUgPSBCUC53cml0ZURvdWJsZUxFXG4gIGFyci53cml0ZURvdWJsZUJFID0gQlAud3JpdGVEb3VibGVCRVxuICBhcnIuZmlsbCA9IEJQLmZpbGxcbiAgYXJyLmluc3BlY3QgPSBCUC5pbnNwZWN0XG4gIGFyci50b0FycmF5QnVmZmVyID0gQlAudG9BcnJheUJ1ZmZlclxuXG4gIHJldHVybiBhcnJcbn1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teK1xcLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0cmluZ3RyaW0oc3RyKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gbGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCB8IDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OWljbTkzYzJWeWFXWjVMMjV2WkdWZmJXOWtkV3hsY3k5aWRXWm1aWEl2YVc1a1pYZ3Vhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SXZLaUZjYmlBcUlGUm9aU0JpZFdabVpYSWdiVzlrZFd4bElHWnliMjBnYm05a1pTNXFjeXdnWm05eUlIUm9aU0JpY205M2MyVnlMbHh1SUNwY2JpQXFJRUJoZFhSb2IzSWdJQ0JHWlhKdmMzTWdRV0p2ZFd0b1lXUnBhbVZvSUR4bVpYSnZjM05BWm1WeWIzTnpMbTl5Wno0Z1BHaDBkSEE2THk5bVpYSnZjM011YjNKblBseHVJQ29nUUd4cFkyVnVjMlVnSUUxSlZGeHVJQ292WEc0dktpQmxjMnhwYm5RdFpHbHpZV0pzWlNCdWJ5MXdjbTkwYnlBcUwxeHVYRzUyWVhJZ1ltRnpaVFkwSUQwZ2NtVnhkV2x5WlNnblltRnpaVFkwTFdwekp5bGNiblpoY2lCcFpXVmxOelUwSUQwZ2NtVnhkV2x5WlNnbmFXVmxaVGMxTkNjcFhHNTJZWElnYVhOQmNuSmhlU0E5SUhKbGNYVnBjbVVvSjJsekxXRnljbUY1SnlsY2JseHVaWGh3YjNKMGN5NUNkV1ptWlhJZ1BTQkNkV1ptWlhKY2JtVjRjRzl5ZEhNdVUyeHZkMEoxWm1abGNpQTlJRk5zYjNkQ2RXWm1aWEpjYm1WNGNHOXlkSE11U1U1VFVFVkRWRjlOUVZoZlFsbFVSVk1nUFNBMU1GeHVRblZtWm1WeUxuQnZiMnhUYVhwbElEMGdPREU1TWlBdkx5QnViM1FnZFhObFpDQmllU0IwYUdseklHbHRjR3hsYldWdWRHRjBhVzl1WEc1Y2JuWmhjaUJ5YjI5MFVHRnlaVzUwSUQwZ2UzMWNibHh1THlvcVhHNGdLaUJKWmlCZ1FuVm1abVZ5TGxSWlVFVkVYMEZTVWtGWlgxTlZVRkJQVWxSZ09seHVJQ29nSUNBOVBUMGdkSEoxWlNBZ0lDQlZjMlVnVldsdWREaEJjbkpoZVNCcGJYQnNaVzFsYm5SaGRHbHZiaUFvWm1GemRHVnpkQ2xjYmlBcUlDQWdQVDA5SUdaaGJITmxJQ0FnVlhObElFOWlhbVZqZENCcGJYQnNaVzFsYm5SaGRHbHZiaUFvYlc5emRDQmpiMjF3WVhScFlteGxMQ0JsZG1WdUlFbEZOaWxjYmlBcVhHNGdLaUJDY205M2MyVnljeUIwYUdGMElITjFjSEJ2Y25RZ2RIbHdaV1FnWVhKeVlYbHpJR0Z5WlNCSlJTQXhNQ3NzSUVacGNtVm1iM2dnTkNzc0lFTm9jbTl0WlNBM0t5d2dVMkZtWVhKcElEVXVNU3NzWEc0Z0tpQlBjR1Z5WVNBeE1TNDJLeXdnYVU5VElEUXVNaXN1WEc0Z0tseHVJQ29nUkhWbElIUnZJSFpoY21sdmRYTWdZbkp2ZDNObGNpQmlkV2R6TENCemIyMWxkR2x0WlhNZ2RHaGxJRTlpYW1WamRDQnBiWEJzWlcxbGJuUmhkR2x2YmlCM2FXeHNJR0psSUhWelpXUWdaWFpsYmx4dUlDb2dkMmhsYmlCMGFHVWdZbkp2ZDNObGNpQnpkWEJ3YjNKMGN5QjBlWEJsWkNCaGNuSmhlWE11WEc0Z0tseHVJQ29nVG05MFpUcGNiaUFxWEc0Z0tpQWdJQzBnUm1seVpXWnZlQ0EwTFRJNUlHeGhZMnR6SUhOMWNIQnZjblFnWm05eUlHRmtaR2x1WnlCdVpYY2djSEp2Y0dWeWRHbGxjeUIwYnlCZ1ZXbHVkRGhCY25KaGVXQWdhVzV6ZEdGdVkyVnpMRnh1SUNvZ0lDQWdJRk5sWlRvZ2FIUjBjSE02THk5aWRXZDZhV3hzWVM1dGIzcHBiR3hoTG05eVp5OXphRzkzWDJKMVp5NWpaMmsvYVdROU5qazFORE00TGx4dUlDcGNiaUFxSUNBZ0xTQlRZV1poY21rZ05TMDNJR3hoWTJ0eklITjFjSEJ2Y25RZ1ptOXlJR05vWVc1bmFXNW5JSFJvWlNCZ1QySnFaV04wTG5CeWIzUnZkSGx3WlM1amIyNXpkSEoxWTNSdmNtQWdjSEp2Y0dWeWRIbGNiaUFxSUNBZ0lDQnZiaUJ2WW1wbFkzUnpMbHh1SUNwY2JpQXFJQ0FnTFNCRGFISnZiV1VnT1MweE1DQnBjeUJ0YVhOemFXNW5JSFJvWlNCZ1ZIbHdaV1JCY25KaGVTNXdjbTkwYjNSNWNHVXVjM1ZpWVhKeVlYbGdJR1oxYm1OMGFXOXVMbHh1SUNwY2JpQXFJQ0FnTFNCSlJURXdJR2hoY3lCaElHSnliMnRsYmlCZ1ZIbHdaV1JCY25KaGVTNXdjbTkwYjNSNWNHVXVjM1ZpWVhKeVlYbGdJR1oxYm1OMGFXOXVJSGRvYVdOb0lISmxkSFZ5Ym5NZ1lYSnlZWGx6SUc5bVhHNGdLaUFnSUNBZ2FXNWpiM0p5WldOMElHeGxibWQwYUNCcGJpQnpiMjFsSUhOcGRIVmhkR2x2Ym5NdVhHNWNiaUFxSUZkbElHUmxkR1ZqZENCMGFHVnpaU0JpZFdkbmVTQmljbTkzYzJWeWN5QmhibVFnYzJWMElHQkNkV1ptWlhJdVZGbFFSVVJmUVZKU1FWbGZVMVZRVUU5U1ZHQWdkRzhnWUdaaGJITmxZQ0J6YnlCMGFHVjVYRzRnS2lCblpYUWdkR2hsSUU5aWFtVmpkQ0JwYlhCc1pXMWxiblJoZEdsdmJpd2dkMmhwWTJnZ2FYTWdjMnh2ZDJWeUlHSjFkQ0JpWldoaGRtVnpJR052Y25KbFkzUnNlUzVjYmlBcUwxeHVRblZtWm1WeUxsUlpVRVZFWDBGU1VrRlpYMU5WVUZCUFVsUWdQU0JuYkc5aVlXd3VWRmxRUlVSZlFWSlNRVmxmVTFWUVVFOVNWQ0FoUFQwZ2RXNWtaV1pwYm1Wa1hHNGdJRDhnWjJ4dlltRnNMbFJaVUVWRVgwRlNVa0ZaWDFOVlVGQlBVbFJjYmlBZ09pQW9ablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJQ0FnWm5WdVkzUnBiMjRnUW1GeUlDZ3BJSHQ5WEc0Z0lDQWdJQ0IwY25rZ2UxeHVJQ0FnSUNBZ0lDQjJZWElnWVhKeUlEMGdibVYzSUZWcGJuUTRRWEp5WVhrb01TbGNiaUFnSUNBZ0lDQWdZWEp5TG1admJ5QTlJR1oxYm1OMGFXOXVJQ2dwSUhzZ2NtVjBkWEp1SURReUlIMWNiaUFnSUNBZ0lDQWdZWEp5TG1OdmJuTjBjblZqZEc5eUlEMGdRbUZ5WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJoY25JdVptOXZLQ2tnUFQwOUlEUXlJQ1ltSUM4dklIUjVjR1ZrSUdGeWNtRjVJR2x1YzNSaGJtTmxjeUJqWVc0Z1ltVWdZWFZuYldWdWRHVmtYRzRnSUNBZ0lDQWdJQ0FnSUNCaGNuSXVZMjl1YzNSeWRXTjBiM0lnUFQwOUlFSmhjaUFtSmlBdkx5QmpiMjV6ZEhKMVkzUnZjaUJqWVc0Z1ltVWdjMlYwWEc0Z0lDQWdJQ0FnSUNBZ0lDQjBlWEJsYjJZZ1lYSnlMbk4xWW1GeWNtRjVJRDA5UFNBblpuVnVZM1JwYjI0bklDWW1JQzh2SUdOb2NtOXRaU0E1TFRFd0lHeGhZMnNnWUhOMVltRnljbUY1WUZ4dUlDQWdJQ0FnSUNBZ0lDQWdZWEp5TG5OMVltRnljbUY1S0RFc0lERXBMbUo1ZEdWTVpXNW5kR2dnUFQwOUlEQWdMeThnYVdVeE1DQm9ZWE1nWW5KdmEyVnVJR0J6ZFdKaGNuSmhlV0JjYmlBZ0lDQWdJSDBnWTJGMFkyZ2dLR1VwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdaaGJITmxYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZTa29LVnh1WEc1bWRXNWpkR2x2YmlCclRXRjRUR1Z1WjNSb0lDZ3BJSHRjYmlBZ2NtVjBkWEp1SUVKMVptWmxjaTVVV1ZCRlJGOUJVbEpCV1Y5VFZWQlFUMUpVWEc0Z0lDQWdQeUF3ZURkbVptWm1abVptWEc0Z0lDQWdPaUF3ZURObVptWm1abVptWEc1OVhHNWNiaThxS2x4dUlDb2dRMnhoYzNNNklFSjFabVpsY2x4dUlDb2dQVDA5UFQwOVBUMDlQVDA5UFZ4dUlDcGNiaUFxSUZSb1pTQkNkV1ptWlhJZ1kyOXVjM1J5ZFdOMGIzSWdjbVYwZFhKdWN5QnBibk4wWVc1alpYTWdiMllnWUZWcGJuUTRRWEp5WVhsZ0lIUm9ZWFFnWVhKbElHRjFaMjFsYm5SbFpGeHVJQ29nZDJsMGFDQm1kVzVqZEdsdmJpQndjbTl3WlhKMGFXVnpJR1p2Y2lCaGJHd2dkR2hsSUc1dlpHVWdZRUoxWm1abGNtQWdRVkJKSUdaMWJtTjBhVzl1Y3k0Z1YyVWdkWE5sWEc0Z0tpQmdWV2x1ZERoQmNuSmhlV0FnYzI4Z2RHaGhkQ0J6Y1hWaGNtVWdZbkpoWTJ0bGRDQnViM1JoZEdsdmJpQjNiM0pyY3lCaGN5QmxlSEJsWTNSbFpDQXRMU0JwZENCeVpYUjFjbTV6WEc0Z0tpQmhJSE5wYm1kc1pTQnZZM1JsZEM1Y2JpQXFYRzRnS2lCQ2VTQmhkV2R0Wlc1MGFXNW5JSFJvWlNCcGJuTjBZVzVqWlhNc0lIZGxJR05oYmlCaGRtOXBaQ0J0YjJScFpubHBibWNnZEdobElHQlZhVzUwT0VGeWNtRjVZRnh1SUNvZ2NISnZkRzkwZVhCbExseHVJQ292WEc1bWRXNWpkR2x2YmlCQ2RXWm1aWElnS0dGeVp5a2dlMXh1SUNCcFppQW9JU2gwYUdseklHbHVjM1JoYm1ObGIyWWdRblZtWm1WeUtTa2dlMXh1SUNBZ0lDOHZJRUYyYjJsa0lHZHZhVzVuSUhSb2NtOTFaMmdnWVc0Z1FYSm5kVzFsYm5SelFXUmhjSFJ2Y2xSeVlXMXdiMnhwYm1VZ2FXNGdkR2hsSUdOdmJXMXZiaUJqWVhObExseHVJQ0FnSUdsbUlDaGhjbWQxYldWdWRITXViR1Z1WjNSb0lENGdNU2tnY21WMGRYSnVJRzVsZHlCQ2RXWm1aWElvWVhKbkxDQmhjbWQxYldWdWRITmJNVjBwWEc0Z0lDQWdjbVYwZFhKdUlHNWxkeUJDZFdabVpYSW9ZWEpuS1Z4dUlDQjlYRzVjYmlBZ2RHaHBjeTVzWlc1bmRHZ2dQU0F3WEc0Z0lIUm9hWE11Y0dGeVpXNTBJRDBnZFc1a1pXWnBibVZrWEc1Y2JpQWdMeThnUTI5dGJXOXVJR05oYzJVdVhHNGdJR2xtSUNoMGVYQmxiMllnWVhKbklEMDlQU0FuYm5WdFltVnlKeWtnZTF4dUlDQWdJSEpsZEhWeWJpQm1jbTl0VG5WdFltVnlLSFJvYVhNc0lHRnlaeWxjYmlBZ2ZWeHVYRzRnSUM4dklGTnNhV2RvZEd4NUlHeGxjM01nWTI5dGJXOXVJR05oYzJVdVhHNGdJR2xtSUNoMGVYQmxiMllnWVhKbklEMDlQU0FuYzNSeWFXNW5KeWtnZTF4dUlDQWdJSEpsZEhWeWJpQm1jbTl0VTNSeWFXNW5LSFJvYVhNc0lHRnlaeXdnWVhKbmRXMWxiblJ6TG14bGJtZDBhQ0ErSURFZ1B5QmhjbWQxYldWdWRITmJNVjBnT2lBbmRYUm1PQ2NwWEc0Z0lIMWNibHh1SUNBdkx5QlZiblZ6ZFdGc0xseHVJQ0J5WlhSMWNtNGdabkp2YlU5aWFtVmpkQ2gwYUdsekxDQmhjbWNwWEc1OVhHNWNibVoxYm1OMGFXOXVJR1p5YjIxT2RXMWlaWElnS0hSb1lYUXNJR3hsYm1kMGFDa2dlMXh1SUNCMGFHRjBJRDBnWVd4c2IyTmhkR1VvZEdoaGRDd2diR1Z1WjNSb0lEd2dNQ0EvSURBZ09pQmphR1ZqYTJWa0tHeGxibWQwYUNrZ2ZDQXdLVnh1SUNCcFppQW9JVUoxWm1abGNpNVVXVkJGUkY5QlVsSkJXVjlUVlZCUVQxSlVLU0I3WEc0Z0lDQWdabTl5SUNoMllYSWdhU0E5SURBN0lHa2dQQ0JzWlc1bmRHZzdJR2tyS3lrZ2UxeHVJQ0FnSUNBZ2RHaGhkRnRwWFNBOUlEQmNiaUFnSUNCOVhHNGdJSDFjYmlBZ2NtVjBkWEp1SUhSb1lYUmNibjFjYmx4dVpuVnVZM1JwYjI0Z1puSnZiVk4wY21sdVp5QW9kR2hoZEN3Z2MzUnlhVzVuTENCbGJtTnZaR2x1WnlrZ2UxeHVJQ0JwWmlBb2RIbHdaVzltSUdWdVkyOWthVzVuSUNFOVBTQW5jM1J5YVc1bkp5QjhmQ0JsYm1OdlpHbHVaeUE5UFQwZ0p5Y3BJR1Z1WTI5a2FXNW5JRDBnSjNWMFpqZ25YRzVjYmlBZ0x5OGdRWE56ZFcxd2RHbHZiam9nWW5sMFpVeGxibWQwYUNncElISmxkSFZ5YmlCMllXeDFaU0JwY3lCaGJIZGhlWE1nUENCclRXRjRUR1Z1WjNSb0xseHVJQ0IyWVhJZ2JHVnVaM1JvSUQwZ1lubDBaVXhsYm1kMGFDaHpkSEpwYm1jc0lHVnVZMjlrYVc1bktTQjhJREJjYmlBZ2RHaGhkQ0E5SUdGc2JHOWpZWFJsS0hSb1lYUXNJR3hsYm1kMGFDbGNibHh1SUNCMGFHRjBMbmR5YVhSbEtITjBjbWx1Wnl3Z1pXNWpiMlJwYm1jcFhHNGdJSEpsZEhWeWJpQjBhR0YwWEc1OVhHNWNibVoxYm1OMGFXOXVJR1p5YjIxUFltcGxZM1FnS0hSb1lYUXNJRzlpYW1WamRDa2dlMXh1SUNCcFppQW9RblZtWm1WeUxtbHpRblZtWm1WeUtHOWlhbVZqZENrcElISmxkSFZ5YmlCbWNtOXRRblZtWm1WeUtIUm9ZWFFzSUc5aWFtVmpkQ2xjYmx4dUlDQnBaaUFvYVhOQmNuSmhlU2h2WW1wbFkzUXBLU0J5WlhSMWNtNGdabkp2YlVGeWNtRjVLSFJvWVhRc0lHOWlhbVZqZENsY2JseHVJQ0JwWmlBb2IySnFaV04wSUQwOUlHNTFiR3dwSUh0Y2JpQWdJQ0IwYUhKdmR5QnVaWGNnVkhsd1pVVnljbTl5S0NkdGRYTjBJSE4wWVhKMElIZHBkR2dnYm5WdFltVnlMQ0JpZFdabVpYSXNJR0Z5Y21GNUlHOXlJSE4wY21sdVp5Y3BYRzRnSUgxY2JseHVJQ0JwWmlBb2RIbHdaVzltSUVGeWNtRjVRblZtWm1WeUlDRTlQU0FuZFc1a1pXWnBibVZrSnlrZ2UxeHVJQ0FnSUdsbUlDaHZZbXBsWTNRdVluVm1abVZ5SUdsdWMzUmhibU5sYjJZZ1FYSnlZWGxDZFdabVpYSXBJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQm1jbTl0Vkhsd1pXUkJjbkpoZVNoMGFHRjBMQ0J2WW1wbFkzUXBYRzRnSUNBZ2ZWeHVJQ0FnSUdsbUlDaHZZbXBsWTNRZ2FXNXpkR0Z1WTJWdlppQkJjbkpoZVVKMVptWmxjaWtnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR1p5YjIxQmNuSmhlVUoxWm1abGNpaDBhR0YwTENCdlltcGxZM1FwWEc0Z0lDQWdmVnh1SUNCOVhHNWNiaUFnYVdZZ0tHOWlhbVZqZEM1c1pXNW5kR2dwSUhKbGRIVnliaUJtY205dFFYSnlZWGxNYVd0bEtIUm9ZWFFzSUc5aWFtVmpkQ2xjYmx4dUlDQnlaWFIxY200Z1puSnZiVXB6YjI1UFltcGxZM1FvZEdoaGRDd2diMkpxWldOMEtWeHVmVnh1WEc1bWRXNWpkR2x2YmlCbWNtOXRRblZtWm1WeUlDaDBhR0YwTENCaWRXWm1aWElwSUh0Y2JpQWdkbUZ5SUd4bGJtZDBhQ0E5SUdOb1pXTnJaV1FvWW5WbVptVnlMbXhsYm1kMGFDa2dmQ0F3WEc0Z0lIUm9ZWFFnUFNCaGJHeHZZMkYwWlNoMGFHRjBMQ0JzWlc1bmRHZ3BYRzRnSUdKMVptWmxjaTVqYjNCNUtIUm9ZWFFzSURBc0lEQXNJR3hsYm1kMGFDbGNiaUFnY21WMGRYSnVJSFJvWVhSY2JuMWNibHh1Wm5WdVkzUnBiMjRnWm5KdmJVRnljbUY1SUNoMGFHRjBMQ0JoY25KaGVTa2dlMXh1SUNCMllYSWdiR1Z1WjNSb0lEMGdZMmhsWTJ0bFpDaGhjbkpoZVM1c1pXNW5kR2dwSUh3Z01GeHVJQ0IwYUdGMElEMGdZV3hzYjJOaGRHVW9kR2hoZEN3Z2JHVnVaM1JvS1Z4dUlDQm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR3hsYm1kMGFEc2dhU0FyUFNBeEtTQjdYRzRnSUNBZ2RHaGhkRnRwWFNBOUlHRnljbUY1VzJsZElDWWdNalUxWEc0Z0lIMWNiaUFnY21WMGRYSnVJSFJvWVhSY2JuMWNibHh1THk4Z1JIVndiR2xqWVhSbElHOW1JR1p5YjIxQmNuSmhlU2dwSUhSdklHdGxaWEFnWm5KdmJVRnljbUY1S0NrZ2JXOXViMjF2Y25Cb2FXTXVYRzVtZFc1amRHbHZiaUJtY205dFZIbHdaV1JCY25KaGVTQW9kR2hoZEN3Z1lYSnlZWGtwSUh0Y2JpQWdkbUZ5SUd4bGJtZDBhQ0E5SUdOb1pXTnJaV1FvWVhKeVlYa3ViR1Z1WjNSb0tTQjhJREJjYmlBZ2RHaGhkQ0E5SUdGc2JHOWpZWFJsS0hSb1lYUXNJR3hsYm1kMGFDbGNiaUFnTHk4Z1ZISjFibU5oZEdsdVp5QjBhR1VnWld4bGJXVnVkSE1nYVhNZ2NISnZZbUZpYkhrZ2JtOTBJSGRvWVhRZ2NHVnZjR3hsSUdWNGNHVmpkQ0JtY205dElIUjVjR1ZrWEc0Z0lDOHZJR0Z5Y21GNWN5QjNhWFJvSUVKWlZFVlRYMUJGVWw5RlRFVk5SVTVVSUQ0Z01TQmlkWFFnYVhRbmN5QmpiMjF3WVhScFlteGxJSGRwZEdnZ2RHaGxJR0psYUdGMmFXOXlYRzRnSUM4dklHOW1JSFJvWlNCdmJHUWdRblZtWm1WeUlHTnZibk4wY25WamRHOXlMbHh1SUNCbWIzSWdLSFpoY2lCcElEMGdNRHNnYVNBOElHeGxibWQwYURzZ2FTQXJQU0F4S1NCN1hHNGdJQ0FnZEdoaGRGdHBYU0E5SUdGeWNtRjVXMmxkSUNZZ01qVTFYRzRnSUgxY2JpQWdjbVYwZFhKdUlIUm9ZWFJjYm4xY2JseHVablZ1WTNScGIyNGdabkp2YlVGeWNtRjVRblZtWm1WeUlDaDBhR0YwTENCaGNuSmhlU2tnZTF4dUlDQnBaaUFvUW5WbVptVnlMbFJaVUVWRVgwRlNVa0ZaWDFOVlVGQlBVbFFwSUh0Y2JpQWdJQ0F2THlCU1pYUjFjbTRnWVc0Z1lYVm5iV1Z1ZEdWa0lHQlZhVzUwT0VGeWNtRjVZQ0JwYm5OMFlXNWpaU3dnWm05eUlHSmxjM1FnY0dWeVptOXliV0Z1WTJWY2JpQWdJQ0JoY25KaGVTNWllWFJsVEdWdVozUm9YRzRnSUNBZ2RHaGhkQ0E5SUVKMVptWmxjaTVmWVhWbmJXVnVkQ2h1WlhjZ1ZXbHVkRGhCY25KaGVTaGhjbkpoZVNrcFhHNGdJSDBnWld4elpTQjdYRzRnSUNBZ0x5OGdSbUZzYkdKaFkyczZJRkpsZEhWeWJpQmhiaUJ2WW1wbFkzUWdhVzV6ZEdGdVkyVWdiMllnZEdobElFSjFabVpsY2lCamJHRnpjMXh1SUNBZ0lIUm9ZWFFnUFNCbWNtOXRWSGx3WldSQmNuSmhlU2gwYUdGMExDQnVaWGNnVldsdWREaEJjbkpoZVNoaGNuSmhlU2twWEc0Z0lIMWNiaUFnY21WMGRYSnVJSFJvWVhSY2JuMWNibHh1Wm5WdVkzUnBiMjRnWm5KdmJVRnljbUY1VEdsclpTQW9kR2hoZEN3Z1lYSnlZWGtwSUh0Y2JpQWdkbUZ5SUd4bGJtZDBhQ0E5SUdOb1pXTnJaV1FvWVhKeVlYa3ViR1Z1WjNSb0tTQjhJREJjYmlBZ2RHaGhkQ0E5SUdGc2JHOWpZWFJsS0hSb1lYUXNJR3hsYm1kMGFDbGNiaUFnWm05eUlDaDJZWElnYVNBOUlEQTdJR2tnUENCc1pXNW5kR2c3SUdrZ0t6MGdNU2tnZTF4dUlDQWdJSFJvWVhSYmFWMGdQU0JoY25KaGVWdHBYU0FtSURJMU5WeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCMGFHRjBYRzU5WEc1Y2JpOHZJRVJsYzJWeWFXRnNhWHBsSUhzZ2RIbHdaVG9nSjBKMVptWmxjaWNzSUdSaGRHRTZJRnN4TERJc015d3VMaTVkSUgwZ2FXNTBieUJoSUVKMVptWmxjaUJ2WW1wbFkzUXVYRzR2THlCU1pYUjFjbTV6SUdFZ2VtVnlieTFzWlc1bmRHZ2dZblZtWm1WeUlHWnZjaUJwYm5CMWRITWdkR2hoZENCa2IyNG5kQ0JqYjI1bWIzSnRJSFJ2SUhSb1pTQnpjR1ZqTGx4dVpuVnVZM1JwYjI0Z1puSnZiVXB6YjI1UFltcGxZM1FnS0hSb1lYUXNJRzlpYW1WamRDa2dlMXh1SUNCMllYSWdZWEp5WVhsY2JpQWdkbUZ5SUd4bGJtZDBhQ0E5SURCY2JseHVJQ0JwWmlBb2IySnFaV04wTG5SNWNHVWdQVDA5SUNkQ2RXWm1aWEluSUNZbUlHbHpRWEp5WVhrb2IySnFaV04wTG1SaGRHRXBLU0I3WEc0Z0lDQWdZWEp5WVhrZ1BTQnZZbXBsWTNRdVpHRjBZVnh1SUNBZ0lHeGxibWQwYUNBOUlHTm9aV05yWldRb1lYSnlZWGt1YkdWdVozUm9LU0I4SURCY2JpQWdmVnh1SUNCMGFHRjBJRDBnWVd4c2IyTmhkR1VvZEdoaGRDd2diR1Z1WjNSb0tWeHVYRzRnSUdadmNpQW9kbUZ5SUdrZ1BTQXdPeUJwSUR3Z2JHVnVaM1JvT3lCcElDczlJREVwSUh0Y2JpQWdJQ0IwYUdGMFcybGRJRDBnWVhKeVlYbGJhVjBnSmlBeU5UVmNiaUFnZlZ4dUlDQnlaWFIxY200Z2RHaGhkRnh1ZlZ4dVhHNXBaaUFvUW5WbVptVnlMbFJaVUVWRVgwRlNVa0ZaWDFOVlVGQlBVbFFwSUh0Y2JpQWdRblZtWm1WeUxuQnliM1J2ZEhsd1pTNWZYM0J5YjNSdlgxOGdQU0JWYVc1ME9FRnljbUY1TG5CeWIzUnZkSGx3WlZ4dUlDQkNkV1ptWlhJdVgxOXdjbTkwYjE5ZklEMGdWV2x1ZERoQmNuSmhlVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmhiR3h2WTJGMFpTQW9kR2hoZEN3Z2JHVnVaM1JvS1NCN1hHNGdJR2xtSUNoQ2RXWm1aWEl1VkZsUVJVUmZRVkpTUVZsZlUxVlFVRTlTVkNrZ2UxeHVJQ0FnSUM4dklGSmxkSFZ5YmlCaGJpQmhkV2R0Wlc1MFpXUWdZRlZwYm5RNFFYSnlZWGxnSUdsdWMzUmhibU5sTENCbWIzSWdZbVZ6ZENCd1pYSm1iM0p0WVc1alpWeHVJQ0FnSUhSb1lYUWdQU0JDZFdabVpYSXVYMkYxWjIxbGJuUW9ibVYzSUZWcGJuUTRRWEp5WVhrb2JHVnVaM1JvS1NsY2JpQWdJQ0IwYUdGMExsOWZjSEp2ZEc5Zlh5QTlJRUoxWm1abGNpNXdjbTkwYjNSNWNHVmNiaUFnZlNCbGJITmxJSHRjYmlBZ0lDQXZMeUJHWVd4c1ltRmphem9nVW1WMGRYSnVJR0Z1SUc5aWFtVmpkQ0JwYm5OMFlXNWpaU0J2WmlCMGFHVWdRblZtWm1WeUlHTnNZWE56WEc0Z0lDQWdkR2hoZEM1c1pXNW5kR2dnUFNCc1pXNW5kR2hjYmlBZ0lDQjBhR0YwTGw5cGMwSjFabVpsY2lBOUlIUnlkV1ZjYmlBZ2ZWeHVYRzRnSUhaaGNpQm1jbTl0VUc5dmJDQTlJR3hsYm1kMGFDQWhQVDBnTUNBbUppQnNaVzVuZEdnZ1BEMGdRblZtWm1WeUxuQnZiMnhUYVhwbElENCtQaUF4WEc0Z0lHbG1JQ2htY205dFVHOXZiQ2tnZEdoaGRDNXdZWEpsYm5RZ1BTQnliMjkwVUdGeVpXNTBYRzVjYmlBZ2NtVjBkWEp1SUhSb1lYUmNibjFjYmx4dVpuVnVZM1JwYjI0Z1kyaGxZMnRsWkNBb2JHVnVaM1JvS1NCN1hHNGdJQzh2SUU1dmRHVTZJR05oYm01dmRDQjFjMlVnWUd4bGJtZDBhQ0E4SUd0TllYaE1aVzVuZEdoZ0lHaGxjbVVnWW1WallYVnpaU0IwYUdGMElHWmhhV3h6SUhkb1pXNWNiaUFnTHk4Z2JHVnVaM1JvSUdseklFNWhUaUFvZDJocFkyZ2dhWE1nYjNSb1pYSjNhWE5sSUdOdlpYSmpaV1FnZEc4Z2VtVnlieTRwWEc0Z0lHbG1JQ2hzWlc1bmRHZ2dQajBnYTAxaGVFeGxibWQwYUNncEtTQjdYRzRnSUNBZ2RHaHliM2NnYm1WM0lGSmhibWRsUlhKeWIzSW9KMEYwZEdWdGNIUWdkRzhnWVd4c2IyTmhkR1VnUW5WbVptVnlJR3hoY21kbGNpQjBhR0Z1SUcxaGVHbHRkVzBnSnlBclhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0ozTnBlbVU2SURCNEp5QXJJR3ROWVhoTVpXNW5kR2dvS1M1MGIxTjBjbWx1WnlneE5pa2dLeUFuSUdKNWRHVnpKeWxjYmlBZ2ZWeHVJQ0J5WlhSMWNtNGdiR1Z1WjNSb0lId2dNRnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQlRiRzkzUW5WbVptVnlJQ2h6ZFdKcVpXTjBMQ0JsYm1OdlpHbHVaeWtnZTF4dUlDQnBaaUFvSVNoMGFHbHpJR2x1YzNSaGJtTmxiMllnVTJ4dmQwSjFabVpsY2lrcElISmxkSFZ5YmlCdVpYY2dVMnh2ZDBKMVptWmxjaWh6ZFdKcVpXTjBMQ0JsYm1OdlpHbHVaeWxjYmx4dUlDQjJZWElnWW5WbUlEMGdibVYzSUVKMVptWmxjaWh6ZFdKcVpXTjBMQ0JsYm1OdlpHbHVaeWxjYmlBZ1pHVnNaWFJsSUdKMVppNXdZWEpsYm5SY2JpQWdjbVYwZFhKdUlHSjFabHh1ZlZ4dVhHNUNkV1ptWlhJdWFYTkNkV1ptWlhJZ1BTQm1kVzVqZEdsdmJpQnBjMEoxWm1abGNpQW9ZaWtnZTF4dUlDQnlaWFIxY200Z0lTRW9ZaUFoUFNCdWRXeHNJQ1ltSUdJdVgybHpRblZtWm1WeUtWeHVmVnh1WEc1Q2RXWm1aWEl1WTI5dGNHRnlaU0E5SUdaMWJtTjBhVzl1SUdOdmJYQmhjbVVnS0dFc0lHSXBJSHRjYmlBZ2FXWWdLQ0ZDZFdabVpYSXVhWE5DZFdabVpYSW9ZU2tnZkh3Z0lVSjFabVpsY2k1cGMwSjFabVpsY2loaUtTa2dlMXh1SUNBZ0lIUm9jbTkzSUc1bGR5QlVlWEJsUlhKeWIzSW9KMEZ5WjNWdFpXNTBjeUJ0ZFhOMElHSmxJRUoxWm1abGNuTW5LVnh1SUNCOVhHNWNiaUFnYVdZZ0tHRWdQVDA5SUdJcElISmxkSFZ5YmlBd1hHNWNiaUFnZG1GeUlIZ2dQU0JoTG14bGJtZDBhRnh1SUNCMllYSWdlU0E5SUdJdWJHVnVaM1JvWEc1Y2JpQWdkbUZ5SUdrZ1BTQXdYRzRnSUhaaGNpQnNaVzRnUFNCTllYUm9MbTFwYmloNExDQjVLVnh1SUNCM2FHbHNaU0FvYVNBOElHeGxiaWtnZTF4dUlDQWdJR2xtSUNoaFcybGRJQ0U5UFNCaVcybGRLU0JpY21WaGExeHVYRzRnSUNBZ0t5dHBYRzRnSUgxY2JseHVJQ0JwWmlBb2FTQWhQVDBnYkdWdUtTQjdYRzRnSUNBZ2VDQTlJR0ZiYVYxY2JpQWdJQ0I1SUQwZ1lsdHBYVnh1SUNCOVhHNWNiaUFnYVdZZ0tIZ2dQQ0I1S1NCeVpYUjFjbTRnTFRGY2JpQWdhV1lnS0hrZ1BDQjRLU0J5WlhSMWNtNGdNVnh1SUNCeVpYUjFjbTRnTUZ4dWZWeHVYRzVDZFdabVpYSXVhWE5GYm1OdlpHbHVaeUE5SUdaMWJtTjBhVzl1SUdselJXNWpiMlJwYm1jZ0tHVnVZMjlrYVc1bktTQjdYRzRnSUhOM2FYUmphQ0FvVTNSeWFXNW5LR1Z1WTI5a2FXNW5LUzUwYjB4dmQyVnlRMkZ6WlNncEtTQjdYRzRnSUNBZ1kyRnpaU0FuYUdWNEp6cGNiaUFnSUNCallYTmxJQ2QxZEdZNEp6cGNiaUFnSUNCallYTmxJQ2QxZEdZdE9DYzZYRzRnSUNBZ1kyRnpaU0FuWVhOamFXa25PbHh1SUNBZ0lHTmhjMlVnSjJKcGJtRnllU2M2WEc0Z0lDQWdZMkZ6WlNBblltRnpaVFkwSnpwY2JpQWdJQ0JqWVhObElDZHlZWGNuT2x4dUlDQWdJR05oYzJVZ0ozVmpjekluT2x4dUlDQWdJR05oYzJVZ0ozVmpjeTB5SnpwY2JpQWdJQ0JqWVhObElDZDFkR1l4Tm14bEp6cGNiaUFnSUNCallYTmxJQ2QxZEdZdE1UWnNaU2M2WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlZ4dUlDQWdJR1JsWm1GMWJIUTZYRzRnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlZjYmlBZ2ZWeHVmVnh1WEc1Q2RXWm1aWEl1WTI5dVkyRjBJRDBnWm5WdVkzUnBiMjRnWTI5dVkyRjBJQ2hzYVhOMExDQnNaVzVuZEdncElIdGNiaUFnYVdZZ0tDRnBjMEZ5Y21GNUtHeHBjM1FwS1NCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtDZHNhWE4wSUdGeVozVnRaVzUwSUcxMWMzUWdZbVVnWVc0Z1FYSnlZWGtnYjJZZ1FuVm1abVZ5Y3k0bktWeHVYRzRnSUdsbUlDaHNhWE4wTG14bGJtZDBhQ0E5UFQwZ01Da2dlMXh1SUNBZ0lISmxkSFZ5YmlCdVpYY2dRblZtWm1WeUtEQXBYRzRnSUgxY2JseHVJQ0IyWVhJZ2FWeHVJQ0JwWmlBb2JHVnVaM1JvSUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQnNaVzVuZEdnZ1BTQXdYRzRnSUNBZ1ptOXlJQ2hwSUQwZ01Ec2dhU0E4SUd4cGMzUXViR1Z1WjNSb095QnBLeXNwSUh0Y2JpQWdJQ0FnSUd4bGJtZDBhQ0FyUFNCc2FYTjBXMmxkTG14bGJtZDBhRnh1SUNBZ0lIMWNiaUFnZlZ4dVhHNGdJSFpoY2lCaWRXWWdQU0J1WlhjZ1FuVm1abVZ5S0d4bGJtZDBhQ2xjYmlBZ2RtRnlJSEJ2Y3lBOUlEQmNiaUFnWm05eUlDaHBJRDBnTURzZ2FTQThJR3hwYzNRdWJHVnVaM1JvT3lCcEt5c3BJSHRjYmlBZ0lDQjJZWElnYVhSbGJTQTlJR3hwYzNSYmFWMWNiaUFnSUNCcGRHVnRMbU52Y0hrb1luVm1MQ0J3YjNNcFhHNGdJQ0FnY0c5eklDczlJR2wwWlcwdWJHVnVaM1JvWEc0Z0lIMWNiaUFnY21WMGRYSnVJR0oxWmx4dWZWeHVYRzVtZFc1amRHbHZiaUJpZVhSbFRHVnVaM1JvSUNoemRISnBibWNzSUdWdVkyOWthVzVuS1NCN1hHNGdJR2xtSUNoMGVYQmxiMllnYzNSeWFXNW5JQ0U5UFNBbmMzUnlhVzVuSnlrZ2MzUnlhVzVuSUQwZ0p5Y2dLeUJ6ZEhKcGJtZGNibHh1SUNCMllYSWdiR1Z1SUQwZ2MzUnlhVzVuTG14bGJtZDBhRnh1SUNCcFppQW9iR1Z1SUQwOVBTQXdLU0J5WlhSMWNtNGdNRnh1WEc0Z0lDOHZJRlZ6WlNCaElHWnZjaUJzYjI5d0lIUnZJR0YyYjJsa0lISmxZM1Z5YzJsdmJseHVJQ0IyWVhJZ2JHOTNaWEpsWkVOaGMyVWdQU0JtWVd4elpWeHVJQ0JtYjNJZ0tEczdLU0I3WEc0Z0lDQWdjM2RwZEdOb0lDaGxibU52WkdsdVp5a2dlMXh1SUNBZ0lDQWdZMkZ6WlNBbllYTmphV2tuT2x4dUlDQWdJQ0FnWTJGelpTQW5ZbWx1WVhKNUp6cGNiaUFnSUNBZ0lDOHZJRVJsY0hKbFkyRjBaV1JjYmlBZ0lDQWdJR05oYzJVZ0ozSmhkeWM2WEc0Z0lDQWdJQ0JqWVhObElDZHlZWGR6SnpwY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUd4bGJseHVJQ0FnSUNBZ1kyRnpaU0FuZFhSbU9DYzZYRzRnSUNBZ0lDQmpZWE5sSUNkMWRHWXRPQ2M2WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIxZEdZNFZHOUNlWFJsY3loemRISnBibWNwTG14bGJtZDBhRnh1SUNBZ0lDQWdZMkZ6WlNBbmRXTnpNaWM2WEc0Z0lDQWdJQ0JqWVhObElDZDFZM010TWljNlhHNGdJQ0FnSUNCallYTmxJQ2QxZEdZeE5teGxKenBjYmlBZ0lDQWdJR05oYzJVZ0ozVjBaaTB4Tm14bEp6cGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHeGxiaUFxSURKY2JpQWdJQ0FnSUdOaGMyVWdKMmhsZUNjNlhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCc1pXNGdQajQrSURGY2JpQWdJQ0FnSUdOaGMyVWdKMkpoYzJVMk5DYzZYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmlZWE5sTmpSVWIwSjVkR1Z6S0hOMGNtbHVaeWt1YkdWdVozUm9YRzRnSUNBZ0lDQmtaV1poZFd4ME9seHVJQ0FnSUNBZ0lDQnBaaUFvYkc5M1pYSmxaRU5oYzJVcElISmxkSFZ5YmlCMWRHWTRWRzlDZVhSbGN5aHpkSEpwYm1jcExteGxibWQwYUNBdkx5QmhjM04xYldVZ2RYUm1PRnh1SUNBZ0lDQWdJQ0JsYm1OdlpHbHVaeUE5SUNnbkp5QXJJR1Z1WTI5a2FXNW5LUzUwYjB4dmQyVnlRMkZ6WlNncFhHNGdJQ0FnSUNBZ0lHeHZkMlZ5WldSRFlYTmxJRDBnZEhKMVpWeHVJQ0FnSUgxY2JpQWdmVnh1ZlZ4dVFuVm1abVZ5TG1KNWRHVk1aVzVuZEdnZ1BTQmllWFJsVEdWdVozUm9YRzVjYmk4dklIQnlaUzF6WlhRZ1ptOXlJSFpoYkhWbGN5QjBhR0YwSUcxaGVTQmxlR2x6ZENCcGJpQjBhR1VnWm5WMGRYSmxYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbXhsYm1kMGFDQTlJSFZ1WkdWbWFXNWxaRnh1UW5WbVptVnlMbkJ5YjNSdmRIbHdaUzV3WVhKbGJuUWdQU0IxYm1SbFptbHVaV1JjYmx4dVpuVnVZM1JwYjI0Z2MyeHZkMVJ2VTNSeWFXNW5JQ2hsYm1OdlpHbHVaeXdnYzNSaGNuUXNJR1Z1WkNrZ2UxeHVJQ0IyWVhJZ2JHOTNaWEpsWkVOaGMyVWdQU0JtWVd4elpWeHVYRzRnSUhOMFlYSjBJRDBnYzNSaGNuUWdmQ0F3WEc0Z0lHVnVaQ0E5SUdWdVpDQTlQVDBnZFc1a1pXWnBibVZrSUh4OElHVnVaQ0E5UFQwZ1NXNW1hVzVwZEhrZ1B5QjBhR2x6TG14bGJtZDBhQ0E2SUdWdVpDQjhJREJjYmx4dUlDQnBaaUFvSVdWdVkyOWthVzVuS1NCbGJtTnZaR2x1WnlBOUlDZDFkR1k0SjF4dUlDQnBaaUFvYzNSaGNuUWdQQ0F3S1NCemRHRnlkQ0E5SURCY2JpQWdhV1lnS0dWdVpDQStJSFJvYVhNdWJHVnVaM1JvS1NCbGJtUWdQU0IwYUdsekxteGxibWQwYUZ4dUlDQnBaaUFvWlc1a0lEdzlJSE4wWVhKMEtTQnlaWFIxY200Z0p5ZGNibHh1SUNCM2FHbHNaU0FvZEhKMVpTa2dlMXh1SUNBZ0lITjNhWFJqYUNBb1pXNWpiMlJwYm1jcElIdGNiaUFnSUNBZ0lHTmhjMlVnSjJobGVDYzZYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQm9aWGhUYkdsalpTaDBhR2x6TENCemRHRnlkQ3dnWlc1a0tWeHVYRzRnSUNBZ0lDQmpZWE5sSUNkMWRHWTRKenBjYmlBZ0lDQWdJR05oYzJVZ0ozVjBaaTA0SnpwY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWMFpqaFRiR2xqWlNoMGFHbHpMQ0J6ZEdGeWRDd2daVzVrS1Z4dVhHNGdJQ0FnSUNCallYTmxJQ2RoYzJOcGFTYzZYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmhjMk5wYVZOc2FXTmxLSFJvYVhNc0lITjBZWEowTENCbGJtUXBYRzVjYmlBZ0lDQWdJR05oYzJVZ0oySnBibUZ5ZVNjNlhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCaWFXNWhjbmxUYkdsalpTaDBhR2x6TENCemRHRnlkQ3dnWlc1a0tWeHVYRzRnSUNBZ0lDQmpZWE5sSUNkaVlYTmxOalFuT2x4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWW1GelpUWTBVMnhwWTJVb2RHaHBjeXdnYzNSaGNuUXNJR1Z1WkNsY2JseHVJQ0FnSUNBZ1kyRnpaU0FuZFdOek1pYzZYRzRnSUNBZ0lDQmpZWE5sSUNkMVkzTXRNaWM2WEc0Z0lDQWdJQ0JqWVhObElDZDFkR1l4Tm14bEp6cGNiaUFnSUNBZ0lHTmhjMlVnSjNWMFppMHhObXhsSnpwY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWMFpqRTJiR1ZUYkdsalpTaDBhR2x6TENCemRHRnlkQ3dnWlc1a0tWeHVYRzRnSUNBZ0lDQmtaV1poZFd4ME9seHVJQ0FnSUNBZ0lDQnBaaUFvYkc5M1pYSmxaRU5oYzJVcElIUm9jbTkzSUc1bGR5QlVlWEJsUlhKeWIzSW9KMVZ1YTI1dmQyNGdaVzVqYjJScGJtYzZJQ2NnS3lCbGJtTnZaR2x1WnlsY2JpQWdJQ0FnSUNBZ1pXNWpiMlJwYm1jZ1BTQW9aVzVqYjJScGJtY2dLeUFuSnlrdWRHOU1iM2RsY2tOaGMyVW9LVnh1SUNBZ0lDQWdJQ0JzYjNkbGNtVmtRMkZ6WlNBOUlIUnlkV1ZjYmlBZ0lDQjlYRzRnSUgxY2JuMWNibHh1UW5WbVptVnlMbkJ5YjNSdmRIbHdaUzUwYjFOMGNtbHVaeUE5SUdaMWJtTjBhVzl1SUhSdlUzUnlhVzVuSUNncElIdGNiaUFnZG1GeUlHeGxibWQwYUNBOUlIUm9hWE11YkdWdVozUm9JSHdnTUZ4dUlDQnBaaUFvYkdWdVozUm9JRDA5UFNBd0tTQnlaWFIxY200Z0p5ZGNiaUFnYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BUMDlJREFwSUhKbGRIVnliaUIxZEdZNFUyeHBZMlVvZEdocGN5d2dNQ3dnYkdWdVozUm9LVnh1SUNCeVpYUjFjbTRnYzJ4dmQxUnZVM1J5YVc1bkxtRndjR3g1S0hSb2FYTXNJR0Z5WjNWdFpXNTBjeWxjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNWxjWFZoYkhNZ1BTQm1kVzVqZEdsdmJpQmxjWFZoYkhNZ0tHSXBJSHRjYmlBZ2FXWWdLQ0ZDZFdabVpYSXVhWE5DZFdabVpYSW9ZaWtwSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb0owRnlaM1Z0Wlc1MElHMTFjM1FnWW1VZ1lTQkNkV1ptWlhJbktWeHVJQ0JwWmlBb2RHaHBjeUE5UFQwZ1lpa2djbVYwZFhKdUlIUnlkV1ZjYmlBZ2NtVjBkWEp1SUVKMVptWmxjaTVqYjIxd1lYSmxLSFJvYVhNc0lHSXBJRDA5UFNBd1hHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1YVc1emNHVmpkQ0E5SUdaMWJtTjBhVzl1SUdsdWMzQmxZM1FnS0NrZ2UxeHVJQ0IyWVhJZ2MzUnlJRDBnSnlkY2JpQWdkbUZ5SUcxaGVDQTlJR1Y0Y0c5eWRITXVTVTVUVUVWRFZGOU5RVmhmUWxsVVJWTmNiaUFnYVdZZ0tIUm9hWE11YkdWdVozUm9JRDRnTUNrZ2UxeHVJQ0FnSUhOMGNpQTlJSFJvYVhNdWRHOVRkSEpwYm1jb0oyaGxlQ2NzSURBc0lHMWhlQ2t1YldGMFkyZ29MeTU3TW4wdlp5a3VhbTlwYmlnbklDY3BYRzRnSUNBZ2FXWWdLSFJvYVhNdWJHVnVaM1JvSUQ0Z2JXRjRLU0J6ZEhJZ0t6MGdKeUF1TGk0Z0oxeHVJQ0I5WEc0Z0lISmxkSFZ5YmlBblBFSjFabVpsY2lBbklDc2djM1J5SUNzZ0p6NG5YRzU5WEc1Y2JrSjFabVpsY2k1d2NtOTBiM1I1Y0dVdVkyOXRjR0Z5WlNBOUlHWjFibU4wYVc5dUlHTnZiWEJoY21VZ0tHSXBJSHRjYmlBZ2FXWWdLQ0ZDZFdabVpYSXVhWE5DZFdabVpYSW9ZaWtwSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb0owRnlaM1Z0Wlc1MElHMTFjM1FnWW1VZ1lTQkNkV1ptWlhJbktWeHVJQ0JwWmlBb2RHaHBjeUE5UFQwZ1lpa2djbVYwZFhKdUlEQmNiaUFnY21WMGRYSnVJRUoxWm1abGNpNWpiMjF3WVhKbEtIUm9hWE1zSUdJcFhHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1YVc1a1pYaFBaaUE5SUdaMWJtTjBhVzl1SUdsdVpHVjRUMllnS0haaGJDd2dZbmwwWlU5bVpuTmxkQ2tnZTF4dUlDQnBaaUFvWW5sMFpVOW1abk5sZENBK0lEQjROMlptWm1abVptWXBJR0o1ZEdWUFptWnpaWFFnUFNBd2VEZG1abVptWm1abVhHNGdJR1ZzYzJVZ2FXWWdLR0o1ZEdWUFptWnpaWFFnUENBdE1IZzRNREF3TURBd01Da2dZbmwwWlU5bVpuTmxkQ0E5SUMwd2VEZ3dNREF3TURBd1hHNGdJR0o1ZEdWUFptWnpaWFFnUGo0OUlEQmNibHh1SUNCcFppQW9kR2hwY3k1c1pXNW5kR2dnUFQwOUlEQXBJSEpsZEhWeWJpQXRNVnh1SUNCcFppQW9ZbmwwWlU5bVpuTmxkQ0ErUFNCMGFHbHpMbXhsYm1kMGFDa2djbVYwZFhKdUlDMHhYRzVjYmlBZ0x5OGdUbVZuWVhScGRtVWdiMlptYzJWMGN5QnpkR0Z5ZENCbWNtOXRJSFJvWlNCbGJtUWdiMllnZEdobElHSjFabVpsY2x4dUlDQnBaaUFvWW5sMFpVOW1abk5sZENBOElEQXBJR0o1ZEdWUFptWnpaWFFnUFNCTllYUm9MbTFoZUNoMGFHbHpMbXhsYm1kMGFDQXJJR0o1ZEdWUFptWnpaWFFzSURBcFhHNWNiaUFnYVdZZ0tIUjVjR1Z2WmlCMllXd2dQVDA5SUNkemRISnBibWNuS1NCN1hHNGdJQ0FnYVdZZ0tIWmhiQzVzWlc1bmRHZ2dQVDA5SURBcElISmxkSFZ5YmlBdE1TQXZMeUJ6Y0dWamFXRnNJR05oYzJVNklHeHZiMnRwYm1jZ1ptOXlJR1Z0Y0hSNUlITjBjbWx1WnlCaGJIZGhlWE1nWm1GcGJITmNiaUFnSUNCeVpYUjFjbTRnVTNSeWFXNW5MbkJ5YjNSdmRIbHdaUzVwYm1SbGVFOW1MbU5oYkd3b2RHaHBjeXdnZG1Gc0xDQmllWFJsVDJabWMyVjBLVnh1SUNCOVhHNGdJR2xtSUNoQ2RXWm1aWEl1YVhOQ2RXWm1aWElvZG1Gc0tTa2dlMXh1SUNBZ0lISmxkSFZ5YmlCaGNuSmhlVWx1WkdWNFQyWW9kR2hwY3l3Z2RtRnNMQ0JpZVhSbFQyWm1jMlYwS1Z4dUlDQjlYRzRnSUdsbUlDaDBlWEJsYjJZZ2RtRnNJRDA5UFNBbmJuVnRZbVZ5SnlrZ2UxeHVJQ0FnSUdsbUlDaENkV1ptWlhJdVZGbFFSVVJmUVZKU1FWbGZVMVZRVUU5U1ZDQW1KaUJWYVc1ME9FRnljbUY1TG5CeWIzUnZkSGx3WlM1cGJtUmxlRTltSUQwOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdWV2x1ZERoQmNuSmhlUzV3Y205MGIzUjVjR1V1YVc1a1pYaFBaaTVqWVd4c0tIUm9hWE1zSUhaaGJDd2dZbmwwWlU5bVpuTmxkQ2xjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUdGeWNtRjVTVzVrWlhoUFppaDBhR2x6TENCYklIWmhiQ0JkTENCaWVYUmxUMlptYzJWMEtWeHVJQ0I5WEc1Y2JpQWdablZ1WTNScGIyNGdZWEp5WVhsSmJtUmxlRTltSUNoaGNuSXNJSFpoYkN3Z1lubDBaVTltWm5ObGRDa2dlMXh1SUNBZ0lIWmhjaUJtYjNWdVpFbHVaR1Y0SUQwZ0xURmNiaUFnSUNCbWIzSWdLSFpoY2lCcElEMGdNRHNnWW5sMFpVOW1abk5sZENBcklHa2dQQ0JoY25JdWJHVnVaM1JvT3lCcEt5c3BJSHRjYmlBZ0lDQWdJR2xtSUNoaGNuSmJZbmwwWlU5bVpuTmxkQ0FySUdsZElEMDlQU0IyWVd4YlptOTFibVJKYm1SbGVDQTlQVDBnTFRFZ1B5QXdJRG9nYVNBdElHWnZkVzVrU1c1a1pYaGRLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaG1iM1Z1WkVsdVpHVjRJRDA5UFNBdE1Ta2dabTkxYm1SSmJtUmxlQ0E5SUdsY2JpQWdJQ0FnSUNBZ2FXWWdLR2tnTFNCbWIzVnVaRWx1WkdWNElDc2dNU0E5UFQwZ2RtRnNMbXhsYm1kMGFDa2djbVYwZFhKdUlHSjVkR1ZQWm1aelpYUWdLeUJtYjNWdVpFbHVaR1Y0WEc0Z0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0JtYjNWdVpFbHVaR1Y0SUQwZ0xURmNiaUFnSUNBZ0lIMWNiaUFnSUNCOVhHNGdJQ0FnY21WMGRYSnVJQzB4WEc0Z0lIMWNibHh1SUNCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtDZDJZV3dnYlhWemRDQmlaU0J6ZEhKcGJtY3NJRzUxYldKbGNpQnZjaUJDZFdabVpYSW5LVnh1ZlZ4dVhHNHZMeUJnWjJWMFlDQnBjeUJrWlhCeVpXTmhkR1ZrWEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG1kbGRDQTlJR1oxYm1OMGFXOXVJR2RsZENBb2IyWm1jMlYwS1NCN1hHNGdJR052Ym5OdmJHVXViRzluS0NjdVoyVjBLQ2tnYVhNZ1pHVndjbVZqWVhSbFpDNGdRV05qWlhOeklIVnphVzVuSUdGeWNtRjVJR2x1WkdWNFpYTWdhVzV6ZEdWaFpDNG5LVnh1SUNCeVpYUjFjbTRnZEdocGN5NXlaV0ZrVlVsdWREZ29iMlptYzJWMEtWeHVmVnh1WEc0dkx5QmdjMlYwWUNCcGN5QmtaWEJ5WldOaGRHVmtYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbk5sZENBOUlHWjFibU4wYVc5dUlITmxkQ0FvZGl3Z2IyWm1jMlYwS1NCN1hHNGdJR052Ym5OdmJHVXViRzluS0NjdWMyVjBLQ2tnYVhNZ1pHVndjbVZqWVhSbFpDNGdRV05qWlhOeklIVnphVzVuSUdGeWNtRjVJR2x1WkdWNFpYTWdhVzV6ZEdWaFpDNG5LVnh1SUNCeVpYUjFjbTRnZEdocGN5NTNjbWwwWlZWSmJuUTRLSFlzSUc5bVpuTmxkQ2xjYm4xY2JseHVablZ1WTNScGIyNGdhR1Y0VjNKcGRHVWdLR0oxWml3Z2MzUnlhVzVuTENCdlptWnpaWFFzSUd4bGJtZDBhQ2tnZTF4dUlDQnZabVp6WlhRZ1BTQk9kVzFpWlhJb2IyWm1jMlYwS1NCOGZDQXdYRzRnSUhaaGNpQnlaVzFoYVc1cGJtY2dQU0JpZFdZdWJHVnVaM1JvSUMwZ2IyWm1jMlYwWEc0Z0lHbG1JQ2doYkdWdVozUm9LU0I3WEc0Z0lDQWdiR1Z1WjNSb0lEMGdjbVZ0WVdsdWFXNW5YRzRnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdiR1Z1WjNSb0lEMGdUblZ0WW1WeUtHeGxibWQwYUNsY2JpQWdJQ0JwWmlBb2JHVnVaM1JvSUQ0Z2NtVnRZV2x1YVc1bktTQjdYRzRnSUNBZ0lDQnNaVzVuZEdnZ1BTQnlaVzFoYVc1cGJtZGNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQXZMeUJ0ZFhOMElHSmxJR0Z1SUdWMlpXNGdiblZ0WW1WeUlHOW1JR1JwWjJsMGMxeHVJQ0IyWVhJZ2MzUnlUR1Z1SUQwZ2MzUnlhVzVuTG14bGJtZDBhRnh1SUNCcFppQW9jM1J5VEdWdUlDVWdNaUFoUFQwZ01Da2dkR2h5YjNjZ2JtVjNJRVZ5Y205eUtDZEpiblpoYkdsa0lHaGxlQ0J6ZEhKcGJtY25LVnh1WEc0Z0lHbG1JQ2hzWlc1bmRHZ2dQaUJ6ZEhKTVpXNGdMeUF5S1NCN1hHNGdJQ0FnYkdWdVozUm9JRDBnYzNSeVRHVnVJQzhnTWx4dUlDQjlYRzRnSUdadmNpQW9kbUZ5SUdrZ1BTQXdPeUJwSUR3Z2JHVnVaM1JvT3lCcEt5c3BJSHRjYmlBZ0lDQjJZWElnY0dGeWMyVmtJRDBnY0dGeWMyVkpiblFvYzNSeWFXNW5Mbk4xWW5OMGNpaHBJQ29nTWl3Z01pa3NJREUyS1Z4dUlDQWdJR2xtSUNocGMwNWhUaWh3WVhKelpXUXBLU0IwYUhKdmR5QnVaWGNnUlhKeWIzSW9KMGx1ZG1Gc2FXUWdhR1Y0SUhOMGNtbHVaeWNwWEc0Z0lDQWdZblZtVzI5bVpuTmxkQ0FySUdsZElEMGdjR0Z5YzJWa1hHNGdJSDFjYmlBZ2NtVjBkWEp1SUdsY2JuMWNibHh1Wm5WdVkzUnBiMjRnZFhSbU9GZHlhWFJsSUNoaWRXWXNJSE4wY21sdVp5d2diMlptYzJWMExDQnNaVzVuZEdncElIdGNiaUFnY21WMGRYSnVJR0pzYVhSQ2RXWm1aWElvZFhSbU9GUnZRbmwwWlhNb2MzUnlhVzVuTENCaWRXWXViR1Z1WjNSb0lDMGdiMlptYzJWMEtTd2dZblZtTENCdlptWnpaWFFzSUd4bGJtZDBhQ2xjYm4xY2JseHVablZ1WTNScGIyNGdZWE5qYVdsWGNtbDBaU0FvWW5WbUxDQnpkSEpwYm1jc0lHOW1abk5sZEN3Z2JHVnVaM1JvS1NCN1hHNGdJSEpsZEhWeWJpQmliR2wwUW5WbVptVnlLR0Z6WTJscFZHOUNlWFJsY3loemRISnBibWNwTENCaWRXWXNJRzltWm5ObGRDd2diR1Z1WjNSb0tWeHVmVnh1WEc1bWRXNWpkR2x2YmlCaWFXNWhjbmxYY21sMFpTQW9ZblZtTENCemRISnBibWNzSUc5bVpuTmxkQ3dnYkdWdVozUm9LU0I3WEc0Z0lISmxkSFZ5YmlCaGMyTnBhVmR5YVhSbEtHSjFaaXdnYzNSeWFXNW5MQ0J2Wm1aelpYUXNJR3hsYm1kMGFDbGNibjFjYmx4dVpuVnVZM1JwYjI0Z1ltRnpaVFkwVjNKcGRHVWdLR0oxWml3Z2MzUnlhVzVuTENCdlptWnpaWFFzSUd4bGJtZDBhQ2tnZTF4dUlDQnlaWFIxY200Z1lteHBkRUoxWm1abGNpaGlZWE5sTmpSVWIwSjVkR1Z6S0hOMGNtbHVaeWtzSUdKMVppd2diMlptYzJWMExDQnNaVzVuZEdncFhHNTlYRzVjYm1aMWJtTjBhVzl1SUhWamN6SlhjbWwwWlNBb1luVm1MQ0J6ZEhKcGJtY3NJRzltWm5ObGRDd2diR1Z1WjNSb0tTQjdYRzRnSUhKbGRIVnliaUJpYkdsMFFuVm1abVZ5S0hWMFpqRTJiR1ZVYjBKNWRHVnpLSE4wY21sdVp5d2dZblZtTG14bGJtZDBhQ0F0SUc5bVpuTmxkQ2tzSUdKMVppd2diMlptYzJWMExDQnNaVzVuZEdncFhHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1ZDNKcGRHVWdQU0JtZFc1amRHbHZiaUIzY21sMFpTQW9jM1J5YVc1bkxDQnZabVp6WlhRc0lHeGxibWQwYUN3Z1pXNWpiMlJwYm1jcElIdGNiaUFnTHk4Z1FuVm1abVZ5STNkeWFYUmxLSE4wY21sdVp5bGNiaUFnYVdZZ0tHOW1abk5sZENBOVBUMGdkVzVrWldacGJtVmtLU0I3WEc0Z0lDQWdaVzVqYjJScGJtY2dQU0FuZFhSbU9DZGNiaUFnSUNCc1pXNW5kR2dnUFNCMGFHbHpMbXhsYm1kMGFGeHVJQ0FnSUc5bVpuTmxkQ0E5SURCY2JpQWdMeThnUW5WbVptVnlJM2R5YVhSbEtITjBjbWx1Wnl3Z1pXNWpiMlJwYm1jcFhHNGdJSDBnWld4elpTQnBaaUFvYkdWdVozUm9JRDA5UFNCMWJtUmxabWx1WldRZ0ppWWdkSGx3Wlc5bUlHOW1abk5sZENBOVBUMGdKM04wY21sdVp5Y3BJSHRjYmlBZ0lDQmxibU52WkdsdVp5QTlJRzltWm5ObGRGeHVJQ0FnSUd4bGJtZDBhQ0E5SUhSb2FYTXViR1Z1WjNSb1hHNGdJQ0FnYjJabWMyVjBJRDBnTUZ4dUlDQXZMeUJDZFdabVpYSWpkM0pwZEdVb2MzUnlhVzVuTENCdlptWnpaWFJiTENCc1pXNW5kR2hkV3l3Z1pXNWpiMlJwYm1kZEtWeHVJQ0I5SUdWc2MyVWdhV1lnS0dselJtbHVhWFJsS0c5bVpuTmxkQ2twSUh0Y2JpQWdJQ0J2Wm1aelpYUWdQU0J2Wm1aelpYUWdmQ0F3WEc0Z0lDQWdhV1lnS0dselJtbHVhWFJsS0d4bGJtZDBhQ2twSUh0Y2JpQWdJQ0FnSUd4bGJtZDBhQ0E5SUd4bGJtZDBhQ0I4SURCY2JpQWdJQ0FnSUdsbUlDaGxibU52WkdsdVp5QTlQVDBnZFc1a1pXWnBibVZrS1NCbGJtTnZaR2x1WnlBOUlDZDFkR1k0SjF4dUlDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQmxibU52WkdsdVp5QTlJR3hsYm1kMGFGeHVJQ0FnSUNBZ2JHVnVaM1JvSUQwZ2RXNWtaV1pwYm1Wa1hHNGdJQ0FnZlZ4dUlDQXZMeUJzWldkaFkza2dkM0pwZEdVb2MzUnlhVzVuTENCbGJtTnZaR2x1Wnl3Z2IyWm1jMlYwTENCc1pXNW5kR2dwSUMwZ2NtVnRiM1psSUdsdUlIWXdMakV6WEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnZG1GeUlITjNZWEFnUFNCbGJtTnZaR2x1WjF4dUlDQWdJR1Z1WTI5a2FXNW5JRDBnYjJabWMyVjBYRzRnSUNBZ2IyWm1jMlYwSUQwZ2JHVnVaM1JvSUh3Z01GeHVJQ0FnSUd4bGJtZDBhQ0E5SUhOM1lYQmNiaUFnZlZ4dVhHNGdJSFpoY2lCeVpXMWhhVzVwYm1jZ1BTQjBhR2x6TG14bGJtZDBhQ0F0SUc5bVpuTmxkRnh1SUNCcFppQW9iR1Z1WjNSb0lEMDlQU0IxYm1SbFptbHVaV1FnZkh3Z2JHVnVaM1JvSUQ0Z2NtVnRZV2x1YVc1bktTQnNaVzVuZEdnZ1BTQnlaVzFoYVc1cGJtZGNibHh1SUNCcFppQW9LSE4wY21sdVp5NXNaVzVuZEdnZ1BpQXdJQ1ltSUNoc1pXNW5kR2dnUENBd0lIeDhJRzltWm5ObGRDQThJREFwS1NCOGZDQnZabVp6WlhRZ1BpQjBhR2x6TG14bGJtZDBhQ2tnZTF4dUlDQWdJSFJvY205M0lHNWxkeUJTWVc1blpVVnljbTl5S0NkaGRIUmxiWEIwSUhSdklIZHlhWFJsSUc5MWRITnBaR1VnWW5WbVptVnlJR0p2ZFc1a2N5Y3BYRzRnSUgxY2JseHVJQ0JwWmlBb0lXVnVZMjlrYVc1bktTQmxibU52WkdsdVp5QTlJQ2QxZEdZNEoxeHVYRzRnSUhaaGNpQnNiM2RsY21Wa1EyRnpaU0E5SUdaaGJITmxYRzRnSUdadmNpQW9PenNwSUh0Y2JpQWdJQ0J6ZDJsMFkyZ2dLR1Z1WTI5a2FXNW5LU0I3WEc0Z0lDQWdJQ0JqWVhObElDZG9aWGduT2x4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYUdWNFYzSnBkR1VvZEdocGN5d2djM1J5YVc1bkxDQnZabVp6WlhRc0lHeGxibWQwYUNsY2JseHVJQ0FnSUNBZ1kyRnpaU0FuZFhSbU9DYzZYRzRnSUNBZ0lDQmpZWE5sSUNkMWRHWXRPQ2M2WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIxZEdZNFYzSnBkR1VvZEdocGN5d2djM1J5YVc1bkxDQnZabVp6WlhRc0lHeGxibWQwYUNsY2JseHVJQ0FnSUNBZ1kyRnpaU0FuWVhOamFXa25PbHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdZWE5qYVdsWGNtbDBaU2gwYUdsekxDQnpkSEpwYm1jc0lHOW1abk5sZEN3Z2JHVnVaM1JvS1Z4dVhHNGdJQ0FnSUNCallYTmxJQ2RpYVc1aGNua25PbHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdZbWx1WVhKNVYzSnBkR1VvZEdocGN5d2djM1J5YVc1bkxDQnZabVp6WlhRc0lHeGxibWQwYUNsY2JseHVJQ0FnSUNBZ1kyRnpaU0FuWW1GelpUWTBKenBjYmlBZ0lDQWdJQ0FnTHk4Z1YyRnlibWx1WnpvZ2JXRjRUR1Z1WjNSb0lHNXZkQ0IwWVd0bGJpQnBiblJ2SUdGalkyOTFiblFnYVc0Z1ltRnpaVFkwVjNKcGRHVmNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHSmhjMlUyTkZkeWFYUmxLSFJvYVhNc0lITjBjbWx1Wnl3Z2IyWm1jMlYwTENCc1pXNW5kR2dwWEc1Y2JpQWdJQ0FnSUdOaGMyVWdKM1ZqY3pJbk9seHVJQ0FnSUNBZ1kyRnpaU0FuZFdOekxUSW5PbHh1SUNBZ0lDQWdZMkZ6WlNBbmRYUm1NVFpzWlNjNlhHNGdJQ0FnSUNCallYTmxJQ2QxZEdZdE1UWnNaU2M2WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIxWTNNeVYzSnBkR1VvZEdocGN5d2djM1J5YVc1bkxDQnZabVp6WlhRc0lHeGxibWQwYUNsY2JseHVJQ0FnSUNBZ1pHVm1ZWFZzZERwY2JpQWdJQ0FnSUNBZ2FXWWdLR3h2ZDJWeVpXUkRZWE5sS1NCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtDZFZibXR1YjNkdUlHVnVZMjlrYVc1bk9pQW5JQ3NnWlc1amIyUnBibWNwWEc0Z0lDQWdJQ0FnSUdWdVkyOWthVzVuSUQwZ0tDY25JQ3NnWlc1amIyUnBibWNwTG5SdlRHOTNaWEpEWVhObEtDbGNiaUFnSUNBZ0lDQWdiRzkzWlhKbFpFTmhjMlVnUFNCMGNuVmxYRzRnSUNBZ2ZWeHVJQ0I5WEc1OVhHNWNia0oxWm1abGNpNXdjbTkwYjNSNWNHVXVkRzlLVTA5T0lEMGdablZ1WTNScGIyNGdkRzlLVTA5T0lDZ3BJSHRjYmlBZ2NtVjBkWEp1SUh0Y2JpQWdJQ0IwZVhCbE9pQW5RblZtWm1WeUp5eGNiaUFnSUNCa1lYUmhPaUJCY25KaGVTNXdjbTkwYjNSNWNHVXVjMnhwWTJVdVkyRnNiQ2gwYUdsekxsOWhjbklnZkh3Z2RHaHBjeXdnTUNsY2JpQWdmVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmlZWE5sTmpSVGJHbGpaU0FvWW5WbUxDQnpkR0Z5ZEN3Z1pXNWtLU0I3WEc0Z0lHbG1JQ2h6ZEdGeWRDQTlQVDBnTUNBbUppQmxibVFnUFQwOUlHSjFaaTVzWlc1bmRHZ3BJSHRjYmlBZ0lDQnlaWFIxY200Z1ltRnpaVFkwTG1aeWIyMUNlWFJsUVhKeVlYa29ZblZtS1Z4dUlDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUhKbGRIVnliaUJpWVhObE5qUXVabkp2YlVKNWRHVkJjbkpoZVNoaWRXWXVjMnhwWTJVb2MzUmhjblFzSUdWdVpDa3BYRzRnSUgxY2JuMWNibHh1Wm5WdVkzUnBiMjRnZFhSbU9GTnNhV05sSUNoaWRXWXNJSE4wWVhKMExDQmxibVFwSUh0Y2JpQWdaVzVrSUQwZ1RXRjBhQzV0YVc0b1luVm1MbXhsYm1kMGFDd2daVzVrS1Z4dUlDQjJZWElnY21WeklEMGdXMTFjYmx4dUlDQjJZWElnYVNBOUlITjBZWEowWEc0Z0lIZG9hV3hsSUNocElEd2daVzVrS1NCN1hHNGdJQ0FnZG1GeUlHWnBjbk4wUW5sMFpTQTlJR0oxWmx0cFhWeHVJQ0FnSUhaaGNpQmpiMlJsVUc5cGJuUWdQU0J1ZFd4c1hHNGdJQ0FnZG1GeUlHSjVkR1Z6VUdWeVUyVnhkV1Z1WTJVZ1BTQW9abWx5YzNSQ2VYUmxJRDRnTUhoRlJpa2dQeUEwWEc0Z0lDQWdJQ0E2SUNobWFYSnpkRUo1ZEdVZ1BpQXdlRVJHS1NBL0lETmNiaUFnSUNBZ0lEb2dLR1pwY25OMFFubDBaU0ErSURCNFFrWXBJRDhnTWx4dUlDQWdJQ0FnT2lBeFhHNWNiaUFnSUNCcFppQW9hU0FySUdKNWRHVnpVR1Z5VTJWeGRXVnVZMlVnUEQwZ1pXNWtLU0I3WEc0Z0lDQWdJQ0IyWVhJZ2MyVmpiMjVrUW5sMFpTd2dkR2hwY21SQ2VYUmxMQ0JtYjNWeWRHaENlWFJsTENCMFpXMXdRMjlrWlZCdmFXNTBYRzVjYmlBZ0lDQWdJSE4zYVhSamFDQW9ZbmwwWlhOUVpYSlRaWEYxWlc1alpTa2dlMXh1SUNBZ0lDQWdJQ0JqWVhObElERTZYRzRnSUNBZ0lDQWdJQ0FnYVdZZ0tHWnBjbk4wUW5sMFpTQThJREI0T0RBcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdlpHVlFiMmx1ZENBOUlHWnBjbk4wUW5sMFpWeHVJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNCaWNtVmhhMXh1SUNBZ0lDQWdJQ0JqWVhObElESTZYRzRnSUNBZ0lDQWdJQ0FnYzJWamIyNWtRbmwwWlNBOUlHSjFabHRwSUNzZ01WMWNiaUFnSUNBZ0lDQWdJQ0JwWmlBb0tITmxZMjl1WkVKNWRHVWdKaUF3ZUVNd0tTQTlQVDBnTUhnNE1Da2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHVnRjRU52WkdWUWIybHVkQ0E5SUNobWFYSnpkRUo1ZEdVZ0ppQXdlREZHS1NBOFBDQXdlRFlnZkNBb2MyVmpiMjVrUW5sMFpTQW1JREI0TTBZcFhHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RHVnRjRU52WkdWUWIybHVkQ0ErSURCNE4wWXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjlrWlZCdmFXNTBJRDBnZEdWdGNFTnZaR1ZRYjJsdWRGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0JpY21WaGExeHVJQ0FnSUNBZ0lDQmpZWE5sSURNNlhHNGdJQ0FnSUNBZ0lDQWdjMlZqYjI1a1FubDBaU0E5SUdKMVpsdHBJQ3NnTVYxY2JpQWdJQ0FnSUNBZ0lDQjBhR2x5WkVKNWRHVWdQU0JpZFdaYmFTQXJJREpkWEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ2h6WldOdmJtUkNlWFJsSUNZZ01IaERNQ2tnUFQwOUlEQjRPREFnSmlZZ0tIUm9hWEprUW5sMFpTQW1JREI0UXpBcElEMDlQU0F3ZURnd0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMFpXMXdRMjlrWlZCdmFXNTBJRDBnS0dacGNuTjBRbmwwWlNBbUlEQjRSaWtnUER3Z01IaERJSHdnS0hObFkyOXVaRUo1ZEdVZ0ppQXdlRE5HS1NBOFBDQXdlRFlnZkNBb2RHaHBjbVJDZVhSbElDWWdNSGd6UmlsY2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoMFpXMXdRMjlrWlZCdmFXNTBJRDRnTUhnM1JrWWdKaVlnS0hSbGJYQkRiMlJsVUc5cGJuUWdQQ0F3ZUVRNE1EQWdmSHdnZEdWdGNFTnZaR1ZRYjJsdWRDQStJREI0UkVaR1Jpa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjlrWlZCdmFXNTBJRDBnZEdWdGNFTnZaR1ZRYjJsdWRGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0JpY21WaGExeHVJQ0FnSUNBZ0lDQmpZWE5sSURRNlhHNGdJQ0FnSUNBZ0lDQWdjMlZqYjI1a1FubDBaU0E5SUdKMVpsdHBJQ3NnTVYxY2JpQWdJQ0FnSUNBZ0lDQjBhR2x5WkVKNWRHVWdQU0JpZFdaYmFTQXJJREpkWEc0Z0lDQWdJQ0FnSUNBZ1ptOTFjblJvUW5sMFpTQTlJR0oxWmx0cElDc2dNMTFjYmlBZ0lDQWdJQ0FnSUNCcFppQW9LSE5sWTI5dVpFSjVkR1VnSmlBd2VFTXdLU0E5UFQwZ01IZzRNQ0FtSmlBb2RHaHBjbVJDZVhSbElDWWdNSGhETUNrZ1BUMDlJREI0T0RBZ0ppWWdLR1p2ZFhKMGFFSjVkR1VnSmlBd2VFTXdLU0E5UFQwZ01IZzRNQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR1Z0Y0VOdlpHVlFiMmx1ZENBOUlDaG1hWEp6ZEVKNWRHVWdKaUF3ZUVZcElEdzhJREI0TVRJZ2ZDQW9jMlZqYjI1a1FubDBaU0FtSURCNE0wWXBJRHc4SURCNFF5QjhJQ2gwYUdseVpFSjVkR1VnSmlBd2VETkdLU0E4UENBd2VEWWdmQ0FvWm05MWNuUm9RbmwwWlNBbUlEQjRNMFlwWEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvZEdWdGNFTnZaR1ZRYjJsdWRDQStJREI0UmtaR1JpQW1KaUIwWlcxd1EyOWtaVkJ2YVc1MElEd2dNSGd4TVRBd01EQXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjlrWlZCdmFXNTBJRDBnZEdWdGNFTnZaR1ZRYjJsdWRGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNCcFppQW9ZMjlrWlZCdmFXNTBJRDA5UFNCdWRXeHNLU0I3WEc0Z0lDQWdJQ0F2THlCM1pTQmthV1FnYm05MElHZGxibVZ5WVhSbElHRWdkbUZzYVdRZ1kyOWtaVkJ2YVc1MElITnZJR2x1YzJWeWRDQmhYRzRnSUNBZ0lDQXZMeUJ5WlhCc1lXTmxiV1Z1ZENCamFHRnlJQ2hWSzBaR1JrUXBJR0Z1WkNCaFpIWmhibU5sSUc5dWJIa2dNU0JpZVhSbFhHNGdJQ0FnSUNCamIyUmxVRzlwYm5RZ1BTQXdlRVpHUmtSY2JpQWdJQ0FnSUdKNWRHVnpVR1Z5VTJWeGRXVnVZMlVnUFNBeFhHNGdJQ0FnZlNCbGJITmxJR2xtSUNoamIyUmxVRzlwYm5RZ1BpQXdlRVpHUmtZcElIdGNiaUFnSUNBZ0lDOHZJR1Z1WTI5a1pTQjBieUIxZEdZeE5pQW9jM1Z5Y205bllYUmxJSEJoYVhJZ1pHRnVZMlVwWEc0Z0lDQWdJQ0JqYjJSbFVHOXBiblFnTFQwZ01IZ3hNREF3TUZ4dUlDQWdJQ0FnY21WekxuQjFjMmdvWTI5a1pWQnZhVzUwSUQ0K1BpQXhNQ0FtSURCNE0wWkdJSHdnTUhoRU9EQXdLVnh1SUNBZ0lDQWdZMjlrWlZCdmFXNTBJRDBnTUhoRVF6QXdJSHdnWTI5a1pWQnZhVzUwSUNZZ01IZ3pSa1pjYmlBZ0lDQjlYRzVjYmlBZ0lDQnlaWE11Y0hWemFDaGpiMlJsVUc5cGJuUXBYRzRnSUNBZ2FTQXJQU0JpZVhSbGMxQmxjbE5sY1hWbGJtTmxYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdaR1ZqYjJSbFEyOWtaVkJ2YVc1MGMwRnljbUY1S0hKbGN5bGNibjFjYmx4dUx5OGdRbUZ6WldRZ2IyNGdhSFIwY0RvdkwzTjBZV05yYjNabGNtWnNiM2N1WTI5dEwyRXZNakkzTkRjeU56SXZOamd3TnpReUxDQjBhR1VnWW5KdmQzTmxjaUIzYVhSb1hHNHZMeUIwYUdVZ2JHOTNaWE4wSUd4cGJXbDBJR2x6SUVOb2NtOXRaU3dnZDJsMGFDQXdlREV3TURBd0lHRnlaM011WEc0dkx5QlhaU0JuYnlBeElHMWhaMjVwZEhWa1pTQnNaWE56TENCbWIzSWdjMkZtWlhSNVhHNTJZWElnVFVGWVgwRlNSMVZOUlU1VVUxOU1SVTVIVkVnZ1BTQXdlREV3TURCY2JseHVablZ1WTNScGIyNGdaR1ZqYjJSbFEyOWtaVkJ2YVc1MGMwRnljbUY1SUNoamIyUmxVRzlwYm5SektTQjdYRzRnSUhaaGNpQnNaVzRnUFNCamIyUmxVRzlwYm5SekxteGxibWQwYUZ4dUlDQnBaaUFvYkdWdUlEdzlJRTFCV0Y5QlVrZFZUVVZPVkZOZlRFVk9SMVJJS1NCN1hHNGdJQ0FnY21WMGRYSnVJRk4wY21sdVp5NW1jbTl0UTJoaGNrTnZaR1V1WVhCd2JIa29VM1J5YVc1bkxDQmpiMlJsVUc5cGJuUnpLU0F2THlCaGRtOXBaQ0JsZUhSeVlTQnpiR2xqWlNncFhHNGdJSDFjYmx4dUlDQXZMeUJFWldOdlpHVWdhVzRnWTJoMWJtdHpJSFJ2SUdGMmIybGtJRndpWTJGc2JDQnpkR0ZqYXlCemFYcGxJR1Y0WTJWbFpHVmtYQ0l1WEc0Z0lIWmhjaUJ5WlhNZ1BTQW5KMXh1SUNCMllYSWdhU0E5SURCY2JpQWdkMmhwYkdVZ0tHa2dQQ0JzWlc0cElIdGNiaUFnSUNCeVpYTWdLejBnVTNSeWFXNW5MbVp5YjIxRGFHRnlRMjlrWlM1aGNIQnNlU2hjYmlBZ0lDQWdJRk4wY21sdVp5eGNiaUFnSUNBZ0lHTnZaR1ZRYjJsdWRITXVjMnhwWTJVb2FTd2dhU0FyUFNCTlFWaGZRVkpIVlUxRlRsUlRYMHhGVGtkVVNDbGNiaUFnSUNBcFhHNGdJSDFjYmlBZ2NtVjBkWEp1SUhKbGMxeHVmVnh1WEc1bWRXNWpkR2x2YmlCaGMyTnBhVk5zYVdObElDaGlkV1lzSUhOMFlYSjBMQ0JsYm1RcElIdGNiaUFnZG1GeUlISmxkQ0E5SUNjblhHNGdJR1Z1WkNBOUlFMWhkR2d1YldsdUtHSjFaaTVzWlc1bmRHZ3NJR1Z1WkNsY2JseHVJQ0JtYjNJZ0tIWmhjaUJwSUQwZ2MzUmhjblE3SUdrZ1BDQmxibVE3SUdrckt5a2dlMXh1SUNBZ0lISmxkQ0FyUFNCVGRISnBibWN1Wm5KdmJVTm9ZWEpEYjJSbEtHSjFabHRwWFNBbUlEQjROMFlwWEc0Z0lIMWNiaUFnY21WMGRYSnVJSEpsZEZ4dWZWeHVYRzVtZFc1amRHbHZiaUJpYVc1aGNubFRiR2xqWlNBb1luVm1MQ0J6ZEdGeWRDd2daVzVrS1NCN1hHNGdJSFpoY2lCeVpYUWdQU0FuSjF4dUlDQmxibVFnUFNCTllYUm9MbTFwYmloaWRXWXViR1Z1WjNSb0xDQmxibVFwWEc1Y2JpQWdabTl5SUNoMllYSWdhU0E5SUhOMFlYSjBPeUJwSUR3Z1pXNWtPeUJwS3lzcElIdGNiaUFnSUNCeVpYUWdLejBnVTNSeWFXNW5MbVp5YjIxRGFHRnlRMjlrWlNoaWRXWmJhVjBwWEc0Z0lIMWNiaUFnY21WMGRYSnVJSEpsZEZ4dWZWeHVYRzVtZFc1amRHbHZiaUJvWlhoVGJHbGpaU0FvWW5WbUxDQnpkR0Z5ZEN3Z1pXNWtLU0I3WEc0Z0lIWmhjaUJzWlc0Z1BTQmlkV1l1YkdWdVozUm9YRzVjYmlBZ2FXWWdLQ0Z6ZEdGeWRDQjhmQ0J6ZEdGeWRDQThJREFwSUhOMFlYSjBJRDBnTUZ4dUlDQnBaaUFvSVdWdVpDQjhmQ0JsYm1RZ1BDQXdJSHg4SUdWdVpDQStJR3hsYmlrZ1pXNWtJRDBnYkdWdVhHNWNiaUFnZG1GeUlHOTFkQ0E5SUNjblhHNGdJR1p2Y2lBb2RtRnlJR2tnUFNCemRHRnlkRHNnYVNBOElHVnVaRHNnYVNzcktTQjdYRzRnSUNBZ2IzVjBJQ3M5SUhSdlNHVjRLR0oxWmx0cFhTbGNiaUFnZlZ4dUlDQnlaWFIxY200Z2IzVjBYRzU5WEc1Y2JtWjFibU4wYVc5dUlIVjBaakUyYkdWVGJHbGpaU0FvWW5WbUxDQnpkR0Z5ZEN3Z1pXNWtLU0I3WEc0Z0lIWmhjaUJpZVhSbGN5QTlJR0oxWmk1emJHbGpaU2h6ZEdGeWRDd2daVzVrS1Z4dUlDQjJZWElnY21WeklEMGdKeWRjYmlBZ1ptOXlJQ2gyWVhJZ2FTQTlJREE3SUdrZ1BDQmllWFJsY3k1c1pXNW5kR2c3SUdrZ0t6MGdNaWtnZTF4dUlDQWdJSEpsY3lBclBTQlRkSEpwYm1jdVpuSnZiVU5vWVhKRGIyUmxLR0o1ZEdWelcybGRJQ3NnWW5sMFpYTmJhU0FySURGZElDb2dNalUyS1Z4dUlDQjlYRzRnSUhKbGRIVnliaUJ5WlhOY2JuMWNibHh1UW5WbVptVnlMbkJ5YjNSdmRIbHdaUzV6YkdsalpTQTlJR1oxYm1OMGFXOXVJSE5zYVdObElDaHpkR0Z5ZEN3Z1pXNWtLU0I3WEc0Z0lIWmhjaUJzWlc0Z1BTQjBhR2x6TG14bGJtZDBhRnh1SUNCemRHRnlkQ0E5SUg1K2MzUmhjblJjYmlBZ1pXNWtJRDBnWlc1a0lEMDlQU0IxYm1SbFptbHVaV1FnUHlCc1pXNGdPaUIrZm1WdVpGeHVYRzRnSUdsbUlDaHpkR0Z5ZENBOElEQXBJSHRjYmlBZ0lDQnpkR0Z5ZENBclBTQnNaVzVjYmlBZ0lDQnBaaUFvYzNSaGNuUWdQQ0F3S1NCemRHRnlkQ0E5SURCY2JpQWdmU0JsYkhObElHbG1JQ2h6ZEdGeWRDQStJR3hsYmlrZ2UxeHVJQ0FnSUhOMFlYSjBJRDBnYkdWdVhHNGdJSDFjYmx4dUlDQnBaaUFvWlc1a0lEd2dNQ2tnZTF4dUlDQWdJR1Z1WkNBclBTQnNaVzVjYmlBZ0lDQnBaaUFvWlc1a0lEd2dNQ2tnWlc1a0lEMGdNRnh1SUNCOUlHVnNjMlVnYVdZZ0tHVnVaQ0ErSUd4bGJpa2dlMXh1SUNBZ0lHVnVaQ0E5SUd4bGJseHVJQ0I5WEc1Y2JpQWdhV1lnS0dWdVpDQThJSE4wWVhKMEtTQmxibVFnUFNCemRHRnlkRnh1WEc0Z0lIWmhjaUJ1WlhkQ2RXWmNiaUFnYVdZZ0tFSjFabVpsY2k1VVdWQkZSRjlCVWxKQldWOVRWVkJRVDFKVUtTQjdYRzRnSUNBZ2JtVjNRblZtSUQwZ1FuVm1abVZ5TGw5aGRXZHRaVzUwS0hSb2FYTXVjM1ZpWVhKeVlYa29jM1JoY25Rc0lHVnVaQ2twWEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnZG1GeUlITnNhV05sVEdWdUlEMGdaVzVrSUMwZ2MzUmhjblJjYmlBZ0lDQnVaWGRDZFdZZ1BTQnVaWGNnUW5WbVptVnlLSE5zYVdObFRHVnVMQ0IxYm1SbFptbHVaV1FwWEc0Z0lDQWdabTl5SUNoMllYSWdhU0E5SURBN0lHa2dQQ0J6YkdsalpVeGxianNnYVNzcktTQjdYRzRnSUNBZ0lDQnVaWGRDZFdaYmFWMGdQU0IwYUdselcya2dLeUJ6ZEdGeWRGMWNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQnBaaUFvYm1WM1FuVm1MbXhsYm1kMGFDa2dibVYzUW5WbUxuQmhjbVZ1ZENBOUlIUm9hWE11Y0dGeVpXNTBJSHg4SUhSb2FYTmNibHh1SUNCeVpYUjFjbTRnYm1WM1FuVm1YRzU5WEc1Y2JpOHFYRzRnS2lCT1pXVmtJSFJ2SUcxaGEyVWdjM1Z5WlNCMGFHRjBJR0oxWm1abGNpQnBjMjRuZENCMGNubHBibWNnZEc4Z2QzSnBkR1VnYjNWMElHOW1JR0p2ZFc1a2N5NWNiaUFxTDF4dVpuVnVZM1JwYjI0Z1kyaGxZMnRQWm1aelpYUWdLRzltWm5ObGRDd2daWGgwTENCc1pXNW5kR2dwSUh0Y2JpQWdhV1lnS0NodlptWnpaWFFnSlNBeEtTQWhQVDBnTUNCOGZDQnZabVp6WlhRZ1BDQXdLU0IwYUhKdmR5QnVaWGNnVW1GdVoyVkZjbkp2Y2lnbmIyWm1jMlYwSUdseklHNXZkQ0IxYVc1MEp5bGNiaUFnYVdZZ0tHOW1abk5sZENBcklHVjRkQ0ErSUd4bGJtZDBhQ2tnZEdoeWIzY2dibVYzSUZKaGJtZGxSWEp5YjNJb0oxUnllV2x1WnlCMGJ5QmhZMk5sYzNNZ1ltVjViMjVrSUdKMVptWmxjaUJzWlc1bmRHZ25LVnh1ZlZ4dVhHNUNkV1ptWlhJdWNISnZkRzkwZVhCbExuSmxZV1JWU1c1MFRFVWdQU0JtZFc1amRHbHZiaUJ5WldGa1ZVbHVkRXhGSUNodlptWnpaWFFzSUdKNWRHVk1aVzVuZEdnc0lHNXZRWE56WlhKMEtTQjdYRzRnSUc5bVpuTmxkQ0E5SUc5bVpuTmxkQ0I4SURCY2JpQWdZbmwwWlV4bGJtZDBhQ0E5SUdKNWRHVk1aVzVuZEdnZ2ZDQXdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJR05vWldOclQyWm1jMlYwS0c5bVpuTmxkQ3dnWW5sMFpVeGxibWQwYUN3Z2RHaHBjeTVzWlc1bmRHZ3BYRzVjYmlBZ2RtRnlJSFpoYkNBOUlIUm9hWE5iYjJabWMyVjBYVnh1SUNCMllYSWdiWFZzSUQwZ01WeHVJQ0IyWVhJZ2FTQTlJREJjYmlBZ2QyaHBiR1VnS0NzcmFTQThJR0o1ZEdWTVpXNW5kR2dnSmlZZ0tHMTFiQ0FxUFNBd2VERXdNQ2twSUh0Y2JpQWdJQ0IyWVd3Z0t6MGdkR2hwYzF0dlptWnpaWFFnS3lCcFhTQXFJRzExYkZ4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUhaaGJGeHVmVnh1WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5KbFlXUlZTVzUwUWtVZ1BTQm1kVzVqZEdsdmJpQnlaV0ZrVlVsdWRFSkZJQ2h2Wm1aelpYUXNJR0o1ZEdWTVpXNW5kR2dzSUc1dlFYTnpaWEowS1NCN1hHNGdJRzltWm5ObGRDQTlJRzltWm5ObGRDQjhJREJjYmlBZ1lubDBaVXhsYm1kMGFDQTlJR0o1ZEdWTVpXNW5kR2dnZkNBd1hHNGdJR2xtSUNnaGJtOUJjM05sY25RcElIdGNiaUFnSUNCamFHVmphMDltWm5ObGRDaHZabVp6WlhRc0lHSjVkR1ZNWlc1bmRHZ3NJSFJvYVhNdWJHVnVaM1JvS1Z4dUlDQjlYRzVjYmlBZ2RtRnlJSFpoYkNBOUlIUm9hWE5iYjJabWMyVjBJQ3NnTFMxaWVYUmxUR1Z1WjNSb1hWeHVJQ0IyWVhJZ2JYVnNJRDBnTVZ4dUlDQjNhR2xzWlNBb1lubDBaVXhsYm1kMGFDQStJREFnSmlZZ0tHMTFiQ0FxUFNBd2VERXdNQ2twSUh0Y2JpQWdJQ0IyWVd3Z0t6MGdkR2hwYzF0dlptWnpaWFFnS3lBdExXSjVkR1ZNWlc1bmRHaGRJQ29nYlhWc1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2RtRnNYRzU5WEc1Y2JrSjFabVpsY2k1d2NtOTBiM1I1Y0dVdWNtVmhaRlZKYm5RNElEMGdablZ1WTNScGIyNGdjbVZoWkZWSmJuUTRJQ2h2Wm1aelpYUXNJRzV2UVhOelpYSjBLU0I3WEc0Z0lHbG1JQ2doYm05QmMzTmxjblFwSUdOb1pXTnJUMlptYzJWMEtHOW1abk5sZEN3Z01Td2dkR2hwY3k1c1pXNW5kR2dwWEc0Z0lISmxkSFZ5YmlCMGFHbHpXMjltWm5ObGRGMWNibjFjYmx4dVFuVm1abVZ5TG5CeWIzUnZkSGx3WlM1eVpXRmtWVWx1ZERFMlRFVWdQU0JtZFc1amRHbHZiaUJ5WldGa1ZVbHVkREUyVEVVZ0tHOW1abk5sZEN3Z2JtOUJjM05sY25RcElIdGNiaUFnYVdZZ0tDRnViMEZ6YzJWeWRDa2dZMmhsWTJ0UFptWnpaWFFvYjJabWMyVjBMQ0F5TENCMGFHbHpMbXhsYm1kMGFDbGNiaUFnY21WMGRYSnVJSFJvYVhOYmIyWm1jMlYwWFNCOElDaDBhR2x6VzI5bVpuTmxkQ0FySURGZElEdzhJRGdwWEc1OVhHNWNia0oxWm1abGNpNXdjbTkwYjNSNWNHVXVjbVZoWkZWSmJuUXhOa0pGSUQwZ1puVnVZM1JwYjI0Z2NtVmhaRlZKYm5ReE5rSkZJQ2h2Wm1aelpYUXNJRzV2UVhOelpYSjBLU0I3WEc0Z0lHbG1JQ2doYm05QmMzTmxjblFwSUdOb1pXTnJUMlptYzJWMEtHOW1abk5sZEN3Z01pd2dkR2hwY3k1c1pXNW5kR2dwWEc0Z0lISmxkSFZ5YmlBb2RHaHBjMXR2Wm1aelpYUmRJRHc4SURncElId2dkR2hwYzF0dlptWnpaWFFnS3lBeFhWeHVmVnh1WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5KbFlXUlZTVzUwTXpKTVJTQTlJR1oxYm1OMGFXOXVJSEpsWVdSVlNXNTBNekpNUlNBb2IyWm1jMlYwTENCdWIwRnpjMlZ5ZENrZ2UxeHVJQ0JwWmlBb0lXNXZRWE56WlhKMEtTQmphR1ZqYTA5bVpuTmxkQ2h2Wm1aelpYUXNJRFFzSUhSb2FYTXViR1Z1WjNSb0tWeHVYRzRnSUhKbGRIVnliaUFvS0hSb2FYTmJiMlptYzJWMFhTa2dmRnh1SUNBZ0lDQWdLSFJvYVhOYmIyWm1jMlYwSUNzZ01WMGdQRHdnT0NrZ2ZGeHVJQ0FnSUNBZ0tIUm9hWE5iYjJabWMyVjBJQ3NnTWwwZ1BEd2dNVFlwS1NBclhHNGdJQ0FnSUNBb2RHaHBjMXR2Wm1aelpYUWdLeUF6WFNBcUlEQjRNVEF3TURBd01DbGNibjFjYmx4dVFuVm1abVZ5TG5CeWIzUnZkSGx3WlM1eVpXRmtWVWx1ZERNeVFrVWdQU0JtZFc1amRHbHZiaUJ5WldGa1ZVbHVkRE15UWtVZ0tHOW1abk5sZEN3Z2JtOUJjM05sY25RcElIdGNiaUFnYVdZZ0tDRnViMEZ6YzJWeWRDa2dZMmhsWTJ0UFptWnpaWFFvYjJabWMyVjBMQ0EwTENCMGFHbHpMbXhsYm1kMGFDbGNibHh1SUNCeVpYUjFjbTRnS0hSb2FYTmJiMlptYzJWMFhTQXFJREI0TVRBd01EQXdNQ2tnSzF4dUlDQWdJQ2dvZEdocGMxdHZabVp6WlhRZ0t5QXhYU0E4UENBeE5pa2dmRnh1SUNBZ0lDaDBhR2x6VzI5bVpuTmxkQ0FySURKZElEdzhJRGdwSUh4Y2JpQWdJQ0IwYUdselcyOW1abk5sZENBcklETmRLVnh1ZlZ4dVhHNUNkV1ptWlhJdWNISnZkRzkwZVhCbExuSmxZV1JKYm5STVJTQTlJR1oxYm1OMGFXOXVJSEpsWVdSSmJuUk1SU0FvYjJabWMyVjBMQ0JpZVhSbFRHVnVaM1JvTENCdWIwRnpjMlZ5ZENrZ2UxeHVJQ0J2Wm1aelpYUWdQU0J2Wm1aelpYUWdmQ0F3WEc0Z0lHSjVkR1ZNWlc1bmRHZ2dQU0JpZVhSbFRHVnVaM1JvSUh3Z01GeHVJQ0JwWmlBb0lXNXZRWE56WlhKMEtTQmphR1ZqYTA5bVpuTmxkQ2h2Wm1aelpYUXNJR0o1ZEdWTVpXNW5kR2dzSUhSb2FYTXViR1Z1WjNSb0tWeHVYRzRnSUhaaGNpQjJZV3dnUFNCMGFHbHpXMjltWm5ObGRGMWNiaUFnZG1GeUlHMTFiQ0E5SURGY2JpQWdkbUZ5SUdrZ1BTQXdYRzRnSUhkb2FXeGxJQ2dySzJrZ1BDQmllWFJsVEdWdVozUm9JQ1ltSUNodGRXd2dLajBnTUhneE1EQXBLU0I3WEc0Z0lDQWdkbUZzSUNzOUlIUm9hWE5iYjJabWMyVjBJQ3NnYVYwZ0tpQnRkV3hjYmlBZ2ZWeHVJQ0J0ZFd3Z0tqMGdNSGc0TUZ4dVhHNGdJR2xtSUNoMllXd2dQajBnYlhWc0tTQjJZV3dnTFQwZ1RXRjBhQzV3YjNjb01pd2dPQ0FxSUdKNWRHVk1aVzVuZEdncFhHNWNiaUFnY21WMGRYSnVJSFpoYkZ4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbkpsWVdSSmJuUkNSU0E5SUdaMWJtTjBhVzl1SUhKbFlXUkpiblJDUlNBb2IyWm1jMlYwTENCaWVYUmxUR1Z1WjNSb0xDQnViMEZ6YzJWeWRDa2dlMXh1SUNCdlptWnpaWFFnUFNCdlptWnpaWFFnZkNBd1hHNGdJR0o1ZEdWTVpXNW5kR2dnUFNCaWVYUmxUR1Z1WjNSb0lId2dNRnh1SUNCcFppQW9JVzV2UVhOelpYSjBLU0JqYUdWamEwOW1abk5sZENodlptWnpaWFFzSUdKNWRHVk1aVzVuZEdnc0lIUm9hWE11YkdWdVozUm9LVnh1WEc0Z0lIWmhjaUJwSUQwZ1lubDBaVXhsYm1kMGFGeHVJQ0IyWVhJZ2JYVnNJRDBnTVZ4dUlDQjJZWElnZG1Gc0lEMGdkR2hwYzF0dlptWnpaWFFnS3lBdExXbGRYRzRnSUhkb2FXeGxJQ2hwSUQ0Z01DQW1KaUFvYlhWc0lDbzlJREI0TVRBd0tTa2dlMXh1SUNBZ0lIWmhiQ0FyUFNCMGFHbHpXMjltWm5ObGRDQXJJQzB0YVYwZ0tpQnRkV3hjYmlBZ2ZWeHVJQ0J0ZFd3Z0tqMGdNSGc0TUZ4dVhHNGdJR2xtSUNoMllXd2dQajBnYlhWc0tTQjJZV3dnTFQwZ1RXRjBhQzV3YjNjb01pd2dPQ0FxSUdKNWRHVk1aVzVuZEdncFhHNWNiaUFnY21WMGRYSnVJSFpoYkZ4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbkpsWVdSSmJuUTRJRDBnWm5WdVkzUnBiMjRnY21WaFpFbHVkRGdnS0c5bVpuTmxkQ3dnYm05QmMzTmxjblFwSUh0Y2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRQWm1aelpYUW9iMlptYzJWMExDQXhMQ0IwYUdsekxteGxibWQwYUNsY2JpQWdhV1lnS0NFb2RHaHBjMXR2Wm1aelpYUmRJQ1lnTUhnNE1Da3BJSEpsZEhWeWJpQW9kR2hwYzF0dlptWnpaWFJkS1Z4dUlDQnlaWFIxY200Z0tDZ3dlR1ptSUMwZ2RHaHBjMXR2Wm1aelpYUmRJQ3NnTVNrZ0tpQXRNU2xjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNXlaV0ZrU1c1ME1UWk1SU0E5SUdaMWJtTjBhVzl1SUhKbFlXUkpiblF4Tmt4RklDaHZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJR05vWldOclQyWm1jMlYwS0c5bVpuTmxkQ3dnTWl3Z2RHaHBjeTVzWlc1bmRHZ3BYRzRnSUhaaGNpQjJZV3dnUFNCMGFHbHpXMjltWm5ObGRGMGdmQ0FvZEdocGMxdHZabVp6WlhRZ0t5QXhYU0E4UENBNEtWeHVJQ0J5WlhSMWNtNGdLSFpoYkNBbUlEQjRPREF3TUNrZ1B5QjJZV3dnZkNBd2VFWkdSa1l3TURBd0lEb2dkbUZzWEc1OVhHNWNia0oxWm1abGNpNXdjbTkwYjNSNWNHVXVjbVZoWkVsdWRERTJRa1VnUFNCbWRXNWpkR2x2YmlCeVpXRmtTVzUwTVRaQ1JTQW9iMlptYzJWMExDQnViMEZ6YzJWeWRDa2dlMXh1SUNCcFppQW9JVzV2UVhOelpYSjBLU0JqYUdWamEwOW1abk5sZENodlptWnpaWFFzSURJc0lIUm9hWE11YkdWdVozUm9LVnh1SUNCMllYSWdkbUZzSUQwZ2RHaHBjMXR2Wm1aelpYUWdLeUF4WFNCOElDaDBhR2x6VzI5bVpuTmxkRjBnUER3Z09DbGNiaUFnY21WMGRYSnVJQ2gyWVd3Z0ppQXdlRGd3TURBcElEOGdkbUZzSUh3Z01IaEdSa1pHTURBd01DQTZJSFpoYkZ4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbkpsWVdSSmJuUXpNa3hGSUQwZ1puVnVZM1JwYjI0Z2NtVmhaRWx1ZERNeVRFVWdLRzltWm5ObGRDd2dibTlCYzNObGNuUXBJSHRjYmlBZ2FXWWdLQ0Z1YjBGemMyVnlkQ2tnWTJobFkydFBabVp6WlhRb2IyWm1jMlYwTENBMExDQjBhR2x6TG14bGJtZDBhQ2xjYmx4dUlDQnlaWFIxY200Z0tIUm9hWE5iYjJabWMyVjBYU2tnZkZ4dUlDQWdJQ2gwYUdselcyOW1abk5sZENBcklERmRJRHc4SURncElIeGNiaUFnSUNBb2RHaHBjMXR2Wm1aelpYUWdLeUF5WFNBOFBDQXhOaWtnZkZ4dUlDQWdJQ2gwYUdselcyOW1abk5sZENBcklETmRJRHc4SURJMEtWeHVmVnh1WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5KbFlXUkpiblF6TWtKRklEMGdablZ1WTNScGIyNGdjbVZoWkVsdWRETXlRa1VnS0c5bVpuTmxkQ3dnYm05QmMzTmxjblFwSUh0Y2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRQWm1aelpYUW9iMlptYzJWMExDQTBMQ0IwYUdsekxteGxibWQwYUNsY2JseHVJQ0J5WlhSMWNtNGdLSFJvYVhOYmIyWm1jMlYwWFNBOFBDQXlOQ2tnZkZ4dUlDQWdJQ2gwYUdselcyOW1abk5sZENBcklERmRJRHc4SURFMktTQjhYRzRnSUNBZ0tIUm9hWE5iYjJabWMyVjBJQ3NnTWwwZ1BEd2dPQ2tnZkZ4dUlDQWdJQ2gwYUdselcyOW1abk5sZENBcklETmRLVnh1ZlZ4dVhHNUNkV1ptWlhJdWNISnZkRzkwZVhCbExuSmxZV1JHYkc5aGRFeEZJRDBnWm5WdVkzUnBiMjRnY21WaFpFWnNiMkYwVEVVZ0tHOW1abk5sZEN3Z2JtOUJjM05sY25RcElIdGNiaUFnYVdZZ0tDRnViMEZ6YzJWeWRDa2dZMmhsWTJ0UFptWnpaWFFvYjJabWMyVjBMQ0EwTENCMGFHbHpMbXhsYm1kMGFDbGNiaUFnY21WMGRYSnVJR2xsWldVM05UUXVjbVZoWkNoMGFHbHpMQ0J2Wm1aelpYUXNJSFJ5ZFdVc0lESXpMQ0EwS1Z4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbkpsWVdSR2JHOWhkRUpGSUQwZ1puVnVZM1JwYjI0Z2NtVmhaRVpzYjJGMFFrVWdLRzltWm5ObGRDd2dibTlCYzNObGNuUXBJSHRjYmlBZ2FXWWdLQ0Z1YjBGemMyVnlkQ2tnWTJobFkydFBabVp6WlhRb2IyWm1jMlYwTENBMExDQjBhR2x6TG14bGJtZDBhQ2xjYmlBZ2NtVjBkWEp1SUdsbFpXVTNOVFF1Y21WaFpDaDBhR2x6TENCdlptWnpaWFFzSUdaaGJITmxMQ0F5TXl3Z05DbGNibjFjYmx4dVFuVm1abVZ5TG5CeWIzUnZkSGx3WlM1eVpXRmtSRzkxWW14bFRFVWdQU0JtZFc1amRHbHZiaUJ5WldGa1JHOTFZbXhsVEVVZ0tHOW1abk5sZEN3Z2JtOUJjM05sY25RcElIdGNiaUFnYVdZZ0tDRnViMEZ6YzJWeWRDa2dZMmhsWTJ0UFptWnpaWFFvYjJabWMyVjBMQ0E0TENCMGFHbHpMbXhsYm1kMGFDbGNiaUFnY21WMGRYSnVJR2xsWldVM05UUXVjbVZoWkNoMGFHbHpMQ0J2Wm1aelpYUXNJSFJ5ZFdVc0lEVXlMQ0E0S1Z4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbkpsWVdSRWIzVmliR1ZDUlNBOUlHWjFibU4wYVc5dUlISmxZV1JFYjNWaWJHVkNSU0FvYjJabWMyVjBMQ0J1YjBGemMyVnlkQ2tnZTF4dUlDQnBaaUFvSVc1dlFYTnpaWEowS1NCamFHVmphMDltWm5ObGRDaHZabVp6WlhRc0lEZ3NJSFJvYVhNdWJHVnVaM1JvS1Z4dUlDQnlaWFIxY200Z2FXVmxaVGMxTkM1eVpXRmtLSFJvYVhNc0lHOW1abk5sZEN3Z1ptRnNjMlVzSURVeUxDQTRLVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmphR1ZqYTBsdWRDQW9ZblZtTENCMllXeDFaU3dnYjJabWMyVjBMQ0JsZUhRc0lHMWhlQ3dnYldsdUtTQjdYRzRnSUdsbUlDZ2hRblZtWm1WeUxtbHpRblZtWm1WeUtHSjFaaWtwSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb0oySjFabVpsY2lCdGRYTjBJR0psSUdFZ1FuVm1abVZ5SUdsdWMzUmhibU5sSnlsY2JpQWdhV1lnS0haaGJIVmxJRDRnYldGNElIeDhJSFpoYkhWbElEd2diV2x1S1NCMGFISnZkeUJ1WlhjZ1VtRnVaMlZGY25KdmNpZ25kbUZzZFdVZ2FYTWdiM1YwSUc5bUlHSnZkVzVrY3ljcFhHNGdJR2xtSUNodlptWnpaWFFnS3lCbGVIUWdQaUJpZFdZdWJHVnVaM1JvS1NCMGFISnZkeUJ1WlhjZ1VtRnVaMlZGY25KdmNpZ25hVzVrWlhnZ2IzVjBJRzltSUhKaGJtZGxKeWxjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNTNjbWwwWlZWSmJuUk1SU0E5SUdaMWJtTjBhVzl1SUhkeWFYUmxWVWx1ZEV4RklDaDJZV3gxWlN3Z2IyWm1jMlYwTENCaWVYUmxUR1Z1WjNSb0xDQnViMEZ6YzJWeWRDa2dlMXh1SUNCMllXeDFaU0E5SUN0MllXeDFaVnh1SUNCdlptWnpaWFFnUFNCdlptWnpaWFFnZkNBd1hHNGdJR0o1ZEdWTVpXNW5kR2dnUFNCaWVYUmxUR1Z1WjNSb0lId2dNRnh1SUNCcFppQW9JVzV2UVhOelpYSjBLU0JqYUdWamEwbHVkQ2gwYUdsekxDQjJZV3gxWlN3Z2IyWm1jMlYwTENCaWVYUmxUR1Z1WjNSb0xDQk5ZWFJvTG5CdmR5Z3lMQ0E0SUNvZ1lubDBaVXhsYm1kMGFDa3NJREFwWEc1Y2JpQWdkbUZ5SUcxMWJDQTlJREZjYmlBZ2RtRnlJR2tnUFNBd1hHNGdJSFJvYVhOYmIyWm1jMlYwWFNBOUlIWmhiSFZsSUNZZ01IaEdSbHh1SUNCM2FHbHNaU0FvS3l0cElEd2dZbmwwWlV4bGJtZDBhQ0FtSmlBb2JYVnNJQ285SURCNE1UQXdLU2tnZTF4dUlDQWdJSFJvYVhOYmIyWm1jMlYwSUNzZ2FWMGdQU0FvZG1Gc2RXVWdMeUJ0ZFd3cElDWWdNSGhHUmx4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUc5bVpuTmxkQ0FySUdKNWRHVk1aVzVuZEdoY2JuMWNibHh1UW5WbVptVnlMbkJ5YjNSdmRIbHdaUzUzY21sMFpWVkpiblJDUlNBOUlHWjFibU4wYVc5dUlIZHlhWFJsVlVsdWRFSkZJQ2gyWVd4MVpTd2diMlptYzJWMExDQmllWFJsVEdWdVozUm9MQ0J1YjBGemMyVnlkQ2tnZTF4dUlDQjJZV3gxWlNBOUlDdDJZV3gxWlZ4dUlDQnZabVp6WlhRZ1BTQnZabVp6WlhRZ2ZDQXdYRzRnSUdKNWRHVk1aVzVuZEdnZ1BTQmllWFJsVEdWdVozUm9JSHdnTUZ4dUlDQnBaaUFvSVc1dlFYTnpaWEowS1NCamFHVmphMGx1ZENoMGFHbHpMQ0IyWVd4MVpTd2diMlptYzJWMExDQmllWFJsVEdWdVozUm9MQ0JOWVhSb0xuQnZkeWd5TENBNElDb2dZbmwwWlV4bGJtZDBhQ2tzSURBcFhHNWNiaUFnZG1GeUlHa2dQU0JpZVhSbFRHVnVaM1JvSUMwZ01WeHVJQ0IyWVhJZ2JYVnNJRDBnTVZ4dUlDQjBhR2x6VzI5bVpuTmxkQ0FySUdsZElEMGdkbUZzZFdVZ0ppQXdlRVpHWEc0Z0lIZG9hV3hsSUNndExXa2dQajBnTUNBbUppQW9iWFZzSUNvOUlEQjRNVEF3S1NrZ2UxeHVJQ0FnSUhSb2FYTmJiMlptYzJWMElDc2dhVjBnUFNBb2RtRnNkV1VnTHlCdGRXd3BJQ1lnTUhoR1JseHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlHOW1abk5sZENBcklHSjVkR1ZNWlc1bmRHaGNibjFjYmx4dVFuVm1abVZ5TG5CeWIzUnZkSGx3WlM1M2NtbDBaVlZKYm5RNElEMGdablZ1WTNScGIyNGdkM0pwZEdWVlNXNTBPQ0FvZG1Gc2RXVXNJRzltWm5ObGRDd2dibTlCYzNObGNuUXBJSHRjYmlBZ2RtRnNkV1VnUFNBcmRtRnNkV1ZjYmlBZ2IyWm1jMlYwSUQwZ2IyWm1jMlYwSUh3Z01GeHVJQ0JwWmlBb0lXNXZRWE56WlhKMEtTQmphR1ZqYTBsdWRDaDBhR2x6TENCMllXeDFaU3dnYjJabWMyVjBMQ0F4TENBd2VHWm1MQ0F3S1Z4dUlDQnBaaUFvSVVKMVptWmxjaTVVV1ZCRlJGOUJVbEpCV1Y5VFZWQlFUMUpVS1NCMllXeDFaU0E5SUUxaGRHZ3VabXh2YjNJb2RtRnNkV1VwWEc0Z0lIUm9hWE5iYjJabWMyVjBYU0E5SUhaaGJIVmxYRzRnSUhKbGRIVnliaUJ2Wm1aelpYUWdLeUF4WEc1OVhHNWNibVoxYm1OMGFXOXVJRzlpYW1WamRGZHlhWFJsVlVsdWRERTJJQ2hpZFdZc0lIWmhiSFZsTENCdlptWnpaWFFzSUd4cGRIUnNaVVZ1WkdsaGJpa2dlMXh1SUNCcFppQW9kbUZzZFdVZ1BDQXdLU0IyWVd4MVpTQTlJREI0Wm1abVppQXJJSFpoYkhWbElDc2dNVnh1SUNCbWIzSWdLSFpoY2lCcElEMGdNQ3dnYWlBOUlFMWhkR2d1YldsdUtHSjFaaTVzWlc1bmRHZ2dMU0J2Wm1aelpYUXNJRElwT3lCcElEd2dhanNnYVNzcktTQjdYRzRnSUNBZ1luVm1XMjltWm5ObGRDQXJJR2xkSUQwZ0tIWmhiSFZsSUNZZ0tEQjRabVlnUER3Z0tEZ2dLaUFvYkdsMGRHeGxSVzVrYVdGdUlEOGdhU0E2SURFZ0xTQnBLU2twS1NBK1BqNWNiaUFnSUNBZ0lDaHNhWFIwYkdWRmJtUnBZVzRnUHlCcElEb2dNU0F0SUdrcElDb2dPRnh1SUNCOVhHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1ZDNKcGRHVlZTVzUwTVRaTVJTQTlJR1oxYm1OMGFXOXVJSGR5YVhSbFZVbHVkREUyVEVVZ0tIWmhiSFZsTENCdlptWnpaWFFzSUc1dlFYTnpaWEowS1NCN1hHNGdJSFpoYkhWbElEMGdLM1poYkhWbFhHNGdJRzltWm5ObGRDQTlJRzltWm5ObGRDQjhJREJjYmlBZ2FXWWdLQ0Z1YjBGemMyVnlkQ2tnWTJobFkydEpiblFvZEdocGN5d2dkbUZzZFdVc0lHOW1abk5sZEN3Z01pd2dNSGhtWm1abUxDQXdLVnh1SUNCcFppQW9RblZtWm1WeUxsUlpVRVZFWDBGU1VrRlpYMU5WVUZCUFVsUXBJSHRjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkRjBnUFNCMllXeDFaVnh1SUNBZ0lIUm9hWE5iYjJabWMyVjBJQ3NnTVYwZ1BTQW9kbUZzZFdVZ1BqNCtJRGdwWEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnYjJKcVpXTjBWM0pwZEdWVlNXNTBNVFlvZEdocGN5d2dkbUZzZFdVc0lHOW1abk5sZEN3Z2RISjFaU2xjYmlBZ2ZWeHVJQ0J5WlhSMWNtNGdiMlptYzJWMElDc2dNbHh1ZlZ4dVhHNUNkV1ptWlhJdWNISnZkRzkwZVhCbExuZHlhWFJsVlVsdWRERTJRa1VnUFNCbWRXNWpkR2x2YmlCM2NtbDBaVlZKYm5ReE5rSkZJQ2gyWVd4MVpTd2diMlptYzJWMExDQnViMEZ6YzJWeWRDa2dlMXh1SUNCMllXeDFaU0E5SUN0MllXeDFaVnh1SUNCdlptWnpaWFFnUFNCdlptWnpaWFFnZkNBd1hHNGdJR2xtSUNnaGJtOUJjM05sY25RcElHTm9aV05yU1c1MEtIUm9hWE1zSUhaaGJIVmxMQ0J2Wm1aelpYUXNJRElzSURCNFptWm1aaXdnTUNsY2JpQWdhV1lnS0VKMVptWmxjaTVVV1ZCRlJGOUJVbEpCV1Y5VFZWQlFUMUpVS1NCN1hHNGdJQ0FnZEdocGMxdHZabVp6WlhSZElEMGdLSFpoYkhWbElENCtQaUE0S1Z4dUlDQWdJSFJvYVhOYmIyWm1jMlYwSUNzZ01WMGdQU0IyWVd4MVpWeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lHOWlhbVZqZEZkeWFYUmxWVWx1ZERFMktIUm9hWE1zSUhaaGJIVmxMQ0J2Wm1aelpYUXNJR1poYkhObEtWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCdlptWnpaWFFnS3lBeVhHNTlYRzVjYm1aMWJtTjBhVzl1SUc5aWFtVmpkRmR5YVhSbFZVbHVkRE15SUNoaWRXWXNJSFpoYkhWbExDQnZabVp6WlhRc0lHeHBkSFJzWlVWdVpHbGhiaWtnZTF4dUlDQnBaaUFvZG1Gc2RXVWdQQ0F3S1NCMllXeDFaU0E5SURCNFptWm1abVptWm1ZZ0t5QjJZV3gxWlNBcklERmNiaUFnWm05eUlDaDJZWElnYVNBOUlEQXNJR29nUFNCTllYUm9MbTFwYmloaWRXWXViR1Z1WjNSb0lDMGdiMlptYzJWMExDQTBLVHNnYVNBOElHbzdJR2tyS3lrZ2UxeHVJQ0FnSUdKMVpsdHZabVp6WlhRZ0t5QnBYU0E5SUNoMllXeDFaU0ErUGo0Z0tHeHBkSFJzWlVWdVpHbGhiaUEvSUdrZ09pQXpJQzBnYVNrZ0tpQTRLU0FtSURCNFptWmNiaUFnZlZ4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbmR5YVhSbFZVbHVkRE15VEVVZ1BTQm1kVzVqZEdsdmJpQjNjbWwwWlZWSmJuUXpNa3hGSUNoMllXeDFaU3dnYjJabWMyVjBMQ0J1YjBGemMyVnlkQ2tnZTF4dUlDQjJZV3gxWlNBOUlDdDJZV3gxWlZ4dUlDQnZabVp6WlhRZ1BTQnZabVp6WlhRZ2ZDQXdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJR05vWldOclNXNTBLSFJvYVhNc0lIWmhiSFZsTENCdlptWnpaWFFzSURRc0lEQjRabVptWm1abVptWXNJREFwWEc0Z0lHbG1JQ2hDZFdabVpYSXVWRmxRUlVSZlFWSlNRVmxmVTFWUVVFOVNWQ2tnZTF4dUlDQWdJSFJvYVhOYmIyWm1jMlYwSUNzZ00xMGdQU0FvZG1Gc2RXVWdQajQrSURJMEtWeHVJQ0FnSUhSb2FYTmJiMlptYzJWMElDc2dNbDBnUFNBb2RtRnNkV1VnUGo0K0lERTJLVnh1SUNBZ0lIUm9hWE5iYjJabWMyVjBJQ3NnTVYwZ1BTQW9kbUZzZFdVZ1BqNCtJRGdwWEc0Z0lDQWdkR2hwYzF0dlptWnpaWFJkSUQwZ2RtRnNkV1ZjYmlBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0J2WW1wbFkzUlhjbWwwWlZWSmJuUXpNaWgwYUdsekxDQjJZV3gxWlN3Z2IyWm1jMlYwTENCMGNuVmxLVnh1SUNCOVhHNGdJSEpsZEhWeWJpQnZabVp6WlhRZ0t5QTBYRzU5WEc1Y2JrSjFabVpsY2k1d2NtOTBiM1I1Y0dVdWQzSnBkR1ZWU1c1ME16SkNSU0E5SUdaMWJtTjBhVzl1SUhkeWFYUmxWVWx1ZERNeVFrVWdLSFpoYkhWbExDQnZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUhaaGJIVmxJRDBnSzNaaGJIVmxYRzRnSUc5bVpuTmxkQ0E5SUc5bVpuTmxkQ0I4SURCY2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRKYm5Rb2RHaHBjeXdnZG1Gc2RXVXNJRzltWm5ObGRDd2dOQ3dnTUhobVptWm1abVptWml3Z01DbGNiaUFnYVdZZ0tFSjFabVpsY2k1VVdWQkZSRjlCVWxKQldWOVRWVkJRVDFKVUtTQjdYRzRnSUNBZ2RHaHBjMXR2Wm1aelpYUmRJRDBnS0haaGJIVmxJRDQrUGlBeU5DbGNiaUFnSUNCMGFHbHpXMjltWm5ObGRDQXJJREZkSUQwZ0tIWmhiSFZsSUQ0K1BpQXhOaWxjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkQ0FySURKZElEMGdLSFpoYkhWbElENCtQaUE0S1Z4dUlDQWdJSFJvYVhOYmIyWm1jMlYwSUNzZ00xMGdQU0IyWVd4MVpWeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lHOWlhbVZqZEZkeWFYUmxWVWx1ZERNeUtIUm9hWE1zSUhaaGJIVmxMQ0J2Wm1aelpYUXNJR1poYkhObEtWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCdlptWnpaWFFnS3lBMFhHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1ZDNKcGRHVkpiblJNUlNBOUlHWjFibU4wYVc5dUlIZHlhWFJsU1c1MFRFVWdLSFpoYkhWbExDQnZabVp6WlhRc0lHSjVkR1ZNWlc1bmRHZ3NJRzV2UVhOelpYSjBLU0I3WEc0Z0lIWmhiSFZsSUQwZ0szWmhiSFZsWEc0Z0lHOW1abk5sZENBOUlHOW1abk5sZENCOElEQmNiaUFnYVdZZ0tDRnViMEZ6YzJWeWRDa2dlMXh1SUNBZ0lIWmhjaUJzYVcxcGRDQTlJRTFoZEdndWNHOTNLRElzSURnZ0tpQmllWFJsVEdWdVozUm9JQzBnTVNsY2JseHVJQ0FnSUdOb1pXTnJTVzUwS0hSb2FYTXNJSFpoYkhWbExDQnZabVp6WlhRc0lHSjVkR1ZNWlc1bmRHZ3NJR3hwYldsMElDMGdNU3dnTFd4cGJXbDBLVnh1SUNCOVhHNWNiaUFnZG1GeUlHa2dQU0F3WEc0Z0lIWmhjaUJ0ZFd3Z1BTQXhYRzRnSUhaaGNpQnpkV0lnUFNCMllXeDFaU0E4SURBZ1B5QXhJRG9nTUZ4dUlDQjBhR2x6VzI5bVpuTmxkRjBnUFNCMllXeDFaU0FtSURCNFJrWmNiaUFnZDJocGJHVWdLQ3NyYVNBOElHSjVkR1ZNWlc1bmRHZ2dKaVlnS0cxMWJDQXFQU0F3ZURFd01Da3BJSHRjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkQ0FySUdsZElEMGdLQ2gyWVd4MVpTQXZJRzExYkNrZ1BqNGdNQ2tnTFNCemRXSWdKaUF3ZUVaR1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2IyWm1jMlYwSUNzZ1lubDBaVXhsYm1kMGFGeHVmVnh1WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5keWFYUmxTVzUwUWtVZ1BTQm1kVzVqZEdsdmJpQjNjbWwwWlVsdWRFSkZJQ2gyWVd4MVpTd2diMlptYzJWMExDQmllWFJsVEdWdVozUm9MQ0J1YjBGemMyVnlkQ2tnZTF4dUlDQjJZV3gxWlNBOUlDdDJZV3gxWlZ4dUlDQnZabVp6WlhRZ1BTQnZabVp6WlhRZ2ZDQXdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJSHRjYmlBZ0lDQjJZWElnYkdsdGFYUWdQU0JOWVhSb0xuQnZkeWd5TENBNElDb2dZbmwwWlV4bGJtZDBhQ0F0SURFcFhHNWNiaUFnSUNCamFHVmphMGx1ZENoMGFHbHpMQ0IyWVd4MVpTd2diMlptYzJWMExDQmllWFJsVEdWdVozUm9MQ0JzYVcxcGRDQXRJREVzSUMxc2FXMXBkQ2xjYmlBZ2ZWeHVYRzRnSUhaaGNpQnBJRDBnWW5sMFpVeGxibWQwYUNBdElERmNiaUFnZG1GeUlHMTFiQ0E5SURGY2JpQWdkbUZ5SUhOMVlpQTlJSFpoYkhWbElEd2dNQ0EvSURFZ09pQXdYRzRnSUhSb2FYTmJiMlptYzJWMElDc2dhVjBnUFNCMllXeDFaU0FtSURCNFJrWmNiaUFnZDJocGJHVWdLQzB0YVNBK1BTQXdJQ1ltSUNodGRXd2dLajBnTUhneE1EQXBLU0I3WEc0Z0lDQWdkR2hwYzF0dlptWnpaWFFnS3lCcFhTQTlJQ2dvZG1Gc2RXVWdMeUJ0ZFd3cElENCtJREFwSUMwZ2MzVmlJQ1lnTUhoR1JseHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlHOW1abk5sZENBcklHSjVkR1ZNWlc1bmRHaGNibjFjYmx4dVFuVm1abVZ5TG5CeWIzUnZkSGx3WlM1M2NtbDBaVWx1ZERnZ1BTQm1kVzVqZEdsdmJpQjNjbWwwWlVsdWREZ2dLSFpoYkhWbExDQnZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUhaaGJIVmxJRDBnSzNaaGJIVmxYRzRnSUc5bVpuTmxkQ0E5SUc5bVpuTmxkQ0I4SURCY2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRKYm5Rb2RHaHBjeXdnZG1Gc2RXVXNJRzltWm5ObGRDd2dNU3dnTUhnM1ppd2dMVEI0T0RBcFhHNGdJR2xtSUNnaFFuVm1abVZ5TGxSWlVFVkVYMEZTVWtGWlgxTlZVRkJQVWxRcElIWmhiSFZsSUQwZ1RXRjBhQzVtYkc5dmNpaDJZV3gxWlNsY2JpQWdhV1lnS0haaGJIVmxJRHdnTUNrZ2RtRnNkV1VnUFNBd2VHWm1JQ3NnZG1Gc2RXVWdLeUF4WEc0Z0lIUm9hWE5iYjJabWMyVjBYU0E5SUhaaGJIVmxYRzRnSUhKbGRIVnliaUJ2Wm1aelpYUWdLeUF4WEc1OVhHNWNia0oxWm1abGNpNXdjbTkwYjNSNWNHVXVkM0pwZEdWSmJuUXhOa3hGSUQwZ1puVnVZM1JwYjI0Z2QzSnBkR1ZKYm5ReE5reEZJQ2gyWVd4MVpTd2diMlptYzJWMExDQnViMEZ6YzJWeWRDa2dlMXh1SUNCMllXeDFaU0E5SUN0MllXeDFaVnh1SUNCdlptWnpaWFFnUFNCdlptWnpaWFFnZkNBd1hHNGdJR2xtSUNnaGJtOUJjM05sY25RcElHTm9aV05yU1c1MEtIUm9hWE1zSUhaaGJIVmxMQ0J2Wm1aelpYUXNJRElzSURCNE4yWm1aaXdnTFRCNE9EQXdNQ2xjYmlBZ2FXWWdLRUoxWm1abGNpNVVXVkJGUkY5QlVsSkJXVjlUVlZCUVQxSlVLU0I3WEc0Z0lDQWdkR2hwYzF0dlptWnpaWFJkSUQwZ2RtRnNkV1ZjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkQ0FySURGZElEMGdLSFpoYkhWbElENCtQaUE0S1Z4dUlDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUc5aWFtVmpkRmR5YVhSbFZVbHVkREUyS0hSb2FYTXNJSFpoYkhWbExDQnZabVp6WlhRc0lIUnlkV1VwWEc0Z0lIMWNiaUFnY21WMGRYSnVJRzltWm5ObGRDQXJJREpjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNTNjbWwwWlVsdWRERTJRa1VnUFNCbWRXNWpkR2x2YmlCM2NtbDBaVWx1ZERFMlFrVWdLSFpoYkhWbExDQnZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUhaaGJIVmxJRDBnSzNaaGJIVmxYRzRnSUc5bVpuTmxkQ0E5SUc5bVpuTmxkQ0I4SURCY2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRKYm5Rb2RHaHBjeXdnZG1Gc2RXVXNJRzltWm5ObGRDd2dNaXdnTUhnM1ptWm1MQ0F0TUhnNE1EQXdLVnh1SUNCcFppQW9RblZtWm1WeUxsUlpVRVZFWDBGU1VrRlpYMU5WVUZCUFVsUXBJSHRjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkRjBnUFNBb2RtRnNkV1VnUGo0K0lEZ3BYRzRnSUNBZ2RHaHBjMXR2Wm1aelpYUWdLeUF4WFNBOUlIWmhiSFZsWEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnYjJKcVpXTjBWM0pwZEdWVlNXNTBNVFlvZEdocGN5d2dkbUZzZFdVc0lHOW1abk5sZEN3Z1ptRnNjMlVwWEc0Z0lIMWNiaUFnY21WMGRYSnVJRzltWm5ObGRDQXJJREpjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNTNjbWwwWlVsdWRETXlURVVnUFNCbWRXNWpkR2x2YmlCM2NtbDBaVWx1ZERNeVRFVWdLSFpoYkhWbExDQnZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUhaaGJIVmxJRDBnSzNaaGJIVmxYRzRnSUc5bVpuTmxkQ0E5SUc5bVpuTmxkQ0I4SURCY2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRKYm5Rb2RHaHBjeXdnZG1Gc2RXVXNJRzltWm5ObGRDd2dOQ3dnTUhnM1ptWm1abVptWml3Z0xUQjRPREF3TURBd01EQXBYRzRnSUdsbUlDaENkV1ptWlhJdVZGbFFSVVJmUVZKU1FWbGZVMVZRVUU5U1ZDa2dlMXh1SUNBZ0lIUm9hWE5iYjJabWMyVjBYU0E5SUhaaGJIVmxYRzRnSUNBZ2RHaHBjMXR2Wm1aelpYUWdLeUF4WFNBOUlDaDJZV3gxWlNBK1BqNGdPQ2xjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkQ0FySURKZElEMGdLSFpoYkhWbElENCtQaUF4TmlsY2JpQWdJQ0IwYUdselcyOW1abk5sZENBcklETmRJRDBnS0haaGJIVmxJRDQrUGlBeU5DbGNiaUFnZlNCbGJITmxJSHRjYmlBZ0lDQnZZbXBsWTNSWGNtbDBaVlZKYm5Rek1paDBhR2x6TENCMllXeDFaU3dnYjJabWMyVjBMQ0IwY25WbEtWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCdlptWnpaWFFnS3lBMFhHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1ZDNKcGRHVkpiblF6TWtKRklEMGdablZ1WTNScGIyNGdkM0pwZEdWSmJuUXpNa0pGSUNoMllXeDFaU3dnYjJabWMyVjBMQ0J1YjBGemMyVnlkQ2tnZTF4dUlDQjJZV3gxWlNBOUlDdDJZV3gxWlZ4dUlDQnZabVp6WlhRZ1BTQnZabVp6WlhRZ2ZDQXdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJR05vWldOclNXNTBLSFJvYVhNc0lIWmhiSFZsTENCdlptWnpaWFFzSURRc0lEQjROMlptWm1abVptWXNJQzB3ZURnd01EQXdNREF3S1Z4dUlDQnBaaUFvZG1Gc2RXVWdQQ0F3S1NCMllXeDFaU0E5SURCNFptWm1abVptWm1ZZ0t5QjJZV3gxWlNBcklERmNiaUFnYVdZZ0tFSjFabVpsY2k1VVdWQkZSRjlCVWxKQldWOVRWVkJRVDFKVUtTQjdYRzRnSUNBZ2RHaHBjMXR2Wm1aelpYUmRJRDBnS0haaGJIVmxJRDQrUGlBeU5DbGNiaUFnSUNCMGFHbHpXMjltWm5ObGRDQXJJREZkSUQwZ0tIWmhiSFZsSUQ0K1BpQXhOaWxjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkQ0FySURKZElEMGdLSFpoYkhWbElENCtQaUE0S1Z4dUlDQWdJSFJvYVhOYmIyWm1jMlYwSUNzZ00xMGdQU0IyWVd4MVpWeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lHOWlhbVZqZEZkeWFYUmxWVWx1ZERNeUtIUm9hWE1zSUhaaGJIVmxMQ0J2Wm1aelpYUXNJR1poYkhObEtWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCdlptWnpaWFFnS3lBMFhHNTlYRzVjYm1aMWJtTjBhVzl1SUdOb1pXTnJTVVZGUlRjMU5DQW9ZblZtTENCMllXeDFaU3dnYjJabWMyVjBMQ0JsZUhRc0lHMWhlQ3dnYldsdUtTQjdYRzRnSUdsbUlDaDJZV3gxWlNBK0lHMWhlQ0I4ZkNCMllXeDFaU0E4SUcxcGJpa2dkR2h5YjNjZ2JtVjNJRkpoYm1kbFJYSnliM0lvSjNaaGJIVmxJR2x6SUc5MWRDQnZaaUJpYjNWdVpITW5LVnh1SUNCcFppQW9iMlptYzJWMElDc2daWGgwSUQ0Z1luVm1MbXhsYm1kMGFDa2dkR2h5YjNjZ2JtVjNJRkpoYm1kbFJYSnliM0lvSjJsdVpHVjRJRzkxZENCdlppQnlZVzVuWlNjcFhHNGdJR2xtSUNodlptWnpaWFFnUENBd0tTQjBhSEp2ZHlCdVpYY2dVbUZ1WjJWRmNuSnZjaWduYVc1a1pYZ2diM1YwSUc5bUlISmhibWRsSnlsY2JuMWNibHh1Wm5WdVkzUnBiMjRnZDNKcGRHVkdiRzloZENBb1luVm1MQ0IyWVd4MVpTd2diMlptYzJWMExDQnNhWFIwYkdWRmJtUnBZVzRzSUc1dlFYTnpaWEowS1NCN1hHNGdJR2xtSUNnaGJtOUJjM05sY25RcElIdGNiaUFnSUNCamFHVmphMGxGUlVVM05UUW9ZblZtTENCMllXeDFaU3dnYjJabWMyVjBMQ0EwTENBekxqUXdNamd5TXpRMk5qTTROVEk0T0RabEt6TTRMQ0F0TXk0ME1ESTRNak0wTmpZek9EVXlPRGcyWlNzek9DbGNiaUFnZlZ4dUlDQnBaV1ZsTnpVMExuZHlhWFJsS0dKMVppd2dkbUZzZFdVc0lHOW1abk5sZEN3Z2JHbDBkR3hsUlc1a2FXRnVMQ0F5TXl3Z05DbGNiaUFnY21WMGRYSnVJRzltWm5ObGRDQXJJRFJjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNTNjbWwwWlVac2IyRjBURVVnUFNCbWRXNWpkR2x2YmlCM2NtbDBaVVpzYjJGMFRFVWdLSFpoYkhWbExDQnZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUhKbGRIVnliaUIzY21sMFpVWnNiMkYwS0hSb2FYTXNJSFpoYkhWbExDQnZabVp6WlhRc0lIUnlkV1VzSUc1dlFYTnpaWEowS1Z4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbmR5YVhSbFJteHZZWFJDUlNBOUlHWjFibU4wYVc5dUlIZHlhWFJsUm14dllYUkNSU0FvZG1Gc2RXVXNJRzltWm5ObGRDd2dibTlCYzNObGNuUXBJSHRjYmlBZ2NtVjBkWEp1SUhkeWFYUmxSbXh2WVhRb2RHaHBjeXdnZG1Gc2RXVXNJRzltWm5ObGRDd2dabUZzYzJVc0lHNXZRWE56WlhKMEtWeHVmVnh1WEc1bWRXNWpkR2x2YmlCM2NtbDBaVVJ2ZFdKc1pTQW9ZblZtTENCMllXeDFaU3dnYjJabWMyVjBMQ0JzYVhSMGJHVkZibVJwWVc0c0lHNXZRWE56WlhKMEtTQjdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJSHRjYmlBZ0lDQmphR1ZqYTBsRlJVVTNOVFFvWW5WbUxDQjJZV3gxWlN3Z2IyWm1jMlYwTENBNExDQXhMamM1TnpZNU16RXpORGcyTWpNeE5UZEZLek13T0N3Z0xURXVOemszTmprek1UTTBPRFl5TXpFMU4wVXJNekE0S1Z4dUlDQjlYRzRnSUdsbFpXVTNOVFF1ZDNKcGRHVW9ZblZtTENCMllXeDFaU3dnYjJabWMyVjBMQ0JzYVhSMGJHVkZibVJwWVc0c0lEVXlMQ0E0S1Z4dUlDQnlaWFIxY200Z2IyWm1jMlYwSUNzZ09GeHVmVnh1WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5keWFYUmxSRzkxWW14bFRFVWdQU0JtZFc1amRHbHZiaUIzY21sMFpVUnZkV0pzWlV4RklDaDJZV3gxWlN3Z2IyWm1jMlYwTENCdWIwRnpjMlZ5ZENrZ2UxeHVJQ0J5WlhSMWNtNGdkM0pwZEdWRWIzVmliR1VvZEdocGN5d2dkbUZzZFdVc0lHOW1abk5sZEN3Z2RISjFaU3dnYm05QmMzTmxjblFwWEc1OVhHNWNia0oxWm1abGNpNXdjbTkwYjNSNWNHVXVkM0pwZEdWRWIzVmliR1ZDUlNBOUlHWjFibU4wYVc5dUlIZHlhWFJsUkc5MVlteGxRa1VnS0haaGJIVmxMQ0J2Wm1aelpYUXNJRzV2UVhOelpYSjBLU0I3WEc0Z0lISmxkSFZ5YmlCM2NtbDBaVVJ2ZFdKc1pTaDBhR2x6TENCMllXeDFaU3dnYjJabWMyVjBMQ0JtWVd4elpTd2dibTlCYzNObGNuUXBYRzU5WEc1Y2JpOHZJR052Y0hrb2RHRnlaMlYwUW5WbVptVnlMQ0IwWVhKblpYUlRkR0Z5ZEQwd0xDQnpiM1Z5WTJWVGRHRnlkRDB3TENCemIzVnlZMlZGYm1ROVluVm1abVZ5TG14bGJtZDBhQ2xjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1WTI5d2VTQTlJR1oxYm1OMGFXOXVJR052Y0hrZ0tIUmhjbWRsZEN3Z2RHRnlaMlYwVTNSaGNuUXNJSE4wWVhKMExDQmxibVFwSUh0Y2JpQWdhV1lnS0NGemRHRnlkQ2tnYzNSaGNuUWdQU0F3WEc0Z0lHbG1JQ2doWlc1a0lDWW1JR1Z1WkNBaFBUMGdNQ2tnWlc1a0lEMGdkR2hwY3k1c1pXNW5kR2hjYmlBZ2FXWWdLSFJoY21kbGRGTjBZWEowSUQ0OUlIUmhjbWRsZEM1c1pXNW5kR2dwSUhSaGNtZGxkRk4wWVhKMElEMGdkR0Z5WjJWMExteGxibWQwYUZ4dUlDQnBaaUFvSVhSaGNtZGxkRk4wWVhKMEtTQjBZWEpuWlhSVGRHRnlkQ0E5SURCY2JpQWdhV1lnS0dWdVpDQStJREFnSmlZZ1pXNWtJRHdnYzNSaGNuUXBJR1Z1WkNBOUlITjBZWEowWEc1Y2JpQWdMeThnUTI5d2VTQXdJR0o1ZEdWek95QjNaU2R5WlNCa2IyNWxYRzRnSUdsbUlDaGxibVFnUFQwOUlITjBZWEowS1NCeVpYUjFjbTRnTUZ4dUlDQnBaaUFvZEdGeVoyVjBMbXhsYm1kMGFDQTlQVDBnTUNCOGZDQjBhR2x6TG14bGJtZDBhQ0E5UFQwZ01Da2djbVYwZFhKdUlEQmNibHh1SUNBdkx5QkdZWFJoYkNCbGNuSnZjaUJqYjI1a2FYUnBiMjV6WEc0Z0lHbG1JQ2gwWVhKblpYUlRkR0Z5ZENBOElEQXBJSHRjYmlBZ0lDQjBhSEp2ZHlCdVpYY2dVbUZ1WjJWRmNuSnZjaWduZEdGeVoyVjBVM1JoY25RZ2IzVjBJRzltSUdKdmRXNWtjeWNwWEc0Z0lIMWNiaUFnYVdZZ0tITjBZWEowSUR3Z01DQjhmQ0J6ZEdGeWRDQStQU0IwYUdsekxteGxibWQwYUNrZ2RHaHliM2NnYm1WM0lGSmhibWRsUlhKeWIzSW9KM052ZFhKalpWTjBZWEowSUc5MWRDQnZaaUJpYjNWdVpITW5LVnh1SUNCcFppQW9aVzVrSUR3Z01Da2dkR2h5YjNjZ2JtVjNJRkpoYm1kbFJYSnliM0lvSjNOdmRYSmpaVVZ1WkNCdmRYUWdiMllnWW05MWJtUnpKeWxjYmx4dUlDQXZMeUJCY21VZ2QyVWdiMjlpUDF4dUlDQnBaaUFvWlc1a0lENGdkR2hwY3k1c1pXNW5kR2dwSUdWdVpDQTlJSFJvYVhNdWJHVnVaM1JvWEc0Z0lHbG1JQ2gwWVhKblpYUXViR1Z1WjNSb0lDMGdkR0Z5WjJWMFUzUmhjblFnUENCbGJtUWdMU0J6ZEdGeWRDa2dlMXh1SUNBZ0lHVnVaQ0E5SUhSaGNtZGxkQzVzWlc1bmRHZ2dMU0IwWVhKblpYUlRkR0Z5ZENBcklITjBZWEowWEc0Z0lIMWNibHh1SUNCMllYSWdiR1Z1SUQwZ1pXNWtJQzBnYzNSaGNuUmNiaUFnZG1GeUlHbGNibHh1SUNCcFppQW9kR2hwY3lBOVBUMGdkR0Z5WjJWMElDWW1JSE4wWVhKMElEd2dkR0Z5WjJWMFUzUmhjblFnSmlZZ2RHRnlaMlYwVTNSaGNuUWdQQ0JsYm1RcElIdGNiaUFnSUNBdkx5QmtaWE5qWlc1a2FXNW5JR052Y0hrZ1puSnZiU0JsYm1SY2JpQWdJQ0JtYjNJZ0tHa2dQU0JzWlc0Z0xTQXhPeUJwSUQ0OUlEQTdJR2t0TFNrZ2UxeHVJQ0FnSUNBZ2RHRnlaMlYwVzJrZ0t5QjBZWEpuWlhSVGRHRnlkRjBnUFNCMGFHbHpXMmtnS3lCemRHRnlkRjFjYmlBZ0lDQjlYRzRnSUgwZ1pXeHpaU0JwWmlBb2JHVnVJRHdnTVRBd01DQjhmQ0FoUW5WbVptVnlMbFJaVUVWRVgwRlNVa0ZaWDFOVlVGQlBVbFFwSUh0Y2JpQWdJQ0F2THlCaGMyTmxibVJwYm1jZ1kyOXdlU0JtY205dElITjBZWEowWEc0Z0lDQWdabTl5SUNocElEMGdNRHNnYVNBOElHeGxianNnYVNzcktTQjdYRzRnSUNBZ0lDQjBZWEpuWlhSYmFTQXJJSFJoY21kbGRGTjBZWEowWFNBOUlIUm9hWE5iYVNBcklITjBZWEowWFZ4dUlDQWdJSDFjYmlBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0IwWVhKblpYUXVYM05sZENoMGFHbHpMbk4xWW1GeWNtRjVLSE4wWVhKMExDQnpkR0Z5ZENBcklHeGxiaWtzSUhSaGNtZGxkRk4wWVhKMEtWeHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlHeGxibHh1ZlZ4dVhHNHZMeUJtYVd4c0tIWmhiSFZsTENCemRHRnlkRDB3TENCbGJtUTlZblZtWm1WeUxteGxibWQwYUNsY2JrSjFabVpsY2k1d2NtOTBiM1I1Y0dVdVptbHNiQ0E5SUdaMWJtTjBhVzl1SUdacGJHd2dLSFpoYkhWbExDQnpkR0Z5ZEN3Z1pXNWtLU0I3WEc0Z0lHbG1JQ2doZG1Gc2RXVXBJSFpoYkhWbElEMGdNRnh1SUNCcFppQW9JWE4wWVhKMEtTQnpkR0Z5ZENBOUlEQmNiaUFnYVdZZ0tDRmxibVFwSUdWdVpDQTlJSFJvYVhNdWJHVnVaM1JvWEc1Y2JpQWdhV1lnS0dWdVpDQThJSE4wWVhKMEtTQjBhSEp2ZHlCdVpYY2dVbUZ1WjJWRmNuSnZjaWduWlc1a0lEd2djM1JoY25RbktWeHVYRzRnSUM4dklFWnBiR3dnTUNCaWVYUmxjenNnZDJVbmNtVWdaRzl1WlZ4dUlDQnBaaUFvWlc1a0lEMDlQU0J6ZEdGeWRDa2djbVYwZFhKdVhHNGdJR2xtSUNoMGFHbHpMbXhsYm1kMGFDQTlQVDBnTUNrZ2NtVjBkWEp1WEc1Y2JpQWdhV1lnS0hOMFlYSjBJRHdnTUNCOGZDQnpkR0Z5ZENBK1BTQjBhR2x6TG14bGJtZDBhQ2tnZEdoeWIzY2dibVYzSUZKaGJtZGxSWEp5YjNJb0ozTjBZWEowSUc5MWRDQnZaaUJpYjNWdVpITW5LVnh1SUNCcFppQW9aVzVrSUR3Z01DQjhmQ0JsYm1RZ1BpQjBhR2x6TG14bGJtZDBhQ2tnZEdoeWIzY2dibVYzSUZKaGJtZGxSWEp5YjNJb0oyVnVaQ0J2ZFhRZ2IyWWdZbTkxYm1Sekp5bGNibHh1SUNCMllYSWdhVnh1SUNCcFppQW9kSGx3Wlc5bUlIWmhiSFZsSUQwOVBTQW5iblZ0WW1WeUp5a2dlMXh1SUNBZ0lHWnZjaUFvYVNBOUlITjBZWEowT3lCcElEd2daVzVrT3lCcEt5c3BJSHRjYmlBZ0lDQWdJSFJvYVhOYmFWMGdQU0IyWVd4MVpWeHVJQ0FnSUgxY2JpQWdmU0JsYkhObElIdGNiaUFnSUNCMllYSWdZbmwwWlhNZ1BTQjFkR1k0Vkc5Q2VYUmxjeWgyWVd4MVpTNTBiMU4wY21sdVp5Z3BLVnh1SUNBZ0lIWmhjaUJzWlc0Z1BTQmllWFJsY3k1c1pXNW5kR2hjYmlBZ0lDQm1iM0lnS0drZ1BTQnpkR0Z5ZERzZ2FTQThJR1Z1WkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0IwYUdselcybGRJRDBnWW5sMFpYTmJhU0FsSUd4bGJsMWNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2RHaHBjMXh1ZlZ4dVhHNHZLaXBjYmlBcUlFTnlaV0YwWlhNZ1lTQnVaWGNnWUVGeWNtRjVRblZtWm1WeVlDQjNhWFJvSUhSb1pTQXFZMjl3YVdWa0tpQnRaVzF2Y25rZ2IyWWdkR2hsSUdKMVptWmxjaUJwYm5OMFlXNWpaUzVjYmlBcUlFRmtaR1ZrSUdsdUlFNXZaR1VnTUM0eE1pNGdUMjVzZVNCaGRtRnBiR0ZpYkdVZ2FXNGdZbkp2ZDNObGNuTWdkR2hoZENCemRYQndiM0owSUVGeWNtRjVRblZtWm1WeUxseHVJQ292WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5SdlFYSnlZWGxDZFdabVpYSWdQU0JtZFc1amRHbHZiaUIwYjBGeWNtRjVRblZtWm1WeUlDZ3BJSHRjYmlBZ2FXWWdLSFI1Y0dWdlppQlZhVzUwT0VGeWNtRjVJQ0U5UFNBbmRXNWtaV1pwYm1Wa0p5a2dlMXh1SUNBZ0lHbG1JQ2hDZFdabVpYSXVWRmxRUlVSZlFWSlNRVmxmVTFWUVVFOVNWQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJQ2h1WlhjZ1FuVm1abVZ5S0hSb2FYTXBLUzVpZFdabVpYSmNiaUFnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnZG1GeUlHSjFaaUE5SUc1bGR5QlZhVzUwT0VGeWNtRjVLSFJvYVhNdWJHVnVaM1JvS1Z4dUlDQWdJQ0FnWm05eUlDaDJZWElnYVNBOUlEQXNJR3hsYmlBOUlHSjFaaTVzWlc1bmRHZzdJR2tnUENCc1pXNDdJR2tnS3owZ01Ta2dlMXh1SUNBZ0lDQWdJQ0JpZFdaYmFWMGdQU0IwYUdselcybGRYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQnlaWFIxY200Z1luVm1MbUoxWm1abGNseHVJQ0FnSUgxY2JpQWdmU0JsYkhObElIdGNiaUFnSUNCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtDZENkV1ptWlhJdWRHOUJjbkpoZVVKMVptWmxjaUJ1YjNRZ2MzVndjRzl5ZEdWa0lHbHVJSFJvYVhNZ1luSnZkM05sY2ljcFhHNGdJSDFjYm4xY2JseHVMeThnU0VWTVVFVlNJRVpWVGtOVVNVOU9VMXh1THk4Z1BUMDlQVDA5UFQwOVBUMDlQVDA5UFZ4dVhHNTJZWElnUWxBZ1BTQkNkV1ptWlhJdWNISnZkRzkwZVhCbFhHNWNiaThxS2x4dUlDb2dRWFZuYldWdWRDQmhJRlZwYm5RNFFYSnlZWGtnS21sdWMzUmhibU5sS2lBb2JtOTBJSFJvWlNCVmFXNTBPRUZ5Y21GNUlHTnNZWE56SVNrZ2QybDBhQ0JDZFdabVpYSWdiV1YwYUc5a2MxeHVJQ292WEc1Q2RXWm1aWEl1WDJGMVoyMWxiblFnUFNCbWRXNWpkR2x2YmlCZllYVm5iV1Z1ZENBb1lYSnlLU0I3WEc0Z0lHRnljaTVqYjI1emRISjFZM1J2Y2lBOUlFSjFabVpsY2x4dUlDQmhjbkl1WDJselFuVm1abVZ5SUQwZ2RISjFaVnh1WEc0Z0lDOHZJSE5oZG1VZ2NtVm1aWEpsYm1ObElIUnZJRzl5YVdkcGJtRnNJRlZwYm5RNFFYSnlZWGtnYzJWMElHMWxkR2h2WkNCaVpXWnZjbVVnYjNabGNuZHlhWFJwYm1kY2JpQWdZWEp5TGw5elpYUWdQU0JoY25JdWMyVjBYRzVjYmlBZ0x5OGdaR1Z3Y21WallYUmxaRnh1SUNCaGNuSXVaMlYwSUQwZ1FsQXVaMlYwWEc0Z0lHRnljaTV6WlhRZ1BTQkNVQzV6WlhSY2JseHVJQ0JoY25JdWQzSnBkR1VnUFNCQ1VDNTNjbWwwWlZ4dUlDQmhjbkl1ZEc5VGRISnBibWNnUFNCQ1VDNTBiMU4wY21sdVoxeHVJQ0JoY25JdWRHOU1iMk5oYkdWVGRISnBibWNnUFNCQ1VDNTBiMU4wY21sdVoxeHVJQ0JoY25JdWRHOUtVMDlPSUQwZ1FsQXVkRzlLVTA5T1hHNGdJR0Z5Y2k1bGNYVmhiSE1nUFNCQ1VDNWxjWFZoYkhOY2JpQWdZWEp5TG1OdmJYQmhjbVVnUFNCQ1VDNWpiMjF3WVhKbFhHNGdJR0Z5Y2k1cGJtUmxlRTltSUQwZ1FsQXVhVzVrWlhoUFpseHVJQ0JoY25JdVkyOXdlU0E5SUVKUUxtTnZjSGxjYmlBZ1lYSnlMbk5zYVdObElEMGdRbEF1YzJ4cFkyVmNiaUFnWVhKeUxuSmxZV1JWU1c1MFRFVWdQU0JDVUM1eVpXRmtWVWx1ZEV4RlhHNGdJR0Z5Y2k1eVpXRmtWVWx1ZEVKRklEMGdRbEF1Y21WaFpGVkpiblJDUlZ4dUlDQmhjbkl1Y21WaFpGVkpiblE0SUQwZ1FsQXVjbVZoWkZWSmJuUTRYRzRnSUdGeWNpNXlaV0ZrVlVsdWRERTJURVVnUFNCQ1VDNXlaV0ZrVlVsdWRERTJURVZjYmlBZ1lYSnlMbkpsWVdSVlNXNTBNVFpDUlNBOUlFSlFMbkpsWVdSVlNXNTBNVFpDUlZ4dUlDQmhjbkl1Y21WaFpGVkpiblF6TWt4RklEMGdRbEF1Y21WaFpGVkpiblF6TWt4RlhHNGdJR0Z5Y2k1eVpXRmtWVWx1ZERNeVFrVWdQU0JDVUM1eVpXRmtWVWx1ZERNeVFrVmNiaUFnWVhKeUxuSmxZV1JKYm5STVJTQTlJRUpRTG5KbFlXUkpiblJNUlZ4dUlDQmhjbkl1Y21WaFpFbHVkRUpGSUQwZ1FsQXVjbVZoWkVsdWRFSkZYRzRnSUdGeWNpNXlaV0ZrU1c1ME9DQTlJRUpRTG5KbFlXUkpiblE0WEc0Z0lHRnljaTV5WldGa1NXNTBNVFpNUlNBOUlFSlFMbkpsWVdSSmJuUXhOa3hGWEc0Z0lHRnljaTV5WldGa1NXNTBNVFpDUlNBOUlFSlFMbkpsWVdSSmJuUXhOa0pGWEc0Z0lHRnljaTV5WldGa1NXNTBNekpNUlNBOUlFSlFMbkpsWVdSSmJuUXpNa3hGWEc0Z0lHRnljaTV5WldGa1NXNTBNekpDUlNBOUlFSlFMbkpsWVdSSmJuUXpNa0pGWEc0Z0lHRnljaTV5WldGa1JteHZZWFJNUlNBOUlFSlFMbkpsWVdSR2JHOWhkRXhGWEc0Z0lHRnljaTV5WldGa1JteHZZWFJDUlNBOUlFSlFMbkpsWVdSR2JHOWhkRUpGWEc0Z0lHRnljaTV5WldGa1JHOTFZbXhsVEVVZ1BTQkNVQzV5WldGa1JHOTFZbXhsVEVWY2JpQWdZWEp5TG5KbFlXUkViM1ZpYkdWQ1JTQTlJRUpRTG5KbFlXUkViM1ZpYkdWQ1JWeHVJQ0JoY25JdWQzSnBkR1ZWU1c1ME9DQTlJRUpRTG5keWFYUmxWVWx1ZERoY2JpQWdZWEp5TG5keWFYUmxWVWx1ZEV4RklEMGdRbEF1ZDNKcGRHVlZTVzUwVEVWY2JpQWdZWEp5TG5keWFYUmxWVWx1ZEVKRklEMGdRbEF1ZDNKcGRHVlZTVzUwUWtWY2JpQWdZWEp5TG5keWFYUmxWVWx1ZERFMlRFVWdQU0JDVUM1M2NtbDBaVlZKYm5ReE5reEZYRzRnSUdGeWNpNTNjbWwwWlZWSmJuUXhOa0pGSUQwZ1FsQXVkM0pwZEdWVlNXNTBNVFpDUlZ4dUlDQmhjbkl1ZDNKcGRHVlZTVzUwTXpKTVJTQTlJRUpRTG5keWFYUmxWVWx1ZERNeVRFVmNiaUFnWVhKeUxuZHlhWFJsVlVsdWRETXlRa1VnUFNCQ1VDNTNjbWwwWlZWSmJuUXpNa0pGWEc0Z0lHRnljaTUzY21sMFpVbHVkRXhGSUQwZ1FsQXVkM0pwZEdWSmJuUk1SVnh1SUNCaGNuSXVkM0pwZEdWSmJuUkNSU0E5SUVKUUxuZHlhWFJsU1c1MFFrVmNiaUFnWVhKeUxuZHlhWFJsU1c1ME9DQTlJRUpRTG5keWFYUmxTVzUwT0Z4dUlDQmhjbkl1ZDNKcGRHVkpiblF4Tmt4RklEMGdRbEF1ZDNKcGRHVkpiblF4Tmt4RlhHNGdJR0Z5Y2k1M2NtbDBaVWx1ZERFMlFrVWdQU0JDVUM1M2NtbDBaVWx1ZERFMlFrVmNiaUFnWVhKeUxuZHlhWFJsU1c1ME16Sk1SU0E5SUVKUUxuZHlhWFJsU1c1ME16Sk1SVnh1SUNCaGNuSXVkM0pwZEdWSmJuUXpNa0pGSUQwZ1FsQXVkM0pwZEdWSmJuUXpNa0pGWEc0Z0lHRnljaTUzY21sMFpVWnNiMkYwVEVVZ1BTQkNVQzUzY21sMFpVWnNiMkYwVEVWY2JpQWdZWEp5TG5keWFYUmxSbXh2WVhSQ1JTQTlJRUpRTG5keWFYUmxSbXh2WVhSQ1JWeHVJQ0JoY25JdWQzSnBkR1ZFYjNWaWJHVk1SU0E5SUVKUUxuZHlhWFJsUkc5MVlteGxURVZjYmlBZ1lYSnlMbmR5YVhSbFJHOTFZbXhsUWtVZ1BTQkNVQzUzY21sMFpVUnZkV0pzWlVKRlhHNGdJR0Z5Y2k1bWFXeHNJRDBnUWxBdVptbHNiRnh1SUNCaGNuSXVhVzV6Y0dWamRDQTlJRUpRTG1sdWMzQmxZM1JjYmlBZ1lYSnlMblJ2UVhKeVlYbENkV1ptWlhJZ1BTQkNVQzUwYjBGeWNtRjVRblZtWm1WeVhHNWNiaUFnY21WMGRYSnVJR0Z5Y2x4dWZWeHVYRzUyWVhJZ1NVNVdRVXhKUkY5Q1FWTkZOalJmVWtVZ1BTQXZXMTRyWEZ3dk1DMDVRUzFhWVMxNkxWOWRMMmRjYmx4dVpuVnVZM1JwYjI0Z1ltRnpaVFkwWTJ4bFlXNGdLSE4wY2lrZ2UxeHVJQ0F2THlCT2IyUmxJSE4wY21sd2N5QnZkWFFnYVc1MllXeHBaQ0JqYUdGeVlXTjBaWEp6SUd4cGEyVWdYRnh1SUdGdVpDQmNYSFFnWm5KdmJTQjBhR1VnYzNSeWFXNW5MQ0JpWVhObE5qUXRhbk1nWkc5bGN5QnViM1JjYmlBZ2MzUnlJRDBnYzNSeWFXNW5kSEpwYlNoemRISXBMbkpsY0d4aFkyVW9TVTVXUVV4SlJGOUNRVk5GTmpSZlVrVXNJQ2NuS1Z4dUlDQXZMeUJPYjJSbElHTnZiblpsY25SeklITjBjbWx1WjNNZ2QybDBhQ0JzWlc1bmRHZ2dQQ0F5SUhSdklDY25YRzRnSUdsbUlDaHpkSEl1YkdWdVozUm9JRHdnTWlrZ2NtVjBkWEp1SUNjblhHNGdJQzh2SUU1dlpHVWdZV3hzYjNkeklHWnZjaUJ1YjI0dGNHRmtaR1ZrSUdKaGMyVTJOQ0J6ZEhKcGJtZHpJQ2h0YVhOemFXNW5JSFJ5WVdsc2FXNW5JRDA5UFNrc0lHSmhjMlUyTkMxcWN5QmtiMlZ6SUc1dmRGeHVJQ0IzYUdsc1pTQW9jM1J5TG14bGJtZDBhQ0FsSURRZ0lUMDlJREFwSUh0Y2JpQWdJQ0J6ZEhJZ1BTQnpkSElnS3lBblBTZGNiaUFnZlZ4dUlDQnlaWFIxY200Z2MzUnlYRzU5WEc1Y2JtWjFibU4wYVc5dUlITjBjbWx1WjNSeWFXMGdLSE4wY2lrZ2UxeHVJQ0JwWmlBb2MzUnlMblJ5YVcwcElISmxkSFZ5YmlCemRISXVkSEpwYlNncFhHNGdJSEpsZEhWeWJpQnpkSEl1Y21Wd2JHRmpaU2d2WGx4Y2N5dDhYRnh6S3lRdlp5d2dKeWNwWEc1OVhHNWNibVoxYm1OMGFXOXVJSFJ2U0dWNElDaHVLU0I3WEc0Z0lHbG1JQ2h1SUR3Z01UWXBJSEpsZEhWeWJpQW5NQ2NnS3lCdUxuUnZVM1J5YVc1bktERTJLVnh1SUNCeVpYUjFjbTRnYmk1MGIxTjBjbWx1WnlneE5pbGNibjFjYmx4dVpuVnVZM1JwYjI0Z2RYUm1PRlJ2UW5sMFpYTWdLSE4wY21sdVp5d2dkVzVwZEhNcElIdGNiaUFnZFc1cGRITWdQU0IxYm1sMGN5QjhmQ0JKYm1acGJtbDBlVnh1SUNCMllYSWdZMjlrWlZCdmFXNTBYRzRnSUhaaGNpQnNaVzVuZEdnZ1BTQnpkSEpwYm1jdWJHVnVaM1JvWEc0Z0lIWmhjaUJzWldGa1UzVnljbTluWVhSbElEMGdiblZzYkZ4dUlDQjJZWElnWW5sMFpYTWdQU0JiWFZ4dVhHNGdJR1p2Y2lBb2RtRnlJR2tnUFNBd095QnBJRHdnYkdWdVozUm9PeUJwS3lzcElIdGNiaUFnSUNCamIyUmxVRzlwYm5RZ1BTQnpkSEpwYm1jdVkyaGhja052WkdWQmRDaHBLVnh1WEc0Z0lDQWdMeThnYVhNZ2MzVnljbTluWVhSbElHTnZiWEJ2Ym1WdWRGeHVJQ0FnSUdsbUlDaGpiMlJsVUc5cGJuUWdQaUF3ZUVRM1JrWWdKaVlnWTI5a1pWQnZhVzUwSUR3Z01IaEZNREF3S1NCN1hHNGdJQ0FnSUNBdkx5QnNZWE4wSUdOb1lYSWdkMkZ6SUdFZ2JHVmhaRnh1SUNBZ0lDQWdhV1lnS0NGc1pXRmtVM1Z5Y205bllYUmxLU0I3WEc0Z0lDQWdJQ0FnSUM4dklHNXZJR3hsWVdRZ2VXVjBYRzRnSUNBZ0lDQWdJR2xtSUNoamIyUmxVRzlwYm5RZ1BpQXdlRVJDUmtZcElIdGNiaUFnSUNBZ0lDQWdJQ0F2THlCMWJtVjRjR1ZqZEdWa0lIUnlZV2xzWEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ2gxYm1sMGN5QXRQU0F6S1NBK0lDMHhLU0JpZVhSbGN5NXdkWE5vS0RCNFJVWXNJREI0UWtZc0lEQjRRa1FwWEc0Z0lDQWdJQ0FnSUNBZ1kyOXVkR2x1ZFdWY2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaHBJQ3NnTVNBOVBUMGdiR1Z1WjNSb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnTHk4Z2RXNXdZV2x5WldRZ2JHVmhaRnh1SUNBZ0lDQWdJQ0FnSUdsbUlDZ29kVzVwZEhNZ0xUMGdNeWtnUGlBdE1Ta2dZbmwwWlhNdWNIVnphQ2d3ZUVWR0xDQXdlRUpHTENBd2VFSkVLVnh1SUNBZ0lDQWdJQ0FnSUdOdmJuUnBiblZsWEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQXZMeUIyWVd4cFpDQnNaV0ZrWEc0Z0lDQWdJQ0FnSUd4bFlXUlRkWEp5YjJkaGRHVWdQU0JqYjJSbFVHOXBiblJjYmx4dUlDQWdJQ0FnSUNCamIyNTBhVzUxWlZ4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBdkx5QXlJR3hsWVdSeklHbHVJR0VnY205M1hHNGdJQ0FnSUNCcFppQW9ZMjlrWlZCdmFXNTBJRHdnTUhoRVF6QXdLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ29kVzVwZEhNZ0xUMGdNeWtnUGlBdE1Ta2dZbmwwWlhNdWNIVnphQ2d3ZUVWR0xDQXdlRUpHTENBd2VFSkVLVnh1SUNBZ0lDQWdJQ0JzWldGa1UzVnljbTluWVhSbElEMGdZMjlrWlZCdmFXNTBYRzRnSUNBZ0lDQWdJR052Ym5ScGJuVmxYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQzh2SUhaaGJHbGtJSE4xY25KdloyRjBaU0J3WVdseVhHNGdJQ0FnSUNCamIyUmxVRzlwYm5RZ1BTQnNaV0ZrVTNWeWNtOW5ZWFJsSUMwZ01IaEVPREF3SUR3OElERXdJSHdnWTI5a1pWQnZhVzUwSUMwZ01IaEVRekF3SUh3Z01IZ3hNREF3TUZ4dUlDQWdJSDBnWld4elpTQnBaaUFvYkdWaFpGTjFjbkp2WjJGMFpTa2dlMXh1SUNBZ0lDQWdMeThnZG1Gc2FXUWdZbTF3SUdOb1lYSXNJR0oxZENCc1lYTjBJR05vWVhJZ2QyRnpJR0VnYkdWaFpGeHVJQ0FnSUNBZ2FXWWdLQ2gxYm1sMGN5QXRQU0F6S1NBK0lDMHhLU0JpZVhSbGN5NXdkWE5vS0RCNFJVWXNJREI0UWtZc0lEQjRRa1FwWEc0Z0lDQWdmVnh1WEc0Z0lDQWdiR1ZoWkZOMWNuSnZaMkYwWlNBOUlHNTFiR3hjYmx4dUlDQWdJQzh2SUdWdVkyOWtaU0IxZEdZNFhHNGdJQ0FnYVdZZ0tHTnZaR1ZRYjJsdWRDQThJREI0T0RBcElIdGNiaUFnSUNBZ0lHbG1JQ2dvZFc1cGRITWdMVDBnTVNrZ1BDQXdLU0JpY21WaGExeHVJQ0FnSUNBZ1lubDBaWE11Y0hWemFDaGpiMlJsVUc5cGJuUXBYRzRnSUNBZ2ZTQmxiSE5sSUdsbUlDaGpiMlJsVUc5cGJuUWdQQ0F3ZURnd01Da2dlMXh1SUNBZ0lDQWdhV1lnS0NoMWJtbDBjeUF0UFNBeUtTQThJREFwSUdKeVpXRnJYRzRnSUNBZ0lDQmllWFJsY3k1d2RYTm9LRnh1SUNBZ0lDQWdJQ0JqYjJSbFVHOXBiblFnUGo0Z01IZzJJSHdnTUhoRE1DeGNiaUFnSUNBZ0lDQWdZMjlrWlZCdmFXNTBJQ1lnTUhnelJpQjhJREI0T0RCY2JpQWdJQ0FnSUNsY2JpQWdJQ0I5SUdWc2MyVWdhV1lnS0dOdlpHVlFiMmx1ZENBOElEQjRNVEF3TURBcElIdGNiaUFnSUNBZ0lHbG1JQ2dvZFc1cGRITWdMVDBnTXlrZ1BDQXdLU0JpY21WaGExeHVJQ0FnSUNBZ1lubDBaWE11Y0hWemFDaGNiaUFnSUNBZ0lDQWdZMjlrWlZCdmFXNTBJRDQrSURCNFF5QjhJREI0UlRBc1hHNGdJQ0FnSUNBZ0lHTnZaR1ZRYjJsdWRDQStQaUF3ZURZZ0ppQXdlRE5HSUh3Z01IZzRNQ3hjYmlBZ0lDQWdJQ0FnWTI5a1pWQnZhVzUwSUNZZ01IZ3pSaUI4SURCNE9EQmNiaUFnSUNBZ0lDbGNiaUFnSUNCOUlHVnNjMlVnYVdZZ0tHTnZaR1ZRYjJsdWRDQThJREI0TVRFd01EQXdLU0I3WEc0Z0lDQWdJQ0JwWmlBb0tIVnVhWFJ6SUMwOUlEUXBJRHdnTUNrZ1luSmxZV3RjYmlBZ0lDQWdJR0o1ZEdWekxuQjFjMmdvWEc0Z0lDQWdJQ0FnSUdOdlpHVlFiMmx1ZENBK1BpQXdlREV5SUh3Z01IaEdNQ3hjYmlBZ0lDQWdJQ0FnWTI5a1pWQnZhVzUwSUQ0K0lEQjRReUFtSURCNE0wWWdmQ0F3ZURnd0xGeHVJQ0FnSUNBZ0lDQmpiMlJsVUc5cGJuUWdQajRnTUhnMklDWWdNSGd6UmlCOElEQjRPREFzWEc0Z0lDQWdJQ0FnSUdOdlpHVlFiMmx1ZENBbUlEQjRNMFlnZkNBd2VEZ3dYRzRnSUNBZ0lDQXBYRzRnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRmNuSnZjaWduU1c1MllXeHBaQ0JqYjJSbElIQnZhVzUwSnlsY2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnWW5sMFpYTmNibjFjYmx4dVpuVnVZM1JwYjI0Z1lYTmphV2xVYjBKNWRHVnpJQ2h6ZEhJcElIdGNiaUFnZG1GeUlHSjVkR1ZCY25KaGVTQTlJRnRkWEc0Z0lHWnZjaUFvZG1GeUlHa2dQU0F3T3lCcElEd2djM1J5TG14bGJtZDBhRHNnYVNzcktTQjdYRzRnSUNBZ0x5OGdUbTlrWlNkeklHTnZaR1VnYzJWbGJYTWdkRzhnWW1VZ1pHOXBibWNnZEdocGN5QmhibVFnYm05MElDWWdNSGczUmk0dVhHNGdJQ0FnWW5sMFpVRnljbUY1TG5CMWMyZ29jM1J5TG1Ob1lYSkRiMlJsUVhRb2FTa2dKaUF3ZUVaR0tWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCaWVYUmxRWEp5WVhsY2JuMWNibHh1Wm5WdVkzUnBiMjRnZFhSbU1UWnNaVlJ2UW5sMFpYTWdLSE4wY2l3Z2RXNXBkSE1wSUh0Y2JpQWdkbUZ5SUdNc0lHaHBMQ0JzYjF4dUlDQjJZWElnWW5sMFpVRnljbUY1SUQwZ1cxMWNiaUFnWm05eUlDaDJZWElnYVNBOUlEQTdJR2tnUENCemRISXViR1Z1WjNSb095QnBLeXNwSUh0Y2JpQWdJQ0JwWmlBb0tIVnVhWFJ6SUMwOUlESXBJRHdnTUNrZ1luSmxZV3RjYmx4dUlDQWdJR01nUFNCemRISXVZMmhoY2tOdlpHVkJkQ2hwS1Z4dUlDQWdJR2hwSUQwZ1l5QStQaUE0WEc0Z0lDQWdiRzhnUFNCaklDVWdNalUyWEc0Z0lDQWdZbmwwWlVGeWNtRjVMbkIxYzJnb2JHOHBYRzRnSUNBZ1lubDBaVUZ5Y21GNUxuQjFjMmdvYUdrcFhHNGdJSDFjYmx4dUlDQnlaWFIxY200Z1lubDBaVUZ5Y21GNVhHNTlYRzVjYm1aMWJtTjBhVzl1SUdKaGMyVTJORlJ2UW5sMFpYTWdLSE4wY2lrZ2UxeHVJQ0J5WlhSMWNtNGdZbUZ6WlRZMExuUnZRbmwwWlVGeWNtRjVLR0poYzJVMk5HTnNaV0Z1S0hOMGNpa3BYRzU5WEc1Y2JtWjFibU4wYVc5dUlHSnNhWFJDZFdabVpYSWdLSE55WXl3Z1pITjBMQ0J2Wm1aelpYUXNJR3hsYm1kMGFDa2dlMXh1SUNCbWIzSWdLSFpoY2lCcElEMGdNRHNnYVNBOElHeGxibWQwYURzZ2FTc3JLU0I3WEc0Z0lDQWdhV1lnS0NocElDc2diMlptYzJWMElENDlJR1J6ZEM1c1pXNW5kR2dwSUh4OElDaHBJRDQ5SUhOeVl5NXNaVzVuZEdncEtTQmljbVZoYTF4dUlDQWdJR1J6ZEZ0cElDc2diMlptYzJWMFhTQTlJSE55WTF0cFhWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCcFhHNTlYRzRpWFgwPSIsInZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbjsoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG4gIHZhciBBcnIgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKVxuICAgID8gVWludDhBcnJheVxuICAgIDogQXJyYXlcblxuXHR2YXIgUExVUyAgID0gJysnLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIICA9ICcvJy5jaGFyQ29kZUF0KDApXG5cdHZhciBOVU1CRVIgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgTE9XRVIgID0gJ2EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFVQUEVSICA9ICdBJy5jaGFyQ29kZUF0KDApXG5cdHZhciBQTFVTX1VSTF9TQUZFID0gJy0nLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIX1VSTF9TQUZFID0gJ18nLmNoYXJDb2RlQXQoMClcblxuXHRmdW5jdGlvbiBkZWNvZGUgKGVsdCkge1xuXHRcdHZhciBjb2RlID0gZWx0LmNoYXJDb2RlQXQoMClcblx0XHRpZiAoY29kZSA9PT0gUExVUyB8fFxuXHRcdCAgICBjb2RlID09PSBQTFVTX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSCB8fFxuXHRcdCAgICBjb2RlID09PSBTTEFTSF9VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRleHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0ZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NFxufSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAodGhpcy5iYXNlNjRqcyA9IHt9KSA6IGV4cG9ydHMpKVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCJcbi8qKlxuICogaXNBcnJheVxuICovXG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuLyoqXG4gKiB0b1N0cmluZ1xuICovXG5cbnZhciBzdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBgdmFsYFxuICogaXMgYW4gYXJyYXkuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgaXNBcnJheShbXSk7XG4gKiAgICAgICAgLy8gPiB0cnVlXG4gKiAgICAgICAgaXNBcnJheShhcmd1bWVudHMpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqICAgICAgICBpc0FycmF5KCcnKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKlxuICogQHBhcmFtIHttaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtib29sfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiAhISB2YWwgJiYgJ1tvYmplY3QgQXJyYXldJyA9PSBzdHIuY2FsbCh2YWwpO1xufTtcbiIsIihmdW5jdGlvbiAoQnVmZmVyKXtcbi8qIVxuICogQGRlc2NyaXB0aW9uIFJlY3Vyc2l2ZSBvYmplY3QgZXh0ZW5kaW5nXG4gKiBAYXV0aG9yIFZpYWNoZXNsYXYgTG90c21hbm92IDxsb3RzbWFub3Y4OUBnbWFpbC5jb20+XG4gKiBAbGljZW5zZSBNSVRcbiAqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNSBWaWFjaGVzbGF2IExvdHNtYW5vdlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2ZcbiAqIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW5cbiAqIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cbiAqIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mXG4gKiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXG4gKiBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1NcbiAqIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUlxuICogQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSXG4gKiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTlxuICogQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGlzU3BlY2lmaWNWYWx1ZSh2YWwpIHtcblx0cmV0dXJuIChcblx0XHR2YWwgaW5zdGFuY2VvZiBCdWZmZXJcblx0XHR8fCB2YWwgaW5zdGFuY2VvZiBEYXRlXG5cdFx0fHwgdmFsIGluc3RhbmNlb2YgUmVnRXhwXG5cdCkgPyB0cnVlIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGNsb25lU3BlY2lmaWNWYWx1ZSh2YWwpIHtcblx0aWYgKHZhbCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuXHRcdHZhciB4ID0gbmV3IEJ1ZmZlcih2YWwubGVuZ3RoKTtcblx0XHR2YWwuY29weSh4KTtcblx0XHRyZXR1cm4geDtcblx0fSBlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRlKHZhbC5nZXRUaW1lKCkpO1xuXHR9IGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuXHRcdHJldHVybiBuZXcgUmVnRXhwKHZhbCk7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHNpdHVhdGlvbicpO1xuXHR9XG59XG5cbi8qKlxuICogUmVjdXJzaXZlIGNsb25pbmcgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGRlZXBDbG9uZUFycmF5KGFycikge1xuXHR2YXIgY2xvbmUgPSBbXTtcblx0YXJyLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0sIGluZGV4KSB7XG5cdFx0aWYgKHR5cGVvZiBpdGVtID09PSAnb2JqZWN0JyAmJiBpdGVtICE9PSBudWxsKSB7XG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuXHRcdFx0XHRjbG9uZVtpbmRleF0gPSBkZWVwQ2xvbmVBcnJheShpdGVtKTtcblx0XHRcdH0gZWxzZSBpZiAoaXNTcGVjaWZpY1ZhbHVlKGl0ZW0pKSB7XG5cdFx0XHRcdGNsb25lW2luZGV4XSA9IGNsb25lU3BlY2lmaWNWYWx1ZShpdGVtKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNsb25lW2luZGV4XSA9IGRlZXBFeHRlbmQoe30sIGl0ZW0pO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjbG9uZVtpbmRleF0gPSBpdGVtO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBjbG9uZTtcbn1cblxuLyoqXG4gKiBFeHRlbmluZyBvYmplY3QgdGhhdCBlbnRlcmVkIGluIGZpcnN0IGFyZ3VtZW50LlxuICpcbiAqIFJldHVybnMgZXh0ZW5kZWQgb2JqZWN0IG9yIGZhbHNlIGlmIGhhdmUgbm8gdGFyZ2V0IG9iamVjdCBvciBpbmNvcnJlY3QgdHlwZS5cbiAqXG4gKiBJZiB5b3Ugd2lzaCB0byBjbG9uZSBzb3VyY2Ugb2JqZWN0ICh3aXRob3V0IG1vZGlmeSBpdCksIGp1c3QgdXNlIGVtcHR5IG5ld1xuICogb2JqZWN0IGFzIGZpcnN0IGFyZ3VtZW50LCBsaWtlIHRoaXM6XG4gKiAgIGRlZXBFeHRlbmQoe30sIHlvdXJPYmpfMSwgW3lvdXJPYmpfTl0pO1xuICovXG52YXIgZGVlcEV4dGVuZCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKC8qb2JqXzEsIFtvYmpfMl0sIFtvYmpfTl0qLykge1xuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDEgfHwgdHlwZW9mIGFyZ3VtZW50c1swXSAhPT0gJ29iamVjdCcpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcblx0XHRyZXR1cm4gYXJndW1lbnRzWzBdO1xuXHR9XG5cblx0dmFyIHRhcmdldCA9IGFyZ3VtZW50c1swXTtcblxuXHQvLyBjb252ZXJ0IGFyZ3VtZW50cyB0byBhcnJheSBhbmQgY3V0IG9mZiB0YXJnZXQgb2JqZWN0XG5cdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuXHR2YXIgdmFsLCBzcmMsIGNsb25lO1xuXG5cdGFyZ3MuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG5cdFx0Ly8gc2tpcCBhcmd1bWVudCBpZiBpdCBpcyBhcnJheSBvciBpc24ndCBvYmplY3Rcblx0XHRpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShvYmopKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0T2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdHNyYyA9IHRhcmdldFtrZXldOyAvLyBzb3VyY2UgdmFsdWVcblx0XHRcdHZhbCA9IG9ialtrZXldOyAvLyBuZXcgdmFsdWVcblxuXHRcdFx0Ly8gcmVjdXJzaW9uIHByZXZlbnRpb25cblx0XHRcdGlmICh2YWwgPT09IHRhcmdldCkge1xuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogaWYgbmV3IHZhbHVlIGlzbid0IG9iamVjdCB0aGVuIGp1c3Qgb3ZlcndyaXRlIGJ5IG5ldyB2YWx1ZVxuXHRcdFx0ICogaW5zdGVhZCBvZiBleHRlbmRpbmcuXG5cdFx0XHQgKi9cblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIHZhbCAhPT0gJ29iamVjdCcgfHwgdmFsID09PSBudWxsKSB7XG5cdFx0XHRcdHRhcmdldFtrZXldID0gdmFsO1xuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdC8vIGp1c3QgY2xvbmUgYXJyYXlzIChhbmQgcmVjdXJzaXZlIGNsb25lIG9iamVjdHMgaW5zaWRlKVxuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcblx0XHRcdFx0dGFyZ2V0W2tleV0gPSBkZWVwQ2xvbmVBcnJheSh2YWwpO1xuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdC8vIGN1c3RvbSBjbG9uaW5nIGFuZCBvdmVyd3JpdGUgZm9yIHNwZWNpZmljIG9iamVjdHNcblx0XHRcdH0gZWxzZSBpZiAoaXNTcGVjaWZpY1ZhbHVlKHZhbCkpIHtcblx0XHRcdFx0dGFyZ2V0W2tleV0gPSBjbG9uZVNwZWNpZmljVmFsdWUodmFsKTtcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHQvLyBvdmVyd3JpdGUgYnkgbmV3IHZhbHVlIGlmIHNvdXJjZSBpc24ndCBvYmplY3Qgb3IgYXJyYXlcblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIHNyYyAhPT0gJ29iamVjdCcgfHwgc3JjID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoc3JjKSkge1xuXHRcdFx0XHR0YXJnZXRba2V5XSA9IGRlZXBFeHRlbmQoe30sIHZhbCk7XG5cdFx0XHRcdHJldHVybjtcblxuXHRcdFx0Ly8gc291cmNlIHZhbHVlIGFuZCBuZXcgdmFsdWUgaXMgb2JqZWN0cyBib3RoLCBleHRlbmRpbmcuLi5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRhcmdldFtrZXldID0gZGVlcEV4dGVuZChzcmMsIHZhbCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0cmV0dXJuIHRhcmdldDtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyKVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OWtaV1Z3TFdWNGRHVnVaQzlzYVdJdlpHVmxjQzFsZUhSbGJtUXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUl2S2lGY2JpQXFJRUJrWlhOamNtbHdkR2x2YmlCU1pXTjFjbk5wZG1VZ2IySnFaV04wSUdWNGRHVnVaR2x1WjF4dUlDb2dRR0YxZEdodmNpQldhV0ZqYUdWemJHRjJJRXh2ZEhOdFlXNXZkaUE4Ykc5MGMyMWhibTkyT0RsQVoyMWhhV3d1WTI5dFBseHVJQ29nUUd4cFkyVnVjMlVnVFVsVVhHNGdLbHh1SUNvZ1ZHaGxJRTFKVkNCTWFXTmxibk5sSUNoTlNWUXBYRzRnS2x4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERXpMVEl3TVRVZ1ZtbGhZMmhsYzJ4aGRpQk1iM1J6YldGdWIzWmNiaUFxWEc0Z0tpQlFaWEp0YVhOemFXOXVJR2x6SUdobGNtVmllU0JuY21GdWRHVmtMQ0JtY21WbElHOW1JR05vWVhKblpTd2dkRzhnWVc1NUlIQmxjbk52YmlCdlluUmhhVzVwYm1jZ1lTQmpiM0I1SUc5bVhHNGdLaUIwYUdseklITnZablIzWVhKbElHRnVaQ0JoYzNOdlkybGhkR1ZrSUdSdlkzVnRaVzUwWVhScGIyNGdabWxzWlhNZ0tIUm9aU0JjSWxOdlpuUjNZWEpsWENJcExDQjBieUJrWldGc0lHbHVYRzRnS2lCMGFHVWdVMjltZEhkaGNtVWdkMmwwYUc5MWRDQnlaWE4wY21samRHbHZiaXdnYVc1amJIVmthVzVuSUhkcGRHaHZkWFFnYkdsdGFYUmhkR2x2YmlCMGFHVWdjbWxuYUhSeklIUnZYRzRnS2lCMWMyVXNJR052Y0hrc0lHMXZaR2xtZVN3Z2JXVnlaMlVzSUhCMVlteHBjMmdzSUdScGMzUnlhV0oxZEdVc0lITjFZbXhwWTJWdWMyVXNJR0Z1WkM5dmNpQnpaV3hzSUdOdmNHbGxjeUJ2Wmx4dUlDb2dkR2hsSUZOdlpuUjNZWEpsTENCaGJtUWdkRzhnY0dWeWJXbDBJSEJsY25OdmJuTWdkRzhnZDJodmJTQjBhR1VnVTI5bWRIZGhjbVVnYVhNZ1puVnlibWx6YUdWa0lIUnZJR1J2SUhOdkxGeHVJQ29nYzNWaWFtVmpkQ0IwYnlCMGFHVWdabTlzYkc5M2FXNW5JR052Ym1ScGRHbHZibk02WEc0Z0tseHVJQ29nVkdobElHRmliM1psSUdOdmNIbHlhV2RvZENCdWIzUnBZMlVnWVc1a0lIUm9hWE1nY0dWeWJXbHpjMmx2YmlCdWIzUnBZMlVnYzJoaGJHd2dZbVVnYVc1amJIVmtaV1FnYVc0Z1lXeHNYRzRnS2lCamIzQnBaWE1nYjNJZ2MzVmljM1JoYm5ScFlXd2djRzl5ZEdsdmJuTWdiMllnZEdobElGTnZablIzWVhKbExseHVJQ3BjYmlBcUlGUklSU0JUVDBaVVYwRlNSU0JKVXlCUVVrOVdTVVJGUkNCY0lrRlRJRWxUWENJc0lGZEpWRWhQVlZRZ1YwRlNVa0ZPVkZrZ1QwWWdRVTVaSUV0SlRrUXNJRVZZVUZKRlUxTWdUMUpjYmlBcUlFbE5VRXhKUlVRc0lFbE9RMHhWUkVsT1J5QkNWVlFnVGs5VUlFeEpUVWxVUlVRZ1ZFOGdWRWhGSUZkQlVsSkJUbFJKUlZNZ1QwWWdUVVZTUTBoQlRsUkJRa2xNU1ZSWkxDQkdTVlJPUlZOVFhHNGdLaUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVWdRVTVFSUU1UFRrbE9SbEpKVGtkRlRVVk9WQzRnU1U0Z1RrOGdSVlpGVGxRZ1UwaEJURXdnVkVoRklFRlZWRWhQVWxNZ1QxSmNiaUFxSUVOUFVGbFNTVWRJVkNCSVQweEVSVkpUSUVKRklFeEpRVUpNUlNCR1QxSWdRVTVaSUVOTVFVbE5MQ0JFUVUxQlIwVlRJRTlTSUU5VVNFVlNJRXhKUVVKSlRFbFVXU3dnVjBoRlZFaEZVbHh1SUNvZ1NVNGdRVTRnUVVOVVNVOU9JRTlHSUVOUFRsUlNRVU5VTENCVVQxSlVJRTlTSUU5VVNFVlNWMGxUUlN3Z1FWSkpVMGxPUnlCR1VrOU5MQ0JQVlZRZ1QwWWdUMUlnU1U1Y2JpQXFJRU5QVGs1RlExUkpUMDRnVjBsVVNDQlVTRVVnVTA5R1ZGZEJVa1VnVDFJZ1ZFaEZJRlZUUlNCUFVpQlBWRWhGVWlCRVJVRk1TVTVIVXlCSlRpQlVTRVVnVTA5R1ZGZEJVa1V1WEc0Z0tpOWNibHh1SjNWelpTQnpkSEpwWTNRbk8xeHVYRzVtZFc1amRHbHZiaUJwYzFOd1pXTnBabWxqVm1Gc2RXVW9kbUZzS1NCN1hHNWNkSEpsZEhWeWJpQW9YRzVjZEZ4MGRtRnNJR2x1YzNSaGJtTmxiMllnUW5WbVptVnlYRzVjZEZ4MGZId2dkbUZzSUdsdWMzUmhibU5sYjJZZ1JHRjBaVnh1WEhSY2RIeDhJSFpoYkNCcGJuTjBZVzVqWlc5bUlGSmxaMFY0Y0Z4dVhIUXBJRDhnZEhKMVpTQTZJR1poYkhObE8xeHVmVnh1WEc1bWRXNWpkR2x2YmlCamJHOXVaVk53WldOcFptbGpWbUZzZFdVb2RtRnNLU0I3WEc1Y2RHbG1JQ2gyWVd3Z2FXNXpkR0Z1WTJWdlppQkNkV1ptWlhJcElIdGNibHgwWEhSMllYSWdlQ0E5SUc1bGR5QkNkV1ptWlhJb2RtRnNMbXhsYm1kMGFDazdYRzVjZEZ4MGRtRnNMbU52Y0hrb2VDazdYRzVjZEZ4MGNtVjBkWEp1SUhnN1hHNWNkSDBnWld4elpTQnBaaUFvZG1Gc0lHbHVjM1JoYm1ObGIyWWdSR0YwWlNrZ2UxeHVYSFJjZEhKbGRIVnliaUJ1WlhjZ1JHRjBaU2gyWVd3dVoyVjBWR2x0WlNncEtUdGNibHgwZlNCbGJITmxJR2xtSUNoMllXd2dhVzV6ZEdGdVkyVnZaaUJTWldkRmVIQXBJSHRjYmx4MFhIUnlaWFIxY200Z2JtVjNJRkpsWjBWNGNDaDJZV3dwTzF4dVhIUjlJR1ZzYzJVZ2UxeHVYSFJjZEhSb2NtOTNJRzVsZHlCRmNuSnZjaWduVlc1bGVIQmxZM1JsWkNCemFYUjFZWFJwYjI0bktUdGNibHgwZlZ4dWZWeHVYRzR2S2lwY2JpQXFJRkpsWTNWeWMybDJaU0JqYkc5dWFXNW5JR0Z5Y21GNUxseHVJQ292WEc1bWRXNWpkR2x2YmlCa1pXVndRMnh2Ym1WQmNuSmhlU2hoY25JcElIdGNibHgwZG1GeUlHTnNiMjVsSUQwZ1cxMDdYRzVjZEdGeWNpNW1iM0pGWVdOb0tHWjFibU4wYVc5dUlDaHBkR1Z0TENCcGJtUmxlQ2tnZTF4dVhIUmNkR2xtSUNoMGVYQmxiMllnYVhSbGJTQTlQVDBnSjI5aWFtVmpkQ2NnSmlZZ2FYUmxiU0FoUFQwZ2JuVnNiQ2tnZTF4dVhIUmNkRngwYVdZZ0tFRnljbUY1TG1selFYSnlZWGtvYVhSbGJTa3BJSHRjYmx4MFhIUmNkRngwWTJ4dmJtVmJhVzVrWlhoZElEMGdaR1ZsY0VOc2IyNWxRWEp5WVhrb2FYUmxiU2s3WEc1Y2RGeDBYSFI5SUdWc2MyVWdhV1lnS0dselUzQmxZMmxtYVdOV1lXeDFaU2hwZEdWdEtTa2dlMXh1WEhSY2RGeDBYSFJqYkc5dVpWdHBibVJsZUYwZ1BTQmpiRzl1WlZOd1pXTnBabWxqVm1Gc2RXVW9hWFJsYlNrN1hHNWNkRngwWEhSOUlHVnNjMlVnZTF4dVhIUmNkRngwWEhSamJHOXVaVnRwYm1SbGVGMGdQU0JrWldWd1JYaDBaVzVrS0h0OUxDQnBkR1Z0S1R0Y2JseDBYSFJjZEgxY2JseDBYSFI5SUdWc2MyVWdlMXh1WEhSY2RGeDBZMnh2Ym1WYmFXNWtaWGhkSUQwZ2FYUmxiVHRjYmx4MFhIUjlYRzVjZEgwcE8xeHVYSFJ5WlhSMWNtNGdZMnh2Ym1VN1hHNTlYRzVjYmk4cUtseHVJQ29nUlhoMFpXNXBibWNnYjJKcVpXTjBJSFJvWVhRZ1pXNTBaWEpsWkNCcGJpQm1hWEp6ZENCaGNtZDFiV1Z1ZEM1Y2JpQXFYRzRnS2lCU1pYUjFjbTV6SUdWNGRHVnVaR1ZrSUc5aWFtVmpkQ0J2Y2lCbVlXeHpaU0JwWmlCb1lYWmxJRzV2SUhSaGNtZGxkQ0J2WW1wbFkzUWdiM0lnYVc1amIzSnlaV04wSUhSNWNHVXVYRzRnS2x4dUlDb2dTV1lnZVc5MUlIZHBjMmdnZEc4Z1kyeHZibVVnYzI5MWNtTmxJRzlpYW1WamRDQW9kMmwwYUc5MWRDQnRiMlJwWm5rZ2FYUXBMQ0JxZFhOMElIVnpaU0JsYlhCMGVTQnVaWGRjYmlBcUlHOWlhbVZqZENCaGN5Qm1hWEp6ZENCaGNtZDFiV1Z1ZEN3Z2JHbHJaU0IwYUdsek9seHVJQ29nSUNCa1pXVndSWGgwWlc1a0tIdDlMQ0I1YjNWeVQySnFYekVzSUZ0NWIzVnlUMkpxWDA1ZEtUdGNiaUFxTDF4dWRtRnlJR1JsWlhCRmVIUmxibVFnUFNCdGIyUjFiR1V1Wlhod2IzSjBjeUE5SUdaMWJtTjBhVzl1SUNndkttOWlhbDh4TENCYmIySnFYekpkTENCYmIySnFYMDVkS2k4cElIdGNibHgwYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BDQXhJSHg4SUhSNWNHVnZaaUJoY21kMWJXVnVkSE5iTUYwZ0lUMDlJQ2R2WW1wbFkzUW5LU0I3WEc1Y2RGeDBjbVYwZFhKdUlHWmhiSE5sTzF4dVhIUjlYRzVjYmx4MGFXWWdLR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZ2dQQ0F5S1NCN1hHNWNkRngwY21WMGRYSnVJR0Z5WjNWdFpXNTBjMXN3WFR0Y2JseDBmVnh1WEc1Y2RIWmhjaUIwWVhKblpYUWdQU0JoY21kMWJXVnVkSE5iTUYwN1hHNWNibHgwTHk4Z1kyOXVkbVZ5ZENCaGNtZDFiV1Z1ZEhNZ2RHOGdZWEp5WVhrZ1lXNWtJR04xZENCdlptWWdkR0Z5WjJWMElHOWlhbVZqZEZ4dVhIUjJZWElnWVhKbmN5QTlJRUZ5Y21GNUxuQnliM1J2ZEhsd1pTNXpiR2xqWlM1allXeHNLR0Z5WjNWdFpXNTBjeXdnTVNrN1hHNWNibHgwZG1GeUlIWmhiQ3dnYzNKakxDQmpiRzl1WlR0Y2JseHVYSFJoY21kekxtWnZja1ZoWTJnb1puVnVZM1JwYjI0Z0tHOWlhaWtnZTF4dVhIUmNkQzh2SUhOcmFYQWdZWEpuZFcxbGJuUWdhV1lnYVhRZ2FYTWdZWEp5WVhrZ2IzSWdhWE51SjNRZ2IySnFaV04wWEc1Y2RGeDBhV1lnS0hSNWNHVnZaaUJ2WW1vZ0lUMDlJQ2R2WW1wbFkzUW5JSHg4SUVGeWNtRjVMbWx6UVhKeVlYa29iMkpxS1NrZ2UxeHVYSFJjZEZ4MGNtVjBkWEp1TzF4dVhIUmNkSDFjYmx4dVhIUmNkRTlpYW1WamRDNXJaWGx6S0c5aWFpa3VabTl5UldGamFDaG1kVzVqZEdsdmJpQW9hMlY1S1NCN1hHNWNkRngwWEhSemNtTWdQU0IwWVhKblpYUmJhMlY1WFRzZ0x5OGdjMjkxY21ObElIWmhiSFZsWEc1Y2RGeDBYSFIyWVd3Z1BTQnZZbXBiYTJWNVhUc2dMeThnYm1WM0lIWmhiSFZsWEc1Y2JseDBYSFJjZEM4dklISmxZM1Z5YzJsdmJpQndjbVYyWlc1MGFXOXVYRzVjZEZ4MFhIUnBaaUFvZG1Gc0lEMDlQU0IwWVhKblpYUXBJSHRjYmx4MFhIUmNkRngwY21WMGRYSnVPMXh1WEc1Y2RGeDBYSFF2S2lwY2JseDBYSFJjZENBcUlHbG1JRzVsZHlCMllXeDFaU0JwYzI0bmRDQnZZbXBsWTNRZ2RHaGxiaUJxZFhOMElHOTJaWEozY21sMFpTQmllU0J1WlhjZ2RtRnNkV1ZjYmx4MFhIUmNkQ0FxSUdsdWMzUmxZV1FnYjJZZ1pYaDBaVzVrYVc1bkxseHVYSFJjZEZ4MElDb3ZYRzVjZEZ4MFhIUjlJR1ZzYzJVZ2FXWWdLSFI1Y0dWdlppQjJZV3dnSVQwOUlDZHZZbXBsWTNRbklIeDhJSFpoYkNBOVBUMGdiblZzYkNrZ2UxeHVYSFJjZEZ4MFhIUjBZWEpuWlhSYmEyVjVYU0E5SUhaaGJEdGNibHgwWEhSY2RGeDBjbVYwZFhKdU8xeHVYRzVjZEZ4MFhIUXZMeUJxZFhOMElHTnNiMjVsSUdGeWNtRjVjeUFvWVc1a0lISmxZM1Z5YzJsMlpTQmpiRzl1WlNCdlltcGxZM1J6SUdsdWMybGtaU2xjYmx4MFhIUmNkSDBnWld4elpTQnBaaUFvUVhKeVlYa3VhWE5CY25KaGVTaDJZV3dwS1NCN1hHNWNkRngwWEhSY2RIUmhjbWRsZEZ0clpYbGRJRDBnWkdWbGNFTnNiMjVsUVhKeVlYa29kbUZzS1R0Y2JseDBYSFJjZEZ4MGNtVjBkWEp1TzF4dVhHNWNkRngwWEhRdkx5QmpkWE4wYjIwZ1kyeHZibWx1WnlCaGJtUWdiM1psY25keWFYUmxJR1p2Y2lCemNHVmphV1pwWXlCdlltcGxZM1J6WEc1Y2RGeDBYSFI5SUdWc2MyVWdhV1lnS0dselUzQmxZMmxtYVdOV1lXeDFaU2gyWVd3cEtTQjdYRzVjZEZ4MFhIUmNkSFJoY21kbGRGdHJaWGxkSUQwZ1kyeHZibVZUY0dWamFXWnBZMVpoYkhWbEtIWmhiQ2s3WEc1Y2RGeDBYSFJjZEhKbGRIVnlianRjYmx4dVhIUmNkRngwTHk4Z2IzWmxjbmR5YVhSbElHSjVJRzVsZHlCMllXeDFaU0JwWmlCemIzVnlZMlVnYVhOdUozUWdiMkpxWldOMElHOXlJR0Z5Y21GNVhHNWNkRngwWEhSOUlHVnNjMlVnYVdZZ0tIUjVjR1Z2WmlCemNtTWdJVDA5SUNkdlltcGxZM1FuSUh4OElITnlZeUE5UFQwZ2JuVnNiQ0I4ZkNCQmNuSmhlUzVwYzBGeWNtRjVLSE55WXlrcElIdGNibHgwWEhSY2RGeDBkR0Z5WjJWMFcydGxlVjBnUFNCa1pXVndSWGgwWlc1a0tIdDlMQ0IyWVd3cE8xeHVYSFJjZEZ4MFhIUnlaWFIxY200N1hHNWNibHgwWEhSY2RDOHZJSE52ZFhKalpTQjJZV3gxWlNCaGJtUWdibVYzSUhaaGJIVmxJR2x6SUc5aWFtVmpkSE1nWW05MGFDd2daWGgwWlc1a2FXNW5MaTR1WEc1Y2RGeDBYSFI5SUdWc2MyVWdlMXh1WEhSY2RGeDBYSFIwWVhKblpYUmJhMlY1WFNBOUlHUmxaWEJGZUhSbGJtUW9jM0pqTENCMllXd3BPMXh1WEhSY2RGeDBYSFJ5WlhSMWNtNDdYRzVjZEZ4MFhIUjlYRzVjZEZ4MGZTazdYRzVjZEgwcE8xeHVYRzVjZEhKbGRIVnliaUIwWVhKblpYUTdYRzU5WEc0aVhYMD0iLCJpbXBvcnQgZm9yZ2UgZnJvbSAnLi4vZm9yZ2UnXG5pbXBvcnQgcHJlZnMgZnJvbSAnLi4vcHJlZnMnXG5pbXBvcnQgbWVzc2FnZSBmcm9tICcuLi9tZXNzYWdlJ1xuaW1wb3J0IHtiZ1BhZ2VSZWxvYWR9IGZyb20gJy4uL3V0aWwnXG5pbXBvcnQge2dldERvbWFpbn0gZnJvbSAnLi4vbG9jYXRpb24nXG5pbXBvcnQgdHJhY2tpbmcgZnJvbSAnLi4vdHJhY2tpbmcvaW5kZXgnXG5pbXBvcnQgYXV0aCBmcm9tICcuL2F1dGgnXG5pbXBvcnQgT2ZmbGluZSBmcm9tICcuL29mZmxpbmUnXG5pbXBvcnQge3NldFVuaW5zdGFsbFVSTH0gZnJvbSAnLi9jaHJvbWUnXG5pbXBvcnQge2dldExvZyBhcyBnZXRTb2NrZXRMb2d9IGZyb20gJy4uL3NvY2tldCdcbmltcG9ydCBwYWdlQ29uZmlnIGZyb20gJy4uL3BhZ2UtY29uZmlnJ1xuaW1wb3J0IGxvY2FsZm9yYWdlIGZyb20gJ2xvY2FsZm9yYWdlJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBJbml0KG1zZyA9IG1lc3NhZ2UpIHtcbiAgT2JqZWN0LmtleXMoQVBJKS5mb3JFYWNoKHR5cGUgPT4gbXNnLm9uKHR5cGUsIEFQSVt0eXBlXSwgbnVsbCwgdHJ1ZSkpXG5cbiAgcHJvY2Nlc3NNZXNzYWdlQnVmZmVyKClcblxuICBsZXQgb2ZmbGluZSA9IE9mZmxpbmUoKVxuXG4gIG9mZmxpbmUub24oJ29ubGluZScsIGZ1bmN0aW9uKCkge1xuICAgIG1lc3NhZ2UuZW1pdFRhYnMoJ29ubGluZScsIHt9KVxuICAgIHRyYWNraW5nLmNhbGwoJ2ZlbG9nLmluZm8nLCAnbmV0d29ya19vbmxpbmUnKVxuICB9KVxuXG4gIG9mZmxpbmUub24oJ29mZmxpbmUnLCBmdW5jdGlvbigpIHtcbiAgICBtZXNzYWdlLmVtaXRUYWJzKCdvZmZsaW5lJywge30pXG4gICAgdHJhY2tpbmcuY2FsbCgnZmVsb2cuaW5mbycsICduZXR3b3JrX29mZmxpbmUnKVxuICB9KVxufVxuXG5mdW5jdGlvbiBwcm9jY2Vzc01lc3NhZ2VCdWZmZXIoKSB7XG4gIGxldCBidWZmID0gZm9yZ2UubWVzc2FnZUJ1ZmZlclxuXG4gIGlmICghYnVmZiB8fCAhYnVmZi5sZW5ndGgpIHJldHVyblxuXG4gIGNvbnNvbGUud2FybigncHJvY2Nlc3MgYnVmZmVyZWQgbWVzc2FnZXMnLCBidWZmLnNsaWNlKCkpXG4gIHRyYWNraW5nLmNhbGwoJ2ZlbG9nLmluZm8nLCAncHJvY2Vzc19idWZmZXJlZF9tZXNzYWdlcycsIHtjb3VudDogYnVmZi5sZW5ndGh9KVxuXG4gIGJ1ZmYuZm9yRWFjaCgoe3R5cGUsIGNvbnRlbnQsIHJlcGxheX0pID0+IHtcbiAgICB0cnkge1xuICAgICAgQVBJW3R5cGVdICYmIEFQSVt0eXBlXShjb250ZW50LCByZXBsYXkpXG4gICAgfVxuICAgIGNhdGNoKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybigncG9zc2libGUgbWVzc2FnZSBmcm9tIGNsb3NlZCB0YWInLCBlKVxuICAgIH1cbiAgfSlcblxuICBidWZmLmxlbmd0aCA9IDBcbn1cblxubGV0IHN5bmNTdG9yZSA9IG5ldyBNYXAoKVxuY29uc3QgU1lOQ19USU1FT1VUID0gMzAwMDBcblxuZnVuY3Rpb24gc3luY1RpbWVyKCkge1xuICBsZXQgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICB0cmFja2luZy5jYWxsKCdmZWxvZy5lcnJvcicsICdzdGFiaWxpdHkuYmdfY2FsbF90aW1lb3V0X29uX3Jlc3BvbnNlJylcbiAgfSwgU1lOQ19USU1FT1VUKVxuICByZXR1cm4gKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVyKVxufVxuXG5mdW5jdGlvbiBzdG9wVGltZXIoaWQpIHtcbiAgaWYgKCFzeW5jU3RvcmUuaGFzKGlkKSkgcmV0dXJuXG4gIHN5bmNTdG9yZS5nZXQoaWQpKClcbiAgc3luY1N0b3JlLmRlbGV0ZShpZClcbn1cblxuZXhwb3J0IGxldCBBUEkgPSB7XG4gIHN5bmM6IChkYXRhLCBjYikgPT4ge1xuICAgIGlmIChkYXRhICYmIGRhdGEuaWQpIHtcbiAgICAgIHN0b3BUaW1lcihkYXRhLmlkKVxuICAgICAgc3luY1N0b3JlLnNldChkYXRhLmlkLCBzeW5jVGltZXIoKSlcbiAgICB9XG4gICAgY2IodHJ1ZSlcbiAgfSxcbiAgc3luYzI6ICh7aWR9LCBjYikgPT4ge1xuICAgIHN0b3BUaW1lcihpZClcbiAgICBjYih0cnVlKVxuICB9LFxuXG4gIFsnY3VycmVudC1kb21haW4nXTogZG9tYWluID0+IHtcbiAgICBwcmVmcy5zZXQoJ2RvbWFpbicsIGRvbWFpbilcbiAgfSxcblxuICBbJ3VzZXI6cmVmcmVzaCddOiBhc3luYyAoZGF0YT17fSwgY2IpID0+IHtcbiAgICBsZXQge2xhenl9ID0gZGF0YSxcbiAgICAgIGxvZ2luRGF0ZSA9IGF3YWl0IHByZWZzLmdldCgnbG9naW5EYXRlJyksXG4gICAgICB1bml4VGltZSA9IHRpbWUgPT4gKHRpbWUgPyBuZXcgRGF0ZSh0aW1lKSA6IG5ldyBEYXRlKCkpLmdldFRpbWUoKVxuXG4gICAgaWYgKGxhenkgJiYgbG9naW5EYXRlICYmICh1bml4VGltZSgpIC0gdW5peFRpbWUobG9naW5EYXRlKSA8IDMwICogNjAgKiAxMDAwKSkge1xuICAgICAgY29uc29sZS5sb2coJ3VzZXIgcmVmcmVzaCBjYWNoZSBoaXQhJylcbiAgICAgIHJldHVybiBjYigpXG4gICAgfVxuICAgIGNvbnNvbGUubG9nKCd1c2VyIHJlZnJlc2ggZ2V0IHNlc3Npb24nLCB1bml4VGltZSgpLCB1bml4VGltZShsb2dpbkRhdGUpKVxuICAgIGxldCByZXN1bHQgPSBhd2FpdCBhdXRoLmxvZ2luKClcbiAgICBjYihyZXN1bHQgJiYgcmVzdWx0LmVycm9yKVxuICB9LFxuXG4gIHNpZ25pbjogKGRhdGEsIGNiKSA9PiBhdXRoLnNpZ25pbihkYXRhKS50aGVuKGNiKSxcblxuICBzaWdudXA6IChkYXRhLCBjYikgPT4gYXV0aC5zaWdudXAoZGF0YSkudGhlbihjYiksXG5cbiAgWydhc2stY2hyb21lLXBlcm1pc3Npb25zJ106IChwZXJtaXNzaW9ucywgY2IpID0+IHtcbiAgICB3aW5kb3cuY2hyb21lLnBlcm1pc3Npb25zLnJlcXVlc3Qoe3Blcm1pc3Npb25zfSwgY2IpXG4gIH0sXG5cbiAgWydjb250YWlucy1jaHJvbWUtcGVybWlzc2lvbnMnXTogKHBlcm1pc3Npb25zLCBjYikgPT4ge1xuICAgIHdpbmRvdy5jaHJvbWUucGVybWlzc2lvbnMuY29udGFpbnMoe3Blcm1pc3Npb25zfSwgY2IpXG4gIH0sXG5cbiAgWydnZXQtZG9tYWluJ106IChkYXRhLCBjYikgPT4gZ2V0RG9tYWluKGNiKSxcblxuICBbJ2dldC1wYWdlLWNvbmZpZyddOiAoe25vdXBkYXRlfSwgY2IpID0+IHBhZ2VDb25maWcubG9hZChub3VwZGF0ZSkudGhlbihjYiksXG5cbiAgWydzZXQtc2V0dGluZ3MnXTogc2V0dGluZ3MgPT4ge1xuICAgIGF1dGguc2V0U2V0dGluZ3Moc2V0dGluZ3MpXG4gICAgcHJlZnMuc2V0KCdzZXR0aW5ncycsIHNldHRpbmdzKVxuICB9LFxuXG4gIFsnb3Blbi11cmwnXTogdXJsID0+IGZvcmdlLnRhYnMub3Blbih1cmwpLFxuXG4gIFsncGFnZS1vcGVuZWQnXTogZnVuY3Rpb24oKSB7XG4gICAgdHJhY2tpbmcuZmlyZSgnZGFpbHktcGluZycpXG4gICAgZ2V0RG9tYWluKHNldFVuaW5zdGFsbFVSTClcbiAgfSxcblxuICBbJ2V4dGVybmFsOmNoYW5nZWQtcGxhbiddOiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICB0cmFja2luZy5jYWxsKCdmZWxvZy5pbmZvJywgJ2V4dGVybmFsLmNoYW5nZWQtcGxhbicpXG4gICAgYXdhaXQgYXV0aC5sb2dpbigpXG4gICAgbWVzc2FnZS5lbWl0VGFicygnY2hhbmdlZC1wbGFuJylcbiAgfSxcblxuICBbJ2V4dGVybmFsOmNoYW5nZWQtdXNlciddOiBmdW5jdGlvbigpIHtcbiAgICB0cmFja2luZy5jYWxsKCdmZWxvZy5pbmZvJywgJ2V4dGVybmFsLmNoYW5nZWQtdXNlcicpXG4gICAgYXV0aC5sb2dpbigpXG4gIH0sXG5cbiAgWydleHRlcm5hbDplZGl0b3ItZml4J106IGZ1bmN0aW9uKCkge1xuICAgIHRyYWNraW5nLmNhbGwoJ2ZlbG9nLmluZm8nLCAnZXh0ZXJuYWwuZWRpdG9yLWZpeCcpXG4gICAgcHJlZnMuaW5jRml4ZWQoKVxuICB9LFxuXG4gIFsnZXh0ZXJuYWw6Y2xlYW51cCddOiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICB0cmFja2luZy5jYWxsKCdmZWxvZy5pbmZvJywgJ2V4dGVybmFsLmNsZWFudXAnKVxuICAgIGNvbnN0IHByZXNlcnZlID0gWydleHRlbnNpb25JbnN0YWxsRGF0ZScsICdzZWVuTmV3c1ZlcnNpb24nLCAncmVmZXJyYWxOZXdzQmFkZ2UnLCAndmVyc2lvbiddXG4gICAgY29uc3QgdmFsdWVzID0gYXdhaXQgcHJlZnMuZ2V0KHByZXNlcnZlKVxuICAgIHByZWZzLmNsZWFyQWxsKClcbiAgICBwcmVmcy5zZXQocHJlc2VydmUucmVkdWNlKChvYmosIGtleSkgPT4gKHsuLi5vYmosIFtrZXldOiB2YWx1ZXNba2V5XX0pLCB7ZW5hYmxlZERlZnM6IGZhbHNlfSkpXG4gICAgYXV0aC5sb2dpbigpXG4gIH1cbn1cblxuaWYgKCFwcm9jZXNzLmVudi5QUk9EKSB7XG4gIE9iamVjdC5hc3NpZ24oQVBJLCB7XG4gICAgWydiZy1yZWxvYWQnXTogKCkgPT4gYmdQYWdlUmVsb2FkKCksXG5cbiAgICByZXNldDogKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1JFU0VUIFBSRUZTJylcbiAgICAgIHByZWZzLmNsZWFyQWxsKClcbiAgICAgIGxvY2FsZm9yYWdlLmNsZWFyKClcbiAgICB9LFxuXG4gICAgWydnZXQtdHJhY2tlci1sb2cnXTogKGRhdGEsIGNiKSA9PiB7XG4gICAgICBjYih0cmFja2luZy5nZXRMb2coKSlcbiAgICB9LFxuXG4gICAgWydnZXQtY2FwaS1sb2cnXTogKGRhdGEsIGNiKSA9PiB7XG4gICAgICBsZXQgbG9nID0gZ2V0U29ja2V0TG9nKClcbiAgICAgIGNvbnNvbGUubG9nKCdHRVRUSU5HIENBUEkgTE9HJywgbG9nKVxuICAgICAgY2IobG9nKVxuICAgIH0sXG5cbiAgICBbJ2dldC1leHRpZCddOiAoZGF0YSwgY2IpID0+XG4gICAgICBjYih3aW5kb3cuY2hyb21lID8gd2luZG93LmNocm9tZS5ydW50aW1lLmlkIDogbnVsbCksXG5cbiAgICBbJ3NldC1sb2NhbGZvcmFnZSddOiAoZGF0YSwgY2IpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdzZXQtbG9jYWxmb3JhZ2UnLCBkYXRhKVxuICAgICAgbG9jYWxmb3JhZ2Uuc2V0SXRlbShkYXRhLmtleSwgZGF0YS52YWx1ZSkudGhlbihjYilcbiAgICB9LFxuXG4gICAgWydnZXQtbG9jYWxmb3JhZ2UnXTogYXN5bmMgKGRhdGEsIGNiKSA9PiB7XG4gICAgICBsZXQgdmFsdWUgPSBhd2FpdCBsb2NhbGZvcmFnZS5nZXRJdGVtKGRhdGEua2V5KVxuICAgICAgY2IoJ2xvY2FsZm9yYWdlJywge2tleTogZGF0YS5rZXksIHZhbHVlfSlcbiAgICB9XG4gIH0pXG5cbn1cbiIsImltcG9ydCBmb3JnZSBmcm9tICcuLi9mb3JnZSdcbmltcG9ydCB7VVJMUywgdXNlckZpZWxkcywgZXh0Mmdyb3Vwc30gZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IHByZWZzIGZyb20gJy4uL3ByZWZzJ1xuaW1wb3J0IHtmZXRjaCwgcGFyYW1TdHJ9IGZyb20gJy4uL3JlcXVlc3QnXG5pbXBvcnQgY29va2llIGZyb20gJy4vY29va2llJ1xuaW1wb3J0IG1lc3NhZ2UgZnJvbSAnLi4vbWVzc2FnZSdcbmltcG9ydCB7Y2FsbCwgZmlyZX0gZnJvbSAnLi4vdHJhY2tpbmcvaW5kZXgnXG5pbXBvcnQge2dldEJyb3dzZXIsIGlzU2FmYXJpLCBpc0ZGfSBmcm9tICcuLi91dGlsJ1xuXG5cbmV4cG9ydCBkZWZhdWx0IChmdW5jdGlvbiBBdXRoKCkge1xuICBjb25zdCBMT0dJTl9CWV9DT09LSUVfQ0hBTkdFX1RJTUVPVVQgPSAxMDAwMFxuICBsZXQgdHJhY2tpbmdJbml0aWFsaXplZCwgd2F0Y2hlclxuXG4gIGNvb2tpZS53YXRjaFRva2VuKHJ1bkNvb2tpZVdhdGNoKVxuXG4gIGxldCBzYWZhcmlUYWJzQ291bnQgPSAwXG5cbiAgcmV0dXJuIHtcbiAgICBsb2dpbixcbiAgICBzaWduaW4sXG4gICAgc2lnbnVwLFxuICAgIHNldFNldHRpbmdzXG4gIH1cblxuICBmdW5jdGlvbiByZXF1ZXN0RXJyb3IoZSkge1xuICAgIGNhbGwoJ2ZlbG9nLndhcm4nLCAnYWpheF9lcnJvcicsIHtlfSlcbiAgICBjb25zb2xlLmVycm9yKCdyZXF1ZXN0IGZhaWxlZCcsIGUpXG4gICAgdGhyb3cgZVxuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gbG9naW4oKSB7XG4gICAgcmVzZXRDb29raWVXYXRjaCgpXG4gICAgdHJ5IHtcbiAgICAgIGxldCB1c2VyID0gYXdhaXQgZmV0Y2hVc2VyKClcbiAgICAgIGNvbnNvbGUubG9nKCdsb2dpbiB3aXRoJywgdXNlcilcbiAgICAgIG1lc3NhZ2UuZW1pdFRhYnMoJ3VzZXI6dXBkYXRlJylcbiAgICAgIHJldHVybiB1c2VyXG4gICAgfVxuICAgIGNhdGNoKGUpIHtcbiAgICAgIHByZWZzLnNldCgnbG9naW5EYXRlJywgMClcbiAgICAgIGNhbGwoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCAnc3RhYmlsaXR5OnVzZXJfbG9naW5fZXJyb3InKVxuICAgICAgY2FsbCgnZmVsb2cuZXJyb3InLCAndXNlcl9sb2dpbl9lcnJvcicsIGUpXG4gICAgICByZXR1cm4ge2Vycm9yOiBlLm1lc3NhZ2V9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZnVuY3Rpb24gYXV0aFJlcXVlc3QodXJsLCBkYXRhLCBzdWNjZXNzTWV0cmljKSB7XG4gICAgbGV0IHJlc3BvbnNlXG4gICAgdHJ5IHtcbiAgICAgIC8vcGFyYW1zW106bmV3ZnVubmVsXG4gICAgICByZXNwb25zZSA9IGF3YWl0IGZldGNoKHVybCwge1xuICAgICAgICBib2R5OiBwYXJhbVN0cihkYXRhKSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ1xuICAgICAgICB9LFxuICAgICAgICBtZXRob2Q6ICdwb3N0J1xuICAgICAgfSlcbiAgICAgIGlmICghcmVzcG9uc2UuZXJyb3IpIHtcbiAgICAgICAgYXdhaXQgbG9naW4oKVxuICAgICAgICBmaXJlKHN1Y2Nlc3NNZXRyaWMpXG4gICAgICB9XG4gICAgfVxuICAgIGNhdGNoKGUpIHtcbiAgICAgIGNvbnNvbGUud2FybignYXV0aCBlcnJvcicsIGUpXG4gICAgICByZXNwb25zZSA9IHtlcnJvcjogZS5tZXNzYWdlfVxuICAgIH1cbiAgICByZXR1cm4gcmVzcG9uc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIHNpZ25pbihkYXRhKSB7XG4gICAgcmV0dXJuIGF1dGhSZXF1ZXN0KFVSTFMuYXV0aFNpZ25pbiwgZGF0YSwgJ2FwcF9zaWduaW5fc3VjY2VzcycpXG4gIH1cblxuICBmdW5jdGlvbiBzaWdudXAoZGF0YSkge1xuICAgIHJldHVybiBhdXRoUmVxdWVzdChVUkxTLmF1dGhTaWdudXAsIGRhdGEsICdhcHBfc2lnbnVwX3N1Y2Nlc3MnKVxuICB9XG5cbiAgZnVuY3Rpb24gc2V0U2V0dGluZ3MoZGF0YSkge1xuICAgIGlmICghKGRhdGEgaW5zdGFuY2VvZiBPYmplY3QpKSByZXR1cm5cbiAgICByZXR1cm4gZmV0Y2goVVJMUy5hdXRoU2V0dGluZ3MsIHtkYXRhLCBtZXRob2Q6ICdwb3N0J30pXG4gIH1cblxuICBmdW5jdGlvbiB1c2VyT3B0cygpIHtcbiAgICBsZXQgY29udGFpbmVySWQgPSB3aW5kb3cudHJhY2tlciAmJiB3aW5kb3cudHJhY2tlci5nbmFyLm1ldGEoKS5jb250YWluZXJJZCxcbiAgICAgIGFwcCA9IGAke2dldEJyb3dzZXIoKX1FeHRgXG5cbiAgICByZXR1cm4ge1xuICAgICAgZGF0YToge1xuICAgICAgICBmaWVsZDogWydtaXhwYW5lbC5kaXN0aW5jdF9pZCcsICdzdGF0X2ZlZWRiYWNrX0FDQ0VQVCddLFxuICAgICAgICBhcHAsXG4gICAgICAgIGNvbnRhaW5lcklkXG4gICAgICB9fVxuICB9XG5cbiAgZnVuY3Rpb24gc2FmYXJpU2V0R3JhdXRoKCkge1xuICAgIGlmICghaXNTYWZhcmkoKSkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpXG5cbiAgICByZXR1cm4gZmV0Y2goVVJMUy5hdXRoVXNlciwgdXNlck9wdHMoKSlcbiAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICBpZiAoZXJyID09ICd1c2VyX25vdF9hdXRob3JpemVkJykgcmV0dXJuIHNhZmFyaUhhY2soKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKVxuICAgICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHNhZmFyaUhhY2soKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGlmIChzYWZhcmlUYWJzQ291bnQgPiAxKSB7XG4gICAgICAgIGNhbGwoJ2ZlbG9nLmVycm9yJywgJ3Rvb19tYW55X3RhYnMnLCB7XG4gICAgICAgICAgdGFiQ291bnQ6IHNhZmFyaVRhYnNDb3VudCxcbiAgICAgICAgICBjb29raWVzRW5hYmxlZDogd2luZG93Lm5hdmlnYXRvci5jb29raWVFbmFibGVkLFxuICAgICAgICAgIGNvb2tpZXM6IGRvY3VtZW50LmNvb2tpZVxuICAgICAgICB9KVxuICAgICAgICByZXNvbHZlKClcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBmb3JnZS50YWJzLm9wZW4oVVJMUy5hdXRoQ3JlYXRlUGFnZSwgdHJ1ZSwgcmVzb2x2ZSwgcmVqZWN0KVxuICAgICAgICBzYWZhcmlUYWJzQ291bnQrK1xuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBmZXRjaFVzZXJPckFub255bW91cyh1c2VyKSB7XG4gICAgaWYgKHVzZXIgJiYgdXNlci50eXBlICE9ICduYXZpZ2F0ZScpIHJldHVybiB1c2VyXG5cbiAgICByZXR1cm4gZmV0Y2goVVJMUy51c2VyT3JBbm9ueW1vdXMsIHVzZXJPcHRzKCkpXG4gIH1cblxuXG4gIGZ1bmN0aW9uIGZldGNoVXNlcigpIHtcbiAgICBjYWxsKCdmZWxvZy5pbmZvJywgJ2F1dGhfcmVxdWVzdCcsIHt0eXBlOiAnZmV0Y2hVc2VyJ30pXG5cbiAgICByZXR1cm4gc2FmYXJpU2V0R3JhdXRoKClcbiAgICAgIC50aGVuKGZldGNoVXNlck9yQW5vbnltb3VzKVxuICAgICAgLnRoZW4odXNlciA9PiB7XG4gICAgICAgIHVzZXIudG9rZW4gPSB1c2VyLmdyYXV0aFxuICAgICAgICB1c2VyLnByZW1pdW0gPSB1c2VyLnR5cGUgPT0gJ1ByZW1pdW0nXG4gICAgICAgIHVzZXIuZml4ZWRfZXJyb3JzID0gKHVzZXIuY3VzdG9tRmllbGRzICYmIHVzZXIuY3VzdG9tRmllbGRzLnN0YXRfZmVlZGJhY2tfQUNDRVBUKSB8fCAnMCcvL2VzbGludC1kaXNhYmxlLWxpbmVcblxuICAgICAgICByZXR1cm4gdXNlclxuICAgICAgfSlcbiAgICAgIC50aGVuKGZldGNoTWltaWMpXG4gICAgICAudGhlbihzZXRVc2VyKVxuICAgICAgLmNhdGNoKHJlcXVlc3RFcnJvcilcbiAgfVxuXG4gIGZ1bmN0aW9uIGZldGNoTWltaWMoZGF0YSkge1xuICAgIGlmIChkYXRhLmFub255bW91cykgcmV0dXJuIGRhdGFcblxuICAgIHJldHVybiBmZXRjaChVUkxTLmRhcGlNaW1pYylcbiAgICAgIC50aGVuKG1pbWljID0+IHtcbiAgICAgICAgZGF0YS5taW1pYyA9IChtaW1pYyAmJiBtaW1pYy5ncm91cHMpID8gbWltaWMuZ3JvdXBzIDogW11cblxuICAgICAgICAvL2RhdGEubWltaWMgPSBbJ3JlZmVycmFsX2dtYWlsJywgJ3JlZmVycmFsX2didXR0b24nLCAncmVmZXJyYWxfcG9wdXAnXVxuICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnJvciA9PiB7XG4gICAgICAgIGNhbGwoJ2ZlbG9nLndhcm4nLCAnZmV0Y2hfbWltaWNfZmFpbCcsIHtlcnJvcn0pXG4gICAgICAgIGRhdGEubWltaWMgPSBbXVxuICAgICAgICByZXR1cm4gZGF0YVxuICAgICAgfSlcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIHNldFVzZXIoZGF0YSkge1xuICAgIGNhbGwoJ2ZlbG9nLmluZm8nLCAnYXV0aF9yZXF1ZXN0Jywge3R5cGU6ICdzZXRVc2VyJ30pXG5cbiAgICBjb25zdCB7aWQsIGVtYWlsLCBhbm9ueW1vdXN9ID0gYXdhaXQgcHJlZnMuZ2V0KFsnaWQnLCAnZW1haWwnLCAnYW5vbnltb3VzJ10pXG5cbiAgICBpZiAoZW1haWwgJiYgIWFub255bW91cyAmJiBkYXRhLmFub255bW91cykge1xuICAgICAgY2FsbCgnZmVsb2cud2FybicsICd1bmV4cGVjdGVkX3VzZXJfY29udmVydF90b19hbm9ueW1vdXMnLCB7ZW1haWx9KVxuICAgIH1cblxuICAgIGNvbnN0IHttaW1pY30gPSBkYXRhXG4gICAgZGF0YS5leHQyID0gbWltaWMgJiYgbWltaWMubGVuZ3RoICYmIGV4dDJncm91cHMuc29tZShwcm9wID0+IG1pbWljLmluY2x1ZGVzKHByb3ApKVxuICAgIC8vIGRhdGEuZXh0MiA9IHRydWVcbiAgICB1c2VyRmllbGRzLmZvckVhY2gocCA9PiBwcmVmcy5zZXQocCwgZGF0YVtwXSkpXG4gICAgcHJlZnMuc2V0KCdsb2dpbkRhdGUnLCBuZXcgRGF0ZSgpKVxuXG4gICAgaWYgKGlkICE9IGRhdGEuaWQpIHtcbiAgICAgIHRyYWNraW5nSW5pdGlhbGl6ZWQgPSBmYWxzZVxuICAgIH1cblxuICAgIGluaXRUcmFja2luZyhkYXRhKVxuXG4gICAgcmV0dXJuIGRhdGFcbiAgfVxuXG4gIGZ1bmN0aW9uIGluaXRUcmFja2luZyh7aWQsIG5hbWUsIGFub255bW91cywgcHJlbWl1bSwgZW1haWwsIHR5cGUsIGV4dDJ9KSB7XG4gICAgaWYgKHRyYWNraW5nSW5pdGlhbGl6ZWQpIHJldHVyblxuXG4gICAgdHJhY2tpbmdJbml0aWFsaXplZCA9IHRydWVcblxuICAgIGNhbGwoJ2duYXIuc2V0VXNlcicsIGlkKVxuICAgIGNhbGwoJ21peHBhbmVsLmluaXRQcm9wcycpXG4gICAgY2FsbCgnZmVsb2cuc2V0VXNlcicsIHtpZCwgbmFtZSwgYW5vbnltb3VzLCBwcmVtaXVtLCBlbWFpbCwgdHlwZSwgZXh0Mn0pXG4gICAgaWYgKCFpc0ZGKCkpIGZpcmUoJ2RhaWx5LXBpbmcnKVxuICB9XG5cbiAgZnVuY3Rpb24gcnVuQ29va2llV2F0Y2godG9rZW4pIHtcbiAgICByZXNldENvb2tpZVdhdGNoKClcbiAgICB3YXRjaGVyID0gc2V0VGltZW91dCgoKSA9PiBvbkNvb2tpZVRva2VuKHRva2VuKSwgTE9HSU5fQllfQ09PS0lFX0NIQU5HRV9USU1FT1VUKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVzZXRDb29raWVXYXRjaCgpIHtcbiAgICBjbGVhclRpbWVvdXQod2F0Y2hlcilcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIG9uQ29va2llVG9rZW4odG9rZW4pIHtcbiAgICBsZXQgY3VyID0gYXdhaXQgcHJlZnMuZ2V0KCd0b2tlbicpXG4gICAgaWYgKHRva2VuID09IGN1cikgcmV0dXJuXG4gICAgY29uc29sZS53YXJuKCdjb29raWUgY2hhbmdlIScsIHRva2VuKVxuICAgIGNhbGwoJ2ZlbG9nLmluZm8nLCAnYXV0aF9yZXF1ZXN0Jywge3R5cGU6ICdvbkNvb2tpZVRva2VuJ30pXG4gICAgcmV0dXJuIGxvZ2luKClcbiAgfVxufSgpKVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgX2ZvcmdlID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ2ZvcmdlJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydmb3JnZSddIDogbnVsbCk7XG5cbnZhciBfZm9yZ2UyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZm9yZ2UpO1xuXG52YXIgX3V0aWwgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbnZhciBfcGFnZUNvbmZpZyA9IHJlcXVpcmUoJy4uL3BhZ2UtY29uZmlnJyk7XG5cbnZhciBfcGFnZUNvbmZpZzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wYWdlQ29uZmlnKTtcblxudmFyIF90cmFja2luZ0luZGV4ID0gcmVxdWlyZSgnLi4vdHJhY2tpbmcvaW5kZXgnKTtcblxudmFyIF9wcmVmcyA9IHJlcXVpcmUoJy4uL3ByZWZzJyk7XG5cbnZhciBfcHJlZnMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcHJlZnMpO1xuXG52YXIgX25ld3MgPSByZXF1aXJlKCcuL25ld3MnKTtcblxudmFyIF9uZXdzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX25ld3MpO1xuXG52YXIgX3JlZmVycmFscyA9IHJlcXVpcmUoJy4vcmVmZXJyYWxzJyk7XG5cbnZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xudmFyIERFRkFVTFRfQkFER0VfQ09MT1IgPSAnI2U3NTE0Nic7XG4vLyBjb25zdCBESVNBQkxFRF9PTl9ET01BSU5fQkFER0VfQ09MT1IgPSAnIzlCOUI5QidcblxuZnVuY3Rpb24gY2hlY2tCYWRnZSgpIHtcbiAgc2V0SW50ZXJ2YWwoY2hyb21lQmFkZ2UsIDEwMDApO1xufVxuXG5mdW5jdGlvbiBzZXRCYWRnZUNvbG9yKGNvbG9yKSB7XG4gIGlmICgoMCwgX3V0aWwuaXNTYWZhcmkpKCkpIHJldHVybjtcbiAgX2ZvcmdlMlsnZGVmYXVsdCddLmJ1dHRvbi5zZXRCYWRnZUJhY2tncm91bmRDb2xvcih7IGNvbG9yOiBjb2xvciB9LCBfdXRpbC5fZiwgX3V0aWwuX2YpO1xufVxuXG5mdW5jdGlvbiBzZXRCYWRnZURlZmF1bHRDb2xvcigpIHtcbiAgc2V0QmFkZ2VDb2xvcihERUZBVUxUX0JBREdFX0NPTE9SKTtcbn1cblxuZnVuY3Rpb24gdXBkYXRlQmFkZ2UoZG9tYWluKSB7XG4gIHZhciBlbmFibGVkT25Eb21haW47XG4gIHJldHVybiByZWdlbmVyYXRvclJ1bnRpbWUuYXN5bmMoZnVuY3Rpb24gdXBkYXRlQmFkZ2UkKGNvbnRleHQkMSQwKSB7XG4gICAgd2hpbGUgKDEpIHN3aXRjaCAoY29udGV4dCQxJDAucHJldiA9IGNvbnRleHQkMSQwLm5leHQpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgY29udGV4dCQxJDAubmV4dCA9IDI7XG4gICAgICAgIHJldHVybiByZWdlbmVyYXRvclJ1bnRpbWUuYXdyYXAoX25ld3MyWydkZWZhdWx0J10uaXNTaG93TmV3cygpKTtcblxuICAgICAgY2FzZSAyOlxuICAgICAgICBjb250ZXh0JDEkMC50MCA9IGNvbnRleHQkMSQwLnNlbnQ7XG5cbiAgICAgICAgaWYgKGNvbnRleHQkMSQwLnQwKSB7XG4gICAgICAgICAgY29udGV4dCQxJDAubmV4dCA9IDc7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICBjb250ZXh0JDEkMC5uZXh0ID0gNjtcbiAgICAgICAgcmV0dXJuIHJlZ2VuZXJhdG9yUnVudGltZS5hd3JhcCgoMCwgX3JlZmVycmFscy5pc1Nob3dSZWZlcnJhbFJpYmJvbikoKSk7XG5cbiAgICAgIGNhc2UgNjpcbiAgICAgICAgY29udGV4dCQxJDAudDAgPSBjb250ZXh0JDEkMC5zZW50O1xuXG4gICAgICBjYXNlIDc6XG4gICAgICAgIGlmICghY29udGV4dCQxJDAudDApIHtcbiAgICAgICAgICBjb250ZXh0JDEkMC5uZXh0ID0gOTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb250ZXh0JDEkMC5hYnJ1cHQoJ3JldHVybicsIHNldEJhZGdlKCdORVcnKSk7XG5cbiAgICAgIGNhc2UgOTpcbiAgICAgICAgZW5hYmxlZE9uRG9tYWluID0gX3BhZ2VDb25maWcyWydkZWZhdWx0J10uY2hlY2tEb21haW4oZG9tYWluKTtcblxuICAgICAgICBfcHJlZnMyWydkZWZhdWx0J10uZW5hYmxlZCgnJywgZG9tYWluLCBmdW5jdGlvbiAoZW5hYmxlZCkge1xuICAgICAgICAgIGlmICghZW5hYmxlZE9uRG9tYWluKSB7XG4gICAgICAgICAgICAvLyBzZXRCYWRnZUNvbG9yKERJU0FCTEVEX09OX0RPTUFJTl9CQURHRV9DT0xPUilcbiAgICAgICAgICAgIHJldHVybiBzZXRCYWRnZSgnJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNldEJhZGdlRGVmYXVsdENvbG9yKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNldEJhZGdlKGVuYWJsZWQgJiYgZW5hYmxlZE9uRG9tYWluID8gJycgOiAnb2ZmJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICBjYXNlIDExOlxuICAgICAgY2FzZSAnZW5kJzpcbiAgICAgICAgcmV0dXJuIGNvbnRleHQkMSQwLnN0b3AoKTtcbiAgICB9XG4gIH0sIG51bGwsIHRoaXMpO1xufVxuXG5mdW5jdGlvbiBjaHJvbWVCYWRnZSgpIHtcbiAgX2ZvcmdlMlsnZGVmYXVsdCddICYmIF9mb3JnZTJbJ2RlZmF1bHQnXS50YWJzICYmIF9mb3JnZTJbJ2RlZmF1bHQnXS50YWJzLmdldEN1cnJlbnRUYWJVcmwoZnVuY3Rpb24gKHVybCkge1xuICAgIGlmICgoMCwgX3V0aWwuY2hyb21lQmdFcnJvcikoKSkgcmV0dXJuICgwLCBfdHJhY2tpbmdJbmRleC5jYWxsKSgnZmVsb2cuZXJyb3InLCAnY2hyb21lX2JnX2Vycm9yJywgeyBtZXNzYWdlOiAoMCwgX3V0aWwuY2hyb21lQmdFcnJvcikoKSB9KTtcbiAgICBpZiAoIXVybCkgcmV0dXJuO1xuICAgIGEuaHJlZiA9IHVybDtcbiAgICB2YXIgZG9tYWluID0gYS5ob3N0bmFtZTtcbiAgICB1cGRhdGVCYWRnZShkb21haW4pO1xuICB9KTtcblxuICBpZiAoIV9mb3JnZTJbJ2RlZmF1bHQnXSB8fCAhX2ZvcmdlMlsnZGVmYXVsdCddLnRhYnMpIHtcbiAgICAoMCwgX3RyYWNraW5nSW5kZXguY2FsbCkoJ2ZlbG9nLndhcm4nLCAnZm9yZ2VfYmFkZ2VfdW5kZWZpbmVkJyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlKCkge1xuICBpc1RoZXJlUGFnZXNUb1JlbG9hZChmdW5jdGlvbiAoaXNSZWxvYWQpIHtcbiAgICBpZiAoIWlzUmVsb2FkKSByZXR1cm47XG4gICAgc2hvd1VwZGF0ZVBvcHVwKCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBzaG93VXBkYXRlUG9wdXAoKSB7XG4gIHZhciBvcHRzID0ge1xuICAgIHRpdGxlOiAnR3JhbW1hcmx5IG5lZWRzIHRvIGJlIHJlbG9hZGVkJyxcbiAgICB0ZXh0OiAnV2hpbGUgeW91IHdlcmUgd29ya2luZywgd2UgdXBkYXRlZCBHcmFtbWFybHkuIFRvIHRha2UgYWR2YW50YWdlIG9mIHRoZXNlIGltcHJvdmVtZW50cywgcGxlYXNlIHNhdmUgdGhlIHRleHQgeW91IGFyZSB3b3JraW5nIG9uLCBhbmQgY2xpY2sgaGVyZS4nLFxuICAgIGljb25VUkw6ICdkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUtBQUFBQ2dDQUlBQUFBRXJmQjZBQUFBR1hSRldIUlRiMlowZDJGeVpRQkJaRzlpWlNCSmJXRm5aVkpsWVdSNWNjbGxQQUFBQXlocFZGaDBXRTFNT21OdmJTNWhaRzlpWlM1NGJYQUFBQUFBQUR3L2VIQmhZMnRsZENCaVpXZHBiajBpNzd1L0lpQnBaRDBpVnpWTk1FMXdRMlZvYVVoNmNtVlRlazVVWTNwcll6bGtJajgrSUR4NE9uaHRjRzFsZEdFZ2VHMXNibk02ZUQwaVlXUnZZbVU2Ym5NNmJXVjBZUzhpSUhnNmVHMXdkR3M5SWtGa2IySmxJRmhOVUNCRGIzSmxJRFV1Tmkxak1ERTBJRGM1TGpFMU5qYzVOeXdnTWpBeE5DOHdPQzh5TUMwd09UbzFNem93TWlBZ0lDQWdJQ0FnSWo0Z1BISmtaanBTUkVZZ2VHMXNibk02Y21SbVBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHhPVGs1THpBeUx6SXlMWEprWmkxemVXNTBZWGd0Ym5NaklqNGdQSEprWmpwRVpYTmpjbWx3ZEdsdmJpQnlaR1k2WVdKdmRYUTlJaUlnZUcxc2JuTTZlRzF3UFNKb2RIUndPaTh2Ym5NdVlXUnZZbVV1WTI5dEwzaGhjQzh4TGpBdklpQjRiV3h1Y3pwNGJYQk5UVDBpYUhSMGNEb3ZMMjV6TG1Ga2IySmxMbU52YlM5NFlYQXZNUzR3TDIxdEx5SWdlRzFzYm5NNmMzUlNaV1k5SW1oMGRIQTZMeTl1Y3k1aFpHOWlaUzVqYjIwdmVHRndMekV1TUM5elZIbHdaUzlTWlhOdmRYSmpaVkpsWmlNaUlIaHRjRHBEY21WaGRHOXlWRzl2YkQwaVFXUnZZbVVnVUdodmRHOXphRzl3SUVORElESXdNVFFnS0UxaFkybHVkRzl6YUNraUlIaHRjRTFOT2tsdWMzUmhibU5sU1VROUluaHRjQzVwYVdRNk1UZ3pNamhDTWtRMU5qQkdNVEZGTkRnME5qQkVNRU5CTmtWRk56QTNSRGtpSUhodGNFMU5Pa1J2WTNWdFpXNTBTVVE5SW5odGNDNWthV1E2TVRnek1qaENNa1UxTmpCR01URkZORGcwTmpCRU1FTkJOa1ZGTnpBM1JEa2lQaUE4ZUcxd1RVMDZSR1Z5YVhabFpFWnliMjBnYzNSU1pXWTZhVzV6ZEdGdVkyVkpSRDBpZUcxd0xtbHBaRG94T0RNeU9FSXlRalUyTUVZeE1VVTBPRFEyTUVRd1EwRTJSVVUzTURkRU9TSWdjM1JTWldZNlpHOWpkVzFsYm5SSlJEMGllRzF3TG1ScFpEb3hPRE15T0VJeVF6VTJNRVl4TVVVME9EUTJNRVF3UTBFMlJVVTNNRGRFT1NJdlBpQThMM0prWmpwRVpYTmpjbWx3ZEdsdmJqNGdQQzl5WkdZNlVrUkdQaUE4TDNnNmVHMXdiV1YwWVQ0Z1BEOTRjR0ZqYTJWMElHVnVaRDBpY2lJL1BnMXpZV1FBQUEva1NVUkJWSGphN0oxNWRGTlZIc2Z6MG5SSjA2Wk45MzJGYnRCU29LMkFsTTJoVmhZWkFldFVSV2habkJFUUJJdmpNSXZqY282V0VRVlpCQm1xSWlDb3FGU1F3MTRLQ0hTbDFHNTBwVXVhYmlGSm16VGRNcjlESFkvQ1MwaVQrNVlrOTN2NFE1UDB2bmQvbi9mdS9mM3V2Yjk3Q1kxR3c4RXlYM0d4Q1RCZ0xBd1lDd1BHd29DeE1HQXNEQmdMQThhQXNUQmdMQXdZQ3dQR3dvQ3hNR0FzREJnRHhzS0FzVEJnTEF3WUN3UEd3b0N4TUdBc0RCZ0R4c0tBc1RCZ0xBd1lDd1BHd29DeE1HQU1HQXNEeHNLQXNUQmdMQXdZQ3dQRzBpbWVCZGE1ZDdDL3VydTFVaTV1VW5ZMXE3cGFWRkpwWDQrc1R5a2ZVUFVQRGY3Nk0ydXVsWkRIZDdLeEY5a0lmUGdpWDc2TG43MUx1TkI3bElPWG5aVzFxVlNXc0pCZGR0cDY1VDkxVkJWSzZ3dTY2dXA2Mm9hTXFEV1hJSUlGSGhOZGdpZUlnaWE3aFhuWUNURmd4bFNsRUo5c0tjNXBLNitRdDFCMGlRaWh6M1NQeURrK3NXR08zaGd3VFdwWHk0ODE1bjNmbEYvWDAwN2JSWU1GN2d2ODRoYjZ4N3ZiQ2pGZ3FnU05jRmJ0eFF1U3NrSE5FQ00zWUVWd1ozcEdwWVhNZ0FZY0EwYXAzUGFLSFZXblMrN2VZY245eERnSHJBbExTblNQd0lDTjFZM09tdmNyVHJBSDdYMllOMGJNVFhBTnhZQU5FY1E1bWVYWloxcHZzZncrWjN0RmI0cWNEMUVXQnF5dm9Jdk5xczNaZWZzMEJMVW1jY01RT3E4ZW5aUVdNaDA2YVF6NElhcnBsbVFVSFNxWE41dmNuVWNLZmJlTWZ6YlV3Uk1ESnBlR296bmNjRFd6TEZzOU5HQ2kzWW90bDdjcGFuNXE0QlNDUTJEQXY1TnlRTDI1NU9ncDhVMHo4UG1UdmNlOUU1Tml6N1BGZ0gvUkhXWG5TM243b1hFMm01QWRHdXBkOGVrQjlxNFlNS2RJV3I4NlAwdmExOE14TDRsc0JEdmowc1pUT1NSaUFvRFBTMzdlVUhqQWREdmRoM2JKV3ljc21lVTV4a0lCbjJ3cGZxMzQ4SUJta0dPKzRoRlc3OFdtenZHSnRUakFRRGVqK09DUUJVeG9jZ2xpUyt4elZEQm03NG9PYUpuaDNSMnlqT2xxcUNaVUZxcHNLWURCcTRKKzE3eGI1dnNFbFlVcVE4WE5IekJFUk9Bem02dFhwVU5RWmFnNFZOK2NBU3NIMUJEdm1sOUVwS2VnNGxCOU1JSjVBdFp3Tkp0TGpwclRhSVlCZ3VxREVjQVVhRngwVnRYdGNNTlZSa1lpcmJsVzNuYk9ubnhub1RXZlIzQzVCTGR2YUVEUnIrcFFLOFNxdTZyQlBwcnZCNHdRM3hEeWJPQ2paaFVtd1pPN0tQY0RlcnBlZ2tORU9mbE9jaDAxMXRrL3hqbkFoeS9TOFdOZ1hLVVFGM1RWRlVycmlxVU45Q3dHc3VYeXZrbDh4Zmg1SjdZQUJxczlmWGtiRFRPQWdQT1Bmbkd6UE1kNDJqa1o4T2V5ZnVYWjF0TGp6UVY1bmJXb1dsRnRpaFQ2ZmpWMW5aSHp4MndCdksvbXd2c1ZKNmdySDh3MHozZkNrcUNwWTV6OFVMbjZuOWJtZk51VVIrbUtnNDBSYzFlRXpqUjV3RTNLcnZtWHRsQmtLUzVCSkh1UFd4ZVdIQ0J3UTE0NGROSzdicDg1ZXVjYVJlMjJuWlYxOXJRTVk5YjZzQUx3eXdXZlViU3VDdnF3dDJLZUhrL3hDbGJ3SHY1MTYydm9wS2tvZkxaWDlQYUpTMDBZOEkzT21xWFhkbFB4NHE0TW5iVjZkQko0eVBRRWVBZnFMa012MDBlQmsvalpwTDhZdkM2VCtUaVlpcTdYeWRwK1QveUs5ZUZQMEVOMzJDMS9JVGp4OEpTMVZDeWROTVpFREwvQnVlMFZxMjdzUTF0bXNNQjkzeU9yZEVjK3YwclNLOHZ2cWkyNWU2ZGFJUkdycEoxOTNUMERhcUFsNE5tNjJUb0NyZEdPWHJHaUlIaUJISGwyK2hRbzdldFprNTlWaUhwSWVXL0NDc1BXMERNTStKa3IyOUV1V0FjbitaT0VsU0liZ2U2ZkFjanZHdk5PaW92TFpIb0ZaanpDYXJMYjZDZjlKaVo1UmR0d0h6STZCTjdpaHFJREZ5UmxhS083STQrK2JHS0E0VEYvN3VvT2hBV09kZkxQbXZTaWc4NVhEY0tiUGRWbnM1c0xmNXNLckw5Y2JSeWVENTY2TkhnYTM4cEd4ODhHTklOcjh6KzcySWFTOGNFcGF3eklkMklTOE5xQ1Q4KzJscUlxTFZEZ0JsMmdqbmNYMnQ3dFZhY08xVjgxZmhZU01LK1BlR0t4L3lPNjMrUDA2M3NRVHYvOXdXdnNSeE9YbVF6Z2RyVjg1cm0zVVlXUDRGVjlrN2plbDYvVndibmVXZjM2elMvRnFyc0lxeERuRXZKdTdKOTBYRlRXcjF5VSsyR3pxZ3ZWV00yRngvNCswdHhVeHJ6b1k0MTVxT2lDVC9SZWJLb09RKytwUHJmOCtsNjBkRUhnblQxMWFlczU3Y3N3NExHREVOYVdpMlpHQjh3RlJqT1pNT243cG54VVJTMFBuVEhkSTVMMHF5R05CbDdjRHl0L3BHaWtTVEhRdXpiLzA3M1Y1N1g5SU1ySjk1V0lPUXdhalJuQVZRb3hxdHo3SUlINzJyREh0ZEhOS0Q3NEhib25TZHNReHdlVko5OHRPNjd0QnhBZmd3K001RnBnTkRDZENRQSsyVktNcW5GK0kzcVJ0cmpsamRLdlVWM280WU5OZFplMmxQK2c3U1pUQWlZeFpUcG1BT2UwbFNNcDUzSHZtRWRjUjVGKzlYbGQ3bGQzcnROWnFmMjFGK0dpcEY4aEhONGFxZWtZQU56V0swZXk1dzJYSU5hRUpaRitWU3ByL0UvRkQvUlhMYk04KzFwbjlZT2YxM2Ezb2JvRW1BNE15R3JBUDNWVUlTa24yWHNjNllLSC9xSEJ2OTA4WXRnNGh2R09ia2JSUVVXLzZyNkErSUNXTjVzR0F6SUFHTlU0N1pLZ1JDMk44NlhiaWxhbW9vTU90ZUtGYTd0djNXMGMvdCthYnNtS0czdlI3dVkwSWdNeXNPZ095YnhwbUtOM3JDaVFORzdaVTNPZXc2aWdGVTI1c2sxa0krQVJWdTFxT2JNR3BCc3d0RmQxUFFnNnBJWCs4YVNmUTJONFh3dkpsS2hiMmcwR0JEUHF1VjhtM1UxMGRYY3JrblFqMG56TEFjM2dvZm9ySEhNWEdCRE15TkkrdUZJdU5yNFE4SzM4eVJMakwwcktPL3U2T1JZZy9jMUlOK0FtSllLUjk4bHVvMGsvLzFGY3pMRU02VzlHdWdFam1WcUpkdlluYmJndXQxZGFDR0Q5elVnMzRCYVYxUGhDU05jMlZ5bkVjbmE0VjZ3eUk5MkFqZmN0dVFRUkpIQi84UE5TV1NQSFlxUy9HZWtHTE90VEdsbUNxNDBqYVRaSERicmhRUFpMZnpQU0RWZytZR3dycWkyblNJSjZQcC9OMHQrTWRBTTJmb2pZbmtlKzJxM0xrbkxHOVRlaitSeXJRMzhXcjBuSWZBRFR2RTB2Qmt5M1RPZ3NJM01HYkh5eWtMWmcxOFhHd1hLdzZXOUd1Z0VMZVh3alMyaFhLMGcvOTdVWFdRNWcvYzFJTjJBbkczc2pTK2hTZDVPdWdRMFdlRmdPWVAzTlNEZmdoNmFGUFZRYWpxYWViSUVFNlFDMXVVcC9NOUlOV00rc1R0MjZLU1ZKU0F4eDhERCs2VEVWNlc5R3VsZDA2RWd3MFYrbHNzWUhWM1FRSEdLS1c5aUpsaUxxYmg0dU1jdHJ6SGpuUUdzanNsRjIzVDRqNjFmU1prYTZBU05aSVp6ZlZVdjZlWkozTkhXQWJibThYZkhwOEF3WldjN25kYm5HQTliZmpIUTMwZUZDQkVkMDNsYTAzdW5wZVBEejZSNVJqdFo4aXU1OGVlaE00K25TYjBhNkFZOXk4T0lTQ0k2VElkMlZCMTZ5aFg3eEZOMTVzdmM0dG94ZEVBU1lrYVdBN2F5c2tjUXpKN1NrNkN3TG5rYlJ4aXZhSmpub0Z4aFEvMkU3Qm9ZcUo3b0VHMTlJdWJ5WmRIbXdGOS81bVlESlZOeDJpWlF0aDErT3lJQU1BRVoxc0s2MlRLK1h3eDUzcFdEWWNsdlZLWmJzWWowaUF6SUFlRElpVitXY3BKUjB4QVA4ckg5SEwwWisydzA5SFNsWHRoMXZMbWp0bFNrR2V1LzdWOWZUZnFtdEhMNWxtd0VaU0YzeHNCTkdDSDJNVHpBYzFBeGxsbWZ2aWt0LzhLdkh2TVkrSHpUMWkvckxhTys4U2RuMVd2RmhIVkh5enJnMHFxMEhwZ01Ec3ZvTnZoZlBSQ0lwNTRLa2pEUmRFL1RYcUNlbnVvZlRXYWwxNGNrelBhUFlaanBtQUNNOElPaXQwbU9rMjBOYUVkenRFNWNpY2VqMFVXcmdsQmRIUGNaQzB6RURPTXpSTzVoczZhc0JxdTF1MjFaNWl2UXJ2cFhOdm9SVjB3emFBWEJrWXlBaE0vNDVkaUV0QVpJN21NNEVBSU1XK01XaEtpcXJOdWRTZTRXMnNIdDMvUEwwa0JrVUhkWnJ5K1c5SFpQeWF1UTgxaHFOTWNBTC9lTlJyYUxTY0RRWlJRZnJ0U1JaY3draUkzTGV4d25MSVVSRzd1OGNlWFRkSXY4RWVpd0c1dEtXTk10R3dPNjJRb1F1aWJ4ZjlXTGVmM1drRmtKRC9jTzBqRldqWmlGWnVpV3lFYndldGVEcnFldDFqQW1EeTQxMjZ6VXcxMGkzdWVNd3UrZ3VMV1FHd3RMdTlIU2tYOXVqWXl4Q3dMTjlKWHpPbVpsL0EyL0k0SkVRUDN1WDF5TG5uNXUxK1lYZ1JCMHRrS1JYdHZMR0oyam5wdzB6RjVQbkprMFFCY1U0QnlEY1RyaEtJVjUyN2VOUEVsYnFpQlRkYkIzWGh6K3hKaXpwY252bG1kWmIxenFxOVVua0NuWHdmTlE5TE1rclJoKzN2Rm5WbFg1OUw0RjBvU2NZeXJBUlFJWVB4Z0pEbzkwUUhCaW5YdjFvZDN5NmJtK1RSMWpOOElpQ2YvRGZuV3BGcFVMY3FPeHNWY21ncVI5ZVFBOXNuS3p0ZmZpaUFJRnJwTkJYcVBjc1pLbXM4Yzk1KzZITTJWN1JhQTFsMkI4eUREalJQUUx0Uzh5NWwxcVplblhIbTlHTDUvcU0xK2YzcnJhT1Uyd2RrVno2V0dQZW02WGZESi90NWFEZkR2RjZ2cjZKaGdaN3pDOTgzeGd4RjNtWnlnSDFxMFVIWDcvNXBXS2dsNTVheVBxVkc0dSsyRnh5aElxVDI0d3hFZk9BRTF4RDBiWm12K3E3cHZ4NU9abVVydElhVm5aejRkeUxtUlR0aXduR01maklGUTVMVWxjMlJjNm5LUEdrclZjT3IvTGl5eCtlbytCd2JSQjRhaWxYdG0wcVBxVC81aThqT2hBUHpBTEdNZVlPV1hINktNUWVxMGNuVVhlMDNjK3lwalg1V2VBckxRdVpCcDZ3OFE5VC85RGc2ZGFTeit0eWRYZ1A0dDY3cEgvWXFTVXpnMVJnRmlPWEtWcmM0WlFRRFNkN2p4dHU5M1FmckVHSzUwWm56Vm5KTFdpTkg3b2ZDRVRKSjZadkN2ejllWHJIbXd0MFREamVKN002bkpKRDcvR3l3d0JpUllIalJVRVE0NFk0ZUFUWXV6ay9rQThDUGxxenNxdStwNzFTTHI1NXQ2RklXaitpQXhZaFZOdVRzTUxyLzFzU3dNTUJEWW1lZnArNUhTODdyRU1OVjk0cS9aYkJHNERZeHA1blkwM3dsSVBxbmdHMThlZlVRWGNBRVk2N3JYRDRCR0w5TytCL2pIM0szQTZJSG5aQU5oUit3Y2doNEt3U2RDSmJKenlQWkFhTVhRbmdVS1YzWWxLTWI1ZE1XbEI5TUFLcStVM1daZmpiODJ4M3hhZGJUaHJaZllLS1EvWEJDS2dLWk9NV0RnSDJyanZqMGxBZE4yUkNnaXBEeFFQSTlsazFLOEFnY0c2M1RsakNJNndzaHk1VUZxcU0vQ3hyOW03Q01zdHp6SHV4cVVnU21kZ3ZxQ1pVbG5RVGJMTUZ6TG0zZ25CTDdITm0veDVEQmFHYUNGZWFzamRNSXRWNXljOGJDZy9RTmdCQ2Y3OExMVE1WNzY3SkFBWVZTZXRYNTJkSnpXNnpRdkNad2F0QzN1K2FIbURPdllPZFg4cmJYOU10TWFkNEZ5SWl0RDZ6Q1FQbTNKdkczMXh5MUR6R3VaSzl4NzBUazRJdzNqVUh3Sng3WTVtSEc2NW1sbVdiYnBjTW5lNm1xUG1wZ1ZNb1dvdHYyb0NIQlExMVJ0RWhHdVlXa1N0UzZMdGwvTE4wanNXYUpHRE92Zm5qck5xY25iZFBqMmoramtIWldWbXZIcDJVRmpLZDVsMXhUUlh3c0pxVVhabmwyYVFic3JCS3M3MmlOMFhPUjNqSXJLVUFIdGFOenByM0swNmdYWHVMU2pIT0FSc2o1aHF6YWc0RC9rVzU3UlU3cWs2ekJ6T2dYUk9XbEVoOThxcWxBQjVXb2JRK3EvYmlCVWtaNlk2ME5BaTYySm1lVVdraE15WlFPWHhodVlDSDFhNldIMnZNKzc0cEgrM0J2Ym9WTEhCZjRCZTMwRC9lZ0J4QUROaEFWU25FSjF1S2M5cktrUndxVDZvSW9jOTBqOGc1UHJFanpiM0hnRkdxclZmK1UwY1ZOT0FGWFhWMVBXM0dISEhMSlloZ2djZEVsMkJvaENlN2hZMW96eHNNbUE1QjZGemQzVm9wRjBPVTFhenFhbEZKcFgwOXNqNmxmRUQxMi9PSXJMbFdRaDdmeWNaZVpDUHc0WXQ4K1M0UTU0UUx2VWM1ZUpuUUFTQ1dDTmlpaE04YXdvQ3hNR0FzREJnTEE4YkNnTEV3WUN3TUdBUEd3b0N4TUdBc0RCaUxhdjFQZ0FFQVNlUEdNa1NXdUgwQUFBQUFTVVZPUks1Q1lJST0nLFxuICAgIGJ1dHRvbnM6IFt7IHRpdGxlOiAnUmVsb2FkJywgaWNvblVybDogJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQjRBQUFBZUNBWUFBQUE3TUs2aUFBQUFHWFJGV0hSVGIyWjBkMkZ5WlFCQlpHOWlaU0JKYldGblpWSmxZV1I1Y2NsbFBBQUFBM05wVkZoMFdFMU1PbU52YlM1aFpHOWlaUzU0YlhBQUFBQUFBRHcvZUhCaFkydGxkQ0JpWldkcGJqMGk3N3UvSWlCcFpEMGlWelZOTUUxd1EyVm9hVWg2Y21WVGVrNVVZM3ByWXpsa0lqOCtJRHg0T25odGNHMWxkR0VnZUcxc2JuTTZlRDBpWVdSdlltVTZibk02YldWMFlTOGlJSGc2ZUcxd2RHczlJa0ZrYjJKbElGaE5VQ0JEYjNKbElEVXVOUzFqTURFMElEYzVMakUxTVRRNE1Td2dNakF4TXk4d015OHhNeTB4TWpvd09Ub3hOU0FnSUNBZ0lDQWdJajRnUEhKa1pqcFNSRVlnZUcxc2JuTTZjbVJtUFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eE9UazVMekF5THpJeUxYSmtaaTF6ZVc1MFlYZ3Ribk1qSWo0Z1BISmtaanBFWlhOamNtbHdkR2x2YmlCeVpHWTZZV0p2ZFhROUlpSWdlRzFzYm5NNmVHMXdUVTA5SW1oMGRIQTZMeTl1Y3k1aFpHOWlaUzVqYjIwdmVHRndMekV1TUM5dGJTOGlJSGh0Ykc1ek9uTjBVbVZtUFNKb2RIUndPaTh2Ym5NdVlXUnZZbVV1WTI5dEwzaGhjQzh4TGpBdmMxUjVjR1V2VW1WemIzVnlZMlZTWldZaklpQjRiV3h1Y3pwNGJYQTlJbWgwZEhBNkx5OXVjeTVoWkc5aVpTNWpiMjB2ZUdGd0x6RXVNQzhpSUhodGNFMU5Pazl5YVdkcGJtRnNSRzlqZFcxbGJuUkpSRDBpZUcxd0xtUnBaRG93WkRKaU1XTXpNaTFtT0RNekxUUXhPVGd0T0dWbE15MDVZV1kxT0dWbU9HVXpOekVpSUhodGNFMU5Pa1J2WTNWdFpXNTBTVVE5SW5odGNDNWthV1E2UmpGQk9ETXpOell4UWtSRU1URkZORGswT0RGR05URkZSRGcxTWtFek1qVWlJSGh0Y0UxTk9rbHVjM1JoYm1ObFNVUTlJbmh0Y0M1cGFXUTZNa1kxUmpBNU5qWXhRa1JFTVRGRk5EazBPREZHTlRGRlJEZzFNa0V6TWpVaUlIaHRjRHBEY21WaGRHOXlWRzl2YkQwaVFXUnZZbVVnVUdodmRHOXphRzl3SUVORElDaE5ZV05wYm5SdmMyZ3BJajRnUEhodGNFMU5Pa1JsY21sMlpXUkdjbTl0SUhOMFVtVm1PbWx1YzNSaGJtTmxTVVE5SW5odGNDNXBhV1E2TjJGbU1XVmtNR1V0Wmpaa1pDMDBZbVl3TFdFMk1qY3ROVEJrTWpBNE1qUmlaRFZpSWlCemRGSmxaanBrYjJOMWJXVnVkRWxFUFNKNGJYQXVaR2xrT2pCa01tSXhZek15TFdZNE16TXROREU1T0MwNFpXVXpMVGxoWmpVNFpXWTRaVE0zTVNJdlBpQThMM0prWmpwRVpYTmpjbWx3ZEdsdmJqNGdQQzl5WkdZNlVrUkdQaUE4TDNnNmVHMXdiV1YwWVQ0Z1BEOTRjR0ZqYTJWMElHVnVaRDBpY2lJL1B1VUQ5WmNBQUFNOFNVUkJWSGphdEpiYlMxUlJGSWVQT2pxRzk5TFNMRk16b2F6TUZMc0hRUVZGbDhmZWUrcWhQNmNYMytzeGlHNlFGVjBNTkNqTmpBeXgxTW91bXBtWHNSbnowbS9CZDJBM1ROb2NwdzBmdzVsejl2N3RkZGxyN2JTV2xoWXZ3Tmdxem9zTWNWbDBKcnRBeUFzMkZrU2VLQlE3eEtUNEtxYit0L0NjcUJEMW9scHNFRGRGZHlxRjAwUStGdHB2V0RTTFdyRWVNc1VxUFBCUmpJaWZiREN3Y0JpUk9yRkxyQlUxWXAzenpXWnhqdS9heENNeHNKVHIveWFjTG9wd1p3MFdXaXgzaTVJRTMrZUJiU1lpWG92aElLNDJLeHZFU2F3MGk5YUlIQzlGSTVUZ3VSRExUb3N6V0cxalhud1E0eUtiLzdONU4wMVdkOEtvbUUxR09GYzBpclBpb0NoMzNyMFE5OFJ6M0gvQjJaVEY4NFpvalV1dVpZWFRvRW9jRXlkRUplL015bWVpUTl3VlhhSkpIQ2VUN2YwMWpsTlhzcTVPdzIzVnhMYU0vNzlneVhVeEpEN3gveS9lUmNWVjhSQXJrNDV4TGdtMFgrd2t1U2F4MGl5NUV6ZHZUTnluZ3BtMTM0TW1WejVWeUVRTFJFejBpbmJpRnorK3NabEZOdWl0UkxpQnM1cUpHNStLQitKOWdubFJZaHQ0cER2bnRvU2lZZU9INkJQOVdKL3k0VnVjUlNuTTR0bEszVHZPN0VxR1ZiTk5lTlJmZDlCK2ZlRU1weGo0eFdJbUJZYVo2RVZDYU9PVnVDUjZRbkZkS05YREN0QlJUb3hIVmJ6aXhuZytydEtFVWxTWFEzR2VHL0ZMcVM4OFM2Mk5PYkd4S3JhYU1DUTdNa2pVU2lkdllwVFRxQ3NjUTlndkJIYVd0MURKd2dHRXc5VHpXdGJ5V0h2RU44NlA4UVJOd0pwOU1idHRab2ZXZWQ0a0tXek40NGpZdzFwV1ludTRHazI2RnR2RFMxNU9zT002U21oVkFJdHR6bDV1bzJIVzdFRmp5clU0UXNGb3AvRWY0T3p0RTUrcHlVTlV0QWdXdUNPVFpDemxDSjFpYmo0eDdXYnRQai9HdnZBaXZuOUxJNi9rQ0pSeUlTaGpZaHZmak1ZSkYvTDlJUVNibU90eEJlcGtYZ3l0UDRUbmFRaXQ5Tm5EWXB2WUNCWGNLUHY1THNMY0hGeGJnM0NqY3dXMnU5ZGoxaHhBSStFTkpFSXpUOGU5QmJqT0l3U2x4R2phdWJxR2FLdDVqcFcrcGRhbmI3Rm1aS21yenh5OTlnbTdtNk5kVnBHZDVjc2sxVGdNRU5mYmhHam1YMitaVVk3WEdIR3RKME8zMDhXS25ST3hRSDhlcFJiM0lqcEk2NHdtYzcxZFFIU01MalZESGhSUjA4Tk9VNGtpUEV4TU8yREpDOEp2QVFZQTBPTGI5emw1RCtnQUFBQUFTVVZPUks1Q1lJST0nIH1dXG4gIH07XG5cbiAgX2ZvcmdlMlsnZGVmYXVsdCddLm5vdGlmaWNhdGlvbi5jcmVhdGUob3B0cywgZnVuY3Rpb24gKCkge1xuICAgICgwLCBfdHJhY2tpbmdJbmRleC5jYWxsKSgnZmVsb2cuaW5mbycsICdub3RpZmljYXRpb25fcmVsb2FkX3RhYnNfY2xpY2snKTtcbiAgICByZWxvYWRBamF4UGFnZXMoKTtcbiAgfSk7XG5cbiAgKDAsIF90cmFja2luZ0luZGV4LmNhbGwpKCdmZWxvZy5pbmZvJywgJ25vdGlmaWNhdGlvbl9yZWxvYWRfdGFic19zaG93Jyk7XG59XG5cbmZ1bmN0aW9uIHJlbG9hZFRhYihpZCkge1xuICBfZm9yZ2UyWydkZWZhdWx0J10udGFicy5yZWxvYWQoaWQpO1xufVxuXG5mdW5jdGlvbiB0b1JlbG9hZCh1cmwpIHtcbiAgdmFyIGludGVybmFsID0gdXJsLmluZGV4T2YoJ2h0dHAnKSAhPT0gMDtcbiAgcmV0dXJuICFpbnRlcm5hbCAmJiB1cmwuaW5kZXhPZignLmdyYW1tYXJseS5jb20nKSA9PSAtMTtcbn1cblxuZnVuY3Rpb24gaXNUaGVyZVBhZ2VzVG9SZWxvYWQoY2IpIHtcbiAgcmVsb2FkQWxsKG51bGwsIGNiKTtcbn1cblxuZnVuY3Rpb24gcmVsb2FkQWxsKGZvcmNlLCBjYlJlbG9hZGVkKSB7XG4gIHZhciBjYiA9IGNiUmVsb2FkZWQgfHwgcmVsb2FkVGFiLFxuICAgICAgaXNSZWxvYWRlZCA9IGZhbHNlO1xuXG4gIF9mb3JnZTJbJ2RlZmF1bHQnXS50YWJzLmFsbFRhYnMoZnVuY3Rpb24gKHRhYnMpIHtcbiAgICB0YWJzLmZpbHRlcihmdW5jdGlvbiAoX3JlZikge1xuICAgICAgdmFyIGlkID0gX3JlZi5pZDtcbiAgICAgIHZhciB1cmwgPSBfcmVmLnVybDtcblxuICAgICAgcmV0dXJuIHRvUmVsb2FkKHVybCkgJiYgKGZvcmNlIHx8IF9wYWdlQ29uZmlnMlsnZGVmYXVsdCddLmlzUGFnZVRvUmVsb2FkKHVybCkpO1xuICAgIH0pLmZvckVhY2goZnVuY3Rpb24gKF9yZWYyKSB7XG4gICAgICB2YXIgaWQgPSBfcmVmMi5pZDtcbiAgICAgIHZhciB1cmwgPSBfcmVmMi51cmw7XG5cbiAgICAgIHZhciBmaXJlT25jZSA9IGlzUmVsb2FkZWQgJiYgY2JSZWxvYWRlZDtcbiAgICAgIGlmICghZmlyZU9uY2UpIGNiKGlkKTtcbiAgICAgIGlzUmVsb2FkZWQgPSB0cnVlO1xuICAgIH0pO1xuICB9KTtcblxuICBpZiAoIWlzUmVsb2FkZWQgJiYgY2JSZWxvYWRlZCkge1xuICAgIGNiUmVsb2FkZWQoZmFsc2UpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbG9hZEFqYXhQYWdlcygpIHtcbiAgcmVsb2FkQWxsKCk7XG59XG5cbmZ1bmN0aW9uIHNldEJhZGdlKHZhbHVlKSB7XG4gIF9mb3JnZTJbJ2RlZmF1bHQnXS5idXR0b24uc2V0QmFkZ2UodmFsdWUsIF91dGlsLl9mLCBfdXRpbC5fZik7XG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHtcbiAgdXBkYXRlOiB1cGRhdGUsXG4gIGNoZWNrQmFkZ2U6IGNoZWNrQmFkZ2Vcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxufSkuY2FsbCh0aGlzLHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtjaGFyc2V0OnV0Zi04O2Jhc2U2NCxleUoyWlhKemFXOXVJam96TENKemIzVnlZMlZ6SWpwYklpOXdjbTlxWldOMEwzTnlZeTlxY3k5c2FXSXZZbWN2WW1Ga1oyVXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanM3T3pzN096czdPM0ZDUVVGclFpeFBRVUZQT3pzN08yOUNRVU5wUWl4VFFVRlRPenN3UWtGRE5VSXNaMEpCUVdkQ096czdPelpDUVVOd1FpeHRRa0ZCYlVJN08zRkNRVU53UWl4VlFVRlZPenM3TzI5Q1FVTllMRkZCUVZFN096czdlVUpCUTFVc1lVRkJZVHM3UVVGRmFFUXNTVUZCU1N4RFFVRkRMRWRCUVVjc1VVRkJVU3hEUVVGRExHRkJRV0VzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUVR0QlFVTnVReXhKUVVGTkxHMUNRVUZ0UWl4SFFVRkhMRk5CUVZNc1EwRkJRVHM3TzBGQlIzSkRMRk5CUVZNc1ZVRkJWU3hIUVVGSE8wRkJRM0JDTEdGQlFWY3NRMEZCUXl4WFFVRlhMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVUU3UTBGREwwSTdPMEZCUlVRc1UwRkJVeXhoUVVGaExFTkJRVU1zUzBGQlN5eEZRVUZGTzBGQlF6VkNMRTFCUVVrc2NVSkJRVlVzUlVGQlJTeFBRVUZOTzBGQlEzUkNMSEZDUVVGTkxFMUJRVTBzUTBGQlF5eDFRa0ZCZFVJc1EwRkJReXhGUVVGRExFdEJRVXNzUlVGQlRDeExRVUZMTEVWQlFVTXNjVUpCUVZNc1EwRkJRVHREUVVOMFJEczdRVUZGUkN4VFFVRlRMRzlDUVVGdlFpeEhRVUZITzBGQlF6bENMR1ZCUVdFc1EwRkJReXh0UWtGQmJVSXNRMEZCUXl4RFFVRkJPME5CUTI1RE96dEJRVVZFTEZOQlFXVXNWMEZCVnl4RFFVRkRMRTFCUVUwN1RVRkxNMElzWlVGQlpUczdPenM3ZDBOQlNsUXNhMEpCUVVzc1ZVRkJWU3hGUVVGRk96czdPenM3T3pzN096dDNRMEZCVlN4elEwRkJjMEk3T3pzN096czdPenM3T3pSRFFVTnNSQ3hSUVVGUkxFTkJRVU1zUzBGQlN5eERRVUZET3pzN1FVRkhjRUlzZFVKQlFXVXNSMEZCUnl4M1FrRkJWeXhYUVVGWExFTkJRVU1zVFVGQlRTeERRVUZET3p0QlFVTndSQ3d5UWtGQlRTeFBRVUZQTEVOQlFVTXNSVUZCUlN4RlFVRkZMRTFCUVUwc1JVRkJSU3hWUVVGQkxFOUJRVThzUlVGQlNUdEJRVU51UXl4alFVRkpMRU5CUVVNc1pVRkJaU3hGUVVGRk96dEJRVVZ3UWl4dFFrRkJUeXhSUVVGUkxFTkJRVU1zUlVGQlJTeERRVUZETEVOQlFVRTdWMEZEY0VJc1RVRkRTVHRCUVVOSUxHZERRVUZ2UWl4RlFVRkZMRU5CUVVFN1YwRkRka0k3UVVGRFJDeHJRa0ZCVVN4RFFVRkRMRTlCUVU4c1NVRkJTU3hsUVVGbExFZEJRVWNzUlVGQlJTeEhRVUZITEV0QlFVc3NRMEZCUXl4RFFVRkJPMU5CUTJ4RUxFTkJRVU1zUTBGQlFUczdPenM3T3p0RFFVVklPenRCUVVWRUxGTkJRVk1zVjBGQlZ5eEhRVUZITzBGQlEzSkNMSGRDUVVGVExHMUNRVUZOTEVsQlFVa3NTVUZCU1N4dFFrRkJUU3hKUVVGSkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1ZVRkJRU3hIUVVGSExFVkJRVWs3UVVGRGVFUXNVVUZCU1N3d1FrRkJaU3hGUVVGRkxFOUJRVThzZVVKQlFVc3NZVUZCWVN4RlFVRkZMR2xDUVVGcFFpeEZRVUZGTEVWQlFVTXNUMEZCVHl4RlFVRkZMREJDUVVGbExFVkJRVU1zUTBGQlF5eERRVUZCTzBGQlF6bEdMRkZCUVVrc1EwRkJReXhIUVVGSExFVkJRVVVzVDBGQlRUdEJRVU5vUWl4TFFVRkRMRU5CUVVNc1NVRkJTU3hIUVVGSExFZEJRVWNzUTBGQlFUdEJRVU5hTEZGQlFVa3NUVUZCVFN4SFFVRkhMRU5CUVVNc1EwRkJReXhSUVVGUkxFTkJRVUU3UVVGRGRrSXNaVUZCVnl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGQk8wZEJRM0JDTEVOQlFVTXNRMEZCUVRzN1FVRkZSaXhOUVVGSkxHMUNRVUZOTEVsQlFVa3NRMEZCUXl4dFFrRkJUU3hKUVVGSkxFVkJRVVU3UVVGRGVrSXNOa0pCUVVzc1dVRkJXU3hGUVVGRkxIVkNRVUYxUWl4RFFVRkRMRU5CUVVFN1IwRkROVU03UTBGRFJqczdRVUZGUkN4VFFVRlRMRTFCUVUwc1IwRkJSenRCUVVOb1FpeHpRa0ZCYjBJc1EwRkJReXhWUVVGQkxGRkJRVkVzUlVGQlNUdEJRVU12UWl4UlFVRkpMRU5CUVVNc1VVRkJVU3hGUVVGRkxFOUJRVTA3UVVGRGNrSXNiVUpCUVdVc1JVRkJSU3hEUVVGQk8wZEJRMnhDTEVOQlFVTXNRMEZCUVR0RFFVTklPenRCUVVWRUxGTkJRVk1zWlVGQlpTeEhRVUZITzBGQlEzcENMRTFCUVVrc1NVRkJTU3hIUVVGSE8wRkJRMVFzVTBGQlN5eEZRVUZGTEdkRFFVRm5RenRCUVVOMlF5eFJRVUZKTEVWQlFVVXNhVXBCUVdsS08wRkJRM1pLTEZkQlFVOHNSVUZCUlN3MFowNUJRVFJuVGp0QlFVTnlhRTRzVjBGQlR5eEZRVUZGTEVOQlFVTXNSVUZCUXl4TFFVRkxMRVZCUVVVc1VVRkJVU3hGUVVGRkxFOUJRVThzUlVGQlJTeG5OVVZCUVdjMVJTeEZRVUZETEVOQlFVTTdSMEZEZURkRkxFTkJRVUU3TzBGQlJVUXNjVUpCUVUwc1dVRkJXU3hEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVWQlFVVXNXVUZCVnp0QlFVTjZReXcyUWtGQlN5eFpRVUZaTEVWQlFVVXNaME5CUVdkRExFTkJRVU1zUTBGQlFUdEJRVU53UkN4dFFrRkJaU3hGUVVGRkxFTkJRVUU3UjBGRGJFSXNRMEZCUXl4RFFVRkJPenRCUVVWR0xESkNRVUZMTEZsQlFWa3NSVUZCUlN3clFrRkJLMElzUTBGQlF5eERRVUZCTzBOQlEzQkVPenRCUVVWRUxGTkJRVk1zVTBGQlV5eERRVUZETEVWQlFVVXNSVUZCUlR0QlFVTnlRaXh4UWtGQlRTeEpRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGQk8wTkJRM1JDT3p0QlFVVkVMRk5CUVZNc1VVRkJVU3hEUVVGRExFZEJRVWNzUlVGQlJUdEJRVU55UWl4TlFVRkpMRkZCUVZFc1IwRkJSeXhIUVVGSExFTkJRVU1zVDBGQlR5eERRVUZETEUxQlFVMHNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRVHRCUVVONFF5eFRRVUZQTEVOQlFVTXNVVUZCVVN4SlFVRkpMRWRCUVVjc1EwRkJReXhQUVVGUExFTkJRVU1zWjBKQlFXZENMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlFUdERRVU40UkRzN1FVRkZSQ3hUUVVGVExHOUNRVUZ2UWl4RFFVRkRMRVZCUVVVc1JVRkJSVHRCUVVOb1F5eFhRVUZUTEVOQlFVTXNTVUZCU1N4RlFVRkZMRVZCUVVVc1EwRkJReXhEUVVGQk8wTkJRM0JDT3p0QlFVVkVMRk5CUVZNc1UwRkJVeXhEUVVGRExFdEJRVXNzUlVGQlJTeFZRVUZWTEVWQlFVVTdRVUZEY0VNc1RVRkJTU3hGUVVGRkxFZEJRVWNzVlVGQlZTeEpRVUZKTEZOQlFWTTdUVUZET1VJc1ZVRkJWU3hIUVVGSExFdEJRVXNzUTBGQlFUczdRVUZGY0VJc2NVSkJRVTBzU1VGQlNTeERRVUZETEU5QlFVOHNRMEZCUXl4VlFVRkJMRWxCUVVrc1JVRkJTVHRCUVVONlFpeFJRVUZKTEVOQlFVTXNUVUZCVFN4RFFVRkRMRlZCUVVNc1NVRkJVeXhGUVVGTE8xVkJRV0lzUlVGQlJTeEhRVUZJTEVsQlFWTXNRMEZCVWl4RlFVRkZPMVZCUVVVc1IwRkJSeXhIUVVGU0xFbEJRVk1zUTBGQlNpeEhRVUZIT3p0QlFVTnVRaXhoUVVGUExGRkJRVkVzUTBGQlF5eEhRVUZITEVOQlFVTXNTMEZCU3l4TFFVRkxMRWxCUVVrc2QwSkJRVmNzWTBGQll5eERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkJMRUZCUVVNc1EwRkJRVHRMUVVOc1JTeERRVUZETEVOQlEwUXNUMEZCVHl4RFFVRkRMRlZCUVVNc1MwRkJVeXhGUVVGTE8xVkJRV0lzUlVGQlJTeEhRVUZJTEV0QlFWTXNRMEZCVWl4RlFVRkZPMVZCUVVVc1IwRkJSeXhIUVVGU0xFdEJRVk1zUTBGQlNpeEhRVUZIT3p0QlFVTm9RaXhWUVVGSkxGRkJRVkVzUjBGQlJ5eFZRVUZWTEVsQlFVa3NWVUZCVlN4RFFVRkJPMEZCUTNaRExGVkJRVWtzUTBGQlF5eFJRVUZSTEVWQlFVVXNSVUZCUlN4RFFVRkRMRVZCUVVVc1EwRkJReXhEUVVGQk8wRkJRM0pDTEdkQ1FVRlZMRWRCUVVjc1NVRkJTU3hEUVVGQk8wdEJRMnhDTEVOQlFVTXNRMEZCUVR0SFFVTklMRU5CUVVNc1EwRkJRVHM3UVVGRlJpeE5RVUZKTEVOQlFVTXNWVUZCVlN4SlFVRkpMRlZCUVZVc1JVRkJSVHRCUVVNM1FpeGpRVUZWTEVOQlFVTXNTMEZCU3l4RFFVRkRMRU5CUVVFN1IwRkRiRUk3UTBGRFJqczdRVUZGUkN4VFFVRlRMR1ZCUVdVc1IwRkJSenRCUVVONlFpeFhRVUZUTEVWQlFVVXNRMEZCUVR0RFFVTmFPenRCUVVWRUxGTkJRVk1zVVVGQlVTeERRVUZETEV0QlFVc3NSVUZCUlR0QlFVTjJRaXh4UWtGQlRTeE5RVUZOTEVOQlFVTXNVVUZCVVN4RFFVRkRMRXRCUVVzc2NVSkJRVk1zUTBGQlFUdERRVU55UXpzN2NVSkJSV003UVVGRFlpeFJRVUZOTEVWQlFVNHNUVUZCVFR0QlFVTk9MRmxCUVZVc1JVRkJWaXhWUVVGVk8wTkJRMWdpTENKbWFXeGxJam9pWjJWdVpYSmhkR1ZrTG1weklpd2ljMjkxY21ObFVtOXZkQ0k2SWlJc0luTnZkWEpqWlhORGIyNTBaVzUwSWpwYkltbHRjRzl5ZENCbWIzSm5aU0JtY205dElDZG1iM0puWlNkY2JtbHRjRzl5ZENCN1gyWXNJR05vY205dFpVSm5SWEp5YjNJc0lHbHpVMkZtWVhKcGZTQm1jbTl0SUNjdUxpOTFkR2xzSjF4dWFXMXdiM0owSUhCaFoyVkRiMjVtYVdjZ1puSnZiU0FuTGk0dmNHRm5aUzFqYjI1bWFXY25YRzVwYlhCdmNuUWdlMk5oYkd4OUlHWnliMjBnSnk0dUwzUnlZV05yYVc1bkwybHVaR1Y0SjF4dWFXMXdiM0owSUhCeVpXWnpJR1p5YjIwZ0p5NHVMM0J5WldaekoxeHVhVzF3YjNKMElHNWxkM01nWm5KdmJTQW5MaTl1WlhkekoxeHVhVzF3YjNKMElIdHBjMU5vYjNkU1pXWmxjbkpoYkZKcFltSnZibjBnWm5KdmJTQW5MaTl5WldabGNuSmhiSE1uWEc1Y2JteGxkQ0JoSUQwZ1pHOWpkVzFsYm5RdVkzSmxZWFJsUld4bGJXVnVkQ2duWVNjcFhHNWpiMjV6ZENCRVJVWkJWVXhVWDBKQlJFZEZYME5QVEU5U0lEMGdKeU5sTnpVeE5EWW5YRzR2THlCamIyNXpkQ0JFU1ZOQlFreEZSRjlQVGw5RVQwMUJTVTVmUWtGRVIwVmZRMDlNVDFJZ1BTQW5JemxDT1VJNVFpZGNibHh1Wm5WdVkzUnBiMjRnWTJobFkydENZV1JuWlNncElIdGNiaUFnYzJWMFNXNTBaWEoyWVd3b1kyaHliMjFsUW1Ga1oyVXNJREV3TURBcFhHNTlYRzVjYm1aMWJtTjBhVzl1SUhObGRFSmhaR2RsUTI5c2IzSW9ZMjlzYjNJcElIdGNiaUFnYVdZZ0tHbHpVMkZtWVhKcEtDa3BJSEpsZEhWeWJseHVJQ0JtYjNKblpTNWlkWFIwYjI0dWMyVjBRbUZrWjJWQ1lXTnJaM0p2ZFc1a1EyOXNiM0lvZTJOdmJHOXlmU3dnWDJZc0lGOW1LVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQnpaWFJDWVdSblpVUmxabUYxYkhSRGIyeHZjaWdwSUh0Y2JpQWdjMlYwUW1Ga1oyVkRiMnh2Y2loRVJVWkJWVXhVWDBKQlJFZEZYME5QVEU5U0tWeHVmVnh1WEc1aGMzbHVZeUJtZFc1amRHbHZiaUIxY0dSaGRHVkNZV1JuWlNoa2IyMWhhVzRwSUh0Y2JpQWdhV1lnS0dGM1lXbDBJRzVsZDNNdWFYTlRhRzkzVG1WM2N5Z3BJSHg4SUdGM1lXbDBJR2x6VTJodmQxSmxabVZ5Y21Gc1VtbGlZbTl1S0NrcElIdGNiaUFnSUNCeVpYUjFjbTRnYzJWMFFtRmtaMlVvSjA1RlZ5Y3BYRzRnSUgxY2JseHVJQ0JzWlhRZ1pXNWhZbXhsWkU5dVJHOXRZV2x1SUQwZ2NHRm5aVU52Ym1acFp5NWphR1ZqYTBSdmJXRnBiaWhrYjIxaGFXNHBYRzRnSUhCeVpXWnpMbVZ1WVdKc1pXUW9KeWNzSUdSdmJXRnBiaXdnWlc1aFlteGxaQ0E5UGlCN1hHNGdJQ0FnYVdZZ0tDRmxibUZpYkdWa1QyNUViMjFoYVc0cElIdGNiaUFnSUNBZ0lDOHZJSE5sZEVKaFpHZGxRMjlzYjNJb1JFbFRRVUpNUlVSZlQwNWZSRTlOUVVsT1gwSkJSRWRGWDBOUFRFOVNLVnh1SUNBZ0lDQWdjbVYwZFhKdUlITmxkRUpoWkdkbEtDY25LVnh1SUNBZ0lIMWNiaUFnSUNCbGJITmxJSHRjYmlBZ0lDQWdJSE5sZEVKaFpHZGxSR1ZtWVhWc2RFTnZiRzl5S0NsY2JpQWdJQ0I5WEc0Z0lDQWdjMlYwUW1Ga1oyVW9aVzVoWW14bFpDQW1KaUJsYm1GaWJHVmtUMjVFYjIxaGFXNGdQeUFuSnlBNklDZHZabVluS1Z4dUlDQjlLVnh1WEc1OVhHNWNibVoxYm1OMGFXOXVJR05vY205dFpVSmhaR2RsS0NrZ2UxeHVJQ0JtYjNKblpTQW1KaUJtYjNKblpTNTBZV0p6SUNZbUlHWnZjbWRsTG5SaFluTXVaMlYwUTNWeWNtVnVkRlJoWWxWeWJDaDFjbXdnUFQ0Z2UxeHVJQ0FnSUdsbUlDaGphSEp2YldWQ1owVnljbTl5S0NrcElISmxkSFZ5YmlCallXeHNLQ2RtWld4dlp5NWxjbkp2Y2ljc0lDZGphSEp2YldWZlltZGZaWEp5YjNJbkxDQjdiV1Z6YzJGblpUb2dZMmh5YjIxbFFtZEZjbkp2Y2lncGZTbGNiaUFnSUNCcFppQW9JWFZ5YkNrZ2NtVjBkWEp1WEc0Z0lDQWdZUzVvY21WbUlEMGdkWEpzWEc0Z0lDQWdiR1YwSUdSdmJXRnBiaUE5SUdFdWFHOXpkRzVoYldWY2JpQWdJQ0IxY0dSaGRHVkNZV1JuWlNoa2IyMWhhVzRwWEc0Z0lIMHBYRzVjYmlBZ2FXWWdLQ0ZtYjNKblpTQjhmQ0FoWm05eVoyVXVkR0ZpY3lrZ2UxeHVJQ0FnSUdOaGJHd29KMlpsYkc5bkxuZGhjbTRuTENBblptOXlaMlZmWW1Ga1oyVmZkVzVrWldacGJtVmtKeWxjYmlBZ2ZWeHVmVnh1WEc1bWRXNWpkR2x2YmlCMWNHUmhkR1VvS1NCN1hHNGdJR2x6VkdobGNtVlFZV2RsYzFSdlVtVnNiMkZrS0dselVtVnNiMkZrSUQwK0lIdGNiaUFnSUNCcFppQW9JV2x6VW1Wc2IyRmtLU0J5WlhSMWNtNWNiaUFnSUNCemFHOTNWWEJrWVhSbFVHOXdkWEFvS1Z4dUlDQjlLVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQnphRzkzVlhCa1lYUmxVRzl3ZFhBb0tTQjdYRzRnSUd4bGRDQnZjSFJ6SUQwZ2UxeHVJQ0FnSUhScGRHeGxPaUFuUjNKaGJXMWhjbXg1SUc1bFpXUnpJSFJ2SUdKbElISmxiRzloWkdWa0p5eGNiaUFnSUNCMFpYaDBPaUFuVjJocGJHVWdlVzkxSUhkbGNtVWdkMjl5YTJsdVp5d2dkMlVnZFhCa1lYUmxaQ0JIY21GdGJXRnliSGt1SUZSdklIUmhhMlVnWVdSMllXNTBZV2RsSUc5bUlIUm9aWE5sSUdsdGNISnZkbVZ0Wlc1MGN5d2djR3hsWVhObElITmhkbVVnZEdobElIUmxlSFFnZVc5MUlHRnlaU0IzYjNKcmFXNW5JRzl1TENCaGJtUWdZMnhwWTJzZ2FHVnlaUzRuTEZ4dUlDQWdJR2xqYjI1VlVrdzZJQ2RrWVhSaE9tbHRZV2RsTDNCdVp6dGlZWE5sTmpRc2FWWkNUMUozTUV0SFoyOUJRVUZCVGxOVmFFVlZaMEZCUVV0QlFVRkJRMmREUVVsQlFVRkJSWEptUWpaQlFVRkJSMWhTUmxkSVVsUmlNbG93WkRKR2VWcFJRa0phUnpscFdsTkNTbUpYUm01YVZrcHNXVmRTTldOamJHeFFRVUZCUVhsb2NGWkdhREJYUlRGTlQyMU9kbUpUTldoYVJ6bHBXbE0xTkdKWVFVRkJRVUZCUVVSM0wyVklRbWhaTW5Sc1pFTkNhVnBYWkhCaWFqQnBOemQxTDBscFFuQmFSREJwVm5wV1RrMUZNWGRSTWxadllWVm9ObU50VmxSbGF6VlZXVE53Y2xsNmJHdEphamdyU1VSNE5FOXVhSFJqUnpGc1pFZEZaMlZITVhOaWJrMDJaVVF3YVZsWFVuWlpiVlUyWW01Tk5tSlhWakJaVXpocFNVaG5ObVZITVhka1IzTTVTV3RHYTJJeVNteEpSbWhPVlVOQ1JHSXpTbXhKUkZWMVRta3hhazFFUlRCSlJHTTFUR3BGTVU1cVl6Vk9lWGRuVFdwQmVFNURPSGRQUXpoNVRVTXdkMDlVYnpGTmVtOTNUV2xCWjBsRFFXZEpRMEZuU1dvMFoxQklTbXRhYW5CVFVrVlpaMlZITVhOaWJrMDJZMjFTYlZCVFNtOWtTRkozVDJrNGRtUXpaRE5NYm1ONlRHMDVlVnA1T0hoUFZHczFUSHBCZVV4NlNYbE1XRXByV21reGVtVlhOVEJaV0dkMFltNU5ha2xxTkdkUVNFcHJXbXB3UlZwWVRtcGpiV3gzWkVkc2RtSnBRbmxhUjFrMldWZEtkbVJZVVRsSmFVbG5aVWN4YzJKdVRUWmxSekYzVUZOS2IyUklVbmRQYVRoMlltNU5kVmxYVW5aWmJWVjFXVEk1ZEV3emFHaGpRemg0VEdwQmRrbHBRalJpVjNoMVkzcHdOR0pZUWs1VVZEQnBZVWhTTUdORWIzWk1NalY2VEcxR2EySXlTbXhNYlU1MllsTTVORmxZUVhaTlV6UjNUREl4ZEV4NVNXZGxSekZ6WW01Tk5tTXpVbE5hVjFrNVNXMW9NR1JJUVRaTWVUbDFZM2sxYUZwSE9XbGFVelZxWWpJd2RtVkhSbmRNZWtWMVRVTTVlbFpJYkhkYVV6bFRXbGhPZG1SWVNtcGFWa3BzV21sTmFVbElhSFJqUkhCRVkyMVdhR1JIT1hsV1J6bDJZa1F3YVZGWFVuWlpiVlZuVlVkb2RtUkhPWHBoUnpsM1NVVk9SRWxFU1hkTlZGRm5TMFV4YUZreWJIVmtSemw2WVVOcmFVbElhSFJqUlRGT1QydHNkV016VW1oaWJVNXNVMVZST1VsdWFIUmpRelZ3WVZkUk5rMVVaM3BOYW1oRFRXdFJNVTVxUWtkTlZFWkdUa1JuTUU1cVFrVk5SVTVDVG10V1JrNTZRVE5TUkd0cFNVaG9kR05GTVU1UGExSjJXVE5XZEZwWE5UQlRWVkU1U1c1b2RHTkROV3RoVjFFMlRWUm5lazFxYUVOTmExVXhUbXBDUjAxVVJrWk9SR2N3VG1wQ1JVMUZUa0pPYTFaR1RucEJNMUpFYTJsUWFVRTRaVWN4ZDFSVk1EWlNSMVo1WVZoYWJGcEZXbmxpTWpCbll6TlNVMXBYV1RaaFZ6VjZaRWRHZFZreVZrcFNSREJwWlVjeGQweHRiSEJhUkc5NFQwUk5lVTlGU1hsUmFsVXlUVVZaZUUxVlZUQlBSRkV5VFVWUmQxRXdSVEpTVlZVelRVUmtSVTlUU1dkak0xSlRXbGRaTmxwSE9XcGtWekZzWW01U1NsSkVNR2xsUnpGM1RHMVNjRnBFYjNoUFJFMTVUMFZKZVZGNlZUSk5SVmw0VFZWVk1FOUVVVEpOUlZGM1VUQkZNbEpWVlROTlJHUkZUMU5KZGxCcFFUaE1NMHByV21wd1JWcFlUbXBqYld4M1pFZHNkbUpxTkdkUVF6bDVXa2RaTmxWclVrZFFhVUU0VERObk5tVkhNWGRpVjFZd1dWUTBaMUJFT1RSalIwWnFZVEpXTUVsSFZuVmFSREJwWTJsSkwxQm5NWHBaVjFGQlFVRXZhMU5WVWtKV1NHcGhOMG94TldSR1RsWkljMlo2TUc1U1NqQTJXazQ1TXpKR1luUkNVMjlMTWtGc1RUSm9WbWhaV2tGbGRGVlNWMmhhYmtKRlVVSkpkbXBOU1hacVkyODJWMFZSVmxwQ1FtMXhTV2xEYjNGR1UxRjNNVFJMUTBoVGJERkhOVEJ3VlhWaFltbEdTbTE2VkdSTmNqbEVTRmt2UTFNd2FWUXJOVmxyT1ROMk5GRTFVREIyYm1RdmJpOW1kUzltTTNWMllqazNRMWt4UjNjNFJYbFlNMGQ0UTFSQ1oweEJkMWxEZDFCSGQyOURlRTFIUVhORVFtZE1RVGhoUVhOVVFtZE1RWGRaUTNkUVIzZHZRM2hOUjBGelJFSm5SSGh6UzBGelZFSm5URUYzV1VOM1VFZDNiME40VFVkQmMwUkNaMFI0YzB0QmMxUkNaMHhCZDFsRGQxQkhkMjlEZUUxSFFVMUhRWE5FZUhOTFFYTlVRbWRNUVhkWlEzZFFSekJwYldWQ1pHRTFaRGRETDNWeWRURlZhVFYxVlc1Wk1YRTNjR0ZXUmtwd1dEUXJjMVI1YTJaVlVGVlFSR1kzTmsweWRYVnNXa1JJWkRkTGVFWTVhMGxtVUdkcFdEYzJURzQzTVV4MVRrSTNiRWxQV0c1YVZ6RnhWbE5YYzBwQ1pHUjBjRFkxVkRreFZrSldTelozZFRZMmRYQTJNbTloVFhGRVYxaEpTVWxHU0doT1pHZHBaVWxuYVdFM2FGaHVXVU5VUm1kNGJGTnNSVW81YzB0ak5YQkxOaXRSZERGQ01HbFJhV2g2TTFOUWVVUnJLM05YUjA4emFHZDNWRmR3V0hrME9ERTFiak5tYkVZdldEQXdOMkpTV1UxR04yZDJPRFJvWWpaNE4zWmlRMnBHWjNGblUwNWpSbUowZUZGMVUzTnJTRTVGUTAweldVVldkMW96Y0Vkd1dWaE5aMEZaWTBFd1lYQXpVR0ZMU0ZaWGJsTXJOMlZaWTI0NWVFUm5TSEpCYkV4VGJsTlFkMGxEVGpGWk0wOXRkbU55VkhKQlNEZFlNbGxPTUdKTlZGaEJUbmhaUVU1RlkxRTFiV1ZZV2xveGNIWnpabmNyV2pOMFJtSTBjV05FTVVWWFFuRjVkbTlKZGs1eGN6TmFaV1p6TUVKTVZXMWpZMDFSVDNFNFpXNWFVVmROYURBMllWRjZORWxoY25Cc2JWRlZTRk54V0U0MWRtTnVWV05MWm1KbFRXWjZZbFYzVWsxRVNuQmxSMjk2Ym1OalJGZDZURVp6T1U1SFEya3pXVzkwYkRkamNHRnVOWEUwUWxORFVUSkVRWFkxVG5sUlRESTFOVTluY0RoVk1IbzRVRzFVZG1ObE9VVTFUbWw2TjFCR1owZ3ZVa2hYV0c1VE0yNDNiMWhGTW0wMVFXUkhkWEJrT0dWclFqbHhORmxOUzJSSlYzSTRObEF3ZG1FeE9FMTRURFJzYzBKRWRtb3djMXBVVDFOU2FVRnZSRkJUTXpkbFZVaHFRV1JFZG1Sb00ySktWM2xqYzIxbFZUVjRhMGxDYmpKM2NHWnhNelE0U1VKdGEwZFBLelJvUmxjM09GZHRlblpIU25SVWFrRlJSR1ZxSzA5RFVVSlZlRzlqWjJ4cFV5dDRlbFpFUW0wM05HOVBZVXB1YUROU01ubHFUMnh4Y1VOYVZVWnhjSE5MV1VSQ2NUUktLekUzZUdJMWRuTkZiRmxWY1ZFNFdFNUlla0pGVWs5QmVtMDJkRmh3VlU1UldtRm5ORlpPSzJOQlUzTklNVUpFZG0xc09VVndTMlZuTkd4Q09VMUpTalZCZEZwM1RrcDBUR3B3Y2xSaFNWbENaM1Z4UkVWalFWVmhSbmd3Vm5SWWRHTk5UbFpTYTFscGNtSnNWek51WWs5dWJuaHViMVJYWmxJelF6VkNUR1IyWVVWRVVuSXJjRkZMT0ZOeGRUWnlRbEJ3Y25aQ05IZFJNM2hFZVdKUFEycGFhRlZ0ZDFwUE4wdFFZMFJsY25CbFoydE9SVTltYkU5amFEQXhNWFJyTDNocWJrRm9lUzlUT0ZkT1oxaExWVkZHTTFSV1JsVnljbWx4VlU0NVEzZEhjM1ZZZVhacmJEaDRabWcxU2pkWlFVSnhjemxtV0d0aVJGUlBRV2RRVDFCbWJrZDZVRTFrTkRKcWExbzRUMlY1Wm5WWVdqRjBUR3A2VVZZMWJtSlhiMWRzUm5ScGFGUTJabXBXTVc1YVNIcDRNbmRDZGtzdmJYZDJjMVpLTm1keVNEaDNNSG96WmtOcmNVTndXVFY2T0ZWTWJqWnVPV0p0Wms1MVZWSXJiVXRuTkRCU1l6RmxSWHBxVWpWM1JUTkxjblp0V0hSc1FtdExVelZDU2toMVVGZDRaVmRJUTBKM1VURTBOR1JPU3pkaWNEZzFaWFZqWVZKbE1qSnVXbFl4T1hKUlRWazVZalp6UVV4M2VYZFhabFZpVTNWRGRuRjNkREpMWlVockwzaERiR0ozU0hZMU1UWXlkbTl3UzJ0dlpreGFXRGxRWVVwVE1EQlpPRWt6VDIxeFdGaGtiRkI0TkhFMFRXNWlWalprUWtvMGVWQlJSV1ZCWm5GTWEwMTJNREJsUW1zdmFscHdURGhaZGtNMlZDdFVhVmxwY1RkWWVXUndLMVF2ZVVzNVpVWlFNRVZPTXpKRE1TOUpWR3A0T0VwVE1WWkRlV1JPVFZwRlJFd3ZRblZsTUZaeE1qZHpVVEYwYlhOTlFqa3plVTl5WkVWakszWXdjbE5MT0haMmNXa3lOV1UyWkdGSlVrZHljRW94T1ROVU1FUmhjVUZzTkU1dE5qSlViME55WkVkUFdISkhhVWxJYVVKSVNHd3lLMmhSYnpkbGRGcHJOVGxXYVVod1NXVlhMME5EYzFCWE1FUk5UU3RLYTNJeU9VVjFWMEZqYml0YVQwVnNVMGxpWjJVMlprRmphblpIZGs1UGFXOTJURnBJYjBaYWFucERZWEpNWWpaRFpqbEthVm8xVW1SMGQwaDZTVFpDVGpkcGFIRkpSRVo1VW14aFMwODNTVFFySzJKSFMwRTBWRVl2TjNWdlQyaEJWMDlrWmt4UWJYWlRhV2M0TlZoRVkwdGlVR1JXYm5NMWMweG1OWE5MY2t3NVkySlNlV1ZFTlRZMlRraG5ZVE00Y0VkNE9EaEhUa2xPY2poNkt6Y3lTV0ZUT0dORmNHRjNla2xrTWtsVE9FNXhRMVE0S3pKc2NVbHhURlpFWjBKc01tZHFibU5ZTW5RM2RGWmhZMDh4VmpneFptaFpVMDFMSzFCbFIwdDRMM2xQTmpNclVEQTJNM05SVkhZdk9YZFhkbk5TZUU5WWJWRjZaMlJ5VmpnMWNtMHpWVmxYVURSR1ZqbHJOMnBsYkRZdlZuZGlibVZYWmpNMmVsTXZSbkZ5YzBseGVFUnVSWFpLZFRkS09UQllSbFJYY2pGNVZTc3lSM3B4WjNaV1YwMHlSbmd2TkNzd2RIaFZlSEo2YjFrME1UVnhUMmxEVkM5U1pXSkxiMDlSS3l0d1VISm1PQ3RzTmpCa1JVaG5ibFF4TVdGbGN6VTNZM04zTkV4SFJFVk9ZVmRwTWxwSFFqaDNSbEpxVDFwTlQyNDNjRzU0VlZKVE1GQnVWRWhrU1RWTU1IRjVSMDVDYkRkalJIbDBMM0JIYVd0VFZFaFJkWHBpTHpBM00xWTFOMWc1U1UxeVNqazFWMGxQVVhkaGFsSnVRVlpSYjNoeGRIbzNTVWxJTnpKeVJFaDBaRWhPUzBRM05FaGliMjVUWkhOUmVIZGxWa281T0hSUE5qZDBRbmhCWm1kM0swMDFSbkJuVGtSRFpFTlJRU3N5Vmt0TmNXNUdLMGt6Y1ZKMGNtcHNhbVJMZGxWV00yODBXVTVPWkZwbE1teFFLMmMzVTFwVVFXbFplRnBVY0cxQlQyVXdiRk5OY0RVelNIWnRSV1JqVWpWR0t6bFliR1EzYkdRemNuUk9XbkZtTWpGR0swZHBjRVk0YUVoT05HRnhaV3RaUVU1NlYwc3daWGsxZHpKWVNVNWhSVXBhUml0V1UzQnlMMFV2UmtRdlVsaE1ZazA0S3pGd2JqbFpUMll4TTJFemIySnZSVzFCTkUxNVIzSkJVRE5XVlVsVGEyNHlXSE5qTmxsTFNDOXhTRUoyT1RBNFdYUm5OR2gyUjA5aWEySlNVVlZYTHpaeU5rRXJTVU5YVGpWelIwRjZTVUZIVGxVME4xcExaMUpETWs0NE5saGlhV3hoYlc5dlRVOTBaVXRHWVRkMGRqTlhNR012ZEN0aFluTnRTMGN6ZGxJM2RWa3dTV2ROZVhOUFowOTVZbmh3YlV0T00zSkRhVkZPUnpkYVZUTlBaWGMyYVdkR1ZUSTFjMnN4YTBrclFWSldkVEZ4VDJKTlIzQkNjM2QwUm1ReFVGRm5ObkJKV0NzNFlWTm1VVEpPTkZoM2RrcHNTMmhpTW1jd1IwSkVVSEYxVmpodE0xVXhNR1JZWTNKcmJsRnFNRzU2VEVGak0yZHZabTl5U0VoTldFZENSRTE1VGtrcmRVWkpkVTV5TkZFNFN6TTRlVkpNYWt3d2NrdFBMM1UyVDFKWlp5OWpNVWxPSzBGdFNsbExVams0YkhWdk1Hc3ZMekZHWTNwTVJVMDJWemxIZFdkRmFtMVdjVXBrZGxsdVltSm5kWFF4WkdGRFIwUTVlbFZuTXpSQ1lWWXhVR2hEVTA1ak1sWjVia1ZqYm1FMFZqWjNlVWs1TWtGcVptTjBkVkZSVWtwSVFpODRVRTVUVjFOUVNGbHhVeTlIWld0SFRFOTBWRWRzYlVOeE5EQnFZVlJhU0VSaWNtaFJVRnBNWm5wUVUwUldaeXRaUjNkeWNXa3libE5KU2paUWNDOU9NSFFyVFdSQlRUSm1iMnBaYm10bEt6SnhNMHhyYmt4SE9WUmxhaXRTZVhKUk16aFhjakJ1U1daQlJGUjJSVEIyUW10NU0xUlBaM05KTTAxSFlraDVlV3RNV21jeE9GaEhkMWhMZHpaWE9VZDFaMFZNWlZoM2FsTXlhRmhMTUdjdk9UZFZXRmRSTldjdll6RkpUakpCYmtjemMycFRLMmhUWkRWUGRXZFJNRmRsUm1kUFdWQXpUbE5FWm1kb05tRkdVRlpSWVdweFlXVmlTVVZGTmxGRE1YVlZjQzlOT1VsT1YwMHJjMVIwTWpaTFUxWktVMEY0ZURoRVJDczJWRVZXTmxjNVIzVnNaREEyUldkM01GWXJiSE56V1VoV00xRlJTRWRMUzFjNWFVcHNhVXh4WW1nMGRVMWpkSEo2U0dwdVVVZHphbk5zUmpJelZEUnFOakZtVTFwcllUWkJVMDVhU1ZwNlpsWlZkalpsV2tvelRraFhRV0ppYlRoWVpraHdPRUYzV2xkak4yNWtZbTVIUVRsaVptcElVVE13WlVaRFFrVmtNRE5zWVRBemRXNXdaVkJFZWpaU05WSnFkRm80YVhVMU9HVmxhRTAwSzI1VFlqQmhOa0ZaT1hrNFQwbFRRMGsyVkVsa01sWkNNVFo1YUZnM2VFWk9NVFZ6ZG1NMGRHOTRaRVZCVTFscllWZEJOMkY1YzJ0alVYcEtOMU5yTmtOM1RHNXJZbEo0YVhaaFNtcHViMFo0YUZFdk1rVTNRbTlaY1VvM2IwVkhNVGxKZFdKNVdtUkliWGRHT1M4MWJWbEVTbFpPZURKcFdsRjBhREVyVDNsSlFVMUJSVm94YzBzMk1sUkxLMWgzZURVemNGZEVXV05zZGxaTFdtSnpXV293YVVGNlNVRmxSRWxwVml0WFkzQktVakI0UVZBNGNrZzVTRXd3V2lzeWR6QTVTRk5zV0hSb01YWk1iV3AwYkZOclIyVjFMemRXT1daVVpuRnRkRWhNTld4dGQwVmFVMFl6ZUhOQ1RrZERTREpOVkhwQll6RkJlR3hzYldaMmFXdDBMemhMZGtoMlRWa3JTSHBVTVdrdmNreGhUeXM0VTJSdU1WZDJSbWhJVmtoNWVuSm5NSEZ4TUVod1owMUVjM1p2VG5ab1psQlNRMGx3TlRSTGEycEVVbVJGTDFSWWNVTmxiblZ2WmxSWFlXd3hOR05yZWxCaFVGbGFhbkJ0UVVOTk9FbFBhWFF3YlU5ck1qQk9ZVVZrZW5SRk5XTnBZMlZxTUZWWGNtZHNRbVJJVUdOYVF6QjZSVVJQVFhwU1R6Vm9jelpoYzBKeGRURjFNakZhTldsMlVYSjJjRmhPZG05U1ZqQjNlbUZCV0VKcldYbEJhRTB2TkRWa2FVVjBRVnBKTjIxTk5FVkJTVTFYSzAxWGFFdHBjWEpPZFdSVFpUUlhNbk5JZERNdlVFd3dhMEpyVlVoa1duSjVLMWM1U0ZwUWVXRjFVVGd4YUhGT1RXTkJUQzlsVGxKeVlVeFRZMFJSV2xKUlpuSjBVMUphWTNkcmFVa3pUR1Y0ZDI1TVNWVlNSemQxT0dObFdGUmtTWFk0UldWcGQwYzFkRXRYVGsxMFIzZFBOakpSYjFGMWFXSjRaamxYVEdWbU0xZHJSbXRLUkM5alR6QnFSbGRxV21sR1duVnBWM2xGWW5kbGRHVkVjbkZsZERGcVFXMUVlVFF4TWpaNlZYY3hNR2t6ZFdWTmQzVXJaM1ZNVjFGSGQzUk1kVGxJVTJ0WU9YVnFXWGw0UTNkTVRqbEtXSHBQYlZwc0wwRXlMMGswU2tWUlVETjFXREY1VEc1dU5YVXhLMWxZWjFKQ01IUnJTMUpZZEhaTVIwb3lhbTV3ZHpCNlJqVlFia3ByTUZGQ1kxVTBRbmxFWTFSeWFFdEpWalV5TjJWT1VFVnNZbkZwUWxSa1lrSXpXR2g2SzNoS2FYcHdZMjUyYkcxa1dtSXhlbkZ4T1ZWdWEwTnVXSGRtVGxFNVRFMXJjbEpvS3pOMlJtNVdiRmcxT1V3MFJqQnZVMk5aZVhKQlVsRkpXVkI0WjBwRWJ6a3dVVWhDYVc1WWRqRnZaRE41Tm1KdEsxUlNNV3BPT0VscFEyWXZSR1p1VjNCR2NGVk1ZM0ZQZUhOV1kyMW5jVkk1WlZGQk9YTnVTM3AwWm1acGFVRkpSbkp3VGtKWWNWQmpjMXBMYlhNNFl6azFLelpJVFRKV04xSmhRVEZzTWtJNGVVUkVhbEpRVVV4MFV6aDVOV3d4Y1ZwbGJsaEliVGxIVERVdmNVMHhLMll6Y25KaFQxVXlkMlJyVm5vMlYwZFFaVzAyV0daRVNpOTBOV0ZFWmtSMlJqWjJjalpLYUdkYU4zcERPVGd6ZUdkNFJqTnRXbmxuU0RGeE1GVklXRGN2TlhCWFMyZHNOVFZoZVZCeFZrYzBkU3N5Um5oNWFFbHhWREkwZDNoRlprOUJSVEY0UkRCaVdtMTJLM0UzY0haNE5VOWFiVlZ5ZEVsaFZtNWFlalJrZVV4dFVsUjBhWGR1UjAxbWFrbEdVVFZNVld4ak1sSmpObTVMVUVkcmNsWmpUM0l2VEdsNWVDdGxieXRDZDJKU1FqUmhhV3hZZEcwd2NWQnhWQzgxYVRocVQyaEJVSHBCVEVkTlpWbFBWMWhJTmt0TlVXVnhNR051VlZobE1ETmpLM2x3YWxnMVYyVkJja3hSZFZwQ2NEWjNPRkU1VkM4NVJHYzJaR0ZUZWl0MGVXUllaMUEwZERZM2NFZ3ZXWEZUVlhwbk1WSm5SbWxQV0V0V2NtTTBXbEZSUkZOa04ycDRkSFU1TTFGbWNrVkhTelV3V201NlZtNUtURmRwVGtnM2IyWkRSVlJLU2paYWRrTjJlamxsV0hKSWJYZDBNRlJFYW1WS04wMDJia3BLUkRjdlIzbDNkMEpwVWxsSWFsSlZSVkUwTkZrMFpVRlVXWFY2YXk5clFUaERVR3h4ZW5OeGRTdHdOekZUVEhJMU5YUTJSa2xYYWl0cFFYaFphRlpPZFZSelRVeHlMekZ6VTNkTlRVSkVXVzFsWm5Bck5VaFRPRGR5UlUxT1ZqazBjUzlhWWtKSE5FUlplSEExYmxrd00zZHNTVkJ4Ym1kSE1UaGxabFZSV0dOQlJWazJOM0pZUkRSQ1IwdzVUeXRDTDJwSU0wc3pRVFpKU0c1YVFVNW9VaXQzWTJkb05FdDNVMlJEU21KS2VubFFXa0ZoVFZoUmJtZFZTMVl6V1d4TFRXSTFaRTFYYkVJNVRVRkxjU3RWTTFkYVptcGlPREo0TTNoaFpHSlVhSEphWmxsTFMxRXZXRUpEUzJkTFdrOU5WMFJuU0RKeWFuWnFNR3hCWkU0eVVrTm5hWEJFZUZGUVNUbHNhekZMT0VGblkwYzJNMVJzYWtOSk5uZHphSGsxVlVaeGNVMHZRM2h5T1cwM1EwMXpkSHA2U0hWNGNWVm5VMjFrWjNaeFExcFZiRzVSVkdKTVRVWjZURzB6WjI1Q1REZElUbTB2ZURWRVFtRkhZVU5HWldGemFtUk5TWFJXTlhsak9HSkRaeTlSVG1kQ1EyWTNPRXhNVkUxV056WTNTa0ZCV1ZaVFpYUllOVEprU25wWE5ucFJka05hZDJGMFF6TjFLMkZJYlVSUGRsbFBaRmc0Y21KWU9VMTBUV0ZrTkVaNVNXbDBSRFo2UTFGUWJUTktka2N6TVhoNU1VUjZSM1ZhU3psNE56QlVhelJKZHpOcVZVaDNTbmczV1RWdFNFYzJOVzFzYlZkaVluQmpUVzVsTm0xeFVHMXdaMVpOYjFkdmRIWXliME5JUWxFeE1WSjBSV2hIZFZsWGExTjBVelpNZEd3dlRFNHdhbk5YWVVwSFJFOTJabTVxY2s1eFkyNWlaRkJxTW1vcmFtdElXbGRXYlhaSWNESlZSbXBMWkRWc01YaFVVbGgzYzBweFZWaGFibXd5WVZGaWMzSkNTM00zTW1sT01GaFBVak5xU1hKTFZVRklkR0ZPZW5CeU0wc3dObWRZV0hWTVUycElUMEZTYzJvMWFIRjZZV2MwUkM5clZ6VTNVbFUzY1dzMmVrSjZUMmRZVWs5WGJFVm9PVGh4Y1d4QlFqVlhiMkpSSzNFdlltbENWV3RhTmxrMk1FNUJhVFl5U20xbFZWZHJhRTE1V2xGUFdIaG9kVmxEU0RGaE5sZElNblpOS3pjMGNFZ3JNMEoyWW05V1RFaENaalJDWlRNd1JDOWxaMEo0UVVST2FFRldVMjVGU2pGMVMyTTVja3RyVW5keFZEWnZTVzlqT1RCcU9HYzFVSEpGYW5waU0waG5Sa2R4Y2xabUsxVXdZMVpPVDBGR1dGaFdNVkJYTTBkSVNFaE1TbGxvWjJkalpFVnNNa0p2YUVObE4yaFpNVzk2ZUhOTmJVRTFRalpHZW1RelZtOXdSakJQVlRGaGVuRmhiRVpLY0Znd09YTnFObXhtUlVReE1pOVBTWEpNYkZkUmFEZG1lV05hWlZwRFVIYzBXWFE0SzFNMFVUVTBVVXgyVldNMVpVcHVVVUZUUTFkRFRtbHBhRTA0WVhkdlEzaE5SMEZ6UkVKblRFRTRZa05uVEVWM1dVTjNUVWRCVUVkM2IwTjRUVWRCYzBSQ2FVeGhkakZRWjBGRlFWTmxVRWROYTFOWGRVZ3dRVUZCUVVGVFZWWlBVa3MxUTFsSlNUMG5MRnh1SUNBZ0lHSjFkSFJ2Ym5NNklGdDdkR2wwYkdVNklDZFNaV3h2WVdRbkxDQnBZMjl1VlhKc09pQW5aR0YwWVRwcGJXRm5aUzl3Ym1jN1ltRnpaVFkwTEdsV1FrOVNkekJMUjJkdlFVRkJRVTVUVldoRlZXZEJRVUZDTkVGQlFVRmxRMEZaUVVGQlFUZE5TelpwUVVGQlFVZFlVa1pYU0ZKVVlqSmFNR1F5Um5sYVVVSkNXa2M1YVZwVFFrcGlWMFp1V2xaS2JGbFhValZqWTJ4c1VFRkJRVUV6VG5CV1JtZ3dWMFV4VFU5dFRuWmlVelZvV2tjNWFWcFROVFJpV0VGQlFVRkJRVUZFZHk5bFNFSm9XVEowYkdSRFFtbGFWMlJ3WW1vd2FUYzNkUzlKYVVKd1drUXdhVlo2Vms1TlJURjNVVEpXYjJGVmFEWmpiVlpVWldzMVZWa3pjSEpaZW14clNXbzRLMGxFZURSUGJtaDBZMGN4YkdSSFJXZGxSekZ6WW01Tk5tVkVNR2xaVjFKMldXMVZObUp1VFRaaVYxWXdXVk00YVVsSVp6WmxSekYzWkVkek9VbHJSbXRpTWtwc1NVWm9UbFZEUWtSaU0wcHNTVVJWZFU1VE1XcE5SRVV3U1VSak5VeHFSVEZOVkZFMFRWTjNaMDFxUVhoTmVUaDNUWGs0ZUUxNU1IaE5hbTkzVDFSdmVFNVRRV2RKUTBGblNVTkJaMGxxTkdkUVNFcHJXbXB3VTFKRldXZGxSekZ6WW01Tk5tTnRVbTFRVTBwdlpFaFNkMDlwT0haa00yUXpURzVqZWt4dE9YbGFlVGg0VDFSck5VeDZRWGxNZWtsNVRGaEthMXBwTVhwbFZ6VXdXVmhuZEdKdVRXcEphalJuVUVoS2ExcHFjRVZhV0U1cVkyMXNkMlJIYkhaaWFVSjVXa2RaTmxsWFNuWmtXRkU1U1dsSloyVkhNWE5pYmswMlpVY3hkMVJWTURsSmJXZ3daRWhCTmt4NU9YVmplVFZvV2tjNWFWcFROV3BpTWpCMlpVZEdkMHg2UlhWTlF6bDBZbE00YVVsSWFIUmlSelY2VDI1T01GVnRWbTFRVTBwdlpFaFNkMDlwT0haaWJrMTFXVmRTZGxsdFZYVlpNamwwVEROb2FHTkRPSGhNYWtGMll6RlNOV05IVlhaVmJWWjZZak5XZVZreVZsTmFWMWxxU1dsQ05HSlhlSFZqZW5BMFlsaEJPVWx0YURCa1NFRTJUSGs1ZFdONU5XaGFSemxwV2xNMWFtSXlNSFpsUjBaM1RIcEZkVTFET0dsSlNHaDBZMFV4VGs5ck9YbGhWMlJ3WW0xR2MxSkhPV3BrVnpGc1ltNVNTbEpFTUdsbFJ6RjNURzFTY0ZwRWIzZGFSRXBwVFZkTmVrMXBNVzFQUkUxNlRGUlJlRTlVWjNSUFIxWnNUWGt3TlZsWFdURlBSMVp0VDBkVmVrNTZSV2xKU0doMFkwVXhUazlyVW5aWk0xWjBXbGMxTUZOVlVUbEpibWgwWTBNMWEyRlhVVFpTYWtaQ1QwUk5lazU2V1hoUmExSkZUVlJHUms1RWF6QlBSRVpIVGxSR1JsSkVaekZOYTBWNlRXcFZhVWxJYUhSalJURk9UMnRzZFdNelVtaGliVTVzVTFWUk9VbHVhSFJqUXpWd1lWZFJOazFyV1RGU2FrRTFUbXBaZUZGclVrVk5WRVpHVGtSck1FOUVSa2RPVkVaR1VrUm5NVTFyUlhwTmFsVnBTVWhvZEdORWNFUmpiVlpvWkVjNWVWWkhPWFppUkRCcFVWZFNkbGx0VldkVlIyaDJaRWM1ZW1GSE9YZEpSVTVFU1VOb1RsbFhUbkJpYmxKMll6Sm5jRWxxTkdkUVNHaDBZMFV4VGs5clVteGpiV3d5V2xkU1IyTnRPWFJKU0U0d1ZXMVdiVTl0YkhWak0xSm9ZbTFPYkZOVlVUbEpibWgwWTBNMWNHRlhVVFpPTWtadFRWZFdhMDFIVlhSYWFscHJXa013TUZsdFdYZE1WMFV5VFdwamRFNVVRbXROYWtFMFRXcFNhVnBFVm1sSmFVSjZaRVpLYkZwcWNHdGlNazR4WWxkV2RXUkZiRVZRVTBvMFlsaEJkVnBIYkd0UGFrSnJUVzFKZUZsNlRYbE1WMWswVFhwTmRFNUVSVFZQUXpBMFdsZFZla3hVYkdoYWFsVTBXbGRaTkZwVVRUTk5VMGwyVUdsQk9Fd3pTbXRhYW5CRldsaE9hbU50Ykhka1IyeDJZbW8wWjFCRE9YbGFSMWsyVld0U1IxQnBRVGhNTTJjMlpVY3hkMkpYVmpCWlZEUm5VRVE1TkdOSFJtcGhNbFl3U1VkV2RWcEVNR2xqYVVrdlVIVlZSRGxhWTBGQlFVMDRVMVZTUWxaSWFtRjBTbUppVXpGU1VrWkpaVkJQYW5GSE9UbE1VMHhHVFhwdllYcE5Sa3h6U0ZGUlZrWnNPR1psWlN0eGFGQTJZMWd6SzNONGFVYzJVVVpXTUUxT1EycE9ha0Y1ZURGTmIzVnRjRzFZYzFKdWVqQnRMMEprTWtFelZFNXZZM0IzTUdaM05XeDZPWFkzZEdSa2JISTNZbE5YYkdoWmRuZE9aM0Y2YjNOTlkxWnNNRXB5ZEVGNVFYTXlSbXRUWlV0Q1VUZDRTMVEwUzNGaUszUXZRMk54UWtReGIyeHdjMFZFWkVaa2VYRkdNREJSSzBaMGNIWlhSRk5NVjNKRlpVMXpWWEZRVUVKU2FrbHBabUpFUTNkalFtbFNUM0pHVEhKQ1ZURlpjRE42ZWxkYWVHcDFMMkY0UTAxNGMwcFVjaTk1WVdOTWIzQjNXbmN3VjFkcGVETnBOVWxGTXl0bFFtSlRXV2xZYjNab1NVczBNa3Q0ZGtWVFlYY3dhVGxoU1VoRE9VWkpOVlJuZFZKRVRGUnZjM3BYUnpGcVdHNTNVVFI1UzJJdk4wNDFUakF4VjJRNFMyOXRSVEZIVDBaak1HbHlVR2x2UTJnek0zSXdVVGs0VW5velNDOUNNbHBVUmpnMFdtOXFWWFYxV2xsWVZHOUZiMk5GZVdSRlNtVXZUWGx0WldsUk9YZFdXR0ZLU2toRFpWUTNaakF4YW14T1dITnhOVTkzTWpOV2VFeGhUUzgzT1dkNVdGVjRTa1EzZUM5NUwyVlNZMVpXT0ZKQmNtczBOWGhNWjIwd1dDdDNhM1ZUWVhnd2FYazFSWHBrZGxST2VXNW5jRzB4TXpSTmJWWjZOVlo1UlZGTVVrVjZNR2x1WW1sR2Vpc3JjMXBzUms1MWFYUlNUR2xDY3pWeFNrYzFLMHRDSzBvNVoyNXNVbGxvZERSd1JIWnVkRzlUYVZsbFQwZzJRbEE1VjBvdmVUUldkV05TVTI1Tk5IUnNTek5VZGs4M1JYRkhWbUpPVG1WT1VtWmtPVUlyWm1WRlRYQjRhalI0VjBsdFFsbGhXalpGVmtOaFQwOVdkVU5TTmxGdVJtUkxUbGhFUTNSQ1VsUnZlRWhXWW5wcGVHNW5LM0owUzBWVmJGTllVVE5IWlVjdlJreHhVemc0VXpZeVRrOWlSM2hMY21GaFRVTlJOMDFyYWxWVGFXUjJXWEJVVkhGRGMyTlJPV2QyUWtoaFYzUXhSRXAzWjBkRmR6bFVlbGQwWW5sWFNIWkZUamcyVURoUlVrNTNTbkE1VFdKMGRGcHZabGRsWkRSclMxZDZUalEwYWxsM01YQlhXVzUxTkVkck1qWkdkSFpFVXpFMVQzTlBUVFpUYldoV1FVbDBkSHBzTlhWdk1raFhOMFZHYW5seVZUUlJjMFp2Y0M5RlpqUlBlblJGTlN0d2VWVk9WWFJCWjFkMVEwOVVXa042YkVOS01XbGlhalI0TjFkaWRGQnFMMGQyZGtGcGRtNDVURWsyTDJ0RFNsSjVTVk5vYWxsb2RtWnFUVmxLUmk5TU9VbFJVMkp0VDNSNFFtVndhMWhuZVhSUU5GUnVZVkZwZERsT2JrUlpjSFpaUTBKWVkwdFFkalZNYzB4alNFWjRZbWN6UTJwamQxY3lkVGxrYWpGb2VFRkpLMFZPU2tWSmVsUTRaVGxDWW1wUFNYZFRiSGhIYW1GMVluRkhZVXQwTldwd1Z5dHdaR0Z1WWpkR2JWcExiWEo2ZUhrNU9XZHROMjAyVG1SV2NFZGtOV056YXpGVVowMUZUbVppYUVkcWJWZ3lLMXBWV1RkWVIwaEhkRW93VHpNd09GZExibEpQZUZGSU9HVndVbUl6U1dwd1NUWTBkMjFqTnpGa1VVaFRUVXhxVmtSSWFGSlNNRGhPVDFVMGEybFFSWGhOVHpKRVNrTTRTblpCVVZsQk1FOU1Zamw2YkRWRUsyZEJRVUZCUVZOVlZrOVNTelZEV1VsSlBTZDlYVnh1SUNCOVhHNWNiaUFnWm05eVoyVXVibTkwYVdacFkyRjBhVzl1TG1OeVpXRjBaU2h2Y0hSekxDQm1kVzVqZEdsdmJpZ3BJSHRjYmlBZ0lDQmpZV3hzS0NkbVpXeHZaeTVwYm1adkp5d2dKMjV2ZEdsbWFXTmhkR2x2Ymw5eVpXeHZZV1JmZEdGaWMxOWpiR2xqYXljcFhHNGdJQ0FnY21Wc2IyRmtRV3BoZUZCaFoyVnpLQ2xjYmlBZ2ZTbGNibHh1SUNCallXeHNLQ2RtWld4dlp5NXBibVp2Snl3Z0oyNXZkR2xtYVdOaGRHbHZibDl5Wld4dllXUmZkR0ZpYzE5emFHOTNKeWxjYm4xY2JseHVablZ1WTNScGIyNGdjbVZzYjJGa1ZHRmlLR2xrS1NCN1hHNGdJR1p2Y21kbExuUmhZbk11Y21Wc2IyRmtLR2xrS1Z4dWZWeHVYRzVtZFc1amRHbHZiaUIwYjFKbGJHOWhaQ2gxY213cElIdGNiaUFnYkdWMElHbHVkR1Z5Ym1Gc0lEMGdkWEpzTG1sdVpHVjRUMllvSjJoMGRIQW5LU0FoUFQwZ01GeHVJQ0J5WlhSMWNtNGdJV2x1ZEdWeWJtRnNJQ1ltSUhWeWJDNXBibVJsZUU5bUtDY3VaM0poYlcxaGNteDVMbU52YlNjcElEMDlJQzB4WEc1OVhHNWNibVoxYm1OMGFXOXVJR2x6VkdobGNtVlFZV2RsYzFSdlVtVnNiMkZrS0dOaUtTQjdYRzRnSUhKbGJHOWhaRUZzYkNodWRXeHNMQ0JqWWlsY2JuMWNibHh1Wm5WdVkzUnBiMjRnY21Wc2IyRmtRV3hzS0dadmNtTmxMQ0JqWWxKbGJHOWhaR1ZrS1NCN1hHNGdJR3hsZENCallpQTlJR05pVW1Wc2IyRmtaV1FnZkh3Z2NtVnNiMkZrVkdGaUxGeHVJQ0FnSUdselVtVnNiMkZrWldRZ1BTQm1ZV3h6WlZ4dVhHNGdJR1p2Y21kbExuUmhZbk11WVd4c1ZHRmljeWgwWVdKeklEMCtJSHRjYmlBZ0lDQjBZV0p6TG1acGJIUmxjaWdvZTJsa0xDQjFjbXg5S1NBOVBpQjdYRzRnSUNBZ0lDQnlaWFIxY200Z2RHOVNaV3h2WVdRb2RYSnNLU0FtSmlBb1ptOXlZMlVnZkh3Z2NHRm5aVU52Ym1acFp5NXBjMUJoWjJWVWIxSmxiRzloWkNoMWNtd3BLVnh1SUNBZ0lIMHBYRzRnSUNBZ0xtWnZja1ZoWTJnb0tIdHBaQ3dnZFhKc2ZTa2dQVDRnZTF4dUlDQWdJQ0FnYkdWMElHWnBjbVZQYm1ObElEMGdhWE5TWld4dllXUmxaQ0FtSmlCallsSmxiRzloWkdWa1hHNGdJQ0FnSUNCcFppQW9JV1pwY21WUGJtTmxLU0JqWWlocFpDbGNiaUFnSUNBZ0lHbHpVbVZzYjJGa1pXUWdQU0IwY25WbFhHNGdJQ0FnZlNsY2JpQWdmU2xjYmx4dUlDQnBaaUFvSVdselVtVnNiMkZrWldRZ0ppWWdZMkpTWld4dllXUmxaQ2tnZTF4dUlDQWdJR05pVW1Wc2IyRmtaV1FvWm1Gc2MyVXBYRzRnSUgxY2JuMWNibHh1Wm5WdVkzUnBiMjRnY21Wc2IyRmtRV3BoZUZCaFoyVnpLQ2tnZTF4dUlDQnlaV3h2WVdSQmJHd29LVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQnpaWFJDWVdSblpTaDJZV3gxWlNrZ2UxeHVJQ0JtYjNKblpTNWlkWFIwYjI0dWMyVjBRbUZrWjJVb2RtRnNkV1VzSUY5bUxDQmZaaWxjYm4xY2JseHVaWGh3YjNKMElHUmxabUYxYkhRZ2UxeHVJQ0IxY0dSaGRHVXNYRzRnSUdOb1pXTnJRbUZrWjJWY2JuMWNiaUpkZlE9PSIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG5yZXF1aXJlKCdiYWJlbC9wb2x5ZmlsbCcpO1xuXG52YXIgX2xvZGFzaCA9IHJlcXVpcmUoJ2xvZGFzaCcpO1xuXG52YXIgX2xvZGFzaDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9sb2Rhc2gpO1xuXG52YXIgX2ZvcmdlID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ2ZvcmdlJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydmb3JnZSddIDogbnVsbCk7XG5cbnZhciBfZm9yZ2UyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZm9yZ2UpO1xuXG5yZXF1aXJlKCcuL2lzYmcnKTtcblxudmFyIF9wcmVmcyA9IHJlcXVpcmUoJy4uL3ByZWZzJyk7XG5cbnZhciBfcHJlZnMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcHJlZnMpO1xuXG52YXIgX3NvY2tldCA9IHJlcXVpcmUoJy4uL3NvY2tldCcpO1xuXG52YXIgX3NvY2tldDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9zb2NrZXQpO1xuXG52YXIgX2xvY2F0aW9uID0gcmVxdWlyZSgnLi4vbG9jYXRpb24nKTtcblxudmFyIF9jb25maWcgPSByZXF1aXJlKCcuLi9jb25maWcnKTtcblxudmFyIF90cmFja2luZ0luZGV4ID0gcmVxdWlyZSgnLi4vdHJhY2tpbmcvaW5kZXgnKTtcblxudmFyIF91dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG52YXIgX2FwaSA9IHJlcXVpcmUoJy4vYXBpJyk7XG5cbnZhciBfYXBpMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2FwaSk7XG5cbnZhciBfYXV0aCA9IHJlcXVpcmUoJy4vYXV0aCcpO1xuXG52YXIgX2F1dGgyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfYXV0aCk7XG5cbnZhciBfYmFkZ2UgPSByZXF1aXJlKCcuL2JhZGdlJyk7XG5cbnZhciBfYmFkZ2UyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfYmFkZ2UpO1xuXG52YXIgX25ld3MgPSByZXF1aXJlKCcuL25ld3MnKTtcblxudmFyIF9uZXdzMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX25ld3MpO1xuXG52YXIgX2Nocm9tZSA9IHJlcXVpcmUoJy4vY2hyb21lJyk7XG5cbnZhciBfcGFnZUNvbmZpZyA9IHJlcXVpcmUoJy4uL3BhZ2UtY29uZmlnJyk7XG5cbnZhciBfcGFnZUNvbmZpZzIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wYWdlQ29uZmlnKTtcblxudmFyIHN0YXJ0Q291bnRlciA9IDA7XG5cbi8vdHJ5IHRvIGZpeCBsb2FkIHdpdGggdW5kZWZpbmVkIGZvcmdlLCB3aGVuIGJnIHBhZ2UgaXMgY3Jhc2hpbmdcbmZ1bmN0aW9uIHN0YXJ0QmdQYWdlKCkge1xuICBpZiAoIV9mb3JnZTJbJ2RlZmF1bHQnXSkge1xuICAgIF9wcmVmczJbJ2RlZmF1bHQnXS5nZXQoJ3dhc1JlbG9hZGVkJywgZnVuY3Rpb24gKHdhc1JlbG9hZGVkKSB7XG5cbiAgICAgIGlmIChzdGFydENvdW50ZXIgPiA0KSB7XG4gICAgICAgIGlmICh3YXNSZWxvYWRlZCkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2ZvcmdlIHdhcyBub3QgbG9hZGVkIGFmdGVyIHJlbG9hZCwgc3RvcCB0cnlpbmcgdG8gaW5pdCcpO1xuICAgICAgICAgIC8vdHJ5IHRvIGluaXQgdHJhY2tlciBhbmQgc2VuZCBsb2cgdG8gdGhlIGZlbG9nXG4gICAgICAgICAgKDAsIF90cmFja2luZ0luZGV4LmluaXRCZ09yUG9wdXApKCk7XG4gICAgICAgICAgKDAsIF90cmFja2luZ0luZGV4LmNhbGwpKCdmZWxvZy5lcnJvcicsICdiZ19wYWdlX2ZvcmdlX3VuZGVmaW5lZCcpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvL2ZvcmNlIHJlbG9hZCBvZiBiZyBwYWdlXG4gICAgICAgICAgY29uc29sZS5lcnJvcigncmVsb2FkIG9mIHRoZSBiZyBwYWdlLCBmb3JnZSB3YXMgbm90IGxvYWRlZCcpO1xuICAgICAgICAgIF9wcmVmczJbJ2RlZmF1bHQnXS5zZXQoJ3dhc1JlbG9hZGVkJywgdHJ1ZSk7XG5cbiAgICAgICAgICAoMCwgX3V0aWwuYmdQYWdlUmVsb2FkKSgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNldFRpbWVvdXQoc3RhcnRCZ1BhZ2UsIDEwMDApO1xuICAgICAgc3RhcnRDb3VudGVyKys7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgLy9jbGVhbmluZywgbm9ybWFsIGxvYWRcbiAgICBzdGFydENvdW50ZXIgPSAwO1xuICAgIF9wcmVmczJbJ2RlZmF1bHQnXS5zZXQoJ3dhc1JlbG9hZGVkJywgZmFsc2UpO1xuXG4gICAgZG9jdW1lbnQucmVhZHlTdGF0ZSA9PSAnbG9hZGluZycgPyBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgc3RhcnQsIGZhbHNlKSA6IHN0YXJ0KCk7XG4gIH1cbn1cblxuc3RhcnRCZ1BhZ2UoKTtcblxuKDAsIF9jaHJvbWUuc2V0VW5pbnN0YWxsVVJMKSgpO1xuKDAsIF9jaHJvbWUuc2V0dXBGb3JjZWRVcGRhdGUpKCk7XG5cbmZ1bmN0aW9uIHN0YXJ0KCkge1xuICB2YXIgdXNlcjtcbiAgcmV0dXJuIHJlZ2VuZXJhdG9yUnVudGltZS5hc3luYyhmdW5jdGlvbiBzdGFydCQoY29udGV4dCQxJDApIHtcbiAgICB3aGlsZSAoMSkgc3dpdGNoIChjb250ZXh0JDEkMC5wcmV2ID0gY29udGV4dCQxJDAubmV4dCkge1xuICAgICAgY2FzZSAwOlxuICAgICAgICAoMCwgX2FwaTJbJ2RlZmF1bHQnXSkoKTtcbiAgICAgICAgKDAsIF9zb2NrZXQyWydkZWZhdWx0J10pKCk7XG4gICAgICAgICgwLCBfdHJhY2tpbmdJbmRleC5pbml0QmdPclBvcHVwKSgpO1xuICAgICAgICBjb250ZXh0JDEkMC5uZXh0ID0gNTtcbiAgICAgICAgcmV0dXJuIHJlZ2VuZXJhdG9yUnVudGltZS5hd3JhcChfcGFnZUNvbmZpZzJbJ2RlZmF1bHQnXS5pbml0KCkpO1xuXG4gICAgICBjYXNlIDU6XG4gICAgICAgICgwLCBfY2hyb21lLmxvYWRQcm94eSkoKTtcblxuICAgICAgICBjb250ZXh0JDEkMC5wcmV2ID0gNjtcbiAgICAgICAgY29udGV4dCQxJDAubmV4dCA9IDk7XG4gICAgICAgIHJldHVybiByZWdlbmVyYXRvclJ1bnRpbWUuYXdyYXAoY2hlY2tVcGRhdGUoKSk7XG5cbiAgICAgIGNhc2UgOTpcbiAgICAgICAgY29udGV4dCQxJDAubmV4dCA9IDExO1xuICAgICAgICByZXR1cm4gcmVnZW5lcmF0b3JSdW50aW1lLmF3cmFwKF9hdXRoMlsnZGVmYXVsdCddLmxvZ2luKCkpO1xuXG4gICAgICBjYXNlIDExOlxuICAgICAgICB1c2VyID0gY29udGV4dCQxJDAuc2VudDtcblxuICAgICAgICBpZiAodXNlci5hbm9ueW1vdXMpIF9uZXdzMlsnZGVmYXVsdCddLmluc3RhbGwoKTtcbiAgICAgICAgKDAsIF9jaHJvbWUubG9hZENvbnRlbnRTY3JpcHRzKSgnZ3JhbW1hcmx5LmNvbScpO1xuICAgICAgICBfYmFkZ2UyWydkZWZhdWx0J10uY2hlY2tCYWRnZSgpO1xuICAgICAgICBjb250ZXh0JDEkMC5uZXh0ID0gMjE7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE3OlxuICAgICAgICBjb250ZXh0JDEkMC5wcmV2ID0gMTc7XG4gICAgICAgIGNvbnRleHQkMSQwLnQwID0gY29udGV4dCQxJDBbJ2NhdGNoJ10oNik7XG5cbiAgICAgICAgKDAsIF90cmFja2luZ0luZGV4LmNhbGwpKCdmZWxvZy5lcnJvcicsICdiZ19wYWdlX3N0YXJ0X2ZhaWwnLCBjb250ZXh0JDEkMC50MCk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoY29udGV4dCQxJDAudDApO1xuXG4gICAgICBjYXNlIDIxOlxuICAgICAgICBjb250ZXh0JDEkMC5uZXh0ID0gMjM7XG4gICAgICAgIHJldHVybiByZWdlbmVyYXRvclJ1bnRpbWUuYXdyYXAoY2hlY2tCZ0luaXQoKSk7XG5cbiAgICAgIGNhc2UgMjM6XG4gICAgICBjYXNlICdlbmQnOlxuICAgICAgICByZXR1cm4gY29udGV4dCQxJDAuc3RvcCgpO1xuICAgIH1cbiAgfSwgbnVsbCwgdGhpcywgW1s2LCAxN11dKTtcbn1cblxuZnVuY3Rpb24gY2hlY2tCZ0luaXQoKSB7XG4gIHZhciBiZ0ZhaWxzO1xuICByZXR1cm4gcmVnZW5lcmF0b3JSdW50aW1lLmFzeW5jKGZ1bmN0aW9uIGNoZWNrQmdJbml0JChjb250ZXh0JDEkMCkge1xuICAgIHdoaWxlICgxKSBzd2l0Y2ggKGNvbnRleHQkMSQwLnByZXYgPSBjb250ZXh0JDEkMC5uZXh0KSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIGNvbnRleHQkMSQwLm5leHQgPSAyO1xuICAgICAgICByZXR1cm4gcmVnZW5lcmF0b3JSdW50aW1lLmF3cmFwKF9wcmVmczJbJ2RlZmF1bHQnXS5nZXQoJ2JnSW5pdEZhaWwnKSk7XG5cbiAgICAgIGNhc2UgMjpcbiAgICAgICAgYmdGYWlscyA9IGNvbnRleHQkMSQwLnNlbnQ7XG5cbiAgICAgICAgaWYgKGJnRmFpbHMpIHtcbiAgICAgICAgICBjb250ZXh0JDEkMC5uZXh0ID0gNTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjb250ZXh0JDEkMC5hYnJ1cHQoJ3JldHVybicpO1xuXG4gICAgICBjYXNlIDU6XG5cbiAgICAgICAgKDAsIF90cmFja2luZ0luZGV4LmNhbGwpKCdmZWxvZy5lcnJvcicsICdiZ19pbml0X2ZhaWwnLCB7IGJnRmFpbHM6IGJnRmFpbHMgfSk7XG4gICAgICAgIF9wcmVmczJbJ2RlZmF1bHQnXS5zZXQoJ2JnSW5pdEZhaWwnLCAwKTtcblxuICAgICAgY2FzZSA3OlxuICAgICAgY2FzZSAnZW5kJzpcbiAgICAgICAgcmV0dXJuIGNvbnRleHQkMSQwLnN0b3AoKTtcbiAgICB9XG4gIH0sIG51bGwsIHRoaXMpO1xufVxuXG5mdW5jdGlvbiBjaGVja1VwZGF0ZSgpIHtcbiAgdmFyIHZlcnNpb24sIHByZXZpb3VzVmVyc2lvbjtcbiAgcmV0dXJuIHJlZ2VuZXJhdG9yUnVudGltZS5hc3luYyhmdW5jdGlvbiBjaGVja1VwZGF0ZSQoY29udGV4dCQxJDApIHtcbiAgICB3aGlsZSAoMSkgc3dpdGNoIChjb250ZXh0JDEkMC5wcmV2ID0gY29udGV4dCQxJDAubmV4dCkge1xuICAgICAgY2FzZSAwOlxuICAgICAgICB2ZXJzaW9uID0gKDAsIF9jb25maWcuZ2V0VmVyc2lvbikoKTtcbiAgICAgICAgY29udGV4dCQxJDAubmV4dCA9IDM7XG4gICAgICAgIHJldHVybiByZWdlbmVyYXRvclJ1bnRpbWUuYXdyYXAoX3ByZWZzMlsnZGVmYXVsdCddLmdldCgndmVyc2lvbicpKTtcblxuICAgICAgY2FzZSAzOlxuICAgICAgICBwcmV2aW91c1ZlcnNpb24gPSBjb250ZXh0JDEkMC5zZW50O1xuXG4gICAgICAgIGlmICghKHZlcnNpb24gPT0gcHJldmlvdXNWZXJzaW9uKSkge1xuICAgICAgICAgIGNvbnRleHQkMSQwLm5leHQgPSA2O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNvbnRleHQkMSQwLmFicnVwdCgncmV0dXJuJyk7XG5cbiAgICAgIGNhc2UgNjpcbiAgICAgICAgaWYgKHByZXZpb3VzVmVyc2lvbikge1xuICAgICAgICAgIGNvbnRleHQkMSQwLm5leHQgPSAxMztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRleHQkMSQwLm5leHQgPSA5O1xuICAgICAgICByZXR1cm4gcmVnZW5lcmF0b3JSdW50aW1lLmF3cmFwKGluc3RhbGwoKSk7XG5cbiAgICAgIGNhc2UgOTpcbiAgICAgICAgLy9jYWxsIGl0IHRvIHBvcHVsYXRlIHByZWZzIC0gd2UgbmVlZCB0aGVtIHdoZW4gb3BlbiBwb3B1cFxuICAgICAgICBfcHJlZnMyWydkZWZhdWx0J10uc2V0KCdlbmFibGVkRGVmcycsIGZhbHNlKTtcbiAgICAgICAgX25ld3MyWydkZWZhdWx0J10uaW5zdGFsbCgpO1xuICAgICAgICBjb250ZXh0JDEkMC5uZXh0ID0gMTg7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDEzOlxuICAgICAgICAoMCwgX3RyYWNraW5nSW5kZXguY2FsbCkoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCAnc3RhYmlsaXR5OmJnX3BhZ2VfcmVsb2FkJyk7XG4gICAgICAgICgwLCBfdHJhY2tpbmdJbmRleC5jYWxsKSgnZmVsb2cuZXZlbnQnLCAnYmdfcGFnZV9yZWxvYWQnKTtcbiAgICAgICAgKDAsIF90cmFja2luZ0luZGV4LmNhbGwpKCdnbmFyLnNlbmQnLCAoMCwgX3V0aWwuZ2V0QnJvd3NlcikoKSArICdFeHQvdXBkYXRlZCcpO1xuXG4gICAgICAgIF9wcmVmczJbJ2RlZmF1bHQnXS5nZXQoJ2VuYWJsZWREZWZzJywgZnVuY3Rpb24gKGVuYWJsZWREZWZzKSB7XG4gICAgICAgICAgaWYgKF9sb2Rhc2gyWydkZWZhdWx0J10uaXNCb29sZWFuKGVuYWJsZWREZWZzKSkgcmV0dXJuO1xuICAgICAgICAgIF9wcmVmczJbJ2RlZmF1bHQnXS5zZXQoJ2VuYWJsZWREZWZzJywgdHJ1ZSk7IC8vZXhpc3RpbmcgdXNlcnMgZ2V0IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKHZlcnNpb24uc3BsaXQoJy4nKVswXSAhPSBwcmV2aW91c1ZlcnNpb24uc3BsaXQoJy4nKVswXSkge1xuICAgICAgICAgIF9iYWRnZTJbJ2RlZmF1bHQnXS51cGRhdGUoKTtcbiAgICAgICAgfVxuXG4gICAgICBjYXNlIDE4OlxuXG4gICAgICAgIF9wcmVmczJbJ2RlZmF1bHQnXS5zZXQoJ3ZlcnNpb24nLCB2ZXJzaW9uKTtcblxuICAgICAgY2FzZSAxOTpcbiAgICAgIGNhc2UgJ2VuZCc6XG4gICAgICAgIHJldHVybiBjb250ZXh0JDEkMC5zdG9wKCk7XG4gICAgfVxuICB9LCBudWxsLCB0aGlzKTtcbn1cblxuZnVuY3Rpb24gaW5zdGFsbCgpIHtcbiAgdmFyIGRvbWFpbiwgZnJvbUZ1bm5lbCwgaW5zdGFsbFRyYWNrLCBicm93c2VyTmFtZTtcbiAgcmV0dXJuIHJlZ2VuZXJhdG9yUnVudGltZS5hc3luYyhmdW5jdGlvbiBpbnN0YWxsJChjb250ZXh0JDEkMCkge1xuICAgIHdoaWxlICgxKSBzd2l0Y2ggKGNvbnRleHQkMSQwLnByZXYgPSBjb250ZXh0JDEkMC5uZXh0KSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIGJyb3dzZXJOYW1lID0gZnVuY3Rpb24gYnJvd3Nlck5hbWUoKSB7XG4gICAgICAgICAgdmFyIGJyb3dzZXIgPSAoMCwgX3V0aWwuZ2V0QnJvd3NlcikoKTtcbiAgICAgICAgICByZXR1cm4gYnJvd3NlclswXS50b1VwcGVyQ2FzZSgpICsgYnJvd3Nlci5zbGljZSgxKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpbnN0YWxsVHJhY2sgPSBmdW5jdGlvbiBpbnN0YWxsVHJhY2soZnJvbUZ1bm5lbCkge1xuICAgICAgICAgIHZhciBkYXRhID0geyBnUHJvZHVjdDogJ0V4dGVuc2lvbi0nICsgKDAsIF91dGlsLmdldEJyb3dzZXIpKCkgfTtcbiAgICAgICAgICAoMCwgX3RyYWNraW5nSW5kZXguY2FsbCkoJ2ZlbG9nLmluZm8nLCAnZXh0ZW5zaW9uX2luc3RhbGwnLCB7IHNvdXJjZTogZnJvbUZ1bm5lbCA/ICdmdW5uZWwnIDogJ3dlYnN0b3JlJyB9KTtcbiAgICAgICAgICAoMCwgX3RyYWNraW5nSW5kZXguY2FsbCkoJ21peHBhbmVsLnNldFByb3BzJywgX2RlZmluZVByb3BlcnR5KHt9LCAnZGF0ZScgKyBicm93c2VyTmFtZSgpICsgJ0V4dGVuc2lvbkluc3RhbGxlZCcsIERhdGUubm93KCkpKTtcbiAgICAgICAgICAoMCwgX3RyYWNraW5nSW5kZXguY2FsbCkoJ2duYXIuc2VuZCcsICgwLCBfdXRpbC5nZXRCcm93c2VyKSgpICsgJ0V4dC9pbnN0YWxsZWQnKTtcbiAgICAgICAgICAoMCwgX3RyYWNraW5nSW5kZXguY2FsbCkoJ21peHBhbmVsLnRyYWNrJywgJ0c6R3JhbW1hcmx5X1Byb2R1Y3RfRmlyc3RfVXNlZCcsIGRhdGEpO1xuICAgICAgICAgICgwLCBfdHJhY2tpbmdJbmRleC5jYWxsKSgnbWl4cGFuZWwudHJhY2snLCAnRzpHcmFtbWFybHlfUHJvZHVjdF9JbnN0YWxsZWQnLCBkYXRhKTtcbiAgICAgICAgfTtcblxuICAgICAgICAoMCwgX2Nocm9tZS5sb2FkQ29udGVudFNjcmlwdHMpKCk7XG4gICAgICAgIGNvbnRleHQkMSQwLm5leHQgPSA1O1xuICAgICAgICByZXR1cm4gcmVnZW5lcmF0b3JSdW50aW1lLmF3cmFwKCgwLCBfbG9jYXRpb24ucHJvbWlzZUdldERvbWFpbikoKSk7XG5cbiAgICAgIGNhc2UgNTpcbiAgICAgICAgZG9tYWluID0gY29udGV4dCQxJDAuc2VudDtcbiAgICAgICAgZnJvbUZ1bm5lbCA9IGRvbWFpbi5pbmRleE9mKCdncmFtbWFybHkuY29tJykgPiAtMTtcblxuICAgICAgICBpbnN0YWxsVHJhY2soZnJvbUZ1bm5lbCk7XG5cbiAgICAgICAgaWYgKCFcInRydWVcIikge1xuICAgICAgICAgIGNvbnRleHQkMSQwLm5leHQgPSAxMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRleHQkMSQwLm5leHQgPSAxMTtcbiAgICAgICAgcmV0dXJuIHJlZ2VuZXJhdG9yUnVudGltZS5hd3JhcChvcGVuV2VsY29tZShmcm9tRnVubmVsKSk7XG5cbiAgICAgIGNhc2UgMTE6XG4gICAgICBjYXNlICdlbmQnOlxuICAgICAgICByZXR1cm4gY29udGV4dCQxJDAuc3RvcCgpO1xuICAgIH1cbiAgfSwgbnVsbCwgdGhpcyk7XG59XG5cbmZ1bmN0aW9uIG9wZW5XZWxjb21lKGZ1bm5lbCkge1xuICBpZiAoKDAsIF91dGlsLmlzQ2hyb21lKSgpICYmIGZ1bm5lbCkgcmV0dXJuO1xuICB2YXIgdXJsID0gKDAsIF91dGlsLmlzQ2hyb21lKSgpID8gX2NvbmZpZy5VUkxTLndlbGNvbWVDIDogX2NvbmZpZy5VUkxTLmF1dGhDcmVhdGVQYWdlICsgJy8/ZXh0ZW5zaW9uX2luc3RhbGw9dHJ1ZSc7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgcmV0dXJuIGZ1bm5lbCA/IF9mb3JnZTJbJ2RlZmF1bHQnXS50YWJzLnVwZGF0ZUN1cnJlbnQodXJsLCByZXNvbHZlKSA6IF9mb3JnZTJbJ2RlZmF1bHQnXS50YWJzLm9wZW4odXJsLCBmYWxzZSwgcmVzb2x2ZSk7XG4gIH0pO1xufVxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5d2NtOXFaV04wTDNOeVl5OXFjeTlzYVdJdlltY3ZZbWN1YW5NaVhTd2libUZ0WlhNaU9sdGRMQ0p0WVhCd2FXNW5jeUk2SWpzN096czdPenRSUVVGUExHZENRVUZuUWpzN2MwSkJRMVFzVVVGQlVUczdPenR4UWtGRFNpeFBRVUZQT3pzN08xRkJRMnhDTEZGQlFWRTdPM0ZDUVVOSExGVkJRVlU3T3pzN2MwSkJRMVFzVjBGQlZ6czdPenQzUWtGRFF5eGhRVUZoT3p0elFrRkRZaXhYUVVGWE96czJRa0ZEVWl4dFFrRkJiVUk3TzI5Q1FVTktMRk5CUVZNN08yMUNRVU14UXl4UFFVRlBPenM3TzI5Q1FVTk9MRkZCUVZFN096czdjVUpCUTFBc1UwRkJVenM3T3p0dlFrRkRWaXhSUVVGUk96czdPM05DUVVOMVJDeFZRVUZWT3pzd1FrRkRia1VzWjBKQlFXZENPenM3TzBGQlJYWkRMRWxCUVVrc1dVRkJXU3hIUVVGSExFTkJRVU1zUTBGQlFUczdPMEZCUjNCQ0xGTkJRVk1zVjBGQlZ5eEhRVUZITzBGQlEzSkNMRTFCUVVrc2JVSkJRVTBzUlVGQlJUdEJRVU5XTEhWQ1FVRk5MRWRCUVVjc1EwRkJReXhoUVVGaExFVkJRVVVzVlVGQlFTeFhRVUZYTEVWQlFVazdPMEZCUlhSRExGVkJRVWtzV1VGQldTeEhRVUZITEVOQlFVTXNSVUZCUlR0QlFVTndRaXhaUVVGSkxGZEJRVmNzUlVGQlJUdEJRVU5tTEdsQ1FVRlBMRU5CUVVNc1MwRkJTeXhEUVVGRExIZEVRVUYzUkN4RFFVRkRMRU5CUVVFN08wRkJSWFpGTERaRFFVRmxMRU5CUVVFN1FVRkRaaXh0UTBGQlN5eGhRVUZoTEVWQlFVVXNlVUpCUVhsQ0xFTkJRVU1zUTBGQlFUdEJRVU01UXl4cFFrRkJUVHRUUVVOUUxFMUJRMGs3TzBGQlJVZ3NhVUpCUVU4c1EwRkJReXhMUVVGTExFTkJRVU1zTmtOQlFUWkRMRU5CUVVNc1EwRkJRVHRCUVVNMVJDdzJRa0ZCVFN4SFFVRkhMRU5CUVVNc1lVRkJZU3hGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZCT3p0QlFVVTVRaXh0UTBGQll5eERRVUZCTzFOQlEyWTdUMEZEUmpzN1FVRkZSQ3huUWtGQlZTeERRVUZETEZkQlFWY3NSVUZCUlN4SlFVRkpMRU5CUVVNc1EwRkJRVHRCUVVNM1FpeHJRa0ZCV1N4RlFVRkZMRU5CUVVFN1MwRkRaaXhEUVVGRExFTkJRVUU3UjBGRFNDeE5RVU5KT3p0QlFVVklMR2RDUVVGWkxFZEJRVWNzUTBGQlF5eERRVUZCTzBGQlEyaENMSFZDUVVGTkxFZEJRVWNzUTBGQlF5eGhRVUZoTEVWQlFVVXNTMEZCU3l4RFFVRkRMRU5CUVVFN08wRkJSUzlDTEZsQlFWRXNRMEZCUXl4VlFVRlZMRWxCUVVrc1UwRkJVeXhIUVVNNVFpeFJRVUZSTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zYTBKQlFXdENMRVZCUVVVc1MwRkJTeXhGUVVGRkxFdEJRVXNzUTBGQlF5eEhRVU16UkN4TFFVRkxMRVZCUVVVc1EwRkJRVHRIUVVOV08wTkJRMFk3TzBGQlJVUXNWMEZCVnl4RlFVRkZMRU5CUVVFN08wRkJSV0lzT0VKQlFXbENMRU5CUVVFN1FVRkRha0lzWjBOQlFXMUNMRU5CUVVFN08wRkJSVzVDTEZOQlFXVXNTMEZCU3p0TlFWTmFMRWxCUVVrN096czdRVUZTVml3clFrRkJTeXhEUVVGQk8wRkJRMHdzYTBOQlFWRXNRMEZCUVR0QlFVTlNMREpEUVVGbExFTkJRVUU3TzNkRFFVTlVMSGRDUVVGWExFbEJRVWtzUlVGQlJUczdPMEZCUTNaQ0xHZERRVUZYTEVOQlFVRTdPenM3ZDBOQlIwZ3NWMEZCVnl4RlFVRkZPenM3TzNkRFFVTkdMR3RDUVVGTExFdEJRVXNzUlVGQlJUczdPMEZCUVhwQ0xGbEJRVWs3TzBGQlExSXNXVUZCU1N4SlFVRkpMRU5CUVVNc1UwRkJVeXhGUVVGRkxHdENRVUZMTEU5QlFVOHNSVUZCUlN4RFFVRkJPMEZCUTJ4RExIZERRVUZ0UWl4bFFVRmxMRU5CUVVNc1EwRkJRVHRCUVVOdVF5d3lRa0ZCVFN4VlFVRlZMRVZCUVVVc1EwRkJRVHM3T3pzN096czdRVUZIYkVJc2FVTkJRVXNzWVVGQllTeEZRVUZGTEc5Q1FVRnZRaXhwUWtGQlNTeERRVUZCTzBGQlF6VkRMR1ZCUVU4c1EwRkJReXhMUVVGTExHZENRVUZITEVOQlFVRTdPenM3ZDBOQlJWb3NWMEZCVnl4RlFVRkZPenM3T3pzN08wTkJRM0JDT3p0QlFVVkVMRk5CUVdVc1YwRkJWenROUVVOc1FpeFBRVUZQT3pzN096dDNRMEZCVXl4dFFrRkJUU3hIUVVGSExFTkJRVU1zV1VGQldTeERRVUZET3pzN1FVRkJka01zWlVGQlR6czdXVUZGVWl4UFFVRlBPenM3T3pzN096czdRVUZGV2l4cFEwRkJTeXhoUVVGaExFVkJRVVVzWTBGQll5eEZRVUZGTEVWQlFVTXNUMEZCVHl4RlFVRlFMRTlCUVU4c1JVRkJReXhEUVVGRExFTkJRVUU3UVVGRE9VTXNNa0pCUVUwc1IwRkJSeXhEUVVGRExGbEJRVmtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUVRzN096czdPenREUVVNelFqczdRVUZGUkN4VFFVRmxMRmRCUVZjN1RVRkRjRUlzVDBGQlR5eEZRVU5RTEdWQlFXVTdPenM3UVVGRVppeGxRVUZQTEVkQlFVY3NlVUpCUVZrN08zZERRVU5GTEcxQ1FVRk5MRWRCUVVjc1EwRkJReXhUUVVGVExFTkJRVU03T3p0QlFVRTFReXgxUWtGQlpUczdZMEZGWml4UFFVRlBMRWxCUVVrc1pVRkJaU3hEUVVGQk96czdPenM3T3p0WlFVVjZRaXhsUVVGbE96czdPenM3ZDBOQlExb3NUMEZCVHl4RlFVRkZPenM3TzBGQlJXWXNNa0pCUVUwc1IwRkJSeXhEUVVGRExHRkJRV0VzUlVGQlJTeExRVUZMTEVOQlFVTXNRMEZCUVR0QlFVTXZRaXd3UWtGQlN5eFBRVUZQTEVWQlFVVXNRMEZCUVRzN096czdRVUZIWkN4cFEwRkJTeXh4UWtGQmNVSXNSVUZCUlN3d1FrRkJNRUlzUTBGQlF5eERRVUZCTzBGQlEzWkVMR2xEUVVGTExHRkJRV0VzUlVGQlJTeG5Ra0ZCWjBJc1EwRkJReXhEUVVGQk8wRkJRM0pETEdsRFFVRkxMRmRCUVZjc1JVRkJTeXgxUWtGQldTeHBRa0ZCWXl4RFFVRkJPenRCUVVVdlF5d3lRa0ZCVFN4SFFVRkhMRU5CUVVNc1lVRkJZU3hGUVVGRkxGVkJRVUVzVjBGQlZ5eEZRVUZKTzBGQlEzUkRMR05CUVVrc2IwSkJRVVVzVTBGQlV5eERRVUZETEZkQlFWY3NRMEZCUXl4RlFVRkZMRTlCUVUwN1FVRkRjRU1zTmtKQlFVMHNSMEZCUnl4RFFVRkRMR0ZCUVdFc1JVRkJSU3hKUVVGSkxFTkJRVU1zUTBGQlFUdFRRVU12UWl4RFFVRkRMRU5CUVVFN08wRkJSVVlzV1VGQlNTeFBRVUZQTEVOQlFVTXNTMEZCU3l4RFFVRkRMRWRCUVVjc1EwRkJReXhEUVVGRExFTkJRVU1zUTBGQlF5eEpRVUZKTEdWQlFXVXNRMEZCUXl4TFFVRkxMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVWQlFVVTdRVUZETVVRc05rSkJRVTBzVFVGQlRTeEZRVUZGTEVOQlFVRTdVMEZEWmpzN096dEJRVWRJTERKQ1FVRk5MRWRCUVVjc1EwRkJReXhUUVVGVExFVkJRVVVzVDBGQlR5eERRVUZETEVOQlFVRTdPenM3T3pzN1EwRkRPVUk3TzBGQlJVUXNVMEZCWlN4UFFVRlBPMDFCUldoQ0xFMUJRVTBzUlVGRFRpeFZRVUZWTEVWQlRVd3NXVUZCV1N4RlFWZGFMRmRCUVZjN096czdRVUZCV0N4dFFrRkJWeXhaUVVGWUxGZEJRVmNzUjBGQlJ6dEJRVU55UWl4alFVRkpMRTlCUVU4c1IwRkJSeXgxUWtGQldTeERRVUZCTzBGQlF6RkNMR2xDUVVGUExFOUJRVThzUTBGQlF5eERRVUZETEVOQlFVTXNRMEZCUXl4WFFVRlhMRVZCUVVVc1IwRkJSeXhQUVVGUExFTkJRVU1zUzBGQlN5eERRVUZETEVOQlFVTXNRMEZCUXl4RFFVRkJPMU5CUTI1RU96dEJRV1JSTEc5Q1FVRlpMRmxCUVZvc1dVRkJXU3hEUVVGRExGVkJRVlVzUlVGQlJUdEJRVU5vUXl4alFVRkpMRWxCUVVrc1IwRkJSeXhGUVVGRExGRkJRVkVzYVVKQlFXVXNkVUpCUVZrc1FVRkJSU3hGUVVGRExFTkJRVUU3UVVGRGJFUXNiVU5CUVVzc1dVRkJXU3hGUVVGRkxHMUNRVUZ0UWl4RlFVRkZMRVZCUVVNc1RVRkJUU3hGUVVGRkxGVkJRVlVzUjBGQlJ5eFJRVUZSTEVkQlFVY3NWVUZCVlN4RlFVRkRMRU5CUVVNc1EwRkJRVHRCUVVOeVJpeHRRMEZCU3l4dFFrRkJiVUlzSzBKQlEyUXNWMEZCVnl4RlFVRkZMSGxDUVVGMVFpeEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRVZCUTNSRUxFTkJRVUU3UVVGRFJpeHRRMEZCU3l4WFFVRlhMRVZCUVVzc2RVSkJRVmtzYlVKQlFXZENMRU5CUVVFN1FVRkRha1FzYlVOQlFVc3NaMEpCUVdkQ0xFVkJRVVVzWjBOQlFXZERMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVUU3UVVGRE9VUXNiVU5CUVVzc1owSkJRV2RDTEVWQlFVVXNLMEpCUVN0Q0xFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVRTdVMEZET1VRN08wRkJha0pFTEhsRFFVRnZRaXhEUVVGQk96dDNRMEZEUkN4cFEwRkJhMEk3T3p0QlFVRnFReXhqUVVGTk8wRkJRMDRzYTBKQlFWVXNSMEZCUnl4TlFVRk5MRU5CUVVNc1QwRkJUeXhEUVVGRExHVkJRV1VzUTBGQlF5eEhRVUZITEVOQlFVTXNRMEZCUXpzN1FVRkRja1FzYjBKQlFWa3NRMEZCUXl4VlFVRlZMRU5CUVVNc1EwRkJRVHM3WVVGRGNFSXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSk96czdPenM3ZDBOQlExb3NWMEZCVnl4RFFVRkRMRlZCUVZVc1EwRkJRenM3T3pzN096dERRV3RDYUVNN08wRkJSVVFzVTBGQlV5eFhRVUZYTEVOQlFVTXNUVUZCVFN4RlFVRkZPMEZCUXpOQ0xFMUJRVWtzY1VKQlFWVXNTVUZCU1N4TlFVRk5MRVZCUVVVc1QwRkJUVHRCUVVOb1F5eE5RVUZKTEVkQlFVY3NSMEZCUnl4eFFrRkJWU3hIUVVGSExHRkJRVXNzVVVGQlVTeEhRVUZITEdGQlFVc3NZMEZCWXl4SFFVRkhMREJDUVVFd1FpeERRVUZCT3p0QlFVVjJSaXhUUVVGUExFbEJRVWtzVDBGQlR5eERRVUZETEZWQlFVRXNUMEZCVHp0WFFVTjRRaXhOUVVGTkxFZEJRMG9zYlVKQlFVMHNTVUZCU1N4RFFVRkRMR0ZCUVdFc1EwRkJReXhIUVVGSExFVkJRVVVzVDBGQlR5eERRVUZETEVkQlEzUkRMRzFDUVVGTkxFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNSMEZCUnl4RlFVRkZMRXRCUVVzc1JVRkJSU3hQUVVGUExFTkJRVU03UjBGQlFTeERRVU4yUXl4RFFVRkJPME5CUTBZaUxDSm1hV3hsSWpvaVoyVnVaWEpoZEdWa0xtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJbWx0Y0c5eWRDQW5ZbUZpWld3dmNHOXNlV1pwYkd3blhHNXBiWEJ2Y25RZ1h5Qm1jbTl0SUNkc2IyUmhjMmduWEc1cGJYQnZjblFnWm05eVoyVWdabkp2YlNBblptOXlaMlVuWEc1cGJYQnZjblFnSnk0dmFYTmlaeWRjYm1sdGNHOXlkQ0J3Y21WbWN5Qm1jbTl0SUNjdUxpOXdjbVZtY3lkY2JtbHRjRzl5ZENCVGIyTnJaWFFnWm5KdmJTQW5MaTR2YzI5amEyVjBKMXh1YVcxd2IzSjBJSHR3Y205dGFYTmxSMlYwUkc5dFlXbHVmU0JtY205dElDY3VMaTlzYjJOaGRHbHZiaWRjYm1sdGNHOXlkQ0I3WjJWMFZtVnljMmx2Yml3Z1ZWSk1VMzBnWm5KdmJTQW5MaTR2WTI5dVptbG5KMXh1YVcxd2IzSjBJSHRqWVd4c0xDQnBibWwwUW1kUGNsQnZjSFZ3ZlNCbWNtOXRJQ2N1TGk5MGNtRmphMmx1Wnk5cGJtUmxlQ2RjYm1sdGNHOXlkQ0I3YVhORGFISnZiV1VzSUdkbGRFSnliM2R6WlhJc0lHSm5VR0ZuWlZKbGJHOWhaSDBnWm5KdmJTQW5MaTR2ZFhScGJDZGNibWx0Y0c5eWRDQkJVRWtnWm5KdmJTQW5MaTloY0drblhHNXBiWEJ2Y25RZ1lYVjBhQ0JtY205dElDY3VMMkYxZEdnblhHNXBiWEJ2Y25RZ1ltRmtaMlVnWm5KdmJTQW5MaTlpWVdSblpTZGNibWx0Y0c5eWRDQnVaWGR6SUdaeWIyMGdKeTR2Ym1WM2N5ZGNibWx0Y0c5eWRDQjdjMlYwVlc1cGJuTjBZV3hzVlZKTUxDQnpaWFIxY0VadmNtTmxaRlZ3WkdGMFpTd2diRzloWkVOdmJuUmxiblJUWTNKcGNIUnpMQ0JzYjJGa1VISnZlSGw5SUdaeWIyMGdKeTR2WTJoeWIyMWxKMXh1YVcxd2IzSjBJSEJoWjJWRGIyNW1hV2NnWm5KdmJTQW5MaTR2Y0dGblpTMWpiMjVtYVdjblhHNWNibXhsZENCemRHRnlkRU52ZFc1MFpYSWdQU0F3WEc1Y2JpOHZkSEo1SUhSdklHWnBlQ0JzYjJGa0lIZHBkR2dnZFc1a1pXWnBibVZrSUdadmNtZGxMQ0IzYUdWdUlHSm5JSEJoWjJVZ2FYTWdZM0poYzJocGJtZGNibVoxYm1OMGFXOXVJSE4wWVhKMFFtZFFZV2RsS0NrZ2UxeHVJQ0JwWmlBb0lXWnZjbWRsS1NCN1hHNGdJQ0FnY0hKbFpuTXVaMlYwS0NkM1lYTlNaV3h2WVdSbFpDY3NJSGRoYzFKbGJHOWhaR1ZrSUQwK0lIdGNibHh1SUNBZ0lDQWdhV1lnS0hOMFlYSjBRMjkxYm5SbGNpQStJRFFwSUh0Y2JpQWdJQ0FnSUNBZ2FXWWdLSGRoYzFKbGJHOWhaR1ZrS1NCN1hHNGdJQ0FnSUNBZ0lDQWdZMjl1YzI5c1pTNWxjbkp2Y2lnblptOXlaMlVnZDJGeklHNXZkQ0JzYjJGa1pXUWdZV1owWlhJZ2NtVnNiMkZrTENCemRHOXdJSFJ5ZVdsdVp5QjBieUJwYm1sMEp5bGNiaUFnSUNBZ0lDQWdJQ0F2TDNSeWVTQjBieUJwYm1sMElIUnlZV05yWlhJZ1lXNWtJSE5sYm1RZ2JHOW5JSFJ2SUhSb1pTQm1aV3h2WjF4dUlDQWdJQ0FnSUNBZ0lHbHVhWFJDWjA5eVVHOXdkWEFvS1Z4dUlDQWdJQ0FnSUNBZ0lHTmhiR3dvSjJabGJHOW5MbVZ5Y205eUp5d2dKMkpuWDNCaFoyVmZabTl5WjJWZmRXNWtaV1pwYm1Wa0p5bGNiaUFnSUNBZ0lDQWdJQ0J5WlhSMWNtNWNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0JsYkhObElIdGNiaUFnSUNBZ0lDQWdJQ0F2TDJadmNtTmxJSEpsYkc5aFpDQnZaaUJpWnlCd1lXZGxYRzRnSUNBZ0lDQWdJQ0FnWTI5dWMyOXNaUzVsY25KdmNpZ25jbVZzYjJGa0lHOW1JSFJvWlNCaVp5QndZV2RsTENCbWIzSm5aU0IzWVhNZ2JtOTBJR3h2WVdSbFpDY3BYRzRnSUNBZ0lDQWdJQ0FnY0hKbFpuTXVjMlYwS0NkM1lYTlNaV3h2WVdSbFpDY3NJSFJ5ZFdVcFhHNWNiaUFnSUNBZ0lDQWdJQ0JpWjFCaFoyVlNaV3h2WVdRb0tWeHVJQ0FnSUNBZ0lDQjlYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJSE5sZEZScGJXVnZkWFFvYzNSaGNuUkNaMUJoWjJVc0lERXdNREFwWEc0Z0lDQWdJQ0J6ZEdGeWRFTnZkVzUwWlhJcksxeHVJQ0FnSUgwcFhHNGdJSDFjYmlBZ1pXeHpaU0I3WEc0Z0lDQWdMeTlqYkdWaGJtbHVaeXdnYm05eWJXRnNJR3h2WVdSY2JpQWdJQ0J6ZEdGeWRFTnZkVzUwWlhJZ1BTQXdYRzRnSUNBZ2NISmxabk11YzJWMEtDZDNZWE5TWld4dllXUmxaQ2NzSUdaaGJITmxLVnh1WEc0Z0lDQWdaRzlqZFcxbGJuUXVjbVZoWkhsVGRHRjBaU0E5UFNBbmJHOWhaR2x1WnljZ1AxeHVJQ0FnSUNBZ1pHOWpkVzFsYm5RdVlXUmtSWFpsYm5STWFYTjBaVzVsY2lnblJFOU5RMjl1ZEdWdWRFeHZZV1JsWkNjc0lITjBZWEowTENCbVlXeHpaU2tnT2x4dUlDQWdJQ0FnYzNSaGNuUW9LVnh1SUNCOVhHNTlYRzVjYm5OMFlYSjBRbWRRWVdkbEtDbGNibHh1YzJWMFZXNXBibk4wWVd4c1ZWSk1LQ2xjYm5ObGRIVndSbTl5WTJWa1ZYQmtZWFJsS0NsY2JseHVZWE41Ym1NZ1puVnVZM1JwYjI0Z2MzUmhjblFvS1NCN1hHNGdJRUZRU1NncFhHNGdJRk52WTJ0bGRDZ3BYRzRnSUdsdWFYUkNaMDl5VUc5d2RYQW9LVnh1SUNCaGQyRnBkQ0J3WVdkbFEyOXVabWxuTG1sdWFYUW9LVnh1SUNCc2IyRmtVSEp2ZUhrb0tWeHVYRzRnSUhSeWVTQjdYRzRnSUNBZ1lYZGhhWFFnWTJobFkydFZjR1JoZEdVb0tWeHVJQ0FnSUd4bGRDQjFjMlZ5SUQwZ1lYZGhhWFFnWVhWMGFDNXNiMmRwYmlncFhHNGdJQ0FnYVdZZ0tIVnpaWEl1WVc1dmJubHRiM1Z6S1NCdVpYZHpMbWx1YzNSaGJHd29LVnh1SUNBZ0lHeHZZV1JEYjI1MFpXNTBVMk55YVhCMGN5Z25aM0poYlcxaGNteDVMbU52YlNjcFhHNGdJQ0FnWW1Ga1oyVXVZMmhsWTJ0Q1lXUm5aU2dwWEc0Z0lIMWNiaUFnWTJGMFkyZ29aU2tnZTF4dUlDQWdJR05oYkd3b0oyWmxiRzluTG1WeWNtOXlKeXdnSjJKblgzQmhaMlZmYzNSaGNuUmZabUZwYkNjc0lHVXBYRzRnSUNBZ1kyOXVjMjlzWlM1bGNuSnZjaWhsS1Z4dUlDQjlYRzRnSUdGM1lXbDBJR05vWldOclFtZEpibWwwS0NsY2JuMWNibHh1WVhONWJtTWdablZ1WTNScGIyNGdZMmhsWTJ0Q1owbHVhWFFvS1NCN1hHNGdJR052Ym5OMElHSm5SbUZwYkhNZ1BTQmhkMkZwZENCd2NtVm1jeTVuWlhRb0oySm5TVzVwZEVaaGFXd25LVnh1WEc0Z0lHbG1JQ2doWW1kR1lXbHNjeWtnY21WMGRYSnVYRzVjYmlBZ1kyRnNiQ2duWm1Wc2IyY3VaWEp5YjNJbkxDQW5ZbWRmYVc1cGRGOW1ZV2xzSnl3Z2UySm5SbUZwYkhOOUtWeHVJQ0J3Y21WbWN5NXpaWFFvSjJKblNXNXBkRVpoYVd3bkxDQXdLVnh1ZlZ4dVhHNWhjM2x1WXlCbWRXNWpkR2x2YmlCamFHVmphMVZ3WkdGMFpTZ3BJSHRjYmlBZ2JHVjBJSFpsY25OcGIyNGdQU0JuWlhSV1pYSnphVzl1S0NsY2JpQWdiR1YwSUhCeVpYWnBiM1Z6Vm1WeWMybHZiaUE5SUdGM1lXbDBJSEJ5WldaekxtZGxkQ2duZG1WeWMybHZiaWNwWEc1Y2JpQWdhV1lnS0habGNuTnBiMjRnUFQwZ2NISmxkbWx2ZFhOV1pYSnphVzl1S1NCeVpYUjFjbTVjYmx4dUlDQnBaaUFvSVhCeVpYWnBiM1Z6Vm1WeWMybHZiaWtnZTF4dUlDQWdJR0YzWVdsMElHbHVjM1JoYkd3b0tWeHVJQ0FnSUM4dlkyRnNiQ0JwZENCMGJ5QndiM0IxYkdGMFpTQndjbVZtY3lBdElIZGxJRzVsWldRZ2RHaGxiU0IzYUdWdUlHOXdaVzRnY0c5d2RYQmNiaUFnSUNCd2NtVm1jeTV6WlhRb0oyVnVZV0pzWldSRVpXWnpKeXdnWm1Gc2MyVXBYRzRnSUNBZ2JtVjNjeTVwYm5OMFlXeHNLQ2xjYmlBZ2ZWeHVJQ0JsYkhObElIdGNiaUFnSUNCallXeHNLQ2R6ZEdGMGMyTXVkV2t1YVc1amNtVnRaVzUwSnl3Z0ozTjBZV0pwYkdsMGVUcGlaMTl3WVdkbFgzSmxiRzloWkNjcFhHNGdJQ0FnWTJGc2JDZ25abVZzYjJjdVpYWmxiblFuTENBblltZGZjR0ZuWlY5eVpXeHZZV1FuS1Z4dUlDQWdJR05oYkd3b0oyZHVZWEl1YzJWdVpDY3NJR0FrZTJkbGRFSnliM2R6WlhJb0tYMUZlSFF2ZFhCa1lYUmxaR0FwWEc1Y2JpQWdJQ0J3Y21WbWN5NW5aWFFvSjJWdVlXSnNaV1JFWldaekp5d2daVzVoWW14bFpFUmxabk1nUFQ0Z2UxeHVJQ0FnSUNBZ2FXWWdLRjh1YVhOQ2IyOXNaV0Z1S0dWdVlXSnNaV1JFWldaektTa2djbVYwZFhKdVhHNGdJQ0FnSUNCd2NtVm1jeTV6WlhRb0oyVnVZV0pzWldSRVpXWnpKeXdnZEhKMVpTa2dMeTlsZUdsemRHbHVaeUIxYzJWeWN5Qm5aWFFnZEhKMVpWeHVJQ0FnSUgwcFhHNWNiaUFnSUNCcFppQW9kbVZ5YzJsdmJpNXpjR3hwZENnbkxpY3BXekJkSUNFOUlIQnlaWFpwYjNWelZtVnljMmx2Ymk1emNHeHBkQ2duTGljcFd6QmRLU0I3WEc0Z0lDQWdJQ0JpWVdSblpTNTFjR1JoZEdVb0tWeHVJQ0FnSUgxY2JpQWdmVnh1WEc0Z0lIQnlaV1p6TG5ObGRDZ25kbVZ5YzJsdmJpY3NJSFpsY25OcGIyNHBYRzU5WEc1Y2JtRnplVzVqSUdaMWJtTjBhVzl1SUdsdWMzUmhiR3dvS1NCN1hHNGdJR3h2WVdSRGIyNTBaVzUwVTJOeWFYQjBjeWdwWEc0Z0lHeGxkQ0JrYjIxaGFXNGdQU0JoZDJGcGRDQndjbTl0YVhObFIyVjBSRzl0WVdsdUtDbGNiaUFnYkdWMElHWnliMjFHZFc1dVpXd2dQU0JrYjIxaGFXNHVhVzVrWlhoUFppZ25aM0poYlcxaGNteDVMbU52YlNjcElENGdMVEZjYmlBZ2FXNXpkR0ZzYkZSeVlXTnJLR1p5YjIxR2RXNXVaV3dwWEc0Z0lHbG1JQ2h3Y205alpYTnpMbVZ1ZGk1UVVrOUVLU0I3WEc0Z0lDQWdZWGRoYVhRZ2IzQmxibGRsYkdOdmJXVW9abkp2YlVaMWJtNWxiQ2xjYmlBZ2ZWeHVYRzRnSUdaMWJtTjBhVzl1SUdsdWMzUmhiR3hVY21GamF5aG1jbTl0Um5WdWJtVnNLU0I3WEc0Z0lDQWdiR1YwSUdSaGRHRWdQU0I3WjFCeWIyUjFZM1E2SUdCRmVIUmxibk5wYjI0dEpIdG5aWFJDY205M2MyVnlLQ2w5WUgxY2JpQWdJQ0JqWVd4c0tDZG1aV3h2Wnk1cGJtWnZKeXdnSjJWNGRHVnVjMmx2Ymw5cGJuTjBZV3hzSnl3Z2UzTnZkWEpqWlRvZ1puSnZiVVoxYm01bGJDQS9JQ2RtZFc1dVpXd25JRG9nSjNkbFluTjBiM0psSjMwcFhHNGdJQ0FnWTJGc2JDZ25iV2w0Y0dGdVpXd3VjMlYwVUhKdmNITW5MQ0I3WEc0Z0lDQWdJQ0JiWUdSaGRHVWtlMkp5YjNkelpYSk9ZVzFsS0NsOVJYaDBaVzV6YVc5dVNXNXpkR0ZzYkdWa1lGMDZJRVJoZEdVdWJtOTNLQ2xjYmlBZ0lDQjlLVnh1SUNBZ0lHTmhiR3dvSjJkdVlYSXVjMlZ1WkNjc0lHQWtlMmRsZEVKeWIzZHpaWElvS1gxRmVIUXZhVzV6ZEdGc2JHVmtZQ2xjYmlBZ0lDQmpZV3hzS0NkdGFYaHdZVzVsYkM1MGNtRmpheWNzSUNkSE9rZHlZVzF0WVhKc2VWOVFjbTlrZFdOMFgwWnBjbk4wWDFWelpXUW5MQ0JrWVhSaEtWeHVJQ0FnSUdOaGJHd29KMjFwZUhCaGJtVnNMblJ5WVdOckp5d2dKMGM2UjNKaGJXMWhjbXg1WDFCeWIyUjFZM1JmU1c1emRHRnNiR1ZrSnl3Z1pHRjBZU2xjYmlBZ2ZWeHVYRzRnSUdaMWJtTjBhVzl1SUdKeWIzZHpaWEpPWVcxbEtDa2dlMXh1SUNBZ0lHeGxkQ0JpY205M2MyVnlJRDBnWjJWMFFuSnZkM05sY2lncFhHNGdJQ0FnY21WMGRYSnVJR0p5YjNkelpYSmJNRjB1ZEc5VmNIQmxja05oYzJVb0tTQXJJR0p5YjNkelpYSXVjMnhwWTJVb01TbGNiaUFnZlZ4dWZWeHVYRzVtZFc1amRHbHZiaUJ2Y0dWdVYyVnNZMjl0WlNobWRXNXVaV3dwSUh0Y2JpQWdhV1lnS0dselEyaHliMjFsS0NrZ0ppWWdablZ1Ym1Wc0tTQnlaWFIxY201Y2JpQWdiR1YwSUhWeWJDQTlJR2x6UTJoeWIyMWxLQ2tnUHlCVlVreFRMbmRsYkdOdmJXVkRJRG9nVlZKTVV5NWhkWFJvUTNKbFlYUmxVR0ZuWlNBcklDY3ZQMlY0ZEdWdWMybHZibDlwYm5OMFlXeHNQWFJ5ZFdVblhHNWNiaUFnY21WMGRYSnVJRzVsZHlCUWNtOXRhWE5sS0hKbGMyOXNkbVVnUFQ1Y2JpQWdJQ0JtZFc1dVpXd2dQMXh1SUNBZ0lDQWdabTl5WjJVdWRHRmljeTUxY0dSaGRHVkRkWEp5Wlc1MEtIVnliQ3dnY21WemIyeDJaU2tnT2x4dUlDQWdJQ0FnWm05eVoyVXVkR0ZpY3k1dmNHVnVLSFZ5YkN3Z1ptRnNjMlVzSUhKbGMyOXNkbVVwWEc0Z0lDbGNibjFjYmlKZGZRPT0iLCJpbXBvcnQge1VSTFMsIGdldFVwZGF0ZVRpbWV9IGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCBwYWdlQ29uZmlnIGZyb20gJy4uL3BhZ2UtY29uZmlnJ1xuaW1wb3J0IHtjYWxsfSBmcm9tICcuLi90cmFja2luZy9pbmRleCdcbmltcG9ydCB7ZG9tYWluRnJvbVVybH0gZnJvbSAnLi4vbG9jYXRpb24nXG5pbXBvcnQge2lzQ2hyb21lLCBjaHJvbWVCZ0Vycm9yLCBnZXRSYW5kb21JbnRJbmNsdXNpdmV9IGZyb20gJy4uL3V0aWwnXG5pbXBvcnQgZm9yZ2UgZnJvbSAnLi4vZm9yZ2UnXG5cblxubGV0IGNocm9tZSA9IHdpbmRvdy5jaHJvbWUsXG4gIGN1cnJlbnREb21haW4sIHVwZGF0ZVN0YXJ0ZWQgPSBmYWxzZVxuXG5mdW5jdGlvbiBzZXRVbmluc3RhbGxVUkwoZG9tYWluID0gJycpIHtcbiAgaWYgKCFpc0Nocm9tZSgpKSByZXR1cm5cbiAgLy9jYXNlIGZvciBzZXJ2aWNlIHVybHNcbiAgaWYgKCFkb21haW4gfHwgZG9tYWluLmluZGV4T2YoJy4nKSA9PSAtMSkgcmV0dXJuXG4gIGlmIChjdXJyZW50RG9tYWluID09IGRvbWFpbikgcmV0dXJuXG4gIGN1cnJlbnREb21haW4gPSBkb21haW5cbiAgbGV0IHVybCA9IGRvbWFpbiA/IFVSTFMudW5pbnN0YWxsICsgJz9kb21haW49JyArIGVuY29kZVVSSShkb21haW4pIDogVVJMUy51bmluc3RhbGxcbiAgY2hyb21lLnJ1bnRpbWUuc2V0VW5pbnN0YWxsVVJMKHVybClcbn1cblxuZnVuY3Rpb24gc2V0dXBGb3JjZWRVcGRhdGUoKSB7XG4gIGlmICghaXNDaHJvbWUoKSB8fCB1cGRhdGVTdGFydGVkKSByZXR1cm5cblxuICBjaHJvbWUucnVudGltZS5vblVwZGF0ZUF2YWlsYWJsZS5hZGRMaXN0ZW5lcigoZGV0YWlscykgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdEZXRlY3RlZCB0aGUgbmV4dCBleHRlbnNpb24gdmVyc2lvbicsIGRldGFpbHMudmVyc2lvbilcbiAgICBjYWxsKCdmZWxvZy5pbmZvJywgJ2Nocm9tZV9mb3JjZWRfdG9fdXBkYXRlJylcbiAgICB1cGRhdGVTdGFydGVkID0gdHJ1ZVxuXG4gICAgbGV0IHdpbGxVcGRhdGVJbk1pbnV0ZXMgPSBnZXRSYW5kb21JbnRJbmNsdXNpdmUoMSwgZ2V0VXBkYXRlVGltZSgpKVxuICAgIGNvbnNvbGUubG9nKCdHb2luZyB0byB1cGRhdGUgaW4gbWludXRlczonLCB3aWxsVXBkYXRlSW5NaW51dGVzKVxuICAgIHNldFRpbWVvdXQoY2hyb21lLnJ1bnRpbWUucmVsb2FkLCB3aWxsVXBkYXRlSW5NaW51dGVzICogNjAgKiAxMDAwIClcbiAgfSlcbiAgcmVxdWVzdFVwZGF0ZUNoZWNrKClcbn1cblxuZnVuY3Rpb24gcmVxdWVzdFVwZGF0ZUNoZWNrKCkge1xuICBjaHJvbWUucnVudGltZS5yZXF1ZXN0VXBkYXRlQ2hlY2soKHN0YXR1cykgPT4ge1xuICAgIGlmIChzdGF0dXMgPT0gJ3VwZGF0ZV9hdmFpbGFibGUnKSByZXR1cm4gY29uc29sZS5sb2coJ3VwZGF0ZSBwZW5kaW5nLi4uJylcbiAgICBpZiAoc3RhdHVzID09ICdub191cGRhdGUnKSByZXR1cm4gY29uc29sZS5sb2coJ25vIHVwZGF0ZSBmb3VuZCcpXG4gICAgaWYgKHN0YXR1cyA9PSAndGhyb3R0bGVkJykgcmV0dXJuIGNvbnNvbGUubG9nKCdPb3BzLCBJXFwnbSBhc2tpbmcgdG9vIGZyZXF1ZW50bHkgLSBJIG5lZWQgdG8gYmFjayBvZmYuJylcbiAgfSlcblxuICBzZXRUaW1lb3V0KHJlcXVlc3RVcGRhdGVDaGVjaywgMSAqIDYwICogMTAwMClcbn1cblxuZnVuY3Rpb24gZ2V0U2VsZWN0ZWRUYWJGYXZpY29uKGNiKSB7XG4gIGNocm9tZS50YWJzLmdldFNlbGVjdGVkKHRhYiA9PiB7XG4gICAgY2IodGFiICYmIHRhYi5mYXZJY29uVXJsKVxuICB9KVxufVxuXG5mdW5jdGlvbiBleGVjSlMoaWQsIGZpbGUsIG9wdHMgPSB7fSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICBjaHJvbWUudGFicy5leGVjdXRlU2NyaXB0KGlkLCB7ZmlsZSwgLi4ub3B0c30sICgpID0+XG4gICAgICBjaHJvbWVCZ0Vycm9yKCkgPyByZWplY3QoY2hyb21lQmdFcnJvcigpKSA6IHJlc29sdmUoKVxuICAgIClcbiAgKVxufVxuXG5mdW5jdGlvbiBleGVjQ1NTKGlkLCBmaWxlLCBvcHRzID0ge30pIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgY2hyb21lLnRhYnMuaW5zZXJ0Q1NTKGlkLCB7ZmlsZSwgLi4ub3B0c30sICgpID0+XG4gICAgICBjaHJvbWVCZ0Vycm9yKCkgPyByZWplY3QoY2hyb21lQmdFcnJvcigpKSA6IHJlc29sdmUoKVxuICAgIClcbiAgKVxufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkQ29udGVudFNjcmlwdHMoZG9tYWluKSB7XG4gIGlmICghaXNDaHJvbWUoKSkgcmV0dXJuXG4gIGxldCBtYW5pZmVzdCA9IGNocm9tZS5ydW50aW1lLmdldE1hbmlmZXN0KClcblxuICBpZiAoIW1hbmlmZXN0KSByZXR1cm5cblxuICBsZXQgc291cmNlID0gbWFuaWZlc3QuY29udGVudF9zY3JpcHRzLnBvcCgpXG4gIGxldCB0YWJzID0gYXdhaXQgZmlsdGVyZWRUYWJzKHRydWUsIGRvbWFpbilcblxuICBpZiAoIXRhYnMubGVuZ3RoKSByZXR1cm5cblxuICBjb25zb2xlLmxvZygnTG9hZCBjb250ZW50IHNjcmlwdHMgdG8nLCB0YWJzKVxuXG4gIGxldCBlcnJvckhhbmRsZSA9IChlLCB0eXBlKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2UgPSAoZSAmJiBlLm1lc3NhZ2UpIHx8IGVcbiAgICBjYWxsKCdmZWxvZy5lcnJvcicsIGBjaHJvbWVfY3NfJHt0eXBlfV9sb2FkX2Vycm9yYCwge21lc3NhZ2V9KVxuICAgIGNvbnNvbGUuZXJyb3IoYGNzICR7dHlwZX0gbG9hZGVkIHdpdGggZXJyb3I6ICR7bWVzc2FnZX1gKVxuICB9XG5cbiAgY29uc29sZS50aW1lKCdDb250ZW50IHNjcmlwdHMgbG9hZCB0aW1lJylcblxuICBhd2FpdCogdGFic1xuICAgIC5tYXAoKHtpZH0pID0+IFByb21pc2UuYWxsKFtcbiAgICAgIHNvdXJjZS5qcy5yZWR1Y2UoKGxvYWRlciwganMpID0+IGxvYWRlci50aGVuKCgpID0+IGV4ZWNKUyhpZCwganMsIHtydW5BdDogJ2RvY3VtZW50X2lkbGUnfSkpLCBQcm9taXNlLnJlc29sdmUoKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3NjcmlwdHMgbG9hZGVkJykpXG4gICAgICAgIC5jYXRjaChlID0+IGVycm9ySGFuZGxlKGUsICdqcycpKSxcblxuICAgICAgc291cmNlLmNzcy5yZWR1Y2UoKGxvYWRlciwgY3NzKSA9PiBsb2FkZXIudGhlbigoKSA9PiBleGVjQ1NTKGlkLCBjc3MsIHtydW5BdDogJ2RvY3VtZW50X2lkbGUnfSkpLCBQcm9taXNlLnJlc29sdmUoKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ2NzcyBsb2FkZWQnKSlcbiAgICAgICAgLmNhdGNoKGUgPT4gZXJyb3JIYW5kbGUoZSwgJ2NzcycpKVxuICAgIF0pKVxuXG4gIGNvbnNvbGUudGltZUVuZCgnQ29udGVudCBzY3JpcHRzIGxvYWQgdGltZScpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRQcm94eSgpIHtcbiAgaWYgKCFpc0Nocm9tZSgpKSByZXR1cm5cblxuICB0cnkge1xuICAgIGxldCB0YWJzID0gYXdhaXQgZmlsdGVyZWRUYWJzKClcbiAgICBhd2FpdCogdGFicy5tYXAoKHtpZH0pID0+IGV4ZWNKUyhpZCwgJ3NyYy9qcy9wcm94eS5qcycpKVxuICAgIGNvbnNvbGUubG9nKCdwcm94eSBsb2FkZWQgb24nLCB0YWJzLm1hcCh0YWIgPT4gdGFiLnVybCkpXG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICBsZXQgbWVzc2FnZSA9IChlICYmIGUubWVzc2FnZSkgfHwgZVxuICAgIC8vY2FsbCgnZmVsb2cuZXJyb3InLCAnY2hyb21lX3Byb3h5X2xvYWRfZXJyb3InLCB7bWVzc2FnZX0pXG4gICAgY29uc29sZS5lcnJvcigncHJveHkgbG9hZGVkIHdpdGggZXJyb3I6ICcsIG1lc3NhZ2UpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tUYWJEb21haW4oe3VybH0pIHtcbiAgaWYgKHVybC5pbmRleE9mKCdodHRwJykgIT0gMCkgcmV0dXJuXG4gIGlmICh1cmwuaW5jbHVkZXMoJ2dyYW1tYXJseScpKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gcGFnZUNvbmZpZy5jaGVja0RvbWFpbihkb21haW5Gcm9tVXJsKHVybCkpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGlzTm90Q1NMb2FkZWQodGFiKSB7XG4gIC8vcmV0dXJuIHRydWUgb25seSBpZiB3ZSBoYXZlIGRhdGEgdmFyaWFibGUgZ3JDU0xvYWRlZCBpbiBib2R5XG4gIGNvbnN0IGlzTG9hZGVkID0gYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PlxuICAgIGNocm9tZS50YWJzLmV4ZWN1dGVTY3JpcHQodGFiLmlkLCB7XG4gICAgICBjb2RlOiAnZG9jdW1lbnQuYm9keS5kYXRhc2V0LmdyQ1NMb2FkZWQnXG4gICAgfSwgcmVzID0+IHJlc29sdmUocmVzICYmIHJlcy5wb3AoKSkpXG4gIClcblxuICByZXR1cm4gIWlzTG9hZGVkICYmIHRhYlxufVxuXG5hc3luYyBmdW5jdGlvbiBmaWx0ZXJlZFRhYnMob25seU9uZUluc3RhbmNlLCBkb21haW4pIHtcbiAgY29uc3QgdGFicyA9IGF3YWl0IG5ldyBQcm9taXNlKGZvcmdlLnRhYnMuYWxsVGFicylcbiAgY29uc3QgY3VycmVudCA9IGF3YWl0IG5ldyBQcm9taXNlKGZvcmdlLnRhYnMuZ2V0Q3VycmVudFRhYlVybClcbiAgY29uc3QgcHJvY2Vzc2VkVGFicyA9IGF3YWl0KiB0YWJzXG4gICAgLmZpbHRlcihkb21haW4gPyAoe3VybH0pID0+IHVybC5pbmNsdWRlcyhkb21haW4pIDogY2hlY2tUYWJEb21haW4pXG4gICAgLm1hcChvbmx5T25lSW5zdGFuY2UgPyBpc05vdENTTG9hZGVkIDogdGFiID0+IFByb21pc2UucmVzb2x2ZSh0YWIpKVxuXG4gIHJldHVybiBwcm9jZXNzZWRUYWJzXG4gICAgLmZpbHRlcihCb29sZWFuKVxuICAgIC5zb3J0KCh7dXJsfSkgPT4gdXJsID09IGN1cnJlbnQgPyAtMSA6IDEpLy9mb2N1c2VkIHRhYiB3aWxsIGJlIGZpcnN0XG59XG5cblxuZXhwb3J0IHtcbiAgc2V0VW5pbnN0YWxsVVJMLFxuICBzZXR1cEZvcmNlZFVwZGF0ZSxcbiAgZ2V0U2VsZWN0ZWRUYWJGYXZpY29uLFxuICBsb2FkQ29udGVudFNjcmlwdHMsXG4gIGZpbHRlcmVkVGFicyxcbiAgbG9hZFByb3h5XG59XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4ndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfZm9yZ2UyID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ2ZvcmdlJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydmb3JnZSddIDogbnVsbCk7XG5cbnZhciBfZm9yZ2UzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZm9yZ2UyKTtcblxudmFyIF91dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG52YXIgZm9yZ2UgPSBfZm9yZ2UzWydkZWZhdWx0J107XG5pZiAoIWZvcmdlKSB7XG4gIGZvcmdlID0ge1xuICAgIGNvb2tpZXM6IHtcbiAgICAgIGdldDogX3V0aWwuX2YsXG4gICAgICBzZXQ6IF91dGlsLl9mLFxuICAgICAgd2F0Y2g6IF91dGlsLl9mXG4gICAgfVxuICB9O1xufVxuXG52YXIgZ2V0VG9rZW4gPSBmdW5jdGlvbiBnZXRUb2tlbihjYikge1xuICBmb3JnZS5jb29raWVzLmdldCgnZ3JhbW1hcmx5LmNvbScsICcvJywgJ2dyYXV0aCcsIGNiKTtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG52YXIgd2F0Y2hUb2tlbiA9IGZ1bmN0aW9uIHdhdGNoVG9rZW4oY2IpIHtcbiAgZm9yZ2UuY29va2llcy53YXRjaCgnZ3JhbW1hcmx5LmNvbScsICcvJywgJ2dyYXV0aCcsIGNiKTtcbiAgcmV0dXJuIHRydWU7XG59O1xudmFyIHdhdGNoID0gZnVuY3Rpb24gd2F0Y2goZG9tYWluLCBuYW1lLCBjYikge1xuICBmb3JnZS5jb29raWVzLndhdGNoKGRvbWFpbiwgJy8nLCBuYW1lLCBjYik7XG4gIHJldHVybiB0cnVlO1xufTtcblxudmFyIGdldENvb2tpZSA9IGZ1bmN0aW9uIGdldENvb2tpZShkb21haW4sIG5hbWUsIGNiKSB7XG4gIGZvcmdlLmNvb2tpZXMuZ2V0KGRvbWFpbiwgJy8nLCBuYW1lLCBjYik7XG4gIHJldHVybiB0cnVlO1xufTtcblxudmFyIHNldCA9IGZ1bmN0aW9uIHNldChkYXRhKSB7XG4gIGZvcmdlLmNvb2tpZXMuc2V0KGRhdGEpO1xufTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBnZXRDb29raWU6IGdldENvb2tpZSxcbiAgZ2V0OiBnZXRDb29raWUsXG4gIHNldDogc2V0LFxuICB3YXRjaDogd2F0Y2gsXG4gIGdldFRva2VuOiBnZXRUb2tlbixcbiAgd2F0Y2hUb2tlbjogd2F0Y2hUb2tlblxufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5d2NtOXFaV04wTDNOeVl5OXFjeTlzYVdJdlltY3ZZMjl2YTJsbExtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPenM3T3pzN096dHpRa0ZCYlVJc1QwRkJUenM3T3p0dlFrRkRWQ3hUUVVGVE96dEJRVVV4UWl4SlFVRkpMRXRCUVVzc2NVSkJRVk1zUTBGQlFUdEJRVU5zUWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRk8wRkJRMVlzVDBGQlN5eEhRVUZITzBGQlEwNHNWMEZCVHl4RlFVRkZPMEZCUTFBc1UwRkJSeXhWUVVGSk8wRkJRMUFzVTBGQlJ5eFZRVUZKTzBGQlExQXNWMEZCU3l4VlFVRkpPMHRCUTFZN1IwRkRSaXhEUVVGQk8wTkJRMFk3TzBGQlJVUXNTVUZCU1N4UlFVRlJMRWRCUVVjc1UwRkJXQ3hSUVVGUkxFTkJRVWNzUlVGQlJTeEZRVUZKTzBGQlEyNUNMRTlCUVVzc1EwRkJReXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEdWQlFXVXNSVUZCUlN4SFFVRkhMRVZCUVVVc1VVRkJVU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZCTzBGQlEzSkVMRk5CUVU4c1NVRkJTU3hEUVVGQk8wTkJRMW9zUTBGQlFUczdRVUZGUkN4SlFVRkpMRlZCUVZVc1IwRkJSeXhUUVVGaUxGVkJRVlVzUTBGQlJ5eEZRVUZGTEVWQlFVazdRVUZEY2tJc1QwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNaVUZCWlN4RlFVRkZMRWRCUVVjc1JVRkJSU3hSUVVGUkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVRTdRVUZEZGtRc1UwRkJUeXhKUVVGSkxFTkJRVUU3UTBGRFdpeERRVUZCTzBGQlEwUXNTVUZCU1N4TFFVRkxMRWRCUVVjc1UwRkJVaXhMUVVGTExFTkJRVWtzVFVGQlRTeEZRVUZGTEVsQlFVa3NSVUZCUlN4RlFVRkZMRVZCUVVzN1FVRkRhRU1zVDBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hGUVVGRkxFZEJRVWNzUlVGQlJTeEpRVUZKTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVFN1FVRkRNVU1zVTBGQlR5eEpRVUZKTEVOQlFVRTdRMEZEV2l4RFFVRkJPenRCUVVWRUxFbEJRVWtzVTBGQlV5eEhRVUZITEZOQlFWb3NVMEZCVXl4RFFVRkpMRTFCUVUwc1JVRkJSU3hKUVVGSkxFVkJRVVVzUlVGQlJTeEZRVUZMTzBGQlEzQkRMRTlCUVVzc1EwRkJReXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNSVUZCUlN4SFFVRkhMRVZCUVVVc1NVRkJTU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZCTzBGQlEzaERMRk5CUVU4c1NVRkJTU3hEUVVGQk8wTkJRMW9zUTBGQlFUczdRVUZGUkN4SlFVRkpMRWRCUVVjc1IwRkJSeXhUUVVGT0xFZEJRVWNzUTBGQlJ5eEpRVUZKTEVWQlFVazdRVUZEYUVJc1QwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVFN1EwRkRlRUlzUTBGQlFUczdjVUpCUldNN1FVRkRZaXhYUVVGVExFVkJRVlFzVTBGQlV6dEJRVU5VTEV0QlFVY3NSVUZCUlN4VFFVRlRPMEZCUTJRc1MwRkJSeXhGUVVGSUxFZEJRVWM3UVVGRFNDeFBRVUZMTEVWQlFVd3NTMEZCU3p0QlFVTk1MRlZCUVZFc1JVRkJVaXhSUVVGUk8wRkJRMUlzV1VGQlZTeEZRVUZXTEZWQlFWVTdRMEZEV0NJc0ltWnBiR1VpT2lKblpXNWxjbUYwWldRdWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lhVzF3YjNKMElGOW1iM0puWlNCbWNtOXRJQ2RtYjNKblpTZGNibWx0Y0c5eWRDQjdYMlo5SUdaeWIyMGdKeTR1TDNWMGFXd25YRzVjYm14bGRDQm1iM0puWlNBOUlGOW1iM0puWlZ4dWFXWWdLQ0ZtYjNKblpTa2dlMXh1SUNCbWIzSm5aU0E5SUh0Y2JpQWdJQ0JqYjI5cmFXVnpPaUI3WEc0Z0lDQWdJQ0JuWlhRNklGOW1MRnh1SUNBZ0lDQWdjMlYwT2lCZlppeGNiaUFnSUNBZ0lIZGhkR05vT2lCZlpseHVJQ0FnSUgxY2JpQWdmVnh1ZlZ4dVhHNXNaWFFnWjJWMFZHOXJaVzRnUFNCallpQTlQaUI3WEc0Z0lHWnZjbWRsTG1OdmIydHBaWE11WjJWMEtDZG5jbUZ0YldGeWJIa3VZMjl0Snl3Z0p5OG5MQ0FuWjNKaGRYUm9KeXdnWTJJcFhHNGdJSEpsZEhWeWJpQjBjblZsWEc1OVhHNWNibXhsZENCM1lYUmphRlJ2YTJWdUlEMGdZMklnUFQ0Z2UxeHVJQ0JtYjNKblpTNWpiMjlyYVdWekxuZGhkR05vS0NkbmNtRnRiV0Z5YkhrdVkyOXRKeXdnSnk4bkxDQW5aM0poZFhSb0p5d2dZMklwWEc0Z0lISmxkSFZ5YmlCMGNuVmxYRzU5WEc1c1pYUWdkMkYwWTJnZ1BTQW9aRzl0WVdsdUxDQnVZVzFsTENCallpa2dQVDRnZTF4dUlDQm1iM0puWlM1amIyOXJhV1Z6TG5kaGRHTm9LR1J2YldGcGJpd2dKeThuTENCdVlXMWxMQ0JqWWlsY2JpQWdjbVYwZFhKdUlIUnlkV1ZjYm4xY2JseHViR1YwSUdkbGRFTnZiMnRwWlNBOUlDaGtiMjFoYVc0c0lHNWhiV1VzSUdOaUtTQTlQaUI3WEc0Z0lHWnZjbWRsTG1OdmIydHBaWE11WjJWMEtHUnZiV0ZwYml3Z0p5OG5MQ0J1WVcxbExDQmpZaWxjYmlBZ2NtVjBkWEp1SUhSeWRXVmNibjFjYmx4dWJHVjBJSE5sZENBOUlHUmhkR0VnUFQ0Z2UxeHVJQ0JtYjNKblpTNWpiMjlyYVdWekxuTmxkQ2hrWVhSaEtWeHVmVnh1WEc1bGVIQnZjblFnWkdWbVlYVnNkQ0I3WEc0Z0lHZGxkRU52YjJ0cFpTeGNiaUFnWjJWME9pQm5aWFJEYjI5cmFXVXNYRzRnSUhObGRDeGNiaUFnZDJGMFkyZ3NYRzRnSUdkbGRGUnZhMlZ1TEZ4dUlDQjNZWFJqYUZSdmEyVnVYRzU5WEc0aVhYMD0iLCJ3aW5kb3cuSVNfQkcgPSB0cnVlXG4iLCJpbXBvcnQgcHJlZnMgZnJvbSAnLi4vcHJlZnMnXG5pbXBvcnQge25ld3NJZH0gZnJvbSAnLi4vY29uZmlnJ1xuXG5cbmZ1bmN0aW9uIGluc3RhbGwoKSB7XG4gIHByZWZzLnNldCgnc2Vlbk5ld3NWZXJzaW9uJywgbmV3c0lkKVxufVxuXG5hc3luYyBmdW5jdGlvbiBpc1Nob3dOZXdzKCkge1xuICBsZXQgc2Vlbk5ld3NWZXJzaW9uID0gYXdhaXQgcHJlZnMuZ2V0KCdzZWVuTmV3c1ZlcnNpb24nKSxcbiAgICBpc0Fub255bW91cyA9IGF3YWl0IHByZWZzLmdldCgnYW5vbnltb3VzJylcblxuICByZXR1cm4gIWlzQW5vbnltb3VzICYmIG5ld3NJZCAmJiBzZWVuTmV3c1ZlcnNpb24gIT0gbmV3c0lkXG59XG5cbi8vc3luYyB2ZXJzaW9uIG9mIGlzU2hvd05ld3NcbmZ1bmN0aW9uIGlzU2hvd05ld3NUb1VzZXIodXNlcikge1xuICByZXR1cm4gbmV3c0lkICYmIG5ld3NJZCAhPSB1c2VyLnNlZW5OZXdzVmVyc2lvblxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGluc3RhbGwsXG4gIGlzU2hvd05ld3MsXG4gIGlzU2hvd05ld3NUb1VzZXJcbn1cbiIsImltcG9ydCBlbWl0dGVyIGZyb20gJ2VtaXR0ZXInXG5pbXBvcnQge2xpc3RlbiwgdW5saXN0ZW59IGZyb20gJy4uL2RvbSdcbi8vaW1wb3J0IHtVUkxTfSBmcm9tICcuLi9jb25maWcnXG5cbmxldCBPZmZsaW5lID0gZnVuY3Rpb24oY29uZmlnID0ge30pIHtcbiAgbGV0IG1lID0gZW1pdHRlcih7fSksXG4gICAgd2luID0gY29uZmlnLndpbmRvdyB8fCB3aW5kb3dcblxuICBsZXQgb25saW5lID0gKCkgPT4gbWUuZW1pdCgnb25saW5lJyksXG4gICAgb2ZmbGluZSA9ICgpID0+IG1lLmVtaXQoJ29mZmxpbmUnKVxuXG4gIGxpc3Rlbih3aW4sIHtvbmxpbmUsIG9mZmxpbmV9KVxuXG4gIG1lLnN0b3AgPSAoKSA9PiB1bmxpc3Rlbih3aW4sIHtvbmxpbmUsIG9mZmxpbmV9KVxuXG4gIHJldHVybiBtZVxuXG4gIC8vY29uc29sZS5sb2coJ3N0YXJ0IGxpc3RlbiBDb25uZWN0aW9uJywgVVJMUy5vZmZsaW5lKVxuXG4gIC8qbGV0IHJlcXVlc3RpbmcsXG4gICAgb2ZmbGluZSxcbiAgICB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuXG4gIGlmIChtZS5saXN0ZW5pbmdBamF4KSByZXR1cm5cblxuICBtZS5saXN0ZW5pbmdBamF4ID0gdHJ1ZVxuXG4gIGZ1bmN0aW9uIGZldGNoKCkge1xuICAgIGlmIChyZXF1ZXN0aW5nKSByZXR1cm5cblxuICAgIGxldCB1cmwgPSBVUkxTLm9mZmxpbmUsXG4gICAgICBub1Jlc3BvbnNlVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgeGhyLmFib3J0KClcbiAgICAgICAgcmVxdWVzdGluZyA9IGZhbHNlXG5cbiAgICAgICAgaWYgKCFvZmZsaW5lKSB7XG4gICAgICAgICAgb2ZmbGluZSA9IHRydWVcbiAgICAgICAgICBtZS5lbWl0KCdvZmZsaW5lJylcbiAgICAgICAgfVxuICAgICAgfSwgMTAwMDApXG5cbiAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZSA9PiB7XG4gICAgICBpZiAoeGhyLnJlYWR5U3RhdGUgIT0gNCkgcmV0dXJuXG5cbiAgICAgIHJlcXVlc3RpbmcgPSBmYWxzZVxuICAgICAgY2xlYXJUaW1lb3V0KG5vUmVzcG9uc2VUaW1lcilcblxuICAgICAgaWYgKHhoci5zdGF0dXMgPT0gMjAwKSB7XG4gICAgICAgIGlmIChvZmZsaW5lKSB7XG4gICAgICAgICAgb2ZmbGluZSA9IGZhbHNlXG4gICAgICAgICAgbWUuZW1pdCgnb25saW5lJylcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoIW9mZmxpbmUpIHtcbiAgICAgICAgb2ZmbGluZSA9IHRydWVcbiAgICAgICAgbWUuZW1pdCgnb2ZmbGluZScpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVxdWVzdGluZyA9IHRydWVcbiAgICB4aHIub3BlbignR0VUJywgdXJsICsgJz8nICsgZ3VpZCgpKVxuICAgIHhoci5zZW5kKClcbiAgfVxuXG4gIGludGVydmFsKGZldGNoLCAxMDAwMClcblxuICBtZS5zdG9wID0gZ2xvYmFsID0+IHtcbiAgICBjYW5jZWxJbnRlcnZhbChmZXRjaClcbiAgICBtZS5saXN0ZW5pbmdBamF4ID0gZmFsc2VcbiAgfVxuXG4gIHJldHVybiBtZSovXG59XG5cbmV4cG9ydCBkZWZhdWx0IE9mZmxpbmVcbiIsImltcG9ydCBwcmVmcyBmcm9tICcuLi9wcmVmcydcblxuYXN5bmMgZnVuY3Rpb24gaXNTaG93UmVmZXJyYWxSaWJib24oKSB7XG4gIGxldCBncm91cHMgPSBhd2FpdCBwcmVmcy5nZXQoJ2dyb3VwcycpXG4gIGxldCBpblJlZmVycmFsR3JvdXAgPSBncm91cHMgJiYgZ3JvdXBzLnNvbWUoKGVsPScnKSA9PiBlbC5pbmRleE9mKCdyZWZlcnJhbF9sb2NrZWQnKSA+IC0xIHx8IGVsID09ICdyZWZlcnJhbCcgfHwgZWwgPT0gJ3Rlc3RfZ3JvdXAnKVxuICBsZXQgcmVmZXJyYWxOZXdzQmFkZ2UgPSBhd2FpdCBwcmVmcy5nZXQoJ3JlZmVycmFsTmV3c0JhZGdlJylcbiAgcmV0dXJuIGluUmVmZXJyYWxHcm91cCAmJiAhcmVmZXJyYWxOZXdzQmFkZ2Vcbn1cblxubGV0IHNlZW5SZWZlcnJhbFJpYmJvbiA9IChrZXk9dHJ1ZSkgPT4ge1xuICBwcmVmcy5zZXQoJ3JlZmVycmFsTmV3c0JhZGdlJywga2V5KVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGlzU2hvd1JlZmVycmFsUmliYm9uLFxuICBzZWVuUmVmZXJyYWxSaWJib25cbn1cbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxucmVxdWlyZSgnYmFiZWwvcG9seWZpbGwnKTtcblxudmFyIF9mb3JnZSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Wydmb3JnZSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnZm9yZ2UnXSA6IG51bGwpO1xuXG52YXIgX2ZvcmdlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ZvcmdlKTtcblxudmFyIF9zcGFya01kNSA9IHJlcXVpcmUoJ3NwYXJrLW1kNScpO1xuXG52YXIgX3NwYXJrTWQ1MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3NwYXJrTWQ1KTtcblxudmFyIF9wcmVmcyA9IHJlcXVpcmUoJy4vcHJlZnMnKTtcblxudmFyIF9wcmVmczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wcmVmcyk7XG5cbnZhciBGRUxPRyA9IHtcbiAga2V5OiAnYjM3MjUyZTMwMDIwNGIwMGFkNjk3ZmUxZDNiOTc5ZTEnLFxuICBwcm9qZWN0OiAnMTUnLFxuICBwaW5nVGltZW91dDogMTAgKiA2MCAqIDEwMDBcbn07XG5cbnZhciBHTkFSID0ge1xuICB1cmw6ICdodHRwczovL2duYXIuZ3JhbW1hcmx5LmNvbScsXG4gIHFhVXJsOiAnaHR0cHM6Ly9xYWduYXIuZ3JhbW1hcmx5LmNvbSdcbn07XG5cbnZhciBtcGtleSA9ICdjMTBkZDY0Yzg3ZjcwZWY1NTYzYTYzYzM2ODc5N2U4Yyc7XG52YXIgTUlYUEFORUwgPSB7XG4gIHFhS2V5OiAnN2E1Yzk1YjVjYmExYjIyNWQwMGNjM2JhMWM0MTBjNzgnLFxuICBrZXk6IG1wa2V5LFxuICBjb29raWU6ICdtcF8nICsgbXBrZXkgKyAnX21peHBhbmVsJ1xufTtcblxuaWYgKCFcInRydWVcIikge1xuICBHTkFSLnVybCA9IEdOQVIucWFVcmw7XG5cbiAgdmFyIF9tcGtleSA9IE1JWFBBTkVMLnFhS2V5O1xuICBNSVhQQU5FTC5rZXkgPSBfbXBrZXk7XG4gIE1JWFBBTkVMLmNvb2tpZSA9ICdtcF8nICsgX21wa2V5ICsgJ19taXhwYW5lbCc7XG59XG5cbnZhciBTVEFUU0MgPSB7XG4gIFVSTDogJ2h0dHBzOi8vc3RhdHMtcHVibGljLmdyYW1tYXJseS5pby8nLFxuICBQUkVGSVg6ICdncmFtbWFybHkudWknXG59O1xuXG52YXIgREFQSSA9ICdodHRwczovL2RhdGEuZ3JhbW1hcmx5LmNvbSc7XG5cbnZhciBhcHAgPSAnaHR0cHM6Ly9hcHAuZ3JhbW1hcmx5LmNvbSc7XG52YXIgYXV0aFVzZXIgPSAnaHR0cHM6Ly9hdXRoLmdyYW1tYXJseS5jb20vdXNlcic7XG52YXIgd2VsY29tZUZhbmRTID0gJ2h0dHBzOi8vd3d3LmdyYW1tYXJseS5jb20vYWZ0ZXJfaW5zdGFsbF9wYWdlJztcbnZhciBVUkxTID0ge1xuICBhcHA6IGFwcCxcbiAgY2FwaTogJ3dzczovL2NhcGkuZ3JhbW1hcmx5LmNvbS9mcmVld3MnLFxuICBkYXBpTWltaWM6IERBUEkgKyAnL2FwaS9taW1pYycsXG4gIGVkaXRvcjogYXBwICsgJy9wb3B1cDInLFxuICBkaWN0aW9uYXJ5OiAnaHR0cHM6Ly9jYXBpLmdyYW1tYXJseS5jb20vYXBpL2RlZnMnLFxuICB1cGdyYWRlOiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS91cGdyYWRlJyxcbiAgYXV0aFVzZXI6IGF1dGhVc2VyLFxuICBhdXRoU2V0dGluZ3M6IGF1dGhVc2VyICsgJy9zZXR0aW5ncycsXG4gIGF1dGhHcm91cDogYXV0aFVzZXIgKyAnL2dyb3VwJyxcbiAgYXV0aFBpbmc6IGF1dGhVc2VyICsgJy9zeW5jJyxcbiAgYXV0aENyZWF0ZUFub255bW91czogYXV0aFVzZXIgKyAnL2Fub255bW91cycsXG4gIGF1dGhDcmVhdGVQYWdlOiAnaHR0cHM6Ly9hdXRoLmdyYW1tYXJseS5jb20vcmVkaXJlY3QtYW5vbnltb3VzP2xvY2F0aW9uPScgKyB3ZWxjb21lRmFuZFMsXG4gIGRvY3M6IGFwcCArICcvZG9jcycsXG4gIGRvY3NBcGk6ICdodHRwczovL2RveC5ncmFtbWFybHkuY29tL2RvY3VtZW50cycsXG4gIG9mZmxpbmU6ICdodHRwczovL2VkLmdyYW1tYXJseS5jb20vZG93bmxvYWQvZmlyZWZveC91cGRhdGUuanNvbicsXG4gIHdlbGNvbWVDOiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9leHRlbnNpb24tc3VjY2VzcycsXG4gIHVuaW5zdGFsbDogJ2h0dHBzOi8vd3d3LmdyYW1tYXJseS5jb20vZXh0ZW5zaW9uLXVuaW5zdGFsbCcsXG4gIHVzZXJPckFub255bW91czogJ2h0dHBzOi8vYXV0aC5ncmFtbWFybHkuY29tL3VzZXIvb3Jhbm9ueW1vdXMnLFxuICBhdXRoU2lnbmluOiAnaHR0cHM6Ly9hdXRoLmdyYW1tYXJseS5jb20vbG9naW4nLFxuICBhdXRoU2lnbnVwOiAnaHR0cHM6Ly9hdXRoLmdyYW1tYXJseS5jb20vc2lnbnVwJyxcbiAgc2lnbmluOiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9zaWduaW4nLFxuICBzaWdudXA6ICdodHRwczovL3d3dy5ncmFtbWFybHkuY29tL3NpZ251cCcsXG4gIHdlbGNvbWVGYW5kUzogd2VsY29tZUZhbmRTLFxuICByYXZlbjogJ2ZlbG9nLmdyYW1tYXJseS5pbycsXG4gIHJlZmVycmFsOiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9yZWZlcnJhbCcsXG4gIHBhZ2VDb25maWdVcmw6ICdodHRwczovL2QzY3Y0YTlhOXdoMGJ0LmNsb3VkZnJvbnQubmV0L2Jyb3dzZXJwbHVnaW4vY29uZmlnLmpzb24nLFxuICByZXNldFBhc3N3b3JkOiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9yZXNldHBhc3N3b3JkJyxcbiAgdGVybXM6ICdodHRwczovL3d3dy5ncmFtbWFybHkuY29tL3Rlcm1zJyxcbiAgcG9saWN5OiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9wcml2YWN5LXBvbGljeSdcbn07XG5cbnZhciB1cmxLZXlzID0gT2JqZWN0LmtleXMoVVJMUyk7XG52YXIgcGtleSA9IGZ1bmN0aW9uIHBrZXkoa2V5KSB7XG4gIHJldHVybiAnVVJMUy4nICsga2V5O1xufTtcblxuX3ByZWZzMlsnZGVmYXVsdCddLmdldCh1cmxLZXlzLm1hcChwa2V5KSwgZnVuY3Rpb24gKHJlc3VsdCkge1xuICByZXR1cm4gdXJsS2V5cy5maWx0ZXIoZnVuY3Rpb24gKHVybCkge1xuICAgIHJldHVybiByZXN1bHRbcGtleSh1cmwpXTtcbiAgfSkuZm9yRWFjaChmdW5jdGlvbiAodXJsKSB7XG4gICAgcmV0dXJuIFVSTFNbdXJsXSA9IHJlc3VsdFtwa2V5KHVybCldO1xuICB9KTtcbn0pO1xuXG5mdW5jdGlvbiBnZXRWZXJzaW9uKCkge1xuICBpZiAoIV9mb3JnZTJbJ2RlZmF1bHQnXSkgcmV0dXJuO1xuICByZXR1cm4gX2ZvcmdlMlsnZGVmYXVsdCddLmNvbmZpZy5tb2R1bGVzLnBhcmFtZXRlcnMudmVyc2lvbjtcbn1cblxuZnVuY3Rpb24gZ2V0VXBkYXRlVGltZSgpIHtcbiAgaWYgKCFfZm9yZ2UyWydkZWZhdWx0J10pIHJldHVybjtcbiAgcmV0dXJuIF9mb3JnZTJbJ2RlZmF1bHQnXS5jb25maWcubW9kdWxlcy5wYXJhbWV0ZXJzLnVwZGF0ZVRpbWU7XG59XG5cbmZ1bmN0aW9uIGdldFV1aWQoKSB7XG4gIGlmICghX2ZvcmdlMlsnZGVmYXVsdCddKSByZXR1cm47XG4gIHJldHVybiBfZm9yZ2UyWydkZWZhdWx0J10uY29uZmlnLnV1aWQ7XG59XG5cbnZhciBuZXdzID0gWydQb3AtdXAgZWRpdG9yIG5vdyBvcGVucyBpbW1lZGlhdGVseScsICdZb3UgbWF5IGRpc2FibGUgZGVmaW5pdGlvbnMgb24gYWxsIHNpdGVzJ107XG5cbnZhciB1c2VyRmllbGRzID0gWydpZCcsICdlbWFpbCcsICdzdWJzY3JpcHRpb25GcmVlJywgJ2ZpcnN0TmFtZScsICdhbm9ueW1vdXMnLCAndHlwZScsICdwcmVtaXVtJywgJ3NldHRpbmdzJywgJ3JlZ2lzdHJhdGlvbkRhdGUnLCAnbWltaWMnLCAnZ3JvdXBzJywgJ2V4dGVuc2lvbkluc3RhbGxEYXRlJywgJ2ZpeGVkX2Vycm9ycycsICdleHQyJ107XG5cbmlmICghXCJ0cnVlXCIpIHtcbiAgdXNlckZpZWxkcy5wdXNoKCd0b2tlbicpO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIC8vIGRlYnVnOiB0cnVlLFxuICBuZXdzOiBuZXdzLFxuICBuZXdzSWQ6IG5ld3MubGVuZ3RoICYmIF9zcGFya01kNTJbJ2RlZmF1bHQnXS5oYXNoKG5ld3Muam9pbignXFxuJykpLFxuICBnZXRVcGRhdGVUaW1lOiBnZXRVcGRhdGVUaW1lLFxuICBVUkxTOiBVUkxTLFxuICBGRUxPRzogRkVMT0csXG4gIFNUQVRTQzogU1RBVFNDLFxuICBEQVBJOiBEQVBJLFxuICBNSVhQQU5FTDogTUlYUEFORUwsXG4gIEdOQVI6IEdOQVIsXG4gIGdldFZlcnNpb246IGdldFZlcnNpb24sXG4gIGdldFV1aWQ6IGdldFV1aWQsXG4gIGlzVGVzdDogIV9mb3JnZTJbJ2RlZmF1bHQnXSxcbiAgbmV4dFZlckNsYXNzOiAnZ3JfdmVyXzInLFxuICByZXN0cmljdGVkQXR0cnM6IFsnZGF0YS1ncmFtbV9lZGl0b3InLCAnZGF0YS1ncmFtbScsICdkYXRhLWdyYW1tX2lkJywgJ2dyYW1tX2VkaXRvcicsIFsnYXJpYS1sYWJlbCcsICdTZWFyY2ggRmFjZWJvb2snXV0sXG4gIHJlc3RyaWN0ZWRQYXJlbnRBdHRyczogJ1tkYXRhLXJlYWN0aWRdJyxcbiAgdXNlckZpZWxkczogdXNlckZpZWxkcyxcbiAgZXh0Mmdyb3VwczogWycwMDFfZ2J1dHRvbl9zaG93JywgJzAwMl9nYnV0dG9uX3Nob3cnLCAnMDAzX2didXR0b25fc2hvdyddLFxuICBleHRlcm5hbEV2ZW50czogWydjaGFuZ2VkLXVzZXInLCAnY2hhbmdlZC1wbGFuJywgJ2NsZWFudXAnLCAnZWRpdG9yLWZpeCddLFxuICBkZXZlbG9wbWVudDogZG9jdW1lbnQubG9jYXRpb24uaG9zdCA9PSAnMTI3LjAuMC4xOjMxMTcnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJaTl3Y205cVpXTjBMM055WXk5cWN5OXNhV0l2WTI5dVptbG5MbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3T3pzN096czdPenRSUVVGUExHZENRVUZuUWpzN2NVSkJRMHdzVDBGQlR6czdPenQzUWtGRFNpeFhRVUZYT3pzN08zRkNRVU5rTEZOQlFWTTdPenM3UVVGRk0wSXNTVUZCU1N4TFFVRkxMRWRCUVVjN1FVRkRWaXhMUVVGSExFVkJRVVVzYTBOQlFXdERPMEZCUTNaRExGTkJRVThzUlVGQlJTeEpRVUZKTzBGQlEySXNZVUZCVnl4RlFVRkZMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzU1VGQlNUdERRVU0xUWl4RFFVRkJPenRCUVVWRUxFbEJRVWtzU1VGQlNTeEhRVUZITzBGQlExUXNTMEZCUnl4RlFVRkZMRFJDUVVFMFFqdEJRVU5xUXl4UFFVRkxMRVZCUVVVc09FSkJRVGhDTzBOQlEzUkRMRU5CUVVFN08wRkJSVVFzU1VGQlNTeExRVUZMTEVkQlFVY3NhME5CUVd0RExFTkJRVUU3UVVGRE9VTXNTVUZCU1N4UlFVRlJMRWRCUVVjN1FVRkRZaXhQUVVGTExFVkJRVVVzYTBOQlFXdERPMEZCUTNwRExFdEJRVWNzUlVGQlJTeExRVUZMTzBGQlExWXNVVUZCVFN4VlFVRlJMRXRCUVVzc1kwRkJWenREUVVNdlFpeERRVUZCT3p0QlFVVkVMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlR0QlFVTnlRaXhOUVVGSkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVFN08wRkJSWEpDTEUxQlFVa3NUVUZCU3l4SFFVRkhMRkZCUVZFc1EwRkJReXhMUVVGTExFTkJRVUU3UVVGRE1VSXNWVUZCVVN4RFFVRkRMRWRCUVVjc1IwRkJSeXhOUVVGTExFTkJRVUU3UVVGRGNFSXNWVUZCVVN4RFFVRkRMRTFCUVUwc1YwRkJVeXhOUVVGTExHTkJRVmNzUTBGQlFUdERRVU42UXpzN1FVRkZSQ3hKUVVGSkxFMUJRVTBzUjBGQlJ6dEJRVU5ZTEV0QlFVY3NSVUZCUlN4dlEwRkJiME03UVVGRGVrTXNVVUZCVFN4RlFVRkZMR05CUVdNN1EwRkRka0lzUTBGQlFUczdRVUZGUkN4SlFVRkpMRWxCUVVrc1IwRkJSeXcwUWtGQk5FSXNRMEZCUVRzN1FVRkZka01zU1VGQlNTeEhRVUZITEVkQlFVY3NNa0pCUVRKQ0xFTkJRVUU3UVVGRGNrTXNTVUZCU1N4UlFVRlJMRWRCUVVjc2FVTkJRV2xETEVOQlFVRTdRVUZEYUVRc1NVRkJTU3haUVVGWkxFZEJRVWNzT0VOQlFUaERMRU5CUVVFN1FVRkRha1VzU1VGQlNTeEpRVUZKTEVkQlFVYzdRVUZEVkN4TFFVRkhMRVZCUVVnc1IwRkJSenRCUVVOSUxFMUJRVWtzUlVGQlJTeHBRMEZCYVVNN1FVRkRka01zVjBGQlV5eEZRVUZGTEVsQlFVa3NSMEZCUnl4WlFVRlpPMEZCUXpsQ0xGRkJRVTBzUlVGQlJTeEhRVUZITEVkQlFVY3NVMEZCVXp0QlFVTjJRaXhaUVVGVkxFVkJRVVVzY1VOQlFYRkRPMEZCUTJwRUxGTkJRVThzUlVGQlJTeHRRMEZCYlVNN1FVRkROVU1zVlVGQlVTeEZRVUZTTEZGQlFWRTdRVUZEVWl4alFVRlpMRVZCUVVVc1VVRkJVU3hIUVVGSExGZEJRVmM3UVVGRGNFTXNWMEZCVXl4RlFVRkZMRkZCUVZFc1IwRkJSeXhSUVVGUk8wRkJRemxDTEZWQlFWRXNSVUZCUlN4UlFVRlJMRWRCUVVjc1QwRkJUenRCUVVNMVFpeHhRa0ZCYlVJc1JVRkJSU3hSUVVGUkxFZEJRVWNzV1VGQldUdEJRVU0xUXl4blFrRkJZeXhGUVVGRkxIbEVRVUY1UkN4SFFVRkhMRmxCUVZrN1FVRkRlRVlzVFVGQlNTeEZRVUZGTEVkQlFVY3NSMEZCUnl4UFFVRlBPMEZCUTI1Q0xGTkJRVThzUlVGQlJTeHhRMEZCY1VNN1FVRkRPVU1zVTBGQlR5eEZRVUZGTEhWRVFVRjFSRHRCUVVOb1JTeFZRVUZSTEVWQlFVVXNOa05CUVRaRE8wRkJRM1pFTEZkQlFWTXNSVUZCUlN3clEwRkJLME03UVVGRE1VUXNhVUpCUVdVc1JVRkJSU3cyUTBGQk5rTTdRVUZET1VRc1dVRkJWU3hGUVVGRkxHdERRVUZyUXp0QlFVTTVReXhaUVVGVkxFVkJRVVVzYlVOQlFXMURPMEZCUXk5RExGRkJRVTBzUlVGQlJTeHJRMEZCYTBNN1FVRkRNVU1zVVVGQlRTeEZRVUZGTEd0RFFVRnJRenRCUVVNeFF5eGpRVUZaTEVWQlFWb3NXVUZCV1R0QlFVTmFMRTlCUVVzc1JVRkJSU3h2UWtGQmIwSTdRVUZETTBJc1ZVRkJVU3hGUVVGRkxHOURRVUZ2UXp0QlFVTTVReXhsUVVGaExFVkJRVVVzYVVWQlFXbEZPMEZCUTJoR0xHVkJRV0VzUlVGQlJTeDVRMEZCZVVNN1FVRkRlRVFzVDBGQlN5eEZRVUZGTEdsRFFVRnBRenRCUVVONFF5eFJRVUZOTEVWQlFVVXNNRU5CUVRCRE8wTkJRMjVFTEVOQlFVRTdPMEZCUlVRc1NVRkJUU3hQUVVGUExFZEJRVWNzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRVHRCUVVOcVF5eEpRVUZOTEVsQlFVa3NSMEZCUnl4VFFVRlFMRWxCUVVrc1EwRkJSeXhIUVVGSE8yMUNRVUZaTEVkQlFVYzdRMEZCUlN4RFFVRkJPenRCUVVWcVF5eHRRa0ZCVFN4SFFVRkhMRU5CUVVNc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4VlFVRkJMRTFCUVUwN1UwRkRha01zVDBGQlR5eERRVU5LTEUxQlFVMHNRMEZCUXl4VlFVRkJMRWRCUVVjN1YwRkJTU3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMGRCUVVFc1EwRkJReXhEUVVOb1F5eFBRVUZQTEVOQlFVTXNWVUZCUVN4SFFVRkhPMWRCUVVrc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03UjBGQlFTeERRVUZETzBOQlFVRXNRMEZEYWtRc1EwRkJRVHM3UVVGRlJDeFRRVUZUTEZWQlFWVXNSMEZCUnp0QlFVTndRaXhOUVVGSkxHMUNRVUZOTEVWQlFVVXNUMEZCVFR0QlFVTnNRaXhUUVVGUExHMUNRVUZOTEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJWU3hEUVVGRExFOUJRVThzUTBGQlFUdERRVU12UXpzN1FVRkZSQ3hUUVVGVExHRkJRV0VzUjBGQlJ6dEJRVU4yUWl4TlFVRkpMRzFDUVVGTkxFVkJRVVVzVDBGQlRUdEJRVU5zUWl4VFFVRlBMRzFDUVVGTkxFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCVlN4RFFVRkRMRlZCUVZVc1EwRkJRVHREUVVOc1JEczdRVUZGUkN4VFFVRlRMRTlCUVU4c1IwRkJSenRCUVVOcVFpeE5RVUZKTEcxQ1FVRk5MRVZCUVVVc1QwRkJUVHRCUVVOc1FpeFRRVUZQTEcxQ1FVRk5MRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVUU3UTBGRGVrSTdPMEZCUlVRc1NVRkJTU3hKUVVGSkxFZEJRVWNzUTBGRFZDeHhRMEZCY1VNc1JVRkRja01zTUVOQlFUQkRMRU5CUXpORExFTkJRVUU3TzBGQlJVUXNTVUZCU1N4VlFVRlZMRWRCUVVjc1EwRkRaaXhKUVVGSkxFVkJRVVVzVDBGQlR5eEZRVUZGTEd0Q1FVRnJRaXhGUVVGRkxGZEJRVmNzUlVGQlJTeFhRVUZYTEVWQlFVVXNUVUZCVFN4RlFVTnVSU3hUUVVGVExFVkJRVVVzVlVGQlZTeEZRVUZGTEd0Q1FVRnJRaXhGUVVGRkxFOUJRVThzUlVGQlJTeFJRVUZSTEVWQlF6VkVMSE5DUVVGelFpeEZRVUZGTEdOQlFXTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRVHM3UVVGRmFrUXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTzBGQlEzSkNMRmxCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVRTdRMEZEZWtJN08zRkNRVVZqT3p0QlFVVmlMRTFCUVVrc1JVRkJTaXhKUVVGSk8wRkJRMG9zVVVGQlRTeEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWxCUVVrc2MwSkJRVk1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UVVGRGNrUXNaVUZCWVN4RlFVRmlMR0ZCUVdFN1FVRkRZaXhOUVVGSkxFVkJRVW9zU1VGQlNUdEJRVU5LTEU5QlFVc3NSVUZCVEN4TFFVRkxPMEZCUTB3c1VVRkJUU3hGUVVGT0xFMUJRVTA3UVVGRFRpeE5RVUZKTEVWQlFVb3NTVUZCU1R0QlFVTktMRlZCUVZFc1JVRkJVaXhSUVVGUk8wRkJRMUlzVFVGQlNTeEZRVUZLTEVsQlFVazdRVUZEU2l4WlFVRlZMRVZCUVZZc1ZVRkJWVHRCUVVOV0xGTkJRVThzUlVGQlVDeFBRVUZQTzBGQlExQXNVVUZCVFN4RlFVRkZMRzFDUVVGTk8wRkJRMlFzWTBGQldTeEZRVUZGTEZWQlFWVTdRVUZEZUVJc2FVSkJRV1VzUlVGQlJTeERRVUZETEcxQ1FVRnRRaXhGUVVGRkxGbEJRVmtzUlVGQlJTeGxRVUZsTEVWQlFVVXNZMEZCWXl4RlFVRkZMRU5CUVVNc1dVRkJXU3hGUVVGRkxHbENRVUZwUWl4RFFVRkRMRU5CUVVNN1FVRkRlRWdzZFVKQlFYRkNMRVZCUVVVc1owSkJRV2RDTzBGQlEzWkRMRmxCUVZVc1JVRkJWaXhWUVVGVk8wRkJRMVlzV1VGQlZTeEZRVUZGTEVOQlFVTXNhMEpCUVd0Q0xFVkJRVVVzYTBKQlFXdENMRVZCUVVVc2EwSkJRV3RDTEVOQlFVTTdRVUZEZUVVc1owSkJRV01zUlVGQlJTeERRVUZETEdOQlFXTXNSVUZCUlN4alFVRmpMRVZCUVVVc1UwRkJVeXhGUVVGRkxGbEJRVmtzUTBGQlF6dEJRVU42UlN4aFFVRlhMRVZCUVVVc1VVRkJVU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVsQlFVa3NaMEpCUVdkQ08wTkJRM2hFSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SnBiWEJ2Y25RZ0oySmhZbVZzTDNCdmJIbG1hV3hzSjF4dWFXMXdiM0owSUdadmNtZGxJR1p5YjIwZ0oyWnZjbWRsSjF4dWFXMXdiM0owSUZOd1lYSnJUVVExSUdaeWIyMGdKM053WVhKckxXMWtOU2RjYm1sdGNHOXlkQ0J3Y21WbWN5Qm1jbTl0SUNjdUwzQnlaV1p6SjF4dVhHNXNaWFFnUmtWTVQwY2dQU0I3WEc0Z0lHdGxlVG9nSjJJek56STFNbVV6TURBeU1EUmlNREJoWkRZNU4yWmxNV1F6WWprM09XVXhKeXhjYmlBZ2NISnZhbVZqZERvZ0p6RTFKeXhjYmlBZ2NHbHVaMVJwYldWdmRYUTZJREV3SUNvZ05qQWdLaUF4TURBd1hHNTlYRzVjYm14bGRDQkhUa0ZTSUQwZ2UxeHVJQ0IxY213NklDZG9kSFJ3Y3pvdkwyZHVZWEl1WjNKaGJXMWhjbXg1TG1OdmJTY3NYRzRnSUhGaFZYSnNPaUFuYUhSMGNITTZMeTl4WVdkdVlYSXVaM0poYlcxaGNteDVMbU52YlNkY2JuMWNibHh1YkdWMElHMXdhMlY1SUQwZ0oyTXhNR1JrTmpSak9EZG1OekJsWmpVMU5qTmhOak5qTXpZNE56azNaVGhqSjF4dWJHVjBJRTFKV0ZCQlRrVk1JRDBnZTF4dUlDQnhZVXRsZVRvZ0p6ZGhOV001TldJMVkySmhNV0l5TWpWa01EQmpZek5pWVRGak5ERXdZemM0Snl4Y2JpQWdhMlY1T2lCdGNHdGxlU3hjYmlBZ1kyOXZhMmxsT2lCZ2JYQmZKSHR0Y0d0bGVYMWZiV2w0Y0dGdVpXeGdYRzU5WEc1Y2JtbG1JQ2doY0hKdlkyVnpjeTVsYm5ZdVVGSlBSQ2tnZTF4dUlDQkhUa0ZTTG5WeWJDQTlJRWRPUVZJdWNXRlZjbXhjYmx4dUlDQnNaWFFnYlhCclpYa2dQU0JOU1ZoUVFVNUZUQzV4WVV0bGVWeHVJQ0JOU1ZoUVFVNUZUQzVyWlhrZ1BTQnRjR3RsZVZ4dUlDQk5TVmhRUVU1RlRDNWpiMjlyYVdVZ1BTQmdiWEJmSkh0dGNHdGxlWDFmYldsNGNHRnVaV3hnWEc1OVhHNWNibXhsZENCVFZFRlVVME1nUFNCN1hHNGdJRlZTVERvZ0oyaDBkSEJ6T2k4dmMzUmhkSE10Y0hWaWJHbGpMbWR5WVcxdFlYSnNlUzVwYnk4bkxGeHVJQ0JRVWtWR1NWZzZJQ2RuY21GdGJXRnliSGt1ZFdrblhHNTlYRzVjYm14bGRDQkVRVkJKSUQwZ0oyaDBkSEJ6T2k4dlpHRjBZUzVuY21GdGJXRnliSGt1WTI5dEoxeHVYRzVzWlhRZ1lYQndJRDBnSjJoMGRIQnpPaTh2WVhCd0xtZHlZVzF0WVhKc2VTNWpiMjBuWEc1c1pYUWdZWFYwYUZWelpYSWdQU0FuYUhSMGNITTZMeTloZFhSb0xtZHlZVzF0WVhKc2VTNWpiMjB2ZFhObGNpZGNibXhsZENCM1pXeGpiMjFsUm1GdVpGTWdQU0FuYUhSMGNITTZMeTkzZDNjdVozSmhiVzFoY214NUxtTnZiUzloWm5SbGNsOXBibk4wWVd4c1gzQmhaMlVuWEc1c1pYUWdWVkpNVXlBOUlIdGNiaUFnWVhCd0xGeHVJQ0JqWVhCcE9pQW5kM056T2k4dlkyRndhUzVuY21GdGJXRnliSGt1WTI5dEwyWnlaV1YzY3ljc1hHNGdJR1JoY0dsTmFXMXBZem9nUkVGUVNTQXJJQ2N2WVhCcEwyMXBiV2xqSnl4Y2JpQWdaV1JwZEc5eU9pQmhjSEFnS3lBbkwzQnZjSFZ3TWljc1hHNGdJR1JwWTNScGIyNWhjbms2SUNkb2RIUndjem92TDJOaGNHa3VaM0poYlcxaGNteDVMbU52YlM5aGNHa3ZaR1ZtY3ljc1hHNGdJSFZ3WjNKaFpHVTZJQ2RvZEhSd2N6b3ZMM2QzZHk1bmNtRnRiV0Z5YkhrdVkyOXRMM1Z3WjNKaFpHVW5MRnh1SUNCaGRYUm9WWE5sY2l4Y2JpQWdZWFYwYUZObGRIUnBibWR6T2lCaGRYUm9WWE5sY2lBcklDY3ZjMlYwZEdsdVozTW5MRnh1SUNCaGRYUm9SM0p2ZFhBNklHRjFkR2hWYzJWeUlDc2dKeTluY205MWNDY3NYRzRnSUdGMWRHaFFhVzVuT2lCaGRYUm9WWE5sY2lBcklDY3ZjM2x1WXljc1hHNGdJR0YxZEdoRGNtVmhkR1ZCYm05dWVXMXZkWE02SUdGMWRHaFZjMlZ5SUNzZ0p5OWhibTl1ZVcxdmRYTW5MRnh1SUNCaGRYUm9RM0psWVhSbFVHRm5aVG9nSjJoMGRIQnpPaTh2WVhWMGFDNW5jbUZ0YldGeWJIa3VZMjl0TDNKbFpHbHlaV04wTFdGdWIyNTViVzkxY3o5c2IyTmhkR2x2YmowbklDc2dkMlZzWTI5dFpVWmhibVJUTEZ4dUlDQmtiMk56T2lCaGNIQWdLeUFuTDJSdlkzTW5MRnh1SUNCa2IyTnpRWEJwT2lBbmFIUjBjSE02THk5a2IzZ3VaM0poYlcxaGNteDVMbU52YlM5a2IyTjFiV1Z1ZEhNbkxGeHVJQ0J2Wm1ac2FXNWxPaUFuYUhSMGNITTZMeTlsWkM1bmNtRnRiV0Z5YkhrdVkyOXRMMlJ2ZDI1c2IyRmtMMlpwY21WbWIzZ3ZkWEJrWVhSbExtcHpiMjRuTEZ4dUlDQjNaV3hqYjIxbFF6b2dKMmgwZEhCek9pOHZkM2QzTG1keVlXMXRZWEpzZVM1amIyMHZaWGgwWlc1emFXOXVMWE4xWTJObGMzTW5MRnh1SUNCMWJtbHVjM1JoYkd3NklDZG9kSFJ3Y3pvdkwzZDNkeTVuY21GdGJXRnliSGt1WTI5dEwyVjRkR1Z1YzJsdmJpMTFibWx1YzNSaGJHd25MRnh1SUNCMWMyVnlUM0pCYm05dWVXMXZkWE02SUNkb2RIUndjem92TDJGMWRHZ3VaM0poYlcxaGNteDVMbU52YlM5MWMyVnlMMjl5WVc1dmJubHRiM1Z6Snl4Y2JpQWdZWFYwYUZOcFoyNXBiam9nSjJoMGRIQnpPaTh2WVhWMGFDNW5jbUZ0YldGeWJIa3VZMjl0TDJ4dloybHVKeXhjYmlBZ1lYVjBhRk5wWjI1MWNEb2dKMmgwZEhCek9pOHZZWFYwYUM1bmNtRnRiV0Z5YkhrdVkyOXRMM05wWjI1MWNDY3NYRzRnSUhOcFoyNXBiam9nSjJoMGRIQnpPaTh2ZDNkM0xtZHlZVzF0WVhKc2VTNWpiMjB2YzJsbmJtbHVKeXhjYmlBZ2MybG5iblZ3T2lBbmFIUjBjSE02THk5M2QzY3VaM0poYlcxaGNteDVMbU52YlM5emFXZHVkWEFuTEZ4dUlDQjNaV3hqYjIxbFJtRnVaRk1zWEc0Z0lISmhkbVZ1T2lBblptVnNiMmN1WjNKaGJXMWhjbXg1TG1sdkp5eGNiaUFnY21WbVpYSnlZV3c2SUNkb2RIUndjem92TDNkM2R5NW5jbUZ0YldGeWJIa3VZMjl0TDNKbFptVnljbUZzSnl4Y2JpQWdjR0ZuWlVOdmJtWnBaMVZ5YkRvZ0oyaDBkSEJ6T2k4dlpETmpkalJoT1dFNWQyZ3dZblF1WTJ4dmRXUm1jbTl1ZEM1dVpYUXZZbkp2ZDNObGNuQnNkV2RwYmk5amIyNW1hV2N1YW5OdmJpY3NYRzRnSUhKbGMyVjBVR0Z6YzNkdmNtUTZJQ2RvZEhSd2N6b3ZMM2QzZHk1bmNtRnRiV0Z5YkhrdVkyOXRMM0psYzJWMGNHRnpjM2R2Y21RbkxGeHVJQ0IwWlhKdGN6b2dKMmgwZEhCek9pOHZkM2QzTG1keVlXMXRZWEpzZVM1amIyMHZkR1Z5YlhNbkxGeHVJQ0J3YjJ4cFkzazZJQ2RvZEhSd2N6b3ZMM2QzZHk1bmNtRnRiV0Z5YkhrdVkyOXRMM0J5YVhaaFkza3RjRzlzYVdONUoxeHVmVnh1WEc1amIyNXpkQ0IxY214TFpYbHpJRDBnVDJKcVpXTjBMbXRsZVhNb1ZWSk1VeWxjYm1OdmJuTjBJSEJyWlhrZ1BTQnJaWGtnUFQ0Z1lGVlNURk11Skh0clpYbDlZRnh1WEc1d2NtVm1jeTVuWlhRb2RYSnNTMlY1Y3k1dFlYQW9jR3RsZVNrc0lISmxjM1ZzZENBOVBseHVJQ0IxY214TFpYbHpYRzRnSUNBZ0xtWnBiSFJsY2loMWNtd2dQVDRnY21WemRXeDBXM0JyWlhrb2RYSnNLVjBwWEc0Z0lDQWdMbVp2Y2tWaFkyZ29kWEpzSUQwK0lGVlNURk5iZFhKc1hTQTlJSEpsYzNWc2RGdHdhMlY1S0hWeWJDbGRLVnh1S1Z4dVhHNW1kVzVqZEdsdmJpQm5aWFJXWlhKemFXOXVLQ2tnZTF4dUlDQnBaaUFvSVdadmNtZGxLU0J5WlhSMWNtNWNiaUFnY21WMGRYSnVJR1p2Y21kbExtTnZibVpwWnk1dGIyUjFiR1Z6TG5CaGNtRnRaWFJsY25NdWRtVnljMmx2Ymx4dWZWeHVYRzVtZFc1amRHbHZiaUJuWlhSVmNHUmhkR1ZVYVcxbEtDa2dlMXh1SUNCcFppQW9JV1p2Y21kbEtTQnlaWFIxY201Y2JpQWdjbVYwZFhKdUlHWnZjbWRsTG1OdmJtWnBaeTV0YjJSMWJHVnpMbkJoY21GdFpYUmxjbk11ZFhCa1lYUmxWR2x0WlZ4dWZWeHVYRzVtZFc1amRHbHZiaUJuWlhSVmRXbGtLQ2tnZTF4dUlDQnBaaUFvSVdadmNtZGxLU0J5WlhSMWNtNWNiaUFnY21WMGRYSnVJR1p2Y21kbExtTnZibVpwWnk1MWRXbGtYRzU5WEc1Y2JteGxkQ0J1WlhkeklEMGdXMXh1SUNBblVHOXdMWFZ3SUdWa2FYUnZjaUJ1YjNjZ2IzQmxibk1nYVcxdFpXUnBZWFJsYkhrbkxGeHVJQ0FuV1c5MUlHMWhlU0JrYVhOaFlteGxJR1JsWm1sdWFYUnBiMjV6SUc5dUlHRnNiQ0J6YVhSbGN5ZGNibDFjYmx4dWJHVjBJSFZ6WlhKR2FXVnNaSE1nUFNCYlhHNGdJQ2RwWkNjc0lDZGxiV0ZwYkNjc0lDZHpkV0p6WTNKcGNIUnBiMjVHY21WbEp5d2dKMlpwY25OMFRtRnRaU2NzSUNkaGJtOXVlVzF2ZFhNbkxDQW5kSGx3WlNjc1hHNGdJQ2R3Y21WdGFYVnRKeXdnSjNObGRIUnBibWR6Snl3Z0ozSmxaMmx6ZEhKaGRHbHZia1JoZEdVbkxDQW5iV2x0YVdNbkxDQW5aM0p2ZFhCekp5eGNiaUFnSjJWNGRHVnVjMmx2YmtsdWMzUmhiR3hFWVhSbEp5d2dKMlpwZUdWa1gyVnljbTl5Y3ljc0lDZGxlSFF5SjExY2JseHVhV1lnS0NGd2NtOWpaWE56TG1WdWRpNVFVazlFS1NCN1hHNGdJSFZ6WlhKR2FXVnNaSE11Y0hWemFDZ25kRzlyWlc0bktWeHVmVnh1WEc1bGVIQnZjblFnWkdWbVlYVnNkQ0I3WEc0Z0lDOHZJR1JsWW5Wbk9pQjBjblZsTEZ4dUlDQnVaWGR6TEZ4dUlDQnVaWGR6U1dRNklHNWxkM011YkdWdVozUm9JQ1ltSUZOd1lYSnJUVVExTG1oaGMyZ29ibVYzY3k1cWIybHVLQ2RjWEc0bktTa3NYRzRnSUdkbGRGVndaR0YwWlZScGJXVXNYRzRnSUZWU1RGTXNYRzRnSUVaRlRFOUhMRnh1SUNCVFZFRlVVME1zWEc0Z0lFUkJVRWtzWEc0Z0lFMUpXRkJCVGtWTUxGeHVJQ0JIVGtGU0xGeHVJQ0JuWlhSV1pYSnphVzl1TEZ4dUlDQm5aWFJWZFdsa0xGeHVJQ0JwYzFSbGMzUTZJQ0ZtYjNKblpTeGNiaUFnYm1WNGRGWmxja05zWVhOek9pQW5aM0pmZG1WeVh6SW5MRnh1SUNCeVpYTjBjbWxqZEdWa1FYUjBjbk02SUZzblpHRjBZUzFuY21GdGJWOWxaR2wwYjNJbkxDQW5aR0YwWVMxbmNtRnRiU2NzSUNka1lYUmhMV2R5WVcxdFgybGtKeXdnSjJkeVlXMXRYMlZrYVhSdmNpY3NJRnNuWVhKcFlTMXNZV0psYkNjc0lDZFRaV0Z5WTJnZ1JtRmpaV0p2YjJzblhWMHNYRzRnSUhKbGMzUnlhV04wWldSUVlYSmxiblJCZEhSeWN6b2dKMXRrWVhSaExYSmxZV04wYVdSZEp5eGNiaUFnZFhObGNrWnBaV3hrY3l4Y2JpQWdaWGgwTW1keWIzVndjem9nV3ljd01ERmZaMkoxZEhSdmJsOXphRzkzSnl3Z0p6QXdNbDluWW5WMGRHOXVYM05vYjNjbkxDQW5NREF6WDJkaWRYUjBiMjVmYzJodmR5ZGRMRnh1SUNCbGVIUmxjbTVoYkVWMlpXNTBjem9nV3lkamFHRnVaMlZrTFhWelpYSW5MQ0FuWTJoaGJtZGxaQzF3YkdGdUp5d2dKMk5zWldGdWRYQW5MQ0FuWldScGRHOXlMV1pwZUNkZExGeHVJQ0JrWlhabGJHOXdiV1Z1ZERvZ1pHOWpkVzFsYm5RdWJHOWpZWFJwYjI0dWFHOXpkQ0E5UFNBbk1USTNMakF1TUM0eE9qTXhNVGNuWEc1OVhHNGlYWDA9IiwiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nXG5pbXBvcnQge2lzRkYsIF9mLCBndWlkfSBmcm9tICcuL3V0aWwnXG5cblxuZnVuY3Rpb24gY3JlYXRlRWwoaHRtbCwgZG9jKSB7XG4gIGxldCBkaXYgPSAoZG9jIHx8IGRvY3VtZW50KS5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBkaXYuaW5uZXJIVE1MID0gaHRtbC50cmltKClcbiAgcmV0dXJuIGRpdi5maXJzdEVsZW1lbnRDaGlsZFxufVxuXG5mdW5jdGlvbiByZW5kZXJSZWFjdFdpdGhQYXJlbnQocmVhY3RFbGVtZW50LCBwYXJlbnQsIGlkLCB0eXBlID0gJ2RpdicpIHtcbiAgbGV0IHJlYWN0ID0gcGFyZW50W2lkXSB8fCB7fVxuICBwYXJlbnRbaWRdID0gcmVhY3RcbiAgaWYgKCFyZWFjdC5lbCkge1xuICAgIHJlYWN0LmVsID0gcGFyZW50Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKVxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChyZWFjdC5lbClcbiAgfVxuICBsZXQgY29tcG9uZW50ID0gUmVhY3RET00ucmVuZGVyKFxuICAgIHJlYWN0RWxlbWVudCxcbiAgICByZWFjdC5lbFxuICApXG5cbiAgaWYgKCFyZWFjdC5yZW1vdmUpIHtcbiAgICByZWFjdC5yZW1vdmUgPSAoKSA9PiB7XG4gICAgICBkZWxldGUgcGFyZW50W2lkXVxuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHJlYWN0LmVsKVxuICAgICAgUmVhY3RET00udW5tb3VudENvbXBvbmVudEF0Tm9kZShyZWFjdC5lbClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBjb21wb25lbnQsXG4gICAgcmVtb3ZlOiByZWFjdC5yZW1vdmUsXG4gICAgZWw6IHJlYWN0LmVsXG4gIH1cbn1cblxuZnVuY3Rpb24gaW5FbChlbCwgdGFyZ2V0LCBkZWVwID0gMTAwMCkge1xuICBsZXQgaSA9IDBcbiAgd2hpbGUgKGVsLnBhcmVudE5vZGUgJiYgaSA8IGRlZXApIHtcbiAgICBpZiAoICEodHlwZW9mIHRhcmdldCA9PSAnc3RyaW5nJykgJiYgdGFyZ2V0ID09IGVsICkgcmV0dXJuIHRydWVcbiAgICBpZiAoZWwuaWQgPT0gdGFyZ2V0IHx8IGVsID09IHRhcmdldCkgcmV0dXJuIHRydWVcbiAgICBlbCA9IGVsLnBhcmVudE5vZGVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gaGFzQ2xhc3MoX2VsLCBjbHMpIHtcbiAgaWYgKCFfZWwgfHwgX2VsLmNsYXNzTmFtZSA9PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZVxuICByZXR1cm4gX2VsLmNsYXNzTGlzdC5jb250YWlucyhjbHMpXG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNsYXNzKF9lbCwgY2xzKSB7XG4gIGlmICghX2VsIHx8ICFfZWwuY2xhc3NMaXN0KSByZXR1cm5cbiAgcmV0dXJuIF9lbC5jbGFzc0xpc3QucmVtb3ZlKGNscylcbn1cblxuZnVuY3Rpb24gYWRkQ2xhc3MoX2VsLCBjbHMpIHtcbiAgaWYgKCFfZWwpIHJldHVyblxuICBpZiAoY2xzLmluZGV4T2YoJyAnKSAhPSAtMSkge1xuICAgIGNscyA9IGNscy5zcGxpdCgnICcpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIF9lbC5jbGFzc0xpc3QuYWRkKGNsc1tpXSlcbiAgICB9XG4gICAgcmV0dXJuXG4gIH1cbiAgcmV0dXJuIF9lbC5jbGFzc0xpc3QuYWRkKGNscylcbn1cblxuZnVuY3Rpb24gdG9nZ2xlQ2xhc3MoZWwsIGZsYWcsIGNscykge1xuICBpZiAoZmxhZykge1xuICAgIGFkZENsYXNzKGVsLCBjbHMpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmVtb3ZlQ2xhc3MoZWwsIGNscylcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYXJlbnRCeVNlbChlbCwgc2VsKSB7XG4gIHdoaWxlIChlbCA9IGVsLnBhcmVudE5vZGUpIHtcbiAgICBpZiAobWF0Y2hlc1NlbGVjdG9yKGVsLCBzZWwpKSByZXR1cm4gZWxcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gcGFyZW50SXNDb250ZW50RWRpdGFibGUoZWwpIHtcbiAgd2hpbGUgKGVsID0gZWwucGFyZW50Tm9kZSkge1xuICAgIGlmIChpc0NvbnRlbnRFZGl0YWJsZShlbCkpIHJldHVybiBlbFxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBpc0NvbnRlbnRFZGl0YWJsZShlbCkge1xuICByZXR1cm4gZWwuY29udGVudEVkaXRhYmxlID09ICd0cnVlJyB8fCBlbC5jb250ZW50RWRpdGFibGUgPT0gJ3BsYWludGV4dC1vbmx5J1xufVxuXG5mdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IoZWwsIHNlbCkge1xuICBpZiAoZWwubWF0Y2hlcykgcmV0dXJuIGVsLm1hdGNoZXMoc2VsKVxuICBpZiAoZWwubWF0Y2hlc1NlbGVjdG9yKSByZXR1cm4gZWwubWF0Y2hlc1NlbGVjdG9yKHNlbClcbiAgaWYgKGVsLndlYmtpdE1hdGNoZXNTZWxlY3RvcikgcmV0dXJuIGVsLndlYmtpdE1hdGNoZXNTZWxlY3RvcihzZWwpXG4gIGlmIChlbC5tb3pNYXRjaGVzU2VsZWN0b3IpIHJldHVybiBlbC5tb3pNYXRjaGVzU2VsZWN0b3Ioc2VsKVxuICBpZiAod2luZG93LiQgJiYgd2luZG93LiQuaXMpIHJldHVybiB3aW5kb3cuJChlbCkuaXMoc2VsKVxufVxuXG5mdW5jdGlvbiBpc0ZvY3VzZWQoZWwpIHtcbiAgaWYgKGlzRkYoKSkgcmV0dXJuIGVsLm93bmVyRG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PSBlbFxuXG4gIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQudGFnTmFtZSA9PSAnSUZSQU1FJykge1xuICAgIHJldHVybiBlbCA9PT0gZWwub3duZXJEb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gIH1cbiAgZWxzZSBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LnRhZ05hbWUgPT0gJ0JPRFknKSB7XG4gICAgcmV0dXJuIGVsID09PSBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gIH1cbiAgcmV0dXJuIGVsID09PSBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG59XG5cblxubGV0IGxLZXkgPSBndWlkKCkvL1N5bWJvbCgnbGlzdGVuZXJzJykgc2FmYXJpIHRlc3RzIHd0ZlxuZnVuY3Rpb24gbGlzdGVuKGVsLCBldmVudCwgY2IsIHVuYmluZCwgYnViYmxlID0gZmFsc2UpIHtcbiAgaWYgKCFlbCkgcmV0dXJuXG4gIGlmIChfLmlzT2JqZWN0KGV2ZW50KSkge1xuICAgIHJldHVybiBfLmVhY2goZXZlbnQsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBsaXN0ZW4oZWwsIGtleSwgdmFsdWUsIHVuYmluZClcbiAgICB9KS8vYXJncyBzaGlmdFxuICB9XG5cbiAgbGV0IGZ1bmMgPSB1bmJpbmQgPyAncmVtb3ZlRXZlbnRMaXN0ZW5lcicgOiAnYWRkRXZlbnRMaXN0ZW5lcidcbiAgbGV0IGxpc3RlbmVycyA9IGVsW2xLZXldIHx8IFtdXG4gIGVsW2xLZXldID0gbGlzdGVuZXJzXG4gIGlmICh1bmJpbmQpIHtcbiAgICBlbFtsS2V5XSA9IGxpc3RlbmVycy5maWx0ZXIobCA9PiAhKGwuZXZlbnQgPT0gZXZlbnQgJiYgbC5jYiA9PSBjYikpXG4gIH1cbiAgZWxzZSB7XG4gICAgbGlzdGVuZXJzLnB1c2goe2V2ZW50LCBjYn0pXG4gIH1cblxuICBlbFtmdW5jXShldmVudCwgY2IsIGJ1YmJsZSlcblxuICBpZiAoIXByb2Nlc3MuZW52LlBST0QpIHtcbiAgICAvL21lY2hhbmlzbSBmb3IgZmlyaW5nIGN1c3RvbSBldmVudHNcbiAgICBjYi5fX3dyYXBGdW5jID0gY2IuX193cmFwRnVuYyB8fCBmdW5jdGlvbihlKSB7XG4gICAgICBlID0gZSB8fCB7fVxuICAgICAgY2IoXy5leHRlbmQoe29yaWdpbmFsRXZlbnQ6IGUsIHByZXZlbnREZWZhdWx0OiBfZiwgc3RvcFByb3BhZ2F0aW9uOiBfZn0sIGUuZGV0YWlsKSlcbiAgICB9XG4gICAgZWxbZnVuY10oZXZlbnQgKyAnLWdyJywgY2IuX193cmFwRnVuYywgYnViYmxlKVxuICB9XG5cbiAgcmV0dXJuIHtlbCwgZXZlbnQsIGNiLCBidWJibGV9XG59XG5cbmZ1bmN0aW9uIHVubGlzdGVuKGVsLCBldmVudCwgY2IsIGJ1YmJsZSkge1xuICBpZiAoIWV2ZW50ICYmIGVsW2xLZXldKSB7XG4gICAgcmV0dXJuIGVsW2xLZXldLmVhY2gobCA9PiB1bmxpc3RlbihlbCwgbC5ldmVudCwgbC5jYiwgbC5idWJibGUpKVxuICB9XG4gIGxpc3RlbihlbCwgZXZlbnQsIGNiLCB0cnVlLCBidWJibGUpXG59XG5cbmZ1bmN0aW9uIG9uKC4uLmFyZ3MpIHtcbiAgdGhpcy5hZGRFdmVudExpc3RlbmVyKC4uLmFyZ3MpXG4gIHJldHVybiB7b2ZmOiAoKSA9PiB0aGlzOjpvZmYoLi4uYXJncyl9XG59XG5cbmZ1bmN0aW9uIG9mZiguLi5hcmdzKSB7XG4gIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciguLi5hcmdzKVxufVxuXG5mdW5jdGlvbiBvbmNlKGV2ZW50LCBjYikge1xuICBsZXQgZG9uZSA9IGUgPT4ge1xuICAgIGNiKGUpXG4gICAgdGhpczo6b2ZmKGV2ZW50LCBkb25lKVxuICB9XG4gIHRoaXM6Om9uKGV2ZW50LCBkb25lKVxufVxuXG5mdW5jdGlvbiBpc1Zpc2libGUoZWwpIHtcbiAgbGV0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCwgbnVsbCksXG4gICAgdmlzaWJsZSA9IHN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2Rpc3BsYXknKSAhPSAnbm9uZScgJiZcbiAgICAgIHN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3Zpc2liaWxpdHknKSAhPSAnaGlkZGVuJyAmJlxuICAgICAgKGVsLmNsaWVudEhlaWdodCA+IDApXG4gIHJldHVybiB2aXNpYmxlXG59XG5cbmZ1bmN0aW9uIGNzKG5hbWVzLCBjbHNQcm9jZXNzb3IgPSAoY2xzKSA9PiBjbHMpIHtcbiAgcmV0dXJuIF8ua2V5cyhuYW1lcylcbiAgICAuZmlsdGVyKGNscyA9PiBuYW1lc1tjbHNdKVxuICAgIC5tYXAoY2xzID0+IGNsc1Byb2Nlc3NvcihjbHMpKVxuICAgIC5qb2luKCcgJylcbn1cblxuXG5mdW5jdGlvbiBtYXliZUFkZFB4KG5hbWUsIHZhbHVlKSB7XG4gIHJldHVybiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmICFjc3NOdW1iZXJbZGFzaGVyaXplKG5hbWUpXSkgPyB2YWx1ZSArICdweCcgOiB2YWx1ZVxufVxuXG5mdW5jdGlvbiBjYW1lbGl6ZShzdHIpIHsgcmV0dXJuIHN0ci5yZXBsYWNlKC8tKyguKT8vZywgZnVuY3Rpb24obWF0Y2gsIGNocikgeyByZXR1cm4gY2hyID8gY2hyLnRvVXBwZXJDYXNlKCkgOiAnJyB9KSB9XG5cbmZ1bmN0aW9uIGNhbWVsaXplQXR0cnMob2JqKSB7XG4gIHJldHVybiBfLnRyYW5zZm9ybShvYmosIChyZXN1bHQsIHZhbHVlLCBrZXkpID0+IHJlc3VsdFtjYW1lbGl6ZShrZXkpXSA9IHZhbHVlKVxufVxuZnVuY3Rpb24gZGFzaGVyaXplKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLzo6L2csICcvJylcbiAgIC5yZXBsYWNlKC8oW0EtWl0rKShbQS1aXVthLXpdKS9nLCAnJDFfJDInKVxuICAgLnJlcGxhY2UoLyhbYS16XFxkXSkoW0EtWl0pL2csICckMV8kMicpXG4gICAucmVwbGFjZSgvXy9nLCAnLScpXG4gICAudG9Mb3dlckNhc2UoKVxufVxuXG5sZXQgY3NzTnVtYmVyID0geyAnY29sdW1uLWNvdW50JzogMSwgJ2NvbHVtbnMnOiAxLCAnZm9udC13ZWlnaHQnOiAxLCAnbGluZS1oZWlnaHQnOiAxLCAnb3BhY2l0eSc6IDEsICd6LWluZGV4JzogMSwgJ3pvb20nOiAxIH1cbmZ1bmN0aW9uIGNzcyhlbCwgcHJvcGVydHksIHZhbHVlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgIGxldCBlbGVtZW50ID0gZWxcbiAgICBpZiAoIWVsZW1lbnQpIHJldHVyblxuICAgIGxldCBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCAnJylcbiAgICBpZiAodHlwZW9mIHByb3BlcnR5ID09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZWxlbWVudC5zdHlsZVtjYW1lbGl6ZShwcm9wZXJ0eSldIHx8IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSlcbiAgICB9XG4gICAgZWxzZSBpZiAoXy5pc0FycmF5KHByb3BlcnR5KSkge1xuICAgICAgbGV0IHByb3BzID0ge31cbiAgICAgIF8uZWFjaChwcm9wZXJ0eSwgZnVuY3Rpb24odmFsLCBwcm9wKSB7XG4gICAgICAgIHByb3BzW2NhbWVsaXplKHZhbCldID0gKGVsZW1lbnQuc3R5bGVbY2FtZWxpemUodmFsKV0gfHwgY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKHZhbCkpXG4gICAgICB9KVxuICAgICAgcmV0dXJuIHByb3BzXG4gICAgfVxuICB9XG5cbiAgbGV0IHJlc3VsdCA9ICcnXG4gIGlmIChfLmlzU3RyaW5nKHByb3BlcnR5KSkge1xuICAgIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApIHtcbiAgICAgIGVsLnN0eWxlLnJlbW92ZVByb3BlcnR5KGRhc2hlcml6ZShwcm9wZXJ0eSkpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmVzdWx0ID0gZGFzaGVyaXplKHByb3BlcnR5KSArICc6JyArIG1heWJlQWRkUHgocHJvcGVydHksIHZhbHVlKVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKGxldCBrZXkgaW4gcHJvcGVydHkpIHtcbiAgICAgIGlmICghcHJvcGVydHlba2V5XSAmJiBwcm9wZXJ0eVtrZXldICE9PSAwKSB7XG4gICAgICAgIGVsLnN0eWxlLnJlbW92ZVByb3BlcnR5KGRhc2hlcml6ZShrZXkpKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJlc3VsdCArPSBkYXNoZXJpemUoa2V5KSArICc6JyArIG1heWJlQWRkUHgoa2V5LCBwcm9wZXJ0eVtrZXldKSArICc7J1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlbC5zdHlsZS5jc3NUZXh0ICs9ICc7JyArIHJlc3VsdFxufVxuXG5cbmZ1bmN0aW9uIGdldFBhcmVudEJ5VGFnKGVsLCB0YWcpIHtcbiAgd2hpbGUgKGVsID0gZWwucGFyZW50Tm9kZSkge1xuICAgIGlmIChlbC50YWdOYW1lID09IHRhZykgcmV0dXJuIGVsXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudEJ5RGF0YShlbCwga2V5LCB2YWwpIHtcbiAgd2hpbGUgKGVsID0gZWwucGFyZW50Tm9kZSkge1xuICAgIGlmIChlbC5kYXRhc2V0ICYmIGVsLmRhdGFzZXRba2V5XSAmJiBlbC5kYXRhc2V0W2tleV0gPT0gdmFsKSByZXR1cm4gZWxcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlRWwoZWwsIGNscykge1xuICBpZiAoaGFzQ2xhc3MoZWwsIGNscykpIHJldHVybiBlbFxuICByZXR1cm4gZ2V0UGFyZW50KGVsLCBjbHMpXG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudChlbCwgY2xzKSB7XG4gIHdoaWxlIChlbCA9IGVsLnBhcmVudE5vZGUpIHtcbiAgICBpZiAoaGFzQ2xhc3MoZWwsIGNscykpIHJldHVybiBlbFxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBwYXJlbnRIYXNDbGFzcyhlbCwgY2xzKSB7XG4gIGlmICghZWwpIHJldHVybiBmYWxzZVxuICB3aGlsZSAoZWwucGFyZW50Tm9kZSkge1xuICAgIGlmIChoYXNDbGFzcyhlbCwgY2xzKSkgcmV0dXJuIGVsXG4gICAgZWwgPSBlbC5wYXJlbnROb2RlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudEJ5RGVwdGgoZGVwdGggPSAxKSB7XG4gIHJldHVybiAhZGVwdGggPyB0aGlzIDogdGhpcy5wYXJlbnROb2RlOjpnZXRQYXJlbnRCeURlcHRoKC0tZGVwdGgpXG59XG5cbmZ1bmN0aW9uIGlzUGFyZW50KGVsLCBwYXJlbnQpIHtcbiAgaWYgKCFlbCkgcmV0dXJuIGZhbHNlXG4gIHdoaWxlIChlbC5wYXJlbnROb2RlKSB7XG4gICAgaWYgKHBhcmVudCA9PSBlbC5wYXJlbnROb2RlKSByZXR1cm4gZWxcbiAgICBlbCA9IGVsLnBhcmVudE5vZGVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gaW5zZXJ0QWZ0ZXIobmV3RWxlbWVudCwgdGFyZ2V0RWxlbWVudCkge1xuICAvL3RhcmdldCBpcyB3aGF0IHlvdSB3YW50IGl0IHRvIGdvIGFmdGVyLiBMb29rIGZvciB0aGlzIGVsZW1lbnRzIHBhcmVudC5cbiAgbGV0IHBhcmVudCA9IHRhcmdldEVsZW1lbnQucGFyZW50Tm9kZVxuXG4gIC8vaWYgdGhlIHBhcmVudHMgbGFzdENoaWxkIGlzIHRoZSB0YXJnZXRFbGVtZW50Li4uXG4gIGlmIChwYXJlbnQubGFzdENoaWxkID09IHRhcmdldEVsZW1lbnQpIHtcbiAgICAvL2FkZCB0aGUgbmV3RWxlbWVudCBhZnRlciB0aGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKG5ld0VsZW1lbnQpXG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gZWxzZSB0aGUgdGFyZ2V0IGhhcyBzaWJsaW5ncywgaW5zZXJ0IHRoZSBuZXcgZWxlbWVudCBiZXR3ZWVuIHRoZSB0YXJnZXQgYW5kIGl0J3MgbmV4dCBzaWJsaW5nLlxuICAgIHBhcmVudC5pbnNlcnRCZWZvcmUobmV3RWxlbWVudCwgdGFyZ2V0RWxlbWVudC5uZXh0U2libGluZylcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnNlcnRCZWZvcmUobmV3RWxlbWVudCwgdGFyZ2V0RWxlbWVudCkge1xuICB0YXJnZXRFbGVtZW50LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld0VsZW1lbnQsIHRhcmdldEVsZW1lbnQpXG59XG5cbmZ1bmN0aW9uIGVsZW1lbnRJbkRvY3VtZW50KGVsZW1lbnQsIGRvYykge1xuICBkb2MgPSBkb2MgfHwgZG9jdW1lbnRcbiAgd2hpbGUgKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudCA9PSBkb2MpIHJldHVybiB0cnVlXG4gICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBydW5LZXlFdmVudChlKSB7XG4gIGxldCBldnRcbiAgbGV0IGRlZmF1bHRFdmVudCA9IHtcbiAgICBjdHJsOiBmYWxzZSxcbiAgICBtZXRhOiBmYWxzZSxcbiAgICBzaGlmdDogZmFsc2UsXG4gICAgYWx0OiBmYWxzZVxuICB9XG4gIGUgPSBfLmV4dGVuZChkZWZhdWx0RXZlbnQsIGUpXG4gIC8vY29uc29sZS5sb2coJ2V2ZW50JywgZSlcbiAgdHJ5IHtcbiAgICBldnQgPSBlLmVsLm93bmVyRG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0tleUV2ZW50cycpXG4gICAgZXZ0LmluaXRLZXlFdmVudChcbiAgICAgIGUudHlwZSwgICAgICAgICAgICAgICAvLyBpbiBET01TdHJpbmcgdHlwZUFyZyxcbiAgICAgIHRydWUsICAgICAgICAgICAgICAgICAvLyBpbiBib29sZWFuIGNhbkJ1YmJsZUFyZyxcbiAgICAgIHRydWUsICAgICAgICAgICAgICAgICAgLy8gaW4gYm9vbGVhbiBjYW5jZWxhYmxlQXJnLFxuICAgICAgZS5lbC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3LCAgICAgICAgICAgICAgICAgIC8vIGluIG5zSURPTUFic3RyYWN0VmlldyB2aWV3QXJnLCB3aW5kb3dcbiAgICAgIGUuY3RybCwgICAgICAgICAgICAgICAgIC8vIGluIGJvb2xlYW4gY3RybEtleUFyZyxcbiAgICAgIGUuYWx0LCAgICAgICAgICAgICAgICAgLy8gaW4gYm9vbGVhbiBhbHRLZXlBcmcsXG4gICAgICBlLnNoaWZ0LCAgICAgICAgICAgICAgICAgLy8gaW4gYm9vbGVhbiBzaGlmdEtleUFyZyxcbiAgICAgIGUubWV0YSwgICAgICAgICAgICAgICAgIC8vIGluIGJvb2xlYW4gbWV0YUtleUFyZyxcbiAgICAgIGUua2V5Q29kZSwgICAgICAgICAgICAgICAgICAvLyBrZXkgY29kZVxuICAgICAgZS5rZXlDb2RlKSAgICAgICAgICAgIC8vIGNoYXIgY29kZS5cbiAgfVxuICBjYXRjaCAoZXJyKSB7XG4gICAgZXZ0ID0gZS5lbC5vd25lckRvY3VtZW50LmNyZWF0ZUV2ZW50KCdVSUV2ZW50cycpXG4gICAgZXZ0LmluaXRVSUV2ZW50KCBlLm5hbWUsIHRydWUsIHRydWUsIHdpbmRvdywgMSlcbiAgICBldnQua2V5Q29kZSA9IGUua2V5Q29kZVxuICAgIGV2dC53aGljaCA9IGUua2V5Q29kZVxuICAgIGV2dC5jaGFyQ29kZSA9IGUua2V5Q29kZVxuICAgIGV2dC5jdHJsS2V5ID0gZS5jdHJsXG4gICAgZXZ0LmFsdEtleSA9IGUuYWx0XG4gICAgZXZ0LnNoaWZ0S2V5ID0gZS5zaGlmdFxuICAgIGV2dC5tZXRhS2V5ID0gZS5tZXRhS2V5XG4gIH1cblxuICBlLmVsLmRpc3BhdGNoRXZlbnQoZXZ0KVxufVxuXG5mdW5jdGlvbiBkb2NIaWRkZW4oZG9jKSB7XG4gIGlmICh0eXBlb2YgZG9jLmhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiBkb2MuaGlkZGVuXG4gIGlmICh0eXBlb2YgZG9jLm1vekhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiBkb2MubW96SGlkZGVuXG4gIGlmICh0eXBlb2YgZG9jLndlYmtpdEhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiBkb2Mud2Via2l0SGlkZGVuXG4gIGlmICh0eXBlb2YgZG9jLm1zSGlkZGVuICE9PSAndW5kZWZpbmVkJykgcmV0dXJuIGRvYy5tc0hpZGRlblxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gdmlzaWJpbGl0eUV2ZW50KGRvYykge1xuICBpZiAodHlwZW9mIGRvYy5oaWRkZW4gIT09ICd1bmRlZmluZWQnKSByZXR1cm4gJ3Zpc2liaWxpdHljaGFuZ2UnXG4gIGlmICh0eXBlb2YgZG9jLm1vekhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAnbW96dmlzaWJpbGl0eWNoYW5nZSdcbiAgaWYgKHR5cGVvZiBkb2Mud2Via2l0SGlkZGVuICE9PSAndW5kZWZpbmVkJykgcmV0dXJuICd3ZWJraXR2aXNpYmlsaXR5Y2hhbmdlJ1xuICBpZiAodHlwZW9mIGRvYy5tc0hpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAnbXN2aXNpYmlsaXR5Y2hhbmdlJ1xuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtUHJvcChkb2MgPSBkb2N1bWVudCkge1xuICBpZiAodHlwZW9mIGRvYy5ib2R5LnN0eWxlLnRyYW5zZm9ybSAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAndHJhbnNmb3JtJ1xuICBpZiAodHlwZW9mIGRvYy5ib2R5LnN0eWxlLldlYmtpdFRyYW5zZm9ybSAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAnV2Via2l0VHJhbnNmb3JtJ1xuICBpZiAodHlwZW9mIGRvYy5ib2R5LnN0eWxlLk1velRyYW5zZm9ybSAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAnTW96VHJhbnNmb3JtJ1xufVxuXG4vKlxuICBlbCwgJ3dpZHRoJywgJ2hlaWdodCdcbiovXG5mdW5jdGlvbiBjb21wU3R5bGUoZWwsIC4uLnByb3BzKSB7XG4gIGlmICghZWwpIHJldHVyblxuICBsZXQgZG9jID0gZWwub3duZXJEb2N1bWVudFxuICBpZiAoIWRvYykgcmV0dXJuXG4gIGxldCB3aW4gPSBkb2MuZGVmYXVsdFZpZXcgfHwgd2luZG93XG4gIGlmICghd2luKSByZXR1cm5cbiAgbGV0IHMgPSB3aW4uZ2V0Q29tcHV0ZWRTdHlsZShlbCwgbnVsbClcbiAgaWYgKCFzKSByZXR1cm5cblxuICBpZiAocHJvcHMubGVuZ3RoID09IDEpIHJldHVybiBzLmdldFByb3BlcnR5VmFsdWUocHJvcHNbMF0pXG5cbiAgcmV0dXJuIHByb3BzLnJlZHVjZSgocmVzdWx0LCBwcm9wKSA9PiAoey4uLnJlc3VsdCwgW3Byb3BdOiBzLmdldFByb3BlcnR5VmFsdWUocHJvcCl9KSwge30pXG59XG5cbmZ1bmN0aW9uIGNsYXNzU2VsZWN0b3IoY2xzKSB7XG4gIHJldHVybiBjbHMuc3BsaXQoJyAnKS5tYXAoYyA9PiBjWzBdICE9ICcuJyA/ICcuJyArIGMgOiBjKS5qb2luKCcnKS50cmltKClcbn1cblxuZnVuY3Rpb24gc2VsZWN0b3JBbGwoY2xzLCAuLi5jbGFzc2VzKSB7XG4gIGlmIChjbGFzc2VzLmxlbmd0aCA+IDApIHtcbiAgICBsZXQgcmVzdWx0ID0gW11cbiAgICByZXN1bHQucHVzaChzZWxlY3RvckFsbChjbHMpKVxuICAgIGNsYXNzZXMuZm9yRWFjaChjID0+IHJlc3VsdC5wdXNoKHNlbGVjdG9yQWxsKGMpKSlcbiAgICByZXR1cm4gcmVzdWx0LmpvaW4oJywgJylcbiAgfVxuICAvL2NoZWNrIGRvdHNcbiAgY2xzID0gY2xzLnNwbGl0KCcsICcpLm1hcChjID0+IGNbMF0gIT0gJy4nID8gJy4nICsgYyA6IGMpLmpvaW4oJywgJykudHJpbSgpXG4gIHJldHVybiBgJHtjbHN9XFwsICR7Y2xzfSAqYFxufVxuXG5cbmZ1bmN0aW9uIG5vZGVJblRyZWUodHJlZSwgbm9kZSkge1xuICBpZiAobm9kZSA9PSB0cmVlKSByZXR1cm4gdHJ1ZVxuICBpZiAoIXRyZWUuY2hpbGRyZW4pIHJldHVybiBmYWxzZVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRyZWUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAobm9kZUluVHJlZSh0cmVlLmNoaWxkcmVuW2ldLCBub2RlKSkgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuXG5mdW5jdGlvbiB3YXRjaE5vZGVSZW1vdmUobm9kZSwgY2IpIHtcbiAgbGV0IGNhbGxiYWNrID0gZnVuY3Rpb24obXV0YXRpb25zKSB7XG4gICAgbXV0YXRpb25zLm1hcChmdW5jdGlvbihtcikge1xuICAgICAgaWYgKG1yLnJlbW92ZWROb2Rlcy5sZW5ndGggPT0gMCkgcmV0dXJuXG4gICAgICBsZXQgbm9kZXMgPSBtci5yZW1vdmVkTm9kZXMsXG4gICAgICAgIGxlbiA9IG5vZGVzLmxlbmd0aFxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBsZXQgdHJlZSA9IG5vZGVzW2ldXG4gICAgICAgIGlmICgodHJlZS5jb250YWlucyAmJiB0cmVlLmNvbnRhaW5zKG5vZGUpKSB8fCBub2RlSW5UcmVlKHRyZWUsIG5vZGUpKSB7XG4gICAgICAgICAgbW8uZGlzY29ubmVjdCgpXG4gICAgICAgICAgY2IoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfSxcbiAgbW8gPSBuZXcgTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjaylcblxuICBtby5vYnNlcnZlKG5vZGUub3duZXJEb2N1bWVudC5ib2R5LCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZX0pXG59XG5cbmZ1bmN0aW9uIHdoaWNoQW5pbWF0aW9uRW5kRXZlbnQoKSB7XG4gIGxldCB0LFxuICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZmFrZWVsZW1lbnQnKSxcbiAgICB0cmFuc2l0aW9ucyA9IHtcbiAgICAgICdhbmltYXRpb24nOiAnYW5pbWF0aW9uZW5kJyxcbiAgICAgICdNb3pBbmltYXRpb24nOiAnYW5pbWF0aW9uZW5kJyxcbiAgICAgICdXZWJraXRBbmltYXRpb24nOiAnd2Via2l0QW5pbWF0aW9uRW5kJ1xuICAgIH1cblxuICBmb3IgKHQgaW4gdHJhbnNpdGlvbnMpIHtcbiAgICBpZiAoZWwuc3R5bGVbdF0gIT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdHJhbnNpdGlvbnNbdF1cbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25FbmRFdmVudE5hbWUgKCkge1xuICBsZXQgaSwgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmYWtlZWxlbWVudCcpLFxuICAgIHRyYW5zaXRpb25zID0ge1xuICAgICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnTW96VHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnXG4gICAgfVxuXG4gIGZvciAoaSBpbiB0cmFuc2l0aW9ucykge1xuICAgIGlmICh0cmFuc2l0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSAmJiBlbC5zdHlsZVtpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdHJhbnNpdGlvbnNbaV1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkSWZyYW1lQ3NzKGZyYW1lRG9jKSB7XG4gIGlmICh0eXBlb2YgR1JfSU5MSU5FX1NUWUxFUyA9PSAndW5kZWZpbmVkJykgcmV0dXJuXG5cbiAgbGV0IHN0eWxlID0gZnJhbWVEb2MuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAvKmVzbGludC1kaXNhYmxlKi9cbiAgc3R5bGUuaW5uZXJIVE1MID0gR1JfSU5MSU5FX1NUWUxFU1xuICAvKmVzbGludC1lbmFibGUqL1xuICB0cnkge1xuICAgIGZyYW1lRG9jLnF1ZXJ5U2VsZWN0b3IoJ2hlYWQnKS5hcHBlbmRDaGlsZChzdHlsZSlcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgY29uc29sZS5sb2coJ2NhblxcJ3QgYXBwZW5kIHN0eWxlJywgZSlcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRHUkF0dHJpYnV0ZXMoZWwsIGlkKSB7XG4gIGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1ncmFtbV9pZCcsIGlkKVxuICBlbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZ3JhbW0nLCB0cnVlKVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGlzVmlzaWJsZSxcbiAgY3JlYXRlRWwsXG4gIHJlbmRlclJlYWN0V2l0aFBhcmVudCxcbiAgaW5FbCxcbiAgaGFzQ2xhc3MsXG4gIGFkZENsYXNzLFxuICByZW1vdmVDbGFzcyxcbiAgdG9nZ2xlQ2xhc3MsXG4gIG1hdGNoZXNTZWxlY3RvcixcbiAgZ2V0UGFyZW50QnlTZWwsXG4gIGdldFBhcmVudEJ5RGF0YSxcbiAgZ2V0UGFyZW50QnlEZXB0aCxcbiAgcGFyZW50SXNDb250ZW50RWRpdGFibGUsXG4gIGlzQ29udGVudEVkaXRhYmxlLFxuICBpc0ZvY3VzZWQsXG4gIGxpc3RlbixcbiAgdW5saXN0ZW4sXG4gIG9uLCBvZmYsIG9uY2UsXG4gIGNzcyxcbiAgYWRkSWZyYW1lQ3NzLFxuICBzZXRHUkF0dHJpYnV0ZXMsXG4gIGNvbXBTdHlsZSxcbiAgY2FtZWxpemUsXG4gIGNhbWVsaXplQXR0cnMsXG4gIGluc2VydEJlZm9yZSxcbiAgaW5zZXJ0QWZ0ZXIsXG4gIGVsZW1lbnRJbkRvY3VtZW50LFxuICBnZXRQYXJlbnRCeVRhZyxcbiAgcGFyZW50SGFzQ2xhc3MsXG4gIGlzUGFyZW50LFxuICByZXNvbHZlRWwsXG4gIGdldFBhcmVudCxcbiAgcnVuS2V5RXZlbnQsXG4gIGRvY0hpZGRlbixcbiAgdmlzaWJpbGl0eUV2ZW50LFxuICB0cmFuc2Zvcm1Qcm9wLFxuICBjcyxcbiAgc2VsZWN0b3JBbGwsXG4gIGNsYXNzU2VsZWN0b3IsXG4gIHdhdGNoTm9kZVJlbW92ZSxcbiAgd2hpY2hBbmltYXRpb25FbmRFdmVudCxcbiAgdHJhbnNpdGlvbkVuZEV2ZW50TmFtZVxufVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Wydmb3JnZSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnZm9yZ2UnXSA6IG51bGwpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJaTl3Y205cVpXTjBMM055WXk5cWN5OXNhV0l2Wm05eVoyVXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanM3T3pzN08zRkNRVUZsTEU5QlFVOHNRMEZCUXl4UFFVRlBMRU5CUVVNaUxDSm1hV3hsSWpvaVoyVnVaWEpoZEdWa0xtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJbVY0Y0c5eWRDQmtaV1poZFd4MElISmxjWFZwY21Vb0oyWnZjbWRsSnlsY2JpSmRmUT09IiwiaW1wb3J0IG1lc3NhZ2UgZnJvbSAnLi9tZXNzYWdlJ1xuaW1wb3J0IGZvcmdlIGZyb20gJy4vZm9yZ2UnXG5pbXBvcnQge2lzRnVuY3Rpb24sIGlzQmdPclBvcHVwLCBkZWxheX0gZnJvbSAnLi91dGlsJ1xuXG5cbmZ1bmN0aW9uIGN1cnJlbnRVcmwoKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICBsZXQgcmV0cnkgPSBzZXRUaW1lb3V0KCgpID0+IGZvcmdlLnRhYnMuZ2V0Q3VycmVudFRhYlVybChyZXNvbHZlKSwgMjAwMClcbiAgICBmb3JnZS50YWJzLmdldEN1cnJlbnRUYWJVcmwodXJsID0+IHtcbiAgICAgIGNsZWFyVGltZW91dChyZXRyeSlcbiAgICAgIHJlc29sdmUodXJsKVxuICAgIH0pXG4gIH0pXG59XG5cblxuZnVuY3Rpb24gZ2V0RG9tYWluKGVsLCBjYikge1xuICBpZiAoaXNGdW5jdGlvbihlbCkpIHtcbiAgICBjYiA9IGVsXG4gICAgZWwgPSAnJ1xuICB9XG5cbiAgaWYgKGNiKSB7XG4gICAgaWYgKCFpc0JnT3JQb3B1cCgpICYmIGZvcmdlKSB7XG4gICAgICBtZXNzYWdlLmVtaXRCYWNrZ3JvdW5kKCdnZXQtZG9tYWluJywge30sIGNiKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChmb3JnZSAmJiBmb3JnZS50YWJzKSB7XG4gICAgICBjdXJyZW50VXJsKCkudGhlbih1cmwgPT4gY2IoZG9tYWluRnJvbVVybCh1cmwpKSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjYihkb21haW5Gcm9tRWwoZWwpKVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuXG4gIHJldHVybiBkb21haW5Gcm9tRWwoZWwpXG59XG5cbmZ1bmN0aW9uIHByb21pc2VHZXREb21haW4oZWwpIHtcbiAgaWYgKCFpc0JnT3JQb3B1cCgpICYmIGZvcmdlKSB7XG4gICAgcmV0dXJuIG1lc3NhZ2UucHJvbWlzZUJhY2tncm91bmQoJ2dldC1kb21haW4nKVxuICB9XG5cbiAgaWYgKGZvcmdlICYmIGZvcmdlLnRhYnMpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yYWNlKFtcbiAgICAgIGN1cnJlbnRVcmwoKS50aGVuKGRvbWFpbkZyb21VcmwpLFxuICAgICAgZGVsYXkoMTAwMDApLnRoZW4oKCkgPT4ge3Rocm93IG5ldyBFcnJvcignUmVxdWVzdCB0byBmb3JnZS50YWJzLmdldEN1cnJlbnRUYWJVcmwgcmVqZWN0ZWQgYnkgdGltZW91dCcpfSlcbiAgICBdKVxuICB9XG5cbiAgcmV0dXJuIGRvbWFpbkZyb21FbChlbClcbn1cblxuZnVuY3Rpb24gZG9tYWluRnJvbUVsKGVsKSB7XG4gIGxldCBkb2MgPSAoZWwgJiYgZWwub3duZXJEb2N1bWVudCkgfHwgZG9jdW1lbnRcbiAgbGV0IGxvY2F0aW9uID0gZG9jLmxvY2F0aW9uIHx8IGRvYy5kZWZhdWx0Vmlldy5sb2NhdGlvblxuICBpZiAoIWxvY2F0aW9uKSByZXR1cm4gJydcblxuICByZXR1cm4gc3RyaXBEb21haW4obG9jYXRpb24uaG9zdG5hbWUpXG59XG5cbmZ1bmN0aW9uIGRvbWFpbkZyb21VcmwodXJsKSB7XG4gIGxldCBsb2NhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxuICBsb2NhdGlvbi5ocmVmID0gdXJsXG4gIHJldHVybiBzdHJpcERvbWFpbihsb2NhdGlvbi5ob3N0bmFtZSlcbn1cblxuZnVuY3Rpb24gc3RyaXBEb21haW4oZG9tYWluKSB7XG4gIHJldHVybiBkb21haW4ucmVwbGFjZSgnd3d3LicsICcnKVxufVxuXG5mdW5jdGlvbiBnZXRVcmwoZWwpIHtcbiAgbGV0IGRvYyA9IChlbCAmJiBlbC5vd25lckRvY3VtZW50KSB8fCBkb2N1bWVudFxuICBsZXQgbG9jYXRpb24gPSBkb2MubG9jYXRpb24gfHwgZG9jLmRlZmF1bHRWaWV3LmxvY2F0aW9uXG4gIGlmICghbG9jYXRpb24pIHJldHVybiAnJ1xuXG4gIHJldHVybiBsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaFxufVxuXG5mdW5jdGlvbiBnZXRGYXZpY29uKCkge1xuICBsZXQgaXNBYnNvbHV0ZSA9IG5ldyBSZWdFeHAoJ14oPzpbYS16XSs6KT8vLycsICdpJylcbiAgbGV0IGZhdmljb24gPSAnJ1xuICBsZXQgbGlua3MgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbGluaycpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgbGluayA9IGxpbmtzW2ldXG4gICAgbGV0IHJlbCA9ICdcIicgKyBsaW5rLmdldEF0dHJpYnV0ZSgncmVsJykgKyAnXCInXG4gICAgbGV0IHJlZ2V4cCA9IC8oXFxcImljb24gKXwoIGljb25cXFwiKXwoXFxcImljb25cXFwiKXwoIGljb24gKS9pXG4gICAgaWYgKHJlbC5zZWFyY2gocmVnZXhwKSAhPSAtMSkge1xuICAgICAgZmF2aWNvbiA9IGxpbmsuZ2V0QXR0cmlidXRlKCdocmVmJylcbiAgICB9XG4gIH1cbiAgaWYgKCFmYXZpY29uKSB7XG4gICAgZmF2aWNvbiA9ICdmYXZpY29uLmljbydcbiAgfVxuICBpZiAoaXNBYnNvbHV0ZS50ZXN0KGZhdmljb24pKSB7XG4gICAgcmV0dXJuIGZhdmljb25cbiAgfVxuICBpZiAoZmF2aWNvblswXSAhPSAnLycpIHtcbiAgICByZXR1cm4gJy8vJyArIGRvY3VtZW50LmxvY2F0aW9uLmhvc3QgKyBkb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZSArIGZhdmljb25cbiAgfVxuICByZXR1cm4gJy8vJyArIGRvY3VtZW50LmxvY2F0aW9uLmhvc3QgKyBmYXZpY29uXG59XG5cblxuZXhwb3J0IGRlZmF1bHQge1xuICBnZXREb21haW4sXG4gIGN1cnJlbnRVcmwsXG4gIHByb21pc2VHZXREb21haW4sXG4gIGRvbWFpbkZyb21VcmwsXG4gIGdldEZhdmljb24sXG4gIGdldFVybFxufVxuIiwiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IGVtaXR0ZXIgZnJvbSAnZW1pdHRlcidcbmltcG9ydCBmb3JnZSBmcm9tICcuL2ZvcmdlJ1xuaW1wb3J0IHtkZWxheX0gZnJvbSAnLi91dGlsJ1xuXG5cbmxldCBlcnJvckVtaXR0ZXIgPSBlbWl0dGVyKHt9KVxubGV0IExpc3RlbmVycyA9IHt9XG5cblxuZnVuY3Rpb24gb25lKHR5cGUsIGNiKSB7XG4gIG9uKHR5cGUsIF9jYilcblxuICBmdW5jdGlvbiBfY2IoLi4uZGF0YSkge1xuICAgIG9mZih0eXBlLCBfY2IpXG4gICAgY2IuYXBwbHkodGhpcywgZGF0YSlcbiAgfVxufVxuXG5mdW5jdGlvbiBvbih0eXBlLCBjYWxsYmFjaywgZXJyb3IsIF9pc0JnKSB7XG4gIC8vdHlwZSAnX19iZ2Vycm9yJyBoYW5kbGVkIGJ5IGVycm9yRW1pdHRlclxuICBpZiAodHlwZSA9PSAnX19iZ2Vycm9yJykge1xuICAgIHJldHVybiBlcnJvckVtaXR0ZXIub24oJ19fYmdlcnJvcicsIGNhbGxiYWNrKVxuICB9XG5cbiAgbGV0IGxpc3RlbmVycyA9IExpc3RlbmVyc1t0eXBlXSA9IExpc3RlbmVyc1t0eXBlXSB8fCBbXVxuXG4gIGlmICghbGlzdGVuZXJzLmxlbmd0aCkge1xuICAgIHRyeSB7XG4gICAgICBmb3JnZS5tZXNzYWdlLmxpc3Rlbih0eXBlLCAoZGF0YSwgY2IpID0+IHtcbiAgICAgICAgZm9yIChsZXQgbCBvZiBsaXN0ZW5lcnMpIGwoZGF0YSwgY2IpXG4gICAgICB9LCBlcnJvciwgX2lzQmcpXG4gICAgfVxuICAgIGNhdGNoKGUpIHtcbiAgICAgIGVtaXRFcnJvcihlKVxuICAgIH1cbiAgfVxuXG4gIGxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKVxufVxuXG5mdW5jdGlvbiBvZmYodHlwZSwgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGUgPT0gJ19fYmdlcnJvcicpIHtcbiAgICByZXR1cm4gZXJyb3JFbWl0dGVyLm9mZignX19iZ2Vycm9yJywgY2FsbGJhY2spXG4gIH1cblxuICBsZXQgbGlzdGVuZXJzID0gTGlzdGVuZXJzW3R5cGVdXG4gIGlmICghbGlzdGVuZXJzKSByZXR1cm5cbiAgbGV0IGkgPSBsaXN0ZW5lcnMuaW5kZXhPZihjYWxsYmFjaylcbiAgaWYgKGkgIT0gLTEpIGxpc3RlbmVycy5zcGxpY2UoaSwgMSlcbiAgaWYgKGxpc3RlbmVycy5sZW5ndGggPT0gMCkgZGVsZXRlIExpc3RlbmVyc1t0eXBlXVxufVxuXG5mdW5jdGlvbiBlbWl0VGFicyh0eXBlLCBjb250ZW50ID0ge30sIGNhbGxiYWNrLCBlcnJvcikge1xuICB0cnkge1xuICAgIGZvcmdlLm1lc3NhZ2UuYnJvYWRjYXN0KHR5cGUsIGNvbnRlbnQsIGNhbGxiYWNrLCBlcnJvcilcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgZW1pdEVycm9yKGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gZW1pdEZvY3VzZWRUYWIodHlwZSwgY29udGVudCwgY2FsbGJhY2ssIGVycm9yKSB7XG4gIC8vZm9jdXNzZWQgd3RmPyBodHRwOi8vd3d3LmZ1dHVyZS1wZXJmZWN0LmNvLnVrL2dyYW1tYXItdGlwL2lzLWl0LWZvY3Vzc2VkLW9yLWZvY3VzZWQvXG4gIHRyeSB7XG4gICAgZm9yZ2UubWVzc2FnZS50b0ZvY3Vzc2VkKHR5cGUsIGNvbnRlbnQsIGNhbGxiYWNrLCBlcnJvcilcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgZW1pdEVycm9yKGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gZW1pdEJhY2tncm91bmQodHlwZSwgY29udGVudCwgY2FsbGJhY2ssIGVycm9yKSB7XG4gIHRyeSB7XG4gICAgZm9yZ2UubWVzc2FnZS5icm9hZGNhc3RCYWNrZ3JvdW5kKHR5cGUsIGNvbnRlbnQsIGNhbGxiYWNrLCBlcnJvcilcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgZW1pdEVycm9yKGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvbWlzZUJhY2tncm91bmQobWVzc2FnZSwgZGF0YSA9IHt9LCB0aW1lb3V0ID0gMTAwMDApIHtcbiAgbGV0IHJlcXVlc3QgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGZvcmdlLm1lc3NhZ2UuYnJvYWRjYXN0QmFja2dyb3VuZChtZXNzYWdlLCBkYXRhLCByZXNvbHZlLCByZWplY3QpXG4gICAgfVxuICAgIGNhdGNoKGUpIHtcbiAgICAgIHJlamVjdChlKVxuICAgICAgZW1pdEVycm9yKGUpXG4gICAgfVxuICB9KVxuXG4gIHJldHVybiBQcm9taXNlLnJhY2UoW1xuICAgIHJlcXVlc3QsXG4gICAgZGVsYXkodGltZW91dCkudGhlbigoKSA9PiB7dGhyb3cgbmV3IEVycm9yKGBSZXF1ZXN0IHRvIGJnIHBhZ2UgKCR7bWVzc2FnZX0pIHJlamVjdGVkIGJ5IHRpbWVvdXRgKX0pXG4gIF0pXG59XG5cbmxldCBlbWl0RXJyb3IgPSBfLnRocm90dGxlKGUgPT4gZXJyb3JFbWl0dGVyLmVtaXQoJ19fYmdlcnJvcicsIGUpLCAxMDAwKVxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgb24sXG4gIG9uZSxcbiAgb2ZmLFxuICBlbWl0RXJyb3IsXG4gIGVtaXRUYWJzLFxuICBlbWl0Rm9jdXNlZFRhYixcbiAgZW1pdEJhY2tncm91bmQsXG4gIHByb21pc2VCYWNrZ3JvdW5kXG59XG4iLCJpbXBvcnQge1NJVEVTX1RPX1JFTE9BRH0gZnJvbSAnLi9kZWZhdWx0cydcbmltcG9ydCB7Z2V0VXJsfSBmcm9tICcuLi9sb2NhdGlvbidcblxuY2xhc3MgQ29uZmlnQmFzZSB7XG4gIGluaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMubG9hZCgpXG4gIH1cblxuICBjaGVja0RvbWFpbihkb21haW4sIHVybCkge1xuICAgIGxldCBjb25maWcgPSB0aGlzLmdldFBhZ2VDb25maWcoZG9tYWluLCB1cmwpXG4gICAgcmV0dXJuIGNvbmZpZyA/IGNvbmZpZy5lbmFibGVkICE9PSBmYWxzZSA6IHRydWVcbiAgfVxuXG4gIGdldENvbmZpZ0J5UGFnZShwYWdlcywgdXJsID0gZ2V0VXJsKCkpIHtcbiAgICBpZiAoIXBhZ2VzKSByZXR1cm5cblxuICAgIGNvbnN0IGZpbmRVcmwgPSBPYmplY3Qua2V5cyhwYWdlcykuZmluZChwYWdlID0+IG5ldyBSZWdFeHAocGFnZSkudGVzdCh1cmwpKVxuXG4gICAgcmV0dXJuIHBhZ2VzW2ZpbmRVcmxdXG4gIH1cblxuICBnZXRQYWdlQ29uZmlnKGRvbWFpbiwgdXJsKSB7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWcucGFnZUNvbmZpZ1tkb21haW5dIHx8XG4gICAgICB0aGlzLmNvbmZpZy5wYXJ0aWFscy5maW5kKGNvbmYgPT4gZG9tYWluLmluY2x1ZGVzKGNvbmYuZG9tYWluKSlcblxuICAgIGlmICghY29uZmlnIHx8IGNvbmZpZy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuIGNvbmZpZ1xuXG4gICAgaWYgKGNvbmZpZy5wYWdlcykgcmV0dXJuIHRoaXMuZ2V0Q29uZmlnQnlQYWdlKGNvbmZpZy5wYWdlcywgdXJsKSB8fCBjb25maWdcblxuICAgIHJldHVybiBjb25maWdcbiAgfVxuXG4gIGlzUGFnZVRvUmVsb2FkKHVybCkge1xuICAgIHJldHVybiBTSVRFU19UT19SRUxPQUQuaW5jbHVkZXModXJsKVxuICB9XG5cbiAgZ2V0IGNvbmZpZygpIHtcbiAgICByZXR1cm4gdGhpcy5fY29uZmlnXG4gIH1cblxuICBzZXQgY29uZmlnKGNvbmZpZykge1xuICAgIGlmICghY29uZmlnKSBjb25maWcgPSAoe3BhZ2VDb25maWc6IHt9LCBwYXJ0aWFsczogW119KVxuICAgIGlmICghY29uZmlnLnBhZ2VDb25maWcpIGNvbmZpZy5wYWdlQ29uZmlnID0ge31cbiAgICBpZiAoIWNvbmZpZy5wYXJ0aWFscykgY29uZmlnLnBhcnRpYWxzID0gW11cblxuICAgIHRoaXMuX2NvbmZpZyA9IGNvbmZpZ1xuICB9XG5cbiAgZ2V0Q3VycmVudFRpbWVzdGFtcCgpIHtcbiAgICByZXR1cm4gK25ldyBEYXRlKClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb25maWdCYXNlXG4iLCJpbXBvcnQgbG9jYWxmb3JhZ2UgZnJvbSAnLi9sb2NhbGZvcmFnZSdcbmltcG9ydCB7ZmV0Y2h9IGZyb20gJy4uL3JlcXVlc3QnXG5pbXBvcnQge1VSTFN9IGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7aXNWYWxpZCwgaW50ZXJ2YWx9IGZyb20gJy4vdXRpbHMnXG5pbXBvcnQge2RlbGF5fSBmcm9tICcuLi91dGlsJ1xuaW1wb3J0IENvbmZpZ0Jhc2UgZnJvbSAnLi9jb25maWctYmFzZSdcbmltcG9ydCB7ZGVjb3JhdGVDb25maWd9IGZyb20gJy4vZGVjb3JhdG9yJ1xuaW1wb3J0IHtjYWxsfSBmcm9tICcuLi90cmFja2luZy9pbmRleCdcbmltcG9ydCB7aXNTa2lwQ29uZmlnfSBmcm9tICcuL2RlZmF1bHRzJ1xuXG5jb25zdCBTWU5DX1RJTUVPVVQgPSAxNTAwXG5jb25zdCBBSkFYX1RJTUVPVVQgPSAxNTAwMFxuY29uc3QgQ09ORklHX01JU1NFRF9FUlJPUiA9ICdDb25maWcgbWlzc2VkJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25maWdCZyBleHRlbmRzIENvbmZpZ0Jhc2Uge1xuICBzZXQgY29uZmlnKGNvbmZpZyA9IHt9KSB7XG4gICAgdGhpcy5fY29uZmlnID0gZGVjb3JhdGVDb25maWcoY29uZmlnKVxuICB9XG5cbiAgZ2V0IGNvbmZpZygpIHtcbiAgICByZXR1cm4gdGhpcy5fY29uZmlnXG4gIH1cblxuICAvKlxuICAgKiBNZXRob2QgdG8gbG9hZCBhY3R1YWwgY29uZmlnIGZpbGVcbiAgICpcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIDEuIEZpcnN0IGF0dGVtcHQgdG8gdXBkYXRlIEpTT04gZnJvbSBDRE4gaWYgaXQncyB0aW1lXG4gICAqIDIuIElmIG5vIHVwZGF0ZSBuZWVkZWQgb3IgQ0ROIGVycm9yIGNoZWNrIGlmIGl0J3MgY2FjaGVkIGluIG1lbW9yeVxuICAgKiAzLiBJZiBub3RoaW5nIGluIG1lbW9yeSAtIGxvYWQgY29uZmlnIGZyb20gbG9jYWwgc3RvcmFnZVxuICAgKi9cbiAgYXN5bmMgbG9hZChub3VwZGF0ZSA9IGZhbHNlKSB7XG4gICAgaWYgKGlzU2tpcENvbmZpZygpKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1VzZSBkZWZhdWx0IGNvbmZpZyBpbiBERUJVRyBtb2RlIChza2lwQ29uZmlnPXRydWUpJylcbiAgICAgIHRoaXMuY29uZmlnID0ge31cbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZ1xuICAgIH1cblxuICAgIGxldCByYXdDb25maWdcblxuICAgIGlmICghbm91cGRhdGUpIHtcbiAgICAgIGxldCB7ZGF0ZSwgaW50ZXJ2YWw6IHVwZGF0ZUludGVydmFsfSA9IGF3YWl0IHRoaXMubGFzdFVwZGF0ZSgpXG5cbiAgICAgIGlmIChkYXRlICsgdXBkYXRlSW50ZXJ2YWwgPCBuZXcgRGF0ZSgpKSB7XG4gICAgICAgIGNvbnNvbGUuaW5mbygnQ29uZmlnOiBHb2luZyB0byB1cGRhdGUgY29uZmlnIGZyb20gQ0ROLi4uJylcbiAgICAgICAgcmF3Q29uZmlnID0gYXdhaXQgdGhpcy51cGRhdGVGcm9tQ0ROKClcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZXQgbWludXRlc1RvVXBkYXRlID0gKGRhdGUgKyB1cGRhdGVJbnRlcnZhbCAtIG5ldyBEYXRlKCkpIC8gMTAwMCAvIDYwXG4gICAgICAgIGNvbnNvbGUuaW5mbygnQ29uZmlnOiBObyB1cGRhdGUgbmVlZGVkLiBUaW1lIHRvIG5leHQgdXBkYXRlOiAnLCBtaW51dGVzVG9VcGRhdGUpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc29sZS5pbmZvKCdDb25maWc6IFNraXAgQ0ROIHVwZGF0ZScpXG4gICAgfVxuXG4gICAgaWYgKCFyYXdDb25maWcgJiYgdGhpcy5jb25maWcpIHtcbiAgICAgIGNvbnNvbGUuaW5mbygnQ29uZmlnOiBVc2UgY29uZmlnIGZyb20gbWVtb3J5JywgdGhpcy5jb25maWcpXG4gICAgICByZXR1cm4gdGhpcy5jb25maWdcbiAgICB9XG5cbiAgICBpZiAoIXJhd0NvbmZpZykge1xuICAgICAgY29uc29sZS5pbmZvKCdDb25maWc6IExvYWRpbmcgZnJvbSBsb2NhbCBzdG9yYWdlLi4uJylcbiAgICAgIHJhd0NvbmZpZyA9IGF3YWl0IHRoaXMubG9hZEZyb21TdG9yYWdlKClcbiAgICB9XG5cbiAgICB0aGlzLmNvbmZpZyA9IHJhd0NvbmZpZ1xuXG4gICAgcmV0dXJuIHRoaXMuY29uZmlnXG4gIH1cblxuICAvKlxuICAgKiBVcGRhdGUgY29uZmlnIGZyb20gQ0ROXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBSZXR1cm4gdW5kZWZpbmVkIGJ5IHRpbWVvdXQsIGJ1dCBET04nVCBhYm9ydCBhamF4XG4gICAqIHRvIGFsbG93IGJhY2tncm91bmQgdXBkYXRlIGZvciBndXlzIHdpdGggc2xvdyBjb25uZWN0aW9uXG4gICAqL1xuICBhc3luYyB1cGRhdGVGcm9tQ0ROKCkge1xuICAgIGxldCBjb25maWdcblxuICAgIHRyeSB7XG4gICAgICBjb25maWcgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICB0aGlzLmxvYWRGcm9tQ0ROKCksXG4gICAgICAgIGRlbGF5KFNZTkNfVElNRU9VVCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCB3YWl0IGFueSBtb3JlIGZvciBhamF4IHJlc3BvbnNlYClcbiAgICAgICAgfSlcbiAgICAgIF0pXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oZS5tZXNzYWdlKVxuICAgICAgY2FsbCgnc3RhdHNjLnVpLmluY3JlbWVudCcsICdzdGFiaWxpdHk6cGFnZV9jb25maWdfZmlyc3RfY2RuX3RpbWVvdXQnKVxuICAgICAgdGhpcy5zYXZlT25FcnJvcihgQ2FuJ3QgZ2V0IHZhbGlkIGNvbmZpZzogJHtlICYmIGUubWVzc2FnZX1gKVxuICAgIH1cblxuICAgIHJldHVybiBjb25maWdcbiAgfVxuXG4gIGFzeW5jIGxvYWRGcm9tQ0ROKCkge1xuICAgIGxldCBjb25maWdcblxuICAgIHRyeSB7XG4gICAgICBjYWxsKCdzdGF0c2MudWkuaW5jcmVtZW50JywgJ3N0YWJpbGl0eTpwYWdlX2NvbmZpZ19jZG5fdXBkYXRlJylcbiAgICAgIGNvbmZpZyA9IGF3YWl0IGZldGNoKFVSTFMucGFnZUNvbmZpZ1VybCwge3RpbWVvdXQ6IEFKQVhfVElNRU9VVH0pXG4gICAgICBpZiAoIWlzVmFsaWQoY29uZmlnKSkgdGhyb3cgbmV3IEVycm9yKCdDb25maWcgaXMgbm90IHZhbGlkJylcblxuICAgICAgdGhpcy5zYXZlKGNvbmZpZylcbiAgICAgIHJldHVybiBjb25maWdcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIGNhbGwoJ2ZlbG9nLmVycm9yJywgJ3BhZ2VfY29uZmlnX2Nkbl9sb2FkX2Vycm9yJywge21zZzogZSAmJiBlLm1lc3NhZ2V9KVxuICAgICAgdGhpcy5zYXZlT25FcnJvcihgQ2FuJ3QgZ2V0IHZhbGlkIGNvbmZpZzogJHtlICYmIGUubWVzc2FnZX1gLCBjb25maWcpXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgbG9hZEZyb21TdG9yYWdlKCkge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmF3Q29uZmlnID0gYXdhaXQgbG9jYWxmb3JhZ2UuZ2V0SXRlbSgnY29uZmlnJylcblxuICAgICAgaWYgKCFyYXdDb25maWcpIHRocm93IG5ldyBFcnJvcihDT05GSUdfTUlTU0VEX0VSUk9SKVxuICAgICAgaWYgKCFpc1ZhbGlkKHJhd0NvbmZpZykpIHRocm93IG5ldyBFcnJvcignQ29uZmlnIG1hbGZvcm1lZCcpXG5cbiAgICAgIHJldHVybiByYXdDb25maWdcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlICYmIG5ldyBSZWdFeHAoQ09ORklHX01JU1NFRF9FUlJPUikudGVzdChlLm1lc3NhZ2UpKSB7XG4gICAgICAgIGNhbGwoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCAnc3RhYmlsaXR5OnBhZ2VfY29uZmlnX21pc3NlZF9mcm9tX3N0b3JhZ2UnKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNhbGwoJ2ZlbG9nLmVycm9yJywgJ3BhZ2VfY29uZmlnX2xvY2FsX3N0b3JhZ2VfbG9hZF9lcnJvcicsIHttc2c6IGUgJiYgZS5tZXNzYWdlfSlcbiAgICAgIH1cblxuICAgICAgY29uc29sZS53YXJuKGBDYW5ub3QgZ2V0IHZhbGlkIHBhZ2UgY29uZmlnIGZyb20gc3RvcmFnZTogJHtlICYmIGUubWVzc2FnZX1gKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlKGNvbmZpZykge1xuICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ2NvbmZpZycsIGNvbmZpZylcbiAgICBhd2FpdCB0aGlzLmZpcmVWZXJzaW9uVXBkYXRlKGNvbmZpZy52ZXJzaW9uKVxuICAgIHRoaXMuc2V0TGFzdFVwZGF0ZSh7XG4gICAgICBkYXRlOiB0aGlzLmdldEN1cnJlbnRUaW1lc3RhbXAoKSxcbiAgICAgIGludGVydmFsOiBjb25maWcuaW50ZXJ2YWwsXG4gICAgICBwcm90b2NvbFZlcnNpb246IGNvbmZpZy5wcm90b2NvbFZlcnNpb24sXG4gICAgICB2ZXJzaW9uOiBjb25maWcudmVyc2lvbixcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnXG4gICAgfSlcbiAgICBjb25zb2xlLmluZm8oJ0NvbmZpZyB1cGRhdGVkIGFuZCBzYXZlZCB0byBsb2NhbCBzdG9yYWdlIHN1Y2Nlc3NmdWxseTonLCBjb25maWcudmVyc2lvbiwgY29uZmlnKVxuICB9XG5cbiAgYXN5bmMgc2F2ZU9uRXJyb3IoaW5mbywgY29uZmlnKSB7XG4gICAgY29uc29sZS53YXJuKGluZm8sIGNvbmZpZylcblxuICAgIGxldCBtZXRhID0gYXdhaXQgdGhpcy5sYXN0VXBkYXRlKClcbiAgICB0aGlzLnNldExhc3RVcGRhdGUoe1xuICAgICAgZGF0ZTogdGhpcy5nZXRDdXJyZW50VGltZXN0YW1wKCksXG4gICAgICBpbnRlcnZhbDogbWV0YS5pbnRlcnZhbCxcbiAgICAgIHByb3RvY29sVmVyc2lvbjogbWV0YS5wcm90b2NvbFZlcnNpb24sXG4gICAgICB2ZXJzaW9uOiBtZXRhLnZlcnNpb24sXG4gICAgICBzdGF0dXM6ICdmYWlsZWQnLFxuICAgICAgaW5mbzogaW5mb1xuICAgIH0pXG4gIH1cblxuICBhc3luYyBmaXJlVmVyc2lvblVwZGF0ZShuZXdWZXJzaW9uKSB7XG4gICAgbGV0IG1ldGEgPSBhd2FpdCB0aGlzLmxhc3RVcGRhdGUoKVxuICAgIGlmIChuZXdWZXJzaW9uICYmIG1ldGEudmVyc2lvbiAhPSBuZXdWZXJzaW9uKSB7XG4gICAgICBjYWxsKCdmZWxvZy5pbmZvJywgJ3BhZ2VfY29uZmlnX3VwZGF0ZWQnLCBuZXdWZXJzaW9uKVxuICAgIH1cbiAgfVxuXG4gIGxhc3RVcGRhdGVXaXRoRGVmYXVsdChjb25maWcgPSB7fSkge1xuICAgIHJldHVybiB7XG4gICAgICBkYXRlOiBjb25maWcuZGF0ZSB8fCAwLFxuICAgICAgaW50ZXJ2YWw6IGludGVydmFsKGNvbmZpZy5pbnRlcnZhbCksXG4gICAgICBwcm90b2NvbFZlcnNpb246IGNvbmZpZy5wcm90b2NvbFZlcnNpb24sXG4gICAgICBzdGF0dXM6IGNvbmZpZy5zdGF0dXMsXG4gICAgICBpbmZvOiBjb25maWcuaW5mb1xuICAgIH1cbiAgfVxuXG4gIHNldExhc3RVcGRhdGUoY29uZmlnID0ge30pIHtcbiAgICBjb25maWcgPSB0aGlzLmxhc3RVcGRhdGVXaXRoRGVmYXVsdChjb25maWcpXG4gICAgdGhpcy5fbGFzdFVwZGF0ZSA9IGNvbmZpZ1xuICAgIHJldHVybiBsb2NhbGZvcmFnZS5zZXRJdGVtKCdsYXN0Q29uZmlnVXBkYXRlJywgY29uZmlnKVxuICB9XG5cbiAgYXN5bmMgbGFzdFVwZGF0ZSgpIHtcbiAgICBpZiAoIXRoaXMuX2xhc3RVcGRhdGUpIHtcbiAgICAgIHRoaXMuX2xhc3RVcGRhdGUgPSBhd2FpdCBsb2NhbGZvcmFnZS5nZXRJdGVtKCdsYXN0Q29uZmlnVXBkYXRlJylcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5sYXN0VXBkYXRlV2l0aERlZmF1bHQodGhpcy5fbGFzdFVwZGF0ZSB8fCB7fSlcbiAgfVxufVxuIiwiaW1wb3J0IENvbmZpZ0Jhc2UgZnJvbSAnLi9jb25maWctYmFzZSdcbmltcG9ydCB7cHJvbWlzZUJhY2tncm91bmR9IGZyb20gJy4uL21lc3NhZ2UnXG5pbXBvcnQge2RlY29yYXRlQ29uZmlnfSBmcm9tICcuL2RlY29yYXRvcidcbmltcG9ydCB7Y2FsbH0gZnJvbSAnLi4vdHJhY2tpbmcvaW5kZXgnXG5pbXBvcnQge2RlbGF5LCBpc1BvcHVwfSBmcm9tICcuLi91dGlsJ1xuXG5jb25zdCBUSU1FT1VUID0gMTU1MCAvLyAxcyB0byBhc2sgQ0ROLCA1MG1zIC0ganNcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uZmlnUGFnZSBleHRlbmRzIENvbmZpZ0Jhc2Uge1xuXG4gIC8qXG4gICAqIExvYWQgY29uZmlndXJhdGlvbiBmcm9tIEJHIHBhZ2UuXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBQYXNzICdub3VwZGF0ZScgaW4gcG9wdXAgdG8gc2tpcCBDRE4uXG4gICAqIEZhbGxiYWNrIHRvIGRlZmF1bHQgaWYgbm8gdXBkYXRlIGluICdUSU1FT1VUJyBtc1xuICAgKi9cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5jb25maWcgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICBwcm9taXNlQmFja2dyb3VuZCgnZ2V0LXBhZ2UtY29uZmlnJywge25vdXBkYXRlOiBpc1BvcHVwKCl9KSxcbiAgICAgICAgZGVsYXkoVElNRU9VVCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZXF1ZXN0IHRvIEJHIHJlamVjdGVkIGJ5IHRpbWVvdXQnKVxuICAgICAgICB9KVxuICAgICAgXSlcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIGNhbGwoJ2ZlbG9nLmVycm9yJywgJ3BhZ2VfY29uZmlnX2xvYWRfZnJvbV9iZ19mYWlsJywge21zZzogZSAmJiBlLm1lc3NhZ2V9KVxuICAgICAgY29uc29sZS5lcnJvcignQ2Fubm90IGdldCBwYWdlIGNvbmZpZy4gRmFsbGJhY2sgdG8gZGVmYXVsdCcpXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbmZpZykge1xuICAgICAgdGhpcy5jb25maWcgPSBkZWNvcmF0ZUNvbmZpZyh7fSlcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7Z2V0VmVyc2lvbn0gZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IHtQQUdFX0NPTkZJR30gZnJvbSAnLi9kZWZhdWx0cydcbmltcG9ydCB7dmVyc2lvbkNvbXBhcmF0b3IsIGdldEJyb3dzZXJ9IGZyb20gJy4uL3V0aWwnXG5pbXBvcnQgZGVlcEV4dGVuZCBmcm9tICdkZWVwLWV4dGVuZCdcblxuZXhwb3J0IGZ1bmN0aW9uIGRlY29yYXRlQ29uZmlnKGNvbmZpZykge1xuICByZXR1cm4gUmF3Q29uZmlnRGVjb3JhdG9yLmRlY29yYXRlKGNvbmZpZylcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZXBDb3B5V2l0aERlZmF1bHQoY29uZmlnKSB7XG4gIGxldCBuZXdDb25maWcgPSBkZWVwRXh0ZW5kKHtwYWdlQ29uZmlnOiB7fX0sIGNvbmZpZyB8fCB7fSlcbiAgaWYgKCFuZXdDb25maWcucGFnZUNvbmZpZykgbmV3Q29uZmlnLnBhZ2VDb25maWcgPSB7fVxuICByZXR1cm4gbmV3Q29uZmlnXG59XG5cbmV4cG9ydCBjbGFzcyBSYXdDb25maWdEZWNvcmF0b3Ige1xuICBzdGF0aWMgZGVjb3JhdGUoY29uZmlnKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICd3aXRoRGVmYXVsdCcsXG4gICAgICAnZmlsdGVyQnlWZXJzaW9uJyxcbiAgICAgICdwYXJzZUJvb2xlYW5zJyxcbiAgICAgICdwYXJzZUJyb3dzZXJWYWx1ZXMnLFxuICAgICAgJ2ZpbHRlckludmFsaWRQYWdlUmVnZXhwJyxcbiAgICAgICdjb2xsZWN0UGFydGlhbHMnXG4gICAgXS5yZWR1Y2UoKGNvbmZpZywgbWV0aG9kKSA9PiB0aGlzW21ldGhvZF0oY29uZmlnKSwgY29uZmlnKVxuICB9XG5cbiAgc3RhdGljIHdpdGhEZWZhdWx0KGNvbmZpZykge1xuICAgIGNvbmZpZyA9IGRlZXBDb3B5V2l0aERlZmF1bHQoY29uZmlnKVxuICAgIGNvbnN0IGRlZmF1bHRDb25maWcgPSBQQUdFX0NPTkZJRyAmJiBQQUdFX0NPTkZJRy5wYWdlQ29uZmlnIHx8IHt9XG5cbiAgICBjb25maWcucGFnZUNvbmZpZyA9IGRlZXBFeHRlbmQoe30sIGRlZmF1bHRDb25maWcsIGNvbmZpZy5wYWdlQ29uZmlnKVxuXG4gICAgcmV0dXJuIGNvbmZpZ1xuICB9XG5cbiAgLypcbiAgICogRmlsdGVyIG91dCBydWxlcyB3aXRoIHZlcnNpb24gX2xlc3NfIHRoYW4gY3VycmVudCBleHRlbnNpb24gdmVyc2lvblxuICAgKiAnKicnIG9yIG1pc3NlZCBlcXVhbCB0byBhbGwgdmVyc2lvbnNcbiAgICovXG4gIHN0YXRpYyBmaWx0ZXJCeVZlcnNpb24oY29uZmlnLCB2ZXJzaW9uID0gZ2V0VmVyc2lvbigpKSB7XG4gICAgY29uZmlnID0gZGVlcENvcHlXaXRoRGVmYXVsdChjb25maWcpXG4gICAgbGV0IHBhZ2VDb25maWcgPSBjb25maWcucGFnZUNvbmZpZ1xuXG4gICAgY29uZmlnLnBhZ2VDb25maWcgPSBPYmplY3Qua2V5cyhwYWdlQ29uZmlnKVxuICAgICAgLmZpbHRlcigoa2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFnZUNvbmZpZ1trZXldLFxuICAgICAgICAgIHJ1bGVWZXJzaW9uID0gdmFsdWUudmVyc2lvblxuXG4gICAgICAgIHJldHVybiAhcnVsZVZlcnNpb24gfHxcbiAgICAgICAgICBydWxlVmVyc2lvbiA9PT0gJyonIHx8XG4gICAgICAgICAgdmVyc2lvbkNvbXBhcmF0b3IodmVyc2lvbiwgcnVsZVZlcnNpb24pICE9PSAxXG4gICAgICB9KVxuICAgICAgLnJlZHVjZSgoaHNoLCBrZXkpID0+ICh7Li4uaHNoLCBba2V5XTogcGFnZUNvbmZpZ1trZXldfSksIHt9KVxuXG4gICAgcmV0dXJuIGNvbmZpZ1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcyBzdHJpbmdzIHRvIGJvb2xlYW4gdmFsdWVzLlxuICAgKiBBcyBhIHJlc3VsdCB3b3VsZCBwcm9kdWNlIEpTT046XG4gICAqIHtcbiAgICogICAnZG9tYWluMS5jb20nOiB7IGVuYWJsZWQ6IGZhbHNlLCBtYXRjaFBhcnRPZlVybDogdHJ1ZSB9LFxuICAgKiAgICdkb21haW4yLmNvbSc6IHtcbiAgICogICAgIGVuYWJsZWQ6IHRydWUsXG4gICAqICAgICBtYXRjaFBhcnRPZlVybDogZmFsc2UsXG4gICAqICAgICBwYWdlczogeyAnKm5vdGVzJzogeyBlbmFibGVkOiBmYWxzZSB9IH1cbiAgICogICB9XG4gICAqIH1cbiAgICovXG4gIHN0YXRpYyBwYXJzZUJvb2xlYW5zKGNvbmZpZykge1xuICAgIGZ1bmN0aW9uIGlzVHJ1bHkodmFsdWUpIHtcbiAgICAgIHJldHVybiAhKHZhbHVlID09PSBmYWxzZSB8fCB2YWx1ZSA9PSAnZmFsc2UnKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRXhpc3RzT3JGYWxzZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID8gaXNUcnVseSh2YWx1ZSkgOiBmYWxzZVxuICAgIH1cblxuICAgIGNvbmZpZyA9IGRlZXBDb3B5V2l0aERlZmF1bHQoY29uZmlnKVxuICAgIGxldCBwYWdlQ29uZmlnID0gY29uZmlnLnBhZ2VDb25maWdcblxuICAgIE9iamVjdC5rZXlzKHBhZ2VDb25maWcpXG4gICAgICAuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGlmICghcGFnZUNvbmZpZ1trZXldKSBwYWdlQ29uZmlnW2tleV0gPSB7fVxuXG4gICAgICAgIGNvbnN0IHJ1bGUgPSBwYWdlQ29uZmlnW2tleV1cblxuICAgICAgICBydWxlLmVuYWJsZWQgPSBpc1RydWx5KHJ1bGUuZW5hYmxlZClcbiAgICAgICAgcnVsZS5tYXRjaFBhcnRPZlVybCA9IGlzRXhpc3RzT3JGYWxzZShydWxlLm1hdGNoUGFydE9mVXJsKVxuXG4gICAgICAgIGlmIChydWxlLnBhZ2VzKSB7XG4gICAgICAgICAgT2JqZWN0LmtleXMocnVsZS5wYWdlcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICBydWxlLnBhZ2VzW2tleV0uZW5hYmxlZCA9IGlzVHJ1bHkocnVsZS5wYWdlc1trZXldLmVuYWJsZWQpXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgIHJldHVybiBjb25maWdcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIHNwZWNpZmljIGRvbWFpbiBvbmx5IGlmIGNlcnRhaW4gYnJvd3NlciBub3Qgc3VwcG9ydGVkXG4gICAqIERvbid0IGNoYW5nZSBlbmFibGVkIHZhbHVlIGlmIGRvbWFpbiBsaXN0IG5vdCBzcGVjaWZpZWRcbiAgICpcbiAgICogQ29uZmlnIG1heSBjb250YWluc1xuICAgKiBgZGlzYWJsZWRCcm93c2VyOiBbJ2ZpcmVmb3gnLCAnY2hyb21lJywgJ3NhZmFyaSddYFxuICAgKi9cbiAgc3RhdGljIHBhcnNlQnJvd3NlclZhbHVlcyhjb25maWcsIGJyb3dzZXIgPSBnZXRCcm93c2VyKCkpIHtcbiAgICBjb25maWcgPSBkZWVwQ29weVdpdGhEZWZhdWx0KGNvbmZpZylcbiAgICBjb25zdCBwYWdlQ29uZmlnID0gY29uZmlnLnBhZ2VDb25maWdcblxuICAgIE9iamVjdC5rZXlzKHBhZ2VDb25maWcpLm1hcCgoa2V5KSA9PiB7XG4gICAgICBjb25zdCBkaXNhYmxlZCA9IHBhZ2VDb25maWdba2V5XSAmJiBwYWdlQ29uZmlnW2tleV0uZGlzYWJsZWRCcm93c2Vyc1xuXG4gICAgICBpZiAoZGlzYWJsZWQgJiYgZGlzYWJsZWQuaW5jbHVkZXMoYnJvd3NlcikpIHtcbiAgICAgICAgcGFnZUNvbmZpZ1trZXldLmVuYWJsZWQgPSBmYWxzZVxuICAgICAgfVxuICAgIH0pXG5cbiAgICByZXR1cm4gY29uZmlnXG4gIH1cblxuICBzdGF0aWMgZmlsdGVySW52YWxpZFBhZ2VSZWdleHAoY29uZmlnKSB7XG4gICAgY29uZmlnID0gZGVlcENvcHlXaXRoRGVmYXVsdChjb25maWcpXG4gICAgbGV0IHBhZ2VDb25maWcgPSBjb25maWcucGFnZUNvbmZpZ1xuXG4gICAgT2JqZWN0LmtleXMocGFnZUNvbmZpZykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBsZXQgY29uZmlnID0gcGFnZUNvbmZpZ1trZXldXG4gICAgICBpZiAoY29uZmlnLnBhZ2VzKSB7XG4gICAgICAgIGNvbmZpZy5wYWdlcyA9IE9iamVjdC5rZXlzKGNvbmZpZy5wYWdlcykuZmlsdGVyKChrZXkpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoa2V5KVxuICAgICAgICAgIH1cbiAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAucmVkdWNlKChoc2gsIGtleSkgPT4gKHsuLi5oc2gsIFtrZXldOiBjb25maWcucGFnZXNba2V5XX0pLCB7fSlcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgcmV0dXJuIGNvbmZpZ1xuICB9XG5cbiAgc3RhdGljIGNvbGxlY3RQYXJ0aWFscyhjb25maWcpIHtcbiAgICBjb25maWcgPSBkZWVwQ29weVdpdGhEZWZhdWx0KGNvbmZpZylcbiAgICBjb25zdCBwYWdlQ29uZmlnID0gY29uZmlnLnBhZ2VDb25maWdcbiAgICBjb25maWcucGFydGlhbHMgPSBbXVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbmZpZy5wYXJ0aWFscyA9IE9iamVjdC5rZXlzKHBhZ2VDb25maWcpXG4gICAgICAgIC5maWx0ZXIoZG9tYWluID0+IHBhZ2VDb25maWdbZG9tYWluXS5tYXRjaFBhcnRPZlVybClcbiAgICAgICAgLm1hcChkb21haW4gPT4gKHtkb21haW4sIC4uLnBhZ2VDb25maWdbZG9tYWluXX0pKVxuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0Nhbm5vdCBjb2xsZWN0IHBhcnRpYWxzIGZyb20gY29uZmlnJylcbiAgICB9XG5cbiAgICByZXR1cm4gY29uZmlnXG4gIH1cbn1cbiIsIlxuaW1wb3J0IHtpc0ZGLCBpc1NhZmFyaX0gZnJvbSAnLi4vdXRpbCdcbmltcG9ydCBwcmVmcyBmcm9tICcuLi9wcmVmcydcblxuY29uc3QgUFJPVE9DT0xfVkVSU0lPTiA9ICcxLjAnXG5cbmNvbnN0IFNJVEVTX1RPX1JFTE9BRCA9IFtcbiAgJ21haWwuZ29vZ2xlLmNvbScsXG4gICd5YWhvby5jb20nLFxuICAnbWFpbC5saXZlLmNvbScsXG4gICdmYWNlYm9vay5jb20nLFxuICAndHVtYmxyLmNvbScsXG4gICdzdGFja292ZXJmbG93LmNvbScsXG4gICd3b3JkcHJlc3MuY29tJyxcbiAgJ3dvcmRwcmVzcy5vcmcnLFxuICAnYmxvZ3Nwb3QuY29tJ1xuXVxuXG5jb25zdCBVUERBVEVfMzBNID0gMzAgKiA2MCAqIDEwMDAgLy8gMzBtXG5jb25zdCBVUERBVEVfNU0gPSA1ICogNjAgKiAxMDAwIC8vIDVtXG5jb25zdCBQQUdFX0NPTkZJR19ERUZBVUxUX0lOVEVSVkFMID0gcHJvY2Vzcy5lbnYuUFJPRCA/IFVQREFURV8zME0gOiBVUERBVEVfNU1cblxuY29uc3QgUEFHRV9DT05GSUdfVVBEQVRFX0lOVEVSVkFMUyA9IFtcbiAgMTAgKiA2MCAqIDEwMDAsIC8vIDEwbVxuICBQQUdFX0NPTkZJR19ERUZBVUxUX0lOVEVSVkFMLFxuICA2MCAqIDYwICogMTAwMCwgLy8gNjBtXG4gIDMgKiA2MCAqIDYwICogMTAwMCwgLy8gM2hcbiAgMTIgKiA2MCAqIDYwICogMTAwMCwgLy8gMTJoXG4gIDI0ICogNjAgKiA2MCAqIDEwMDAsIC8vIDI0aFxuICAzNjUgKiAyNCAqIDYwICogNjAgKiAxMDAwIC8vIHR1cm4gb2ZmXG5dXG5cbmNvbnN0IFBBR0VfQ09ORklHID0ge1xuICBwYWdlQ29uZmlnOiB7XG4gICAgJ21haWwuZ29vZ2xlLmNvbSc6IHtcbiAgICAgIGZpZWxkczogW1xuICAgICAgICB7bmFtZTogJ3RvJ30sXG4gICAgICAgIHtuYW1lOiAnY2MnfSxcbiAgICAgICAge25hbWU6ICdiY2MnfSxcbiAgICAgICAge2NsYXNzTmFtZTogJ3ZPJ31cbiAgICAgIF0sXG4gICAgICBzdWJmcmFtZXM6IGZhbHNlXG4gICAgfSxcbiAgICAnbmV3dGFiJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICd2ZXJzaW9uJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdleHRlbnNpb25zJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdncmFtbWFybHkuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdmcmVlLmdyYW1tYXJseS5jb20nOiB7IGVuYWJsZWQ6IGZhbHNlIH0sXG4gICAgJ2FwcC5ncmFtbWFybHkuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdlZC5ncmFtbWFybHkuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdhcHAuYXNhbmEuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdob290c3VpdGUuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdwbHVzLmdvb2dsZS5jb20nOiB7XG4gICAgICBlbmFibGVkOiBmYWxzZVxuICAgICAgLy8sbWF0Y2hBdHRyOiAnZGF0YS1zYnhtPScxJydcbiAgICB9LFxuICAgICdjaHJvbWUuZ29vZ2xlLmNvbSc6IHsgZW5hYmxlZDogZmFsc2UgfSxcbiAgICAnZmFjZWJvb2suY29tJzoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIG1pbkZpZWxkSGVpZ2h0OiAwLFxuICAgICAgcGFnZXM6IHtcbiAgICAgICAgJy4qXFwvbm90ZXMnOiB7XG4gICAgICAgICAgZW5hYmxlZDogZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgJ29uZWRyaXZlLmxpdmUuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdkb2NzLmNvbSc6IHsgZW5hYmxlZDogZmFsc2UgfSxcbiAgICAnc3AuZG9jcy5jb20nOiB7IGVuYWJsZWQ6IGZhbHNlIH0sXG4gICAgJ2RvY3MuZ29vZ2xlLmNvbSc6IHsgZW5hYmxlZDogZmFsc2UsIHRyYWNrOiB0cnVlIH0sXG4gICAgJ2RyaXZlLmdvb2dsZS5jb20nOiB7XG4gICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgIHRyYWNrOiB0cnVlLFxuICAgICAgbWVzc2FnZTogJ1dlIGhvcGUgdG8gc3VwcG9ydCBHb29nbGUgRHJpdmUgYXBwcyBpbiB0aGUgZnV0dXJlLCBidXQgZm9yIG5vdyBwbGVhc2UgdXNlIHlvdXIgPGEgaHJlZj1cImh0dHBzOi8vYXBwLmdyYW1tYXJseS5jb20vXCI+R3JhbW1hcmx5IEVkaXRvcjwvYT4uJ1xuICAgIH0sXG4gICAgJ3RleHRlZGl0b3IubnNzcG90Lm5ldCc6IHsgZW5hYmxlZDogZmFsc2UgfSxcbiAgICAnanNiaW4uY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdqc2ZpZGRsZS5uZXQnOiB7IGVuYWJsZWQ6IGZhbHNlIH0sXG4gICAgJ3F1b3JhLmNvbSc6IHsgZW5hYmxlZDogZmFsc2UgfSxcbiAgICAncGFwZXIuZHJvcGJveC5jb20nOiB7IGVuYWJsZWQ6IGZhbHNlIH0sXG4gICAgJ3R3aXR0ZXIuY29tJzogeyBlbmFibGVkOiAhaXNGRigpICYmICFpc1NhZmFyaSgpIH0sXG4gICAgJ2NvbS5zYWZhcmkuZ3JhbW1hcmx5c3BlbGxjaGVja2VyZ3JhbW1hcmNoZWNrZXInOiB7IGVuYWJsZWQ6IGZhbHNlLCBtYXRjaFBhcnRPZlVybDogdHJ1ZSB9LFxuICAgICdtYWlsLmxpdmUuY29tJzogeyBlbmFibGVkOiBmYWxzZSwgbWF0Y2hQYXJ0T2ZVcmw6IHRydWUgfSxcbiAgICAnaW1wZXJhdmkuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICd1c2VjYW52YXMuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9XG4gIH1cbn1cblxubGV0IGlzU2tpcENvbmZpZyA9IGZhbHNlXG5cbmlmICghcHJvY2Vzcy5lbnYuUFJPRCkge1xuICAoYXN5bmMgKCkgPT4ge1xuICAgIGxldCBza2lwQ29uZmlnID0gYXdhaXQgcHJlZnMuZ2V0KCdza2lwQ29uZmlnJylcbiAgICBpc1NraXBDb25maWcgPSBza2lwQ29uZmlnID09IHRydWVcbiAgfSgpKVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIFBBR0VfQ09ORklHLFxuICBQQUdFX0NPTkZJR19ERUZBVUxUX0lOVEVSVkFMLFxuICBQQUdFX0NPTkZJR19VUERBVEVfSU5URVJWQUxTLFxuICBQUk9UT0NPTF9WRVJTSU9OLFxuICBTSVRFU19UT19SRUxPQUQsXG4gIGlzU2tpcENvbmZpZzogKCkgPT4gaXNTa2lwQ29uZmlnXG59XG4iLCJpbXBvcnQge2lzQmd9IGZyb20gJy4uL3V0aWwnXG5pbXBvcnQgQ29uZmlnUGFnZSBmcm9tICcuL2NvbmZpZy1wYWdlJ1xuaW1wb3J0IENvbmZpZ0JnIGZyb20gJy4vY29uZmlnLWJnJ1xuXG5sZXQgaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGlzQmcoKSA/IG5ldyBDb25maWdCZygpIDogbmV3IENvbmZpZ1BhZ2UoKVxufVxuXG5leHBvcnQgZGVmYXVsdCBpbml0KClcbiIsImltcG9ydCBsb2NhbGZvcmFnZSBmcm9tICdsb2NhbGZvcmFnZSdcblxuY29uc3QgTkFNRSA9ICdHcmFtbWFybHknXG5jb25zdCBWRVJTSU9OID0gMS4wXG5jb25zdCBTVE9SRV9OQU1FID0gJ2NvbmZpZ3VyYXRpb24nXG5cbmxvY2FsZm9yYWdlLmNvbmZpZyh7XG4gIG5hbWU6IE5BTUUsXG4gIHZlcnNpb246IFZFUlNJT04sXG4gIHN0b3JlTmFtZTogU1RPUkVfTkFNRVxufSlcblxuZXhwb3J0IGRlZmF1bHQgbG9jYWxmb3JhZ2VcbiIsImltcG9ydCB7XG4gIFBBR0VfQ09ORklHX1VQREFURV9JTlRFUlZBTFMsXG4gIFBBR0VfQ09ORklHX0RFRkFVTFRfSU5URVJWQUwsXG4gIFBST1RPQ09MX1ZFUlNJT059IGZyb20gJy4vZGVmYXVsdHMnXG5cbmZ1bmN0aW9uIGlzVmFsaWQoY29uZmlnKSB7XG4gIGlmICghY29uZmlnIHx8ICFjb25maWcucGFnZUNvbmZpZykgcmV0dXJuXG4gIGlmICghT2JqZWN0LmtleXMoY29uZmlnKS5sZW5ndGgpIHJldHVyblxuICBpZiAoIU9iamVjdC5rZXlzKGNvbmZpZy5wYWdlQ29uZmlnKS5sZW5ndGgpIHJldHVyblxuICBpZiAoY29uZmlnLnByb3RvY29sVmVyc2lvbiAmJiBjb25maWcucHJvdG9jb2xWZXJzaW9uICE9PSBQUk9UT0NPTF9WRVJTSU9OKSByZXR1cm5cbiAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gaW50ZXJ2YWwobXMpIHtcbiAgaWYgKFBBR0VfQ09ORklHX1VQREFURV9JTlRFUlZBTFMuaW5jbHVkZXMobXMpKSB7XG4gICAgcmV0dXJuIG1zXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIFBBR0VfQ09ORklHX0RFRkFVTFRfSU5URVJWQUxcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGlzVmFsaWQsXG4gIGludGVydmFsXG59XG4iLCJpbXBvcnQgZm9yZ2UgZnJvbSAnLi9mb3JnZSdcbmltcG9ydCBtZXNzYWdlIGZyb20gJy4vbWVzc2FnZSdcbmltcG9ydCB7X2YsIGlzRnVuY3Rpb24sIGVtaXREb21FdmVudH0gZnJvbSAnLi91dGlsJ1xuaW1wb3J0IHtnZXREb21haW59IGZyb20gJy4vbG9jYXRpb24nXG5pbXBvcnQge2xpc3Rlbn0gZnJvbSAnLi9kb20nXG5pbXBvcnQgZW1pdHRlciBmcm9tICdlbWl0dGVyJ1xuXG5cbi8vd2UgcmVjZWl2ZSBoZXJlIG1lc3NhZ2UgZnJvbSBiZyBwYWdlLCBwb3B1cCwgb3Igb3RoZXIgdGFiLCBhbmQgZmlyZSBwcmVmcyBjaGFuZ2UgZXZlbnRcbm1lc3NhZ2Uub24oJ3ByZWZzLWNoYW5nZWQnLCBvYmogPT4ge1xuICBtZS5lbWl0KG9iai5wcmVmLCBvYmoudmFsdWUpXG4gIGlmICghcHJvY2Vzcy5lbnYuUFJPRCkge1xuICAgIGVtaXREb21FdmVudCgncHJlZnMtY2hhbmdlZCcsIG9iailcbiAgfVxufSlcblxubWVzc2FnZS5vbignZW5hYmxlZCcsIG9iaiA9PiB7XG4gIG1lLmVtaXQoJ2VuYWJsZWQnLCBvYmopXG59KVxuXG5sZXQgcGdldCA9IHByb3AgPT4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICB0cnkge1xuICAgIGZvcmdlLnByZWZzLmdldChwcm9wLCByZXNvbHZlLCBlID0+IHtcbiAgICAgIGlmIChlICYmIGUubWVzc2FnZSAmJiBlLm1lc3NhZ2UuaW5jbHVkZXMoJ1N5bnRheEVycm9yJykpIHtcbiAgICAgICAgZm9yZ2UucHJlZnMuY2xlYXIocHJvcClcbiAgICAgICAgcmV0dXJuIHJlamVjdChgUHJvcDoke3Byb3B9IGhhcyBjb3JydXB0ZWQgdmFsdWUsIGNsZWFudXBgKVxuICAgICAgfVxuICAgICAgcmVqZWN0KGUpXG4gICAgfSlcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgcmVqZWN0KGUpXG4gIH1cbn0pXG5cbmxldCBtZSA9IGVtaXR0ZXIoe1xuICBnZXQ6IGFzeW5jIChwcm9wcywgY2IpID0+IHsvL1RPRE8gcmVmYWN0b3Igd2l0aG91dCBjYWxsYmFja3NcbiAgICBpZiAoQXJyYXkuaXNBcnJheShwcm9wcykpIHtcblxuICAgICAgLy9lbmFibGVkIGlzIGNhbGN1bGF0ZWQgcHJvcGVydHksIHNvIHdlIG9uZSBhZGRpdGlvbmFsIGNhbGxiYWNrXG4gICAgICBpZiAocHJvcHMuaW5jbHVkZXMoJ2VuYWJsZWQnKSAmJiBwcm9wcy5pbmNsdWRlcygnZG9tYWluJykpIHtcbiAgICAgICAgbGV0IF9jYiA9IGNiXG4gICAgICAgIGNiID0gb2JqID0+IHtcbiAgICAgICAgICBtZS5lbmFibGVkKCcnLCBvYmouZG9tYWluLCBlbmFibGVkID0+IHtcbiAgICAgICAgICAgIG9iai5lbmFibGVkID0gZW5hYmxlZFxuICAgICAgICAgICAgX2NiKG9iailcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGxldCByZXN1bHQgPSB7fVxuXG4gICAgICB0cnkge1xuICAgICAgICBsZXQgdmFsdWVzID0gYXdhaXQqIHByb3BzLm1hcChwZ2V0KVxuXG4gICAgICAgIHJlc3VsdCA9IHByb3BzLnJlZHVjZSgob2JqLCBwcm9wLCBpKSA9PiBPYmplY3QuYXNzaWduKG9iaiwge1twcm9wXTogdmFsdWVzW2ldfSksIHt9KVxuXG4gICAgICAgIGNiICYmIGNiKHJlc3VsdClcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ3ByZWZzIGdldCBlcnJvcjonLCBlKVxuICAgICAgICBtZXNzYWdlLmVtaXRFcnJvcihlKVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gcmVzdWx0XG4gICAgfVxuXG4gICAgbGV0IHJlc3VsdCA9IHBnZXQocHJvcHMpXG5cbiAgICBpZiAoY2IpIHtcbiAgICAgIHJlc3VsdC50aGVuKGNiLCBtZXNzYWdlLmVtaXRFcnJvcilcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICByZXR1cm4gcmVzdWx0LnRoZW4oeCA9PiB4LCBlID0+IHtcbiAgICAgICAgbWVzc2FnZS5lbWl0RXJyb3IoZSlcbiAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgIH0pXG4gICAgfVxuICB9LFxuICBzZXQ6IGFzeW5jIChwcmVmLCB2YWx1ZSkgPT4ge1xuICAgIGlmIChwcmVmICE9PSBudWxsICYmIHR5cGVvZiBwcmVmID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKHByZWYpLmZvckVhY2goa2V5ID0+IG1lLnNldChrZXksIHByZWZba2V5XSkpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGxldCBvbGRWYWwgPSBhd2FpdCBwZ2V0KHByZWYpXG4gICAgICBpZiAob2xkVmFsICE9IHZhbHVlKSB7XG4gICAgICAgIG1lc3NhZ2UuZW1pdFRhYnMoJ3ByZWZzLWNoYW5nZWQnLCB7cHJlZiwgdmFsdWV9KVxuICAgICAgICBpZiAoIXByb2Nlc3MuZW52LlBST0QpIHtcbiAgICAgICAgICBlbWl0RG9tRXZlbnQoJ3ByZWZzLWNoYW5nZWQnLCB7a2V5OiBwcmVmLCB2YWx1ZX0pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZm9yZ2UucHJlZnMuc2V0KHByZWYsIHZhbHVlKVxuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgbWVzc2FnZS5lbWl0RXJyb3IoZSlcbiAgICB9XG4gIH0sXG4gIGNsZWFyQWxsOiAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGZvcmdlLnByZWZzLmNsZWFyQWxsKClcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIG1lc3NhZ2UuZW1pdEVycm9yKGUpXG4gICAgfVxuICB9LFxuICBlbmFibGVkOiAodmFsdWUgPSAnJywgZG9tYWluLCBjYiA9IF9mKSA9PiB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICBjYiA9IHZhbHVlXG4gICAgICB2YWx1ZSA9ICcnXG4gICAgfVxuXG4gICAgbGV0IGludm9sdmUgPSBkb21haW4gPT4gbWUuZ2V0KCdlbmFibGVkX2RiJywgZGIgPT5cbiAgICAgIGNiKF9lbmFibGVkKGRiLCB2YWx1ZSwgZG9tYWluKSlcbiAgICApXG5cbiAgICBkb21haW4gPyBpbnZvbHZlKGRvbWFpbikgOiBnZXREb21haW4oaW52b2x2ZSlcbiAgfSxcbiAgaW5jRml4ZWQ6IChpbmMgPSAxKSA9PiB7XG4gICAgbWUuZ2V0KCdmaXhlZF9lcnJvcnMnLCBmaXhlZCA9PiB7XG4gICAgICBmaXhlZCA9IHBhcnNlSW50KGZpeGVkKVxuICAgICAgaWYgKGlzTmFOKGZpeGVkKSkgZml4ZWQgPSAwXG4gICAgICBmaXhlZCArPSBpbmNcbiAgICAgIG1lLnNldCgnZml4ZWRfZXJyb3JzJywgZml4ZWQpXG4gICAgfSlcbiAgfSxcbiAgaXNFeHQyOiAoKSA9PiBtZS5nZXQoJ2V4dDInKVxufSlcblxuZnVuY3Rpb24gX2VuYWJsZWQoZGIsIHZhbHVlLCBkb21haW4pIHtcbiAgbGV0IHdyaXRlID0gdHlwZW9mIHZhbHVlID09ICdib29sZWFuJyxcbiAgICBqc29uID0ge31cblxuICB0cnkge1xuICAgIGlmICghZGIpIHRocm93ICdiYWQgZGInXG4gICAganNvbiA9IEpTT04ucGFyc2UoZGIpXG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICBtZS5zZXQoJ2VuYWJsZWRfZGInLCAne30nKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RG9tYWluU2V0dGluZ3MoanNvbikge1xuICAgIHJldHVybiBqc29uW2RvbWFpbl0gfHwge2VuYWJsZWQ6IHRydWV9XG4gIH1cblxuICBpZiAodmFsdWUgPT09ICcnICYmIGRvbWFpbikge1xuICAgIHJldHVybiBnZXREb21haW5TZXR0aW5ncyhqc29uKS5lbmFibGVkXG4gIH1cblxuICBpZiAod3JpdGUpIHtcbiAgICBsZXQgc2V0dGluZ3MgPSBnZXREb21haW5TZXR0aW5ncyhqc29uKVxuICAgIHNldHRpbmdzLmVuYWJsZWQgPSB2YWx1ZVxuICAgIGpzb24ubGFzdENoYW5nZSA9IHt2YWx1ZSwgZG9tYWlufVxuICAgIGpzb25bZG9tYWluXSA9IHNldHRpbmdzXG4gICAgbWUuc2V0KCdlbmFibGVkX2RiJywgSlNPTi5zdHJpbmdpZnkoanNvbikpXG4gICAgbWVzc2FnZS5lbWl0VGFicygnZW5hYmxlZCcsIGpzb24ubGFzdENoYW5nZSlcbiAgfVxuXG4gIHJldHVybiB2YWx1ZVxufVxuXG5pZiAoIXByb2Nlc3MuZW52LlBST0QpIHtcbiAgLy9ob29rIHRvIGVuYWJsZSB0ZXN0ZXJzIHRvIHNldCBwcm9wcyBleHRlcm5hbGx5XG4gIGxpc3Rlbihkb2N1bWVudCwgJ3NldC1wcmVmcycsIGUgPT4ge1xuICAgIG1lLnNldChlLmtleSwgZS52YWx1ZSlcbiAgfSlcblxuICBsaXN0ZW4oZG9jdW1lbnQsICdnZXQtcHJlZicsIGFzeW5jIGUgPT4ge1xuICAgIGxldCB2YWx1ZSA9IGF3YWl0IG1lLmdldChlLmtleSlcbiAgICBlbWl0RG9tRXZlbnQoJ3ByZWYnLCB7a2V5OiBlLmtleSwgdmFsdWV9KVxuICB9KVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IG1lXG4iLCJpbXBvcnQge3JlcXVlc3R9IGZyb20gJy4vZm9yZ2UnXG5pbXBvcnQge2lzVGVzdH0gZnJvbSAnLi9jb25maWcnXG5pbXBvcnQge2lzQmcsIGlzRkYsIGRlbGF5fSBmcm9tICcuL3V0aWwnXG5pbXBvcnQgbWVzc2FnZSBmcm9tICcuL21lc3NhZ2UnXG5cbmNvbnN0IEFKQVhfVElNRU9VVCA9IDEwMDAwXG5cbmlmIChpc0JnKCkpIHtcbiAgcmVxdWlyZSgnd2hhdHdnLWZldGNoJylcbiAgbWVzc2FnZS5vbignZmV0Y2gnLCAoZGF0YSwgY2IsIGVycm9yKSA9PiBiZ0ZldGNoKGRhdGEpLnRoZW4oY2IsIGVycm9yKSlcbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtT3B0aW9ucyhvcHRzKSB7XG4gIGlmIChvcHRzLmRhdGEgJiYgKG9wdHMucXVlcnkgfHwgb3B0cy5tZXRob2QgIT0gJ3Bvc3QnKSkge1xuICAgIG9wdHMudXJsICs9ICc/JyArIHBhcmFtU3RyKG9wdHMuZGF0YSlcbiAgfVxuXG4gIGlmIChvcHRzLmRhdGEgJiYgb3B0cy5tZXRob2QgPT0gJ3Bvc3QnICYmICFvcHRzLnF1ZXJ5ICYmICFvcHRzLmJvZHkpIHtcbiAgICB0cnkge1xuICAgICAgb3B0cy5ib2R5ID0gSlNPTi5zdHJpbmdpZnkob3B0cy5kYXRhKVxuICAgIH1cbiAgICBjYXRjaChlKSB7XG4gICAgICBvcHRzLmJvZHkgPSB7fVxuICAgICAgY29uc29sZS53YXJuKGUpXG4gICAgfVxuXG4gICAgb3B0cy5oZWFkZXJzID0gb3B0cy5oZWFkZXJzIHx8IHt9XG4gICAgb3B0cy5oZWFkZXJzWydDb250ZW50LVR5cGUnXSA9IG9wdHMuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gfHwgJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgZGVsZXRlIG9wdHMuZGF0YVxuICB9XG4gIG9wdHMuY3JlZGVudGlhbHMgPSAnaW5jbHVkZSdcbiAgcmV0dXJuIG9wdHNcbn1cblxuZnVuY3Rpb24gZmV0Y2godXJsLCBvcHRzID0ge30pIHtcbiAgLy8gaWYgKGNvbmZpZy5kZXZlbG9wbWVudCAmJiAhZm9yZ2UpIHVybCA9ICcvYXBpP3VybD0nICsgdXJsXG4gIG9wdHMudXJsID0gdXJsXG4gIHRyYW5zZm9ybU9wdGlvbnMob3B0cylcbiAgaWYgKGlzQmcoKSB8fCBpc1Rlc3QpIHJldHVybiBiZ0ZldGNoKG9wdHMpXG5cbiAgcmV0dXJuIG1lc3NhZ2UucHJvbWlzZUJhY2tncm91bmQoJ2ZldGNoJywgb3B0cylcbn1cblxuZnVuY3Rpb24gYmdGZXRjaCh7dXJsLCAuLi5vcHRzfSkge1xuICBpZiAoaXNGRigpKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlcXVlc3QuYWpheCh7XG4gICAgICAgIHVybDogdXJsLFxuICAgICAgICBkYXRhOiBvcHRzLmRhdGEsXG4gICAgICAgIGhlYWRlcjogb3B0cy5oZWFkZXIsXG4gICAgICAgIHR5cGU6IG9wdHMubWV0aG9kIHx8ICdHRVQnLFxuICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICB0aW1lb3V0OiBvcHRzLnRpbWVvdXQgfHwgQUpBWF9USU1FT1VULFxuICAgICAgICBzdWNjZXNzOiByZXMgPT4ge1xuICAgICAgICAgIGxldCBqc29uUmVzID0gKHR5cGVvZiByZXMgPT09ICdzdHJpbmcnKSA/IEpTT04ucGFyc2UocmVzKSA6IHJlc1xuXG4gICAgICAgICAgaWYgKGpzb25SZXMuZXJyb3IpIHRocm93IG5ldyBFcnJvcihqc29uUmVzLmVycm9yKVxuICAgICAgICAgIHJlc29sdmUoanNvblJlcylcbiAgICAgICAgfSxcbiAgICAgICAgZXJyb3I6IChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UgPT09ICdSZXF1ZXN0IHRpbWVkIG91dCcpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRmV0Y2ggcmVxdWVzdCB0byAke3VybH0gcmVqZWN0ZWQgYnkgdGltZW91dGApXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVyci5tZXNzYWdlKVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gIH1cblxuICByZXR1cm4gUHJvbWlzZS5yYWNlKFtcbiAgICB3aW5kb3cuZmV0Y2godXJsLCBvcHRzKVxuICAgICAgLnRoZW4ob3B0cy5pc1RleHQgPyB0ZXh0IDoganNvbilcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIGlmIChyZXMuZXJyb3IpIHRocm93IG5ldyBFcnJvcihyZXMuZXJyb3IpXG4gICAgICAgIHJldHVybiByZXNcbiAgICAgIH0pLFxuICAgIGRlbGF5KG9wdHMudGltZW91dCB8fCBBSkFYX1RJTUVPVVQpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBGZXRjaCByZXF1ZXN0IHRvICR7dXJsfSByZWplY3RlZCBieSB0aW1lb3V0YClcbiAgICB9KVxuICBdKVxufVxuXG5mdW5jdGlvbiBqc29uKHJlc3BvbnNlKSB7XG4gIHJldHVybiByZXNwb25zZS5qc29uKClcbn1cblxuZnVuY3Rpb24gdGV4dChyZXNwb25zZSkge1xuICByZXR1cm4gcmVzcG9uc2UudGV4dCgpXG59XG5cbmZ1bmN0aW9uIHBhcmFtU3RyKGRhdGEpIHtcbiAgbGV0IHJlcSA9ICcnXG4gIGZvciAobGV0IGl0ZW0gaW4gZGF0YSkge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGFbaXRlbV0pKSB7XG4gICAgICBpZiAoZGF0YVtpdGVtXS5sZW5ndGgpIHtcbiAgICAgICAgcmVxICs9IGAke3JlcS5sZW5ndGggPyAnJicgOiAnJ30ke2RhdGFbaXRlbV0ubWFwKHZhbCA9PiBgJHtpdGVtfT0ke3ZhbH1gKS5qb2luKCcmJyl9YCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvb3AtZnVuY1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJlcSArPSBgJHtyZXEubGVuZ3RoID8gJyYnIDogJyd9JHtpdGVtfT0ke2VuY29kZVVSSUNvbXBvbmVudChkYXRhW2l0ZW1dKX1gXG4gICAgfVxuICB9XG4gIHJldHVybiByZXFcbn1cblxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGZldGNoLFxuICB0cmFuc2Zvcm1PcHRpb25zLFxuICBwYXJhbVN0clxufVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9leHRlbmRzID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbiAodGFyZ2V0KSB7IGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7IHZhciBzb3VyY2UgPSBhcmd1bWVudHNbaV07IGZvciAodmFyIGtleSBpbiBzb3VyY2UpIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzb3VyY2UsIGtleSkpIHsgdGFyZ2V0W2tleV0gPSBzb3VyY2Vba2V5XTsgfSB9IH0gcmV0dXJuIHRhcmdldDsgfTtcblxuZXhwb3J0cy5nZXRMb2cgPSBnZXRMb2c7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9mb3JnZSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Wydmb3JnZSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnZm9yZ2UnXSA6IG51bGwpO1xuXG52YXIgX2ZvcmdlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ZvcmdlKTtcblxudmFyIF9lbWl0dGVyID0gcmVxdWlyZSgnZW1pdHRlcicpO1xuXG52YXIgX2VtaXR0ZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZW1pdHRlcik7XG5cbnZhciBfd2Vic29ja2V0ID0gcmVxdWlyZSgnd2Vic29ja2V0Jyk7XG5cbnZhciBfd2Vic29ja2V0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3dlYnNvY2tldCk7XG5cbnZhciBfdGltZXJzID0gcmVxdWlyZSgnLi90aW1lcnMnKTtcblxudmFyIF90aW1lcnMyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfdGltZXJzKTtcblxudmFyIF9tZXNzYWdlID0gcmVxdWlyZSgnLi9tZXNzYWdlJyk7XG5cbnZhciBfbWVzc2FnZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9tZXNzYWdlKTtcblxudmFyIF91dGlsID0gcmVxdWlyZSgnLi91dGlsJyk7XG5cbnZhciBfdHJhY2tpbmdJbmRleCA9IHJlcXVpcmUoJy4vdHJhY2tpbmcvaW5kZXgnKTtcblxudmFyIF9jb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZycpO1xuXG52YXIgc29ja2V0cyA9IHt9O1xuXG52YXIgU29ja2V0ID0gZnVuY3Rpb24gU29ja2V0KGNvbmZpZykge1xuICBpZiAoIV9mb3JnZTJbJ2RlZmF1bHQnXSAmJiAhd2luZG93LnNvY2tldFNlcnZlciB8fCB3aW5kb3cuZ3JfX19zYW5kYm94KSBTb2NrZXRTZXJ2ZXIoKTtcblxuICBpZiAoISgwLCBfdXRpbC5pc0JnKSgpKSB7XG4gICAgcmV0dXJuIFNvY2tldENsaWVudChjb25maWcpO1xuICB9XG5cbiAgcmV0dXJuIFNvY2tldFNlcnZlcigpO1xufTtcblxuZnVuY3Rpb24gb25FcnJvcihlKSB7XG4gIGlmIChlID09ICdkaXNjb25uZWN0ZWQnKSByZXR1cm47XG4gIHZhciBkYXRhID0ge307XG4gIGlmICh0eXBlb2YgZSA9PSAnc3RyaW5nJykge1xuICAgIGRhdGEubXNnID0gZTtcbiAgfSBlbHNlIGlmIChlLmVycm9yKSB7XG4gICAgZGF0YS5yZWFkeVN0YXRlID0gZS5lcnJvci5jdXJyZW50VGFyZ2V0ICYmIGUuZXJyb3IuY3VycmVudFRhcmdldC5yZWFkeVN0YXRlO1xuICAgIGRhdGEucmV0dXJuVmFsdWUgPSBlLmVycm9yLnJldHVyblZhbHVlO1xuICB9XG5cbiAgKDAsIF90cmFja2luZ0luZGV4LmNhbGwpKCdmZWxvZy5lcnJvcicsICdzb2NrZXRfZmFpbCcsIGRhdGEpO1xuXG4gIGNvbnNvbGUuZXJyb3IoJ2NhcGkgZXJyb3InLCBlKTtcbiAgaWYgKCF3aW5kb3cuZW1pdCkgKDAsIF9lbWl0dGVyMlsnZGVmYXVsdCddKSh3aW5kb3cpO1xuICB3aW5kb3cuZW1pdCgnYmdlcnJvcicsIGUgfHwgJ3doZW4gc2VuZCBtZXNzYWdlIHRvIHRoZSBzb2NrZXQnKTtcbn1cblxudmFyIFNvY2tldENsaWVudCA9IGZ1bmN0aW9uIFNvY2tldENsaWVudChfcmVmKSB7XG4gIHZhciBfcmVmJHNvY2tldElkID0gX3JlZi5zb2NrZXRJZDtcbiAgdmFyIHNvY2tldElkID0gX3JlZiRzb2NrZXRJZCA9PT0gdW5kZWZpbmVkID8gKDAsIF91dGlsLmd1aWQpKCkgOiBfcmVmJHNvY2tldElkO1xuICB2YXIgdXJsID0gX3JlZi51cmw7XG4gIHZhciB1c2VTdGFuZEJ5ID0gX3JlZi51c2VTdGFuZEJ5O1xuXG4gIHZhciBtZSA9ICgwLCBfZW1pdHRlcjJbJ2RlZmF1bHQnXSkoe30pLFxuICAgICAgbGlzdGVuaW5nID0gZmFsc2UsXG4gICAgICBtZXRob2RzID0gWydjb25uZWN0JywgJ3NlbmQnLCAnY2xvc2UnLCAncmVjb25uZWN0JywgJ3JlbGVhc2UnLCAnd3NQbGF5JywgJ3dzUGF1c2UnXTtcblxuICBtZXRob2RzLmZvckVhY2goZnVuY3Rpb24gKG1ldGhvZCkge1xuICAgIHJldHVybiBtZVttZXRob2RdID0gc2VuZC5iaW5kKG51bGwsIG1ldGhvZCk7XG4gIH0pO1xuXG4gIG1lLm9uZSgnY29ubmVjdCcsIGZ1bmN0aW9uICgpIHtcbiAgICBzb2NrZXRzW3NvY2tldElkXSA9IHNvY2tldHNbc29ja2V0SWRdIHx8IHNvY2tldElkO1xuICAgIF90aW1lcnMyWydkZWZhdWx0J10uc3RhcnQoc29ja2V0SWQpO1xuICAgICgwLCBfdHJhY2tpbmdJbmRleC5jYWxsKSgnZmVsb2cuZXZlbnQnLCAnc29ja2V0X29wZW4nLCB7ICdjdXJyZW50X3NvY2tldHMnOiBPYmplY3Qua2V5cyhzb2NrZXRzKS5sZW5ndGggfSk7XG4gIH0pO1xuICBtZS5vbmUoJ2Rpc2Nvbm5lY3QnLCBjbGVhblNvY2tldCk7XG4gIG1lLm9uKCdlcnJvcicsIG9uRXJyb3IpO1xuXG4gIG1lLnNvY2tldElkID0gc29ja2V0SWQ7XG4gIG1lLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAnW29iamVjdCBTb2NrZXRDbGllbnRdJztcbiAgfTtcblxuICByZXR1cm4gbWU7XG5cbiAgZnVuY3Rpb24gc2VuZChtZXRob2QsIGFyZykge1xuICAgIHZhciBtc2cgPSB7IHNvY2tldElkOiBzb2NrZXRJZCwgbWV0aG9kOiBtZXRob2QsIGFyZzogYXJnLCB1cmw6IHVybCwgdXNlU3RhbmRCeTogdXNlU3RhbmRCeSB9O1xuXG4gICAgaWYgKCFsaXN0ZW5pbmcpIGxpc3Rlbk1lc3NhZ2VzKCk7XG5cbiAgICBpZiAobWV0aG9kID09ICdjb25uZWN0JyAmJiAhX2NvbmZpZy5pc1Rlc3QpIHtcbiAgICAgIC8vcmVmcmVzaCB1c2VyIHNlc3Npb24gZXZlcnkgMzAgbWluXG4gICAgICByZXR1cm4gX21lc3NhZ2UyWydkZWZhdWx0J10uZW1pdEJhY2tncm91bmQoJ3VzZXI6cmVmcmVzaCcsIHsgbGF6eTogdHJ1ZSB9LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfbWVzc2FnZTJbJ2RlZmF1bHQnXS5lbWl0QmFja2dyb3VuZCgnc29ja2V0LWNsaWVudCcsIG1zZywgbnVsbCwgb25FcnJvcik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBfbWVzc2FnZTJbJ2RlZmF1bHQnXS5lbWl0QmFja2dyb3VuZCgnc29ja2V0LWNsaWVudCcsIG1zZywgbnVsbCwgb25FcnJvcik7XG5cbiAgICBpZiAobWV0aG9kID09ICdjbG9zZScpIHtcbiAgICAgIGNsZWFuU29ja2V0KCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gY2xlYW5Tb2NrZXQoKSB7XG4gICAgbWUub2ZmKCdkaXNjb25uZWN0JywgY2xlYW5Tb2NrZXQpO1xuICAgIGRlbGV0ZSBzb2NrZXRzW3NvY2tldElkXTtcbiAgICBsaXN0ZW5pbmcgPSBmYWxzZTtcbiAgICBfbWVzc2FnZTJbJ2RlZmF1bHQnXS5vZmYoJ3NvY2tldC1zZXJ2ZXInLCBvbk1lc3NhZ2UsIG9uRXJyb3IpO1xuICAgICgwLCBfdHJhY2tpbmdJbmRleC5jYWxsKSgnZmVsb2cuaW5mbycsICdzb2NrZXRfY2xvc2UnLCB7ICdhY3RpdmVfdGltZSc6IF90aW1lcnMyWydkZWZhdWx0J10uc3RvcChzb2NrZXRJZCksICdjdXJyZW50X3NvY2tldHMnOiBPYmplY3Qua2V5cyhzb2NrZXRzKS5sZW5ndGggfSk7XG4gIH1cblxuICBmdW5jdGlvbiBsaXN0ZW5NZXNzYWdlcygpIHtcbiAgICBsaXN0ZW5pbmcgPSB0cnVlO1xuICAgIF9tZXNzYWdlMlsnZGVmYXVsdCddLm9uKCdzb2NrZXQtc2VydmVyJywgb25NZXNzYWdlLCBvbkVycm9yKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG9uTWVzc2FnZShkYXRhLCBjYikge1xuICAgIGlmIChkYXRhLnNvY2tldElkICE9IHNvY2tldElkKSByZXR1cm47XG4gICAgdmFyIG1zZyA9IGRhdGEubXNnIHx8IHt9O1xuICAgIC8vIGNvbnNvbGUubG9nKCdpbiBjbGllbnQnLCBkYXRhLmV2ZW50LCBzb2NrZXRJZCwgZGF0YS5pZCwgbXNnKVxuICAgIGlmIChtc2cuYWN0aW9uICYmIG1zZy5hY3Rpb24udG9Mb3dlckNhc2UoKSA9PSAnZXJyb3InKSB7XG4gICAgICAoMCwgX3RyYWNraW5nSW5kZXguY2FsbCkoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCAnc3RhYmlsaXR5OmNhcGlfZXJyb3InKTtcbiAgICAgICgwLCBfdHJhY2tpbmdJbmRleC5jYWxsKSgnZmVsb2cuZXZlbnQnLCAnc3RhYmlsaXR5LmNhcGlfZXJyb3InLCBtc2cpO1xuICAgIH1cblxuICAgIGNiKCdvaycpO1xuICAgIG1lLmVtaXQoZGF0YS5ldmVudCwgZGF0YS5tc2cpO1xuICB9XG59O1xuXG4vLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vL3dvcmtzIGluIGJnIHBhZ2Vcbi8vXG5cbnZhciBsb2cgPSBbXTtcblxudmFyIFNvY2tldFNlcnZlciA9IGZ1bmN0aW9uIFNvY2tldFNlcnZlcigpIHtcbiAgdmFyIG1lID0ge307XG5cbiAgd2luZG93LnNvY2tldFNlcnZlciA9IG1lO1xuXG4gIF9tZXNzYWdlMlsnZGVmYXVsdCddLm9uKCdpZnJhbWUtbW9kZScsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ0lGUkFNRSBNT0RFJywgZGF0YS5pZCwgc29ja2V0cyk7XG4gICAgc29ja2V0c1tkYXRhLmlkXS5pZnJhbWVNb2RlKGRhdGEuaWZyYW1lTW9kZSk7XG4gIH0sIG9uRXJyb3IsIHRydWUpO1xuXG4gIF9tZXNzYWdlMlsnZGVmYXVsdCddLm9uKCdzb2NrZXQtY2xpZW50Jywgb25NZXNzYWdlLCBvbkVycm9yLCB0cnVlKTtcblxuICBtZS5zb2NrZXRzID0gc29ja2V0cztcblxuICBtZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gJ1tvYmplY3QgU29ja2V0U2VydmVyXSc7XG4gIH07XG5cbiAgcmV0dXJuIG1lO1xuXG4gIC8vPT09PT09PT09PT09XG5cbiAgZnVuY3Rpb24gb25NZXNzYWdlKGRhdGEsIGNiKSB7XG4gICAgaWYgKCFkYXRhKSByZXR1cm47XG5cbiAgICB2YXIgc29ja2V0SWQgPSBkYXRhLnNvY2tldElkLFxuICAgICAgICBzb2NrZXQgPSBzb2NrZXRzW3NvY2tldElkXSxcbiAgICAgICAgbWV0aG9kID0gZGF0YS5tZXRob2QsXG4gICAgICAgIGlzQ2xvc2UgPSBtZXRob2QgPT0gJ2Nsb3NlJztcblxuICAgIGlmICghc29ja2V0ICYmIGlzQ2xvc2UpIHJldHVybjtcblxuICAgIGlmICghc29ja2V0KSB7XG4gICAgICBzb2NrZXQgPSBCYWNrZ3JvdW5kU29ja2V0KGRhdGEsIG9ucmVsZWFzZSk7XG4gICAgICBzb2NrZXRzW3NvY2tldElkXSA9IHNvY2tldDtcbiAgICB9XG5cbiAgICBpZiAobWV0aG9kKSB7XG4gICAgICBzb2NrZXRbbWV0aG9kXShkYXRhLmFyZyk7XG4gICAgICBpZiAoIVwidHJ1ZVwiKSB7XG4gICAgICAgIGxvZy5wdXNoKF9leHRlbmRzKHsgbWV0aG9kOiBtZXRob2QgfSwgZGF0YS5hcmcpKTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0Nsb3NlKSBvbnJlbGVhc2Uoc29ja2V0SWQpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG9ucmVsZWFzZShzb2NrZXRJZCkge1xuICAgIGlmICghc29ja2V0c1tzb2NrZXRJZF0pIHJldHVybjtcbiAgICBzb2NrZXRzW3NvY2tldElkXS5jbG9zZSgpO1xuICAgIC8vc2hvdWxkIG5vdCBlbWl0IGFueXRoaW5nIGFmdGVyIGNsb3NpbmdcbiAgICBzb2NrZXRzW3NvY2tldElkXS5lbWl0ID0gZnVuY3Rpb24gKGV2ZW50LCBtc2cpIHt9O1xuICAgIGRlbGV0ZSBzb2NrZXRzW3NvY2tldElkXTtcbiAgfVxufTtcblxudmFyIEJhY2tncm91bmRTb2NrZXQgPSBmdW5jdGlvbiBCYWNrZ3JvdW5kU29ja2V0KGNvbmZpZywgb25yZWxlYXNlKSB7XG4gIHZhciB3cyA9ICgwLCBfd2Vic29ja2V0MlsnZGVmYXVsdCddKShjb25maWcpLFxuICAgICAgc29ja2V0SWQgPSBjb25maWcuc29ja2V0SWQsXG4gICAgICBfaWZyYW1lTW9kZSA9IHVuZGVmaW5lZCxcbiAgICAgIHJlbGVhc2VDb3VudCA9IDAsXG4gICAgICB0b29GcmVxdWVudFJlbGVhc2VUcmFja2VkID0gZmFsc2U7XG5cbiAgT2JqZWN0LmFzc2lnbih3cywge1xuICAgIGVtaXQ6IGVtaXQsXG4gICAgaWZyYW1lTW9kZTogaWZyYW1lTW9kZSxcbiAgICB0b1N0cmluZzogZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgICByZXR1cm4gJ1tvYmplY3QgQmFja2dyb3VuZFNvY2tldF0nO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHdzO1xuXG4gIGZ1bmN0aW9uIGVtaXQoZXZlbnQsIG1zZykge1xuICAgIC8vbW9uaXRvcmluZy50aW1lcigpXG5cbiAgICB2YXIgcmVsZWFzZVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBjb25zb2xlLmxvZygnQ0xPU0UgU09DS0VUJyk7XG4gICAgICByZWxlYXNlQ291bnQrKztcbiAgICAgIGlmIChyZWxlYXNlQ291bnQgPiA3ICYmICF0b29GcmVxdWVudFJlbGVhc2VUcmFja2VkKSB7XG4gICAgICAgICgwLCBfdHJhY2tpbmdJbmRleC5jYWxsKSgnZmVsb2cud2FybicsICd0b29fZnJlcXVlbnRfc29ja2V0X3JlbGVhc2UnLCB7ICdyZWxlYXNlX2NvdW50JzogcmVsZWFzZUNvdW50IH0pO1xuICAgICAgICB0b29GcmVxdWVudFJlbGVhc2VUcmFja2VkID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBzdGF0c2NLZXkgPSBpZnJhbWVNb2RlID8gJ3NvY2tldF90aW1lb3V0X2Nsb3NlX2lmcmFtZTpzdGFiaWxpdHknIDogJ3NvY2tldF90aW1lb3V0X2Nsb3NlOnN0YWJpbGl0eSc7XG4gICAgICAoMCwgX3RyYWNraW5nSW5kZXguY2FsbCkoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCBzdGF0c2NLZXkpO1xuICAgICAgd3MuY2xvc2UoKTtcbiAgICAgIHdzLnJlbGVhc2UoKTtcbiAgICAgIG9ucmVsZWFzZSgpO1xuICAgIH0sIDUwMDApO1xuXG4gICAgdmFyIHR5cGUgPSBfaWZyYW1lTW9kZSA/ICdzb2NrZXQtc2VydmVyLWlmcmFtZScgOiAnc29ja2V0LXNlcnZlcic7XG4gICAgY29uc29sZS5sb2coJ2Zyb20gd3MnLCBldmVudCwgc29ja2V0SWQsIG1zZywgdHlwZSk7XG4gICAgaWYgKCFcInRydWVcIikge1xuICAgICAgbG9nLnB1c2goX2V4dGVuZHMoeyBldmVudDogZXZlbnQgfSwgbXNnKSk7XG4gICAgfVxuICAgIF9tZXNzYWdlMlsnZGVmYXVsdCddLmVtaXRUYWJzKHR5cGUsIHsgc29ja2V0SWQ6IHNvY2tldElkLCBldmVudDogZXZlbnQsIG1zZzogbXNnLCBpZDogKDAsIF91dGlsLmd1aWQpKCkgfSwgZnVuY3Rpb24gKG1zZykge1xuICAgICAgcmV0dXJuIG1zZyAmJiBjbGVhclRpbWVvdXQocmVsZWFzZVRpbWVyKTtcbiAgICB9LCBvbkVycm9yKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGlmcmFtZU1vZGUoaXNPbikge1xuICAgIF9pZnJhbWVNb2RlID0gaXNPbjtcbiAgICBjb25zb2xlLmxvZygnVVNFIEVYVCBTT0NLRVQnLCBpc09uKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gZ2V0TG9nKCkge1xuICB2YXIgcmVzdWx0ID0gbG9nLnNsaWNlKDApO1xuICBsb2cubGVuZ3RoID0gMDtcbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gU29ja2V0O1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5d2NtOXFaV04wTDNOeVl5OXFjeTlzYVdJdmMyOWphMlYwTG1weklsMHNJbTVoYldWeklqcGJYU3dpYldGd2NHbHVaM01pT2lJN096czdPenM3T3pzN096czdjVUpCUVd0Q0xFOUJRVTg3T3pzN2RVSkJRMHdzVTBGQlV6czdPenQ1UWtGRFVDeFhRVUZYT3pzN08zTkNRVU5rTEZWQlFWVTdPenM3ZFVKQlExUXNWMEZCVnpzN096dHZRa0ZEVGl4UlFVRlJPenMyUWtGRFpDeHJRa0ZCYTBJN08zTkNRVU5vUWl4VlFVRlZPenRCUVVjdlFpeEpRVUZKTEU5QlFVOHNSMEZCUnl4RlFVRkZMRU5CUVVFN08wRkJSV2hDTEVsQlFVa3NUVUZCVFN4SFFVRkhMRk5CUVZRc1RVRkJUU3hEUVVGWkxFMUJRVTBzUlVGQlJUdEJRVU0xUWl4TlFVRkpMRUZCUVVNc2JVSkJRVTBzU1VGQlNTeERRVUZETEUxQlFVMHNRMEZCUXl4WlFVRlpMRWxCUVVzc1RVRkJUU3hEUVVGRExGbEJRVmtzUlVGQlJTeFpRVUZaTEVWQlFVVXNRMEZCUVRzN1FVRkZNMFVzVFVGQlNTeERRVUZETEdsQ1FVRk5MRVZCUVVVN1FVRkRXQ3hYUVVGUExGbEJRVmtzUTBGQlF5eE5RVUZOTEVOQlFVTXNRMEZCUVR0SFFVTTFRanM3UVVGRlJDeFRRVUZQTEZsQlFWa3NSVUZCUlN4RFFVRkJPME5CUlhSQ0xFTkJRVUU3TzBGQlJVUXNVMEZCVXl4UFFVRlBMRU5CUVVNc1EwRkJReXhGUVVGRk8wRkJRMnhDTEUxQlFVa3NRMEZCUXl4SlFVRkpMR05CUVdNc1JVRkJSU3hQUVVGTk8wRkJReTlDTEUxQlFVa3NTVUZCU1N4SFFVRkhMRVZCUVVVc1EwRkJRVHRCUVVOaUxFMUJRVWtzVDBGQlR5eERRVUZETEVsQlFVa3NVVUZCVVN4RlFVRkZPMEZCUTNoQ0xGRkJRVWtzUTBGQlF5eEhRVUZITEVkQlFVY3NRMEZCUXl4RFFVRkJPMGRCUTJJc1RVRkRTU3hKUVVGSkxFTkJRVU1zUTBGQlF5eExRVUZMTEVWQlFVVTdRVUZEYUVJc1VVRkJTU3hEUVVGRExGVkJRVlVzUjBGQlJ5eERRVUZETEVOQlFVTXNTMEZCU3l4RFFVRkRMR0ZCUVdFc1NVRkJTU3hEUVVGRExFTkJRVU1zUzBGQlN5eERRVUZETEdGQlFXRXNRMEZCUXl4VlFVRlZMRU5CUVVFN1FVRkRNMFVzVVVGQlNTeERRVUZETEZkQlFWY3NSMEZCUnl4RFFVRkRMRU5CUVVNc1MwRkJTeXhEUVVGRExGZEJRVmNzUTBGQlFUdEhRVU4yUXpzN1FVRkZSQ3d5UWtGQlN5eGhRVUZoTEVWQlFVVXNZVUZCWVN4RlFVRkZMRWxCUVVrc1EwRkJReXhEUVVGQk96dEJRVVY0UXl4VFFVRlBMRU5CUVVNc1MwRkJTeXhEUVVGRExGbEJRVmtzUlVGQlJTeERRVUZETEVOQlFVTXNRMEZCUVR0QlFVTTVRaXhOUVVGSkxFTkJRVU1zVFVGQlRTeERRVUZETEVsQlFVa3NSVUZCUlN3d1FrRkJVU3hOUVVGTkxFTkJRVU1zUTBGQlFUdEJRVU5xUXl4UlFVRk5MRU5CUVVNc1NVRkJTU3hEUVVGRExGTkJRVk1zUlVGQlJTeERRVUZETEVsQlFVa3NhVU5CUVdsRExFTkJRVU1zUTBGQlFUdERRVU12UkRzN1FVRkZSQ3hKUVVGSkxGbEJRVmtzUjBGQlJ5eFRRVUZtTEZsQlFWa3NRMEZCV1N4SlFVRnZReXhGUVVGRk8zTkNRVUYwUXl4SlFVRnZReXhEUVVGdVF5eFJRVUZSTzAxQlFWSXNVVUZCVVN4cFEwRkJSeXhwUWtGQlRUdE5RVUZGTEVkQlFVY3NSMEZCZGtJc1NVRkJiME1zUTBGQmFFSXNSMEZCUnp0TlFVRkZMRlZCUVZVc1IwRkJia01zU1VGQmIwTXNRMEZCV0N4VlFVRlZPenRCUVVNM1JDeE5RVUZKTEVWQlFVVXNSMEZCUnl3d1FrRkJVU3hGUVVGRkxFTkJRVU03VFVGRGJFSXNVMEZCVXl4SFFVRkhMRXRCUVVzN1RVRkRha0lzVDBGQlR5eEhRVUZITEVOQlFVTXNVMEZCVXl4RlFVRkZMRTFCUVUwc1JVRkJSU3hQUVVGUExFVkJRVVVzVjBGQlZ5eEZRVUZGTEZOQlFWTXNSVUZCUlN4UlFVRlJMRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVUU3TzBGQlJYSkdMRk5CUVU4c1EwRkJReXhQUVVGUExFTkJRVU1zVlVGQlFTeE5RVUZOTzFkQlFVa3NSVUZCUlN4RFFVRkRMRTFCUVUwc1EwRkJReXhIUVVGSExFbEJRVWtzUTBGQlF5eEpRVUZKTEVOQlFVTXNTVUZCU1N4RlFVRkZMRTFCUVUwc1EwRkJRenRIUVVGQkxFTkJRVU1zUTBGQlFUczdRVUZGTDBRc1NVRkJSU3hEUVVGRExFZEJRVWNzUTBGQlF5eFRRVUZUTEVWQlFVVXNXVUZCVFR0QlFVTjBRaXhYUVVGUExFTkJRVU1zVVVGQlVTeERRVUZETEVkQlFVY3NUMEZCVHl4RFFVRkRMRkZCUVZFc1EwRkJReXhKUVVGSkxGRkJRVkVzUTBGQlFUdEJRVU5xUkN4M1FrRkJUeXhMUVVGTExFTkJRVU1zVVVGQlVTeERRVUZETEVOQlFVRTdRVUZEZEVJc05rSkJRVXNzWVVGQllTeEZRVUZGTEdGQlFXRXNSVUZCUlN4RlFVRkRMR2xDUVVGcFFpeEZRVUZGTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZETEVOQlFVTXNRMEZCUVR0SFFVTnlSaXhEUVVGRExFTkJRVUU3UVVGRFJpeEpRVUZGTEVOQlFVTXNSMEZCUnl4RFFVRkRMRmxCUVZrc1JVRkJSU3hYUVVGWExFTkJRVU1zUTBGQlFUdEJRVU5xUXl4SlFVRkZMRU5CUVVNc1JVRkJSU3hEUVVGRExFOUJRVThzUlVGQlJTeFBRVUZQTEVOQlFVTXNRMEZCUVRzN1FVRkZka0lzU1VGQlJTeERRVUZETEZGQlFWRXNSMEZCUnl4UlFVRlJMRU5CUVVFN1FVRkRkRUlzU1VGQlJTeERRVUZETEZGQlFWRXNSMEZCUnp0WFFVRk5MSFZDUVVGMVFqdEhRVUZCTEVOQlFVRTdPMEZCUlRORExGTkJRVThzUlVGQlJTeERRVUZCT3p0QlFVVlVMRmRCUVZNc1NVRkJTU3hEUVVGRExFMUJRVTBzUlVGQlJTeEhRVUZITEVWQlFVVTdRVUZEZWtJc1VVRkJTU3hIUVVGSExFZEJRVWNzUlVGQlF5eFJRVUZSTEVWQlFWSXNVVUZCVVN4RlFVRkZMRTFCUVUwc1JVRkJUaXhOUVVGTkxFVkJRVVVzUjBGQlJ5eEZRVUZJTEVkQlFVY3NSVUZCUlN4SFFVRkhMRVZCUVVnc1IwRkJSeXhGUVVGRkxGVkJRVlVzUlVGQlZpeFZRVUZWTEVWQlFVTXNRMEZCUVRzN1FVRkZiRVFzVVVGQlNTeERRVUZETEZOQlFWTXNSVUZCUlN4alFVRmpMRVZCUVVVc1EwRkJRVHM3UVVGRmFFTXNVVUZCU1N4TlFVRk5MRWxCUVVrc1UwRkJVeXhKUVVGSkxHVkJRVThzUlVGQlJUczdRVUZEYkVNc1lVRkJUeXh4UWtGQlVTeGpRVUZqTEVOQlFVTXNZMEZCWXl4RlFVRkZMRVZCUVVNc1NVRkJTU3hGUVVGRkxFbEJRVWtzUlVGQlF5eEZRVUZGTzJWQlF6RkVMSEZDUVVGUkxHTkJRV01zUTBGQlF5eGxRVUZsTEVWQlFVVXNSMEZCUnl4RlFVRkZMRWxCUVVrc1JVRkJSU3hQUVVGUExFTkJRVU03VDBGQlFTeERRVU0xUkN4RFFVRkJPMHRCUTBZN08wRkJSVVFzZVVKQlFWRXNZMEZCWXl4RFFVRkRMR1ZCUVdVc1JVRkJSU3hIUVVGSExFVkJRVVVzU1VGQlNTeEZRVUZGTEU5QlFVOHNRMEZCUXl4RFFVRkJPenRCUVVVelJDeFJRVUZKTEUxQlFVMHNTVUZCU1N4UFFVRlBMRVZCUVVVN1FVRkRja0lzYVVKQlFWY3NSVUZCUlN4RFFVRkJPMHRCUTJRN1IwRkRSanM3UVVGRlJDeFhRVUZUTEZkQlFWY3NSMEZCUnp0QlFVTnlRaXhOUVVGRkxFTkJRVU1zUjBGQlJ5eERRVUZETEZsQlFWa3NSVUZCUlN4WFFVRlhMRU5CUVVNc1EwRkJRVHRCUVVOcVF5eFhRVUZQTEU5QlFVOHNRMEZCUXl4UlFVRlJMRU5CUVVNc1EwRkJRVHRCUVVONFFpeGhRVUZUTEVkQlFVY3NTMEZCU3l4RFFVRkJPMEZCUTJwQ0xIbENRVUZSTEVkQlFVY3NRMEZCUXl4bFFVRmxMRVZCUVVVc1UwRkJVeXhGUVVGRkxFOUJRVThzUTBGQlF5eERRVUZCTzBGQlEyaEVMRFpDUVVGTExGbEJRVmtzUlVGQlJTeGpRVUZqTEVWQlFVVXNSVUZCUlN4aFFVRmhMRVZCUVVVc2IwSkJRVThzU1VGQlNTeERRVUZETEZGQlFWRXNRMEZCUXl4RlFVRkZMR2xDUVVGcFFpeEZRVUZGTEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1QwRkJUeXhEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZETEVOQlFVTXNRMEZCUVR0SFFVTTFTRHM3UVVGRlJDeFhRVUZUTEdOQlFXTXNSMEZCUnp0QlFVTjRRaXhoUVVGVExFZEJRVWNzU1VGQlNTeERRVUZCTzBGQlEyaENMSGxDUVVGUkxFVkJRVVVzUTBGQlF5eGxRVUZsTEVWQlFVVXNVMEZCVXl4RlFVRkZMRTlCUVU4c1EwRkJReXhEUVVGQk8wZEJRMmhFT3p0QlFVVkVMRmRCUVZNc1UwRkJVeXhEUVVGRExFbEJRVWtzUlVGQlJTeEZRVUZGTEVWQlFVVTdRVUZETTBJc1VVRkJTU3hKUVVGSkxFTkJRVU1zVVVGQlVTeEpRVUZKTEZGQlFWRXNSVUZCUlN4UFFVRk5PMEZCUTNKRExGRkJRVWtzUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4SFFVRkhMRWxCUVVrc1JVRkJSU3hEUVVGQk96dEJRVVY0UWl4UlFVRkpMRWRCUVVjc1EwRkJReXhOUVVGTkxFbEJRVWtzUjBGQlJ5eERRVUZETEUxQlFVMHNRMEZCUXl4WFFVRlhMRVZCUVVVc1NVRkJTU3hQUVVGUExFVkJRVVU3UVVGRGNrUXNLMEpCUVVzc2NVSkJRWEZDTEVWQlFVVXNjMEpCUVhOQ0xFTkJRVU1zUTBGQlFUdEJRVU51UkN3clFrRkJTeXhoUVVGaExFVkJRVVVzYzBKQlFYTkNMRVZCUVVVc1IwRkJSeXhEUVVGRExFTkJRVUU3UzBGRGFrUTdPMEZCUlVRc1RVRkJSU3hEUVVGRExFbEJRVWtzUTBGQlF5eERRVUZCTzBGQlExSXNUVUZCUlN4RFFVRkRMRWxCUVVrc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVsQlFVa3NRMEZCUXl4SFFVRkhMRU5CUVVNc1EwRkJRVHRIUVVNNVFqdERRVU5HTEVOQlFVRTdPenM3T3p0QlFVMUVMRWxCUVVrc1IwRkJSeXhIUVVGSExFVkJRVVVzUTBGQlFUczdRVUZGV2l4SlFVRkpMRmxCUVZrc1IwRkJSeXhUUVVGbUxGbEJRVmtzUjBGQll6dEJRVU0xUWl4TlFVRkpMRVZCUVVVc1IwRkJSeXhGUVVGRkxFTkJRVUU3TzBGQlJWZ3NVVUZCVFN4RFFVRkRMRmxCUVZrc1IwRkJSeXhGUVVGRkxFTkJRVUU3TzBGQlJYaENMSFZDUVVGUkxFVkJRVVVzUTBGQlF5eGhRVUZoTEVWQlFVVXNWVUZCUVN4SlFVRkpMRVZCUVVrN1FVRkRhRU1zVjBGQlR5eERRVUZETEVkQlFVY3NRMEZCUXl4aFFVRmhMRVZCUVVVc1NVRkJTU3hEUVVGRExFVkJRVVVzUlVGQlJTeFBRVUZQTEVOQlFVTXNRMEZCUVR0QlFVTTFReXhYUVVGUExFTkJRVU1zU1VGQlNTeERRVUZETEVWQlFVVXNRMEZCUXl4RFFVRkRMRlZCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVRTdSMEZETjBNc1JVRkJSU3hQUVVGUExFVkJRVVVzU1VGQlNTeERRVUZETEVOQlFVRTdPMEZCUldwQ0xIVkNRVUZSTEVWQlFVVXNRMEZCUXl4bFFVRmxMRVZCUVVVc1UwRkJVeXhGUVVGRkxFOUJRVThzUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUVRzN1FVRkZja1FzU1VGQlJTeERRVUZETEU5QlFVOHNSMEZCUnl4UFFVRlBMRU5CUVVFN08wRkJSWEJDTEVsQlFVVXNRMEZCUXl4UlFVRlJMRWRCUVVjN1YwRkJUU3gxUWtGQmRVSTdSMEZCUVN4RFFVRkJPenRCUVVVelF5eFRRVUZQTEVWQlFVVXNRMEZCUVRzN096dEJRVWxVTEZkQlFWTXNVMEZCVXl4RFFVRkRMRWxCUVVrc1JVRkJSU3hGUVVGRkxFVkJRVVU3UVVGRE0wSXNVVUZCU1N4RFFVRkRMRWxCUVVrc1JVRkJSU3hQUVVGTk96dEJRVVZxUWl4UlFVRkpMRkZCUVZFc1IwRkJSeXhKUVVGSkxFTkJRVU1zVVVGQlVUdFJRVU40UWl4TlFVRk5MRWRCUVVjc1QwRkJUeXhEUVVGRExGRkJRVkVzUTBGQlF6dFJRVU14UWl4TlFVRk5MRWRCUVVjc1NVRkJTU3hEUVVGRExFMUJRVTA3VVVGRGNFSXNUMEZCVHl4SFFVRkhMRTFCUVUwc1NVRkJTU3hQUVVGUExFTkJRVUU3TzBGQlJTOUNMRkZCUVVrc1EwRkJReXhOUVVGTkxFbEJRVWtzVDBGQlR5eEZRVUZGTEU5QlFVMDdPMEZCUlRsQ0xGRkJRVWtzUTBGQlF5eE5RVUZOTEVWQlFVVTdRVUZEV0N4WlFVRk5MRWRCUVVjc1owSkJRV2RDTEVOQlFVTXNTVUZCU1N4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGQk8wRkJRekZETEdGQlFVOHNRMEZCUXl4UlFVRlJMRU5CUVVNc1IwRkJSeXhOUVVGTkxFTkJRVUU3UzBGRE0wSTdPMEZCUlVRc1VVRkJTU3hOUVVGTkxFVkJRVVU3UVVGRFZpeFpRVUZOTEVOQlFVTXNUVUZCVFN4RFFVRkRMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZCTzBGQlEzaENMRlZCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlR0QlFVTnlRaXhYUVVGSExFTkJRVU1zU1VGQlNTeFpRVUZGTEUxQlFVMHNSVUZCVGl4TlFVRk5MRWxCUVVzc1NVRkJTU3hEUVVGRExFZEJRVWNzUlVGQlJTeERRVUZCTzA5QlEyaERPMEZCUTBRc1ZVRkJTU3hQUVVGUExFVkJRVVVzVTBGQlV5eERRVUZETEZGQlFWRXNRMEZCUXl4RFFVRkJPMHRCUTJwRE8wZEJRMFk3TzBGQlJVUXNWMEZCVXl4VFFVRlRMRU5CUVVNc1VVRkJVU3hGUVVGRk8wRkJRek5DTEZGQlFVa3NRMEZCUXl4UFFVRlBMRU5CUVVNc1VVRkJVU3hEUVVGRExFVkJRVVVzVDBGQlRUdEJRVU01UWl4WFFVRlBMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUzBGQlN5eEZRVUZGTEVOQlFVRTdPMEZCUlhwQ0xGZEJRVThzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUXl4SlFVRkpMRWRCUVVjc1ZVRkJReXhMUVVGTExFVkJRVVVzUjBGQlJ5eEZRVUZMTEVWQlFVVXNRMEZCUVR0QlFVTXpReXhYUVVGUExFOUJRVThzUTBGQlF5eFJRVUZSTEVOQlFVTXNRMEZCUVR0SFFVTjZRanREUVVWR0xFTkJRVUU3TzBGQlIwUXNTVUZCU1N4blFrRkJaMElzUjBGQlJ5eFRRVUZ1UWl4blFrRkJaMElzUTBGQldTeE5RVUZOTEVWQlFVVXNVMEZCVXl4RlFVRkZPMEZCUTJwRUxFMUJRVWtzUlVGQlJTeEhRVUZITERSQ1FVRlZMRTFCUVUwc1EwRkJRenROUVVONFFpeFJRVUZSTEVkQlFVY3NUVUZCVFN4RFFVRkRMRkZCUVZFN1RVRkRNVUlzVjBGQlZ5eFpRVUZCTzAxQlFVVXNXVUZCV1N4SFFVRkhMRU5CUVVNN1RVRkJSU3g1UWtGQmVVSXNSMEZCUnl4TFFVRkxMRU5CUVVFN08wRkJSV3hGTEZGQlFVMHNRMEZCUXl4TlFVRk5MRU5CUVVNc1JVRkJSU3hGUVVGRk8wRkJRMmhDTEZGQlFVa3NSVUZCU2l4SlFVRkpPMEZCUTBvc1kwRkJWU3hGUVVGV0xGVkJRVlU3UVVGRFZpeFpRVUZSTEVWQlFVVTdZVUZCVFN3eVFrRkJNa0k3UzBGQlFUdEhRVU0xUXl4RFFVRkRMRU5CUVVFN08wRkJSVVlzVTBGQlR5eEZRVUZGTEVOQlFVRTdPMEZCUlZRc1YwRkJVeXhKUVVGSkxFTkJRVU1zUzBGQlN5eEZRVUZGTEVkQlFVY3NSVUZCUlRzN08wRkJSM2hDTEZGQlFVa3NXVUZCV1N4SFFVRkhMRlZCUVZVc1EwRkJReXhaUVVGTk8wRkJRMnhETEdGQlFVOHNRMEZCUXl4SFFVRkhMRU5CUVVNc1kwRkJZeXhEUVVGRExFTkJRVUU3UVVGRE0wSXNhMEpCUVZrc1JVRkJSU3hEUVVGQk8wRkJRMlFzVlVGQlNTeFpRVUZaTEVkQlFVY3NRMEZCUXl4SlFVRkpMRU5CUVVNc2VVSkJRWGxDTEVWQlFVVTdRVUZEYkVRc2FVTkJRVXNzV1VGQldTeEZRVUZGTERaQ1FVRTJRaXhGUVVGRkxFVkJRVVVzWlVGQlpTeEZRVUZGTEZsQlFWa3NSVUZCUlN4RFFVRkRMRU5CUVVFN1FVRkRjRVlzYVVOQlFYbENMRWRCUVVjc1NVRkJTU3hEUVVGQk8wOUJRMnBETzBGQlEwUXNWVUZCU1N4VFFVRlRMRWRCUVVjc1ZVRkJWU3hIUVVGSExIVkRRVUYxUXl4SFFVRkhMR2REUVVGblF5eERRVUZCTzBGQlEzWkhMQ3RDUVVGTExIRkNRVUZ4UWl4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGQk8wRkJRM1JETEZGQlFVVXNRMEZCUXl4TFFVRkxMRVZCUVVVc1EwRkJRVHRCUVVOV0xGRkJRVVVzUTBGQlF5eFBRVUZQTEVWQlFVVXNRMEZCUVR0QlFVTmFMR1ZCUVZNc1JVRkJSU3hEUVVGQk8wdEJRMW9zUlVGQlJTeEpRVUZKTEVOQlFVTXNRMEZCUVRzN1FVRkZVaXhSUVVGSkxFbEJRVWtzUjBGQlJ5eFhRVUZYTEVkQlFVY3NjMEpCUVhOQ0xFZEJRVWNzWlVGQlpTeERRVUZCTzBGQlEycEZMRmRCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zVTBGQlV5eEZRVUZGTEV0QlFVc3NSVUZCUlN4UlFVRlJMRVZCUVVVc1IwRkJSeXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZCTzBGQlEyeEVMRkZCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlR0QlFVTnlRaXhUUVVGSExFTkJRVU1zU1VGQlNTeFpRVUZGTEV0QlFVc3NSVUZCVEN4TFFVRkxMRWxCUVVzc1IwRkJSeXhGUVVGRkxFTkJRVUU3UzBGRE1VSTdRVUZEUkN4NVFrRkJVU3hSUVVGUkxFTkJRMlFzU1VGQlNTeEZRVU5LTEVWQlFVTXNVVUZCVVN4RlFVRlNMRkZCUVZFc1JVRkJSU3hMUVVGTExFVkJRVXdzUzBGQlN5eEZRVUZGTEVkQlFVY3NSVUZCU0N4SFFVRkhMRVZCUVVVc1JVRkJSU3hGUVVGRkxHbENRVUZOTEVWQlFVTXNSVUZEYkVNc1ZVRkJRU3hIUVVGSE8yRkJRVWtzUjBGQlJ5eEpRVUZKTEZsQlFWa3NRMEZCUXl4WlFVRlpMRU5CUVVNN1MwRkJRU3hGUVVONFF5eFBRVUZQTEVOQlExSXNRMEZCUVR0SFFVVkdPenRCUVVWRUxGZEJRVk1zVlVGQlZTeERRVUZETEVsQlFVa3NSVUZCUlR0QlFVTjRRaXhsUVVGWExFZEJRVWNzU1VGQlNTeERRVUZCTzBGQlEyeENMRmRCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zWjBKQlFXZENMRVZCUVVVc1NVRkJTU3hEUVVGRExFTkJRVUU3UjBGRGNFTTdRMEZGUml4RFFVRkJPenRCUVVWTkxGTkJRVk1zVFVGQlRTeEhRVUZITzBGQlEzWkNMRTFCUVVrc1RVRkJUU3hIUVVGSExFZEJRVWNzUTBGQlF5eExRVUZMTEVOQlFVTXNRMEZCUXl4RFFVRkRMRU5CUVVFN1FVRkRla0lzUzBGQlJ5eERRVUZETEUxQlFVMHNSMEZCUnl4RFFVRkRMRU5CUVVFN1FVRkRaQ3hUUVVGUExFMUJRVTBzUTBGQlFUdERRVU5rT3p0eFFrRkZZeXhOUVVGTklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUpwYlhCdmNuUWdabTl5WjJVZ1puSnZiU0FuWm05eVoyVW5YRzVwYlhCdmNuUWdaVzFwZEhSbGNpQm1jbTl0SUNkbGJXbDBkR1Z5SjF4dWFXMXdiM0owSUhkbFluTnZZMnRsZENCbWNtOXRJQ2QzWldKemIyTnJaWFFuWEc1cGJYQnZjblFnZEdsdFpYSnpJR1p5YjIwZ0p5NHZkR2x0WlhKekoxeHVhVzF3YjNKMElHMWxjM05oWjJVZ1puSnZiU0FuTGk5dFpYTnpZV2RsSjF4dWFXMXdiM0owSUh0bmRXbGtMQ0JwYzBKbmZTQm1jbTl0SUNjdUwzVjBhV3duWEc1cGJYQnZjblFnZTJOaGJHeDlJR1p5YjIwZ0p5NHZkSEpoWTJ0cGJtY3ZhVzVrWlhnblhHNXBiWEJ2Y25RZ2UybHpWR1Z6ZEgwZ1puSnZiU0FuTGk5amIyNW1hV2NuWEc1Y2JseHViR1YwSUhOdlkydGxkSE1nUFNCN2ZWeHVYRzVzWlhRZ1UyOWphMlYwSUQwZ1puVnVZM1JwYjI0b1kyOXVabWxuS1NCN1hHNGdJR2xtSUNnb0lXWnZjbWRsSUNZbUlDRjNhVzVrYjNjdWMyOWphMlYwVTJWeWRtVnlLU0I4ZkNCM2FXNWtiM2N1WjNKZlgxOXpZVzVrWW05NEtTQlRiMk5yWlhSVFpYSjJaWElvS1Z4dVhHNGdJR2xtSUNnaGFYTkNaeWdwS1NCN1hHNGdJQ0FnY21WMGRYSnVJRk52WTJ0bGRFTnNhV1Z1ZENoamIyNW1hV2NwWEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnVTI5amEyVjBVMlZ5ZG1WeUtDbGNibHh1ZlZ4dVhHNW1kVzVqZEdsdmJpQnZia1Z5Y205eUtHVXBJSHRjYmlBZ2FXWWdLR1VnUFQwZ0oyUnBjMk52Ym01bFkzUmxaQ2NwSUhKbGRIVnlibHh1SUNCc1pYUWdaR0YwWVNBOUlIdDlYRzRnSUdsbUlDaDBlWEJsYjJZZ1pTQTlQU0FuYzNSeWFXNW5KeWtnZTF4dUlDQWdJR1JoZEdFdWJYTm5JRDBnWlZ4dUlDQjlYRzRnSUdWc2MyVWdhV1lnS0dVdVpYSnliM0lwSUh0Y2JpQWdJQ0JrWVhSaExuSmxZV1I1VTNSaGRHVWdQU0JsTG1WeWNtOXlMbU4xY25KbGJuUlVZWEpuWlhRZ0ppWWdaUzVsY25KdmNpNWpkWEp5Wlc1MFZHRnlaMlYwTG5KbFlXUjVVM1JoZEdWY2JpQWdJQ0JrWVhSaExuSmxkSFZ5YmxaaGJIVmxJRDBnWlM1bGNuSnZjaTV5WlhSMWNtNVdZV3gxWlZ4dUlDQjlYRzVjYmlBZ1kyRnNiQ2duWm1Wc2IyY3VaWEp5YjNJbkxDQW5jMjlqYTJWMFgyWmhhV3duTENCa1lYUmhLVnh1WEc0Z0lHTnZibk52YkdVdVpYSnliM0lvSjJOaGNHa2daWEp5YjNJbkxDQmxLVnh1SUNCcFppQW9JWGRwYm1SdmR5NWxiV2wwS1NCbGJXbDBkR1Z5S0hkcGJtUnZkeWxjYmlBZ2QybHVaRzkzTG1WdGFYUW9KMkpuWlhKeWIzSW5MQ0JsSUh4OElDZDNhR1Z1SUhObGJtUWdiV1Z6YzJGblpTQjBieUIwYUdVZ2MyOWphMlYwSnlsY2JuMWNibHh1YkdWMElGTnZZMnRsZEVOc2FXVnVkQ0E5SUdaMWJtTjBhVzl1S0h0emIyTnJaWFJKWkNBOUlHZDFhV1FvS1N3Z2RYSnNMQ0IxYzJWVGRHRnVaRUo1ZlNrZ2UxeHVJQ0JzWlhRZ2JXVWdQU0JsYldsMGRHVnlLSHQ5S1N4Y2JpQWdJQ0JzYVhOMFpXNXBibWNnUFNCbVlXeHpaU3hjYmlBZ0lDQnRaWFJvYjJSeklEMGdXeWRqYjI1dVpXTjBKeXdnSjNObGJtUW5MQ0FuWTJ4dmMyVW5MQ0FuY21WamIyNXVaV04wSnl3Z0ozSmxiR1ZoYzJVbkxDQW5kM05RYkdGNUp5d2dKM2R6VUdGMWMyVW5YVnh1WEc0Z0lHMWxkR2h2WkhNdVptOXlSV0ZqYUNodFpYUm9iMlFnUFQ0Z2JXVmJiV1YwYUc5a1hTQTlJSE5sYm1RdVltbHVaQ2h1ZFd4c0xDQnRaWFJvYjJRcEtWeHVYRzRnSUcxbExtOXVaU2duWTI5dWJtVmpkQ2NzSUNncElEMCtJSHRjYmlBZ0lDQnpiMk5yWlhSelczTnZZMnRsZEVsa1hTQTlJSE52WTJ0bGRITmJjMjlqYTJWMFNXUmRJSHg4SUhOdlkydGxkRWxrWEc0Z0lDQWdkR2x0WlhKekxuTjBZWEowS0hOdlkydGxkRWxrS1Z4dUlDQWdJR05oYkd3b0oyWmxiRzluTG1WMlpXNTBKeXdnSjNOdlkydGxkRjl2Y0dWdUp5d2dleWRqZFhKeVpXNTBYM052WTJ0bGRITW5PaUJQWW1wbFkzUXVhMlY1Y3loemIyTnJaWFJ6S1M1c1pXNW5kR2g5S1Z4dUlDQjlLVnh1SUNCdFpTNXZibVVvSjJScGMyTnZibTVsWTNRbkxDQmpiR1ZoYmxOdlkydGxkQ2xjYmlBZ2JXVXViMjRvSjJWeWNtOXlKeXdnYjI1RmNuSnZjaWxjYmx4dUlDQnRaUzV6YjJOclpYUkpaQ0E5SUhOdlkydGxkRWxrWEc0Z0lHMWxMblJ2VTNSeWFXNW5JRDBnS0NrZ1BUNGdKMXR2WW1wbFkzUWdVMjlqYTJWMFEyeHBaVzUwWFNkY2JseHVJQ0J5WlhSMWNtNGdiV1ZjYmx4dUlDQm1kVzVqZEdsdmJpQnpaVzVrS0cxbGRHaHZaQ3dnWVhKbktTQjdYRzRnSUNBZ2JHVjBJRzF6WnlBOUlIdHpiMk5yWlhSSlpDd2diV1YwYUc5a0xDQmhjbWNzSUhWeWJDd2dkWE5sVTNSaGJtUkNlWDFjYmx4dUlDQWdJR2xtSUNnaGJHbHpkR1Z1YVc1bktTQnNhWE4wWlc1TlpYTnpZV2RsY3lncFhHNWNiaUFnSUNCcFppQW9iV1YwYUc5a0lEMDlJQ2RqYjI1dVpXTjBKeUFtSmlBaGFYTlVaWE4wS1NCN0x5OXlaV1p5WlhOb0lIVnpaWElnYzJWemMybHZiaUJsZG1WeWVTQXpNQ0J0YVc1Y2JpQWdJQ0FnSUhKbGRIVnliaUJ0WlhOellXZGxMbVZ0YVhSQ1lXTnJaM0p2ZFc1a0tDZDFjMlZ5T25KbFpuSmxjMmduTENCN2JHRjZlVG9nZEhKMVpYMHNJQ2dwSUQwK1hHNGdJQ0FnSUNBZ0lHMWxjM05oWjJVdVpXMXBkRUpoWTJ0bmNtOTFibVFvSjNOdlkydGxkQzFqYkdsbGJuUW5MQ0J0YzJjc0lHNTFiR3dzSUc5dVJYSnliM0lwWEc0Z0lDQWdJQ0FwWEc0Z0lDQWdmVnh1WEc0Z0lDQWdiV1Z6YzJGblpTNWxiV2wwUW1GamEyZHliM1Z1WkNnbmMyOWphMlYwTFdOc2FXVnVkQ2NzSUcxelp5d2diblZzYkN3Z2IyNUZjbkp2Y2lsY2JseHVJQ0FnSUdsbUlDaHRaWFJvYjJRZ1BUMGdKMk5zYjNObEp5a2dlMXh1SUNBZ0lDQWdZMnhsWVc1VGIyTnJaWFFvS1Z4dUlDQWdJSDFjYmlBZ2ZWeHVYRzRnSUdaMWJtTjBhVzl1SUdOc1pXRnVVMjlqYTJWMEtDa2dlMXh1SUNBZ0lHMWxMbTltWmlnblpHbHpZMjl1Ym1WamRDY3NJR05zWldGdVUyOWphMlYwS1Z4dUlDQWdJR1JsYkdWMFpTQnpiMk5yWlhSelczTnZZMnRsZEVsa1hWeHVJQ0FnSUd4cGMzUmxibWx1WnlBOUlHWmhiSE5sWEc0Z0lDQWdiV1Z6YzJGblpTNXZabVlvSjNOdlkydGxkQzF6WlhKMlpYSW5MQ0J2YmsxbGMzTmhaMlVzSUc5dVJYSnliM0lwWEc0Z0lDQWdZMkZzYkNnblptVnNiMmN1YVc1bWJ5Y3NJQ2R6YjJOclpYUmZZMnh2YzJVbkxDQjdJQ2RoWTNScGRtVmZkR2x0WlNjNklIUnBiV1Z5Y3k1emRHOXdLSE52WTJ0bGRFbGtLU3dnSjJOMWNuSmxiblJmYzI5amEyVjBjeWM2SUU5aWFtVmpkQzVyWlhsektITnZZMnRsZEhNcExteGxibWQwYUgwcFhHNGdJSDFjYmx4dUlDQm1kVzVqZEdsdmJpQnNhWE4wWlc1TlpYTnpZV2RsY3lncElIdGNiaUFnSUNCc2FYTjBaVzVwYm1jZ1BTQjBjblZsWEc0Z0lDQWdiV1Z6YzJGblpTNXZiaWduYzI5amEyVjBMWE5sY25abGNpY3NJRzl1VFdWemMyRm5aU3dnYjI1RmNuSnZjaWxjYmlBZ2ZWeHVYRzRnSUdaMWJtTjBhVzl1SUc5dVRXVnpjMkZuWlNoa1lYUmhMQ0JqWWlrZ2UxeHVJQ0FnSUdsbUlDaGtZWFJoTG5OdlkydGxkRWxrSUNFOUlITnZZMnRsZEVsa0tTQnlaWFIxY201Y2JpQWdJQ0JzWlhRZ2JYTm5JRDBnWkdGMFlTNXRjMmNnZkh3Z2UzMWNiaUFnSUNBdkx5QmpiMjV6YjJ4bExteHZaeWduYVc0Z1kyeHBaVzUwSnl3Z1pHRjBZUzVsZG1WdWRDd2djMjlqYTJWMFNXUXNJR1JoZEdFdWFXUXNJRzF6WnlsY2JpQWdJQ0JwWmlBb2JYTm5MbUZqZEdsdmJpQW1KaUJ0YzJjdVlXTjBhVzl1TG5SdlRHOTNaWEpEWVhObEtDa2dQVDBnSjJWeWNtOXlKeWtnZTF4dUlDQWdJQ0FnWTJGc2JDZ25jM1JoZEhOakxuVnBMbWx1WTNKbGJXVnVkQ2NzSUNkemRHRmlhV3hwZEhrNlkyRndhVjlsY25KdmNpY3BYRzRnSUNBZ0lDQmpZV3hzS0NkbVpXeHZaeTVsZG1WdWRDY3NJQ2R6ZEdGaWFXeHBkSGt1WTJGd2FWOWxjbkp2Y2ljc0lHMXpaeWxjYmlBZ0lDQjlYRzVjYmlBZ0lDQmpZaWduYjJzbktWeHVJQ0FnSUcxbExtVnRhWFFvWkdGMFlTNWxkbVZ1ZEN3Z1pHRjBZUzV0YzJjcFhHNGdJSDFjYm4xY2JseHVMeTg5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFQwOVBUMDlQVDA5UFZ4dUx5OTNiM0pyY3lCcGJpQmlaeUJ3WVdkbFhHNHZMMXh1WEc1c1pYUWdiRzluSUQwZ1cxMWNibHh1YkdWMElGTnZZMnRsZEZObGNuWmxjaUE5SUdaMWJtTjBhVzl1S0NrZ2UxeHVJQ0JzWlhRZ2JXVWdQU0I3ZlZ4dVhHNGdJSGRwYm1SdmR5NXpiMk5yWlhSVFpYSjJaWElnUFNCdFpWeHVYRzRnSUcxbGMzTmhaMlV1YjI0b0oybG1jbUZ0WlMxdGIyUmxKeXdnWkdGMFlTQTlQaUI3WEc0Z0lDQWdZMjl1YzI5c1pTNXNiMmNvSjBsR1VrRk5SU0JOVDBSRkp5d2daR0YwWVM1cFpDd2djMjlqYTJWMGN5bGNiaUFnSUNCemIyTnJaWFJ6VzJSaGRHRXVhV1JkTG1sbWNtRnRaVTF2WkdVb1pHRjBZUzVwWm5KaGJXVk5iMlJsS1Z4dUlDQjlMQ0J2YmtWeWNtOXlMQ0IwY25WbEtWeHVYRzRnSUcxbGMzTmhaMlV1YjI0b0ozTnZZMnRsZEMxamJHbGxiblFuTENCdmJrMWxjM05oWjJVc0lHOXVSWEp5YjNJc0lIUnlkV1VwWEc1Y2JpQWdiV1V1YzI5amEyVjBjeUE5SUhOdlkydGxkSE5jYmx4dUlDQnRaUzUwYjFOMGNtbHVaeUE5SUNncElEMCtJQ2RiYjJKcVpXTjBJRk52WTJ0bGRGTmxjblpsY2wwblhHNWNiaUFnY21WMGRYSnVJRzFsWEc1Y2JpQWdMeTg5UFQwOVBUMDlQVDA5UFQxY2JseHVJQ0JtZFc1amRHbHZiaUJ2YmsxbGMzTmhaMlVvWkdGMFlTd2dZMklwSUh0Y2JpQWdJQ0JwWmlBb0lXUmhkR0VwSUhKbGRIVnlibHh1WEc0Z0lDQWdiR1YwSUhOdlkydGxkRWxrSUQwZ1pHRjBZUzV6YjJOclpYUkpaQ3hjYmlBZ0lDQWdJQ0FnYzI5amEyVjBJRDBnYzI5amEyVjBjMXR6YjJOclpYUkpaRjBzWEc0Z0lDQWdJQ0FnSUcxbGRHaHZaQ0E5SUdSaGRHRXViV1YwYUc5a0xGeHVJQ0FnSUNBZ0lDQnBjME5zYjNObElEMGdiV1YwYUc5a0lEMDlJQ2RqYkc5elpTZGNibHh1SUNBZ0lHbG1JQ2doYzI5amEyVjBJQ1ltSUdselEyeHZjMlVwSUhKbGRIVnlibHh1WEc0Z0lDQWdhV1lnS0NGemIyTnJaWFFwSUh0Y2JpQWdJQ0FnSUhOdlkydGxkQ0E5SUVKaFkydG5jbTkxYm1SVGIyTnJaWFFvWkdGMFlTd2diMjV5Wld4bFlYTmxLVnh1SUNBZ0lDQWdjMjlqYTJWMGMxdHpiMk5yWlhSSlpGMGdQU0J6YjJOclpYUmNiaUFnSUNCOVhHNWNiaUFnSUNCcFppQW9iV1YwYUc5a0tTQjdYRzRnSUNBZ0lDQnpiMk5yWlhSYmJXVjBhRzlrWFNoa1lYUmhMbUZ5WnlsY2JpQWdJQ0FnSUdsbUlDZ2hjSEp2WTJWemN5NWxibll1VUZKUFJDa2dlMXh1SUNBZ0lDQWdJQ0JzYjJjdWNIVnphQ2g3YldWMGFHOWtMQ0F1TGk1a1lYUmhMbUZ5WjMwcFhHNGdJQ0FnSUNCOVhHNGdJQ0FnSUNCcFppQW9hWE5EYkc5elpTa2diMjV5Wld4bFlYTmxLSE52WTJ0bGRFbGtLVnh1SUNBZ0lIMWNiaUFnZlZ4dVhHNGdJR1oxYm1OMGFXOXVJRzl1Y21Wc1pXRnpaU2h6YjJOclpYUkpaQ2tnZTF4dUlDQWdJR2xtSUNnaGMyOWphMlYwYzF0emIyTnJaWFJKWkYwcElISmxkSFZ5Ymx4dUlDQWdJSE52WTJ0bGRITmJjMjlqYTJWMFNXUmRMbU5zYjNObEtDbGNiaUFnSUNBdkwzTm9iM1ZzWkNCdWIzUWdaVzFwZENCaGJubDBhR2x1WnlCaFpuUmxjaUJqYkc5emFXNW5YRzRnSUNBZ2MyOWphMlYwYzF0emIyTnJaWFJKWkYwdVpXMXBkQ0E5SUNobGRtVnVkQ3dnYlhObktTQTlQaUI3ZlZ4dUlDQWdJR1JsYkdWMFpTQnpiMk5yWlhSelczTnZZMnRsZEVsa1hWeHVJQ0I5WEc1Y2JuMWNibHh1WEc1c1pYUWdRbUZqYTJkeWIzVnVaRk52WTJ0bGRDQTlJR1oxYm1OMGFXOXVLR052Ym1acFp5d2diMjV5Wld4bFlYTmxLU0I3WEc0Z0lHeGxkQ0IzY3lBOUlIZGxZbk52WTJ0bGRDaGpiMjVtYVdjcExGeHVJQ0FnSUhOdlkydGxkRWxrSUQwZ1kyOXVabWxuTG5OdlkydGxkRWxrTEZ4dUlDQWdJRjlwWm5KaGJXVk5iMlJsTENCeVpXeGxZWE5sUTI5MWJuUWdQU0F3TENCMGIyOUdjbVZ4ZFdWdWRGSmxiR1ZoYzJWVWNtRmphMlZrSUQwZ1ptRnNjMlZjYmx4dUlDQlBZbXBsWTNRdVlYTnphV2R1S0hkekxDQjdYRzRnSUNBZ1pXMXBkQ3hjYmlBZ0lDQnBabkpoYldWTmIyUmxMRnh1SUNBZ0lIUnZVM1J5YVc1bk9pQW9LU0E5UGlBblcyOWlhbVZqZENCQ1lXTnJaM0p2ZFc1a1UyOWphMlYwWFNkY2JpQWdmU2xjYmx4dUlDQnlaWFIxY200Z2QzTmNibHh1SUNCbWRXNWpkR2x2YmlCbGJXbDBLR1YyWlc1MExDQnRjMmNwSUh0Y2JpQWdJQ0F2TDIxdmJtbDBiM0pwYm1jdWRHbHRaWElvS1Z4dVhHNGdJQ0FnYkdWMElISmxiR1ZoYzJWVWFXMWxjaUE5SUhObGRGUnBiV1Z2ZFhRb0tDa2dQVDRnZTF4dUlDQWdJQ0FnWTI5dWMyOXNaUzVzYjJjb0owTk1UMU5GSUZOUFEwdEZWQ2NwWEc0Z0lDQWdJQ0J5Wld4bFlYTmxRMjkxYm5RcksxeHVJQ0FnSUNBZ2FXWWdLSEpsYkdWaGMyVkRiM1Z1ZENBK0lEY2dKaVlnSVhSdmIwWnlaWEYxWlc1MFVtVnNaV0Z6WlZSeVlXTnJaV1FwSUh0Y2JpQWdJQ0FnSUNBZ1kyRnNiQ2duWm1Wc2IyY3VkMkZ5Ymljc0lDZDBiMjlmWm5KbGNYVmxiblJmYzI5amEyVjBYM0psYkdWaGMyVW5MQ0I3SUNkeVpXeGxZWE5sWDJOdmRXNTBKem9nY21Wc1pXRnpaVU52ZFc1MElIMHBYRzRnSUNBZ0lDQWdJSFJ2YjBaeVpYRjFaVzUwVW1Wc1pXRnpaVlJ5WVdOclpXUWdQU0IwY25WbFhHNGdJQ0FnSUNCOVhHNGdJQ0FnSUNCc1pYUWdjM1JoZEhOalMyVjVJRDBnYVdaeVlXMWxUVzlrWlNBL0lDZHpiMk5yWlhSZmRHbHRaVzkxZEY5amJHOXpaVjlwWm5KaGJXVTZjM1JoWW1sc2FYUjVKeUE2SUNkemIyTnJaWFJmZEdsdFpXOTFkRjlqYkc5elpUcHpkR0ZpYVd4cGRIa25YRzRnSUNBZ0lDQmpZV3hzS0NkemRHRjBjMk11ZFdrdWFXNWpjbVZ0Wlc1MEp5d2djM1JoZEhOalMyVjVLVnh1SUNBZ0lDQWdkM011WTJ4dmMyVW9LVnh1SUNBZ0lDQWdkM011Y21Wc1pXRnpaU2dwWEc0Z0lDQWdJQ0J2Ym5KbGJHVmhjMlVvS1Z4dUlDQWdJSDBzSURVd01EQXBYRzVjYmlBZ0lDQnNaWFFnZEhsd1pTQTlJRjlwWm5KaGJXVk5iMlJsSUQ4Z0ozTnZZMnRsZEMxelpYSjJaWEl0YVdaeVlXMWxKeUE2SUNkemIyTnJaWFF0YzJWeWRtVnlKMXh1SUNBZ0lHTnZibk52YkdVdWJHOW5LQ2RtY205dElIZHpKeXdnWlhabGJuUXNJSE52WTJ0bGRFbGtMQ0J0YzJjc0lIUjVjR1VwWEc0Z0lDQWdhV1lnS0NGd2NtOWpaWE56TG1WdWRpNVFVazlFS1NCN1hHNGdJQ0FnSUNCc2IyY3VjSFZ6YUNoN1pYWmxiblFzSUM0dUxtMXpaMzBwWEc0Z0lDQWdmVnh1SUNBZ0lHMWxjM05oWjJVdVpXMXBkRlJoWW5Nb1hHNGdJQ0FnSUNCMGVYQmxMRnh1SUNBZ0lDQWdlM052WTJ0bGRFbGtMQ0JsZG1WdWRDd2diWE5uTENCcFpEb2daM1ZwWkNncGZTeGNiaUFnSUNBZ0lHMXpaeUE5UGlCdGMyY2dKaVlnWTJ4bFlYSlVhVzFsYjNWMEtISmxiR1ZoYzJWVWFXMWxjaWtzWEc0Z0lDQWdJQ0J2YmtWeWNtOXlYRzRnSUNBZ0tWeHVYRzRnSUgxY2JseHVJQ0JtZFc1amRHbHZiaUJwWm5KaGJXVk5iMlJsS0dselQyNHBJSHRjYmlBZ0lDQmZhV1p5WVcxbFRXOWtaU0E5SUdselQyNWNiaUFnSUNCamIyNXpiMnhsTG14dlp5Z25WVk5GSUVWWVZDQlRUME5MUlZRbkxDQnBjMDl1S1Z4dUlDQjlYRzVjYm4xY2JseHVaWGh3YjNKMElHWjFibU4wYVc5dUlHZGxkRXh2WnlncElIdGNiaUFnYkdWMElISmxjM1ZzZENBOUlHeHZaeTV6YkdsalpTZ3dLVnh1SUNCc2IyY3ViR1Z1WjNSb0lEMGdNRnh1SUNCeVpYUjFjbTRnY21WemRXeDBYRzU5WEc1Y2JtVjRjRzl5ZENCa1pXWmhkV3gwSUZOdlkydGxkRnh1SWwxOSIsIi8qIEBmbG93ICovXG5sZXQgdGltZXJzID0ge31cbmV4cG9ydCBkZWZhdWx0IHtcbiAgc3RhcnQoaWQ6IHN0cmluZykge1xuICAgIHRpbWVyc1tpZF0gPSBEYXRlLm5vdygpXG4gIH0sXG5cbiAgc3RvcChpZDogc3RyaW5nKTogbnVtYmVyIHtcbiAgICBsZXQgcGFzc2VkID0gdGhpcy5wYXNzZWQoaWQpXG4gICAgZGVsZXRlIHRpbWVyc1tpZF1cbiAgICByZXR1cm4gcGFzc2VkXG4gIH0sXG5cbiAgcGFzc2VkKGlkOiBzdHJpbmcpOiBudW1iZXIge1xuICAgIGlmICghaWQgfHwgIXRpbWVyc1tpZF0pIHJldHVybiAwXG4gICAgcmV0dXJuIERhdGUubm93KCkgLSB0aW1lcnNbaWRdXG4gIH1cbn1cbiIsImltcG9ydCBtZXNzYWdlIGZyb20gJy4uL21lc3NhZ2UnXG5pbXBvcnQge2dldERvbWFpbn0gZnJvbSAnLi4vbG9jYXRpb24nXG5pbXBvcnQge2lzQmcsIGlzUG9wdXAsIGlzU2FmYXJpLCBfZn0gZnJvbSAnLi4vdXRpbCdcbmltcG9ydCB0cmFja2VyIGZyb20gJy4vdHJhY2tlcidcbmltcG9ydCBmZWxvZyBmcm9tICcuL2ZlbG9nUGl4ZWwnXG5pbXBvcnQgc3RhdHNjIGZyb20gJy4vc3RhdHNjUGl4ZWwnXG5cblxubGV0IGxvZyA9IFtdXG5cbm1lc3NhZ2Uub24oJ3RyYWNraW5nLWNhbGwnLCAoe21zZywgZGF0YX0sIGNiID0gX2YpID0+IGNhbGwobXNnLCAuLi5kYXRhKSAmJiBjYigpKVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsbChtc2csIC4uLnBhcmFtcykge1xuICBpZiAoaXNCZygpIHx8IChpc1BvcHVwKCkgJiYgaXNTYWZhcmkoKSkpIHtcbiAgICByZXR1cm4gc2V0VGltZW91dCgoKSA9PiBjYWxsQXN5bmMobXNnLCBwYXJhbXMpLCAyMClcbiAgfVxuXG4gIGNvbnN0IGlzRmVsb2cgPSBtc2cuaW5jbHVkZXMoJ2ZlbG9nJylcbiAgY29uc3QgZGF0YSA9IGlzRmVsb2cgPyBleHRlbmRGZWxvZ0RhdGEocGFyYW1zKSA6IHBhcmFtc1xuICBjb25zdCBXQUlUX1RJTUVPVVQgPSAxMDAwMFxuICBjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiBlcnJvckhhbmRsZSgndGltZW91dCBjYWxsIHRocm91Z2ggYmcgcGFnZScpLCBXQUlUX1RJTUVPVVQpXG4gIGNvbnN0IHByZXZlbnRUaW1lb3V0ID0gKCkgPT4gY2xlYXJJbnRlcnZhbCh0aW1lb3V0KVxuICBjb25zdCBlcnJvckhhbmRsZSA9IGUgPT4ge1xuICAgIHByZXZlbnRUaW1lb3V0KClcbiAgICBpZiAoaXNGZWxvZykgcmV0dXJuIGZlbG9nKC4uLmRhdGEpXG4gICAgaWYgKG1zZy5pbmNsdWRlcygnc3RhdHNjLnVpLmluY3JlbWVudCcpKSByZXR1cm4gc3RhdHNjKG1zZy5zcGxpdCgnLicpLnBvcCgpLCAuLi5kYXRhKVxuICAgIGNvbnNvbGUud2FybihgdHJhY2tpbmcgY2FsbCAke21zZ30gZmFpbGVkLCByZWFzb246IGAsIGUpXG4gIH1cblxuICBtZXNzYWdlLmVtaXRCYWNrZ3JvdW5kKCd0cmFja2luZy1jYWxsJywge21zZywgZGF0YX0sIHByZXZlbnRUaW1lb3V0LCBlcnJvckhhbmRsZSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGxBc3luYyhtc2csIGRhdGEpIHtcbiAgY29uc3QgYXJncyA9IG1zZy5zcGxpdCgnLicpLFxuICAgIG1ldGhvZCA9IGFyZ3MucG9wKCksXG4gICAgY3R4ID0gYXJncy5yZWR1Y2UoKGNsb3N1cmUsIHBhcnQpID0+XG4gICAgICAocGFydCBpbiBjbG9zdXJlKSA/IGNsb3N1cmVbcGFydF0gOiB7fSwgdHJhY2tlcigpKVxuXG4gIGlmICghY3R4IHx8ICFjdHhbbWV0aG9kXSkgcmV0dXJuIGNvbnNvbGUuZXJyb3IoYE5vIG1ldGhvZCAke21zZ30gaW4gdHJhY2tlciBvYmplY3RgKVxuXG4gIGN0eFttZXRob2RdKC4uLmRhdGEpXG4gIGxvZ0NhbGwobXNnLCBkYXRhKVxufVxuXG5mdW5jdGlvbiBsb2dDYWxsKG1zZywgZGF0YSkge1xuICBjb25zb2xlLmluZm8obXNnLCBkYXRhKVxuXG4gIGlmICghcHJvY2Vzcy5lbnYuUFJPRCkge1xuICAgIGxvZy5wdXNoKHttc2csIC4uLmRhdGF9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGV4dGVuZEZlbG9nRGF0YShwYXJhbXMgPSBbXSkge1xuICBjb25zdCByZXF1ZXN0ID0ge1xuICAgIHVybDogZ2V0RG9tYWluKCksXG4gICAgaGVhZGVyczoge1xuICAgICAgJ1VzZXItQWdlbnQnOiBuYXZpZ2F0b3IudXNlckFnZW50XG4gICAgfVxuICB9XG5cbiAgaWYgKHBhcmFtcy5sZW5ndGggPCAyKSByZXR1cm4gW3BhcmFtc1swXSwge3JlcXVlc3R9XVxuXG4gIGNvbnN0IGRhdGEgPSBwYXJhbXNbMV1cbiAgY29uc3QgZXh0cmEgPSAodHlwZW9mIGRhdGEgPT0gJ3N0cmluZycpID8ge21lc3NhZ2U6IGRhdGF9IDogZGF0YVxuXG4gIHJldHVybiBbcGFyYW1zWzBdLCB7Li4uZXh0cmEsIHJlcXVlc3R9LCAuLi5wYXJhbXMuc2xpY2UoMildXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMb2coKSB7XG4gIGNvbnN0IHJlc3VsdCA9IGxvZy5zbGljZSgwKVxuICBsb2cubGVuZ3RoID0gMFxuICByZXR1cm4gcmVzdWx0XG59XG4iLCJpbXBvcnQge1VSTFMsIEZFTE9HLCBnZXRWZXJzaW9ufSBmcm9tICcuLi9jb25maWcnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIChtZXNzYWdlLCBleHRyYSkge1xuICBsZXQgc2VuZCA9IHt9XG5cbiAgdHJ5IHtcbiAgICBKU09OLnN0cmluZ2lmeShleHRyYSlcbiAgICBzZW5kID0gZXh0cmFcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgY29uc29sZS5lcnJvcihlKVxuICB9XG5cbiAgbGV0IGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpLFxuICAgIGRhdGEgPSB7XG4gICAgICBsb2dnZXI6ICdqYXZhc2NyaXB0JyxcbiAgICAgIHBsYXRmb3JtOiAnamF2YXNjcmlwdCcsXG4gICAgICB0YWdzOiB7XG4gICAgICAgIGFwcGxpY2F0aW9uOiAnYnJvd3NlcnBsdWdpbicsXG4gICAgICAgIGZyb21QaXhlbDogdHJ1ZSxcbiAgICAgICAgY29tbWl0OiBnZXRWZXJzaW9uKCksXG4gICAgICAgIHZlcnNpb246IGdldFZlcnNpb24oKVxuICAgICAgfSxcbiAgICAgIG1lc3NhZ2UsXG4gICAgICBleHRyYTogc2VuZFxuICAgIH0sXG4gICAgc3JjID0gYGh0dHBzOi8vJHtVUkxTLnJhdmVufS9hcGkvJHtGRUxPRy5wcm9qZWN0fS9zdG9yZS9cbj9zZW50cnlfdmVyc2lvbj00XG4mc2VudHJ5X2NsaWVudD1yYXZlbi1qcy8xLjEuMTZcbiZzZW50cnlfa2V5PSR7RkVMT0cua2V5fVxuJnNlbnRyeV9kYXRhPSR7ZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGRhdGEpKX1gXG5cbiAgaW1nLnNyYyA9IHNyY1xuXG4gIHJldHVybiBpbWdcbn1cbiIsImltcG9ydCBwYWdlQ29va2llIGZyb20gJ2Nvb2tpZSdcbmltcG9ydCBwcmVNaXhwYW5lbCBmcm9tICd2ZW5kb3IvbWl4cGFuZWwnXG5pbXBvcnQgbG9hZE1peHBhbmVsIGZyb20gJ3ZlbmRvci9taXhwYW5lbC0yLjInXG5pbXBvcnQgcHJlZnMgZnJvbSAnLi4vcHJlZnMnXG5pbXBvcnQgbWVzc2FnZSBmcm9tICcuLi9tZXNzYWdlJ1xuaW1wb3J0IGZvcmdlQ29va2llIGZyb20gJy4uL2JnL2Nvb2tpZSdcbmltcG9ydCB7Z2V0RG9tYWlufSBmcm9tICcuLi9sb2NhdGlvbidcbmltcG9ydCB7aXNCZywgaXNGRiwgZ2V0QnJvd3Nlcn0gZnJvbSAnLi4vdXRpbCdcbmltcG9ydCB7VVJMUywgRkVMT0csIFNUQVRTQywgREFQSSwgR05BUiwgTUlYUEFORUwsIGdldFZlcnNpb259IGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCBvbiBmcm9tICcuL29uJ1xuaW1wb3J0IHtjYWxsLCBnZXRMb2d9IGZyb20gJy4vY2FsbCdcbmltcG9ydCBmb3JnZSBmcm9tICcuLi9mb3JnZSdcbmltcG9ydCB0cmFja2VyIGZyb20gJy4vdHJhY2tlcidcblxubGV0IGVtaXQgPSBtZXNzYWdlLmVtaXRCYWNrZ3JvdW5kXG5cblxuZnVuY3Rpb24gaW5pdEJnT3JQb3B1cCgpIHtcbiAgY29uc3QgY3VzdG9tQWpheCA9ICgoKSA9PiBpc0ZGKCkgJiYgZm9yZ2UucmVxdWVzdC5hamF4KSgpXG4gIHByZU1peHBhbmVsKClcbiAgbG9hZE1peHBhbmVsKClcbiAgcmVxdWlyZSgndHJhY2tlcicpXG5cbiAgdHJhY2tlcigpLmluaXQoe1xuICAgIG1peHBhbmVsOiB7XG4gICAgICBrZXk6IE1JWFBBTkVMLmtleSxcbiAgICAgIHFhS2V5OiBNSVhQQU5FTC5xYUtleSxcbiAgICAgIGRhcGk6IERBUEksXG4gICAgICBhamF4OiBjdXN0b21BamF4XG4gICAgfSxcbiAgICBnbmFyOiB7XG4gICAgICB1cmw6IEdOQVIudXJsLFxuICAgICAgcWFVcmw6IEdOQVIucWFVcmwsXG4gICAgICBhcHA6IGAke2dldEJyb3dzZXIoKX1FeHRgLFxuICAgICAgYXBwVmVyc2lvbjogZ2V0VmVyc2lvbigpLFxuICAgICAgYWpheDogY3VzdG9tQWpheFxuICAgIH0sXG4gICAgZmVsb2c6IHtcbiAgICAgIGFwcGxpY2F0aW9uOiAnYnJvd3NlcnBsdWdpbicsXG4gICAgICBrZXk6IEZFTE9HLmtleSxcbiAgICAgIHVybDogVVJMUy5yYXZlbixcbiAgICAgIHByb2plY3Q6IEZFTE9HLnByb2plY3QsXG4gICAgICBjb21taXQ6IGdldFZlcnNpb24oKSxcbiAgICAgIHZlcnNpb246IGdldFZlcnNpb24oKSxcbiAgICAgIHJlYWR5T25TZXRVc2VyOiB0cnVlXG4gICAgfSxcbiAgICBzdGF0c2M6IHtcbiAgICAgIHVybDogU1RBVFNDLlVSTFxuICAgIH1cbiAgfSlcblxuICB0cmFja2VyKCkuc3RhdHNjLmNyZWF0ZVJvb3Qoe1xuICAgIHByZWZpeDogU1RBVFNDLlBSRUZJWCxcbiAgICBwb3N0Zml4OiBgJHtnZXRCcm93c2VyKCl9LmV4dGVuc2lvbi53b3JsZGAsXG4gICAgaWQ6ICd1aSdcbiAgfSlcblxuICBtZXNzYWdlLm9uKCd0cmFja2luZy1maXJlJywgKHttc2csIGRhdGF9KSA9PiBmaXJlKG1zZywgLi4uZGF0YSkpXG5cblxuICAvL2luaXQgTVAgZm9yIHVzZXJzLCB3aGljaCBoYXZlIE1QIGNvb2tpZSBhbHJlYWR5XG4gIGZvcmdlQ29va2llLmdldCgnLmdyYW1tYXJseS5jb20nLCBNSVhQQU5FTC5jb29raWUsIGNvb2tpZU1QID0+IHtcbiAgICBpZiAoY29va2llTVApIHtcbiAgICAgIGluaXRNUChjb29raWVNUClcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwcmVmcy5nZXQoJ21wQ29va2llJywgaW5pdE1QKVxuICAgIH1cbiAgfSlcblxuICBmdW5jdGlvbiBpbml0TVAgKG1wQ29va2llKSB7XG4gICAgaWYgKCFtcENvb2tpZSkgcmV0dXJuXG5cbiAgICB3aW5kb3cubWl4cGFuZWwucGVyc2lzdGVuY2UubG9hZCgpXG4gICAgY2FsbCgnbWl4cGFuZWwuc2V0UHJvcHMnLCB7XG4gICAgICBnUHJvZHVjdDogYEV4dGVuc2lvbi0ke2dldEJyb3dzZXIoKX1gLFxuICAgICAgZnVsbFByb2R1Y3RWZXJzaW9uOiBnZXRWZXJzaW9uKClcbiAgICB9LCAnRXh0JylcbiAgfVxuXG4gIG1lc3NhZ2Uub24oJ3RyYWNrZXItaW5pdCcsICh7bXBDb29raWUsIGduYXIsIGRhcGl9KSA9PiB7XG4gICAgcHJlZnMuc2V0KCdtcENvb2tpZScsIG1wQ29va2llKVxuXG4gICAgbGV0IGRvbWFpbiA9IGdldERvbWFpbigpLFxuICAgICAgY29va2llT3B0aW9ucyA9IHtcbiAgICAgICAgcGF0aDogJy8nLFxuICAgICAgICBkb21haW46IGRvbWFpbi5pbmNsdWRlcygnLmdyYW1tYXJseS5jb20nKSA/ICcuZ3JhbW1hcmx5LmNvbScgOiBkb21haW4sXG4gICAgICAgIC8vIHllYXIgZnJvbSBub3dcbiAgICAgICAgZXhwaXJlczogbmV3IERhdGUobmV3IERhdGUoKS5zZXRZZWFyKG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKSArIDEpKVxuICAgICAgfVxuXG4gICAgcGFnZUNvb2tpZShNSVhQQU5FTC5jb29raWUsIG51bGwpXG4gICAgcGFnZUNvb2tpZShNSVhQQU5FTC5jb29raWUsIG1wQ29va2llLCBjb29raWVPcHRpb25zKVxuXG4gICAgdXBkYXRlSWQoJ2duYXJfY29udGFpbmVySWQnLCBnbmFyKVxuICAgIHVwZGF0ZUlkKCdfX2ZuZ3Jwcm50X18nLCBkYXBpKVxuXG4gICAgZnVuY3Rpb24gdXBkYXRlSWQoaWQsIHZhbHVlKSB7XG4gICAgICBpZiAoIXZhbHVlKSByZXR1cm5cblxuICAgICAgcHJlZnMuc2V0KGlkLCB2YWx1ZSlcbiAgICAgIHBhZ2VDb29raWUoaWQsIG51bGwpXG4gICAgICBwYWdlQ29va2llKGlkLCB2YWx1ZSwgY29va2llT3B0aW9ucylcbiAgICB9XG4gIH0pXG5cbiAgZmlyZSgnYWN0aXZpdHktcGluZycpXG59XG5cbmZ1bmN0aW9uIGZpcmUgKG1zZywgLi4uZGF0YSkge1xuICBpZiAoaXNCZygpKSB7XG4gICAgaWYgKCFvblttc2ddKSByZXR1cm4gY29uc29sZS5lcnJvcihgTm8gaGFuZGxlciBzcGVjaWZpZWQgZm9yIG1lc3NhZ2U6ICR7bXNnfWApXG4gICAgc2V0VGltZW91dCgoKSA9PiBvblttc2ddKC4uLmRhdGEpLCAyMClcbiAgfVxuICBlbHNlIHtcbiAgICBlbWl0KCd0cmFja2luZy1maXJlJywge21zZywgZGF0YX0pXG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdENvbnRlbnRTY3JpcHQoKSB7XG4gIGxldCB0aW1lcyA9IDAsXG4gICAgbWF4ID0gMTAsXG4gICAgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB0aW1lcysrXG4gICAgICBpZiAodGltZXMgPiBtYXgpIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpXG5cbiAgICAgIGxldCBkYXRhID0ge1xuICAgICAgICAnbXBDb29raWUnOiBwYWdlQ29va2llKE1JWFBBTkVMLmNvb2tpZSksXG4gICAgICAgICdnbmFyJzogcGFnZUNvb2tpZSgnZ25hcl9jb250YWluZXJJZCcpLFxuICAgICAgICAnZGFwaSc6IHBhZ2VDb29raWUoJ19fZm5ncnBybnRfXycpXG4gICAgICB9XG4gICAgICBpZiAoIWRhdGEubXBDb29raWUpIHJldHVyblxuXG4gICAgICBjbGVhckludGVydmFsKGludGVydmFsKVxuICAgICAgZW1pdCgndHJhY2tlci1pbml0JywgZGF0YSlcbiAgICB9LCA1MDApXG59XG5cblxuZXhwb3J0IGRlZmF1bHQge1xuICBpbml0QmdPclBvcHVwLFxuICBpbml0Q29udGVudFNjcmlwdCxcbiAgZ2V0TG9nLFxuICBmaXJlLFxuICBjYWxsXG59XG4iLCJpbXBvcnQgcHJlZnMgZnJvbSAnLi4vcHJlZnMnXG5pbXBvcnQge3Byb21pc2VHZXREb21haW59IGZyb20gJy4uL2xvY2F0aW9uJ1xuaW1wb3J0IHtnZXRCcm93c2VyLCBpc0Nocm9tZX0gZnJvbSAnLi4vdXRpbCdcbmltcG9ydCB7RkVMT0csIGRlYnVnfSBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQge2NhbGx9IGZyb20gJy4vY2FsbCdcblxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIFsnYmctcGFnZS1sb2FkJ10oKSB7XG4gIH0sXG4gIFsnYWN0aXZpdHktcGluZyddKCkge1xuICAgIGxldCB0b1BlcmNlbnQgPSB2YWwgPT4gcGFyc2VGbG9hdChNYXRoLnJvdW5kKHZhbCAqIDEwMCAqIDEwMCkgLyAxMDApLnRvRml4ZWQoMilcbiAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBpZiAoIWlzQ2hyb21lKCkpIHtcbiAgICAgICAgcmV0dXJuIGNhbGwoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCAnYWN0aXZpdHk6YWN0aXZpdHlfcGluZycpXG4gICAgICB9XG5cbiAgICAgIHdpbmRvdy5jaHJvbWUuc3lzdGVtICYmIHdpbmRvdy5jaHJvbWUuc3lzdGVtLmNwdSAmJiB3aW5kb3cuY2hyb21lLnN5c3RlbS5jcHUuZ2V0SW5mbyhpbmZvID0+IHtcbiAgICAgICAgbGV0IGxvYWQgPSBpbmZvLnByb2Nlc3NvcnNcbiAgICAgICAgICAgIC5tYXAocHJvY2Vzc29yID0+IChwcm9jZXNzb3IudXNhZ2UudG90YWwgLSBwcm9jZXNzb3IudXNhZ2UuaWRsZSkgLyBwcm9jZXNzb3IudXNhZ2UudG90YWwpXG4gICAgICAgICAgICAucmVkdWNlKChhdmcsIGNwdSwgaSwgdG90YWwpID0+IGF2ZyArIGNwdSAvIHRvdGFsLmxlbmd0aCwgMCksXG4gICAgICAgICAge3VzZWRKU0hlYXBTaXplLCB0b3RhbEpTSGVhcFNpemV9ID0gd2luZG93LnBlcmZvcm1hbmNlLm1lbW9yeVxuXG4gICAgICAgIGxvYWQgPSB0b1BlcmNlbnQobG9hZClcblxuICAgICAgICBjYWxsKCdzdGF0c2MudWkuaW5jcmVtZW50JywgJ2FjdGl2aXR5OmFjdGl2aXR5X3BpbmcnKVxuICAgICAgICBjYWxsKCdzdGF0c2MudWkuZ2F1Z2UnLCB7XG4gICAgICAgICAgJ3BlcmZvcm1hbmNlOm1lbW9yeV91c2VkJzogdXNlZEpTSGVhcFNpemUsXG4gICAgICAgICAgJ3BlcmZvcm1hbmNlOm1lbW9yeV91c2VkX29mX3RvdGFsJzogdG9QZXJjZW50KCh0b3RhbEpTSGVhcFNpemUgLSB1c2VkSlNIZWFwU2l6ZSkgLyB0b3RhbEpTSGVhcFNpemUpLFxuICAgICAgICAgICdwZXJmb3JtYW5jZTpjcHVfbG9hZCc6IGxvYWRcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSxcbiAgICBGRUxPRy5waW5nVGltZW91dClcbiAgfSxcbiAgWydkYWlseS1waW5nJ10oKSB7XG4gICAgaWYgKGRlYnVnKSByZXR1cm5cblxuICAgIHByZWZzLmdldChbJ2lkJywgJ3BpbmdEYXRlJ10sIG9ubG9hZClcblxuICAgIGZ1bmN0aW9uIG9ubG9hZCh7aWQsIHBpbmdEYXRlfSkge1xuICAgICAgcGluZ0RhdGUgPSBwaW5nRGF0ZSB8fCAnJyAvL2ZvciBudWxsIGNhc2VcbiAgICAgIGxldCBbc3RvcmFnZU5leHREYXRlLCBvbGRJZF0gPSBwaW5nRGF0ZS5zcGxpdCgnfCcpXG5cbiAgICAgIGlmIChzdG9yYWdlTmV4dERhdGUgJiYgc3RvcmFnZU5leHREYXRlID4gRGF0ZS5ub3coKSAmJiBvbGRJZCA9PSBpZCkgcmV0dXJuXG4gICAgICBpZiAoIWlkKSByZXR1cm5cblxuICAgICAgY2FsbCgnbWl4cGFuZWwuZGFwaUV2ZW50JywgJ0RhaWx5X1BpbmcnLCB7XG4gICAgICAgIGdQcm9kdWN0OiBgRXh0ZW5zaW9uLSR7Z2V0QnJvd3NlcigpfWBcbiAgICAgIH0pXG4gICAgICBjYWxsKCdnbmFyLnRyYWNrVHJhY2tUcmFjaycpXG4gICAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdFeHQ6RGFpbHlfUGluZycpXG4gICAgICBjYWxsKCdmZWxvZy5ldmVudCcsICdkYWlseV9waW5nJylcblxuICAgICAgcHJlZnMuc2V0KCdwaW5nRGF0ZScsIFtnZXROZXh0UGluZ0RhdGUoKSwgaWRdLmpvaW4oJ3wnKSlcbiAgICB9XG5cbiAgICAvL2dldCByYW5kb20gbG9jYWwgdGltZSBiZXR3ZWVuIDMtNCBBTVxuICAgIGZ1bmN0aW9uIGdldE5leHRQaW5nRGF0ZSgpIHtcbiAgICAgIGxldCBub3cgPSBuZXcgRGF0ZSgpXG4gICAgICBpZiAobm93LmdldEhvdXJzKCkgPiAyKSB7XG4gICAgICAgIG5vdy5zZXREYXRlKG5vdy5nZXREYXRlKCkgKyAxKVxuICAgICAgfVxuICAgICAgbm93LnNldEhvdXJzKDMpXG4gICAgICBub3cuc2V0TWludXRlcyhNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA2MCkpXG5cbiAgICAgIHJldHVybiBub3cuZ2V0VGltZSgpXG4gICAgfVxuICB9LFxuICBbJ2FwcF9zaWduaW5fc3VjY2VzcyddOiBhc3luYyBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBwYWdlRG9tYWluID0gYXdhaXQgcHJvbWlzZUdldERvbWFpbigpXG4gICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRzpVc2VyX0xvZ2luX1N1Y2NlZWRlZCcsIHtwYWdlRG9tYWlufSlcbiAgICBjYWxsKCdnbmFyLnNlbmQnLCBgJHtnZXRCcm93c2VyKCl9RXh0L3VzZXJMb2dpbkZvcm0vYWNjZXB0ZWRgLCB7cGFnZURvbWFpbn0pXG4gICAgY2FsbCgnc3RhdHNjLnVpLmluY3JlbWVudCcsICdzdGFiaWxpdHk6YXBwX3NpZ25pbl9zdWNjZXNzJylcbiAgfSxcbiAgWydhcHBfc2lnbnVwX3N1Y2Nlc3MnXTogYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcGFnZURvbWFpbiA9IGF3YWl0IHByb21pc2VHZXREb21haW4oKVxuICAgIGNhbGwoJ21peHBhbmVsLnRyYWNrJywgJ0c6VXNlcl9BY2NvdW50X0NyZWF0ZWQnLCB7cGFnZURvbWFpbn0pXG4gICAgY2FsbCgnZ25hci5zZW5kJywgYCR7Z2V0QnJvd3NlcigpfUV4dC91c2VyQWNjb3VudFNpZ251cEZvcm0vYWNjZXB0ZWRgLCB7cGFnZURvbWFpbn0pXG4gICAgY2FsbCgnc3RhdHNjLnVpLmluY3JlbWVudCcsICdzdGFiaWxpdHk6YXBwX3NpZ251cF9zdWNjZXNzJylcbiAgfSxcbiAgWydzaWduaW4tZXJyb3InXTogYXN5bmMgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICBjb25zdCBwYWdlRG9tYWluID0gYXdhaXQgcHJvbWlzZUdldERvbWFpbigpXG4gICAgZXJyb3IuZXJyb3JUeXBlID0gJ1NlcnZlci1TaWRlJ1xuICAgIGNhbGwoJ21peHBhbmVsLnRyYWNrJywgJ0c6VXNlcl9Mb2dpbl9SZWplY3RlZCcsIHtwYWdlRG9tYWlufSlcbiAgICBjYWxsKCdnbmFyLnNlbmQnLCBgJHtnZXRCcm93c2VyKCl9RXh0L3VzZXJMb2dpbkZvcm0vcmVqZWN0ZWRgLCB7cGFnZURvbWFpbn0pXG4gIH0sXG4gIFsnc2lnbnVwLWVycm9yJ106IGFzeW5jIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgY29uc3QgcGFnZURvbWFpbiA9IGF3YWl0IHByb21pc2VHZXREb21haW4oKVxuICAgIGVycm9yLmVycm9yVHlwZSA9ICdTZXJ2ZXItU2lkZSdcbiAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdHOlVzZXJfU2lnbnVwX1JlamVjdGVkJywge3BhZ2VEb21haW59KVxuICAgIGNhbGwoJ2duYXIuc2VuZCcsIGAke2dldEJyb3dzZXIoKX1FeHQvdXNlckFjY291bnRTaWdudXBGb3JtL3JlamVjdGVkYCwge3BhZ2VEb21haW59KVxuICB9LFxuICBbJ3VwZ3JhZGUtYWZ0ZXItcmVnaXN0ZXInXTogYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcGFnZURvbWFpbiA9IGF3YWl0IHByb21pc2VHZXREb21haW4oKVxuICAgIGNhbGwoJ21peHBhbmVsLnRyYWNrJywgJ05FOkFjY291bnRfVHlwZV9TZWxlY3RlZCcsIHtcbiAgICAgIGFjY291bnRUeXBlU2VsZWN0ZWQ6ICdwcmVtaXVtJyxcbiAgICAgIHBhZ2VEb21haW5cbiAgICB9KVxuICAgIGNhbGwoJ2duYXIuc2VuZCcsIGAke2dldEJyb3dzZXIoKX1FeHQvQWNjb3VudF9UeXBlX1NlbGVjdGVkYCwge3BhZ2VEb21haW59KVxuICB9LFxuICBbJ3VwZ3JhZGUnXTogYXN5bmMgZnVuY3Rpb24ocGxhY2VtZW50LCBwYWdlRG9tYWluKSB7Ly90ZXN0ZWRcbiAgICBsZXQgZXh0MiA9IGF3YWl0IHByZWZzLmdldCgnZXh0MicpLFxuICAgICAgZGF0YSA9IHtwYWdlRG9tYWluLCBwbGFjZW1lbnQsIGV4dDJ9XG5cbiAgICBjYWxsKCdnbmFyLnNlbmQnLCBgJHtnZXRCcm93c2VyKCl9RXh0L3VwZ3JhZGVCdXR0b25DbGlja2VkYCwgZGF0YSlcbiAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdFeHQ6VXBncmFkZV9Ub19QbHVzX0NsaWNrZWQnLCBkYXRhKVxuICAgIGNhbGwoJ2ZlbG9nLmluZm8nLCAndXBncmFkZV9jbGljaycsIGRhdGEpXG4gIH0sXG4gIFsnYnV0dG9uLWhvdmVyJ106IGFzeW5jIGZ1bmN0aW9uKGJ1dHRvblR5cGUpIHsvL3Rlc3RlZFxuICAgIGNvbnN0IHBhZ2VEb21haW4gPSBhd2FpdCBwcm9taXNlR2V0RG9tYWluKClcbiAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdFeHQ6QWN0aW9uX0J1dHRvbl9Ib3ZlcmVkJywge3BhZ2VEb21haW4sIGJ1dHRvblR5cGV9KVxuICAgIGNhbGwoJ2duYXIuc2VuZCcsIGAke2dldEJyb3dzZXIoKX1FeHQvYWN0aW9uQnV0dG9uSG92ZXJlZGAsIHtwYWdlRG9tYWluLCBidXR0b25UeXBlfSlcbiAgICBjYWxsKCdzdGF0c2MudWkuaW5jcmVtZW50JywgJ3N0YWJpbGl0eTpnYnV0dG9uX2FjdGlvbnNfaG92ZXInKVxuICB9LFxuICBbJ2NvcnJlY3QtYnRuLWNsaWNrZWQnXTogYXN5bmMgZnVuY3Rpb24oKSB7Ly90ZXN0ZWRcbiAgICBjb25zdCBwYWdlRG9tYWluID0gYXdhaXQgcHJvbWlzZUdldERvbWFpbigpXG4gICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OkNvcnJlY3RfQnV0dG9uX0NsaWNrZWQnLCB7cGFnZURvbWFpbn0pXG4gICAgY2FsbCgnZ25hci5zZW5kJywgYCR7Z2V0QnJvd3NlcigpfUV4dC9jb3JyZWN0QnV0dG9uQ2xpY2tlZGApXG4gICAgY2FsbCgnc3RhdHNjLnVpLmluY3JlbWVudCcsICdzdGFiaWxpdHk6ZWRpdG9yLmNvcnJlY3RfYnV0dG9uX2NsaWNrZWQnKVxuICAgIGNhbGwoJ2ZlbG9nLmV2ZW50JywgJ2dfYnV0dG9uX2NvcnJlY3RfYnV0dG9uX2NsaWNrZWQnKVxuICB9LFxuICBbJ2J0bi1kaXNhYmxlLWluLWZpZWxkJ106IGFzeW5jIGZ1bmN0aW9uKGVuYWJsZWQpIHsvL3Rlc3RlZFxuICAgIGNvbnN0IHBhZ2VEb21haW4gPSBhd2FpdCBwcm9taXNlR2V0RG9tYWluKClcbiAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdFeHQ6Q2hlY2tpbmdfaW5fZmllbGRfdG9nZ2xlZCcsIHtwYWdlRG9tYWluLCBlbmFibGVkfSlcbiAgICBjYWxsKCdnbmFyLnNlbmQnLCBgJHtnZXRCcm93c2VyKCl9RXh0L2NoZWNraW5nSW5GaWVsZFRvZ2dsZWRgLCB7cGFnZURvbWFpbiwgZW5hYmxlZH0pXG4gICAgY2FsbCgnc3RhdHNjLnVpLmluY3JlbWVudCcsICdzdGFiaWxpdHk6ZGlzYWJsZV9pbl9maWVsZCcpXG4gICAgY2FsbCgnZmVsb2cuaW5mbycsICdnX2J1dHRvbl9kaXNhYmxlX2luX2ZpZWxkX2NsaWNrJylcbiAgfSxcbiAgWydidXR0b24tY2hhbmdlLXN0YXRlJ106IGFzeW5jIGZ1bmN0aW9uKGVuYWJsZWQpIHsvL3Rlc3RlZFxuICAgIGNvbnN0IHBhZ2VEb21haW4gPSBhd2FpdCBwcm9taXNlR2V0RG9tYWluKClcbiAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdFeHQ6R0J1dHRvbl9NaW5pbWl6ZV9Ub2dnbGVkJywge3BhZ2VEb21haW4sIGVuYWJsZWR9KVxuICAgIGNhbGwoJ2duYXIuc2VuZCcsIGAke2dldEJyb3dzZXIoKX1FeHQvbWluaW1pemVUb2dnbGVkYCwge3BhZ2VEb21haW4sIGVuYWJsZWR9KVxuICAgIGNhbGwoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCAnc3RhYmlsaXR5OmdfYnV0dG9uX21pbmltaXplX3RvZ2dsZWQnKVxuICAgIGNhbGwoJ2ZlbG9nLmluZm8nLCAnZ19idXR0b25fbWluaW1pemVfdG9nZ2xlZCcsIHtlbmFibGVkfSlcbiAgfSxcbiAgWydzZXNzaW9uLWVuZCddOiBhc3luYyBmdW5jdGlvbihhZHZhbmNlZENvdW50KSB7XG4gICAgY29uc3QgcGFnZURvbWFpbiA9IGF3YWl0IHByb21pc2VHZXREb21haW4oKVxuICAgIGNhbGwoJ21peHBhbmVsLnRyYWNrJywgJ0V4dDpPbmx5X0FkdmFuY2VkX01pc3Rha2VzJywge3BhZ2VEb21haW4sIGFkdmFuY2VkQ291bnR9KVxuICAgIGNhbGwoJ2duYXIuc2VuZCcsIGAke2dldEJyb3dzZXIoKX1FeHQvb25seUFkdmFuY2VkTWlzdGFrZXNgLCB7cGFnZURvbWFpbiwgYWR2YW5jZWRDb3VudH0pXG4gICAgY2FsbCgnZmVsb2cuaW5mbycsICdvbmx5X2FkdmFuY2VkX21pc3Rha2VzJywge2FkdmFuY2VkQ291bnR9KVxuICB9LFxuICBbJ2xvZ2luLWF0dGVtcHQnXTogYXN5bmMgZnVuY3Rpb24oY2FsbGVyKSB7XG4gICAgbGV0IGlzRXh0MiA9IGF3YWl0IHByZWZzLmlzRXh0MigpXG4gICAgaWYgKGlzRXh0Mikge1xuICAgICAgY2FsbCgnZ25hci5zZW5kJywgJ0V4dC9zaWduSW5DbGlja2VkJywgeyBwbGFjZW1lbnQ6IGNhbGxlciB9KVxuICAgICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OlNpZ25fSW5fQ2xpY2tlZCcsIHsgcGxhY2VtZW50OiBjYWxsZXIgfSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjYWxsKCdnbmFyLnNlbmQnLCAnRXh0L3NpZ25JbkNsaWNrZWRfMTAnLCB7IHBsYWNlbWVudDogY2FsbGVyIH0pXG4gICAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdFeHQ6U2lnbl9Jbl9DbGlja2VkXzEwJywgeyBwbGFjZW1lbnQ6IGNhbGxlciB9KVxuICAgIH1cbiAgfVxufVxuIiwiaW1wb3J0IHtnZXRCcm93c2VyfSBmcm9tICcuLi91dGlsJ1xuaW1wb3J0IHtTVEFUU0N9IGZyb20gJy4uL2NvbmZpZydcblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAobWV0aG9kLCBvcHRzKSB7XG4gIGxldCBuYW1lcyA9IG9wdHMgJiYgb3B0cy5zcGxpdCgnOicpXG5cbiAgaWYgKCFuYW1lc1swXSB8fCAhbmFtZXNbMV0pIHJldHVyblxuXG4gIGxldCBldmVudCA9IGBncmFtbWFybHkudWkuJHtuYW1lc1swXX0uJHtnZXRCcm93c2VyKCl9LmV4dGVuc2lvbi53b3JsZC4ke25hbWVzWzFdfWAsXG4gICAgZGF0YSA9IHtjOiB7fX1cblxuICBkYXRhLmNbZXZlbnRdID0gWycxJ11cblxuICBsZXQgaW1nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW1nJylcbiAgaW1nLnNyYyA9IGAke1NUQVRTQy5VUkx9P2pzb249JHtKU09OLnN0cmluZ2lmeShkYXRhKX1gXG5cbiAgcmV0dXJuIGltZ1xufVxuIiwiZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oKSB7IHJldHVybiB3aW5kb3cudHJhY2tlciB9XG4iLCJpbXBvcnQgXyBmcm9tICdsb2Rhc2gnXG5cblxuZnVuY3Rpb24gaXNGRigpIHtcbiAgcmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0ZpcmVmb3gnKSAhPSAtMVxufVxuXG5mdW5jdGlvbiBpc0Nocm9tZSgpIHtcbiAgcmV0dXJuICEhd2luZG93LmNocm9tZVxufVxuXG5mdW5jdGlvbiBpc1NhZmFyaSgpIHtcbiAgcmV0dXJuICEhd2luZG93LnNhZmFyaVxufVxuXG5mdW5jdGlvbiBpc1NhZmFyaTgoKSB7XG4gIHJldHVybiAvXigoPyFjaHJvbWUpLikqc2FmYXJpL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ1ZlcnNpb24vOC4wJykgIT0gLTFcbn1cblxuZnVuY3Rpb24gaXNXaW5kb3dzKCkge1xuICByZXR1cm4gbmF2aWdhdG9yLmFwcFZlcnNpb24uaW5kZXhPZignV2luJykgIT0gLTFcbn1cblxuZnVuY3Rpb24gaXNCZygpIHtcbiAgcmV0dXJuIHdpbmRvdy5JU19CR1xufVxuXG5cbmZ1bmN0aW9uIGlzUG9wdXAoKSB7XG4gIHJldHVybiB3aW5kb3cuSVNfUE9QVVBcbn1cblxuZnVuY3Rpb24gaXNCZ09yUG9wdXAoKSB7XG4gIHJldHVybiBpc0JnKCkgfHwgaXNQb3B1cCgpXG59XG5cbmZ1bmN0aW9uIGdldEJyb3dzZXIoKSB7XG4gIGlmIChpc0Nocm9tZSgpKSB7XG4gICAgcmV0dXJuICdjaHJvbWUnXG4gIH1cbiAgZWxzZSBpZiAoaXNGRigpKSB7XG4gICAgcmV0dXJuICdmaXJlZm94J1xuICB9XG4gIGVsc2UgaWYgKGlzU2FmYXJpKCkpIHtcbiAgICByZXR1cm4gJ3NhZmFyaSdcbiAgfVxuICBlbHNlIHtcbiAgICByZXR1cm4gJ290aGVyJ1xuICB9XG59XG5cbmZ1bmN0aW9uIGNocm9tZUJnRXJyb3IoKSB7XG4gIHJldHVybiB3aW5kb3cuY2hyb21lICYmIHdpbmRvdy5jaHJvbWUucnVudGltZSAmJiB3aW5kb3cuY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yXG59XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiAhIShvYmogJiYgb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jYWxsICYmIG9iai5hcHBseSlcbn1cblxuZnVuY3Rpb24gaW50ZXJ2YWwoY2IsIHRpbWUpIHtcbiAgbGV0IGl0ZW1zID0gaW50ZXJ2YWwuaXRlbXMgPSBpbnRlcnZhbC5pdGVtcyB8fCB7fSxcbiAgICBpdGVtID0gaXRlbXNbY2JdXG5cbiAgaWYgKCFpdGVtICYmICF0aW1lKSByZXR1cm5cblxuICBpZiAoaXRlbSAmJiAhdGltZSkge1xuICAgIGNsZWFyVGltZW91dChpdGVtKVxuICAgIGRlbGV0ZSBpdGVtc1tjYl1cbiAgICByZXR1cm5cbiAgfSBlbHNlIHJ1bigpXG5cbiAgZnVuY3Rpb24gcnVuKCkge1xuICAgIGZ1bmN0aW9uIF9jYigpIHtcbiAgICAgIHRpbWVvdXQoKVxuICAgICAgY2IoKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRpbWVvdXQoKSB7XG4gICAgICBsZXQgdGlkID0gc2V0VGltZW91dChfY2IsIHRpbWUpXG4gICAgICBpdGVtc1tjYl0gPSB0aWRcbiAgICB9XG4gICAgdGltZW91dCgpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2FuY2VsSW50ZXJ2YWwoY2IpIHtcbiAgaW50ZXJ2YWwoY2IpXG59XG5cbmZ1bmN0aW9uIFM0KCkge3JldHVybiAoKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKSB8IDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSl9XG5mdW5jdGlvbiBndWlkICgpIHtcbiAgcmV0dXJuIChTNCgpICsgUzQoKSArICctJyArIFM0KCkgKyAnLScgKyBTNCgpICsgJy0nICsgUzQoKSArICctJyArIFM0KCkgKyBTNCgpICsgUzQoKSlcbn1cblxuZnVuY3Rpb24gX2YoKSB7fVxuZnVuY3Rpb24gX0YoKSB7cmV0dXJuIHRydWV9XG5cblxuZnVuY3Rpb24gYmdQYWdlUmVsb2FkKCkge1xuICBpc0Nocm9tZSgpICYmIHdpbmRvdy5jaHJvbWUucnVudGltZS5yZWxvYWQoKVxufVxuXG5mdW5jdGlvbiBpc0dtYWlsKGRvYykge1xuICBpZiAoIWRvYy5sb2NhdGlvbikgcmV0dXJuXG4gIGxldCBob3N0ID0gZG9jLmxvY2F0aW9uLmhvc3QgPT0gJ21haWwuZ29vZ2xlLmNvbScsXG4gICAgICBmcmFtZXMgPSBkb2MucXVlcnlTZWxlY3RvcignaWZyYW1lI2pzX2ZyYW1lJykgJiYgZG9jLnF1ZXJ5U2VsZWN0b3IoJ2lmcmFtZSNzb3VuZF9mcmFtZScpXG4gIHJldHVybiBob3N0IHx8IGZyYW1lc1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkRW1haWwodmFsdWUpIHtcbiAgcmV0dXJuIC9eWy0hIyQlJlxcJyorXFxcXC4vMC05PT9BLVpeX2BhLXp7fH1+XStAWy0hIyQlJlxcJyorXFxcXC8wLTk9P0EtWl5fYGEtent8fX5dK1xcLlstISMkJSZcXCcqK1xcXFwuLzAtOT0/QS1aXl9gYS16e3x9fl0rJC8udGVzdCh2YWx1ZSlcbn1cblxuZnVuY3Rpb24gZm9ybWF0TnVtYmVyKGkpIHtcbiAgcmV0dXJuIGkudG9TdHJpbmcoKS5yZXBsYWNlKC9cXEIoPz0oXFxkezN9KSsoPyFcXGQpKS9nLCAnLCcpXG59XG5cbmZ1bmN0aW9uIGRlY2xlbnNpb24odmFsdWUsIGFycikge1xuICBsZXQgaW5kZXggPSAyXG4gIGlmICgodmFsdWUgJSAxMCA9PSAxKSAmJiAodmFsdWUgJSAxMDAgIT0gMTEpKSB7XG4gICAgaW5kZXggPSAwXG4gIH1cblxuICBpZiAoKHZhbHVlICUgMTAgPj0gMiAmJiB2YWx1ZSAlIDEwIDw9IDQpICYmICh2YWx1ZSAlIDEwMCA8IDEwIHx8IHZhbHVlICUgMTAwID49IDIwKSkge1xuICAgIGluZGV4ID0gMVxuICB9XG4gIHJldHVybiBhcnJbaW5kZXhdXG59XG5cbmZ1bmN0aW9uIHN0dWIobWV0aG9kcykge1xuICByZXR1cm4gXy50cmFuc2Zvcm0obWV0aG9kcywgKHJlc3VsdCwgbSkgPT4gcmVzdWx0W21dID0gX2YpXG59XG5cbmZ1bmN0aW9uIG1lbW9pemUoZnVuYywgcmVzb2x2ZXIsIHR0bCkge1xuICBsZXQgY2FjaGUgPSB7fVxuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgbGV0IGtleSA9ICdfbWVtb2l6ZV8nICsgKHJlc29sdmVyID8gcmVzb2x2ZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKSA6IGFyZ3VtZW50c1swXSlcbiAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChjYWNoZSwga2V5KSkge1xuICAgICAgcmV0dXJuIGNhY2hlW2tleV1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBpZiAodHRsKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge2RlbGV0ZSBjYWNoZVtrZXldfSwgdHRsKVxuICAgICAgfVxuICAgICAgcmV0dXJuIGNhY2hlW2tleV0gPSBmdW5jLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gc3luY1dhaXQocHJvbWlzZSwgbWV0aG9kcykge1xuICByZXR1cm4gT2JqZWN0LmtleXMobWV0aG9kcykucmVkdWNlKChvYmosIG1ldGhvZCkgPT4gKHtcbiAgICAuLi5vYmosXG4gICAgW21ldGhvZF06ICguLi5hcmdzKSA9PiBwcm9taXNlLnRoZW4oKCkgPT4gbWV0aG9kc1ttZXRob2RdKC4uLmFyZ3MpKVxuICB9KSwge30pXG59XG5cbmZ1bmN0aW9uIHByb21pc2lmeShtZXRob2QpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gbWV0aG9kKHJlc29sdmUpKVxufVxuXG5mdW5jdGlvbiBnZXRSYW5kb21JbnRJbmNsdXNpdmUobWluLCBtYXgpIHtcbiAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW5cbn1cblxuZnVuY3Rpb24gZGVsYXkobXMpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCBtcykpXG59XG5cblxuLy9kZWNpZGVkIHRvIHVzZSBzaW1wbGUgZnVuY3Rpb24gaW5zdGVhZCBoZWF2eSBtb21lbnQuanNcbmxldCBtb250aHMgPSBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXVxuZnVuY3Rpb24gZm9ybWF0RGF0ZShkYXRlU3RyKSB7XG4gIGlmICghZGF0ZVN0cikgcmV0dXJuXG4gIGxldCBkYXRlID0gbmV3IERhdGUoZGF0ZVN0cilcbiAgaWYgKGRhdGUudG9TdHJpbmcoKSA9PSAnSW52YWxpZCBEYXRlJykgcmV0dXJuXG4gIHJldHVybiBtb250aHNbZGF0ZS5nZXRNb250aCgpXSArICcgJyArIGRhdGUuZ2V0RGF0ZSgpICsgJywgJyArIGRhdGUuZ2V0RnVsbFllYXIoKVxufVxuXG5mdW5jdGlvbiBjcmVhdGVDbGFzcyhmdW5jKSB7XG4gIGxldCBfY2xhc3MgPSBmdW5jdGlvbigpIHt9XG4gIF9jbGFzcy5wcm90b3R5cGUgPSBmdW5jKClcbiAgcmV0dXJuIF9jbGFzc1xufVxuXG5mdW5jdGlvbiBlbWl0RG9tRXZlbnQoa2V5LCBkYXRhID0ge30pIHtcbiAgbGV0IGUgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKVxuICBlLmluaXRDdXN0b21FdmVudChrZXkgKyAnLWdyJywgdHJ1ZSwgdHJ1ZSwgZGF0YSlcbiAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChlKVxufVxuXG4vKipcbiAqIENvbXBhcmUgdHdvIHZlcnNpb25zIG9mIGV4dGVuc2lvbi4gVmVyc2lvbiBmb3JtYXQgeC54LnhcbiAqIEBwYXJhbSB7c3RyaW5nfSB2MSBmaXJzdCB2ZXJzaW9uIHRvIGNvbXBhcmVcbiAqIEBwYXJhbSB7c3RyaW5nfSB2MiBzZWNvbmQgdmVyc2lvbiB0byBjb21wYXJlXG4gKiBAZXhhbXBsZVxuICogLy8gcmV0dXJucyAxXG4gKiB2ZXJzaW9uQ29tcGFyYXRvcignMi4wLjAnLCAnMC4wLjknKVxuICogQGV4YW1wbGVcbiAqIC8vIHJldHVybnMgMFxuICogdmVyc2lvbkNvbXBhcmF0b3IoJzIuMC4wJywgJzIuMC4wJylcbiAqIEBleGFtcGxlXG4gKiAvLyByZXR1cm5zIC0xXG4gKiB2ZXJzaW9uQ29tcGFyYXRvcignMS4wLjAnLCAnMi4wLjAnKVxuICogQHJldHVybnMge051bWJlcn0gUmV0dXJucyAxLCAwIG9yIC0xXG4gKi9cbmZ1bmN0aW9uIHZlcnNpb25Db21wYXJhdG9yKHYxID0gJycsIHYyID0gJycpIHtcbiAgZnVuY3Rpb24gc3BsaXRUb0FycmF5KHN0cikge1xuICAgIHJldHVybiBzdHIuc3BsaXQoJy4nKS5tYXAoKGVsKSA9PiBOdW1iZXIoZWwpIHx8IDApXG4gIH1cblxuICBsZXQgdjFhcnIgPSBzcGxpdFRvQXJyYXkodjEpLFxuICAgIHYyYXJyID0gc3BsaXRUb0FycmF5KHYyKSxcbiAgICBwb3N0Zml4ID0gQXJyYXkoTWF0aC5hYnModjFhcnIubGVuZ3RoIC0gdjJhcnIubGVuZ3RoKSkuZmlsbCgwKVxuXG4gIHYxYXJyLmxlbmd0aCA+IHYyYXJyLmxlbmd0aCA/IHYyYXJyLnB1c2goLi4ucG9zdGZpeCkgOiB2MWFyci5wdXNoKC4uLnBvc3RmaXgpXG5cbiAgaWYgKHYxYXJyLmV2ZXJ5KCh2LCBpKSA9PiB2ID09PSB2MmFycltpXSkpIHJldHVybiAwXG5cbiAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IHYxYXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgaWYgKHYxYXJyW2ldID4gdjJhcnJbaV0pIHtcbiAgICAgIHJldHVybiAxXG4gICAgfVxuICAgIGVsc2UgaWYgKHYxYXJyW2ldIDwgdjJhcnJbaV0pIHtcbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgfVxuICByZXR1cm4gLTFcbn1cblxuYXN5bmMgZnVuY3Rpb24gaXNCZ0FsaXZlKCkge1xuICBpZiAoIWlzQ2hyb21lKCkpIHJldHVybiBudWxsXG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IFByb21pc2UucmFjZShbXG4gICAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHdpbmRvdy5jaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSgncGluZycsIHJlc29sdmUpKSxcbiAgICAgIGRlbGF5KDEwMDAwKS50aGVuKCgpID0+ICd0aW1lb3V0ZWQnKVxuICAgIF0pXG4gIH1cbiAgY2F0Y2goZSkge1xuICAgIHJldHVybiAnb3JwaGFuZWQnXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBnZXRCcm93c2VyLFxuICBpc0Z1bmN0aW9uLFxuICBjaHJvbWVCZ0Vycm9yLFxuICBpbnRlcnZhbCxcbiAgZGVjbGVuc2lvbixcbiAgY2FuY2VsSW50ZXJ2YWwsXG4gIGJnUGFnZVJlbG9hZCxcbiAgaXNGRixcbiAgaXNDaHJvbWUsXG4gIGlzU2FmYXJpLFxuICBpc1NhZmFyaTgsXG4gIGlzR21haWwsXG4gIGlzV2luZG93cyxcbiAgaXNCZyxcbiAgaXNCZ09yUG9wdXAsXG4gIGlzUG9wdXAsXG4gIGd1aWQsXG4gIGZvcm1hdE51bWJlcixcbiAgZ2V0UmFuZG9tSW50SW5jbHVzaXZlLFxuICBzdHViLFxuICBtZW1vaXplLFxuICBzeW5jV2FpdCxcbiAgcHJvbWlzaWZ5LFxuICBkZWxheSxcbiAgZm9ybWF0RGF0ZSxcbiAgY3JlYXRlQ2xhc3MsXG4gIGVtaXREb21FdmVudCxcbiAgdmVyc2lvbkNvbXBhcmF0b3IsXG4gIGlzVmFsaWRFbWFpbCxcbiAgaXNCZ0FsaXZlLFxuICBfZiwgX0Zcbn1cbiJdfQ==
