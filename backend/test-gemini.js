const { generateInsights } = require('./dist/insights/gemini.js');
generateInsights({ transport: 500, home: 200, diet: 1500, consumption: 300 }, { transport: { car_km_per_week: 100 }, diet: { type: 'vegetarian' }, home: { household_size: 1 }, consumption: { recycling_pct: 0 } }).then(console.log).catch(console.error);
