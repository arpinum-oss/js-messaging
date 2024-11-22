import {
  assertFunction,
  assertOptionalArray,
  assertOptionalBoolean,
  assertOptionalFunction,
  assertOptionalNumber,
  assertOptionalString,
  assertPresent,
  assertString,
} from "./asserts";

describe("Asserts module", () => {
  describe("about string", () => {
    it("should succeed for a string", () => {
      assertString("Dog", "Value");
    });

    it("should fail for something irrelevant", () => {
      const act = () => assertString(3, "Value");

      expect(act).toThrow("Value must be a string");
    });

    it("should fail for undefined", () => {
      const act = () => assertString(undefined, "Value");

      expect(act).toThrow("Value must be a string");
    });
  });

  describe("about optional string", () => {
    it("should succeed for undefined", () => {
      assertOptionalString(undefined, "Value");
    });

    it("should succeed for a string", () => {
      assertOptionalString("Dog", "Value");
    });

    it("should fail for something irrelevant", () => {
      const act = () => assertOptionalString(3, "Value");

      expect(act).toThrow("Value must be a string");
    });
  });

  describe("about function", () => {
    it("should succeed for an arrow function", () => {
      assertFunction(() => undefined, "Value");
    });

    it("should succeed for a function", () => {
      assertFunction(function () {
        return undefined;
      }, "Value");
    });

    it("should fail for something irrelevant", () => {
      const act = () => assertFunction(3, "Value");

      expect(act).toThrow("Value must be a function");
    });

    it("should fail for undefined", () => {
      const act = () => assertFunction(undefined, "Value");

      expect(act).toThrow("Value must be a function");
    });
  });

  describe("about optional function", () => {
    it("should succeed for undefined", () => {
      assertOptionalFunction(undefined, "Value");
    });

    it("should succeed for an arrow function", () => {
      assertOptionalFunction(() => undefined, "Value");
    });

    it("should succeed for a function", () => {
      assertOptionalFunction(function () {
        return undefined;
      }, "Value");
    });

    it("should fail for something irrelevant", () => {
      const act = () => assertOptionalFunction(3, "Value");

      expect(act).toThrow("Value must be a function");
    });
  });

  describe("about optional number", () => {
    it("should succeed for undefined", () => {
      assertOptionalNumber(undefined, "Value");
    });

    it("should succeed for a number", () => {
      assertOptionalNumber(42, "Value");
    });

    it("should fail for something irrelevant", () => {
      const act = () => assertOptionalNumber("3", "Value");

      expect(act).toThrow("Value must be a number");
    });
  });

  describe("about optional boolean", () => {
    it("should succeed for undefined", () => {
      assertOptionalBoolean(undefined, "Value");
    });

    it("should succeed for a boolean", () => {
      assertOptionalBoolean(true, "Value");
    });

    it("should fail for something irrelevant", () => {
      const act = () => assertOptionalBoolean(3, "Value");

      expect(act).toThrow("Value must be a boolean");
    });
  });

  describe("about optional array", () => {
    it("should succeed for undefined", () => {
      assertOptionalArray(undefined, "Value");
    });

    it("should succeed for an array", () => {
      assertOptionalArray(["Dog", "Cat"], "Value");
    });

    it("should fail for something irrelevant", () => {
      const act = () => assertOptionalArray("Dog", "Value");

      expect(act).toThrow("Value must be an array");
    });
  });

  describe("about present", () => {
    it("should succeed for a value", () => {
      assertPresent(3, "Value");
    });

    it("should fail for undefined", () => {
      const act = () => assertPresent(undefined, "Value");

      expect(act).toThrow("Value must be present");
    });

    it("should fail for null", () => {
      const act = () => assertPresent(null, "Value");

      expect(act).toThrow("Value must be present");
    });
  });
});
