import { messageCreator } from "../lib";

interface Person {
  firstName: string;
  lastName: string;
}

const createPerson = messageCreator<Person>("CREATE_PERSON");

const message = createPerson({ firstName: "John", lastName: "Doe" });

// tslint:disable-next-line:no-console
console.log(message);
