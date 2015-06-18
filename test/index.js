var test = require('tape')
var sync = require('../')
var hg = require('mercury')

test('stream', function(t) {
  t.plan(1)

  var a = state()
  var b = state()

  b(function(update) {
    t.equal(a.value(), b.value())
  })

  var streamA = sync('a', a)
  var streamB = sync('b', b)

  streamA
  .pipe(streamB)
  .pipe(streamA)

  a.value.set(1)
})

test.skip('websocket', function(t) {
  t.plan(1)

  var a = state()
  var b = state()

  b(function(update) {
    t.equal(a.value(), b.value())
  })

  server(function(address, close) {
    t.on('end', close)

    sync(address, a)
    sync(address, b)

    a.value.set(1)

    close(t.end)
  })
})

function state() {
  return hg.state({
    value: hg.value(0)
  })
}
