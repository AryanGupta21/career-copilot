/*/Users/aryangupta/Developer/iexcel-career-tool/src/app/api/analyze-gaps/route.ts */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  try {
    const { currentSkills, targetRole } = await request.json()

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })

    const prompt = `
      You are a career counselor analyzing skill gaps for someone wanting to become a ${targetRole}.
      
      Their current skills:
      ${currentSkills.map((skill: any) => 
        `- ${skill.skills?.name || skill.name}: Level ${skill.proficiency_level || skill.proficiencyLevel}/5, ${skill.years_experience || skill.yearsExperience} years experience`
      ).join('\n')}
      
      Analyze what skills are needed for ${targetRole} and identify the most important gaps.
      
      Return ONLY valid JSON (no markdown, no extra text) in this exact format:
      [
        {
          "skill": "specific skill name",
          "currentLevel": 0,
          "requiredLevel": 4,
          "priority": "high",
          "reasoning": "why this skill is critical for the role",
          "learningPath": "brief suggestion on how to learn this skill"
        }
      ]
      
      Focus on 6-10 most important skill gaps. Use "high" priority for essential skills, "medium" for important skills, "low" for nice-to-have skills.
    `

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })
    
    // Handle response safely
    const text = response.text || ''
    
    if (!text) {
      throw new Error('Empty response from Gemini API')
    }
    
    // Extract JSON from response
    let jsonText = text.trim()
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/)
      if (match) jsonText = match[1]
    }
    
    const skillGaps = JSON.parse(jsonText)
    
    return NextResponse.json({ 
      skillGaps: skillGaps.slice(0, 10),
      success: true 
    })
    
  } catch (error: any) {
    console.error('Error in analyze-gaps API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze skill gaps',
        details: error.message,
        success: false
      },
      { status: 500 }
    )
  }
}