const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'src/lib/ev_cars.csv');
const outPath = path.join(__dirname, 'src/lib/ev-cars.ts');

const csv = fs.readFileSync(csvPath, 'utf-8');
const lines = csv.split('\n').filter(line => line.trim() !== '');

const headers = lines[0].split(',');

const cars = [];

function generateSlug(brand, model, capacity) {
    const raw = `${brand}-${model}-${capacity}kwh`.toLowerCase();
    return raw.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    // Simple CSV parser handling quotes
    let cols = [];
    let curr = '';
    let inQuotes = false;
    for (let c = 0; c < row.length; c++) {
        const char = row[c];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            cols.push(curr);
            curr = '';
        } else {
            curr += char;
        }
    }
    cols.push(curr);

    // Columns: Country/Region,Brand Name,Car Model,Year of Manufacturing,Battery Type,Battery Capacity (kWh),Charging Time (Slow),Charging Time (Fast),Reviews,Range (km/miles),Important Details
    const country = cols[0] || '';
    const brand = cols[1] || '';
    const model = cols[2] || '';
    const year = cols[3] || '';
    const batteryType = cols[4] || '';
    const capacityStr = cols[5] || '0';
    const rangeStr = cols[9] || '0';

    const capacity = parseFloat(capacityStr.replace(/[^0-9.]/g, '')) || 0;
    const range = parseInt(rangeStr.replace(/[^0-9]/g, ''), 10) || 0;
    const rangeUnit = rangeStr.toLowerCase().includes('mile') ? 'miles' : 'km';

    if (brand && model && capacity) {
        const slug = generateSlug(brand, model, capacity);
        cars.push({
            brand,
            model,
            capacity,
            batteryType,
            range,
            rangeUnit,
            year,
            country,
            slug
        });
    }
}

const outputContent = `// Auto-generated EV car database from user CSV

export type EVCar = {
  brand: string;
  model: string;
  capacity: number; // kWh
  batteryType: string;
  range: number;
  rangeUnit: 'km' | 'miles';
  year: string;
  country: string;
  slug: string;
};

export const EV_CARS: EVCar[] = ${JSON.stringify(cars, null, 2)};
`;

fs.writeFileSync(outPath, outputContent);
console.log('Successfully generated ev-cars.ts with ' + cars.length + ' cars.');
