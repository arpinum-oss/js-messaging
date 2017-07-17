'use strict';

const t = require('tcomb');

const RawMessageContract = t.interface({
  type: t.String,
  issuerId: t.maybe(t.String),
  payload: t.maybe(t.Object)
});

class Message {

  constructor(creation) {
    let {payload} = RawMessageContract(creation);
    Object.assign(this, {date: new Date()}, creation, {payload: Object.assign({}, payload)});
  }

  updatePayload(payload) {
    let newPayload = Object.assign({}, this.payload, payload);
    return new Message(Object.assign({}, this, {payload: newPayload}));
  }
}

module.exports = Message;
