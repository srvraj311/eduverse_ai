import React, { useState } from "react";
import { FaArrowLeft, FaChevronDown, FaChevronUp } from "react-icons/fa";
import "./StudyPlan.scss";

// Reusable Resource List Component
const ResourceList = ({ title, resources, isVideo }) => {
  if (!resources || resources.length === 0) return <p>No {isVideo ? 'videos' : 'resources'} available</p>;

  return (
    <div className="resource-column">
      <h4>{title}</h4>
      <ul>
        {resources.map((resource, index) => (
          <li key={index}>
            <a href={resource} target="_blank" rel="noopener noreferrer">
              {isVideo ? `Video Tutorial ${index + 1}` : `Resource ${index + 1}`}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

const StudyPlan = ({ studyPlanData, onBack }) => {
  const [expandedTopics, setExpandedTopics] = useState({});

  if (!studyPlanData) return <p>No study plan available</p>;

  const toggleTopic = (topicIndex) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicIndex]: !prev[topicIndex],
    }));
  };

  return (
    <div className="study-plan-container">
      {/* Header Section */}
      <div className="study-plan-header">
        <button className="back-button" onClick={onBack}>
          <FaArrowLeft /> Back to Learning Paths
        </button>
        <h2>{studyPlanData.name} - {studyPlanData.course_duration} Study Plan</h2>
        <p className="study-plan-description">
          This structured learning plan will guide you through {studyPlanData.name} in {studyPlanData.course_duration}.
        </p>
      </div>

      {/* Study Plan Topics */}
      <div className="study-plan-content">
        {studyPlanData.topics?.map((topic, topicIndex) => {
          const isExpanded = !!expandedTopics[topicIndex];

          return (
            <div className="week-section" key={topicIndex}>
              {/* Week Header with Expand/Collapse */}
              <div className="week-header" onClick={() => toggleTopic(topicIndex)}>
                <h3>{topic.name}</h3>
                <p className="week-description">{topic.description}</p>
                <div className="week-toggle">
                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </div>

              {/* Expanded Content Section */}
              {isExpanded && (
                <div className="week-content">
                  <div className="week-details">
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{topic.time_required || 'N/A'} Hours</span>
                    </div>
                  </div>

                  {/* Subtopics Section */}
                  {topic.subtopics?.length > 0 ? (
                    <div className="subtopics-list">
                      <h4>Subtopics</h4>
                      {topic.subtopics.map((subtopic, subtopicIndex) => (
                        <div className="subtopic-item" key={subtopicIndex}>
                          <h5>{subtopic.name}</h5>
                          <p>{subtopic.description || "No description available"}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No subtopics available</p>
                  )}

                  {/* Resources Section */}
                  <div className="resource-section">
                    <ResourceList title="Reading Materials" resources={topic.links} />
                    <ResourceList title="Video Tutorials" resources={topic.videos} isVideo />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudyPlan;