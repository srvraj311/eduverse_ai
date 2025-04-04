import React, { useEffect, useState } from "react";
import { Card, Container, Button } from "react-bootstrap";
import { saveLearningPath, getAllLearningGoals, askQuestion } from "../../../api";
import { useSelector, useDispatch } from "react-redux";
import { setChatHistory, setIsGenerating, setIsLearningPathQuery, setLearningGoals, setStreamChat } from "../../../globalSlice";
import { PlusCircle, Repeat } from "react-bootstrap-icons";

const LearningPath = ({ content, refreshChat }) => {
  const [isSaved, setIsSaved] = useState(false);
  const learningGoals = useSelector((state) => state.global.learningGoals);
  const dispatch = useDispatch();
  const isSelfyQuiz = useSelector((state) => state.global.isQuizQuery);
  const isLearningPathQuery = useSelector((state) => state.global.isLearningPathQuery);
  const chatHistory = useSelector((state) => state.global.chatHistory);

  useEffect(() => {
    const checkSaved = () => {
      if (learningGoals && content && content.name) {
        const goalExists = learningGoals.some((goal) => goal.name === content.name);
        setIsSaved(goalExists);
      }
    };
    checkSaved();
  }, [learningGoals, content]);

  useEffect(() => {
    const fetchLearningGoals = async () => {
      try {
        const goals = await getAllLearningGoals();
        dispatch(setLearningGoals(goals));
      } catch (error) {
        console.error(error);
      }
    };
    fetchLearningGoals();
  }, [dispatch]);

  const handleSave = async () => {
    try {
      await saveLearningPath(content, content.name); // Using content.name as learning goal name
      const goals = await getAllLearningGoals();
      dispatch(setLearningGoals(goals));
      setIsSaved(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRegenrate = async () => {
      const updatedHistory = [
        ...chatHistory,
        { role: "user", content: "Regenrate", type: "content", isLearningPathQuery },
        { role: "assistant", content: "", type: "streaming" }
      ];
      const message = localStorage.getItem("lastMessage");
      dispatch(setChatHistory(updatedHistory));
      dispatch(setIsGenerating(true));
      try {
        await askQuestion(
          message,
          (partialResponse) => {
            dispatch(setStreamChat(partialResponse));
          },
          () => {
            refreshChat(); 
            dispatch(setIsGenerating(false));
            dispatch(setIsLearningPathQuery(false));
          },isSelfyQuiz, true
  
        );
      } catch (error) {
        console.error("Error sending message:", error);
      }
  }

  if (!content || !content.topics) return null;

  return (
    <Container className="mt-3">
      <Card className="p-3 mb-4 bg-light text-dark">
        <Card.Body>
          <Card.Title className="h4">{content.name || "Learning Path"}</Card.Title>
          <Card.Subtitle className="mb-2 text-muted">
            Duration: {content.course_duration || "N/A"}
          </Card.Subtitle>
        </Card.Body>
      </Card>

      <div className="d-flex flex-column " style={{ maxWidth: "700px" }}>
        {content.topics.map((topic, index) => (
          <Card key={index} className="mb-3 bg-light w-100">
            <Card.Body>
              <h3>{topic.name}</h3>
              <h5>{topic.description}</h5>
              <p><strong>Time Required:</strong> {topic.time_required}</p>

              {/* Links Section */}
              {topic.links && topic.links.length > 0 && (
                <div>
                  <h6>Resources:</h6>
                  <ul>
                    {topic.links.map((link, i) => (
                      <li key={i}><a href={link} target="_blank" rel="noopener noreferrer">{link}</a></li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Videos Section */}
              {topic.videos && topic.videos.length > 0 && (
                <div>
                  <h6>Videos:</h6>
                  <ul>
                    {topic.videos.map((video, i) => (
                      <li key={i}><a href={video} target="_blank" rel="noopener noreferrer">{video}</a></li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Subtopics Section */}
              {topic.subtopics && topic.subtopics.length > 0 && (
                <div>
                  <h6>Subtopics:</h6>
                  <ul>
                    {topic.subtopics.map((sub, i) => (
                      <li key={i}>{sub.name} - {sub.description}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Conditional Rendering for Save or Saved */}
      {isSaved ? (
        <div className="mx-2" style={{marginTop: '-15px'}}>
          <span style={{fontSize: "0.85rem", color: "green" }}>Saved</span>
        </div>
      ) : (
        <Card className="bg-white p-3 mb-3 border-0" style={{
          width: "47%",
          // border: "2px solid 'grey'",
          // borderRadius: '25px',
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          top: '-15px',
          left: '-20px'
        }}>
        <Button
          variant="outline-primary"
          className="mt-0 mx-1 rounded-pill"
          style={{ height: '32px', minWidth: "160px", fontSize: "0.75rem", borderWidth: "2px", maxWidth: "200px", margin: "auto" }}
          onClick={handleSave}
        >
          <PlusCircle size={15  } className="mx-2 mb-1"/>
          Save Study Plan
        </Button>
        <Button
          variant="outline-primary"
          className="mt-0 mx-1  rounded-pill"
          style={{ height: '32px', minWidth: "130px", fontSize: "0.75rem", borderWidth: "2px", maxWidth: "200px", margin: "-10px auto 0" }}
          onClick={handleRegenrate}
        >
          <Repeat size={15} className="mx-2 mb-1"/>
          Regenrate
        </Button>
        {/* <Button
          variant="outline-primary"
          className="mt-0 mx-1  rounded-pill"
          style={{ height: '32px', minWidth: "130px", fontSize: "0.75rem", borderWidth: "2px", maxWidth: "200px", margin: "-10px auto 0" }}
          onClick={handleSave}
        >
          <Repeat size={15} className="mx-2 mb-1"/>
          
        </Button> */}
        </Card>
          
      )}
    </Container>
  );
};

export default LearningPath;