import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { WorkoutSession } from '../App';
import { TrendingUp, Calendar, Dumbbell } from 'lucide-react';

interface DashboardProps {
  sessions: WorkoutSession[];
}

const Dashboard: React.FC<DashboardProps> = ({ sessions }) => {
  // Calculate stats
  const totalWorkouts = sessions.length;
  const thisWeekWorkouts = sessions.filter(session => {
    const sessionDate = new Date(session.date);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return sessionDate >= oneWeekAgo;
  }).length;

  // Prepare data for charts
  const workoutsByDate = sessions.reduce((acc, session) => {
    const date = new Date(session.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(workoutsByDate)
    .map(([date, count]) => ({ date, workouts: count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14); // Last 14 days

  // Volume progression (total sets * reps * weight)
  const volumeData = sessions.map(session => {
    const totalVolume = session.exercises.reduce((exerciseAcc, exercise) => {
      const exerciseVolume = exercise.sets.reduce((setAcc, set) => {
        return setAcc + (set.weight * set.reps);
      }, 0);
      return exerciseAcc + exerciseVolume;
    }, 0);
    
    return {
      date: new Date(session.date).toLocaleDateString(),
      volume: totalVolume,
      workout: session.workoutName
    };
  }).slice(-10); // Last 10 sessions

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Your Progress</h2>
        <p>Track your fitness journey with clean, simple metrics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Dumbbell size={24} />
          </div>
          <div className="stat-content">
            <h3>{totalWorkouts}</h3>
            <p>Total Workouts</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>{thisWeekWorkouts}</h3>
            <p>This Week</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{sessions.length > 0 ? 'Active' : 'Start'}</h3>
            <p>Status</p>
          </div>
        </div>
      </div>

      {sessions.length > 0 && (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Workout Frequency</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="workouts" fill="#000" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <h3>Volume Progression</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="volume" stroke="#000" strokeWidth={2} dot={{ fill: '#000', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
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