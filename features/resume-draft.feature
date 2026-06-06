Feature: Resume draft
  The user can generate a job-targeted resume draft from a baseline profile and an ingested job.

  Scenario: Draft a resume against the target RecruitCRM job
    Given a Sakai workspace with a reviewed baseline profile
    And the RecruitCRM CorGTA Senior FullStack job has been ingested
    When the user drafts a resume for that job
    Then Sakai writes a Markdown resume draft
    And the draft includes only matched profile skills and evidence-backed claims
    And unmatched job requirements are reported as review gaps
