interface ReedJob {
  jobId: number;
  jobTitle: string;
  employerName: string;
  locationName: string;
  minimumSalary?: number;
  maximumSalary?: number;
  jobDescription: string;
  jobUrl: string;
  date: string;
}

interface ReedSearchResponse {
  results: ReedJob[];
  totalResults: number;
}

// Your existing function (keeping it)
export async function fetchReedJobs(
  keywords: string,
  location: string = '',
  resultsToTake: number = 20
): Promise<ReedJob[]> {
  const apiKey = process.env.REED_API_KEY;
  
  console.log('Reed API Key exists:', !!apiKey);
  
  if (!apiKey) {
    console.warn('❌ Reed API key not found in environment variables');
    return [];
  }

  try {
    const params = new URLSearchParams({
      keywords: keywords.trim(),
      resultsToTake: Math.min(resultsToTake, 100).toString(),
    });

    // Only add location if provided
    if (location?.trim()) {
      params.append('locationName', location.trim());
    }

    const url = `https://www.reed.co.uk/api/1.0/search?${params}`;
    console.log('🔍 Reed API URL:', url);

    const authHeader = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
    console.log('🔑 Auth header created:', authHeader.substring(0, 20) + '...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'iExcel-Career-Tool/1.0'
      }
    });

    console.log('📡 Reed API Response Status:', response.status);
    console.log('📡 Reed API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Reed API Error Response:', errorText);
      throw new Error(`Reed API error: ${response.status} - ${errorText}`);
    }

    const data: ReedSearchResponse = await response.json();
    console.log('✅ Reed API Success:', data.results?.length || 0, 'jobs found');
    
    return data.results || [];

  } catch (error) {
    console.error('❌ Reed API fetch error:', error);
    return [];
  }
}

// MISSING FUNCTION 1: Add this alias for backward compatibility
export async function callReedAPI(
  keywords: string,
  location: string = '',
  resultsToTake: number = 20
): Promise<ReedJob[]> {
  // Just call the existing fetchReedJobs function
  return fetchReedJobs(keywords, location, resultsToTake);
}

// MISSING FUNCTION 2: Add the conversion function
export function convertReedJobToJobPosting(reedJob: ReedJob): any {
  // Format salary
  let salary = 'Competitive salary';
  if (reedJob.minimumSalary && reedJob.maximumSalary) {
    salary = `£${reedJob.minimumSalary.toLocaleString()} - £${reedJob.maximumSalary.toLocaleString()}`;
  } else if (reedJob.minimumSalary) {
    salary = `£${reedJob.minimumSalary.toLocaleString()}+`;
  }

  // Extract skills from job description
  const extractedSkills = extractSkillsFromText(reedJob.jobDescription || '');

  // Clean and truncate description
  const cleanDescription = (reedJob.jobDescription || '')
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim()
    .substring(0, 300) + '...';

  return {
    id: `reed-${reedJob.jobId}`,
    title: reedJob.jobTitle || 'Job Title Not Available',
    company: reedJob.employerName || 'Company Not Listed',
    location: reedJob.locationName || 'Location Not Specified',
    salary,
    description: cleanDescription,
    requirements: extractedSkills,
    url: reedJob.jobUrl || '#',
    source: 'Reed',
    postedDate: reedJob.date || new Date().toISOString(),
    matchScore: 0 // Will be calculated on frontend
  };
}

// Helper function to extract skills from job description
function extractSkillsFromText(description: string): string[] {
  if (!description) return [];

  const skillKeywords = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Swift', 'Kotlin',
    // Frontend
    'React', 'Vue.js', 'Angular', 'HTML', 'CSS', 'SASS', 'jQuery', 'Bootstrap', 'Tailwind',
    // Backend
    'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET', 'Laravel', 'Ruby on Rails',
    // Databases
    'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Oracle', 'SQLite',
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform',
    // Data Science
    'Machine Learning', 'Data Science', 'pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'R',
    // Tools
    'Git', 'GitHub', 'Jira', 'Figma', 'Postman'
  ];

  const foundSkills: string[] = [];
  const descriptionLower = description.toLowerCase();

  skillKeywords.forEach(skill => {
    if (descriptionLower.includes(skill.toLowerCase()) && !foundSkills.includes(skill)) {
      foundSkills.push(skill);
    }
  });

  return foundSkills.slice(0, 8); // Limit to 8 skills
}