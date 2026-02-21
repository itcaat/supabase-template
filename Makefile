ENV_FILE := .env.local

# Extract the project ref from NEXT_PUBLIC_SUPABASE_URL (the subdomain before .supabase.co)
PROJECT_REF := $(shell grep '^NEXT_PUBLIC_SUPABASE_URL=' $(ENV_FILE) 2>/dev/null \
	| sed 's|.*https://\([^.]*\)\.supabase\.co.*|\1|')

.PHONY: link db-push db-reset functions-deploy secrets-set dev help

## Link the Supabase CLI to your project (reads project ref from .env.local)
link:
	@if [ -z "$(PROJECT_REF)" ]; then \
		echo "Error: could not extract project ref from $(ENV_FILE)"; \
		echo "Make sure NEXT_PUBLIC_SUPABASE_URL is set."; \
		exit 1; \
	fi
	@echo "Linking to project: $(PROJECT_REF)"
	supabase link --project-ref $(PROJECT_REF)

## Push all migrations to the linked Supabase project
db-push: link
	supabase db push

## Reset the local database and re-apply all migrations
db-reset:
	supabase db reset

## Deploy the send-invite-email Edge Function
functions-deploy: link
	supabase functions deploy send-invite-email

## Set Edge Function secrets from .env.local
secrets-set: link
	@RESEND_API_KEY=$$(grep '^RESEND_API_KEY=' $(ENV_FILE) | cut -d= -f2-); \
	RESEND_FROM_EMAIL=$$(grep '^RESEND_FROM_EMAIL=' $(ENV_FILE) | cut -d= -f2-); \
	RESEND_FROM_NAME=$$(grep '^RESEND_FROM_NAME=' $(ENV_FILE) | cut -d= -f2-); \
	APP_URL=$$(grep '^NEXT_PUBLIC_APP_URL=' $(ENV_FILE) | cut -d= -f2-); \
	supabase secrets set \
		RESEND_API_KEY="$$RESEND_API_KEY" \
		FROM_EMAIL="$$RESEND_FROM_EMAIL" \
		FROM_NAME="$$RESEND_FROM_NAME" \
		APP_URL="$$APP_URL"

## Start Next.js dev server
dev:
	npm run dev

## Show this help
help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@grep -E '^##' Makefile | sed 's/^## /  /' | sed 's/^//'
	@echo ""
