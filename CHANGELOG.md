# Changelog

## 4.0.0 - unreleased

### Changes

- `voidMessageCreator` factory to create messages with undefined payload

### Breaking changes

- No more tcomb related stuff
- `payload` property must exist in a `Message` (but can be null or undefined)

## 3.0.0 - 2018-06-13

### Changes

- Generics for `Message`, `MessageHandler` types
- `messageCreator` factory to create typesafe messages
