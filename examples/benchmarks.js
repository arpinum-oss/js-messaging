'use strict';

const {MessageBus} = require('../lib');

const postCount = 100000;

let bus = new MessageBus({log: () => undefined});
let handleCount = 0;
let start = new Date();

bus.register('Handle', () => {
  handleCount++;
});

post()
  .then(printStatistics)
  .catch(console.error);

function printStatistics() {
  let end = new Date();
  let duration = end - start;
  console.log(`${handleCount} messages handled in ${duration} ms`);
}

function post() {
  if (handleCount >= postCount) {
    return Promise.resolve();
  }
  return bus.post({type: 'Handle'}).then(post);
}


