import React, { useState, useEffect } from 'react';
import { fetchAuthorizedData } from '../api/api';
import { 
    Chart as ChartJS, 
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        source: 'all',
        direction: 'all'
    });
    const [availableSources, setAvailableSources] = useState([]);
    const [availableDirections, setAvailableDirections] = useState([]);

    useEffect(() => {
        fetchAnalytics();
    }, [filters]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams(filters);
            const response = await fetchAuthorizedData(`/db-orders/date-range-analytics?${params}`);
            
            setAnalytics(response);
            
            // Set available filters from the response
            if (response.summary) {
                if (response.summary.sources) {
                    setAvailableSources(['all', ...response.summary.sources]);
                }
                if (response.summary.directions) {
                    setAvailableDirections(['all', ...response.summary.directions]);
                }
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Replace the existing lineChartData preparation with this stacked bar chart data
    let stackedBarChartData = {
        labels: [],
        datasets: []
    };
    
    if (analytics && analytics.pairedTrades) {
        // Group trades by date and source
        const dateSourceGroups = {};
        
        analytics.pairedTrades.forEach(trade => {
            const date = new Date(trade.entryTime).toISOString().split('T')[0];
            if (!dateSourceGroups[date]) {
                dateSourceGroups[date] = {
                    zaire: 0,
                    bailey: 0,
                    sheet: 0  // for manual trades
                };
            }
            
            const source = trade.source || 'unknown';
            if (source === 'zaire') {
                dateSourceGroups[date].zaire += trade.pnl;
            } else if (source === 'bailey') {
                dateSourceGroups[date].bailey += trade.pnl;
            } else if (source === 'sheet') {
                dateSourceGroups[date].sheet += trade.pnl;
            }
        });
        
        const sortedDates = Object.keys(dateSourceGroups).sort();
        
        stackedBarChartData = {
            labels: sortedDates,
            datasets: [
                {
                    label: 'Zaire',
                    data: sortedDates.map(date => parseFloat(dateSourceGroups[date].zaire.toFixed(2))),
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    stack: 'Stack 0',
                },
                {
                    label: 'Manual',
                    data: sortedDates.map(date => parseFloat(dateSourceGroups[date].sheet.toFixed(2))),
                    backgroundColor: 'rgba(255, 157, 0, 0.7)',
                    stack: 'Stack 0',
                },
                {
                    label: 'Bailey',
                    data: sortedDates.map(date => parseFloat(dateSourceGroups[date].bailey.toFixed(2))),
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    stack: 'Stack 0',
                },
            ]
        };
    } else if (analytics && analytics.dailyData) {
        // Fallback to use dailyData if pairedTrades isn't available
        // Group dailyData by date and source
        const dateGroups = {};
        const sources = new Set();
        
        analytics.dailyData.forEach(item => {
            const date = item._id.date;
            const source = item._id.source;
            
            sources.add(source);
            
            if (!dateGroups[date]) {
                dateGroups[date] = {};
            }
            
            dateGroups[date][source] = item.totalPnL;
        });
        
        const sortedDates = Object.keys(dateGroups).sort();
        const sourcesArray = Array.from(sources);
        
        // Create a dataset for each source
        const datasets = sourcesArray.map(source => ({
            label: source === 'all' ? 'All Sources' : source,
            data: sortedDates.map(date => dateGroups[date][source] || 0),
            backgroundColor: source === 'zaire' ? 'rgba(54, 162, 235, 0.7)' : 
                            source === 'bailey' ? 'rgba(75, 192, 192, 0.7)' : 
                            source === 'sheet' ? 'rgba(153, 102, 255, 0.7)' : 'rgba(255, 159, 64, 0.7)',
            stack: 'Stack 0',
        }));
        
        stackedBarChartData = {
            labels: sortedDates,
            datasets: datasets
        };
    }

    // Replace the existing barChartData preparation with this multi-line chart data
    let orderCountLineChartData = {
        labels: [],
        datasets: []
    };
    
    if (analytics && analytics.pairedTrades) {
        // Group trades by date and source
        const dateSourceGroups = {};
        const sources = new Set();
        
        analytics.pairedTrades.forEach(trade => {
            const date = new Date(trade.entryTime).toISOString().split('T')[0];
            const source = trade.source || 'unknown';
            
            sources.add(source);
            
            if (!dateSourceGroups[date]) {
                dateSourceGroups[date] = {};
            }
            
            if (!dateSourceGroups[date][source]) {
                dateSourceGroups[date][source] = 0;
            }
            
            dateSourceGroups[date][source]++;
        });
        
        const sortedDates = Object.keys(dateSourceGroups).sort();
        const sourcesArray = Array.from(sources);
        
        // Color mapping for different sources
        const colorMap = {
            'zaire': {
                border: 'rgb(54, 162, 235)',
                background: 'rgba(54, 162, 235, 0.2)'
            },
            'bailey': {
                border: 'rgb(75, 192, 192)',
                background: 'rgba(75, 192, 192, 0.2)'
            },
            'sheet': {
                border: 'rgb(153, 102, 255)',
                background: 'rgba(153, 102, 255, 0.2)'
            },
            'unknown': {
                border: 'rgb(255, 159, 64)',
                background: 'rgba(255, 159, 64, 0.2)'
            }
        };
        
        // Create a dataset for each source
        const datasets = sourcesArray.map(source => ({
            label: source === 'sheet' ? 'Manual' : source.charAt(0).toUpperCase() + source.slice(1),
            data: sortedDates.map(date => dateSourceGroups[date][source] || 0),
            borderColor: colorMap[source]?.border || 'rgb(255, 99, 132)',
            backgroundColor: colorMap[source]?.background || 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 3,
            pointHoverRadius: 5
        }));
        
        // Add a total line
        datasets.push({
            label: 'Total',
            data: sortedDates.map(date => {
                return Object.values(dateSourceGroups[date]).reduce((sum, count) => sum + count, 0);
            }),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderWidth: 3,
            borderDash: [5, 5],
            tension: 0.2,
            pointRadius: 3,
            pointHoverRadius: 5
        });
        
        orderCountLineChartData = {
            labels: sortedDates,
            datasets: datasets
        };
    } else if (analytics && analytics.dailyData) {
        // Fallback to use dailyData if pairedTrades isn't available
        const dateSourceGroups = {};
        const sources = new Set();
        
        analytics.dailyData.forEach(item => {
            const date = item._id.date;
            const source = item._id.source;
            
            sources.add(source);
            
            if (!dateSourceGroups[date]) {
                dateSourceGroups[date] = {};
            }
            
            dateSourceGroups[date][source] = item.totalOrders;
        });
        
        const sortedDates = Object.keys(dateSourceGroups).sort();
        const sourcesArray = Array.from(sources);
        
        // Color mapping for different sources
        const colorMap = {
            'zaire': {
                border: 'rgb(54, 162, 235)',
                background: 'rgba(54, 162, 235, 0.2)'
            },
            'bailey': {
                border: 'rgb(75, 192, 192)',
                background: 'rgba(75, 192, 192, 0.2)'
            },
            'sheet': {
                border: 'rgb(153, 102, 255)',
                background: 'rgba(153, 102, 255, 0.2)'
            },
            'all': {
                border: 'rgb(255, 99, 132)',
                background: 'rgba(255, 99, 132, 0.2)'
            }
        };
        
        // Create a dataset for each source
        const datasets = sourcesArray.map(source => ({
            label: source === 'all' ? 'All Sources' : 
                   source === 'sheet' ? 'Manual' : 
                   source.charAt(0).toUpperCase() + source.slice(1),
            data: sortedDates.map(date => dateSourceGroups[date][source] || 0),
            borderColor: colorMap[source]?.border || 'rgb(255, 99, 132)',
            backgroundColor: colorMap[source]?.background || 'rgba(255, 99, 132, 0.2)',
            borderWidth: 2,
            tension: 0.2,
            pointRadius: 3,
            pointHoverRadius: 5
        }));
        
        orderCountLineChartData = {
            labels: sortedDates,
            datasets: datasets
        };
    }

    // Initialize both chart data variables
    let lineChartData = {
        labels: [],
        datasets: []
    };

    let barChartData = {
        labels: [],
        datasets: []
    };

    if (analytics && analytics.dailyData) {
        // Group by date for the charts
        const dateGroups = {};
        
        analytics.dailyData.forEach(item => {
            const date = item._id.date;
            if (!dateGroups[date]) {
                dateGroups[date] = {
                    totalPnL: 0,
                    totalOrders: 0
                };
            }
            dateGroups[date].totalPnL += item.totalPnL;
            dateGroups[date].totalOrders += item.totalOrders;
        });
        
        const sortedDates = Object.keys(dateGroups).sort();
        
        // Create lineChartData for the P&L chart
        lineChartData = {
            labels: sortedDates,
            datasets: [
                {
                    label: 'Daily P&L',
                    data: sortedDates.map(date => dateGroups[date].totalPnL),
                    borderColor: 'rgb(53, 162, 235)',
                    backgroundColor: 'rgba(53, 162, 235, 0.5)',
                    tension: 0.2
                }
            ]
        };
        
        // Convert barChartData to a line chart format
        barChartData = {
            labels: sortedDates,
            datasets: [
                {
                    label: 'Daily Order Count',
                    data: sortedDates.map(date => dateGroups[date].totalOrders),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.2,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(75, 192, 192)'
                }
            ]
        };
    }

    // Initialize the pie chart data correctly
    let pieChartData = {
        labels: ['Winning Trades', 'Losing Trades'],
        datasets: [{
            data: [0, 0],
            backgroundColor: ['#45c6ed', '#f53b60'],
            borderWidth: 1
        }]
    };

    // Then later in your code, update the data if analytics exists
    if (analytics && analytics.summary) {
        pieChartData.datasets[0].data = [
            analytics.summary.winCount || 0,
            analytics.summary.lossCount || 0
        ];
    }

    return (
        <div className="container mx-auto pt-20 p-4">
            <h1 className="text-2xl font-bold mb-6">Trading Dashboard</h1>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                        <select
                            name="source"
                            value={filters.source}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {availableSources.map(source => (
                                <option key={source} value={source}>
                                    {source === 'all' ? 'All Sources' : source}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                        <select
                            name="direction"
                            value={filters.direction}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {availableDirections.map(direction => (
                                <option key={direction} value={direction}>
                                    {direction === 'all' ? 'All Directions' : direction}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* Summary Stats */}
                    {analytics?.summary && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-sm text-gray-500">Total P&L</h3>
                                <p className={`text-2xl font-bold ${analytics.summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹{analytics.summary.totalPnL.toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-sm text-gray-500">Win Rate</h3>
                                <p className="text-2xl font-bold text-blue-600">
                                    {analytics.summary.winRate?.toFixed(2)}%
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-sm text-gray-500">Total Trades</h3>
                                <p className="text-2xl font-bold">
                                    {analytics.summary.totalOrders}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-md">
                                <h3 className="text-sm text-gray-500">Average P&L per Trade</h3>
                                <p className={`text-2xl font-bold ${analytics.summary.avgPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ₹{analytics.summary.avgPnL?.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h2 className="text-lg font-semibold mb-4">Daily P&L by Source</h2>
                            <div className="h-80">
                                <Bar 
                                    data={stackedBarChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            x: {
                                                stacked: true,
                                            },
                                            y: {
                                                stacked: true,
                                                beginAtZero: false,
                                            }
                                        },
                                        plugins: {
                                            tooltip: {
                                                callbacks: {
                                                    label: function(context) {
                                                        const value = context.raw;
                                                        return `${context.dataset.label}: ₹${value.toFixed(2)}`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h2 className="text-lg font-semibold mb-4">Daily Order Count</h2>
                            <div className="h-80">
                                <Line 
                                    data={barChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: {
                                                beginAtZero: true,
                                                title: {
                                                    display: true,
                                                    text: 'Number of Orders'
                                                }
                                            }
                                        },
                                        plugins: {
                                            tooltip: {
                                                callbacks: {
                                                    label: function(context) {
                                                        return `Orders: ${context.raw}`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h2 className="text-lg font-semibold mb-4">Win/Loss Distribution</h2>
                            <div className="h-80 flex items-center justify-center">
                                <Pie 
                                    data={pieChartData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                    }}
                                />
                            </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg shadow-md">
                            <h2 className="text-lg font-semibold mb-4">Source Performance</h2>
                            {analytics?.dailyData && (
                                <div className="overflow-auto max-h-80">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direction</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade Count</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {Object.entries(
                                                analytics.dailyData.reduce((acc, item) => {
                                                    const key = `${item._id.source || 'unknown'}-${item._id.direction || 'unknown'}`;
                                                    if (!acc[key]) {
                                                        acc[key] = {
                                                            source: item._id.source || 'unknown',
                                                            direction: item._id.direction || 'unknown',
                                                            totalOrders: 0,
                                                            totalPnL: 0,
                                                            winCount: 0,
                                                            lossCount: 0
                                                        };
                                                    }
                                                    acc[key].totalOrders += item.totalOrders;
                                                    acc[key].totalPnL += item.totalPnL;
                                                    acc[key].winCount += item.winCount;
                                                    acc[key].lossCount += item.lossCount;
                                                    return acc;
                                                }, {})
                                            ).map(([key, data]) => (
                                                <tr key={key}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm uppercase">{data.source}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{data.direction}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{data.totalOrders}</td>
                                                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${data.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        ₹{data.totalPnL.toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {((data.winCount / (data.winCount + data.lossCount)) * 100 || 0).toFixed(2)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Dashboard; 