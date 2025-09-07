interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeVideo[];
}

export async function searchYouTubeTutorials(
  skillName: string,
  maxResults: number = 3
): Promise<any[]> {
  const API_KEY = process.env.YOUTUBE_API_KEY;
  
  console.log('YouTube API Key exists:', !!API_KEY);
  
  if (!API_KEY) {
    console.warn('YouTube API key not found, using mock data');
    return getMockYouTubeVideos(skillName);
  }

  try {
    const searchQuery = encodeURIComponent(`${skillName} tutorial programming`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&videoDuration=medium&order=relevance&maxResults=${maxResults}&key=${API_KEY}`;
    
    console.log('YouTube API search for:', skillName);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data: YouTubeSearchResponse = await response.json();
    console.log('YouTube API success:', data.items?.length || 0, 'videos found');
    
    return data.items.map(transformYouTubeVideo) || [];
  } catch (error) {
    console.error('YouTube API error:', error);
    return getMockYouTubeVideos(skillName);
  }
}

function transformYouTubeVideo(video: YouTubeVideo) {
  return {
    id: video.id.videoId,
    title: video.snippet.title,
    description: video.snippet.description.substring(0, 150) + '...',
    thumbnail: video.snippet.thumbnails.medium.url,
    channel: video.snippet.channelTitle,
    url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    publishedAt: video.snippet.publishedAt,
    source: 'YouTube',
    type: 'video',
    duration: 'Medium',
    free: true
  };
}

function getMockYouTubeVideos(skillName: string) {
  const mockVideos = [
    {
      id: `mock-${skillName.toLowerCase()}-1`,
      title: `Learn ${skillName} in 30 Minutes - Complete Tutorial`,
      description: `Comprehensive ${skillName} tutorial covering fundamentals and practical examples. Perfect for beginners and intermediate developers.`,
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      channel: 'Tech Academy',
      url: `https://www.youtube.com/watch?v=mock-${skillName}`,
      publishedAt: new Date().toISOString(),
      source: 'YouTube',
      type: 'video',
      duration: '30 min',
      free: true
    },
    {
      id: `mock-${skillName.toLowerCase()}-2`,
      title: `${skillName} Crash Course - Build Real Projects`,
      description: `Hands-on ${skillName} course where you build 3 real-world projects from scratch. Includes source code and explanations.`,
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      channel: 'Code Masters',
      url: `https://www.youtube.com/watch?v=mock-${skillName}-2`,
      publishedAt: new Date().toISOString(),
      source: 'YouTube',
      type: 'video',
      duration: '2 hours',
      free: true
    },
    {
      id: `mock-${skillName.toLowerCase()}-3`,
      title: `Advanced ${skillName} Concepts Explained`,
      description: `Deep dive into advanced ${skillName} concepts and best practices. Suitable for developers with some experience.`,
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      channel: 'Pro Developer',
      url: `https://www.youtube.com/watch?v=mock-${skillName}-3`,
      publishedAt: new Date().toISOString(),
      source: 'YouTube',
      type: 'video',
      duration: '45 min',
      free: true
    }
  ];

  return mockVideos;
}