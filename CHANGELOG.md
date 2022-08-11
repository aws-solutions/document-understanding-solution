# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2022-08-10
### Changed
- update `cdk` from 1.132 to 1.158.0
- update `aws-sdk` to 2.1182.0 for Lambdas with Nodejs runtimes
- update `boto3` to 1.24.37 for Lambdas with Python runtimes
- update `react` and `next` node libraries based on compatibility with Node 14.x runtime
- removed `next-sass` as newer version of `next` has the functionality built-in
- removed `node-sass` and added `sass`  as the original library is deprecated (https://github.com/sass/node-sass)

## [1.0.3] - 2021-11-15
- Update `cdk` from 1.42.0 to 1.132.0

## [1.0.2] - 2021-04-29
- Update `next` from 10.0.3 to 10.0.4
- Update `aws-amplify` 2.1.0 to 3.3.25
- Remove `sass-lint`
- Resolve `netmask` and `y18n` vulnerabilities

## [1.0.1] - 2021-01-04

### Changed

- Updated the command to install the package moto in README and deployment scripts
- Updated the version of the package ini from 1.3.5 to 1.3.8
- Modified package.json to install version 0.21.1 for axios which is a dependency of amplify

## [1.0.0] - 2020-10-30

### Added

- Initial Release
