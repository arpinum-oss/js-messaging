import * as t from 'tcomb';

import { wrap } from '@arpinum/promising';
import { contracts } from './contracts';
import { createMessageBus, MessageBus } from './messageBus';

const { MessageBusContract } = contracts(t);

describe('Message bus', () => {
  let bus: MessageBus;

  beforeEach(() => {
    bus = createMessageBus();
  });

  it('should match MessageBusContract', () => {
    expect(MessageBusContract.is(bus)).toBeTruthy();
  });

  describe('while creating', () => {
    it('should ensure log is a function', () => {
      const creation = () => createMessageBus({ log: 3 } as any);

      expect(creation).toThrow('log must be a function');
    });

    it('should ensure exclusiveHandlers is a boolean', () => {
      const creation = () => createMessageBus({ exclusiveHandlers: 3 } as any);

      expect(creation).toThrow('exclusiveHandlers must be a boolean');
    });

    it('should ensure ensureAtLeastOneHandler is a boolean', () => {
      const creation = () =>
        createMessageBus({ ensureAtLeastOneHandler: 3 } as any);

      expect(creation).toThrow('ensureAtLeastOneHandler must be a boolean');
    });

    it('should ensure handlersConcurrency is a number', () => {
      const creation = () =>
        createMessageBus({ handlersConcurrency: '3' } as any);

      expect(creation).toThrow('handlersConcurrency must be a number');
    });

    it('should ensure beforeHandle is an array', () => {
      const creation = () => createMessageBus({ beforeHandle: '3' } as any);

      expect(creation).toThrow('beforeHandle must be an array');
    });

    it('should ensure afterHandle is an array', () => {
      const creation = () => createMessageBus({ afterHandle: '3' } as any);

      expect(creation).toThrow('afterHandle must be an array');
    });
  });

  describe('while posting', () => {
    it('should ensure message is defined', () => {
      const post = bus.post(undefined);

      return post.then(
        () => Promise.reject(new Error('Should fail')),
        rejection => expect(rejection.message).toEqual('Missing message')
      );
    });

    it('should ensure message type is defined', () => {
      const post = bus.post({} as any);

      return post.then(
        () => Promise.reject(new Error('Should fail')),
        rejection => expect(rejection.message).toEqual('Missing message type')
      );
    });

    it('should post the message to the handlers', () => {
      bus.register('MyMessage', () => Promise.resolve('handler1'));
      bus.register('MyMessage', () => Promise.resolve('handler2'));

      const post = bus.post({ type: 'MyMessage' });

      return post.then(result => {
        expect(result).toEqual(['handler1', 'handler2']);
      });
    });

    it('should return empty array when no handler', () => {
      const post = bus.post({ type: 'MyMessage' });

      return post.then(result => {
        expect(result).toHaveLength(0);
      });
    });

    it('should reject if no handler and configured to ensure at least one', () => {
      const myBus = createMessageBus({ ensureAtLeastOneHandler: true });

      const post = myBus.post({ type: 'MyMessage' });

      return post.then(
        () => Promise.reject(new Error('Should fail')),
        rejection => {
          expect(rejection.message).toEqual('No handler for MyMessage');
        }
      );
    });

    it('should return undefined when no handler and bus handlers are exclusive', () => {
      const myBus = createMessageBus({ exclusiveHandlers: true });

      const post = myBus.post({ type: 'MyMessage' });

      return post.then(result => {
        expect(result).toBeUndefined();
      });
    });

    it('should promisify handlers', () => {
      bus.register('MyMessage', () => 'handler');

      const post = bus.post({ type: 'MyMessage' });

      return post.then(result => {
        expect(result).toEqual(['handler']);
      });
    });

    it('should post the message to the only handler when bus is configured as exclusive', () => {
      const myBus = createMessageBus({ exclusiveHandlers: true });
      myBus.register('MyMessage', () => Promise.resolve('the handler'));

      const post = myBus.post({ type: 'MyMessage' });

      return post.then(result => {
        expect(result).toEqual('the handler');
      });
    });

    it("won't post to the wrong handler", () => {
      const posts = [];
      bus.register('MyRightMessage', wrap(() => posts.push('handler1')));
      bus.register('MyWrongMessage', wrap(() => posts.push('handler2')));

      const post = bus.post({ type: 'MyRightMessage' });

      return post.then(() => {
        expect(posts).toEqual(['handler1']);
      });
    });
  });

  describe('while posting multiple messages at once', () => {
    it('should post all messages', () => {
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
        expect(posts).toEqual(['handler 1', 'handler 2', 'handler 3']);
        expect(results).toEqual([['handler 1'], ['handler 2'], ['handler 3']]);
      });
    });

    it('could post no message', () => {
      const posts = [];
      bus.register('message1', () => {
        posts.push('handler 1');
        return 'handler 1';
      });
      const post = bus.postAll([]);

      return post.then(results => {
        expect(posts).toEqual([]);
        expect(results).toEqual([]);
      });
    });

    it('should post only one message', () => {
      const posts = [];
      bus.register('message1', () => {
        posts.push('handler 1');
        return 'handler 1';
      });

      const post = bus.postAll([{ type: 'message1' }]);

      return post.then(results => {
        expect(posts).toEqual(['handler 1']);
        expect(results).toEqual([['handler 1']]);
      });
    });
  });

  describe('while registering', () => {
    it('should ensure message type is defined', () => {
      const register = () => bus.register(null, () => undefined);

      expect(register).toThrow('Missing type');
    });

    it('should ensure handler is defined', () => {
      const register = () => bus.register('MyMessage', undefined);

      expect(register).toThrow('Missing handler');
    });

    it('should ensure handler is a function', () => {
      const register = () => bus.register('MyMessage', 3 as any);

      expect(register).toThrow('handler must be a function');
    });

    it("won't allow multiple handlers when bus is configured as exclusive", () => {
      const myBus = createMessageBus({ exclusiveHandlers: true });
      myBus.register('MyMessage', () => Promise.resolve('the handler'));

      const act = () =>
        myBus.register('MyMessage', () => Promise.resolve('other handler'));

      expect(act).toThrow(Error);
    });
  });

  describe('while unregistering a handler', () => {
    it("won't post a message to it anymore", () => {
      bus.register('MyMessage', () => Promise.resolve('handler1'));
      const unregister = bus.register('MyMessage', () =>
        Promise.resolve('handler2')
      );

      unregister();

      const post = bus.post({ type: 'MyMessage' });
      return post.then(result => {
        expect(result).toEqual(['handler1']);
      });
    });
  });

  describe('while unregistering all handlers for a type', () => {
    it('should ensure types are strings', () => {
      const unregisterAll = () => bus.unregisterAll('MyMessage', 3);

      expect(unregisterAll).toThrow('types must be strings');
    });

    it("won't post a message to them anymore", () => {
      bus.register('MyMessage', () => Promise.resolve('handler1'));
      bus.register('MyMessage', () => Promise.resolve('handler2'));

      bus.unregisterAll('MyMessage');

      const post = bus.post({ type: 'MyMessage' });
      return post.then(result => {
        expect(result).toHaveLength(0);
      });
    });
  });

  describe('while unregistering all handlers for multiple types', () => {
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
        expect(result).toEqual([[], [], ['handler3']]);
      });
    });
  });

  describe('having some before handle decorators ', () => {
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
      const myBus = createMessageBus({ beforeHandle });
      let postedMessage;
      myBus.register('MyMessage', m => {
        postedMessage = m;
        return Promise.resolve();
      });
      const message = { type: 'MyMessage', payload: { order: '|initial|' } };

      const post = myBus.post(message);

      return post.then(() => {
        expect(postedMessage).toEqual({
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
      const myBus = createMessageBus({ beforeHandle });
      let postedMessage;
      myBus.register('MyMessage', m => {
        postedMessage = m;
        return Promise.resolve();
      });
      const message = { type: 'MyMessage', payload: { order: '|initial|' } };

      const post = myBus.post(message);

      return post.then(() => {
        const expected = {
          type: 'MyMessage',
          payload: { order: '|initial||first||second|' }
        };
        expect(postedMessage).toEqual(expected);
      });
    });
  });

  describe('having some after handle decorators ', () => {
    it('should execute them after message handling', () => {
      const afterHandle = [
        result => Object.assign({}, { order: `${result.order}|first|` }),
        result => Object.assign({}, { order: `${result.order}|second|` })
      ];
      const myBus = createMessageBus({ afterHandle });
      myBus.register('MyMessage', () =>
        Promise.resolve({ order: '|initial|' })
      );

      const post = myBus.post({ type: 'MyMessage' });

      return post.then(([result]) => {
        expect(result).toEqual({
          order: '|initial||first||second|'
        });
      });
    });
  });

  describe('having some before post decorators ', () => {
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
      const myBus = createMessageBus({ beforePost });
      let postedMessage;
      myBus.register('MyMessage', m => {
        postedMessage = m;
        return Promise.resolve();
      });
      const message = { type: 'MyMessage', payload: { order: '|initial|' } };

      const post = myBus.post(message);

      return post.then(() => {
        expect(postedMessage).toEqual({
          type: message.type,
          payload: {
            order: '|initial||first||second|'
          }
        });
      });
    });
  });

  describe('having some after post decorators ', () => {
    it('should execute them after message post', () => {
      const afterPost = [
        ([result]) => [Object.assign({}, { order: `${result.order}|first|` })],
        ([result]) => [Object.assign({}, { order: `${result.order}|second|` })]
      ];
      const myBus = createMessageBus({ afterPost });
      myBus.register('MyMessage', () =>
        Promise.resolve({ order: '|initial|' })
      );

      const post = myBus.post({ type: 'MyMessage' });

      return post.then(([result]) => {
        expect(result).toEqual({
          order: '|initial||first||second|'
        });
      });
    });
  });

  describe('while counting handlers', () => {
    it('should ensure type is a string', () => {
      const handlerCount = () => bus.handlerCount(3 as any);

      expect(handlerCount).toThrow('type must be a string');
    });

    it('should return 0 if none for a given type', () => {
      bus.register('MyMessage', () => Promise.resolve('handler'));

      const count = bus.handlerCount('MyOtherMessage');

      expect(count).toEqual(0);
    });

    it('should return 2 if 2 handlers for a given type', () => {
      bus.register('MyMessage', () => Promise.resolve('handler'));
      bus.register('MyOtherMessage', () => Promise.resolve('handler'));
      bus.register('MyMessage', () => Promise.resolve('handler'));

      const count = bus.handlerCount('MyMessage');

      expect(count).toEqual(2);
    });
  });
});
