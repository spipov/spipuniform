Email Fragments

This directory documents how header/footer/base fragments are used.

Placeholders supported in fragments and base templates:
- {{header}} (in base templates)
- {{content}} (in base templates)
- {{footer}} (in base templates)
- {{siteName}}, {{siteUrl}}, {{logoUrl}}, {{supportEmail}}, {{primaryColor}}, {{secondaryColor}}, {{accentColor}}
- Any template variables you pass when sending

Base template: Should include {{content}} and optionally {{header}}/{{footer}}.
Header/Footer: Plain HTML that will be injected.

