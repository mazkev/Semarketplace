# Multi-stage build for Go Backend
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Install ca-certificates and tzdata
RUN apk add --no-cache ca-certificates tzdata

# Cache go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy backend source code
COPY . .

# Build lightweight static binary without CGO
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server main.go

# Minimal production runtime
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata && \
    mkdir -p /app/data

COPY --from=builder /app/server /app/server

ENV PORT=8080
EXPOSE 8080

VOLUME ["/app/data"]

CMD ["/app/server"]
