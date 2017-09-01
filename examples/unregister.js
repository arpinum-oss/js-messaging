'use strict';

const {createMessageBus} = require('../lib');

const bus = createMessageBus();

const unregister = bus.register('PrintText', message => console.log(message.payload.text));

setTimeout(unregister, 5000);

const timer = setInterval(() => bus.post({type: 'PrintText', payload: {text: 'Hello world'}}), 1000);

setTimeout(() => clearInterval(timer), 7000);
