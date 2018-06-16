import { messageCreator } from './messageCreator';

interface Person {
  firstName: string;
  lastName: string;
}

describe('Message creator factory', () => {
  it('should create a message', () => {
    const createPerson = messageCreator<Person>('CREATE_PERSON');

    const message = createPerson({ firstName: 'John', lastName: 'Doe' });

    expect(message).toEqual({
      type: 'CREATE_PERSON',
      payload: { firstName: 'John', lastName: 'Doe' }
    });
  });

  it('should expose type with toString', () => {
    const createPerson = messageCreator<Person>('CREATE_PERSON');

    expect(createPerson.toString()).toEqual('CREATE_PERSON');
  });

  it('should expose type', () => {
    const createPerson = messageCreator<Person>('CREATE_PERSON');

    expect(createPerson.type).toEqual('CREATE_PERSON');
  });

  it('could have no payload type argument', () => {
    const sayHello = messageCreator<void>('SAY_HELLO');

    const message = sayHello(undefined);

    expect(message).toEqual({ type: 'SAY_HELLO', payload: undefined });
  });
});
