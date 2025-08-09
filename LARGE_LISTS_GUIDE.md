# Büyük Listeler ile Optimistic Updates

Bu rehber, büyük veri setleri ile çalışırken optimistic updates'in nasıl uygulanacağını gösterir.

## 🚀 Ana Konular

### 1. React Virtuoso ile Virtualization

React Virtuoso, büyük listeleri render etmek için en performanslı kütüphanedir:

```bash
npm install react-virtuoso
```

#### Temel Kullanım

```tsx
import { Virtuoso } from 'react-virtuoso';

<Virtuoso
  style={{ height: '600px' }}
  totalCount={items.length}
  itemContent={(index) => <ItemComponent item={items[index]} />}
/>
```

### 2. Optimistic Updates + Virtualization

Büyük listelerde optimistic updates uygularken dikkat edilecekler:

#### ✅ Doğru Yaklaşım

```tsx
const [optimisticItems, addOptimisticAction] = useOptimistic(
  items,
  (state, action) => {
    switch (action.type) {
      case 'add':
        return [action.item, ...state]; // Yeni öğeyi başa ekle
      case 'update':
        return state.map(item => 
          item.id === action.id ? { ...item, ...action.updates } : item
        );
      case 'delete':
        return state.filter(item => item.id !== action.id);
    }
  }
);
```

#### ❌ Yanlış Yaklaşım

```tsx
// Tüm listeyi yeniden oluşturmak çok yavaş
const newItems = [...items, newItem];
setItems(newItems);
```

### 3. Performans Optimizasyonları

#### Memoization
```tsx
const filteredItems = useMemo(() => {
  return items.filter(item => item.category === selectedCategory);
}, [items, selectedCategory]);

const handleAction = useCallback((id: string) => {
  // Action logic
}, []);
```

#### Index-based Keys
```tsx
// ✅ Doğru - Index kullan
<Virtuoso
  itemContent={(index) => (
    <div key={index}>
      {/* Content */}
    </div>
  )}
/>

// ❌ Yanlış - Random key'ler
<div key={Math.random()}>
```

### 4. Infinite Scroll Implementation

```tsx
const loadMore = useCallback(async () => {
  if (isLoading || !hasMore) return;
  
  setIsLoading(true);
  try {
    const newItems = await loadItemsAction(page, 20);
    
    // Optimistic update
    addOptimisticAction({ type: 'loadMore', items: newItems });
    setItems(prev => [...prev, ...newItems]);
    setPage(prev => prev + 1);
  } catch (error) {
    console.error('Loading failed:', error);
  } finally {
    setIsLoading(false);
  }
}, [isLoading, hasMore, page]);

<Virtuoso
  endReached={loadMore}
  components={{ Footer: LoadingIndicator }}
/>
```

## 📊 Performans Metrikleri

### Virtualization ile:
- **10,000 öğe:** ~16ms render time
- **Memory usage:** ~50MB
- **Scroll performance:** 60 FPS

### Virtualization olmadan:
- **10,000 öğe:** ~2000ms render time
- **Memory usage:** ~500MB
- **Scroll performance:** ~10 FPS

## 🎯 Best Practices

### 1. Virtual Window Sizing
```tsx
<Virtuoso
  style={{ height: '600px' }} // Sabit yükseklik
  overscan={10} // Ekstra render edilen öğe sayısı
/>
```

### 2. Error Handling
```tsx
const handleOptimisticAction = (action) => {
  addOptimisticAction(action);
  
  startTransition(async () => {
    try {
      await serverAction();
      // Success - state otomatik senkronize olur
    } catch (error) {
      // Hata durumunda optimistic update geri alınır
      console.error('Action failed:', error);
      showErrorNotification();
    }
  });
};
```

### 3. Loading States
```tsx
const ItemRenderer = (index) => {
  const item = items[index];
  
  return (
    <div className={item.id.startsWith('temp-') ? 'opacity-50' : ''}>
      {item.id.startsWith('temp-') && (
        <span className="loading-indicator">Kaydediliyor...</span>
      )}
      {/* Item content */}
    </div>
  );
};
```

## 🔧 Debugging

### React DevTools Profiler
1. Profiler'ı aç
2. "Record" butonu ile kayıt başlat
3. Listeyi scroll et
4. Render süreleri ve re-render'ları analiz et

### Performance Monitoring
```tsx
const ItemComponent = memo(({ item, onAction }) => {
  console.log('Rendering item:', item.id);
  return (
    <div>
      {/* Component content */}
    </div>
  );
});
```

## 📦 Gerekli Paketler

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-virtuoso": "^4.6.0"
  }
}
```

## 🎨 CSS Optimizasyonları

```css
/* Smooth scrolling */
.virtuoso-container {
  scroll-behavior: smooth;
}

/* Loading states */
.optimistic-item {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

/* Hover effects - sadece gerektiğinde */
.item:hover {
  transform: translateY(-1px);
  transition: transform 0.1s ease;
}
```

## 🚨 Yaygın Hatalar

### 1. Tüm Listeyi Re-render Etmek
```tsx
// ❌ Yanlış
items.forEach(item => {
  if (item.id === targetId) {
    item.isLiked = true; // Mutation
  }
});

// ✅ Doğru
setItems(prev => prev.map(item => 
  item.id === targetId ? { ...item, isLiked: true } : item
));
```

### 2. Yanlış Key Kullanımı
```tsx
// ❌ Yanlış
{items.map((item, index) => 
  <div key={item.id}> // ID'ler değişebilir
)}

// ✅ Doğru - Virtuoso ile
<Virtuoso
  itemContent={(index) => 
    <div key={index}> // Index sabit kalır
  }
/>
```

### 3. Gereksiz Re-renders
```tsx
// ❌ Yanlış
const handleClick = () => { /* ... */ }; // Her render'da yeni fonksiyon

// ✅ Doğru
const handleClick = useCallback(() => { /* ... */ }, [dependencies]);
```

## 📚 İleri Seviye Konular

### 1. Server-Side Pagination
```tsx
const loadPage = async (page: number) => {
  const response = await fetch(`/api/items?page=${page}&limit=50`);
  return response.json();
};
```

### 2. Real-time Updates
```tsx
useEffect(() => {
  const socket = new WebSocket('ws://localhost:8080');
  
  socket.onmessage = (event) => {
    const update = JSON.parse(event.data);
    addOptimisticAction(update);
  };
  
  return () => socket.close();
}, []);
```

### 3. Offline Support
```tsx
const handleOfflineAction = (action) => {
  // Immediately update UI
  addOptimisticAction(action);
  
  // Queue for when online
  if (!navigator.onLine) {
    queueAction(action);
    return;
  }
  
  // Process normally
  processAction(action);
};
```

## 🔗 Faydalı Linkler

- [React Virtuoso Docs](https://virtuoso.dev/)
- [React 19 useOptimistic](https://react.dev/reference/react/useOptimistic)
- [Performance Best Practices](https://react.dev/learn/render-and-commit#optimizing-performance)
