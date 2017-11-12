'use strict';

const should = require('chai').should();
const { wrap } = require('@arpinum/promising');
const { MessageBusContract } = require('./contracts')(require('tcomb'));
const createMessageBus = require('./messageBus');

describe('Message bus', () => {
  let bus;

  beforeEach(() => {
    bus = createMessageBus();
  });

  it('should match MessageBusContract', () => {
    MessageBusContract.is(bus).should.be.true;
  });

  context('while creating', () => {
    it('should ensure log is a function', () => {
      const creation = () => createMessageBus({ log: 3 });

      creation.should.throw(Error, 'log must be a function');
    });

    it('should ensure exclusiveHandlers is a boolean', () => {
      const creation = () => createMessageBus({ exclusiveHandlers: 3 });

      creation.should.throw(Error, 'exclusiveHandlers must be a boolean');
    });

    it('should ensure ensureAtLeastOneHandler is a boolean', () => {
      const creation = () => createMessageBus({ ensureAtLeastOneHandler: 3 });

      creation.should.throw(Error, 'ensureAtLeastOneHandler must be a boolean');
    });

    it('should ensure handlersConcurrency is a number', () => {
      const creation = () => createMessageBus({ handlersConcurrency: '3' });

      creation.should.throw(Error, 'handlersConcurrency must be a number');
    });

    it('should ensure beforeHandle is an array', () => {
      const creation = () => createMessageBus({ beforeHandle: '3' });

      creation.should.throw(Error, 'beforeHandle must be an array');
    });

    it('should ensure afterHandle is an array', () => {
      const creation = () => createMessageBus({ afterHandle: '3' });

      creation.should.throw(Error, 'afterHandle must be an array');
    });
  });

  context('while posting', () => {
    it('should ensure message is defined', () => {
      const post = bus.post();

      return post.then(
        () => Promise.reject(new Error('Should fail')),
        rejection => rejection.message.should.equal('Missing message')
      );
    });

    it('should ensure message type is defined', () => {
      const post = bus.post({});

      return post.then(
        () => Promise.reject(new Error('Should fail')),
        rejection => rejection.message.should.equal('Missing message type')
      );
    });

    it('should post the message to the handlers', () => {
      bus.register('MyMessage', () => Promise.resolve('handler1'));
      bus.register('MyMessage', () => Promise.resolve('handler2'));

      const post = bus.post({ type: 'MyMessage' });

      return post.then(result => {
        result.should.deep.equal(['handler1', 'handler2']);
      });
    });

    it('should return empty array when no handler', () => {
      const post = bus.post({ type: 'MyMessage' });

      return post.then(result => {
        result.should.deep.equal([]);
      });
    });

    it('should reject if no handler and configured to ensure at least one', () => {
      const bus = createMessageBus({ ensureAtLeastOneHandler: true });

      const post = bus.post({ type: 'MyMessage' });

      return post.then(
        () => Promise.reject(new Error('Should fail')),
        rejection => {
          rejection.message.should.equal('No handler for MyMessage');
        }
      );
    });

    it('should return undefined when no handler and bus handlers are exclusive', () => {
      const bus = createMessageBus({ exclusiveHandlers: true });

      const post = bus.post({ type: 'MyMessage' });

      return post.then(result => {
        should.equal(undefined, result);
      });
    });

    it('should promisify handlers', () => {
      bus.register('MyMessage', () => 'handler');

      const post = bus.post({ type: 'MyMessage' });

      return post.then(result => {
        result.should.deep.equal(['handler']);
      });
    });

    it('should post the message to the only handler when bus is configured as exclusive', () => {
      const bus = createMessageBus({ exclusiveHandlers: true });
      bus.register('MyMessage', () => Promise.resolve('the handler'));

      const post = bus.post({ type: 'MyMessage' });

      return post.then(result => {
        result.should.equal('the handler');
      });
    });

    it("won't post to the wrong handler", () => {
      const posts = [];
      bus.register('MyRightMessage', wrap(() => posts.push('handler1')));
      bus.register('MyWrongMessage', wrap(() => posts.push('handler2')));

      const post = bus.post({ type: 'MyRightMessage' });

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

      const post = bus.postAll([
        { type: 'message1' },
        { type: 'message2' },
        { type: 'message3' }
      ]);

      return post.then(results => {
        posts.should.deep.equal(['handler 1', 'handler 2', 'handler 3']);
        results.should.deep.equal([
          ['handler 1'],
          ['handler 2'],
          ['handler 3']
        ]);
      });
    });
  });

  context('while registering', () => {
    it('should ensure message type is defined', () => {
      const register = () => bus.register(null, () => undefined);

      register.should.throw(Error, 'Missing type');
    });

    it('should ensure handler is defined', () => {
      const register = () => bus.register('MyMessage');

      register.should.throw(Error, 'Missing handler');
    });

    it('should ensure handler is a function', () => {
      const register = () => bus.register('MyMessage', 3);

      register.should.throw(Error, 'handler must be a function');
    });

    it("won't allow multiple handlers when bus is configured as exclusive", () => {
      const bus = createMessageBus({ exclusiveHandlers: true });
      bus.register('MyMessage', () => Promise.resolve('the handler'));

      const act = () =>
        bus.register('MyMessage', () => Promise.resolve('other handler'));

      act.should.throw(Error);
    });
  });

  context('while unregistering a handler', () => {
    it("won't post a message to it anymore", () => {
      bus.register('MyMessage', () => Promise.resolve('handler1'));
      const unregister = bus.register('MyMessage', () =>
        Promise.resolve('handler2')
      );

      unregister();

      const post = bus.post({ type: 'MyMessage' });
      return post.then(result => {
        result.should.deep.equal(['handler1']);
      });
    });
  });

  context('while unregistering all handlers for a type', () => {
    it('should ensure types are strings', () => {
      const unregisterAll = () => bus.unregisterAll('MyMessage', 3);

      unregisterAll.should.throw(Error, 'types must be strings');
    });

    it("won't post a message to them anymore", () => {
      bus.register('MyMessage', () => Promise.resolve('handler1'));
      bus.register('MyMessage', () => Promise.resolve('handler2'));

      bus.unregisterAll('MyMessage');

      const post = bus.post({ type: 'MyMessage' });
      return post.then(result => {
        result.should.deep.equal([]);
      });
    });
  });

  context('while unregistering all handlers for multiple types', () => {
    it("won't post a message to them anymore", () => {
      bus.register('MyMessage1', () => Promise.resolve('handler1'));
      bus.register('MyMessage2', () => Promise.resolve('handler2'));
      bus.register('MyMessage3', () => Promise.resolve('handler3'));

      bus.unregisterAll('MyMessage1', 'MyMessage2');

      const posts = Promise.all([
        bus.post({ type: 'MyMessage1' }),
        bus.post({ type: 'MyMessage2' }),
        bus.post({ type: 'MyMessage3' })
      ]);
      return posts.then(result => {
        result.should.deep.equal([[], [], ['handler3']]);
      });
    });
  });

  context('having some before handle decorators ', () => {
    it('should execute them before message handling', () => {
      const beforeHandle = [
        m =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|first|` }
          }),
        m =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|second|` }
          })
      ];
      const bus = createMessageBus({ beforeHandle });
      let postedMessage;
      bus.register('MyMessage', message => {
        postedMessage = message;
        return Promise.resolve();
      });
      const message = { type: 'MyMessage', payload: { order: '|initial|' } };

      const post = bus.post(message);

      return post.then(() => {
        postedMessage.should.deep.equal({
          type: message.type,
          payload: {
            order: '|initial||first||second|'
          }
        });
      });
    });

    it('should execute them serially though they are async', () => {
      const beforeHandle = [
        m =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|first|` }
          }),
        m =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|second|` }
          })
      ];
      const bus = createMessageBus({ beforeHandle });
      let postedMessage;
      bus.register('MyMessage', message => {
        postedMessage = message;
        return Promise.resolve();
      });
      const message = { type: 'MyMessage', payload: { order: '|initial|' } };

      const post = bus.post(message);

      return post.then(() => {
        const expected = {
          type: 'MyMessage',
          payload: { order: '|initial||first||second|' }
        };
        postedMessage.should.deep.equal(expected);
      });
    });
  });

  context('having some after handle decorators ', () => {
    it('should execute them after message handling', () => {
      const afterHandle = [
        result => Object.assign({}, { order: `${result.order}|first|` }),
        result => Object.assign({}, { order: `${result.order}|second|` })
      ];
      const bus = createMessageBus({ afterHandle });
      bus.register('MyMessage', () => Promise.resolve({ order: '|initial|' }));

      const post = bus.post({ type: 'MyMessage' });

      return post.then(([result]) => {
        result.should.deep.equal({
          order: '|initial||first||second|'
        });
      });
    });
  });

  context('having some before post decorators ', () => {
    it('should execute them before message handling', () => {
      const beforePost = [
        m =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|first|` }
          }),
        m =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|second|` }
          })
      ];
      const bus = createMessageBus({ beforePost });
      let postedMessage;
      bus.register('MyMessage', message => {
        postedMessage = message;
        return Promise.resolve();
      });
      const message = { type: 'MyMessage', payload: { order: '|initial|' } };

      const post = bus.post(message);

      return post.then(() => {
        postedMessage.should.deep.equal({
          type: message.type,
          payload: {
            order: '|initial||first||second|'
          }
        });
      });
    });
  });

  context('having some after post decorators ', () => {
    it('should execute them after message post', () => {
      const afterPost = [
        ([result]) => [Object.assign({}, { order: `${result.order}|first|` })],
        ([result]) => [Object.assign({}, { order: `${result.order}|second|` })]
      ];
      const bus = createMessageBus({ afterPost });
      bus.register('MyMessage', () => Promise.resolve({ order: '|initial|' }));

      const post = bus.post({ type: 'MyMessage' });

      return post.then(([result]) => {
        result.should.deep.equal({
          order: '|initial||first||second|'
        });
      });
    });
  });

  context('while counting handlers', () => {
    it('should ensure type is a string', () => {
      const handlerCount = () => bus.handlerCount(3);

      handlerCount.should.throw(Error, 'type must be a string');
    });

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
});
