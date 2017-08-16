'use strict';

const should = require('chai').should();
const MessageContract = require('./messageContract');
const Message = require('./message');

describe('A message', () => {

  context('after creation', () => {
    it('should match MessageContract', () => {
      const message = new Message({type: 'Tadaa', payload: {the: 'payload'}});

      MessageContract.is(message).should.be.true;
    });
  });

  context('during creation', () => {
    it('should be created with a type and the payload', () => {
      const message = new Message({type: 'Tadaa', payload: {the: 'payload'}});

      message.type.should.equal('Tadaa');
      message.payload.should.deep.equal({the: 'payload'});
    });

    it('should have a date', () => {
      const message = new Message({type: 'Tadaa', payload: {the: 'payload'}});

      should.exist(message.date);
    });

    it('could be created with additional properties', () => {
      const message = new Message({type: 'Tadaa', payload: {the: 'payload'}, category: 'Important'});

      message.category.should.equal('Important');
    });

    it('should clone the payload to avoid further modifications', () => {
      const payload = {key: 'payload'};

      const message = new Message({type: 'Tadaa', payload});

      payload.key = 'modified payload';
      message.payload.key.should.equal('payload');
    });

    it('could be created with no payload at all', () => {
      const message = new Message({type: 'Tadaa'});

      message.payload.should.deep.equal({});
    });
  });

  context('while cloning', () => {
    it('should return a new message with same information', () => {
      const message = new Message({type: 'Tadaa', payload: {text: 'Hello'}});

      const clone = message.clone();

      clone.should.not.equal(message);
      clone.should.deep.equal(message);
    });

    it('should clone the payload to', () => {
      const message = new Message({type: 'Tadaa', payload: {text: 'Hello'}});

      const clone = message.clone();

      clone.payload.should.not.equal(message.payload);
    });
  });

  context('while updating payload', () => {
    it('should use new payload', () => {
      const message = new Message({type: 'Tadaa', payload: {count: 0}});

      const newMessage = message.updatePayload({count: 1});

      newMessage.payload.count.should.equal(1);
    });

    it('should return a new message', () => {
      const message = new Message({type: 'Tadaa'});

      const newMessage = message.updatePayload({});

      MessageContract.is(newMessage).should.be.true;
      message.should.not.equal(newMessage);
    });

    it('should retain message information', () => {
      const message = new Message({type: 'Tadaa', payload: {the: 'payload'}, otherProperty: 'Heya'});

      const newMessage = message.updatePayload({});

      newMessage.otherProperty.should.equal('Heya');
    });
  });

  context('while converting as plain object', () => {
    it('should return a new object with same information', () => {
      const message = new Message({type: 'Tadaa', payload: {the: 'payload'}});

      const object = message.asPlainObject();

      object.should.deep.equal(message);
      object.constructor.name.should.equal('Object');
    });
  });
});
