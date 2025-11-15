let data = [];
let facultyData = [];
let categories = [];
let selectedRegion = 'all';
let lastFiltered = [];
let selectedCountry = 'all';
let expandedRows = new Set();
let facultyFieldStats = {};
let RENDERED_FIELDS = [];

const ACTIVE_FIELDS = [
    "Machine Learning",
    "Computer Vision & Image Processing",
    "Natural Language Processing",
    "The Web & Information Retrieval",
];

const DISPLAY_LABELS = {
    'Machine Learning': 'Machine Learning',
    'Computer Vision & Image Processing': 'Computer Vision & Image Processing',
    'Natural Language Processing': 'Natural Language Processing',
    'The Web & Information Retrieval': 'The Web & Information Retrieval'
};

const EPS = 1e-9;
// const NORMALIZE = 'unit-variance';
// const NORMALIZE = 'mean-based';
const NORMALIZE = 'target-sum'; 
const FIELD_TARGET_TOTAL = 500; 
let fieldStats = {};

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

async function initialize() {
    // data = await loadCSV('3_f_1.csv');
    // facultyData = await loadCSV('3_faculty_score.csv');
    data = await loadCSV('4_f_log_ranking.csv');
    facultyData = await loadCSV('4_faculty_logscore.csv');

    // Extract categories dynamically
    if (data.length > 0) {
        const columns = Object.keys(data[0]);
        categories = columns.slice(2); // Assume categories start at index 2
    }

    renderFieldCheckboxes();
    setupFieldFilter();
    computeFieldStats();
    // computeFacultyFieldStats();
    setupRegionFilter();
    setupCountryFilter();
    displayRankings();
}

function allowedFields() {
    const headers = data.length ? Object.keys(data[0]) : [];
    return ACTIVE_FIELDS.filter(f => headers.includes(f));
  }
  

function renderFieldCheckboxes() {
    const container = document.getElementById('fieldCheckboxContainer');
    const headers = data.length ? Object.keys(data[0]) : [];

    RENDERED_FIELDS = ACTIVE_FIELDS.filter(f => headers.includes(f));

    container.innerHTML = RENDERED_FIELDS.map(f => {
        const id = toId(f);
        const label = DISPLAY_LABELS[f] || f;
        return `
            <label class="checkbox-item" for="${id}">
                <input type="checkbox" id="${id}" class="field-checkbox" data-field="${f}" checked>
                <span>${label}</span>
            </label>
        `;
    }).join('');

    if (RENDERED_FIELDS.length === 0) {
        console.warn('None of ACTIVE_FIELDS exist in CSV headers:', ACTIVE_FIELDS);
    }
}

function setupCountryFilter() {
    const sel = document.getElementById('countryFilter');
    sel.addEventListener('change', () => {
        selectedCountry = sel.value;
        resetPageAndDisplayRankings();
    });
    refreshCountryFilterOptions();
}

function refreshCountryFilterOptions() {
    const sel = document.getElementById('countryFilter');
    
    // Get filtered data based on current region
    const filteredData = selectedRegion === 'all'
        ? data
        : data.filter(r => r.Continent?.trim().toLowerCase() === selectedRegion.toLowerCase());
    
    // Extract unique countries from filtered data
    const countries = Array.from(new Set(
        filteredData
            .map(r => r.Country?.trim())
            .filter(s => s && s.toLowerCase() !== 'unknown')
    )).sort((a, b) => a.localeCompare(b));

    const currentCountry = selectedCountry;
    
    // Rebuild dropdown options
    sel.innerHTML = '<option value="all">All Countries</option>' +
        countries.map(c => `<option value="${c}">${c}</option>`).join('');
    
    // Reset country selection if it's no longer available
    if (currentCountry !== 'all' && !countries.includes(currentCountry)) {
        selectedCountry = 'all';
    }
    sel.value = selectedCountry;
}

function computeFieldStats() {
    fieldStats = {};
    // const cols = (categories && categories.length) ? categories : ACTIVE_FIELDS;
    // const cols = allowedFields();
    const cols = RENDERED_FIELDS.length ? RENDERED_FIELDS : ACTIVE_FIELDS;
    // const cols = ACTIVE_FIELDS;
    cols.forEach(cat => {
        const vals = data
            .map(r => parseFloat(r[cat]))
            .filter(v => !isNaN(v) && v > 0);
        const n   = vals.length;
        const sum = n ? vals.reduce((a, b) => a + b, 0) : 0;
        const mean = n ? sum / n : 0;
        // const varSample = n>1 ? vals.reduce((a,b)=>a+(b-mean)*(b-mean),0)/(n-1) : 0;
        // const std = Math.sqrt(varSample);
        // fieldStats[cat] = { mean, std };
        // fieldStats[cat] = { mean };
        const scale = sum > EPS ? (FIELD_TARGET_TOTAL / sum) : 0;
        fieldStats[cat] = { mean, count: n, sum, scale };
    });
}

function normalizeFieldValue(raw, field) {
    if (!(raw > 0)) return 0;
    const stats = fieldStats[field] || {};

    if (NORMALIZE === 'target-sum') {
        const scale = (stats.scale > EPS) ? stats.scale : 0;
        return raw * scale;
    } else if (NORMALIZE === 'unit-variance') {
        const std = (stats.std > EPS) ? stats.std : 1;
        return raw / std;
    } else {
        const mean = (stats.mean > EPS) ? stats.mean : 1;
        return raw / mean;
    }
}

function setupFieldFilter() {
    // Add event listeners to all field checkboxes
    const checkboxes = document.querySelectorAll('.field-checkbox');

    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    if (!anyChecked) {
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateToggleAllFieldsButton();
            resetPageAndDisplayRankings();
        });
    });
    updateToggleAllFieldsButton();
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
    regionFilter.addEventListener('change', () => {
        selectedRegion = regionFilter.value;
        refreshCountryFilterOptions(); // Update countries when region changes
        resetPageAndDisplayRankings();
    });
}

function resetPageAndDisplayRankings() {
    selectedRegion = document.getElementById('regionFilter').value;
    expandedRows.clear(); // Clear expanded rows when filters change
    displayRankings();
}

function getSelectedCategories() {
    const picked = [...document.querySelectorAll('.field-checkbox:checked')]
                 .map(el => el.dataset.field);
     const base = RENDERED_FIELDS.length ? RENDERED_FIELDS : ACTIVE_FIELDS;
    return picked.length ? picked.filter(f => base.includes(f)) : base;
}

function getRawScore(univ, field) {
    const row = data.find(e => e.University === univ);
    if (!row) return 0;
    const s = parseFloat(row[field]);
    return isNaN(s) ? 0 : s;
}

function getNormalizedScore(univ, field) {
    // const s = getRawScore(univ, field);
    // if (!(s > 0)) return 0;
    // const stats = fieldStats[field] || { std: 1 };
    // const stats = fieldStats[field] || { mean: 1 };
    // const std = stats.std > EPS ? stats.std : 1;
    // const mean = stats.mean > EPS ? stats.mean : 1;
    // return s / mean;
    const s = getRawScore(univ, field);
    return normalizeFieldValue(s, field);
}

// function computeFacultyFieldStats() {
//     facultyFieldStats = {};
//     const cols = ACTIVE_FIELDS;
//     cols.forEach(cat => {
//         const vals = facultyData
//             .filter(f => f.Category === cat)
//             .map(f => parseFloat(f.Score))
//             .filter(v => !isNaN(v) && v > 0);
//         const n = vals.length;
//         const mean = n ? vals.reduce((a,b)=>a+b,0)/n : 0;
//         facultyFieldStats[cat] = { mean };
//     });
// }

function getFacultyForUniversity(universityName, selectedCategories) {
    // First, get ALL faculty data for this university to calculate main fields from all fields
    const allFacultyForUniversity = facultyData.filter(faculty => {
        return faculty.University === universityName;
    });
    
    // Then filter by selected categories to determine which faculty to show
    const filteredFaculty = allFacultyForUniversity.filter(faculty => {
        const matchesCategory = selectedCategories.length === 0 || 
                                selectedCategories.includes(faculty.Category);
        return matchesCategory;
    });

    const facultyMap = new Map();
    
    // Process ALL faculty data to build complete field scores for main field calculation
    allFacultyForUniversity.forEach(faculty => {
        const name = faculty['Faculty Name'] || 'Unknown';
        const rawScore = parseFloat(faculty.Score) || 0;
        const category = faculty.Category || 'Unknown';
        
        // Normalize faculty score by field mean
        // const stats = fieldStats[category] || { mean: 1 };
        // const mean = stats.mean > EPS ? stats.mean : 1;
        // const normalizedScore = rawScore / mean;
        const normalizedScore = normalizeFieldValue(rawScore, category);
        
        if (!facultyMap.has(name)) {
            facultyMap.set(name, {
                name,
                totalScore: 0,
                paperCount: 0,
                rawScore: 0,  // Sum raw scores for total paper contributions
                categoriesSet: new Set(),
                fieldScores: {},
                hasSelectedCategory: false  // Track if faculty has contributions in selected categories
            });
        }
        
        const facultyInfo = facultyMap.get(name);
        facultyInfo.categoriesSet.add(category);
        facultyInfo.fieldScores[category] = (facultyInfo.fieldScores[category] || 0) + normalizedScore;
        
        // Only add to totalScore and counts if this category is in selected categories
        if (selectedCategories.length === 0 || selectedCategories.includes(category)) {
            facultyInfo.totalScore += normalizedScore;
            facultyInfo.rawScore += rawScore;
            facultyInfo.paperCount += 1;
            facultyInfo.hasSelectedCategory = true;
        }
    });
    
    const mergedFaculty = Array.from(facultyMap.values()).map(facultyInfo => {
        const entries = Object.entries(facultyInfo.fieldScores);
        let maxScore = 0;
        entries.forEach(([, score]) => {
            if (score > maxScore) maxScore = score;
        });

        const threshold = maxScore * 0.3;
        const mainFields = entries.length
            ? entries
                .filter(([field, score]) => {
                    if (score === maxScore) return true;
                    return maxScore > 0 && score >= threshold;
                })
                .map(([field]) => field)
            : Array.from(facultyInfo.categoriesSet);

        // Ensure at least one field is marked as main
        const effectiveFields = mainFields.length ? mainFields : Array.from(facultyInfo.categoriesSet);
        
        return {
            name: facultyInfo.name,
            totalScore: facultyInfo.totalScore,
            paperCount: facultyInfo.paperCount,
            rawScore: facultyInfo.rawScore,
            categories: effectiveFields,
            allFields: Array.from(facultyInfo.categoriesSet),
            hasSelectedCategory: facultyInfo.hasSelectedCategory
        };
    })
    .filter(facultyInfo => facultyInfo.hasSelectedCategory)  // Only show faculty with contributions in selected categories
    .sort((a, b) => b.totalScore - a.totalScore);
    
    return mergedFaculty;
}

function generateGoogleScholarLink(facultyName, universityName = '') {
    const q = (facultyName || '').trim().replace(/\s+/g, ' ');
    return `https://scholar.google.com/citations?view_op=search_authors&mauthors=${encodeURIComponent(q)}`;
}

function generateDBLPLink(facultyName) {
    // Clean name, remove special characters, join with spaces
    const cleanName = facultyName.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    // return `https://dblp.org/search?q=${encodeURIComponent(cleanName)}`;
    return `https://dblp.org/search?q=author%3A${encodeURIComponent(cleanName.replace(/\s+/g,'_'))}%3A`;
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
        rowElement.querySelector('.expand-icon').innerHTML = '▶';
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
                const rawScore = faculty.rawScore || 0;
                const fieldsDisplayFull = faculty.categories.join(', ') || 'N/A';
                const googleScholarLink = generateGoogleScholarLink(faculty.name);
                const dblpLink = generateDBLPLink(faculty.name);
                
                // Create colored field badges
                const fieldsHTML = faculty.categories.length > 0
                    ? faculty.categories.map(f => {
                        const abbr = getFieldAbbreviation(f);
                        const fieldClass = getFieldColorClass(f);
                        return `<span class="field-badge ${fieldClass}" title="${f}">${abbr}</span>`;
                    }).join(' ')
                    : '<span class="field-badge field-default">N/A</span>';
                
                facultyHTML += `
                    <tr class="faculty-row">
                        <td class="faculty-name-cell">
                            <span class="faculty-name">${faculty.name}</span>
                            <span class="faculty-fields-display" title="Main Fields: ${fieldsDisplayFull}">
                                ${fieldsHTML}
                            </span>
                        </td>
                        <td class="faculty-info-cell">
                            <div class="faculty-info-links">
                                <span class="score-display" title="Contribution Score: ${faculty.totalScore.toFixed(4)}">
                                    <i class="fas fa-chart-line"></i>
                                    <span class="link-text">${faculty.totalScore.toFixed(4)}</span>
                                </span>
                                <!-- <span class="info-item" title="Main Fields: ${fieldsDisplayFull}">
                                    <i class="fas fa-tags"></i>
                                    <span class="link-text">${faculty.categories.length} main field${faculty.categories.length !== 1 ? 's' : ''}</span>
                                </span> -->
                                <!-- <a href="#" class="info-link fields-toggle" data-faculty="${faculty.name}" title="Research Fields Distribution - Click to view chart">
                                    <i class="fas fa-chart-bar"></i>
                                </a> -->
                                <a href="${dblpLink}" target="_blank" rel="noopener noreferrer" class="info-link" title="DBLP">
                                    <i class="fas fa-file-alt"></i>
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
        'The Web & Information Retrieval': 'WEB+IR',
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

function getFieldColorClass(field) {
    const colorClasses = {
        'Machine Learning': 'field-ml',
        'Computer Vision & Image Processing': 'field-vision',
        'Natural Language Processing': 'field-nlp',
        'The Web & Information Retrieval': 'field-web-ir'
    };
    return colorClasses[field] || 'field-default';
}

function displayRankings() {
    showLoadingSpinner();
    
    // Simulate loading delay for better UX
    setTimeout(() => {
        const calculatedScores = [];
        const seenUniversities = new Set();
        const selectedCats = getSelectedCategories();

        data.forEach(university => {
            if (selectedRegion !== 'all' && university.Continent) {
                const match = university.Continent.trim().toLowerCase() === selectedRegion.toLowerCase();
                if (!match) return;
            }
            if (selectedCountry !== 'all') {
                const country = (university.Country || '').trim();
                if (!country || country !== selectedCountry) return;
            }

            let totalScore = 0;
            selectedCats.forEach(cat => {
                totalScore += getNormalizedScore(university.University, cat);
            });

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

function displayAllRankings(data) {
    const table = document.getElementById('rankingTable');
    const tableBody = table.querySelector('tbody');
    tableBody.innerHTML = '';

    data.forEach((university, index) => {
        const row = tableBody.insertRow();
        row.classList.add('university-row', 'fade-in');
        
        const rank = index + 1;
        const countryFlag = getCountryFlag(university.University);
        const flagHtml = countryFlag ? `<img src="${countryFlag}" alt="Flag" class="country-flag-img" onerror="this.style.display='none'">` : '';
        const chartIcon = generateChartIcon(university.University);
        
        const universityCell = `
            <td class="rank-col">${rank}</td>
            <td class="institution-col university-name-cell">
                <span class="expand-icon" onclick="toggleUniversityDropdown('${university.University.replace(/'/g, "\\'")}', this.closest('tr'))">▶</span>
                <span class="university-name" title="View details" onclick="toggleUniversityDropdown('${university.University.replace(/'/g, "\\'")}', this.closest('tr'))">${university.University}</span>
                ${flagHtml}
                ${chartIcon}
            </td>
            <td class="score-col">
                <span class="score-value">${university.Score.toFixed(2)}</span>
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
    
    // Count unique authors from faculty data for filtered universities and selected categories
    const selectedCats = getSelectedCategories();
    const filteredUniversityNames = new Set(data.map(uni => uni.University));
    
    const uniqueAuthors = new Set();
    facultyData.forEach(faculty => {
        // Check if faculty's university is in the filtered list
        if (filteredUniversityNames.has(faculty.University)) {
            // Check if faculty's category is in selected categories
            if (selectedCats.length === 0 || selectedCats.includes(faculty.Category)) {
                const authorName = faculty['Faculty Name'];
                if (authorName) {
                    uniqueAuthors.add(authorName);
                }
            }
        }
    });
    
    const totalAuthors = uniqueAuthors.size;
    const activeFilters = getActiveFilterCount();
    
    document.getElementById('totalUniversities').textContent = totalUniversities.toLocaleString();
    document.getElementById('totalScore').textContent = totalAuthors.toLocaleString();
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

// Country name to country code mapping 
const COUNTRY_NAME_TO_CODE = {
    'United States': 'us', 'Canada': 'ca', 'United Kingdom': 'gb', 'Germany': 'de',
    'France': 'fr', 'Italy': 'it', 'Spain': 'es', 'Netherlands': 'nl', 'Sweden': 'se',
    'Norway': 'no', 'Denmark': 'dk', 'Finland': 'fi', 'Switzerland': 'ch', 'Austria': 'at',
    'Belgium': 'be', 'Ireland': 'ie', 'Poland': 'pl', 'Czech Republic': 'cz', 'Hungary': 'hu',
    'Slovakia': 'sk', 'Slovenia': 'si', 'Croatia': 'hr', 'Romania': 'ro', 'Bulgaria': 'bg',
    'Greece': 'gr', 'Cyprus': 'cy', 'Malta': 'mt', 'Luxembourg': 'lu', 'Estonia': 'ee',
    'Latvia': 'lv', 'Lithuania': 'lt', 'Portugal': 'pt', 'Russia': 'ru', 'Ukraine': 'ua',
    'Belarus': 'by', 'Moldova': 'md', 'Turkey': 'tr', 'Israel': 'il', 'United Arab Emirates': 'ae',
    'Saudi Arabia': 'sa', 'Qatar': 'qa', 'Kuwait': 'kw', 'Bahrain': 'bh', 'Oman': 'om',
    'Yemen': 'ye', 'Jordan': 'jo', 'Lebanon': 'lb', 'Syria': 'sy', 'Iraq': 'iq', 'Iran': 'ir',
    'China': 'cn', 'Japan': 'jp', 'South Korea': 'kr', 'Taiwan': 'tw', 'Hong Kong': 'hk',
    'Singapore': 'sg', 'Malaysia': 'my', 'Thailand': 'th', 'Vietnam': 'vn', 'Philippines': 'ph',
    'Indonesia': 'id', 'Myanmar': 'mm', 'Laos': 'la', 'Cambodia': 'kh', 'Brunei': 'bn',
    'India': 'in', 'Pakistan': 'pk', 'Bangladesh': 'bd', 'Sri Lanka': 'lk', 'Maldives': 'mv',
    'Nepal': 'np', 'Bhutan': 'bt', 'Afghanistan': 'af', 'Uzbekistan': 'uz', 'Kazakhstan': 'kz',
    'Kyrgyzstan': 'kg', 'Tajikistan': 'tj', 'Turkmenistan': 'tm', 'Mongolia': 'mn',
    'Australia': 'au', 'New Zealand': 'nz', 'Fiji': 'fj', 'Papua New Guinea': 'pg',
    'Solomon Islands': 'sb', 'Vanuatu': 'vu', 'New Caledonia': 'nc', 'French Polynesia': 'pf',
    'Samoa': 'ws', 'Tonga': 'to', 'Kiribati': 'ki', 'Tuvalu': 'tv', 'Nauru': 'nr',
    'South Africa': 'za', 'Egypt': 'eg', 'Libya': 'ly', 'Tunisia': 'tn', 'Algeria': 'dz',
    'Morocco': 'ma', 'Sudan': 'sd', 'South Sudan': 'ss', 'Ethiopia': 'et', 'Eritrea': 'er',
    'Djibouti': 'dj', 'Somalia': 'so', 'Kenya': 'ke', 'Uganda': 'ug', 'Tanzania': 'tz',
    'Rwanda': 'rw', 'Burundi': 'bi', 'Malawi': 'mw', 'Zambia': 'zm', 'Zimbabwe': 'zw',
    'Botswana': 'bw', 'Namibia': 'na', 'Eswatini': 'sz', 'Lesotho': 'ls', 'Madagascar': 'mg',
    'Mauritius': 'mu', 'Seychelles': 'sc', 'Comoros': 'km', 'Mayotte': 'yt', 'RÃ©union': 're',
    'Mozambique': 'mz', 'Angola': 'ao', 'Democratic Republic of the Congo': 'cd',
    'Republic of the Congo': 'cg', 'Gabon': 'ga', 'Equatorial Guinea': 'gq',
    'SÃ£o TomÃ© and PrÃ­ncipe': 'st', 'Cameroon': 'cm', 'Central African Republic': 'cf',
    'Chad': 'td', 'Niger': 'ne', 'Nigeria': 'ng', 'Benin': 'bj', 'Burkina Faso': 'bf',
    'Mali': 'ml', 'Senegal': 'sn', 'Gambia': 'gm', 'Guinea': 'gn', 'Guinea-Bissau': 'gw',
    'Sierra Leone': 'sl', 'Liberia': 'lr', 'Ivory Coast': 'ci', 'Ghana': 'gh', 'Togo': 'tg',
    'Cape Verde': 'cv', 'Macao': 'mo', 'Macau': 'mo',
    'Argentina': 'ar', 'Brazil': 'br', 'Chile': 'cl', 'Colombia': 'co'
};

function getCountryFlag(institutionName) {
    // Find institution in main data 
    const university = data.find(row => 
        row.University?.trim().toLowerCase() === institutionName.trim().toLowerCase()
    );
    
    if (!university?.Country) return '';
    
    const countryCode = COUNTRY_NAME_TO_CODE[university.Country];
    return countryCode ? `https://flagcdn.com/20x15/${countryCode}.png` : '';
}

function getGlobalMaxScore(selectedCats) {
    let globalMax = 0;
    
    // Find the maximum score across all universities for the selected categories
    data.forEach(university => {
        selectedCats.forEach(field => {
            const score = getRawScore(university.University, field);
            if (score > globalMax) {
                globalMax = score;
            }
        });
    });
    
    return globalMax;
}

function getTopFields(universityName, chartData, globalMaxScore) {
    const topFields = [];
    
    chartData.forEach(item => {
        // Check if this university has the highest score in this field
        const isTop = item.score === globalMaxScore && item.score > 0;
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
        'Computer Vision & Image Processing': 'Computer Vision',
        'Natural Language Processing': 'Natural Language Processing',
        'The Web & Information Retrieval': 'The Web & Information Retrieval'
    };
    return displayNames[field] || field;
}

function getPerFieldMaxMapNormalized(selectedCats) {
    const maxMap = {};
    selectedCats.forEach(f => maxMap[f] = 0);
    data.forEach(u => {
      selectedCats.forEach(f => {
        const s = getNormalizedScore(u.University, f); 
        if (s > maxMap[f]) maxMap[f] = s;
      });
    });
    return maxMap;
}

function generateChartIcon(universityName) {
    return `<i class="fas fa-chart-bar chart-icon" onclick="toggleChartStats('${universityName.replace(/'/g, "\\'")}', this.closest('tr'))" title="View field statistics"></i>`;
}

// function toggleChartStats(universityName, row) {
//     // Check if chart is already expanded (look in next sibling row)
//     const nextRow = row.nextElementSibling;
//     if (nextRow && nextRow.classList.contains('chart-stats-row')) {
//         nextRow.remove();
//         return;
//     }

    
//     const university = data.find(u => u.University === universityName);
//     if (!university) return;
    
//     const selectedCats = getSelectedCategories();
//     const chartData = selectedCats.map(field => ({
//         field: field,
//         score: getRawScore(universityName, field)
//     })).filter(item => item.score > 0);
    
//     if (chartData.length === 0) return;
    
//     // Create chart row
//     const chartRow = document.createElement('tr');
//     chartRow.classList.add('chart-stats-row');
    
//     // Use global maximum score for consistent scaling
//     const globalMaxScore = getGlobalMaxScore(selectedCats);
    
//     // Check for top performers
//     const topFields = getTopFields(universityName, chartData, globalMaxScore);
    
//     let chartHTML = '<td colspan="3"><div class="chart-stats-container">';
//     chartHTML += '<h4>Field Statistics</h4>';
    
//     // Add top performer notice if any
//     if (topFields.length > 0) {
//         chartHTML += '<div class="top-performer-notice">';
//         chartHTML += '<i class="fas fa-trophy"></i>';
//         chartHTML += '<span>Top of ' + topFields.join(', ') + '</span>';
//         chartHTML += '</div>';
//     }
    
//     chartHTML += '<div class="chart-scale">';
//     chartHTML += '<span class="scale-label">Scale: 0 - ' + globalMaxScore.toFixed(2) + '</span>';
//     chartHTML += '</div>';
//     chartHTML += '<div class="chart-bars">';
    
//     chartData.forEach(item => {
//         const percentage = (item.score / globalMaxScore) * 100;
//         chartHTML += `
//             <div class="chart-bar-item">
//                 <div class="chart-bar-label">${item.field}</div>
//                 <div class="chart-bar-container">
//                     <div class="chart-bar" style="width: ${percentage}%"></div>
//                     <div class="chart-bar-value">${item.score.toFixed(2)}</div>
//                 </div>
//             </div>
//         `;
//     });
    
//     chartHTML += '</div></div></td>';
//     chartRow.innerHTML = chartHTML;
    
//     // Insert after current row
//     row.parentNode.insertBefore(chartRow, row.nextSibling);
// }
function toggleChartStats(universityName, row) {
    const nextRow = row.nextElementSibling;
    if (nextRow && nextRow.classList.contains('chart-stats-row')) {
      nextRow.remove();
      return;
    }
  
    const university = data.find(u => u.University === universityName);
    if (!university) return;
  
    const selectedCats = getSelectedCategories();
  
    const chartData = selectedCats.map(field => {
      const raw = getRawScore(universityName, field);
      if (!(raw > 0)) return null;
      const norm = getNormalizedScore(universityName, field);
      return { field, raw, score: norm };   // use normalized score
    }).filter(Boolean);
  
    if (chartData.length === 0) return;
  
    const perFieldMax = getPerFieldMaxMapNormalized(selectedCats);
  
    const chartRow = document.createElement('tr');
    chartRow.classList.add('chart-stats-row');
  
    let chartHTML = '<td colspan="3"><div class="chart-stats-container">';
    chartHTML += '<h4>Field Statistics</h4>';
    chartHTML += '<div class="chart-bars">';
  
    chartData.forEach(item => {
      const cap = perFieldMax[item.field] || 1;
      const pct = Math.min(100, (item.score / cap) * 100);
      chartHTML += `
        <div class="chart-bar-item">
          <div class="chart-bar-label">${getFieldDisplayName(item.field)}</div>
          <div class="chart-bar-container">
            <div class="chart-bar" style="width:${pct}%"></div>
            <div class="chart-bar-value">${item.score.toFixed(2)}</div>
          </div>
        </div>
      `;
    });
  
    chartHTML += '</div></div></td>';
    chartRow.innerHTML = chartHTML;
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

function toggleDemoNotice() {
    const notice = document.querySelector('.demo-notice');
    notice.style.display = 'none';
    document.querySelector('.main-header').style.marginTop = '0';
}

function toggleDescription(event) {
    event.preventDefault();
    const shortDesc = document.getElementById('shortDescription');
    const fullDesc = document.getElementById('fullDescription');
    const link = document.getElementById('readMoreLink');
    
    if (fullDesc.style.display === 'none') {
        shortDesc.style.display = 'none';
        fullDesc.style.display = 'inline';
        link.textContent = 'read less';
    } else {
        shortDesc.style.display = 'inline';
        fullDesc.style.display = 'none';
        link.textContent = 'read more';
    }
}

// Initialize the application
initialize();