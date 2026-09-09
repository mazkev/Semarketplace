# Multi-stage build for Go Backend
FROM golang:alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache ca-certificates tzdata git

ENV GOPROXY=https://proxy.golang.org,direct

# Copy source code
COPY . .

# Normalize go directive to 1.22, tidy modules, and compile
RUN sed -i -E 's/^go 1\.[0-9]+(\.[0-9]+)?/go 1.22/' go.mod && \
    go mod tidy && \
    CGO_ENABLED=0 GOOS=linux go build -v -ldflags="-w -s" -o server .

# Minimal production runtime
FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata sqlite && \
    mkdir -p /app/data

COPY --from=builder /app/server /app/server

ENV PORT=8080
EXPOSE 8080

VOLUME ["/app/data"]

CMD ["/app/server"]

