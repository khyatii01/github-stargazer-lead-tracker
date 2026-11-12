Feature: High-value GitHub stargazer tracking

  Scenario: A follower-influential user qualifies
    Given a created star event for a user with 101 followers and 0 public repositories
    When the profile is evaluated
    Then the lead is high value

  Scenario: A prolific repository owner qualifies
    Given a created star event for a user with 0 followers and 51 public repositories
    When the profile is evaluated
    Then the lead is high value

  Scenario: Threshold values are exclusive
    Given a user with exactly 100 followers and exactly 50 public repositories
    When the profile is evaluated
    Then the flow stops before the AI and Discord nodes

  Scenario: A high-value lead is announced
    Given a qualified profile with name, bio, and company
    When the LLM returns a one-sentence pitch
    Then Discord receives a formatted payload containing the name, bio, and pitch
