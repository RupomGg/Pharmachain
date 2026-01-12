# PharmaChain Backend Indexer API

Enterprise-grade off-chain indexer API for PharmaChain supply chain management.

## Features

- ✅ Real-time blockchain event synchronization
- ✅ Missed event recovery on startup
- ✅ Supply chain traceability (upstream/downstream lineage)
- ✅ Cascading recall system with notifications
- ✅ Rate limiting and security
- ✅ Metadata validation (magic bytes)
- ✅ Dead Letter Queue for reliability
- ✅ Transfer limbo handling

## Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+
- Running Hardhat node with deployed PharmaChain contract

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/pharmachain
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

## Running

### Development

```bash
# Terminal 1: Start API server
npm start

# Terminal 2: Start worker (event processor)
npm run listener
```

### Production

```bash
# Use PM2 for process management
pm2 start src/app.js --name pharmachain-api
pm2 start src/worker.js --name pharmachain-worker
```

## API Endpoints

### Batches

- `GET /api/batches/:id` - Get batch details
- `GET /api/batches/owner/:address` - Get batches by owner
- `GET /api/batches` - Get all batches (paginated)

### Traceability

- `GET /api/trace/:batchId` - Full lineage (upstream + downstream)
- `GET /api/trace/:batchId/upstream` - Upstream lineage only
- `GET /api/trace/:batchId/downstream` - Downstream distribution only

### Metadata

- `POST /api/metadata/validate` - Validate file before IPFS upload

### Events

- `GET /api/events` - Get event logs (paginated)
- `GET /api/events/:batchId` - Get events for specific batch

## Architecture

```
┌─────────────────┐
│  Blockchain     │
│  (PharmaChain)  │
└────────┬────────┘
         │ Events
         ▼
┌─────────────────┐     ┌──────────────┐
│ Event Listener  │────▶│  BullMQ      │
│ (worker.js)     │     │  (Queue)     │
└────────┬────────┘     └──────┬───────┘
         │                     │
         ▼                     ▼
┌─────────────────┐     ┌──────────────┐
│  Event          │────▶│  Dead Letter │
│  Processor      │     │  Queue (DLQ) │
└────────┬────────┘     └──────────────┘
         │
         ▼
┌─────────────────┐
│   MongoDB       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  REST API       │
│  (app.js)       │
└─────────────────┘
```

## Testing

### Test Metadata Validation

```bash
curl -X POST http://localhost:3000/api/metadata/validate \
  -F "file=@test.pdf" \
  -F "docType=pdf"
```

### Test Traceability

```bash
curl http://localhost:3000/api/trace/1
```

### Test Rate Limiting

```bash
# Send 20 requests quickly
for i in {1..20}; do
  curl http://localhost:3000/api/trace/1
done
```

## Monitoring

### Queue Statistics

```javascript
import { getQueueStats } from './src/config/redis.js';
const stats = await getQueueStats();
console.log(stats);
```

### Database Indexes

```javascript
// Check indexes
db.batches.getIndexes()
db.eventlogs.getIndexes()
```

## Security

- Rate limiting on all endpoints
- Magic bytes validation for file uploads
- Executable file detection
- 5MB file size limit
- Dead Letter Queue for failed events

## Troubleshooting

### "Cannot connect to MongoDB"

```bash
# Start MongoDB
mongod --dbpath /path/to/data
```

### "Cannot connect to Redis"

```bash
# Start Redis
redis-server
```

### "No events being processed"

Check that:
1. Hardhat node is running
2. Contract is deployed
3. Worker process is running
4. CONTRACT_ADDRESS in .env is correct

## License

ISC
