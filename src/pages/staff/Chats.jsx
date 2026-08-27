import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Send, MessageSquare } from 'lucide-react';
import { io } from 'socket.io-client';
import { authenticatedFetch, API_BASE } from '../../lib/api';

const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '');

export default function StaffChats() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'active'
  const [pendingChats, setPendingChats] = useState([]);
  const [myChats, setMyChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (selectedChat && selectedChat.status === 'active') {
      const newSocket = io(SOCKET_URL, { auth: { token: localStorage.getItem('token') } });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSocket(newSocket);
      newSocket.on('connect_error', (err) => console.error('Chat connection failed:', err.message));
      newSocket.emit('join_chat', selectedChat.id);
      
      newSocket.on('receive_message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });

      return () => newSocket.disconnect();
    }
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchPendingChats = async () => {
    try {
      const res = await authenticatedFetch('/chat/staff/pending');
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setPendingChats(data.data);
      } else {
        console.error("Fetch pending failed:", data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchMyChats = async () => {
    try {
      const res = await authenticatedFetch('/chat/staff/active');
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setMyChats(data.data);
      } else {
        console.error("Fetch active failed:", data);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingChats();
    fetchMyChats();
  }, []);

  const selectChat = async (chat) => {
    setSelectedChat(chat);
    try {
      const res = await authenticatedFetch(`/chat/session/${chat.id}`);
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (err) { console.error(err); }
  };

  const acceptChat = async (chatId) => {
    try {
      const res = await authenticatedFetch(`/chat/staff/accept/${chatId}`, { method: 'POST' });
      if (!res) return;
      const data = await res.json();
      if (data.success) {
        fetchPendingChats();
        fetchMyChats();
        setActiveTab('active');
        setSelectedChat(null);
      } else {
        alert(data.error);
        fetchPendingChats();
      }
    } catch (err) { console.error(err); }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socket || !selectedChat) return;

    socket.emit('send_message', {
      chatId: selectedChat.id,
      text: inputMsg
    });
    setInputMsg('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Support Desk</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <div className="flex border-b border-gray-100 dark:border-white/10">
            <button 
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pending' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({pendingChats.length})
            </button>
            <button 
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              onClick={() => setActiveTab('active')}
            >
              My Chats ({myChats.length})
            </button>
          </div>
          <CardContent className="p-4 space-y-2 h-[600px] overflow-y-auto">
            {activeTab === 'pending' ? (
              pendingChats.length === 0 ? (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">No pending chats.</p>
              ) : (
                pendingChats.map(chat => (
                  <div key={chat.id} className="p-3 border rounded-lg border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{chat.guestName}</span>
                      <Badge variant="destructive">Pending</Badge>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">{chat.type}</div>
                    <Button size="sm" className="w-full" onClick={() => acceptChat(chat.id)}>Accept Chat</Button>
                  </div>
                ))
              )
            ) : (
              myChats.length === 0 ? (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">You have no active chats.</p>
              ) : (
                myChats.map(chat => (
                  <div key={chat.id} onClick={() => selectChat(chat)}
                       className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 dark:border-indigo-500' : 'border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">{chat.guestName}</span>
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{chat.type}</div>
                  </div>
                ))
              )
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Chat {selectedChat ? `with ${selectedChat.guestName}` : ''}</CardTitle>
          </CardHeader>
          <CardContent className="h-[600px] flex flex-col p-0 bg-gray-50 dark:bg-[#180E1D] rounded-b-xl overflow-hidden relative">
            {!selectedChat || selectedChat.status !== 'active' ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-6 text-center">
                <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                <p>{activeTab === 'pending' ? 'Accept a chat from the Pending tab to start messaging' : 'Select an active chat'}</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col max-w-[80%] ${msg.senderType === 'staff' ? 'self-end items-end' : 'self-start items-start'}`}>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">{msg.senderName}</span>
                      <div className={`p-3 rounded-2xl ${msg.senderType === 'staff' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-[#24162E] dark:text-gray-100 border border-gray-200 dark:border-white/10'}`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 bg-white dark:bg-[#1A1021] border-t border-gray-100 dark:border-white/10">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input 
                      value={inputMsg}
                      onChange={e => setInputMsg(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button type="submit" size="icon"><Send className="h-4 w-4" /></Button>
                  </form>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
