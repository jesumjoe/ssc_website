// Test Supabase Connection
// Run this to verify your Supabase setup is working

import { supabase } from './src/integrations/supabase/client';

async function testConnection() {
    console.log('🔍 Testing Supabase connection...\n');

    try {
        // Test 1: Check if client is initialized
        console.log('✅ Supabase client initialized');
        console.log(`   URL: ${import.meta.env.VITE_SUPABASE_URL}`);
        console.log(`   Key: ${import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20)}...`);

        // Test 2: Try to query concerns table
        console.log('\n🔍 Testing database connection...');
        const { data, error } = await supabase
            .from('concerns')
            .select('count')
            .limit(1);

        if (error) {
            if (error.message.includes('relation "public.concerns" does not exist')) {
                console.log('⚠️  Database tables not created yet');
                console.log('   → Run the SQL migration script in Supabase SQL Editor');
                console.log('   → See QUICKSTART.md for instructions');
            } else {
                console.log('❌ Database error:', error.message);
            }
        } else {
            console.log('✅ Database connection successful!');
            console.log('   Tables are set up correctly');
        }

        // Test 3: Check storage bucket
        console.log('\n🔍 Testing storage bucket...');
        const { data: buckets, error: bucketError } = await supabase
            .storage
            .listBuckets();

        if (bucketError) {
            console.log('❌ Storage error:', bucketError.message);
        } else {
            const evidenceBucket = buckets?.find(b => b.name === 'evidence');
            if (evidenceBucket) {
                console.log('✅ Storage bucket "evidence" exists');
                console.log(`   Public: ${evidenceBucket.public}`);
            } else {
                console.log('⚠️  Storage bucket "evidence" not found');
                console.log('   → Create it in Supabase Dashboard');
                console.log('   → See QUICKSTART.md for instructions');
            }
        }

        console.log('\n✨ Connection test complete!\n');

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

testConnection();
