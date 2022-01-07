# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 4.0.2 - 2022-01-07

### Changed

- dependencies update
- tslint replaced with eslint

## 4.0.1 - 2020-03-24

### Changed

- dependencies update

## 4.0.0 - 2019-04-19

### Changed

- `voidMessageCreator` factory to create messages with undefined payload

### BREAKING CHANGES

- No more tcomb related stuff
- `payload` property must exist in a `Message` (but can be null or undefined)

## 3.0.0 - 2018-06-13

### Changed

- Generics for `Message`, `MessageHandler` types
- `messageCreator` factory to create typesafe messages
