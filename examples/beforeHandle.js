'use strict';

const {MessageBus} = require('../lib');

let bus = new MessageBus({
  beforeHandle: [
    withUpperCaseText,
    withoutSpaceInText
  ]
});

bus.register('PrintText', message => console.log(message.payload.text));

bus.broadcast({type: 'PrintText', payload: {text: 'Hello world'}});

// HELLO-WORLD

function withUpperCaseText(message) {
  let payload = Object.assign({}, message.payload, {text: message.payload.text.toUpperCase()});
  return Object.assign({}, message, {payload});
}

function withoutSpaceInText(message) {
  let payload = Object.assign({}, message.payload, {text: message.payload.text.replace(' ', '-')});
  return Object.assign({}, message, {payload});
}
