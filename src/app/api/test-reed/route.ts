import { NextResponse } from 'next/server';
import { fetchReedJobs } from '@/lib/reed-api';

export async function GET() {
  console.log('🧪 Testing Reed API connection...');
  
  try {
    const testJobs = await fetchReedJobs('javascript developer', 'london', 5);
    
    return NextResponse.json({
      success: true,
      message: 'Reed API test completed',
      jobsFound: testJobs.length,
      apiKeyExists: !!process.env.REED_API_KEY,
      firstJob: testJobs[0] || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      apiKeyExists: !!process.env.REED_API_KEY,
      timestamp: new Date().toISOString()
    });
  }
}