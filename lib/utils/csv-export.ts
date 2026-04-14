/**
 * Tactical CSV Export Utility
 * Handles flattening of deep objects (metadata/branches) for clinical auditing.
 */

export function exportToCSV(data: any[], filename: string) {
    if (!data || !data.length) return;

    // 1. Flatten the data objects
    const flattenedData = data.map(item => flattenObject(item));
    
    // 2. Extract unique headers
    const headers = Array.from(new Set(flattenedData.flatMap(obj => Object.keys(obj))));
    
    // 3. Construct CSV rows
    const csvRows = [
        headers.join(','), // Header row
        ...flattenedData.map(row => 
            headers.map(header => {
                const val = row[header];
                // Sanitize: Handle commas, quotes, and newlines
                if (val === undefined || val === null) return '""';
                const strVal = String(val).replace(/"/g, '""').replace(/\n/g, ' ');
                return `"${strVal}"`;
            }).join(',')
        )
    ];

    // 4. Create and trigger download
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Deep flattening helper for clinical metadata
 */
function flattenObject(obj: any, prefix = ''): any {
    return Object.keys(obj).reduce((acc: any, k: string) => {
        const pre = prefix.length ? prefix + '_' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
            Object.assign(acc, flattenObject(obj[k], pre + k));
        } else if (Array.isArray(obj[k])) {
            acc[pre + k] = JSON.stringify(obj[k]);
        } else {
            acc[pre + k] = obj[k];
        }
        return acc;
    }, {});
}
