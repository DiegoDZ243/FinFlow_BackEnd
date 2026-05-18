#+#+#+#+## Security Tests

Este directorio contiene pruebas de seguridad automatizadas con `k6` para la API de FinFlow.

### Requisitos

- Backend levantado y accesible (por defecto `http://localhost:3000`).
- Docker Desktop instalado.
- Ejecutar los comandos desde la raiz del proyecto.

### Levantar infraestructura (InfluxDB + Grafana)

```bash
docker compose -f tests/security/docker-compose.yml up -d influxdb grafana
```

Grafana queda disponible en `http://localhost:3001`.

### Ejecutar la suite

```bash
docker compose -f tests/security/docker-compose.yml run --rm k6 run /scripts/tests/security-suite.js
```

Si necesitas cambiar la base URL, usa `API_BASE_URL`:

```bash
docker compose -f tests/security/docker-compose.yml run --rm -e API_BASE_URL=http://host.docker.internal:3000 k6 run /scripts/tests/security-suite.js
```

### JWT expirado

Para validar el caso de token expirado, el test genera un JWT HS256 con `exp` en el pasado. Por defecto intenta usar `JWT_SECRET` (si no lo proporcionas, se omite el check de expiracion).

```bash
docker compose -f tests/security/docker-compose.yml run --rm -e JWT_SECRET=supersecretkeyforjwt k6 run /scripts/tests/security-suite.js
```

### Que valida

- Autenticacion y autorizacion: rutas protegidas sin token, con token malformado, token invalido y acceso a recurso ajeno.
- Validacion de entradas (inyeccion basica): payloads sospechosos en `/api/ahorradores/registrar` y `/api/ahorradores/login`, verificando que no se produzcan `5xx`.
- Robustez ante rafagas: saturacion del endpoint de login con solicitudes rapidas no autenticadas, verificando estabilidad (sin `5xx`).
