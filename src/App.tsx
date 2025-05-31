import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import WorkoutManager from './components/WorkoutManager';
import WorkoutExecution from './components/WorkoutExecution';
import { Home, Dumbbell, Play } from 'lucide-react';

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

  useEffect(() => {
    const savedWorkouts = localStorage.getItem('workouts');
    const savedSessions = localStorage.getItem('sessions');
    
    if (savedWorkouts) {
      setWorkouts(JSON.parse(savedWorkouts));
    }
    
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(sessions));
  }, [sessions]);

  const addSession = (session: WorkoutSession) => {
    setSessions(prev => [...prev, session]);
  };

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
        {currentView === 'manage' && <WorkoutManager workouts={workouts} setWorkouts={setWorkouts} />}
        {currentView === 'execute' && <WorkoutExecution workouts={workouts} onAddSession={addSession} />}
      </main>
    </div>
  );
}

export default App;
