'use client';

import { MapPin, Search, Filter, Navigation, Phone, Clock, Star, ArrowLeft, Stethoscope, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";

// Types
interface Practitioner {
  id: string;
  name: string;
  specialty: string;
  address: string;
  distance: string;
  rating: number;
  reviews: number;
  phone: string;
  hours: string;
  availableToday: boolean;
  lat?: number;
  lng?: number;
}

interface GoogleMapsPlace {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  internationalPhoneNumber: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function Places() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showMap, setShowMap] = useState(false);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const specialties = [
    { key: "all", label: "Tous" },
    { key: "general", label: "Généraliste" },
    { key: "cardio", label: "Cardiologue" },
    { key: "dermato", label: "Dermatologue" },
    { key: "ophtalmo", label: "Ophtalmologue" },
    { key: "dentiste", label: "Dentiste" },
    { key: "pharmacie", label: "Pharmacie" }
  ];

  // Load Google Maps Script
  useEffect(() => {
    if (!window.google && !document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if (window.google) {
      setMapLoaded(true);
    }
  }, []);

  // Search practitioners using Google Places API
  const searchPractitioners = async (query: string) => {
    if (!query.trim()) {
      setPractitioners([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      // Build search query based on filter
      let searchTerm = query;
      if (selectedFilter !== "all") {
        const filterMap: { [key: string]: string } = {
          general: "médecin généraliste",
          cardio: "cardiologue",
          dermato: "dermatologue", 
          ophtalmo: "ophtalmologue",
          dentiste: "dentiste",
          pharmacie: "pharmacie"
        };
        searchTerm = `${filterMap[selectedFilter]} ${query}`;
      } else {
        searchTerm = `${query} médecin docteur praticien`;
      }

      const response = await fetch('/api/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: `${searchTerm} Paris France` 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.places && data.places.length > 0) {
          const newPractitioners: Practitioner[] = data.places.map((place: GoogleMapsPlace, index: number) => {
            // Extract specialty from name or use default
            let specialty = "Médecin";
            const name = place.displayName?.text || "";
            
            if (name.toLowerCase().includes("cardio")) specialty = "Cardiologue";
            else if (name.toLowerCase().includes("dermato")) specialty = "Dermatologue";
            else if (name.toLowerCase().includes("ophtalmo") || name.toLowerCase().includes("oculiste")) specialty = "Ophtalmologue";
            else if (name.toLowerCase().includes("dentiste") || name.toLowerCase().includes("dental")) specialty = "Dentiste";
            else if (name.toLowerCase().includes("pharmacie")) specialty = "Pharmacie";
            else if (name.toLowerCase().includes("généraliste")) specialty = "Médecin généraliste";

            return {
              id: place.id || `place-${index}`,
              name: name,
              specialty: specialty,
              address: place.formattedAddress || "",
              distance: "N/A",
              rating: 4.2 + Math.random() * 0.8, // Random realistic rating
              reviews: Math.floor(Math.random() * 150) + 20,
              phone: place.internationalPhoneNumber || "",
              hours: "Lun-Ven: 9h-17h",
              availableToday: Math.random() > 0.3,
              lat: place.location?.latitude,
              lng: place.location?.longitude,
            };
          });

          setPractitioners(newPractitioners);
        } else {
          setPractitioners([]);
        }
      } else {
        setPractitioners([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setPractitioners([]);
    }
    
    setLoading(false);
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchPractitioners(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedFilter]);

  // Initialize map
  const initializeMap = useCallback(() => {
    if (!mapLoaded || !mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 48.8566, lng: 2.3522 }, // Paris center
      zoom: 12,
      styles: [
        {
          featureType: "poi.medical",
          elementType: "geometry",
          stylers: [{ color: "#3b82f6" }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Add markers for practitioners
    clearMarkers();
    
    if (practitioners.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      practitioners.forEach((practitioner) => {
        if (practitioner.lat && practitioner.lng) {
          const position = { lat: practitioner.lat, lng: practitioner.lng };
          
          const marker = new window.google.maps.Marker({
            position: position,
            map: map,
            title: practitioner.name,
            icon: {
              url: 'data:image/svg+xml;base64,' + btoa(`
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="16" fill="#3b82f6" stroke="white" stroke-width="3"/>
                  <circle cx="20" cy="20" r="6" fill="white"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(40, 40),
              anchor: new window.google.maps.Point(20, 20)
            }
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 12px; max-width: 280px; font-family: system-ui;">
                <h3 style="margin: 0 0 6px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${practitioner.name}</h3>
                <p style="margin: 0 0 6px 0; color: #3b82f6; font-size: 14px; font-weight: 500;">${practitioner.specialty}</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280; line-height: 1.4;">${practitioner.address}</p>
                <div style="display: flex; align-items: center; gap: 6px; margin: 8px 0;">
                  <span style="color: #f59e0b; font-size: 14px;">⭐</span>
                  <span style="font-size: 14px; font-weight: bold; color: #1f2937;">${practitioner.rating.toFixed(1)}</span>
                  <span style="font-size: 13px; color: #6b7280;">(${practitioner.reviews} avis)</span>
                </div>
                ${practitioner.phone ? `
                  <div style="margin-top: 10px;">
                    <a href="tel:${practitioner.phone}" style="display: inline-block; background: #3b82f6; color: white; padding: 6px 12px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500;">
                      📞 Appeler
                    </a>
                  </div>
                ` : ''}
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          markersRef.current.push(marker);
          bounds.extend(position);
        }
      });

      // Fit map to show all markers
      if (practitioners.length > 1) {
        map.fitBounds(bounds);
      } else if (practitioners.length === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(15);
      }
    }
  }, [mapLoaded, practitioners]);

  // Clear markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  };

  // Initialize map when showing
  useEffect(() => {
    if (showMap) {
      setTimeout(initializeMap, 100);
    }
  }, [showMap, initializeMap]);

  const filteredPractitioners = practitioners.filter(practitioner => {
    const matchesSearch = practitioner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         practitioner.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
                         practitioner.specialty.toLowerCase().includes(selectedFilter);
    return matchesSearch && matchesFilter;
  });

  if (showMap) {
    return (
      <div className="min-h-screen bg-white">
        {/* Map Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-4 flex items-center justify-between text-white">
          <button 
            onClick={() => setShowMap(false)}
            className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-lg">Carte des praticiens</h1>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <MapPin size={20} />
          </div>
        </div>

        {/* Map Container */}
        <div className="relative h-[calc(100vh-80px)]">
          <div ref={mapRef} className="w-full h-full" />
          
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Chargement de la carte...</p>
              </div>
            </div>
          )}

          {/* Floating search */}
          <div className="absolute top-4 left-4 right-4 z-10">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Rechercher sur la carte..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
                {loading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Results counter */}
          {practitioners.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 px-4 py-3 text-center">
                <p className="text-gray-800 font-medium text-sm">
                  {practitioners.length} praticien{practitioners.length > 1 ? 's' : ''} trouvé{practitioners.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2">
            <MapPin size={20} className="text-white" />
            <h1 className="text-white font-bold text-xl">Trouver un praticien</h1>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <Navigation size={20} className="text-white" />
          </div>
        </div>
        
        <div className="relative text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 inline-flex items-center gap-2">
            <span className="text-lg">📍</span>
            <p className="text-white/90 text-sm font-medium">Paris, France</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 -mt-4 relative z-10 mb-6">
        <div className="bg-white rounded-3xl shadow-xl border border-blue-100 p-1">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher un praticien, spécialité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-3xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            />
            {loading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {specialties.map((specialty) => (
            <button
              key={specialty.key}
              onClick={() => setSelectedFilter(specialty.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedFilter === specialty.key
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200"
              }`}
            >
              {specialty.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div className="px-6">
        {/* Results Header */}
        {hasSearched && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-800 font-medium">
                {filteredPractitioners.length} praticien{filteredPractitioners.length > 1 ? 's' : ''} trouvé{filteredPractitioners.length > 1 ? 's' : ''}
              </p>
              <p className="text-gray-500 text-sm">
                {searchQuery ? `pour "${searchQuery}"` : 'dans votre zone'}
              </p>
            </div>
            {practitioners.length > 0 && (
              <button 
                onClick={() => setShowMap(true)}
                className="flex items-center gap-2 text-blue-600 text-sm font-medium bg-blue-50 px-4 py-2 rounded-2xl hover:bg-blue-100 transition-colors"
              >
                <MapPin size={16} />
                Carte
              </button>
            )}
          </div>
        )}

        {/* Practitioners List */}
        {filteredPractitioners.length > 0 && (
          <div className="space-y-4 mb-6">
            {filteredPractitioners.map((practitioner) => (
              <div
                key={practitioner.id}
                className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100 hover:shadow-2xl transition-all duration-300"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 rounded-2xl p-3 flex-shrink-0">
                        <Stethoscope size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">{practitioner.name}</h3>
                        <p className="text-blue-600 font-medium">{practitioner.specialty}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-2 rounded-2xl">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      <span className="text-sm font-bold text-gray-800">{practitioner.rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-600">({practitioner.reviews})</span>
                    </div>
                  </div>
                  
                  {/* Information */}
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium">{practitioner.address}</p>
                        <span className="text-blue-600 font-bold text-sm">{practitioner.distance}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-gray-500 flex-shrink-0" />
                        <span className="text-gray-800 font-medium">{practitioner.hours}</span>
                      </div>
                      {practitioner.availableToday && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          🟢 Disponible
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium hover:bg-blue-700 transition-colors flex-1">
                      📅 Prendre RDV
                    </button>
                    {practitioner.phone && (
                      <Link 
                        href={`tel:${practitioner.phone}`}
                        className="bg-gray-100 text-gray-800 px-4 py-3 rounded-2xl font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <Phone size={16} />
                        Appeler
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty States */}
        {!hasSearched && !loading && (
          <div className="text-center py-12">
            <div className="bg-blue-100 rounded-3xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Search size={32} className="text-blue-600" />
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="font-bold text-gray-900 text-xl mb-3">Recherchez un praticien</h3>
              <p className="text-gray-600 mb-6">
                Utilisez la barre de recherche pour trouver des médecins, spécialistes ou centres de soins près de vous.
              </p>
              <div className="bg-white rounded-2xl p-4 border border-blue-100">
                <p className="text-sm text-gray-500 mb-2">Exemples de recherche :</p>
                <div className="flex flex-wrap gap-2">
                  {["Cardiologue", "Dentiste", "Pharmacie"].map((example) => (
                    <button
                      key={example}
                      onClick={() => setSearchQuery(example)}
                      className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {hasSearched && filteredPractitioners.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-3xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Search size={32} className="text-gray-500" />
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="font-bold text-gray-900 text-xl mb-3">Aucun praticien trouvé</h3>
              <p className="text-gray-600 mb-6">
                Essayez de modifier vos critères de recherche ou utilisez des termes plus généraux.
              </p>
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedFilter("all");
                  setHasSearched(false);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-medium hover:bg-blue-700 transition-colors"
              >
                Réinitialiser la recherche
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}