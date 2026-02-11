
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tzwzhabmjordmxgmhvet.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6d3poYWJtam9yZG14Z21odmV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzODkxNzIsImV4cCI6MjA4NTk2NTE3Mn0.qHGhNrgtKENI0-qhJMa88ChuFHDb7TjDipM0fzu9PD4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConcern() {
    const concernNumber = 'SC-MLCGEX8B-5W3W';

    console.log(`Checking status for ${concernNumber}...`);

    const { data, error } = await supabase
        .from('concerns')
        .select('id, concern_number, status, created_at')
        .eq('concern_number', concernNumber)
        .single();

    if (error) {
        console.error('Error fetching concern:', error);
        return;
    }

    console.log('Concern Data:', data);

    // Check timeline
    const { data: timeline, error: timelineError } = await supabase
        .from('concern_timeline')
        .select('*')
        .eq('concern_id', data.id)
        .order('created_at', { ascending: false });

    if (timelineError) {
        console.error('Error fetching timeline:', timelineError);
    } else {
        console.log('Timeline Entries:', timeline.length);
        timeline.forEach(t => {
            console.log(`- [${new Date(t.created_at).toISOString()}] ${t.title}: ${t.description}`);
        });
    }
}

checkConcern();
