import React, { useState } from 'react';
import { Workout, WorkoutSession } from '../App';
import { Play, Check, ArrowRight, ArrowLeft, TrendingUp } from 'lucide-react';

interface WorkoutExecutionProps {
  workouts: Workout[];
  onAddSession: (session: WorkoutSession) => void;
}

const WorkoutExecution: React.FC<WorkoutExecutionProps> = ({ workouts, onAddSession }) => {
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [sessionData, setSessionData] = useState<{
    [exerciseId: string]: { weight: number; reps: number }[]
  }>({});
  const [isComplete, setIsComplete] = useState(false);
  const [allSessions, setAllSessions] = useState<WorkoutSession[]>([]);

  // Load sessions from localStorage to show previous performance
  React.useEffect(() => {
    const savedSessions = localStorage.getItem('sessions');
    if (savedSessions) {
      setAllSessions(JSON.parse(savedSessions));
    }
  }, []);

  const startWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setSessionData({});
    setIsComplete(false);
  };

  const currentExercise = selectedWorkout?.exercises[currentExerciseIndex];
  const currentSet = currentSetIndex + 1;
  const totalSets = currentExercise?.sets || 0;

  // Find the last performance for the current exercise across ALL workouts
  const getLastPerformance = (exerciseName: string) => {
    const relevantSessions = allSessions
      .filter(session => session.exercises.some(ex => ex.exerciseName.toLowerCase() === exerciseName.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (relevantSessions.length === 0) return null;

    const lastSession = relevantSessions[0];
    const exerciseData = lastSession.exercises.find(ex => ex.exerciseName.toLowerCase() === exerciseName.toLowerCase());
    
    if (!exerciseData || exerciseData.sets.length === 0) return null;

    return {
      sets: exerciseData.sets,
      date: new Date(lastSession.date).toLocaleDateString(),
      workoutName: lastSession.workoutName
    };
  };

  const recordSet = (weight: number, reps: number, duration?: number, distance?: number, resistance?: number) => {
    if (!currentExercise) return;

    if (currentExercise.type === 'strength') {
      setSessionData(prev => ({
        ...prev,
        [currentExercise.id]: [
          ...(prev[currentExercise.id] || []),
          { weight, reps }
        ]
      }));
    } else {
      // For cardio, store in a different format
      setSessionData(prev => ({
        ...prev,
        [currentExercise.id]: [
          ...(prev[currentExercise.id] || []),
          { 
            weight: 0, // Not used for cardio
            reps: 0,   // Not used for cardio
            duration: duration || 0,
            distance: distance || 0,
            resistance: resistance || 0
          }
        ]
      }));
    }

    // Move to next set or exercise
    if (currentSetIndex < totalSets - 1) {
      setCurrentSetIndex(prev => prev + 1);
    } else {
      // Move to next exercise
      if (currentExerciseIndex < selectedWorkout!.exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSetIndex(0);
      } else {
        // Workout complete
        completeWorkout();
      }
    }
  };

  // Get the weight from the previous set in the current exercise
  const getPreviousSetWeight = () => {
    if (!currentExercise || currentExercise.type !== 'strength') return undefined;
    const currentExerciseSets = sessionData[currentExercise.id];
    if (currentExerciseSets && currentExerciseSets.length > 0) {
      return currentExerciseSets[currentExerciseSets.length - 1].weight;
    }
    return lastPerformance?.sets[0]?.weight;
  };

  const completeWorkout = () => {
    if (!selectedWorkout) return;

    const session: WorkoutSession = {
      id: Date.now().toString(),
      workoutId: selectedWorkout.id,
      workoutName: selectedWorkout.name,
      date: new Date().toISOString(),
      exercises: selectedWorkout.exercises.map(exercise => ({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: sessionData[exercise.id] || []
      }))
    };

    onAddSession(session);
    setIsComplete(true);
  };

  const resetWorkout = () => {
    setSelectedWorkout(null);
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    setSessionData({});
    setIsComplete(false);
  };

  const goToPreviousSet = () => {
    if (currentSetIndex > 0) {
      setCurrentSetIndex(prev => prev - 1);
      // Remove the last recorded set for this exercise
      if (currentExercise) {
        setSessionData(prev => ({
          ...prev,
          [currentExercise.id]: (prev[currentExercise.id] || []).slice(0, -1)
        }));
      }
    } else if (currentExerciseIndex > 0) {
      const prevExercise = selectedWorkout!.exercises[currentExerciseIndex - 1];
      setCurrentExerciseIndex(prev => prev - 1);
      setCurrentSetIndex((prevExercise.sets || 1) - 1);
      // Remove the last recorded set for the previous exercise
      setSessionData(prev => ({
        ...prev,
        [prevExercise.id]: (prev[prevExercise.id] || []).slice(0, -1)
      }));
    }
  };

  const jumpToExercise = (exerciseIndex: number) => {
    setCurrentExerciseIndex(exerciseIndex);
    setCurrentSetIndex(0);
  };

  const canJumpToExercise = (exerciseIndex: number) => {
    // Can always go to any exercise that has been started, current exercise, or next exercise
    const exerciseHasBeenStarted = sessionData[selectedWorkout!.exercises[exerciseIndex].id]?.length > 0;
    const isCurrentExercise = exerciseIndex === currentExerciseIndex;
    const isNextExercise = exerciseIndex === currentExerciseIndex + 1;
    const isPreviousExercise = exerciseIndex === currentExerciseIndex - 1;
    
    return exerciseHasBeenStarted || isCurrentExercise || isNextExercise || isPreviousExercise;
  };

  if (isComplete) {
    return (
      <div className="workout-execution">
        <div className="completion-screen">
          <div className="completion-icon">
            <Check size={64} />
          </div>
          <h2>Workout Complete!</h2>
          <p>Great job finishing {selectedWorkout?.name}!</p>
          <button className="primary-button" onClick={resetWorkout}>
            Start Another Workout
          </button>
        </div>
      </div>
    );
  }

  if (!selectedWorkout) {
    return (
      <div className="workout-execution">
        <div className="execution-header">
          <h2>Start a Workout</h2>
          <p>Choose a workout plan to begin your session</p>
        </div>

        {workouts.length === 0 ? (
          <div className="empty-state">
            <Play size={48} />
            <h3>No workouts available</h3>
            <p>Create a workout plan in the Manage tab first.</p>
          </div>
        ) : (
          <div className="workout-selection">
            {workouts.map(workout => (
              <div key={workout.id} className="workout-option">
                <div className="workout-info">
                  <h3>{workout.name}</h3>
                  <p>{workout.exercises.length} exercises</p>
                  <div className="exercise-preview">
                    {workout.exercises.slice(0, 3).map(exercise => (
                      <span key={exercise.id} className="exercise-tag">
                        {exercise.name}
                      </span>
                    ))}
                    {workout.exercises.length > 3 && (
                      <span className="exercise-tag">+{workout.exercises.length - 3} more</span>
                    )}
                  </div>
                </div>
                <button 
                  className="start-button"
                  onClick={() => startWorkout(workout)}
                >
                  <Play size={20} />
                  Start
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const lastPerformance = currentExercise ? getLastPerformance(currentExercise.name) : null;

  return (
    <div className="workout-execution active">
      <div className="workout-progress">
        <div className="progress-header">
          <h2>{selectedWorkout.name}</h2>
          <button className="exit-button" onClick={resetWorkout}>Exit</button>
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${((currentExerciseIndex * totalSets + currentSetIndex) / 
                       (selectedWorkout.exercises.reduce((sum, ex) => sum + (ex.sets || 1), 0))) * 100}%` 
            }}
          />
        </div>
        
        <p className="progress-text">
          Exercise {currentExerciseIndex + 1} of {selectedWorkout.exercises.length} • 
          Set {currentSet} of {totalSets}
        </p>
      </div>

      <div className="current-exercise">
        <h3>{currentExercise?.name}</h3>
        {currentExercise?.type === 'strength' ? (
          <p className="target-reps">Target: {currentExercise?.repsMin}-{currentExercise?.repsMax} reps</p>
        ) : (
          <p className="target-reps">
            {currentExercise?.duration}min
            {currentExercise?.distance && ` • ${currentExercise.distance}mi`}
            {currentExercise?.resistance && ` • Resistance ${currentExercise.resistance}`}
          </p>
        )}
        
        {currentExercise?.notes && (
          <div className="exercise-notes-workout">
            <div className="notes-icon">📝</div>
            <p className="notes-content">{currentExercise.notes}</p>
          </div>
        )}
        
        {lastPerformance && (
          <div className="last-performance">
            <div className="performance-header">
              <TrendingUp size={16} />
              <span>Last time ({lastPerformance.workoutName}):</span>
            </div>
            <div className="performance-sets">
              {lastPerformance.sets.map((set, index) => (
                <div key={index} className="performance-set">
                  <span className="set-number">Set {index + 1}:</span>
                  {currentExercise?.type === 'strength' ? (
                    <span className="set-details">{set.weight} lbs × {set.reps} reps</span>
                  ) : (
                    <span className="set-details">
                      {set.duration}min
                      {set.distance ? ` • ${set.distance}mi` : ''}
                      {set.resistance ? ` • Resistance ${set.resistance}` : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="performance-date">on {lastPerformance.date}</p>
          </div>
        )}
        
        {currentExercise?.type === 'strength' ? (
          <SetInput 
            key={`${currentExercise.id}-${currentSetIndex}`}
            onRecord={recordSet}
            onGoBack={currentSetIndex > 0 || currentExerciseIndex > 0 ? goToPreviousSet : undefined}
            targetRepsMin={currentExercise?.repsMin || 0}
            targetRepsMax={currentExercise?.repsMax || 0}
            setNumber={currentSet}
            lastWeight={getPreviousSetWeight()}
          />
        ) : currentExercise ? (
          <CardioInput 
            key={`${currentExercise.id}-${currentSetIndex}`}
            onRecord={recordSet}
            onGoBack={currentSetIndex > 0 || currentExerciseIndex > 0 ? goToPreviousSet : undefined}
            targetDuration={currentExercise?.duration || 0}
            targetDistance={currentExercise?.distance}
            targetResistance={currentExercise?.resistance}
            setNumber={currentSet}
            lastPerformance={lastPerformance?.sets[0]}
          />
        ) : null}
      </div>

      <div className="exercise-list">
        <div className="exercise-list-header">
          <h4>Exercises</h4>
          <p className="skip-hint">Click any exercise to jump to it</p>
        </div>
        {selectedWorkout.exercises.map((exercise, index) => {
          const isClickable = canJumpToExercise(index);
          return (
            <div 
              key={exercise.id} 
              className={`exercise-progress ${
                index === currentExerciseIndex ? 'current' : 
                index < currentExerciseIndex ? 'completed' : 'upcoming'
              } ${isClickable ? 'clickable' : ''}`}
              onClick={() => isClickable && jumpToExercise(index)}
            >
              <span className="exercise-name">{exercise.name}</span>
              <span className="sets-progress">
                {sessionData[exercise.id]?.length || 0} / {exercise.sets} sets
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface SetInputProps {
  onRecord: (weight: number, reps: number) => void;
  onGoBack?: () => void;
  targetRepsMin: number;
  targetRepsMax: number;
  setNumber: number;
  lastWeight?: number;
}

const SetInput: React.FC<SetInputProps> = ({ onRecord, onGoBack, targetRepsMin, targetRepsMax, setNumber, lastWeight }) => {
  const [weight, setWeight] = useState(lastWeight ? lastWeight.toString() : '');
  const [reps, setReps] = useState(targetRepsMin.toString());

  // Update weight when lastWeight prop changes (from previous sets)
  React.useEffect(() => {
    if (lastWeight) {
      setWeight(lastWeight.toString());
    }
  }, [lastWeight]);

  const handleRecord = () => {
    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    
    if (weightNum > 0 && repsNum > 0) {
      onRecord(weightNum, repsNum);
      // Don't clear weight - it will be auto-filled from previous set
      setReps(targetRepsMin.toString());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRecord();
    }
  };

  return (
    <div className="set-input">
      <h4>Set {setNumber}</h4>
      
      <div className="input-group">
        <div className="input-field">
          <label>Weight (lbs/kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="0"
            autoFocus
          />
        </div>
        
        <div className="input-field">
          <label>Reps</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="0"
          />
        </div>
      </div>

      <div className="set-actions">
        {onGoBack && (
          <button className="secondary-button" onClick={onGoBack}>
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        <button 
          className="primary-button"
          onClick={handleRecord}
          disabled={!weight || !reps || parseFloat(weight) <= 0 || parseInt(reps) <= 0}
        >
          Record Set
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

interface CardioInputProps {
  onRecord: (weight: number, reps: number, duration?: number, distance?: number, resistance?: number) => void;
  onGoBack?: () => void;
  targetDuration: number;
  targetDistance?: number;
  targetResistance?: number;
  setNumber: number;
  lastPerformance?: any;
}

const CardioInput: React.FC<CardioInputProps> = ({ 
  onRecord, 
  onGoBack, 
  targetDuration, 
  targetDistance, 
  targetResistance, 
  setNumber,
  lastPerformance 
}) => {
  const [duration, setDuration] = useState(targetDuration.toString());
  const [distance, setDistance] = useState(targetDistance?.toString() || '');
  const [resistance, setResistance] = useState(targetResistance?.toString() || '');

  const handleRecord = () => {
    const durationNum = parseFloat(duration);
    const distanceNum = distance ? parseFloat(distance) : undefined;
    const resistanceNum = resistance ? parseInt(resistance) : undefined;
    
    if (durationNum > 0) {
      onRecord(0, 0, durationNum, distanceNum, resistanceNum);
      setDuration(targetDuration.toString());
      setDistance(targetDistance?.toString() || '');
      setResistance(targetResistance?.toString() || '');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRecord();
    }
  };

  return (
    <div className="set-input">
      <h4>Set {setNumber}</h4>
      
      <div className="input-group">
        <div className="input-field">
          <label>Duration (min)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="0"
            autoFocus
          />
        </div>
        
        {targetDistance !== undefined && (
          <div className="input-field">
            <label>Distance (mi)</label>
            <input
              type="number"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="0"
            />
          </div>
        )}

        {targetResistance !== undefined && (
          <div className="input-field">
            <label>Resistance</label>
            <input
              type="number"
              value={resistance}
              onChange={(e) => setResistance(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="0"
            />
          </div>
        )}
      </div>

      <div className="set-actions">
        {onGoBack && (
          <button className="secondary-button" onClick={onGoBack}>
            <ArrowLeft size={16} />
            Back
          </button>
        )}
        <button 
          className="primary-button"
          onClick={handleRecord}
          disabled={!duration || parseFloat(duration) <= 0}
        >
          Record Set
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default WorkoutExecution; 