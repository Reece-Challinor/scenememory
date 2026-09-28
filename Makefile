# ==============================================================================
# SPATIAL PROOF LAB / SceneMemory v1.0.0
# Build, Lint, Test, Docs, and Release Automation Makefile
# ==============================================================================

.PHONY: all dev build lint test docs clean release help

NODE := node
NPM := npm
TSC := ./node_modules/.bin/tsc
VITEST := ./node_modules/.bin/vitest
VITE := ./node_modules/.bin/vite

all: lint test build

help:
	@echo "Available Makefile targets:"
	@echo "  make dev      - Launch Vite local development server on http://localhost:3000"
	@echo "  make lint     - Run TypeScript static type checking"
	@echo "  make test     - Execute Vitest unit test suite (100% test pass enforcement)"
	@echo "  make build    - Compile production build bundle into dist/"
	@echo "  make docs     - Validate markdown documentation structure"
	@echo "  make clean    - Remove build artifacts and coverage reports"
	@echo "  make release  - Execute semantic version release checks"

dev:
	$(VITE) --host 0.0.0.0

lint:
	@echo "==> Running TypeScript static analysis and linting..."
	$(TSC) --noEmit

test:
	@echo "==> Executing unit test suite..."
	$(VITEST) run

build: lint test
	@echo "==> Building production web application bundle..."
	$(TSC) && $(VITE) build

docs:
	@echo "==> Validating documentation directory structure..."
	@test -d docs || (echo "Error: docs/ directory missing" && exit 1)
	@test -f AGENTS.md || (echo "Error: AGENTS.md missing" && exit 1)
	@test -f README.md || (echo "Error: README.md missing" && exit 1)
	@test -f docs/MODELS_AND_INFERENCE.md || (echo "Error: docs/MODELS_AND_INFERENCE.md missing" && exit 1)
	@test -f docs/ARCHITECTURE.md || (echo "Error: docs/ARCHITECTURE.md missing" && exit 1)
	@echo "All documentation files validated successfully."

clean:
	@echo "==> Cleaning dist and build caches..."
	rm -rf dist node_modules/.vite

release: lint test docs
	@echo "==> Preparing semantic release v1.0.0..."
	git status
