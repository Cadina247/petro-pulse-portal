export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      credit_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          description: string | null
          id: string
          kind: string
          owner_id: string
          wallet_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          owner_id: string
          wallet_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          owner_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_personnel: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string
          station_id: string
          vehicle_info: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          phone: string
          station_id: string
          vehicle_info?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string
          station_id?: string
          vehicle_info?: string | null
        }
        Relationships: []
      }
      ev_bookings: {
        Row: {
          amount: number
          booking_date: string
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          duration_minutes: number
          id: string
          notes: string | null
          owner_id: string
          payment_status: string
          port_id: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          booking_date?: string
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          owner_id: string
          payment_status?: string
          port_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_date?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          owner_id?: string
          payment_status?: string
          port_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ev_bookings_port_id_fkey"
            columns: ["port_id"]
            isOneToOne: false
            referencedRelation: "ev_ports"
            referencedColumns: ["id"]
          },
        ]
      }
      ev_ports: {
        Row: {
          charging_type: string
          connector_type: string
          created_at: string
          currency: string
          id: string
          is_available: boolean
          maintenance_status: string
          operating_hours: string | null
          owner_id: string
          port_code: string
          power_kw: number
          price_per_kwh: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          charging_type?: string
          connector_type?: string
          created_at?: string
          currency?: string
          id?: string
          is_available?: boolean
          maintenance_status?: string
          operating_hours?: string | null
          owner_id: string
          port_code: string
          power_kw?: number
          price_per_kwh?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          charging_type?: string
          connector_type?: string
          created_at?: string
          currency?: string
          id?: string
          is_available?: boolean
          maintenance_status?: string
          operating_hours?: string | null
          owner_id?: string
          port_code?: string
          power_kw?: number
          price_per_kwh?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      fuel_products: {
        Row: {
          capacity: number
          created_at: string
          currency: string
          id: string
          is_available: boolean
          last_updated_at: string
          price: number
          product_name: string
          quantity_available: number
          sort_order: number
          station_id: string
          unit: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          currency?: string
          id?: string
          is_available?: boolean
          last_updated_at?: string
          price?: number
          product_name: string
          quantity_available?: number
          sort_order?: number
          station_id: string
          unit?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          currency?: string
          id?: string
          is_available?: boolean
          last_updated_at?: string
          price?: number
          product_name?: string
          quantity_available?: number
          sort_order?: number
          station_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_products_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_stock_movements: {
        Row: {
          created_at: string
          id: string
          kind: string
          note: string | null
          product_id: string | null
          product_name: string
          quantity: number
          station_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          product_id?: string | null
          product_name: string
          quantity?: number
          station_id: string
          unit?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          note?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          station_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "fuel_products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          assigned_personnel_id: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          delivery_address: string | null
          fulfillment_type: string
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          order_number: number | null
          payment_status: string
          product_name: string
          quantity: number
          station_id: string
          status: string
          total_amount: number
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          assigned_personnel_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_address?: string | null
          fulfillment_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          order_number?: number | null
          payment_status?: string
          product_name: string
          quantity?: number
          station_id: string
          status?: string
          total_amount?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          assigned_personnel_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_address?: string | null
          fulfillment_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          order_number?: number | null
          payment_status?: string
          product_name?: string
          quantity?: number
          station_id?: string
          status?: string
          total_amount?: number
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          account_type: string
          category: string
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          is_free: boolean
          name: string
          owner_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          account_type?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          is_free?: boolean
          name: string
          owner_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          account_type?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          is_free?: boolean
          name?: string
          owner_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      stations: {
        Row: {
          address: string | null
          business_document_url: string | null
          created_at: string
          email: string | null
          id: string
          is_available: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          nin: string | null
          owner_name: string | null
          phone: string | null
          station_name: string
          supporting_document_note: string | null
          supporting_document_url: string | null
          updated_at: string
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          address?: string | null
          business_document_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_available?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nin?: string | null
          owner_name?: string | null
          phone?: string | null
          station_name: string
          supporting_document_note?: string | null
          supporting_document_url?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          address?: string | null
          business_document_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_available?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nin?: string | null
          owner_name?: string | null
          phone?: string | null
          station_name?: string
          supporting_document_note?: string | null
          supporting_document_url?: string | null
          updated_at?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      tokens: {
        Row: {
          code: string
          created_at: string
          currency: string
          id: string
          redeemed_at: string | null
          station_id: string | null
          status: Database["public"]["Enums"]["token_status"]
          updated_at: string
          value_cents: number
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          id?: string
          redeemed_at?: string | null
          station_id?: string | null
          status?: Database["public"]["Enums"]["token_status"]
          updated_at?: string
          value_cents: number
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          id?: string
          redeemed_at?: string | null
          station_id?: string | null
          status?: Database["public"]["Enums"]["token_status"]
          updated_at?: string
          value_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "tokens_station_id_fkey"
            columns: ["station_id"]
            isOneToOne: false
            referencedRelation: "stations"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          business_document_url: string | null
          business_name: string
          created_at: string
          delivery_available: boolean
          email: string | null
          estimated_quantity: string | null
          id: string
          is_available: boolean
          latitude: number | null
          longitude: number | null
          nin: string | null
          owner_name: string | null
          phone: string | null
          products_sold: string[]
          supporting_document_note: string | null
          supporting_document_url: string | null
          updated_at: string
          user_id: string
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          address?: string | null
          business_document_url?: string | null
          business_name: string
          created_at?: string
          delivery_available?: boolean
          email?: string | null
          estimated_quantity?: string | null
          id?: string
          is_available?: boolean
          latitude?: number | null
          longitude?: number | null
          nin?: string | null
          owner_name?: string | null
          phone?: string | null
          products_sold?: string[]
          supporting_document_note?: string | null
          supporting_document_url?: string | null
          updated_at?: string
          user_id: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          address?: string | null
          business_document_url?: string | null
          business_name?: string
          created_at?: string
          delivery_available?: boolean
          email?: string | null
          estimated_quantity?: string | null
          id?: string
          is_available?: boolean
          latitude?: number | null
          longitude?: number | null
          nin?: string | null
          owner_name?: string | null
          phone?: string | null
          products_sold?: string[]
          supporting_document_note?: string | null
          supporting_document_url?: string | null
          updated_at?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          account_type: string
          balance_cents: number
          created_at: string
          currency: string
          id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          account_type?: string
          balance_cents?: number
          created_at?: string
          currency?: string
          id?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          account_type?: string
          balance_cents?: number
          created_at?: string
          currency?: string
          id?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_wallet: {
        Args: { _owner: string; _type: string }
        Returns: undefined
      }
      get_station_profile: { Args: { _station_id: string }; Returns: Json }
      has_credit: { Args: { _owner: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      list_public_stations: {
        Args: never
        Returns: {
          address: string
          created_at: string
          id: string
          is_available: boolean
          latitude: number
          logo_url: string
          longitude: number
          station_name: string
          updated_at: string
        }[]
      }
      list_public_vendors: {
        Args: never
        Returns: {
          address: string
          business_name: string
          created_at: string
          delivery_available: boolean
          estimated_quantity: string
          id: string
          is_available: boolean
          latitude: number
          longitude: number
          products_sold: string[]
        }[]
      }
      seed_default_services: {
        Args: { _owner: string; _type: string }
        Returns: undefined
      }
      seed_fuel_products: { Args: { _station_id: string }; Returns: undefined }
    }
    Enums: {
      token_status: "issued" | "redeemed" | "void"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      token_status: ["issued", "redeemed", "void"],
    },
  },
} as const
