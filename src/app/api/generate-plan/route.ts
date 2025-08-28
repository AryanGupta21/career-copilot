///Users/aryangupta/Developer/iexcel-career-tool/src/app/api/generate-plan/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  console.log('=== GENERATE PLAN API CALLED ===')
  
  try {
    const body = await request.json()
    console.log('Request body keys:', Object.keys(body))
    console.log('Target role:', body.targetRole)
    console.log('Study hours per week:', body.studyHoursPerWeek)
    console.log('Skill gaps count:', body.skillGaps?.length)
    console.log('Current skills count:', body.currentSkills?.length)

    const { targetRole, skillGaps, studyHoursPerWeek, currentSkills } = body

    if (!process.env.GEMINI_API_KEY) {
      console.error('No API key found')
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    if (!targetRole || !skillGaps || !studyHoursPerWeek || !currentSkills) {
      console.error('Missing required fields:', {
        hasTargetRole: !!targetRole,
        hasSkillGaps: !!skillGaps,
        hasStudyHours: !!studyHoursPerWeek,
        hasCurrentSkills: !!currentSkills
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Initializing GoogleGenAI...')
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    })

    const highPrioritySkills = skillGaps.filter((gap: any) => gap.priority === 'high')
    const duration = Math.min(Math.max(6, Math.ceil(highPrioritySkills.length * 1.5)), 12)

    console.log('High priority skills:', highPrioritySkills.length)
    console.log('Calculated duration:', duration)

    const prompt = `
      Create a ${duration}-week learning plan for someone to become a ${targetRole}.
      
      Study capacity: ${studyHoursPerWeek} hours per week
      Total available: ${studyHoursPerWeek * duration} hours
      
      Priority skill gaps to address:
      ${skillGaps.map((gap: any) => 
        `- ${gap.skill}: Level ${gap.currentLevel} → ${gap.requiredLevel} (${gap.priority} priority)`
      ).join('\n')}
      
      Current skills (don't repeat these):
      ${currentSkills.map((skill: any) => 
        `- ${skill.skills?.name || skill.name}: ${skill.proficiency_level || skill.proficiencyLevel}/5`
      ).join('\n')}
      
      Create a progressive plan that:
      1. Addresses high-priority gaps first
      2. Builds skills incrementally 
      3. Includes hands-on projects
      4. Fits within the time budget
      5. Has clear weekly milestones
      
      Return ONLY valid JSON (no markdown) in this exact format:
      {
        "title": "Learning Plan: ${targetRole}",
        "overview": "2-sentence description of the plan",
        "duration": ${duration},
        "totalHours": 120,
        "weeks": [
          {
            "week": 1,
            "focus": ["main skills for this week"],
            "tasks": [
              {
                "id": "w1t1",
                "title": "specific task title",
                "description": "what to do and learn",
                "estimatedHours": 4,
                "type": "reading",
                "resources": ["specific resource names"]
              }
            ],
            "milestone": "what you'll achieve by week end",
            "totalHours": 8
          }
        ],
        "finalProject": "capstone project description"
      }
      
      Make sure each week has 2-4 tasks and stays within the weekly hour budget.
    `

    console.log('Sending request to Gemini API...')
    console.log('Prompt length:', prompt.length)

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    })
    
    console.log('Received response from Gemini')
    console.log('Response object:', response)
    console.log('Response text exists:', !!response.text)
    
    // Handle response safely
    const text = response.text || ''
    console.log('Response text length:', text.length)
    console.log('First 200 chars:', text.substring(0, 200))
    
    if (!text) {
      console.error('Empty response from Gemini API')
      return NextResponse.json(
        { error: 'Empty response from Gemini API' },
        { status: 500 }
      )
    }
    
    // Extract JSON from response
    let jsonText = text.trim()
    if (jsonText.includes('```')) {
      const match = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/)
      if (match) {
        jsonText = match[1]
        console.log('Extracted JSON from markdown blocks')
      }
    }
    
    console.log('JSON text to parse (first 300 chars):', jsonText.substring(0, 300))
    
    let plan
    try {
      plan = JSON.parse(jsonText)
      console.log('Successfully parsed JSON plan')
      console.log('Plan keys:', Object.keys(plan))
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Text that failed to parse:', jsonText)
      return NextResponse.json(
        { error: 'Failed to parse AI response as JSON', details: parseError },
        { status: 500 }
      )
    }
    
    const finalPlan = {
      ...plan,
      skillGaps
    }
    
    console.log('Returning successful response')
    return NextResponse.json({ 
      plan: finalPlan,
      success: true
    })
    
  } catch (error: any) {
    console.error('=== ERROR IN GENERATE-PLAN API ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    console.error('Full error object:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to generate learning plan',
        details: error.message,
        errorName: error.name,
        success: false
      },
      { status: 500 }
    )
  }
}