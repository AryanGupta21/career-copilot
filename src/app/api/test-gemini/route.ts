///Users/aryangupta/Developer/iexcel-career-tool/src/app/api/test-gemini/route.ts

import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    console.log('Testing Gemini API with @google/genai...')
    console.log('API Key exists:', !!apiKey)
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'GEMINI_API_KEY not found in environment variables',
        success: false
      }, { status: 500 })
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey
    })

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Say 'Hello! API key works with @google/genai!'",
    })

    // Handle response safely
    const responseText = response.text || 'No text in response'

    return NextResponse.json({ 
      success: true, 
      message: responseText,
      library: '@google/genai',
      model: 'gemini-2.5-flash',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Gemini API test error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.toString(),
      success: false
    }, { status: 500 })
  }
}