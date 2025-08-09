'use client';

import { useState, useTransition, useOptimistic } from 'react';

type Comment = {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
  likes: number;
  isOptimistic?: boolean;
};

type OptimisticAction = 
  | { type: 'add_comment'; comment: Comment }
  | { type: 'like_comment'; id: string; increment: number };

// Server actions simülasyonu
async function addCommentAction(text: string, author: string): Promise<Comment> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (Math.random() < 0.1) {
    throw new Error('Failed to add comment!');
  }
  
  return {
    id: Date.now().toString(),
    text,
    author,
    timestamp: new Date(),
    likes: 0
  };
}

async function likeCommentAction(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (Math.random() < 0.1) {
    throw new Error('Failed to add like!');
  }
}

export default function OptimisticComments() {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      text: 'Optimistic updates are a fantastic feature!',
      author: 'Ali',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      likes: 5
    },
    {
      id: '2', 
      text: 'Much easier to use with React 19.',
      author: 'Ayşe',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      likes: 3
    }
  ]);
  
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // Optimistic state yönetimi
  const [optimisticComments, updateOptimisticComments] = useOptimistic(
    comments,
    (state: Comment[], action: OptimisticAction) => {
      switch (action.type) {
        case 'add_comment':
          return [action.comment, ...state];
        case 'like_comment':
          return state.map(comment => 
            comment.id === action.id
              ? { ...comment, likes: comment.likes + action.increment }
              : comment
          );
        default:
          return state;
      }
    }
  );

  const handleAddComment = () => {
    if (!newComment.trim() || !author.trim()) return;
    
    // Optimistic comment oluştur
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      text: newComment,
      author: author,
      timestamp: new Date(),
      likes: 0,
      isOptimistic: true
    };
    
    // 1. Anında UI'ı güncelle
    updateOptimisticComments({ type: 'add_comment', comment: optimisticComment });
    
    const commentText = newComment;
    const commentAuthor = author;
    setNewComment('');
    
    // 2. Server işlemini başlat
    startTransition(async () => {
      try {
        const newComment = await addCommentAction(commentText, commentAuthor);
        setComments(prev => [newComment, ...prev]);
      } catch (error) {
        console.error('Yorum ekleme hatası:', error);
        alert('Yorum eklenemedi, tekrar deneyin.');
      }
    });
  };

  const handleLikeComment = (id: string) => {
    // 1. Anında beğeni sayısını artır
    updateOptimisticComments({ type: 'like_comment', id, increment: 1 });
    
    // 2. Server işlemini başlat
    startTransition(async () => {
      try {
        await likeCommentAction(id);
        setComments(prev => prev.map(comment => 
          comment.id === id
            ? { ...comment, likes: comment.likes + 1 }
            : comment
        ));
      } catch (error) {
        console.error('Beğeni hatası:', error);
        alert('Beğeni eklenemedi, tekrar deneyin.');
        // Optimistic güncellemeyi geri al
        updateOptimisticComments({ type: 'like_comment', id, increment: -1 });
      }
    });
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 border rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Blog Comments</h2>
      
      {/* Yorum Ekleme Formu */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Add a Comment</h3>
        
        <div className="space-y-3">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Your name..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim() || !author.trim() || isPending}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </div>
      
      {/* Yorumlar Listesi */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Comments ({optimisticComments.length})
        </h3>
        
        {optimisticComments.map((comment) => (
          <div
            key={comment.id}
            className={`
              p-4 border rounded-lg transition-all duration-200
              ${comment.isOptimistic 
                ? 'bg-blue-50 border-blue-200 border-dashed' 
                : 'bg-white border-gray-200'
              }
            `}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {comment.author.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{comment.author}</p>
                  <p className="text-xs text-gray-500">
                    {formatTimeAgo(comment.timestamp)}
                  </p>
                </div>
              </div>
              
              {comment.isOptimistic && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Adding...
                </span>
              )}
            </div>
            
            <p className="text-gray-700 mb-3 leading-relaxed">
              {comment.text}
            </p>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLikeComment(comment.id)}
                disabled={isPending || comment.isOptimistic}
                className="flex items-center space-x-1 text-gray-600 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-lg">❤️</span>
                <span className="text-sm font-medium">{comment.likes}</span>
              </button>
              
              <button className="text-sm text-gray-600 hover:text-blue-500 transition-colors">
                💬 Reply
              </button>
              
              <button className="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                🔗 Share
              </button>
            </div>
          </div>
        ))}
        
        {optimisticComments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">No comments yet!</p>
            <p className="text-sm mt-1">Be the first one 🎉</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-xs text-gray-500 text-center p-4 bg-gray-50 rounded-lg">
        <p className="font-semibold mb-1">🚀 Optimistic Updates Features:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
          <p>✅ Instant comment add</p>
          <p>✅ Instant like increment</p>
          <p>✅ Automatic rollback on error</p>
          <p>✅ Loading states</p>
        </div>
      </div>
    </div>
  );
}
