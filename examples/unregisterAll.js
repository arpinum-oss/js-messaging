'use strict';

const {MessageBus} = require('../lib');

const bus = new MessageBus();

bus.register('PrintText', message => console.log('1', message.payload.text));
bus.register('PrintText', message => console.log('2', message.payload.text));

setTimeout(() => bus.unregisterAll('PrintText'), 5000);

const timer = setInterval(() => bus.post({type: 'PrintText', payload: {text: 'Hello world'}}), 1000);

setTimeout(() => clearInterval(timer), 7000);
