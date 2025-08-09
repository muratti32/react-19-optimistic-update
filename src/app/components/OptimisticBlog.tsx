'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { createPostAction, likePostAction, deletePostAction } from '../actions';

type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  likes: number;
  isPublished: boolean;
  isOptimistic?: boolean;
};

type OptimisticAction = 
  | { type: 'add_post'; post: Post }
  | { type: 'like_post'; id: string }
  | { type: 'delete_post'; id: string };

export default function OptimisticBlog() {
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      title: 'Optimistic Updates with React 19',
      content: 'With the new useOptimistic hook in React 19 we can significantly improve UX. Thanks to this feature... ',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      likes: 15,
      isPublished: true
    },
    {
      id: '2', 
      title: 'What\'s New in Next.js 15',
      content: 'The improvements shipped with Next.js 15 are quite impressive. Server Components, App Router and many more...',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      likes: 8,
      isPublished: true
    }
  ]);
  
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  
  // Optimistic state yönetimi
  const [optimisticPosts, updateOptimisticPosts] = useOptimistic(
    posts,
    (state: Post[], action: OptimisticAction) => {
      switch (action.type) {
        case 'add_post':
          return [action.post, ...state];
        case 'like_post':
          return state.map(post => 
            post.id === action.id
              ? { ...post, likes: post.likes + 1 }
              : post
          );
        case 'delete_post':
          return state.filter(post => post.id !== action.id);
        default:
          return state;
      }
    }
  );

  const handleCreatePost = async (formData: FormData) => {
    // Optimistic post oluştur -> Create optimistic post
    const optimisticPost: Post = {
      id: `temp-${Date.now()}`,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      createdAt: new Date(),
      likes: 0,
      isPublished: true,
      isOptimistic: true
    };
    
    // 1. Anında UI'ı güncelle -> Immediate UI update
    updateOptimisticPosts({ type: 'add_post', post: optimisticPost });
    setShowForm(false);
    
    // 2. Server action'ı çalıştır
    startTransition(async () => {
      try {
        const newPost = await createPostAction(formData);
        setPosts(prev => [newPost, ...prev]);
      } catch (error) {
        console.error('Post oluşturma hatası:', error);
        alert('Post oluşturulamadı, tekrar deneyin.');
      }
    });
  };

  const handleLikePost = (postId: string) => {
    // 1. Anında beğeni sayısını artır
    updateOptimisticPosts({ type: 'like_post', id: postId });
    
    // 2. Server action'ı çalıştır
    startTransition(async () => {
      try {
        await likePostAction(postId);
        setPosts(prev => prev.map(post => 
          post.id === postId
            ? { ...post, likes: post.likes + 1 }
            : post
        ));
      } catch (error) {
        console.error('Beğeni hatası:', error);
        alert('Beğeni eklenemedi, tekrar deneyin.');
      }
    });
  };

  const handleDeletePost = (postId: string) => {
    if (!confirm('Bu postu silmek istediğinizden emin misiniz?')) return;
    
    // 1. Anında UI'dan kaldır
    updateOptimisticPosts({ type: 'delete_post', id: postId });
    
    // 2. Server action'ı çalıştır
    startTransition(async () => {
      try {
        await deletePostAction(postId);
        setPosts(prev => prev.filter(post => post.id !== postId));
      } catch (error) {
        console.error('Silme hatası:', error);
        alert('Post silinemedi, tekrar deneyin.');
      }
    });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-gray-600 mt-1">Server Actions with Optimistic Updates</p>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {showForm ? 'Cancel' : '✏️ New Post'}
        </button>
      </div>

      {/* Post Oluşturma Formu */}
      {showForm && (
        <div className="bg-white border rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">New Blog Post</h2>
          
          <form action={handleCreatePost} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Başlık
                {/* Title */}
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter post title..."
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                İçerik
                {/* Content */}
              </label>
              <textarea
                name="content"
                id="content"
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Write post content..."
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? 'Publishing...' : 'Postu Yayınla'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                İptal
                {/* Cancel */}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts Listesi */}
      <div className="space-y-6">
        {optimisticPosts.map((post) => (
          <article
            key={post.id}
            className={`
              bg-white border rounded-xl p-6 shadow-sm transition-all duration-200
              ${post.isOptimistic 
                ? 'bg-green-50 border-green-200 border-dashed' 
                : 'border-gray-200 hover:shadow-md'
              }
            `}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {post.title}
                  </h2>
                  
                  {post.isOptimistic && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      Yayınlanıyor...
                      Publishing...
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm">
                  {formatDate(post.createdAt)}
                </p>
              </div>
              
              {!post.isOptimistic && (
                <button
                  onClick={() => handleDeletePost(post.id)}
                  disabled={isPending}
                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Postu sil"
                >
                  🗑️
                </button>
              )}
            </div>
            
            <p className="text-gray-700 leading-relaxed mb-4">
              {post.content}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleLikePost(post.id)}
                  disabled={isPending || post.isOptimistic}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-lg">❤️</span>
                  <span className="font-medium">{post.likes}</span>
                </button>
                
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                  <span>💬</span>
                  <span className="text-sm">Comment</span>
                </button>
                
                <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                  <span>🔗</span>
                  <span className="text-sm">Share</span>
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                {post.isPublished ? '🟢 Live' : '🟡 Draft'}
              </div>
            </div>
          </article>
        ))}
        
        {optimisticPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No blog posts yet!</p>
            <p className="text-gray-400 text-sm mt-2">Write the first one 🚀</p>
          </div>
        )}
      </div>
      
      {/* Bilgi Kutusu */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          🔧 Server Actions + Optimistic Updates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700 text-sm">
          <div>
            <p className="font-medium mb-2">Özellikler:</p>
            {/* Features: */}
            <ul className="space-y-1">
              <li>• Next.js Server Actions usage</li>
              <li>• Form handling & validation</li>
              <li>• revalidatePath cache refresh</li>
              <li>• Optimistic UI updates</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">Avantajlar:</p>
            {/* Advantages: */}
            <ul className="space-y-1">
              <li>• Type-safe server operations</li>
              <li>• Automatic form handling</li>
              <li>• Progressive enhancement</li>
              <li>• SEO friendly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
