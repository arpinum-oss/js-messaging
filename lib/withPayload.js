'use strict';

function withPayload(...args) {
  return args.reduce((result, arg) => result(arg), currified);

  function currified(func) {
    return message => {
      const payload = Object.assign({}, message.payload, func(message));
      return Object.assign({}, message, {payload});
    };
  }
}

module.exports = withPayload;
