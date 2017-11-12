'use strict';

const { createMessageBus } = require('../lib');

const upperCaseText = text => text.toUpperCase();
const withoutSpace = text => text.replace(' ', '-');

const bus = createMessageBus({
  afterHandle: [upperCaseText, withoutSpace]
});
bus.register('ReturnText', message => message.payload);
bus
  .post({ type: 'ReturnText', payload: 'Hello world' })
  .then(([text]) => console.log(text));
// HELLO-WORLD
