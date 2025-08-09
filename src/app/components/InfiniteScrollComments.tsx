'use client';

import { useState, useTransition, useOptimistic, useMemo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';

type Comment = {
  id: string;
  text: string;
  author: string;
  likes: number;
  isLiked: boolean;
  createdAt: Date;
  replies: Comment[];
  parentId?: string;
};

type OptimisticAction = 
  | { type: 'add'; comment: Comment }
  | { type: 'like'; id: string }
  | { type: 'unlike'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'addReply'; parentId: string; reply: Comment }
  | { type: 'loadMore'; comments: Comment[] };

// Server actions simülasyonu
async function loadCommentsAction(page: number, limit: number): Promise<Comment[]> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const comments: Comment[] = [];
  const startId = page * limit;
  
  for (let i = 0; i < limit; i++) {
    const commentId = (startId + i + 1).toString();
    comments.push({
      id: commentId,
      text: `Bu ${commentId}. yorum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${Math.random() > 0.5 ? 'Uzun açıklama ile birlikte ekstra detaylar.' : ''}`,
      author: `Kullanıcı${Math.floor(Math.random() * 100) + 1}`,
      likes: Math.floor(Math.random() * 50),
      isLiked: Math.random() > 0.8,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 7), // Son 7 gün
      replies: []
    });
  }
  
  return comments;
}

async function addCommentAction(text: string, author: string): Promise<Comment> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (Math.random() < 0.05) {
    throw new Error('Yorum eklenemedi!');
  }
  
  return {
    id: Date.now().toString(),
    text,
    author,
    likes: 0,
    isLiked: false,
    createdAt: new Date(),
    replies: []
  };
}

async function likeCommentAction(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  if (Math.random() < 0.02) {
    throw new Error('Beğeni işlemi başarısız!');
  }
}

async function deleteCommentAction(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  if (Math.random() < 0.03) {
    throw new Error('Silme işlemi başarısız!');
  }
}

export default function InfiniteScrollOptimisticComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [author, setAuthor] = useState('Ben');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Optimistic state yönetimi
  const [optimisticComments, addOptimisticAction] = useOptimistic(
    comments,
    (state: Comment[], action: OptimisticAction) => {
      switch (action.type) {
        case 'add':
          return [action.comment, ...state];
        case 'like':
          return state.map(comment => 
            comment.id === action.id 
              ? { ...comment, isLiked: true, likes: comment.likes + 1 }
              : comment
          );
        case 'unlike':
          return state.map(comment => 
            comment.id === action.id 
              ? { ...comment, isLiked: false, likes: Math.max(0, comment.likes - 1) }
              : comment
          );
        case 'delete':
          return state.filter(comment => comment.id !== action.id);
        case 'addReply':
          return state.map(comment => 
            comment.id === action.parentId 
              ? { ...comment, replies: [...comment.replies, action.reply] }
              : comment
          );
        case 'loadMore':
          return [...state, ...action.comments];
        default:
          return state;
      }
    }
  );

  // İlk yükleme
  const loadInitialComments = useCallback(async () => {
    if (comments.length === 0) {
      setIsLoading(true);
      try {
        const initialComments = await loadCommentsAction(0, 50);
        setComments(initialComments);
        setPage(1);
      } catch (error) {
        console.error('İlk yorumlar yüklenemedi:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [comments.length]);

  // Infinite scroll için daha fazla yükleme
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    try {
      const newComments = await loadCommentsAction(page, 20);
      
      if (newComments.length === 0) {
        setHasMore(false);
      } else {
        // Optimistic update ile anında ekle
        addOptimisticAction({ type: 'loadMore', comments: newComments });
        setComments(prev => [...prev, ...newComments]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Daha fazla yorum yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page, addOptimisticAction]);

  // İlk yüklemeyi başlat
  useState(() => {
    loadInitialComments();
  });

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    // Optimistic comment oluştur
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      text: newComment,
      author,
      likes: 0,
      isLiked: false,
      createdAt: new Date(),
      replies: []
    };
    
    // 1. Anında UI'ı güncelle
    addOptimisticAction({ type: 'add', comment: optimisticComment });
    setNewComment('');
    
    // 2. Server işlemini başlat
    startTransition(async () => {
      try {
        const newCommentFromServer = await addCommentAction(newComment, author);
        setComments(prev => [newCommentFromServer, ...prev]);
      } catch (error) {
        console.error('Yorum ekleme hatası:', error);
        alert('Yorum eklenemedi, tekrar deneyin.');
      }
    });
  };

  const handleLike = (id: string, isCurrentlyLiked: boolean) => {
    // 1. Anında UI'ı güncelle
    addOptimisticAction({ 
      type: isCurrentlyLiked ? 'unlike' : 'like', 
      id 
    });
    
    // 2. Server işlemini başlat
    startTransition(async () => {
      try {
        await likeCommentAction(id);
        setComments(prev => prev.map(comment => 
          comment.id === id 
            ? { 
                ...comment, 
                isLiked: !isCurrentlyLiked,
                likes: isCurrentlyLiked ? Math.max(0, comment.likes - 1) : comment.likes + 1
              }
            : comment
        ));
      } catch (error) {
        console.error('Beğeni hatası:', error);
        alert('Beğeni işlemi başarısız oldu.');
      }
    });
  };

  const handleDelete = (id: string) => {
    // 1. Anında UI'ı güncelle
    addOptimisticAction({ type: 'delete', id });
    
    // 2. Server işlemini başlat
    startTransition(async () => {
      try {
        await deleteCommentAction(id);
        setComments(prev => prev.filter(comment => comment.id !== id));
      } catch (error) {
        console.error('Silme hatası:', error);
        alert('Silme işlemi başarısız oldu.');
      }
    });
  };

  // Virtuoso için öğe render fonksiyonu
  const CommentRenderer = (index: number) => {
    const comment = optimisticComments[index];
    if (!comment) return null;

    return (
      <div
        className={`
          p-4 border-b border-gray-200 transition-all duration-200
          ${comment.id.startsWith('temp-') ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}
        `}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-blue-600">{comment.author}</span>
              <span className="text-xs text-gray-500">
                {comment.createdAt.toLocaleString('tr-TR')}
              </span>
              {comment.id.startsWith('temp-') && (
                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                  Gönderiliyor...
                </span>
              )}
            </div>
            <p className="text-gray-800 mb-3">{comment.text}</p>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLike(comment.id, comment.isLiked)}
                disabled={isPending}
                className={`
                  flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors
                  ${comment.isLiked 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                <span>{comment.isLiked ? '❤️' : '🤍'}</span>
                <span>{comment.likes}</span>
              </button>
              
              <button className="text-gray-500 hover:text-gray-700 text-sm">
                💬 Yanıtla
              </button>
              
              <button
                onClick={() => handleDelete(comment.id)}
                disabled={isPending}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                🗑️ Sil
              </button>
            </div>
            
            {/* Yanıtlar */}
            {comment.replies.length > 0 && (
              <div className="mt-3 ml-4 border-l-2 border-gray-200 pl-4">
                {comment.replies.map(reply => (
                  <div key={reply.id} className="mb-2 p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-blue-600">{reply.author}</span>
                      <span className="text-xs text-gray-500">
                        {reply.createdAt.toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{reply.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Footer bileşeni - loading göstergesi
  const Footer = () => {
    if (!hasMore) {
      return (
        <div className="p-4 text-center text-gray-500">
          Tüm yorumlar yüklendi
        </div>
      );
    }
    
    return (
      <div className="p-4 text-center">
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-gray-500">Daha fazla yorum yükleniyor...</span>
          </div>
        ) : (
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Daha Fazla Yükle
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Sonsuz Scroll + Optimistic Updates</h1>
      
      {/* Yeni yorum ekleme formu */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Yeni Yorum Ekle</h2>
        <div className="mb-4">
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="İsminiz..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          />
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Yorumunuzu yazın..."
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
        </div>
        <button
          onClick={handleAddComment}
          disabled={!newComment.trim() || isPending}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Gönderiliyor...' : 'Yorum Ekle'}
        </button>
      </div>

      {/* İstatistikler */}
      <div className="mb-4 text-sm text-gray-600">
        <p>Toplam yorum: {optimisticComments.length}</p>
      </div>

      {/* Virtualized Yorumlar */}
      <div className="border rounded-lg overflow-hidden">
        {optimisticComments.length > 0 ? (
          <Virtuoso
            style={{ height: '600px' }}
            totalCount={optimisticComments.length}
            itemContent={CommentRenderer}
            endReached={loadMore}
            overscan={5}
            components={{ Footer }}
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            {isLoading ? 'Yorumlar yükleniyor...' : 'Henüz yorum yok!'}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>💡 Sayfa kaydırıldığında otomatik olarak daha fazla yorum yükleniyor</p>
        <p>⚡ Yeni yorumlar ve beğeniler anında görünüyor</p>
        <p>🔄 Sadece görünen yorumlar render ediliyor (performans)</p>
      </div>
    </div>
  );
}
