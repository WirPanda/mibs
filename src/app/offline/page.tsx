export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#3498db] p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-3xl font-bold text-white">Нет подключения</h1>
        <p className="text-white/90 text-lg">
          Проверьте подключение к интернету и попробуйте снова
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-white text-[#2980b9] px-6 py-3 rounded-full font-bold hover:bg-white/90 transition-all"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
