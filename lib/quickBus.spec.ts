import { QuickBus } from "./quickBus";
import { MessageBus } from "./types";

describe("Quick bus", () => {
  let bus: MessageBus;

  beforeEach(() => {
    bus = new QuickBus();
  });

  describe("while posting", () => {
    it("should post the message to the handlers", () => {
      bus.register("MyMessage", () => Promise.resolve("first handler"));
      bus.register("MyMessage", () => Promise.resolve("second handler"));

      const post = bus.post({ type: "MyMessage", payload: undefined });

      return post.then((result) => {
        expect(result).toEqual(["first handler", "second handler"]);
      });
    });

    it("won't post to the wrong handler", () => {
      const posts: string[] = [];
      bus.register("MyRightMessage", () => {
        posts.push("first handler");
      });
      bus.register("MyWrongMessage", () => {
        posts.push("second handler");
      });

      const post = bus.post({ type: "MyRightMessage", payload: undefined });

      return post.then(() => {
        expect(posts).toEqual(["first handler"]);
      });
    });

    it("should ensure message is defined", () => {
      const post = bus.post(undefined as any);

      return post.then(
        () => Promise.reject(new Error("Should fail")),
        (rejection) => expect(rejection.message).toEqual("Missing message")
      );
    });

    it("should ensure message type is defined", () => {
      const post = bus.post({} as any);

      return post.then(
        () => Promise.reject(new Error("Should fail")),
        (rejection) => expect(rejection.message).toEqual("Missing message type")
      );
    });
  });

  describe("while registering", () => {
    it("should ensure message type is defined", () => {
      const register = () => bus.register(null as any, () => undefined);

      expect(register).toThrow("Missing type");
    });

    it("should ensure handler is defined", () => {
      const register = () => bus.register("MyMessage", undefined as any);

      expect(register).toThrow("Missing handler");
    });

    it("should ensure handler is a function", () => {
      const register = () => bus.register("MyMessage", 3 as any);

      expect(register).toThrow("Handler must be a function");
    });
  });
});
