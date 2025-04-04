import { useState } from "react";
import ChatScreen from './ChatScreen/ChatScreen';
import Sidebar from './SideBar/Sidebar';
import Preferences from './Preferences/Preferences';
import './Dashboard.scss';
import LearningPaths from "./LearningGoals/LearningPaths";
import Milestones from "./MIlestones/Milestones";
import Assessments from "./Assessments/Assessments";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(390);
  const [preferencesCollapsed, setPreferencesCollapsed] = useState(false);
  const [learningWidth, setLearningWidth] = useState(600);
  const [preferencesWidth, setPreferencesWidth] = useState(400);
  const [activeScreen, setActiveScreen] = useState("learning-goal"); // ✅ Default screen

  return (
    <div className="d-flex dashboard">
      {/* Left Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        toggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        width={sidebarWidth}
        setWidth={setSidebarWidth}
        setActiveScreen={setActiveScreen} // ✅ Pass down function
        setPreferencesCollapsed={setPreferencesCollapsed}
        style={{
          flexGrow: 1,  // Expands to take available space
          minWidth: "420px", // Prevents it from becoming too small
          transition: "width 0.3s ease-in-out", // Smooth resizing
        }}
      />

      {/* Resizable ChatScreen Wrapper */}
      <div
        className="chat-container"
        style={{
          flexGrow: 1,  // Expands to take available space
          minWidth: "320px", // Prevents it from becoming too small
          transition: "width 0.3s ease-in-out", // Smooth resizing
        }}
      >
        <ChatScreen />
      </div>

      {/* Right Preferences Panel */}
      {activeScreen === "preference" && <Preferences
        isCollapsed={preferencesCollapsed}
        togglePreferences={() => setPreferencesCollapsed(!preferencesCollapsed)}
        width={preferencesWidth}
        setWidth={setPreferencesWidth}
      />}
      {activeScreen === "learning-goal" && <LearningPaths
      isCollapsed={preferencesCollapsed}
      togglePreferences={() => setPreferencesCollapsed(!preferencesCollapsed)}
      width={learningWidth}
      setWidth={setLearningWidth}/>}

      {activeScreen === "milestones" && <Milestones
      isCollapsed={preferencesCollapsed}
      togglePreferences={() => setPreferencesCollapsed(!preferencesCollapsed)}
      width={preferencesWidth}
      setWidth={setPreferencesWidth}/>}

      {activeScreen === "assessments" && <Assessments
      isCollapsed={preferencesCollapsed}
      togglePreferences={() => setPreferencesCollapsed(!preferencesCollapsed)}
      width={learningWidth}
      setWidth={setLearningWidth}/>}

    </div>
  );
};

export default Dashboard;
