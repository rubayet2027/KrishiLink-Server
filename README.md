# KrishiLink API Server

🌾 **Farmer's Growth & Connection Platform** - Backend API

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** Firebase Admin SDK
- **Deployment:** Vercel

## Project Structure

```
KrishiLink-Server/
├── config/
│   ├── database.js      # MongoDB connection & indexes
│   └── firebase.js      # Firebase Admin SDK setup
├── controllers/
│   ├── cropController.js      # Crop CRUD operations
│   ├── interestController.js  # Interest management
│   └── userController.js      # User profile operations
├── middleware/
│   ├── auth.js          # Firebase token verification
│   └── errorHandler.js  # Error handling utilities
├── models/
│   ├── Crop.js          # Crop schema & validation
│   └── User.js          # User schema & validation
├── routes/
│   ├── cropRoutes.js    # Crop endpoints
│   ├── interestRoutes.js # Interest endpoints
│   └── userRoutes.js    # User endpoints
├── index.js             # Server entry point
├── package.json
├── vercel.json          # Vercel deployment config
└── .env.example         # Environment variables template
```

## API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Welcome message |
| GET | `/api/health` | Detailed health status |

### Crops
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/crops` | Public | Get all crops (with filters) |
| GET | `/api/crops/categories` | Public | Get categories with counts |
| GET | `/api/crops/my-posts` | Private | Get user's crop listings |
| GET | `/api/crops/:id` | Public* | Get single crop details |
| POST | `/api/crops` | Private | Create new crop listing |
| PUT | `/api/crops/:id` | Private | Update crop (owner only) |
| DELETE | `/api/crops/:id` | Private | Delete crop (owner only) |

*Interests visible only to owner

### Interests
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/interests/my-interests` | Private | Get user's submitted interests |
| GET | `/api/interests/:cropId` | Private | Get crop's interests (owner only) |
| POST | `/api/interests/:cropId` | Private | Submit interest on a crop |
| PATCH | `/api/interests/:cropId/:interestId/accept` | Private | Accept interest (owner only) |
| PATCH | `/api/interests/:cropId/:interestId/reject` | Private | Reject interest (owner only) |
| DELETE | `/api/interests/:cropId/:interestId` | Private | Cancel pending interest |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | Private | Get current user's profile |
| PUT | `/api/users/profile` | Private | Update profile |
| GET | `/api/users/stats` | Private | Get user statistics |
| GET | `/api/users/:uid` | Public | Get public profile |
| DELETE | `/api/users/profile` | Private | Delete account |

## Query Parameters

### GET /api/crops
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| category | string | - | Filter by category |
| status | string | available | Filter by status |
| minPrice | number | - | Minimum price per unit |
| maxPrice | number | - | Maximum price per unit |
| location | string | - | Search by location |
| search | string | - | Search title/description |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | Sort order (asc/desc) |
| page | number | 1 | Page number |
| limit | number | 12 | Items per page |

## Authentication

All private routes require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase_id_token>
```

## Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd KrishiLink-Server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT signing
- Firebase Admin SDK credentials
- `PORT` - Server port (default: 5000)
- `CLIENT_URL` - Frontend URL for CORS

### 4. Firebase Setup
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Add credentials to `.env` file

### 5. Run Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## Deployment to Vercel

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy
```bash
vercel
```

### 3. Set Environment Variables
In Vercel dashboard, add all environment variables from `.env.example`

## Error Codes

| Code | Description |
|------|-------------|
| NO_TOKEN | No authorization token provided |
| INVALID_TOKEN | Token is invalid or malformed |
| TOKEN_EXPIRED | Firebase token has expired |
| UNAUTHORIZED | User not authorized for action |
| VALIDATION_ERROR | Request validation failed |
| CROP_NOT_FOUND | Crop does not exist |
| INTEREST_NOT_FOUND | Interest does not exist |
| USER_NOT_FOUND | User does not exist |
| DUPLICATE_INTEREST | User already has pending interest |
| SELF_INTEREST_NOT_ALLOWED | Cannot interest in own crop |
| CROP_NOT_AVAILABLE | Crop is sold out or expired |
| INSUFFICIENT_QUANTITY | Not enough quantity available |
| INTEREST_ALREADY_PROCESSED | Interest already accepted/rejected |

## Data Models

### Crop
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String, // vegetables, fruits, grains, etc.
  quantity: Number,
  unit: String, // kg, gram, ton, piece, dozen, liter
  pricePerUnit: Number,
  location: String,
  harvestDate: Date,
  imageUrl: String,
  isOrganic: Boolean,
  owner: {
    uid: String,
    email: String,
    name: String,
    photoURL: String
  },
  interests: [Interest],
  status: String, // available, sold_out, expired
  createdAt: Date,
  updatedAt: Date
}
```

### Interest (Embedded in Crop)
```javascript
{
  _id: ObjectId,
  buyerUid: String,
  buyerEmail: String,
  buyerName: String,
  buyerPhoto: String,
  requestedQuantity: Number,
  message: String,
  status: String, // pending, accepted, rejected
  createdAt: Date,
  processedAt: Date
}
```

### User
```javascript
{
  uid: String, // Firebase UID
  email: String,
  name: String,
  photoURL: String,
  phone: String,
  address: {
    division: String,
    district: String,
    upazila: String,
    village: String,
    details: String
  },
  role: String, // farmer, buyer, both
  farmDetails: {
    farmName: String,
    farmSize: Number,
    farmType: String,
    mainCrops: [String]
  },
  isVerified: Boolean,
  rating: { average: Number, count: Number },
  stats: { totalPosts, totalSold, totalPurchased },
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

## Security Features

- ✅ Firebase token verification
- ✅ Ownership-based authorization
- ✅ Duplicate interest prevention
- ✅ Self-interest blocking
- ✅ Atomic quantity updates
- ✅ Input validation
- ✅ CORS configuration
- ✅ Rate condition protection

## License

ISC
