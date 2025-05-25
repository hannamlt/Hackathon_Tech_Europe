"use client";

import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Bell, 
  Heart, 
  FileText,
  Edit3,
  Settings as SettingsIcon,
  LogOut
} from "lucide-react";
import Link from "next/link";

export function Settings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-6">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative flex items-center justify-between mb-4">
          <Link href="/" className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </Link>
          <h1 className="text-white text-xl font-bold">Mon Profil</h1>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <SettingsIcon size={20} className="text-white" />
          </div>
        </div>

        {/* Avatar et info utilisateur */}
        <div className="relative text-center">
          <div className="bg-white/20 backdrop-blur-md rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
            <User size={40} className="text-white" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-1">Bela Wiertz</h2>
          <p className="text-white/70 text-sm">Membre depuis janvier 2024</p>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="px-6 -mt-4 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Informations personnelles</h3>
            <button className="bg-blue-50 rounded-full p-2 hover:bg-blue-100 transition-colors">
              <Edit3 size={16} className="text-blue-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
              <div className="bg-blue-100 rounded-full p-2">
                <User size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-xs font-medium">Nom complet</p>
                <p className="text-gray-800 font-medium">Bela Wiertz </p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
              <div className="bg-blue-100 rounded-full p-2">
                <Mail size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-xs font-medium">Email</p>
                <p className="text-gray-800 font-medium">bela.wiertz@email.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
              <div className="bg-green-100 rounded-full p-2">
                <Phone size={18} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-xs font-medium">Téléphone</p>
                <p className="text-gray-800 font-medium">+33 6 12 34 56 78</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
              <div className="bg-purple-100 rounded-full p-2">
                <Calendar size={18} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-xs font-medium">Date de naissance</p>
                <p className="text-gray-800 font-medium">15 mars 1990</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
              <div className="bg-orange-100 rounded-full p-2">
                <MapPin size={18} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-xs font-medium">Adresse</p>
                <p className="text-gray-800 font-medium">123 Rue de la Santé, 75014 Paris</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informations médicales */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Informations médicales</h3>
            <button className="bg-blue-50 rounded-full p-2 hover:bg-blue-100 transition-colors">
              <Edit3 size={16} className="text-blue-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-red-50 rounded-2xl">
              <div className="bg-red-100 rounded-full p-2">
                <Heart size={18} className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-xs font-medium">Groupe sanguin</p>
                <p className="text-gray-800 font-medium">O+</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-2xl">
              <div className="bg-yellow-100 rounded-full p-2">
                <Shield size={18} className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-xs font-medium">Allergies</p>
                <p className="text-gray-800 font-medium">Pénicilline, Pollen</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-2xl">
              <div className="bg-indigo-100 rounded-full p-2">
                <FileText size={18} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 text-xs font-medium">Médecin traitant</p>
                <p className="text-gray-800 font-medium">Dr. Sophie Dubois</p>
              </div>
            </div>
          </div>
        </div>

        {/* Options de compte */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Paramètres du compte</h3>

          <div className="space-y-3">
            <button className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="bg-blue-100 rounded-full p-2">
                <Bell size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-gray-800 font-medium">Notifications</p>
                <p className="text-gray-500 text-xs">Gérer vos préférences</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="bg-green-100 rounded-full p-2">
                <Shield size={18} className="text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-gray-800 font-medium">Confidentialité</p>
                <p className="text-gray-500 text-xs">Contrôlez vos données</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
              <div className="bg-purple-100 rounded-full p-2">
                <FileText size={18} className="text-purple-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-gray-800 font-medium">Historique médical</p>
                <p className="text-gray-500 text-xs">Consultez vos dossiers</p>
              </div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}