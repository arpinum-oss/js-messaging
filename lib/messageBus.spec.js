'use strict';

const should = require('chai').should();
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
      bus.register('MyMessage', () => Promise.resolve('handler1'));
      bus.register('MyMessage', () => Promise.resolve('handler2'));

      const post = bus.post({type: 'MyMessage'});

      return post.then(result => {
        result.should.deep.equal(['handler1', 'handler2']);
      });
    });

    it('should return empty array when no handler', () => {
      const post = bus.post({type: 'MyMessage'});

      return post.then(result => {
        result.should.deep.equal([]);
      });
    });

    it('should reject if no handler and configured to ensure at least one', () => {
      const bus = createMesssageBus({ensureAtLeastOneHandler: true});

      const post = bus.post({type: 'MyMessage'});

      return post.then(
        () => Promise.reject(new Error('Should fail')),
        rejection => {
          rejection.message.should.equal('No handler for MyMessage');
        });
    });

    it('should return undefined when no handler and bus handlers are exclusive', () => {
      const bus = createMesssageBus({exclusiveHandlers: true});

      const post = bus.post({type: 'MyMessage'});

      return post.then(result => {
        should.equal(undefined, result);
      });
    });

    it('should give a new copy to each handler', () => {
      bus.register('MyMessage', message => {
        message.payload.text = 'modified';
        return message.payload.text;
      });
      bus.register('MyMessage', message => message.payload.text);

      const post = bus.post({type: 'MyMessage', payload: {text: 'original'}});

      return post.then(result => {
        result.should.deep.equal(['modified', 'original']);
      });
    });

    it('should promisify handlers', () => {
      bus.register('MyMessage', () => 'handler');

      const post = bus.post({type: 'MyMessage'});

      return post.then(result => {
        result.should.deep.equal(['handler']);
      });
    });

    it('should post the message to the only handler when bus is configured as exclusive', () => {
      const bus = createMesssageBus({exclusiveHandlers: true});
      bus.register('MyMessage', () => Promise.resolve('the handler'));

      const post = bus.post({type: 'MyMessage'});

      return post.then(result => {
        result.should.equal('the handler');
      });
    });

    it('wont post to the wrong handler', () => {
      const posts = [];
      bus.register('MyRightMessage', () => {
        return wrap(() => posts.push('handler1'));
      });
      bus.register('MyWrongMessage', () => {
        return wrap(() => posts.push('handler2'));
      });

      const post = bus.post({type: 'MyRightMessage'});

      return post.then(() => {
        posts.should.deep.equal(['handler1']);
      });
    });

    it('should post multiple messages', () => {
      const posts = [];
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

      const post = bus.postAll([{type: 'message1'}, {type: 'message2'}, {type: 'message3'}]);

      return post.then(results => {
        posts.should.deep.equal(['handler 1', 'handler 2', 'handler 3']);
        results.should.deep.equal([['handler 1'], ['handler 2'], ['handler 3']]);
      });
    });
  });

  context('while registering', () => {
    it('wont allow multiple handlers when bus is configured as exclusive', () => {
      const bus = createMesssageBus({exclusiveHandlers: true});
      bus.register('MyMessage', () => Promise.resolve('the handler'));

      const act = () => bus.register('MyMessage', () => Promise.resolve('other handler'));

      act.should.throw(Error);
    });
  });

  context('while unregistering a handler', () => {
    it('wont post a message to it anymore', () => {
      bus.register('MyMessage', () => Promise.resolve('handler1'));
      const unregister = bus.register('MyMessage', () => Promise.resolve('handler2'));

      unregister();

      const post = bus.post({type: 'MyMessage'});
      return post.then(result => {
        result.should.deep.equal(['handler1']);
      });
    });
  });

  context('while unregistering all handlers for a type', () => {
    it('wont post a message to them anymore', () => {
      bus.register('MyMessage', () => Promise.resolve('handler1'));
      bus.register('MyMessage', () => Promise.resolve('handler2'));

      bus.unregisterAll('MyMessage');

      const post = bus.post({type: 'MyMessage'});
      return post.then(result => {
        result.should.deep.equal([]);
      });
    });
  });

  context('while unregistering all handlers for multiple types', () => {
    it('wont post a message to them anymore', () => {
      bus.register('MyMessage1', () => Promise.resolve('handler1'));
      bus.register('MyMessage2', () => Promise.resolve('handler2'));
      bus.register('MyMessage3', () => Promise.resolve('handler3'));

      bus.unregisterAll('MyMessage1', 'MyMessage2');

      const posts = Promise.all([
        bus.post({type: 'MyMessage1'}),
        bus.post({type: 'MyMessage2'}),
        bus.post({type: 'MyMessage3'})
      ]);
      return posts.then(result => {
        result.should.deep.equal([[], [], ['handler3']]);
      });
    });
  });

  context('having some before handle decorators ', () => {
    it('should execute them before message handling', () => {
      const beforeHandle = [
        message => message.updatePayload({order: `${message.payload.order}|first|`}),
        message => message.updatePayload({order: `${message.payload.order}|second|`})
      ];
      const bus = createMesssageBus({beforeHandle});
      let postedMessage;
      bus.register('MyMessage', message => {
        postedMessage = message;
        return Promise.resolve();
      });
      const message = new Message({type: 'MyMessage', payload: {order: '|initial|'}});

      const post = bus.post(message);

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
      const beforeHandle = [
        message => wrap(() => message.updatePayload({order: `${message.payload.order}|first|`})),
        message => wrap(() => message.updatePayload({order: `${message.payload.order}|second|`}))
      ];
      const bus = createMesssageBus({beforeHandle});
      let postedMessage;
      bus.register('MyMessage', message => {
        postedMessage = message;
        return Promise.resolve();
      });
      const message = new Message({type: 'MyMessage', payload: {order: '|initial|'}});

      const post = bus.post(message);

      return post.then(() => {
        postedMessage.should.deep.equal(message.updatePayload({order: '|initial||first||second|'}));
      });
    });
  });

  context('having some after handle decorators ', () => {
    it('should execute them after message handling', () => {
      const afterHandle = [
        result => Object.assign({}, {order: `${result.order}|first|`}),
        result => Object.assign({}, {order: `${result.order}|second|`})
      ];
      const bus = createMesssageBus({afterHandle});
      bus.register('MyMessage', () => Promise.resolve({order: '|initial|'}));

      const post = bus.post({type: 'MyMessage'});

      return post.then(([result]) => {
        result.should.deep.equal({
          order: '|initial||first||second|'
        });
      });
    });
  });

  context('while counting handlers', () => {
    it('should return 0 if none for a given type', () => {
      bus.register('MyMessage', () => Promise.resolve('handler'));

      const count = bus.handlerCount('MyOtherMessage');

      count.should.equal(0);
    });

    it('should return 2 if 2 handlers for a given type', () => {
      bus.register('MyMessage', () => Promise.resolve('handler'));
      bus.register('MyOtherMessage', () => Promise.resolve('handler'));
      bus.register('MyMessage', () => Promise.resolve('handler'));

      const count = bus.handlerCount('MyMessage');

      count.should.equal(2);
    });
  });

  function createMesssageBus(creation) {
    return new MessageBus(Object.assign({log: () => undefined}, creation));
  }
});
