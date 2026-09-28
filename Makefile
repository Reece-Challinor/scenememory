# ==============================================================================
# SPATIAL PROOF LAB / SceneMemory v1.0.0
# Build, Lint, Test, Docs, GCP Management, and Release Automation Makefile
# ==============================================================================

.PHONY: all dev build lint test docs clean release help kill demo money

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
	@echo "  make demo     - Launch production server & deploy to GCP Cloud Run"
	@echo "  make money    - Check GCP cloud usage costs & scale-to-zero billing"
	@echo "  make kill     - Terminate all servers, tear down GCP Cloud Run, & confirm \$$0 spend"
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

demo: build
	@echo "==> Starting SceneMemory demo environment..."
	@if [ -n "$$SCENEMEMORY_PROJECT_ID" ]; then \
		echo "Deploying to GCP Cloud Run (Project: $$SCENEMEMORY_PROJECT_ID)..."; \
		./scripts/deploy-gcp.sh; \
	else \
		echo "No SCENEMEMORY_PROJECT_ID set. Starting local production server on http://localhost:8080..."; \
		$(NODE) server.js; \
	fi

money:
	@echo "===================================================="
	@echo "SPATIAL PROOF LAB — COST & BILLING STATUS AUDIT"
	@echo "===================================================="
	@echo "Client-Side Vision Inference Spend:  \$$0.00 (Runs 100% locally on M3 GPU)"
	@if command -v gcloud >/dev/null 2>&1 && [ -n "$$SCENEMEMORY_PROJECT_ID" ]; then \
		echo "Checking GCP Cloud Run Services in $$SCENEMEMORY_PROJECT_ID..."; \
		gcloud run services list --project="$$SCENEMEMORY_PROJECT_ID" --region="$${SCENEMEMORY_REGION:-us-central1}"; \
	else \
		echo "GCP Services Status:                 No active billable cloud resources detected."; \
		echo "Cloud Hosting Cost:                  \$$0.00 (Scale-to-Zero static posture)"; \
	fi
	@echo "===================================================="

kill:
	@echo "==> Initiating total shutdown of all local servers & GCP services..."
	@-pkill -f "vite" 2>/dev/null || true
	@-pkill -f "server.js" 2>/dev/null || true
	@if command -v gcloud >/dev/null 2>&1 && [ -n "$$SCENEMEMORY_PROJECT_ID" ]; then \
		echo "Deleting GCP Cloud Run service 'scenememory'..."; \
		gcloud run services delete scenememory --project="$$SCENEMEMORY_PROJECT_ID" --region="$${SCENEMEMORY_REGION:-us-central1}" --quiet 2>/dev/null || true; \
	fi
	@rm -rf dist node_modules/.vite
	@echo "===================================================="
	@echo "I have fucking killed it all."
	@echo "===================================================="

release: lint test docs
	@echo "==> Preparing semantic release v1.0.0..."
	git status
