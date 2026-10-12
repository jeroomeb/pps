Technical Product Specification: Predictive Risk-Score Modeling

1\. Project Objective

We are upgrading the Amenity Op’s platform to integrate predictive risk mitigation directly alongside our existing night-operations logging, allowing both systems to work hand in hand. While our team and software subscribers will continue to meticulously log and audit property conditions overnight, the platform will now use that historical logging data to forecast vulnerabilities. This ensures that every nightly site visit or internal checklist is proactively informed by predictive risk patterns before the shift even begins.

---

2\. Core Feature Requirements & Logic

📊 Metric & Data Input Pipeline

The machine learning model must evaluate historical property audit data by grouping the checklist questions into core logical risk domains: (below will vary based on the type of checklist)

* **Life-Safety & Liability:** Pool gates latched, fire egress paths cleared, maintenance room locks secure.  
* **Aesthetic & Municipal Compliance:** Waste consolidation status, dumpster bin locations, curb compliance.  
* **Asset Protection:** Pipe valve integrity, thermal variances, parcel room overflows.  
* **Temporal & Contextual Data:** Day of the week, local weather conditions (e.g., rain risk increasing leak probability), holiday weekends, and historical frequency of failures at that specific property.

🧠 Predictive Risk-Score Generation

The system must run a basic machine learning classification/regression algorithm (e.g., Random Forest or Logistic Regression) daily.

* **Execution Time:** The model must automatically calculate and refresh the property's risk parameters every afternoon by **4:00 PM EST**.  
* **The Output:** A dynamic **Daily Evening Risk Score** ranging from **1 to 100** (or a clean 1-10 index), where higher numbers signify elevated vulnerabilities.  
* **Contextual Weighting:** Weight critical compliance items (like an unlatched pool gate or blocked fire exit) heavier than aesthetic items (like minor trash overflow).

🚩 Proactive Area Flagging

* Before the evening shift starts, the system must identify the top **2–3 highest-risk compliance categories** based on historical failure trends under current contextual conditions.  
* *Example:* If a property historically fails waste compliance on Thursday nights due to Friday morning municipal pickups, the system must flag "Waste & Aesthetic Logistics" as high-risk for that evening's audit.

---

3\. UI/UX & Report Integration Workflow

A. The Inspector Dashboard (Pre-Shift)

* **Visual Anchor:** When an inspector or on-site staff member logs into their Property Hub, they must see the updated Risk Score featured prominently at the top of the assigned property.  
* **Dynamic Checklist Sorting:** The 45-question inspection should dynamically bubble the flagged "High-Risk Compliance Areas" to the top of the checklist sequence, forcing the inspector to audit those critical vulnerabilities first.

B. The Property Manager Dashboard & Hand-Off Report

The generated evening risk score and flagged focus items must be cleanly integrated into two specific deliverables:

1. **The Evening Pre-Shift Alert:** A snapshot visible to property managers showing their building's predictive baseline for the night.  
2. **The Post-Audit Morning Hand-Off Log:** Upon audit completion, the automated report must include a dedicated visual section cross-referencing the *predicted risk* against the *actual physical resolution* documented during the site visit.

---

4\. Developer Execution & Architecture Milestones

To help you build this out incrementally, please structure the development phases as follows:

| Phase | Milestone Name | Technical Requirements |
| ----- | ----- | ----- |
| **Phase 1** | **Data Architecture & Grouping** | Map all 45 current inspection questions into distinct database tags matching our core compliance categories. |
| **Phase 2** | **ML Model MVP** | Build a basic predictive script using Python (scikit-learn) that looks at the past 30–90 days of inspection logs and correlates failure rates with the day of the week and weather inputs. |
| **Phase 3** | **API & Cron Automation** | Set up an automated routine (cron job) to run the predictive calculations daily and write the resulting scores to the properties table. |
| **Phase 4** | **UI Layout & PDF Reporting** | Update the front-end dashboard and the morning PDF generation engine to render the new Risk Score gauges and pre-shift flags. |

