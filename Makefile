export SHELL=/bin/bash

test: build_frontend test_backend

docker: clean_docker build
	docker build --tag coucool --tag registry.heroku.com/coucool/web .

heroku: clean_docker build
	heroku container:push --app coucool web

install: clean install_frontend install_backend

build: clean build_frontend build_backend

clean:
	rm -rf ./backend/build ./backend/node_modules ./frontend/node_modules ./frontend/dist

clean_docker:
	docker rmi --force coucool || true

install_frontend:
	pushd ./frontend && npm install && popd

install_backend:
	pushd ./backend && npm install && popd

test_backend:
	pushd ./backend && npm test && popd

build_frontend: install_frontend
	pushd ./frontend && npm run build && popd

build_backend: install_backend
	pushd ./backend && npm run build && popd

