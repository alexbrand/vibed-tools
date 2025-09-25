# Docker image configuration
IMAGE_NAME ?= vibed-tools
REGISTRY ?= docker.io/alexbrand
REPO ?= $(REGISTRY)/$(IMAGE_NAME)
GIT_SHA := $(shell git rev-parse --short HEAD)
CURRENT_VERSION := $(shell cat VERSION 2>/dev/null || echo "1")
TAG ?= $(GIT_SHA)
FULL_IMAGE := $(REPO):$(TAG)
VERSION_IMAGE := $(REPO):$(CURRENT_VERSION)
PLATFORM ?= linux/amd64

# Default target
.DEFAULT_GOAL := build

# Version increment function
.PHONY: increment-version
increment-version:
	@current=$$(cat VERSION); \
	new_version=$$((current + 1)); \
	echo $$new_version > VERSION; \
	echo "Version incremented from $$current to $$new_version"

# Setup buildx builder if it doesn't exist
.PHONY: setup-buildx
setup-buildx:
	@docker buildx inspect mybuilder >/dev/null 2>&1 || \
		docker buildx create --name mybuilder --use

# Build the Docker image locally (for testing)
.PHONY: build
build:
	docker build -t $(FULL_IMAGE) .
	docker tag $(FULL_IMAGE) $(VERSION_IMAGE)
	docker tag $(FULL_IMAGE) $(REPO):latest

# Build and push multi-arch image using buildx
.PHONY: buildx-push
buildx-push: setup-buildx increment-version
	@echo "Building and pushing with tags: $(FULL_IMAGE), $(VERSION_IMAGE), $(REPO):latest"
	docker buildx build \
		--platform $(PLATFORM) \
		--tag $(FULL_IMAGE) \
		--tag $(VERSION_IMAGE) \
		--tag $(REPO):latest \
		--push \
		.

# Legacy push target (builds and pushes using buildx)
.PHONY: push
push: buildx-push

# Clean up local images
.PHONY: clean
clean:
	docker rmi $(FULL_IMAGE) $(VERSION_IMAGE) $(REPO):latest || true

# Show current configuration
.PHONY: info
info:
	@echo "Image Name: $(IMAGE_NAME)"
	@echo "Registry: $(REGISTRY)"
	@echo "Repository: $(REPO)"
	@echo "Current Version: $(CURRENT_VERSION)"
	@echo "Git SHA: $(GIT_SHA)"
	@echo "Git SHA Tag: $(FULL_IMAGE)"
	@echo "Version Tag: $(VERSION_IMAGE)"
	@echo "Latest Tag: $(REPO):latest"
	@echo "Platform: $(PLATFORM)"