import { useEffect, useMemo, useRef, useState, Fragment } from 'react'
import { GoogleMap, LoadScript, OverlayViewF, Polyline } from '@react-google-maps/api'
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  DollarSign,
  FileCheck2,
  FileText,
  Gauge,
  Grid2x2,
  LayoutDashboard,
  Map,
  MapPinned,
  Plus,
  ReceiptText,
  Route,
  Search,
  Settings,
  Truck,
  Upload,
  UserRound,
  UserPlus,
  Users,
  Wallet,
  Warehouse,
  Wrench,
  Check,
  CheckCircle2,
  Download,
  AlertTriangle,
  MoreHorizontal,
  HeartPulse,
  Car,
  X,
  Star,
  Phone,
  Mail,
  ShieldCheck,
  MapPin,
  TrendingUp,
  History,
  Eye,
} from 'lucide-react'

const normalizeApiBaseUrl = (value) => {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

const buildApiUrl = (path) => {
  const normalizedPath = String(path ?? '')

  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) {
    return normalizedPath
  }

  return `${apiBaseUrl}${normalizedPath}`
}

const triggerFileDownload = (filename, content, mimeType = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = window.document.createElement('a')
  link.href = url
  link.download = filename
  window.document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const csvEscape = (value) => {
  const raw = String(value ?? '')
  return `"${raw.replace(/"/g, '""')}"`
}

const toCsv = (rows) => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return ''
  }

  const headers = Object.keys(rows[0])
  const headerRow = headers.map(csvEscape).join(',')
  const bodyRows = rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))
  return [headerRow, ...bodyRows].join('\n')
}

const escapePdfText = (value) => {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, '?')
}

const buildSimplePdfDocument = (title, lines) => {
  const safeTitle = escapePdfText(title)
  const safeLines = Array.isArray(lines)
    ? lines.filter(Boolean).slice(0, 44).map((line) => escapePdfText(line))
    : []

  const contentLines = [safeTitle, '', ...safeLines]
  const textInstructions = [
    'BT',
    '/F1 12 Tf',
    '50 760 Td',
    ...contentLines.flatMap((line, index) => {
      if (index === 0) {
        return [`(${line}) Tj`]
      }

      return ['0 -16 Td', `(${line}) Tj`]
    }),
    'ET',
  ].join('\n')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${textInstructions.length} >>\nstream\n${textInstructions}\nendstream\nendobj\n`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = []

  objects.forEach((objectContent) => {
    offsets.push(pdf.length)
    pdf += objectContent
  })

  const crossReferenceOffset = pdf.length
  const crossReferenceEntries = ['0000000000 65535 f ', ...offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `)]

  pdf += `xref\n0 ${objects.length + 1}\n${crossReferenceEntries.join('\n')}\n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF`

  return pdf
}

const fallbackData = {
  metrics: [
    {
      id: 'active-loads',
      label: 'Active Loads',
      value: '247',
      note: '+12% from yesterday',
      icon: 'truck',
      iconTone: 'bg-blue-100 text-blue-600',
      noteTone: 'text-emerald-600',
    },
    {
      id: 'on-time',
      label: 'On-time %',
      value: '94.2%',
      note: '+2.1% this week',
      icon: 'clock',
      iconTone: 'bg-emerald-100 text-emerald-600',
      noteTone: 'text-emerald-600',
    },
    {
      id: 'trucks-available',
      label: 'Trucks Available',
      value: '89',
      note: 'of 156 total',
      icon: 'fleet',
      iconTone: 'bg-violet-100 text-violet-600',
      noteTone: 'text-slate-500',
    },
    {
      id: 'exceptions',
      label: 'Exceptions',
      value: '12',
      note: '3 critical alerts',
      icon: 'alert',
      iconTone: 'bg-rose-100 text-rose-600',
      noteTone: 'text-rose-500',
    },
    {
      id: 'fuel-cost',
      label: 'Fuel Cost (MTD)',
      value: '$89.2K',
      note: '+8% vs target',
      icon: 'fuel',
      iconTone: 'bg-amber-100 text-amber-600',
      noteTone: 'text-rose-500',
    },
    {
      id: 'revenue',
      label: 'Revenue (MTD)',
      value: '$1.2M',
      note: '+15% vs last month',
      icon: 'revenue',
      iconTone: 'bg-emerald-100 text-emerald-600',
      noteTone: 'text-emerald-600',
    },
  ],
  vehicles: [
    { id: 'FL-4892', lat: 32.7795, lng: -96.7972, status: 'on-time' },
    { id: 'TX-7841', lat: 35.4678, lng: -97.5138, status: 'on-time' },
    { id: 'NY-1847', lat: 32.95, lng: -94.73, status: 'delayed' },
    { id: 'IL-5629', lat: 31.81, lng: -99.31, status: 'critical' },
    { id: 'CA-3952', lat: 30.92, lng: -95.85, status: 'critical' },
    { id: 'GA-9273', lat: 34.1, lng: -84.43, status: 'on-time' },
  ],
  mapSummary: [
    { id: 'total-vehicles', label: 'Total Vehicles', value: '156', valueTone: 'text-slate-800' },
    { id: 'available', label: 'Available', value: '89', valueTone: 'text-emerald-600' },
    { id: 'active-loads', label: 'Active Loads', value: '247', valueTone: 'text-blue-600' },
  ],
  dispatches: [
    {
      id: 'LD-2024-001847',
      route: 'Chicago - Atlanta',
      driver: 'Mike Rodriguez',
      status: 'In Transit',
    },
    {
      id: 'LD-2024-001848',
      route: 'Dallas - Phoenix',
      driver: 'Jennifer Chen',
      status: 'Assigned',
    },
    {
      id: 'LD-2024-001849',
      route: 'Los Angeles - Seattle',
      driver: 'David Thompson',
      status: 'Loading',
    },
    {
      id: 'LD-2024-001850',
      route: 'Miami - Jacksonville',
      driver: 'Maria Santos',
      status: 'Delivered',
    },
    {
      id: 'LD-2024-001851',
      route: 'Houston - New Orleans',
      driver: 'Robert Wilson',
      status: 'Unassigned',
    },
    {
      id: 'LD-2024-001852',
      route: 'Denver - Kansas City',
      driver: 'Lisa Anderson',
      status: 'In Transit',
    },
    {
      id: 'LD-2024-001853',
      route: 'Portland - San Francisco',
      driver: 'James Martinez',
      status: 'Assigned',
    },
    {
      id: 'LD-2024-001854',
      route: 'Nashville - Memphis',
      driver: 'Amanda Taylor',
      status: 'Loading',
    },
  ],
  orders: [
    {
      id: 'LD-2024-001847',
      customerName: 'Walmart Distribution',
      customerType: 'Enterprise Customer',
      customerCode: 'WM',
      customerTone: 'bg-blue-600',
      origin: 'Chicago, IL',
      destination: 'Atlanta, GA',
      eta: 'Feb 8, 14:30',
      status: 'In Transit',
      priority: 'High',
      driver: 'Mike Rodriguez',
      truck: 'FL-4892',
      rate: '$2,850',
      margin: '18.5%',
      pod: true,
    },
    {
      id: 'LD-2024-001848',
      customerName: 'Target Corporation',
      customerType: 'Premium Customer',
      customerCode: 'TG',
      customerTone: 'bg-rose-600',
      origin: 'Dallas, TX',
      destination: 'Phoenix, AZ',
      eta: 'Feb 9, 09:15',
      status: 'Assigned',
      priority: 'Medium',
      driver: 'Jennifer Chen',
      truck: 'TX-7841',
      rate: '$1,950',
      margin: '22.1%',
      pod: false,
    },
    {
      id: 'LD-2024-001849',
      customerName: 'Amazon Logistics',
      customerType: 'High Volume',
      customerCode: 'AM',
      customerTone: 'bg-orange-500',
      origin: 'Los Angeles, CA',
      destination: 'Seattle, WA',
      eta: 'Feb 8, 22:45',
      status: 'Loading',
      priority: 'High',
      driver: 'David Thompson',
      truck: 'CA-3952',
      rate: '$3,200',
      margin: '15.8%',
      pod: false,
    },
    {
      id: 'LD-2024-001850',
      customerName: 'FedEx Ground',
      customerType: 'Express Service',
      customerCode: 'FX',
      customerTone: 'bg-violet-600',
      origin: 'Miami, FL',
      destination: 'Jacksonville, FL',
      eta: 'Feb 7, 16:20',
      status: 'Delivered',
      priority: 'Low',
      driver: 'Maria Santos',
      truck: 'FL-2847',
      rate: '$850',
      margin: '28.2%',
      pod: true,
    },
    {
      id: 'LD-2024-001851',
      customerName: 'Home Depot Supply',
      customerType: 'Regular Customer',
      customerCode: 'HD',
      customerTone: 'bg-teal-600',
      origin: 'Houston, TX',
      destination: 'New Orleans, LA',
      eta: 'Feb 9, 11:00',
      status: 'Unassigned',
      priority: 'Medium',
      driver: 'Not assigned',
      truck: '-',
      rate: '$1,450',
      margin: '19.3%',
      pod: false,
    },
    {
      id: 'LD-2024-001852',
      customerName: 'Costco Wholesale',
      customerType: 'Bulk Orders',
      customerCode: 'CS',
      customerTone: 'bg-indigo-600',
      origin: 'Denver, CO',
      destination: 'Kansas City, MO',
      eta: 'Feb 8, 19:30',
      status: 'In Transit',
      priority: 'High',
      driver: 'Lisa Anderson',
      truck: 'CO-5629',
      rate: '$2,100',
      margin: '21.4%',
      pod: false,
    },
    {
      id: 'LD-2024-001853',
      customerName: 'Safeway Distribution',
      customerType: 'Food & Beverage',
      customerCode: 'SF',
      customerTone: 'bg-green-600',
      origin: 'Portland, OR',
      destination: 'San Francisco, CA',
      eta: 'Feb 9, 07:45',
      status: 'Assigned',
      priority: 'Medium',
      driver: 'James Martinez',
      truck: 'OR-9273',
      rate: '$1,750',
      margin: '17.1%',
      pod: false,
    },
    {
      id: 'LD-2024-001854',
      customerName: 'Kroger Supply Chain',
      customerType: 'Grocery Distribution',
      customerCode: 'KR',
      customerTone: 'bg-pink-600',
      origin: 'Nashville, TN',
      destination: 'Memphis, TN',
      eta: 'Feb 8, 15:20',
      status: 'Loading',
      priority: 'Low',
      driver: 'Amanda Taylor',
      truck: 'TN-4851',
      rate: '$980',
      margin: '25.5%',
      pod: false,
    },
    {
      id: 'LD-2024-001855',
      customerName: 'Best Buy Logistics',
      customerType: 'Retail Electronics',
      customerCode: 'BB',
      customerTone: 'bg-sky-600',
      origin: 'Minneapolis, MN',
      destination: 'Omaha, NE',
      eta: 'Feb 10, 08:40',
      status: 'Assigned',
      priority: 'Medium',
      driver: 'Eric Matthews',
      truck: 'MN-7712',
      rate: '$1,640',
      margin: '18.9%',
      pod: false,
    },
    {
      id: 'LD-2024-001856',
      customerName: 'CVS Distribution',
      customerType: 'Pharma Supplies',
      customerCode: 'CV',
      customerTone: 'bg-red-600',
      origin: 'Columbus, OH',
      destination: 'Detroit, MI',
      eta: 'Feb 10, 12:15',
      status: 'In Transit',
      priority: 'High',
      driver: 'Thomas Reed',
      truck: 'OH-3345',
      rate: '$1,980',
      margin: '20.4%',
      pod: false,
    },
    {
      id: 'LD-2024-001857',
      customerName: 'IKEA Fulfillment',
      customerType: 'Furniture Cargo',
      customerCode: 'IK',
      customerTone: 'bg-yellow-600',
      origin: 'Baltimore, MD',
      destination: 'Richmond, VA',
      eta: 'Feb 10, 17:05',
      status: 'Loading',
      priority: 'Low',
      driver: 'Daniel Clark',
      truck: 'MD-6621',
      rate: '$1,120',
      margin: '23.2%',
      pod: false,
    },
    {
      id: 'LD-2024-001858',
      customerName: 'PepsiCo Freight',
      customerType: 'Beverage Fleet',
      customerCode: 'PP',
      customerTone: 'bg-cyan-600',
      origin: 'St. Louis, MO',
      destination: 'Indianapolis, IN',
      eta: 'Feb 10, 19:45',
      status: 'In Transit',
      priority: 'High',
      driver: 'Rachel Moore',
      truck: 'MO-9204',
      rate: '$2,250',
      margin: '19.8%',
      pod: false,
    },
    {
      id: 'LD-2024-001859',
      customerName: 'Lowe\'s Supply',
      customerType: 'Home Improvement',
      customerCode: 'LW',
      customerTone: 'bg-blue-700',
      origin: 'Charlotte, NC',
      destination: 'Birmingham, AL',
      eta: 'Feb 11, 06:20',
      status: 'Assigned',
      priority: 'Medium',
      driver: 'Nathan Hill',
      truck: 'NC-4019',
      rate: '$1,730',
      margin: '18.1%',
      pod: false,
    },
    {
      id: 'LD-2024-001860',
      customerName: '7-Eleven Network',
      customerType: 'Store Replenishment',
      customerCode: 'SE',
      customerTone: 'bg-emerald-700',
      origin: 'Las Vegas, NV',
      destination: 'Salt Lake City, UT',
      eta: 'Feb 11, 09:35',
      status: 'Unassigned',
      priority: 'Low',
      driver: 'Not assigned',
      truck: '-',
      rate: '$1,410',
      margin: '16.5%',
      pod: false,
    },
    {
      id: 'LD-2024-001861',
      customerName: 'Whole Foods Market',
      customerType: 'Fresh Goods',
      customerCode: 'WF',
      customerTone: 'bg-green-700',
      origin: 'Sacramento, CA',
      destination: 'Reno, NV',
      eta: 'Feb 11, 13:10',
      status: 'Delivered',
      priority: 'Medium',
      driver: 'Olivia Parker',
      truck: 'CA-7708',
      rate: '$980',
      margin: '27.6%',
      pod: true,
    },
    {
      id: 'LD-2024-001862',
      customerName: 'Sysco Logistics',
      customerType: 'Foodservice Bulk',
      customerCode: 'SY',
      customerTone: 'bg-slate-700',
      origin: 'Tulsa, OK',
      destination: 'Little Rock, AR',
      eta: 'Feb 11, 18:25',
      status: 'In Transit',
      priority: 'High',
      driver: 'Brian Scott',
      truck: 'OK-5526',
      rate: '$1,860',
      margin: '20.7%',
      pod: false,
    },
    {
      id: 'LD-2024-001863',
      customerName: 'Wayfair Network',
      customerType: 'Furniture Retail',
      customerCode: 'WY',
      customerTone: 'bg-violet-700',
      origin: 'Cleveland, OH',
      destination: 'Buffalo, NY',
      eta: 'Feb 12, 07:50',
      status: 'Loading',
      priority: 'Medium',
      driver: 'Sophia Perez',
      truck: 'OH-8870',
      rate: '$1,520',
      margin: '17.8%',
      pod: false,
    },
    {
      id: 'LD-2024-001864',
      customerName: 'Nike Distribution',
      customerType: 'Apparel Express',
      customerCode: 'NK',
      customerTone: 'bg-gray-800',
      origin: 'Portland, OR',
      destination: 'Boise, ID',
      eta: 'Feb 12, 10:15',
      status: 'Assigned',
      priority: 'High',
      driver: 'Kevin Adams',
      truck: 'OR-3921',
      rate: '$1,690',
      margin: '19.5%',
      pod: false,
    },
  ],
  alerts: [
    {
      id: 'late-pickup',
      title: 'Late Pickup Alert',
      detail: 'Load LD-2024-001845 is 2 hours behind schedule',
      meta: 'Customer: Walmart Distribution | ETA: 14:30',
      tone: 'rose',
    },
    {
      id: 'hos-warning',
      title: 'HOS Risk Warning',
      detail: 'Driver Mike Rodriguez approaching 11-hour limit',
      meta: 'Truck: FL-4892 | Time remaining: 1h 23m',
      tone: 'amber',
    },
    {
      id: 'temperature-alert',
      title: 'Temperature Alert',
      detail: 'Reefer unit temperature out of range (-18C to -20C)',
      meta: 'Load: LD-2024-001843 | Current: -15C',
      tone: 'blue',
    },
    {
      id: 'unpaid-invoice',
      title: 'Unpaid Invoice',
      detail: 'Invoice INV-2024-0892 overdue by 15 days',
      meta: 'Customer: Target Corp | Amount: $4,250.00',
      tone: 'yellow',
    },
  ],
  quickActions: [
    { id: 'create-load', label: 'Create Load', icon: 'create', style: 'bg-blue-500 hover:bg-blue-600' },
    { id: 'assign-driver', label: 'Assign Driver', icon: 'assign', style: 'bg-emerald-500 hover:bg-emerald-600' },
    { id: 'generate-invoice', label: 'Generate Invoice', icon: 'invoice', style: 'bg-violet-600 hover:bg-violet-700' },
    { id: 'plan-route', label: 'Plan Route', icon: 'route', style: 'bg-orange-500 hover:bg-orange-600' },
  ],
  fleetSummary: [
    { id: 'total', label: 'Total Vehicles', value: '127', textTone: 'text-blue-700', labelTone: 'text-blue-600/80', icon: 'Car', iconTone: 'bg-blue-500', bgScale: 'bg-blue-50 border-blue-100' },
    { id: 'available', label: 'Available', value: '89', textTone: 'text-emerald-700', labelTone: 'text-emerald-600/80', icon: 'CheckCircle2', iconTone: 'bg-emerald-500', bgScale: 'bg-emerald-50 border-emerald-100' },
    { id: 'in-use', label: 'In Use', value: '31', textTone: 'text-amber-600', labelTone: 'text-amber-600/80', icon: 'Truck', iconTone: 'bg-amber-400', bgScale: 'bg-[#fffcf0] border-amber-100' },
    { id: 'maintenance', label: 'Maintenance', value: '7', textTone: 'text-rose-700', labelTone: 'text-rose-600/80', icon: 'Wrench', iconTone: 'bg-rose-500', bgScale: 'bg-rose-50 border-rose-100' },
    { id: 'health', label: 'Health Score', value: '92%', textTone: 'text-purple-700', labelTone: 'text-purple-600/80', icon: 'HeartPulse', iconTone: 'bg-purple-500', bgScale: 'bg-purple-50 border-purple-100' },
  ],
  fleet: [
    {
      id: 'FL-4892', plate: 'FL-4892', model: 'Freightliner Cascadia', category: 'Semi-Truck',
      image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=100&h=80&fit=crop&q=80',
      status: 'Available', statusTone: 'bg-emerald-100/60 text-emerald-600',
      driver: 'Michael Rodriguez', driverAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', driverStatus: 'Available',
      location: 'Chicago, IL', depot: 'Chicago Hub Terminal',
      lastPingLabel: '2 minutes ago', lastPingDate: 'Feb 9, 14:32',
      health: 'Good', healthDot: 'bg-emerald-400'
    },
    {
      id: 'TX-7841', plate: 'TX-7841', model: 'Peterbilt 579', category: 'Semi-Truck',
      image: 'https://images.unsplash.com/photo-1586191552066-d52cd3ae57bf?w=100&h=80&fit=crop&q=80',
      status: 'In Use', statusTone: 'bg-amber-100/60 text-amber-600',
      driver: 'Jennifer Chen', driverAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', driverStatus: 'On Route',
      location: 'Dallas, TX', depot: 'En route to Phoenix',
      lastPingLabel: '5 minutes ago', lastPingDate: 'Feb 9, 14:29',
      health: 'Good', healthDot: 'bg-emerald-400'
    },
    {
      id: 'CA-3952', plate: 'CA-3952', model: 'Volvo VNL 860', category: 'Semi-Truck',
      image: 'https://images.unsplash.com/photo-1610416390145-c454e954a1be?w=100&h=80&fit=crop&q=80',
      status: 'Maintenance', statusTone: 'bg-rose-100/60 text-rose-600',
      driver: 'Unassigned', driverAvatar: '', driverStatus: 'In maintenance',
      location: 'Los Angeles, CA', depot: 'Service Center',
      lastPingLabel: '2 hours ago', lastPingDate: 'Feb 9, 12:15',
      health: 'Fair', healthDot: 'bg-amber-400'
    },
    {
      id: 'CO-5629', plate: 'CO-5629', model: 'Kenworth T680', category: 'Semi-Truck',
      image: 'https://plus.unsplash.com/premium_photo-1661909986326-70e6dc430ff2?w=100&h=80&fit=crop&q=80',
      status: 'Available', statusTone: 'bg-emerald-100/60 text-emerald-600',
      driver: 'David Thompson', driverAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', driverStatus: 'Available',
      location: 'Denver, CO', depot: 'Denver Distribution Center',
      lastPingLabel: '8 minutes ago', lastPingDate: 'Feb 9, 14:26',
      health: 'Good', healthDot: 'bg-emerald-400'
    },
    {
      id: 'TRL-8901', plate: 'TRL-8901', model: '53ft Dry Van', category: 'Trailer',
      image: 'https://images.unsplash.com/photo-1591768793355-74d04bb6615f?w=100&h=80&fit=crop&q=80',
      status: 'In Use', statusTone: 'bg-amber-100/60 text-amber-600',
      driver: 'Maria Santos', driverAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', driverStatus: 'On Route',
      location: 'Atlanta, GA', depot: 'En route to Miami',
      lastPingLabel: '1 minute ago', lastPingDate: 'Feb 9, 14:33',
      health: 'Good', healthDot: 'bg-emerald-400'
    },
    {
      id: 'NY-2847', plate: 'NY-2847', model: 'Mack Anthem', category: 'Semi-Truck',
      image: 'https://images.unsplash.com/photo-1635345472714-c8c122f48d94?w=100&h=80&fit=crop&q=80',
      status: 'Critical', statusTone: 'bg-rose-100/60 text-rose-600',
      driver: 'James Wilson', driverAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', driverStatus: 'Emergency Stop',
      location: 'Albany, NY', depot: 'Roadside assistance needed',
      lastPingLabel: '45 minutes ago', lastPingDate: 'Feb 9, 13:49',
      health: 'Poor', healthDot: 'bg-rose-500'
    },
    {
      id: 'GA-9273', plate: 'GA-9273', model: 'International LT', category: 'Semi-Truck',
      image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=100&h=80&fit=crop&q=80',
      status: 'In Use', statusTone: 'bg-amber-100/60 text-amber-600',
      driver: 'Robert Garcia', driverAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop', driverStatus: 'On Route',
      location: 'Savannah, GA', depot: 'En route to Charlotte',
      lastPingLabel: '3 minutes ago', lastPingDate: 'Feb 9, 14:31',
      health: 'Good', healthDot: 'bg-emerald-400'
    },
    {
      id: 'OH-4519', plate: 'OH-4519', model: 'Western Star 5700', category: 'Semi-Truck',
      image: 'https://images.unsplash.com/photo-1586191552066-d52cd3ae57bf?w=100&h=80&fit=crop&q=80',
      status: 'Available', statusTone: 'bg-emerald-100/60 text-emerald-600',
      driver: 'Lisa Anderson', driverAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', driverStatus: 'Available',
      location: 'Columbus, OH', depot: 'Ohio Distribution Hub',
      lastPingLabel: '10 minutes ago', lastPingDate: 'Feb 9, 14:24',
      health: 'Good', healthDot: 'bg-emerald-400'
    },
    {
      id: 'PA-6182', plate: 'PA-6182', model: 'Freightliner M2', category: 'Box Truck',
      image: 'https://images.unsplash.com/photo-1610416390145-c454e954a1be?w=100&h=80&fit=crop&q=80',
      status: 'In Use', statusTone: 'bg-amber-100/60 text-amber-600',
      driver: 'Eric Matthews', driverAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop', driverStatus: 'Delivering',
      location: 'Philadelphia, PA', depot: 'Last-mile delivery zone',
      lastPingLabel: '1 minute ago', lastPingDate: 'Feb 9, 14:33',
      health: 'Good', healthDot: 'bg-emerald-400'
    },
    {
      id: 'TRL-5540', plate: 'TRL-5540', model: '48ft Flatbed', category: 'Trailer',
      image: 'https://images.unsplash.com/photo-1591768793355-74d04bb6615f?w=100&h=80&fit=crop&q=80',
      status: 'Available', statusTone: 'bg-emerald-100/60 text-emerald-600',
      driver: 'Unassigned', driverAvatar: '', driverStatus: 'Yard parked',
      location: 'Memphis, TN', depot: 'Southwest Yard',
      lastPingLabel: '6 hours ago', lastPingDate: 'Feb 9, 08:34',
      health: 'Good', healthDot: 'bg-emerald-400'
    },
    {
      id: 'WA-3310', plate: 'WA-3310', model: 'Kenworth W990', category: 'Semi-Truck',
      image: 'https://plus.unsplash.com/premium_photo-1661909986326-70e6dc430ff2?w=100&h=80&fit=crop&q=80',
      status: 'In Use', statusTone: 'bg-amber-100/60 text-amber-600',
      driver: 'Amanda Taylor', driverAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop', driverStatus: 'On Route',
      location: 'Seattle, WA', depot: 'En route to Portland',
      lastPingLabel: '7 minutes ago', lastPingDate: 'Feb 9, 14:27',
      health: 'Good', healthDot: 'bg-emerald-400'
    },
    {
      id: 'MI-7025', plate: 'MI-7025', model: 'Peterbilt 389', category: 'Semi-Truck',
      image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=100&h=80&fit=crop&q=80',
      status: 'Maintenance', statusTone: 'bg-rose-100/60 text-rose-600',
      driver: 'Unassigned', driverAvatar: '', driverStatus: 'Engine overhaul',
      location: 'Detroit, MI', depot: 'Authorized Service Center',
      lastPingLabel: '3 days ago', lastPingDate: 'Feb 6, 09:10',
      health: 'Poor', healthDot: 'bg-rose-500'
    },
    {
      id: 'AZ-8844', plate: 'AZ-8844', model: 'Volvo VNR', category: 'Semi-Truck',
      image: 'https://images.unsplash.com/photo-1586191552066-d52cd3ae57bf?w=100&h=80&fit=crop&q=80',
      status: 'Available', statusTone: 'bg-emerald-100/60 text-emerald-600',
      driver: 'Nathan Hill', driverAvatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop', driverStatus: 'Available',
      location: 'Phoenix, AZ', depot: 'Southwest Hub Terminal',
      lastPingLabel: '15 minutes ago', lastPingDate: 'Feb 9, 14:19',
      health: 'Good', healthDot: 'bg-emerald-400'
    },
    {
      id: 'NC-1196', plate: 'NC-1196', model: 'Hino L7', category: 'Box Truck',
      image: 'https://images.unsplash.com/photo-1610416390145-c454e954a1be?w=100&h=80&fit=crop&q=80',
      status: 'In Use', statusTone: 'bg-amber-100/60 text-amber-600',
      driver: 'Rachel Moore', driverAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop', driverStatus: 'Delivering',
      location: 'Raleigh, NC', depot: 'Triangle Distribution',
      lastPingLabel: '4 minutes ago', lastPingDate: 'Feb 9, 14:30',
      health: 'Fair', healthDot: 'bg-amber-400'
    },
    {
      id: 'MN-6630', plate: 'MN-6630', model: 'Navistar HV', category: 'Semi-Truck',
      image: 'https://images.unsplash.com/photo-1635345472714-c8c122f48d94?w=100&h=80&fit=crop&q=80',
      status: 'Available', statusTone: 'bg-emerald-100/60 text-emerald-600',
      driver: 'Brian Scott', driverAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop', driverStatus: 'Available',
      location: 'Minneapolis, MN', depot: 'North Central Yard',
      lastPingLabel: '22 minutes ago', lastPingDate: 'Feb 9, 14:12',
      health: 'Good', healthDot: 'bg-emerald-400'
    },
  ],
  billingStats: [
    { id: 'total-outstanding', label: 'Total Outstanding', value: '$245,890', note: '12 invoices due soon', icon: 'Wallet', iconTone: 'bg-emerald-100 text-emerald-600', bgScale: 'bg-emerald-50 border-emerald-100', textTone: 'text-emerald-700' },
    { id: 'overdue-amount', label: 'Overdue Amount', value: '$42,500', note: '3 critical overdue', icon: 'AlertTriangle', iconTone: 'bg-rose-100 text-rose-600', bgScale: 'bg-rose-50 border-rose-100', textTone: 'text-rose-700' },
    { id: 'processed-this-month', label: 'Processed (MTD)', value: '$890,200', note: '+15% vs last month', icon: 'FileCheck2', iconTone: 'bg-blue-100 text-blue-600', bgScale: 'bg-blue-50 border-blue-100', textTone: 'text-blue-700' },
  ],
  invoiceTabs: ['All Invoices', 'Pending', 'Paid', 'Overdue'],
  invoiceList: [
    {
      id: 'INV-2024-8831',
      customerName: 'Walmart Distribution',
      customerAddress: 'Chicago, IL',
      issueDate: '01 Feb, 2024',
      dueDate: '15 Feb, 2024',
      amount: '$12,450.00',
      status: 'Pending',
      tone: 'bg-[#eff6ff] text-[#3b82f6]',
      statusDots: ['bg-blue-300', 'bg-blue-400', 'bg-slate-200'],
      actionLabel: 'Send Reminder',
      actionTone: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      secondAction: 'Download',
      secondTone: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
    },
    {
      id: 'INV-2024-8832',
      customerName: 'Target Corporation',
      customerAddress: 'Dallas, TX',
      issueDate: '28 Jan, 2024',
      dueDate: '10 Feb, 2024',
      amount: '$8,920.00',
      status: 'Overdue',
      tone: 'bg-[#fef2f2] text-[#ef4444]',
      statusDots: ['bg-red-400', 'bg-red-500', 'bg-red-600'],
      actionLabel: 'Escalate',
      actionTone: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
      secondAction: 'Download',
      secondTone: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
    },
    {
      id: 'INV-2024-8833',
      customerName: 'Amazon Logistics',
      customerAddress: 'Los Angeles, CA',
      issueDate: '15 Jan, 2024',
      dueDate: '30 Jan, 2024',
      amount: '$24,100.00',
      status: 'Paid',
      tone: 'bg-[#ecfdf5] text-[#10b981]',
      statusDots: ['bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500'],
      actionLabel: 'View Receipt',
      actionTone: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
      secondAction: 'Download',
      secondTone: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
    },
    {
      id: 'INV-2024-8834',
      customerName: 'FedEx Ground',
      customerAddress: 'Miami, FL',
      issueDate: '05 Feb, 2024',
      dueDate: '20 Feb, 2024',
      amount: '$3,400.00',
      status: 'Pending',
      tone: 'bg-[#eff6ff] text-[#3b82f6]',
      statusDots: ['bg-blue-300', 'bg-blue-400', 'bg-slate-200'],
      actionLabel: 'Send Reminder',
      actionTone: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      secondAction: 'Download',
      secondTone: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
    },
    {
      id: 'INV-2024-8835',
      customerName: 'Home Depot Supply',
      customerAddress: 'Houston, TX',
      issueDate: '02 Feb, 2024',
      dueDate: '16 Feb, 2024',
      amount: '$6,850.00',
      status: 'Pending',
      tone: 'bg-[#eff6ff] text-[#3b82f6]',
      statusDots: ['bg-blue-300', 'bg-blue-400', 'bg-slate-200'],
      actionLabel: 'Send Reminder',
      actionTone: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      secondAction: 'Download',
      secondTone: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
    },
    {
      id: 'INV-2024-8836',
      customerName: 'Costco Wholesale',
      customerAddress: 'Denver, CO',
      issueDate: '20 Jan, 2024',
      dueDate: '04 Feb, 2024',
      amount: '$15,200.00',
      status: 'Overdue',
      tone: 'bg-[#fef2f2] text-[#ef4444]',
      statusDots: ['bg-red-400', 'bg-red-500', 'bg-red-600'],
      actionLabel: 'Escalate',
      actionTone: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
      secondAction: 'Download',
      secondTone: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
    },
    {
      id: 'INV-2024-8837',
      customerName: 'Safeway Distribution',
      customerAddress: 'Portland, OR',
      issueDate: '10 Jan, 2024',
      dueDate: '25 Jan, 2024',
      amount: '$4,150.00',
      status: 'Paid',
      tone: 'bg-[#ecfdf5] text-[#10b981]',
      statusDots: ['bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500'],
      actionLabel: 'View Receipt',
      actionTone: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
      secondAction: 'Download',
      secondTone: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
    },
    {
      id: 'INV-2024-8838',
      customerName: 'Whole Foods Market',
      customerAddress: 'Sacramento, CA',
      issueDate: '18 Jan, 2024',
      dueDate: '02 Feb, 2024',
      amount: '$9,300.00',
      status: 'Paid',
      tone: 'bg-[#ecfdf5] text-[#10b981]',
      statusDots: ['bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500'],
      actionLabel: 'View Receipt',
      actionTone: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
      secondAction: 'Download',
      secondTone: 'bg-slate-50 text-slate-600 hover:bg-slate-100',
    },
  ],
}

const sidebarItems = [
  { key: 'fleet', label: 'Fleet', icon: Truck },
  { key: 'drivers', label: 'Drivers', icon: UserRound },
  { key: 'warehouses', label: 'Warehouses / Hubs', icon: Warehouse },
  { key: 'settings', label: 'Settings', icon: Settings },
]

const mapContainerStyle = {
  width: '100%',
  height: '430px',
}

const mapCenter = { lat: 33.15, lng: -96.45 }

const statusPalette = {
  'on-time': {
    label: 'On Time',
    dot: 'bg-emerald-500',
  },
  delayed: {
    label: 'Delayed',
    dot: 'bg-amber-500',
  },
  critical: {
    label: 'Critical',
    dot: 'bg-rose-500',
  },
}

const dispatchStatusStyles = {
  'In Transit': 'bg-emerald-50 text-emerald-700',
  Assigned: 'bg-blue-50 text-blue-700',
  Loading: 'bg-amber-50 text-amber-700',
  Delivered: 'bg-violet-50 text-violet-700',
  Unassigned: 'bg-slate-100 text-slate-700',
}

const vehicleMarkerStyles = {
  'on-time': {
    bubble: 'bg-emerald-500',
    dot: 'bg-emerald-500',
  },
  delayed: {
    bubble: 'bg-amber-500',
    dot: 'bg-amber-500',
  },
  critical: {
    bubble: 'bg-rose-500',
    dot: 'bg-rose-500',
  },
}

const metricIcons = {
  truck: Truck,
  clock: Clock3,
  fleet: Truck,
  alert: Bell,
  fuel: Gauge,
  revenue: DollarSign,
}

const alertToneStyles = {
  rose: 'border-rose-200 bg-rose-50',
  amber: 'border-amber-200 bg-amber-50',
  blue: 'border-blue-200 bg-blue-50',
  yellow: 'border-yellow-200 bg-yellow-50',
}

const quickActionIcons = {
  create: Plus,
  assign: UserPlus,
  invoice: FileText,
  route: Map,
}

const orderDetailTabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'stops', label: 'Stops' },
  { key: 'docs', label: 'Docs' },
  { key: 'notes', label: 'Notes' },
  { key: 'billing', label: 'Billing' },
]

const getInitials = (name) => {
  if (!name || name === 'Not assigned') {
    return '--'
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function App() {
  const [dashboardData, setDashboardData] = useState(fallbackData)
  const [activeSection, setActiveSection] = useState('fleet')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [activeOrderTab, setActiveOrderTab] = useState('overview')
  const [orderFilters, setOrderFilters] = useState({
    status: 'All Status',
    customer: 'All Customers',
    priority: 'All',
    query: '',
  })
  const [dispatchFilters, setDispatchFilters] = useState({
    priority: 'All',
    driverStatus: 'All',
    location: 'All Locations',
  })
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [selectedDriverId, setSelectedDriverId] = useState(null)
  const [driverSearchQuery, setDriverSearchQuery] = useState('')
  const [driverFilters, setDriverFilters] = useState({
    status: 'All Status',
    hosRisk: 'All Risk',
    location: 'All Locations',
    rating: 'All Ratings',
  })

  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null)
  const [selectedPodLoadId, setSelectedPodLoadId] = useState(null)
  const [podActiveTab, setPodActiveTab] = useState('All Loads')
  const [activeUploadId, setActiveUploadId] = useState('LOAD-2024-4578')

  const [billingActiveTab, setBillingActiveTab] = useState('All Invoices')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)
  const [billingCurrentPage, setBillingCurrentPage] = useState(1)
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [topDateRange, setTopDateRange] = useState('Last 7 days')
  const [topLocationScope, setTopLocationScope] = useState('All Locations')

  const [routeFilters, setRouteFilters] = useState({
    status: 'All Status',
    timeRange: 'Today',
    driver: 'All Drivers',
  })

  // Settings State
  const [settings, setSettings] = useState({
    driverMatching: true,
    delayRisk: true,
    costLeak: true,
    invoiceAnomaly: false,
    highConfidence: 85,
    mediumConfidence: 65,
    lowConfidence: 45,
    aiExplainability: true,
    overrideTracking: true,
  })
  const [settingsSaveState, setSettingsSaveState] = useState('idle')
  const [settingsLastSavedAt, setSettingsLastSavedAt] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [isDocumentUploading, setIsDocumentUploading] = useState(false)
  const [documentUploadContext, setDocumentUploadContext] = useState(null)
  const [shipmentDocumentsByLoad, setShipmentDocumentsByLoad] = useState({})
  const documentUploadInputRef = useRef(null)

  const mapApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/dashboard'))
        if (!response.ok) {
          throw new Error('Failed to load dashboard data')
        }
        const data = await response.json()
        setDashboardData(data)
      } catch {
        setDashboardData(fallbackData)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/settings?scope=operations'))
        if (!response.ok) {
          return
        }

        const payload = await response.json()
        if (payload?.payload && typeof payload.payload === 'object') {
          setSettings((previous) => ({
            ...previous,
            ...payload.payload,
          }))
        }

        if (payload?.updatedAt) {
          setSettingsLastSavedAt(payload.updatedAt)
        }
      } catch {
        // Keep defaults when settings service is unavailable.
      }
    }

    loadSettings()
  }, [])

  const metrics = useMemo(() => dashboardData.metrics ?? [], [dashboardData.metrics])
  const vehicles = useMemo(() => dashboardData.vehicles ?? [], [dashboardData.vehicles])
  const mapSummary = useMemo(() => dashboardData.mapSummary ?? [], [dashboardData.mapSummary])
  const dispatches = useMemo(() => dashboardData.dispatches ?? [], [dashboardData.dispatches])
  const orders = useMemo(() => dashboardData.orders ?? [], [dashboardData.orders])
  const alerts = useMemo(() => dashboardData.alerts ?? [], [dashboardData.alerts])
  const quickActions = useMemo(() => dashboardData.quickActions ?? [], [dashboardData.quickActions])
  const fleetSummary = useMemo(() => dashboardData.fleetSummary ?? [], [dashboardData.fleetSummary])
  const fleet = useMemo(() => dashboardData.fleet ?? [], [dashboardData.fleet])
  const routesTracking = useMemo(() => dashboardData.routesTracking ?? [], [dashboardData.routesTracking])
  const routeSummary = useMemo(() => dashboardData.routeSummary ?? [], [dashboardData.routeSummary])

  const routeStatusOptions = ['All Status', 'On-time', 'Delayed', 'Critical Delay', 'Active']
  const routeTimeRangeOptions = ['Today', 'Yesterday', 'Last 7 Days']
  const topDateRangeOptions = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'This month']
  const routeDriverOptions = useMemo(() => ['All Drivers', ...new Set(routesTracking.map(r => r.driver))], [routesTracking])
  const topLocationOptions = useMemo(() => {
    const locations = new Set()

    orders.forEach((order) => {
      if (order.origin) {
        locations.add(order.origin)
      }

      if (order.destination) {
        locations.add(order.destination)
      }
    })

    return ['All Locations', ...Array.from(locations).sort((a, b) => a.localeCompare(b))]
  }, [orders])

  useEffect(() => {
    if (topLocationOptions.includes(topLocationScope)) {
      return
    }

    setTopLocationScope('All Locations')
  }, [topLocationOptions, topLocationScope])

  const filteredRoutes = useMemo(() => {
    return routesTracking.filter((route) => {
      const matchStatus = routeFilters.status === 'All Status' || route.status === routeFilters.status
      const matchDriver = routeFilters.driver === 'All Drivers' || route.driver === routeFilters.driver

      return matchStatus && matchDriver
    })
  }, [routesTracking, routeFilters])

  const selectedRoute = useMemo(() => {
    return routesTracking.find(r => r.id === selectedRouteId) ?? null
  }, [routesTracking, selectedRouteId])

  useEffect(() => {
    if (selectedRouteId === null) {
      return
    }

    const hasSelectedRoute = filteredRoutes.some((route) => route.id === selectedRouteId)
    if (!hasSelectedRoute) {
      setSelectedRouteId(null)
    }
  }, [filteredRoutes, selectedRouteId])

  const selectedRoutePanelData = useMemo(() => {
    if (!selectedRoute) {
      return null
    }

    const parsedRemainingMiles = Number.parseInt(String(selectedRoute.distanceRemaining ?? '').replace(/[^\d]/g, ''), 10) || 0
    const safeProgress = Number.isFinite(Number(selectedRoute.progress)) ? Number(selectedRoute.progress) : 0
    const normalizedProgress = Math.max(0, Math.min(Math.round(safeProgress), 100))

    const totalMiles = normalizedProgress > 0 && normalizedProgress < 100
      ? Math.max(parsedRemainingMiles, Math.round(parsedRemainingMiles / (1 - normalizedProgress / 100)))
      : parsedRemainingMiles
    const coveredMiles = Math.max(0, totalMiles - parsedRemainingMiles)
    const routeSuffix = selectedRoute.id?.split('-')?.[1] ?? selectedRoute.id
    const loadId = `LOAD-2024-${routeSuffix}`

    const statusToneMap = {
      'On-time': {
        label: 'On Time',
        text: 'text-emerald-600',
        badge: 'bg-emerald-50 text-emerald-700',
        progressBar: 'bg-emerald-500',
        confidence: '95%',
      },
      Delayed: {
        label: 'Delayed',
        text: 'text-amber-600',
        badge: 'bg-amber-50 text-amber-700',
        progressBar: 'bg-emerald-500',
        confidence: '82%',
      },
      'Critical Delay': {
        label: 'Critical Delay',
        text: 'text-rose-600',
        badge: 'bg-rose-50 text-rose-700',
        progressBar: 'bg-emerald-500',
        confidence: '71%',
      },
      Active: {
        label: 'Active',
        text: 'text-blue-600',
        badge: 'bg-blue-50 text-blue-700',
        progressBar: 'bg-emerald-500',
        confidence: '90%',
      },
    }

    const tone = statusToneMap[selectedRoute.status] ?? statusToneMap.Active
    const finalStop = selectedRoute.stops?.[selectedRoute.stops.length - 1]
    const pickupStop = selectedRoute.stops?.[0]

    const stopItems = [
      {
        id: 'pickup',
        title: `Pickup - ${pickupStop?.location ?? selectedRoute.origin}`,
        subtitle: pickupStop?.status === 'Completed' ? 'Completed' : 'Pending confirmation',
        state: pickupStop?.status === 'Completed' ? 'done' : 'pending',
      },
      {
        id: 'transit',
        title: 'In Transit',
        subtitle: `Current location: ${selectedRoute.currentLocation?.city ?? 'Location unavailable'}`,
        state: selectedRoute.status === 'Critical Delay' ? 'warning' : 'active',
      },
      {
        id: 'delivery',
        title: `Delivery - ${finalStop?.location ?? selectedRoute.destination?.city ?? 'Destination'}`,
        subtitle: `ETA ${selectedRoute.eta}`,
        state: finalStop?.status === 'Completed' ? 'done' : 'pending',
      },
    ]

    const recentEvents = [
      `Departed ${selectedRoute.origin}`,
      `Checkpoint update from ${selectedRoute.currentLocation?.city ?? 'current route position'}`,
      `${tone.label} status toward ${selectedRoute.destination?.city ?? 'destination'}`,
    ]

    return {
      ...selectedRoute,
      loadId,
      tone,
      totalMiles,
      coveredMiles,
      stopItems,
      recentEvents,
      progressLabel: `${coveredMiles.toLocaleString()} / ${totalMiles.toLocaleString()} miles (${normalizedProgress}%)`,
      gpsLabel: selectedRoute.status === 'Critical Delay' ? 'Last GPS update: 6 minutes ago' : 'Last GPS update: 2 minutes ago',
    }
  }, [selectedRoute])

  const [fleetFilters, setFleetFilters] = useState({
    type: 'All Types',
    status: 'All Status',
    location: 'All Locations',
    health: 'All Health',
  })

  const fleetTypeOptions = useMemo(() => ['All Types', ...new Set(fleet.map((v) => v.category))], [fleet])
  const fleetStatusOptions = useMemo(() => ['All Status', ...new Set(fleet.map((v) => v.status))], [fleet])
  const fleetLocationOptions = useMemo(() => ['All Locations', ...new Set(fleet.map((v) => v.location))], [fleet])
  const fleetHealthOptions = useMemo(() => ['All Health', ...new Set(fleet.map((v) => v.health))], [fleet])

  const filteredFleet = useMemo(() => {
    return fleet.filter((vehicle) => {
      const typePass = fleetFilters.type === 'All Types' || vehicle.category === fleetFilters.type
      const statusPass = fleetFilters.status === 'All Status' || vehicle.status === fleetFilters.status
      const locPass = fleetFilters.location === 'All Locations' || vehicle.location === fleetFilters.location
      const healthPass = fleetFilters.health === 'All Health' || vehicle.health === fleetFilters.health
      return typePass && statusPass && locPass && healthPass
    })
  }, [fleet, fleetFilters])

  const mapSummaryWithFallback = useMemo(() => {
    if (mapSummary.length > 0) {
      return mapSummary
    }

    const findMetricValue = (id, fallback) => metrics.find((metric) => metric.id === id)?.value ?? fallback

    return [
      { id: 'total-vehicles', label: 'Total Vehicles', value: '156', valueTone: 'text-slate-800' },
      { id: 'available', label: 'Available', value: findMetricValue('trucks-available', '89'), valueTone: 'text-emerald-600' },
      { id: 'active-loads', label: 'Active Loads', value: findMetricValue('active-loads', '247'), valueTone: 'text-blue-600' },
    ]
  }, [mapSummary, metrics])

  const orderStatusOptions = useMemo(() => ['All Status', ...new Set(orders.map((order) => order.status))], [orders])
  const customerOptions = useMemo(() => ['All Customers', ...new Set(orders.map((order) => order.customerName))], [orders])
  const priorityOptions = useMemo(() => ['All', ...new Set(orders.map((order) => order.priority))], [orders])
  const driverStatusOptions = ['All Status', 'Available', 'On Trip', 'Off Duty']
  const hosRiskOptions = ['All Risk', 'Low', 'Medium', 'High']
  const ratingOptions = ['All Ratings', '4.5+', '4.0+', 'Below 4.0']

  const locationOptions = useMemo(() => {
    const locs = new Set()
    orders.forEach(o => { locs.add(o.origin); locs.add(o.destination) })
    return ['All Locations', ...locs]
  }, [orders])

  const driverLocationOptions = useMemo(() => {
    if (!dashboardData?.drivers) return ['All Locations']
    return ['All Locations', ...new Set(dashboardData.drivers.map(d => d.currentLocation.city))]
  }, [dashboardData?.drivers])

  const filteredDrivers = useMemo(() => {
    if (!dashboardData?.drivers) return []
    return dashboardData.drivers.filter((driver) => {
      const matchStatus = driverFilters.status === 'All Status' || driver.status === driverFilters.status
      const matchRisk = driverFilters.hosRisk === 'All Risk' || driver.hosRisk === driverFilters.hosRisk
      const matchLocation = driverFilters.location === 'All Locations' || driver.currentLocation.city.includes(driverFilters.location)

      let matchRating = true
      if (driverFilters.rating === '4.5+') matchRating = driver.rating >= 4.5
      else if (driverFilters.rating === '4.0+') matchRating = driver.rating >= 4.0
      else if (driverFilters.rating === 'Below 4.0') matchRating = driver.rating < 4.0

      const matchSearch =
        driver.name.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
        driver.id.toLowerCase().includes(driverSearchQuery.toLowerCase())

      return matchStatus && matchRisk && matchLocation && matchRating && matchSearch
    })
  }, [dashboardData?.drivers, driverFilters, driverSearchQuery])

  const selectedDriver = useMemo(() => {
    if (!selectedDriverId || !dashboardData?.drivers) return null
    return dashboardData.drivers.find(d => d.id === selectedDriverId)
  }, [selectedDriverId, dashboardData?.drivers])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeSection === 'dispatch') {
        const priorityPass = dispatchFilters.priority === 'All' || order.priority === dispatchFilters.priority
        const driverPass = dispatchFilters.driverStatus === 'All' ||
          (dispatchFilters.driverStatus === 'Assigned' && order.driver !== 'Not assigned') ||
          (dispatchFilters.driverStatus === 'Unassigned' && order.driver === 'Not assigned')
        const loc = dispatchFilters.location
        const locationPass = loc === 'All Locations' || order.origin === loc || order.destination === loc

        return priorityPass && driverPass && locationPass
      }

      const statusPass = orderFilters.status === 'All Status' || order.status === orderFilters.status
      const customerPass = orderFilters.customer === 'All Customers' || order.customerName === orderFilters.customer
      const priorityPass = orderFilters.priority === 'All' || order.priority === orderFilters.priority

      const query = orderFilters.query.trim().toLowerCase()
      const queryPass =
        query.length === 0 ||
        order.origin.toLowerCase().includes(query) ||
        order.destination.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query)

      return statusPass && customerPass && priorityPass && queryPass
    })
  }, [orders, orderFilters, dispatchFilters, activeSection])

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === selectedOrderId) ?? null
  }, [orders, selectedOrderId])

  useEffect(() => {
    if (!selectedOrderId) {
      return
    }

    const isStillVisible = filteredOrders.some((order) => order.id === selectedOrderId)
    if (!isStillVisible) {
      setSelectedOrderId(null)
    }
  }, [filteredOrders, selectedOrderId])

  const clearOrderFilters = () => {
    if (activeSection === 'dispatch') {
      setDispatchFilters({
        priority: 'All',
        driverStatus: 'All',
        location: 'All Locations',
      })
    } else if (activeSection === 'fleet') {
      setFleetFilters({
        type: 'All Types',
        status: 'All Status',
        location: 'All Locations',
        health: 'All Health',
      })
    } else {
      setOrderFilters({
        status: 'All Status',
        customer: 'All Customers',
        priority: 'All',
        query: '',
      })
    }
  }

  const fetchShipmentDocuments = async (shipmentIdentifier) => {
    const targetId = String(shipmentIdentifier ?? '').trim()
    if (!targetId) {
      return []
    }

    const response = await fetch(buildApiUrl(`/api/documents/shipment/${encodeURIComponent(targetId)}`))
    if (!response.ok) {
      throw new Error('Failed to load shipment documents.')
    }

    const payload = await response.json()
    const documents = Array.isArray(payload?.documents) ? payload.documents : []

    setShipmentDocumentsByLoad((previous) => ({
      ...previous,
      [targetId]: documents,
    }))

    return documents
  }

  const handleOpenDocumentPicker = (shipmentIdentifier) => {
    const targetId = String(shipmentIdentifier ?? '').trim()
    if (!targetId) {
      showActionMessage('No shipment selected for upload.')
      return
    }

    setDocumentUploadContext({
      shipmentIdentifier: targetId,
    })

    if (documentUploadInputRef.current) {
      documentUploadInputRef.current.value = ''
      documentUploadInputRef.current.click()
    }
  }

  const handleDocumentInputChange = async (event) => {
    const inputFile = event.target.files?.[0]
    const shipmentIdentifier = documentUploadContext?.shipmentIdentifier

    if (!inputFile || !shipmentIdentifier) {
      return
    }

    const fileType = String(inputFile.type ?? '').toLowerCase()
    const fileName = String(inputFile.name ?? '').toLowerCase()
    const isPdfFile = fileType === 'application/pdf' || fileName.endsWith('.pdf')
    const isImageFile = fileType.startsWith('image/')

    if (!isPdfFile && !isImageFile) {
      showActionMessage('Only PDF or image files are allowed for POD documents.')
      return
    }

    if (inputFile.size > 10 * 1024 * 1024) {
      showActionMessage('File size must be 10 MB or less.')
      return
    }

    setIsDocumentUploading(true)

    try {
      const formData = new FormData()
      formData.append('shipmentId', shipmentIdentifier)
      formData.append('file', inputFile)

      const response = await fetch(buildApiUrl('/api/documents/upload'), {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed.')
      }

      await fetchShipmentDocuments(shipmentIdentifier)
      setActiveUploadId(null)
      showActionMessage('Document uploaded successfully.')
    } catch {
      showActionMessage('Document upload failed. Please try again.')
    } finally {
      setIsDocumentUploading(false)
      setDocumentUploadContext(null)
    }
  }

  const handleDownloadDocumentById = async (documentId) => {
    const targetId = String(documentId ?? '').trim()
    if (!targetId) {
      return
    }

    try {
      const response = await fetch(buildApiUrl(`/api/documents/${encodeURIComponent(targetId)}/download-url`))
      if (!response.ok) {
        throw new Error('Failed to get download URL.')
      }

      const payload = await response.json()
      if (!payload?.downloadUrl) {
        throw new Error('Download URL missing.')
      }

      window.open(payload.downloadUrl, '_blank', 'noopener,noreferrer')
    } catch {
      showActionMessage('Unable to download document right now.')
    }
  }

  const handleDownloadLatestDocument = async (shipmentIdentifier) => {
    const targetId = String(shipmentIdentifier ?? '').trim()
    if (!targetId) {
      showActionMessage('No shipment selected for download.')
      return
    }

    try {
      const existing = shipmentDocumentsByLoad[targetId]
      const documents = Array.isArray(existing) && existing.length > 0
        ? existing
        : await fetchShipmentDocuments(targetId)

      if (!documents.length) {
        showActionMessage('No uploaded documents found for this shipment yet.')
        return
      }

      await handleDownloadDocumentById(documents[0].id)
    } catch {
      showActionMessage('Unable to fetch shipment documents.')
    }
  }

  const handleSaveAllChanges = async () => {
    setSettingsSaveState('saving')

    try {
      const response = await fetch(buildApiUrl('/api/settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scope: 'operations',
          payload: settings,
        }),
      })

      if (!response.ok) {
        throw new Error('Save failed.')
      }

      const payload = await response.json()
      setSettingsLastSavedAt(payload?.updatedAt ?? new Date().toISOString())
      setSettingsSaveState('saved')

      window.setTimeout(() => {
        setSettingsSaveState('idle')
      }, 1400)
    } catch {
      setSettingsSaveState('error')
      showActionMessage('Failed to save settings to backend.')
    }
  }

  const handleExportConfiguration = () => {
    triggerFileDownload(
      'operations-settings.json',
      JSON.stringify({
        scope: 'operations',
        settings,
        savedAt: settingsLastSavedAt,
      }, null, 2),
      'application/json;charset=utf-8'
    )
  }

  const handleExportRoutesData = () => {
    const rows = routesTracking.map((route) => ({
      routeId: route.id,
      driver: route.driver,
      status: route.status,
      progress: route.progress,
      eta: route.eta,
      origin: route.origin,
      destination: route.destination?.city ?? route.destination,
    }))

    triggerFileDownload('routes-tracking.csv', toCsv(rows), 'text/csv;charset=utf-8')
  }

  const handleExportInvoices = () => {
    const invoiceRows = (dashboardData.invoiceList ?? []).map((invoice) => ({
      invoiceId: invoice.id,
      customer: invoice.customerName,
      amount: invoice.amount,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
    }))

    triggerFileDownload('invoices.csv', toCsv(invoiceRows), 'text/csv;charset=utf-8')
  }

  const handleExportReports = () => {
    const reportRows = [
      { report: 'On-time Performance', value: '94.2%' },
      { report: 'Delay Events', value: '17' },
      { report: 'Driver Utilization', value: '82%' },
      { report: 'Revenue Trend', value: '+15%' },
      { report: 'Margin Analysis', value: '18.5%' },
    ]

    triggerFileDownload('reports-summary.csv', toCsv(reportRows), 'text/csv;charset=utf-8')
  }

  const handleExportPodReport = (podRows) => {
    const rows = (podRows ?? []).map((item) => ({
      loadId: item.id,
      customer: item.customerName,
      driver: item.driverName,
      status: item.status,
      deliveredAt: `${item.date} ${item.time}`,
    }))

    triggerFileDownload('pod-report.csv', toCsv(rows), 'text/csv;charset=utf-8')
  }

  const showActionMessage = (message) => {
    setActionMessage(message)
  }

  const handleTopDateRangeChange = (event) => {
    setTopDateRange(event.target.value)
  }

  const handleTopLocationScopeChange = (event) => {
    setTopLocationScope(event.target.value)
  }

  const handleOpenAlertsCenter = () => {
    const activeAlerts = alerts.length
    showActionMessage(`You have ${activeAlerts} active alert${activeAlerts === 1 ? '' : 's'}.`)
  }

  const handleQuickAction = (actionId) => {
    if (actionId === 'create-load') {
      setActiveSection('orders')
      setSelectedOrderId(filteredOrders[0]?.id ?? orders[0]?.id ?? null)
      showActionMessage('Load creation workspace opened.')
      return
    }

    if (actionId === 'assign-driver') {
      setActiveSection('dispatch')
      showActionMessage('Dispatch board opened for driver assignment.')
      return
    }

    if (actionId === 'generate-invoice') {
      setActiveSection('billing')
      showActionMessage('Billing section opened to generate invoice.')
      return
    }

    if (actionId === 'plan-route') {
      setActiveSection('routes')
      showActionMessage('Routes and tracking section opened.')
    }
  }

  const handlePrimaryBoardAction = () => {
    if (activeSection === 'dispatch') {
      showActionMessage('Auto-assignment run completed for visible dispatch loads.')
      return
    }

    const targetShipment = selectedOrderId ?? filteredOrders[0]?.id ?? orders[0]?.id ?? 'orders-import'
    handleOpenDocumentPicker(targetShipment)
  }

  const handleCreateLoadAction = () => {
    setActiveSection('orders')
    const nextOrder = filteredOrders[0]?.id ?? orders[0]?.id ?? null
    if (nextOrder) {
      setSelectedOrderId(nextOrder)
    }
    showActionMessage('Load board ready. Start by selecting a load card.')
  }

  const handleSendOrderNote = () => {
    showActionMessage('Note sent to dispatch communication timeline.')
  }

  const handleImportFleetData = () => {
    const targetShipment = selectedVehicle?.id ?? filteredFleet[0]?.id ?? 'fleet-import'
    handleOpenDocumentPicker(targetShipment)
  }

  const handleScheduleMaintenance = () => {
    const candidate = filteredFleet.find((vehicle) => vehicle.status === 'Maintenance') ?? filteredFleet[0] ?? null
    if (candidate) {
      setSelectedVehicle(candidate)
    }
    showActionMessage('Opened vehicle details for maintenance scheduling.')
  }

  const handleAddVehicle = () => {
    setActiveSection('fleet')
    showActionMessage('Vehicle onboarding flow opened in Fleet section.')
  }

  const handleFleetRowAction = (vehicle) => {
    setSelectedVehicle(vehicle)
    showActionMessage(`Opened quick actions for ${vehicle.plate}.`)
  }

  const handleImportDrivers = () => {
    handleOpenDocumentPicker(selectedDriverId ?? filteredDrivers[0]?.id ?? 'driver-import')
  }

  const handleExportComplianceReport = () => {
    const rows = filteredDrivers.map((driver) => ({
      driverId: driver.id,
      name: driver.name,
      licenseType: driver.licenseType,
      status: driver.status,
      hosRisk: driver.hosRisk,
      rating: driver.rating,
    }))

    triggerFileDownload('driver-compliance-report.csv', toCsv(rows), 'text/csv;charset=utf-8')
  }

  const handleAddDriver = () => {
    setActiveSection('drivers')
    showActionMessage('Driver onboarding flow opened in Driver Management.')
  }

  const handleDriverRowAction = (driver) => {
    setSelectedDriverId(driver.id)
    showActionMessage(`Opened quick actions for ${driver.name}.`)
  }

  const handleRouteOptimization = () => {
    const prioritizedRoute = filteredRoutes.find((route) => route.status !== 'On-time') ?? filteredRoutes[0] ?? null
    if (prioritizedRoute) {
      setSelectedRouteId(prioritizedRoute.id)
      showActionMessage(`Optimization suggestions loaded for ${prioritizedRoute.id}.`)
      return
    }

    showActionMessage('No routes available for optimization right now.')
  }

  const handleSettingsShortcut = (message) => {
    setActiveSection('settings')
    showActionMessage(message)
  }

  const handleWarehouseShortcut = (message) => {
    showActionMessage(message)
  }

  const handleBillingFiltersReset = () => {
    setBillingCurrentPage(1)
    setSelectedInvoiceId(null)
    showActionMessage('Billing filters reset to defaults.')
  }

  const handleCreateInvoice = () => {
    setSelectedInvoiceId(dashboardData.invoiceList?.[0]?.id ?? null)
    showActionMessage('Invoice workspace opened. Select a customer to continue.')
  }

  const handleInvoiceRowView = (invoiceId) => {
    setSelectedInvoiceId(invoiceId)
  }

  const handleInvoiceAction = (invoice) => {
    if (!invoice) {
      return
    }

    if (invoice.status === 'Overdue') {
      showActionMessage(`Payment reminder sent for ${invoice.id}.`)
      return
    }

    triggerFileDownload(
      `${invoice.id.toLowerCase()}-summary.csv`,
      toCsv([{
        invoiceId: invoice.id,
        customer: invoice.customerName,
        amount: invoice.amount,
        status: invoice.status,
        dueDate: invoice.dueDate,
      }]),
      'text/csv;charset=utf-8'
    )
  }

  const handleSendInvoice = (invoice) => {
    if (!invoice) {
      return
    }

    showActionMessage(`Invoice ${invoice.id} sent to ${invoice.customerName}.`)
  }

  const handlePodView = (loadId) => {
    setSelectedPodLoadId(loadId)
  }

  const handlePodApprove = (loadId) => {
    setSelectedPodLoadId(loadId)
    showActionMessage(`POD for ${loadId} marked as approved in this session.`)
  }

  const reportExportRows = {
    'on-time-performance': [
      { metric: 'On-time Delivery', value: '94.2%' },
      { metric: 'Delayed Deliveries', value: '5.8%' },
      { metric: 'Average Delay', value: '23 minutes' },
    ],
    'delays-by-lane': [
      { lane: 'Route 15', delays: '34', averageDelay: '2.9h' },
      { lane: 'Route 7', delays: '19', averageDelay: '2.1h' },
      { lane: 'Route 22', delays: '13', averageDelay: '1.4h' },
    ],
    'driver-performance': [
      { metric: 'Average Rating', value: '4.8' },
      { metric: 'Completion Rate', value: '96.7%' },
      { metric: 'Active Drivers', value: '42' },
    ],
    'revenue-trends': [
      { period: 'Week 1', revenue: '$412,000' },
      { period: 'Week 2', revenue: '$438,000' },
      { period: 'Week 3', revenue: '$451,000' },
    ],
    'margin-analysis': [
      { lane: 'Chicago - Atlanta', margin: '18.4%' },
      { lane: 'Dallas - Phoenix', margin: '21.1%' },
      { lane: 'Miami - Jacksonville', margin: '26.3%' },
    ],
    accessorials: [
      { type: 'Detention', amount: '$36,200' },
      { type: 'Loading', amount: '$22,700' },
      { type: 'Fuel Adjustment', amount: '$12,400' },
    ],
    'ar-aging': [
      { bucket: 'Current', amount: '$413,000' },
      { bucket: '1-30', amount: '$156,000' },
      { bucket: '31-60', amount: '$88,000' },
      { bucket: '61+', amount: '$72,000' },
    ],
  }

  const handleReportExport = (reportId, format) => {
    const normalizedReportId = String(reportId ?? '').trim() || 'report'
    const rows = reportExportRows[normalizedReportId] ?? [{ report: normalizedReportId, value: 'Summary generated' }]

    if (format === 'pdf') {
      const summaryLines = rows
        .map((row) => Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(' | '))
      const pdfDocument = buildSimplePdfDocument(`Report: ${normalizedReportId}`, summaryLines)

      triggerFileDownload(`${normalizedReportId}.pdf`, pdfDocument, 'application/pdf')
      return
    }

    triggerFileDownload(`${normalizedReportId}.csv`, toCsv(rows), 'text/csv;charset=utf-8')
  }

  const handleToggleAiSummary = (reportId) => {
    showActionMessage(`AI summary refreshed for ${reportId}.`)
  }

  useEffect(() => {
    if (!selectedOrder?.id) {
      return
    }

    fetchShipmentDocuments(selectedOrder.id).catch(() => {
      // Keep UI usable if docs API fails.
    })
  }, [selectedOrder?.id])

  useEffect(() => {
    if (!actionMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setActionMessage('')
    }, 3200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [actionMessage])

  return (
    <LoadScript googleMapsApiKey={mapApiKey}>
      <div className="h-screen w-full bg-slate-50 text-slate-900">
        <input
          ref={documentUploadInputRef}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={handleDocumentInputChange}
        />
        <div className="flex h-full w-full overflow-hidden bg-white">
          <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
            <div className="px-7 pb-6 pt-7">
              <h1 className="text-3xl font-extrabold tracking-tight text-blue-500">FleetFlow</h1>
            </div>
            <nav className="flex-1 space-y-1 px-4 pb-6">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${isActive
                      ? 'bg-blue-500 text-white shadow-[0_8px_20px_-12px_rgba(37,99,235,0.9)]'
                      : 'text-slate-600 hover:bg-slate-100'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </aside>

          <main className="flex-1 overflow-hidden flex flex-col">
            <header className="border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-[260px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search loads, trucks, drivers..."
                    className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>

                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <select
                    value={topDateRange}
                    onChange={handleTopDateRangeChange}
                    className="bg-transparent text-sm text-slate-700 focus:outline-none"
                    aria-label="Dashboard date range"
                  >
                    {topDateRangeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </label>

                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  <MapPinned className="h-4 w-4 text-slate-400" />
                  <select
                    value={topLocationScope}
                    onChange={handleTopLocationScopeChange}
                    className="bg-transparent text-sm text-slate-700 focus:outline-none"
                    aria-label="Dashboard location scope"
                  >
                    {topLocationOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </label>

                <div className="ml-auto flex items-center gap-4">
                  <button type="button" onClick={handleOpenAlertsCenter} className="relative rounded-full p-1.5 text-slate-500 hover:bg-slate-100">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1 top-1 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
                  </button>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">Sarah Johnson</p>
                      <p className="text-xs text-slate-500">Operations Manager</p>
                    </div>
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      SJ
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {sidebarItems.slice(0, 6).map((item) => {
                  const isActive = activeSection === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveSection(item.key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </header>

            {activeSection === 'dashboard' ? (
              <section className="dashboard-scrollbar h-[calc(100vh-85px)] overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                  {metrics.map((metric) => {
                    const Icon = metricIcons[metric.icon] ?? Truck
                    return (
                      <article
                        key={metric.id}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_12px_35px_-30px_rgba(15,23,42,0.35)]"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
                          <div className={`rounded-full p-2 ${metric.iconTone}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                        </div>
                        <p className="mt-2 text-[2rem] font-extrabold tracking-tight text-slate-900">{metric.value}</p>
                        <p className={`text-sm font-semibold ${metric.noteTone}`}>{metric.note}</p>
                      </article>
                    )
                  })}
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[2.2fr_1fr]">
                  <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_-30px_rgba(15,23,42,0.35)]">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h2 className="text-[1.65rem] font-bold tracking-tight text-slate-800">Live Operations</h2>
                    </div>

                    <div className="relative p-4">
                      <div className="overflow-hidden rounded-2xl border border-slate-200 h-[430px]">
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%' }}
                          center={mapCenter}
                          zoom={6}
                          options={{
                            mapTypeControl: false,
                            streetViewControl: false,
                            fullscreenControl: false,
                            zoomControl: true,
                          }}
                        >
                          {vehicles.map((vehicle) => {
                            const markerTone = vehicleMarkerStyles[vehicle.status] ?? vehicleMarkerStyles['on-time']

                            return (
                              <OverlayViewF
                                key={vehicle.id}
                                position={{ lat: vehicle.lat, lng: vehicle.lng }}
                                mapPaneName="overlayMouseTarget"
                                getPixelPositionOffset={(width, height) => ({
                                  x: -(width / 2),
                                  y: -(height / 2),
                                })}
                              >
                                <div className="group relative" title={`${vehicle.id} | ${statusPalette[vehicle.status]?.label}`}>
                                  <div className={`grid h-10 w-10 place-items-center rounded-full border-2 border-white text-white shadow-xl ${markerTone.bubble}`}>
                                    <Truck className="h-4 w-4" />
                                  </div>
                                  <span className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${markerTone.dot}`}></span>
                                  <span className={`absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full ${markerTone.dot} animate-ping opacity-75`}></span>
                                </div>
                              </OverlayViewF>
                            )
                          })}
                        </GoogleMap>
                      </div>

                      <div className="absolute right-8 top-8 z-20 w-40 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
                        <p className="text-sm font-bold text-slate-700">Vehicle Status</p>
                        <div className="mt-2 space-y-2">
                          {Object.entries(statusPalette).map(([statusKey, status]) => (
                            <div key={statusKey} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                              <span className={`h-2.5 w-2.5 rounded-full ${status.dot}`}></span>
                              <span>{status.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="absolute bottom-8 left-8 z-20 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur">
                        <div className="grid grid-cols-3 divide-x divide-slate-200">
                          {mapSummaryWithFallback.map((item) => (
                            <div key={item.id} className="px-4 py-3.5">
                              <p className={`text-[1.65rem] font-black leading-none ${item.valueTone}`}>{item.value}</p>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_-30px_rgba(15,23,42,0.35)]">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h2 className="text-[1.4rem] font-bold tracking-tight text-slate-800">Today's Dispatch</h2>
                    </div>
                    <div className="max-h-[540px] divide-y divide-slate-200 overflow-y-auto px-4 py-3">
                      {dispatches.map((dispatch) => (
                        <div key={dispatch.id} className="py-3 first:pt-1 last:pb-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[1.12rem] font-black leading-tight tracking-tight text-slate-800">{dispatch.id}</p>
                              <p className="text-[0.84rem] font-semibold text-slate-500">{dispatch.route}</p>
                              <p className="text-[0.8rem] font-medium text-slate-500">Driver: {dispatch.driver}</p>
                            </div>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${dispatchStatusStyles[dispatch.status] ?? 'bg-slate-100 text-slate-700'
                                }`}
                            >
                              {dispatch.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
                  <article className="rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_-30px_rgba(15,23,42,0.35)]">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h2 className="text-[1.65rem] font-bold tracking-tight text-slate-800">Alerts & Exceptions</h2>
                    </div>
                    <div className="space-y-3 p-4">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`rounded-2xl border px-4 py-3 ${alertToneStyles[alert.tone] ?? 'border-slate-200 bg-slate-50'}`}
                        >
                          <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                            <div>
                              <p className="text-[1rem] font-bold tracking-tight text-slate-700">{alert.title}</p>
                              <p className="text-[0.86rem] font-medium text-slate-600">{alert.detail}</p>
                              <p className="mt-1 text-[0.84rem] font-semibold text-slate-500">{alert.meta}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_-30px_rgba(15,23,42,0.35)]">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h2 className="text-[1.65rem] font-bold tracking-tight text-slate-800">Quick Actions</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
                      {quickActions.map((action) => {
                        const Icon = quickActionIcons[action.icon] ?? Plus
                        return (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => handleQuickAction(action.id)}
                            className={`inline-flex min-h-[72px] items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-[0.95rem] font-bold text-white shadow-md transition ${action.style}`}
                          >
                            <Icon className="h-4 w-4" />
                            {action.label}
                          </button>
                        )
                      })}
                    </div>
                  </article>
                </div>

                {isLoading ? (
                  <p className="mt-4 text-sm font-medium text-slate-400">Loading live metrics...</p>
                ) : null}
              </section>
            ) : (activeSection === 'orders' || activeSection === 'dispatch') ? (
              <section className="h-[calc(100vh-85px)] overflow-hidden relative">
                <div className="flex h-full min-h-0 overflow-hidden relative">
                  <article className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
                    <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                      <h2 className="text-[2rem] font-bold tracking-tight text-slate-800">
                        {activeSection === 'dispatch' ? 'Dispatch Board' : 'Orders / Loads'}
                      </h2>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePrimaryBoardAction}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
                        >
                          {activeSection === 'dispatch' ? (
                            <>
                              <UserPlus className="h-4 w-4" />
                              Auto-Assign
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4" />
                              Import Loads
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateLoadAction}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
                        >
                          <Plus className="h-4 w-4" />
                          Create New Load
                        </button>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-wrap items-center gap-4 border-b border-slate-200 px-5 py-3">
                      {activeSection === 'dispatch' ? (
                        <>
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <span>Priority:</span>
                            <select
                              value={dispatchFilters.priority}
                              onChange={(event) => setDispatchFilters((prev) => ({ ...prev, priority: event.target.value }))}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                            >
                              {priorityOptions.map((priority) => (
                                <option key={priority} value={priority}>{priority}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <span>Driver Status:</span>
                            <select
                              value={dispatchFilters.driverStatus}
                              onChange={(event) => setDispatchFilters((prev) => ({ ...prev, driverStatus: event.target.value }))}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                            >
                              {driverStatusOptions.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <span>Location:</span>
                            <select
                              value={dispatchFilters.location}
                              onChange={(event) => setDispatchFilters((prev) => ({ ...prev, location: event.target.value }))}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 max-w-[200px]"
                            >
                              {locationOptions.map((loc) => (
                                <option key={loc} value={loc} className="truncate">{loc}</option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <span>Status:</span>
                            <select
                              value={orderFilters.status}
                              onChange={(event) => setOrderFilters((prev) => ({ ...prev, status: event.target.value }))}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                            >
                              {orderStatusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <span>Customer:</span>
                            <select
                              value={orderFilters.customer}
                              onChange={(event) => setOrderFilters((prev) => ({ ...prev, customer: event.target.value }))}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                            >
                              {customerOptions.map((customer) => (
                                <option key={customer} value={customer}>
                                  {customer}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <span>Priority:</span>
                            <select
                              value={orderFilters.priority}
                              onChange={(event) => setOrderFilters((prev) => ({ ...prev, priority: event.target.value }))}
                              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700"
                            >
                              {priorityOptions.map((priority) => (
                                <option key={priority} value={priority}>
                                  {priority}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex min-w-[260px] flex-1 items-center gap-2 text-sm font-semibold text-slate-600">
                            <span>Origin/Destination:</span>
                            <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
                              <Search className="h-4 w-4 text-slate-400" />
                              <input
                                value={orderFilters.query}
                                onChange={(event) => setOrderFilters((prev) => ({ ...prev, query: event.target.value }))}
                                type="text"
                                placeholder="Search locations..."
                                className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                              />
                            </div>
                          </div>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={clearOrderFilters}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition"
                      >
                        <X className="h-4 w-4" />
                        Clear All
                      </button>
                    </div>

                    {activeSection === 'dispatch' ? (
                      <div className="dashboard-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-hidden bg-slate-50/50 p-6 flex gap-6">
                        {[
                          { id: 'Unassigned', label: 'Unassigned', dot: 'bg-slate-400', badge: 'bg-slate-100 text-slate-700' },
                          { id: 'Assigned', label: 'Assigned', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
                          { id: 'In Transit', label: 'In-Transit', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
                          { id: 'Loading', label: 'Loading', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
                          { id: 'Delivered', label: 'Delivered', dot: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
                        ].map(column => {
                          const columnOrders = filteredOrders.filter(o => o.status === column.id)
                          return (
                            <div key={column.id} className="flex h-full min-w-[320px] max-w-[320px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 shrink-0">
                                <div className="flex items-center gap-2 text-[1rem] font-bold text-slate-700">
                                  <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`}></span>
                                  {column.label}
                                  <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-bold ${column.badge}`}>
                                    {columnOrders.length}
                                  </span>
                                </div>
                              </div>
                              <div className="dashboard-scrollbar flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
                                {columnOrders.map(order => (
                                  <div
                                    key={order.id}
                                    onClick={() => { setSelectedOrderId(order.id); setActiveOrderTab('overview') }}
                                    className={`group rounded-xl border bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition cursor-pointer ${selectedOrderId === order.id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span className="text-[0.95rem] font-bold text-blue-500 truncate pointer-events-none">
                                        {order.id}
                                      </span>
                                      <span className={`rounded-md px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider shrink-0 ${order.priority === 'High' ? 'bg-rose-100 text-rose-700' :
                                        order.priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                                          'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {order.priority}
                                      </span>
                                    </div>
                                    <p className="mt-3 text-[0.9rem] font-bold text-slate-700">
                                      {order.origin.split(',')[0]} <ArrowRight className="inline h-3 w-3 text-slate-400 mx-0.5" /> {order.destination.split(',')[0]}
                                    </p>
                                    <p className="mt-1 text-[0.8rem] font-semibold text-slate-500">
                                      {order.status === 'Delivered' ? `Delivered: ${order.eta}` : `ETA: ${order.eta}`}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-[0.85rem] font-semibold text-slate-600">
                                        {order.driver === 'Not assigned' ? (
                                          'Unassigned'
                                        ) : (
                                          <>
                                            <div className="grid h-6 w-6 place-items-center rounded-full bg-slate-700 text-[0.6rem] font-black text-white shrink-0">
                                              {getInitials(order.driver)}
                                            </div>
                                            <span className="truncate max-w-[120px]">{order.driver}</span>
                                          </>
                                        )}
                                      </div>
                                      <span className="text-[0.9rem] font-bold text-slate-700">{order.rate}</span>
                                    </div>
                                  </div>
                                ))}
                                {columnOrders.length === 0 && (
                                  <div className="py-6 text-center text-sm font-semibold text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                                    No loads
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="dashboard-scrollbar min-h-0 flex-1 overflow-auto">
                        <table className="min-w-[1380px] w-full border-collapse">
                          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-[0.74rem] font-black uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-5 py-3">Load ID</th>
                              <th className="px-4 py-3">Customer</th>
                              <th className="px-4 py-3">Pickup to Drop</th>
                              <th className="px-4 py-3">ETA</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Assigned Driver</th>
                              <th className="px-4 py-3">Truck</th>
                              <th className="px-4 py-3">Rate</th>
                              <th className="px-4 py-3">Margin</th>
                              <th className="px-4 py-3">POD</th>
                            </tr>
                          </thead>
                          <tbody className="text-[0.92rem] text-slate-700">
                            {filteredOrders.map((order) => (
                              <tr
                                key={order.id}
                                onClick={() => {
                                  setSelectedOrderId(order.id)
                                  setActiveOrderTab('overview')
                                }}
                                className={`border-t border-slate-200 hover:bg-slate-50/70 cursor-pointer transition-colors ${selectedOrderId === order.id ? 'bg-blue-50/70 shadow-[inset_4px_0_0_0_rgba(59,130,246,1)]' : ''}`}
                              >
                                <td className="px-5 py-4 text-[0.98rem] font-bold text-blue-500">
                                  {order.id}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black text-white ${order.customerTone}`}>
                                      {order.customerCode}
                                    </div>
                                    <div>
                                      <p className="font-bold text-slate-700">{order.customerName}</p>
                                      <p className="text-xs font-semibold text-slate-500">{order.customerType}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-2 text-[0.95rem] font-semibold text-slate-600">
                                    <span>{order.origin}</span>
                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                    <span>{order.destination}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-[0.95rem] font-semibold text-slate-600">{order.eta}</td>
                                <td className="px-4 py-4">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-bold ${dispatchStatusStyles[order.status] ?? 'bg-slate-100 text-slate-700'
                                      }`}
                                  >
                                    {order.status}
                                  </span>
                                </td>
                                <td className="px-4 py-4">
                                  {order.driver === 'Not assigned' ? (
                                    <span className="text-[0.9rem] font-semibold text-slate-400">Not assigned</span>
                                  ) : (
                                    <div className="flex items-center gap-2.5">
                                      <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-700 text-[0.64rem] font-black text-white">
                                        {getInitials(order.driver)}
                                      </div>
                                      <span className="font-semibold text-slate-700">{order.driver}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-4 font-semibold text-slate-600">{order.truck}</td>
                                <td className="px-4 py-4 text-[0.98rem] font-black text-slate-700">{order.rate}</td>
                                <td className="px-4 py-4 text-[0.98rem] font-black text-emerald-600">{order.margin}</td>
                                <td className="px-4 py-4">
                                  {order.pod ? (
                                    <FileCheck2 className="h-4 w-4 text-emerald-500" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-slate-300" />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {filteredOrders.length === 0 && activeSection !== 'dispatch' ? (
                      <div className="border-t border-slate-200 px-5 py-6 text-sm font-semibold text-slate-500">No loads found for selected filters.</div>
                    ) : null}
                  </article>

                  {/* Orders / Dispatch Board Slide-over Detail Panel */}
                  {selectedOrderId && (
                    <div
                      className="fixed inset-0 z-[90] bg-slate-900/5"
                      onClick={() => setSelectedOrderId(null)}
                    />
                  )}

                  <aside
                    className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[480px] transform bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col ${selectedOrderId ? 'translate-x-0' : 'translate-x-full'
                      }`}
                  >
                    {selectedOrder && (
                      <>
                        <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-5">
                          <h3 className="text-[1.55rem] font-bold tracking-tight text-slate-800">Load {selectedOrder.id}</h3>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderId(null)}
                            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="dashboard-scrollbar shrink-0 overflow-x-auto border-b border-slate-200">
                          <div className="flex min-w-max items-center px-3">
                            {orderDetailTabs.map((tab) => {
                              const isActiveTab = activeOrderTab === tab.key

                              return (
                                <button
                                  key={tab.key}
                                  type="button"
                                  onClick={() => setActiveOrderTab(tab.key)}
                                  className={`border-b-2 px-3 py-3 text-sm font-semibold transition ${isActiveTab
                                    ? 'border-blue-500 text-blue-500'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                  {tab.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
                          {activeOrderTab === 'overview' ? (
                            <div className="space-y-6">
                              <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                                <h4 className="text-[1.05rem] font-bold text-slate-800">Load Summary</h4>
                                <dl className="mt-3 space-y-2 text-sm">
                                  <div className="flex items-center justify-between gap-3">
                                    <dt className="font-semibold text-slate-500">Load ID:</dt>
                                    <dd className="font-bold text-slate-700">{selectedOrder.id}</dd>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <dt className="font-semibold text-slate-500">Customer:</dt>
                                    <dd className="font-bold text-slate-700">{selectedOrder.customerName}</dd>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <dt className="font-semibold text-slate-500">Rate:</dt>
                                    <dd className="font-bold text-slate-700">{selectedOrder.rate}</dd>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <dt className="font-semibold text-slate-500">Margin:</dt>
                                    <dd className="font-bold text-emerald-600">{selectedOrder.margin}</dd>
                                  </div>
                                </dl>
                              </section>

                              <section>
                                <h4 className="text-[1.05rem] font-bold text-slate-800">Status Timeline</h4>
                                <div className="mt-3 space-y-4">
                                  {[
                                    { label: 'Load Created', time: 'Feb 6, 2024 at 09:15 AM', tone: 'bg-emerald-500' },
                                    { label: 'Driver Assigned', time: 'Feb 6, 2024 at 10:30 AM', tone: 'bg-emerald-500' },
                                    { label: 'Pickup Completed', time: 'Feb 7, 2024 at 08:45 AM', tone: 'bg-emerald-500' },
                                    { label: selectedOrder.status, time: 'Current status', tone: 'bg-blue-500' },
                                    { label: 'Delivery', time: `Estimated: ${selectedOrder.eta}`, tone: 'bg-slate-300' },
                                  ].map((step) => (
                                    <div key={step.label} className="flex items-start gap-3">
                                      <span className={`mt-1.5 h-3 w-3 rounded-full ${step.tone}`}></span>
                                      <div>
                                        <p className="text-[1.05rem] font-semibold text-slate-700">{step.label}</p>
                                        <p className="text-sm font-medium text-slate-500">{step.time}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </section>

                              <section>
                                <h4 className="text-[1.05rem] font-bold text-slate-800">Current Location</h4>
                                <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                  <p className="flex items-center gap-2 text-[1rem] font-bold text-blue-700">
                                    <MapPinned className="h-4 w-4" />
                                    {selectedOrder.origin}
                                  </p>
                                  <p className="mt-2 text-sm font-semibold text-slate-500">Last updated: 2 hours ago</p>
                                  <p className="mt-1 text-sm font-semibold text-slate-500">Next checkpoint: {selectedOrder.destination}</p>
                                </div>
                              </section>

                              <section>
                                <h4 className="text-[1.05rem] font-bold text-slate-800">Assignment Details</h4>
                                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                                  <p className="text-sm font-semibold text-slate-500">Driver</p>
                                  <p className="text-[1rem] font-bold text-slate-700">{selectedOrder.driver}</p>
                                  <p className="mt-3 text-sm font-semibold text-slate-500">Truck</p>
                                  <p className="text-[1rem] font-bold text-slate-700">{selectedOrder.truck}</p>
                                </div>
                              </section>
                            </div>
                          ) : null}

                          {activeOrderTab === 'stops' ? (
                            <div className="space-y-4">
                              <h4 className="text-[1.2rem] font-bold text-slate-800">Route Stops</h4>
                              <article className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[1.05rem] font-bold text-slate-700">Pickup</h5>
                                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Completed</span>
                                </div>
                                <p className="mt-3 text-[1.05rem] font-semibold text-slate-700">{selectedOrder.customerName} Center</p>
                                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedOrder.origin}</p>
                                <p className="mt-3 text-sm font-medium text-slate-500">Scheduled: Feb 7, 08:00 - 10:00</p>
                                <p className="text-sm font-medium text-slate-500">Actual: Feb 7, 08:45</p>
                                <p className="mt-3 text-sm font-semibold text-slate-500">Special Instructions:</p>
                                <p className="text-sm font-medium text-slate-500">Use dock door #12. Contact supervisor for access.</p>
                              </article>

                              <article className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[1.05rem] font-bold text-slate-700">Delivery</h5>
                                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">In Progress</span>
                                </div>
                                <p className="mt-3 text-[1.05rem] font-semibold text-slate-700">{selectedOrder.customerName} Destination</p>
                                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedOrder.destination}</p>
                                <p className="mt-3 text-sm font-medium text-slate-500">Scheduled: Feb 8, 14:00 - 16:00</p>
                                <p className="text-sm font-medium text-slate-500">ETA: {selectedOrder.eta}</p>
                                <p className="mt-3 text-sm font-semibold text-slate-500">Special Instructions:</p>
                                <p className="text-sm font-medium text-slate-500">Call store manager 30 minutes before arrival.</p>
                              </article>
                            </div>
                          ) : null}

                          {activeOrderTab === 'docs' ? (
                            <div className="space-y-4">
                              <h4 className="text-[1.2rem] font-bold text-slate-800">Documents</h4>
                              <div className="space-y-3">
                                <article className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-blue-600">
                                      <FileText className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="text-[1.05rem] font-bold text-slate-700">Bill of Lading</p>
                                      <p className="text-sm font-medium text-slate-500">BOL-{selectedOrder.id}.pdf</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadLatestDocument(selectedOrder.id)}
                                    className="text-sm font-bold text-blue-500"
                                  >
                                    Download
                                  </button>
                                </article>

                                <article className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 opacity-70">
                                  <div className="flex items-center gap-3">
                                    <div className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-500">
                                      <FileCheck2 className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="text-[1.05rem] font-bold text-slate-700">Proof of Delivery</p>
                                      <p className="text-sm font-medium text-slate-500">Pending delivery</p>
                                    </div>
                                  </div>
                                  <span className="text-sm font-semibold text-slate-400">Not available</span>
                                </article>

                                <article className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                                      <ReceiptText className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="text-[1.05rem] font-bold text-slate-700">Rate Confirmation</p>
                                      <p className="text-sm font-medium text-slate-500">RC-{selectedOrder.id}.pdf</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadLatestDocument(selectedOrder.id)}
                                    className="text-sm font-bold text-blue-500"
                                  >
                                    Download
                                  </button>
                                </article>

                                <button
                                  type="button"
                                  onClick={() => handleOpenDocumentPicker(selectedOrder.id)}
                                  disabled={isDocumentUploading}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-[1.05rem] font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Upload className="h-4 w-4" />
                                  {isDocumentUploading ? 'Uploading...' : 'Upload Document'}
                                </button>

                                {(shipmentDocumentsByLoad[selectedOrder.id] ?? []).length > 0 ? (
                                  <div className="rounded-2xl border border-slate-200 p-3.5">
                                    <p className="text-sm font-bold text-slate-700">Uploaded from backend</p>
                                    <div className="mt-2 space-y-2">
                                      {(shipmentDocumentsByLoad[selectedOrder.id] ?? []).slice(0, 4).map((document) => (
                                        <div key={document.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                          <p className="truncate pr-3 text-xs font-semibold text-slate-600">{document.originalName}</p>
                                          <button
                                            type="button"
                                            onClick={() => handleDownloadDocumentById(document.id)}
                                            className="text-xs font-bold text-blue-600"
                                          >
                                            Download
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}

                          {activeOrderTab === 'notes' ? (
                            <div className="flex min-h-full flex-col">
                              <h4 className="text-[1.05rem] font-bold text-slate-800">Internal Notes & Communication</h4>

                              <div className="mt-4 space-y-3">
                                <article className="rounded-2xl bg-blue-50 p-3.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-[0.94rem] font-bold text-slate-700">Sarah Johnson</p>
                                    <p className="text-xs font-semibold text-slate-400">2 hours ago</p>
                                  </div>
                                  <p className="mt-1.5 text-[0.9rem] font-medium leading-relaxed text-slate-600">
                                    Driver confirmed pickup completed. Load secured and on schedule for Atlanta delivery.
                                  </p>
                                </article>

                                <article className="rounded-2xl bg-white p-3.5 shadow-[inset_0_0_0_1px_rgba(226,232,240,1)]">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-[0.94rem] font-bold text-slate-700">Mike Rodriguez</p>
                                    <p className="text-xs font-semibold text-slate-400">4 hours ago</p>
                                  </div>
                                  <p className="mt-1.5 text-[0.9rem] font-medium leading-relaxed text-slate-600">
                                    Pickup completed at 08:45. All paperwork signed. Heading to Atlanta now.
                                  </p>
                                </article>

                                <article className="rounded-2xl bg-amber-50 p-3.5">
                                  <div className="flex items-start justify-between gap-3">
                                    <p className="text-[0.94rem] font-bold text-amber-800">System Alert</p>
                                    <p className="text-xs font-semibold text-amber-500">6 hours ago</p>
                                  </div>
                                  <p className="mt-1.5 text-[0.9rem] font-medium leading-relaxed text-amber-700">
                                    Load assigned to driver Mike Rodriguez. Truck FL-4892 dispatched.
                                  </p>
                                </article>
                              </div>

                              <div className="sticky bottom-0 mt-5 border-t border-slate-200 bg-white pt-4">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Type a message..."
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[0.84rem] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleSendOrderNote}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white hover:bg-blue-600"
                                  >
                                    <ArrowRight className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          {activeOrderTab === 'billing' ? (
                            <div className="space-y-5">
                              <h4 className="text-[1.05rem] font-bold text-slate-800">Billing Information</h4>

                              <article className="rounded-2xl bg-slate-50 p-3.5">
                                <h5 className="text-[1.02rem] font-bold text-slate-700">Rate Details</h5>
                                <div className="mt-3 space-y-2 text-[0.92rem]">
                                  <div className="flex items-center justify-between font-semibold text-slate-500">
                                    <span>Base Rate:</span>
                                    <span className="text-slate-700">$2,400.00</span>
                                  </div>
                                  <div className="flex items-center justify-between font-semibold text-slate-500">
                                    <span>Fuel Surcharge:</span>
                                    <span className="text-slate-700">$350.00</span>
                                  </div>
                                  <div className="flex items-center justify-between font-semibold text-slate-500">
                                    <span>Detention:</span>
                                    <span className="text-slate-700">$100.00</span>
                                  </div>
                                  <div className="mt-3 border-t border-slate-200 pt-3 flex items-center justify-between font-bold text-slate-700">
                                    <span>Total Rate:</span>
                                    <span>{selectedOrder.rate}</span>
                                  </div>
                                </div>
                              </article>

                              <article className="rounded-2xl bg-emerald-50 p-3.5">
                                <h5 className="text-[1.02rem] font-bold text-slate-700">Cost Analysis</h5>
                                <div className="mt-3 space-y-2 text-[0.92rem]">
                                  <div className="flex items-center justify-between font-semibold text-slate-500">
                                    <span>Driver Pay:</span>
                                    <span className="text-slate-700">$1,200.00</span>
                                  </div>
                                  <div className="flex items-center justify-between font-semibold text-slate-500">
                                    <span>Fuel Cost:</span>
                                    <span className="text-slate-700">$850.00</span>
                                  </div>
                                  <div className="flex items-center justify-between font-semibold text-slate-500">
                                    <span>Other Expenses:</span>
                                    <span className="text-slate-700">$275.00</span>
                                  </div>
                                  <div className="mt-3 border-t border-emerald-100 pt-3">
                                    <div className="flex items-center justify-between font-bold text-slate-700">
                                      <span>Total Cost:</span>
                                      <span>$2,325.00</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between text-[1rem] font-bold text-emerald-600">
                                      <span>Profit Margin:</span>
                                      <span>$525.00 (18.5%)</span>
                                    </div>
                                  </div>
                                </div>
                              </article>

                              <article className="rounded-2xl bg-blue-50 p-3.5">
                                <h5 className="text-[1.02rem] font-bold text-slate-700">Invoice Status</h5>
                                <div className="mt-3 space-y-2 text-[0.92rem]">
                                  <div className="flex items-center justify-between font-semibold text-slate-500">
                                    <span>Invoice Number:</span>
                                    <span className="font-bold text-slate-700">{selectedOrder.id.replace('LD-', 'INV-')}</span>
                                  </div>
                                  <div className="flex items-center justify-between font-semibold text-slate-500">
                                    <span>Status:</span>
                                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[0.72rem] font-bold text-amber-700">Pending Delivery</span>
                                  </div>
                                  <div className="flex items-center justify-between font-semibold text-slate-500">
                                    <span>Payment Terms:</span>
                                    <span className="font-bold text-slate-700">Net 30</span>
                                  </div>
                                </div>
                              </article>

                              <article className="rounded-2xl border border-slate-200 bg-white p-3.5">
                                <h5 className="text-[1.02rem] font-bold text-slate-700">Payment Follow-up</h5>
                                <div className="mt-3 space-y-2 text-[0.9rem]">
                                  <div className="flex items-center justify-between font-semibold text-slate-500">
                                    <span>Expected Payment Date:</span>
                                    <span className="font-bold text-slate-700">Mar 10, 2026</span>
                                  </div>
                                  <div className="flex items-center justify-between font-semibold text-slate-500">
                                    <span>Billing Contact:</span>
                                    <span className="font-bold text-slate-700">ap@{selectedOrder.customerCode.toLowerCase()}.com</span>
                                  </div>
                                </div>
                              </article>
                            </div>
                          ) : null}
                        </div>
                      </>
                    )}
                  </aside>
                </div>
              </section>
            ) : activeSection === 'fleet' ? (
              <section className="flex h-[calc(100vh-85px)] flex-col bg-white">
                {/* Sticky Top Header & Filters (Navbar Style) */}
                <div className="shrink-0 border-b border-slate-200 bg-white shadow-sm z-20">
                  <div className="flex flex-col justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center lg:px-8">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-800">Fleet - Trucks & Trailers Management</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={handleImportFleetData} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                        <Download className="h-4 w-4" />
                        Import Fleet Data
                      </button>
                      <button type="button" onClick={handleScheduleMaintenance} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors">
                        <Wrench className="h-4 w-4" />
                        Schedule Maintenance
                      </button>
                      <button type="button" onClick={handleAddVehicle} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors">
                        <Plus className="h-4 w-4" />
                        Add Vehicle
                      </button>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 gap-4 px-6 pb-2 pt-2 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">
                    {fleetSummary.map((stat) => {
                      const IconComp = {
                        Car: Car,
                        CheckCircle2: CheckCircle2,
                        Truck: Truck,
                        Wrench: Wrench,
                        HeartPulse: HeartPulse,
                      }[stat.icon] || Car

                      return (
                        <div key={stat.id} className={`flex h-[80px] items-center justify-between overflow-hidden rounded-2xl ${stat.bgScale} p-5 border shadow-sm`}>
                          <div>
                            <p className={`text-[1.5rem] font-bold ${stat.textTone} leading-none tracking-tight`}>{stat.value}</p>
                            <p className={`mt-1 text-[0.8rem] font-medium ${stat.labelTone}`}>{stat.label}</p>
                          </div>
                          <div className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${stat.iconTone} text-white shadow-sm`}>
                            <IconComp className="h-5 w-5" />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 bg-slate-50/80 px-6 py-3 border-t border-slate-100 lg:px-8">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <span>Vehicle Type:</span>
                      <select
                        value={fleetFilters.type}
                        onChange={(event) => setFleetFilters((prev) => ({ ...prev, type: event.target.value }))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {fleetTypeOptions.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <span>Status:</span>
                      <select
                        value={fleetFilters.status}
                        onChange={(event) => setFleetFilters((prev) => ({ ...prev, status: event.target.value }))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {fleetStatusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <span>Location:</span>
                      <select
                        value={fleetFilters.location}
                        onChange={(event) => setFleetFilters((prev) => ({ ...prev, location: event.target.value }))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-[200px]"
                      >
                        {fleetLocationOptions.map((loc) => (
                          <option key={loc} value={loc} className="truncate">{loc}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <span>Health:</span>
                      <select
                        value={fleetFilters.health}
                        onChange={(event) => setFleetFilters((prev) => ({ ...prev, health: event.target.value }))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {fleetHealthOptions.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={clearOrderFilters}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 transition ml-auto"
                    >
                      <X className="h-4 w-4" />
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Scrollable Vehicle Logs (Table) */}
                <div className="dashboard-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-auto">
                  <table className="w-full min-w-[1050px] text-left text-[0.87rem]">
                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-white text-[0.82rem] font-semibold tracking-wide text-slate-600 shadow-sm backdrop-blur-md">
                      <tr>
                        <th className="px-6 py-3 align-bottom">Vehicle ID / Plate</th>
                        <th className="px-5 py-3 text-center align-bottom">Type</th>
                        <th className="px-5 py-3 align-bottom">Status</th>
                        <th className="px-5 py-3 align-bottom">Assigned Driver</th>
                        <th className="px-5 py-3 align-bottom">Location</th>
                        <th className="px-5 py-3 align-bottom">Last GPS Ping</th>
                        <th className="px-5 py-3 text-center align-bottom">Health</th>
                        <th className="px-6 py-3 text-center align-bottom">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredFleet.length > 0 ? (
                        filteredFleet.map((vehicle) => (
                          <tr
                            key={vehicle.id}
                            onClick={() => setSelectedVehicle(vehicle)}
                            className={`group cursor-pointer hover:bg-slate-50 border-white transition-colors ${selectedVehicle?.id === vehicle.id ? 'bg-slate-50 shadow-[inset_4px_0_0_0_rgba(59,130,246,1)]' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3.5">
                                <div className="h-9 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100">
                                  {vehicle.image ? (
                                    <img src={vehicle.image} alt={vehicle.model} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center border border-slate-200">
                                      <Truck className="h-4 w-4 text-slate-400" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 text-[0.92rem] leading-tight">{vehicle.plate}</div>
                                  <div className="text-[0.8rem] text-slate-500 leading-tight mt-0.5">{vehicle.model}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <div className="mx-auto flex items-center justify-center text-blue-500">
                                <Truck className="h-[18px] w-[18px]" strokeWidth={2} />
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[0.74rem] font-bold ${vehicle.statusTone}`}>
                                {vehicle.status}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100 text-[0.7rem] font-bold text-slate-600">
                                  {vehicle.driverAvatar ? (
                                    <img src={vehicle.driverAvatar} alt={vehicle.driver} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-slate-100 uppercase ring-1 ring-inset ring-slate-200">
                                      {vehicle.driver === 'Unassigned' ? <UserRound className="h-3 w-3 text-slate-400" /> : getInitials(vehicle.driver)}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 text-[0.85rem] leading-tight">{vehicle.driver}</div>
                                  <div className="mt-0.5 text-[0.75rem] text-slate-500 leading-tight">{vehicle.driverStatus}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-medium text-slate-800 text-[0.85rem] leading-tight">{vehicle.location}</div>
                              <div className="mt-0.5 text-[0.75rem] text-slate-500 leading-tight">{vehicle.depot}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="font-medium text-slate-800 text-[0.85rem] leading-tight">{vehicle.lastPingLabel}</div>
                              <div className="mt-0.5 text-[0.75rem] text-slate-500 leading-tight">{vehicle.lastPingDate}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="mx-auto flex h-8 w-8 items-center justify-center">
                                <div className={`h-[14px] w-[14px] rounded-full ${vehicle.healthDot}`} />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleFleetRowAction(vehicle)
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                              >
                                <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={2} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Car className="h-8 w-8 text-slate-300" />
                              <span className="text-sm font-semibold text-slate-500">No vehicles found matching the current filters.</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Vehicle Details Side Panel */}
                <div
                  className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[420px] transform bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col ${selectedVehicle ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                  {selectedVehicle && (
                    <>
                      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
                        <h2 className="text-[1.15rem] font-bold text-slate-800">Vehicle Details</h2>
                        <button
                          onClick={() => setSelectedVehicle(null)}
                          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="dashboard-scrollbar flex-1 overflow-y-auto p-6">
                        {/* Hero Image */}
                        <div className="relative mb-8 h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50">
                          {selectedVehicle.image && (
                            <img
                              src={selectedVehicle.image}
                              alt={selectedVehicle.model}
                              className="absolute inset-0 h-full w-full object-cover object-center mix-blend-multiply opacity-90"
                            />
                          )}
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                          <div>
                            <p className="text-[0.75rem] font-semibold text-slate-500">Vehicle ID:</p>
                            <p className="mt-1 font-bold text-slate-800">{selectedVehicle.plate}</p>
                          </div>
                          <div>
                            <p className="text-[0.75rem] font-semibold text-slate-500">Model:</p>
                            <p className="mt-1 font-bold text-slate-800">{selectedVehicle.model}</p>
                          </div>
                          <div>
                            <p className="text-[0.75rem] font-semibold text-slate-500">Year:</p>
                            <p className="mt-1 font-bold text-slate-800">2022</p>
                          </div>
                          <div>
                            <p className="text-[0.75rem] font-semibold text-slate-500">Mileage:</p>
                            <p className="mt-1 font-bold text-slate-800">247,892 mi</p>
                          </div>
                        </div>

                        <hr className="my-8 border-slate-100" />

                        {/* Current Assignment */}
                        <h3 className="text-sm font-bold text-slate-800 mb-4">Current Assignment</h3>
                        {selectedVehicle.driver ? (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200">
                                {selectedVehicle.driverAvatar ? (
                                  <img src={selectedVehicle.driverAvatar} alt={selectedVehicle.driver} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full items-center justify-center bg-blue-100 text-sm font-bold text-blue-600">
                                    {selectedVehicle.driver.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-[0.9rem] font-bold text-slate-800">{selectedVehicle.driver}</p>
                                <p className="text-[0.75rem] text-slate-500">CDL Class A • 8 years experience</p>
                                <p className="text-[0.75rem] font-semibold text-emerald-500 mt-0.5">{selectedVehicle.driverStatus}</p>
                              </div>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-3 space-y-2 mt-2">
                              <div className="flex justify-between items-center text-[0.8rem]">
                                <span className="text-slate-500 font-medium">Current Location:</span>
                                <span className="font-semibold text-slate-700">{selectedVehicle.location}</span>
                              </div>
                              <div className="flex justify-between items-center text-[0.8rem]">
                                <span className="text-slate-500 font-medium">Last Check-in:</span>
                                <span className="font-semibold text-slate-700">{selectedVehicle.lastPingLabel}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                            <p className="text-sm text-slate-500 font-medium">No active driver assigned</p>
                          </div>
                        )}

                        <hr className="my-8 border-slate-100" />

                        {/* Inspection History */}
                        <h3 className="text-sm font-bold text-slate-800 mb-4">Inspection History</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 px-4 py-3">
                            <div>
                              <p className="text-[0.8rem] font-bold text-emerald-900">Last Inspection</p>
                              <p className="text-[0.75rem] text-emerald-700 mt-0.5">Feb 5, 2024</p>
                            </div>
                            <div className="rounded-md bg-emerald-100 px-2 py-1 text-[0.7rem] font-bold text-emerald-700">
                              Passed
                            </div>
                          </div>

                          <div className="flex items-center justify-between rounded-xl bg-amber-50/80 px-4 py-3">
                            <div>
                              <p className="text-[0.8rem] font-bold text-amber-900">Next Due</p>
                              <p className="text-[0.75rem] text-amber-700 mt-0.5">Mar 5, 2024</p>
                            </div>
                            <div className="rounded-md bg-amber-100 px-2 py-1 text-[0.7rem] font-bold text-amber-700">
                              Due Soon
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            ) : activeSection === 'drivers' ? (
              <section className="flex h-[calc(100vh-85px)] flex-col bg-white">
                {/* Sticky Top Header & Filters */}
                <div className="shrink-0 border-b border-slate-200 bg-white shadow-sm z-20">
                  <div className="flex flex-col justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center lg:px-8">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-800">Driver Management</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={handleImportDrivers} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                        <Download className="h-4 w-4" />
                        Import Drivers
                      </button>
                      <button type="button" onClick={handleExportComplianceReport} className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors">
                        <ShieldCheck className="h-4 w-4" />
                        Compliance Report
                      </button>
                      <button type="button" onClick={handleAddDriver} className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors">
                        <Plus className="h-4 w-4" />
                        Add New Driver
                      </button>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 gap-4 px-6 pb-2 pt-2 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
                    {dashboardData?.driverSummary?.map((stat) => {
                      const IconComp = {
                        UserRound,
                        CheckCircle2,
                        Bell,
                        BarChart3,
                      }[stat.icon] || UserRound

                      return (
                        <div key={stat.id} className={`flex items-center justify-between rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${stat.bgTone}`}>
                          <div>
                            <p className={`text-[0.78rem] font-bold uppercase tracking-wider ${stat.textTone}/70`}>{stat.label}</p>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className={`text-2xl font-black tracking-tight ${stat.textTone}`}>{stat.value}</span>
                            </div>
                          </div>
                          <div className={`rounded-xl p-2.5 ${stat.iconTone}`}>
                            <IconComp className="h-5 w-5" />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Filter Bar */}
                  <div className="flex flex-wrap items-center gap-4 bg-white px-6 py-4 lg:px-8">
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-500">
                      <span>Status:</span>
                      <select
                        value={driverFilters.status}
                        onChange={(e) => setDriverFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {driverStatusOptions.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-500">
                      <span>HOS Risk:</span>
                      <select
                        value={driverFilters.hosRisk}
                        onChange={(e) => setDriverFilters(prev => ({ ...prev, hosRisk: e.target.value }))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {hosRiskOptions.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-500">
                      <span>Location:</span>
                      <select
                        value={driverFilters.location}
                        onChange={(e) => setDriverFilters(prev => ({ ...prev, location: e.target.value }))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {driverLocationOptions.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-500">
                      <span>Rating:</span>
                      <select
                        value={driverFilters.rating}
                        onChange={(e) => setDriverFilters(prev => ({ ...prev, rating: e.target.value }))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {ratingOptions.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="ml-auto w-full md:w-auto">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by name or ID..."
                          value={driverSearchQuery}
                          onChange={(e) => setDriverSearchQuery(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 md:w-64"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDriverFilters({ status: 'All Status', hosRisk: 'All Risk', location: 'All Locations', rating: 'All Ratings' })
                        setDriverSearchQuery('')
                      }}
                      className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Drivers Table Area */}
                <div className="dashboard-scrollbar flex-1 overflow-auto bg-slate-50/30">
                  <table className="w-full min-w-[1100px] border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-left text-[0.72rem] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Driver</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-center">HOS Risk</th>
                        <th className="px-5 py-4">Rating</th>
                        <th className="px-5 py-4">Last Trip</th>
                        <th className="px-5 py-4">Current Location</th>
                        <th className="px-6 py-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredDrivers.length > 0 ? (
                        filteredDrivers.map((driver) => (
                          <tr
                            key={driver.id}
                            onClick={() => setSelectedDriverId(driver.id)}
                            className={`group cursor-pointer hover:bg-slate-50 transition-colors ${selectedDriverId === driver.id ? 'bg-slate-50 shadow-[inset_4px_0_0_0_rgba(59,130,246,1)]' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3.5">
                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100">
                                  <img src={driver.avatar} alt={driver.name} className="h-full w-full object-cover" />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-800 text-[0.92rem] leading-tight">{driver.name}</div>
                                  <div className="text-[0.75rem] text-slate-500 mt-1 font-semibold">{driver.id} • {driver.licenseType}</div>
                                  <div className="text-[0.7rem] text-slate-400 mt-0.5">{driver.experience}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-bold ${driver.statusTone}`}>
                                {driver.status}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex justify-center">
                                <div className={`h-3 w-3 rounded-full ${driver.hosRiskTone} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(driver.rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                                  ))}
                                </div>
                                <span className="text-[0.8rem] font-bold text-slate-600">{driver.rating}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-[0.85rem] font-bold text-slate-700">{driver.lastTrip.route}</div>
                              <div className="text-[0.72rem] text-slate-500 mt-0.5">{driver.lastTrip.status}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 text-[0.85rem] font-bold text-slate-700">
                                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                {driver.currentLocation.city}
                              </div>
                              <div className="text-[0.72rem] text-slate-500 mt-0.5 pl-5">{driver.currentLocation.terminal}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleDriverRowAction(driver)
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                              >
                                <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={2} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-bold">
                            No drivers found matching these filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Driver Details Slide-over Panel */}
                <div
                  className={`fixed inset-y-0 right-0 z-[100] w-full max-w-[440px] transform bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col ${selectedDriverId ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                  {selectedDriver && (
                    <>
                      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
                        <h2 className="text-[1.1rem] font-bold text-slate-800">Driver Profile</h2>
                        <button
                          onClick={() => setSelectedDriverId(null)}
                          className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="dashboard-scrollbar flex-1 overflow-y-auto">
                        {/* Profile Hero (Centered) */}
                        <div className="flex flex-col items-center px-6 py-8">
                          <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl ring-1 ring-slate-200">
                            <img src={selectedDriver.avatar} alt={selectedDriver.name} className="h-full w-full object-cover" />
                          </div>
                          <h3 className="mt-4 text-xl font-black tracking-tight text-slate-800">{selectedDriver.name}</h3>
                          <p className="mt-1 text-[0.8rem] font-bold text-slate-400">
                            {selectedDriver.id} • {selectedDriver.experience}
                          </p>
                        </div>

                        {/* Information Grid */}
                        <div className="px-8 py-4">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                            <div>
                              <p className="text-[0.75rem] font-semibold text-slate-400 uppercase tracking-wider">Phone:</p>
                              <p className="mt-1 font-bold text-slate-800 text-[0.92rem]">{selectedDriver.contact.phone}</p>
                            </div>
                            <div>
                              <p className="text-[0.75rem] font-semibold text-slate-400 uppercase tracking-wider">Email:</p>
                              <p className="mt-1 font-bold text-slate-800 text-[0.92rem] truncate">{selectedDriver.contact.email}</p>
                            </div>
                            <div>
                              <p className="text-[0.75rem] font-semibold text-slate-400 uppercase tracking-wider">License:</p>
                              <p className="mt-1 font-bold text-slate-800 text-[0.92rem]">{selectedDriver.licenseType}</p>
                            </div>
                            <div>
                              <p className="text-[0.75rem] font-semibold text-slate-400 uppercase tracking-wider">Rating:</p>
                              <div className="mt-1 flex items-center gap-1">
                                <div className="flex items-center gap-0.5 text-amber-400">
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  <Star className="h-3.5 w-3.5 fill-current opacity-50" />
                                </div>
                                <span className="text-[0.85rem] font-bold text-slate-700">{selectedDriver.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <hr className="mx-8 my-6 border-slate-100" />

                        {/* Compliance & Documents */}
                        <div className="px-8 pb-4">
                          <h4 className="text-[0.95rem] font-black text-slate-800 tracking-tight">Compliance & Documents</h4>
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between rounded-xl bg-emerald-50/50 p-3 border border-emerald-100/50">
                              <div>
                                <p className="text-[0.82rem] font-bold text-emerald-900">CDL License</p>
                                <p className="text-[0.7rem] font-semibold text-emerald-600 mt-0.5">Expires: Dec 15, 2025</p>
                              </div>
                              <span className="text-[0.7rem] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">Valid</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-emerald-50/50 p-3 border border-emerald-100/50">
                              <div>
                                <p className="text-[0.82rem] font-bold text-emerald-900">Medical Certificate</p>
                                <p className="text-[0.7rem] font-semibold text-emerald-600 mt-0.5">Expires: Aug 22, 2024</p>
                              </div>
                              <span className="text-[0.7rem] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md">Valid</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-amber-50/50 p-3 border border-amber-100/50">
                              <div>
                                <p className="text-[0.82rem] font-bold text-amber-900">HazMat Endorsement</p>
                                <p className="text-[0.7rem] font-semibold text-amber-600 mt-0.5">Expires: Mar 10, 2024</p>
                              </div>
                              <span className="text-[0.7rem] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-center">Renew Soon</span>
                            </div>
                          </div>
                        </div>

                        <hr className="mx-8 my-6 border-slate-100" />

                        {/* Hours of Service */}
                        <div className="px-8 pb-8">
                          <h4 className="text-[0.95rem] font-black text-slate-800 tracking-tight">Hours of Service</h4>
                          <div className="mt-4 space-y-3 font-bold">
                            <div className="flex items-center justify-between text-[0.88rem]">
                              <span className="text-slate-500">Drive Time Remaining:</span>
                              <span className="text-emerald-600">8h 45m</span>
                            </div>
                            <div className="flex items-center justify-between text-[0.88rem]">
                              <span className="text-slate-500">On Duty Time:</span>
                              <span className="text-slate-800">5h 15m</span>
                            </div>
                            <div className="flex items-center justify-between text-[0.88rem]">
                              <span className="text-slate-500">70-Hour Recap:</span>
                              <span className="text-slate-800">42h remaining</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            ) : activeSection === 'routes' ? (
              <section className="flex h-[calc(100vh-85px)] flex-col bg-white overflow-hidden relative">
                <div className="flex-none bg-white border-b border-slate-200">
                  <div className="flex items-center justify-between px-6 py-4 lg:px-8">
                    <h2 className="text-[2rem] font-bold tracking-tight text-slate-800">Routes & Tracking</h2>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleExportRoutesData}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Download className="h-4 w-4 text-slate-400" />
                        Export Data
                      </button>
                      <button type="button" onClick={handleRouteOptimization} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                        <Route className="h-4 w-4" />
                        Route Optimization
                      </button>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 gap-4 px-6 pb-2 pt-2 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
                    {dashboardData?.routeSummary?.map((stat) => {
                      const IconComp = {
                        Route,
                        Clock3,
                        AlertTriangle,
                        Truck,
                      }[stat.icon] || Route

                      return (
                        <div key={stat.id} className={`flex items-center justify-between rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${stat.bgTone}`}>
                          <div>
                            <p className={`text-[0.78rem] font-bold uppercase tracking-wider ${stat.textTone}/70`}>{stat.label}</p>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className={`text-2xl font-black tracking-tight ${stat.textTone}`}>{stat.value}</span>
                            </div>
                          </div>
                          <div className={`rounded-xl p-2.5 ${stat.iconTone}`}>
                            <IconComp className="h-5 w-5" />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Filter Bar */}
                  <div className="flex flex-wrap items-center gap-4 bg-white px-6 py-4 lg:px-8">
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-500">
                      <span>Route Status:</span>
                      <select
                        value={routeFilters.status}
                        onChange={(e) => setRouteFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {routeStatusOptions.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-500">
                      <span>Time Range:</span>
                      <select
                        value={routeFilters.timeRange}
                        onChange={(e) => setRouteFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {routeTimeRangeOptions.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-500">
                      <span>Driver:</span>
                      <select
                        value={routeFilters.driver}
                        onChange={(e) => setRouteFilters(prev => ({ ...prev, driver: e.target.value }))}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        {routeDriverOptions.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        setRouteFilters({ status: 'All Status', timeRange: 'Today', driver: 'All Drivers' })
                      }}
                      className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors ml-2"
                    >
                      ✕ Clear Filters
                    </button>
                  </div>
                </div>

                <div className="flex-1 relative">
                  {/* Map View */}
                  {mapApiKey ? (
                    <div className="h-full w-full">
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={{ lat: 39.8283, lng: -98.5795 }} // Center of US
                        zoom={4}
                        options={{
                          mapTypeControl: false,
                          streetViewControl: false,
                          fullscreenControl: false,
                          styles: [
                            {
                              featureType: 'all',
                              elementType: 'labels.text.fill',
                              stylers: [{ color: '#747d8c' }],
                            },
                            // Add a clean map style if needed
                          ]
                        }}
                      >
                        {/* Truck Markers */}
                        {filteredRoutes.map((route) => {
                          if (!route?.currentLocation?.lat || !route?.currentLocation?.lng) return null;

                          return (
                            <Fragment key={route.id}>
                              <OverlayViewF
                                position={{ lat: route.currentLocation.lat, lng: route.currentLocation.lng }}
                                mapPaneName="overlayMouseTarget"
                              >
                                <div
                                  onClick={() => setSelectedRouteId(route.id)}
                                  className={`group cursor-pointer relative flex flex-col items-center transform transition-transform hover:scale-110 ${selectedRouteId === route.id ? 'z-50' : 'z-10'}`}
                                >
                                  <div className="bg-white px-2 py-1 rounded-md shadow-lg border border-slate-200 mb-1">
                                    <span className="text-[0.7rem] font-black text-slate-800">{route.id}</span>
                                  </div>
                                  <div className={`h-8 w-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center ${route.status === 'On-time' ? 'bg-emerald-500' :
                                    route.status === 'Delayed' ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}>
                                    <Truck className="h-4 w-4 text-white" />
                                  </div>
                                  <div className={`absolute -bottom-1 h-3 w-3 rounded-full border-2 border-white ${route.status === 'On-time' ? 'bg-emerald-500' :
                                    route.status === 'Delayed' ? 'bg-amber-500' : 'bg-rose-500'
                                    }`} />
                                </div>
                              </OverlayViewF>

                              {/* Polyline for selected route */}
                              {selectedRouteId === route.id && route.path && (
                                <Polyline
                                  path={route.path}
                                  options={{
                                    strokeColor: '#3b82f6',
                                    strokeOpacity: 1.0,
                                    strokeWeight: 4,
                                    icons: [{
                                      icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
                                      offset: '0',
                                      repeat: '20px'
                                    }]
                                  }}
                                />
                              )}
                            </Fragment>
                          );
                        })}
                      </GoogleMap>
                    </div>
                  ) : (
                    <div className="grid h-full place-items-center bg-slate-50 text-slate-400 font-bold">
                      Add VITE_GOOGLE_MAPS_API_KEY to render map.
                    </div>
                  )}
                </div>

                {/* Route Details Panel */}
                <div
                  className={`absolute right-0 top-0 bottom-0 z-50 h-full min-h-0 w-full max-w-[420px] transform border-l border-slate-200 bg-white/95 shadow-[0_0_35px_rgba(15,23,42,0.12)] backdrop-blur-sm transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col ${selectedRouteId ? 'translate-x-0' : 'translate-x-full'
                    }`}
                >
                  {selectedRoutePanelData && (
                    <>
                      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
                        <h2 className="text-[1.1rem] font-bold tracking-tight text-slate-800">Route Details</h2>
                        <button
                          onClick={() => setSelectedRouteId(null)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5">
                        <div className="flex flex-col gap-6">

                          {/* Top Info Box */}
                          <div className="rounded-[1.25rem] bg-slate-50/80 border border-slate-100 p-5 flex flex-col gap-5">
                            <div className="flex items-center gap-3.5">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-white">
                                <Truck className="h-[1.15rem] w-[1.15rem]" />
                              </div>
                              <div>
                                <h3 className="text-[1.15rem] leading-none font-bold text-slate-800">{selectedRoutePanelData.loadId}</h3>
                                <p className="text-[0.8rem] font-medium text-slate-500 mt-1.5">{selectedRoutePanelData.driver} • {selectedRoutePanelData.id}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-[0.85rem]">
                              <div>
                                <p className="text-[0.75rem] text-slate-500 mb-0.5">Origin:</p>
                                <p className="font-semibold text-slate-800 text-[0.85rem]">{selectedRoutePanelData.origin}</p>
                              </div>
                              <div>
                                <p className="text-[0.75rem] text-slate-500 mb-0.5">Destination:</p>
                                <p className="font-semibold text-slate-800 text-[0.85rem]">{selectedRoutePanelData.destination?.city ?? 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[0.75rem] text-slate-500 mb-0.5">Distance:</p>
                                <p className="font-semibold text-slate-800 text-[0.85rem]">{selectedRoutePanelData.totalMiles.toLocaleString()} miles</p>
                              </div>
                              <div>
                                <p className="text-[0.75rem] text-slate-500 mb-1">Status:</p>
                                <span className="inline-flex items-center justify-center rounded-md bg-[#ecfdf5] px-2 py-0.5 text-[0.7rem] font-bold text-[#10b981]">{selectedRoutePanelData.tone.label}</span>
                              </div>
                            </div>
                          </div>

                          {/* ETA & Progress */}
                          <div className="px-1 border-t border-slate-100 pt-6">
                            <h4 className="text-[1.05rem] font-bold tracking-tight text-slate-800 mb-4">ETA & Progress</h4>
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-slate-500 text-[0.85rem]">Estimated Arrival:</span>
                              <div className="text-right leading-tight">
                                <p className="font-bold text-slate-800 text-[0.85rem]">{selectedRoutePanelData.eta}</p>
                                <p className="text-[0.75rem] text-[#10b981] font-semibold mt-0.5">{selectedRoutePanelData.tone.confidence} confidence</p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center mb-2 mt-4">
                              <span className="text-slate-500 text-[0.85rem]">Progress:</span>
                              <span className="font-bold text-slate-800 text-[0.85rem]">{selectedRoutePanelData.progressLabel}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-2">
                              <div className="h-full bg-[#10b981] rounded-full transition-all" style={{ width: `${selectedRoutePanelData.progress}%` }} />
                            </div>
                            <p className="text-[0.75rem] font-medium text-slate-400 mt-2">{selectedRoutePanelData.gpsLabel}</p>
                          </div>

                          {/* Stop Progress */}
                          <div className="px-1 border-t border-slate-100 pt-6">
                            <h4 className="text-[1.05rem] font-bold tracking-tight text-slate-800 mb-5">Stop Progress</h4>
                            <div className="space-y-5">
                              {selectedRoutePanelData.stopItems.map((stop) => {
                                const stopBg = stop.state === 'done' ? 'bg-[#10b981]'
                                  : stop.state === 'active' ? 'bg-[#f59e0b]'
                                    : 'bg-slate-100'
                                const stopColor = stop.state === 'done' ? 'text-white'
                                  : stop.state === 'active' ? 'text-white'
                                    : 'text-slate-400'
                                const IconComp = stop.state === 'done' ? CheckCircle2
                                  : stop.state === 'active' ? Truck
                                    : MapPin

                                return (
                                  <div key={stop.id} className="flex items-start gap-4">
                                    <div className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center mt-0.5 ${stopBg} ${stopColor}`}>
                                      <IconComp className="h-[14px] w-[14px]" strokeWidth={2.5} />
                                    </div>
                                    <div>
                                      <p className="text-[0.9rem] font-bold text-slate-800 leading-tight">{stop.title}</p>
                                      <p className="text-[0.8rem] text-slate-400 mt-1">{stop.subtitle}</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Recent Events */}
                          <div className="px-1 border-t border-slate-100 pt-6 pb-2">
                            <h4 className="text-[1.05rem] font-bold tracking-tight text-slate-800 mb-4">Recent Events</h4>
                            <div className="space-y-3">
                              {selectedRoutePanelData.recentEvents.map((eventItem, i) => (
                                <div key={i} className="rounded-xl bg-[#ecfdf5] p-3.5 flex items-start gap-3">
                                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#10b981]" />
                                  <div>
                                    <p className="text-[0.85rem] font-bold text-slate-800 leading-tight">{eventItem}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            ) : activeSection === 'settings' ? (
              <section className="flex h-[calc(100vh-85px)] w-full flex-col overflow-hidden bg-[#fafafb] relative">
                {/* Fixed Top Area (Navbar for Settings) */}
                <div className="shrink-0 border-b border-slate-100 bg-white px-6 py-6 lg:px-8 z-10 sticky top-0">
                  <div className="w-full flex items-end justify-between">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase">Settings</h2>
                      <p className="mt-1 text-sm font-medium text-slate-500">Company Configuration & Governance Center</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleExportConfiguration}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all"
                      >
                        <Download className="h-4 w-4" />
                        Export Configuration
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAllChanges}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-[0.98]"
                      >
                        <FileCheck2 className="h-4 w-4" />
                        {settingsSaveState === 'saving' ? 'Saving...' : settingsSaveState === 'saved' ? 'Saved' : 'Save All Changes'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="dashboard-scrollbar flex-1 overflow-y-auto p-6 sm:p-6 lg:p-8 bg-[#fafafb]">
                  <div className="w-full space-y-6">
                    {/* Company Setup */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                      <div className="mb-8 flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Company Setup</h3>
                          <p className="text-sm font-medium text-slate-500">Organizational structure and user management</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                        {/* Left: Multi-Branch Management */}
                        <div className="space-y-6">
                          <h4 className="text-[0.9rem] font-bold text-slate-800">Multi-Branch Management</h4>
                          
                          <div className="rounded-xl border border-slate-100 bg-[#fafafb]/40 p-2 shadow-sm">
                            {/* Headquarters - Chicago */}
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                </div>
                                <span className="text-[0.9rem] font-bold text-slate-800">Headquarters - Chicago</span>
                              </div>
                              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[0.7rem] font-bold text-emerald-600">Active</span>
                            </div>
                            
                            <div className="ml-5 border-l-2 border-slate-100 pl-6 space-y-2 py-2">
                              {/* Branch - Dallas */}
                              <div className="flex items-center justify-between py-1">
                                <span className="text-[0.85rem] font-medium text-slate-500">Branch - Dallas</span>
                                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[0.7rem] font-bold text-emerald-600">Active</span>
                              </div>
                              {/* Branch - Atlanta */}
                              <div className="flex items-center justify-between py-1">
                                <span className="text-[0.85rem] font-medium text-slate-500">Branch - Atlanta</span>
                                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[0.7rem] font-bold text-emerald-600">Active</span>
                              </div>
                              {/* Branch - Phoenix */}
                              <div className="flex items-center justify-between py-1">
                                <span className="text-[0.85rem] font-medium text-slate-500">Branch - Phoenix</span>
                                <span className="rounded-md bg-amber-50 px-2 py-1 text-[0.7rem] font-bold text-amber-600">Pending</span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleSettingsShortcut('Branch creation flow opened.')}
                              className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-blue-600 hover:text-blue-700 mt-2 transition-colors"
                            >
                              <Plus className="h-4 w-4" /> Add Branch
                            </button>
                          </div>
                        </div>

                        {/* Right: User Roles & Permissions */}
                        <div className="space-y-6">
                          <h4 className="text-[0.9rem] font-bold text-slate-800">User Roles & Permissions</h4>

                          <div className="space-y-3">
                            {/* Admin */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm hover:border-slate-200 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                                  <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.9rem] font-bold text-slate-800 leading-tight">Admin</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500">Full system access</p>
                                </div>
                              </div>
                              <span className="text-[0.8rem] font-medium text-slate-500">12 users</span>
                            </div>
                            {/* Dispatcher */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm hover:border-slate-200 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                                  <Grid2x2 className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.9rem] font-bold text-slate-800 leading-tight">Dispatcher</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500">Load & route management</p>
                                </div>
                              </div>
                              <span className="text-[0.8rem] font-medium text-slate-500">28 users</span>
                            </div>
                            {/* Finance */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm hover:border-slate-200 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                                  <DollarSign className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.9rem] font-bold text-slate-800 leading-tight">Finance</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500">Billing & accounting</p>
                                </div>
                              </div>
                              <span className="text-[0.8rem] font-medium text-slate-500">8 users</span>
                            </div>
                            {/* Viewer */}
                            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 shadow-sm hover:border-slate-200 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                  <Eye className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.9rem] font-bold text-slate-800 leading-tight">Viewer</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500">Read-only access</p>
                                </div>
                              </div>
                              <span className="text-[0.8rem] font-medium text-slate-500">15 users</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* System Integrations */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                      <div className="mb-6 flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">System Integrations</h3>
                          <p className="text-sm font-medium text-slate-500">Third-party system connections and status</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* GPS Tracking */}
                        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                                  <MapPin className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.95rem] font-bold text-slate-800 leading-tight">GPS Tracking</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500 mt-0.5">Geotab Fleet</p>
                                </div>
                              </div>
                              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[0.7rem] font-bold text-emerald-600">Connected</span>
                            </div>
                            <p className="text-[0.75rem] font-medium text-slate-400 mt-4 mb-3">Last sync: 2 minutes ago</p>
                          </div>
                          <button
                            onClick={() => handleSettingsShortcut('GPS Tracking integration settings opened.')}
                            className="w-full rounded-xl bg-slate-50 px-4 py-2 text-[0.8rem] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            Configure
                          </button>
                        </div>

                        {/* ELD System */}
                        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                                  <Clock3 className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.95rem] font-bold text-slate-800 leading-tight">ELD System</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500 mt-0.5">Omnitracs HOS</p>
                                </div>
                              </div>
                              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[0.7rem] font-bold text-emerald-600">Connected</span>
                            </div>
                            <p className="text-[0.75rem] font-medium text-slate-400 mt-4 mb-3">Last sync: 5 minutes ago</p>
                          </div>
                          <button
                            onClick={() => handleSettingsShortcut('ELD integration settings opened.')}
                            className="w-full rounded-xl bg-slate-50 px-4 py-2 text-[0.8rem] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            Configure
                          </button>
                        </div>

                        {/* Accounting */}
                        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.95rem] font-bold text-slate-800 leading-tight">Accounting</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500 mt-0.5">QuickBooks Pro</p>
                                </div>
                              </div>
                              <span className="rounded-md bg-rose-50 px-2 py-1 text-[0.7rem] font-bold text-rose-600">Not Connected</span>
                            </div>
                            <p className="text-[0.75rem] font-medium text-slate-400 mt-4 mb-3">Setup required</p>
                          </div>
                          <button
                            onClick={() => handleSettingsShortcut('Accounting integration onboarding opened.')}
                            className="w-full rounded-xl bg-blue-600 px-4 py-2 text-[0.8rem] font-bold text-white hover:bg-blue-700 transition-colors"
                          >
                            Connect
                          </button>
                        </div>

                        {/* Invoicing */}
                        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                                  <ReceiptText className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.95rem] font-bold text-slate-800 leading-tight">Invoicing</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500 mt-0.5">Invoice Simple</p>
                                </div>
                              </div>
                              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[0.7rem] font-bold text-emerald-600">Connected</span>
                            </div>
                            <p className="text-[0.75rem] font-medium text-slate-400 mt-4 mb-3">Last sync: 1 hour ago</p>
                          </div>
                          <button
                            onClick={() => handleSettingsShortcut('Invoicing integration settings opened.')}
                            className="w-full rounded-xl bg-slate-50 px-4 py-2 text-[0.8rem] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            Configure
                          </button>
                        </div>

                        {/* Weather API */}
                        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>
                                </div>
                                <div>
                                  <p className="text-[0.95rem] font-bold text-slate-800 leading-tight">Weather API</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500 mt-0.5">WeatherAPI.com</p>
                                </div>
                              </div>
                              <span className="rounded-md bg-emerald-50 px-2 py-1 text-[0.7rem] font-bold text-emerald-600">Connected</span>
                            </div>
                            <p className="text-[0.75rem] font-medium text-slate-400 mt-4 mb-3">Last sync: 15 minutes ago</p>
                          </div>
                          <button
                            onClick={() => handleSettingsShortcut('Weather API integration settings opened.')}
                            className="w-full rounded-xl bg-slate-50 px-4 py-2 text-[0.8rem] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            Configure
                          </button>
                        </div>

                        {/* Fuel Cards */}
                        <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                          <div>
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                                  <Wallet className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.95rem] font-bold text-slate-800 leading-tight">Fuel Cards</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500 mt-0.5">Comdata Fleet</p>
                                </div>
                              </div>
                              <span className="rounded-md bg-rose-50 px-2 py-1 text-[0.7rem] font-bold text-rose-600">Not Connected</span>
                            </div>
                            <p className="text-[0.75rem] font-medium text-slate-400 mt-4 mb-3">Setup required</p>
                          </div>
                          <button
                            onClick={() => handleSettingsShortcut('Fuel card integration onboarding opened.')}
                            className="w-full rounded-xl bg-blue-600 px-4 py-2 text-[0.8rem] font-bold text-white hover:bg-blue-700 transition-colors"
                          >
                            Connect
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Notifications & Alerts */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
                      <div className="mb-6 flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                          <Bell className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Notifications & Alerts</h3>
                          <p className="text-sm font-medium text-slate-500">Configure alert rules and communication preferences</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_1fr]">
                        {/* Left: Event-Based Rules */}
                        <div>
                          <h4 className="mb-5 text-[0.95rem] font-bold text-slate-800">Event-Based Rules</h4>
                          <div className="space-y-4">
                            {/* Rule 1 */}
                            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                              <div className="flex items-center gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                                  <Clock3 className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.9rem] font-bold text-slate-800">Delivery Delays</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500">Notify when ETA exceeds 30 minutes</p>
                                </div>
                              </div>
                              <div className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-blue-500 transition-colors">
                                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm" />
                              </div>
                            </div>

                            {/* Rule 2 */}
                            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                              <div className="flex items-center gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                                  <AlertCircle className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.9rem] font-bold text-slate-800">Route Exceptions</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500">Alert on route deviations &gt; 5 miles</p>
                                </div>
                              </div>
                              <div className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-blue-500 transition-colors">
                                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm" />
                              </div>
                            </div>

                            {/* Rule 3 */}
                            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                              <div className="flex items-center gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                                  <DollarSign className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.9rem] font-bold text-slate-800">Billing Issues</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500">Invoice discrepancies and payment delays</p>
                                </div>
                              </div>
                              <div className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-slate-200 transition-colors">
                                <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm" />
                              </div>
                            </div>

                            {/* Rule 4 */}
                            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                              <div className="flex items-center gap-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                                  <Truck className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-[0.9rem] font-bold text-slate-800">Vehicle Maintenance</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500">Scheduled maintenance reminders</p>
                                </div>
                              </div>
                              <div className="relative flex h-6 w-11 cursor-pointer items-center rounded-full bg-blue-500 transition-colors">
                                <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Alert Sensitivity & Channels */}
                        <div>
                          <div className="flex flex-col gap-6">
                            <h4 className="text-[0.95rem] font-bold text-slate-800">Alert Sensitivity & Channels</h4>
                            
                            {/* Sensitivity Level */}
                            <div>
                              <p className="mb-4 text-[0.85rem] font-bold text-slate-800">Sensitivity Level</p>
                              <div className="space-y-4">
                                {/* Low */}
                                <label className="flex items-start gap-3 cursor-pointer group">
                                  <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-slate-200 mt-0.5 group-hover:border-slate-300"></div>
                                  <div>
                                    <p className="text-[0.85rem] font-bold text-slate-700 leading-none">Low</p>
                                    <p className="text-[0.75rem] font-medium text-slate-500 mt-1.5">Critical issues only</p>
                                  </div>
                                </label>

                                {/* Medium */}
                                <label className="flex items-start gap-3 cursor-pointer group">
                                  <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[5px] border-blue-500 mt-0.5 shadow-sm"></div>
                                  <div>
                                    <p className="text-[0.85rem] font-bold text-slate-800 leading-none">Medium</p>
                                    <p className="text-[0.75rem] font-medium text-slate-500 mt-1.5">Important operational alerts</p>
                                  </div>
                                </label>

                                {/* High */}
                                <label className="flex items-start gap-3 cursor-pointer group">
                                  <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 border-slate-200 mt-0.5 group-hover:border-slate-300"></div>
                                  <div>
                                    <p className="text-[0.85rem] font-bold text-slate-700 leading-none">High</p>
                                    <p className="text-[0.75rem] font-medium text-slate-500 mt-1.5">All system notifications</p>
                                  </div>
                                </label>
                              </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Communication Channels */}
                            <div>
                              <p className="mb-4 text-[0.85rem] font-bold text-slate-800">Communication Channels</p>
                              <div className="space-y-4">
                                {/* In-App */}
                                <label className="flex items-start gap-3 cursor-pointer group">
                                  <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-blue-500 mt-0.5 shadow-sm">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                  </div>
                                  <div>
                                    <p className="text-[0.85rem] font-bold text-slate-800 leading-none">In-App Notifications</p>
                                    <p className="text-[0.75rem] font-medium text-slate-500 mt-1.5">Real-time dashboard alerts</p>
                                  </div>
                                </label>

                                {/* Email */}
                                <label className="flex items-start gap-3 cursor-pointer group">
                                  <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-blue-500 mt-0.5 shadow-sm">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                  </div>
                                  <div>
                                    <p className="text-[0.85rem] font-bold text-slate-800 leading-none">Email Alerts</p>
                                    <p className="text-[0.75rem] font-medium text-slate-500 mt-1.5">Send to registered email address</p>
                                  </div>
                                </label>

                                {/* SMS */}
                                <label className="flex items-start gap-3 cursor-pointer group opacity-60">
                                  <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 border-slate-200 mt-0.5 bg-slate-50 group-hover:border-slate-300"></div>
                                  <div>
                                    <p className="text-[0.85rem] font-bold text-slate-700 leading-none">SMS Notifications</p>
                                    <p className="text-[0.75rem] font-medium text-slate-500 mt-1.5">Text message alerts (coming soon)</p>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : activeSection === 'warehouses' ? (() => {
              const warehouseKPIs = [
                { title: 'Active Warehouses', value: '12', iconTone: 'bg-[#3b82f6] text-white', icon: Warehouse, bgCard: 'bg-[#eff6ff]', textTone: 'text-[#1e3a8a]', subTextTone: 'text-[#3b82f6]' },
                { title: 'Average Utilization', value: '78.4%', iconTone: 'bg-[#10b981] text-white', icon: Clock3, bgCard: 'bg-[#ebfdf5]', textTone: 'text-[#064e3b]', subTextTone: 'text-[#10b981]' },
                { title: 'Critical Alerts', value: '2', iconTone: 'bg-[#ef4444] text-white', icon: AlertTriangle, bgCard: 'bg-[#fef2f2]', textTone: 'text-[#7f1d1d]', subTextTone: 'text-[#ef4444]' },
                { title: 'Today\'s Throughput', value: '847 / 1,205', iconTone: 'bg-[#a855f7] text-white', icon: Truck, bgCard: 'bg-[#faf5ff]', textTone: 'text-[#4c1d95]', subTextTone: 'text-[#a855f7]' }
              ];

              const warehousesList = [
                {
                  id: 1, name: 'Chicago Distribution Center', address: '1245 Industrial Blvd, Chicago, IL 60601',
                  status: 'Active', statusBg: 'bg-[#ebfdf5] text-[#10b981]',
                  utilization: 87.3, utilColor: 'bg-[#f59e0b]',
                  inbound: '142', outbound: '238', onHand: '5,847',
                  dockStatus: '8 Available', dockTone: 'bg-[#10b981]', dockText: 'text-[#10b981]',
                  yardStatus: 'Congested', yardTone: 'bg-[#f59e0b]', yardText: 'text-[#f59e0b]',
                  appointments: '45 In / 52 Out'
                },
                {
                  id: 2, name: 'Atlanta Regional Hub', address: '3890 Logistics Way, Atlanta, GA 30309',
                  status: 'Critical', statusBg: 'bg-[#fef2f2] text-[#ef4444]',
                  utilization: 94.8, utilColor: 'bg-[#ef4444]',
                  inbound: '89', outbound: '156', onHand: '8,234',
                  dockStatus: '2 Blocked', dockTone: 'bg-[#ef4444]', dockText: 'text-[#ef4444]',
                  yardStatus: 'Critical', yardTone: 'bg-[#ef4444]', yardText: 'text-[#ef4444]',
                  appointments: '38 In / 41 Out'
                },
                {
                  id: 3, name: 'Dallas Logistics Center', address: '7621 Commerce Pkwy, Dallas, TX 75201',
                  status: 'Active', statusBg: 'bg-[#ebfdf5] text-[#10b981]',
                  utilization: 62.1, utilColor: 'bg-[#10b981]',
                  inbound: '76', outbound: '124', onHand: '4,156',
                  dockStatus: '12 Available', dockTone: 'bg-[#10b981]', dockText: 'text-[#10b981]',
                  yardStatus: 'Empty', yardTone: 'bg-[#10b981]', yardText: 'text-[#10b981]',
                  appointments: '28 In / 35 Out'
                },
                {
                  id: 4, name: 'Los Angeles Port Terminal', address: '2847 Harbor Blvd, Los Angeles, CA 90731',
                  status: 'Maintenance', statusBg: 'bg-[#fffbeb] text-[#f59e0b]',
                  utilization: 45.2, utilColor: 'bg-[#3b82f6]',
                  inbound: '234', outbound: '312', onHand: '12,543',
                  dockStatus: '4 Under Repair', dockTone: 'bg-[#f59e0b]', dockText: 'text-[#f59e0b]',
                  yardStatus: 'Normal', yardTone: 'bg-[#10b981]', yardText: 'text-[#10b981]',
                  appointments: '62 In / 78 Out'
                },
                {
                  id: 5, name: 'Miami Cross-Dock Facility', address: '5432 International Dr, Miami, FL 33166',
                  status: 'Active', statusBg: 'bg-[#ebfdf5] text-[#10b981]',
                  utilization: 73.6, utilColor: 'bg-[#10b981]',
                  inbound: '189', outbound: '245', onHand: '2,134',
                  dockStatus: '6 Available', dockTone: 'bg-[#10b981]', dockText: 'text-[#10b981]',
                  yardStatus: 'Normal', yardTone: 'bg-[#10b981]', yardText: 'text-[#10b981]',
                  appointments: '34 In / 42 Out'
                },
                {
                  id: 6, name: 'Phoenix Distribution Hub', address: '9876 Desert Ridge Pkwy, Phoenix, AZ 85054',
                  status: 'Active', statusBg: 'bg-[#ebfdf5] text-[#10b981]',
                  utilization: 58.9, utilColor: 'bg-[#10b981]',
                  inbound: '112', outbound: '145', onHand: '3,842',
                  dockStatus: '10 Available', dockTone: 'bg-[#10b981]', dockText: 'text-[#10b981]',
                  yardStatus: 'Empty', yardTone: 'bg-[#10b981]', yardText: 'text-[#10b981]',
                  appointments: '22 In / 28 Out'
                }
              ];

              return (
                <section className="flex h-[calc(100vh-85px)] w-full overflow-hidden bg-[#fafafb] relative">
                  {/* Main Content Area */}
                  <div className="flex flex-1 flex-col overflow-hidden min-w-0 transition-all duration-300">
                    {/* Fixed Top Area */}
                    <div className="w-full shrink-0 px-4 pt-8 pb-3 sm:px-6 lg:px-8 border-b border-white/80 bg-white/50 backdrop-blur-md">
                      <div className="w-full">
                        {/* Header */}
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h2 className="text-[1.65rem] font-bold tracking-tight text-slate-900">Warehouses / Hubs</h2>
                          </div>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleSettingsShortcut('Warehouse settings opened.')}
                              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-[0.85rem] font-bold text-slate-700 transition"
                            >
                              <Settings className="h-[14px] w-[14px] text-slate-500" strokeWidth={2.5} />
                              Settings
                            </button>
                            <button
                              onClick={() => setActiveSection('reports')}
                              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-[0.85rem] font-bold text-slate-700 transition"
                            >
                              <BarChart3 className="h-[14px] w-[14px] text-slate-500" strokeWidth={2.5} />
                              View Analytics
                            </button>
                            <button
                              onClick={() => handleWarehouseShortcut('New warehouse intake workflow opened.')}
                              className="flex items-center gap-2 rounded-xl bg-[#3b82f6] px-5 py-2 text-[0.85rem] font-bold text-white transition hover:bg-blue-700 shadow-sm ml-1"
                            >
                              <Plus className="h-[14px] w-[14px]" strokeWidth={2.5} />
                              Add New Warehouse
                            </button>
                          </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                          {warehouseKPIs.map((kpi, idx) => {
                            const Icon = kpi.icon;
                            return (
                              <div key={idx} className={`relative overflow-hidden rounded-[1rem] p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${kpi.bgCard}`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className={`text-[1.55rem] font-bold tracking-tight ${kpi.textTone}`}>{kpi.value}</p>
                                    <p className={`mt-0.5 text-[0.8rem] font-medium ${kpi.subTextTone}`}>{kpi.title}</p>
                                  </div>
                                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${kpi.iconTone}`}>
                                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.5} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Filters */}
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex items-center gap-5">
                            <div className="flex items-center gap-2.5 text-[0.8rem] font-bold text-slate-600">
                              <span>Location:</span>
                              <select className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[0.8rem] font-bold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer">
                                <option>All Regions</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2.5 text-[0.8rem] font-bold text-slate-600">
                              <span>Status:</span>
                              <select className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[0.8rem] font-bold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer">
                                <option>All Status</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2.5 text-[0.8rem] font-bold text-slate-600">
                              <span>Capacity:</span>
                              <select className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[0.8rem] font-bold text-slate-700 outline-none hover:bg-slate-50 transition cursor-pointer">
                                <option>All Capacities</option>
                              </select>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedWarehouseId(null)
                                handleWarehouseShortcut('Warehouse filters reset.')
                              }}
                              className="text-[0.8rem] font-medium text-slate-400 hover:text-slate-600 transition ml-1 flex items-center gap-1"
                            >
                              <X className="h-3 w-3" /> Clear Filters
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[0.8rem] font-medium text-slate-500">View:</span>
                            <div className="flex items-center rounded-full bg-slate-100 p-1">
                              <button
                                onClick={() => handleWarehouseShortcut('Card view is active for warehouse listing.')}
                                className="flex items-center gap-1.5 rounded-full bg-[#3b82f6] px-3.5 py-1 text-[0.75rem] font-bold text-white shadow-sm"
                              >
                                <LayoutDashboard className="h-3.5 w-3.5" /> Cards
                              </button>
                              <button
                                onClick={() => handleWarehouseShortcut('Map view request captured for warehouses.')}
                                className="flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[0.75rem] font-bold text-slate-500 hover:text-slate-700 transition"
                              >
                                <Map className="h-3.5 w-3.5" /> Map
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Scrollable Cards Area */}
                    <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-2">
                      <div className="w-full">
                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 gap-6 pb-12 lg:grid-cols-2 xl:grid-cols-3">
                          {warehousesList.map((wh) => (
                            <div
                              key={wh.id}
                              onClick={() => setSelectedWarehouseId(wh.id)}
                              className={`rounded-[1.25rem] border bg-white px-6 pt-6 pb-5 transition-all flex flex-col cursor-pointer ${selectedWarehouseId === wh.id ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'border-slate-100 hover:shadow-md shadow-sm'}`}
                            >
                              <div className="flex items-start justify-between mb-[22px]">
                                <div className="pr-4">
                                  <h3 className="text-[1.1rem] leading-tight font-bold tracking-tight text-slate-800">{wh.name}</h3>
                                  <p className="mt-1 text-[0.8rem] text-slate-400">{wh.address}</p>
                                </div>
                                <span className={`inline-flex shrink-0 items-center rounded bg-slate-50 px-2 py-0.5 text-[0.7rem] font-bold ${wh.statusBg}`}>
                                  {wh.status}
                                </span>
                              </div>

                              <div className="mb-[22px]">
                                <div className="flex items-center justify-between text-[0.8rem] font-bold mb-2">
                                  <span className="text-slate-800">Capacity Utilization</span>
                                  <span className="text-slate-800">{wh.utilization}%</span>
                                </div>
                                <div className="h-[6px] w-full overflow-hidden rounded-full bg-slate-100">
                                  <div className={`h-full rounded-full transition-all duration-700 ease-out ${wh.utilColor}`} style={{ width: `${wh.utilization}%` }} />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3 mb-[22px]">
                                <div className="rounded-[0.85rem] bg-[#eff6ff] py-2.5 text-center">
                                  <p className="text-[1.1rem] font-bold text-[#3b82f6] leading-none">{wh.inbound}</p>
                                  <p className="mt-1.5 text-[0.7rem] text-[#93c5fd] font-medium tracking-wide">Inbound</p>
                                </div>
                                <div className="rounded-[0.85rem] bg-[#ebfdf5] py-2.5 text-center">
                                  <p className="text-[1.1rem] font-bold text-[#10b981] leading-none">{wh.outbound}</p>
                                  <p className="mt-1.5 text-[0.7rem] text-[#6ee7b7] font-medium tracking-wide">Outbound</p>
                                </div>
                                <div className="rounded-[0.85rem] bg-[#faf5ff] py-2.5 text-center">
                                  <p className="text-[1.1rem] font-bold text-[#8b5cf6] leading-none">{wh.onHand}</p>
                                  <p className="mt-1.5 text-[0.7rem] text-[#c4b5fd] font-medium tracking-wide">On-hand</p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[0.75rem] font-bold mb-5 px-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${wh.dockTone}`} />
                                  <span className="text-slate-400 font-medium">Dock Status:</span>
                                  <span className={wh.dockText}>{wh.dockStatus}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${wh.yardTone}`} />
                                  <span className="text-slate-400 font-medium">Yard:</span>
                                  <span className={wh.yardText}>{wh.yardStatus}</span>
                                </div>
                              </div>

                              <div className="mt-auto border-t border-slate-100 pt-[14px] text-center">
                                <p className="text-[0.75rem] font-medium text-slate-500">Today's Appointments: {wh.appointments}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Panel */}
                  {selectedWarehouseId && (() => {
                    const ws = warehousesList.find(w => w.id === selectedWarehouseId);
                    if (!ws) return null;

                    return (
                      <aside className="dashboard-scrollbar w-[380px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white shadow-[-24px_0_48px_-12px_rgba(0,0,0,0.1)] z-30 hidden xl:block animate-in slide-in-from-right-8 duration-300 absolute right-0 top-0 bottom-0 h-full">
                        <div className="flex flex-col min-h-full">
                          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-20">
                            <h2 className="text-[1.1rem] font-bold tracking-tight text-slate-800">Warehouse Details</h2>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleWarehouseShortcut(`Manage panel opened for ${ws.name}.`)}
                                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[0.8rem] font-bold text-white transition hover:bg-blue-700 shadow-sm"
                              >
                                <Wrench className="h-3.5 w-3.5" /> Manage
                              </button>
                              <button
                                onClick={() => setSelectedWarehouseId(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Top info section */}
                          <div className="p-6">
                            <div className="flex items-start gap-4 mb-6">
                              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#10b981] text-white shadow-sm mt-1">
                                <Warehouse className="h-5 w-5" strokeWidth={2.5} />
                              </div>
                              <div>
                                <h3 className="text-[1.1rem] font-bold text-slate-800 leading-tight">{ws.name}</h3>
                                <p className="text-[0.8rem] font-medium text-slate-400 mt-1">{ws.address}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-5 gap-x-4 mb-2">
                              <div>
                                <p className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-400 mb-1">Total Capacity:</p>
                                <p className="text-[0.95rem] font-bold text-slate-800">125,000 sq ft</p>
                              </div>
                              <div>
                                <p className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-400 mb-1">Utilization:</p>
                                <p className="text-[0.95rem] font-bold text-slate-800">{ws.utilization}%</p>
                              </div>
                              <div>
                                <p className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-400 mb-1">Dock Doors:</p>
                                <p className="text-[0.95rem] font-bold text-slate-800">16 Total</p>
                              </div>
                              <div>
                                <p className="text-[0.7rem] uppercase tracking-wider font-bold text-slate-400 mb-1">Status:</p>
                                <span className="inline-flex items-center rounded bg-[#ebfdf5] px-2 py-0.5 text-[0.7rem] font-bold text-[#10b981]">{ws.status}</span>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-slate-100 w-full" />

                          {/* Inventory Breakdown */}
                          <div className="p-6">
                            <h4 className="text-[0.95rem] font-bold tracking-tight text-slate-800 mb-5">Inventory Breakdown</h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                                  <span className="text-[0.85rem] font-bold text-slate-700">Electronics</span>
                                </div>
                                <div className="text-right leading-tight">
                                  <p className="text-[0.85rem] font-bold text-slate-800">1,847 units</p>
                                  <p className="text-[0.65rem] text-slate-400 font-medium mt-0.5">31.6% of total</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                                  <span className="text-[0.85rem] font-bold text-slate-700">Automotive Parts</span>
                                </div>
                                <div className="text-right leading-tight">
                                  <p className="text-[0.85rem] font-bold text-slate-800">2,156 units</p>
                                  <p className="text-[0.65rem] text-slate-400 font-medium mt-0.5">36.9% of total</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                                  <span className="text-[0.85rem] font-bold text-slate-700">Consumer Goods</span>
                                </div>
                                <div className="text-right leading-tight">
                                  <p className="text-[0.85rem] font-bold text-slate-800">1,844 units</p>
                                  <p className="text-[0.65rem] text-slate-400 font-medium mt-0.5">31.5% of total</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-slate-100 w-full" />

                          {/* Dock Schedule Timeline */}
                          <div className="p-6 pb-2">
                            <h4 className="text-[0.95rem] font-bold tracking-tight text-slate-800 mb-5">Dock Schedule Timeline</h4>
                            <div className="overflow-x-auto pb-4 custom-scrollbar">
                              <table className="w-full text-left border-separate border-spacing-y-2 border-spacing-x-2" style={{ minWidth: '320px' }}>
                                <thead>
                                  <tr>
                                    <th className="text-[0.65rem] font-bold text-slate-400 font-medium w-9 pb-2">Time</th>
                                    <th className="text-[0.7rem] text-center font-bold text-slate-400 font-medium pb-2">Dock 1-4</th>
                                    <th className="text-[0.7rem] text-center font-bold text-slate-400 font-medium pb-2">Dock 5-8</th>
                                    <th className="text-[0.7rem] text-center font-bold text-slate-400 font-medium pb-2">Dock 9-12</th>
                                    <th className="text-[0.7rem] text-center font-bold text-slate-400 font-medium pb-2">Dock 13-16</th>
                                  </tr>
                                </thead>
                                <tbody className="text-[0.65rem] font-bold">
                                  <tr>
                                    <td className="text-slate-400">8:00</td>
                                    <td><div className="mx-auto rounded-md bg-[#dbeafe] text-[#3b82f6] px-1.5 py-1 text-center font-bold tracking-tight">IN-2401</div></td>
                                    <td><div className="mx-auto rounded-lg bg-slate-50 h-[22px] w-full max-w-[50px]"></div></td>
                                    <td><div className="mx-auto rounded-md bg-[#d1fae5] text-[#10b981] px-1.5 py-1 text-center font-bold tracking-tight">OUT-1847</div></td>
                                    <td><div className="mx-auto rounded-md bg-[#dbeafe] text-[#3b82f6] px-1.5 py-1 text-center font-bold tracking-tight">IN-2402</div></td>
                                  </tr>
                                  <tr>
                                    <td className="text-slate-400">10:00</td>
                                    <td><div className="mx-auto rounded-lg bg-slate-50 h-[22px] w-full max-w-[50px]"></div></td>
                                    <td><div className="mx-auto rounded-md bg-[#d1fae5] text-[#10b981] px-1.5 py-1 text-center font-bold tracking-tight">OUT-1848</div></td>
                                    <td><div className="mx-auto rounded-lg bg-slate-50 h-[22px] w-full max-w-[50px]"></div></td>
                                    <td><div className="mx-auto rounded-md bg-[#d1fae5] text-[#10b981] px-1.5 py-1 text-center font-bold tracking-tight">OUT-1849</div></td>
                                  </tr>
                                  <tr>
                                    <td className="text-slate-400">12:00</td>
                                    <td><div className="mx-auto rounded-md bg-[#dbeafe] text-[#3b82f6] px-1.5 py-1 text-center font-bold tracking-tight">IN-2403</div></td>
                                    <td><div className="mx-auto rounded-md bg-[#dbeafe] text-[#3b82f6] px-1.5 py-1 text-center font-bold tracking-tight">IN-2404</div></td>
                                    <td><div className="mx-auto rounded-md bg-[#d1fae5] text-[#10b981] px-1.5 py-1 text-center font-bold tracking-tight">OUT-1850</div></td>
                                    <td><div className="mx-auto rounded-lg bg-slate-50 h-[22px] w-full max-w-[50px]"></div></td>
                                  </tr>
                                  <tr>
                                    <td className="text-slate-400">14:00</td>
                                    <td><div className="mx-auto rounded-lg bg-slate-50 h-[22px] w-full max-w-[50px]"></div></td>
                                    <td><div className="mx-auto rounded-lg bg-slate-50 h-[22px] w-full max-w-[50px]"></div></td>
                                    <td><div className="mx-auto rounded-md bg-[#dbeafe] text-[#3b82f6] px-1.5 py-1 text-center font-bold tracking-tight">IN-2405</div></td>
                                    <td><div className="mx-auto rounded-md bg-[#d1fae5] text-[#10b981] px-1.5 py-1 text-center font-bold tracking-tight">OUT-1851</div></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            <div className="mt-3 flex items-center gap-4 text-[0.75rem] font-bold text-slate-400">
                              <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#93c5fd]" /> Inbound</div>
                              <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-[#6ee7b7]" /> Outbound</div>
                              <div className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-lg bg-slate-100" /> Available</div>
                            </div>
                          </div>

                          <div className="h-px bg-slate-100 w-full mt-4" />

                          {/* Yard Queue */}
                          <div className="p-6">
                            <h4 className="text-[0.95rem] font-bold tracking-tight text-slate-800 mb-5">Yard Queue</h4>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between rounded-xl bg-[#fefce8] p-4">
                                <div className="flex items-center gap-3.5">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eab308] text-white">
                                    <Truck className="h-[1.1rem] w-[1.1rem]" />
                                  </div>
                                  <div>
                                    <p className="text-[0.85rem] font-bold text-slate-800">TRK-4578</p>
                                    <p className="text-[0.7rem] font-medium text-slate-500 mt-0.5">Waiting for dock assignment</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[0.85rem] font-bold text-[#ca8a04]">45 min</p>
                                  <p className="text-[0.65rem] font-medium text-slate-400">wait time</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between rounded-xl bg-[#eff6ff] p-4">
                                <div className="flex items-center gap-3.5">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3b82f6] text-white">
                                    <Truck className="h-[1.1rem] w-[1.1rem]" />
                                  </div>
                                  <div>
                                    <p className="text-[0.85rem] font-bold text-slate-800">TRK-3421</p>
                                    <p className="text-[0.7rem] font-medium text-slate-500 mt-0.5">Scheduled for 2:30 PM</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[0.85rem] font-bold text-[#2563eb]">12 min</p>
                                  <p className="text-[0.65rem] font-medium text-slate-400">wait time</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between rounded-xl bg-[#ebfdf5] p-4">
                                <div className="flex items-center gap-3.5">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#10b981] text-white">
                                    <Truck className="h-[1.1rem] w-[1.1rem]" />
                                  </div>
                                  <div>
                                    <p className="text-[0.85rem] font-bold text-slate-800">TRK-8765</p>
                                    <p className="text-[0.7rem] font-medium text-slate-500 mt-0.5">At dock 7 - Loading</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[0.85rem] font-bold text-[#059669]">0 min</p>
                                  <p className="text-[0.65rem] font-medium text-slate-400">wait time</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-slate-100 w-full" />

                          {/* Today's Appointments */}
                          <div className="p-6">
                            <h4 className="text-[0.95rem] font-bold tracking-tight text-slate-800 mb-5">Today's Appointments</h4>
                            <div className="space-y-4">
                              {/* Appt 1 */}
                              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <p className="text-[0.85rem] font-bold tracking-tight text-slate-800">LOAD-2024-4578</p>
                                  <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[0.7rem] font-bold text-[#3b82f6]">Inbound</span>
                                </div>
                                <div className="space-y-1.5 text-[0.75rem]">
                                  <p className="text-slate-500 font-medium"><span className="text-slate-400 mr-1 font-medium">Time:</span> 2:30 PM - 4:00 PM</p>
                                  <p className="text-slate-500 font-medium"><span className="text-slate-400 mr-1 font-medium">Carrier:</span> Swift Transportation</p>
                                  <p className="text-slate-500 font-medium"><span className="text-slate-400 mr-1 font-medium">Load Type:</span> Electronics</p>
                                </div>
                              </div>
                              {/* Appt 2 */}
                              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <p className="text-[0.85rem] font-bold tracking-tight text-slate-800">LOAD-2024-1847</p>
                                  <span className="rounded-full bg-[#d1fae5] px-2.5 py-0.5 text-[0.7rem] font-bold text-[#10b981]">Outbound</span>
                                </div>
                                <div className="space-y-1.5 text-[0.75rem]">
                                  <p className="text-slate-500 font-medium"><span className="text-slate-400 mr-1 font-medium">Time:</span> 3:00 PM - 4:30 PM</p>
                                  <p className="text-slate-500 font-medium"><span className="text-slate-400 mr-1 font-medium">Carrier:</span> FedEx Freight</p>
                                  <p className="text-slate-500 font-medium"><span className="text-slate-400 mr-1 font-medium">Load Type:</span> Automotive Parts</p>
                                </div>
                              </div>
                              {/* Appt 3 */}
                              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                <div className="flex items-center justify-between mb-4">
                                  <p className="text-[0.85rem] font-bold tracking-tight text-slate-800">LOAD-2024-3421</p>
                                  <span className="rounded-full bg-[#dbeafe] px-2.5 py-0.5 text-[0.7rem] font-bold text-[#3b82f6]">Inbound</span>
                                </div>
                                <div className="space-y-1.5 text-[0.75rem]">
                                  <p className="text-slate-500 font-medium"><span className="text-slate-400 mr-1 font-medium">Time:</span> 4:15 PM - 5:45 PM</p>
                                  <p className="text-slate-500 font-medium"><span className="text-slate-400 mr-1 font-medium">Carrier:</span> J.B. Hunt</p>
                                  <p className="text-slate-500 font-medium"><span className="text-slate-400 mr-1 font-medium">Load Type:</span> Consumer Goods</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-slate-100 w-full" />

                          {/* Linked Loads Status */}
                          <div className="p-6">
                            <h4 className="text-[0.95rem] font-bold tracking-tight text-slate-800 mb-4">Linked Loads Status</h4>
                            <div className="space-y-3">
                              <div className="rounded-xl bg-[#ebfdf5] text-emerald-700 p-4 flex items-start gap-3">
                                <div className="h-2 w-2 rounded-full bg-[#10b981] shrink-0 mt-1.5" />
                                <div>
                                  <p className="text-[0.85rem] font-bold mb-0.5 text-[#064e3b]">LOAD-2024-4521</p>
                                  <p className="text-[0.7rem] font-medium text-[#047857]">Assigned • ETA: 1:45 PM</p>
                                </div>
                              </div>
                              <div className="rounded-xl bg-[#eff6ff] text-blue-700 p-4 flex items-start gap-3">
                                <div className="h-2 w-2 rounded-full bg-[#3b82f6] shrink-0 mt-1.5" />
                                <div>
                                  <p className="text-[0.85rem] font-bold mb-0.5 text-[#1e3a8a]">LOAD-2024-4522</p>
                                  <p className="text-[0.7rem] font-medium text-[#1d4ed8]">In-Transit • ETA: 3:20 PM</p>
                                </div>
                              </div>
                              <div className="rounded-xl bg-[#fef2f2] text-red-700 p-4 flex items-start gap-3">
                                <div className="h-2 w-2 rounded-full bg-[#ef4444] shrink-0 mt-1.5" />
                                <div>
                                  <p className="text-[0.85rem] font-bold mb-0.5 text-[#7f1d1d]">LOAD-2024-4523</p>
                                  <p className="text-[0.7rem] font-medium text-[#b91c1c]">Delayed • New ETA: 5:15 PM</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-slate-100 w-full" />

                          <div className="p-6 pb-8 space-y-3 mt-auto">
                            <button
                              onClick={() => setActiveSection('orders')}
                              className="w-full flex items-center justify-center rounded-xl bg-[#3b82f6] py-3.5 text-[0.9rem] tracking-tight font-bold text-white shadow-sm hover:bg-[#2563eb] transition-colors"
                            >
                              Manage Inventory
                            </button>
                            <button
                              onClick={() => handleWarehouseShortcut('Appointment scheduler opened for this warehouse.')}
                              className="w-full flex items-center justify-center rounded-xl bg-[#10b981] py-3.5 text-[0.9rem] tracking-tight font-bold text-white shadow-sm hover:bg-[#059669] transition-colors"
                            >
                              Schedule Appointment
                            </button>
                            <button
                              onClick={() => setActiveSection('reports')}
                              className="w-full flex items-center justify-center rounded-xl border border-slate-200 bg-white py-3.5 text-[0.9rem] tracking-tight font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                            >
                              View Reports
                            </button>
                          </div>
                        </div>
                      </aside>
                    );
                  })()}

                </section>
              );
            })() : activeSection === 'pod' ? (() => {
              const podSummary = {
                pending: 12,
                submitted: 8,
                approved: 156,
                rejected: 3,
                total: 179
              };

              const podTabs = [
                { id: 'All Loads', count: 179 },
                { id: 'Pending Upload', count: 12 },
                { id: 'Submitted', count: 8 },
                { id: 'Approved', count: 156 },
                { id: 'Rejected', count: 3 },
              ];

              const podList = [
                {
                  id: 'LOAD-2024-4578',
                  timeAgo: 'Delivered 2h ago',
                  customerName: 'TechCorp Industries',
                  customerAddress: '1245 Technology Blvd, Austin, TX',
                  date: 'Dec 8, 2024', time: '2:45 PM',
                  driverInit: 'MR', driverName: 'Michael Rodriguez', driverId: 'DR-1847',
                  status: 'Pending Upload', tone: 'text-slate-700 font-medium',
                  statusDots: ['bg-slate-200', 'bg-slate-200', 'bg-slate-200'],
                  actionLabel: 'Upload', actionTone: 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_2px_8px_-4px_rgba(59,130,246,0.5)]'
                },
                {
                  id: 'LOAD-2024-4521',
                  timeAgo: 'Delivered 4h ago',
                  customerName: 'Global Manufacturing Co',
                  customerAddress: '8901 Industrial Way, Houston, TX',
                  date: 'Dec 8, 2024', time: '12:30 PM',
                  driverInit: 'SC', driverName: 'Sarah Chen', driverId: 'DR-2156',
                  status: 'Submitted', tone: 'bg-[#eff6ff] text-[#3b82f6]',
                  statusDots: ['bg-[#3b82f6]', 'bg-[#10b981]', 'bg-slate-200'],
                  actionLabel: 'View', actionTone: 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm',
                  secondAction: 'Approve', secondTone: 'bg-[#ecfdf5] text-[#10b981] hover:bg-[#d1fae5]'
                },
                {
                  id: 'LOAD-2024-4489',
                  timeAgo: 'Delivered 1 day ago',
                  customerName: 'Retail Solutions Inc',
                  customerAddress: '5432 Commerce Dr, Dallas, TX',
                  date: 'Dec 7, 2024', time: '4:15 PM',
                  driverInit: 'DT', driverName: 'David Thompson', driverId: 'DR-3421',
                  status: 'Approved', tone: 'bg-[#ecfdf5] text-[#10b981]',
                  statusDots: ['bg-[#10b981]', 'bg-[#10b981]', 'bg-[#10b981]'],
                  actionLabel: 'Download', actionTone: 'bg-transparent text-slate-400 hover:text-slate-700 font-medium'
                },
                {
                  id: 'LOAD-2024-4445',
                  timeAgo: 'Delivered 2 days ago',
                  customerName: 'Logistics Partners LLC',
                  customerAddress: '7890 Supply Chain Ave, Phoenix, AZ',
                  date: 'Dec 6, 2024', time: '10:20 AM',
                  driverInit: 'LJ', driverName: 'Lisa Johnson', driverId: 'DR-5678',
                  status: 'Rejected', tone: 'bg-[#fef2f2] text-[#ef4444]',
                  statusDots: ['bg-[#10b981]', 'bg-[#ef4444]', 'hidden'],
                  actionLabel: 'Re-upload', actionTone: 'bg-transparent text-[#ef4444] hover:text-rose-700 font-bold'
                },
                {
                  id: 'LOAD-2024-4567',
                  timeAgo: 'Delivered 1h ago',
                  customerName: 'Metro Distribution Hub',
                  customerAddress: '3456 Metro Pkwy, Atlanta, GA',
                  date: 'Dec 8, 2024', time: '3:30 PM',
                  driverInit: 'MR', driverName: 'Michael Rodriguez', driverId: 'DR-1847',
                  status: 'Pending Upload', tone: 'text-slate-700 font-medium',
                  statusDots: ['bg-slate-200', 'bg-slate-200', 'bg-slate-200'],
                  actionLabel: 'Upload', actionTone: 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_2px_8px_-4px_rgba(59,130,246,0.5)]'
                },
                {
                  id: 'LOAD-2024-4601',
                  timeAgo: 'Delivered 30m ago',
                  customerName: 'Apex Supply Chain',
                  customerAddress: '1092 Warehouse Row, Chicago, IL',
                  date: 'Dec 8, 2024', time: '4:00 PM',
                  driverInit: 'BJ', driverName: 'Brian Jones', driverId: 'DR-9123',
                  status: 'Pending Upload', tone: 'text-slate-700 font-medium',
                  statusDots: ['bg-slate-200', 'bg-slate-200', 'bg-slate-200'],
                  actionLabel: 'Upload', actionTone: 'bg-blue-600 text-white hover:bg-blue-700 shadow-[0_2px_8px_-4px_rgba(59,130,246,0.5)]'
                },
                {
                  id: 'LOAD-2024-4318',
                  timeAgo: 'Delivered 3 days ago',
                  customerName: 'National Freight System',
                  customerAddress: '887 Logistics Way, Seattle, WA',
                  date: 'Dec 5, 2024', time: '9:15 AM',
                  driverInit: 'EK', driverName: 'Elena Kraft', driverId: 'DR-8812',
                  status: 'Approved', tone: 'bg-[#ecfdf5] text-[#10b981]',
                  statusDots: ['bg-[#10b981]', 'bg-[#10b981]', 'bg-[#10b981]'],
                  actionLabel: 'Download', actionTone: 'bg-transparent text-slate-400 hover:text-slate-700 font-medium'
                },
                {
                  id: 'LOAD-2024-4402',
                  timeAgo: 'Delivered 2 days ago',
                  customerName: 'Summit Industries',
                  customerAddress: '221 Peak Blvd, Denver, CO',
                  date: 'Dec 6, 2024', time: '1:45 PM',
                  driverInit: 'PL', driverName: 'Peter Lange', driverId: 'DR-2201',
                  status: 'Submitted', tone: 'bg-[#eff6ff] text-[#3b82f6]',
                  statusDots: ['bg-[#3b82f6]', 'bg-[#10b981]', 'bg-slate-200'],
                  actionLabel: 'View', actionTone: 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm',
                  secondAction: 'Approve', secondTone: 'bg-[#ecfdf5] text-[#10b981] hover:bg-[#d1fae5]'
                },
                {
                  id: 'LOAD-2024-4299',
                  timeAgo: 'Delivered 4 days ago',
                  customerName: 'Continental Goods',
                  customerAddress: '1540 Ocean Hwy, Miami, FL',
                  date: 'Dec 4, 2024', time: '11:00 AM',
                  driverInit: 'RS', driverName: 'Robert Smith', driverId: 'DR-1144',
                  status: 'Rejected', tone: 'bg-[#fef2f2] text-[#ef4444]',
                  statusDots: ['bg-[#10b981]', 'bg-[#ef4444]', 'hidden'],
                  actionLabel: 'Re-upload', actionTone: 'bg-transparent text-[#ef4444] hover:text-rose-700 font-bold'
                }
              ];

              return (
                <section className="flex flex-col h-[calc(100vh-85px)] overflow-hidden bg-white">
                  {/* Header Container */}
                  <div className="shrink-0 pt-6 pb-0 border-b border-slate-200/60 bg-white">
                    <div className="w-full flex flex-col gap-6 px-6 lg:px-8">
                      {/* Title & Action Buttons */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-[1.8rem] font-bold tracking-tight text-slate-900">Proof of Delivery (POD)</h2>
                          <p className="text-[0.95rem] font-medium text-slate-500 mt-1">Queue of delivered loads pending POD submission or approval</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleExportPodReport(podList)}
                            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[0.9rem] font-bold text-slate-700 shadow-[0_1px_4px_-2px_rgba(0,0,0,0.1)] transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            <Download className="h-[15px] w-[15px] text-slate-400" strokeWidth={2.5} /> Export Report
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDocumentPicker(selectedPodLoadId ?? podList[0]?.id)}
                            className="flex items-center gap-2.5 rounded-xl bg-blue-600 px-5 py-2.5 text-[0.9rem] font-bold text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4)] transition hover:bg-blue-700"
                          >
                            <Upload className="h-[15px] w-[15px]" strokeWidth={2.5} /> Bulk Upload
                          </button>
                        </div>
                      </div>

                      {/* Summary Metrics */}
                      <div className="flex items-center gap-8 text-[0.9rem] font-bold text-slate-600 border-b border-slate-100 pb-5">
                        <div className="flex items-center gap-2">
                          Pending Upload: <span className="rounded-md bg-slate-100 px-2.5 py-1 text-slate-700 tracking-tight">{podSummary.pending}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          Submitted: <span className="rounded-md bg-[#eff6ff] px-2.5 py-1 text-[#3b82f6] tracking-tight">{podSummary.submitted}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          Approved: <span className="rounded-md bg-[#ebfdf5] px-2.5 py-1 text-[#10b981] tracking-tight">{podSummary.approved}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          Rejected: <span className="rounded-md bg-[#fef2f2] px-2.5 py-1 text-[#ef4444] tracking-tight">{podSummary.rejected}</span>
                        </div>
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex items-center gap-2 mb-3 mt-1">
                        {podTabs.map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setPodActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 rounded-full px-5 py-2 text-[0.85rem] font-bold tracking-tight transition-all ${podActiveTab === tab.id
                              ? 'bg-[#3b82f6] text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4)]'
                              : 'text-slate-600 hover:bg-slate-50'
                              }`}
                          >
                            {tab.id} <span className={`rounded-xl px-2 py-0.5 text-[0.7rem] ${podActiveTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sticky Table Header (Full Width BG) */}
                    <div className="w-full bg-[#fafafb] border-t border-slate-200/80 mt-[2px]">
                      <div className="w-full px-6 lg:px-8">
                        <div className="grid grid-cols-12 gap-5 py-3 text-[0.7rem] font-bold tracking-widest text-slate-500 uppercase">
                          <div className="col-span-2">Load ID</div>
                          <div className="col-span-3">Customer</div>
                          <div className="col-span-2">Delivery Time</div>
                          <div className="col-span-2 text-left">Driver</div>
                          <div className="col-span-2 text-left pl-2">POD Status</div>
                          <div className="col-span-1 text-right pr-2">Actions</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table Area (Scrollable rows only) */}
                  <div className="min-h-0 flex-1 overflow-y-auto w-full dashboard-scrollbar px-6 lg:px-8 bg-white pb-12 overflow-x-hidden border-t-2 border-slate-100/70 pt-2">
                    <div className="w-full">
                      {/* Table Body */}
                      <div className="flex flex-col">
                        {podList.filter(item => podActiveTab === 'All Loads' || item.status === podActiveTab).map((load, i) => (
                          <div key={load.id} className={`group relative transition-colors ${selectedPodLoadId === load.id || activeUploadId === load.id ? '' : 'border-b border-slate-100'} last:border-0`}>
                            {/* Row Wrapper */}
                            <div
                              onClick={() => setSelectedPodLoadId(load.id)}
                              className={`grid grid-cols-12 gap-5 items-center py-5 transition-all cursor-pointer -mx-6 px-6 lg:-mx-8 lg:px-8 hover:bg-slate-50/70 ${selectedPodLoadId === load.id
                                ? 'bg-slate-50 shadow-[inset_4px_0_0_0_rgba(59,130,246,1)]'
                                : activeUploadId === load.id
                                  ? 'bg-slate-50 shadow-[inset_1px_0_0_0_rgba(0,0,0,0.05)]'
                                  : ''
                                }`}
                            >

                              <div className="col-span-2">
                                <p className="text-[0.95rem] font-bold tracking-tight text-slate-800">{load.id}</p>
                                <p className="text-[0.75rem] font-medium text-slate-500 mt-1">{load.timeAgo}</p>
                              </div>
                              <div className="col-span-3">
                                <p className="text-[0.9rem] font-bold text-slate-800">{load.customerName}</p>
                                <p className="text-[0.75rem] font-medium text-slate-500 mt-1 truncate pr-8">{load.customerAddress}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-[0.9rem] font-bold text-slate-800">{load.date}</p>
                                <p className="text-[0.75rem] font-medium text-slate-500 mt-1">{load.time}</p>
                              </div>
                              <div className="col-span-2 flex items-center gap-3">
                                <div className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[0.75rem] font-bold text-slate-500 border border-slate-200">
                                  {load.driverInit}
                                </div>
                                <div>
                                  <p className="text-[0.85rem] font-bold text-slate-800 leading-tight">{load.driverName}</p>
                                  <p className="text-[0.7rem] font-medium text-slate-500 mt-0.5">Driver ID: {load.driverId}</p>
                                </div>
                              </div>
                              <div className="col-span-2 flex items-center gap-3 pl-2">
                                <span className={`inline-flex py-1 px-3 ${load.status !== 'Pending Upload' ? 'rounded-full' : ''} text-[0.75rem] font-bold ${load.tone}`}>
                                  {load.status}
                                </span>
                                <div className="flex items-center gap-[4px] mt-0.5">
                                  {load.statusDots.map((dot, idx) => (
                                    <span key={idx} className={`w-[6px] h-[6px] rounded-full ${dot}`} />
                                  ))}
                                </div>
                              </div>
                              <div className="col-span-1 flex items-center justify-end gap-2 pr-0">
                                {load.actionLabel === 'Upload' ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()

                                      if (activeUploadId === load.id) {
                                        setActiveUploadId(null)
                                        return
                                      }

                                      setActiveUploadId(load.id)
                                      handleOpenDocumentPicker(load.id)
                                    }}
                                    className={`rounded-[0.6rem] px-5 py-2 text-[0.8rem] tracking-tight font-bold transition relative z-10 ${load.actionTone}`}
                                  >
                                    {activeUploadId === load.id ? 'Cancel' : 'Upload'}
                                  </button>
                                ) : load.actionLabel === 'View' ? (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        handlePodView(load.id)
                                      }}
                                      className={`relative z-10 rounded-xl px-4 py-1.5 text-[0.75rem] font-bold transition ${load.actionTone}`}
                                    >
                                      {load.actionLabel}
                                    </button>
                                    {load.secondAction && (
                                      <button
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          handlePodApprove(load.id)
                                        }}
                                        className={`relative z-10 rounded-xl px-3.5 py-1.5 font-bold text-[0.75rem] transition ${load.secondTone}`}
                                      >
                                        {load.secondAction}
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()

                                      if (String(load.actionLabel).toLowerCase().includes('download')) {
                                        handleDownloadLatestDocument(load.id)
                                        return
                                      }

                                      handleOpenDocumentPicker(load.id)
                                    }}
                                    className={`relative z-10 rounded-xl px-2 py-1.5 font-bold text-[0.8rem] transition ${load.actionTone}`}
                                  >
                                    {load.actionLabel}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Inline Dropzone Expansion */}
                            {activeUploadId === load.id && load.status === 'Pending Upload' && (
                              <div className="px-1 pb-6 mb-4 animate-in slide-in-from-top-1 fade-in duration-200">
                                <div
                                  onClick={() => handleOpenDocumentPicker(load.id)}
                                  className="w-full relative rounded-2xl border-[1.5px] border-dashed border-[#93c5fd] bg-gradient-to-b from-[#eff6ff] to-[#f8fafc] py-16 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:from-[#e0f0ff] transition group"
                                >
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 mb-4 transition group-hover:bg-blue-50 group-hover:scale-105">
                                    <Upload className="h-[18px] w-[18px] text-blue-500" strokeWidth={2.5} />
                                  </div>
                                  <h4 className="text-[1.05rem] font-bold tracking-tight text-slate-700">Upload POD Documents (Image/PDF)</h4>
                                  <p className="mt-1.5 text-[0.85rem] font-medium text-slate-400">{isDocumentUploading ? 'Uploading...' : 'Drag and drop files here or click to browse'}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* POD Properties Side Panel */}
                  {selectedPodLoadId && (() => {
                    const selLoad = podList.find(l => l.id === selectedPodLoadId);
                    if (!selLoad) return null;
                    return (
                      <aside className="absolute right-0 top-0 bottom-0 z-30 w-[420px] bg-[#fafafb] border-l border-slate-200 shadow-[-24px_0_48px_-12px_rgba(0,0,0,0.15)] flex flex-col pt-6 pb-6 animate-in slide-in-from-right duration-300">

                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-6 mb-6">
                          <div className="flex items-center gap-3">
                            <h2 className="text-[1.3rem] font-bold tracking-tight text-slate-900">{selLoad.id}</h2>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handlePodApprove(selLoad.id)}
                              className="flex items-center gap-1.5 rounded-xl bg-[#10b981] px-4 py-2 text-[0.85rem] font-bold text-white shadow-sm hover:bg-[#059669] transition"
                            >
                              <Check className="h-4 w-4" strokeWidth={3} /> Approve
                            </button>
                            <button onClick={() => setSelectedPodLoadId(null)} className="flex items-center justify-center rounded-full bg-white border border-slate-200 w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-sm transition">
                              <X className="h-4 w-4" strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 dashboard-scrollbar flex flex-col gap-6 pb-12">

                          {/* Info Summary Card */}
                          <div className="rounded-[1.25rem] border border-slate-200/80 bg-white p-5 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>

                            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 mt-2">
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 shadow-[0_2px_8px_-2px_rgba(59,130,246,0.6)]">
                                <Truck className="h-5 w-5 text-white" strokeWidth={2.5} />
                              </div>
                              <div>
                                <h3 className="text-[1.05rem] font-bold tracking-tight text-slate-900 leading-tight">{selLoad.id}</h3>
                                <p className="text-[0.8rem] font-medium text-slate-400 mt-0.5 max-w-[200px] truncate">{selLoad.customerName}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                              <div>
                                <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Delivery Date</p>
                                <p className="text-[0.85rem] font-bold text-slate-800 mt-1">{selLoad.date}</p>
                              </div>
                              <div>
                                <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Driver</p>
                                <p className="text-[0.85rem] font-bold text-slate-800 mt-1">{selLoad.driverName}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Delivery Address</p>
                                <p className="text-[0.85rem] font-bold text-slate-800 mt-1 leading-snug">{selLoad.customerAddress}</p>
                              </div>
                              <div>
                                <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-wider">Status</p>
                                <div className="mt-1">
                                  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[0.75rem] font-bold tracking-tight ${selLoad.status === 'Approved' ? 'bg-[#ecfdf5] text-[#10b981]' :
                                    selLoad.status === 'Submitted' ? 'bg-[#eff6ff] text-[#3b82f6]' :
                                      selLoad.status === 'Rejected' ? 'bg-[#fef2f2] text-[#ef4444]' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                    {selLoad.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* POD Documents */}
                          <div>
                            <h3 className="text-[1.05rem] font-bold tracking-tight text-slate-800 mb-4 px-1">POD Documents</h3>

                            {/* Receipt */}
                            <div className="rounded-[1.25rem] border border-slate-200/80 bg-white p-1 mb-5 shadow-sm hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] transition-all duration-300">
                              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/60 pb-3 mb-1">
                                <span className="text-[0.85rem] font-bold text-slate-700">Delivery Receipt</span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadLatestDocument(selLoad.id)}
                                  className="text-[0.75rem] font-bold text-blue-500 hover:underline"
                                >
                                  Download
                                </button>
                              </div>

                              <div className="bg-slate-50/50 rounded-xl m-3 border border-slate-100 h-[170px] flex p-3 relative overflow-hidden group cursor-pointer">
                                {/* Stylized File Placeholder matching screenshot style! */}
                                <div className="absolute inset-x-3 top-3 bottom-0 rounded-t-xl bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.15)] border border-slate-200/80 transition-transform group-hover:translate-y-[-4px]">
                                  <div className="border-b border-slate-100 p-4 pb-3 flex justify-between">
                                    <div>
                                      <h4 className="font-serif text-[1rem] font-bold text-slate-800 leading-tight">Delivery<br />Confirmations</h4>
                                    </div>
                                    <div className="text-right space-y-[4px]">
                                      <div className="h-[2px] w-[50px] bg-slate-200 ml-auto"></div>
                                      <div className="h-[2px] w-[40px] bg-slate-200 ml-auto"></div>
                                      <div className="h-[2px] w-[60px] bg-slate-200 ml-auto"></div>
                                    </div>
                                  </div>
                                  <div className="px-4 py-3 flex flex-col gap-2 relative">
                                    <div className="grid grid-cols-[1fr_50px] gap-4 mb-1">
                                      <div className="h-[3px] w-full bg-slate-200"></div>
                                      <div className="h-[3px] w-full bg-slate-200"></div>
                                    </div>
                                    <div className="flex flex-col gap-[3px]">
                                      <div className="h-[2px] w-[180px] bg-slate-100"></div>
                                      <div className="h-[2px] w-[90px] bg-slate-100"></div>
                                      <div className="h-[2px] w-[140px] bg-slate-100"></div>
                                    </div>
                                    <div className="absolute right-4 bottom-[-16px]">
                                      <p className="text-[1.1rem] font-bold text-slate-800">$120.35</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Photo */}
                            <div className="rounded-[1.25rem] border border-slate-200/80 bg-white p-1 shadow-sm hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] transition-all duration-300">
                              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/60 pb-3 mb-1">
                                <span className="text-[0.85rem] font-bold text-slate-700">Photo Evidence</span>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadLatestDocument(selLoad.id)}
                                  className="text-[0.75rem] font-bold text-blue-500 hover:underline"
                                >
                                  Download
                                </button>
                              </div>
                              <div className="m-3 h-[140px] rounded-xl overflow-hidden relative group cursor-pointer">
                                <img
                                  src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2940&auto=format&fit=crop"
                                  className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                                  alt="Warehouse loading dock"
                                />
                                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl transition duration-500 group-hover:bg-transparent"></div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </aside>
                    );
                  })()}
                </section>
              );
            })() : activeSection === 'billing' ? (() => {
              const IconComp = sidebarItems.find(item => item.key === 'billing')?.icon || ReceiptText;
              return (
                <section className="flex flex-col h-[calc(100vh-85px)] bg-white pb-6 relative overflow-hidden">
                  {/* Header Container */}
                  <div className="shrink-0 pt-6 pb-0 bg-white">
                    <div className="w-full flex flex-col px-6 lg:px-8">
                      {/* Title & Action Buttons */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-[1.7rem] font-bold tracking-tight text-slate-900 uppercase">BILLING & INVOICES</h2>
                          <p className="text-[0.95rem] font-medium text-slate-500 mt-1">Manage invoices, track payments, and handle customer billing</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleExportInvoices}
                            className="flex items-center gap-2 rounded-lg bg-[#f8fafc] px-4 py-2 text-[0.85rem] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" strokeWidth={2.5} /> Export Data
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveSection('settings')}
                            className="flex items-center gap-2 rounded-lg bg-[#f8fafc] px-4 py-2 text-[0.85rem] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Settings className="h-3.5 w-3.5" strokeWidth={2.5} /> Settings
                          </button>
                          <button onClick={handleCreateInvoice} className="flex items-center gap-2 rounded-md bg-[#6082f6] px-4 py-2 text-[0.85rem] font-bold text-white shadow-sm hover:bg-blue-600 transition-colors">
                            <Plus className="h-4 w-4" strokeWidth={3} /> Create Invoice
                          </button>
                        </div>
                      </div>

                      {/* Summary Metrics Inline */}
                      <div className="flex items-center gap-8 py-5 mt-5 border-y border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.85rem] font-bold text-slate-500">Total Outstanding:</span>
                          <span className="text-[1.05rem] font-black text-slate-800 tracking-tight">$247,850.00</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[0.85rem] font-bold text-slate-500">Paid:</span>
                          <span className="text-[0.75rem] font-bold text-[#166534] bg-[#dcfce7] px-2.5 py-1 rounded-full">$1,245,600.00</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[0.85rem] font-bold text-slate-500">Pending:</span>
                          <span className="text-[0.75rem] font-bold text-[#854d0e] bg-[#fef08a] px-2.5 py-1 rounded-full">$156,400.00</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[0.85rem] font-bold text-slate-500">Overdue:</span>
                          <span className="text-[0.75rem] font-bold text-[#9f1239] bg-[#ffe4e6] px-2.5 py-1 rounded-full">$91,450.00</span>
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="flex items-center gap-3 mb-4 mt-5">
                        <button onClick={() => showActionMessage('Status filter menu opened.')} className="flex items-center justify-between w-32 rounded-full border border-slate-200 px-4 py-1.5 text-[0.8rem] font-bold text-slate-600 bg-white hover:bg-slate-50">
                          All Status <ChevronDown className="h-3 w-3 text-slate-400" strokeWidth={3} />
                        </button>
                        <button onClick={() => showActionMessage('Customer filter menu opened.')} className="flex items-center justify-between w-[140px] rounded-full border border-slate-200 px-4 py-1.5 text-[0.8rem] font-bold text-slate-600 bg-white hover:bg-slate-50">
                          All Customers <ChevronDown className="h-3 w-3 text-slate-400" strokeWidth={3} />
                        </button>

                        <div className="flex items-center gap-2">
                          <button onClick={() => showActionMessage('Start date picker opened.')} className="flex items-center justify-between w-[130px] rounded-full border border-slate-200 px-4 py-1.5 text-[0.8rem] font-bold text-slate-600 bg-white hover:bg-slate-50">
                            11/01/2024 <CalendarDays className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
                          </button>
                          <span className="text-[0.8rem] font-medium text-slate-400">to</span>
                          <button onClick={() => showActionMessage('End date picker opened.')} className="flex items-center justify-between w-[130px] rounded-full border border-slate-200 px-4 py-1.5 text-[0.8rem] font-bold text-slate-600 bg-white hover:bg-slate-50">
                            12/08/2024 <CalendarDays className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
                          </button>
                        </div>

                        <button onClick={() => showActionMessage('Aging filter menu opened.')} className="flex items-center justify-between w-28 rounded-full border border-slate-200 px-4 py-1.5 text-[0.8rem] font-bold text-slate-600 bg-white hover:bg-slate-50">
                          All Aging <ChevronDown className="h-3 w-3 text-slate-400" strokeWidth={3} />
                        </button>

                        <button onClick={handleBillingFiltersReset} className="text-[0.8rem] font-bold text-slate-400 ml-2 hover:text-slate-600">
                          Clear Filters
                        </button>
                      </div>
                    </div>

                    {/* Table Header */}
                    <div className="w-full bg-[#fafafb] border-y border-slate-200 mt-2">
                      <div className="w-full px-6 lg:px-8">
                        <div className="grid grid-cols-12 gap-5 py-3.5 text-[0.7rem] font-bold tracking-widest text-slate-500 uppercase">
                          <div className="col-span-2">Invoice #</div>
                          <div className="col-span-3">Customer</div>
                          <div className="col-span-2">Amount</div>
                          <div className="col-span-2">Due Date</div>
                          <div className="col-span-1 pl-2">Status</div>
                          <div className="col-span-2 text-right pr-2">Actions</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Table List (Scrollable) */}
                  <div className="w-full px-6 lg:px-8 pt-2 pb-6 flex-1 flex flex-col min-h-0">
                    <div className="w-full flex-1 overflow-y-auto dashboard-scrollbar pr-2 -mr-2">
                      {/* Table Body */}
                      <div className="flex flex-col">
                        {(() => {
                          const filtered = dashboardData.invoiceList?.filter(item => billingActiveTab === 'All Invoices' || item.status === billingActiveTab) || [];
                          const itemsPerPage = 6;
                          const paginated = filtered.slice((billingCurrentPage - 1) * itemsPerPage, billingCurrentPage * itemsPerPage);

                          return paginated.map((invoice) => (
                            <div key={invoice.id} className={`group relative transition-colors ${selectedInvoiceId === invoice.id ? '' : 'border-b border-slate-100'} last:border-0`}>
                              {/* Row Wrapper */}
                              <div
                                onClick={() => setSelectedInvoiceId(invoice.id)}
                                className={`grid grid-cols-12 gap-5 items-center py-4 transition-all cursor-pointer -mx-6 px-6 lg:-mx-8 lg:px-8 hover:bg-slate-50/70 ${selectedInvoiceId === invoice.id
                                  ? 'bg-slate-50 shadow-[inset_4px_0_0_0_rgba(59,130,246,1)]'
                                  : ''
                                  }`}
                              >

                                <div className="col-span-2">
                                  <p className="text-[0.95rem] font-bold tracking-tight text-slate-800">{invoice.id}</p>
                                  <p className="text-[0.75rem] font-medium text-slate-500 mt-0.5">Created {invoice.issueDate}</p>
                                </div>

                                <div className="col-span-3 flex items-center gap-3">
                                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.75rem] font-bold shadow-sm ${invoice.tone}`}>
                                    {getInitials(invoice.customerName)}
                                  </div>
                                  <div className="min-w-0 pr-4">
                                    <p className="text-[0.9rem] font-bold text-slate-800 truncate">{invoice.customerName}</p>
                                    <p className="text-[0.75rem] font-medium text-slate-500 truncate">{invoice.customerName.toLowerCase().replace(/ /g, '')}@company.com</p>
                                  </div>
                                </div>

                                <div className="col-span-2">
                                  <p className="text-[1.1rem] tracking-tight font-black text-slate-800">{invoice.amount}</p>
                                  <p className="text-[0.75rem] font-semibold text-slate-400 mt-0.5 uppercase tracking-wide">Net 30</p>
                                </div>

                                <div className="col-span-2">
                                  <p className="text-[0.9rem] font-bold text-slate-800">{invoice.dueDate}</p>
                                  <p className={`text-[0.75rem] font-semibold mt-0.5 ${invoice.status === 'Overdue' ? 'text-rose-500' : 'text-slate-500'}`}>
                                    {invoice.status === 'Overdue' ? '45 days overdue' : invoice.status === 'Pending' ? '15 days remaining' : 'Paid on time'}
                                  </p>
                                </div>

                                <div className="col-span-1 pl-2">
                                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.75rem] font-bold ${invoice.status === 'Pending' ? 'bg-[#fefce8] text-[#a16207]' : invoice.tone}`}>
                                    {invoice.status}
                                  </span>
                                </div>

                                <div className="col-span-2 flex items-center justify-end gap-2 pr-2">
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      handleInvoiceRowView(invoice.id)
                                    }}
                                    className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                                  >
                                    <Eye className="h-4 w-4" strokeWidth={2.5} />
                                  </button>
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      handleInvoiceAction(invoice)
                                    }}
                                    className={`flex h-[34px] w-[34px] items-center justify-center rounded-lg transition shadow-sm ${invoice.status === 'Paid' ? 'bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] border border-[#dcfce7]' : invoice.status === 'Overdue' ? 'bg-[#fff1f2] text-[#e11d48] hover:bg-[#ffe4e6] border border-[#ffe4e6]' : 'bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7] border border-[#dcfce7]'}`}
                                  >
                                    {invoice.status === 'Paid' || invoice.status === 'Pending' ? <Download className="h-4 w-4" strokeWidth={2.5} /> : <Mail className="h-4 w-4" strokeWidth={2.5} />}
                                  </button>
                                </div>

                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    {/* Pagination */}
                    {(() => {
                      const filtered = dashboardData.invoiceList?.filter(item => billingActiveTab === 'All Invoices' || item.status === billingActiveTab) || [];
                      const itemsPerPage = 6;
                      const totalLength = filtered.length;
                      const totalPages = Math.ceil(totalLength / itemsPerPage) || 1;
                      const startItem = totalLength === 0 ? 0 : (billingCurrentPage - 1) * itemsPerPage + 1;
                      const endItem = Math.min(billingCurrentPage * itemsPerPage, totalLength);

                      return (
                        <div className="mt-8 border-t border-slate-100 pt-6 px-2 flex items-center justify-between shrink-0">
                          <p className="text-[0.85rem] text-slate-500 font-medium">Showing <span className="font-bold text-slate-800">{startItem}</span> to <span className="font-bold text-slate-800">{endItem}</span> of <span className="font-bold text-slate-800">{totalLength}</span> invoices</p>
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={billingCurrentPage === 1}
                              onClick={() => setBillingCurrentPage(prev => Math.max(1, prev - 1))}
                              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-500 text-[0.8rem] font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm bg-white"
                            >
                              Previous
                            </button>

                            {[...Array(totalPages)].map((_, i) => {
                              const page = i + 1;
                              return (
                                <button
                                  key={page}
                                  onClick={() => setBillingCurrentPage(page)}
                                  className={`px-3.5 py-2 rounded-xl text-[0.8rem] font-bold transition-colors ${billingCurrentPage === page
                                    ? 'bg-blue-600 text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.4)]'
                                    : 'border border-transparent text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                  {page}
                                </button>
                              );
                            })}

                            <button
                              disabled={billingCurrentPage === totalPages}
                              onClick={() => setBillingCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 shadow-sm bg-white text-[0.8rem] font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Invoice Detail Right Panel */}
                  {selectedInvoiceId && (() => {
                    const selInvoice = dashboardData.invoiceList?.find(inv => inv.id === selectedInvoiceId);
                    if (!selInvoice) return null;

                    // Generate deterministic line items based on the invoice amount
                    const amountNum = parseFloat(selInvoice.amount.replace(/[$,]/g, ''));
                    const freightAmt = (amountNum * 0.74).toFixed(2);
                    const fuelAmt = (amountNum * 0.12).toFixed(2);
                    const accessorialAmt = (amountNum * 0.05).toFixed(2);
                    const subtotal = (parseFloat(freightAmt) + parseFloat(fuelAmt) + parseFloat(accessorialAmt)).toFixed(2);
                    const taxRate = 9.875;
                    const taxAmt = (parseFloat(subtotal) * taxRate / 100).toFixed(2);
                    const total = (parseFloat(subtotal) + parseFloat(taxAmt)).toFixed(2);

                    return (
                      <aside className="absolute right-0 top-0 bottom-0 z-30 w-[420px] bg-[#fafafb] border-l border-slate-200 shadow-[-24px_0_48px_-12px_rgba(0,0,0,0.15)] flex flex-col pt-6 pb-6 animate-in slide-in-from-right duration-300">

                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-6 mb-6">
                          <div className="flex items-center gap-3">
                            <h2 className="text-[1.3rem] font-bold tracking-tight text-slate-900">{selInvoice.id}</h2>
                          </div>
                          <div className="flex items-center gap-3">
                            <button onClick={() => handleSendInvoice(selInvoice)} className="flex items-center gap-1.5 rounded-xl bg-[#3b82f6] px-4 py-2 text-[0.85rem] font-bold text-white shadow-sm hover:bg-blue-700 transition">
                              <Mail className="h-4 w-4" strokeWidth={2.5} /> Send
                            </button>
                            <button onClick={() => setSelectedInvoiceId(null)} className="flex items-center justify-center rounded-full bg-white border border-slate-200 w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-sm transition">
                              <X className="h-4 w-4" strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 dashboard-scrollbar flex flex-col pb-12">

                          {/* Icon + Title (outside card) */}
                          <div className="flex items-center gap-3.5 mb-5">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4f7df3] shadow-[0_4px_12px_-4px_rgba(79,125,243,0.5)]">
                              <FileText className="h-5 w-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div>
                              <h3 className="text-[1.1rem] font-bold tracking-tight text-slate-900 leading-tight">{selInvoice.id}</h3>
                              <p className="text-[0.82rem] font-medium text-slate-400 mt-0.5">{selInvoice.customerName}</p>
                            </div>
                          </div>

                          {/* Info Box (simple bordered card) */}
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-8">
                            <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                              <div>
                                <p className="text-[0.75rem] font-medium text-slate-400">Issue Date:</p>
                                <p className="text-[0.92rem] font-bold text-slate-800 mt-0.5">{selInvoice.issueDate}</p>
                              </div>
                              <div>
                                <p className="text-[0.75rem] font-medium text-slate-400">Due Date:</p>
                                <p className="text-[0.92rem] font-bold text-slate-800 mt-0.5">{selInvoice.dueDate}</p>
                              </div>
                              <div>
                                <p className="text-[0.75rem] font-medium text-slate-400">Amount:</p>
                                <p className="text-[1.35rem] font-black tracking-tight text-slate-900 mt-0.5">{selInvoice.amount}</p>
                              </div>
                              <div>
                                <p className="text-[0.75rem] font-medium text-slate-400">Status:</p>
                                <div className="mt-1">
                                  <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[0.78rem] font-bold tracking-tight ${selInvoice.status === 'Paid' ? 'bg-[#ecfdf5] text-[#10b981]' :
                                    selInvoice.status === 'Overdue' ? 'bg-[#fef2f2] text-[#ef4444]' :
                                      'bg-[#fefce8] text-[#a16207]'
                                    }`}>
                                    {selInvoice.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Line Items */}
                          <div className="mb-8">
                            <h3 className="text-[1.1rem] font-bold tracking-tight text-slate-900 mb-4">Line Items</h3>

                            {/* All items in ONE card */}
                            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                              {/* Freight Transportation */}
                              <div className="p-5 border-b border-slate-100">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 pr-3">
                                    <p className="text-[0.92rem] font-bold text-slate-800 leading-snug">Freight Transportation - LOAD-2024-4578</p>
                                    <p className="text-[0.8rem] font-medium text-slate-400 mt-1">{selInvoice.customerAddress} to Houston, TX</p>
                                  </div>
                                  <p className="text-[1rem] font-black tracking-tight text-slate-800 shrink-0">${freightAmt}</p>
                                </div>
                                <div className="flex items-center gap-8 mt-3">
                                  <span className="text-[0.78rem] text-slate-400">Qty: <span className="font-semibold text-slate-600">1</span></span>
                                  <span className="text-[0.78rem] text-slate-400">Rate: <span className="font-semibold text-slate-600">${freightAmt}</span></span>
                                  <span className="text-[0.78rem] text-slate-400">Total: <span className="font-semibold text-slate-600">${freightAmt}</span></span>
                                </div>
                              </div>

                              {/* Fuel Surcharge */}
                              <div className="flex items-start justify-between p-5 border-b border-slate-100">
                                <div>
                                  <p className="text-[0.92rem] font-bold text-slate-800">Fuel Surcharge</p>
                                  <p className="text-[0.8rem] font-medium text-slate-400 mt-1">15% of base rate</p>
                                </div>
                                <p className="text-[1rem] font-black tracking-tight text-slate-800 shrink-0">${fuelAmt}</p>
                              </div>

                              {/* Accessorial Charges */}
                              <div className="flex items-start justify-between p-5">
                                <div>
                                  <p className="text-[0.92rem] font-bold text-slate-800">Accessorial Charges</p>
                                  <p className="text-[0.8rem] font-medium text-slate-400 mt-1">Detention, loading assistance</p>
                                </div>
                                <p className="text-[1rem] font-black tracking-tight text-slate-800 shrink-0">${accessorialAmt}</p>
                              </div>
                            </div>
                          </div>

                          {/* Totals (plain text, no card) */}
                          <div className="mb-8 px-1">
                            <div className="flex items-center justify-between py-2">
                              <p className="text-[0.88rem] font-medium text-slate-400">Subtotal:</p>
                              <p className="text-[0.95rem] font-bold text-slate-800">${subtotal}</p>
                            </div>
                            <div className="flex items-center justify-between py-2">
                              <p className="text-[0.88rem] font-medium text-slate-400">Tax ({taxRate}%):</p>
                              <p className="text-[0.95rem] font-bold text-slate-800">${taxAmt}</p>
                            </div>
                            <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-200">
                              <p className="text-[1.1rem] font-black text-slate-900">Total:</p>
                              <p className="text-[1.35rem] font-black tracking-tight text-slate-900">${total}</p>
                            </div>
                          </div>

                          {/* Customer Billing Profile */}
                          <div className="mb-8">
                            <h3 className="text-[1.1rem] font-bold tracking-tight text-slate-900 mb-4">Customer Billing Profile</h3>
                            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">

                              {/* Billing Address */}
                              <div className="p-5 border-b border-slate-100">
                                <p className="text-[0.92rem] font-bold text-slate-800 mb-2">Billing Address</p>
                                <p className="text-[0.85rem] leading-relaxed text-slate-500">
                                  1245 Technology Blvd<br />
                                  {selInvoice.customerAddress || 'Austin, TX'} 78759<br />
                                  United States
                                </p>
                              </div>

                              {/* Payment Methods */}
                              <div className="p-5 border-b border-slate-100">
                                <p className="text-[0.92rem] font-bold text-slate-800 mb-3">Payment Methods</p>
                                <div className="flex flex-col gap-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-6 w-8 items-center justify-center rounded bg-blue-100">
                                      <DollarSign className="h-3.5 w-3.5 text-blue-600" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[0.85rem] text-slate-600">**** **** **** 4532</span>
                                    <span className="text-[0.75rem] font-medium text-slate-400">(Primary)</span>
                                  </div>
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-6 w-8 items-center justify-center rounded bg-emerald-100">
                                      <Wallet className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[0.85rem] text-slate-600">ACH - ****1847</span>
                                  </div>
                                </div>
                              </div>

                              {/* Payment Terms */}
                              <div className="p-5">
                                <p className="text-[0.92rem] font-bold text-slate-800 mb-2">Payment Terms</p>
                                <p className="text-[0.85rem] text-slate-600">Net 30 days</p>
                                <p className="text-[0.82rem] text-slate-400 mt-0.5">Credit Limit: $100,000.00</p>
                              </div>

                            </div>
                          </div>

                          {/* Payment History */}
                          <div className="mb-8">
                            <h3 className="text-[1.1rem] font-bold tracking-tight text-slate-900 mb-4">Payment History</h3>
                            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">

                              {/* Payment Overdue */}
                              <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-[#fef2f2]/40">
                                <div>
                                  <p className="text-[0.92rem] font-bold text-[#dc2626]">Payment Overdue</p>
                                  <p className="text-[0.8rem] font-medium text-slate-400 mt-1">No payment received for this invoice</p>
                                </div>
                                <span className="text-[0.85rem] font-bold text-[#dc2626] shrink-0">45 days</span>
                              </div>

                              {/* Previous Payment */}
                              <div className="flex items-start justify-between p-5">
                                <div>
                                  <p className="text-[0.92rem] font-bold text-slate-800">Previous Payment</p>
                                  <p className="text-[0.8rem] font-medium text-slate-400 mt-1">INV-2024-345: $19,250.00 – Paid on time</p>
                                </div>
                                <span className="text-[0.85rem] font-semibold text-slate-500 shrink-0">Nov 8, 2024</span>
                              </div>

                            </div>
                          </div>

                          {/* Disputes */}
                          <div>
                            <h3 className="text-[1.1rem] font-bold tracking-tight text-slate-900 mb-4">Disputes</h3>
                            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                              <div className="flex items-center justify-between p-5 bg-[#fefce8]/40">
                                <p className="text-[0.92rem] font-bold text-[#b45309]">Dispute Open</p>
                                <span className="inline-flex items-center rounded-full bg-[#ecfdf5] px-3 py-1 text-[0.78rem] font-bold text-[#10b981]">Open</span>
                              </div>
                            </div>
                          </div>

                        </div>
                      </aside>
                    );
                  })()}
                </section>
              );
            })() : activeSection === 'reports' ? (() => {
              return (
                <section className="flex flex-col h-[calc(100vh-85px)] bg-white relative overflow-hidden">
                  {/* Header Container */}
                  <div className="shrink-0 pt-6 pb-0 bg-white border-b border-slate-200">
                    <div className="w-full flex flex-col px-6 lg:px-8">
                      {/* Title & Action Buttons */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-[1.7rem] font-bold tracking-tight text-slate-900 uppercase">REPORTS</h2>
                          <p className="text-[0.95rem] font-medium text-slate-500 mt-1">Reports module with chart-first design for operational and financial analysis</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleExportReports}
                            className="flex items-center gap-2 rounded-lg bg-[#f8fafc] border border-slate-200 px-4 py-2 text-[0.85rem] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" strokeWidth={2.5} /> Bulk Export
                          </button>
                          <button onClick={() => setSelectedReportId('on-time-performance')} className="flex items-center gap-2 rounded-md bg-[#6082f6] px-4 py-2 text-[0.85rem] font-bold text-white shadow-sm hover:bg-blue-600 transition-colors">
                            <Plus className="h-4 w-4" strokeWidth={3} /> Custom Report
                          </button>
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="flex items-center gap-3 mb-5 mt-5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => showActionMessage('Report start date picker opened.')} className="flex items-center justify-between w-[130px] rounded-full border border-slate-200 px-4 py-1.5 text-[0.8rem] font-bold text-slate-600 bg-white hover:bg-slate-50">
                            11/01/2024 <CalendarDays className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
                          </button>
                          <span className="text-[0.8rem] font-medium text-slate-400">to</span>
                          <button onClick={() => showActionMessage('Report end date picker opened.')} className="flex items-center justify-between w-[130px] rounded-full border border-slate-200 px-4 py-1.5 text-[0.8rem] font-bold text-slate-600 bg-white hover:bg-slate-50">
                            12/08/2024 <CalendarDays className="h-3.5 w-3.5 text-slate-600" strokeWidth={2} />
                          </button>
                        </div>

                        <button onClick={() => showActionMessage('Department filter menu opened.')} className="flex items-center justify-between w-[155px] rounded-full border border-slate-200 px-4 py-1.5 text-[0.8rem] font-bold text-slate-600 bg-white hover:bg-slate-50">
                          All Departments <ChevronDown className="h-3 w-3 text-slate-400" strokeWidth={3} />
                        </button>
                        <button onClick={() => showActionMessage('Report type filter menu opened.')} className="flex items-center justify-between w-28 rounded-full border border-slate-200 px-4 py-1.5 text-[0.8rem] font-bold text-slate-600 bg-white hover:bg-slate-50">
                          All Types <ChevronDown className="h-3 w-3 text-slate-400" strokeWidth={3} />
                        </button>

                        <button onClick={() => setSelectedReportId(null)} className="text-[0.8rem] font-bold text-slate-400 ml-2 hover:text-slate-600">
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto dashboard-scrollbar px-6 lg:px-8 pt-6 pb-12">

                    {/* Operational Reports */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[1.15rem] font-bold tracking-tight text-slate-900">Operational Reports</h3>
                        <p className="text-[0.82rem] font-medium text-slate-400">Performance metrics and operational insights</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* On-time Performance */}
                        <div
                          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => setSelectedReportId('on-time-performance')}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[1.05rem] font-bold text-slate-800">On-time Performance</h4>
                            <span className="text-[0.75rem] font-medium text-slate-400">Last 30 days</span>
                          </div>
                          {/* Chart Placeholder - Area Chart */}
                          <div className="h-[160px] mb-5 flex items-end px-2">
                            <svg viewBox="0 0 300 120" className="w-full h-full" preserveAspectRatio="none">
                              <defs>
                                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                                </linearGradient>
                              </defs>
                              <path d="M0,80 Q30,75 60,70 T120,55 T180,40 T240,35 T300,30 V120 H0 Z" fill="url(#areaFill)" />
                              <path d="M0,80 Q30,75 60,70 T120,55 T180,40 T240,35 T300,30" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                          </div>
                          {/* KPI Row */}
                          <div className="grid grid-cols-3 gap-3 mb-5 pt-4 border-t border-slate-100">
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#10b981]">94.2%</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Current Rate</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#10b981]">+2.1%</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">vs Last Month</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-slate-800">1,247</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Total Deliveries</p>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#ef4444] text-white text-[0.65rem] font-bold shadow-sm hover:bg-red-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('on-time-performance', 'pdf') }}>PDF</button>
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#22c55e] text-white text-[0.65rem] font-bold shadow-sm hover:bg-green-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('on-time-performance', 'csv') }}>CSV</button>
                            </div>
                            <button
                              className="text-[0.82rem] font-bold text-[#3b82f6] hover:underline"
                              onClick={(e) => { e.stopPropagation(); setSelectedReportId('on-time-performance'); }}
                            >
                              View Details
                            </button>
                          </div>
                          <button className="mt-3 text-[0.78rem] font-medium text-slate-400 hover:text-slate-600 transition w-full text-center" onClick={(e) => { e.stopPropagation(); handleToggleAiSummary('on-time-performance') }}>Toggle AI Summary</button>
                        </div>

                        {/* Delays by Lane */}
                        <div
                          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => setSelectedReportId('delays-by-lane')}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[1.05rem] font-bold text-slate-800">Delays by Lane</h4>
                            <span className="text-[0.75rem] font-medium text-slate-400">Last 30 days</span>
                          </div>
                          {/* Bar Chart with Y-axis */}
                          <div className="h-[180px] mb-5">
                            <svg viewBox="0 0 340 180" className="w-full h-full">
                              {/* Y-axis labels */}
                              <text x="18" y="18" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">35</text>
                              <text x="18" y="41" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">30</text>
                              <text x="18" y="64" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">25</text>
                              <text x="18" y="87" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">20</text>
                              <text x="18" y="110" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">15</text>
                              <text x="18" y="133" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">10</text>
                              <text x="18" y="153" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">5</text>
                              <text x="18" y="168" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">0</text>
                              {/* Grid lines */}
                              <line x1="28" y1="15" x2="330" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="38" x2="330" y2="38" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="61" x2="330" y2="61" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="84" x2="330" y2="84" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="107" x2="330" y2="107" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="130" x2="330" y2="130" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="150" x2="330" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="165" x2="330" y2="165" stroke="#e2e8f0" strokeWidth="1" />
                              {/* Bars */}
                              <rect x="45" y="28" width="42" height="137" rx="4" ry="4" fill="#f59e0b" />
                              <rect x="105" y="88" width="42" height="77" rx="4" ry="4" fill="#f59e0b" />
                              <rect x="165" y="113" width="42" height="52" rx="4" ry="4" fill="#f59e0b" />
                              <rect x="225" y="139" width="42" height="26" rx="4" ry="4" fill="#fbbf24" />
                              <rect x="285" y="148" width="42" height="17" rx="4" ry="4" fill="#fbbf24" />
                              {/* X-axis labels */}
                              <text x="66" y="178" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">Route 15</text>
                              <text x="126" y="178" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">Route 7</text>
                              <text x="186" y="178" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">Route 22</text>
                              <text x="246" y="178" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">Route 3</text>
                              <text x="306" y="178" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">Route 11</text>
                            </svg>
                          </div>
                          {/* KPI Row */}
                          <div className="grid grid-cols-3 gap-3 mb-5 pt-4 border-t border-slate-100">
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#3b82f6]">73</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Total Delays</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#f59e0b]">2.4h</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Avg Duration</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.05rem] font-black tracking-tight text-slate-800 leading-tight">Route<br />15</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Most Affected</p>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#ef4444] text-white text-[0.65rem] font-bold shadow-sm hover:bg-red-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('delays-by-lane', 'pdf') }}>PDF</button>
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#22c55e] text-white text-[0.65rem] font-bold shadow-sm hover:bg-green-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('delays-by-lane', 'csv') }}>CSV</button>
                            </div>
                            <button
                              className="text-[0.82rem] font-bold text-[#3b82f6] hover:underline"
                              onClick={(e) => { e.stopPropagation(); setSelectedReportId('delays-by-lane'); }}
                            >
                              View Details
                            </button>
                          </div>
                          <button className="mt-3 text-[0.78rem] font-medium text-slate-400 hover:text-slate-600 transition w-full text-center" onClick={(e) => { e.stopPropagation(); handleToggleAiSummary('delays-by-lane') }}>Toggle AI Summary</button>
                        </div>

                        {/* Driver Performance */}
                        <div
                          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => setSelectedReportId('driver-performance')}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[1.05rem] font-bold text-slate-800">Driver Performance</h4>
                            <span className="text-[0.75rem] font-medium text-[#10b981]">Last 30 days</span>
                          </div>
                          {/* Line Chart with Y-axis and grid */}
                          <div className="h-[180px] mb-5">
                            <svg viewBox="0 0 340 180" className="w-full h-full">
                              {/* Y-axis labels (0-5 scale) */}
                              <text x="14" y="18" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">5</text>
                              <text x="14" y="48" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">4</text>
                              <text x="14" y="78" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">3</text>
                              <text x="14" y="108" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">2</text>
                              <text x="14" y="138" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">1</text>
                              <text x="14" y="165" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">0</text>
                              {/* Horizontal grid lines */}
                              <line x1="24" y1="15" x2="330" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="24" y1="45" x2="330" y2="45" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="24" y1="75" x2="330" y2="75" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="24" y1="105" x2="330" y2="105" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="24" y1="135" x2="330" y2="135" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="24" y1="162" x2="330" y2="162" stroke="#e2e8f0" strokeWidth="1" />
                              {/* Green line at ~4.8 level */}
                              <path d="M55,22 L130,24 L205,22 L280,20 L330,19" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              {/* Blue dots */}
                              <circle cx="55" cy="22" r="5" fill="#3b82f6" />
                              <circle cx="130" cy="24" r="5" fill="#3b82f6" />
                              <circle cx="205" cy="22" r="5" fill="#3b82f6" />
                              <circle cx="280" cy="20" r="5" fill="#3b82f6" />
                              <circle cx="330" cy="19" r="5" fill="#3b82f6" />
                              {/* X-axis labels */}
                              <text x="55" y="178" fontSize="8.5" fill="#94a3b8" textAnchor="middle" fontWeight="500">Week 1</text>
                              <text x="145" y="178" fontSize="8.5" fill="#94a3b8" textAnchor="middle" fontWeight="500">Week 2</text>
                              <text x="225" y="178" fontSize="8.5" fill="#94a3b8" textAnchor="middle" fontWeight="500">Week 3</text>
                              <text x="310" y="178" fontSize="8.5" fill="#94a3b8" textAnchor="middle" fontWeight="500">Week 4</text>
                            </svg>
                          </div>
                          {/* KPI Row */}
                          <div className="grid grid-cols-3 gap-3 mb-5 pt-4 border-t border-slate-100">
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#3b82f6]">4.8</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Avg Rating</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#10b981]">96.7%</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Completion Rate</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-slate-800">42</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Active Drivers</p>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#ef4444] text-white text-[0.65rem] font-bold shadow-sm hover:bg-red-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('driver-performance', 'pdf') }}>PDF</button>
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#22c55e] text-white text-[0.65rem] font-bold shadow-sm hover:bg-green-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('driver-performance', 'csv') }}>CSV</button>
                            </div>
                            <button
                              className="text-[0.82rem] font-bold text-[#3b82f6] hover:underline"
                              onClick={(e) => { e.stopPropagation(); setSelectedReportId('driver-performance'); }}
                            >
                              View Details
                            </button>
                          </div>
                          <button className="mt-3 text-[0.78rem] font-medium text-slate-400 hover:text-slate-600 transition w-full text-center" onClick={(e) => { e.stopPropagation(); handleToggleAiSummary('driver-performance') }}>Toggle AI Summary</button>
                        </div>
                      </div>
                    </div>

                    {/* Financial Reports */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-[1.15rem] font-bold tracking-tight text-slate-900">Financial Reports</h3>
                        <p className="text-[0.82rem] font-medium text-slate-400">Revenue analysis and financial metrics</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Revenue Trends */}
                        <div
                          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => setSelectedReportId('revenue-trends')}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[1.05rem] font-bold text-slate-800">Revenue Trends</h4>
                            <span className="text-[0.75rem] font-medium text-slate-400">Last 6 months</span>
                          </div>
                          {/* Area Chart with Y-axis */}
                          <div className="h-[180px] mb-5">
                            <svg viewBox="0 0 340 180" className="w-full h-full">
                              {/* Y-axis labels */}
                              <text x="22" y="18" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">500</text>
                              <text x="22" y="48" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">400</text>
                              <text x="22" y="80" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">300</text>
                              <text x="22" y="112" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">200</text>
                              <text x="22" y="144" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">100</text>
                              <text x="22" y="168" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">0</text>
                              {/* Grid lines */}
                              <line x1="30" y1="15" x2="330" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="30" y1="45" x2="330" y2="45" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="30" y1="77" x2="330" y2="77" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="30" y1="109" x2="330" y2="109" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="30" y1="141" x2="330" y2="141" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="30" y1="165" x2="330" y2="165" stroke="#e2e8f0" strokeWidth="1" />
                              {/* Area fill */}
                              <defs>
                                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
                                </linearGradient>
                              </defs>
                              <path d="M55,55 L105,48 L160,45 L215,48 L270,42 L325,40 V165 H55 Z" fill="url(#revFill)" />
                              <path d="M55,55 L105,48 L160,45 L215,48 L270,42 L325,40" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                              {/* X-axis labels */}
                              <text x="55" y="178" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">Jul</text>
                              <text x="110" y="178" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">Aug</text>
                              <text x="165" y="178" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">Sep</text>
                              <text x="220" y="178" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">Oct</text>
                              <text x="275" y="178" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">Nov</text>
                              <text x="325" y="178" fontSize="8" fill="#94a3b8" textAnchor="middle" fontWeight="500">Dec</text>
                            </svg>
                          </div>
                          {/* KPI Row */}
                          <div className="grid grid-cols-3 gap-3 mb-5 pt-4 border-t border-slate-100">
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#10b981]">$2.4M</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Total Revenue</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#10b981]">+12.5%</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Growth Rate</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-slate-800">$425K</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">This Month</p>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#ef4444] text-white text-[0.65rem] font-bold shadow-sm hover:bg-red-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('revenue-trends', 'pdf') }}>PDF</button>
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#22c55e] text-white text-[0.65rem] font-bold shadow-sm hover:bg-green-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('revenue-trends', 'csv') }}>CSV</button>
                            </div>
                            <button
                              className="text-[0.82rem] font-bold text-[#3b82f6] hover:underline"
                              onClick={(e) => { e.stopPropagation(); setSelectedReportId('revenue-trends'); }}
                            >
                              View Details
                            </button>
                          </div>
                          <button className="mt-3 text-[0.78rem] font-medium text-slate-400 hover:text-slate-600 transition w-full text-center" onClick={(e) => { e.stopPropagation(); handleToggleAiSummary('revenue-trends') }}>Toggle AI Summary</button>
                        </div>

                        {/* Margin Analysis */}
                        <div
                          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => setSelectedReportId('margin-analysis')}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[1.05rem] font-bold text-slate-800">Margin Analysis</h4>
                            <span className="text-[0.75rem] font-medium text-slate-400">Last 3 months</span>
                          </div>
                          {/* Stacked Bar Chart with Y-axis */}
                          <div className="h-[180px] mb-5">
                            <svg viewBox="0 0 340 180" className="w-full h-full">
                              {/* Y-axis labels */}
                              <text x="18" y="18" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">35</text>
                              <text x="18" y="41" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">30</text>
                              <text x="18" y="64" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">25</text>
                              <text x="18" y="87" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">20</text>
                              <text x="18" y="110" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">15</text>
                              <text x="18" y="133" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">10</text>
                              <text x="18" y="153" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">5</text>
                              <text x="18" y="168" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">0</text>
                              {/* Grid lines */}
                              <line x1="28" y1="15" x2="330" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="38" x2="330" y2="38" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="61" x2="330" y2="61" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="84" x2="330" y2="84" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="107" x2="330" y2="107" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="130" x2="330" y2="130" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="150" x2="330" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="165" x2="330" y2="165" stroke="#e2e8f0" strokeWidth="1" />
                              {/* Stacked bars for Oct - ~29 total (blue bottom ~18, teal top ~11) */}
                              <rect x="55" y="80" width="60" height="85" rx="3" ry="3" fill="#3b82f6" />
                              <rect x="55" y="38" width="60" height="42" rx="3" ry="3" fill="#5eead4" />
                              {/* Stacked bars for Nov - ~30 total */}
                              <rect x="145" y="78" width="60" height="87" rx="3" ry="3" fill="#3b82f6" />
                              <rect x="145" y="35" width="60" height="43" rx="3" ry="3" fill="#5eead4" />
                              {/* Stacked bars for Dec - ~28 total */}
                              <rect x="235" y="82" width="60" height="83" rx="3" ry="3" fill="#3b82f6" />
                              <rect x="235" y="42" width="60" height="40" rx="3" ry="3" fill="#5eead4" />
                              {/* X-axis labels */}
                              <text x="85" y="178" fontSize="9" fill="#94a3b8" textAnchor="middle" fontWeight="500">Oct</text>
                              <text x="175" y="178" fontSize="9" fill="#94a3b8" textAnchor="middle" fontWeight="500">Nov</text>
                              <text x="265" y="178" fontSize="9" fill="#94a3b8" textAnchor="middle" fontWeight="500">Dec</text>
                            </svg>
                          </div>
                          {/* KPI Row */}
                          <div className="grid grid-cols-3 gap-3 mb-5 pt-4 border-t border-slate-100">
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#10b981]">18.2%</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Gross Margin</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#10b981]">12.7%</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Net Margin</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#10b981]">+1.3%</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">vs Last Quarter</p>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#ef4444] text-white text-[0.65rem] font-bold shadow-sm hover:bg-red-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('margin-analysis', 'pdf') }}>PDF</button>
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#22c55e] text-white text-[0.65rem] font-bold shadow-sm hover:bg-green-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('margin-analysis', 'csv') }}>CSV</button>
                            </div>
                            <button
                              className="text-[0.82rem] font-bold text-[#3b82f6] hover:underline"
                              onClick={(e) => { e.stopPropagation(); setSelectedReportId('margin-analysis'); }}
                            >
                              View Details
                            </button>
                          </div>
                          <button className="mt-3 text-[0.78rem] font-medium text-slate-400 hover:text-slate-600 transition w-full text-center" onClick={(e) => { e.stopPropagation(); handleToggleAiSummary('margin-analysis') }}>Toggle AI Summary</button>
                        </div>

                        {/* Accessorials */}
                        <div
                          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => setSelectedReportId('accessorials')}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[1.05rem] font-bold text-slate-800">Accessorials</h4>
                            <span className="text-[0.75rem] font-medium text-slate-400">Last 30 days</span>
                          </div>
                          {/* Vertical Bar Chart with Y-axis */}
                          <div className="h-[180px] mb-5">
                            <svg viewBox="0 0 340 180" className="w-full h-full">
                              {/* Y-axis labels */}
                              <text x="18" y="18" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">40</text>
                              <text x="18" y="55" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">30</text>
                              <text x="18" y="92" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">20</text>
                              <text x="18" y="130" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">10</text>
                              <text x="18" y="168" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">0</text>
                              {/* Grid lines */}
                              <line x1="28" y1="15" x2="330" y2="15" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="52" x2="330" y2="52" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="89" x2="330" y2="89" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="127" x2="330" y2="127" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="28" y1="165" x2="330" y2="165" stroke="#e2e8f0" strokeWidth="1" />
                              {/* Bars: Detention=38, Loading=22, Fuel=12, Other=25 */}
                              <rect x="45" y="22" width="50" height="143" rx="4" ry="4" fill="#f59e0b" />
                              <rect x="120" y="83" width="50" height="82" rx="4" ry="4" fill="#f59e0b" />
                              <rect x="195" y="120" width="50" height="45" rx="4" ry="4" fill="#f59e0b" />
                              <rect x="270" y="72" width="50" height="93" rx="4" ry="4" fill="#f59e0b" />
                              {/* X-axis labels */}
                              <text x="70" y="178" fontSize="7.5" fill="#94a3b8" textAnchor="middle" fontWeight="500">Detention</text>
                              <text x="145" y="178" fontSize="7.5" fill="#94a3b8" textAnchor="middle" fontWeight="500">Loading</text>
                              <text x="220" y="178" fontSize="7.5" fill="#94a3b8" textAnchor="middle" fontWeight="500">Fuel</text>
                              <text x="295" y="178" fontSize="7.5" fill="#94a3b8" textAnchor="middle" fontWeight="500">Other</text>
                            </svg>
                          </div>
                          {/* KPI Row */}
                          <div className="grid grid-cols-3 gap-3 mb-5 pt-4 border-t border-slate-100">
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#10b981]">$87.5K</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Total Revenue</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#10b981]">22.3%</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">of Total Revenue</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-slate-800">156</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Total Charges</p>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#ef4444] text-white text-[0.65rem] font-bold shadow-sm hover:bg-red-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('accessorials', 'pdf') }}>PDF</button>
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#22c55e] text-white text-[0.65rem] font-bold shadow-sm hover:bg-green-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('accessorials', 'csv') }}>CSV</button>
                            </div>
                            <button
                              className="text-[0.82rem] font-bold text-[#3b82f6] hover:underline"
                              onClick={(e) => { e.stopPropagation(); setSelectedReportId('accessorials'); }}
                            >
                              View Details
                            </button>
                          </div>
                          <button className="mt-3 text-[0.78rem] font-medium text-slate-400 hover:text-slate-600 transition w-full text-center" onClick={(e) => { e.stopPropagation(); handleToggleAiSummary('accessorials') }}>Toggle AI Summary</button>
                        </div>
                      </div>
                    </div>

                    {/* AR Aging */}
                    <div className="mb-10">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div
                          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                          onClick={() => setSelectedReportId('ar-aging')}
                        >
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-[1.05rem] font-bold text-slate-800">AR Aging</h4>
                            <span className="text-[0.75rem] font-medium text-slate-400">As of today</span>
                          </div>
                          {/* Horizontal stacked bar chart */}
                          <div className="h-[160px] mb-5">
                            <svg viewBox="0 0 340 160" className="w-full h-full">
                              {/* Y-axis labels */}
                              <text x="22" y="22" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">100</text>
                              <text x="22" y="52" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">80</text>
                              <text x="22" y="82" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">60</text>
                              <text x="22" y="112" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">40</text>
                              <text x="22" y="142" fontSize="9" fill="#94a3b8" textAnchor="end" fontWeight="500">20</text>
                              {/* Grid */}
                              <line x1="30" y1="19" x2="320" y2="19" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="30" y1="49" x2="320" y2="49" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="30" y1="79" x2="320" y2="79" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="30" y1="109" x2="320" y2="109" stroke="#f1f5f9" strokeWidth="1" />
                              <line x1="30" y1="139" x2="320" y2="139" stroke="#e2e8f0" strokeWidth="1" />
                              {/* Bars: Current=85, 1-30=60, 31-60=40, 61-90=25, 90+=15 */}
                              <rect x="40" y="34" width="42" height="105" rx="3" ry="3" fill="#10b981" />
                              <rect x="95" y="67" width="42" height="72" rx="3" ry="3" fill="#3b82f6" />
                              <rect x="150" y="91" width="42" height="48" rx="3" ry="3" fill="#f59e0b" />
                              <rect x="205" y="109" width="42" height="30" rx="3" ry="3" fill="#f97316" />
                              <rect x="260" y="121" width="42" height="18" rx="3" ry="3" fill="#ef4444" />
                              {/* X-axis labels */}
                              <text x="61" y="155" fontSize="7" fill="#94a3b8" textAnchor="middle" fontWeight="500">Current</text>
                              <text x="116" y="155" fontSize="7" fill="#94a3b8" textAnchor="middle" fontWeight="500">1-30</text>
                              <text x="171" y="155" fontSize="7" fill="#94a3b8" textAnchor="middle" fontWeight="500">31-60</text>
                              <text x="226" y="155" fontSize="7" fill="#94a3b8" textAnchor="middle" fontWeight="500">61-90</text>
                              <text x="281" y="155" fontSize="7" fill="#94a3b8" textAnchor="middle" fontWeight="500">90+</text>
                            </svg>
                          </div>
                          {/* KPI Row */}
                          <div className="grid grid-cols-3 gap-3 mb-5 pt-4 border-t border-slate-100">
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-slate-800">$485K</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Total AR</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#ef4444]">$72K</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Past Due</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[1.3rem] font-black tracking-tight text-[#10b981]">28 days</p>
                              <p className="text-[0.72rem] font-medium text-slate-400 mt-0.5">Avg DSO</p>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#ef4444] text-white text-[0.65rem] font-bold shadow-sm hover:bg-red-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('ar-aging', 'pdf') }}>PDF</button>
                              <button className="flex h-8 w-10 items-center justify-center rounded-lg bg-[#22c55e] text-white text-[0.65rem] font-bold shadow-sm hover:bg-green-600 transition" onClick={(e) => { e.stopPropagation(); handleReportExport('ar-aging', 'csv') }}>CSV</button>
                            </div>
                            <button
                              className="text-[0.82rem] font-bold text-[#3b82f6] hover:underline"
                              onClick={(e) => { e.stopPropagation(); setSelectedReportId('ar-aging'); }}
                            >
                              View Details
                            </button>
                          </div>
                          <button className="mt-3 text-[0.78rem] font-medium text-slate-400 hover:text-slate-600 transition w-full text-center" onClick={(e) => { e.stopPropagation(); handleToggleAiSummary('ar-aging') }}>Toggle AI Summary</button>
                        </div>
                      </div>
                    </div>

                    {/* Reports Detail Panel */}
                    {selectedReportId && (
                      <div
                        className="absolute inset-0 z-[100] flex items-center justify-end overflow-hidden"
                        onClick={() => setSelectedReportId(null)}
                      >
                        <div
                          className="h-full w-full max-w-[850px] bg-white shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.1)] relative flex flex-col animate-in slide-in-from-right duration-300 pointer-events-auto border-l border-slate-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Close Button & Header Actions */}
                          <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                            <h2 className="text-[1.1rem] font-bold text-slate-800 tracking-tight">On-time Performance - Detailed View</h2>
                            <div className="flex items-center gap-3">
                              <button onClick={() => handleReportExport(selectedReportId, 'pdf')} className="flex h-9 items-center gap-2 px-4 rounded-lg bg-[#cc4444] text-white text-[0.78rem] font-bold shadow-sm hover:bg-red-700 transition-all">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                PDF
                              </button>
                              <button onClick={() => handleReportExport(selectedReportId, 'csv')} className="flex h-9 items-center gap-2 px-4 rounded-lg bg-[#55b078] text-white text-[0.78rem] font-bold shadow-sm hover:bg-green-700 transition-all">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Excel
                              </button>
                              <button
                                className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all"
                                onClick={() => setSelectedReportId(null)}
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Content Scrollable */}
                          <div className="flex-1 overflow-y-auto px-10 py-8 dashboard-scrollbar bg-white">

                            {/* High-Fidelity SVG Chart Section */}
                            <div className="relative h-[280px] mb-8 mt-2 px-2">
                              <svg viewBox="0 0 800 300" className="w-full h-full" preserveAspectRatio="none">
                                {/* Horizontal Grid Lines & Y-Axis Labels */}
                                {[100, 99, 96, 93, 90, 87, 85].map((val, idx) => {
                                  const y = idx * 45 + 20;
                                  return (
                                    <g key={val}>
                                      <text x="20" y={y + 4} fontSize="12" fill="#94a3b8" textAnchor="end" fontWeight="600">{val}</text>
                                      <line x1="30" y1={y} x2="780" y2={y} stroke="#f1f5f9" strokeWidth="1" />
                                    </g>
                                  );
                                })}

                                {/* Area Fill */}
                                <defs>
                                  <linearGradient id="imageAreaFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.12" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
                                  </linearGradient>
                                </defs>
                                <path
                                  d="M40,210 Q160,190 280,200 T520,130 T760,110 V290 H40 Z"
                                  fill="url(#imageAreaFill)"
                                />

                                {/* Main Spline Curve */}
                                <path
                                  d="M40,210 Q160,190 280,200 T520,130 T760,110"
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="3.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />

                                {/* Data Points */}
                                <circle cx="40" cy="210" r="4.5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                                <circle cx="280" cy="200" r="4.5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                                <circle cx="520" cy="130" r="4.5" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
                                <circle cx="760" cy="110" r="5.5" fill="#3b82f6" stroke="#fff" strokeWidth="2.5" />
                                <line x1="760" y1="110" x2="760" y2="20" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />

                                {/* Tooltip Mock at Dec 6 */}
                                <foreignObject x="690" y="105" width="100" height="60">
                                  <div className="bg-white px-2 py-1.5 rounded-lg shadow-lg border border-slate-100 animate-in fade-in zoom-in duration-300 transform translate-y-3">
                                    <p className="text-[0.65rem] font-bold text-slate-400">Dec 6</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                                      <p className="text-[0.95rem] font-black text-slate-800 tracking-tight">94.2</p>
                                    </div>
                                  </div>
                                </foreignObject>
                              </svg>

                              {/* X-Axis Labels */}
                              <div className="flex justify-between px-[40px] mt-1 border-t border-slate-200 pt-2">
                                {['Nov 1', 'Nov 8', 'Nov 15', 'Nov 22', 'Nov 29', 'Dec 6'].map((date) => (
                                  <span key={date} className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-tight">{date}</span>
                                ))}
                              </div>
                            </div>

                            {/* KPI Metrics Row */}
                            <div className="grid grid-cols-4 gap-4 mb-10">
                              {[
                                { val: '94.2%', label: 'Performance Rate', color: 'text-blue-600' },
                                { val: '+2.1%', label: 'Monthly Change', color: 'text-emerald-500' },
                                { val: '1,247', label: 'Total Records', color: 'text-slate-800' },
                                { val: '73', label: 'Issues Found', color: 'text-amber-500' },
                              ].map((kpi, idx) => (
                                <div key={idx} className="bg-[#f8fafc]/50 rounded-2xl p-5 text-center border border-slate-100 flex flex-col items-center justify-center min-h-[100px]">
                                  <p className={`text-[1.3rem] font-black tracking-tighter ${kpi.color}`}>{kpi.val}</p>
                                  <p className="text-[0.68rem] font-bold text-slate-400 mt-1 uppercase tracking-wider">{kpi.label}</p>
                                </div>
                              ))}
                            </div>

                            {/* Detailed Data Section */}
                            <div className="mt-4">
                              <h3 className="text-[1.05rem] font-bold text-slate-800 mb-5 tracking-tight">Detailed Data</h3>
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="bg-[#f8fafc]/80 border-y border-slate-100">
                                    <th className="px-5 py-3 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                    <th className="px-5 py-3 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">Route</th>
                                    <th className="px-5 py-3 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">Driver</th>
                                    <th className="px-5 py-3 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                    <th className="px-5 py-3 text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">Perf %</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {[
                                    { date: 'Dec 8, 2024', route: 'Route 15', driver: 'Michael Rodriguez', status: 'On Time', perf: '98.5%' },
                                    { date: 'Dec 8, 2024', route: 'Route 7', driver: 'Jennifer Chen', status: 'Delayed', perf: '87.2%' },
                                    { date: 'Dec 7, 2024', route: 'Route 22', driver: 'David Thompson', status: 'On Time', perf: '95.8%' },
                                    { date: 'Dec 7, 2024', route: 'Route 3', driver: 'Robert Wilson', status: 'On Time', perf: '94.1%' },
                                    { date: 'Dec 6, 2024', route: 'Route 11', driver: 'Maria Santos', status: 'On Time', perf: '99.2%' },
                                  ].map((row, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50 transition-colors">
                                      <td className="px-5 py-4 text-[0.82rem] font-medium text-slate-500">{row.date}</td>
                                      <td className="px-5 py-4 text-[0.82rem] font-bold text-slate-600">{row.route}</td>
                                      <td className="px-5 py-4 text-[0.82rem] font-bold text-slate-900">{row.driver}</td>
                                      <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-[0.72rem] font-bold ${row.status === 'On Time' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                          }`}>
                                          {row.status}
                                        </span>
                                      </td>
                                      <td className="px-5 py-4 text-[0.85rem] font-black text-slate-800">{row.perf}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              );
            })() : (
              <section className="dashboard-scrollbar h-[calc(100vh-85px)] overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
                <div className="grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-700">{sidebarItems.find((item) => item.key === activeSection)?.label}</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">This section will be connected next. Dashboard and Orders/Loads are fully ready.</p>
                </div>
              </section>
            )}
          </main>
        </div>
        {actionMessage ? (
          <div className="pointer-events-none fixed bottom-6 right-6 z-[200] max-w-sm rounded-xl border border-blue-200 bg-blue-50/95 px-4 py-3 shadow-[0_18px_40px_-24px_rgba(37,99,235,0.7)] backdrop-blur">
            <p className="text-sm font-semibold text-blue-800">{actionMessage}</p>
          </div>
        ) : null}
      </div>
    </LoadScript>
  )
}

export default App
