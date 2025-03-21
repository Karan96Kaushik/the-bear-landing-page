import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { fetchAuthorizedData } from '../api/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function Dashboard() {
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7))); // Default: 7 days ago
    const [endDate, setEndDate] = useState(new Date()); // Default: today
    const [tradeSource, setTradeSource] = useState('all'); // Options: 'all', 'bailey', 'zaire', 'manual'
    const [tradeType, setTradeType] = useState('all'); // Options: 'all', 'bullish', 'bearish'
    const [dailyStats, setDailyStats] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDailyStats = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0],
                source: tradeSource,
                type: tradeType,
            });
            const response = await fetchAuthorizedData(`/db-orders/daily-stats?${params}`);
            setDailyStats(response);
        } catch (error) {
            console.error('Error fetching daily stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDailyStats();
    }, [startDate, endDate, tradeSource, tradeType]);

    // Prepare data for Order Count Bar Chart
    const orderCountChartData = {
        labels: dailyStats.map(stat => stat.date),
        datasets: [
            {
                label: 'Order Count',
                data: dailyStats.map(stat => stat.orderCount),
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    // Prepare data for P&L Bar Chart
    const pnlChartData = {
        labels: dailyStats.map(stat => stat.date),
        datasets: [
            {
                label: 'P&L',
                data: dailyStats.map(stat => stat.pnl),
                backgroundColor: dailyStats.map(stat => (stat.pnl >= 0 ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)')),
                borderColor: dailyStats.map(stat => (stat.pnl >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)')),
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Chart.js Bar Chart',
            },
        },
    };

    const handleDateChange = (dates) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
    };

    const handleTradeSourceChange = (e) => {
        setTradeSource(e.target.value);
    };

    const handleTradeTypeChange = (e) => {
        setTradeType(e.target.value);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto pt-20 p-4">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

            <div className="flex gap-4 mb-6 items-center">
                <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={handleDateChange}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={tradeSource}
                    onChange={handleTradeSourceChange}
                >
                    <option value="all">All Sources</option>
                    <option value="bailey">Bailey</option>
                    <option value="zaire">Zaire</option>
                    <option value="manual">Manual</option>
                </select>
                <select
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={tradeType}
                    onChange={handleTradeTypeChange}
                >
                    <option value="all">All Types</option>
                    <option value="bullish">Bullish</option>
                    <option value="bearish">Bearish</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold mb-4">Daily Order Count</h3>
                    <div className="h-[300px]">
                        <Bar data={orderCountChartData} options={options} />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4">
                    <h3 className="text-lg font-semibold mb-4">Daily P&L</h3>
                    <div className="h-[300px]">
                        <Bar data={pnlChartData} options={options} />
                    </div>
                </div>
            </div>
            {dailyStats.length === 0 && (
                <div className="mt-4 text-center">
                    <p>No data available for the selected filters.</p>
                </div>
            )}
        </div>
    );
}
