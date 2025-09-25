# Docker image configuration
IMAGE_NAME ?= vibed-tools
REGISTRY ?= docker.io/alexbrand
REPO ?= $(REGISTRY)/$(IMAGE_NAME)
TAG ?= $(shell git rev-parse --short HEAD)
FULL_IMAGE := $(REPO):$(TAG)
PLATFORM ?= linux/amd64

# Default target
.DEFAULT_GOAL := build

# Setup buildx builder if it doesn't exist
.PHONY: setup-buildx
setup-buildx:
	@docker buildx inspect mybuilder >/dev/null 2>&1 || \
		docker buildx create --name mybuilder --use

# Build the Docker image locally (for testing)
.PHONY: build
build:
	docker build -t $(FULL_IMAGE) .
	docker tag $(FULL_IMAGE) $(REPO):latest

# Build and push multi-arch image using buildx
.PHONY: buildx-push
buildx-push: setup-buildx
	docker buildx build \
		--platform $(PLATFORM) \
		--tag $(FULL_IMAGE) \
		--tag $(REPO):latest \
		--push \
		.

# Legacy push target (builds and pushes using buildx)
.PHONY: push
push: buildx-push

# Clean up local images
.PHONY: clean
clean:
	docker rmi $(FULL_IMAGE) $(REPO):latest || true

# Show current configuration
.PHONY: info
info:
	@echo "Image Name: $(IMAGE_NAME)"
	@echo "Registry: $(REGISTRY)"
	@echo "Repository: $(REPO)"
	@echo "Tag: $(TAG)"
	@echo "Full Image: $(FULL_IMAGE)"
	@echo "Platform: $(PLATFORM)"