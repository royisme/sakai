Feature: Workspace initialization

  Sakai users need a safe local workspace before agents can operate on private career data.

  Scenario: Initialize a new workspace
    Given an empty Sakai project directory
    When I run "sakai init"
    Then a workspace directory should be created
    And profile files should be created
    And preset files should be created
    And workspace should be ignored by git
    And the generated profile should pass lint

  Scenario: Re-run init without overwriting files
    Given an initialized Sakai workspace
    When I run "sakai init" again
    Then existing profile files should not be overwritten
    And gitignore rules should not be duplicated
