export SHELL=/bin/bash
FRONTEND=./frontend
BACKEND=./backend


all: install test

test: build_frontend test_backend

build: build_frontend build_backend

install: install_frontend install_backend

install_frontend:
	pushd ${FRONTEND} && npm install && popd

install_backend:
	pushd ${BACKEND} && npm install && popd

test_backend:
	pushd ${BACKEND} && npm test && popd

build_frontend:
	pushd ${FRONTEND} && npm run build && popd

