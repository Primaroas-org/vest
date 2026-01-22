# Vest Backend API

Backend infrastructure for **Vest** - A fractional real estate investment platform for Mongolia.

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL via Supabase
- **Currency**: MNT (Mongolian Tögrög) handled as NUMERIC to avoid floating-point errors
- **Authentication**: Supabase Auth with JWT
- **Authorization**: Row Level Security (RLS) policies

## Project Structure

```
vest/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── controllers/
│   │   ├── investment.controller.ts   # Investment logic
│   │   ├── portfolio.controller.ts    # Portfolio aggregation
│   │   └── admin.controller.ts        # Admin operations
│   ├── middleware/
│   │   └── auth.ts              # Authentication & authorization
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── utils/
│   │   ├── numeric.ts           # MNT currency operations
│   │   └── kyc.ts               # e-Mongolia KYC mock
│   └── server.ts                # Express app & routes
├── migrations/
│   └── 001_stored_procedures.sql # Database functions
├── schema.sql                   # Database schema with RLS
├── .env.example                 # Environment variables template
└── package.json                 # Dependencies & scripts
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Supabase project with Auth enabled

### 2. Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials
```

### 3. Database Setup

```bash
# Run the schema migration
npm run db:migrate

# Run the stored procedures migration
npm run db:functions
```

Alternatively, you can run these directly in your Supabase SQL editor:
1. Execute `schema.sql`
2. Execute `migrations/001_stored_procedures.sql`

### 4. Environment Variables

Edit `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
```

### 5. Start Development Server

```bash
npm run server:dev
```

Server will start at `http://localhost:3000`

## API Endpoints

### Public Endpoints

#### Health Check
```
GET /health
```

#### Get All Properties
```
GET /api/properties
```

#### Get Property Details
```
GET /api/properties/:id
```

### Authenticated Endpoints

All authenticated endpoints require `Authorization: Bearer <token>` header.

#### Get Current User
```
GET /api/user/me
```

#### Get Transaction History
```
GET /api/user/transactions?page=1&limit=50
```

### Investment Endpoints (Require KYC)

#### Invest in Property
```
POST /api/invest
Content-Type: application/json

{
  "property_id": "uuid",
  "shares": 10
}
```

**Response**:
```json
{
  "success": true,
  "message": "Successfully invested 5,000,000.00 ₮ in Central Tower",
  "data": {
    "investment": {...},
    "transaction": {...},
    "new_balance": "45000000.00"
  }
}
```

**Error Cases**:
- `INSUFFICIENT_FUNDS`: User doesn't have enough balance
- `SOLD_OUT`: Not enough shares available
- `KYC_NOT_VERIFIED`: KYC verification required

#### Get Portfolio
```
GET /api/portfolio
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "Bat-Erdene",
      "wallet_balance": "45000000.00"
    },
    "investments": [
      {
        "property_id": "uuid",
        "property_name": "Central Tower Apartment 501",
        "shares_owned": 10,
        "total_shares": 1000,
        "ownership_percentage": "1.00",
        "total_invested": "5000000.00",
        "current_value": "5000000.00",
        "total_dividends_received": "150000.00",
        "total_return": "150000.00",
        "total_return_percentage": "3.00"
      }
    ],
    "summary": {
      "total_invested": "5000000.00",
      "total_current_value": "5000000.00",
      "total_dividends_received": "150000.00",
      "total_return": "150000.00",
      "total_return_percentage": "3.00"
    }
  }
}
```

### Admin Endpoints (Require Admin Role)

#### Distribute Rental Income
```
POST /api/admin/distribute-rent
Content-Type: application/json

{
  "property_id": "uuid",
  "total_rent": "10000000.00"
}
```

This distributes rent proportionally to all shareholders based on their ownership percentage.

#### Create Property
```
POST /api/admin/properties
Content-Type: application/json

{
  "name": "Central Tower Apartment 501",
  "description": "Luxury 2-bedroom apartment",
  "address": "Central Tower, Sukhbaatar District",
  "property_type": "apartment",
  "district": "Sukhbaatar",
  "total_valuation": "500000000.00",
  "price_per_share": "500000.00",
  "total_shares": 1000,
  "expected_annual_yield": "8.50",
  "monthly_rent": "3000000.00"
}
```

#### Update Property Status
```
PATCH /api/admin/properties/:id/status
Content-Type: application/json

{
  "status": "active"
}
```

Status options: `draft`, `active`, `fully_funded`, `closed`

#### Add Funds to User Wallet
```
POST /api/admin/users/:userId/add-funds
Content-Type: application/json

{
  "amount": "50000000.00",
  "description": "Initial deposit"
}
```

## Database Schema

### Key Tables

1. **users** - User accounts with KYC status and wallet balance
2. **properties** - Real estate listings with share information
3. **investments** - User investments in properties
4. **transactions** - Complete ledger of all MNT movements

### Row Level Security (RLS)

RLS policies ensure:
- Users can only view their own investments and transactions
- Properties are publicly viewable
- Admin operations require admin role
- All data modifications are audited

## MNT Currency Handling

All currency operations use the `MNT` utility class to prevent floating-point errors:

```typescript
import { MNT } from './utils/numeric';

// Addition
const total = MNT.add("1000.50", "2000.75"); // "3001.25"

// Multiplication
const cost = MNT.multiply("500000.00", 10); // "5000000.00"

// Comparison
if (MNT.gte(userBalance, totalCost)) {
  // Sufficient funds
}

// Formatting
MNT.format("5000000.00"); // "5,000,000.00 ₮"
```

## e-Mongolia KYC Integration

The current implementation includes a **mock** KYC verification function in `src/utils/kyc.ts`.

For production:
1. Obtain API credentials from e-Mongolia
2. Replace mock function with actual API integration
3. Update KYC verification flow

Mock format: e-Mongolia ID should be `XX12345678` (2 letters, 8 digits)

## Atomic Transactions

Critical operations use PostgreSQL stored procedures to ensure atomicity:

1. **process_investment** - Handles investment transactions
   - Locks user and property rows
   - Validates balance and share availability
   - Updates all related tables atomically
   - Rolls back on any error

2. **distribute_rental_income** - Distributes rent to shareholders
   - Locks all shareholder records
   - Calculates proportional dividends
   - Updates wallets and investment records
   - Creates transaction records

3. **add_wallet_funds** - Deposits funds to user wallet
   - Locks user record
   - Updates balance
   - Creates transaction record

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `INSUFFICIENT_FUNDS` - User balance too low
- `SOLD_OUT` - Property shares exhausted
- `KYC_NOT_VERIFIED` - KYC verification required
- `PROPERTY_NOT_ACTIVE` - Property not available for investment

## Security Features

1. **JWT Authentication** - Via Supabase Auth
2. **Row Level Security** - Database-level access control
3. **Helmet.js** - Security headers
4. **CORS** - Configured origin restrictions
5. **Input Validation** - All endpoints validate input
6. **SQL Injection Prevention** - Parameterized queries via Supabase

## Development

### Running Tests
```bash
# TODO: Add test suite
npm test
```

### Building for Production
```bash
npm run server:build
npm run server:start
```

### Linting
```bash
npm run lint
```

## Production Checklist

Before deploying to production:

- [ ] Replace e-Mongolia KYC mock with actual integration
- [ ] Set up proper JWT secret rotation
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and logging (e.g., Sentry)
- [ ] Implement rate limiting
- [ ] Set up backup strategy for PostgreSQL
- [ ] Configure SSL/TLS for all connections
- [ ] Review and test all RLS policies
- [ ] Set up CI/CD pipeline
- [ ] Load testing for concurrent transactions
- [ ] Security audit

## Support

For issues or questions:
- Create an issue in the repository
- Contact the development team

## License

Proprietary - Vest Platform © 2026
