"use strict";

const { createMessageBus } = require("../build");

const bus = createMessageBus();
bus.register("PrintText", (message) => console.log(message.payload));
bus.post({ type: "PrintText", payload: "Hello world" });

// Hello world
