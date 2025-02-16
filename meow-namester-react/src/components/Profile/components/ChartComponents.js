import { Bar, Line, Pie, Radar } from 'react-chartjs-2';
import styles from '../Profile.module.css';

// Create individual chart components
export const BarChart = ({ data, options }) => <Bar data={data} options={options} />;
export const LineChart = ({ data, options }) => <Line data={data} options={options} />;
export const PieChart = ({ data, options }) => <Pie data={data} options={options} />;
export const RadarChart = ({ data, options }) => <Radar data={data} options={options} />;

export const chartToggles = [
  { key: 'ratingComparison', label: 'Rating Comparison' },
  { key: 'winLossRatio', label: 'Win/Loss Ratio' },
  { key: 'ratingDistribution', label: 'Rating Distribution' }
]; 