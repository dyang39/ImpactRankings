# API Documentation

## Data File Format

The frontend application expects three CSV files in the `public/data/` directory:

### 1. rankings.csv

University rankings data with the following structure:

```csv
University,Continent,Country,Machine Learning,Computer Vision & Image Processing,Natural Language Processing,Total Score
Stanford University,North America,United States,45.2,38.7,42.1,126.0
MIT,North America,United States,42.8,35.4,39.6,117.8
...
```

**Required Columns:**
- `University`: Institution name
- `Continent`: Geographic continent
- `Country`: Country name
- `Machine Learning`: Score for Machine Learning field
- `Computer Vision & Image Processing`: Score for Computer Vision field
- `Natural Language Processing`: Score for NLP field
- `Total Score`: Sum of all field scores

### 2. faculty.csv

Faculty information and research data:

```csv
Faculty Name,University,Category,Score,Paper Count
John Doe,Stanford University,Machine Learning,12.5,8
Jane Smith,Stanford University,Computer Vision & Image Processing,15.2,10
...
```

**Required Columns:**
- `Faculty Name`: Full name of faculty member
- `University`: Institution name (must match rankings.csv)
- `Category`: Research field category
- `Score`: Individual faculty score
- `Paper Count`: Number of papers

### 3. countries.csv

Country mapping and metadata:

```csv
institution,countryabbrv,country
Stanford University,us,United States
MIT,us,United States
...
```

**Required Columns:**
- `institution`: Institution name (must match rankings.csv)
- `countryabbrv`: Two-letter country code
- `country`: Full country name

## Configuration

The application configuration is defined in `app.js`:

```javascript
const CONFIG = {
    DATA_FILES: {
        RANKINGS: 'data/rankings.csv',
        FACULTY: 'data/faculty.csv',
        COUNTRIES: 'data/countries.csv'
    },
    FIELDS: {
        ALL: [
            "Machine Learning",
            "Computer Vision & Image Processing", 
            "Natural Language Processing"
        ]
    }
};
```

## Adding New Research Fields

To add new research fields:

1. **Update CONFIG.FIELDS.ALL** in `app.js`:
   ```javascript
   FIELDS: {
       ALL: [
           "Machine Learning",
           "Computer Vision & Image Processing", 
           "Natural Language Processing",
           "Your New Field"
       ]
   }
   ```

2. **Add field column to rankings.csv**:
   ```csv
   University,Continent,Country,Machine Learning,Computer Vision & Image Processing,Natural Language Processing,Your New Field,Total Score
   ```

3. **Update faculty.csv** with new field data:
   ```csv
   Faculty Name,University,Category,Score,Paper Count
   John Doe,Stanford University,Your New Field,8.5,5
   ```

## Data Update Process

1. **Backend generates new CSV files**
2. **Replace files in `public/data/` directory**
3. **Deploy to AWS S3**:
   ```bash
   aws s3 sync public/ s3://your-bucket-name/ --delete
   ```
4. **CloudFront automatically serves updated files**

## Error Handling

The application includes error handling for:
- Missing data files
- Malformed CSV data
- Network errors
- Invalid data formats

Error messages are displayed to users via notification system.

## Performance Considerations

- **Data Size**: Optimized for datasets up to 10,000 universities
- **Loading**: Parallel data loading for faster initialization
- **Caching**: Static assets cached by CloudFront
- **Compression**: Gzip compression enabled
