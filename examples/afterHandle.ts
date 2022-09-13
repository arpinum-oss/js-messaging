import { createMessageBus, ResultHookOption } from "../lib";

const upperCaseText: ResultHookOption = (textMaybe) =>
  typeof textMaybe === "string" ? textMaybe.toUpperCase() : textMaybe;
const withoutSpace: ResultHookOption = (textMaybe) =>
  typeof textMaybe === "string" ? textMaybe.replace(" ", "-") : textMaybe;

const bus = createMessageBus({
  afterHandle: [upperCaseText, withoutSpace],
});
bus.register("ReturnText", (message) => message.payload);
bus
  .post({ type: "ReturnText", payload: "Hello world" })
  .then(([text]) => console.log(text));
// HELLO-WORLD
