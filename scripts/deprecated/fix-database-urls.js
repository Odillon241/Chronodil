const fs = require('fs');
const path = require('path');

const files = ['.env', '.env.production'];

const incorrectHost = 'db.ipghppjjhjbkhuqzqzyq.supabase.co:6543';
const correctHost = 'aws-1-us-east-2.pooler.supabase.com:6543';

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${file} does not exist, skipping...`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(incorrectHost)) {
    content = content.replace(
      new RegExp(incorrectHost, 'g'),
      correctHost
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${file}`);
  } else {
    console.log(`ℹ️  ${file} already has correct host`);
  }
});

console.log('\n🎉 Database URLs fixed!');
console.log('\n📝 Next steps:');
console.log('1. Go to Vercel Dashboard → Settings → Environment Variables');
console.log('2. Update DATABASE_URL to:');
console.log('   postgresql://postgres.ipghppjjhjbkhuqzqzyq:Reviti2025%40@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1');
console.log('3. Redeploy your application');
