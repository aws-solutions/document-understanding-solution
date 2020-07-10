Release History
---------------

0.9 (2016-02-07)
++++++++++++++++

**New features**

- Support for STS temporary credentials. Thanks to https://github.com/magdalene

**Tests**

- Tests for the STS temporary credentials functionality
- Fixed AWS4SigningKey.amz_date deprecation warning test
- Elastic MapReduce live service test no longer using deprecated
  DescribeJobFlows action


0.8 (2015-12-31)
++++++++++++++++

This version introduces some behaviour changes designed to reduce the legwork
needed when a signing key goes out of date. This has implications for
multithreading and secret key storage. See the README for further details.

**New features**

- AWS4Auth class now checks request header date against signing key scope
  date, and automatically regenerates the signing key with the request
  date if they don't match
- Added exceptions module with new exceptions: RequestsAWS4AuthException,
  DateMismatchError, NoSecretKeyError, DateFormatError
- Added StrictAWS4Auth and PassiveAWS4Auth classes

**AWS4Auth changes**

- Added regenerate_signing_key() method, to allow regeneration of
  current signing key with parameter overrides
- Added methods for checking and extracting dates from requests:
  get_request_date(), parse_date(), handle_date_mismatch()
- __call__() now checks for a date header in the request and attempts
  to automatically regenerate the signing key with the request date if
  request date differs from the signing key date
- Can now supply a date to the constructor
- Changed default included sig headers to include 'Date' header if
  present

**AWS4SigningKey changes**

- Added new store_secret_key instantiation parameter which allows
  control of whether the secret key is stored in the instance
- Deprecated the amz_date property in favour of just 'date'
- Spelling typo fix in AWS4AuthSigningKey module docstring. Thanks
  to jhgorrell

**Package changes**

- Dropped support for Python 3.2. Now only supported on Python 2.7 and 3.3 and
  up, to match versions supported by Requests.

**Tests**

- Many new tests for the new functionality
- Added tests for generating canonical path, including test for fix
  added in 0.7 for percent encoding of paths
- Added tests for generating canonical querystrings


0.7 (2015-11-02)
++++++++++++++++

**Bugfixes**

- Fixed percent encoded characters in URL paths not being encoded again
  for signature generation, as is expected for all services except S3.
  This was causing authentication failures whenever these characters
  appeared in a URL. Thanks to ipartola and cristi23 for the report.

- Two bugfixes for ElasticSearch, thanks to Matthew Thompson for both:
  * No longer setting body to b'' during signing if it's None
  * Now stripping port from URL netloc for signature generation

**Modules**

- Upgraded the included version of six.py to 1.10

**Tests**

- Fixed a couple of broken Unicode tests on Python 2

- Added a couple more tests for encoding Unicode request bodies


0.6 (2015-09-07)
++++++++++++++++

**Bugfixes**

- Included HISTORY.rst in built package to fix pip source install failure.
  Thanks to Beirdo for the bug report.


0.5 (2015-04-29)
++++++++++++++++

**Bugfixes**

- Fixed bug when uploading to S3 with x-amz-acl header which caused
  authentication failure - headers used in signature are now: host,
  content-type and all x-amz-* headers (except for x-amz-client-context which
  breaks Mobile Analytics auth if included)

**Docs**

- Minor docstring and comment updates

**License**

- Changed content of LICENSE to vanilla MIT license
