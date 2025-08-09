'use client';

import { useState, useTransition, useOptimistic } from 'react';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status: 'sending' | 'sent' | 'failed';
};

// Bot reply simulation
async function sendMessageToBot(message: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
  
  if (Math.random() < 0.15) {
    throw new Error('Message failed to send!');
  }
  
  const responses = [
    'Hello! How can I help you?',
    'That is a very interesting question!',
    'I understand, please continue...',
    'Great! Do you have another question?',
    'I can provide more details on this.',
    'Optimistic updates are really useful!',
    'Next.js 19 introduced great features.',
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

export default function OptimisticChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I am your AI assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
      status: 'sent'
    }
  ]);
  
  const [newMessage, setNewMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // Optimistic messages state
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state: Message[], newMessage: Message) => [...state, newMessage]
  );

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };
    
    const messageText = newMessage;
    
    // 1. Kullanıcı mesajını anında göster
    addOptimisticMessage(userMessage);
    setNewMessage('');
    
    // 2. Server'a gönder ve bot yanıtını al
    startTransition(async () => {
      try {
        // Kullanıcı mesajını gerçek state'e ekle
        const sentUserMessage = { ...userMessage, status: 'sent' as const };
        setMessages(prev => [...prev, sentUserMessage]);
        
        // Bot yanıtını al
        const botResponse = await sendMessageToBot(messageText);
        
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          text: botResponse,
          sender: 'bot',
          timestamp: new Date(),
          status: 'sent'
        };
        
        setMessages(prev => [...prev, botMessage]);
        
      } catch (error) {
        console.error('Mesaj gönderme hatası:', error);
        
        // Hata durumunda kullanıcı mesajını failed olarak işaretle
        setMessages(prev => prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'failed' as const }
            : msg
        ));
      }
    });
  };

  const retryMessage = (messageId: string) => {
    const failedMessage = messages.find(msg => msg.id === messageId);
    if (!failedMessage) return;
    
    // Failed mesajı tekrar sending yap
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: 'sending' as const }
        : msg
    ));
    
    startTransition(async () => {
      try {
        const botResponse = await sendMessageToBot(failedMessage.text);
        
        // Başarılı olursa mesajı sent yap ve bot yanıtı ekle
        setMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'sent' as const }
              : msg
          );
          
          return [...updated, {
            id: `bot-${Date.now()}`,
            text: botResponse,
            sender: 'bot' as const,
            timestamp: new Date(),
            status: 'sent' as const
          }];
        });
        
      } catch (error) {
        // Yine hata olursa failed durumuna geri dön
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'failed' as const }
            : msg
        ));
      }
    });
  };

  return (
    <div className="max-w-md mx-auto border rounded-lg overflow-hidden">
      <div className="bg-blue-500 text-white p-4">
        <h2 className="text-lg font-semibold">Optimistic Chat</h2>
        <p className="text-sm opacity-90">Instant message sending</p>
      </div>
      
      {/* Mesaj Listesi */}
      <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {optimisticMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-xs px-4 py-2 rounded-lg relative
                ${message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border'
                }
                ${message.status === 'sending' ? 'opacity-70' : ''}
                ${message.status === 'failed' ? 'bg-red-100 border-red-300' : ''}
              `}
            >
              <p className="text-sm">{message.text}</p>
              
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs opacity-75">
                  {message.timestamp.toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                
                <div className="flex items-center space-x-1">
                  {message.status === 'sending' && (
                    <span className="text-xs animate-pulse">📤</span>
                  )}
                  
                  {message.status === 'sent' && message.sender === 'user' && (
                    <span className="text-xs">✓</span>
                  )}
                  
                  {message.status === 'failed' && (
                    <button
                      onClick={() => retryMessage(message.id)}
                      className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      🔄 Tekrar dene
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Bot yazıyor göstergesi */}
        {isPending && optimisticMessages[optimisticMessages.length - 1]?.sender === 'user' && (
          <div className="flex justify-start">
            <div className="bg-white border px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-xs text-gray-500">Bot is typing...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Mesaj Gönderme */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📤
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2 text-center">
          💡 Messages appear instantly. Bot reply loads in the background.
        </p>
      </div>
    </div>
  );
}
