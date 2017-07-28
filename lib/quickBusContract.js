const t = require('tcomb');

const QuickBusContract = t.interface({
  post: t.Function,
  register: t.Function
}, {name: 'QuickBusContract'});

module.exports = QuickBusContract;
