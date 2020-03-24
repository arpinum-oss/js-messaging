"use strict";

const { createMessageBus } = require("../build");

const upperCaseText = (texts) => texts.map((text) => text.toUpperCase());
const withoutSpace = (texts) => texts.map((text) => text.replace(" ", "-"));

const bus = createMessageBus({
  afterPost: [upperCaseText, withoutSpace],
});
bus.register("ReturnText", (message) => message.payload);
bus
  .post({ type: "ReturnText", payload: "Hello world" })
  .then(([text]) => console.log(text));
// HELLO-WORLD
