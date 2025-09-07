// Step 2: Create /src/lib/course-recommendations.ts (NEW FILE)

export interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  provider: string;
  url: string;
  thumbnail?: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  price: string;
  rating?: number;
  free: boolean;
  skills: string[];
}

export function getRecommendedCourses(skillName: string): CourseRecommendation[] {
  const skillLower = skillName.toLowerCase();
  
  // Course recommendations based on skill
  const courseDatabase: Record<string, CourseRecommendation[]> = {
    'javascript': [
      {
        id: 'js-complete-course',
        title: 'The Complete JavaScript Course 2024',
        description: 'Master JavaScript with projects, challenges and theory. Many courses in one!',
        provider: 'Udemy',
        url: 'https://www.udemy.com/course/the-complete-javascript-course/',
        duration: '69 hours',
        level: 'beginner',
        price: '₹3,499',
        rating: 4.7,
        free: false,
        skills: ['JavaScript', 'ES6', 'DOM', 'Async Programming']
      },
      {
        id: 'js-freecodecamp',
        title: 'JavaScript Algorithms and Data Structures',
        description: 'Learn JavaScript fundamentals by building algorithms and data structures',
        provider: 'freeCodeCamp',
        url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/',
        duration: '300 hours',
        level: 'beginner',
        price: 'Free',
        rating: 4.8,
        free: true,
        skills: ['JavaScript', 'Algorithms', 'Data Structures']
      }
    ],
    'react': [
      {
        id: 'react-complete-guide',
        title: 'React - The Complete Guide (incl Hooks, React Router, Redux)',
        description: 'Dive in and learn React.js from scratch! Learn Reactjs, Hooks, Redux, React Routing, Animations, Next.js and way more!',
        provider: 'Udemy',
        url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
        duration: '48 hours',
        level: 'intermediate',
        price: '₹3,499',
        rating: 4.6,
        free: false,
        skills: ['React', 'Hooks', 'Redux', 'React Router']
      },
      {
        id: 'react-beta-docs',
        title: 'React Official Documentation',
        description: 'Learn React from the official documentation with interactive examples',
        provider: 'React.dev',
        url: 'https://react.dev/learn',
        duration: 'Self-paced',
        level: 'beginner',
        price: 'Free',
        rating: 4.9,
        free: true,
        skills: ['React', 'Components', 'State', 'Effects']
      }
    ],
    'python': [
      {
        id: 'python-complete-bootcamp',
        title: 'Complete Python Bootcamp From Zero to Hero',
        description: 'Learn Python like a Professional Start from the basics and go all the way to creating your own applications and games',
        provider: 'Udemy',
        url: 'https://www.udemy.com/course/complete-python-bootcamp/',
        duration: '22 hours',
        level: 'beginner',
        price: '₹3,499',
        rating: 4.6,
        free: false,
        skills: ['Python', 'OOP', 'File Handling', 'Web Scraping']
      },
      {
        id: 'python-for-everybody',
        title: 'Python for Everybody',
        description: 'Learn to Program and Analyze Data with Python',
        provider: 'Coursera (University of Michigan)',
        url: 'https://www.coursera.org/specializations/python',
        duration: '8 months',
        level: 'beginner',
        price: '₹2,500/month',
        rating: 4.8,
        free: false,
        skills: ['Python', 'Data Analysis', 'Web Scraping', 'Databases']
      }
    ],
    'node.js': [
      {
        id: 'nodejs-complete-guide',
        title: 'NodeJS - The Complete Guide (MVC, REST APIs, GraphQL, Deno)',
        description: 'Master Node JS & Deno.js, build REST APIs with Node.js, GraphQL APIs, add Authentication, use MongoDB, SQL & much more!',
        provider: 'Udemy',
        url: 'https://www.udemy.com/course/nodejs-the-complete-guide/',
        duration: '40 hours',
        level: 'intermediate',
        price: '₹3,499',
        rating: 4.6,
        free: false,
        skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs']
      }
    ],
    'machine learning': [
      {
        id: 'ml-coursera',
        title: 'Machine Learning',
        description: 'Learn about the most effective machine learning techniques',
        provider: 'Coursera (Stanford)',
        url: 'https://www.coursera.org/learn/machine-learning',
        duration: '11 weeks',
        level: 'intermediate',
        price: '₹2,500/month',
        rating: 4.9,
        free: false,
        skills: ['Machine Learning', 'Linear Regression', 'Neural Networks']
      }
    ]
  };

  // Return courses for the specific skill, or default courses
  return courseDatabase[skillLower] || [
    {
      id: `${skillLower}-default`,
      title: `Learn ${skillName} - Complete Course`,
      description: `Comprehensive course covering ${skillName} from basics to advanced concepts`,
      provider: 'Online Learning Platform',
      url: '#',
      duration: 'Variable',
      level: 'beginner',
      price: 'Check Platform',
      free: false,
      skills: [skillName]
    }
  ];
}