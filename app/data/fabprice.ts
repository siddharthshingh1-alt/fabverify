export type Trend = 'up' | 'down' | 'stable'

export type PriceTiers = {
  small: string
  medium: string
  large: string
}

export type FabricPrice = {
  id: string
  name: string
  tags: string[]
  city: string
  prices: PriceTiers
  trend: Trend
  trendText: string
  updated: string
  history: number[]
}

export type MakingCharge = {
  id: string
  name: string
  description?: string
  city: string
  prices: PriceTiers
  complexity: 'simple' | 'complex'
  updated: string
  history: number[]
}

export type TrimPrice = {
  id: string
  name: string
  material: string
  price: string
  moq: string
  city: string
  updated: string
  history: number[]
}

export const fabricPrices: FabricPrice[] = [
  {
    id: 'cotton-lawn-80gsm',
    name: 'Cotton Lawn 80 GSM',
    tags: ['Printed', 'Plain'],
    city: 'Delhi NCR',
    prices: { small: '₹120–₹140/m', medium: '₹105–₹125/m', large: '₹95–₹110/m' },
    trend: 'up',
    trendText: 'Up 3% this month',
    updated: '2 days ago',
    history: [98, 102, 105, 108, 112, 118],
  },
  {
    id: 'cotton-poplin',
    name: 'Cotton Poplin',
    tags: ['Solid', 'Striped'],
    city: 'Surat',
    prices: { small: '₹100–₹120/m', medium: '₹88–₹105/m', large: '₹80–₹95/m' },
    trend: 'stable',
    trendText: 'Stable',
    updated: '1 day ago',
    history: [95, 98, 96, 97, 99, 98],
  },
  {
    id: 'silk-crepe',
    name: 'Silk Crepe',
    tags: ['Luxury', 'Occasion'],
    city: 'Surat',
    prices: { small: '₹380–₹450/m', medium: '₹320–₹400/m', large: '₹280–₹360/m' },
    trend: 'up',
    trendText: 'Up 5% this month',
    updated: '3 days ago',
    history: [310, 320, 335, 345, 358, 370],
  },
  {
    id: 'linen-plain',
    name: 'Linen Plain',
    tags: ['Sustainable', 'Summer'],
    city: 'Kolkata',
    prices: { small: '₹220–₹280/m', medium: '₹190–₹250/m', large: '₹180–₹230/m' },
    trend: 'down',
    trendText: 'Down 2% this month',
    updated: 'Today',
    history: [265, 258, 252, 248, 245, 242],
  },
]

export const makingCharges: MakingCharge[] = [
  {
    id: 'kurta-basic',
    name: 'Kurta — Basic',
    description: '',
    city: 'Jaipur',
    prices: { small: '₹380–₹480/pc', medium: '₹320–₹420/pc', large: '₹280–₹360/pc' },
    complexity: 'simple',
    updated: 'Today',
    history: [340, 345, 348, 352, 358, 362],
  },
  {
    id: 'kurta-complex',
    name: 'Kurta — Complex',
    description: 'With embroidery or print',
    city: 'Delhi NCR',
    prices: { small: '₹550–₹720/pc', medium: '₹460–₹620/pc', large: '₹400–₹540/pc' },
    complexity: 'complex',
    updated: '1 day ago',
    history: [480, 490, 500, 510, 525, 535],
  },
]

export const trimPrices: TrimPrice[] = [
  {
    id: 'button-4hole-15mm',
    name: 'Button — 4 hole 15mm',
    material: 'Metal',
    price: '₹12–₹22 per piece',
    moq: '100 pieces',
    city: 'Delhi NCR',
    updated: 'Today',
    history: [15, 15, 16, 16, 17, 17],
  },
]
