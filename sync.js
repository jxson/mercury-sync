var Transform = require('readable-stream/transform')
var EventEmitter = require('events').EventEmitter
var inherits = require('util').inherits
var _debug = require('debug')
var extend = require('xtend')

// https://github.com/mafintosh/length-prefixed-stream
module.exports = sync

function sync(channel, observ) {
  var debug = _debug('sync')
  var stream = SyncStream(channel, observ)
  var first = true

  // TODO: verify that state is an observ style observable Note, this fires on
  // EVERY change not just when there is a diff and that there is a problem when
  // side a sends an update, then side b will have a diff and send it's state
  // down causing the other side to update again.
  //
  // Both sending and receiving need to compare thier diffs before propagating
  // changes.
  observ(update)

  function update(state) {
    var clone = extend(state)
    var diff = extend(state._diff)

    delete clone._diff

    debug('update: %o', state)
    debug('state diff: %o', state._diff)

    var _clone = JSON.stringify(clone)
    var _diff = JSON.stringify(diff)

    if (_clone === _diff && ! first) {
      debug('skipping update')
      return
    }

    first = false

    stream.push(_clone)
  }

  return stream
}

function SyncStream(channel, state) {
  if (! (this instanceof SyncStream)) {
    return new SyncStream(channel, state)
  }

  var stream = this

  Transform.call(stream, {
    // lowWaterMark: 0,
    // higWaterMark: 16
  })

  stream.debug = _debug('sync:stream-' + channel)
  stream._state = state
  stream._channel = channel

  stream.on('data', function(data) {
    stream.debug('data %s', data)
  })
}

inherits(SyncStream, Transform);

SyncStream.prototype._write = function (chunk, encoding, callback) {
  var stream = this
  var debug = stream.debug

  debug('_write: %s - %s', encoding, chunk)

  // Actual control messages need to be sent down the wire, see:
  // https://github.com/dominictarr/rpc-stream/blob/master/index.js
  var string = chunk.toString()
  var update = JSON.parse(chunk)

  debug('update %o', update)

  stream._state.set(update)

  // callback(null, chunk)
  callback()
}


SyncStream.prototype._read = function (size) {
  var stream = this
  var debug = stream.debug

  debug('_read: %s', size)
}

function Protocol() {
  EventEmitter.call(this)
}

inherits(Protocol, EventEmitter)

// Does it need an initial handshake method to acknowledge the other side is
// hooked up?
Protocol.prototype.handle = function() {

}
