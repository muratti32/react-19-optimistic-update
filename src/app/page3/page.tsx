'use client';

import { useState, useTransition, useOptimistic, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

type ListItem = {
  id: string;
  title: string;
  content: string;
  likes: number;
  isLiked: boolean;
  createdAt: Date;
  category: string;
};

type OptimisticAction = 
  | { type: 'add'; item: ListItem }
  | { type: 'like'; id: string }
  | { type: 'unlike'; id: string }
  | { type: 'delete'; id: string }
  | { type: 'update'; id: string; updates: Partial<ListItem> };

// Server actions simülasyonu
async function addItemAction(title: string, content: string, category: string): Promise<ListItem> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  if (Math.random() < 0.05) {
    throw new Error('Failed to add item!');
  }
  
  return {
    id: Date.now().toString(),
    title,
    content,
    likes: 0,
    isLiked: false,
    createdAt: new Date(),
    category
  };
}

async function likeItemAction(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (Math.random() < 0.02) {
    throw new Error('Like action failed!');
  }
}

async function deleteItemAction(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (Math.random() < 0.03) {
    throw new Error('Delete action failed!');
  }
}

// Büyük veri seti oluşturmak için yardımcı fonksiyon
function generateLargeDataset(count: number): ListItem[] {
  const categories = ['Technology', 'Science', 'Art', 'Sports', 'Music', 'Movie', 'Book', 'Game'];
  const items: ListItem[] = [];
  
  for (let i = 1; i <= count; i++) {
    items.push({
      id: i.toString(),
      title: `Item Title ${i}`,
      content: `This is the content of item ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${i % 3 === 0 ? 'This item has a longer description.' : ''}`,
      likes: Math.floor(Math.random() * 100),
      isLiked: Math.random() > 0.7,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 30), // Son 30 gün içinde
      category: categories[i % categories.length]
    });
  }
  
  return items;
}

export default function VirtualizedOptimisticList() {
  // 10,000 öğeli büyük bir liste
  const [items, setItems] = useState<ListItem[]>(() => generateLargeDataset(10000));
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Technology');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isPending, startTransition] = useTransition();

  // Optimistic state yönetimi
  const [optimisticItems, addOptimisticAction] = useOptimistic(
    items,
    (state: ListItem[], action: OptimisticAction) => {
      switch (action.type) {
        case 'add':
          return [action.item, ...state];
        case 'like':
          return state.map(item => 
            item.id === action.id 
              ? { ...item, isLiked: true, likes: item.likes + 1 }
              : item
          );
        case 'unlike':
          return state.map(item => 
            item.id === action.id 
              ? { ...item, isLiked: false, likes: Math.max(0, item.likes - 1) }
              : item
          );
        case 'delete':
          return state.filter(item => item.id !== action.id);
        case 'update':
          return state.map(item => 
            item.id === action.id 
              ? { ...item, ...action.updates }
              : item
          );
        default:
          return state;
      }
    }
  );

  // Filtrelenmiş ve aranmış öğeler - performans için memoize edildi
  const filteredItems = useMemo(() => {
    return optimisticItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.content.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [optimisticItems, searchTerm, categoryFilter]);

  const categories = ['All', 'Technology', 'Science', 'Art', 'Sports', 'Music', 'Movie', 'Book', 'Game'];

  const handleAddItem = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    
    // Optimistic item oluştur
    const optimisticItem: ListItem = {
      id: `temp-${Date.now()}`,
      title: newTitle,
      content: newContent,
      likes: 0,
      isLiked: false,
      createdAt: new Date(),
      category: selectedCategory
    };
    
    // 1. Anında UI'ı güncelle
    addOptimisticAction({ type: 'add', item: optimisticItem });
    setNewTitle('');
    setNewContent('');
    
    // 2. Server işlemini başlat
    startTransition(async () => {
      try {
        const newItem = await addItemAction(newTitle, newContent, selectedCategory);
        setItems(prev => [newItem, ...prev]);
      } catch (error) {
        console.error('Add item error:', error);
        alert('Failed to add item, please retry.');
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
        await likeItemAction(id);
        setItems(prev => prev.map(item => 
          item.id === id 
            ? { 
                ...item, 
                isLiked: !isCurrentlyLiked,
                likes: isCurrentlyLiked ? Math.max(0, item.likes - 1) : item.likes + 1
              }
            : item
        ));
      } catch (error) {
        console.error('Like error:', error);
        alert('Like action failed.');
      }
    });
  };

  const handleDelete = (id: string) => {
    // 1. Anında UI'ı güncelle
    addOptimisticAction({ type: 'delete', id });
    
    // 2. Server işlemini başlat
    startTransition(async () => {
      try {
        await deleteItemAction(id);
        setItems(prev => prev.filter(item => item.id !== id));
      } catch (error) {
        console.error('Delete error:', error);
        alert('Delete action failed.');
      }
    });
  };

  // Virtuoso için öğe render fonksiyonu
  const ItemRenderer = (index: number) => {
    const item = filteredItems[index];
    if (!item) return null;

    return (
      <div
        className={`
          p-4 border-b border-gray-200 transition-all duration-200 hover:bg-gray-50
          ${item.id.startsWith('temp-') ? 'bg-blue-50 border-blue-200' : 'bg-white'}
        `}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg">{item.title}</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {item.category}
              </span>
              {item.id.startsWith('temp-') && (
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  Adding...
                </span>
              )}
            </div>
            <p className="text-gray-700 mb-2">{item.content}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{item.createdAt.toLocaleDateString('en-US')}</span>
              <span>ID: {item.id}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleLike(item.id, item.isLiked)}
              disabled={isPending}
              className={`
                flex items-center space-x-1 px-3 py-1 rounded-full transition-colors
                ${item.isLiked 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }
              `}
            >
              <span>{item.isLiked ? '❤️' : '🤍'}</span>
              <span>{item.likes}</span>
            </button>
            
            <button
              onClick={() => handleDelete(item.id)}
              disabled={isPending}
              className="text-red-500 hover:text-red-700 p-1 rounded"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Large List with Optimistic Updates</h1>
      
      {/* Yeni öğe ekleme formu */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title..."
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.slice(1).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Content..."
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <button
          onClick={handleAddItem}
          disabled={!newTitle.trim() || !newContent.trim() || isPending}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Arama ve filtreleme */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* İstatistikler */}
      <div className="mb-4 text-sm text-gray-600">
        <p>Total: {optimisticItems.length} | Visible: {filteredItems.length}</p>
      </div>

      {/* Virtualized Liste */}
      <div className="border rounded-lg overflow-hidden">
        <Virtuoso
          style={{ height: '600px' }}
          totalCount={filteredItems.length}
          itemContent={ItemRenderer}
          overscan={10}
        />
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>💡 This list has 10,000 items but only the visible ones are rendered.</p>
        <p>⚡ Thanks to optimistic updates like & delete actions apply instantly.</p>
        <p>🔍 Search & filtering remain performant.</p>
      </div>
    </div>
  );
}
