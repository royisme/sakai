Feature: Resume review
  The user can review a job-targeted resume draft before rendering or submission.

  Scenario: Review a resume draft with missing job coverage
    Given a Sakai workspace with an imported baseline profile
    And the RecruitCRM CorGTA Senior FullStack job has been ingested
    And a resume draft has been generated
    When the user reviews the resume draft
    Then Sakai writes JSON and Markdown review reports
    And the review status is needs_revision
    And missing target keywords are reported without blocking evidence-safe content

  Scenario: Block a resume draft with an unsupported claim
    Given a Sakai workspace with evidence data
    And a resume draft contains a claim not allowed for resume use
    When the user reviews the resume draft
    Then the review status is blocked
    And the unsupported claim is reported as an evidence integrity error
