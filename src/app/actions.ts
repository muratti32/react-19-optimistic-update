'use server';

import { revalidatePath } from 'next/cache';

// Server Actions - In a real app database operations would be here

export async function createPostAction(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  
  // Simulated delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simulated random error
  if (Math.random() < 0.1) {
    throw new Error('Failed to create post!');
  }
  
  // In real app, save to database
  const post = {
    id: Date.now().toString(),
    title,
    content,
    createdAt: new Date(),
    likes: 0,
    isPublished: true
  };
  
  // Revalidate the page
  revalidatePath('/');
  
  return post;
}

export async function likePostAction(postId: string) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (Math.random() < 0.1) {
    throw new Error('Failed to add like!');
  }
  
  // In real app, update database
  revalidatePath('/');
  
  return { success: true };
}

export async function deletePostAction(postId: string) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (Math.random() < 0.1) {
    throw new Error('Failed to delete post!');
  }
  
  // In real app, delete from database
  revalidatePath('/');
  
  return { success: true };
}
