# Graph Report - erd-client  (2026-08-30)

## Corpus Check
- 100 files · ~62,965 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 684 nodes · 1482 edges · 28 communities (19 shown, 5 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 94 edges (avg confidence: 0.83)
- Token cost: 22,000 input · 9,000 output

## Community Hubs (Navigation)
- Authentication & Session Flow
- Schema Editing & SQL Validation
- Project & Team Management
- Diagram Test Harness & STOMP Setup
- Collaboration Locking & Permissions
- Test Tooling Dependencies
- Sidebar Navigation & Branding
- Angular Runtime Dependencies
- GoJS Rendering & Templates
- Diagram Styling & Status Display
- Docker Stack & App Bootstrap
- Angular CLI Project Config
- Angular Build Options
- Angular Architect Targets
- SQL DDL Import & Export
- Diagram Initialization & Loading
- Entity Lock Visualization
- Production Build Configuration
- Development Build Configuration
- Relationship Creation Flow
- Entry Point File References
- Bootstrap Styling Assets
- Karma Test Bootstrap
- Production Environment Config

## God Nodes (most connected - your core abstractions)
1. `DiagramComponent` - 85 edges
2. `StorageService` - 39 edges
3. `ProjectModalComponent` - 37 edges
4. `EntityModel` - 35 edges
5. `SideBarComponent` - 29 edges
6. `DataType` - 29 edges
7. `ProjectService` - 26 edges
8. `AuthService` - 24 edges
9. `DiagramRenderHost` - 23 edges
10. `Project` - 21 edges

## Surprising Connections (you probably didn't know these)
- `SockJS/StompJS Realtime Transport` --conceptually_related_to--> `StompClientFactory`  [INFERRED]
  README.md → src/app/diagram/stomp-client.factory.ts
- `GoJS Interactive Diagramming` --conceptually_related_to--> `DiagramRendererService`  [INFERRED]
  README.md → src/app/diagram/diagram-renderer.service.ts
- `Three-Table ER Motif` --semantically_similar_to--> `IntermediaryEntityModel`  [INFERRED] [semantically similar]
  src/assets/logo-erd-studio.png → src/app/model/intermediary-entity.model.ts
- `erd-core Backend Container` --conceptually_related_to--> `environment`  [INFERRED]
  docker-compose.yml → src/environments/environment.ts
- `ERD Studio Logo Wordmark` --references--> `ERD Client Web Application`  [INFERRED]
  src/assets/logo-erd-studio.png → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Realtime Collaboration & Entity Locking Flow** — src_app_diagram_diagram_component_html_collaboration_status, src_app_diagram_diagram_component_html_entity_lock_indicator, src_app_service_collaboration_service_collaborationservice_lockentity, src_app_service_collaboration_service_collaborationservice_unlockentity, src_app_diagram_diagram_component_diagramcomponent_subscribetoprojecttopics, src_app_diagram_diagram_component_diagramcomponent_receivemessageandremakediagram, src_app_diagram_stomp_client_factory_stompclientfactory [INFERRED 0.85]
- **Role-Based Permission Model (OWNER/EDITOR/VIEWER)** — src_app_component_modal_project_project_modal_component_html_role_badge, src_app_diagram_diagram_component_html_role_gated_toolbar, src_app_component_side_bar_side_bar_component_html_owner_only_delete, src_app_service_collaboration_service_collaborationservice_getcurrentuserrole, src_app_service_collaboration_service_collaborationservice_caneditdiagram, src_app_guards_project_guard_projectguard_canactivate [INFERRED 0.85]
- **SQL DDL Import/Export Round Trip** — src_app_diagram_diagram_component_html_ddl_file_input, src_app_diagram_diagram_component_diagramcomponent_exportddl, src_app_diagram_diagram_component_diagramcomponent_importddl, src_app_service_ddl_service_ddlservice_exportddl, src_app_service_ddl_service_ddlservice_importddl, src_app_service_sql_validation_service_sqlvalidationservice_validatediagram [INFERRED 0.85]

## Communities (28 total, 5 thin omitted)

### Community 0 - "Authentication & Session Flow"
Cohesion: 0.05
Nodes (36): JWT Secret & Cookie Configuration, AppComponent, Sidebar / Router Shell Layout, Component, AppRoutingModule, routes, NgModule, Sign In Form (+28 more)

### Community 1 - "Schema Editing & SQL Validation"
Cohesion: 0.05
Nodes (38): EntityEditFormComponent, Attribute Definition Grid, PK/UN/NN/AI Constraint Toggles, Component, Input, Output, Column Definition Grid, TableEditorComponent (+30 more)

### Community 2 - "Project & Team Management"
Cohesion: 0.06
Nodes (25): Role Badge (OWNER/EDITOR/VIEWER), Team Member Management UI, ProjectModalComponent, Component, Input, Output, ProjectGuard, Injectable (+17 more)

### Community 3 - "Diagram Test Harness & STOMP Setup"
Cohesion: 0.05
Nodes (32): allowedCommonJsDependencies, allowedCommonJsDependencies, sockjs-client, @stomp/stompjs, asOwnerEditing(), withDiagram(), StompClientFactory, Injectable (+24 more)

### Community 4 - "Collaboration Locking & Permissions"
Cohesion: 0.07
Nodes (18): Role-Gated Editing Toolbar, AuthResponseModel, LinkDataModel, CollaborationMessage, CollaborationService, EntityLock, httpOptions, Injectable (+10 more)

### Community 5 - "Test Tooling Dependencies"
Cohesion: 0.05
Nodes (36): @angular/compiler-cli, @angular-devkit/build-angular, jasmine-core, karma, karma-chrome-launcher, karma-coverage, karma-jasmine, karma-jasmine-html-reporter (+28 more)

### Community 6 - "Sidebar Navigation & Branding"
Cohesion: 0.08
Nodes (12): Owner-Only Project Delete, Project Navigator Sidebar, SideBarComponent, Component, Output, UserResponse, SharedService, Injectable (+4 more)

### Community 7 - "Angular Runtime Dependencies"
Cohesion: 0.06
Nodes (35): @angular/animations, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/platform-browser-dynamic, @angular/router (+27 more)

### Community 8 - "GoJS Rendering & Templates"
Cohesion: 0.13
Nodes (4): DiagramRendererService, DiagramRenderHost, LockVisual, Injectable

### Community 9 - "Diagram Styling & Status Display"
Cohesion: 0.09
Nodes (6): DiagramComponent, Collaboration Status Bar, Data Type Colour Legend, Component, Input, ViewChild

### Community 10 - "Docker Stack & App Bootstrap"
Cohesion: 0.12
Nodes (16): Dual Datastore Split (Postgres + Mongo), erd-client Frontend Container, erd-core Backend Container, MongoDB Service, PostgreSQL Service, Angular Build CI Workflow, Coverage Regression Gate, strictTemplates Enforcement Gate (+8 more)

### Community 11 - "Angular CLI Project Config"
Cohesion: 0.15
Nodes (12): analytics, prefix, projectType, root, schematics, sourceRoot, cli, newProjectRoot (+4 more)

### Community 13 - "Angular Build Options"
Cohesion: 0.23
Nodes (12): options, assets, index, karmaConfig, main, outputPath, polyfills, scripts (+4 more)

### Community 14 - "Angular Architect Targets"
Cohesion: 0.18
Nodes (11): build, extract-i18n, test, builder, configurations, defaultConfiguration, architect, builder (+3 more)

### Community 15 - "SQL DDL Import & Export"
Cohesion: 0.24
Nodes (3): Hidden SQL File Input, DdlService, Injectable

### Community 19 - "Production Build Configuration"
Cohesion: 0.22
Nodes (9): serve, production, browserTarget, budgets, fileReplacements, outputHashing, builder, configurations (+1 more)

### Community 20 - "Development Build Configuration"
Cohesion: 0.25
Nodes (8): development, browserTarget, buildOptimizer, extractLicenses, namedChunks, optimization, sourceMap, vendorChunk

### Community 22 - "Entry Point File References"
Cohesion: 0.29
Nodes (7): codeCoverageExclude, src/app/diagram/diagram-renderer.service.ts, src/app/diagram/stomp-client.factory.ts, src/environments/environment.prod.ts, src/main.ts, src/polyfills.ts, src/testing/**/*.ts

### Community 24 - "Bootstrap Styling Assets"
Cohesion: 0.50
Nodes (4): styles, node_modules/bootstrap/dist/css/bootstrap.min.css, node_modules/bootstrap-icons/font/bootstrap-icons.css, src/styles.css

## Knowledge Gaps
- **101 isolated node(s):** `$schema`, `version`, `newProjectRoot`, `projectType`, `schematics` (+96 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 214 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiagramComponent` connect `Diagram Styling & Status Display` to `Authentication & Session Flow`, `Schema Editing & SQL Validation`, `Project & Team Management`, `Diagram Test Harness & STOMP Setup`, `Collaboration Locking & Permissions`, `GoJS Rendering & Templates`, `Relationship Removal & FK Cleanup`, `SQL DDL Import & Export`, `Diagram Initialization & Loading`, `Entity Lock Visualization`, `Realtime Sync Over STOMP`, `Relationship Creation Flow`, `Entity Lock Acquisition`?**
  _High betweenness centrality (0.199) - this node is a cross-community bridge._
- **Why does `@stomp/stompjs` connect `Diagram Test Harness & STOMP Setup` to `Collaboration Locking & Permissions`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **Why does `configurations` connect `Angular Architect Targets` to `Production Build Configuration`, `Development Build Configuration`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `$schema`, `version`, `newProjectRoot` to the rest of the system?**
  _101 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication & Session Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.052277227722772275 - nodes in this community are weakly interconnected._
- **Should `Schema Editing & SQL Validation` be split into smaller, more focused modules?**
  _Cohesion score 0.054061624649859946 - nodes in this community are weakly interconnected._
- **Should `Project & Team Management` be split into smaller, more focused modules?**
  _Cohesion score 0.05995975855130785 - nodes in this community are weakly interconnected._