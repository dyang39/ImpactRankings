# AI Research Impact Rankings - Frontend

A modern, interactive web application for exploring university rankings based on research impact in computer science fields. This application provides comprehensive analysis tools including faculty details, research field visualization, and geographic filtering.

## 🚀 Quick Start

### Prerequisites
- Python 3.6+ or  Node.js 14+
- Modern web browser
- Internet connection

### Installation & Running

```bash
# Clone the repository
git clone <repository-url>
cd ImpactRankings-Frontend

# Option 1: Python HTTP Server (Recommended)
cd public
python -m http.server 8000

# Option 2: Node.js
npm install
npm start

# Option 3: PowerShell (Windows)
powershell -ExecutionPolicy Bypass -File start.ps1
```

Visit `http://localhost:8000` in your browser.

## ✨ Features

### 🏆 University Rankings
- **Interactive Rankings Table**: View universities ranked by research impact score
- **Top Field Indicators**: Small badges show which universities lead in each research field (ML, Vision, NLP)
- **Expandable Details**: Click on any university to view detailed faculty information
- **Real-time Statistics**: See total universities, impact scores, and active filters

### 🔍 Advanced Filtering
- **Geographic Filters**: Filter by region (Africa, Asia, Europe, North America, etc.)
- **Country Selection**: Filter by specific countries
- **Research Fields**: Select from 3 core research areas (Machine Learning, Computer Vision, NLP)
- **Dynamic Updates**: Real-time filtering with instant results

### 👥 Faculty Analysis
- **Faculty Details**: View individual faculty members and their contributions
- **Research Distribution**: Interactive charts showing faculty research across fields
- **External Links**: Direct links to Google Scholar and DBLP profiles
- **Score Breakdown**: Detailed contribution scores and paper counts

### 📊 Data Visualization
- **Field Statistics**: Visual representation of university performance across research fields
- **Interactive Charts**: Click to expand detailed field analysis
- **Export Functionality**: Download filtered results as CSV

## 📁 Project Structure

```
ImpactRankings-Frontend/
├── public/                 # Main application directory
│   ├── index.html         # Main HTML file
│   ├── app.js             # Application logic
│   ├── style.css          # Styling and layout
│   └── data/              # Data files
│       ├── 3_f_1.csv      # University rankings data
│       ├── 3_faculty_score.csv  # Faculty details
│       └── country-info.csv     # Country information
├── docs/                  # Documentation
│   ├── api.md            # API documentation
│   ├── deployment.md     # Deployment guide
│   ├── faq.md           # Frequently asked questions
│   └── disclaimer.md    # Terms of use and disclaimer
├── start.ps1             # Windows startup script
├── package.json          # Node.js dependencies
└── README.md             # This file
```

## 🎯 Quick Usage

1. **View Rankings**: Browse universities ranked by research impact score
2. **Apply Filters**: Use geographic and field filters to narrow results
3. **Explore Faculty**: Click the arrow (▶) next to university names to view faculty details
4. **Analyze Research**: Click chart icons (📊) to see research field distributions
5. **Export Data**: Click "Export CSV" to download filtered results

### Key Features
- **Top Field Badges**: Look for colored badges (ML, Vision, NLP) next to impact scores
- **Interactive Charts**: Each field uses its own maximum for accurate scaling
- **Faculty Details**: View individual contributions and research distributions
- **Real-time Filtering**: Instant updates when changing filters

## 🔧 Technical Details

### Architecture
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Data Format**: CSV files with university and faculty data
- **Visualization**: Custom CSS charts and interactive elements
- **Responsive Design**: Mobile-friendly interface

### Score Calculation
- **Single Field**: Raw impact score
- **Multiple Fields**: Normalized harmonic mean
- **Normalization**: Unit-variance normalization for fair comparison

## 📊 Data Sources

The application uses three main data files:

1. **University Rankings** (`3_f_1.csv`): Research impact scores across 15+ fields
2. **Faculty Details** (`3_faculty_score.csv`): Individual faculty contributions
3. **Country Information** (`country-info.csv`): Geographic data for flag display

# Start development server
cd public
python -m http.server 8000

# Make changes to HTML, CSS, or JavaScript
# Refresh browser to see changes
```

### Code Structure
- **app.js**: Main application logic and data handling
- **index.html**: Application structure and UI components
- **style.css**: Styling, layout, and responsive design

### Key Functions
- `initialize()`: Application startup and data loading
- `displayRankings()`: Render university rankings table
- `toggleUniversityDropdown()`: Expand/collapse faculty details
- `showFieldsChart()`: Display research field analysis

## 📈 Performance

- **Fast Loading**: Optimized data loading and rendering
- **Efficient Filtering**: Real-time filtering with minimal performance impact
- **Responsive UI**: Smooth interactions and animations
- **Memory Management**: Efficient data handling for large datasets

## 📚 Documentation

- **[API Documentation](docs/api.md)**: Data format and structure details
- **[Deployment Guide](docs/deployment.md)**: AWS S3 and CloudFront deployment
- **[FAQ](docs/faq.md)**: Frequently asked questions and troubleshooting
- **[Disclaimer](docs/disclaimer.md)**: Terms of use and legal information

## ⚠️ Important Notice

Please read the [Disclaimer](docs/disclaimer.md) before using this application. The rankings are for informational purposes only and should not be used as the sole basis for academic or institutional decisions.

---

