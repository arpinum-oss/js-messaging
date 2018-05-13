import { messageCreator } from './messageCreator';

interface Person {
  firstName: string;
  lastName: string;
}

describe('Message creator', () => {
  describe('should return a factory', () => {
    it('which creates a message', () => {
      const createPerson = messageCreator<Person>('CREATE_PERSON');

      const message = createPerson({ firstName: 'John', lastName: 'Doe' });

      expect(message).toEqual({
        type: 'CREATE_PERSON',
        payload: { firstName: 'John', lastName: 'Doe' }
      });
    });

    it('with a toString corresponding to type', () => {
      const createPerson = messageCreator<Person>('CREATE_PERSON');

      expect(createPerson.toString()).toEqual('CREATE_PERSON');
    });
  });
});
