const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables...');

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('📋 .env file already exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (envContent.includes('DATABASE_URL')) {
    console.log('✅ DATABASE_URL is already configured');
  } else {
    console.log('⚠️ DATABASE_URL is missing from .env file');
  }
} else {
  console.log('📝 Creating .env file...');
  
  const envTemplate = `# Database Configuration
# Replace with your actual Supabase connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Next.js Configuration
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Supabase Configuration (if using Supabase Auth)
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Other Configuration
NODE_ENV="development"
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ .env file created');
  console.log('📋 Please update the DATABASE_URL with your actual Supabase connection string');
}

console.log('\n📖 Instructions:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to Settings > Database');
console.log('3. Copy the connection string');
console.log('4. Replace [YOUR-PASSWORD] with your database password');
console.log('5. Replace [YOUR-PROJECT-REF] with your project reference');
console.log('6. Save the .env file');
console.log('7. Restart your development server');

console.log('\n🔗 Example DATABASE_URL format:');
console.log('postgresql://postgres:your-password@db.abcdefghijklmnop.supabase.co:5432/postgres');
