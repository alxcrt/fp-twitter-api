#!/usr/bin/env bash
set -euo pipefail
docker build --pull -t dependency-check .
docker build --target build -t dependency-check-contracts .
docker network create --internal twitter-ci
cleanup() { docker logs dependency-check || true; docker rm -f dependency-check twitter-ci-db || true; docker network rm twitter-ci || true; }
trap cleanup EXIT
docker run -d --name twitter-ci-db --network twitter-ci --network-alias twitter-ci-db --memory 512m --cpus 1 --tmpfs /var/lib/postgresql/data:rw,size=256m -e POSTGRES_PASSWORD=isolated-fixture-only -e POSTGRES_DB=twitter -e POSTGRES_USER=twitter postgres:17-alpine
for i in $(seq 1 40); do if docker exec twitter-ci-db pg_isready -U twitter -d twitter; then break; fi; sleep 1; done
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > /tmp/twitter-schema.sql
docker exec -i twitter-ci-db psql -v ON_ERROR_STOP=1 -U twitter -d twitter < /tmp/twitter-schema.sql
docker run -d --name dependency-check --network twitter-ci --read-only --cap-drop ALL --security-opt no-new-privileges --memory 512m --cpus 1 -e DATABASE_URL=postgresql://twitter:isolated-fixture-only@twitter-ci-db:5432/twitter?sslmode=disable -e SESSION_SECRET="$SESSION_SECRET" dependency-check
for i in $(seq 1 30); do
 if docker exec dependency-check node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then break; fi
 sleep 1
done
docker run --rm --network container:dependency-check --read-only --cap-drop ALL --security-opt no-new-privileges --user 1000:1000 --memory 128m --cpus 0.5 --pids-limit 64 -e ISOLATED_TEST_DATABASE=1 -e TEST_BASE_URL=http://127.0.0.1:3000 -e SESSION_SECRET="$SESSION_SECRET" dependency-check-contracts node tests/http-contract.mjs
