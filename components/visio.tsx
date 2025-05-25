"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

export function Visio() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("Connexion en cours...");
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isCleaningUpRef = useRef(false);
  const recognitionActiveRef = useRef(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const waitingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const minSilenceDurationRef = useRef(2000); // 2 secondes de silence minimum
  const messageCountRef = useRef(0); // Compteur pour éviter les réponses automatiques

  // Fonction pour nettoyer les ressources
  const cleanupResources = useCallback(() => {
    if (isCleaningUpRef.current) return;
    isCleaningUpRef.current = true;

    console.log("Cleaning the resources...");

    // Arrêter la reconnaissance vocale
    if (recognitionRef.current && recognitionActiveRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionActiveRef.current = false;
      } catch (error) {
        console.warn("Recognition stop error:", error);
      }
    }

    // Arrêter la synthèse vocale
    if (speechSynthesis) {
      speechSynthesis.cancel();
    }
    speechSynthesisRef.current = null;

    // Arrêter le stream média
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.kind} stopped`);
      });
      mediaStreamRef.current = null;
    }

    // Nettoyer la vidéo
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset des états
    setIsListening(false);
    setIsRecording(false);
    setIsAISpeaking(false);
    setIsConnected(false);
    setConversationStarted(false);
    setIsWaitingForResponse(false);
    messageCountRef.current = 0;
    lastSpeechTimeRef.current = 0;
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }

    setTimeout(() => {
      isCleaningUpRef.current = false;
    }, 500);
  }, []);

  // Fonction pour obtenir une voix anglaise native
  const getEnglishVoice = useCallback(() => {
    const voices = speechSynthesis.getVoices();
    console.log("Available voices:", voices.map(v => `${v.name} - ${v.lang}`));
    
    // Priorité aux voix anglaises natives
    const englishVoices = voices.filter(voice => 
      voice.lang.startsWith('en-') && 
      (voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Apple'))
    );
    
    // Préférer les voix UK ou US
    const preferredVoice = englishVoices.find(voice => 
      voice.lang === 'en-GB' || voice.lang === 'en-US'
    ) || englishVoices[0] || voices[0];
    
    console.log("Selected voice:", preferredVoice?.name, preferredVoice?.lang);
    return preferredVoice;
  }, []);

  // Initialiser la webcam et les services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log("Initialization of the services...");
        
        // Charger les voix (important pour avoir les voix disponibles)
        if ('speechSynthesis' in window) {
          // Attendre que les voix soient chargées
          const loadVoices = () => {
            return new Promise<void>((resolve) => {
              const voices = speechSynthesis.getVoices();
              if (voices.length > 0) {
                resolve();
              } else {
                speechSynthesis.addEventListener('voiceschanged', () => {
                  resolve();
                }, { once: true });
              }
            });
          };
          
          await loadVoices();
          console.log("Voices loaded successfully");
        }
        
        // Initialiser la webcam
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        mediaStreamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Initialiser la reconnaissance vocale
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;
          recognitionRef.current.lang = 'en-US'; // Définir explicitement en anglais US

          recognitionRef.current.onstart = () => {
            console.log("Speech recognition started");
            recognitionActiveRef.current = true;
            setIsListening(true);
            setIsRecording(true);
          };

          recognitionRef.current.onresult = (event: any) => {
            console.log("Result received, number of results:", event.results.length);
            const lastResult = event.results[event.results.length - 1];
            
            // Mettre à jour le timestamp de la dernière parole
            lastSpeechTimeRef.current = Date.now();
            
            if (lastResult.isFinal) {
              const transcript = lastResult[0].transcript.trim();
              console.log("User said (final):", transcript);
              if (transcript.length > 0) {
                // Arrêter le timeout de waiting car on a une réponse
                if (waitingTimeoutRef.current) {
                  clearTimeout(waitingTimeoutRef.current);
                  waitingTimeoutRef.current = null;
                }
                setIsWaitingForResponse(false);
                handleUserSpeech(transcript);
              }
            } else {
              // Résultat intermédiaire - montrer que l'utilisateur parle
              const interimTranscript = lastResult[0].transcript;
              console.log("User speaking (interim):", interimTranscript);
              // Reset le timeout car l'utilisateur parle encore
              if (waitingTimeoutRef.current) {
                clearTimeout(waitingTimeoutRef.current);
              }
            }
          };

          recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            recognitionActiveRef.current = false;
            setIsListening(false);
            setIsRecording(false);
            
            // Redémarrer seulement si approprié
            if (event.error !== 'not-allowed' && event.error !== 'service-not-allowed' && 
                !isCleaningUpRef.current && conversationStarted && !isAISpeaking && !isMuted) {
              console.log("Attempting restart after error...");
              setTimeout(() => {
                if (!isCleaningUpRef.current && !recognitionActiveRef.current) {
                  startListening();
                }
              }, 2000);
            }
          };

          recognitionRef.current.onend = () => {
            console.log("Speech recognition ended");
            recognitionActiveRef.current = false;
            setIsListening(false);
            setIsRecording(false);
            
            // Si on attend une réponse et qu'il n'y a pas eu de parole récente
            if (isWaitingForResponse && (Date.now() - lastSpeechTimeRef.current) > minSilenceDurationRef.current) {
              console.log("Long silence detected, restarting listening...");
              if (!isCleaningUpRef.current && !isAISpeaking && !isMuted) {
                setTimeout(() => {
                  if (!isCleaningUpRef.current && !recognitionActiveRef.current) {
                    startListening();
                  }
                }, 1000);
              }
            } 
            // Sinon, redémarrer normalement seulement si la conversation est active
            else if (!isCleaningUpRef.current && conversationStarted && !isAISpeaking && !isMuted && !isWaitingForResponse) {
              console.log("Normal restart of listening...");
              setTimeout(() => {
                if (!isCleaningUpRef.current && !recognitionActiveRef.current) {
                  startListening();
                }
              }, 1500);
            }
          };
        } else {
          console.warn("Speech recognition not supported");
          setCurrentMessage("Speech recognition not supported on this browser");
        }
        
        setIsConnected(true);
        setCurrentMessage("Ready for consultation");
        
        // Démarrer automatiquement la conversation après un délai plus court
        setTimeout(() => {
          if (!isCleaningUpRef.current) {
            startAIConversation();
          }
        }, 1000);
        
      } catch (error) {
        console.error("Initialization error:", error);
        setCurrentMessage("Camera/microphone access error");
      }
    };

    initializeServices();

    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  const startAIConversation = useCallback(async () => {
    if (isCleaningUpRef.current) return;
    
    console.log("Starting AI conversation");
    setConversationStarted(true);
    const welcomeMessage = "Hello! I'm your AI medical assistant. How can I help you today?";
    setCurrentMessage(welcomeMessage);
    
    // Faire parler l'IA avec un délai plus long pour s'assurer que les voix sont chargées
    setTimeout(async () => {
      await speakMessage(welcomeMessage);
    }, 1000); // Délai plus long, l'écoute sera gérée par speakMessage
  }, []);

  const speakMessage = useCallback((message: string): Promise<void> => {
    return new Promise((resolve) => {
      if (isCleaningUpRef.current) {
        resolve();
        return;
      }

      if ('speechSynthesis' in window) {
        // Arrêter toute synthèse en cours
        speechSynthesis.cancel();
        
        console.log("AI speaking:", message.substring(0, 50) + "...");
        setIsAISpeaking(true);
        
        const utterance = new SpeechSynthesisUtterance(message);
        
        // Utiliser une voix anglaise native
        const englishVoice = getEnglishVoice();
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        // Paramètres pour un anglais natif
        utterance.lang = 'en-US'; // ou 'en-GB' selon préférence
        utterance.rate = 0.85; // Légèrement plus lent pour clarté
        utterance.pitch = 1.0;
        utterance.volume = 0.9; // Volume plus élevé
        
        utterance.onstart = () => {
          console.log("Voice synthesis started");
        };
        
        utterance.onend = () => {
          console.log("Voice synthesis complete");
          setIsAISpeaking(false);
          speechSynthesisRef.current = null;
          
          // Après que l'IA ait fini de parler, attendre la réponse de l'utilisateur
          setIsWaitingForResponse(true);
          lastSpeechTimeRef.current = Date.now();
          
          // Démarrer l'écoute après un court délai
          setTimeout(() => {
            if (!isCleaningUpRef.current && !isMuted) {
              startListening();
              
              // Timeout pour relancer si pas de réponse après 10 secondes
              waitingTimeoutRef.current = setTimeout(() => {
                if (isWaitingForResponse && !isAISpeaking) {
                  console.log("No response timeout, asking again...");
                  setIsWaitingForResponse(false);
                  const promptMessage = "I'm still here to help. Could you tell me more about your symptoms?";
                  setCurrentMessage(promptMessage);
                  speakMessage(promptMessage);
                }
              }, 10000);
            }
          }, 1500);
          
          resolve();
        };
        
        utterance.onerror = (error) => {
          console.error("Voice synthesis error:", error);
          setIsAISpeaking(false);
          speechSynthesisRef.current = null;
          resolve();
        };
        
        speechSynthesisRef.current = utterance;
        
        // Petit délai pour s'assurer que tout est prêt
        setTimeout(() => {
          speechSynthesis.speak(utterance);
        }, 100);
      } else {
        console.warn("Speech synthesis not supported");
        setIsAISpeaking(false);
        resolve();
      }
    });
  }, [getEnglishVoice]);

  const startListening = useCallback(() => {
    if (isCleaningUpRef.current || 
        !recognitionRef.current || 
        recognitionActiveRef.current || 
        isListening || 
        isAISpeaking || 
        isMuted) {
      console.log("Listening blocked:", {
        cleaning: isCleaningUpRef.current,
        noRecognition: !recognitionRef.current,
        alreadyActive: recognitionActiveRef.current,
        listening: isListening,
        aiSpeaking: isAISpeaking,
        muted: isMuted
      });
      return;
    }

    console.log("Starting user listening");
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error("Recognition start error:", error);
      recognitionActiveRef.current = false;
      
      setTimeout(() => {
        if (!isCleaningUpRef.current && !recognitionActiveRef.current && !isListening) {
          console.log("Retrying to start...");
          startListening();
        }
      }, 3000);
    }
  }, [isListening, isAISpeaking, isMuted]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && recognitionActiveRef.current) {
      console.log("Stopping user listening");
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.warn("Recognition stop error:", error);
      }
    }
  }, []);

  // État pour maintenir le contexte de conversation
  const [conversationContext, setConversationContext] = useState({
    currentTopic: '',
    askedQuestions: [],
    userSymptoms: [],
    severity: null,
    duration: null,
    stage: 'greeting' // greeting, listening
  });

  const handleUserSpeech = useCallback(async (transcript: string) => {
    if (isCleaningUpRef.current) return;
    
    console.log("Processing user message:", transcript);
    messageCountRef.current += 1;
    
    // Arrêter l'écoute ET le timeout
    stopListening();
    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }
    setIsWaitingForResponse(false);
    
    try {
      const lowerTranscript = transcript.toLowerCase();
      let aiResponse = "";
      let newContext = { ...conversationContext };

      // Analyser la réponse selon le contexte actuel
      if (newContext.stage === 'greeting') {
        // Première interaction - analyser les symptômes mentionnés
        if (lowerTranscript.includes('hello') || lowerTranscript.includes('hi') || lowerTranscript.includes('good')) {
          aiResponse = "Hello! I'm here to help with your health concerns. What brings you here today? Are you experiencing any symptoms?";
          newContext.stage = 'symptom_inquiry';
        } else {
          // L'utilisateur mentionne directement des symptômes
          const symptoms = extractSymptoms(lowerTranscript);
          if (symptoms.length > 0) {
            newContext.userSymptoms = symptoms;
            newContext.currentTopic = symptoms[0];
            newContext.stage = 'follow_up';
            aiResponse = generateSymptomResponse(symptoms[0], lowerTranscript);
          } else {
            aiResponse = "I see. Can you tell me more about what you're experiencing? What symptoms are bothering you?";
            newContext.stage = 'symptom_inquiry';
          }
        }
      } 
      else if (newContext.stage === 'symptom_inquiry') {
        // Recherche de symptômes dans la réponse
        const symptoms = extractSymptoms(lowerTranscript);
        if (symptoms.length > 0) {
          newContext.userSymptoms = [...newContext.userSymptoms, ...symptoms];
          newContext.currentTopic = symptoms[0];
          newContext.stage = 'follow_up';
          aiResponse = generateSymptomResponse(symptoms[0], lowerTranscript);
        } else {
          aiResponse = "I want to make sure I understand correctly. Could you describe your symptoms? For example, are you feeling pain, nausea, fatigue, or something else?";
        }
      }
      else if (newContext.stage === 'follow_up') {
        // Questions de suivi basées sur les réponses précédentes
        aiResponse = generateFollowUpResponse(lowerTranscript, newContext);
        
        // Vérifier si on a assez d'informations pour une évaluation
        if (newContext.severity && newContext.duration && newContext.userSymptoms.length > 0) {
          newContext.stage = 'assessment';
        }
      }
      else if (newContext.stage === 'assessment') {
        // Phase d'évaluation et recommandations
        aiResponse = generateAssessmentResponse(lowerTranscript, newContext);
      }

      // Mettre à jour le contexte
      setConversationContext(newContext);

      // Afficher et faire parler la réponse de l'IA
      setCurrentMessage(aiResponse);
      await speakMessage(aiResponse);

    } catch (error) {
      console.error('AI communication error:', error);
      
      const errorMessage = "I apologize, but I'm having trouble processing your request right now. Could you please repeat what you said?";
      setCurrentMessage(errorMessage);
      await speakMessage(errorMessage);
    }
  }, [stopListening, speakMessage, startListening, isMuted, conversationContext]);

  // Fonction pour extraire les symptômes du texte
  const extractSymptoms = useCallback((text: string) => {
    const symptoms = [];
    const lowerText = text.toLowerCase();
    
    const symptomKeywords = {
      'headache': ['headache', 'head hurt', 'head pain', 'migraine'],
      'fever': ['fever', 'temperature', 'hot', 'chills', 'shivering'],
      'cough': ['cough', 'coughing', 'throat', 'sore throat'],
      'pain': ['pain', 'hurt', 'ache', 'aching', 'sore'],
      'fatigue': ['tired', 'fatigue', 'exhausted', 'weak', 'weakness'],
      'nausea': ['nausea', 'nauseous', 'sick', 'vomit', 'throw up'],
      'dizziness': ['dizzy', 'dizziness', 'lightheaded', 'faint'],
      'shortness_of_breath': ['breath', 'breathing', 'breathe', 'air'],
      'chest_pain': ['chest pain', 'chest hurt', 'heart']
    };

    for (const [symptom, keywords] of Object.entries(symptomKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        symptoms.push(symptom);
      }
    }

    return symptoms;
  }, []);

  // Fonction pour générer une réponse spécifique aux symptômes
  const generateSymptomResponse = useCallback((symptom: string, originalText: string) => {
    const responses = {
      'headache': "I understand you have a headache. On a scale from 1 to 10, how would you rate the pain? And when did it start?",
      'fever': "You mentioned having a fever. Have you taken your temperature? Do you also have chills or body aches?",
      'cough': "I see you have a cough. Is it a dry cough or are you bringing up phlegm? Any difficulty breathing?",
      'pain': "You're experiencing pain. Can you tell me exactly where it hurts and how long you've had this pain?",
      'fatigue': "Fatigue can be concerning. How long have you been feeling this tired? Are you getting enough sleep?",
      'nausea': "Nausea can be very uncomfortable. Are you actually vomiting, or just feeling nauseous? Any stomach pain?",
      'dizziness': "Dizziness can have various causes. Do you feel like the room is spinning, or more like you might faint?",
      'shortness_of_breath': "Breathing difficulties are important to assess. Is this new for you? Any chest pain with it?",
      'chest_pain': "Chest pain needs immediate attention. Can you describe the pain? Is it sharp, dull, or crushing?"
    };

    return responses[symptom] || `I understand you're experiencing ${symptom}. Can you tell me more about when this started and how severe it is?`;
  }, []);

  // Fonction pour générer des réponses de suivi contextuelles
  const generateFollowUpResponse = useCallback((text: string, context: any) => {
    const lowerText = text.toLowerCase();
    
    // Extraire les informations de sévérité
    if (!context.severity && (lowerText.match(/\d+/) || lowerText.includes('severe') || lowerText.includes('mild'))) {
      const numberMatch = lowerText.match(/(\d+)/);
      if (numberMatch) {
        context.severity = parseInt(numberMatch[1]);
        if (context.severity >= 7) {
          return "A severity of " + context.severity + " is quite high. Have you tried any medication for this? How long has it been this severe?";
        } else if (context.severity >= 4) {
          return "That's a moderate level of discomfort. What seems to make it better or worse?";
        } else {
          return "That's manageable pain. Any other symptoms you're experiencing along with this?";
        }
      }
    }

    // Extraire les informations de durée
    if (!context.duration && (lowerText.includes('day') || lowerText.includes('week') || lowerText.includes('hour'))) {
      context.duration = text.match(/(few|several|\d+)\s*(hour|day|week|month)/i)?.[0] || 'recently';
      return `So this has been going on for ${context.duration}. That's helpful to know. Any triggers you've noticed that make it worse?`;
    }

    // Questions de suivi contextuelles
    const followUpQuestions = [
      "What makes your symptoms better or worse?",
      "Have you taken any medication for this?",
      "Any other symptoms you're experiencing?",
      "Does this interfere with your daily activities?",
      "Have you had similar episodes before?"
    ];

    // Éviter de répéter les questions déjà posées
    const availableQuestions = followUpQuestions.filter(q => !context.askedQuestions.includes(q));
    if (availableQuestions.length > 0) {
      const selectedQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
      context.askedQuestions.push(selectedQuestion);
      return `I see. ${selectedQuestion}`;
    }

    return "Based on what you've told me, let me provide some recommendations...";
  }, []);

  // Fonction pour générer une évaluation et des recommandations
  const generateAssessmentResponse = useCallback((text: string, context: any) => {
    const { userSymptoms, severity } = context;
    
    // Recommandations basées sur les symptômes et la sévérité
    if (userSymptoms.includes('chest_pain') || (severity && severity >= 8)) {
      return "Based on your symptoms, I recommend seeking immediate medical attention. Please consider visiting an emergency room or calling emergency services.";
    } else if (userSymptoms.includes('fever') && userSymptoms.includes('shortness_of_breath')) {
      return "The combination of fever and breathing difficulties warrants prompt medical evaluation. I'd suggest contacting your doctor today or visiting urgent care.";
    } else if (severity && severity >= 6) {
      return "Your symptom severity suggests you should see a healthcare provider within the next day or two. In the meantime, rest and stay hydrated.";
    } else {
      return "Your symptoms seem manageable for now. Monitor them closely, and if they worsen or persist beyond a few days, consider seeing your doctor. Is there anything else you'd like to discuss?";
    }
  }, []);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    console.log(`Microphone ${newMutedState ? 'muted' : 'enabled'}`);
    
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !newMutedState;
      });
    }
    
    if (newMutedState) {
      stopListening();
    } else if (conversationStarted && !isAISpeaking) {
      setTimeout(() => {
        startListening();
      }, 500);
    }
  }, [isMuted, conversationStarted, stopListening, startListening, isAISpeaking]);

  const toggleVideo = useCallback(() => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);
    
    console.log(`Video ${newVideoState ? 'enabled' : 'disabled'}`);
    
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = newVideoState;
      });
    }
  }, [isVideoOn]);

  const endCall = useCallback(() => {
    console.log("End call requested");
    cleanupResources();
  }, [cleanupResources]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-6 py-6">
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative flex items-center justify-between">
          <Link href="/" className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
            <ArrowLeft size={20} className="text-white" />
          </Link>
          <h1 className="text-white text-xl font-bold">AI Consultation</h1>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
        </div>
      </div>

      {/* Zone vidéo principale */}
      <div className="px-6 py-8">
        <div className="bg-black rounded-3xl overflow-hidden shadow-2xl mb-6 relative">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-80 object-cover"
            style={{ display: isVideoOn ? 'block' : 'none' }}
          />
          {!isVideoOn && (
            <div className="w-full h-80 bg-gray-800 flex items-center justify-center">
              <div className="bg-gray-600 rounded-full p-8">
                <VideoOff size={48} className="text-gray-400" />
              </div>
            </div>
          )}
          
          {/* Indicateurs d'état */}
          <div className="absolute top-4 right-4 flex gap-2">
            {isRecording && (
              <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                {isListening ? 'LISTENING' : 'RECORDING'}
              </div>
            )}
            {isAISpeaking && (
              <div className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                AI SPEAKING
              </div>
            )}
          </div>
        </div>

        {/* Message de l'IA */}
        <div className="bg-white rounded-3xl shadow-xl p-6 border border-blue-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 rounded-full p-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 mb-2">SecondCortex Medical Assistant</h3>
              <p className="text-gray-700 leading-relaxed">{currentMessage}</p>
              {isAISpeaking && (
                <div className="mt-2 flex items-center gap-2 text-blue-600 text-sm">
                  <div className="flex gap-1">
                    <div className="w-1 h-3 bg-blue-600 rounded animate-pulse"></div>
                    <div className="w-1 h-3 bg-blue-600 rounded animate-pulse" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-3 bg-blue-600 rounded animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  AI is speaking
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full shadow-lg transition-all duration-300 ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-700'
            } ${isListening ? 'ring-2 ring-green-400' : ''}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full shadow-lg transition-all duration-300 ${
              !isVideoOn 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-700'
            }`}
          >
            {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
          
          <Link
            href="/"
            onClick={endCall}
            className="p-4 bg-red-500 hover:bg-red-600 rounded-full shadow-lg transition-all duration-300 text-white"
          >
            <PhoneOff size={24} />
          </Link>
        </div>

        {/* Informations de session */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800 mb-1">Active Session</h3>
              <p className="text-gray-600 text-sm">
                {isMuted ? 'Microphone is muted' :
                 isWaitingForResponse ? 'Waiting for your response...' :
                 isListening ? 'Listening to you...' : 
                 isAISpeaking ? 'AI is responding' : 
                 conversationStarted ? 'Consultation in progress' : 'Waiting'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-800 font-bold">
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-gray-500 text-xs">
                {conversationStarted ? 'AI Active' : 'Waiting'}
              </p>
            </div>
          </div>
        </div>

        {/* Instructions pour l'utilisateur */}
        {conversationStarted && !isAISpeaking && !isMuted && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-green-800 text-sm text-center">
              {isWaitingForResponse ? 
                "💬 Your turn! Please share your symptoms or answer the question..." :
                isListening ? 
                "🎤 Speak now, the AI is listening..." : 
                "🔄 The AI will start listening again soon..."
              }
            </p>
          </div>
        )}

        {isMuted && conversationStarted && (
          <div className="mt-4 bg-orange-50 border border-orange-200 rounded-2xl p-4">
            <p className="text-orange-800 text-sm text-center">
              🔇 Microphone muted - Reactivate it to continue the conversation
            </p>
          </div>
        )}
      </div>
    </div>
  );
}