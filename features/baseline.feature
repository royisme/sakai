Feature: Resume baseline

  Sakai builds a reusable resume baseline before job-specific applications.

  Scenario: Build a baseline from validated profile and evidence
    Given a validated profile
    And an evidence registry
    When I run "sakai baseline create"
    Then a resume baseline should be created
    And unsupported claims should be excluded
    And the baseline should be reviewable before apply
