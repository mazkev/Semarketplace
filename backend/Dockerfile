# Multi-stage build for Go Backend
FROM golang:alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache ca-certificates tzdata git

ENV GOPROXY=https://proxy.golang.org,direct

# Cache go modules
COPY go.mod go.sum ./
RUN sed -i 's/^go 1\.[0-9]\+/go 1.22/' go.mod && go mod download

# Copy backend source code
COPY . .

# Build lightweight static binary without CGO
RUN sed -i 's/^go 1\.[0-9]\+/go 1.22/' go.mod && \
    CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server main.go

# Minimal production runtime
FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata && \
    mkdir -p /app/data

COPY --from=builder /app/server /app/server

ENV PORT=8080
EXPOSE 8080

VOLUME ["/app/data"]

CMD ["/app/server"]

