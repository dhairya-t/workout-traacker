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

console.log('💾 DataService: Using Firestore?', useFirestore ? 'YES' : 'NO - ERROR!');

const getDb = (): Firestore | null => {
  return (useFirestore && db) ? db : null;
};

// Workouts operations - Firebase only
export const saveWorkouts = async (workouts: Workout[]) => {
  const firestore = getDb();
  if (!firestore) {
    throw new Error('Firebase not configured - cannot save workouts');
  }
  
  try {
    await setDoc(doc(firestore, 'users', USER_ID), { workouts });
    console.log('✅ SAVED to Firebase:', workouts.length, 'workouts');
  } catch (error) {
    console.error('❌ Firebase save failed:', error);
    throw error;
  }
};

export const loadWorkouts = async (): Promise<Workout[]> => {
  const firestore = getDb();
  if (!firestore) {
    console.log('⚠️ Firebase not configured - returning empty array');
    return [];
  }
  
  try {
    const userDoc = await getDoc(doc(firestore, 'users', USER_ID));
    const userData = userDoc.data();
    const workouts = userData?.workouts || [];
    console.log('✅ LOADED from Firebase:', workouts.length, 'workouts');
    return workouts;
  } catch (error) {
    console.error('❌ Firebase load failed:', error);
    return [];
  }
};

// Sessions operations - Firebase only
export const saveSessions = async (sessions: WorkoutSession[]) => {
  const firestore = getDb();
  if (!firestore) {
    throw new Error('Firebase not configured - cannot save sessions');
  }
  
  try {
    await setDoc(doc(firestore, 'users', USER_ID, 'data', 'sessions'), { sessions });
    console.log('✅ SAVED sessions to Firebase:', sessions.length, 'sessions');
  } catch (error) {
    console.error('❌ Firebase session save failed:', error);
    throw error;
  }
};

export const loadSessions = async (): Promise<WorkoutSession[]> => {
  const firestore = getDb();
  if (!firestore) {
    console.log('⚠️ Firebase not configured - returning empty sessions');
    return [];
  }
  
  try {
    const sessionDoc = await getDoc(doc(firestore, 'users', USER_ID, 'data', 'sessions'));
    const sessionData = sessionDoc.data();
    const sessions = sessionData?.sessions || [];
    console.log('✅ LOADED sessions from Firebase:', sessions.length, 'sessions');
    return sessions;
  } catch (error) {
    console.error('❌ Firebase session load failed:', error);
    return [];
  }
};

// Real-time listeners - Firebase only
export const subscribeToWorkouts = (callback: (workouts: Workout[]) => void) => {
  const firestore = getDb();
  if (!firestore) {
    console.log('⚠️ Firebase not configured - no real-time sync');
    return () => {};
  }
  
  try {
    return onSnapshot(doc(firestore, 'users', USER_ID), (doc) => {
      const data = doc.data();
      const workouts = data?.workouts || [];
      console.log('🔄 Real-time update - workouts:', workouts.length);
      callback(workouts);
    });
  } catch (error) {
    console.error('❌ Firebase subscription failed:', error);
    return () => {};
  }
};

export const subscribeToSessions = (callback: (sessions: WorkoutSession[]) => void) => {
  const firestore = getDb();
  if (!firestore) {
    console.log('⚠️ Firebase not configured - no real-time sync');
    return () => {};
  }
  
  try {
    return onSnapshot(doc(firestore, 'users', USER_ID, 'data', 'sessions'), (doc) => {
      const data = doc.data();
      const sessions = data?.sessions || [];
      console.log('🔄 Real-time update - sessions:', sessions.length);
      callback(sessions);
    });
  } catch (error) {
    console.error('❌ Firebase session subscription failed:', error);
    return () => {};
  }
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