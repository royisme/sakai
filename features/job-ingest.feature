Feature: Job ingest
  The user can turn a saved job description into a structured Sakai job record.

  Scenario: Ingest the target RecruitCRM job description
    Given the RecruitCRM CorGTA Senior FullStack fixture
    When the user ingests it into a Sakai workspace
    Then Sakai writes a job record with title, company, location, and source evidence
    And Sakai preserves the original job description text for later resume drafting
