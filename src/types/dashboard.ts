export type ChartType = 'line' | 'bar' | 'pie' | 'kpi' | 'table'

export interface Dashboard {
  id: string
  name: string
  slug: string
  description?: string
  layout_config?: object
  is_public: boolean
  public_token: string | null
  public_token_expires_at: string | null
  created_at: string
  updated_at: string
  charts?: Chart[]
}

export interface Chart {
  id: string
  dashboard_id: string
  title: string
  subtitle?: string
  chart_type: ChartType
  query_config: QueryConfig
  display_config: DisplayConfig
  position_x: number
  position_y: number
  width: number
  height: number
  created_at: string
  updated_at: string
}

export interface QueryConfig {
  sql?: string
  table?: string
  select?: string
  filters?: { column: string; operator: string; value: any }[]
  date_column?: string
  group_by?: string
  order_by?: string
  limit?: number
}

export interface DisplayConfig {
  echarts_option?: object
  color_palette?: string[]
  show_legend?: boolean
  show_grid?: boolean
  value_prefix?: string
  value_suffix?: string
  format?: 'percent' | 'currency' | 'number'
  currency?: 'MXN' | 'USD'
  x_axis?: string
  y_axis?: string
  color?: string
}

export interface AuditEntry {
  action: string
  entity_type: string
  metadata: object
  created_at: string
  user_id: string
}
