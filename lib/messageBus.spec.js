'use strict';

const {wrap} = require('@arpinum/promising');
const MessageBusContract = require('./messageBusContract');
const MessageBus = require('./messageBus');
const Message = require('./message');

describe('Message bus', () => {

  let bus;

  beforeEach(() => {
    bus = createMesssageBus();
  });

  it('should match MessageBusContract', () => {
    MessageBusContract.is(bus).should.be.true;
  });

  context('while posting', () => {
    it('should post the message to the handlers', () => {
      bus.register('MyMessage', () => Promise.resolve('first handler'));
      bus.register('MyMessage', () => Promise.resolve('second handler'));

      let post = bus.post({type: 'MyMessage'});

      return post.then(result => {
        result.should.deep.equal(['first handler', 'second handler']);
      });
    });

    it('should give a new copy to each handler', () => {
      bus.register('MyMessage', message => {
        message.payload.text = 'modified';
        return message.payload.text;
      });
      bus.register('MyMessage', message => message.payload.text);

      let post = bus.post({type: 'MyMessage', payload: {text: 'original'}});

      return post.then(result => {
        result.should.deep.equal(['modified', 'original']);
      });
    });

    it('should promisify handlers', () => {
      bus.register('MyMessage', () => 'handler');

      let post = bus.post({type: 'MyMessage'});

      return post.then(result => {
        result.should.deep.equal(['handler']);
      });
    });

    it('should post the message to the only handler when bus is configured as exclusive', () => {
      let bus = createMesssageBus({exclusiveHandlers: true});
      bus.register('MyMessage', () => Promise.resolve('the handler'));

      let post = bus.post({type: 'MyMessage'});

      return post.then(result => {
        result.should.equal('the handler');
      });
    });

    it('wont post to the wrong handler', () => {
      let posts = [];
      bus.register('MyRightMessage', () => {
        return wrap(() => posts.push('first handler'));
      });
      bus.register('MyWrongMessage', () => {
        return wrap(() => posts.push('second handler'));
      });

      let post = bus.post({type: 'MyRightMessage'});

      return post.then(() => {
        posts.should.deep.equal(['first handler']);
      });
    });

    it('should post multiple messages', () => {
      let posts = [];
      bus.register('message1', () => {
        posts.push('handler 1');
        return 'handler 1';
      });
      bus.register('message2', () => {
        posts.push('handler 2');
        return 'handler 2';
      });
      bus.register('message3', () => {
        posts.push('handler 3');
        return 'handler 3';
      });

      let post = bus.postAll([{type: 'message1'}, {type: 'message2'}, {type: 'message3'}]);

      return post.then(results => {
        posts.should.deep.equal(['handler 1', 'handler 2', 'handler 3']);
        results.should.deep.equal([['handler 1'], ['handler 2'], ['handler 3']]);
      });
    });
  });

  context('while registering', () => {
    it('wont allow multiple handlers when bus is configured as exclusive', () => {
      let bus = createMesssageBus({exclusiveHandlers: true});
      bus.register('MyMessage', () => Promise.resolve('the handler'));

      let act = () => bus.register('MyMessage', () => Promise.resolve('other handler'));

      act.should.throw(Error);
    });
  });

  context('while unregistering', () => {
    it('wont post a message to the former handler anymore', () => {
      bus.register('MyMessage', () => Promise.resolve('first handler'));
      const unregister = bus.register('MyMessage', () => Promise.resolve('second handler'));

      unregister();

      let post = bus.post({type: 'MyMessage'});
      return post.then(result => {
        result.should.deep.equal(['first handler']);
      });
    });
  });

  context('having some before handle decorators ', () => {
    it('should execute them before message handling', () => {
      let beforeHandle = [
        message => message.updatePayload({order: `${message.payload.order}|first|`}),
        message => message.updatePayload({order: `${message.payload.order}|second|`})
      ];
      let bus = createMesssageBus({beforeHandle});
      let postedMessage;
      bus.register('MyMessage', message => {
        postedMessage = message;
        return Promise.resolve();
      });
      let message = new Message({type: 'MyMessage', payload: {order: '|initial|'}});

      let post = bus.post(message);

      return post.then(() => {
        postedMessage.should.deep.equal(new Message({
          type: message.type,
          date: message.date,
          payload: {
            order: '|initial||first||second|'
          }
        }));
      });
    });

    it('should execute them serially though they are async', () => {
      let beforeHandle = [
        message => wrap(() => message.updatePayload({order: `${message.payload.order}|first|`})),
        message => wrap(() => message.updatePayload({order: `${message.payload.order}|second|`}))
      ];
      let bus = createMesssageBus({beforeHandle});
      let postedMessage;
      bus.register('MyMessage', message => {
        postedMessage = message;
        return Promise.resolve();
      });
      let message = new Message({type: 'MyMessage', payload: {order: '|initial|'}});

      let post = bus.post(message);

      return post.then(() => {
        postedMessage.should.deep.equal(message.updatePayload({order: '|initial||first||second|'}));
      });
    });
  });

  context('having some after handle decorators ', () => {
    it('should execute them after message handling', () => {
      let afterHandle = [
        result => Object.assign({}, {order: `${result.order}|first|`}),
        result => Object.assign({}, {order: `${result.order}|second|`})
      ];
      let bus = createMesssageBus({afterHandle});
      bus.register('MyMessage', () => Promise.resolve({order: '|initial|'}));

      let post = bus.post({type: 'MyMessage'});

      return post.then(([result]) => {
        result.should.deep.equal({
          order: '|initial||first||second|'
        });
      });
    });
  });

  function createMesssageBus(creation) {
    return new MessageBus(Object.assign({log: () => undefined}, creation));
  }
});
