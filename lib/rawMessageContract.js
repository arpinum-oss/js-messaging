const t = require('tcomb');

const RawMessageContract = t.interface({
  type: t.String,
  issuerId: t.maybe(t.String),
  payload: t.maybe(t.Object)
}, {name: 'RawMessageContract'});

module.exports = RawMessageContract;
