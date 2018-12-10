FROM golang:1.11.2-stretch as base

FROM base as builder

WORKDIR /workdir
RUN curl -LO https://github.com/istio/istio/releases/download/1.0.2/istio-1.0.2-linux.tar.gz
RUN tar xzf istio-1.0.2-linux.tar.gz
RUN cp istio-1.0.2/bin/istioctl ./istioctl

FROM base 

WORKDIR /go/src/istiowatcher
COPY . .
COPY --from=builder /workdir/istioctl /usr/local/bin/istioctl

RUN go get -d -v ./...
RUN go install -v ./...

CMD ["istiowatcher"]