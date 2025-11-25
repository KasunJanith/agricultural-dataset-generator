# 🌱 Agricultural Translation Dataset Generator

A full-stack web application that automatically generates Sinhala agricultural terms and sentences with multiple Singlish variations and English translations using Google's Gemini AI.

## Features

- 🤖 **AI-Powered Generation**: Uses Gemini 1.5 Flash to generate authentic Sinhala agricultural terms
- 🔄 **Multiple Variations**: Generates 1-3 Singlish variations and 3 English translation variants
- 🌾 **10 Agricultural Subdomains**: Crop cultivation, livestock, soil science, pest management, and more
- 📊 **Statistics Dashboard**: Track dataset growth across different subdomains
- 💾 **SQLite Database**: Persistent storage with duplicate detection
- 📥 **CSV Export**: Export filtered datasets for machine learning applications
- 🎨 **Modern UI**: Responsive design with real-time updates

## Tech Stack

### Backend
- Node.js + Express
- SQLite3 for database
- Google Generative AI (Gemini 1.5 Flash)
- CORS enabled

### Frontend
- React 18 with Vite
- Axios for API calls
- Modern CSS with gradients and animations

## Project Structure

```
agricultural-dataset-generator/
├── backend/
│   ├── server.js          # Express server with API endpoints
│   ├── datasets.db        # SQLite database (generated)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── App.css        # Styling
│   │   └── main.jsx       # Entry point
│   ├── vite.config.js
│   └── package.json
└── render.yaml            # Render deployment configuration
```

## Local Development Setup

### Prerequisites
- Node.js 18+ installed
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/subdomains` - List all agricultural subdomains
- `GET /api/datasets?subdomain=xxx` - Get datasets (optionally filtered)
- `POST /api/generate-batch` - Generate new dataset batch
- `GET /api/statistics` - Get dataset statistics
- `GET /api/export-csv?subdomain=xxx` - Export as CSV

## Deploying to Render

### Option 1: Using render.yaml (Recommended)

1. Push your code to GitHub
2. Connect your repository to Render
3. Render will automatically detect `render.yaml` and create both services
4. Add your `GEMINI_API_KEY` environment variable in Render dashboard

### Option 2: Manual Deployment

#### Deploy Backend:
1. Create a new **Web Service** on Render
2. Build Command: `cd backend && npm install`
3. Start Command: `cd backend && npm start`
4. Add environment variable: `GEMINI_API_KEY`

#### Deploy Frontend:
1. Create a new **Static Site** on Render
2. Build Command: `cd frontend && npm install && npm run build`
3. Publish Directory: `frontend/dist`

### Important: Configure API Proxy

After deploying both services, update the frontend's Vite config to point to your backend URL, or configure Render's rewrite rules in `render.yaml`.

## Environment Variables

### Backend
- `GEMINI_API_KEY` - Your Google Gemini API key (required)
- `PORT` - Server port (default: 5000)

### Frontend (optional)
- `VITE_API_URL` - Backend API URL for production

## Database Schema

```sql
CREATE TABLE datasets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sinhala TEXT NOT NULL,
  singlish1 TEXT NOT NULL,
  singlish2 TEXT,
  singlish3 TEXT,
  variant1 TEXT NOT NULL,
  variant2 TEXT NOT NULL,
  variant3 TEXT NOT NULL,
  subdomain TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('word', 'sentence')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(sinhala, subdomain)
)
```

## Agricultural Subdomains

1. Crop Cultivation
2. Livestock Management
3. Soil Science
4. Pest Management
5. Irrigation
6. Harvesting
7. Organic Farming
8. Agricultural Machinery
9. Crop Protection
10. Post Harvest Technology

## Usage

1. Select an agricultural subdomain from the dropdown
2. Click "Generate 20 Random Records"
3. The system generates Sinhala terms with:
   - 1-3 Singlish variations (different romanization styles)
   - 3 English translation variants
4. View statistics and filter by subdomain
5. Export data as CSV for your ML projects

## Troubleshooting

### Backend won't start
- Check if `.env` file exists with valid `GEMINI_API_KEY`
- Ensure port 5000 is not in use
- Check Node.js version (18+ required)

### Frontend can't connect to backend
- Verify backend is running on port 5000
- Check vite.config.js proxy settings
- Ensure CORS is enabled in backend

### Vite build fails on Render
- Make sure `render.yaml` is properly configured
- Check that vite is in devDependencies
- Verify build command includes `npm install`

## License

MIT License - feel free to use this for your research or projects!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

KasunJanith

---

Built with ❤️ for agricultural research and NLP applications in Sinhala language.