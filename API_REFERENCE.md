# API Reference - Bachelor Room Expense Manager

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer {JWT_TOKEN}
```

---

## 🔐 Authentication Endpoints

### Register User
```
POST /auth/register
Body: {
  "name": "John Doe",
  "phone": "9876543210",
  "password": "pass123",
  "roomCode": "R1"
}
Response: { "ok": true, "message": "Registered, pending admin approval" }
```

### Login
```
POST /auth/login
Body: {
  "phone": "9876543210",
  "password": "pass123"
}
Response: {
  "token": "eyJ0eXAi...",
  "user": {
    "id": "64abcd1234",
    "name": "John Doe",
    "phone": "9876543210",
    "role": "user"
  }
}
```

### Get Current User
```
GET /auth/me
Headers: Authorization: Bearer {token}
Response: { "user": { ... } }
```

---

## 💰 Expense Endpoints

### Add Expense
```
POST /expenses
Headers: 
  - Authorization: Bearer {token}
  - Content-Type: multipart/form-data
Body:
  - amount: 500
  - category: "Food"
  - notes: "Lunch with friends"
  - date: "2024-03-04" (optional, defaults to today)
  - image: <file> (optional)
Response: { "ok": true, "expense": { ... } }
```

### Get Recent Expenses (Last 5)
```
GET /expenses/recent
Headers: Authorization: Bearer {token}
Response: { "expenses": [ ... ] }
```

### Get All User Expenses (Filterable)
```
GET /expenses?start=2024-03-01&end=2024-03-31&category=Food
Headers: Authorization: Bearer {token}
Query Params:
  - start: yyyy-mm-dd (optional)
  - end: yyyy-mm-dd (optional)
  - category: string (optional)
Response: { "items": [ ... ] }
```

### Edit Expense (Same Day Only)
```
PUT /expenses/{id}
Headers: Authorization: Bearer {token}
Body: { "amount": 600, "category": "Food", "notes": "Updated" }
Response: { "expense": { ... } }
```

### Delete Expense (Same Day Only)
```
DELETE /expenses/{id}
Headers: Authorization: Bearer {token}
Response: { "ok": true }
```

### Get Pending Expenses (Admin Only)
```
GET /expenses/admin/pending
Headers: Authorization: Bearer {token}
Response: { "expenses": [ ... ] }
```

### Approve/Reject Expense (Admin Only)
```
POST /expenses/{id}/approve
Headers: Authorization: Bearer {token}
Body: {
  "approved": true,
  "comment": "Looks good"
}
Response: { "ok": true, "expense": { ... } }
```

---

## 👥 Admin Endpoints

### Get Pending User Approvals
```
GET /admin/pending-approvals
Headers: Authorization: Bearer {token}
Response: { "users": [ ... ] }
```

### Approve User Registration (Admin Only)
```
POST /admin/approve-user/{userId}
Headers: Authorization: Bearer {token}
Response: { "ok": true }
```

### Get Room Members
```
GET /admin/room-members/{roomCode}
Headers: Authorization: Bearer {token}
Response: { "users": [ ... ] }
```

### Get Room Expenses
```
GET /admin/room-expenses/{roomCode}?month=3&year=2024
Headers: Authorization: Bearer {token}
Query Params:
  - month: 1-12 (optional)
  - year: yyyy (optional)
Response: { "expenses": [ ... ] }
```

### Get Monthly Record
```
GET /admin/monthly/{roomCode}?month=3&year=2024
Headers: Authorization: Bearer {token}
Response: { "record": { ... } }
```

### Create/Update Monthly Costs
```
POST /admin/monthly
Headers: Authorization: Bearer {token}
Body: {
  "roomCode": "R1",
  "month": 3,
  "year": 2024,
  "rent": 10000,
  "electricity": 1500,
  "water": 500,
  "internet": 800,
  "maid": 5000,
  "others": 0
}
Response: { "record": { ..., "total": 17800 } }
```

### Lock Month (Prevent Further Changes)
```
POST /admin/monthly/{monthId}/lock
Headers: Authorization: Bearer {token}
Response: { "ok": true }
```

### Get Calculations & Balances
```
GET /admin/calculations/{roomCode}?month=3&year=2024
Headers: Authorization: Bearer {token}
Response: {
  "userBalances": [
    {
      "user": { "_id": "...", "name": "John", "phone": "..." },
      "userExpenses": 5000,
      "userShare": 5000,
      "balance": 0
    }
  ],
  "totalFixed": 15000,
  "monthlyRecord": { ... }
}
```

### Create Settlement
```
POST /admin/settlement
Headers: Authorization: Bearer {token}
Body: {
  "from": "userId1",
  "to": "userId2",
  "amount": 5000
}
Response: { "settlement": { ... } }
```

### Get Settlements for Room
```
GET /admin/settlements/{roomCode}
Headers: Authorization: Bearer {token}
Response: { "settlements": [ ... ] }
```

### Confirm Settlement (Admin Only)
```
POST /admin/settlement/{settlementId}/confirm
Headers: Authorization: Bearer {token}
Response: { "ok": true }
```

---

## 📊 Data Models

### User Schema
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (optional),
  phone: String (unique, indexed),
  passwordHash: String,
  role: "user" | "admin",
  roomCode: String,
  approved: Boolean,
  devices: [
    {
      ip: String,
      ua: String,
      lastLogin: Date
    }
  ],
  createdAt: Date
}
```

### Expense Schema
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User'),
  amount: Number,
  category: String,
  date: Date,
  notes: String,
  image: String (file path),
  approved: Boolean,
  approverComment: String,
  createdAt: Date
}
```

### Monthly Schema
```javascript
{
  _id: ObjectId,
  roomCode: String,
  month: Number (1-12),
  year: Number,
  rent: Number,
  electricity: Number,
  water: Number,
  internet: Number,
  maid: Number,
  others: Number,
  total: Number (auto-calculated),
  locked: Boolean,
  createdAt: Date
}
```

### Settlement Schema
```javascript
{
  _id: ObjectId,
  from: ObjectId (ref: 'User'),
  to: ObjectId (ref: 'User'),
  amount: Number,
  proof: String (file path, optional),
  confirmed: Boolean,
  partial: Boolean,
  createdAt: Date
}
```

---

## 🔄 Real-Time Events (Socket.IO)

### Client-Side

#### Join Room
```javascript
socket.emit('joinRoom', 'R1'); // roomCode
```

### Server-Side (Broadcast)

#### Expense Added
```javascript
io.to(roomCode).emit('expenseAdded', expenseObject);
```

#### Expense Approved
```javascript
io.to(roomCode).emit('expenseApproved', { 
  expense, 
  approved: true/false 
});
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{ "message": "Invalid input" }
```

### 401 Unauthorized
```json
{ "message": "Unauthorized" }
```

### 403 Forbidden
```json
{ "message": "Forbidden - admin only" }
```

### 404 Not Found
```json
{ "message": "Not found" }
```

### 500 Server Error
```json
{ "message": "Server error" }
```

---

## 📋 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

---

## 🧪 Testing with cURL

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"9000000000","password":"test123","roomCode":"R1"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"1111111111","password":"admin123"}'
```

### Add Expense
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"category":"Food","notes":"Lunch","date":"2024-03-04"}'
```

### With File Upload
```bash
curl -X POST http://localhost:5000/api/expenses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "amount=500" \
  -F "category=Food" \
  -F "notes=Lunch" \
  -F "image=@/path/to/bill.jpg"
```

---

## 🔑 JWT Token Structure

```javascript
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "id": "userId",
  "role": "user|admin",
  "iat": 1234567890,
  "exp": 1234654290
}
```

---

## ⚙️ Configuration

### Environment Variables (.env)
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/bachelorroom
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

---

## 📱 Frontend API Usage

### Example with Axios
```javascript
import api from './api';

// Login
const response = await api.post('/auth/login', {
  phone: '1111111111',
  password: 'admin123'
});

const token = response.data.token;
localStorage.setItem('token', token);

// Request with token (auto-injected by interceptor)
const expenses = await api.get('/expenses/recent');
console.log(expenses.data.expenses);
```

---

## 🚀 Ready for Submission!

All endpoints are fully functional and tested. The API supports:
- ✅ User registration and authentication
- ✅ Expense management (CRUD)
- ✅ Admin approvals (users & expenses)
- ✅ Monthly cost tracking
- ✅ Balance calculations
- ✅ Settlement management
- ✅ Real-time updates
- ✅ Role-based access control
- ✅ File uploads
- ✅ Error handling
