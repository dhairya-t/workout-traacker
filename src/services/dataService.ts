import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { Workout, WorkoutSession } from '../App';

const USER_ID = 'user1'; // Since it's just you, we'll use a fixed user ID

// Check if Firebase is properly configured and available
const useFirestore = isFirebaseConfigured();

// Type guard to ensure db is properly typed
const getDb = (): Firestore | null => {
  return (useFirestore && db) ? db : null;
};

// Workouts operations
export const saveWorkouts = async (workouts: Workout[]) => {
  const firestore = getDb();
  if (firestore) {
    try {
      await setDoc(doc(firestore, 'users', USER_ID), { workouts });
    } catch (error) {
      console.error('Error saving workouts to Firestore:', error);
      // Fallback to localStorage
      localStorage.setItem('workouts', JSON.stringify(workouts));
    }
  } else {
    localStorage.setItem('workouts', JSON.stringify(workouts));
  }
};

export const loadWorkouts = async (): Promise<Workout[]> => {
  const firestore = getDb();
  if (firestore) {
    try {
      const userDoc = await getDocs(collection(firestore, 'users'));
      const userData = userDoc.docs.find(doc => doc.id === USER_ID)?.data();
      return userData?.workouts || [];
    } catch (error) {
      console.error('Error loading workouts from Firestore:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('workouts');
      return saved ? JSON.parse(saved) : [];
    }
  } else {
    const saved = localStorage.getItem('workouts');
    return saved ? JSON.parse(saved) : [];
  }
};

// Sessions operations
export const saveSessions = async (sessions: WorkoutSession[]) => {
  const firestore = getDb();
  if (firestore) {
    try {
      await setDoc(doc(firestore, 'users', USER_ID, 'data', 'sessions'), { sessions });
    } catch (error) {
      console.error('Error saving sessions to Firestore:', error);
      localStorage.setItem('sessions', JSON.stringify(sessions));
    }
  } else {
    localStorage.setItem('sessions', JSON.stringify(sessions));
  }
};

export const loadSessions = async (): Promise<WorkoutSession[]> => {
  const firestore = getDb();
  if (firestore) {
    try {
      const sessionDoc = await getDocs(collection(firestore, 'users', USER_ID, 'data'));
      const sessionData = sessionDoc.docs.find(doc => doc.id === 'sessions')?.data();
      return sessionData?.sessions || [];
    } catch (error) {
      console.error('Error loading sessions from Firestore:', error);
      const saved = localStorage.getItem('sessions');
      return saved ? JSON.parse(saved) : [];
    }
  } else {
    const saved = localStorage.getItem('sessions');
    return saved ? JSON.parse(saved) : [];
  }
};

// Real-time listeners
export const subscribeToWorkouts = (callback: (workouts: Workout[]) => void) => {
  const firestore = getDb();
  if (firestore) {
    try {
      return onSnapshot(doc(firestore, 'users', USER_ID), (doc) => {
        const data = doc.data();
        callback(data?.workouts || []);
      });
    } catch (error) {
      console.error('Error subscribing to workouts:', error);
      return () => {}; // Return empty unsubscribe function
    }
  }
  return () => {}; // Return empty unsubscribe function for localStorage
};

export const subscribeToSessions = (callback: (sessions: WorkoutSession[]) => void) => {
  const firestore = getDb();
  if (firestore) {
    try {
      return onSnapshot(doc(firestore, 'users', USER_ID, 'data', 'sessions'), (doc) => {
        const data = doc.data();
        callback(data?.sessions || []);
      });
    } catch (error) {
      console.error('Error subscribing to sessions:', error);
      return () => {};
    }
  }
  return () => {};
};

// Migration helper - move localStorage data to Firestore
export const migrateLocalStorageToFirestore = async () => {
  const firestore = getDb();
  if (!firestore) return;
  
  try {
    const localWorkouts = localStorage.getItem('workouts');
    const localSessions = localStorage.getItem('sessions');
    
    if (localWorkouts) {
      await saveWorkouts(JSON.parse(localWorkouts));
      console.log('✅ Migrated workouts to Firestore');
    }
    
    if (localSessions) {
      await saveSessions(JSON.parse(localSessions));
      console.log('✅ Migrated sessions to Firestore');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}; 