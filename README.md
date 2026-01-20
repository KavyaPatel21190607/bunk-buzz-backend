# 🎓 Bunk Buzz Backend API

Production-ready RESTful API for Bunk Buzz - Student Attendance Tracking & Bunk Prediction Platform.

## 🚀 Features

- ✅ **Complete Authentication System**
  - Email & Password authentication
  - Google OAuth 2.0 integration
  - JWT-based authorization (Access & Refresh tokens)
  - Email verification with token expiry
  - Secure password hashing with bcrypt

- 📚 **Subject Management**
  - CRUD operations for subjects
  - Track total and attended lectures
  - Calculate attendance percentage
  - Color-coded subjects
  - Subject-wise statistics

- 📅 **Timetable Management**
  - Day-wise class scheduling
  - Time conflict prevention
  - Today's timetable endpoint
  - Lecture type classification

- ✅ **Attendance Tracking**
  - Daily attendance marking
  - Attendance history
  - Real-time statistics
  - Date-range filtering
  - Subject-wise attendance

- 🎯 **Smart Bunk Predictor**
  - Predict if bunking is safe
  - Calculate safe bunk count
  - Simulate multiple bunks
  - Recovery class calculation
  - Bulk predictions for all subjects

- 👤 **Profile Management**
  - Update user information
  - Change password
  - Account deactivation
  - Semester date tracking

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT, Google OAuth 2.0, bcrypt
- **Email:** Nodemailer with Gmail SMTP
- **Validation:** Express Validator
- **Security:** Helmet, CORS, Rate Limiting, Mongo Sanitize

## 📁 Project Structure

```
backend/
├── config/
│   ├── database.js          # MongoDB connection
│   └── googleOAuth.js       # Google OAuth configuration
├── models/
│   ├── User.js              # User model
│   ├── PendingUser.js       # Pending verification users
│   ├── Subject.js           # Subject model
│   ├── Timetable.js         # Timetable model
│   └── DailyAttendance.js   # Attendance records
├── controllers/
│   ├── authController.js
│   ├── subjectController.js
│   ├── timetableController.js
│   ├── attendanceController.js
│   ├── bunkPredictorController.js
│   └── profileController.js
├── routes/
│   ├── authRoutes.js
│   ├── subjectRoutes.js
│   ├── timetableRoutes.js
│   ├── attendanceRoutes.js
│   ├── bunkPredictorRoutes.js
│   └── profileRoutes.js
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── errorHandler.js      # Error handling
│   ├── validation.js        # Input validation
│   └── rateLimiter.js       # Rate limiting
├── utils/
│   ├── tokenUtils.js        # JWT utilities
│   ├── emailService.js      # Email sending
│   └── tokenGenerator.js    # Token generation
├── app.js                   # Express app setup
├── server.js                # Server entry point
├── package.json
├── .env.example
└── README.md
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Gmail account with App Password enabled

### 1. Clone and Install

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bunk-buzz

# JWT Secrets (generate using crypto)
JWT_ACCESS_SECRET=your_generated_secret
JWT_REFRESH_SECRET=your_generated_secret

# Gmail (use App Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Generate JWT Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Get Gmail App Password:**
1. Go to Google Account Settings
2. Security → 2-Step Verification → App Passwords
3. Generate password for "Mail"
4. Use this password in `EMAIL_PASSWORD`

### 3. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will start at: `http://localhost:5000`

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/verify-email` | Verify email with token | No |
| POST | `/api/auth/login` | Login with email/password | No |
| POST | `/api/auth/google` | Google OAuth login | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/resend-verification` | Resend verification email | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| GET | `/api/auth/me` | Get current user | Yes |

### Subjects

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/subjects` | Get all subjects | Yes |
| GET | `/api/subjects/:id` | Get subject by ID | Yes |
| POST | `/api/subjects` | Create new subject | Yes |
| PUT | `/api/subjects/:id` | Update subject | Yes |
| DELETE | `/api/subjects/:id` | Delete subject | Yes |
| GET | `/api/subjects/:id/stats` | Get subject statistics | Yes |

### Timetable

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/timetable` | Get all timetable entries | Yes |
| GET | `/api/timetable/today` | Get today's timetable | Yes |
| GET | `/api/timetable/:id` | Get timetable entry | Yes |
| POST | `/api/timetable` | Create timetable entry | Yes |
| PUT | `/api/timetable/:id` | Update timetable entry | Yes |
| DELETE | `/api/timetable/:id` | Delete timetable entry | Yes |

### Attendance

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/attendance` | Get attendance records | Yes |
| GET | `/api/attendance/stats` | Get attendance statistics | Yes |
| GET | `/api/attendance/date/:date` | Get attendance by date | Yes |
| GET | `/api/attendance/subject/:subjectId/history` | Get subject history | Yes |
| POST | `/api/attendance` | Mark attendance | Yes |
| PUT | `/api/attendance/:id` | Update attendance | Yes |
| DELETE | `/api/attendance/:id` | Delete attendance | Yes |

### Bunk Predictor

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/bunk-predictor/predict` | Predict single subject | Yes |
| GET | `/api/bunk-predictor/bulk-predict` | Predict all subjects | Yes |
| POST | `/api/bunk-predictor/simulate` | Simulate multiple bunks | Yes |

### Profile

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/profile` | Get user profile | Yes |
| PUT | `/api/profile` | Update profile | Yes |
| PUT | `/api/profile/password` | Change password | Yes |
| DELETE | `/api/profile` | Deactivate account | Yes |

## 🔐 Authentication Flow

### Email & Password Signup

1. User submits signup form
2. Backend validates input
3. Creates `PendingUser` with verification token
4. Sends verification email with token link
5. User clicks link → token verified
6. `PendingUser` moved to `User` collection
7. Email marked as verified
8. JWT tokens generated
9. User can now login

### Login

1. User submits email & password
2. Backend verifies email exists and is verified
3. Password hash compared
4. JWT access & refresh tokens generated
5. Tokens returned to client

### Google OAuth

1. User clicks "Login with Google"
2. Frontend gets Google ID token
3. Token sent to backend
4. Backend verifies with Google
5. User created/found in database
6. JWT tokens generated
7. User logged in

## 🔒 Security Features

- ✅ Password hashing with bcrypt (10 salt rounds)
- ✅ JWT-based authentication
- ✅ Rate limiting on authentication routes
- ✅ Email verification required for login
- ✅ Helmet.js security headers
- ✅ CORS protection
- ✅ MongoDB injection prevention
- ✅ Input validation and sanitization
- ✅ Secure token expiry mechanisms

## 📧 Email Templates

The backend sends professional HTML emails for:

- **Verification Email** - Welcome + verification link
- **Welcome Email** - Sent after successful verification
- **Password Reset** - Password reset link (ready for implementation)

## 🧪 Testing

### Health Check

```bash
curl http://localhost:5000/health
```

### Test Signup

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "college": "Test College",
    "password": "Test123"
  }'
```

## 🚀 Deployment

### Environment Variables

Ensure all environment variables are set in production:

```env
NODE_ENV=production
MONGODB_URI=<your_mongodb_atlas_uri>
FRONTEND_URL=<your_frontend_domain>
# ... other variables
```

### Recommended Platforms

- **Backend:** Railway, Render, Heroku, AWS, DigitalOcean
- **Database:** MongoDB Atlas
- **Email:** Gmail with App Password or SendGrid

## 📝 API Response Format

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## 🤝 Contributing

This is a production-ready backend system. Feel free to:

- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 📄 License

MIT License

## 👨‍💻 Author

Bunk Buzz Team

---

**Made with ❤️ for students who want to track attendance smartly!**
