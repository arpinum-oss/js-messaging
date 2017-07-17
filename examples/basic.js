'use strict';

const {MessageBus} = require('../lib');

let bus = new MessageBus();

bus.register('PrintText', message => console.log(message.payload.text));

bus.broadcast({type: 'PrintText', payload: {text: 'Hello world'}});

// Hello world
