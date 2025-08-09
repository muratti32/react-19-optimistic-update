import LikeButton from './components/LikeButton';
import OptimisticTodoList from './components/OptimisticTodoList';
import OptimisticChat from './components/OptimisticChat';
import OptimisticComments from './components/OptimisticComments';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 Optimistic Updates Örnekleri
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            React 19 ve Next.js 15 ile optimistic güncellemeler nasıl yapılır? 
            İşte farklı senaryolardan örnekler.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Like Button Örneği */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                1. 👍 Beğeni Butonu
              </h2>
              <p className="text-gray-600">
                Klasik sosyal medya beğeni sistemi. Butona tıkladığınızda anında beğeni sayısı değişir.
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
                2. ✅ Todo Listesi
              </h2>
              <p className="text-gray-600">
                Todo ekleme, güncelleme ve silme işlemleri anında gerçekleşir.
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
                3. 💬 Canlı Sohbet
              </h2>
              <p className="text-gray-600">
                Mesajlar anında gönderilir, bot yanıtı arka planda yüklenir.
              </p>
            </div>
            <OptimisticChat />
          </div>

          {/* Comments Örneği */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                4. 📝 Blog Yorumları
              </h2>
              <p className="text-gray-600">
                Yorum ekleme ve beğeni sistemi ile karmaşık etkileşimler.
              </p>
            </div>
            <OptimisticComments />
          </div>

        </div>

        {/* Bilgi Kartları */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              🎯 Ne Öğrendik?
            </h3>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• useOptimistic hook kullanımı</li>
              <li>• useTransition ile async işlemler</li>
              <li>• Hata durumlarını yönetme</li>
              <li>• Loading state'leri</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-3">
              ✨ Avantajları
            </h3>
            <ul className="text-green-700 text-sm space-y-1">
              <li>• Anında kullanıcı geri bildirimi</li>
              <li>• Daha hızlı hissedilen arayüz</li>
              <li>• Daha iyi kullanıcı deneyimi</li>
              <li>• Yavaş ağlarda bile akıcılık</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              ⚠️ Dikkat Edilecekler
            </h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Hata durumlarını planla</li>
              <li>• Optimistic state'i basit tut</li>
              <li>• Server validasyonu unutma</li>
              <li>• Çakışan güncellemelere dikkat</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            🔗 Bu örnekleri inceleyerek kendi projelerinizde optimistic updates uygulayabilirsiniz!
          </p>
        </div>
      </div>
    </div>
  );
}
