/**
 * AI Research Impact Rankings - Frontend Application
 * 
 * This application provides an interactive interface for exploring university rankings
 * based on research impact in computer science fields. It includes faculty details,
 * research field analysis, and geographic filtering capabilities.
 * 
 * @author Impact Rankings Team
 * @version 1.0.0
 */

// Global application state
let data = [];                    // Main university ranking data
let facultyData = [];             // Faculty member details and scores
let countryData = [];             // Country information for flag display
let categories = [];              // Available research categories
let selectedRegion = 'all';       // Currently selected geographic region
let lastFiltered = [];            // Last filtered results for export
let selectedCountry = 'all';      // Currently selected country
let expandedRows = new Set();     // Set of expanded university rows

// Research field configuration
const ALL_FIELDS = [
            "Machine Learning",
            "Computer Vision & Image Processing", 
            "Natural Language Processing"
];

let ACTIVE_FIELDS = [...ALL_FIELDS]; // Currently active fields (default: all selected)

// Field display labels for UI
const FIELD_DISPLAY_LABELS = {
            'Machine Learning': 'Machine Learning',
            'Computer Vision & Image Processing': 'Computer Vision & Image Processing',
            'Natural Language Processing': 'Natural Language Processing'
};

// Mathematical constants
const EPS = 1e-9;                 // Small epsilon for numerical stability
const NORMALIZE = 'unit-variance'; // Normalization method
let fieldStats = {};              // Statistical data for each field

/**
 * Load and parse CSV data from a file
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} Parsed CSV data as array of objects
 */
async function loadCSV(filePath) {
        const response = await fetch(filePath);
        const csvText = await response.text();
        
    const rows = csvText.trim().split('\n');
    const headers = rows.shift().split(',');

    return rows.map(row => {
        const rowData = row.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header.trim()] = rowData[index]?.trim() || '';
            return obj;
        }, {});
    });
}

/**
 * Initialize the application by loading data and setting up UI components
 */
async function initialize() {
    // Load all required data files
    data = await loadCSV('data/3_f_1.csv');
    facultyData = await loadCSV('data/3_faculty_score.csv');
    countryData = await loadCSV('data/country-info.csv');

    // Extract categories dynamically from the data
    if (data.length > 0) {
        const columns = Object.keys(data[0]);
        categories = columns.slice(2); // Assume categories start at index 2
    }

    // Initialize application components
    computeFieldStats();
    setupRegionFilter();
    setupCountryFilter();
    setupFieldFilter();
    displayRankings();
}

/**
 * Set up the country filter dropdown with available countries from the data
 */
function setupCountryFilter() {
    const sel = document.getElementById('countryFilter');
    const countries = Array.from(new Set(
        data.map(r => (r.Country || '').trim()).filter(s => s && s.toLowerCase() !== 'unknown')
    )).sort((a, b) => a.localeCompare(b));

    sel.innerHTML = '<option value="all">All Countries</option>' +
        countries.map(c => `<option value="${c}">${c}</option>`).join('');

    sel.addEventListener('change', () => {
        selectedCountry = sel.value;
        resetPageAndDisplayRankings();
    });
}

/**
 * Compute statistical data for each research field (mean and standard deviation)
 * Used for score normalization across different fields
 */
function computeFieldStats() {
    fieldStats = {};
    const cols = ALL_FIELDS; // Calculate stats for the 3 fixed fields
    cols.forEach(cat => {
        const vals = data.map(r => parseFloat(r[cat])).filter(v => !isNaN(v) && v > 0);
        const n = vals.length;
        const mean = n ? vals.reduce((a,b)=>a+b,0)/n : 0;
        const varSample = n>1 ? vals.reduce((a,b)=>a+(b-mean)*(b-mean),0)/(n-1) : 0;
        const std = Math.sqrt(varSample);
        fieldStats[cat] = { mean, std };
    });
}

function setupFieldFilter() {
    // Dynamically generate field filter UI
    generateFieldFilterUI();
    
    // Add event listeners to all field checkboxes
    const checkboxes = document.querySelectorAll('.field-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateToggleAllFieldsButton();
            resetPageAndDisplayRankings();
        });
    });
    updateToggleAllFieldsButton();
}

function generateFieldFilterUI() {
    const fieldCheckboxesContainer = document.getElementById('fieldCheckboxes');
    if (!fieldCheckboxesContainer) {
        console.error('Field checkboxes container not found');
        return;
    }
    
    // Clear existing content
    fieldCheckboxesContainer.innerHTML = '';
    
    // Generate checkboxes for 3 fixed fields
    ALL_FIELDS.forEach(field => {
        const isChecked = ACTIVE_FIELDS.includes(field);
        const fieldId = `field-${field.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        
        const checkboxItem = document.createElement('label');
        checkboxItem.className = 'field-checkbox-item';
        checkboxItem.setAttribute('data-field-name', field.toLowerCase());
        checkboxItem.innerHTML = `
            <input type="checkbox" 
                   class="field-checkbox" 
                   data-field="${field}" 
                   id="${fieldId}"
                   ${isChecked ? 'checked' : ''}>
            <span class="checkbox-label">${FIELD_DISPLAY_LABELS[field]}</span>
        `;
        
        fieldCheckboxesContainer.appendChild(checkboxItem);
    });
    
}

function filterFields(searchTerm) {
    const fieldItems = document.querySelectorAll('.field-checkbox-item');
    const searchLower = searchTerm.toLowerCase();
    
    fieldItems.forEach(item => {
        const fieldName = item.getAttribute('data-field-name');
        const label = item.querySelector('.checkbox-label').textContent.toLowerCase();
        
        if (fieldName.includes(searchLower) || label.includes(searchLower)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function toggleAllFields() {
    const checkboxes = document.querySelectorAll('.field-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
    
    updateToggleAllFieldsButton();
    resetPageAndDisplayRankings();
}

function updateToggleAllFieldsButton() {
    const checkboxes = document.querySelectorAll('.field-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const button = document.getElementById('toggleAllFields');
    
    if (button) {
        button.textContent = allChecked ? 'None' : 'All';
    }
}

function toId(name) {
    return 'field-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function updateToggleAllButtonLabel() {
    const boxes = document.querySelectorAll('.field-checkbox');
    const allChecked = Array.from(boxes).every(b => b.checked);
    const btn = document.getElementById('toggleAll');
    if (btn) btn.textContent = allChecked ? 'Deselect All' : 'Select All';
}

function setupRegionFilter() {
    const regionFilter = document.getElementById('regionFilter');
    regionFilter.addEventListener('change', resetPageAndDisplayRankings);
}

function resetPageAndDisplayRankings() {
    selectedRegion = document.getElementById('regionFilter').value;
    expandedRows.clear(); // Clear expanded rows when filters change
    displayRankings();
}

function getSelectedCategories() {
    const selectedFields = [...document.querySelectorAll('.field-checkbox:checked')]
           .map(el => el.dataset.field);
    
    // Update ACTIVE_FIELDS to keep in sync
    ACTIVE_FIELDS = selectedFields;
    
    return selectedFields;
}

function getRawScore(univ, field) {
    const row = data.find(e => e.University === univ);
    if (!row) return 0;
    const s = parseFloat(row[field]);
    return isNaN(s) ? 0 : s;
}

function getNormalizedScore(univ, field) {
    const s = getRawScore(univ, field);
    if (!(s > 0)) return 0;
    const stats = fieldStats[field] || { std: 1 };
    const std = stats.std > EPS ? stats.std : 1;
    return s / std;
}

function getFacultyForUniversity(universityName, selectedCategories) {
    // Filter faculty data for this university and selected categories
    const filteredFaculty = facultyData.filter(faculty => {
        const matchesUniversity = faculty.University === universityName;
        const matchesCategory = selectedCategories.length === 0 || 
                                selectedCategories.includes(faculty.Category);
        return matchesUniversity && matchesCategory;
    });

    // Group by faculty name and sum scores
    const facultyMap = new Map();
    
    filteredFaculty.forEach(faculty => {
        const name = faculty['Faculty Name'] || 'Unknown';
        const score = parseFloat(faculty.Score) || 0;
        const category = faculty.Category || 'Unknown';
        
        if (!facultyMap.has(name)) {
            facultyMap.set(name, {
                name: name,
                categories: [],
                totalScore: 0,
                paperCount: 0
            });
        }
        
        const facultyInfo = facultyMap.get(name);
        facultyInfo.totalScore += score;
        facultyInfo.paperCount += 1; // Each record represents one paper
        if (!facultyInfo.categories.includes(category)) {
            facultyInfo.categories.push(category);
        }
    });
    
    // Convert to array and sort by total score
    const mergedFaculty = Array.from(facultyMap.values())
        .sort((a, b) => b.totalScore - a.totalScore);
    
    return mergedFaculty;
}

function toggleUniversityDropdown(universityName, rowElement) {
    const isExpanded = expandedRows.has(universityName);
    
    if (isExpanded) {
        // Collapse: Remove the details row and any chart stats
        const detailsRow = rowElement.nextElementSibling;
        if (detailsRow && detailsRow.classList.contains('faculty-details-row')) {
            detailsRow.remove();
        }
        // Also remove chart stats if present
        const chartRow = rowElement.nextElementSibling;
        if (chartRow && chartRow.classList.contains('chart-stats-row')) {
            chartRow.remove();
        }
        expandedRows.delete(universityName);
        const expandIcon = rowElement.querySelector('.expand-icon');
        expandIcon.innerHTML = '▶';
        expandIcon.classList.remove('expanded');
    } else {
        // Expand: Add the details row
        const selectedCategories = getSelectedCategories();
        const facultyList = getFacultyForUniversity(universityName, selectedCategories);
        
        const detailsRow = document.createElement('tr');
        detailsRow.classList.add('faculty-details-row');
        
        let facultyHTML = '<td colspan="3"><div class="faculty-details">';
        
        if (facultyList.length > 0) {
            facultyHTML += '<div class="faculty-summary">';
            facultyHTML += `<h4><i class="fas fa-users"></i> Faculty Members (${facultyList.length})</h4>`;
            facultyHTML += '</div>';
            
            facultyHTML += '<table class="faculty-table">';
            
            // CSRankings style header - just two columns
            facultyHTML += `
                <thead>
                    <tr>
                        <th class="faculty-name-col">Faculty Name</th>
                        <th class="faculty-info-col">Information</th>
                    </tr>
                </thead>
            `;
            facultyHTML += '<tbody>';
            
            facultyList.forEach(faculty => {
                const paperCount = faculty.paperCount || 0;
                const googleScholarLink = generateGoogleScholarLink(faculty.name);
                const dblpLink = generateDBLPLink(faculty.name);
                
                facultyHTML += `
                    <tr class="faculty-row">
                        <td class="faculty-name-cell">
                            <span class="faculty-name">${faculty.name}</span>
                        </td>
                        <td class="faculty-info-cell">
                            <div class="faculty-info-links">
                                <span class="score-display" title="Contribution Score: ${faculty.totalScore.toFixed(4)}">
                                    <i class="fas fa-chart-line"></i>
                                    <span class="link-text">${faculty.totalScore.toFixed(4)}</span>
                                </span>
                                <a href="#" class="info-link fields-toggle" data-faculty="${faculty.name}" title="Research Fields - Click to view chart">
                                    <i class="fas fa-chart-bar"></i>
                                </a>
                                <a href="${dblpLink}" target="_blank" rel="noopener noreferrer" class="info-link" title="Papers: ${paperCount} - Click to search DBLP">
                                    <i class="fas fa-file-alt"></i>
                                    <span class="link-text">${paperCount}</span>
                                </a>
                                <a href="${googleScholarLink}" target="_blank" rel="noopener noreferrer" class="info-link" title="Google Scholar">
                                    <i class="fas fa-graduation-cap"></i>
                                </a>
                            </div>
                        </td>
                    </tr>
                `;
            });
            
            facultyHTML += '</tbody></table>';
        } else {
            facultyHTML += '<p>No faculty data available for the selected fields.</p>';
        }
        
        facultyHTML += '</div></td>';
        detailsRow.innerHTML = facultyHTML;
        
        rowElement.insertAdjacentElement('afterend', detailsRow);
        expandedRows.add(universityName);
        const expandIcon = rowElement.querySelector('.expand-icon');
        expandIcon.innerHTML = '▼';
        expandIcon.classList.add('expanded');
        
        // Add Fields chart click event
        setupFieldsChartEvents();
    }
}

function setupFieldsChartEvents() {
    const fieldsToggles = document.querySelectorAll('.fields-toggle');
    fieldsToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const facultyName = this.getAttribute('data-faculty');
            showFieldsChart(facultyName);
        });
    });
}

function showFieldsChart(facultyName) {
    // Find current faculty row
    const facultyLink = document.querySelector(`[data-faculty="${facultyName}"]`);
    if (!facultyLink) {
        console.error('Faculty link not found:', facultyName);
        return;
    }
    
    const facultyRow = facultyLink.closest('tr');
    const nextRow = facultyRow.nextElementSibling;
    
    // If chart already exists, remove it
    if (nextRow && nextRow.classList.contains('faculty-chart-row')) {
        nextRow.remove();
        return;
    }
    
    // Create inline chart row
    const chartRow = document.createElement('tr');
    chartRow.classList.add('faculty-chart-row');
    chartRow.innerHTML = `
        <td colspan="2">
            <div class="inline-chart-container">
                ${createInlineChart(facultyName)}
            </div>
        </td>
    `;
    
    // Insert after faculty row
    facultyRow.insertAdjacentElement('afterend', chartRow);
}

function createInlineChart(facultyName) {
    // Count papers by field for this faculty member
    const fieldStats = {};
    const facultyPapers = facultyData.filter(faculty => faculty['Faculty Name'] === facultyName);
    
    facultyPapers.forEach(paper => {
        const category = paper.Category;
        if (!fieldStats[category]) {
            fieldStats[category] = 0;
        }
        fieldStats[category]++;
    });
    
    const totalPapers = Object.values(fieldStats).reduce((sum, count) => sum + count, 0);
    if (totalPapers === 0) {
        return '<p class="no-data">No research data available for this faculty member.</p>';
    }
    
    // Sort by paper count
    const sortedFields = Object.entries(fieldStats)
        .sort(([,a], [,b]) => b - a);
    
    // Get maximum value for scaling
    const maxValue = Math.max(...Object.values(fieldStats));
    
    let chartHTML = '<div class="inline-chart">';
    chartHTML += '<div class="chart-header">';
    chartHTML += '<span class="chart-title">Research Fields Distribution</span>';
    chartHTML += `<span class="chart-total">Total: ${totalPapers} papers</span>`;
    chartHTML += '</div>';
    chartHTML += '<div class="chart-bars-container">';
    
    sortedFields.forEach(([field, count]) => {
        const percentage = (count / maxValue) * 100;
        const fieldAbbr = getFieldAbbreviation(field);
        chartHTML += `
            <div class="chart-bar-item">
                <div class="field-label">${fieldAbbr}</div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                    <div class="bar-value">${count}</div>
                </div>
            </div>
        `;
    });
    
    chartHTML += '</div></div>';
    return chartHTML;
}

function getFieldAbbreviation(field) {
    const abbreviations = {
        'Machine Learning': 'ML',
        'Computer Vision & Image Processing': 'Vision',
        'Natural Language Processing': 'NLP',
        'Artificial Intelligence': 'AI',
        'Web & Information Retrieval': 'Web+IR',
        'Computer Architecture': 'Arch',
        'Computer Networks': 'Networks',
        'Computer Security': 'Security',
        'Databases': 'DB',
        'Design Automation': 'EDA',
        'Embedded & Real-time Systems': 'Embedded',
        'High-performance Computing': 'HPC',
        'Mobile Computing': 'Mobile',
        'Measurement & Performance Analysis': 'Metrics',
        'Operating Systems': 'OS',
        'Programming Languages': 'PL',
        'Software Engineering': 'SE',
        'Algorithms & Complexity': 'Theory',
        'Cryptography': 'Crypto',
        'Logic & Verification': 'Logic',
        'Computational Biology': 'Comp. Bio',
        'Computer Graphics': 'Graphics',
        'Computer Science Education': 'CSEd',
        'Economics & Computation': 'ECom',
        'Human-Computer Interaction': 'HCI',
        'Robotics': 'Robotics',
        'Visualization': 'Visualization'
    };
    return abbreviations[field] || field.substring(0, 8);
}

// Removed modal-related functions, now using inline charts

function displayRankings() {
    showLoadingSpinner();
    
    // Simulate loading delay for better UX
    setTimeout(() => {
        const calculatedScores = [];
        const seenUniversities = new Set();

        data.forEach(university => {
            const selectedCats = getSelectedCategories();

            let totalScore = 0;
            if (selectedCats.length >= 2) {
                // Normalized harmonic mean for multiple fields
                let denom = 0, count = 0;
                selectedCats.forEach(cat => {
                    const x = getNormalizedScore(university.University, cat);
                    if (x > 0) { 
                        denom += 1 / (x + EPS); 
                        count++;
                    }
                });
                totalScore = count > 0 ? (count / denom) : 0;
            } else if (selectedCats.length === 1) {
                // Raw score for single field
                totalScore = getRawScore(university.University, selectedCats[0]);
            } else {
                totalScore = 0;
            }

            // Apply region filtering
            if (selectedRegion !== 'all' && university.Continent) {
                const continentMatch = university.Continent.trim().toLowerCase() === selectedRegion.toLowerCase();
                if (!continentMatch) return;
            }
            
            // Apply countries filtering
            if (selectedCountry !== 'all') {
                const country = (university.Country || '').trim();
                if (!country || country !== selectedCountry) return;
            }

            if (!seenUniversities.has(university.University) && totalScore > 0) {
                calculatedScores.push({
                    University: university.University,
                    Continent: university.Continent || 'Unknown',
                    Score: totalScore
                });
                seenUniversities.add(university.University);
            }
        });

        calculatedScores.sort((a, b) => b.Score - a.Score);

        lastFiltered = calculatedScores;
        updateStats(calculatedScores);
        displayAllRankings(calculatedScores);
        hideLoadingSpinner();
    }, 300);
}

/**
 * Get the top university for each research field based on absolute highest scores
 * This function always checks all 3 fixed fields regardless of current filter selection
 * @returns {Object} Object with field names as keys and top university names as values
 */
function getTopUniversitiesByField() {
    const topUniversities = {};
    
    // Always check all 3 fixed fields, regardless of current selection
    ALL_FIELDS.forEach(field => {
        let maxScore = 0;
        let topUniversity = '';
        
        data.forEach(university => {
            const score = getRawScore(university.University, field);
            if (score > maxScore) {
                maxScore = score;
                topUniversity = university.University;
            }
        });
        
        if (topUniversity && maxScore > 0) {
            topUniversities[field] = topUniversity;
        }
    });
    
    return topUniversities;
}

/**
 * Generate top field badges for a university
 * @param {string} universityName - Name of the university
 * @param {Object} topUniversities - Object containing top universities by field
 * @returns {string} HTML string for the badges
 */
function generateTopFieldBadges(universityName, topUniversities) {
    const badges = [];
    
    Object.entries(topUniversities).forEach(([field, topUniv]) => {
        if (topUniv === universityName) {
            const fieldAbbr = getFieldAbbreviation(field);
            badges.push(`<span class="top-field-badge" title="Top in ${field}">${fieldAbbr}</span>`);
        }
    });
    
    return badges.length > 0 ? badges.join('') : '';
}

function displayAllRankings(data) {
    const table = document.getElementById('rankingTable');
    const tableBody = table.querySelector('tbody');
    tableBody.innerHTML = '';

    // Get top universities for each field
    const topUniversities = getTopUniversitiesByField();

    data.forEach((university, index) => {
        const row = tableBody.insertRow();
        row.classList.add('university-row', 'fade-in');
        
        const rank = index + 1;
        const flagClass = getFlagClass(university.University);
        const chartIcon = generateChartIcon(university.University);
        const countryName = getCountryName(university.University);
        const topFieldBadges = generateTopFieldBadges(university.University, topUniversities);
        
        const universityCell = `
            <td class="rank-col">${rank}</td>
            <td class="institution-col university-name-cell">
                <span class="expand-icon" onclick="toggleUniversityDropdown('${university.University.replace(/'/g, "\\'")}', this.closest('tr'))" title="Click to expand details">▶</span>
                <span class="university-name" title="View details" onclick="toggleUniversityDropdown('${university.University.replace(/'/g, "\\'")}', this.closest('tr'))">${university.University}</span>
                <span class="flag-icon ${flagClass}" title="${countryName}"></span>
                ${chartIcon}
            </td>
            <td class="score-col">
                <div class="score-container">
                    ${topFieldBadges}
                    <span class="score-value">${university.Score.toFixed(2)}</span>
                </div>
            </td>
        `;
        
        row.innerHTML = universityCell;
        
        // Re-expand if this university was previously expanded
        if (expandedRows.has(university.University)) {
            setTimeout(() => {
                toggleUniversityDropdown(university.University, row);
            }, 0);
        }
    });
}

// Removed pagination functions - now using scroll mode

// New utility functions
function showLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function updateStats(data) {
    const totalUniversities = data.length;
    const totalScore = data.reduce((sum, uni) => sum + uni.Score, 0);
    const activeFilters = getActiveFilterCount();
    
    document.getElementById('totalUniversities').textContent = totalUniversities.toLocaleString();
    document.getElementById('totalScore').textContent = totalScore.toFixed(1);
    document.getElementById('activeFilters').textContent = activeFilters;
    
    // Update scroll info
    document.getElementById('totalCount').textContent = totalUniversities.toLocaleString();
}

function getActiveFilterCount() {
    let count = 0;
    if (selectedRegion !== 'all') count++;
    if (selectedCountry !== 'all') count++;
    count += getSelectedCategories().length;
    return count;
}

function getFlagClass(universityName) {
    // Find country code for university
    const university = countryData.find(uni => 
        uni.institution && universityName && 
        uni.institution.toLowerCase().includes(universityName.toLowerCase()) ||
        universityName.toLowerCase().includes(uni.institution.toLowerCase())
    );
    
    if (university && university.countryabbrv) {
        return `fi fi-${university.countryabbrv}`;
    }
    
    // If no match found, try to get from Country field in data
    const dataEntry = data.find(entry => entry.University === universityName);
    if (dataEntry && dataEntry.Country) {
        const countryCode = getCountryCode(dataEntry.Country);
        if (countryCode) {
            return `fi fi-${countryCode}`;
        }
    }
    
    return 'fi fi-xx'; // Default unknown flag
}

function getCountryCode(countryName) {
    const countryMap = {
        'United States': 'us',
        'Canada': 'ca',
        'China': 'cn',
        'United Kingdom': 'gb',
        'Germany': 'de',
        'France': 'fr',
        'Japan': 'jp',
        'Australia': 'au',
        'India': 'in',
        'South Korea': 'kr',
        'Italy': 'it',
        'Spain': 'es',
        'Netherlands': 'nl',
        'Switzerland': 'ch',
        'Sweden': 'se',
        'Norway': 'no',
        'Denmark': 'dk',
        'Finland': 'fi',
        'Israel': 'il',
        'Singapore': 'sg',
        'Hong Kong': 'hk',
        'Taiwan': 'tw',
        'Brazil': 'br',
        'Mexico': 'mx',
        'Russia': 'ru',
        'Poland': 'pl',
        'Czech Republic': 'cz',
        'Austria': 'at',
        'Belgium': 'be',
        'Ireland': 'ie',
        'Portugal': 'pt',
        'Greece': 'gr',
        'Turkey': 'tr',
        'South Africa': 'za',
        'Egypt': 'eg',
        'Nigeria': 'ng',
        'Kenya': 'ke',
        'Morocco': 'ma',
        'Tunisia': 'tn',
        'Algeria': 'dz',
        'Ghana': 'gh',
        'Ethiopia': 'et',
        'Uganda': 'ug',
        'Tanzania': 'tz',
        'Zimbabwe': 'zw',
        'Botswana': 'bw',
        'Namibia': 'na',
        'Zambia': 'zm',
        'Malawi': 'mw',
        'Mozambique': 'mz',
        'Madagascar': 'mg',
        'Senegal': 'sn',
        'Ivory Coast': 'ci',
        'Burkina Faso': 'bf',
        'Mali': 'ml',
        'Niger': 'ne',
        'Chad': 'td',
        'Cameroon': 'cm',
        'Central African Republic': 'cf',
        'Democratic Republic of the Congo': 'cd',
        'Republic of the Congo': 'cg',
        'Gabon': 'ga',
        'Equatorial Guinea': 'gq',
        'Sao Tome and Principe': 'st',
        'Angola': 'ao',
        'Cape Verde': 'cv',
        'Guinea-Bissau': 'gw',
        'Guinea': 'gn',
        'Sierra Leone': 'sl',
        'Liberia': 'lr',
        'Gambia': 'gm',
        'Senegal': 'sn',
        'Mauritania': 'mr',
        'Western Sahara': 'eh',
        'Algeria': 'dz',
        'Tunisia': 'tn',
        'Libya': 'ly',
        'Sudan': 'sd',
        'South Sudan': 'ss',
        'Eritrea': 'er',
        'Djibouti': 'dj',
        'Somalia': 'so',
        'Ethiopia': 'et',
        'Eritrea': 'er',
        'Djibouti': 'dj',
        'Somalia': 'so',
        'Kenya': 'ke',
        'Uganda': 'ug',
        'Tanzania': 'tz',
        'Rwanda': 'rw',
        'Burundi': 'bi',
        'Democratic Republic of the Congo': 'cd',
        'Central African Republic': 'cf',
        'Cameroon': 'cm',
        'Chad': 'td',
        'Niger': 'ne',
        'Nigeria': 'ng',
        'Benin': 'bj',
        'Togo': 'tg',
        'Ghana': 'gh',
        'Burkina Faso': 'bf',
        'Mali': 'ml',
        'Senegal': 'sn',
        'Mauritania': 'mr',
        'Guinea': 'gn',
        'Guinea-Bissau': 'gw',
        'Sierra Leone': 'sl',
        'Liberia': 'lr',
        'Ivory Coast': 'ci',
        'Gambia': 'gm',
        'Cape Verde': 'cv',
        'Sao Tome and Principe': 'st',
        'Equatorial Guinea': 'gq',
        'Gabon': 'ga',
        'Republic of the Congo': 'cg',
        'Angola': 'ao',
        'Zambia': 'zm',
        'Zimbabwe': 'zw',
        'Botswana': 'bw',
        'Namibia': 'na',
        'South Africa': 'za',
        'Lesotho': 'ls',
        'Swaziland': 'sz',
        'Malawi': 'mw',
        'Mozambique': 'mz',
        'Madagascar': 'mg',
        'Mauritius': 'mu',
        'Seychelles': 'sc',
        'Comoros': 'km',
        'Mayotte': 'yt',
        'Reunion': 're',
        'Saint Helena': 'sh',
        'Ascension Island': 'ac',
        'Tristan da Cunha': 'ta'
    };
    
    return countryMap[countryName] || null;
}

function generateGoogleScholarLink(facultyName) {
    // Clean name, remove special characters, join with +
    const cleanName = facultyName.replace(/[^\w\s]/g, '').replace(/\s+/g, '+');
    return `https://scholar.google.com/scholar?q=${encodeURIComponent(cleanName)}`;
}

function generateDBLPLink(facultyName) {
    // Clean name, remove special characters, join with spaces
    const cleanName = facultyName.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    return `https://dblp.org/search?q=${encodeURIComponent(cleanName)}`;
}

function getCountryName(universityName) {
    // First try to get from main data
    const university = data.find(uni => uni.University === universityName);
    if (university && university.Country) {
        return university.Country;
    }
    
    // If not in main data, try to match from country-info.csv
    const countryInfo = countryData.find(uni => 
        uni.institution && universityName && 
        (uni.institution.toLowerCase().includes(universityName.toLowerCase()) ||
         universityName.toLowerCase().includes(uni.institution.toLowerCase()))
    );
    
    if (countryInfo && countryInfo.countryabbrv) {
        // Convert country code to country name
        const countryCodeMap = {
            'us': 'United States',
            'ca': 'Canada',
            'cn': 'China',
            'gb': 'United Kingdom',
            'de': 'Germany',
            'fr': 'France',
            'jp': 'Japan',
            'au': 'Australia',
            'in': 'India',
            'kr': 'South Korea',
            'it': 'Italy',
            'es': 'Spain',
            'nl': 'Netherlands',
            'ch': 'Switzerland',
            'se': 'Sweden',
            'no': 'Norway',
            'dk': 'Denmark',
            'fi': 'Finland',
            'il': 'Israel',
            'sg': 'Singapore',
            'hk': 'Hong Kong',
            'tw': 'Taiwan',
            'br': 'Brazil',
            'mx': 'Mexico',
            'ru': 'Russia',
            'pl': 'Poland',
            'cz': 'Czech Republic',
            'at': 'Austria',
            'be': 'Belgium',
            'ie': 'Ireland',
            'pt': 'Portugal',
            'gr': 'Greece',
            'tr': 'Turkey',
            'za': 'South Africa',
            'eg': 'Egypt',
            'ng': 'Nigeria',
            'ke': 'Kenya',
            'ma': 'Morocco',
            'tn': 'Tunisia',
            'dz': 'Algeria',
            'gh': 'Ghana',
            'et': 'Ethiopia',
            'ug': 'Uganda',
            'tz': 'Tanzania',
            'zw': 'Zimbabwe',
            'bw': 'Botswana',
            'na': 'Namibia',
            'zm': 'Zambia',
            'mw': 'Malawi',
            'mz': 'Mozambique',
            'mg': 'Madagascar',
            'sn': 'Senegal',
            'ci': 'Ivory Coast',
            'bf': 'Burkina Faso',
            'ml': 'Mali',
            'ne': 'Niger',
            'td': 'Chad',
            'cm': 'Cameroon',
            'cf': 'Central African Republic',
            'cd': 'Democratic Republic of the Congo',
            'cg': 'Republic of the Congo',
            'ga': 'Gabon',
            'gq': 'Equatorial Guinea',
            'st': 'Sao Tome and Principe',
            'ao': 'Angola',
            'cv': 'Cape Verde',
            'gw': 'Guinea-Bissau',
            'gn': 'Guinea',
            'sl': 'Sierra Leone',
            'lr': 'Liberia',
            'gm': 'Gambia',
            'mr': 'Mauritania',
            'eh': 'Western Sahara',
            'ly': 'Libya',
            'sd': 'Sudan',
            'ss': 'South Sudan',
            'er': 'Eritrea',
            'dj': 'Djibouti',
            'so': 'Somalia',
            'rw': 'Rwanda',
            'bi': 'Burundi',
            'bj': 'Benin',
            'tg': 'Togo',
            'ls': 'Lesotho',
            'sz': 'Swaziland',
            'mu': 'Mauritius',
            'sc': 'Seychelles',
            'km': 'Comoros',
            'yt': 'Mayotte',
            're': 'Reunion',
            'sh': 'Saint Helena',
            'ac': 'Ascension Island',
            'ta': 'Tristan da Cunha'
        };
        
        return countryCodeMap[countryInfo.countryabbrv] || countryInfo.countryabbrv.toUpperCase();
    }
    
    return 'Unknown Country';
}


function getFieldMaxScore(field) {
    let maxScore = 0;
    
    // Find the maximum score for a specific field across all universities
    data.forEach(university => {
        const score = getRawScore(university.University, field);
        if (score > maxScore) {
            maxScore = score;
        }
    });
    
    return maxScore;
}

function getTopFields(universityName, chartData) {
    const topFields = [];
    
    chartData.forEach(item => {
        // Check if this university has the highest score in this specific field
        const fieldMaxScore = getFieldMaxScore(item.field);
        const isTop = item.score === fieldMaxScore && item.score > 0;
        if (isTop) {
            // Get the display name for the field
            const displayName = getFieldDisplayName(item.field);
            topFields.push(displayName);
        }
    });
    
    return topFields;
}

function getFieldDisplayName(field) {
    const displayNames = {
        'Machine Learning': 'Machine Learning',
        'Computer Vision & Image Processing': 'Computer Vision'
    };
    return displayNames[field] || field;
}

function generateChartIcon(universityName) {
    return `<i class="fas fa-chart-bar chart-icon" onclick="toggleChartStats('${universityName.replace(/'/g, "\\'")}', this.closest('tr'))" title="View field statistics"></i>`;
}

function toggleChartStats(universityName, row) {
    // Check if chart is already expanded (look in next sibling row)
    const nextRow = row.nextElementSibling;
    if (nextRow && nextRow.classList.contains('chart-stats-row')) {
        nextRow.remove();
        return;
    }
    
    const university = data.find(u => u.University === universityName);
    if (!university) return;
    
    const selectedCats = getSelectedCategories();
    const chartData = selectedCats.map(field => ({
        field: field,
        score: getRawScore(universityName, field)
    })).filter(item => item.score > 0);
    
    if (chartData.length === 0) return;
    
    // Create chart row
    const chartRow = document.createElement('tr');
    chartRow.classList.add('chart-stats-row');
    
    // Check for top performers using field-specific maximums
    const topFields = getTopFields(universityName, chartData);
    
    let chartHTML = '<td colspan="3"><div class="chart-stats-container">';
    chartHTML += '<h4>Field Statistics</h4>';
    
    // Add top performer notice if any
    if (topFields.length > 0) {
        chartHTML += '<div class="top-performer-notice">';
        chartHTML += '<i class="fas fa-trophy"></i>';
        chartHTML += '<span>Top of ' + topFields.join(', ') + '</span>';
        chartHTML += '</div>';
    }
    
    chartHTML += '<div class="chart-bars">';
    
    chartData.forEach(item => {
        // Use field-specific maximum for scaling
        const fieldMaxScore = getFieldMaxScore(item.field);
        const percentage = (item.score / fieldMaxScore) * 100;
        chartHTML += `
            <div class="chart-bar-item">
                <div class="chart-bar-label">${item.field}</div>
                <div class="chart-bar-container">
                    <div class="chart-bar" style="width: ${percentage}%"></div>
                    <div class="chart-bar-value">${item.score.toFixed(2)}</div>
                </div>
            </div>
        `;
    });
    
    chartHTML += '</div></div></td>';
    chartRow.innerHTML = chartHTML;
    
    // Insert after current row
    row.parentNode.insertBefore(chartRow, row.nextSibling);
}

function exportData() {
    if (lastFiltered.length === 0) {
        alert('No data to export');
        return;
    }
    
    const csvContent = [
        ['Rank', 'University', 'Continent', 'Impact Score'],
        ...lastFiltered.map((uni, index) => [
            index + 1,
            uni.University,
            uni.Continent,
            uni.Score.toFixed(2)
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-rankings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function showAbout() {
    alert('AI Research Impact Rankings\n\nThis ranking system measures academic excellence through research influence and impact, using LLM analysis to identify the most important references in academic papers.\n\nBuilt with ❤️ for academic transparency.');
}

// Demo notice functions removed

// Initialize the application
initialize();