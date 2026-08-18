export type UserRole = 'admin' | 'inspector'
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type ItemStatus = 'pass' | 'fail' | 'na'
export type ScheduleEntry = { ordinal: number; weekday: number }

export interface Database {
  public: {
    Tables: {
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
        }
        Relationships: []
      }
      checklist_templates: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
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
        }
        Relationships: []
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
