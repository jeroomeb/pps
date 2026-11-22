'use client'

import React, { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Flame,
  CheckCircle2,
  Send,
  Users,
  Bot,
  Layers,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import type {
  GrowthLead,
  GrowthLeadStats,
  GrowthLeadInput,
  CommunityType,
  IntentTier,
  OutreachStatus,
} from '@/types/growth-leads'
import {
  COMMUNITY_TYPE_CONFIG,
  INTENT_TIER_CONFIG,
  OUTREACH_STATUS_CONFIG,
} from '@/types/growth-leads'
import { updateGrowthLead, createGrowthLead, bulkUpdateLeadStatus } from '@/lib/actions/leads'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { LeadDrawer } from './LeadDrawer'
import { AddLeadModal } from './AddLeadModal'

interface LeadsDashboardClientProps {
  initialLeads: GrowthLead[]
  initialTotal: number
  initialStats: GrowthLeadStats
}

type TabType = 'discovered' | 'cadence' | 'recruiting' | 'ai-reply'

export function LeadsDashboardClient({
  initialLeads,
  initialTotal,
  initialStats,
}: LeadsDashboardClientProps) {
  const [leads, setLeads] = useState<GrowthLead[]>(initialLeads)
  const [activeTab, setActiveTab] = useState<TabType>('discovered')

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<CommunityType | 'all'>('all')
  const [selectedTier, setSelectedTier] = useState<IntentTier | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<OutreachStatus | 'all'>('all')

  // Drawer & Modal States
  const [selectedLead, setSelectedLead] = useState<GrowthLead | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isExporting, setIsExporting] = useState<'xlsx' | 'csv' | null>(null)

  // Multi-Selection State for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Dynamic Memoized Filtering (60 FPS responsiveness)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Type filter
      if (selectedType !== 'all' && lead.community_type !== selectedType) {
        return false
      }
      // Tier filter
      if (selectedTier !== 'all' && lead.intent_tier !== selectedTier) {
        return false
      }
      // Status filter
      if (selectedStatus !== 'all' && lead.outreach_status !== selectedStatus) {
        return false
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const matchName = lead.property_name.toLowerCase().includes(q)
        const matchAddr = lead.address.toLowerCase().includes(q)
        const matchCity = lead.municipality_town.toLowerCase().includes(q)
        const matchCounty = lead.county.toLowerCase().includes(q)
        const matchContact =
          lead.target_gatekeeper_name?.toLowerCase().includes(q) ?? false
        const matchEmail = lead.email?.toLowerCase().includes(q) ?? false
        if (!matchName && !matchAddr && !matchCity && !matchCounty && !matchContact && !matchEmail) {
          return false
        }
      }
      return true
    })
  }, [leads, selectedType, selectedTier, selectedStatus, searchTerm])

  // Calculated Stats
  const stats = useMemo(() => {
    return {
      total: leads.length,
      tier1ActivePain: leads.filter((l) => l.intent_tier === 1).length,
      verifiedContacts: leads.filter((l) => Boolean(l.email && l.phone)).length,
      inSequence: leads.filter((l) => l.outreach_status === 'in_sequence').length,
      motels: leads.filter((l) => l.community_type === 'motel').length,
      studentHousing: leads.filter((l) => l.community_type === 'student_housing').length,
    }
  }, [leads])

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchTerm('')
    setSelectedType('all')
    setSelectedTier('all')
    setSelectedStatus('all')
  }, [])

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedType !== 'all' ||
    selectedTier !== 'all' ||
    selectedStatus !== 'all'

  // Update Lead Status via Server Action
  const handleStatusChange = useCallback(
    async (id: string, newStatus: OutreachStatus) => {
      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, outreach_status: newStatus } : l))
      )
      if (selectedLead?.id === id) {
        setSelectedLead((prev) => (prev ? { ...prev, outreach_status: newStatus } : null))
      }

      try {
        await updateGrowthLead(id, { outreach_status: newStatus })
      } catch (err) {
        console.error('Failed to update lead status:', err)
        // Rollback on failure
        setLeads(initialLeads)
      }
    },
    [selectedLead, initialLeads]
  )

  // Handle Manual Lead Creation
  const handleCreateLead = useCallback(async (data: GrowthLeadInput) => {
    try {
      const created = await createGrowthLead(data)
      setLeads((prev) => [created, ...prev])
    } catch (err) {
      console.error('Failed to create lead:', err)
      throw err
    }
  }, [])

  // Export Trigger (Direct Stream from API route with active filters)
  const handleTriggerExport = useCallback(
    (format: 'xlsx' | 'csv') => {
      setIsExporting(format)
      const params = new URLSearchParams()
      params.set('format', format)
      if (selectedType !== 'all') params.set('communityType', selectedType)
      if (selectedTier !== 'all') params.set('intentTier', String(selectedTier))
      if (selectedStatus !== 'all') params.set('outreachStatus', selectedStatus)
      if (searchTerm.trim()) params.set('search', searchTerm.trim())

      // Trigger browser download
      window.location.href = `/api/admin/leads/export?${params.toString()}`

      setTimeout(() => {
        setIsExporting(null)
      }, 1500)
    },
    [selectedType, selectedTier, selectedStatus, searchTerm]
  )

  // Multi-Selection Toggle
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)))
    }
  }, [selectedIds, filteredLeads])

  const toggleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleBulkStatus = useCallback(
    async (status: OutreachStatus) => {
      const ids = Array.from(selectedIds)
      if (ids.length === 0) return

      // Optimistic update
      setLeads((prev) =>
        prev.map((l) => (ids.includes(l.id) ? { ...l, outreach_status: status } : l))
      )
      setSelectedIds(new Set())

      try {
        await bulkUpdateLeadStatus(ids, status)
      } catch (err) {
        console.error('Failed bulk update:', err)
      }
    },
    [selectedIds]
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Amenity Op's Growth Subsystem"
        title="Lead Engine & Outreach Automation"
        subtitle="Discover off-hours commercial & hospitality properties, score intent pain signals, and run isolated sequences."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* 1-Click Excel Export */}
            <button
              type="button"
              onClick={() => handleTriggerExport('xlsx')}
              disabled={isExporting !== null || filteredLeads.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-emerald-600/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50"
              title="Download currently filtered leads in Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} />
              {isExporting === 'xlsx' ? 'Generating...' : 'Export Excel (.xlsx)'}
            </button>

            {/* 1-Click CSV Export */}
            <button
              type="button"
              onClick={() => handleTriggerExport('csv')}
              disabled={isExporting !== null || filteredLeads.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high transition disabled:opacity-50"
              title="Download currently filtered leads in standard CSV (.csv)"
            >
              <FileText size={15} />
              {isExporting === 'csv' ? 'Generating...' : 'Export CSV'}
            </button>

            {/* Add Lead Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-primary text-on-primary hover:opacity-90 transition shadow-xs"
            >
              <Plus size={15} />
              Add Property
            </button>
          </div>
        }
      />

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {/* Total Discovered */}
        <Card padded className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Discovered Assets
            </span>
            <Building2 size={16} className="text-primary" />
          </div>
          <div className="text-2xl font-black font-headline text-on-surface">{stats.total}</div>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-on-surface-variant">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-semibold">
              {stats.motels} Motels
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold">
              {stats.studentHousing} Student Housing
            </span>
          </div>
        </Card>

        {/* Tier 1 Active Pain */}
        <Card padded className="space-y-1 border-red-500/30 bg-red-500/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
              Tier 1 Active Pain
            </span>
            <Flame size={16} className="text-red-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black font-headline text-red-700 dark:text-red-400">
            {stats.tier1ActivePain}
          </div>
          <p className="text-[11px] text-red-600/80">
            Active night job posts or critical complaint reviews
          </p>
        </Card>

        {/* Verified Contacts */}
        <Card padded className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Verified Contacts
            </span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-headline text-on-surface">
            {stats.verifiedContacts}
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Direct decision-maker email &amp; desk phone
          </p>
        </Card>

        {/* In Sequence */}
        <Card padded className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              In 4-Touch Cadence
            </span>
            <Send size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black font-headline text-on-surface">
            {stats.inSequence}
          </div>
          <p className="text-[11px] text-on-surface-variant">
            Automated Tue–Thu mid-morning delivery
          </p>
        </Card>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-outline-variant">
        <nav className="flex space-x-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('discovered')}
            className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'discovered'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Layers size={16} />
            Discovered Leads ({filteredLeads.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cadence')}
            className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'cadence'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Send size={16} />
            B2B Outreach Cadence
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recruiting')}
            className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'recruiting'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Users size={16} />
            Specialist Recruitment
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai-reply')}
            className={`pb-3 text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'ai-reply'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Bot size={16} />
            AI Lead Reply Assistant
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary/10 text-primary font-bold">
              Draft-Only
            </span>
          </button>
        </nav>
      </div>

      {/* TAB 1: Discovered Leads (The Master Data Hub) */}
      {activeTab === 'discovered' && (
        <div className="space-y-4">
          {/* Search, Filter & Quick-Action Bar */}
          <Card padded className="space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search by property, address, municipality, contact, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filters Group */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Community Type */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as CommunityType | 'all')}
                  className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
                >
                  <option value="all">All Property Classes</option>
                  <option value="student_housing">Student Housing</option>
                  <option value="motel">Motels &amp; Hospitality</option>
                  <option value="luxury_multifamily">Luxury Multi-Family</option>
                  <option value="active_adult_55_plus">55+ Active Adult</option>
                  <option value="commercial_multitenant">Commercial Multi-Tenant</option>
                  <option value="regional_portfolio">Regional Portfolio</option>
                </select>

                {/* Intent Tier */}
                <select
                  value={selectedTier}
                  onChange={(e) =>
                    setSelectedTier(e.target.value === 'all' ? 'all' : (Number(e.target.value) as IntentTier))
                  }
                  className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
                >
                  <option value="all">All Intent Tiers</option>
                  <option value={1}>Tier 1 — Active Pain</option>
                  <option value={2}>Tier 2 — High Risk / Citations</option>
                  <option value={3}>Tier 3 — Targeted Portal</option>
                  <option value={4}>Tier 4 — Enterprise Portfolio</option>
                  <option value={5}>Tier 5 — CRE Public Record</option>
                </select>

                {/* Outreach Status */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OutreachStatus | 'all')}
                  className="px-2.5 py-2 text-xs font-semibold rounded-lg border border-outline-variant bg-surface-container-low text-on-surface focus:outline-hidden focus:border-primary transition"
                >
                  <option value="all">All Outreach Statuses</option>
                  <option value="new">New Discovery</option>
                  <option value="enriched">Enriched</option>
                  <option value="in_sequence">In 4-Touch Cadence</option>
                  <option value="replied">Prospect Replied</option>
                  <option value="demo_scheduled">Demo Scheduled</option>
                  <option value="disqualified">Disqualified</option>
                </select>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-2.5 py-2 text-xs font-semibold text-primary hover:underline transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Active Filter Indicators & Result Count */}
            <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 border-t border-outline-variant/60">
              <span className="font-medium">
                Showing <strong className="text-on-surface">{filteredLeads.length}</strong> of{' '}
                {leads.length} discovered properties
              </span>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">
                    {selectedIds.size} selected:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBulkStatus('in_sequence')}
                    className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-600 text-[11px] font-bold hover:bg-indigo-500/20 transition"
                  >
                    Enroll in Cadence
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatus('disqualified')}
                    className="px-2 py-1 rounded bg-rose-500/10 text-rose-600 text-[11px] font-bold hover:bg-rose-500/20 transition"
                  >
                    Disqualify
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* Desktop & Tablet Table View */}
          <div className="hidden md:block rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low/50 text-on-surface-variant uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 pl-4 pr-2 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.size === filteredLeads.length && filteredLeads.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                      />
                    </th>
                    <th className="py-3.5 px-3 font-bold">Property Name &amp; Class</th>
                    <th className="py-3.5 px-3 font-bold">Location &amp; County</th>
                    <th className="py-3.5 px-3 font-bold">Key Amenities &amp; Pain Signals</th>
                    <th className="py-3.5 px-3 font-bold">Gatekeeper / Contact</th>
                    <th className="py-3.5 px-3 font-bold">Phone &amp; Email</th>
                    <th className="py-3.5 px-3 font-bold">Intent Tier</th>
                    <th className="py-3.5 px-3 font-bold">Status</th>
                    <th className="py-3.5 pr-4 pl-2 text-right font-bold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-on-surface-variant">
                        <Building2 size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-sm text-on-surface">No properties match your filter.</p>
                        <p className="text-xs mt-1">Try resetting your search query or class filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const comm =
                        COMMUNITY_TYPE_CONFIG[lead.community_type] || COMMUNITY_TYPE_CONFIG.other
                      const tier =
                        INTENT_TIER_CONFIG[lead.intent_tier] || INTENT_TIER_CONFIG[3]
                      const st =
                        OUTREACH_STATUS_CONFIG[lead.outreach_status] || OUTREACH_STATUS_CONFIG.new
                      const isSelected = selectedIds.has(lead.id)

                      return (
                        <tr
                          key={lead.id}
                          className={`hover:bg-surface-container-low/60 transition cursor-pointer ${
                            isSelected ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => setSelectedLead(lead)}
                        >
                          {/* Checkbox */}
                          <td
                            className="py-3 pl-4 pr-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleSelectOne(lead.id)
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-outline-variant text-primary focus:ring-primary cursor-pointer"
                            />
                          </td>

                          {/* 1. Property Name & 2. Community Type */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-on-surface max-w-[200px] truncate text-sm">
                              {lead.property_name}
                            </div>
                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border mt-0.5 ${comm.badgeClass}`}
                            >
                              {comm.label}
                            </span>
                          </td>

                          {/* 3. Address, 4. Municipality, 5. County */}
                          <td className="py-3 px-3 max-w-[180px]">
                            <div className="text-on-surface font-medium truncate">{lead.address}</div>
                            <div className="text-[11px] text-on-surface-variant truncate">
                              {lead.municipality_town}, {lead.county} Co.
                            </div>
                          </td>

                          {/* 6. Key Amenities & Pain Signals */}
                          <td className="py-3 px-3 max-w-[240px]">
                            <p
                              className="text-on-surface text-xs line-clamp-2 leading-relaxed"
                              title={lead.key_amenities_notes || ''}
                            >
                              {lead.key_amenities_notes || '—'}
                            </p>
                          </td>

                          {/* 7. Target Gatekeeper */}
                          <td className="py-3 px-3 max-w-[160px]">
                            <div className="font-semibold text-on-surface truncate">
                              {lead.target_gatekeeper_name || 'Pending Name'}
                            </div>
                            <div className="text-[11px] text-on-surface-variant truncate">
                              {lead.target_gatekeeper_title || '—'}
                            </div>
                          </td>

                          {/* 8. Phone & 9. Email */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            {lead.phone ? (
                              <div className="flex items-center gap-1.5 text-on-surface font-medium">
                                <Phone size={12} className="text-primary" />
                                <span>{lead.phone}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-on-surface-variant italic">No phone</span>
                            )}

                            {lead.email ? (
                              <div className="flex items-center gap-1.5 text-primary text-[11px] mt-0.5 max-w-[150px] truncate">
                                <Mail size={12} className="shrink-0" />
                                <span className="truncate">{lead.email}</span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-on-surface-variant italic block mt-0.5">
                                No email
                              </span>
                            )}
                          </td>

                          {/* Intent Tier */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] border ${tier.badgeClass}`}
                            >
                              {tier.label.split('—')[0].trim()}
                            </span>
                          </td>

                          {/* Outreach Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] border font-medium ${st.badgeClass}`}
                            >
                              {st.label}
                            </span>
                          </td>

                          {/* Action */}
                          <td className="py-3 pr-4 pl-2 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLead(lead)
                              }}
                              className="p-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition"
                              title="View full details"
                            >
                              <ChevronRight size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout (<768px) */}
          <div className="md:hidden space-y-3">
            {filteredLeads.length === 0 ? (
              <Card padded className="text-center py-10">
                <Building2 size={32} className="mx-auto mb-2 opacity-40" />
                <p className="font-semibold text-sm">No properties match your filter.</p>
              </Card>
            ) : (
              filteredLeads.map((lead) => {
                const comm =
                  COMMUNITY_TYPE_CONFIG[lead.community_type] || COMMUNITY_TYPE_CONFIG.other
                const tier = INTENT_TIER_CONFIG[lead.intent_tier] || INTENT_TIER_CONFIG[3]
                const st =
                  OUTREACH_STATUS_CONFIG[lead.outreach_status] || OUTREACH_STATUS_CONFIG.new

                return (
                  <Card
                    key={lead.id}
                    padded
                    className="space-y-3 cursor-pointer hover:border-primary/50 transition"
                    id={`mobile-card-${lead.id}`}
                  >
                    <div
                      className="flex items-start justify-between gap-2"
                      onClick={() => setSelectedLead(lead)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border ${comm.badgeClass}`}
                          >
                            {comm.label}
                          </span>
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] border ${tier.badgeClass}`}
                          >
                            {tier.label.split('—')[0].trim()}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-on-surface truncate">
                          {lead.property_name}
                        </h3>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="shrink-0 text-primary" />
                          <span className="truncate">
                            {lead.address}, {lead.municipality_town}
                          </span>
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-on-surface-variant shrink-0 mt-1" />
                    </div>

                    {lead.key_amenities_notes && (
                      <p className="text-xs text-on-surface-variant line-clamp-2 bg-surface-container-low/60 p-2 rounded-lg">
                        {lead.key_amenities_notes}
                      </p>
                    )}

                    <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-on-surface block">
                          {lead.target_gatekeeper_name || 'No Contact'}
                        </span>
                        <span className="text-[11px] text-on-surface-variant">
                          {lead.target_gatekeeper_title || 'Title pending'}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] border font-medium ${st.badgeClass}`}
                      >
                        {st.label}
                      </span>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: B2B Outreach Cadence Overview */}
      {activeTab === 'cadence' && (
        <div className="space-y-6">
          <Card padded className="space-y-4">
            <div>
              <h2 className="text-lg font-bold font-headline text-on-surface">
                Automated 4-Touch B2B Sales Cadence
              </h2>
              <p className="text-xs text-on-surface-variant">
                Sends Tuesday through Thursday mid-morning (local prospect time). Automatically and
                permanently halts upon reply.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <div className="border border-outline-variant rounded-xl p-4 bg-surface-container-low/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase">Touch 1 (Day 1)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">
                    Email
                  </span>
                </div>
                <h3 className="text-sm font-bold text-on-surface">Overnight Uncertainty</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Addresses the stress of unmonitored night hours; asks permission to send a 5-minute
                  self-paced demo video.
                </p>
              </div>

              <div className="border border-outline-variant rounded-xl p-4 bg-surface-container-low/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase">Touch 2 (Day 4)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">
                    Email
                  </span>
                </div>
                <h3 className="text-sm font-bold text-on-surface">Morning Handoff Reports</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Eliminates the &quot;morning surprise&quot; via digital handoff checklists delivered before
                  morning coffee.
                </p>
              </div>

              <div className="border border-outline-variant rounded-xl p-4 bg-surface-container-low/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase">Touch 3 (Day 8)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">
                    Email
                  </span>
                </div>
                <h3 className="text-sm font-bold text-on-surface">In-House Empowerment</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Empowering existing staff with digital audits without paying third-party outside
                  security vendors.
                </p>
              </div>

              <div className="border border-outline-variant rounded-xl p-4 bg-surface-container-low/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase">Touch 4 (Day 14)</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">
                    Breakup
                  </span>
                </div>
                <h3 className="text-sm font-bold text-on-surface">Polite Break-Up</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Closes the proactive outreach sequence gracefully, leaving the demo video link for
                  future reference.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Specialist Recruitment */}
      {activeTab === 'recruiting' && (
        <Card padded className="space-y-4">
          <div>
            <h2 className="text-lg font-bold font-headline text-on-surface">
              Specialist Field Recruitment Engine
            </h2>
            <p className="text-xs text-on-surface-variant">
              Sources Operations Continuity Specialists via a strict 2-touch recruitment cadence.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant text-xs space-y-2">
            <p className="font-semibold text-on-surface">Core Recruiting Competencies:</p>
            <ul className="list-disc pl-5 space-y-1 text-on-surface-variant">
              <li>Autonomous off-hours track record (overnight/graveyard shifts).</li>
              <li>Facilities and audit checklist literacy (never framed as traditional security guard roles).</li>
              <li>Steady tenure with high-trust property technology app familiarity.</li>
            </ul>
          </div>
        </Card>
      )}

      {/* TAB 4: AI Reply Assistant */}
      {activeTab === 'ai-reply' && (
        <Card padded className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-headline text-on-surface flex items-center gap-2">
                <Bot size={20} className="text-primary" />
                Human-in-the-Loop AI Lead Reply Assistant
              </h2>
              <p className="text-xs text-on-surface-variant">
                Categorizes prospect intent, cancels further sequence cadences, and prepares draft replies for human review.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              Zero Auto-Send Authority
            </span>
          </div>

          <div className="p-6 border border-dashed border-outline-variant rounded-xl text-center space-y-2 bg-surface-container-low/20">
            <CheckCircle2 size={32} className="mx-auto text-emerald-500 opacity-80" />
            <h3 className="text-sm font-bold text-on-surface">No Pending Drafts to Review</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              When an outbound prospect replies to an outreach email, the AI Assistant will classify
              the response (*Wants Demo, Pricing, Not Interested*) and draft a response here for your 1-click approval.
            </p>
          </div>
        </Card>
      )}

      {/* Slide-Over Drawer for Lead Details */}
      <LeadDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onStatusChange={handleStatusChange}
      />

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateLead}
      />
    </div>
  )
}

