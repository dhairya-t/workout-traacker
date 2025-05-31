import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { WorkoutSession } from '../App';
import { TrendingUp, Calendar, Dumbbell, Target, Award, MapPin } from 'lucide-react';

interface DashboardProps {
  sessions: WorkoutSession[];
}

const Dashboard: React.FC<DashboardProps> = ({ sessions }) => {
  // Get current week sessions
  const getWeekSessions = () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return sessions.filter(session => new Date(session.date) >= oneWeekAgo);
  };

  const weekSessions = getWeekSessions();

  // Calculate workout streak (consecutive days with workouts)
  const calculateStreak = () => {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dateStr = currentDate.toDateString();
      const hasWorkout = sortedSessions.some(session => 
        new Date(session.date).toDateString() === dateStr
      );
      
      if (hasWorkout) {
        streak++;
      } else if (streak > 0) {
        break; // Streak broken
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  };

  // Calculate total distance this week (cardio exercises)
  const weeklyDistance = weekSessions.reduce((total, session) => {
    return total + session.exercises.reduce((sessionTotal, exercise) => {
      return sessionTotal + exercise.sets.reduce((setTotal, set) => {
        return setTotal + (set.distance || 0);
      }, 0);
    }, 0);
  }, 0);

  // Calculate total weight lifted this week (strength exercises)
  const weeklyWeight = weekSessions.reduce((total, session) => {
    return total + session.exercises.reduce((sessionTotal, exercise) => {
      return sessionTotal + exercise.sets.reduce((setTotal, set) => {
        return setTotal + (set.weight * set.reps);
      }, 0);
    }, 0);
  }, 0);

  // Find recent personal records (PRs)
  const findRecentPRs = () => {
    const exerciseBests = new Map<string, { weight: number, reps: number, date: string }>();
    
    // Sort sessions by date (oldest first)
    const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const prs: Array<{ exercise: string, weight: number, reps: number, date: string }> = [];
    
    sortedSessions.forEach(session => {
      session.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.weight > 0 && set.reps > 0) { // Only strength exercises
            const key = exercise.exerciseName.toLowerCase();
            const current = exerciseBests.get(key);
            
            // Check if this is a new weight PR
            if (!current || set.weight > current.weight) {
              exerciseBests.set(key, { weight: set.weight, reps: set.reps, date: session.date });
              
              // If it's recent (last 2 weeks), add to PRs list
              const twoWeeksAgo = new Date();
              twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
              if (new Date(session.date) >= twoWeeksAgo) {
                prs.push({
                  exercise: exercise.exerciseName,
                  weight: set.weight,
                  reps: set.reps,
                  date: session.date
                });
              }
            }
          }
        });
      });
    });
    
    return prs.slice(-3); // Last 3 PRs
  };

  const recentPRs = findRecentPRs();

  // Prepare data for workout consistency chart (last 4 weeks)
  const getWeeklyData = () => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      const weekSessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });
      
      const weekDistance = weekSessions.reduce((total, session) => {
        return total + session.exercises.reduce((sessionTotal, exercise) => {
          return sessionTotal + exercise.sets.reduce((setTotal, set) => {
            return setTotal + (set.distance || 0);
          }, 0);
        }, 0);
      }, 0);
      
      weeks.push({
        week: `Week ${4 - i}`,
        workouts: weekSessions.length,
        distance: Math.round(weekDistance * 10) / 10
      });
    }
    
    return weeks;
  };

  const weeklyData = getWeeklyData();

  // Average workout duration (estimated at 45min per workout for now)
  const avgDuration = weekSessions.length > 0 ? Math.round((weekSessions.length * 45) / 7) : 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your Progress</h2>
        <p>This week's achievements and recent milestones</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>{weekSessions.length}</h3>
            <p>Workouts This Week</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <h3>{calculateStreak()}</h3>
            <p>Day Streak</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <MapPin size={24} />
          </div>
          <div className="stat-content">
            <h3>{weeklyDistance.toFixed(1)}</h3>
            <p>Miles This Week</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Dumbbell size={24} />
          </div>
          <div className="stat-content">
            <h3>{Math.round(weeklyWeight / 1000)}k</h3>
            <p>lbs Lifted This Week</p>
          </div>
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Weekly Consistency</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="workouts" fill="#1a1a1a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>Weekly Distance</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value} mi`, 'Distance']} />
                  <Line type="monotone" dataKey="distance" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {recentPRs.length > 0 && (
        <div className="prs-section">
          <h3>Recent Personal Records 🏆</h3>
          <div className="prs-list">
            {recentPRs.map((pr, index) => (
              <div key={index} className="pr-item">
                <div className="pr-icon">
                  <Award size={20} />
                </div>
                <div className="pr-details">
                  <div className="pr-exercise">{pr.exercise}</div>
                  <div className="pr-stats">{pr.weight} lbs × {pr.reps} reps</div>
                  <div className="pr-date">{new Date(pr.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sessions.length === 0 && (
        <div className="empty-state">
          <Dumbbell size={48} />
          <h3>Ready to start?</h3>
          <p>Create your first workout plan in the Manage tab, then come back to track your progress.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 