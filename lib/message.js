'use strict';

const RawMessageContract = require('./rawMessageContract');

class Message {

  constructor(creation) {
    let {payload} = RawMessageContract(creation);
    Object.assign(this, {date: new Date()}, creation, {payload: Object.assign({}, payload)});
  }

  updatePayload(payload) {
    let newPayload = Object.assign({}, this.payload, payload);
    return new Message(Object.assign({}, this, {payload: newPayload}));
  }

  clone() {
    return new Message(this);
  }

  asPlainObject() {
    return Object.assign({}, this);
  }
}

module.exports = Message;
