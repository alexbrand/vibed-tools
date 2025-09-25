# Docker image configuration
IMAGE_NAME ?= vibed-tools
REGISTRY ?= docker.io/alexbrand
REPO ?= $(REGISTRY)/$(IMAGE_NAME)
TAG ?= $(shell git rev-parse --short HEAD)
FULL_IMAGE := $(REPO):$(TAG)

# Default target
.DEFAULT_GOAL := build

# Build the Docker image
.PHONY: build
build:
	docker build -t $(FULL_IMAGE) .
	docker tag $(FULL_IMAGE) $(REPO):latest

# Push the Docker image
.PHONY: push
push: build
	docker push $(FULL_IMAGE)
	docker push $(REPO):latest

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