import { supabase } from './src/integrations/supabase/client.ts';

async function checkSupabaseSetup() {
    console.log('🔍 Checking existing Supabase setup...\n');

    try {
        // Check 1: List all existing tables
        console.log('📋 Checking existing tables...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');

        if (tablesError) {
            console.log('⚠️  Using alternative method to check tables...');

            // Try checking each table individually
            const tablesToCheck = ['concerns', 'concern_timeline', 'admin_users', 'concern_assignments'];
            const existingTables = [];

            for (const table of tablesToCheck) {
                const { error } = await supabase.from(table).select('count').limit(0);
                if (!error) {
                    existingTables.push(table);
                    console.log(`   ✅ ${table} - EXISTS`);
                } else {
                    console.log(`   ❌ ${table} - NOT FOUND`);
                }
            }

            console.log(`\n   Found ${existingTables.length} out of 4 required tables`);
        } else {
            console.log('   Existing tables:', tables?.map(t => t.table_name).join(', '));
        }

        // Check 2: Storage buckets
        console.log('\n📦 Checking storage buckets...');
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            console.log('   ❌ Error checking buckets:', bucketsError.message);
        } else {
            console.log('   Existing buckets:', buckets?.map(b => `${b.name} (${b.public ? 'public' : 'private'})`).join(', ') || 'None');

            const evidenceBucket = buckets?.find(b => b.name === 'evidence');
            if (evidenceBucket) {
                console.log(`   ✅ evidence bucket exists (public: ${evidenceBucket.public})`);
            } else {
                console.log('   ❌ evidence bucket NOT FOUND');
            }
        }

        console.log('\n✨ Check complete!\n');

    } catch (err) {
        console.error('❌ Error:', err);
    }
}

checkSupabaseSetup();
