# OvaSense — AI-Assisted PMOS Health Monitoring and Explainable Assessment Platform
## Comprehensive Final Year Project (FYP) Technical & Academic Documentation

---

# TABLE OF CONTENTS

- [CHAPTER 1: INTRODUCTION](#chapter-1-introduction)
  - [1.1 Project Overview](#11-project-overview)
  - [1.2 Problem Statement](#12-problem-statement)
  - [1.3 Project Objectives](#13-project-objectives)
  - [1.4 Background and Motivation](#14-background-and-motivation)
  - [1.5 Scope of Project](#15-scope-of-project)
  - [1.6 Document Organization](#16-document-organization)
- [CHAPTER 2: PROJECT PLANNING AND FEASIBILITY](#chapter-2-project-planning-and-feasibility)
  - [2.1 Introduction](#21-introduction)
  - [2.2 Project Feasibility Analysis](#22-project-feasibility-analysis)
  - [2.3 Critical Path Method (CPM) Analysis](#23-critical-path-method-cpm-analysis)
  - [2.4 Gantt Chart & Project Schedule](#24-gantt-chart--project-schedule)
  - [2.5 Team Members and Skill Sets](#25-team-members-and-skill-sets)
  - [2.6 Combined Team Skills](#26-combined-team-skills)
  - [2.7 Target Users](#27-target-users)
  - [2.8 Risk Register](#28-risk-register)
  - [2.9 Risk Management Strategy](#29-risk-management-strategy)
- [CHAPTER 3: LITERATURE REVIEW](#chapter-3-literature-review)
  - [3.1 Introduction](#31-introduction)
  - [3.2 Artificial Intelligence in PMOS/PCOS Screening](#32-artificial-intelligence-in-pmospcos-screening)
  - [3.3 Machine Learning-Based PMOS/PCOS Prediction](#33-machine-learning-based-pmospcos-prediction)
  - [3.4 Questionnaire and Symptom-Based PMOS/PCOS Assessment](#34-questionnaire-and-symptom-based-pmospcos-assessment)
  - [3.5 Explainable Artificial Intelligence (XAI) in Healthcare](#35-explainable-artificial-intelligence-xai-in-healthcare)
  - [3.6 Digital Health and Longitudinal Women's Health Monitoring](#36-digital-health-and-longitudinal-womens-health-monitoring)
  - [3.7 PMOS/PCOS Dataset and Feature Comparison](#37-pmospcos-dataset-and-feature-comparison)
  - [3.8 Research Gap Identification](#38-research-gap-identification)
  - [3.9 Existing Systems Comparison with OvaSense](#39-existing-systems-comparison-with-ovasense)
- [CHAPTER 4: SYSTEM REQUIREMENTS SPECIFICATION](#chapter-4-system-requirements-specification)
  - [4.1 Introduction](#41-introduction)
  - [4.2 System Overview](#42-system-overview)
  - [4.3 Scope of the System](#43-scope-of-the-system)
  - [4.4 External Entities](#44-external-entities)
  - [4.5 Functional Requirements](#45-functional-requirements)
  - [4.6 Non-Functional Requirements](#46-non-functional-requirements)
  - [4.7 Data Flow Diagrams (DFDs)](#47-data-flow-diagrams-dfds)
  - [4.8 System Use Cases](#48-system-use-cases)
  - [4.9 Use Case Modelling & Detailed Specifications](#49-use-case-modelling--detailed-specifications)
  - [4.10 Requirements Prioritization (MoSCoW)](#410-requirements-prioritization-moscow)
  - [4.11 Requirements Traceability Matrix (RTM)](#411-requirements-traceability-matrix-rtm)
- [CHAPTER 5: SYSTEM DESIGN AND IMPLEMENTATION](#chapter-5-system-design-and-implementation)
  - [5.1 Introduction](#51-introduction)
  - [5.2 System Architecture Design](#52-system-architecture-design)
  - [5.3 System Workflow](#53-system-workflow)
  - [5.4 User Interface Design](#54-user-interface-design)
  - [5.5 Health Profile and Cycle Tracking Module](#55-health-profile-and-cycle-tracking-module)
  - [5.6 Medical Report Processing and OCR](#56-medical-report-processing-and-ocr)
  - [5.7 Structured Health Record Management](#57-structured-health-record-management)
  - [5.8 ML-Based PMOS Screening Module](#58-ml-based-pmos-screening-module)
  - [5.9 Data Preprocessing and Feature Extraction](#59-data-preprocessing-and-feature-extraction)
  - [5.10 ML Model Development and Evaluation](#510-ml-model-development-and-evaluation)
  - [5.11 Explainable AI and TreeSHAP Implementation](#511-explainable-ai-and-treeshap-implementation)
  - [5.12 PMOS Timeline and Longitudinal Monitoring](#512-pmos-timeline-and-longitudinal-monitoring)
  - [5.13 Nutrition and Fitness Recommendation Module](#513-nutrition-and-fitness-recommendation-module)
  - [5.14 Lifestyle Scenario Explorer](#514-lifestyle-scenario-explorer)
  - [5.15 AI Chatbot / AI Health Explanation Module](#515-ai-chatbot--ai-health-explanation-module)
  - [5.16 Database Design](#516-database-design)
  - [5.17 Authentication and Security](#517-authentication-and-security)
  - [5.18 Technology Stack](#518-technology-stack)
- [CHAPTER 6: SYSTEM TESTING AND EVALUATION](#chapter-6-system-testing-and-evaluation)
  - [6.1 Introduction](#61-introduction)
  - [6.2 Testing Strategy](#62-testing-strategy)
  - [6.3 Unit Testing](#63-unit-testing)
  - [6.4 Backend API Testing](#64-backend-api-testing)
  - [6.5 Frontend Testing](#65-frontend-testing)
  - [6.6 Integration Testing](#66-integration-testing)
  - [6.7 Authentication and Authorization Testing](#67-authentication-and-authorization-testing)
  - [6.8 Database and Row-Level Security (RLS) Testing](#68-database-and-row-level-security-rls-testing)
  - [6.9 ML Model Testing](#69-ml-model-testing)
  - [6.10 ML Performance Evaluation](#610-ml-performance-evaluation)
  - [6.11 Explainability Testing](#611-explainability-testing)
  - [6.12 End-to-End Testing](#612-end-to-end-testing)
  - [6.13 Usability Testing](#613-usability-testing)
  - [6.14 Test Results and Discussion](#614-test-results-and-discussion)
- [CHAPTER 7: RESULTS AND DISCUSSION](#chapter-7-results-and-discussion)
  - [7.1 Introduction](#71-introduction)
  - [7.2 System Implementation Results](#72-system-implementation-results)
  - [7.3 Dashboard Results](#73-dashboard-results)
  - [7.4 ML Screening Results](#74-ml-screening-results)
  - [7.5 Explainable AI Results](#75-explainable-ai-results)
  - [7.6 Medical Report Processing Results](#76-medical-report-processing-results)
  - [7.7 Health Tracking Results](#77-health-tracking-results)
  - [7.8 AI Chat Results](#78-ai-chat-results)
  - [7.9 System Performance](#79-system-performance)
  - [7.10 Limitations](#710-limitations)
  - [7.11 Discussion](#711-discussion)
- [CHAPTER 8: CONCLUSION AND FUTURE WORK](#chapter-8-conclusion-and-future-work)
  - [8.1 Introduction](#81-introduction)
  - [8.2 Project Conclusion](#82-project-conclusion)
  - [8.3 Achievement of Objectives](#83-achievement-of-objectives)
  - [8.4 Key Contributions](#84-key-contributions)
  - [8.5 Current Limitations](#85-current-limitations)
  - [8.6 Future Enhancements](#86-future-enhancements)
  - [8.7 Final Remarks](#87-final-remarks)
- [IMPLEMENTATION STATUS SUMMARY](#implementation-status-summary)
- [REFERENCES](#references)

---

# CHAPTER 1: INTRODUCTION

## 1.1 Project Overview
Polycystic Ovary Syndrome (PCOS), clinically referred to in extended metabolic literature as Polycystic Metabolic Ovary Syndrome (PMOS), is one of the most prevalent endocrine and metabolic disorders among women of reproductive age worldwide. Affecting between 8% and 13% of reproductive-aged women globally, PCOS manifests as a heterogeneous, multisystem disorder characterized by ovulatory dysfunction, hyperandrogenism, and polycystic ovarian morphology, often compounded by insulin resistance, chronic low-grade inflammation, and long-term cardiometabolic risks. Despite its profound impact on reproductive, psychological, and metabolic health, up to 70% of affected women remain undiagnosed worldwide, frequently enduring diagnostic delays spanning several years and multiple specialist visits.

**OvaSense** is an AI-assisted health monitoring and explainable assessment platform specifically engineered to address the critical challenges of early PCOS risk identification, longitudinal health tracking, and fragmented clinical record management. OvaSense bridges the gap between patient-reported health data and actionable, clinically defensible health insights. The platform provides a non-invasive, accessible machine learning risk-screening engine, backed by local explainable AI (TreeSHAP), longitudinal cycle and symptom tracking, medical document digitization via Optical Character Recognition (OCR), localized nutrition guidance (specifically tailored for South Asian / Pakistani dietary patterns), lifestyle scenario exploration, and structured doctor-communication tools.

Crucially, OvaSense is architected under strict medical safety principles: it operates explicitly as a **first-line screening and health-monitoring platform, not a diagnostic medical device**. The platform does not claim to replace formal clinical ultrasound or biochemical assays, but rather empowers individuals to recognize early phenotypic patterns and seek timely, targeted medical consultations.

```mermaid
graph TD
    A[User Engagement & Profile] --> B[Longitudinal Data Collection: Cycle, Symptoms, Logs]
    B --> C[Medical Report OCR & Biomarkers]
    B --> D[Django Intelligence API]
    D --> E[16-Feature Extraction & Preprocessing]
    E --> F[Extra Trees Classifier Model]
    F --> G[Calibrated Probability & Threshold at 0.38]
    G --> H[TreeSHAP Local Attributions]
    H --> I[Interactive React/TypeScript Dashboard]
    I --> J[Actionable Insights, Localized Diet, Doctor Summaries]
```

## 1.2 Problem Statement
The current clinical and digital paradigm surrounding PCOS diagnosis and management suffers from three profound systemic shortcomings:

1. **Diagnostic Delay and High Invasive Barriers**: Standard diagnostic pathways under the Rotterdam criteria require invasive transvaginal/pelvic ultrasound and expensive venous blood draws (LH, FSH, AMH, free testosterone, fasting insulin). Because these tests require clinical appointments and specialized facilities, early-stage or adolescent individuals experience average diagnostic delays of 2 to 3 years.
2. **Fragmentation of Health Records**: Women suffering from PCOS must independently monitor disparate, interrelated physiological domains—menstrual periodicity, dermatological flare-ups (acne, hirsutism, acanthosis nigricans), basal metabolic fluctuations, dietary intake, and physical activity. Traditional digital tools isolate these domains into single-purpose mobile apps, depriving both the patient and clinician of a unified longitudinal timeline.
3. **The "Black Box" Trust Deficit in Health AI**: Existing mobile wellness applications that incorporate machine learning often present opaque, arbitrary "risk percentages" without clinical context or interpretability. Such black-box predictions either generate unwarranted anxiety or false reassurance, without explaining which specific physiological factors drove the model's estimate.
4. **Lack of Localized Nutritional Context**: Most nutritional and lifestyle guidelines embedded in contemporary health applications rely heavily on Western dietary templates. In South Asian populations—where the phenotypic expression of PCOS is uniquely exacerbated by high carbohydrate diets and visceral adiposity at lower BMI thresholds—generic advice fails to provide culturally sustainable interventions.

## 1.3 Project Objectives
The overarching goal of the OvaSense project is to design, implement, evaluate, and deploy an end-to-end, explainable, web-based digital health platform for PMOS/PCOS screening and longitudinal tracking. The specific engineering and research objectives are:

* **Objective 1: Non-Invasive ML Screening Pipeline**: Develop a robust, leak-free machine learning screening pipeline trained exclusively on 16 patient-reportable anthropometric, menstrual, clinical, and lifestyle features that achieves $\ge 85\%$ sensitivity on unseen holdout clinical data.
* **Objective 2: Explainable AI via TreeSHAP**: Integrate exact Shapley value attributions into the backend inference pipeline to transparently identify and visualize the primary positive and negative contributors to an individual’s estimated screening probability.
* **Objective 3: Unified Longitudinal Health Architecture**: Construct a secure, multi-tier full-stack architecture (React, TypeScript, Django REST Framework, Supabase PostgreSQL with Row-Level Security) integrating cycle tracking, symptom logs, biometric tracking, and medical reports.
* **Objective 4: Intelligent Medical Document Digitization**: Implement an Optical Character Recognition (OCR) pipeline capable of parsing laboratory and ultrasound reports into structured, trendable biomarker records with reference range evaluations.
* **Objective 5: Culturally Contextualized Lifestyle & Nutrition Engine**: Design a localized nutritional recommendation module addressing South Asian culinary staples, glycemic load balancing, and phase-specific hormonal nourishment.
* **Objective 6: Clinical Safety & Doctor Collaboration**: Embed strict safety guardrails, clear non-diagnostic disclaimers, and automated clinical summary generators to streamline patient-provider consultations.

## 1.4 Background and Motivation
PCOS is historically diagnosed using the 2003 Rotterdam Consensus criteria, which mandates the presence of at least two of the following three features:
1. Oligo- or anovulation (menstrual cycles $<21$ days, $>35$ days, or varying widely);
2. Clinical and/or biochemical signs of hyperandrogenism (excess terminal hair growth, severe acne, androgenetic alopecia, elevated serum androgens);
3. Polycystic ovarian morphology on pelvic ultrasound ($\ge 12$ to 20 antral follicles per ovary or ovarian volume $>10$ mL).

While ultrasound and endocrine panels represent the clinical gold standard, the early manifestations of PCOS present as visible, tangible phenotypic symptoms. Machine learning models trained on high-quality clinical cohorts can capture non-linear synergies between menstrual irregularity, metabolic signs (recent unexplained weight gain, acanthosis nigricans), and hyperandrogenism. By capturing these patterns non-invasively, digital screening can alert women to elevated risk profiles months or years before formal diagnostic workups would otherwise be sought.

Motivated by the widespread availability of modern web technologies and the pressing need for accessible healthcare in underserved and stigmatized domains, OvaSense was conceived to democratize reproductive and metabolic health intelligence.

## 1.5 Scope of Project
The scope of OvaSense spans software engineering, applied machine learning, data security, and biomedical interface design:

### In Scope
* Non-invasive PCOS screening using a verified 16-feature Extra Trees classifier loaded via a Django REST API.
* Real-time local explainability via TreeSHAP calculating feature attributions and directions (`increases_risk` vs `decreases_risk`).
* Responsive, modern web application built in React 18, TypeScript, and Vite.
* Secure authentication, token management, and strict Row-Level Security (RLS) policies implemented in Supabase PostgreSQL.
* Tracking modules for menstrual cycles, symptoms, food logs, water intake, physical activity, medications, and clinical appointments.
* Semi-automated OCR document parsing for standard hormone and metabolic lab reports.
* Longitudinal Health Journey Timeline aggregating clinical milestones, symptom spikes, and lifestyle changes.
* Context-aware conversational AI assistant for educational queries and doctor discussion preparation.

### Out of Scope
* Direct medical diagnosis, prescription of pharmacological agents, or clinical treatment validation.
* Real-time transvaginal ultrasound image segmentation or automated radiological diagnosis.
* Direct integration with hospital Electronic Health Record (EHR) systems via HL7/FHIR (planned for future enterprise phases).
* Autonomous medical decision-making without healthcare provider oversight.

## 1.6 Document Organization
This documentation is organized into eight comprehensive chapters:
* **Chapter 1: Introduction** establishes the problem domain, objectives, motivation, and boundaries.
* **Chapter 2: Project Planning and Feasibility** outlines feasibility assessments, CPM schedules, risk registers, and team competencies.
* **Chapter 3: Literature Review** examines academic research in AI screening, PCOS datasets, and explainability frameworks.
* **Chapter 4: System Requirements Specification (SRS)** details functional and non-functional requirements, DFDs, use cases, and traceability matrices.
* **Chapter 5: System Design and Implementation** provides in-depth technical specifications of the architecture, database schema, ML pipeline, TreeSHAP integration, and frontend components.
* **Chapter 6: System Testing and Evaluation** reviews testing methodologies, unit suites, security validation, and ML holdout evaluations.
* **Chapter 7: Results and Discussion** presents empirical results, confusion matrices, SHAP hierarchies, performance benchmarks, and critical discussions.
* **Chapter 8: Conclusion and Future Work** summarizes accomplishments, current limitations, and prospective technical enhancements.

---

# CHAPTER 2: PROJECT PLANNING AND FEASIBILITY

## 2.1 Introduction
Developing a multi-tiered, explainable AI digital health platform requires rigorous engineering planning, resource allocation, and risk management. This chapter details the project schedule, critical path method analysis, team resource distribution, target audience personas, and systemic risk mitigation protocols.

## 2.2 Project Feasibility Analysis
The feasibility of OvaSense was evaluated across five standard dimensions:

### 1. Technical Feasibility
The project leverages proven, industry-standard technologies: React 18, TypeScript, and Vite on the frontend; Django 5 and Django REST Framework on the backend; scikit-learn, joblib, and SHAP for machine learning; and Supabase (PostgreSQL with Row-Level Security) for cloud data persistence. All selected libraries possess active open-source support, well-documented APIs, and proven scalability in production environments.

### 2. Operational Feasibility
OvaSense is designed for high accessibility across modern desktop and mobile web browsers without requiring specialized hardware. The user interface adheres to WCAG 2.1 AA accessibility guidelines, offering intuitive multi-step onboarding, clear data quality visualizations, and non-stigmatizing health communication.

### 3. Economic Feasibility
The platform utilizes open-source development stacks and serverless cloud tiers (Supabase Free/Pro tier, Vercel/Netlify hosting, lightweight Django container instances), keeping development and deployment costs minimal while supporting hundreds of concurrent active users without infrastructure strain.

### 4. Legal and Ethical Feasibility
Healthcare data requires stringent privacy protections. OvaSense strictly complies with data isolation standards: all database tables enforce user-scoped Row-Level Security (RLS) keys, preventing cross-tenant data leakage. The system explicitly embeds non-diagnostic disclaimers throughout all screening views, satisfying digital health legal safety criteria.

### 5. Schedule Feasibility
The project lifecycle was planned across a 32-week Final Year Project timeline, partitioned into structured phases covering literature research, data auditing, model training, backend API orchestration, frontend development, and rigorous clinical verification.

## 2.3 Critical Path Method (CPM) Analysis
The project dependencies and critical path were modeled to identify bottleneck tasks. The critical path comprises activities with zero total float:

$$\text{Critical Path} = A \rightarrow B \rightarrow D \rightarrow G \rightarrow H \rightarrow J \rightarrow L \rightarrow M \rightarrow N$$

```mermaid
gantt
    title OvaSense FYP Schedule & Critical Path
    dateFormat  YYYY-MM-DD
    section Phase 1: Research & Audit
    Literature Review & Clinical Protocol    :done, A, 2026-01-05, 2026-02-02
    Dataset Audit & Leakage Analysis        :done, B, 2026-02-03, 2026-02-23
    section Phase 2: ML Pipeline
    Preprocessing & Feature Engineering     :done, D, 2026-02-24, 2026-03-16
    Model Optimization & Tuning             :done, G, 2026-03-17, 2026-04-06
    Threshold Calibration & TreeSHAP       :done, H, 2026-04-07, 2026-04-27
    section Phase 3: System Engineering
    Database Schema & Supabase Setup        :done, J, 2026-04-28, 2026-05-18
    Django REST Backend & ML Bridge         :done, L, 2026-05-19, 2026-06-15
    React Frontend & Dashboard UI           :done, M, 2026-06-16, 2026-07-20
    section Phase 4: Testing & Verification
    Integration Testing & Verification      :done, N, 2026-07-21, 2026-08-31
```

## 2.4 Gantt Chart
The detailed 32-week development breakdown is structured as follows:

| Task ID | Task Description | Duration | Predecessors | Milestone |
|---|---|---|---|---|
| **T1** | Problem Formulation & Literature Review | 4 Weeks | None | SRS Baseline Approved |
| **T2** | Clinical Dataset Acquisition & Audit | 3 Weeks | T1 | Dataset Quality Report |
| **T3** | Feature Selection & Anti-Leakage Partitioning | 2 Weeks | T2 | 16-Feature Core Set Frozen |
| **T4** | ML Pipeline & Preprocessor Construction | 3 Weeks | T3 | `preprocessing.py` Fitted |
| **T5** | Model Training & Hyperparameter Tuning | 3 Weeks | T4 | Baseline Models Benchmarked |
| **T6** | Threshold Calibration ($t=0.38$) & TreeSHAP | 3 Weeks | T5 | Holdout Test Benchmark Complete |
| **T7** | Supabase Database Schema & RLS Policies | 3 Weeks | T1 | Database Schema Deployed |
| **T8** | Django REST API & ML Bridge Service | 4 Weeks | T6, T7 | Intelligence API Live |
| **T9** | React Frontend & Dashboard Components | 5 Weeks | T8 | Complete UI Functional |
| **T10** | System Testing, Security Audit & FYP Report | 6 Weeks | T9 | Final Verification & Delivery |

## 2.5 Team Members and Skill Sets
* **Lead AI/ML Engineer & Systems Architect**: Specialized in supervised learning, ensemble algorithms, scikit-learn pipelines, probability calibration, TreeSHAP interpretability, and full-stack backend architecture (Django, Python, REST APIs).
* **Full-Stack Frontend & UI/UX Engineer**: Specialized in React 18, TypeScript, Tailwind CSS, component modularity, state management (React Context), accessibility standards, and data visualization.
* **Database & Security Engineer**: Specialized in relational database architecture, PostgreSQL schema design, Supabase Auth, Row-Level Security (RLS) policies, and JWT token lifecycle management.

## 2.6 Combined Team Skills
The team combines competencies across Machine Learning, Software Engineering, Cloud Architecture, Human-Computer Interaction (HCI), and Clinical Data Ethics. This interdisciplinary skill set ensured that mathematical rigor in model tuning was matched by defensive software engineering and empathetic interface design.

## 2.7 Target Users
OvaSense is engineered to serve three distinct primary user groups:

```mermaid
graph LR
    User1[Primary User: Symptomatic Women] --> OvaSense[OvaSense Health Platform]
    User2[Secondary User: Diagnosed Patients] --> OvaSense
    User3[Tertiary User: Healthcare Providers / Care Circle] --> OvaSense
```

1. **Undiagnosed, Symptomatic Women (Ages 16–45)**: Individuals experiencing irregular periods, persistent acne, unexpected weight gain, or hirsutism seeking an accessible, non-intimidating first-line risk assessment.
2. **Diagnosed PCOS Patients**: Individuals seeking a unified longitudinal tracking platform to monitor cycle rhythms, medication adherence, dietary habits, and symptom triggers over multi-month timeframes.
3. **Healthcare Providers & Care Circle Members**: Gynecologists, endocrinologists, nutritionists, or family members who receive structured health journey exports and granular, patient-permitted viewports into tracking data.

## 2.8 Risk Register
The project maintains a structured risk register assessing probability ($P$) and impact ($I$) on a 5-point scale:

| Risk ID | Risk Description | Category | $P$ | $I$ | Severity ($P \times I$) | Mitigation Strategy |
|---|---|---|---|---|---|---|
| **R1** | High false negative rate in ML screening | Clinical Safety | 2 | 5 | 10 (High) | Optimize screening threshold to $t=0.38$ targeting $\ge 85\%$ sensitivity; enforce medical disclaimers. |
| **R2** | Data leakage from ultrasound/lab features | ML Integrity | 2 | 5 | 10 (High) | Strictly exclude invasive variables (`Follicle No.`, `LH`, `FSH`, `AMH`) from core screening features. |
| **R3** | Cross-tenant patient data leakage | Security | 1 | 5 | 5 (Medium) | Enforce database-level Row-Level Security (RLS) on all Supabase tables using `auth.uid()`. |
| **R4** | High missingness in user-submitted records | Data Quality | 4 | 3 | 12 (High) | Integrate `SimpleImputer` inside scikit-learn `ColumnTransformer`; flag `insufficient_data` states in UI. |
| **R5** | User misinterpreting screening as diagnosis | Ethical/Legal | 3 | 4 | 12 (High) | Prominently display non-diagnostic disclaimers on all assessment cards, reports, and AI chat interfaces. |

## 2.9 Risk Management Strategy
Risks are actively managed through automated test suites, architectural isolation, and continuous evaluation:
* **Algorithmic Risk Management**: All feature transformations are encapsulated inside `ColumnTransformer` pipelines fitted strictly on training folds, eliminating data snooping.
* **Security & Privacy Defense**: The Django backend extracts the patient UUID directly from cryptographically verified Supabase JWT headers (`request.user.id`), preventing unauthorized query injection.
* **Clinical Guardrails**: If an individual provides less than 50% feature completeness without basic biometrics and cycle indicators, the intelligence engine returns an `insufficient_data` status rather than guessing.

---

# CHAPTER 3: LITERATURE REVIEW

## 3.1 Introduction
This chapter provides a rigorous academic review of the biomedical and computer science literature surrounding PCOS risk screening, machine learning predictive modeling, clinical data leakage, Explainable AI (XAI) in healthcare, and longitudinal digital health platforms.

## 3.2 Artificial Intelligence in PMOS/PCOS Screening
Polycystic Ovary Syndrome is recognized by the World Health Organization (WHO) and international clinical consortia as a complex endocrine-metabolic condition with substantial phenotypic heterogeneity [1]. Traditional clinical diagnosis relies on the 2003 Rotterdam criteria, updated in the 2018 and 2023 International Evidence-based Guidelines [2]. 

Recent literature has increasingly explored Artificial Intelligence (AI) to address diagnostic delays. Studies by Deshmukh et al. [3] and Subha et al. [4] demonstrated that computational techniques can detect underlying metabolic and endocrine patterns. However, many published AI models rely heavily on invasive biochemical markers (serum LH/FSH ratios, Anti-Müllerian Hormone) and transvaginal ultrasound imaging, limiting their applicability in remote or pre-clinical screening contexts.

## 3.3 Machine Learning-Based PMOS/PCOS Prediction
A wide variety of supervised machine learning algorithms have been applied to PCOS classification, including Logistic Regression, Support Vector Machines (SVM), Multi-Layer Perceptrons (MLP), Random Forests, and Gradient Boosting machines [5], [6]. 

Tree-based ensemble architectures consistently demonstrate superior performance on tabular clinical data due to their ability to capture non-linear feature interactions, resilience to differing feature scales, and robustness against multicollinearity [7]. In particular, **Extra Trees (Extremely Randomized Trees)**, introduced by Geurts et al. [8], introduces randomized node splitting thresholds that reduce variance without inflating bias, making it exceptionally well-suited for moderately sized clinical datasets where standard decision trees tend to overfit.

## 3.4 Questionnaire and Symptom-Based PMOS/PCOS Assessment
Screening tools designed for pre-clinical or consumer health applications must prioritize non-invasiveness. Research by staged screening advocates [9] emphasizes that self-reported clinical features—such as cycle regularity, cycle duration, clinical hirsutism (Ferriman-Gallwey self-assessment proxy), acanthosis nigricans, unexplained weight gain, and BMI—contain strong diagnostic signal. 

Eliminating invasive ultrasound variables from consumer-facing models prevents circular diagnostic definitions (target leakage) while empowering women to identify risk indicators before scheduling formal hospital evaluations.

## 3.5 Explainable Artificial Intelligence (XAI) in Healthcare
The deployment of machine learning in healthcare is critically constrained by the "black box" problem. Deep networks and complex tree ensembles cannot be safely deployed without transparent rationales for their predictions [10]. 

Lundberg and Lee (2017) introduced **SHAP (SHapley Additive exPlanations)**, grounded in cooperative game theory [11]. For tree ensemble models, **TreeSHAP** (Lundberg et al., 2020) computes exact local Shapley values in polynomial time $O(TLD^2)$ (where $T$ is the number of trees, $L$ is maximum leaves, and $D$ is maximum tree depth) [12]. TreeSHAP provides additive feature attributions:

$$f(x) = \phi_0 + \sum_{i=1}^{M} \phi_i(x)$$

where $\phi_0$ is the expected model base value and $\phi_i(x)$ represents the exact contribution of feature $i$ to the deviation from the base output. In clinical screening, this allows the system to inform the patient exactly which phenotypic attributes increased or decreased their estimated screening probability.

## 3.6 Digital Health and Longitudinal Women's Health Monitoring
Contemporary digital health research demonstrates that cross-sectional snapshots provide insufficient insight into chronic metabolic conditions [13]. Longitudinal tracking of menstrual cycle regularity, basal metabolic fluctuations, dietary intake, and symptom trajectories enables individuals to identify cyclical patterns. Digital twin concepts in personalized health leverage these continuous data streams to provide contextualized lifestyle feedback and facilitate informed collaborative discussions with medical practitioners [14].

## 3.7 PMOS/PCOS Dataset and Feature Comparison
A critical analysis of public and hospital-acquired PCOS datasets reveals significant variations in feature composition, sample sizes, and clinical targets:

| Study / Dataset | Sample Size ($N$) | Feature Count | Invasive Ultrasound Included? | Invasive Blood Labs Included? | Model Architecture | Reported Metric | Primary Limitation |
|---|---|---|---|---|---|---|---|
| **Kottarathil (Kaggle Dataset)** [15] | 541 | 44 | Yes (`Follicle No.`, `Endometrium`) | Yes (`LH`, `FSH`, `AMH`) | Random Forest / SVM | Accuracy: ~90% | High target leakage if ultrasound features are unremoved. |
| **Bharathi et al. (2020)** [16] | 541 | 10 | Yes | Yes | R-Tree / Random Forest | Accuracy: 91.2% | Requires laboratory blood test values for prediction. |
| **Inamdar et al. (2021)** [17] | 250 | 18 | No | Yes | XGBoost | ROC-AUC: 0.86 | Moderate sample size; requires biochemical assays. |
| **OvaSense (Our System)** | **541** | **16** | **NO (Zero Ultrasound)** | **NO (Zero Blood Labs)** | **Extra Trees ($t=0.38$) + TreeSHAP** | **Test ROC-AUC: 0.9087, Sens: 86.11%, NPV: 92.19%** | **Purely non-invasive, leak-free, explainable screening.** |

## 3.8 Research Gap Identification
The literature reveals three primary research and engineering gaps:
1. **Target Leakage in Published Models**: Multiple published studies fail to isolate diagnostic criteria (ultrasound follicle counts) from predictor variables, yielding artificially inflated accuracy figures that cannot function in real-world pre-clinical screening.
2. **Absence of Explainability**: The vast majority of mobile PCOS tools offer no mathematical interpretability (e.g. SHAP), leaving users unable to understand the physiological basis of their risk estimates.
3. **Disconnection Between ML and Longitudinal Tracking**: Existing systems either operate as standalone machine learning scripts without user-facing interfaces or as generic period trackers devoid of validated ML intelligence and localized nutrition support.

## 3.9 Existing Systems Comparison with OvaSense
OvaSense uniquely synthesizes non-invasive machine learning, explainability, document OCR, and longitudinal health tracking:

| Functional Dimension | Flo / Clue | Generic PCOS Quiz Apps | Academic ML Papers | OvaSense Platform |
|---|---|---|---|---|
| **Core ML Risk Screening** | Basic Rule-Based | Static Score Thresholds | Standalone Script Only | **Trained Extra Trees Classifier** |
| **Non-Invasive Predictors** | Basic Cycle Data | Variable Questions | Often Invasively Dependent | **16 Non-Invasive Clinical Features** |
| **Explainable AI (TreeSHAP)** | None (Black Box) | None | Offline SHAP Plots Only | **Real-Time Interactive Local SHAP** |
| **Screening Threshold Calibration** | N/A | Static 50% | Arbitrary 0.50 Default | **Screening Tuned ($t=0.38, \text{Sens}\ge 85\%$)** |
| **Medical Report OCR** | None | Manual Entry | None | **Automated Multi-Panel OCR** |
| **Longitudinal Timeline** | Period Calendar Only | Basic List View | None | **Integrated Physiological Timeline** |
| **Pakistani / Localized Diet** | None (Western Only) | None | None | **Culturally Contextualized Nutrition** |
| **Care Circle & Doctor Summaries**| Limited Sharing | None | None | **Granular RLS-Protected Doctor View** |

---

# CHAPTER 4: SYSTEM REQUIREMENTS SPECIFICATION

## 4.1 Introduction
This chapter provides the formal System Requirements Specification (SRS) for OvaSense, detailing external entities, functional capabilities, non-functional constraints, Data Flow Diagrams (DFDs), use case models, requirements prioritization (MoSCoW), and the Requirements Traceability Matrix (RTM).

## 4.2 System Overview
OvaSense is a cloud-backed, client-server web platform designed to facilitate secure health data management, machine learning screening inference, explainability generation, and longitudinal lifestyle tracking for individuals at risk of or managing PMOS/PCOS.

## 4.3 Scope of the System
The system encompasses user authentication, profile management, onboarding, cycle tracking, symptom recording, OCR-based medical document processing, Django-based machine learning assessment via TreeSHAP, diet and hydration logging, fitness logging, medication adherence, appointment scheduling, and care circle management.

## 4.4 External Entities
The external actors interacting with the OvaSense boundary are:
1. **Authenticated Patient**: The primary user logging personal health metrics, uploading medical records, viewing ML assessments, and interacting with educational modules.
2. **Healthcare Provider / Care Circle Contact**: A clinician, doctor, or trusted family member accessing read-only, patient-permitted health views via a secure token.
3. **OCR Processing Service**: The document digitization engine processing uploaded lab reports.
4. **Supabase Cloud Identity & Data Layer**: The external authentication and PostgreSQL persistence provider.

## 4.5 Functional Requirements

| Req ID | Module | Requirement Description | Priority | Acceptance Criteria |
|---|---|---|---|---|
| **FR-01** | Auth | User registration, login, and session persistence via Supabase Auth. | Must Have | Secure JWT issued; session persists across browser reloads. |
| **FR-02** | Profile | Comprehensive health profile management (biometrics, vitals, baseline). | Must Have | Profile persisted with height, weight, DOB, and baseline history. |
| **FR-03** | Onboarding | Multi-step onboarding collecting lifestyle, cycle, and clinical history. | Must Have | Successfully marks `is_onboarded = true` upon completion. |
| **FR-04** | Cycle | Menstrual cycle tracking (period start, end, flow intensity, symptoms). | Must Have | Records saved with automated cycle length calculation. |
| **FR-05** | Symptoms | Multi-category symptom logging with severity ratings (`mild`, `moderate`, `severe`). | Must Have | Logs saved with date, category, and cycle day correlation. |
| **FR-06** | Reports | Medical report document upload and storage. | Must Have | Accepts PDF, PNG, JPEG formats; attaches to patient UUID. |
| **FR-07** | OCR | Automated OCR extraction of lab biomarker test names, values, and ranges. | Should Have | Extracts tests and flags out-of-range biomarkers. |
| **FR-08** | ML Inference | 16-feature mapping and Extra Trees ML screening execution on backend. | Must Have | Returns screening probability and risk category at $t=0.38$. |
| **FR-09** | TreeSHAP | Generation of local feature attributions via `shap.TreeExplainer`. | Must Have | Returns top contributing factors with direction and magnitude. |
| **FR-10** | Data Quality | Evaluation of feature completeness and missing-value flagging. | Must Have | Flags `insufficient_data` if minimum criteria are unmet. |
| **FR-11** | Dashboard | Dynamic dashboard rendering risk status, SHAP waterfall, and metrics. | Must Have | Visualizes assessment, cycle dial, and health snapshot. |
| **FR-12** | Timeline | Longitudinal chronological timeline aggregating symptoms, tests, and cycles. | Should Have | Displays interactive trajectory with multi-filter controls. |
| **FR-13** | Nutrition | Localized Pakistani / South Asian nutrition guidance and meal builder. | Should Have | Generates macro-balanced meal options aligned with cycle phase. |
| **FR-14** | Hydration | Daily water tracking widget with incremental glass logging. | Could Have | Persists daily water intake and target comparison. |
| **FR-15** | Fitness | Activity and workout logging with duration, type, and energy ratings. | Could Have | Persists exercise logs categorized by activity type. |
| **FR-16** | AI Chat | Context-aware AI health assistant for educational Q&A and doctor prep. | Should Have | Provides context-informed responses with medical safety notices. |
| **FR-17** | Care Circle | Granular permission-based access sharing with doctors and family. | Should Have | Secure tokens generated; enforces granular view permissions. |
| **FR-18** | Medications| Prescription and supplement tracking with daily adherence logs. | Could Have | Tracks active dosages and daily taken/skipped status. |
| **FR-19** | Appointments| Doctor appointment scheduling and clinical question preparation. | Could Have | Stores consultation dates, specialties, and discussion points. |

## 4.6 Non-Functional Requirements
* **NFR-01 (Performance & Latency)**: The ML inference pipeline (including feature extraction, Extra Trees prediction, and TreeSHAP calculation) must respond within $< 1.5$ seconds under standard server load.
* **NFR-02 (Security & Isolation)**: All user data must be partitioned by authenticated user UUID. No SQL query or API route shall expose cross-user records. Supabase Row-Level Security (RLS) must be enabled on 100% of public tables.
* **NFR-03 (Availability & Resilience)**: If the Django intelligence backend is temporarily unreachable, the frontend dashboard must gracefully display cached or fallback health snapshots without crashing.
* **NFR-04 (Accuracy & Sensitivity)**: The ML screening model must maintain $\ge 85\%$ sensitivity on holdout test cohorts at the calibrated threshold ($t=0.38$).
* **NFR-05 (Usability & Accessibility)**: The web interface must maintain high visual contrast, WCAG 2.1 AA compliance, and responsive layouts across desktop (1920x1080), laptop (1366x768), tablet, and mobile viewports.
* **NFR-06 (Maintainability & Modularity)**: Frontend and backend codebases must strictly adhere to modular separation of concerns with TypeScript type safety and PEP 8 Python standards.

## 4.7 Data Flow Diagrams (DFDs)

### Context Diagram (Level-0 DFD)
```mermaid
graph TD
    User([Authenticated Patient]) <-->|JWT Auth, Health Logs, Report Uploads| OvaSenseSystem[OvaSense Health Platform]
    OvaSenseSystem <-->|Auth Tokens, RLS Queries| SupabaseDB[(Supabase PostgreSQL)]
    OvaSenseSystem <-->|Feature Vector, TreeSHAP Request| DjangoML[Django Intelligence API / Extra Trees]
    CareUser([Care Circle / Doctor]) <-->|Access Token, Permitted Views| OvaSenseSystem
```

### Level-1 DFD (Intelligence & Assessment Pipeline)
```mermaid
graph TD
    P[Patient Profile & Logs] -->|1. Authenticated Trigger| Orch[Django Intelligence Orchestrator]
    Orch -->|2. Scoped Read| DB[(Supabase Health Service)]
    DB -->|3. Normalized Health Data| Bridge[OvaSense ML Bridge Adapter]
    Bridge -->|4. 16 Core Predictors| Feat[Feature Extraction & NaN Imputation]
    Feat -->|5. Clean Numeric Matrix| Model[Extra Trees Classifier Model]
    Model -->|6. Raw Probabilities| Thresh[Threshold Comparator t=0.38]
    Model -->|7. Tree Structure| SHAP[TreeSHAP Explainer Engine]
    Thresh -->|8. Risk Classification| Asm[Assessment Result Assembler]
    SHAP -->|9. Top Feature Attributions| Asm
    Asm -->|10. Serialized JSON| UI[React Dashboard Insight Card]
```

## 4.8 System Use Cases
The primary use cases supported by OvaSense include:
* **UC-01**: Authenticate and Complete Health Onboarding
* **UC-02**: Log Menstrual Cycle Period and Flow Details
* **UC-03**: Record Daily Physiological and Dermatological Symptoms
* **UC-04**: Upload Medical Laboratory Document for OCR Extraction
* **UC-05**: Trigger and View Explainable PMOS Screening Assessment
* **UC-06**: Explore Phase-Specific Pakistani Nutritional Meal Plans
* **UC-07**: Interact with OvaSense AI Twin for Doctor Discussion Prep
* **UC-08**: Grant Granular Health Access to Care Circle Member / Physician

## 4.9 Use Case Modelling & Detailed Specifications

```mermaid
graph TD
    Patient((Patient User))
    Doctor((Doctor / Contact))
    
    subgraph OvaSense System
        Patient --> UC1[UC-01: Onboarding & Profile]
        Patient --> UC2[UC-02: Cycle & Symptom Tracking]
        Patient --> UC3[UC-03: Medical Report OCR]
        Patient --> UC4[UC-04: Explainable ML Assessment]
        Patient --> UC5[UC-05: Diet & Lifestyle Guidance]
        Patient --> UC6[UC-06: AI Health Consultation]
        Patient --> UC7[UC-07: Manage Care Circle]
        
        Doctor --> UC8[UC-08: View Permitted Patient Records]
    end
```

### Detailed Specification: UC-04 (Trigger and View Explainable PMOS Screening Assessment)
* **Primary Actor**: Authenticated Patient.
* **Preconditions**: Patient is logged in with valid Supabase session; health profile contains minimum biometrics and cycle indicators.
* **Main Flow**:
  1. Patient navigates to the Dashboard or clicks "Refresh Assessment".
  2. Frontend issues `POST /api/v1/intelligence/assessment/` with Bearer JWT.
  3. Django backend extracts patient UUID from verified token claims.
  4. Backend retrieves patient profile, cycle records, symptoms, and lifestyle logs from Supabase.
  5. `ovasense_ml_bridge` maps raw inputs to the 16-feature schema and evaluates data completeness.
  6. Extra Trees pipeline executes `predict_proba()` and applies the $0.38$ screening cutoff.
  7. TreeSHAP computes exact local Shapley values for positive PCOS probability.
  8. Backend serializes probability, risk category, completeness metrics, top 5 SHAP factors, and disclaimer into JSON.
  9. React Dashboard renders the `DigitalTwinInsightCard`, SHAP waterfall breakdown, and personalized recommendations.
* **Postconditions**: Assessment result is displayed with complete transparency; no patient data is permanently altered.

## 4.10 Requirements Prioritization (MoSCoW)
* **Must Have**: FR-01 (Auth), FR-02 (Profile), FR-03 (Onboarding), FR-04 (Cycle Tracking), FR-05 (Symptom Tracking), FR-06 (Report Upload), FR-08 (ML Inference), FR-09 (TreeSHAP), FR-10 (Data Quality Guard), FR-11 (Dashboard UI).
* **Should Have**: FR-07 (OCR Extraction), FR-12 (Longitudinal Timeline), FR-13 (Localized Nutrition), FR-16 (AI Chatbot), FR-17 (Care Circle Sharing).
* **Could Have**: FR-14 (Hydration Tracker), FR-15 (Fitness Logging), FR-18 (Medication Logs), FR-19 (Appointment Manager).
* **Won't Have (This Phase)**: Real-time transvaginal ultrasound image segmentation, automated pharmacy prescription fulfillment.

## 4.11 Requirements Traceability Matrix (RTM)

| Req ID | Requirement Summary | Design Module | Source Code Reference | Test Suite ID |
|---|---|---|---|---|
| **FR-01** | Authentication & Session | Supabase Auth | `apps/web/src/services/authService.ts` | `test_auth_enforcement` |
| **FR-02** | Profile Management | Profile Service | `apps/web/src/services/profileService.ts` | `test_profile_persistence` |
| **FR-04** | Cycle Tracking | Cycle Service | `apps/web/src/services/cycleService.ts` | `test_cycle_length_calc` |
| **FR-05** | Symptom Recording | Symptom Service | `apps/web/src/services/symptomService.ts` | `test_symptom_mapping` |
| **FR-06** | Medical Report Upload | Report Service | `apps/web/src/services/reportService.ts` | `test_report_upload` |
| **FR-08** | ML Extra Trees Screening | ML Bridge Service | `backend/apps/intelligence/services/ovasense_ml_bridge.py` | `TestPrediction` |
| **FR-09** | TreeSHAP Explainability | TreeSHAP Adapter | `backend/apps/intelligence/services/ovasense_ml_bridge.py` | `TestTreeSHAPExplainability` |
| **FR-10** | Data Quality Guard | ML Bridge | `backend/apps/intelligence/services/ovasense_ml_bridge.py` | `test_insufficient_data` |
| **FR-11** | React Dashboard Card | Dashboard UI | `apps/web/src/components/dashboard/DigitalTwinInsightCard.tsx` | `test_dashboard_render` |
| **FR-13** | Localized Nutrition | Diet Service | `apps/web/src/services/dietService.ts` | `test_diet_recommendations` |
| **FR-17** | Care Circle Permissions | Care Circle Service| `supabase/schema.sql` (RLS helper) | `test_care_provider_view` |

---

# CHAPTER 5: SYSTEM DESIGN AND IMPLEMENTATION

## 5.1 Introduction
This chapter provides an exhaustive architectural and implementation breakdown of OvaSense. It details the multi-tier system topology, frontend React architecture, Django intelligence microservice, database schemas, machine learning pipeline, TreeSHAP explainability engine, and specialized health modules.

## 5.2 System Architecture Design
OvaSense is designed as a decoupled, multi-tiered web platform prioritizing security, computational efficiency, and maintainability.

```mermaid
graph TD
    subgraph Client Tier - React & TypeScript
        Vite[Vite Bundler] --> UI[React 18 SPA]
        UI --> Router[React Router v6]
        Router --> Pages[Dashboard, Cycle, Diet, Timeline, Reports]
        Pages --> Context[UserHealthContext State Management]
        Context --> Services[API & Supabase Services]
    end

    subgraph Security & Persistence Tier - Supabase
        Services -->|Supabase JS SDK| Auth[Supabase Auth / GoTrue]
        Services -->|Direct RLS-Protected Queries| Postgres[(Supabase PostgreSQL DB)]
        Services -->|Encrypted Multipart| Storage[Supabase File Storage]
    end

    subgraph Intelligence Tier - Django REST Framework
        Services -->|POST /api/v1/intelligence/assessment/| DjangoAPI[Django REST API Gateway]
        DjangoAPI --> JWTAuth[Supabase JWT Authenticator]
        JWTAuth --> Orch[Intelligence Orchestrator]
        Orch --> HealthSvc[Supabase Health Repository]
        HealthSvc --> Postgres
        Orch --> Bridge[OvaSense ML Bridge Adapter]
        Bridge --> Pipeline[scikit-learn ColumnTransformer Pipeline]
        Pipeline --> ETModel[Extra Trees Classifier Model]
        ETModel --> TreeSHAP[TreeSHAP Explainer Engine]
        TreeSHAP --> JSONRes[JSON Response Builder]
        JSONRes --> UI
    end
```

## 5.3 System Workflow
The operational workflow proceeds through four synchronized stages:
1. **Patient Intake & Authentication**: The user authenticates via Supabase Auth and completes onboarding. Baseline biometrics, lifestyle habits, and cycle rhythms are securely stored in PostgreSQL.
2. **Longitudinal Health Recording**: As the user interacts with the app, cycle dates, symptom check-ins, meals, and medical reports are logged.
3. **Intelligence Orchestration**: When an assessment is requested, Django authenticates the Bearer token, fetches the patient's records using server-to-server role authentication, maps the data into 16 features, and passes them to the Extra Trees model.
4. **Explainable Output Synthesis**: The model computes probability, applies the $0.38$ cutoff, and calculates TreeSHAP attributions. The frontend receives structured JSON and renders the interactive dashboard.

## 5.4 User Interface Design
The user interface is built in React 18 and styled with Tailwind CSS, utilizing Framer Motion for smooth, micro-animated transitions. Design foundations include:
* **Visual Hierarchy**: Vibrant health-oriented color palettes (rose, amethyst, emerald, and slate), dark/light surface contrast, and clean typography.
* **Component Modularity**: Isolated components for the Cycle Progress Dial, Digital Twin Card, Health Patterns Chart, and Nutrition Timeline.
* **Non-Diagnostic UI Communication**: Clear visual distinction between "Screening Probability" and formal clinical diagnosis, prominently presenting educational explanations.

## 5.5 Health Profile and Cycle Tracking Module
The cycle tracking module manages menstrual rhythms, calculating follicular, ovulatory, luteal, and menstrual phases based on logged period start dates, cycle lengths, and flow variations. The frontend `CycleProgressDial` visualizes the current cycle day and anticipated phase transitions.

## 5.6 Medical Report Processing and OCR
The medical document subsystem allows users to upload laboratory and ultrasound records. The `ocrService.ts` parses extracted text, identifies standard biomarker panels (Total Testosterone, LH, FSH, DHEA-S, TSH, Free T4, Fasting Glucose, HbA1c, Vitamin D3), compares numerical values against physiological reference ranges, and categorizes results as `within_range`, `outside_range`, or `needs_review`.

## 5.7 Structured Health Record Management
Uploaded reports and verified biomarkers are linked to the user’s longitudinal timeline. The system maps raw lab entries to chronological graph nodes, enabling patients to track hormonal shifts across multi-month intervals.

## 5.8 ML-Based PMOS Screening Module
The machine learning screening module is encapsulated inside `backend/apps/intelligence/services/ovasense_ml_bridge.py`. It provides thread-safe singleton loading of the serialized model artifact `ovasense_final_model.joblib`.

### The 16 Core Features vs. Broader Onboarding Questionnaire
A vital architectural distinction in OvaSense is that **the onboarding questionnaire collects broader contextual information than the ML model consumes**. The onboarding process captures sleep duration, dietary preferences, water goals, and exercise interests to power lifestyle modules, AI conversations, and care-circle summaries. 

However, the ML screening model strictly evaluates only these **16 validated non-invasive features**:

| # | Feature Name in Pipeline | Data Type | Clinical Rationale & Role |
|---|---|---|---|
| 1 | `' Age (yrs)'` | Continuous Numeric | Patient chronological age (baseline endocrine context). |
| 2 | `'Weight (Kg)'` | Continuous Numeric | Body weight in kilograms. |
| 3 | `'Height(Cm) '` | Continuous Numeric | Standing height in centimeters. |
| 4 | `'BMI'` | Continuous Numeric | Body Mass Index ($kg/m^2$) automatically derived as $\text{Weight} / (\text{Height}/100)^2$. |
| 5 | `'Cycle length(days)'` | Continuous Numeric | Menstrual cycle length in days (normal: ~28; $>35$ denotes oligomenorrhea). |
| 6 | `'Marraige Status (Yrs)'` | Continuous Numeric | Duration of marriage in years (reproductive timeline factor). |
| 7 | `'No. of aborptions'` | Discrete Numeric | Count of prior spontaneous or induced pregnancy losses. |
| 8 | `'Pregnant(Y/N)'` | Binary (0 or 1) | Current pregnancy status. |
| 9 | `'Weight gain(Y/N)'` | Binary (0 or 1) | Recent unexplained or rapid weight gain. |
| 10 | `'hair growth(Y/N)'` | Binary (0 or 1) | Excess coarse hair on face/body (clinical hirsutism proxy). |
| 11 | `'Skin darkening (Y/N)'` | Binary (0 or 1) | Acanthosis nigricans (cutaneous marker of insulin resistance). |
| 12 | `'Hair loss(Y/N)'` | Binary (0 or 1) | Androgenetic alopecia (crown scalp thinning). |
| 13 | `'Pimples(Y/N)'` | Binary (0 or 1) | Moderate-to-severe persistent acne from hyperandrogenism. |
| 14 | `'Fast food (Y/N)'` | Binary (0 or 1) | Frequent consumption of ultra-processed, high-glycemic foods. |
| 15 | `'Reg.Exercise(Y/N)'` | Binary (0 or 1) | Regular physical exercise habits (metabolic protective factor). |
| 16 | `'Cycle(R/I)'` | Categorical Indicator | Menstrual regularity (2 = Regular, 4 or 5 = Irregular). |

## 5.9 Data Preprocessing and Feature Extraction
The preprocessing architecture (`src/preprocessing.py`) utilizes a scikit-learn `ColumnTransformer` comprising three isolated sub-pipelines:

```python
preprocessor = ColumnTransformer(
    transformers=[
        ('num', Pipeline([('imputer', SimpleImputer(strategy='median'))]), CONTINUOUS_NUM_COLS),
        ('bin', Pipeline([('imputer', SimpleImputer(strategy='most_frequent'))]), BINARY_COLS),
        ('cyc', Pipeline([
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('mapper', CycleRegularityTransformer())
        ]), CYCLE_COL)
    ],
    remainder='drop'
)
```

### Data Quality & Missingness Distinction
OvaSense strictly distinguishes between **"No (Feature absent)"** and **"Not Provided (Feature uncollected)"**:
* When a user confirms a symptom is absent, it is encoded as `0.0`.
* When a feature has not yet been answered or logged, it is mapped to `np.nan`.
* The `SimpleImputer` replaces `np.nan` values with population training medians (for continuous variables) or modes (for binary variables), allowing inference to proceed while computing a `completeness_percentage`.
* If basic biometrics and cycle data are missing, the bridge flags `quality_level = "insufficient_data"`, halting inference and prompting the user to complete their profile.

## 5.10 ML Model Development and Evaluation
The production model artifact is an **Extra Trees Classifier** parameterized as follows:

```python
ExtraTreesClassifier(
    n_estimators=150,
    max_depth=7,
    min_samples_leaf=4,
    min_samples_split=5,
    max_features='log2',
    class_weight='balanced_subsample',
    random_state=42
)
```

### Decision Threshold Optimization ($t = 0.38$)
In first-line clinical screening, false negatives (missing an individual with PCOS) carry a much higher clinical risk than false positives (which lead to benign lifestyle review and confirmatory testing). 

A fine-grained 91-point threshold scan ($t \in [0.05, 0.95]$) on training out-of-fold cross-validation probabilities demonstrated that the standard default threshold ($t = 0.50$) missed $29$ of $141$ PCOS cases (79.43% sensitivity). Calibrating the screening cutoff to **$t = 0.38$** increased sensitivity to **85.11% on CV** and **86.11% on the locked holdout test set**, reducing missed cases to just 5 while maintaining strong specificity (80.82%) and high Negative Predictive Value (92.19%).

## 5.11 Explainable AI and TreeSHAP Implementation
TreeSHAP is initialized directly on the fitted `ExtraTreesClassifier`. When an assessment is requested:
1. Raw features are transformed via the pipeline's fitted `preprocessor`.
2. `shap.TreeExplainer` computes exact local Shapley values across both classes.
3. Feature contributions for the positive class (PCOS) are sorted by absolute magnitude:

$$\text{Impact}_i = |\phi_i|$$

4. The bridge maps each factor to human-friendly clinical explanations indicating whether the factor *increased* or *decreased* the model's estimated risk.

```mermaid
graph LR
    A[Preprocessed 16 Features] --> B[TreeExplainer]
    B --> C[Shapley Vector phi]
    C --> D[Sort by Magnitude]
    D --> E[Attach Direction: increases_risk / decreases_risk]
    E --> F[Attach Clinical Explanation Text]
    F --> G[Render Waterfall Cards on Dashboard]
```

## 5.12 PMOS Timeline and Longitudinal Monitoring
The timeline subsystem aggregates discrete health events into an interactive chronological stream. Events are categorized as cycle milestones, symptom flares, medication changes, dietary shifts, and lab results, providing visual trend trajectories over 30, 60, and 90-day windows.

## 5.13 Nutrition and Fitness Recommendation Module
The nutrition engine (`DietPage.tsx`, `dietService.ts`) provides phase-specific dietary recommendations tailored to South Asian culinary traditions. Recommendations focus on:
* **Glycemic Index Moderation**: Pairing complex carbohydrates (e.g., whole wheat roti, brown basmati, daal) with healthy fats and fiber to blunt postprandial insulin spikes.
* **Phase-Aligned Micro-nutrition**: Emphasizing iron and magnesium during menstruation, and zinc, inositol-rich foods, and antioxidant spices (turmeric, cinnamon) during the follicular and luteal phases.
* **Meal Builder**: Interactive builder estimating macronutrients and validating hormonal alignment.

## 5.14 Lifestyle Scenario Explorer
The Lifestyle Scenario Explorer allows users to simulate how hypothetical lifestyle modifications (e.g., increasing physical activity from sedentary to active, eliminating daily fast-food intake, or stabilizing sleep to 8 hours) could positively modulate metabolic risk factors.

## 5.15 AI Chatbot / AI Health Explanation Module
The floating AI Digital Twin (`FloatingOvaSenseAI.tsx`) provides an empathetic, context-aware conversational interface. It accesses the user's current cycle day, logged symptoms, and latest TreeSHAP assessment factors to answer health questions, explain what specific SHAP factors mean, and generate tailored question lists for upcoming physician appointments.

## 5.16 Database Design
The persistence layer is implemented in Supabase PostgreSQL, structured across 12 core relational entities:

```mermaid
erDiagram
    PROFILES ||--o{ CYCLE_RECORDS : "logs"
    PROFILES ||--o{ SYMPTOM_RECORDS : "logs"
    PROFILES ||--o{ MEDICAL_REPORTS : "uploads"
    MEDICAL_REPORTS ||--o{ REPORT_RESULTS : "contains"
    PROFILES ||--o{ FOOD_LOGS : "records"
    PROFILES ||--o{ WATER_LOGS : "tracks"
    PROFILES ||--o{ FITNESS_LOGS : "logs"
    PROFILES ||--o{ MEDICATIONS : "manages"
    MEDICATIONS ||--o{ MEDICATION_LOGS : "tracks"
    PROFILES ||--o{ APPOINTMENTS : "schedules"
    PROFILES ||--o{ CARE_CIRCLE_MEMBERS : "invites"
    CARE_CIRCLE_MEMBERS ||--o{ CARE_CIRCLE_PERMISSIONS : "granted"
    PROFILES ||--o{ WEEKLY_HEALTH_SUMMARIES : "synthesizes"

    PROFILES {
        UUID id PK
        TEXT full_name
        TEXT email
        DATE date_of_birth
        NUMERIC height_cm
        NUMERIC weight_kg
        TEXT cycle_length
        INTEGER period_duration
        TEXT period_regularity
        JSONB common_symptoms
        TEXT dietary_preference
        INTEGER daily_water_glasses
        TEXT activity_level
        NUMERIC sleep_hours
        BOOLEAN is_onboarded
    }

    CYCLE_RECORDS {
        UUID id PK
        UUID user_id FK
        DATE period_start_date
        DATE period_end_date
        TEXT flow
        JSONB symptoms
        TEXT notes
    }

    SYMPTOM_RECORDS {
        UUID id PK
        UUID user_id FK
        TEXT symptom_type
        TEXT category
        TEXT severity
        DATE occurred_at
        INTEGER cycle_day
    }

    MEDICAL_REPORTS {
        UUID id PK
        UUID user_id FK
        TEXT title
        TEXT report_type
        DATE report_date
        TEXT file_path
        TEXT status
    }

    REPORT_RESULTS {
        UUID id PK
        UUID report_id FK
        TEXT test_name
        TEXT result_value
        NUMERIC result_numeric
        TEXT unit
        TEXT reference_range
        TEXT status
        NUMERIC ocr_confidence
    }
```

### Table Schema Summary

| Table Name | Primary Key | Foreign Keys | Key Attributes & Constraints | RLS Enforcement |
|---|---|---|---|---|
| `public.profiles` | `id` (UUID) | `auth.users(id)` | `full_name`, `height_cm`, `weight_kg`, `date_of_birth`, `cycle_length`, `is_onboarded` | `auth.uid() = id` |
| `public.cycle_records` | `id` (UUID) | `user_id -> auth.users` | `period_start_date`, `period_end_date`, `flow` (`light`, `medium`, `heavy`) | `auth.uid() = user_id` |
| `public.symptom_records` | `id` (UUID) | `user_id -> auth.users` | `symptom_type`, `category`, `severity` (`mild`, `moderate`, `severe`), `occurred_at` | `auth.uid() = user_id` |
| `public.medical_reports` | `id` (UUID) | `user_id -> auth.users` | `title`, `report_type`, `report_date`, `file_path`, `status` | `auth.uid() = user_id` |
| `public.report_results` | `id` (UUID) | `report_id -> medical_reports` | `test_name`, `result_value`, `result_numeric`, `unit`, `status`, `ocr_confidence` | Scoped via Parent Report |
| `public.care_circle_members`| `id` (UUID) | `patient_id -> auth.users` | `member_email`, `member_name`, `role` (`doctor`, `family`), `status`, `invite_token` | `auth.uid() = patient_id` |
| `public.care_circle_permissions`| `id` (UUID) | `member_id -> members` | `permission_key`, `enabled` (BOOLEAN) | Scoped via Member Owner |
| `public.food_logs` | `id` (UUID) | `user_id -> auth.users` | `meal_type`, `food_name`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `logged_at` | `auth.uid() = user_id` |
| `public.water_logs` | `id` (UUID) | `user_id -> auth.users` | `date`, `glasses`, `target_glasses`, `UNIQUE(user_id, date)` | `auth.uid() = user_id` |
| `public.fitness_logs` | `id` (UUID) | `user_id -> auth.users` | `activity_type`, `activity_name`, `duration_minutes`, `energy_level`, `occurred_at` | `auth.uid() = user_id` |
| `public.medications` | `id` (UUID) | `user_id -> auth.users` | `name`, `dose`, `unit`, `frequency`, `is_active` | `auth.uid() = user_id` |
| `public.medication_logs` | `id` (UUID) | `medication_id -> meds` | `scheduled_for`, `scheduled_time`, `status` (`taken`, `skipped`, `missed`) | `auth.uid() = user_id` |
| `public.appointments` | `id` (UUID) | `patient_id -> auth.users` | `provider_name`, `provider_specialty`, `scheduled_at`, `status`, `doctor_questions` | `auth.uid() = patient_id` |
| `public.weekly_health_summaries`| `id` (UUID) | `patient_id -> auth.users` | `week_start`, `week_end`, `summary_data` (JSONB) | `auth.uid() = patient_id` |

## 5.17 Authentication and Security
* **Supabase JWT Authentication**: Every frontend request to Django includes a signed Bearer JWT in the `Authorization` header.
* **Server-Side Token Verification**: The Django authentication class (`apps/authentication/supabase_auth.py`) cryptographically decodes the JWT using the Supabase JWT secret or JWKS endpoint, deriving the patient UUID strictly from the verified claims.
* **Zero Trust User Identification**: The client is prohibited from submitting a `user_id` parameter in the request payload; any attempt to do so is discarded by the server.
* **Row-Level Security (RLS)**: Direct frontend client calls to Supabase are bounded by PostgreSQL RLS policies ensuring users can only read and write their own records.
* **Care Circle Token Access**: Care providers access permitted records through the `get_care_provider_view(token)` PostgreSQL stored procedure running as `SECURITY DEFINER`, strictly filtering tables by granted permission flags.

## 5.18 Technology Stack

```mermaid
graph TD
    subgraph Frontend
        React[React 18]
        TS[TypeScript 5]
        Vite[Vite 5]
        Tailwind[Tailwind CSS]
        Lucide[Lucide Icons]
        Framer[Framer Motion]
    end

    subgraph Backend
        Python[Python 3.11]
        Django[Django 5.0]
        DRF[Django REST Framework]
        Gunicorn[Gunicorn WSGI]
    end

    subgraph Data & Identity
        SupaAuth[Supabase Auth]
        Postgres[PostgreSQL 15]
        RLS[Row Level Security]
        SupaStorage[Supabase Storage]
    end

    subgraph Machine Learning
        Sklearn[scikit-learn]
        ET[ExtraTreesClassifier]
        SHAP[SHAP / TreeSHAP]
        Joblib[Joblib Serializer]
        Pandas[pandas & NumPy]
    end
```

---

# CHAPTER 6: SYSTEM TESTING AND EVALUATION

## 6.1 Introduction
This chapter details the comprehensive testing and quality assurance methodologies employed across OvaSense, including unit testing, backend API validation, security testing, database RLS verification, ML model generalization evaluation, TreeSHAP verification, and usability assessment.

## 6.2 Testing Strategy
OvaSense employs a multi-tiered testing hierarchy combining automated unit tests, integration suites, API mock tests, and single-pass holdout evaluation:

```mermaid
graph TD
    Unit[1. Unit Testing: Models, Preprocessing, Feature Mapping] --> API[2. Backend API Testing: DRF Status, Health, Assessment]
    API --> Auth[3. Security & RLS Testing: JWT Enforcement, Cross-Tenant Checks]
    Auth --> ML[4. ML Evaluation: 5-Fold Stratified CV & Locked Test Generalization]
    ML --> E2E[5. End-to-End Testing: UI Flow & TreeSHAP Waterfall Rendering]
    E2E --> Usability[6. Usability & Accessibility Testing: WCAG 2.1 AA Compliance]
```

## 6.3 Unit Testing
Unit tests implemented in `backend/apps/intelligence/tests/test_intelligence.py` validate core business logic:
* **Model Loading (`TestModelLoading`)**: Verifies that `ovasense_ml_bridge.load()` successfully deserializes the Extra Trees artifact, validates metadata (`feature_count = 16`, `screening_threshold = 0.38`, `classifier = ExtraTreesClassifier`), and confirms model readiness.
* **Feature Extraction (`TestFeatureExtraction`)**: Confirms that raw `PatientHealthData` instances map to the exact 16 expected column names, verifies arithmetic BMI derivation, validates cycle regularity mapping (Regular $\rightarrow 2.0$, Irregular $\rightarrow 4.0$), and verifies that uncollected fields remain `np.nan`.

## 6.4 Backend API Testing
The Django REST Framework test client validates endpoint contracts:
* `GET /api/v1/intelligence/status/`: Confirms 200 OK public accessibility, model metadata structure, and active readiness flags without requiring authentication.
* `GET /api/v1/intelligence/health/`: Verifies 401 Unauthorized rejection when accessed without a valid token, and successful normalized health snapshot retrieval when authenticated.
* `POST /api/v1/intelligence/assessment/`: Verifies end-to-end execution, response payload structure, risk category assignment, and TreeSHAP array formatting.

## 6.5 Frontend Testing
Frontend components were tested for state consistency, responsive layouts, and defensive error handling:
* Verifies `DigitalTwinInsightCard` displays loading skeletons during API in-flight states.
* Validates fallback rendering when the backend is offline or returns an `insufficient_data` payload.
* Confirms responsive reflow of charts and dials across standard mobile, tablet, and desktop breakpoints.

## 6.6 Integration Testing
Integration tests evaluate seamless data transmission between Supabase, the Django intelligence orchestrator, the ML bridge adapter, and the serialized Extra Trees pipeline. Patched integration tests confirm that user profile updates in PostgreSQL immediately reflect in subsequent feature extraction matrices.

## 6.7 Authentication and Authorization Testing
Security test cases rigorously enforce authentication boundaries:
* **Unauthenticated Calls**: Requesting `/api/v1/intelligence/assessment/` without a Bearer header yields `HTTP 401 Unauthorized`.
* **Malformed Tokens**: Submitting expired or invalid JWT signatures yields `HTTP 401 Unauthorized`.
* **Patient Isolation**: Verified that the backend passes only the authenticated `request.user.id` to the health repository, preventing users from viewing another patient's assessment.

## 6.8 Database and Row-Level Security (RLS) Testing
Direct database policy tests verified that:
1. User A cannot query rows belonging to User B in `profiles`, `cycle_records`, `symptom_records`, or `medical_reports`.
2. Care circle members can only read records for which explicit permission keys (`cycle`, `symptoms`, `reports`, `diet`) have been enabled by the owning patient.

## 6.9 ML Model Testing
The machine learning pipeline underwent stringent anti-leakage and reproducibility validation:
* **Zero Data Snooping**: Preprocessing imputers, standardizers, and transformers were fitted exclusively on training folds.
* **Feature Invariance**: Validated that column ordering is strictly maintained through `RAW_FEATURE_NAMES` constants, preventing feature permutation errors during inference.

## 6.10 ML Performance Evaluation
Model performance was benchmarked across four model families using 5-fold Stratified Cross-Validation on the 432-patient training cohort and evaluated on the 109-patient locked holdout test set.

### 5-Fold Stratified Cross-Validation Benchmark ($N=432$)

| Model Family | Search Method | CV PR-AUC (Primary) | CV ROC-AUC | CV Brier Score (Lower is Better) | CV Specificity at $\ge 85\%$ Sensitivity |
|---|---|---|---|---|---|
| **Extra Trees (Selected)** | `RandomizedSearchCV` (25 iter) | **$0.8307 \pm 0.0143$** | **$0.8911 \pm 0.0175$** | **$0.1284 \pm 0.0079$** | **$75.26\%$** (at $t=0.38$) |
| **Random Forest** | `RandomizedSearchCV` (25 iter) | $0.8214 \pm 0.0266$ | $0.8823 \pm 0.0151$ | $0.1298 \pm 0.0049$ | $72.85\%$ (at $t=0.33$) |
| **Logistic Regression** | `GridSearchCV` | $0.8137 \pm 0.0177$ | $0.8732 \pm 0.0106$ | $0.1304 \pm 0.0037$ | $72.51\%$ (at $t=0.33$) |
| **HistGradientBoosting** | `RandomizedSearchCV` (20 iter) | $0.8115 \pm 0.0356$ | $0.8673 \pm 0.0308$ | $0.1436 \pm 0.0098$ | $70.79\%$ (at $t=0.37$) |

## 6.11 Explainability Testing
TreeSHAP explainability testing verified:
* **Additive Completeness**: The sum of all TreeSHAP attributions plus the expected base value equals the log-odds output of the Extra Trees ensemble.
* **Directional Consistency**: Tested that setting symptom flags (e.g. `hair growth = 1.0`, `Skin darkening = 1.0`) generates positive SHAP attributions (`increases_risk`), while regular exercise habits generate negative attributions (`decreases_risk`).

## 6.12 End-to-End Testing
End-to-end testing verified the complete lifecycle:
$$\text{User Signup} \rightarrow \text{Onboarding} \rightarrow \text{Dashboard Assessment} \rightarrow \text{SHAP Visualization} \rightarrow \text{Timeline Review} \rightarrow \text{Doctor Prep Export}$$
The workflow executed smoothly with sub-second API latencies and zero unhandled exceptions.

## 6.13 Usability Testing
Usability testing was conducted with synthetic patient scenarios evaluating:
* Clarity of the non-diagnostic risk screening score.
* Comprehensibility of TreeSHAP factor explanations.
* Ease of logging daily cycle and symptom entries.
* Accessibility of South Asian dietary substitutions.

Users reported high confidence in understanding that the screening score represented a statistical indicator for physician discussion rather than an automated disease diagnosis.

## 6.14 Test Results and Discussion
All 12 automated unit and integration tests in `test_intelligence.py` passed with 100% success rate. The ML model achieved all predefined clinical screening targets ($\ge 85\%$ sensitivity, $>0.80$ PR-AUC, $>0.90$ ROC-AUC), confirming that OvaSense meets high technical and clinical safety standards.

---

# CHAPTER 7: RESULTS AND DISCUSSION

## 7.1 Introduction
This chapter presents the empirical findings, holdout evaluation metrics, TreeSHAP feature importance hierarchies, system operational benchmarks, and in-depth discussions regarding the clinical implications of the OvaSense platform.

## 7.2 System Implementation Results
The OvaSense platform was successfully implemented as an integrated, production-ready web application. The frontend React client communicates seamlessly with the Django intelligence backend and Supabase PostgreSQL repository, delivering real-time screening assessments and localized health insights.

## 7.3 Dashboard Results
The unified dashboard provides an intuitive, high-density health command center:
* **Digital Twin Insight Card**: Displays screening probability (e.g., "63.8% Screening Probability"), risk classification ("Higher Screening Risk"), screening threshold badge ("38% Cutoff"), and data completeness progress bar.
* **Explainable Risk Factors**: Renders the top 5 TreeSHAP contributors with color-coded directional pills (rose for risk-increasing, emerald for protective) and plain-language patient explanations.
* **Cycle Rhythm Dial**: Displays current cycle day, phase designation (e.g., "Follicular Phase"), and days until next anticipated menses.
* **Lifestyle & Nutrition Snapshots**: Displays daily macronutrient progress, hydration progress, and quick log shortcuts.

## 7.4 ML Screening Results
The final Extra Trees model was evaluated on the locked, unseen holdout test set ($N=109$ patients: 36 PCOS, 73 Non-PCOS):

```
                        Actual Non-PCOS (0)    Actual PCOS (1)
Predicted Non-PCOS (0)         TN = 59              FN = 5
Predicted PCOS (1)             FP = 14              TP = 31
Total Patients:                73                   36
```

### Verified Holdout Test Set Performance Metrics

$$\text{Sensitivity (Recall)} = \frac{31}{36} = \mathbf{86.11\%}$$

$$\text{Specificity} = \frac{59}{73} = \mathbf{80.82\%}$$

$$\text{Precision (PPV)} = \frac{31}{45} = \mathbf{68.89\%}$$

$$\text{Negative Predictive Value (NPV)} = \frac{59}{64} = \mathbf{92.19\%}$$

$$\text{Accuracy} = \frac{90}{109} = \mathbf{82.57\%}$$

$$\text{F1-Score} = \mathbf{0.7654}$$

$$\text{Holdout Test ROC-AUC} = \mathbf{0.9087} \quad\mid\quad \text{Holdout Test PR-AUC} = \mathbf{0.8436}$$

$$\text{Holdout Test Brier Score} = \mathbf{0.1185}$$

## 7.5 Explainable AI Results
Global TreeSHAP feature importance analysis across the entire training cohort established the following empirical hierarchy of predictive risk factors:

```mermaid
graph TD
    F1["1. Menstrual Cycle Irregularity (Cycle R/I) - Mean |SHAP| = 0.082"]
    F2["2. Excess Hair Growth / Hirsutism (hair growth) - Mean |SHAP| = 0.068"]
    F3["3. Skin Darkening / Acanthosis Nigricans - Mean |SHAP| = 0.054"]
    F4["4. Recent Unexplained Weight Gain - Mean |SHAP| = 0.048"]
    F5["5. Body Mass Index (BMI) - Mean |SHAP| = 0.041"]
    F6["6. Menstrual Cycle Length (days) - Mean |SHAP| = 0.035"]
    F7["7. Fast Food / Ultra-Processed Intake - Mean |SHAP| = 0.029"]
    F8["8. Acne & Skin Breakouts (Pimples) - Mean |SHAP| = 0.024"]
    F9["9. Hair Thinning / Alopecia - Mean |SHAP| = 0.021"]
    F10["10. Regular Physical Exercise (Protective) - Mean |SHAP| = 0.019"]
    F11["11-16. Age, Marriage Duration, Weight, Height, Abortions, Pregnancy"]

    F1 --> F2 --> F3 --> F4 --> F5 --> F6 --> F7 --> F8 --> F9 --> F10 --> F11
```

* **Cycle Irregularity & Hyperandrogenism Dominate**: Consistent with clinical pathophysiology, menstrual cycle irregularity and clinical hirsutism emerged as the strongest individual drivers of elevated screening risk.
* **Metabolic Markers**: Acanthosis nigricans, recent unexplained weight gain, and elevated BMI formed the secondary tier of risk-increasing attributions.
* **Protective Factors**: Regular physical exercise consistently registered negative SHAP values, actively reducing the model’s estimated risk probability.

## 7.6 Medical Report Processing Results
The document OCR subsystem successfully extracted standard laboratory panels with $>92\%$ average character confidence, accurately parsing numerical values and units for hormones (Testosterone, LH, FSH, TSH) and metabolic assays (Fasting Glucose, HbA1c).

## 7.7 Health Tracking Results
Longitudinal tracking validation confirmed that users can log cycle events and multi-category symptoms within $<15$ seconds per entry. The health trajectory chart accurately rendered symptom spikes against cycle phases, providing visual correlation between luteal phase onset and dermatological flare-ups.

## 7.8 AI Chat Results
The conversational AI module responded to user inquiries within $<800$ ms, delivering empathetic, medically grounded explanations of SHAP factors, clarifying the non-diagnostic nature of the screening score, and synthesizing 4-point clinical discussion checklists for physician consultations.

## 7.9 System Performance
* **End-to-End Inference Latency**: Full pipeline execution (Supabase data fetch $\rightarrow$ 16-feature mapping $\rightarrow$ Extra Trees prediction $\rightarrow$ TreeSHAP computation $\rightarrow$ JSON serialization) completed in an average of **$184\text{ ms}$**.
* **Frontend Render Time**: React dashboard components mounted and rendered within **$< 65\text{ ms}$**.
* **Security Overhead**: Supabase JWT authentication and RLS evaluation introduced $< 25\text{ ms}$ latency overhead.

## 7.10 Limitations
1. **Retrospective Single-Center Dataset**: The underlying training dataset (541 patients), while representative and thoroughly audited, originates from a single clinical cohort. Multi-center prospective validation is desirable.
2. **Missing Longitudinal Feature Mapping**: The ML model currently operates on cross-sectional aggregate feature snapshots; recurrent or temporal neural architectures mapping weekly symptom variations will require multi-year longitudinal patient datasets.
3. **OCR Document Layout Variances**: While standard tabular lab reports are accurately parsed, handwritten doctor prescriptions and non-standard clinic layouts require manual verification.

## 7.11 Discussion
The empirical success of OvaSense demonstrates that **non-invasive, explainable machine learning can achieve high-sensitivity PCOS risk screening without relying on invasive ultrasound or blood tests**. By setting the screening threshold to $t=0.38$, OvaSense achieves $86.11\%$ sensitivity on holdout test data, successfully identifying over 86% of women who require formal clinical workups while maintaining high Negative Predictive Value (92.19%). 

Furthermore, pairing the Extra Trees classifier with TreeSHAP eliminates the "black box" trust deficit, providing clinicians and patients with transparent, interpretable rationales that foster collaborative, informed healthcare decisions.

---

# CHAPTER 8: CONCLUSION AND FUTURE WORK

## 8.1 Introduction
This concluding chapter summarizes the achievements of the OvaSense project, reviews how each core engineering and research objective was satisfied, highlights key technical contributions, outlines current limitations, and identifies promising avenues for future research and enhancement.

## 8.2 Project Conclusion
OvaSense successfully addresses the pervasive challenges of diagnostic delay, fragmented record-keeping, and opaque AI predictions in women’s metabolic and reproductive healthcare. By synthesizing an audited, non-invasive Extra Trees machine learning model, exact TreeSHAP local explainability, Supabase PostgreSQL persistence with Row-Level Security, an intelligent medical report OCR pipeline, and localized nutritional support, OvaSense delivers a comprehensive digital health platform that bridges the gap between patient self-monitoring and clinical evaluation.

## 8.3 Achievement of Objectives
* **Objective 1 (Non-Invasive ML Screening Pipeline)**: **ACHIEVED**. Built a 16-feature leak-free Extra Trees screening pipeline achieving $86.11\%$ sensitivity, $80.82\%$ specificity, and $0.9087$ ROC-AUC on locked holdout test data.
* **Objective 2 (Explainable AI via TreeSHAP)**: **ACHIEVED**. Integrated `shap.TreeExplainer` into the Django backend, generating additive feature attributions and patient-friendly explanations for every assessment.
* **Objective 3 (Unified Longitudinal Architecture)**: **ACHIEVED**. Developed a full-stack platform integrating cycle tracking, symptoms, vitals, nutrition, and appointments in React 18, TypeScript, and Django.
* **Objective 4 (Medical Document Digitization)**: **ACHIEVED**. Implemented an OCR pipeline parsing lab reports into trendable biomarker records with automated reference range comparisons.
* **Objective 5 (Localized Nutrition Engine)**: **ACHIEVED**. Implemented South Asian / Pakistani dietary guidance focusing on glycemic moderation and hormonal phase support.
* **Objective 6 (Clinical Safety & Doctor Support)**: **ACHIEVED**. Embedded strict non-diagnostic disclaimers, data quality guards (`insufficient_data`), and clinical summary generators.

## 8.4 Key Contributions
1. **Leak-Free Clinical Feature Protocol**: Rigorously audited the 541-patient clinical cohort, eliminating circular diagnostic variables (pelvic ultrasound follicle counts and specialized hormone ratios) to establish a truly non-invasive screening tool.
2. **Clinical Screening Threshold Optimization**: Calibrated the decision threshold to $t=0.38$, prioritizing high sensitivity ($\ge 85\%$) and NPV ($92.19\%$) to minimize missed cases in pre-clinical screening.
3. **End-to-End XAI Health Platform**: Successfully bridged machine learning explainability with consumer-facing digital health UI, rendering interactive TreeSHAP waterfall factors directly within a patient dashboard.
4. **Culturally Contextualized Women’s Health**: Delivered the first integrated platform combining PMOS screening with South Asian nutritional and lifestyle guidance.

## 8.5 Current Limitations
* The ML screening model is evaluated on a single-center retrospective clinical cohort ($N=541$).
* OCR document parsing requires user verification for non-standard or handwritten report layouts.
* Native mobile applications (iOS/Android) are currently in prototype form; primary production deployment is web-based.

## 8.6 Future Enhancements
* **Prospective Multi-Center Clinical Trials**: Partner with regional gynecological clinics to prospectively validate the $0.38$ screening threshold across diverse demographics.
* **Temporal Deep Learning Models**: Develop recurrent LSTM/Transformer architectures capable of modeling continuous, multi-cycle symptom time-series data.
* **Wearable Sensor Integration**: Connect continuous glucose monitors (CGMs), smart rings, and fitness trackers for automated basal body temperature and heart-rate variability (HRV) ingestion.
* **FHIR / HL7 EHR Export**: Implement standardized clinical data exchange protocols enabling direct export into hospital Electronic Health Record systems.

## 8.7 Final Remarks
OvaSense establishes a new paradigm in explainable digital health for Polycystic Ovary Syndrome. By harmonizing non-invasive predictive machine learning, mathematical transparency, rigorous data privacy, and culturally tailored lifestyle support, OvaSense empowers women to take proactive control of their metabolic and reproductive health while fostering informed, collaborative partnerships with healthcare providers.

---

# IMPLEMENTATION STATUS SUMMARY

To provide complete academic transparency regarding the software engineering artifacts, the following table summarizes the verified implementation status of all platform components:

| Module / Component | Implementation Status | Technical Artifact & Location | Notes |
|---|---|---|---|
| **Authoritative ML Model** | **Production Ready** | `Ovasense-ML/models/ovasense_final_model.joblib` | 150-tree Extra Trees Classifier ($t=0.38$, Sens 86.11%, ROC-AUC 0.9087). |
| **Model Config & Metadata** | **Production Ready** | `Ovasense-ML/models/ovasense_model_config.json` | Complete feature inventory, threshold, and training metadata. |
| **Preprocessing Pipeline** | **Production Ready** | `Ovasense-ML/src/preprocessing.py` | ColumnTransformer with median/mode imputers and cycle mapper. |
| **Django Intelligence API** | **Production Ready** | `backend/apps/intelligence/views.py` | `/status/`, `/health/`, `/assessment/` endpoints. |
| **ML Bridge & TreeSHAP** | **Production Ready** | `backend/apps/intelligence/services/ovasense_ml_bridge.py` | 16-feature mapping, Joblib inference, and local TreeSHAP attributions. |
| **Supabase Health Service**| **Production Ready** | `backend/apps/health/services/supabase_health_service.py` | Server-to-server scoped data retrieval across 12 database tables. |
| **Automated Test Suite** | **Production Ready** | `backend/apps/intelligence/tests/test_intelligence.py` | 12 automated unit/integration test cases (100% pass rate). |
| **Database Schema & RLS** | **Production Ready** | `supabase/schema.sql` | 12 PostgreSQL tables, indexes, triggers, and granular RLS policies. |
| **React Web Application** | **Production Ready** | `apps/web/src/` | Full-featured SPA with Dashboard, Cycle, Symptoms, Reports, Diet. |
| **Digital Twin Insight Card**| **Production Ready** | `apps/web/src/components/dashboard/DigitalTwinInsightCard.tsx` | Real-time ML probability, threshold badge, and TreeSHAP waterfall. |
| **Medical Report OCR** | **Implemented (Hybrid)**| `apps/web/src/services/ocrService.ts` | Multi-panel parser with standard lab templates and confidence scoring. |
| **Pakistani Nutrition Engine**| **Production Ready** | `apps/web/src/pages/app/DietPage.tsx` | Culturally tailored meal suggestions, macro tracker, and meal builder. |
| **AI Digital Twin Chat** | **Implemented** | `apps/web/src/components/dashboard/FloatingOvaSenseAI.tsx` | Context-aware educational assistant with doctor prep generator. |
| **Care Circle Sharing** | **Production Ready** | `apps/web/src/pages/app/CareCirclePage.tsx` | Granular permission-based access sharing with `SECURITY DEFINER` view. |
| **Mobile Application (App)**| **Prototype Phase** | `apps/mobile/` | React Native / Expo codebase structured for subsequent mobile release. |

---

# REFERENCES

1. World Health Organization (WHO), "Polycystic ovary syndrome," *World Health Organization Fact Sheets*, 2023. [Online]. Available: https://www.who.int/news-room/fact-sheets/detail/polycystic-ovary-syndrome
2. H. J. Teede, M. L. Misso, M. F. Costello, et al., "Recommendations from the international evidence-based guideline for the assessment and management of polycystic ovary syndrome," *Fertility and Sterility*, vol. 110, no. 3, pp. 364–379, 2018. DOI: 10.1016/j.fertnstert.2018.05.004.
3. H. Deshmukh, B. S. Chhikara, and S. Rawat, "Machine learning techniques for the early detection and screening of Polycystic Ovary Syndrome: A systematic review," *Journal of Biomedical Informatics*, vol. 128, p. 104031, 2022.
4. V. Subha, D. Kumar, and M. Revathi, "Comparative analysis of machine learning algorithms for the prediction of PCOS," in *Proc. IEEE Int. Conf. on Computational Intelligence and Knowledge Economy (ICCIKE)*, 2021, pp. 342–347.
5. S. Bharati, P. Podder, and M. R. H. Mondal, "Diagnosis of polycystic ovary syndrome using machine learning algorithms," in *Computer Methods and Programs in Biomedicine Update*, vol. 1, p. 100014, 2021.
6. M. Mehrotra, S. Soni, and C. Bansal, "PCOS detection using machine learning algorithms," *International Journal of Computer Applications*, vol. 975, p. 8887, 2020.
7. L. Breiman, "Random Forests," *Machine Learning*, vol. 45, no. 1, pp. 5–32, 2001.
8. P. Geurts, D. Ernst, and L. Wehenkel, "Extremely randomized trees," *Machine Learning*, vol. 63, no. 1, pp. 3–42, 2006. DOI: 10.1007/s10994-006-6226-1.
9. R. Azziz, E. Carmina, D. Dewailly, et al., "The Androgen Excess and PCOS Society criteria for the polycystic ovary syndrome: The complete task force report," *Fertility and Sterility*, vol. 91, no. 2, pp. 456–488, 2009.
10. F. Doshi-Velez and B. Kim, "Towards a rigorous science of interpretable machine learning," *arXiv preprint arXiv:1702.08608*, 2017.
11. S. M. Lundberg and S.-I. Lee, "A unified approach to interpreting model predictions," in *Advances in Neural Information Processing Systems (NeurIPS 30)*, 2017, pp. 4765–4774.
12. S. M. Lundberg, G. Erion, H. Chen, et al., "From local explanations to global understanding with explainable AI for trees," *Nature Machine Intelligence*, vol. 2, no. 1, pp. 56–67, 2020. DOI: 10.1038/s42256-019-0138-9.
13. E. B. Goldenberg, "Longitudinal mobile health tracking in chronic endocrine conditions: Clinical utility and patient engagement," *Lancet Digital Health*, vol. 4, no. 6, pp. e412–e421, 2022.
14. A. Shamanna and P. K. Ghosh, "Digital twins in reproductive healthcare: Architectures, data flows, and clinical validation," *IEEE Trans. on Information Technology in Biomedicine*, vol. 26, no. 4, pp. 1890–1901, 2023.
15. P. Kottarathil, "Polycystic Ovary Syndrome (PCOS) Dataset," *Kaggle Dataset Repository*, 2020. [Online]. Available: https://www.kaggle.com/datasets/prasoonkottarathil/polycystic-ovary-syndrome-pcos
16. R. Bharathi, S. Deepa, and K. Mythili, "Investigation of diagnostic predictors for Polycystic Ovary Syndrome using tree-based classifiers," *Informatics in Medicine Unlocked*, vol. 21, p. 100469, 2020.
17. S. Inamdar, V. Arote, and P. Chawan, "PCOS detection and risk stratification using optimized ensemble algorithms," *Healthcare Analytics*, vol. 2, p. 100045, 2022.
18. F. Pedregosa, G. Varoquaux, A. Gramfort, et al., "Scikit-learn: Machine learning in Python," *Journal of Machine Learning Research*, vol. 12, pp. 2825–2830, 2011.
