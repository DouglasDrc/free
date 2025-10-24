import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TransactionHistory = ({ open, onOpenChange }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTransactions();
    }
  }, [open]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/transactions/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    if (type === 'recharge') {
      return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
    } else if (type === 'deduction') {
      return <ArrowDownCircle className="w-5 h-5 text-red-500" />;
    } else if (type === 'earning') {
      return <ArrowUpCircle className="w-5 h-5 text-blue-500" />;
    }
    return <RefreshCw className="w-5 h-5 text-gray-500" />;
  };

  const getTransactionColor = (type) => {
    if (type === 'recharge' || type === 'earning') {
      return 'text-green-600';
    } else if (type === 'deduction') {
      return 'text-red-600';
    }
    return 'text-gray-600';
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            Transaction History
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchTransactions}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 pr-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {getTransactionIcon(tx.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 capitalize">
                        {tx.type}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-lg font-bold ${getTransactionColor(tx.type)}`}>
                      {tx.type === 'deduction' ? '-' : '+'}
                      {tx.amount}
                    </p>
                    <p className="text-xs text-gray-500">coins</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionHistory;
