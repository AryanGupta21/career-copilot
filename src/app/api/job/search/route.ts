///Users/aryangupta/Developer/iexcel-career-tool/src/app/api/job/search/route.ts

import { NextRequest, NextResponse } from 'next/server'

// Mock job data - in production, you'd integrate with Reed API, Indeed API, etc.
const MOCK_JOBS = [
  {
    id: 'job-1',
    title: 'Data Scientist',
    company: 'TechCorp Ltd',
    location: 'London, UK',
    salary: '£60,000 - £80,000',
    description: 'We are seeking a Data Scientist to join our analytics team. You will work with Python, SQL, and machine learning frameworks to analyze large datasets and build predictive models.',
    url: 'https://example.com/jobs/data-scientist-1',
    source: 'TechCorp',
    postedDate: new Date().toISOString(),
    requirements: ['Python', 'SQL', 'Machine Learning', 'Pandas', 'Statistics']
  },
  {
    id: 'job-2', 
    title: 'Senior Data Analyst',
    company: 'DataFlow Inc',
    location: 'Manchester, UK',
    salary: '£45,000 - £65,000',
    description: 'Join our data team as a Senior Data Analyst. Use Python, SQL, and visualization tools like Tableau to derive insights from complex datasets.',
    url: 'https://example.com/jobs/data-analyst-2',
    source: 'DataFlow',
    postedDate: new Date().toISOString(),
    requirements: ['Python', 'SQL', 'Tableau', 'Excel', 'Statistics']
  },
  {
    id: 'job-3',
    title: 'Machine Learning Engineer',
    company: 'AI Solutions',
    location: 'Edinburgh, UK',
    salary: '£70,000 - £90,000',
    description: 'We need a Machine Learning Engineer experienced with TensorFlow, PyTorch, and MLOps practices. You will deploy ML models at scale.',
    url: 'https://example.com/jobs/ml-engineer-3',
    source: 'AI Solutions',
    postedDate: new Date().toISOString(),
    requirements: ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Docker', 'AWS']
  },
  {
    id: 'job-4',
    title: 'Junior Data Scientist',
    company: 'StartupCo',
    location: 'Remote',
    salary: '£35,000 - £45,000',
    description: 'Entry-level position for a Data Scientist. We will train you in Python, SQL, and data analysis techniques.',
    url: 'https://example.com/jobs/junior-ds-4',
    source: 'StartupCo',
    postedDate: new Date().toISOString(),
    requirements: ['Python', 'SQL', 'Statistics', 'Excel']
  },
  {
    id: 'job-5',
    title: 'Business Intelligence Analyst',
    company: 'Corporate Solutions',
    location: 'Birmingham, UK',
    salary: '£40,000 - £55,000',
    description: 'BI Analyst role requiring SQL, Power BI, and Excel skills. You will create dashboards and reports for executive team.',
    url: 'https://example.com/jobs/bi-analyst-5',
    source: 'Corporate Solutions',
    postedDate: new Date().toISOString(),
    requirements: ['SQL', 'Power BI', 'Excel', 'Tableau']
  }
]

export async function POST(request: NextRequest) {
  try {
    const { keywords, location, limit } = await request.json()

    console.log('Job search request:', { keywords, location, limit })

    // Filter jobs based on keywords
    let filteredJobs = MOCK_JOBS.filter(job => 
      job.title.toLowerCase().includes(keywords.toLowerCase()) ||
      job.description.toLowerCase().includes(keywords.toLowerCase())
    )

    // If location specified, filter by location
    if (location) {
      filteredJobs = filteredJobs.filter(job =>
        job.location.toLowerCase().includes(location.toLowerCase())
      )
    }

    // Limit results
    const jobs = filteredJobs.slice(0, limit || 20)

    console.log(`Found ${jobs.length} jobs for "${keywords}"`)

    return NextResponse.json({ 
      jobs,
      total: jobs.length,
      success: true 
    })

  } catch (error) {
    console.error('Error in jobs search API:', error)
    return NextResponse.json(
      { error: 'Failed to search jobs', success: false },
      { status: 500 }
    )
  }
}