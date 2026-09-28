FROM alpine:3.23

RUN apk update && apk add --no-cache \
    python3 \
    py3-pip\
    curl

WORKDIR /app

COPY apps/ai/requirements.txt /app/requirements.txt

RUN python3 -m venv /app/.venv && \
    /app/.venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/.venv/bin/pip install --no-cache-dir -r /app/requirements.txt

COPY /apps/ai/ /app/apps/ai/

EXPOSE 8000

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "apps.backend.ai.server:app", "--host", "0.0.0.0", "--port", "8000"]
