FROM alpine

RUN set -ex \

# Install packages
  && apk add --no-cache --quiet --no-progress nodejs npm \

# Verify installed packages
  && node --version \
  && npm --version
