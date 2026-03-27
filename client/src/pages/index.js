import Link from 'next/link';
import { Bus, Navigation, Share2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-stone-400 mb-2 italic">GovBus Live</h1>
        <p className="text-gray-600">Crowdsourced Real-time Bus Tracking</p>
      </header>

      <div className="grid gap-6 w-full max-w-md">
        {/* PROVIDER CARD */}
        <Link href="/share">
          <div className="bg-white p-6 rounded-4xl shadow-lg border-2 border-transparent hover:border-blue-500 cursor-pointer transition-all flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full text-slate-400">
              <Share2 size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-500">I am on the Bus</h2>
              <p className="text-sm text-gray-500">Help others by sharing live location</p>
            </div>
          </div>
        </Link>

        {/* CONSUMER CARD */}
        <Link href="/search">
          <div className="bg-white p-6 rounded-4xl shadow-lg border-2 border-transparent hover:border-green-500 cursor-pointer transition-all flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-full text-slate-400">
              <Navigation size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-500">Find a Bus</h2>
              <p className="text-sm text-gray-500 ">Locate live buses on your route</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}