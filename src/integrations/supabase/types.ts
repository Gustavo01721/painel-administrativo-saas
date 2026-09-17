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
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          key_hash: string
          name: string | null
          store_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_hash: string
          name?: string | null
          store_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key_hash?: string
          name?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_loja: {
        Row: {
          auto_aniversario: boolean | null
          auto_inativos: boolean | null
          auto_whatsapp: boolean | null
          bot_mensagens: boolean
          endereco: string | null
          id: string
          loja: string
          loja_aberta: boolean | null
          meta_faturamento: number | null
          responsavel: string
          store_id: string | null
          taxa_entrega: number | null
          telefone: string | null
          whatsapp_motoboy: string | null
          tempo_preparo: number | null
          updated_at: string | null
          webhook_retorno: string | null
        }
        Insert: {
          auto_aniversario?: boolean | null
          auto_inativos?: boolean | null
          auto_whatsapp?: boolean | null
          bot_mensagens?: boolean
          endereco?: string | null
          id?: string
          loja: string
          loja_aberta?: boolean | null
          meta_faturamento?: number | null
          responsavel: string
          store_id?: string | null
          taxa_entrega?: number | null
          telefone?: string | null
          whatsapp_motoboy?: string | null
          tempo_preparo?: number | null
          updated_at?: string | null
          webhook_retorno?: string | null
        }
        Update: {
          auto_aniversario?: boolean | null
          auto_inativos?: boolean | null
          auto_whatsapp?: boolean | null
          bot_mensagens?: boolean
          endereco?: string | null
          id?: string
          loja?: string
          loja_aberta?: boolean | null
          meta_faturamento?: number | null
          responsavel?: string
          store_id?: string | null
          taxa_entrega?: number | null
          telefone?: string | null
          whatsapp_motoboy?: string | null
          tempo_preparo?: number | null
          updated_at?: string | null
          webhook_retorno?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_loja_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque: {
        Row: {
          id: string
          nome: string
          categoria: string
          unidade: string
          quantidade_atual: number
          quantidade_minima: number
          custo_unitario: number
          preco_pacote: number | null
          quantidade_por_pacote: number | null
          unidade_pacote: string | null
          fornecedor: string | null
          ultimo_preco_pacote: number | null
          store_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          nome: string
          categoria?: string
          unidade?: string
          quantidade_atual?: number
          quantidade_minima?: number
          custo_unitario?: number
          preco_pacote?: number | null
          quantidade_por_pacote?: number | null
          unidade_pacote?: string | null
          fornecedor?: string | null
          ultimo_preco_pacote?: number | null
          store_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          nome?: string
          categoria?: string
          unidade?: string
          quantidade_atual?: number
          quantidade_minima?: number
          custo_unitario?: number
          preco_pacote?: number | null
          quantidade_por_pacote?: number | null
          unidade_pacote?: string | null
          fornecedor?: string | null
          ultimo_preco_pacote?: number | null
          store_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      receita_itens: {
        Row: {
          id: string
          menu_item_id: string | null
          estoque_id: string | null
          quantidade_necessaria: number
          store_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          menu_item_id?: string | null
          estoque_id?: string | null
          quantidade_necessaria?: number
          store_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          menu_item_id?: string | null
          estoque_id?: string | null
          quantidade_necessaria?: number
          store_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receita_itens_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receita_itens_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receita_itens_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      estoque_movimentacoes: {
        Row: {
          id: string
          estoque_id: string | null
          tipo: string
          quantidade: number
          motivo: string | null
          responsavel: string | null
          observacao: string | null
          store_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          estoque_id?: string | null
          tipo?: string
          quantidade: number
          motivo?: string | null
          responsavel?: string | null
          observacao?: string | null
          store_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          estoque_id?: string | null
          tipo?: string
          quantidade?: number
          motivo?: string | null
          responsavel?: string | null
          observacao?: string | null
          store_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estoque_movimentacoes_estoque_id_fkey"
            columns: ["estoque_id"]
            isOneToOne: false
            referencedRelation: "estoque"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estoque_movimentacoes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          id: string
          nome: string
          telefone: string | null
          email: string | null
          endereco: string | null
          cpf: string | null
          data_nascimento: string | null
          observacoes: string | null
          origem: string | null
          tier: string | null
          total_pedidos: number | null
          total_gasto: number | null
          ultimo_pedido: string | null
          created_at: string | null
          updated_at: string | null
          store_id: string | null
        }
        Insert: {
          id?: string
          nome: string
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          cpf?: string | null
          data_nascimento?: string | null
          observacoes?: string | null
          origem?: string | null
          tier?: string | null
          total_pedidos?: number | null
          total_gasto?: number | null
          ultimo_pedido?: string | null
          created_at?: string | null
          updated_at?: string | null
          store_id?: string | null
        }
        Update: {
          id?: string
          nome?: string
          telefone?: string | null
          email?: string | null
          endereco?: string | null
          cpf?: string | null
          data_nascimento?: string | null
          observacoes?: string | null
          origem?: string | null
          tier?: string | null
          total_pedidos?: number | null
          total_gasto?: number | null
          ultimo_pedido?: string | null
          created_at?: string | null
          updated_at?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      atendente_sessoes: {
        Row: {
          id: string
          atendente_nome: string
          atendente_id: string
          status: string | null
          pedidos_atendidos: number | null
          store_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          atendente_nome: string
          atendente_id: string
          status?: string | null
          pedidos_atendidos?: number | null
          store_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          atendente_nome?: string
          atendente_id?: string
          status?: string | null
          pedidos_atendidos?: number | null
          store_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendente_sessoes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      cupons: {
        Row: {
          ativo: boolean | null
          banner_path: string | null
          banner_url: string | null
          brinde: string | null
          brinde_item_id: string | null
          canal: string | null
          codigo: string
          created_at: string | null
          cumulativo: boolean | null
          desconto_concedido: number | null
          descricao: string | null
          dias: number[] | null
          dias_semana: number[] | null
          fim: string | null
          frete_gratis: boolean | null
          id: string
          inicio: string | null
          limite_por_cliente: number | null
          limite_total: number | null
          minimo: number | null
          posicao: string | null
          receita_gerada: number | null
          store_id: string | null
          tipo: string
          total_minimo_zero: boolean | null
          updated_at: string | null
          usos: number | null
          valor: number | null
        }
        Insert: {
          ativo?: boolean | null
          banner_path?: string | null
          banner_url?: string | null
          brinde?: string | null
          brinde_item_id?: string | null
          canal?: string | null
          codigo: string
          created_at?: string | null
          cumulativo?: boolean | null
          desconto_concedido?: number | null
          descricao?: string | null
          dias?: number[] | null
          dias_semana?: number[] | null
          fim?: string | null
          frete_gratis?: boolean | null
          id?: string
          inicio?: string | null
          limite_por_cliente?: number | null
          limite_total?: number | null
          minimo?: number | null
          posicao?: string | null
          receita_gerada?: number | null
          store_id?: string | null
          tipo: string
          total_minimo_zero?: boolean | null
          updated_at?: string | null
          usos?: number | null
          valor?: number | null
        }
        Update: {
          ativo?: boolean | null
          banner_path?: string | null
          banner_url?: string | null
          brinde?: string | null
          brinde_item_id?: string | null
          canal?: string | null
          codigo?: string
          created_at?: string | null
          cumulativo?: boolean | null
          desconto_concedido?: number | null
          descricao?: string | null
          dias?: number[] | null
          dias_semana?: number[] | null
          fim?: string | null
          frete_gratis?: boolean | null
          id?: string
          inicio?: string | null
          limite_por_cliente?: number | null
          limite_total?: number | null
          minimo?: number | null
          posicao?: string | null
          receita_gerada?: number | null
          store_id?: string | null
          tipo?: string
          total_minimo_zero?: boolean | null
          updated_at?: string | null
          usos?: number | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cupons_brinde_item_id_fkey"
            columns: ["brinde_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string | null
          id: string
          idempotency_key: string
          pedido_id: string | null
          store_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          idempotency_key: string
          pedido_id?: string | null
          store_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          idempotency_key?: string
          pedido_id?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idempotency_keys_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idempotency_keys_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          ativo: boolean
          categoria: string
          created_at: string | null
          custo: number
          id: string
          nome: string
          preco: number
          store_id: string
          updated_at: string | null
          vendas: number
        }
        Insert: {
          ativo?: boolean
          categoria: string
          created_at?: string | null
          custo?: number
          id?: string
          nome: string
          preco: number
          store_id: string
          updated_at?: string | null
          vendas?: number
        }
        Update: {
          ativo?: boolean
          categoria?: string
          created_at?: string | null
          custo?: number
          id?: string
          nome?: string
          preco?: number
          store_id?: string
          updated_at?: string | null
          vendas?: number
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          canal: string | null
          cliente: string
          cliente_id: string | null
          created_at: string | null
          cupom_codigo: string | null
          desconto: number | null
          endereco: string | null
          id: string
          itens: Json | null
          numero: string
          observacao: string | null
          origem: string | null
          pagamento: string | null
          status: string | null
          store_id: string | null
          subtotal: number | null
          taxa_entrega: number | null
          telefone: string | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          canal?: string | null
          cliente: string
          cliente_id?: string | null
          created_at?: string | null
          cupom_codigo?: string | null
          desconto?: number | null
          endereco?: string | null
          id?: string
          itens?: Json | null
          numero: string
          observacao?: string | null
          origem?: string | null
          pagamento?: string | null
          status?: string | null
          store_id?: string | null
          subtotal?: number | null
          taxa_entrega?: number | null
          telefone?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          canal?: string | null
          cliente?: string
          cliente_id?: string | null
          created_at?: string | null
          cupom_codigo?: string | null
          desconto?: number | null
          endereco?: string | null
          id?: string
          itens?: Json | null
          numero?: string
          observacao?: string | null
          origem?: string | null
          pagamento?: string | null
          status?: string | null
          store_id?: string | null
          subtotal?: number | null
          taxa_entrega?: number | null
          telefone?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          id: string
          key: string
          last_refill: string
          store_id: string
          tokens: number
        }
        Insert: {
          id?: string
          key: string
          last_refill?: string
          store_id: string
          tokens?: number
        }
        Update: {
          id?: string
          key?: string
          last_refill?: string
          store_id?: string
          tokens?: number
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          store_id: string
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          store_id: string
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          erro: string | null
          evento: string
          id: string
          payload: Json | null
          pedido_id: string | null
          status: string
          store_id: string | null
        }
        Insert: {
          created_at?: string | null
          erro?: string | null
          evento: string
          id?: string
          payload?: Json | null
          pedido_id?: string | null
          status: string
          store_id?: string | null
        }
        Update: {
          created_at?: string | null
          erro?: string | null
          evento?: string
          id?: string
          payload?: Json | null
          pedido_id?: string | null
          status?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_key: string
          p_limit?: number
          p_refill_rate?: number
          p_store_id: string
        }
        Returns: boolean
      }
      create_order_v2:
        | {
            Args: {
              p_canal: string
              p_cliente: string
              p_cupom_codigo: string
              p_endereco: string
              p_idempotency_key: string
              p_itens: Json
              p_numero: string
              p_observacao: string
              p_origem: string
              p_pagamento: string
              p_store_id: string
              p_telefone: string
              p_webhook_payload?: Json
            }
            Returns: Json
          }
        | {
            Args: {
              p_canal: string
              p_cliente: string
              p_cupom_codigo: string
              p_desconto: number
              p_endereco: string
              p_idempotency_key: string
              p_itens: Json
              p_numero: string
              p_observacao: string
              p_origem: string
              p_pagamento: string
              p_store_id: string
              p_subtotal: number
              p_taxa_entrega: number
              p_telefone: string
              p_total: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_canal: string
              p_cliente: string
              p_cupom_codigo: string
              p_desconto: number
              p_endereco: string
              p_idempotency_key: string
              p_itens: Json
              p_numero: string
              p_observacao: string
              p_origem: string
              p_pagamento: string
              p_store_id: string
              p_subtotal: number
              p_taxa_entrega: number
              p_telefone: string
              p_total: number
              p_webhook_payload?: Json
            }
            Returns: Json
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _store_id?: string
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "manager" | "operator"
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
      app_role: ["owner", "manager", "operator"],
    },
  },
} as const
