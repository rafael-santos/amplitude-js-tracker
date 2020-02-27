// See https://github.com/leonardoanalista/cz-customizable for more information and options

module.exports = {
  types: [
    { value: "feat", name: "feat:     A new feature" },
    { value: "fix", name: "fix:      A bug fix" },
    { value: "docs", name: "docs:     Documentation only changes" },
    {
      value: "refac",
      name: "refac:    A code change that neither fixes a bug nor adds a feature"
    },
    { value: "spec", name: "spec:     Adding missing tests" },
    {
      value: "chore",
      name: "chore:    Changes to the build process or auxiliary tools and libraries"
    }
  ],

  // override the messages, defaults are as follows
  messages: {
    type: "Select the type of change that you're committing:",
    scope: "\nDenote the SCOPE of this change (optional):",
    // used if allowCustomScopes is true
    customScope: "Denote the SCOPE of this change:",
    subject: "Write a SHORT description of the change:\n",
    body:
      'Provide a LONGER description of the change (optional). Use "|" to break new line:\n',
    breaking: "List any BREAKING CHANGES (optional):\n",
    footer: "List any ISSUES CLOSED by this change (optional). E.g.: #31, #34:\n",
    confirmCommit: "Are you sure you want to proceed with the commit above?"
  },

  allowBreakingChanges: ["feat", "fix"],
  skipQuestions: ["scope", "customScope", "body", "footer"],

  subjectLimit: 100
};
