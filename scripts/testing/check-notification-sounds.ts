import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Env vars not set. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBucket() {
  console.log('🔍 Checking notification-sounds bucket...\n');

  try {
    // List files in the bucket
    const { data: files, error } = await supabase.storage
      .from('notification-sounds')
      .list();

    if (error) {
      console.error('❌ Error listing bucket:', error);
      return;
    }

    console.log(`✅ Bucket accessible. Found ${files?.length || 0} files:\n`);

    if (files && files.length > 0) {
      files.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name}`);
      });
    } else {
      console.log('⚠️  Bucket is empty!');
    }

    // Try to get a public URL for one of the files
    if (files && files.length > 0) {
      const firstFile = files[0];
      const { data: publicUrl } = supabase.storage
        .from('notification-sounds')
        .getPublicUrl(firstFile.name);

      console.log(`\n📎 Example public URL: ${publicUrl.publicUrl}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBucket();
