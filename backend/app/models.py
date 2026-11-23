from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False)
    company_slug = Column(String(255), nullable=False, unique=True, index=True)
    website = Column(String(255), nullable=True)
    industry = Column(String(255), nullable=True)
    company_size = Column(String(100), nullable=True)
    location = Column(String(255), nullable=True)
    prospect_name = Column(String(255), nullable=True)
    prospect_title = Column(String(255), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    research_notes = Column(Text, default="", nullable=False)
    lead_score = Column(Integer, default=0, nullable=False)
    temperature = Column(String(20), default="COLD", nullable=False)  # HOT, WARM, COLD
    status = Column(String(50), default="New", nullable=False)        # New, Ready, Contacted, Replied, Meeting
    is_sample = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    signals = relationship("BuyingSignal", back_populates="account", cascade="all, delete-orphan")
    brief = relationship("Brief", back_populates="account", uselist=False, cascade="all, delete-orphan")


class BuyingSignal(Base):
    __tablename__ = "buying_signals"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    signal_key = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=False, nullable=False)

    account = relationship("Account", back_populates="signals")


class Brief(Base):
    __tablename__ = "briefs"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, unique=True)
    content_json = Column(Text, nullable=False)
    generated_at = Column(DateTime, default=utc_now, nullable=False)

    account = relationship("Account", back_populates="brief")
