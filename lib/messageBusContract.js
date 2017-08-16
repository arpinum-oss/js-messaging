const t = require('tcomb');

const MessageBusContract = t.interface({
  postAll: t.Function,
  post: t.Function,
  register: t.Function,
  unregisterAll: t.Function,
  handlerCount: t.Function
}, {name: 'MessageBusContract'});

module.exports = MessageBusContract;
