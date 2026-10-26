from typing import Literal

from pydantic import BaseModel, Field, field_validator


class SignupIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    username: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=6, max_length=200)

    @field_validator("username")
    @classmethod
    def norm(cls, v: str) -> str:
        return v.strip().lower()


class GoogleIn(BaseModel):
    credential: str = Field(min_length=20, max_length=4096)


class LoginIn(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def norm(cls, v: str) -> str:
        return v.strip().lower()


class Preferences(BaseModel):
    userRole: str = Field(default="Student", max_length=40)
    ageGroup: str = Field(default="18-25", max_length=40)
    language: str = Field(default="English", max_length=40)
    timeValue: float = Field(default=1, ge=0.25, le=12)


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    mode: Literal["chat", "quiz", "plan"] = "chat"
    chat_id: str | None = None


class ChatRename(BaseModel):
    title: str = Field(min_length=1, max_length=80)


class QuizQuestion(BaseModel):
    question: str
    options: list[str] = Field(min_length=4, max_length=4)
    answer_index: int = Field(ge=0, le=3)
    explanation: str = ""


class Quiz(BaseModel):
    title: str
    topic: str = ""
    difficulty: str = "medium"
    questions: list[QuizQuestion] = Field(min_length=1, max_length=15)


class SubTopic(BaseModel):
    name: str
    description: str = ""


class Topic(BaseModel):
    name: str
    description: str = ""
    time_required: str = ""
    subtopics: list[SubTopic] = []
    exercise: str = ""
    youtube_query: str = ""
    reading_query: str = ""


class Plan(BaseModel):
    name: str
    summary: str = ""
    course_duration: str = ""
    topics: list[Topic] = Field(min_length=1, max_length=14)


class QuizSubmit(BaseModel):
    message_id: str
    answers: list[int | None]
    finished: bool = False  # user chose "finish" before answering everything


class PlanSave(BaseModel):
    message_id: str


class TopicToggle(BaseModel):
    done: bool
