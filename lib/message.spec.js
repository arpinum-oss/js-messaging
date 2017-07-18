'use strict';

const should = require('chai').should();
const MessageContract = require('./messageContract');
const Message = require('./message');

describe('A message', () => {

  context('after creation', () => {
    it('should match MessageContract', () => {
      let message = new Message({type: 'Tadaa', payload: {the: 'payload'}});

      MessageContract.is(message).should.be.true;
    });
  });

  context('during creation', () => {
    it('should be created with a type and the payload', () => {
      let message = new Message({type: 'Tadaa', payload: {the: 'payload'}});

      message.type.should.equal('Tadaa');
      message.payload.should.deep.equal({the: 'payload'});
    });

    it('should have a date', () => {
      let message = new Message({type: 'Tadaa', payload: {the: 'payload'}});

      should.exist(message.date);
    });

    it('could be created with additional properties', () => {
      let message = new Message({type: 'Tadaa', payload: {the: 'payload'}, category: 'Important'});

      message.category.should.equal('Important');
    });

    it('should clone the payload to avoid further modifications', () => {
      let payload = {key: 'payload'};

      let message = new Message({type: 'Tadaa', payload});

      payload.key = 'modified payload';
      message.payload.key.should.equal('payload');
    });

    it('could be created with no payload at all', () => {
      let message = new Message({type: 'Tadaa'});

      message.payload.should.deep.equal({});
    });
  });

  context('while cloning', () => {
    it('should return a new message with same information', () => {
      let message = new Message({type: 'Tadaa', payload: {text: 'Hello'}});

      let clone = message.clone();

      clone.should.not.equal(message);
      clone.should.deep.equal(message);
    });

    it('should clone the payload to', () => {
      let message = new Message({type: 'Tadaa', payload: {text: 'Hello'}});

      let clone = message.clone();

      clone.payload.should.not.equal(message.payload);
    });
  });

  context('while updating payload', () => {
    it('should use new payload', () => {
      let message = new Message({type: 'Tadaa', payload: {count: 0}});

      let newMessage = message.updatePayload({count: 1});

      newMessage.payload.count.should.equal(1);
    });

    it('should return a new message', () => {
      let message = new Message({type: 'Tadaa'});

      let newMessage = message.updatePayload({});

      MessageContract.is(newMessage).should.be.true;
      message.should.not.equal(newMessage);
    });

    it('should retain message information', () => {
      let message = new Message({type: 'Tadaa', payload: {the: 'payload'}, otherProperty: 'Heya'});

      let newMessage = message.updatePayload({});

      newMessage.otherProperty.should.equal('Heya');
    });
  });

  context('while converting as plain object', () => {
    it('should return a new object with same information', () => {
      let message = new Message({type: 'Tadaa', payload: {the: 'payload'}});

      let object = message.asPlainObject();

      object.should.deep.equal(message);
      object.constructor.name.should.equal('Object');
    });
  });
});
