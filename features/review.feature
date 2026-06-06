Feature: Application review

  Sakai reviews generated materials before they can be marked ready.

  Scenario: Review blocks unsupported claims
    Given an application draft with a missing-proof claim
    When I run "sakai review"
    Then the review verdict should be "block"
    And the issue should be categorized as evidence integrity
