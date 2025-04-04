import React, { useState } from "react";
import { Button } from "react-bootstrap";
import { ArrowRight, ArrowRightCircle, ArrowRightCircleFill, Book, EnvelopePaper, Paperclip } from "react-bootstrap-icons";
import { askQuestion } from "../../../api";
import { useDispatch, useSelector } from "react-redux";
import { setChatHistory, setIsGenerating, setIsLearningPathQuery,setStreamChat } from "../../../globalSlice";
import "./ChatInput.scss";
const ChatInput = ({ refreshChat }) => {
  const [message, setMessage] = useState("");
  const chatHistory = useSelector((state) => state.global.chatHistory);
  const dispatch = useDispatch();
  const isLearningPathQuery = useSelector((state) => state.global.isLearningPathQuery);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const updatedHistory = [
      ...chatHistory,
      { role: "user", content: message, type: "content", isLearningPathQuery },
      { role: "assistant", content: "", type: "streaming" }
    ];
    
    dispatch(setChatHistory(updatedHistory));
    dispatch(setIsGenerating(true));
    // dispatch(setIsLearningPathQuery(isLearningPathQuery));
    setMessage(""); // Clear input field
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
        },false, isLearningPathQuery

      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
    <div className="chat-input-container mt-1">
      <Button variant="outline-secondary" className="attach-btn">
        <Paperclip size={24} />
      </Button>
      <textarea
        rows={2}
        placeholder={isLearningPathQuery ? "Start by telling me the topic you want to learn" : "Ask me anything you want to know..."}
        className="chat-textarea"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
      />

      <Button variant="primary" className="send-btn" onClick={handleSendMessage}>
        <ArrowRightCircle size={24} />
      </Button>
    </div>
    </>
  );
};

export default ChatInput;
