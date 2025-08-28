import { NextRequest, NextResponse } from 'next/server';
import { callReedAPI, convertReedJobToJobPosting } from '@/lib/reed-api';
import { fetchJSearchJobs, convertJSearchJobToJobPosting } from '@/lib/jsearch-api';

// Enhanced mock data with Indian jobs
const INDIAN_MOCK_JOBS = [
  {
    id: 'india-1',
    title: 'Software Development Engineer',
    company: 'TechMahindra',
    location: 'Bangalore, Karnataka, India',
    salary: '₹8,00,000 - ₹15,00,000',
    description: 'Join our team as a Software Development Engineer working on cutting-edge web applications using React, Node.js, and cloud technologies. Great opportunity for career growth in a leading IT services company.',
    url: '#',
    source: 'Mock India',
    postedDate: new Date().toISOString(),
    requirements: ['React', 'Node.js', 'JavaScript', 'AWS', 'MongoDB', 'Express']
  },
  {
    id: 'india-2', 
    title: 'Data Scientist',
    company: 'Flipkart',
    location: 'Mumbai, Maharashtra, India',
    salary: '₹12,00,000 - ₹20,00,000',
    description: 'Work with big data and machine learning algorithms to solve complex business problems. Use Python, SQL, TensorFlow, and cloud platforms to build scalable ML solutions for millions of users.',
    url: '#',
    source: 'Mock India',
    postedDate: new Date().toISOString(),
    requirements: ['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'pandas', 'AWS', 'Spark']
  },
  {
    id: 'india-3',
    title: 'Full Stack Developer',
    company: 'Zomato',
    location: 'Delhi, India',
    salary: '₹10,00,000 - ₹18,00,000',
    description: 'Build end-to-end web solutions using modern JavaScript frameworks. Work on high-traffic applications serving millions of food lovers across India.',
    url: '#',
    source: 'Mock India',
    postedDate: new Date().toISOString(),
    requirements: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes']
  },
  {
    id: 'india-4',
    title: 'Frontend Developer',
    company: 'Paytm',
    location: 'Noida, UP, India',
    salary: '₹6,00,000 - ₹12,00,000',
    description: 'Create beautiful and responsive user interfaces for our fintech applications. Work with React, TypeScript, and modern frontend tools.',
    url: '#',
    source: 'Mock India', 
    postedDate: new Date().toISOString(),
    requirements: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Redux']
  },
  {
    id: 'india-5',
    title: 'DevOps Engineer',
    company: 'Swiggy',
    location: 'Bangalore, Karnataka, India',
    salary: '₹15,00,000 - ₹25,00,000',
    description: 'Lead our infrastructure automation and deployment processes. Work with Docker, Kubernetes, AWS, and CI/CD pipelines to ensure scalable food delivery operations.',
    url: '#',
    source: 'Mock India',
    postedDate: new Date().toISOString(),
    requirements: ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Terraform', 'Python', 'Linux']
  }
];

function isIndianLocation(location: string): boolean {
  if (!location) return false;
  const locationLower = location.toLowerCase();
  return locationLower.includes('india') || 
         locationLower.includes('bangalore') ||
         locationLower.includes('mumbai') ||
         locationLower.includes('delhi') ||
         locationLower.includes('chennai') ||
         locationLower.includes('hyderabad') ||
         locationLower.includes('pune') ||
         locationLower.includes('kolkata') ||
         locationLower.includes('ahmedabad') ||
         locationLower.includes('gurgaon') ||
         locationLower.includes('noida');
}

export async function POST(request: NextRequest) {
  console.log('🚀 Job search API called');

  try {
    const { keywords, location, limit } = await request.json();

    console.log('📝 Search params:', { keywords, location, limit });

    if (!keywords?.trim()) {
      return NextResponse.json(
        { error: 'Search keywords are required', success: false },
        { status: 400 }
      );
    }

    const searchLocation = location?.trim() || '';
    const isIndianSearch = isIndianLocation(searchLocation);

    console.log('🌍 Is Indian location:', isIndianSearch);

    if (isIndianSearch) {
      // Use JSearch API for Indian jobs
      console.log('🇮🇳 Using JSearch API for Indian jobs...');
      
      const jsearchJobs = await fetchJSearchJobs(keywords.trim(), searchLocation, limit || 20);
      
      if (jsearchJobs && jsearchJobs.length > 0) {
        console.log(`✅ JSearch API success: ${jsearchJobs.length} Indian jobs found`);
        
        const transformedJobs = jsearchJobs.map(convertJSearchJobToJobPosting);
        
        return NextResponse.json({
          jobs: transformedJobs.slice(0, limit || 20),
          total: transformedJobs.length,
          source: 'jsearch-india',
          success: true
        });
      }

      // Fallback to Indian mock data
      console.log('⚠️ JSearch API returned no results, using Indian mock data');
      
      const keywordsLower = keywords.toLowerCase();
      let filteredIndianJobs = INDIAN_MOCK_JOBS.filter(job =>
        job.title.toLowerCase().includes(keywordsLower) ||
        job.description.toLowerCase().includes(keywordsLower) ||
        job.requirements.some(req => req.toLowerCase().includes(keywordsLower))
      );

      if (searchLocation) {
        const locationLower = searchLocation.toLowerCase();
        filteredIndianJobs = filteredIndianJobs.filter(job =>
          job.location.toLowerCase().includes(locationLower)
        );
      }

      return NextResponse.json({
        jobs: filteredIndianJobs.slice(0, limit || 20),
        total: filteredIndianJobs.length,
        source: 'indian-mock',
        success: true
      });

    } else {
      // Use Reed API for UK/other locations
      console.log('🇬🇧 Using Reed API for UK jobs...');
      
      const reedJobs = await callReedAPI(keywords.trim(), searchLocation, limit || 20);
      
      if (reedJobs && reedJobs.length > 0) {
        console.log(`✅ Reed API success: ${reedJobs.length} UK jobs found`);
        
        const transformedJobs = reedJobs.map(convertReedJobToJobPosting);
        
        return NextResponse.json({
          jobs: transformedJobs,
          total: transformedJobs.length,
          source: 'reed-uk',
          success: true
        });
      }

      // Fallback for non-Indian locations
      return NextResponse.json({
        jobs: [],
        total: 0,
        source: 'no-results',
        message: 'No jobs found. Try searching for Indian cities like Bangalore, Mumbai, Delhi.',
        success: true
      });
    }

  } catch (error) {
    console.error('❌ Job search API error:', error);
    
    return NextResponse.json({
      error: 'Failed to search jobs',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}