// /Users/aryangupta/Developer/iexcel-career-tool/src/components/onboarding/skills-step.tsx

'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Skill {
  id: number
  name: string
  category: string
}

interface UserSkill extends Skill {
  proficiencyLevel: number
  yearsExperience: number
}

interface SkillsStepProps {
  onComplete: (skills: UserSkill[]) => void
}

export default function SkillsStep({ onComplete }: SkillsStepProps) {
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<UserSkill[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    loadAvailableSkills()
  }, [])

  const loadAvailableSkills = async () => {
    const { data: skills } = await supabase
      .from('skills')
      .select('*')
      .order('name')

    setAvailableSkills(skills || [])
  }

  const filteredSkills = availableSkills.filter(skill =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedSkills.find(s => s.id === skill.id)
  )

  const addSkill = (skill: Skill) => {
    setSelectedSkills(prev => [...prev, {
      ...skill,
      proficiencyLevel: 3,
      yearsExperience: 1
    }])
    setSearchTerm('')
    setShowSuggestions(false)
  }

  const updateSkill = (skillId: number, field: string, value: number) => {
    setSelectedSkills(prev => 
      prev.map(skill => 
        skill.id === skillId 
          ? { ...skill, [field]: value }
          : skill
      )
    )
  }

  const removeSkill = (skillId: number) => {
    setSelectedSkills(prev => prev.filter(skill => skill.id !== skillId))
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">What are your current skills?</h2>
        <p className="text-gray-600">Add your skills and rate your proficiency level</p>
      </div>
      
      {/* Skill Search */}
      <div className="mb-8 relative">
        <Label htmlFor="skillSearch" className="text-gray-700 font-medium">Search for skills</Label>
        <Input
          id="skillSearch"
          placeholder="e.g. JavaScript, Project Management, Python"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          className="mt-2 h-12 bg-white text-gray-900"
        />
        
        {showSuggestions && searchTerm && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10 mt-1">
            {filteredSkills.slice(0, 8).map(skill => (
              <button
                key={skill.id}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center border-b border-gray-100 last:border-b-0"
                onClick={() => addSkill(skill)}
              >
                <div>
                  <div className="font-medium text-gray-900">{skill.name}</div>
                  <div className="text-sm text-gray-500">{skill.category}</div>
                </div>
                <span className="text-blue-600 text-sm">+ Add</span>
              </button>
            ))}
            {filteredSkills.length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-center">
                No skills found. Try different keywords.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Skills */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-semibold text-gray-900">Your Skills ({selectedSkills.length})</h3>
        
        {selectedSkills.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-gray-400 mb-2">🔍</div>
            <p className="text-gray-600">No skills added yet. Search and add your skills above.</p>
          </div>
        ) : (
          selectedSkills.map(skill => (
            <div key={skill.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-medium text-gray-900">{skill.name}</h4>
                  <p className="text-sm text-gray-500">{skill.category}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeSkill(skill.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  ✕
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Proficiency Level (1-5)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={skill.proficiencyLevel}
                    onChange={(e) => updateSkill(skill.id, 'proficiencyLevel', parseInt(e.target.value))}
                    className="mt-1 bg-white text-gray-900"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    1=Beginner, 3=Intermediate, 5=Expert
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Years of Experience
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    value={skill.yearsExperience}
                    onChange={(e) => updateSkill(skill.id, 'yearsExperience', parseFloat(e.target.value))}
                    className="mt-1 bg-white text-gray-900"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button 
          onClick={() => onComplete(selectedSkills)}
          disabled={selectedSkills.length === 0}
          className="bg-gray-700 hover:bg-gray-800 h-12 px-8"
        >
          Continue to AI Analysis ({selectedSkills.length} skills)
        </Button>
      </div>
    </div>
  )
}