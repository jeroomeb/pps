export type UserRole = 'admin' | 'inspector'
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type ItemStatus = 'pass' | 'fail' | 'na'
export type ScheduleEntry = { ordinal: number; weekday: number }
export type LicenseTier = 'starter' | 'standard' | 'pro' | 'enterprise'
export type TenantStatus = 'active' | 'suspended' | 'trial'
export type ProfileStatus = 'active' | 'inactive' | 'suspended'
export type SpecialistAssignmentRole = 'primary' | 'backup' | 'staff'
export type PayoutStatus = 'pending' | 'approved' | 'paid' | 'cancelled'
export type PayoutTier = 'tier_1' | 'tier_2' | 'tier_3' | 'custom'
export type GeofenceStatus = 'pending' | 'verified' | 'outside' | 'exempt'

export type PayoutMatrixRates = {
  tier_1: number
  tier_2: number
  tier_3: number
}

export type PayoutMatrix = {
  luxury_condo: PayoutMatrixRates
  adult_community: PayoutMatrixRates
  commercial_multi: PayoutMatrixRates
}

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string | null
          license_tier: LicenseTier
          max_property_licenses: number
          status: TenantStatus
          require_id_photo: boolean
          enable_payouts: boolean
          default_payout_rate: number
          payout_tier_1_rate: number
          payout_tier_2_rate: number
          payout_tier_3_rate: number
          payout_matrix: PayoutMatrix
          parent_organization_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          license_tier?: LicenseTier
          max_property_licenses?: number
          status?: TenantStatus
          require_id_photo?: boolean
          enable_payouts?: boolean
          default_payout_rate?: number
          payout_tier_1_rate?: number
          payout_tier_2_rate?: number
          payout_tier_3_rate?: number
          payout_matrix?: PayoutMatrix
          parent_organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          license_tier?: LicenseTier
          max_property_licenses?: number
          status?: TenantStatus
          require_id_photo?: boolean
          enable_payouts?: boolean
          default_payout_rate?: number
          payout_tier_1_rate?: number
          payout_tier_2_rate?: number
          payout_tier_3_rate?: number
          payout_matrix?: PayoutMatrix
          parent_organization_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tenants_parent_organization_id_fkey'
            columns: ['parent_organization_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: UserRole
          created_at: string
          human_id: string | null
          phone: string | null
          address: string | null
          street: string | null
          city: string | null
          state: string | null
          zip: string | null
          county: string | null
          email: string | null
          id_front_path: string | null
          id_back_path: string | null
          tenant_id: string | null
          is_global_admin: boolean
          is_contractor: boolean
          status: ProfileStatus
          must_reset_password: boolean
        }
        Insert: {
          id: string
          full_name: string
          role?: UserRole
          created_at?: string
          human_id?: string | null
          phone?: string | null
          address?: string | null
          street?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          county?: string | null
          email?: string | null
          id_front_path?: string | null
          id_back_path?: string | null
          tenant_id?: string | null
          is_global_admin?: boolean
          is_contractor?: boolean
          status?: ProfileStatus
          must_reset_password?: boolean
        }
        Update: {
          id?: string
          full_name?: string
          role?: UserRole
          created_at?: string
          human_id?: string | null
          phone?: string | null
          address?: string | null
          street?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          county?: string | null
          email?: string | null
          id_front_path?: string | null
          id_back_path?: string | null
          tenant_id?: string | null
          is_global_admin?: boolean
          is_contractor?: boolean
          status?: ProfileStatus
          must_reset_password?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      checklist_templates: {
        Row: {
          id: string
          name: string
          created_at: string
          tenant_id: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          tenant_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'checklist_templates_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      checklist_template_items: {
        Row: {
          id: string
          template_id: string
          service_category: string
          item_name: string
          description: string | null
          sort_order: number
        }
        Insert: {
          id?: string
          template_id: string
          service_category: string
          item_name: string
          description?: string | null
          sort_order?: number
        }
        Update: {
          id?: string
          template_id?: string
          service_category?: string
          item_name?: string
          description?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'checklist_template_items_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'checklist_templates'
            referencedColumns: ['id']
          },
        ]
      }
      properties: {
        Row: {
          id: string
          name: string
          address: string
          street: string | null
          city: string | null
          state: string | null
          zip: string | null
          county: string | null
          email: string
          created_at: string
          human_id: string | null
          phone: string | null
          notes: string | null
          required_schedule: ScheduleEntry[]
          tenant_id: string | null
          is_active: boolean
          require_id_photo: boolean
          custom_payout_rate: number | null
          payout_tier: PayoutTier
          enable_gps_geofencing: boolean
          latitude: number | null
          longitude: number | null
          geofence_radius_meters: number
        }
        Insert: {
          id?: string
          name: string
          address: string
          street?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          county?: string | null
          email: string
          created_at?: string
          human_id?: string | null
          phone?: string | null
          notes?: string | null
          required_schedule?: ScheduleEntry[]
          tenant_id?: string | null
          is_active?: boolean
          require_id_photo?: boolean
          custom_payout_rate?: number | null
          payout_tier?: PayoutTier
          enable_gps_geofencing?: boolean
          latitude?: number | null
          longitude?: number | null
          geofence_radius_meters?: number
        }
        Update: {
          id?: string
          name?: string
          address?: string
          street?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          county?: string | null
          email?: string
          created_at?: string
          human_id?: string | null
          phone?: string | null
          notes?: string | null
          required_schedule?: ScheduleEntry[]
          tenant_id?: string | null
          is_active?: boolean
          require_id_photo?: boolean
          custom_payout_rate?: number | null
          payout_tier?: PayoutTier
          enable_gps_geofencing?: boolean
          latitude?: number | null
          longitude?: number | null
          geofence_radius_meters?: number
        }
        Relationships: [
          {
            foreignKeyName: 'properties_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      property_specialist_assignments: {
        Row: {
          id: string
          tenant_id: string | null
          property_id: string
          specialist_id: string
          role: SpecialistAssignmentRole
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          property_id: string
          specialist_id: string
          role?: SpecialistAssignmentRole
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          property_id?: string
          specialist_id?: string
          role?: SpecialistAssignmentRole
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'property_specialist_assignments_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'property_specialist_assignments_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'property_specialist_assignments_specialist_id_fkey'
            columns: ['specialist_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      schedule_dismissals: {
        Row: {
          id: string
          property_id: string
          occurrence_date: string
          dismissed_by: string | null
          dismissed_at: string
        }
        Insert: {
          id?: string
          property_id: string
          occurrence_date: string
          dismissed_by?: string | null
          dismissed_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          occurrence_date?: string
          dismissed_by?: string | null
          dismissed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schedule_dismissals_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'schedule_dismissals_dismissed_by_fkey'
            columns: ['dismissed_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      inspections: {
        Row: {
          id: string
          property_id: string
          template_id: string
          inspector_id: string
          status: InspectionStatus
          created_at: string
          completed_at: string | null
          pdf_path: string | null
          scheduled_for: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cancellation_reason: string | null
          email_status: 'sent' | 'failed' | null
          email_error: string | null
          tenant_id: string | null
          arrived_at: string | null
          departed_at: string | null
          dwell_time_seconds: number | null
          geofence_status: GeofenceStatus
        }
        Insert: {
          id?: string
          property_id: string
          template_id: string
          inspector_id: string
          status?: InspectionStatus
          created_at?: string
          completed_at?: string | null
          pdf_path?: string | null
          scheduled_for?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          email_status?: 'sent' | 'failed' | null
          email_error?: string | null
          tenant_id?: string | null
          arrived_at?: string | null
          departed_at?: string | null
          dwell_time_seconds?: number | null
          geofence_status?: GeofenceStatus
        }
        Update: {
          id?: string
          property_id?: string
          template_id?: string
          inspector_id?: string
          status?: InspectionStatus
          created_at?: string
          completed_at?: string | null
          pdf_path?: string | null
          scheduled_for?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cancellation_reason?: string | null
          email_status?: 'sent' | 'failed' | null
          email_error?: string | null
          tenant_id?: string | null
          arrived_at?: string | null
          departed_at?: string | null
          dwell_time_seconds?: number | null
          geofence_status?: GeofenceStatus
        }
        Relationships: [
          {
            foreignKeyName: 'inspections_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inspections_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'checklist_templates'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inspections_inspector_id_fkey'
            columns: ['inspector_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inspections_cancelled_by_fkey'
            columns: ['cancelled_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inspections_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
        ]
      }
      inspection_items: {
        Row: {
          id: string
          inspection_id: string
          template_item_id: string
          service_category: string
          item_name: string
          description: string | null
          sort_order: number
          status: ItemStatus | null
          comment: string | null
          photo_path: string | null
        }
        Insert: {
          id?: string
          inspection_id: string
          template_item_id: string
          service_category: string
          item_name: string
          description?: string | null
          sort_order?: number
          status?: ItemStatus | null
          comment?: string | null
          photo_path?: string | null
        }
        Update: {
          id?: string
          inspection_id?: string
          template_item_id?: string
          service_category?: string
          item_name?: string
          description?: string | null
          sort_order?: number
          status?: ItemStatus | null
          comment?: string | null
          photo_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'inspection_items_inspection_id_fkey'
            columns: ['inspection_id']
            isOneToOne: false
            referencedRelation: 'inspections'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inspection_items_template_item_id_fkey'
            columns: ['template_item_id']
            isOneToOne: false
            referencedRelation: 'checklist_template_items'
            referencedColumns: ['id']
          },
        ]
      }
      specialist_payouts: {
        Row: {
          id: string
          tenant_id: string | null
          inspection_id: string
          specialist_id: string
          property_id: string
          amount: number
          status: PayoutStatus
          approved_at: string | null
          approved_by: string | null
          paid_at: string | null
          payment_reference: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          inspection_id: string
          specialist_id: string
          property_id: string
          amount?: number
          status?: PayoutStatus
          approved_at?: string | null
          approved_by?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          inspection_id?: string
          specialist_id?: string
          property_id?: string
          amount?: number
          status?: PayoutStatus
          approved_at?: string | null
          approved_by?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'specialist_payouts_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'specialist_payouts_inspection_id_fkey'
            columns: ['inspection_id']
            isOneToOne: true
            referencedRelation: 'inspections'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'specialist_payouts_specialist_id_fkey'
            columns: ['specialist_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'specialist_payouts_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'specialist_payouts_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      inspection_geo_logs: {
        Row: {
          id: string
          tenant_id: string | null
          inspection_id: string
          specialist_id: string
          property_id: string
          latitude: number
          longitude: number
          speed_meters_per_sec: number | null
          accuracy_meters: number | null
          distance_to_center_meters: number | null
          is_inside_geofence: boolean
          logged_at: string
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          inspection_id: string
          specialist_id: string
          property_id: string
          latitude: number
          longitude: number
          speed_meters_per_sec?: number | null
          accuracy_meters?: number | null
          distance_to_center_meters?: number | null
          is_inside_geofence?: boolean
          logged_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string | null
          inspection_id?: string
          specialist_id?: string
          property_id?: string
          latitude?: number
          longitude?: number
          speed_meters_per_sec?: number | null
          accuracy_meters?: number | null
          distance_to_center_meters?: number | null
          is_inside_geofence?: boolean
          logged_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inspection_geo_logs_tenant_id_fkey'
            columns: ['tenant_id']
            isOneToOne: false
            referencedRelation: 'tenants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inspection_geo_logs_inspection_id_fkey'
            columns: ['inspection_id']
            isOneToOne: false
            referencedRelation: 'inspections'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inspection_geo_logs_specialist_id_fkey'
            columns: ['specialist_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inspection_geo_logs_property_id_fkey'
            columns: ['property_id']
            isOneToOne: false
            referencedRelation: 'properties'
            referencedColumns: ['id']
          },
        ]
      }
      specialist_knowledge_base: {
        Row: {
          id: string
          category: string
          question: string
          content: string
          keywords: string[]
          embedding: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: string
          question: string
          content: string
          keywords?: string[]
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: string
          question?: string
          content?: string
          keywords?: string[]
          embedding?: number[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      match_knowledge_base: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          category: string
          question: string
          content: string
          similarity: number
        }[]
      }
    }
  }
}
