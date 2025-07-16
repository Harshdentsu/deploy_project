export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      claim: {
        Row: {
          amount: number
          approved_amount: number | null
          claim_date: string
          claim_id: number
          dealer_id: number
          product_id: string
          reason: string | null
          resolved_date: string | null
          status: string
        }
        Insert: {
          amount: number
          approved_amount?: number | null
          claim_date: string
          claim_id?: number
          dealer_id: number
          product_id: string
          reason?: string | null
          resolved_date?: string | null
          status: string
        }
        Update: {
          amount?: number
          approved_amount?: number | null
          claim_date?: string
          claim_id?: number
          dealer_id?: number
          product_id?: string
          reason?: string | null
          resolved_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "claim_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealer"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "claim_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "user_dealer_view"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "claim_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "claim_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["product_id"]
          },
        ]
      }
      conversation_logs: {
        Row: {
          ai_response: string | null
          created_at: string | null
          dealer_id: number | null
          log_id: number
          metadata: Json | null
          query_timestamp: string | null
          query_type: string | null
          session_id: string | null
          user_id: number | null
          user_query: string
        }
        Insert: {
          ai_response?: string | null
          created_at?: string | null
          dealer_id?: number | null
          log_id?: number
          metadata?: Json | null
          query_timestamp?: string | null
          query_type?: string | null
          session_id?: string | null
          user_id?: number | null
          user_query: string
        }
        Update: {
          ai_response?: string | null
          created_at?: string | null
          dealer_id?: number | null
          log_id?: number
          metadata?: Json | null
          query_timestamp?: string | null
          query_type?: string | null
          session_id?: string | null
          user_id?: number | null
          user_query?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_logs_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealer"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "conversation_logs_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "user_dealer_view"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "conversation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dealer_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "conversation_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dealer: {
        Row: {
          dealer_id: number
          name: string
        }
        Insert: {
          dealer_id?: number
          name: string
        }
        Update: {
          dealer_id?: number
          name?: string
        }
        Relationships: []
      }
      email_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          product_id: string
          quantity: number
          warehouse_id: number
        }
        Insert: {
          product_id: string
          quantity: number
          warehouse_id: number
        }
        Update: {
          product_id?: string
          quantity?: number
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse"
            referencedColumns: ["warehouse_id"]
          },
        ]
      }
      orders: {
        Row: {
          dealer_id: number | null
          order_date: string | null
          order_id: number
          product_id: string | null
          quantity: number
          sales_rep_id: number | null
          total_cost: number | null
          unit_price: number | null
          warehouse_id: number | null
        }
        Insert: {
          dealer_id?: number | null
          order_date?: string | null
          order_id?: number
          product_id?: string | null
          quantity: number
          sales_rep_id?: number | null
          total_cost?: number | null
          unit_price?: number | null
          warehouse_id?: number | null
        }
        Update: {
          dealer_id?: number | null
          order_date?: string | null
          order_id?: number
          product_id?: string | null
          quantity?: number
          sales_rep_id?: number | null
          total_cost?: number | null
          unit_price?: number | null
          warehouse_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealer"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "orders_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "user_dealer_view"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "orders_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "user_dealer_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse"
            referencedColumns: ["warehouse_id"]
          },
        ]
      }
      product: {
        Row: {
          aspect_ratio: number
          category: string
          construction_type: string
          price: number
          product_id: string
          product_name: string
          rim_diameter_inch: number
          section_width: number
        }
        Insert: {
          aspect_ratio: number
          category: string
          construction_type: string
          price: number
          product_id: string
          product_name: string
          rim_diameter_inch: number
          section_width: number
        }
        Update: {
          aspect_ratio?: number
          category?: string
          construction_type?: string
          price?: number
          product_id?: string
          product_name?: string
          rim_diameter_inch?: number
          section_width?: number
        }
        Relationships: []
      }
      sales: {
        Row: {
          cost: number
          date: string
          dealer_id: number
          product_id: string
          quantity: number
          sales_id: number
          warehouse_id: number
        }
        Insert: {
          cost: number
          date: string
          dealer_id: number
          product_id: string
          quantity: number
          sales_id: number
          warehouse_id: number
        }
        Update: {
          cost?: number
          date?: string
          dealer_id?: number
          product_id?: string
          quantity?: number
          sales_id?: number
          warehouse_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealer"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "sales_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "user_dealer_view"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sales_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sales_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse"
            referencedColumns: ["warehouse_id"]
          },
        ]
      }
      users: {
        Row: {
          dealer_id: number | null
          email: string
          password: string
          role: string
          user_id: number
          username: string
        }
        Insert: {
          dealer_id?: number | null
          email: string
          password: string
          role: string
          user_id?: number
          username: string
        }
        Update: {
          dealer_id?: number | null
          email?: string
          password?: string
          role?: string
          user_id?: number
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealer"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "users_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "user_dealer_view"
            referencedColumns: ["dealer_id"]
          },
        ]
      }
      vector_store: {
        Row: {
          description: string
          embedding: string
          id: number
          metadata: Json | null
          table_join: string
        }
        Insert: {
          description: string
          embedding: string
          id?: number
          metadata?: Json | null
          table_join: string
        }
        Update: {
          description?: string
          embedding?: string
          id?: number
          metadata?: Json | null
          table_join?: string
        }
        Relationships: []
      }
      warehouse: {
        Row: {
          location: string
          warehouse_id: number
          zone: string
        }
        Insert: {
          location: string
          warehouse_id?: number
          zone: string
        }
        Update: {
          location?: string
          warehouse_id?: number
          zone?: string
        }
        Relationships: []
      }
    }
    Views: {
      claim_dealer_view: {
        Row: {
          amount: number | null
          approved_amount: number | null
          claim_date: string | null
          claim_id: number | null
          dealer_id: number | null
          dealer_name: string | null
          product_id: string | null
          reason: string | null
          resolved_date: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealer"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "claim_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "user_dealer_view"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "claim_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "claim_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["product_id"]
          },
        ]
      }
      inventory_view: {
        Row: {
          aspect_ratio: number | null
          category: string | null
          construction_type: string | null
          location: string | null
          price: number | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          rim_diameter_inch: number | null
          section_width: number | null
          warehouse_id: number | null
          zone: string | null
        }
        Relationships: []
      }
      sales_dealer_product_warehouse_view: {
        Row: {
          aspect_ratio: number | null
          category: string | null
          construction_type: string | null
          cost: number | null
          date: string | null
          dealer_id: number | null
          dealer_name: string | null
          product_id: string | null
          product_name: string | null
          product_price: number | null
          quantity: number | null
          rim_diameter_inch: number | null
          sales_id: number | null
          section_width: number | null
          warehouse_id: number | null
          warehouse_location: string | null
          warehouse_zone: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "dealer"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "sales_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "user_dealer_view"
            referencedColumns: ["dealer_id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sales_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "inventory_view"
            referencedColumns: ["warehouse_id"]
          },
          {
            foreignKeyName: "sales_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouse"
            referencedColumns: ["warehouse_id"]
          },
        ]
      }
      user_dealer_view: {
        Row: {
          dealer_id: number | null
          dealer_name: string | null
          email: string | null
          role: string | null
          user_id: number | null
          username: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
