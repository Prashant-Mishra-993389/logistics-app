import { useEffect, useMemo, useRef, useState, Fragment } from 'react'
import { GoogleMap, OverlayViewF, Polyline, useJsApiLoader } from '@react-google-maps/api'
import {
  AlertCircle,
  ArrowRight,
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

const toPhoneHref = (phoneNumber) => {
  return `tel:${String(phoneNumber ?? '').replace(/[^+\d]/g, '')}`
}

const buildGoogleDirectionsUrl = (origin, destination) => {
  const trimmedOrigin = String(origin ?? '').trim()
  const trimmedDestination = String(destination ?? '').trim()

  if (!trimmedOrigin || !trimmedDestination) {
    return 'https://www.google.com/maps'
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(trimmedOrigin)}&destination=${encodeURIComponent(trimmedDestination)}&travelmode=driving`
}

const DASHBOARD_DATE_FILTER_OPTIONS = ['Last 24 hours', 'Last 7 days', 'Last 30 days']

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

const fallbackData = {
  metrics: [
    {
      id: 'active-loads',
      label: "Today's Assigned Loads",
      value: '3',
      note: '1 in transit right now',
      icon: 'truck',
      iconTone: 'bg-blue-100 text-blue-600',
      noteTone: 'text-emerald-600',
    },
    {
      id: 'on-time',
      label: 'On-time Delivery Score',
      value: '96.4%',
      note: '+1.2% this week',
      icon: 'clock',
      iconTone: 'bg-emerald-100 text-emerald-600',
      noteTone: 'text-emerald-600',
    },
    {
      id: 'trucks-available',
      label: 'HOS Available',
      value: '7h 20m',
      note: 'before mandatory break',
      icon: 'fleet',
      iconTone: 'bg-violet-100 text-violet-600',
      noteTone: 'text-slate-500',
    },
    {
      id: 'exceptions',
      label: 'Route Alerts',
      value: '2',
      note: 'traffic and weather',
      icon: 'alert',
      iconTone: 'bg-rose-100 text-rose-600',
      noteTone: 'text-rose-500',
    },
    {
      id: 'fuel-cost',
      label: 'Fuel Spend (This Week)',
      value: '$428',
      note: '-6% vs last week',
      icon: 'fuel',
      iconTone: 'bg-amber-100 text-amber-600',
      noteTone: 'text-rose-500',
    },
    {
      id: 'revenue',
      label: 'Driver Earnings (This Week)',
      value: '$2,180',
      note: '+$340 vs last week',
      icon: 'revenue',
      iconTone: 'bg-emerald-100 text-emerald-600',
      noteTone: 'text-emerald-600',
    },
  ],
  // vehicles: [
  //   { id: 'FL-4892', lat: 32.7795, lng: -96.7972, status: 'on-time' },
  //   { id: 'TX-7841', lat: 35.4678, lng: -97.5138, status: 'on-time' },
  //   { id: 'NY-1847', lat: 32.95, lng: -94.73, status: 'delayed' },
  //   { id: 'IL-5629', lat: 31.81, lng: -99.31, status: 'critical' },
  //   { id: 'CA-3952', lat: 30.92, lng: -95.85, status: 'critical' },
  //   { id: 'GA-9273', lat: 34.1, lng: -84.43, status: 'on-time' },
  // ],
  dispatches: [
    {
      id: 'LOAD-FF-1002',
      route: 'Newark - Columbus',
      driver: 'Alex Rivera',
      status: 'In Transit',
      pickupDate: '09 Apr, 2026',
      pickupTime: '08:15 AM',
      deliveryDate: '09 Apr, 2026',
      deliveryTime: '04:30 PM',
      price: '$1,240',
      truck: 'FF-902',
      customer: 'Walmart Distribution',
      loadType: 'Refrigerated',
      priority: 'High',
      notes: 'Dock 12 check-in. Keep reefer between -18C and -20C.',
    },
  ],
  // orders: [
  //   {
  //     id: 'LD-2024-001847',
  //     customerName: 'Walmart Distribution',
  //     customerType: 'Enterprise Customer',
  //     customerCode: 'WM',
  //     customerTone: 'bg-blue-600',
  //     origin: 'Chicago, IL',
  //     destination: 'Atlanta, GA',
  //     eta: 'Feb 8, 14:30',
  //     status: 'In Transit',
  //     priority: 'High',
  //     driver: 'Mike Rodriguez',
  //     truck: 'FL-4892',
  //     rate: '$2,850',
  //     margin: '18.5%',
  //     pod: true,
  //   },
  //   {
  //     id: 'LD-2024-001848',
  //     customerName: 'Target Corporation',
  //     customerType: 'Premium Customer',
  //     customerCode: 'TG',
  //     customerTone: 'bg-rose-600',
  //     origin: 'Dallas, TX',
  //     destination: 'Phoenix, AZ',
  //     eta: 'Feb 9, 09:15',
  //     status: 'Assigned',
  //     priority: 'Medium',
  //     driver: 'Jennifer Chen',
  //     truck: 'TX-7841',
  //     rate: '$1,950',
  //     margin: '22.1%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001849',
  //     customerName: 'Amazon Logistics',
  //     customerType: 'High Volume',
  //     customerCode: 'AM',
  //     customerTone: 'bg-orange-500',
  //     origin: 'Los Angeles, CA',
  //     destination: 'Seattle, WA',
  //     eta: 'Feb 8, 22:45',
  //     status: 'Loading',
  //     priority: 'High',
  //     driver: 'David Thompson',
  //     truck: 'CA-3952',
  //     rate: '$3,200',
  //     margin: '15.8%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001850',
  //     customerName: 'FedEx Ground',
  //     customerType: 'Express Service',
  //     customerCode: 'FX',
  //     customerTone: 'bg-violet-600',
  //     origin: 'Miami, FL',
  //     destination: 'Jacksonville, FL',
  //     eta: 'Feb 7, 16:20',
  //     status: 'Delivered',
  //     priority: 'Low',
  //     driver: 'Maria Santos',
  //     truck: 'FL-2847',
  //     rate: '$850',
  //     margin: '28.2%',
  //     pod: true,
  //   },
  //   {
  //     id: 'LD-2024-001851',
  //     customerName: 'Home Essentials Supply',
  //     customerType: 'Regular Customer',
  //     customerCode: 'HD',
  //     customerTone: 'bg-teal-600',
  //     origin: 'Houston, TX',
  //     destination: 'New Orleans, LA',
  //     eta: 'Feb 9, 11:00',
  //     status: 'Unassigned',
  //     priority: 'Medium',
  //     driver: 'Not assigned',
  //     truck: '-',
  //     rate: '$1,450',
  //     margin: '19.3%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001852',
  //     customerName: 'Costco Wholesale',
  //     customerType: 'Bulk Orders',
  //     customerCode: 'CS',
  //     customerTone: 'bg-indigo-600',
  //     origin: 'Denver, CO',
  //     destination: 'Kansas City, MO',
  //     eta: 'Feb 8, 19:30',
  //     status: 'In Transit',
  //     priority: 'High',
  //     driver: 'Lisa Anderson',
  //     truck: 'CO-5629',
  //     rate: '$2,100',
  //     margin: '21.4%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001853',
  //     customerName: 'Safeway Distribution',
  //     customerType: 'Food & Beverage',
  //     customerCode: 'SF',
  //     customerTone: 'bg-green-600',
  //     origin: 'Portland, OR',
  //     destination: 'San Francisco, CA',
  //     eta: 'Feb 9, 07:45',
  //     status: 'Assigned',
  //     priority: 'Medium',
  //     driver: 'James Martinez',
  //     truck: 'OR-9273',
  //     rate: '$1,750',
  //     margin: '17.1%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001854',
  //     customerName: 'Kroger Supply Chain',
  //     customerType: 'Grocery Distribution',
  //     customerCode: 'KR',
  //     customerTone: 'bg-pink-600',
  //     origin: 'Nashville, TN',
  //     destination: 'Memphis, TN',
  //     eta: 'Feb 8, 15:20',
  //     status: 'Loading',
  //     priority: 'Low',
  //     driver: 'Amanda Taylor',
  //     truck: 'TN-4851',
  //     rate: '$980',
  //     margin: '25.5%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001855',
  //     customerName: 'Best Buy Logistics',
  //     customerType: 'Retail Electronics',
  //     customerCode: 'BB',
  //     customerTone: 'bg-sky-600',
  //     origin: 'Minneapolis, MN',
  //     destination: 'Omaha, NE',
  //     eta: 'Feb 10, 08:40',
  //     status: 'Assigned',
  //     priority: 'Medium',
  //     driver: 'Eric Matthews',
  //     truck: 'MN-7712',
  //     rate: '$1,640',
  //     margin: '18.9%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001856',
  //     customerName: 'CVS Distribution',
  //     customerType: 'Pharma Supplies',
  //     customerCode: 'CV',
  //     customerTone: 'bg-red-600',
  //     origin: 'Columbus, OH',
  //     destination: 'Detroit, MI',
  //     eta: 'Feb 10, 12:15',
  //     status: 'In Transit',
  //     priority: 'High',
  //     driver: 'Thomas Reed',
  //     truck: 'OH-3345',
  //     rate: '$1,980',
  //     margin: '20.4%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001857',
  //     customerName: 'IKEA Fulfillment',
  //     customerType: 'Furniture Cargo',
  //     customerCode: 'IK',
  //     customerTone: 'bg-yellow-600',
  //     origin: 'Baltimore, MD',
  //     destination: 'Richmond, VA',
  //     eta: 'Feb 10, 17:05',
  //     status: 'Loading',
  //     priority: 'Low',
  //     driver: 'Daniel Clark',
  //     truck: 'MD-6621',
  //     rate: '$1,120',
  //     margin: '23.2%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001858',
  //     customerName: 'PepsiCo Freight',
  //     customerType: 'Beverage Fleet',
  //     customerCode: 'PP',
  //     customerTone: 'bg-cyan-600',
  //     origin: 'St. Louis, MO',
  //     destination: 'Indianapolis, IN',
  //     eta: 'Feb 10, 19:45',
  //     status: 'In Transit',
  //     priority: 'High',
  //     driver: 'Rachel Moore',
  //     truck: 'MO-9204',
  //     rate: '$2,250',
  //     margin: '19.8%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001859',
  //     customerName: 'Lowe\'s Supply',
  //     customerType: 'Home Improvement',
  //     customerCode: 'LW',
  //     customerTone: 'bg-blue-700',
  //     origin: 'Charlotte, NC',
  //     destination: 'Birmingham, AL',
  //     eta: 'Feb 11, 06:20',
  //     status: 'Assigned',
  //     priority: 'Medium',
  //     driver: 'Nathan Hill',
  //     truck: 'NC-4019',
  //     rate: '$1,730',
  //     margin: '18.1%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001860',
  //     customerName: '7-Eleven Network',
  //     customerType: 'Store Replenishment',
  //     customerCode: 'SE',
  //     customerTone: 'bg-emerald-700',
  //     origin: 'Las Vegas, NV',
  //     destination: 'Salt Lake City, UT',
  //     eta: 'Feb 11, 09:35',
  //     status: 'Unassigned',
  //     priority: 'Low',
  //     driver: 'Not assigned',
  //     truck: '-',
  //     rate: '$1,410',
  //     margin: '16.5%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001861',
  //     customerName: 'Whole Foods Market',
  //     customerType: 'Fresh Goods',
  //     customerCode: 'WF',
  //     customerTone: 'bg-green-700',
  //     origin: 'Sacramento, CA',
  //     destination: 'Reno, NV',
  //     eta: 'Feb 11, 13:10',
  //     status: 'Delivered',
  //     priority: 'Medium',
  //     driver: 'Olivia Parker',
  //     truck: 'CA-7708',
  //     rate: '$980',
  //     margin: '27.6%',
  //     pod: true,
  //   },
  //   {
  //     id: 'LD-2024-001862',
  //     customerName: 'Sysco Logistics',
  //     customerType: 'Foodservice Bulk',
  //     customerCode: 'SY',
  //     customerTone: 'bg-slate-700',
  //     origin: 'Tulsa, OK',
  //     destination: 'Little Rock, AR',
  //     eta: 'Feb 11, 18:25',
  //     status: 'In Transit',
  //     priority: 'High',
  //     driver: 'Brian Scott',
  //     truck: 'OK-5526',
  //     rate: '$1,860',
  //     margin: '20.7%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001863',
  //     customerName: 'Wayfair Network',
  //     customerType: 'Furniture Retail',
  //     customerCode: 'WY',
  //     customerTone: 'bg-violet-700',
  //     origin: 'Cleveland, OH',
  //     destination: 'Buffalo, NY',
  //     eta: 'Feb 12, 07:50',
  //     status: 'Loading',
  //     priority: 'Medium',
  //     driver: 'Sophia Perez',
  //     truck: 'OH-8870',
  //     rate: '$1,520',
  //     margin: '17.8%',
  //     pod: false,
  //   },
  //   {
  //     id: 'LD-2024-001864',
  //     customerName: 'Nike Distribution',
  //     customerType: 'Apparel Express',
  //     customerCode: 'NK',
  //     customerTone: 'bg-gray-800',
  //     origin: 'Portland, OR',
  //     destination: 'Boise, ID',
  //     eta: 'Feb 12, 10:15',
  //     status: 'Assigned',
  //     priority: 'High',
  //     driver: 'Kevin Adams',
  //     truck: 'OR-3921',
  //     rate: '$1,690',
  //     margin: '19.5%',
  //     pod: false,
  //   },
  // ],
  podWorkflowRecords: [
    {
      id: 'LOAD-2026-2209',
      route: 'San Antonio, TX -> Austin, TX',
      customerName: 'TechHub Retail DC',
      destinationAddress: 'Dock 7, 8450 Metric Blvd, Austin, TX',
      deliveredAt: '2026-04-13T09:40:00',
      submittedAt: '2026-04-13T09:52:00',
      reviewedAt: null,
      status: 'Pending',
      payoutState: 'On hold until approval',
      reviewNote: 'Shipment photos and POD letter uploaded. Awaiting ops review.',
      rejectionReason: '',
      shipmentPhotos: [
        {
          id: 'ship-2209-1',
          label: 'Rear door seal at destination',
          imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-04-13T09:43:00',
        },
        {
          id: 'ship-2209-2',
          label: 'Unloaded pallets at dock',
          imageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-04-13T09:45:00',
        },
      ],
      podLetterPhotos: [
        {
          id: 'pod-2209-1',
          label: 'Signed POD letter',
          imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-04-13T09:49:00',
        },
      ],
    },
    {
      id: 'LOAD-2026-2194',
      route: 'Houston, TX -> Baton Rouge, LA',
      customerName: 'Gulf Manufacturing',
      destinationAddress: 'Bay 2, 519 Port Allen Rd, Baton Rouge, LA',
      deliveredAt: '2026-04-09T15:20:00',
      submittedAt: '2026-04-09T15:33:00',
      reviewedAt: '2026-04-09T16:10:00',
      status: 'Rejected',
      payoutState: 'On hold - re-upload required',
      reviewNote: 'Ops rejected this POD. Please re-upload a clearer signed POD letter.',
      rejectionReason: 'Receiver signature and stamp are not readable.',
      shipmentPhotos: [
        {
          id: 'ship-2194-1',
          label: 'Shipment before unload',
          imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-04-09T15:26:00',
        },
      ],
      podLetterPhotos: [
        {
          id: 'pod-2194-1',
          label: 'Initial POD submission',
          imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-04-09T15:31:00',
        },
      ],
    },
    {
      id: 'LOAD-2026-2181',
      route: 'Dallas, TX -> Oklahoma City, OK',
      customerName: 'Central Auto Parts',
      destinationAddress: 'Door 18, 3900 Trade Center Dr, Oklahoma City, OK',
      deliveredAt: '2026-04-03T11:05:00',
      submittedAt: '2026-04-03T11:18:00',
      reviewedAt: '2026-04-03T12:02:00',
      status: 'Accepted',
      payoutState: 'Released',
      reviewNote: 'Accepted. Perfect delivery evidence and signed POD received.',
      rejectionReason: '',
      shipmentPhotos: [
        {
          id: 'ship-2181-1',
          label: 'Dockside unload complete',
          imageUrl: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-04-03T11:09:00',
        },
      ],
      podLetterPhotos: [
        {
          id: 'pod-2181-1',
          label: 'Signed POD with stamp',
          imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-04-03T11:14:00',
        },
      ],
    },
    {
      id: 'LOAD-2026-2138',
      route: 'Nashville, TN -> Memphis, TN',
      customerName: 'Delta Grocers',
      destinationAddress: 'Cold Dock C, 771 Union Ave, Memphis, TN',
      deliveredAt: '2026-03-24T08:32:00',
      submittedAt: '2026-03-24T08:45:00',
      reviewedAt: '2026-03-24T09:12:00',
      status: 'Accepted',
      payoutState: 'Released',
      reviewNote: 'Accepted within SLA.',
      rejectionReason: '',
      shipmentPhotos: [
        {
          id: 'ship-2138-1',
          label: 'Receiving dock handoff',
          imageUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-03-24T08:37:00',
        },
      ],
      podLetterPhotos: [
        {
          id: 'pod-2138-1',
          label: 'POD letter signed by receiver',
          imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-03-24T08:40:00',
        },
      ],
    },
    {
      id: 'LOAD-2026-2097',
      route: 'Phoenix, AZ -> Las Vegas, NV',
      customerName: 'Westline Consumer Goods',
      destinationAddress: 'Dock 11, 2240 Logistics Ln, Las Vegas, NV',
      deliveredAt: '2026-03-11T18:10:00',
      submittedAt: '2026-03-11T18:23:00',
      reviewedAt: null,
      status: 'Pending',
      payoutState: 'On hold until approval',
      reviewNote: 'Waiting for quality review.',
      rejectionReason: '',
      shipmentPhotos: [
        {
          id: 'ship-2097-1',
          label: 'Pallet stack after unload',
          imageUrl: 'https://images.unsplash.com/photo-1532614338840-ab30cf10ed36?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-03-11T18:15:00',
        },
      ],
      podLetterPhotos: [
        {
          id: 'pod-2097-1',
          label: 'Signed POD page 1',
          imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-03-11T18:19:00',
        },
      ],
    },
    {
      id: 'LOAD-2026-2024',
      route: 'Chicago, IL -> Milwaukee, WI',
      customerName: 'NorthStar Appliances',
      destinationAddress: 'Bay 5, 61 Harbor Dr, Milwaukee, WI',
      deliveredAt: '2026-02-21T13:02:00',
      submittedAt: '2026-02-21T13:20:00',
      reviewedAt: '2026-02-21T14:01:00',
      status: 'Accepted',
      payoutState: 'Released',
      reviewNote: 'Accepted. Complete POD packet.',
      rejectionReason: '',
      shipmentPhotos: [
        {
          id: 'ship-2024-1',
          label: 'Receiver dock confirmation',
          imageUrl: 'https://images.unsplash.com/photo-1529074963764-98f45c47344b?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-02-21T13:07:00',
        },
      ],
      podLetterPhotos: [
        {
          id: 'pod-2024-1',
          label: 'Stamped POD letter',
          imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop',
          uploadedAt: '2026-02-21T13:12:00',
        },
      ],
    },
  ],
  walletStats: [
    { id: 'total-earnings', label: 'Total Earnings', value: '$14,280.50', note: 'Current month performance', icon: 'Wallet', iconTone: 'bg-blue-100 text-blue-700', bgScale: 'bg-blue-50 border-blue-100', textTone: 'text-blue-700' },
    { id: 'pending-payments', label: 'Pending Payments', value: '$3,580.00', note: '3 loads pending settlement', icon: 'Clock3', iconTone: 'bg-amber-100 text-amber-700', bgScale: 'bg-amber-50 border-amber-100', textTone: 'text-amber-700', progress: '65%' },
    { id: 'lifetime-bonus', label: 'Lifetime Bonus', value: '$2,840.00', note: 'Safety and punctuality rewards', icon: 'Star', iconTone: 'bg-violet-100 text-violet-700', bgScale: 'bg-violet-50 border-violet-100', textTone: 'text-violet-700' },
  ],
  paymentHistory: [
    { id: 'LD-882190', route: 'Chicago -> St. Louis', date: 'Aug 14, 2023', status: 'Paid', baseRate: '$1,200.00', bonusAmount: '+$150.00', bonusLabel: 'On-time bonus', deductionAmount: '$0.00', deductionLabel: '-', netEarning: '$1,350.00', payoutDate: 'Aug 16, 2023' },
    { id: 'LD-882205', route: 'Denver -> Salt Lake City', date: 'Aug 16, 2023', status: 'Paid', baseRate: '$2,450.00', bonusAmount: '$0.00', bonusLabel: '-', deductionAmount: '-$120.00', deductionLabel: '2h delay (weather)', netEarning: '$2,330.00', payoutDate: 'Aug 18, 2023' },
    { id: 'LD-882241', route: 'Seattle -> Portland', date: 'Aug 19, 2023', status: 'Pending', baseRate: '$950.00', bonusAmount: '+$100.00', bonusLabel: 'Safety reward', deductionAmount: '$0.00', deductionLabel: '-', netEarning: '$1,050.00', payoutDate: 'Awaiting settlement' },
    { id: 'LD-882267', route: 'Austin -> Dallas', date: 'Aug 22, 2023', status: 'Paid', baseRate: '$780.00', bonusAmount: '+$50.00', bonusLabel: 'Early drop-off', deductionAmount: '$0.00', deductionLabel: '-', netEarning: '$830.00', payoutDate: 'Aug 23, 2023' },
    { id: 'LD-882274', route: 'Phoenix -> Las Vegas', date: 'Aug 23, 2023', status: 'Pending', baseRate: '$1,320.00', bonusAmount: '$0.00', bonusLabel: '-', deductionAmount: '-$40.00', deductionLabel: 'Toll adjustment', netEarning: '$1,280.00', payoutDate: 'Awaiting POD verification' },
    { id: 'LD-882299', route: 'Nashville -> Memphis', date: 'Aug 25, 2023', status: 'Paid', baseRate: '$1,040.00', bonusAmount: '+$80.00', bonusLabel: 'Fuel efficient score', deductionAmount: '$0.00', deductionLabel: '-', netEarning: '$1,120.00', payoutDate: 'Aug 27, 2023' },
    { id: 'LD-882320', route: 'Atlanta -> Charlotte', date: 'Aug 27, 2023', status: 'Pending', baseRate: '$1,180.00', bonusAmount: '+$70.00', bonusLabel: 'Weekend lane bonus', deductionAmount: '$0.00', deductionLabel: '-', netEarning: '$1,250.00', payoutDate: 'Scheduled for Aug 30, 2023' },
  ],
  payoutMethods: [
    { id: 'visa-9012', type: 'VISA', masked: '**** 9012', label: 'Primary Checking', status: 'Active' },
    { id: 'ach-1847', type: 'ACH', masked: '**** 1847', label: 'Fleet ACH', status: 'Active' },
  ],
}

const sidebarItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'orders', label: 'My Loads', icon: ClipboardList },
  { key: 'drivers', label: 'Live Bids', icon: UserRound },
  { key: 'routes', label: 'Shipment Routes', icon: Route },
  { key: 'pod', label: 'Proof of Delivery', icon: FileCheck2 },
  { key: 'wallet', label: 'Wallet', icon: Wallet },
  { key: 'settings', label: 'Settings', icon: Settings },
]

const mapCenter = { lat: 33.15, lng: -96.45 }

const defaultDashboardRoutePath = [
  { lat: 33.35, lng: -97.9 },
  { lat: 33.1, lng: -96.9 },
  { lat: 32.95, lng: -95.92 },
  { lat: 33.08, lng: -94.9 },
]

const dispatchStatusStyles = {
  'In Transit': 'bg-emerald-50 text-emerald-700',
  Assigned: 'bg-blue-50 text-blue-700',
  Loading: 'bg-amber-50 text-amber-700',
  Delivered: 'bg-violet-50 text-violet-700',
  Unassigned: 'bg-slate-100 text-slate-700',
}

const planningStatusStyles = {
  'In Transit': 'bg-emerald-100 text-emerald-700',
  Assigned: 'bg-blue-100 text-blue-700',
  Planning: 'bg-amber-100 text-amber-700',
  Scheduled: 'bg-slate-100 text-slate-700',
  'Home Time Approved': 'bg-blue-100 text-blue-700',
  'Home Time': 'bg-violet-100 text-violet-700',
}

const metricIcons = {
  truck: Truck,
  clock: Clock3,
  fleet: Truck,
  alert: Bell,
  fuel: Gauge,
  revenue: DollarSign,
}

const roadReportCategoryOptions = [
  'Traffic Alert',
  'Rest Stop Tip',
  'Weather Update',
  'Safety Notice',
  'General Update',
]

const roadReportCategoryStyles = {
  'Traffic Alert': 'bg-amber-100 text-amber-700',
  'Rest Stop Tip': 'bg-emerald-100 text-emerald-700',
  'Weather Update': 'bg-blue-100 text-blue-700',
  'Safety Notice': 'bg-rose-100 text-rose-700',
  'General Update': 'bg-slate-100 text-slate-700',
}

const initialRoadCommunityReports = [
  {
    id: 'road-marco-polo',
    driverName: 'Marco Polo',
    avatarUrl: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=120&h=120&fit=crop',
    postedAt: '12 min ago',
    category: 'Traffic Alert',
    location: 'I-80 W near Exit 142',
    message: 'Heavy backup on I-80 W near Exit 142 due to construction. Adding roughly 20 minutes.',
    confirmations: 14,
    comments: 2,
    helpful: 6,
  },
  {
    id: 'road-dave-longhaul',
    driverName: 'Dave LongHaul',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
    postedAt: '1 hour ago',
    category: 'Rest Stop Tip',
    location: 'Mile 142 Service Plaza',
    message: 'Best rest stop this week at Mile 142. Clean parking and fast service.',
    confirmations: 8,
    comments: 1,
    helpful: 28,
  },
]

const parseNumericValue = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCurrencyValue = (value) => {
  if (!Number.isFinite(value) || value <= 0) {
    return '--'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

const formatHoursAndMinutes = (hoursValue) => {
  if (!Number.isFinite(hoursValue) || hoursValue <= 0) {
    return '0h 00m'
  }

  const totalMinutes = Math.round(hoursValue * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

const formatCountdownClock = (totalSeconds) => {
  const safeSeconds = Math.max(0, Math.round(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const formatPortalTimestamp = (timestamp) => {
  if (!Number.isFinite(timestamp)) {
    return '--'
  }

  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

const calculateDistanceMiles = (fromPoint, toPoint) => {
  if (!fromPoint || !toPoint) {
    return 0
  }

  const lat1 = Number(fromPoint.lat)
  const lon1 = Number(fromPoint.lng)
  const lat2 = Number(toPoint.lat)
  const lon2 = Number(toPoint.lng)

  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) {
    return 0
  }

  const earthRadiusMiles = 3958.8
  const toRad = (deg) => (deg * Math.PI) / 180
  const deltaLat = toRad(lat2 - lat1)
  const deltaLon = toRad(lon2 - lon1)
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusMiles * c
}

const buildPortalBidSchedule = (seedTimestamp, index) => {
  const safeSeed = Number.isFinite(seedTimestamp) ? seedTimestamp : Date.now()

  // Sample timeline: first panel auto-opens in ~10s (window starts at ~20s), then stagger upcoming windows.
  const startOffsetSeconds = 20 + (index * 35)
  const biddingStartAt = safeSeed + (startOffsetSeconds * 1000)
  const biddingEndAt = biddingStartAt + (2 * 60 * 1000)
  const portalPublishedAt = safeSeed

  return {
    portalPublishedAt,
    biddingStartAt,
    biddingEndAt,
  }
}

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

const equipmentPayloadCapacities = {
  'Box Truck': 14000,
  'Dry Van': 44000,
  Refrigerated: 42000,
  Reefer: 42000,
  Flatbed: 48000,
  'Dry Goods': 42000,
}

const getEquipmentCapacityLbs = (equipment) => equipmentPayloadCapacities[equipment] ?? 36000

const buildLoadPhoto = (title, accentColor) => {
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 560 320'>
      <defs>
        <linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='${accentColor}' />
          <stop offset='100%' stop-color='#0f172a' />
        </linearGradient>
      </defs>
      <rect width='560' height='320' fill='url(#bg)' />
      <rect x='24' y='24' width='512' height='272' rx='16' fill='rgba(255,255,255,0.12)' stroke='rgba(255,255,255,0.35)' />
      <text x='42' y='172' fill='white' font-size='28' font-family='Arial, sans-serif' font-weight='700'>${title}</text>
    </svg>
  `

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const DRIVER_SETTINGS_STORAGE_KEY = 'driver-dashboard-driver-settings'

const DRIVER_SETTINGS_DEFAULTS = {
  fullName: 'Alex Rivera',
  phone: '+1 (555) 342-7710',
  email: 'alex.rivera@fleetflow.com',
  emergencyContactName: 'Mia Rivera',
  emergencyContactPhone: '+1 (555) 611-9042',
  homeTerminal: 'Newark, NJ',
  readyForDispatch: true,
  allowWeekendLoads: false,
  allowNightDriving: false,
  preferredLoadType: 'Dry Van',
  preferredRegions: 'Northeast, Midwest',
  maxDailyMiles: 550,
  hosAlertMinutes: 45,
  speedLimitAlertMph: 70,
  preTripReminder: true,
  maintenanceReminder: true,
  podReminder: true,
  payoutMethod: 'ACH ****1847',
  fastPayout: false,
  statementFrequency: 'Weekly',
  inAppNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  shareLiveLocation: true,
  shareDrivingTelemetry: true,
  mapTheme: 'Standard',
  appFontScale: 'Medium',
}

const DRIVER_PROFILE_FIELDS = [
  'fullName',
  'phone',
  'email',
  'homeTerminal',
  'emergencyContactName',
  'emergencyContactPhone',
]

const DRIVER_AVAILABILITY_FIELDS = [
  'readyForDispatch',
  'allowWeekendLoads',
  'allowNightDriving',
  'preferredLoadType',
  'preferredRegions',
  'maxDailyMiles',
]

const DRIVER_SAFETY_FIELDS = [
  'hosAlertMinutes',
  'speedLimitAlertMph',
  'preTripReminder',
  'maintenanceReminder',
  'podReminder',
]

const DRIVER_PAYOUT_FIELDS = [
  'payoutMethod',
  'fastPayout',
  'statementFrequency',
  'inAppNotifications',
  'emailNotifications',
  'smsNotifications',
  'shareLiveLocation',
  'shareDrivingTelemetry',
  'mapTheme',
  'appFontScale',
]

const pickDriverSettingsSubset = (sourceSettings, fields) => {
  return fields.reduce((accumulator, field) => {
    accumulator[field] = sourceSettings?.[field] ?? DRIVER_SETTINGS_DEFAULTS[field]
    return accumulator
  }, {})
}

const pickDriverProfileSettings = (sourceSettings) => pickDriverSettingsSubset(sourceSettings, DRIVER_PROFILE_FIELDS)

function App() {
  const [dashboardData, setDashboardData] = useState(fallbackData)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardRoutePath, setDashboardRoutePath] = useState(defaultDashboardRoutePath)
  const [dashboardRouteBounds, setDashboardRouteBounds] = useState(null)
  const [dashboardRouteMeta, setDashboardRouteMeta] = useState({ distance: '--', duration: '--' })
  const [dashboardRouteViewMode, setDashboardRouteViewMode] = useState('map')
  const [dashboardDateFilterIndex, setDashboardDateFilterIndex] = useState(1)
  const [dashboardLocationFilterIndex, setDashboardLocationFilterIndex] = useState(0)
  const [isRouteLoading, setIsRouteLoading] = useState(false)
  const [selectedWeeklyPlanId, setSelectedWeeklyPlanId] = useState(null)
  const [selectedBidId, setSelectedBidId] = useState(null)
  const [bidSearchQuery, setBidSearchQuery] = useState('')
  const [bidFilters, setBidFilters] = useState({
    type: 'All Types',
    urgency: 'All Urgency',
    equipment: 'All Equipment',
    region: 'All Regions',
  })
  const [watchedBidIds, setWatchedBidIds] = useState([])
  const [manualBids, setManualBids] = useState([])
  const [portalBidSeedTime] = useState(() => Date.now())
  const [autoClosedBidIds, setAutoClosedBidIds] = useState([])
  const [isBidDetailsPanelOpen, setIsBidDetailsPanelOpen] = useState(false)
  const [bidDetailsTab, setBidDetailsTab] = useState('Overview')
  const [personalBidDraftById, setPersonalBidDraftById] = useState({})
  const [manualAuctionByBidId, setManualAuctionByBidId] = useState({})
  const [manualAuctionNow, setManualAuctionNow] = useState(() => Date.now())
  const [bidActionMessage, setBidActionMessage] = useState('')
  const [lastImportedBidSheet, setLastImportedBidSheet] = useState('')

  const [selectedRouteId, setSelectedRouteId] = useState(null)
  const [podWorkflowRecords, setPodWorkflowRecords] = useState(() => fallbackData.podWorkflowRecords ?? [])
  const [podSelectedRecordId, setPodSelectedRecordId] = useState(() => fallbackData.podWorkflowRecords?.[0]?.id ?? null)
  const [podViewMode, setPodViewMode] = useState('Workflow')
  const [podStatusFilter, setPodStatusFilter] = useState('All')
  const [podSelectedMonth, setPodSelectedMonth] = useState('all')

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)
  const [walletPaymentHistory, setWalletPaymentHistory] = useState(() => fallbackData.paymentHistory ?? [])
  const [walletSelectedMonth, setWalletSelectedMonth] = useState('all')
  const [walletActionMessage, setWalletActionMessage] = useState('')
  const [roadCommunityReports, setRoadCommunityReports] = useState(initialRoadCommunityReports)
  const [roadCommunityFilter, setRoadCommunityFilter] = useState('All')
  const [isRoadReportComposerOpen, setIsRoadReportComposerOpen] = useState(false)
  const [roadReportDraft, setRoadReportDraft] = useState({
    category: 'Traffic Alert',
    location: '',
    message: '',
  })

  const [routeFilters] = useState({
    status: 'All Status',
    timeRange: 'Current Shift',
    driver: 'All Drivers',
  })
  const [driverLivePointIndex, setDriverLivePointIndex] = useState(0)
  const [driverLiveUploadState, setDriverLiveUploadState] = useState('idle')
  const [driverLiveLastUploadedAt, setDriverLiveLastUploadedAt] = useState(null)
  const [driverMessageDraft, setDriverMessageDraft] = useState('')
  const [driverMessageCategory, setDriverMessageCategory] = useState('general')
  const [driverMessagePriority, setDriverMessagePriority] = useState('normal')
  const [driverMessageState, setDriverMessageState] = useState('idle')
  const [driverMessageLastSentAt, setDriverMessageLastSentAt] = useState(null)
  const [driverMessageHistory, setDriverMessageHistory] = useState([])
  const [isReceiverSignatureCleared, setIsReceiverSignatureCleared] = useState(false)

  // Driver Settings State
  const [settings, setSettings] = useState(() => {
    if (typeof window === 'undefined') {
      return DRIVER_SETTINGS_DEFAULTS
    }

    try {
      const rawSettings = window.localStorage.getItem(DRIVER_SETTINGS_STORAGE_KEY)
      if (!rawSettings) {
        return DRIVER_SETTINGS_DEFAULTS
      }

      const parsedSettings = JSON.parse(rawSettings)
      return {
        ...DRIVER_SETTINGS_DEFAULTS,
        ...parsedSettings,
      }
    } catch {
      return DRIVER_SETTINGS_DEFAULTS
    }
  })
  const [isProfileEditing, setIsProfileEditing] = useState(false)
  const [profileDraft, setProfileDraft] = useState(() => pickDriverProfileSettings(settings))
  const [isAvailabilityEditing, setIsAvailabilityEditing] = useState(false)
  const [availabilityDraft, setAvailabilityDraft] = useState(() => pickDriverSettingsSubset(settings, DRIVER_AVAILABILITY_FIELDS))
  const [isSafetyEditing, setIsSafetyEditing] = useState(false)
  const [safetyDraft, setSafetyDraft] = useState(() => pickDriverSettingsSubset(settings, DRIVER_SAFETY_FIELDS))
  const [isPayoutEditing, setIsPayoutEditing] = useState(false)
  const [payoutDraft, setPayoutDraft] = useState(() => pickDriverSettingsSubset(settings, DRIVER_PAYOUT_FIELDS))
  const [settingsLastSavedAt, setSettingsLastSavedAt] = useState(null)

  const persistDriverSettings = (nextSettings) => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(DRIVER_SETTINGS_STORAGE_KEY, JSON.stringify(nextSettings))
      setSettingsLastSavedAt(new Date().toISOString())
    } catch {
      // Ignore write failures silently so settings UI remains usable.
    }
  }

  const handleProfileDraftChange = (field, value) => {
    setProfileDraft((previousDraft) => ({
      ...previousDraft,
      [field]: value,
    }))
  }

  const updateAvailabilityDraft = (field, value) => {
    setAvailabilityDraft((previousDraft) => ({
      ...previousDraft,
      [field]: value,
    }))
  }

  const updateSafetyDraft = (field, value) => {
    setSafetyDraft((previousDraft) => ({
      ...previousDraft,
      [field]: value,
    }))
  }

  const updatePayoutDraft = (field, value) => {
    setPayoutDraft((previousDraft) => ({
      ...previousDraft,
      [field]: value,
    }))
  }

  const handleProfileEditStart = () => {
    setProfileDraft(pickDriverProfileSettings(settings))
    setIsProfileEditing(true)
  }

  const handleProfileEditCancel = () => {
    setProfileDraft(pickDriverProfileSettings(settings))
    setIsProfileEditing(false)
  }

  const handleProfileEditSave = () => {
    const nextSettings = {
      ...settings,
      ...pickDriverProfileSettings(profileDraft),
    }

    setSettings(nextSettings)
    persistDriverSettings(nextSettings)
    setIsProfileEditing(false)
  }

  const handleAvailabilityEditStart = () => {
    setAvailabilityDraft(pickDriverSettingsSubset(settings, DRIVER_AVAILABILITY_FIELDS))
    setIsAvailabilityEditing(true)
  }

  const handleAvailabilityEditCancel = () => {
    setAvailabilityDraft(pickDriverSettingsSubset(settings, DRIVER_AVAILABILITY_FIELDS))
    setIsAvailabilityEditing(false)
  }

  const handleAvailabilityEditSave = () => {
    const nextSettings = {
      ...settings,
      ...pickDriverSettingsSubset(availabilityDraft, DRIVER_AVAILABILITY_FIELDS),
    }

    setSettings(nextSettings)
    persistDriverSettings(nextSettings)
    setIsAvailabilityEditing(false)
  }

  const handleSafetyEditStart = () => {
    setSafetyDraft(pickDriverSettingsSubset(settings, DRIVER_SAFETY_FIELDS))
    setIsSafetyEditing(true)
  }

  const handleSafetyEditCancel = () => {
    setSafetyDraft(pickDriverSettingsSubset(settings, DRIVER_SAFETY_FIELDS))
    setIsSafetyEditing(false)
  }

  const handleSafetyEditSave = () => {
    const nextSettings = {
      ...settings,
      ...pickDriverSettingsSubset(safetyDraft, DRIVER_SAFETY_FIELDS),
    }

    setSettings(nextSettings)
    persistDriverSettings(nextSettings)
    setIsSafetyEditing(false)
  }

  const handlePayoutEditStart = () => {
    setPayoutDraft(pickDriverSettingsSubset(settings, DRIVER_PAYOUT_FIELDS))
    setIsPayoutEditing(true)
  }

  const handlePayoutEditCancel = () => {
    setPayoutDraft(pickDriverSettingsSubset(settings, DRIVER_PAYOUT_FIELDS))
    setIsPayoutEditing(false)
  }

  const handlePayoutEditSave = () => {
    const nextSettings = {
      ...settings,
      ...pickDriverSettingsSubset(payoutDraft, DRIVER_PAYOUT_FIELDS),
    }

    setSettings(nextSettings)
    persistDriverSettings(nextSettings)
    setIsPayoutEditing(false)
  }

  const handleSaveAllDriverSettings = () => {
    const nextSettings = {
      ...settings,
      ...(isProfileEditing ? pickDriverProfileSettings(profileDraft) : {}),
      ...(isAvailabilityEditing ? pickDriverSettingsSubset(availabilityDraft, DRIVER_AVAILABILITY_FIELDS) : {}),
      ...(isSafetyEditing ? pickDriverSettingsSubset(safetyDraft, DRIVER_SAFETY_FIELDS) : {}),
      ...(isPayoutEditing ? pickDriverSettingsSubset(payoutDraft, DRIVER_PAYOUT_FIELDS) : {}),
    }

    setSettings(nextSettings)
    persistDriverSettings(nextSettings)
    setIsProfileEditing(false)
    setIsAvailabilityEditing(false)
    setIsSafetyEditing(false)
    setIsPayoutEditing(false)
  }

  const handleDownloadDriverProfile = () => {
    triggerFileDownload(
      'driver-profile-settings.json',
      JSON.stringify({
        scope: 'driver-profile',
        settings,
        savedAt: settingsLastSavedAt,
      }, null, 2),
      'application/json;charset=utf-8'
    )
  }

  useEffect(() => {
    if (!isProfileEditing) {
      setProfileDraft(pickDriverProfileSettings(settings))
    }
  }, [isProfileEditing, settings])

  useEffect(() => {
    if (!isAvailabilityEditing) {
      setAvailabilityDraft(pickDriverSettingsSubset(settings, DRIVER_AVAILABILITY_FIELDS))
    }
  }, [isAvailabilityEditing, settings])

  useEffect(() => {
    if (!isSafetyEditing) {
      setSafetyDraft(pickDriverSettingsSubset(settings, DRIVER_SAFETY_FIELDS))
    }
  }, [isSafetyEditing, settings])

  useEffect(() => {
    if (!isPayoutEditing) {
      setPayoutDraft(pickDriverSettingsSubset(settings, DRIVER_PAYOUT_FIELDS))
    }
  }, [isPayoutEditing, settings])

  const mapApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const { isLoaded: isMapsReady } = useJsApiLoader({
    id: 'fleetflow-google-maps-loader',
    googleMapsApiKey: mapApiKey || '',
    preventGoogleFontsLoading: true,
  })
  const dashboardMapRef = useRef(null)
  const previousDriverLivePointRef = useRef(null)
  const bidSheetInputRef = useRef(null)

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
    if (Array.isArray(dashboardData.paymentHistory)) {
      setWalletPaymentHistory(dashboardData.paymentHistory)
    }
  }, [dashboardData.paymentHistory])

  useEffect(() => {
    if (Array.isArray(dashboardData.podWorkflowRecords)) {
      setPodWorkflowRecords(dashboardData.podWorkflowRecords)
    }
  }, [dashboardData.podWorkflowRecords])

  useEffect(() => {
    setPodSelectedRecordId((currentRecordId) => {
      if (!Array.isArray(podWorkflowRecords) || podWorkflowRecords.length === 0) {
        return null
      }

      return podWorkflowRecords.some((record) => record.id === currentRecordId)
        ? currentRecordId
        : podWorkflowRecords[0].id
    })
  }, [podWorkflowRecords])

  const metrics = useMemo(() => dashboardData.metrics ?? [], [dashboardData.metrics])
  const vehicles = useMemo(() => dashboardData.vehicles ?? [], [dashboardData.vehicles])
  const dispatches = useMemo(() => dashboardData.dispatches ?? [], [dashboardData.dispatches])
  const orders = useMemo(() => dashboardData.orders ?? [], [dashboardData.orders])
  const activeDashboardOrder = useMemo(() => {
    if (orders.length === 0) {
      return null
    }

    return orders.find((order) => order.status === 'In Transit') ?? orders[0]
  }, [orders])

  const activeDashboardRouteLabel = useMemo(() => {
    if (!activeDashboardOrder) {
      return 'No active shipment'
    }

    return `${activeDashboardOrder.origin} -> ${activeDashboardOrder.destination}`
  }, [activeDashboardOrder])

  const dashboardDirectGoogleMapsUrl = useMemo(() => {
    const origin = activeDashboardOrder?.origin ?? ''
    const destination = activeDashboardOrder?.destination ?? ''

    if (!origin || !destination) {
      return 'https://www.google.com/maps?output=embed'
    }

    return `https://www.google.com/maps?output=embed&saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}&dirflg=d`
  }, [activeDashboardOrder?.destination, activeDashboardOrder?.origin])

  const activeShipmentVehicle = useMemo(() => {
    if (!activeDashboardOrder?.truck) {
      return vehicles.find((vehicle) => vehicle.status === 'on-time') ?? vehicles[0] ?? null
    }

    return vehicles.find((vehicle) => vehicle.id === activeDashboardOrder.truck) ?? vehicles[0] ?? null
  }, [activeDashboardOrder?.truck, vehicles])

  const activeShipmentPosition = useMemo(() => {
    if (activeShipmentVehicle?.lat != null && activeShipmentVehicle?.lng != null) {
      return { lat: activeShipmentVehicle.lat, lng: activeShipmentVehicle.lng }
    }

    if (dashboardRoutePath.length > 0) {
      return dashboardRoutePath[Math.min(2, dashboardRoutePath.length - 1)]
    }

    return mapCenter
  }, [activeShipmentVehicle, dashboardRoutePath])

  const activeDriverDispatch = useMemo(() => {
    const singleDispatch = dispatches[0] ?? null
    const routeParts = singleDispatch?.route?.split('-').map((part) => part.trim()) ?? []

    const origin = activeDashboardOrder?.origin ?? routeParts[0] ?? 'Origin'
    const destination = activeDashboardOrder?.destination ?? routeParts[1] ?? 'Destination'

    const etaParts = String(activeDashboardOrder?.eta ?? '').split(',').map((part) => part.trim())
    const etaDateFromOrder = etaParts[0] && etaParts[0] !== '' ? etaParts[0] : '--'
    const etaTimeFromOrder = etaParts[1] && etaParts[1] !== '' ? etaParts[1] : '--'

    return {
      id: singleDispatch?.id ?? activeDashboardOrder?.id ?? 'LOAD-0000',
      status: singleDispatch?.status ?? activeDashboardOrder?.status ?? 'In Transit',
      origin,
      destination,
      pickupDate: singleDispatch?.pickupDate ?? 'Today',
      pickupTime: singleDispatch?.pickupTime ?? '08:00 AM',
      deliveryDate: singleDispatch?.deliveryDate ?? etaDateFromOrder,
      deliveryTime: singleDispatch?.deliveryTime ?? etaTimeFromOrder,
      price: singleDispatch?.price ?? activeDashboardOrder?.rate ?? '--',
      truck: singleDispatch?.truck ?? activeDashboardOrder?.truck ?? '--',
      customer: singleDispatch?.customer ?? activeDashboardOrder?.customerName ?? 'Customer',
      loadType: singleDispatch?.loadType ?? 'Dry Van',
      priority: singleDispatch?.priority ?? activeDashboardOrder?.priority ?? 'Medium',
      notes: singleDispatch?.notes ?? 'Follow pickup window and upload POD after delivery.',
      driver: singleDispatch?.driver ?? activeDashboardOrder?.driver ?? 'Assigned Driver',
      distance: dashboardRouteMeta.distance,
      duration: dashboardRouteMeta.duration,
    }
  }, [activeDashboardOrder, dashboardRouteMeta.distance, dashboardRouteMeta.duration, dispatches])

  const weeklyPlanningDays = useMemo(() => {
    const currentLoadId = activeDashboardOrder?.id ?? activeDriverDispatch.id
    const currentStatus = activeDashboardOrder?.status ?? activeDriverDispatch.status
    const currentRevenue = activeDashboardOrder?.rate ?? activeDriverDispatch.price
    const currentEta = activeDashboardOrder?.eta ?? `${activeDriverDispatch.deliveryDate}, ${activeDriverDispatch.deliveryTime}`
    const currentRoute = `${activeDriverDispatch.origin} -> ${activeDriverDispatch.destination}`

    return [
      {
        id: 'plan-mon-oct23',
        dayLabel: 'Mon, Oct 23',
        isCurrent: true,
        lane: currentRoute,
        cardNote: `Load ${currentLoadId} in motion`,
        status: currentStatus,
        revenue: currentRevenue,
        eta: currentEta,
        truck: activeDriverDispatch.truck,
        loadId: currentLoadId,
        customer: activeDriverDispatch.customer,
        loadType: activeDriverDispatch.loadType,
        priority: activeDriverDispatch.priority,
        driver: activeDriverDispatch.driver,
        trailer: '53 ft Dry Van',
        pickupWindow: `${activeDriverDispatch.pickupDate} | ${activeDriverDispatch.pickupTime}`,
        deliveryWindow: `${activeDriverDispatch.deliveryDate} | ${activeDriverDispatch.deliveryTime}`,
        distance: activeDriverDispatch.distance,
        driveTime: activeDriverDispatch.duration,
        fuelStop: 'Pilot Travel Center - Nashville, TN',
        checkInRule: 'Every 2 hrs with geo-tag update',
        dispatcherName: 'Sarah Jenkins',
        dispatcherPhone: '+1 (555) 203-9912',
        dispatcherEmail: 'dispatch.ops@fleetflow.com',
        emergencyLine: '+1 (800) 442-7711',
        docs: ['BOL / Rate Confirmation', 'POD capture in app', 'Seal verification log'],
        checklist: ['Pre-trip inspection complete', 'Reefer and tire checks logged', 'HOS break plan acknowledged'],
        notes: {
          pickup: 'Check in at Dock 12 and verify pallet seal IDs before roll-out.',
          enroute: 'Send check-ins at Nashville and Knoxville checkpoints with geotag photos.',
          delivery: 'Call receiver 30 mins before arrival and upload signed POD immediately.',
        },
        timeline: [
          { label: 'Pickup', location: activeDriverDispatch.origin, window: `${activeDriverDispatch.pickupDate} ${activeDriverDispatch.pickupTime}`, status: 'Completed', tone: 'bg-emerald-500' },
          { label: 'Mid-route checkpoint', location: 'Nashville, TN', window: '11:45 AM update', status: 'In Progress', tone: 'bg-blue-500' },
          { label: 'Delivery', location: activeDriverDispatch.destination, window: `ETA ${currentEta}`, status: 'Pending', tone: 'bg-slate-300' },
        ],
      },
      {
        id: 'plan-tue-oct24',
        dayLabel: 'Tue, Oct 24',
        isCurrent: false,
        lane: 'Columbus, OH -> Pittsburgh, PA',
        cardNote: 'Next assigned lane ready',
        status: 'Assigned',
        revenue: '$820.00',
        eta: 'Oct 24, 05:40 PM',
        truck: 'FF-902',
        loadId: 'LD-2024-001848',
        customer: 'Target Corporation',
        loadType: 'Dry Van',
        priority: 'Medium',
        driver: 'Alex Rivera',
        trailer: '48 ft Dry Van',
        pickupWindow: 'Oct 24 | 07:30 AM',
        deliveryWindow: 'Oct 24 | 05:40 PM',
        distance: '186 mi',
        driveTime: '3h 45m',
        fuelStop: 'Shell Service Area - New Stanton, PA',
        checkInRule: 'Pickup, midpoint, and final POD check-in',
        dispatcherName: 'Sarah Jenkins',
        dispatcherPhone: '+1 (555) 203-9912',
        dispatcherEmail: 'dispatch.ops@fleetflow.com',
        emergencyLine: '+1 (800) 442-7711',
        docs: ['BOL / Delivery manifest', 'Weight ticket', 'Receiver contact sheet'],
        checklist: ['Pickup seal verified', 'Route hazard notes reviewed', 'POD scan workflow ready'],
        notes: {
          pickup: 'Use bay 5 at Columbus terminal and secure mixed pallets in two zones.',
          enroute: 'Avoid I-76 construction window from 2:00 PM to 4:00 PM.',
          delivery: 'Back-in required at dock door 3 with safety vest at all times.',
        },
        timeline: [
          { label: 'Pickup', location: 'Columbus, OH', window: '07:30 AM - 08:30 AM', status: 'Scheduled', tone: 'bg-blue-400' },
          { label: 'Fuel / checkpoint', location: 'Cambridge, OH', window: '11:00 AM', status: 'Scheduled', tone: 'bg-slate-300' },
          { label: 'Delivery', location: 'Pittsburgh, PA', window: '04:30 PM - 05:40 PM', status: 'Scheduled', tone: 'bg-slate-300' },
        ],
      },
      {
        id: 'plan-wed-oct25',
        dayLabel: 'Wed, Oct 25',
        isCurrent: false,
        lane: 'Pittsburgh, PA -> Cleveland, OH',
        cardNote: 'Backhaul under planning',
        status: 'Planning',
        revenue: '$910.00',
        eta: 'Oct 25, 04:20 PM',
        truck: 'FF-902',
        loadId: 'LD-2024-001854',
        customer: 'Costco Wholesale',
        loadType: 'Dry Goods',
        priority: 'Medium',
        driver: 'Alex Rivera',
        trailer: '53 ft Dry Van',
        pickupWindow: 'Oct 25 | 08:10 AM',
        deliveryWindow: 'Oct 25 | 04:20 PM',
        distance: '133 mi',
        driveTime: '2h 30m',
        fuelStop: 'TA Service Plaza - Girard, OH',
        checkInRule: 'Hourly ETA updates until confirmed',
        dispatcherName: 'Sarah Jenkins',
        dispatcherPhone: '+1 (555) 203-9912',
        dispatcherEmail: 'dispatch.ops@fleetflow.com',
        emergencyLine: '+1 (800) 442-7711',
        docs: ['Rate confirmation draft', 'Customer appointment slot', 'Driver briefing note'],
        checklist: ['Confirm appointment window', 'Verify available dock personnel', 'Lock route before 6:00 PM prior day'],
        notes: {
          pickup: 'Final pickup slot pending customer approval by 6:00 PM.',
          enroute: 'Maintain flexible route due potential weather around Akron.',
          delivery: 'Receiver asks for live ETA updates in final 90 minutes.',
        },
        timeline: [
          { label: 'Load confirmation', location: 'Planning Desk', window: 'By 06:00 PM (prior day)', status: 'Pending', tone: 'bg-amber-400' },
          { label: 'Pickup', location: 'Pittsburgh, PA', window: '08:10 AM', status: 'Pending', tone: 'bg-slate-300' },
          { label: 'Delivery', location: 'Cleveland, OH', window: '04:20 PM ETA', status: 'Pending', tone: 'bg-slate-300' },
        ],
      },
      {
        id: 'plan-thu-oct26',
        dayLabel: 'Thu, Oct 26',
        isCurrent: false,
        lane: 'Cleveland, OH -> Newark, NJ',
        cardNote: 'Long haul scheduled',
        status: 'Scheduled',
        revenue: '$1.1k',
        eta: 'Oct 26, 08:50 PM',
        truck: 'FF-902',
        loadId: 'LD-2024-001855',
        customer: 'Walmart Distribution',
        loadType: 'Dry Van',
        priority: 'High',
        driver: 'Alex Rivera',
        trailer: '53 ft Dry Van',
        pickupWindow: 'Oct 26 | 07:00 AM',
        deliveryWindow: 'Oct 26 | 08:50 PM',
        distance: '461 mi',
        driveTime: '8h 35m',
        fuelStop: 'Pilot - Hazleton, PA',
        checkInRule: 'Geo-check every 120 miles',
        dispatcherName: 'Sarah Jenkins',
        dispatcherPhone: '+1 (555) 203-9912',
        dispatcherEmail: 'dispatch.ops@fleetflow.com',
        emergencyLine: '+1 (800) 442-7711',
        docs: ['BOL', 'Hazmat declaration (if required)', 'Delivery appointment token'],
        checklist: ['Brake and tire pressure re-check', 'Cross-state permit packet ready', 'Night-delivery safety kit loaded'],
        notes: {
          pickup: 'Arrive with clean trailer and verified seal kit.',
          enroute: 'Use approved turnpike route and avoid low-clearance local roads.',
          delivery: 'Night shift guard will validate QR token at gate entry.',
        },
        timeline: [
          { label: 'Pickup', location: 'Cleveland, OH', window: '07:00 AM - 08:00 AM', status: 'Scheduled', tone: 'bg-blue-400' },
          { label: 'Safety checkpoint', location: 'Hazleton, PA', window: '02:15 PM', status: 'Scheduled', tone: 'bg-slate-300' },
          { label: 'Delivery', location: 'Newark, NJ', window: '08:00 PM - 08:50 PM', status: 'Scheduled', tone: 'bg-slate-300' },
        ],
      },
      {
        id: 'plan-fri-oct27',
        dayLabel: 'Fri, Oct 27',
        isCurrent: false,
        lane: 'Home Base - Newark, NJ',
        cardNote: 'Rest and compliance reset',
        status: 'Home Time Approved',
        revenue: '--',
        eta: 'All Day',
        truck: 'FF-902',
        loadId: 'OFF-2024-1027',
        customer: 'Internal Ops',
        loadType: 'Off Duty',
        priority: 'Low',
        driver: 'Alex Rivera',
        trailer: 'N/A',
        pickupWindow: 'Oct 27 | 12:00 AM',
        deliveryWindow: 'Oct 27 | 11:59 PM',
        distance: '--',
        driveTime: '--',
        fuelStop: 'Not required',
        checkInRule: 'Single end-of-day check-in',
        dispatcherName: 'Sarah Jenkins',
        dispatcherPhone: '+1 (555) 203-9912',
        dispatcherEmail: 'dispatch.ops@fleetflow.com',
        emergencyLine: '+1 (800) 442-7711',
        docs: ['HOS reset log', 'Next-load readiness checklist'],
        checklist: ['Vehicle parked in secure yard', 'Cab cleaned and stocked', 'Rest compliance acknowledged'],
        notes: {
          pickup: 'No pickup assigned. Keep truck staged at Newark yard.',
          enroute: 'Off-duty period; respond only to priority dispatch messages.',
          delivery: 'N/A - preparing for next-day planning review.',
        },
        timeline: [
          { label: 'Off duty start', location: 'Newark Yard', window: '12:00 AM', status: 'Approved', tone: 'bg-blue-400' },
          { label: 'Compliance reset', location: 'Driver App', window: 'Throughout day', status: 'In Progress', tone: 'bg-violet-400' },
          { label: 'Readiness check', location: 'Dispatch Desk', window: '06:00 PM', status: 'Pending', tone: 'bg-slate-300' },
        ],
      },
      {
        id: 'plan-sat-oct28',
        dayLabel: 'Sat, Oct 28',
        isCurrent: false,
        lane: 'Home Base - Newark, NJ',
        cardNote: 'Recovery + truck prep',
        status: 'Home Time',
        revenue: '--',
        eta: 'All Day',
        truck: 'FF-902',
        loadId: 'OFF-2024-1028',
        customer: 'Internal Ops',
        loadType: 'Off Duty',
        priority: 'Low',
        driver: 'Alex Rivera',
        trailer: 'N/A',
        pickupWindow: 'Oct 28 | 12:00 AM',
        deliveryWindow: 'Oct 28 | 11:59 PM',
        distance: '--',
        driveTime: '--',
        fuelStop: 'Not required',
        checkInRule: 'Noon heartbeat + evening confirmation',
        dispatcherName: 'Sarah Jenkins',
        dispatcherPhone: '+1 (555) 203-9912',
        dispatcherEmail: 'dispatch.ops@fleetflow.com',
        emergencyLine: '+1 (800) 442-7711',
        docs: ['Sunday route pre-read', 'Equipment readiness photos'],
        checklist: ['Battery and fluid quick-check', 'In-cab documentation sorted', 'Monday route packet reviewed'],
        notes: {
          pickup: 'No pickup. Optional truck wash and maintenance touch-up.',
          enroute: 'Keep communication line open for rapid load acceptance.',
          delivery: 'N/A - standby day.',
        },
        timeline: [
          { label: 'Rest period', location: 'Home Base', window: 'Morning', status: 'Active', tone: 'bg-violet-400' },
          { label: 'Truck prep', location: 'Yard Bay 2', window: '02:00 PM', status: 'Pending', tone: 'bg-slate-300' },
          { label: 'Dispatch sync', location: 'Driver App', window: '07:30 PM', status: 'Pending', tone: 'bg-slate-300' },
        ],
      },
      {
        id: 'plan-sun-oct29',
        dayLabel: 'Sun, Oct 29',
        isCurrent: false,
        lane: 'Home Base - Newark, NJ',
        cardNote: 'Final prep for Monday run',
        status: 'Home Time',
        revenue: '--',
        eta: 'All Day',
        truck: 'FF-902',
        loadId: 'OFF-2024-1029',
        customer: 'Internal Ops',
        loadType: 'Off Duty',
        priority: 'Low',
        driver: 'Alex Rivera',
        trailer: 'N/A',
        pickupWindow: 'Oct 29 | 12:00 AM',
        deliveryWindow: 'Oct 29 | 11:59 PM',
        distance: '--',
        driveTime: '--',
        fuelStop: 'Not required',
        checkInRule: 'Evening readiness confirmation',
        dispatcherName: 'Sarah Jenkins',
        dispatcherPhone: '+1 (555) 203-9912',
        dispatcherEmail: 'dispatch.ops@fleetflow.com',
        emergencyLine: '+1 (800) 442-7711',
        docs: ['Monday BOL packet', 'Gate appointment QR', 'Fuel card balance check'],
        checklist: ['Alarm and route start time set', 'Cab safety kit replenished', 'Electronic logs synced'],
        notes: {
          pickup: 'N/A today. Keep Monday pickup docs ready in cab.',
          enroute: 'Review weather and road advisories for first 300 miles.',
          delivery: 'N/A - final rest window before dispatch activation.',
        },
        timeline: [
          { label: 'Rest period', location: 'Home Base', window: 'Morning', status: 'Active', tone: 'bg-violet-400' },
          { label: 'Route briefing', location: 'Dispatch Call', window: '05:00 PM', status: 'Pending', tone: 'bg-slate-300' },
          { label: 'Pre-start checks', location: 'Yard Bay 2', window: '08:00 PM', status: 'Pending', tone: 'bg-slate-300' },
        ],
      },
    ]
  }, [activeDashboardOrder, activeDriverDispatch])

  const driverWeeklyPlans = useMemo(() => {
    const driverName = activeDriverDispatch.driver || 'Assigned Driver'
    const driverTruck = activeDriverDispatch.truck || '--'
    const driverHomeLocation = 'Newark, NJ'

    return weeklyPlanningDays.map((plan) => {
      const isHomeTimeDay = plan.status.includes('Home Time')
      const homeLane = `Home - ${driverHomeLocation}`

      return {
        ...plan,
        driver: driverName,
        truck: driverTruck,
        trailer: isHomeTimeDay ? 'Parked' : '53 ft Dry Van',
        lane: isHomeTimeDay ? homeLane : plan.lane,
        cardNote: isHomeTimeDay ? 'Home schedule and recovery window' : plan.cardNote,
        driverPhone: '+1 (555) 342-7710',
        emergencyContactName: 'Ava Rodriguez',
        emergencyContactPhone: '+1 (555) 116-9034',
        roadsideSupport: '+1 (800) 554-7701',
        timeline: isHomeTimeDay
          ? plan.timeline.map((stop) => ({
            ...stop,
            location: homeLane,
            label: stop.label.includes('Dispatch') ? 'Home schedule check-in' : stop.label,
          }))
          : plan.timeline,
        notes: isHomeTimeDay
          ? {
            pickup: `Stay at ${homeLane}. No terminal movement required.`,
            enroute: 'Home-time day. No active route or live dispatch movement.',
            delivery: 'No delivery task today. Prep for next active shift.',
          }
          : plan.notes,
      }
    })
  }, [activeDriverDispatch.driver, activeDriverDispatch.truck, weeklyPlanningDays])

  const selectedWeeklyPlan = useMemo(() => {
    return driverWeeklyPlans.find((plan) => plan.id === selectedWeeklyPlanId) ?? null
  }, [driverWeeklyPlans, selectedWeeklyPlanId])

  const currentTripPlan = useMemo(() => {
    return driverWeeklyPlans.find((plan) => plan.isCurrent) ?? driverWeeklyPlans[0] ?? null
  }, [driverWeeklyPlans])

  const activeDispatchMiles = useMemo(() => {
    return Number.parseInt(String(activeDriverDispatch.distance ?? '').replace(/[^\d]/g, ''), 10) || 0
  }, [activeDriverDispatch.distance])

  const activeDispatchGross = useMemo(() => {
    return parseNumericValue(activeDriverDispatch.price)
  }, [activeDriverDispatch.price])

  const estimatedFuelSpend = useMemo(() => {
    return activeDispatchMiles > 0 ? activeDispatchMiles * 0.62 : 0
  }, [activeDispatchMiles])

  const estimatedTollSpend = useMemo(() => {
    return activeDispatchMiles > 0 ? activeDispatchMiles * 0.11 : 0
  }, [activeDispatchMiles])

  const estimatedNetPayout = useMemo(() => {
    if (activeDispatchGross <= 0) {
      return 0
    }

    return Math.max(activeDispatchGross - estimatedFuelSpend - estimatedTollSpend, 0)
  }, [activeDispatchGross, estimatedFuelSpend, estimatedTollSpend])

  const tripRiskRadar = useMemo(() => {
    const toneMap = {
      Low: {
        cardTone: 'border-emerald-200 bg-emerald-50',
        pillTone: 'bg-emerald-100 text-emerald-700',
      },
      Medium: {
        cardTone: 'border-amber-200 bg-amber-50',
        pillTone: 'bg-amber-100 text-amber-700',
      },
      High: {
        cardTone: 'border-rose-200 bg-rose-50',
        pillTone: 'bg-rose-100 text-rose-700',
      },
    }

    const delayLevel = activeDriverDispatch.status === 'Loading' ? 'High' : activeDriverDispatch.status === 'In Transit' ? 'Medium' : 'Low'
    const weatherLevel = activeDispatchMiles > 450 ? 'Medium' : 'Low'
    const detentionLevel = activeDriverDispatch.priority === 'High' ? 'Medium' : 'Low'
    const hosLevel = activeDispatchMiles > 600 ? 'High' : activeDispatchMiles > 300 ? 'Medium' : 'Low'

    return [
      {
        id: 'delay-risk',
        label: 'Delay Risk',
        level: delayLevel,
        note: `${activeDriverDispatch.status} lane status`,
        icon: AlertTriangle,
      },
      {
        id: 'weather-risk',
        label: 'Weather Risk',
        level: weatherLevel,
        note: activeDispatchMiles > 0 ? `${activeDispatchMiles} mi exposure` : 'Route data pending',
        icon: Route,
      },
      {
        id: 'detention-risk',
        label: 'Detention Risk',
        level: detentionLevel,
        note: `${activeDriverDispatch.customer} dock window`,
        icon: Clock3,
      },
      {
        id: 'hos-risk',
        label: 'HOS Risk',
        level: hosLevel,
        note: `${activeDriverDispatch.duration} planned drive`,
        icon: Gauge,
      },
    ].map((item) => ({
      ...item,
      cardTone: toneMap[item.level]?.cardTone ?? 'border-slate-200 bg-slate-50',
      pillTone: toneMap[item.level]?.pillTone ?? 'bg-slate-100 text-slate-700',
    }))
  }, [activeDispatchMiles, activeDriverDispatch.customer, activeDriverDispatch.duration, activeDriverDispatch.priority, activeDriverDispatch.status])

  const hosPlanner = useMemo(() => {
    const estimatedDriveHours = activeDispatchMiles > 0 ? Math.max(activeDispatchMiles / 55, 1.2) : 0
    const usedHours = Math.min(10.8, Math.max(2.4, estimatedDriveHours * 0.72 + 1.4))
    const remainingHours = Math.max(0, 11 - usedHours)
    const breakDueHours = Math.max(0, 8 - Math.max(usedHours - 1.2, 0))

    return {
      usedHours,
      remainingHours,
      breakDueHours,
      recommendedStop: currentTripPlan?.fuelStop ?? 'Nearest approved truck stop',
    }
  }, [activeDispatchMiles, currentTripPlan?.fuelStop])

  const deliveryReadinessItems = useMemo(() => {
    const docsReady = (currentTripPlan?.docs?.length ?? 0) >= 2
    const pickupReady = Boolean(currentTripPlan?.pickupWindow && currentTripPlan.pickupWindow !== '--')
    const podReady = (currentTripPlan?.checklist ?? []).some((item) => item.toLowerCase().includes('pod'))

    return [
      { id: 'docs-ready', label: 'Docs packet verified', done: docsReady },
      { id: 'pickup-ready', label: 'Pickup appointment confirmed', done: pickupReady },
      { id: 'pod-ready', label: 'POD workflow ready', done: podReady },
    ]
  }, [currentTripPlan])

  const deliveryReadinessComplete = useMemo(() => {
    return deliveryReadinessItems.filter((item) => item.done).length
  }, [deliveryReadinessItems])

  const deliveryReadinessPercent = useMemo(() => {
    return Math.round((deliveryReadinessComplete / Math.max(deliveryReadinessItems.length, 1)) * 100)
  }, [deliveryReadinessComplete, deliveryReadinessItems.length])

  const dispatchDeskData = useMemo(() => {
    return {
      dispatcher: currentTripPlan?.dispatcherName ?? 'Sarah Jenkins',
      phone: currentTripPlan?.dispatcherPhone ?? '+1 (555) 203-9912',
      email: currentTripPlan?.dispatcherEmail ?? 'dispatch.ops@fleetflow.com',
      note: currentTripPlan?.notes?.enroute ?? activeDriverDispatch.notes,
      message: activeDriverDispatch.priority === 'High'
        ? 'Priority lane active: share geo-tag updates every 2 hours.'
        : 'Standard lane active: check in at pickup, midpoint, and delivery.',
    }
  }, [activeDriverDispatch.notes, activeDriverDispatch.priority, currentTripPlan])

  const dashboardLocationFilterOptions = useMemo(() => {
    const options = ['All Locations']

    if (activeDriverDispatch.origin) {
      options.push(activeDriverDispatch.origin)
    }

    if (activeDriverDispatch.destination && activeDriverDispatch.destination !== activeDriverDispatch.origin) {
      options.push(activeDriverDispatch.destination)
    }

    return options
  }, [activeDriverDispatch.destination, activeDriverDispatch.origin])

  const bidPanelCompanyContact = useMemo(() => {
    return {
      dispatcher: dispatchDeskData.dispatcher,
      dispatchPhone: dispatchDeskData.phone,
      dispatchEmail: dispatchDeskData.email,
      supportName: currentTripPlan?.emergencyContactName ?? 'FleetFlow Driver Support',
      supportPhone: currentTripPlan?.roadsideSupport ?? '+1 (800) 554-7701',
      emergencyLine: currentTripPlan?.emergencyLine ?? '+1 (800) 442-7711',
    }
  }, [currentTripPlan, dispatchDeskData.dispatcher, dispatchDeskData.email, dispatchDeskData.phone])

  const handleDashboardDateFilterChange = (event) => {
    const nextIndex = Number.parseInt(event.target.value, 10)
    if (!Number.isFinite(nextIndex)) {
      return
    }

    setDashboardDateFilterIndex(Math.max(0, Math.min(nextIndex, DASHBOARD_DATE_FILTER_OPTIONS.length - 1)))
  }

  const handleDashboardLocationFilterChange = (event) => {
    const nextIndex = Number.parseInt(event.target.value, 10)
    if (!Number.isFinite(nextIndex)) {
      return
    }

    setDashboardLocationFilterIndex(Math.max(0, Math.min(nextIndex, Math.max(dashboardLocationFilterOptions.length - 1, 0))))
  }

  const focusDashboardSchedule = () => {
    setSelectedWeeklyPlanId(currentTripPlan?.id ?? driverWeeklyPlans[0]?.id ?? null)
  }

  const openDriverMessageComposer = (message, category = 'general', priority = 'normal') => {
    setActiveSection('routes')
    setDriverMessageCategory(category)
    setDriverMessagePriority(priority)
    setDriverMessageDraft(message)
    setDriverMessageState('idle')
  }

  const handleOpenDispatchNavigation = () => {
    const routeLink = buildGoogleDirectionsUrl(activeDriverDispatch.origin, activeDriverDispatch.destination)
    window.open(routeLink, '_blank', 'noopener,noreferrer')
  }

  const handleContactDispatcher = () => {
    window.location.href = toPhoneHref(dispatchDeskData.phone)
  }

  const handleRequestHomeTime = () => {
    openDriverMessageComposer(
      `Requesting home time after completing ${activeDriverDispatch.id}. Please share next available window.`,
      'general',
      'normal'
    )
  }

  const handlePlanBreakStop = () => {
    openDriverMessageComposer(
      `Planning break stop at ${hosPlanner.recommendedStop}. Updating ETA after halt.`,
      'route',
      'normal'
    )
  }

  const handleOpenDriverChecklist = () => {
    setActiveSection('dashboard')
    setSelectedWeeklyPlanId(currentTripPlan?.id ?? driverWeeklyPlans[0]?.id ?? null)
  }

  const handleViewDriverPayoutHistory = () => {
    setActiveSection('wallet')
  }

  const handleEmergencyRoadside = () => {
    const emergencyLine = currentTripPlan?.emergencyLine ?? '+1 (800) 442-7711'
    window.location.href = toPhoneHref(emergencyLine)
  }

  const handleLearnSafetyTip = () => {
    setActiveSection('settings')
  }

  const handleQuickDispatchMessage = () => {
    openDriverMessageComposer(dispatchDeskData.message, 'general', 'normal')
  }

  const handleExceptionTemplatePick = (templateLabel) => {
    const templateMap = {
      'Traffic delay': { category: 'delay', priority: 'high' },
      'Dock wait > 60 min': { category: 'dock', priority: 'normal' },
      'Route blocked / detour': { category: 'route', priority: 'high' },
      'POD issue': { category: 'dock', priority: 'urgent' },
    }

    const template = templateMap[templateLabel] ?? { category: 'general', priority: 'normal' }
    openDriverMessageComposer(`${templateLabel}: need dispatch assistance.`, template.category, template.priority)
  }

  const openPodWorkflow = (statusFilter = 'All') => {
    setActiveSection('pod')
    setPodViewMode('Workflow')
    setPodStatusFilter(statusFilter)
    setPodSelectedMonth('all')
    setPodSelectedRecordId((currentRecordId) => {
      if (currentRecordId) {
        return currentRecordId
      }

      const matchingRecord = podWorkflowRecords.find((record) => statusFilter === 'All' || record.status === statusFilter)
      return matchingRecord?.id ?? podWorkflowRecords[0]?.id ?? null
    })
  }

  const handleSavePodDraftAction = () => {
    setIsReceiverSignatureCleared(false)
    openPodWorkflow('All')
  }

  const handleSubmitPodToCompany = () => {
    setIsReceiverSignatureCleared(false)
    openPodWorkflow('Pending')
  }

  const handleClearReceiverSignature = () => {
    setIsReceiverSignatureCleared(true)
  }

  const handleEmailDispatcher = () => {
    window.location.href = `mailto:${dispatchDeskData.email}`
  }

  const roadCommunityFilterOptions = useMemo(() => {
    return ['All', ...new Set([...roadReportCategoryOptions, ...roadCommunityReports.map((report) => report.category)])]
  }, [roadCommunityReports])

  const filteredRoadCommunityReports = useMemo(() => {
    return roadCommunityReports.filter((report) => {
      return roadCommunityFilter === 'All' || report.category === roadCommunityFilter
    })
  }, [roadCommunityFilter, roadCommunityReports])

  const handleRoadReportDraftChange = (field, value) => {
    setRoadReportDraft((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleRoadReportAction = (reportId, actionKey) => {
    setRoadCommunityReports((previous) => previous.map((report) => {
      if (report.id !== reportId) {
        return report
      }

      return {
        ...report,
        [actionKey]: report[actionKey] + 1,
      }
    }))
  }

  const handleRoadReportSubmit = (event) => {
    event.preventDefault()

    const trimmedMessage = roadReportDraft.message.trim()
    if (!trimmedMessage) {
      return
    }

    const fallbackLocation = `${activeDriverDispatch.origin} -> ${activeDriverDispatch.destination}`
    const submittedLocation = roadReportDraft.location.trim() || fallbackLocation

    const newReport = {
      id: `road-${Date.now()}`,
      driverName: activeDriverDispatch.driver || 'Fleet Driver',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120&h=120&fit=crop',
      postedAt: 'Just now',
      category: roadReportDraft.category,
      location: submittedLocation,
      message: trimmedMessage,
      confirmations: 0,
      comments: 0,
      helpful: 0,
    }

    setRoadCommunityReports((previous) => [newReport, ...previous])
    setRoadCommunityFilter('All')
    setRoadReportDraft((previous) => ({
      ...previous,
      location: '',
      message: '',
    }))
    setIsRoadReportComposerOpen(false)
  }

  const routesTracking = useMemo(() => dashboardData.routesTracking ?? [], [dashboardData.routesTracking])

  const filteredRoutes = useMemo(() => {
    return routesTracking.filter((route) => {
      const matchStatus = routeFilters.status === 'All Status' || route.status === routeFilters.status
      const matchDriver = routeFilters.driver === 'All Drivers' || route.driver === routeFilters.driver

      return matchStatus && matchDriver
    })
  }, [routesTracking, routeFilters])

  useEffect(() => {
    if (selectedRouteId === null) {
      return
    }

    const hasSelectedRoute = filteredRoutes.some((route) => route.id === selectedRouteId)
    if (!hasSelectedRoute) {
      setSelectedRouteId(null)
    }
  }, [filteredRoutes, selectedRouteId])

  useEffect(() => {
    if (activeSection !== 'routes' || selectedRouteId || filteredRoutes.length === 0) {
      return
    }

    setSelectedRouteId(filteredRoutes[0].id)
  }, [activeSection, filteredRoutes, selectedRouteId])

  useEffect(() => {
    if (!isMapsReady || !activeDashboardOrder?.origin || !activeDashboardOrder?.destination) {
      return
    }

    const mapsApi = window.google?.maps
    if (!mapsApi?.DirectionsService) {
      return
    }

    let didCancel = false
    setIsRouteLoading(true)

    const directionsService = new mapsApi.DirectionsService()
    directionsService.route(
      {
        origin: activeDashboardOrder.origin,
        destination: activeDashboardOrder.destination,
        travelMode: mapsApi.TravelMode.DRIVING,
      },
      (result, status) => {
        if (didCancel) {
          return
        }

        if (status === 'OK' && result?.routes?.[0]) {
          const route = result.routes[0]
          const overviewPath = route.overview_path?.map((point) => ({
            lat: point.lat(),
            lng: point.lng(),
          }))

          if (Array.isArray(overviewPath) && overviewPath.length > 0) {
            setDashboardRoutePath(overviewPath)
          }

          const leg = route.legs?.[0]
          setDashboardRouteMeta({
            distance: leg?.distance?.text ?? '--',
            duration: leg?.duration?.text ?? '--',
          })

          if (route.bounds) {
            const northEast = route.bounds.getNorthEast()
            const southWest = route.bounds.getSouthWest()
            setDashboardRouteBounds({
              north: northEast.lat(),
              east: northEast.lng(),
              south: southWest.lat(),
              west: southWest.lng(),
            })
          }
        } else {
          setDashboardRoutePath(defaultDashboardRoutePath)
          setDashboardRouteBounds(null)
          setDashboardRouteMeta({ distance: '--', duration: '--' })
        }

        setIsRouteLoading(false)
      },
    )

    return () => {
      didCancel = true
    }
  }, [activeDashboardOrder?.destination, activeDashboardOrder?.origin, isMapsReady])

  useEffect(() => {
    if (!dashboardMapRef.current || !dashboardRouteBounds) {
      return
    }

    dashboardMapRef.current.fitBounds(dashboardRouteBounds)
  }, [dashboardRouteBounds])

  const liveBidRows = useMemo(() => {
    const baseMiles = activeDispatchMiles > 0 ? activeDispatchMiles : 430
    const commodityLibrary = [
      'General merchandise pallets',
      'Consumer electronics cartons',
      'Pharma and medical boxed freight',
      'Temperature-sensitive groceries',
      'Home improvement bulk cargo',
      'Mixed retail replenishment',
    ]
    const requirementLibrary = [
      'Food grade trailer required',
      'No cross-dock transfer allowed',
      'Seal verification at pickup',
      'Liftgate needed at delivery',
      'Driver assist unloading expected',
      'Temperature log screenshot before POD',
    ]

    const generatedBids = orders.slice(0, 12).map((order, index) => {
      const equipment = order.loadType ?? activeDriverDispatch.loadType ?? 'Dry Van'
      const urgency = order.priority === 'High' ? 'High' : order.priority === 'Medium' ? 'Medium' : 'Low'
      const bidType = index % 3 === 0 ? 'Spot' : index % 3 === 1 ? 'Contract' : 'Backhaul'
      const laneMiles = Math.max(130, baseMiles + (index * 34) - 90)
      const askRate = parseNumericValue(order.rate) || Math.max(950, 1300 + (index * 120))
      const floorRate = Math.round(askRate * 0.9)
      const rpm = laneMiles > 0 ? askRate / laneMiles : 0
      const destinationRegion = String(order.destination).split(',').slice(-1)[0]?.trim() || 'US'
      const portalSchedule = buildPortalBidSchedule(portalBidSeedTime, index)
      const weightLbs = Math.max(6500, Math.round((laneMiles * 39) + (urgency === 'High' ? 2800 : 900)))
      const lengthFt = equipment === 'Flatbed' ? 48 : 53
      const widthFt = 8.5
      const heightFt = equipment === 'Refrigerated' || equipment === 'Reefer' ? 9.5 : 9
      const palletCount = Math.max(8, Math.round(weightLbs / 2100))
      const pieceCount = Math.max(120, palletCount * 18)
      const handlingNotes = requirementLibrary[index % requirementLibrary.length]
      const commodity = commodityLibrary[index % commodityLibrary.length]
      const requiresHazmat = index % 7 === 0
      const temperatureControl = equipment === 'Refrigerated' || equipment === 'Reefer'
      const requiresTeamDriver = laneMiles >= 850 && urgency === 'High'
      const score = Math.max(
        58,
        Math.min(
          95,
          Math.round((rpm * 45) + (urgency === 'High' ? 12 : urgency === 'Medium' ? 6 : 0)),
        ),
      )

      return {
        id: `BID-${String(index + 1).padStart(4, '0')}`,
        sourceLoadId: order.id,
        customerName: order.customerName,
        lane: `${order.origin} -> ${order.destination}`,
        origin: order.origin,
        destination: order.destination,
        pickupWindow: `${activeDriverDispatch.pickupDate} | ${activeDriverDispatch.pickupTime}`,
        deliveryWindow: `${activeDriverDispatch.deliveryDate} | ${activeDriverDispatch.deliveryTime}`,
        laneMiles,
        askRate,
        floorRate,
        rpm,
        urgency,
        bidType,
        equipment,
        region: destinationRegion,
        portalPublishedAt: portalSchedule.portalPublishedAt,
        biddingStartAt: portalSchedule.biddingStartAt,
        biddingEndAt: portalSchedule.biddingEndAt,
        score,
        weightLbs,
        dimensions: `${lengthFt} ft x ${widthFt} ft x ${heightFt} ft`,
        lengthFt,
        widthFt,
        heightFt,
        palletCount,
        pieceCount,
        commodity,
        handlingNotes,
        requiresHazmat,
        temperatureControl,
        requiresTeamDriver,
        loadPhotos: [
          { id: `${order.id}-dock`, label: 'Dock View', url: buildLoadPhoto(`${order.customerCode || 'LD'} Dock View`, '#2563eb') },
          { id: `${order.id}-inside`, label: 'Inside Cargo', url: buildLoadPhoto(`${order.customerCode || 'LD'} Inside Cargo`, '#0f766e') },
          { id: `${order.id}-seal`, label: 'Seal & Label', url: buildLoadPhoto(`${order.customerCode || 'LD'} Seal Check`, '#7c3aed') },
        ],
        note: urgency === 'High'
          ? 'Fast response lane. Portal bidding window is strict.'
          : urgency === 'Medium'
            ? 'Balanced lane. Prepare your manual bid before window starts.'
            : 'Lower pressure lane. Bid only in the scheduled window.',
      }
    })

    return [...manualBids, ...generatedBids]
  }, [activeDispatchMiles, activeDriverDispatch.deliveryDate, activeDriverDispatch.deliveryTime, activeDriverDispatch.loadType, activeDriverDispatch.pickupDate, activeDriverDispatch.pickupTime, manualBids, orders, portalBidSeedTime])

  const bidTypeOptions = useMemo(() => ['All Types', ...new Set(liveBidRows.map((bid) => bid.bidType))], [liveBidRows])
  const bidUrgencyOptions = ['All Urgency', 'High', 'Medium', 'Low']
  const bidEquipmentOptions = useMemo(() => ['All Equipment', ...new Set(liveBidRows.map((bid) => bid.equipment))], [liveBidRows])
  const bidRegionOptions = useMemo(() => ['All Regions', ...new Set(liveBidRows.map((bid) => bid.region))], [liveBidRows])

  const filteredBids = useMemo(() => {
    const query = bidSearchQuery.trim().toLowerCase()

    return liveBidRows.filter((bid) => {
      const typePass = bidFilters.type === 'All Types' || bid.bidType === bidFilters.type
      const urgencyPass = bidFilters.urgency === 'All Urgency' || bid.urgency === bidFilters.urgency
      const equipmentPass = bidFilters.equipment === 'All Equipment' || bid.equipment === bidFilters.equipment
      const regionPass = bidFilters.region === 'All Regions' || bid.region === bidFilters.region
      const queryPass = query.length === 0
        || bid.id.toLowerCase().includes(query)
        || bid.customerName.toLowerCase().includes(query)
        || bid.lane.toLowerCase().includes(query)
        || bid.equipment.toLowerCase().includes(query)

      return typePass && urgencyPass && equipmentPass && regionPass && queryPass
    })
  }, [bidFilters, bidSearchQuery, liveBidRows])

  const selectedBid = useMemo(() => {
    if (!selectedBidId) {
      return filteredBids[0] ?? null
    }

    return filteredBids.find((bid) => bid.id === selectedBidId) ?? filteredBids[0] ?? null
  }, [filteredBids, selectedBidId])

  const selectedBidPersonalDraft = useMemo(() => {
    if (!selectedBid) {
      return 0
    }

    const draftValue = Number(personalBidDraftById[selectedBid.id])
    if (!Number.isFinite(draftValue) || draftValue <= 0) {
      return selectedBid.askRate
    }

    return draftValue
  }, [personalBidDraftById, selectedBid])

  const selectedBidPersonalGapFromAsk = useMemo(() => {
    if (!selectedBid) {
      return 0
    }

    return Math.round(selectedBidPersonalDraft - selectedBid.askRate)
  }, [selectedBid, selectedBidPersonalDraft])

  const selectedBidManualAuction = useMemo(() => {
    if (!selectedBid) {
      return null
    }

    const auction = manualAuctionByBidId[selectedBid.id] ?? null
    const biddingStartAt = Number.isFinite(auction?.biddingStartAt) ? auction.biddingStartAt : selectedBid.biddingStartAt
    const biddingEndAt = Number.isFinite(auction?.biddingEndAt) ? auction.biddingEndAt : selectedBid.biddingEndAt
    const isOpen = manualAuctionNow >= biddingStartAt && manualAuctionNow < biddingEndAt
    const isClosed = manualAuctionNow >= biddingEndAt

    return {
      ...(auction ?? { participants: [], winnerId: null, nextAutoUpdateAt: biddingStartAt + 3500 }),
      biddingStartAt,
      biddingEndAt,
      isOpen,
      isClosed,
      opensInSeconds: Math.max(0, Math.ceil((biddingStartAt - manualAuctionNow) / 1000)),
      closesInSeconds: Math.max(0, Math.ceil((biddingEndAt - manualAuctionNow) / 1000)),
    }
  }, [manualAuctionByBidId, manualAuctionNow, selectedBid])

  const selectedBidManualRanking = useMemo(() => {
    if (!selectedBidManualAuction?.participants) {
      return []
    }

    return [...selectedBidManualAuction.participants].sort((left, right) => {
      if (right.amount !== left.amount) {
        return right.amount - left.amount
      }

      return right.updatedAt - left.updatedAt
    })
  }, [selectedBidManualAuction])

  const selectedBidManualLeader = selectedBidManualRanking[0] ?? null

  const selectedBidManualCountdown = useMemo(() => {
    if (!selectedBidManualAuction) {
      return '--:--'
    }

    if (selectedBidManualAuction.isClosed) {
      return '00:00'
    }

    if (!selectedBidManualAuction.isOpen) {
      return `T-${formatCountdownClock(selectedBidManualAuction.opensInSeconds)}`
    }

    return formatCountdownClock(selectedBidManualAuction.closesInSeconds)
  }, [selectedBidManualAuction])

  const selectedBidManualIsPreLive = Boolean(
    selectedBidManualAuction && !selectedBidManualAuction.isOpen && !selectedBidManualAuction.isClosed,
  )

  const selectedBidManualCanRevealData = Boolean(
    selectedBidManualAuction && (selectedBidManualAuction.isOpen || selectedBidManualAuction.isClosed),
  )

  const selectedBidManualDriverEntry = useMemo(() => {
    return selectedBidManualRanking.find((participant) => participant.isDriver) ?? null
  }, [selectedBidManualRanking])

  const selectedBidManualDriverRank = useMemo(() => {
    if (!selectedBidManualDriverEntry) {
      return null
    }

    const rank = selectedBidManualRanking.findIndex((participant) => participant.id === selectedBidManualDriverEntry.id)
    return rank >= 0 ? rank + 1 : null
  }, [selectedBidManualDriverEntry, selectedBidManualRanking])

  const selectedBidManualLeaderGap = useMemo(() => {
    if (!selectedBidManualLeader || !selectedBidManualDriverEntry) {
      return 0
    }

    return Math.round(selectedBidManualLeader.amount - selectedBidManualDriverEntry.amount)
  }, [selectedBidManualDriverEntry, selectedBidManualLeader])

  const selectedBidManualWinner = useMemo(() => {
    if (selectedBidManualAuction?.isClosed && selectedBidManualAuction.winnerId == null) {
      return selectedBidManualRanking[0] ?? null
    }

    if (!selectedBidManualAuction?.winnerId) {
      return null
    }

    return selectedBidManualRanking.find((participant) => participant.id === selectedBidManualAuction.winnerId) ?? null
  }, [selectedBidManualAuction?.isClosed, selectedBidManualAuction?.winnerId, selectedBidManualRanking])

  const selectedBidFitCheck = useMemo(() => {
    if (!selectedBid) {
      return null
    }

    const driverEquipment = activeDriverDispatch.loadType ?? 'Dry Van'
    const driverCapacityLbs = getEquipmentCapacityLbs(driverEquipment)
    const driverTrailerLengthFt = driverEquipment === 'Box Truck' ? 26 : 53
    const equipmentCompatible = driverEquipment === selectedBid.equipment
      || (driverEquipment === 'Reefer' && selectedBid.equipment === 'Refrigerated')
      || (driverEquipment === 'Refrigerated' && selectedBid.equipment === 'Reefer')
    const weightCompatible = (selectedBid.weightLbs ?? 0) <= driverCapacityLbs
    const sizeCompatible = (selectedBid.lengthFt ?? 0) <= driverTrailerLengthFt && (selectedBid.widthFt ?? 0) <= 8.6
    const hazmatCompatible = !selectedBid.requiresHazmat

    return {
      driverEquipment,
      driverCapacityLbs,
      driverTrailerLengthFt,
      equipmentCompatible,
      weightCompatible,
      sizeCompatible,
      hazmatCompatible,
      canTakeLoad: equipmentCompatible && weightCompatible && sizeCompatible && hazmatCompatible,
    }
  }, [activeDriverDispatch.loadType, selectedBid])

  useEffect(() => {
    if (!selectedBid) {
      return
    }

    setPersonalBidDraftById((previous) => {
      if (previous[selectedBid.id] != null) {
        return previous
      }

      return {
        ...previous,
        [selectedBid.id]: selectedBid.askRate,
      }
    })
  }, [selectedBid])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setManualAuctionNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const auctionIds = Object.keys(manualAuctionByBidId)
    if (auctionIds.length === 0) {
      return
    }

    setManualAuctionByBidId((previous) => {
      let hasChanges = false
      const now = Date.now()
      const nextState = { ...previous }

      auctionIds.forEach((bidId) => {
        const auction = previous[bidId]
        if (!auction) {
          return
        }

        const biddingStartAt = Number.isFinite(auction.biddingStartAt) ? auction.biddingStartAt : now
        const biddingEndAt = Number.isFinite(auction.biddingEndAt) ? auction.biddingEndAt : (biddingStartAt + (2 * 60 * 1000))
        const isOpen = now >= biddingStartAt && now < biddingEndAt

        if (now >= biddingEndAt) {
          if (auction.winnerId) {
            return
          }

          const ranked = [...auction.participants].sort((left, right) => {
            if (right.amount !== left.amount) {
              return right.amount - left.amount
            }

            return right.updatedAt - left.updatedAt
          })

          nextState[bidId] = {
            ...auction,
            biddingStartAt,
            biddingEndAt,
            winnerId: ranked[0]?.id ?? null,
          }
          hasChanges = true
          return
        }

        if (!isOpen) {
          return
        }

        if (now < (auction.nextAutoUpdateAt ?? 0)) {
          return
        }

        const competitors = auction.participants.filter((participant) => !participant.isDriver)
        if (competitors.length === 0) {
          nextState[bidId] = {
            ...auction,
            biddingStartAt,
            biddingEndAt,
            nextAutoUpdateAt: now + 5000,
          }
          hasChanges = true
          return
        }

        const chosen = competitors[Math.floor(Math.random() * competitors.length)]
        const increment = 20 + Math.floor(Math.random() * 45)
        const updatedParticipants = auction.participants.map((participant) => {
          if (participant.id !== chosen.id) {
            return participant
          }

          return {
            ...participant,
            amount: participant.amount + increment,
            updatedAt: now,
          }
        })

        nextState[bidId] = {
          ...auction,
          biddingStartAt,
          biddingEndAt,
          participants: updatedParticipants,
          nextAutoUpdateAt: now + 3500 + Math.floor(Math.random() * 2500),
        }
        hasChanges = true
      })

      return hasChanges ? nextState : previous
    })
  }, [manualAuctionByBidId, manualAuctionNow])

  const bidSummary = useMemo(() => {
    const openCount = filteredBids.filter((bid) => manualAuctionNow < bid.biddingEndAt).length
    const expiringSoon = filteredBids.filter((bid) => {
      const millisecondsLeft = bid.biddingEndAt - manualAuctionNow
      return millisecondsLeft > 0 && millisecondsLeft <= 30000
    }).length
    const avgRpm = openCount > 0
      ? filteredBids.reduce((total, bid) => total + bid.rpm, 0) / openCount
      : 0
    const potentialRevenue = filteredBids.reduce((total, bid) => total + bid.askRate, 0)
    const highFitCount = filteredBids.filter((bid) => bid.score >= 80).length

    return {
      openCount,
      expiringSoon,
      avgRpm,
      potentialRevenue,
      highFitCount,
    }
  }, [filteredBids, manualAuctionNow])

  const driverWonShipments = useMemo(() => {
    return liveBidRows.filter((bid) => {
      const auction = manualAuctionByBidId[bid.id]
      return auction?.winnerId === 'driver-self'
    })
  }, [liveBidRows, manualAuctionByBidId])

  const isCurrentDriverShipmentCompleted = useMemo(() => {
    const normalizedStatus = String(activeDriverDispatch.status ?? '').toLowerCase()
    return normalizedStatus.includes('delivered')
  }, [activeDriverDispatch.status])

  const queuedWonShipment = useMemo(() => {
    if (isCurrentDriverShipmentCompleted) {
      return null
    }

    return driverWonShipments[0] ?? null
  }, [driverWonShipments, isCurrentDriverShipmentCompleted])

  const driverRouteJourneyShipment = useMemo(() => {
    const normalize = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const extractNameParts = (value) => {
      const pieces = String(value ?? '').toLowerCase().split(' ').filter(Boolean)
      return {
        first: pieces[0] ?? '',
        last: pieces[pieces.length - 1] ?? '',
      }
    }

    const resolveRouteMap = (origin, destination, driverName) => {
      const normalizedOrigin = normalize(origin)
      const normalizedDestination = normalize(destination)
      const driverParts = extractNameParts(driverName)

      const directRoute = routesTracking.find((route) => {
        const routeOrigin = normalize(route.origin)
        const routeDestination = normalize(route.destination?.city)
        return routeOrigin === normalizedOrigin && routeDestination === normalizedDestination
      })
      if (directRoute) {
        return directRoute
      }

      const driverRoute = routesTracking.find((route) => {
        const routeDriverParts = extractNameParts(route.driver)
        const isLastNameMatch = driverParts.last && routeDriverParts.last && driverParts.last === routeDriverParts.last
        const isFirstNameClose = driverParts.first && routeDriverParts.first
          && (routeDriverParts.first.startsWith(driverParts.first[0]) || driverParts.first.startsWith(routeDriverParts.first[0]))
        return isLastNameMatch && isFirstNameClose
      })

      if (driverRoute) {
        return driverRoute
      }

      return routesTracking.find((route) => normalize(route.destination?.city) === normalizedDestination) ?? null
    }

    const estimateStopDuration = (label) => {
      const normalized = String(label ?? '').toLowerCase()
      if (normalized.includes('pickup')) {
        return '35 min halt'
      }

      if (normalized.includes('delivery')) {
        return '45 min unload + POD'
      }

      if (normalized.includes('fuel') || normalized.includes('checkpoint')) {
        return '20 min halt'
      }

      if (normalized.includes('rest')) {
        return '30 min break'
      }

      return '15 min stop'
    }

    const convertTimelineState = (statusValue) => {
      const normalized = String(statusValue ?? '').toLowerCase()
      if (normalized.includes('complete') || normalized.includes('approved')) {
        return 'done'
      }

      if (normalized.includes('delay')) {
        return 'warning'
      }

      if (normalized.includes('progress') || normalized.includes('active')) {
        return 'active'
      }

      return 'pending'
    }

    if (!isCurrentDriverShipmentCompleted) {
      const mappedRoute = resolveRouteMap(activeDriverDispatch.origin, activeDriverDispatch.destination, activeDriverDispatch.driver)
      const defaultProgress = activeDriverDispatch.status === 'In Transit'
        ? 52
        : activeDriverDispatch.status === 'Loading'
          ? 18
          : activeDriverDispatch.status === 'Assigned'
            ? 8
            : 0
      const normalizedProgress = Number.isFinite(Number(mappedRoute?.progress))
        ? Math.max(0, Math.min(100, Math.round(Number(mappedRoute.progress))))
        : defaultProgress

      return {
        sourceType: 'current-shipment',
        headerLabel: 'Current Shipment In Journey',
        id: activeDriverDispatch.id,
        loadId: activeDriverDispatch.id,
        customer: activeDriverDispatch.customer,
        driver: activeDriverDispatch.driver,
        truck: activeDriverDispatch.truck,
        equipment: activeDriverDispatch.loadType,
        priority: activeDriverDispatch.priority,
        status: activeDriverDispatch.status,
        origin: activeDriverDispatch.origin,
        destination: activeDriverDispatch.destination,
        pickupWindow: `${activeDriverDispatch.pickupDate} | ${activeDriverDispatch.pickupTime}`,
        deliveryWindow: `${activeDriverDispatch.deliveryDate} | ${activeDriverDispatch.deliveryTime}`,
        eta: activeDashboardOrder?.eta ?? `${activeDriverDispatch.deliveryDate}, ${activeDriverDispatch.deliveryTime}`,
        distanceRemaining: mappedRoute?.distanceRemaining ?? activeDriverDispatch.distance ?? '--',
        delayTime: mappedRoute?.delayTime ?? '0 min',
        progress: normalizedProgress,
        path: mappedRoute?.path?.length ? mappedRoute.path : dashboardRoutePath,
        currentLocation: mappedRoute?.currentLocation ?? {
          lat: activeShipmentPosition?.lat,
          lng: activeShipmentPosition?.lng,
          city: activeDriverDispatch.origin,
        },
        stops: (currentTripPlan?.timeline ?? []).map((stop, index) => ({
          id: `${stop.label}-${index}`,
          label: stop.label,
          location: stop.location,
          window: stop.window,
          state: convertTimelineState(stop.status),
          haltDuration: estimateStopDuration(stop.label),
        })),
        docs: currentTripPlan?.docs ?? [],
        checklist: currentTripPlan?.checklist ?? [],
        journeyNotes: currentTripPlan?.notes ?? {
          pickup: activeDriverDispatch.notes,
          enroute: 'Follow dispatcher check-in schedule.',
          delivery: 'Capture POD after unloading.',
        },
        winningAmount: null,
      }
    }

    const wonBid = driverWonShipments[0] ?? null
    if (!wonBid) {
      return null
    }

    const mappedRoute = resolveRouteMap(wonBid.origin, wonBid.destination, activeDriverDispatch.driver)
    const normalizedProgress = Number.isFinite(Number(mappedRoute?.progress))
      ? Math.max(0, Math.min(100, Math.round(Number(mappedRoute.progress))))
      : 0
    const winningAmount = (manualAuctionByBidId[wonBid.id]?.participants ?? []).find((participant) => participant.id === 'driver-self')?.amount ?? 0

    return {
      sourceType: 'won-bid-shipment',
      headerLabel: 'Won Bid Shipment Ready',
      id: wonBid.id,
      loadId: wonBid.sourceLoadId ?? wonBid.id,
      customer: wonBid.customerName,
      driver: activeDriverDispatch.driver,
      truck: activeDriverDispatch.truck,
      equipment: wonBid.equipment,
      priority: wonBid.urgency,
      status: mappedRoute?.status ?? 'Assigned',
      origin: wonBid.origin,
      destination: wonBid.destination,
      pickupWindow: wonBid.pickupWindow,
      deliveryWindow: wonBid.deliveryWindow,
      eta: mappedRoute?.eta ?? wonBid.deliveryWindow,
      distanceRemaining: mappedRoute?.distanceRemaining ?? `${wonBid.laneMiles ?? '--'} miles`,
      delayTime: mappedRoute?.delayTime ?? '0 min',
      progress: normalizedProgress,
      path: mappedRoute?.path?.length ? mappedRoute.path : dashboardRoutePath,
      currentLocation: mappedRoute?.currentLocation ?? {
        lat: activeShipmentPosition?.lat,
        lng: activeShipmentPosition?.lng,
        city: wonBid.origin,
      },
      stops: [
        {
          id: `${wonBid.id}-pickup`,
          label: 'Pickup',
          location: wonBid.origin,
          window: wonBid.pickupWindow,
          state: normalizedProgress > 5 ? 'done' : 'active',
          haltDuration: '35 min halt',
        },
        {
          id: `${wonBid.id}-transit`,
          label: 'In Transit Checkpoint',
          location: mappedRoute?.currentLocation?.city ?? 'Checkpoint assigned after dispatch release',
          window: mappedRoute?.etaHours ?? 'Monitor live GPS ETA',
          state: normalizedProgress > 5 ? 'active' : 'pending',
          haltDuration: '20 min halt',
        },
        {
          id: `${wonBid.id}-delivery`,
          label: 'Delivery',
          location: wonBid.destination,
          window: wonBid.deliveryWindow,
          state: normalizedProgress >= 99 ? 'done' : 'pending',
          haltDuration: '45 min unload + POD',
        },
      ],
      docs: ['BOL / Rate confirmation', 'Pickup gate appointment', 'POD submission packet'],
      checklist: [
        wonBid.handlingNotes || 'Handling instructions reviewed',
        wonBid.requiresHazmat ? 'Carry hazmat compliance documentation' : 'Hazmat not required for this lane',
        wonBid.temperatureControl ? 'Reefer temperature log active' : 'Standard dry lane setup confirmed',
      ],
      journeyNotes: {
        pickup: `Reach pickup point at ${wonBid.origin} inside scheduled window.`,
        enroute: 'Share checkpoint updates and keep lane timing aligned with portal commitment.',
        delivery: `Deliver at ${wonBid.destination} and upload signed POD immediately.`,
      },
      winningAmount,
    }
  }, [
    activeDashboardOrder?.eta,
    activeDriverDispatch,
    activeShipmentPosition?.lat,
    activeShipmentPosition?.lng,
    currentTripPlan,
    dashboardRoutePath,
    driverWonShipments,
    isCurrentDriverShipmentCompleted,
    manualAuctionByBidId,
    routesTracking,
  ])

  const driverJourneyPath = useMemo(() => {
    return Array.isArray(driverRouteJourneyShipment?.path) ? driverRouteJourneyShipment.path : []
  }, [driverRouteJourneyShipment?.path])

  const driverLiveMapPoint = useMemo(() => {
    if (driverJourneyPath.length > 0) {
      return driverJourneyPath[Math.min(driverLivePointIndex, driverJourneyPath.length - 1)]
    }

    if (
      Number.isFinite(driverRouteJourneyShipment?.currentLocation?.lat)
      && Number.isFinite(driverRouteJourneyShipment?.currentLocation?.lng)
    ) {
      return {
        lat: Number(driverRouteJourneyShipment.currentLocation.lat),
        lng: Number(driverRouteJourneyShipment.currentLocation.lng),
      }
    }

    return null
  }, [driverJourneyPath, driverLivePointIndex, driverRouteJourneyShipment?.currentLocation?.lat, driverRouteJourneyShipment?.currentLocation?.lng])

  const driverRouteProgressPercent = useMemo(() => {
    if (driverJourneyPath.length > 1) {
      return Math.round((driverLivePointIndex / (driverJourneyPath.length - 1)) * 100)
    }

    return Math.max(0, Math.min(100, Number(driverRouteJourneyShipment?.progress) || 0))
  }, [driverJourneyPath.length, driverLivePointIndex, driverRouteJourneyShipment?.progress])

  const driverLiveLocationLabel = useMemo(() => {
    if (!driverLiveMapPoint) {
      return 'Awaiting GPS ping'
    }

    const cityLabel = driverRouteJourneyShipment?.currentLocation?.city
    if (driverLivePointIndex === 0 && cityLabel) {
      return `${cityLabel} (live)`
    }

    return `${driverLiveMapPoint.lat.toFixed(4)}, ${driverLiveMapPoint.lng.toFixed(4)}`
  }, [driverLiveMapPoint, driverLivePointIndex, driverRouteJourneyShipment?.currentLocation?.city])

  const driverDirectGoogleMapsUrl = useMemo(() => {
    const origin = driverRouteJourneyShipment?.origin ?? ''
    const destination = driverRouteJourneyShipment?.destination ?? ''

    if (!origin || !destination) {
      return 'https://www.google.com/maps?output=embed'
    }

    return `https://www.google.com/maps?output=embed&saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(destination)}&dirflg=d`
  }, [driverRouteJourneyShipment?.destination, driverRouteJourneyShipment?.origin])

  const driverMessageQuickTemplates = useMemo(() => ([
    { id: 'delay-risk', label: 'Delay Risk', text: 'Delay risk due to traffic near next checkpoint. Need ETA extension.', category: 'delay', priority: 'high' },
    { id: 'fuel-stop', label: 'Fuel Stop', text: 'Need approved fuel stop update for current lane.', category: 'fuel', priority: 'normal' },
    { id: 'route-support', label: 'Route Support', text: 'Please confirm best alternate route for current congestion.', category: 'route', priority: 'normal' },
    { id: 'dock-update', label: 'Dock Update', text: 'Please re-confirm pickup/delivery dock appointment timing.', category: 'dock', priority: 'normal' },
  ]), [])

  const driverNextCheckInCountdown = useMemo(() => {
    if (!driverRouteJourneyShipment) {
      return '--:--'
    }

    const now = Date.now()
    const reference = driverMessageLastSentAt ? new Date(driverMessageLastSentAt).getTime() : now
    const nextCheckInAt = reference + (15 * 60 * 1000)
    return formatCountdownClock(Math.max(0, Math.ceil((nextCheckInAt - now) / 1000)))
  }, [driverMessageLastSentAt, driverRouteJourneyShipment])

  const handleUseDriverMessageTemplate = (template) => {
    setDriverMessageDraft(template.text)
    setDriverMessageCategory(template.category)
    setDriverMessagePriority(template.priority)
  }

  const handleSendDriverMessage = async () => {
    if (!driverRouteJourneyShipment) {
      return
    }

    const trimmedMessage = driverMessageDraft.trim()
    if (!trimmedMessage) {
      setDriverMessageState('error')
      return
    }

    setDriverMessageState('sending')
    try {
      const response = await fetch(buildApiUrl('/api/driver-message'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId: driverRouteJourneyShipment.id,
          loadId: driverRouteJourneyShipment.loadId,
          driver: driverRouteJourneyShipment.driver,
          message: trimmedMessage,
          category: driverMessageCategory,
          priority: driverMessagePriority,
          sentAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('Message upload failed')
      }

      const payload = await response.json()
      const sentRecord = payload?.record ?? {
        id: `msg-${Date.now()}`,
        message: trimmedMessage,
        category: driverMessageCategory,
        priority: driverMessagePriority,
        sentAt: new Date().toISOString(),
      }

      setDriverMessageHistory((previous) => [sentRecord, ...previous].slice(0, 6))
      setDriverMessageLastSentAt(payload?.receivedAt ?? new Date().toISOString())
      setDriverMessageDraft('')
      setDriverMessageState('sent')
    } catch {
      setDriverMessageState('error')
    }
  }

  const handleMarkDriverCheckIn = () => {
    setDriverMessageLastSentAt(new Date().toISOString())
    setDriverMessageState('sent')
  }

  useEffect(() => {
    setDriverLivePointIndex(0)
    setDriverLiveUploadState('idle')
    setDriverLiveLastUploadedAt(null)
    setDriverMessageDraft('')
    setDriverMessageCategory('general')
    setDriverMessagePriority('normal')
    setDriverMessageState('idle')
    setDriverMessageLastSentAt(null)
    setDriverMessageHistory([])
    previousDriverLivePointRef.current = null
  }, [driverRouteJourneyShipment?.id])

  useEffect(() => {
    if (!driverRouteJourneyShipment?.id || driverJourneyPath.length <= 1) {
      return
    }

    const progressSeed = Math.max(0, Math.min(100, Number(driverRouteJourneyShipment.progress) || 0))
    const seededIndex = Math.round((progressSeed / 100) * (driverJourneyPath.length - 1))
    setDriverLivePointIndex(Math.max(0, Math.min(driverJourneyPath.length - 1, seededIndex)))
  }, [driverJourneyPath.length, driverRouteJourneyShipment?.id, driverRouteJourneyShipment?.progress])

  useEffect(() => {
    if (activeSection !== 'routes' || !driverRouteJourneyShipment?.id || !driverLiveMapPoint) {
      return
    }

    let isCancelled = false
    const uploadDriverLocation = async () => {
      const previousPoint = previousDriverLivePointRef.current
      let computedSpeed = driverRouteJourneyShipment.status === 'In Transit' ? 42 : 18

      if (previousPoint) {
        const distanceMiles = calculateDistanceMiles(previousPoint, driverLiveMapPoint)
        const estimatedSpeed = Math.round((distanceMiles * 3600) / 10)
        computedSpeed = Math.max(8, Math.min(75, Number.isFinite(estimatedSpeed) ? estimatedSpeed : 0))
      }

      previousDriverLivePointRef.current = driverLiveMapPoint

      setDriverLiveUploadState('uploading')
      try {
        const response = await fetch(buildApiUrl('/api/driver-location'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shipmentId: driverRouteJourneyShipment.id,
            loadId: driverRouteJourneyShipment.loadId,
            driver: driverRouteJourneyShipment.driver,
            latitude: driverLiveMapPoint.lat,
            longitude: driverLiveMapPoint.lng,
            speedMph: computedSpeed,
            recordedAt: new Date().toISOString(),
            source: driverRouteJourneyShipment.sourceType,
          }),
        })

        if (!response.ok) {
          throw new Error('Location upload failed')
        }

        const payload = await response.json()
        if (isCancelled) {
          return
        }

        setDriverLiveUploadState('sent')
        setDriverLiveLastUploadedAt(payload?.receivedAt ?? new Date().toISOString())
      } catch {
        if (isCancelled) {
          return
        }

        setDriverLiveUploadState('error')
      }
    }

    uploadDriverLocation()

    return () => {
      isCancelled = true
    }
  }, [
    activeSection,
    driverLiveMapPoint,
    driverRouteJourneyShipment?.driver,
    driverRouteJourneyShipment?.id,
    driverRouteJourneyShipment?.loadId,
    driverRouteJourneyShipment?.status,
    driverRouteJourneyShipment?.sourceType,
  ])

  const toggleWatchBid = (bidId) => {
    setWatchedBidIds((previous) => {
      if (previous.includes(bidId)) {
        return previous.filter((id) => id !== bidId)
      }

      return [...previous, bidId]
    })
  }

  const showBidActionMessage = (message) => {
    setBidActionMessage(message)
  }

  const createManualAuctionSession = (bid) => {
    const now = Date.now()
    const biddingStartAt = Number.isFinite(bid.biddingStartAt) ? bid.biddingStartAt : now + 20000
    const biddingEndAt = Number.isFinite(bid.biddingEndAt) ? bid.biddingEndAt : biddingStartAt + (2 * 60 * 1000)
    const entryBid = Math.max(300, Math.round(bid.floorRate * 0.94))

    return {
      biddingStartAt,
      biddingEndAt,
      nextAutoUpdateAt: biddingStartAt + 3500,
      winnerId: null,
      participants: [
        {
          id: 'driver-self',
          name: 'You (Driver)',
          amount: entryBid,
          updatedAt: now,
          isDriver: true,
        },
        {
          id: 'carrier-atlas',
          name: 'Atlas Freight',
          amount: entryBid + 35,
          updatedAt: biddingStartAt,
          isDriver: false,
        },
        {
          id: 'carrier-rapid',
          name: 'Rapid Haul LLC',
          amount: entryBid + 10,
          updatedAt: biddingStartAt,
          isDriver: false,
        },
        {
          id: 'carrier-north',
          name: 'Northline Carriers',
          amount: entryBid + 20,
          updatedAt: biddingStartAt,
          isDriver: false,
        },
      ],
    }
  }

  const handleOpenManualBidding = (bid) => {
    const now = Date.now()
    const opensAt = Number.isFinite(bid.biddingStartAt) ? bid.biddingStartAt : now + 20000
    const closesAt = Number.isFinite(bid.biddingEndAt) ? bid.biddingEndAt : opensAt + (2 * 60 * 1000)

    if (now >= closesAt) {
      showBidActionMessage(`Bidding window for ${bid.id} is closed.`)
      return
    }

    setSelectedBidId(bid.id)
    setIsBidDetailsPanelOpen(true)
    setBidDetailsTab('Manual Bidding')
    setManualAuctionByBidId((previous) => {
      if (previous[bid.id]) {
        return previous
      }

      return {
        ...previous,
        [bid.id]: createManualAuctionSession(bid),
      }
    })

    if (now < opensAt) {
      const secondsToStart = Math.max(0, Math.ceil((opensAt - now) / 1000))
      showBidActionMessage(`Manual panel opened for ${bid.id}. Live window starts in ${formatCountdownClock(secondsToStart)}.`)
      return
    }

    showBidActionMessage(`Manual bidding opened for ${bid.id}.`) 
  }

  const handlePlaceManualAuctionBid = (bid) => {
    const draft = Number(personalBidDraftById[bid.id])
    if (!Number.isFinite(draft) || draft <= 0) {
      showBidActionMessage('Enter a valid bid amount before submitting to live auction.')
      return
    }

    const roundedDraft = Math.round(draft)
    const now = Date.now()
    let auctionClosed = false
    let auctionNotStarted = false
    let secondsToStart = 0

    setManualAuctionByBidId((previous) => {
      const existingAuction = previous[bid.id] ?? createManualAuctionSession(bid)
      const biddingStartAt = Number.isFinite(existingAuction.biddingStartAt) ? existingAuction.biddingStartAt : now
      const biddingEndAt = Number.isFinite(existingAuction.biddingEndAt) ? existingAuction.biddingEndAt : (biddingStartAt + (2 * 60 * 1000))

      if (now < biddingStartAt) {
        auctionNotStarted = true
        secondsToStart = Math.ceil((biddingStartAt - now) / 1000)
        return {
          ...previous,
          [bid.id]: {
            ...existingAuction,
            biddingStartAt,
            biddingEndAt,
          },
        }
      }

      if (now >= biddingEndAt) {
        auctionClosed = true
        return previous
      }

      const hasSelf = existingAuction.participants.some((participant) => participant.id === 'driver-self')
      const nextParticipants = hasSelf
        ? existingAuction.participants.map((participant) => {
          if (participant.id !== 'driver-self') {
            return participant
          }

          return {
            ...participant,
            amount: roundedDraft,
            updatedAt: now,
          }
        })
        : [
          ...existingAuction.participants,
          {
            id: 'driver-self',
            name: 'You (Driver)',
            amount: roundedDraft,
            updatedAt: now,
            isDriver: true,
          },
        ]

      return {
        ...previous,
        [bid.id]: {
          ...existingAuction,
          biddingStartAt,
          biddingEndAt,
          participants: nextParticipants,
        },
      }
    })

    if (auctionNotStarted) {
      showBidActionMessage(`Bidding for ${bid.id} starts in ${formatCountdownClock(secondsToStart)}.`)
      return
    }

    if (auctionClosed) {
      showBidActionMessage(`Auction for ${bid.id} is already closed.`)
      return
    }

    showBidActionMessage(`Live bid submitted: ${formatCurrencyValue(roundedDraft)} on ${bid.id}.`)
  }

  const handleOpenBidDetails = (bidId) => {
    setSelectedBidId(bidId)
    setBidDetailsTab('Overview')
    setIsBidDetailsPanelOpen(true)
  }

  const handleBidDetailsTabChange = (tab) => {
    if (tab !== 'Manual Bidding') {
      setBidDetailsTab(tab)
      return
    }

    if (!selectedBid) {
      return
    }

    const now = Date.now()
    const opensAt = selectedBid.biddingStartAt
    const closesAt = selectedBid.biddingEndAt

    if (now >= closesAt) {
      showBidActionMessage(`Bidding window for ${selectedBid.id} is closed.`)
      return
    }

    setManualAuctionByBidId((previous) => {
      if (previous[selectedBid.id]) {
        return previous
      }

      return {
        ...previous,
        [selectedBid.id]: createManualAuctionSession(selectedBid),
      }
    })
    setBidDetailsTab('Manual Bidding')

    if (now < opensAt) {
      const secondsToStart = Math.max(0, Math.ceil((opensAt - now) / 1000))
      showBidActionMessage(`Manual panel opened. Live bidding starts in ${formatCountdownClock(secondsToStart)}.`)
    }
  }

  const handleImportBidSheet = () => {
    bidSheetInputRef.current?.click()
  }

  const parseCsvBidRows = (rawText) => {
    const source = String(rawText ?? '').replace(/^\uFEFF/, '')
    const lines = source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length < 2) {
      return []
    }

    const parseCsvLine = (line) => {
      const values = []
      let current = ''
      let inQuotes = false

      for (let index = 0; index < line.length; index += 1) {
        const character = line[index]

        if (character === '"') {
          if (inQuotes && line[index + 1] === '"') {
            current += '"'
            index += 1
          } else {
            inQuotes = !inQuotes
          }
          continue
        }

        if (character === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
          continue
        }

        current += character
      }

      values.push(current.trim())
      return values
    }

    const headers = parseCsvLine(lines[0])

    return lines.slice(1).map((line) => {
      const columns = parseCsvLine(line)
      const row = {}

      headers.forEach((header, index) => {
        row[header] = columns[index] ?? ''
      })

      return row
    })
  }

  const normalizeBidImportKey = (value) => {
    return String(value ?? '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '')
  }

  const readImportedBidValue = (row, aliases) => {
    for (const alias of aliases) {
      const candidate = row[alias]
      if (candidate !== undefined && String(candidate).trim() !== '') {
        return candidate
      }
    }

    return ''
  }

  const parseImportedBidBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') {
      return value
    }

    const normalized = String(value ?? '').trim().toLowerCase()
    if (!normalized) {
      return fallback
    }

    if (['true', 'yes', 'y', '1'].includes(normalized)) {
      return true
    }

    if (['false', 'no', 'n', '0'].includes(normalized)) {
      return false
    }

    return fallback
  }

  const handleBidSheetSelection = async (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const normalizedName = String(file.name ?? '').toLowerCase()
      const isCsv = normalizedName.endsWith('.csv')
      const isJson = normalizedName.endsWith('.json')

      if (!isCsv && !isJson) {
        throw new Error('Only CSV and JSON bid sheets are supported in this dashboard build.')
      }

      const text = await file.text()
      let importedRows = []

      if (isJson) {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed)) {
          importedRows = parsed
        } else if (Array.isArray(parsed?.bids)) {
          importedRows = parsed.bids
        }
      } else {
        importedRows = parseCsvBidRows(text)
      }

      const nonEmptyRows = importedRows
        .filter((row) => row && typeof row === 'object')
        .filter((row) => Object.values(row).some((value) => String(value ?? '').trim() !== ''))

      if (nonEmptyRows.length === 0) {
        throw new Error('No bid rows were found in the selected file.')
      }

      const templateBid = selectedBid ?? filteredBids[0] ?? null
      const importSeed = Date.now().toString().slice(-6)
      const importedBids = nonEmptyRows.slice(0, 25).map((rawRow, index) => {
        const normalizedRow = Object.entries(rawRow).reduce((accumulator, [key, value]) => {
          accumulator[normalizeBidImportKey(key)] = value
          return accumulator
        }, {})

        const rowIndexLabel = String(index + 1).padStart(2, '0')
        const portalSchedule = buildPortalBidSchedule(portalBidSeedTime, orders.length + manualBids.length + index + 1)
        const sourceLoadId = String(readImportedBidValue(normalizedRow, ['sourceloadid', 'loadid', 'loadcode']) || `IMPORTED-LOAD-${importSeed}-${rowIndexLabel}`).trim()
        const customerName = String(readImportedBidValue(normalizedRow, ['customername', 'customer', 'client']) || templateBid?.customerName || 'Imported Account').trim()
        const origin = String(readImportedBidValue(normalizedRow, ['origin', 'pickupcity']) || templateBid?.origin || 'Unknown Origin').trim()
        const destination = String(readImportedBidValue(normalizedRow, ['destination', 'deliverycity']) || templateBid?.destination || 'Unknown Destination').trim()
        const lane = String(readImportedBidValue(normalizedRow, ['lane']) || `${origin} -> ${destination}`).trim()
        const laneMiles = Math.max(50, parseNumericValue(readImportedBidValue(normalizedRow, ['lanemiles', 'miles', 'distance'])) || templateBid?.laneMiles || 280)
        const askRate = Math.max(300, Math.round(parseNumericValue(readImportedBidValue(normalizedRow, ['askrate', 'ask', 'bidrate', 'rate'])) || templateBid?.askRate || 1850))
        const floorRate = Math.max(250, Math.round(parseNumericValue(readImportedBidValue(normalizedRow, ['floorrate', 'floor', 'minrate'])) || (askRate * 0.9)))
        const equipment = String(readImportedBidValue(normalizedRow, ['equipment', 'trucktype']) || templateBid?.equipment || activeDriverDispatch.loadType || 'Dry Van').trim()
        const urgency = String(readImportedBidValue(normalizedRow, ['urgency', 'priority']) || templateBid?.urgency || 'Medium').trim()
        const bidType = String(readImportedBidValue(normalizedRow, ['bidtype', 'type']) || 'Manual').trim()
        const region = String(readImportedBidValue(normalizedRow, ['region']) || templateBid?.region || 'US').trim()
        const weightLbs = Math.max(1000, Math.round(parseNumericValue(readImportedBidValue(normalizedRow, ['weightlbs', 'weight'])) || templateBid?.weightLbs || 16000))
        const requiresHazmat = parseImportedBidBoolean(readImportedBidValue(normalizedRow, ['requireshazmat', 'hazmat']), templateBid?.requiresHazmat ?? false)
        const temperatureControl = parseImportedBidBoolean(readImportedBidValue(normalizedRow, ['temperaturecontrol', 'reefer']), templateBid?.temperatureControl ?? false)
        const requiresTeamDriver = parseImportedBidBoolean(readImportedBidValue(normalizedRow, ['requiresteamdriver', 'teamdriver']), templateBid?.requiresTeamDriver ?? false)
        const commodity = String(readImportedBidValue(normalizedRow, ['commodity']) || templateBid?.commodity || 'General merchandise pallets').trim()
        const handlingNotes = String(readImportedBidValue(normalizedRow, ['handlingnotes', 'notes', 'note']) || templateBid?.handlingNotes || 'Driver assist unloading expected').trim()
        const pickupWindow = String(readImportedBidValue(normalizedRow, ['pickupwindow', 'pickup']) || templateBid?.pickupWindow || `${activeDriverDispatch.pickupDate} | ${activeDriverDispatch.pickupTime}`).trim()
        const deliveryWindow = String(readImportedBidValue(normalizedRow, ['deliverywindow', 'delivery']) || templateBid?.deliveryWindow || `${activeDriverDispatch.deliveryDate} | ${activeDriverDispatch.deliveryTime}`).trim()
        const rpm = laneMiles > 0 ? askRate / laneMiles : 0
        const score = Math.max(55, Math.min(96, Math.round((rpm * 42) + (urgency === 'High' ? 14 : urgency === 'Medium' ? 8 : 2))))

        return {
          id: `BID-IMP-${importSeed}-${rowIndexLabel}`,
          sourceLoadId,
          customerName,
          lane,
          origin,
          destination,
          pickupWindow,
          deliveryWindow,
          laneMiles,
          askRate,
          floorRate,
          rpm,
          urgency,
          bidType,
          equipment,
          region,
          portalPublishedAt: portalSchedule.portalPublishedAt,
          biddingStartAt: portalSchedule.biddingStartAt,
          biddingEndAt: portalSchedule.biddingEndAt,
          score,
          weightLbs,
          dimensions: templateBid?.dimensions ?? '53 ft x 8.5 ft x 9 ft',
          lengthFt: templateBid?.lengthFt ?? 53,
          widthFt: templateBid?.widthFt ?? 8.5,
          heightFt: templateBid?.heightFt ?? 9,
          palletCount: templateBid?.palletCount ?? Math.max(8, Math.round(weightLbs / 2100)),
          pieceCount: templateBid?.pieceCount ?? Math.max(120, Math.round(weightLbs / 95)),
          commodity,
          handlingNotes,
          requiresHazmat,
          temperatureControl,
          requiresTeamDriver,
          loadPhotos: templateBid?.loadPhotos ?? [
            { id: `import-${rowIndexLabel}-dock`, label: 'Dock View', url: buildLoadPhoto('Imported Bid Dock View', '#2563eb') },
            { id: `import-${rowIndexLabel}-cargo`, label: 'Inside Cargo', url: buildLoadPhoto('Imported Bid Cargo', '#0f766e') },
            { id: `import-${rowIndexLabel}-seal`, label: 'Seal & Label', url: buildLoadPhoto('Imported Bid Seal Check', '#7c3aed') },
          ],
          note: `Imported from ${file.name}.`,
        }
      })

      if (importedBids.length === 0) {
        throw new Error('No valid bid rows were mapped from the selected file.')
      }

      setManualBids((previous) => [...importedBids, ...previous])
      setSelectedBidId(importedBids[0].id)
      setBidDetailsTab('Overview')
      setIsBidDetailsPanelOpen(true)
      setLastImportedBidSheet(file.name)
      showBidActionMessage(`Imported ${importedBids.length} bid${importedBids.length === 1 ? '' : 's'} from ${file.name}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import bid sheet.'
      showBidActionMessage(message)
    } finally {
      event.target.value = ''
    }
  }

  const handleCreateManualBid = () => {
    const templateBid = selectedBid ?? filteredBids[0] ?? null
    const nextIndex = manualBids.length + 1
    const laneMiles = templateBid?.laneMiles ?? 280
    const askRate = templateBid ? Math.round(templateBid.askRate * 1.02) : 1850
    const floorRate = Math.round(askRate * 0.9)
    const portalSchedule = buildPortalBidSchedule(portalBidSeedTime, orders.length + nextIndex)

    const manualBid = {
      id: `BID-MAN-${String(nextIndex).padStart(3, '0')}`,
      sourceLoadId: templateBid?.sourceLoadId ?? `MANUAL-LOAD-${String(nextIndex).padStart(3, '0')}`,
      customerName: templateBid?.customerName ?? 'Manual Account',
      lane: templateBid?.lane ?? 'Chicago, IL -> Detroit, MI',
      origin: templateBid?.origin ?? 'Chicago, IL',
      destination: templateBid?.destination ?? 'Detroit, MI',
      pickupWindow: templateBid?.pickupWindow ?? `${activeDriverDispatch.pickupDate} | ${activeDriverDispatch.pickupTime}`,
      deliveryWindow: templateBid?.deliveryWindow ?? `${activeDriverDispatch.deliveryDate} | ${activeDriverDispatch.deliveryTime}`,
      laneMiles,
      askRate,
      floorRate,
      rpm: laneMiles > 0 ? askRate / laneMiles : 0,
      urgency: 'Medium',
      bidType: 'Manual',
      equipment: templateBid?.equipment ?? activeDriverDispatch.loadType ?? 'Dry Van',
      region: templateBid?.region ?? 'US',
      portalPublishedAt: portalSchedule.portalPublishedAt,
      biddingStartAt: portalSchedule.biddingStartAt,
      biddingEndAt: portalSchedule.biddingEndAt,
      score: templateBid?.score ?? 78,
      weightLbs: templateBid?.weightLbs ?? 16000,
      dimensions: templateBid?.dimensions ?? '53 ft x 8.5 ft x 9 ft',
      lengthFt: templateBid?.lengthFt ?? 53,
      widthFt: templateBid?.widthFt ?? 8.5,
      heightFt: templateBid?.heightFt ?? 9,
      palletCount: templateBid?.palletCount ?? 12,
      pieceCount: templateBid?.pieceCount ?? 240,
      commodity: templateBid?.commodity ?? 'General merchandise pallets',
      handlingNotes: templateBid?.handlingNotes ?? 'Driver assist unloading expected',
      requiresHazmat: templateBid?.requiresHazmat ?? false,
      temperatureControl: templateBid?.temperatureControl ?? false,
      requiresTeamDriver: templateBid?.requiresTeamDriver ?? false,
      loadPhotos: templateBid?.loadPhotos ?? [
        { id: 'manual-dock', label: 'Dock View', url: buildLoadPhoto('Manual Bid Dock View', '#2563eb') },
        { id: 'manual-cargo', label: 'Inside Cargo', url: buildLoadPhoto('Manual Bid Inside Cargo', '#0f766e') },
        { id: 'manual-seal', label: 'Seal & Label', url: buildLoadPhoto('Manual Bid Seal Check', '#7c3aed') },
      ],
      note: 'Manual bid created with portal schedule. Panel opens 10s before bidding starts.',
    }

    setManualBids((previous) => [manualBid, ...previous])
    setSelectedBidId(manualBid.id)
    setBidDetailsTab('Overview')
    setIsBidDetailsPanelOpen(true)
    showBidActionMessage(`Manual bid ${manualBid.id} created with portal time.`)
  }

  const handlePersonalBidDraftChange = (bidId, nextValue) => {
    const parsed = Number.parseFloat(String(nextValue).replace(/[^0-9.]/g, ''))
    setPersonalBidDraftById((previous) => ({
      ...previous,
      [bidId]: Number.isFinite(parsed) ? parsed : 0,
    }))
  }

  const handlePersonalBidPreset = (bid, presetKey) => {
    let nextValue = bid.askRate

    if (presetKey === 'ask') {
      nextValue = bid.askRate
    } else if (presetKey === 'floor') {
      nextValue = bid.floorRate
    } else if (presetKey === 'plus-100') {
      nextValue = bid.askRate + 100
    } else if (presetKey === 'minus-100') {
      nextValue = Math.max(bid.floorRate, bid.askRate - 100)
    }

    setPersonalBidDraftById((previous) => ({
      ...previous,
      [bid.id]: nextValue,
    }))
    showBidActionMessage(`Personal bid draft set to ${formatCurrencyValue(nextValue)} for ${bid.id}.`)
  }

  const handleSavePersonalBid = (bid) => {
    const draft = Number(personalBidDraftById[bid.id])
    if (!Number.isFinite(draft) || draft <= 0) {
      showBidActionMessage('Enter a valid personal bid amount first.')
      return
    }

    showBidActionMessage(`Saved personal bid ${formatCurrencyValue(draft)} for ${bid.id}.`)
  }

  useEffect(() => {
    if (filteredBids.length === 0) {
      if (selectedBidId !== null) {
        setSelectedBidId(null)
      }
      return
    }

    const isVisible = selectedBidId ? filteredBids.some((bid) => bid.id === selectedBidId) : false
    if (!isVisible) {
      setSelectedBidId(filteredBids[0].id)
    }
  }, [filteredBids, selectedBidId])

  useEffect(() => {
    if (!bidActionMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setBidActionMessage('')
    }, 3000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [bidActionMessage])

  useEffect(() => {
    if (!walletActionMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setWalletActionMessage('')
    }, 3200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [walletActionMessage])

  useEffect(() => {
    if (activeSection !== 'drivers' && isBidDetailsPanelOpen) {
      setIsBidDetailsPanelOpen(false)
    }
  }, [activeSection, isBidDetailsPanelOpen])

  useEffect(() => {
    if (activeSection !== 'drivers' || !isBidDetailsPanelOpen || !selectedBid) {
      return
    }

    if (autoClosedBidIds.includes(selectedBid.id)) {
      return
    }

    if (manualAuctionNow < selectedBid.biddingEndAt) {
      return
    }

    setIsBidDetailsPanelOpen(false)
    setAutoClosedBidIds((previous) => (previous.includes(selectedBid.id) ? previous : [...previous, selectedBid.id]))
    showBidActionMessage(`Bidding panel for ${selectedBid.id} closed automatically after 2 minutes.`)
  }, [activeSection, autoClosedBidIds, isBidDetailsPanelOpen, manualAuctionNow, selectedBid])

  useEffect(() => {
    if (!selectedWeeklyPlanId) {
      return
    }

    const isStillVisible = driverWeeklyPlans.some((plan) => plan.id === selectedWeeklyPlanId)
    if (!isStillVisible) {
      setSelectedWeeklyPlanId(null)
    }
  }, [driverWeeklyPlans, selectedWeeklyPlanId])

  useEffect(() => {
    if (activeSection !== 'dashboard' && selectedWeeklyPlanId) {
      setSelectedWeeklyPlanId(null)
    }
  }, [activeSection, selectedWeeklyPlanId])

  useEffect(() => {
    if (dashboardLocationFilterIndex < dashboardLocationFilterOptions.length) {
      return
    }

    setDashboardLocationFilterIndex(0)
  }, [dashboardLocationFilterIndex, dashboardLocationFilterOptions.length])

  useEffect(() => {
    setIsReceiverSignatureCleared(false)
  }, [activeDriverDispatch.id, currentTripPlan?.id])

  return (
      <div className="h-screen w-full bg-slate-50 text-slate-900">
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
            <header className="min-h-[84px] border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
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
                    value={dashboardDateFilterIndex}
                    onChange={handleDashboardDateFilterChange}
                    className="bg-transparent text-sm text-slate-700 focus:outline-none"
                    aria-label="Dashboard date range"
                  >
                    {DASHBOARD_DATE_FILTER_OPTIONS.map((label, index) => (
                      <option key={label} value={index}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </label>

                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                  <MapPinned className="h-4 w-4 text-slate-400" />
                  <select
                    value={dashboardLocationFilterIndex}
                    onChange={handleDashboardLocationFilterChange}
                    className="bg-transparent text-sm text-slate-700 focus:outline-none"
                    aria-label="Dashboard location scope"
                  >
                    {dashboardLocationFilterOptions.map((label, index) => (
                      <option key={`${label}-${index}`} value={index}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </label>

                <div className="ml-auto flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveSection('settings')}
                    className="relative rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
                    aria-label="Open notification preferences"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1 top-1 block h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
                  </button>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{activeDriverDispatch.driver}</p>
                      <p className="text-xs text-slate-500">Driver | {activeDriverDispatch.truck}</p>
                    </div>
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {getInitials(activeDriverDispatch.driver)}
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
              <>
                <section className="dashboard-scrollbar h-[calc(100vh-85px)] overflow-y-auto bg-[#f3f5fa] px-3 py-4 sm:px-5 lg:px-6">
                <div className="mx-auto w-full max-w-[1320px] space-y-4 pb-4">
                  <div className="grid gap-3 lg:grid-cols-2">
                    <article className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3.5 text-white shadow-[0_16px_40px_-30px_rgba(37,99,235,0.9)]">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/15">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[0.92rem] font-bold tracking-tight">Next Pickup Reminder</p>
                        <p className="mt-0.5 text-[0.76rem] font-medium text-blue-100">
                          Newark, NJ dock check-in by 08:15 AM | Load LOAD-FF-1002
                        </p>
                      </div>
                    </article>

                    <article className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-[#f8efe0] to-[#f6e8d3] px-4 py-3.5 shadow-[0_16px_40px_-34px_rgba(180,83,9,0.7)]">
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[0.92rem] font-bold tracking-tight text-amber-900">Live Road Advisory</p>
                        <p className="mt-0.5 text-[0.76rem] font-medium text-amber-800/80">
                          Weather patch near Akron. Reduce speed and keep dispatch updated.
                        </p>
                      </div>
                    </article>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    {metrics.slice(0, 6).map((metric) => {
                      const Icon = metricIcons[metric.icon] ?? Truck
                      const isRevenue = metric.id === 'revenue'
                      const isExceptions = metric.id === 'exceptions'

                      return (
                        <article
                          key={metric.id}
                          className={`rounded-2xl border px-4 py-3.5 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.45)] ${isRevenue
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 bg-white text-slate-900'
                            }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={`text-[0.7rem] font-bold uppercase tracking-[0.08em] ${isRevenue ? 'text-blue-100' : 'text-slate-500'}`}>
                                {metric.label}
                              </p>
                              <p className={`mt-1 text-[1.85rem] font-black leading-none tracking-tight ${isRevenue ? 'text-white' : 'text-slate-900'}`}>
                                {metric.value}
                              </p>
                            </div>
                            <div className={`grid h-8 w-8 place-items-center rounded-lg ${isRevenue ? 'bg-white/15 text-white' : metric.iconTone}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                          </div>

                          <div className="mt-2.5 flex items-center gap-1.5">
                            {isExceptions ? <AlertTriangle className="h-3.5 w-3.5 text-rose-500" /> : <TrendingUp className={`h-3.5 w-3.5 ${isRevenue ? 'text-blue-100' : 'text-emerald-500'}`} />}
                            <p className={`text-[0.72rem] font-semibold ${isRevenue ? 'text-blue-100' : metric.noteTone}`}>
                              {metric.note}
                            </p>
                          </div>
                        </article>
                      )
                    })}
                  </div>

                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.95fr)_minmax(300px,0.95fr)]">
                    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_44px_-34px_rgba(15,23,42,0.5)]">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                            <h2 className="text-[1.55rem] font-black tracking-tight text-slate-900">Live Driver Route</h2>
                          </div>
                          <p className="mt-0.5 text-[0.74rem] font-semibold text-slate-500">{activeDashboardRouteLabel}</p>
                        </div>
                        <div className="flex items-center rounded-xl bg-slate-100 p-1">
                          <button
                            type="button"
                            onClick={() => setDashboardRouteViewMode('map')}
                            className={`rounded-lg px-3 py-1.5 text-[0.72rem] font-bold ${dashboardRouteViewMode === 'map' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            Map View
                          </button>
                          <button
                            type="button"
                            onClick={() => setDashboardRouteViewMode('grid')}
                            className={`rounded-lg px-3 py-1.5 text-[0.72rem] font-bold ${dashboardRouteViewMode === 'grid' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            Grid View
                          </button>
                        </div>
                      </div>

                      <div className="relative p-3 sm:p-4">
                        <div className="h-[440px] overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          {dashboardRouteViewMode === 'map' ? (
                            <iframe
                              title="Direct Google Maps Route"
                              className="h-full w-full border-0"
                              loading="lazy"
                              src={dashboardDirectGoogleMapsUrl}
                              referrerPolicy="no-referrer-when-downgrade"
                            />
                          ) : (
                            <div className="dashboard-scrollbar h-full overflow-y-auto bg-slate-50 p-4">
                              <div className="grid gap-3 sm:grid-cols-3">
                                <article className="rounded-xl border border-slate-200 bg-white p-3">
                                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.08em] text-slate-500">Origin</p>
                                  <p className="mt-1 text-[0.78rem] font-black text-slate-900">{activeDashboardOrder?.origin ?? activeDriverDispatch.origin}</p>
                                </article>
                                <article className="rounded-xl border border-slate-200 bg-white p-3">
                                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.08em] text-slate-500">ETA</p>
                                  <p className="mt-1 text-[0.78rem] font-black text-slate-900">{dashboardRouteMeta.duration}</p>
                                </article>
                                <article className="rounded-xl border border-slate-200 bg-white p-3">
                                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.08em] text-slate-500">Destination</p>
                                  <p className="mt-1 text-[0.78rem] font-black text-slate-900">{activeDashboardOrder?.destination ?? activeDriverDispatch.destination}</p>
                                </article>
                              </div>

                              <div className="mt-4 space-y-2.5">
                                {[
                                  {
                                    id: 'pickup',
                                    label: 'Pickup',
                                    location: activeDashboardOrder?.origin ?? activeDriverDispatch.origin,
                                    window: `${activeDriverDispatch.pickupDate} | ${activeDriverDispatch.pickupTime}`,
                                  },
                                  {
                                    id: 'break',
                                    label: 'Planned Break',
                                    location: hosPlanner.recommendedStop,
                                    window: `Break due in ${formatHoursAndMinutes(hosPlanner.breakDueHours)}`,
                                  },
                                  {
                                    id: 'delivery',
                                    label: 'Delivery',
                                    location: activeDashboardOrder?.destination ?? activeDriverDispatch.destination,
                                    window: `${activeDriverDispatch.deliveryDate} | ${activeDriverDispatch.deliveryTime}`,
                                  },
                                ].map((checkpoint) => (
                                  <div key={checkpoint.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                    <p className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-slate-500">{checkpoint.label}</p>
                                    <p className="mt-1 text-[0.78rem] font-black text-slate-900">{checkpoint.location}</p>
                                    <p className="mt-0.5 text-[0.7rem] font-semibold text-slate-500">{checkpoint.window}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {isRouteLoading ? (
                          <div className="absolute left-6 top-6 z-20 rounded-full border border-blue-200 bg-white/95 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-blue-700 shadow-md">
                            Updating route...
                          </div>
                        ) : null}

                        <div className="absolute bottom-6 right-6 z-20 w-[250px] rounded-2xl border border-slate-200 bg-white/95 px-3.5 py-3 shadow-xl backdrop-blur">
                          <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Active Shipment</p>
                          <p className="mt-1 text-[0.82rem] font-black tracking-tight text-slate-900">{activeDashboardOrder?.id ?? 'LOAD-0000'}</p>
                          <p className="mt-0.5 text-[0.68rem] font-semibold text-slate-500">{activeDashboardRouteLabel}</p>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                              <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-slate-400">Distance</p>
                              <p className="mt-0.5 text-[0.76rem] font-black text-slate-800">{dashboardRouteMeta.distance}</p>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                              <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-slate-400">ETA</p>
                              <p className="mt-0.5 text-[0.76rem] font-black text-slate-800">{dashboardRouteMeta.duration}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>

                    <article className="relative rounded-3xl border border-slate-200 bg-white shadow-[0_20px_44px_-34px_rgba(15,23,42,0.5)]">
                      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
                        <h2 className="text-[1.56rem] font-black tracking-tight text-slate-900">Today's Driver Dispatch</h2>
                        <button
                          type="button"
                          onClick={focusDashboardSchedule}
                          className="inline-flex items-center gap-1 text-[0.82rem] font-bold text-blue-600 hover:text-blue-700"
                        >
                          View Schedule
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="px-3 pb-4 pt-3">
                        <div className="px-1 py-1">
                          <div className="flex items-start justify-between gap-2.5">
                            <div>
                              <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-slate-400">Load {activeDriverDispatch.id}</p>
                              <p className="mt-0.5 text-[1.12rem] font-black leading-tight tracking-tight text-slate-900">
                                {activeDriverDispatch.origin} <span className="text-slate-400">{'->'}</span> {activeDriverDispatch.destination}
                              </p>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-black uppercase tracking-[0.06em] ${dispatchStatusStyles[activeDriverDispatch.status] ?? 'bg-slate-100 text-slate-700'}`}>
                              {activeDriverDispatch.status}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-400">Trip Payout</p>
                              <p className="mt-0.5 text-[0.92rem] font-black text-slate-800">{activeDriverDispatch.price}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-400">Load Type</p>
                              <p className="mt-0.5 text-[0.92rem] font-black text-slate-800">{activeDriverDispatch.loadType}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-400">Pickup</p>
                              <p className="mt-0.5 text-[0.86rem] font-bold text-slate-700">{activeDriverDispatch.pickupDate} | {activeDriverDispatch.pickupTime}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-400">Delivery ETA</p>
                              <p className="mt-0.5 text-[0.86rem] font-bold text-slate-700">{activeDriverDispatch.deliveryDate} | {activeDriverDispatch.deliveryTime}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-400">Distance</p>
                              <p className="mt-0.5 text-[0.86rem] font-bold text-slate-700">{activeDriverDispatch.distance}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-400">Est Drive Time</p>
                              <p className="mt-0.5 text-[0.86rem] font-bold text-slate-700">{activeDriverDispatch.duration}</p>
                            </div>
                          </div>

                          <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                            <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-400">Driver Ops Details</p>
                            <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[0.82rem] font-semibold text-slate-600">
                              <p>Driver: <span className="font-bold text-slate-800">{activeDriverDispatch.driver}</span></p>
                              <p>Truck: <span className="font-bold text-slate-800">{activeDriverDispatch.truck}</span></p>
                              <p>Customer: <span className="font-bold text-slate-800">{activeDriverDispatch.customer}</span></p>
                              <p>Priority: <span className="font-bold text-slate-800">{activeDriverDispatch.priority}</span></p>
                              <p className="col-span-2">Notes: <span className="font-bold text-slate-800">{activeDriverDispatch.notes}</span></p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={handleOpenDispatchNavigation}
                              className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-[0.8rem] font-bold text-white hover:bg-blue-700"
                            >
                              Open Navigation
                            </button>
                            <button
                              type="button"
                              onClick={handleContactDispatcher}
                              className="inline-flex rounded-lg bg-slate-100 px-4 py-2 text-[0.8rem] font-bold text-slate-700 hover:bg-slate-200"
                            >
                              Contact Dispatch
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>

                  <div className="space-y-6">
                    <section className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)] sm:px-6">
                      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <h3 className="text-[1.55rem] font-black tracking-tight text-slate-900">Weekly Planning</h3>
                          <p className="text-[0.82rem] font-semibold text-slate-500">Manage upcoming loads and home time requests.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRequestHomeTime}
                          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-blue-700 hover:bg-blue-100"
                        >
                          Request Home Time
                        </button>
                      </div>

                      <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
                        {driverWeeklyPlans.map((plan) => {
                          const isSelectedPlan = selectedWeeklyPlanId === plan.id
                          const cardTone = plan.isCurrent
                            ? 'border-blue-300 bg-gradient-to-br from-blue-50 via-white to-emerald-50 shadow-[0_16px_30px_-24px_rgba(37,99,235,0.9)]'
                            : plan.status === 'Planning'
                              ? 'border-amber-200 bg-amber-50/70 hover:border-amber-300 hover:bg-amber-50'
                              : plan.status.includes('Home Time')
                                ? 'border-blue-100 bg-blue-50/70 hover:border-blue-200 hover:bg-blue-50'
                                : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                          const statusTone = planningStatusStyles[plan.status] ?? 'bg-slate-100 text-slate-700'

                          return (
                            <button
                              key={plan.id}
                              type="button"
                              onClick={() => setSelectedWeeklyPlanId(plan.id)}
                              className={`relative rounded-2xl border p-3.5 text-left transition-all duration-200 ${cardTone} ${isSelectedPlan ? 'ring-2 ring-blue-500/35' : ''}`}
                            >
                              {plan.isCurrent ? (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-2 py-0.5 text-[0.56rem] font-black uppercase tracking-[0.08em] text-white">
                                  Current
                                </span>
                              ) : null}

                              <div className="flex h-full min-h-[152px] flex-col justify-between">
                                <div>
                                  <p className={`text-[0.62rem] font-bold uppercase tracking-[0.08em] ${plan.isCurrent ? 'text-blue-600' : 'text-slate-500'}`}>
                                    {plan.dayLabel}
                                  </p>
                                  <p className="mt-1 text-[0.8rem] font-black leading-tight text-slate-900">{plan.lane}</p>
                                  <p className="mt-1.5 text-[0.68rem] font-semibold text-slate-500">{plan.cardNote}</p>
                                </div>

                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`rounded-full px-2.5 py-1 text-[0.58rem] font-black uppercase tracking-[0.06em] ${statusTone}`}>
                                      {plan.status}
                                    </span>
                                    <span className={`text-[0.92rem] font-black tracking-tight ${plan.isCurrent ? 'text-emerald-600' : 'text-slate-700'}`}>
                                      {plan.revenue}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between gap-2 text-[0.66rem] font-semibold text-slate-500">
                                    <span className="truncate">{plan.truck}</span>
                                    <span className="truncate text-right">{plan.eta}</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </section>

                    <section className="grid gap-5 xl:grid-cols-12">
                      <div className="space-y-5 xl:col-span-8">
                        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)] sm:p-6">
                          <div className="mb-5 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-[1.35rem] font-black tracking-tight text-slate-900">
                              <Route className="h-5 w-5 text-blue-600" />
                              Trip Intelligence Center
                            </h3>
                            <span className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-400">Sync: 2 min ago</span>
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            {tripRiskRadar.map((risk) => {
                              const RiskIcon = risk.icon

                              return (
                                <article key={risk.id} className={`rounded-2xl border p-4 ${risk.cardTone}`}>
                                  <div className="mb-2 flex items-center justify-between">
                                    <RiskIcon className="h-4 w-4 text-slate-700" />
                                    <span className={`rounded-full px-2 py-0.5 text-[0.58rem] font-black uppercase tracking-[0.06em] ${risk.pillTone}`}>
                                      {risk.level}
                                    </span>
                                  </div>
                                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-slate-500">{risk.label}</p>
                                  <p className="mt-1 text-[0.82rem] font-black tracking-tight text-slate-900">{risk.note}</p>
                                </article>
                              )
                            })}
                          </div>

                          <div className="mt-4 grid gap-3 xl:grid-cols-2">
                            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <Clock3 className="h-4 w-4 text-blue-600" />
                                <p className="text-[0.78rem] font-black uppercase tracking-[0.08em] text-slate-700">HOS + Break Planner</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-slate-400">Driving Limit</p>
                                  <p className="mt-0.5 text-[0.82rem] font-black text-slate-800">11h</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-slate-400">Remaining</p>
                                  <p className="mt-0.5 text-[0.82rem] font-black text-emerald-600">{formatHoursAndMinutes(hosPlanner.remainingHours)}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-slate-400">Used</p>
                                  <p className="mt-0.5 text-[0.82rem] font-black text-slate-800">{formatHoursAndMinutes(hosPlanner.usedHours)}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                                  <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-slate-400">Break Due</p>
                                  <p className="mt-0.5 text-[0.82rem] font-black text-amber-700">{formatHoursAndMinutes(hosPlanner.breakDueHours)}</p>
                                </div>
                              </div>

                              <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                                <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-blue-700">Recommended Stop</p>
                                <p className="mt-1 text-[0.74rem] font-semibold text-slate-700">{hosPlanner.recommendedStop}</p>
                              </div>

                              <button
                                type="button"
                                onClick={handlePlanBreakStop}
                                className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-100"
                              >
                                Plan Break Stop
                              </button>
                            </article>

                            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="mb-3 flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                                <p className="text-[0.78rem] font-black uppercase tracking-[0.08em] text-slate-700">Delivery Readiness Tracker</p>
                              </div>

                              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Readiness</p>
                                  <p className="text-[0.72rem] font-black text-blue-700">{deliveryReadinessComplete}/{deliveryReadinessItems.length}</p>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                                  <div className="h-full rounded-full bg-blue-600" style={{ width: `${deliveryReadinessPercent}%` }}></div>
                                </div>
                              </div>

                              <ul className="mt-3 space-y-2">
                                {deliveryReadinessItems.map((item) => (
                                  <li key={item.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[0.74rem] font-semibold text-slate-700">
                                    <span className={`grid h-4 w-4 place-items-center rounded-full ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                      <Check className="h-3 w-3" />
                                    </span>
                                    <span>{item.label}</span>
                                  </li>
                                ))}
                              </ul>

                              <button
                                type="button"
                                onClick={handleOpenDriverChecklist}
                                className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-100"
                              >
                                Open Checklist
                              </button>
                            </article>
                          </div>

                          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-blue-700">Dispatch Communication Center</p>
                                <p className="mt-1 text-[0.84rem] font-bold text-slate-800">{dispatchDeskData.dispatcher}</p>
                                <p className="text-[0.75rem] font-semibold text-slate-600">{dispatchDeskData.note}</p>
                                <p className="mt-1 text-[0.7rem] font-semibold text-blue-700">{dispatchDeskData.message}</p>
                              </div>

                              <div className="flex items-center gap-2">
                                <a
                                  href={`tel:${dispatchDeskData.phone.replace(/[^\d+]/g, '')}`}
                                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-600 hover:bg-blue-100 hover:text-blue-700"
                                  aria-label="Call dispatcher"
                                >
                                  <Phone className="h-4 w-4" />
                                </a>
                                <a
                                  href={`mailto:${dispatchDeskData.email}`}
                                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-600 hover:bg-blue-100 hover:text-blue-700"
                                  aria-label="Email dispatcher"
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </article>

                        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)] sm:p-6">
                          <div className="mb-4 flex items-center justify-between gap-2">
                            <h3 className="text-[1.35rem] font-black tracking-tight text-slate-900">Road Reports & Community</h3>
                            <button
                              type="button"
                              onClick={() => setIsRoadReportComposerOpen((previous) => !previous)}
                              className="rounded-xl bg-slate-900 px-4 py-2 text-[0.66rem] font-black uppercase tracking-[0.08em] text-white hover:bg-slate-800"
                            >
                              {isRoadReportComposerOpen ? 'Close Form' : 'Report Issue'}
                            </button>
                          </div>

                          <div className="mb-4 flex flex-wrap gap-2">
                            {roadCommunityFilterOptions.map((option) => {
                              const isActive = roadCommunityFilter === option
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => setRoadCommunityFilter(option)}
                                  className={`rounded-full px-3 py-1 text-[0.6rem] font-black uppercase tracking-[0.08em] transition ${isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}
                                >
                                  {option}
                                </button>
                              )
                            })}
                          </div>

                          {isRoadReportComposerOpen && (
                            <form onSubmit={handleRoadReportSubmit} className="mb-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Category</label>
                                  <select
                                    value={roadReportDraft.category}
                                    onChange={(event) => handleRoadReportDraftChange('category', event.target.value)}
                                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[0.72rem] font-semibold text-slate-700 outline-none ring-blue-500/30 transition focus:ring-2"
                                  >
                                    {roadReportCategoryOptions.map((option) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Location (optional)</label>
                                  <input
                                    type="text"
                                    value={roadReportDraft.location}
                                    onChange={(event) => handleRoadReportDraftChange('location', event.target.value)}
                                    placeholder={`${activeDriverDispatch.origin} -> ${activeDriverDispatch.destination}`}
                                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[0.72rem] font-semibold text-slate-700 outline-none ring-blue-500/30 transition focus:ring-2"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Details</label>
                                <textarea
                                  value={roadReportDraft.message}
                                  onChange={(event) => handleRoadReportDraftChange('message', event.target.value)}
                                  rows={3}
                                  placeholder="Share what happened, lane impact, and any safe reroute suggestion."
                                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[0.72rem] font-semibold text-slate-700 outline-none ring-blue-500/30 transition focus:ring-2"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setIsRoadReportComposerOpen(false)}
                                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[0.62rem] font-black uppercase tracking-[0.08em] text-slate-600 hover:bg-slate-100"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  onClick={() => setRoadCommunityFilter('All')}
                                  className="rounded-xl bg-slate-900 px-3 py-2 text-[0.62rem] font-black uppercase tracking-[0.08em] text-white hover:bg-slate-800"
                                >
                                  Post Report
                                </button>
                              </div>
                            </form>
                          )}

                          <div className="space-y-3">
                            {filteredRoadCommunityReports.map((report) => {
                              const categoryStyle = roadReportCategoryStyles[report.category] ?? roadReportCategoryStyles['General Update']

                              return (
                                <article key={report.id} className="rounded-2xl border border-slate-100 px-4 py-3 transition hover:border-slate-200 hover:bg-slate-50">
                                  <div className="flex gap-3">
                                    <img
                                      src={report.avatarUrl}
                                      alt={`${report.driverName} avatar`}
                                      className="h-10 w-10 rounded-full object-cover"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-[0.74rem] font-bold text-slate-900">{report.driverName} <span className="ml-1 text-[0.65rem] font-semibold text-slate-400">{report.postedAt}</span></p>
                                        <span className={`rounded-full px-2 py-0.5 text-[0.56rem] font-black uppercase tracking-[0.06em] ${categoryStyle}`}>{report.category}</span>
                                      </div>
                                      <p className="text-[0.75rem] font-semibold leading-relaxed text-slate-600">{report.message}</p>
                                      <p className="mt-1 text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-400">Near {report.location}</p>
                                      <div className="mt-2 flex flex-wrap items-center gap-4">
                                        <button
                                          type="button"
                                          onClick={() => handleRoadReportAction(report.id, 'confirmations')}
                                          className="text-[0.64rem] font-bold text-slate-500 hover:text-blue-700"
                                        >
                                          {report.confirmations} Confirmations
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRoadReportAction(report.id, 'comments')}
                                          className="text-[0.64rem] font-bold text-slate-500 hover:text-blue-700"
                                        >
                                          {report.comments} Comments
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRoadReportAction(report.id, 'helpful')}
                                          className="text-[0.64rem] font-bold text-slate-500 hover:text-blue-700"
                                        >
                                          {report.helpful} Helpful
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </article>
                              )
                            })}

                            {filteredRoadCommunityReports.length === 0 && (
                              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                                <p className="text-[0.72rem] font-semibold text-slate-500">No reports found for this filter. Switch category or add a fresh update.</p>
                              </div>
                            )}
                          </div>
                        </article>
                      </div>

                      <div className="space-y-5 xl:col-span-4">
                        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
                          <div className="mb-5 flex items-center justify-between">
                            <h3 className="text-[1.15rem] font-black tracking-tight text-slate-900">Financial Breakdown</h3>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.06em] text-emerald-700">Target 85%</span>
                          </div>

                          <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-400">Projected Monthly Revenue</p>
                          <div className="mt-3 flex h-32 items-end gap-1.5">
                            {[40, 55, 45, 70, 85, 95, 60].map((height, index) => (
                              <div
                                key={`bar-${height}-${index}`}
                                style={{ height: `${height}%` }}
                                className={`flex-1 rounded-t-lg ${index === 5 ? 'bg-blue-600' : index === 6 ? 'border-t border-dashed border-slate-300 bg-slate-100' : 'bg-blue-100'}`}
                              ></div>
                            ))}
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-400">Today</p>
                              <p className="mt-0.5 text-[1.2rem] font-black tracking-tight text-slate-900">$482.50</p>
                            </div>
                            <div>
                              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-400">Weekly</p>
                              <p className="mt-0.5 text-[1.2rem] font-black tracking-tight text-slate-900">$3,120.00</p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                            <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Earnings & Cost Snapshot</p>
                            <div className="mt-2 grid grid-cols-3 gap-2">
                              <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                                <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-slate-400">Fuel Est.</p>
                                <p className="mt-0.5 text-[0.74rem] font-black text-rose-600">{formatCurrencyValue(estimatedFuelSpend)}</p>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                                <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-slate-400">Toll Est.</p>
                                <p className="mt-0.5 text-[0.74rem] font-black text-amber-700">{formatCurrencyValue(estimatedTollSpend)}</p>
                              </div>
                              <div className="rounded-xl border border-slate-200 bg-white px-2.5 py-2">
                                <p className="text-[0.56rem] font-bold uppercase tracking-[0.08em] text-slate-400">Net Payout</p>
                                <p className="mt-0.5 text-[0.74rem] font-black text-emerald-700">{formatCurrencyValue(estimatedNetPayout || activeDispatchGross)}</p>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleViewDriverPayoutHistory}
                            className="mt-5 w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.08em] text-slate-700 hover:bg-slate-100"
                          >
                            View Payout History
                          </button>
                        </article>

                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={handleEmergencyRoadside}
                            className="flex w-full items-center justify-center gap-2 rounded-3xl bg-rose-600 px-5 py-4 text-[0.84rem] font-black uppercase tracking-[0.08em] text-white shadow-[0_16px_40px_-26px_rgba(225,29,72,0.8)] transition hover:bg-rose-700"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            Emergency Roadside
                          </button>

                          <article className="rounded-3xl bg-blue-600 px-5 py-4 text-white shadow-[0_16px_40px_-30px_rgba(37,99,235,0.9)]">
                            <div className="mb-3 flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              <p className="text-[0.62rem] font-black uppercase tracking-[0.08em] text-blue-100">Safety Tip Of The Day</p>
                            </div>
                            <p className="text-[0.78rem] font-semibold leading-relaxed">Maintain a minimum 7-second following distance at highway speed, especially in high-wind zones.</p>
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                                <span className="h-1.5 w-1.5 rounded-full bg-white/40"></span>
                                <span className="h-1.5 w-1.5 rounded-full bg-white/40"></span>
                              </div>
                              <button
                                type="button"
                                onClick={handleLearnSafetyTip}
                                className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-blue-100 hover:text-white"
                              >
                                Learn More
                              </button>
                            </div>
                          </article>

                          <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-400">Dispatch Support</p>
                            <div className="flex items-center gap-3">
                              <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-700">
                                <Users className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[0.8rem] font-bold text-slate-900">Sarah Jenkins</p>
                                <p className="text-[0.66rem] font-semibold text-slate-500">Dedicated Dispatcher</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleContactDispatcher}
                                  className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                                  aria-label="Call dispatch support"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleEmailDispatcher}
                                  className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                                  aria-label="Email dispatch support"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </article>
                        </div>
                      </div>
                    </section>
                  </div>

                  {isLoading ? (
                    <p className="text-[0.8rem] font-semibold text-slate-400">Syncing live metrics...</p>
                  ) : null}
                </div>
              </section>

              {selectedWeeklyPlanId ? (
                <div
                  className="fixed left-0 right-0 bottom-0 top-[84px] z-[90] bg-slate-900/5"
                  onClick={() => setSelectedWeeklyPlanId(null)}
                />
              ) : null}

              <aside
                className={`fixed right-0 top-[84px] z-[100] h-[calc(100vh-84px)] w-full max-w-[480px] transform bg-white shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col ${selectedWeeklyPlanId ? 'translate-x-0' : 'translate-x-full'
                  }`}
              >
                {selectedWeeklyPlan ? (
                  <>
                    <div className="shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-5">
                      <div>
                        <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-blue-600">{selectedWeeklyPlan.dayLabel}</p>
                        <h3 className="mt-1 text-[1.45rem] font-black tracking-tight text-slate-900">{selectedWeeklyPlan.loadId}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedWeeklyPlanId(null)}
                        className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4">
                      <div className="space-y-4">
                        <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-[1.05rem] font-bold text-slate-800">Driver Trip Snapshot</h4>
                            <span className={`rounded-full px-2.5 py-1 text-[0.6rem] font-black uppercase tracking-[0.06em] ${planningStatusStyles[selectedWeeklyPlan.status] ?? 'bg-slate-100 text-slate-700'}`}>
                              {selectedWeeklyPlan.status}
                            </span>
                          </div>

                          <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[0.84rem]">
                            <div>
                              <dt className="font-semibold text-slate-500">Driver</dt>
                              <dd className="font-bold text-slate-700">{selectedWeeklyPlan.driver}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-500">Truck</dt>
                              <dd className="font-bold text-slate-700">{selectedWeeklyPlan.truck}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-500">Estimated Earnings</dt>
                              <dd className="font-bold text-slate-700">{selectedWeeklyPlan.revenue}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-500">Load Type</dt>
                              <dd className="font-bold text-slate-700">{selectedWeeklyPlan.loadType}</dd>
                            </div>
                            <div>
                              <dt className="font-semibold text-slate-500">Priority</dt>
                              <dd className="font-bold text-slate-700">{selectedWeeklyPlan.priority}</dd>
                            </div>
                          </dl>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-4">
                          <h4 className="text-[1.05rem] font-bold text-slate-800">Route & Timing</h4>
                          <p className="mt-2 text-[1rem] font-black leading-tight text-slate-900">{selectedWeeklyPlan.lane}</p>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-400">Pickup</p>
                              <p className="mt-0.5 text-[0.84rem] font-bold text-slate-700">{selectedWeeklyPlan.pickupWindow}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-400">Delivery ETA</p>
                              <p className="mt-0.5 text-[0.84rem] font-bold text-slate-700">{selectedWeeklyPlan.deliveryWindow}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-400">Distance</p>
                              <p className="mt-0.5 text-[0.84rem] font-bold text-slate-700">{selectedWeeklyPlan.distance}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                              <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-400">Drive Time</p>
                              <p className="mt-0.5 text-[0.84rem] font-bold text-slate-700">{selectedWeeklyPlan.driveTime}</p>
                            </div>
                          </div>

                          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                            <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-blue-700">Ops Routing Notes</p>
                            <p className="mt-1 text-[0.8rem] font-semibold text-slate-700">Fuel stop: {selectedWeeklyPlan.fuelStop}</p>
                            <p className="mt-0.5 text-[0.8rem] font-semibold text-slate-600">Check-in rule: {selectedWeeklyPlan.checkInRule}</p>
                          </div>
                        </section>

                        <section>
                          <h4 className="text-[1.05rem] font-bold text-slate-800">Stop Timeline</h4>
                          <div className="mt-3 space-y-3">
                            {selectedWeeklyPlan.timeline.map((stop) => (
                              <article key={`${selectedWeeklyPlan.id}-${stop.label}`} className="rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
                                <div className="flex items-start gap-3">
                                  <span className={`mt-1.5 h-3 w-3 rounded-full ${stop.tone}`}></span>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-[0.95rem] font-bold text-slate-800">{stop.label}</p>
                                      <span className="text-[0.7rem] font-bold uppercase tracking-[0.06em] text-slate-500">{stop.status}</span>
                                    </div>
                                    <p className="mt-1 text-[0.8rem] font-semibold text-slate-600">{stop.location}</p>
                                    <p className="text-[0.76rem] font-medium text-slate-500">{stop.window}</p>
                                  </div>
                                </div>
                              </article>
                            ))}
                          </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-4">
                          <h4 className="text-[1.05rem] font-bold text-slate-800">Driver & Company Contacts</h4>
                          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[0.84rem]">
                            <p>Driver: <span className="font-bold text-slate-800">{selectedWeeklyPlan.driver}</span></p>
                            <p>Truck: <span className="font-bold text-slate-800">{selectedWeeklyPlan.truck}</span></p>
                            <p className="col-span-2">Trailer: <span className="font-bold text-slate-800">{selectedWeeklyPlan.trailer}</span></p>
                            <p className="col-span-2">Company: <span className="font-bold text-slate-800">{selectedWeeklyPlan.customer}</span></p>
                          </div>

                          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                            <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Primary Driver Contact</p>
                            <p className="mt-0.5 text-[0.88rem] font-bold text-slate-800">{selectedWeeklyPlan.driver}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.8rem] font-semibold text-slate-600">
                              <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-blue-600" />{selectedWeeklyPlan.driverPhone}</span>
                              <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-blue-600" />Emergency: {selectedWeeklyPlan.emergencyContactName}</span>
                              <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-blue-600" />{selectedWeeklyPlan.emergencyContactPhone}</span>
                            </div>
                            <p className="mt-1.5 text-[0.74rem] font-semibold text-rose-600">Roadside support: {selectedWeeklyPlan.roadsideSupport}</p>
                          </div>

                          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
                            <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-blue-700">Company Dispatch Contact</p>
                            <p className="mt-0.5 text-[0.88rem] font-bold text-slate-800">{selectedWeeklyPlan.dispatcherName}</p>
                            <p className="text-[0.78rem] font-semibold text-slate-600">{selectedWeeklyPlan.customer} Ops Desk</p>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[0.8rem] font-semibold text-slate-600">
                              <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-blue-600" />{selectedWeeklyPlan.dispatcherPhone}</span>
                              <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-blue-600" />{selectedWeeklyPlan.dispatcherEmail}</span>
                            </div>
                          </div>
                        </section>

                        <section className="grid gap-3 sm:grid-cols-2">
                          <article className="rounded-2xl border border-slate-200 bg-white p-4">
                            <h4 className="text-[0.95rem] font-bold text-slate-800">Required Documents</h4>
                            <ul className="mt-2 space-y-2">
                              {selectedWeeklyPlan.docs.map((doc) => (
                                <li key={`${selectedWeeklyPlan.id}-${doc}`} className="flex items-start gap-2 text-[0.8rem] font-semibold text-slate-600">
                                  <FileText className="mt-0.5 h-3.5 w-3.5 text-blue-600" />
                                  <span>{doc}</span>
                                </li>
                              ))}
                            </ul>
                          </article>

                          <article className="rounded-2xl border border-slate-200 bg-white p-4">
                            <h4 className="text-[0.95rem] font-bold text-slate-800">Driver Checklist</h4>
                            <ul className="mt-2 space-y-2">
                              {selectedWeeklyPlan.checklist.map((item) => (
                                <li key={`${selectedWeeklyPlan.id}-${item}`} className="flex items-start gap-2 text-[0.8rem] font-semibold text-slate-600">
                                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </article>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-4">
                          <h4 className="text-[1.05rem] font-bold text-slate-800">Operational Notes</h4>
                          <div className="mt-3 space-y-3 text-[0.82rem]">
                            <div>
                              <p className="font-bold uppercase tracking-[0.08em] text-[0.62rem] text-slate-500">Pickup</p>
                              <p className="mt-0.5 font-semibold text-slate-700">{selectedWeeklyPlan.notes.pickup}</p>
                            </div>
                            <div>
                              <p className="font-bold uppercase tracking-[0.08em] text-[0.62rem] text-slate-500">Enroute</p>
                              <p className="mt-0.5 font-semibold text-slate-700">{selectedWeeklyPlan.notes.enroute}</p>
                            </div>
                            <div>
                              <p className="font-bold uppercase tracking-[0.08em] text-[0.62rem] text-slate-500">Delivery</p>
                              <p className="mt-0.5 font-semibold text-slate-700">{selectedWeeklyPlan.notes.delivery}</p>
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  </>
                ) : null}
              </aside>
              </>
            ) : activeSection === 'orders' ? (
              <section className="h-[calc(100vh-85px)] overflow-hidden relative">
                <div className="flex h-full min-h-0 overflow-hidden relative">
                  <article className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
                    <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                      <h2 className="text-[2rem] font-bold tracking-tight text-slate-800">My Loads</h2>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSavePodDraftAction}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                        >
                          <FileText className="h-4 w-4" />
                          Save Draft
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitPodToCompany}
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white"
                        >
                          <Upload className="h-4 w-4" />
                          Submit POD
                        </button>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-wrap items-center gap-4 border-b border-slate-200 px-5 py-3">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600">
                        <span>My Loads</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        <span>{currentTripPlan?.loadId ?? activeDriverDispatch.id}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-blue-600">Driver View</span>
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600">
                        <Truck className="h-4 w-4 text-blue-600" />
                        Truck {currentTripPlan?.truck ?? activeDriverDispatch.truck}
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600">
                        <Clock3 className="h-4 w-4 text-blue-600" />
                        ETA {currentTripPlan?.eta ?? `${activeDriverDispatch.deliveryDate}, ${activeDriverDispatch.deliveryTime}`}
                      </div>

                      <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600">
                        <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                        Status {currentTripPlan?.status ?? activeDriverDispatch.status}
                      </div>
                    </div>

                    {(() => {
                      const todaysLoad = currentTripPlan ?? driverWeeklyPlans[0] ?? null
                      const laneLabel = String(todaysLoad?.lane ?? `${activeDriverDispatch.origin} -> ${activeDriverDispatch.destination}`)
                      const laneParts = laneLabel.split('->').map((part) => part.trim())
                      const pickupLocation = laneParts[0] && laneParts[0] !== '' ? laneParts[0] : activeDriverDispatch.origin
                      const deliveryLocation = laneParts[1] && laneParts[1] !== '' ? laneParts[1] : activeDriverDispatch.destination
                      const loadId = todaysLoad?.loadId ?? activeDriverDispatch.id
                      const loadStatus = todaysLoad?.status ?? activeDriverDispatch.status
                      const loadEta = todaysLoad?.eta ?? `${activeDriverDispatch.deliveryDate}, ${activeDriverDispatch.deliveryTime}`
                      const checklist = todaysLoad?.checklist ?? [
                        'Pickup docs verified',
                        'Seal and lock check complete',
                        'Live location sharing active',
                        'POD photo checklist acknowledged',
                      ]
                      const requiredDocs = todaysLoad?.docs ?? [
                        'Bill of Lading',
                        'Rate Confirmation',
                        'Receiver Stamp / Signature',
                      ]
                      const companySupportName = todaysLoad?.emergencyContactName ?? 'FleetFlow Driver Support'
                      const companySupportPhone = todaysLoad?.roadsideSupport ?? '+1 (800) 554-7701'
                      const companySupportEmail = 'driver.support@fleetflow.com'
                      const companyEmergencyLine = todaysLoad?.emergencyLine ?? '+1 (800) 442-7711'
                      const dispatchPhoneHref = `tel:${dispatchDeskData.phone.replace(/[^+\d]/g, '')}`
                      const supportPhoneHref = `tel:${companySupportPhone.replace(/[^+\d]/g, '')}`
                      const isDelivered = String(loadStatus).toLowerCase().includes('deliver')
                      const etaHoursRemaining = isDelivered ? 0 : Math.max(Math.round((activeDispatchMiles || 120) / 52), 1)
                      const nextCheckInRule = todaysLoad?.checkInRule ?? 'Geo-tag update every 2 hours'
                      const nextCheckInAt = isDelivered
                        ? 'Completed'
                        : `${Math.max(etaHoursRemaining - 1, 0)}h ${etaHoursRemaining > 1 ? '30m' : '10m'}`

                      const actionCenterItems = [
                        {
                          id: 'eta-update',
                          label: 'Share midpoint ETA update',
                          note: `Rule: ${nextCheckInRule}`,
                          done: loadStatus === 'In Transit' || isDelivered,
                        },
                        {
                          id: 'pod-photos',
                          label: 'Capture all mandatory POD photos',
                          note: 'Front goods, cargo seal, unloading area',
                          done: isDelivered,
                        },
                        {
                          id: 'receiver-sign',
                          label: 'Collect receiver signature + stamp',
                          note: 'Required before payout review',
                          done: isDelivered,
                        },
                      ]
                      const pendingActionCount = actionCenterItems.filter((item) => !item.done).length

                      const stopInstructions = [
                        {
                          id: 'pickup-stop',
                          label: 'Pickup Stop',
                          location: pickupLocation,
                          window: todaysLoad?.pickupWindow ?? `${activeDriverDispatch.pickupDate} | ${activeDriverDispatch.pickupTime}`,
                          instruction: todaysLoad?.notes?.pickup ?? 'Check in at assigned dock and verify seal IDs before departure.',
                        },
                        {
                          id: 'enroute-stop',
                          label: 'Enroute Checkpoint',
                          location: todaysLoad?.fuelStop ?? hosPlanner.recommendedStop,
                          window: `Next check-in in ${nextCheckInAt}`,
                          instruction: todaysLoad?.notes?.enroute ?? 'Share geotag update and note any road or weather delay.',
                        },
                        {
                          id: 'delivery-stop',
                          label: 'Delivery Stop',
                          location: deliveryLocation,
                          window: todaysLoad?.deliveryWindow ?? `${activeDriverDispatch.deliveryDate} | ${activeDriverDispatch.deliveryTime}`,
                          instruction: todaysLoad?.notes?.delivery ?? 'Call receiver before arrival and upload signed POD immediately.',
                        },
                      ]

                      const podQualityChecks = [
                        {
                          id: 'photo-set',
                          label: 'All 3 mandatory photos captured',
                          done: isDelivered,
                        },
                        {
                          id: 'bol-readable',
                          label: 'BOL / stamped doc clear and readable',
                          done: requiredDocs.some((doc) => doc.toLowerCase().includes('bill')),
                        },
                        {
                          id: 'signature-ready',
                          label: 'Receiver signature pad completed',
                          done: isDelivered,
                        },
                        {
                          id: 'time-window',
                          label: 'Timestamp inside delivery window',
                          done: loadStatus === 'In Transit' || isDelivered,
                        },
                      ]
                      const podQualityCompleted = podQualityChecks.filter((item) => item.done).length
                      const podQualityPercent = Math.round((podQualityCompleted / Math.max(podQualityChecks.length, 1)) * 100)
                      const podQualityTone = podQualityPercent >= 75
                        ? 'text-emerald-700 bg-emerald-100'
                        : podQualityPercent >= 50
                          ? 'text-amber-700 bg-amber-100'
                          : 'text-rose-700 bg-rose-100'

                      const hosUsagePercent = Math.min(100, Math.round((hosPlanner.usedHours / 11) * 100))
                      const breakUrgencyLabel = hosPlanner.breakDueHours <= 1
                        ? 'Break required soon'
                        : hosPlanner.breakDueHours <= 2.5
                          ? 'Plan break within this leg'
                          : 'Break plan on track'
                      const breakUrgencyTone = hosPlanner.breakDueHours <= 1
                        ? 'text-rose-700 bg-rose-100'
                        : hosPlanner.breakDueHours <= 2.5
                          ? 'text-amber-700 bg-amber-100'
                          : 'text-emerald-700 bg-emerald-100'

                      const exceptionTemplates = [
                        'Traffic delay',
                        'Dock wait > 60 min',
                        'Route blocked / detour',
                        'POD issue',
                      ]
                      const recentExceptions = [
                        {
                          id: 'delay-risk',
                          title: `${tripRiskRadar[0]?.level ?? 'Medium'} delay risk`,
                          note: tripRiskRadar[0]?.note ?? 'Lane status update needed',
                        },
                        {
                          id: 'hos-risk',
                          title: `${tripRiskRadar[3]?.level ?? 'Low'} HOS risk`,
                          note: `Remaining drive time ${formatHoursAndMinutes(hosPlanner.remainingHours)}`,
                        },
                      ]

                      const payoutStatusLabel = isDelivered ? 'Ready for company review' : 'Pending POD submission'
                      const payoutConfidence = isDelivered ? 'High confidence' : 'Medium confidence'

                      const commTemplates = [
                        'Reached checkpoint. ETA holding.',
                        'Delay expected by 20 mins.',
                        'Receiver informed. Dock slot confirmed.',
                      ]

                      const offlineQueueCount = isDelivered ? 0 : Math.max(1, Math.min(4, Math.round(activeDispatchMiles / 180)))
                      const connectivityLabel = activeDispatchMiles > 450 ? 'Patchy network expected enroute' : 'Strong network on this lane'

                      const averageRiskScore = tripRiskRadar.reduce((accumulator, item) => {
                        if (item.level === 'Low') {
                          return accumulator + 100
                        }

                        if (item.level === 'Medium') {
                          return accumulator + 75
                        }

                        return accumulator + 45
                      }, 0) / Math.max(tripRiskRadar.length, 1)

                      const loadHealthScore = Math.round((deliveryReadinessPercent * 0.55) + (averageRiskScore * 0.45))
                      const loadHealthTone = loadHealthScore >= 80
                        ? 'text-emerald-700 bg-emerald-100'
                        : loadHealthScore >= 65
                          ? 'text-amber-700 bg-amber-100'
                          : 'text-rose-700 bg-rose-100'

                      const nextLoadPreview = driverWeeklyPlans.find((plan) => {
                        return !plan.isCurrent && !plan.status.includes('Home Time')
                      }) ?? driverWeeklyPlans.find((plan) => !plan.isCurrent) ?? null
                      const nextLoadPrepItems = (nextLoadPreview?.checklist ?? nextLoadPreview?.docs ?? []).slice(0, 4)
                      const nextLoadMilestones = (nextLoadPreview?.timeline ?? []).slice(0, 3)

                      return (
                        <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50 p-6">
                          <div className="mx-auto grid w-full max-w-[1320px] grid-cols-12 gap-6">
                            <div className="col-span-12 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-600 text-white">
                                  <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-emerald-700">Current Load Status</p>
                                  <p className="text-[1.25rem] font-black text-emerald-800">{loadStatus}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[0.72rem] font-semibold text-emerald-700">ETA / Window</p>
                                <p className="text-[1rem] font-bold text-emerald-900">{loadEta}</p>
                              </div>
                            </div>

                            <div className="col-span-12 space-y-6 xl:col-span-8">
                              <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-blue-700">Action Center</p>
                                    <h4 className="mt-1 text-[1.1rem] font-black text-slate-900">
                                      {pendingActionCount === 0 ? 'All critical tasks complete' : `${pendingActionCount} critical action${pendingActionCount === 1 ? '' : 's'} pending`}
                                    </h4>
                                  </div>
                                  <span className="rounded-full bg-white px-3 py-1 text-[0.72rem] font-bold text-blue-700">
                                    {isDelivered ? 'Load Closed' : `${etaHoursRemaining}h to destination`}
                                  </span>
                                </div>

                                <div className="mt-4 space-y-2.5">
                                  {actionCenterItems.map((item) => (
                                    <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-white px-3 py-2.5">
                                      <div>
                                        <p className="text-[0.82rem] font-bold text-slate-800">{item.label}</p>
                                        <p className="mt-0.5 text-[0.72rem] font-semibold text-slate-500">{item.note}</p>
                                      </div>
                                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.66rem] font-bold ${item.done ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {item.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                                        {item.done ? 'Done' : 'Pending'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h4 className="text-[1.1rem] font-black text-slate-900">Stop-wise Smart Instructions</h4>
                                <div className="mt-4 space-y-3">
                                  {stopInstructions.map((stop) => (
                                    <article key={stop.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="flex items-center gap-1.5 text-[0.78rem] font-black text-slate-800">
                                          <MapPin className="h-3.5 w-3.5 text-blue-600" />
                                          {stop.label}
                                        </p>
                                        <span className="rounded-full bg-white px-2 py-0.5 text-[0.66rem] font-bold text-slate-600">{stop.window}</span>
                                      </div>
                                      <p className="mt-1 text-[0.74rem] font-semibold text-slate-600">{stop.location}</p>
                                      <p className="mt-2 text-[0.78rem] font-medium text-slate-700">{stop.instruction}</p>
                                    </article>
                                  ))}
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                  <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Load ID</p>
                                    <p className="mt-1 text-[0.95rem] font-black text-blue-600">{loadId}</p>
                                  </article>
                                  <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Route</p>
                                    <p className="mt-1 text-[0.88rem] font-bold text-slate-800">{pickupLocation}{' -> '}{deliveryLocation}</p>
                                  </article>
                                  <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Truck</p>
                                    <p className="mt-1 text-[0.95rem] font-black text-slate-800">{todaysLoad?.truck ?? activeDriverDispatch.truck}</p>
                                  </article>
                                  <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Revenue</p>
                                    <p className="mt-1 text-[0.95rem] font-black text-emerald-600">{todaysLoad?.revenue ?? activeDriverDispatch.price}</p>
                                  </article>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  <article className="rounded-xl border border-slate-200 bg-white p-3">
                                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Pickup Window</p>
                                    <p className="mt-1 text-[0.84rem] font-semibold text-slate-700">{todaysLoad?.pickupWindow ?? `${activeDriverDispatch.pickupDate} | ${activeDriverDispatch.pickupTime}`}</p>
                                  </article>
                                  <article className="rounded-xl border border-slate-200 bg-white p-3">
                                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Delivery Window</p>
                                    <p className="mt-1 text-[0.84rem] font-semibold text-slate-700">{todaysLoad?.deliveryWindow ?? `${activeDriverDispatch.deliveryDate} | ${activeDriverDispatch.deliveryTime}`}</p>
                                  </article>
                                  <article className="rounded-xl border border-slate-200 bg-white p-3">
                                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Distance</p>
                                    <p className="mt-1 text-[0.84rem] font-semibold text-slate-700">{todaysLoad?.distance ?? activeDriverDispatch.distance}</p>
                                  </article>
                                  <article className="rounded-xl border border-slate-200 bg-white p-3">
                                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Drive Time</p>
                                    <p className="mt-1 text-[0.84rem] font-semibold text-slate-700">{todaysLoad?.driveTime ?? activeDriverDispatch.duration}</p>
                                  </article>
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                  <h4 className="text-[1.1rem] font-black text-slate-900">Mandatory Photo Proof</h4>
                                  <span className="rounded-full bg-blue-100 px-3 py-1 text-[0.68rem] font-bold text-blue-700">3 REQUIRED</span>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                  {['Front of Goods', 'Cargo Seal', 'Unloading Area'].map((label) => (
                                    <div key={label} className="group aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-center hover:border-blue-300 hover:bg-blue-50/40">
                                      <div className="grid h-full place-items-center">
                                        <div>
                                          <Upload className="mx-auto h-8 w-8 text-slate-400" />
                                          <p className="mt-2 text-[0.75rem] font-semibold text-slate-600">{label}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                  <h4 className="text-[1.1rem] font-black text-slate-900">POD Quality Guard</h4>
                                  <span className={`rounded-full px-3 py-1 text-[0.68rem] font-bold ${podQualityTone}`}>
                                    {podQualityCompleted}/{podQualityChecks.length} passed
                                  </span>
                                </div>

                                <div className="h-2 rounded-full bg-slate-100">
                                  <div
                                    className={`h-full rounded-full transition-all ${podQualityPercent >= 75 ? 'bg-emerald-500' : podQualityPercent >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    style={{ width: `${podQualityPercent}%` }}
                                  />
                                </div>

                                <div className="mt-4 space-y-2.5">
                                  {podQualityChecks.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                      <p className="text-[0.78rem] font-semibold text-slate-700">{item.label}</p>
                                      {item.done ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-700">
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          Pass
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-700">
                                          <AlertCircle className="h-3.5 w-3.5" />
                                          Verify
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h4 className="text-[1.1rem] font-black text-slate-900">Signed BOL / Stamped Document</h4>
                                <div className="mt-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
                                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-blue-500 text-white">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <p className="mt-3 text-[0.82rem] font-bold text-slate-800">Upload BOL or receiver-stamped document</p>
                                  <p className="mt-1 text-[0.74rem] font-medium text-slate-500">PDF, JPG or PNG (Max 10MB)</p>
                                </div>

                                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                  {requiredDocs.map((doc) => (
                                    <div key={doc} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[0.78rem] font-semibold text-slate-700">
                                      {doc}
                                    </div>
                                  ))}
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                  <h4 className="text-[1.1rem] font-black text-slate-900">Receiver Signature</h4>
                                  <button
                                    type="button"
                                    onClick={handleClearReceiverSignature}
                                    className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-rose-600"
                                  >
                                    Clear Pad
                                  </button>
                                </div>

                                <div className="relative h-40 rounded-xl border border-slate-200 bg-slate-50">
                                  {isReceiverSignatureCleared ? (
                                    <div className="absolute inset-0 grid place-items-center px-4 text-center">
                                      <p className="text-[0.76rem] font-semibold text-slate-500">Signature pad cleared. Capture receiver signature again.</p>
                                    </div>
                                  ) : (
                                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                                      <path d="M55,140 Q110,45 165,130 T275,80 T385,120 T450,70" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                  )}
                                  <p className="absolute bottom-2 left-3 text-[0.68rem] italic text-slate-500">{isReceiverSignatureCleared ? 'Pad ready for new signature' : 'Sign within area above'}</p>
                                </div>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Receiver Name</p>
                                    <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[0.82rem] font-semibold text-slate-700">{todaysLoad?.customer ?? activeDriverDispatch.customer}</p>
                                  </div>
                                  <div>
                                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Role</p>
                                    <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[0.82rem] font-semibold text-slate-700">Receiver / Dock Supervisor</p>
                                  </div>
                                </div>
                              </section>

                              <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-indigo-700">Upcoming Assignment</p>
                                    <h4 className="mt-1 text-[1.1rem] font-black text-slate-900">Next Load Ready Board</h4>
                                  </div>
                                  <span className={`rounded-full px-3 py-1 text-[0.68rem] font-bold ${nextLoadPreview ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {nextLoadPreview ? 'PREP NOW' : 'AWAITING ASSIGNMENT'}
                                  </span>
                                </div>

                                {nextLoadPreview ? (
                                  <>
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                      <article className="rounded-xl border border-indigo-100 bg-white p-3">
                                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Load ID</p>
                                        <p className="mt-1 text-[0.9rem] font-black text-indigo-700">{nextLoadPreview.loadId}</p>
                                      </article>
                                      <article className="rounded-xl border border-indigo-100 bg-white p-3">
                                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Route</p>
                                        <p className="mt-1 text-[0.82rem] font-bold text-slate-800">{nextLoadPreview.lane}</p>
                                      </article>
                                      <article className="rounded-xl border border-indigo-100 bg-white p-3">
                                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Pickup Window</p>
                                        <p className="mt-1 text-[0.82rem] font-bold text-slate-800">{nextLoadPreview.pickupWindow}</p>
                                      </article>
                                      <article className="rounded-xl border border-indigo-100 bg-white p-3">
                                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Revenue / Priority</p>
                                        <p className="mt-1 text-[0.82rem] font-bold text-emerald-700">{nextLoadPreview.revenue}</p>
                                        <p className="mt-0.5 text-[0.72rem] font-semibold text-slate-600">{nextLoadPreview.priority}</p>
                                      </article>
                                    </div>

                                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                      <article className="rounded-xl border border-indigo-100 bg-white p-4">
                                        <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-indigo-700">Preload Checklist</p>
                                        <ul className="mt-2 space-y-2">
                                          {nextLoadPrepItems.length > 0 ? nextLoadPrepItems.map((item) => (
                                            <li key={item} className="flex items-start gap-2 text-[0.78rem] font-semibold text-slate-700">
                                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-indigo-600" />
                                              <span>{item}</span>
                                            </li>
                                          )) : (
                                            <li className="text-[0.78rem] font-semibold text-slate-500">Checklist will appear after dispatch confirms documents.</li>
                                          )}
                                        </ul>
                                      </article>

                                      <article className="rounded-xl border border-indigo-100 bg-white p-4">
                                        <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-indigo-700">First Milestones</p>
                                        <div className="mt-2 space-y-2">
                                          {nextLoadMilestones.length > 0 ? nextLoadMilestones.map((step) => (
                                            <div key={`${step.label}-${step.window}`} className="rounded-lg bg-slate-50 px-3 py-2 text-[0.76rem] font-semibold text-slate-700">
                                              <p className="font-bold text-slate-800">{step.label}</p>
                                              <p className="mt-0.5 text-slate-500">{step.location} | {step.window}</p>
                                            </div>
                                          )) : (
                                            <p className="text-[0.78rem] font-semibold text-slate-500">Milestones pending from dispatch planner.</p>
                                          )}
                                        </div>
                                      </article>
                                    </div>
                                  </>
                                ) : (
                                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5">
                                    <p className="text-[0.82rem] font-semibold text-slate-600">No next load locked yet. Current load POD submit hote hi next assignment auto-populate ho jayega.</p>
                                  </div>
                                )}
                              </section>
                            </div>

                            <div className="col-span-12 space-y-6 xl:col-span-4">
                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="text-[1.05rem] font-black text-slate-900">Trip Metrics</h4>
                                <div className="mt-4 space-y-3">
                                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                    <span className="flex items-center gap-2 text-[0.78rem] font-semibold text-slate-600"><Route className="h-4 w-4 text-blue-600" />Distance</span>
                                    <span className="text-[0.9rem] font-black text-slate-800">{todaysLoad?.distance ?? activeDriverDispatch.distance}</span>
                                  </div>
                                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                    <span className="flex items-center gap-2 text-[0.78rem] font-semibold text-slate-600"><Clock3 className="h-4 w-4 text-blue-600" />Travel Time</span>
                                    <span className="text-[0.9rem] font-black text-slate-800">{todaysLoad?.driveTime ?? activeDriverDispatch.duration}</span>
                                  </div>
                                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                    <span className="flex items-center gap-2 text-[0.78rem] font-semibold text-slate-600"><Gauge className="h-4 w-4 text-blue-600" />Fuel Est.</span>
                                    <span className="text-[0.9rem] font-black text-slate-800">{formatCurrencyValue(estimatedFuelSpend)}</span>
                                  </div>
                                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                                    <span className="flex items-center gap-2 text-[0.78rem] font-semibold text-slate-600"><DollarSign className="h-4 w-4 text-blue-600" />Est. Net</span>
                                    <span className="text-[0.9rem] font-black text-emerald-600">{formatCurrencyValue(estimatedNetPayout)}</span>
                                  </div>
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-3">
                                  <h4 className="text-[1.05rem] font-black text-slate-900">HOS &amp; Break Safety</h4>
                                  <span className={`rounded-full px-2.5 py-1 text-[0.66rem] font-bold ${breakUrgencyTone}`}>
                                    {breakUrgencyLabel}
                                  </span>
                                </div>

                                <div className="mt-4 h-2 rounded-full bg-slate-100">
                                  <div className={`h-full rounded-full ${hosUsagePercent >= 85 ? 'bg-rose-500' : hosUsagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${hosUsagePercent}%` }} />
                                </div>

                                <div className="mt-4 grid gap-2 text-[0.74rem] font-semibold text-slate-700 sm:grid-cols-3 xl:grid-cols-1">
                                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Remaining Drive</p>
                                    <p className="mt-1 text-[0.82rem] font-black text-emerald-700">{formatHoursAndMinutes(hosPlanner.remainingHours)}</p>
                                  </div>
                                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Used Today</p>
                                    <p className="mt-1 text-[0.82rem] font-black text-slate-800">{formatHoursAndMinutes(hosPlanner.usedHours)}</p>
                                  </div>
                                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Break Due In</p>
                                    <p className="mt-1 text-[0.82rem] font-black text-amber-700">{formatHoursAndMinutes(hosPlanner.breakDueHours)}</p>
                                  </div>
                                </div>

                                <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-[0.74rem] font-semibold text-blue-700">
                                  Recommended stop: <span className="font-black">{hosPlanner.recommendedStop}</span>
                                </p>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[1.05rem] font-black text-slate-900">Current Load Health</h4>
                                  <span className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold ${loadHealthTone}`}>{loadHealthScore}/100</span>
                                </div>
                                <p className="mt-2 text-[0.74rem] font-semibold text-slate-600">
                                  Readiness {deliveryReadinessPercent}% | Risk radar {Math.round(averageRiskScore)}%
                                </p>
                                <div className="mt-3 h-2 rounded-full bg-slate-100">
                                  <div className={`h-full rounded-full ${loadHealthScore >= 80 ? 'bg-emerald-500' : loadHealthScore >= 65 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${loadHealthScore}%` }} />
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="text-[1.05rem] font-black text-slate-900">Company Contact</h4>
                                <div className="mt-4 space-y-3 text-[0.82rem] font-semibold text-slate-700">
                                  <p>Company Support: <span className="font-black">{companySupportName}</span></p>
                                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-blue-600" />{companySupportPhone}</p>
                                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-blue-600" />{companySupportEmail}</p>
                                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800">Company Emergency Line: {companyEmergencyLine}</p>
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="text-[1.05rem] font-black text-slate-900">Quick Communication</h4>
                                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[0.74rem] font-semibold text-slate-700">{dispatchDeskData.message}</p>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <a href={dispatchPhoneHref} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-[0.74rem] font-bold text-white">
                                    <Phone className="h-3.5 w-3.5" />
                                    Dispatch
                                  </a>
                                  <a href={supportPhoneHref} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.74rem] font-bold text-slate-700">
                                    <Phone className="h-3.5 w-3.5" />
                                    Support
                                  </a>
                                  <a href={`mailto:${dispatchDeskData.email}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.74rem] font-bold text-slate-700">
                                    <Mail className="h-3.5 w-3.5" />
                                    Email
                                  </a>
                                  <button
                                    type="button"
                                    onClick={handleQuickDispatchMessage}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.74rem] font-bold text-slate-700"
                                  >
                                    <Bot className="h-3.5 w-3.5" />
                                    Quick Msg
                                  </button>
                                </div>
                                <div className="mt-3 space-y-2">
                                  {commTemplates.map((template) => (
                                    <p key={template} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[0.72rem] font-semibold text-slate-600">{template}</p>
                                  ))}
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="text-[1.05rem] font-black text-slate-900">Driver Checklist</h4>
                                <ul className="mt-3 space-y-2">
                                  {checklist.map((item) => (
                                    <li key={item} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[0.78rem] font-semibold text-slate-700">
                                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="text-[1.05rem] font-black text-slate-900">Exception / Delay Reporting</h4>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  {exceptionTemplates.map((item) => (
                                    <button
                                      key={item}
                                      type="button"
                                      onClick={() => handleExceptionTemplatePick(item)}
                                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-[0.7rem] font-bold text-slate-700 hover:bg-slate-100"
                                    >
                                      {item}
                                    </button>
                                  ))}
                                </div>
                                <div className="mt-3 space-y-2">
                                  {recentExceptions.map((item) => (
                                    <div key={item.id} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                                      <p className="text-[0.73rem] font-black text-amber-800">{item.title}</p>
                                      <p className="mt-0.5 text-[0.7rem] font-semibold text-amber-700">{item.note}</p>
                                    </div>
                                  ))}
                                </div>
                              </section>

                              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                                <h4 className="text-[1.05rem] font-black text-emerald-900">Driver Payout Snapshot</h4>
                                <div className="mt-3 space-y-2 text-[0.78rem] font-semibold text-emerald-900">
                                  <div className="flex items-center justify-between">
                                    <span>Gross Revenue</span>
                                    <span className="font-black">{formatCurrencyValue(activeDispatchGross)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Fuel Estimate</span>
                                    <span className="font-black">{formatCurrencyValue(estimatedFuelSpend)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Toll Estimate</span>
                                    <span className="font-black">{formatCurrencyValue(estimatedTollSpend)}</span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-emerald-200 pt-2">
                                    <span className="text-[0.8rem]">Estimated Net</span>
                                    <span className="text-[0.92rem] font-black">{formatCurrencyValue(estimatedNetPayout)}</span>
                                  </div>
                                </div>
                                <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-[0.72rem] font-bold text-emerald-800">
                                  {payoutStatusLabel} | {payoutConfidence}
                                </p>
                              </section>

                              <div className="space-y-3">
                                <button
                                  type="button"
                                  onClick={handleSubmitPodToCompany}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white"
                                >
                                  Submit POD to Company
                                  <ArrowRight className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleSavePodDraftAction}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700"
                                >
                                  Save POD Draft
                                </button>
                              </div>

                              <section className="rounded-xl border-l-4 border-amber-400 bg-amber-50 p-4">
                                <p className="flex items-start gap-2 text-[0.76rem] font-semibold leading-relaxed text-amber-800">
                                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                  <span>
                                    <span className="block font-black">Final Company Review</span>
                                    After submission, company ops verifies POD docs and then updates payout status for this load.
                                  </span>
                                </p>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-[1.05rem] font-black text-slate-900">Offline Sync Queue</h4>
                                  <span className={`rounded-full px-2.5 py-1 text-[0.66rem] font-bold ${offlineQueueCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {offlineQueueCount > 0 ? `${offlineQueueCount} pending` : 'Synced'}
                                  </span>
                                </div>
                                <p className="mt-2 text-[0.74rem] font-semibold text-slate-600">{connectivityLabel}</p>
                                <p className="mt-1 text-[0.72rem] font-semibold text-slate-500">Last sync: 2 min ago</p>
                              </section>

                              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-sm">
                                <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-blue-100">Next Load Preview</p>
                                {nextLoadPreview ? (
                                  <>
                                    <p className="mt-1 text-[0.92rem] font-black">{nextLoadPreview.loadId}</p>
                                    <p className="mt-1 text-[0.78rem] font-semibold text-blue-100">{nextLoadPreview.lane}</p>
                                    <p className="mt-2 flex items-center gap-2 text-[0.74rem] font-semibold text-blue-100">
                                      <CalendarDays className="h-4 w-4" />
                                      Pickup {nextLoadPreview.pickupWindow}
                                    </p>
                                    <p className="mt-1 flex items-center gap-2 text-[0.74rem] font-semibold text-blue-100">
                                      <Truck className="h-4 w-4" />
                                      Revenue {nextLoadPreview.revenue}
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <p className="mt-1 text-[0.92rem] font-black">No next load assigned</p>
                                    <p className="mt-2 text-[0.74rem] font-semibold text-blue-100">Dispatch team will push next assignment after current POD closure.</p>
                                  </>
                                )}
                              </section>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </article>
                </div>
              </section>
            ) : activeSection === 'drivers' ? (
              <section className="flex h-[calc(100vh-85px)] flex-col bg-slate-50">
                <div className="shrink-0 border-b border-slate-200 bg-white shadow-sm z-20">
                  <div className="flex flex-col justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center lg:px-8">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-800">Live Bids Marketplace</h2>
                      <p className="mt-1 text-[0.82rem] font-semibold text-slate-500">Portal-scheduled manual bidding. Open panel manually anytime to monitor countdown; bidding auto-closes after 2 min.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        ref={bidSheetInputRef}
                        type="file"
                        accept=".csv,.json"
                        onChange={handleBidSheetSelection}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={handleImportBidSheet}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Import Bid Sheet
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateManualBid}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Create Manual Bid
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 px-6 pb-3 pt-1 sm:grid-cols-2 xl:grid-cols-5 lg:px-8">
                    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-slate-500">Open Bids</p>
                      <p className="mt-1 text-[1.6rem] font-black text-slate-900">{bidSummary.openCount}</p>
                    </article>
                    <article className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-rose-600">Expiring Soon</p>
                      <p className="mt-1 text-[1.6rem] font-black text-rose-700">{bidSummary.expiringSoon}</p>
                    </article>
                    <article className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-blue-600">Avg RPM</p>
                      <p className="mt-1 text-[1.6rem] font-black text-blue-700">${bidSummary.avgRpm.toFixed(2)}</p>
                    </article>
                    <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-emerald-700">Potential Revenue</p>
                      <p className="mt-1 text-[1.2rem] font-black text-emerald-700">{formatCurrencyValue(bidSummary.potentialRevenue)}</p>
                    </article>
                    <article className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
                      <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-violet-700">High-Fit Lanes</p>
                      <p className="mt-1 text-[1.6rem] font-black text-violet-700">{bidSummary.highFitCount}</p>
                    </article>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 bg-slate-50/80 px-6 py-3 lg:px-8">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <span>Type:</span>
                      <select
                        value={bidFilters.type}
                        onChange={(event) => setBidFilters((previous) => ({ ...previous, type: event.target.value }))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                      >
                        {bidTypeOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <span>Urgency:</span>
                      <select
                        value={bidFilters.urgency}
                        onChange={(event) => setBidFilters((previous) => ({ ...previous, urgency: event.target.value }))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                      >
                        {bidUrgencyOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <span>Equipment:</span>
                      <select
                        value={bidFilters.equipment}
                        onChange={(event) => setBidFilters((previous) => ({ ...previous, equipment: event.target.value }))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                      >
                        {bidEquipmentOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <span>Region:</span>
                      <select
                        value={bidFilters.region}
                        onChange={(event) => setBidFilters((previous) => ({ ...previous, region: event.target.value }))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                      >
                        {bidRegionOptions.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>

                    <div className="ml-auto w-full md:w-[280px]">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={bidSearchQuery}
                          onChange={(event) => setBidSearchQuery(event.target.value)}
                          placeholder="Search lane, customer, bid id..."
                          className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBidFilters({ type: 'All Types', urgency: 'All Urgency', equipment: 'All Equipment', region: 'All Regions' })
                        setBidSearchQuery('')
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                      Clear
                    </button>
                  </div>

                  {driverWonShipments.length > 0 ? (
                    <div className="mx-6 mb-4 mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 lg:mx-8">
                      <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-emerald-700">Won Shipment Details</p>
                      <p className="mt-1 text-[0.88rem] font-black">{driverWonShipments[0].id} | {driverWonShipments[0].lane}</p>
                      <div className="mt-2 grid grid-cols-1 gap-1.5 text-[0.74rem] font-semibold sm:grid-cols-2 lg:grid-cols-4">
                        <p>Customer: <span className="font-black">{driverWonShipments[0].customerName}</span></p>
                        <p>Pickup: <span className="font-black">{driverWonShipments[0].pickupWindow}</span></p>
                        <p>Delivery: <span className="font-black">{driverWonShipments[0].deliveryWindow}</span></p>
                        <p>Equipment: <span className="font-black">{driverWonShipments[0].equipment}</span></p>
                        <p>Weight: <span className="font-black">{(driverWonShipments[0].weightLbs ?? 0).toLocaleString()} lbs</span></p>
                        <p>Pallets: <span className="font-black">{driverWonShipments[0].palletCount}</span></p>
                        <p>Commodity: <span className="font-black">{driverWonShipments[0].commodity}</span></p>
                        <p>Winning Amount: <span className="font-black">{formatCurrencyValue((manualAuctionByBidId[driverWonShipments[0].id]?.participants ?? []).find((participant) => participant.id === 'driver-self')?.amount ?? 0)}</span></p>
                      </div>
                    </div>
                  ) : null}

                  {(bidActionMessage || lastImportedBidSheet) ? (
                    <div className="pointer-events-none fixed right-6 top-[96px] z-[120] w-full max-w-[360px]">
                      <div className="rounded-xl border border-blue-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
                        {bidActionMessage ? (
                          <p className="text-[0.75rem] font-semibold text-blue-700">{bidActionMessage}</p>
                        ) : null}
                        {lastImportedBidSheet ? (
                          <p className="mt-1 text-[0.72rem] font-semibold text-slate-500">Last imported sheet: {lastImportedBidSheet}</p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="relative flex-1 overflow-hidden">
                  <div className="dashboard-scrollbar h-full overflow-y-auto px-6 py-5 lg:px-8">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                      {filteredBids.length > 0 ? (
                        filteredBids.map((bid) => {
                          const isSelected = selectedBid?.id === bid.id
                          const isWatched = watchedBidIds.includes(bid.id)
                          const portalSecondsToStart = Math.max(0, Math.ceil((bid.biddingStartAt - manualAuctionNow) / 1000))
                          const portalSecondsToClose = Math.max(0, Math.ceil((bid.biddingEndAt - manualAuctionNow) / 1000))
                          const isPortalLive = manualAuctionNow >= bid.biddingStartAt && manualAuctionNow < bid.biddingEndAt
                          const isPortalClosed = manualAuctionNow >= bid.biddingEndAt
                          const isPortalOpeningSoon = !isPortalLive && !isPortalClosed && manualAuctionNow >= (bid.biddingStartAt - 10000)
                          const portalStatusState = isPortalLive
                            ? 'LIVE'
                            : isPortalClosed
                              ? 'CLOSED'
                              : isPortalOpeningSoon
                                ? 'OPENING'
                                : 'SCHEDULED'
                          const portalStatusCountdown = isPortalClosed
                            ? '00:00'
                            : formatCountdownClock(isPortalLive ? portalSecondsToClose : portalSecondsToStart)
                          const portalStatusStyle = isPortalLive
                            ? 'bg-emerald-100 text-emerald-700'
                            : isPortalClosed
                              ? 'bg-slate-200 text-slate-700'
                              : isPortalOpeningSoon
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'

                          return (
                            <article
                              key={bid.id}
                              onClick={() => handleOpenBidDetails(bid.id)}
                              className={`cursor-pointer rounded-2xl border bg-white p-4 shadow-sm transition ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-slate-500">{bid.id} | {bid.bidType}</p>
                                  <h4 className="mt-1 text-[1rem] font-black text-slate-900">{bid.lane}</h4>
                                  <p className="mt-1 text-[0.78rem] font-semibold text-slate-600">{bid.customerName}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-bold ${bid.urgency === 'High' ? 'bg-rose-100 text-rose-700' : bid.urgency === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {bid.urgency}
                                  </span>
                                  <span className={`inline-flex min-w-[132px] items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold whitespace-nowrap ${portalStatusStyle}`}>
                                    <span>{portalStatusState}</span>
                                    <span className="font-black tabular-nums">{portalStatusCountdown}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                                <div className="rounded-lg bg-slate-50 px-3 py-2">
                                  <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Ask</p>
                                  <p className="mt-0.5 text-[0.86rem] font-black text-slate-800">{formatCurrencyValue(bid.askRate)}</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 px-3 py-2">
                                  <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Floor</p>
                                  <p className="mt-0.5 text-[0.86rem] font-black text-amber-700">{formatCurrencyValue(bid.floorRate)}</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 px-3 py-2">
                                  <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Miles / RPM</p>
                                  <p className="mt-0.5 text-[0.82rem] font-black text-slate-800">{bid.laneMiles} mi | ${bid.rpm.toFixed(2)}</p>
                                </div>
                                <div className="rounded-lg bg-slate-50 px-3 py-2">
                                  <p className="text-[0.64rem] font-bold uppercase tracking-[0.08em] text-slate-500">Portal Start</p>
                                  <p className="mt-0.5 text-[0.76rem] font-black text-slate-800">{formatPortalTimestamp(bid.biddingStartAt)}</p>
                                </div>
                              </div>

                              <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-[0.74rem] font-semibold text-blue-700">{bid.note}</p>

                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    toggleWatchBid(bid.id)
                                  }}
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[0.74rem] font-bold ${isWatched ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600'}`}
                                >
                                  <Star className={`h-3.5 w-3.5 ${isWatched ? 'fill-current' : ''}`} />
                                  {isWatched ? 'Watching' : 'Watch'}
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleOpenManualBidding(bid)
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[0.74rem] font-bold text-white hover:bg-blue-700"
                                >
                                  <DollarSign className="h-3.5 w-3.5" />
                                  Open Manual Bidding
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleOpenBidDetails(bid.id)
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.74rem] font-bold text-slate-600"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Details
                                </button>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleOpenManualBidding(bid)
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-[0.74rem] font-bold text-violet-700 hover:bg-violet-100"
                                >
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  Go Live
                                </button>
                              </div>
                            </article>
                          )
                        })
                      ) : (
                        <article className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">
                          <p className="text-[0.95rem] font-bold text-slate-700">No live bids matched these filters.</p>
                          <p className="mt-1 text-[0.8rem] font-semibold text-slate-500">Try clearing filters or broaden search to see more lane opportunities.</p>
                        </article>
                      )}
                    </div>
                  </div>

                  {isBidDetailsPanelOpen ? (
                    <div
                      className="fixed left-0 right-0 bottom-0 top-[84px] z-[90] bg-slate-900/5"
                      onClick={() => setIsBidDetailsPanelOpen(false)}
                    />
                  ) : null}

                  <aside
                    className={`fixed right-0 top-[84px] z-[100] h-[calc(100vh-84px)] w-full max-w-[520px] transform border-l border-slate-200 bg-white shadow-[0_0_35px_rgba(15,23,42,0.12)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col ${isBidDetailsPanelOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}
                  >
                    {isBidDetailsPanelOpen && selectedBid ? (
                      <>
                        <div className="shrink-0 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-5 py-4 text-white">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[0.64rem] font-bold uppercase tracking-[0.1em] text-blue-200">Bid Details</p>
                              <h3 className="mt-1 text-[1.1rem] font-black tracking-tight">{selectedBid.id}</h3>
                              <p className="mt-1 text-[0.76rem] font-semibold text-slate-200">{selectedBid.customerName}</p>
                              <p className="mt-1 text-[0.76rem] font-semibold text-blue-100">{selectedBid.lane}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsBidDetailsPanelOpen(false)}
                              className="rounded-full p-2 text-slate-200 transition-colors hover:bg-white/15 hover:text-white"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-[0.64rem] font-bold ${selectedBid.urgency === 'High' ? 'bg-rose-100 text-rose-700' : selectedBid.urgency === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {selectedBid.urgency} Priority
                            </span>
                            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[0.64rem] font-bold text-blue-50">{selectedBid.bidType}</span>
                            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[0.64rem] font-bold text-blue-50">Score {selectedBid.score}/100</span>
                          </div>
                        </div>

                        <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2">
                          <div className="flex flex-wrap gap-2">
                            {['Overview', 'Manual Setup', 'Driver Fit', 'Manual Bidding'].map((tab) => (
                            <button
                              key={tab}
                              type="button"
                              onClick={() => handleBidDetailsTabChange(tab)}
                              className={`rounded-lg px-3 py-1.5 text-[0.74rem] font-bold transition-colors ${bidDetailsTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                              {tab}
                            </button>
                            ))}
                          </div>
                        </div>

                        <div className="dashboard-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                          {bidDetailsTab === 'Overview' ? (
                            <>
                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="text-[0.95rem] font-black text-slate-800">Load Photos</h4>
                                <p className="mt-1 text-[0.72rem] font-semibold text-slate-500">Shipment preview from dock and cargo checkpoints.</p>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                  {(selectedBid.loadPhotos ?? []).map((photo) => (
                                    <figure key={photo.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm">
                                      <img src={photo.url} alt={photo.label} className="h-28 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                                      <figcaption className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-slate-900/85 to-transparent px-2 py-2 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-white">
                                        {photo.label}
                                      </figcaption>
                                    </figure>
                                  ))}
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="text-[0.95rem] font-black text-slate-800">Load Windows & Equipment</h4>
                                <div className="mt-3 grid gap-2 text-[0.76rem] font-semibold text-slate-700">
                                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span>Pickup Location</span>
                                    <span className="font-black text-slate-800">{selectedBid.origin || selectedBid.lane.split('->')[0]?.trim() || 'Not available'}</span>
                                  </div>
                                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span>Pickup Window</span>
                                    <span className="font-black text-slate-800">{selectedBid.pickupWindow}</span>
                                  </div>
                                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span>Delivery Window</span>
                                    <span className="font-black text-slate-800">{selectedBid.deliveryWindow}</span>
                                  </div>
                                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span>Equipment</span>
                                    <span className="font-black text-slate-800">{selectedBid.equipment}</span>
                                  </div>
                                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span>Portal Bidding Start</span>
                                    <span className="font-black text-slate-800">{formatPortalTimestamp(selectedBid.biddingStartAt)}</span>
                                  </div>
                                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span>Portal Bidding End</span>
                                    <span className="font-black text-slate-800">{formatPortalTimestamp(selectedBid.biddingEndAt)}</span>
                                  </div>
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="text-[0.95rem] font-black text-slate-800">Shipment Specs</h4>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-[0.76rem] font-semibold text-slate-700">
                                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Weight</p>
                                    <p className="mt-0.5 font-black text-slate-800">{(selectedBid.weightLbs ?? 0).toLocaleString()} lbs</p>
                                  </div>
                                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Size</p>
                                    <p className="mt-0.5 font-black text-slate-800">{selectedBid.dimensions}</p>
                                  </div>
                                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Pallets</p>
                                    <p className="mt-0.5 font-black text-slate-800">{selectedBid.palletCount}</p>
                                  </div>
                                  <div className="rounded-lg bg-slate-50 px-3 py-2">
                                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Pieces</p>
                                    <p className="mt-0.5 font-black text-slate-800">{selectedBid.pieceCount}</p>
                                  </div>
                                </div>

                                <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[0.76rem] font-semibold text-slate-700">
                                  <p><span className="font-bold text-slate-500">Commodity:</span> <span className="font-black text-slate-800">{selectedBid.commodity}</span></p>
                                  <p className="mt-1"><span className="font-bold text-slate-500">Handling:</span> {selectedBid.handlingNotes}</p>
                                  <p className="mt-1"><span className="font-bold text-slate-500">Temp Control:</span> {selectedBid.temperatureControl ? 'Required' : 'Not Required'}</p>
                                  <p className="mt-1"><span className="font-bold text-slate-500">Hazmat:</span> {selectedBid.requiresHazmat ? 'Yes' : 'No'}</p>
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[0.95rem] font-black text-slate-800">Company Contact Desk</h4>
                                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[0.62rem] font-bold text-blue-700">24/7 Support</span>
                                </div>

                                <div className="mt-3 space-y-2 text-[0.78rem] font-semibold text-slate-700">
                                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5 text-blue-600" />Dispatcher</span>
                                    <span className="font-black text-slate-800">{bidPanelCompanyContact.dispatcher}</span>
                                  </div>

                                  <a
                                    href={`tel:${bidPanelCompanyContact.dispatchPhone.replace(/[^+\d]/g, '')}`}
                                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 hover:bg-blue-50"
                                  >
                                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-blue-600" />Dispatch Line</span>
                                    <span className="font-black text-slate-800">{bidPanelCompanyContact.dispatchPhone}</span>
                                  </a>

                                  <a
                                    href={`mailto:${bidPanelCompanyContact.dispatchEmail}`}
                                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 hover:bg-blue-50"
                                  >
                                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-blue-600" />Dispatch Email</span>
                                    <span className="font-black text-slate-800">Contact</span>
                                  </a>

                                  <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                                    <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Emergency Line</span>
                                    <span className="font-black">{bidPanelCompanyContact.emergencyLine}</span>
                                  </div>

                                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-emerald-600" />Support Desk</span>
                                    <span className="font-black text-slate-800">{bidPanelCompanyContact.supportPhone}</span>
                                  </div>
                                </div>
                              </section>

                            </>
                          ) : null}

                          {bidDetailsTab === 'Manual Setup' ? (
                            <>
                              <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                                <h4 className="text-[0.95rem] font-black text-emerald-800">Personal Bid Desk</h4>
                                <p className="mt-1 text-[0.74rem] font-semibold text-emerald-700">Set your manual bid amount and submit only in the portal time window.</p>

                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handlePersonalBidPreset(selectedBid, 'ask')}
                                    className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[0.72rem] font-bold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    Match Ask
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePersonalBidPreset(selectedBid, 'floor')}
                                    className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[0.72rem] font-bold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    Use Floor
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePersonalBidPreset(selectedBid, 'plus-100')}
                                    className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[0.72rem] font-bold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    Ask +100
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePersonalBidPreset(selectedBid, 'minus-100')}
                                    className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[0.72rem] font-bold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    Ask -100
                                  </button>
                                </div>

                                <div className="mt-3 rounded-lg bg-white p-3">
                                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-slate-500">Your Bid Amount</p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[0.8rem] font-black text-slate-700">$</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={Math.max(0, Math.round(selectedBidPersonalDraft))}
                                      onChange={(event) => handlePersonalBidDraftChange(selectedBid.id, event.target.value)}
                                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem] font-bold text-slate-800"
                                    />
                                  </div>
                                  <p className={`mt-2 text-[0.72rem] font-bold ${selectedBidPersonalGapFromAsk > 0 ? 'text-amber-700' : selectedBidPersonalGapFromAsk < 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                                    {selectedBidPersonalGapFromAsk === 0
                                      ? 'Matches market ask.'
                                      : selectedBidPersonalGapFromAsk > 0
                                        ? `${formatCurrencyValue(selectedBidPersonalGapFromAsk)} above ask.`
                                        : `${formatCurrencyValue(Math.abs(selectedBidPersonalGapFromAsk))} below ask.`}
                                  </p>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSavePersonalBid(selectedBid)}
                                    className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-[0.74rem] font-bold text-emerald-700 hover:bg-emerald-100"
                                  >
                                    Save Personal Draft
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenManualBidding(selectedBid)}
                                    className="rounded-lg bg-emerald-600 px-3 py-2 text-[0.74rem] font-bold text-white hover:bg-emerald-700"
                                  >
                                    Open Live Auction
                                  </button>
                                </div>
                              </section>

                              <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
                                <h4 className="text-[0.95rem] font-black text-blue-800">Manual Bid Reference</h4>
                                <div className="mt-3 space-y-2 text-[0.78rem] font-semibold text-blue-900">
                                  <div className="flex items-center justify-between">
                                    <span>Market Ask</span>
                                    <span className="font-black">{formatCurrencyValue(selectedBid.askRate)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Floor Bid</span>
                                    <span className="font-black">{formatCurrencyValue(selectedBid.floorRate)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Portal Start</span>
                                    <span className="font-black">{formatPortalTimestamp(selectedBid.biddingStartAt)}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Portal End</span>
                                    <span className="font-black">{formatPortalTimestamp(selectedBid.biddingEndAt)}</span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-blue-200 pt-2">
                                    <span>Lane Score</span>
                                    <span className="font-black">{selectedBid.score}/100</span>
                                  </div>
                                </div>
                              </section>

                              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="text-[0.95rem] font-black text-slate-800">Pre-Bid Checklist</h4>
                                <ul className="mt-3 space-y-2">
                                  {[
                                    'Confirm dock appointment windows',
                                    'Validate detention + layover terms',
                                    'Check fuel and toll exposure for lane',
                                    'Prepare counter-offer backup amount',
                                  ].map((item) => (
                                    <li key={item} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[0.76rem] font-semibold text-slate-700">
                                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </section>

                              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                                <h4 className="text-[0.95rem] font-black text-amber-800">Portal Signals</h4>
                                <div className="mt-3 space-y-2 text-[0.78rem] font-semibold text-amber-800">
                                  <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
                                    <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Opens</span>
                                    <span className="font-black">{formatPortalTimestamp(selectedBid.biddingStartAt)}</span>
                                  </div>
                                  <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
                                    <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Closes</span>
                                    <span className="font-black">{formatPortalTimestamp(selectedBid.biddingEndAt)}</span>
                                  </div>
                                  <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
                                    <span className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Urgency</span>
                                    <span className="font-black">{selectedBid.urgency}</span>
                                  </div>
                                  <div className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
                                    <span className="flex items-center gap-1.5"><History className="h-3.5 w-3.5" />Bid Type</span>
                                    <span className="font-black">{selectedBid.bidType}</span>
                                  </div>
                                </div>
                              </section>
                            </>
                          ) : null}

                          {bidDetailsTab === 'Manual Bidding' ? (
                            <>
                              <section className="rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[0.95rem] font-black text-violet-800">Live Manual Auction</h4>
                                  <span className={`rounded-full px-2.5 py-1 text-[0.62rem] font-bold ${selectedBidManualAuction?.isOpen ? 'bg-emerald-100 text-emerald-700' : selectedBidManualAuction?.isClosed ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {selectedBidManualAuction?.isOpen ? 'LIVE' : selectedBidManualAuction?.isClosed ? 'CLOSED' : 'SCHEDULED'}
                                  </span>
                                </div>

                                {selectedBidManualIsPreLive ? (
                                  <div className="mt-4 flex min-h-[370px] flex-col items-center justify-center rounded-2xl border border-violet-200 bg-white px-4 text-center">
                                    <p className="text-[0.66rem] font-bold uppercase tracking-[0.1em] text-violet-500">Portal Countdown</p>
                                    <p className="mt-2 min-w-[7ch] text-[2rem] font-black tracking-tight text-violet-700 tabular-nums">{selectedBidManualCountdown}</p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                      <div className="rounded-lg bg-white px-3 py-2">
                                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Timer</p>
                                        <p className="mt-0.5 min-w-[7ch] text-[1rem] font-black text-violet-700 tabular-nums">{selectedBidManualCountdown}</p>
                                      </div>
                                      <div className="rounded-lg bg-white px-3 py-2">
                                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Winning Bid</p>
                                        <p className="mt-0.5 text-[1rem] font-black text-slate-800 tabular-nums">{formatCurrencyValue(selectedBidManualLeader?.amount ?? 0)}</p>
                                      </div>
                                      <div className="rounded-lg bg-white px-3 py-2">
                                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">Current Leader</p>
                                        <p className="mt-0.5 truncate text-[0.9rem] font-black text-slate-800">{selectedBidManualLeader?.name ?? 'No leader yet'}</p>
                                      </div>
                                      <div className="rounded-lg bg-white px-3 py-2">
                                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.08em] text-slate-500">My Rank</p>
                                        <p className="mt-0.5 text-[1rem] font-black text-slate-800 tabular-nums">{selectedBidManualDriverRank ? `#${selectedBidManualDriverRank}` : '--'}</p>
                                      </div>
                                    </div>

                                    <div className="mt-2 grid grid-cols-1 gap-2 text-[0.72rem] font-semibold text-violet-900 sm:grid-cols-2">
                                      <div className="rounded-lg bg-white px-3 py-2">
                                        Portal Start: <span className="font-black tabular-nums">{formatPortalTimestamp(selectedBid.biddingStartAt)}</span>
                                      </div>
                                      <div className="rounded-lg bg-white px-3 py-2">
                                        Portal End: <span className="font-black tabular-nums">{formatPortalTimestamp(selectedBid.biddingEndAt)}</span>
                                      </div>
                                    </div>

                                    {selectedBidManualAuction?.isClosed ? (
                                      <p className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-[0.72rem] font-bold text-white">
                                        Round closed. Winner: {selectedBidManualWinner?.name ?? selectedBidManualLeader?.name ?? 'N/A'} at {formatCurrencyValue(selectedBidManualWinner?.amount ?? selectedBidManualLeader?.amount ?? 0)}.
                                      </p>
                                    ) : null}

                                    <div className="mt-3 rounded-xl border border-violet-200 bg-white p-3">
                                      <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-slate-500">Place Your Live Bid</p>
                                      <div className="mt-2 flex items-center gap-2">
                                        <span className="rounded-md bg-slate-100 px-2 py-1 text-[0.8rem] font-black text-slate-700">$</span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={Math.max(0, Math.round(selectedBidPersonalDraft))}
                                          onChange={(event) => handlePersonalBidDraftChange(selectedBid.id, event.target.value)}
                                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem] font-bold text-slate-800"
                                        />
                                      </div>

                                      <div className="mt-3 grid grid-cols-2 gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handlePlaceManualAuctionBid(selectedBid)}
                                          disabled={!selectedBidManualAuction?.isOpen}
                                          className={`rounded-lg px-3 py-2 text-[0.74rem] font-bold text-white ${selectedBidManualAuction?.isOpen ? 'bg-violet-600 hover:bg-violet-700' : 'cursor-not-allowed bg-slate-400'}`}
                                        >
                                          Submit Live Bid
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setBidDetailsTab('Manual Setup')}
                                          className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-[0.74rem] font-bold text-violet-700 hover:bg-violet-100"
                                        >
                                          Edit Bid Draft
                                        </button>
                                      </div>
                                    </div>

                                    <p className="mt-3 rounded-lg bg-violet-100 px-3 py-2 text-[0.72rem] font-bold text-violet-800">
                                      Highest bid at timer close wins parcel allocation for this lane.
                                    </p>

                                    <div className="mt-2 min-h-[38px]">
                                      {selectedBidManualLeaderGap > 0 ? (
                                        <p className="rounded-lg bg-amber-100 px-3 py-2 text-[0.72rem] font-bold text-amber-800">
                                          You are behind leader by {formatCurrencyValue(selectedBidManualLeaderGap)}. Increase your bid to move up.
                                        </p>
                                      ) : selectedBidManualDriverEntry ? (
                                        <p className="rounded-lg bg-emerald-100 px-3 py-2 text-[0.72rem] font-bold text-emerald-800">
                                          You are leading this round. Hold or adjust before timer closes.
                                        </p>
                                      ) : null}
                                    </div>

                                    {selectedBidManualAuction?.isClosed && selectedBidManualWinner?.isDriver ? (
                                      <section className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">
                                        <p className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-emerald-700">Winner Shipment Info</p>
                                        <p className="mt-1 text-[0.86rem] font-black">You won {selectedBid.id} with {formatCurrencyValue(selectedBidManualWinner.amount)}.</p>
                                        <div className="mt-2 grid grid-cols-1 gap-1.5 text-[0.74rem] font-semibold sm:grid-cols-2">
                                          <p>Lane: <span className="font-black">{selectedBid.lane}</span></p>
                                          <p>Customer: <span className="font-black">{selectedBid.customerName}</span></p>
                                          <p>Pickup: <span className="font-black">{selectedBid.pickupWindow}</span></p>
                                          <p>Delivery: <span className="font-black">{selectedBid.deliveryWindow}</span></p>
                                          <p>Equipment: <span className="font-black">{selectedBid.equipment}</span></p>
                                          <p>Weight: <span className="font-black">{(selectedBid.weightLbs ?? 0).toLocaleString()} lbs</span></p>
                                          <p>Dimensions: <span className="font-black">{selectedBid.dimensions}</span></p>
                                          <p>Commodity: <span className="font-black">{selectedBid.commodity}</span></p>
                                          <p className="sm:col-span-2">Handling Notes: <span className="font-black">{selectedBid.handlingNotes}</span></p>
                                        </div>
                                      </section>
                                    ) : null}
                                  </>
                                )}
                              </section>

                              {selectedBidManualCanRevealData ? (
                                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm min-h-[300px]">
                                  <h4 className="text-[0.95rem] font-black text-slate-800">Realtime Bidboard</h4>
                                  <div className="mt-3 max-h-[240px] space-y-2 overflow-y-auto pr-1">
                                    {selectedBidManualRanking.length > 0 ? selectedBidManualRanking.map((participant, index) => (
                                      <div key={participant.id} className={`flex min-h-[56px] items-center justify-between rounded-lg px-3 py-2 text-[0.76rem] font-semibold ${index === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-700'}`}>
                                        <div className="min-w-0">
                                          <p className="truncate font-black">#{index + 1} {participant.name}</p>
                                          <p className="text-[0.68rem] font-semibold text-slate-500 tabular-nums">Updated {new Date(participant.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                                        </div>
                                        <p className="ml-3 font-black tabular-nums">{formatCurrencyValue(participant.amount)}</p>
                                      </div>
                                    )) : (
                                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-[0.78rem] font-semibold text-slate-500">
                                        Bidboard activates when portal bidding window starts.
                                      </div>
                                    )}
                                  </div>
                                </section>
                              ) : null}
                            </>
                          ) : null}

                          {bidDetailsTab === 'Driver Fit' ? (
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                              <h4 className="text-[0.95rem] font-black text-slate-800">Can Driver Take This Load?</h4>
                              <div className="mt-3 space-y-2 text-[0.76rem] font-semibold text-slate-700">
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                  <span className="flex items-center gap-1.5">
                                    {selectedBidFitCheck?.equipmentCompatible ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />}
                                    Equipment Match
                                  </span>
                                  <span className="font-black">{selectedBidFitCheck?.driverEquipment} vs {selectedBid.equipment}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                  <span className="flex items-center gap-1.5">
                                    {selectedBidFitCheck?.weightCompatible ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />}
                                    Weight Capacity
                                  </span>
                                  <span className="font-black">{(selectedBid.weightLbs ?? 0).toLocaleString()} / {(selectedBidFitCheck?.driverCapacityLbs ?? 0).toLocaleString()} lbs</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                  <span className="flex items-center gap-1.5">
                                    {selectedBidFitCheck?.sizeCompatible ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />}
                                    Trailer Size Fit
                                  </span>
                                  <span className="font-black">{selectedBid.lengthFt} ft load / {selectedBidFitCheck?.driverTrailerLengthFt ?? '--'} ft trailer</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                                  <span className="flex items-center gap-1.5">
                                    {selectedBidFitCheck?.hazmatCompatible ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />}
                                    Hazmat Clearance
                                  </span>
                                  <span className="font-black">{selectedBid.requiresHazmat ? 'Required' : 'Not Required'}</span>
                                </div>
                              </div>

                              <div className={`mt-3 rounded-lg px-3 py-2 text-[0.78rem] font-bold ${selectedBidFitCheck?.canTakeLoad ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {selectedBidFitCheck?.canTakeLoad
                                  ? 'Based on the current driver profile, this load can be accepted.'
                                  : 'Resolve the mismatch points before accepting this load.'}
                              </div>
                            </section>
                          ) : null}
                        </div>

                        <div className="shrink-0 border-t border-slate-200 bg-white p-4">
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                            <button
                              type="button"
                              onClick={() => toggleWatchBid(selectedBid.id)}
                              className={`inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[0.72rem] font-bold ${watchedBidIds.includes(selectedBid.id) ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                            >
                              <Star className={`h-3.5 w-3.5 ${watchedBidIds.includes(selectedBid.id) ? 'fill-current' : ''}`} />
                              {watchedBidIds.includes(selectedBid.id) ? 'Watching' : 'Watch'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenManualBidding(selectedBid)}
                              className="inline-flex items-center justify-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-2 text-[0.72rem] font-bold text-violet-700 hover:bg-violet-100"
                            >
                              <TrendingUp className="h-3.5 w-3.5" />
                              Manual
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsBidDetailsPanelOpen(false)}
                              className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-[0.72rem] font-bold text-slate-600 hover:bg-slate-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              Close
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
                        {isBidDetailsPanelOpen ? (
                          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                            <p className="text-[0.9rem] font-bold text-slate-700">No bid selected for details.</p>
                            <p className="mt-1 text-[0.78rem] font-semibold text-slate-500">Choose a bid card and click Details to populate this panel.</p>
                          </section>
                        ) : (
                          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
                            <p className="text-[0.9rem] font-bold text-slate-700">Details panel closed.</p>
                            <p className="mt-1 text-[0.78rem] font-semibold text-slate-500">Click any bid card or Details button to open this side panel.</p>
                          </section>
                        )}
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            ) : activeSection === 'routes' ? (
              <section className="flex h-[calc(100vh-85px)] flex-col overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40">
                <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4 lg:px-8">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-[1.92rem] font-black tracking-tight text-slate-900">Driver Shipment Journey</h2>
                      <p className="mt-1 text-[0.8rem] font-semibold text-slate-500">Advanced driver view: current active shipment first, then won-bid shipment auto-switch after delivery.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.06em] ${driverRouteJourneyShipment?.sourceType === 'won-bid-shipment' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                        {driverRouteJourneyShipment?.headerLabel ?? 'No Active Shipment'}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[0.66rem] font-black uppercase tracking-[0.06em] text-slate-700">
                        {driverRouteJourneyShipment?.sourceType === 'won-bid-shipment' ? 'From Bidding' : 'Current Dispatch'}
                      </span>
                      <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[0.68rem] font-black text-emerald-800">
                        {driverRouteProgressPercent}% route complete
                      </span>
                      <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[0.68rem] font-black text-amber-800">
                        Delay: {driverRouteJourneyShipment?.delayTime ?? '--'}
                      </span>
                    </div>
                  </div>
                </div>

                {driverRouteJourneyShipment ? (
                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-6 pt-4 lg:grid-cols-[1.42fr_0.96fr] lg:px-8">
                    <div className="min-h-0 grid h-full grid-rows-[auto_minmax(0,1fr)_auto] gap-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-600 to-blue-500 p-4 text-white shadow-[0_16px_36px_-28px_rgba(37,99,235,0.9)] xl:col-span-2">
                          <p className="text-[0.64rem] font-bold uppercase tracking-[0.1em] text-blue-100">Route Corridor</p>
                          <p className="mt-1 text-[0.92rem] font-black tracking-tight">{driverRouteJourneyShipment.origin} -&gt; {driverRouteJourneyShipment.destination}</p>
                          <p className="mt-1 text-[0.66rem] font-semibold text-blue-100">Load {driverRouteJourneyShipment.loadId}</p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-[0_14px_30px_-28px_rgba(5,150,105,0.85)]">
                          <p className="text-[0.64rem] font-bold uppercase tracking-[0.1em] text-emerald-600">ETA</p>
                          <p className="mt-1 text-[0.9rem] font-black text-emerald-900 tabular-nums">{driverRouteJourneyShipment.eta}</p>
                        </div>
                        <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-[0_14px_30px_-28px_rgba(217,119,6,0.8)]">
                          <p className="text-[0.64rem] font-bold uppercase tracking-[0.1em] text-amber-600">Remaining</p>
                          <p className="mt-1 text-[0.9rem] font-black text-amber-900">{driverRouteJourneyShipment.distanceRemaining}</p>
                        </div>
                        <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-[0_14px_30px_-28px_rgba(109,40,217,0.8)]">
                          <p className="text-[0.64rem] font-bold uppercase tracking-[0.1em] text-violet-600">Status / Sync</p>
                          <p className="mt-1 text-[0.9rem] font-black text-violet-900">{driverRouteJourneyShipment.status}</p>
                          <p className="mt-1 text-[0.66rem] font-semibold text-slate-500">{driverLiveUploadState === 'uploading' ? 'Syncing' : driverLiveUploadState === 'sent' ? 'Uploaded' : driverLiveUploadState === 'error' ? 'Retrying' : 'Waiting'} | Auto sync</p>
                        </div>
                      </div>

                      <section className="h-full min-h-[620px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_26px_56px_-36px_rgba(15,23,42,0.75)] lg:min-h-0 flex flex-col">
                        <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Direct Google Maps Import</p>
                          <p className="text-[0.74rem] font-semibold text-slate-700">Native Google route interface embedded directly in shipment route section.</p>
                        </div>

                        <iframe
                          title="Direct Google Maps Route"
                          className="min-h-0 h-full w-full flex-1 border-0"
                          loading="lazy"
                          src={driverDirectGoogleMapsUrl}
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </section>

                      {queuedWonShipment ? (
                        <section className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                          <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-violet-700">Next Shipment From Won Bid</p>
                          <p className="mt-1 text-[0.86rem] font-black text-violet-900">{queuedWonShipment.id} | {queuedWonShipment.origin} -&gt; {queuedWonShipment.destination}</p>
                          <p className="mt-1 text-[0.75rem] font-semibold text-violet-800">Current shipment complete hone ke baad yeh route automatically active flow me aa jayega.</p>
                        </section>
                      ) : null}
                    </div>

                    <aside className="min-h-0 rounded-3xl border border-slate-200 bg-white/95 shadow-[0_24px_52px_-38px_rgba(15,23,42,0.55)] backdrop-blur flex flex-col">
                      <div className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/70 px-5 py-4">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Shipment Details</p>
                        <h3 className="mt-1 text-[1.05rem] font-black text-slate-800">{driverRouteJourneyShipment.loadId}</h3>
                        <p className="mt-1 text-[0.78rem] font-semibold text-slate-500">Customer: {driverRouteJourneyShipment.customer}</p>
                        {driverRouteJourneyShipment.winningAmount ? (
                          <p className="mt-1 text-[0.78rem] font-semibold text-emerald-700">Winning Amount: {formatCurrencyValue(driverRouteJourneyShipment.winningAmount)}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.08em] text-blue-700">{driverRouteProgressPercent}% complete</span>
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[0.62rem] font-black uppercase tracking-[0.08em] text-amber-700">{driverRouteJourneyShipment.delayTime} delay</span>
                        </div>
                      </div>

                      <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto p-5 space-y-5">
                        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                          <h4 className="text-[0.86rem] font-black text-slate-800">Journey Snapshot</h4>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[0.75rem] font-semibold text-slate-700">
                            <p>Driver: <span className="font-black">{driverRouteJourneyShipment.driver}</span></p>
                            <p>Truck: <span className="font-black">{driverRouteJourneyShipment.truck}</span></p>
                            <p>Equipment: <span className="font-black">{driverRouteJourneyShipment.equipment}</span></p>
                            <p>Priority: <span className="font-black">{driverRouteJourneyShipment.priority}</span></p>
                            <p className="col-span-2">Pickup Window: <span className="font-black">{driverRouteJourneyShipment.pickupWindow}</span></p>
                            <p className="col-span-2">Delivery Window: <span className="font-black">{driverRouteJourneyShipment.deliveryWindow}</span></p>
                          </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[0.86rem] font-black text-slate-800">Route Progress</h4>
                            <span className="text-[0.78rem] font-black text-slate-700 tabular-nums">{driverRouteProgressPercent}%</span>
                          </div>
                          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${driverRouteProgressPercent}%` }} />
                          </div>
                          <p className="mt-2 text-[0.72rem] font-semibold text-slate-500">Current location: {driverLiveLocationLabel}</p>
                          <p className="mt-1 text-[0.72rem] font-semibold text-slate-500">Delay: {driverRouteJourneyShipment.delayTime}</p>
                          <p className="mt-1 text-[0.72rem] font-semibold text-slate-500">Last uploaded: {driverLiveLastUploadedAt ? new Date(driverLiveLastUploadedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--'}</p>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="text-[0.86rem] font-black text-slate-800">Stops & Milestones</h4>
                          <div className="mt-3 space-y-3">
                            {driverRouteJourneyShipment.stops.map((stop) => {
                              const tone = stop.state === 'done'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : stop.state === 'warning'
                                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                                  : stop.state === 'active'
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                              const IconComp = stop.state === 'done'
                                ? CheckCircle2
                                : stop.state === 'warning'
                                  ? AlertTriangle
                                  : stop.state === 'active'
                                    ? Truck
                                    : MapPin

                              return (
                                <div key={stop.id} className={`rounded-lg border px-3 py-2 ${tone}`}>
                                  <div className="flex items-start gap-2">
                                    <IconComp className="mt-0.5 h-4 w-4 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-[0.78rem] font-black leading-tight">{stop.label} | {stop.location}</p>
                                      <p className="mt-1 text-[0.72rem] font-semibold">{stop.window}</p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </section>

                        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                          <h4 className="text-[0.86rem] font-black text-amber-900">Stopage Timing Plan</h4>
                          <p className="mt-1 text-[0.72rem] font-semibold text-amber-800">Planned halt durations shared with company dispatch.</p>
                          <div className="mt-3 space-y-2.5">
                            {driverRouteJourneyShipment.stops.map((stop) => (
                              <div key={`${stop.id}-halt`} className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-[0.74rem] font-black text-amber-950">{stop.label}</p>
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.66rem] font-black text-amber-900">{stop.haltDuration ?? '15 min stop'}</span>
                                </div>
                                <p className="mt-1 text-[0.7rem] font-semibold text-amber-900">{stop.window} | {stop.location}</p>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="text-[0.86rem] font-black text-slate-800">Driver Checklist</h4>
                          <ul className="mt-2 space-y-2">
                            {driverRouteJourneyShipment.checklist.map((item) => (
                              <li key={item} className="rounded-lg bg-slate-50 px-3 py-2 text-[0.74rem] font-semibold text-slate-700">{item}</li>
                            ))}
                          </ul>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="text-[0.86rem] font-black text-slate-800">Required Documents</h4>
                          <ul className="mt-2 space-y-2">
                            {driverRouteJourneyShipment.docs.map((item) => (
                              <li key={item} className="rounded-lg bg-emerald-50 px-3 py-2 text-[0.74rem] font-semibold text-emerald-800">{item}</li>
                            ))}
                          </ul>
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="text-[0.86rem] font-black text-slate-800">Journey Notes</h4>
                          <div className="mt-2 space-y-2 text-[0.74rem] font-semibold text-slate-700">
                            <p><span className="font-black text-slate-900">Pickup:</span> {driverRouteJourneyShipment.journeyNotes.pickup}</p>
                            <p><span className="font-black text-slate-900">Enroute:</span> {driverRouteJourneyShipment.journeyNotes.enroute}</p>
                            <p><span className="font-black text-slate-900">Delivery:</span> {driverRouteJourneyShipment.journeyNotes.delivery}</p>
                          </div>
                        </section>

                        <section className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-[0.86rem] font-black text-sky-900">Message Company / Dispatch</h4>
                              <p className="mt-1 text-[0.72rem] font-semibold text-sky-800">Next required check-in in <span className="font-black">{driverNextCheckInCountdown}</span></p>
                            </div>
                            <button
                              type="button"
                              onClick={handleMarkDriverCheckIn}
                              className="rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-[0.68rem] font-black text-sky-800 transition hover:bg-sky-100"
                            >
                              Mark Check-in
                            </button>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {driverMessageQuickTemplates.map((template) => (
                              <button
                                key={template.id}
                                type="button"
                                onClick={() => handleUseDriverMessageTemplate(template)}
                                className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[0.66rem] font-black text-sky-800 transition hover:bg-sky-100"
                              >
                                {template.label}
                              </button>
                            ))}
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <label className="space-y-1">
                              <span className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-sky-700">Category</span>
                              <select
                                value={driverMessageCategory}
                                onChange={(event) => setDriverMessageCategory(event.target.value)}
                                className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-[0.74rem] font-semibold text-slate-700 outline-none transition focus:border-sky-400"
                              >
                                <option value="general">General</option>
                                <option value="delay">Delay</option>
                                <option value="fuel">Fuel</option>
                                <option value="route">Route</option>
                                <option value="dock">Dock</option>
                              </select>
                            </label>
                            <label className="space-y-1">
                              <span className="text-[0.66rem] font-bold uppercase tracking-[0.08em] text-sky-700">Priority</span>
                              <select
                                value={driverMessagePriority}
                                onChange={(event) => setDriverMessagePriority(event.target.value)}
                                className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-[0.74rem] font-semibold text-slate-700 outline-none transition focus:border-sky-400"
                              >
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </label>
                          </div>

                          <textarea
                            value={driverMessageDraft}
                            onChange={(event) => {
                              setDriverMessageDraft(event.target.value)
                              if (driverMessageState === 'error' || driverMessageState === 'sent') {
                                setDriverMessageState('idle')
                              }
                            }}
                            rows={3}
                            placeholder="Type update for company dispatch..."
                            className="mt-3 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-[0.75rem] font-semibold text-slate-700 outline-none transition focus:border-sky-400"
                          />

                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p className={`text-[0.68rem] font-bold ${driverMessageState === 'sent' ? 'text-emerald-700' : driverMessageState === 'error' ? 'text-rose-700' : driverMessageState === 'sending' ? 'text-sky-700' : 'text-slate-500'}`}>
                              {driverMessageState === 'sent'
                                ? 'Last message delivered to company.'
                                : driverMessageState === 'error'
                                  ? 'Message failed. Please retry.'
                                  : driverMessageState === 'sending'
                                    ? 'Sending message to company...'
                                    : 'Ready to send update.'}
                            </p>
                            <button
                              type="button"
                              onClick={handleSendDriverMessage}
                              disabled={driverMessageState === 'sending' || !driverMessageDraft.trim()}
                              className="rounded-lg bg-sky-600 px-3.5 py-1.5 text-[0.7rem] font-black text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              {driverMessageState === 'sending' ? 'Sending...' : 'Send Message'}
                            </button>
                          </div>

                          <div className="mt-3 border-t border-sky-200 pt-3">
                            <p className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-sky-700">Recent Sent Updates</p>
                            {driverMessageHistory.length > 0 ? (
                              <div className="mt-2 space-y-2">
                                {driverMessageHistory.map((message) => (
                                  <div key={message.id} className="rounded-lg border border-sky-200 bg-white px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-[0.68rem] font-black uppercase tracking-[0.06em] text-sky-700">{message.category} | {message.priority}</p>
                                      <p className="text-[0.65rem] font-semibold text-slate-500">{new Date(message.sentAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                    <p className="mt-1 text-[0.74rem] font-semibold text-slate-700">{message.message}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-[0.72rem] font-semibold text-slate-500">No message sent yet for this shipment.</p>
                            )}
                          </div>
                        </section>

                        <section className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                          <h4 className="text-[0.86rem] font-black text-blue-800">Dispatch Support</h4>
                          <div className="mt-2 space-y-1.5 text-[0.74rem] font-semibold text-blue-900">
                            <p>Dispatcher: <span className="font-black">{bidPanelCompanyContact.dispatcher}</span></p>
                            <p>Dispatch Line: <span className="font-black">{bidPanelCompanyContact.dispatchPhone}</span></p>
                            <p>Support: <span className="font-black">{bidPanelCompanyContact.supportPhone}</span></p>
                            <p>Emergency: <span className="font-black">{bidPanelCompanyContact.emergencyLine}</span></p>
                          </div>
                        </section>
                      </div>
                    </aside>
                  </div>
                ) : (
                  <div className="grid flex-1 place-items-center p-6 lg:px-8">
                    <section className="w-full max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                      <p className="text-[1rem] font-black text-slate-800">No driver shipment available right now.</p>
                      <p className="mt-2 text-[0.82rem] font-semibold text-slate-500">Current dispatch complete hone ke baad yahan won bidding shipment route appear hoga.</p>
                    </section>
                  </div>
                )}
              </section>
                        ) : activeSection === 'settings' ? (
              <section className="flex h-[calc(100vh-85px)] flex-col overflow-hidden bg-[#f5f7fb]">
                <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-5 lg:px-8">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <h2 className="text-[2rem] font-black tracking-tight text-slate-900">Driver Settings</h2>
                      <p className="mt-1 text-[0.86rem] font-semibold text-slate-500">Manage your driver profile, availability, safety reminders, payout preferences, and app behavior.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadDriverProfile}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[0.78rem] font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Download className="h-4 w-4" />
                        Download Profile
                      </button>
                      <button
                        onClick={handleSaveAllDriverSettings}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-[0.78rem] font-bold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        <FileCheck2 className="h-4 w-4" />
                        Save Preferences
                      </button>
                      {settingsLastSavedAt && (
                        <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.66rem] font-bold text-emerald-700">
                          Saved {new Date(settingsLastSavedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5 lg:px-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className={`rounded-2xl border p-4 ${settings.readyForDispatch ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-500">Dispatch Status</p>
                        <p className={`mt-1 text-[1.28rem] font-black ${settings.readyForDispatch ? 'text-emerald-800' : 'text-slate-700'}`}>{settings.readyForDispatch ? 'Ready for Dispatch' : 'Off Duty'}</p>
                        <p className="mt-1 text-[0.74rem] font-semibold text-slate-600">{settings.allowWeekendLoads ? 'Weekend loads enabled' : 'Weekend loads disabled'}</p>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-amber-700">Safety Alerts</p>
                        <p className="mt-1 text-[1.28rem] font-black text-amber-900">HOS {settings.hosAlertMinutes}m</p>
                        <p className="mt-1 text-[0.74rem] font-semibold text-amber-800">Speed warning at {settings.speedLimitAlertMph} mph</p>
                      </div>
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-blue-700">Preferred Load</p>
                        <p className="mt-1 text-[1.28rem] font-black text-blue-900">{settings.preferredLoadType}</p>
                        <p className="mt-1 text-[0.74rem] font-semibold text-blue-800">Max {settings.maxDailyMiles} mi/day</p>
                      </div>
                      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                        <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-violet-700">Payout</p>
                        <p className="mt-1 text-[1.28rem] font-black text-violet-900">{settings.payoutMethod}</p>
                        <p className="mt-1 text-[0.74rem] font-semibold text-violet-800">Statement: {settings.statementFrequency}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                      <div className="space-y-6">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-blue-700">
                                <UserRound className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="text-[1rem] font-black text-slate-900">Profile and Emergency Contact</h3>
                                <p className="text-[0.74rem] font-semibold text-slate-500">Keep your driver identity and emergency details updated.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isProfileEditing ? (
                                <button
                                  type="button"
                                  onClick={handleProfileEditStart}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                  Edit
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleProfileEditCancel}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-bold text-slate-700 transition hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleProfileEditSave}
                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-[0.72rem] font-bold text-white transition hover:bg-blue-700"
                                  >
                                    Save
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <label className="space-y-1">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Full Name</span>
                              <input
                                value={isProfileEditing ? profileDraft.fullName : settings.fullName}
                                onChange={(event) => handleProfileDraftChange('fullName', event.target.value)}
                                readOnly={!isProfileEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isProfileEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Phone</span>
                              <input
                                value={isProfileEditing ? profileDraft.phone : settings.phone}
                                onChange={(event) => handleProfileDraftChange('phone', event.target.value)}
                                readOnly={!isProfileEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isProfileEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              />
                            </label>
                            <label className="space-y-1 md:col-span-2">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Email</span>
                              <input
                                value={isProfileEditing ? profileDraft.email : settings.email}
                                onChange={(event) => handleProfileDraftChange('email', event.target.value)}
                                readOnly={!isProfileEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isProfileEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Home Terminal</span>
                              <input
                                value={isProfileEditing ? profileDraft.homeTerminal : settings.homeTerminal}
                                onChange={(event) => handleProfileDraftChange('homeTerminal', event.target.value)}
                                readOnly={!isProfileEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isProfileEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Emergency Contact Name</span>
                              <input
                                value={isProfileEditing ? profileDraft.emergencyContactName : settings.emergencyContactName}
                                onChange={(event) => handleProfileDraftChange('emergencyContactName', event.target.value)}
                                readOnly={!isProfileEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isProfileEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              />
                            </label>
                            <label className="space-y-1 md:col-span-2">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Emergency Contact Phone</span>
                              <input
                                value={isProfileEditing ? profileDraft.emergencyContactPhone : settings.emergencyContactPhone}
                                onChange={(event) => handleProfileDraftChange('emergencyContactPhone', event.target.value)}
                                readOnly={!isProfileEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isProfileEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              />
                            </label>
                          </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                                <Truck className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="text-[1rem] font-black text-slate-900">Availability and Route Preferences</h3>
                                <p className="text-[0.74rem] font-semibold text-slate-500">Control what type of loads and schedule windows you want to run.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isAvailabilityEditing ? (
                                <button
                                  type="button"
                                  onClick={handleAvailabilityEditStart}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                  Edit
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleAvailabilityEditCancel}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-bold text-slate-700 transition hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleAvailabilityEditSave}
                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-[0.72rem] font-bold text-white transition hover:bg-blue-700"
                                  >
                                    Save
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <button
                              type="button"
                              disabled={!isAvailabilityEditing}
                              onClick={() => updateAvailabilityDraft('readyForDispatch', !availabilityDraft.readyForDispatch)}
                              className={`rounded-xl border px-3 py-2 text-left transition ${(isAvailabilityEditing ? availabilityDraft.readyForDispatch : settings.readyForDispatch) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isAvailabilityEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                              <p className="text-[0.76rem] font-black">Ready for Dispatch</p>
                              <p className="text-[0.7rem] font-semibold">{(isAvailabilityEditing ? availabilityDraft.readyForDispatch : settings.readyForDispatch) ? 'Enabled' : 'Disabled'}</p>
                            </button>
                            <button
                              type="button"
                              disabled={!isAvailabilityEditing}
                              onClick={() => updateAvailabilityDraft('allowWeekendLoads', !availabilityDraft.allowWeekendLoads)}
                              className={`rounded-xl border px-3 py-2 text-left transition ${(isAvailabilityEditing ? availabilityDraft.allowWeekendLoads : settings.allowWeekendLoads) ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isAvailabilityEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                              <p className="text-[0.76rem] font-black">Weekend Loads</p>
                              <p className="text-[0.7rem] font-semibold">{(isAvailabilityEditing ? availabilityDraft.allowWeekendLoads : settings.allowWeekendLoads) ? 'Enabled' : 'Disabled'}</p>
                            </button>
                            <button
                              type="button"
                              disabled={!isAvailabilityEditing}
                              onClick={() => updateAvailabilityDraft('allowNightDriving', !availabilityDraft.allowNightDriving)}
                              className={`rounded-xl border px-3 py-2 text-left transition ${(isAvailabilityEditing ? availabilityDraft.allowNightDriving : settings.allowNightDriving) ? 'border-violet-200 bg-violet-50 text-violet-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isAvailabilityEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                              <p className="text-[0.76rem] font-black">Night Driving</p>
                              <p className="text-[0.7rem] font-semibold">{(isAvailabilityEditing ? availabilityDraft.allowNightDriving : settings.allowNightDriving) ? 'Enabled' : 'Disabled'}</p>
                            </button>
                            <label className="space-y-1">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Preferred Load Type</span>
                              <select
                                value={isAvailabilityEditing ? availabilityDraft.preferredLoadType : settings.preferredLoadType}
                                onChange={(event) => updateAvailabilityDraft('preferredLoadType', event.target.value)}
                                disabled={!isAvailabilityEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isAvailabilityEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              >
                                <option>Dry Van</option>
                                <option>Reefer</option>
                                <option>Flatbed</option>
                                <option>Box Truck</option>
                              </select>
                            </label>
                            <label className="space-y-1 md:col-span-2">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Preferred Regions</span>
                              <input
                                value={isAvailabilityEditing ? availabilityDraft.preferredRegions : settings.preferredRegions}
                                onChange={(event) => updateAvailabilityDraft('preferredRegions', event.target.value)}
                                readOnly={!isAvailabilityEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isAvailabilityEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              />
                            </label>
                            <label className="space-y-1 md:col-span-2">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Max Daily Miles</span>
                              <input
                                type="number"
                                min={100}
                                max={900}
                                value={isAvailabilityEditing ? availabilityDraft.maxDailyMiles : settings.maxDailyMiles}
                                onChange={(event) => updateAvailabilityDraft('maxDailyMiles', Number(event.target.value) || 0)}
                                readOnly={!isAvailabilityEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isAvailabilityEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              />
                            </label>
                          </div>
                        </section>
                      </div>

                      <div className="space-y-6">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700">
                                <ShieldCheck className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="text-[1rem] font-black text-slate-900">Safety and Compliance</h3>
                                <p className="text-[0.74rem] font-semibold text-slate-500">Set warning thresholds and reminders for safer trips.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isSafetyEditing ? (
                                <button
                                  type="button"
                                  onClick={handleSafetyEditStart}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                  Edit
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={handleSafetyEditCancel}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-bold text-slate-700 transition hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleSafetyEditSave}
                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-[0.72rem] font-bold text-white transition hover:bg-blue-700"
                                  >
                                    Save
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="space-y-1">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">HOS Warning Before Limit (minutes)</span>
                              <input
                                type="number"
                                min={10}
                                max={180}
                                value={isSafetyEditing ? safetyDraft.hosAlertMinutes : settings.hosAlertMinutes}
                                onChange={(event) => updateSafetyDraft('hosAlertMinutes', Number(event.target.value) || 0)}
                                readOnly={!isSafetyEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isSafetyEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              />
                            </label>
                            <label className="space-y-1">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Speed Alert Threshold (mph)</span>
                              <input
                                type="number"
                                min={50}
                                max={90}
                                value={isSafetyEditing ? safetyDraft.speedLimitAlertMph : settings.speedLimitAlertMph}
                                onChange={(event) => updateSafetyDraft('speedLimitAlertMph', Number(event.target.value) || 0)}
                                readOnly={!isSafetyEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isSafetyEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              />
                            </label>

                            <button
                              type="button"
                              disabled={!isSafetyEditing}
                              onClick={() => updateSafetyDraft('preTripReminder', !safetyDraft.preTripReminder)}
                              className={`w-full rounded-xl border px-3 py-2 text-left transition ${(isSafetyEditing ? safetyDraft.preTripReminder : settings.preTripReminder) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isSafetyEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                              <p className="text-[0.74rem] font-black">Pre-trip Inspection Reminder</p>
                            </button>
                            <button
                              type="button"
                              disabled={!isSafetyEditing}
                              onClick={() => updateSafetyDraft('maintenanceReminder', !safetyDraft.maintenanceReminder)}
                              className={`w-full rounded-xl border px-3 py-2 text-left transition ${(isSafetyEditing ? safetyDraft.maintenanceReminder : settings.maintenanceReminder) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isSafetyEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                              <p className="text-[0.74rem] font-black">Maintenance Reminder</p>
                            </button>
                            <button
                              type="button"
                              disabled={!isSafetyEditing}
                              onClick={() => updateSafetyDraft('podReminder', !safetyDraft.podReminder)}
                              className={`w-full rounded-xl border px-3 py-2 text-left transition ${(isSafetyEditing ? safetyDraft.podReminder : settings.podReminder) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isSafetyEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                              <p className="text-[0.74rem] font-black">POD Upload Reminder</p>
                            </button>
                          </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-100 text-violet-700">
                                <Wallet className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="text-[1rem] font-black text-slate-900">Payout and App Preferences</h3>
                                <p className="text-[0.74rem] font-semibold text-slate-500">Control payout settings, notifications, and app behavior.</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isPayoutEditing ? (
                                <button
                                  type="button"
                                  onClick={handlePayoutEditStart}
                                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                  Edit
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={handlePayoutEditCancel}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-bold text-slate-700 transition hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handlePayoutEditSave}
                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-[0.72rem] font-bold text-white transition hover:bg-blue-700"
                                  >
                                    Save
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="space-y-1">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Payout Method</span>
                              <select
                                value={isPayoutEditing ? payoutDraft.payoutMethod : settings.payoutMethod}
                                onChange={(event) => updatePayoutDraft('payoutMethod', event.target.value)}
                                disabled={!isPayoutEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isPayoutEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              >
                                <option>ACH ****1847</option>
                                <option>VISA ****9012</option>
                              </select>
                            </label>
                            <label className="space-y-1">
                              <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Statement Frequency</span>
                              <select
                                value={isPayoutEditing ? payoutDraft.statementFrequency : settings.statementFrequency}
                                onChange={(event) => updatePayoutDraft('statementFrequency', event.target.value)}
                                disabled={!isPayoutEditing}
                                className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isPayoutEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                              >
                                <option>Weekly</option>
                                <option>Bi-Weekly</option>
                                <option>Monthly</option>
                              </select>
                            </label>

                            <button
                              type="button"
                              disabled={!isPayoutEditing}
                              onClick={() => updatePayoutDraft('fastPayout', !payoutDraft.fastPayout)}
                              className={`w-full rounded-xl border px-3 py-2 text-left transition ${(isPayoutEditing ? payoutDraft.fastPayout : settings.fastPayout) ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isPayoutEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                              <p className="text-[0.74rem] font-black">Fast Payout</p>
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={!isPayoutEditing}
                                onClick={() => updatePayoutDraft('inAppNotifications', !payoutDraft.inAppNotifications)}
                                className={`rounded-xl border px-3 py-2 text-left text-[0.73rem] font-black transition ${(isPayoutEditing ? payoutDraft.inAppNotifications : settings.inAppNotifications) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isPayoutEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                              >
                                In-app Alerts
                              </button>
                              <button
                                type="button"
                                disabled={!isPayoutEditing}
                                onClick={() => updatePayoutDraft('emailNotifications', !payoutDraft.emailNotifications)}
                                className={`rounded-xl border px-3 py-2 text-left text-[0.73rem] font-black transition ${(isPayoutEditing ? payoutDraft.emailNotifications : settings.emailNotifications) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isPayoutEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                              >
                                Email Alerts
                              </button>
                              <button
                                type="button"
                                disabled={!isPayoutEditing}
                                onClick={() => updatePayoutDraft('smsNotifications', !payoutDraft.smsNotifications)}
                                className={`rounded-xl border px-3 py-2 text-left text-[0.73rem] font-black transition ${(isPayoutEditing ? payoutDraft.smsNotifications : settings.smsNotifications) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isPayoutEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                              >
                                SMS Alerts
                              </button>
                              <button
                                type="button"
                                disabled={!isPayoutEditing}
                                onClick={() => updatePayoutDraft('shareLiveLocation', !payoutDraft.shareLiveLocation)}
                                className={`rounded-xl border px-3 py-2 text-left text-[0.73rem] font-black transition ${(isPayoutEditing ? payoutDraft.shareLiveLocation : settings.shareLiveLocation) ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isPayoutEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                              >
                                Share Live Location
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={!isPayoutEditing}
                              onClick={() => updatePayoutDraft('shareDrivingTelemetry', !payoutDraft.shareDrivingTelemetry)}
                              className={`w-full rounded-xl border px-3 py-2 text-left transition ${(isPayoutEditing ? payoutDraft.shareDrivingTelemetry : settings.shareDrivingTelemetry) ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-slate-200 bg-slate-50 text-slate-700'} ${!isPayoutEditing ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                              <p className="text-[0.74rem] font-black">Share Driving Telemetry</p>
                            </button>

                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <label className="space-y-1">
                                <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">Map Theme</span>
                                <select
                                  value={isPayoutEditing ? payoutDraft.mapTheme : settings.mapTheme}
                                  onChange={(event) => updatePayoutDraft('mapTheme', event.target.value)}
                                  disabled={!isPayoutEditing}
                                  className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isPayoutEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                                >
                                  <option>Standard</option>
                                  <option>Satellite</option>
                                </select>
                              </label>
                              <label className="space-y-1">
                                <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-slate-500">App Font Scale</span>
                                <select
                                  value={isPayoutEditing ? payoutDraft.appFontScale : settings.appFontScale}
                                  onChange={(event) => updatePayoutDraft('appFontScale', event.target.value)}
                                  disabled={!isPayoutEditing}
                                  className={`w-full rounded-xl border border-slate-200 px-3 py-2 text-[0.82rem] font-semibold outline-none transition focus:border-blue-300 ${isPayoutEditing ? 'bg-white text-slate-700' : 'cursor-not-allowed bg-slate-50 text-slate-500'}`}
                                >
                                  <option>Small</option>
                                  <option>Medium</option>
                                  <option>Large</option>
                                </select>
                              </label>
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            ) : activeSection === 'pod' ? (() => {
              const podStatusToneMap = {
                Pending: 'bg-amber-50 text-amber-700 border border-amber-200/70',
                Accepted: 'bg-emerald-50 text-emerald-700 border border-emerald-200/70',
                Rejected: 'bg-rose-50 text-rose-700 border border-rose-200/70',
              }

              const getPodTimestamp = (value) => {
                const parsed = Date.parse(String(value ?? ''))
                return Number.isFinite(parsed) ? parsed : 0
              }

              const formatPodDateTime = (value) => {
                const parsed = Date.parse(String(value ?? ''))
                if (!Number.isFinite(parsed)) {
                  return '--'
                }

                return new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }).format(new Date(parsed))
              }

              const getPodMonthKey = (value) => {
                const parsed = Date.parse(String(value ?? ''))
                if (!Number.isFinite(parsed)) {
                  return null
                }

                const dateObj = new Date(parsed)
                return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
              }

              const getPodMonthLabel = (monthKey) => {
                const [year, month] = String(monthKey).split('-').map((part) => Number(part))
                if (!year || !month) {
                  return 'Unknown Month'
                }

                return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
              }

              const sortedPodRecords = [...podWorkflowRecords].sort((firstRecord, secondRecord) => {
                return getPodTimestamp(secondRecord.deliveredAt) - getPodTimestamp(firstRecord.deliveredAt)
              })

              const podMonthOptions = Array.from(new Set(sortedPodRecords
                .map((record) => getPodMonthKey(record.deliveredAt))
                .filter(Boolean))).sort((firstMonth, secondMonth) => secondMonth.localeCompare(firstMonth))

              const monthFilteredRecords = podSelectedMonth === 'all'
                ? sortedPodRecords
                : sortedPodRecords.filter((record) => getPodMonthKey(record.deliveredAt) === podSelectedMonth)

              const podFilteredRecords = podStatusFilter === 'All'
                ? monthFilteredRecords
                : monthFilteredRecords.filter((record) => record.status === podStatusFilter)

              const selectedPodRecord = sortedPodRecords.find((record) => record.id === podSelectedRecordId) ?? sortedPodRecords[0] ?? null
              const selectedShipmentPhotos = selectedPodRecord?.shipmentPhotos ?? []
              const selectedPodLetterPhotos = selectedPodRecord?.podLetterPhotos ?? []
              const isSelectedRecordReadOnly = selectedPodRecord?.status === 'Accepted'

              const podSummary = {
                total: sortedPodRecords.length,
                pending: sortedPodRecords.filter((record) => record.status === 'Pending').length,
                accepted: sortedPodRecords.filter((record) => record.status === 'Accepted').length,
                rejected: sortedPodRecords.filter((record) => record.status === 'Rejected').length,
                completedUploads: sortedPodRecords.filter((record) => {
                  return (record.shipmentPhotos?.length ?? 0) > 0 && (record.podLetterPhotos?.length ?? 0) > 0
                }).length,
              }

              const monthlyUploadsCount = monthFilteredRecords.reduce((totalUploads, record) => {
                return totalUploads + (record.shipmentPhotos?.length ?? 0) + (record.podLetterPhotos?.length ?? 0)
              }, 0)

              const handlePodFilesUpload = (event, recordId, evidenceField, labelPrefix) => {
                const files = Array.from(event.target.files ?? [])
                if (!recordId || files.length === 0) {
                  return
                }

                const uploadedAt = new Date().toISOString()
                const uploadItems = files.map((file, index) => ({
                  id: `${recordId}-${evidenceField}-${Date.now()}-${index}`,
                  label: file.name || `${labelPrefix} ${index + 1}`,
                  imageUrl: URL.createObjectURL(file),
                  uploadedAt,
                }))

                setPodWorkflowRecords((previousRecords) => previousRecords.map((record) => {
                  if (record.id !== recordId) {
                    return record
                  }

                  const existingEvidence = Array.isArray(record[evidenceField]) ? record[evidenceField] : []
                  if (record.status === 'Accepted') {
                    return record
                  }

                  return {
                    ...record,
                    [evidenceField]: [...existingEvidence, ...uploadItems],
                    status: record.status,
                    reviewedAt: record.reviewedAt,
                    payoutState: record.payoutState,
                    reviewNote: record.status === 'Rejected'
                      ? 'New files uploaded. Waiting for operations re-review.'
                      : record.reviewNote,
                  }
                }))

                event.target.value = ''
              }

              return (
                <section className="h-[calc(100vh-85px)] overflow-hidden bg-white">
                  <div className="flex h-full min-h-0 flex-col">
                  <div className="shrink-0 border-b border-slate-200/70 bg-white px-6 pb-5 pt-6 lg:px-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-[1.8rem] font-bold tracking-tight text-slate-900">Proof of Delivery Workflow</h2>
                        <p className="mt-1 text-[0.92rem] font-medium text-slate-500">
                          Upload shipment photos and signed POD letter after delivery. POD status is tracked as Pending, Accepted, or Rejected.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1.5">
                        {['Workflow', 'Logs'].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => setPodViewMode(mode)}
                            className={`rounded-lg px-4 py-2 text-[0.8rem] font-bold transition ${podViewMode === mode
                              ? 'bg-white text-slate-900 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                              }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-amber-200/70 bg-amber-50 p-4">
                        <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-amber-700">Pending Review</p>
                        <p className="mt-2 text-[1.55rem] font-black text-amber-900">{podSummary.pending}</p>
                        <p className="text-[0.78rem] font-semibold text-amber-700/80">Ops verification awaiting</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50 p-4">
                        <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-emerald-700">Accepted</p>
                        <p className="mt-2 text-[1.55rem] font-black text-emerald-900">{podSummary.accepted}</p>
                        <p className="text-[0.78rem] font-semibold text-emerald-700/80">Perfect delivery closed</p>
                      </div>
                      <div className="rounded-2xl border border-rose-200/70 bg-rose-50 p-4">
                        <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-rose-700">Rejected</p>
                        <p className="mt-2 text-[1.55rem] font-black text-rose-900">{podSummary.rejected}</p>
                        <p className="text-[0.78rem] font-semibold text-rose-700/80">Re-upload required</p>
                      </div>
                      <div className="rounded-2xl border border-blue-200/70 bg-blue-50 p-4">
                        <p className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-blue-700">Docs Uploaded</p>
                        <p className="mt-2 text-[1.55rem] font-black text-blue-900">{podSummary.completedUploads}/{podSummary.total}</p>
                        <p className="text-[0.78rem] font-semibold text-blue-700/80">Shipments with complete POD packets</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-end gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-slate-500">Month</span>
                        <select
                          value={podSelectedMonth}
                          onChange={(event) => setPodSelectedMonth(event.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[0.86rem] font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-200/60"
                        >
                          <option value="all">All Months</option>
                          {podMonthOptions.map((monthKey) => (
                            <option key={monthKey} value={monthKey}>{getPodMonthLabel(monthKey)}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col gap-1">
                        <span className="text-[0.72rem] font-bold uppercase tracking-[0.12em] text-slate-500">Status</span>
                        <select
                          value={podStatusFilter}
                          onChange={(event) => setPodStatusFilter(event.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[0.86rem] font-semibold text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-200/60"
                        >
                          {['All', 'Pending', 'Accepted', 'Rejected'].map((statusOption) => (
                            <option key={statusOption} value={statusOption}>{statusOption}</option>
                          ))}
                        </select>
                      </label>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[0.8rem] font-semibold text-slate-600">
                        Showing {podFilteredRecords.length} logs in this view, total evidence files {monthlyUploadsCount}
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-hidden bg-[#f8fafc] px-6 pb-6 pt-4 lg:px-8">
                    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1.05fr_1.45fr]">
                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                      {podViewMode === 'Workflow' ? (
                        <div className="flex h-full min-h-0 flex-col">
                          <div className="border-b border-slate-100 px-5 py-4">
                            <h3 className="text-[1.02rem] font-bold text-slate-900">Destination Workflow Queue</h3>
                            <p className="mt-1 text-[0.8rem] font-medium text-slate-500">After delivery, upload shipment photos and POD letter images. Operations updates the final review status.</p>
                          </div>
                          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 dashboard-scrollbar">
                            {podFilteredRecords.length === 0 ? (
                              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-[0.82rem] font-semibold text-slate-500">
                                No shipments are available for the selected filters.
                              </div>
                            ) : podFilteredRecords.map((record) => (
                              <button
                                key={record.id}
                                onClick={() => setPodSelectedRecordId(record.id)}
                                className={`w-full rounded-2xl border p-4 text-left transition ${podSelectedRecordId === record.id
                                  ? 'border-blue-300 bg-blue-50/50 shadow-[0_8px_20px_-12px_rgba(59,130,246,0.45)]'
                                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[0.9rem] font-black text-slate-900">{record.id}</p>
                                    <p className="text-[0.78rem] font-semibold text-slate-600 mt-0.5">{record.route}</p>
                                  </div>
                                  <span className={`inline-flex rounded-full px-3 py-1 text-[0.7rem] font-bold ${podStatusToneMap[record.status] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                    {record.status}
                                  </span>
                                </div>
                                <p className="mt-2 text-[0.74rem] font-medium text-slate-500">Delivered: {formatPodDateTime(record.deliveredAt)}</p>
                                <p className="mt-1 text-[0.74rem] font-medium text-slate-500 truncate">{record.destinationAddress}</p>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-[0.72rem] font-semibold text-slate-600">
                                  <div className="rounded-lg bg-slate-100 px-2.5 py-1.5">Shipment photos: {record.shipmentPhotos?.length ?? 0}</div>
                                  <div className="rounded-lg bg-slate-100 px-2.5 py-1.5">POD letters: {record.podLetterPhotos?.length ?? 0}</div>
                                </div>
                                {record.status === 'Rejected' && record.rejectionReason && (
                                  <p className="mt-2 text-[0.72rem] font-semibold text-rose-600">Reason: {record.rejectionReason}</p>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-full min-h-0 flex-col">
                          <div className="border-b border-slate-100 px-5 py-4">
                            <h3 className="text-[1.02rem] font-bold text-slate-900">Monthly Shipment Logs</h3>
                            <p className="mt-1 text-[0.8rem] font-medium text-slate-500">Open any log to view uploaded shipment photos and POD letter images for that month.</p>
                          </div>
                          <div className="min-h-0 flex-1 overflow-auto dashboard-scrollbar">
                            {podFilteredRecords.length === 0 ? (
                              <div className="px-5 py-10 text-center text-[0.82rem] font-semibold text-slate-500">No logs found for selected month or status.</div>
                            ) : (
                              <table className="min-w-full divide-y divide-slate-100 text-left">
                                <thead className="sticky top-0 z-10 bg-slate-50">
                                  <tr className="text-[0.68rem] uppercase tracking-[0.12em] text-slate-500">
                                    <th className="px-4 py-3 font-bold">Load</th>
                                    <th className="px-4 py-3 font-bold">Delivered</th>
                                    <th className="px-4 py-3 font-bold">Shipment Pics</th>
                                    <th className="px-4 py-3 font-bold">POD Pics</th>
                                    <th className="px-4 py-3 font-bold">Status</th>
                                    <th className="px-4 py-3 font-bold text-right">Logs</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {podFilteredRecords.map((record) => (
                                    <tr
                                      key={record.id}
                                      onClick={() => setPodSelectedRecordId(record.id)}
                                      className={`cursor-pointer transition hover:bg-slate-50 ${podSelectedRecordId === record.id ? 'bg-blue-50/60' : 'bg-white'}`}
                                    >
                                      <td className="px-4 py-3">
                                        <p className="text-[0.82rem] font-bold text-slate-800">{record.id}</p>
                                        <p className="text-[0.72rem] font-medium text-slate-500 mt-0.5">{record.route}</p>
                                      </td>
                                      <td className="px-4 py-3 text-[0.75rem] font-semibold text-slate-600">{formatPodDateTime(record.deliveredAt)}</td>
                                      <td className="px-4 py-3 text-[0.75rem] font-bold text-slate-700">{record.shipmentPhotos?.length ?? 0}</td>
                                      <td className="px-4 py-3 text-[0.75rem] font-bold text-slate-700">{record.podLetterPhotos?.length ?? 0}</td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-bold ${podStatusToneMap[record.status] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                          {record.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <button
                                          onClick={(event) => {
                                            event.stopPropagation()
                                            setPodSelectedRecordId(record.id)
                                          }}
                                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-bold text-slate-600 transition hover:bg-slate-100"
                                        >
                                          <Eye className="h-3.5 w-3.5" /> Open
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                      {!selectedPodRecord ? (
                        <div className="flex h-full items-center justify-center px-6 text-center text-[0.9rem] font-semibold text-slate-500">
                          Select a POD log to view shipment photos and signed POD letter images.
                        </div>
                      ) : (
                        <div className="flex h-full min-h-0 flex-col">
                          <div className="border-b border-slate-100 p-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-[1.02rem] font-black text-slate-900">{selectedPodRecord.id}</p>
                                <p className="mt-0.5 text-[0.82rem] font-semibold text-slate-600">{selectedPodRecord.route}</p>
                                <p className="mt-1 text-[0.75rem] font-medium text-slate-500">{selectedPodRecord.destinationAddress}</p>
                              </div>
                              <span className={`inline-flex rounded-full px-3 py-1 text-[0.72rem] font-bold ${podStatusToneMap[selectedPodRecord.status] ?? 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                {selectedPodRecord.status}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-1 gap-2 text-[0.74rem] font-semibold text-slate-600 sm:grid-cols-3">
                              <p>Delivered: <span className="text-slate-800">{formatPodDateTime(selectedPodRecord.deliveredAt)}</span></p>
                              <p>Submitted: <span className="text-slate-800">{formatPodDateTime(selectedPodRecord.submittedAt)}</span></p>
                              <p>Payout: <span className="text-slate-800">{selectedPodRecord.payoutState}</span></p>
                            </div>

                            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[0.75rem] font-semibold text-slate-600">{selectedPodRecord.reviewNote}</p>
                            {selectedPodRecord.rejectionReason && (
                              <p className="mt-2 text-[0.74rem] font-semibold text-rose-600">Rejection reason: {selectedPodRecord.rejectionReason}</p>
                            )}
                          </div>

                          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 dashboard-scrollbar">
                            <div className="rounded-2xl border border-slate-200 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <h4 className="text-[0.95rem] font-bold text-slate-900">Shipment Photos ({selectedShipmentPhotos.length})</h4>
                                <label className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-bold text-slate-700 transition ${isSelectedRecordReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-100'}`}>
                                  <Upload className="h-3.5 w-3.5" /> Upload Shipment Pics
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    disabled={isSelectedRecordReadOnly}
                                    onChange={(event) => handlePodFilesUpload(event, selectedPodRecord.id, 'shipmentPhotos', 'Shipment Photo')}
                                  />
                                </label>
                              </div>

                              {selectedShipmentPhotos.length === 0 ? (
                                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[0.74rem] font-semibold text-slate-500">No shipment photos uploaded yet.</p>
                              ) : (
                                <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-3">
                                  {selectedShipmentPhotos.map((photo) => (
                                    <div key={photo.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                      <img src={photo.imageUrl} alt={photo.label} className="h-24 w-full object-cover" />
                                      <div className="px-2.5 py-2">
                                        <p className="truncate text-[0.7rem] font-bold text-slate-700">{photo.label}</p>
                                        <p className="mt-1 text-[0.66rem] font-medium text-slate-500">{formatPodDateTime(photo.uploadedAt)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="rounded-2xl border border-slate-200 p-4">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <h4 className="text-[0.95rem] font-bold text-slate-900">POD Letter Photos ({selectedPodLetterPhotos.length})</h4>
                                <label className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[0.72rem] font-bold text-slate-700 transition ${isSelectedRecordReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-slate-100'}`}>
                                  <Upload className="h-3.5 w-3.5" /> Upload POD Letter
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    disabled={isSelectedRecordReadOnly}
                                    onChange={(event) => handlePodFilesUpload(event, selectedPodRecord.id, 'podLetterPhotos', 'POD Letter')}
                                  />
                                </label>
                              </div>

                              {selectedPodLetterPhotos.length === 0 ? (
                                <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[0.74rem] font-semibold text-slate-500">No POD letter photos uploaded yet.</p>
                              ) : (
                                <div className="mt-3 grid grid-cols-2 gap-3 xl:grid-cols-3">
                                  {selectedPodLetterPhotos.map((photo) => (
                                    <div key={photo.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                      <img src={photo.imageUrl} alt={photo.label} className="h-24 w-full object-cover" />
                                      <div className="px-2.5 py-2">
                                        <p className="truncate text-[0.7rem] font-bold text-slate-700">{photo.label}</p>
                                        <p className="mt-1 text-[0.66rem] font-medium text-slate-500">{formatPodDateTime(photo.uploadedAt)}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <h4 className="text-[0.95rem] font-bold text-slate-900">Driver Visibility</h4>
                              <p className="mt-1 text-[0.76rem] font-semibold text-slate-600">Drivers can upload delivery evidence and view current POD status.</p>
                              <p className="mt-2 text-[0.72rem] font-semibold text-slate-500">Accepted logs are read-only. Pending and Rejected logs can receive additional uploads.</p>
                              <p className="mt-1 text-[0.72rem] font-semibold text-slate-500">Status updates are managed by operations, not by the driver.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                  </div>
                </section>
              )
            })() : activeSection === 'wallet' ? (() => {
              const walletStats = dashboardData.walletStats ?? []
              const payoutMethods = dashboardData.payoutMethods ?? []
              const walletIconMap = {
                Wallet,
                Clock3,
                Star,
                TrendingUp,
                DollarSign,
              }

              const parseMoney = (value) => {
                const parsed = Number.parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''))
                return Number.isFinite(parsed) ? parsed : 0
              }

              const getPaymentTimestamp = (payment) => {
                const createdOn = Date.parse(String(payment?.date ?? ''))
                if (Number.isFinite(createdOn)) {
                  return createdOn
                }

                const payoutOn = Date.parse(String(payment?.payoutDate ?? ''))
                return Number.isFinite(payoutOn) ? payoutOn : null
              }

              const getMonthKey = (timestamp) => {
                const dateObj = new Date(timestamp)
                return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
              }

              const getMonthLabel = (monthKey) => {
                const [year, month] = String(monthKey).split('-').map((part) => Number(part))
                if (!year || !month) {
                  return 'Unknown Month'
                }

                return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
              }

              const monthOptions = Array.from(
                new Set(
                  walletPaymentHistory
                    .map((payment) => getPaymentTimestamp(payment))
                    .filter((timestamp) => Number.isFinite(timestamp))
                    .map((timestamp) => getMonthKey(timestamp))
                )
              )
                .sort((a, b) => b.localeCompare(a))
                .map((monthKey) => ({ value: monthKey, label: getMonthLabel(monthKey) }))

              const paymentsForSelectedMonth = walletSelectedMonth === 'all'
                ? walletPaymentHistory
                : walletPaymentHistory.filter((payment) => {
                  const timestamp = getPaymentTimestamp(payment)
                  if (!Number.isFinite(timestamp)) {
                    return false
                  }

                  return getMonthKey(timestamp) === walletSelectedMonth
                })

              const parsePaymentDate = (payment) => {
                const timestamp = getPaymentTimestamp(payment)
                return Number.isFinite(timestamp) ? timestamp : 0
              }

              const sortedPayments = [...paymentsForSelectedMonth].sort((a, b) => {
                const timestampDelta = parsePaymentDate(b) - parsePaymentDate(a)
                if (timestampDelta !== 0) {
                  return timestampDelta
                }
                return String(b.id ?? '').localeCompare(String(a.id ?? ''))
              })

              const pendingPayments = sortedPayments.filter((payment) => String(payment.status ?? '').toLowerCase() === 'pending')

              const totalBase = sortedPayments.reduce((sum, payment) => sum + parseMoney(payment.baseRate), 0)
              const totalNet = sortedPayments.reduce((sum, payment) => sum + parseMoney(payment.netEarning), 0)
              const pendingNet = pendingPayments.reduce((sum, payment) => sum + parseMoney(payment.netEarning), 0)
              const selectedMonthLabel = walletSelectedMonth === 'all'
                ? 'Current month'
                : (monthOptions.find((option) => option.value === walletSelectedMonth)?.label ?? 'Selected month')

              const formatUsd = (amount) => {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
              }

              const completePendingPayment = (paymentId) => {
                const paidOnLabel = new Intl.DateTimeFormat('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }).format(new Date())

                setWalletPaymentHistory((previousPayments) => previousPayments.map((payment) => {
                  if (payment.id !== paymentId) {
                    return payment
                  }

                  return {
                    ...payment,
                    status: 'Paid',
                    payoutDate: paidOnLabel,
                  }
                }))
              }

              const handleExportWalletStatement = () => {
                const statementRows = sortedPayments.map((payment) => ({
                  paymentId: payment.id,
                  route: payment.route,
                  status: payment.status,
                  baseRate: payment.baseRate,
                  bonusAmount: payment.bonusAmount,
                  deductionAmount: payment.deductionAmount,
                  netEarning: payment.netEarning,
                  payoutDate: payment.payoutDate,
                }))

                triggerFileDownload(
                  `driver-wallet-statement-${walletSelectedMonth === 'all' ? 'all' : walletSelectedMonth}.csv`,
                  toCsv(statementRows),
                  'text/csv;charset=utf-8'
                )
              }

              const handleRequestPayout = () => {
                if (pendingPayments.length === 0) {
                  setWalletActionMessage('No pending payouts are available right now.')
                  return
                }

                const nextPendingPayment = pendingPayments[0]
                setSelectedInvoiceId(nextPendingPayment.id)
                setWalletActionMessage(`Payout request sent for ${nextPendingPayment.id}. Finance team will review and release funds.`)
              }

              const handleAddPayoutMethod = () => {
                setActiveSection('settings')
                setIsPayoutEditing(true)
              }

              const renderPaymentRows = (payments) => {
                return payments.map((payment) => {
                  const isPending = String(payment.status ?? '').toLowerCase() === 'pending'
                  const hasBonus = parseMoney(payment.bonusAmount) > 0
                  const hasDeduction = parseMoney(payment.deductionAmount) < 0
                  const isSelected = selectedInvoiceId === payment.id

                  return (
                    <tr
                      key={payment.id}
                      onClick={() => setSelectedInvoiceId(payment.id)}
                      className={`cursor-pointer transition hover:bg-slate-50 ${isSelected ? 'bg-blue-50/60' : ''} ${isPending ? 'bg-slate-50/70' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <p className={`text-[0.84rem] font-black ${isPending ? 'text-slate-600' : 'text-slate-900'}`}>{payment.id}</p>
                        <p className={`mt-0.5 text-[0.74rem] font-semibold ${isPending ? 'text-slate-500' : 'text-slate-600'}`}>{payment.route}</p>
                        <p className="mt-0.5 text-[0.68rem] font-semibold text-slate-400">{payment.date}</p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.66rem] font-bold ${isPending ? 'bg-amber-100/70 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className={`px-3 py-3 text-[0.76rem] font-bold ${isPending ? 'text-slate-600' : 'text-slate-800'}`}>{payment.baseRate}</td>
                      <td className="px-3 py-3">
                        <p className={`text-[0.74rem] font-bold ${hasBonus ? 'text-emerald-700' : (isPending ? 'text-slate-400' : 'text-slate-500')}`}>{hasBonus ? payment.bonusAmount : '-'}</p>
                        <p className="text-[0.66rem] font-semibold text-slate-400">{hasBonus ? payment.bonusLabel : '-'}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className={`text-[0.74rem] font-bold ${hasDeduction ? 'text-rose-700' : (isPending ? 'text-slate-400' : 'text-slate-500')}`}>{hasDeduction ? payment.deductionAmount : '-'}</p>
                        <p className="text-[0.66rem] font-semibold text-slate-400">{hasDeduction ? payment.deductionLabel : '-'}</p>
                      </td>
                      <td className={`px-3 py-3 text-right text-[0.82rem] font-black ${isPending ? 'text-slate-700' : 'text-slate-900'}`}>{payment.netEarning}</td>
                      <td className="px-4 py-3 text-right">
                        {isPending ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              completePendingPayment(payment.id)
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.06em] text-white hover:bg-blue-700"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Mark Paid
                          </button>
                        ) : (
                          <span className="text-[0.68rem] font-bold text-emerald-700">{payment.payoutDate}</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              }

              return (
                <section className="h-[calc(100vh-85px)] overflow-hidden bg-white">
                  <div className="flex h-full min-h-0 overflow-hidden">
                    <article className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
                      <div className="shrink-0 border-b border-slate-200 bg-white shadow-sm z-20">
                        <div className="flex flex-col justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center lg:px-8">
                          <div>
                            <h2 className="text-[2rem] font-bold tracking-tight text-slate-800">Earnings and Wallet</h2>
                            <p className="mt-0.5 text-[0.86rem] font-semibold text-slate-500">Track driver earnings, pending payouts, and payment history for completed loads.</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleExportWalletStatement}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                            >
                              <Download className="h-4 w-4" />
                              Export Statement
                            </button>
                            <button
                              type="button"
                              onClick={handleRequestPayout}
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
                            >
                              <Wallet className="h-4 w-4" />
                              Request Payout
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 px-6 pb-3 pt-1 md:grid-cols-3 lg:px-8">
                          {walletActionMessage ? (
                            <div className="md:col-span-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-[0.78rem] font-semibold text-blue-800">
                              {walletActionMessage}
                            </div>
                          ) : null}
                          {walletStats.map((stat) => {
                            const IconComp = walletIconMap[stat.icon] ?? Wallet
                            let displayValue = stat.value
                            let displayNote = stat.note

                            if (stat.id === 'total-earnings' && walletSelectedMonth !== 'all') {
                              displayValue = formatUsd(totalNet)
                              displayNote = `${selectedMonthLabel} performance`
                            }

                            if (stat.id === 'pending-payments') {
                              displayValue = formatUsd(pendingNet)
                              displayNote = `${pendingPayments.length} ${pendingPayments.length === 1 ? 'load' : 'loads'} pending settlement`
                            }

                            return (
                              <article key={stat.id} className={`rounded-2xl border p-4 shadow-sm ${stat.bgScale ?? 'border-slate-200 bg-white'}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-[0.7rem] font-bold uppercase tracking-[0.08em] text-slate-500">{stat.label}</p>
                                    <p className={`mt-1 text-[1.55rem] font-black tracking-tight ${stat.textTone ?? 'text-slate-900'}`}>{displayValue}</p>
                                    <p className="mt-1 text-[0.74rem] font-semibold text-slate-600">{displayNote}</p>
                                  </div>
                                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${stat.iconTone ?? 'bg-slate-100 text-slate-700'}`}>
                                    <IconComp className="h-5 w-5" />
                                  </div>
                                </div>
                              </article>
                            )
                          })}
                        </div>
                      </div>

                      <div className="min-h-0 flex-1 overflow-hidden bg-[#f3f5fa] px-5 py-5">
                        <section className="grid h-full gap-5 xl:grid-cols-[minmax(0,1.85fr)_minmax(300px,0.95fr)]">
                          <div className="min-h-0">
                            <article className="flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_18px_36px_-30px_rgba(15,23,42,0.4)]">
                              <div className="border-b border-slate-200 px-5 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <h3 className="text-[1.2rem] font-black tracking-tight text-slate-900">Payment History</h3>
                                    <p className="text-[0.76rem] font-semibold text-slate-500">Newest payments appear at the top. Pending rows appear muted.</p>
                                  </div>
                                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[0.74rem] font-semibold text-slate-600">
                                    <CalendarDays className="h-4 w-4 text-blue-600" />
                                    <span>Month</span>
                                    <select
                                      value={walletSelectedMonth}
                                      onChange={(event) => setWalletSelectedMonth(event.target.value)}
                                      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[0.72rem] font-bold text-slate-700 outline-none"
                                    >
                                      <option value="all">All Months</option>
                                      {monthOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                                <p className="mt-3 text-[0.74rem] font-semibold text-slate-600">
                                  {selectedMonthLabel} earnings: <span className="font-black text-slate-900">{formatUsd(totalNet)}</span>
                                </p>
                              </div>
                              <div className="dashboard-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-auto">
                                <table className="min-w-full">
                                  <thead className="sticky top-0 z-10 bg-slate-50">
                                    <tr className="text-left text-[0.66rem] font-bold uppercase tracking-[0.08em] text-slate-500">
                                      <th className="px-4 py-3">Load Info</th>
                                      <th className="px-3 py-3 text-center">Status</th>
                                      <th className="px-3 py-3">Base</th>
                                      <th className="px-3 py-3">Bonus</th>
                                      <th className="px-3 py-3">Deduction</th>
                                      <th className="px-3 py-3 text-right">Net</th>
                                      <th className="px-4 py-3 text-right">Action / Payout</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {sortedPayments.length > 0 ? renderPaymentRows(sortedPayments) : (
                                      <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-[0.8rem] font-semibold text-slate-500">
                                          No payment records found for selected month.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </article>
                          </div>

                          <aside className="space-y-4">
                            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
                              <h3 className="text-[1.05rem] font-black tracking-tight text-slate-900">Earnings Snapshot</h3>
                              <div className="mt-4 space-y-3">
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-500">Total Base Rate</p>
                                  <p className="mt-1 text-[1rem] font-black text-slate-900">{formatUsd(totalBase)}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-500">Total Net Earning</p>
                                  <p className="mt-1 text-[1rem] font-black text-emerald-700">{formatUsd(totalNet)}</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.08em] text-slate-500">Pending Settlement</p>
                                  <p className="mt-1 text-[1rem] font-black text-amber-700">{formatUsd(pendingNet)}</p>
                                </div>
                              </div>
                            </article>

                            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.45)]">
                              <h3 className="text-[1.05rem] font-black tracking-tight text-slate-900">Linked Payout Methods</h3>
                              <div className="mt-4 space-y-2.5">
                                {payoutMethods.map((method) => (
                                  <div key={method.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                    <div>
                                      <p className="text-[0.78rem] font-bold text-slate-800">{method.type} {method.masked}</p>
                                      <p className="text-[0.68rem] font-semibold text-slate-500">{method.label}</p>
                                    </div>
                                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[0.62rem] font-black uppercase tracking-[0.06em] text-emerald-700">{method.status}</span>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={handleAddPayoutMethod}
                                  className="mt-1 w-full rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-[0.72rem] font-bold text-slate-600 hover:bg-slate-50"
                                >
                                  Add Payout Method
                                </button>
                              </div>
                            </article>
                          </aside>
                        </section>
                      </div>
                    </article>
                  </div>
                </section>
              )
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
      </div>
  )
}

export default App




