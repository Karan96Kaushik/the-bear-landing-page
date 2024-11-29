import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GeneralTable from './GeneralTable';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { fetchAuthorizedData } from '../api/api';

ChartJS.register(ArcElement, Tooltip, Legend);

// Define fields for GeneralTable
const orderFields = [
    { key: 'tradingsymbol', label: 'Symbol' },
    { key: 'transaction_type', label: 'Type' },
    { key: 'initiated_by', label: 'Initiator' },
    { key: 'source', label: 'Source' },
    { key: 'quantity', label: 'Quantity' },
    { 
        key: 'price', 
        label: 'Price',
        render: (_, order) => order.average_price || order.trigger_price || order.price
    },
    { 
        key: 'timestamp', 
        label: 'Timestamp',
        render: (timestamp) => new Date(timestamp).toLocaleString()
    }
];

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [stats, setStats] = useState([]);
    // const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        symbol: '',
        action: '',
        status: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [tradeAnalysis, setTradeAnalysis] = useState(null);

    const uniqueSymbols = [...new Set(orders.map(order => order.tradingsymbol))];
    const uniqueActions = [...new Set(orders.map(order => order.action))];
    const uniqueStatuses = [...new Set(orders.map(order => order.bear_status))];

    const fetchOrders = async () => {
        try {
            const params = new URLSearchParams({
                page,
                limit: 50,
                ...filters
            });
            
            const response = await fetchAuthorizedData(`/db-orders/retrospective?${params}`);
            setOrders(response);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const params = new URLSearchParams({
                date: filters.date
            });
            const response = await fetchAuthorizedData(`/db-orders/stats?${params}`);
            setStats(response);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchTradeAnalysis = async () => {
        try {
            const response = await fetchAuthorizedData(`/db-orders/trade-analysis?date=${filters.date}`);
            setTradeAnalysis(response);
        } catch (error) {
            console.error('Error fetching trade analysis:', error);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            await Promise.all([fetchOrders(), fetchStats(), fetchTradeAnalysis()]);
        };
        loadData();
    }, [page, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPage(1);
    };

    // Prepare chart data
    const chartData = {
        labels: stats?.map(stat => stat._id || 'Unknown'),
        datasets: [{
            data: stats?.map(stat => stat.count),
            backgroundColor: [
                'rgba(255, 99, 132, 0.8)',
                'rgba(54, 162, 235, 0.8)',
                'rgba(255, 206, 86, 0.8)',
                'rgba(75, 192, 192, 0.8)',
            ],
            borderWidth: 1
        }]
    };

    console.log(chartData, stats);

    // if (loading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto pt-20 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold">Order Status Distribution</h3>
                    </div>
                    <div className="p-4">
                        <div className="h-[300px] flex items-center justify-center">
                            <Pie data={chartData} options={{ maintainAspectRatio: false }} />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold">Status Counts</h3>
                    </div>
                    <div className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                            {stats?.map((stat) => (
                                <div key={stat._id} className="text-center p-4 bg-gray-50 rounded">
                                    <h3 className="font-semibold">{stat._id || 'Unknown'}</h3>
                                    <p className="text-2xl font-bold">{stat.count}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mb-4">
                <input
                    type="date"
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    name="date"
                    value={filters.date}
                    onChange={handleFilterChange}
                />
                <input
                    type="text"
                    list="symbols"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Filter by symbol"
                    name="symbol"
                    value={filters.symbol}
                    onChange={handleFilterChange}
                />
                <datalist id="symbols">
                    {uniqueSymbols.map(symbol => (
                        <option key={symbol} value={symbol} />
                    ))}
                </datalist>

                <input
                    type="text"
                    list="statuses"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Filter by status"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                />
                <datalist id="statuses">
                    {uniqueStatuses.map(status => (
                        <option key={status} value={status} />
                    ))}
                </datalist>
            </div>
            



            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {tradeAnalysis && (
                    <>
                        <div className="bg-white rounded-lg md:col-span-1 shadow-md p-4">
                            <h3 className="text-lg font-semibold mb-4">Trade Summary</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Total Trades</p>
                                    <p className="text-xl font-bold">{tradeAnalysis.summary.totalTrades}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Win Rate</p>
                                    <p className="text-xl font-bold">{tradeAnalysis.summary.winRate}%</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Realised P&L</p>
                                    <p className={`text-xl font-bold ${tradeAnalysis.summary.realisedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₹{tradeAnalysis.summary.realisedPnL}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Open Trades</p>
                                    <p className="text-xl font-bold">{tradeAnalysis.summary.openTrades}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Total P&L</p>
                                    <p className={`text-xl font-bold ${tradeAnalysis.summary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₹{tradeAnalysis.summary.totalPnL}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Zaire Trades</p>
                                    <p className="text-xl font-bold">{tradeAnalysis.summary.zaireTrades}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Zaire P&L</p>
                                    <p className={`text-xl font-bold ${tradeAnalysis.summary.zairePnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        ₹{tradeAnalysis.summary.zairePnL}
                                    </p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Zaire Win Rate</p>
                                    <p className="text-xl font-bold">{tradeAnalysis.summary.zaireWinRate}%</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Zaire Target Exits</p>
                                    <p className="text-xl font-bold">{tradeAnalysis.summary.zaireTargetExits}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Zaire Stop Loss Exits</p>
                                    <p className="text-xl font-bold">{tradeAnalysis.summary.zaireStopLossExits}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-600">Zaire Other Exits</p>
                                    <p className="text-xl font-bold">{tradeAnalysis.summary.zaireOtherExits}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg md:col-span-2 shadow-md p-4">
                            <h3 className="text-lg font-semibold mb-4">Trade Details</h3>
                            <div className="overflow-auto max-h-[500px]">
                                <table className="min-w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2">Symbol</th>
                                            <th className="px-4 py-2">Direction</th>
                                            <th className="px-4 py-2">Source</th>
                                            <th className="px-4 py-2">Exit Reason</th>
                                            <th className="px-4 py-2">Status</th>
                                            <th className="px-4 py-2">P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tradeAnalysis.trades.map((trade, index) => (
                                            <tr key={index} className="border-t">
                                                <td className="px-4 py-2">{trade.symbol}</td>
                                                <td className="px-4 py-2">{trade.direction}</td>
                                                <td className="px-4 py-2">{trade.source}</td>
                                                <td className="px-4 py-2">{trade.exitReason}</td>
                                                <td className="px-4 py-2">{trade.status}</td>
                                                <td className={`px-4 py-2 ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    ₹{trade.pnl}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>


            <div className="bg-gray-200 text-gray-800 mt-4">
                <GeneralTable 
                    data={orders} 
                    fields={orderFields} 
                />
            </div>

            <div className="flex justify-center gap-2 mt-4">
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>

        </div>
    );
} 