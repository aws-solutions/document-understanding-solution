FROM cern/cc7-base

MAINTAINER borja.aparicio.cotarelo@cern.ch

COPY helloworld.sh /
RUN chmod 700 /helloworld.sh

ENTRYPOINT /helloworld.sh