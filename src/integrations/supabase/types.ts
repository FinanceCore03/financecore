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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      Assinaturas: {
        Row: {
          categoria: string | null
          data_compra: string | null
          data_expiracao: string | null
          descricao: string | null
          dia_cobranca: string | null
          id: number
          id_usuario: number | null
          metodo_pagamento: string | null
          nome: string | null
          status: boolean | null
          valor: string | null
        }
        Insert: {
          categoria?: string | null
          data_compra?: string | null
          data_expiracao?: string | null
          descricao?: string | null
          dia_cobranca?: string | null
          id?: number
          id_usuario?: number | null
          metodo_pagamento?: string | null
          nome?: string | null
          status?: boolean | null
          valor?: string | null
        }
        Update: {
          categoria?: string | null
          data_compra?: string | null
          data_expiracao?: string | null
          descricao?: string | null
          dia_cobranca?: string | null
          id?: number
          id_usuario?: number | null
          metodo_pagamento?: string | null
          nome?: string | null
          status?: boolean | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Assinaturas_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "Usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      Opcoes: {
        Row: {
          id: number
          id_usuario: number | null
          Nome: string | null
          Padrao: boolean | null
          Tipo: string | null
          Uso: string | null
        }
        Insert: {
          id?: number
          id_usuario?: number | null
          Nome?: string | null
          Padrao?: boolean | null
          Tipo?: string | null
          Uso?: string | null
        }
        Update: {
          id?: number
          id_usuario?: number | null
          Nome?: string | null
          Padrao?: boolean | null
          Tipo?: string | null
          Uso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Opcoes_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "Usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      Planejamento: {
        Row: {
          Categoria: string | null
          created_at: string
          id: number
          id_usuario: number | null
          Período: string | null
          Valor: string | null
          Visivel: boolean | null
        }
        Insert: {
          Categoria?: string | null
          created_at?: string
          id?: number
          id_usuario?: number | null
          Período?: string | null
          Valor?: string | null
          Visivel?: boolean | null
        }
        Update: {
          Categoria?: string | null
          created_at?: string
          id?: number
          id_usuario?: number | null
          Período?: string | null
          Valor?: string | null
          Visivel?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "Planejamento_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "Usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      Transacoes: {
        Row: {
          categoria: string | null
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: number
          id_usuario: number | null
          Juros: string | null
          metodo_pagamento: string | null
          tipo: string | null
          valor: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: number
          id_usuario?: number | null
          Juros?: string | null
          metodo_pagamento?: string | null
          tipo?: string | null
          valor?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: number
          id_usuario?: number | null
          Juros?: string | null
          metodo_pagamento?: string | null
          tipo?: string | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Transacoes_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "Usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      Transacoes_Credito: {
        Row: {
          categoria: string | null
          created_at: string
          data_vencimento: string | null
          descricao: string | null
          id: number
          id_transacao: number | null
          id_usuario: number | null
          metodo_pagamento: string | null
          numero_parcela: number | null
          tipo: string | null
          valor: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          id?: number
          id_transacao?: number | null
          id_usuario?: number | null
          metodo_pagamento?: string | null
          numero_parcela?: number | null
          tipo?: string | null
          valor?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          id?: number
          id_transacao?: number | null
          id_usuario?: number | null
          metodo_pagamento?: string | null
          numero_parcela?: number | null
          tipo?: string | null
          valor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Transacoes_Credito_id_transacao_fkey"
            columns: ["id_transacao"]
            isOneToOne: false
            referencedRelation: "Transacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Transacoes_Credito_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "Usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      Usuarios: {
        Row: {
          Dia_otimo: string | null
          Dia_vencimento: string | null
          Email: string | null
          id: number
          id_auth: string | null
          Moeda: string | null
          Nome: string | null
        }
        Insert: {
          Dia_otimo?: string | null
          Dia_vencimento?: string | null
          Email?: string | null
          id?: number
          id_auth?: string | null
          Moeda?: string | null
          Nome?: string | null
        }
        Update: {
          Dia_otimo?: string | null
          Dia_vencimento?: string | null
          Email?: string | null
          id?: number
          id_auth?: string | null
          Moeda?: string | null
          Nome?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
