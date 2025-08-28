interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo?: string;
  job_city: string;
  job_country: string;
  job_state: string;
  job_description: string;
  job_apply_link: string;
  job_posted_at_datetime_utc: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_employment_type?: string;
}

interface JSearchResponse {
  status: string;
  request_id: string;
  data: JSearchJob[];
  parameters: any;
}

export async function fetchJSearchJobs(
  keywords: string,
  location: string = 'India',
  numResults: number = 20
): Promise<JSearchJob[]> {
  const API_KEY = process.env.JSEARCH_API_KEY;
  
  console.log('JSearch API Key exists:', !!API_KEY);
  
  if (!API_KEY) {
    console.error('❌ JSearch API key not found in environment variables');
    return [];
  }

  try {
    // Build search query optimized for India
    const searchQuery = location.toLowerCase().includes('india') || 
                       location.toLowerCase().includes('bangalore') ||
                       location.toLowerCase().includes('mumbai') ||
                       location.toLowerCase().includes('delhi') ||
                       location.toLowerCase().includes('chennai') ||
                       location.toLowerCase().includes('pune') ||
                       location.toLowerCase().includes('hyderabad')
      ? `${keywords} in ${location}` 
      : `${keywords} in ${location}, India`;

    const params = new URLSearchParams({
      query: searchQuery,
      page: '1',
      num_pages: '1',
      date_posted: 'month'  // Jobs from last month
    });

    const url = `https://jsearch.p.rapidapi.com/search?${params}`;
    console.log('🔍 JSearch API URL:', url);
    console.log('🔍 Search Query:', searchQuery);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 JSearch API Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ JSearch API Error:', errorText);
      throw new Error(`JSearch API error: ${response.status} - ${errorText}`);
    }

    const data: JSearchResponse = await response.json();
    console.log('✅ JSearch Success:', data.data?.length || 0, 'jobs found');
    console.log('🔍 Sample job:', data.data?.[0]?.job_title || 'No jobs');
    
    return data.data || [];

  } catch (error) {
    console.error('❌ JSearch API fetch error:', error);
    return [];
  }
}

export function convertJSearchJobToJobPosting(jsearchJob: JSearchJob): any {
  // Format salary for India
  let salary = 'Competitive salary';
  if (jsearchJob.job_min_salary && jsearchJob.job_max_salary) {
    const currency = jsearchJob.job_salary_currency === 'INR' ? '₹' : '$';
    salary = `${currency}${jsearchJob.job_min_salary.toLocaleString()} - ${currency}${jsearchJob.job_max_salary.toLocaleString()}`;
  } else if (jsearchJob.job_min_salary) {
    const currency = jsearchJob.job_salary_currency === 'INR' ? '₹' : '$';
    salary = `${currency}${jsearchJob.job_min_salary.toLocaleString()}+`;
  }

  // Build location string
  const location = jsearchJob.job_state 
    ? `${jsearchJob.job_city}, ${jsearchJob.job_state}, ${jsearchJob.job_country}`
    : `${jsearchJob.job_city}, ${jsearchJob.job_country}`;

  // Extract skills from job description
  const extractedSkills = extractSkillsFromDescription(jsearchJob.job_description || '');

  // Clean description
  const cleanDescription = (jsearchJob.job_description || '')
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim()
    .substring(0, 350) + '...';

  return {
    id: `jsearch-${jsearchJob.job_id}`,
    title: jsearchJob.job_title || 'Job Title Not Available',
    company: jsearchJob.employer_name || 'Company Not Listed',
    location: location,
    salary,
    description: cleanDescription,
    requirements: extractedSkills,
    url: jsearchJob.job_apply_link || '#',
    source: 'JSearch',
    postedDate: jsearchJob.job_posted_at_datetime_utc || new Date().toISOString(),
    matchScore: 0
  };
}

function extractSkillsFromDescription(description: string): string[] {
  if (!description) return [];

  // Skills commonly found in Indian tech jobs
  const indianTechSkills = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Scala', 'Kotlin',
    
    // Frontend Technologies  
    'React', 'Angular', 'Vue.js', 'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind CSS', 'jQuery',
    
    // Backend Technologies
    'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'Spring Framework', 'ASP.NET', 'Laravel',
    
    // Databases
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle', 'Redis', 'Cassandra', 'ElasticSearch',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform',
    
    // Data Science & Analytics
    'Machine Learning', 'Deep Learning', 'Data Science', 'Python', 'R', 'pandas', 'NumPy', 
    'TensorFlow', 'PyTorch', 'Scikit-learn', 'Matplotlib', 'Seaborn',
    
    // Mobile Development
    'React Native', 'Flutter', 'Android', 'iOS', 'Kotlin', 'Swift',
    
    // Other Important Skills
    'REST API', 'GraphQL', 'Microservices', 'Git', 'GitHub', 'Jira', 'Agile', 'Scrum'
  ];

  const foundSkills: string[] = [];
  const descriptionLower = description.toLowerCase();

  indianTechSkills.forEach(skill => {
    if (descriptionLower.includes(skill.toLowerCase()) && !foundSkills.includes(skill)) {
      foundSkills.push(skill);
    }
  });

  return foundSkills.slice(0, 8); // Limit to 8 skills
}