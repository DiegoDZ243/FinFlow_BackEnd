# Pruebas de integracion (Docker + Jest)

## Levantar Postgres de pruebas

```bash
docker compose -f back/tests/integration/docker-compose.yml up -d
```

## Ejecutar suite de integracion

```bash
docker compose -f back/tests/integration/docker-compose.yml up -d
cd back
npm test -- --runInBand
```

Variables requeridas (ejemplo):

- `DB_HOST=localhost`
- `DB_PORT=5433`
- `DB_NAME=finflow_test`
- `DB_USER=postgres`
- `DB_PASS=root`
- `JWT_SECRET=supersecretkeyforjwt`
- `JWT_EXPIRES_IN=1d`
