const fs = require('fs');
const path = require('path');

const files = [
  'src/actions/audit.actions.ts',
  'src/actions/report.actions.ts',
  'src/actions/settings.actions.ts',
  'src/actions/task-comment.actions.ts',
  'src/actions/task.actions.ts',
  'src/lib/safe-action.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace imports
  content = content.replace(
    /import \{ auth \} from ["']@\/lib\/auth["'];/g,
    'import { getSession, getUserRole } from "@/lib/auth";'
  );

  content = content.replace(
    /import \{ auth \} from ["']\.\/auth["'];/g,
    'import { getSession, getUserRole } from "./auth";'
  );

  // Replace auth.api.getSession calls
  content = content.replace(
    /const session = await auth\.api\.getSession\(\{\s*headers: await headers\(\),?\s*\}\);/g,
    'const session = await getSession(await headers());'
  );

  // Replace session.user.role with getUserRole helper
  content = content.replace(
    /session\.user\.role/g,
    'getUserRole(session)'
  );

  // Add getUserRole variable where needed
  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    newLines.push(lines[i]);

    // If we just got a session, add the userRole extraction
    if (lines[i].includes('const session = await getSession') &&
        !lines[i + 1]?.includes('const userRole = getUserRole')) {
      newLines.push('    const userRole = getUserRole(session);');
    }
  }

  content = newLines.join('\n');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed ${file}`);
});

console.log('\n🎉 All files fixed!');
