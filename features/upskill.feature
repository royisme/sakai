Feature: Upskill report

  Sakai turns repeated job evaluation gaps into a skill-growth feedback loop.

  Scenario: Summarize repeated missing proof
    Given multiple evaluation records with missing proof
    When I run "sakai upskill"
    Then an upskill report should be created
    And repeated gaps should be ranked by frequency
