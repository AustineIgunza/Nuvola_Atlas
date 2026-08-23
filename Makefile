# Three services, three toolchains. These wrap the commands so nobody has to
# remember which directory each one runs from.
#
# `make` is not installed on Windows by default and nobody on this team has
# it there. Every target below is a one-line alias, so the Windows equivalent
# is in the comment beside it — run that from git-bash instead.

.DEFAULT_GOAL := help
.PHONY: help check lint fmt up down db fresh seed hooks

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-8s\033[0m %s\n", $$1, $$2}'

check:  ## Run the six checks (bash scripts/check.sh)
	@bash scripts/check.sh

lint:  ## Run the formatters and linters in check mode
	@cd nuvola-atlas-backend  && vendor/bin/pint --test
	@cd nuvola-atlas-frontend && npm run format:check
	@cd nuvola-atlas-frontend && npm run lint
	@cd nuvola-atlas-ingestion && ruff check . && mypy app

fmt:  ## Rewrite files with the formatters
	@cd nuvola-atlas-backend  && vendor/bin/pint
	@cd nuvola-atlas-frontend && npm run format
	@cd nuvola-atlas-frontend && npm run lint:fix
	@cd nuvola-atlas-ingestion && ruff check --fix .

up:  ## Start the full stack (docker compose up -d)
	@docker compose up -d

down:  ## Stop the stack, keep the volumes
	@docker compose down

db:  ## Start only postgres — what phpunit needs (phpunit.xml pins :5434)
	@docker compose up -d postgres

fresh:  ## Drop, remigrate and reseed the dev database
	@cd nuvola-atlas-backend && php artisan migrate:fresh --seed

seed:  ## Reseed without dropping
	@cd nuvola-atlas-backend && php artisan db:seed

hooks:  ## Install the pre-commit hook
	@git config core.hooksPath .githooks
	@echo "core.hooksPath -> .githooks"
