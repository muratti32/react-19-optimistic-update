'use client';

import { useState, useTransition, useOptimistic } from 'react';

type LikeButtonProps = {
  postId: string;
  initialLikes: number;
  initialIsLiked: boolean;
};

// Server action simulation (would live in a separate file in a real app)
async function toggleLike(postId: string, isLiked: boolean): Promise<{ likes: number; isLiked: boolean }> {
  // Simulate network latency with 2s delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Throw an error 10% of the time
  if (Math.random() < 0.1) {
    throw new Error('Network error occurred!');
  }
  
  return {
    likes: isLiked ? Math.floor(Math.random() * 100) + 50 : Math.floor(Math.random() * 50) + 10,
    isLiked: isLiked
  };
}

export default function LikeButton({ postId, initialLikes, initialIsLiked }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isPending, startTransition] = useTransition();
  
  // useOptimistic hook'u ile optimistic state yönetimi
  const [optimisticState, addOptimisticLike] = useOptimistic(
    { likes, isLiked },
    (state, optimisticValue: { likes: number; isLiked: boolean }) => optimisticValue
  );

  const handleLike = () => {
    // 1. Perform optimistic update (instant UI feedback)
    const newIsLiked = !optimisticState.isLiked;
    const optimisticLikes = newIsLiked ? optimisticState.likes + 1 : optimisticState.likes - 1;
    
    addOptimisticLike({ likes: optimisticLikes, isLiked: newIsLiked });
    
    // 2. Gerçek server işlemini başlatıyoruz
    startTransition(async () => {
      try {
        const result = await toggleLike(postId, newIsLiked);
        // Apply authoritative server response
        setLikes(result.likes);
        setIsLiked(result.isLiked);
      } catch (error) {
        console.error('Like action failed:', error);
        alert('Like action failed, please try again.');
      }
    });
  };

  return (
    <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Post #{postId}</h3>
      
      <button
        onClick={handleLike}
        disabled={isPending}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200
          ${optimisticState.isLiked 
            ? 'bg-red-500 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }
          ${isPending ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
        `}
      >
        <span className="text-xl">{optimisticState.isLiked ? '❤️' : '🤍'}</span>
        <span className="font-medium">{optimisticState.likes}</span>
        {isPending && <span className="animate-spin">⏳</span>}
      </button>
      
      <div className="text-xs text-gray-500 text-center">
        <p>Status: {isPending ? 'Updating...' : 'Idle'}</p>
        <p className="mt-1">
          💡 Click the button - like count changes immediately, real server data arrives after 2 seconds
        </p>
      </div>
    </div>
  );
}
