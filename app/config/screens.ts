import type { UserType } from '../context/UserContext'

export type QuickAction = {
  icon: string
  title: string
  desc: string
  href: string
}

export type DashboardRightPanel = 'market_prices' | 'verification_status' | 'fabscore'

export type DashboardScreenConfig = {
  title: string
  welcomeMessage: string
  quickActions: QuickAction[]
  emptyActivity: string
  rightPanel: DashboardRightPanel
}

export type SamplesScreenConfig = {
  title: string
  subtitle: string
  tabs: [string, string]
  showPostForm: boolean
  emptyState: string
}

export type ManufacturersMode = 'manufacturers' | 'suppliers' | 'buyers'

export type ManufacturersScreenConfig = {
  title: string
  subtitle: string
  mode: ManufacturersMode
}

export type ProfileScreenConfig = {
  emoji: string
  catalogueSubtitle: string
  categoryOptions: string[]
}

export type EnquiriesScreenConfig = {
  subtitle: string
}

export type AnalyticsScreenConfig = {
  subtitle: string
}

export type OrdersMode = 'buyer-demo' | 'supply-demo' | 'empty'
export type OrdersRightPanel = 'default' | 'supply' | 'project' | 'inspection'

export type OrdersScreenConfig = {
  title: string
  subtitle: string | null
  showCreateButton: boolean
  altButton: { label: string; href?: string } | null
  emptyState: string
  mode: OrdersMode
  rightPanel: OrdersRightPanel
}

export type FabMerchTabId = 'merchandisers' | 'designers' | 'masters' | 'qc-inspectors'

export type FabMerchScreenConfig = {
  subtitle: string
  visibleTabs: FabMerchTabId[]
  showTalentProfile: boolean
}

type ScreenConfig = {
  dashboard: Record<UserType, DashboardScreenConfig>
  samples: Record<UserType, SamplesScreenConfig>
  manufacturers: Record<UserType, ManufacturersScreenConfig>
  profile: Record<UserType, ProfileScreenConfig>
  enquiries: Record<UserType, EnquiriesScreenConfig>
  orders: Record<UserType, OrdersScreenConfig>
  fabmerch: Record<UserType, FabMerchScreenConfig>
  analytics: Record<UserType, AnalyticsScreenConfig>
}

const screenConfig: ScreenConfig = {

  dashboard: {
    buyer: {
      title: 'Dashboard',
      welcomeMessage: 'You are 3 steps away from your first order',
      quickActions: [
        { icon: '🔍', title: 'Find a Manufacturer', desc: 'Browse 200+ verified manufacturers', href: '/manufacturers' },
        { icon: '📋', title: 'Post Sample Brief', desc: 'Get samples from multiple vendors', href: '/samples' },
        { icon: '👔', title: 'Hire a Merchandiser', desc: 'Get expert help per stage', href: '/fabmerch' },
        { icon: '💰', title: 'Check Market Prices', desc: 'See current fabric and making rates', href: '/fabprice' },
      ],
      emptyActivity: 'No activity yet. Place your first order to get started.',
      rightPanel: 'market_prices'
    },
    manufacturer: {
      title: 'Dashboard',
      welcomeMessage: 'Complete verification to start receiving orders',
      quickActions: [
        { icon: '✅', title: 'Complete Verification', desc: 'Get more orders with Gold badge', href: '/verification' },
        { icon: '📋', title: 'Browse Sample Briefs', desc: 'Respond to buyer requests', href: '/samples' },
        { icon: '📦', title: 'View Active Orders', desc: '0 active orders', href: '/orders' },
        { icon: '💳', title: 'Check FabScore', desc: 'Build your credit history', href: '/credit' },
      ],
      emptyActivity: 'No orders yet. Complete verification to appear in search results.',
      rightPanel: 'verification_status'
    },
    fabric_mill: {
      title: 'Dashboard',
      welcomeMessage: 'Connect with brands sourcing your fabrics',
      quickActions: [
        { icon: '📋', title: 'Browse Sample Requests', desc: 'Buyers looking for fabric', href: '/samples' },
        { icon: '📬', title: 'View Enquiries', desc: '3 new enquiries', href: '/enquiries' },
        { icon: '✅', title: 'Get Verified', desc: 'Build buyer trust', href: '/verification' },
        { icon: '💰', title: 'FabPrice Benchmarks', desc: 'See current fabric rates', href: '/fabprice' },
      ],
      emptyActivity: 'No enquiries yet. Complete your profile to attract buyers.',
      rightPanel: 'market_prices'
    },
    trim_supplier: {
      title: 'Dashboard',
      welcomeMessage: 'Connect with manufacturers sourcing your trims',
      quickActions: [
        { icon: '📋', title: 'Browse Trim Requests', desc: 'Manufacturers needing trims', href: '/samples' },
        { icon: '📬', title: 'View Enquiries', desc: '3 new enquiries', href: '/enquiries' },
        { icon: '✅', title: 'Get Verified', desc: 'Build manufacturer trust', href: '/verification' },
        { icon: '👤', title: 'My Profile', desc: 'List your products', href: '/profile' },
      ],
      emptyActivity: 'No enquiries yet.',
      rightPanel: 'market_prices'
    },
    artisan: {
      title: 'Dashboard',
      welcomeMessage: 'Showcase your craft to brands across India',
      quickActions: [
        { icon: '🎨', title: 'Complete Profile', desc: 'Showcase your craft', href: '/profile' },
        { icon: '📋', title: 'Browse Craft Orders', desc: 'Find brands needing your work', href: '/samples' },
        { icon: '✅', title: 'Get GI Verified', desc: 'Unlock premium buyers', href: '/verification' },
        { icon: '📬', title: 'View Enquiries', desc: 'Brands interested in your craft', href: '/enquiries' },
      ],
      emptyActivity: 'No orders yet. Complete your profile to attract buyers.',
      rightPanel: 'verification_status'
    },
    job_worker: {
      title: 'Dashboard',
      welcomeMessage: 'Connect with manufacturers needing your services',
      quickActions: [
        { icon: '📋', title: 'Browse Job Requests', desc: 'Find work matching your skills', href: '/samples' },
        { icon: '📬', title: 'View Enquiries', desc: 'Manufacturers needing your work', href: '/enquiries' },
        { icon: '✅', title: 'Get Verified', desc: 'Build trust with manufacturers', href: '/verification' },
        { icon: '💳', title: 'Check FabScore', desc: 'Build credit history', href: '/credit' },
      ],
      emptyActivity: 'No jobs yet.',
      rightPanel: 'verification_status'
    },
    designer: {
      title: 'FabTalent Dashboard',
      welcomeMessage: 'Brands are looking for your design expertise',
      quickActions: [
        { icon: '📋', title: 'Browse Hire Requests', desc: 'Brands needing designs', href: '/samples' },
        { icon: '✅', title: 'Complete Verification', desc: 'Get FabTalent badge', href: '/verification' },
        { icon: '💼', title: 'Active Projects', desc: '0 active projects', href: '/orders' },
        { icon: '⭐', title: 'Your FabScore', desc: 'Build your reputation', href: '/credit' },
      ],
      emptyActivity: 'No hire requests yet. Complete verification to get more visibility.',
      rightPanel: 'fabscore'
    },
    master: {
      title: 'FabTalent Dashboard',
      welcomeMessage: 'Brands need your expert sample making skills',
      quickActions: [
        { icon: '📋', title: 'Browse Sample Requests', desc: 'Brands needing samples made', href: '/samples' },
        { icon: '✅', title: 'Complete Verification', desc: 'Get skill-verified badge', href: '/verification' },
        { icon: '💼', title: 'Active Projects', desc: '0 active projects', href: '/orders' },
        { icon: '⭐', title: 'Your FabScore', desc: 'Build your reputation', href: '/credit' },
      ],
      emptyActivity: 'No requests yet. Complete verification to appear in search.',
      rightPanel: 'fabscore'
    },
    merchandiser: {
      title: 'FabTalent Dashboard',
      welcomeMessage: 'Brands need your merchandising expertise',
      quickActions: [
        { icon: '📋', title: 'Browse Hire Requests', desc: 'Brands needing merchandising help', href: '/samples' },
        { icon: '✅', title: 'Complete Verification', desc: 'Get interview-verified badge', href: '/verification' },
        { icon: '💼', title: 'Active Projects', desc: '0 active projects', href: '/orders' },
        { icon: '⭐', title: 'Your FabScore', desc: 'Build your reputation', href: '/credit' },
      ],
      emptyActivity: 'No hire requests yet.',
      rightPanel: 'fabscore'
    },
    qc_inspector: {
      title: 'QC Inspector Dashboard',
      welcomeMessage: 'Brands and manufacturers need your inspection expertise',
      quickActions: [
        { icon: '🔍', title: 'Browse Inspection Requests', desc: 'Factories needing QC', href: '/samples' },
        { icon: '✅', title: 'Complete Verification', desc: 'Get skill-tested badge', href: '/verification' },
        { icon: '📅', title: 'Set Availability', desc: 'Update your schedule', href: '/profile' },
        { icon: '📊', title: 'Inspection History', desc: '0 completed', href: '/orders' },
      ],
      emptyActivity: 'No inspection requests yet. Complete verification to get bookings.',
      rightPanel: 'fabscore'
    }
  },

  samples: {
    buyer: {
      title: 'Sample Briefs',
      subtitle: 'Post sample requests to multiple manufacturers',
      tabs: ['My Briefs', 'Post a Brief'],
      showPostForm: true,
      emptyState: 'No briefs posted yet. Post your first brief to get samples from multiple vendors simultaneously.'
    },
    manufacturer: {
      title: 'Sample Brief Requests',
      subtitle: 'Buyers looking for manufacturers like you',
      tabs: ['New Requests', 'My Responses'],
      showPostForm: false,
      emptyState: 'No matching briefs yet. Complete verification to get more visibility.'
    },
    fabric_mill: {
      title: 'Fabric Sample Requests',
      subtitle: 'Buyers requesting fabric samples',
      tabs: ['New Requests', 'My Responses'],
      showPostForm: false,
      emptyState: 'No fabric requests yet.'
    },
    trim_supplier: {
      title: 'Trim Sample Requests',
      subtitle: 'Manufacturers requesting trim samples',
      tabs: ['New Requests', 'My Responses'],
      showPostForm: false,
      emptyState: 'No trim requests yet.'
    },
    artisan: {
      title: 'Craft Order Requests',
      subtitle: 'Brands looking for artisan work',
      tabs: ['New Requests', 'My Responses'],
      showPostForm: false,
      emptyState: 'No craft requests yet.'
    },
    job_worker: {
      title: 'Job Work Requests',
      subtitle: 'Manufacturers looking for job work',
      tabs: ['New Requests', 'My Responses'],
      showPostForm: false,
      emptyState: 'No job requests yet.'
    },
    designer: {
      title: 'Design Hire Requests',
      subtitle: 'Brands looking for designers',
      tabs: ['New Requests', 'Active Projects'],
      showPostForm: false,
      emptyState: 'No hire requests yet. Complete FabTalent verification to get visibility.'
    },
    master: {
      title: 'Sample Making Requests',
      subtitle: 'Brands needing expert sample construction',
      tabs: ['New Requests', 'Active Projects'],
      showPostForm: false,
      emptyState: 'No requests yet.'
    },
    merchandiser: {
      title: 'Merchandising Hire Requests',
      subtitle: 'Brands looking for merchandising help',
      tabs: ['New Requests', 'Active Projects'],
      showPostForm: false,
      emptyState: 'No hire requests yet.'
    },
    qc_inspector: {
      title: 'Inspection Requests',
      subtitle: 'Factories needing quality inspection',
      tabs: ['New Requests', 'Completed'],
      showPostForm: false,
      emptyState: 'No inspection requests yet.'
    }
  },

  manufacturers: {
    buyer: {
      title: 'Find Manufacturers',
      subtitle: 'Browse verified manufacturers for your brand',
      mode: 'manufacturers'
    },
    manufacturer: {
      title: 'Find Suppliers',
      subtitle: 'Source materials from verified suppliers',
      mode: 'suppliers'
    },
    fabric_mill: {
      title: 'Find Buyers',
      subtitle: 'Brands and manufacturers sourcing fabric',
      mode: 'buyers'
    },
    trim_supplier: {
      title: 'Find Buyers',
      subtitle: 'Manufacturers sourcing buttons, zips, thread and trims',
      mode: 'buyers'
    },
    artisan: {
      title: 'Find Buyers',
      subtitle: 'Brands looking for artisan and craft work',
      mode: 'buyers'
    },
    job_worker: {
      title: 'Find Clients',
      subtitle: 'Manufacturers needing processing work',
      mode: 'buyers'
    },
    designer: {
      title: 'Find Clients',
      subtitle: 'Brands and manufacturers looking for your services',
      mode: 'buyers'
    },
    master: {
      title: 'Find Clients',
      subtitle: 'Brands and manufacturers looking for your services',
      mode: 'buyers'
    },
    merchandiser: {
      title: 'Find Clients',
      subtitle: 'Brands and manufacturers looking for your services',
      mode: 'buyers'
    },
    qc_inspector: {
      title: 'Find Jobs',
      subtitle: 'Brands and manufacturers looking for your services',
      mode: 'buyers'
    }
  },

  profile: {
    buyer: {
      emoji: '🛍️',
      catalogueSubtitle: '',
      categoryOptions: []
    },
    manufacturer: {
      emoji: '🏭',
      catalogueSubtitle: 'List your manufacturing capabilities',
      categoryOptions: ['Ethnic Wear', 'Casual Wear', 'Activewear', 'Kids Wear', 'Western Wear', 'Luxury']
    },
    fabric_mill: {
      emoji: '🏗️',
      catalogueSubtitle: 'List the fabrics you produce',
      categoryOptions: ['Cotton', 'Silk', 'Linen', 'Polyester', 'Blended', 'Wool', 'Jute']
    },
    trim_supplier: {
      emoji: '🧷',
      catalogueSubtitle: 'List the trims you supply',
      categoryOptions: ['Buttons', 'Zips', 'Elastic', 'Labels', 'Thread', 'Lining', 'Interfacing']
    },
    artisan: {
      emoji: '🎨',
      catalogueSubtitle: 'Showcase your craft work',
      categoryOptions: ['Chikankari', 'Block Print', 'Zardozi', 'Bandhani / Tie-Dye', 'Hand Weaving', 'Hand Embroidery', 'Kalamkari', 'Natural Dye']
    },
    job_worker: {
      emoji: '🔧',
      catalogueSubtitle: 'List the services you offer',
      categoryOptions: ['Embroidery', 'Printing', 'Washing', 'Dyeing', 'Cutting', 'Finishing', 'Packing']
    },
    designer: {
      emoji: '✏️',
      catalogueSubtitle: '',
      categoryOptions: []
    },
    master: {
      emoji: '✂️',
      catalogueSubtitle: '',
      categoryOptions: []
    },
    merchandiser: {
      emoji: '👔',
      catalogueSubtitle: '',
      categoryOptions: []
    },
    qc_inspector: {
      emoji: '🔍',
      catalogueSubtitle: '',
      categoryOptions: []
    }
  },

  enquiries: {
    buyer: { subtitle: 'Manufacturers responding to your briefs' },
    manufacturer: { subtitle: 'Buyers interested in your services' },
    fabric_mill: { subtitle: 'Brands and manufacturers sourcing fabric' },
    trim_supplier: { subtitle: 'Manufacturers looking for your trims' },
    artisan: { subtitle: 'Brands looking for artisan work' },
    job_worker: { subtitle: 'Manufacturers needing your services' },
    designer: { subtitle: 'Brands interested in hiring you' },
    master: { subtitle: 'Brands interested in hiring you' },
    merchandiser: { subtitle: 'Brands interested in hiring you' },
    qc_inspector: { subtitle: 'Factories interested in booking you' }
  },

  orders: {
    buyer: {
      title: 'My Orders',
      subtitle: null,
      showCreateButton: true,
      altButton: null,
      emptyState: 'No orders yet. Find a manufacturer to place your first order.',
      mode: 'buyer-demo',
      rightPanel: 'default'
    },
    manufacturer: {
      title: 'Production Orders',
      subtitle: 'Orders received from buyers',
      showCreateButton: false,
      altButton: { label: 'Update Production Status' },
      emptyState: 'No orders received yet. Complete verification to appear in search results and start receiving orders.',
      mode: 'empty',
      rightPanel: 'default'
    },
    fabric_mill: {
      title: 'Supply Orders',
      subtitle: 'Fabric orders from manufacturers and brands',
      showCreateButton: false,
      altButton: null,
      emptyState: 'No supply orders yet. Complete your profile and get verified to start receiving orders.',
      mode: 'supply-demo',
      rightPanel: 'supply'
    },
    trim_supplier: {
      title: 'Supply Orders',
      subtitle: 'Trim orders from manufacturers',
      showCreateButton: false,
      altButton: null,
      emptyState: 'No supply orders yet. Complete your profile and get verified to start receiving orders.',
      mode: 'supply-demo',
      rightPanel: 'supply'
    },
    artisan: {
      title: 'Craft Orders',
      subtitle: 'Orders for your artisan work',
      showCreateButton: false,
      altButton: null,
      emptyState: 'No craft orders yet. Join FabTalent to get hired for projects.',
      mode: 'supply-demo',
      rightPanel: 'supply'
    },
    job_worker: {
      title: 'Job Work Orders',
      subtitle: 'Processing orders from manufacturers',
      showCreateButton: false,
      altButton: null,
      emptyState: 'No job work orders yet. Complete verification to start receiving processing orders.',
      mode: 'supply-demo',
      rightPanel: 'supply'
    },
    designer: {
      title: 'Active Projects',
      subtitle: 'Projects hired through FabTalent',
      showCreateButton: false,
      altButton: { label: 'View Hire Requests', href: '/samples' },
      emptyState: 'No active projects yet. Complete verification to appear in FabTalent search results.',
      mode: 'empty',
      rightPanel: 'project'
    },
    master: {
      title: 'Active Projects',
      subtitle: 'Projects hired through FabTalent',
      showCreateButton: false,
      altButton: { label: 'View Hire Requests', href: '/samples' },
      emptyState: 'No active projects yet. Complete verification to appear in FabTalent search results.',
      mode: 'empty',
      rightPanel: 'project'
    },
    merchandiser: {
      title: 'Active Projects',
      subtitle: 'Projects hired through FabTalent',
      showCreateButton: false,
      altButton: { label: 'View Hire Requests', href: '/samples' },
      emptyState: 'No active projects yet. Complete verification to appear in FabTalent search results.',
      mode: 'empty',
      rightPanel: 'project'
    },
    qc_inspector: {
      title: 'Inspection Jobs',
      subtitle: 'Quality inspection bookings',
      showCreateButton: false,
      altButton: { label: 'Set Availability', href: '/credit' },
      emptyState: 'No inspection jobs yet. Complete verification and set your availability to start receiving bookings.',
      mode: 'empty',
      rightPanel: 'inspection'
    }
  },

  fabmerch: {
    buyer: {
      subtitle: 'Hire verified garment professionals per stage',
      visibleTabs: ['merchandisers', 'designers', 'masters', 'qc-inspectors'],
      showTalentProfile: false
    },
    manufacturer: {
      subtitle: 'Book verified QC inspectors for pre-dispatch quality checks',
      visibleTabs: ['qc-inspectors'],
      showTalentProfile: false
    },
    fabric_mill: {
      subtitle: 'Book fabric quality inspection before shipping',
      visibleTabs: ['qc-inspectors'],
      showTalentProfile: false
    },
    trim_supplier: {
      subtitle: 'Book quality inspection for your trim products before shipping',
      visibleTabs: ['qc-inspectors'],
      showTalentProfile: false
    },
    artisan: {
      subtitle: 'Get expert help managing your craft orders',
      visibleTabs: ['merchandisers', 'qc-inspectors'],
      showTalentProfile: false
    },
    job_worker: {
      subtitle: 'Book quality check before dispatching processed goods',
      visibleTabs: ['qc-inspectors'],
      showTalentProfile: false
    },
    designer: { subtitle: '', visibleTabs: [], showTalentProfile: true },
    master: { subtitle: '', visibleTabs: [], showTalentProfile: true },
    merchandiser: { subtitle: '', visibleTabs: [], showTalentProfile: true },
    qc_inspector: { subtitle: '', visibleTabs: [], showTalentProfile: true }
  },

  analytics: {
    buyer: { subtitle: 'Real-time visibility over your entire garment business' },
    manufacturer: { subtitle: 'Your production orders and performance' },
    fabric_mill: { subtitle: 'Your fabric orders and revenue performance' },
    trim_supplier: { subtitle: 'Your supply orders, enquiries, and revenue performance' },
    artisan: { subtitle: 'Your craft orders and performance' },
    job_worker: { subtitle: 'Your job work performance' },
    designer: { subtitle: 'Your projects, earnings, and ratings' },
    master: { subtitle: 'Your projects, earnings, and ratings' },
    merchandiser: { subtitle: 'Your projects, earnings, and ratings' },
    qc_inspector: { subtitle: 'Your projects, earnings, and ratings' }
  }
}

export default screenConfig
