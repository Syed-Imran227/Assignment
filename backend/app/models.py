import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Text, Integer, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.database import Base

class Investigation(Base):
    __tablename__ = "investigations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    rca_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255), default="Untitled Investigation")
    product_name: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    batch_number: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    classification: Mapped[str] = mapped_column(String(32), default="major") # minor, major, critical
    status: Mapped[str] = mapped_column(String(32), default="draft") # draft, under_investigation, reviewed, closed
    version: Mapped[int] = mapped_column(Integer, default=1)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # JSON structured form representation & AI risk assessment
    form_data: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    ai_assessment: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    sources = relationship("SourceDocument", back_populates="investigation", cascade="all, delete-orphan")
    ai_runs = relationship("AIRun", back_populates="investigation", cascade="all, delete-orphan")
    hypotheses = relationship("Hypothesis", back_populates="investigation", cascade="all, delete-orphan")
    why_chains = relationship("WhyChain", back_populates="investigation", cascade="all, delete-orphan")
    fishbone_causes = relationship("FishboneCause", back_populates="investigation", cascade="all, delete-orphan")
    missing_evidence = relationship("MissingEvidence", back_populates="investigation", cascade="all, delete-orphan")
    capa_actions = relationship("CAPAAction", back_populates="investigation", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="investigation", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="investigation", cascade="all, delete-orphan")


class SourceDocument(Base):
    __tablename__ = "source_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), index=True)
    kind: Mapped[str] = mapped_column(String(32)) # text, pdf, email
    filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    raw_text: Mapped[str] = mapped_column(Text)
    page_map: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True) # {page_num: text}
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="sources")


class AIRun(Base):
    __tablename__ = "ai_runs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), index=True)
    graph: Mapped[str] = mapped_column(String(64)) # extraction, analysis, copilot
    model: Mapped[str] = mapped_column(String(64))
    started_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)
    ended_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="running") # running, completed, failed
    trace: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    token_usage: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    investigation = relationship("Investigation", back_populates="ai_runs")


class Hypothesis(Base):
    __tablename__ = "hypotheses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), index=True)
    statement: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(32)) # Man, Machine, Material, Method, Measurement, Milieu
    qualitative_likelihood: Mapped[str] = mapped_column(String(32), default="medium") # high, medium, low
    strength: Mapped[str] = mapped_column(String(32), default="hypothesis") # hypothesis, supported, corroborated, confirmed
    rank: Mapped[int] = mapped_column(Integer, default=1)
    
    evidence_for: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    evidence_against: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list)
    evidence_needed: Mapped[List[str]] = mapped_column(JSON, default=list)
    
    # Human confirmation
    confirmed_by: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    confirmed_role: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    confirmed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)

    investigation = relationship("Investigation", back_populates="hypotheses")


class WhyChain(Base):
    __tablename__ = "why_chains"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), index=True)
    branch_title: Mapped[str] = mapped_column(String(128), default="Primary Branch")
    steps: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list) # [{level: 1, why: "...", answer: "...", evidence_quote: "..."}]
    terminal_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    investigation = relationship("Investigation", back_populates="why_chains")


class FishboneCause(Base):
    __tablename__ = "fishbone_causes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), index=True)
    category: Mapped[str] = mapped_column(String(32)) # Man, Machine, Material, Method, Measurement, Milieu
    cause_text: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="pencil") # pencil, edited, ink
    evidence_quote: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    investigation = relationship("Investigation", back_populates="fishbone_causes")


class MissingEvidence(Base):
    __tablename__ = "missing_evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), index=True)
    item_title: Mapped[str] = mapped_column(String(255))
    why_it_matters: Mapped[str] = mapped_column(Text)
    linked_hypothesis_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    priority: Mapped[str] = mapped_column(String(32), default="medium") # high, medium, low
    status: Mapped[str] = mapped_column(String(32), default="open") # open, requested, received
    requested_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    received_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime, nullable=True)
    received_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    investigation = relationship("Investigation", back_populates="missing_evidence")


class CAPAAction(Base):
    __tablename__ = "capa_actions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), index=True)
    action_type: Mapped[str] = mapped_column(String(32)) # correction, corrective, preventive
    description: Mapped[str] = mapped_column(Text)
    rationale: Mapped[str] = mapped_column(Text)
    linked_hypothesis_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    owner_role: Mapped[str] = mapped_column(String(128))
    due_offset_days: Mapped[int] = mapped_column(Integer, default=30)
    target_date: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    priority: Mapped[str] = mapped_column(String(32), default="medium") # minor, major, critical
    effectiveness_check: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict) # {metric, method, timing_months}
    status: Mapped[str] = mapped_column(String(32), default="proposed") # proposed, accepted, edited, rejected

    investigation = relationship("Investigation", back_populates="capa_actions")


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), index=True)
    actor_type: Mapped[str] = mapped_column(String(32)) # human, ai, system
    actor_label: Mapped[str] = mapped_column(String(128))
    action: Mapped[str] = mapped_column(String(64)) # extract, analyze, update_field, confirm_hypothesis, accept_capa, etc.
    entity: Mapped[str] = mapped_column(String(64))
    before_state: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    after_state: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="audit_logs")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    investigation_id: Mapped[str] = mapped_column(String(36), ForeignKey("investigations.id"), index=True)
    role: Mapped[str] = mapped_column(String(32)) # user, assistant, system
    content: Mapped[str] = mapped_column(Text)
    tool_calls: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, default=datetime.datetime.utcnow)

    investigation = relationship("Investigation", back_populates="chat_messages")
