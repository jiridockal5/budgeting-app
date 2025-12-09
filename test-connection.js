// Test database connection with different password encodings
require('dotenv').config();

const connectionStrings = {
  raw: process.env.DATABASE_URL,
  prisma: process.env.POSTGRES_PRISMA_URL,
};

console.log('Testing Connection Strings...\n');

// Check what we have
console.log('DATABASE_URL exists:', !!connectionStrings.raw);
console.log('POSTGRES_PRISMA_URL exists:', !!connectionStrings.prisma);
console.log('');

// Show connection details (without password)
if (connectionStrings.prisma) {
  try {
    const url = new URL(connectionStrings.prisma.replace('postgresql://', 'http://'));
    console.log('POSTGRES_PRISMA_URL details:');
    console.log('  Host:', url.hostname);
    console.log('  Port:', url.port);
    console.log('  User:', url.username);
    console.log('  Password length:', url.password ? url.password.length : 0);
    console.log('  Password starts with:', url.password ? url.password.substring(0, 5) + '...' : 'none');
    console.log('  Has special chars:', /[%$!@#]/.test(url.password || ''));
    console.log('');
  } catch (e) {
    console.log('Could not parse POSTGRES_PRISMA_URL');
  }
}

console.log('Next: Try with the EXACT connection string from Vercel');
console.log('Make sure to copy it EXACTLY as shown in Vercel.');
