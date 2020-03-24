"use strict";

const { messageCreator } = require("../build");

const createPerson = messageCreator("CREATE_PERSON");

const message = createPerson({ firstName: "John", lastName: "Doe" });

console.log(message);
