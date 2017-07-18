const t = require('tcomb');

const MessageBusContract = t.interface({
  postAll: t.Function,
  post: t.Function,
  register: t.Function
}, {name: 'MessageBusContract'});

module.exports = MessageBusContract;
