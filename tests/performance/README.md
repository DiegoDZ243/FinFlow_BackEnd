# Performance Tests

Este directorio contiene el stress test con `k6` para la API de FinFlow.

## Requisitos

- Tener el backend levantado en `http://localhost:3000`.
- Tener instalado Docker Desktop.
- Ejecutar los comandos desde esta carpeta: `tests/performance`.

## Levantar la infraestructura

Desde tu terminal en la raíz del proyecto, ejecuta:

```bash
docker compose -f tests/performance/docker-compose.yml up -d influxdb grafana
```

Esto dejará corriendo la base de datos InfluxDB y el panel de Grafana.

### Configurar Grafana (solo la primera vez)

1. Entra en http://localhost:3001.
2. Ve a Connections > Data Sources > Add data source.
3. Selecciona InfluxDB.
4. En URL pon: `http://influxdb:8086`.
5. En Database pon: `k6`.
6. Haz clic en Save & Test.

### Importar un Dashboard

1. Ve a Dashboards > New > Import.
2. Pega el ID `2587` (dashboard estándar de k6) y dale a Load.

## Ejecutar el stress test

Desde la raíz del proyecto:

```bash
docker compose -f tests/performance/docker-compose.yml run --rm k6 run /scripts/stress-test.js
```

Si necesitas cambiar la base URL, usa la variable de entorno `API_BASE_URL`:

```bash
docker compose -f tests/performance/docker-compose.yml run --rm -e API_BASE_URL=http://host.docker.internal:3000 k6 run /scripts/stress-test.js
```

## Qué valida el test

El test simula el flujo completo de la aplicación:

| Fase | Acción | Endpoint | Código esperado |
|------|--------|----------|-----------------|
| `setup()` | Crea 50 usuarios de prueba | `POST /api/ahorradores/registrar` | `201` |
| `setup()` | Login de cada usuario | `POST /api/ahorradores/login` | `200` |
| `default()` | Crear meta financiera | `POST /api/metas` | `201` |
| `default()` | Listar metas del usuario | `GET /api/metas` | `200` |
| `teardown()` | Eliminar cuenta + metas + aportes | `DELETE /api/ahorradores/cuenta` | `200` |

## Flujo de ejecución

1. **`setup()`**: Crea 50 usuarios únicos en la DB (uno por VU) y obtiene sus tokens JWT.
2. **`default()`**: Cada VU usa su propio token para crear y listar metas financieras.
3. **`teardown()`**: Al finalizar, cada cuenta de prueba se elimina junto con todas sus metas y aportes asociados. **No quedan residuos en la base de datos.**

## Limpieza manual

Si el test se interrumpe antes de llegar a `teardown()`, pueden quedar datos residuales. Para limpiarlos manualmente, conecta a PostgreSQL y ejecuta:

```sql
DELETE FROM "aportesMetas" WHERE "metaClave" IN
  (SELECT "clave" FROM "metasFinancieras" WHERE "ahorradorId" IN
    (SELECT "clave" FROM "ahorradoresInteligentes" WHERE "email" LIKE 'stress_%@finflow.test'));
DELETE FROM "metasFinancieras" WHERE "ahorradorId" IN
  (SELECT "clave" FROM "ahorradoresInteligentes" WHERE "email" LIKE 'stress_%@finflow.test');
DELETE FROM "ahorradoresInteligentes" WHERE "email" LIKE 'stress_%@finflow.test';
```

## Notas

- El backend corre en `http://localhost:3000`.
- El frontend corre en `http://localhost:5173`.
- La base de datos usada por el servidor es PostgreSQL.
- Cada VU del test utiliza un usuario diferente, simulando 50 usuarios concurrentes.
- El test crea ~1 meta por iteración por VU (con `sleep(0.1)` entre cada una).
