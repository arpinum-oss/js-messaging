'use strict';

const {MessageBus} = require('../lib');

const bus = new MessageBus({
  beforeHandle: [
    withUpperCaseText,
    withoutSpaceInText
  ]
});

bus.register('PrintText', message => console.log(message.payload.text));

bus.post({type: 'PrintText', payload: {text: 'Hello world'}});

// HELLO-WORLD

function withUpperCaseText(message) {
  return message.updatePayload({text: message.payload.text.toUpperCase()});
}

function withoutSpaceInText(message) {
  return message.updatePayload({text: message.payload.text.replace(' ', '-')});
}
