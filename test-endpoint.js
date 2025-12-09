// Test the forecast endpoint
const http = require('http');

console.log('🧪 Testing Forecast Endpoint\n');
console.log('='.repeat(60) + '\n');
console.log('Sending request to: http://localhost:3001/api/test-forecast\n');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/test-forecast',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
    console.log('\nResponse Body:\n');
    
    try {
      const json = JSON.parse(data);
      if (json.success) {
        console.log('✅ SUCCESS! Forecast engine is working!\n');
        console.log('Summary:');
        console.log(`  Scenario: ${json.summary.scenarioName}`);
        console.log(`  Months: ${json.summary.months}`);
        console.log(`  Starting MRR: $${json.summary.startingMrr.toFixed(2)}`);
        console.log(`  Ending MRR: $${json.summary.endingMrr.toFixed(2)}`);
        console.log(`  Growth: ${json.summary.growthPercentage}%`);
        console.log(`  Total New Customers: ${json.summary.totalNewCustomers}`);
        console.log('\n✅ Everything is working!');
      } else {
        console.log('❌ Error:', json.error || 'Unknown error');
        if (json.hint) {
          console.log('💡 Hint:', json.hint);
        }
        if (json.stack) {
          console.log('\nStack trace:');
          console.log(json.stack);
        }
      }
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n💡 Make sure:');
  console.log('  1. Dev server is running (npm run dev)');
  console.log('  2. Migration was applied successfully');
  console.log('  3. Prisma client was generated');
});

req.end();
