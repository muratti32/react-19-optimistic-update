'use client';

import { useState, useTransition, useOptimistic } from 'react';

type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
};

type OptimisticAction = 
  | { type: 'add'; todo: Todo }
  | { type: 'toggle'; id: string }
  | { type: 'delete'; id: string };

// Simulated server actions
async function addTodoAction(text: string): Promise<Todo> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (Math.random() < 0.1) {
    throw new Error('Failed to add todo!');
  }
  
  return {
    id: Date.now().toString(),
    text,
    completed: false,
    createdAt: new Date()
  };
}

async function toggleTodoAction(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (Math.random() < 0.1) {
    throw new Error('Failed to update todo!');
  }
}

async function deleteTodoAction(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  if (Math.random() < 0.1) {
    throw new Error('Failed to delete todo!');
  }
}

export default function OptimisticTodoList() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: 'Learn Next.js', completed: false, createdAt: new Date() },
    { id: '2', text: 'Implement optimistic updates', completed: true, createdAt: new Date() }
  ]);
  
  const [newTodoText, setNewTodoText] = useState('');
  const [isPending, startTransition] = useTransition();
  
  // Optimistic state yönetimi
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state: Todo[], action: OptimisticAction) => {
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

  const handleAddTodo = () => {
    // Create optimistic todo
    const optimisticTodo: Todo = {
      id: `temp-${Date.now()}`,
      text: newTodoText,
      completed: false,
      createdAt: new Date()
    };
    
    // 1. Update UI immediately
    addOptimisticTodo({ type: 'add', todo: optimisticTodo });
    setNewTodoText('');
    
    // 2. Start server action
    startTransition(async () => {
      try {
        const newTodo = await addTodoAction(newTodoText);
        setTodos(prev => [newTodo, ...prev]);
      } catch (error) {
        console.error('Add todo error:', error);
        alert('Failed to add todo, please retry.');
        // Optimistic update will be rolled back automatically
      }
    });
  };

  const handleToggleTodo = (id: string) => {
    // 1. Update UI immediately
    addOptimisticTodo({ type: 'toggle', id });
    
    // 2. Start server action
    startTransition(async () => {
      try {
        await toggleTodoAction(id);
        setTodos(prev => prev.map(todo => 
          todo.id === id 
            ? { ...todo, completed: !todo.completed }
            : todo
        ));
      } catch (error) {
        console.error('Todo güncelleme hatası:', error);
        alert('Todo güncellenemedi, tekrar deneyin.');
      }
    });
  };

  const handleDeleteTodo = (id: string) => {
    // 1. Update UI immediately
    addOptimisticTodo({ type: 'delete', id });
    
    // 2. Start server action
    startTransition(async () => {
      try {
        await deleteTodoAction(id);
        setTodos(prev => prev.filter(todo => todo.id !== id));
      } catch (error) {
        console.error('Todo silme hatası:', error);
        alert('Todo silinemedi, tekrar deneyin.');
      }
    });
  };

  return (
    <div className="max-w-md mx-auto p-6 border rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Optimistic Todo List</h2>
      
      {/* Add Todo Form */}
      <div className="flex space-x-2 mb-4">
        <input
          type="text"
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          placeholder="Yeni todo ekle..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
        />
        <button
          onClick={handleAddTodo}
          disabled={!newTodoText.trim() || isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? '⏳' : '➕'}
        </button>
      </div>
      
      {/* Todo Listesi */}
      <div className="space-y-2">
        {optimisticTodos.map((todo) => (
          <div
            key={todo.id}
            className={`
              flex items-center space-x-3 p-3 border rounded-lg transition-all duration-200
              ${todo.id.startsWith('temp-') ? 'bg-yellow-50 border-yellow-200' : 'bg-white'}
              ${todo.completed ? 'opacity-75' : ''}
            `}
          >
            <button
              onClick={() => handleToggleTodo(todo.id)}
              disabled={isPending}
              className={`
                w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                ${todo.completed 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-300 hover:border-green-400'
                }
              `}
            >
              {todo.completed && '✓'}
            </button>
            
            <span className={`flex-1 ${todo.completed ? 'line-through text-gray-500' : ''}`}>
              {todo.text}
            </span>
            
            {todo.id.startsWith('temp-') && (
              <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                Ekleniyor...
              </span>
            )}
            
            <button
              onClick={() => handleDeleteTodo(todo.id)}
              disabled={isPending}
              className="text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
      
      {optimisticTodos.length === 0 && (
        <p className="text-gray-500 text-center py-8">No todos yet!</p>
      )}
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        <p>💡 Todos appear instantly and sync with the server in the background</p>
        <p>⚠️ 10% simulated failure rate</p>
      </div>
    </div>
  );
}
