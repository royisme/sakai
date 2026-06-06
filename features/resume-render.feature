Feature: Resume render
  The user can render a reviewed resume draft into a DOCX artifact.

  Scenario: Render a ready resume draft to DOCX
    Given a Sakai workspace with a ready resume review
    When the user renders the resume for the job
    Then Sakai writes a DOCX file under the workspace outputs directory
    And the render result records the review status used as the gate

  Scenario: Block rendering when review is not ready
    Given a Sakai workspace with a blocked resume review
    When the user renders the resume for the job
    Then Sakai refuses to render unless the user explicitly forces the action
