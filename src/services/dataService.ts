import { 
  doc, 
  getDoc,
  setDoc, 
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { Workout, WorkoutSession } from '../App';

const USER_ID = 'user1';

const useFirestore = isFirebaseConfigured();

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
      const userDoc = await getDoc(doc(firestore, 'users', USER_ID));
      const userData = userDoc.data();
      return userData?.workouts || [];
    } catch (error) {
      console.error('Error loading workouts from Firestore:', error);
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
      const sessionDoc = await getDoc(doc(firestore, 'users', USER_ID, 'data', 'sessions'));
      const sessionData = sessionDoc.data();
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
      return () => {};
    }
  }
  return () => {};
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
    }
    
    if (localSessions) {
      await saveSessions(JSON.parse(localSessions));
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}; 