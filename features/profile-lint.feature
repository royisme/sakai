Feature: Profile lint

  Sakai validates structured profile inputs before agents use them to draft materials.

  Scenario: Lint a valid workspace profile
    Given an initialized Sakai workspace
    When I run "sakai profile lint"
    Then the lint result should pass

  Scenario: Lint an invalid workspace profile
    Given a workspace with an invalid profile file
    When I run "sakai profile lint"
    Then the lint result should fail
    And the issue list should include the invalid field
