import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import ChatInput from "./ChatInput";
import AIMessage from "./AIMessage";
import { fetchChatHistory, clearChat } from "../../../api";
import { formatDistanceToNow } from "date-fns";
import { Container, Row, Card, Spinner, Button, Modal } from "react-bootstrap";
import {
  setChatHistory,
  setIsGenerating,
  setIsLearningPathQuery,
  setIsQuizQuery,
} from "../../../globalSlice";
import "./ChatScreen.scss";
import { Backspace, Book, Eraser, List, Question, X } from "react-bootstrap-icons";

const ChatScreen = () => {
  const dispatch = useDispatch();
  const { chatHistory, isGenerating, isLearningPathQuery, isQuizQuery } = useSelector(
    (state) => state.global
  );
  const hasFetched = useRef(false);
  const messagesEndRef = useRef(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleStudyPlan = () => {
    dispatch(setIsLearningPathQuery(!isLearningPathQuery));
  };

  const handleSelfyQuiz = () => {
    dispatch(setIsQuizQuery(!isQuizQuery));
  };

  const handleClearChat = () => {
    setShowConfirmModal(true);
  };

  const confirmClearChat = async () => {
    try {
      await clearChat();
      dispatch(setChatHistory([]));
    } catch (error) {
      console.error("Error clearing chat history:", error.message);
    }
    setShowConfirmModal(false);
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const history = await fetchChatHistory();
      dispatch(setChatHistory(history));
    } catch (error) {
      console.error("Error fetching chat history:", error.message);
    }
  };

  const refreshChat = (message) => {
    console.log("Called")
    if (message) {
      dispatch(addTemporaryMessage(message));
    } else {
      loadChatHistory();
    }
    dispatch(setIsGenerating(false));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <Container className="chat-screen d-flex flex-column flex-grow-1 p-3">
      <div className="chat-history flex-grow-1 overflow-scroll overflow-x-hidden">
        {chatHistory.length > 0 ? (
          chatHistory.map((message, index) => (
            <Row
              key={index}
              className={`mb-2 d-flex ${
                message.role === "user"
                  ? "justify-content-end"
                  : "justify-content-start"
              }`}
            >
              {message.role === "user" ? (
                <Card
                  className="p-1 border-dark bg-primary w-auto  text-light"
                  style={{ borderRadius: "15px", marginRight: "15px", maxWidth: "55%" }}
                >
                  <Card.Body>
                    <Card.Text>{message.content}</Card.Text>
                    {message.timestamp && (
                      <small className="text-light d-block text-end">
                        {formatDistanceToNow(new Date(message.timestamp), {
                          addSuffix: true,
                        })}
                      </small>
                    )}
                  </Card.Body>
                </Card>
              ) : (
                <AIMessage
                  content={message.content}
                  type={message.type}
                  timestamp={message.timestamp}
                  refreshChat={refreshChat}
                />
              )}
            </Row>
          ))
        ) : (
          <div style={{position: "relative", top: "10%"}}>
            <Card className="m-5 border-0 bg-white text-dark w-50 mx-auto center" >
              <Card.Header className="bg-white text-center">
                <Card.Img src="/chatscreen.svg" alt="Eduverse Logo" style={{ width: "500px" }} />
              </Card.Header>
              <Card.Body  className="bg-white border-0 border-white text-center">
              <Card.Title>Welcome to Eduverse.ai</Card.Title>
              <Card.Subtitle>Your personal learning companion</Card.Subtitle>
              <div className="mt-3"></div>
              <Card.Text>Start by asking a question or generating a study plan for you next topic</Card.Text>
              </Card.Body>
              <Card.Footer  className="bg-white border-0">
                <div className="d-flex justify-content-center">
                  <Button variant={isLearningPathQuery ? "primary rounded-pill" : "outline-primary rounded-pill"} onClick={handleStudyPlan}>
                  <Book size={15} className="me-2" />
                    Generate Study Plan
                  </Button>
                  <Button variant={ isQuizQuery ? "primary rounded-pill" : "outline-primary rounded-pill"} className="ms-3" onClick={handleSelfyQuiz}>
                  <List size={15} className="me-2" />
                    Create a Selfy Shot Quiz
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isGenerating && (
        <div className="typing-indicator d-flex align-items-center" style={{position: "relative", top: "10px", left: "10px"}}>
          <Spinner animation="grow" size="sm" className="me-2" />
          <span>
            {isLearningPathQuery
              ? "Eduverse is Generating a Study Plan for you"
              : "Eduverse is typing..."}
          </span>
        </div>
      )}

    { chatHistory.length > 0 && 
    (
<div
        className="mb-3"
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          background: "white",
          height: "80px",
          margin: "0px",
          marginTop: "-10px",
          padding: "20px",
          paddingTop: "10px",
          borderRadius: '25px',
          position: 'relative',
          top: '20px',
          left: '-15px',
          // border: '1px solid grey'
        }}
      >
        <Button
          variant={isLearningPathQuery ? 'primary' : 'outline-primary'}
          className="mt-n2 rounded-pill"
          onClick={() => handleStudyPlan()}
          style={{
            fontSize: "0.75rem",
            borderWidth: "2px",
            maxWidth: "200px",
            margin: "-10px 0",
          }}
        >
          <Book size={15} className="me-2" />
          Create a Study Plan
        </Button>
        <Button
          variant={isQuizQuery ? "primary" : "outline-primary"}
          className="mt-n2 mx-2 rounded-pill"
          onClick={() => handleSelfyQuiz()}
          style={{
            fontSize: "0.75rem",
            borderWidth: "2px",
            maxWidth: "200px",
            margin: "-10px 0",
          }}
        >
          <List size={15} className="me-2" />
          Create a Quiz
        </Button>
        <Button
          variant="outline-primary"
          className="mt-n2  rounded-pill"
          style={{
            fontSize: "0.75rem",
            borderWidth: "2px",
            maxWidth: "200px",
            margin: "-10px 0",
          }}
          onClick={handleClearChat}
        >
          <X size={15} className="me-1" />
          Clear Chat
        </Button>
      </div>
    )
    }
      
      <div className="chat-input-container" style={  chatHistory.length > 0 ? {border: '1px solid grey'} : { border: '1px solid grey' }}>
        <ChatInput refreshChat={refreshChat} />
      </div>

      {/* Confirm Deletion Modal */}
      <Modal show={showConfirmModal} centered onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Chat Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to clear the chat history? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="outline-danger" onClick={confirmClearChat}>
            Clear Chat
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ChatScreen;