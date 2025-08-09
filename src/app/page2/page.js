"use client"
import React, { startTransition, useRef, useState,useOptimistic } from 'react'

function Page2() {
  const [messages, setMessages] = useState([
    {
      text: 'Hello, this is a message',
      sending: false,
    }]
  )


  const setMessageAction = async (formdata) => {
    const sendMessage = new Promise((resolve, reject) => {
      setTimeout(() => {
        // %30 ihtimalle hata ver
        if (Math.random() < 0.9) {
          reject(new Error('Message could not be sent! Server error.'));
        } else {
          resolve('Message sent');
        }
      }, 2000);
    });
    
    try {
      const result = await sendMessage;
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: formdata.get('message'),
          sending: false,
        },
      ]);
    } catch (error) {
      // Hata durumunda console'a log at
      console.error('Message send error:', error.message);
      // Hata durumunda optimistic state otomatik olarak geri alınır
      throw error; // Re-throw for UI handling
    }
  }
  return (
    <>
      <Thread messages={messages} sendMessageAction={setMessageAction} />
    </>
  )
}

export default Page2

const Thread = ({ messages, sendMessageAction }) => {  
  const formRef = useRef();
  const [errorMessage, setErrorMessage] = useState('');

  function formAction(formdata) {
    // Önceki hata mesajını temizle
    setErrorMessage('');
    
    addOptimisticMessage(formdata.get('message'));
    formRef.current.reset();
    
    startTransition(async () => {
      try {
        await sendMessageAction(formdata);
        // Başarılı olursa hata mesajını temizle
        setErrorMessage('');
      } catch (error) {
        // Hata durumunda kullanıcıya bilgi ver
        setErrorMessage(error.message);
        // Optimistic state otomatik olarak geri alınır
      }
    });
  }

  const  [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state, newMessage) => [
          ...state,
      {
      text: newMessage,
      sending: true,
      },
    ]
  );

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <h2>Optimistic Updates - With Error Scenario</h2>
      
      {/* Hata mesajı gösterimi */}
      {errorMessage && (
        <div style={{ 
          backgroundColor: '#fee', 
          color: '#c00', 
          padding: '10px', 
          marginBottom: '10px',
          border: '1px solid #fcc',
          borderRadius: '4px'
        }}>
          ❌ {errorMessage}
        </div>
      )}
      
      <form ref={formRef} action={formAction} style={{ marginBottom: '20px' }}>
        <input 
          type='text' 
          name='message' 
          placeholder='Type your message...' 
          style={{ 
            padding: '8px', 
            marginRight: '8px', 
            width: '300px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button 
          type='submit'
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Gönder
        </button>
      </form>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Messages:</h3>
        {optimisticMessages?.map((message, index) => (
          <div 
            key={index}
            style={{
              padding: '10px',
              marginBottom: '8px',
              backgroundColor: message.sending ? '#fff3cd' : '#d4edda',
              border: `1px solid ${message.sending ? '#ffeaa7' : '#c3e6cb'}`,
              borderRadius: '4px',
              opacity: message.sending ? 0.7 : 1
            }}
          >
            {message.text} 
            {message.sending && (
              <span style={{ color: '#856404', marginLeft: '8px' }}>
                📤 Sending...
              </span>
            )}
          </div>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e9ecef', 
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <strong>💡 Test Scenario:</strong><br/>
        • 70% chance message succeeds<br/>
        • 30% chance you get an error<br/>
        • On error optimistic update rolls back automatically<br/>
        • Message appears instantly, resolved after 2 seconds
      </div>
    </div>
  )
}