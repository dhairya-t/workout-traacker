import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import WorkoutManager from './components/WorkoutManager';
import WorkoutExecution from './components/WorkoutExecution';
import { Home, Dumbbell, Play } from 'lucide-react';
import { 
  saveWorkouts, 
  loadWorkouts, 
  saveSessions, 
  loadSessions,
  subscribeToWorkouts,
  subscribeToSessions
} from './services/dataService';

export interface Exercise {
  id: string;
  name: string;
  type: 'strength' | 'cardio';
  // Strength fields
  sets?: number;
  repsMin?: number;
  repsMax?: number;
  // Cardio fields
  duration?: number; // in minutes
  distance?: number; // in miles/km
  resistance?: number; // resistance level
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: {
      weight: number;
      reps: number;
      duration?: number; // for cardio
      distance?: number; // for cardio
      resistance?: number; // for cardio
    }[];
  }[];
}

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'manage' | 'execute'>('dashboard');
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    const loadInitialData = async () => {
      try {
        const [loadedWorkouts, loadedSessions] = await Promise.all([
          loadWorkouts(),
          loadSessions()
        ]);
        
        setWorkouts(loadedWorkouts);
        setSessions(loadedSessions);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Set up real-time listeners
    const unsubscribeWorkouts = subscribeToWorkouts(setWorkouts);
    const unsubscribeSessions = subscribeToSessions(setSessions);

    // Cleanup listeners on unmount
    return () => {
      unsubscribeWorkouts();
      unsubscribeSessions();
    };
  }, []);

  // Manual save functions - only called when user makes changes
  const handleUpdateWorkouts = async (newWorkouts: Workout[]) => {
    setWorkouts(newWorkouts);
    await saveWorkouts(newWorkouts);
  };

  const addSession = async (session: WorkoutSession) => {
    const newSessions = [...sessions, session];
    setSessions(newSessions);
    await saveSessions(newSessions);
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="loading-spinner">
            <Dumbbell size={48} />
          </div>
          <h2>Loading your workouts...</h2>
          <p>Syncing data across devices</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <nav className="nav">
        <h1 className="logo">Minimal Gym</h1>
        <div className="nav-buttons">
          <button 
            className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <Home size={20} />
            Dashboard
          </button>
          <button 
            className={`nav-button ${currentView === 'manage' ? 'active' : ''}`}
            onClick={() => setCurrentView('manage')}
          >
            <Dumbbell size={20} />
            Manage
          </button>
          <button 
            className={`nav-button ${currentView === 'execute' ? 'active' : ''}`}
            onClick={() => setCurrentView('execute')}
          >
            <Play size={20} />
            Workout
          </button>
        </div>
      </nav>

      <main className="main">
        {currentView === 'dashboard' && <Dashboard sessions={sessions} />}
        {currentView === 'manage' && <WorkoutManager workouts={workouts} setWorkouts={handleUpdateWorkouts} />}
        {currentView === 'execute' && <WorkoutExecution workouts={workouts} onAddSession={addSession} />}
      </main>
    </div>
  );
}

export default App;
