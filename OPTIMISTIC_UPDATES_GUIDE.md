# Optimistic Updates Rehberi

## 🎯 Optimistic Updates Nedir?

Optimistic Updates (İyimser Güncellemeler), kullanıcı bir işlem yaptığında sonucun başarılı olacağını varsayarak arayüzü anında güncelleyen bir tekniktir. Server'dan yanıt gelmeden önce kullanıcıya işlemin tamamlandığı gösterilir.

## 🔄 Geleneksel vs Optimistic Yaklaşım

### Geleneksel Yaklaşım:
1. Kullanıcı butona tıklar
2. Loading spinner gösterilir
3. Server'a istek gönderilir
4. Server yanıt verir
5. UI güncellenir

**Sorun**: Kullanıcı bekleme süresi boyunca bekler, UX kötü olur.

### Optimistic Yaklaşım:
1. Kullanıcı butona tıklar
2. UI anında güncellenir (optimistic)
3. Arka planda server'a istek gönderilir
4. Server yanıtı gelir:
   - ✅ Başarılı ise: Optimistic state korunur
   - ❌ Hata ise: Optimistic state geri alınır

**Avantaj**: Kullanıcı anında sonucu görür, daha hızlı hisseder.

## 🛠️ React 19 ile Implementasyon

### 1. useOptimistic Hook

```tsx
const [optimisticState, addOptimistic] = useOptimistic(
  currentState,
  (state, optimisticValue) => {
    // State'i optimistic değerle güncelle
    return newState;
  }
);
```

### 2. useTransition Hook

```tsx
const [isPending, startTransition] = useTransition();

const handleAction = () => {
  // Optimistic güncelleme
  addOptimistic(newValue);
  
  // Server işlemi
  startTransition(async () => {
    try {
      await serverAction();
      // Başarılı ise real state güncelle
    } catch (error) {
      // Hata durumunda optimistic state otomatik geri alınır
    }
  });
};
```

## 📋 Best Practices

### ✅ Ne Zaman Kullanılmalı?

1. **Sosyal Medya Etkileşimleri**: Beğeni, takip, yorum
2. **CRUD İşlemleri**: Todo ekleme/silme, form gönderimi
3. **Chat Uygulamaları**: Mesaj gönderme
4. **Shopping Cart**: Ürün ekleme/çıkarma
5. **Blog/Forum**: Post oluşturma, beğenme

### ❌ Ne Zaman Kullanılmamalı?

1. **Kritik İşlemler**: Ödeme, silme işlemleri (onay gerekli)
2. **Karmaşık Validasyonlar**: Server-side validation gereken işlemler
3. **Yavaş İşlemler**: 5+ saniye süren işlemler
4. **Güvenlik Hassas**: Login, authorization işlemleri

## 🔧 Implementasyon Patterns

### Pattern 1: Simple Toggle (Beğeni Butonu)

```tsx
function LikeButton({ postId, initialLikes, initialIsLiked }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isPending, startTransition] = useTransition();
  
  const [optimisticState, addOptimisticLike] = useOptimistic(
    { likes, isLiked },
    (state, newValue) => newValue
  );

  const handleLike = () => {
    const newIsLiked = !optimisticState.isLiked;
    const optimisticLikes = newIsLiked ? 
      optimisticState.likes + 1 : optimisticState.likes - 1;
    
    addOptimisticLike({ likes: optimisticLikes, isLiked: newIsLiked });
    
    startTransition(async () => {
      try {
        const result = await toggleLikeAction(postId, newIsLiked);
        setLikes(result.likes);
        setIsLiked(result.isLiked);
      } catch (error) {
        // Hata durumunda optimistic state geri alınır
        showErrorToast('Beğeni işlemi başarısız');
      }
    });
  };

  return (
    <button onClick={handleLike} disabled={isPending}>
      {optimisticState.isLiked ? '❤️' : '🤍'} {optimisticState.likes}
    </button>
  );
}
```

### Pattern 2: List Management (Todo Listesi)

```tsx
function TodoList() {
  const [todos, setTodos] = useState(initialTodos);
  const [isPending, startTransition] = useTransition();
  
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, action) => {
      switch (action.type) {
        case 'add':
          return [action.todo, ...state];
        case 'toggle':
          return state.map(todo => 
            todo.id === action.id 
              ? { ...todo, completed: !todo.completed }
              : todo
          );
        case 'delete':
          return state.filter(todo => todo.id !== action.id);
        default:
          return state;
      }
    }
  );

  const addTodo = (text) => {
    const optimisticTodo = {
      id: `temp-${Date.now()}`,
      text,
      completed: false,
      isOptimistic: true
    };
    
    addOptimisticTodo({ type: 'add', todo: optimisticTodo });
    
    startTransition(async () => {
      try {
        const newTodo = await createTodoAction(text);
        setTodos(prev => [newTodo, ...prev]);
      } catch (error) {
        showErrorToast('Todo eklenemedi');
      }
    });
  };

  return (
    <div>
      {optimisticTodos.map(todo => (
        <TodoItem 
          key={todo.id} 
          todo={todo}
          onToggle={() => toggleTodo(todo.id)}
          onDelete={() => deleteTodo(todo.id)}
        />
      ))}
    </div>
  );
}
```

### Pattern 3: Server Actions Integration

```tsx
'use server';

export async function createPostAction(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  
  // Validation
  if (!title || !content) {
    throw new Error('Başlık ve içerik gerekli');
  }
  
  // Database işlemi
  const post = await db.post.create({
    data: { title, content, authorId: getCurrentUserId() }
  });
  
  // Cache güncelleme
  revalidatePath('/blog');
  
  return post;
}

// Component tarafında:
function BlogForm() {
  const [optimisticPosts, addOptimisticPost] = useOptimistic(
    posts,
    (state, newPost) => [newPost, ...state]
  );

  const handleSubmit = async (formData: FormData) => {
    const title = formData.get('title') as string;
    const content = formData.get('content') as string;
    
    const optimisticPost = {
      id: `temp-${Date.now()}`,
      title,
      content,
      createdAt: new Date(),
      isOptimistic: true
    };
    
    addOptimisticPost(optimisticPost);
    
    startTransition(async () => {
      try {
        const newPost = await createPostAction(formData);
        setPosts(prev => [newPost, ...prev]);
      } catch (error) {
        showErrorToast(error.message);
      }
    });
  };

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## 🚨 Hata Yönetimi

### 1. Otomatik Rollback
```tsx
// useOptimistic otomatik olarak rollback yapar
startTransition(async () => {
  try {
    await serverAction();
  } catch (error) {
    // Optimistic state otomatik olarak eski haline döner
    showErrorMessage(error.message);
  }
});
```

### 2. Manuel Rollback
```tsx
const [optimisticData, setOptimisticData] = useOptimistic(
  data,
  (state, action) => applyOptimisticUpdate(state, action)
);

const handleAction = () => {
  const rollbackAction = { type: 'rollback', originalData: data };
  
  setOptimisticData(optimisticAction);
  
  startTransition(async () => {
    try {
      await serverAction();
    } catch (error) {
      setOptimisticData(rollbackAction);
      showError(error);
    }
  });
};
```

### 3. Hata UI Durumları
```tsx
function OptimisticComponent() {
  const [error, setError] = useState(null);
  
  return (
    <div>
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
      
      {optimisticItems.map(item => (
        <div key={item.id} className={item.isOptimistic ? 'optimistic' : ''}>
          {item.content}
          {item.error && <span className="error-indicator">⚠️</span>}
        </div>
      ))}
    </div>
  );
}
```

## 🎨 UI/UX Considerations

### 1. Visual Feedback
```css
/* Optimistic state gösterimi */
.optimistic-item {
  opacity: 0.7;
  border: 2px dashed #3b82f6;
  background: #eff6ff;
}

.optimistic-item::after {
  content: "Kaydediliyor...";
  font-size: 0.75rem;
  color: #3b82f6;
  background: #dbeafe;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}
```

### 2. Loading States
```tsx
function ActionButton({ onClick, isPending, children }) {
  return (
    <button 
      onClick={onClick} 
      disabled={isPending}
      className={isPending ? 'opacity-50 cursor-not-allowed' : ''}
    >
      {isPending ? <Spinner /> : children}
    </button>
  );
}
```

### 3. Error States
```tsx
function ErrorBoundary({ error, onRetry, children }) {
  if (error) {
    return (
      <div className="error-container">
        <p>İşlem başarısız oldu: {error.message}</p>
        <button onClick={onRetry}>Tekrar Dene</button>
      </div>
    );
  }
  
  return children;
}
```

## 📊 Performance Considerations

### 1. Debouncing
```tsx
const debouncedAction = useMemo(
  () => debounce(async (value) => {
    await updateAction(value);
  }, 500),
  []
);

const handleOptimisticUpdate = (newValue) => {
  addOptimistic(newValue);
  debouncedAction(newValue);
};
```

### 2. Batching Updates
```tsx
const [pendingUpdates, setPendingUpdates] = useState([]);

const batchUpdate = useCallback(
  debounce(async (updates) => {
    try {
      await batchUpdateAction(updates);
      setPendingUpdates([]);
    } catch (error) {
      // Handle batch error
    }
  }, 1000),
  []
);

const addOptimisticUpdate = (update) => {
  addOptimistic(update);
  setPendingUpdates(prev => [...prev, update]);
  batchUpdate(pendingUpdates);
};
```

### 3. Memory Management
```tsx
useEffect(() => {
  // Cleanup fonksiyonu
  return () => {
    // Pending request'leri iptal et
    abortController.abort();
    // Timer'ları temizle
    clearTimeout(timeoutId);
  };
}, []);
```

## 🔮 Advanced Patterns

### 1. Optimistic Mutations with Cache
```tsx
function useOptimisticMutation() {
  const queryClient = useQueryClient();
  
  const mutation = useMutation({
    mutationFn: updateItem,
    onMutate: async (newData) => {
      await queryClient.cancelQueries(['items']);
      
      const previousItems = queryClient.getQueryData(['items']);
      
      queryClient.setQueryData(['items'], old => 
        old.map(item => item.id === newData.id ? newData : item)
      );
      
      return { previousItems };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['items'], context.previousItems);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['items']);
    },
  });
  
  return mutation;
}
```

### 2. Conflict Resolution
```tsx
function useOptimisticWithConflictResolution() {
  const [conflictData, setConflictData] = useState(null);
  
  const handleConflict = (serverData, optimisticData) => {
    setConflictData({ serverData, optimisticData });
  };
  
  const resolveConflict = (resolution) => {
    // Apply resolution strategy
    setConflictData(null);
  };
  
  return { conflictData, resolveConflict };
}
```

Bu rehberi takip ederek projelerinizde etkili optimistic updates uygulayabilir, kullanıcı deneyimini önemli ölçüde iyileştirebilirsiniz! 🚀
