export SHELL=/bin/bash
FRONTEND=./frontend
BACKEND=./backend


test: build_frontend test_backend

docker: clean_docker build
	docker build -t coucool . 

heroku: clean_docker build
	heroku container:push -a coucool web

install: clean install_frontend install_backend

build: clean build_frontend build_backend

clean:
	rm -rf ${BACKEND}/build ${BACKEND}/node_modules ${FRONTEND}/node_modules ${FRONTEND}/dist

clean_docker:
	docker rmi --force coucool

install_frontend:
	pushd ${FRONTEND} && npm install && popd

install_backend:
	pushd ${BACKEND} && npm install && popd

test_backend:
	pushd ${BACKEND} && npm test && popd

build_frontend: install_frontend
	pushd ${FRONTEND} && npm run build && popd

build_backend: install_backend
	pushd ${BACKEND} && npm run build && popd

