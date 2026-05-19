#!/bin/bash
# Backup diário do fachada_prod pro R2.
# Crontab sugerido: 0 4 * * * /opt/stacks/fachada/scripts/backup-db.sh >> /var/log/fachada-backup.log 2>&1
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/stacks/fachada/.env}"
[ -r "$ENV_FILE" ] || { echo "[$(date -Iseconds)] .env não encontrado em $ENV_FILE"; exit 1; }
set -a; source "$ENV_FILE"; set +a

: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID ausente}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID ausente}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY ausente}"
R2_BUCKET="${R2_BUCKET:-zapzap-media}"
R2_BACKUP_PREFIX="${R2_BACKUP_PREFIX:-backups/fachada}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

PG_CONTAINER=$(docker ps -qf name=postgres_postgres)
[ -n "$PG_CONTAINER" ] || { echo "[$(date -Iseconds)] postgres_postgres não está rodando"; exit 1; }

STAMP=$(date +%Y%m%d-%H%M%S)
TMP=$(mktemp --suffix=.sql.gz)
trap 'rm -f "$TMP"' EXIT

echo "[$(date -Iseconds)] iniciando pg_dump fachada_prod"
docker exec "$PG_CONTAINER" pg_dump -U fachada -d fachada_prod | gzip > "$TMP"
SIZE=$(stat -c%s "$TMP")
[ "$SIZE" -gt 1024 ] || { echo "[$(date -Iseconds)] dump suspeito (${SIZE}B)"; exit 1; }

KEY="${R2_BACKUP_PREFIX}/fachada_prod-${STAMP}.sql.gz"
echo "[$(date -Iseconds)] uploading $SIZE bytes -> r2://${R2_BUCKET}/${KEY}"

docker run --rm -i \
  -e AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  -e AWS_DEFAULT_REGION=auto \
  -v "$TMP:/tmp/dump.sql.gz:ro" \
  amazon/aws-cli:latest \
  s3 cp /tmp/dump.sql.gz "s3://${R2_BUCKET}/${KEY}" \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --no-progress

CUTOFF=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
echo "[$(date -Iseconds)] limpeza: removendo backups antes de $CUTOFF"

docker run --rm \
  -e AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  -e AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  -e AWS_DEFAULT_REGION=auto \
  amazon/aws-cli:latest \
  s3 ls "s3://${R2_BUCKET}/${R2_BACKUP_PREFIX}/" \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  | awk '{print $4}' | grep -E "fachada_prod-[0-9]{8}-" | while read -r name; do
      date_part=$(echo "$name" | sed -E 's/.*fachada_prod-([0-9]{8})-.*/\1/')
      if [ "$date_part" -lt "$CUTOFF" ]; then
        echo "  delete: $name"
        docker run --rm \
          -e AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
          -e AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
          -e AWS_DEFAULT_REGION=auto \
          amazon/aws-cli:latest \
          s3 rm "s3://${R2_BUCKET}/${R2_BACKUP_PREFIX}/${name}" \
          --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
          --quiet || true
      fi
    done

echo "[$(date -Iseconds)] backup OK"
