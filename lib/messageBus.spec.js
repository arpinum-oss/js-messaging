'use strict';

const {try: asyncTry} = require('@arpinum/promise');
const MessageBusContract = require('./messageBusContract');
const MessageBus = require('./messageBus');
const Message = require('./message');

describe('The message bus', () => {

  let bus;

  beforeEach(() => {
    bus = new MessageBus();
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

    it('should promisify handlers', () => {
      bus.register('MyMessage', () => 'handler');

      let post = bus.post({type: 'MyMessage'});

      return post.then(result => {
        result.should.deep.equal(['handler']);
      });
    });

    it('should post the message to the only handler when bus is configured as exclusive', () => {
      let bus = new MessageBus({exclusiveHandlers: true});
      bus.register('MyMessage', () => Promise.resolve('the handler'));

      let post = bus.post({type: 'MyMessage'});

      return post.then(result => {
        result.should.equal('the handler');
      });
    });

    it('wont post to the wrong handler', () => {
      let posts = [];
      bus.register('myRightMessage', () => {
        return asyncTry(() => posts.push('first handler'));
      });
      bus.register('myWrongMessage', () => {
        return asyncTry(() => posts.push('second handler'));
      });

      let post = bus.post({type: 'myRightMessage'});

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
      let bus = new MessageBus({exclusiveHandlers: true});
      bus.register('MyMessage', () => Promise.resolve('the handler'));

      let act = () => bus.register('MyMessage', () => Promise.resolve('other handler'));

      act.should.throw(Error);
    });
  });

  context('having some before handle decorators ', () => {
    it('should execute them before message handling', () => {
      let beforeHandle = [
        message => message.updatePayload({order: message.payload.order + '|first|'}),
        message => message.updatePayload({order: message.payload.order + '|second|'})
      ];
      let bus = new MessageBus({beforeHandle});
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
        message => asyncTry(() => message.updatePayload({order: message.payload.order + '|first|'})),
        message => asyncTry(() => message.updatePayload({order: message.payload.order + '|second|'}))
      ];
      let bus = new MessageBus({beforeHandle});
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
        result => Object.assign({}, {order: result.order + '|first|'}),
        result => Object.assign({}, {order: result.order + '|second|'})
      ];
      let bus = new MessageBus({afterHandle});
      bus.register('MyMessage', () => Promise.resolve({order: '|initial|'}));

      let post = bus.post({type: 'MyMessage'});

      return post.then(([result]) => {
        result.should.deep.equal({
          order: '|initial||first||second|'
        });
      });
    });
  });
});
