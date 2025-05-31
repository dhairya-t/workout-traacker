import React, { useState } from 'react';
import { Workout, Exercise } from '../App';
import { Plus, Trash2, Edit3, Save, X, ChevronUp, ChevronDown } from 'lucide-react';

interface WorkoutManagerProps {
  workouts: Workout[];
  setWorkouts: React.Dispatch<React.SetStateAction<Workout[]>>;
}

const WorkoutManager: React.FC<WorkoutManagerProps> = ({ workouts, setWorkouts }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<string | null>(null);
  const [newWorkout, setNewWorkout] = useState<Omit<Workout, 'id'>>({
    name: '',
    exercises: []
  });

  // Get all unique exercise names for autocomplete
  const getAllExerciseNames = () => {
    const exerciseNames = new Set<string>();
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.name.trim()) {
          exerciseNames.add(exercise.name);
        }
      });
    });
    return Array.from(exerciseNames).sort();
  };

  const handleCreateWorkout = () => {
    if (newWorkout.name.trim() && newWorkout.exercises.length > 0) {
      const workout: Workout = {
        id: Date.now().toString(),
        ...newWorkout
      };
      setWorkouts(prev => [...prev, workout]);
      setNewWorkout({ name: '', exercises: [] });
      setIsCreating(false);
    }
  };

  const handleDeleteWorkout = (id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id));
  };

  const handleAddExercise = () => {
    const exercise: Exercise = {
      id: Date.now().toString(),
      name: '',
      type: 'strength',
      sets: 2,
      repsMin: 5,
      repsMax: 8,
      notes: ''
    };
    setNewWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, exercise]
    }));
  };

  const handleUpdateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((exercise, i) => {
        if (i === index) {
          const updated = { ...exercise, [field]: value };
          // Reset fields when changing type
          if (field === 'type') {
            if (value === 'strength') {
              updated.sets = 2;
              updated.repsMin = 5;
              updated.repsMax = 8;
              updated.duration = undefined;
              updated.distance = undefined;
              updated.resistance = undefined;
            } else {
              updated.duration = 30;
              updated.distance = undefined;
              updated.resistance = 5;
              updated.sets = undefined;
              updated.repsMin = undefined;
              updated.repsMax = undefined;
            }
          }
          return updated;
        }
        return exercise;
      })
    }));
  };

  const handleRemoveExercise = (index: number) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const moveExerciseUp = (index: number) => {
    if (index > 0) {
      setNewWorkout(prev => {
        const exercises = [...prev.exercises];
        [exercises[index - 1], exercises[index]] = [exercises[index], exercises[index - 1]];
        return { ...prev, exercises };
      });
    }
  };

  const moveExerciseDown = (index: number) => {
    if (index < newWorkout.exercises.length - 1) {
      setNewWorkout(prev => {
        const exercises = [...prev.exercises];
        [exercises[index], exercises[index + 1]] = [exercises[index + 1], exercises[index]];
        return { ...prev, exercises };
      });
    }
  };

  const startEdit = (workout: Workout) => {
    setNewWorkout({
      name: workout.name,
      exercises: [...workout.exercises]
    });
    setEditingWorkout(workout.id);
    setIsCreating(true);
  };

  const handleUpdateWorkout = () => {
    if (editingWorkout && newWorkout.name.trim() && newWorkout.exercises.length > 0) {
      setWorkouts(prev => prev.map(w => 
        w.id === editingWorkout 
          ? { ...w, name: newWorkout.name, exercises: newWorkout.exercises }
          : w
      ));
      setNewWorkout({ name: '', exercises: [] });
      setIsCreating(false);
      setEditingWorkout(null);
    }
  };

  const cancelEdit = () => {
    setNewWorkout({ name: '', exercises: [] });
    setIsCreating(false);
    setEditingWorkout(null);
  };

  return (
    <div className="workout-manager">
      <div className="manager-header">
        <h2>Manage Workouts</h2>
        <p>Create and customize your workout routines</p>
      </div>

      {!isCreating && (
        <button className="create-button" onClick={() => setIsCreating(true)}>
          <Plus size={20} />
          New Workout
        </button>
      )}

      {isCreating && (
        <div className="workout-form">
          <div className="form-header">
            <h3>{editingWorkout ? 'Edit Workout' : 'Create New Workout'}</h3>
            <button className="cancel-button" onClick={cancelEdit}>
              <X size={20} />
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Workout name (e.g., Upper Body, Legs, etc.)"
            value={newWorkout.name}
            onChange={(e) => setNewWorkout(prev => ({ ...prev, name: e.target.value }))}
            className="workout-name-input"
          />

          <div className="exercises-section">
            <div className="exercises-header">
              <h4>Exercises</h4>
              <button className="add-exercise-button" onClick={handleAddExercise}>
                <Plus size={16} />
                Add Exercise
              </button>
            </div>

            {newWorkout.exercises.map((exercise, index) => (
              <ExerciseForm
                key={exercise.id}
                exercise={exercise}
                index={index}
                allExerciseNames={getAllExerciseNames()}
                onUpdate={handleUpdateExercise}
                onRemove={handleRemoveExercise}
                onMoveUp={() => moveExerciseUp(index)}
                onMoveDown={() => moveExerciseDown(index)}
                canMoveUp={index > 0}
                canMoveDown={index < newWorkout.exercises.length - 1}
              />
            ))}
          </div>

          <div className="form-actions">
            <button 
              className="save-button"
              onClick={editingWorkout ? handleUpdateWorkout : handleCreateWorkout}
              disabled={!newWorkout.name.trim() || newWorkout.exercises.length === 0 || newWorkout.exercises.some(e => !e.name.trim())}
            >
              <Save size={16} />
              {editingWorkout ? 'Update Workout' : 'Create Workout'}
            </button>
          </div>
        </div>
      )}

      <div className="workouts-list">
        {workouts.map(workout => (
          <div key={workout.id} className="workout-card">
            <div className="workout-header">
              <h3>{workout.name}</h3>
              <div className="workout-actions">
                <button 
                  className="edit-button"
                  onClick={() => startEdit(workout)}
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  className="delete-button"
                  onClick={() => handleDeleteWorkout(workout.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="exercises-list">
              {workout.exercises.map(exercise => (
                <div key={exercise.id} className="exercise-item">
                  <div className="exercise-main">
                    <span className="exercise-name">{exercise.name}</span>
                    <span className="exercise-details">
                      {exercise.type === 'strength' 
                        ? `${exercise.sets} sets × ${exercise.repsMin}-${exercise.repsMax} reps`
                        : `${exercise.duration}min${exercise.distance ? ` • ${exercise.distance}mi` : ''}${exercise.resistance ? ` • Resistance ${exercise.resistance}` : ''}`
                      }
                    </span>
                  </div>
                  {exercise.notes && (
                    <div className="exercise-notes-display">
                      <span className="notes-label">Notes:</span>
                      <span className="notes-text">{exercise.notes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {workouts.length === 0 && !isCreating && (
        <div className="empty-state">
          <Plus size={48} />
          <h3>No workouts yet</h3>
          <p>Create your first workout to get started with your fitness journey.</p>
        </div>
      )}
    </div>
  );
};

interface ExerciseFormProps {
  exercise: Exercise;
  index: number;
  allExerciseNames: string[];
  onUpdate: (index: number, field: keyof Exercise, value: string | number) => void;
  onRemove: (index: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({ exercise, index, allExerciseNames, onUpdate, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);

  const handleNameChange = (value: string) => {
    onUpdate(index, 'name', value);
    
    if (value.length > 0) {
      const filtered = allExerciseNames.filter(name => 
        name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    onUpdate(index, 'name', suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="exercise-form">
      <div className="exercise-name-container">
        <input
          type="text"
          placeholder="Exercise name"
          value={exercise.name}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="exercise-input"
        />
        {showSuggestions && (
          <div className="exercise-suggestions">
            {filteredSuggestions.map((suggestion, i) => (
              <div 
                key={i}
                className="suggestion-item"
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      <select
        value={exercise.type}
        onChange={(e) => onUpdate(index, 'type', e.target.value as 'strength' | 'cardio')}
        className="exercise-type-select"
      >
        <option value="strength">Strength</option>
        <option value="cardio">Cardio</option>
      </select>

      <textarea
        placeholder="Notes (optional) - e.g., bench angle, machine settings, form cues..."
        value={exercise.notes || ''}
        onChange={(e) => onUpdate(index, 'notes', e.target.value)}
        className="exercise-notes"
        rows={2}
      />

      {exercise.type === 'strength' ? (
        <div className="exercise-numbers">
          <div className="number-input">
            <label>Sets</label>
            <input
              type="number"
              value={exercise.sets || 0}
              onChange={(e) => onUpdate(index, 'sets', parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
          <div className="number-input">
            <label>Reps Min</label>
            <input
              type="number"
              value={exercise.repsMin || 0}
              onChange={(e) => onUpdate(index, 'repsMin', parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
          <div className="number-input">
            <label>Reps Max</label>
            <input
              type="number"
              value={exercise.repsMax || 0}
              onChange={(e) => onUpdate(index, 'repsMax', parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
        </div>
      ) : (
        <div className="exercise-numbers">
          <div className="number-input">
            <label>Duration (min)</label>
            <input
              type="number"
              value={exercise.duration || 0}
              onChange={(e) => onUpdate(index, 'duration', parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
          <div className="number-input">
            <label>Distance (mi)</label>
            <input
              type="number"
              step="0.1"
              value={exercise.distance || ''}
              onChange={(e) => onUpdate(index, 'distance', parseFloat(e.target.value) || 0)}
              min="0"
            />
          </div>
          <div className="number-input">
            <label>Resistance</label>
            <input
              type="number"
              value={exercise.resistance || 0}
              onChange={(e) => onUpdate(index, 'resistance', parseInt(e.target.value) || 0)}
              min="0"
            />
          </div>
        </div>
      )}

      <div className="exercise-form-bottom">
        <div className="move-buttons">
          <button 
            className="move-up-button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="Move up"
          >
            <ChevronUp size={16} />
          </button>
          <button 
            className="move-down-button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="Move down"
          >
            <ChevronDown size={16} />
          </button>
        </div>

        <button 
          className="remove-exercise-button"
          onClick={() => onRemove(index)}
          title="Remove exercise"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default WorkoutManager; 