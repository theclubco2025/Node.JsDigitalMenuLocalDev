# Business Intake Prompt (for another agent)

Collect public info for a restaurant and map to this schema. Be concise.

Return JSON with:
```json
{
  "legalName": "",
  "displayName": "",
  "website": "",
  "address": { "line1": "", "city": "", "region": "", "postal": "" },
  "hours": [ { "day": "Mon", "open": "11:00", "close": "21:00" } ],
  "cuisine": ["italian", "seafood"],
  "tone": ["upscale", "cozy"],
  "priceBand": "$$",
  "logoUrl": ""
}
```

Rules:
- Use only public sources provided by the user (website, socials, GMB).
- Don’t invent facts. If unknown, set empty string or [].
- Keep tone words to 2–4.
- Include 6–12 cuisine/feature tags if available.

