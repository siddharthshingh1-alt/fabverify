export type RateUnit = string

export type Merchandiser = {
  id: string
  name: string
  city: string
  fabscore: number
  tags: string[]
  experience: number
  projects: number
  onTime: number
  stages: string[]
  rateMin: number
  rateMax: number
  rateUnit: RateUnit
}

export type Designer = {
  id: string
  name: string
  city: string
  fabscore: number
  tags: string[]
  software: string[]
  experience: number
  techPacks: number
  accuracy: number
  rateMin: number
  rateMax: number
  rateUnit: RateUnit
}

export type Master = {
  id: string
  name: string
  city: string
  fabscore: number
  tags: string[]
  speciality: string[]
  experience: number
  samples: number
  firstAttempt: number
  rateMin: number
  rateMax: number
  rateUnit: RateUnit
}

export const merchandisers: Merchandiser[] = [
  {
    id: 'meera-sharma',
    name: 'Meera Sharma',
    city: 'Delhi NCR',
    fabscore: 9.8,
    tags: ['Ethnic Wear', 'Luxury', 'Sustainable'],
    experience: 12,
    projects: 89,
    onTime: 99,
    stages: ['Design', 'Sourcing', 'Sampling', 'Production', 'QC', 'Dispatch'],
    rateMin: 12000,
    rateMax: 20000,
    rateUnit: 'per stage',
  },
  {
    id: 'rahul-verma',
    name: 'Rahul Verma',
    city: 'Mumbai',
    fabscore: 9.5,
    tags: ['Western Wear', 'Denim', 'Activewear'],
    experience: 8,
    projects: 67,
    onTime: 98,
    stages: ['Sourcing', 'Sampling', 'Production', 'QC'],
    rateMin: 8000,
    rateMax: 15000,
    rateUnit: 'per stage',
  },
]

export const designers: Designer[] = [
  {
    id: 'ananya-kapoor',
    name: 'Ananya Kapoor',
    city: 'Mumbai',
    fabscore: 9.7,
    tags: ['Ethnic Wear', 'Luxury', 'Fusion'],
    software: ['Illustrator', 'Hand Sketch', 'CLO 3D'],
    experience: 9,
    techPacks: 234,
    accuracy: 99,
    rateMin: 3500,
    rateMax: 6000,
    rateUnit: 'per tech pack',
  },
]

export const masters: Master[] = [
  {
    id: 'ramesh-kumar',
    name: 'Ramesh Kumar',
    city: 'Delhi NCR',
    fabscore: 9.9,
    tags: ['Ethnic Wear', 'Luxury', 'Complex Construction'],
    speciality: ['Pattern Making', 'Draping', 'Grading'],
    experience: 20,
    samples: 312,
    firstAttempt: 99,
    rateMin: 2500,
    rateMax: 5000,
    rateUnit: 'per sample',
  },
]
