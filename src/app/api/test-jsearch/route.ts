import { NextResponse } from 'next/server';
import { fetchJSearchJobs } from '@/lib/jsearch-api';

export async function GET() {
  console.log('🧪 Testing JSearch API for Indian jobs...');
  
  try {
    const testJobs = await fetchJSearchJobs('software engineer', 'Bangalore, India', 5);
    
    return NextResponse.json({
      success: true,
      message: 'JSearch API test for India completed',
      jobsFound: testJobs.length,
      apiKeyExists: !!process.env.JSEARCH_API_KEY,
      firstJob: testJobs[0] || null,
      allJobTitles: testJobs.map(job => job.job_title),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyExists: !!process.env.JSEARCH_API_KEY,
      timestamp: new Date().toISOString()
    });
  }
}