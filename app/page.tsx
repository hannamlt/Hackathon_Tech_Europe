import { CircleUserRound, MapPin, MessageCircle, Video, Stethoscope, Calendar } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 pb-12 pt-8">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        {/* Logo et branding dans le header */}
        <div className="relative flex items-center justify-center mb-6">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-xl p-2">
                <Stethoscope size={24} className="text-blue-600" />
              </div>
              <div>
              <h1 className="text-xl font-bold text-white">
                Second
                <span className="text-blue-400">Cortex</span>
              </h1>
                <p className="text-white/70 text-xs">Intelligent health assistant</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="relative text-center mb-8">
          <p className="text-white/80 text-sm font-medium">Hello,</p>
          <p className="text-white text-3xl font-bold">Bela !</p>
          <p className="text-white/60 text-sm mt-1">How are you today ?</p>
        </div>
        
        <div className="flex gap-4">
          <Link href="/settings" className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 flex-1 block hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-2">
              <CircleUserRound size={16} className="text-blue-200" />
              <span className="text-white/90 text-xs font-medium">My Profile</span>
            </div>
            <p className="text-white text-lg font-bold mt-1">Bela</p>
          </Link>
          <Link href="/rdv" className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 flex-1 block hover:bg-white/20 transition-colors">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-green-300" />
              <span className="text-white/90 text-xs font-medium">Appointments</span>
            </div>
            <p className="text-white text-lg font-bold mt-1">2</p>
          </Link>
        </div>
      </div>

      <div className="px-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">What would you like to do ?</h2>
        
        <div className="space-y-6">
          <Link href="/chat" className="block">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3">
                      <MessageCircle size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">Medical Chat</h3>
                      <p className="text-blue-100 text-sm">
                        Describe your symptoms to our AI
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-full p-3">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-4">
            <Link href="/consult" className="block">
              <div className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 hover:border-blue-200">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 mb-4 w-fit mx-auto">
                  <Video size={32} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2 text-center">Consultation</h3>
                <p className="text-gray-500 text-sm text-center">Video appointment with an AI doctor</p>
              </div>
            </Link>

            <Link href="/maps" className="block">
              <div className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100 hover:border-blue-200">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 mb-4 w-fit mx-auto">
                  <MapPin size={32} className="text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-800 mb-2 text-center">Locate</h3>
                <p className="text-gray-500 text-sm text-center">Find a practitioner near you</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8 mb-8">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-6 border border-blue-200 shadow-md">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2 mt-1">
              <span className="text-blue-600 text-lg">💡</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Advanced artificial intelligence</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our medical AI analyzes your symptoms with 95% accuracy and guides you to the specialists best suited to your situation.              </p>
            </div>
          </div>
        </div>
      </div>

      
    </main>
  );
}