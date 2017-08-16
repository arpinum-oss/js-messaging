'use strict';

const {MessageBus} = require('../lib');

const bus = new MessageBus({
  afterHandle: [
    upperCaseText,
    withoutSpace
  ]
});

bus.register('ReturnText', message => message.payload.text);

bus.post({type: 'ReturnText', payload: {text: 'Hello world'}})
  .then(([text]) => console.log(text));

// HELLO-WORLD

function upperCaseText(text) {
  return text.toUpperCase();
}

function withoutSpace(text) {
  return text.replace(' ', '-');
}
