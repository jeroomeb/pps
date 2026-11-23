'use client'

import React, { useState } from 'react'
import { X, Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import * as XLSX from 'xlsx'
import type { RawLeadCsvRow } from '@/lib/actions/leads'
import { batchImportLeads } from '@/lib/actions/leads'
import type { GrowthLead } from '@/types/growth-leads'

interface BatchImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: (newLeads: GrowthLead[]) => void
}

export function BatchImportModal({ isOpen, onClose, onImportComplete }: BatchImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<RawLeadCsvRow[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [resultSummary, setResultSummary] = useState<{
    imported: number
    duplicates: number
  } | null>(null)

  if (!isOpen) return null

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    setResultSummary(null)
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

        if (!data || data.length === 0) {
          setErrorMsg('The selected spreadsheet or CSV is empty.')
          return
        }

        // Map column variations to canonical RawLeadCsvRow
        const rows: RawLeadCsvRow[] = data.map((d) => {
          const findVal = (...keys: string[]): string => {
            for (const k of keys) {
              const matchedKey = Object.keys(d).find(
                (col) => col.trim().toLowerCase() === k.toLowerCase()
              )
              if (matchedKey && d[matchedKey]) return String(d[matchedKey]).trim()
            }
            return ''
          }

          return {
            property_name: findVal('Property Name', 'property_name', 'name', 'property', 'asset'),
            community_type: findVal(
              'Community / Property Type',
              'Community Type',
              'community_type',
              'type',
              'category'
            ),
            address: findVal('Street Address', 'Address', 'address', 'street'),
            municipality_town: findVal('Municipality / Town', 'Municipality', 'Town', 'City', 'municipality_town'),
            county: findVal('County', 'county'),
            key_amenities_notes: findVal('Key Amenities & Pain Signals', 'Key Amenities / Notes', 'Notes', 'Amenities', 'key_amenities_notes'),
            target_gatekeeper_name: findVal('Target Gatekeeper / Contact', 'Gatekeeper', 'Contact', 'target_gatekeeper_name', 'contact_name'),
            target_gatekeeper_title: findVal('Contact Title', 'Title', 'target_gatekeeper_title'),
            phone: findVal('Phone Number', 'Phone', 'phone', 'telephone'),
            email: findVal('Email Address', 'Email', 'email'),
          }
        })

        // Filter rows that have at least a property name and address
        const validRows = rows.filter((r) => Boolean(r.property_name && r.address))
        if (validRows.length === 0) {
          setErrorMsg(
            'Could not find rows with "Property Name" and "Address". Please check your CSV column headers.'
          )
          return
        }

        setParsedRows(validRows)
      } catch (err) {
        console.error('Failed to parse file:', err)
        setErrorMsg('Error reading file. Please upload a valid .csv or .xlsx file.')
      }
    }
    reader.readAsBinaryString(selectedFile)
  }

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return
    setIsProcessing(true)
    setErrorMsg(null)

    try {
      const res = await batchImportLeads(parsedRows)
      setResultSummary({
        imported: res.importedCount,
        duplicates: res.duplicateCount,
      })
      onImportComplete(res.leads)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Batch import failed.'
      setErrorMsg(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="w-full max-w-3xl bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
              <Upload size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold font-headline text-on-surface">
                Batch Import Scraped Leads
              </h2>
              <p className="text-xs text-on-surface-variant">
                Upload a CSV or Excel sheet with property, contact, and amenities data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultSummary && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle size={18} />
                <span>Import Complete!</span>
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Successfully imported <strong>{resultSummary.imported}</strong> new properties.{' '}
                {resultSummary.duplicates > 0 && (
                  <span>({resultSummary.duplicates} duplicates skipped).</span>
                )}
              </p>
            </div>
          )}

          {!resultSummary && (
            <>
              {/* Dropzone */}
              <label className="border-2 border-dashed border-outline-variant hover:border-primary rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-surface-container-low/30 transition group">
                <FileSpreadsheet
                  size={36}
                  className="text-on-surface-variant group-hover:text-primary transition mb-2"
                />
                <span className="text-sm font-bold text-on-surface">
                  {file ? file.name : 'Click to select CSV or Excel (.xlsx) file'}
                </span>
                <span className="text-xs text-on-surface-variant mt-1">
                  Supports standard export formats with automatic column mapping
                </span>
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {/* Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-on-surface">
                    <span>Detected {parsedRows.length} valid rows</span>
                    <span className="text-on-surface-variant">
                      Intent tier &amp; contact formatting will be applied automatically
                    </span>
                  </div>

                  <div className="max-h-60 overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-low/20">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-surface-container-low sticky top-0 border-b border-outline-variant">
                        <tr className="text-on-surface-variant text-[11px] uppercase">
                          <th className="p-2">Property Name</th>
                          <th className="p-2">Class</th>
                          <th className="p-2">City &amp; County</th>
                          <th className="p-2">Contact</th>
                          <th className="p-2">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/60">
                        {parsedRows.slice(0, 10).map((r, i) => (
                          <tr key={i} className="hover:bg-surface-container-low/50">
                            <td className="p-2 font-medium text-on-surface">{r.property_name}</td>
                            <td className="p-2 text-on-surface-variant">{r.community_type || 'other'}</td>
                            <td className="p-2 text-on-surface-variant">
                              {r.municipality_town}, {r.county}
                            </td>
                            <td className="p-2 text-on-surface-variant">
                              {r.target_gatekeeper_name || '—'}
                            </td>
                            <td className="p-2 text-on-surface-variant">{r.phone || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 10 && (
                    <p className="text-[11px] text-on-surface-variant text-center">
                      ...and {parsedRows.length - 10} more rows
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant flex items-center justify-end gap-3 bg-surface-container-low/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition"
          >
            {resultSummary ? 'Done' : 'Cancel'}
          </button>

          {!resultSummary && parsedRows.length > 0 && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-bold bg-primary text-on-primary rounded-lg hover:opacity-90 transition flex items-center gap-1.5"
            >
              <span>{isProcessing ? 'Importing & Scoring...' : `Import ${parsedRows.length} Leads`}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

