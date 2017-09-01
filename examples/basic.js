'use strict';

const {createMessageBus} = require('../lib');

const bus = createMessageBus();

bus.register('PrintText', message => console.log(message.payload.text));

bus.post({type: 'PrintText', payload: {text: 'Hello world'}});

// Hello world
