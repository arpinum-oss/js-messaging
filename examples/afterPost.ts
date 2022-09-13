import { createMessageBus, ResultsHookOption } from "../lib";

const upperCaseText: ResultsHookOption = (textsMaybe) =>
  textsMaybe.map((textMaybe) =>
    typeof textMaybe === "string" ? textMaybe.toUpperCase() : textMaybe
  );
const withoutSpace: ResultsHookOption = (textsMaybe) =>
  textsMaybe.map((textMaybe) =>
    typeof textMaybe === "string" ? textMaybe.replace(" ", "-") : textMaybe
  );

const bus = createMessageBus({
  afterPost: [upperCaseText, withoutSpace],
});
bus.register("ReturnText", (message) => message.payload);
bus
  .post({ type: "ReturnText", payload: "Hello world" })
  .then(([text]) => console.log(text));
// HELLO-WORLD
