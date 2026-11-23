import os
import sqlite3
import json
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "prospecting_engine.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        website TEXT,
        industry TEXT,
        company_size TEXT,
        hq_location TEXT,
        research_notes TEXT NOT NULL,
        buying_signals TEXT DEFAULT '[]',
        red_flags TEXT DEFAULT '[]',
        lead_score INTEGER DEFAULT 0,
        temperature TEXT DEFAULT 'COLD',
        recommended_product TEXT DEFAULT 'Deel EOR & Contractor',
        status TEXT DEFAULT 'New',
        cadence_step INTEGER DEFAULT 1,
        follow_up_due TEXT,
        qualification_pain TEXT,
        qualification_current_vendor TEXT,
        qualification_timeline TEXT,
        qualification_notes TEXT,
        is_sample INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        title TEXT NOT NULL,
        persona TEXT NOT NULL,
        buying_role TEXT NOT NULL,
        linkedin_url TEXT,
        outreach_status TEXT DEFAULT 'Not Contacted',
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS call_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        contact_name TEXT,
        outcome TEXT NOT NULL,
        notes TEXT,
        logged_at TEXT NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
    );
    """)

    conn.commit()
    conn.close()


SAMPLE_NOTES = (
    "Veloce Cloud Systems secured a $38M Series B funding round led by Accel to aggressively scale its distributed edge-cloud platform across Europe and Latin America. "
    "Careers Page Audit: Actively hiring 12 remote software engineers with job descriptions explicitly stating 'Senior Backend Engineer (Remote - Brazil, Poland, Germany)'. "
    "Contractor Exposure: LinkedIn insights and team bios indicate Veloce currently relies on over 25 international contractors across LATAM and Eastern Europe for engineering and customer support, but rep onboarding is managed across disparate spreadsheets. "
    "Leadership & People Ops: Veloce recently posted a high-priority job opening for their first 'Global People Operations Manager' reporting directly to Elena Rostova (VP of People) to centralize international compliance, manage multi-currency contractor payouts, and investigate full-time EOR options before local entities can be formed in EMEA."
)


def seed_sample_if_empty():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM accounts WHERE is_sample = 1")
    count = cursor.fetchone()[0]

    if count == 0:
        now = datetime.now(timezone.utc).isoformat()
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        signals = [
            "remote_global_hiring",
            "recent_funding",
            "contractor_misclassification",
            "first_global_hr_hire"
        ]
        red_flags = []

        # From scoring logic:
        # Size '201-1000' = 20 pts
        # remote_global_hiring = 25 pts
        # recent_funding = 20 pts
        # contractor_misclassification = 20 pts
        # first_global_hr_hire = 15 pts
        # Raw = 20 + 25 + 20 + 20 + 15 = 100 pts -> HOT -> Deel EOR
        cursor.execute("""
        INSERT INTO accounts (
            company_name, website, industry, company_size, hq_location,
            research_notes, buying_signals, red_flags, lead_score, temperature,
            recommended_product, status, cadence_step, follow_up_due,
            qualification_pain, qualification_current_vendor, qualification_timeline,
            qualification_notes, is_sample, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "Veloce Cloud Systems (SAMPLE)",
            "https://velocecloud.io",
            "B2B DevOps SaaS",
            "201-1000",
            "Austin, TX",
            SAMPLE_NOTES,
            json.dumps(signals),
            json.dumps(red_flags),
            100,
            "HOT",
            "Deel EOR",
            "Ready",
            2,
            today,
            "25+ international contractors in Brazil, Poland, and Germany exposed to misclassification; hiring 12 remote engineers without local entities.",
            "Manual international wire transfers via Wise + domestic Gusto for US team.",
            "Q1/Q2 ramp to onboard 12 international hires within 45 days.",
            "Elena Rostova is actively reviewing EOR partners to avoid 6-month entity setup delays in EMEA and LATAM.",
            1,
            now
        ))
        account_id = cursor.lastrowid

        # Seed 2 Multi-Threaded Contacts
        cursor.execute("""
        INSERT INTO contacts (account_id, full_name, title, persona, buying_role, linkedin_url, outreach_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            account_id,
            "Elena Rostova",
            "VP of People & Talent",
            "VP of People / Talent",
            "Champion",
            "https://linkedin.com/in/elena-rostova-sample",
            "Email Sent"
        ))

        cursor.execute("""
        INSERT INTO contacts (account_id, full_name, title, persona, buying_role, linkedin_url, outreach_status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            account_id,
            "Marcus Vance",
            "Chief Financial Officer",
            "CFO / Finance",
            "Economic Buyer",
            "https://linkedin.com/in/marcus-vance-sample",
            "Not Contacted"
        ))

        # Seed 1 initial call log
        cursor.execute("""
        INSERT INTO call_logs (account_id, contact_name, outcome, notes, logged_at)
        VALUES (?, ?, ?, ?, ?)
        """, (
            account_id,
            "Elena Rostova",
            "Follow-Up Requested",
            "Left message with executive assistant; requested benchmark packet on Poland and Brazil EOR onboarding speeds.",
            now
        ))

        conn.commit()

    conn.close()
