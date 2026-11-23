import pytest
from app.brief_generator import generate_grounded_brief


def test_empty_notes_strictly_outputs_not_in_notes():
    res = generate_grounded_brief(
        company_name="Phantom Corp",
        prospect_name="Jane Doe",
        prospect_title="Head of Sales",
        research_notes="",
        active_signals={}
    )
    assert res["company_summary"] == "Not in notes"
    assert res["best_outreach_angle"] == "Not in notes"
    assert res["personalized_first_lines"] == ["Not in notes", "Not in notes", "Not in notes"]
    assert res["discovery_questions"] == ["Not in notes"] * 5
    for obj in res["objections"]:
        assert obj["objection"] == "Not in notes"
        assert obj["response"] == "Not in notes"
    assert res["talk_track"] == "Not in notes"
    assert res["next_step"] == "Not in notes"


def test_grounded_parsing_quotes_actual_notes():
    notes = (
        "Acme Logistics recently raised $30M Series B to automate border customs. "
        "They are actively recruiting 5 SDRs in Chicago to expand North American territory. "
        "Sales reps currently struggle with manual compliance workflows and spreadsheet reporting."
    )
    res = generate_grounded_brief(
        company_name="Acme Logistics",
        prospect_name="Alex Rivera",
        prospect_title="VP of Sales",
        research_notes=notes,
        active_signals={"hiring_sdrs_aes": True, "new_funding": True}
    )

    # Company summary must include sentences from the notes
    assert "Acme Logistics recently raised $30M Series B" in res["company_summary"]
    
    # First lines must quote actual text from notes
    quoted_lines = res["personalized_first_lines"]
    assert any("$30M Series B" in line for line in quoted_lines)
    assert any("recruiting 5 SDRs" in line or "compliance workflows" in line for line in quoted_lines)

    # Talk track references prospect and notes
    assert "Alex Rivera" in res["talk_track"]
    assert "Acme Logistics" in res["talk_track"]

    # Objections reference grounded facts
    assert len(res["objections"]) == 3
    assert res["next_step"] != "Not in notes"
