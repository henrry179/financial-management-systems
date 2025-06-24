export interface DashboardProps {
  data: any[];
  title?: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: number;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'gauge' | 'map';
  title: string;
  data: any[];
  config?: any;
}

export interface BIStyle {
  id: string;
  name: string;
  category: 'international' | 'domestic';
  description: string;
  features: string[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

export const BI_STYLES: BIStyle[] = [
  {
    id: 'tableau',
    name: 'Tableau Style',
    category: 'international',
    description: '采用Tableau经典的蓝白配色方案，注重数据的清晰展示和交互体验',
    features: ['交互式图表', '动态筛选', '智能推荐', '拖拽式操作'],
    colors: {
      primary: '#1f77b4',
      secondary: '#ff7f0e',
      accent: '#2ca02c',
      background: '#ffffff',
      text: '#333333'
    }
  },
  {
    id: 'powerbi',
    name: 'Power BI Style',
    category: 'international',
    description: '采用Microsoft Power BI的现代化设计语言，注重商业智能分析',
    features: ['实时数据', '自然语言查询', 'AI洞察', '协作共享'],
    colors: {
      primary: '#f2c811',
      secondary: '#323130',
      accent: '#106ebe',
      background: '#faf9f8',
      text: '#323130'
    }
  },
  {
    id: 'fanruan',
    name: '帆软BI Style',
    category: 'domestic',
    description: '采用帆软FineBI的企业级设计风格，符合国内用户使用习惯',
    features: ['中文友好', '企业级权限', '移动端适配', '本地化服务'],
    colors: {
      primary: '#409eff',
      secondary: '#67c23a',
      accent: '#e6a23c',
      background: '#f5f7fa',
      text: '#303133'
    }
  },
  {
    id: 'guanyuan',
    name: '观远BI Style',
    category: 'domestic',
    description: '采用观远数据的智能分析设计理念，注重业务场景的深度结合',
    features: ['智能预警', '业务标签', '移动决策', '行业模板'],
    colors: {
      primary: '#722ed1',
      secondary: '#13c2c2',
      accent: '#fa8c16',
      background: '#ffffff',
      text: '#262626'
    }
  }
]; 