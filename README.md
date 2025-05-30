
---

# Access Key Management System

This project includes two NestJS microservices (**L1** and **L2**) that work together to manage access keys using Redis as both a database and message queue.

## 🧩 Architecture Overview


### 🔹 **L1 Service**
- Exposes **admin APIs** to:
  - Create, update, and delete access keys and list all keys.
- Exposes **user APIs** to:
  - View access key details.
  - Disable the access key manually.
- Uses Redis (`6379`) as both:
  - **Primary DB**
  - **Message Queue** (MQ)
- Publishes key change events to a Redis stream.

### 🔸 **L2 Service**
- Subscribes to key change events on the shared Redis stream (`6379`).
- Maintains its own Redis DB (`6380`) for a synced view of access keys.
- Exposes **a token info API**:
  - Accepts a key via the `Authorization` header (Bearer token).
  - Validates the key:
    - Must exist.
    - Must be enabled.
    - Must not be expired.
    - Must not exceed rate limit.
  - Returns key/token metadata.


## 🚀 Running with Docker

### Prerequisites

* [Docker](https://www.docker.com/get-started)
* [Docker Compose](https://docs.docker.com/compose/)

### Steps

1. Ensure you're in the root directory (where `docker-compose.yml` is).
2. Run:

```bash
docker-compose up --build
```

This will:

* Build both L1 and L2 services.
* Start two Redis instances:

  * Port `6379`: Shared DB and MQ.
  * Port `6380`: Private DB for L2.
* L1 available at: [http://localhost:3000](http://localhost:3000)
* L2 available at: [http://localhost:3001](http://localhost:3001)

To stop:

```bash
docker-compose down
```

### 📘 Swagger API Docs

* **L1 Docs**: [http://localhost:3000/docs](http://localhost:3000/docs)
* **L2 Docs**: [http://localhost:3001/docs](http://localhost:3001/docs)

Use Swagger UI to explore and test APIs interactively.

## 🧪 Running Locally (Without Docker)

### Prerequisites

* Node.js `v20.11.1`
* Redis running on ports `6379` and `6380`

### L1 Service

1. Navigate to L1 directory:

```bash
cd l1-access-key-management-service
```

2. Add `.env` file:

```
DB_HOST=localhost
DB_PORT=6379
DB_NUMBER=0

MQ_HOST=localhost
MQ_PORT=6379
MQ_NUMBER=0

PORT=3000
```

3. Install dependencies and run:

```bash
npm install
npm run start:dev
```

### L2 Service

1. Navigate to L2 directory:

```bash
cd l2-token-info-service
```

2. Add `.env` file:

```
DB_HOST=localhost
DB_PORT=6380
DB_NUMBER=0

MQ_HOST=localhost
MQ_PORT=6379
MQ_NUMBER=0

PORT=3001
```

3. Install dependencies and run:

```bash
npm install
npm run start:dev
```

## 📝 Notes

* Ensure Redis servers are running on `6379` and `6380`.
* L2 will always reflect changes pushed to Redis stream by L1.
* Swagger docs are available at `/docs` on both services.
* You can use `curl`, Swagger UI, or Postman to test.

---
