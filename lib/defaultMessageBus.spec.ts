import { wrap } from '@arpinum/promising';
import { DefaultMessageBus } from './defaultMessageBus';
import { Message, MessageBus } from './types';

describe('Message bus', () => {
  let bus: MessageBus;

  beforeEach(() => {
    bus = new DefaultMessageBus();
  });

  describe('while creating', () => {
    it('should ensure log is a function', () => {
      const creation = () => new DefaultMessageBus({ log: 3 } as any);

      expect(creation).toThrow('log must be a function');
    });

    it('should ensure exclusiveHandlers is a boolean', () => {
      const creation = () =>
        new DefaultMessageBus({ exclusiveHandlers: 3 } as any);

      expect(creation).toThrow('exclusiveHandlers must be a boolean');
    });

    it('should ensure ensureAtLeastOneHandler is a boolean', () => {
      const creation = () =>
        new DefaultMessageBus({ ensureAtLeastOneHandler: 3 } as any);

      expect(creation).toThrow('ensureAtLeastOneHandler must be a boolean');
    });

    it('should ensure handlersConcurrency is a number', () => {
      const creation = () =>
        new DefaultMessageBus({ handlersConcurrency: '3' } as any);

      expect(creation).toThrow('handlersConcurrency must be a number');
    });

    it('should ensure beforePost is an array', () => {
      const creation = () => new DefaultMessageBus({ beforePost: '3' } as any);

      expect(creation).toThrow('beforePost must be an array');
    });

    it('should ensure beforeHandle is an array', () => {
      const creation = () =>
        new DefaultMessageBus({ beforeHandle: '3' } as any);

      expect(creation).toThrow('beforeHandle must be an array');
    });

    it('should ensure afterHandle is an array', () => {
      const creation = () => new DefaultMessageBus({ afterHandle: '3' } as any);

      expect(creation).toThrow('afterHandle must be an array');
    });

    it('should ensure afterPost is an array', () => {
      const creation = () => new DefaultMessageBus({ afterPost: '3' } as any);

      expect(creation).toThrow('afterPost must be an array');
    });
  });

  describe('while posting', () => {
    it('should ensure message is defined', () => {
      const post = bus.post(undefined as any);

      return post.then(
        () => Promise.reject(new Error('Should fail')),
        rejection =>
          expect(rejection.message).toEqual('message must be present')
      );
    });

    it('should ensure message type is defined', () => {
      const post = bus.post({} as any);

      return post.then(
        () => Promise.reject(new Error('Should fail')),
        rejection =>
          expect(rejection.message).toEqual('message#type must be present')
      );
    });

    it('should ensure message type is a string', () => {
      const post = bus.post({ type: 4 } as any);

      return post.then(
        () => Promise.reject(new Error('Should fail')),
        rejection =>
          expect(rejection.message).toEqual('message#type must be a string')
      );
    });

    it('should post the message to the handlers', () => {
      bus.register('MyMessage', () => Promise.resolve('handler1'));
      bus.register('MyMessage', () => Promise.resolve('handler2'));

      const post = bus.post({ type: 'MyMessage', payload: undefined });

      return post.then(result => {
        expect(result).toEqual(['handler1', 'handler2']);
      });
    });

    it('should return empty array when no handler', () => {
      const post = bus.post({ type: 'MyMessage', payload: undefined });

      return post.then(result => {
        expect(result).toHaveLength(0);
      });
    });

    it('should reject if no handler and configured to ensure at least one', () => {
      const myBus = new DefaultMessageBus({ ensureAtLeastOneHandler: true });

      const post = myBus.post({ type: 'MyMessage', payload: undefined });

      return post.then(
        () => Promise.reject(new Error('Should fail')),
        rejection => {
          expect(rejection.message).toEqual('No handler for MyMessage');
        }
      );
    });

    it('should return undefined when no handler and bus handlers are exclusive', () => {
      const myBus = new DefaultMessageBus({ exclusiveHandlers: true });

      const post = myBus.post({ type: 'MyMessage', payload: undefined });

      return post.then(result => {
        expect(result).toBeUndefined();
      });
    });

    it('should promisify handlers', () => {
      bus.register('MyMessage', () => 'handler');

      const post = bus.post({ type: 'MyMessage', payload: undefined });

      return post.then(result => {
        expect(result).toEqual(['handler']);
      });
    });

    it('should post the message to the only handler when bus is configured as exclusive', () => {
      const myBus = new DefaultMessageBus({ exclusiveHandlers: true });
      myBus.register('MyMessage', () => Promise.resolve('the handler'));

      const post = myBus.post({ type: 'MyMessage', payload: undefined });

      return post.then(result => {
        expect(result).toEqual('the handler');
      });
    });

    it("won't post to the wrong handler", () => {
      const posts: string[] = [];
      bus.register('MyRightMessage', wrap(() => posts.push('handler1')));
      bus.register('MyWrongMessage', wrap(() => posts.push('handler2')));

      const post = bus.post({ type: 'MyRightMessage', payload: undefined });

      return post.then(() => {
        expect(posts).toEqual(['handler1']);
      });
    });
  });

  describe('while posting multiple messages at once', () => {
    it('should post all messages', () => {
      const posts: string[] = [];
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
        { type: 'message1', payload: undefined },
        { type: 'message2', payload: undefined },
        { type: 'message3', payload: undefined }
      ]);

      return post.then(results => {
        expect(posts).toEqual(['handler 1', 'handler 2', 'handler 3']);
        expect(results).toEqual([['handler 1'], ['handler 2'], ['handler 3']]);
      });
    });

    it('could post no message', () => {
      const posts: string[] = [];
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
      const posts: string[] = [];
      bus.register('message1', () => {
        posts.push('handler 1');
        return 'handler 1';
      });

      const post = bus.postAll([{ type: 'message1', payload: undefined }]);

      return post.then(results => {
        expect(posts).toEqual(['handler 1']);
        expect(results).toEqual([['handler 1']]);
      });
    });
  });

  describe('while registering', () => {
    it('should ensure message type is defined', () => {
      const register = () => bus.register(null as any, () => undefined);

      expect(register).toThrow('type must be present');
    });

    it('should ensure handler is defined', () => {
      const register = () => bus.register('MyMessage', undefined as any);

      expect(register).toThrow('handler must be present');
    });

    it('should ensure handler is a function', () => {
      const register = () => bus.register('MyMessage', 3 as any);

      expect(register).toThrow('handler must be a function');
    });

    it("won't allow multiple handlers when bus is configured as exclusive", () => {
      const myBus = new DefaultMessageBus({ exclusiveHandlers: true });
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

      const post = bus.post({ type: 'MyMessage', payload: undefined });
      return post.then(result => {
        expect(result).toEqual(['handler1']);
      });
    });
  });

  describe('while unregistering all handlers for a type', () => {
    it('should ensure types are strings', () => {
      const unregisterAll = () => bus.unregisterAll('MyMessage', 3 as any);

      expect(unregisterAll).toThrow('types[1] must be a string');
    });

    it("won't post a message to them anymore", () => {
      bus.register('MyMessage', () => Promise.resolve('handler1'));
      bus.register('MyMessage', () => Promise.resolve('handler2'));

      bus.unregisterAll('MyMessage');

      const post = bus.post({ type: 'MyMessage', payload: undefined });
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
        bus.post({ type: 'MyMessage1', payload: undefined }),
        bus.post({ type: 'MyMessage2', payload: undefined }),
        bus.post({ type: 'MyMessage3', payload: undefined })
      ]);
      return posts.then(result => {
        expect(result).toEqual([[], [], ['handler3']]);
      });
    });
  });

  describe('having some before handle decorators ', () => {
    it('should execute them before message handling', () => {
      const beforeHandle = [
        (m: Message) =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|first|` }
          }),
        (m: Message) =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|second|` }
          })
      ];
      const myBus = new DefaultMessageBus({ beforeHandle });
      let postedMessage: Message;
      myBus.register('MyMessage', (m: Message) => {
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
        (m: Message) =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|first|` }
          }),
        (m: Message) =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|second|` }
          })
      ];
      const myBus = new DefaultMessageBus({ beforeHandle });
      let postedMessage: Message;
      myBus.register('MyMessage', (m: Message) => {
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
        (result: any) => Object.assign({}, { order: `${result.order}|first|` }),
        (result: any) => Object.assign({}, { order: `${result.order}|second|` })
      ];
      const myBus = new DefaultMessageBus({ afterHandle });
      myBus.register('MyMessage', () =>
        Promise.resolve({ order: '|initial|' })
      );

      const post = myBus.post({ type: 'MyMessage', payload: undefined });

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
        (m: Message) =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|first|` }
          }),
        (m: Message) =>
          Object.assign({}, m, {
            payload: { order: `${m.payload.order}|second|` }
          })
      ];
      const myBus = new DefaultMessageBus({ beforePost });
      let postedMessage: Message;
      myBus.register('MyMessage', (m: Message) => {
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
        ([result]: any[]) => [
          Object.assign({}, { order: `${result.order}|first|` })
        ],
        ([result]: any[]) => [
          Object.assign({}, { order: `${result.order}|second|` })
        ]
      ];
      const myBus = new DefaultMessageBus({ afterPost });
      myBus.register('MyMessage', () =>
        Promise.resolve({ order: '|initial|' })
      );

      const post = myBus.post({ type: 'MyMessage', payload: undefined });

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
