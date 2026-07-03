Secure Living – Outstanding Development Items
Review of "Updates Done" Against the Usability Testing Report
The recent update addresses a significant portion of the original usability feedback. However, the following items remain either partially implemented or not yet implemented and should be completed before this phase is considered finished.

PART A – PARTIALLY IMPLEMENTED
These features have been started but require additional work to fully satisfy the original requirements.

1. Management Takeover Workflow
Current Status
The "Need Management Assistance" (only shown to self managed landlords not landlords with agencies or property manager) feature now creates a request for Super Admin review.
Outstanding Work
Implement geographical admin routing. 
Allow requests to be assigned to regional administrators. 
Introduce invitation workflow instead of immediate takeover. 
Allow regional admin approval/rejection. 
Define escalation path from Admin to Super Admin. 
Add status tracking: 
Submitted 
Under Review 
Assigned 
Invitation Sent 
Accepted 
Declined 
Closed 

2. Organization Management
Current implementation only introduces agency approval.
Outstanding requirements:
Define who can create organizations. 
Allow (or restrict) self-registration. 
Implement organization approval workflow. 
Allow editing organization details. 
Support organization activation/deactivation. 
Document ownership model. 

3. Screening Process
Current implementation allows:
Approve 
Reject 
More Information 
Outstanding work:
Document screening process. 
Define screening responsibility. 
Display screening history. 
Add screening notes. 
Allow resubmission after "More Information". 
Define post-screening workflow. 

4. Compliance Number
Compliance numbers now exist.
Still required:
Define numbering format. 
Prevent duplication. 
Allow searching by compliance number. 
Show issuance date. 
Support revocation/deactivation. 
Document generation rules. 

5. Property Visualization
Current implementation improves navigation.
Still required:
Better visual hierarchy. 
Interactive Property → Unit → Tenant navigation. 
Occupancy visualization. 
Unit cards with summary. 
Dashboard parity between property and global dashboard. 

6. Agency Approval Workflow
Pending review has been added.
Still required:
Approval checklist. 
Required documentation. 
Rejection reasons. 
Re-application workflow. 
Audit trail. 

PART B – NOT IMPLEMENTED

1. Homepage
The following items remain unresolved:
Privacy Policy page 
Terms of Service page 
Cookie Policy 
Features menu 
Pricing page 
Resources page 
Homepage search 
Proper role-based login flow 
Broken homepage links 

2. Broken/Placeholder Features
The update document does not confirm completion of:
Add Tenant form 
Upload Lease 
Create Invoice 
Record Payment 
Please verify these pages are fully functional.

3. Maintenance Workflow
Outstanding implementation:
Maintenance request statuses:
Pending 
Approved 
In Progress 
Escalated 
Completed 
Closed 
Add timestamps and audit history.

4. Service Request Ownership
Define:
Who receives requests. 
Assignment rules. 
Resolution workflow. 
Escalation workflow. 
Closure process. 
Notification rules. 


5. Taxonomy Documentation
The platform still lacks explanation of how taxonomies work.
Provide documentation covering:
Property Categories 
Service Categories 
Application Templates 
Checklist Templates 
Service Modes 
Listing Types 

6. Lease Renewal Rules
Clarify system behaviour for:
Expired lease 
Terminated lease 
Cancelled lease 
Renewal request 
Renewal approval 
Renewal rejection 

7. Rectification Process
Every negative action should have a recovery workflow.
Examples:
Application Rejected
↓
Correct Information
↓
Resubmit
KYC Rejected
↓
Upload New Documents
↓
Review Again
Dispute Declined
↓
Appeal
↓
Review
Service Rejected
↓
Modify
↓
Resubmit
This should be consistent across the platform.

8. Services vs Service Requests
The platform should clearly distinguish between:
Marketplace Services
Services offered by providers.
Examples:
Plumbing 
Cleaning 
Security 
Painting 

Service Requests
Operational maintenance requests raised against a property.
Examples:
Fix leaking tap 
Repair gate 
Replace lock 
These should remain separate modules with separate workflows.

9. Homepage Search
Global dashboard search has been implemented.
Homepage search is still missing.
Visitors should be able to search:
Properties 
Locations 
Agents 
Services 
without logging in.

