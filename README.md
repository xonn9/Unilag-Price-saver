# 🛒 UNILAG Price Saver

<div align="center">

**Crowdsource, Compare, Save** — Empowering UNILAG students with real-time price intelligence across campus

[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Rust](https://img.shields.io/badge/Rust-1.70+-000000?style=flat-square&logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

*A high-performance, full-stack price comparison platform built for the University of Lagos community*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Frontend Features](#-frontend-features)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**UNILAG Price Saver** is a comprehensive price intelligence platform designed specifically for the University of Lagos community. It enables students to crowdsource, compare, and track prices of everyday items across campus stores, helping them make informed purchasing decisions and save money.

### The Problem We Solve

- 📍 **No Transparent Pricing**: Students often don't know where to find the best deals
- 💰 **Overpaying**: Lack of price visibility leads to unnecessary spending
- 🤝 **No Community Intelligence**: No centralized platform for sharing price information
- 📊 **Manual Tracking**: Tedious and unreliable price comparison methods

### Our Solution

A **real-time, collaborative price discovery ecosystem** featuring:
- 🗺️ Interactive location-based price mapping
- 🤖 ML-powered price predictions
- 🔔 Smart price alerts
- 👥 Community-driven price intelligence
- 📱 Mobile-first responsive design
- ⚡ High-performance Rust-powered computation engine

---

## ✨ Key Features

### 🔐 User Authentication & Profiles
- **Secure Registration**: Username/password-based account creation
- **Persistent Sessions**: User data persists across login sessions
- **User Reputation System**: Trust scores based on submission accuracy
- **Points & Rewards**: Earn points for approved price submissions
- **Profile Management**: Track submissions, alerts, and achievements

### 💰 Price Management
- **Submit Prices**: Easy-to-use form for price submissions
- **Price Comparison**: Compare prices across multiple retailers
- **Category Filtering**: Organize by Edibles, Drinks, and Non-Edibles
- **Retailer Profiles**: Detailed profiles with average prices and top items
- **Price History**: Track price changes over time

### 🔔 Smart Price Alerts
- **Custom Thresholds**: Set alerts for specific price points
- **Real-time Notifications**: Get notified when prices drop
- **Alert Management**: View and manage all active alerts
- **Badge Indicators**: Visual indicators for active alerts

### 📊 Analytics & Insights
- **Category Insights**: Analytics dashboard per category
- **Trending Items**: Top 5 trending items by submissions
- **Price Statistics**: Average, min, max prices per category
- **Submission Tracking**: Track total submissions and approval rates

### 🗺️ Location Features
- **Interactive Map Picker**: Google Maps integration for location selection
- **Reverse Geocoding**: Convert coordinates to addresses
- **Place Autocomplete**: Search and select locations easily
- **Location-based Filtering**: Filter prices by campus location

### 📱 Mobile Experience
- **Responsive Design**: Optimized for all screen sizes
- **Bottom Navigation**: Easy mobile navigation (Home, Trends, Submit, Map, Profile)
- **Touch-Friendly**: Large buttons and optimized touch targets
- **Fixed Layout**: No horizontal overflow, everything fits on screen
- **Dark Mode**: Beautiful dark theme support

### 👨‍💼 Admin Dashboard
- **Price Moderation**: Approve/reject price submissions
- **System Overview**: Statistics and activity monitoring
- **Category Management**: Manage item categories
- **User Management**: Monitor user activity and submissions

---

## 🛠 Tech Stack

### Backend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **API Framework** | FastAPI 0.104+ | High-performance async API |
| **Database** | SQLite / SQLAlchemy | Data persistence and ORM |
| **Computation** | Rust (PyO3) | High-performance calculations |
| **Maps API** | Google Maps API | Location services |
| **Payments** | Squad API | Payment processing |

### Frontend
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Markup** | HTML5 | Structure |
| **Styling** | CSS3 (Custom) | Responsive design |
| **Scripting** | Vanilla JavaScript | Interactivity |
| **Maps** | Google Maps JavaScript API | Interactive maps |
| **Storage** | LocalStorage | Client-side data persistence |

### Development Tools
- **Python**: 3.9+
- **Rust**: 1.70+
- **Maturin**: Rust-Python bindings
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ User Dashboard│  │ Admin Panel  │  │ Login/Register│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                      API Layer (FastAPI)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Auth    │  │  Items   │  │  Prices  │  │   ML     │    │
│  │ Routers  │  │ Routers  │  │ Routers  │  │ Routers  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Price Engine │  │ Heatmap      │  │ Squad       │       │
│  │              │  │ Engine       │  │ Payments    │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  Computation Engine (Rust)                   │
│  • Price calculations                                        │
│  • Statistical aggregations                                  │
│  • ML predictions                                           │
│  • Performance-critical operations                           │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   SQLite     │  │ LocalStorage │  │ Google Maps  │       │
│  │   Database   │  │ (Frontend)   │  │   API        │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.9 or higher
- **Rust** 1.70 or higher
- **pip** (Python package manager)
- **maturin** (for Rust-Python bindings)
- **Google Maps API Key** (for location features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Build the Rust computation engine**
   ```bash
   # Install maturin
   pip install maturin
   
   # Build Rust module
   cd rust_engine
   maturin develop
   cd ..
   ```

   **Alternative (Windows):**
   ```bash
   cd rust_engine
   cargo build --release
   # Copy rust_engine.dll to project root or site-packages
   ```

4. **Configure environment variables**
   ```bash
   # Create .env file (optional)
   DATABASE_URL=sqlite:///./data.db
   GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

5. **Initialize the database**
   ```bash
   # Database is auto-created on first run
   python -c "from app.database import init_db; init_db()"
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Access the application**
   - **API**: http://localhost:8000
   - **API Docs**: http://localhost:8000/docs
   - **ReDoc**: http://localhost:8000/redoc
   - **Login Page**: Open `login.html` in browser
   - **User Dashboard**: Open `user-dashboard.html` after login
   - **Admin Dashboard**: Open `admin-dashboard.html` (admin access required)

3. **For mobile access** (same network)
   ```bash
   # Find your IP address
   ipconfig  # Windows
   ifconfig  # Linux/Mac
   
   # Access from phone
   http://YOUR_IP:8000/docs
   http://YOUR_IP:5500/login.html  # If serving HTML files
   ```

---

## 🎨 Frontend Features

### User Dashboard (`user-dashboard.html`)

**Core Features:**
- 📊 **Price Submission Form**: Submit prices with category, brand, pack size
- 🔍 **Advanced Filtering**: Filter by category, price range, retailer, location
- 🔔 **Price Alerts**: Set alerts for price drops
- 📈 **Category Insights**: Analytics per category
- 🏪 **Retailer Profiles**: Click retailer names to view profiles
- 👤 **User Profile**: View reputation, points, submissions, alerts
- 🗺️ **Location Picker**: Interactive map for location selection
- 📱 **Mobile Bottom Nav**: Easy navigation on mobile devices

**User Authentication:**
- Secure registration with username/password
- Persistent user sessions
- User data restoration on login
- Points and reputation tracking

### Admin Dashboard (`admin-dashboard.html`)

**Features:**
- 📊 **System Overview**: Total prices, pending, approved, rejected
- ⏳ **Pending Review**: Approve or reject price submissions
- ✅ **Approved Prices**: View all approved submissions
- 🏷️ **Category Management**: View and manage categories
- 📈 **Activity Monitoring**: Recent activity tracking

### Login System (`login.html`)

- **User Registration**: Create account with username/password
- **User Login**: Secure authentication
- **Admin Login**: Admin access with API key
- **Session Management**: Auto-redirect if already logged in

---

## 📡 API Documentation

### Authentication Endpoints

#### User Registration
```http
POST /login/user
Content-Type: application/json

{
  "username": "student123",
  "password": "securepassword"
}
```

#### User Login
```http
POST /login/user
Content-Type: application/json

{
  "username": "student123",
  "password": "securepassword"
}
```

#### Admin Login
```http
POST /login/admin
Content-Type: application/json

{
  "username": "admin",
  "admin_key": "admin_api_key"
}
```

### Items Endpoints

```http
GET    /items                    # List all items
POST   /items                    # Create new item
GET    /items/categories/all     # Get all categories
GET    /items/{item_id}          # Get specific item
```

### Prices Endpoints

```http
GET    /items/prices/all         # Get all prices
POST   /items/prices/             # Submit new price
GET    /items/prices/pending/     # Get pending prices
PUT    /items/prices/{id}/approve # Approve price (admin)
PUT    /items/prices/{id}/reject  # Reject price (admin)
```

### Machine Learning Endpoints

```http
GET    /ml/predict?item_id={id}           # Predict price
GET    /ml/heatmap?item_id={id}&days=30   # Generate heatmap
```

### Maps Endpoints

```http
GET    /maps/search/autocomplete?input_text={query}  # Search places
GET    /maps/reverse-geocode?latitude={lat}&longitude={lng}  # Get address
GET    /maps/place/{place_id}                        # Get place details
```

### Payments Endpoints

```http
POST   /payments/pay              # Generate payment link
```

**Full API Documentation**: Visit http://localhost:8000/docs for interactive Swagger UI

---

## 📁 Project Structure

```
backend/
├── app/                          # Main application package
│   ├── __init__.py
│   ├── main.py                   # FastAPI application entry point
│   ├── database.py               # Database configuration
│   ├── models.py                 # SQLAlchemy models
│   ├── schemas.py                # Pydantic schemas
│   ├── dependencies.py           # Shared dependencies
│   ├── routers/                  # API route handlers
│   │   ├── auth.py               # Authentication routes
│   │   ├── items.py              # Item management routes
│   │   ├── prices.py             # Price submission routes
│   │   ├── ml.py                 # ML prediction routes
│   │   ├── payments.py           # Payment routes
│   │   ├── stores.py             # Store management routes
│   │   ├── admin_items.py        # Admin item routes
│   │   ├── pending.py            # Pending approval routes
│   │   └── google_maps.py        # Maps integration routes
│   └── services/                 # Business logic services
│       ├── price_engine.py       # Price calculation engine
│       ├── heatmap_engine.py     # Heatmap generation
│       └── squad.py              # Payment integration
│
├── rust_engine/                  # Rust computation module
│   ├── Cargo.toml                # Rust dependencies
│   └── src/
│       └── lib.rs                # Rust functions (PyO3)
│
├── uploads/                      # File uploads directory
│   └── submissions/              # Price submission images
│
├── login.html                    # Login/Registration page
├── user-dashboard.html           # User dashboard (main frontend)
├── admin-dashboard.html          # Admin dashboard
├── api-testing-panel.html        # API testing interface
│
├── requirements.txt              # Python dependencies
├── vercel.json                   # Vercel deployment config
├── data.db                       # SQLite database (auto-generated)
└── README.md                     # This file
```

---

## 🚢 Deployment

### Local Development

```bash
# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Serve frontend (optional, for mobile testing)
python -m http.server 5500
```

### Vercel Deployment

The project includes `vercel.json` for easy Vercel deployment:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Production Considerations

1. **Database**: Switch from SQLite to PostgreSQL for production
2. **Environment Variables**: Set secure API keys
3. **CORS**: Configure allowed origins
4. **HTTPS**: Use SSL certificates
5. **Rate Limiting**: Implement API rate limiting
6. **Authentication**: Use JWT tokens for production

---

## 🧪 Testing

### API Testing

Use the built-in API testing panel (`api-testing-panel.html`) or:

```bash
# Test API endpoints
curl http://localhost:8000/
curl http://localhost:8000/items
curl http://localhost:8000/docs  # Interactive docs
```

### Frontend Testing

1. Open `login.html` in browser
2. Create a test account
3. Submit test prices
4. Test all features (alerts, retailer profiles, etc.)

---

## 🐛 Troubleshooting

### Common Issues

**ModuleNotFoundError: rust_engine**
```bash
cd rust_engine
maturin develop
```

**Database errors**
```bash
# Delete and recreate database
rm data.db
python -c "from app.database import init_db; init_db()"
```

**CORS errors**
- Ensure backend is running on `0.0.0.0` for network access
- Check CORS settings in `app/main.py`

**Mobile access issues**
- Ensure phone and computer are on same Wi-Fi network
- Check firewall settings
- Verify IP address is correct

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use meaningful commit messages
- Add comments for complex logic
- Test your changes before submitting
- Update documentation as needed

---

## 📊 Performance

- **API Response Time**: < 100ms (average)
- **Rust Engine**: 10-100x faster than Python for calculations
- **Database Queries**: Optimized with SQLAlchemy
- **Frontend**: Lightweight vanilla JS, no heavy frameworks
- **Mobile**: Optimized for 3G/4G networks

---

## 🔒 Security

- **Password Hashing**: Passwords are hashed before storage
- **Input Validation**: Pydantic schemas validate all inputs
- **SQL Injection Protection**: SQLAlchemy ORM prevents SQL injection
- **CORS Configuration**: Configurable CORS settings
- **Role-Based Access**: Admin and user role separation

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Credits

**UNILAG Price Saver Development Team**

Built with ❤️ for the University of Lagos community

---

## 📬 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact the development team
- Check the API documentation at `/docs`

---

<div align="center">

**Made with ❤️ for UNILAG Students**

[⬆ Back to Top](#-unilag-price-saver)

</div>
