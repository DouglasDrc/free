import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Video, LogOut, Menu, X, Wallet, HelpCircle, MessageCircle, User as UserIcon, History } from 'lucide-react';

const MobileNav = ({ user, balance, onLogout, showRecharge, onRechargeClick, onEditProfile, onViewTransactions }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold">MindConnect</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                <UserIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
              </div>
            )}
            
            <Button onClick={() => navigate('/faq')} variant="ghost" size="sm">
              <HelpCircle className="w-4 h-4 mr-2" />
              FAQ
            </Button>
            <Button onClick={() => navigate('/support')} variant="ghost" size="sm">
              <MessageCircle className="w-4 h-4 mr-2" />
              Support
            </Button>
            
            {balance !== undefined && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg">
                <Wallet className="w-5 h-5" />
                <div className="text-right">
                  <p className="text-xs opacity-80">Coins</p>
                  <p className="text-sm font-bold">{balance}</p>
                </div>
              </div>
            )}
            
            {showRecharge && onRechargeClick && (
              <Button onClick={onRechargeClick} size="sm" className="bg-green-600 hover:bg-green-700">
                <Wallet className="w-4 h-4 mr-2" />
                Recharge
              </Button>
            )}
            
            {onEditProfile && (
              <Button onClick={onEditProfile} variant="outline" size="sm">
                <UserIcon className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
            
            {onViewTransactions && (
              <Button onClick={onViewTransactions} variant="outline" size="sm">
                <History className="w-4 h-4 mr-2" />
                Transactions
              </Button>
            )}
            
            <Button onClick={onLogout} variant="destructive" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4 animate-slide-down">
            <div className="flex flex-col space-y-3">
              {user && (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className="w-4 h-4 text-gray-600" />
                    <span className="font-semibold text-gray-800">{user.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  {user.phone && <p className="text-sm text-gray-600">{user.phone}</p>}
                </div>
              )}
              
              {balance !== undefined && (
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    <span className="font-semibold">My Coins</span>
                  </div>
                  <span className="text-xl font-bold">{balance}</span>
                </div>
              )}
              
              {onEditProfile && (
                <Button 
                  onClick={() => {
                    onEditProfile();
                    setIsOpen(false);
                  }} 
                  variant="outline"
                  className="w-full justify-start"
                >
                  <UserIcon className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
              
              {onViewTransactions && (
                <Button 
                  onClick={() => {
                    onViewTransactions();
                    setIsOpen(false);
                  }} 
                  variant="outline"
                  className="w-full justify-start"
                >
                  <History className="w-4 h-4 mr-2" />
                  Transaction History
                </Button>
              )}
              
              {showRecharge && onRechargeClick && (
                <Button 
                  onClick={() => {
                    onRechargeClick();
                    setIsOpen(false);
                  }} 
                  className="w-full bg-green-600 hover:bg-green-700 justify-start"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Recharge Wallet
                </Button>
              )}
              
              <Button 
                onClick={() => {
                  navigate('/faq');
                  setIsOpen(false);
                }} 
                variant="ghost" 
                className="w-full justify-start"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                FAQ
              </Button>
              
              <Button 
                onClick={() => {
                  navigate('/support');
                  setIsOpen(false);
                }} 
                variant="ghost" 
                className="w-full justify-start"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Support
              </Button>
              
              <Button 
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }} 
                variant="destructive" 
                className="w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default MobileNav;
