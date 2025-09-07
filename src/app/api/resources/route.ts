// Step 3: Create API endpoint /src/app/api/resources/route.ts (NEW FILE)

import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeTutorials } from '@/lib/youtube-api';
import { getRecommendedCourses } from '@/lib/course-recommendations';

export async function POST(request: NextRequest) {
  try {
    const { skillName, includeYouTube = true, includeCourses = true } = await request.json();

    console.log('Loading resources for skill:', skillName);

    if (!skillName?.trim()) {
      return NextResponse.json(
        { error: 'Skill name is required' },
        { status: 400 }
      );
    }

    const resources: any = {
      youtube: [],
      courses: [],
      total: 0
    };

    // Load YouTube tutorials
    if (includeYouTube) {
      console.log('Fetching YouTube tutorials...');
      const youtubeVideos = await searchYouTubeTutorials(skillName.trim(), 3);
      resources.youtube = youtubeVideos;
    }

    // Load course recommendations
    if (includeCourses) {
      console.log('Fetching course recommendations...');
      const courses = getRecommendedCourses(skillName.trim());
      resources.courses = courses;
    }

    resources.total = resources.youtube.length + resources.courses.length;

    console.log(`Found ${resources.total} resources for ${skillName}`);

    return NextResponse.json({
      success: true,
      skill: skillName,
      resources,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Resources API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to load resources',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}