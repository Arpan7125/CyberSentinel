#!/usr/bin/env bash
# Render build step. Runs on every deploy, before the start command.
#
# `set -o errexit` matters: without it a failed migration would still produce a
# "successful" deploy that then serves 500s against a half-migrated schema.
set -o errexit
set -o pipefail
set -o nounset

echo "──> Installing dependencies"
pip install --upgrade pip
pip install -r requirements.txt

echo "──> Collecting static files"
python manage.py collectstatic --no-input

echo "──> Applying database migrations"
python manage.py migrate --no-input
python manage.py shell -c "from api.models import OAuthProvider; OAuthProvider.objects.get_or_create(name='Gmail', defaults={'category':'Email', 'description':'Official Google Gmail API Integration', 'default_scopes':'openid,email,https://www.googleapis.com/auth/gmail.readonly'})"

echo "──> Seeding public content"
# Idempotent: updates the editorial rows in place rather than duplicating them,
# so running on every deploy is safe. Writes content only — never users, scans
# or any other record of something that supposedly happened.
python manage.py seed_content

# Training takes a few seconds and writes a cached model to disk. Doing it here
# rather than lazily on the first request means the first user to scan anything
# does not pay for it, and every worker loads an identical model.
echo "──> Warming the phishing model cache"
python -c "import django, os; os.environ.setdefault('DJANGO_SETTINGS_MODULE','cybersentinel_backend.settings'); django.setup(); from api.ml_classifier import classifier; print('model ready:', classifier.metrics)"

echo "──> Build complete"
