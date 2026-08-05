FROM python:3.13-slim

# System deps kept minimal — no build toolchain in the runtime image.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install project + optional dev deps in a single layer. `pip install .`
# installs the package declared in pyproject.toml.
COPY pyproject.toml README.md /app/
COPY app /app/app
COPY tests /app/tests

RUN pip install --upgrade pip \
    && pip install "uvicorn[standard]>=0.32,<0.35" "fastapi>=0.115,<0.120" \
       "pydantic>=2.9,<3" "pydantic-settings>=2.5,<3" \
       "httpx>=0.27,<0.30" "python-dateutil>=2.9,<3" \
       "sentry-sdk[fastapi]>=2.17,<3"

EXPOSE 8100

# Compose sets the command explicitly; this default is fine when running
# the image standalone.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100"]
