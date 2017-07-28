'use strict';

const QuickBusContract = require('./quickBusContract');
const QuickBus = require('./quickBus');

describe('Quick bus', () => {

  let bus;

  beforeEach(() => {
    bus = new QuickBus();
  });

  it('should match QuickBusContract', () => {
    QuickBusContract.is(bus).should.be.true;
  });

  context('while posting', () => {
    it('should post the message to the handlers', () => {
      bus.register('MyMessage', () => Promise.resolve('first handler'));
      bus.register('MyMessage', () => Promise.resolve('second handler'));

      const post = bus.post({type: 'MyMessage'});

      return post.then(result => {
        result.should.deep.equal(['first handler', 'second handler']);
      });
    });

    it('wont post to the wrong handler', () => {
      const posts = [];
      bus.register('MyRightMessage', () => {
        posts.push('first handler');
      });
      bus.register('MyWrongMessage', () => {
        posts.push('second handler');
      });

      const post = bus.post({type: 'MyRightMessage'});

      return post.then(() => {
        posts.should.deep.equal(['first handler']);
      });
    });

    it('should ensure message is defined', () => {
      const post = bus.post();

      return post.then(
        () => Promise.resolve(new Error('Should fail')),
        rejection => rejection.message.should.equal('Missing message'));
    });

    it('should ensure message type is defined', () => {
      const post = bus.post({});

      return post.then(
        () => Promise.resolve(new Error('Should fail')),
        rejection => rejection.message.should.equal('Missing message type'));
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

      register.should.throw(Error, 'Handler must be a function');
    });
  });
});
