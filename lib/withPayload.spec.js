'use strict';

const withPayload = require('./withPayload');

describe('With payload function', () => {

  it('should return a message with updated payload', () => {
    const message = {type: 'Message', payload: {value: 3}};

    const updated = withPayload(() => ({value: 5, otherValue: 12}))(message);

    updated.should.deep.equal({type: 'Message', payload: {value: 5, otherValue: 12}});
  });

  it('could use message to return the updated one', () => {
    const message = {type: 'Message', payload: {value: 3}};

    const updated = withPayload(m => ({value: m.payload.value + 1}))(message);

    updated.should.deep.equal({type: 'Message', payload: {value: 4}});
  });

  it('should return a new message', () => {
    const message = {type: 'Message', payload: {}};

    const updated = withPayload(() => ({}))(message);

    updated.should.not.equal(message);
  });

  it('should accept multiple arguments', () => {
    const message = {type: 'Message', payload: {value: 3}};

    const updated = withPayload(m => ({value: m.payload.value + 1}), message);

    updated.should.deep.equal({type: 'Message', payload: {value: 4}});
  });
});
