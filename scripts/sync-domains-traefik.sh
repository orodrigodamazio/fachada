#!/bin/bash
# Reconciliador de routers Traefik por domínio próprio VERIFICADO (Cloudflare for SaaS).
# Solução aprovada por auditoria tripla (2026-05-20): router Host() específico (sem priority,
# ganha por len(rule), nunca empata com priority=1 do n8n/evolution). NUNCA catch-all.
#
# Reconcilia: ADICIONA domínios verificados faltantes + REMOVE routers órfãos (desverificados).
# Idempotente. flock contra concorrência. Resolve DRIFT rodando pós-deploy também.
#
# Uso: ./sync-domains-traefik.sh  (cron OU pós-deploy OU manual)
set -euo pipefail

exec 9>/tmp/fachada-sync-domains.lock
flock -n 9 || { echo "[$(date -Iseconds)] outra execução em andamento, saindo"; exit 0; }

SERVICE="fachada_app"
PG=$(docker ps -qf name=postgres_postgres)
[ -n "$PG" ] || { echo "[$(date -Iseconds)] postgres não encontrado"; exit 1; }

# domínios próprios verificados (whitelist canônica)
mapfile -t DOMS < <(docker exec "$PG" psql -U fachada -d fachada_prod -t -A -c \
  "SELECT \"dominioProprio\" FROM \"Site\" WHERE \"dominioStatus\"='VERIFICADO' AND \"dominioProprio\" IS NOT NULL AND ativo=true")

# labels atuais (nomes dos routers dom-*)
CURRENT_JSON=$(docker service inspect "$SERVICE" --format '{{json .Spec.Labels}}')
mapfile -t CURRENT_ROUTERS < <(echo "$CURRENT_JSON" | python3 -c "
import json,sys,re
d=json.load(sys.stdin)
seen=set()
for k in d:
  m=re.match(r'traefik\.http\.routers\.(dom-[a-z0-9-]+)\.', k)
  if m: seen.add(m.group(1))
print('\n'.join(sorted(seen)))
")

san() { echo "$1" | tr '.' '_'; }   # ponto -> underscore (evita colisão a.b vs a-b)

# desejado: set de routers que DEVEM existir
declare -A DESEJADO=()
for dom in "${DOMS[@]}"; do
  [ -n "$dom" ] || continue
  DESEJADO["dom-$(san "$dom")"]="$dom"
done

ARGS=()

# ADD: domínios verificados sem router
for rname in "${!DESEJADO[@]}"; do
  dom="${DESEJADO[$rname]}"
  if ! printf '%s\n' "${CURRENT_ROUTERS[@]}" | grep -qx "$rname"; then
    echo "[$(date -Iseconds)] + router $rname ($dom)"
    ARGS+=(--label-add "traefik.http.routers.${rname}.rule=Host(\`${dom}\`)")
    ARGS+=(--label-add "traefik.http.routers.${rname}.entrypoints=websecure")
    ARGS+=(--label-add "traefik.http.routers.${rname}.tls=true")
    ARGS+=(--label-add "traefik.http.routers.${rname}.service=fachada-app")
  fi
done

# REMOVE: routers órfãos (existem mas domínio não está mais verificado)
for rname in "${CURRENT_ROUTERS[@]}"; do
  [ -n "$rname" ] || continue
  if [ -z "${DESEJADO[$rname]+x}" ]; then
    echo "[$(date -Iseconds)] - router órfão $rname"
    ARGS+=(--label-rm "traefik.http.routers.${rname}.rule")
    ARGS+=(--label-rm "traefik.http.routers.${rname}.entrypoints")
    ARGS+=(--label-rm "traefik.http.routers.${rname}.tls")
    ARGS+=(--label-rm "traefik.http.routers.${rname}.service")
  fi
done

if [ ${#ARGS[@]} -gt 0 ]; then
  echo "[$(date -Iseconds)] aplicando ${#ARGS[@]} mudanças de label"
  docker service update "${ARGS[@]}" "$SERVICE" >/dev/null
  echo "[$(date -Iseconds)] reconciliado: ${#DESEJADO[@]} domínio(s) verificado(s)"
else
  echo "[$(date -Iseconds)] em sincronia (${#DESEJADO[@]} domínio(s), nada a fazer)"
fi
