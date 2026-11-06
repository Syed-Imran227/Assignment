import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class SourceQuote(BaseModel):
    quote: str
    start: Optional[int] = None
    end: Optional[int] = None
    page: Optional[int] = None
    verified: bool = False

class FieldValue(BaseModel):
    value: Optional[str] = None
    status: str = "empty" # empty, pencil, edited, ink
    confidence: str = "medium" # low, medium, high
    source: Optional[SourceQuote] = None
    rationale: Optional[str] = None

class FormFields(BaseModel):
    product_name: FieldValue = Field(default_factory=lambda: FieldValue())
    strength_grade: FieldValue = Field(default_factory=lambda: FieldValue())
    batch_number: FieldValue = Field(default_factory=lambda: FieldValue())
    manufacturing_date: FieldValue = Field(default_factory=lambda: FieldValue())
    retest_expiry_date: FieldValue = Field(default_factory=lambda: FieldValue())
    affected_quantity: FieldValue = Field(default_factory=lambda: FieldValue())
    equipment_id: FieldValue = Field(default_factory=lambda: FieldValue())
    manufacturing_stage: FieldValue = Field(default_factory=lambda: FieldValue())
    reporter_name_role: FieldValue = Field(default_factory=lambda: FieldValue())
    detection_method: FieldValue = Field(default_factory=lambda: FieldValue())
    occurrence_date: FieldValue = Field(default_factory=lambda: FieldValue())
    discovery_date: FieldValue = Field(default_factory=lambda: FieldValue())
    deviation_description: FieldValue = Field(default_factory=lambda: FieldValue())
    immediate_containment: FieldValue = Field(default_factory=lambda: FieldValue())

class AIAssessment(BaseModel):
    severity: str = "major" # minor, major, critical
    recommended_action: str = ""
    risk_rationale: str = ""
    impact_scope: str = ""
    compliance_anchors: List[str] = Field(default_factory=list) # e.g. ["ICH Q7 Sec 12", "21 CFR 211.192"]

class InvestigationCreate(BaseModel):
    title: Optional[str] = "New API Investigation"

class InvestigationUpdate(BaseModel):
    title: Optional[str] = None
    classification: Optional[str] = None
    status: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = None
    ai_assessment: Optional[Dict[str, Any]] = None

class HypothesisConfirmRequest(BaseModel):
    confirmed_by: str
    confirmed_role: str
    evidence_ids: List[str] = Field(default_factory=list)

class CAPAUpdateRequest(BaseModel):
    status: Optional[str] = None # accepted, edited, rejected
    action_type: Optional[str] = None
    description: Optional[str] = None
    rationale: Optional[str] = None
    owner_role: Optional[str] = None
    due_offset_days: Optional[int] = None
    priority: Optional[str] = None

class MissingEvidenceAddRequest(BaseModel):
    item_title: Optional[str] = None
    received_content: str
    linked_hypothesis_id: Optional[str] = None

class CoPilotChatRequest(BaseModel):
    message: str
    investigation_id: str

class AuditLogItem(BaseModel):
    id: str
    actor_type: str
    actor_label: str
    action: str
    entity: str
    before_state: Optional[Dict[str, Any]] = None
    after_state: Optional[Dict[str, Any]] = None
    created_at: datetime.datetime

