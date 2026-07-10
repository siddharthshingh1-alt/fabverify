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
  {
    id: 'priya-nair',
    name: 'Priya Nair',
    city: 'Bengaluru',
    fabscore: 9.3,
    tags: ['Kids Wear', 'Casual Wear', 'Sustainable'],
    experience: 6,
    projects: 45,
    onTime: 97,
    stages: ['Design', 'Sourcing', 'Sampling', 'QC'],
    rateMin: 7000,
    rateMax: 12000,
    rateUnit: 'per stage',
  },
  {
    id: 'arjun-mehta',
    name: 'Arjun Mehta',
    city: 'Jaipur',
    fabscore: 9.1,
    tags: ['Ethnic Wear', 'Luxury'],
    experience: 10,
    projects: 72,
    onTime: 96,
    stages: ['Sourcing', 'Sampling', 'Production', 'Dispatch'],
    rateMin: 9000,
    rateMax: 16000,
    rateUnit: 'per stage',
  },
  {
    id: 'fatima-sheikh',
    name: 'Fatima Sheikh',
    city: 'Ahmedabad',
    fabscore: 8.9,
    tags: ['Western Wear', 'Knitwear'],
    experience: 5,
    projects: 38,
    onTime: 95,
    stages: ['Design', 'Sampling', 'QC'],
    rateMin: 6000,
    rateMax: 10000,
    rateUnit: 'per stage',
  },
  {
    id: 'vikram-singh',
    name: 'Vikram Singh',
    city: 'Tirupur',
    fabscore: 9.0,
    tags: ['Knitwear', 'Activewear', 'Casual Wear'],
    experience: 7,
    projects: 56,
    onTime: 97,
    stages: ['Sourcing', 'Production', 'QC', 'Dispatch'],
    rateMin: 7500,
    rateMax: 13000,
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
  {
    id: 'rohit-das',
    name: 'Rohit Das',
    city: 'Delhi NCR',
    fabscore: 9.4,
    tags: ['Western Wear', 'Denim'],
    software: ['Illustrator', 'CLO 3D', 'Photoshop'],
    experience: 7,
    techPacks: 178,
    accuracy: 97,
    rateMin: 3000,
    rateMax: 5500,
    rateUnit: 'per tech pack',
  },
  {
    id: 'kavya-menon',
    name: 'Kavya Menon',
    city: 'Bengaluru',
    fabscore: 9.2,
    tags: ['Kids Wear', 'Casual Wear'],
    software: ['Illustrator', 'Hand Sketch'],
    experience: 5,
    techPacks: 120,
    accuracy: 96,
    rateMin: 2500,
    rateMax: 4500,
    rateUnit: 'per tech pack',
  },
  {
    id: 'zara-khan',
    name: 'Zara Khan',
    city: 'Mumbai',
    fabscore: 9.6,
    tags: ['Luxury', 'Fusion', 'Ethnic Wear'],
    software: ['CLO 3D', 'Illustrator'],
    experience: 11,
    techPacks: 290,
    accuracy: 98,
    rateMin: 4000,
    rateMax: 7000,
    rateUnit: 'per tech pack',
  },
  {
    id: 'aditya-rao',
    name: 'Aditya Rao',
    city: 'Jaipur',
    fabscore: 9.0,
    tags: ['Ethnic Wear', 'Sustainable'],
    software: ['Hand Sketch', 'Illustrator'],
    experience: 6,
    techPacks: 140,
    accuracy: 95,
    rateMin: 2800,
    rateMax: 5000,
    rateUnit: 'per tech pack',
  },
  {
    id: 'pooja-iyer',
    name: 'Pooja Iyer',
    city: 'Chennai',
    fabscore: 9.3,
    tags: ['Western Wear', 'Activewear'],
    software: ['Illustrator', 'CLO 3D', 'Photoshop'],
    experience: 8,
    techPacks: 200,
    accuracy: 97,
    rateMin: 3200,
    rateMax: 5800,
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
  {
    id: 'suresh-pillai',
    name: 'Suresh Pillai',
    city: 'Tirupur',
    fabscore: 9.5,
    tags: ['Knitwear', 'Casual Wear'],
    speciality: ['Pattern Making', 'Grading'],
    experience: 18,
    samples: 267,
    firstAttempt: 98,
    rateMin: 2000,
    rateMax: 4000,
    rateUnit: 'per sample',
  },
  {
    id: 'mohan-lal',
    name: 'Mohan Lal',
    city: 'Jaipur',
    fabscore: 9.3,
    tags: ['Ethnic Wear', 'Hand Embroidery'],
    speciality: ['Draping', 'Hand Finishing'],
    experience: 15,
    samples: 198,
    firstAttempt: 97,
    rateMin: 1800,
    rateMax: 3500,
    rateUnit: 'per sample',
  },
  {
    id: 'krishnan-nair',
    name: 'Krishnan Nair',
    city: 'Lucknow',
    fabscore: 9.2,
    tags: ['Chikankari', 'Ethnic Wear'],
    speciality: ['Hand Embroidery', 'Draping'],
    experience: 17,
    samples: 220,
    firstAttempt: 98,
    rateMin: 1900,
    rateMax: 3800,
    rateUnit: 'per sample',
  },
  {
    id: 'abdul-karim',
    name: 'Abdul Karim',
    city: 'Surat',
    fabscore: 9.0,
    tags: ['Western Wear', 'Denim'],
    speciality: ['Pattern Making', 'Grading'],
    experience: 12,
    samples: 156,
    firstAttempt: 96,
    rateMin: 1700,
    rateMax: 3200,
    rateUnit: 'per sample',
  },
  {
    id: 'ganesh-rao',
    name: 'Ganesh Rao',
    city: 'Mumbai',
    fabscore: 9.4,
    tags: ['Luxury', 'Complex Construction'],
    speciality: ['Draping', 'Pattern Making', 'Grading'],
    experience: 16,
    samples: 245,
    firstAttempt: 98,
    rateMin: 2200,
    rateMax: 4200,
    rateUnit: 'per sample',
  },
]
