# AI Investment DSS v0.3 — Fixed Research Prototype

## Fixes from v0.2
1. FLAE answers now correctly feed the Financial Literacy Score.
2. BVE answers now correctly feed the Behaviour Score.
3. CSV export uses real line breaks and can be opened correctly in Excel.
4. CSV includes key participant/assessment fields.
5. IRE weights are configurable in Research/Admin.
6. Default IRE weights remain 25% SIPE + 25% FHAE + 25% FLAE + 25% BVE.
7. Weights are stored locally for prototype testing.
8. Recommendation and XAI continue to use the IRI generated from the configured weights.

## Exact sequence
SIPE → FHAE → FLAE → BVE → IRE → Recommendation → XAI → Feedback & Adaptive Learning

## Run
npm install
npm run dev

## Research caution
The questionnaire, scoring rules, weights, thresholds and recommendation rules are still a research prototype. Validate them using the PhD methodology before formal conclusions or real-world financial advice. For 50-participant collection, use an appropriate secure database rather than browser localStorage.


## Supabase-connected research version
- Responses are submitted to Supabase table `public.participants`.
- The app uses the Supabase publishable key in `.env.local`; this key is intended for browser use.
- Run `supabase_setup.sql` once in Supabase SQL Editor to add JSON fields and the insert-only RLS policy.
- Anonymous participants can insert responses but cannot read other participants' records through the app.
- For administration, review/export the data from Supabase Table Editor or add authenticated admin access later.
- Participant IDs are unique browser-generated IDs (for example `P8A3F21CD`) so separate participants do not collide across devices.
