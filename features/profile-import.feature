Feature: Profile import
  The user can bring an existing resume-system baseline into a private Sakai workspace.

  Scenario: Import a resume-system profile
    Given a resume-system profile JSON file
    When the user imports it into a Sakai workspace
    Then Sakai writes a lintable profile
    And Sakai creates resume-ready evidence claims from source highlights
    And Sakai keeps the imported data inside the gitignored workspace
