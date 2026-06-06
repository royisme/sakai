Feature: Apply gates

  Sakai drafts application materials only after evaluating the role.

  Scenario: Apply without evaluation is blocked
    Given a job record without an evaluation
    When I run "sakai apply"
    Then the application should be blocked
    And the next step should be "sakai evaluate"

  Scenario: Apply after evaluation can draft materials
    Given a job record with an apply recommendation
    And a reviewed resume baseline
    When I run "sakai apply"
    Then resume and cover letter drafts should be created
    And evidence checks should run before DOCX rendering
