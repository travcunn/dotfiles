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
},{"buffer":"/project/node_modules/browserify/node_modules/buffer/index.js"}],"/project/src/js/lib/bg/chrome.js":[function(require,module,exports){
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
},{"../util":"/project/src/js/lib/util.js"}],"/project/src/js/lib/bg/news.js":[function(require,module,exports){
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

},{"../config":"/project/src/js/lib/config.js","../prefs":"/project/src/js/lib/prefs.js"}],"/project/src/js/lib/bg/referrals.js":[function(require,module,exports){
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

},{"./defaults":"/project/src/js/lib/page-config/defaults.js"}],"/project/src/js/lib/popup/footer.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _stylPopupSettingsStyl = require('styl/popup-settings.styl');

var _stylPopupSettingsStyl2 = _interopRequireDefault(_stylPopupSettingsStyl);

var _config = require('../config');

var Footer = (function (_React$Component) {
  _inherits(Footer, _React$Component);

  function Footer() {
    _classCallCheck(this, Footer);

    _get(Object.getPrototypeOf(Footer.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Footer, [{
    key: 'render',
    value: function render() {
      return _react2['default'].createElement(
        'div',
        { className: _stylPopupSettingsStyl2['default'].footer },
        _react2['default'].createElement(
          'span',
          { className: _stylPopupSettingsStyl2['default'].new_document + ' ' + _stylPopupSettingsStyl2['default'].footer_btn },
          _react2['default'].createElement(
            'span',
            { className: _stylPopupSettingsStyl2['default'].btn_lbl },
            'New document'
          )
        ),
        _react2['default'].createElement(
          'a',
          { target: '_blank', href: _config.URLS.app, className: _stylPopupSettingsStyl2['default'].my_grammarly + ' ' + _stylPopupSettingsStyl2['default'].footer_btn + ' openGrammarly' },
          _react2['default'].createElement(
            'span',
            { className: _stylPopupSettingsStyl2['default'].btn_lbl },
            'My Grammarly'
          )
        )
      );
    }
  }]);

  return Footer;
})(_react2['default'].Component);

exports['default'] = Footer;
module.exports = exports['default'];

},{"../config":"/project/src/js/lib/config.js","react":"react","styl/popup-settings.styl":"/project/src/styl/popup-settings.styl"}],"/project/src/js/lib/popup/header.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _stylHeaderComponentStyl = require('styl/header-component.styl');

var _stylHeaderComponentStyl2 = _interopRequireDefault(_stylHeaderComponentStyl);

var _util = require('../util');

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _config = require('../config');

var Header = (function (_React$Component) {
  _inherits(Header, _React$Component);

  function Header() {
    _classCallCheck(this, Header);

    _get(Object.getPrototypeOf(Header.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(Header, [{
    key: 'render',
    value: function render() {
      return _react2['default'].createElement(
        'div',
        { className: _stylHeaderComponentStyl2['default'].header },
        _react2['default'].createElement('a', { target: '_blank', href: _config.URLS.app, className: _stylHeaderComponentStyl2['default'].logo + ' ' + _stylHeaderComponentStyl2['default'][(0, _util.getBrowser)()] + ' openGrammarly' })
      );
    }
  }]);

  return Header;
})(_react2['default'].Component);

exports['default'] = Header;
module.exports = exports['default'];

},{"../config":"/project/src/js/lib/config.js","../util":"/project/src/js/lib/util.js","react":"react","styl/header-component.styl":"/project/src/styl/header-component.styl"}],"/project/src/js/lib/popup/news.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _config = require('../config');

var _stylPopupSettingsStyl = require('styl/popup-settings.styl');

var _stylPopupSettingsStyl2 = _interopRequireDefault(_stylPopupSettingsStyl);

var News = (function (_React$Component) {
  _inherits(News, _React$Component);

  function News() {
    _classCallCheck(this, News);

    _get(Object.getPrototypeOf(News.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(News, [{
    key: 'render',
    value: function render() {
      //String.fromCharCode(8217) - is '’'
      var newsItems = _config.news.map(function (value, i) {
        return _react2['default'].createElement('li', { dangerouslySetInnerHTML: { __html: value }, key: i });
      });

      return _react2['default'].createElement(
        'div',
        { className: _stylPopupSettingsStyl2['default'].line + ' ' + _stylPopupSettingsStyl2['default'].news },
        _react2['default'].createElement('div', { className: _stylPopupSettingsStyl2['default'].close_news }),
        _react2['default'].createElement(
          'div',
          { className: _stylPopupSettingsStyl2['default'].news_content },
          _react2['default'].createElement(
            'h2',
            null,
            'What' + String.fromCharCode(8217) + 's new in this update:'
          ),
          _react2['default'].createElement(
            'ul',
            null,
            newsItems
          )
        )
      );
    }
  }]);

  return News;
})(_react2['default'].Component);

exports['default'] = News;
module.exports = exports['default'];

},{"../config":"/project/src/js/lib/config.js","react":"react","styl/popup-settings.styl":"/project/src/styl/popup-settings.styl"}],"/project/src/js/lib/popup/popup.js":[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
window.IS_POPUP = document.querySelector('.popup');

exports['default'] = (function () {
  if (!window.IS_POPUP) return;
  require('babel/polyfill');
  var forge = (typeof window !== "undefined" ? window['forge'] : typeof global !== "undefined" ? global['forge'] : null);
  var emitter = require('emitter');
  var prefs = require('../prefs');
  var news = require('../bg/news');

  var _require = require('../location');

  var getDomain = _require.getDomain;

  var _require2 = require('../tracking/index');

  var call = _require2.call;
  var initBgOrPopup = _require2.initBgOrPopup;

  var _require3 = require('../config');

  var getVersion = _require3.getVersion;
  var URLS = _require3.URLS;

  var pageConfig = require('../page-config');

  var _require4 = require('../bg/chrome');

  var getSelectedTabFavicon = _require4.getSelectedTabFavicon;

  var _require5 = require('../util');

  var isWindows = _require5.isWindows;
  var isSafari = _require5.isSafari;
  var getBrowser = _require5.getBrowser;

  var _require6 = require('../dom');

  var addClass = _require6.addClass;
  var removeClass = _require6.removeClass;
  var resolveEl = _require6.resolveEl;
  var listen = _require6.listen;
  var unlisten = _require6.unlisten;

  var Signin = require('./signin');
  var Settings = require('./settings')['default'];

  var dialog = undefined;

  !(function () {
    if (window.IS_BG) return;

    document.readyState == 'loading' ? document.addEventListener('DOMContentLoaded', start, false) : !isSafari() ? start() : window.safari.application.addEventListener('popover', start);
  })();

  function start() {
    return regeneratorRuntime.async(function start$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          if (!"true") {
            require('../test-api')();
          }

          context$2$0.next = 3;
          return regeneratorRuntime.awrap(pageConfig.init());

        case 3:

          addClass(document.documentElement, getBrowser());
          isWindows() && addClass(document.documentElement, 'windows');

          if (isSafari()) {
            initBgOrPopup();
          }

          listen(window, 'click', openGrammarly);
          render();

        case 8:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this);
  }

  function render() {
    var userProps = ['token', 'groups', 'subscriptionFree', 'premium', 'fixed_errors', 'anonymous', 'enabledDefs', 'registrationDate', 'seenNewsVersion', 'extensionInstallDate'];
    prefs.get(userProps, show);
  }

  function closePopup() {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent('close-popup', true, true, {});
    document.documentElement.dispatchEvent(event);
  }

  function openGrammarly(e) {
    if (!resolveEl(e.target, 'openGrammarly')) return;
    forge.tabs.open(URLS.app);
    e.preventDefault();
    closePopup();
  }

  function updatePopupSize(el) {
    var event = document.createEvent('CustomEvent');
    document.body.style.height = '';
    event.initCustomEvent('update-window-size', true, true, {
      width: el.clientWidth,
      height: el.clientHeight - 1
    });
    document.documentElement.dispatchEvent(event);
  }

  function show(user) {
    call('felog.info', 'extension_btn_click');

    var version = getVersion();

    var showNews = news.isShowNewsToUser(user);

    var enabledDefs = user.enabledDefs;

    if (!user || user.anonymous) {
      var s = Signin();
      updatePopupSize({ clientWidth: 347, clientHeight: 324 });
      s.on('load', updatePopupSize);
      dialog = s;
      return;
    }

    if (window.chrome && window.chrome.tabs) {
      getSelectedTabFavicon(runSettings);
    } else {
      runSettings();
    }

    function runSettings(favicon) {
      getDomain(function (domain) {
        prefs.enabled('', domain, function (enabled) {
          if (favicon && favicon.indexOf('chrome:') != -1) favicon = null;
          var createSettings = function createSettings(isCheckingEnabledOnDomain) {
            var result = Settings({
              user: user,
              showNews: showNews,
              version: version,
              isCheckingEnabledOnDomain: isCheckingEnabledOnDomain,
              enabled: enabled,
              domain: domain,
              favicon: favicon,
              enabledDefs: enabledDefs
            });
            result.on('load', function (el) {
              updatePopupSize(el);
              me.emit('load');
            });
            result.on('closePopup', closePopup);

            return result;
          };

          call('gnar.send', getBrowser() + 'Ext/browserToolbarButtonClicked', { pageDomain: domain });
          call('mixpanel.track', 'Ext:Browser_Toolbar_Button_Clicked', { pageDomain: domain });

          var enabledOnDomain = pageConfig.checkDomain(domain);

          if (!enabledOnDomain) {
            call('gnar.send', getBrowser() + 'Ext/browserToolbarButtonClicked/unsupported', { pageDomain: domain });
            call('mixpanel.track', 'Ext:Settings_Open_Unsupported_Domain', { pageDomain: domain });
            call('felog.info', 'settings_open_unsupported_domain', { pageDomain: domain });
          }

          dialog = createSettings(enabledOnDomain);
        });
      });
    }
  }

  function remove() {
    unlisten(window, 'click', openGrammarly);
    removeClass(document.documentElement, 'windows');
    dialog && dialog.remove();
  }

  var me = emitter({
    show: show,
    remove: remove,
    start: start
  });

  return me;
})();

module.exports = exports['default'];

}).call(this,typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9wcm9qZWN0L3NyYy9qcy9saWIvcG9wdXAvcG9wdXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUEsTUFBTSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFBOztxQkFDbEMsQ0FBQSxZQUFXO0FBQ3pCLE1BQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLE9BQU07QUFDNUIsU0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUE7QUFDekIsTUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFBO0FBQzVCLE1BQUksT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQTtBQUNoQyxNQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUE7QUFDL0IsTUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBOztpQkFDZCxPQUFPLENBQUMsYUFBYSxDQUFDOztNQUFuQyxTQUFTLFlBQVQsU0FBUzs7a0JBQ2MsT0FBTyxDQUFDLG1CQUFtQixDQUFDOztNQUFuRCxJQUFJLGFBQUosSUFBSTtNQUFFLGFBQWEsYUFBYixhQUFhOztrQkFDQyxPQUFPLENBQUMsV0FBVyxDQUFDOztNQUF4QyxVQUFVLGFBQVYsVUFBVTtNQUFFLElBQUksYUFBSixJQUFJOztBQUNyQixNQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQTs7a0JBQ1osT0FBTyxDQUFDLGNBQWMsQ0FBQzs7TUFBaEQscUJBQXFCLGFBQXJCLHFCQUFxQjs7a0JBQ2MsT0FBTyxDQUFDLFNBQVMsQ0FBQzs7TUFBckQsU0FBUyxhQUFULFNBQVM7TUFBRSxRQUFRLGFBQVIsUUFBUTtNQUFFLFVBQVUsYUFBVixVQUFVOztrQkFDdUIsT0FBTyxDQUFDLFFBQVEsQ0FBQzs7TUFBdkUsUUFBUSxhQUFSLFFBQVE7TUFBRSxXQUFXLGFBQVgsV0FBVztNQUFFLFNBQVMsYUFBVCxTQUFTO01B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RTs7QUFFRCxnQkFBTSxHQUFHLGNBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQTtTQUN6QyxDQUFDLENBQUE7T0FDSCxDQUFDLENBQUE7S0FDSDtHQUVGOztBQUVELFdBQVMsTUFBTSxHQUFHO0FBQ2hCLFlBQVEsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFBO0FBQ3hDLGVBQVcsQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxDQUFBO0FBQ2hELFVBQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUE7R0FDMUI7O0FBRUQsTUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDO0FBQ2YsUUFBSSxFQUFKLElBQUk7QUFDSixVQUFNLEVBQU4sTUFBTTtBQUNOLFNBQUssRUFBTCxLQUFLO0dBQ04sQ0FBQyxDQUFBOztBQUVGLFNBQU8sRUFBRSxDQUFBO0NBRVYsQ0FBQSxFQUFFIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJ3aW5kb3cuSVNfUE9QVVAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucG9wdXAnKVxuZXhwb3J0IGRlZmF1bHQgKGZ1bmN0aW9uKCkge1xuICBpZiAoIXdpbmRvdy5JU19QT1BVUCkgcmV0dXJuXG4gIHJlcXVpcmUoJ2JhYmVsL3BvbHlmaWxsJylcbiAgbGV0IGZvcmdlID0gcmVxdWlyZSgnZm9yZ2UnKVxuICBsZXQgZW1pdHRlciA9IHJlcXVpcmUoJ2VtaXR0ZXInKVxuICBsZXQgcHJlZnMgPSByZXF1aXJlKCcuLi9wcmVmcycpXG4gIGxldCBuZXdzID0gcmVxdWlyZSgnLi4vYmcvbmV3cycpXG4gIGxldCB7Z2V0RG9tYWlufSA9IHJlcXVpcmUoJy4uL2xvY2F0aW9uJylcbiAgbGV0IHtjYWxsLCBpbml0QmdPclBvcHVwfSA9IHJlcXVpcmUoJy4uL3RyYWNraW5nL2luZGV4JylcbiAgbGV0IHtnZXRWZXJzaW9uLCBVUkxTfSA9IHJlcXVpcmUoJy4uL2NvbmZpZycpXG4gIGxldCBwYWdlQ29uZmlnID0gcmVxdWlyZSgnLi4vcGFnZS1jb25maWcnKVxuICBsZXQge2dldFNlbGVjdGVkVGFiRmF2aWNvbn0gPSByZXF1aXJlKCcuLi9iZy9jaHJvbWUnKVxuICBsZXQge2lzV2luZG93cywgaXNTYWZhcmksIGdldEJyb3dzZXJ9ID0gcmVxdWlyZSgnLi4vdXRpbCcpXG4gIGxldCB7YWRkQ2xhc3MsIHJlbW92ZUNsYXNzLCByZXNvbHZlRWwsIGxpc3RlbiwgdW5saXN0ZW59ID0gcmVxdWlyZSgnLi4vZG9tJylcbiAgbGV0IFNpZ25pbiA9IHJlcXVpcmUoJy4vc2lnbmluJylcbiAgbGV0IFNldHRpbmdzID0gcmVxdWlyZSgnLi9zZXR0aW5ncycpLmRlZmF1bHRcblxuICBsZXQgZGlhbG9nXG5cbiAgIShmdW5jdGlvbigpIHtcbiAgICBpZiAod2luZG93LklTX0JHKSByZXR1cm5cblxuICAgIGRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2xvYWRpbmcnID9cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgc3RhcnQsIGZhbHNlKSA6XG4gICAgIWlzU2FmYXJpKCkgPyBzdGFydCgpIDogd2luZG93LnNhZmFyaS5hcHBsaWNhdGlvbi5hZGRFdmVudExpc3RlbmVyKCdwb3BvdmVyJywgc3RhcnQpXG4gIH0oKSlcblxuICBhc3luYyBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICBpZiAoIXByb2Nlc3MuZW52LlBST0QpIHtcbiAgICAgIHJlcXVpcmUoJy4uL3Rlc3QtYXBpJykoKVxuICAgIH1cblxuICAgIGF3YWl0IHBhZ2VDb25maWcuaW5pdCgpXG5cbiAgICBhZGRDbGFzcyhkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsIGdldEJyb3dzZXIoKSlcbiAgICBpc1dpbmRvd3MoKSAmJiBhZGRDbGFzcyhkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICd3aW5kb3dzJylcblxuICAgIGlmIChpc1NhZmFyaSgpKSB7XG4gICAgICBpbml0QmdPclBvcHVwKClcbiAgICB9XG5cbiAgICBsaXN0ZW4od2luZG93LCAnY2xpY2snLCBvcGVuR3JhbW1hcmx5KVxuICAgIHJlbmRlcigpXG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgbGV0IHVzZXJQcm9wcyA9IFtcbiAgICAgICd0b2tlbicsICdncm91cHMnLCAnc3Vic2NyaXB0aW9uRnJlZScsICdwcmVtaXVtJywgJ2ZpeGVkX2Vycm9ycycsXG4gICAgICAnYW5vbnltb3VzJywgJ2VuYWJsZWREZWZzJywgJ3JlZ2lzdHJhdGlvbkRhdGUnLCAnc2Vlbk5ld3NWZXJzaW9uJyxcbiAgICAgICdleHRlbnNpb25JbnN0YWxsRGF0ZSddXG4gICAgcHJlZnMuZ2V0KHVzZXJQcm9wcywgc2hvdylcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsb3NlUG9wdXAoKSB7XG4gICAgbGV0IGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50JylcbiAgICBldmVudC5pbml0Q3VzdG9tRXZlbnQoJ2Nsb3NlLXBvcHVwJywgdHJ1ZSwgdHJ1ZSwge30pXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpXG4gIH1cblxuXG4gIGZ1bmN0aW9uIG9wZW5HcmFtbWFybHkoZSkge1xuICAgIGlmICghcmVzb2x2ZUVsKGUudGFyZ2V0LCAnb3BlbkdyYW1tYXJseScpKSByZXR1cm5cbiAgICBmb3JnZS50YWJzLm9wZW4oVVJMUy5hcHApXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgY2xvc2VQb3B1cCgpXG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVQb3B1cFNpemUoZWwpIHtcbiAgICBsZXQgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKVxuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuaGVpZ2h0ID0gJydcbiAgICBldmVudC5pbml0Q3VzdG9tRXZlbnQoJ3VwZGF0ZS13aW5kb3ctc2l6ZScsIHRydWUsIHRydWUsIHtcbiAgICAgIHdpZHRoOiBlbC5jbGllbnRXaWR0aCxcbiAgICAgIGhlaWdodDogZWwuY2xpZW50SGVpZ2h0IC0gMVxuICAgIH0pXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpXG4gIH1cblxuXG4gIGZ1bmN0aW9uIHNob3codXNlcikge1xuICAgIGNhbGwoJ2ZlbG9nLmluZm8nLCAnZXh0ZW5zaW9uX2J0bl9jbGljaycpXG5cbiAgICBsZXQgdmVyc2lvbiA9IGdldFZlcnNpb24oKVxuXG4gICAgbGV0IHNob3dOZXdzID0gbmV3cy5pc1Nob3dOZXdzVG9Vc2VyKHVzZXIpXG5cbiAgICBsZXQgZW5hYmxlZERlZnMgPSB1c2VyLmVuYWJsZWREZWZzXG5cbiAgICBpZiAoIXVzZXIgfHwgdXNlci5hbm9ueW1vdXMpIHtcbiAgICAgIGxldCBzID0gU2lnbmluKClcbiAgICAgIHVwZGF0ZVBvcHVwU2l6ZSh7Y2xpZW50V2lkdGg6IDM0NywgY2xpZW50SGVpZ2h0OiAzMjR9KVxuICAgICAgcy5vbignbG9hZCcsIHVwZGF0ZVBvcHVwU2l6ZSlcbiAgICAgIGRpYWxvZyA9IHNcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmICh3aW5kb3cuY2hyb21lICYmIHdpbmRvdy5jaHJvbWUudGFicykge1xuICAgICAgZ2V0U2VsZWN0ZWRUYWJGYXZpY29uKHJ1blNldHRpbmdzKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJ1blNldHRpbmdzKClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBydW5TZXR0aW5ncyhmYXZpY29uKSB7XG4gICAgICBnZXREb21haW4oZG9tYWluID0+IHtcbiAgICAgICAgcHJlZnMuZW5hYmxlZCgnJywgZG9tYWluLCAoZW5hYmxlZCkgPT4ge1xuICAgICAgICAgIGlmIChmYXZpY29uICYmIGZhdmljb24uaW5kZXhPZignY2hyb21lOicpICE9IC0xKSBmYXZpY29uID0gbnVsbFxuICAgICAgICAgIGxldCBjcmVhdGVTZXR0aW5ncyA9IGlzQ2hlY2tpbmdFbmFibGVkT25Eb21haW4gPT4ge1xuICAgICAgICAgICAgbGV0IHJlc3VsdCA9IFNldHRpbmdzKHtcbiAgICAgICAgICAgICAgdXNlcixcbiAgICAgICAgICAgICAgc2hvd05ld3MsXG4gICAgICAgICAgICAgIHZlcnNpb24sXG4gICAgICAgICAgICAgIGlzQ2hlY2tpbmdFbmFibGVkT25Eb21haW4sXG4gICAgICAgICAgICAgIGVuYWJsZWQsXG4gICAgICAgICAgICAgIGRvbWFpbixcbiAgICAgICAgICAgICAgZmF2aWNvbixcbiAgICAgICAgICAgICAgZW5hYmxlZERlZnNcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICByZXN1bHQub24oJ2xvYWQnLCBlbCA9PiB7XG4gICAgICAgICAgICAgIHVwZGF0ZVBvcHVwU2l6ZShlbClcbiAgICAgICAgICAgICAgbWUuZW1pdCgnbG9hZCcpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgcmVzdWx0Lm9uKCdjbG9zZVBvcHVwJywgY2xvc2VQb3B1cClcblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgICAgICAgIH1cblxuICAgICAgICAgIGNhbGwoJ2duYXIuc2VuZCcsIGAke2dldEJyb3dzZXIoKX1FeHQvYnJvd3NlclRvb2xiYXJCdXR0b25DbGlja2VkYCwge3BhZ2VEb21haW46IGRvbWFpbn0pXG4gICAgICAgICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OkJyb3dzZXJfVG9vbGJhcl9CdXR0b25fQ2xpY2tlZCcsIHtwYWdlRG9tYWluOiBkb21haW59KVxuXG4gICAgICAgICAgY29uc3QgZW5hYmxlZE9uRG9tYWluID0gcGFnZUNvbmZpZy5jaGVja0RvbWFpbihkb21haW4pXG5cbiAgICAgICAgICBpZiAoIWVuYWJsZWRPbkRvbWFpbikge1xuICAgICAgICAgICAgY2FsbCgnZ25hci5zZW5kJywgYCR7Z2V0QnJvd3NlcigpfUV4dC9icm93c2VyVG9vbGJhckJ1dHRvbkNsaWNrZWQvdW5zdXBwb3J0ZWRgLCB7cGFnZURvbWFpbjogZG9tYWlufSlcbiAgICAgICAgICAgIGNhbGwoJ21peHBhbmVsLnRyYWNrJywgJ0V4dDpTZXR0aW5nc19PcGVuX1Vuc3VwcG9ydGVkX0RvbWFpbicsIHtwYWdlRG9tYWluOiBkb21haW59KVxuICAgICAgICAgICAgY2FsbCgnZmVsb2cuaW5mbycsICdzZXR0aW5nc19vcGVuX3Vuc3VwcG9ydGVkX2RvbWFpbicsIHtwYWdlRG9tYWluOiBkb21haW59KVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGRpYWxvZyA9IGNyZWF0ZVNldHRpbmdzKGVuYWJsZWRPbkRvbWFpbilcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfVxuXG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgdW5saXN0ZW4od2luZG93LCAnY2xpY2snLCBvcGVuR3JhbW1hcmx5KVxuICAgIHJlbW92ZUNsYXNzKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ3dpbmRvd3MnKVxuICAgIGRpYWxvZyAmJiBkaWFsb2cucmVtb3ZlKClcbiAgfVxuXG4gIGxldCBtZSA9IGVtaXR0ZXIoe1xuICAgIHNob3csXG4gICAgcmVtb3ZlLFxuICAgIHN0YXJ0XG4gIH0pXG5cbiAgcmV0dXJuIG1lXG5cbn0oKSlcbiJdfQ==
},{"../bg/chrome":"/project/src/js/lib/bg/chrome.js","../bg/news":"/project/src/js/lib/bg/news.js","../config":"/project/src/js/lib/config.js","../dom":"/project/src/js/lib/dom.js","../location":"/project/src/js/lib/location.js","../page-config":"/project/src/js/lib/page-config/index.js","../prefs":"/project/src/js/lib/prefs.js","../test-api":"/project/src/js/lib/test-api.js","../tracking/index":"/project/src/js/lib/tracking/index.js","../util":"/project/src/js/lib/util.js","./settings":"/project/src/js/lib/popup/settings.js","./signin":"/project/src/js/lib/popup/signin.js","babel/polyfill":"babel/polyfill","emitter":"emitter"}],"/project/src/js/lib/popup/referral_line.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

//eslint-disable-line

var _config = require('../config');

var _stylReferralStyl = require('styl/referral.styl');

var _stylReferralStyl2 = _interopRequireDefault(_stylReferralStyl);

var _trackingIndex = require('../tracking/index');

var _message = require('../message');

var _message2 = _interopRequireDefault(_message);

var ReferralLine = (function (_React$Component) {
  _inherits(ReferralLine, _React$Component);

  function ReferralLine() {
    _classCallCheck(this, ReferralLine);

    _get(Object.getPrototypeOf(ReferralLine.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(ReferralLine, [{
    key: 'isShow',
    value: function isShow() {
      var _props$user = this.props.user;
      var user = _props$user === undefined ? {} : _props$user;

      var isPremiumShow = user.premium === true && user.subscriptionFree === true;
      var isFreeShow = user.premium === false;
      var isInReferralGroup = user.groups && user.groups.some(function () {
        var el = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
        return el.indexOf('referral_locked') > -1 || el == 'referral' || el == 'test_group';
      });
      return (isPremiumShow || isFreeShow) && !!isInReferralGroup;
    }
  }, {
    key: 'isRibbonShow',
    value: function isRibbonShow() {
      var _props$user2 = this.props.user;
      var user = _props$user2 === undefined ? {} : _props$user2;
      var extensionInstallDate = user.extensionInstallDate;

      var regDate = new Date(extensionInstallDate).getTime();
      var now = new Date().getTime();
      var oneWeek = 1000 * 60 * 60 * 24 * 7;
      return regDate + oneWeek > now;
    }
  }, {
    key: 'onClickInvite',
    value: function onClickInvite() {
      (0, _trackingIndex.call)('mixpanel.track', 'WE:Referral_Button_Clicked', { placement: 'menu' });
      (0, _trackingIndex.call)('gnar.send', 'referral/referralButtonClicked', { placement: 'menu' });
      _message2['default'].emitBackground('open-url', _config.URLS.referral);
    }
  }, {
    key: 'render',
    value: function render() {
      var styles = ['setting_item', _stylReferralStyl2['default'].popupLine].join(' ');
      return _react2['default'].createElement(
        'div',
        null,
        this.isShow() && _react2['default'].createElement(
          'div',
          { className: styles },
          _react2['default'].createElement('div', { className: 'short_border top' }),
          this.isRibbonShow() && _react2['default'].createElement(
            'span',
            { className: _stylReferralStyl2['default'].newLabel },
            'New'
          ),
          _react2['default'].createElement(
            'span',
            null,
            'Get Premium for Free'
          ),
          _react2['default'].createElement(
            'a',
            { onClick: this.onClickInvite, target: '_blank', className: _stylReferralStyl2['default'].popupLink },
            'Invite Friends'
          )
        )
      );
    }
  }]);

  return ReferralLine;
})(_react2['default'].Component);

exports['default'] = ReferralLine;
module.exports = exports['default'];

},{"../config":"/project/src/js/lib/config.js","../message":"/project/src/js/lib/message.js","../tracking/index":"/project/src/js/lib/tracking/index.js","react":"react","styl/referral.styl":"/project/src/styl/referral.styl"}],"/project/src/js/lib/popup/settings-content.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _stylPopupSettingsStyl = require('styl/popup-settings.styl');

var _stylPopupSettingsStyl2 = _interopRequireDefault(_stylPopupSettingsStyl);

var _stylCheckboxStyl = require('styl/checkbox.styl');

var _stylCheckboxStyl2 = _interopRequireDefault(_stylCheckboxStyl);

var _referral_line = require('./referral_line');

var _referral_line2 = _interopRequireDefault(_referral_line);

var _config = require('../config');

var _dom = require('../dom');

var _util = require('../util');

var SettingsContent = (function (_React$Component) {
  _inherits(SettingsContent, _React$Component);

  function SettingsContent() {
    _classCallCheck(this, SettingsContent);

    _get(Object.getPrototypeOf(SettingsContent.prototype), 'constructor', this).apply(this, arguments);
  }

  _createClass(SettingsContent, [{
    key: 'render',
    value: function render() {
      var _cs, _cs2;

      var config = this.props.config,
          user = config.user,
          isCheckingEnabledOnDomain = config.isCheckingEnabledOnDomain,
          enabled = config.enabled && isCheckingEnabledOnDomain,
          enabledDefs = config.enabledDefs,
          disableLabel = !isCheckingEnabledOnDomain ? 'Checking is not supported' : 'Check for Grammar and Spelling',
          errorTypeLbl = user.premium ? 'critical and advanced' : 'critical',
          fixed = !user.fixed_errors || isNaN(user.fixed_errors) ? 0 : user.fixed_errors,
          fixedFormated = (0, _util.formatNumber)(fixed),
          lbl = (0, _util.declension)(fixed, ['fix', 'fixes', 'fixes']),
          dateStr = (0, _util.formatDate)(user.registrationDate),
          noFixes = fixedFormated == '0',
          siteSwitcherCls = (0, _dom.cs)((_cs = {}, _defineProperty(_cs, _stylPopupSettingsStyl2['default'].site_switcher, true), _defineProperty(_cs, _stylPopupSettingsStyl2['default'].line, true), _defineProperty(_cs, _stylPopupSettingsStyl2['default'].setting_item, true), _defineProperty(_cs, _stylPopupSettingsStyl2['default'].on, enabled), _defineProperty(_cs, _stylPopupSettingsStyl2['default'].off, !enabled), _cs)),
          defsSwitcherCls = (0, _dom.cs)((_cs2 = {}, _defineProperty(_cs2, _stylPopupSettingsStyl2['default'].def_switcher, true), _defineProperty(_cs2, _stylPopupSettingsStyl2['default'].line, true), _defineProperty(_cs2, _stylPopupSettingsStyl2['default'].setting_item, true), _defineProperty(_cs2, _stylPopupSettingsStyl2['default'].on, enabledDefs), _defineProperty(_cs2, _stylPopupSettingsStyl2['default'].off, !enabledDefs), _cs2));

      if (noFixes) fixedFormated = 'No';
      //String.fromCharCode(8217) - is '’'

      return _react2['default'].createElement(
        'div',
        null,
        _react2['default'].createElement(
          'div',
          { className: siteSwitcherCls },
          _react2['default'].createElement(
            'label',
            { className: _stylCheckboxStyl2['default'].select_checkbox },
            disableLabel,
            ' ',
            _react2['default'].createElement('br', null),
            ' ',
            _react2['default'].createElement(
              'span',
              { className: _stylPopupSettingsStyl2['default'].domain },
              _react2['default'].createElement(
                'span',
                { className: _stylPopupSettingsStyl2['default'].thin_text },
                'on'
              ),
              ' ',
              _react2['default'].createElement(
                'span',
                { className: _stylPopupSettingsStyl2['default'].favicon },
                _react2['default'].createElement('img', { width: '16px', height: '16px', src: config.favicon })
              ),
              config.domain
            ),
            _react2['default'].createElement('input', { className: _stylCheckboxStyl2['default'].checkbox, onChange: _util._f, checked: enabled, type: 'checkbox' }),
            _react2['default'].createElement(
              'div',
              { className: _stylCheckboxStyl2['default'].checkbox_check + ' ' + _stylPopupSettingsStyl2['default'].checkbox_check },
              _react2['default'].createElement('div', { className: _stylCheckboxStyl2['default'].checkbox_check_round })
            )
          ),
          _react2['default'].createElement('div', { className: _stylPopupSettingsStyl2['default'].short_border })
        ),
        _react2['default'].createElement(
          'div',
          { className: defsSwitcherCls },
          _react2['default'].createElement(
            'label',
            { className: _stylCheckboxStyl2['default'].select_checkbox },
            'Show Definitions and Synonyms ',
            _react2['default'].createElement('br', null),
            'via Double-Clicks (All Sites)',
            _react2['default'].createElement('input', { className: _stylCheckboxStyl2['default'].checkbox, onChange: _util._f, checked: enabledDefs, type: 'checkbox' }),
            _react2['default'].createElement(
              'div',
              { className: _stylCheckboxStyl2['default'].checkbox_check },
              _react2['default'].createElement('div', { className: _stylCheckboxStyl2['default'].checkbox_check_round })
            )
          ),
          _react2['default'].createElement('div', { className: _stylPopupSettingsStyl2['default'].short_border })
        ),
        _react2['default'].createElement(
          'div',
          { className: _stylPopupSettingsStyl2['default'].line + ' ' + _stylPopupSettingsStyl2['default'].summary },
          _react2['default'].createElement(
            'div',
            { className: _stylPopupSettingsStyl2['default'].errors },
            _react2['default'].createElement(
              'span',
              { className: _stylPopupSettingsStyl2['default'].count + ' ' + _stylPopupSettingsStyl2['default'].lblCount },
              fixedFormated
            ),
            _react2['default'].createElement(
              'span',
              { className: _stylPopupSettingsStyl2['default'].descr },
              errorTypeLbl,
              ' ',
              _react2['default'].createElement(
                'span',
                { className: _stylPopupSettingsStyl2['default'].errorsLbl },
                lbl
              ),
              ' ',
              _react2['default'].createElement(
                'span',
                { className: _stylPopupSettingsStyl2['default'].since },
                'since ',
                dateStr
              )
            )
          ),
          _react2['default'].createElement(
            'div',
            { className: _stylPopupSettingsStyl2['default'].upgrade },
            _react2['default'].createElement(
              'a',
              { className: _stylPopupSettingsStyl2['default'].upgrade_title, target: '_blank', href: _config.URLS.upgrade },
              'Go Premium to enable advanced fixes'
            )
          )
        ),
        _react2['default'].createElement(_referral_line2['default'], { user: config.user })
      );
    }
  }]);

  return SettingsContent;
})(_react2['default'].Component);

exports['default'] = SettingsContent;
module.exports = exports['default'];

},{"../config":"/project/src/js/lib/config.js","../dom":"/project/src/js/lib/dom.js","../util":"/project/src/js/lib/util.js","./referral_line":"/project/src/js/lib/popup/referral_line.js","react":"react","styl/checkbox.styl":"/project/src/styl/checkbox.styl","styl/popup-settings.styl":"/project/src/styl/popup-settings.styl"}],"/project/src/js/lib/popup/settings.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _emitter = require('emitter');

var _emitter2 = _interopRequireDefault(_emitter);

var _reactDom = require('react-dom');

var _forge = require('../forge');

var _forge2 = _interopRequireDefault(_forge);

var _prefs = require('../prefs');

var _prefs2 = _interopRequireDefault(_prefs);

var _bgNews = require('../bg/news');

var _bgNews2 = _interopRequireDefault(_bgNews);

var _message = require('../message');

var _message2 = _interopRequireDefault(_message);

var _request = require('../request');

var _trackingIndex = require('../tracking/index');

var _location = require('../location');

var _config = require('../config');

var _dom = require('../dom');

var _util = require('../util');

var _bgReferrals = require('../bg/referrals');

var _stylPopupSettingsStyl = require('styl/popup-settings.styl');

var _stylPopupSettingsStyl2 = _interopRequireDefault(_stylPopupSettingsStyl);

var _stylCheckboxStyl = require('styl/checkbox.styl');

var _stylCheckboxStyl2 = _interopRequireDefault(_stylCheckboxStyl);

var _header = require('./header');

var _header2 = _interopRequireDefault(_header);

var _news = require('./news');

var _news2 = _interopRequireDefault(_news);

var _footer = require('./footer');

var _footer2 = _interopRequireDefault(_footer);

var _settingsContent = require('./settings-content');

var _settingsContent2 = _interopRequireDefault(_settingsContent);

function Settings(config) {
  var id = (0, _util.guid)(),
      container = render(),
      el = (0, _reactDom.findDOMNode)(container.component),
      btnNew = el.querySelector('.' + _stylPopupSettingsStyl2['default'].new_document),
      btnPremium = el.querySelector('.' + _stylPopupSettingsStyl2['default'].upgrade_title),
      cbEnableGrammar = el.querySelector('.' + _stylPopupSettingsStyl2['default'].site_switcher + ' .' + _stylCheckboxStyl2['default'].checkbox),
      cbEnableDefs = el.querySelector('.' + _stylPopupSettingsStyl2['default'].def_switcher + ' .' + _stylCheckboxStyl2['default'].checkbox),
      btnCloseNews = el.querySelector('.' + _stylPopupSettingsStyl2['default'].close_news);

  (0, _dom.listen)(btnNew, 'click', addDocument);
  (0, _dom.listen)(cbEnableGrammar, 'click', onEnableGrammarClick);
  (0, _dom.listen)(cbEnableDefs, 'click', onEnableDefsClick);
  (0, _dom.listen)(btnPremium, 'click', openPremium);
  (0, _dom.listen)(btnCloseNews, 'click', closeNews);

  function go(docId) {
    var url = _config.URLS.docs + '/' + docId;
    _message2['default'].emitBackground('open-url', url);
    (0, _trackingIndex.call)('felog.info', 'extension_popup_goto', { url: url });
    me.emit('closePopup');
  }

  function openPremium(e) {
    var pageDomain;
    return regeneratorRuntime.async(function openPremium$(context$2$0) {
      while (1) switch (context$2$0.prev = context$2$0.next) {
        case 0:
          e.preventDefault();
          context$2$0.next = 3;
          return regeneratorRuntime.awrap((0, _location.promiseGetDomain)());

        case 3:
          pageDomain = context$2$0.sent;

          _message2['default'].emitBackground('open-url', _config.URLS.upgrade);
          (0, _trackingIndex.fire)('upgrade', 'settings_toolbar', pageDomain);
          me.emit('closePopup');

        case 7:
        case 'end':
          return context$2$0.stop();
      }
    }, null, this);
  }

  function closeNews() {
    config.fadeNews = true;
    render();
    me.emit('load', {
      clientHeight: el.clientHeight - btnCloseNews.parentNode.clientHeight,
      clientWidth: el.clientWidth
    });
    (0, _trackingIndex.call)('mixpanel.track', 'Ext:Close_News:Popup');
  }

  function onEnableGrammarClick(e) {
    config.enabled = cbEnableGrammar.checked;
    _prefs2['default'].enabled(config.enabled, config.domain);
    render();
    _forge2['default'] && _forge2['default'].button.setBadge(config.enabled ? '' : 'off');
    var trackData = {
      enabled: config.enabled,
      pageDomain: config.domain
    };

    (0, _trackingIndex.call)('felog.info', 'toggle_extension_on_site', trackData);
    (0, _trackingIndex.call)('statsc.ui.increment', 'stability:toggle_extension_on_site');
    (0, _trackingIndex.call)('mixpanel.track', 'Ext:Checking_Toggled:Popup', trackData);
    (0, _trackingIndex.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/checkingToggled', trackData);
  }

  function onEnableDefsClick(e) {
    config.enabledDefs = cbEnableDefs.checked;
    _prefs2['default'].set('enabledDefs', config.enabledDefs);
    render();
    var trackData = {
      enabled: config.enabledDefs
    };
    (0, _trackingIndex.call)('felog.info', 'toggle_extension_defs', trackData);
    (0, _trackingIndex.call)('mixpanel.track', 'Ext:Definitions_Toggled:Popup', trackData);
    (0, _trackingIndex.call)('statsc.ui.increment', 'stability:definitions_toggled');
    (0, _trackingIndex.call)('gnar.send', (0, _util.getBrowser)() + 'Ext/definitionsToggled', trackData);
  }

  function addDocument() {
    (0, _request.fetch)(_config.URLS.docsApi, {
      data: { content: '' },
      method: 'post',
      headers: { 'Content-Type': 'application/json' }
    }).then(function (doc) {
      return go(doc.id);
    })['catch'](requestError);
  }

  function requestError(e) {
    (0, _trackingIndex.call)('felog.warn', 'ajax_error', { e: e });
    console.error('request failed', e);
  }

  if (!(0, _util.isFF)()) {
    (0, _dom.addClass)(document.documentElement, 'gr-popup-wrapper-relayout');
    (0, _dom.addClass)(document.body, 'gr-popup-wrapper-relayout');
  }

  function render() {
    try {
      return (0, _dom.renderReactWithParent)(_react2['default'].createElement(SettingsComponent, { config: config }), config.el || document.body, id, 'settings');
    } catch (e) {
      console.error(e);
    }
  }

  var me = (0, _emitter2['default'])({
    remove: container.remove
  });

  setTimeout(function () {
    _bgNews2['default'].install();
    (0, _bgReferrals.seenReferralRibbon)(true);
    me.emit('load', el);
  }, 110);

  return me;
}

exports['default'] = Settings;

var SettingsComponent = _react2['default'].createClass({
  displayName: 'SettingsComponent',

  componentDidMount: function componentDidMount() {
    if (!(0, _util.isFF)()) {
      setTimeout(function () {
        (0, _dom.removeClass)(document.documentElement, 'gr-popup-wrapper-relayout');
        (0, _dom.removeClass)(document.body, 'gr-popup-wrapper-relayout');
      }, 100);
    }
  },
  render: function render() {
    var _cs;

    var config = this.props.config,
        user = config.user;

    var cls = (0, _dom.cs)((_cs = {}, _defineProperty(_cs, _stylPopupSettingsStyl2['default'].gr_popup_settings, true), _defineProperty(_cs, _stylPopupSettingsStyl2['default'].upgraded, user.premium), _defineProperty(_cs, _stylPopupSettingsStyl2['default'].not_supported, !config.isCheckingEnabledOnDomain), _defineProperty(_cs, _stylPopupSettingsStyl2['default'].no_fixes, !user.fixed_errors || isNaN(user.fixed_errors)), _defineProperty(_cs, _stylPopupSettingsStyl2['default'].free, !user.premium), _defineProperty(_cs, _stylPopupSettingsStyl2['default'].show_news, config.showNews), _defineProperty(_cs, _stylPopupSettingsStyl2['default'].fade_news, config.fadeNews), _defineProperty(_cs, _stylPopupSettingsStyl2['default'].has_favicon, !!config.favicon), _cs));

    return _react2['default'].createElement(
      'div',
      { className: cls },
      _react2['default'].createElement(
        'div',
        { className: _stylPopupSettingsStyl2['default'].content },
        _react2['default'].createElement(_header2['default'], null),
        _react2['default'].createElement(_news2['default'], null),
        _react2['default'].createElement(_settingsContent2['default'], { config: config }),
        _react2['default'].createElement(_footer2['default'], null)
      )
    );
  }
});

exports.SettingsComponent = SettingsComponent;

},{"../bg/news":"/project/src/js/lib/bg/news.js","../bg/referrals":"/project/src/js/lib/bg/referrals.js","../config":"/project/src/js/lib/config.js","../dom":"/project/src/js/lib/dom.js","../forge":"/project/src/js/lib/forge.js","../location":"/project/src/js/lib/location.js","../message":"/project/src/js/lib/message.js","../prefs":"/project/src/js/lib/prefs.js","../request":"/project/src/js/lib/request.js","../tracking/index":"/project/src/js/lib/tracking/index.js","../util":"/project/src/js/lib/util.js","./footer":"/project/src/js/lib/popup/footer.js","./header":"/project/src/js/lib/popup/header.js","./news":"/project/src/js/lib/popup/news.js","./settings-content":"/project/src/js/lib/popup/settings-content.js","emitter":"emitter","react":"react","react-dom":"react-dom","styl/checkbox.styl":"/project/src/styl/checkbox.styl","styl/popup-settings.styl":"/project/src/styl/popup-settings.styl"}],"/project/src/js/lib/popup/signin.js":[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _dom = require('../dom');

var _util = require('../util');

var _config = require('../config');

var _emitter = require('emitter');

var _emitter2 = _interopRequireDefault(_emitter);

var _forge = (typeof window !== "undefined" ? window['forge'] : typeof global !== "undefined" ? global['forge'] : null);

var _forge2 = _interopRequireDefault(_forge);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactDom = require('react-dom');

var _stylPopupSigninStyl = require('styl/popup-signin.styl');

var _stylPopupSigninStyl2 = _interopRequireDefault(_stylPopupSigninStyl);

var _header = require('./header');

var _header2 = _interopRequireDefault(_header);

var _trackingIndex = require('../tracking/index');

function Signin() {
  var id = (0, _util.guid)();
  var container = (0, _dom.renderReactWithParent)(_react2['default'].createElement(SigninComponent, null), document.body, id),
      node = (0, _reactDom.findDOMNode)(container.component),
      me = (0, _emitter2['default'])({ React: _react2['default'] }); //react here to fix lint (React is defined but never used)
  me.emit('load', node);

  (0, _dom.listen)(node, 'click', function (e) {
    if (e.target.href && (0, _util.isSafari)()) {
      _forge2['default'].tabs.open(e.target.href);
      window.safari.extension.popovers[0].hide();
    }
  });

  me.remove = container.remove;
  me.el = node;
  return me;
}

exports['default'] = Signin;

var SigninComponent = _react2['default'].createClass({
  displayName: 'SigninComponent',

  onSignUp: function onSignUp(e) {
    (0, _trackingIndex.fire)('login-attempt', 'settings_toolbar_sign_up');
  },

  onSignIn: function onSignIn(e) {
    (0, _trackingIndex.fire)('login-attempt', 'settings_toolbar_sign_in');
  },

  render: function render() {
    return _react2['default'].createElement(
      'div',
      { className: _stylPopupSigninStyl2['default'].signin },
      _react2['default'].createElement(_header2['default'], null),
      _react2['default'].createElement(
        'div',
        { className: _stylPopupSigninStyl2['default'].content },
        _react2['default'].createElement(
          'div',
          { className: _stylPopupSigninStyl2['default'].banner },
          'Grammarly is active, but\u2028',
          _react2['default'].createElement('br', null),
          ' key features are missing'
        ),
        _react2['default'].createElement(
          'div',
          { className: _stylPopupSigninStyl2['default'].descr },
          _react2['default'].createElement(
            'div',
            { className: _stylPopupSigninStyl2['default'].descr_title },
            'Sign up now to unlock the following:'
          ),
          _react2['default'].createElement(
            'ul',
            null,
            _react2['default'].createElement(
              'li',
              null,
              'Store your personal dictionary'
            ),
            _react2['default'].createElement(
              'li',
              null,
              'Save and access your work from any computer'
            ),
            _react2['default'].createElement(
              'li',
              null,
              'Get weekly writing statistics and tips'
            )
          )
        ),
        _react2['default'].createElement(
          'div',
          { className: _stylPopupSigninStyl2['default'].buttons },
          _react2['default'].createElement(
            'a',
            { className: _stylPopupSigninStyl2['default'].button + ' ' + _stylPopupSigninStyl2['default'].auth_button, onClick: this.onSignUp, href: _config.URLS.signup, target: '__blank', role: 'button' },
            _react2['default'].createElement(
              'span',
              { className: _stylPopupSigninStyl2['default'].sign_up },
              'Sign Up'
            ),
            _react2['default'].createElement(
              'span',
              { className: _stylPopupSigninStyl2['default'].free },
              'It\'s free'
            )
          )
        )
      ),
      _react2['default'].createElement(
        'div',
        { className: _stylPopupSigninStyl2['default'].footer },
        _react2['default'].createElement(
          'div',
          { className: _stylPopupSigninStyl2['default'].login_text },
          'Already have an account? ',
          _react2['default'].createElement(
            'a',
            { className: _stylPopupSigninStyl2['default'].signin_link, onClick: this.onSignIn, href: _config.URLS.signin, target: '__blank' },
            'Log in'
          )
        )
      )
    );
  }
});
module.exports = exports['default'];

}).call(this,typeof window !== "undefined" ? window : {})
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9wcm9qZWN0L3NyYy9qcy9saWIvcG9wdXAvc2lnbmluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OzttQkFBNEMsUUFBUTs7b0JBQ3ZCLFNBQVM7O3NCQUNuQixXQUFXOzt1QkFDVixTQUFTOzs7O3FCQUNYLE9BQU87Ozs7cUJBQ1AsT0FBTzs7Ozt3QkFDQyxXQUFXOzttQ0FDbkIsd0JBQXdCOzs7O3NCQUN2QixVQUFVOzs7OzZCQUNWLG1CQUFtQjs7QUFFdEMsU0FBUyxNQUFNLEdBQUc7QUFDaEIsTUFBSSxFQUFFLEdBQUcsaUJBQU0sQ0FBQTtBQUNmLE1BQUksU0FBUyxHQUFHLGdDQUFzQixpQ0FBQyxlQUFlLE9BQUUsRUFBRSxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQztNQUMxRSxJQUFJLEdBQUcsMkJBQVksU0FBUyxDQUFDLFNBQVMsQ0FBQztNQUN6QyxFQUFFLEdBQUcsMEJBQVEsRUFBQyxLQUFLLG9CQUFBLEVBQUMsQ0FBQyxDQUFBO0FBQ3JCLElBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFBOztBQUVyQixtQkFBTyxJQUFJLEVBQUUsT0FBTyxFQUFFLFVBQVMsQ0FBQyxFQUFFO0FBQ2hDLFFBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUkscUJBQVUsRUFBRTtBQUMvQix5QkFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDOUIsWUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFBO0tBQzNDO0dBQ0YsQ0FBQyxDQUFBOztBQUVGLElBQUUsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQTtBQUM1QixJQUFFLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQTtBQUNaLFNBQU8sRUFBRSxDQUFBO0NBQ1Y7O3FCQUVjLE1BQU07O0FBR3JCLElBQUksZUFBZSxHQUFHLG1CQUFNLFdBQVcsQ0FBQzs7O0FBQ3RDLFVBQVEsRUFBQSxrQkFBQyxDQUFDLEVBQUU7QUFDViw2QkFBSyxlQUFlLEVBQUUsMEJBQTBCLENBQUMsQ0FBQTtHQUNsRDs7QUFFRCxVQUFRLEVBQUEsa0JBQUMsQ0FBQyxFQUFFO0FBQ1YsNkJBQUssZUFBZSxFQUFFLDBCQUEwQixDQUFDLENBQUE7R0FDbEQ7O0FBRUQsUUFBTSxFQUFBLGtCQUFHO0FBQ1AsV0FDRTs7UUFBSyxTQUFTLEVBQUUsaUNBQU0sTUFBTSxBQUFDO01BQzNCLDJEQUFTO01BQ1Q7O1VBQUssU0FBUyxFQUFFLGlDQUFNLE9BQU8sQUFBQztRQUM1Qjs7WUFBSyxTQUFTLEVBQUUsaUNBQU0sTUFBTSxBQUFDOztVQUN2Qyw0Q0FBSzs7U0FBK0I7UUFDMUI7O1lBQUssU0FBUyxFQUFFLGlDQUFNLEtBQUssQUFBQztVQUMxQjs7Y0FBSyxTQUFTLEVBQUUsaUNBQU0sV0FBVyxBQUFDOztXQUEyQztVQUM3RTs7O1lBQ0U7Ozs7YUFBdUM7WUFDdkM7Ozs7YUFBb0Q7WUFDcEQ7Ozs7YUFBK0M7V0FDNUM7U0FDRDtRQUNOOztZQUFLLFNBQVMsRUFBRSxpQ0FBTSxPQUFPLEFBQUM7VUFDNUI7O2NBQUcsU0FBUyxFQUFFLGlDQUFNLE1BQU0sR0FBRyxHQUFHLEdBQUcsaUNBQU0sV0FBVyxBQUFDLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLEFBQUMsRUFBQyxJQUFJLEVBQUUsYUFBSyxNQUFNLEFBQUMsRUFBQyxNQUFNLEVBQUMsU0FBUyxFQUFDLElBQUksRUFBQyxRQUFRO1lBQUM7O2dCQUFNLFNBQVMsRUFBRSxpQ0FBTSxPQUFPLEFBQUM7O2FBQWU7WUFBQTs7Z0JBQU0sU0FBUyxFQUFFLGlDQUFNLElBQUksQUFBQzs7YUFBaUI7V0FBSTtTQUMzTjtPQUNGO01BQ047O1VBQUssU0FBUyxFQUFFLGlDQUFNLE1BQU0sQUFBQztRQUMzQjs7WUFBSyxTQUFTLEVBQUUsaUNBQU0sVUFBVSxBQUFDOztVQUEwQjs7Y0FBRyxTQUFTLEVBQUUsaUNBQU0sV0FBVyxBQUFDLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxRQUFRLEFBQUMsRUFBQyxJQUFJLEVBQUUsYUFBSyxNQUFNLEFBQUMsRUFBQyxNQUFNLEVBQUMsU0FBUzs7V0FBVztTQUFNO09BQ3BLO0tBQ0YsQ0FDUDtHQUNGO0NBQ0YsQ0FBQyxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge3JlbmRlclJlYWN0V2l0aFBhcmVudCwgbGlzdGVufSBmcm9tICcuLi9kb20nXG5pbXBvcnQge2d1aWQsIGlzU2FmYXJpfSBmcm9tICcuLi91dGlsJ1xuaW1wb3J0IHtVUkxTfSBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgZW1pdHRlciBmcm9tICdlbWl0dGVyJ1xuaW1wb3J0IGZvcmdlIGZyb20gJ2ZvcmdlJ1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0J1xuaW1wb3J0IHtmaW5kRE9NTm9kZX0gZnJvbSAncmVhY3QtZG9tJ1xuaW1wb3J0IHN0eWxlIGZyb20gJ3N0eWwvcG9wdXAtc2lnbmluLnN0eWwnXG5pbXBvcnQgSGVhZGVyIGZyb20gJy4vaGVhZGVyJ1xuaW1wb3J0IHtmaXJlfSBmcm9tICcuLi90cmFja2luZy9pbmRleCdcblxuZnVuY3Rpb24gU2lnbmluKCkge1xuICBsZXQgaWQgPSBndWlkKClcbiAgbGV0IGNvbnRhaW5lciA9IHJlbmRlclJlYWN0V2l0aFBhcmVudCg8U2lnbmluQ29tcG9uZW50Lz4sIGRvY3VtZW50LmJvZHksIGlkKSxcbiAgICBub2RlID0gZmluZERPTU5vZGUoY29udGFpbmVyLmNvbXBvbmVudCksXG4gIG1lID0gZW1pdHRlcih7UmVhY3R9KSAvL3JlYWN0IGhlcmUgdG8gZml4IGxpbnQgKFJlYWN0IGlzIGRlZmluZWQgYnV0IG5ldmVyIHVzZWQpXG4gIG1lLmVtaXQoJ2xvYWQnLCBub2RlKVxuXG4gIGxpc3Rlbihub2RlLCAnY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgaWYgKGUudGFyZ2V0LmhyZWYgJiYgaXNTYWZhcmkoKSkge1xuICAgICAgZm9yZ2UudGFicy5vcGVuKGUudGFyZ2V0LmhyZWYpXG4gICAgICB3aW5kb3cuc2FmYXJpLmV4dGVuc2lvbi5wb3BvdmVyc1swXS5oaWRlKClcbiAgICB9XG4gIH0pXG5cbiAgbWUucmVtb3ZlID0gY29udGFpbmVyLnJlbW92ZVxuICBtZS5lbCA9IG5vZGVcbiAgcmV0dXJuIG1lXG59XG5cbmV4cG9ydCBkZWZhdWx0IFNpZ25pblxuXG5cbmxldCBTaWduaW5Db21wb25lbnQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG4gIG9uU2lnblVwKGUpIHtcbiAgICBmaXJlKCdsb2dpbi1hdHRlbXB0JywgJ3NldHRpbmdzX3Rvb2xiYXJfc2lnbl91cCcpXG4gIH0sXG5cbiAgb25TaWduSW4oZSkge1xuICAgIGZpcmUoJ2xvZ2luLWF0dGVtcHQnLCAnc2V0dGluZ3NfdG9vbGJhcl9zaWduX2luJylcbiAgfSxcblxuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZS5zaWduaW59PlxuICAgICAgICA8SGVhZGVyLz5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlLmNvbnRlbnR9PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZS5iYW5uZXJ9PkdyYW1tYXJseSBpcyBhY3RpdmUsIGJ1dOKAqDxici8+IGtleSBmZWF0dXJlcyBhcmUgbWlzc2luZzwvZGl2PlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZS5kZXNjcn0+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGUuZGVzY3JfdGl0bGV9PlNpZ24gdXAgbm93IHRvIHVubG9jayB0aGUgZm9sbG93aW5nOjwvZGl2PlxuICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICA8bGk+U3RvcmUgeW91ciBwZXJzb25hbCBkaWN0aW9uYXJ5PC9saT5cbiAgICAgICAgICAgICAgPGxpPlNhdmUgYW5kIGFjY2VzcyB5b3VyIHdvcmsgZnJvbSBhbnkgY29tcHV0ZXI8L2xpPlxuICAgICAgICAgICAgICA8bGk+R2V0IHdlZWtseSB3cml0aW5nIHN0YXRpc3RpY3MgYW5kIHRpcHM8L2xpPlxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGUuYnV0dG9uc30+XG4gICAgICAgICAgICA8YSBjbGFzc05hbWU9e3N0eWxlLmJ1dHRvbiArICcgJyArIHN0eWxlLmF1dGhfYnV0dG9ufSBvbkNsaWNrPXt0aGlzLm9uU2lnblVwfSBocmVmPXtVUkxTLnNpZ251cH0gdGFyZ2V0PSdfX2JsYW5rJyByb2xlPSdidXR0b24nPjxzcGFuIGNsYXNzTmFtZT17c3R5bGUuc2lnbl91cH0+U2lnbiBVcDwvc3Bhbj48c3BhbiBjbGFzc05hbWU9e3N0eWxlLmZyZWV9Pkl0J3MgZnJlZTwvc3Bhbj48L2E+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGUuZm9vdGVyfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGUubG9naW5fdGV4dH0+QWxyZWFkeSBoYXZlIGFuIGFjY291bnQ/IDxhIGNsYXNzTmFtZT17c3R5bGUuc2lnbmluX2xpbmt9IG9uQ2xpY2s9e3RoaXMub25TaWduSW59IGhyZWY9e1VSTFMuc2lnbmlufSB0YXJnZXQ9J19fYmxhbmsnPkxvZyBpbjwvYT48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn0pXG5cbiJdfQ==
},{"../config":"/project/src/js/lib/config.js","../dom":"/project/src/js/lib/dom.js","../tracking/index":"/project/src/js/lib/tracking/index.js","../util":"/project/src/js/lib/util.js","./header":"/project/src/js/lib/popup/header.js","emitter":"emitter","react":"react","react-dom":"react-dom","styl/popup-signin.styl":"/project/src/styl/popup-signin.styl"}],"/project/src/js/lib/prefs.js":[function(require,module,exports){
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

},{"./config":"/project/src/js/lib/config.js","./forge":"/project/src/js/lib/forge.js","./message":"/project/src/js/lib/message.js","./util":"/project/src/js/lib/util.js","whatwg-fetch":"whatwg-fetch"}],"/project/src/js/lib/test-api.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = api;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _dom = require('./dom');

var _message = require('./message');

var _message2 = _interopRequireDefault(_message);

var _util = require('./util');

function api() {
  (0, _dom.listen)(document, 'bg-reload', emitBgReload);
  (0, _dom.listen)(document, 'reset', emitReset);
  (0, _dom.listen)(document, 'get-tracker-log', getTrackerLog);
  (0, _dom.listen)(document, 'get-extid', getExtId);
  (0, _dom.listen)(document, 'get-capi-log', getCapiLog);
  (0, _dom.listen)(document, 'get-localforage', getLocalforage);
  (0, _dom.listen)(document, 'set-localforage', setLocalforage);

  function emitBgReload() {
    _message2['default'].emitBackground('bg-reload', {});
  }

  function emitReset() {
    _message2['default'].emitBackground('reset', {});
  }

  function getTrackerLog() {
    _message2['default'].emitBackground('get-tracker-log', {}, function (result) {
      return (0, _util.emitDomEvent)('tracker-log', result);
    });
  }

  function getCapiLog() {
    _message2['default'].emitBackground('get-capi-log', {}, function (result) {
      return (0, _util.emitDomEvent)('capi-log', result);
    });
  }

  function getExtId() {
    _message2['default'].emitBackground('get-extid', {}, function (result) {
      return (0, _util.emitDomEvent)('extid', result);
    });
  }

  function getLocalforage() {
    _message2['default'].emitBackground('get-localforage', {}, function (result) {
      return (0, _util.emitDomEvent)('localforage', result);
    });
  }

  function setLocalforage(e) {
    _message2['default'].emitBackground('set-localforage', { key: e.key, value: e.value }, function (result) {
      return (0, _util.emitDomEvent)('localforage', result);
    });
  }
}

module.exports = exports['default'];

},{"./dom":"/project/src/js/lib/dom.js","./message":"/project/src/js/lib/message.js","./util":"/project/src/js/lib/util.js"}],"/project/src/js/lib/tracking/call.js":[function(require,module,exports){
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

},{"lodash":"lodash"}],"/project/src/styl/checkbox.styl":[function(require,module,exports){
module.exports = {"select_checkbox":"_425-select_checkbox","checkbox":"_425-checkbox","checkbox_check":"_425-checkbox_check","checkbox_check_round":"_425-checkbox_check_round"}
},{}],"/project/src/styl/header-component.styl":[function(require,module,exports){
module.exports = {"header":"_441-header","logo":"_441-logo","chrome":"_441-chrome","safari":"_441-safari","firefox":"_441-firefox"}
},{}],"/project/src/styl/popup-settings.styl":[function(require,module,exports){
module.exports = {"safari":"safari","gr-popup-wrapper":"gr-popup-wrapper","gr-popup-wrapper-relayout":"gr-popup-wrapper-relayout","windows":"windows","setting_item":"setting_item","errors":"errors","descr":"descr","thin_text":"thin_text","footer":"footer","gr_popup_settings":"gr_popup_settings","footer_btn":"footer_btn","line":"line","short_border":"short_border","top":"top","show_news":"show_news","news":"news","fade_news":"fade_news","news_content":"news_content","close_news":"close_news","not_supported":"not_supported","checkbox_check":"checkbox_check","site_switcher":"site_switcher","upgrade":"upgrade","def_switcher":"def_switcher","on":"on","off":"off","upgraded":"upgraded","content":"content","summary":"summary","since":"since","has_favicon":"has_favicon","favicon":"favicon","domain":"domain","no_fixes":"no_fixes","lblCount":"lblCount","upgrade_title":"upgrade_title","my_grammarly":"my_grammarly","new_document":"new_document"}
},{}],"/project/src/styl/popup-signin.styl":[function(require,module,exports){
module.exports = {"signin":"_d52-signin","banner":"_d52-banner","descr":"_d52-descr","descr_title":"_d52-descr_title","buttons":"_d52-buttons","button":"_d52-button","auth_button":"_d52-auth_button","sign_up":"_d52-sign_up","free":"_d52-free","footer":"_d52-footer","signin_link":"_d52-signin_link"}
},{}],"/project/src/styl/referral.styl":[function(require,module,exports){
module.exports = {"wrap":"_6cb-wrap","line":"_6cb-line","description":"_6cb-description","inviteLink":"_6cb-inviteLink","popupLine":"_6cb-popupLine","newLabel":"_6cb-newLabel","popupLink":"_6cb-popupLink"}
},{}]},{},["/project/src/js/lib/popup/popup.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9wcm9qZWN0L25vZGVfbW9kdWxlcy9wcm94eXF1aXJlaWZ5L2xpYi9wcmVsdWRlLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9saWIvYjY0LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9idWZmZXIvbm9kZV9tb2R1bGVzL2lzLWFycmF5L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2RlZXAtZXh0ZW5kL2xpYi9kZWVwLWV4dGVuZC5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvYmcvY2hyb21lLmpzIiwic3JjL2pzL2xpYi9iZy9jb29raWUuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL2JnL25ld3MuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL2JnL3JlZmVycmFscy5qcyIsInNyYy9qcy9saWIvY29uZmlnLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9kb20uanMiLCJzcmMvanMvbGliL2ZvcmdlLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9sb2NhdGlvbi5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvbWVzc2FnZS5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvcGFnZS1jb25maWcvY29uZmlnLWJhc2UuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3BhZ2UtY29uZmlnL2NvbmZpZy1iZy5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvcGFnZS1jb25maWcvY29uZmlnLXBhZ2UuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3BhZ2UtY29uZmlnL2RlY29yYXRvci5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvcGFnZS1jb25maWcvZGVmYXVsdHMuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3BhZ2UtY29uZmlnL2luZGV4LmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9wYWdlLWNvbmZpZy9sb2NhbGZvcmFnZS5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvcGFnZS1jb25maWcvdXRpbHMuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3BvcHVwL2Zvb3Rlci5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvcG9wdXAvaGVhZGVyLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi9wb3B1cC9uZXdzLmpzIiwic3JjL2pzL2xpYi9wb3B1cC9wb3B1cC5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvcG9wdXAvcmVmZXJyYWxfbGluZS5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvcG9wdXAvc2V0dGluZ3MtY29udGVudC5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvcG9wdXAvc2V0dGluZ3MuanMiLCJzcmMvanMvbGliL3BvcHVwL3NpZ25pbi5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvcHJlZnMuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3JlcXVlc3QuanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3Rlc3QtYXBpLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi90cmFja2luZy9jYWxsLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi90cmFja2luZy9mZWxvZ1BpeGVsLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi90cmFja2luZy9pbmRleC5qcyIsIi9wcm9qZWN0L3NyYy9qcy9saWIvdHJhY2tpbmcvb24uanMiLCIvcHJvamVjdC9zcmMvanMvbGliL3RyYWNraW5nL3N0YXRzY1BpeGVsLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi90cmFja2luZy90cmFja2VyLmpzIiwiL3Byb2plY3Qvc3JjL2pzL2xpYi91dGlsLmpzIiwic3JjL3N0eWwvY2hlY2tib3guc3R5bCIsInNyYy9zdHlsL2hlYWRlci1jb21wb25lbnQuc3R5bCIsInNyYy9zdHlsL3BvcHVwLXNldHRpbmdzLnN0eWwiLCJzcmMvc3R5bC9wb3B1cC1zaWduaW4uc3R5bCIsInNyYy9zdHlsL3JlZmVycmFsLnN0eWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pnREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUk7QUFDSixVQUFRLEVBQVIsUUFBUTtBQUNSLFVBQVEsRUFBUixRQUFRO0FBQ1IsV0FBUyxFQUFULFNBQVM7QUFDVCxTQUFPLEVBQVAsT0FBTztBQUNQLFdBQVMsRUFBVCxTQUFTO0FBQ1QsTUFBSSxFQUFKLElBQUk7QUFDSixhQUFXLEVBQVgsV0FBVztBQUNYLFNBQU8sRUFBUCxPQUFPO0FBQ1AsTUFBSSxFQUFKLElBQUk7QUFDSixjQUFZLEVBQVosWUFBWTtBQUNaLHVCQUFxQixFQUFyQixxQkFBcUI7QUFDckIsTUFBSSxFQUFKLElBQUk7QUFDSixTQUFPLEVBQVAsT0FBTztBQUNQLFVBQVEsRUFBUixRQUFRO0FBQ1IsV0FBUyxFQUFULFNBQVM7QUFDVCxPQUFLLEVBQUwsS0FBSztBQUNMLFlBQVUsRUFBVixVQUFVO0FBQ1YsYUFBVyxFQUFYLFdBQVc7QUFDWCxjQUFZLEVBQVosWUFBWTtBQUNaLG1CQUFpQixFQUFqQixpQkFBaUI7QUFDakIsY0FBWSxFQUFaLFlBQVk7QUFDWixXQUFTLEVBQVQsU0FBUztBQUNULElBQUUsRUFBRixFQUFFLEVBQUUsRUFBRSxFQUFGLEVBQUU7Q0FDUDs7OztBQ2xSRDs7QUNBQTs7QUNBQTs7QUNBQTs7QUNBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiLy8gbW9kdWxlcyBhcmUgZGVmaW5lZCBhcyBhbiBhcnJheVxuLy8gWyBtb2R1bGUgZnVuY3Rpb24sIG1hcCBvZiByZXF1aXJldWlyZXMgXVxuLy9cbi8vIG1hcCBvZiByZXF1aXJldWlyZXMgaXMgc2hvcnQgcmVxdWlyZSBuYW1lIC0+IG51bWVyaWMgcmVxdWlyZVxuLy9cbi8vIGFueXRoaW5nIGRlZmluZWQgaW4gYSBwcmV2aW91cyBidW5kbGUgaXMgYWNjZXNzZWQgdmlhIHRoZVxuLy8gb3JpZyBtZXRob2Qgd2hpY2ggaXMgdGhlIHJlcXVpcmV1aXJlIGZvciBwcmV2aW91cyBidW5kbGVzXG5cbihmdW5jdGlvbiBvdXRlciAobW9kdWxlcywgY2FjaGUsIGVudHJ5KSB7XG4gICAgLy8gU2F2ZSB0aGUgcmVxdWlyZSBmcm9tIHByZXZpb3VzIGJ1bmRsZSB0byB0aGlzIGNsb3N1cmUgaWYgYW55XG4gICAgdmFyIHByZXZpb3VzUmVxdWlyZSA9IHR5cGVvZiByZXF1aXJlID09IFwiZnVuY3Rpb25cIiAmJiByZXF1aXJlO1xuXG4gICAgZnVuY3Rpb24gZmluZFByb3h5cXVpcmVpZnlOYW1lKCkge1xuICAgICAgICB2YXIgZGVwcyA9IE9iamVjdC5rZXlzKG1vZHVsZXMpXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChrKSB7IHJldHVybiBtb2R1bGVzW2tdWzFdOyB9KTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwcSA9IGRlcHNbaV1bJ3Byb3h5cXVpcmVpZnknXTtcbiAgICAgICAgICAgIGlmIChwcSkgcmV0dXJuIHBxO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHByb3h5cXVpcmVpZnlOYW1lID0gZmluZFByb3h5cXVpcmVpZnlOYW1lKCk7XG5cbiAgICBmdW5jdGlvbiBuZXdSZXF1aXJlKG5hbWUsIGp1bXBlZCl7XG4gICAgICAgIC8vIEZpbmQgdGhlIHByb3h5cXVpcmVpZnkgbW9kdWxlLCBpZiBwcmVzZW50XG4gICAgICAgIHZhciBwcWlmeSA9IChwcm94eXF1aXJlaWZ5TmFtZSAhPSBudWxsKSAmJiBjYWNoZVtwcm94eXF1aXJlaWZ5TmFtZV07XG5cbiAgICAgICAgLy8gUHJveHlxdWlyZWlmeSBwcm92aWRlcyBhIHNlcGFyYXRlIGNhY2hlIHRoYXQgaXMgdXNlZCB3aGVuIGluc2lkZVxuICAgICAgICAvLyBhIHByb3h5cXVpcmUgY2FsbCwgYW5kIGlzIHNldCB0byBudWxsIG91dHNpZGUgYSBwcm94eXF1aXJlIGNhbGwuXG4gICAgICAgIC8vIFRoaXMgYWxsb3dzIHRoZSByZWd1bGFyIGNhY2hpbmcgc2VtYW50aWNzIHRvIHdvcmsgY29ycmVjdGx5IGJvdGhcbiAgICAgICAgLy8gaW5zaWRlIGFuZCBvdXRzaWRlIHByb3h5cXVpcmUgY2FsbHMgd2hpbGUga2VlcGluZyB0aGUgY2FjaGVkXG4gICAgICAgIC8vIG1vZHVsZXMgaXNvbGF0ZWQuXG4gICAgICAgIC8vIFdoZW4gc3dpdGNoaW5nIGZyb20gb25lIHByb3h5cXVpcmUgY2FsbCB0byBhbm90aGVyLCBpdCBjbGVhcnNcbiAgICAgICAgLy8gdGhlIGNhY2hlIHRvIHByZXZlbnQgY29udGFtaW5hdGlvbiBiZXR3ZWVuIGRpZmZlcmVudCBzZXRzXG4gICAgICAgIC8vIG9mIHN0dWJzLlxuICAgICAgICB2YXIgY3VycmVudENhY2hlID0gKHBxaWZ5ICYmIHBxaWZ5LmV4cG9ydHMuX2NhY2hlKSB8fCBjYWNoZTtcblxuICAgICAgICBpZighY3VycmVudENhY2hlW25hbWVdKSB7XG4gICAgICAgICAgICBpZighbW9kdWxlc1tuYW1lXSkge1xuICAgICAgICAgICAgICAgIC8vIGlmIHdlIGNhbm5vdCBmaW5kIHRoZSB0aGUgbW9kdWxlIHdpdGhpbiBvdXIgaW50ZXJuYWwgbWFwIG9yXG4gICAgICAgICAgICAgICAgLy8gY2FjaGUganVtcCB0byB0aGUgY3VycmVudCBnbG9iYWwgcmVxdWlyZSBpZS4gdGhlIGxhc3QgYnVuZGxlXG4gICAgICAgICAgICAgICAgLy8gdGhhdCB3YXMgYWRkZWQgdG8gdGhlIHBhZ2UuXG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRSZXF1aXJlID0gdHlwZW9mIHJlcXVpcmUgPT0gXCJmdW5jdGlvblwiICYmIHJlcXVpcmU7XG4gICAgICAgICAgICAgICAgaWYgKCFqdW1wZWQgJiYgY3VycmVudFJlcXVpcmUpIHJldHVybiBjdXJyZW50UmVxdWlyZShuYW1lLCB0cnVlKTtcblxuICAgICAgICAgICAgICAgIC8vIElmIHRoZXJlIGFyZSBvdGhlciBidW5kbGVzIG9uIHRoaXMgcGFnZSB0aGUgcmVxdWlyZSBmcm9tIHRoZVxuICAgICAgICAgICAgICAgIC8vIHByZXZpb3VzIG9uZSBpcyBzYXZlZCB0byAncHJldmlvdXNSZXF1aXJlJy4gUmVwZWF0IHRoaXMgYXNcbiAgICAgICAgICAgICAgICAvLyBtYW55IHRpbWVzIGFzIHRoZXJlIGFyZSBidW5kbGVzIHVudGlsIHRoZSBtb2R1bGUgaXMgZm91bmQgb3JcbiAgICAgICAgICAgICAgICAvLyB3ZSBleGhhdXN0IHRoZSByZXF1aXJlIGNoYWluLlxuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91c1JlcXVpcmUpIHJldHVybiBwcmV2aW91c1JlcXVpcmUobmFtZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignQ2Fubm90IGZpbmQgbW9kdWxlIFxcJycgKyBuYW1lICsgJ1xcJycpO1xuICAgICAgICAgICAgICAgIGVyci5jb2RlID0gJ01PRFVMRV9OT1RfRk9VTkQnO1xuICAgICAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtID0gY3VycmVudENhY2hlW25hbWVdID0ge2V4cG9ydHM6e319O1xuXG4gICAgICAgICAgICAvLyBUaGUgbm9ybWFsIGJyb3dzZXJpZnkgcmVxdWlyZSBmdW5jdGlvblxuICAgICAgICAgICAgdmFyIHJlcSA9IGZ1bmN0aW9uKHgpe1xuICAgICAgICAgICAgICAgIHZhciBpZCA9IG1vZHVsZXNbbmFtZV1bMV1beF07XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld1JlcXVpcmUoaWQgPyBpZCA6IHgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb24gc3Vic3RpdHV0ZWQgZm9yIHByb3h5cXVpcmVpZnlcbiAgICAgICAgICAgIHZhciBtb2R1bGVSZXF1aXJlID0gZnVuY3Rpb24oeCl7XG4gICAgICAgICAgICAgICAgdmFyIHBxaWZ5ID0gKHByb3h5cXVpcmVpZnlOYW1lICE9IG51bGwpICYmIGNhY2hlW3Byb3h5cXVpcmVpZnlOYW1lXTtcbiAgICAgICAgICAgICAgICAvLyBPbmx5IHRyeSB0byB1c2UgdGhlIHByb3h5cXVpcmVpZnkgdmVyc2lvbiBpZiBpdCBoYXMgYmVlbiBgcmVxdWlyZWBkXG4gICAgICAgICAgICAgICAgaWYgKHBxaWZ5ICYmIHBxaWZ5LmV4cG9ydHMuX3Byb3h5KSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcWlmeS5leHBvcnRzLl9wcm94eShyZXEsIHgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXEoeCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgbW9kdWxlc1tuYW1lXVswXS5jYWxsKG0uZXhwb3J0cyxtb2R1bGVSZXF1aXJlLG0sbS5leHBvcnRzLG91dGVyLG1vZHVsZXMsY3VycmVudENhY2hlLGVudHJ5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycmVudENhY2hlW25hbWVdLmV4cG9ydHM7XG4gICAgfVxuICAgIGZvcih2YXIgaT0wO2k8ZW50cnkubGVuZ3RoO2krKykgbmV3UmVxdWlyZShlbnRyeVtpXSk7XG5cbiAgICAvLyBPdmVycmlkZSB0aGUgY3VycmVudCByZXF1aXJlIHdpdGggdGhpcyBuZXcgb25lXG4gICAgcmV0dXJuIG5ld1JlcXVpcmU7XG59KVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8ZmVyb3NzQGZlcm9zcy5vcmc+IDxodHRwOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxudmFyIGlzQXJyYXkgPSByZXF1aXJlKCdpcy1hcnJheScpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG52YXIgcm9vdFBhcmVudCA9IHt9XG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFVzZSBPYmplY3QgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIER1ZSB0byB2YXJpb3VzIGJyb3dzZXIgYnVncywgc29tZXRpbWVzIHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24gd2lsbCBiZSB1c2VkIGV2ZW5cbiAqIHdoZW4gdGhlIGJyb3dzZXIgc3VwcG9ydHMgdHlwZWQgYXJyYXlzLlxuICpcbiAqIE5vdGU6XG4gKlxuICogICAtIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgIGluc3RhbmNlcyxcbiAqICAgICBTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOC5cbiAqXG4gKiAgIC0gU2FmYXJpIDUtNyBsYWNrcyBzdXBwb3J0IGZvciBjaGFuZ2luZyB0aGUgYE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3JgIHByb3BlcnR5XG4gKiAgICAgb24gb2JqZWN0cy5cbiAqXG4gKiAgIC0gQ2hyb21lIDktMTAgaXMgbWlzc2luZyB0aGUgYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbi5cbiAqXG4gKiAgIC0gSUUxMCBoYXMgYSBicm9rZW4gYFR5cGVkQXJyYXkucHJvdG90eXBlLnN1YmFycmF5YCBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGFycmF5cyBvZlxuICogICAgIGluY29ycmVjdCBsZW5ndGggaW4gc29tZSBzaXR1YXRpb25zLlxuXG4gKiBXZSBkZXRlY3QgdGhlc2UgYnVnZ3kgYnJvd3NlcnMgYW5kIHNldCBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgIHRvIGBmYWxzZWAgc28gdGhleVxuICogZ2V0IHRoZSBPYmplY3QgaW1wbGVtZW50YXRpb24sIHdoaWNoIGlzIHNsb3dlciBidXQgYmVoYXZlcyBjb3JyZWN0bHkuXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gZ2xvYmFsLlRZUEVEX0FSUkFZX1NVUFBPUlQgIT09IHVuZGVmaW5lZFxuICA/IGdsb2JhbC5UWVBFRF9BUlJBWV9TVVBQT1JUXG4gIDogKGZ1bmN0aW9uICgpIHtcbiAgICAgIGZ1bmN0aW9uIEJhciAoKSB7fVxuICAgICAgdHJ5IHtcbiAgICAgICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgICAgIGFyci5mb28gPSBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9XG4gICAgICAgIGFyci5jb25zdHJ1Y3RvciA9IEJhclxuICAgICAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MiAmJiAvLyB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZFxuICAgICAgICAgICAgYXJyLmNvbnN0cnVjdG9yID09PSBCYXIgJiYgLy8gY29uc3RydWN0b3IgY2FuIGJlIHNldFxuICAgICAgICAgICAgdHlwZW9mIGFyci5zdWJhcnJheSA9PT0gJ2Z1bmN0aW9uJyAmJiAvLyBjaHJvbWUgOS0xMCBsYWNrIGBzdWJhcnJheWBcbiAgICAgICAgICAgIGFyci5zdWJhcnJheSgxLCAxKS5ieXRlTGVuZ3RoID09PSAwIC8vIGllMTAgaGFzIGJyb2tlbiBgc3ViYXJyYXlgXG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0pKClcblxuZnVuY3Rpb24ga01heExlbmd0aCAoKSB7XG4gIHJldHVybiBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVFxuICAgID8gMHg3ZmZmZmZmZlxuICAgIDogMHgzZmZmZmZmZlxufVxuXG4vKipcbiAqIENsYXNzOiBCdWZmZXJcbiAqID09PT09PT09PT09PT1cbiAqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGFyZSBhdWdtZW50ZWRcbiAqIHdpdGggZnVuY3Rpb24gcHJvcGVydGllcyBmb3IgYWxsIHRoZSBub2RlIGBCdWZmZXJgIEFQSSBmdW5jdGlvbnMuIFdlIHVzZVxuICogYFVpbnQ4QXJyYXlgIHNvIHRoYXQgc3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXQgcmV0dXJuc1xuICogYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogQnkgYXVnbWVudGluZyB0aGUgaW5zdGFuY2VzLCB3ZSBjYW4gYXZvaWQgbW9kaWZ5aW5nIHRoZSBgVWludDhBcnJheWBcbiAqIHByb3RvdHlwZS5cbiAqL1xuZnVuY3Rpb24gQnVmZmVyIChhcmcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAvLyBBdm9pZCBnb2luZyB0aHJvdWdoIGFuIEFyZ3VtZW50c0FkYXB0b3JUcmFtcG9saW5lIGluIHRoZSBjb21tb24gY2FzZS5cbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHJldHVybiBuZXcgQnVmZmVyKGFyZywgYXJndW1lbnRzWzFdKVxuICAgIHJldHVybiBuZXcgQnVmZmVyKGFyZylcbiAgfVxuXG4gIHRoaXMubGVuZ3RoID0gMFxuICB0aGlzLnBhcmVudCA9IHVuZGVmaW5lZFxuXG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICByZXR1cm4gZnJvbU51bWJlcih0aGlzLCBhcmcpXG4gIH1cblxuICAvLyBTbGlnaHRseSBsZXNzIGNvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh0aGlzLCBhcmcsIGFyZ3VtZW50cy5sZW5ndGggPiAxID8gYXJndW1lbnRzWzFdIDogJ3V0ZjgnKVxuICB9XG5cbiAgLy8gVW51c3VhbC5cbiAgcmV0dXJuIGZyb21PYmplY3QodGhpcywgYXJnKVxufVxuXG5mdW5jdGlvbiBmcm9tTnVtYmVyICh0aGF0LCBsZW5ndGgpIHtcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChsZW5ndGgpIHwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoYXRbaV0gPSAwXG4gICAgfVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHRoYXQsIHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIC8vIEFzc3VtcHRpb246IGJ5dGVMZW5ndGgoKSByZXR1cm4gdmFsdWUgaXMgYWx3YXlzIDwga01heExlbmd0aC5cbiAgdmFyIGxlbmd0aCA9IGJ5dGVMZW5ndGgoc3RyaW5nLCBlbmNvZGluZykgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG5cbiAgdGhhdC53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICByZXR1cm4gdGhhdFxufVxuXG5mdW5jdGlvbiBmcm9tT2JqZWN0ICh0aGF0LCBvYmplY3QpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihvYmplY3QpKSByZXR1cm4gZnJvbUJ1ZmZlcih0aGF0LCBvYmplY3QpXG5cbiAgaWYgKGlzQXJyYXkob2JqZWN0KSkgcmV0dXJuIGZyb21BcnJheSh0aGF0LCBvYmplY3QpXG5cbiAgaWYgKG9iamVjdCA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignbXVzdCBzdGFydCB3aXRoIG51bWJlciwgYnVmZmVyLCBhcnJheSBvciBzdHJpbmcnKVxuICB9XG5cbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAob2JqZWN0LmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgICByZXR1cm4gZnJvbVR5cGVkQXJyYXkodGhhdCwgb2JqZWN0KVxuICAgIH1cbiAgICBpZiAob2JqZWN0IGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodGhhdCwgb2JqZWN0KVxuICAgIH1cbiAgfVxuXG4gIGlmIChvYmplY3QubGVuZ3RoKSByZXR1cm4gZnJvbUFycmF5TGlrZSh0aGF0LCBvYmplY3QpXG5cbiAgcmV0dXJuIGZyb21Kc29uT2JqZWN0KHRoYXQsIG9iamVjdClcbn1cblxuZnVuY3Rpb24gZnJvbUJ1ZmZlciAodGhhdCwgYnVmZmVyKSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGJ1ZmZlci5sZW5ndGgpIHwgMFxuICB0aGF0ID0gYWxsb2NhdGUodGhhdCwgbGVuZ3RoKVxuICBidWZmZXIuY29weSh0aGF0LCAwLCAwLCBsZW5ndGgpXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheSAodGhhdCwgYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbi8vIER1cGxpY2F0ZSBvZiBmcm9tQXJyYXkoKSB0byBrZWVwIGZyb21BcnJheSgpIG1vbm9tb3JwaGljLlxuZnVuY3Rpb24gZnJvbVR5cGVkQXJyYXkgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIC8vIFRydW5jYXRpbmcgdGhlIGVsZW1lbnRzIGlzIHByb2JhYmx5IG5vdCB3aGF0IHBlb3BsZSBleHBlY3QgZnJvbSB0eXBlZFxuICAvLyBhcnJheXMgd2l0aCBCWVRFU19QRVJfRUxFTUVOVCA+IDEgYnV0IGl0J3MgY29tcGF0aWJsZSB3aXRoIHRoZSBiZWhhdmlvclxuICAvLyBvZiB0aGUgb2xkIEJ1ZmZlciBjb25zdHJ1Y3Rvci5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIHRoYXRbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAodGhhdCwgYXJyYXkpIHtcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2UsIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgYXJyYXkuYnl0ZUxlbmd0aFxuICAgIHRoYXQgPSBCdWZmZXIuX2F1Z21lbnQobmV3IFVpbnQ4QXJyYXkoYXJyYXkpKVxuICB9IGVsc2Uge1xuICAgIC8vIEZhbGxiYWNrOiBSZXR1cm4gYW4gb2JqZWN0IGluc3RhbmNlIG9mIHRoZSBCdWZmZXIgY2xhc3NcbiAgICB0aGF0ID0gZnJvbVR5cGVkQXJyYXkodGhhdCwgbmV3IFVpbnQ4QXJyYXkoYXJyYXkpKVxuICB9XG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKHRoYXQsIGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHRoYXQgPSBhbGxvY2F0ZSh0aGF0LCBsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICB0aGF0W2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gdGhhdFxufVxuXG4vLyBEZXNlcmlhbGl6ZSB7IHR5cGU6ICdCdWZmZXInLCBkYXRhOiBbMSwyLDMsLi4uXSB9IGludG8gYSBCdWZmZXIgb2JqZWN0LlxuLy8gUmV0dXJucyBhIHplcm8tbGVuZ3RoIGJ1ZmZlciBmb3IgaW5wdXRzIHRoYXQgZG9uJ3QgY29uZm9ybSB0byB0aGUgc3BlYy5cbmZ1bmN0aW9uIGZyb21Kc29uT2JqZWN0ICh0aGF0LCBvYmplY3QpIHtcbiAgdmFyIGFycmF5XG4gIHZhciBsZW5ndGggPSAwXG5cbiAgaWYgKG9iamVjdC50eXBlID09PSAnQnVmZmVyJyAmJiBpc0FycmF5KG9iamVjdC5kYXRhKSkge1xuICAgIGFycmF5ID0gb2JqZWN0LmRhdGFcbiAgICBsZW5ndGggPSBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIH1cbiAgdGhhdCA9IGFsbG9jYXRlKHRoYXQsIGxlbmd0aClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgdGhhdFtpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIHRoYXRcbn1cblxuaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gIEJ1ZmZlci5wcm90b3R5cGUuX19wcm90b19fID0gVWludDhBcnJheS5wcm90b3R5cGVcbiAgQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcbn1cblxuZnVuY3Rpb24gYWxsb2NhdGUgKHRoYXQsIGxlbmd0aCkge1xuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZSwgZm9yIGJlc3QgcGVyZm9ybWFuY2VcbiAgICB0aGF0ID0gQnVmZmVyLl9hdWdtZW50KG5ldyBVaW50OEFycmF5KGxlbmd0aCkpXG4gICAgdGhhdC5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIH0gZWxzZSB7XG4gICAgLy8gRmFsbGJhY2s6IFJldHVybiBhbiBvYmplY3QgaW5zdGFuY2Ugb2YgdGhlIEJ1ZmZlciBjbGFzc1xuICAgIHRoYXQubGVuZ3RoID0gbGVuZ3RoXG4gICAgdGhhdC5faXNCdWZmZXIgPSB0cnVlXG4gIH1cblxuICB2YXIgZnJvbVBvb2wgPSBsZW5ndGggIT09IDAgJiYgbGVuZ3RoIDw9IEJ1ZmZlci5wb29sU2l6ZSA+Pj4gMVxuICBpZiAoZnJvbVBvb2wpIHRoYXQucGFyZW50ID0gcm9vdFBhcmVudFxuXG4gIHJldHVybiB0aGF0XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBrTWF4TGVuZ3RoYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IGtNYXhMZW5ndGgoKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBrTWF4TGVuZ3RoKCkudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAoc3ViamVjdCwgZW5jb2RpbmcpIHtcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNsb3dCdWZmZXIpKSByZXR1cm4gbmV3IFNsb3dCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcpXG5cbiAgdmFyIGJ1ZiA9IG5ldyBCdWZmZXIoc3ViamVjdCwgZW5jb2RpbmcpXG4gIGRlbGV0ZSBidWYucGFyZW50XG4gIHJldHVybiBidWZcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuICEhKGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlcilcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgbXVzdCBiZSBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIHZhciBpID0gMFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkgYnJlYWtcblxuICAgICsraVxuICB9XG5cbiAgaWYgKGkgIT09IGxlbikge1xuICAgIHggPSBhW2ldXG4gICAgeSA9IGJbaV1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAncmF3JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghaXNBcnJheShsaXN0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignbGlzdCBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMuJylcblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcigwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmID0gbmV3IEJ1ZmZlcihsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldXG4gICAgaXRlbS5jb3B5KGJ1ZiwgcG9zKVxuICAgIHBvcyArPSBpdGVtLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHN0cmluZyA9ICcnICsgc3RyaW5nXG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAvLyBEZXByZWNhdGVkXG4gICAgICBjYXNlICdyYXcnOlxuICAgICAgY2FzZSAncmF3cyc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG4vLyBwcmUtc2V0IGZvciB2YWx1ZXMgdGhhdCBtYXkgZXhpc3QgaW4gdGhlIGZ1dHVyZVxuQnVmZmVyLnByb3RvdHlwZS5sZW5ndGggPSB1bmRlZmluZWRcbkJ1ZmZlci5wcm90b3R5cGUucGFyZW50ID0gdW5kZWZpbmVkXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICBzdGFydCA9IHN0YXJ0IHwgMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPT09IEluZmluaXR5ID8gdGhpcy5sZW5ndGggOiBlbmQgfCAwXG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcbiAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKGVuZCA8PSBzdGFydCkgcmV0dXJuICcnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gYmluYXJ5U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aCB8IDBcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIGlmICh0aGlzLmxlbmd0aCA+IDApIHtcbiAgICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLm1hdGNoKC8uezJ9L2cpLmpvaW4oJyAnKVxuICAgIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgfVxuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiAwXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICBieXRlT2Zmc2V0ID4+PSAwXG5cbiAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcbiAgaWYgKGJ5dGVPZmZzZXQgPj0gdGhpcy5sZW5ndGgpIHJldHVybiAtMVxuXG4gIC8vIE5lZ2F0aXZlIG9mZnNldHMgc3RhcnQgZnJvbSB0aGUgZW5kIG9mIHRoZSBidWZmZXJcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwKSBieXRlT2Zmc2V0ID0gTWF0aC5tYXgodGhpcy5sZW5ndGggKyBieXRlT2Zmc2V0LCAwKVxuXG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSByZXR1cm4gLTEgLy8gc3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcgYWx3YXlzIGZhaWxzXG4gICAgcmV0dXJuIFN0cmluZy5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKHRoaXMsIHZhbCwgYnl0ZU9mZnNldClcbiAgfVxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbCkpIHtcbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldClcbiAgfVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbCh0aGlzLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YodGhpcywgWyB2YWwgXSwgYnl0ZU9mZnNldClcbiAgfVxuXG4gIGZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQpIHtcbiAgICB2YXIgZm91bmRJbmRleCA9IC0xXG4gICAgZm9yICh2YXIgaSA9IDA7IGJ5dGVPZmZzZXQgKyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXJyW2J5dGVPZmZzZXQgKyBpXSA9PT0gdmFsW2ZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4XSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbC5sZW5ndGgpIHJldHVybiBieXRlT2Zmc2V0ICsgZm91bmRJbmRleFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiAtMVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuLy8gYGdldGAgaXMgZGVwcmVjYXRlZFxuQnVmZmVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiBnZXQgKG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLmdldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMucmVhZFVJbnQ4KG9mZnNldClcbn1cblxuLy8gYHNldGAgaXMgZGVwcmVjYXRlZFxuQnVmZmVyLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiBzZXQgKHYsIG9mZnNldCkge1xuICBjb25zb2xlLmxvZygnLnNldCgpIGlzIGRlcHJlY2F0ZWQuIEFjY2VzcyB1c2luZyBhcnJheSBpbmRleGVzIGluc3RlYWQuJylcbiAgcmV0dXJuIHRoaXMud3JpdGVVSW50OCh2LCBvZmZzZXQpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgLy8gbXVzdCBiZSBhbiBldmVuIG51bWJlciBvZiBkaWdpdHNcbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcbiAgaWYgKHN0ckxlbiAlIDIgIT09IDApIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBoZXggc3RyaW5nJylcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAoaXNOYU4ocGFyc2VkKSkgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGhleCBzdHJpbmcnKVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmluYXJ5V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggfCAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgLy8gbGVnYWN5IHdyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldCwgbGVuZ3RoKSAtIHJlbW92ZSBpbiB2MC4xM1xuICB9IGVsc2Uge1xuICAgIHZhciBzd2FwID0gZW5jb2RpbmdcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIG9mZnNldCA9IGxlbmd0aCB8IDBcbiAgICBsZW5ndGggPSBzd2FwXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignYXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGJpbmFyeVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gYmluYXJ5U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIGJ5dGVzW2kgKyAxXSAqIDI1NilcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIG5ld0J1ZiA9IEJ1ZmZlci5fYXVnbWVudCh0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpKVxuICB9IGVsc2Uge1xuICAgIHZhciBzbGljZUxlbiA9IGVuZCAtIHN0YXJ0XG4gICAgbmV3QnVmID0gbmV3IEJ1ZmZlcihzbGljZUxlbiwgdW5kZWZpbmVkKVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2xpY2VMZW47IGkrKykge1xuICAgICAgbmV3QnVmW2ldID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9XG5cbiAgaWYgKG5ld0J1Zi5sZW5ndGgpIG5ld0J1Zi5wYXJlbnQgPSB0aGlzLnBhcmVudCB8fCB0aGlzXG5cbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoIHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdidWZmZXIgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3ZhbHVlIGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpLCAwKVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpLCAwKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCB8IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkgdmFsdWUgPSBNYXRoLmZsb29yKHZhbHVlKVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQxNiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmYgKyB2YWx1ZSArIDFcbiAgZm9yICh2YXIgaSA9IDAsIGogPSBNYXRoLm1pbihidWYubGVuZ3RoIC0gb2Zmc2V0LCAyKTsgaSA8IGo7IGkrKykge1xuICAgIGJ1ZltvZmZzZXQgKyBpXSA9ICh2YWx1ZSAmICgweGZmIDw8ICg4ICogKGxpdHRsZUVuZGlhbiA/IGkgOiAxIC0gaSkpKSkgPj4+XG4gICAgICAobGl0dGxlRW5kaWFuID8gaSA6IDEgLSBpKSAqIDhcbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gdmFsdWVcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUpXG4gIH1cbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDFdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5mdW5jdGlvbiBvYmplY3RXcml0ZVVJbnQzMiAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4pIHtcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGZvciAodmFyIGkgPSAwLCBqID0gTWF0aC5taW4oYnVmLmxlbmd0aCAtIG9mZnNldCwgNCk7IGkgPCBqOyBpKyspIHtcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSAodmFsdWUgPj4+IChsaXR0bGVFbmRpYW4gPyBpIDogMyAtIGkpICogOCkgJiAweGZmXG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gdmFsdWUgPCAwID8gMSA6IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGggLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSB2YWx1ZSA8IDAgPyAxIDogMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB2YWx1ZSA9IE1hdGguZmxvb3IodmFsdWUpXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9IHZhbHVlXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQxNih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgaWYgKEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSB2YWx1ZVxuICB9IGVsc2Uge1xuICAgIG9iamVjdFdyaXRlVUludDE2KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlKVxuICB9XG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgfCAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICB0aGlzW29mZnNldF0gPSB2YWx1ZVxuICAgIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIH0gZWxzZSB7XG4gICAgb2JqZWN0V3JpdGVVSW50MzIodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0IHwgMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIGlmIChCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCkge1xuICAgIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gICAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gICAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgICB0aGlzW29mZnNldCArIDNdID0gdmFsdWVcbiAgfSBlbHNlIHtcbiAgICBvYmplY3RXcml0ZVVJbnQzMih0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSlcbiAgfVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCd2YWx1ZSBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdpbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gd3JpdGVGbG9hdExFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG4gIHZhciBpXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yIChpID0gbGVuIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2UgaWYgKGxlbiA8IDEwMDAgfHwgIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUKSB7XG4gICAgLy8gYXNjZW5kaW5nIGNvcHkgZnJvbSBzdGFydFxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGFyZ2V0Ll9zZXQodGhpcy5zdWJhcnJheShzdGFydCwgc3RhcnQgKyBsZW4pLCB0YXJnZXRTdGFydClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gZmlsbCh2YWx1ZSwgc3RhcnQ9MCwgZW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWx1ZSwgc3RhcnQsIGVuZCkge1xuICBpZiAoIXZhbHVlKSB2YWx1ZSA9IDBcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kKSBlbmQgPSB0aGlzLmxlbmd0aFxuXG4gIGlmIChlbmQgPCBzdGFydCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ2VuZCA8IHN0YXJ0JylcblxuICAvLyBGaWxsIDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVyblxuICBpZiAodGhpcy5sZW5ndGggPT09IDApIHJldHVyblxuXG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdzdGFydCBvdXQgb2YgYm91bmRzJylcbiAgaWYgKGVuZCA8IDAgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdlbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gdmFsdWVcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gdXRmOFRvQnl0ZXModmFsdWUudG9TdHJpbmcoKSlcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGBBcnJheUJ1ZmZlcmAgd2l0aCB0aGUgKmNvcGllZCogbWVtb3J5IG9mIHRoZSBidWZmZXIgaW5zdGFuY2UuXG4gKiBBZGRlZCBpbiBOb2RlIDAuMTIuIE9ubHkgYXZhaWxhYmxlIGluIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBBcnJheUJ1ZmZlci5cbiAqL1xuQnVmZmVyLnByb3RvdHlwZS50b0FycmF5QnVmZmVyID0gZnVuY3Rpb24gdG9BcnJheUJ1ZmZlciAoKSB7XG4gIGlmICh0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBpZiAoQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQpIHtcbiAgICAgIHJldHVybiAobmV3IEJ1ZmZlcih0aGlzKSkuYnVmZmVyXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBidWYgPSBuZXcgVWludDhBcnJheSh0aGlzLmxlbmd0aClcbiAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBidWYubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDEpIHtcbiAgICAgICAgYnVmW2ldID0gdGhpc1tpXVxuICAgICAgfVxuICAgICAgcmV0dXJuIGJ1Zi5idWZmZXJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQnVmZmVyLnRvQXJyYXlCdWZmZXIgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGJyb3dzZXInKVxuICB9XG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIEJQID0gQnVmZmVyLnByb3RvdHlwZVxuXG4vKipcbiAqIEF1Z21lbnQgYSBVaW50OEFycmF5ICppbnN0YW5jZSogKG5vdCB0aGUgVWludDhBcnJheSBjbGFzcyEpIHdpdGggQnVmZmVyIG1ldGhvZHNcbiAqL1xuQnVmZmVyLl9hdWdtZW50ID0gZnVuY3Rpb24gX2F1Z21lbnQgKGFycikge1xuICBhcnIuY29uc3RydWN0b3IgPSBCdWZmZXJcbiAgYXJyLl9pc0J1ZmZlciA9IHRydWVcblxuICAvLyBzYXZlIHJlZmVyZW5jZSB0byBvcmlnaW5hbCBVaW50OEFycmF5IHNldCBtZXRob2QgYmVmb3JlIG92ZXJ3cml0aW5nXG4gIGFyci5fc2V0ID0gYXJyLnNldFxuXG4gIC8vIGRlcHJlY2F0ZWRcbiAgYXJyLmdldCA9IEJQLmdldFxuICBhcnIuc2V0ID0gQlAuc2V0XG5cbiAgYXJyLndyaXRlID0gQlAud3JpdGVcbiAgYXJyLnRvU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvTG9jYWxlU3RyaW5nID0gQlAudG9TdHJpbmdcbiAgYXJyLnRvSlNPTiA9IEJQLnRvSlNPTlxuICBhcnIuZXF1YWxzID0gQlAuZXF1YWxzXG4gIGFyci5jb21wYXJlID0gQlAuY29tcGFyZVxuICBhcnIuaW5kZXhPZiA9IEJQLmluZGV4T2ZcbiAgYXJyLmNvcHkgPSBCUC5jb3B5XG4gIGFyci5zbGljZSA9IEJQLnNsaWNlXG4gIGFyci5yZWFkVUludExFID0gQlAucmVhZFVJbnRMRVxuICBhcnIucmVhZFVJbnRCRSA9IEJQLnJlYWRVSW50QkVcbiAgYXJyLnJlYWRVSW50OCA9IEJQLnJlYWRVSW50OFxuICBhcnIucmVhZFVJbnQxNkxFID0gQlAucmVhZFVJbnQxNkxFXG4gIGFyci5yZWFkVUludDE2QkUgPSBCUC5yZWFkVUludDE2QkVcbiAgYXJyLnJlYWRVSW50MzJMRSA9IEJQLnJlYWRVSW50MzJMRVxuICBhcnIucmVhZFVJbnQzMkJFID0gQlAucmVhZFVJbnQzMkJFXG4gIGFyci5yZWFkSW50TEUgPSBCUC5yZWFkSW50TEVcbiAgYXJyLnJlYWRJbnRCRSA9IEJQLnJlYWRJbnRCRVxuICBhcnIucmVhZEludDggPSBCUC5yZWFkSW50OFxuICBhcnIucmVhZEludDE2TEUgPSBCUC5yZWFkSW50MTZMRVxuICBhcnIucmVhZEludDE2QkUgPSBCUC5yZWFkSW50MTZCRVxuICBhcnIucmVhZEludDMyTEUgPSBCUC5yZWFkSW50MzJMRVxuICBhcnIucmVhZEludDMyQkUgPSBCUC5yZWFkSW50MzJCRVxuICBhcnIucmVhZEZsb2F0TEUgPSBCUC5yZWFkRmxvYXRMRVxuICBhcnIucmVhZEZsb2F0QkUgPSBCUC5yZWFkRmxvYXRCRVxuICBhcnIucmVhZERvdWJsZUxFID0gQlAucmVhZERvdWJsZUxFXG4gIGFyci5yZWFkRG91YmxlQkUgPSBCUC5yZWFkRG91YmxlQkVcbiAgYXJyLndyaXRlVUludDggPSBCUC53cml0ZVVJbnQ4XG4gIGFyci53cml0ZVVJbnRMRSA9IEJQLndyaXRlVUludExFXG4gIGFyci53cml0ZVVJbnRCRSA9IEJQLndyaXRlVUludEJFXG4gIGFyci53cml0ZVVJbnQxNkxFID0gQlAud3JpdGVVSW50MTZMRVxuICBhcnIud3JpdGVVSW50MTZCRSA9IEJQLndyaXRlVUludDE2QkVcbiAgYXJyLndyaXRlVUludDMyTEUgPSBCUC53cml0ZVVJbnQzMkxFXG4gIGFyci53cml0ZVVJbnQzMkJFID0gQlAud3JpdGVVSW50MzJCRVxuICBhcnIud3JpdGVJbnRMRSA9IEJQLndyaXRlSW50TEVcbiAgYXJyLndyaXRlSW50QkUgPSBCUC53cml0ZUludEJFXG4gIGFyci53cml0ZUludDggPSBCUC53cml0ZUludDhcbiAgYXJyLndyaXRlSW50MTZMRSA9IEJQLndyaXRlSW50MTZMRVxuICBhcnIud3JpdGVJbnQxNkJFID0gQlAud3JpdGVJbnQxNkJFXG4gIGFyci53cml0ZUludDMyTEUgPSBCUC53cml0ZUludDMyTEVcbiAgYXJyLndyaXRlSW50MzJCRSA9IEJQLndyaXRlSW50MzJCRVxuICBhcnIud3JpdGVGbG9hdExFID0gQlAud3JpdGVGbG9hdExFXG4gIGFyci53cml0ZUZsb2F0QkUgPSBCUC53cml0ZUZsb2F0QkVcbiAgYXJyLndyaXRlRG91YmxlTEUgPSBCUC53cml0ZURvdWJsZUxFXG4gIGFyci53cml0ZURvdWJsZUJFID0gQlAud3JpdGVEb3VibGVCRVxuICBhcnIuZmlsbCA9IEJQLmZpbGxcbiAgYXJyLmluc3BlY3QgPSBCUC5pbnNwZWN0XG4gIGFyci50b0FycmF5QnVmZmVyID0gQlAudG9BcnJheUJ1ZmZlclxuXG4gIHJldHVybiBhcnJcbn1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teK1xcLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0cmluZ3RyaW0oc3RyKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiBzdHJpbmd0cmltIChzdHIpIHtcbiAgaWYgKHN0ci50cmltKSByZXR1cm4gc3RyLnRyaW0oKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKVxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gbGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCB8IDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OWljbTkzYzJWeWFXWjVMMjV2WkdWZmJXOWtkV3hsY3k5aWRXWm1aWEl2YVc1a1pYZ3Vhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SXZLaUZjYmlBcUlGUm9aU0JpZFdabVpYSWdiVzlrZFd4bElHWnliMjBnYm05a1pTNXFjeXdnWm05eUlIUm9aU0JpY205M2MyVnlMbHh1SUNwY2JpQXFJRUJoZFhSb2IzSWdJQ0JHWlhKdmMzTWdRV0p2ZFd0b1lXUnBhbVZvSUR4bVpYSnZjM05BWm1WeWIzTnpMbTl5Wno0Z1BHaDBkSEE2THk5bVpYSnZjM011YjNKblBseHVJQ29nUUd4cFkyVnVjMlVnSUUxSlZGeHVJQ292WEc0dktpQmxjMnhwYm5RdFpHbHpZV0pzWlNCdWJ5MXdjbTkwYnlBcUwxeHVYRzUyWVhJZ1ltRnpaVFkwSUQwZ2NtVnhkV2x5WlNnblltRnpaVFkwTFdwekp5bGNiblpoY2lCcFpXVmxOelUwSUQwZ2NtVnhkV2x5WlNnbmFXVmxaVGMxTkNjcFhHNTJZWElnYVhOQmNuSmhlU0E5SUhKbGNYVnBjbVVvSjJsekxXRnljbUY1SnlsY2JseHVaWGh3YjNKMGN5NUNkV1ptWlhJZ1BTQkNkV1ptWlhKY2JtVjRjRzl5ZEhNdVUyeHZkMEoxWm1abGNpQTlJRk5zYjNkQ2RXWm1aWEpjYm1WNGNHOXlkSE11U1U1VFVFVkRWRjlOUVZoZlFsbFVSVk1nUFNBMU1GeHVRblZtWm1WeUxuQnZiMnhUYVhwbElEMGdPREU1TWlBdkx5QnViM1FnZFhObFpDQmllU0IwYUdseklHbHRjR3hsYldWdWRHRjBhVzl1WEc1Y2JuWmhjaUJ5YjI5MFVHRnlaVzUwSUQwZ2UzMWNibHh1THlvcVhHNGdLaUJKWmlCZ1FuVm1abVZ5TGxSWlVFVkVYMEZTVWtGWlgxTlZVRkJQVWxSZ09seHVJQ29nSUNBOVBUMGdkSEoxWlNBZ0lDQlZjMlVnVldsdWREaEJjbkpoZVNCcGJYQnNaVzFsYm5SaGRHbHZiaUFvWm1GemRHVnpkQ2xjYmlBcUlDQWdQVDA5SUdaaGJITmxJQ0FnVlhObElFOWlhbVZqZENCcGJYQnNaVzFsYm5SaGRHbHZiaUFvYlc5emRDQmpiMjF3WVhScFlteGxMQ0JsZG1WdUlFbEZOaWxjYmlBcVhHNGdLaUJDY205M2MyVnljeUIwYUdGMElITjFjSEJ2Y25RZ2RIbHdaV1FnWVhKeVlYbHpJR0Z5WlNCSlJTQXhNQ3NzSUVacGNtVm1iM2dnTkNzc0lFTm9jbTl0WlNBM0t5d2dVMkZtWVhKcElEVXVNU3NzWEc0Z0tpQlBjR1Z5WVNBeE1TNDJLeXdnYVU5VElEUXVNaXN1WEc0Z0tseHVJQ29nUkhWbElIUnZJSFpoY21sdmRYTWdZbkp2ZDNObGNpQmlkV2R6TENCemIyMWxkR2x0WlhNZ2RHaGxJRTlpYW1WamRDQnBiWEJzWlcxbGJuUmhkR2x2YmlCM2FXeHNJR0psSUhWelpXUWdaWFpsYmx4dUlDb2dkMmhsYmlCMGFHVWdZbkp2ZDNObGNpQnpkWEJ3YjNKMGN5QjBlWEJsWkNCaGNuSmhlWE11WEc0Z0tseHVJQ29nVG05MFpUcGNiaUFxWEc0Z0tpQWdJQzBnUm1seVpXWnZlQ0EwTFRJNUlHeGhZMnR6SUhOMWNIQnZjblFnWm05eUlHRmtaR2x1WnlCdVpYY2djSEp2Y0dWeWRHbGxjeUIwYnlCZ1ZXbHVkRGhCY25KaGVXQWdhVzV6ZEdGdVkyVnpMRnh1SUNvZ0lDQWdJRk5sWlRvZ2FIUjBjSE02THk5aWRXZDZhV3hzWVM1dGIzcHBiR3hoTG05eVp5OXphRzkzWDJKMVp5NWpaMmsvYVdROU5qazFORE00TGx4dUlDcGNiaUFxSUNBZ0xTQlRZV1poY21rZ05TMDNJR3hoWTJ0eklITjFjSEJ2Y25RZ1ptOXlJR05vWVc1bmFXNW5JSFJvWlNCZ1QySnFaV04wTG5CeWIzUnZkSGx3WlM1amIyNXpkSEoxWTNSdmNtQWdjSEp2Y0dWeWRIbGNiaUFxSUNBZ0lDQnZiaUJ2WW1wbFkzUnpMbHh1SUNwY2JpQXFJQ0FnTFNCRGFISnZiV1VnT1MweE1DQnBjeUJ0YVhOemFXNW5JSFJvWlNCZ1ZIbHdaV1JCY25KaGVTNXdjbTkwYjNSNWNHVXVjM1ZpWVhKeVlYbGdJR1oxYm1OMGFXOXVMbHh1SUNwY2JpQXFJQ0FnTFNCSlJURXdJR2hoY3lCaElHSnliMnRsYmlCZ1ZIbHdaV1JCY25KaGVTNXdjbTkwYjNSNWNHVXVjM1ZpWVhKeVlYbGdJR1oxYm1OMGFXOXVJSGRvYVdOb0lISmxkSFZ5Ym5NZ1lYSnlZWGx6SUc5bVhHNGdLaUFnSUNBZ2FXNWpiM0p5WldOMElHeGxibWQwYUNCcGJpQnpiMjFsSUhOcGRIVmhkR2x2Ym5NdVhHNWNiaUFxSUZkbElHUmxkR1ZqZENCMGFHVnpaU0JpZFdkbmVTQmljbTkzYzJWeWN5QmhibVFnYzJWMElHQkNkV1ptWlhJdVZGbFFSVVJmUVZKU1FWbGZVMVZRVUU5U1ZHQWdkRzhnWUdaaGJITmxZQ0J6YnlCMGFHVjVYRzRnS2lCblpYUWdkR2hsSUU5aWFtVmpkQ0JwYlhCc1pXMWxiblJoZEdsdmJpd2dkMmhwWTJnZ2FYTWdjMnh2ZDJWeUlHSjFkQ0JpWldoaGRtVnpJR052Y25KbFkzUnNlUzVjYmlBcUwxeHVRblZtWm1WeUxsUlpVRVZFWDBGU1VrRlpYMU5WVUZCUFVsUWdQU0JuYkc5aVlXd3VWRmxRUlVSZlFWSlNRVmxmVTFWUVVFOVNWQ0FoUFQwZ2RXNWtaV1pwYm1Wa1hHNGdJRDhnWjJ4dlltRnNMbFJaVUVWRVgwRlNVa0ZaWDFOVlVGQlBVbFJjYmlBZ09pQW9ablZ1WTNScGIyNGdLQ2tnZTF4dUlDQWdJQ0FnWm5WdVkzUnBiMjRnUW1GeUlDZ3BJSHQ5WEc0Z0lDQWdJQ0IwY25rZ2UxeHVJQ0FnSUNBZ0lDQjJZWElnWVhKeUlEMGdibVYzSUZWcGJuUTRRWEp5WVhrb01TbGNiaUFnSUNBZ0lDQWdZWEp5TG1admJ5QTlJR1oxYm1OMGFXOXVJQ2dwSUhzZ2NtVjBkWEp1SURReUlIMWNiaUFnSUNBZ0lDQWdZWEp5TG1OdmJuTjBjblZqZEc5eUlEMGdRbUZ5WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUJoY25JdVptOXZLQ2tnUFQwOUlEUXlJQ1ltSUM4dklIUjVjR1ZrSUdGeWNtRjVJR2x1YzNSaGJtTmxjeUJqWVc0Z1ltVWdZWFZuYldWdWRHVmtYRzRnSUNBZ0lDQWdJQ0FnSUNCaGNuSXVZMjl1YzNSeWRXTjBiM0lnUFQwOUlFSmhjaUFtSmlBdkx5QmpiMjV6ZEhKMVkzUnZjaUJqWVc0Z1ltVWdjMlYwWEc0Z0lDQWdJQ0FnSUNBZ0lDQjBlWEJsYjJZZ1lYSnlMbk4xWW1GeWNtRjVJRDA5UFNBblpuVnVZM1JwYjI0bklDWW1JQzh2SUdOb2NtOXRaU0E1TFRFd0lHeGhZMnNnWUhOMVltRnljbUY1WUZ4dUlDQWdJQ0FnSUNBZ0lDQWdZWEp5TG5OMVltRnljbUY1S0RFc0lERXBMbUo1ZEdWTVpXNW5kR2dnUFQwOUlEQWdMeThnYVdVeE1DQm9ZWE1nWW5KdmEyVnVJR0J6ZFdKaGNuSmhlV0JjYmlBZ0lDQWdJSDBnWTJGMFkyZ2dLR1VwSUh0Y2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUdaaGJITmxYRzRnSUNBZ0lDQjlYRzRnSUNBZ2ZTa29LVnh1WEc1bWRXNWpkR2x2YmlCclRXRjRUR1Z1WjNSb0lDZ3BJSHRjYmlBZ2NtVjBkWEp1SUVKMVptWmxjaTVVV1ZCRlJGOUJVbEpCV1Y5VFZWQlFUMUpVWEc0Z0lDQWdQeUF3ZURkbVptWm1abVptWEc0Z0lDQWdPaUF3ZURObVptWm1abVptWEc1OVhHNWNiaThxS2x4dUlDb2dRMnhoYzNNNklFSjFabVpsY2x4dUlDb2dQVDA5UFQwOVBUMDlQVDA5UFZ4dUlDcGNiaUFxSUZSb1pTQkNkV1ptWlhJZ1kyOXVjM1J5ZFdOMGIzSWdjbVYwZFhKdWN5QnBibk4wWVc1alpYTWdiMllnWUZWcGJuUTRRWEp5WVhsZ0lIUm9ZWFFnWVhKbElHRjFaMjFsYm5SbFpGeHVJQ29nZDJsMGFDQm1kVzVqZEdsdmJpQndjbTl3WlhKMGFXVnpJR1p2Y2lCaGJHd2dkR2hsSUc1dlpHVWdZRUoxWm1abGNtQWdRVkJKSUdaMWJtTjBhVzl1Y3k0Z1YyVWdkWE5sWEc0Z0tpQmdWV2x1ZERoQmNuSmhlV0FnYzI4Z2RHaGhkQ0J6Y1hWaGNtVWdZbkpoWTJ0bGRDQnViM1JoZEdsdmJpQjNiM0pyY3lCaGN5QmxlSEJsWTNSbFpDQXRMU0JwZENCeVpYUjFjbTV6WEc0Z0tpQmhJSE5wYm1kc1pTQnZZM1JsZEM1Y2JpQXFYRzRnS2lCQ2VTQmhkV2R0Wlc1MGFXNW5JSFJvWlNCcGJuTjBZVzVqWlhNc0lIZGxJR05oYmlCaGRtOXBaQ0J0YjJScFpubHBibWNnZEdobElHQlZhVzUwT0VGeWNtRjVZRnh1SUNvZ2NISnZkRzkwZVhCbExseHVJQ292WEc1bWRXNWpkR2x2YmlCQ2RXWm1aWElnS0dGeVp5a2dlMXh1SUNCcFppQW9JU2gwYUdseklHbHVjM1JoYm1ObGIyWWdRblZtWm1WeUtTa2dlMXh1SUNBZ0lDOHZJRUYyYjJsa0lHZHZhVzVuSUhSb2NtOTFaMmdnWVc0Z1FYSm5kVzFsYm5SelFXUmhjSFJ2Y2xSeVlXMXdiMnhwYm1VZ2FXNGdkR2hsSUdOdmJXMXZiaUJqWVhObExseHVJQ0FnSUdsbUlDaGhjbWQxYldWdWRITXViR1Z1WjNSb0lENGdNU2tnY21WMGRYSnVJRzVsZHlCQ2RXWm1aWElvWVhKbkxDQmhjbWQxYldWdWRITmJNVjBwWEc0Z0lDQWdjbVYwZFhKdUlHNWxkeUJDZFdabVpYSW9ZWEpuS1Z4dUlDQjlYRzVjYmlBZ2RHaHBjeTVzWlc1bmRHZ2dQU0F3WEc0Z0lIUm9hWE11Y0dGeVpXNTBJRDBnZFc1a1pXWnBibVZrWEc1Y2JpQWdMeThnUTI5dGJXOXVJR05oYzJVdVhHNGdJR2xtSUNoMGVYQmxiMllnWVhKbklEMDlQU0FuYm5WdFltVnlKeWtnZTF4dUlDQWdJSEpsZEhWeWJpQm1jbTl0VG5WdFltVnlLSFJvYVhNc0lHRnlaeWxjYmlBZ2ZWeHVYRzRnSUM4dklGTnNhV2RvZEd4NUlHeGxjM01nWTI5dGJXOXVJR05oYzJVdVhHNGdJR2xtSUNoMGVYQmxiMllnWVhKbklEMDlQU0FuYzNSeWFXNW5KeWtnZTF4dUlDQWdJSEpsZEhWeWJpQm1jbTl0VTNSeWFXNW5LSFJvYVhNc0lHRnlaeXdnWVhKbmRXMWxiblJ6TG14bGJtZDBhQ0ErSURFZ1B5QmhjbWQxYldWdWRITmJNVjBnT2lBbmRYUm1PQ2NwWEc0Z0lIMWNibHh1SUNBdkx5QlZiblZ6ZFdGc0xseHVJQ0J5WlhSMWNtNGdabkp2YlU5aWFtVmpkQ2gwYUdsekxDQmhjbWNwWEc1OVhHNWNibVoxYm1OMGFXOXVJR1p5YjIxT2RXMWlaWElnS0hSb1lYUXNJR3hsYm1kMGFDa2dlMXh1SUNCMGFHRjBJRDBnWVd4c2IyTmhkR1VvZEdoaGRDd2diR1Z1WjNSb0lEd2dNQ0EvSURBZ09pQmphR1ZqYTJWa0tHeGxibWQwYUNrZ2ZDQXdLVnh1SUNCcFppQW9JVUoxWm1abGNpNVVXVkJGUkY5QlVsSkJXVjlUVlZCUVQxSlVLU0I3WEc0Z0lDQWdabTl5SUNoMllYSWdhU0E5SURBN0lHa2dQQ0JzWlc1bmRHZzdJR2tyS3lrZ2UxeHVJQ0FnSUNBZ2RHaGhkRnRwWFNBOUlEQmNiaUFnSUNCOVhHNGdJSDFjYmlBZ2NtVjBkWEp1SUhSb1lYUmNibjFjYmx4dVpuVnVZM1JwYjI0Z1puSnZiVk4wY21sdVp5QW9kR2hoZEN3Z2MzUnlhVzVuTENCbGJtTnZaR2x1WnlrZ2UxeHVJQ0JwWmlBb2RIbHdaVzltSUdWdVkyOWthVzVuSUNFOVBTQW5jM1J5YVc1bkp5QjhmQ0JsYm1OdlpHbHVaeUE5UFQwZ0p5Y3BJR1Z1WTI5a2FXNW5JRDBnSjNWMFpqZ25YRzVjYmlBZ0x5OGdRWE56ZFcxd2RHbHZiam9nWW5sMFpVeGxibWQwYUNncElISmxkSFZ5YmlCMllXeDFaU0JwY3lCaGJIZGhlWE1nUENCclRXRjRUR1Z1WjNSb0xseHVJQ0IyWVhJZ2JHVnVaM1JvSUQwZ1lubDBaVXhsYm1kMGFDaHpkSEpwYm1jc0lHVnVZMjlrYVc1bktTQjhJREJjYmlBZ2RHaGhkQ0E5SUdGc2JHOWpZWFJsS0hSb1lYUXNJR3hsYm1kMGFDbGNibHh1SUNCMGFHRjBMbmR5YVhSbEtITjBjbWx1Wnl3Z1pXNWpiMlJwYm1jcFhHNGdJSEpsZEhWeWJpQjBhR0YwWEc1OVhHNWNibVoxYm1OMGFXOXVJR1p5YjIxUFltcGxZM1FnS0hSb1lYUXNJRzlpYW1WamRDa2dlMXh1SUNCcFppQW9RblZtWm1WeUxtbHpRblZtWm1WeUtHOWlhbVZqZENrcElISmxkSFZ5YmlCbWNtOXRRblZtWm1WeUtIUm9ZWFFzSUc5aWFtVmpkQ2xjYmx4dUlDQnBaaUFvYVhOQmNuSmhlU2h2WW1wbFkzUXBLU0J5WlhSMWNtNGdabkp2YlVGeWNtRjVLSFJvWVhRc0lHOWlhbVZqZENsY2JseHVJQ0JwWmlBb2IySnFaV04wSUQwOUlHNTFiR3dwSUh0Y2JpQWdJQ0IwYUhKdmR5QnVaWGNnVkhsd1pVVnljbTl5S0NkdGRYTjBJSE4wWVhKMElIZHBkR2dnYm5WdFltVnlMQ0JpZFdabVpYSXNJR0Z5Y21GNUlHOXlJSE4wY21sdVp5Y3BYRzRnSUgxY2JseHVJQ0JwWmlBb2RIbHdaVzltSUVGeWNtRjVRblZtWm1WeUlDRTlQU0FuZFc1a1pXWnBibVZrSnlrZ2UxeHVJQ0FnSUdsbUlDaHZZbXBsWTNRdVluVm1abVZ5SUdsdWMzUmhibU5sYjJZZ1FYSnlZWGxDZFdabVpYSXBJSHRjYmlBZ0lDQWdJSEpsZEhWeWJpQm1jbTl0Vkhsd1pXUkJjbkpoZVNoMGFHRjBMQ0J2WW1wbFkzUXBYRzRnSUNBZ2ZWeHVJQ0FnSUdsbUlDaHZZbXBsWTNRZ2FXNXpkR0Z1WTJWdlppQkJjbkpoZVVKMVptWmxjaWtnZTF4dUlDQWdJQ0FnY21WMGRYSnVJR1p5YjIxQmNuSmhlVUoxWm1abGNpaDBhR0YwTENCdlltcGxZM1FwWEc0Z0lDQWdmVnh1SUNCOVhHNWNiaUFnYVdZZ0tHOWlhbVZqZEM1c1pXNW5kR2dwSUhKbGRIVnliaUJtY205dFFYSnlZWGxNYVd0bEtIUm9ZWFFzSUc5aWFtVmpkQ2xjYmx4dUlDQnlaWFIxY200Z1puSnZiVXB6YjI1UFltcGxZM1FvZEdoaGRDd2diMkpxWldOMEtWeHVmVnh1WEc1bWRXNWpkR2x2YmlCbWNtOXRRblZtWm1WeUlDaDBhR0YwTENCaWRXWm1aWElwSUh0Y2JpQWdkbUZ5SUd4bGJtZDBhQ0E5SUdOb1pXTnJaV1FvWW5WbVptVnlMbXhsYm1kMGFDa2dmQ0F3WEc0Z0lIUm9ZWFFnUFNCaGJHeHZZMkYwWlNoMGFHRjBMQ0JzWlc1bmRHZ3BYRzRnSUdKMVptWmxjaTVqYjNCNUtIUm9ZWFFzSURBc0lEQXNJR3hsYm1kMGFDbGNiaUFnY21WMGRYSnVJSFJvWVhSY2JuMWNibHh1Wm5WdVkzUnBiMjRnWm5KdmJVRnljbUY1SUNoMGFHRjBMQ0JoY25KaGVTa2dlMXh1SUNCMllYSWdiR1Z1WjNSb0lEMGdZMmhsWTJ0bFpDaGhjbkpoZVM1c1pXNW5kR2dwSUh3Z01GeHVJQ0IwYUdGMElEMGdZV3hzYjJOaGRHVW9kR2hoZEN3Z2JHVnVaM1JvS1Z4dUlDQm1iM0lnS0haaGNpQnBJRDBnTURzZ2FTQThJR3hsYm1kMGFEc2dhU0FyUFNBeEtTQjdYRzRnSUNBZ2RHaGhkRnRwWFNBOUlHRnljbUY1VzJsZElDWWdNalUxWEc0Z0lIMWNiaUFnY21WMGRYSnVJSFJvWVhSY2JuMWNibHh1THk4Z1JIVndiR2xqWVhSbElHOW1JR1p5YjIxQmNuSmhlU2dwSUhSdklHdGxaWEFnWm5KdmJVRnljbUY1S0NrZ2JXOXViMjF2Y25Cb2FXTXVYRzVtZFc1amRHbHZiaUJtY205dFZIbHdaV1JCY25KaGVTQW9kR2hoZEN3Z1lYSnlZWGtwSUh0Y2JpQWdkbUZ5SUd4bGJtZDBhQ0E5SUdOb1pXTnJaV1FvWVhKeVlYa3ViR1Z1WjNSb0tTQjhJREJjYmlBZ2RHaGhkQ0E5SUdGc2JHOWpZWFJsS0hSb1lYUXNJR3hsYm1kMGFDbGNiaUFnTHk4Z1ZISjFibU5oZEdsdVp5QjBhR1VnWld4bGJXVnVkSE1nYVhNZ2NISnZZbUZpYkhrZ2JtOTBJSGRvWVhRZ2NHVnZjR3hsSUdWNGNHVmpkQ0JtY205dElIUjVjR1ZrWEc0Z0lDOHZJR0Z5Y21GNWN5QjNhWFJvSUVKWlZFVlRYMUJGVWw5RlRFVk5SVTVVSUQ0Z01TQmlkWFFnYVhRbmN5QmpiMjF3WVhScFlteGxJSGRwZEdnZ2RHaGxJR0psYUdGMmFXOXlYRzRnSUM4dklHOW1JSFJvWlNCdmJHUWdRblZtWm1WeUlHTnZibk4wY25WamRHOXlMbHh1SUNCbWIzSWdLSFpoY2lCcElEMGdNRHNnYVNBOElHeGxibWQwYURzZ2FTQXJQU0F4S1NCN1hHNGdJQ0FnZEdoaGRGdHBYU0E5SUdGeWNtRjVXMmxkSUNZZ01qVTFYRzRnSUgxY2JpQWdjbVYwZFhKdUlIUm9ZWFJjYm4xY2JseHVablZ1WTNScGIyNGdabkp2YlVGeWNtRjVRblZtWm1WeUlDaDBhR0YwTENCaGNuSmhlU2tnZTF4dUlDQnBaaUFvUW5WbVptVnlMbFJaVUVWRVgwRlNVa0ZaWDFOVlVGQlBVbFFwSUh0Y2JpQWdJQ0F2THlCU1pYUjFjbTRnWVc0Z1lYVm5iV1Z1ZEdWa0lHQlZhVzUwT0VGeWNtRjVZQ0JwYm5OMFlXNWpaU3dnWm05eUlHSmxjM1FnY0dWeVptOXliV0Z1WTJWY2JpQWdJQ0JoY25KaGVTNWllWFJsVEdWdVozUm9YRzRnSUNBZ2RHaGhkQ0E5SUVKMVptWmxjaTVmWVhWbmJXVnVkQ2h1WlhjZ1ZXbHVkRGhCY25KaGVTaGhjbkpoZVNrcFhHNGdJSDBnWld4elpTQjdYRzRnSUNBZ0x5OGdSbUZzYkdKaFkyczZJRkpsZEhWeWJpQmhiaUJ2WW1wbFkzUWdhVzV6ZEdGdVkyVWdiMllnZEdobElFSjFabVpsY2lCamJHRnpjMXh1SUNBZ0lIUm9ZWFFnUFNCbWNtOXRWSGx3WldSQmNuSmhlU2gwYUdGMExDQnVaWGNnVldsdWREaEJjbkpoZVNoaGNuSmhlU2twWEc0Z0lIMWNiaUFnY21WMGRYSnVJSFJvWVhSY2JuMWNibHh1Wm5WdVkzUnBiMjRnWm5KdmJVRnljbUY1VEdsclpTQW9kR2hoZEN3Z1lYSnlZWGtwSUh0Y2JpQWdkbUZ5SUd4bGJtZDBhQ0E5SUdOb1pXTnJaV1FvWVhKeVlYa3ViR1Z1WjNSb0tTQjhJREJjYmlBZ2RHaGhkQ0E5SUdGc2JHOWpZWFJsS0hSb1lYUXNJR3hsYm1kMGFDbGNiaUFnWm05eUlDaDJZWElnYVNBOUlEQTdJR2tnUENCc1pXNW5kR2c3SUdrZ0t6MGdNU2tnZTF4dUlDQWdJSFJvWVhSYmFWMGdQU0JoY25KaGVWdHBYU0FtSURJMU5WeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCMGFHRjBYRzU5WEc1Y2JpOHZJRVJsYzJWeWFXRnNhWHBsSUhzZ2RIbHdaVG9nSjBKMVptWmxjaWNzSUdSaGRHRTZJRnN4TERJc015d3VMaTVkSUgwZ2FXNTBieUJoSUVKMVptWmxjaUJ2WW1wbFkzUXVYRzR2THlCU1pYUjFjbTV6SUdFZ2VtVnlieTFzWlc1bmRHZ2dZblZtWm1WeUlHWnZjaUJwYm5CMWRITWdkR2hoZENCa2IyNG5kQ0JqYjI1bWIzSnRJSFJ2SUhSb1pTQnpjR1ZqTGx4dVpuVnVZM1JwYjI0Z1puSnZiVXB6YjI1UFltcGxZM1FnS0hSb1lYUXNJRzlpYW1WamRDa2dlMXh1SUNCMllYSWdZWEp5WVhsY2JpQWdkbUZ5SUd4bGJtZDBhQ0E5SURCY2JseHVJQ0JwWmlBb2IySnFaV04wTG5SNWNHVWdQVDA5SUNkQ2RXWm1aWEluSUNZbUlHbHpRWEp5WVhrb2IySnFaV04wTG1SaGRHRXBLU0I3WEc0Z0lDQWdZWEp5WVhrZ1BTQnZZbXBsWTNRdVpHRjBZVnh1SUNBZ0lHeGxibWQwYUNBOUlHTm9aV05yWldRb1lYSnlZWGt1YkdWdVozUm9LU0I4SURCY2JpQWdmVnh1SUNCMGFHRjBJRDBnWVd4c2IyTmhkR1VvZEdoaGRDd2diR1Z1WjNSb0tWeHVYRzRnSUdadmNpQW9kbUZ5SUdrZ1BTQXdPeUJwSUR3Z2JHVnVaM1JvT3lCcElDczlJREVwSUh0Y2JpQWdJQ0IwYUdGMFcybGRJRDBnWVhKeVlYbGJhVjBnSmlBeU5UVmNiaUFnZlZ4dUlDQnlaWFIxY200Z2RHaGhkRnh1ZlZ4dVhHNXBaaUFvUW5WbVptVnlMbFJaVUVWRVgwRlNVa0ZaWDFOVlVGQlBVbFFwSUh0Y2JpQWdRblZtWm1WeUxuQnliM1J2ZEhsd1pTNWZYM0J5YjNSdlgxOGdQU0JWYVc1ME9FRnljbUY1TG5CeWIzUnZkSGx3WlZ4dUlDQkNkV1ptWlhJdVgxOXdjbTkwYjE5ZklEMGdWV2x1ZERoQmNuSmhlVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmhiR3h2WTJGMFpTQW9kR2hoZEN3Z2JHVnVaM1JvS1NCN1hHNGdJR2xtSUNoQ2RXWm1aWEl1VkZsUVJVUmZRVkpTUVZsZlUxVlFVRTlTVkNrZ2UxeHVJQ0FnSUM4dklGSmxkSFZ5YmlCaGJpQmhkV2R0Wlc1MFpXUWdZRlZwYm5RNFFYSnlZWGxnSUdsdWMzUmhibU5sTENCbWIzSWdZbVZ6ZENCd1pYSm1iM0p0WVc1alpWeHVJQ0FnSUhSb1lYUWdQU0JDZFdabVpYSXVYMkYxWjIxbGJuUW9ibVYzSUZWcGJuUTRRWEp5WVhrb2JHVnVaM1JvS1NsY2JpQWdJQ0IwYUdGMExsOWZjSEp2ZEc5Zlh5QTlJRUoxWm1abGNpNXdjbTkwYjNSNWNHVmNiaUFnZlNCbGJITmxJSHRjYmlBZ0lDQXZMeUJHWVd4c1ltRmphem9nVW1WMGRYSnVJR0Z1SUc5aWFtVmpkQ0JwYm5OMFlXNWpaU0J2WmlCMGFHVWdRblZtWm1WeUlHTnNZWE56WEc0Z0lDQWdkR2hoZEM1c1pXNW5kR2dnUFNCc1pXNW5kR2hjYmlBZ0lDQjBhR0YwTGw5cGMwSjFabVpsY2lBOUlIUnlkV1ZjYmlBZ2ZWeHVYRzRnSUhaaGNpQm1jbTl0VUc5dmJDQTlJR3hsYm1kMGFDQWhQVDBnTUNBbUppQnNaVzVuZEdnZ1BEMGdRblZtWm1WeUxuQnZiMnhUYVhwbElENCtQaUF4WEc0Z0lHbG1JQ2htY205dFVHOXZiQ2tnZEdoaGRDNXdZWEpsYm5RZ1BTQnliMjkwVUdGeVpXNTBYRzVjYmlBZ2NtVjBkWEp1SUhSb1lYUmNibjFjYmx4dVpuVnVZM1JwYjI0Z1kyaGxZMnRsWkNBb2JHVnVaM1JvS1NCN1hHNGdJQzh2SUU1dmRHVTZJR05oYm01dmRDQjFjMlVnWUd4bGJtZDBhQ0E4SUd0TllYaE1aVzVuZEdoZ0lHaGxjbVVnWW1WallYVnpaU0IwYUdGMElHWmhhV3h6SUhkb1pXNWNiaUFnTHk4Z2JHVnVaM1JvSUdseklFNWhUaUFvZDJocFkyZ2dhWE1nYjNSb1pYSjNhWE5sSUdOdlpYSmpaV1FnZEc4Z2VtVnlieTRwWEc0Z0lHbG1JQ2hzWlc1bmRHZ2dQajBnYTAxaGVFeGxibWQwYUNncEtTQjdYRzRnSUNBZ2RHaHliM2NnYm1WM0lGSmhibWRsUlhKeWIzSW9KMEYwZEdWdGNIUWdkRzhnWVd4c2IyTmhkR1VnUW5WbVptVnlJR3hoY21kbGNpQjBhR0Z1SUcxaGVHbHRkVzBnSnlBclhHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0ozTnBlbVU2SURCNEp5QXJJR3ROWVhoTVpXNW5kR2dvS1M1MGIxTjBjbWx1WnlneE5pa2dLeUFuSUdKNWRHVnpKeWxjYmlBZ2ZWeHVJQ0J5WlhSMWNtNGdiR1Z1WjNSb0lId2dNRnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQlRiRzkzUW5WbVptVnlJQ2h6ZFdKcVpXTjBMQ0JsYm1OdlpHbHVaeWtnZTF4dUlDQnBaaUFvSVNoMGFHbHpJR2x1YzNSaGJtTmxiMllnVTJ4dmQwSjFabVpsY2lrcElISmxkSFZ5YmlCdVpYY2dVMnh2ZDBKMVptWmxjaWh6ZFdKcVpXTjBMQ0JsYm1OdlpHbHVaeWxjYmx4dUlDQjJZWElnWW5WbUlEMGdibVYzSUVKMVptWmxjaWh6ZFdKcVpXTjBMQ0JsYm1OdlpHbHVaeWxjYmlBZ1pHVnNaWFJsSUdKMVppNXdZWEpsYm5SY2JpQWdjbVYwZFhKdUlHSjFabHh1ZlZ4dVhHNUNkV1ptWlhJdWFYTkNkV1ptWlhJZ1BTQm1kVzVqZEdsdmJpQnBjMEoxWm1abGNpQW9ZaWtnZTF4dUlDQnlaWFIxY200Z0lTRW9ZaUFoUFNCdWRXeHNJQ1ltSUdJdVgybHpRblZtWm1WeUtWeHVmVnh1WEc1Q2RXWm1aWEl1WTI5dGNHRnlaU0E5SUdaMWJtTjBhVzl1SUdOdmJYQmhjbVVnS0dFc0lHSXBJSHRjYmlBZ2FXWWdLQ0ZDZFdabVpYSXVhWE5DZFdabVpYSW9ZU2tnZkh3Z0lVSjFabVpsY2k1cGMwSjFabVpsY2loaUtTa2dlMXh1SUNBZ0lIUm9jbTkzSUc1bGR5QlVlWEJsUlhKeWIzSW9KMEZ5WjNWdFpXNTBjeUJ0ZFhOMElHSmxJRUoxWm1abGNuTW5LVnh1SUNCOVhHNWNiaUFnYVdZZ0tHRWdQVDA5SUdJcElISmxkSFZ5YmlBd1hHNWNiaUFnZG1GeUlIZ2dQU0JoTG14bGJtZDBhRnh1SUNCMllYSWdlU0E5SUdJdWJHVnVaM1JvWEc1Y2JpQWdkbUZ5SUdrZ1BTQXdYRzRnSUhaaGNpQnNaVzRnUFNCTllYUm9MbTFwYmloNExDQjVLVnh1SUNCM2FHbHNaU0FvYVNBOElHeGxiaWtnZTF4dUlDQWdJR2xtSUNoaFcybGRJQ0U5UFNCaVcybGRLU0JpY21WaGExeHVYRzRnSUNBZ0t5dHBYRzRnSUgxY2JseHVJQ0JwWmlBb2FTQWhQVDBnYkdWdUtTQjdYRzRnSUNBZ2VDQTlJR0ZiYVYxY2JpQWdJQ0I1SUQwZ1lsdHBYVnh1SUNCOVhHNWNiaUFnYVdZZ0tIZ2dQQ0I1S1NCeVpYUjFjbTRnTFRGY2JpQWdhV1lnS0hrZ1BDQjRLU0J5WlhSMWNtNGdNVnh1SUNCeVpYUjFjbTRnTUZ4dWZWeHVYRzVDZFdabVpYSXVhWE5GYm1OdlpHbHVaeUE5SUdaMWJtTjBhVzl1SUdselJXNWpiMlJwYm1jZ0tHVnVZMjlrYVc1bktTQjdYRzRnSUhOM2FYUmphQ0FvVTNSeWFXNW5LR1Z1WTI5a2FXNW5LUzUwYjB4dmQyVnlRMkZ6WlNncEtTQjdYRzRnSUNBZ1kyRnpaU0FuYUdWNEp6cGNiaUFnSUNCallYTmxJQ2QxZEdZNEp6cGNiaUFnSUNCallYTmxJQ2QxZEdZdE9DYzZYRzRnSUNBZ1kyRnpaU0FuWVhOamFXa25PbHh1SUNBZ0lHTmhjMlVnSjJKcGJtRnllU2M2WEc0Z0lDQWdZMkZ6WlNBblltRnpaVFkwSnpwY2JpQWdJQ0JqWVhObElDZHlZWGNuT2x4dUlDQWdJR05oYzJVZ0ozVmpjekluT2x4dUlDQWdJR05oYzJVZ0ozVmpjeTB5SnpwY2JpQWdJQ0JqWVhObElDZDFkR1l4Tm14bEp6cGNiaUFnSUNCallYTmxJQ2QxZEdZdE1UWnNaU2M2WEc0Z0lDQWdJQ0J5WlhSMWNtNGdkSEoxWlZ4dUlDQWdJR1JsWm1GMWJIUTZYRzRnSUNBZ0lDQnlaWFIxY200Z1ptRnNjMlZjYmlBZ2ZWeHVmVnh1WEc1Q2RXWm1aWEl1WTI5dVkyRjBJRDBnWm5WdVkzUnBiMjRnWTI5dVkyRjBJQ2hzYVhOMExDQnNaVzVuZEdncElIdGNiaUFnYVdZZ0tDRnBjMEZ5Y21GNUtHeHBjM1FwS1NCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtDZHNhWE4wSUdGeVozVnRaVzUwSUcxMWMzUWdZbVVnWVc0Z1FYSnlZWGtnYjJZZ1FuVm1abVZ5Y3k0bktWeHVYRzRnSUdsbUlDaHNhWE4wTG14bGJtZDBhQ0E5UFQwZ01Da2dlMXh1SUNBZ0lISmxkSFZ5YmlCdVpYY2dRblZtWm1WeUtEQXBYRzRnSUgxY2JseHVJQ0IyWVhJZ2FWeHVJQ0JwWmlBb2JHVnVaM1JvSUQwOVBTQjFibVJsWm1sdVpXUXBJSHRjYmlBZ0lDQnNaVzVuZEdnZ1BTQXdYRzRnSUNBZ1ptOXlJQ2hwSUQwZ01Ec2dhU0E4SUd4cGMzUXViR1Z1WjNSb095QnBLeXNwSUh0Y2JpQWdJQ0FnSUd4bGJtZDBhQ0FyUFNCc2FYTjBXMmxkTG14bGJtZDBhRnh1SUNBZ0lIMWNiaUFnZlZ4dVhHNGdJSFpoY2lCaWRXWWdQU0J1WlhjZ1FuVm1abVZ5S0d4bGJtZDBhQ2xjYmlBZ2RtRnlJSEJ2Y3lBOUlEQmNiaUFnWm05eUlDaHBJRDBnTURzZ2FTQThJR3hwYzNRdWJHVnVaM1JvT3lCcEt5c3BJSHRjYmlBZ0lDQjJZWElnYVhSbGJTQTlJR3hwYzNSYmFWMWNiaUFnSUNCcGRHVnRMbU52Y0hrb1luVm1MQ0J3YjNNcFhHNGdJQ0FnY0c5eklDczlJR2wwWlcwdWJHVnVaM1JvWEc0Z0lIMWNiaUFnY21WMGRYSnVJR0oxWmx4dWZWeHVYRzVtZFc1amRHbHZiaUJpZVhSbFRHVnVaM1JvSUNoemRISnBibWNzSUdWdVkyOWthVzVuS1NCN1hHNGdJR2xtSUNoMGVYQmxiMllnYzNSeWFXNW5JQ0U5UFNBbmMzUnlhVzVuSnlrZ2MzUnlhVzVuSUQwZ0p5Y2dLeUJ6ZEhKcGJtZGNibHh1SUNCMllYSWdiR1Z1SUQwZ2MzUnlhVzVuTG14bGJtZDBhRnh1SUNCcFppQW9iR1Z1SUQwOVBTQXdLU0J5WlhSMWNtNGdNRnh1WEc0Z0lDOHZJRlZ6WlNCaElHWnZjaUJzYjI5d0lIUnZJR0YyYjJsa0lISmxZM1Z5YzJsdmJseHVJQ0IyWVhJZ2JHOTNaWEpsWkVOaGMyVWdQU0JtWVd4elpWeHVJQ0JtYjNJZ0tEczdLU0I3WEc0Z0lDQWdjM2RwZEdOb0lDaGxibU52WkdsdVp5a2dlMXh1SUNBZ0lDQWdZMkZ6WlNBbllYTmphV2tuT2x4dUlDQWdJQ0FnWTJGelpTQW5ZbWx1WVhKNUp6cGNiaUFnSUNBZ0lDOHZJRVJsY0hKbFkyRjBaV1JjYmlBZ0lDQWdJR05oYzJVZ0ozSmhkeWM2WEc0Z0lDQWdJQ0JqWVhObElDZHlZWGR6SnpwY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUd4bGJseHVJQ0FnSUNBZ1kyRnpaU0FuZFhSbU9DYzZYRzRnSUNBZ0lDQmpZWE5sSUNkMWRHWXRPQ2M2WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIxZEdZNFZHOUNlWFJsY3loemRISnBibWNwTG14bGJtZDBhRnh1SUNBZ0lDQWdZMkZ6WlNBbmRXTnpNaWM2WEc0Z0lDQWdJQ0JqWVhObElDZDFZM010TWljNlhHNGdJQ0FnSUNCallYTmxJQ2QxZEdZeE5teGxKenBjYmlBZ0lDQWdJR05oYzJVZ0ozVjBaaTB4Tm14bEp6cGNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHeGxiaUFxSURKY2JpQWdJQ0FnSUdOaGMyVWdKMmhsZUNjNlhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCc1pXNGdQajQrSURGY2JpQWdJQ0FnSUdOaGMyVWdKMkpoYzJVMk5DYzZYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmlZWE5sTmpSVWIwSjVkR1Z6S0hOMGNtbHVaeWt1YkdWdVozUm9YRzRnSUNBZ0lDQmtaV1poZFd4ME9seHVJQ0FnSUNBZ0lDQnBaaUFvYkc5M1pYSmxaRU5oYzJVcElISmxkSFZ5YmlCMWRHWTRWRzlDZVhSbGN5aHpkSEpwYm1jcExteGxibWQwYUNBdkx5QmhjM04xYldVZ2RYUm1PRnh1SUNBZ0lDQWdJQ0JsYm1OdlpHbHVaeUE5SUNnbkp5QXJJR1Z1WTI5a2FXNW5LUzUwYjB4dmQyVnlRMkZ6WlNncFhHNGdJQ0FnSUNBZ0lHeHZkMlZ5WldSRFlYTmxJRDBnZEhKMVpWeHVJQ0FnSUgxY2JpQWdmVnh1ZlZ4dVFuVm1abVZ5TG1KNWRHVk1aVzVuZEdnZ1BTQmllWFJsVEdWdVozUm9YRzVjYmk4dklIQnlaUzF6WlhRZ1ptOXlJSFpoYkhWbGN5QjBhR0YwSUcxaGVTQmxlR2x6ZENCcGJpQjBhR1VnWm5WMGRYSmxYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbXhsYm1kMGFDQTlJSFZ1WkdWbWFXNWxaRnh1UW5WbVptVnlMbkJ5YjNSdmRIbHdaUzV3WVhKbGJuUWdQU0IxYm1SbFptbHVaV1JjYmx4dVpuVnVZM1JwYjI0Z2MyeHZkMVJ2VTNSeWFXNW5JQ2hsYm1OdlpHbHVaeXdnYzNSaGNuUXNJR1Z1WkNrZ2UxeHVJQ0IyWVhJZ2JHOTNaWEpsWkVOaGMyVWdQU0JtWVd4elpWeHVYRzRnSUhOMFlYSjBJRDBnYzNSaGNuUWdmQ0F3WEc0Z0lHVnVaQ0E5SUdWdVpDQTlQVDBnZFc1a1pXWnBibVZrSUh4OElHVnVaQ0E5UFQwZ1NXNW1hVzVwZEhrZ1B5QjBhR2x6TG14bGJtZDBhQ0E2SUdWdVpDQjhJREJjYmx4dUlDQnBaaUFvSVdWdVkyOWthVzVuS1NCbGJtTnZaR2x1WnlBOUlDZDFkR1k0SjF4dUlDQnBaaUFvYzNSaGNuUWdQQ0F3S1NCemRHRnlkQ0E5SURCY2JpQWdhV1lnS0dWdVpDQStJSFJvYVhNdWJHVnVaM1JvS1NCbGJtUWdQU0IwYUdsekxteGxibWQwYUZ4dUlDQnBaaUFvWlc1a0lEdzlJSE4wWVhKMEtTQnlaWFIxY200Z0p5ZGNibHh1SUNCM2FHbHNaU0FvZEhKMVpTa2dlMXh1SUNBZ0lITjNhWFJqYUNBb1pXNWpiMlJwYm1jcElIdGNiaUFnSUNBZ0lHTmhjMlVnSjJobGVDYzZYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQm9aWGhUYkdsalpTaDBhR2x6TENCemRHRnlkQ3dnWlc1a0tWeHVYRzRnSUNBZ0lDQmpZWE5sSUNkMWRHWTRKenBjYmlBZ0lDQWdJR05oYzJVZ0ozVjBaaTA0SnpwY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWMFpqaFRiR2xqWlNoMGFHbHpMQ0J6ZEdGeWRDd2daVzVrS1Z4dVhHNGdJQ0FnSUNCallYTmxJQ2RoYzJOcGFTYzZYRzRnSUNBZ0lDQWdJSEpsZEhWeWJpQmhjMk5wYVZOc2FXTmxLSFJvYVhNc0lITjBZWEowTENCbGJtUXBYRzVjYmlBZ0lDQWdJR05oYzJVZ0oySnBibUZ5ZVNjNlhHNGdJQ0FnSUNBZ0lISmxkSFZ5YmlCaWFXNWhjbmxUYkdsalpTaDBhR2x6TENCemRHRnlkQ3dnWlc1a0tWeHVYRzRnSUNBZ0lDQmpZWE5sSUNkaVlYTmxOalFuT2x4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnWW1GelpUWTBVMnhwWTJVb2RHaHBjeXdnYzNSaGNuUXNJR1Z1WkNsY2JseHVJQ0FnSUNBZ1kyRnpaU0FuZFdOek1pYzZYRzRnSUNBZ0lDQmpZWE5sSUNkMVkzTXRNaWM2WEc0Z0lDQWdJQ0JqWVhObElDZDFkR1l4Tm14bEp6cGNiaUFnSUNBZ0lHTmhjMlVnSjNWMFppMHhObXhsSnpwY2JpQWdJQ0FnSUNBZ2NtVjBkWEp1SUhWMFpqRTJiR1ZUYkdsalpTaDBhR2x6TENCemRHRnlkQ3dnWlc1a0tWeHVYRzRnSUNBZ0lDQmtaV1poZFd4ME9seHVJQ0FnSUNBZ0lDQnBaaUFvYkc5M1pYSmxaRU5oYzJVcElIUm9jbTkzSUc1bGR5QlVlWEJsUlhKeWIzSW9KMVZ1YTI1dmQyNGdaVzVqYjJScGJtYzZJQ2NnS3lCbGJtTnZaR2x1WnlsY2JpQWdJQ0FnSUNBZ1pXNWpiMlJwYm1jZ1BTQW9aVzVqYjJScGJtY2dLeUFuSnlrdWRHOU1iM2RsY2tOaGMyVW9LVnh1SUNBZ0lDQWdJQ0JzYjNkbGNtVmtRMkZ6WlNBOUlIUnlkV1ZjYmlBZ0lDQjlYRzRnSUgxY2JuMWNibHh1UW5WbVptVnlMbkJ5YjNSdmRIbHdaUzUwYjFOMGNtbHVaeUE5SUdaMWJtTjBhVzl1SUhSdlUzUnlhVzVuSUNncElIdGNiaUFnZG1GeUlHeGxibWQwYUNBOUlIUm9hWE11YkdWdVozUm9JSHdnTUZ4dUlDQnBaaUFvYkdWdVozUm9JRDA5UFNBd0tTQnlaWFIxY200Z0p5ZGNiaUFnYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BUMDlJREFwSUhKbGRIVnliaUIxZEdZNFUyeHBZMlVvZEdocGN5d2dNQ3dnYkdWdVozUm9LVnh1SUNCeVpYUjFjbTRnYzJ4dmQxUnZVM1J5YVc1bkxtRndjR3g1S0hSb2FYTXNJR0Z5WjNWdFpXNTBjeWxjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNWxjWFZoYkhNZ1BTQm1kVzVqZEdsdmJpQmxjWFZoYkhNZ0tHSXBJSHRjYmlBZ2FXWWdLQ0ZDZFdabVpYSXVhWE5DZFdabVpYSW9ZaWtwSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb0owRnlaM1Z0Wlc1MElHMTFjM1FnWW1VZ1lTQkNkV1ptWlhJbktWeHVJQ0JwWmlBb2RHaHBjeUE5UFQwZ1lpa2djbVYwZFhKdUlIUnlkV1ZjYmlBZ2NtVjBkWEp1SUVKMVptWmxjaTVqYjIxd1lYSmxLSFJvYVhNc0lHSXBJRDA5UFNBd1hHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1YVc1emNHVmpkQ0E5SUdaMWJtTjBhVzl1SUdsdWMzQmxZM1FnS0NrZ2UxeHVJQ0IyWVhJZ2MzUnlJRDBnSnlkY2JpQWdkbUZ5SUcxaGVDQTlJR1Y0Y0c5eWRITXVTVTVUVUVWRFZGOU5RVmhmUWxsVVJWTmNiaUFnYVdZZ0tIUm9hWE11YkdWdVozUm9JRDRnTUNrZ2UxeHVJQ0FnSUhOMGNpQTlJSFJvYVhNdWRHOVRkSEpwYm1jb0oyaGxlQ2NzSURBc0lHMWhlQ2t1YldGMFkyZ29MeTU3TW4wdlp5a3VhbTlwYmlnbklDY3BYRzRnSUNBZ2FXWWdLSFJvYVhNdWJHVnVaM1JvSUQ0Z2JXRjRLU0J6ZEhJZ0t6MGdKeUF1TGk0Z0oxeHVJQ0I5WEc0Z0lISmxkSFZ5YmlBblBFSjFabVpsY2lBbklDc2djM1J5SUNzZ0p6NG5YRzU5WEc1Y2JrSjFabVpsY2k1d2NtOTBiM1I1Y0dVdVkyOXRjR0Z5WlNBOUlHWjFibU4wYVc5dUlHTnZiWEJoY21VZ0tHSXBJSHRjYmlBZ2FXWWdLQ0ZDZFdabVpYSXVhWE5DZFdabVpYSW9ZaWtwSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb0owRnlaM1Z0Wlc1MElHMTFjM1FnWW1VZ1lTQkNkV1ptWlhJbktWeHVJQ0JwWmlBb2RHaHBjeUE5UFQwZ1lpa2djbVYwZFhKdUlEQmNiaUFnY21WMGRYSnVJRUoxWm1abGNpNWpiMjF3WVhKbEtIUm9hWE1zSUdJcFhHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1YVc1a1pYaFBaaUE5SUdaMWJtTjBhVzl1SUdsdVpHVjRUMllnS0haaGJDd2dZbmwwWlU5bVpuTmxkQ2tnZTF4dUlDQnBaaUFvWW5sMFpVOW1abk5sZENBK0lEQjROMlptWm1abVptWXBJR0o1ZEdWUFptWnpaWFFnUFNBd2VEZG1abVptWm1abVhHNGdJR1ZzYzJVZ2FXWWdLR0o1ZEdWUFptWnpaWFFnUENBdE1IZzRNREF3TURBd01Da2dZbmwwWlU5bVpuTmxkQ0E5SUMwd2VEZ3dNREF3TURBd1hHNGdJR0o1ZEdWUFptWnpaWFFnUGo0OUlEQmNibHh1SUNCcFppQW9kR2hwY3k1c1pXNW5kR2dnUFQwOUlEQXBJSEpsZEhWeWJpQXRNVnh1SUNCcFppQW9ZbmwwWlU5bVpuTmxkQ0ErUFNCMGFHbHpMbXhsYm1kMGFDa2djbVYwZFhKdUlDMHhYRzVjYmlBZ0x5OGdUbVZuWVhScGRtVWdiMlptYzJWMGN5QnpkR0Z5ZENCbWNtOXRJSFJvWlNCbGJtUWdiMllnZEdobElHSjFabVpsY2x4dUlDQnBaaUFvWW5sMFpVOW1abk5sZENBOElEQXBJR0o1ZEdWUFptWnpaWFFnUFNCTllYUm9MbTFoZUNoMGFHbHpMbXhsYm1kMGFDQXJJR0o1ZEdWUFptWnpaWFFzSURBcFhHNWNiaUFnYVdZZ0tIUjVjR1Z2WmlCMllXd2dQVDA5SUNkemRISnBibWNuS1NCN1hHNGdJQ0FnYVdZZ0tIWmhiQzVzWlc1bmRHZ2dQVDA5SURBcElISmxkSFZ5YmlBdE1TQXZMeUJ6Y0dWamFXRnNJR05oYzJVNklHeHZiMnRwYm1jZ1ptOXlJR1Z0Y0hSNUlITjBjbWx1WnlCaGJIZGhlWE1nWm1GcGJITmNiaUFnSUNCeVpYUjFjbTRnVTNSeWFXNW5MbkJ5YjNSdmRIbHdaUzVwYm1SbGVFOW1MbU5oYkd3b2RHaHBjeXdnZG1Gc0xDQmllWFJsVDJabWMyVjBLVnh1SUNCOVhHNGdJR2xtSUNoQ2RXWm1aWEl1YVhOQ2RXWm1aWElvZG1Gc0tTa2dlMXh1SUNBZ0lISmxkSFZ5YmlCaGNuSmhlVWx1WkdWNFQyWW9kR2hwY3l3Z2RtRnNMQ0JpZVhSbFQyWm1jMlYwS1Z4dUlDQjlYRzRnSUdsbUlDaDBlWEJsYjJZZ2RtRnNJRDA5UFNBbmJuVnRZbVZ5SnlrZ2UxeHVJQ0FnSUdsbUlDaENkV1ptWlhJdVZGbFFSVVJmUVZKU1FWbGZVMVZRVUU5U1ZDQW1KaUJWYVc1ME9FRnljbUY1TG5CeWIzUnZkSGx3WlM1cGJtUmxlRTltSUQwOVBTQW5ablZ1WTNScGIyNG5LU0I3WEc0Z0lDQWdJQ0J5WlhSMWNtNGdWV2x1ZERoQmNuSmhlUzV3Y205MGIzUjVjR1V1YVc1a1pYaFBaaTVqWVd4c0tIUm9hWE1zSUhaaGJDd2dZbmwwWlU5bVpuTmxkQ2xjYmlBZ0lDQjlYRzRnSUNBZ2NtVjBkWEp1SUdGeWNtRjVTVzVrWlhoUFppaDBhR2x6TENCYklIWmhiQ0JkTENCaWVYUmxUMlptYzJWMEtWeHVJQ0I5WEc1Y2JpQWdablZ1WTNScGIyNGdZWEp5WVhsSmJtUmxlRTltSUNoaGNuSXNJSFpoYkN3Z1lubDBaVTltWm5ObGRDa2dlMXh1SUNBZ0lIWmhjaUJtYjNWdVpFbHVaR1Y0SUQwZ0xURmNiaUFnSUNCbWIzSWdLSFpoY2lCcElEMGdNRHNnWW5sMFpVOW1abk5sZENBcklHa2dQQ0JoY25JdWJHVnVaM1JvT3lCcEt5c3BJSHRjYmlBZ0lDQWdJR2xtSUNoaGNuSmJZbmwwWlU5bVpuTmxkQ0FySUdsZElEMDlQU0IyWVd4YlptOTFibVJKYm1SbGVDQTlQVDBnTFRFZ1B5QXdJRG9nYVNBdElHWnZkVzVrU1c1a1pYaGRLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDaG1iM1Z1WkVsdVpHVjRJRDA5UFNBdE1Ta2dabTkxYm1SSmJtUmxlQ0E5SUdsY2JpQWdJQ0FnSUNBZ2FXWWdLR2tnTFNCbWIzVnVaRWx1WkdWNElDc2dNU0E5UFQwZ2RtRnNMbXhsYm1kMGFDa2djbVYwZFhKdUlHSjVkR1ZQWm1aelpYUWdLeUJtYjNWdVpFbHVaR1Y0WEc0Z0lDQWdJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lDQWdJQ0JtYjNWdVpFbHVaR1Y0SUQwZ0xURmNiaUFnSUNBZ0lIMWNiaUFnSUNCOVhHNGdJQ0FnY21WMGRYSnVJQzB4WEc0Z0lIMWNibHh1SUNCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtDZDJZV3dnYlhWemRDQmlaU0J6ZEhKcGJtY3NJRzUxYldKbGNpQnZjaUJDZFdabVpYSW5LVnh1ZlZ4dVhHNHZMeUJnWjJWMFlDQnBjeUJrWlhCeVpXTmhkR1ZrWEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG1kbGRDQTlJR1oxYm1OMGFXOXVJR2RsZENBb2IyWm1jMlYwS1NCN1hHNGdJR052Ym5OdmJHVXViRzluS0NjdVoyVjBLQ2tnYVhNZ1pHVndjbVZqWVhSbFpDNGdRV05qWlhOeklIVnphVzVuSUdGeWNtRjVJR2x1WkdWNFpYTWdhVzV6ZEdWaFpDNG5LVnh1SUNCeVpYUjFjbTRnZEdocGN5NXlaV0ZrVlVsdWREZ29iMlptYzJWMEtWeHVmVnh1WEc0dkx5QmdjMlYwWUNCcGN5QmtaWEJ5WldOaGRHVmtYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbk5sZENBOUlHWjFibU4wYVc5dUlITmxkQ0FvZGl3Z2IyWm1jMlYwS1NCN1hHNGdJR052Ym5OdmJHVXViRzluS0NjdWMyVjBLQ2tnYVhNZ1pHVndjbVZqWVhSbFpDNGdRV05qWlhOeklIVnphVzVuSUdGeWNtRjVJR2x1WkdWNFpYTWdhVzV6ZEdWaFpDNG5LVnh1SUNCeVpYUjFjbTRnZEdocGN5NTNjbWwwWlZWSmJuUTRLSFlzSUc5bVpuTmxkQ2xjYm4xY2JseHVablZ1WTNScGIyNGdhR1Y0VjNKcGRHVWdLR0oxWml3Z2MzUnlhVzVuTENCdlptWnpaWFFzSUd4bGJtZDBhQ2tnZTF4dUlDQnZabVp6WlhRZ1BTQk9kVzFpWlhJb2IyWm1jMlYwS1NCOGZDQXdYRzRnSUhaaGNpQnlaVzFoYVc1cGJtY2dQU0JpZFdZdWJHVnVaM1JvSUMwZ2IyWm1jMlYwWEc0Z0lHbG1JQ2doYkdWdVozUm9LU0I3WEc0Z0lDQWdiR1Z1WjNSb0lEMGdjbVZ0WVdsdWFXNW5YRzRnSUgwZ1pXeHpaU0I3WEc0Z0lDQWdiR1Z1WjNSb0lEMGdUblZ0WW1WeUtHeGxibWQwYUNsY2JpQWdJQ0JwWmlBb2JHVnVaM1JvSUQ0Z2NtVnRZV2x1YVc1bktTQjdYRzRnSUNBZ0lDQnNaVzVuZEdnZ1BTQnlaVzFoYVc1cGJtZGNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQXZMeUJ0ZFhOMElHSmxJR0Z1SUdWMlpXNGdiblZ0WW1WeUlHOW1JR1JwWjJsMGMxeHVJQ0IyWVhJZ2MzUnlUR1Z1SUQwZ2MzUnlhVzVuTG14bGJtZDBhRnh1SUNCcFppQW9jM1J5VEdWdUlDVWdNaUFoUFQwZ01Da2dkR2h5YjNjZ2JtVjNJRVZ5Y205eUtDZEpiblpoYkdsa0lHaGxlQ0J6ZEhKcGJtY25LVnh1WEc0Z0lHbG1JQ2hzWlc1bmRHZ2dQaUJ6ZEhKTVpXNGdMeUF5S1NCN1hHNGdJQ0FnYkdWdVozUm9JRDBnYzNSeVRHVnVJQzhnTWx4dUlDQjlYRzRnSUdadmNpQW9kbUZ5SUdrZ1BTQXdPeUJwSUR3Z2JHVnVaM1JvT3lCcEt5c3BJSHRjYmlBZ0lDQjJZWElnY0dGeWMyVmtJRDBnY0dGeWMyVkpiblFvYzNSeWFXNW5Mbk4xWW5OMGNpaHBJQ29nTWl3Z01pa3NJREUyS1Z4dUlDQWdJR2xtSUNocGMwNWhUaWh3WVhKelpXUXBLU0IwYUhKdmR5QnVaWGNnUlhKeWIzSW9KMGx1ZG1Gc2FXUWdhR1Y0SUhOMGNtbHVaeWNwWEc0Z0lDQWdZblZtVzI5bVpuTmxkQ0FySUdsZElEMGdjR0Z5YzJWa1hHNGdJSDFjYmlBZ2NtVjBkWEp1SUdsY2JuMWNibHh1Wm5WdVkzUnBiMjRnZFhSbU9GZHlhWFJsSUNoaWRXWXNJSE4wY21sdVp5d2diMlptYzJWMExDQnNaVzVuZEdncElIdGNiaUFnY21WMGRYSnVJR0pzYVhSQ2RXWm1aWElvZFhSbU9GUnZRbmwwWlhNb2MzUnlhVzVuTENCaWRXWXViR1Z1WjNSb0lDMGdiMlptYzJWMEtTd2dZblZtTENCdlptWnpaWFFzSUd4bGJtZDBhQ2xjYm4xY2JseHVablZ1WTNScGIyNGdZWE5qYVdsWGNtbDBaU0FvWW5WbUxDQnpkSEpwYm1jc0lHOW1abk5sZEN3Z2JHVnVaM1JvS1NCN1hHNGdJSEpsZEhWeWJpQmliR2wwUW5WbVptVnlLR0Z6WTJscFZHOUNlWFJsY3loemRISnBibWNwTENCaWRXWXNJRzltWm5ObGRDd2diR1Z1WjNSb0tWeHVmVnh1WEc1bWRXNWpkR2x2YmlCaWFXNWhjbmxYY21sMFpTQW9ZblZtTENCemRISnBibWNzSUc5bVpuTmxkQ3dnYkdWdVozUm9LU0I3WEc0Z0lISmxkSFZ5YmlCaGMyTnBhVmR5YVhSbEtHSjFaaXdnYzNSeWFXNW5MQ0J2Wm1aelpYUXNJR3hsYm1kMGFDbGNibjFjYmx4dVpuVnVZM1JwYjI0Z1ltRnpaVFkwVjNKcGRHVWdLR0oxWml3Z2MzUnlhVzVuTENCdlptWnpaWFFzSUd4bGJtZDBhQ2tnZTF4dUlDQnlaWFIxY200Z1lteHBkRUoxWm1abGNpaGlZWE5sTmpSVWIwSjVkR1Z6S0hOMGNtbHVaeWtzSUdKMVppd2diMlptYzJWMExDQnNaVzVuZEdncFhHNTlYRzVjYm1aMWJtTjBhVzl1SUhWamN6SlhjbWwwWlNBb1luVm1MQ0J6ZEhKcGJtY3NJRzltWm5ObGRDd2diR1Z1WjNSb0tTQjdYRzRnSUhKbGRIVnliaUJpYkdsMFFuVm1abVZ5S0hWMFpqRTJiR1ZVYjBKNWRHVnpLSE4wY21sdVp5d2dZblZtTG14bGJtZDBhQ0F0SUc5bVpuTmxkQ2tzSUdKMVppd2diMlptYzJWMExDQnNaVzVuZEdncFhHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1ZDNKcGRHVWdQU0JtZFc1amRHbHZiaUIzY21sMFpTQW9jM1J5YVc1bkxDQnZabVp6WlhRc0lHeGxibWQwYUN3Z1pXNWpiMlJwYm1jcElIdGNiaUFnTHk4Z1FuVm1abVZ5STNkeWFYUmxLSE4wY21sdVp5bGNiaUFnYVdZZ0tHOW1abk5sZENBOVBUMGdkVzVrWldacGJtVmtLU0I3WEc0Z0lDQWdaVzVqYjJScGJtY2dQU0FuZFhSbU9DZGNiaUFnSUNCc1pXNW5kR2dnUFNCMGFHbHpMbXhsYm1kMGFGeHVJQ0FnSUc5bVpuTmxkQ0E5SURCY2JpQWdMeThnUW5WbVptVnlJM2R5YVhSbEtITjBjbWx1Wnl3Z1pXNWpiMlJwYm1jcFhHNGdJSDBnWld4elpTQnBaaUFvYkdWdVozUm9JRDA5UFNCMWJtUmxabWx1WldRZ0ppWWdkSGx3Wlc5bUlHOW1abk5sZENBOVBUMGdKM04wY21sdVp5Y3BJSHRjYmlBZ0lDQmxibU52WkdsdVp5QTlJRzltWm5ObGRGeHVJQ0FnSUd4bGJtZDBhQ0E5SUhSb2FYTXViR1Z1WjNSb1hHNGdJQ0FnYjJabWMyVjBJRDBnTUZ4dUlDQXZMeUJDZFdabVpYSWpkM0pwZEdVb2MzUnlhVzVuTENCdlptWnpaWFJiTENCc1pXNW5kR2hkV3l3Z1pXNWpiMlJwYm1kZEtWeHVJQ0I5SUdWc2MyVWdhV1lnS0dselJtbHVhWFJsS0c5bVpuTmxkQ2twSUh0Y2JpQWdJQ0J2Wm1aelpYUWdQU0J2Wm1aelpYUWdmQ0F3WEc0Z0lDQWdhV1lnS0dselJtbHVhWFJsS0d4bGJtZDBhQ2twSUh0Y2JpQWdJQ0FnSUd4bGJtZDBhQ0E5SUd4bGJtZDBhQ0I4SURCY2JpQWdJQ0FnSUdsbUlDaGxibU52WkdsdVp5QTlQVDBnZFc1a1pXWnBibVZrS1NCbGJtTnZaR2x1WnlBOUlDZDFkR1k0SjF4dUlDQWdJSDBnWld4elpTQjdYRzRnSUNBZ0lDQmxibU52WkdsdVp5QTlJR3hsYm1kMGFGeHVJQ0FnSUNBZ2JHVnVaM1JvSUQwZ2RXNWtaV1pwYm1Wa1hHNGdJQ0FnZlZ4dUlDQXZMeUJzWldkaFkza2dkM0pwZEdVb2MzUnlhVzVuTENCbGJtTnZaR2x1Wnl3Z2IyWm1jMlYwTENCc1pXNW5kR2dwSUMwZ2NtVnRiM1psSUdsdUlIWXdMakV6WEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnZG1GeUlITjNZWEFnUFNCbGJtTnZaR2x1WjF4dUlDQWdJR1Z1WTI5a2FXNW5JRDBnYjJabWMyVjBYRzRnSUNBZ2IyWm1jMlYwSUQwZ2JHVnVaM1JvSUh3Z01GeHVJQ0FnSUd4bGJtZDBhQ0E5SUhOM1lYQmNiaUFnZlZ4dVhHNGdJSFpoY2lCeVpXMWhhVzVwYm1jZ1BTQjBhR2x6TG14bGJtZDBhQ0F0SUc5bVpuTmxkRnh1SUNCcFppQW9iR1Z1WjNSb0lEMDlQU0IxYm1SbFptbHVaV1FnZkh3Z2JHVnVaM1JvSUQ0Z2NtVnRZV2x1YVc1bktTQnNaVzVuZEdnZ1BTQnlaVzFoYVc1cGJtZGNibHh1SUNCcFppQW9LSE4wY21sdVp5NXNaVzVuZEdnZ1BpQXdJQ1ltSUNoc1pXNW5kR2dnUENBd0lIeDhJRzltWm5ObGRDQThJREFwS1NCOGZDQnZabVp6WlhRZ1BpQjBhR2x6TG14bGJtZDBhQ2tnZTF4dUlDQWdJSFJvY205M0lHNWxkeUJTWVc1blpVVnljbTl5S0NkaGRIUmxiWEIwSUhSdklIZHlhWFJsSUc5MWRITnBaR1VnWW5WbVptVnlJR0p2ZFc1a2N5Y3BYRzRnSUgxY2JseHVJQ0JwWmlBb0lXVnVZMjlrYVc1bktTQmxibU52WkdsdVp5QTlJQ2QxZEdZNEoxeHVYRzRnSUhaaGNpQnNiM2RsY21Wa1EyRnpaU0E5SUdaaGJITmxYRzRnSUdadmNpQW9PenNwSUh0Y2JpQWdJQ0J6ZDJsMFkyZ2dLR1Z1WTI5a2FXNW5LU0I3WEc0Z0lDQWdJQ0JqWVhObElDZG9aWGduT2x4dUlDQWdJQ0FnSUNCeVpYUjFjbTRnYUdWNFYzSnBkR1VvZEdocGN5d2djM1J5YVc1bkxDQnZabVp6WlhRc0lHeGxibWQwYUNsY2JseHVJQ0FnSUNBZ1kyRnpaU0FuZFhSbU9DYzZYRzRnSUNBZ0lDQmpZWE5sSUNkMWRHWXRPQ2M2WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIxZEdZNFYzSnBkR1VvZEdocGN5d2djM1J5YVc1bkxDQnZabVp6WlhRc0lHeGxibWQwYUNsY2JseHVJQ0FnSUNBZ1kyRnpaU0FuWVhOamFXa25PbHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdZWE5qYVdsWGNtbDBaU2gwYUdsekxDQnpkSEpwYm1jc0lHOW1abk5sZEN3Z2JHVnVaM1JvS1Z4dVhHNGdJQ0FnSUNCallYTmxJQ2RpYVc1aGNua25PbHh1SUNBZ0lDQWdJQ0J5WlhSMWNtNGdZbWx1WVhKNVYzSnBkR1VvZEdocGN5d2djM1J5YVc1bkxDQnZabVp6WlhRc0lHeGxibWQwYUNsY2JseHVJQ0FnSUNBZ1kyRnpaU0FuWW1GelpUWTBKenBjYmlBZ0lDQWdJQ0FnTHk4Z1YyRnlibWx1WnpvZ2JXRjRUR1Z1WjNSb0lHNXZkQ0IwWVd0bGJpQnBiblJ2SUdGalkyOTFiblFnYVc0Z1ltRnpaVFkwVjNKcGRHVmNiaUFnSUNBZ0lDQWdjbVYwZFhKdUlHSmhjMlUyTkZkeWFYUmxLSFJvYVhNc0lITjBjbWx1Wnl3Z2IyWm1jMlYwTENCc1pXNW5kR2dwWEc1Y2JpQWdJQ0FnSUdOaGMyVWdKM1ZqY3pJbk9seHVJQ0FnSUNBZ1kyRnpaU0FuZFdOekxUSW5PbHh1SUNBZ0lDQWdZMkZ6WlNBbmRYUm1NVFpzWlNjNlhHNGdJQ0FnSUNCallYTmxJQ2QxZEdZdE1UWnNaU2M2WEc0Z0lDQWdJQ0FnSUhKbGRIVnliaUIxWTNNeVYzSnBkR1VvZEdocGN5d2djM1J5YVc1bkxDQnZabVp6WlhRc0lHeGxibWQwYUNsY2JseHVJQ0FnSUNBZ1pHVm1ZWFZzZERwY2JpQWdJQ0FnSUNBZ2FXWWdLR3h2ZDJWeVpXUkRZWE5sS1NCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtDZFZibXR1YjNkdUlHVnVZMjlrYVc1bk9pQW5JQ3NnWlc1amIyUnBibWNwWEc0Z0lDQWdJQ0FnSUdWdVkyOWthVzVuSUQwZ0tDY25JQ3NnWlc1amIyUnBibWNwTG5SdlRHOTNaWEpEWVhObEtDbGNiaUFnSUNBZ0lDQWdiRzkzWlhKbFpFTmhjMlVnUFNCMGNuVmxYRzRnSUNBZ2ZWeHVJQ0I5WEc1OVhHNWNia0oxWm1abGNpNXdjbTkwYjNSNWNHVXVkRzlLVTA5T0lEMGdablZ1WTNScGIyNGdkRzlLVTA5T0lDZ3BJSHRjYmlBZ2NtVjBkWEp1SUh0Y2JpQWdJQ0IwZVhCbE9pQW5RblZtWm1WeUp5eGNiaUFnSUNCa1lYUmhPaUJCY25KaGVTNXdjbTkwYjNSNWNHVXVjMnhwWTJVdVkyRnNiQ2gwYUdsekxsOWhjbklnZkh3Z2RHaHBjeXdnTUNsY2JpQWdmVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmlZWE5sTmpSVGJHbGpaU0FvWW5WbUxDQnpkR0Z5ZEN3Z1pXNWtLU0I3WEc0Z0lHbG1JQ2h6ZEdGeWRDQTlQVDBnTUNBbUppQmxibVFnUFQwOUlHSjFaaTVzWlc1bmRHZ3BJSHRjYmlBZ0lDQnlaWFIxY200Z1ltRnpaVFkwTG1aeWIyMUNlWFJsUVhKeVlYa29ZblZtS1Z4dUlDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUhKbGRIVnliaUJpWVhObE5qUXVabkp2YlVKNWRHVkJjbkpoZVNoaWRXWXVjMnhwWTJVb2MzUmhjblFzSUdWdVpDa3BYRzRnSUgxY2JuMWNibHh1Wm5WdVkzUnBiMjRnZFhSbU9GTnNhV05sSUNoaWRXWXNJSE4wWVhKMExDQmxibVFwSUh0Y2JpQWdaVzVrSUQwZ1RXRjBhQzV0YVc0b1luVm1MbXhsYm1kMGFDd2daVzVrS1Z4dUlDQjJZWElnY21WeklEMGdXMTFjYmx4dUlDQjJZWElnYVNBOUlITjBZWEowWEc0Z0lIZG9hV3hsSUNocElEd2daVzVrS1NCN1hHNGdJQ0FnZG1GeUlHWnBjbk4wUW5sMFpTQTlJR0oxWmx0cFhWeHVJQ0FnSUhaaGNpQmpiMlJsVUc5cGJuUWdQU0J1ZFd4c1hHNGdJQ0FnZG1GeUlHSjVkR1Z6VUdWeVUyVnhkV1Z1WTJVZ1BTQW9abWx5YzNSQ2VYUmxJRDRnTUhoRlJpa2dQeUEwWEc0Z0lDQWdJQ0E2SUNobWFYSnpkRUo1ZEdVZ1BpQXdlRVJHS1NBL0lETmNiaUFnSUNBZ0lEb2dLR1pwY25OMFFubDBaU0ErSURCNFFrWXBJRDhnTWx4dUlDQWdJQ0FnT2lBeFhHNWNiaUFnSUNCcFppQW9hU0FySUdKNWRHVnpVR1Z5VTJWeGRXVnVZMlVnUEQwZ1pXNWtLU0I3WEc0Z0lDQWdJQ0IyWVhJZ2MyVmpiMjVrUW5sMFpTd2dkR2hwY21SQ2VYUmxMQ0JtYjNWeWRHaENlWFJsTENCMFpXMXdRMjlrWlZCdmFXNTBYRzVjYmlBZ0lDQWdJSE4zYVhSamFDQW9ZbmwwWlhOUVpYSlRaWEYxWlc1alpTa2dlMXh1SUNBZ0lDQWdJQ0JqWVhObElERTZYRzRnSUNBZ0lDQWdJQ0FnYVdZZ0tHWnBjbk4wUW5sMFpTQThJREI0T0RBcElIdGNiaUFnSUNBZ0lDQWdJQ0FnSUdOdlpHVlFiMmx1ZENBOUlHWnBjbk4wUW5sMFpWeHVJQ0FnSUNBZ0lDQWdJSDFjYmlBZ0lDQWdJQ0FnSUNCaWNtVmhhMXh1SUNBZ0lDQWdJQ0JqWVhObElESTZYRzRnSUNBZ0lDQWdJQ0FnYzJWamIyNWtRbmwwWlNBOUlHSjFabHRwSUNzZ01WMWNiaUFnSUNBZ0lDQWdJQ0JwWmlBb0tITmxZMjl1WkVKNWRHVWdKaUF3ZUVNd0tTQTlQVDBnTUhnNE1Da2dlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2RHVnRjRU52WkdWUWIybHVkQ0E5SUNobWFYSnpkRUo1ZEdVZ0ppQXdlREZHS1NBOFBDQXdlRFlnZkNBb2MyVmpiMjVrUW5sMFpTQW1JREI0TTBZcFhHNGdJQ0FnSUNBZ0lDQWdJQ0JwWmlBb2RHVnRjRU52WkdWUWIybHVkQ0ErSURCNE4wWXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjlrWlZCdmFXNTBJRDBnZEdWdGNFTnZaR1ZRYjJsdWRGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0JpY21WaGExeHVJQ0FnSUNBZ0lDQmpZWE5sSURNNlhHNGdJQ0FnSUNBZ0lDQWdjMlZqYjI1a1FubDBaU0E5SUdKMVpsdHBJQ3NnTVYxY2JpQWdJQ0FnSUNBZ0lDQjBhR2x5WkVKNWRHVWdQU0JpZFdaYmFTQXJJREpkWEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ2h6WldOdmJtUkNlWFJsSUNZZ01IaERNQ2tnUFQwOUlEQjRPREFnSmlZZ0tIUm9hWEprUW5sMFpTQW1JREI0UXpBcElEMDlQU0F3ZURnd0tTQjdYRzRnSUNBZ0lDQWdJQ0FnSUNCMFpXMXdRMjlrWlZCdmFXNTBJRDBnS0dacGNuTjBRbmwwWlNBbUlEQjRSaWtnUER3Z01IaERJSHdnS0hObFkyOXVaRUo1ZEdVZ0ppQXdlRE5HS1NBOFBDQXdlRFlnZkNBb2RHaHBjbVJDZVhSbElDWWdNSGd6UmlsY2JpQWdJQ0FnSUNBZ0lDQWdJR2xtSUNoMFpXMXdRMjlrWlZCdmFXNTBJRDRnTUhnM1JrWWdKaVlnS0hSbGJYQkRiMlJsVUc5cGJuUWdQQ0F3ZUVRNE1EQWdmSHdnZEdWdGNFTnZaR1ZRYjJsdWRDQStJREI0UkVaR1Jpa3BJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjlrWlZCdmFXNTBJRDBnZEdWdGNFTnZaR1ZRYjJsdWRGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lDQWdJQ0JpY21WaGExeHVJQ0FnSUNBZ0lDQmpZWE5sSURRNlhHNGdJQ0FnSUNBZ0lDQWdjMlZqYjI1a1FubDBaU0E5SUdKMVpsdHBJQ3NnTVYxY2JpQWdJQ0FnSUNBZ0lDQjBhR2x5WkVKNWRHVWdQU0JpZFdaYmFTQXJJREpkWEc0Z0lDQWdJQ0FnSUNBZ1ptOTFjblJvUW5sMFpTQTlJR0oxWmx0cElDc2dNMTFjYmlBZ0lDQWdJQ0FnSUNCcFppQW9LSE5sWTI5dVpFSjVkR1VnSmlBd2VFTXdLU0E5UFQwZ01IZzRNQ0FtSmlBb2RHaHBjbVJDZVhSbElDWWdNSGhETUNrZ1BUMDlJREI0T0RBZ0ppWWdLR1p2ZFhKMGFFSjVkR1VnSmlBd2VFTXdLU0E5UFQwZ01IZzRNQ2tnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdkR1Z0Y0VOdlpHVlFiMmx1ZENBOUlDaG1hWEp6ZEVKNWRHVWdKaUF3ZUVZcElEdzhJREI0TVRJZ2ZDQW9jMlZqYjI1a1FubDBaU0FtSURCNE0wWXBJRHc4SURCNFF5QjhJQ2gwYUdseVpFSjVkR1VnSmlBd2VETkdLU0E4UENBd2VEWWdmQ0FvWm05MWNuUm9RbmwwWlNBbUlEQjRNMFlwWEc0Z0lDQWdJQ0FnSUNBZ0lDQnBaaUFvZEdWdGNFTnZaR1ZRYjJsdWRDQStJREI0UmtaR1JpQW1KaUIwWlcxd1EyOWtaVkJ2YVc1MElEd2dNSGd4TVRBd01EQXBJSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdZMjlrWlZCdmFXNTBJRDBnZEdWdGNFTnZaR1ZRYjJsdWRGeHVJQ0FnSUNBZ0lDQWdJQ0FnZlZ4dUlDQWdJQ0FnSUNBZ0lIMWNiaUFnSUNBZ0lIMWNiaUFnSUNCOVhHNWNiaUFnSUNCcFppQW9ZMjlrWlZCdmFXNTBJRDA5UFNCdWRXeHNLU0I3WEc0Z0lDQWdJQ0F2THlCM1pTQmthV1FnYm05MElHZGxibVZ5WVhSbElHRWdkbUZzYVdRZ1kyOWtaVkJ2YVc1MElITnZJR2x1YzJWeWRDQmhYRzRnSUNBZ0lDQXZMeUJ5WlhCc1lXTmxiV1Z1ZENCamFHRnlJQ2hWSzBaR1JrUXBJR0Z1WkNCaFpIWmhibU5sSUc5dWJIa2dNU0JpZVhSbFhHNGdJQ0FnSUNCamIyUmxVRzlwYm5RZ1BTQXdlRVpHUmtSY2JpQWdJQ0FnSUdKNWRHVnpVR1Z5VTJWeGRXVnVZMlVnUFNBeFhHNGdJQ0FnZlNCbGJITmxJR2xtSUNoamIyUmxVRzlwYm5RZ1BpQXdlRVpHUmtZcElIdGNiaUFnSUNBZ0lDOHZJR1Z1WTI5a1pTQjBieUIxZEdZeE5pQW9jM1Z5Y205bllYUmxJSEJoYVhJZ1pHRnVZMlVwWEc0Z0lDQWdJQ0JqYjJSbFVHOXBiblFnTFQwZ01IZ3hNREF3TUZ4dUlDQWdJQ0FnY21WekxuQjFjMmdvWTI5a1pWQnZhVzUwSUQ0K1BpQXhNQ0FtSURCNE0wWkdJSHdnTUhoRU9EQXdLVnh1SUNBZ0lDQWdZMjlrWlZCdmFXNTBJRDBnTUhoRVF6QXdJSHdnWTI5a1pWQnZhVzUwSUNZZ01IZ3pSa1pjYmlBZ0lDQjlYRzVjYmlBZ0lDQnlaWE11Y0hWemFDaGpiMlJsVUc5cGJuUXBYRzRnSUNBZ2FTQXJQU0JpZVhSbGMxQmxjbE5sY1hWbGJtTmxYRzRnSUgxY2JseHVJQ0J5WlhSMWNtNGdaR1ZqYjJSbFEyOWtaVkJ2YVc1MGMwRnljbUY1S0hKbGN5bGNibjFjYmx4dUx5OGdRbUZ6WldRZ2IyNGdhSFIwY0RvdkwzTjBZV05yYjNabGNtWnNiM2N1WTI5dEwyRXZNakkzTkRjeU56SXZOamd3TnpReUxDQjBhR1VnWW5KdmQzTmxjaUIzYVhSb1hHNHZMeUIwYUdVZ2JHOTNaWE4wSUd4cGJXbDBJR2x6SUVOb2NtOXRaU3dnZDJsMGFDQXdlREV3TURBd0lHRnlaM011WEc0dkx5QlhaU0JuYnlBeElHMWhaMjVwZEhWa1pTQnNaWE56TENCbWIzSWdjMkZtWlhSNVhHNTJZWElnVFVGWVgwRlNSMVZOUlU1VVUxOU1SVTVIVkVnZ1BTQXdlREV3TURCY2JseHVablZ1WTNScGIyNGdaR1ZqYjJSbFEyOWtaVkJ2YVc1MGMwRnljbUY1SUNoamIyUmxVRzlwYm5SektTQjdYRzRnSUhaaGNpQnNaVzRnUFNCamIyUmxVRzlwYm5SekxteGxibWQwYUZ4dUlDQnBaaUFvYkdWdUlEdzlJRTFCV0Y5QlVrZFZUVVZPVkZOZlRFVk9SMVJJS1NCN1hHNGdJQ0FnY21WMGRYSnVJRk4wY21sdVp5NW1jbTl0UTJoaGNrTnZaR1V1WVhCd2JIa29VM1J5YVc1bkxDQmpiMlJsVUc5cGJuUnpLU0F2THlCaGRtOXBaQ0JsZUhSeVlTQnpiR2xqWlNncFhHNGdJSDFjYmx4dUlDQXZMeUJFWldOdlpHVWdhVzRnWTJoMWJtdHpJSFJ2SUdGMmIybGtJRndpWTJGc2JDQnpkR0ZqYXlCemFYcGxJR1Y0WTJWbFpHVmtYQ0l1WEc0Z0lIWmhjaUJ5WlhNZ1BTQW5KMXh1SUNCMllYSWdhU0E5SURCY2JpQWdkMmhwYkdVZ0tHa2dQQ0JzWlc0cElIdGNiaUFnSUNCeVpYTWdLejBnVTNSeWFXNW5MbVp5YjIxRGFHRnlRMjlrWlM1aGNIQnNlU2hjYmlBZ0lDQWdJRk4wY21sdVp5eGNiaUFnSUNBZ0lHTnZaR1ZRYjJsdWRITXVjMnhwWTJVb2FTd2dhU0FyUFNCTlFWaGZRVkpIVlUxRlRsUlRYMHhGVGtkVVNDbGNiaUFnSUNBcFhHNGdJSDFjYmlBZ2NtVjBkWEp1SUhKbGMxeHVmVnh1WEc1bWRXNWpkR2x2YmlCaGMyTnBhVk5zYVdObElDaGlkV1lzSUhOMFlYSjBMQ0JsYm1RcElIdGNiaUFnZG1GeUlISmxkQ0E5SUNjblhHNGdJR1Z1WkNBOUlFMWhkR2d1YldsdUtHSjFaaTVzWlc1bmRHZ3NJR1Z1WkNsY2JseHVJQ0JtYjNJZ0tIWmhjaUJwSUQwZ2MzUmhjblE3SUdrZ1BDQmxibVE3SUdrckt5a2dlMXh1SUNBZ0lISmxkQ0FyUFNCVGRISnBibWN1Wm5KdmJVTm9ZWEpEYjJSbEtHSjFabHRwWFNBbUlEQjROMFlwWEc0Z0lIMWNiaUFnY21WMGRYSnVJSEpsZEZ4dWZWeHVYRzVtZFc1amRHbHZiaUJpYVc1aGNubFRiR2xqWlNBb1luVm1MQ0J6ZEdGeWRDd2daVzVrS1NCN1hHNGdJSFpoY2lCeVpYUWdQU0FuSjF4dUlDQmxibVFnUFNCTllYUm9MbTFwYmloaWRXWXViR1Z1WjNSb0xDQmxibVFwWEc1Y2JpQWdabTl5SUNoMllYSWdhU0E5SUhOMFlYSjBPeUJwSUR3Z1pXNWtPeUJwS3lzcElIdGNiaUFnSUNCeVpYUWdLejBnVTNSeWFXNW5MbVp5YjIxRGFHRnlRMjlrWlNoaWRXWmJhVjBwWEc0Z0lIMWNiaUFnY21WMGRYSnVJSEpsZEZ4dWZWeHVYRzVtZFc1amRHbHZiaUJvWlhoVGJHbGpaU0FvWW5WbUxDQnpkR0Z5ZEN3Z1pXNWtLU0I3WEc0Z0lIWmhjaUJzWlc0Z1BTQmlkV1l1YkdWdVozUm9YRzVjYmlBZ2FXWWdLQ0Z6ZEdGeWRDQjhmQ0J6ZEdGeWRDQThJREFwSUhOMFlYSjBJRDBnTUZ4dUlDQnBaaUFvSVdWdVpDQjhmQ0JsYm1RZ1BDQXdJSHg4SUdWdVpDQStJR3hsYmlrZ1pXNWtJRDBnYkdWdVhHNWNiaUFnZG1GeUlHOTFkQ0E5SUNjblhHNGdJR1p2Y2lBb2RtRnlJR2tnUFNCemRHRnlkRHNnYVNBOElHVnVaRHNnYVNzcktTQjdYRzRnSUNBZ2IzVjBJQ3M5SUhSdlNHVjRLR0oxWmx0cFhTbGNiaUFnZlZ4dUlDQnlaWFIxY200Z2IzVjBYRzU5WEc1Y2JtWjFibU4wYVc5dUlIVjBaakUyYkdWVGJHbGpaU0FvWW5WbUxDQnpkR0Z5ZEN3Z1pXNWtLU0I3WEc0Z0lIWmhjaUJpZVhSbGN5QTlJR0oxWmk1emJHbGpaU2h6ZEdGeWRDd2daVzVrS1Z4dUlDQjJZWElnY21WeklEMGdKeWRjYmlBZ1ptOXlJQ2gyWVhJZ2FTQTlJREE3SUdrZ1BDQmllWFJsY3k1c1pXNW5kR2c3SUdrZ0t6MGdNaWtnZTF4dUlDQWdJSEpsY3lBclBTQlRkSEpwYm1jdVpuSnZiVU5vWVhKRGIyUmxLR0o1ZEdWelcybGRJQ3NnWW5sMFpYTmJhU0FySURGZElDb2dNalUyS1Z4dUlDQjlYRzRnSUhKbGRIVnliaUJ5WlhOY2JuMWNibHh1UW5WbVptVnlMbkJ5YjNSdmRIbHdaUzV6YkdsalpTQTlJR1oxYm1OMGFXOXVJSE5zYVdObElDaHpkR0Z5ZEN3Z1pXNWtLU0I3WEc0Z0lIWmhjaUJzWlc0Z1BTQjBhR2x6TG14bGJtZDBhRnh1SUNCemRHRnlkQ0E5SUg1K2MzUmhjblJjYmlBZ1pXNWtJRDBnWlc1a0lEMDlQU0IxYm1SbFptbHVaV1FnUHlCc1pXNGdPaUIrZm1WdVpGeHVYRzRnSUdsbUlDaHpkR0Z5ZENBOElEQXBJSHRjYmlBZ0lDQnpkR0Z5ZENBclBTQnNaVzVjYmlBZ0lDQnBaaUFvYzNSaGNuUWdQQ0F3S1NCemRHRnlkQ0E5SURCY2JpQWdmU0JsYkhObElHbG1JQ2h6ZEdGeWRDQStJR3hsYmlrZ2UxeHVJQ0FnSUhOMFlYSjBJRDBnYkdWdVhHNGdJSDFjYmx4dUlDQnBaaUFvWlc1a0lEd2dNQ2tnZTF4dUlDQWdJR1Z1WkNBclBTQnNaVzVjYmlBZ0lDQnBaaUFvWlc1a0lEd2dNQ2tnWlc1a0lEMGdNRnh1SUNCOUlHVnNjMlVnYVdZZ0tHVnVaQ0ErSUd4bGJpa2dlMXh1SUNBZ0lHVnVaQ0E5SUd4bGJseHVJQ0I5WEc1Y2JpQWdhV1lnS0dWdVpDQThJSE4wWVhKMEtTQmxibVFnUFNCemRHRnlkRnh1WEc0Z0lIWmhjaUJ1WlhkQ2RXWmNiaUFnYVdZZ0tFSjFabVpsY2k1VVdWQkZSRjlCVWxKQldWOVRWVkJRVDFKVUtTQjdYRzRnSUNBZ2JtVjNRblZtSUQwZ1FuVm1abVZ5TGw5aGRXZHRaVzUwS0hSb2FYTXVjM1ZpWVhKeVlYa29jM1JoY25Rc0lHVnVaQ2twWEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnZG1GeUlITnNhV05sVEdWdUlEMGdaVzVrSUMwZ2MzUmhjblJjYmlBZ0lDQnVaWGRDZFdZZ1BTQnVaWGNnUW5WbVptVnlLSE5zYVdObFRHVnVMQ0IxYm1SbFptbHVaV1FwWEc0Z0lDQWdabTl5SUNoMllYSWdhU0E5SURBN0lHa2dQQ0J6YkdsalpVeGxianNnYVNzcktTQjdYRzRnSUNBZ0lDQnVaWGRDZFdaYmFWMGdQU0IwYUdselcya2dLeUJ6ZEdGeWRGMWNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQnBaaUFvYm1WM1FuVm1MbXhsYm1kMGFDa2dibVYzUW5WbUxuQmhjbVZ1ZENBOUlIUm9hWE11Y0dGeVpXNTBJSHg4SUhSb2FYTmNibHh1SUNCeVpYUjFjbTRnYm1WM1FuVm1YRzU5WEc1Y2JpOHFYRzRnS2lCT1pXVmtJSFJ2SUcxaGEyVWdjM1Z5WlNCMGFHRjBJR0oxWm1abGNpQnBjMjRuZENCMGNubHBibWNnZEc4Z2QzSnBkR1VnYjNWMElHOW1JR0p2ZFc1a2N5NWNiaUFxTDF4dVpuVnVZM1JwYjI0Z1kyaGxZMnRQWm1aelpYUWdLRzltWm5ObGRDd2daWGgwTENCc1pXNW5kR2dwSUh0Y2JpQWdhV1lnS0NodlptWnpaWFFnSlNBeEtTQWhQVDBnTUNCOGZDQnZabVp6WlhRZ1BDQXdLU0IwYUhKdmR5QnVaWGNnVW1GdVoyVkZjbkp2Y2lnbmIyWm1jMlYwSUdseklHNXZkQ0IxYVc1MEp5bGNiaUFnYVdZZ0tHOW1abk5sZENBcklHVjRkQ0ErSUd4bGJtZDBhQ2tnZEdoeWIzY2dibVYzSUZKaGJtZGxSWEp5YjNJb0oxUnllV2x1WnlCMGJ5QmhZMk5sYzNNZ1ltVjViMjVrSUdKMVptWmxjaUJzWlc1bmRHZ25LVnh1ZlZ4dVhHNUNkV1ptWlhJdWNISnZkRzkwZVhCbExuSmxZV1JWU1c1MFRFVWdQU0JtZFc1amRHbHZiaUJ5WldGa1ZVbHVkRXhGSUNodlptWnpaWFFzSUdKNWRHVk1aVzVuZEdnc0lHNXZRWE56WlhKMEtTQjdYRzRnSUc5bVpuTmxkQ0E5SUc5bVpuTmxkQ0I4SURCY2JpQWdZbmwwWlV4bGJtZDBhQ0E5SUdKNWRHVk1aVzVuZEdnZ2ZDQXdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJR05vWldOclQyWm1jMlYwS0c5bVpuTmxkQ3dnWW5sMFpVeGxibWQwYUN3Z2RHaHBjeTVzWlc1bmRHZ3BYRzVjYmlBZ2RtRnlJSFpoYkNBOUlIUm9hWE5iYjJabWMyVjBYVnh1SUNCMllYSWdiWFZzSUQwZ01WeHVJQ0IyWVhJZ2FTQTlJREJjYmlBZ2QyaHBiR1VnS0NzcmFTQThJR0o1ZEdWTVpXNW5kR2dnSmlZZ0tHMTFiQ0FxUFNBd2VERXdNQ2twSUh0Y2JpQWdJQ0IyWVd3Z0t6MGdkR2hwYzF0dlptWnpaWFFnS3lCcFhTQXFJRzExYkZ4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUhaaGJGeHVmVnh1WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5KbFlXUlZTVzUwUWtVZ1BTQm1kVzVqZEdsdmJpQnlaV0ZrVlVsdWRFSkZJQ2h2Wm1aelpYUXNJR0o1ZEdWTVpXNW5kR2dzSUc1dlFYTnpaWEowS1NCN1hHNGdJRzltWm5ObGRDQTlJRzltWm5ObGRDQjhJREJjYmlBZ1lubDBaVXhsYm1kMGFDQTlJR0o1ZEdWTVpXNW5kR2dnZkNBd1hHNGdJR2xtSUNnaGJtOUJjM05sY25RcElIdGNiaUFnSUNCamFHVmphMDltWm5ObGRDaHZabVp6WlhRc0lHSjVkR1ZNWlc1bmRHZ3NJSFJvYVhNdWJHVnVaM1JvS1Z4dUlDQjlYRzVjYmlBZ2RtRnlJSFpoYkNBOUlIUm9hWE5iYjJabWMyVjBJQ3NnTFMxaWVYUmxUR1Z1WjNSb1hWeHVJQ0IyWVhJZ2JYVnNJRDBnTVZ4dUlDQjNhR2xzWlNBb1lubDBaVXhsYm1kMGFDQStJREFnSmlZZ0tHMTFiQ0FxUFNBd2VERXdNQ2twSUh0Y2JpQWdJQ0IyWVd3Z0t6MGdkR2hwYzF0dlptWnpaWFFnS3lBdExXSjVkR1ZNWlc1bmRHaGRJQ29nYlhWc1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2RtRnNYRzU5WEc1Y2JrSjFabVpsY2k1d2NtOTBiM1I1Y0dVdWNtVmhaRlZKYm5RNElEMGdablZ1WTNScGIyNGdjbVZoWkZWSmJuUTRJQ2h2Wm1aelpYUXNJRzV2UVhOelpYSjBLU0I3WEc0Z0lHbG1JQ2doYm05QmMzTmxjblFwSUdOb1pXTnJUMlptYzJWMEtHOW1abk5sZEN3Z01Td2dkR2hwY3k1c1pXNW5kR2dwWEc0Z0lISmxkSFZ5YmlCMGFHbHpXMjltWm5ObGRGMWNibjFjYmx4dVFuVm1abVZ5TG5CeWIzUnZkSGx3WlM1eVpXRmtWVWx1ZERFMlRFVWdQU0JtZFc1amRHbHZiaUJ5WldGa1ZVbHVkREUyVEVVZ0tHOW1abk5sZEN3Z2JtOUJjM05sY25RcElIdGNiaUFnYVdZZ0tDRnViMEZ6YzJWeWRDa2dZMmhsWTJ0UFptWnpaWFFvYjJabWMyVjBMQ0F5TENCMGFHbHpMbXhsYm1kMGFDbGNiaUFnY21WMGRYSnVJSFJvYVhOYmIyWm1jMlYwWFNCOElDaDBhR2x6VzI5bVpuTmxkQ0FySURGZElEdzhJRGdwWEc1OVhHNWNia0oxWm1abGNpNXdjbTkwYjNSNWNHVXVjbVZoWkZWSmJuUXhOa0pGSUQwZ1puVnVZM1JwYjI0Z2NtVmhaRlZKYm5ReE5rSkZJQ2h2Wm1aelpYUXNJRzV2UVhOelpYSjBLU0I3WEc0Z0lHbG1JQ2doYm05QmMzTmxjblFwSUdOb1pXTnJUMlptYzJWMEtHOW1abk5sZEN3Z01pd2dkR2hwY3k1c1pXNW5kR2dwWEc0Z0lISmxkSFZ5YmlBb2RHaHBjMXR2Wm1aelpYUmRJRHc4SURncElId2dkR2hwYzF0dlptWnpaWFFnS3lBeFhWeHVmVnh1WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5KbFlXUlZTVzUwTXpKTVJTQTlJR1oxYm1OMGFXOXVJSEpsWVdSVlNXNTBNekpNUlNBb2IyWm1jMlYwTENCdWIwRnpjMlZ5ZENrZ2UxeHVJQ0JwWmlBb0lXNXZRWE56WlhKMEtTQmphR1ZqYTA5bVpuTmxkQ2h2Wm1aelpYUXNJRFFzSUhSb2FYTXViR1Z1WjNSb0tWeHVYRzRnSUhKbGRIVnliaUFvS0hSb2FYTmJiMlptYzJWMFhTa2dmRnh1SUNBZ0lDQWdLSFJvYVhOYmIyWm1jMlYwSUNzZ01WMGdQRHdnT0NrZ2ZGeHVJQ0FnSUNBZ0tIUm9hWE5iYjJabWMyVjBJQ3NnTWwwZ1BEd2dNVFlwS1NBclhHNGdJQ0FnSUNBb2RHaHBjMXR2Wm1aelpYUWdLeUF6WFNBcUlEQjRNVEF3TURBd01DbGNibjFjYmx4dVFuVm1abVZ5TG5CeWIzUnZkSGx3WlM1eVpXRmtWVWx1ZERNeVFrVWdQU0JtZFc1amRHbHZiaUJ5WldGa1ZVbHVkRE15UWtVZ0tHOW1abk5sZEN3Z2JtOUJjM05sY25RcElIdGNiaUFnYVdZZ0tDRnViMEZ6YzJWeWRDa2dZMmhsWTJ0UFptWnpaWFFvYjJabWMyVjBMQ0EwTENCMGFHbHpMbXhsYm1kMGFDbGNibHh1SUNCeVpYUjFjbTRnS0hSb2FYTmJiMlptYzJWMFhTQXFJREI0TVRBd01EQXdNQ2tnSzF4dUlDQWdJQ2dvZEdocGMxdHZabVp6WlhRZ0t5QXhYU0E4UENBeE5pa2dmRnh1SUNBZ0lDaDBhR2x6VzI5bVpuTmxkQ0FySURKZElEdzhJRGdwSUh4Y2JpQWdJQ0IwYUdselcyOW1abk5sZENBcklETmRLVnh1ZlZ4dVhHNUNkV1ptWlhJdWNISnZkRzkwZVhCbExuSmxZV1JKYm5STVJTQTlJR1oxYm1OMGFXOXVJSEpsWVdSSmJuUk1SU0FvYjJabWMyVjBMQ0JpZVhSbFRHVnVaM1JvTENCdWIwRnpjMlZ5ZENrZ2UxeHVJQ0J2Wm1aelpYUWdQU0J2Wm1aelpYUWdmQ0F3WEc0Z0lHSjVkR1ZNWlc1bmRHZ2dQU0JpZVhSbFRHVnVaM1JvSUh3Z01GeHVJQ0JwWmlBb0lXNXZRWE56WlhKMEtTQmphR1ZqYTA5bVpuTmxkQ2h2Wm1aelpYUXNJR0o1ZEdWTVpXNW5kR2dzSUhSb2FYTXViR1Z1WjNSb0tWeHVYRzRnSUhaaGNpQjJZV3dnUFNCMGFHbHpXMjltWm5ObGRGMWNiaUFnZG1GeUlHMTFiQ0E5SURGY2JpQWdkbUZ5SUdrZ1BTQXdYRzRnSUhkb2FXeGxJQ2dySzJrZ1BDQmllWFJsVEdWdVozUm9JQ1ltSUNodGRXd2dLajBnTUhneE1EQXBLU0I3WEc0Z0lDQWdkbUZzSUNzOUlIUm9hWE5iYjJabWMyVjBJQ3NnYVYwZ0tpQnRkV3hjYmlBZ2ZWeHVJQ0J0ZFd3Z0tqMGdNSGc0TUZ4dVhHNGdJR2xtSUNoMllXd2dQajBnYlhWc0tTQjJZV3dnTFQwZ1RXRjBhQzV3YjNjb01pd2dPQ0FxSUdKNWRHVk1aVzVuZEdncFhHNWNiaUFnY21WMGRYSnVJSFpoYkZ4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbkpsWVdSSmJuUkNSU0E5SUdaMWJtTjBhVzl1SUhKbFlXUkpiblJDUlNBb2IyWm1jMlYwTENCaWVYUmxUR1Z1WjNSb0xDQnViMEZ6YzJWeWRDa2dlMXh1SUNCdlptWnpaWFFnUFNCdlptWnpaWFFnZkNBd1hHNGdJR0o1ZEdWTVpXNW5kR2dnUFNCaWVYUmxUR1Z1WjNSb0lId2dNRnh1SUNCcFppQW9JVzV2UVhOelpYSjBLU0JqYUdWamEwOW1abk5sZENodlptWnpaWFFzSUdKNWRHVk1aVzVuZEdnc0lIUm9hWE11YkdWdVozUm9LVnh1WEc0Z0lIWmhjaUJwSUQwZ1lubDBaVXhsYm1kMGFGeHVJQ0IyWVhJZ2JYVnNJRDBnTVZ4dUlDQjJZWElnZG1Gc0lEMGdkR2hwYzF0dlptWnpaWFFnS3lBdExXbGRYRzRnSUhkb2FXeGxJQ2hwSUQ0Z01DQW1KaUFvYlhWc0lDbzlJREI0TVRBd0tTa2dlMXh1SUNBZ0lIWmhiQ0FyUFNCMGFHbHpXMjltWm5ObGRDQXJJQzB0YVYwZ0tpQnRkV3hjYmlBZ2ZWeHVJQ0J0ZFd3Z0tqMGdNSGc0TUZ4dVhHNGdJR2xtSUNoMllXd2dQajBnYlhWc0tTQjJZV3dnTFQwZ1RXRjBhQzV3YjNjb01pd2dPQ0FxSUdKNWRHVk1aVzVuZEdncFhHNWNiaUFnY21WMGRYSnVJSFpoYkZ4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbkpsWVdSSmJuUTRJRDBnWm5WdVkzUnBiMjRnY21WaFpFbHVkRGdnS0c5bVpuTmxkQ3dnYm05QmMzTmxjblFwSUh0Y2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRQWm1aelpYUW9iMlptYzJWMExDQXhMQ0IwYUdsekxteGxibWQwYUNsY2JpQWdhV1lnS0NFb2RHaHBjMXR2Wm1aelpYUmRJQ1lnTUhnNE1Da3BJSEpsZEhWeWJpQW9kR2hwYzF0dlptWnpaWFJkS1Z4dUlDQnlaWFIxY200Z0tDZ3dlR1ptSUMwZ2RHaHBjMXR2Wm1aelpYUmRJQ3NnTVNrZ0tpQXRNU2xjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNXlaV0ZrU1c1ME1UWk1SU0E5SUdaMWJtTjBhVzl1SUhKbFlXUkpiblF4Tmt4RklDaHZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJR05vWldOclQyWm1jMlYwS0c5bVpuTmxkQ3dnTWl3Z2RHaHBjeTVzWlc1bmRHZ3BYRzRnSUhaaGNpQjJZV3dnUFNCMGFHbHpXMjltWm5ObGRGMGdmQ0FvZEdocGMxdHZabVp6WlhRZ0t5QXhYU0E4UENBNEtWeHVJQ0J5WlhSMWNtNGdLSFpoYkNBbUlEQjRPREF3TUNrZ1B5QjJZV3dnZkNBd2VFWkdSa1l3TURBd0lEb2dkbUZzWEc1OVhHNWNia0oxWm1abGNpNXdjbTkwYjNSNWNHVXVjbVZoWkVsdWRERTJRa1VnUFNCbWRXNWpkR2x2YmlCeVpXRmtTVzUwTVRaQ1JTQW9iMlptYzJWMExDQnViMEZ6YzJWeWRDa2dlMXh1SUNCcFppQW9JVzV2UVhOelpYSjBLU0JqYUdWamEwOW1abk5sZENodlptWnpaWFFzSURJc0lIUm9hWE11YkdWdVozUm9LVnh1SUNCMllYSWdkbUZzSUQwZ2RHaHBjMXR2Wm1aelpYUWdLeUF4WFNCOElDaDBhR2x6VzI5bVpuTmxkRjBnUER3Z09DbGNiaUFnY21WMGRYSnVJQ2gyWVd3Z0ppQXdlRGd3TURBcElEOGdkbUZzSUh3Z01IaEdSa1pHTURBd01DQTZJSFpoYkZ4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbkpsWVdSSmJuUXpNa3hGSUQwZ1puVnVZM1JwYjI0Z2NtVmhaRWx1ZERNeVRFVWdLRzltWm5ObGRDd2dibTlCYzNObGNuUXBJSHRjYmlBZ2FXWWdLQ0Z1YjBGemMyVnlkQ2tnWTJobFkydFBabVp6WlhRb2IyWm1jMlYwTENBMExDQjBhR2x6TG14bGJtZDBhQ2xjYmx4dUlDQnlaWFIxY200Z0tIUm9hWE5iYjJabWMyVjBYU2tnZkZ4dUlDQWdJQ2gwYUdselcyOW1abk5sZENBcklERmRJRHc4SURncElIeGNiaUFnSUNBb2RHaHBjMXR2Wm1aelpYUWdLeUF5WFNBOFBDQXhOaWtnZkZ4dUlDQWdJQ2gwYUdselcyOW1abk5sZENBcklETmRJRHc4SURJMEtWeHVmVnh1WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5KbFlXUkpiblF6TWtKRklEMGdablZ1WTNScGIyNGdjbVZoWkVsdWRETXlRa1VnS0c5bVpuTmxkQ3dnYm05QmMzTmxjblFwSUh0Y2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRQWm1aelpYUW9iMlptYzJWMExDQTBMQ0IwYUdsekxteGxibWQwYUNsY2JseHVJQ0J5WlhSMWNtNGdLSFJvYVhOYmIyWm1jMlYwWFNBOFBDQXlOQ2tnZkZ4dUlDQWdJQ2gwYUdselcyOW1abk5sZENBcklERmRJRHc4SURFMktTQjhYRzRnSUNBZ0tIUm9hWE5iYjJabWMyVjBJQ3NnTWwwZ1BEd2dPQ2tnZkZ4dUlDQWdJQ2gwYUdselcyOW1abk5sZENBcklETmRLVnh1ZlZ4dVhHNUNkV1ptWlhJdWNISnZkRzkwZVhCbExuSmxZV1JHYkc5aGRFeEZJRDBnWm5WdVkzUnBiMjRnY21WaFpFWnNiMkYwVEVVZ0tHOW1abk5sZEN3Z2JtOUJjM05sY25RcElIdGNiaUFnYVdZZ0tDRnViMEZ6YzJWeWRDa2dZMmhsWTJ0UFptWnpaWFFvYjJabWMyVjBMQ0EwTENCMGFHbHpMbXhsYm1kMGFDbGNiaUFnY21WMGRYSnVJR2xsWldVM05UUXVjbVZoWkNoMGFHbHpMQ0J2Wm1aelpYUXNJSFJ5ZFdVc0lESXpMQ0EwS1Z4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbkpsWVdSR2JHOWhkRUpGSUQwZ1puVnVZM1JwYjI0Z2NtVmhaRVpzYjJGMFFrVWdLRzltWm5ObGRDd2dibTlCYzNObGNuUXBJSHRjYmlBZ2FXWWdLQ0Z1YjBGemMyVnlkQ2tnWTJobFkydFBabVp6WlhRb2IyWm1jMlYwTENBMExDQjBhR2x6TG14bGJtZDBhQ2xjYmlBZ2NtVjBkWEp1SUdsbFpXVTNOVFF1Y21WaFpDaDBhR2x6TENCdlptWnpaWFFzSUdaaGJITmxMQ0F5TXl3Z05DbGNibjFjYmx4dVFuVm1abVZ5TG5CeWIzUnZkSGx3WlM1eVpXRmtSRzkxWW14bFRFVWdQU0JtZFc1amRHbHZiaUJ5WldGa1JHOTFZbXhsVEVVZ0tHOW1abk5sZEN3Z2JtOUJjM05sY25RcElIdGNiaUFnYVdZZ0tDRnViMEZ6YzJWeWRDa2dZMmhsWTJ0UFptWnpaWFFvYjJabWMyVjBMQ0E0TENCMGFHbHpMbXhsYm1kMGFDbGNiaUFnY21WMGRYSnVJR2xsWldVM05UUXVjbVZoWkNoMGFHbHpMQ0J2Wm1aelpYUXNJSFJ5ZFdVc0lEVXlMQ0E0S1Z4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbkpsWVdSRWIzVmliR1ZDUlNBOUlHWjFibU4wYVc5dUlISmxZV1JFYjNWaWJHVkNSU0FvYjJabWMyVjBMQ0J1YjBGemMyVnlkQ2tnZTF4dUlDQnBaaUFvSVc1dlFYTnpaWEowS1NCamFHVmphMDltWm5ObGRDaHZabVp6WlhRc0lEZ3NJSFJvYVhNdWJHVnVaM1JvS1Z4dUlDQnlaWFIxY200Z2FXVmxaVGMxTkM1eVpXRmtLSFJvYVhNc0lHOW1abk5sZEN3Z1ptRnNjMlVzSURVeUxDQTRLVnh1ZlZ4dVhHNW1kVzVqZEdsdmJpQmphR1ZqYTBsdWRDQW9ZblZtTENCMllXeDFaU3dnYjJabWMyVjBMQ0JsZUhRc0lHMWhlQ3dnYldsdUtTQjdYRzRnSUdsbUlDZ2hRblZtWm1WeUxtbHpRblZtWm1WeUtHSjFaaWtwSUhSb2NtOTNJRzVsZHlCVWVYQmxSWEp5YjNJb0oySjFabVpsY2lCdGRYTjBJR0psSUdFZ1FuVm1abVZ5SUdsdWMzUmhibU5sSnlsY2JpQWdhV1lnS0haaGJIVmxJRDRnYldGNElIeDhJSFpoYkhWbElEd2diV2x1S1NCMGFISnZkeUJ1WlhjZ1VtRnVaMlZGY25KdmNpZ25kbUZzZFdVZ2FYTWdiM1YwSUc5bUlHSnZkVzVrY3ljcFhHNGdJR2xtSUNodlptWnpaWFFnS3lCbGVIUWdQaUJpZFdZdWJHVnVaM1JvS1NCMGFISnZkeUJ1WlhjZ1VtRnVaMlZGY25KdmNpZ25hVzVrWlhnZ2IzVjBJRzltSUhKaGJtZGxKeWxjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNTNjbWwwWlZWSmJuUk1SU0E5SUdaMWJtTjBhVzl1SUhkeWFYUmxWVWx1ZEV4RklDaDJZV3gxWlN3Z2IyWm1jMlYwTENCaWVYUmxUR1Z1WjNSb0xDQnViMEZ6YzJWeWRDa2dlMXh1SUNCMllXeDFaU0E5SUN0MllXeDFaVnh1SUNCdlptWnpaWFFnUFNCdlptWnpaWFFnZkNBd1hHNGdJR0o1ZEdWTVpXNW5kR2dnUFNCaWVYUmxUR1Z1WjNSb0lId2dNRnh1SUNCcFppQW9JVzV2UVhOelpYSjBLU0JqYUdWamEwbHVkQ2gwYUdsekxDQjJZV3gxWlN3Z2IyWm1jMlYwTENCaWVYUmxUR1Z1WjNSb0xDQk5ZWFJvTG5CdmR5Z3lMQ0E0SUNvZ1lubDBaVXhsYm1kMGFDa3NJREFwWEc1Y2JpQWdkbUZ5SUcxMWJDQTlJREZjYmlBZ2RtRnlJR2tnUFNBd1hHNGdJSFJvYVhOYmIyWm1jMlYwWFNBOUlIWmhiSFZsSUNZZ01IaEdSbHh1SUNCM2FHbHNaU0FvS3l0cElEd2dZbmwwWlV4bGJtZDBhQ0FtSmlBb2JYVnNJQ285SURCNE1UQXdLU2tnZTF4dUlDQWdJSFJvYVhOYmIyWm1jMlYwSUNzZ2FWMGdQU0FvZG1Gc2RXVWdMeUJ0ZFd3cElDWWdNSGhHUmx4dUlDQjlYRzVjYmlBZ2NtVjBkWEp1SUc5bVpuTmxkQ0FySUdKNWRHVk1aVzVuZEdoY2JuMWNibHh1UW5WbVptVnlMbkJ5YjNSdmRIbHdaUzUzY21sMFpWVkpiblJDUlNBOUlHWjFibU4wYVc5dUlIZHlhWFJsVlVsdWRFSkZJQ2gyWVd4MVpTd2diMlptYzJWMExDQmllWFJsVEdWdVozUm9MQ0J1YjBGemMyVnlkQ2tnZTF4dUlDQjJZV3gxWlNBOUlDdDJZV3gxWlZ4dUlDQnZabVp6WlhRZ1BTQnZabVp6WlhRZ2ZDQXdYRzRnSUdKNWRHVk1aVzVuZEdnZ1BTQmllWFJsVEdWdVozUm9JSHdnTUZ4dUlDQnBaaUFvSVc1dlFYTnpaWEowS1NCamFHVmphMGx1ZENoMGFHbHpMQ0IyWVd4MVpTd2diMlptYzJWMExDQmllWFJsVEdWdVozUm9MQ0JOWVhSb0xuQnZkeWd5TENBNElDb2dZbmwwWlV4bGJtZDBhQ2tzSURBcFhHNWNiaUFnZG1GeUlHa2dQU0JpZVhSbFRHVnVaM1JvSUMwZ01WeHVJQ0IyWVhJZ2JYVnNJRDBnTVZ4dUlDQjBhR2x6VzI5bVpuTmxkQ0FySUdsZElEMGdkbUZzZFdVZ0ppQXdlRVpHWEc0Z0lIZG9hV3hsSUNndExXa2dQajBnTUNBbUppQW9iWFZzSUNvOUlEQjRNVEF3S1NrZ2UxeHVJQ0FnSUhSb2FYTmJiMlptYzJWMElDc2dhVjBnUFNBb2RtRnNkV1VnTHlCdGRXd3BJQ1lnTUhoR1JseHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlHOW1abk5sZENBcklHSjVkR1ZNWlc1bmRHaGNibjFjYmx4dVFuVm1abVZ5TG5CeWIzUnZkSGx3WlM1M2NtbDBaVlZKYm5RNElEMGdablZ1WTNScGIyNGdkM0pwZEdWVlNXNTBPQ0FvZG1Gc2RXVXNJRzltWm5ObGRDd2dibTlCYzNObGNuUXBJSHRjYmlBZ2RtRnNkV1VnUFNBcmRtRnNkV1ZjYmlBZ2IyWm1jMlYwSUQwZ2IyWm1jMlYwSUh3Z01GeHVJQ0JwWmlBb0lXNXZRWE56WlhKMEtTQmphR1ZqYTBsdWRDaDBhR2x6TENCMllXeDFaU3dnYjJabWMyVjBMQ0F4TENBd2VHWm1MQ0F3S1Z4dUlDQnBaaUFvSVVKMVptWmxjaTVVV1ZCRlJGOUJVbEpCV1Y5VFZWQlFUMUpVS1NCMllXeDFaU0E5SUUxaGRHZ3VabXh2YjNJb2RtRnNkV1VwWEc0Z0lIUm9hWE5iYjJabWMyVjBYU0E5SUhaaGJIVmxYRzRnSUhKbGRIVnliaUJ2Wm1aelpYUWdLeUF4WEc1OVhHNWNibVoxYm1OMGFXOXVJRzlpYW1WamRGZHlhWFJsVlVsdWRERTJJQ2hpZFdZc0lIWmhiSFZsTENCdlptWnpaWFFzSUd4cGRIUnNaVVZ1WkdsaGJpa2dlMXh1SUNCcFppQW9kbUZzZFdVZ1BDQXdLU0IyWVd4MVpTQTlJREI0Wm1abVppQXJJSFpoYkhWbElDc2dNVnh1SUNCbWIzSWdLSFpoY2lCcElEMGdNQ3dnYWlBOUlFMWhkR2d1YldsdUtHSjFaaTVzWlc1bmRHZ2dMU0J2Wm1aelpYUXNJRElwT3lCcElEd2dhanNnYVNzcktTQjdYRzRnSUNBZ1luVm1XMjltWm5ObGRDQXJJR2xkSUQwZ0tIWmhiSFZsSUNZZ0tEQjRabVlnUER3Z0tEZ2dLaUFvYkdsMGRHeGxSVzVrYVdGdUlEOGdhU0E2SURFZ0xTQnBLU2twS1NBK1BqNWNiaUFnSUNBZ0lDaHNhWFIwYkdWRmJtUnBZVzRnUHlCcElEb2dNU0F0SUdrcElDb2dPRnh1SUNCOVhHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1ZDNKcGRHVlZTVzUwTVRaTVJTQTlJR1oxYm1OMGFXOXVJSGR5YVhSbFZVbHVkREUyVEVVZ0tIWmhiSFZsTENCdlptWnpaWFFzSUc1dlFYTnpaWEowS1NCN1hHNGdJSFpoYkhWbElEMGdLM1poYkhWbFhHNGdJRzltWm5ObGRDQTlJRzltWm5ObGRDQjhJREJjYmlBZ2FXWWdLQ0Z1YjBGemMyVnlkQ2tnWTJobFkydEpiblFvZEdocGN5d2dkbUZzZFdVc0lHOW1abk5sZEN3Z01pd2dNSGhtWm1abUxDQXdLVnh1SUNCcFppQW9RblZtWm1WeUxsUlpVRVZFWDBGU1VrRlpYMU5WVUZCUFVsUXBJSHRjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkRjBnUFNCMllXeDFaVnh1SUNBZ0lIUm9hWE5iYjJabWMyVjBJQ3NnTVYwZ1BTQW9kbUZzZFdVZ1BqNCtJRGdwWEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnYjJKcVpXTjBWM0pwZEdWVlNXNTBNVFlvZEdocGN5d2dkbUZzZFdVc0lHOW1abk5sZEN3Z2RISjFaU2xjYmlBZ2ZWeHVJQ0J5WlhSMWNtNGdiMlptYzJWMElDc2dNbHh1ZlZ4dVhHNUNkV1ptWlhJdWNISnZkRzkwZVhCbExuZHlhWFJsVlVsdWRERTJRa1VnUFNCbWRXNWpkR2x2YmlCM2NtbDBaVlZKYm5ReE5rSkZJQ2gyWVd4MVpTd2diMlptYzJWMExDQnViMEZ6YzJWeWRDa2dlMXh1SUNCMllXeDFaU0E5SUN0MllXeDFaVnh1SUNCdlptWnpaWFFnUFNCdlptWnpaWFFnZkNBd1hHNGdJR2xtSUNnaGJtOUJjM05sY25RcElHTm9aV05yU1c1MEtIUm9hWE1zSUhaaGJIVmxMQ0J2Wm1aelpYUXNJRElzSURCNFptWm1aaXdnTUNsY2JpQWdhV1lnS0VKMVptWmxjaTVVV1ZCRlJGOUJVbEpCV1Y5VFZWQlFUMUpVS1NCN1hHNGdJQ0FnZEdocGMxdHZabVp6WlhSZElEMGdLSFpoYkhWbElENCtQaUE0S1Z4dUlDQWdJSFJvYVhOYmIyWm1jMlYwSUNzZ01WMGdQU0IyWVd4MVpWeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lHOWlhbVZqZEZkeWFYUmxWVWx1ZERFMktIUm9hWE1zSUhaaGJIVmxMQ0J2Wm1aelpYUXNJR1poYkhObEtWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCdlptWnpaWFFnS3lBeVhHNTlYRzVjYm1aMWJtTjBhVzl1SUc5aWFtVmpkRmR5YVhSbFZVbHVkRE15SUNoaWRXWXNJSFpoYkhWbExDQnZabVp6WlhRc0lHeHBkSFJzWlVWdVpHbGhiaWtnZTF4dUlDQnBaaUFvZG1Gc2RXVWdQQ0F3S1NCMllXeDFaU0E5SURCNFptWm1abVptWm1ZZ0t5QjJZV3gxWlNBcklERmNiaUFnWm05eUlDaDJZWElnYVNBOUlEQXNJR29nUFNCTllYUm9MbTFwYmloaWRXWXViR1Z1WjNSb0lDMGdiMlptYzJWMExDQTBLVHNnYVNBOElHbzdJR2tyS3lrZ2UxeHVJQ0FnSUdKMVpsdHZabVp6WlhRZ0t5QnBYU0E5SUNoMllXeDFaU0ErUGo0Z0tHeHBkSFJzWlVWdVpHbGhiaUEvSUdrZ09pQXpJQzBnYVNrZ0tpQTRLU0FtSURCNFptWmNiaUFnZlZ4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbmR5YVhSbFZVbHVkRE15VEVVZ1BTQm1kVzVqZEdsdmJpQjNjbWwwWlZWSmJuUXpNa3hGSUNoMllXeDFaU3dnYjJabWMyVjBMQ0J1YjBGemMyVnlkQ2tnZTF4dUlDQjJZV3gxWlNBOUlDdDJZV3gxWlZ4dUlDQnZabVp6WlhRZ1BTQnZabVp6WlhRZ2ZDQXdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJR05vWldOclNXNTBLSFJvYVhNc0lIWmhiSFZsTENCdlptWnpaWFFzSURRc0lEQjRabVptWm1abVptWXNJREFwWEc0Z0lHbG1JQ2hDZFdabVpYSXVWRmxRUlVSZlFWSlNRVmxmVTFWUVVFOVNWQ2tnZTF4dUlDQWdJSFJvYVhOYmIyWm1jMlYwSUNzZ00xMGdQU0FvZG1Gc2RXVWdQajQrSURJMEtWeHVJQ0FnSUhSb2FYTmJiMlptYzJWMElDc2dNbDBnUFNBb2RtRnNkV1VnUGo0K0lERTJLVnh1SUNBZ0lIUm9hWE5iYjJabWMyVjBJQ3NnTVYwZ1BTQW9kbUZzZFdVZ1BqNCtJRGdwWEc0Z0lDQWdkR2hwYzF0dlptWnpaWFJkSUQwZ2RtRnNkV1ZjYmlBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0J2WW1wbFkzUlhjbWwwWlZWSmJuUXpNaWgwYUdsekxDQjJZV3gxWlN3Z2IyWm1jMlYwTENCMGNuVmxLVnh1SUNCOVhHNGdJSEpsZEhWeWJpQnZabVp6WlhRZ0t5QTBYRzU5WEc1Y2JrSjFabVpsY2k1d2NtOTBiM1I1Y0dVdWQzSnBkR1ZWU1c1ME16SkNSU0E5SUdaMWJtTjBhVzl1SUhkeWFYUmxWVWx1ZERNeVFrVWdLSFpoYkhWbExDQnZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUhaaGJIVmxJRDBnSzNaaGJIVmxYRzRnSUc5bVpuTmxkQ0E5SUc5bVpuTmxkQ0I4SURCY2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRKYm5Rb2RHaHBjeXdnZG1Gc2RXVXNJRzltWm5ObGRDd2dOQ3dnTUhobVptWm1abVptWml3Z01DbGNiaUFnYVdZZ0tFSjFabVpsY2k1VVdWQkZSRjlCVWxKQldWOVRWVkJRVDFKVUtTQjdYRzRnSUNBZ2RHaHBjMXR2Wm1aelpYUmRJRDBnS0haaGJIVmxJRDQrUGlBeU5DbGNiaUFnSUNCMGFHbHpXMjltWm5ObGRDQXJJREZkSUQwZ0tIWmhiSFZsSUQ0K1BpQXhOaWxjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkQ0FySURKZElEMGdLSFpoYkhWbElENCtQaUE0S1Z4dUlDQWdJSFJvYVhOYmIyWm1jMlYwSUNzZ00xMGdQU0IyWVd4MVpWeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lHOWlhbVZqZEZkeWFYUmxWVWx1ZERNeUtIUm9hWE1zSUhaaGJIVmxMQ0J2Wm1aelpYUXNJR1poYkhObEtWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCdlptWnpaWFFnS3lBMFhHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1ZDNKcGRHVkpiblJNUlNBOUlHWjFibU4wYVc5dUlIZHlhWFJsU1c1MFRFVWdLSFpoYkhWbExDQnZabVp6WlhRc0lHSjVkR1ZNWlc1bmRHZ3NJRzV2UVhOelpYSjBLU0I3WEc0Z0lIWmhiSFZsSUQwZ0szWmhiSFZsWEc0Z0lHOW1abk5sZENBOUlHOW1abk5sZENCOElEQmNiaUFnYVdZZ0tDRnViMEZ6YzJWeWRDa2dlMXh1SUNBZ0lIWmhjaUJzYVcxcGRDQTlJRTFoZEdndWNHOTNLRElzSURnZ0tpQmllWFJsVEdWdVozUm9JQzBnTVNsY2JseHVJQ0FnSUdOb1pXTnJTVzUwS0hSb2FYTXNJSFpoYkhWbExDQnZabVp6WlhRc0lHSjVkR1ZNWlc1bmRHZ3NJR3hwYldsMElDMGdNU3dnTFd4cGJXbDBLVnh1SUNCOVhHNWNiaUFnZG1GeUlHa2dQU0F3WEc0Z0lIWmhjaUJ0ZFd3Z1BTQXhYRzRnSUhaaGNpQnpkV0lnUFNCMllXeDFaU0E4SURBZ1B5QXhJRG9nTUZ4dUlDQjBhR2x6VzI5bVpuTmxkRjBnUFNCMllXeDFaU0FtSURCNFJrWmNiaUFnZDJocGJHVWdLQ3NyYVNBOElHSjVkR1ZNWlc1bmRHZ2dKaVlnS0cxMWJDQXFQU0F3ZURFd01Da3BJSHRjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkQ0FySUdsZElEMGdLQ2gyWVd4MVpTQXZJRzExYkNrZ1BqNGdNQ2tnTFNCemRXSWdKaUF3ZUVaR1hHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2IyWm1jMlYwSUNzZ1lubDBaVXhsYm1kMGFGeHVmVnh1WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5keWFYUmxTVzUwUWtVZ1BTQm1kVzVqZEdsdmJpQjNjbWwwWlVsdWRFSkZJQ2gyWVd4MVpTd2diMlptYzJWMExDQmllWFJsVEdWdVozUm9MQ0J1YjBGemMyVnlkQ2tnZTF4dUlDQjJZV3gxWlNBOUlDdDJZV3gxWlZ4dUlDQnZabVp6WlhRZ1BTQnZabVp6WlhRZ2ZDQXdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJSHRjYmlBZ0lDQjJZWElnYkdsdGFYUWdQU0JOWVhSb0xuQnZkeWd5TENBNElDb2dZbmwwWlV4bGJtZDBhQ0F0SURFcFhHNWNiaUFnSUNCamFHVmphMGx1ZENoMGFHbHpMQ0IyWVd4MVpTd2diMlptYzJWMExDQmllWFJsVEdWdVozUm9MQ0JzYVcxcGRDQXRJREVzSUMxc2FXMXBkQ2xjYmlBZ2ZWeHVYRzRnSUhaaGNpQnBJRDBnWW5sMFpVeGxibWQwYUNBdElERmNiaUFnZG1GeUlHMTFiQ0E5SURGY2JpQWdkbUZ5SUhOMVlpQTlJSFpoYkhWbElEd2dNQ0EvSURFZ09pQXdYRzRnSUhSb2FYTmJiMlptYzJWMElDc2dhVjBnUFNCMllXeDFaU0FtSURCNFJrWmNiaUFnZDJocGJHVWdLQzB0YVNBK1BTQXdJQ1ltSUNodGRXd2dLajBnTUhneE1EQXBLU0I3WEc0Z0lDQWdkR2hwYzF0dlptWnpaWFFnS3lCcFhTQTlJQ2dvZG1Gc2RXVWdMeUJ0ZFd3cElENCtJREFwSUMwZ2MzVmlJQ1lnTUhoR1JseHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlHOW1abk5sZENBcklHSjVkR1ZNWlc1bmRHaGNibjFjYmx4dVFuVm1abVZ5TG5CeWIzUnZkSGx3WlM1M2NtbDBaVWx1ZERnZ1BTQm1kVzVqZEdsdmJpQjNjbWwwWlVsdWREZ2dLSFpoYkhWbExDQnZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUhaaGJIVmxJRDBnSzNaaGJIVmxYRzRnSUc5bVpuTmxkQ0E5SUc5bVpuTmxkQ0I4SURCY2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRKYm5Rb2RHaHBjeXdnZG1Gc2RXVXNJRzltWm5ObGRDd2dNU3dnTUhnM1ppd2dMVEI0T0RBcFhHNGdJR2xtSUNnaFFuVm1abVZ5TGxSWlVFVkVYMEZTVWtGWlgxTlZVRkJQVWxRcElIWmhiSFZsSUQwZ1RXRjBhQzVtYkc5dmNpaDJZV3gxWlNsY2JpQWdhV1lnS0haaGJIVmxJRHdnTUNrZ2RtRnNkV1VnUFNBd2VHWm1JQ3NnZG1Gc2RXVWdLeUF4WEc0Z0lIUm9hWE5iYjJabWMyVjBYU0E5SUhaaGJIVmxYRzRnSUhKbGRIVnliaUJ2Wm1aelpYUWdLeUF4WEc1OVhHNWNia0oxWm1abGNpNXdjbTkwYjNSNWNHVXVkM0pwZEdWSmJuUXhOa3hGSUQwZ1puVnVZM1JwYjI0Z2QzSnBkR1ZKYm5ReE5reEZJQ2gyWVd4MVpTd2diMlptYzJWMExDQnViMEZ6YzJWeWRDa2dlMXh1SUNCMllXeDFaU0E5SUN0MllXeDFaVnh1SUNCdlptWnpaWFFnUFNCdlptWnpaWFFnZkNBd1hHNGdJR2xtSUNnaGJtOUJjM05sY25RcElHTm9aV05yU1c1MEtIUm9hWE1zSUhaaGJIVmxMQ0J2Wm1aelpYUXNJRElzSURCNE4yWm1aaXdnTFRCNE9EQXdNQ2xjYmlBZ2FXWWdLRUoxWm1abGNpNVVXVkJGUkY5QlVsSkJXVjlUVlZCUVQxSlVLU0I3WEc0Z0lDQWdkR2hwYzF0dlptWnpaWFJkSUQwZ2RtRnNkV1ZjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkQ0FySURGZElEMGdLSFpoYkhWbElENCtQaUE0S1Z4dUlDQjlJR1ZzYzJVZ2UxeHVJQ0FnSUc5aWFtVmpkRmR5YVhSbFZVbHVkREUyS0hSb2FYTXNJSFpoYkhWbExDQnZabVp6WlhRc0lIUnlkV1VwWEc0Z0lIMWNiaUFnY21WMGRYSnVJRzltWm5ObGRDQXJJREpjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNTNjbWwwWlVsdWRERTJRa1VnUFNCbWRXNWpkR2x2YmlCM2NtbDBaVWx1ZERFMlFrVWdLSFpoYkhWbExDQnZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUhaaGJIVmxJRDBnSzNaaGJIVmxYRzRnSUc5bVpuTmxkQ0E5SUc5bVpuTmxkQ0I4SURCY2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRKYm5Rb2RHaHBjeXdnZG1Gc2RXVXNJRzltWm5ObGRDd2dNaXdnTUhnM1ptWm1MQ0F0TUhnNE1EQXdLVnh1SUNCcFppQW9RblZtWm1WeUxsUlpVRVZFWDBGU1VrRlpYMU5WVUZCUFVsUXBJSHRjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkRjBnUFNBb2RtRnNkV1VnUGo0K0lEZ3BYRzRnSUNBZ2RHaHBjMXR2Wm1aelpYUWdLeUF4WFNBOUlIWmhiSFZsWEc0Z0lIMGdaV3h6WlNCN1hHNGdJQ0FnYjJKcVpXTjBWM0pwZEdWVlNXNTBNVFlvZEdocGN5d2dkbUZzZFdVc0lHOW1abk5sZEN3Z1ptRnNjMlVwWEc0Z0lIMWNiaUFnY21WMGRYSnVJRzltWm5ObGRDQXJJREpjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNTNjbWwwWlVsdWRETXlURVVnUFNCbWRXNWpkR2x2YmlCM2NtbDBaVWx1ZERNeVRFVWdLSFpoYkhWbExDQnZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUhaaGJIVmxJRDBnSzNaaGJIVmxYRzRnSUc5bVpuTmxkQ0E5SUc5bVpuTmxkQ0I4SURCY2JpQWdhV1lnS0NGdWIwRnpjMlZ5ZENrZ1kyaGxZMnRKYm5Rb2RHaHBjeXdnZG1Gc2RXVXNJRzltWm5ObGRDd2dOQ3dnTUhnM1ptWm1abVptWml3Z0xUQjRPREF3TURBd01EQXBYRzRnSUdsbUlDaENkV1ptWlhJdVZGbFFSVVJmUVZKU1FWbGZVMVZRVUU5U1ZDa2dlMXh1SUNBZ0lIUm9hWE5iYjJabWMyVjBYU0E5SUhaaGJIVmxYRzRnSUNBZ2RHaHBjMXR2Wm1aelpYUWdLeUF4WFNBOUlDaDJZV3gxWlNBK1BqNGdPQ2xjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkQ0FySURKZElEMGdLSFpoYkhWbElENCtQaUF4TmlsY2JpQWdJQ0IwYUdselcyOW1abk5sZENBcklETmRJRDBnS0haaGJIVmxJRDQrUGlBeU5DbGNiaUFnZlNCbGJITmxJSHRjYmlBZ0lDQnZZbXBsWTNSWGNtbDBaVlZKYm5Rek1paDBhR2x6TENCMllXeDFaU3dnYjJabWMyVjBMQ0IwY25WbEtWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCdlptWnpaWFFnS3lBMFhHNTlYRzVjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1ZDNKcGRHVkpiblF6TWtKRklEMGdablZ1WTNScGIyNGdkM0pwZEdWSmJuUXpNa0pGSUNoMllXeDFaU3dnYjJabWMyVjBMQ0J1YjBGemMyVnlkQ2tnZTF4dUlDQjJZV3gxWlNBOUlDdDJZV3gxWlZ4dUlDQnZabVp6WlhRZ1BTQnZabVp6WlhRZ2ZDQXdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJR05vWldOclNXNTBLSFJvYVhNc0lIWmhiSFZsTENCdlptWnpaWFFzSURRc0lEQjROMlptWm1abVptWXNJQzB3ZURnd01EQXdNREF3S1Z4dUlDQnBaaUFvZG1Gc2RXVWdQQ0F3S1NCMllXeDFaU0E5SURCNFptWm1abVptWm1ZZ0t5QjJZV3gxWlNBcklERmNiaUFnYVdZZ0tFSjFabVpsY2k1VVdWQkZSRjlCVWxKQldWOVRWVkJRVDFKVUtTQjdYRzRnSUNBZ2RHaHBjMXR2Wm1aelpYUmRJRDBnS0haaGJIVmxJRDQrUGlBeU5DbGNiaUFnSUNCMGFHbHpXMjltWm5ObGRDQXJJREZkSUQwZ0tIWmhiSFZsSUQ0K1BpQXhOaWxjYmlBZ0lDQjBhR2x6VzI5bVpuTmxkQ0FySURKZElEMGdLSFpoYkhWbElENCtQaUE0S1Z4dUlDQWdJSFJvYVhOYmIyWm1jMlYwSUNzZ00xMGdQU0IyWVd4MVpWeHVJQ0I5SUdWc2MyVWdlMXh1SUNBZ0lHOWlhbVZqZEZkeWFYUmxWVWx1ZERNeUtIUm9hWE1zSUhaaGJIVmxMQ0J2Wm1aelpYUXNJR1poYkhObEtWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCdlptWnpaWFFnS3lBMFhHNTlYRzVjYm1aMWJtTjBhVzl1SUdOb1pXTnJTVVZGUlRjMU5DQW9ZblZtTENCMllXeDFaU3dnYjJabWMyVjBMQ0JsZUhRc0lHMWhlQ3dnYldsdUtTQjdYRzRnSUdsbUlDaDJZV3gxWlNBK0lHMWhlQ0I4ZkNCMllXeDFaU0E4SUcxcGJpa2dkR2h5YjNjZ2JtVjNJRkpoYm1kbFJYSnliM0lvSjNaaGJIVmxJR2x6SUc5MWRDQnZaaUJpYjNWdVpITW5LVnh1SUNCcFppQW9iMlptYzJWMElDc2daWGgwSUQ0Z1luVm1MbXhsYm1kMGFDa2dkR2h5YjNjZ2JtVjNJRkpoYm1kbFJYSnliM0lvSjJsdVpHVjRJRzkxZENCdlppQnlZVzVuWlNjcFhHNGdJR2xtSUNodlptWnpaWFFnUENBd0tTQjBhSEp2ZHlCdVpYY2dVbUZ1WjJWRmNuSnZjaWduYVc1a1pYZ2diM1YwSUc5bUlISmhibWRsSnlsY2JuMWNibHh1Wm5WdVkzUnBiMjRnZDNKcGRHVkdiRzloZENBb1luVm1MQ0IyWVd4MVpTd2diMlptYzJWMExDQnNhWFIwYkdWRmJtUnBZVzRzSUc1dlFYTnpaWEowS1NCN1hHNGdJR2xtSUNnaGJtOUJjM05sY25RcElIdGNiaUFnSUNCamFHVmphMGxGUlVVM05UUW9ZblZtTENCMllXeDFaU3dnYjJabWMyVjBMQ0EwTENBekxqUXdNamd5TXpRMk5qTTROVEk0T0RabEt6TTRMQ0F0TXk0ME1ESTRNak0wTmpZek9EVXlPRGcyWlNzek9DbGNiaUFnZlZ4dUlDQnBaV1ZsTnpVMExuZHlhWFJsS0dKMVppd2dkbUZzZFdVc0lHOW1abk5sZEN3Z2JHbDBkR3hsUlc1a2FXRnVMQ0F5TXl3Z05DbGNiaUFnY21WMGRYSnVJRzltWm5ObGRDQXJJRFJjYm4xY2JseHVRblZtWm1WeUxuQnliM1J2ZEhsd1pTNTNjbWwwWlVac2IyRjBURVVnUFNCbWRXNWpkR2x2YmlCM2NtbDBaVVpzYjJGMFRFVWdLSFpoYkhWbExDQnZabVp6WlhRc0lHNXZRWE56WlhKMEtTQjdYRzRnSUhKbGRIVnliaUIzY21sMFpVWnNiMkYwS0hSb2FYTXNJSFpoYkhWbExDQnZabVp6WlhRc0lIUnlkV1VzSUc1dlFYTnpaWEowS1Z4dWZWeHVYRzVDZFdabVpYSXVjSEp2ZEc5MGVYQmxMbmR5YVhSbFJteHZZWFJDUlNBOUlHWjFibU4wYVc5dUlIZHlhWFJsUm14dllYUkNSU0FvZG1Gc2RXVXNJRzltWm5ObGRDd2dibTlCYzNObGNuUXBJSHRjYmlBZ2NtVjBkWEp1SUhkeWFYUmxSbXh2WVhRb2RHaHBjeXdnZG1Gc2RXVXNJRzltWm5ObGRDd2dabUZzYzJVc0lHNXZRWE56WlhKMEtWeHVmVnh1WEc1bWRXNWpkR2x2YmlCM2NtbDBaVVJ2ZFdKc1pTQW9ZblZtTENCMllXeDFaU3dnYjJabWMyVjBMQ0JzYVhSMGJHVkZibVJwWVc0c0lHNXZRWE56WlhKMEtTQjdYRzRnSUdsbUlDZ2hibTlCYzNObGNuUXBJSHRjYmlBZ0lDQmphR1ZqYTBsRlJVVTNOVFFvWW5WbUxDQjJZV3gxWlN3Z2IyWm1jMlYwTENBNExDQXhMamM1TnpZNU16RXpORGcyTWpNeE5UZEZLek13T0N3Z0xURXVOemszTmprek1UTTBPRFl5TXpFMU4wVXJNekE0S1Z4dUlDQjlYRzRnSUdsbFpXVTNOVFF1ZDNKcGRHVW9ZblZtTENCMllXeDFaU3dnYjJabWMyVjBMQ0JzYVhSMGJHVkZibVJwWVc0c0lEVXlMQ0E0S1Z4dUlDQnlaWFIxY200Z2IyWm1jMlYwSUNzZ09GeHVmVnh1WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5keWFYUmxSRzkxWW14bFRFVWdQU0JtZFc1amRHbHZiaUIzY21sMFpVUnZkV0pzWlV4RklDaDJZV3gxWlN3Z2IyWm1jMlYwTENCdWIwRnpjMlZ5ZENrZ2UxeHVJQ0J5WlhSMWNtNGdkM0pwZEdWRWIzVmliR1VvZEdocGN5d2dkbUZzZFdVc0lHOW1abk5sZEN3Z2RISjFaU3dnYm05QmMzTmxjblFwWEc1OVhHNWNia0oxWm1abGNpNXdjbTkwYjNSNWNHVXVkM0pwZEdWRWIzVmliR1ZDUlNBOUlHWjFibU4wYVc5dUlIZHlhWFJsUkc5MVlteGxRa1VnS0haaGJIVmxMQ0J2Wm1aelpYUXNJRzV2UVhOelpYSjBLU0I3WEc0Z0lISmxkSFZ5YmlCM2NtbDBaVVJ2ZFdKc1pTaDBhR2x6TENCMllXeDFaU3dnYjJabWMyVjBMQ0JtWVd4elpTd2dibTlCYzNObGNuUXBYRzU5WEc1Y2JpOHZJR052Y0hrb2RHRnlaMlYwUW5WbVptVnlMQ0IwWVhKblpYUlRkR0Z5ZEQwd0xDQnpiM1Z5WTJWVGRHRnlkRDB3TENCemIzVnlZMlZGYm1ROVluVm1abVZ5TG14bGJtZDBhQ2xjYmtKMVptWmxjaTV3Y205MGIzUjVjR1V1WTI5d2VTQTlJR1oxYm1OMGFXOXVJR052Y0hrZ0tIUmhjbWRsZEN3Z2RHRnlaMlYwVTNSaGNuUXNJSE4wWVhKMExDQmxibVFwSUh0Y2JpQWdhV1lnS0NGemRHRnlkQ2tnYzNSaGNuUWdQU0F3WEc0Z0lHbG1JQ2doWlc1a0lDWW1JR1Z1WkNBaFBUMGdNQ2tnWlc1a0lEMGdkR2hwY3k1c1pXNW5kR2hjYmlBZ2FXWWdLSFJoY21kbGRGTjBZWEowSUQ0OUlIUmhjbWRsZEM1c1pXNW5kR2dwSUhSaGNtZGxkRk4wWVhKMElEMGdkR0Z5WjJWMExteGxibWQwYUZ4dUlDQnBaaUFvSVhSaGNtZGxkRk4wWVhKMEtTQjBZWEpuWlhSVGRHRnlkQ0E5SURCY2JpQWdhV1lnS0dWdVpDQStJREFnSmlZZ1pXNWtJRHdnYzNSaGNuUXBJR1Z1WkNBOUlITjBZWEowWEc1Y2JpQWdMeThnUTI5d2VTQXdJR0o1ZEdWek95QjNaU2R5WlNCa2IyNWxYRzRnSUdsbUlDaGxibVFnUFQwOUlITjBZWEowS1NCeVpYUjFjbTRnTUZ4dUlDQnBaaUFvZEdGeVoyVjBMbXhsYm1kMGFDQTlQVDBnTUNCOGZDQjBhR2x6TG14bGJtZDBhQ0E5UFQwZ01Da2djbVYwZFhKdUlEQmNibHh1SUNBdkx5QkdZWFJoYkNCbGNuSnZjaUJqYjI1a2FYUnBiMjV6WEc0Z0lHbG1JQ2gwWVhKblpYUlRkR0Z5ZENBOElEQXBJSHRjYmlBZ0lDQjBhSEp2ZHlCdVpYY2dVbUZ1WjJWRmNuSnZjaWduZEdGeVoyVjBVM1JoY25RZ2IzVjBJRzltSUdKdmRXNWtjeWNwWEc0Z0lIMWNiaUFnYVdZZ0tITjBZWEowSUR3Z01DQjhmQ0J6ZEdGeWRDQStQU0IwYUdsekxteGxibWQwYUNrZ2RHaHliM2NnYm1WM0lGSmhibWRsUlhKeWIzSW9KM052ZFhKalpWTjBZWEowSUc5MWRDQnZaaUJpYjNWdVpITW5LVnh1SUNCcFppQW9aVzVrSUR3Z01Da2dkR2h5YjNjZ2JtVjNJRkpoYm1kbFJYSnliM0lvSjNOdmRYSmpaVVZ1WkNCdmRYUWdiMllnWW05MWJtUnpKeWxjYmx4dUlDQXZMeUJCY21VZ2QyVWdiMjlpUDF4dUlDQnBaaUFvWlc1a0lENGdkR2hwY3k1c1pXNW5kR2dwSUdWdVpDQTlJSFJvYVhNdWJHVnVaM1JvWEc0Z0lHbG1JQ2gwWVhKblpYUXViR1Z1WjNSb0lDMGdkR0Z5WjJWMFUzUmhjblFnUENCbGJtUWdMU0J6ZEdGeWRDa2dlMXh1SUNBZ0lHVnVaQ0E5SUhSaGNtZGxkQzVzWlc1bmRHZ2dMU0IwWVhKblpYUlRkR0Z5ZENBcklITjBZWEowWEc0Z0lIMWNibHh1SUNCMllYSWdiR1Z1SUQwZ1pXNWtJQzBnYzNSaGNuUmNiaUFnZG1GeUlHbGNibHh1SUNCcFppQW9kR2hwY3lBOVBUMGdkR0Z5WjJWMElDWW1JSE4wWVhKMElEd2dkR0Z5WjJWMFUzUmhjblFnSmlZZ2RHRnlaMlYwVTNSaGNuUWdQQ0JsYm1RcElIdGNiaUFnSUNBdkx5QmtaWE5qWlc1a2FXNW5JR052Y0hrZ1puSnZiU0JsYm1SY2JpQWdJQ0JtYjNJZ0tHa2dQU0JzWlc0Z0xTQXhPeUJwSUQ0OUlEQTdJR2t0TFNrZ2UxeHVJQ0FnSUNBZ2RHRnlaMlYwVzJrZ0t5QjBZWEpuWlhSVGRHRnlkRjBnUFNCMGFHbHpXMmtnS3lCemRHRnlkRjFjYmlBZ0lDQjlYRzRnSUgwZ1pXeHpaU0JwWmlBb2JHVnVJRHdnTVRBd01DQjhmQ0FoUW5WbVptVnlMbFJaVUVWRVgwRlNVa0ZaWDFOVlVGQlBVbFFwSUh0Y2JpQWdJQ0F2THlCaGMyTmxibVJwYm1jZ1kyOXdlU0JtY205dElITjBZWEowWEc0Z0lDQWdabTl5SUNocElEMGdNRHNnYVNBOElHeGxianNnYVNzcktTQjdYRzRnSUNBZ0lDQjBZWEpuWlhSYmFTQXJJSFJoY21kbGRGTjBZWEowWFNBOUlIUm9hWE5iYVNBcklITjBZWEowWFZ4dUlDQWdJSDFjYmlBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0IwWVhKblpYUXVYM05sZENoMGFHbHpMbk4xWW1GeWNtRjVLSE4wWVhKMExDQnpkR0Z5ZENBcklHeGxiaWtzSUhSaGNtZGxkRk4wWVhKMEtWeHVJQ0I5WEc1Y2JpQWdjbVYwZFhKdUlHeGxibHh1ZlZ4dVhHNHZMeUJtYVd4c0tIWmhiSFZsTENCemRHRnlkRDB3TENCbGJtUTlZblZtWm1WeUxteGxibWQwYUNsY2JrSjFabVpsY2k1d2NtOTBiM1I1Y0dVdVptbHNiQ0E5SUdaMWJtTjBhVzl1SUdacGJHd2dLSFpoYkhWbExDQnpkR0Z5ZEN3Z1pXNWtLU0I3WEc0Z0lHbG1JQ2doZG1Gc2RXVXBJSFpoYkhWbElEMGdNRnh1SUNCcFppQW9JWE4wWVhKMEtTQnpkR0Z5ZENBOUlEQmNiaUFnYVdZZ0tDRmxibVFwSUdWdVpDQTlJSFJvYVhNdWJHVnVaM1JvWEc1Y2JpQWdhV1lnS0dWdVpDQThJSE4wWVhKMEtTQjBhSEp2ZHlCdVpYY2dVbUZ1WjJWRmNuSnZjaWduWlc1a0lEd2djM1JoY25RbktWeHVYRzRnSUM4dklFWnBiR3dnTUNCaWVYUmxjenNnZDJVbmNtVWdaRzl1WlZ4dUlDQnBaaUFvWlc1a0lEMDlQU0J6ZEdGeWRDa2djbVYwZFhKdVhHNGdJR2xtSUNoMGFHbHpMbXhsYm1kMGFDQTlQVDBnTUNrZ2NtVjBkWEp1WEc1Y2JpQWdhV1lnS0hOMFlYSjBJRHdnTUNCOGZDQnpkR0Z5ZENBK1BTQjBhR2x6TG14bGJtZDBhQ2tnZEdoeWIzY2dibVYzSUZKaGJtZGxSWEp5YjNJb0ozTjBZWEowSUc5MWRDQnZaaUJpYjNWdVpITW5LVnh1SUNCcFppQW9aVzVrSUR3Z01DQjhmQ0JsYm1RZ1BpQjBhR2x6TG14bGJtZDBhQ2tnZEdoeWIzY2dibVYzSUZKaGJtZGxSWEp5YjNJb0oyVnVaQ0J2ZFhRZ2IyWWdZbTkxYm1Sekp5bGNibHh1SUNCMllYSWdhVnh1SUNCcFppQW9kSGx3Wlc5bUlIWmhiSFZsSUQwOVBTQW5iblZ0WW1WeUp5a2dlMXh1SUNBZ0lHWnZjaUFvYVNBOUlITjBZWEowT3lCcElEd2daVzVrT3lCcEt5c3BJSHRjYmlBZ0lDQWdJSFJvYVhOYmFWMGdQU0IyWVd4MVpWeHVJQ0FnSUgxY2JpQWdmU0JsYkhObElIdGNiaUFnSUNCMllYSWdZbmwwWlhNZ1BTQjFkR1k0Vkc5Q2VYUmxjeWgyWVd4MVpTNTBiMU4wY21sdVp5Z3BLVnh1SUNBZ0lIWmhjaUJzWlc0Z1BTQmllWFJsY3k1c1pXNW5kR2hjYmlBZ0lDQm1iM0lnS0drZ1BTQnpkR0Z5ZERzZ2FTQThJR1Z1WkRzZ2FTc3JLU0I3WEc0Z0lDQWdJQ0IwYUdselcybGRJRDBnWW5sMFpYTmJhU0FsSUd4bGJsMWNiaUFnSUNCOVhHNGdJSDFjYmx4dUlDQnlaWFIxY200Z2RHaHBjMXh1ZlZ4dVhHNHZLaXBjYmlBcUlFTnlaV0YwWlhNZ1lTQnVaWGNnWUVGeWNtRjVRblZtWm1WeVlDQjNhWFJvSUhSb1pTQXFZMjl3YVdWa0tpQnRaVzF2Y25rZ2IyWWdkR2hsSUdKMVptWmxjaUJwYm5OMFlXNWpaUzVjYmlBcUlFRmtaR1ZrSUdsdUlFNXZaR1VnTUM0eE1pNGdUMjVzZVNCaGRtRnBiR0ZpYkdVZ2FXNGdZbkp2ZDNObGNuTWdkR2hoZENCemRYQndiM0owSUVGeWNtRjVRblZtWm1WeUxseHVJQ292WEc1Q2RXWm1aWEl1Y0hKdmRHOTBlWEJsTG5SdlFYSnlZWGxDZFdabVpYSWdQU0JtZFc1amRHbHZiaUIwYjBGeWNtRjVRblZtWm1WeUlDZ3BJSHRjYmlBZ2FXWWdLSFI1Y0dWdlppQlZhVzUwT0VGeWNtRjVJQ0U5UFNBbmRXNWtaV1pwYm1Wa0p5a2dlMXh1SUNBZ0lHbG1JQ2hDZFdabVpYSXVWRmxRUlVSZlFWSlNRVmxmVTFWUVVFOVNWQ2tnZTF4dUlDQWdJQ0FnY21WMGRYSnVJQ2h1WlhjZ1FuVm1abVZ5S0hSb2FYTXBLUzVpZFdabVpYSmNiaUFnSUNCOUlHVnNjMlVnZTF4dUlDQWdJQ0FnZG1GeUlHSjFaaUE5SUc1bGR5QlZhVzUwT0VGeWNtRjVLSFJvYVhNdWJHVnVaM1JvS1Z4dUlDQWdJQ0FnWm05eUlDaDJZWElnYVNBOUlEQXNJR3hsYmlBOUlHSjFaaTVzWlc1bmRHZzdJR2tnUENCc1pXNDdJR2tnS3owZ01Ta2dlMXh1SUNBZ0lDQWdJQ0JpZFdaYmFWMGdQU0IwYUdselcybGRYRzRnSUNBZ0lDQjlYRzRnSUNBZ0lDQnlaWFIxY200Z1luVm1MbUoxWm1abGNseHVJQ0FnSUgxY2JpQWdmU0JsYkhObElIdGNiaUFnSUNCMGFISnZkeUJ1WlhjZ1ZIbHdaVVZ5Y205eUtDZENkV1ptWlhJdWRHOUJjbkpoZVVKMVptWmxjaUJ1YjNRZ2MzVndjRzl5ZEdWa0lHbHVJSFJvYVhNZ1luSnZkM05sY2ljcFhHNGdJSDFjYm4xY2JseHVMeThnU0VWTVVFVlNJRVpWVGtOVVNVOU9VMXh1THk4Z1BUMDlQVDA5UFQwOVBUMDlQVDA5UFZ4dVhHNTJZWElnUWxBZ1BTQkNkV1ptWlhJdWNISnZkRzkwZVhCbFhHNWNiaThxS2x4dUlDb2dRWFZuYldWdWRDQmhJRlZwYm5RNFFYSnlZWGtnS21sdWMzUmhibU5sS2lBb2JtOTBJSFJvWlNCVmFXNTBPRUZ5Y21GNUlHTnNZWE56SVNrZ2QybDBhQ0JDZFdabVpYSWdiV1YwYUc5a2MxeHVJQ292WEc1Q2RXWm1aWEl1WDJGMVoyMWxiblFnUFNCbWRXNWpkR2x2YmlCZllYVm5iV1Z1ZENBb1lYSnlLU0I3WEc0Z0lHRnljaTVqYjI1emRISjFZM1J2Y2lBOUlFSjFabVpsY2x4dUlDQmhjbkl1WDJselFuVm1abVZ5SUQwZ2RISjFaVnh1WEc0Z0lDOHZJSE5oZG1VZ2NtVm1aWEpsYm1ObElIUnZJRzl5YVdkcGJtRnNJRlZwYm5RNFFYSnlZWGtnYzJWMElHMWxkR2h2WkNCaVpXWnZjbVVnYjNabGNuZHlhWFJwYm1kY2JpQWdZWEp5TGw5elpYUWdQU0JoY25JdWMyVjBYRzVjYmlBZ0x5OGdaR1Z3Y21WallYUmxaRnh1SUNCaGNuSXVaMlYwSUQwZ1FsQXVaMlYwWEc0Z0lHRnljaTV6WlhRZ1BTQkNVQzV6WlhSY2JseHVJQ0JoY25JdWQzSnBkR1VnUFNCQ1VDNTNjbWwwWlZ4dUlDQmhjbkl1ZEc5VGRISnBibWNnUFNCQ1VDNTBiMU4wY21sdVoxeHVJQ0JoY25JdWRHOU1iMk5oYkdWVGRISnBibWNnUFNCQ1VDNTBiMU4wY21sdVoxeHVJQ0JoY25JdWRHOUtVMDlPSUQwZ1FsQXVkRzlLVTA5T1hHNGdJR0Z5Y2k1bGNYVmhiSE1nUFNCQ1VDNWxjWFZoYkhOY2JpQWdZWEp5TG1OdmJYQmhjbVVnUFNCQ1VDNWpiMjF3WVhKbFhHNGdJR0Z5Y2k1cGJtUmxlRTltSUQwZ1FsQXVhVzVrWlhoUFpseHVJQ0JoY25JdVkyOXdlU0E5SUVKUUxtTnZjSGxjYmlBZ1lYSnlMbk5zYVdObElEMGdRbEF1YzJ4cFkyVmNiaUFnWVhKeUxuSmxZV1JWU1c1MFRFVWdQU0JDVUM1eVpXRmtWVWx1ZEV4RlhHNGdJR0Z5Y2k1eVpXRmtWVWx1ZEVKRklEMGdRbEF1Y21WaFpGVkpiblJDUlZ4dUlDQmhjbkl1Y21WaFpGVkpiblE0SUQwZ1FsQXVjbVZoWkZWSmJuUTRYRzRnSUdGeWNpNXlaV0ZrVlVsdWRERTJURVVnUFNCQ1VDNXlaV0ZrVlVsdWRERTJURVZjYmlBZ1lYSnlMbkpsWVdSVlNXNTBNVFpDUlNBOUlFSlFMbkpsWVdSVlNXNTBNVFpDUlZ4dUlDQmhjbkl1Y21WaFpGVkpiblF6TWt4RklEMGdRbEF1Y21WaFpGVkpiblF6TWt4RlhHNGdJR0Z5Y2k1eVpXRmtWVWx1ZERNeVFrVWdQU0JDVUM1eVpXRmtWVWx1ZERNeVFrVmNiaUFnWVhKeUxuSmxZV1JKYm5STVJTQTlJRUpRTG5KbFlXUkpiblJNUlZ4dUlDQmhjbkl1Y21WaFpFbHVkRUpGSUQwZ1FsQXVjbVZoWkVsdWRFSkZYRzRnSUdGeWNpNXlaV0ZrU1c1ME9DQTlJRUpRTG5KbFlXUkpiblE0WEc0Z0lHRnljaTV5WldGa1NXNTBNVFpNUlNBOUlFSlFMbkpsWVdSSmJuUXhOa3hGWEc0Z0lHRnljaTV5WldGa1NXNTBNVFpDUlNBOUlFSlFMbkpsWVdSSmJuUXhOa0pGWEc0Z0lHRnljaTV5WldGa1NXNTBNekpNUlNBOUlFSlFMbkpsWVdSSmJuUXpNa3hGWEc0Z0lHRnljaTV5WldGa1NXNTBNekpDUlNBOUlFSlFMbkpsWVdSSmJuUXpNa0pGWEc0Z0lHRnljaTV5WldGa1JteHZZWFJNUlNBOUlFSlFMbkpsWVdSR2JHOWhkRXhGWEc0Z0lHRnljaTV5WldGa1JteHZZWFJDUlNBOUlFSlFMbkpsWVdSR2JHOWhkRUpGWEc0Z0lHRnljaTV5WldGa1JHOTFZbXhsVEVVZ1BTQkNVQzV5WldGa1JHOTFZbXhsVEVWY2JpQWdZWEp5TG5KbFlXUkViM1ZpYkdWQ1JTQTlJRUpRTG5KbFlXUkViM1ZpYkdWQ1JWeHVJQ0JoY25JdWQzSnBkR1ZWU1c1ME9DQTlJRUpRTG5keWFYUmxWVWx1ZERoY2JpQWdZWEp5TG5keWFYUmxWVWx1ZEV4RklEMGdRbEF1ZDNKcGRHVlZTVzUwVEVWY2JpQWdZWEp5TG5keWFYUmxWVWx1ZEVKRklEMGdRbEF1ZDNKcGRHVlZTVzUwUWtWY2JpQWdZWEp5TG5keWFYUmxWVWx1ZERFMlRFVWdQU0JDVUM1M2NtbDBaVlZKYm5ReE5reEZYRzRnSUdGeWNpNTNjbWwwWlZWSmJuUXhOa0pGSUQwZ1FsQXVkM0pwZEdWVlNXNTBNVFpDUlZ4dUlDQmhjbkl1ZDNKcGRHVlZTVzUwTXpKTVJTQTlJRUpRTG5keWFYUmxWVWx1ZERNeVRFVmNiaUFnWVhKeUxuZHlhWFJsVlVsdWRETXlRa1VnUFNCQ1VDNTNjbWwwWlZWSmJuUXpNa0pGWEc0Z0lHRnljaTUzY21sMFpVbHVkRXhGSUQwZ1FsQXVkM0pwZEdWSmJuUk1SVnh1SUNCaGNuSXVkM0pwZEdWSmJuUkNSU0E5SUVKUUxuZHlhWFJsU1c1MFFrVmNiaUFnWVhKeUxuZHlhWFJsU1c1ME9DQTlJRUpRTG5keWFYUmxTVzUwT0Z4dUlDQmhjbkl1ZDNKcGRHVkpiblF4Tmt4RklEMGdRbEF1ZDNKcGRHVkpiblF4Tmt4RlhHNGdJR0Z5Y2k1M2NtbDBaVWx1ZERFMlFrVWdQU0JDVUM1M2NtbDBaVWx1ZERFMlFrVmNiaUFnWVhKeUxuZHlhWFJsU1c1ME16Sk1SU0E5SUVKUUxuZHlhWFJsU1c1ME16Sk1SVnh1SUNCaGNuSXVkM0pwZEdWSmJuUXpNa0pGSUQwZ1FsQXVkM0pwZEdWSmJuUXpNa0pGWEc0Z0lHRnljaTUzY21sMFpVWnNiMkYwVEVVZ1BTQkNVQzUzY21sMFpVWnNiMkYwVEVWY2JpQWdZWEp5TG5keWFYUmxSbXh2WVhSQ1JTQTlJRUpRTG5keWFYUmxSbXh2WVhSQ1JWeHVJQ0JoY25JdWQzSnBkR1ZFYjNWaWJHVk1SU0E5SUVKUUxuZHlhWFJsUkc5MVlteGxURVZjYmlBZ1lYSnlMbmR5YVhSbFJHOTFZbXhsUWtVZ1BTQkNVQzUzY21sMFpVUnZkV0pzWlVKRlhHNGdJR0Z5Y2k1bWFXeHNJRDBnUWxBdVptbHNiRnh1SUNCaGNuSXVhVzV6Y0dWamRDQTlJRUpRTG1sdWMzQmxZM1JjYmlBZ1lYSnlMblJ2UVhKeVlYbENkV1ptWlhJZ1BTQkNVQzUwYjBGeWNtRjVRblZtWm1WeVhHNWNiaUFnY21WMGRYSnVJR0Z5Y2x4dWZWeHVYRzUyWVhJZ1NVNVdRVXhKUkY5Q1FWTkZOalJmVWtVZ1BTQXZXMTRyWEZ3dk1DMDVRUzFhWVMxNkxWOWRMMmRjYmx4dVpuVnVZM1JwYjI0Z1ltRnpaVFkwWTJ4bFlXNGdLSE4wY2lrZ2UxeHVJQ0F2THlCT2IyUmxJSE4wY21sd2N5QnZkWFFnYVc1MllXeHBaQ0JqYUdGeVlXTjBaWEp6SUd4cGEyVWdYRnh1SUdGdVpDQmNYSFFnWm5KdmJTQjBhR1VnYzNSeWFXNW5MQ0JpWVhObE5qUXRhbk1nWkc5bGN5QnViM1JjYmlBZ2MzUnlJRDBnYzNSeWFXNW5kSEpwYlNoemRISXBMbkpsY0d4aFkyVW9TVTVXUVV4SlJGOUNRVk5GTmpSZlVrVXNJQ2NuS1Z4dUlDQXZMeUJPYjJSbElHTnZiblpsY25SeklITjBjbWx1WjNNZ2QybDBhQ0JzWlc1bmRHZ2dQQ0F5SUhSdklDY25YRzRnSUdsbUlDaHpkSEl1YkdWdVozUm9JRHdnTWlrZ2NtVjBkWEp1SUNjblhHNGdJQzh2SUU1dlpHVWdZV3hzYjNkeklHWnZjaUJ1YjI0dGNHRmtaR1ZrSUdKaGMyVTJOQ0J6ZEhKcGJtZHpJQ2h0YVhOemFXNW5JSFJ5WVdsc2FXNW5JRDA5UFNrc0lHSmhjMlUyTkMxcWN5QmtiMlZ6SUc1dmRGeHVJQ0IzYUdsc1pTQW9jM1J5TG14bGJtZDBhQ0FsSURRZ0lUMDlJREFwSUh0Y2JpQWdJQ0J6ZEhJZ1BTQnpkSElnS3lBblBTZGNiaUFnZlZ4dUlDQnlaWFIxY200Z2MzUnlYRzU5WEc1Y2JtWjFibU4wYVc5dUlITjBjbWx1WjNSeWFXMGdLSE4wY2lrZ2UxeHVJQ0JwWmlBb2MzUnlMblJ5YVcwcElISmxkSFZ5YmlCemRISXVkSEpwYlNncFhHNGdJSEpsZEhWeWJpQnpkSEl1Y21Wd2JHRmpaU2d2WGx4Y2N5dDhYRnh6S3lRdlp5d2dKeWNwWEc1OVhHNWNibVoxYm1OMGFXOXVJSFJ2U0dWNElDaHVLU0I3WEc0Z0lHbG1JQ2h1SUR3Z01UWXBJSEpsZEhWeWJpQW5NQ2NnS3lCdUxuUnZVM1J5YVc1bktERTJLVnh1SUNCeVpYUjFjbTRnYmk1MGIxTjBjbWx1WnlneE5pbGNibjFjYmx4dVpuVnVZM1JwYjI0Z2RYUm1PRlJ2UW5sMFpYTWdLSE4wY21sdVp5d2dkVzVwZEhNcElIdGNiaUFnZFc1cGRITWdQU0IxYm1sMGN5QjhmQ0JKYm1acGJtbDBlVnh1SUNCMllYSWdZMjlrWlZCdmFXNTBYRzRnSUhaaGNpQnNaVzVuZEdnZ1BTQnpkSEpwYm1jdWJHVnVaM1JvWEc0Z0lIWmhjaUJzWldGa1UzVnljbTluWVhSbElEMGdiblZzYkZ4dUlDQjJZWElnWW5sMFpYTWdQU0JiWFZ4dVhHNGdJR1p2Y2lBb2RtRnlJR2tnUFNBd095QnBJRHdnYkdWdVozUm9PeUJwS3lzcElIdGNiaUFnSUNCamIyUmxVRzlwYm5RZ1BTQnpkSEpwYm1jdVkyaGhja052WkdWQmRDaHBLVnh1WEc0Z0lDQWdMeThnYVhNZ2MzVnljbTluWVhSbElHTnZiWEJ2Ym1WdWRGeHVJQ0FnSUdsbUlDaGpiMlJsVUc5cGJuUWdQaUF3ZUVRM1JrWWdKaVlnWTI5a1pWQnZhVzUwSUR3Z01IaEZNREF3S1NCN1hHNGdJQ0FnSUNBdkx5QnNZWE4wSUdOb1lYSWdkMkZ6SUdFZ2JHVmhaRnh1SUNBZ0lDQWdhV1lnS0NGc1pXRmtVM1Z5Y205bllYUmxLU0I3WEc0Z0lDQWdJQ0FnSUM4dklHNXZJR3hsWVdRZ2VXVjBYRzRnSUNBZ0lDQWdJR2xtSUNoamIyUmxVRzlwYm5RZ1BpQXdlRVJDUmtZcElIdGNiaUFnSUNBZ0lDQWdJQ0F2THlCMWJtVjRjR1ZqZEdWa0lIUnlZV2xzWEc0Z0lDQWdJQ0FnSUNBZ2FXWWdLQ2gxYm1sMGN5QXRQU0F6S1NBK0lDMHhLU0JpZVhSbGN5NXdkWE5vS0RCNFJVWXNJREI0UWtZc0lEQjRRa1FwWEc0Z0lDQWdJQ0FnSUNBZ1kyOXVkR2x1ZFdWY2JpQWdJQ0FnSUNBZ2ZTQmxiSE5sSUdsbUlDaHBJQ3NnTVNBOVBUMGdiR1Z1WjNSb0tTQjdYRzRnSUNBZ0lDQWdJQ0FnTHk4Z2RXNXdZV2x5WldRZ2JHVmhaRnh1SUNBZ0lDQWdJQ0FnSUdsbUlDZ29kVzVwZEhNZ0xUMGdNeWtnUGlBdE1Ta2dZbmwwWlhNdWNIVnphQ2d3ZUVWR0xDQXdlRUpHTENBd2VFSkVLVnh1SUNBZ0lDQWdJQ0FnSUdOdmJuUnBiblZsWEc0Z0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQXZMeUIyWVd4cFpDQnNaV0ZrWEc0Z0lDQWdJQ0FnSUd4bFlXUlRkWEp5YjJkaGRHVWdQU0JqYjJSbFVHOXBiblJjYmx4dUlDQWdJQ0FnSUNCamIyNTBhVzUxWlZ4dUlDQWdJQ0FnZlZ4dVhHNGdJQ0FnSUNBdkx5QXlJR3hsWVdSeklHbHVJR0VnY205M1hHNGdJQ0FnSUNCcFppQW9ZMjlrWlZCdmFXNTBJRHdnTUhoRVF6QXdLU0I3WEc0Z0lDQWdJQ0FnSUdsbUlDZ29kVzVwZEhNZ0xUMGdNeWtnUGlBdE1Ta2dZbmwwWlhNdWNIVnphQ2d3ZUVWR0xDQXdlRUpHTENBd2VFSkVLVnh1SUNBZ0lDQWdJQ0JzWldGa1UzVnljbTluWVhSbElEMGdZMjlrWlZCdmFXNTBYRzRnSUNBZ0lDQWdJR052Ym5ScGJuVmxYRzRnSUNBZ0lDQjlYRzVjYmlBZ0lDQWdJQzh2SUhaaGJHbGtJSE4xY25KdloyRjBaU0J3WVdseVhHNGdJQ0FnSUNCamIyUmxVRzlwYm5RZ1BTQnNaV0ZrVTNWeWNtOW5ZWFJsSUMwZ01IaEVPREF3SUR3OElERXdJSHdnWTI5a1pWQnZhVzUwSUMwZ01IaEVRekF3SUh3Z01IZ3hNREF3TUZ4dUlDQWdJSDBnWld4elpTQnBaaUFvYkdWaFpGTjFjbkp2WjJGMFpTa2dlMXh1SUNBZ0lDQWdMeThnZG1Gc2FXUWdZbTF3SUdOb1lYSXNJR0oxZENCc1lYTjBJR05vWVhJZ2QyRnpJR0VnYkdWaFpGeHVJQ0FnSUNBZ2FXWWdLQ2gxYm1sMGN5QXRQU0F6S1NBK0lDMHhLU0JpZVhSbGN5NXdkWE5vS0RCNFJVWXNJREI0UWtZc0lEQjRRa1FwWEc0Z0lDQWdmVnh1WEc0Z0lDQWdiR1ZoWkZOMWNuSnZaMkYwWlNBOUlHNTFiR3hjYmx4dUlDQWdJQzh2SUdWdVkyOWtaU0IxZEdZNFhHNGdJQ0FnYVdZZ0tHTnZaR1ZRYjJsdWRDQThJREI0T0RBcElIdGNiaUFnSUNBZ0lHbG1JQ2dvZFc1cGRITWdMVDBnTVNrZ1BDQXdLU0JpY21WaGExeHVJQ0FnSUNBZ1lubDBaWE11Y0hWemFDaGpiMlJsVUc5cGJuUXBYRzRnSUNBZ2ZTQmxiSE5sSUdsbUlDaGpiMlJsVUc5cGJuUWdQQ0F3ZURnd01Da2dlMXh1SUNBZ0lDQWdhV1lnS0NoMWJtbDBjeUF0UFNBeUtTQThJREFwSUdKeVpXRnJYRzRnSUNBZ0lDQmllWFJsY3k1d2RYTm9LRnh1SUNBZ0lDQWdJQ0JqYjJSbFVHOXBiblFnUGo0Z01IZzJJSHdnTUhoRE1DeGNiaUFnSUNBZ0lDQWdZMjlrWlZCdmFXNTBJQ1lnTUhnelJpQjhJREI0T0RCY2JpQWdJQ0FnSUNsY2JpQWdJQ0I5SUdWc2MyVWdhV1lnS0dOdlpHVlFiMmx1ZENBOElEQjRNVEF3TURBcElIdGNiaUFnSUNBZ0lHbG1JQ2dvZFc1cGRITWdMVDBnTXlrZ1BDQXdLU0JpY21WaGExeHVJQ0FnSUNBZ1lubDBaWE11Y0hWemFDaGNiaUFnSUNBZ0lDQWdZMjlrWlZCdmFXNTBJRDQrSURCNFF5QjhJREI0UlRBc1hHNGdJQ0FnSUNBZ0lHTnZaR1ZRYjJsdWRDQStQaUF3ZURZZ0ppQXdlRE5HSUh3Z01IZzRNQ3hjYmlBZ0lDQWdJQ0FnWTI5a1pWQnZhVzUwSUNZZ01IZ3pSaUI4SURCNE9EQmNiaUFnSUNBZ0lDbGNiaUFnSUNCOUlHVnNjMlVnYVdZZ0tHTnZaR1ZRYjJsdWRDQThJREI0TVRFd01EQXdLU0I3WEc0Z0lDQWdJQ0JwWmlBb0tIVnVhWFJ6SUMwOUlEUXBJRHdnTUNrZ1luSmxZV3RjYmlBZ0lDQWdJR0o1ZEdWekxuQjFjMmdvWEc0Z0lDQWdJQ0FnSUdOdlpHVlFiMmx1ZENBK1BpQXdlREV5SUh3Z01IaEdNQ3hjYmlBZ0lDQWdJQ0FnWTI5a1pWQnZhVzUwSUQ0K0lEQjRReUFtSURCNE0wWWdmQ0F3ZURnd0xGeHVJQ0FnSUNBZ0lDQmpiMlJsVUc5cGJuUWdQajRnTUhnMklDWWdNSGd6UmlCOElEQjRPREFzWEc0Z0lDQWdJQ0FnSUdOdlpHVlFiMmx1ZENBbUlEQjRNMFlnZkNBd2VEZ3dYRzRnSUNBZ0lDQXBYRzRnSUNBZ2ZTQmxiSE5sSUh0Y2JpQWdJQ0FnSUhSb2NtOTNJRzVsZHlCRmNuSnZjaWduU1c1MllXeHBaQ0JqYjJSbElIQnZhVzUwSnlsY2JpQWdJQ0I5WEc0Z0lIMWNibHh1SUNCeVpYUjFjbTRnWW5sMFpYTmNibjFjYmx4dVpuVnVZM1JwYjI0Z1lYTmphV2xVYjBKNWRHVnpJQ2h6ZEhJcElIdGNiaUFnZG1GeUlHSjVkR1ZCY25KaGVTQTlJRnRkWEc0Z0lHWnZjaUFvZG1GeUlHa2dQU0F3T3lCcElEd2djM1J5TG14bGJtZDBhRHNnYVNzcktTQjdYRzRnSUNBZ0x5OGdUbTlrWlNkeklHTnZaR1VnYzJWbGJYTWdkRzhnWW1VZ1pHOXBibWNnZEdocGN5QmhibVFnYm05MElDWWdNSGczUmk0dVhHNGdJQ0FnWW5sMFpVRnljbUY1TG5CMWMyZ29jM1J5TG1Ob1lYSkRiMlJsUVhRb2FTa2dKaUF3ZUVaR0tWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCaWVYUmxRWEp5WVhsY2JuMWNibHh1Wm5WdVkzUnBiMjRnZFhSbU1UWnNaVlJ2UW5sMFpYTWdLSE4wY2l3Z2RXNXBkSE1wSUh0Y2JpQWdkbUZ5SUdNc0lHaHBMQ0JzYjF4dUlDQjJZWElnWW5sMFpVRnljbUY1SUQwZ1cxMWNiaUFnWm05eUlDaDJZWElnYVNBOUlEQTdJR2tnUENCemRISXViR1Z1WjNSb095QnBLeXNwSUh0Y2JpQWdJQ0JwWmlBb0tIVnVhWFJ6SUMwOUlESXBJRHdnTUNrZ1luSmxZV3RjYmx4dUlDQWdJR01nUFNCemRISXVZMmhoY2tOdlpHVkJkQ2hwS1Z4dUlDQWdJR2hwSUQwZ1l5QStQaUE0WEc0Z0lDQWdiRzhnUFNCaklDVWdNalUyWEc0Z0lDQWdZbmwwWlVGeWNtRjVMbkIxYzJnb2JHOHBYRzRnSUNBZ1lubDBaVUZ5Y21GNUxuQjFjMmdvYUdrcFhHNGdJSDFjYmx4dUlDQnlaWFIxY200Z1lubDBaVUZ5Y21GNVhHNTlYRzVjYm1aMWJtTjBhVzl1SUdKaGMyVTJORlJ2UW5sMFpYTWdLSE4wY2lrZ2UxeHVJQ0J5WlhSMWNtNGdZbUZ6WlRZMExuUnZRbmwwWlVGeWNtRjVLR0poYzJVMk5HTnNaV0Z1S0hOMGNpa3BYRzU5WEc1Y2JtWjFibU4wYVc5dUlHSnNhWFJDZFdabVpYSWdLSE55WXl3Z1pITjBMQ0J2Wm1aelpYUXNJR3hsYm1kMGFDa2dlMXh1SUNCbWIzSWdLSFpoY2lCcElEMGdNRHNnYVNBOElHeGxibWQwYURzZ2FTc3JLU0I3WEc0Z0lDQWdhV1lnS0NocElDc2diMlptYzJWMElENDlJR1J6ZEM1c1pXNW5kR2dwSUh4OElDaHBJRDQ5SUhOeVl5NXNaVzVuZEdncEtTQmljbVZoYTF4dUlDQWdJR1J6ZEZ0cElDc2diMlptYzJWMFhTQTlJSE55WTF0cFhWeHVJQ0I5WEc0Z0lISmxkSFZ5YmlCcFhHNTlYRzRpWFgwPSIsInZhciBsb29rdXAgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLyc7XG5cbjsoZnVuY3Rpb24gKGV4cG9ydHMpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG4gIHZhciBBcnIgPSAodHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnKVxuICAgID8gVWludDhBcnJheVxuICAgIDogQXJyYXlcblxuXHR2YXIgUExVUyAgID0gJysnLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIICA9ICcvJy5jaGFyQ29kZUF0KDApXG5cdHZhciBOVU1CRVIgPSAnMCcuY2hhckNvZGVBdCgwKVxuXHR2YXIgTE9XRVIgID0gJ2EnLmNoYXJDb2RlQXQoMClcblx0dmFyIFVQUEVSICA9ICdBJy5jaGFyQ29kZUF0KDApXG5cdHZhciBQTFVTX1VSTF9TQUZFID0gJy0nLmNoYXJDb2RlQXQoMClcblx0dmFyIFNMQVNIX1VSTF9TQUZFID0gJ18nLmNoYXJDb2RlQXQoMClcblxuXHRmdW5jdGlvbiBkZWNvZGUgKGVsdCkge1xuXHRcdHZhciBjb2RlID0gZWx0LmNoYXJDb2RlQXQoMClcblx0XHRpZiAoY29kZSA9PT0gUExVUyB8fFxuXHRcdCAgICBjb2RlID09PSBQTFVTX1VSTF9TQUZFKVxuXHRcdFx0cmV0dXJuIDYyIC8vICcrJ1xuXHRcdGlmIChjb2RlID09PSBTTEFTSCB8fFxuXHRcdCAgICBjb2RlID09PSBTTEFTSF9VUkxfU0FGRSlcblx0XHRcdHJldHVybiA2MyAvLyAnLydcblx0XHRpZiAoY29kZSA8IE5VTUJFUilcblx0XHRcdHJldHVybiAtMSAvL25vIG1hdGNoXG5cdFx0aWYgKGNvZGUgPCBOVU1CRVIgKyAxMClcblx0XHRcdHJldHVybiBjb2RlIC0gTlVNQkVSICsgMjYgKyAyNlxuXHRcdGlmIChjb2RlIDwgVVBQRVIgKyAyNilcblx0XHRcdHJldHVybiBjb2RlIC0gVVBQRVJcblx0XHRpZiAoY29kZSA8IExPV0VSICsgMjYpXG5cdFx0XHRyZXR1cm4gY29kZSAtIExPV0VSICsgMjZcblx0fVxuXG5cdGZ1bmN0aW9uIGI2NFRvQnl0ZUFycmF5IChiNjQpIHtcblx0XHR2YXIgaSwgaiwgbCwgdG1wLCBwbGFjZUhvbGRlcnMsIGFyclxuXG5cdFx0aWYgKGI2NC5sZW5ndGggJSA0ID4gMCkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0Jylcblx0XHR9XG5cblx0XHQvLyB0aGUgbnVtYmVyIG9mIGVxdWFsIHNpZ25zIChwbGFjZSBob2xkZXJzKVxuXHRcdC8vIGlmIHRoZXJlIGFyZSB0d28gcGxhY2Vob2xkZXJzLCB0aGFuIHRoZSB0d28gY2hhcmFjdGVycyBiZWZvcmUgaXRcblx0XHQvLyByZXByZXNlbnQgb25lIGJ5dGVcblx0XHQvLyBpZiB0aGVyZSBpcyBvbmx5IG9uZSwgdGhlbiB0aGUgdGhyZWUgY2hhcmFjdGVycyBiZWZvcmUgaXQgcmVwcmVzZW50IDIgYnl0ZXNcblx0XHQvLyB0aGlzIGlzIGp1c3QgYSBjaGVhcCBoYWNrIHRvIG5vdCBkbyBpbmRleE9mIHR3aWNlXG5cdFx0dmFyIGxlbiA9IGI2NC5sZW5ndGhcblx0XHRwbGFjZUhvbGRlcnMgPSAnPScgPT09IGI2NC5jaGFyQXQobGVuIC0gMikgPyAyIDogJz0nID09PSBiNjQuY2hhckF0KGxlbiAtIDEpID8gMSA6IDBcblxuXHRcdC8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuXHRcdGFyciA9IG5ldyBBcnIoYjY0Lmxlbmd0aCAqIDMgLyA0IC0gcGxhY2VIb2xkZXJzKVxuXG5cdFx0Ly8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuXHRcdGwgPSBwbGFjZUhvbGRlcnMgPiAwID8gYjY0Lmxlbmd0aCAtIDQgOiBiNjQubGVuZ3RoXG5cblx0XHR2YXIgTCA9IDBcblxuXHRcdGZ1bmN0aW9uIHB1c2ggKHYpIHtcblx0XHRcdGFycltMKytdID0gdlxuXHRcdH1cblxuXHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbDsgaSArPSA0LCBqICs9IDMpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTgpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgMTIpIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAyKSkgPDwgNikgfCBkZWNvZGUoYjY0LmNoYXJBdChpICsgMykpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDAwMCkgPj4gMTYpXG5cdFx0XHRwdXNoKCh0bXAgJiAweEZGMDApID4+IDgpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fVxuXG5cdFx0aWYgKHBsYWNlSG9sZGVycyA9PT0gMikge1xuXHRcdFx0dG1wID0gKGRlY29kZShiNjQuY2hhckF0KGkpKSA8PCAyKSB8IChkZWNvZGUoYjY0LmNoYXJBdChpICsgMSkpID4+IDQpXG5cdFx0XHRwdXNoKHRtcCAmIDB4RkYpXG5cdFx0fSBlbHNlIGlmIChwbGFjZUhvbGRlcnMgPT09IDEpIHtcblx0XHRcdHRtcCA9IChkZWNvZGUoYjY0LmNoYXJBdChpKSkgPDwgMTApIHwgKGRlY29kZShiNjQuY2hhckF0KGkgKyAxKSkgPDwgNCkgfCAoZGVjb2RlKGI2NC5jaGFyQXQoaSArIDIpKSA+PiAyKVxuXHRcdFx0cHVzaCgodG1wID4+IDgpICYgMHhGRilcblx0XHRcdHB1c2godG1wICYgMHhGRilcblx0XHR9XG5cblx0XHRyZXR1cm4gYXJyXG5cdH1cblxuXHRmdW5jdGlvbiB1aW50OFRvQmFzZTY0ICh1aW50OCkge1xuXHRcdHZhciBpLFxuXHRcdFx0ZXh0cmFCeXRlcyA9IHVpbnQ4Lmxlbmd0aCAlIDMsIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG5cdFx0XHRvdXRwdXQgPSBcIlwiLFxuXHRcdFx0dGVtcCwgbGVuZ3RoXG5cblx0XHRmdW5jdGlvbiBlbmNvZGUgKG51bSkge1xuXHRcdFx0cmV0dXJuIGxvb2t1cC5jaGFyQXQobnVtKVxuXHRcdH1cblxuXHRcdGZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG5cdFx0XHRyZXR1cm4gZW5jb2RlKG51bSA+PiAxOCAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiAxMiAmIDB4M0YpICsgZW5jb2RlKG51bSA+PiA2ICYgMHgzRikgKyBlbmNvZGUobnVtICYgMHgzRilcblx0XHR9XG5cblx0XHQvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG5cdFx0Zm9yIChpID0gMCwgbGVuZ3RoID0gdWludDgubGVuZ3RoIC0gZXh0cmFCeXRlczsgaSA8IGxlbmd0aDsgaSArPSAzKSB7XG5cdFx0XHR0ZW1wID0gKHVpbnQ4W2ldIDw8IDE2KSArICh1aW50OFtpICsgMV0gPDwgOCkgKyAodWludDhbaSArIDJdKVxuXHRcdFx0b3V0cHV0ICs9IHRyaXBsZXRUb0Jhc2U2NCh0ZW1wKVxuXHRcdH1cblxuXHRcdC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcblx0XHRzd2l0Y2ggKGV4dHJhQnl0ZXMpIHtcblx0XHRcdGNhc2UgMTpcblx0XHRcdFx0dGVtcCA9IHVpbnQ4W3VpbnQ4Lmxlbmd0aCAtIDFdXG5cdFx0XHRcdG91dHB1dCArPSBlbmNvZGUodGVtcCA+PiAyKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wIDw8IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9ICc9PSdcblx0XHRcdFx0YnJlYWtcblx0XHRcdGNhc2UgMjpcblx0XHRcdFx0dGVtcCA9ICh1aW50OFt1aW50OC5sZW5ndGggLSAyXSA8PCA4KSArICh1aW50OFt1aW50OC5sZW5ndGggLSAxXSlcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSh0ZW1wID4+IDEwKVxuXHRcdFx0XHRvdXRwdXQgKz0gZW5jb2RlKCh0ZW1wID4+IDQpICYgMHgzRilcblx0XHRcdFx0b3V0cHV0ICs9IGVuY29kZSgodGVtcCA8PCAyKSAmIDB4M0YpXG5cdFx0XHRcdG91dHB1dCArPSAnPSdcblx0XHRcdFx0YnJlYWtcblx0XHR9XG5cblx0XHRyZXR1cm4gb3V0cHV0XG5cdH1cblxuXHRleHBvcnRzLnRvQnl0ZUFycmF5ID0gYjY0VG9CeXRlQXJyYXlcblx0ZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gdWludDhUb0Jhc2U2NFxufSh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcgPyAodGhpcy5iYXNlNjRqcyA9IHt9KSA6IGV4cG9ydHMpKVxuIiwiZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSBuQnl0ZXMgKiA4IC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gZSAqIDI1NiArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IG0gKiAyNTYgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gbkJ5dGVzICogOCAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAodmFsdWUgKiBjIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCJcbi8qKlxuICogaXNBcnJheVxuICovXG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTtcblxuLyoqXG4gKiB0b1N0cmluZ1xuICovXG5cbnZhciBzdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4vKipcbiAqIFdoZXRoZXIgb3Igbm90IHRoZSBnaXZlbiBgdmFsYFxuICogaXMgYW4gYXJyYXkuXG4gKlxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgICAgaXNBcnJheShbXSk7XG4gKiAgICAgICAgLy8gPiB0cnVlXG4gKiAgICAgICAgaXNBcnJheShhcmd1bWVudHMpO1xuICogICAgICAgIC8vID4gZmFsc2VcbiAqICAgICAgICBpc0FycmF5KCcnKTtcbiAqICAgICAgICAvLyA+IGZhbHNlXG4gKlxuICogQHBhcmFtIHttaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtib29sfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsKSB7XG4gIHJldHVybiAhISB2YWwgJiYgJ1tvYmplY3QgQXJyYXldJyA9PSBzdHIuY2FsbCh2YWwpO1xufTtcbiIsIihmdW5jdGlvbiAoQnVmZmVyKXtcbi8qIVxuICogQGRlc2NyaXB0aW9uIFJlY3Vyc2l2ZSBvYmplY3QgZXh0ZW5kaW5nXG4gKiBAYXV0aG9yIFZpYWNoZXNsYXYgTG90c21hbm92IDxsb3RzbWFub3Y4OUBnbWFpbC5jb20+XG4gKiBAbGljZW5zZSBNSVRcbiAqXG4gKiBUaGUgTUlUIExpY2Vuc2UgKE1JVClcbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMtMjAxNSBWaWFjaGVzbGF2IExvdHNtYW5vdlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2ZcbiAqIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW5cbiAqIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cbiAqIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mXG4gKiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sXG4gKiBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1NcbiAqIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUlxuICogQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSXG4gKiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTlxuICogQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGlzU3BlY2lmaWNWYWx1ZSh2YWwpIHtcblx0cmV0dXJuIChcblx0XHR2YWwgaW5zdGFuY2VvZiBCdWZmZXJcblx0XHR8fCB2YWwgaW5zdGFuY2VvZiBEYXRlXG5cdFx0fHwgdmFsIGluc3RhbmNlb2YgUmVnRXhwXG5cdCkgPyB0cnVlIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGNsb25lU3BlY2lmaWNWYWx1ZSh2YWwpIHtcblx0aWYgKHZhbCBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuXHRcdHZhciB4ID0gbmV3IEJ1ZmZlcih2YWwubGVuZ3RoKTtcblx0XHR2YWwuY29weSh4KTtcblx0XHRyZXR1cm4geDtcblx0fSBlbHNlIGlmICh2YWwgaW5zdGFuY2VvZiBEYXRlKSB7XG5cdFx0cmV0dXJuIG5ldyBEYXRlKHZhbC5nZXRUaW1lKCkpO1xuXHR9IGVsc2UgaWYgKHZhbCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuXHRcdHJldHVybiBuZXcgUmVnRXhwKHZhbCk7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHNpdHVhdGlvbicpO1xuXHR9XG59XG5cbi8qKlxuICogUmVjdXJzaXZlIGNsb25pbmcgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGRlZXBDbG9uZUFycmF5KGFycikge1xuXHR2YXIgY2xvbmUgPSBbXTtcblx0YXJyLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0sIGluZGV4KSB7XG5cdFx0aWYgKHR5cGVvZiBpdGVtID09PSAnb2JqZWN0JyAmJiBpdGVtICE9PSBudWxsKSB7XG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuXHRcdFx0XHRjbG9uZVtpbmRleF0gPSBkZWVwQ2xvbmVBcnJheShpdGVtKTtcblx0XHRcdH0gZWxzZSBpZiAoaXNTcGVjaWZpY1ZhbHVlKGl0ZW0pKSB7XG5cdFx0XHRcdGNsb25lW2luZGV4XSA9IGNsb25lU3BlY2lmaWNWYWx1ZShpdGVtKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGNsb25lW2luZGV4XSA9IGRlZXBFeHRlbmQoe30sIGl0ZW0pO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRjbG9uZVtpbmRleF0gPSBpdGVtO1xuXHRcdH1cblx0fSk7XG5cdHJldHVybiBjbG9uZTtcbn1cblxuLyoqXG4gKiBFeHRlbmluZyBvYmplY3QgdGhhdCBlbnRlcmVkIGluIGZpcnN0IGFyZ3VtZW50LlxuICpcbiAqIFJldHVybnMgZXh0ZW5kZWQgb2JqZWN0IG9yIGZhbHNlIGlmIGhhdmUgbm8gdGFyZ2V0IG9iamVjdCBvciBpbmNvcnJlY3QgdHlwZS5cbiAqXG4gKiBJZiB5b3Ugd2lzaCB0byBjbG9uZSBzb3VyY2Ugb2JqZWN0ICh3aXRob3V0IG1vZGlmeSBpdCksIGp1c3QgdXNlIGVtcHR5IG5ld1xuICogb2JqZWN0IGFzIGZpcnN0IGFyZ3VtZW50LCBsaWtlIHRoaXM6XG4gKiAgIGRlZXBFeHRlbmQoe30sIHlvdXJPYmpfMSwgW3lvdXJPYmpfTl0pO1xuICovXG52YXIgZGVlcEV4dGVuZCA9IG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKC8qb2JqXzEsIFtvYmpfMl0sIFtvYmpfTl0qLykge1xuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDEgfHwgdHlwZW9mIGFyZ3VtZW50c1swXSAhPT0gJ29iamVjdCcpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblxuXHRpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHtcblx0XHRyZXR1cm4gYXJndW1lbnRzWzBdO1xuXHR9XG5cblx0dmFyIHRhcmdldCA9IGFyZ3VtZW50c1swXTtcblxuXHQvLyBjb252ZXJ0IGFyZ3VtZW50cyB0byBhcnJheSBhbmQgY3V0IG9mZiB0YXJnZXQgb2JqZWN0XG5cdHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuXHR2YXIgdmFsLCBzcmMsIGNsb25lO1xuXG5cdGFyZ3MuZm9yRWFjaChmdW5jdGlvbiAob2JqKSB7XG5cdFx0Ly8gc2tpcCBhcmd1bWVudCBpZiBpdCBpcyBhcnJheSBvciBpc24ndCBvYmplY3Rcblx0XHRpZiAodHlwZW9mIG9iaiAhPT0gJ29iamVjdCcgfHwgQXJyYXkuaXNBcnJheShvYmopKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0T2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcblx0XHRcdHNyYyA9IHRhcmdldFtrZXldOyAvLyBzb3VyY2UgdmFsdWVcblx0XHRcdHZhbCA9IG9ialtrZXldOyAvLyBuZXcgdmFsdWVcblxuXHRcdFx0Ly8gcmVjdXJzaW9uIHByZXZlbnRpb25cblx0XHRcdGlmICh2YWwgPT09IHRhcmdldCkge1xuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdC8qKlxuXHRcdFx0ICogaWYgbmV3IHZhbHVlIGlzbid0IG9iamVjdCB0aGVuIGp1c3Qgb3ZlcndyaXRlIGJ5IG5ldyB2YWx1ZVxuXHRcdFx0ICogaW5zdGVhZCBvZiBleHRlbmRpbmcuXG5cdFx0XHQgKi9cblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIHZhbCAhPT0gJ29iamVjdCcgfHwgdmFsID09PSBudWxsKSB7XG5cdFx0XHRcdHRhcmdldFtrZXldID0gdmFsO1xuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdC8vIGp1c3QgY2xvbmUgYXJyYXlzIChhbmQgcmVjdXJzaXZlIGNsb25lIG9iamVjdHMgaW5zaWRlKVxuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcblx0XHRcdFx0dGFyZ2V0W2tleV0gPSBkZWVwQ2xvbmVBcnJheSh2YWwpO1xuXHRcdFx0XHRyZXR1cm47XG5cblx0XHRcdC8vIGN1c3RvbSBjbG9uaW5nIGFuZCBvdmVyd3JpdGUgZm9yIHNwZWNpZmljIG9iamVjdHNcblx0XHRcdH0gZWxzZSBpZiAoaXNTcGVjaWZpY1ZhbHVlKHZhbCkpIHtcblx0XHRcdFx0dGFyZ2V0W2tleV0gPSBjbG9uZVNwZWNpZmljVmFsdWUodmFsKTtcblx0XHRcdFx0cmV0dXJuO1xuXG5cdFx0XHQvLyBvdmVyd3JpdGUgYnkgbmV3IHZhbHVlIGlmIHNvdXJjZSBpc24ndCBvYmplY3Qgb3IgYXJyYXlcblx0XHRcdH0gZWxzZSBpZiAodHlwZW9mIHNyYyAhPT0gJ29iamVjdCcgfHwgc3JjID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoc3JjKSkge1xuXHRcdFx0XHR0YXJnZXRba2V5XSA9IGRlZXBFeHRlbmQoe30sIHZhbCk7XG5cdFx0XHRcdHJldHVybjtcblxuXHRcdFx0Ly8gc291cmNlIHZhbHVlIGFuZCBuZXcgdmFsdWUgaXMgb2JqZWN0cyBib3RoLCBleHRlbmRpbmcuLi5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRhcmdldFtrZXldID0gZGVlcEV4dGVuZChzcmMsIHZhbCk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHR9KTtcblx0fSk7XG5cblx0cmV0dXJuIHRhcmdldDtcbn1cblxufSkuY2FsbCh0aGlzLHJlcXVpcmUoXCJidWZmZXJcIikuQnVmZmVyKVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSW01dlpHVmZiVzlrZFd4bGN5OWtaV1Z3TFdWNGRHVnVaQzlzYVdJdlpHVmxjQzFsZUhSbGJtUXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanRCUVVGQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQk8wRkJRMEU3UVVGRFFUdEJRVU5CTzBGQlEwRTdRVUZEUVR0QlFVTkJPMEZCUTBFN1FVRkRRVHRCUVVOQklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUl2S2lGY2JpQXFJRUJrWlhOamNtbHdkR2x2YmlCU1pXTjFjbk5wZG1VZ2IySnFaV04wSUdWNGRHVnVaR2x1WjF4dUlDb2dRR0YxZEdodmNpQldhV0ZqYUdWemJHRjJJRXh2ZEhOdFlXNXZkaUE4Ykc5MGMyMWhibTkyT0RsQVoyMWhhV3d1WTI5dFBseHVJQ29nUUd4cFkyVnVjMlVnVFVsVVhHNGdLbHh1SUNvZ1ZHaGxJRTFKVkNCTWFXTmxibk5sSUNoTlNWUXBYRzRnS2x4dUlDb2dRMjl3ZVhKcFoyaDBJQ2hqS1NBeU1ERXpMVEl3TVRVZ1ZtbGhZMmhsYzJ4aGRpQk1iM1J6YldGdWIzWmNiaUFxWEc0Z0tpQlFaWEp0YVhOemFXOXVJR2x6SUdobGNtVmllU0JuY21GdWRHVmtMQ0JtY21WbElHOW1JR05vWVhKblpTd2dkRzhnWVc1NUlIQmxjbk52YmlCdlluUmhhVzVwYm1jZ1lTQmpiM0I1SUc5bVhHNGdLaUIwYUdseklITnZablIzWVhKbElHRnVaQ0JoYzNOdlkybGhkR1ZrSUdSdlkzVnRaVzUwWVhScGIyNGdabWxzWlhNZ0tIUm9aU0JjSWxOdlpuUjNZWEpsWENJcExDQjBieUJrWldGc0lHbHVYRzRnS2lCMGFHVWdVMjltZEhkaGNtVWdkMmwwYUc5MWRDQnlaWE4wY21samRHbHZiaXdnYVc1amJIVmthVzVuSUhkcGRHaHZkWFFnYkdsdGFYUmhkR2x2YmlCMGFHVWdjbWxuYUhSeklIUnZYRzRnS2lCMWMyVXNJR052Y0hrc0lHMXZaR2xtZVN3Z2JXVnlaMlVzSUhCMVlteHBjMmdzSUdScGMzUnlhV0oxZEdVc0lITjFZbXhwWTJWdWMyVXNJR0Z1WkM5dmNpQnpaV3hzSUdOdmNHbGxjeUJ2Wmx4dUlDb2dkR2hsSUZOdlpuUjNZWEpsTENCaGJtUWdkRzhnY0dWeWJXbDBJSEJsY25OdmJuTWdkRzhnZDJodmJTQjBhR1VnVTI5bWRIZGhjbVVnYVhNZ1puVnlibWx6YUdWa0lIUnZJR1J2SUhOdkxGeHVJQ29nYzNWaWFtVmpkQ0IwYnlCMGFHVWdabTlzYkc5M2FXNW5JR052Ym1ScGRHbHZibk02WEc0Z0tseHVJQ29nVkdobElHRmliM1psSUdOdmNIbHlhV2RvZENCdWIzUnBZMlVnWVc1a0lIUm9hWE1nY0dWeWJXbHpjMmx2YmlCdWIzUnBZMlVnYzJoaGJHd2dZbVVnYVc1amJIVmtaV1FnYVc0Z1lXeHNYRzRnS2lCamIzQnBaWE1nYjNJZ2MzVmljM1JoYm5ScFlXd2djRzl5ZEdsdmJuTWdiMllnZEdobElGTnZablIzWVhKbExseHVJQ3BjYmlBcUlGUklSU0JUVDBaVVYwRlNSU0JKVXlCUVVrOVdTVVJGUkNCY0lrRlRJRWxUWENJc0lGZEpWRWhQVlZRZ1YwRlNVa0ZPVkZrZ1QwWWdRVTVaSUV0SlRrUXNJRVZZVUZKRlUxTWdUMUpjYmlBcUlFbE5VRXhKUlVRc0lFbE9RMHhWUkVsT1J5QkNWVlFnVGs5VUlFeEpUVWxVUlVRZ1ZFOGdWRWhGSUZkQlVsSkJUbFJKUlZNZ1QwWWdUVVZTUTBoQlRsUkJRa2xNU1ZSWkxDQkdTVlJPUlZOVFhHNGdLaUJHVDFJZ1FTQlFRVkpVU1VOVlRFRlNJRkJWVWxCUFUwVWdRVTVFSUU1UFRrbE9SbEpKVGtkRlRVVk9WQzRnU1U0Z1RrOGdSVlpGVGxRZ1UwaEJURXdnVkVoRklFRlZWRWhQVWxNZ1QxSmNiaUFxSUVOUFVGbFNTVWRJVkNCSVQweEVSVkpUSUVKRklFeEpRVUpNUlNCR1QxSWdRVTVaSUVOTVFVbE5MQ0JFUVUxQlIwVlRJRTlTSUU5VVNFVlNJRXhKUVVKSlRFbFVXU3dnVjBoRlZFaEZVbHh1SUNvZ1NVNGdRVTRnUVVOVVNVOU9JRTlHSUVOUFRsUlNRVU5VTENCVVQxSlVJRTlTSUU5VVNFVlNWMGxUUlN3Z1FWSkpVMGxPUnlCR1VrOU5MQ0JQVlZRZ1QwWWdUMUlnU1U1Y2JpQXFJRU5QVGs1RlExUkpUMDRnVjBsVVNDQlVTRVVnVTA5R1ZGZEJVa1VnVDFJZ1ZFaEZJRlZUUlNCUFVpQlBWRWhGVWlCRVJVRk1TVTVIVXlCSlRpQlVTRVVnVTA5R1ZGZEJVa1V1WEc0Z0tpOWNibHh1SjNWelpTQnpkSEpwWTNRbk8xeHVYRzVtZFc1amRHbHZiaUJwYzFOd1pXTnBabWxqVm1Gc2RXVW9kbUZzS1NCN1hHNWNkSEpsZEhWeWJpQW9YRzVjZEZ4MGRtRnNJR2x1YzNSaGJtTmxiMllnUW5WbVptVnlYRzVjZEZ4MGZId2dkbUZzSUdsdWMzUmhibU5sYjJZZ1JHRjBaVnh1WEhSY2RIeDhJSFpoYkNCcGJuTjBZVzVqWlc5bUlGSmxaMFY0Y0Z4dVhIUXBJRDhnZEhKMVpTQTZJR1poYkhObE8xeHVmVnh1WEc1bWRXNWpkR2x2YmlCamJHOXVaVk53WldOcFptbGpWbUZzZFdVb2RtRnNLU0I3WEc1Y2RHbG1JQ2gyWVd3Z2FXNXpkR0Z1WTJWdlppQkNkV1ptWlhJcElIdGNibHgwWEhSMllYSWdlQ0E5SUc1bGR5QkNkV1ptWlhJb2RtRnNMbXhsYm1kMGFDazdYRzVjZEZ4MGRtRnNMbU52Y0hrb2VDazdYRzVjZEZ4MGNtVjBkWEp1SUhnN1hHNWNkSDBnWld4elpTQnBaaUFvZG1Gc0lHbHVjM1JoYm1ObGIyWWdSR0YwWlNrZ2UxeHVYSFJjZEhKbGRIVnliaUJ1WlhjZ1JHRjBaU2gyWVd3dVoyVjBWR2x0WlNncEtUdGNibHgwZlNCbGJITmxJR2xtSUNoMllXd2dhVzV6ZEdGdVkyVnZaaUJTWldkRmVIQXBJSHRjYmx4MFhIUnlaWFIxY200Z2JtVjNJRkpsWjBWNGNDaDJZV3dwTzF4dVhIUjlJR1ZzYzJVZ2UxeHVYSFJjZEhSb2NtOTNJRzVsZHlCRmNuSnZjaWduVlc1bGVIQmxZM1JsWkNCemFYUjFZWFJwYjI0bktUdGNibHgwZlZ4dWZWeHVYRzR2S2lwY2JpQXFJRkpsWTNWeWMybDJaU0JqYkc5dWFXNW5JR0Z5Y21GNUxseHVJQ292WEc1bWRXNWpkR2x2YmlCa1pXVndRMnh2Ym1WQmNuSmhlU2hoY25JcElIdGNibHgwZG1GeUlHTnNiMjVsSUQwZ1cxMDdYRzVjZEdGeWNpNW1iM0pGWVdOb0tHWjFibU4wYVc5dUlDaHBkR1Z0TENCcGJtUmxlQ2tnZTF4dVhIUmNkR2xtSUNoMGVYQmxiMllnYVhSbGJTQTlQVDBnSjI5aWFtVmpkQ2NnSmlZZ2FYUmxiU0FoUFQwZ2JuVnNiQ2tnZTF4dVhIUmNkRngwYVdZZ0tFRnljbUY1TG1selFYSnlZWGtvYVhSbGJTa3BJSHRjYmx4MFhIUmNkRngwWTJ4dmJtVmJhVzVrWlhoZElEMGdaR1ZsY0VOc2IyNWxRWEp5WVhrb2FYUmxiU2s3WEc1Y2RGeDBYSFI5SUdWc2MyVWdhV1lnS0dselUzQmxZMmxtYVdOV1lXeDFaU2hwZEdWdEtTa2dlMXh1WEhSY2RGeDBYSFJqYkc5dVpWdHBibVJsZUYwZ1BTQmpiRzl1WlZOd1pXTnBabWxqVm1Gc2RXVW9hWFJsYlNrN1hHNWNkRngwWEhSOUlHVnNjMlVnZTF4dVhIUmNkRngwWEhSamJHOXVaVnRwYm1SbGVGMGdQU0JrWldWd1JYaDBaVzVrS0h0OUxDQnBkR1Z0S1R0Y2JseDBYSFJjZEgxY2JseDBYSFI5SUdWc2MyVWdlMXh1WEhSY2RGeDBZMnh2Ym1WYmFXNWtaWGhkSUQwZ2FYUmxiVHRjYmx4MFhIUjlYRzVjZEgwcE8xeHVYSFJ5WlhSMWNtNGdZMnh2Ym1VN1hHNTlYRzVjYmk4cUtseHVJQ29nUlhoMFpXNXBibWNnYjJKcVpXTjBJSFJvWVhRZ1pXNTBaWEpsWkNCcGJpQm1hWEp6ZENCaGNtZDFiV1Z1ZEM1Y2JpQXFYRzRnS2lCU1pYUjFjbTV6SUdWNGRHVnVaR1ZrSUc5aWFtVmpkQ0J2Y2lCbVlXeHpaU0JwWmlCb1lYWmxJRzV2SUhSaGNtZGxkQ0J2WW1wbFkzUWdiM0lnYVc1amIzSnlaV04wSUhSNWNHVXVYRzRnS2x4dUlDb2dTV1lnZVc5MUlIZHBjMmdnZEc4Z1kyeHZibVVnYzI5MWNtTmxJRzlpYW1WamRDQW9kMmwwYUc5MWRDQnRiMlJwWm5rZ2FYUXBMQ0JxZFhOMElIVnpaU0JsYlhCMGVTQnVaWGRjYmlBcUlHOWlhbVZqZENCaGN5Qm1hWEp6ZENCaGNtZDFiV1Z1ZEN3Z2JHbHJaU0IwYUdsek9seHVJQ29nSUNCa1pXVndSWGgwWlc1a0tIdDlMQ0I1YjNWeVQySnFYekVzSUZ0NWIzVnlUMkpxWDA1ZEtUdGNiaUFxTDF4dWRtRnlJR1JsWlhCRmVIUmxibVFnUFNCdGIyUjFiR1V1Wlhod2IzSjBjeUE5SUdaMWJtTjBhVzl1SUNndkttOWlhbDh4TENCYmIySnFYekpkTENCYmIySnFYMDVkS2k4cElIdGNibHgwYVdZZ0tHRnlaM1Z0Wlc1MGN5NXNaVzVuZEdnZ1BDQXhJSHg4SUhSNWNHVnZaaUJoY21kMWJXVnVkSE5iTUYwZ0lUMDlJQ2R2WW1wbFkzUW5LU0I3WEc1Y2RGeDBjbVYwZFhKdUlHWmhiSE5sTzF4dVhIUjlYRzVjYmx4MGFXWWdLR0Z5WjNWdFpXNTBjeTVzWlc1bmRHZ2dQQ0F5S1NCN1hHNWNkRngwY21WMGRYSnVJR0Z5WjNWdFpXNTBjMXN3WFR0Y2JseDBmVnh1WEc1Y2RIWmhjaUIwWVhKblpYUWdQU0JoY21kMWJXVnVkSE5iTUYwN1hHNWNibHgwTHk4Z1kyOXVkbVZ5ZENCaGNtZDFiV1Z1ZEhNZ2RHOGdZWEp5WVhrZ1lXNWtJR04xZENCdlptWWdkR0Z5WjJWMElHOWlhbVZqZEZ4dVhIUjJZWElnWVhKbmN5QTlJRUZ5Y21GNUxuQnliM1J2ZEhsd1pTNXpiR2xqWlM1allXeHNLR0Z5WjNWdFpXNTBjeXdnTVNrN1hHNWNibHgwZG1GeUlIWmhiQ3dnYzNKakxDQmpiRzl1WlR0Y2JseHVYSFJoY21kekxtWnZja1ZoWTJnb1puVnVZM1JwYjI0Z0tHOWlhaWtnZTF4dVhIUmNkQzh2SUhOcmFYQWdZWEpuZFcxbGJuUWdhV1lnYVhRZ2FYTWdZWEp5WVhrZ2IzSWdhWE51SjNRZ2IySnFaV04wWEc1Y2RGeDBhV1lnS0hSNWNHVnZaaUJ2WW1vZ0lUMDlJQ2R2WW1wbFkzUW5JSHg4SUVGeWNtRjVMbWx6UVhKeVlYa29iMkpxS1NrZ2UxeHVYSFJjZEZ4MGNtVjBkWEp1TzF4dVhIUmNkSDFjYmx4dVhIUmNkRTlpYW1WamRDNXJaWGx6S0c5aWFpa3VabTl5UldGamFDaG1kVzVqZEdsdmJpQW9hMlY1S1NCN1hHNWNkRngwWEhSemNtTWdQU0IwWVhKblpYUmJhMlY1WFRzZ0x5OGdjMjkxY21ObElIWmhiSFZsWEc1Y2RGeDBYSFIyWVd3Z1BTQnZZbXBiYTJWNVhUc2dMeThnYm1WM0lIWmhiSFZsWEc1Y2JseDBYSFJjZEM4dklISmxZM1Z5YzJsdmJpQndjbVYyWlc1MGFXOXVYRzVjZEZ4MFhIUnBaaUFvZG1Gc0lEMDlQU0IwWVhKblpYUXBJSHRjYmx4MFhIUmNkRngwY21WMGRYSnVPMXh1WEc1Y2RGeDBYSFF2S2lwY2JseDBYSFJjZENBcUlHbG1JRzVsZHlCMllXeDFaU0JwYzI0bmRDQnZZbXBsWTNRZ2RHaGxiaUJxZFhOMElHOTJaWEozY21sMFpTQmllU0J1WlhjZ2RtRnNkV1ZjYmx4MFhIUmNkQ0FxSUdsdWMzUmxZV1FnYjJZZ1pYaDBaVzVrYVc1bkxseHVYSFJjZEZ4MElDb3ZYRzVjZEZ4MFhIUjlJR1ZzYzJVZ2FXWWdLSFI1Y0dWdlppQjJZV3dnSVQwOUlDZHZZbXBsWTNRbklIeDhJSFpoYkNBOVBUMGdiblZzYkNrZ2UxeHVYSFJjZEZ4MFhIUjBZWEpuWlhSYmEyVjVYU0E5SUhaaGJEdGNibHgwWEhSY2RGeDBjbVYwZFhKdU8xeHVYRzVjZEZ4MFhIUXZMeUJxZFhOMElHTnNiMjVsSUdGeWNtRjVjeUFvWVc1a0lISmxZM1Z5YzJsMlpTQmpiRzl1WlNCdlltcGxZM1J6SUdsdWMybGtaU2xjYmx4MFhIUmNkSDBnWld4elpTQnBaaUFvUVhKeVlYa3VhWE5CY25KaGVTaDJZV3dwS1NCN1hHNWNkRngwWEhSY2RIUmhjbWRsZEZ0clpYbGRJRDBnWkdWbGNFTnNiMjVsUVhKeVlYa29kbUZzS1R0Y2JseDBYSFJjZEZ4MGNtVjBkWEp1TzF4dVhHNWNkRngwWEhRdkx5QmpkWE4wYjIwZ1kyeHZibWx1WnlCaGJtUWdiM1psY25keWFYUmxJR1p2Y2lCemNHVmphV1pwWXlCdlltcGxZM1J6WEc1Y2RGeDBYSFI5SUdWc2MyVWdhV1lnS0dselUzQmxZMmxtYVdOV1lXeDFaU2gyWVd3cEtTQjdYRzVjZEZ4MFhIUmNkSFJoY21kbGRGdHJaWGxkSUQwZ1kyeHZibVZUY0dWamFXWnBZMVpoYkhWbEtIWmhiQ2s3WEc1Y2RGeDBYSFJjZEhKbGRIVnlianRjYmx4dVhIUmNkRngwTHk4Z2IzWmxjbmR5YVhSbElHSjVJRzVsZHlCMllXeDFaU0JwWmlCemIzVnlZMlVnYVhOdUozUWdiMkpxWldOMElHOXlJR0Z5Y21GNVhHNWNkRngwWEhSOUlHVnNjMlVnYVdZZ0tIUjVjR1Z2WmlCemNtTWdJVDA5SUNkdlltcGxZM1FuSUh4OElITnlZeUE5UFQwZ2JuVnNiQ0I4ZkNCQmNuSmhlUzVwYzBGeWNtRjVLSE55WXlrcElIdGNibHgwWEhSY2RGeDBkR0Z5WjJWMFcydGxlVjBnUFNCa1pXVndSWGgwWlc1a0tIdDlMQ0IyWVd3cE8xeHVYSFJjZEZ4MFhIUnlaWFIxY200N1hHNWNibHgwWEhSY2RDOHZJSE52ZFhKalpTQjJZV3gxWlNCaGJtUWdibVYzSUhaaGJIVmxJR2x6SUc5aWFtVmpkSE1nWW05MGFDd2daWGgwWlc1a2FXNW5MaTR1WEc1Y2RGeDBYSFI5SUdWc2MyVWdlMXh1WEhSY2RGeDBYSFIwWVhKblpYUmJhMlY1WFNBOUlHUmxaWEJGZUhSbGJtUW9jM0pqTENCMllXd3BPMXh1WEhSY2RGeDBYSFJ5WlhSMWNtNDdYRzVjZEZ4MFhIUjlYRzVjZEZ4MGZTazdYRzVjZEgwcE8xeHVYRzVjZEhKbGRIVnliaUIwWVhKblpYUTdYRzU5WEc0aVhYMD0iLCJpbXBvcnQge1VSTFMsIGdldFVwZGF0ZVRpbWV9IGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCBwYWdlQ29uZmlnIGZyb20gJy4uL3BhZ2UtY29uZmlnJ1xuaW1wb3J0IHtjYWxsfSBmcm9tICcuLi90cmFja2luZy9pbmRleCdcbmltcG9ydCB7ZG9tYWluRnJvbVVybH0gZnJvbSAnLi4vbG9jYXRpb24nXG5pbXBvcnQge2lzQ2hyb21lLCBjaHJvbWVCZ0Vycm9yLCBnZXRSYW5kb21JbnRJbmNsdXNpdmV9IGZyb20gJy4uL3V0aWwnXG5pbXBvcnQgZm9yZ2UgZnJvbSAnLi4vZm9yZ2UnXG5cblxubGV0IGNocm9tZSA9IHdpbmRvdy5jaHJvbWUsXG4gIGN1cnJlbnREb21haW4sIHVwZGF0ZVN0YXJ0ZWQgPSBmYWxzZVxuXG5mdW5jdGlvbiBzZXRVbmluc3RhbGxVUkwoZG9tYWluID0gJycpIHtcbiAgaWYgKCFpc0Nocm9tZSgpKSByZXR1cm5cbiAgLy9jYXNlIGZvciBzZXJ2aWNlIHVybHNcbiAgaWYgKCFkb21haW4gfHwgZG9tYWluLmluZGV4T2YoJy4nKSA9PSAtMSkgcmV0dXJuXG4gIGlmIChjdXJyZW50RG9tYWluID09IGRvbWFpbikgcmV0dXJuXG4gIGN1cnJlbnREb21haW4gPSBkb21haW5cbiAgbGV0IHVybCA9IGRvbWFpbiA/IFVSTFMudW5pbnN0YWxsICsgJz9kb21haW49JyArIGVuY29kZVVSSShkb21haW4pIDogVVJMUy51bmluc3RhbGxcbiAgY2hyb21lLnJ1bnRpbWUuc2V0VW5pbnN0YWxsVVJMKHVybClcbn1cblxuZnVuY3Rpb24gc2V0dXBGb3JjZWRVcGRhdGUoKSB7XG4gIGlmICghaXNDaHJvbWUoKSB8fCB1cGRhdGVTdGFydGVkKSByZXR1cm5cblxuICBjaHJvbWUucnVudGltZS5vblVwZGF0ZUF2YWlsYWJsZS5hZGRMaXN0ZW5lcigoZGV0YWlscykgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdEZXRlY3RlZCB0aGUgbmV4dCBleHRlbnNpb24gdmVyc2lvbicsIGRldGFpbHMudmVyc2lvbilcbiAgICBjYWxsKCdmZWxvZy5pbmZvJywgJ2Nocm9tZV9mb3JjZWRfdG9fdXBkYXRlJylcbiAgICB1cGRhdGVTdGFydGVkID0gdHJ1ZVxuXG4gICAgbGV0IHdpbGxVcGRhdGVJbk1pbnV0ZXMgPSBnZXRSYW5kb21JbnRJbmNsdXNpdmUoMSwgZ2V0VXBkYXRlVGltZSgpKVxuICAgIGNvbnNvbGUubG9nKCdHb2luZyB0byB1cGRhdGUgaW4gbWludXRlczonLCB3aWxsVXBkYXRlSW5NaW51dGVzKVxuICAgIHNldFRpbWVvdXQoY2hyb21lLnJ1bnRpbWUucmVsb2FkLCB3aWxsVXBkYXRlSW5NaW51dGVzICogNjAgKiAxMDAwIClcbiAgfSlcbiAgcmVxdWVzdFVwZGF0ZUNoZWNrKClcbn1cblxuZnVuY3Rpb24gcmVxdWVzdFVwZGF0ZUNoZWNrKCkge1xuICBjaHJvbWUucnVudGltZS5yZXF1ZXN0VXBkYXRlQ2hlY2soKHN0YXR1cykgPT4ge1xuICAgIGlmIChzdGF0dXMgPT0gJ3VwZGF0ZV9hdmFpbGFibGUnKSByZXR1cm4gY29uc29sZS5sb2coJ3VwZGF0ZSBwZW5kaW5nLi4uJylcbiAgICBpZiAoc3RhdHVzID09ICdub191cGRhdGUnKSByZXR1cm4gY29uc29sZS5sb2coJ25vIHVwZGF0ZSBmb3VuZCcpXG4gICAgaWYgKHN0YXR1cyA9PSAndGhyb3R0bGVkJykgcmV0dXJuIGNvbnNvbGUubG9nKCdPb3BzLCBJXFwnbSBhc2tpbmcgdG9vIGZyZXF1ZW50bHkgLSBJIG5lZWQgdG8gYmFjayBvZmYuJylcbiAgfSlcblxuICBzZXRUaW1lb3V0KHJlcXVlc3RVcGRhdGVDaGVjaywgMSAqIDYwICogMTAwMClcbn1cblxuZnVuY3Rpb24gZ2V0U2VsZWN0ZWRUYWJGYXZpY29uKGNiKSB7XG4gIGNocm9tZS50YWJzLmdldFNlbGVjdGVkKHRhYiA9PiB7XG4gICAgY2IodGFiICYmIHRhYi5mYXZJY29uVXJsKVxuICB9KVxufVxuXG5mdW5jdGlvbiBleGVjSlMoaWQsIGZpbGUsIG9wdHMgPSB7fSkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICBjaHJvbWUudGFicy5leGVjdXRlU2NyaXB0KGlkLCB7ZmlsZSwgLi4ub3B0c30sICgpID0+XG4gICAgICBjaHJvbWVCZ0Vycm9yKCkgPyByZWplY3QoY2hyb21lQmdFcnJvcigpKSA6IHJlc29sdmUoKVxuICAgIClcbiAgKVxufVxuXG5mdW5jdGlvbiBleGVjQ1NTKGlkLCBmaWxlLCBvcHRzID0ge30pIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgY2hyb21lLnRhYnMuaW5zZXJ0Q1NTKGlkLCB7ZmlsZSwgLi4ub3B0c30sICgpID0+XG4gICAgICBjaHJvbWVCZ0Vycm9yKCkgPyByZWplY3QoY2hyb21lQmdFcnJvcigpKSA6IHJlc29sdmUoKVxuICAgIClcbiAgKVxufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkQ29udGVudFNjcmlwdHMoZG9tYWluKSB7XG4gIGlmICghaXNDaHJvbWUoKSkgcmV0dXJuXG4gIGxldCBtYW5pZmVzdCA9IGNocm9tZS5ydW50aW1lLmdldE1hbmlmZXN0KClcblxuICBpZiAoIW1hbmlmZXN0KSByZXR1cm5cblxuICBsZXQgc291cmNlID0gbWFuaWZlc3QuY29udGVudF9zY3JpcHRzLnBvcCgpXG4gIGxldCB0YWJzID0gYXdhaXQgZmlsdGVyZWRUYWJzKHRydWUsIGRvbWFpbilcblxuICBpZiAoIXRhYnMubGVuZ3RoKSByZXR1cm5cblxuICBjb25zb2xlLmxvZygnTG9hZCBjb250ZW50IHNjcmlwdHMgdG8nLCB0YWJzKVxuXG4gIGxldCBlcnJvckhhbmRsZSA9IChlLCB0eXBlKSA9PiB7XG4gICAgbGV0IG1lc3NhZ2UgPSAoZSAmJiBlLm1lc3NhZ2UpIHx8IGVcbiAgICBjYWxsKCdmZWxvZy5lcnJvcicsIGBjaHJvbWVfY3NfJHt0eXBlfV9sb2FkX2Vycm9yYCwge21lc3NhZ2V9KVxuICAgIGNvbnNvbGUuZXJyb3IoYGNzICR7dHlwZX0gbG9hZGVkIHdpdGggZXJyb3I6ICR7bWVzc2FnZX1gKVxuICB9XG5cbiAgY29uc29sZS50aW1lKCdDb250ZW50IHNjcmlwdHMgbG9hZCB0aW1lJylcblxuICBhd2FpdCogdGFic1xuICAgIC5tYXAoKHtpZH0pID0+IFByb21pc2UuYWxsKFtcbiAgICAgIHNvdXJjZS5qcy5yZWR1Y2UoKGxvYWRlciwganMpID0+IGxvYWRlci50aGVuKCgpID0+IGV4ZWNKUyhpZCwganMsIHtydW5BdDogJ2RvY3VtZW50X2lkbGUnfSkpLCBQcm9taXNlLnJlc29sdmUoKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ3NjcmlwdHMgbG9hZGVkJykpXG4gICAgICAgIC5jYXRjaChlID0+IGVycm9ySGFuZGxlKGUsICdqcycpKSxcblxuICAgICAgc291cmNlLmNzcy5yZWR1Y2UoKGxvYWRlciwgY3NzKSA9PiBsb2FkZXIudGhlbigoKSA9PiBleGVjQ1NTKGlkLCBjc3MsIHtydW5BdDogJ2RvY3VtZW50X2lkbGUnfSkpLCBQcm9taXNlLnJlc29sdmUoKSlcbiAgICAgICAgLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ2NzcyBsb2FkZWQnKSlcbiAgICAgICAgLmNhdGNoKGUgPT4gZXJyb3JIYW5kbGUoZSwgJ2NzcycpKVxuICAgIF0pKVxuXG4gIGNvbnNvbGUudGltZUVuZCgnQ29udGVudCBzY3JpcHRzIGxvYWQgdGltZScpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRQcm94eSgpIHtcbiAgaWYgKCFpc0Nocm9tZSgpKSByZXR1cm5cblxuICB0cnkge1xuICAgIGxldCB0YWJzID0gYXdhaXQgZmlsdGVyZWRUYWJzKClcbiAgICBhd2FpdCogdGFicy5tYXAoKHtpZH0pID0+IGV4ZWNKUyhpZCwgJ3NyYy9qcy9wcm94eS5qcycpKVxuICAgIGNvbnNvbGUubG9nKCdwcm94eSBsb2FkZWQgb24nLCB0YWJzLm1hcCh0YWIgPT4gdGFiLnVybCkpXG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICBsZXQgbWVzc2FnZSA9IChlICYmIGUubWVzc2FnZSkgfHwgZVxuICAgIC8vY2FsbCgnZmVsb2cuZXJyb3InLCAnY2hyb21lX3Byb3h5X2xvYWRfZXJyb3InLCB7bWVzc2FnZX0pXG4gICAgY29uc29sZS5lcnJvcigncHJveHkgbG9hZGVkIHdpdGggZXJyb3I6ICcsIG1lc3NhZ2UpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tUYWJEb21haW4oe3VybH0pIHtcbiAgaWYgKHVybC5pbmRleE9mKCdodHRwJykgIT0gMCkgcmV0dXJuXG4gIGlmICh1cmwuaW5jbHVkZXMoJ2dyYW1tYXJseScpKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gcGFnZUNvbmZpZy5jaGVja0RvbWFpbihkb21haW5Gcm9tVXJsKHVybCkpXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGlzTm90Q1NMb2FkZWQodGFiKSB7XG4gIC8vcmV0dXJuIHRydWUgb25seSBpZiB3ZSBoYXZlIGRhdGEgdmFyaWFibGUgZ3JDU0xvYWRlZCBpbiBib2R5XG4gIGNvbnN0IGlzTG9hZGVkID0gYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PlxuICAgIGNocm9tZS50YWJzLmV4ZWN1dGVTY3JpcHQodGFiLmlkLCB7XG4gICAgICBjb2RlOiAnZG9jdW1lbnQuYm9keS5kYXRhc2V0LmdyQ1NMb2FkZWQnXG4gICAgfSwgcmVzID0+IHJlc29sdmUocmVzICYmIHJlcy5wb3AoKSkpXG4gIClcblxuICByZXR1cm4gIWlzTG9hZGVkICYmIHRhYlxufVxuXG5hc3luYyBmdW5jdGlvbiBmaWx0ZXJlZFRhYnMob25seU9uZUluc3RhbmNlLCBkb21haW4pIHtcbiAgY29uc3QgdGFicyA9IGF3YWl0IG5ldyBQcm9taXNlKGZvcmdlLnRhYnMuYWxsVGFicylcbiAgY29uc3QgY3VycmVudCA9IGF3YWl0IG5ldyBQcm9taXNlKGZvcmdlLnRhYnMuZ2V0Q3VycmVudFRhYlVybClcbiAgY29uc3QgcHJvY2Vzc2VkVGFicyA9IGF3YWl0KiB0YWJzXG4gICAgLmZpbHRlcihkb21haW4gPyAoe3VybH0pID0+IHVybC5pbmNsdWRlcyhkb21haW4pIDogY2hlY2tUYWJEb21haW4pXG4gICAgLm1hcChvbmx5T25lSW5zdGFuY2UgPyBpc05vdENTTG9hZGVkIDogdGFiID0+IFByb21pc2UucmVzb2x2ZSh0YWIpKVxuXG4gIHJldHVybiBwcm9jZXNzZWRUYWJzXG4gICAgLmZpbHRlcihCb29sZWFuKVxuICAgIC5zb3J0KCh7dXJsfSkgPT4gdXJsID09IGN1cnJlbnQgPyAtMSA6IDEpLy9mb2N1c2VkIHRhYiB3aWxsIGJlIGZpcnN0XG59XG5cblxuZXhwb3J0IHtcbiAgc2V0VW5pbnN0YWxsVVJMLFxuICBzZXR1cEZvcmNlZFVwZGF0ZSxcbiAgZ2V0U2VsZWN0ZWRUYWJGYXZpY29uLFxuICBsb2FkQ29udGVudFNjcmlwdHMsXG4gIGZpbHRlcmVkVGFicyxcbiAgbG9hZFByb3h5XG59XG4iLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4ndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciBfZm9yZ2UyID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ2ZvcmdlJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydmb3JnZSddIDogbnVsbCk7XG5cbnZhciBfZm9yZ2UzID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZm9yZ2UyKTtcblxudmFyIF91dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG52YXIgZm9yZ2UgPSBfZm9yZ2UzWydkZWZhdWx0J107XG5pZiAoIWZvcmdlKSB7XG4gIGZvcmdlID0ge1xuICAgIGNvb2tpZXM6IHtcbiAgICAgIGdldDogX3V0aWwuX2YsXG4gICAgICBzZXQ6IF91dGlsLl9mLFxuICAgICAgd2F0Y2g6IF91dGlsLl9mXG4gICAgfVxuICB9O1xufVxuXG52YXIgZ2V0VG9rZW4gPSBmdW5jdGlvbiBnZXRUb2tlbihjYikge1xuICBmb3JnZS5jb29raWVzLmdldCgnZ3JhbW1hcmx5LmNvbScsICcvJywgJ2dyYXV0aCcsIGNiKTtcbiAgcmV0dXJuIHRydWU7XG59O1xuXG52YXIgd2F0Y2hUb2tlbiA9IGZ1bmN0aW9uIHdhdGNoVG9rZW4oY2IpIHtcbiAgZm9yZ2UuY29va2llcy53YXRjaCgnZ3JhbW1hcmx5LmNvbScsICcvJywgJ2dyYXV0aCcsIGNiKTtcbiAgcmV0dXJuIHRydWU7XG59O1xudmFyIHdhdGNoID0gZnVuY3Rpb24gd2F0Y2goZG9tYWluLCBuYW1lLCBjYikge1xuICBmb3JnZS5jb29raWVzLndhdGNoKGRvbWFpbiwgJy8nLCBuYW1lLCBjYik7XG4gIHJldHVybiB0cnVlO1xufTtcblxudmFyIGdldENvb2tpZSA9IGZ1bmN0aW9uIGdldENvb2tpZShkb21haW4sIG5hbWUsIGNiKSB7XG4gIGZvcmdlLmNvb2tpZXMuZ2V0KGRvbWFpbiwgJy8nLCBuYW1lLCBjYik7XG4gIHJldHVybiB0cnVlO1xufTtcblxudmFyIHNldCA9IGZ1bmN0aW9uIHNldChkYXRhKSB7XG4gIGZvcmdlLmNvb2tpZXMuc2V0KGRhdGEpO1xufTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0ge1xuICBnZXRDb29raWU6IGdldENvb2tpZSxcbiAgZ2V0OiBnZXRDb29raWUsXG4gIHNldDogc2V0LFxuICB3YXRjaDogd2F0Y2gsXG4gIGdldFRva2VuOiBnZXRUb2tlbixcbiAgd2F0Y2hUb2tlbjogd2F0Y2hUb2tlblxufTtcbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5d2NtOXFaV04wTDNOeVl5OXFjeTlzYVdJdlltY3ZZMjl2YTJsbExtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPenM3T3pzN096dHpRa0ZCYlVJc1QwRkJUenM3T3p0dlFrRkRWQ3hUUVVGVE96dEJRVVV4UWl4SlFVRkpMRXRCUVVzc2NVSkJRVk1zUTBGQlFUdEJRVU5zUWl4SlFVRkpMRU5CUVVNc1MwRkJTeXhGUVVGRk8wRkJRMVlzVDBGQlN5eEhRVUZITzBGQlEwNHNWMEZCVHl4RlFVRkZPMEZCUTFBc1UwRkJSeXhWUVVGSk8wRkJRMUFzVTBGQlJ5eFZRVUZKTzBGQlExQXNWMEZCU3l4VlFVRkpPMHRCUTFZN1IwRkRSaXhEUVVGQk8wTkJRMFk3TzBGQlJVUXNTVUZCU1N4UlFVRlJMRWRCUVVjc1UwRkJXQ3hSUVVGUkxFTkJRVWNzUlVGQlJTeEZRVUZKTzBGQlEyNUNMRTlCUVVzc1EwRkJReXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEdWQlFXVXNSVUZCUlN4SFFVRkhMRVZCUVVVc1VVRkJVU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZCTzBGQlEzSkVMRk5CUVU4c1NVRkJTU3hEUVVGQk8wTkJRMW9zUTBGQlFUczdRVUZGUkN4SlFVRkpMRlZCUVZVc1IwRkJSeXhUUVVGaUxGVkJRVlVzUTBGQlJ5eEZRVUZGTEVWQlFVazdRVUZEY2tJc1QwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eExRVUZMTEVOQlFVTXNaVUZCWlN4RlFVRkZMRWRCUVVjc1JVRkJSU3hSUVVGUkxFVkJRVVVzUlVGQlJTeERRVUZETEVOQlFVRTdRVUZEZGtRc1UwRkJUeXhKUVVGSkxFTkJRVUU3UTBGRFdpeERRVUZCTzBGQlEwUXNTVUZCU1N4TFFVRkxMRWRCUVVjc1UwRkJVaXhMUVVGTExFTkJRVWtzVFVGQlRTeEZRVUZGTEVsQlFVa3NSVUZCUlN4RlFVRkZMRVZCUVVzN1FVRkRhRU1zVDBGQlN5eERRVUZETEU5QlFVOHNRMEZCUXl4TFFVRkxMRU5CUVVNc1RVRkJUU3hGUVVGRkxFZEJRVWNzUlVGQlJTeEpRVUZKTEVWQlFVVXNSVUZCUlN4RFFVRkRMRU5CUVVFN1FVRkRNVU1zVTBGQlR5eEpRVUZKTEVOQlFVRTdRMEZEV2l4RFFVRkJPenRCUVVWRUxFbEJRVWtzVTBGQlV5eEhRVUZITEZOQlFWb3NVMEZCVXl4RFFVRkpMRTFCUVUwc1JVRkJSU3hKUVVGSkxFVkJRVVVzUlVGQlJTeEZRVUZMTzBGQlEzQkRMRTlCUVVzc1EwRkJReXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEUxQlFVMHNSVUZCUlN4SFFVRkhMRVZCUVVVc1NVRkJTU3hGUVVGRkxFVkJRVVVzUTBGQlF5eERRVUZCTzBGQlEzaERMRk5CUVU4c1NVRkJTU3hEUVVGQk8wTkJRMW9zUTBGQlFUczdRVUZGUkN4SlFVRkpMRWRCUVVjc1IwRkJSeXhUUVVGT0xFZEJRVWNzUTBGQlJ5eEpRVUZKTEVWQlFVazdRVUZEYUVJc1QwRkJTeXhEUVVGRExFOUJRVThzUTBGQlF5eEhRVUZITEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVFN1EwRkRlRUlzUTBGQlFUczdjVUpCUldNN1FVRkRZaXhYUVVGVExFVkJRVlFzVTBGQlV6dEJRVU5VTEV0QlFVY3NSVUZCUlN4VFFVRlRPMEZCUTJRc1MwRkJSeXhGUVVGSUxFZEJRVWM3UVVGRFNDeFBRVUZMTEVWQlFVd3NTMEZCU3p0QlFVTk1MRlZCUVZFc1JVRkJVaXhSUVVGUk8wRkJRMUlzV1VGQlZTeEZRVUZXTEZWQlFWVTdRMEZEV0NJc0ltWnBiR1VpT2lKblpXNWxjbUYwWldRdWFuTWlMQ0p6YjNWeVkyVlNiMjkwSWpvaUlpd2ljMjkxY21ObGMwTnZiblJsYm5RaU9sc2lhVzF3YjNKMElGOW1iM0puWlNCbWNtOXRJQ2RtYjNKblpTZGNibWx0Y0c5eWRDQjdYMlo5SUdaeWIyMGdKeTR1TDNWMGFXd25YRzVjYm14bGRDQm1iM0puWlNBOUlGOW1iM0puWlZ4dWFXWWdLQ0ZtYjNKblpTa2dlMXh1SUNCbWIzSm5aU0E5SUh0Y2JpQWdJQ0JqYjI5cmFXVnpPaUI3WEc0Z0lDQWdJQ0JuWlhRNklGOW1MRnh1SUNBZ0lDQWdjMlYwT2lCZlppeGNiaUFnSUNBZ0lIZGhkR05vT2lCZlpseHVJQ0FnSUgxY2JpQWdmVnh1ZlZ4dVhHNXNaWFFnWjJWMFZHOXJaVzRnUFNCallpQTlQaUI3WEc0Z0lHWnZjbWRsTG1OdmIydHBaWE11WjJWMEtDZG5jbUZ0YldGeWJIa3VZMjl0Snl3Z0p5OG5MQ0FuWjNKaGRYUm9KeXdnWTJJcFhHNGdJSEpsZEhWeWJpQjBjblZsWEc1OVhHNWNibXhsZENCM1lYUmphRlJ2YTJWdUlEMGdZMklnUFQ0Z2UxeHVJQ0JtYjNKblpTNWpiMjlyYVdWekxuZGhkR05vS0NkbmNtRnRiV0Z5YkhrdVkyOXRKeXdnSnk4bkxDQW5aM0poZFhSb0p5d2dZMklwWEc0Z0lISmxkSFZ5YmlCMGNuVmxYRzU5WEc1c1pYUWdkMkYwWTJnZ1BTQW9aRzl0WVdsdUxDQnVZVzFsTENCallpa2dQVDRnZTF4dUlDQm1iM0puWlM1amIyOXJhV1Z6TG5kaGRHTm9LR1J2YldGcGJpd2dKeThuTENCdVlXMWxMQ0JqWWlsY2JpQWdjbVYwZFhKdUlIUnlkV1ZjYm4xY2JseHViR1YwSUdkbGRFTnZiMnRwWlNBOUlDaGtiMjFoYVc0c0lHNWhiV1VzSUdOaUtTQTlQaUI3WEc0Z0lHWnZjbWRsTG1OdmIydHBaWE11WjJWMEtHUnZiV0ZwYml3Z0p5OG5MQ0J1WVcxbExDQmpZaWxjYmlBZ2NtVjBkWEp1SUhSeWRXVmNibjFjYmx4dWJHVjBJSE5sZENBOUlHUmhkR0VnUFQ0Z2UxeHVJQ0JtYjNKblpTNWpiMjlyYVdWekxuTmxkQ2hrWVhSaEtWeHVmVnh1WEc1bGVIQnZjblFnWkdWbVlYVnNkQ0I3WEc0Z0lHZGxkRU52YjJ0cFpTeGNiaUFnWjJWME9pQm5aWFJEYjI5cmFXVXNYRzRnSUhObGRDeGNiaUFnZDJGMFkyZ3NYRzRnSUdkbGRGUnZhMlZ1TEZ4dUlDQjNZWFJqYUZSdmEyVnVYRzU5WEc0aVhYMD0iLCJpbXBvcnQgcHJlZnMgZnJvbSAnLi4vcHJlZnMnXG5pbXBvcnQge25ld3NJZH0gZnJvbSAnLi4vY29uZmlnJ1xuXG5cbmZ1bmN0aW9uIGluc3RhbGwoKSB7XG4gIHByZWZzLnNldCgnc2Vlbk5ld3NWZXJzaW9uJywgbmV3c0lkKVxufVxuXG5hc3luYyBmdW5jdGlvbiBpc1Nob3dOZXdzKCkge1xuICBsZXQgc2Vlbk5ld3NWZXJzaW9uID0gYXdhaXQgcHJlZnMuZ2V0KCdzZWVuTmV3c1ZlcnNpb24nKSxcbiAgICBpc0Fub255bW91cyA9IGF3YWl0IHByZWZzLmdldCgnYW5vbnltb3VzJylcblxuICByZXR1cm4gIWlzQW5vbnltb3VzICYmIG5ld3NJZCAmJiBzZWVuTmV3c1ZlcnNpb24gIT0gbmV3c0lkXG59XG5cbi8vc3luYyB2ZXJzaW9uIG9mIGlzU2hvd05ld3NcbmZ1bmN0aW9uIGlzU2hvd05ld3NUb1VzZXIodXNlcikge1xuICByZXR1cm4gbmV3c0lkICYmIG5ld3NJZCAhPSB1c2VyLnNlZW5OZXdzVmVyc2lvblxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGluc3RhbGwsXG4gIGlzU2hvd05ld3MsXG4gIGlzU2hvd05ld3NUb1VzZXJcbn1cbiIsImltcG9ydCBwcmVmcyBmcm9tICcuLi9wcmVmcydcblxuYXN5bmMgZnVuY3Rpb24gaXNTaG93UmVmZXJyYWxSaWJib24oKSB7XG4gIGxldCBncm91cHMgPSBhd2FpdCBwcmVmcy5nZXQoJ2dyb3VwcycpXG4gIGxldCBpblJlZmVycmFsR3JvdXAgPSBncm91cHMgJiYgZ3JvdXBzLnNvbWUoKGVsPScnKSA9PiBlbC5pbmRleE9mKCdyZWZlcnJhbF9sb2NrZWQnKSA+IC0xIHx8IGVsID09ICdyZWZlcnJhbCcgfHwgZWwgPT0gJ3Rlc3RfZ3JvdXAnKVxuICBsZXQgcmVmZXJyYWxOZXdzQmFkZ2UgPSBhd2FpdCBwcmVmcy5nZXQoJ3JlZmVycmFsTmV3c0JhZGdlJylcbiAgcmV0dXJuIGluUmVmZXJyYWxHcm91cCAmJiAhcmVmZXJyYWxOZXdzQmFkZ2Vcbn1cblxubGV0IHNlZW5SZWZlcnJhbFJpYmJvbiA9IChrZXk9dHJ1ZSkgPT4ge1xuICBwcmVmcy5zZXQoJ3JlZmVycmFsTmV3c0JhZGdlJywga2V5KVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGlzU2hvd1JlZmVycmFsUmliYm9uLFxuICBzZWVuUmVmZXJyYWxSaWJib25cbn1cbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxucmVxdWlyZSgnYmFiZWwvcG9seWZpbGwnKTtcblxudmFyIF9mb3JnZSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Wydmb3JnZSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnZm9yZ2UnXSA6IG51bGwpO1xuXG52YXIgX2ZvcmdlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ZvcmdlKTtcblxudmFyIF9zcGFya01kNSA9IHJlcXVpcmUoJ3NwYXJrLW1kNScpO1xuXG52YXIgX3NwYXJrTWQ1MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3NwYXJrTWQ1KTtcblxudmFyIF9wcmVmcyA9IHJlcXVpcmUoJy4vcHJlZnMnKTtcblxudmFyIF9wcmVmczIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wcmVmcyk7XG5cbnZhciBGRUxPRyA9IHtcbiAga2V5OiAnYjM3MjUyZTMwMDIwNGIwMGFkNjk3ZmUxZDNiOTc5ZTEnLFxuICBwcm9qZWN0OiAnMTUnLFxuICBwaW5nVGltZW91dDogMTAgKiA2MCAqIDEwMDBcbn07XG5cbnZhciBHTkFSID0ge1xuICB1cmw6ICdodHRwczovL2duYXIuZ3JhbW1hcmx5LmNvbScsXG4gIHFhVXJsOiAnaHR0cHM6Ly9xYWduYXIuZ3JhbW1hcmx5LmNvbSdcbn07XG5cbnZhciBtcGtleSA9ICdjMTBkZDY0Yzg3ZjcwZWY1NTYzYTYzYzM2ODc5N2U4Yyc7XG52YXIgTUlYUEFORUwgPSB7XG4gIHFhS2V5OiAnN2E1Yzk1YjVjYmExYjIyNWQwMGNjM2JhMWM0MTBjNzgnLFxuICBrZXk6IG1wa2V5LFxuICBjb29raWU6ICdtcF8nICsgbXBrZXkgKyAnX21peHBhbmVsJ1xufTtcblxuaWYgKCFcInRydWVcIikge1xuICBHTkFSLnVybCA9IEdOQVIucWFVcmw7XG5cbiAgdmFyIF9tcGtleSA9IE1JWFBBTkVMLnFhS2V5O1xuICBNSVhQQU5FTC5rZXkgPSBfbXBrZXk7XG4gIE1JWFBBTkVMLmNvb2tpZSA9ICdtcF8nICsgX21wa2V5ICsgJ19taXhwYW5lbCc7XG59XG5cbnZhciBTVEFUU0MgPSB7XG4gIFVSTDogJ2h0dHBzOi8vc3RhdHMtcHVibGljLmdyYW1tYXJseS5pby8nLFxuICBQUkVGSVg6ICdncmFtbWFybHkudWknXG59O1xuXG52YXIgREFQSSA9ICdodHRwczovL2RhdGEuZ3JhbW1hcmx5LmNvbSc7XG5cbnZhciBhcHAgPSAnaHR0cHM6Ly9hcHAuZ3JhbW1hcmx5LmNvbSc7XG52YXIgYXV0aFVzZXIgPSAnaHR0cHM6Ly9hdXRoLmdyYW1tYXJseS5jb20vdXNlcic7XG52YXIgd2VsY29tZUZhbmRTID0gJ2h0dHBzOi8vd3d3LmdyYW1tYXJseS5jb20vYWZ0ZXJfaW5zdGFsbF9wYWdlJztcbnZhciBVUkxTID0ge1xuICBhcHA6IGFwcCxcbiAgY2FwaTogJ3dzczovL2NhcGkuZ3JhbW1hcmx5LmNvbS9mcmVld3MnLFxuICBkYXBpTWltaWM6IERBUEkgKyAnL2FwaS9taW1pYycsXG4gIGVkaXRvcjogYXBwICsgJy9wb3B1cDInLFxuICBkaWN0aW9uYXJ5OiAnaHR0cHM6Ly9jYXBpLmdyYW1tYXJseS5jb20vYXBpL2RlZnMnLFxuICB1cGdyYWRlOiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS91cGdyYWRlJyxcbiAgYXV0aFVzZXI6IGF1dGhVc2VyLFxuICBhdXRoU2V0dGluZ3M6IGF1dGhVc2VyICsgJy9zZXR0aW5ncycsXG4gIGF1dGhHcm91cDogYXV0aFVzZXIgKyAnL2dyb3VwJyxcbiAgYXV0aFBpbmc6IGF1dGhVc2VyICsgJy9zeW5jJyxcbiAgYXV0aENyZWF0ZUFub255bW91czogYXV0aFVzZXIgKyAnL2Fub255bW91cycsXG4gIGF1dGhDcmVhdGVQYWdlOiAnaHR0cHM6Ly9hdXRoLmdyYW1tYXJseS5jb20vcmVkaXJlY3QtYW5vbnltb3VzP2xvY2F0aW9uPScgKyB3ZWxjb21lRmFuZFMsXG4gIGRvY3M6IGFwcCArICcvZG9jcycsXG4gIGRvY3NBcGk6ICdodHRwczovL2RveC5ncmFtbWFybHkuY29tL2RvY3VtZW50cycsXG4gIG9mZmxpbmU6ICdodHRwczovL2VkLmdyYW1tYXJseS5jb20vZG93bmxvYWQvZmlyZWZveC91cGRhdGUuanNvbicsXG4gIHdlbGNvbWVDOiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9leHRlbnNpb24tc3VjY2VzcycsXG4gIHVuaW5zdGFsbDogJ2h0dHBzOi8vd3d3LmdyYW1tYXJseS5jb20vZXh0ZW5zaW9uLXVuaW5zdGFsbCcsXG4gIHVzZXJPckFub255bW91czogJ2h0dHBzOi8vYXV0aC5ncmFtbWFybHkuY29tL3VzZXIvb3Jhbm9ueW1vdXMnLFxuICBhdXRoU2lnbmluOiAnaHR0cHM6Ly9hdXRoLmdyYW1tYXJseS5jb20vbG9naW4nLFxuICBhdXRoU2lnbnVwOiAnaHR0cHM6Ly9hdXRoLmdyYW1tYXJseS5jb20vc2lnbnVwJyxcbiAgc2lnbmluOiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9zaWduaW4nLFxuICBzaWdudXA6ICdodHRwczovL3d3dy5ncmFtbWFybHkuY29tL3NpZ251cCcsXG4gIHdlbGNvbWVGYW5kUzogd2VsY29tZUZhbmRTLFxuICByYXZlbjogJ2ZlbG9nLmdyYW1tYXJseS5pbycsXG4gIHJlZmVycmFsOiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9yZWZlcnJhbCcsXG4gIHBhZ2VDb25maWdVcmw6ICdodHRwczovL2QzY3Y0YTlhOXdoMGJ0LmNsb3VkZnJvbnQubmV0L2Jyb3dzZXJwbHVnaW4vY29uZmlnLmpzb24nLFxuICByZXNldFBhc3N3b3JkOiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9yZXNldHBhc3N3b3JkJyxcbiAgdGVybXM6ICdodHRwczovL3d3dy5ncmFtbWFybHkuY29tL3Rlcm1zJyxcbiAgcG9saWN5OiAnaHR0cHM6Ly93d3cuZ3JhbW1hcmx5LmNvbS9wcml2YWN5LXBvbGljeSdcbn07XG5cbnZhciB1cmxLZXlzID0gT2JqZWN0LmtleXMoVVJMUyk7XG52YXIgcGtleSA9IGZ1bmN0aW9uIHBrZXkoa2V5KSB7XG4gIHJldHVybiAnVVJMUy4nICsga2V5O1xufTtcblxuX3ByZWZzMlsnZGVmYXVsdCddLmdldCh1cmxLZXlzLm1hcChwa2V5KSwgZnVuY3Rpb24gKHJlc3VsdCkge1xuICByZXR1cm4gdXJsS2V5cy5maWx0ZXIoZnVuY3Rpb24gKHVybCkge1xuICAgIHJldHVybiByZXN1bHRbcGtleSh1cmwpXTtcbiAgfSkuZm9yRWFjaChmdW5jdGlvbiAodXJsKSB7XG4gICAgcmV0dXJuIFVSTFNbdXJsXSA9IHJlc3VsdFtwa2V5KHVybCldO1xuICB9KTtcbn0pO1xuXG5mdW5jdGlvbiBnZXRWZXJzaW9uKCkge1xuICBpZiAoIV9mb3JnZTJbJ2RlZmF1bHQnXSkgcmV0dXJuO1xuICByZXR1cm4gX2ZvcmdlMlsnZGVmYXVsdCddLmNvbmZpZy5tb2R1bGVzLnBhcmFtZXRlcnMudmVyc2lvbjtcbn1cblxuZnVuY3Rpb24gZ2V0VXBkYXRlVGltZSgpIHtcbiAgaWYgKCFfZm9yZ2UyWydkZWZhdWx0J10pIHJldHVybjtcbiAgcmV0dXJuIF9mb3JnZTJbJ2RlZmF1bHQnXS5jb25maWcubW9kdWxlcy5wYXJhbWV0ZXJzLnVwZGF0ZVRpbWU7XG59XG5cbmZ1bmN0aW9uIGdldFV1aWQoKSB7XG4gIGlmICghX2ZvcmdlMlsnZGVmYXVsdCddKSByZXR1cm47XG4gIHJldHVybiBfZm9yZ2UyWydkZWZhdWx0J10uY29uZmlnLnV1aWQ7XG59XG5cbnZhciBuZXdzID0gWydQb3AtdXAgZWRpdG9yIG5vdyBvcGVucyBpbW1lZGlhdGVseScsICdZb3UgbWF5IGRpc2FibGUgZGVmaW5pdGlvbnMgb24gYWxsIHNpdGVzJ107XG5cbnZhciB1c2VyRmllbGRzID0gWydpZCcsICdlbWFpbCcsICdzdWJzY3JpcHRpb25GcmVlJywgJ2ZpcnN0TmFtZScsICdhbm9ueW1vdXMnLCAndHlwZScsICdwcmVtaXVtJywgJ3NldHRpbmdzJywgJ3JlZ2lzdHJhdGlvbkRhdGUnLCAnbWltaWMnLCAnZ3JvdXBzJywgJ2V4dGVuc2lvbkluc3RhbGxEYXRlJywgJ2ZpeGVkX2Vycm9ycycsICdleHQyJ107XG5cbmlmICghXCJ0cnVlXCIpIHtcbiAgdXNlckZpZWxkcy5wdXNoKCd0b2tlbicpO1xufVxuXG5leHBvcnRzWydkZWZhdWx0J10gPSB7XG4gIC8vIGRlYnVnOiB0cnVlLFxuICBuZXdzOiBuZXdzLFxuICBuZXdzSWQ6IG5ld3MubGVuZ3RoICYmIF9zcGFya01kNTJbJ2RlZmF1bHQnXS5oYXNoKG5ld3Muam9pbignXFxuJykpLFxuICBnZXRVcGRhdGVUaW1lOiBnZXRVcGRhdGVUaW1lLFxuICBVUkxTOiBVUkxTLFxuICBGRUxPRzogRkVMT0csXG4gIFNUQVRTQzogU1RBVFNDLFxuICBEQVBJOiBEQVBJLFxuICBNSVhQQU5FTDogTUlYUEFORUwsXG4gIEdOQVI6IEdOQVIsXG4gIGdldFZlcnNpb246IGdldFZlcnNpb24sXG4gIGdldFV1aWQ6IGdldFV1aWQsXG4gIGlzVGVzdDogIV9mb3JnZTJbJ2RlZmF1bHQnXSxcbiAgbmV4dFZlckNsYXNzOiAnZ3JfdmVyXzInLFxuICByZXN0cmljdGVkQXR0cnM6IFsnZGF0YS1ncmFtbV9lZGl0b3InLCAnZGF0YS1ncmFtbScsICdkYXRhLWdyYW1tX2lkJywgJ2dyYW1tX2VkaXRvcicsIFsnYXJpYS1sYWJlbCcsICdTZWFyY2ggRmFjZWJvb2snXV0sXG4gIHJlc3RyaWN0ZWRQYXJlbnRBdHRyczogJ1tkYXRhLXJlYWN0aWRdJyxcbiAgdXNlckZpZWxkczogdXNlckZpZWxkcyxcbiAgZXh0Mmdyb3VwczogWycwMDFfZ2J1dHRvbl9zaG93JywgJzAwMl9nYnV0dG9uX3Nob3cnLCAnMDAzX2didXR0b25fc2hvdyddLFxuICBleHRlcm5hbEV2ZW50czogWydjaGFuZ2VkLXVzZXInLCAnY2hhbmdlZC1wbGFuJywgJ2NsZWFudXAnLCAnZWRpdG9yLWZpeCddLFxuICBkZXZlbG9wbWVudDogZG9jdW1lbnQubG9jYXRpb24uaG9zdCA9PSAnMTI3LjAuMC4xOjMxMTcnXG59O1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJaTl3Y205cVpXTjBMM055WXk5cWN5OXNhV0l2WTI5dVptbG5MbXB6SWwwc0ltNWhiV1Z6SWpwYlhTd2liV0Z3Y0dsdVozTWlPaUk3T3pzN096czdPenRSUVVGUExHZENRVUZuUWpzN2NVSkJRMHdzVDBGQlR6czdPenQzUWtGRFNpeFhRVUZYT3pzN08zRkNRVU5rTEZOQlFWTTdPenM3UVVGRk0wSXNTVUZCU1N4TFFVRkxMRWRCUVVjN1FVRkRWaXhMUVVGSExFVkJRVVVzYTBOQlFXdERPMEZCUTNaRExGTkJRVThzUlVGQlJTeEpRVUZKTzBGQlEySXNZVUZCVnl4RlFVRkZMRVZCUVVVc1IwRkJSeXhGUVVGRkxFZEJRVWNzU1VGQlNUdERRVU0xUWl4RFFVRkJPenRCUVVWRUxFbEJRVWtzU1VGQlNTeEhRVUZITzBGQlExUXNTMEZCUnl4RlFVRkZMRFJDUVVFMFFqdEJRVU5xUXl4UFFVRkxMRVZCUVVVc09FSkJRVGhDTzBOQlEzUkRMRU5CUVVFN08wRkJSVVFzU1VGQlNTeExRVUZMTEVkQlFVY3NhME5CUVd0RExFTkJRVUU3UVVGRE9VTXNTVUZCU1N4UlFVRlJMRWRCUVVjN1FVRkRZaXhQUVVGTExFVkJRVVVzYTBOQlFXdERPMEZCUTNwRExFdEJRVWNzUlVGQlJTeExRVUZMTzBGQlExWXNVVUZCVFN4VlFVRlJMRXRCUVVzc1kwRkJWenREUVVNdlFpeERRVUZCT3p0QlFVVkVMRWxCUVVrc1EwRkJReXhQUVVGUExFTkJRVU1zUjBGQlJ5eERRVUZETEVsQlFVa3NSVUZCUlR0QlFVTnlRaXhOUVVGSkxFTkJRVU1zUjBGQlJ5eEhRVUZITEVsQlFVa3NRMEZCUXl4TFFVRkxMRU5CUVVFN08wRkJSWEpDTEUxQlFVa3NUVUZCU3l4SFFVRkhMRkZCUVZFc1EwRkJReXhMUVVGTExFTkJRVUU3UVVGRE1VSXNWVUZCVVN4RFFVRkRMRWRCUVVjc1IwRkJSeXhOUVVGTExFTkJRVUU3UVVGRGNFSXNWVUZCVVN4RFFVRkRMRTFCUVUwc1YwRkJVeXhOUVVGTExHTkJRVmNzUTBGQlFUdERRVU42UXpzN1FVRkZSQ3hKUVVGSkxFMUJRVTBzUjBGQlJ6dEJRVU5ZTEV0QlFVY3NSVUZCUlN4dlEwRkJiME03UVVGRGVrTXNVVUZCVFN4RlFVRkZMR05CUVdNN1EwRkRka0lzUTBGQlFUczdRVUZGUkN4SlFVRkpMRWxCUVVrc1IwRkJSeXcwUWtGQk5FSXNRMEZCUVRzN1FVRkZka01zU1VGQlNTeEhRVUZITEVkQlFVY3NNa0pCUVRKQ0xFTkJRVUU3UVVGRGNrTXNTVUZCU1N4UlFVRlJMRWRCUVVjc2FVTkJRV2xETEVOQlFVRTdRVUZEYUVRc1NVRkJTU3haUVVGWkxFZEJRVWNzT0VOQlFUaERMRU5CUVVFN1FVRkRha1VzU1VGQlNTeEpRVUZKTEVkQlFVYzdRVUZEVkN4TFFVRkhMRVZCUVVnc1IwRkJSenRCUVVOSUxFMUJRVWtzUlVGQlJTeHBRMEZCYVVNN1FVRkRka01zVjBGQlV5eEZRVUZGTEVsQlFVa3NSMEZCUnl4WlFVRlpPMEZCUXpsQ0xGRkJRVTBzUlVGQlJTeEhRVUZITEVkQlFVY3NVMEZCVXp0QlFVTjJRaXhaUVVGVkxFVkJRVVVzY1VOQlFYRkRPMEZCUTJwRUxGTkJRVThzUlVGQlJTeHRRMEZCYlVNN1FVRkROVU1zVlVGQlVTeEZRVUZTTEZGQlFWRTdRVUZEVWl4alFVRlpMRVZCUVVVc1VVRkJVU3hIUVVGSExGZEJRVmM3UVVGRGNFTXNWMEZCVXl4RlFVRkZMRkZCUVZFc1IwRkJSeXhSUVVGUk8wRkJRemxDTEZWQlFWRXNSVUZCUlN4UlFVRlJMRWRCUVVjc1QwRkJUenRCUVVNMVFpeHhRa0ZCYlVJc1JVRkJSU3hSUVVGUkxFZEJRVWNzV1VGQldUdEJRVU0xUXl4blFrRkJZeXhGUVVGRkxIbEVRVUY1UkN4SFFVRkhMRmxCUVZrN1FVRkRlRVlzVFVGQlNTeEZRVUZGTEVkQlFVY3NSMEZCUnl4UFFVRlBPMEZCUTI1Q0xGTkJRVThzUlVGQlJTeHhRMEZCY1VNN1FVRkRPVU1zVTBGQlR5eEZRVUZGTEhWRVFVRjFSRHRCUVVOb1JTeFZRVUZSTEVWQlFVVXNOa05CUVRaRE8wRkJRM1pFTEZkQlFWTXNSVUZCUlN3clEwRkJLME03UVVGRE1VUXNhVUpCUVdVc1JVRkJSU3cyUTBGQk5rTTdRVUZET1VRc1dVRkJWU3hGUVVGRkxHdERRVUZyUXp0QlFVTTVReXhaUVVGVkxFVkJRVVVzYlVOQlFXMURPMEZCUXk5RExGRkJRVTBzUlVGQlJTeHJRMEZCYTBNN1FVRkRNVU1zVVVGQlRTeEZRVUZGTEd0RFFVRnJRenRCUVVNeFF5eGpRVUZaTEVWQlFWb3NXVUZCV1R0QlFVTmFMRTlCUVVzc1JVRkJSU3h2UWtGQmIwSTdRVUZETTBJc1ZVRkJVU3hGUVVGRkxHOURRVUZ2UXp0QlFVTTVReXhsUVVGaExFVkJRVVVzYVVWQlFXbEZPMEZCUTJoR0xHVkJRV0VzUlVGQlJTeDVRMEZCZVVNN1FVRkRlRVFzVDBGQlN5eEZRVUZGTEdsRFFVRnBRenRCUVVONFF5eFJRVUZOTEVWQlFVVXNNRU5CUVRCRE8wTkJRMjVFTEVOQlFVRTdPMEZCUlVRc1NVRkJUU3hQUVVGUExFZEJRVWNzVFVGQlRTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1EwRkJRVHRCUVVOcVF5eEpRVUZOTEVsQlFVa3NSMEZCUnl4VFFVRlFMRWxCUVVrc1EwRkJSeXhIUVVGSE8yMUNRVUZaTEVkQlFVYzdRMEZCUlN4RFFVRkJPenRCUVVWcVF5eHRRa0ZCVFN4SFFVRkhMRU5CUVVNc1QwRkJUeXhEUVVGRExFZEJRVWNzUTBGQlF5eEpRVUZKTEVOQlFVTXNSVUZCUlN4VlFVRkJMRTFCUVUwN1UwRkRha01zVDBGQlR5eERRVU5LTEUxQlFVMHNRMEZCUXl4VlFVRkJMRWRCUVVjN1YwRkJTU3hOUVVGTkxFTkJRVU1zU1VGQlNTeERRVUZETEVkQlFVY3NRMEZCUXl4RFFVRkRPMGRCUVVFc1EwRkJReXhEUVVOb1F5eFBRVUZQTEVOQlFVTXNWVUZCUVN4SFFVRkhPMWRCUVVrc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eEhRVUZITEUxQlFVMHNRMEZCUXl4SlFVRkpMRU5CUVVNc1IwRkJSeXhEUVVGRExFTkJRVU03UjBGQlFTeERRVUZETzBOQlFVRXNRMEZEYWtRc1EwRkJRVHM3UVVGRlJDeFRRVUZUTEZWQlFWVXNSMEZCUnp0QlFVTndRaXhOUVVGSkxHMUNRVUZOTEVWQlFVVXNUMEZCVFR0QlFVTnNRaXhUUVVGUExHMUNRVUZOTEUxQlFVMHNRMEZCUXl4UFFVRlBMRU5CUVVNc1ZVRkJWU3hEUVVGRExFOUJRVThzUTBGQlFUdERRVU12UXpzN1FVRkZSQ3hUUVVGVExHRkJRV0VzUjBGQlJ6dEJRVU4yUWl4TlFVRkpMRzFDUVVGTkxFVkJRVVVzVDBGQlRUdEJRVU5zUWl4VFFVRlBMRzFDUVVGTkxFMUJRVTBzUTBGQlF5eFBRVUZQTEVOQlFVTXNWVUZCVlN4RFFVRkRMRlZCUVZVc1EwRkJRVHREUVVOc1JEczdRVUZGUkN4VFFVRlRMRTlCUVU4c1IwRkJSenRCUVVOcVFpeE5RVUZKTEcxQ1FVRk5MRVZCUVVVc1QwRkJUVHRCUVVOc1FpeFRRVUZQTEcxQ1FVRk5MRTFCUVUwc1EwRkJReXhKUVVGSkxFTkJRVUU3UTBGRGVrSTdPMEZCUlVRc1NVRkJTU3hKUVVGSkxFZEJRVWNzUTBGRFZDeHhRMEZCY1VNc1JVRkRja01zTUVOQlFUQkRMRU5CUXpORExFTkJRVUU3TzBGQlJVUXNTVUZCU1N4VlFVRlZMRWRCUVVjc1EwRkRaaXhKUVVGSkxFVkJRVVVzVDBGQlR5eEZRVUZGTEd0Q1FVRnJRaXhGUVVGRkxGZEJRVmNzUlVGQlJTeFhRVUZYTEVWQlFVVXNUVUZCVFN4RlFVTnVSU3hUUVVGVExFVkJRVVVzVlVGQlZTeEZRVUZGTEd0Q1FVRnJRaXhGUVVGRkxFOUJRVThzUlVGQlJTeFJRVUZSTEVWQlF6VkVMSE5DUVVGelFpeEZRVUZGTEdOQlFXTXNSVUZCUlN4TlFVRk5MRU5CUVVNc1EwRkJRVHM3UVVGRmFrUXNTVUZCU1N4RFFVRkRMRTlCUVU4c1EwRkJReXhIUVVGSExFTkJRVU1zU1VGQlNTeEZRVUZGTzBGQlEzSkNMRmxCUVZVc1EwRkJReXhKUVVGSkxFTkJRVU1zVDBGQlR5eERRVUZETEVOQlFVRTdRMEZEZWtJN08zRkNRVVZqT3p0QlFVVmlMRTFCUVVrc1JVRkJTaXhKUVVGSk8wRkJRMG9zVVVGQlRTeEZRVUZGTEVsQlFVa3NRMEZCUXl4TlFVRk5MRWxCUVVrc2MwSkJRVk1zU1VGQlNTeERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU03UVVGRGNrUXNaVUZCWVN4RlFVRmlMR0ZCUVdFN1FVRkRZaXhOUVVGSkxFVkJRVW9zU1VGQlNUdEJRVU5LTEU5QlFVc3NSVUZCVEN4TFFVRkxPMEZCUTB3c1VVRkJUU3hGUVVGT0xFMUJRVTA3UVVGRFRpeE5RVUZKTEVWQlFVb3NTVUZCU1R0QlFVTktMRlZCUVZFc1JVRkJVaXhSUVVGUk8wRkJRMUlzVFVGQlNTeEZRVUZLTEVsQlFVazdRVUZEU2l4WlFVRlZMRVZCUVZZc1ZVRkJWVHRCUVVOV0xGTkJRVThzUlVGQlVDeFBRVUZQTzBGQlExQXNVVUZCVFN4RlFVRkZMRzFDUVVGTk8wRkJRMlFzWTBGQldTeEZRVUZGTEZWQlFWVTdRVUZEZUVJc2FVSkJRV1VzUlVGQlJTeERRVUZETEcxQ1FVRnRRaXhGUVVGRkxGbEJRVmtzUlVGQlJTeGxRVUZsTEVWQlFVVXNZMEZCWXl4RlFVRkZMRU5CUVVNc1dVRkJXU3hGUVVGRkxHbENRVUZwUWl4RFFVRkRMRU5CUVVNN1FVRkRlRWdzZFVKQlFYRkNMRVZCUVVVc1owSkJRV2RDTzBGQlEzWkRMRmxCUVZVc1JVRkJWaXhWUVVGVk8wRkJRMVlzV1VGQlZTeEZRVUZGTEVOQlFVTXNhMEpCUVd0Q0xFVkJRVVVzYTBKQlFXdENMRVZCUVVVc2EwSkJRV3RDTEVOQlFVTTdRVUZEZUVVc1owSkJRV01zUlVGQlJTeERRVUZETEdOQlFXTXNSVUZCUlN4alFVRmpMRVZCUVVVc1UwRkJVeXhGUVVGRkxGbEJRVmtzUTBGQlF6dEJRVU42UlN4aFFVRlhMRVZCUVVVc1VVRkJVU3hEUVVGRExGRkJRVkVzUTBGQlF5eEpRVUZKTEVsQlFVa3NaMEpCUVdkQ08wTkJRM2hFSWl3aVptbHNaU0k2SW1kbGJtVnlZWFJsWkM1cWN5SXNJbk52ZFhKalpWSnZiM1FpT2lJaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SnBiWEJ2Y25RZ0oySmhZbVZzTDNCdmJIbG1hV3hzSjF4dWFXMXdiM0owSUdadmNtZGxJR1p5YjIwZ0oyWnZjbWRsSjF4dWFXMXdiM0owSUZOd1lYSnJUVVExSUdaeWIyMGdKM053WVhKckxXMWtOU2RjYm1sdGNHOXlkQ0J3Y21WbWN5Qm1jbTl0SUNjdUwzQnlaV1p6SjF4dVhHNXNaWFFnUmtWTVQwY2dQU0I3WEc0Z0lHdGxlVG9nSjJJek56STFNbVV6TURBeU1EUmlNREJoWkRZNU4yWmxNV1F6WWprM09XVXhKeXhjYmlBZ2NISnZhbVZqZERvZ0p6RTFKeXhjYmlBZ2NHbHVaMVJwYldWdmRYUTZJREV3SUNvZ05qQWdLaUF4TURBd1hHNTlYRzVjYm14bGRDQkhUa0ZTSUQwZ2UxeHVJQ0IxY213NklDZG9kSFJ3Y3pvdkwyZHVZWEl1WjNKaGJXMWhjbXg1TG1OdmJTY3NYRzRnSUhGaFZYSnNPaUFuYUhSMGNITTZMeTl4WVdkdVlYSXVaM0poYlcxaGNteDVMbU52YlNkY2JuMWNibHh1YkdWMElHMXdhMlY1SUQwZ0oyTXhNR1JrTmpSak9EZG1OekJsWmpVMU5qTmhOak5qTXpZNE56azNaVGhqSjF4dWJHVjBJRTFKV0ZCQlRrVk1JRDBnZTF4dUlDQnhZVXRsZVRvZ0p6ZGhOV001TldJMVkySmhNV0l5TWpWa01EQmpZek5pWVRGak5ERXdZemM0Snl4Y2JpQWdhMlY1T2lCdGNHdGxlU3hjYmlBZ1kyOXZhMmxsT2lCZ2JYQmZKSHR0Y0d0bGVYMWZiV2w0Y0dGdVpXeGdYRzU5WEc1Y2JtbG1JQ2doY0hKdlkyVnpjeTVsYm5ZdVVGSlBSQ2tnZTF4dUlDQkhUa0ZTTG5WeWJDQTlJRWRPUVZJdWNXRlZjbXhjYmx4dUlDQnNaWFFnYlhCclpYa2dQU0JOU1ZoUVFVNUZUQzV4WVV0bGVWeHVJQ0JOU1ZoUVFVNUZUQzVyWlhrZ1BTQnRjR3RsZVZ4dUlDQk5TVmhRUVU1RlRDNWpiMjlyYVdVZ1BTQmdiWEJmSkh0dGNHdGxlWDFmYldsNGNHRnVaV3hnWEc1OVhHNWNibXhsZENCVFZFRlVVME1nUFNCN1hHNGdJRlZTVERvZ0oyaDBkSEJ6T2k4dmMzUmhkSE10Y0hWaWJHbGpMbWR5WVcxdFlYSnNlUzVwYnk4bkxGeHVJQ0JRVWtWR1NWZzZJQ2RuY21GdGJXRnliSGt1ZFdrblhHNTlYRzVjYm14bGRDQkVRVkJKSUQwZ0oyaDBkSEJ6T2k4dlpHRjBZUzVuY21GdGJXRnliSGt1WTI5dEoxeHVYRzVzWlhRZ1lYQndJRDBnSjJoMGRIQnpPaTh2WVhCd0xtZHlZVzF0WVhKc2VTNWpiMjBuWEc1c1pYUWdZWFYwYUZWelpYSWdQU0FuYUhSMGNITTZMeTloZFhSb0xtZHlZVzF0WVhKc2VTNWpiMjB2ZFhObGNpZGNibXhsZENCM1pXeGpiMjFsUm1GdVpGTWdQU0FuYUhSMGNITTZMeTkzZDNjdVozSmhiVzFoY214NUxtTnZiUzloWm5SbGNsOXBibk4wWVd4c1gzQmhaMlVuWEc1c1pYUWdWVkpNVXlBOUlIdGNiaUFnWVhCd0xGeHVJQ0JqWVhCcE9pQW5kM056T2k4dlkyRndhUzVuY21GdGJXRnliSGt1WTI5dEwyWnlaV1YzY3ljc1hHNGdJR1JoY0dsTmFXMXBZem9nUkVGUVNTQXJJQ2N2WVhCcEwyMXBiV2xqSnl4Y2JpQWdaV1JwZEc5eU9pQmhjSEFnS3lBbkwzQnZjSFZ3TWljc1hHNGdJR1JwWTNScGIyNWhjbms2SUNkb2RIUndjem92TDJOaGNHa3VaM0poYlcxaGNteDVMbU52YlM5aGNHa3ZaR1ZtY3ljc1hHNGdJSFZ3WjNKaFpHVTZJQ2RvZEhSd2N6b3ZMM2QzZHk1bmNtRnRiV0Z5YkhrdVkyOXRMM1Z3WjNKaFpHVW5MRnh1SUNCaGRYUm9WWE5sY2l4Y2JpQWdZWFYwYUZObGRIUnBibWR6T2lCaGRYUm9WWE5sY2lBcklDY3ZjMlYwZEdsdVozTW5MRnh1SUNCaGRYUm9SM0p2ZFhBNklHRjFkR2hWYzJWeUlDc2dKeTluY205MWNDY3NYRzRnSUdGMWRHaFFhVzVuT2lCaGRYUm9WWE5sY2lBcklDY3ZjM2x1WXljc1hHNGdJR0YxZEdoRGNtVmhkR1ZCYm05dWVXMXZkWE02SUdGMWRHaFZjMlZ5SUNzZ0p5OWhibTl1ZVcxdmRYTW5MRnh1SUNCaGRYUm9RM0psWVhSbFVHRm5aVG9nSjJoMGRIQnpPaTh2WVhWMGFDNW5jbUZ0YldGeWJIa3VZMjl0TDNKbFpHbHlaV04wTFdGdWIyNTViVzkxY3o5c2IyTmhkR2x2YmowbklDc2dkMlZzWTI5dFpVWmhibVJUTEZ4dUlDQmtiMk56T2lCaGNIQWdLeUFuTDJSdlkzTW5MRnh1SUNCa2IyTnpRWEJwT2lBbmFIUjBjSE02THk5a2IzZ3VaM0poYlcxaGNteDVMbU52YlM5a2IyTjFiV1Z1ZEhNbkxGeHVJQ0J2Wm1ac2FXNWxPaUFuYUhSMGNITTZMeTlsWkM1bmNtRnRiV0Z5YkhrdVkyOXRMMlJ2ZDI1c2IyRmtMMlpwY21WbWIzZ3ZkWEJrWVhSbExtcHpiMjRuTEZ4dUlDQjNaV3hqYjIxbFF6b2dKMmgwZEhCek9pOHZkM2QzTG1keVlXMXRZWEpzZVM1amIyMHZaWGgwWlc1emFXOXVMWE4xWTJObGMzTW5MRnh1SUNCMWJtbHVjM1JoYkd3NklDZG9kSFJ3Y3pvdkwzZDNkeTVuY21GdGJXRnliSGt1WTI5dEwyVjRkR1Z1YzJsdmJpMTFibWx1YzNSaGJHd25MRnh1SUNCMWMyVnlUM0pCYm05dWVXMXZkWE02SUNkb2RIUndjem92TDJGMWRHZ3VaM0poYlcxaGNteDVMbU52YlM5MWMyVnlMMjl5WVc1dmJubHRiM1Z6Snl4Y2JpQWdZWFYwYUZOcFoyNXBiam9nSjJoMGRIQnpPaTh2WVhWMGFDNW5jbUZ0YldGeWJIa3VZMjl0TDJ4dloybHVKeXhjYmlBZ1lYVjBhRk5wWjI1MWNEb2dKMmgwZEhCek9pOHZZWFYwYUM1bmNtRnRiV0Z5YkhrdVkyOXRMM05wWjI1MWNDY3NYRzRnSUhOcFoyNXBiam9nSjJoMGRIQnpPaTh2ZDNkM0xtZHlZVzF0WVhKc2VTNWpiMjB2YzJsbmJtbHVKeXhjYmlBZ2MybG5iblZ3T2lBbmFIUjBjSE02THk5M2QzY3VaM0poYlcxaGNteDVMbU52YlM5emFXZHVkWEFuTEZ4dUlDQjNaV3hqYjIxbFJtRnVaRk1zWEc0Z0lISmhkbVZ1T2lBblptVnNiMmN1WjNKaGJXMWhjbXg1TG1sdkp5eGNiaUFnY21WbVpYSnlZV3c2SUNkb2RIUndjem92TDNkM2R5NW5jbUZ0YldGeWJIa3VZMjl0TDNKbFptVnljbUZzSnl4Y2JpQWdjR0ZuWlVOdmJtWnBaMVZ5YkRvZ0oyaDBkSEJ6T2k4dlpETmpkalJoT1dFNWQyZ3dZblF1WTJ4dmRXUm1jbTl1ZEM1dVpYUXZZbkp2ZDNObGNuQnNkV2RwYmk5amIyNW1hV2N1YW5OdmJpY3NYRzRnSUhKbGMyVjBVR0Z6YzNkdmNtUTZJQ2RvZEhSd2N6b3ZMM2QzZHk1bmNtRnRiV0Z5YkhrdVkyOXRMM0psYzJWMGNHRnpjM2R2Y21RbkxGeHVJQ0IwWlhKdGN6b2dKMmgwZEhCek9pOHZkM2QzTG1keVlXMXRZWEpzZVM1amIyMHZkR1Z5YlhNbkxGeHVJQ0J3YjJ4cFkzazZJQ2RvZEhSd2N6b3ZMM2QzZHk1bmNtRnRiV0Z5YkhrdVkyOXRMM0J5YVhaaFkza3RjRzlzYVdONUoxeHVmVnh1WEc1amIyNXpkQ0IxY214TFpYbHpJRDBnVDJKcVpXTjBMbXRsZVhNb1ZWSk1VeWxjYm1OdmJuTjBJSEJyWlhrZ1BTQnJaWGtnUFQ0Z1lGVlNURk11Skh0clpYbDlZRnh1WEc1d2NtVm1jeTVuWlhRb2RYSnNTMlY1Y3k1dFlYQW9jR3RsZVNrc0lISmxjM1ZzZENBOVBseHVJQ0IxY214TFpYbHpYRzRnSUNBZ0xtWnBiSFJsY2loMWNtd2dQVDRnY21WemRXeDBXM0JyWlhrb2RYSnNLVjBwWEc0Z0lDQWdMbVp2Y2tWaFkyZ29kWEpzSUQwK0lGVlNURk5iZFhKc1hTQTlJSEpsYzNWc2RGdHdhMlY1S0hWeWJDbGRLVnh1S1Z4dVhHNW1kVzVqZEdsdmJpQm5aWFJXWlhKemFXOXVLQ2tnZTF4dUlDQnBaaUFvSVdadmNtZGxLU0J5WlhSMWNtNWNiaUFnY21WMGRYSnVJR1p2Y21kbExtTnZibVpwWnk1dGIyUjFiR1Z6TG5CaGNtRnRaWFJsY25NdWRtVnljMmx2Ymx4dWZWeHVYRzVtZFc1amRHbHZiaUJuWlhSVmNHUmhkR1ZVYVcxbEtDa2dlMXh1SUNCcFppQW9JV1p2Y21kbEtTQnlaWFIxY201Y2JpQWdjbVYwZFhKdUlHWnZjbWRsTG1OdmJtWnBaeTV0YjJSMWJHVnpMbkJoY21GdFpYUmxjbk11ZFhCa1lYUmxWR2x0WlZ4dWZWeHVYRzVtZFc1amRHbHZiaUJuWlhSVmRXbGtLQ2tnZTF4dUlDQnBaaUFvSVdadmNtZGxLU0J5WlhSMWNtNWNiaUFnY21WMGRYSnVJR1p2Y21kbExtTnZibVpwWnk1MWRXbGtYRzU5WEc1Y2JteGxkQ0J1WlhkeklEMGdXMXh1SUNBblVHOXdMWFZ3SUdWa2FYUnZjaUJ1YjNjZ2IzQmxibk1nYVcxdFpXUnBZWFJsYkhrbkxGeHVJQ0FuV1c5MUlHMWhlU0JrYVhOaFlteGxJR1JsWm1sdWFYUnBiMjV6SUc5dUlHRnNiQ0J6YVhSbGN5ZGNibDFjYmx4dWJHVjBJSFZ6WlhKR2FXVnNaSE1nUFNCYlhHNGdJQ2RwWkNjc0lDZGxiV0ZwYkNjc0lDZHpkV0p6WTNKcGNIUnBiMjVHY21WbEp5d2dKMlpwY25OMFRtRnRaU2NzSUNkaGJtOXVlVzF2ZFhNbkxDQW5kSGx3WlNjc1hHNGdJQ2R3Y21WdGFYVnRKeXdnSjNObGRIUnBibWR6Snl3Z0ozSmxaMmx6ZEhKaGRHbHZia1JoZEdVbkxDQW5iV2x0YVdNbkxDQW5aM0p2ZFhCekp5eGNiaUFnSjJWNGRHVnVjMmx2YmtsdWMzUmhiR3hFWVhSbEp5d2dKMlpwZUdWa1gyVnljbTl5Y3ljc0lDZGxlSFF5SjExY2JseHVhV1lnS0NGd2NtOWpaWE56TG1WdWRpNVFVazlFS1NCN1hHNGdJSFZ6WlhKR2FXVnNaSE11Y0hWemFDZ25kRzlyWlc0bktWeHVmVnh1WEc1bGVIQnZjblFnWkdWbVlYVnNkQ0I3WEc0Z0lDOHZJR1JsWW5Wbk9pQjBjblZsTEZ4dUlDQnVaWGR6TEZ4dUlDQnVaWGR6U1dRNklHNWxkM011YkdWdVozUm9JQ1ltSUZOd1lYSnJUVVExTG1oaGMyZ29ibVYzY3k1cWIybHVLQ2RjWEc0bktTa3NYRzRnSUdkbGRGVndaR0YwWlZScGJXVXNYRzRnSUZWU1RGTXNYRzRnSUVaRlRFOUhMRnh1SUNCVFZFRlVVME1zWEc0Z0lFUkJVRWtzWEc0Z0lFMUpXRkJCVGtWTUxGeHVJQ0JIVGtGU0xGeHVJQ0JuWlhSV1pYSnphVzl1TEZ4dUlDQm5aWFJWZFdsa0xGeHVJQ0JwYzFSbGMzUTZJQ0ZtYjNKblpTeGNiaUFnYm1WNGRGWmxja05zWVhOek9pQW5aM0pmZG1WeVh6SW5MRnh1SUNCeVpYTjBjbWxqZEdWa1FYUjBjbk02SUZzblpHRjBZUzFuY21GdGJWOWxaR2wwYjNJbkxDQW5aR0YwWVMxbmNtRnRiU2NzSUNka1lYUmhMV2R5WVcxdFgybGtKeXdnSjJkeVlXMXRYMlZrYVhSdmNpY3NJRnNuWVhKcFlTMXNZV0psYkNjc0lDZFRaV0Z5WTJnZ1JtRmpaV0p2YjJzblhWMHNYRzRnSUhKbGMzUnlhV04wWldSUVlYSmxiblJCZEhSeWN6b2dKMXRrWVhSaExYSmxZV04wYVdSZEp5eGNiaUFnZFhObGNrWnBaV3hrY3l4Y2JpQWdaWGgwTW1keWIzVndjem9nV3ljd01ERmZaMkoxZEhSdmJsOXphRzkzSnl3Z0p6QXdNbDluWW5WMGRHOXVYM05vYjNjbkxDQW5NREF6WDJkaWRYUjBiMjVmYzJodmR5ZGRMRnh1SUNCbGVIUmxjbTVoYkVWMlpXNTBjem9nV3lkamFHRnVaMlZrTFhWelpYSW5MQ0FuWTJoaGJtZGxaQzF3YkdGdUp5d2dKMk5zWldGdWRYQW5MQ0FuWldScGRHOXlMV1pwZUNkZExGeHVJQ0JrWlhabGJHOXdiV1Z1ZERvZ1pHOWpkVzFsYm5RdWJHOWpZWFJwYjI0dWFHOXpkQ0E5UFNBbk1USTNMakF1TUM0eE9qTXhNVGNuWEc1OVhHNGlYWDA9IiwiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbmltcG9ydCBSZWFjdERPTSBmcm9tICdyZWFjdC1kb20nXG5pbXBvcnQge2lzRkYsIF9mLCBndWlkfSBmcm9tICcuL3V0aWwnXG5cblxuZnVuY3Rpb24gY3JlYXRlRWwoaHRtbCwgZG9jKSB7XG4gIGxldCBkaXYgPSAoZG9jIHx8IGRvY3VtZW50KS5jcmVhdGVFbGVtZW50KCdkaXYnKVxuICBkaXYuaW5uZXJIVE1MID0gaHRtbC50cmltKClcbiAgcmV0dXJuIGRpdi5maXJzdEVsZW1lbnRDaGlsZFxufVxuXG5mdW5jdGlvbiByZW5kZXJSZWFjdFdpdGhQYXJlbnQocmVhY3RFbGVtZW50LCBwYXJlbnQsIGlkLCB0eXBlID0gJ2RpdicpIHtcbiAgbGV0IHJlYWN0ID0gcGFyZW50W2lkXSB8fCB7fVxuICBwYXJlbnRbaWRdID0gcmVhY3RcbiAgaWYgKCFyZWFjdC5lbCkge1xuICAgIHJlYWN0LmVsID0gcGFyZW50Lm93bmVyRG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0eXBlKVxuICAgIHBhcmVudC5hcHBlbmRDaGlsZChyZWFjdC5lbClcbiAgfVxuICBsZXQgY29tcG9uZW50ID0gUmVhY3RET00ucmVuZGVyKFxuICAgIHJlYWN0RWxlbWVudCxcbiAgICByZWFjdC5lbFxuICApXG5cbiAgaWYgKCFyZWFjdC5yZW1vdmUpIHtcbiAgICByZWFjdC5yZW1vdmUgPSAoKSA9PiB7XG4gICAgICBkZWxldGUgcGFyZW50W2lkXVxuICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHJlYWN0LmVsKVxuICAgICAgUmVhY3RET00udW5tb3VudENvbXBvbmVudEF0Tm9kZShyZWFjdC5lbClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHtcbiAgICBjb21wb25lbnQsXG4gICAgcmVtb3ZlOiByZWFjdC5yZW1vdmUsXG4gICAgZWw6IHJlYWN0LmVsXG4gIH1cbn1cblxuZnVuY3Rpb24gaW5FbChlbCwgdGFyZ2V0LCBkZWVwID0gMTAwMCkge1xuICBsZXQgaSA9IDBcbiAgd2hpbGUgKGVsLnBhcmVudE5vZGUgJiYgaSA8IGRlZXApIHtcbiAgICBpZiAoICEodHlwZW9mIHRhcmdldCA9PSAnc3RyaW5nJykgJiYgdGFyZ2V0ID09IGVsICkgcmV0dXJuIHRydWVcbiAgICBpZiAoZWwuaWQgPT0gdGFyZ2V0IHx8IGVsID09IHRhcmdldCkgcmV0dXJuIHRydWVcbiAgICBlbCA9IGVsLnBhcmVudE5vZGVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gaGFzQ2xhc3MoX2VsLCBjbHMpIHtcbiAgaWYgKCFfZWwgfHwgX2VsLmNsYXNzTmFtZSA9PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZVxuICByZXR1cm4gX2VsLmNsYXNzTGlzdC5jb250YWlucyhjbHMpXG59XG5cbmZ1bmN0aW9uIHJlbW92ZUNsYXNzKF9lbCwgY2xzKSB7XG4gIGlmICghX2VsIHx8ICFfZWwuY2xhc3NMaXN0KSByZXR1cm5cbiAgcmV0dXJuIF9lbC5jbGFzc0xpc3QucmVtb3ZlKGNscylcbn1cblxuZnVuY3Rpb24gYWRkQ2xhc3MoX2VsLCBjbHMpIHtcbiAgaWYgKCFfZWwpIHJldHVyblxuICBpZiAoY2xzLmluZGV4T2YoJyAnKSAhPSAtMSkge1xuICAgIGNscyA9IGNscy5zcGxpdCgnICcpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIF9lbC5jbGFzc0xpc3QuYWRkKGNsc1tpXSlcbiAgICB9XG4gICAgcmV0dXJuXG4gIH1cbiAgcmV0dXJuIF9lbC5jbGFzc0xpc3QuYWRkKGNscylcbn1cblxuZnVuY3Rpb24gdG9nZ2xlQ2xhc3MoZWwsIGZsYWcsIGNscykge1xuICBpZiAoZmxhZykge1xuICAgIGFkZENsYXNzKGVsLCBjbHMpXG4gIH1cbiAgZWxzZSB7XG4gICAgcmVtb3ZlQ2xhc3MoZWwsIGNscylcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRQYXJlbnRCeVNlbChlbCwgc2VsKSB7XG4gIHdoaWxlIChlbCA9IGVsLnBhcmVudE5vZGUpIHtcbiAgICBpZiAobWF0Y2hlc1NlbGVjdG9yKGVsLCBzZWwpKSByZXR1cm4gZWxcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gcGFyZW50SXNDb250ZW50RWRpdGFibGUoZWwpIHtcbiAgd2hpbGUgKGVsID0gZWwucGFyZW50Tm9kZSkge1xuICAgIGlmIChpc0NvbnRlbnRFZGl0YWJsZShlbCkpIHJldHVybiBlbFxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBpc0NvbnRlbnRFZGl0YWJsZShlbCkge1xuICByZXR1cm4gZWwuY29udGVudEVkaXRhYmxlID09ICd0cnVlJyB8fCBlbC5jb250ZW50RWRpdGFibGUgPT0gJ3BsYWludGV4dC1vbmx5J1xufVxuXG5mdW5jdGlvbiBtYXRjaGVzU2VsZWN0b3IoZWwsIHNlbCkge1xuICBpZiAoZWwubWF0Y2hlcykgcmV0dXJuIGVsLm1hdGNoZXMoc2VsKVxuICBpZiAoZWwubWF0Y2hlc1NlbGVjdG9yKSByZXR1cm4gZWwubWF0Y2hlc1NlbGVjdG9yKHNlbClcbiAgaWYgKGVsLndlYmtpdE1hdGNoZXNTZWxlY3RvcikgcmV0dXJuIGVsLndlYmtpdE1hdGNoZXNTZWxlY3RvcihzZWwpXG4gIGlmIChlbC5tb3pNYXRjaGVzU2VsZWN0b3IpIHJldHVybiBlbC5tb3pNYXRjaGVzU2VsZWN0b3Ioc2VsKVxuICBpZiAod2luZG93LiQgJiYgd2luZG93LiQuaXMpIHJldHVybiB3aW5kb3cuJChlbCkuaXMoc2VsKVxufVxuXG5mdW5jdGlvbiBpc0ZvY3VzZWQoZWwpIHtcbiAgaWYgKGlzRkYoKSkgcmV0dXJuIGVsLm93bmVyRG9jdW1lbnQuYWN0aXZlRWxlbWVudCA9PSBlbFxuXG4gIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQudGFnTmFtZSA9PSAnSUZSQU1FJykge1xuICAgIHJldHVybiBlbCA9PT0gZWwub3duZXJEb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gIH1cbiAgZWxzZSBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50LnRhZ05hbWUgPT0gJ0JPRFknKSB7XG4gICAgcmV0dXJuIGVsID09PSBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG4gIH1cbiAgcmV0dXJuIGVsID09PSBkb2N1bWVudC5hY3RpdmVFbGVtZW50XG59XG5cblxubGV0IGxLZXkgPSBndWlkKCkvL1N5bWJvbCgnbGlzdGVuZXJzJykgc2FmYXJpIHRlc3RzIHd0ZlxuZnVuY3Rpb24gbGlzdGVuKGVsLCBldmVudCwgY2IsIHVuYmluZCwgYnViYmxlID0gZmFsc2UpIHtcbiAgaWYgKCFlbCkgcmV0dXJuXG4gIGlmIChfLmlzT2JqZWN0KGV2ZW50KSkge1xuICAgIHJldHVybiBfLmVhY2goZXZlbnQsICh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICBsaXN0ZW4oZWwsIGtleSwgdmFsdWUsIHVuYmluZClcbiAgICB9KS8vYXJncyBzaGlmdFxuICB9XG5cbiAgbGV0IGZ1bmMgPSB1bmJpbmQgPyAncmVtb3ZlRXZlbnRMaXN0ZW5lcicgOiAnYWRkRXZlbnRMaXN0ZW5lcidcbiAgbGV0IGxpc3RlbmVycyA9IGVsW2xLZXldIHx8IFtdXG4gIGVsW2xLZXldID0gbGlzdGVuZXJzXG4gIGlmICh1bmJpbmQpIHtcbiAgICBlbFtsS2V5XSA9IGxpc3RlbmVycy5maWx0ZXIobCA9PiAhKGwuZXZlbnQgPT0gZXZlbnQgJiYgbC5jYiA9PSBjYikpXG4gIH1cbiAgZWxzZSB7XG4gICAgbGlzdGVuZXJzLnB1c2goe2V2ZW50LCBjYn0pXG4gIH1cblxuICBlbFtmdW5jXShldmVudCwgY2IsIGJ1YmJsZSlcblxuICBpZiAoIXByb2Nlc3MuZW52LlBST0QpIHtcbiAgICAvL21lY2hhbmlzbSBmb3IgZmlyaW5nIGN1c3RvbSBldmVudHNcbiAgICBjYi5fX3dyYXBGdW5jID0gY2IuX193cmFwRnVuYyB8fCBmdW5jdGlvbihlKSB7XG4gICAgICBlID0gZSB8fCB7fVxuICAgICAgY2IoXy5leHRlbmQoe29yaWdpbmFsRXZlbnQ6IGUsIHByZXZlbnREZWZhdWx0OiBfZiwgc3RvcFByb3BhZ2F0aW9uOiBfZn0sIGUuZGV0YWlsKSlcbiAgICB9XG4gICAgZWxbZnVuY10oZXZlbnQgKyAnLWdyJywgY2IuX193cmFwRnVuYywgYnViYmxlKVxuICB9XG5cbiAgcmV0dXJuIHtlbCwgZXZlbnQsIGNiLCBidWJibGV9XG59XG5cbmZ1bmN0aW9uIHVubGlzdGVuKGVsLCBldmVudCwgY2IsIGJ1YmJsZSkge1xuICBpZiAoIWV2ZW50ICYmIGVsW2xLZXldKSB7XG4gICAgcmV0dXJuIGVsW2xLZXldLmVhY2gobCA9PiB1bmxpc3RlbihlbCwgbC5ldmVudCwgbC5jYiwgbC5idWJibGUpKVxuICB9XG4gIGxpc3RlbihlbCwgZXZlbnQsIGNiLCB0cnVlLCBidWJibGUpXG59XG5cbmZ1bmN0aW9uIG9uKC4uLmFyZ3MpIHtcbiAgdGhpcy5hZGRFdmVudExpc3RlbmVyKC4uLmFyZ3MpXG4gIHJldHVybiB7b2ZmOiAoKSA9PiB0aGlzOjpvZmYoLi4uYXJncyl9XG59XG5cbmZ1bmN0aW9uIG9mZiguLi5hcmdzKSB7XG4gIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lciguLi5hcmdzKVxufVxuXG5mdW5jdGlvbiBvbmNlKGV2ZW50LCBjYikge1xuICBsZXQgZG9uZSA9IGUgPT4ge1xuICAgIGNiKGUpXG4gICAgdGhpczo6b2ZmKGV2ZW50LCBkb25lKVxuICB9XG4gIHRoaXM6Om9uKGV2ZW50LCBkb25lKVxufVxuXG5mdW5jdGlvbiBpc1Zpc2libGUoZWwpIHtcbiAgbGV0IHN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbCwgbnVsbCksXG4gICAgdmlzaWJsZSA9IHN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ2Rpc3BsYXknKSAhPSAnbm9uZScgJiZcbiAgICAgIHN0eWxlLmdldFByb3BlcnR5VmFsdWUoJ3Zpc2liaWxpdHknKSAhPSAnaGlkZGVuJyAmJlxuICAgICAgKGVsLmNsaWVudEhlaWdodCA+IDApXG4gIHJldHVybiB2aXNpYmxlXG59XG5cbmZ1bmN0aW9uIGNzKG5hbWVzLCBjbHNQcm9jZXNzb3IgPSAoY2xzKSA9PiBjbHMpIHtcbiAgcmV0dXJuIF8ua2V5cyhuYW1lcylcbiAgICAuZmlsdGVyKGNscyA9PiBuYW1lc1tjbHNdKVxuICAgIC5tYXAoY2xzID0+IGNsc1Byb2Nlc3NvcihjbHMpKVxuICAgIC5qb2luKCcgJylcbn1cblxuXG5mdW5jdGlvbiBtYXliZUFkZFB4KG5hbWUsIHZhbHVlKSB7XG4gIHJldHVybiAodHlwZW9mIHZhbHVlID09ICdudW1iZXInICYmICFjc3NOdW1iZXJbZGFzaGVyaXplKG5hbWUpXSkgPyB2YWx1ZSArICdweCcgOiB2YWx1ZVxufVxuXG5mdW5jdGlvbiBjYW1lbGl6ZShzdHIpIHsgcmV0dXJuIHN0ci5yZXBsYWNlKC8tKyguKT8vZywgZnVuY3Rpb24obWF0Y2gsIGNocikgeyByZXR1cm4gY2hyID8gY2hyLnRvVXBwZXJDYXNlKCkgOiAnJyB9KSB9XG5cbmZ1bmN0aW9uIGNhbWVsaXplQXR0cnMob2JqKSB7XG4gIHJldHVybiBfLnRyYW5zZm9ybShvYmosIChyZXN1bHQsIHZhbHVlLCBrZXkpID0+IHJlc3VsdFtjYW1lbGl6ZShrZXkpXSA9IHZhbHVlKVxufVxuZnVuY3Rpb24gZGFzaGVyaXplKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLzo6L2csICcvJylcbiAgIC5yZXBsYWNlKC8oW0EtWl0rKShbQS1aXVthLXpdKS9nLCAnJDFfJDInKVxuICAgLnJlcGxhY2UoLyhbYS16XFxkXSkoW0EtWl0pL2csICckMV8kMicpXG4gICAucmVwbGFjZSgvXy9nLCAnLScpXG4gICAudG9Mb3dlckNhc2UoKVxufVxuXG5sZXQgY3NzTnVtYmVyID0geyAnY29sdW1uLWNvdW50JzogMSwgJ2NvbHVtbnMnOiAxLCAnZm9udC13ZWlnaHQnOiAxLCAnbGluZS1oZWlnaHQnOiAxLCAnb3BhY2l0eSc6IDEsICd6LWluZGV4JzogMSwgJ3pvb20nOiAxIH1cbmZ1bmN0aW9uIGNzcyhlbCwgcHJvcGVydHksIHZhbHVlKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgIGxldCBlbGVtZW50ID0gZWxcbiAgICBpZiAoIWVsZW1lbnQpIHJldHVyblxuICAgIGxldCBjb21wdXRlZFN0eWxlID0gZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50LCAnJylcbiAgICBpZiAodHlwZW9mIHByb3BlcnR5ID09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gZWxlbWVudC5zdHlsZVtjYW1lbGl6ZShwcm9wZXJ0eSldIHx8IGNvbXB1dGVkU3R5bGUuZ2V0UHJvcGVydHlWYWx1ZShwcm9wZXJ0eSlcbiAgICB9XG4gICAgZWxzZSBpZiAoXy5pc0FycmF5KHByb3BlcnR5KSkge1xuICAgICAgbGV0IHByb3BzID0ge31cbiAgICAgIF8uZWFjaChwcm9wZXJ0eSwgZnVuY3Rpb24odmFsLCBwcm9wKSB7XG4gICAgICAgIHByb3BzW2NhbWVsaXplKHZhbCldID0gKGVsZW1lbnQuc3R5bGVbY2FtZWxpemUodmFsKV0gfHwgY29tcHV0ZWRTdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKHZhbCkpXG4gICAgICB9KVxuICAgICAgcmV0dXJuIHByb3BzXG4gICAgfVxuICB9XG5cbiAgbGV0IHJlc3VsdCA9ICcnXG4gIGlmIChfLmlzU3RyaW5nKHByb3BlcnR5KSkge1xuICAgIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApIHtcbiAgICAgIGVsLnN0eWxlLnJlbW92ZVByb3BlcnR5KGRhc2hlcml6ZShwcm9wZXJ0eSkpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmVzdWx0ID0gZGFzaGVyaXplKHByb3BlcnR5KSArICc6JyArIG1heWJlQWRkUHgocHJvcGVydHksIHZhbHVlKVxuICAgIH1cbiAgfVxuICBlbHNlIHtcbiAgICBmb3IgKGxldCBrZXkgaW4gcHJvcGVydHkpIHtcbiAgICAgIGlmICghcHJvcGVydHlba2V5XSAmJiBwcm9wZXJ0eVtrZXldICE9PSAwKSB7XG4gICAgICAgIGVsLnN0eWxlLnJlbW92ZVByb3BlcnR5KGRhc2hlcml6ZShrZXkpKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJlc3VsdCArPSBkYXNoZXJpemUoa2V5KSArICc6JyArIG1heWJlQWRkUHgoa2V5LCBwcm9wZXJ0eVtrZXldKSArICc7J1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBlbC5zdHlsZS5jc3NUZXh0ICs9ICc7JyArIHJlc3VsdFxufVxuXG5cbmZ1bmN0aW9uIGdldFBhcmVudEJ5VGFnKGVsLCB0YWcpIHtcbiAgd2hpbGUgKGVsID0gZWwucGFyZW50Tm9kZSkge1xuICAgIGlmIChlbC50YWdOYW1lID09IHRhZykgcmV0dXJuIGVsXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudEJ5RGF0YShlbCwga2V5LCB2YWwpIHtcbiAgd2hpbGUgKGVsID0gZWwucGFyZW50Tm9kZSkge1xuICAgIGlmIChlbC5kYXRhc2V0ICYmIGVsLmRhdGFzZXRba2V5XSAmJiBlbC5kYXRhc2V0W2tleV0gPT0gdmFsKSByZXR1cm4gZWxcbiAgfVxufVxuXG5mdW5jdGlvbiByZXNvbHZlRWwoZWwsIGNscykge1xuICBpZiAoaGFzQ2xhc3MoZWwsIGNscykpIHJldHVybiBlbFxuICByZXR1cm4gZ2V0UGFyZW50KGVsLCBjbHMpXG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudChlbCwgY2xzKSB7XG4gIHdoaWxlIChlbCA9IGVsLnBhcmVudE5vZGUpIHtcbiAgICBpZiAoaGFzQ2xhc3MoZWwsIGNscykpIHJldHVybiBlbFxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBwYXJlbnRIYXNDbGFzcyhlbCwgY2xzKSB7XG4gIGlmICghZWwpIHJldHVybiBmYWxzZVxuICB3aGlsZSAoZWwucGFyZW50Tm9kZSkge1xuICAgIGlmIChoYXNDbGFzcyhlbCwgY2xzKSkgcmV0dXJuIGVsXG4gICAgZWwgPSBlbC5wYXJlbnROb2RlXG4gIH1cbiAgcmV0dXJuIGZhbHNlXG59XG5cbmZ1bmN0aW9uIGdldFBhcmVudEJ5RGVwdGgoZGVwdGggPSAxKSB7XG4gIHJldHVybiAhZGVwdGggPyB0aGlzIDogdGhpcy5wYXJlbnROb2RlOjpnZXRQYXJlbnRCeURlcHRoKC0tZGVwdGgpXG59XG5cbmZ1bmN0aW9uIGlzUGFyZW50KGVsLCBwYXJlbnQpIHtcbiAgaWYgKCFlbCkgcmV0dXJuIGZhbHNlXG4gIHdoaWxlIChlbC5wYXJlbnROb2RlKSB7XG4gICAgaWYgKHBhcmVudCA9PSBlbC5wYXJlbnROb2RlKSByZXR1cm4gZWxcbiAgICBlbCA9IGVsLnBhcmVudE5vZGVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gaW5zZXJ0QWZ0ZXIobmV3RWxlbWVudCwgdGFyZ2V0RWxlbWVudCkge1xuICAvL3RhcmdldCBpcyB3aGF0IHlvdSB3YW50IGl0IHRvIGdvIGFmdGVyLiBMb29rIGZvciB0aGlzIGVsZW1lbnRzIHBhcmVudC5cbiAgbGV0IHBhcmVudCA9IHRhcmdldEVsZW1lbnQucGFyZW50Tm9kZVxuXG4gIC8vaWYgdGhlIHBhcmVudHMgbGFzdENoaWxkIGlzIHRoZSB0YXJnZXRFbGVtZW50Li4uXG4gIGlmIChwYXJlbnQubGFzdENoaWxkID09IHRhcmdldEVsZW1lbnQpIHtcbiAgICAvL2FkZCB0aGUgbmV3RWxlbWVudCBhZnRlciB0aGUgdGFyZ2V0IGVsZW1lbnQuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKG5ld0VsZW1lbnQpXG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gZWxzZSB0aGUgdGFyZ2V0IGhhcyBzaWJsaW5ncywgaW5zZXJ0IHRoZSBuZXcgZWxlbWVudCBiZXR3ZWVuIHRoZSB0YXJnZXQgYW5kIGl0J3MgbmV4dCBzaWJsaW5nLlxuICAgIHBhcmVudC5pbnNlcnRCZWZvcmUobmV3RWxlbWVudCwgdGFyZ2V0RWxlbWVudC5uZXh0U2libGluZylcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnNlcnRCZWZvcmUobmV3RWxlbWVudCwgdGFyZ2V0RWxlbWVudCkge1xuICB0YXJnZXRFbGVtZW50LnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld0VsZW1lbnQsIHRhcmdldEVsZW1lbnQpXG59XG5cbmZ1bmN0aW9uIGVsZW1lbnRJbkRvY3VtZW50KGVsZW1lbnQsIGRvYykge1xuICBkb2MgPSBkb2MgfHwgZG9jdW1lbnRcbiAgd2hpbGUgKGVsZW1lbnQpIHtcbiAgICBpZiAoZWxlbWVudCA9PSBkb2MpIHJldHVybiB0cnVlXG4gICAgZWxlbWVudCA9IGVsZW1lbnQucGFyZW50Tm9kZVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBydW5LZXlFdmVudChlKSB7XG4gIGxldCBldnRcbiAgbGV0IGRlZmF1bHRFdmVudCA9IHtcbiAgICBjdHJsOiBmYWxzZSxcbiAgICBtZXRhOiBmYWxzZSxcbiAgICBzaGlmdDogZmFsc2UsXG4gICAgYWx0OiBmYWxzZVxuICB9XG4gIGUgPSBfLmV4dGVuZChkZWZhdWx0RXZlbnQsIGUpXG4gIC8vY29uc29sZS5sb2coJ2V2ZW50JywgZSlcbiAgdHJ5IHtcbiAgICBldnQgPSBlLmVsLm93bmVyRG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0tleUV2ZW50cycpXG4gICAgZXZ0LmluaXRLZXlFdmVudChcbiAgICAgIGUudHlwZSwgICAgICAgICAgICAgICAvLyBpbiBET01TdHJpbmcgdHlwZUFyZyxcbiAgICAgIHRydWUsICAgICAgICAgICAgICAgICAvLyBpbiBib29sZWFuIGNhbkJ1YmJsZUFyZyxcbiAgICAgIHRydWUsICAgICAgICAgICAgICAgICAgLy8gaW4gYm9vbGVhbiBjYW5jZWxhYmxlQXJnLFxuICAgICAgZS5lbC5vd25lckRvY3VtZW50LmRlZmF1bHRWaWV3LCAgICAgICAgICAgICAgICAgIC8vIGluIG5zSURPTUFic3RyYWN0VmlldyB2aWV3QXJnLCB3aW5kb3dcbiAgICAgIGUuY3RybCwgICAgICAgICAgICAgICAgIC8vIGluIGJvb2xlYW4gY3RybEtleUFyZyxcbiAgICAgIGUuYWx0LCAgICAgICAgICAgICAgICAgLy8gaW4gYm9vbGVhbiBhbHRLZXlBcmcsXG4gICAgICBlLnNoaWZ0LCAgICAgICAgICAgICAgICAgLy8gaW4gYm9vbGVhbiBzaGlmdEtleUFyZyxcbiAgICAgIGUubWV0YSwgICAgICAgICAgICAgICAgIC8vIGluIGJvb2xlYW4gbWV0YUtleUFyZyxcbiAgICAgIGUua2V5Q29kZSwgICAgICAgICAgICAgICAgICAvLyBrZXkgY29kZVxuICAgICAgZS5rZXlDb2RlKSAgICAgICAgICAgIC8vIGNoYXIgY29kZS5cbiAgfVxuICBjYXRjaCAoZXJyKSB7XG4gICAgZXZ0ID0gZS5lbC5vd25lckRvY3VtZW50LmNyZWF0ZUV2ZW50KCdVSUV2ZW50cycpXG4gICAgZXZ0LmluaXRVSUV2ZW50KCBlLm5hbWUsIHRydWUsIHRydWUsIHdpbmRvdywgMSlcbiAgICBldnQua2V5Q29kZSA9IGUua2V5Q29kZVxuICAgIGV2dC53aGljaCA9IGUua2V5Q29kZVxuICAgIGV2dC5jaGFyQ29kZSA9IGUua2V5Q29kZVxuICAgIGV2dC5jdHJsS2V5ID0gZS5jdHJsXG4gICAgZXZ0LmFsdEtleSA9IGUuYWx0XG4gICAgZXZ0LnNoaWZ0S2V5ID0gZS5zaGlmdFxuICAgIGV2dC5tZXRhS2V5ID0gZS5tZXRhS2V5XG4gIH1cblxuICBlLmVsLmRpc3BhdGNoRXZlbnQoZXZ0KVxufVxuXG5mdW5jdGlvbiBkb2NIaWRkZW4oZG9jKSB7XG4gIGlmICh0eXBlb2YgZG9jLmhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiBkb2MuaGlkZGVuXG4gIGlmICh0eXBlb2YgZG9jLm1vekhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiBkb2MubW96SGlkZGVuXG4gIGlmICh0eXBlb2YgZG9jLndlYmtpdEhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiBkb2Mud2Via2l0SGlkZGVuXG4gIGlmICh0eXBlb2YgZG9jLm1zSGlkZGVuICE9PSAndW5kZWZpbmVkJykgcmV0dXJuIGRvYy5tc0hpZGRlblxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gdmlzaWJpbGl0eUV2ZW50KGRvYykge1xuICBpZiAodHlwZW9mIGRvYy5oaWRkZW4gIT09ICd1bmRlZmluZWQnKSByZXR1cm4gJ3Zpc2liaWxpdHljaGFuZ2UnXG4gIGlmICh0eXBlb2YgZG9jLm1vekhpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAnbW96dmlzaWJpbGl0eWNoYW5nZSdcbiAgaWYgKHR5cGVvZiBkb2Mud2Via2l0SGlkZGVuICE9PSAndW5kZWZpbmVkJykgcmV0dXJuICd3ZWJraXR2aXNpYmlsaXR5Y2hhbmdlJ1xuICBpZiAodHlwZW9mIGRvYy5tc0hpZGRlbiAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAnbXN2aXNpYmlsaXR5Y2hhbmdlJ1xuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gdHJhbnNmb3JtUHJvcChkb2MgPSBkb2N1bWVudCkge1xuICBpZiAodHlwZW9mIGRvYy5ib2R5LnN0eWxlLnRyYW5zZm9ybSAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAndHJhbnNmb3JtJ1xuICBpZiAodHlwZW9mIGRvYy5ib2R5LnN0eWxlLldlYmtpdFRyYW5zZm9ybSAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAnV2Via2l0VHJhbnNmb3JtJ1xuICBpZiAodHlwZW9mIGRvYy5ib2R5LnN0eWxlLk1velRyYW5zZm9ybSAhPT0gJ3VuZGVmaW5lZCcpIHJldHVybiAnTW96VHJhbnNmb3JtJ1xufVxuXG4vKlxuICBlbCwgJ3dpZHRoJywgJ2hlaWdodCdcbiovXG5mdW5jdGlvbiBjb21wU3R5bGUoZWwsIC4uLnByb3BzKSB7XG4gIGlmICghZWwpIHJldHVyblxuICBsZXQgZG9jID0gZWwub3duZXJEb2N1bWVudFxuICBpZiAoIWRvYykgcmV0dXJuXG4gIGxldCB3aW4gPSBkb2MuZGVmYXVsdFZpZXcgfHwgd2luZG93XG4gIGlmICghd2luKSByZXR1cm5cbiAgbGV0IHMgPSB3aW4uZ2V0Q29tcHV0ZWRTdHlsZShlbCwgbnVsbClcbiAgaWYgKCFzKSByZXR1cm5cblxuICBpZiAocHJvcHMubGVuZ3RoID09IDEpIHJldHVybiBzLmdldFByb3BlcnR5VmFsdWUocHJvcHNbMF0pXG5cbiAgcmV0dXJuIHByb3BzLnJlZHVjZSgocmVzdWx0LCBwcm9wKSA9PiAoey4uLnJlc3VsdCwgW3Byb3BdOiBzLmdldFByb3BlcnR5VmFsdWUocHJvcCl9KSwge30pXG59XG5cbmZ1bmN0aW9uIGNsYXNzU2VsZWN0b3IoY2xzKSB7XG4gIHJldHVybiBjbHMuc3BsaXQoJyAnKS5tYXAoYyA9PiBjWzBdICE9ICcuJyA/ICcuJyArIGMgOiBjKS5qb2luKCcnKS50cmltKClcbn1cblxuZnVuY3Rpb24gc2VsZWN0b3JBbGwoY2xzLCAuLi5jbGFzc2VzKSB7XG4gIGlmIChjbGFzc2VzLmxlbmd0aCA+IDApIHtcbiAgICBsZXQgcmVzdWx0ID0gW11cbiAgICByZXN1bHQucHVzaChzZWxlY3RvckFsbChjbHMpKVxuICAgIGNsYXNzZXMuZm9yRWFjaChjID0+IHJlc3VsdC5wdXNoKHNlbGVjdG9yQWxsKGMpKSlcbiAgICByZXR1cm4gcmVzdWx0LmpvaW4oJywgJylcbiAgfVxuICAvL2NoZWNrIGRvdHNcbiAgY2xzID0gY2xzLnNwbGl0KCcsICcpLm1hcChjID0+IGNbMF0gIT0gJy4nID8gJy4nICsgYyA6IGMpLmpvaW4oJywgJykudHJpbSgpXG4gIHJldHVybiBgJHtjbHN9XFwsICR7Y2xzfSAqYFxufVxuXG5cbmZ1bmN0aW9uIG5vZGVJblRyZWUodHJlZSwgbm9kZSkge1xuICBpZiAobm9kZSA9PSB0cmVlKSByZXR1cm4gdHJ1ZVxuICBpZiAoIXRyZWUuY2hpbGRyZW4pIHJldHVybiBmYWxzZVxuICBmb3IgKGxldCBpID0gMDsgaSA8IHRyZWUuY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAobm9kZUluVHJlZSh0cmVlLmNoaWxkcmVuW2ldLCBub2RlKSkgcmV0dXJuIHRydWVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuXG5mdW5jdGlvbiB3YXRjaE5vZGVSZW1vdmUobm9kZSwgY2IpIHtcbiAgbGV0IGNhbGxiYWNrID0gZnVuY3Rpb24obXV0YXRpb25zKSB7XG4gICAgbXV0YXRpb25zLm1hcChmdW5jdGlvbihtcikge1xuICAgICAgaWYgKG1yLnJlbW92ZWROb2Rlcy5sZW5ndGggPT0gMCkgcmV0dXJuXG4gICAgICBsZXQgbm9kZXMgPSBtci5yZW1vdmVkTm9kZXMsXG4gICAgICAgIGxlbiA9IG5vZGVzLmxlbmd0aFxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBsZXQgdHJlZSA9IG5vZGVzW2ldXG4gICAgICAgIGlmICgodHJlZS5jb250YWlucyAmJiB0cmVlLmNvbnRhaW5zKG5vZGUpKSB8fCBub2RlSW5UcmVlKHRyZWUsIG5vZGUpKSB7XG4gICAgICAgICAgbW8uZGlzY29ubmVjdCgpXG4gICAgICAgICAgY2IoKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfSxcbiAgbW8gPSBuZXcgTXV0YXRpb25PYnNlcnZlcihjYWxsYmFjaylcblxuICBtby5vYnNlcnZlKG5vZGUub3duZXJEb2N1bWVudC5ib2R5LCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZX0pXG59XG5cbmZ1bmN0aW9uIHdoaWNoQW5pbWF0aW9uRW5kRXZlbnQoKSB7XG4gIGxldCB0LFxuICAgIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZmFrZWVsZW1lbnQnKSxcbiAgICB0cmFuc2l0aW9ucyA9IHtcbiAgICAgICdhbmltYXRpb24nOiAnYW5pbWF0aW9uZW5kJyxcbiAgICAgICdNb3pBbmltYXRpb24nOiAnYW5pbWF0aW9uZW5kJyxcbiAgICAgICdXZWJraXRBbmltYXRpb24nOiAnd2Via2l0QW5pbWF0aW9uRW5kJ1xuICAgIH1cblxuICBmb3IgKHQgaW4gdHJhbnNpdGlvbnMpIHtcbiAgICBpZiAoZWwuc3R5bGVbdF0gIT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdHJhbnNpdGlvbnNbdF1cbiAgICB9XG4gIH1cbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25FbmRFdmVudE5hbWUgKCkge1xuICBsZXQgaSwgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdmYWtlZWxlbWVudCcpLFxuICAgIHRyYW5zaXRpb25zID0ge1xuICAgICAgJ3RyYW5zaXRpb24nOiAndHJhbnNpdGlvbmVuZCcsXG4gICAgICAnTW96VHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcbiAgICAgICdXZWJraXRUcmFuc2l0aW9uJzogJ3dlYmtpdFRyYW5zaXRpb25FbmQnXG4gICAgfVxuXG4gIGZvciAoaSBpbiB0cmFuc2l0aW9ucykge1xuICAgIGlmICh0cmFuc2l0aW9ucy5oYXNPd25Qcm9wZXJ0eShpKSAmJiBlbC5zdHlsZVtpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdHJhbnNpdGlvbnNbaV1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkSWZyYW1lQ3NzKGZyYW1lRG9jKSB7XG4gIGlmICh0eXBlb2YgR1JfSU5MSU5FX1NUWUxFUyA9PSAndW5kZWZpbmVkJykgcmV0dXJuXG5cbiAgbGV0IHN0eWxlID0gZnJhbWVEb2MuY3JlYXRlRWxlbWVudCgnc3R5bGUnKVxuICAvKmVzbGludC1kaXNhYmxlKi9cbiAgc3R5bGUuaW5uZXJIVE1MID0gR1JfSU5MSU5FX1NUWUxFU1xuICAvKmVzbGludC1lbmFibGUqL1xuICB0cnkge1xuICAgIGZyYW1lRG9jLnF1ZXJ5U2VsZWN0b3IoJ2hlYWQnKS5hcHBlbmRDaGlsZChzdHlsZSlcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgY29uc29sZS5sb2coJ2NhblxcJ3QgYXBwZW5kIHN0eWxlJywgZSlcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXRHUkF0dHJpYnV0ZXMoZWwsIGlkKSB7XG4gIGVsLnNldEF0dHJpYnV0ZSgnZGF0YS1ncmFtbV9pZCcsIGlkKVxuICBlbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZ3JhbW0nLCB0cnVlKVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGlzVmlzaWJsZSxcbiAgY3JlYXRlRWwsXG4gIHJlbmRlclJlYWN0V2l0aFBhcmVudCxcbiAgaW5FbCxcbiAgaGFzQ2xhc3MsXG4gIGFkZENsYXNzLFxuICByZW1vdmVDbGFzcyxcbiAgdG9nZ2xlQ2xhc3MsXG4gIG1hdGNoZXNTZWxlY3RvcixcbiAgZ2V0UGFyZW50QnlTZWwsXG4gIGdldFBhcmVudEJ5RGF0YSxcbiAgZ2V0UGFyZW50QnlEZXB0aCxcbiAgcGFyZW50SXNDb250ZW50RWRpdGFibGUsXG4gIGlzQ29udGVudEVkaXRhYmxlLFxuICBpc0ZvY3VzZWQsXG4gIGxpc3RlbixcbiAgdW5saXN0ZW4sXG4gIG9uLCBvZmYsIG9uY2UsXG4gIGNzcyxcbiAgYWRkSWZyYW1lQ3NzLFxuICBzZXRHUkF0dHJpYnV0ZXMsXG4gIGNvbXBTdHlsZSxcbiAgY2FtZWxpemUsXG4gIGNhbWVsaXplQXR0cnMsXG4gIGluc2VydEJlZm9yZSxcbiAgaW5zZXJ0QWZ0ZXIsXG4gIGVsZW1lbnRJbkRvY3VtZW50LFxuICBnZXRQYXJlbnRCeVRhZyxcbiAgcGFyZW50SGFzQ2xhc3MsXG4gIGlzUGFyZW50LFxuICByZXNvbHZlRWwsXG4gIGdldFBhcmVudCxcbiAgcnVuS2V5RXZlbnQsXG4gIGRvY0hpZGRlbixcbiAgdmlzaWJpbGl0eUV2ZW50LFxuICB0cmFuc2Zvcm1Qcm9wLFxuICBjcyxcbiAgc2VsZWN0b3JBbGwsXG4gIGNsYXNzU2VsZWN0b3IsXG4gIHdhdGNoTm9kZVJlbW92ZSxcbiAgd2hpY2hBbmltYXRpb25FbmRFdmVudCxcbiAgdHJhbnNpdGlvbkVuZEV2ZW50TmFtZVxufVxuIiwiKGZ1bmN0aW9uIChnbG9iYWwpe1xuJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Wydmb3JnZSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnZm9yZ2UnXSA6IG51bGwpO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJaTl3Y205cVpXTjBMM055WXk5cWN5OXNhV0l2Wm05eVoyVXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanM3T3pzN08zRkNRVUZsTEU5QlFVOHNRMEZCUXl4UFFVRlBMRU5CUVVNaUxDSm1hV3hsSWpvaVoyVnVaWEpoZEdWa0xtcHpJaXdpYzI5MWNtTmxVbTl2ZENJNklpSXNJbk52ZFhKalpYTkRiMjUwWlc1MElqcGJJbVY0Y0c5eWRDQmtaV1poZFd4MElISmxjWFZwY21Vb0oyWnZjbWRsSnlsY2JpSmRmUT09IiwiaW1wb3J0IG1lc3NhZ2UgZnJvbSAnLi9tZXNzYWdlJ1xuaW1wb3J0IGZvcmdlIGZyb20gJy4vZm9yZ2UnXG5pbXBvcnQge2lzRnVuY3Rpb24sIGlzQmdPclBvcHVwLCBkZWxheX0gZnJvbSAnLi91dGlsJ1xuXG5cbmZ1bmN0aW9uIGN1cnJlbnRVcmwoKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICBsZXQgcmV0cnkgPSBzZXRUaW1lb3V0KCgpID0+IGZvcmdlLnRhYnMuZ2V0Q3VycmVudFRhYlVybChyZXNvbHZlKSwgMjAwMClcbiAgICBmb3JnZS50YWJzLmdldEN1cnJlbnRUYWJVcmwodXJsID0+IHtcbiAgICAgIGNsZWFyVGltZW91dChyZXRyeSlcbiAgICAgIHJlc29sdmUodXJsKVxuICAgIH0pXG4gIH0pXG59XG5cblxuZnVuY3Rpb24gZ2V0RG9tYWluKGVsLCBjYikge1xuICBpZiAoaXNGdW5jdGlvbihlbCkpIHtcbiAgICBjYiA9IGVsXG4gICAgZWwgPSAnJ1xuICB9XG5cbiAgaWYgKGNiKSB7XG4gICAgaWYgKCFpc0JnT3JQb3B1cCgpICYmIGZvcmdlKSB7XG4gICAgICBtZXNzYWdlLmVtaXRCYWNrZ3JvdW5kKCdnZXQtZG9tYWluJywge30sIGNiKVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChmb3JnZSAmJiBmb3JnZS50YWJzKSB7XG4gICAgICBjdXJyZW50VXJsKCkudGhlbih1cmwgPT4gY2IoZG9tYWluRnJvbVVybCh1cmwpKSlcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjYihkb21haW5Gcm9tRWwoZWwpKVxuICAgIH1cbiAgICByZXR1cm5cbiAgfVxuXG4gIHJldHVybiBkb21haW5Gcm9tRWwoZWwpXG59XG5cbmZ1bmN0aW9uIHByb21pc2VHZXREb21haW4oZWwpIHtcbiAgaWYgKCFpc0JnT3JQb3B1cCgpICYmIGZvcmdlKSB7XG4gICAgcmV0dXJuIG1lc3NhZ2UucHJvbWlzZUJhY2tncm91bmQoJ2dldC1kb21haW4nKVxuICB9XG5cbiAgaWYgKGZvcmdlICYmIGZvcmdlLnRhYnMpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yYWNlKFtcbiAgICAgIGN1cnJlbnRVcmwoKS50aGVuKGRvbWFpbkZyb21VcmwpLFxuICAgICAgZGVsYXkoMTAwMDApLnRoZW4oKCkgPT4ge3Rocm93IG5ldyBFcnJvcignUmVxdWVzdCB0byBmb3JnZS50YWJzLmdldEN1cnJlbnRUYWJVcmwgcmVqZWN0ZWQgYnkgdGltZW91dCcpfSlcbiAgICBdKVxuICB9XG5cbiAgcmV0dXJuIGRvbWFpbkZyb21FbChlbClcbn1cblxuZnVuY3Rpb24gZG9tYWluRnJvbUVsKGVsKSB7XG4gIGxldCBkb2MgPSAoZWwgJiYgZWwub3duZXJEb2N1bWVudCkgfHwgZG9jdW1lbnRcbiAgbGV0IGxvY2F0aW9uID0gZG9jLmxvY2F0aW9uIHx8IGRvYy5kZWZhdWx0Vmlldy5sb2NhdGlvblxuICBpZiAoIWxvY2F0aW9uKSByZXR1cm4gJydcblxuICByZXR1cm4gc3RyaXBEb21haW4obG9jYXRpb24uaG9zdG5hbWUpXG59XG5cbmZ1bmN0aW9uIGRvbWFpbkZyb21VcmwodXJsKSB7XG4gIGxldCBsb2NhdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKVxuICBsb2NhdGlvbi5ocmVmID0gdXJsXG4gIHJldHVybiBzdHJpcERvbWFpbihsb2NhdGlvbi5ob3N0bmFtZSlcbn1cblxuZnVuY3Rpb24gc3RyaXBEb21haW4oZG9tYWluKSB7XG4gIHJldHVybiBkb21haW4ucmVwbGFjZSgnd3d3LicsICcnKVxufVxuXG5mdW5jdGlvbiBnZXRVcmwoZWwpIHtcbiAgbGV0IGRvYyA9IChlbCAmJiBlbC5vd25lckRvY3VtZW50KSB8fCBkb2N1bWVudFxuICBsZXQgbG9jYXRpb24gPSBkb2MubG9jYXRpb24gfHwgZG9jLmRlZmF1bHRWaWV3LmxvY2F0aW9uXG4gIGlmICghbG9jYXRpb24pIHJldHVybiAnJ1xuXG4gIHJldHVybiBsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaFxufVxuXG5mdW5jdGlvbiBnZXRGYXZpY29uKCkge1xuICBsZXQgaXNBYnNvbHV0ZSA9IG5ldyBSZWdFeHAoJ14oPzpbYS16XSs6KT8vLycsICdpJylcbiAgbGV0IGZhdmljb24gPSAnJ1xuICBsZXQgbGlua3MgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbGluaycpXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgbGluayA9IGxpbmtzW2ldXG4gICAgbGV0IHJlbCA9ICdcIicgKyBsaW5rLmdldEF0dHJpYnV0ZSgncmVsJykgKyAnXCInXG4gICAgbGV0IHJlZ2V4cCA9IC8oXFxcImljb24gKXwoIGljb25cXFwiKXwoXFxcImljb25cXFwiKXwoIGljb24gKS9pXG4gICAgaWYgKHJlbC5zZWFyY2gocmVnZXhwKSAhPSAtMSkge1xuICAgICAgZmF2aWNvbiA9IGxpbmsuZ2V0QXR0cmlidXRlKCdocmVmJylcbiAgICB9XG4gIH1cbiAgaWYgKCFmYXZpY29uKSB7XG4gICAgZmF2aWNvbiA9ICdmYXZpY29uLmljbydcbiAgfVxuICBpZiAoaXNBYnNvbHV0ZS50ZXN0KGZhdmljb24pKSB7XG4gICAgcmV0dXJuIGZhdmljb25cbiAgfVxuICBpZiAoZmF2aWNvblswXSAhPSAnLycpIHtcbiAgICByZXR1cm4gJy8vJyArIGRvY3VtZW50LmxvY2F0aW9uLmhvc3QgKyBkb2N1bWVudC5sb2NhdGlvbi5wYXRobmFtZSArIGZhdmljb25cbiAgfVxuICByZXR1cm4gJy8vJyArIGRvY3VtZW50LmxvY2F0aW9uLmhvc3QgKyBmYXZpY29uXG59XG5cblxuZXhwb3J0IGRlZmF1bHQge1xuICBnZXREb21haW4sXG4gIGN1cnJlbnRVcmwsXG4gIHByb21pc2VHZXREb21haW4sXG4gIGRvbWFpbkZyb21VcmwsXG4gIGdldEZhdmljb24sXG4gIGdldFVybFxufVxuIiwiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuaW1wb3J0IGVtaXR0ZXIgZnJvbSAnZW1pdHRlcidcbmltcG9ydCBmb3JnZSBmcm9tICcuL2ZvcmdlJ1xuaW1wb3J0IHtkZWxheX0gZnJvbSAnLi91dGlsJ1xuXG5cbmxldCBlcnJvckVtaXR0ZXIgPSBlbWl0dGVyKHt9KVxubGV0IExpc3RlbmVycyA9IHt9XG5cblxuZnVuY3Rpb24gb25lKHR5cGUsIGNiKSB7XG4gIG9uKHR5cGUsIF9jYilcblxuICBmdW5jdGlvbiBfY2IoLi4uZGF0YSkge1xuICAgIG9mZih0eXBlLCBfY2IpXG4gICAgY2IuYXBwbHkodGhpcywgZGF0YSlcbiAgfVxufVxuXG5mdW5jdGlvbiBvbih0eXBlLCBjYWxsYmFjaywgZXJyb3IsIF9pc0JnKSB7XG4gIC8vdHlwZSAnX19iZ2Vycm9yJyBoYW5kbGVkIGJ5IGVycm9yRW1pdHRlclxuICBpZiAodHlwZSA9PSAnX19iZ2Vycm9yJykge1xuICAgIHJldHVybiBlcnJvckVtaXR0ZXIub24oJ19fYmdlcnJvcicsIGNhbGxiYWNrKVxuICB9XG5cbiAgbGV0IGxpc3RlbmVycyA9IExpc3RlbmVyc1t0eXBlXSA9IExpc3RlbmVyc1t0eXBlXSB8fCBbXVxuXG4gIGlmICghbGlzdGVuZXJzLmxlbmd0aCkge1xuICAgIHRyeSB7XG4gICAgICBmb3JnZS5tZXNzYWdlLmxpc3Rlbih0eXBlLCAoZGF0YSwgY2IpID0+IHtcbiAgICAgICAgZm9yIChsZXQgbCBvZiBsaXN0ZW5lcnMpIGwoZGF0YSwgY2IpXG4gICAgICB9LCBlcnJvciwgX2lzQmcpXG4gICAgfVxuICAgIGNhdGNoKGUpIHtcbiAgICAgIGVtaXRFcnJvcihlKVxuICAgIH1cbiAgfVxuXG4gIGxpc3RlbmVycy5wdXNoKGNhbGxiYWNrKVxufVxuXG5mdW5jdGlvbiBvZmYodHlwZSwgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGUgPT0gJ19fYmdlcnJvcicpIHtcbiAgICByZXR1cm4gZXJyb3JFbWl0dGVyLm9mZignX19iZ2Vycm9yJywgY2FsbGJhY2spXG4gIH1cblxuICBsZXQgbGlzdGVuZXJzID0gTGlzdGVuZXJzW3R5cGVdXG4gIGlmICghbGlzdGVuZXJzKSByZXR1cm5cbiAgbGV0IGkgPSBsaXN0ZW5lcnMuaW5kZXhPZihjYWxsYmFjaylcbiAgaWYgKGkgIT0gLTEpIGxpc3RlbmVycy5zcGxpY2UoaSwgMSlcbiAgaWYgKGxpc3RlbmVycy5sZW5ndGggPT0gMCkgZGVsZXRlIExpc3RlbmVyc1t0eXBlXVxufVxuXG5mdW5jdGlvbiBlbWl0VGFicyh0eXBlLCBjb250ZW50ID0ge30sIGNhbGxiYWNrLCBlcnJvcikge1xuICB0cnkge1xuICAgIGZvcmdlLm1lc3NhZ2UuYnJvYWRjYXN0KHR5cGUsIGNvbnRlbnQsIGNhbGxiYWNrLCBlcnJvcilcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgZW1pdEVycm9yKGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gZW1pdEZvY3VzZWRUYWIodHlwZSwgY29udGVudCwgY2FsbGJhY2ssIGVycm9yKSB7XG4gIC8vZm9jdXNzZWQgd3RmPyBodHRwOi8vd3d3LmZ1dHVyZS1wZXJmZWN0LmNvLnVrL2dyYW1tYXItdGlwL2lzLWl0LWZvY3Vzc2VkLW9yLWZvY3VzZWQvXG4gIHRyeSB7XG4gICAgZm9yZ2UubWVzc2FnZS50b0ZvY3Vzc2VkKHR5cGUsIGNvbnRlbnQsIGNhbGxiYWNrLCBlcnJvcilcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgZW1pdEVycm9yKGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gZW1pdEJhY2tncm91bmQodHlwZSwgY29udGVudCwgY2FsbGJhY2ssIGVycm9yKSB7XG4gIHRyeSB7XG4gICAgZm9yZ2UubWVzc2FnZS5icm9hZGNhc3RCYWNrZ3JvdW5kKHR5cGUsIGNvbnRlbnQsIGNhbGxiYWNrLCBlcnJvcilcbiAgfVxuICBjYXRjaChlKSB7XG4gICAgZW1pdEVycm9yKGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gcHJvbWlzZUJhY2tncm91bmQobWVzc2FnZSwgZGF0YSA9IHt9LCB0aW1lb3V0ID0gMTAwMDApIHtcbiAgbGV0IHJlcXVlc3QgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGZvcmdlLm1lc3NhZ2UuYnJvYWRjYXN0QmFja2dyb3VuZChtZXNzYWdlLCBkYXRhLCByZXNvbHZlLCByZWplY3QpXG4gICAgfVxuICAgIGNhdGNoKGUpIHtcbiAgICAgIHJlamVjdChlKVxuICAgICAgZW1pdEVycm9yKGUpXG4gICAgfVxuICB9KVxuXG4gIHJldHVybiBQcm9taXNlLnJhY2UoW1xuICAgIHJlcXVlc3QsXG4gICAgZGVsYXkodGltZW91dCkudGhlbigoKSA9PiB7dGhyb3cgbmV3IEVycm9yKGBSZXF1ZXN0IHRvIGJnIHBhZ2UgKCR7bWVzc2FnZX0pIHJlamVjdGVkIGJ5IHRpbWVvdXRgKX0pXG4gIF0pXG59XG5cbmxldCBlbWl0RXJyb3IgPSBfLnRocm90dGxlKGUgPT4gZXJyb3JFbWl0dGVyLmVtaXQoJ19fYmdlcnJvcicsIGUpLCAxMDAwKVxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgb24sXG4gIG9uZSxcbiAgb2ZmLFxuICBlbWl0RXJyb3IsXG4gIGVtaXRUYWJzLFxuICBlbWl0Rm9jdXNlZFRhYixcbiAgZW1pdEJhY2tncm91bmQsXG4gIHByb21pc2VCYWNrZ3JvdW5kXG59XG4iLCJpbXBvcnQge1NJVEVTX1RPX1JFTE9BRH0gZnJvbSAnLi9kZWZhdWx0cydcbmltcG9ydCB7Z2V0VXJsfSBmcm9tICcuLi9sb2NhdGlvbidcblxuY2xhc3MgQ29uZmlnQmFzZSB7XG4gIGluaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMubG9hZCgpXG4gIH1cblxuICBjaGVja0RvbWFpbihkb21haW4sIHVybCkge1xuICAgIGxldCBjb25maWcgPSB0aGlzLmdldFBhZ2VDb25maWcoZG9tYWluLCB1cmwpXG4gICAgcmV0dXJuIGNvbmZpZyA/IGNvbmZpZy5lbmFibGVkICE9PSBmYWxzZSA6IHRydWVcbiAgfVxuXG4gIGdldENvbmZpZ0J5UGFnZShwYWdlcywgdXJsID0gZ2V0VXJsKCkpIHtcbiAgICBpZiAoIXBhZ2VzKSByZXR1cm5cblxuICAgIGNvbnN0IGZpbmRVcmwgPSBPYmplY3Qua2V5cyhwYWdlcykuZmluZChwYWdlID0+IG5ldyBSZWdFeHAocGFnZSkudGVzdCh1cmwpKVxuXG4gICAgcmV0dXJuIHBhZ2VzW2ZpbmRVcmxdXG4gIH1cblxuICBnZXRQYWdlQ29uZmlnKGRvbWFpbiwgdXJsKSB7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5jb25maWcucGFnZUNvbmZpZ1tkb21haW5dIHx8XG4gICAgICB0aGlzLmNvbmZpZy5wYXJ0aWFscy5maW5kKGNvbmYgPT4gZG9tYWluLmluY2x1ZGVzKGNvbmYuZG9tYWluKSlcblxuICAgIGlmICghY29uZmlnIHx8IGNvbmZpZy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuIGNvbmZpZ1xuXG4gICAgaWYgKGNvbmZpZy5wYWdlcykgcmV0dXJuIHRoaXMuZ2V0Q29uZmlnQnlQYWdlKGNvbmZpZy5wYWdlcywgdXJsKSB8fCBjb25maWdcblxuICAgIHJldHVybiBjb25maWdcbiAgfVxuXG4gIGlzUGFnZVRvUmVsb2FkKHVybCkge1xuICAgIHJldHVybiBTSVRFU19UT19SRUxPQUQuaW5jbHVkZXModXJsKVxuICB9XG5cbiAgZ2V0IGNvbmZpZygpIHtcbiAgICByZXR1cm4gdGhpcy5fY29uZmlnXG4gIH1cblxuICBzZXQgY29uZmlnKGNvbmZpZykge1xuICAgIGlmICghY29uZmlnKSBjb25maWcgPSAoe3BhZ2VDb25maWc6IHt9LCBwYXJ0aWFsczogW119KVxuICAgIGlmICghY29uZmlnLnBhZ2VDb25maWcpIGNvbmZpZy5wYWdlQ29uZmlnID0ge31cbiAgICBpZiAoIWNvbmZpZy5wYXJ0aWFscykgY29uZmlnLnBhcnRpYWxzID0gW11cblxuICAgIHRoaXMuX2NvbmZpZyA9IGNvbmZpZ1xuICB9XG5cbiAgZ2V0Q3VycmVudFRpbWVzdGFtcCgpIHtcbiAgICByZXR1cm4gK25ldyBEYXRlKClcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDb25maWdCYXNlXG4iLCJpbXBvcnQgbG9jYWxmb3JhZ2UgZnJvbSAnLi9sb2NhbGZvcmFnZSdcbmltcG9ydCB7ZmV0Y2h9IGZyb20gJy4uL3JlcXVlc3QnXG5pbXBvcnQge1VSTFN9IGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7aXNWYWxpZCwgaW50ZXJ2YWx9IGZyb20gJy4vdXRpbHMnXG5pbXBvcnQge2RlbGF5fSBmcm9tICcuLi91dGlsJ1xuaW1wb3J0IENvbmZpZ0Jhc2UgZnJvbSAnLi9jb25maWctYmFzZSdcbmltcG9ydCB7ZGVjb3JhdGVDb25maWd9IGZyb20gJy4vZGVjb3JhdG9yJ1xuaW1wb3J0IHtjYWxsfSBmcm9tICcuLi90cmFja2luZy9pbmRleCdcbmltcG9ydCB7aXNTa2lwQ29uZmlnfSBmcm9tICcuL2RlZmF1bHRzJ1xuXG5jb25zdCBTWU5DX1RJTUVPVVQgPSAxNTAwXG5jb25zdCBBSkFYX1RJTUVPVVQgPSAxNTAwMFxuY29uc3QgQ09ORklHX01JU1NFRF9FUlJPUiA9ICdDb25maWcgbWlzc2VkJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBDb25maWdCZyBleHRlbmRzIENvbmZpZ0Jhc2Uge1xuICBzZXQgY29uZmlnKGNvbmZpZyA9IHt9KSB7XG4gICAgdGhpcy5fY29uZmlnID0gZGVjb3JhdGVDb25maWcoY29uZmlnKVxuICB9XG5cbiAgZ2V0IGNvbmZpZygpIHtcbiAgICByZXR1cm4gdGhpcy5fY29uZmlnXG4gIH1cblxuICAvKlxuICAgKiBNZXRob2QgdG8gbG9hZCBhY3R1YWwgY29uZmlnIGZpbGVcbiAgICpcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIDEuIEZpcnN0IGF0dGVtcHQgdG8gdXBkYXRlIEpTT04gZnJvbSBDRE4gaWYgaXQncyB0aW1lXG4gICAqIDIuIElmIG5vIHVwZGF0ZSBuZWVkZWQgb3IgQ0ROIGVycm9yIGNoZWNrIGlmIGl0J3MgY2FjaGVkIGluIG1lbW9yeVxuICAgKiAzLiBJZiBub3RoaW5nIGluIG1lbW9yeSAtIGxvYWQgY29uZmlnIGZyb20gbG9jYWwgc3RvcmFnZVxuICAgKi9cbiAgYXN5bmMgbG9hZChub3VwZGF0ZSA9IGZhbHNlKSB7XG4gICAgaWYgKGlzU2tpcENvbmZpZygpKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1VzZSBkZWZhdWx0IGNvbmZpZyBpbiBERUJVRyBtb2RlIChza2lwQ29uZmlnPXRydWUpJylcbiAgICAgIHRoaXMuY29uZmlnID0ge31cbiAgICAgIHJldHVybiB0aGlzLmNvbmZpZ1xuICAgIH1cblxuICAgIGxldCByYXdDb25maWdcblxuICAgIGlmICghbm91cGRhdGUpIHtcbiAgICAgIGxldCB7ZGF0ZSwgaW50ZXJ2YWw6IHVwZGF0ZUludGVydmFsfSA9IGF3YWl0IHRoaXMubGFzdFVwZGF0ZSgpXG5cbiAgICAgIGlmIChkYXRlICsgdXBkYXRlSW50ZXJ2YWwgPCBuZXcgRGF0ZSgpKSB7XG4gICAgICAgIGNvbnNvbGUuaW5mbygnQ29uZmlnOiBHb2luZyB0byB1cGRhdGUgY29uZmlnIGZyb20gQ0ROLi4uJylcbiAgICAgICAgcmF3Q29uZmlnID0gYXdhaXQgdGhpcy51cGRhdGVGcm9tQ0ROKClcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBsZXQgbWludXRlc1RvVXBkYXRlID0gKGRhdGUgKyB1cGRhdGVJbnRlcnZhbCAtIG5ldyBEYXRlKCkpIC8gMTAwMCAvIDYwXG4gICAgICAgIGNvbnNvbGUuaW5mbygnQ29uZmlnOiBObyB1cGRhdGUgbmVlZGVkLiBUaW1lIHRvIG5leHQgdXBkYXRlOiAnLCBtaW51dGVzVG9VcGRhdGUpXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc29sZS5pbmZvKCdDb25maWc6IFNraXAgQ0ROIHVwZGF0ZScpXG4gICAgfVxuXG4gICAgaWYgKCFyYXdDb25maWcgJiYgdGhpcy5jb25maWcpIHtcbiAgICAgIGNvbnNvbGUuaW5mbygnQ29uZmlnOiBVc2UgY29uZmlnIGZyb20gbWVtb3J5JywgdGhpcy5jb25maWcpXG4gICAgICByZXR1cm4gdGhpcy5jb25maWdcbiAgICB9XG5cbiAgICBpZiAoIXJhd0NvbmZpZykge1xuICAgICAgY29uc29sZS5pbmZvKCdDb25maWc6IExvYWRpbmcgZnJvbSBsb2NhbCBzdG9yYWdlLi4uJylcbiAgICAgIHJhd0NvbmZpZyA9IGF3YWl0IHRoaXMubG9hZEZyb21TdG9yYWdlKClcbiAgICB9XG5cbiAgICB0aGlzLmNvbmZpZyA9IHJhd0NvbmZpZ1xuXG4gICAgcmV0dXJuIHRoaXMuY29uZmlnXG4gIH1cblxuICAvKlxuICAgKiBVcGRhdGUgY29uZmlnIGZyb20gQ0ROXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBSZXR1cm4gdW5kZWZpbmVkIGJ5IHRpbWVvdXQsIGJ1dCBET04nVCBhYm9ydCBhamF4XG4gICAqIHRvIGFsbG93IGJhY2tncm91bmQgdXBkYXRlIGZvciBndXlzIHdpdGggc2xvdyBjb25uZWN0aW9uXG4gICAqL1xuICBhc3luYyB1cGRhdGVGcm9tQ0ROKCkge1xuICAgIGxldCBjb25maWdcblxuICAgIHRyeSB7XG4gICAgICBjb25maWcgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICB0aGlzLmxvYWRGcm9tQ0ROKCksXG4gICAgICAgIGRlbGF5KFNZTkNfVElNRU9VVCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW4ndCB3YWl0IGFueSBtb3JlIGZvciBhamF4IHJlc3BvbnNlYClcbiAgICAgICAgfSlcbiAgICAgIF0pXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBjb25zb2xlLndhcm4oZS5tZXNzYWdlKVxuICAgICAgY2FsbCgnc3RhdHNjLnVpLmluY3JlbWVudCcsICdzdGFiaWxpdHk6cGFnZV9jb25maWdfZmlyc3RfY2RuX3RpbWVvdXQnKVxuICAgICAgdGhpcy5zYXZlT25FcnJvcihgQ2FuJ3QgZ2V0IHZhbGlkIGNvbmZpZzogJHtlICYmIGUubWVzc2FnZX1gKVxuICAgIH1cblxuICAgIHJldHVybiBjb25maWdcbiAgfVxuXG4gIGFzeW5jIGxvYWRGcm9tQ0ROKCkge1xuICAgIGxldCBjb25maWdcblxuICAgIHRyeSB7XG4gICAgICBjYWxsKCdzdGF0c2MudWkuaW5jcmVtZW50JywgJ3N0YWJpbGl0eTpwYWdlX2NvbmZpZ19jZG5fdXBkYXRlJylcbiAgICAgIGNvbmZpZyA9IGF3YWl0IGZldGNoKFVSTFMucGFnZUNvbmZpZ1VybCwge3RpbWVvdXQ6IEFKQVhfVElNRU9VVH0pXG4gICAgICBpZiAoIWlzVmFsaWQoY29uZmlnKSkgdGhyb3cgbmV3IEVycm9yKCdDb25maWcgaXMgbm90IHZhbGlkJylcblxuICAgICAgdGhpcy5zYXZlKGNvbmZpZylcbiAgICAgIHJldHVybiBjb25maWdcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIGNhbGwoJ2ZlbG9nLmVycm9yJywgJ3BhZ2VfY29uZmlnX2Nkbl9sb2FkX2Vycm9yJywge21zZzogZSAmJiBlLm1lc3NhZ2V9KVxuICAgICAgdGhpcy5zYXZlT25FcnJvcihgQ2FuJ3QgZ2V0IHZhbGlkIGNvbmZpZzogJHtlICYmIGUubWVzc2FnZX1gLCBjb25maWcpXG4gICAgfVxuICB9XG5cbiAgYXN5bmMgbG9hZEZyb21TdG9yYWdlKCkge1xuICAgIHRyeSB7XG4gICAgICBsZXQgcmF3Q29uZmlnID0gYXdhaXQgbG9jYWxmb3JhZ2UuZ2V0SXRlbSgnY29uZmlnJylcblxuICAgICAgaWYgKCFyYXdDb25maWcpIHRocm93IG5ldyBFcnJvcihDT05GSUdfTUlTU0VEX0VSUk9SKVxuICAgICAgaWYgKCFpc1ZhbGlkKHJhd0NvbmZpZykpIHRocm93IG5ldyBFcnJvcignQ29uZmlnIG1hbGZvcm1lZCcpXG5cbiAgICAgIHJldHVybiByYXdDb25maWdcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlICYmIG5ldyBSZWdFeHAoQ09ORklHX01JU1NFRF9FUlJPUikudGVzdChlLm1lc3NhZ2UpKSB7XG4gICAgICAgIGNhbGwoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCAnc3RhYmlsaXR5OnBhZ2VfY29uZmlnX21pc3NlZF9mcm9tX3N0b3JhZ2UnKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNhbGwoJ2ZlbG9nLmVycm9yJywgJ3BhZ2VfY29uZmlnX2xvY2FsX3N0b3JhZ2VfbG9hZF9lcnJvcicsIHttc2c6IGUgJiYgZS5tZXNzYWdlfSlcbiAgICAgIH1cblxuICAgICAgY29uc29sZS53YXJuKGBDYW5ub3QgZ2V0IHZhbGlkIHBhZ2UgY29uZmlnIGZyb20gc3RvcmFnZTogJHtlICYmIGUubWVzc2FnZX1gKVxuICAgICAgcmV0dXJuIG51bGxcbiAgICB9XG4gIH1cblxuICBhc3luYyBzYXZlKGNvbmZpZykge1xuICAgIGxvY2FsZm9yYWdlLnNldEl0ZW0oJ2NvbmZpZycsIGNvbmZpZylcbiAgICBhd2FpdCB0aGlzLmZpcmVWZXJzaW9uVXBkYXRlKGNvbmZpZy52ZXJzaW9uKVxuICAgIHRoaXMuc2V0TGFzdFVwZGF0ZSh7XG4gICAgICBkYXRlOiB0aGlzLmdldEN1cnJlbnRUaW1lc3RhbXAoKSxcbiAgICAgIGludGVydmFsOiBjb25maWcuaW50ZXJ2YWwsXG4gICAgICBwcm90b2NvbFZlcnNpb246IGNvbmZpZy5wcm90b2NvbFZlcnNpb24sXG4gICAgICB2ZXJzaW9uOiBjb25maWcudmVyc2lvbixcbiAgICAgIHN0YXR1czogJ3N1Y2Nlc3MnXG4gICAgfSlcbiAgICBjb25zb2xlLmluZm8oJ0NvbmZpZyB1cGRhdGVkIGFuZCBzYXZlZCB0byBsb2NhbCBzdG9yYWdlIHN1Y2Nlc3NmdWxseTonLCBjb25maWcudmVyc2lvbiwgY29uZmlnKVxuICB9XG5cbiAgYXN5bmMgc2F2ZU9uRXJyb3IoaW5mbywgY29uZmlnKSB7XG4gICAgY29uc29sZS53YXJuKGluZm8sIGNvbmZpZylcblxuICAgIGxldCBtZXRhID0gYXdhaXQgdGhpcy5sYXN0VXBkYXRlKClcbiAgICB0aGlzLnNldExhc3RVcGRhdGUoe1xuICAgICAgZGF0ZTogdGhpcy5nZXRDdXJyZW50VGltZXN0YW1wKCksXG4gICAgICBpbnRlcnZhbDogbWV0YS5pbnRlcnZhbCxcbiAgICAgIHByb3RvY29sVmVyc2lvbjogbWV0YS5wcm90b2NvbFZlcnNpb24sXG4gICAgICB2ZXJzaW9uOiBtZXRhLnZlcnNpb24sXG4gICAgICBzdGF0dXM6ICdmYWlsZWQnLFxuICAgICAgaW5mbzogaW5mb1xuICAgIH0pXG4gIH1cblxuICBhc3luYyBmaXJlVmVyc2lvblVwZGF0ZShuZXdWZXJzaW9uKSB7XG4gICAgbGV0IG1ldGEgPSBhd2FpdCB0aGlzLmxhc3RVcGRhdGUoKVxuICAgIGlmIChuZXdWZXJzaW9uICYmIG1ldGEudmVyc2lvbiAhPSBuZXdWZXJzaW9uKSB7XG4gICAgICBjYWxsKCdmZWxvZy5pbmZvJywgJ3BhZ2VfY29uZmlnX3VwZGF0ZWQnLCBuZXdWZXJzaW9uKVxuICAgIH1cbiAgfVxuXG4gIGxhc3RVcGRhdGVXaXRoRGVmYXVsdChjb25maWcgPSB7fSkge1xuICAgIHJldHVybiB7XG4gICAgICBkYXRlOiBjb25maWcuZGF0ZSB8fCAwLFxuICAgICAgaW50ZXJ2YWw6IGludGVydmFsKGNvbmZpZy5pbnRlcnZhbCksXG4gICAgICBwcm90b2NvbFZlcnNpb246IGNvbmZpZy5wcm90b2NvbFZlcnNpb24sXG4gICAgICBzdGF0dXM6IGNvbmZpZy5zdGF0dXMsXG4gICAgICBpbmZvOiBjb25maWcuaW5mb1xuICAgIH1cbiAgfVxuXG4gIHNldExhc3RVcGRhdGUoY29uZmlnID0ge30pIHtcbiAgICBjb25maWcgPSB0aGlzLmxhc3RVcGRhdGVXaXRoRGVmYXVsdChjb25maWcpXG4gICAgdGhpcy5fbGFzdFVwZGF0ZSA9IGNvbmZpZ1xuICAgIHJldHVybiBsb2NhbGZvcmFnZS5zZXRJdGVtKCdsYXN0Q29uZmlnVXBkYXRlJywgY29uZmlnKVxuICB9XG5cbiAgYXN5bmMgbGFzdFVwZGF0ZSgpIHtcbiAgICBpZiAoIXRoaXMuX2xhc3RVcGRhdGUpIHtcbiAgICAgIHRoaXMuX2xhc3RVcGRhdGUgPSBhd2FpdCBsb2NhbGZvcmFnZS5nZXRJdGVtKCdsYXN0Q29uZmlnVXBkYXRlJylcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5sYXN0VXBkYXRlV2l0aERlZmF1bHQodGhpcy5fbGFzdFVwZGF0ZSB8fCB7fSlcbiAgfVxufVxuIiwiaW1wb3J0IENvbmZpZ0Jhc2UgZnJvbSAnLi9jb25maWctYmFzZSdcbmltcG9ydCB7cHJvbWlzZUJhY2tncm91bmR9IGZyb20gJy4uL21lc3NhZ2UnXG5pbXBvcnQge2RlY29yYXRlQ29uZmlnfSBmcm9tICcuL2RlY29yYXRvcidcbmltcG9ydCB7Y2FsbH0gZnJvbSAnLi4vdHJhY2tpbmcvaW5kZXgnXG5pbXBvcnQge2RlbGF5LCBpc1BvcHVwfSBmcm9tICcuLi91dGlsJ1xuXG5jb25zdCBUSU1FT1VUID0gMTU1MCAvLyAxcyB0byBhc2sgQ0ROLCA1MG1zIC0ganNcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29uZmlnUGFnZSBleHRlbmRzIENvbmZpZ0Jhc2Uge1xuXG4gIC8qXG4gICAqIExvYWQgY29uZmlndXJhdGlvbiBmcm9tIEJHIHBhZ2UuXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBQYXNzICdub3VwZGF0ZScgaW4gcG9wdXAgdG8gc2tpcCBDRE4uXG4gICAqIEZhbGxiYWNrIHRvIGRlZmF1bHQgaWYgbm8gdXBkYXRlIGluICdUSU1FT1VUJyBtc1xuICAgKi9cbiAgYXN5bmMgbG9hZCgpIHtcbiAgICB0cnkge1xuICAgICAgdGhpcy5jb25maWcgPSBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgICBwcm9taXNlQmFja2dyb3VuZCgnZ2V0LXBhZ2UtY29uZmlnJywge25vdXBkYXRlOiBpc1BvcHVwKCl9KSxcbiAgICAgICAgZGVsYXkoVElNRU9VVCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdSZXF1ZXN0IHRvIEJHIHJlamVjdGVkIGJ5IHRpbWVvdXQnKVxuICAgICAgICB9KVxuICAgICAgXSlcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgIGNhbGwoJ2ZlbG9nLmVycm9yJywgJ3BhZ2VfY29uZmlnX2xvYWRfZnJvbV9iZ19mYWlsJywge21zZzogZSAmJiBlLm1lc3NhZ2V9KVxuICAgICAgY29uc29sZS5lcnJvcignQ2Fubm90IGdldCBwYWdlIGNvbmZpZy4gRmFsbGJhY2sgdG8gZGVmYXVsdCcpXG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmNvbmZpZykge1xuICAgICAgdGhpcy5jb25maWcgPSBkZWNvcmF0ZUNvbmZpZyh7fSlcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7Z2V0VmVyc2lvbn0gZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IHtQQUdFX0NPTkZJR30gZnJvbSAnLi9kZWZhdWx0cydcbmltcG9ydCB7dmVyc2lvbkNvbXBhcmF0b3IsIGdldEJyb3dzZXJ9IGZyb20gJy4uL3V0aWwnXG5pbXBvcnQgZGVlcEV4dGVuZCBmcm9tICdkZWVwLWV4dGVuZCdcblxuZXhwb3J0IGZ1bmN0aW9uIGRlY29yYXRlQ29uZmlnKGNvbmZpZykge1xuICByZXR1cm4gUmF3Q29uZmlnRGVjb3JhdG9yLmRlY29yYXRlKGNvbmZpZylcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZXBDb3B5V2l0aERlZmF1bHQoY29uZmlnKSB7XG4gIGxldCBuZXdDb25maWcgPSBkZWVwRXh0ZW5kKHtwYWdlQ29uZmlnOiB7fX0sIGNvbmZpZyB8fCB7fSlcbiAgaWYgKCFuZXdDb25maWcucGFnZUNvbmZpZykgbmV3Q29uZmlnLnBhZ2VDb25maWcgPSB7fVxuICByZXR1cm4gbmV3Q29uZmlnXG59XG5cbmV4cG9ydCBjbGFzcyBSYXdDb25maWdEZWNvcmF0b3Ige1xuICBzdGF0aWMgZGVjb3JhdGUoY29uZmlnKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICd3aXRoRGVmYXVsdCcsXG4gICAgICAnZmlsdGVyQnlWZXJzaW9uJyxcbiAgICAgICdwYXJzZUJvb2xlYW5zJyxcbiAgICAgICdwYXJzZUJyb3dzZXJWYWx1ZXMnLFxuICAgICAgJ2ZpbHRlckludmFsaWRQYWdlUmVnZXhwJyxcbiAgICAgICdjb2xsZWN0UGFydGlhbHMnXG4gICAgXS5yZWR1Y2UoKGNvbmZpZywgbWV0aG9kKSA9PiB0aGlzW21ldGhvZF0oY29uZmlnKSwgY29uZmlnKVxuICB9XG5cbiAgc3RhdGljIHdpdGhEZWZhdWx0KGNvbmZpZykge1xuICAgIGNvbmZpZyA9IGRlZXBDb3B5V2l0aERlZmF1bHQoY29uZmlnKVxuICAgIGNvbnN0IGRlZmF1bHRDb25maWcgPSBQQUdFX0NPTkZJRyAmJiBQQUdFX0NPTkZJRy5wYWdlQ29uZmlnIHx8IHt9XG5cbiAgICBjb25maWcucGFnZUNvbmZpZyA9IGRlZXBFeHRlbmQoe30sIGRlZmF1bHRDb25maWcsIGNvbmZpZy5wYWdlQ29uZmlnKVxuXG4gICAgcmV0dXJuIGNvbmZpZ1xuICB9XG5cbiAgLypcbiAgICogRmlsdGVyIG91dCBydWxlcyB3aXRoIHZlcnNpb24gX2xlc3NfIHRoYW4gY3VycmVudCBleHRlbnNpb24gdmVyc2lvblxuICAgKiAnKicnIG9yIG1pc3NlZCBlcXVhbCB0byBhbGwgdmVyc2lvbnNcbiAgICovXG4gIHN0YXRpYyBmaWx0ZXJCeVZlcnNpb24oY29uZmlnLCB2ZXJzaW9uID0gZ2V0VmVyc2lvbigpKSB7XG4gICAgY29uZmlnID0gZGVlcENvcHlXaXRoRGVmYXVsdChjb25maWcpXG4gICAgbGV0IHBhZ2VDb25maWcgPSBjb25maWcucGFnZUNvbmZpZ1xuXG4gICAgY29uZmlnLnBhZ2VDb25maWcgPSBPYmplY3Qua2V5cyhwYWdlQ29uZmlnKVxuICAgICAgLmZpbHRlcigoa2V5KSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gcGFnZUNvbmZpZ1trZXldLFxuICAgICAgICAgIHJ1bGVWZXJzaW9uID0gdmFsdWUudmVyc2lvblxuXG4gICAgICAgIHJldHVybiAhcnVsZVZlcnNpb24gfHxcbiAgICAgICAgICBydWxlVmVyc2lvbiA9PT0gJyonIHx8XG4gICAgICAgICAgdmVyc2lvbkNvbXBhcmF0b3IodmVyc2lvbiwgcnVsZVZlcnNpb24pICE9PSAxXG4gICAgICB9KVxuICAgICAgLnJlZHVjZSgoaHNoLCBrZXkpID0+ICh7Li4uaHNoLCBba2V5XTogcGFnZUNvbmZpZ1trZXldfSksIHt9KVxuXG4gICAgcmV0dXJuIGNvbmZpZ1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlcyBzdHJpbmdzIHRvIGJvb2xlYW4gdmFsdWVzLlxuICAgKiBBcyBhIHJlc3VsdCB3b3VsZCBwcm9kdWNlIEpTT046XG4gICAqIHtcbiAgICogICAnZG9tYWluMS5jb20nOiB7IGVuYWJsZWQ6IGZhbHNlLCBtYXRjaFBhcnRPZlVybDogdHJ1ZSB9LFxuICAgKiAgICdkb21haW4yLmNvbSc6IHtcbiAgICogICAgIGVuYWJsZWQ6IHRydWUsXG4gICAqICAgICBtYXRjaFBhcnRPZlVybDogZmFsc2UsXG4gICAqICAgICBwYWdlczogeyAnKm5vdGVzJzogeyBlbmFibGVkOiBmYWxzZSB9IH1cbiAgICogICB9XG4gICAqIH1cbiAgICovXG4gIHN0YXRpYyBwYXJzZUJvb2xlYW5zKGNvbmZpZykge1xuICAgIGZ1bmN0aW9uIGlzVHJ1bHkodmFsdWUpIHtcbiAgICAgIHJldHVybiAhKHZhbHVlID09PSBmYWxzZSB8fCB2YWx1ZSA9PSAnZmFsc2UnKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGlzRXhpc3RzT3JGYWxzZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID8gaXNUcnVseSh2YWx1ZSkgOiBmYWxzZVxuICAgIH1cblxuICAgIGNvbmZpZyA9IGRlZXBDb3B5V2l0aERlZmF1bHQoY29uZmlnKVxuICAgIGxldCBwYWdlQ29uZmlnID0gY29uZmlnLnBhZ2VDb25maWdcblxuICAgIE9iamVjdC5rZXlzKHBhZ2VDb25maWcpXG4gICAgICAuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgIGlmICghcGFnZUNvbmZpZ1trZXldKSBwYWdlQ29uZmlnW2tleV0gPSB7fVxuXG4gICAgICAgIGNvbnN0IHJ1bGUgPSBwYWdlQ29uZmlnW2tleV1cblxuICAgICAgICBydWxlLmVuYWJsZWQgPSBpc1RydWx5KHJ1bGUuZW5hYmxlZClcbiAgICAgICAgcnVsZS5tYXRjaFBhcnRPZlVybCA9IGlzRXhpc3RzT3JGYWxzZShydWxlLm1hdGNoUGFydE9mVXJsKVxuXG4gICAgICAgIGlmIChydWxlLnBhZ2VzKSB7XG4gICAgICAgICAgT2JqZWN0LmtleXMocnVsZS5wYWdlcykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICAgICAgICBydWxlLnBhZ2VzW2tleV0uZW5hYmxlZCA9IGlzVHJ1bHkocnVsZS5wYWdlc1trZXldLmVuYWJsZWQpXG4gICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgIHJldHVybiBjb25maWdcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNhYmxlIHNwZWNpZmljIGRvbWFpbiBvbmx5IGlmIGNlcnRhaW4gYnJvd3NlciBub3Qgc3VwcG9ydGVkXG4gICAqIERvbid0IGNoYW5nZSBlbmFibGVkIHZhbHVlIGlmIGRvbWFpbiBsaXN0IG5vdCBzcGVjaWZpZWRcbiAgICpcbiAgICogQ29uZmlnIG1heSBjb250YWluc1xuICAgKiBgZGlzYWJsZWRCcm93c2VyOiBbJ2ZpcmVmb3gnLCAnY2hyb21lJywgJ3NhZmFyaSddYFxuICAgKi9cbiAgc3RhdGljIHBhcnNlQnJvd3NlclZhbHVlcyhjb25maWcsIGJyb3dzZXIgPSBnZXRCcm93c2VyKCkpIHtcbiAgICBjb25maWcgPSBkZWVwQ29weVdpdGhEZWZhdWx0KGNvbmZpZylcbiAgICBjb25zdCBwYWdlQ29uZmlnID0gY29uZmlnLnBhZ2VDb25maWdcblxuICAgIE9iamVjdC5rZXlzKHBhZ2VDb25maWcpLm1hcCgoa2V5KSA9PiB7XG4gICAgICBjb25zdCBkaXNhYmxlZCA9IHBhZ2VDb25maWdba2V5XSAmJiBwYWdlQ29uZmlnW2tleV0uZGlzYWJsZWRCcm93c2Vyc1xuXG4gICAgICBpZiAoZGlzYWJsZWQgJiYgZGlzYWJsZWQuaW5jbHVkZXMoYnJvd3NlcikpIHtcbiAgICAgICAgcGFnZUNvbmZpZ1trZXldLmVuYWJsZWQgPSBmYWxzZVxuICAgICAgfVxuICAgIH0pXG5cbiAgICByZXR1cm4gY29uZmlnXG4gIH1cblxuICBzdGF0aWMgZmlsdGVySW52YWxpZFBhZ2VSZWdleHAoY29uZmlnKSB7XG4gICAgY29uZmlnID0gZGVlcENvcHlXaXRoRGVmYXVsdChjb25maWcpXG4gICAgbGV0IHBhZ2VDb25maWcgPSBjb25maWcucGFnZUNvbmZpZ1xuXG4gICAgT2JqZWN0LmtleXMocGFnZUNvbmZpZykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBsZXQgY29uZmlnID0gcGFnZUNvbmZpZ1trZXldXG4gICAgICBpZiAoY29uZmlnLnBhZ2VzKSB7XG4gICAgICAgIGNvbmZpZy5wYWdlcyA9IE9iamVjdC5rZXlzKGNvbmZpZy5wYWdlcykuZmlsdGVyKChrZXkpID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoa2V5KVxuICAgICAgICAgIH1cbiAgICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgICAucmVkdWNlKChoc2gsIGtleSkgPT4gKHsuLi5oc2gsIFtrZXldOiBjb25maWcucGFnZXNba2V5XX0pLCB7fSlcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgcmV0dXJuIGNvbmZpZ1xuICB9XG5cbiAgc3RhdGljIGNvbGxlY3RQYXJ0aWFscyhjb25maWcpIHtcbiAgICBjb25maWcgPSBkZWVwQ29weVdpdGhEZWZhdWx0KGNvbmZpZylcbiAgICBjb25zdCBwYWdlQ29uZmlnID0gY29uZmlnLnBhZ2VDb25maWdcbiAgICBjb25maWcucGFydGlhbHMgPSBbXVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbmZpZy5wYXJ0aWFscyA9IE9iamVjdC5rZXlzKHBhZ2VDb25maWcpXG4gICAgICAgIC5maWx0ZXIoZG9tYWluID0+IHBhZ2VDb25maWdbZG9tYWluXS5tYXRjaFBhcnRPZlVybClcbiAgICAgICAgLm1hcChkb21haW4gPT4gKHtkb21haW4sIC4uLnBhZ2VDb25maWdbZG9tYWluXX0pKVxuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0Nhbm5vdCBjb2xsZWN0IHBhcnRpYWxzIGZyb20gY29uZmlnJylcbiAgICB9XG5cbiAgICByZXR1cm4gY29uZmlnXG4gIH1cbn1cbiIsIlxuaW1wb3J0IHtpc0ZGLCBpc1NhZmFyaX0gZnJvbSAnLi4vdXRpbCdcbmltcG9ydCBwcmVmcyBmcm9tICcuLi9wcmVmcydcblxuY29uc3QgUFJPVE9DT0xfVkVSU0lPTiA9ICcxLjAnXG5cbmNvbnN0IFNJVEVTX1RPX1JFTE9BRCA9IFtcbiAgJ21haWwuZ29vZ2xlLmNvbScsXG4gICd5YWhvby5jb20nLFxuICAnbWFpbC5saXZlLmNvbScsXG4gICdmYWNlYm9vay5jb20nLFxuICAndHVtYmxyLmNvbScsXG4gICdzdGFja292ZXJmbG93LmNvbScsXG4gICd3b3JkcHJlc3MuY29tJyxcbiAgJ3dvcmRwcmVzcy5vcmcnLFxuICAnYmxvZ3Nwb3QuY29tJ1xuXVxuXG5jb25zdCBVUERBVEVfMzBNID0gMzAgKiA2MCAqIDEwMDAgLy8gMzBtXG5jb25zdCBVUERBVEVfNU0gPSA1ICogNjAgKiAxMDAwIC8vIDVtXG5jb25zdCBQQUdFX0NPTkZJR19ERUZBVUxUX0lOVEVSVkFMID0gcHJvY2Vzcy5lbnYuUFJPRCA/IFVQREFURV8zME0gOiBVUERBVEVfNU1cblxuY29uc3QgUEFHRV9DT05GSUdfVVBEQVRFX0lOVEVSVkFMUyA9IFtcbiAgMTAgKiA2MCAqIDEwMDAsIC8vIDEwbVxuICBQQUdFX0NPTkZJR19ERUZBVUxUX0lOVEVSVkFMLFxuICA2MCAqIDYwICogMTAwMCwgLy8gNjBtXG4gIDMgKiA2MCAqIDYwICogMTAwMCwgLy8gM2hcbiAgMTIgKiA2MCAqIDYwICogMTAwMCwgLy8gMTJoXG4gIDI0ICogNjAgKiA2MCAqIDEwMDAsIC8vIDI0aFxuICAzNjUgKiAyNCAqIDYwICogNjAgKiAxMDAwIC8vIHR1cm4gb2ZmXG5dXG5cbmNvbnN0IFBBR0VfQ09ORklHID0ge1xuICBwYWdlQ29uZmlnOiB7XG4gICAgJ21haWwuZ29vZ2xlLmNvbSc6IHtcbiAgICAgIGZpZWxkczogW1xuICAgICAgICB7bmFtZTogJ3RvJ30sXG4gICAgICAgIHtuYW1lOiAnY2MnfSxcbiAgICAgICAge25hbWU6ICdiY2MnfSxcbiAgICAgICAge2NsYXNzTmFtZTogJ3ZPJ31cbiAgICAgIF0sXG4gICAgICBzdWJmcmFtZXM6IGZhbHNlXG4gICAgfSxcbiAgICAnbmV3dGFiJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICd2ZXJzaW9uJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdleHRlbnNpb25zJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdncmFtbWFybHkuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdmcmVlLmdyYW1tYXJseS5jb20nOiB7IGVuYWJsZWQ6IGZhbHNlIH0sXG4gICAgJ2FwcC5ncmFtbWFybHkuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdlZC5ncmFtbWFybHkuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdhcHAuYXNhbmEuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdob290c3VpdGUuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdwbHVzLmdvb2dsZS5jb20nOiB7XG4gICAgICBlbmFibGVkOiBmYWxzZVxuICAgICAgLy8sbWF0Y2hBdHRyOiAnZGF0YS1zYnhtPScxJydcbiAgICB9LFxuICAgICdjaHJvbWUuZ29vZ2xlLmNvbSc6IHsgZW5hYmxlZDogZmFsc2UgfSxcbiAgICAnZmFjZWJvb2suY29tJzoge1xuICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIG1pbkZpZWxkSGVpZ2h0OiAwLFxuICAgICAgcGFnZXM6IHtcbiAgICAgICAgJy4qXFwvbm90ZXMnOiB7XG4gICAgICAgICAgZW5hYmxlZDogZmFsc2VcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgJ29uZWRyaXZlLmxpdmUuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdkb2NzLmNvbSc6IHsgZW5hYmxlZDogZmFsc2UgfSxcbiAgICAnc3AuZG9jcy5jb20nOiB7IGVuYWJsZWQ6IGZhbHNlIH0sXG4gICAgJ2RvY3MuZ29vZ2xlLmNvbSc6IHsgZW5hYmxlZDogZmFsc2UsIHRyYWNrOiB0cnVlIH0sXG4gICAgJ2RyaXZlLmdvb2dsZS5jb20nOiB7XG4gICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgIHRyYWNrOiB0cnVlLFxuICAgICAgbWVzc2FnZTogJ1dlIGhvcGUgdG8gc3VwcG9ydCBHb29nbGUgRHJpdmUgYXBwcyBpbiB0aGUgZnV0dXJlLCBidXQgZm9yIG5vdyBwbGVhc2UgdXNlIHlvdXIgPGEgaHJlZj1cImh0dHBzOi8vYXBwLmdyYW1tYXJseS5jb20vXCI+R3JhbW1hcmx5IEVkaXRvcjwvYT4uJ1xuICAgIH0sXG4gICAgJ3RleHRlZGl0b3IubnNzcG90Lm5ldCc6IHsgZW5hYmxlZDogZmFsc2UgfSxcbiAgICAnanNiaW4uY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICdqc2ZpZGRsZS5uZXQnOiB7IGVuYWJsZWQ6IGZhbHNlIH0sXG4gICAgJ3F1b3JhLmNvbSc6IHsgZW5hYmxlZDogZmFsc2UgfSxcbiAgICAncGFwZXIuZHJvcGJveC5jb20nOiB7IGVuYWJsZWQ6IGZhbHNlIH0sXG4gICAgJ3R3aXR0ZXIuY29tJzogeyBlbmFibGVkOiAhaXNGRigpICYmICFpc1NhZmFyaSgpIH0sXG4gICAgJ2NvbS5zYWZhcmkuZ3JhbW1hcmx5c3BlbGxjaGVja2VyZ3JhbW1hcmNoZWNrZXInOiB7IGVuYWJsZWQ6IGZhbHNlLCBtYXRjaFBhcnRPZlVybDogdHJ1ZSB9LFxuICAgICdtYWlsLmxpdmUuY29tJzogeyBlbmFibGVkOiBmYWxzZSwgbWF0Y2hQYXJ0T2ZVcmw6IHRydWUgfSxcbiAgICAnaW1wZXJhdmkuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9LFxuICAgICd1c2VjYW52YXMuY29tJzogeyBlbmFibGVkOiBmYWxzZSB9XG4gIH1cbn1cblxubGV0IGlzU2tpcENvbmZpZyA9IGZhbHNlXG5cbmlmICghcHJvY2Vzcy5lbnYuUFJPRCkge1xuICAoYXN5bmMgKCkgPT4ge1xuICAgIGxldCBza2lwQ29uZmlnID0gYXdhaXQgcHJlZnMuZ2V0KCdza2lwQ29uZmlnJylcbiAgICBpc1NraXBDb25maWcgPSBza2lwQ29uZmlnID09IHRydWVcbiAgfSgpKVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIFBBR0VfQ09ORklHLFxuICBQQUdFX0NPTkZJR19ERUZBVUxUX0lOVEVSVkFMLFxuICBQQUdFX0NPTkZJR19VUERBVEVfSU5URVJWQUxTLFxuICBQUk9UT0NPTF9WRVJTSU9OLFxuICBTSVRFU19UT19SRUxPQUQsXG4gIGlzU2tpcENvbmZpZzogKCkgPT4gaXNTa2lwQ29uZmlnXG59XG4iLCJpbXBvcnQge2lzQmd9IGZyb20gJy4uL3V0aWwnXG5pbXBvcnQgQ29uZmlnUGFnZSBmcm9tICcuL2NvbmZpZy1wYWdlJ1xuaW1wb3J0IENvbmZpZ0JnIGZyb20gJy4vY29uZmlnLWJnJ1xuXG5sZXQgaW5pdCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGlzQmcoKSA/IG5ldyBDb25maWdCZygpIDogbmV3IENvbmZpZ1BhZ2UoKVxufVxuXG5leHBvcnQgZGVmYXVsdCBpbml0KClcbiIsImltcG9ydCBsb2NhbGZvcmFnZSBmcm9tICdsb2NhbGZvcmFnZSdcblxuY29uc3QgTkFNRSA9ICdHcmFtbWFybHknXG5jb25zdCBWRVJTSU9OID0gMS4wXG5jb25zdCBTVE9SRV9OQU1FID0gJ2NvbmZpZ3VyYXRpb24nXG5cbmxvY2FsZm9yYWdlLmNvbmZpZyh7XG4gIG5hbWU6IE5BTUUsXG4gIHZlcnNpb246IFZFUlNJT04sXG4gIHN0b3JlTmFtZTogU1RPUkVfTkFNRVxufSlcblxuZXhwb3J0IGRlZmF1bHQgbG9jYWxmb3JhZ2VcbiIsImltcG9ydCB7XG4gIFBBR0VfQ09ORklHX1VQREFURV9JTlRFUlZBTFMsXG4gIFBBR0VfQ09ORklHX0RFRkFVTFRfSU5URVJWQUwsXG4gIFBST1RPQ09MX1ZFUlNJT059IGZyb20gJy4vZGVmYXVsdHMnXG5cbmZ1bmN0aW9uIGlzVmFsaWQoY29uZmlnKSB7XG4gIGlmICghY29uZmlnIHx8ICFjb25maWcucGFnZUNvbmZpZykgcmV0dXJuXG4gIGlmICghT2JqZWN0LmtleXMoY29uZmlnKS5sZW5ndGgpIHJldHVyblxuICBpZiAoIU9iamVjdC5rZXlzKGNvbmZpZy5wYWdlQ29uZmlnKS5sZW5ndGgpIHJldHVyblxuICBpZiAoY29uZmlnLnByb3RvY29sVmVyc2lvbiAmJiBjb25maWcucHJvdG9jb2xWZXJzaW9uICE9PSBQUk9UT0NPTF9WRVJTSU9OKSByZXR1cm5cbiAgcmV0dXJuIHRydWVcbn1cblxuZnVuY3Rpb24gaW50ZXJ2YWwobXMpIHtcbiAgaWYgKFBBR0VfQ09ORklHX1VQREFURV9JTlRFUlZBTFMuaW5jbHVkZXMobXMpKSB7XG4gICAgcmV0dXJuIG1zXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuIFBBR0VfQ09ORklHX0RFRkFVTFRfSU5URVJWQUxcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGlzVmFsaWQsXG4gIGludGVydmFsXG59XG4iLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgc3R5bGUgZnJvbSAnc3R5bC9wb3B1cC1zZXR0aW5ncy5zdHlsJ1xuaW1wb3J0IHtVUkxTfSBmcm9tICcuLi9jb25maWcnXG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRm9vdGVyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGUuZm9vdGVyfT5cbiAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtzdHlsZS5uZXdfZG9jdW1lbnQgKyAnICcgKyBzdHlsZS5mb290ZXJfYnRufT48c3BhbiBjbGFzc05hbWU9e3N0eWxlLmJ0bl9sYmx9Pk5ldyBkb2N1bWVudDwvc3Bhbj48L3NwYW4+XG4gICAgICAgIDxhIHRhcmdldD0nX2JsYW5rJyBocmVmPXtVUkxTLmFwcH0gY2xhc3NOYW1lPXtzdHlsZS5teV9ncmFtbWFybHkgKyAnICcgKyBzdHlsZS5mb290ZXJfYnRuICsgJyBvcGVuR3JhbW1hcmx5J30+PHNwYW4gY2xhc3NOYW1lPXtzdHlsZS5idG5fbGJsfT5NeSBHcmFtbWFybHk8L3NwYW4+PC9hPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG4iLCJpbXBvcnQgc3R5bGUgZnJvbSAnc3R5bC9oZWFkZXItY29tcG9uZW50LnN0eWwnXG5pbXBvcnQge2dldEJyb3dzZXJ9IGZyb20gJy4uL3V0aWwnXG5pbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQge1VSTFN9IGZyb20gJy4uL2NvbmZpZydcblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIZWFkZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICByZW5kZXIoKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZS5oZWFkZXJ9PjxhIHRhcmdldD0nX2JsYW5rJyBocmVmPXtVUkxTLmFwcH0gY2xhc3NOYW1lPXtzdHlsZS5sb2dvICsgJyAnICsgc3R5bGVbZ2V0QnJvd3NlcigpXSArICcgb3BlbkdyYW1tYXJseSd9PjwvYT48L2Rpdj5cbiAgICApXG4gIH1cbn1cbiIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCdcbmltcG9ydCB7bmV3c30gZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IHN0eWxlIGZyb20gJ3N0eWwvcG9wdXAtc2V0dGluZ3Muc3R5bCdcblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOZXdzIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgcmVuZGVyKCkge1xuICAgIC8vU3RyaW5nLmZyb21DaGFyQ29kZSg4MjE3KSAtIGlzICfigJknXG4gICAgbGV0IG5ld3NJdGVtcyA9IG5ld3MubWFwKCh2YWx1ZSwgaSkgPT4ge1xuICAgICAgcmV0dXJuICg8bGkgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3tfX2h0bWw6IHZhbHVlfX0ga2V5PXtpfT48L2xpPilcbiAgICB9KVxuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZS5saW5lICsgJyAnICsgc3R5bGUubmV3c30+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZS5jbG9zZV9uZXdzfT48L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlLm5ld3NfY29udGVudH0+XG4gICAgICAgICAgICA8aDI+eydXaGF0JyArIFN0cmluZy5mcm9tQ2hhckNvZGUoODIxNykgKyAncyBuZXcgaW4gdGhpcyB1cGRhdGU6J308L2gyPlxuICAgICAgICAgICAgPHVsPlxuICAgICAgICAgICAgICB7bmV3c0l0ZW1zfVxuICAgICAgICAgICAgPC91bD5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH1cbn1cbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG53aW5kb3cuSVNfUE9QVVAgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcucG9wdXAnKTtcblxuZXhwb3J0c1snZGVmYXVsdCddID0gKGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF3aW5kb3cuSVNfUE9QVVApIHJldHVybjtcbiAgcmVxdWlyZSgnYmFiZWwvcG9seWZpbGwnKTtcbiAgdmFyIGZvcmdlID0gKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3dbJ2ZvcmdlJ10gOiB0eXBlb2YgZ2xvYmFsICE9PSBcInVuZGVmaW5lZFwiID8gZ2xvYmFsWydmb3JnZSddIDogbnVsbCk7XG4gIHZhciBlbWl0dGVyID0gcmVxdWlyZSgnZW1pdHRlcicpO1xuICB2YXIgcHJlZnMgPSByZXF1aXJlKCcuLi9wcmVmcycpO1xuICB2YXIgbmV3cyA9IHJlcXVpcmUoJy4uL2JnL25ld3MnKTtcblxuICB2YXIgX3JlcXVpcmUgPSByZXF1aXJlKCcuLi9sb2NhdGlvbicpO1xuXG4gIHZhciBnZXREb21haW4gPSBfcmVxdWlyZS5nZXREb21haW47XG5cbiAgdmFyIF9yZXF1aXJlMiA9IHJlcXVpcmUoJy4uL3RyYWNraW5nL2luZGV4Jyk7XG5cbiAgdmFyIGNhbGwgPSBfcmVxdWlyZTIuY2FsbDtcbiAgdmFyIGluaXRCZ09yUG9wdXAgPSBfcmVxdWlyZTIuaW5pdEJnT3JQb3B1cDtcblxuICB2YXIgX3JlcXVpcmUzID0gcmVxdWlyZSgnLi4vY29uZmlnJyk7XG5cbiAgdmFyIGdldFZlcnNpb24gPSBfcmVxdWlyZTMuZ2V0VmVyc2lvbjtcbiAgdmFyIFVSTFMgPSBfcmVxdWlyZTMuVVJMUztcblxuICB2YXIgcGFnZUNvbmZpZyA9IHJlcXVpcmUoJy4uL3BhZ2UtY29uZmlnJyk7XG5cbiAgdmFyIF9yZXF1aXJlNCA9IHJlcXVpcmUoJy4uL2JnL2Nocm9tZScpO1xuXG4gIHZhciBnZXRTZWxlY3RlZFRhYkZhdmljb24gPSBfcmVxdWlyZTQuZ2V0U2VsZWN0ZWRUYWJGYXZpY29uO1xuXG4gIHZhciBfcmVxdWlyZTUgPSByZXF1aXJlKCcuLi91dGlsJyk7XG5cbiAgdmFyIGlzV2luZG93cyA9IF9yZXF1aXJlNS5pc1dpbmRvd3M7XG4gIHZhciBpc1NhZmFyaSA9IF9yZXF1aXJlNS5pc1NhZmFyaTtcbiAgdmFyIGdldEJyb3dzZXIgPSBfcmVxdWlyZTUuZ2V0QnJvd3NlcjtcblxuICB2YXIgX3JlcXVpcmU2ID0gcmVxdWlyZSgnLi4vZG9tJyk7XG5cbiAgdmFyIGFkZENsYXNzID0gX3JlcXVpcmU2LmFkZENsYXNzO1xuICB2YXIgcmVtb3ZlQ2xhc3MgPSBfcmVxdWlyZTYucmVtb3ZlQ2xhc3M7XG4gIHZhciByZXNvbHZlRWwgPSBfcmVxdWlyZTYucmVzb2x2ZUVsO1xuICB2YXIgbGlzdGVuID0gX3JlcXVpcmU2Lmxpc3RlbjtcbiAgdmFyIHVubGlzdGVuID0gX3JlcXVpcmU2LnVubGlzdGVuO1xuXG4gIHZhciBTaWduaW4gPSByZXF1aXJlKCcuL3NpZ25pbicpO1xuICB2YXIgU2V0dGluZ3MgPSByZXF1aXJlKCcuL3NldHRpbmdzJylbJ2RlZmF1bHQnXTtcblxuICB2YXIgZGlhbG9nID0gdW5kZWZpbmVkO1xuXG4gICEoZnVuY3Rpb24gKCkge1xuICAgIGlmICh3aW5kb3cuSVNfQkcpIHJldHVybjtcblxuICAgIGRvY3VtZW50LnJlYWR5U3RhdGUgPT0gJ2xvYWRpbmcnID8gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIHN0YXJ0LCBmYWxzZSkgOiAhaXNTYWZhcmkoKSA/IHN0YXJ0KCkgOiB3aW5kb3cuc2FmYXJpLmFwcGxpY2F0aW9uLmFkZEV2ZW50TGlzdGVuZXIoJ3BvcG92ZXInLCBzdGFydCk7XG4gIH0pKCk7XG5cbiAgZnVuY3Rpb24gc3RhcnQoKSB7XG4gICAgcmV0dXJuIHJlZ2VuZXJhdG9yUnVudGltZS5hc3luYyhmdW5jdGlvbiBzdGFydCQoY29udGV4dCQyJDApIHtcbiAgICAgIHdoaWxlICgxKSBzd2l0Y2ggKGNvbnRleHQkMiQwLnByZXYgPSBjb250ZXh0JDIkMC5uZXh0KSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICBpZiAoIVwidHJ1ZVwiKSB7XG4gICAgICAgICAgICByZXF1aXJlKCcuLi90ZXN0LWFwaScpKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29udGV4dCQyJDAubmV4dCA9IDM7XG4gICAgICAgICAgcmV0dXJuIHJlZ2VuZXJhdG9yUnVudGltZS5hd3JhcChwYWdlQ29uZmlnLmluaXQoKSk7XG5cbiAgICAgICAgY2FzZSAzOlxuXG4gICAgICAgICAgYWRkQ2xhc3MoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCBnZXRCcm93c2VyKCkpO1xuICAgICAgICAgIGlzV2luZG93cygpICYmIGFkZENsYXNzKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ3dpbmRvd3MnKTtcblxuICAgICAgICAgIGlmIChpc1NhZmFyaSgpKSB7XG4gICAgICAgICAgICBpbml0QmdPclBvcHVwKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuKHdpbmRvdywgJ2NsaWNrJywgb3BlbkdyYW1tYXJseSk7XG4gICAgICAgICAgcmVuZGVyKCk7XG5cbiAgICAgICAgY2FzZSA4OlxuICAgICAgICBjYXNlICdlbmQnOlxuICAgICAgICAgIHJldHVybiBjb250ZXh0JDIkMC5zdG9wKCk7XG4gICAgICB9XG4gICAgfSwgbnVsbCwgdGhpcyk7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgdmFyIHVzZXJQcm9wcyA9IFsndG9rZW4nLCAnZ3JvdXBzJywgJ3N1YnNjcmlwdGlvbkZyZWUnLCAncHJlbWl1bScsICdmaXhlZF9lcnJvcnMnLCAnYW5vbnltb3VzJywgJ2VuYWJsZWREZWZzJywgJ3JlZ2lzdHJhdGlvbkRhdGUnLCAnc2Vlbk5ld3NWZXJzaW9uJywgJ2V4dGVuc2lvbkluc3RhbGxEYXRlJ107XG4gICAgcHJlZnMuZ2V0KHVzZXJQcm9wcywgc2hvdyk7XG4gIH1cblxuICBmdW5jdGlvbiBjbG9zZVBvcHVwKCkge1xuICAgIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGV2ZW50LmluaXRDdXN0b21FdmVudCgnY2xvc2UtcG9wdXAnLCB0cnVlLCB0cnVlLCB7fSk7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gb3BlbkdyYW1tYXJseShlKSB7XG4gICAgaWYgKCFyZXNvbHZlRWwoZS50YXJnZXQsICdvcGVuR3JhbW1hcmx5JykpIHJldHVybjtcbiAgICBmb3JnZS50YWJzLm9wZW4oVVJMUy5hcHApO1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBjbG9zZVBvcHVwKCk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVQb3B1cFNpemUoZWwpIHtcbiAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmhlaWdodCA9ICcnO1xuICAgIGV2ZW50LmluaXRDdXN0b21FdmVudCgndXBkYXRlLXdpbmRvdy1zaXplJywgdHJ1ZSwgdHJ1ZSwge1xuICAgICAgd2lkdGg6IGVsLmNsaWVudFdpZHRoLFxuICAgICAgaGVpZ2h0OiBlbC5jbGllbnRIZWlnaHQgLSAxXG4gICAgfSk7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICB9XG5cbiAgZnVuY3Rpb24gc2hvdyh1c2VyKSB7XG4gICAgY2FsbCgnZmVsb2cuaW5mbycsICdleHRlbnNpb25fYnRuX2NsaWNrJyk7XG5cbiAgICB2YXIgdmVyc2lvbiA9IGdldFZlcnNpb24oKTtcblxuICAgIHZhciBzaG93TmV3cyA9IG5ld3MuaXNTaG93TmV3c1RvVXNlcih1c2VyKTtcblxuICAgIHZhciBlbmFibGVkRGVmcyA9IHVzZXIuZW5hYmxlZERlZnM7XG5cbiAgICBpZiAoIXVzZXIgfHwgdXNlci5hbm9ueW1vdXMpIHtcbiAgICAgIHZhciBzID0gU2lnbmluKCk7XG4gICAgICB1cGRhdGVQb3B1cFNpemUoeyBjbGllbnRXaWR0aDogMzQ3LCBjbGllbnRIZWlnaHQ6IDMyNCB9KTtcbiAgICAgIHMub24oJ2xvYWQnLCB1cGRhdGVQb3B1cFNpemUpO1xuICAgICAgZGlhbG9nID0gcztcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAod2luZG93LmNocm9tZSAmJiB3aW5kb3cuY2hyb21lLnRhYnMpIHtcbiAgICAgIGdldFNlbGVjdGVkVGFiRmF2aWNvbihydW5TZXR0aW5ncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJ1blNldHRpbmdzKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcnVuU2V0dGluZ3MoZmF2aWNvbikge1xuICAgICAgZ2V0RG9tYWluKGZ1bmN0aW9uIChkb21haW4pIHtcbiAgICAgICAgcHJlZnMuZW5hYmxlZCgnJywgZG9tYWluLCBmdW5jdGlvbiAoZW5hYmxlZCkge1xuICAgICAgICAgIGlmIChmYXZpY29uICYmIGZhdmljb24uaW5kZXhPZignY2hyb21lOicpICE9IC0xKSBmYXZpY29uID0gbnVsbDtcbiAgICAgICAgICB2YXIgY3JlYXRlU2V0dGluZ3MgPSBmdW5jdGlvbiBjcmVhdGVTZXR0aW5ncyhpc0NoZWNraW5nRW5hYmxlZE9uRG9tYWluKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gU2V0dGluZ3Moe1xuICAgICAgICAgICAgICB1c2VyOiB1c2VyLFxuICAgICAgICAgICAgICBzaG93TmV3czogc2hvd05ld3MsXG4gICAgICAgICAgICAgIHZlcnNpb246IHZlcnNpb24sXG4gICAgICAgICAgICAgIGlzQ2hlY2tpbmdFbmFibGVkT25Eb21haW46IGlzQ2hlY2tpbmdFbmFibGVkT25Eb21haW4sXG4gICAgICAgICAgICAgIGVuYWJsZWQ6IGVuYWJsZWQsXG4gICAgICAgICAgICAgIGRvbWFpbjogZG9tYWluLFxuICAgICAgICAgICAgICBmYXZpY29uOiBmYXZpY29uLFxuICAgICAgICAgICAgICBlbmFibGVkRGVmczogZW5hYmxlZERlZnNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzdWx0Lm9uKCdsb2FkJywgZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgIHVwZGF0ZVBvcHVwU2l6ZShlbCk7XG4gICAgICAgICAgICAgIG1lLmVtaXQoJ2xvYWQnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmVzdWx0Lm9uKCdjbG9zZVBvcHVwJywgY2xvc2VQb3B1cCk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNhbGwoJ2duYXIuc2VuZCcsIGdldEJyb3dzZXIoKSArICdFeHQvYnJvd3NlclRvb2xiYXJCdXR0b25DbGlja2VkJywgeyBwYWdlRG9tYWluOiBkb21haW4gfSk7XG4gICAgICAgICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OkJyb3dzZXJfVG9vbGJhcl9CdXR0b25fQ2xpY2tlZCcsIHsgcGFnZURvbWFpbjogZG9tYWluIH0pO1xuXG4gICAgICAgICAgdmFyIGVuYWJsZWRPbkRvbWFpbiA9IHBhZ2VDb25maWcuY2hlY2tEb21haW4oZG9tYWluKTtcblxuICAgICAgICAgIGlmICghZW5hYmxlZE9uRG9tYWluKSB7XG4gICAgICAgICAgICBjYWxsKCdnbmFyLnNlbmQnLCBnZXRCcm93c2VyKCkgKyAnRXh0L2Jyb3dzZXJUb29sYmFyQnV0dG9uQ2xpY2tlZC91bnN1cHBvcnRlZCcsIHsgcGFnZURvbWFpbjogZG9tYWluIH0pO1xuICAgICAgICAgICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OlNldHRpbmdzX09wZW5fVW5zdXBwb3J0ZWRfRG9tYWluJywgeyBwYWdlRG9tYWluOiBkb21haW4gfSk7XG4gICAgICAgICAgICBjYWxsKCdmZWxvZy5pbmZvJywgJ3NldHRpbmdzX29wZW5fdW5zdXBwb3J0ZWRfZG9tYWluJywgeyBwYWdlRG9tYWluOiBkb21haW4gfSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZGlhbG9nID0gY3JlYXRlU2V0dGluZ3MoZW5hYmxlZE9uRG9tYWluKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgdW5saXN0ZW4od2luZG93LCAnY2xpY2snLCBvcGVuR3JhbW1hcmx5KTtcbiAgICByZW1vdmVDbGFzcyhkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQsICd3aW5kb3dzJyk7XG4gICAgZGlhbG9nICYmIGRpYWxvZy5yZW1vdmUoKTtcbiAgfVxuXG4gIHZhciBtZSA9IGVtaXR0ZXIoe1xuICAgIHNob3c6IHNob3csXG4gICAgcmVtb3ZlOiByZW1vdmUsXG4gICAgc3RhcnQ6IHN0YXJ0XG4gIH0pO1xuXG4gIHJldHVybiBtZTtcbn0pKCk7XG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YTphcHBsaWNhdGlvbi9qc29uO2NoYXJzZXQ6dXRmLTg7YmFzZTY0LGV5SjJaWEp6YVc5dUlqb3pMQ0p6YjNWeVkyVnpJanBiSWk5d2NtOXFaV04wTDNOeVl5OXFjeTlzYVdJdmNHOXdkWEF2Y0c5d2RYQXVhbk1pWFN3aWJtRnRaWE1pT2x0ZExDSnRZWEJ3YVc1bmN5STZJanM3T3pzN08wRkJRVUVzVFVGQlRTeERRVUZETEZGQlFWRXNSMEZCUnl4UlFVRlJMRU5CUVVNc1lVRkJZU3hEUVVGRExGRkJRVkVzUTBGQlF5eERRVUZCT3p0eFFrRkRiRU1zUTBGQlFTeFpRVUZYTzBGQlEzcENMRTFCUVVrc1EwRkJReXhOUVVGTkxFTkJRVU1zVVVGQlVTeEZRVUZGTEU5QlFVMDdRVUZETlVJc1UwRkJUeXhEUVVGRExHZENRVUZuUWl4RFFVRkRMRU5CUVVFN1FVRkRla0lzVFVGQlNTeExRVUZMTEVkQlFVY3NUMEZCVHl4RFFVRkRMRTlCUVU4c1EwRkJReXhEUVVGQk8wRkJRelZDTEUxQlFVa3NUMEZCVHl4SFFVRkhMRTlCUVU4c1EwRkJReXhUUVVGVExFTkJRVU1zUTBGQlFUdEJRVU5vUXl4TlFVRkpMRXRCUVVzc1IwRkJSeXhQUVVGUExFTkJRVU1zVlVGQlZTeERRVUZETEVOQlFVRTdRVUZETDBJc1RVRkJTU3hKUVVGSkxFZEJRVWNzVDBGQlR5eERRVUZETEZsQlFWa3NRMEZCUXl4RFFVRkJPenRwUWtGRFpDeFBRVUZQTEVOQlFVTXNZVUZCWVN4RFFVRkRPenROUVVGdVF5eFRRVUZUTEZsQlFWUXNVMEZCVXpzN2EwSkJRMk1zVDBGQlR5eERRVUZETEcxQ1FVRnRRaXhEUVVGRE96dE5RVUZ1UkN4SlFVRkpMR0ZCUVVvc1NVRkJTVHROUVVGRkxHRkJRV0VzWVVGQllpeGhRVUZoT3p0clFrRkRReXhQUVVGUExFTkJRVU1zVjBGQlZ5eERRVUZET3p0TlFVRjRReXhWUVVGVkxHRkJRVllzVlVGQlZUdE5RVUZGTEVsQlFVa3NZVUZCU2l4SlFVRkpPenRCUVVOeVFpeE5RVUZKTEZWQlFWVXNSMEZCUnl4UFFVRlBMRU5CUVVNc1owSkJRV2RDTEVOQlFVTXNRMEZCUVRzN2EwSkJRMW9zVDBGQlR5eERRVUZETEdOQlFXTXNRMEZCUXpzN1RVRkJhRVFzY1VKQlFYRkNMR0ZCUVhKQ0xIRkNRVUZ4UWpzN2EwSkJRMk1zVDBGQlR5eERRVUZETEZOQlFWTXNRMEZCUXpzN1RVRkJja1FzVTBGQlV5eGhRVUZVTEZOQlFWTTdUVUZCUlN4UlFVRlJMR0ZCUVZJc1VVRkJVVHROUVVGRkxGVkJRVlVzWVVGQlZpeFZRVUZWT3p0clFrRkRkVUlzVDBGQlR5eERRVUZETEZGQlFWRXNRMEZCUXpzN1RVRkJka1VzVVVGQlVTeGhRVUZTTEZGQlFWRTdUVUZCUlN4WFFVRlhMR0ZCUVZnc1YwRkJWenROUVVGRkxGTkJRVk1zWVVGQlZDeFRRVUZUTzAxQlFVVXNUVUZCVFN4aFFVRk9MRTFCUVUwN1RVRkJSU3hSUVVGUkxHRkJRVklzVVVGQlVUczdRVUZEZGtRc1RVRkJTU3hOUVVGTkxFZEJRVWNzVDBGQlR5eERRVUZETEZWQlFWVXNRMEZCUXl4RFFVRkJPMEZCUTJoRExFMUJRVWtzVVVGQlVTeEhRVUZITEU5QlFVOHNRMEZCUXl4WlFVRlpMRU5CUVVNc1YwRkJVU3hEUVVGQk96dEJRVVUxUXl4TlFVRkpMRTFCUVUwc1dVRkJRU3hEUVVGQk96dEJRVVZXTEVkQlFVVXNRMEZCUVN4WlFVRlhPMEZCUTFnc1VVRkJTU3hOUVVGTkxFTkJRVU1zUzBGQlN5eEZRVUZGTEU5QlFVMDdPMEZCUlhoQ0xGbEJRVkVzUTBGQlF5eFZRVUZWTEVsQlFVa3NVMEZCVXl4SFFVTm9ReXhSUVVGUkxFTkJRVU1zWjBKQlFXZENMRU5CUVVNc2EwSkJRV3RDTEVWQlFVVXNTMEZCU3l4RlFVRkZMRXRCUVVzc1EwRkJReXhIUVVNelJDeERRVUZETEZGQlFWRXNSVUZCUlN4SFFVRkhMRXRCUVVzc1JVRkJSU3hIUVVGSExFMUJRVTBzUTBGQlF5eE5RVUZOTEVOQlFVTXNWMEZCVnl4RFFVRkRMR2RDUVVGblFpeERRVUZETEZOQlFWTXNSVUZCUlN4TFFVRkxMRU5CUVVNc1EwRkJRVHRIUVVOeVJpeERRVUZCTEVWQlFVVXNRVUZCUXl4RFFVRkJPenRCUVVWS0xGZEJRV1VzUzBGQlN6czdPenRCUVVOc1FpeGpRVUZKTEVOQlFVTXNUMEZCVHl4RFFVRkRMRWRCUVVjc1EwRkJReXhKUVVGSkxFVkJRVVU3UVVGRGNrSXNiVUpCUVU4c1EwRkJReXhoUVVGaExFTkJRVU1zUlVGQlJTeERRVUZCTzFkQlEzcENPenM3TUVOQlJVc3NWVUZCVlN4RFFVRkRMRWxCUVVrc1JVRkJSVHM3T3p0QlFVVjJRaXhyUWtGQlVTeERRVUZETEZGQlFWRXNRMEZCUXl4bFFVRmxMRVZCUVVVc1ZVRkJWU3hGUVVGRkxFTkJRVU1zUTBGQlFUdEJRVU5vUkN4dFFrRkJVeXhGUVVGRkxFbEJRVWtzVVVGQlVTeERRVUZETEZGQlFWRXNRMEZCUXl4bFFVRmxMRVZCUVVVc1UwRkJVeXhEUVVGRExFTkJRVUU3TzBGQlJUVkVMR05CUVVrc1VVRkJVU3hGUVVGRkxFVkJRVVU3UVVGRFpDeDVRa0ZCWVN4RlFVRkZMRU5CUVVFN1YwRkRhRUk3TzBGQlJVUXNaMEpCUVUwc1EwRkJReXhOUVVGTkxFVkJRVVVzVDBGQlR5eEZRVUZGTEdGQlFXRXNRMEZCUXl4RFFVRkJPMEZCUTNSRExHZENRVUZOTEVWQlFVVXNRMEZCUVRzN096czdPenRIUVVOVU96dEJRVVZFTEZkQlFWTXNUVUZCVFN4SFFVRkhPMEZCUTJoQ0xGRkJRVWtzVTBGQlV5eEhRVUZITEVOQlEyUXNUMEZCVHl4RlFVRkZMRkZCUVZFc1JVRkJSU3hyUWtGQmEwSXNSVUZCUlN4VFFVRlRMRVZCUVVVc1kwRkJZeXhGUVVOb1JTeFhRVUZYTEVWQlFVVXNZVUZCWVN4RlFVRkZMR3RDUVVGclFpeEZRVUZGTEdsQ1FVRnBRaXhGUVVOcVJTeHpRa0ZCYzBJc1EwRkJReXhEUVVGQk8wRkJRM3BDTEZOQlFVc3NRMEZCUXl4SFFVRkhMRU5CUVVNc1UwRkJVeXhGUVVGRkxFbEJRVWtzUTBGQlF5eERRVUZCTzBkQlF6TkNPenRCUVVWRUxGZEJRVk1zVlVGQlZTeEhRVUZITzBGQlEzQkNMRkZCUVVrc1MwRkJTeXhIUVVGSExGRkJRVkVzUTBGQlF5eFhRVUZYTEVOQlFVTXNZVUZCWVN4RFFVRkRMRU5CUVVFN1FVRkRMME1zVTBGQlN5eERRVUZETEdWQlFXVXNRMEZCUXl4aFFVRmhMRVZCUVVVc1NVRkJTU3hGUVVGRkxFbEJRVWtzUlVGQlJTeEZRVUZGTEVOQlFVTXNRMEZCUVR0QlFVTndSQ3haUVVGUkxFTkJRVU1zWlVGQlpTeERRVUZETEdGQlFXRXNRMEZCUXl4TFFVRkxMRU5CUVVNc1EwRkJRVHRIUVVNNVF6czdRVUZIUkN4WFFVRlRMR0ZCUVdFc1EwRkJReXhEUVVGRExFVkJRVVU3UVVGRGVFSXNVVUZCU1N4RFFVRkRMRk5CUVZNc1EwRkJReXhEUVVGRExFTkJRVU1zVFVGQlRTeEZRVUZGTEdWQlFXVXNRMEZCUXl4RlFVRkZMRTlCUVUwN1FVRkRha1FzVTBGQlN5eERRVUZETEVsQlFVa3NRMEZCUXl4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFZEJRVWNzUTBGQlF5eERRVUZCTzBGQlEzcENMRXRCUVVNc1EwRkJReXhqUVVGakxFVkJRVVVzUTBGQlFUdEJRVU5zUWl4alFVRlZMRVZCUVVVc1EwRkJRVHRIUVVOaU96dEJRVVZFTEZkQlFWTXNaVUZCWlN4RFFVRkRMRVZCUVVVc1JVRkJSVHRCUVVNelFpeFJRVUZKTEV0QlFVc3NSMEZCUnl4UlFVRlJMRU5CUVVNc1YwRkJWeXhEUVVGRExHRkJRV0VzUTBGQlF5eERRVUZCTzBGQlF5OURMRmxCUVZFc1EwRkJReXhKUVVGSkxFTkJRVU1zUzBGQlN5eERRVUZETEUxQlFVMHNSMEZCUnl4RlFVRkZMRU5CUVVFN1FVRkRMMElzVTBGQlN5eERRVUZETEdWQlFXVXNRMEZCUXl4dlFrRkJiMElzUlVGQlJTeEpRVUZKTEVWQlFVVXNTVUZCU1N4RlFVRkZPMEZCUTNSRUxGZEJRVXNzUlVGQlJTeEZRVUZGTEVOQlFVTXNWMEZCVnp0QlFVTnlRaXhaUVVGTkxFVkJRVVVzUlVGQlJTeERRVUZETEZsQlFWa3NSMEZCUnl4RFFVRkRPMHRCUXpWQ0xFTkJRVU1zUTBGQlFUdEJRVU5HTEZsQlFWRXNRMEZCUXl4bFFVRmxMRU5CUVVNc1lVRkJZU3hEUVVGRExFdEJRVXNzUTBGQlF5eERRVUZCTzBkQlF6bERPenRCUVVkRUxGZEJRVk1zU1VGQlNTeERRVUZETEVsQlFVa3NSVUZCUlR0QlFVTnNRaXhSUVVGSkxFTkJRVU1zV1VGQldTeEZRVUZGTEhGQ1FVRnhRaXhEUVVGRExFTkJRVUU3TzBGQlJYcERMRkZCUVVrc1QwRkJUeXhIUVVGSExGVkJRVlVzUlVGQlJTeERRVUZCT3p0QlFVVXhRaXhSUVVGSkxGRkJRVkVzUjBGQlJ5eEpRVUZKTEVOQlFVTXNaMEpCUVdkQ0xFTkJRVU1zU1VGQlNTeERRVUZETEVOQlFVRTdPMEZCUlRGRExGRkJRVWtzVjBGQlZ5eEhRVUZITEVsQlFVa3NRMEZCUXl4WFFVRlhMRU5CUVVFN08wRkJSV3hETEZGQlFVa3NRMEZCUXl4SlFVRkpMRWxCUVVrc1NVRkJTU3hEUVVGRExGTkJRVk1zUlVGQlJUdEJRVU16UWl4VlFVRkpMRU5CUVVNc1IwRkJSeXhOUVVGTkxFVkJRVVVzUTBGQlFUdEJRVU5vUWl4eFFrRkJaU3hEUVVGRExFVkJRVU1zVjBGQlZ5eEZRVUZGTEVkQlFVY3NSVUZCUlN4WlFVRlpMRVZCUVVVc1IwRkJSeXhGUVVGRExFTkJRVU1zUTBGQlFUdEJRVU4wUkN4UFFVRkRMRU5CUVVNc1JVRkJSU3hEUVVGRExFMUJRVTBzUlVGQlJTeGxRVUZsTEVOQlFVTXNRMEZCUVR0QlFVTTNRaXhaUVVGTkxFZEJRVWNzUTBGQlF5eERRVUZCTzBGQlExWXNZVUZCVFR0TFFVTlFPenRCUVVWRUxGRkJRVWtzVFVGQlRTeERRVUZETEUxQlFVMHNTVUZCU1N4TlFVRk5MRU5CUVVNc1RVRkJUU3hEUVVGRExFbEJRVWtzUlVGQlJUdEJRVU4yUXl3eVFrRkJjVUlzUTBGQlF5eFhRVUZYTEVOQlFVTXNRMEZCUVR0TFFVTnVReXhOUVVOSk8wRkJRMGdzYVVKQlFWY3NSVUZCUlN4RFFVRkJPMHRCUTJRN08wRkJSVVFzWVVGQlV5eFhRVUZYTEVOQlFVTXNUMEZCVHl4RlFVRkZPMEZCUXpWQ0xHVkJRVk1zUTBGQlF5eFZRVUZCTEUxQlFVMHNSVUZCU1R0QlFVTnNRaXhoUVVGTExFTkJRVU1zVDBGQlR5eERRVUZETEVWQlFVVXNSVUZCUlN4TlFVRk5MRVZCUVVVc1ZVRkJReXhQUVVGUExFVkJRVXM3UVVGRGNrTXNZMEZCU1N4UFFVRlBMRWxCUVVrc1QwRkJUeXhEUVVGRExFOUJRVThzUTBGQlF5eFRRVUZUTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVNc1JVRkJSU3hQUVVGUExFZEJRVWNzU1VGQlNTeERRVUZCTzBGQlF5OUVMR05CUVVrc1kwRkJZeXhIUVVGSExGTkJRV3BDTEdOQlFXTXNRMEZCUnl4NVFrRkJlVUlzUlVGQlNUdEJRVU5vUkN4blFrRkJTU3hOUVVGTkxFZEJRVWNzVVVGQlVTeERRVUZETzBGQlEzQkNMR3RDUVVGSkxFVkJRVW9zU1VGQlNUdEJRVU5LTEhOQ1FVRlJMRVZCUVZJc1VVRkJVVHRCUVVOU0xIRkNRVUZQTEVWQlFWQXNUMEZCVHp0QlFVTlFMSFZEUVVGNVFpeEZRVUY2UWl4NVFrRkJlVUk3UVVGRGVrSXNjVUpCUVU4c1JVRkJVQ3hQUVVGUE8wRkJRMUFzYjBKQlFVMHNSVUZCVGl4TlFVRk5PMEZCUTA0c2NVSkJRVThzUlVGQlVDeFBRVUZQTzBGQlExQXNlVUpCUVZjc1JVRkJXQ3hYUVVGWE8yRkJRMW9zUTBGQlF5eERRVUZCTzBGQlEwWXNhMEpCUVUwc1EwRkJReXhGUVVGRkxFTkJRVU1zVFVGQlRTeEZRVUZGTEZWQlFVRXNSVUZCUlN4RlFVRkpPMEZCUTNSQ0xEWkNRVUZsTEVOQlFVTXNSVUZCUlN4RFFVRkRMRU5CUVVFN1FVRkRia0lzWjBKQlFVVXNRMEZCUXl4SlFVRkpMRU5CUVVNc1RVRkJUU3hEUVVGRExFTkJRVUU3WVVGRGFFSXNRMEZCUXl4RFFVRkJPMEZCUTBZc2EwSkJRVTBzUTBGQlF5eEZRVUZGTEVOQlFVTXNXVUZCV1N4RlFVRkZMRlZCUVZVc1EwRkJReXhEUVVGQk96dEJRVVZ1UXl4dFFrRkJUeXhOUVVGTkxFTkJRVUU3VjBGRFpDeERRVUZCT3p0QlFVVkVMR05CUVVrc1EwRkJReXhYUVVGWExFVkJRVXNzVlVGQlZTeEZRVUZGTEhORFFVRnRReXhGUVVGRExGVkJRVlVzUlVGQlJTeE5RVUZOTEVWQlFVTXNRMEZCUXl4RFFVRkJPMEZCUTNwR0xHTkJRVWtzUTBGQlF5eG5Ra0ZCWjBJc1JVRkJSU3h2UTBGQmIwTXNSVUZCUlN4RlFVRkRMRlZCUVZVc1JVRkJSU3hOUVVGTkxFVkJRVU1zUTBGQlF5eERRVUZCT3p0QlFVVnNSaXhqUVVGTkxHVkJRV1VzUjBGQlJ5eFZRVUZWTEVOQlFVTXNWMEZCVnl4RFFVRkRMRTFCUVUwc1EwRkJReXhEUVVGQk96dEJRVVYwUkN4alFVRkpMRU5CUVVNc1pVRkJaU3hGUVVGRk8wRkJRM0JDTEdkQ1FVRkpMRU5CUVVNc1YwRkJWeXhGUVVGTExGVkJRVlVzUlVGQlJTeHJSRUZCSzBNc1JVRkJReXhWUVVGVkxFVkJRVVVzVFVGQlRTeEZRVUZETEVOQlFVTXNRMEZCUVR0QlFVTnlSeXhuUWtGQlNTeERRVUZETEdkQ1FVRm5RaXhGUVVGRkxITkRRVUZ6UXl4RlFVRkZMRVZCUVVNc1ZVRkJWU3hGUVVGRkxFMUJRVTBzUlVGQlF5eERRVUZETEVOQlFVRTdRVUZEY0VZc1owSkJRVWtzUTBGQlF5eFpRVUZaTEVWQlFVVXNhME5CUVd0RExFVkJRVVVzUlVGQlF5eFZRVUZWTEVWQlFVVXNUVUZCVFN4RlFVRkRMRU5CUVVNc1EwRkJRVHRYUVVNM1JUczdRVUZGUkN4blFrRkJUU3hIUVVGSExHTkJRV01zUTBGQlF5eGxRVUZsTEVOQlFVTXNRMEZCUVR0VFFVTjZReXhEUVVGRExFTkJRVUU3VDBGRFNDeERRVUZETEVOQlFVRTdTMEZEU0R0SFFVVkdPenRCUVVWRUxGZEJRVk1zVFVGQlRTeEhRVUZITzBGQlEyaENMRmxCUVZFc1EwRkJReXhOUVVGTkxFVkJRVVVzVDBGQlR5eEZRVUZGTEdGQlFXRXNRMEZCUXl4RFFVRkJPMEZCUTNoRExHVkJRVmNzUTBGQlF5eFJRVUZSTEVOQlFVTXNaVUZCWlN4RlFVRkZMRk5CUVZNc1EwRkJReXhEUVVGQk8wRkJRMmhFTEZWQlFVMHNTVUZCU1N4TlFVRk5MRU5CUVVNc1RVRkJUU3hGUVVGRkxFTkJRVUU3UjBGRE1VSTdPMEZCUlVRc1RVRkJTU3hGUVVGRkxFZEJRVWNzVDBGQlR5eERRVUZETzBGQlEyWXNVVUZCU1N4RlFVRktMRWxCUVVrN1FVRkRTaXhWUVVGTkxFVkJRVTRzVFVGQlRUdEJRVU5PTEZOQlFVc3NSVUZCVEN4TFFVRkxPMGRCUTA0c1EwRkJReXhEUVVGQk96dEJRVVZHTEZOQlFVOHNSVUZCUlN4RFFVRkJPME5CUlZZc1EwRkJRU3hGUVVGRklpd2labWxzWlNJNkltZGxibVZ5WVhSbFpDNXFjeUlzSW5OdmRYSmpaVkp2YjNRaU9pSWlMQ0p6YjNWeVkyVnpRMjl1ZEdWdWRDSTZXeUozYVc1a2IzY3VTVk5mVUU5UVZWQWdQU0JrYjJOMWJXVnVkQzV4ZFdWeWVWTmxiR1ZqZEc5eUtDY3VjRzl3ZFhBbktWeHVaWGh3YjNKMElHUmxabUYxYkhRZ0tHWjFibU4wYVc5dUtDa2dlMXh1SUNCcFppQW9JWGRwYm1SdmR5NUpVMTlRVDFCVlVDa2djbVYwZFhKdVhHNGdJSEpsY1hWcGNtVW9KMkpoWW1Wc0wzQnZiSGxtYVd4c0p5bGNiaUFnYkdWMElHWnZjbWRsSUQwZ2NtVnhkV2x5WlNnblptOXlaMlVuS1Z4dUlDQnNaWFFnWlcxcGRIUmxjaUE5SUhKbGNYVnBjbVVvSjJWdGFYUjBaWEluS1Z4dUlDQnNaWFFnY0hKbFpuTWdQU0J5WlhGMWFYSmxLQ2N1TGk5d2NtVm1jeWNwWEc0Z0lHeGxkQ0J1WlhkeklEMGdjbVZ4ZFdseVpTZ25MaTR2WW1jdmJtVjNjeWNwWEc0Z0lHeGxkQ0I3WjJWMFJHOXRZV2x1ZlNBOUlISmxjWFZwY21Vb0p5NHVMMnh2WTJGMGFXOXVKeWxjYmlBZ2JHVjBJSHRqWVd4c0xDQnBibWwwUW1kUGNsQnZjSFZ3ZlNBOUlISmxjWFZwY21Vb0p5NHVMM1J5WVdOcmFXNW5MMmx1WkdWNEp5bGNiaUFnYkdWMElIdG5aWFJXWlhKemFXOXVMQ0JWVWt4VGZTQTlJSEpsY1hWcGNtVW9KeTR1TDJOdmJtWnBaeWNwWEc0Z0lHeGxkQ0J3WVdkbFEyOXVabWxuSUQwZ2NtVnhkV2x5WlNnbkxpNHZjR0ZuWlMxamIyNW1hV2NuS1Z4dUlDQnNaWFFnZTJkbGRGTmxiR1ZqZEdWa1ZHRmlSbUYyYVdOdmJuMGdQU0J5WlhGMWFYSmxLQ2N1TGk5aVp5OWphSEp2YldVbktWeHVJQ0JzWlhRZ2UybHpWMmx1Wkc5M2N5d2dhWE5UWVdaaGNta3NJR2RsZEVKeWIzZHpaWEo5SUQwZ2NtVnhkV2x5WlNnbkxpNHZkWFJwYkNjcFhHNGdJR3hsZENCN1lXUmtRMnhoYzNNc0lISmxiVzkyWlVOc1lYTnpMQ0J5WlhOdmJIWmxSV3dzSUd4cGMzUmxiaXdnZFc1c2FYTjBaVzU5SUQwZ2NtVnhkV2x5WlNnbkxpNHZaRzl0SnlsY2JpQWdiR1YwSUZOcFoyNXBiaUE5SUhKbGNYVnBjbVVvSnk0dmMybG5ibWx1SnlsY2JpQWdiR1YwSUZObGRIUnBibWR6SUQwZ2NtVnhkV2x5WlNnbkxpOXpaWFIwYVc1bmN5Y3BMbVJsWm1GMWJIUmNibHh1SUNCc1pYUWdaR2xoYkc5blhHNWNiaUFnSVNobWRXNWpkR2x2YmlncElIdGNiaUFnSUNCcFppQW9kMmx1Wkc5M0xrbFRYMEpIS1NCeVpYUjFjbTVjYmx4dUlDQWdJR1J2WTNWdFpXNTBMbkpsWVdSNVUzUmhkR1VnUFQwZ0oyeHZZV1JwYm1jbklEOWNiaUFnSUNCa2IyTjFiV1Z1ZEM1aFpHUkZkbVZ1ZEV4cGMzUmxibVZ5S0NkRVQwMURiMjUwWlc1MFRHOWhaR1ZrSnl3Z2MzUmhjblFzSUdaaGJITmxLU0E2WEc0Z0lDQWdJV2x6VTJGbVlYSnBLQ2tnUHlCemRHRnlkQ2dwSURvZ2QybHVaRzkzTG5OaFptRnlhUzVoY0hCc2FXTmhkR2x2Ymk1aFpHUkZkbVZ1ZEV4cGMzUmxibVZ5S0Nkd2IzQnZkbVZ5Snl3Z2MzUmhjblFwWEc0Z0lIMG9LU2xjYmx4dUlDQmhjM2x1WXlCbWRXNWpkR2x2YmlCemRHRnlkQ2dwSUh0Y2JpQWdJQ0JwWmlBb0lYQnliMk5sYzNNdVpXNTJMbEJTVDBRcElIdGNiaUFnSUNBZ0lISmxjWFZwY21Vb0p5NHVMM1JsYzNRdFlYQnBKeWtvS1Z4dUlDQWdJSDFjYmx4dUlDQWdJR0YzWVdsMElIQmhaMlZEYjI1bWFXY3VhVzVwZENncFhHNWNiaUFnSUNCaFpHUkRiR0Z6Y3loa2IyTjFiV1Z1ZEM1a2IyTjFiV1Z1ZEVWc1pXMWxiblFzSUdkbGRFSnliM2R6WlhJb0tTbGNiaUFnSUNCcGMxZHBibVJ2ZDNNb0tTQW1KaUJoWkdSRGJHRnpjeWhrYjJOMWJXVnVkQzVrYjJOMWJXVnVkRVZzWlcxbGJuUXNJQ2QzYVc1a2IzZHpKeWxjYmx4dUlDQWdJR2xtSUNocGMxTmhabUZ5YVNncEtTQjdYRzRnSUNBZ0lDQnBibWwwUW1kUGNsQnZjSFZ3S0NsY2JpQWdJQ0I5WEc1Y2JpQWdJQ0JzYVhOMFpXNG9kMmx1Wkc5M0xDQW5ZMnhwWTJzbkxDQnZjR1Z1UjNKaGJXMWhjbXg1S1Z4dUlDQWdJSEpsYm1SbGNpZ3BYRzRnSUgxY2JseHVJQ0JtZFc1amRHbHZiaUJ5Wlc1a1pYSW9LU0I3WEc0Z0lDQWdiR1YwSUhWelpYSlFjbTl3Y3lBOUlGdGNiaUFnSUNBZ0lDZDBiMnRsYmljc0lDZG5jbTkxY0hNbkxDQW5jM1ZpYzJOeWFYQjBhVzl1Um5KbFpTY3NJQ2R3Y21WdGFYVnRKeXdnSjJacGVHVmtYMlZ5Y205eWN5Y3NYRzRnSUNBZ0lDQW5ZVzV2Ym5sdGIzVnpKeXdnSjJWdVlXSnNaV1JFWldaekp5d2dKM0psWjJsemRISmhkR2x2YmtSaGRHVW5MQ0FuYzJWbGJrNWxkM05XWlhKemFXOXVKeXhjYmlBZ0lDQWdJQ2RsZUhSbGJuTnBiMjVKYm5OMFlXeHNSR0YwWlNkZFhHNGdJQ0FnY0hKbFpuTXVaMlYwS0hWelpYSlFjbTl3Y3l3Z2MyaHZkeWxjYmlBZ2ZWeHVYRzRnSUdaMWJtTjBhVzl1SUdOc2IzTmxVRzl3ZFhBb0tTQjdYRzRnSUNBZ2JHVjBJR1YyWlc1MElEMGdaRzlqZFcxbGJuUXVZM0psWVhSbFJYWmxiblFvSjBOMWMzUnZiVVYyWlc1MEp5bGNiaUFnSUNCbGRtVnVkQzVwYm1sMFEzVnpkRzl0UlhabGJuUW9KMk5zYjNObExYQnZjSFZ3Snl3Z2RISjFaU3dnZEhKMVpTd2dlMzBwWEc0Z0lDQWdaRzlqZFcxbGJuUXVaRzlqZFcxbGJuUkZiR1Z0Wlc1MExtUnBjM0JoZEdOb1JYWmxiblFvWlhabGJuUXBYRzRnSUgxY2JseHVYRzRnSUdaMWJtTjBhVzl1SUc5d1pXNUhjbUZ0YldGeWJIa29aU2tnZTF4dUlDQWdJR2xtSUNnaGNtVnpiMngyWlVWc0tHVXVkR0Z5WjJWMExDQW5iM0JsYmtkeVlXMXRZWEpzZVNjcEtTQnlaWFIxY201Y2JpQWdJQ0JtYjNKblpTNTBZV0p6TG05d1pXNG9WVkpNVXk1aGNIQXBYRzRnSUNBZ1pTNXdjbVYyWlc1MFJHVm1ZWFZzZENncFhHNGdJQ0FnWTJ4dmMyVlFiM0IxY0NncFhHNGdJSDFjYmx4dUlDQm1kVzVqZEdsdmJpQjFjR1JoZEdWUWIzQjFjRk5wZW1Vb1pXd3BJSHRjYmlBZ0lDQnNaWFFnWlhabGJuUWdQU0JrYjJOMWJXVnVkQzVqY21WaGRHVkZkbVZ1ZENnblEzVnpkRzl0UlhabGJuUW5LVnh1SUNBZ0lHUnZZM1Z0Wlc1MExtSnZaSGt1YzNSNWJHVXVhR1ZwWjJoMElEMGdKeWRjYmlBZ0lDQmxkbVZ1ZEM1cGJtbDBRM1Z6ZEc5dFJYWmxiblFvSjNWd1pHRjBaUzEzYVc1a2IzY3RjMmw2WlNjc0lIUnlkV1VzSUhSeWRXVXNJSHRjYmlBZ0lDQWdJSGRwWkhSb09pQmxiQzVqYkdsbGJuUlhhV1IwYUN4Y2JpQWdJQ0FnSUdobGFXZG9kRG9nWld3dVkyeHBaVzUwU0dWcFoyaDBJQzBnTVZ4dUlDQWdJSDBwWEc0Z0lDQWdaRzlqZFcxbGJuUXVaRzlqZFcxbGJuUkZiR1Z0Wlc1MExtUnBjM0JoZEdOb1JYWmxiblFvWlhabGJuUXBYRzRnSUgxY2JseHVYRzRnSUdaMWJtTjBhVzl1SUhOb2IzY29kWE5sY2lrZ2UxeHVJQ0FnSUdOaGJHd29KMlpsYkc5bkxtbHVabThuTENBblpYaDBaVzV6YVc5dVgySjBibDlqYkdsamF5Y3BYRzVjYmlBZ0lDQnNaWFFnZG1WeWMybHZiaUE5SUdkbGRGWmxjbk5wYjI0b0tWeHVYRzRnSUNBZ2JHVjBJSE5vYjNkT1pYZHpJRDBnYm1WM2N5NXBjMU5vYjNkT1pYZHpWRzlWYzJWeUtIVnpaWElwWEc1Y2JpQWdJQ0JzWlhRZ1pXNWhZbXhsWkVSbFpuTWdQU0IxYzJWeUxtVnVZV0pzWldSRVpXWnpYRzVjYmlBZ0lDQnBaaUFvSVhWelpYSWdmSHdnZFhObGNpNWhibTl1ZVcxdmRYTXBJSHRjYmlBZ0lDQWdJR3hsZENCeklEMGdVMmxuYm1sdUtDbGNiaUFnSUNBZ0lIVndaR0YwWlZCdmNIVndVMmw2WlNoN1kyeHBaVzUwVjJsa2RHZzZJRE0wTnl3Z1kyeHBaVzUwU0dWcFoyaDBPaUF6TWpSOUtWeHVJQ0FnSUNBZ2N5NXZiaWduYkc5aFpDY3NJSFZ3WkdGMFpWQnZjSFZ3VTJsNlpTbGNiaUFnSUNBZ0lHUnBZV3h2WnlBOUlITmNiaUFnSUNBZ0lISmxkSFZ5Ymx4dUlDQWdJSDFjYmx4dUlDQWdJR2xtSUNoM2FXNWtiM2N1WTJoeWIyMWxJQ1ltSUhkcGJtUnZkeTVqYUhKdmJXVXVkR0ZpY3lrZ2UxeHVJQ0FnSUNBZ1oyVjBVMlZzWldOMFpXUlVZV0pHWVhacFkyOXVLSEoxYmxObGRIUnBibWR6S1Z4dUlDQWdJSDFjYmlBZ0lDQmxiSE5sSUh0Y2JpQWdJQ0FnSUhKMWJsTmxkSFJwYm1kektDbGNiaUFnSUNCOVhHNWNiaUFnSUNCbWRXNWpkR2x2YmlCeWRXNVRaWFIwYVc1bmN5aG1ZWFpwWTI5dUtTQjdYRzRnSUNBZ0lDQm5aWFJFYjIxaGFXNG9aRzl0WVdsdUlEMCtJSHRjYmlBZ0lDQWdJQ0FnY0hKbFpuTXVaVzVoWW14bFpDZ25KeXdnWkc5dFlXbHVMQ0FvWlc1aFlteGxaQ2tnUFQ0Z2UxeHVJQ0FnSUNBZ0lDQWdJR2xtSUNobVlYWnBZMjl1SUNZbUlHWmhkbWxqYjI0dWFXNWtaWGhQWmlnblkyaHliMjFsT2ljcElDRTlJQzB4S1NCbVlYWnBZMjl1SUQwZ2JuVnNiRnh1SUNBZ0lDQWdJQ0FnSUd4bGRDQmpjbVZoZEdWVFpYUjBhVzVuY3lBOUlHbHpRMmhsWTJ0cGJtZEZibUZpYkdWa1QyNUViMjFoYVc0Z1BUNGdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2JHVjBJSEpsYzNWc2RDQTlJRk5sZEhScGJtZHpLSHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdkWE5sY2l4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnYzJodmQwNWxkM01zWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJSFpsY25OcGIyNHNYRzRnSUNBZ0lDQWdJQ0FnSUNBZ0lHbHpRMmhsWTJ0cGJtZEZibUZpYkdWa1QyNUViMjFoYVc0c1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUdWdVlXSnNaV1FzWEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJR1J2YldGcGJpeGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ1ptRjJhV052Yml4Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnWlc1aFlteGxaRVJsWm5OY2JpQWdJQ0FnSUNBZ0lDQWdJSDBwWEc0Z0lDQWdJQ0FnSUNBZ0lDQnlaWE4xYkhRdWIyNG9KMnh2WVdRbkxDQmxiQ0E5UGlCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0FnSUhWd1pHRjBaVkJ2Y0hWd1UybDZaU2hsYkNsY2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnYldVdVpXMXBkQ2duYkc5aFpDY3BYRzRnSUNBZ0lDQWdJQ0FnSUNCOUtWeHVJQ0FnSUNBZ0lDQWdJQ0FnY21WemRXeDBMbTl1S0NkamJHOXpaVkJ2Y0hWd0p5d2dZMnh2YzJWUWIzQjFjQ2xjYmx4dUlDQWdJQ0FnSUNBZ0lDQWdjbVYwZFhKdUlISmxjM1ZzZEZ4dUlDQWdJQ0FnSUNBZ0lIMWNibHh1SUNBZ0lDQWdJQ0FnSUdOaGJHd29KMmR1WVhJdWMyVnVaQ2NzSUdBa2UyZGxkRUp5YjNkelpYSW9LWDFGZUhRdlluSnZkM05sY2xSdmIyeGlZWEpDZFhSMGIyNURiR2xqYTJWa1lDd2dlM0JoWjJWRWIyMWhhVzQ2SUdSdmJXRnBibjBwWEc0Z0lDQWdJQ0FnSUNBZ1kyRnNiQ2duYldsNGNHRnVaV3d1ZEhKaFkyc25MQ0FuUlhoME9rSnliM2R6WlhKZlZHOXZiR0poY2w5Q2RYUjBiMjVmUTJ4cFkydGxaQ2NzSUh0d1lXZGxSRzl0WVdsdU9pQmtiMjFoYVc1OUtWeHVYRzRnSUNBZ0lDQWdJQ0FnWTI5dWMzUWdaVzVoWW14bFpFOXVSRzl0WVdsdUlEMGdjR0ZuWlVOdmJtWnBaeTVqYUdWamEwUnZiV0ZwYmloa2IyMWhhVzRwWEc1Y2JpQWdJQ0FnSUNBZ0lDQnBaaUFvSVdWdVlXSnNaV1JQYmtSdmJXRnBiaWtnZTF4dUlDQWdJQ0FnSUNBZ0lDQWdZMkZzYkNnbloyNWhjaTV6Wlc1a0p5d2dZQ1I3WjJWMFFuSnZkM05sY2lncGZVVjRkQzlpY205M2MyVnlWRzl2YkdKaGNrSjFkSFJ2YmtOc2FXTnJaV1F2ZFc1emRYQndiM0owWldSZ0xDQjdjR0ZuWlVSdmJXRnBiam9nWkc5dFlXbHVmU2xjYmlBZ0lDQWdJQ0FnSUNBZ0lHTmhiR3dvSjIxcGVIQmhibVZzTG5SeVlXTnJKeXdnSjBWNGREcFRaWFIwYVc1bmMxOVBjR1Z1WDFWdWMzVndjRzl5ZEdWa1gwUnZiV0ZwYmljc0lIdHdZV2RsUkc5dFlXbHVPaUJrYjIxaGFXNTlLVnh1SUNBZ0lDQWdJQ0FnSUNBZ1kyRnNiQ2duWm1Wc2IyY3VhVzVtYnljc0lDZHpaWFIwYVc1bmMxOXZjR1Z1WDNWdWMzVndjRzl5ZEdWa1gyUnZiV0ZwYmljc0lIdHdZV2RsUkc5dFlXbHVPaUJrYjIxaGFXNTlLVnh1SUNBZ0lDQWdJQ0FnSUgxY2JseHVJQ0FnSUNBZ0lDQWdJR1JwWVd4dlp5QTlJR055WldGMFpWTmxkSFJwYm1kektHVnVZV0pzWldSUGJrUnZiV0ZwYmlsY2JpQWdJQ0FnSUNBZ2ZTbGNiaUFnSUNBZ0lIMHBYRzRnSUNBZ2ZWeHVYRzRnSUgxY2JseHVJQ0JtZFc1amRHbHZiaUJ5WlcxdmRtVW9LU0I3WEc0Z0lDQWdkVzVzYVhOMFpXNG9kMmx1Wkc5M0xDQW5ZMnhwWTJzbkxDQnZjR1Z1UjNKaGJXMWhjbXg1S1Z4dUlDQWdJSEpsYlc5MlpVTnNZWE56S0dSdlkzVnRaVzUwTG1SdlkzVnRaVzUwUld4bGJXVnVkQ3dnSjNkcGJtUnZkM01uS1Z4dUlDQWdJR1JwWVd4dlp5QW1KaUJrYVdGc2IyY3VjbVZ0YjNabEtDbGNiaUFnZlZ4dVhHNGdJR3hsZENCdFpTQTlJR1Z0YVhSMFpYSW9lMXh1SUNBZ0lITm9iM2NzWEc0Z0lDQWdjbVZ0YjNabExGeHVJQ0FnSUhOMFlYSjBYRzRnSUgwcFhHNWNiaUFnY21WMGRYSnVJRzFsWEc1Y2JuMG9LU2xjYmlKZGZRPT0iLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnIC8vZXNsaW50LWRpc2FibGUtbGluZVxuaW1wb3J0IHsgVVJMUyB9IGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCBzdHlsZSBmcm9tICdzdHlsL3JlZmVycmFsLnN0eWwnXG5pbXBvcnQgeyBjYWxsIH0gZnJvbSAnLi4vdHJhY2tpbmcvaW5kZXgnXG5pbXBvcnQgbWVzc2FnZSBmcm9tICcuLi9tZXNzYWdlJ1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZWZlcnJhbExpbmUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuXG4gIGlzU2hvdygpIHtcbiAgICBsZXQge3VzZXIgPSB7fX0gPSB0aGlzLnByb3BzXG4gICAgbGV0IGlzUHJlbWl1bVNob3cgPSB1c2VyLnByZW1pdW0gPT09IHRydWUgJiYgdXNlci5zdWJzY3JpcHRpb25GcmVlID09PSB0cnVlXG4gICAgbGV0IGlzRnJlZVNob3cgPSB1c2VyLnByZW1pdW0gPT09IGZhbHNlXG4gICAgbGV0IGlzSW5SZWZlcnJhbEdyb3VwID0gdXNlci5ncm91cHMgJiYgdXNlci5ncm91cHMuc29tZSgoZWwgPSAnJykgPT4gZWwuaW5kZXhPZigncmVmZXJyYWxfbG9ja2VkJykgPiAtMSB8fCBlbCA9PSAncmVmZXJyYWwnIHx8IGVsID09ICd0ZXN0X2dyb3VwJylcbiAgICByZXR1cm4gKGlzUHJlbWl1bVNob3cgfHwgaXNGcmVlU2hvdykgJiYgISFpc0luUmVmZXJyYWxHcm91cFxuICB9XG5cbiAgaXNSaWJib25TaG93KCkge1xuICAgIGxldCB7dXNlcj17fX0gPSB0aGlzLnByb3BzXG4gICAgbGV0IHtleHRlbnNpb25JbnN0YWxsRGF0ZX0gPSB1c2VyXG4gICAgbGV0IHJlZ0RhdGUgPSBuZXcgRGF0ZShleHRlbnNpb25JbnN0YWxsRGF0ZSkuZ2V0VGltZSgpXG4gICAgbGV0IG5vdyA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG4gICAgbGV0IG9uZVdlZWsgPSAxMDAwICogNjAgKiA2MCAqIDI0ICogN1xuICAgIHJldHVybiAocmVnRGF0ZSArIG9uZVdlZWspID4gbm93XG4gIH1cblxuICBvbkNsaWNrSW52aXRlKCkge1xuICAgIGNhbGwoJ21peHBhbmVsLnRyYWNrJywgJ1dFOlJlZmVycmFsX0J1dHRvbl9DbGlja2VkJywge3BsYWNlbWVudDogJ21lbnUnfSlcbiAgICBjYWxsKCdnbmFyLnNlbmQnLCAncmVmZXJyYWwvcmVmZXJyYWxCdXR0b25DbGlja2VkJywge3BsYWNlbWVudDogJ21lbnUnfSlcbiAgICBtZXNzYWdlLmVtaXRCYWNrZ3JvdW5kKCdvcGVuLXVybCcsIFVSTFMucmVmZXJyYWwpXG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IHN0eWxlcyA9IFsnc2V0dGluZ19pdGVtJywgc3R5bGUucG9wdXBMaW5lXS5qb2luKCcgJylcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAge3RoaXMuaXNTaG93KCkgJiZcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGVzfT5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXsnc2hvcnRfYm9yZGVyIHRvcCd9IC8+XG4gICAgICAgICAgICB7dGhpcy5pc1JpYmJvblNob3coKSAmJlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e3N0eWxlLm5ld0xhYmVsfT5OZXc8L3NwYW4+XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICA8c3Bhbj5HZXQgUHJlbWl1bSBmb3IgRnJlZTwvc3Bhbj5cbiAgICAgICAgICAgIDxhIG9uQ2xpY2s9e3RoaXMub25DbGlja0ludml0ZX0gdGFyZ2V0PSdfYmxhbmsnIGNsYXNzTmFtZT17c3R5bGUucG9wdXBMaW5rfT5cbiAgICAgICAgICAgICAgSW52aXRlIEZyaWVuZHNcbiAgICAgICAgICAgIDwvYT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgfVxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9XG59XG4iLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgc3R5bGUgZnJvbSAnc3R5bC9wb3B1cC1zZXR0aW5ncy5zdHlsJ1xuaW1wb3J0IGNoZWNrYm94U3R5bGUgZnJvbSAnc3R5bC9jaGVja2JveC5zdHlsJ1xuaW1wb3J0IFJlZmVycmFsTGluZSBmcm9tICcuL3JlZmVycmFsX2xpbmUnXG5pbXBvcnQge1VSTFN9IGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7Y3N9IGZyb20gJy4uL2RvbSdcbmltcG9ydCB7ZGVjbGVuc2lvbiwgZm9ybWF0TnVtYmVyLCBmb3JtYXREYXRlLCBfZn0gZnJvbSAnLi4vdXRpbCdcblxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTZXR0aW5nc0NvbnRlbnQgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICByZW5kZXIoKSB7XG4gICAgbGV0IGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnLFxuICAgICAgdXNlciA9IGNvbmZpZy51c2VyLFxuICAgICAgaXNDaGVja2luZ0VuYWJsZWRPbkRvbWFpbiA9IGNvbmZpZy5pc0NoZWNraW5nRW5hYmxlZE9uRG9tYWluLFxuICAgICAgZW5hYmxlZCA9IGNvbmZpZy5lbmFibGVkICYmIGlzQ2hlY2tpbmdFbmFibGVkT25Eb21haW4sXG4gICAgICBlbmFibGVkRGVmcyA9IGNvbmZpZy5lbmFibGVkRGVmcyxcbiAgICAgIGRpc2FibGVMYWJlbCA9ICFpc0NoZWNraW5nRW5hYmxlZE9uRG9tYWluID8gJ0NoZWNraW5nIGlzIG5vdCBzdXBwb3J0ZWQnIDogJ0NoZWNrIGZvciBHcmFtbWFyIGFuZCBTcGVsbGluZycsXG4gICAgICBlcnJvclR5cGVMYmwgPSB1c2VyLnByZW1pdW0gPyAnY3JpdGljYWwgYW5kIGFkdmFuY2VkJyA6ICdjcml0aWNhbCcsXG4gICAgICBmaXhlZCA9ICF1c2VyLmZpeGVkX2Vycm9ycyB8fCBpc05hTih1c2VyLmZpeGVkX2Vycm9ycykgPyAwIDogdXNlci5maXhlZF9lcnJvcnMsXG4gICAgICBmaXhlZEZvcm1hdGVkID0gZm9ybWF0TnVtYmVyKGZpeGVkKSxcbiAgICAgIGxibCA9IGRlY2xlbnNpb24oZml4ZWQsIFsnZml4JywgJ2ZpeGVzJywgJ2ZpeGVzJ10pLFxuICAgICAgZGF0ZVN0ciA9IGZvcm1hdERhdGUodXNlci5yZWdpc3RyYXRpb25EYXRlKSxcbiAgICAgIG5vRml4ZXMgPSBmaXhlZEZvcm1hdGVkID09ICcwJyxcbiAgICAgIHNpdGVTd2l0Y2hlckNscyA9IGNzKHtcbiAgICAgICAgW3N0eWxlLnNpdGVfc3dpdGNoZXJdOiB0cnVlLFxuICAgICAgICBbc3R5bGUubGluZV06IHRydWUsXG4gICAgICAgIFtzdHlsZS5zZXR0aW5nX2l0ZW1dOiB0cnVlLFxuICAgICAgICBbc3R5bGUub25dOiBlbmFibGVkLFxuICAgICAgICBbc3R5bGUub2ZmXTogIWVuYWJsZWRcbiAgICAgIH0pLFxuICAgICAgZGVmc1N3aXRjaGVyQ2xzID0gY3Moe1xuICAgICAgICBbc3R5bGUuZGVmX3N3aXRjaGVyXTogdHJ1ZSxcbiAgICAgICAgW3N0eWxlLmxpbmVdOiB0cnVlLFxuICAgICAgICBbc3R5bGUuc2V0dGluZ19pdGVtXTogdHJ1ZSxcbiAgICAgICAgW3N0eWxlLm9uXTogZW5hYmxlZERlZnMsXG4gICAgICAgIFtzdHlsZS5vZmZdOiAhZW5hYmxlZERlZnNcbiAgICAgIH0pXG5cbiAgICBpZiAobm9GaXhlcykgZml4ZWRGb3JtYXRlZCA9ICdObydcbiAgICAgIC8vU3RyaW5nLmZyb21DaGFyQ29kZSg4MjE3KSAtIGlzICfigJknXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e3NpdGVTd2l0Y2hlckNsc30+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT17Y2hlY2tib3hTdHlsZS5zZWxlY3RfY2hlY2tib3h9PntkaXNhYmxlTGFiZWx9IDxici8+IDxzcGFuIGNsYXNzTmFtZT17c3R5bGUuZG9tYWlufT48c3BhbiBjbGFzc05hbWU9e3N0eWxlLnRoaW5fdGV4dH0+b248L3NwYW4+IDxzcGFuIGNsYXNzTmFtZT17c3R5bGUuZmF2aWNvbn0+PGltZyB3aWR0aD0nMTZweCcgaGVpZ2h0PScxNnB4JyBzcmM9e2NvbmZpZy5mYXZpY29ufS8+PC9zcGFuPntjb25maWcuZG9tYWlufTwvc3Bhbj5cbiAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9e2NoZWNrYm94U3R5bGUuY2hlY2tib3h9IG9uQ2hhbmdlPXtfZn0gY2hlY2tlZD17ZW5hYmxlZH0gdHlwZT0nY2hlY2tib3gnLz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtjaGVja2JveFN0eWxlLmNoZWNrYm94X2NoZWNrICsgJyAnICsgc3R5bGUuY2hlY2tib3hfY2hlY2t9PjxkaXYgY2xhc3NOYW1lPXtjaGVja2JveFN0eWxlLmNoZWNrYm94X2NoZWNrX3JvdW5kfT48L2Rpdj48L2Rpdj5cbiAgICAgICAgICA8L2xhYmVsPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZS5zaG9ydF9ib3JkZXJ9PjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9e2RlZnNTd2l0Y2hlckNsc30+XG4gICAgICAgICAgPGxhYmVsIGNsYXNzTmFtZT17Y2hlY2tib3hTdHlsZS5zZWxlY3RfY2hlY2tib3h9PlNob3cgRGVmaW5pdGlvbnMgYW5kIFN5bm9ueW1zIDxici8+dmlhIERvdWJsZS1DbGlja3MgKEFsbCBTaXRlcylcbiAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9e2NoZWNrYm94U3R5bGUuY2hlY2tib3h9IG9uQ2hhbmdlPXtfZn0gY2hlY2tlZD17ZW5hYmxlZERlZnN9IHR5cGU9J2NoZWNrYm94Jy8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17Y2hlY2tib3hTdHlsZS5jaGVja2JveF9jaGVja30+PGRpdiBjbGFzc05hbWU9e2NoZWNrYm94U3R5bGUuY2hlY2tib3hfY2hlY2tfcm91bmR9PjwvZGl2PjwvZGl2PlxuICAgICAgICAgIDwvbGFiZWw+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9e3N0eWxlLnNob3J0X2JvcmRlcn0+PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGUubGluZSArICcgJyArIHN0eWxlLnN1bW1hcnkgfT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGUuZXJyb3JzfT5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17c3R5bGUuY291bnQgKyAnICcgKyBzdHlsZS5sYmxDb3VudH0+e2ZpeGVkRm9ybWF0ZWR9PC9zcGFuPjxzcGFuIGNsYXNzTmFtZT17c3R5bGUuZGVzY3J9PntlcnJvclR5cGVMYmx9IDxzcGFuIGNsYXNzTmFtZT17c3R5bGUuZXJyb3JzTGJsfT57bGJsfTwvc3Bhbj4gPHNwYW4gY2xhc3NOYW1lPXtzdHlsZS5zaW5jZX0+c2luY2Uge2RhdGVTdHJ9PC9zcGFuPjwvc3Bhbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT17c3R5bGUudXBncmFkZX0+XG4gICAgICAgICAgICA8YSBjbGFzc05hbWU9e3N0eWxlLnVwZ3JhZGVfdGl0bGV9IHRhcmdldD0nX2JsYW5rJyBocmVmPXtVUkxTLnVwZ3JhZGV9PkdvIFByZW1pdW0gdG8gZW5hYmxlIGFkdmFuY2VkIGZpeGVzPC9hPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPFJlZmVycmFsTGluZSB1c2VyPXtjb25maWcudXNlcn0gLz5cbiAgICAgIDwvZGl2PlxuICAgIClcblxuICB9XG59XG4iLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnXG5pbXBvcnQgZW1pdHRlciBmcm9tICdlbWl0dGVyJ1xuaW1wb3J0IHtmaW5kRE9NTm9kZX0gZnJvbSAncmVhY3QtZG9tJ1xuaW1wb3J0IGZvcmdlIGZyb20gJy4uL2ZvcmdlJ1xuaW1wb3J0IHByZWZzIGZyb20gJy4uL3ByZWZzJ1xuaW1wb3J0IG5ld3MgZnJvbSAnLi4vYmcvbmV3cydcbmltcG9ydCBtZXNzYWdlIGZyb20gJy4uL21lc3NhZ2UnXG5pbXBvcnQge2ZldGNofSBmcm9tICcuLi9yZXF1ZXN0J1xuaW1wb3J0IHtjYWxsLCBmaXJlfSBmcm9tICcuLi90cmFja2luZy9pbmRleCdcbmltcG9ydCB7cHJvbWlzZUdldERvbWFpbn0gZnJvbSAnLi4vbG9jYXRpb24nXG5pbXBvcnQge1VSTFN9IGZyb20gJy4uL2NvbmZpZydcbmltcG9ydCB7bGlzdGVuLCBjcywgcmVuZGVyUmVhY3RXaXRoUGFyZW50LCBhZGRDbGFzcywgcmVtb3ZlQ2xhc3N9IGZyb20gJy4uL2RvbSdcbmltcG9ydCB7Z3VpZCwgaXNGRiwgZ2V0QnJvd3Nlcn0gZnJvbSAnLi4vdXRpbCdcbmltcG9ydCB7c2VlblJlZmVycmFsUmliYm9ufSBmcm9tICcuLi9iZy9yZWZlcnJhbHMnXG5pbXBvcnQgc3R5bGUgZnJvbSAnc3R5bC9wb3B1cC1zZXR0aW5ncy5zdHlsJ1xuaW1wb3J0IGNoZWNrYm94U3R5bGUgZnJvbSAnc3R5bC9jaGVja2JveC5zdHlsJ1xuaW1wb3J0IEhlYWRlciBmcm9tICcuL2hlYWRlcidcbmltcG9ydCBOZXdzIGZyb20gJy4vbmV3cydcbmltcG9ydCBGb290ZXIgZnJvbSAnLi9mb290ZXInXG5pbXBvcnQgU2V0dGluZ3NDb250ZW50IGZyb20gJy4vc2V0dGluZ3MtY29udGVudCdcblxuXG5mdW5jdGlvbiBTZXR0aW5ncyhjb25maWcpIHtcbiAgbGV0IGlkID0gZ3VpZCgpLFxuICAgIGNvbnRhaW5lciA9IHJlbmRlcigpLFxuICAgIGVsID0gZmluZERPTU5vZGUoY29udGFpbmVyLmNvbXBvbmVudCksXG4gICAgYnRuTmV3ID0gZWwucXVlcnlTZWxlY3RvcignLicgKyBzdHlsZS5uZXdfZG9jdW1lbnQpLFxuICAgIGJ0blByZW1pdW0gPSBlbC5xdWVyeVNlbGVjdG9yKCcuJyArIHN0eWxlLnVwZ3JhZGVfdGl0bGUpLFxuICAgIGNiRW5hYmxlR3JhbW1hciA9IGVsLnF1ZXJ5U2VsZWN0b3IoJy4nICsgc3R5bGUuc2l0ZV9zd2l0Y2hlciArICcgLicgKyBjaGVja2JveFN0eWxlLmNoZWNrYm94KSxcbiAgICBjYkVuYWJsZURlZnMgPSBlbC5xdWVyeVNlbGVjdG9yKCcuJyArIHN0eWxlLmRlZl9zd2l0Y2hlciArICcgLicgKyBjaGVja2JveFN0eWxlLmNoZWNrYm94KSxcbiAgICBidG5DbG9zZU5ld3MgPSBlbC5xdWVyeVNlbGVjdG9yKCcuJyArIHN0eWxlLmNsb3NlX25ld3MpXG5cblxuICBsaXN0ZW4oYnRuTmV3LCAnY2xpY2snLCBhZGREb2N1bWVudClcbiAgbGlzdGVuKGNiRW5hYmxlR3JhbW1hciwgJ2NsaWNrJywgb25FbmFibGVHcmFtbWFyQ2xpY2spXG4gIGxpc3RlbihjYkVuYWJsZURlZnMsICdjbGljaycsIG9uRW5hYmxlRGVmc0NsaWNrKVxuICBsaXN0ZW4oYnRuUHJlbWl1bSwgJ2NsaWNrJywgb3BlblByZW1pdW0pXG4gIGxpc3RlbihidG5DbG9zZU5ld3MsICdjbGljaycsIGNsb3NlTmV3cylcblxuICBmdW5jdGlvbiBnbyhkb2NJZCkge1xuICAgIGxldCB1cmwgPSBVUkxTLmRvY3MgKyAnLycgKyBkb2NJZFxuICAgIG1lc3NhZ2UuZW1pdEJhY2tncm91bmQoJ29wZW4tdXJsJywgdXJsKVxuICAgIGNhbGwoJ2ZlbG9nLmluZm8nLCAnZXh0ZW5zaW9uX3BvcHVwX2dvdG8nLCB7dXJsfSlcbiAgICBtZS5lbWl0KCdjbG9zZVBvcHVwJylcbiAgfVxuXG4gIGFzeW5jIGZ1bmN0aW9uIG9wZW5QcmVtaXVtKGUpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KClcbiAgICBsZXQgcGFnZURvbWFpbiA9IGF3YWl0IHByb21pc2VHZXREb21haW4oKVxuICAgIG1lc3NhZ2UuZW1pdEJhY2tncm91bmQoJ29wZW4tdXJsJywgVVJMUy51cGdyYWRlKVxuICAgIGZpcmUoJ3VwZ3JhZGUnLCAnc2V0dGluZ3NfdG9vbGJhcicsIHBhZ2VEb21haW4pXG4gICAgbWUuZW1pdCgnY2xvc2VQb3B1cCcpXG4gIH1cblxuICBmdW5jdGlvbiBjbG9zZU5ld3MoKSB7XG4gICAgY29uZmlnLmZhZGVOZXdzID0gdHJ1ZVxuICAgIHJlbmRlcigpXG4gICAgbWUuZW1pdCgnbG9hZCcsIHtcbiAgICAgIGNsaWVudEhlaWdodDogZWwuY2xpZW50SGVpZ2h0IC0gYnRuQ2xvc2VOZXdzLnBhcmVudE5vZGUuY2xpZW50SGVpZ2h0LFxuICAgICAgY2xpZW50V2lkdGg6IGVsLmNsaWVudFdpZHRoXG4gICAgfSlcbiAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdFeHQ6Q2xvc2VfTmV3czpQb3B1cCcpXG4gIH1cblxuICBmdW5jdGlvbiBvbkVuYWJsZUdyYW1tYXJDbGljayhlKSB7XG4gICAgY29uZmlnLmVuYWJsZWQgPSBjYkVuYWJsZUdyYW1tYXIuY2hlY2tlZFxuICAgIHByZWZzLmVuYWJsZWQoY29uZmlnLmVuYWJsZWQsIGNvbmZpZy5kb21haW4pXG4gICAgcmVuZGVyKClcbiAgICBmb3JnZSAmJiBmb3JnZS5idXR0b24uc2V0QmFkZ2UoY29uZmlnLmVuYWJsZWQgPyAnJyA6ICdvZmYnKVxuICAgIGxldCB0cmFja0RhdGEgPSB7XG4gICAgICBlbmFibGVkOiBjb25maWcuZW5hYmxlZCxcbiAgICAgIHBhZ2VEb21haW46IGNvbmZpZy5kb21haW5cbiAgICB9XG5cbiAgICBjYWxsKCdmZWxvZy5pbmZvJywgJ3RvZ2dsZV9leHRlbnNpb25fb25fc2l0ZScsIHRyYWNrRGF0YSlcbiAgICBjYWxsKCdzdGF0c2MudWkuaW5jcmVtZW50JywgJ3N0YWJpbGl0eTp0b2dnbGVfZXh0ZW5zaW9uX29uX3NpdGUnKVxuICAgIGNhbGwoJ21peHBhbmVsLnRyYWNrJywgJ0V4dDpDaGVja2luZ19Ub2dnbGVkOlBvcHVwJywgdHJhY2tEYXRhKVxuICAgIGNhbGwoJ2duYXIuc2VuZCcsIGAke2dldEJyb3dzZXIoKX1FeHQvY2hlY2tpbmdUb2dnbGVkYCwgdHJhY2tEYXRhKVxuICB9XG5cblxuICBmdW5jdGlvbiBvbkVuYWJsZURlZnNDbGljayhlKSB7XG4gICAgY29uZmlnLmVuYWJsZWREZWZzID0gY2JFbmFibGVEZWZzLmNoZWNrZWRcbiAgICBwcmVmcy5zZXQoJ2VuYWJsZWREZWZzJywgY29uZmlnLmVuYWJsZWREZWZzKVxuICAgIHJlbmRlcigpXG4gICAgbGV0IHRyYWNrRGF0YSA9IHtcbiAgICAgIGVuYWJsZWQ6IGNvbmZpZy5lbmFibGVkRGVmcyxcbiAgICB9XG4gICAgY2FsbCgnZmVsb2cuaW5mbycsICd0b2dnbGVfZXh0ZW5zaW9uX2RlZnMnLCB0cmFja0RhdGEpXG4gICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OkRlZmluaXRpb25zX1RvZ2dsZWQ6UG9wdXAnLCB0cmFja0RhdGEpXG4gICAgY2FsbCgnc3RhdHNjLnVpLmluY3JlbWVudCcsICdzdGFiaWxpdHk6ZGVmaW5pdGlvbnNfdG9nZ2xlZCcpXG4gICAgY2FsbCgnZ25hci5zZW5kJywgYCR7Z2V0QnJvd3NlcigpfUV4dC9kZWZpbml0aW9uc1RvZ2dsZWRgLCB0cmFja0RhdGEpXG4gIH1cblxuICBmdW5jdGlvbiBhZGREb2N1bWVudCgpIHtcbiAgICBmZXRjaChVUkxTLmRvY3NBcGksIHtcbiAgICAgIGRhdGE6IHtjb250ZW50OiAnJ30sXG4gICAgICBtZXRob2Q6ICdwb3N0JyxcbiAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfVxuICAgIH0pXG4gICAgLnRoZW4oZG9jID0+IGdvKGRvYy5pZCkpXG4gICAgLmNhdGNoKHJlcXVlc3RFcnJvcilcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlcXVlc3RFcnJvcihlKSB7XG4gICAgY2FsbCgnZmVsb2cud2FybicsICdhamF4X2Vycm9yJywge2V9KVxuICAgIGNvbnNvbGUuZXJyb3IoJ3JlcXVlc3QgZmFpbGVkJywgZSlcbiAgfVxuXG4gIGlmICghaXNGRigpKSB7XG4gICAgYWRkQ2xhc3MoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LCAnZ3ItcG9wdXAtd3JhcHBlci1yZWxheW91dCcpXG4gICAgYWRkQ2xhc3MoZG9jdW1lbnQuYm9keSwgJ2dyLXBvcHVwLXdyYXBwZXItcmVsYXlvdXQnKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gcmVuZGVyUmVhY3RXaXRoUGFyZW50KDxTZXR0aW5nc0NvbXBvbmVudCBjb25maWc9e2NvbmZpZ30gLz4sXG4gICAgICAgIGNvbmZpZy5lbCB8fCBkb2N1bWVudC5ib2R5LFxuICAgICAgICBpZCxcbiAgICAgICAgJ3NldHRpbmdzJ1xuICAgICAgKVxuICAgIH1cbiAgICBjYXRjaChlKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGUpXG4gICAgfVxuICB9XG5cbiAgbGV0IG1lID0gZW1pdHRlcih7XG4gICAgcmVtb3ZlOiBjb250YWluZXIucmVtb3ZlXG4gIH0pXG5cbiAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgbmV3cy5pbnN0YWxsKClcbiAgICBzZWVuUmVmZXJyYWxSaWJib24odHJ1ZSlcbiAgICBtZS5lbWl0KCdsb2FkJywgZWwpXG4gIH0sIDExMClcblxuICByZXR1cm4gbWVcbn1cblxuZXhwb3J0IGRlZmF1bHQgU2V0dGluZ3NcblxubGV0IFNldHRpbmdzQ29tcG9uZW50ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICBpZiAoIWlzRkYoKSkge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHJlbW92ZUNsYXNzKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJ2dyLXBvcHVwLXdyYXBwZXItcmVsYXlvdXQnKVxuICAgICAgICByZW1vdmVDbGFzcyhkb2N1bWVudC5ib2R5LCAnZ3ItcG9wdXAtd3JhcHBlci1yZWxheW91dCcpXG4gICAgICB9LCAxMDApXG4gICAgfVxuICB9LFxuICByZW5kZXIoKSB7XG4gICAgbGV0IGNvbmZpZyA9IHRoaXMucHJvcHMuY29uZmlnLFxuICAgICAgdXNlciA9IGNvbmZpZy51c2VyXG5cbiAgICBsZXQgY2xzID0gY3Moe1xuICAgICAgW3N0eWxlLmdyX3BvcHVwX3NldHRpbmdzXTogdHJ1ZSxcbiAgICAgIFtzdHlsZS51cGdyYWRlZF06IHVzZXIucHJlbWl1bSxcbiAgICAgIFtzdHlsZS5ub3Rfc3VwcG9ydGVkXTogIWNvbmZpZy5pc0NoZWNraW5nRW5hYmxlZE9uRG9tYWluLFxuICAgICAgW3N0eWxlLm5vX2ZpeGVzXTogIXVzZXIuZml4ZWRfZXJyb3JzIHx8IGlzTmFOKHVzZXIuZml4ZWRfZXJyb3JzKSxcbiAgICAgIFtzdHlsZS5mcmVlXTogIXVzZXIucHJlbWl1bSxcbiAgICAgIFtzdHlsZS5zaG93X25ld3NdOiBjb25maWcuc2hvd05ld3MsXG4gICAgICBbc3R5bGUuZmFkZV9uZXdzXTogY29uZmlnLmZhZGVOZXdzLFxuICAgICAgW3N0eWxlLmhhc19mYXZpY29uXTogISFjb25maWcuZmF2aWNvblxuICAgIH0pXG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9e2Nsc30+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPXtzdHlsZS5jb250ZW50fT5cbiAgICAgICAgICA8SGVhZGVyLz5cbiAgICAgICAgICA8TmV3cyAvPlxuICAgICAgICAgIDxTZXR0aW5nc0NvbnRlbnQgY29uZmlnPXtjb25maWd9IC8+XG4gICAgICAgICAgPEZvb3RlciAvPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfVxufSlcblxuZXhwb3J0IHtcbiAgU2V0dGluZ3NDb21wb25lbnRcbn1cbiIsIihmdW5jdGlvbiAoZ2xvYmFsKXtcbid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIF9kb20gPSByZXF1aXJlKCcuLi9kb20nKTtcblxudmFyIF91dGlsID0gcmVxdWlyZSgnLi4vdXRpbCcpO1xuXG52YXIgX2NvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZycpO1xuXG52YXIgX2VtaXR0ZXIgPSByZXF1aXJlKCdlbWl0dGVyJyk7XG5cbnZhciBfZW1pdHRlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9lbWl0dGVyKTtcblxudmFyIF9mb3JnZSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93Wydmb3JnZSddIDogdHlwZW9mIGdsb2JhbCAhPT0gXCJ1bmRlZmluZWRcIiA/IGdsb2JhbFsnZm9yZ2UnXSA6IG51bGwpO1xuXG52YXIgX2ZvcmdlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ZvcmdlKTtcblxudmFyIF9yZWFjdCA9IHJlcXVpcmUoJ3JlYWN0Jyk7XG5cbnZhciBfcmVhY3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcmVhY3QpO1xuXG52YXIgX3JlYWN0RG9tID0gcmVxdWlyZSgncmVhY3QtZG9tJyk7XG5cbnZhciBfc3R5bFBvcHVwU2lnbmluU3R5bCA9IHJlcXVpcmUoJ3N0eWwvcG9wdXAtc2lnbmluLnN0eWwnKTtcblxudmFyIF9zdHlsUG9wdXBTaWduaW5TdHlsMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3N0eWxQb3B1cFNpZ25pblN0eWwpO1xuXG52YXIgX2hlYWRlciA9IHJlcXVpcmUoJy4vaGVhZGVyJyk7XG5cbnZhciBfaGVhZGVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2hlYWRlcik7XG5cbnZhciBfdHJhY2tpbmdJbmRleCA9IHJlcXVpcmUoJy4uL3RyYWNraW5nL2luZGV4Jyk7XG5cbmZ1bmN0aW9uIFNpZ25pbigpIHtcbiAgdmFyIGlkID0gKDAsIF91dGlsLmd1aWQpKCk7XG4gIHZhciBjb250YWluZXIgPSAoMCwgX2RvbS5yZW5kZXJSZWFjdFdpdGhQYXJlbnQpKF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFNpZ25pbkNvbXBvbmVudCwgbnVsbCksIGRvY3VtZW50LmJvZHksIGlkKSxcbiAgICAgIG5vZGUgPSAoMCwgX3JlYWN0RG9tLmZpbmRET01Ob2RlKShjb250YWluZXIuY29tcG9uZW50KSxcbiAgICAgIG1lID0gKDAsIF9lbWl0dGVyMlsnZGVmYXVsdCddKSh7IFJlYWN0OiBfcmVhY3QyWydkZWZhdWx0J10gfSk7IC8vcmVhY3QgaGVyZSB0byBmaXggbGludCAoUmVhY3QgaXMgZGVmaW5lZCBidXQgbmV2ZXIgdXNlZClcbiAgbWUuZW1pdCgnbG9hZCcsIG5vZGUpO1xuXG4gICgwLCBfZG9tLmxpc3Rlbikobm9kZSwgJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAoZS50YXJnZXQuaHJlZiAmJiAoMCwgX3V0aWwuaXNTYWZhcmkpKCkpIHtcbiAgICAgIF9mb3JnZTJbJ2RlZmF1bHQnXS50YWJzLm9wZW4oZS50YXJnZXQuaHJlZik7XG4gICAgICB3aW5kb3cuc2FmYXJpLmV4dGVuc2lvbi5wb3BvdmVyc1swXS5oaWRlKCk7XG4gICAgfVxuICB9KTtcblxuICBtZS5yZW1vdmUgPSBjb250YWluZXIucmVtb3ZlO1xuICBtZS5lbCA9IG5vZGU7XG4gIHJldHVybiBtZTtcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gU2lnbmluO1xuXG52YXIgU2lnbmluQ29tcG9uZW50ID0gX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUNsYXNzKHtcbiAgZGlzcGxheU5hbWU6ICdTaWduaW5Db21wb25lbnQnLFxuXG4gIG9uU2lnblVwOiBmdW5jdGlvbiBvblNpZ25VcChlKSB7XG4gICAgKDAsIF90cmFja2luZ0luZGV4LmZpcmUpKCdsb2dpbi1hdHRlbXB0JywgJ3NldHRpbmdzX3Rvb2xiYXJfc2lnbl91cCcpO1xuICB9LFxuXG4gIG9uU2lnbkluOiBmdW5jdGlvbiBvblNpZ25JbihlKSB7XG4gICAgKDAsIF90cmFja2luZ0luZGV4LmZpcmUpKCdsb2dpbi1hdHRlbXB0JywgJ3NldHRpbmdzX3Rvb2xiYXJfc2lnbl9pbicpO1xuICB9LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHJldHVybiBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICdkaXYnLFxuICAgICAgeyBjbGFzc05hbWU6IF9zdHlsUG9wdXBTaWduaW5TdHlsMlsnZGVmYXVsdCddLnNpZ25pbiB9LFxuICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoX2hlYWRlcjJbJ2RlZmF1bHQnXSwgbnVsbCksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2RpdicsXG4gICAgICAgIHsgY2xhc3NOYW1lOiBfc3R5bFBvcHVwU2lnbmluU3R5bDJbJ2RlZmF1bHQnXS5jb250ZW50IH0sXG4gICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICdkaXYnLFxuICAgICAgICAgIHsgY2xhc3NOYW1lOiBfc3R5bFBvcHVwU2lnbmluU3R5bDJbJ2RlZmF1bHQnXS5iYW5uZXIgfSxcbiAgICAgICAgICAnR3JhbW1hcmx5IGlzIGFjdGl2ZSwgYnV0XFx1MjAyOCcsXG4gICAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoJ2JyJywgbnVsbCksXG4gICAgICAgICAgJyBrZXkgZmVhdHVyZXMgYXJlIG1pc3NpbmcnXG4gICAgICAgICksXG4gICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICdkaXYnLFxuICAgICAgICAgIHsgY2xhc3NOYW1lOiBfc3R5bFBvcHVwU2lnbmluU3R5bDJbJ2RlZmF1bHQnXS5kZXNjciB9LFxuICAgICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgICB7IGNsYXNzTmFtZTogX3N0eWxQb3B1cFNpZ25pblN0eWwyWydkZWZhdWx0J10uZGVzY3JfdGl0bGUgfSxcbiAgICAgICAgICAgICdTaWduIHVwIG5vdyB0byB1bmxvY2sgdGhlIGZvbGxvd2luZzonXG4gICAgICAgICAgKSxcbiAgICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAgICd1bCcsXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAgICdsaScsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICdTdG9yZSB5b3VyIHBlcnNvbmFsIGRpY3Rpb25hcnknXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAgICdsaScsXG4gICAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICAgICdTYXZlIGFuZCBhY2Nlc3MgeW91ciB3b3JrIGZyb20gYW55IGNvbXB1dGVyJ1xuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAnbGknLFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAnR2V0IHdlZWtseSB3cml0aW5nIHN0YXRpc3RpY3MgYW5kIHRpcHMnXG4gICAgICAgICAgICApXG4gICAgICAgICAgKVxuICAgICAgICApLFxuICAgICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgICAnZGl2JyxcbiAgICAgICAgICB7IGNsYXNzTmFtZTogX3N0eWxQb3B1cFNpZ25pblN0eWwyWydkZWZhdWx0J10uYnV0dG9ucyB9LFxuICAgICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgJ2EnLFxuICAgICAgICAgICAgeyBjbGFzc05hbWU6IF9zdHlsUG9wdXBTaWduaW5TdHlsMlsnZGVmYXVsdCddLmJ1dHRvbiArICcgJyArIF9zdHlsUG9wdXBTaWduaW5TdHlsMlsnZGVmYXVsdCddLmF1dGhfYnV0dG9uLCBvbkNsaWNrOiB0aGlzLm9uU2lnblVwLCBocmVmOiBfY29uZmlnLlVSTFMuc2lnbnVwLCB0YXJnZXQ6ICdfX2JsYW5rJywgcm9sZTogJ2J1dHRvbicgfSxcbiAgICAgICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAnc3BhbicsXG4gICAgICAgICAgICAgIHsgY2xhc3NOYW1lOiBfc3R5bFBvcHVwU2lnbmluU3R5bDJbJ2RlZmF1bHQnXS5zaWduX3VwIH0sXG4gICAgICAgICAgICAgICdTaWduIFVwJ1xuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIF9yZWFjdDJbJ2RlZmF1bHQnXS5jcmVhdGVFbGVtZW50KFxuICAgICAgICAgICAgICAnc3BhbicsXG4gICAgICAgICAgICAgIHsgY2xhc3NOYW1lOiBfc3R5bFBvcHVwU2lnbmluU3R5bDJbJ2RlZmF1bHQnXS5mcmVlIH0sXG4gICAgICAgICAgICAgICdJdFxcJ3MgZnJlZSdcbiAgICAgICAgICAgIClcbiAgICAgICAgICApXG4gICAgICAgIClcbiAgICAgICksXG4gICAgICBfcmVhY3QyWydkZWZhdWx0J10uY3JlYXRlRWxlbWVudChcbiAgICAgICAgJ2RpdicsXG4gICAgICAgIHsgY2xhc3NOYW1lOiBfc3R5bFBvcHVwU2lnbmluU3R5bDJbJ2RlZmF1bHQnXS5mb290ZXIgfSxcbiAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgJ2RpdicsXG4gICAgICAgICAgeyBjbGFzc05hbWU6IF9zdHlsUG9wdXBTaWduaW5TdHlsMlsnZGVmYXVsdCddLmxvZ2luX3RleHQgfSxcbiAgICAgICAgICAnQWxyZWFkeSBoYXZlIGFuIGFjY291bnQ/ICcsXG4gICAgICAgICAgX3JlYWN0MlsnZGVmYXVsdCddLmNyZWF0ZUVsZW1lbnQoXG4gICAgICAgICAgICAnYScsXG4gICAgICAgICAgICB7IGNsYXNzTmFtZTogX3N0eWxQb3B1cFNpZ25pblN0eWwyWydkZWZhdWx0J10uc2lnbmluX2xpbmssIG9uQ2xpY2s6IHRoaXMub25TaWduSW4sIGhyZWY6IF9jb25maWcuVVJMUy5zaWduaW4sIHRhcmdldDogJ19fYmxhbmsnIH0sXG4gICAgICAgICAgICAnTG9nIGluJ1xuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKVxuICAgICk7XG4gIH1cbn0pO1xubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbn0pLmNhbGwodGhpcyx0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldDp1dGYtODtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJaTl3Y205cVpXTjBMM055WXk5cWN5OXNhV0l2Y0c5d2RYQXZjMmxuYm1sdUxtcHpJbDBzSW01aGJXVnpJanBiWFN3aWJXRndjR2x1WjNNaU9pSTdPenM3T3pzN096dHRRa0ZCTkVNc1VVRkJVVHM3YjBKQlEzWkNMRk5CUVZNN08zTkNRVU51UWl4WFFVRlhPenQxUWtGRFZpeFRRVUZUT3pzN08zRkNRVU5ZTEU5QlFVODdPenM3Y1VKQlExQXNUMEZCVHpzN096dDNRa0ZEUXl4WFFVRlhPenR0UTBGRGJrSXNkMEpCUVhkQ096czdPM05DUVVOMlFpeFZRVUZWT3pzN096WkNRVU5XTEcxQ1FVRnRRanM3UVVGRmRFTXNVMEZCVXl4TlFVRk5MRWRCUVVjN1FVRkRhRUlzVFVGQlNTeEZRVUZGTEVkQlFVY3NhVUpCUVUwc1EwRkJRVHRCUVVObUxFMUJRVWtzVTBGQlV5eEhRVUZITEdkRFFVRnpRaXhwUTBGQlF5eGxRVUZsTEU5QlFVVXNSVUZCUlN4UlFVRlJMRU5CUVVNc1NVRkJTU3hGUVVGRkxFVkJRVVVzUTBGQlF6dE5RVU14UlN4SlFVRkpMRWRCUVVjc01rSkJRVmtzVTBGQlV5eERRVUZETEZOQlFWTXNRMEZCUXp0TlFVTjZReXhGUVVGRkxFZEJRVWNzTUVKQlFWRXNSVUZCUXl4TFFVRkxMRzlDUVVGQkxFVkJRVU1zUTBGQlF5eERRVUZCTzBGQlEzSkNMRWxCUVVVc1EwRkJReXhKUVVGSkxFTkJRVU1zVFVGQlRTeEZRVUZGTEVsQlFVa3NRMEZCUXl4RFFVRkJPenRCUVVWeVFpeHRRa0ZCVHl4SlFVRkpMRVZCUVVVc1QwRkJUeXhGUVVGRkxGVkJRVk1zUTBGQlF5eEZRVUZGTzBGQlEyaERMRkZCUVVrc1EwRkJReXhEUVVGRExFMUJRVTBzUTBGQlF5eEpRVUZKTEVsQlFVa3NjVUpCUVZVc1JVRkJSVHRCUVVNdlFpeDVRa0ZCVFN4SlFVRkpMRU5CUVVNc1NVRkJTU3hEUVVGRExFTkJRVU1zUTBGQlF5eE5RVUZOTEVOQlFVTXNTVUZCU1N4RFFVRkRMRU5CUVVFN1FVRkRPVUlzV1VGQlRTeERRVUZETEUxQlFVMHNRMEZCUXl4VFFVRlRMRU5CUVVNc1VVRkJVU3hEUVVGRExFTkJRVU1zUTBGQlF5eERRVUZETEVsQlFVa3NSVUZCUlN4RFFVRkJPMHRCUXpORE8wZEJRMFlzUTBGQlF5eERRVUZCT3p0QlFVVkdMRWxCUVVVc1EwRkJReXhOUVVGTkxFZEJRVWNzVTBGQlV5eERRVUZETEUxQlFVMHNRMEZCUVR0QlFVTTFRaXhKUVVGRkxFTkJRVU1zUlVGQlJTeEhRVUZITEVsQlFVa3NRMEZCUVR0QlFVTmFMRk5CUVU4c1JVRkJSU3hEUVVGQk8wTkJRMVk3TzNGQ1FVVmpMRTFCUVUwN08wRkJSM0pDTEVsQlFVa3NaVUZCWlN4SFFVRkhMRzFDUVVGTkxGZEJRVmNzUTBGQlF6czdPMEZCUTNSRExGVkJRVkVzUlVGQlFTeHJRa0ZCUXl4RFFVRkRMRVZCUVVVN1FVRkRWaXcyUWtGQlN5eGxRVUZsTEVWQlFVVXNNRUpCUVRCQ0xFTkJRVU1zUTBGQlFUdEhRVU5zUkRzN1FVRkZSQ3hWUVVGUkxFVkJRVUVzYTBKQlFVTXNRMEZCUXl4RlFVRkZPMEZCUTFZc05rSkJRVXNzWlVGQlpTeEZRVUZGTERCQ1FVRXdRaXhEUVVGRExFTkJRVUU3UjBGRGJFUTdPMEZCUlVRc1VVRkJUU3hGUVVGQkxHdENRVUZITzBGQlExQXNWMEZEUlRzN1VVRkJTeXhUUVVGVExFVkJRVVVzYVVOQlFVMHNUVUZCVFN4QlFVRkRPMDFCUXpOQ0xESkVRVUZUTzAxQlExUTdPMVZCUVVzc1UwRkJVeXhGUVVGRkxHbERRVUZOTEU5QlFVOHNRVUZCUXp0UlFVTTFRanM3V1VGQlN5eFRRVUZUTEVWQlFVVXNhVU5CUVUwc1RVRkJUU3hCUVVGRE96dFZRVU4yUXl3MFEwRkJTenM3VTBGQkswSTdVVUZETVVJN08xbEJRVXNzVTBGQlV5eEZRVUZGTEdsRFFVRk5MRXRCUVVzc1FVRkJRenRWUVVNeFFqczdZMEZCU3l4VFFVRlRMRVZCUVVVc2FVTkJRVTBzVjBGQlZ5eEJRVUZET3p0WFFVRXlRenRWUVVNM1JUczdPMWxCUTBVN096czdZVUZCZFVNN1dVRkRka003T3pzN1lVRkJiMFE3V1VGRGNFUTdPenM3WVVGQkswTTdWMEZETlVNN1UwRkRSRHRSUVVOT096dFpRVUZMTEZOQlFWTXNSVUZCUlN4cFEwRkJUU3hQUVVGUExFRkJRVU03VlVGRE5VSTdPMk5CUVVjc1UwRkJVeXhGUVVGRkxHbERRVUZOTEUxQlFVMHNSMEZCUnl4SFFVRkhMRWRCUVVjc2FVTkJRVTBzVjBGQlZ5eEJRVUZETEVWQlFVTXNUMEZCVHl4RlFVRkZMRWxCUVVrc1EwRkJReXhSUVVGUkxFRkJRVU1zUlVGQlF5eEpRVUZKTEVWQlFVVXNZVUZCU3l4TlFVRk5MRUZCUVVNc1JVRkJReXhOUVVGTkxFVkJRVU1zVTBGQlV5eEZRVUZETEVsQlFVa3NSVUZCUXl4UlFVRlJPMWxCUVVNN08yZENRVUZOTEZOQlFWTXNSVUZCUlN4cFEwRkJUU3hQUVVGUExFRkJRVU03TzJGQlFXVTdXVUZCUVRzN1owSkJRVTBzVTBGQlV5eEZRVUZGTEdsRFFVRk5MRWxCUVVrc1FVRkJRenM3WVVGQmFVSTdWMEZCU1R0VFFVTXpUanRQUVVOR08wMUJRMDQ3TzFWQlFVc3NVMEZCVXl4RlFVRkZMR2xEUVVGTkxFMUJRVTBzUVVGQlF6dFJRVU16UWpzN1dVRkJTeXhUUVVGVExFVkJRVVVzYVVOQlFVMHNWVUZCVlN4QlFVRkRPenRWUVVFd1FqczdZMEZCUnl4VFFVRlRMRVZCUVVVc2FVTkJRVTBzVjBGQlZ5eEJRVUZETEVWQlFVTXNUMEZCVHl4RlFVRkZMRWxCUVVrc1EwRkJReXhSUVVGUkxFRkJRVU1zUlVGQlF5eEpRVUZKTEVWQlFVVXNZVUZCU3l4TlFVRk5MRUZCUVVNc1JVRkJReXhOUVVGTkxFVkJRVU1zVTBGQlV6czdWMEZCVnp0VFFVRk5PMDlCUTNCTE8wdEJRMFlzUTBGRFVEdEhRVU5HTzBOQlEwWXNRMEZCUXl4RFFVRkJJaXdpWm1sc1pTSTZJbWRsYm1WeVlYUmxaQzVxY3lJc0luTnZkWEpqWlZKdmIzUWlPaUlpTENKemIzVnlZMlZ6UTI5dWRHVnVkQ0k2V3lKcGJYQnZjblFnZTNKbGJtUmxjbEpsWVdOMFYybDBhRkJoY21WdWRDd2diR2x6ZEdWdWZTQm1jbTl0SUNjdUxpOWtiMjBuWEc1cGJYQnZjblFnZTJkMWFXUXNJR2x6VTJGbVlYSnBmU0JtY205dElDY3VMaTkxZEdsc0oxeHVhVzF3YjNKMElIdFZVa3hUZlNCbWNtOXRJQ2N1TGk5amIyNW1hV2NuWEc1cGJYQnZjblFnWlcxcGRIUmxjaUJtY205dElDZGxiV2wwZEdWeUoxeHVhVzF3YjNKMElHWnZjbWRsSUdaeWIyMGdKMlp2Y21kbEoxeHVhVzF3YjNKMElGSmxZV04wSUdaeWIyMGdKM0psWVdOMEoxeHVhVzF3YjNKMElIdG1hVzVrUkU5TlRtOWtaWDBnWm5KdmJTQW5jbVZoWTNRdFpHOXRKMXh1YVcxd2IzSjBJSE4wZVd4bElHWnliMjBnSjNOMGVXd3ZjRzl3ZFhBdGMybG5ibWx1TG5OMGVXd25YRzVwYlhCdmNuUWdTR1ZoWkdWeUlHWnliMjBnSnk0dmFHVmhaR1Z5SjF4dWFXMXdiM0owSUh0bWFYSmxmU0JtY205dElDY3VMaTkwY21GamEybHVaeTlwYm1SbGVDZGNibHh1Wm5WdVkzUnBiMjRnVTJsbmJtbHVLQ2tnZTF4dUlDQnNaWFFnYVdRZ1BTQm5kV2xrS0NsY2JpQWdiR1YwSUdOdmJuUmhhVzVsY2lBOUlISmxibVJsY2xKbFlXTjBWMmwwYUZCaGNtVnVkQ2c4VTJsbmJtbHVRMjl0Y0c5dVpXNTBMejRzSUdSdlkzVnRaVzUwTG1KdlpIa3NJR2xrS1N4Y2JpQWdJQ0J1YjJSbElEMGdabWx1WkVSUFRVNXZaR1VvWTI5dWRHRnBibVZ5TG1OdmJYQnZibVZ1ZENrc1hHNGdJRzFsSUQwZ1pXMXBkSFJsY2loN1VtVmhZM1I5S1NBdkwzSmxZV04wSUdobGNtVWdkRzhnWm1sNElHeHBiblFnS0ZKbFlXTjBJR2x6SUdSbFptbHVaV1FnWW5WMElHNWxkbVZ5SUhWelpXUXBYRzRnSUcxbExtVnRhWFFvSjJ4dllXUW5MQ0J1YjJSbEtWeHVYRzRnSUd4cGMzUmxiaWh1YjJSbExDQW5ZMnhwWTJzbkxDQm1kVzVqZEdsdmJpaGxLU0I3WEc0Z0lDQWdhV1lnS0dVdWRHRnlaMlYwTG1oeVpXWWdKaVlnYVhOVFlXWmhjbWtvS1NrZ2UxeHVJQ0FnSUNBZ1ptOXlaMlV1ZEdGaWN5NXZjR1Z1S0dVdWRHRnlaMlYwTG1oeVpXWXBYRzRnSUNBZ0lDQjNhVzVrYjNjdWMyRm1ZWEpwTG1WNGRHVnVjMmx2Ymk1d2IzQnZkbVZ5YzFzd1hTNW9hV1JsS0NsY2JpQWdJQ0I5WEc0Z0lIMHBYRzVjYmlBZ2JXVXVjbVZ0YjNabElEMGdZMjl1ZEdGcGJtVnlMbkpsYlc5MlpWeHVJQ0J0WlM1bGJDQTlJRzV2WkdWY2JpQWdjbVYwZFhKdUlHMWxYRzU5WEc1Y2JtVjRjRzl5ZENCa1pXWmhkV3gwSUZOcFoyNXBibHh1WEc1Y2JteGxkQ0JUYVdkdWFXNURiMjF3YjI1bGJuUWdQU0JTWldGamRDNWpjbVZoZEdWRGJHRnpjeWg3WEc0Z0lHOXVVMmxuYmxWd0tHVXBJSHRjYmlBZ0lDQm1hWEpsS0Nkc2IyZHBiaTFoZEhSbGJYQjBKeXdnSjNObGRIUnBibWR6WDNSdmIyeGlZWEpmYzJsbmJsOTFjQ2NwWEc0Z0lIMHNYRzVjYmlBZ2IyNVRhV2R1U1c0b1pTa2dlMXh1SUNBZ0lHWnBjbVVvSjJ4dloybHVMV0YwZEdWdGNIUW5MQ0FuYzJWMGRHbHVaM05mZEc5dmJHSmhjbDl6YVdkdVgybHVKeWxjYmlBZ2ZTeGNibHh1SUNCeVpXNWtaWElvS1NCN1hHNGdJQ0FnY21WMGRYSnVJQ2hjYmlBZ0lDQWdJRHhrYVhZZ1kyeGhjM05PWVcxbFBYdHpkSGxzWlM1emFXZHVhVzU5UGx4dUlDQWdJQ0FnSUNBOFNHVmhaR1Z5THo1Y2JpQWdJQ0FnSUNBZ1BHUnBkaUJqYkdGemMwNWhiV1U5ZTNOMGVXeGxMbU52Ym5SbGJuUjlQbHh1SUNBZ0lDQWdJQ0FnSUR4a2FYWWdZMnhoYzNOT1lXMWxQWHR6ZEhsc1pTNWlZVzV1WlhKOVBrZHlZVzF0WVhKc2VTQnBjeUJoWTNScGRtVXNJR0oxZE9LQXFEeGljaTgrSUd0bGVTQm1aV0YwZFhKbGN5QmhjbVVnYldsemMybHVaend2WkdsMlBseHVJQ0FnSUNBZ0lDQWdJRHhrYVhZZ1kyeGhjM05PWVcxbFBYdHpkSGxzWlM1a1pYTmpjbjArWEc0Z0lDQWdJQ0FnSUNBZ0lDQThaR2wySUdOc1lYTnpUbUZ0WlQxN2MzUjViR1V1WkdWelkzSmZkR2wwYkdWOVBsTnBaMjRnZFhBZ2JtOTNJSFJ2SUhWdWJHOWpheUIwYUdVZ1ptOXNiRzkzYVc1bk9qd3ZaR2wyUGx4dUlDQWdJQ0FnSUNBZ0lDQWdQSFZzUGx4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0E4YkdrK1UzUnZjbVVnZVc5MWNpQndaWEp6YjI1aGJDQmthV04wYVc5dVlYSjVQQzlzYVQ1Y2JpQWdJQ0FnSUNBZ0lDQWdJQ0FnUEd4cFBsTmhkbVVnWVc1a0lHRmpZMlZ6Y3lCNWIzVnlJSGR2Y21zZ1puSnZiU0JoYm5rZ1kyOXRjSFYwWlhJOEwyeHBQbHh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQThiR2srUjJWMElIZGxaV3RzZVNCM2NtbDBhVzVuSUhOMFlYUnBjM1JwWTNNZ1lXNWtJSFJwY0hNOEwyeHBQbHh1SUNBZ0lDQWdJQ0FnSUNBZ1BDOTFiRDVjYmlBZ0lDQWdJQ0FnSUNBOEwyUnBkajVjYmlBZ0lDQWdJQ0FnSUNBOFpHbDJJR05zWVhOelRtRnRaVDE3YzNSNWJHVXVZblYwZEc5dWMzMCtYRzRnSUNBZ0lDQWdJQ0FnSUNBOFlTQmpiR0Z6YzA1aGJXVTllM04wZVd4bExtSjFkSFJ2YmlBcklDY2dKeUFySUhOMGVXeGxMbUYxZEdoZlluVjBkRzl1ZlNCdmJrTnNhV05yUFh0MGFHbHpMbTl1VTJsbmJsVndmU0JvY21WbVBYdFZVa3hUTG5OcFoyNTFjSDBnZEdGeVoyVjBQU2RmWDJKc1lXNXJKeUJ5YjJ4bFBTZGlkWFIwYjI0blBqeHpjR0Z1SUdOc1lYTnpUbUZ0WlQxN2MzUjViR1V1YzJsbmJsOTFjSDArVTJsbmJpQlZjRHd2YzNCaGJqNDhjM0JoYmlCamJHRnpjMDVoYldVOWUzTjBlV3hsTG1aeVpXVjlQa2wwSjNNZ1puSmxaVHd2YzNCaGJqNDhMMkUrWEc0Z0lDQWdJQ0FnSUNBZ1BDOWthWFkrWEc0Z0lDQWdJQ0FnSUR3dlpHbDJQbHh1SUNBZ0lDQWdJQ0E4WkdsMklHTnNZWE56VG1GdFpUMTdjM1I1YkdVdVptOXZkR1Z5ZlQ1Y2JpQWdJQ0FnSUNBZ0lDQThaR2wySUdOc1lYTnpUbUZ0WlQxN2MzUjViR1V1Ykc5bmFXNWZkR1Y0ZEgwK1FXeHlaV0ZrZVNCb1lYWmxJR0Z1SUdGalkyOTFiblEvSUR4aElHTnNZWE56VG1GdFpUMTdjM1I1YkdVdWMybG5ibWx1WDJ4cGJtdDlJRzl1UTJ4cFkyczllM1JvYVhNdWIyNVRhV2R1U1c1OUlHaHlaV1k5ZTFWU1RGTXVjMmxuYm1sdWZTQjBZWEpuWlhROUoxOWZZbXhoYm1zblBreHZaeUJwYmp3dllUNDhMMlJwZGo1Y2JpQWdJQ0FnSUNBZ1BDOWthWFkrWEc0Z0lDQWdJQ0E4TDJScGRqNWNiaUFnSUNBcFhHNGdJSDFjYm4wcFhHNWNiaUpkZlE9PSIsImltcG9ydCBmb3JnZSBmcm9tICcuL2ZvcmdlJ1xuaW1wb3J0IG1lc3NhZ2UgZnJvbSAnLi9tZXNzYWdlJ1xuaW1wb3J0IHtfZiwgaXNGdW5jdGlvbiwgZW1pdERvbUV2ZW50fSBmcm9tICcuL3V0aWwnXG5pbXBvcnQge2dldERvbWFpbn0gZnJvbSAnLi9sb2NhdGlvbidcbmltcG9ydCB7bGlzdGVufSBmcm9tICcuL2RvbSdcbmltcG9ydCBlbWl0dGVyIGZyb20gJ2VtaXR0ZXInXG5cblxuLy93ZSByZWNlaXZlIGhlcmUgbWVzc2FnZSBmcm9tIGJnIHBhZ2UsIHBvcHVwLCBvciBvdGhlciB0YWIsIGFuZCBmaXJlIHByZWZzIGNoYW5nZSBldmVudFxubWVzc2FnZS5vbigncHJlZnMtY2hhbmdlZCcsIG9iaiA9PiB7XG4gIG1lLmVtaXQob2JqLnByZWYsIG9iai52YWx1ZSlcbiAgaWYgKCFwcm9jZXNzLmVudi5QUk9EKSB7XG4gICAgZW1pdERvbUV2ZW50KCdwcmVmcy1jaGFuZ2VkJywgb2JqKVxuICB9XG59KVxuXG5tZXNzYWdlLm9uKCdlbmFibGVkJywgb2JqID0+IHtcbiAgbWUuZW1pdCgnZW5hYmxlZCcsIG9iailcbn0pXG5cbmxldCBwZ2V0ID0gcHJvcCA9PiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gIHRyeSB7XG4gICAgZm9yZ2UucHJlZnMuZ2V0KHByb3AsIHJlc29sdmUsIGUgPT4ge1xuICAgICAgaWYgKGUgJiYgZS5tZXNzYWdlICYmIGUubWVzc2FnZS5pbmNsdWRlcygnU3ludGF4RXJyb3InKSkge1xuICAgICAgICBmb3JnZS5wcmVmcy5jbGVhcihwcm9wKVxuICAgICAgICByZXR1cm4gcmVqZWN0KGBQcm9wOiR7cHJvcH0gaGFzIGNvcnJ1cHRlZCB2YWx1ZSwgY2xlYW51cGApXG4gICAgICB9XG4gICAgICByZWplY3QoZSlcbiAgICB9KVxuICB9XG4gIGNhdGNoKGUpIHtcbiAgICByZWplY3QoZSlcbiAgfVxufSlcblxubGV0IG1lID0gZW1pdHRlcih7XG4gIGdldDogYXN5bmMgKHByb3BzLCBjYikgPT4gey8vVE9ETyByZWZhY3RvciB3aXRob3V0IGNhbGxiYWNrc1xuICAgIGlmIChBcnJheS5pc0FycmF5KHByb3BzKSkge1xuXG4gICAgICAvL2VuYWJsZWQgaXMgY2FsY3VsYXRlZCBwcm9wZXJ0eSwgc28gd2Ugb25lIGFkZGl0aW9uYWwgY2FsbGJhY2tcbiAgICAgIGlmIChwcm9wcy5pbmNsdWRlcygnZW5hYmxlZCcpICYmIHByb3BzLmluY2x1ZGVzKCdkb21haW4nKSkge1xuICAgICAgICBsZXQgX2NiID0gY2JcbiAgICAgICAgY2IgPSBvYmogPT4ge1xuICAgICAgICAgIG1lLmVuYWJsZWQoJycsIG9iai5kb21haW4sIGVuYWJsZWQgPT4ge1xuICAgICAgICAgICAgb2JqLmVuYWJsZWQgPSBlbmFibGVkXG4gICAgICAgICAgICBfY2Iob2JqKVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGV0IHJlc3VsdCA9IHt9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCB2YWx1ZXMgPSBhd2FpdCogcHJvcHMubWFwKHBnZXQpXG5cbiAgICAgICAgcmVzdWx0ID0gcHJvcHMucmVkdWNlKChvYmosIHByb3AsIGkpID0+IE9iamVjdC5hc3NpZ24ob2JqLCB7W3Byb3BdOiB2YWx1ZXNbaV19KSwge30pXG5cbiAgICAgICAgY2IgJiYgY2IocmVzdWx0KVxuICAgICAgfVxuICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcigncHJlZnMgZ2V0IGVycm9yOicsIGUpXG4gICAgICAgIG1lc3NhZ2UuZW1pdEVycm9yKGUpXG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXN1bHRcbiAgICB9XG5cbiAgICBsZXQgcmVzdWx0ID0gcGdldChwcm9wcylcblxuICAgIGlmIChjYikge1xuICAgICAgcmVzdWx0LnRoZW4oY2IsIG1lc3NhZ2UuZW1pdEVycm9yKVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQudGhlbih4ID0+IHgsIGUgPT4ge1xuICAgICAgICBtZXNzYWdlLmVtaXRFcnJvcihlKVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgfSlcbiAgICB9XG4gIH0sXG4gIHNldDogYXN5bmMgKHByZWYsIHZhbHVlKSA9PiB7XG4gICAgaWYgKHByZWYgIT09IG51bGwgJiYgdHlwZW9mIHByZWYgPT09ICdvYmplY3QnKSB7XG4gICAgICByZXR1cm4gT2JqZWN0LmtleXMocHJlZikuZm9yRWFjaChrZXkgPT4gbWUuc2V0KGtleSwgcHJlZltrZXldKSlcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgbGV0IG9sZFZhbCA9IGF3YWl0IHBnZXQocHJlZilcbiAgICAgIGlmIChvbGRWYWwgIT0gdmFsdWUpIHtcbiAgICAgICAgbWVzc2FnZS5lbWl0VGFicygncHJlZnMtY2hhbmdlZCcsIHtwcmVmLCB2YWx1ZX0pXG4gICAgICAgIGlmICghcHJvY2Vzcy5lbnYuUFJPRCkge1xuICAgICAgICAgIGVtaXREb21FdmVudCgncHJlZnMtY2hhbmdlZCcsIHtrZXk6IHByZWYsIHZhbHVlfSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmb3JnZS5wcmVmcy5zZXQocHJlZiwgdmFsdWUpXG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICBtZXNzYWdlLmVtaXRFcnJvcihlKVxuICAgIH1cbiAgfSxcbiAgY2xlYXJBbGw6ICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgZm9yZ2UucHJlZnMuY2xlYXJBbGwoKVxuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgbWVzc2FnZS5lbWl0RXJyb3IoZSlcbiAgICB9XG4gIH0sXG4gIGVuYWJsZWQ6ICh2YWx1ZSA9ICcnLCBkb21haW4sIGNiID0gX2YpID0+IHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIGNiID0gdmFsdWVcbiAgICAgIHZhbHVlID0gJydcbiAgICB9XG5cbiAgICBsZXQgaW52b2x2ZSA9IGRvbWFpbiA9PiBtZS5nZXQoJ2VuYWJsZWRfZGInLCBkYiA9PlxuICAgICAgY2IoX2VuYWJsZWQoZGIsIHZhbHVlLCBkb21haW4pKVxuICAgIClcblxuICAgIGRvbWFpbiA/IGludm9sdmUoZG9tYWluKSA6IGdldERvbWFpbihpbnZvbHZlKVxuICB9LFxuICBpbmNGaXhlZDogKGluYyA9IDEpID0+IHtcbiAgICBtZS5nZXQoJ2ZpeGVkX2Vycm9ycycsIGZpeGVkID0+IHtcbiAgICAgIGZpeGVkID0gcGFyc2VJbnQoZml4ZWQpXG4gICAgICBpZiAoaXNOYU4oZml4ZWQpKSBmaXhlZCA9IDBcbiAgICAgIGZpeGVkICs9IGluY1xuICAgICAgbWUuc2V0KCdmaXhlZF9lcnJvcnMnLCBmaXhlZClcbiAgICB9KVxuICB9LFxuICBpc0V4dDI6ICgpID0+IG1lLmdldCgnZXh0MicpXG59KVxuXG5mdW5jdGlvbiBfZW5hYmxlZChkYiwgdmFsdWUsIGRvbWFpbikge1xuICBsZXQgd3JpdGUgPSB0eXBlb2YgdmFsdWUgPT0gJ2Jvb2xlYW4nLFxuICAgIGpzb24gPSB7fVxuXG4gIHRyeSB7XG4gICAgaWYgKCFkYikgdGhyb3cgJ2JhZCBkYidcbiAgICBqc29uID0gSlNPTi5wYXJzZShkYilcbiAgfVxuICBjYXRjaCAoZSkge1xuICAgIG1lLnNldCgnZW5hYmxlZF9kYicsICd7fScpXG4gIH1cblxuICBmdW5jdGlvbiBnZXREb21haW5TZXR0aW5ncyhqc29uKSB7XG4gICAgcmV0dXJuIGpzb25bZG9tYWluXSB8fCB7ZW5hYmxlZDogdHJ1ZX1cbiAgfVxuXG4gIGlmICh2YWx1ZSA9PT0gJycgJiYgZG9tYWluKSB7XG4gICAgcmV0dXJuIGdldERvbWFpblNldHRpbmdzKGpzb24pLmVuYWJsZWRcbiAgfVxuXG4gIGlmICh3cml0ZSkge1xuICAgIGxldCBzZXR0aW5ncyA9IGdldERvbWFpblNldHRpbmdzKGpzb24pXG4gICAgc2V0dGluZ3MuZW5hYmxlZCA9IHZhbHVlXG4gICAganNvbi5sYXN0Q2hhbmdlID0ge3ZhbHVlLCBkb21haW59XG4gICAganNvbltkb21haW5dID0gc2V0dGluZ3NcbiAgICBtZS5zZXQoJ2VuYWJsZWRfZGInLCBKU09OLnN0cmluZ2lmeShqc29uKSlcbiAgICBtZXNzYWdlLmVtaXRUYWJzKCdlbmFibGVkJywganNvbi5sYXN0Q2hhbmdlKVxuICB9XG5cbiAgcmV0dXJuIHZhbHVlXG59XG5cbmlmICghcHJvY2Vzcy5lbnYuUFJPRCkge1xuICAvL2hvb2sgdG8gZW5hYmxlIHRlc3RlcnMgdG8gc2V0IHByb3BzIGV4dGVybmFsbHlcbiAgbGlzdGVuKGRvY3VtZW50LCAnc2V0LXByZWZzJywgZSA9PiB7XG4gICAgbWUuc2V0KGUua2V5LCBlLnZhbHVlKVxuICB9KVxuXG4gIGxpc3Rlbihkb2N1bWVudCwgJ2dldC1wcmVmJywgYXN5bmMgZSA9PiB7XG4gICAgbGV0IHZhbHVlID0gYXdhaXQgbWUuZ2V0KGUua2V5KVxuICAgIGVtaXREb21FdmVudCgncHJlZicsIHtrZXk6IGUua2V5LCB2YWx1ZX0pXG4gIH0pXG59XG5cblxuZXhwb3J0IGRlZmF1bHQgbWVcbiIsImltcG9ydCB7cmVxdWVzdH0gZnJvbSAnLi9mb3JnZSdcbmltcG9ydCB7aXNUZXN0fSBmcm9tICcuL2NvbmZpZydcbmltcG9ydCB7aXNCZywgaXNGRiwgZGVsYXl9IGZyb20gJy4vdXRpbCdcbmltcG9ydCBtZXNzYWdlIGZyb20gJy4vbWVzc2FnZSdcblxuY29uc3QgQUpBWF9USU1FT1VUID0gMTAwMDBcblxuaWYgKGlzQmcoKSkge1xuICByZXF1aXJlKCd3aGF0d2ctZmV0Y2gnKVxuICBtZXNzYWdlLm9uKCdmZXRjaCcsIChkYXRhLCBjYiwgZXJyb3IpID0+IGJnRmV0Y2goZGF0YSkudGhlbihjYiwgZXJyb3IpKVxufVxuXG5mdW5jdGlvbiB0cmFuc2Zvcm1PcHRpb25zKG9wdHMpIHtcbiAgaWYgKG9wdHMuZGF0YSAmJiAob3B0cy5xdWVyeSB8fCBvcHRzLm1ldGhvZCAhPSAncG9zdCcpKSB7XG4gICAgb3B0cy51cmwgKz0gJz8nICsgcGFyYW1TdHIob3B0cy5kYXRhKVxuICB9XG5cbiAgaWYgKG9wdHMuZGF0YSAmJiBvcHRzLm1ldGhvZCA9PSAncG9zdCcgJiYgIW9wdHMucXVlcnkgJiYgIW9wdHMuYm9keSkge1xuICAgIHRyeSB7XG4gICAgICBvcHRzLmJvZHkgPSBKU09OLnN0cmluZ2lmeShvcHRzLmRhdGEpXG4gICAgfVxuICAgIGNhdGNoKGUpIHtcbiAgICAgIG9wdHMuYm9keSA9IHt9XG4gICAgICBjb25zb2xlLndhcm4oZSlcbiAgICB9XG5cbiAgICBvcHRzLmhlYWRlcnMgPSBvcHRzLmhlYWRlcnMgfHwge31cbiAgICBvcHRzLmhlYWRlcnNbJ0NvbnRlbnQtVHlwZSddID0gb3B0cy5oZWFkZXJzWydDb250ZW50LVR5cGUnXSB8fCAnYXBwbGljYXRpb24vanNvbidcbiAgICBkZWxldGUgb3B0cy5kYXRhXG4gIH1cbiAgb3B0cy5jcmVkZW50aWFscyA9ICdpbmNsdWRlJ1xuICByZXR1cm4gb3B0c1xufVxuXG5mdW5jdGlvbiBmZXRjaCh1cmwsIG9wdHMgPSB7fSkge1xuICAvLyBpZiAoY29uZmlnLmRldmVsb3BtZW50ICYmICFmb3JnZSkgdXJsID0gJy9hcGk/dXJsPScgKyB1cmxcbiAgb3B0cy51cmwgPSB1cmxcbiAgdHJhbnNmb3JtT3B0aW9ucyhvcHRzKVxuICBpZiAoaXNCZygpIHx8IGlzVGVzdCkgcmV0dXJuIGJnRmV0Y2gob3B0cylcblxuICByZXR1cm4gbWVzc2FnZS5wcm9taXNlQmFja2dyb3VuZCgnZmV0Y2gnLCBvcHRzKVxufVxuXG5mdW5jdGlvbiBiZ0ZldGNoKHt1cmwsIC4uLm9wdHN9KSB7XG4gIGlmIChpc0ZGKCkpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVxdWVzdC5hamF4KHtcbiAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgIGRhdGE6IG9wdHMuZGF0YSxcbiAgICAgICAgaGVhZGVyOiBvcHRzLmhlYWRlcixcbiAgICAgICAgdHlwZTogb3B0cy5tZXRob2QgfHwgJ0dFVCcsXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgIHRpbWVvdXQ6IG9wdHMudGltZW91dCB8fCBBSkFYX1RJTUVPVVQsXG4gICAgICAgIHN1Y2Nlc3M6IHJlcyA9PiB7XG4gICAgICAgICAgbGV0IGpzb25SZXMgPSAodHlwZW9mIHJlcyA9PT0gJ3N0cmluZycpID8gSlNPTi5wYXJzZShyZXMpIDogcmVzXG5cbiAgICAgICAgICBpZiAoanNvblJlcy5lcnJvcikgdGhyb3cgbmV3IEVycm9yKGpzb25SZXMuZXJyb3IpXG4gICAgICAgICAgcmVzb2x2ZShqc29uUmVzKVxuICAgICAgICB9LFxuICAgICAgICBlcnJvcjogKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIubWVzc2FnZSA9PT0gJ1JlcXVlc3QgdGltZWQgb3V0Jykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGZXRjaCByZXF1ZXN0IHRvICR7dXJsfSByZWplY3RlZCBieSB0aW1lb3V0YClcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyLm1lc3NhZ2UpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuXG4gIHJldHVybiBQcm9taXNlLnJhY2UoW1xuICAgIHdpbmRvdy5mZXRjaCh1cmwsIG9wdHMpXG4gICAgICAudGhlbihvcHRzLmlzVGV4dCA/IHRleHQgOiBqc29uKVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgaWYgKHJlcy5lcnJvcikgdGhyb3cgbmV3IEVycm9yKHJlcy5lcnJvcilcbiAgICAgICAgcmV0dXJuIHJlc1xuICAgICAgfSksXG4gICAgZGVsYXkob3B0cy50aW1lb3V0IHx8IEFKQVhfVElNRU9VVCkudGhlbigoKSA9PiB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEZldGNoIHJlcXVlc3QgdG8gJHt1cmx9IHJlamVjdGVkIGJ5IHRpbWVvdXRgKVxuICAgIH0pXG4gIF0pXG59XG5cbmZ1bmN0aW9uIGpzb24ocmVzcG9uc2UpIHtcbiAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKVxufVxuXG5mdW5jdGlvbiB0ZXh0KHJlc3BvbnNlKSB7XG4gIHJldHVybiByZXNwb25zZS50ZXh0KClcbn1cblxuZnVuY3Rpb24gcGFyYW1TdHIoZGF0YSkge1xuICBsZXQgcmVxID0gJydcbiAgZm9yIChsZXQgaXRlbSBpbiBkYXRhKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YVtpdGVtXSkpIHtcbiAgICAgIGlmIChkYXRhW2l0ZW1dLmxlbmd0aCkge1xuICAgICAgICByZXEgKz0gYCR7cmVxLmxlbmd0aCA/ICcmJyA6ICcnfSR7ZGF0YVtpdGVtXS5tYXAodmFsID0+IGAke2l0ZW19PSR7dmFsfWApLmpvaW4oJyYnKX1gIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbG9vcC1mdW5jXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmVxICs9IGAke3JlcS5sZW5ndGggPyAnJicgOiAnJ30ke2l0ZW19PSR7ZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbaXRlbV0pfWBcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgZmV0Y2gsXG4gIHRyYW5zZm9ybU9wdGlvbnMsXG4gIHBhcmFtU3RyXG59XG4iLCJpbXBvcnQge2xpc3Rlbn0gZnJvbSAnLi9kb20nXG5pbXBvcnQgbWVzc2FnZSBmcm9tICcuL21lc3NhZ2UnXG5pbXBvcnQge2VtaXREb21FdmVudH0gZnJvbSAnLi91dGlsJ1xuXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGFwaSgpIHtcbiAgbGlzdGVuKGRvY3VtZW50LCAnYmctcmVsb2FkJywgZW1pdEJnUmVsb2FkKVxuICBsaXN0ZW4oZG9jdW1lbnQsICdyZXNldCcsIGVtaXRSZXNldClcbiAgbGlzdGVuKGRvY3VtZW50LCAnZ2V0LXRyYWNrZXItbG9nJywgZ2V0VHJhY2tlckxvZylcbiAgbGlzdGVuKGRvY3VtZW50LCAnZ2V0LWV4dGlkJywgZ2V0RXh0SWQpXG4gIGxpc3Rlbihkb2N1bWVudCwgJ2dldC1jYXBpLWxvZycsIGdldENhcGlMb2cpXG4gIGxpc3Rlbihkb2N1bWVudCwgJ2dldC1sb2NhbGZvcmFnZScsIGdldExvY2FsZm9yYWdlKVxuICBsaXN0ZW4oZG9jdW1lbnQsICdzZXQtbG9jYWxmb3JhZ2UnLCBzZXRMb2NhbGZvcmFnZSlcblxuXG4gIGZ1bmN0aW9uIGVtaXRCZ1JlbG9hZCgpIHtcbiAgICBtZXNzYWdlLmVtaXRCYWNrZ3JvdW5kKCdiZy1yZWxvYWQnLCB7fSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGVtaXRSZXNldCgpIHtcbiAgICBtZXNzYWdlLmVtaXRCYWNrZ3JvdW5kKCdyZXNldCcsIHt9KVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0VHJhY2tlckxvZygpIHtcbiAgICBtZXNzYWdlLmVtaXRCYWNrZ3JvdW5kKCdnZXQtdHJhY2tlci1sb2cnLCB7fSwgcmVzdWx0ID0+IGVtaXREb21FdmVudCgndHJhY2tlci1sb2cnLCByZXN1bHQpKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0Q2FwaUxvZygpIHtcbiAgICBtZXNzYWdlLmVtaXRCYWNrZ3JvdW5kKCdnZXQtY2FwaS1sb2cnLCB7fSwgcmVzdWx0ID0+IGVtaXREb21FdmVudCgnY2FwaS1sb2cnLCByZXN1bHQpKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0RXh0SWQoKSB7XG4gICAgbWVzc2FnZS5lbWl0QmFja2dyb3VuZCgnZ2V0LWV4dGlkJywge30sIHJlc3VsdCA9PiBlbWl0RG9tRXZlbnQoJ2V4dGlkJywgcmVzdWx0KSlcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldExvY2FsZm9yYWdlKCkge1xuICAgIG1lc3NhZ2UuZW1pdEJhY2tncm91bmQoJ2dldC1sb2NhbGZvcmFnZScsIHt9LCByZXN1bHQgPT4gZW1pdERvbUV2ZW50KCdsb2NhbGZvcmFnZScsIHJlc3VsdCkpXG4gIH1cblxuICBmdW5jdGlvbiBzZXRMb2NhbGZvcmFnZShlKSB7XG4gICAgbWVzc2FnZS5lbWl0QmFja2dyb3VuZCgnc2V0LWxvY2FsZm9yYWdlJywge2tleTogZS5rZXksIHZhbHVlOiBlLnZhbHVlfSwgcmVzdWx0ID0+IGVtaXREb21FdmVudCgnbG9jYWxmb3JhZ2UnLCByZXN1bHQpKVxuICB9XG59XG4iLCJpbXBvcnQgbWVzc2FnZSBmcm9tICcuLi9tZXNzYWdlJ1xuaW1wb3J0IHtnZXREb21haW59IGZyb20gJy4uL2xvY2F0aW9uJ1xuaW1wb3J0IHtpc0JnLCBpc1BvcHVwLCBpc1NhZmFyaSwgX2Z9IGZyb20gJy4uL3V0aWwnXG5pbXBvcnQgdHJhY2tlciBmcm9tICcuL3RyYWNrZXInXG5pbXBvcnQgZmVsb2cgZnJvbSAnLi9mZWxvZ1BpeGVsJ1xuaW1wb3J0IHN0YXRzYyBmcm9tICcuL3N0YXRzY1BpeGVsJ1xuXG5cbmxldCBsb2cgPSBbXVxuXG5tZXNzYWdlLm9uKCd0cmFja2luZy1jYWxsJywgKHttc2csIGRhdGF9LCBjYiA9IF9mKSA9PiBjYWxsKG1zZywgLi4uZGF0YSkgJiYgY2IoKSlcblxuZXhwb3J0IGZ1bmN0aW9uIGNhbGwobXNnLCAuLi5wYXJhbXMpIHtcbiAgaWYgKGlzQmcoKSB8fCAoaXNQb3B1cCgpICYmIGlzU2FmYXJpKCkpKSB7XG4gICAgcmV0dXJuIHNldFRpbWVvdXQoKCkgPT4gY2FsbEFzeW5jKG1zZywgcGFyYW1zKSwgMjApXG4gIH1cblxuICBjb25zdCBpc0ZlbG9nID0gbXNnLmluY2x1ZGVzKCdmZWxvZycpXG4gIGNvbnN0IGRhdGEgPSBpc0ZlbG9nID8gZXh0ZW5kRmVsb2dEYXRhKHBhcmFtcykgOiBwYXJhbXNcbiAgY29uc3QgV0FJVF9USU1FT1VUID0gMTAwMDBcbiAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gZXJyb3JIYW5kbGUoJ3RpbWVvdXQgY2FsbCB0aHJvdWdoIGJnIHBhZ2UnKSwgV0FJVF9USU1FT1VUKVxuICBjb25zdCBwcmV2ZW50VGltZW91dCA9ICgpID0+IGNsZWFySW50ZXJ2YWwodGltZW91dClcbiAgY29uc3QgZXJyb3JIYW5kbGUgPSBlID0+IHtcbiAgICBwcmV2ZW50VGltZW91dCgpXG4gICAgaWYgKGlzRmVsb2cpIHJldHVybiBmZWxvZyguLi5kYXRhKVxuICAgIGlmIChtc2cuaW5jbHVkZXMoJ3N0YXRzYy51aS5pbmNyZW1lbnQnKSkgcmV0dXJuIHN0YXRzYyhtc2cuc3BsaXQoJy4nKS5wb3AoKSwgLi4uZGF0YSlcbiAgICBjb25zb2xlLndhcm4oYHRyYWNraW5nIGNhbGwgJHttc2d9IGZhaWxlZCwgcmVhc29uOiBgLCBlKVxuICB9XG5cbiAgbWVzc2FnZS5lbWl0QmFja2dyb3VuZCgndHJhY2tpbmctY2FsbCcsIHttc2csIGRhdGF9LCBwcmV2ZW50VGltZW91dCwgZXJyb3JIYW5kbGUpXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjYWxsQXN5bmMobXNnLCBkYXRhKSB7XG4gIGNvbnN0IGFyZ3MgPSBtc2cuc3BsaXQoJy4nKSxcbiAgICBtZXRob2QgPSBhcmdzLnBvcCgpLFxuICAgIGN0eCA9IGFyZ3MucmVkdWNlKChjbG9zdXJlLCBwYXJ0KSA9PlxuICAgICAgKHBhcnQgaW4gY2xvc3VyZSkgPyBjbG9zdXJlW3BhcnRdIDoge30sIHRyYWNrZXIoKSlcblxuICBpZiAoIWN0eCB8fCAhY3R4W21ldGhvZF0pIHJldHVybiBjb25zb2xlLmVycm9yKGBObyBtZXRob2QgJHttc2d9IGluIHRyYWNrZXIgb2JqZWN0YClcblxuICBjdHhbbWV0aG9kXSguLi5kYXRhKVxuICBsb2dDYWxsKG1zZywgZGF0YSlcbn1cblxuZnVuY3Rpb24gbG9nQ2FsbChtc2csIGRhdGEpIHtcbiAgY29uc29sZS5pbmZvKG1zZywgZGF0YSlcblxuICBpZiAoIXByb2Nlc3MuZW52LlBST0QpIHtcbiAgICBsb2cucHVzaCh7bXNnLCAuLi5kYXRhfSlcbiAgfVxufVxuXG5mdW5jdGlvbiBleHRlbmRGZWxvZ0RhdGEocGFyYW1zID0gW10pIHtcbiAgY29uc3QgcmVxdWVzdCA9IHtcbiAgICB1cmw6IGdldERvbWFpbigpLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdVc2VyLUFnZW50JzogbmF2aWdhdG9yLnVzZXJBZ2VudFxuICAgIH1cbiAgfVxuXG4gIGlmIChwYXJhbXMubGVuZ3RoIDwgMikgcmV0dXJuIFtwYXJhbXNbMF0sIHtyZXF1ZXN0fV1cblxuICBjb25zdCBkYXRhID0gcGFyYW1zWzFdXG4gIGNvbnN0IGV4dHJhID0gKHR5cGVvZiBkYXRhID09ICdzdHJpbmcnKSA/IHttZXNzYWdlOiBkYXRhfSA6IGRhdGFcblxuICByZXR1cm4gW3BhcmFtc1swXSwgey4uLmV4dHJhLCByZXF1ZXN0fSwgLi4ucGFyYW1zLnNsaWNlKDIpXVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TG9nKCkge1xuICBjb25zdCByZXN1bHQgPSBsb2cuc2xpY2UoMClcbiAgbG9nLmxlbmd0aCA9IDBcbiAgcmV0dXJuIHJlc3VsdFxufVxuIiwiaW1wb3J0IHtVUkxTLCBGRUxPRywgZ2V0VmVyc2lvbn0gZnJvbSAnLi4vY29uZmlnJ1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAobWVzc2FnZSwgZXh0cmEpIHtcbiAgbGV0IHNlbmQgPSB7fVxuXG4gIHRyeSB7XG4gICAgSlNPTi5zdHJpbmdpZnkoZXh0cmEpXG4gICAgc2VuZCA9IGV4dHJhXG4gIH1cbiAgY2F0Y2goZSkge1xuICAgIGNvbnNvbGUuZXJyb3IoZSlcbiAgfVxuXG4gIGxldCBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKSxcbiAgICBkYXRhID0ge1xuICAgICAgbG9nZ2VyOiAnamF2YXNjcmlwdCcsXG4gICAgICBwbGF0Zm9ybTogJ2phdmFzY3JpcHQnLFxuICAgICAgdGFnczoge1xuICAgICAgICBhcHBsaWNhdGlvbjogJ2Jyb3dzZXJwbHVnaW4nLFxuICAgICAgICBmcm9tUGl4ZWw6IHRydWUsXG4gICAgICAgIGNvbW1pdDogZ2V0VmVyc2lvbigpLFxuICAgICAgICB2ZXJzaW9uOiBnZXRWZXJzaW9uKClcbiAgICAgIH0sXG4gICAgICBtZXNzYWdlLFxuICAgICAgZXh0cmE6IHNlbmRcbiAgICB9LFxuICAgIHNyYyA9IGBodHRwczovLyR7VVJMUy5yYXZlbn0vYXBpLyR7RkVMT0cucHJvamVjdH0vc3RvcmUvXG4/c2VudHJ5X3ZlcnNpb249NFxuJnNlbnRyeV9jbGllbnQ9cmF2ZW4tanMvMS4xLjE2XG4mc2VudHJ5X2tleT0ke0ZFTE9HLmtleX1cbiZzZW50cnlfZGF0YT0ke2VuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShkYXRhKSl9YFxuXG4gIGltZy5zcmMgPSBzcmNcblxuICByZXR1cm4gaW1nXG59XG4iLCJpbXBvcnQgcGFnZUNvb2tpZSBmcm9tICdjb29raWUnXG5pbXBvcnQgcHJlTWl4cGFuZWwgZnJvbSAndmVuZG9yL21peHBhbmVsJ1xuaW1wb3J0IGxvYWRNaXhwYW5lbCBmcm9tICd2ZW5kb3IvbWl4cGFuZWwtMi4yJ1xuaW1wb3J0IHByZWZzIGZyb20gJy4uL3ByZWZzJ1xuaW1wb3J0IG1lc3NhZ2UgZnJvbSAnLi4vbWVzc2FnZSdcbmltcG9ydCBmb3JnZUNvb2tpZSBmcm9tICcuLi9iZy9jb29raWUnXG5pbXBvcnQge2dldERvbWFpbn0gZnJvbSAnLi4vbG9jYXRpb24nXG5pbXBvcnQge2lzQmcsIGlzRkYsIGdldEJyb3dzZXJ9IGZyb20gJy4uL3V0aWwnXG5pbXBvcnQge1VSTFMsIEZFTE9HLCBTVEFUU0MsIERBUEksIEdOQVIsIE1JWFBBTkVMLCBnZXRWZXJzaW9ufSBmcm9tICcuLi9jb25maWcnXG5pbXBvcnQgb24gZnJvbSAnLi9vbidcbmltcG9ydCB7Y2FsbCwgZ2V0TG9nfSBmcm9tICcuL2NhbGwnXG5pbXBvcnQgZm9yZ2UgZnJvbSAnLi4vZm9yZ2UnXG5pbXBvcnQgdHJhY2tlciBmcm9tICcuL3RyYWNrZXInXG5cbmxldCBlbWl0ID0gbWVzc2FnZS5lbWl0QmFja2dyb3VuZFxuXG5cbmZ1bmN0aW9uIGluaXRCZ09yUG9wdXAoKSB7XG4gIGNvbnN0IGN1c3RvbUFqYXggPSAoKCkgPT4gaXNGRigpICYmIGZvcmdlLnJlcXVlc3QuYWpheCkoKVxuICBwcmVNaXhwYW5lbCgpXG4gIGxvYWRNaXhwYW5lbCgpXG4gIHJlcXVpcmUoJ3RyYWNrZXInKVxuXG4gIHRyYWNrZXIoKS5pbml0KHtcbiAgICBtaXhwYW5lbDoge1xuICAgICAga2V5OiBNSVhQQU5FTC5rZXksXG4gICAgICBxYUtleTogTUlYUEFORUwucWFLZXksXG4gICAgICBkYXBpOiBEQVBJLFxuICAgICAgYWpheDogY3VzdG9tQWpheFxuICAgIH0sXG4gICAgZ25hcjoge1xuICAgICAgdXJsOiBHTkFSLnVybCxcbiAgICAgIHFhVXJsOiBHTkFSLnFhVXJsLFxuICAgICAgYXBwOiBgJHtnZXRCcm93c2VyKCl9RXh0YCxcbiAgICAgIGFwcFZlcnNpb246IGdldFZlcnNpb24oKSxcbiAgICAgIGFqYXg6IGN1c3RvbUFqYXhcbiAgICB9LFxuICAgIGZlbG9nOiB7XG4gICAgICBhcHBsaWNhdGlvbjogJ2Jyb3dzZXJwbHVnaW4nLFxuICAgICAga2V5OiBGRUxPRy5rZXksXG4gICAgICB1cmw6IFVSTFMucmF2ZW4sXG4gICAgICBwcm9qZWN0OiBGRUxPRy5wcm9qZWN0LFxuICAgICAgY29tbWl0OiBnZXRWZXJzaW9uKCksXG4gICAgICB2ZXJzaW9uOiBnZXRWZXJzaW9uKCksXG4gICAgICByZWFkeU9uU2V0VXNlcjogdHJ1ZVxuICAgIH0sXG4gICAgc3RhdHNjOiB7XG4gICAgICB1cmw6IFNUQVRTQy5VUkxcbiAgICB9XG4gIH0pXG5cbiAgdHJhY2tlcigpLnN0YXRzYy5jcmVhdGVSb290KHtcbiAgICBwcmVmaXg6IFNUQVRTQy5QUkVGSVgsXG4gICAgcG9zdGZpeDogYCR7Z2V0QnJvd3NlcigpfS5leHRlbnNpb24ud29ybGRgLFxuICAgIGlkOiAndWknXG4gIH0pXG5cbiAgbWVzc2FnZS5vbigndHJhY2tpbmctZmlyZScsICh7bXNnLCBkYXRhfSkgPT4gZmlyZShtc2csIC4uLmRhdGEpKVxuXG5cbiAgLy9pbml0IE1QIGZvciB1c2Vycywgd2hpY2ggaGF2ZSBNUCBjb29raWUgYWxyZWFkeVxuICBmb3JnZUNvb2tpZS5nZXQoJy5ncmFtbWFybHkuY29tJywgTUlYUEFORUwuY29va2llLCBjb29raWVNUCA9PiB7XG4gICAgaWYgKGNvb2tpZU1QKSB7XG4gICAgICBpbml0TVAoY29va2llTVApXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcHJlZnMuZ2V0KCdtcENvb2tpZScsIGluaXRNUClcbiAgICB9XG4gIH0pXG5cbiAgZnVuY3Rpb24gaW5pdE1QIChtcENvb2tpZSkge1xuICAgIGlmICghbXBDb29raWUpIHJldHVyblxuXG4gICAgd2luZG93Lm1peHBhbmVsLnBlcnNpc3RlbmNlLmxvYWQoKVxuICAgIGNhbGwoJ21peHBhbmVsLnNldFByb3BzJywge1xuICAgICAgZ1Byb2R1Y3Q6IGBFeHRlbnNpb24tJHtnZXRCcm93c2VyKCl9YCxcbiAgICAgIGZ1bGxQcm9kdWN0VmVyc2lvbjogZ2V0VmVyc2lvbigpXG4gICAgfSwgJ0V4dCcpXG4gIH1cblxuICBtZXNzYWdlLm9uKCd0cmFja2VyLWluaXQnLCAoe21wQ29va2llLCBnbmFyLCBkYXBpfSkgPT4ge1xuICAgIHByZWZzLnNldCgnbXBDb29raWUnLCBtcENvb2tpZSlcblxuICAgIGxldCBkb21haW4gPSBnZXREb21haW4oKSxcbiAgICAgIGNvb2tpZU9wdGlvbnMgPSB7XG4gICAgICAgIHBhdGg6ICcvJyxcbiAgICAgICAgZG9tYWluOiBkb21haW4uaW5jbHVkZXMoJy5ncmFtbWFybHkuY29tJykgPyAnLmdyYW1tYXJseS5jb20nIDogZG9tYWluLFxuICAgICAgICAvLyB5ZWFyIGZyb20gbm93XG4gICAgICAgIGV4cGlyZXM6IG5ldyBEYXRlKG5ldyBEYXRlKCkuc2V0WWVhcihuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCkgKyAxKSlcbiAgICAgIH1cblxuICAgIHBhZ2VDb29raWUoTUlYUEFORUwuY29va2llLCBudWxsKVxuICAgIHBhZ2VDb29raWUoTUlYUEFORUwuY29va2llLCBtcENvb2tpZSwgY29va2llT3B0aW9ucylcblxuICAgIHVwZGF0ZUlkKCdnbmFyX2NvbnRhaW5lcklkJywgZ25hcilcbiAgICB1cGRhdGVJZCgnX19mbmdycHJudF9fJywgZGFwaSlcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZUlkKGlkLCB2YWx1ZSkge1xuICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuXG5cbiAgICAgIHByZWZzLnNldChpZCwgdmFsdWUpXG4gICAgICBwYWdlQ29va2llKGlkLCBudWxsKVxuICAgICAgcGFnZUNvb2tpZShpZCwgdmFsdWUsIGNvb2tpZU9wdGlvbnMpXG4gICAgfVxuICB9KVxuXG4gIGZpcmUoJ2FjdGl2aXR5LXBpbmcnKVxufVxuXG5mdW5jdGlvbiBmaXJlIChtc2csIC4uLmRhdGEpIHtcbiAgaWYgKGlzQmcoKSkge1xuICAgIGlmICghb25bbXNnXSkgcmV0dXJuIGNvbnNvbGUuZXJyb3IoYE5vIGhhbmRsZXIgc3BlY2lmaWVkIGZvciBtZXNzYWdlOiAke21zZ31gKVxuICAgIHNldFRpbWVvdXQoKCkgPT4gb25bbXNnXSguLi5kYXRhKSwgMjApXG4gIH1cbiAgZWxzZSB7XG4gICAgZW1pdCgndHJhY2tpbmctZmlyZScsIHttc2csIGRhdGF9KVxuICB9XG59XG5cbmZ1bmN0aW9uIGluaXRDb250ZW50U2NyaXB0KCkge1xuICBsZXQgdGltZXMgPSAwLFxuICAgIG1heCA9IDEwLFxuICAgIGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdGltZXMrK1xuICAgICAgaWYgKHRpbWVzID4gbWF4KSBjbGVhckludGVydmFsKGludGVydmFsKVxuXG4gICAgICBsZXQgZGF0YSA9IHtcbiAgICAgICAgJ21wQ29va2llJzogcGFnZUNvb2tpZShNSVhQQU5FTC5jb29raWUpLFxuICAgICAgICAnZ25hcic6IHBhZ2VDb29raWUoJ2duYXJfY29udGFpbmVySWQnKSxcbiAgICAgICAgJ2RhcGknOiBwYWdlQ29va2llKCdfX2ZuZ3Jwcm50X18nKVxuICAgICAgfVxuICAgICAgaWYgKCFkYXRhLm1wQ29va2llKSByZXR1cm5cblxuICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbClcbiAgICAgIGVtaXQoJ3RyYWNrZXItaW5pdCcsIGRhdGEpXG4gICAgfSwgNTAwKVxufVxuXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgaW5pdEJnT3JQb3B1cCxcbiAgaW5pdENvbnRlbnRTY3JpcHQsXG4gIGdldExvZyxcbiAgZmlyZSxcbiAgY2FsbFxufVxuIiwiaW1wb3J0IHByZWZzIGZyb20gJy4uL3ByZWZzJ1xuaW1wb3J0IHtwcm9taXNlR2V0RG9tYWlufSBmcm9tICcuLi9sb2NhdGlvbidcbmltcG9ydCB7Z2V0QnJvd3NlciwgaXNDaHJvbWV9IGZyb20gJy4uL3V0aWwnXG5pbXBvcnQge0ZFTE9HLCBkZWJ1Z30gZnJvbSAnLi4vY29uZmlnJ1xuaW1wb3J0IHtjYWxsfSBmcm9tICcuL2NhbGwnXG5cblxuZXhwb3J0IGRlZmF1bHQge1xuICBbJ2JnLXBhZ2UtbG9hZCddKCkge1xuICB9LFxuICBbJ2FjdGl2aXR5LXBpbmcnXSgpIHtcbiAgICBsZXQgdG9QZXJjZW50ID0gdmFsID0+IHBhcnNlRmxvYXQoTWF0aC5yb3VuZCh2YWwgKiAxMDAgKiAxMDApIC8gMTAwKS50b0ZpeGVkKDIpXG4gICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKCFpc0Nocm9tZSgpKSB7XG4gICAgICAgIHJldHVybiBjYWxsKCdzdGF0c2MudWkuaW5jcmVtZW50JywgJ2FjdGl2aXR5OmFjdGl2aXR5X3BpbmcnKVxuICAgICAgfVxuXG4gICAgICB3aW5kb3cuY2hyb21lLnN5c3RlbSAmJiB3aW5kb3cuY2hyb21lLnN5c3RlbS5jcHUgJiYgd2luZG93LmNocm9tZS5zeXN0ZW0uY3B1LmdldEluZm8oaW5mbyA9PiB7XG4gICAgICAgIGxldCBsb2FkID0gaW5mby5wcm9jZXNzb3JzXG4gICAgICAgICAgICAubWFwKHByb2Nlc3NvciA9PiAocHJvY2Vzc29yLnVzYWdlLnRvdGFsIC0gcHJvY2Vzc29yLnVzYWdlLmlkbGUpIC8gcHJvY2Vzc29yLnVzYWdlLnRvdGFsKVxuICAgICAgICAgICAgLnJlZHVjZSgoYXZnLCBjcHUsIGksIHRvdGFsKSA9PiBhdmcgKyBjcHUgLyB0b3RhbC5sZW5ndGgsIDApLFxuICAgICAgICAgIHt1c2VkSlNIZWFwU2l6ZSwgdG90YWxKU0hlYXBTaXplfSA9IHdpbmRvdy5wZXJmb3JtYW5jZS5tZW1vcnlcblxuICAgICAgICBsb2FkID0gdG9QZXJjZW50KGxvYWQpXG5cbiAgICAgICAgY2FsbCgnc3RhdHNjLnVpLmluY3JlbWVudCcsICdhY3Rpdml0eTphY3Rpdml0eV9waW5nJylcbiAgICAgICAgY2FsbCgnc3RhdHNjLnVpLmdhdWdlJywge1xuICAgICAgICAgICdwZXJmb3JtYW5jZTptZW1vcnlfdXNlZCc6IHVzZWRKU0hlYXBTaXplLFxuICAgICAgICAgICdwZXJmb3JtYW5jZTptZW1vcnlfdXNlZF9vZl90b3RhbCc6IHRvUGVyY2VudCgodG90YWxKU0hlYXBTaXplIC0gdXNlZEpTSGVhcFNpemUpIC8gdG90YWxKU0hlYXBTaXplKSxcbiAgICAgICAgICAncGVyZm9ybWFuY2U6Y3B1X2xvYWQnOiBsb2FkXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0sXG4gICAgRkVMT0cucGluZ1RpbWVvdXQpXG4gIH0sXG4gIFsnZGFpbHktcGluZyddKCkge1xuICAgIGlmIChkZWJ1ZykgcmV0dXJuXG5cbiAgICBwcmVmcy5nZXQoWydpZCcsICdwaW5nRGF0ZSddLCBvbmxvYWQpXG5cbiAgICBmdW5jdGlvbiBvbmxvYWQoe2lkLCBwaW5nRGF0ZX0pIHtcbiAgICAgIHBpbmdEYXRlID0gcGluZ0RhdGUgfHwgJycgLy9mb3IgbnVsbCBjYXNlXG4gICAgICBsZXQgW3N0b3JhZ2VOZXh0RGF0ZSwgb2xkSWRdID0gcGluZ0RhdGUuc3BsaXQoJ3wnKVxuXG4gICAgICBpZiAoc3RvcmFnZU5leHREYXRlICYmIHN0b3JhZ2VOZXh0RGF0ZSA+IERhdGUubm93KCkgJiYgb2xkSWQgPT0gaWQpIHJldHVyblxuICAgICAgaWYgKCFpZCkgcmV0dXJuXG5cbiAgICAgIGNhbGwoJ21peHBhbmVsLmRhcGlFdmVudCcsICdEYWlseV9QaW5nJywge1xuICAgICAgICBnUHJvZHVjdDogYEV4dGVuc2lvbi0ke2dldEJyb3dzZXIoKX1gXG4gICAgICB9KVxuICAgICAgY2FsbCgnZ25hci50cmFja1RyYWNrVHJhY2snKVxuICAgICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OkRhaWx5X1BpbmcnKVxuICAgICAgY2FsbCgnZmVsb2cuZXZlbnQnLCAnZGFpbHlfcGluZycpXG5cbiAgICAgIHByZWZzLnNldCgncGluZ0RhdGUnLCBbZ2V0TmV4dFBpbmdEYXRlKCksIGlkXS5qb2luKCd8JykpXG4gICAgfVxuXG4gICAgLy9nZXQgcmFuZG9tIGxvY2FsIHRpbWUgYmV0d2VlbiAzLTQgQU1cbiAgICBmdW5jdGlvbiBnZXROZXh0UGluZ0RhdGUoKSB7XG4gICAgICBsZXQgbm93ID0gbmV3IERhdGUoKVxuICAgICAgaWYgKG5vdy5nZXRIb3VycygpID4gMikge1xuICAgICAgICBub3cuc2V0RGF0ZShub3cuZ2V0RGF0ZSgpICsgMSlcbiAgICAgIH1cbiAgICAgIG5vdy5zZXRIb3VycygzKVxuICAgICAgbm93LnNldE1pbnV0ZXMoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNjApKVxuXG4gICAgICByZXR1cm4gbm93LmdldFRpbWUoKVxuICAgIH1cbiAgfSxcbiAgWydhcHBfc2lnbmluX3N1Y2Nlc3MnXTogYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgcGFnZURvbWFpbiA9IGF3YWl0IHByb21pc2VHZXREb21haW4oKVxuICAgIGNhbGwoJ21peHBhbmVsLnRyYWNrJywgJ0c6VXNlcl9Mb2dpbl9TdWNjZWVkZWQnLCB7cGFnZURvbWFpbn0pXG4gICAgY2FsbCgnZ25hci5zZW5kJywgYCR7Z2V0QnJvd3NlcigpfUV4dC91c2VyTG9naW5Gb3JtL2FjY2VwdGVkYCwge3BhZ2VEb21haW59KVxuICAgIGNhbGwoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCAnc3RhYmlsaXR5OmFwcF9zaWduaW5fc3VjY2VzcycpXG4gIH0sXG4gIFsnYXBwX3NpZ251cF9zdWNjZXNzJ106IGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHBhZ2VEb21haW4gPSBhd2FpdCBwcm9taXNlR2V0RG9tYWluKClcbiAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdHOlVzZXJfQWNjb3VudF9DcmVhdGVkJywge3BhZ2VEb21haW59KVxuICAgIGNhbGwoJ2duYXIuc2VuZCcsIGAke2dldEJyb3dzZXIoKX1FeHQvdXNlckFjY291bnRTaWdudXBGb3JtL2FjY2VwdGVkYCwge3BhZ2VEb21haW59KVxuICAgIGNhbGwoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCAnc3RhYmlsaXR5OmFwcF9zaWdudXBfc3VjY2VzcycpXG4gIH0sXG4gIFsnc2lnbmluLWVycm9yJ106IGFzeW5jIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgY29uc3QgcGFnZURvbWFpbiA9IGF3YWl0IHByb21pc2VHZXREb21haW4oKVxuICAgIGVycm9yLmVycm9yVHlwZSA9ICdTZXJ2ZXItU2lkZSdcbiAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdHOlVzZXJfTG9naW5fUmVqZWN0ZWQnLCB7cGFnZURvbWFpbn0pXG4gICAgY2FsbCgnZ25hci5zZW5kJywgYCR7Z2V0QnJvd3NlcigpfUV4dC91c2VyTG9naW5Gb3JtL3JlamVjdGVkYCwge3BhZ2VEb21haW59KVxuICB9LFxuICBbJ3NpZ251cC1lcnJvciddOiBhc3luYyBmdW5jdGlvbihlcnJvcikge1xuICAgIGNvbnN0IHBhZ2VEb21haW4gPSBhd2FpdCBwcm9taXNlR2V0RG9tYWluKClcbiAgICBlcnJvci5lcnJvclR5cGUgPSAnU2VydmVyLVNpZGUnXG4gICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRzpVc2VyX1NpZ251cF9SZWplY3RlZCcsIHtwYWdlRG9tYWlufSlcbiAgICBjYWxsKCdnbmFyLnNlbmQnLCBgJHtnZXRCcm93c2VyKCl9RXh0L3VzZXJBY2NvdW50U2lnbnVwRm9ybS9yZWplY3RlZGAsIHtwYWdlRG9tYWlufSlcbiAgfSxcbiAgWyd1cGdyYWRlLWFmdGVyLXJlZ2lzdGVyJ106IGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IHBhZ2VEb21haW4gPSBhd2FpdCBwcm9taXNlR2V0RG9tYWluKClcbiAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdORTpBY2NvdW50X1R5cGVfU2VsZWN0ZWQnLCB7XG4gICAgICBhY2NvdW50VHlwZVNlbGVjdGVkOiAncHJlbWl1bScsXG4gICAgICBwYWdlRG9tYWluXG4gICAgfSlcbiAgICBjYWxsKCdnbmFyLnNlbmQnLCBgJHtnZXRCcm93c2VyKCl9RXh0L0FjY291bnRfVHlwZV9TZWxlY3RlZGAsIHtwYWdlRG9tYWlufSlcbiAgfSxcbiAgWyd1cGdyYWRlJ106IGFzeW5jIGZ1bmN0aW9uKHBsYWNlbWVudCwgcGFnZURvbWFpbikgey8vdGVzdGVkXG4gICAgbGV0IGV4dDIgPSBhd2FpdCBwcmVmcy5nZXQoJ2V4dDInKSxcbiAgICAgIGRhdGEgPSB7cGFnZURvbWFpbiwgcGxhY2VtZW50LCBleHQyfVxuXG4gICAgY2FsbCgnZ25hci5zZW5kJywgYCR7Z2V0QnJvd3NlcigpfUV4dC91cGdyYWRlQnV0dG9uQ2xpY2tlZGAsIGRhdGEpXG4gICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OlVwZ3JhZGVfVG9fUGx1c19DbGlja2VkJywgZGF0YSlcbiAgICBjYWxsKCdmZWxvZy5pbmZvJywgJ3VwZ3JhZGVfY2xpY2snLCBkYXRhKVxuICB9LFxuICBbJ2J1dHRvbi1ob3ZlciddOiBhc3luYyBmdW5jdGlvbihidXR0b25UeXBlKSB7Ly90ZXN0ZWRcbiAgICBjb25zdCBwYWdlRG9tYWluID0gYXdhaXQgcHJvbWlzZUdldERvbWFpbigpXG4gICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OkFjdGlvbl9CdXR0b25fSG92ZXJlZCcsIHtwYWdlRG9tYWluLCBidXR0b25UeXBlfSlcbiAgICBjYWxsKCdnbmFyLnNlbmQnLCBgJHtnZXRCcm93c2VyKCl9RXh0L2FjdGlvbkJ1dHRvbkhvdmVyZWRgLCB7cGFnZURvbWFpbiwgYnV0dG9uVHlwZX0pXG4gICAgY2FsbCgnc3RhdHNjLnVpLmluY3JlbWVudCcsICdzdGFiaWxpdHk6Z2J1dHRvbl9hY3Rpb25zX2hvdmVyJylcbiAgfSxcbiAgWydjb3JyZWN0LWJ0bi1jbGlja2VkJ106IGFzeW5jIGZ1bmN0aW9uKCkgey8vdGVzdGVkXG4gICAgY29uc3QgcGFnZURvbWFpbiA9IGF3YWl0IHByb21pc2VHZXREb21haW4oKVxuICAgIGNhbGwoJ21peHBhbmVsLnRyYWNrJywgJ0V4dDpDb3JyZWN0X0J1dHRvbl9DbGlja2VkJywge3BhZ2VEb21haW59KVxuICAgIGNhbGwoJ2duYXIuc2VuZCcsIGAke2dldEJyb3dzZXIoKX1FeHQvY29ycmVjdEJ1dHRvbkNsaWNrZWRgKVxuICAgIGNhbGwoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCAnc3RhYmlsaXR5OmVkaXRvci5jb3JyZWN0X2J1dHRvbl9jbGlja2VkJylcbiAgICBjYWxsKCdmZWxvZy5ldmVudCcsICdnX2J1dHRvbl9jb3JyZWN0X2J1dHRvbl9jbGlja2VkJylcbiAgfSxcbiAgWydidG4tZGlzYWJsZS1pbi1maWVsZCddOiBhc3luYyBmdW5jdGlvbihlbmFibGVkKSB7Ly90ZXN0ZWRcbiAgICBjb25zdCBwYWdlRG9tYWluID0gYXdhaXQgcHJvbWlzZUdldERvbWFpbigpXG4gICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OkNoZWNraW5nX2luX2ZpZWxkX3RvZ2dsZWQnLCB7cGFnZURvbWFpbiwgZW5hYmxlZH0pXG4gICAgY2FsbCgnZ25hci5zZW5kJywgYCR7Z2V0QnJvd3NlcigpfUV4dC9jaGVja2luZ0luRmllbGRUb2dnbGVkYCwge3BhZ2VEb21haW4sIGVuYWJsZWR9KVxuICAgIGNhbGwoJ3N0YXRzYy51aS5pbmNyZW1lbnQnLCAnc3RhYmlsaXR5OmRpc2FibGVfaW5fZmllbGQnKVxuICAgIGNhbGwoJ2ZlbG9nLmluZm8nLCAnZ19idXR0b25fZGlzYWJsZV9pbl9maWVsZF9jbGljaycpXG4gIH0sXG4gIFsnYnV0dG9uLWNoYW5nZS1zdGF0ZSddOiBhc3luYyBmdW5jdGlvbihlbmFibGVkKSB7Ly90ZXN0ZWRcbiAgICBjb25zdCBwYWdlRG9tYWluID0gYXdhaXQgcHJvbWlzZUdldERvbWFpbigpXG4gICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OkdCdXR0b25fTWluaW1pemVfVG9nZ2xlZCcsIHtwYWdlRG9tYWluLCBlbmFibGVkfSlcbiAgICBjYWxsKCdnbmFyLnNlbmQnLCBgJHtnZXRCcm93c2VyKCl9RXh0L21pbmltaXplVG9nZ2xlZGAsIHtwYWdlRG9tYWluLCBlbmFibGVkfSlcbiAgICBjYWxsKCdzdGF0c2MudWkuaW5jcmVtZW50JywgJ3N0YWJpbGl0eTpnX2J1dHRvbl9taW5pbWl6ZV90b2dnbGVkJylcbiAgICBjYWxsKCdmZWxvZy5pbmZvJywgJ2dfYnV0dG9uX21pbmltaXplX3RvZ2dsZWQnLCB7ZW5hYmxlZH0pXG4gIH0sXG4gIFsnc2Vzc2lvbi1lbmQnXTogYXN5bmMgZnVuY3Rpb24oYWR2YW5jZWRDb3VudCkge1xuICAgIGNvbnN0IHBhZ2VEb21haW4gPSBhd2FpdCBwcm9taXNlR2V0RG9tYWluKClcbiAgICBjYWxsKCdtaXhwYW5lbC50cmFjaycsICdFeHQ6T25seV9BZHZhbmNlZF9NaXN0YWtlcycsIHtwYWdlRG9tYWluLCBhZHZhbmNlZENvdW50fSlcbiAgICBjYWxsKCdnbmFyLnNlbmQnLCBgJHtnZXRCcm93c2VyKCl9RXh0L29ubHlBZHZhbmNlZE1pc3Rha2VzYCwge3BhZ2VEb21haW4sIGFkdmFuY2VkQ291bnR9KVxuICAgIGNhbGwoJ2ZlbG9nLmluZm8nLCAnb25seV9hZHZhbmNlZF9taXN0YWtlcycsIHthZHZhbmNlZENvdW50fSlcbiAgfSxcbiAgWydsb2dpbi1hdHRlbXB0J106IGFzeW5jIGZ1bmN0aW9uKGNhbGxlcikge1xuICAgIGxldCBpc0V4dDIgPSBhd2FpdCBwcmVmcy5pc0V4dDIoKVxuICAgIGlmIChpc0V4dDIpIHtcbiAgICAgIGNhbGwoJ2duYXIuc2VuZCcsICdFeHQvc2lnbkluQ2xpY2tlZCcsIHsgcGxhY2VtZW50OiBjYWxsZXIgfSlcbiAgICAgIGNhbGwoJ21peHBhbmVsLnRyYWNrJywgJ0V4dDpTaWduX0luX0NsaWNrZWQnLCB7IHBsYWNlbWVudDogY2FsbGVyIH0pXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY2FsbCgnZ25hci5zZW5kJywgJ0V4dC9zaWduSW5DbGlja2VkXzEwJywgeyBwbGFjZW1lbnQ6IGNhbGxlciB9KVxuICAgICAgY2FsbCgnbWl4cGFuZWwudHJhY2snLCAnRXh0OlNpZ25fSW5fQ2xpY2tlZF8xMCcsIHsgcGxhY2VtZW50OiBjYWxsZXIgfSlcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7Z2V0QnJvd3Nlcn0gZnJvbSAnLi4vdXRpbCdcbmltcG9ydCB7U1RBVFNDfSBmcm9tICcuLi9jb25maWcnXG5cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gKG1ldGhvZCwgb3B0cykge1xuICBsZXQgbmFtZXMgPSBvcHRzICYmIG9wdHMuc3BsaXQoJzonKVxuXG4gIGlmICghbmFtZXNbMF0gfHwgIW5hbWVzWzFdKSByZXR1cm5cblxuICBsZXQgZXZlbnQgPSBgZ3JhbW1hcmx5LnVpLiR7bmFtZXNbMF19LiR7Z2V0QnJvd3NlcigpfS5leHRlbnNpb24ud29ybGQuJHtuYW1lc1sxXX1gLFxuICAgIGRhdGEgPSB7Yzoge319XG5cbiAgZGF0YS5jW2V2ZW50XSA9IFsnMSddXG5cbiAgbGV0IGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpXG4gIGltZy5zcmMgPSBgJHtTVEFUU0MuVVJMfT9qc29uPSR7SlNPTi5zdHJpbmdpZnkoZGF0YSl9YFxuXG4gIHJldHVybiBpbWdcbn1cbiIsImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkgeyByZXR1cm4gd2luZG93LnRyYWNrZXIgfVxuIiwiaW1wb3J0IF8gZnJvbSAnbG9kYXNoJ1xuXG5cbmZ1bmN0aW9uIGlzRkYoKSB7XG4gIHJldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdGaXJlZm94JykgIT0gLTFcbn1cblxuZnVuY3Rpb24gaXNDaHJvbWUoKSB7XG4gIHJldHVybiAhIXdpbmRvdy5jaHJvbWVcbn1cblxuZnVuY3Rpb24gaXNTYWZhcmkoKSB7XG4gIHJldHVybiAhIXdpbmRvdy5zYWZhcmlcbn1cblxuZnVuY3Rpb24gaXNTYWZhcmk4KCkge1xuICByZXR1cm4gL14oKD8hY2hyb21lKS4pKnNhZmFyaS9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdWZXJzaW9uLzguMCcpICE9IC0xXG59XG5cbmZ1bmN0aW9uIGlzV2luZG93cygpIHtcbiAgcmV0dXJuIG5hdmlnYXRvci5hcHBWZXJzaW9uLmluZGV4T2YoJ1dpbicpICE9IC0xXG59XG5cbmZ1bmN0aW9uIGlzQmcoKSB7XG4gIHJldHVybiB3aW5kb3cuSVNfQkdcbn1cblxuXG5mdW5jdGlvbiBpc1BvcHVwKCkge1xuICByZXR1cm4gd2luZG93LklTX1BPUFVQXG59XG5cbmZ1bmN0aW9uIGlzQmdPclBvcHVwKCkge1xuICByZXR1cm4gaXNCZygpIHx8IGlzUG9wdXAoKVxufVxuXG5mdW5jdGlvbiBnZXRCcm93c2VyKCkge1xuICBpZiAoaXNDaHJvbWUoKSkge1xuICAgIHJldHVybiAnY2hyb21lJ1xuICB9XG4gIGVsc2UgaWYgKGlzRkYoKSkge1xuICAgIHJldHVybiAnZmlyZWZveCdcbiAgfVxuICBlbHNlIGlmIChpc1NhZmFyaSgpKSB7XG4gICAgcmV0dXJuICdzYWZhcmknXG4gIH1cbiAgZWxzZSB7XG4gICAgcmV0dXJuICdvdGhlcidcbiAgfVxufVxuXG5mdW5jdGlvbiBjaHJvbWVCZ0Vycm9yKCkge1xuICByZXR1cm4gd2luZG93LmNocm9tZSAmJiB3aW5kb3cuY2hyb21lLnJ1bnRpbWUgJiYgd2luZG93LmNocm9tZS5ydW50aW1lLmxhc3RFcnJvclxufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKG9iaikge1xuICByZXR1cm4gISEob2JqICYmIG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY2FsbCAmJiBvYmouYXBwbHkpXG59XG5cbmZ1bmN0aW9uIGludGVydmFsKGNiLCB0aW1lKSB7XG4gIGxldCBpdGVtcyA9IGludGVydmFsLml0ZW1zID0gaW50ZXJ2YWwuaXRlbXMgfHwge30sXG4gICAgaXRlbSA9IGl0ZW1zW2NiXVxuXG4gIGlmICghaXRlbSAmJiAhdGltZSkgcmV0dXJuXG5cbiAgaWYgKGl0ZW0gJiYgIXRpbWUpIHtcbiAgICBjbGVhclRpbWVvdXQoaXRlbSlcbiAgICBkZWxldGUgaXRlbXNbY2JdXG4gICAgcmV0dXJuXG4gIH0gZWxzZSBydW4oKVxuXG4gIGZ1bmN0aW9uIHJ1bigpIHtcbiAgICBmdW5jdGlvbiBfY2IoKSB7XG4gICAgICB0aW1lb3V0KClcbiAgICAgIGNiKClcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0aW1lb3V0KCkge1xuICAgICAgbGV0IHRpZCA9IHNldFRpbWVvdXQoX2NiLCB0aW1lKVxuICAgICAgaXRlbXNbY2JdID0gdGlkXG4gICAgfVxuICAgIHRpbWVvdXQoKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNhbmNlbEludGVydmFsKGNiKSB7XG4gIGludGVydmFsKGNiKVxufVxuXG5mdW5jdGlvbiBTNCgpIHtyZXR1cm4gKCgoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMCkgfCAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpfVxuZnVuY3Rpb24gZ3VpZCAoKSB7XG4gIHJldHVybiAoUzQoKSArIFM0KCkgKyAnLScgKyBTNCgpICsgJy0nICsgUzQoKSArICctJyArIFM0KCkgKyAnLScgKyBTNCgpICsgUzQoKSArIFM0KCkpXG59XG5cbmZ1bmN0aW9uIF9mKCkge31cbmZ1bmN0aW9uIF9GKCkge3JldHVybiB0cnVlfVxuXG5cbmZ1bmN0aW9uIGJnUGFnZVJlbG9hZCgpIHtcbiAgaXNDaHJvbWUoKSAmJiB3aW5kb3cuY2hyb21lLnJ1bnRpbWUucmVsb2FkKClcbn1cblxuZnVuY3Rpb24gaXNHbWFpbChkb2MpIHtcbiAgaWYgKCFkb2MubG9jYXRpb24pIHJldHVyblxuICBsZXQgaG9zdCA9IGRvYy5sb2NhdGlvbi5ob3N0ID09ICdtYWlsLmdvb2dsZS5jb20nLFxuICAgICAgZnJhbWVzID0gZG9jLnF1ZXJ5U2VsZWN0b3IoJ2lmcmFtZSNqc19mcmFtZScpICYmIGRvYy5xdWVyeVNlbGVjdG9yKCdpZnJhbWUjc291bmRfZnJhbWUnKVxuICByZXR1cm4gaG9zdCB8fCBmcmFtZXNcbn1cblxuZnVuY3Rpb24gaXNWYWxpZEVtYWlsKHZhbHVlKSB7XG4gIHJldHVybiAvXlstISMkJSZcXCcqK1xcXFwuLzAtOT0/QS1aXl9gYS16e3x9fl0rQFstISMkJSZcXCcqK1xcXFwvMC05PT9BLVpeX2BhLXp7fH1+XStcXC5bLSEjJCUmXFwnKitcXFxcLi8wLTk9P0EtWl5fYGEtent8fX5dKyQvLnRlc3QodmFsdWUpXG59XG5cbmZ1bmN0aW9uIGZvcm1hdE51bWJlcihpKSB7XG4gIHJldHVybiBpLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxCKD89KFxcZHszfSkrKD8hXFxkKSkvZywgJywnKVxufVxuXG5mdW5jdGlvbiBkZWNsZW5zaW9uKHZhbHVlLCBhcnIpIHtcbiAgbGV0IGluZGV4ID0gMlxuICBpZiAoKHZhbHVlICUgMTAgPT0gMSkgJiYgKHZhbHVlICUgMTAwICE9IDExKSkge1xuICAgIGluZGV4ID0gMFxuICB9XG5cbiAgaWYgKCh2YWx1ZSAlIDEwID49IDIgJiYgdmFsdWUgJSAxMCA8PSA0KSAmJiAodmFsdWUgJSAxMDAgPCAxMCB8fCB2YWx1ZSAlIDEwMCA+PSAyMCkpIHtcbiAgICBpbmRleCA9IDFcbiAgfVxuICByZXR1cm4gYXJyW2luZGV4XVxufVxuXG5mdW5jdGlvbiBzdHViKG1ldGhvZHMpIHtcbiAgcmV0dXJuIF8udHJhbnNmb3JtKG1ldGhvZHMsIChyZXN1bHQsIG0pID0+IHJlc3VsdFttXSA9IF9mKVxufVxuXG5mdW5jdGlvbiBtZW1vaXplKGZ1bmMsIHJlc29sdmVyLCB0dGwpIHtcbiAgbGV0IGNhY2hlID0ge31cbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGxldCBrZXkgPSAnX21lbW9pemVfJyArIChyZXNvbHZlciA/IHJlc29sdmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cykgOiBhcmd1bWVudHNbMF0pXG4gICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoY2FjaGUsIGtleSkpIHtcbiAgICAgIHJldHVybiBjYWNoZVtrZXldXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaWYgKHR0bCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtkZWxldGUgY2FjaGVba2V5XX0sIHR0bClcbiAgICAgIH1cbiAgICAgIHJldHVybiBjYWNoZVtrZXldID0gZnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHN5bmNXYWl0KHByb21pc2UsIG1ldGhvZHMpIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG1ldGhvZHMpLnJlZHVjZSgob2JqLCBtZXRob2QpID0+ICh7XG4gICAgLi4ub2JqLFxuICAgIFttZXRob2RdOiAoLi4uYXJncykgPT4gcHJvbWlzZS50aGVuKCgpID0+IG1ldGhvZHNbbWV0aG9kXSguLi5hcmdzKSlcbiAgfSksIHt9KVxufVxuXG5mdW5jdGlvbiBwcm9taXNpZnkobWV0aG9kKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IG1ldGhvZChyZXNvbHZlKSlcbn1cblxuZnVuY3Rpb24gZ2V0UmFuZG9tSW50SW5jbHVzaXZlKG1pbiwgbWF4KSB7XG4gIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluXG59XG5cbmZ1bmN0aW9uIGRlbGF5KG1zKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgbXMpKVxufVxuXG5cbi8vZGVjaWRlZCB0byB1c2Ugc2ltcGxlIGZ1bmN0aW9uIGluc3RlYWQgaGVhdnkgbW9tZW50LmpzXG5sZXQgbW9udGhzID0gWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLCAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ11cbmZ1bmN0aW9uIGZvcm1hdERhdGUoZGF0ZVN0cikge1xuICBpZiAoIWRhdGVTdHIpIHJldHVyblxuICBsZXQgZGF0ZSA9IG5ldyBEYXRlKGRhdGVTdHIpXG4gIGlmIChkYXRlLnRvU3RyaW5nKCkgPT0gJ0ludmFsaWQgRGF0ZScpIHJldHVyblxuICByZXR1cm4gbW9udGhzW2RhdGUuZ2V0TW9udGgoKV0gKyAnICcgKyBkYXRlLmdldERhdGUoKSArICcsICcgKyBkYXRlLmdldEZ1bGxZZWFyKClcbn1cblxuZnVuY3Rpb24gY3JlYXRlQ2xhc3MoZnVuYykge1xuICBsZXQgX2NsYXNzID0gZnVuY3Rpb24oKSB7fVxuICBfY2xhc3MucHJvdG90eXBlID0gZnVuYygpXG4gIHJldHVybiBfY2xhc3Ncbn1cblxuZnVuY3Rpb24gZW1pdERvbUV2ZW50KGtleSwgZGF0YSA9IHt9KSB7XG4gIGxldCBlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50JylcbiAgZS5pbml0Q3VzdG9tRXZlbnQoa2V5ICsgJy1ncicsIHRydWUsIHRydWUsIGRhdGEpXG4gIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQoZSlcbn1cblxuLyoqXG4gKiBDb21wYXJlIHR3byB2ZXJzaW9ucyBvZiBleHRlbnNpb24uIFZlcnNpb24gZm9ybWF0IHgueC54XG4gKiBAcGFyYW0ge3N0cmluZ30gdjEgZmlyc3QgdmVyc2lvbiB0byBjb21wYXJlXG4gKiBAcGFyYW0ge3N0cmluZ30gdjIgc2Vjb25kIHZlcnNpb24gdG8gY29tcGFyZVxuICogQGV4YW1wbGVcbiAqIC8vIHJldHVybnMgMVxuICogdmVyc2lvbkNvbXBhcmF0b3IoJzIuMC4wJywgJzAuMC45JylcbiAqIEBleGFtcGxlXG4gKiAvLyByZXR1cm5zIDBcbiAqIHZlcnNpb25Db21wYXJhdG9yKCcyLjAuMCcsICcyLjAuMCcpXG4gKiBAZXhhbXBsZVxuICogLy8gcmV0dXJucyAtMVxuICogdmVyc2lvbkNvbXBhcmF0b3IoJzEuMC4wJywgJzIuMC4wJylcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IFJldHVybnMgMSwgMCBvciAtMVxuICovXG5mdW5jdGlvbiB2ZXJzaW9uQ29tcGFyYXRvcih2MSA9ICcnLCB2MiA9ICcnKSB7XG4gIGZ1bmN0aW9uIHNwbGl0VG9BcnJheShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnNwbGl0KCcuJykubWFwKChlbCkgPT4gTnVtYmVyKGVsKSB8fCAwKVxuICB9XG5cbiAgbGV0IHYxYXJyID0gc3BsaXRUb0FycmF5KHYxKSxcbiAgICB2MmFyciA9IHNwbGl0VG9BcnJheSh2MiksXG4gICAgcG9zdGZpeCA9IEFycmF5KE1hdGguYWJzKHYxYXJyLmxlbmd0aCAtIHYyYXJyLmxlbmd0aCkpLmZpbGwoMClcblxuICB2MWFyci5sZW5ndGggPiB2MmFyci5sZW5ndGggPyB2MmFyci5wdXNoKC4uLnBvc3RmaXgpIDogdjFhcnIucHVzaCguLi5wb3N0Zml4KVxuXG4gIGlmICh2MWFyci5ldmVyeSgodiwgaSkgPT4gdiA9PT0gdjJhcnJbaV0pKSByZXR1cm4gMFxuXG4gIGZvciAobGV0IGkgPSAwLCBsZW4gPSB2MWFyci5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGlmICh2MWFycltpXSA+IHYyYXJyW2ldKSB7XG4gICAgICByZXR1cm4gMVxuICAgIH1cbiAgICBlbHNlIGlmICh2MWFycltpXSA8IHYyYXJyW2ldKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xXG59XG5cbmFzeW5jIGZ1bmN0aW9uIGlzQmdBbGl2ZSgpIHtcbiAgaWYgKCFpc0Nocm9tZSgpKSByZXR1cm4gbnVsbFxuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBQcm9taXNlLnJhY2UoW1xuICAgICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB3aW5kb3cuY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoJ3BpbmcnLCByZXNvbHZlKSksXG4gICAgICBkZWxheSgxMDAwMCkudGhlbigoKSA9PiAndGltZW91dGVkJylcbiAgICBdKVxuICB9XG4gIGNhdGNoKGUpIHtcbiAgICByZXR1cm4gJ29ycGhhbmVkJ1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgZ2V0QnJvd3NlcixcbiAgaXNGdW5jdGlvbixcbiAgY2hyb21lQmdFcnJvcixcbiAgaW50ZXJ2YWwsXG4gIGRlY2xlbnNpb24sXG4gIGNhbmNlbEludGVydmFsLFxuICBiZ1BhZ2VSZWxvYWQsXG4gIGlzRkYsXG4gIGlzQ2hyb21lLFxuICBpc1NhZmFyaSxcbiAgaXNTYWZhcmk4LFxuICBpc0dtYWlsLFxuICBpc1dpbmRvd3MsXG4gIGlzQmcsXG4gIGlzQmdPclBvcHVwLFxuICBpc1BvcHVwLFxuICBndWlkLFxuICBmb3JtYXROdW1iZXIsXG4gIGdldFJhbmRvbUludEluY2x1c2l2ZSxcbiAgc3R1YixcbiAgbWVtb2l6ZSxcbiAgc3luY1dhaXQsXG4gIHByb21pc2lmeSxcbiAgZGVsYXksXG4gIGZvcm1hdERhdGUsXG4gIGNyZWF0ZUNsYXNzLFxuICBlbWl0RG9tRXZlbnQsXG4gIHZlcnNpb25Db21wYXJhdG9yLFxuICBpc1ZhbGlkRW1haWwsXG4gIGlzQmdBbGl2ZSxcbiAgX2YsIF9GXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcInNlbGVjdF9jaGVja2JveFwiOlwiXzQyNS1zZWxlY3RfY2hlY2tib3hcIixcImNoZWNrYm94XCI6XCJfNDI1LWNoZWNrYm94XCIsXCJjaGVja2JveF9jaGVja1wiOlwiXzQyNS1jaGVja2JveF9jaGVja1wiLFwiY2hlY2tib3hfY2hlY2tfcm91bmRcIjpcIl80MjUtY2hlY2tib3hfY2hlY2tfcm91bmRcIn0iLCJtb2R1bGUuZXhwb3J0cyA9IHtcImhlYWRlclwiOlwiXzQ0MS1oZWFkZXJcIixcImxvZ29cIjpcIl80NDEtbG9nb1wiLFwiY2hyb21lXCI6XCJfNDQxLWNocm9tZVwiLFwic2FmYXJpXCI6XCJfNDQxLXNhZmFyaVwiLFwiZmlyZWZveFwiOlwiXzQ0MS1maXJlZm94XCJ9IiwibW9kdWxlLmV4cG9ydHMgPSB7XCJzYWZhcmlcIjpcInNhZmFyaVwiLFwiZ3ItcG9wdXAtd3JhcHBlclwiOlwiZ3ItcG9wdXAtd3JhcHBlclwiLFwiZ3ItcG9wdXAtd3JhcHBlci1yZWxheW91dFwiOlwiZ3ItcG9wdXAtd3JhcHBlci1yZWxheW91dFwiLFwid2luZG93c1wiOlwid2luZG93c1wiLFwic2V0dGluZ19pdGVtXCI6XCJzZXR0aW5nX2l0ZW1cIixcImVycm9yc1wiOlwiZXJyb3JzXCIsXCJkZXNjclwiOlwiZGVzY3JcIixcInRoaW5fdGV4dFwiOlwidGhpbl90ZXh0XCIsXCJmb290ZXJcIjpcImZvb3RlclwiLFwiZ3JfcG9wdXBfc2V0dGluZ3NcIjpcImdyX3BvcHVwX3NldHRpbmdzXCIsXCJmb290ZXJfYnRuXCI6XCJmb290ZXJfYnRuXCIsXCJsaW5lXCI6XCJsaW5lXCIsXCJzaG9ydF9ib3JkZXJcIjpcInNob3J0X2JvcmRlclwiLFwidG9wXCI6XCJ0b3BcIixcInNob3dfbmV3c1wiOlwic2hvd19uZXdzXCIsXCJuZXdzXCI6XCJuZXdzXCIsXCJmYWRlX25ld3NcIjpcImZhZGVfbmV3c1wiLFwibmV3c19jb250ZW50XCI6XCJuZXdzX2NvbnRlbnRcIixcImNsb3NlX25ld3NcIjpcImNsb3NlX25ld3NcIixcIm5vdF9zdXBwb3J0ZWRcIjpcIm5vdF9zdXBwb3J0ZWRcIixcImNoZWNrYm94X2NoZWNrXCI6XCJjaGVja2JveF9jaGVja1wiLFwic2l0ZV9zd2l0Y2hlclwiOlwic2l0ZV9zd2l0Y2hlclwiLFwidXBncmFkZVwiOlwidXBncmFkZVwiLFwiZGVmX3N3aXRjaGVyXCI6XCJkZWZfc3dpdGNoZXJcIixcIm9uXCI6XCJvblwiLFwib2ZmXCI6XCJvZmZcIixcInVwZ3JhZGVkXCI6XCJ1cGdyYWRlZFwiLFwiY29udGVudFwiOlwiY29udGVudFwiLFwic3VtbWFyeVwiOlwic3VtbWFyeVwiLFwic2luY2VcIjpcInNpbmNlXCIsXCJoYXNfZmF2aWNvblwiOlwiaGFzX2Zhdmljb25cIixcImZhdmljb25cIjpcImZhdmljb25cIixcImRvbWFpblwiOlwiZG9tYWluXCIsXCJub19maXhlc1wiOlwibm9fZml4ZXNcIixcImxibENvdW50XCI6XCJsYmxDb3VudFwiLFwidXBncmFkZV90aXRsZVwiOlwidXBncmFkZV90aXRsZVwiLFwibXlfZ3JhbW1hcmx5XCI6XCJteV9ncmFtbWFybHlcIixcIm5ld19kb2N1bWVudFwiOlwibmV3X2RvY3VtZW50XCJ9IiwibW9kdWxlLmV4cG9ydHMgPSB7XCJzaWduaW5cIjpcIl9kNTItc2lnbmluXCIsXCJiYW5uZXJcIjpcIl9kNTItYmFubmVyXCIsXCJkZXNjclwiOlwiX2Q1Mi1kZXNjclwiLFwiZGVzY3JfdGl0bGVcIjpcIl9kNTItZGVzY3JfdGl0bGVcIixcImJ1dHRvbnNcIjpcIl9kNTItYnV0dG9uc1wiLFwiYnV0dG9uXCI6XCJfZDUyLWJ1dHRvblwiLFwiYXV0aF9idXR0b25cIjpcIl9kNTItYXV0aF9idXR0b25cIixcInNpZ25fdXBcIjpcIl9kNTItc2lnbl91cFwiLFwiZnJlZVwiOlwiX2Q1Mi1mcmVlXCIsXCJmb290ZXJcIjpcIl9kNTItZm9vdGVyXCIsXCJzaWduaW5fbGlua1wiOlwiX2Q1Mi1zaWduaW5fbGlua1wifSIsIm1vZHVsZS5leHBvcnRzID0ge1wid3JhcFwiOlwiXzZjYi13cmFwXCIsXCJsaW5lXCI6XCJfNmNiLWxpbmVcIixcImRlc2NyaXB0aW9uXCI6XCJfNmNiLWRlc2NyaXB0aW9uXCIsXCJpbnZpdGVMaW5rXCI6XCJfNmNiLWludml0ZUxpbmtcIixcInBvcHVwTGluZVwiOlwiXzZjYi1wb3B1cExpbmVcIixcIm5ld0xhYmVsXCI6XCJfNmNiLW5ld0xhYmVsXCIsXCJwb3B1cExpbmtcIjpcIl82Y2ItcG9wdXBMaW5rXCJ9Il19
