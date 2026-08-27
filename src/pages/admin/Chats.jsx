import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { MessageSquare, Eye } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { authenticatedFetch } from '../../lib/api';

export default function AdminChats() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await authenticatedFetch('/chat/admin/all');
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setChats(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const viewChat = async (chat) => {
    setSelectedChat(chat);
    try {
      const res = await authenticatedFetch(`/chat/session/${chat.id}`);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-10 bg-transparent min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-center sm:text-left gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Support Inbox</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Review and monitor customer interactions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Chat List */}
        <Card className="lg:col-span-1 shadow-sm border border-gray-200/60 rounded-2xl bg-white flex flex-col overflow-hidden">
          <CardHeader className="p-5 border-b border-gray-100 bg-gray-50/50">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center justify-between">
              Active Conversations
              <Badge variant="secondary" className="bg-white border-gray-200 text-xs shadow-sm">
                {chats.length} Total
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto flex-1 divide-y divide-gray-50 no-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 space-y-3">
                <div className="animate-spin h-5 w-5 border-2 border-rose-500 border-t-transparent rounded-full" />
                <p className="text-xs font-semibold text-gray-400">Loading inbox...</p>
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <MessageSquare className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm font-medium">No conversations found.</p>
              </div>
            ) : (
              chats.map(chat => {
                const isSelected = selectedChat?.id === chat.id;
                const initials = chat.guestName?.substring(0, 2).toUpperCase() || 'GU';
                return (
                  <div 
                    key={chat.id} 
                    onClick={() => viewChat(chat)} 
                    className={`p-4 cursor-pointer transition-all border-l-4 ${
                      isSelected 
                        ? 'border-rose-500 bg-rose-50/30' 
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border ${
                        isSelected ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-white text-gray-600 border-gray-200'
                      }`}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm truncate text-gray-900">{chat.guestName}</span>
                          <span className="text-[10px] font-semibold text-gray-400">
                            {new Date(chat.createdAt?._seconds * 1000 || chat.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs font-medium text-gray-500 truncate pr-2 flex items-center gap-1.5">
                            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 uppercase ${chat.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : chat.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                              {chat.status}
                            </Badge>
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{chat.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Chat Thread */}
        <Card className="lg:col-span-2 shadow-sm border border-gray-200/60 rounded-2xl bg-white flex flex-col overflow-hidden relative">
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
              <div className="h-20 w-20 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                <MessageSquare className="h-8 w-8 text-gray-300" />
              </div>
              <p className="font-semibold text-gray-500">Select a conversation to view history</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 text-xs font-bold">
                    {selectedChat.guestName?.substring(0, 2).toUpperCase() || 'GU'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-none">{selectedChat.guestName}</h3>
                    <p className="text-[10px] font-semibold text-gray-400 mt-1 uppercase tracking-wider">
                      Chat ID: {selectedChat.id.substring(0,8)}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={`uppercase text-[10px] font-bold shadow-sm ${selectedChat.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {selectedChat.status}
                </Badge>
              </div>

              {/* Thread Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FDFBF7]">
                {messages.length === 0 ? (
                   <p className="text-center text-gray-400 text-xs font-bold mt-10">No messages in this thread.</p>
                ) : (
                  <div className="flex flex-col space-y-4">
                    {messages.map((msg, idx) => {
                      const isUser = msg.senderType === 'user';
                      return (
                        <div key={idx} className={`flex flex-col max-w-[75%] ${isUser ? 'self-start items-start' : 'self-end items-end'}`}>
                          <span className="text-[10px] font-bold text-gray-400 mb-1.5 px-1 uppercase tracking-wider">
                            {msg.senderName}
                          </span>
                          <div className={`p-3.5 shadow-sm text-sm font-medium ${
                            isUser 
                              ? 'bg-white border border-gray-200 text-gray-700 rounded-2xl rounded-tl-sm' 
                              : 'bg-gradient-to-br from-gray-800 to-black text-white rounded-2xl rounded-tr-sm'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
