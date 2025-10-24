import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BalanceDebugger = () => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const timestamp = Date.now();
      
      // Get fresh data from API
      const [userRes, balanceRes, transactionsRes] = await Promise.all([
        axios.get(`${API}/users/me?t=${timestamp}`, {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }
        }),
        axios.get(`${API}/users/balance?t=${timestamp}`, {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }
        }),
        axios.get(`${API}/transactions/history?t=${timestamp}`, {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }
        })
      ]);

      const user = userRes.data;
      const apiBalance = balanceRes.data.coins;
      const transactions = transactionsRes.data;

      // Calculate expected balance from transactions
      let calculatedBalance = 0;
      transactions.forEach(tx => {
        if (tx.type === 'recharge') {
          calculatedBalance += tx.amount;
        } else if (tx.type === 'deduction') {
          calculatedBalance -= tx.amount;
        }
      });

      setDebugInfo({
        user,
        apiBalance,
        calculatedBalance,
        transactions,
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Debug error:', error);
      setDebugInfo({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-2 border-yellow-400 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="w-5 h-5" />
          Balance Debugger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={runDiagnostic}
          disabled={loading}
          className="mb-4 bg-yellow-600 hover:bg-yellow-700"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Balance Diagnostic
            </>
          )}
        </Button>

        {debugInfo && (
          <div className="space-y-4">
            {debugInfo.error ? (
              <div className="text-red-600">Error: {debugInfo.error}</div>
            ) : (
              <>
                <div className="p-4 bg-white rounded-lg border border-gray-300">
                  <h3 className="font-bold mb-2">User Info</h3>
                  <p><strong>Email:</strong> {debugInfo.user.email}</p>
                  <p><strong>Name:</strong> {debugInfo.user.name}</p>
                  <p><strong>Checked at:</strong> {debugInfo.timestamp}</p>
                </div>

                <div className="p-4 bg-white rounded-lg border border-gray-300">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Balance Information
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    API Balance: {debugInfo.apiBalance} coins
                  </p>
                  <p className="text-lg text-gray-700">
                    Calculated from Transactions: {debugInfo.calculatedBalance} coins
                  </p>
                  {debugInfo.apiBalance !== debugInfo.calculatedBalance && (
                    <p className="text-red-600 font-bold mt-2">
                      ⚠️ Mismatch detected! Difference: {debugInfo.apiBalance - debugInfo.calculatedBalance} coins
                    </p>
                  )}
                </div>

                <div className="p-4 bg-white rounded-lg border border-gray-300 max-h-[300px] overflow-y-auto">
                  <h3 className="font-bold mb-2">Recent Transactions ({debugInfo.transactions.length})</h3>
                  {debugInfo.transactions.slice(0, 10).map((tx, idx) => (
                    <div key={idx} className="text-sm py-1 border-b">
                      <span className={tx.type === 'recharge' ? 'text-green-600' : 'text-red-600'}>
                        {tx.type === 'recharge' ? '+' : '-'}{tx.amount}
                      </span>
                      {' '}- {tx.description}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceDebugger;
