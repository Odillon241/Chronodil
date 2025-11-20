const fs = require('fs');
const path = require('path');

const authFile = path.join(__dirname, '..', 'src/lib/auth.ts');
let content = fs.readFileSync(authFile, 'utf8');

// Replace the incorrect password configuration with the correct one
const incorrectConfig = `  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Configure bcrypt for Supabase compatibility
    async password(password: string) {
      return {
        hash: await hash(password, 10),
        async verify(hash: string, password: string) {
          return await compare(password, hash);
        },
      };
    },
  },`;

const correctConfig = `  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    // Configure bcrypt for Supabase compatibility
    password: {
      async hash(password: string) {
        return await hash(password, 10);
      },
      async verify(data: { hash: string; password: string }) {
        return await compare(data.password, data.hash);
      },
    },
  },`;

content = content.replace(incorrectConfig, correctConfig);

fs.writeFileSync(authFile, content, 'utf8');
console.log('✅ Fixed bcrypt configuration in auth.ts');
