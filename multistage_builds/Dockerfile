FROM golang:1.9 AS builder

COPY hello_world.go .

# Download the dependcies with 'go get', and then build it with 'go build'.
RUN go get -d -v ./... && \
    CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

FROM gcr.io/kaniko-project/executor:debug

# Copy from the previous stage only the compiled binary, not the code, not the dependencies.
COPY --from=builder $CI_PROJECT_DIR/main /main

ENTRYPOINT ["/main"]
