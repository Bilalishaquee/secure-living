-- Dispute Management: add an explicit "Other Resolution" outcome so admins/landlords
-- resolving a dispute can choose Approve / Decline / Other (with a required note) instead
-- of only accept/reject (spec: UPDATE.md "Dispute Management" + "On resolve dispute there
-- should be a button of either approve or decline or other resolution").
ALTER TYPE "DisputeStatus" ADD VALUE IF NOT EXISTS 'RESOLVED_OTHER';
