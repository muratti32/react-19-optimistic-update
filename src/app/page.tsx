import LikeButton from './components/LikeButton';
import OptimisticTodoList from './components/OptimisticTodoList';
import OptimisticChat from './components/OptimisticChat';
import OptimisticComments from './components/OptimisticComments';
import OptimisticBlog from './components/OptimisticBlog';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Optimistic Updates Examples
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            How to implement optimistic updates with React 19 & Next.js 15?
            Here are examples from different scenarios.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Like Button Örneği */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                1. 👍 Like Button
              </h2>
              <p className="text-gray-600">
                Classic social media like system. Count changes instantly when clicked.
              </p>
            </div>
            <div className="flex flex-col space-y-4">
              <LikeButton postId="123" initialLikes={42} initialIsLiked={false} />
              <LikeButton postId="456" initialLikes={89} initialIsLiked={true} />
            </div>
          </div>

          {/* Todo List Örneği */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                2. ✅ Todo List
              </h2>
              <p className="text-gray-600">
                Todo add, toggle and delete actions update instantly.
              </p>
            </div>
            <OptimisticTodoList />
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chat Örneği */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                3. 💬 Live Chat
              </h2>
              <p className="text-gray-600">
                Messages appear instantly, bot reply loads in the background.
              </p>
            </div>
            <OptimisticChat />
          </div>

          {/* Comments Örneği */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                4. 📝 Blog Comments
              </h2>
              <p className="text-gray-600">
                Comment & like system with richer interactions.
              </p>
            </div>
            <OptimisticComments />
          </div>

        </div>

        {/* Blog Örneği - Full Width */}
        <div className="mt-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                5. 📝 Blog System (Server Actions)
              </h2>
              <p className="text-gray-600">
                Form handling & optimistic updates with Next.js Server Actions.
              </p>
            </div>
            <OptimisticBlog />
          </div>
        </div>

        {/* Bilgi Kartları */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              🎯 What Did We Learn?
            </h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• useOptimistic hook usage</li>
              <li>• Async flows with useTransition</li>
              <li>• Handling error states</li>
              <li>• Loading states</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              ✨ Advantages
            </h3>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Instant user feedback</li>
              <li>• Faster perceived UI</li>
              <li>• Better UX</li>
              <li>• Smoothness even on slow networks</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              ⚠️ Things to Watch Out For
            </h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Plan error cases</li>
              <li>• Keep optimistic state simple</li>
              <li>• Don’t forget server validation</li>
              <li>• Handle conflicting updates</li>
            </ul>
          </div>

        </div>

        {/* Büyük Listeler ve Virtualization */}
        <div className="mt-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            🚀 Large Lists & Performance
          </h3>
          <p className="text-gray-600 mb-6">
            How to apply optimistic updates in huge lists containing thousands of items?
            Examples with React Virtuoso & infinite scroll.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/page3" 
              className="bg-white rounded-lg p-4 hover:shadow-lg transition-shadow border-2 border-purple-200 hover:border-purple-400"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h4 className="font-semibold text-gray-800">Large List (10K items)</h4>
                  <p className="text-sm text-gray-600">React Virtuoso + Optimistic Updates</p>
                </div>
              </div>
            </Link>
            
            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💬</span>
                <div>
                  <h4 className="font-semibold text-gray-800">Infinite Scroll Comments</h4>
                  <p className="text-sm text-gray-600">Infinite Loading + Optimistic UI</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Best Practices for Large Lists */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            ✅ Best Practices for Large Lists
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ul className="text-green-700 text-sm space-y-2">
              <li>• <strong>React Virtuoso:</strong> High performance virtualization</li>
              <li>• <strong>Memoization:</strong> Use useMemo & useCallback</li>
              <li>• <strong>Chunk loading:</strong> Load data in chunks</li>
            </ul>
            <ul className="text-green-700 text-sm space-y-2">
              <li>• <strong>Index-based keys:</strong> Use stable keys</li>
              <li>• <strong>Intersection Observer:</strong> For infinite scroll</li>
              <li>• <strong>Error boundaries:</strong> Capture failures</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            🔗 Review these examples to use optimistic updates in your own projects!
          </p>
        </div>
      </div>
    </div>
  );
}
