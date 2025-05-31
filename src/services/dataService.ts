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

console.log('💾 DataService: Using Firestore?', useFirestore ? 'YES' : 'NO (localStorage)');

const getDb = (): Firestore | null => {
  return (useFirestore && db) ? db : null;
};

// Workouts operations
export const saveWorkouts = async (workouts: Workout[]) => {
  const firestore = getDb();
  if (firestore) {
    try {
      await setDoc(doc(firestore, 'users', USER_ID), { workouts, updatedAt: new Date().toISOString() }, { merge: true });
      console.log('✅ SAVED to Firebase:', workouts.length, 'workouts');
    } catch (error) {
      console.error('❌ Firebase save failed:', error);
      localStorage.setItem('workouts', JSON.stringify(workouts));
      console.log('📱 Fallback to localStorage');
    }
  } else {
    localStorage.setItem('workouts', JSON.stringify(workouts));
    console.log('📱 SAVED to localStorage:', workouts.length, 'workouts');
  }
};

export const loadWorkouts = async (): Promise<Workout[]> => {
  const firestore = getDb();
  if (firestore) {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', USER_ID));
      const userData = userDoc.data();
      const workouts = userData?.workouts || [];
      console.log('✅ LOADED from Firebase:', workouts.length, 'workouts');
      return workouts;
    } catch (error) {
      console.error('❌ Firebase load failed:', error);
      const saved = localStorage.getItem('workouts');
      const workouts = saved ? JSON.parse(saved) : [];
      console.log('📱 Fallback loaded from localStorage:', workouts.length, 'workouts');
      return workouts;
    }
  } else {
    const saved = localStorage.getItem('workouts');
    const workouts = saved ? JSON.parse(saved) : [];
    console.log('📱 LOADED from localStorage:', workouts.length, 'workouts');
    return workouts;
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
    const userDoc = await getDoc(doc(firestore, 'users', USER_ID));
    const remote = userDoc.data();
    const remoteUpdatedAt = new Date(remote?.updatedAt || 0).getTime();

    const localWorkoutsRaw = localStorage.getItem('workouts');
    if (localWorkoutsRaw) {
      const parsedLocal = JSON.parse(localWorkoutsRaw);
      const localWorkouts = parsedLocal.workouts || [];
      const localUpdatedAt = new Date(parsedLocal.updatedAt || 0).getTime();

      if (localUpdatedAt > remoteUpdatedAt) {
        await saveWorkouts(localWorkouts); // uses { merge: true }
        console.log('⬆️ Migrated localStorage to Firestore (local was newer)');
      } else {
        console.log('⚠️ Skipped migration — Firestore data is newer or equal');
      }
    }

    // Repeat same logic for sessions if needed
    const localSessionsRaw = localStorage.getItem('sessions');
    if (localSessionsRaw) {
      const parsedSessions = JSON.parse(localSessionsRaw);
      // Assuming you're not comparing timestamps here yet
      await saveSessions(parsedSessions);
    }

  } catch (error) {
    console.error('Migration error:', error);
  }
};