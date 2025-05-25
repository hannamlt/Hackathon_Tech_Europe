"use client";

import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  Video,
  Phone,
  Plus,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

export function Appointments() {
  // Données d'exemple des rendez-vous
  const appointments = [
    {
      id: 1,
      type: "Consultation générale",
      doctor: "Dr. Sophie Dubois",
      date: "2025-05-26",
      time: "14:30",
      duration: "30 min",
      location: "Cabinet médical - 15 Rue de la Paix",
      status: "confirmed",
      mode: "physical"
    },
    {
      id: 2,
      type: "Suivi cardiologique",
      doctor: "Dr. Jean Martin",
      date: "2025-05-28",
      time: "10:00",
      duration: "45 min",
      location: "Téléconsultation",
      status: "pending",
      mode: "video"
    },
    {
      id: 3,
      type: "Consultation dermatologie",
      doctor: "Dr. Marie Lefort",
      date: "2025-06-02",
      time: "16:15",
      duration: "20 min",
      location: "Clinique Saint-Pierre - 42 Ave des Champs",
      status: "confirmed",
      mode: "physical"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return 'Inconnu';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
          <h1 className="text-white text-xl font-bold">Mes Rendez-vous</h1>
          <button className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {/* Statistiques */}
        <div className="relative text-center">
          <p className="text-white/80 text-sm font-medium">Total des rendez-vous</p>
          <p className="text-white text-3xl font-bold mb-2">{appointments.length}</p>
          <div className="flex justify-center gap-4 text-xs">
            <span className="text-green-200">
              {appointments.filter(apt => apt.status === 'confirmed').length} confirmés
            </span>
            <span className="text-yellow-200">
              {appointments.filter(apt => apt.status === 'pending').length} en attente
            </span>
          </div>
        </div>
      </div>

      {/* Liste des rendez-vous */}
      <div className="px-6 -mt-4 relative z-10">
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100">
              {/* Header de la carte */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {appointment.type}
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User size={16} />
                    <span className="text-sm font-medium">{appointment.doctor}</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                  {appointment.status === 'confirmed' && <CheckCircle size={12} className="inline mr-1" />}
                  {appointment.status === 'pending' && <AlertCircle size={12} className="inline mr-1" />}
                  {getStatusText(appointment.status)}
                </div>
              </div>

              {/* Informations de date et heure */}
              <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Calendar size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium capitalize">
                      {formatDate(appointment.date)}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock size={14} />
                        <span className="text-sm">{appointment.time}</span>
                      </div>
                      <span className="text-sm text-gray-500">({appointment.duration})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lieu et mode */}
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-gray-100 rounded-full p-2 mt-1">
                  {appointment.mode === 'video' ? (
                    <Video size={16} className="text-gray-600" />
                  ) : (
                    <MapPin size={16} className="text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-700 text-sm font-medium">
                    {appointment.mode === 'video' ? 'Téléconsultation' : 'Consultation physique'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {appointment.location}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                {appointment.mode === 'video' && (
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-2xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <Video size={16} />
                    Rejoindre
                  </button>
                )}
                {appointment.mode === 'physical' && (
                  <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-2xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <Phone size={16} />
                    Appeler
                  </button>
                )}
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-2xl font-medium hover:bg-gray-200 transition-colors">
                  Modifier
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bouton ajouter un rendez-vous */}
        <div className="mt-6 mb-20">
          <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-3xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3">
            <Plus size={24} />
            Prendre un nouveau rendez-vous
          </button>
        </div>
      </div>

    </div>
  );
}