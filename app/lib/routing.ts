import type { UserType } from '../context/UserContext'

const BASE_PATH: Record<UserType, string> = {
  buyer: '/brand',
  manufacturer: '/manufacturer',
  fabric_mill: '/mill',
  trim_supplier: '/supplier',
  artisan: '/artisan',
  job_worker: '/jobworker',
  designer: '/talent/designer',
  master: '/talent/master',
  merchandiser: '/talent/merchandiser',
  qc_inspector: '/talent/qc',
}

const ORDERS_SLUG: Record<UserType, string> = {
  buyer: 'orders',
  manufacturer: 'orders',
  fabric_mill: 'orders',
  trim_supplier: 'orders',
  artisan: 'orders',
  job_worker: 'orders',
  designer: 'projects',
  master: 'projects',
  merchandiser: 'projects',
  qc_inspector: 'jobs',
}

const DISCOVERY_SLUG: Record<UserType, string> = {
  buyer: 'manufacturers',
  manufacturer: 'buyers',
  fabric_mill: 'buyers',
  trim_supplier: 'buyers',
  artisan: 'buyers',
  job_worker: 'clients',
  designer: 'clients',
  master: 'clients',
  merchandiser: 'clients',
  qc_inspector: 'clients',
}

export function getBasePath(userType: UserType): string {
  return BASE_PATH[userType]
}

export function getOrdersSlug(userType: UserType): string {
  return ORDERS_SLUG[userType]
}

export function getDiscoverySlug(userType: UserType): string {
  return DISCOVERY_SLUG[userType]
}
